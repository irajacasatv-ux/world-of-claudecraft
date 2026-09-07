import { describe, expect, it } from 'vitest';
import { ALL_RECIPES } from '../src/sim/content/recipes';
import { recipesForFreeholdAvailability } from '../src/sim/professions/recipe_visibility';

describe('recipe visibility catalog invalidation', () => {
  it('keeps stable dark list identity and the live lit catalog while length is unchanged', () => {
    const dark = recipesForFreeholdAvailability(false);
    expect(recipesForFreeholdAvailability(false)).toBe(dark);
    expect(recipesForFreeholdAvailability(true)).toBe(ALL_RECIPES);
    expect(recipesForFreeholdAvailability(false)).toBe(dark);
  });

  it('rebuilds for append and splice while preserving the furnishing filter', () => {
    const originalLength = ALL_RECIPES.length;
    const originalDark = recipesForFreeholdAvailability(false);
    const ordinary = {
      ...ALL_RECIPES[0],
      id: 'recipe_visibility_ordinary_fixture',
      resultItemId: 'visibility_ordinary_fixture',
    };
    const furnishing = {
      ...ALL_RECIPES[0],
      id: 'recipe_visibility_furnishing_fixture',
      resultItemId: 'freehold_weapon_rack',
    };
    try {
      ALL_RECIPES.push(ordinary, furnishing);
      const appended = recipesForFreeholdAvailability(false);
      expect(appended.includes(ordinary)).toBe(true);
      expect(appended.includes(furnishing)).toBe(false);
      expect(appended).not.toBe(originalDark);
      expect(recipesForFreeholdAvailability(false)).toBe(appended);
      expect(recipesForFreeholdAvailability(true)).toBe(ALL_RECIPES);
      expect(ALL_RECIPES.includes(furnishing)).toBe(true);

      ALL_RECIPES.splice(originalLength, 1);
      const removed = recipesForFreeholdAvailability(false);
      expect(removed.includes(ordinary)).toBe(false);
      expect(removed.includes(furnishing)).toBe(false);
      expect(removed).not.toBe(appended);
      expect(removed).toEqual(originalDark);
      expect(recipesForFreeholdAvailability(false)).toBe(removed);
    } finally {
      ALL_RECIPES.splice(originalLength);
      recipesForFreeholdAvailability(false);
    }
  });
});
