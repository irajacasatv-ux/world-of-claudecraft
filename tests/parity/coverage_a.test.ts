// Shard h of the golden-trace parity gate: a contiguous slice of SCENARIOS
// run through the shared runner (see run_scenarios.ts, which also documents the
// shard boundaries), each scenario's gate case followed by its coverage cases.
// The split exists purely so vitest can parallelize the recordings across
// worker files; assertions, goldens, and UPDATE_PARITY minting are unchanged
// (this shard mints only its own slice's goldens).
// The file keeps its coverage_a name (and with it its row in the CI shard-weight
// table) from when the coverage checks ran as a separate suite; it is an
// ordinary gate shard now.

import { runParityShard } from './run_scenarios';

runParityShard(7);
