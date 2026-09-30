// The module-level caches in src/sim that can hold more than one world seed,
// owned here so ONE call can release a seed from all of them.
//
// Every host but one runs a single seed for its whole life (the authoritative
// server, the offline client, the editor), so these caches stay warm forever
// there and nothing in this module evicts. The exception is the headless RL
// env: it builds a new Sim per episode, by default on a fresh random seed, and
// it knows exactly when an episode's Sim is discarded. It calls
// releaseSeedCaches there (headless/env.ts); no other host does
// (tests/seed_caches.test.ts pins both sides).
//
// Each cache is a pure function of (active world content, seed), so a released
// seed rebuilds deterministically and identically on its next read. The one
// piece of state that is not a pure function is a collider grid's transport
// gate set, and that belongs to the Sim that drove it: a rebuilt grid starts
// from the clock-0 schedule, and every Sim re-syncs its gates at construction
// (transport_ferry.ts syncFerryGates).
//
// Caches that hold at most one seed at a time (the sea-cell memo, the palm,
// lily and willow spot lists, the vault pad anchor) replace themselves on the
// next seed's first read and are not listed here; neither are the per-grid
// WeakMaps (streetlamps, banker chests), which go with their grid, nor the
// maze layout caches (yumi_maze_layout.ts), keyed by the fixed maze seed.

import type { ColliderGrid } from './colliders';
import { getActiveWorldContent } from './data';
import type { WorldContent } from './types';
import type { CalmSeedTables } from './world';

// colliders.ts: grids are cached per (active world content, seed). The WeakMap
// keeps the built-in world's grid warm forever and lets swapped-out custom maps
// be collected; the editor invalidates explicitly after mutating placements.
export const gridCaches = new WeakMap<WorldContent, Map<number, ColliderGrid>>();
// colliders.ts: gate states requested before their grid was built (setColliderGateOpen).
export const pendingGateStates = new WeakMap<WorldContent, Map<number, Map<string, boolean>>>();
// world.ts: the calm anchor buckets and lazily sized skirt rings, per seed.
export const calmSeedTables = new Map<number, CalmSeedTables>();
// world.ts: the per-tick movement gates' 1-yard steepness memo, seed -> cell -> steepness.
export const steepnessCache = new Map<number, Map<number, number>>();

/**
 * Drop every seed-keyed cache entry for `seed`: its collider grid and pending
 * gate wishes under the ACTIVE world content (the scope every collider cache
 * call works in), its calm tables and its steepness memo. The next read at that
 * seed rebuilds exactly what was dropped. Only a host that has discarded every
 * Sim on `seed` may call this.
 */
export function releaseSeedCaches(seed: number): void {
  const content = getActiveWorldContent();
  gridCaches.get(content)?.delete(seed);
  pendingGateStates.get(content)?.delete(seed);
  calmSeedTables.delete(seed);
  steepnessCache.delete(seed);
}

/** Test-only: the seeds each cache holds (collider caches under the active content). */
export function seedCacheSeedsForTest(): Record<string, number[]> {
  const content = getActiveWorldContent();
  return {
    gridCaches: [...(gridCaches.get(content)?.keys() ?? [])],
    pendingGateStates: [...(pendingGateStates.get(content)?.keys() ?? [])],
    calmSeedTables: [...calmSeedTables.keys()],
    steepnessCache: [...steepnessCache.keys()],
  };
}
