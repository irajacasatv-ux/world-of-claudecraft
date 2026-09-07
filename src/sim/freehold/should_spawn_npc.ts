import { FREEHOLD_FURNISHER_NPC_ID } from '../content/freehold';
import type { NpcDef } from '../types';

/** Authored surface NPC admission, shared by all hosts at world construction. */
export function shouldSpawnSurfaceNpc(
  npc: Pick<NpcDef, 'id' | 'dynamic'>,
  freeholdsEnabled: boolean,
): boolean {
  return !npc.dynamic && (npc.id !== FREEHOLD_FURNISHER_NPC_ID || freeholdsEnabled);
}
