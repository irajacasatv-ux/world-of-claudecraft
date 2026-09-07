import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as collections from '../src/sim/content/crucible_collections';
import * as recipes from '../src/sim/content/recipes';
import { ITEMS } from '../src/sim/data';
import { withPerfectingBonus } from '../src/sim/professions/perfecting_bonus';
import { capturePerfectItemRef } from '../src/sim/professions/perfecting_copy';
import {
  perfectingSwapInfoFrom,
  swapPerfectingRanks,
} from '../src/sim/professions/perfecting_swap';
import type { ProfessionRecipeRecord } from '../src/sim/professions/types';
import { Sim } from '../src/sim/sim';
import type { ItemDef, ItemInstancePayload } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';
import { EMPTY_TEST_WORLD } from './sim_shared';

const SOURCE = 'test_furnishing_collection_source';
const TARGET = 'test_furnishing_collection_target';
const RECIPE: ProfessionRecipeRecord = {
  id: 'test_furnishing_collection_recipe',
  professionId: 'armorcrafting',
  itemLevelBudget: 1,
  resultItemId: SOURCE,
  resultCount: 1,
  reagents: [],
  skillReq: 1,
  level: 1,
};
const gear = (id: string): ItemDef => ({
  id,
  name: 'Test Armor',
  kind: 'armor',
  armorType: 'mail',
  slot: 'helmet',
  quality: 'rare',
  sellValue: 1,
  stats: { str: 10 },
});

beforeEach(() => {
  ITEMS[SOURCE] = gear(SOURCE);
  ITEMS[TARGET] = gear(TARGET);
  vi.spyOn(collections, 'crucibleCollectionForItem').mockImplementation((id) =>
    id === SOURCE || id === TARGET
      ? {
          id: 'test_collection',
          name: 'Test Collection',
          role: 'physical',
          armorType: 'mail',
          craftId: 'armorcrafting',
          itemIds: [SOURCE, TARGET],
        }
      : undefined,
  );
  vi.spyOn(recipes, 'recipeForResultItem').mockImplementation((id) =>
    id === SOURCE || id === TARGET ? { ...RECIPE, resultItemId: id } : undefined,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete ITEMS[SOURCE];
  delete ITEMS[TARGET];
});

function fixture() {
  const sim = new Sim({
    seed: 93,
    playerClass: 'warrior',
    autoEquip: false,
    world: {
      ...EMPTY_TEST_WORLD,
      services: {
        ...EMPTY_TEST_WORLD.services,
        stations: [
          {
            id: 'test_forge',
            type: 'forge',
            zoneId: 'eastbrook_vale',
            masterNpcId: 'test_forge_master',
            pos: { x: 0, z: 0 },
          },
        ],
      },
    },
  });
  const meta = sim.meta(sim.playerId)!;
  meta.craftSkills.armorcrafting = 125;
  meta.inventory = [
    { itemId: SOURCE, count: 1, instance: { signer: 'Maker', perfecting: 3 } },
    { itemId: TARGET, count: 1, instance: { signer: 'Maker', perfecting: 1 } },
  ];
  sim.player.pos = { x: 0, y: 0, z: 0 };
  const reads = {
    inventory: meta.inventory,
    equipment: meta.equipment,
    equipmentInstances: meta.equipmentInstance,
  };
  const request = {
    source: capturePerfectItemRef(reads, { bag: 0, itemId: SOURCE }),
    target: capturePerfectItemRef(reads, { bag: 1, itemId: TARGET }),
  };
  const view = () =>
    perfectingSwapInfoFrom({
      ...reads,
      ...request,
      craftSkills: meta.craftSkills,
      stationPlacements: sim.stationPlacements,
      dead: false,
      inCombat: false,
      pos: sim.player.pos,
    });
  return { sim, meta, request, view };
}

describe('furnishing collection eligibility', () => {
  it('never initializes a Perfecting payload even if the collection registry includes the id', () => {
    const payload: ItemInstancePayload = { signer: 'Maker' };
    const furnishing = { ...FURNISHING, id: SOURCE };
    expect(withPerfectingBonus(furnishing, RECIPE, payload)).toBe(payload);
    expect(payload).toEqual({ signer: 'Maker' });
    const eligible = withPerfectingBonus(gear(SOURCE), RECIPE, payload);
    expect(eligible).not.toBe(payload);
    expect(eligible.perfectingBonus?.str).toBeGreaterThan(0);
  });

  it.each([SOURCE, TARGET])('refuses a furnishing at %s before either copy changes', (id) => {
    const { sim, meta, request, view } = fixture();
    ITEMS[id] = { ...FURNISHING, id };
    const before = sim.serializeCharacter(sim.playerId);
    expect(before).not.toBeNull();
    const draws: number[] = [];
    sim.rng.setObserver((value) => draws.push(value));
    const revision = meta.wireRev;
    expect(view().reason).toBe('invalid_progress');
    expect(swapPerfectingRanks(sim.ctx, sim.playerId, request)).toMatchObject({
      ok: false,
      reason: 'invalid_progress',
    });
    expect(sim.serializeCharacter(sim.playerId)).toEqual(before);
    expect(meta.inventory.map((slot) => slot.count)).toEqual([1, 1]);
    expect(meta.wireRev).toBe(revision);
    expect(draws).toEqual([]);

    ITEMS[id] = gear(id);
    expect(view().reason).toBeUndefined();
    expect(swapPerfectingRanks(sim.ctx, sim.playerId, request).ok).toBe(true);
    expect(meta.inventory.map((slot) => slot.instance?.perfecting)).toEqual([1, 3]);
    expect(meta.inventory.map((slot) => slot.count)).toEqual([1, 1]);
    expect(draws).toEqual([]);
  });
});
