// Offline calibration proposal. Runtime catalogs must never import this file.
import assert from 'node:assert/strict';
import { FARM_CROPS } from '../../src/sim/content/farm_crops';
import { HEROIC_VENDOR_STOCK } from '../../src/sim/content/heroic_vendor';
import {
  CRAFT_BATCH_MAX,
  CRAFT_GOLD_SINK_COPPER_PER_BUDGET,
  CRAFT_RING,
  HARVEST_COMPONENT_ITEMS,
  HARVEST_COMPONENT_SPECIMENS,
  MONSTER_MATERIAL_TIERS,
  STATION_TYPE_BY_CRAFT,
} from '../../src/sim/content/professions';
import { INTERMEDIATE_RECIPES, recipeById } from '../../src/sim/content/recipes';
import { ITEMS, NPCS } from '../../src/sim/data';
import { craftSkillGainMultiplier } from '../../src/sim/professions/archetype';
import { craftCastDurationSec } from '../../src/sim/professions/craft_cast_duration';
import { requiredReagentCountFor } from '../../src/sim/professions/crafting';
import { DISENCHANT_MATERIAL_BY_QUALITY } from '../../src/sim/professions/disenchant_reagents';
import { MATERIAL_GRADES } from '../../src/sim/professions/material_grades';
import { resolvePatternLearn } from '../../src/sim/professions/pattern_items';
import { teachTierMet, trainingFeeFor } from '../../src/sim/professions/training';
import type { ProfessionReagent, ProfessionRecipeRecord } from '../../src/sim/professions/types';
import type { PlayerMeta } from '../../src/sim/sim';
import { reagentUnitValue, recipeInputValue } from '../../tests/helpers/reagent_unit_value';

const sourceRecipe = (id: string): ProfessionRecipeRecord => {
  const recipe = recipeById(id);
  assert(recipe, `Missing comparator ${id}`);
  return recipe;
};
const selections = [
  ['weapon_rack', 'Weapon Rack', 'weaponcrafting', 'recipe_elderwood_battle_staff', false],
  ['iron_brazier', 'Iron Brazier', 'armorcrafting', 'recipe_thoriumscale_cuirass', false],
  ['patchwork_rug', 'Patchwork Rug', 'tailoring', 'recipe_sunweave_mantle', false],
  ['hide_armchair', 'Hide Armchair', 'leatherworking', 'recipe_mirewarden_jerkin', false],
  ['clockwork_lamp', 'Clockwork Lamp', 'engineering', 'recipe_copperlens_ocular', true],
  ['glass_floor_lamp', 'Glass Floor Lamp', 'alchemy', 'recipe_elixir_of_the_serpent', false],
  ['chart_easel', 'Chart Easel', 'inscription', 'recipe_sunpetal_grimoire', true],
  ['jewel_floor_lamp', 'Jewel Floor Lamp', 'jewelcrafting', 'recipe_weighted_thorium_band', true],
  ['set_supper_table', 'Set Supper Table', 'cooking', 'recipe_marlows_grand_roast', false],
  ['glow_lantern', 'Glow Lantern', 'enchanting', 'recipe_gatherers_cache', false],
] as const;

// Explicit base-material palette, derived from the comparator bills. No crafted
// gear or intermediate may enter this calibration through recursive expansion.
const allowed = new Set([
  'elderwood_log',
  'thorium_ore',
  'rough_hide',
  'smithing_flux',
  'iron_ore',
  'sunpetal_herb',
  'homespun_cloth',
  'spool_of_thread',
  'pristine_hide',
  'tanning_agent',
  'copper_ore',
  'arcane_dust',
  'pristine_venom_gland',
  'venom_gland',
  'frost_gourd',
  'glass_vial',
  'arcane_essence',
  'goldleaf_herb',
  'prime_cut',
  'game_meat',
  'highland_barley',
  'cooking_salt',
  'arcane_shard',
]);
const produce = new Set(
  Object.values(FARM_CROPS).flatMap((r) => [r.produceItemId, r.fineProduceItemId]),
);
function materialSource(itemId: string) {
  const node = MATERIAL_GRADES[itemId];
  if (node) {
    assert(node.gatherTier >= 1 && node.gatherTier <= 3);
    return { source: 'MATERIAL_GRADES', gatherTier: node.gatherTier, row: node };
  }
  const crop = Object.values(FARM_CROPS).find((r) => r.produceItemId === itemId);
  if (crop) {
    assert(crop.tier <= 3);
    return { source: 'FARM_CROPS', cropTier: crop.tier, row: crop };
  }
  for (const [source, table] of Object.entries({
    HARVEST_COMPONENT_ITEMS,
    HARVEST_COMPONENT_SPECIMENS,
  })) {
    const family = Object.entries(table).find(([, id]) => id === itemId)?.[0];
    if (family) {
      const tier = MONSTER_MATERIAL_TIERS[family];
      assert(tier >= 1 && tier <= 3);
      return { source, family, monsterAccessTier: tier };
    }
  }
  const qualities = Object.entries(DISENCHANT_MATERIAL_BY_QUALITY)
    .filter(([, id]) => id === itemId)
    .map(([quality]) => quality);
  if (qualities.length)
    return {
      source: 'DISENCHANT_MATERIAL_BY_QUALITY',
      inputQualities: qualities,
      note: 'Universal dust/essence/shard ladder; input gear rarity is separate from gathering tier. No typed gear secondary.',
    };
  const vendors = Object.values(NPCS)
    .filter((r) => r.vendorItems?.includes(itemId))
    .map((r) => r.id);
  assert(vendors.length, `No source witness for ${itemId}`);
  return {
    source: 'NPCS.vendorItems',
    vendorIds: vendors,
    note: 'Ordinary vendor crafting staple; no gathering tier.',
  };
}
function validateBill(craft: string, reagents: readonly ProfessionReagent[]) {
  assert(reagents.length > 0);
  assert.equal(new Set(reagents.map((r) => r.itemId)).size, reagents.length);
  for (const reagent of reagents) {
    assert(allowed.has(reagent.itemId), `Unapproved material ${reagent.itemId}`);
    assert(Number.isSafeInteger(reagent.count) && reagent.count > 0);
    assert(!produce.has(reagent.itemId) || craft === 'cooking' || craft === 'alchemy');
    assert(ITEMS[reagent.itemId]);
    materialSource(reagent.itemId);
  }
}
// Can-fail controls exercise the same checker as every proposed bill.
const protectedIds = [
  ...new Set([
    'wyrmfall_core',
    'sundered_essence',
    'makers_ember',
    'quickening_catalyst',
    'quickening_charm',
    'cogwheel_blank',
    'arcanite_bar',
    ...INTERMEDIATE_RECIPES.map((r) => r.resultItemId),
  ]),
];
for (const itemId of protectedIds) {
  assert.throws(() => validateBill('engineering', [{ itemId, count: 1 }]));
}
for (const id of [
  'duskforged_billet',
  'forgefold_plating',
  'wyrmhide_cording',
  'sunspun_bolt',
  'prismglass_setting',
  'precision_chassis',
])
  assert(protectedIds.includes(id));
assert.throws(() => validateBill('inscription', [{ itemId: 'frost_gourd', count: 1 }]));
assert.throws(() => validateBill('cooking', [{ itemId: 'frost_gourd', count: 0 }]));
validateBill('cooking', [{ itemId: 'frost_gourd', count: 1 }]);

const baselineComparatorIds = [
  'recipe_eastbrook_arming_sword',
  'recipe_eastbrook_chain_vest',
  'recipe_eastbrook_wool_trousers',
  'recipe_tanned_leather_jerkin',
  'recipe_tough_jerky',
  'recipe_minor_healing_potion',
  'recipe_thorium_mining_pick',
  'recipe_gatherers_cache',
  'recipe_hammered_copper_band',
  'recipe_silverleaf_primer',
];
const baselineComparators = baselineComparatorIds.map((id) => {
  const recipe = sourceRecipe(id);
  return {
    recipe,
    output: ITEMS[recipe.resultItemId],
    inputCopper: recipeInputValue(recipe),
    inputs: recipe.reagents.map((r) => ({
      ...r,
      unitCopper: reagentUnitValue(r.itemId),
      def: ITEMS[r.itemId],
    })),
  };
});

const band = sourceRecipe('recipe_weighted_thorium_band');
assert.equal(band.skillReq, 50);
assert.equal(band.itemLevelBudget, 20);
assert.equal(band.level, 15);
assert.equal(ITEMS[band.resultItemId].quality, 'rare');
const premium = HEROIC_VENDOR_STOCK.find((r) => r.itemId === 'pattern_clockreel_fishing_rod');
assert(premium);
assert.equal(premium.marks, 16);
assert.equal(ITEMS.pattern_clockreel_fishing_rod.sellValue, 100);

const rows = selections.map(([suffix, name, craft, comparatorId, pattern]) => {
  const comparator = sourceRecipe(comparatorId);
  let reagents = comparator.reagents.map((r) => ({ ...r }));
  let derivation = 'Copy the named comparator batch reagent IDs and counts exactly; no rounding.';
  let replacement: unknown = null;
  if (craft === 'armorcrafting') {
    const removed = reagents.find((r) => r.itemId === 'arcanite_bar');
    assert(removed);
    const value = removed.count * reagentUnitValue(removed.itemId);
    const count = Math.ceil(value / reagentUnitValue('iron_ore'));
    reagents = reagents.filter((r) => r !== removed);
    const iron = reagents.find((r) => r.itemId === 'iron_ore');
    assert(iron);
    iron.count += count;
    replacement = {
      itemId: removed.itemId,
      count: removed.count,
      valueCopper: value,
      replacementId: 'iron_ore',
      replacementCount: count,
    };
    derivation =
      'Copy cuirass bill; replace the arcanite bar with equal-or-higher unit-value iron ore, ceil(value / iron unit value), merged with existing iron. No crafted intermediate remains.';
  }
  if (craft === 'engineering') {
    const component = sourceRecipe('recipe_cogwheel_blank');
    assert.equal(component.resultCount, 1);
    const counts = new Map<string, number>();
    for (const reagent of reagents) {
      const expansion =
        reagent.itemId === component.resultItemId
          ? component.reagents.map((r) => ({ ...r, count: r.count * reagent.count }))
          : [reagent];
      for (const r of expansion) counts.set(r.itemId, (counts.get(r.itemId) ?? 0) + r.count);
    }
    reagents = [...counts].map(([itemId, count]) => ({ itemId, count }));
    replacement = { expandedRecipe: component };
    derivation =
      'Copy ocular assembly inputs; expand its one cogwheel through recipe_cogwheel_blank (one result per batch), summing duplicate raw copper. No intermediate or component crafting fee is billed. No count rounding.';
  }
  if (craft === 'enchanting') {
    const removed = reagents.find((r) => r.itemId === 'arcane_shard');
    assert(removed);
    const value = removed.count * reagentUnitValue(removed.itemId);
    const count = Math.ceil(value / reagentUnitValue('arcane_essence'));
    reagents = reagents.filter((r) => r !== removed);
    const essence = reagents.find((r) => r.itemId === 'arcane_essence');
    assert(essence);
    essence.count += count;
    replacement = {
      itemId: removed.itemId,
      count: removed.count,
      valueCopper: value,
      replacementId: 'arcane_essence',
      replacementCount: count,
    };
    derivation =
      'Copy cache bill; replace five epic/legendary-gear Arcane Shards with equal-or-higher catalog-value rare-gear Arcane Essence, ceil(shard value / essence unit value), merged with existing essence. Proposed mid-progression alternative; no epic salvage required.';
  }
  validateBill(craft, reagents);
  const recipe: ProfessionRecipeRecord = {
    id: `recipe_freehold_${suffix}`,
    professionId: craft,
    resultItemId: `freehold_${suffix}`,
    resultCount: 1,
    reagents,
    skillReq: band.skillReq,
    itemLevelBudget: band.itemLevelBudget,
    level: band.level,
    stationType: STATION_TYPE_BY_CRAFT[craft] ?? comparator.stationType,
    acquisition: [pattern ? 'drop' : 'trainer'],
  };
  assert(recipe.stationType);
  const cap = CRAFT_RING.find((r) => r.id === craft)?.maxSkill;
  assert.equal(cap, 125);
  assert.equal(teachTierMet(recipe, { [craft]: 49 }), false);
  assert.equal(teachTierMet(recipe, { [craft]: 50 }), true);
  if (pattern) {
    for (const [skill, ok] of [
      [0, false],
      [49, false],
      [50, true],
    ] as const) {
      // The pure resolver reads only these fields for this new drop recipe.
      const meta = {
        knownRecipes: new Set<string>(),
        craftSkills: { [craft]: skill },
      } as unknown as PlayerMeta;
      assert.equal(resolvePatternLearn(recipe, meta).ok, ok);
    }
  }
  const cases = [];
  for (const skill of [0, 49, 50, 74, 75, 100, 124, 125]) {
    for (const jackSensitivity of [false, true]) {
      for (let mask = 0; mask < 2 ** reagents.length; mask++) {
        const discounted = reagents.map((r, i) => ({
          itemId: r.itemId,
          count: requiredReagentCountFor(
            Boolean(mask & (1 << i)),
            r,
            { [craft]: skill },
            craft,
            jackSensitivity,
          ).count,
        }));
        const inputCopper = recipeInputValue({ reagents: discounted });
        cases.push({
          skill,
          jackSensitivity,
          signatureMask: mask,
          reagents: discounted,
          inputCopper,
        });
      }
    }
  }
  const liveCases = cases.filter((r) => !r.jackSensitivity);
  const minimum = Math.min(...cases.map((r) => r.inputCopper));
  // Proposed transfer of the accepted vendor-furnishing 60 / 250 resale ratio.
  // Base is the strict counterfactual discounted bill, including dormant Jack.
  const sellValue = Math.floor((minimum * 60) / 250);
  assert(sellValue > 0 && sellValue < minimum);
  for (const row of cases) assert(row.inputCopper > sellValue);
  const gain = [49, 50, 74, 75, 99, 100, 124, 125].map((skill) => ({
    skill,
    unattuned: craftSkillGainMultiplier(
      { [craft]: skill },
      null,
      null,
      craft,
      null,
      recipe.skillReq,
    ),
  }));
  const entryGain = gain.find((r) => r.skill === 50);
  assert(entryGain && entryGain.unattuned > 0);
  assert.equal(gain.find((r) => r.skill === 125)?.unattuned, 0);
  const craftFeeCopper = Math.ceil(recipe.itemLevelBudget * CRAFT_GOLD_SINK_COPPER_PER_BUDGET);
  return {
    name,
    recipe,
    quality: ITEMS[band.resultItemId].quality,
    sellValue,
    comparator,
    comparatorInputCopper: recipeInputValue(comparator),
    reagentDerivation: derivation,
    replacement,
    materialValues: reagents.map((r) => ({
      ...r,
      unitCopper: reagentUnitValue(r.itemId),
      priceBasis: ITEMS[r.itemId].buyValue ? 'buyValue' : 'sellValue',
      def: ITEMS[r.itemId],
      eligibility: materialSource(r.itemId),
    })),
    inputCopper: recipeInputValue(recipe),
    minimumLiveCounterfactualInputCopper: Math.min(...liveCases.map((r) => r.inputCopper)),
    minimumIncludingJackSensitivityCopper: minimum,
    sellValueDerivation: 'floor(minimumIncludingJackSensitivityCopper * 60 / 250)',
    craftFeeCopper,
    trainingFeeCopper: pattern ? null : trainingFeeFor(recipe),
    pattern: pattern
      ? {
          id: `pattern_freehold_${suffix}`,
          marks: premium.marks,
          sellValue: 100,
          quality: ITEMS[band.resultItemId].quality,
          acquisition: 'deterministic Heroic Quartermaster only',
        }
      : null,
    castSeconds: craftCastDurationSec(recipe),
    gain,
    maximumBatch: {
      count: CRAFT_BATCH_MAX,
      craftFeeCopper: CRAFT_BATCH_MAX * craftFeeCopper,
      outputCount: CRAFT_BATCH_MAX,
      outputResaleCopper: CRAFT_BATCH_MAX * sellValue,
      undiscountedInputs: reagents.map((r) => ({
        itemId: r.itemId,
        count: r.count * CRAFT_BATCH_MAX,
      })),
    },
    discountCases: cases,
  };
});
assert.equal(rows.length, 10);
assert.equal(new Set(rows.map((r) => r.recipe.professionId)).size, CRAFT_RING.length);
assert.equal(rows.filter((r) => r.pattern).length, 3);
process.stdout.write(
  `${JSON.stringify(
    {
      artifactId: 'crafted-furnishing-economy-v1',
      status: 'TUNING_PROPOSAL_AWAITING_OWNER_ACCEPTANCE',
      productionApproved: false,
      approvalIdentity: null,
      approvalDay: null,
      supersedes: null,
      preference: 'Progression set: seven mid-skill recipes, three longer Marks goals',
      baselineComparators,
      bandComparator: band.id,
      marksComparator: premium.itemId,
      numericPolicy: {
        resultCount:
          'One physical furnishing per comparator batch, including consumable-craft batches; proposed calibration.',
        skillReq:
          '50, existing rare learning rung shared across ten crafts by proposed calibration.',
        itemLevelBudget:
          '20, inherited from the named rare-rung band comparator; gold-sink driver only, no furnishing power.',
        level:
          '15, existing non-consumable rare-rung XP level from the same band comparator; all outputs are durable decor.',
        marks:
          '16, exact premium Marks pattern precedent; 48 for all three; no playtime or reset-count claim.',
        resale:
          'Transfer the accepted vendor-furnishing 60/250 ratio to the minimum counterfactual input value; floor copper. Requires new acceptance.',
      },
      limitations: [
        'Catalog-value burden, not measured market price or player gathering time.',
        'All-self-signed cases include unsignable staples and are conservative counterfactual floors.',
        'Jack cases are sensitivity only; that identity is currently unreachable.',
        'Pure learning and pricing evidence; bag-slot use, trainer action, casting, output trade and maximum-batch execution remain implementation acceptance checks.',
        'No runtime recipe or output is registered by this probe.',
      ],
      checks: {
        forbiddenMaterialControls: protectedIds.length,
        protectedIds,
        produceNegativeControl: true,
        zeroCountNegativeControl: true,
        learningBoundaries: true,
        positiveUnattunedGainAt50: true,
        noUnattunedGainAt125: true,
        discountCases: rows.reduce((n, r) => n + r.discountCases.length, 0),
      },
      rows,
    },
    null,
    2,
  )}\n`,
);
