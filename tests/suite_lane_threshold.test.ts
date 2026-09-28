// The lane rule, measured: no test file outside CI_LONG_SUITES may weigh more than
// LANE_THRESHOLD_MS in the shard weight table (scripts/ci_shard_weights.generated.json,
// per-file ms inside a full-mode CI shard, harvested from green CI or carried locally
// between harvests). tests/suite_duration_budget.test.ts rations DECLARED timeouts;
// this is the MEASURED half. A file over the line either leaves the shard pool for the
// long-sims lane (a CI_LONG_SUITES entry), gets split or made cheaper and its row
// re-measured (the carry tool's --supersede, with the reason), or the threshold moves as
// a maintainer decision in scripts/lib/ci_shard_plan.mjs, never here. A carried
// local-median row is in LOCAL ms, so it is scaled by CARRIED_LOCAL_TO_CI_RATIO into CI
// time before it is judged; a harvested row is judged as measured.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MEASURED_WEIGHTS } from '../scripts/ci_shard_partition.mjs';
import {
  CARRIED_LOCAL_TO_CI_RATIO,
  CI_LONG_SUITES,
  LANE_THRESHOLD_MS,
} from '../scripts/lib/ci_shard_plan.mjs';
import { carriedRows } from '../scripts/lib/ci_shard_weight_carry.mjs';

const CARRIED = carriedRows(
  JSON.parse(
    readFileSync(new URL('../scripts/ci_shard_weights.generated.json', import.meta.url), 'utf8'),
  ),
);

/** A row's weight in CI time: carried local medians scaled, harvested rows as measured. */
function ciWeight(file: string, ms: number): number {
  return CARRIED[file]?.method === 'local-median' ? ms * CARRIED_LOCAL_TO_CI_RATIO : ms;
}

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

  it('judges a carried local-median row in CI time, and a harvested row as measured', () => {
    // The scale reaches the rows it is for: the table carries local medians today, and
    // each is judged at CARRIED_LOCAL_TO_CI_RATIO times its local figure.
    const carried = Object.entries(CARRIED).filter(([, row]) => row.method === 'local-median');
    expect(carried.length).toBeGreaterThan(0);
    for (const [file] of carried) {
      expect(ciWeight(file, MEASURED_WEIGHTS[file]), file).toBe(
        MEASURED_WEIGHTS[file] * CARRIED_LOCAL_TO_CI_RATIO,
      );
    }
    const harvested = Object.keys(MEASURED_WEIGHTS).find((file) => !(file in CARRIED)) as string;
    expect(ciWeight(harvested, MEASURED_WEIGHTS[harvested])).toBe(MEASURED_WEIGHTS[harvested]);
    expect(CARRIED_LOCAL_TO_CI_RATIO).toBe(4);
  });
});
