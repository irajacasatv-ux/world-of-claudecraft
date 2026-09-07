import type { RecipeItemDef } from '../../types';

// Quartermaster-only teaching items. Quality follows the taught furnishing;
// the accepted development calibration fixes the resale floor at 100 copper.
export const FURNISHING_PATTERN_ITEMS: Record<string, RecipeItemDef> = {
  pattern_freehold_clockwork_lamp: {
    id: 'pattern_freehold_clockwork_lamp',
    name: 'Schematic: Clockwork Lamp',
    kind: 'recipe',
    quality: 'rare',
    sellValue: 100,
    teachesRecipeId: 'recipe_freehold_clockwork_lamp',
  },
  pattern_freehold_chart_easel: {
    id: 'pattern_freehold_chart_easel',
    name: 'Technique: Chart Easel',
    kind: 'recipe',
    quality: 'rare',
    sellValue: 100,
    teachesRecipeId: 'recipe_freehold_chart_easel',
  },
  pattern_freehold_jewel_floor_lamp: {
    id: 'pattern_freehold_jewel_floor_lamp',
    name: 'Design: Jewel Floor Lamp',
    kind: 'recipe',
    quality: 'rare',
    sellValue: 100,
    teachesRecipeId: 'recipe_freehold_jewel_floor_lamp',
  },
};
