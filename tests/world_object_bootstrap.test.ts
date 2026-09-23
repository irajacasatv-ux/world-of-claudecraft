import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, DUNGEON_LIST, INSTANCE_SLOT_COUNT } from '../src/sim/data';
import type { SimContext } from '../src/sim/sim_context';
import type { Entity } from '../src/sim/types';
import { bootstrapWorldObjects } from '../src/sim/world_object_bootstrap';

describe('authored world object construction order', () => {
  it('preserves ground, mailbox and dungeon ids while a dark host has no gate', () => {
    const entities: Entity[] = [];
    const mailboxIds: number[] = [];
    const ctx: Pick<
      SimContext,
      'nextId' | 'groundPos' | 'addEntity' | 'instances' | 'freeholdsEnabled'
    > = {
      nextId: 20,
      groundPos: (x, z) => ({ x, y: 7, z }),
      addEntity: (e) => {
        entities.push(e);
      },
      instances: [],
      freeholdsEnabled: false,
    };
    bootstrapWorldObjects(
      ctx,
      {
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
          // An arbitrary custom-world site: a dark host spawns no gate anywhere.
          freeholdGate: { x: -14, z: -92 },
        },
      },
      mailboxIds,
    );
    expect(entities.slice(0, 3).map((e) => [e.id, e.templateId, e.pos])).toEqual([
      [20, 'ground_herb', { x: 1, y: 7, z: 2 }],
      [21, 'ground_herb', { x: 3, y: 7, z: 4 }],
      [22, 'mailbox', { x: 5, y: 7, z: 6 }],
    ]);
    expect(mailboxIds).toEqual([22]);
    expect(entities[2].facing).toBe(1);
    expect(entities[3].id).toBe(23);
    expect(entities.filter((e) => e.templateId === 'dungeon_door')).toHaveLength(
      DUNGEON_LIST.filter((d) => d.overworldDoor !== false).length,
    );
    expect(entities.some((e) => e.templateId === 'freehold_gate')).toBe(false);
    expect(ctx.instances).toHaveLength(DUNGEON_LIST.length * INSTANCE_SLOT_COUNT);
  });
});
