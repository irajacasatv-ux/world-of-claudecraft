import { describe, expect, it } from 'vitest';
import { instancePresenceFor, relayZoneFor } from '../../server/instance_presence';
import { DUNGEONS, delveOrigin, instanceOrigin, zoneAt } from '../../src/sim/data';

const at = (x: number, z: number, dungeonId: string | null = null) => ({
  pos: { x, y: 0, z },
  dungeonId,
});

describe('instancePresenceFor', () => {
  it.each(['freehold_inn_room', 'freehold_cottage'])(
    'classifies %s by public catalog claim kind, including a player with no dungeonId',
    (id) => {
      const def = DUNGEONS[id];
      const origin = instanceOrigin(def.index, 3);
      expect(instancePresenceFor(at(origin.x, origin.z))).toEqual({
        zone: def.name,
        status: 'freehold',
      });
      expect(instancePresenceFor(at(0, 0, id))).toEqual({ zone: def.name, status: 'freehold' });
    },
  );

  it('preserves ordinary dungeon and delve classification', () => {
    const dungeon = DUNGEONS.hollow_crypt;
    const origin = instanceOrigin(dungeon.index, 0);
    expect(instancePresenceFor(at(origin.x, origin.z))).toEqual({
      zone: dungeon.name,
      status: 'dungeon',
    });
    const delve = delveOrigin(0, 0);
    expect(instancePresenceFor(at(delve.x, delve.z))).toEqual({
      zone: 'The Collapsed Reliquary',
      status: 'dungeon',
    });
  });

  it('uses explicit ids before positions and preserves the unknown-id fallback', () => {
    const origin = instanceOrigin(DUNGEONS.freehold_inn_room.index, 0);
    expect(instancePresenceFor(at(origin.x, origin.z, 'hollow_crypt'))).toEqual({
      zone: 'The Hollow Crypt',
      status: 'dungeon',
    });
    expect(instancePresenceFor(at(0, 0, 'unknown_dungeon'))).toEqual({
      zone: 'unknown_dungeon',
      status: 'dungeon',
    });
  });

  it('resolves the saved spectator position rather than the parked live pose', () => {
    const home = instanceOrigin(DUNGEONS.freehold_cottage.index, 2);
    const entity = at(0, 0);
    expect(instancePresenceFor(entity)).toBeNull();
    expect(instancePresenceFor(entity, home)).toEqual({
      zone: DUNGEONS.freehold_cottage.name,
      status: 'freehold',
    });
    expect(instancePresenceFor(at(home.x, home.z), { x: 0, z: 0 })).toBeNull();
  });
});

describe('relayZoneFor', () => {
  it.each(['freehold_inn_room', 'freehold_cottage'])(
    'reports only the Freehold category for a positional %s with no dungeonId',
    (id) => {
      const origin = instanceOrigin(DUNGEONS[id].index, 5);
      const entity = { ...at(origin.x, origin.z), ownerId: 123, partyKey: 'owner:123' };
      expect(relayZoneFor(entity)).toBe('Freehold');
      expect(relayZoneFor(at(0, 0), origin)).toBe('Freehold');
    },
  );

  it('keeps ordinary dungeon labels and the overworld zone fallback', () => {
    expect(relayZoneFor(at(0, 0, 'hollow_crypt'))).toBe('The Hollow Crypt');
    expect(relayZoneFor(at(0, 0))).toBe(zoneAt(0, 0).name);
  });
});
