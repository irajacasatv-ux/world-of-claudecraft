import type { FurnishingItemDef, NpcDef } from '../../types';

// Stable content identities; numeric furnishing rows use the reviewed trial evidence.
export const FREEHOLD_FURNISHER_NPC_ID = 'freehold_furnisher';

export const FREEHOLD_FURNISHING_IDS = Object.freeze([
  'freehold_timber_bed',
  'freehold_round_table',
  'freehold_spindle_chair',
  'freehold_low_stool',
  'freehold_woven_rug',
  'freehold_brass_lantern',
  'freehold_storage_chest',
  'freehold_open_bookshelf',
] as const);

// Accepted development trial, with production calibration kept in the owning evidence:
// docs/freeholds/content-trial-2026-09-07/economy-measurements.json
// docs/freeholds/content-trial-2026-09-07/geometry-measurements.json
export const FREEHOLD_FURNISHINGS: Readonly<Record<string, FurnishingItemDef>> = Object.freeze({
  freehold_timber_bed: {
    id: 'freehold_timber_bed',
    name: 'Timber Bed',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 5, depth: 7 }, r: 2.5, decorCost: 4, surface: 'floor' },
  },
  freehold_round_table: {
    id: 'freehold_round_table',
    name: 'Round Table',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 5, depth: 5 }, r: 1.5, decorCost: 2, surface: 'floor' },
  },
  freehold_spindle_chair: {
    id: 'freehold_spindle_chair',
    name: 'Spindle Chair',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 2, depth: 2 }, r: 1, decorCost: 1, surface: 'floor' },
  },
  freehold_low_stool: {
    id: 'freehold_low_stool',
    name: 'Low Stool',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 2, depth: 2 }, r: 0.5, decorCost: 1, surface: 'floor' },
  },
  freehold_woven_rug: {
    id: 'freehold_woven_rug',
    name: 'Woven Rug',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 4, depth: 8 }, r: 0, decorCost: 1, surface: 'floor' },
  },
  freehold_brass_lantern: {
    id: 'freehold_brass_lantern',
    name: 'Brass Lantern',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 2, depth: 2 }, r: 0.5, decorCost: 1, surface: 'floor' },
  },
  freehold_storage_chest: {
    id: 'freehold_storage_chest',
    name: 'Storage Chest',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 5, depth: 4 }, r: 1.5, decorCost: 3, surface: 'floor' },
  },
  freehold_open_bookshelf: {
    id: 'freehold_open_bookshelf',
    name: 'Open Bookshelf',
    kind: 'furnishing',
    quality: 'common',
    buyValue: 250,
    sellValue: 60,
    furnishing: { footprint: { width: 6, depth: 1 }, r: 1.5, decorCost: 8, surface: 'floor' },
  },
});
for (const item of Object.values(FREEHOLD_FURNISHINGS)) {
  Object.freeze(item.furnishing.footprint);
  Object.freeze(item.furnishing);
  Object.freeze(item);
}

export const FREEHOLD_FURNISHER: NpcDef = {
  id: FREEHOLD_FURNISHER_NPC_ID,
  name: 'Freehold Furnisher',
  title: 'Household Goods',
  // Measured on the shipped world seed: a clear, dry site on the civic green.
  pos: { x: -66, z: -96 },
  facing: Math.PI / 2,
  color: 0x8b6544,
  questIds: [],
  vendorItems: [...FREEHOLD_FURNISHING_IDS],
  greeting: 'A sturdy chair, a warm lantern, a place for your books. Have a look.',
};
Object.freeze(FREEHOLD_FURNISHER.pos);
Object.freeze(FREEHOLD_FURNISHER.questIds);
Object.freeze(FREEHOLD_FURNISHER.vendorItems);
Object.freeze(FREEHOLD_FURNISHER);
