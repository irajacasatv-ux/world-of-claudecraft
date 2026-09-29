import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_CRAFTED_FURNISHING_IDS,
  FREEHOLD_CRAFTED_FURNISHING_STAND_INS,
  FURNISHING_RECIPES,
} from '../src/sim/content/freehold';
import { STATIONS } from '../src/sim/content/professions';
import { ALL_RECIPES, recipeById, recipeForResultItem } from '../src/sim/content/recipes';
import { ITEMS } from '../src/sim/data';
import { stationsOfType } from '../src/sim/professions/stations';
import { Sim } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import { EMPTY_TEST_WORLD } from './sim_shared';

const TRAINER_RECIPES = [
  ['recipe_freehold_weapon_rack', 'weaponcrafting', 'forge'],
  ['recipe_freehold_iron_brazier', 'armorcrafting', 'forge'],
  ['recipe_freehold_patchwork_rug', 'tailoring', 'loom'],
  ['recipe_freehold_hide_armchair', 'leatherworking', 'tannery'],
  ['recipe_freehold_glass_floor_lamp', 'alchemy', 'apothecary'],
  ['recipe_freehold_set_supper_table', 'cooking', 'kitchens'],
  ['recipe_freehold_glow_lantern', 'enchanting', 'toolworks'],
] as const;

const PATTERN_RECIPES = [
  ['recipe_freehold_clockwork_lamp', 'engineering', 'toolworks'],
  ['recipe_freehold_chart_easel', 'inscription', 'apothecary'],
  ['recipe_freehold_jewel_floor_lamp', 'jewelcrafting', 'forge'],
] as const;

// Training resolves against the static station anchors, a built-in service the empty
// world keeps, so the Sims carry no camps, NPCs or ground objects.
function createTrainingSim() {
  const sim = new Sim({
    seed: 42,
    playerClass: 'warrior',
    autoEquip: false,
    freeholdsEnabled: true,
    world: EMPTY_TEST_WORLD,
  });
  const ctx = (sim as unknown as { ctx: SimContext }).ctx;
  const meta = ctx.players.get(sim.playerId);
  if (!meta) throw new Error('Missing training player');
  sim.drainEvents();
  return { sim, meta };
}

describe('crafted furnishing recipe content', () => {
  it('merges every recipe exactly once and resolves both canonical indexes', () => {
    expect(FURNISHING_RECIPES).toHaveLength(10);
    expect(FURNISHING_RECIPES.map((recipe) => recipe.resultItemId)).toEqual(
      FREEHOLD_CRAFTED_FURNISHING_IDS,
    );
    for (const recipe of FURNISHING_RECIPES) {
      expect(ALL_RECIPES.filter((row) => row.id === recipe.id)).toEqual([recipe]);
      expect(recipeById(recipe.id)).toBe(recipe);
      expect(recipeForResultItem(recipe.resultItemId)).toBe(recipe);
      expect(recipe.resultCount, recipe.id).toBe(1);
      expect(recipe.level, recipe.id).toBe(15);
      expect(ITEMS[recipe.resultItemId].kind).toBe('furnishing');
      for (const reagent of recipe.reagents)
        expect(ITEMS[reagent.itemId], reagent.itemId).toBeDefined();
    }
  });

  it('pins the seven trainer and three pattern craft and station identities', () => {
    for (const [channel, expected] of [
      ['trainer', TRAINER_RECIPES],
      ['drop', PATTERN_RECIPES],
    ] as const) {
      expect(
        FURNISHING_RECIPES.filter((recipe) => recipe.acquisition?.includes(channel)).map(
          (recipe) => [recipe.id, recipe.professionId, recipe.stationType],
        ),
      ).toEqual(expected);
    }
  });

  it('retains every accepted bill and exact measured stand-in transform', () => {
    const bytes = readFileSync('docs/freeholds/crafted-content-trial-2026-09-07/calibration.json');
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      'c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b',
    );
    const calibration = JSON.parse(bytes.toString('utf8'));
    expect(calibration.records).toHaveLength(10);
    expect(Object.keys(FREEHOLD_CRAFTED_FURNISHING_STAND_INS)).toEqual(
      FREEHOLD_CRAFTED_FURNISHING_IDS,
    );
    for (const record of calibration.records) {
      expect(recipeById(record.recipe.id)?.reagents, record.itemId).toEqual(record.recipe.reagents);
      expect(
        Reflect.get(FREEHOLD_CRAFTED_FURNISHING_STAND_INS, record.itemId),
        record.itemId,
      ).toEqual({
        sourceModelKey: record.modelSource.sourceModelKey,
        assetPath: record.modelSource.asset ?? null,
        sourceFunction: record.modelSource.sourceFunction ?? null,
        transform: record.transform,
        collisionClass: record.collisionClass,
      });
    }
  });

  it.each([
    {
      path: 'geometry-measurements.json',
      sha256: 'c340590e9b89415432f7c0712dacfea273486d3cc42b20900f1ae0004336a8c8',
      bytes: 75312,
    },
    {
      path: 'geometry-proposal.json',
      sha256: 'd944116ea84fedc226635cb74fa5c6dadccca531622439f8b47e84e2d2e6825f',
      bytes: 8417,
    },
    {
      path: 'economy-measurements.json',
      sha256: '8e7a10f6b5f1e073c1652fe4819a0c16a8f44071e1f8b1649c2d70afa4f8e64e',
      bytes: 1925504,
    },
  ])('rehashes the formatter-exempt calibration source $path', (expected) => {
    const root = 'docs/freeholds/crafted-content-trial-2026-09-07/';
    const calibration = JSON.parse(readFileSync(`${root}calibration.json`, 'utf8'));
    expect(calibration.sealedEvidence).toContainEqual(expected);
    const bytes = readFileSync(`${root}${expected.path}`);
    expect(bytes.byteLength).toBe(expected.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected.sha256);
  });

  it('keeps recipe and stand-in collections deeply immutable', () => {
    expect(Object.isFrozen(FURNISHING_RECIPES)).toBe(true);
    expect(Object.isFrozen(FREEHOLD_CRAFTED_FURNISHING_IDS)).toBe(true);
    for (const recipe of FURNISHING_RECIPES) {
      expect(Object.isFrozen(recipe)).toBe(true);
      expect(Object.isFrozen(recipe.reagents)).toBe(true);
      expect(Object.isFrozen(recipe.acquisition)).toBe(true);
      for (const reagent of recipe.reagents) expect(Object.isFrozen(reagent)).toBe(true);
      expect(() => Object.assign(recipe, { resultCount: 2 })).toThrow();
    }
    expect(Object.isFrozen(FREEHOLD_CRAFTED_FURNISHING_STAND_INS)).toBe(true);
    for (const standIn of Object.values(FREEHOLD_CRAFTED_FURNISHING_STAND_INS)) {
      expect(Object.isFrozen(standIn)).toBe(true);
      expect(Object.isFrozen(standIn.transform)).toBe(true);
      for (const vector of [
        standIn.transform.translationBeforeScale,
        standIn.transform.scale,
        standIn.transform.postScaleTranslation,
      ]) {
        expect(Object.isFrozen(vector)).toBe(true);
        expect(() => Object.assign(vector, { 0: 999 })).toThrow();
      }
    }
  });
});

describe('crafted furnishing trainer commands', () => {
  it.each(TRAINER_RECIPES)(
    '%s learns at its static station for one gold, preserving refusal and replay behavior',
    (recipeId, craft, stationType) => {
      const { sim, meta } = createTrainingSim();
      const station = stationsOfType(STATIONS, stationType)[0];
      expect(station).toBeDefined();
      expect(meta.knownRecipes.has(recipeId)).toBe(false);
      meta.craftSkills[craft] = 50;
      meta.copper = 10000;
      Object.assign(sim.player.pos, { x: 0, z: 150 });
      sim.trainRecipe(recipeId);
      expect(meta.lastTrainResult).toMatchObject({ ok: false, reason: 'train_out_of_range' });
      expect(meta.copper).toBe(10000);
      expect(meta.knownRecipes.has(recipeId)).toBe(false);

      Object.assign(sim.player.pos, station.pos);
      meta.craftSkills[craft] = 49;
      sim.trainRecipe(recipeId);
      expect(meta.lastTrainResult).toMatchObject({ ok: false, reason: 'train_tier_unmet' });
      expect(meta.copper).toBe(10000);
      expect(meta.knownRecipes.has(recipeId)).toBe(false);

      meta.craftSkills[craft] = 50;
      meta.copper = 9999;
      sim.trainRecipe(recipeId);
      expect(meta.lastTrainResult).toMatchObject({ ok: false, reason: 'train_cannot_afford' });
      expect(meta.copper).toBe(9999);
      expect(meta.knownRecipes.has(recipeId)).toBe(false);

      meta.copper = 10000;
      sim.drainEvents();
      sim.trainRecipe(recipeId);
      expect(meta.copper).toBe(0);
      expect(meta.knownRecipes.has(recipeId)).toBe(true);
      expect(meta.lastTrainResult).toEqual({ ok: true, recipeId, fee: 10000 });
      expect(sim.drainEvents().filter((event) => event.type === 'trainResult')).toEqual([
        { type: 'trainResult', ok: true, recipeId, reason: undefined, pid: sim.playerId },
      ]);

      sim.trainRecipe(recipeId);
      expect(meta.lastTrainResult).toMatchObject({ ok: false, reason: 'train_already_known' });
      expect(meta.copper).toBe(0);
      expect(meta.knownRecipes.has(recipeId)).toBe(true);
    },
  );

  it.each(PATTERN_RECIPES)(
    '%s cannot be learned through its station trainer',
    (recipeId, craft, type) => {
      const { sim, meta } = createTrainingSim();
      Object.assign(sim.player.pos, stationsOfType(STATIONS, type)[0].pos);
      meta.craftSkills[craft] = 50;
      meta.copper = 10000;
      sim.trainRecipe(recipeId);
      expect(meta.lastTrainResult).toMatchObject({ ok: false, reason: 'train_not_taught_here' });
      expect(meta.knownRecipes.has(recipeId)).toBe(false);
      expect(meta.copper).toBe(10000);
    },
  );
});
