// How the world population sweep deals the shipped escorts across its four shard files
// (tests/world_population_invariant_a to _d.test.ts), kept apart from
// tests/helpers/world_population.ts so the partition pin
// (tests/world_population_shards.test.ts) reads the content tables without importing
// the whole Sim.
import { ESCORTS } from '../../src/sim/data';
import type { EscortDef } from '../../src/sim/types';

/** How many files the escort sweep is dealt across. */
export const ESCORT_SHARD_COUNT = 4;

/** The shipped escorts shard `index` runs: every ESCORT_SHARD_COUNT-th, round-robin. */
export function escortShard(index: number): EscortDef[] {
  return Object.values(ESCORTS).filter((_, i) => i % ESCORT_SHARD_COUNT === index);
}
