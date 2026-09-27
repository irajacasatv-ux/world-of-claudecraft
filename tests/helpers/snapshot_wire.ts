// Shared fixtures for the snapshot wire suites (tests/snapshots.test.ts and the
// tests/snapshots_<topic>.test.ts files split out of it on 2026-09-27): the
// ambient-free wire world, the applySnapshot shape, and the far-future clock value
// several fixtures seed. Each suite keeps its own hoisted db mock.

import { BUILTIN_WORLD } from '../../src/sim/data';
import type { WorldContent } from '../../src/sim/types';

// Wire round-trip fixtures only read the player entity they build, never ambient
// world content, so strip camps/npcs/ground objects to keep each direct Sim cheap
// (dot_final_tick pattern). The aura-decode suites in tests/snapshots_auras.test.ts
// grab a real camp mob and the GameServer harness ships its own full world; both
// keep the builtin content.
export const WIRE_TEST_WORLD: WorldContent = {
  ...BUILTIN_WORLD,
  camps: [],
  npcs: {},
  groundObjects: [],
};

export type SnapshotApplier = { applySnapshot(snapshot: unknown): void };

// Year ~2223 in epoch ms. Beats selfWireJson's `until > Date.now()` lockout
// filter without a wall-clock read in test scaffolding.
export const FAR_FUTURE_MS = 8_000_000_000_000;
