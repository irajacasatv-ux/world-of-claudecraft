// The opt-in Freehold Gate's construction. Sim's bootstrap runs it from
// spawnStaticWorldObjects' beforeDungeonDoors hook (ground_object_spawns.ts), so a
// lit world mints the gate between the mailboxes and the dungeon doors and a dark
// world's ids hold. Draws no RNG; state stays on Sim through the live seam.
import { createGroundObject } from './entity';
import { FREEHOLD_GATE_TEMPLATE_ID } from './freehold/gate_rules';
import type { SimContext } from './sim_context';
import type { WorldContent } from './types';

type GateBootstrapContext = Pick<
  SimContext,
  'nextId' | 'groundPos' | 'addEntity' | 'freeholdsEnabled'
>;

export function bootstrapFreeholdGate(ctx: GateBootstrapContext, worldContent: WorldContent): void {
  const site = worldContent.services?.freeholdGate;
  if (!ctx.freeholdsEnabled || !site) return;
  const gate = createGroundObject(ctx.nextId++, '', 'Freehold Gate', ctx.groundPos(site.x, site.z));
  gate.templateId = FREEHOLD_GATE_TEMPLATE_ID;
  gate.objectItemId = null;
  gate.lootable = false;
  gate.respawnTimer = Infinity;
  gate.facing = site.facing ?? 0;
  gate.prevFacing = gate.facing;
  ctx.addEntity(gate);
}
