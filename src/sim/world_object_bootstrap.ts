// One construction-order pass for authored ground objects and service objects.
// State stays on Sim; the injected live seam preserves entity IDs and RNG order.
import { DUNGEON_LIST, INSTANCE_SLOT_COUNT } from './data';
import { createGroundObject } from './entity';
import { FREEHOLD_GATE_TEMPLATE_ID } from './freehold/gate_rules';
import { freshInstanceSlot } from './instances/instance_slot';
import type { SimContext } from './sim_context';
import type { WorldContent } from './types';

type ObjectBootstrapContext = Pick<
  SimContext,
  'nextId' | 'groundPos' | 'addEntity' | 'instances' | 'freeholdsEnabled'
>;

export function bootstrapWorldObjects(
  ctx: ObjectBootstrapContext,
  worldContent: WorldContent,
  mailboxIds: number[],
): void {
  for (const objDef of worldContent.groundObjects) {
    for (const p of objDef.positions) {
      const obj = createGroundObject(
        ctx.nextId++,
        objDef.itemId,
        objDef.name,
        ctx.groundPos(p.x, p.z),
      );
      ctx.addEntity(obj);
    }
  }

  // Ravenpost mailboxes: one interactable raven pillar per town, spawned at
  // its exact authored spot (the noticeboard pattern): the pillar is solid
  // civic furniture with a static collider at this position, so the spawn
  // must never relocate away from it (findSafePos would, since the collider
  // sits exactly here). Draws no rng.
  for (const boxDef of worldContent.services?.mailboxes ?? []) {
    const box = createGroundObject(ctx.nextId++, '', 'Mailbox', ctx.groundPos(boxDef.x, boxDef.z));
    box.templateId = 'mailbox';
    box.objectItemId = null;
    box.lootable = true; // interactable
    if (boxDef.facing !== undefined) box.facing = boxDef.facing;
    ctx.addEntity(box);
    mailboxIds.push(box.id);
  }

  const site = worldContent.services?.freeholdGate;
  if (ctx.freeholdsEnabled && site) {
    const gate = createGroundObject(
      ctx.nextId++,
      '',
      'Freehold Gate',
      ctx.groundPos(site.x, site.z),
    );
    gate.templateId = FREEHOLD_GATE_TEMPLATE_ID;
    gate.objectItemId = null;
    gate.lootable = false;
    gate.respawnTimer = Infinity;
    gate.facing = site.facing ?? 0;
    gate.prevFacing = gate.facing;
    ctx.addEntity(gate);
  }
  // Dungeon entrances + their private instance slots
  for (const dungeon of DUNGEON_LIST) {
    if (dungeon.overworldDoor === false) {
      for (let i = 0; i < INSTANCE_SLOT_COUNT; i++) {
        ctx.instances.push(freshInstanceSlot(dungeon.id, i));
      }
      continue;
    }
    const doorName = dungeon.id === 'nythraxis_crypt' ? 'Abandoned Crypt' : dungeon.name;
    const door = createGroundObject(
      ctx.nextId++,
      '',
      doorName,
      ctx.groundPos(dungeon.doorPos.x, dungeon.doorPos.z),
    );
    door.templateId = 'dungeon_door';
    door.dungeonId = dungeon.id;
    door.objectItemId = null;
    door.lootable = true; // interactable
    ctx.addEntity(door);
    for (let i = 0; i < INSTANCE_SLOT_COUNT; i++) {
      ctx.instances.push(freshInstanceSlot(dungeon.id, i));
    }
  }
}
