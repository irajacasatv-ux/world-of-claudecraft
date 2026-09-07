import { describe, expect, it } from 'vitest';
import { bootstrapSurfaceNpcs } from '../src/sim/surface_npc_bootstrap';
import type { Entity, NpcDef } from '../src/sim/types';
import { waterLevel } from '../src/sim/world';

const npc = (id: string, extras: Partial<NpcDef> = {}): NpcDef => ({
  id,
  name: id,
  title: 'Merchant',
  pos: { x: 2, z: 3 },
  facing: 0.5,
  color: 0x123456,
  questIds: ['example_quest'],
  greeting: 'Welcome.',
  ...extras,
});

describe('surface NPC construction', () => {
  function run(freeholdsEnabled: boolean) {
    const entities: Entity[] = [];
    const calls: unknown[] = [];
    const merchantIds = [4];
    const ctx = {
      freeholdsEnabled,
      nextId: 40,
      bankerIds: [5],
      groundPos: (x: number, z: number) => {
        calls.push(['ground', x, z]);
        return { x, y: 7, z };
      },
      addEntity: (entity: Entity) => {
        calls.push(['add', entity.id, entity.templateId]);
        entities.push(entity);
      },
    };
    const definitions = {
      z_first: npc('z_first', { market: true, vendorItems: ['bread'] }),
      a_dynamic: npc('a_dynamic', { dynamic: true, market: true, banker: true }),
      b_banker: npc('b_banker', { banker: true }),
      freehold_furnisher: npc('freehold_furnisher', { vendorItems: ['freehold_low_stool'] }),
      a_last: npc('a_last', { market: true, banker: true }),
    };
    bootstrapSurfaceNpcs(ctx, definitions, merchantIds, (x, z, minHeight) => {
      calls.push(['safe', x, z, minHeight]);
      return { x: x + 10, z: z + 20 };
    });
    return { ctx, entities, calls, merchantIds, definitions };
  }

  it('preserves insertion order, safe-ground call order, ids and both service registries', () => {
    const { ctx, entities, calls, merchantIds, definitions } = run(false);
    expect(entities.map((e) => [e.id, e.templateId])).toEqual([
      [40, 'z_first'],
      [41, 'b_banker'],
      [42, 'a_last'],
    ]);
    expect(ctx.nextId).toBe(43);
    expect(merchantIds).toEqual([4, 40, 42]);
    expect(ctx.bankerIds).toEqual([5, 41, 42]);
    expect(calls).toEqual([
      ['safe', 2, 3, waterLevel() + 0.6],
      ['ground', 12, 23],
      ['add', 40, 'z_first'],
      ['safe', 2, 3, waterLevel() + 0.6],
      ['ground', 12, 23],
      ['add', 41, 'b_banker'],
      ['safe', 2, 3, waterLevel() + 0.6],
      ['ground', 12, 23],
      ['add', 42, 'a_last'],
    ]);
    expect(entities[0]).toMatchObject({
      kind: 'npc',
      name: 'z_first',
      pos: { x: 12, y: 7, z: 23 },
      facing: 0.5,
      color: 0x123456,
      questIds: ['example_quest'],
      vendorItems: ['bread'],
    });
    expect(entities[0].questIds).not.toBe(definitions.z_first.questIds);
    expect(entities[0].vendorItems).not.toBe(definitions.z_first.vendorItems);
  });

  it('the lit arm adds exactly the furnisher at its authored insertion point', () => {
    const { ctx, entities, merchantIds } = run(true);
    expect(entities.map((e) => [e.id, e.templateId])).toEqual([
      [40, 'z_first'],
      [41, 'b_banker'],
      [42, 'freehold_furnisher'],
      [43, 'a_last'],
    ]);
    expect(ctx.nextId).toBe(44);
    expect(merchantIds).toEqual([4, 40, 43]);
    expect(ctx.bankerIds).toEqual([5, 41, 43]);
    expect(entities[2].vendorItems).toEqual(['freehold_low_stool']);
  });
});
