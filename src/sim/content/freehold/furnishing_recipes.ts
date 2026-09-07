import type { ProfessionRecipeRecord } from '../../professions/types';

// Accepted development calibration; no furnishing grants combat or station effects.
// Source: docs/freeholds/crafted-content-trial-2026-09-07/calibration.json.
export const FURNISHING_RECIPES: readonly ProfessionRecipeRecord[] = Object.freeze([
  {
    id: 'recipe_freehold_weapon_rack',
    professionId: 'weaponcrafting',
    resultItemId: 'freehold_weapon_rack',
    resultCount: 1,
    reagents: [
      {
        itemId: 'elderwood_log',
        count: 1,
      },
      {
        itemId: 'thorium_ore',
        count: 2,
      },
      {
        itemId: 'rough_hide',
        count: 2,
      },
      {
        itemId: 'smithing_flux',
        count: 1,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'forge',
    acquisition: ['trainer'],
  },
  {
    id: 'recipe_freehold_iron_brazier',
    professionId: 'armorcrafting',
    resultItemId: 'freehold_iron_brazier',
    resultCount: 1,
    reagents: [
      {
        itemId: 'thorium_ore',
        count: 4,
      },
      {
        itemId: 'iron_ore',
        count: 24,
      },
      {
        itemId: 'smithing_flux',
        count: 2,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'forge',
    acquisition: ['trainer'],
  },
  {
    id: 'recipe_freehold_patchwork_rug',
    professionId: 'tailoring',
    resultItemId: 'freehold_patchwork_rug',
    resultCount: 1,
    reagents: [
      {
        itemId: 'sunpetal_herb',
        count: 1,
      },
      {
        itemId: 'homespun_cloth',
        count: 4,
      },
      {
        itemId: 'spool_of_thread',
        count: 2,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'loom',
    acquisition: ['trainer'],
  },
  {
    id: 'recipe_freehold_hide_armchair',
    professionId: 'leatherworking',
    resultItemId: 'freehold_hide_armchair',
    resultCount: 1,
    reagents: [
      {
        itemId: 'pristine_hide',
        count: 1,
      },
      {
        itemId: 'rough_hide',
        count: 4,
      },
      {
        itemId: 'thorium_ore',
        count: 1,
      },
      {
        itemId: 'tanning_agent',
        count: 2,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'tannery',
    acquisition: ['trainer'],
  },
  {
    id: 'recipe_freehold_clockwork_lamp',
    professionId: 'engineering',
    resultItemId: 'freehold_clockwork_lamp',
    resultCount: 1,
    reagents: [
      {
        itemId: 'copper_ore',
        count: 6,
      },
      {
        itemId: 'smithing_flux',
        count: 2,
      },
      {
        itemId: 'arcane_dust',
        count: 3,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'toolworks',
    acquisition: ['drop'],
  },
  {
    id: 'recipe_freehold_glass_floor_lamp',
    professionId: 'alchemy',
    resultItemId: 'freehold_glass_floor_lamp',
    resultCount: 1,
    reagents: [
      {
        itemId: 'pristine_venom_gland',
        count: 1,
      },
      {
        itemId: 'venom_gland',
        count: 2,
      },
      {
        itemId: 'frost_gourd',
        count: 1,
      },
      {
        itemId: 'sunpetal_herb',
        count: 1,
      },
      {
        itemId: 'glass_vial',
        count: 1,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'apothecary',
    acquisition: ['trainer'],
  },
  {
    id: 'recipe_freehold_chart_easel',
    professionId: 'inscription',
    resultItemId: 'freehold_chart_easel',
    resultCount: 1,
    reagents: [
      {
        itemId: 'sunpetal_herb',
        count: 2,
      },
      {
        itemId: 'arcane_essence',
        count: 2,
      },
      {
        itemId: 'glass_vial',
        count: 1,
      },
      {
        itemId: 'goldleaf_herb',
        count: 2,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'apothecary',
    acquisition: ['drop'],
  },
  {
    id: 'recipe_freehold_jewel_floor_lamp',
    professionId: 'jewelcrafting',
    resultItemId: 'freehold_jewel_floor_lamp',
    resultCount: 1,
    reagents: [
      {
        itemId: 'thorium_ore',
        count: 4,
      },
      {
        itemId: 'arcane_essence',
        count: 2,
      },
      {
        itemId: 'smithing_flux',
        count: 2,
      },
      {
        itemId: 'iron_ore',
        count: 2,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'forge',
    acquisition: ['drop'],
  },
  {
    id: 'recipe_freehold_set_supper_table',
    professionId: 'cooking',
    resultItemId: 'freehold_set_supper_table',
    resultCount: 1,
    reagents: [
      {
        itemId: 'prime_cut',
        count: 1,
      },
      {
        itemId: 'game_meat',
        count: 4,
      },
      {
        itemId: 'highland_barley',
        count: 2,
      },
      {
        itemId: 'frost_gourd',
        count: 2,
      },
      {
        itemId: 'sunpetal_herb',
        count: 1,
      },
      {
        itemId: 'cooking_salt',
        count: 2,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'kitchens',
    acquisition: ['trainer'],
  },
  {
    id: 'recipe_freehold_glow_lantern',
    professionId: 'enchanting',
    resultItemId: 'freehold_glow_lantern',
    resultCount: 1,
    reagents: [
      {
        itemId: 'arcane_essence',
        count: 20,
      },
      {
        itemId: 'arcane_dust',
        count: 6,
      },
    ],
    skillReq: 50,
    itemLevelBudget: 20,
    level: 15,
    stationType: 'toolworks',
    acquisition: ['trainer'],
  },
] satisfies ProfessionRecipeRecord[]);
for (const recipe of FURNISHING_RECIPES) {
  for (const reagent of recipe.reagents) Object.freeze(reagent);
  Object.freeze(recipe.reagents);
  Object.freeze(recipe.acquisition);
  Object.freeze(recipe);
}
