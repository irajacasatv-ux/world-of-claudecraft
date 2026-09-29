// A built-in world holding only the named overworld NPCs: no camps, no other
// NPC and no ground object. A case that talks to a quest giver, a trainer, a
// vendor or a forge NPC needs that NPC standing where the shipped world puts it
// and nothing else; every other NPC and camp is construction and tick cost the
// case never reads (tests/CLAUDE.md "Test cost"). Terrain, props and services
// are the built-in ones, unchanged. A case that needs no NPC at all takes
// EMPTY_TEST_WORLD from tests/sim_shared.ts instead.
import { BUILTIN_WORLD } from '../../src/sim/data';
import type { WorldContent } from '../../src/sim/types';

export function worldWithOnlyNpcs(...ids: string[]): WorldContent {
  const npcs: WorldContent['npcs'] = {};
  for (const id of ids) {
    const def = BUILTIN_WORLD.npcs[id];
    if (!def) throw new Error(`no built-in NPC ${id}`);
    npcs[id] = def;
  }
  return { ...BUILTIN_WORLD, camps: [], npcs, groundObjects: [] };
}
