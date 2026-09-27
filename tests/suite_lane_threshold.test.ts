// The lane rule, measured: no test file outside CI_LONG_SUITES may weigh more than
// LANE_THRESHOLD_MS in the shard weight table (scripts/ci_shard_weights.generated.json,
// per-file ms inside a full-mode CI shard, harvested from green CI or carried locally
// between harvests). tests/suite_duration_budget.test.ts rations DECLARED timeouts;
// this is the MEASURED half. A file over the line either leaves the shard pool for the
// long-sims lane (a CI_LONG_SUITES entry), gets split or made cheaper and its row
// re-measured (the carry tool's --supersede, with the reason), or the threshold moves as
// a maintainer decision in scripts/lib/ci_shard_plan.mjs, never here.

import { describe, expect, it } from 'vitest';
import { MEASURED_WEIGHTS } from '../scripts/ci_shard_partition.mjs';
import { CI_LONG_SUITES, LANE_THRESHOLD_MS } from '../scripts/lib/ci_shard_plan.mjs';

describe('the lane threshold over the measured shard weights', () => {
  it('keeps every file outside the lane under the threshold', () => {
    const lane = new Set(CI_LONG_SUITES);
    const over = Object.entries(MEASURED_WEIGHTS)
      .filter(([file, ms]) => !lane.has(file) && ms > LANE_THRESHOLD_MS)
      .map(([file, ms]) => `${file} ${ms} ms`);
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
});
