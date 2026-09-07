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

// Crafted outputs stay separate from the furnisher stock.
export const FREEHOLD_CRAFTED_FURNISHING_IDS = Object.freeze([
  'freehold_weapon_rack',
  'freehold_iron_brazier',
  'freehold_patchwork_rug',
  'freehold_hide_armchair',
  'freehold_clockwork_lamp',
  'freehold_glass_floor_lamp',
  'freehold_chart_easel',
  'freehold_jewel_floor_lamp',
  'freehold_set_supper_table',
  'freehold_glow_lantern',
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
  freehold_weapon_rack: {
    id: 'freehold_weapon_rack',
    name: 'Weapon Rack',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 58,
    furnishing: {
      footprint: {
        width: 3,
        depth: 2,
      },
      r: 1,
      decorCost: 1,
      surface: 'floor',
    },
  },
  freehold_iron_brazier: {
    id: 'freehold_iron_brazier',
    name: 'Iron Brazier',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 64,
    furnishing: {
      footprint: {
        width: 2,
        depth: 2,
      },
      r: 0.5,
      decorCost: 7,
      surface: 'floor',
    },
  },
  freehold_patchwork_rug: {
    id: 'freehold_patchwork_rug',
    name: 'Patchwork Rug',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 43,
    furnishing: {
      footprint: {
        width: 4,
        depth: 8,
      },
      r: 0,
      decorCost: 1,
      surface: 'floor',
    },
  },
  freehold_hide_armchair: {
    id: 'freehold_hide_armchair',
    name: 'Hide Armchair',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 26,
    furnishing: {
      footprint: {
        width: 2,
        depth: 2,
      },
      r: 1,
      decorCost: 1,
      surface: 'floor',
    },
  },
  freehold_clockwork_lamp: {
    id: 'freehold_clockwork_lamp',
    name: 'Clockwork Lamp',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 9,
    furnishing: {
      footprint: {
        width: 2,
        depth: 2,
      },
      r: 1,
      decorCost: 1,
      surface: 'floor',
    },
  },
  freehold_glass_floor_lamp: {
    id: 'freehold_glass_floor_lamp',
    name: 'Glass Floor Lamp',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 53,
    furnishing: {
      footprint: {
        width: 2,
        depth: 2,
      },
      r: 1,
      decorCost: 1,
      surface: 'floor',
    },
  },
  freehold_chart_easel: {
    id: 'freehold_chart_easel',
    name: 'Chart Easel',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 60,
    furnishing: {
      footprint: {
        width: 2,
        depth: 3,
      },
      r: 1,
      decorCost: 8,
      surface: 'floor',
    },
  },
  freehold_jewel_floor_lamp: {
    id: 'freehold_jewel_floor_lamp',
    name: 'Jewel Floor Lamp',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 39,
    furnishing: {
      footprint: {
        width: 2,
        depth: 2,
      },
      r: 0.5,
      decorCost: 4,
      surface: 'floor',
    },
  },
  freehold_set_supper_table: {
    id: 'freehold_set_supper_table',
    name: 'Set Supper Table',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 54,
    furnishing: {
      footprint: {
        width: 5,
        depth: 5,
      },
      r: 2,
      decorCost: 5,
      surface: 'floor',
    },
  },
  freehold_glow_lantern: {
    id: 'freehold_glow_lantern',
    name: 'Glow Lantern',
    kind: 'furnishing',
    quality: 'rare',
    sellValue: 60,
    furnishing: {
      footprint: {
        width: 2,
        depth: 2,
      },
      r: 0.5,
      decorCost: 1,
      surface: 'floor',
    },
  },
});
for (const item of Object.values(FREEHOLD_FURNISHINGS)) {
  Object.freeze(item.furnishing.footprint);
  Object.freeze(item.furnishing);
  Object.freeze(item);
}

// Accepted development stand-ins only. Final models require separate measured approval.
// Exact source identities and transforms: crafted-content-trial-2026-09-07/calibration.json.
export const FREEHOLD_CRAFTED_FURNISHING_STAND_INS = Object.freeze({
  freehold_weapon_rack: {
    sourceModelKey: 'PROP_ASSET_DEFS.hexWeaponRack',
    assetPath: 'public/models/biome/hex_weaponrack.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [-9.387731552124023e-7, 0, 0.005000069737434387],
      scale: [6.2500009158006655, 6.2500009158006655, 6.2500009158006655],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_iron_brazier: {
    sourceModelKey: 'YUMI_MAZE_ASSET_URL.brazier_stand',
    assetPath: 'public/models/props/yumi_brazier_stand.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [0, 0, 0],
      scale: [1.15384619616898, 1.15384619616898, 1.15384619616898],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_patchwork_rug: {
    sourceModelKey: 'buildRug',
    assetPath: null,
    sourceFunction: 'buildRug',
    transform: {
      translationBeforeScale: [0, -0.019999999999999206, 0],
      scale: [0.25, 1, 0.15384615384615385],
      postScaleTranslation: [0, 0.02, 0],
      yaw: 0,
    },
    collisionClass: 'walk_through_underlay',
  },
  freehold_hide_armchair: {
    sourceModelKey: 'PROP_ASSET_DEFS.kcasChair',
    assetPath: 'public/models/dungeon/chair.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [
        -0.0012931227684020996, -2.9802318834981634e-8, -9.238719940185547e-7,
      ],
      scale: [1.3, 1.3, 1.3],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_clockwork_lamp: {
    sourceModelKey: 'battleground assetId dungeon/lantern_standing',
    assetPath: 'public/models/dungeon/lantern_standing.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [0, 2.9802322387695312e-8, 0],
      scale: [1.5, 1.5, 1.5],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_glass_floor_lamp: {
    sourceModelKey: 'battleground assetId dungeon/lantern_standing',
    assetPath: 'public/models/dungeon/lantern_standing.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [0, 2.9802322387695312e-8, 0],
      scale: [1.5, 1.5, 1.5],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_chart_easel: {
    sourceModelKey: 'ARTISAN_ASSET_URL.inscription_lectern (retained inventory metadata)',
    assetPath: 'public/models/props/inscription_lectern.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [0, 0, 0],
      scale: [1.3636363340803421, 1.3636363340803421, 1.3636363340803421],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_jewel_floor_lamp: {
    sourceModelKey: 'STREETLAMP_ASSET_DEFS.amberfall_crystal',
    assetPath: 'public/models/props/streetlamp_amberfall_crystal.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [0, 0, 0],
      scale: [0.36363636363636365, 0.36363636363636365, 0.36363636363636365],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_set_supper_table: {
    sourceModelKey:
      'existing GLB filename table_medium_tablecloth_decorated_b (no furnishing registration)',
    assetPath: 'public/models/dungeon/table_medium_tablecloth_decorated_b.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [
        -1.7881393432617188e-7, 1.2043810331374694e-5, -1.7881393432617188e-7,
      ],
      scale: [1.25, 1.25, 1.25],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
  freehold_glow_lantern: {
    sourceModelKey: 'battleground assetId dungeon/lantern_standing',
    assetPath: 'public/models/dungeon/lantern_standing.glb',
    sourceFunction: null,
    transform: {
      translationBeforeScale: [0, 2.9802322387695312e-8, 0],
      scale: [1, 1, 1],
      postScaleTranslation: [0, 0, 0],
      yaw: 0,
    },
    collisionClass: 'solid',
  },
} as const);
for (const standIn of Object.values(FREEHOLD_CRAFTED_FURNISHING_STAND_INS)) {
  Object.freeze(standIn.transform.translationBeforeScale);
  Object.freeze(standIn.transform.scale);
  Object.freeze(standIn.transform.postScaleTranslation);
  Object.freeze(standIn.transform);
  Object.freeze(standIn);
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
