import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, DUNGEON_LIST, INSTANCE_SLOT_COUNT } from '../src/sim/data';
import { spawnStaticWorldObjects } from '../src/sim/ground_object_spawns';
import type { InstanceSlot } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import type { Entity, WorldContent } from '../src/sim/types';
import { bootstrapFreeholdGate } from '../src/sim/world_object_bootstrap';

// Drives the construction the way Sim does: the release's spawnStaticWorldObjects
// with the Freehold Gate on its beforeDungeonDoors hook, over one shared id counter.
function construct(freeholdsEnabled: boolean): {
  entities: Entity[];
  mailboxIds: number[];
  instances: InstanceSlot[];
} {
  const entities: Entity[] = [];
  const mailboxIds: number[] = [];
  const instances: InstanceSlot[] = [];
  const byId = new Map<number, Entity>();
  const ctx: Pick<SimContext, 'nextId' | 'groundPos' | 'addEntity' | 'freeholdsEnabled'> = {
    nextId: 20,
    groundPos: (x, z) => ({ x, y: 7, z }),
    addEntity: (e) => {
      entities.push(e);
      byId.set(e.id, e);
    },
    freeholdsEnabled,
  };
  const world: WorldContent = {
    ...BUILTIN_WORLD,
    groundObjects: [
      {
        itemId: 'herb',
        name: 'Herb',
        positions: [
          { x: 1, z: 2 },
          { x: 3, z: 4 },
        ],
      },
    ],
    services: {
      mailboxes: [{ x: 5, z: 6, facing: 1 }],
      // An arbitrary custom-world site: only a lit host spawns it.
      freeholdGate: { x: -14, z: -92, facing: 0.5 },
    },
  };
  spawnStaticWorldObjects(world, {
    entities: byId,
    allocateEntityId: () => ctx.nextId++,
    groundPos: ctx.groundPos,
    addEntity: ctx.addEntity,
    mailboxIds,
    instances,
    beforeDungeonDoors: () => bootstrapFreeholdGate(ctx, world),
  });
  return { entities, mailboxIds, instances };
}

describe('authored world object construction order', () => {
  it('preserves ground, mailbox and dungeon ids while a dark host has no gate', () => {
    const { entities, mailboxIds, instances } = construct(false);
    expect(entities.slice(0, 3).map((e) => [e.id, e.templateId, e.pos])).toEqual([
      [20, 'ground_herb', { x: 1, y: 7, z: 2 }],
      [21, 'ground_herb', { x: 3, y: 7, z: 4 }],
      [22, 'mailbox', { x: 5, y: 7, z: 6 }],
    ]);
    expect(mailboxIds).toEqual([22]);
    expect(entities[2].facing).toBe(1);
    expect(entities[3].id).toBe(23);
    expect(entities[3].templateId).toBe('dungeon_door');
    expect(entities.filter((e) => e.templateId === 'dungeon_door')).toHaveLength(
      DUNGEON_LIST.filter((d) => d.overworldDoor !== false).length,
    );
    expect(entities.some((e) => e.templateId === 'freehold_gate')).toBe(false);
    expect(instances).toHaveLength(DUNGEON_LIST.length * INSTANCE_SLOT_COUNT);
  });

  it('mints the lit-host gate between the mailboxes and the first dungeon door', () => {
    const dark = construct(false).entities;
    const { entities, instances } = construct(true);
    const gate = entities[3];
    expect([gate.id, gate.templateId, gate.pos, gate.facing, gate.lootable]).toEqual([
      23,
      'freehold_gate',
      { x: -14, y: 7, z: -92 },
      0.5,
      false,
    ]);
    expect(gate.prevFacing).toBe(0.5);
    // Every door sits one id past its dark-host id, in the same order.
    const doors = (list: Entity[]) => list.filter((e) => e.templateId === 'dungeon_door');
    expect(doors(entities).map((e) => e.id)).toEqual(doors(dark).map((e) => e.id + 1));
    expect(instances).toHaveLength(DUNGEON_LIST.length * INSTANCE_SLOT_COUNT);
  });
});
