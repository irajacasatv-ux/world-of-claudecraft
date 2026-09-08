// The dungeon interior floor's elevation profile: flat room floor plus the
// raised boss dais (see dungeon_layout.ts DAIS_HEIGHT). A pure leaf between
// data.ts (which dungeon an x-band belongs to, instance slot origins) and
// dungeon_layout.ts (the per-interior room plan), consumed by world.ts
// groundHeight so EVERY height consumer (mob y-snapping, spawns, loot,
// landings, ground AoEs, the chase camera) stands on the stage for free.
//
// Pure and deterministic: no rng, no wall clock, no sim state.

import { COTTAGE_LAYOUT, INN_ROOM_LAYOUT } from './content/freehold/layouts';
import {
  DUNGEON_FLOOR_Y,
  dungeonAt,
  INSTANCE_SLOT_COUNT,
  instanceOrigin,
  instanceSlotForZ,
} from './data';
import {
  CRYPT_LAYOUT,
  type DungeonLayout,
  daisLiftAt,
  dawnholdKeepLiftAt,
  IGNIVAR_FORGE_APPROACH_LAYOUT,
  IGNIVAR_LAYOUT,
  IGNIVAR_LIFT_LAYOUT,
  IGNIVAR_SECOND_WING_LAYOUT,
  lastKeepLiftAt,
  NYTHRAXIS_LAYOUT,
  SANCTUM_LAYOUT,
  TEMPLE_LAYOUT,
} from './dungeon_layout';
import { IGNIVAR_LAVA_MOAT_DEPTH, ignivarArenaPointInLava } from './ignivar_arena';
import { wildheartFieldHeight } from './wildheart_field';

/** Room plan per DungeonDef.interior key (colliders.ts derives its sets from
 *  the same map, so floor and walls can never disagree about the plan). */
export const INTERIOR_LAYOUTS: Record<string, DungeonLayout> = {
  crypt: CRYPT_LAYOUT,
  sanctum: SANCTUM_LAYOUT,
  temple: TEMPLE_LAYOUT,
  nythraxis: NYTHRAXIS_LAYOUT,
  ignivar_lift: IGNIVAR_LIFT_LAYOUT,
  ignivar_approach: IGNIVAR_FORGE_APPROACH_LAYOUT,
  ignivar: IGNIVAR_LAYOUT,
  ignivar_depths: IGNIVAR_SECOND_WING_LAYOUT,
  inn_room: INN_ROOM_LAYOUT,
  cottage: COTTAGE_LAYOUT,
};

export interface DungeonInstanceFrame {
  interior: string;
  layout: DungeonLayout;
  ox: number;
  oz: number;
  dungeonId: string;
}

// Instance frames are fully static per (dungeon index, slot): memoise them so
// the hot callers (groundHeight's dungeon branch, colliders.ts instance
// routing) allocate nothing in the steady state. Sized lazily; a frame is
// built once per slot ever touched.
const instanceFrameCache = new Map<number, DungeonInstanceFrame>();

/** The dungeon instance (its def, layout, and slot origin) at a world point,
 *  or null outside every dungeon x-band. Shared by the floor query below and
 *  colliders.ts instance routing. Returns a cached frozen frame: callers
 *  must treat it as read-only. */
export function dungeonInstanceAt(x: number, z: number): DungeonInstanceFrame | null {
  const dungeon = dungeonAt(x);
  if (!dungeon) return null;
  const index = dungeon.index;
  // Slot origins are the arithmetic sequence z = -1250 + slot * 500
  // (data.ts instanceOrigin), so the nearest-slot argmin is closed-form.
  // ceil(v - 0.5) rounds midpoint ties DOWN, matching the original loop's
  // first-best-wins behavior at exactly-between points (e.g. z = 0).
  const slot = Math.max(0, Math.min(INSTANCE_SLOT_COUNT - 1, Math.ceil((z + 1250) / 500 - 0.5)));
  const key = index * INSTANCE_SLOT_COUNT + slot;
  let frame = instanceFrameCache.get(key);
  if (!frame) {
    const o = instanceOrigin(index, slot);
    const interior = dungeon.interior;
    frame = Object.freeze({
      interior,
      layout: INTERIOR_LAYOUTS[interior] ?? CRYPT_LAYOUT,
      ox: o.x,
      oz: o.z,
      dungeonId: dungeon.id,
    });
    instanceFrameCache.set(key, frame);
  }
  return frame;
}

/**
 * How far the interior floor rises above the flat dungeon floor at a WORLD
 * point: DAIS_HEIGHT on a raised boss dais, zero everywhere else (including
 * every non-dungeon coordinate, so the open world and the delve/arena bands
 * are untouched by construction).
 */
export function dungeonFloorLift(x: number, z: number): number {
  const inst = dungeonInstanceAt(x, z);
  if (!inst) return 0;
  const localX = x - inst.ox;
  const localZ = z - inst.oz;
  if (inst.interior === 'ignivar' && ignivarArenaPointInLava(localX, localZ)) {
    return -IGNIVAR_LAVA_MOAT_DEPTH;
  }
  return daisLiftAt(inst.layout, localX, localZ);
}

/** Absolute dungeon floor height. The world band dispatcher delegates here;
 * authored lifts and field terrain use the same slot arithmetic as before. */
export function dungeonGroundHeight(x: number, z: number): number {
  const dungeon = dungeonAt(x);
  if (dungeon?.interior === 'wildheart') {
    const origin = instanceOrigin(dungeon.index, instanceSlotForZ(z));
    return DUNGEON_FLOOR_Y + wildheartFieldHeight(x - origin.x, z - origin.z);
  }
  if (dungeon?.interior === 'lastkeep') {
    // The Last Keep's authored rooms carry per-room lifts (door ramps
    // become stairs); the renderer builds risers and stairs from the same
    // authoredLiftAt field, so what you climb is what you stand on.
    const origin = instanceOrigin(dungeon.index, instanceSlotForZ(z));
    return DUNGEON_FLOOR_Y + lastKeepLiftAt(x - origin.x, z - origin.z);
  }
  if (dungeon?.interior === 'dawnhold') {
    // Dawnhold Castle's interior rides the same authored-lift idiom as the
    // Last Keep: the solar story and its stair ramps come from the shared
    // room plan (src/sim/dungeon_layout.ts).
    const origin = instanceOrigin(dungeon.index, instanceSlotForZ(z));
    return DUNGEON_FLOOR_Y + dawnholdKeepLiftAt(x - origin.x, z - origin.z);
  }
  // Every other interior is the flat room floor plus the raised boss dais
  // where its room plan stacks one (dungeon_floor.ts).
  return DUNGEON_FLOOR_Y + dungeonFloorLift(x, z);
}
