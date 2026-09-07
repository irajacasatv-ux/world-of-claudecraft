// Isolated live command lifecycles, never a claim about player travel or combat pace.
import { FARM_CROPS, farmCropSkillThreshold } from '../../src/sim/content/farm_crops';
import { FARM_PATCHES } from '../../src/sim/content/farm_patches';
import { FREEHOLD_LEDGER_ELIGIBILITY } from '../../src/sim/content/freehold';
import { ALL_RECIPES } from '../../src/sim/content/recipes';
import { DEEPFEN_SHALLOWS_LAKE, GATHER_NODES, ITEMS, LAKE, MOBS, NPCS } from '../../src/sim/data';
import { createMob } from '../../src/sim/entity';
import { startFishing } from '../../src/sim/professions/fishing';
import { wieldRequirementForTier } from '../../src/sim/professions/wield_gate';
import { FISHING_CAST_ID } from '../../src/sim/types';
import { REFERENCE_FARMER } from '../../tests/helpers/farming_calendar_model';
import { DAYS, harness, required, SEED, VISIT_MS, VISITS } from './economy_harness';
import { proposeLedger, proposeVendors } from './economy_model.mjs';

const ITEM_IDS = [
  'freehold_timber_bed',
  'freehold_round_table',
  'freehold_spindle_chair',
  'freehold_low_stool',
  'freehold_woven_rug',
  'freehold_brass_lantern',
  'freehold_storage_chest',
  'freehold_open_bookshelf',
];
const RECIPE_IDS = [
  'recipe_eastbrook_arming_sword',
  'recipe_eastbrook_chain_vest',
  'recipe_eastbrook_wool_trousers',
  'recipe_tanned_leather_jerkin',
  'recipe_minor_healing_potion',
  'recipe_tough_jerky',
  'recipe_silverleaf_primer',
  'recipe_hammered_copper_band',
  'recipe_gatherers_cache',
  'recipe_thorium_mining_pick',
];

const observations = [];
const toolsByFamily = {
  ore: ['copper_mining_pick', 'iron_mining_pick'],
  wood: ['handaxe', 'felling_axe'],
  herb: ['gathering_sickle', 'bronze_sickle'],
} as const;
for (const family of ['ore', 'wood', 'herb'] as const) {
  for (const materialTier of [1, 2]) {
    const row = required(
      FREEHOLD_LEDGER_ELIGIBILITY.find(
        (r) => r.family === family && r.materialTier === materialTier,
      ),
      `${family} tier ${materialTier}`,
    );
    const patch = required(
      FARM_PATCHES.find((p) => p.tier === materialTier),
      `patch tier ${materialTier}`,
    );
    const nodes = GATHER_NODES.filter((n) => n.type === family && n.zoneId === patch.zoneId).sort(
      (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
    if (nodes.length < patch.beds.length) throw new Error(`Not enough distinct ${family} nodes`);
    const h = harness(`${family}-tier-${materialTier}`, family, materialTier, [...row.gradeIds]);
    const toolId = toolsByFamily[family][materialTier - 1];
    h.sim.addItem(toolId, 1);
    const professionId = { ore: 'mining', wood: 'logging', herb: 'herbalism' } as const;
    h.meta.gatheringProficiency[professionId[family]] = wieldRequirementForTier(materialTier);
    for (let visit = 0; visit < VISITS; visit++) {
      h.visit(visit);
      for (let i = 0; i < patch.beds.length; i++) {
        const node = nodes[i];
        h.stand(node.pos.x, node.pos.z);
        h.account(
          h.observe(`harvestNode:${node.id}`, () => {
            h.sim.harvestNode(node.id, false);
          }),
        );
      }
    }
    observations.push({
      ...h.result(),
      toolId,
      sourceNodeIds: nodes.slice(0, patch.beds.length).map((n) => n.id),
      attemptsPerVisit: patch.beds.length,
    });
  }
}

for (const [family, itemId, tag] of [
  ['hide', 'rough_hide', 'hide'],
  ['cloth', 'homespun_cloth', 'cloth'],
]) {
  const h = harness(`${family}-ordinary-corpse`, family, 1, [itemId]);
  const template = Object.values(MOBS)
    .filter((m) => m.componentTags?.includes(tag))
    .sort((a, b) => a.minLevel - b.minLevel || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
  if (!template) throw new Error(`Missing ${family} corpse comparator`);
  h.sim.addItem('field_kit', 1);
  h.sim.setHarvestPreference('all');
  h.stand(0, 0);
  const attemptsPerVisit = required(
    FARM_PATCHES.find((p) => p.tier === 1),
    'starter patch',
  ).beds.length;
  for (let visit = 0; visit < VISITS; visit++) {
    h.visit(visit);
    for (let i = 0; i < attemptsPerVisit; i++) {
      const mob = createMob(90000 + visit * attemptsPerVisit + i, template, template.minLevel, {
        ...h.sim.player.pos,
      });
      mob.componentTags = template.componentTags;
      mob.dead = true;
      mob.aiState = 'dead';
      mob.corpseTimer = 9999;
      h.sim.entities.set(mob.id, mob);
      h.account(
        h.observe(`harvestCorpse:${template.id}:${mob.id}:all`, () => {
          h.sim.harvestCorpse(mob.id);
        }),
      );
    }
  }
  observations.push({
    ...h.result(),
    toolId: 'field_kit',
    mobTemplate: template,
    attemptsPerVisit,
    corpseSupply: 'Explicit dead fixtures; killing and travel are unmeasured',
  });
}

for (const materialTier of [1, 2]) {
  const rows = FREEHOLD_LEDGER_ELIGIBILITY.filter(
    (r) => r.family === 'fish' && r.materialTier === materialTier,
  );
  const h = harness(
    `fish-tier-${materialTier}`,
    'fish',
    materialTier,
    rows.map((r) => r.alternativeId),
  );
  const lake = materialTier === 1 ? LAKE : DEEPFEN_SHALLOWS_LAKE;
  const toolId = materialTier === 1 ? 'simple_fishing_pole' : 'ironreel_fishing_rod';
  h.sim.addItem(toolId, 1);
  // First admitted probe is also the first measured cast; no successful draw is discarded.
  let shore: { x: number; z: number } | undefined;
  const findShore = () => {
    for (let radius = lake.radius * 0.7; radius <= lake.radius + 10; radius++) {
      for (let i = 0; i < 72; i++) {
        const angle = (i / 72) * Math.PI * 2;
        const x = lake.x + Math.cos(angle) * radius;
        const z = lake.z + Math.sin(angle) * radius;
        h.stand(x, z);
        h.sim.player.facing = Math.atan2(lake.x - x, lake.z - z);
        startFishing(h.sim.ctx, h.sim.player, h.meta);
        if (h.sim.player.castingAbility === FISHING_CAST_ID) {
          shore = { x, z };
          return;
        }
      }
    }
    throw new Error('No measured fishing shore');
  };
  const attemptsPerVisit = required(
    FARM_PATCHES.find((p) => p.tier === materialTier),
    `patch tier ${materialTier}`,
  ).beds.length;
  for (let visit = 0; visit < VISITS; visit++) {
    h.visit(visit);
    for (let i = 0; i < attemptsPerVisit; i++) {
      h.account(
        h.observe(`fishing:start,bite,reel:${materialTier}`, () => {
          if (!shore) findShore();
          else startFishing(h.sim.ctx, h.sim.player, h.meta);
          if (h.sim.player.castingAbility !== FISHING_CAST_ID) return;
          while (h.sim.tickCount < h.sim.player.fishBiteAtTick) h.tick();
          startFishing(h.sim.ctx, h.sim.player, h.meta);
        }),
      );
    }
  }
  observations.push({
    ...h.result(),
    toolId,
    attemptsPerVisit,
    shore,
    reelPolicy: 'Perfect first-bite reel, proposed laboratory protocol',
  });
}

for (const crop of Object.values(FARM_CROPS).filter((c) => c.tier <= 2)) {
  const h = harness(`produce-${crop.id}`, 'produce', crop.tier, [
    crop.produceItemId,
    crop.fineProduceItemId,
  ]);
  const patch = required(
    FARM_PATCHES.find((p) => p.tier === crop.tier),
    `patch tier ${crop.tier}`,
  );
  const toolId = crop.tier === 1 ? 'garden_hoe' : 'bronze_hoe';
  h.sim.addItem(toolId, 1);
  h.meta.gatheringProficiency.farming = Math.max(
    farmCropSkillThreshold(crop.tier),
    wieldRequirementForTier(crop.tier),
  );
  if (crop.durationMs >= VISIT_MS) throw new Error('Crop exceeds reference check-in gap');
  // Prior-evening planting is explicit setup. Exactly fourteen harvest visits
  // lie inside [Tuesday, next Tuesday); the final replant remains unharvested.
  for (let visit = -1; visit < VISITS; visit++) {
    h.visit(visit);
    for (const bed of patch.beds) {
      h.stand(bed.x, bed.z);
      if (visit >= 0)
        h.account(
          h.observe(`harvestCrop:${bed.id}`, () => {
            h.sim.harvestCrop(bed.id);
          }),
        );
      {
        h.sim.addItem(crop.seedItemId, 1);
        const events = h.observe(`plantCrop:${bed.id}:${crop.id}:no-knobs`, () => {
          h.sim.plantCrop(bed.id, crop.id);
        });
        if (events.some((e) => e.type === 'farmDenied' || e.type === 'error'))
          throw new Error(`Plant refusal: ${crop.id}`);
      }
    }
  }
  observations.push({
    ...h.result(),
    toolId,
    patchId: patch.id,
    bedIds: patch.beds.map((b) => b.id),
    crop,
    seedUnitsGrantedForSetup: (VISITS + 1) * patch.beds.length,
    seedUnitsSpentInsideWeek: VISITS * patch.beds.length,
    preparationPlants: patch.beds.length,
    finalGrowingPlotsExcluded: patch.beds.length,
    seedPurchaseSimulated: false,
  });
}

const recipes = RECIPE_IDS.map((id) => {
  const recipe = ALL_RECIPES.find((r) => r.id === id);
  if (!recipe) throw new Error(`Missing named recipe comparator: ${id}`);
  return {
    recipe,
    outputItem: ITEMS[recipe.resultItemId],
    reagentItems: recipe.reagents.map((r) => ITEMS[r.itemId]),
  };
});
const ore = required(
  observations.find((o) => o.fixtureId === 'ore-tier-1'),
  'starter ore observation',
);
const result = {
  protocol: {
    id: 'freehold-economy-lab-v1',
    seed: SEED,
    inheritedFarmer: REFERENCE_FARMER,
    days: DAYS,
    visits: VISITS,
    visitGapSeconds: VISIT_MS / 1000,
    injectedStartUtc: '2026-09-08T00:00:00.000Z',
    calendarPurpose: 'Synthetic Tuesday test anchor only, never a production epoch',
    proposedExtension:
      'One field, corpse or fishing attempt per accessible same-tier farm-bed slot per visit, separate actor per resource',
    liveTickScope:
      'Only cast lifecycle and pending gathering grants advance; ambient world, movement, combat, quests and login behavior are not replayed',
    population: 'Deterministic laboratory fixtures, not an observed player cohort',
    marketSnapshot: null,
  },
  observations,
  recipeComparators: recipes,
  vendorComparatorSources: Object.values(NPCS).filter(
    (n) => n.vendorItems?.includes('linen_pouch') || n.vendorItems?.includes('travelers_knapsack'),
  ),
  eligibility: FREEHOLD_LEDGER_ELIGIBILITY,
  materialComparators: [
    ...new Set(FREEHOLD_LEDGER_ELIGIBILITY.flatMap((r) => [...r.gradeIds])),
  ].map((id) => ITEMS[id]),
  ledger: proposeLedger(FREEHOLD_LEDGER_ELIGIBILITY, observations, ITEMS),
  vendor: proposeVendors(ITEM_IDS, ITEMS, ore),
};
process.stdout.write(JSON.stringify(result));
