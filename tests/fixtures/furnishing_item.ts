import type { FurnishingItemDef } from '../../src/sim/types';

// One synthetic content record drives every kind consumer. No shipping id is added.
export const FURNISHING: FurnishingItemDef = {
  id: 'test_furnishing_consumer',
  name: 'Steel Side Table',
  kind: 'furnishing',
  quality: 'rare',
  sellValue: 25,
  buyValue: 100,
  furnishing: { footprint: { width: 2, depth: 3 }, r: 0, decorCost: 7, surface: 'floor' },
};
