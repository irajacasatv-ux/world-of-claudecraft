// The lane rule, measured: no test file outside CI_LONG_SUITES may weigh more than
// LANE_THRESHOLD_MS in the shard weight table (scripts/ci_shard_weights.generated.json,
// per-file ms inside a full-mode CI shard, harvested from green CI or carried locally
// between harvests). tests/suite_duration_budget.test.ts rations DECLARED timeouts;
// this is the MEASURED half. A file over the line either leaves the shard pool for the
// long-sims lane (a CI_LONG_SUITES entry), gets split or made cheaper and its row
// re-measured (the carry tool's --supersede, with the reason), or the threshold moves as
// a maintainer decision in scripts/lib/ci_shard_plan.mjs, never here. A carried row is
// not in CI ms (the newest harvest did not measure it), so ciTimeWeight scales it by
// CARRIED_LOCAL_TO_CI_RATIO into CI time before it is judged; a harvested row is judged
// as measured.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MEASURED_WEIGHTS } from '../scripts/ci_shard_partition.mjs';
import {
  CARRIED_LOCAL_TO_CI_RATIO,
  CI_LONG_SUITES,
  ciTimeWeight,
  LANE_THRESHOLD_MS,
} from '../scripts/lib/ci_shard_plan.mjs';
import { carriedRows } from '../scripts/lib/ci_shard_weight_carry.mjs';

const CARRIED = carriedRows(
  JSON.parse(
    readFileSync(new URL('../scripts/ci_shard_weights.generated.json', import.meta.url), 'utf8'),
  ),
);

/** A live row's weight in CI time (ciTimeWeight over the committed carried map). */
const ciWeight = (file: string, ms: number): number => ciTimeWeight(ms, CARRIED[file]);

describe('the lane threshold over the measured shard weights', () => {
  it('keeps every file outside the lane under the threshold', () => {
    const lane = new Set(CI_LONG_SUITES);
    const over = Object.entries(MEASURED_WEIGHTS)
      .filter(([file, ms]) => !lane.has(file) && ciWeight(file, ms) > LANE_THRESHOLD_MS)
      .map(([file, ms]) => `${file} ${ciWeight(file, ms)} ms`);
    expect(
      over,
      'a suite outside CI_LONG_SUITES weighs more than LANE_THRESHOLD_MS: lane it, split it, or ' +
        're-measure it after a split (ci_shard_weights_harvest --carry-local --supersede)',
    ).toEqual([]);
  });

  it('sees heavy files at all (the lane holds weights over the threshold)', () => {
    // Positive control: if the table lost its heavy rows (a shrunken harvest), the
    // check above would pass vacuously.
    const heavyLane = CI_LONG_SUITES.filter(
      (file) => (MEASURED_WEIGHTS[file] ?? 0) > LANE_THRESHOLD_MS,
    );
    expect(heavyLane.length).toBeGreaterThanOrEqual(3);
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
});
