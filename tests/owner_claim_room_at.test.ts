// isOwnerClaimRoomAt (src/sim/data.ts): the one position read for "inside a
// freehold room", shared by the instance claim lookup, the World PvP ground
// and the honor Vitality context. It answers from the x band alone, like
// dungeonAt, so it must hold across every slot of both owner rooms, anywhere
// inside a room's band (to 299 yd either side of its origin), and nowhere else:
// not at the 300 yd band edge where the lookup flips, not a party dungeon, not
// the neighbouring bands, and never the overworld.
import { describe, expect, it } from 'vitest';
import {
  DUNGEON_LIST,
  DUNGEON_X_THRESHOLD,
  INSTANCE_SLOT_COUNT,
  instanceOrigin,
  isOwnerClaimRoomAt,
  ZONES,
} from '../src/sim/data';

const OWNER_ROOMS = DUNGEON_LIST.filter((def) => def.claimKey === 'owner');

describe('isOwnerClaimRoomAt', () => {
  it('is true across every slot of both owner rooms and inside each band', () => {
    expect(OWNER_ROOMS.map((def) => def.id)).toEqual(['freehold_inn_room', 'freehold_cottage']);
    for (const def of OWNER_ROOMS) {
      for (let slot = 0; slot < INSTANCE_SLOT_COUNT; slot++) {
        const { x } = instanceOrigin(def.index, slot);
        expect(isOwnerClaimRoomAt(x), `${def.id} slot ${slot}`).toBe(true);
        expect(isOwnerClaimRoomAt(x - 299), `${def.id} west edge`).toBe(true);
        expect(isOwnerClaimRoomAt(x + 299), `${def.id} east edge`).toBe(true);
      }
    }
  });

  it('is false for every other dungeon and past the owner bands', () => {
    for (const def of DUNGEON_LIST.filter((d) => d.claimKey !== 'owner')) {
      expect(isOwnerClaimRoomAt(instanceOrigin(def.index, 0).x), def.id).toBe(false);
    }
    const inn = instanceOrigin(OWNER_ROOMS[0].index, 0).x;
    const cottage = instanceOrigin(OWNER_ROOMS[1].index, 0).x;
    // One band west of the Inn Room and one band east of the Cottage.
    expect(isOwnerClaimRoomAt(inn - 600)).toBe(false);
    expect(isOwnerClaimRoomAt(cottage + 600)).toBe(false);
    // The exact band edges, where dungeonAt's `< 300` overflow check flips: the
    // outer edges read false (a `<= 300` mutant answers true at both).
    expect(isOwnerClaimRoomAt(inn - 300)).toBe(false);
    expect(isOwnerClaimRoomAt(cottage + 300)).toBe(false);
  });

  it('is false on the overworld and at the instance threshold', () => {
    for (const zone of ZONES) expect(isOwnerClaimRoomAt(zone.hub.x), zone.id).toBe(false);
    expect(isOwnerClaimRoomAt(DUNGEON_X_THRESHOLD)).toBe(false);
  });
});
