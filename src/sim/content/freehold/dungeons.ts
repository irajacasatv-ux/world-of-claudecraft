import { EASTBROOK_LAYOUT } from '../../eastbrook_layout';
import type { DungeonDef } from '../../types';
import { FREEHOLD_ENTRY, FREEHOLD_EXIT } from './layouts';

// Owner-keyed, combat-free rooms share the authored quay service. No ordinary
// overworld door, finder activity or loot object is constructed for a home.
// The shared exit and saved-inside rejoin inset is 4 yards south of this site,
// on open ground at (-38.65,-107.75) off the east road, across from the inn door.
const FREEHOLD_GATE_DOOR_POS = EASTBROOK_LAYOUT.services.freeholdGate.position;

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
    entry: { ...FREEHOLD_ENTRY },
    exitOffset: { ...FREEHOLD_EXIT },
    spawns: [],
    interior: 'inn_room',
    suggestedPlayers: 1,
    enterText: 'You climb the inn stairs and let yourself into your room.',
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
    entry: { ...FREEHOLD_ENTRY },
    exitOffset: { ...FREEHOLD_EXIT },
    spawns: [],
    interior: 'cottage',
    suggestedPlayers: 1,
    enterText: 'You push open the garden gate and step into your own cottage.',
    leaveText: 'You latch the cottage gate behind you and return to the quay.',
  },
};
