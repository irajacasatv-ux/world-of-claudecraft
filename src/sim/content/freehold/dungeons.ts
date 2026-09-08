import type { DungeonDef } from '../../types';

// The two freehold rooms ride the dungeon slot pool owner-keyed (D15): every
// `InstanceSlot` of these records is claimed by the host-stamped owner key that
// src/sim/freehold/ resolves, never by a party key. Both rooms are combat-free
// (`spawns: []`, so a claim draws no rng), have no overworld door (the Eastbrook
// gate of the interiors slice is the only way in, so no `dungeon_door` entity is
// spawned and no map portal or calm-anchor pad is minted), stay out of the
// public Guide, the Dungeon Finder and the `/dungeons` chat readout (which
// skips every `claimKey: 'owner'` record), and use the plain crypt kit as a
// stand-in interior until the authored room layouts replace it.
//
// Both records carry NO `objects` on purpose: a placed object would pull in
// the Reliquary obligation for its item, so the instance-placement sweep in
// tests/fixes.test.ts gates only its encounter-count expectation on the key
// (its entry and unblocked-ground assertions still run for both rooms).
// Every `enterText`/`leaveText` line must stay unique across DUNGEON_LIST: the
// HUD localizes the raw log line by exact match against the def string and
// resolves it through `entities.dungeons.<id>.<field>`, whose English derives
// from these values (src/ui/world_entity_i18n.ts DUNGEON_IDS).
//
// `doorPos` is only where leaving drops the player: the planned Eastbrook quay
// gate spot beside the mailbox (SERVICES.mailbox at { x: -10, z: -98 }); the
// interiors slice moves the gate entity itself to its final authored position.
// Overflow band: the forge lift took 14, so the Inn Room claims 15 and the
// Cottage 16 (instanceOriginX: 119200 and 119800).
const FREEHOLD_GATE_DOOR_POS = { x: -14, z: -96 } as const;

export const FREEHOLD_INN_ROOM_DUNGEON_ID = 'freehold_inn_room';
export const FREEHOLD_COTTAGE_DUNGEON_ID = 'freehold_cottage';

export const FREEHOLD_DUNGEON_DEFS: Record<string, DungeonDef> = {
  [FREEHOLD_INN_ROOM_DUNGEON_ID]: {
    id: FREEHOLD_INN_ROOM_DUNGEON_ID,
    name: 'Inn Room',
    index: 15,
    claimKey: 'owner',
    doorPos: { ...FREEHOLD_GATE_DOOR_POS },
    overworldDoor: false,
    guideVisible: false,
    // Clear-of-aggro arrival on the open crypt floor (the hollow_crypt shape).
    entry: { x: 0, z: -2 },
    exitOffset: { x: 0, z: -6 },
    spawns: [],
    interior: 'crypt',
    suggestedPlayers: 1,
    enterText: 'You climb the inn stairs and let yourself into your rented room.',
    leaveText: 'You lock the room behind you and step back out onto the quay.',
  },
  [FREEHOLD_COTTAGE_DUNGEON_ID]: {
    id: FREEHOLD_COTTAGE_DUNGEON_ID,
    name: 'Cottage',
    index: 16,
    claimKey: 'owner',
    doorPos: { ...FREEHOLD_GATE_DOOR_POS },
    overworldDoor: false,
    guideVisible: false,
    entry: { x: 0, z: -2 },
    exitOffset: { x: 0, z: -6 },
    spawns: [],
    interior: 'crypt',
    suggestedPlayers: 1,
    enterText: 'You push open the garden gate and step into your own cottage.',
    leaveText: 'You latch the cottage gate behind you and return to the quay.',
  },
};
