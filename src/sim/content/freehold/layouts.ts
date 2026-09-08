// Measured development room geometry. Source envelopes and provenance:
// docs/freeholds/art/space-measurements.json. Sim and render share this plan.
import type {
  AuthoredDecor,
  AuthoredDoor,
  AuthoredRoom,
  DungeonLayout,
} from '../../dungeon_layout';
import { authoredLiftAt } from '../../rift/authored';

export const FREEHOLD_MODEL_BOUNDS = Object.freeze({
  bed: Object.freeze({ width: 2.6, height: 1.5, depth: 4.2 }),
  hearth: Object.freeze({ width: 3.2, height: 3.2, depth: 1.4 }),
  plinth: Object.freeze({ width: 1.2, height: 0.02, depth: 1.2 }),
  entry_door: Object.freeze({ width: 2.4, height: 3.2, depth: 0.12 }),
});
export const FREEHOLD_SOLID_RADII = Object.freeze({
  bed: Math.hypot(1.3, 2.1),
  hearth: Math.hypot(1.6, 0.7),
});
export const FREEHOLD_ENTRY = Object.freeze({ x: 0, z: -4 });
export const FREEHOLD_EXIT = Object.freeze({ x: 0, z: -6 });
export const FREEHOLD_ENTRY_FACING = 0;
export const FREEHOLD_GRID_PITCH = 0.5;
export const FREEHOLD_PROTECTED_PATHS = Object.freeze({
  inn_room: Object.freeze({ x0: -1.5, x1: 1.5, z0: -6, z1: 6 }),
  cottage: Object.freeze({ x0: -1.5, x1: 1.5, z0: -6, z1: 10 }),
});

export const INN_ROOM_ROOMS: AuthoredRoom[] = [{ id: 'inn_room', x0: -8, x1: 8, z0: -8, z1: 12 }];
export const INN_ROOM_DOORS: AuthoredDoor[] = [];
export const INN_ROOM_DECOR: AuthoredDecor[] = [
  { key: 'hearth', x: 0, z: 9, yaw: 0, r: FREEHOLD_SOLID_RADII.hearth },
  { key: 'bed', x: -5, z: 3, yaw: 0, r: FREEHOLD_SOLID_RADII.bed },
  { key: 'plinth_1', x: -5, z: 8, yaw: 0 },
  { key: 'plinth_2', x: 5, z: 8, yaw: 0 },
  { key: 'plinth_3', x: 5, z: 3, yaw: 0 },
  { key: 'entry_door', x: 0, z: -6.9, yaw: 0 },
];
export const COTTAGE_ROOMS: AuthoredRoom[] = [{ id: 'cottage', x0: -12, x1: 12, z0: -8, z1: 16 }];
export const COTTAGE_DOORS: AuthoredDoor[] = [];
export const COTTAGE_DECOR: AuthoredDecor[] = [
  { key: 'hearth', x: 0, z: 13, yaw: 0, r: FREEHOLD_SOLID_RADII.hearth },
  { key: 'strongbox', x: 8, z: 8, yaw: 0 },
  { key: 'plinth_1', x: -8, z: 11, yaw: 0 },
  { key: 'plinth_2', x: -8, z: 6, yaw: 0 },
  { key: 'plinth_3', x: 8, z: 11, yaw: 0 },
  { key: 'plinth_4', x: 8, z: 3, yaw: 0 },
  { key: 'station', x: -8, z: 0, yaw: 0 },
  { key: 'entry_door', x: 0, z: -6.9, yaw: 0 },
];

export const INN_ROOM_LAYOUT: DungeonLayout = {
  zMin: -8,
  zMax: 12,
  sideWallZ: 2,
  sideWallHd: 10,
  pillars: [],
  tombs: [],
  stubs: [],
  dais: { x: 0, z: 0, r: 0 },
  rooms: INN_ROOM_ROOMS,
  doors: INN_ROOM_DOORS,
  decor: INN_ROOM_DECOR,
};
export const COTTAGE_LAYOUT: DungeonLayout = {
  zMin: -8,
  zMax: 16,
  sideWallZ: 4,
  sideWallHd: 12,
  pillars: [],
  tombs: [],
  stubs: [],
  dais: { x: 0, z: 0, r: 0 },
  rooms: COTTAGE_ROOMS,
  doors: COTTAGE_DOORS,
  decor: COTTAGE_DECOR,
};

// Freeze every nested layout row at initialization, including the legacy empty
// arrays that the authored path replaces. Shared hosts cannot mutate this plan.
for (const layout of [INN_ROOM_LAYOUT, COTTAGE_LAYOUT]) {
  for (const value of Object.values(layout)) {
    if (Array.isArray(value)) {
      for (const row of value) Object.freeze(row);
    }
    if (typeof value === 'object' && value !== null) Object.freeze(value);
  }
  Object.freeze(layout);
}

export function innRoomLiftAt(x: number, z: number): number {
  return authoredLiftAt(INN_ROOM_ROOMS, INN_ROOM_DOORS, x, z);
}
export function cottageLiftAt(x: number, z: number): number {
  return authoredLiftAt(COTTAGE_ROOMS, COTTAGE_DOORS, x, z);
}
