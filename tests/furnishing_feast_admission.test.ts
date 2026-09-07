import { afterEach, describe, expect, it, vi } from 'vitest';

const FIXTURE = vi.hoisted(() => ({
  furnishingTemplate: 'test_furnishing_feast_table',
  feastId: 'test_furnishing_feast_control',
  feastTemplate: 'test_real_feast_table',
  food: {
    id: 'test_furnishing_feast_dish',
    name: 'Control Dish',
    kind: 'food' as const,
    sellValue: 1,
    foodHp: 180,
    wellFed: { aura: 'Control Meal', kind: 'buff_sta' as const, value: 7, duration: 120 },
  },
}));

// The family census runs at module evaluation. Supply synthetic content before
// the real module loads so a furnishing cannot escape the census test by timing.
vi.mock('../src/sim/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/sim/data')>();
  const { FURNISHING } = await import('./fixtures/furnishing_item');
  const feast = {
    templateId: FIXTURE.feastTemplate,
    charges: 3,
    durationTicks: 200,
    dishItemId: FIXTURE.food.id,
  };
  return {
    ...actual,
    ITEMS: {
      ...actual.ITEMS,
      [FIXTURE.food.id]: FIXTURE.food,
      [FIXTURE.feastId]: {
        ...actual.ITEMS.harvest_feast,
        id: FIXTURE.feastId,
        feast,
      },
      [FURNISHING.id]: {
        ...FURNISHING,
        foodHp: 180,
        wellFed: FIXTURE.food.wellFed,
        feast: { ...feast, templateId: FIXTURE.furnishingTemplate },
      },
    },
  };
});

import { ITEMS } from '../src/sim/data';
import {
  consumeFeastAction,
  feastOwnerKey,
  feastTemplateIds,
  isApexFeastRecipe,
  isFeastTemplateId,
  placeFeastAction,
} from '../src/sim/professions/feast';
import { Sim } from '../src/sim/sim';
import { FURNISHING } from './fixtures/furnishing_item';
import { EMPTY_TEST_WORLD } from './sim_shared';

afterEach(() => vi.restoreAllMocks());

function world() {
  const sim = new Sim({
    seed: 42,
    playerClass: 'warrior',
    autoEquip: false,
    world: EMPTY_TEST_WORLD,
  });
  sim.tick();
  sim.inventory.splice(
    0,
    sim.inventory.length,
    { itemId: FURNISHING.id, count: 1, instance: { signer: 'Table Maker' } },
    { itemId: FIXTURE.feastId, count: 1 },
  );
  sim.drainEvents();
  return sim;
}

function snapshot(sim: Sim) {
  return structuredClone({
    character: sim.serializeCharacter(sim.playerId),
    meta: sim.meta(sim.playerId),
    entities: [...sim.entities],
    feasts: [...sim.ctx.feasts],
    nextId: sim.ctx.nextId,
  });
}

function withoutMutation(sim: Sim, invoke: () => void) {
  const before = snapshot(sim);
  const draws = vi.spyOn(sim.rng, 'next');
  invoke();
  expect(snapshot(sim)).toEqual(before);
  expect(draws).not.toHaveBeenCalled();
  draws.mockRestore();
  expect(sim.countItem(FURNISHING.id)).toBe(1);
  expect(sim.drainEvents()).toEqual([]);
}

describe('furnishing feast admission', () => {
  it('excludes a furnishing from the template census and includes a real feast', () => {
    const def = ITEMS[FURNISHING.id];
    expect('feast' in def && def.feast?.templateId).toBe(FIXTURE.furnishingTemplate);
    expect(isFeastTemplateId(FIXTURE.furnishingTemplate)).toBe(false);
    expect(feastTemplateIds()).not.toContain(FIXTURE.furnishingTemplate);
    expect(isFeastTemplateId(FIXTURE.feastTemplate)).toBe(true);
    expect(feastTemplateIds()).toContain(FIXTURE.feastTemplate);
  });

  it('does not grant apex feast credit to a furnishing recipe at the cooking cap', () => {
    expect(
      isApexFeastRecipe({ professionId: 'cooking', resultItemId: FURNISHING.id, skillReq: 125 }),
    ).toBe(false);
    expect(
      isApexFeastRecipe({ professionId: 'cooking', resultItemId: FIXTURE.feastId, skillReq: 125 }),
    ).toBe(true);
  });

  it.each(['named slot', 'legacy item id'] as const)(
    'refuses direct furnishing placement via %s and places the real feast',
    (selection) => {
      const sim = world();
      const meta = sim.meta(sim.playerId)!;
      const named = selection === 'named slot';
      expect(sim.countItem(FURNISHING.id)).toBe(1);
      expect(sim.countItem(FIXTURE.feastId)).toBe(1);
      withoutMutation(sim, () =>
        placeFeastAction(sim.ctx, sim.player, meta, named ? 0 : undefined, FURNISHING.id),
      );
      expect(sim.ctx.feasts.size).toBe(0);

      placeFeastAction(sim.ctx, sim.player, meta, named ? 1 : undefined, FIXTURE.feastId);

      expect(sim.countItem(FIXTURE.feastId)).toBe(0);
      expect(sim.countItem(FURNISHING.id)).toBe(1);
      expect(sim.ctx.feasts.size).toBe(1);
      const [[id, feast]] = [...sim.ctx.feasts];
      expect(sim.entities.get(id)?.templateId).toBe(FIXTURE.feastTemplate);
      expect(feast.charges).toBe(3);
      expect(feast.dishItemId).toBe(FIXTURE.food.id);
      expect(feast.expiresAtTick).toBe(sim.tickCount + 200);
      expect(sim.drainEvents()).toContainEqual({
        type: 'farmFeastPlaced',
        pid: sim.playerId,
        feastId: id,
      });
    },
  );

  it('refuses a furnishing dish before consuming a serving and accepts the food control', () => {
    const sim = world();
    const meta = sim.meta(sim.playerId)!;
    placeFeastAction(sim.ctx, sim.player, meta, 1, FIXTURE.feastId);
    const [[id, feast]] = [...sim.ctx.feasts];
    feast.dishItemId = FURNISHING.id;
    sim.drainEvents();
    expect(feast.charges).toBe(3);
    expect(sim.player.eating).toBeNull();

    withoutMutation(sim, () => consumeFeastAction(sim.ctx, sim.player, meta, id));

    expect(feast.charges).toBe(3);
    expect(feast.eatenBy.size).toBe(0);
    expect(sim.player.eating).toBeNull();
    feast.dishItemId = FIXTURE.food.id;
    consumeFeastAction(sim.ctx, sim.player, meta, id);
    expect(feast.charges).toBe(2);
    expect(feast.eatenBy).toEqual(new Set([feastOwnerKey(meta)]));
    expect(sim.player.sitting).toBe(true);
    expect(sim.player.eating).toEqual({
      itemId: FIXTURE.food.id,
      hpPer2s: 20,
      manaPer2s: 0,
      remaining: 18,
      ticksElapsed: 0,
      kind: 'food',
      wellFed: { aura: 'Control Meal', kind: 'buff_sta', value: 7, duration: 120 },
    });
    expect(sim.drainEvents()).toContainEqual({
      type: 'heal',
      targetId: sim.playerId,
      amount: 0,
      source: 'food',
      sfxTick: true,
    });
  });
});
