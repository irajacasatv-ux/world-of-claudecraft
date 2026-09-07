import { describe, expect, it } from 'vitest';
import { HEROIC_MARK_ITEM_ID } from '../src/sim/content/dungeon_difficulty';
import { FURNISHING_PATTERN_ITEMS } from '../src/sim/content/freehold/furnishing_patterns';
import { HEROIC_VENDOR_NPC_ID, HEROIC_VENDOR_STOCK } from '../src/sim/content/heroic_vendor';
import { ALL_RECIPES, recipeById } from '../src/sim/content/recipes';
import { ITEMS } from '../src/sim/data';
import { isItemLocked } from '../src/sim/item_lock';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { VENDOR_TEST_WORLD } from './sim_shared';

const PATTERNS = [
  {
    id: 'pattern_freehold_clockwork_lamp',
    recipeId: 'recipe_freehold_clockwork_lamp',
    outputId: 'freehold_clockwork_lamp',
    craft: 'engineering',
    name: 'Schematic: Clockwork Lamp',
  },
  {
    id: 'pattern_freehold_chart_easel',
    recipeId: 'recipe_freehold_chart_easel',
    outputId: 'freehold_chart_easel',
    craft: 'inscription',
    name: 'Technique: Chart Easel',
  },
  {
    id: 'pattern_freehold_jewel_floor_lamp',
    recipeId: 'recipe_freehold_jewel_floor_lamp',
    outputId: 'freehold_jewel_floor_lamp',
    craft: 'jewelcrafting',
    name: 'Design: Jewel Floor Lamp',
  },
] as const;

function fixture() {
  const sim = new Sim({
    seed: 5,
    playerClass: 'warrior',
    noPlayer: true,
    freeholdsEnabled: true,
    world: VENDOR_TEST_WORLD,
  });
  const pid = sim.addPlayer('warrior', 'Furnishing Crafter');
  const meta = sim.meta(pid);
  const player = sim.entities.get(pid);
  if (!meta || !player) throw new Error('Missing furnishing test player');
  meta.autoEquip = false;
  meta.copper = 12345;
  const quartermaster = [...sim.entities.values()].find(
    (entity) => entity.kind === 'npc' && entity.templateId === HEROIC_VENDOR_NPC_ID,
  );
  if (!quartermaster) throw new Error('Missing real quartermaster');
  player.pos = { ...quartermaster.pos, x: quartermaster.pos.x + 1 };
  player.prevPos = { ...player.pos };
  sim.drainEvents();
  return { sim, pid, meta, player };
}

function errors(events: SimEvent[]): string[] {
  return events.flatMap((event) => (event.type === 'error' ? [event.text] : []));
}

describe('furnishing pattern content', () => {
  it('registers exactly the approved three tradable teaching items and 16-Mark offers', () => {
    expect(Object.keys(FURNISHING_PATTERN_ITEMS)).toEqual(PATTERNS.map((row) => row.id));
    for (const row of PATTERNS) {
      const expected = {
        id: row.id,
        name: row.name,
        kind: 'recipe',
        quality: 'rare',
        sellValue: 100,
        teachesRecipeId: row.recipeId,
      };
      expect(FURNISHING_PATTERN_ITEMS[row.id]).toEqual(expected);
      expect(ITEMS[row.id]).toEqual(expected);
      const recipe = recipeById(row.recipeId);
      expect(recipe).toMatchObject({
        resultItemId: row.outputId,
        professionId: row.craft,
        skillReq: 50,
        acquisition: ['drop'],
      });
      expect(ITEMS[row.outputId]).toMatchObject({ kind: 'furnishing', quality: 'rare' });
      expect(FURNISHING_PATTERN_ITEMS[row.id].quality).toBe(ITEMS[row.outputId].quality);
      expect(HEROIC_VENDOR_STOCK.filter((offer) => offer.itemId === row.id)).toEqual([
        { itemId: row.id, marks: 16 },
      ]);
    }
  });

  it('keeps the seven trainer recipes separate from the three pattern recipes', () => {
    const furnishings = ALL_RECIPES.filter(
      (recipe) => ITEMS[recipe.resultItemId]?.kind === 'furnishing',
    );
    expect(furnishings).toHaveLength(10);
    expect(
      furnishings
        .filter((recipe) => recipe.acquisition?.includes('drop'))
        .map((recipe) => recipe.id),
    ).toEqual(PATTERNS.map((row) => row.recipeId));
    expect(
      furnishings
        .filter((recipe) => recipe.acquisition?.includes('trainer'))
        .map((recipe) => recipe.id),
    ).toEqual([
      'recipe_freehold_weapon_rack',
      'recipe_freehold_iron_brazier',
      'recipe_freehold_patchwork_rug',
      'recipe_freehold_hide_armchair',
      'recipe_freehold_glass_floor_lamp',
      'recipe_freehold_set_supper_table',
      'recipe_freehold_glow_lantern',
    ]);
  });
});

describe.each(PATTERNS)('$id selected bag-slot learning', (row) => {
  it('learns at skill 50, consumes only the clicked copy, and refuses the second learn', () => {
    const { sim, pid, meta } = fixture();
    meta.craftSkills[row.craft] = 50;
    sim.addItem(row.id, 2, pid);
    const slots = meta.inventory
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.itemId === row.id);
    expect(slots).toHaveLength(2);
    sim.setItemLocked(row.id, true, pid, slots[1].index);
    const wireRevBefore = meta.wireRev;
    sim.drainEvents();

    sim.useItem(row.id, pid, slots[0].index);

    const learned = sim.drainEvents();
    expect(errors(learned)).toEqual([]);
    expect(learned.filter((event) => event.type === 'trainResult')).toEqual([
      { type: 'trainResult', ok: true, recipeId: row.recipeId, pid },
    ]);
    expect(meta.knownRecipes.has(row.recipeId)).toBe(true);
    expect(sim.craftingIdentityFor(pid).knownRecipes).toContain(row.recipeId);
    expect(meta.wireRev).toBeGreaterThan(wireRevBefore);
    expect(sim.countItem(row.id, pid)).toBe(1);
    const survivorIndex = meta.inventory.findIndex((slot) => slot.itemId === row.id);
    expect(meta.inventory[survivorIndex]).toBe(slots[1].slot);
    expect(isItemLocked(meta.inventory[survivorIndex].instance)).toBe(true);
    const beforeRetry = structuredClone(meta.inventory);
    meta.craftSkills[row.craft] = 0;

    sim.useItem(row.id, pid, survivorIndex);

    const denied = sim.drainEvents();
    expect(errors(denied)).toEqual(['You already know that recipe.']);
    expect(denied.some((event) => event.type === 'trainResult')).toBe(false);
    expect(meta.inventory).toEqual(beforeRetry);
    expect(meta.copper).toBe(12345);
  });

  it.each([
    { skill: 0, error: 'You have not practiced that profession.' },
    { skill: 49, error: 'Your skill is too low to learn that pattern.' },
  ])('refuses skill $skill without consuming or learning', ({ skill, error }) => {
    const { sim, pid, meta } = fixture();
    meta.craftSkills.cooking = 125;
    meta.craftSkills[row.craft] = skill;
    sim.addItem(row.id, 1, pid);
    const index = meta.inventory.findIndex((slot) => slot.itemId === row.id);
    const before = structuredClone(meta.inventory);
    sim.drainEvents();

    sim.useItem(row.id, pid, index);

    const denied = sim.drainEvents();
    expect(errors(denied)).toEqual([error]);
    expect(denied.some((event) => event.type === 'trainResult')).toBe(false);
    expect(meta.inventory).toEqual(before);
    expect(meta.knownRecipes.has(row.recipeId)).toBe(false);
    expect(meta.copper).toBe(12345);
  });

  it('refuses stale, malformed and wrong-item slot selections without falling back', () => {
    const { sim, pid, meta } = fixture();
    meta.craftSkills[row.craft] = 50;
    sim.addItem(row.id, 1, pid);
    sim.addItem('worn_sword', 1, pid);
    const wrongItemIndex = meta.inventory.findIndex((slot) => slot.itemId === 'worn_sword');
    expect(wrongItemIndex).toBeGreaterThanOrEqual(0);
    const before = structuredClone(meta.inventory);
    sim.drainEvents();
    for (const index of [wrongItemIndex, -1, 0.5, meta.inventory.length]) {
      sim.useItem(row.id, pid, index);
      expect(meta.inventory).toEqual(before);
      expect(meta.knownRecipes.has(row.recipeId)).toBe(false);
      expect(sim.drainEvents()).toEqual([
        { type: 'error', text: "You don't have that item.", pid },
      ]);
    }
    expect(meta.copper).toBe(12345);
  });

  it('keeps the selected pattern and recipe unknown while dead', () => {
    const { sim, pid, meta, player } = fixture();
    meta.craftSkills[row.craft] = 50;
    sim.addItem(row.id, 1, pid);
    const index = meta.inventory.findIndex((slot) => slot.itemId === row.id);
    const before = structuredClone(meta.inventory);
    player.dead = true;
    sim.drainEvents();

    sim.useItem(row.id, pid, index);

    expect(sim.drainEvents()).toEqual([]);
    expect(meta.inventory).toEqual(before);
    expect(meta.knownRecipes.has(row.recipeId)).toBe(false);
    expect(meta.copper).toBe(12345);
  });
});

describe.each(PATTERNS)('$id quartermaster purchase', (row) => {
  it('buys distinct copies for 16 Marks apiece without learning or charging copper', () => {
    const { sim, pid, meta } = fixture();
    sim.addItem(HEROIC_MARK_ITEM_ID, 32, pid);
    sim.drainEvents();
    for (let bought = 1; bought <= 2; bought++) {
      sim.buyHeroicVendorItem(row.id, pid);
      expect(sim.countItem(HEROIC_MARK_ITEM_ID, pid)).toBe(32 - bought * 16);
      expect(sim.countItem(row.id, pid)).toBe(bought);
      expect(meta.inventory.filter((slot) => slot.itemId === row.id)).toHaveLength(bought);
      expect(sim.drainEvents()).toContainEqual({
        type: 'vendor',
        action: 'buy',
        itemId: row.id,
        pid,
      });
    }
    expect(meta.knownRecipes.has(row.recipeId)).toBe(false);
    expect(meta.copper).toBe(12345);
  });

  it.each(['insufficient Marks', 'dead', 'out of range', 'full bags'] as const)(
    'refuses with %s and preserves all possessions',
    (condition) => {
      const { sim, pid, meta, player } = fixture();
      sim.addItem(HEROIC_MARK_ITEM_ID, condition === 'insufficient Marks' ? 15 : 16, pid);
      if (condition === 'dead') player.dead = true;
      if (condition === 'out of range') player.pos.x += 100;
      if (condition === 'full bags') {
        for (let n = 0; n < 100 && sim.canAddItem('worn_sword', 1, pid); n++)
          sim.addItem('worn_sword', 1, pid);
        expect(sim.canAddItem(row.id, 1, pid)).toBe(false);
      }
      const before = structuredClone(meta.inventory);
      sim.drainEvents();

      sim.buyHeroicVendorItem(row.id, pid);

      const denied = sim.drainEvents();
      const expectedError = {
        'insufficient Marks': `You need 16 Heroic Marks to buy ${row.name}.`,
        dead: "You can't do that while dead.",
        'out of range': 'Too far away.',
        'full bags': 'Your bags are full.',
      }[condition];
      expect(errors(denied)).toEqual([expectedError]);
      expect(denied.some((event) => event.type === 'vendor')).toBe(false);
      expect(meta.inventory).toEqual(before);
      expect(meta.knownRecipes.has(row.recipeId)).toBe(false);
      expect(meta.copper).toBe(12345);
    },
  );
});
