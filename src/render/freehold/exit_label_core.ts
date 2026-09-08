import {
  FREEHOLD_COTTAGE_DUNGEON_ID,
  FREEHOLD_INN_ROOM_DUNGEON_ID,
} from '../../sim/content/freehold/dungeons';
import {
  COTTAGE_LAYOUT,
  FREEHOLD_EXIT,
  FREEHOLD_MODEL_BOUNDS,
  INN_ROOM_LAYOUT,
} from '../../sim/content/freehold/layouts';
import type { DungeonLayout } from '../../sim/dungeon_layout';
import type { Entity } from '../../sim/types';
import { NAMEPLATE_ANCHOR_LIFT } from '../nameplate_view';
import { cameraSeesWallBack } from '../wall_backface_cull_core';

const LAYOUTS: readonly (readonly [string, DungeonLayout])[] = [
  [FREEHOLD_INN_ROOM_DUNGEON_ID, INN_ROOM_LAYOUT],
  [FREEHOLD_COTTAGE_DUNGEON_ID, COTTAGE_LAYOUT],
];
const DOORS = new Map(
  LAYOUTS.map(([id, layout]) => {
    // Both authored homes attach their entry door to the room's south face.
    const room = layout.rooms?.[0];
    const door = layout.decor?.find((anchor) => anchor.key === 'entry_door');
    const plane = room ? { x: (room.x0 + room.x1) / 2, z: room.z0, nx: 0, nz: -1 } : null;
    return [id, { door, plane }] as const;
  }),
);

/** Match the physical door's anchor and opaque wall cutaway, leaving other labels alone. */
export function applyFreeholdExitLabelAnchor(
  anchor: { x: number; y: number; z: number },
  entity: Entity,
  camera: { x: number; z: number },
): boolean {
  if (entity.kind !== 'object' || entity.templateId !== 'dungeon_exit') return true;
  const entry = DOORS.get(entity.dungeonId ?? '');
  if (!entry?.door || !entry.plane) return true;
  const ox = entity.pos.x - FREEHOLD_EXIT.x;
  const oz = entity.pos.z - FREEHOLD_EXIT.z;
  if (cameraSeesWallBack(entry.plane, camera.x - ox, camera.z - oz)) return false;
  anchor.x = ox + entry.door.x;
  anchor.y = entity.pos.y + FREEHOLD_MODEL_BOUNDS.entry_door.height + NAMEPLATE_ANCHOR_LIFT;
  anchor.z = oz + entry.door.z;
  return true;
}
