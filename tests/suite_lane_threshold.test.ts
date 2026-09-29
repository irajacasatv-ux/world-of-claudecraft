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

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MEASURED_FALLBACK_MS, MEASURED_WEIGHTS } from '../scripts/ci_shard_partition.mjs';
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
import { listTestFiles } from '../scripts/lib/gate_discovery.mjs';

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
      'a suite outside CI_LONG_SUITES weighs more than LANE_THRESHOLD_MS: split it, make it ' +
        'cheaper, or lane it (which needs a maintainer raise of LANE_POOL_CEILING_MS); ' +
        're-measure it after a split (ci_shard_weights_harvest --carry-local --supersede)',
    ).toEqual([]);
  });

  it('sees heavy files at all (the table keeps its heavy rows and every lane row)', () => {
    // Positive control: if the table lost its heavy rows (a shrunken harvest), the check
    // above would pass vacuously. Since the lane's balance probes boot production's idle
    // cull (2026-09-29) no row is over the threshold itself, so the control counts rows over
    // a quarter of it (23 at the 2026-09-29 harvest; the floor leaves room to slim the heavy
    // tail further) and requires a row for every lane file.
    const heavy = Object.values(MEASURED_WEIGHTS).filter((ms) => ms > LANE_THRESHOLD_MS / 4);
    expect(heavy.length).toBeGreaterThanOrEqual(10);
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

// The admission rule (tests/CLAUDE.md, "Test cost"): a test file the harvest has not measured
// (no row in the weight table, or a carried row standing in for one) says in its leading
// comment, on its own lines, `Guards:` and what it uniquely guards, and `Cost:` and its measured
// local cost (a number with ms or s). Until a harvest measures the file, that cost counts into
// the total-time ratchet below, in CI time. The files checked are the table's own population
// (scripts/lib/ci_shard_walk.mjs: every .test.ts outside the browser suite). Every other file
// vitest's default run collects (a .test.mjs, a .spec.ts, a test outside tests/) sits outside the
// table: the ones that predate the rule are pinned by name below, and any new one must carry the
// statement too. The Playwright browser suite runs under its own config and is reviewed by hand.
const GUARDS_LINE = /^(?:\/\/+|\/?\*+)\s*Guards:\s*(\S.*)$/;
// The time is the first number on the line and stands alone: `1200 ms` and `about 1.2 s` read,
// while `1,200 ms`, `25 000 ms` and `2 min 30 s` are refused rather than read low.
const COST_LINE = /^(?:\/\/+|\/?\*+)\s*Cost:[^\d\n]*?(\d+(?:\.\d+)?)\s*(ms|s)\b/;
const GUARDS_MIN_CHARS = 12;

/** The leading comment block: every comment line before the first line of code. */
function leadingComment(source: string): string[] {
  const lines: string[] = [];
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (/^(\/\/|\/\*|\*)/.test(trimmed)) lines.push(trimmed);
    else break;
  }
  return lines;
}

function admissionStatement(source: string): { guards?: string; costMs?: number } {
  const statement: { guards?: string; costMs?: number } = {};
  for (const line of leadingComment(source)) {
    const guards = line.match(GUARDS_LINE)?.[1].trim();
    if (guards && guards.length >= GUARDS_MIN_CHARS && !guards.includes('Cost:'))
      statement.guards ??= guards;
    const cost = line.match(COST_LINE);
    if (cost) statement.costMs ??= Number(cost[1]) * (cost[2] === 's' ? 1000 : 1);
  }
  return statement;
}

interface WalkedFile {
  key: string;
  source: string;
}

const unmeasured = (
  { key }: WalkedFile,
  weights: Readonly<Record<string, number>>,
  carried: Readonly<Record<string, object>>,
): boolean => !Object.hasOwn(weights, key) || Object.hasOwn(carried, key);

/** A new file's weight in CI time: its stated local cost scaled like a carried row, never less
 *  than the measured-median fallback (so `Cost: 0 ms` cannot enter at nothing), or the fallback
 *  when it states none (the admission check fails that file anyway). */
function statedWeight(source: string): number {
  const { costMs } = admissionStatement(source);
  if (costMs === undefined) return MEASURED_FALLBACK_MS;
  return Math.max(ciTimeWeight(costMs, { method: 'admission' }), MEASURED_FALLBACK_MS);
}

function admissionProblems(
  files: readonly WalkedFile[],
  weights: Readonly<Record<string, number>>,
  carried: Readonly<Record<string, object>>,
  lane: readonly string[] = [],
): string[] {
  const inLane = new Set(lane);
  const problems: string[] = [];
  for (const file of files) {
    if (!unmeasured(file, weights, carried)) continue;
    const { guards, costMs } = admissionStatement(file.source);
    if (guards === undefined)
      problems.push(`${file.key}: no "Guards:" line saying what it uniquely guards`);
    if (costMs === undefined)
      problems.push(
        `${file.key}: no "Cost:" line opening with a measured time (a plain number, ms or s)`,
      );
    // The lane rule, applied to a file the table cannot yet judge: its stated cost in CI time.
    else if (!inLane.has(file.key) && statedWeight(file.source) > LANE_THRESHOLD_MS)
      problems.push(
        `${file.key}: its stated cost is ${statedWeight(file.source)} ms in CI time, over ` +
          'LANE_THRESHOLD_MS: split it or make it cheaper',
      );
  }
  return problems;
}

/**
 * The CI-time weight of the given files that have NO row in the table (a carried row is already
 * in the table), each at its stated weight, split between the lane and the shard pool.
 */
function unmeasuredPools(
  files: readonly WalkedFile[],
  weights: Readonly<Record<string, number>>,
  lane: readonly string[],
): { shard: number; lane: number } {
  const inLane = new Set(lane);
  const pools = { shard: 0, lane: 0 };
  for (const file of files) {
    if (Object.hasOwn(weights, file.key)) continue;
    const weight = statedWeight(file.source);
    if (inLane.has(file.key)) pools.lane += weight;
    else pools.shard += weight;
  }
  return { shard: Math.round(pools.shard), lane: Math.round(pools.lane) };
}

// The collected test files the weight table does not describe, all written before the rule.
const LEGACY_OUTSIDE_TABLE = [
  'tests/browser_path_resolve.test.mjs',
  'tests/cpu_profile_window.test.mjs',
  'tests/geared_arrival_bench.test.mjs',
  'tests/geared_arrival_fixture.test.mjs',
  'tests/geared_arrival_roster.test.mjs',
  'tests/gpu_hitch_capture.test.mjs',
  'tests/gpu_hitch_metrics.test.mjs',
  'tests/gpu_hitch_probe.test.mjs',
  'tests/mob_portrait_background.test.mjs',
  'tests/nythraxis_hitch_bench.test.mjs',
  'tests/perf_baseline_store.test.mjs',
  'tests/perf_hitch_crowd_reset.test.mjs',
  'tests/perf_hitch_soak.test.mjs',
  'tests/perf_hitch_store.test.mjs',
  'tests/prod_cpu_monitor.test.mjs',
  'tests/profile_mode.test.mjs',
  'tests/profiler_metrics.test.mjs',
] as const;

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const WALKED: readonly WalkedFile[] = walkShardTestFiles(REPO_ROOT).map((key) => ({
  key,
  source: readFileSync(new URL(`../${key}`, import.meta.url), 'utf8'),
}));

// Every collected test file the weight table does not describe, minus the pinned legacy ones:
// a new .test.mjs, .spec.ts or test outside tests/. The harvest never measures these, so their
// stated cost counts into the shard pool for good.
const OUTSIDE_TABLE_NEWCOMERS: readonly WalkedFile[] = (() => {
  const table = new Set(WALKED.map(({ key }) => key));
  const legacy = new Set<string>(LEGACY_OUTSIDE_TABLE);
  return listTestFiles({ root: REPO_ROOT, dir: REPO_ROOT, readdirSync, join, relative, sep })
    .filter((key) => !table.has(key) && !legacy.has(key))
    .map((key) => ({ key, source: readFileSync(join(REPO_ROOT, key), 'utf8') }));
})();

// What the ratchet adds beyond the table: every walked file and every newcomer outside it.
const RATCHET_UNMEASURED_INPUT: readonly WalkedFile[] = [...WALKED, ...OUTSIDE_TABLE_NEWCOMERS];

// The total-CI-time ratchet (scripts/lib/ci_shard_plan.mjs, beside the lane rule): the summed
// CI-time weight of the shard pool and of the lane, a new file counted at its stated cost, may
// not pass their ceilings, and a ceiling left well above its pool after a cut is stale.
describe('the total CI time ratchet over the measured weights', () => {
  it('holds the shard pool and the lane under their ceilings, neither ceiling stale', () => {
    const measured = poolWeights(MEASURED_WEIGHTS, CARRIED, CI_LONG_SUITES);
    const added = unmeasuredPools(RATCHET_UNMEASURED_INPUT, MEASURED_WEIGHTS, CI_LONG_SUITES);
    const pools = { shard: measured.shard + added.shard, lane: measured.lane + added.lane };
    expect(
      ratchetProblems(pools, { shard: SHARD_POOL_CEILING_MS, lane: LANE_POOL_CEILING_MS }),
      'a new file or a weight row grew a pool past its ceiling (make it cheaper, cut what it ' +
        'duplicates, or raise the ceiling as a maintainer decision), or a pool shrank and its ' +
        'ceiling must come down',
    ).toEqual([]);
    // Non-vacuous: both pools are real sums (a shrunken table would pass under any ceiling).
    expect(pools.shard).toBeGreaterThan(SHARD_POOL_CEILING_MS / (1 + RATCHET_SLACK));
    expect(pools.lane).toBeGreaterThan(0);
  });

  it('pins the ceilings, the headroom and the slack as literals', () => {
    // A raise, a looser slack or a wider headroom is then a visible edit to this file, as a
    // monolith ceiling is (tests/monolith_budget.test.ts), never a quiet one in the lib alone.
    expect(SHARD_POOL_CEILING_MS).toBe(7_743_000);
    expect(LANE_POOL_CEILING_MS).toBe(366_000);
    expect(RATCHET_HEADROOM).toBe(0.1);
    expect(RATCHET_SLACK).toBe(0.2);
  });

  it('sums pools through the CI-time weight and judges both directions for both pools', () => {
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
    expect(ratchetProblems(pools, { shard: 13_999, lane: 49_999 })).toEqual([
      'shard pool 14000 ms is over its ceiling 13999 ms',
      'lane pool 50000 ms is over its ceiling 49999 ms',
    ]);
    // Stale: more than RATCHET_SLACK above the pool; exactly at the slack still holds.
    expect(
      ratchetProblems(pools, { shard: 14_000 * 1.2, lane: 50_000 * (1 + RATCHET_SLACK) }),
    ).toEqual([]);
    expect(ratchetProblems(pools, { shard: 16_801, lane: 60_001 })).toEqual([
      `shard ceiling 16801 ms is stale over its pool 14000 ms: lower it to about ${Math.ceil(
        14_000 * (1 + RATCHET_HEADROOM),
      )} ms`,
      `lane ceiling 60001 ms is stale over its pool 50000 ms: lower it to about ${Math.ceil(
        50_000 * (1 + RATCHET_HEADROOM),
      )} ms`,
    ]);
  });

  it('counts a new file at its stated cost in CI time, and a measured or carried one not again', () => {
    const files = [
      { key: 'tests/new.test.ts', source: '// Guards: a new behavior here.\n// Cost: 0.5 s\n' },
      {
        key: 'tests/new_lane.test.ts',
        source: '// Guards: a new lane behavior.\n// Cost: 300 ms\n',
      },
      { key: 'tests/new_unstated.test.ts', source: 'import x from "y";\n' },
      { key: 'tests/measured.test.ts', source: '// Cost: 9 s\n' },
      { key: 'tests/carried.test.ts', source: '// Cost: 9 s\n' },
    ];
    expect(
      unmeasuredPools(files, { 'tests/measured.test.ts': 1, 'tests/carried.test.ts': 1 }, [
        'tests/new_lane.test.ts',
      ]),
    ).toEqual({ shard: 2_000 + MEASURED_FALLBACK_MS, lane: 1_200 });
    // A stated zero never enters below the measured-median fallback.
    expect(
      unmeasuredPools(
        [
          {
            key: 'tests/free.test.ts',
            source: '// Guards: a free behavior here.\n// Cost: 0 ms\n',
          },
        ],
        {},
        [],
      ),
    ).toEqual({ shard: MEASURED_FALLBACK_MS, lane: 0 });
  });
});

describe('the new-test admission rule', () => {
  it('asks every test file the harvest has not measured for its Guards: and Cost: lines', () => {
    // The walk sees the whole suite; right after a full harvest no file is unmeasured, so the
    // synthetic case below carries the parser.
    expect(WALKED.length).toBeGreaterThan(4_000);
    expect(
      admissionProblems(WALKED, MEASURED_WEIGHTS, CARRIED, CI_LONG_SUITES),
      'a new test file states what it uniquely guards and its measured cost (tests/CLAUDE.md, ' +
        '"Test cost")',
    ).toEqual([]);
  });

  it('asks the same of a new collected test file outside the table (a .test.mjs, a .spec.ts)', () => {
    const table = new Set(WALKED.map(({ key }) => key));
    const outside = listTestFiles({
      root: REPO_ROOT,
      dir: REPO_ROOT,
      readdirSync,
      join,
      relative,
      sep,
    }).filter((file) => !table.has(file));
    // Non-vacuous: the collected walk sees the legacy files, so it sees a new one beside them.
    expect(outside).toEqual(expect.arrayContaining([...LEGACY_OUTSIDE_TABLE]));
    // And the newcomers the ratchet counts are exactly the rest of it, walked and outside alike.
    expect(
      [...OUTSIDE_TABLE_NEWCOMERS.map(({ key }) => key), ...LEGACY_OUTSIDE_TABLE].sort(),
    ).toEqual([...outside].sort());
    const ratchetKeys = new Set(RATCHET_UNMEASURED_INPUT.map(({ key }) => key));
    expect([...table, ...outside].filter((key) => !ratchetKeys.has(key))).toEqual([
      ...LEGACY_OUTSIDE_TABLE,
    ]);
    expect(
      admissionProblems(OUTSIDE_TABLE_NEWCOMERS, {}, {}),
      'a new test file outside the weight table states what it guards and costs too',
    ).toEqual([]);
  });

  it('reads real statements from the leading comment only, and skips measured files', () => {
    const file = (key: string, source: string) => ({ key, source });
    const stated =
      "// Guards: the pause toggle's replay path.\n// Cost: 0.2 s locally at one worker.\n" +
      'import x from "y";\n';
    const afterDocblock =
      // The pragma is split so vitest's own docblock scan does not read it as this file's.
      `// @vitest-${'environment'} happy-dom\n\n/**\n * Guards: the drawer keyboard trap.\n` +
      ' * Cost: 450 ms at one worker.\n */\nimport x from "y";\n';
    const problems = admissionProblems(
      [
        file('tests/new_stated.test.ts', stated),
        file('tests/new_after_docblock.test.ts', afterDocblock),
        file('tests/new_buried.test.ts', `import x from "y";\n${stated}`),
        file('tests/new_guards_only.test.ts', "// Guards: the pause toggle's replay path.\n"),
        file('tests/new_empty.test.ts', '// Guards:\n// Cost:\n'),
        file('tests/new_one_line.test.ts', '// Guards: Cost:\n'),
        file('tests/new_prose.test.ts', '// This file has no Guards: or Cost: statement.\n'),
        file('tests/new_no_number.test.ts', '// SafeGuards: the pause path.\n// Cost: cheap\n'),
        file('tests/new_terse.test.ts', '// Guards: yes\n// Cost: 1 s\n'),
        file(
          'tests/new_comma.test.ts',
          "// Guards: the pause toggle's replay path.\n// Cost: 1,200 ms\n",
        ),
        file(
          'tests/new_spaced.test.ts',
          "// Guards: the pause toggle's replay path.\n// Cost: 25 000 ms\n",
        ),
        file(
          'tests/new_minutes.test.ts',
          "// Guards: the pause toggle's replay path.\n// Cost: 1 min 5 s\n",
        ),
        file(
          'tests/new_heavy.test.ts',
          "// Guards: the pause toggle's replay path.\n// Cost: 30 s\n",
        ),
        file('tests/measured.test.ts', 'import x from "y";\n'),
        file('tests/carried.test.ts', 'import x from "y";\n'),
      ],
      { 'tests/measured.test.ts': 1_000, 'tests/carried.test.ts': 1_000 },
      { 'tests/carried.test.ts': { method: 'local-median' } },
    );
    const guards = (key: string) => `${key}: no "Guards:" line saying what it uniquely guards`;
    const cost = (key: string) =>
      `${key}: no "Cost:" line opening with a measured time (a plain number, ms or s)`;
    expect(problems).toEqual([
      guards('tests/new_buried.test.ts'),
      cost('tests/new_buried.test.ts'),
      cost('tests/new_guards_only.test.ts'),
      guards('tests/new_empty.test.ts'),
      cost('tests/new_empty.test.ts'),
      guards('tests/new_one_line.test.ts'),
      cost('tests/new_one_line.test.ts'),
      guards('tests/new_prose.test.ts'),
      cost('tests/new_prose.test.ts'),
      guards('tests/new_no_number.test.ts'),
      cost('tests/new_no_number.test.ts'),
      guards('tests/new_terse.test.ts'),
      cost('tests/new_comma.test.ts'),
      cost('tests/new_spaced.test.ts'),
      cost('tests/new_minutes.test.ts'),
      'tests/new_heavy.test.ts: its stated cost is 120000 ms in CI time, over LANE_THRESHOLD_MS: ' +
        'split it or make it cheaper',
      guards('tests/carried.test.ts'),
      cost('tests/carried.test.ts'),
    ]);
    expect(admissionStatement(stated).costMs).toBe(200);
    expect(admissionStatement('// Cost: 1200 ms\n').costMs).toBe(1200);
    expect(admissionStatement('// Cost: about 1.2 s at one worker\n').costMs).toBe(1200);
    expect(admissionStatement(afterDocblock).costMs).toBe(450);
  });
});
