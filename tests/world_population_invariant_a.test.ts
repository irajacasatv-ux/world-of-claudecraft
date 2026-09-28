// The world population invariant, escort shard a (of a to d): one quarter of
// the per-escort run-and-kill rounds, dealt round-robin. The rule and the boot
// case live in tests/world_population_invariant.test.ts, the shared half in
// tests/helpers/world_population.ts, and tests/world_population_shards.test.ts
// pins that the four shard files partition every shipped escort. Split for wall
// time only.
import { describe, it } from 'vitest';
import { escortShard } from './helpers/escort_shards';
import { runEscortRounds } from './helpers/world_population';

describe('open-world population never exceeds what the content authored', () => {
  it.each(escortShard(0))(
    'holds after $id is run and its wave is killed, repeatedly',
    runEscortRounds,
    120_000,
  );
});
