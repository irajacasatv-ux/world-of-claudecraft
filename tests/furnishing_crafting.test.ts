import { describe, expect, it, vi } from 'vitest';
import { bagCapacity } from '../src/sim/bags';
import { FURNISHING_RECIPES } from '../src/sim/content/freehold';
import { STATIONS } from '../src/sim/content/professions';
import { recipeById } from '../src/sim/content/recipes';
import { ITEMS } from '../src/sim/data';
import { stationsOfType } from '../src/sim/professions/stations';
import type { ProfessionRecipeRecord } from '../src/sim/professions/types';
import { Sim } from '../src/sim/sim';
import { CRAFT_CAST_ID } from '../src/sim/types';
import { completeCraftCast, runCraft } from './helpers/enchant_family_cast';
import { EMPTY_TEST_WORLD } from './sim_shared';

// The furnishing crafts read the player, the recipe tables and the stations
// (kept by the empty world), never a camp, NPC or ground object.
function setup(recipe: ProfessionRecipeRecord, skill = 50) {
  const sim = new Sim({
    seed: 42,
    playerClass: 'warrior',
    autoEquip: false,
    freeholdsEnabled: true,
    world: EMPTY_TEST_WORLD,
  });
  const meta = sim.players.get(sim.playerId);
  if (!meta || !recipe.stationType) throw new Error('Missing furnishing craft fixture');
  meta.inventory = [];
  meta.craftSkills[recipe.professionId] = skill;
  meta.knownRecipes.add(recipe.id);
  meta.copper = 10000;
  const station = stationsOfType(STATIONS, recipe.stationType)[0];
  Object.assign(sim.player.pos, station.pos);
  sim.player.prevPos = { ...sim.player.pos };
  sim.drainEvents();
  return { sim, meta };
}

function grantReagents(sim: Sim, recipe: ProfessionRecipeRecord, batches = 1) {
  for (const reagent of recipe.reagents) sim.addItem(reagent.itemId, reagent.count * batches);
  for (const reagent of recipe.reagents) {
    expect(sim.countItem(reagent.itemId), reagent.itemId).toBe(reagent.count * batches);
  }
  sim.drainEvents();
}

function recipeFor(id: string) {
  const recipe = recipeById(id);
  if (!recipe) throw new Error(`Missing recipe ${id}`);
  return recipe;
}

describe('registered furnishing craft execution', () => {
  it('covers exactly ten registered crafting outputs', () => {
    expect(FURNISHING_RECIPES).toHaveLength(10);
    expect(new Set(FURNISHING_RECIPES.map((recipe) => recipe.resultItemId)).size).toBe(10);
  });

  it.each(FURNISHING_RECIPES)(
    '$id completes for its exact bill and 40 copper with maker-only decor',
    (recipe) => {
      const { sim, meta } = setup(recipe);
      grantReagents(sim, recipe);
      const auras = structuredClone(sim.player.auras);
      expect(meta.lifetimeXp).toBe(0);
      runCraft(sim, recipe.id);
      expect(meta.lastCraftResult).toMatchObject({
        ok: true,
        recipeId: recipe.id,
        itemId: recipe.resultItemId,
      });
      expect(meta.lastCraftResult?.masterwork).toBeUndefined();
      expect(meta.copper).toBe(9960);
      expect(meta.lifetimeXp).toBeGreaterThan(0);
      for (const reagent of recipe.reagents) expect(sim.countItem(reagent.itemId)).toBe(0);
      expect(sim.inventory).toEqual([
        { itemId: recipe.resultItemId, count: 1, instance: { signer: meta.name } },
      ]);
      expect(sim.player.auras).toEqual(auras);
      expect(sim.player.castingAbility).toBeNull();
      expect(sim.player.craftCastBatchRemaining).toBe(0);
      const definition = ITEMS[recipe.resultItemId];
      for (const field of ['stats', 'use', 'feast', 'slot', 'weapon', 'foodHp', 'drinkMp']) {
        expect(Reflect.get(definition, field), field).toBeUndefined();
      }
      const results = sim.drainEvents().filter((event) => event.type === 'craftResult');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ ok: true, recipeId: recipe.id, count: 1 });
    },
  );

  it.each(FURNISHING_RECIPES)(
    '$id refuses a different station without spending or granting',
    (recipe) => {
      const { sim, meta } = setup(recipe);
      grantReagents(sim, recipe);
      const wrongType = recipe.stationType === 'apothecary' ? 'tannery' : 'apothecary';
      Object.assign(sim.player.pos, stationsOfType(STATIONS, wrongType)[0].pos);
      const inventory = structuredClone(sim.inventory);
      const skills = { ...meta.craftSkills };
      runCraft(sim, recipe.id);
      expect(meta.lastCraftResult).toMatchObject({ ok: false, reason: 'station_required' });
      expect(meta.copper).toBe(10000);
      expect(meta.craftSkills).toEqual(skills);
      expect(sim.inventory).toEqual(inventory);
      expect(sim.countItem(recipe.resultItemId)).toBe(0);
      expect(sim.player.castingAbility).toBeNull();
    },
  );

  it('executes the maximum 50 casts with self-signed material discounts at the skill cap', () => {
    const recipe = recipeFor('recipe_freehold_glow_lantern');
    const { sim, meta } = setup(recipe, 125);
    for (let socket = 0; socket < 4; socket++) {
      sim.addItem('sunspun_haversack', 1);
      sim.equipBag('sunspun_haversack', socket);
    }
    expect(bagCapacity(meta.bags)).toBe(80);
    // Holding own signed stock reduces the bill first, then specialization applies:
    // floor((20 - 1) * 0.8) = 15 Essence; floor((6 - 1) * 0.8) = 4 Dust.
    // Stock permits 51 crafts, so the command cap itself must stop the batch at 50.
    sim.addItemInstance('arcane_essence', { signer: meta.name }, sim.playerId, 765);
    sim.addItemInstance('arcane_dust', { signer: meta.name }, sim.playerId, 204);
    expect(sim.countItem('arcane_essence')).toBe(765);
    expect(sim.countItem('arcane_dust')).toBe(204);
    expect(meta.xp).toBe(0);
    expect(meta.lifetimeXp).toBe(0);
    meta.xp = 37;
    meta.lifetimeXp = 137;
    sim.drainEvents();
    runCraft(sim, recipe.id, false, sim.playerId, 51);
    expect(sim.countItem(recipe.resultItemId)).toBe(1);
    expect(sim.player.castingAbility).toBe(CRAFT_CAST_ID);
    expect(sim.player.craftCastBatchTotal).toBe(50);
    expect(sim.player.craftCastBatchRemaining).toBe(49);
    for (let completed = 1; completed < 50; completed++) {
      completeCraftCast(sim);
      expect(sim.countItem(recipe.resultItemId)).toBe(completed + 1);
      expect(sim.inventory.length).toBeLessThanOrEqual(bagCapacity(meta.bags));
    }
    expect(sim.player.castingAbility).toBeNull();
    expect(sim.player.craftCastBatchRemaining).toBe(0);
    expect(sim.player.craftCastBatchTotal).toBe(0);
    expect(meta.copper).toBe(8000);
    expect(sim.countItem('arcane_essence')).toBe(15);
    expect(sim.countItem('arcane_dust')).toBe(4);
    expect(meta.craftSkills.enchanting).toBe(125);
    expect(meta.xp).toBe(37);
    expect(meta.lifetimeXp).toBe(137);
    const outputs = sim.inventory.filter((slot) => slot.itemId === recipe.resultItemId);
    expect(outputs).toHaveLength(50);
    for (const slot of outputs) {
      expect(slot).toEqual({
        itemId: recipe.resultItemId,
        count: 1,
        instance: { signer: meta.name },
      });
    }
    const results = sim.drainEvents().filter((event) => event.type === 'craftResult');
    expect(results).toHaveLength(50);
    for (const result of results) expect(result).toMatchObject({ ok: true, count: 1 });
  });

  it('refuses a full bag when reagent consumption cannot release an output slot', () => {
    const recipe = recipeFor('recipe_freehold_patchwork_rug');
    const { sim, meta } = setup(recipe);
    grantReagents(sim, recipe, 2);
    while (sim.inventory.length < bagCapacity(meta.bags)) sim.addItem('freehold_timber_bed', 1);
    const inventory = structuredClone(sim.inventory);
    runCraft(sim, recipe.id);
    expect(meta.lastCraftResult).toMatchObject({ ok: false, reason: 'no_bag_space' });
    expect(meta.copper).toBe(10000);
    expect(sim.inventory).toEqual(inventory);
    expect(sim.player.castingAbility).toBeNull();
  });

  it('stops a queued batch if materials disappear before completion and keeps its first output', () => {
    const recipe = recipeFor('recipe_freehold_patchwork_rug');
    const { sim, meta } = setup(recipe);
    grantReagents(sim, recipe, 3);
    runCraft(sim, recipe.id, false, sim.playerId, 3);
    expect(sim.countItem(recipe.resultItemId)).toBe(1);
    expect(sim.player.craftCastBatchRemaining).toBe(2);
    expect(sim.player.castingAbility).toBe(CRAFT_CAST_ID);
    sim.removeItem('homespun_cloth', sim.countItem('homespun_cloth'));
    const inventory = structuredClone(sim.inventory);
    const copper = meta.copper;
    const skills = { ...meta.craftSkills };
    completeCraftCast(sim);
    expect(meta.lastCraftResult).toMatchObject({ ok: false, reason: 'insufficient_materials' });
    expect(meta.copper).toBe(copper);
    expect(meta.craftSkills).toEqual(skills);
    expect(sim.inventory).toEqual(inventory);
    expect(sim.countItem(recipe.resultItemId)).toBe(1);
    expect(sim.player.castingAbility).toBeNull();
    expect(sim.player.craftCastBatchRemaining).toBe(0);
    expect(sim.player.craftCastBatchTotal).toBe(0);
  });
});

describe('lit furnishing command determinism', () => {
  it.each([
    { name: 'ordinary', jack: false, drawsPerCraft: 1 },
    { name: 'Jack', jack: true, drawsPerCraft: 2 },
  ])(
    '$name replays learning and crafting with identical events, saves and RNG continuation',
    (row) => {
      function replay() {
        const trainerRecipe = recipeFor('recipe_freehold_glow_lantern');
        const patternRecipe = recipeFor('recipe_freehold_clockwork_lamp');
        const { sim, meta } = setup(trainerRecipe);
        meta.knownRecipes.delete(trainerRecipe.id);
        meta.craftSkills.engineering = 50;
        meta.archetype.isJackOfAllTrades = row.jack;
        meta.copper = 20000;
        const patternId = 'pattern_freehold_clockwork_lamp';
        sim.addItem(patternId, 1);
        for (const recipe of [trainerRecipe, patternRecipe]) {
          for (const reagent of recipe.reagents) sim.addItem(reagent.itemId, reagent.count);
        }
        sim.drainEvents();
        const draw = vi.spyOn(sim.rng, 'next');
        try {
          sim.trainRecipe(trainerRecipe.id);
          expect(meta.knownRecipes.has(trainerRecipe.id)).toBe(true);
          expect(meta.copper).toBe(10000);
          expect(draw).not.toHaveBeenCalled();

          const patternSlot = sim.inventory.findIndex((slot) => slot.itemId === patternId);
          expect(patternSlot).toBeGreaterThanOrEqual(0);
          sim.useItem(patternId, sim.playerId, patternSlot);
          expect(meta.knownRecipes.has(patternRecipe.id)).toBe(true);
          expect(sim.countItem(patternId)).toBe(0);
          expect(draw).not.toHaveBeenCalled();

          sim.trainRecipe(trainerRecipe.id);
          expect(meta.lastTrainResult).toMatchObject({ ok: false, reason: 'train_already_known' });
          expect(meta.copper).toBe(10000);
          expect(draw).not.toHaveBeenCalled();

          sim.craftItem(trainerRecipe.id);
          expect(sim.player.castingAbility).toBe(CRAFT_CAST_ID);
          expect(draw).not.toHaveBeenCalled();
          completeCraftCast(sim);
          expect(meta.lastCraftResult).toMatchObject({ ok: true, recipeId: trainerRecipe.id });
          expect(draw).toHaveBeenCalledTimes(row.drawsPerCraft);
          runCraft(sim, patternRecipe.id);
          expect(meta.lastCraftResult).toMatchObject({ ok: true, recipeId: patternRecipe.id });
          expect(draw).toHaveBeenCalledTimes(row.drawsPerCraft * 2);
          expect(meta.copper).toBe(9920);
          for (const recipe of [trainerRecipe, patternRecipe]) {
            expect(sim.inventory.filter((slot) => slot.itemId === recipe.resultItemId)).toEqual([
              { itemId: recipe.resultItemId, count: 1, instance: { signer: meta.name } },
            ]);
          }
          const events = sim.drainEvents();
          expect(events.filter((event) => event.type === 'trainResult' && event.ok)).toHaveLength(
            2,
          );
          expect(events.filter((event) => event.type === 'craftResult' && event.ok)).toHaveLength(
            2,
          );
          const saved = sim.serializeCharacter(sim.playerId);
          expect(saved).not.toBeNull();
          expect(draw).toHaveBeenCalledTimes(row.drawsPerCraft * 2);
          const continuation = [sim.rng.next(), sim.rng.next(), sim.rng.next()];
          for (const value of continuation) {
            expect(Number.isFinite(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
          }
          return { events, saved, continuation };
        } finally {
          draw.mockRestore();
        }
      }
      expect(replay()).toEqual(replay());
    },
  );
});
