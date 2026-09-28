// The one step every found-item walk takes (src/sim/item_credit_chain.ts): the
// id a found item ALSO credits. Three walks share it: markItemDiscovered in
// src/sim/deeds.ts, the Reliquary obtain tally in src/sim/reliquary.ts, and the
// Buried Hoard grant's save projection in src/sim/rift/hoard_reward_save.ts.
// The projection is the one pinned end to end here, because it was a copy of
// the hub's walk that missed the furnishing stop when the two sides merged.

import { afterEach, describe, expect, it } from 'vitest';
import type { CharacterState } from '../src/sim/character_state';
import { ITEMS } from '../src/sim/data';
import { restoreDeedStats } from '../src/sim/deeds';
import { creditedParentId, creditsViaTier } from '../src/sim/item_credit_chain';
import { projectHoardRewardCollections } from '../src/sim/rift/hoard_reward_save';
import type { ItemDef } from '../src/sim/types';

const PIECE = 'collapsar_band_of_nyxaris';
const TIER = 'rare_collapsar_band_of_nyxaris';
const BED = 'freehold_timber_bed';
const SYNTHETIC = 'test_credit_chain_furnishing';

afterEach(() => {
  delete ITEMS[SYNTHETIC];
});

describe('creditedParentId and creditsViaTier', () => {
  it('credits a heroic variant its base and a tier its piece, and a plain item nothing', () => {
    expect(ITEMS[TIER].relicOf).toBe(PIECE);
    expect(creditedParentId(ITEMS[TIER])).toBe(PIECE);
    expect(creditsViaTier(ITEMS[TIER])).toBe(true);
    const heroic = Object.values(ITEMS).find((def) => def.heroicOf !== undefined) as ItemDef;
    expect(creditedParentId(heroic)).toBe(heroic.heroicOf);
    expect(creditsViaTier(heroic)).toBe(false);
    expect(creditedParentId(ITEMS[PIECE])).toBeUndefined();
    expect(creditsViaTier(ITEMS[PIECE])).toBe(false);
  });

  it('stops at a furnishing even when it names a parent', () => {
    const furnishing = { ...ITEMS[BED], heroicOf: PIECE, relicOf: PIECE } as ItemDef;
    expect(furnishing.kind).toBe('furnishing');
    expect(creditedParentId(furnishing)).toBeUndefined();
  });
});

describe('the hoard grant save projection walks the same chain', () => {
  const project = (itemId: string) => {
    const state = {} as CharacterState;
    projectHoardRewardCollections(state, [{ itemId, count: 1 }]);
    return restoreDeedStats(state.deedStats);
  };

  it('discovers a tier and its piece, marking only the tier quality', () => {
    const stats = project(TIER);
    expect([...stats.itemsDiscovered].sort()).toEqual([PIECE, TIER].sort());
    expect([...stats.visited]).toEqual(['quality:rare']);
  });

  it('never walks past a furnishing that names a parent', () => {
    ITEMS[SYNTHETIC] = { ...ITEMS[BED], id: SYNTHETIC, relicOf: PIECE } as ItemDef;
    const stats = project(SYNTHETIC);
    expect([...stats.itemsDiscovered]).toEqual([SYNTHETIC]);
    expect(stats.visited.size).toBe(0);
  });
});
