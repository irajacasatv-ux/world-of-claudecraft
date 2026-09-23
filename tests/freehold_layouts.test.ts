import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isBlocked, resolveMovement, resolvePosition } from '../src/sim/colliders';
import {
  COTTAGE_LAYOUT,
  COTTAGE_ROOMS,
  cottageLiftAt,
  FREEHOLD_ENTRY,
  FREEHOLD_ENTRY_FACING,
  FREEHOLD_EXIT,
  FREEHOLD_MODEL_BOUNDS,
  FREEHOLD_PROTECTED_PATHS,
  FREEHOLD_SOLID_RADII,
  INN_ROOM_LAYOUT,
  INN_ROOM_ROOMS,
  innRoomLiftAt,
} from '../src/sim/content/freehold';
import { DUNGEON_FLOOR_Y, DUNGEON_LIST, DUNGEONS, instanceOrigin } from '../src/sim/data';
import {
  dungeonFloorLift,
  dungeonGroundHeight,
  dungeonInstanceAt,
  INTERIOR_LAYOUTS,
} from '../src/sim/dungeon_floor';
import { dawnholdKeepLiftAt, lastKeepLiftAt, layoutColliders } from '../src/sim/dungeon_layout';
import { EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';
import { PLAYER_BODY_RADIUS } from '../src/sim/pathfind';
import { authoredWallSegments, inAnyRoom } from '../src/sim/rift/authored';
import { wildheartFieldHeight } from '../src/sim/wildheart_field';
import { groundHeight } from '../src/sim/world';

const measured = JSON.parse(
  readFileSync(new URL('../docs/freeholds/art/space-measurements.json', import.meta.url), 'utf8'),
);
const homes = [
  {
    id: 'freehold_inn_room',
    tier: 'inn_room',
    layout: INN_ROOM_LAYOUT,
    lift: innRoomLiftAt,
    plinths: 3,
  },
  {
    id: 'freehold_cottage',
    tier: 'cottage',
    layout: COTTAGE_LAYOUT,
    lift: cottageLiftAt,
    plinths: 4,
  },
] as const;

describe('measured freehold rooms', () => {
  it('keeps reproducible source geometry and conservative solid envelopes', () => {
    for (const source of measured.sources) {
      const bytes = readFileSync(new URL(`../${source.path}`, import.meta.url));
      expect(createHash('sha256').update(bytes).digest('hex'), source.path).toBe(source.sha256);
    }
    for (const [key, bounds] of Object.entries(FREEHOLD_MODEL_BOUNDS)) {
      const model = measured.models[key];
      const lo = [Infinity, Infinity, Infinity];
      const hi = [-Infinity, -Infinity, -Infinity];
      for (const part of model.parts) {
        for (let i = 0; i < 3; i++) {
          lo[i] = Math.min(lo[i], part.center[i] - part.size[i] / 2);
          hi[i] = Math.max(hi[i], part.center[i] + part.size[i] / 2);
        }
      }
      for (const [i, size] of [bounds.width, bounds.height, bounds.depth].entries()) {
        expect(hi[i] - lo[i], key).toBeCloseTo(size, 12);
      }
      if (key in FREEHOLD_SOLID_RADII) {
        const radius = FREEHOLD_SOLID_RADII[key as keyof typeof FREEHOLD_SOLID_RADII];
        expect(radius).toBe(model.colliderRadius);
        for (const x of [lo[0], hi[0]])
          for (const z of [lo[2], hi[2]]) {
            expect(Math.hypot(x, z)).toBeLessThanOrEqual(radius);
          }
      } else {
        expect(model.colliderRadius).toBeNull();
      }
    }
  });

  it('uses exact floor repeats, strict interior anchors and immutable layouts', () => {
    expect(INN_ROOM_ROOMS).toEqual([{ id: 'inn_room', x0: -8, x1: 8, z0: -8, z1: 12 }]);
    expect(COTTAGE_ROOMS).toEqual([{ id: 'cottage', x0: -12, x1: 12, z0: -8, z1: 16 }]);
    expect(FREEHOLD_ENTRY).toEqual({ x: 0, z: -4 });
    expect(FREEHOLD_EXIT).toEqual({ x: 0, z: -6 });
    expect(FREEHOLD_ENTRY_FACING).toBe(0);
    // The measurements record's gate block follows the one authored site.
    const gate = EASTBROOK_LAYOUT.services.freeholdGate;
    expect(measured.gate.position).toEqual([gate.position.x, gate.position.z]);
    expect(measured.gate.facing).toBe(gate.facing);
    expect(measured.gate.return).toEqual([gate.position.x, gate.position.z - 4]);
    for (const home of homes) {
      const rooms = home.layout.rooms!;
      expect(rooms.map(({ id: _id, ...bounds }) => bounds)).toEqual([
        measured.rooms[home.tier].bounds,
      ]);
      expect(FREEHOLD_PROTECTED_PATHS[home.tier]).toEqual(
        measured.rooms[home.tier].protectedCorridor,
      );
      expect(
        home.layout
          .decor!.map(({ r: _r, ...anchor }) => anchor)
          .sort((a, b) => a.key.localeCompare(b.key)),
      ).toEqual(
        measured.rooms[home.tier].anchors
          .slice()
          .sort((a: { key: string }, b: { key: string }) => a.key.localeCompare(b.key)),
      );

      expect(Object.isFrozen(home.layout)).toBe(true);
      expect(Object.isFrozen(rooms)).toBe(true);
      for (const [i, room] of rooms.entries()) {
        expect(Object.isFrozen(room)).toBe(true);
        expect((room.x1 - room.x0) % 2).toBe(0);
        expect((room.z1 - room.z0) % 2).toBe(0);
        for (const other of rooms.slice(i + 1)) {
          expect(
            room.x0 >= other.x1 ||
              room.x1 <= other.x0 ||
              room.z0 >= other.z1 ||
              room.z1 <= other.z0,
          ).toBe(true);
        }
        expect(inAnyRoom(rooms, room.x0, (room.z0 + room.z1) / 2)).toBe(false);
      }
      for (const point of [FREEHOLD_ENTRY, FREEHOLD_EXIT, ...home.layout.decor!]) {
        expect(inAnyRoom(rooms, point.x, point.z), `${home.id} ${JSON.stringify(point)}`).toBe(
          true,
        );
      }
      expect(home.layout.decor!.filter((d) => d.key.startsWith('plinth_'))).toHaveLength(
        home.plinths,
      );
      expect(home.layout.decor!.filter((d) => d.key === 'hearth')).toHaveLength(1);
      for (const d of home.layout.decor!) {
        const modelKey = d.key.startsWith('plinth_') ? 'plinth' : d.key;
        const model = measured.models[modelKey];
        if (model?.collisionClass === 'solid') expect(d.r).toBe(model.colliderRadius);
        else expect(d.r).toBeUndefined();
      }
      expect(home.layout.daisRaised).not.toBe(true);
      expect(home.layout.pillars).toEqual([]);
      expect(home.layout.tombs).toEqual([]);
      expect(home.layout.stubs).toEqual([]);
      expect(home.layout.doors).toEqual([]);
    }
  });

  it('preserves legacy ground dispatch, including midpoint slot rounding', () => {
    for (const def of DUNGEON_LIST.filter((d) => d.claimKey !== 'owner')) {
      const sample = instanceOrigin(def.index, 2);
      for (const z of [
        sample.z - 250,
        sample.z - 249.9,
        sample.z,
        sample.z + 249.9,
        sample.z + 250,
      ]) {
        // Original world.ts authored-height arms use Math.round at ties;
        // generic dais floors keep dungeonInstanceAt's existing tie behavior.
        const slot = Math.min(23, Math.max(0, Math.round((z + 1250) / 500)));
        const origin = instanceOrigin(def.index, slot);
        for (const x of [sample.x - 12, sample.x, sample.x + 12]) {
          const lx = x - origin.x,
            lz = z - origin.z;
          const lift =
            def.interior === 'wildheart'
              ? wildheartFieldHeight(lx, lz)
              : def.interior === 'lastkeep'
                ? lastKeepLiftAt(lx, lz)
                : def.interior === 'dawnhold'
                  ? dawnholdKeepLiftAt(lx, lz)
                  : dungeonFloorLift(x, z);
          expect(dungeonGroundHeight(x, z), def.id).toBe(DUNGEON_FLOOR_Y + lift);
        }
      }
    }
    expect(dungeonGroundHeight(120400, 0)).toBe(DUNGEON_FLOOR_Y);
  });

  it('builds independent identical wall and collider lists from the authored plan', () => {
    for (const { layout, tier } of homes) {
      const clone = structuredClone(layout);
      expect(authoredWallSegments(layout.rooms!, layout.doors!)).toEqual(
        authoredWallSegments(clone.rooms!, clone.doors!),
      );
      const a = layoutColliders(layout);
      const b = layoutColliders(clone);
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
      expect(a.filter((c) => c.type === 'obb')).toHaveLength(4);
      expect(a.filter((c) => c.type === 'circle')).toHaveLength(tier === 'inn_room' ? 2 : 1);
      for (let i = 0; i < a.length; i++) expect(a[i]).not.toBe(b[i]);
    }
  });

  for (const home of homes) {
    it(`${home.tier} routes representative and boundary slots through its own flat floor and physical walls`, () => {
      const def = DUNGEONS[home.id];
      expect(def.interior).toBe(home.tier);
      expect(INTERIOR_LAYOUTS[home.tier]).toBe(home.layout);
      expect(def.entry).toEqual(FREEHOLD_ENTRY);
      expect(def.exitOffset).toEqual(FREEHOLD_EXIT);
      for (const slot of [0, 1, 23]) {
        const o = instanceOrigin(def.index, slot);
        expect(dungeonInstanceAt(o.x, o.z)?.layout).toBe(home.layout);
        const room = home.layout.rooms![0];
        for (let x = room.x0; x <= room.x1; x += 0.5)
          for (let z = room.z0; z <= room.z1; z += 0.5) {
            expect(home.lift(x, z)).toBe(0);
            expect(dungeonFloorLift(o.x + x, o.z + z)).toBe(0);
            expect(dungeonGroundHeight(o.x + x, o.z + z)).toBe(DUNGEON_FLOOR_Y);
            expect(groundHeight(o.x + x, o.z + z, 42)).toBe(DUNGEON_FLOOR_Y);
          }
        expect(isBlocked(42, o.x + room.x0, o.z, PLAYER_BODY_RADIUS)).toBe(true);
        for (const decor of home.layout.decor!.filter((d) => d.r !== undefined)) {
          expect(isBlocked(42, o.x + decor.x, o.z + decor.z, PLAYER_BODY_RADIUS), decor.key).toBe(
            true,
          );
        }
        for (const point of [def.entry, def.exitOffset]) {
          expect(resolvePosition(42, o.x + point.x, o.z + point.z, PLAYER_BODY_RADIUS)).toEqual({
            x: o.x + point.x,
            z: o.z + point.z,
          });
        }
      }
    });

    it(`${home.tier} protects the full arrival, hearth approach and exit walk`, () => {
      const o = instanceOrigin(DUNGEONS[home.id].index, 0);
      const path = FREEHOLD_PROTECTED_PATHS[home.tier];
      for (let x = path.x0; x <= path.x1; x += 0.5) {
        for (let z = path.z0; z <= path.z1; z += 0.5) {
          expect(isBlocked(42, o.x + x, o.z + z, PLAYER_BODY_RADIUS), `${x},${z}`).toBe(false);
        }
        for (const [fromZ, toZ] of [
          [path.z0, path.z1],
          [path.z1, path.z0],
        ]) {
          const moved = resolveMovement(
            42,
            o.x + x,
            o.z + fromZ,
            o.x + x,
            o.z + toZ,
            PLAYER_BODY_RADIUS,
          );
          expect(moved).toEqual({ x: o.x + x, z: o.z + toZ });
        }
      }
      // Each empty plinth and reserved station has a direct clear approach
      // from the protected aisle, even beside the fixed solids.
      for (const d of home.layout.decor!.filter(
        (d) => d.key.startsWith('plinth_') || d.key === 'station' || d.key === 'strongbox',
      )) {
        const fromZ = Math.min(d.z, path.z1);
        expect(
          resolveMovement(42, o.x, o.z + fromZ, o.x + d.x, o.z + d.z, PLAYER_BODY_RADIUS),
          d.key,
        ).toEqual({ x: o.x + d.x, z: o.z + d.z });
      }
    });
  }
});
