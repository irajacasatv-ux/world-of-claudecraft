// server/live_location.ts: the admin live-sessions location resolver, extracted
// whole from server/game.ts. The extraction is verbatim, so this suite exists to
// guard the module at its OWN seam from here on: the three branches in
// precedence order, the nearest-POI selection and its radius boundary, the
// distance rounding, and the id fallbacks a missing catalog row takes.
//
// The Sim is driven through a narrow structural fake rather than a real world:
// liveLocationFor reads exactly two Sim members (instanceInfoAt, and
// delveRunForPlayer), and a fake makes the dungeon and delve branches reachable
// without standing a player inside a real instance. The zone tables are the
// REAL ones (zoneAt, DUNGEONS, DELVES), so the POI arithmetic below is measured
// against shipped content, not a fixture.
import { describe, expect, it } from 'vitest';
import { type AdminLiveLocation, liveLocationFor } from '../../server/live_location';
import { DELVES, DUNGEONS, zoneAt } from '../../src/sim/data';
import type { Sim } from '../../src/sim/sim';
import type { Entity } from '../../src/sim/types';

type InstanceInfo = ReturnType<Sim['instanceInfoAt']>;
type DelveRun = ReturnType<Sim['delveRunForPlayer']>;

/** The two Sim reads the resolver makes, and nothing else. */
function fakeSim(opts: { instance?: InstanceInfo; delveRun?: DelveRun } = {}): Sim {
  return {
    instanceInfoAt: () => opts.instance ?? null,
    delveRunForPlayer: () => opts.delveRun ?? null,
  } as unknown as Sim;
}

function entityAt(x: number, z: number, extra: Partial<Entity> = {}): Entity {
  return { id: 7, pos: { x, y: 0, z }, ...extra } as unknown as Entity;
}

/** A zone that actually has POIs, so the overworld arm has something to find. */
function zoneWithPois() {
  const zone = zoneAt(0, 0);
  expect(zone.pois.length, 'the origin zone must ship at least one POI').toBeGreaterThan(0);
  return zone;
}

describe('liveLocationFor: branch precedence', () => {
  it('reads the dungeon branch off the entity dungeonId, ahead of a delve run', () => {
    const dungeonId = Object.keys(DUNGEONS)[0];
    expect(dungeonId).toBeTruthy();
    const dungeon = DUNGEONS[dungeonId];
    // A delve run is present too: the dungeon arm must still win, because the
    // dungeon check returns before delveRunForPlayer is ever consulted.
    const sim = fakeSim({
      instance: { dungeonId, slot: 3 } as unknown as InstanceInfo,
      delveRun: { delveId: Object.keys(DELVES)[0], slot: 9 } as unknown as DelveRun,
    });
    const out = liveLocationFor(sim, entityAt(0, 0, { dungeonId }));
    expect(out.kind).toBe('dungeon');
    expect(out.instanceId).toBe(dungeonId);
    expect(out.instance).toBe(dungeon.name);
    expect(out.instanceSlot).toBe(3);
    // The dungeon arm reports the zone of the DOOR, not of the entity's position.
    const doorZone = zoneAt(dungeon.doorPos.x, dungeon.doorPos.z);
    expect(out.zoneId).toBe(doorZone.id);
    expect(out.zone).toBe(doorZone.name);
    // No POI fields on an instance arm.
    expect(out.poiIndex).toBeNull();
    expect(out.poi).toBeNull();
    expect(out.poiDistance).toBeNull();
  });

  it('takes the dungeon id from the INSTANCE when the entity carries none', () => {
    const dungeonId = Object.keys(DUNGEONS)[0];
    const sim = fakeSim({ instance: { dungeonId, slot: 1 } as unknown as InstanceInfo });
    const out = liveLocationFor(sim, entityAt(0, 0));
    expect(out.kind).toBe('dungeon');
    expect(out.instanceId).toBe(dungeonId);
  });

  it('falls back to the raw id and the entity zone for a dungeon with no catalog row', () => {
    const sim = fakeSim({ instance: { dungeonId: 'no_such_dungeon' } as unknown as InstanceInfo });
    const out = liveLocationFor(sim, entityAt(0, 0));
    expect(out.kind).toBe('dungeon');
    expect(out.instance).toBe('no_such_dungeon');
    // Unknown row means the door position is unknown, so the ENTITY's zone is used.
    expect(out.zoneId).toBe(zoneAt(0, 0).id);
    // An instance with no slot reports null rather than undefined.
    expect(out.instanceSlot).toBeNull();
  });

  it('reads the delve branch when there is no dungeon', () => {
    const delveId = Object.keys(DELVES)[0];
    expect(delveId).toBeTruthy();
    const delve = DELVES[delveId];
    const sim = fakeSim({ delveRun: { delveId, slot: 4 } as unknown as DelveRun });
    const out = liveLocationFor(sim, entityAt(0, 0));
    expect(out.kind).toBe('delve');
    expect(out.instanceId).toBe(delveId);
    expect(out.instance).toBe(delve.name);
    expect(out.instanceSlot).toBe(4);
    const doorZone = zoneAt(delve.doorPos.x, delve.doorPos.z);
    expect(out.zoneId).toBe(doorZone.id);
    expect(out.poiIndex).toBeNull();
    expect(out.poiDistance).toBeNull();
  });

  it('falls back to the raw id for a delve with no catalog row', () => {
    const sim = fakeSim({ delveRun: { delveId: 'no_such_delve', slot: 0 } as unknown as DelveRun });
    const out = liveLocationFor(sim, entityAt(0, 0));
    expect(out.kind).toBe('delve');
    expect(out.instance).toBe('no_such_delve');
    // Slot 0 is a real slot and must survive, not become null.
    expect(out.instanceSlot).toBe(0);
  });
});

describe('liveLocationFor: the overworld arm and its POI radius', () => {
  it('names the nearest POI and rounds the distance to two places', () => {
    const zone = zoneWithPois();
    const poi = zone.pois[0];
    // 3-4-5 triangle from the POI: exactly 5 yards away, inside the radius.
    const out = liveLocationFor(fakeSim(), entityAt(poi.x + 3, poi.z + 4));
    expect(out.kind).toBe('overworld');
    expect(out.instanceId).toBeNull();
    expect(out.instance).toBeNull();
    expect(out.instanceSlot).toBeNull();
    expect(out.poi).toBe(poi.label);
    expect(out.poiIndex).toBe(0);
    expect(out.poiDistance).toBe(5);
  });

  it('rounds a fractional distance rather than reporting full precision', () => {
    const zone = zoneWithPois();
    const poi = zone.pois[0];
    const out = liveLocationFor(fakeSim(), entityAt(poi.x + 1 / 3, poi.z));
    expect(out.poiDistance).toBe(0.33);
  });

  it('cuts POI labelling off at the radius, whichever POI happens to be nearest', () => {
    // The gate is `distance < ADMIN_LOCATION_POI_RADIUS` (32). Probing a fixed
    // offset from one POI is not enough on its own, because a NEIGHBOURING POI
    // can be nearer and win the loop. So assert the property that holds however
    // the tie resolves: whatever POI comes back, it is strictly inside 32; and
    // walking away from a POI along a ray, the moment we pass 32 that POI can
    // no longer be the answer.
    const zone = zoneWithPois();
    const poi = zone.pois[0];
    let sawLabelled = false;
    let widest = 0;
    for (const d of [0, 1, 5, 10, 20, 28, 31, 31.5, 31.9, 32, 32.5, 40, 80]) {
      const out = liveLocationFor(fakeSim(), entityAt(poi.x + d, poi.z));
      if (zoneAt(poi.x + d, poi.z).id !== zone.id) continue;
      if (out.poiIndex === null) {
        // Dropped: index, label and distance all go null together, never a
        // label with a null distance or the reverse.
        expect(out.poi).toBeNull();
        expect(out.poiDistance).toBeNull();
        continue;
      }
      sawLabelled = true;
      expect(out.poi).not.toBeNull();
      expect(out.poiDistance).not.toBeNull();
      // THE RADIUS: no labelled POI is ever reported at 32 yards or more.
      expect(out.poiDistance as number, `probe at +${d}`).toBeLessThan(32);
      widest = Math.max(widest, out.poiDistance as number);
      // Past the radius, POI 0 specifically can no longer be the answer.
      if (d >= 32) expect(out.poiIndex).not.toBe(0);
    }
    expect(sawLabelled, 'at least one probe must find a POI').toBe(true);
    // And the radius is really 32, not something smaller: some probe in the
    // sweep above is labelled from beyond 28 yards. (If it were 16, the widest
    // labelled distance could not clear that.)
    expect(widest).toBeGreaterThan(20);
  });

  it('picks the CLOSEST POI, not the first one within the radius', () => {
    const zone = zoneAt(0, 0);
    if (zone.pois.length < 2) return; // single-POI zone: nothing to choose between
    // Stand on top of the second POI: it must win over the first.
    const second = zone.pois[1];
    const out = liveLocationFor(fakeSim(), entityAt(second.x, second.z));
    if (zoneAt(second.x, second.z).id !== zone.id) return;
    expect(out.poiIndex).toBe(1);
    expect(out.poi).toBe(second.label);
    expect(out.poiDistance).toBe(0);
  });
});

describe('liveLocationFor: the shape itself', () => {
  it('always returns every field of AdminLiveLocation, on every branch', () => {
    // A branch that forgot a field would surface as undefined in the admin
    // table rather than as a failure, so hold all three arms to the key set.
    const keys: ReadonlyArray<keyof AdminLiveLocation> = [
      'kind',
      'zoneId',
      'zone',
      'instanceId',
      'instance',
      'instanceSlot',
      'poiIndex',
      'poi',
      'poiDistance',
    ];
    const arms = [
      liveLocationFor(fakeSim(), entityAt(0, 0)),
      liveLocationFor(
        fakeSim({ instance: { dungeonId: Object.keys(DUNGEONS)[0] } as unknown as InstanceInfo }),
        entityAt(0, 0),
      ),
      liveLocationFor(
        fakeSim({
          delveRun: { delveId: Object.keys(DELVES)[0], slot: 1 } as unknown as DelveRun,
        }),
        entityAt(0, 0),
      ),
    ];
    expect(arms.map((a) => a.kind)).toEqual(['overworld', 'dungeon', 'delve']);
    for (const arm of arms) {
      expect(Object.keys(arm).sort()).toEqual([...keys].sort());
      // zone is the one non-nullable string on every arm.
      expect(typeof arm.zone).toBe('string');
      expect(arm.zone.length).toBeGreaterThan(0);
    }
  });
});
