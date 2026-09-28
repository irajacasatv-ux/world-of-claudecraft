// The world population invariant, escort shard b (of a to d): the same
// per-escort run-and-kill rounds as tests/world_population_invariant.test.ts,
// which carries the rule and the boot case. Split for wall time only: the shared
// half lives in tests/helpers/world_population.ts, and
// tests/world_population_shards.test.ts pins that the shards partition every
// shipped escort.
import { describe, it } from 'vitest';
import { escortShard, runEscortRounds } from './helpers/world_population';

describe('open-world population never exceeds what the content authored', () => {
  it.each(escortShard(1))(
    'holds after $id is run and its wave is killed, repeatedly',
    runEscortRounds,
    120_000,
  );
});
