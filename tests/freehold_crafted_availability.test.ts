import { describe, expect, it, vi } from 'vitest';
import { FURNISHING_PATTERN_ITEMS } from '../src/sim/content/freehold/furnishing_patterns';
import { FURNISHING_RECIPES } from '../src/sim/content/freehold/furnishing_recipes';
import { HEROIC_VENDOR_NPC_ID } from '../src/sim/content/heroic_vendor';
import { STATIONS } from '../src/sim/content/professions';
import { ITEMS } from '../src/sim/data';
import { isFreeholdCraftAvailable } from '../src/sim/freehold';
import {
  acquireRecipeForRecipe,
  maxCraftCountForRecipe,
  resolveCraftForRecipe,
} from '../src/sim/professions/crafting';
import { Sim } from '../src/sim/sim';
import { VENDOR_TEST_WORLD } from './sim_shared';

function fixture() {
  const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: false });
  const meta = sim.meta(sim.playerId);
  if (!meta) throw new Error('Missing player');
  meta.inventory = [];
  meta.copper = 10000;
  return { sim, meta };
}

describe('crafted furnishing availability on dark hosts', () => {
  it('preserves catalog identity and existing content while hiding the ten new recipes', () => {
    const { sim } = fixture();
    expect(sim.cfg.freeholdsEnabled).toBe(false);
    expect(FURNISHING_RECIPES).toHaveLength(10);
    for (const recipe of FURNISHING_RECIPES) {
      expect(ITEMS[recipe.resultItemId]).toBeDefined();
      expect(isFreeholdCraftAvailable(false, recipe.resultItemId)).toBe(false);
      expect(isFreeholdCraftAvailable(true, recipe.resultItemId)).toBe(true);
      expect(sim.recipeList).not.toContain(recipe);
    }
    expect(sim.recipeList.length).toBeGreaterThan(100);
    expect(isFreeholdCraftAvailable(false, 'pattern_ironhusk_flask')).toBe(true);
    expect(isFreeholdCraftAvailable(false, 'freehold_timber_bed')).toBe(true);
    expect(sim.recipeList).toBe(sim.recipeList);
  });

  it.each(FURNISHING_RECIPES)(
    '$id refuses training, grants and carried-knowledge crafts without spending',
    (recipe) => {
      const { sim, meta } = fixture();
      meta.craftSkills[recipe.professionId] = 50;
      const station = STATIONS.find((entry) => entry.type === recipe.stationType);
      if (!station) throw new Error('Missing station');
      Object.assign(sim.player.pos, station.pos);
      for (const reagent of recipe.reagents) sim.addItem(reagent.itemId, reagent.count);
      sim.drainEvents();
      const inventory = structuredClone(meta.inventory);
      const rng = vi.spyOn(sim.rng, 'next');
      sim.trainRecipe(recipe.id);
      expect(meta.lastTrainResult).toEqual({
        ok: false,
        recipeId: recipe.id,
        reason: 'train_not_taught_here',
        fee: 0,
      });
      expect(meta.copper).toBe(10000);
      expect(meta.knownRecipes.has(recipe.id)).toBe(false);
      expect(
        acquireRecipeForRecipe(
          sim.ctx,
          sim.playerId,
          recipe,
          recipe.acquisition?.includes('trainer') ? 'trainer' : 'drop',
        ),
      ).toEqual({ ok: false, recipeId: recipe.id, reason: 'unknown_recipe' });
      meta.knownRecipes.add(recipe.id);
      sim.craftItem(recipe.id);
      expect(sim.player.craftCastRecipeId).toBe('');
      expect(meta.lastCraftResult).toMatchObject({ ok: false, reason: 'unknown_recipe' });
      expect(resolveCraftForRecipe(sim.ctx, sim.playerId, recipe)).toEqual({
        ok: false,
        recipeId: recipe.id,
        reason: 'unknown_recipe',
      });
      expect(maxCraftCountForRecipe(sim.ctx, recipe, sim.playerId)).toBe(0);
      expect(meta.inventory).toEqual(inventory);
      expect(meta.copper).toBe(10000);
      expect(meta.knownRecipes.has(recipe.id)).toBe(true);
      expect(rng).not.toHaveBeenCalled();
      rng.mockRestore();
    },
  );

  it.each(Object.values(FURNISHING_PATTERN_ITEMS))(
    '$id remains in its selected bag slot when learning is disabled',
    (pattern) => {
      const { sim, meta } = fixture();
      const recipe = FURNISHING_RECIPES.find((row) => row.id === pattern.teachesRecipeId);
      if (!recipe) throw new Error('Missing taught recipe');
      meta.craftSkills[recipe.professionId] = 50;
      sim.addItem(pattern.id, 1);
      const slot = meta.inventory.findIndex((entry) => entry.itemId === pattern.id);
      const inventory = structuredClone(meta.inventory);
      sim.drainEvents();
      sim.useItem(pattern.id, undefined, slot);
      expect(meta.inventory).toEqual(inventory);
      expect(meta.knownRecipes.has(recipe.id)).toBe(false);
      expect(meta.copper).toBe(10000);
      expect(sim.drainEvents()).toEqual([]);
    },
  );

  it.each(Object.keys(FURNISHING_PATTERN_ITEMS))(
    '%s cannot be bought with Marks while dark',
    (itemId) => {
      const sim = new Sim({
        seed: 5,
        playerClass: 'warrior',
        noPlayer: true,
        world: VENDOR_TEST_WORLD,
      });
      const pid = sim.addPlayer('warrior', 'Dark Realm Buyer');
      const player = sim.entities.get(pid);
      const npc = [...sim.entities.values()].find(
        (entry) => entry.templateId === HEROIC_VENDOR_NPC_ID,
      );
      if (!player || !npc) throw new Error('Missing vendor fixture');
      Object.assign(player.pos, npc.pos);
      sim.addItem('heroic_mark', 20, pid);
      sim.buyHeroicVendorItem(itemId, pid);
      expect(sim.countItem('heroic_mark', pid)).toBe(20);
      expect(sim.countItem(itemId, pid)).toBe(0);
      sim.buyHeroicVendorItem('pattern_ironhusk_flask', pid);
      expect(sim.countItem('heroic_mark', pid)).toBe(8);
      expect(sim.countItem('pattern_ironhusk_flask', pid)).toBe(1);
    },
  );
});
