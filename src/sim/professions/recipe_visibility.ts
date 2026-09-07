// Stable presentation lists; catalog lookup remains complete on every host.
import { ALL_RECIPES } from '../content/recipes';
import { isFreeholdCraftAvailable } from '../freehold';

let recipesWithoutFreeholds: typeof ALL_RECIPES = [];
let recipeCount = -1;

export function recipesForFreeholdAvailability(enabled: boolean): typeof ALL_RECIPES {
  if (enabled) return ALL_RECIPES;
  // Match recipeById's supported append/remove invalidation contract.
  if (recipeCount !== ALL_RECIPES.length) {
    recipesWithoutFreeholds = ALL_RECIPES.filter((recipe) =>
      isFreeholdCraftAvailable(false, recipe.resultItemId),
    );
    recipeCount = ALL_RECIPES.length;
  }
  return recipesWithoutFreeholds;
}
