// A test world that keeps only the named built-in NPCs: no camps, no ground
// objects, and none of the other overworld NPCs, whose placement is most of a
// full-world Sim's construction cost. Everything else (zones, roads, services
// such as stations and mailboxes) is the built-in world's, as in
// EMPTY_TEST_WORLD (tests/sim_shared.ts), so a case that stands a player at a
// merchant, a vendor or a quest giver keeps the real NPC and its real position.
// Build it once at module scope and pass it as `world:` to every Sim that needs
// it.
import { BUILTIN_WORLD } from '../../src/sim/data';
import type { NpcDef, WorldContent } from '../../src/sim/types';

export function npcScopedWorld(...npcIds: string[]): WorldContent {
  const npcs: Record<string, NpcDef> = {};
  for (const id of npcIds) {
    const npc = BUILTIN_WORLD.npcs[id];
    if (!npc) throw new Error(`no built-in NPC ${id}`);
    npcs[id] = npc;
  }
  return { ...BUILTIN_WORLD, camps: [], npcs, groundObjects: [] };
}
