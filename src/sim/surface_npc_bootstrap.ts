import { createNpc } from './entity';
import { shouldSpawnSurfaceNpc } from './freehold';
import type { SimContext } from './sim_context';
import type { NpcDef } from './types';
import { waterLevel } from './world';

type SurfaceNpcContext = Pick<
  SimContext,
  'nextId' | 'groundPos' | 'addEntity' | 'bankerIds' | 'freeholdsEnabled'
>;

/** Keep authored insertion order and finish service anchors before the market seeds. */
export function bootstrapSurfaceNpcs(
  ctx: SurfaceNpcContext,
  definitions: Readonly<Record<string, NpcDef>>,
  merchantIds: number[],
  findSafePos: (x: number, z: number, minHeight: number) => { x: number; z: number },
): void {
  for (const npcDef of Object.values(definitions)) {
    if (!shouldSpawnSurfaceNpc(npcDef, ctx.freeholdsEnabled)) continue;
    const safe = findSafePos(npcDef.pos.x, npcDef.pos.z, waterLevel() + 0.6);
    const npc = createNpc(ctx.nextId++, npcDef, ctx.groundPos(safe.x, safe.z));
    ctx.addEntity(npc);
    if (npcDef.market) merchantIds.push(npc.id);
    if (npcDef.banker) ctx.bankerIds.push(npc.id);
  }
}
