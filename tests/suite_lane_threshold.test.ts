// The lane rule, measured: no test file outside CI_LONG_SUITES may weigh more than
// LANE_THRESHOLD_MS in the shard weight table (scripts/ci_shard_weights.generated.json,
// per-file ms inside a full-mode CI shard, harvested from green CI or carried locally
// between harvests). tests/suite_duration_budget.test.ts rations DECLARED timeouts;
// this is the MEASURED half. A file over the line either leaves the shard pool for the
// long-sims lane (a CI_LONG_SUITES entry), gets split or made cheaper and its row
// re-measured (the carry tool's --supersede, with the reason), or the threshold moves as
// a maintainer decision in scripts/lib/ci_shard_plan.mjs, never here. A carried row is
// a local measurement standing in for the harvest's (a file the harvest did not see, or
// a superseded row), not CI ms, so ciTimeWeight scales it by CARRIED_LOCAL_TO_CI_RATIO
// into CI time before it is judged; a harvested row is judged as measured.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MEASURED_WEIGHTS } from '../scripts/ci_shard_partition.mjs';
import {
  CARRIED_LOCAL_TO_CI_RATIO,
  CI_LONG_SUITES,
  ciTimeWeight,
  LANE_POOL_CEILING_MS,
  LANE_THRESHOLD_MS,
  laneThresholdOver,
  poolWeights,
  RATCHET_HEADROOM,
  RATCHET_SLACK,
  ratchetProblems,
  SHARD_POOL_CEILING_MS,
} from '../scripts/lib/ci_shard_plan.mjs';
import { walkShardTestFiles } from '../scripts/lib/ci_shard_walk.mjs';
import { carriedRows } from '../scripts/lib/ci_shard_weight_carry.mjs';

const CARRIED = carriedRows(
  JSON.parse(
    readFileSync(new URL('../scripts/ci_shard_weights.generated.json', import.meta.url), 'utf8'),
  ),
);

describe('the lane threshold over the measured shard weights', () => {
  it('keeps every file outside the lane under the threshold', () => {
    const over = laneThresholdOver(MEASURED_WEIGHTS, CARRIED, CI_LONG_SUITES);
    expect(
      over,
      'a suite outside CI_LONG_SUITES weighs more than LANE_THRESHOLD_MS: lane it, split it, or ' +
        're-measure it after a split (ci_shard_weights_harvest --carry-local --supersede)',
    ).toEqual([]);
  });

  it('sees heavy files at all (the table keeps its heavy rows and every lane row)', () => {
    // Positive control: if the table lost its heavy rows (a shrunken harvest), the check
    // above would pass vacuously. Since the lane's balance probes boot production's idle
    // cull (2026-09-29) no row is over the threshold itself, so the control counts rows over
    // a quarter of it (23 at the 2026-09-29 harvest) and requires a row for every lane file.
    const heavy = Object.values(MEASURED_WEIGHTS).filter((ms) => ms > LANE_THRESHOLD_MS / 4);
    expect(heavy.length).toBeGreaterThanOrEqual(20);
    expect(CI_LONG_SUITES.filter((file) => MEASURED_WEIGHTS[file] === undefined)).toEqual([]);
  });

  it('judges every carried row in CI time, and a harvested row as measured', () => {
    // Over a synthetic carried map, so the pin holds whether or not the committed table
    // carries anything (a complete harvest empties it): each carried method is scaled,
    // a row with no carried entry is judged as measured.
    expect(CARRIED_LOCAL_TO_CI_RATIO).toBe(4);
    expect(ciTimeWeight(20_000, { method: 'local-median' })).toBe(80_000);
    expect(ciTimeWeight(20_000, { method: 'prose-backfill' })).toBe(80_000);
    expect(ciTimeWeight(20_000, { method: 'some-future-method' })).toBe(80_000);
    expect(ciTimeWeight(20_000, undefined)).toBe(20_000);
    // A local 23 s row is over the line in CI time though under it as recorded.
    expect(ciTimeWeight(23_000, { method: 'local-median' })).toBeGreaterThan(LANE_THRESHOLD_MS);
  });

  it('judges a table through the CI-time weight, outside the lane only', () => {
    // The judgment the live case runs, over a synthetic table: a carried 23 s row is
    // over (92 s in CI time), a harvested 23 s row is not, a harvested 95 s row is, a
    // lane file is never judged however heavy, and a row exactly at the line (90 s, or a
    // carried 22.5 s) is not over while one a millisecond past it is: the rule is
    // strictly more than LANE_THRESHOLD_MS.
    expect(
      laneThresholdOver(
        {
          'tests/carried.test.ts': 23_000,
          'tests/carried_at_line.test.ts': 22_500,
          'tests/harvested.test.ts': 23_000,
          'tests/harvested_at_line.test.ts': 90_000,
          'tests/harvested_past_line.test.ts': 90_001,
          'tests/heavy.test.ts': 95_000,
          'tests/lane.test.ts': 900_000,
        },
        {
          // A superseding row is a carried row too, and is scaled like any other.
          'tests/carried.test.ts': { method: 'local-median', supersedes: 100_000 },
          'tests/carried_at_line.test.ts': { method: 'local-median' },
        },
        ['tests/lane.test.ts'],
      ),
    ).toEqual([
      'tests/carried.test.ts 92000 ms',
      'tests/harvested_past_line.test.ts 90001 ms',
      'tests/heavy.test.ts 95000 ms',
    ]);
  });
});

// The total-CI-time ratchet (scripts/lib/ci_shard_plan.mjs, beside the lane rule): the summed
// CI-time weight of the shard pool and of the lane may not pass their ceilings, and a ceiling
// left well above its pool after a cut is stale and must come down.
describe('the total CI time ratchet over the measured weights', () => {
  it('holds the shard pool and the lane under their ceilings, neither ceiling stale', () => {
    const pools = poolWeights(MEASURED_WEIGHTS, CARRIED, CI_LONG_SUITES);
    expect(
      ratchetProblems(pools, { shard: SHARD_POOL_CEILING_MS, lane: LANE_POOL_CEILING_MS }),
      'a weight row grew a pool past its ceiling (make the file cheaper, cut what it ' +
        'duplicates, or raise the ceiling as a maintainer decision), or a pool shrank and its ' +
        'ceiling must come down',
    ).toEqual([]);
    // Non-vacuous: both pools are real sums (a shrunken table would pass under any ceiling).
    expect(pools.shard).toBeGreaterThan(SHARD_POOL_CEILING_MS / (1 + RATCHET_SLACK));
    expect(pools.lane).toBeGreaterThan(0);
  });

  it('sums pools through the CI-time weight and judges both directions', () => {
    const pools = poolWeights(
      {
        'tests/a.test.ts': 10_000,
        'tests/carried.test.ts': 1_000,
        'tests/lane.test.ts': 50_000,
      },
      { 'tests/carried.test.ts': { method: 'local-median' } },
      ['tests/lane.test.ts'],
    );
    expect(pools).toEqual({ shard: 14_000, lane: 50_000 });
    expect(ratchetProblems(pools, { shard: 14_000, lane: 50_000 })).toEqual([]);
    expect(ratchetProblems(pools, { shard: 13_999, lane: 50_000 })).toEqual([
      'shard pool 14000 ms is over its ceiling 13999 ms',
    ]);
    // Stale: more than RATCHET_SLACK above the pool; exactly at the slack still holds.
    expect(ratchetProblems(pools, { shard: 14_000, lane: 50_000 * (1 + RATCHET_SLACK) })).toEqual(
      [],
    );
    expect(
      ratchetProblems(pools, { shard: 14_000, lane: 50_000 * (1 + RATCHET_SLACK) + 1 }),
    ).toEqual([
      `lane ceiling ${50_000 * (1 + RATCHET_SLACK) + 1} ms is stale over its pool 50000 ms: ` +
        `lower it to about ${Math.ceil(50_000 * (1 + RATCHET_HEADROOM))} ms`,
    ]);
  });
});

// The admission rule (tests/CLAUDE.md, "Test cost"): a test file the harvest has not measured
// (no row in the weight table, or a carried row standing in for one) says in its leading
// comment what it uniquely guards and what it costs, on lines carrying `Guards:` and `Cost:`.
// Once a harvest measures it, the ratchet above carries its weight. The files checked are the
// table's own population (scripts/lib/ci_shard_walk.mjs: every .test.ts outside the browser
// suite); the browser suite and the few .test.mjs suites owe the statement too but sit outside
// the table, so nothing here can tell a new one from an old one.
const ADMISSION_MARKERS = ['Guards:', 'Cost:'] as const;

function leadingComment(source: string): string {
  const lines: string[] = [];
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' && lines.length === 0) continue;
    if (/^(\/\/|\/\*|\*)/.test(trimmed)) lines.push(trimmed);
    else break;
  }
  return lines.join('\n');
}

function admissionProblems(
  files: readonly { key: string; source: string }[],
  weights: Readonly<Record<string, number>>,
  carried: Readonly<Record<string, object>>,
): string[] {
  const problems: string[] = [];
  for (const { key, source } of files) {
    const measured = Object.hasOwn(weights, key) && !Object.hasOwn(carried, key);
    if (measured) continue;
    const header = leadingComment(source);
    const missing = ADMISSION_MARKERS.filter((marker) => !header.includes(marker));
    if (missing.length > 0) problems.push(`${key}: its leading comment lacks ${missing.join(' ')}`);
  }
  return problems;
}

describe('the new-test admission rule', () => {
  it('asks every test file the harvest has not measured for its Guards: and Cost: lines', () => {
    const files = walkShardTestFiles(new URL('..', import.meta.url).pathname).map((key) => ({
      key,
      source: readFileSync(new URL(`../${key}`, import.meta.url), 'utf8'),
    }));
    // Non-vacuous: the walk sees the whole suite.
    expect(files.length).toBeGreaterThan(4_000);
    expect(
      admissionProblems(files, MEASURED_WEIGHTS, CARRIED),
      'a new test file states what it uniquely guards and its measured cost (tests/CLAUDE.md, ' +
        '"Test cost")',
    ).toEqual([]);
  });

  it('reads the markers from the leading comment only, and skips measured files', () => {
    const stated = '// Guards: the thing.\n// Cost: 0.2 s locally.\nimport x from "y";\n';
    const buried = 'import x from "y";\n// Guards: the thing.\n// Cost: 0.2 s.\n';
    const half = '/**\n * Guards: the thing.\n */\nimport x from "y";\n';
    expect(
      admissionProblems(
        [
          { key: 'tests/new_stated.test.ts', source: stated },
          { key: 'tests/new_buried.test.ts', source: buried },
          { key: 'tests/new_half.test.ts', source: half },
          { key: 'tests/measured.test.ts', source: buried },
          { key: 'tests/carried.test.ts', source: buried },
        ],
        { 'tests/measured.test.ts': 1_000, 'tests/carried.test.ts': 1_000 },
        { 'tests/carried.test.ts': { method: 'local-median' } },
      ),
    ).toEqual([
      'tests/new_buried.test.ts: its leading comment lacks Guards: Cost:',
      'tests/new_half.test.ts: its leading comment lacks Cost:',
      'tests/carried.test.ts: its leading comment lacks Guards: Cost:',
    ]);
  });
});
