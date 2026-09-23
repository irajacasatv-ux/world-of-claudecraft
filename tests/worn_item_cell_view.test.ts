// The one item-cell authority (src/ui/worn_item_cell_view.ts): the triple every
// cell that holds a COPY reads (the chosen legendary name over the def name,
// the instance-effective quality, the color that quality maps to). Pinned
// per dimension with a disagreeing def so each field is decisive on its own.
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import type { ItemInstancePayload } from '../src/sim/types';
import { bagQualityKey } from '../src/ui/bags_view';
import { itemDisplayName } from '../src/ui/entity_i18n';
import { QUALITY_COLOR } from '../src/ui/icons';
import { wornItemCellParts } from '../src/ui/worn_item_cell_view';
import { FURNISHING } from './fixtures/furnishing_item';

const APEX_NECK = 'wyrmfall_pendant'; // an epic apex def

describe('wornItemCellParts', () => {
  it('furnishing identity and rim use authored fields while promoted gear retains its copy fields', () => {
    const previous = ITEMS[FURNISHING.id];
    ITEMS[FURNISHING.id] = FURNISHING;
    try {
      const copy: ItemInstancePayload = {
        name: 'Forbidden Crown',
        rolled: { quality: 'legendary', masterwork: true, stats: { str: 100 } },
        perfected: true,
        signer: 'Anna',
        locked: true,
      };
      const before = structuredClone(copy);
      const aliased = { ...FURNISHING, heroicOf: APEX_NECK };
      expect(itemDisplayName(aliased)).toBe('Steel Side Table');
      expect(wornItemCellParts(aliased, copy)).toEqual({
        name: 'Steel Side Table',
        ariaName: 'Steel Side Table',
        qualityBadge: '',
        qualityBadgeLabelled: '',
        quality: 'rare',
        color: '#0070dd',
      });
      // A forged loot-quality roll never badges a furnishing; the same copy on
      // real gear does, so the empty badge is the strip and not a dead channel.
      const rolledCopy: ItemInstancePayload = {
        ...copy,
        lootQuality: { version: 1, tier: 4, weights: [4, 900, 200, 6, 7] },
      };
      expect(wornItemCellParts(aliased, rolledCopy)).toMatchObject({
        ariaName: 'Steel Side Table',
        qualityBadge: '',
        qualityBadgeLabelled: '',
      });
      expect(wornItemCellParts(ITEMS[APEX_NECK], rolledCopy).qualityBadge).toContain(
        'loot-quality-badge',
      );
      expect(bagQualityKey(FURNISHING, copy)).toBe('rare');
      expect(wornItemCellParts(ITEMS[APEX_NECK], copy)).toEqual({
        name: 'Forbidden Crown',
        ariaName: 'Forbidden Crown',
        qualityBadge: '',
        qualityBadgeLabelled: '',
        quality: 'legendary',
        color: '#ff8000',
      });
      expect(bagQualityKey(ITEMS[APEX_NECK], copy)).toBe('legendary');
      expect(copy).toEqual(before);
    } finally {
      if (previous === undefined) delete ITEMS[FURNISHING.id];
      else ITEMS[FURNISHING.id] = previous;
    }
  });

  it('a bare copy reads the def: its name, its quality, its color', () => {
    const def = ITEMS[APEX_NECK];
    expect(def.quality).toBe('epic');
    for (const instance of [undefined, null, {}]) {
      expect(wornItemCellParts(def, instance)).toEqual({
        name: itemDisplayName(def),
        ariaName: itemDisplayName(def),
        qualityBadge: '',
        qualityBadgeLabelled: '',
        quality: 'epic',
        color: QUALITY_COLOR.epic,
      });
    }
  });

  it('a promoted copy reads the chosen name in legendary orange, never the def tier', () => {
    const def = ITEMS[APEX_NECK];
    const parts = wornItemCellParts(def, {
      perfected: true,
      rolled: { quality: 'legendary', stats: { int: 2 } },
      name: "Vel'tara's Oath",
    });
    expect(parts).toEqual({
      name: "Vel'tara's Oath",
      ariaName: "Vel'tara's Oath",
      qualityBadge: '',
      qualityBadgeLabelled: '',
      quality: 'legendary',
      color: QUALITY_COLOR.legendary,
    });
    // The name leaves RAW (player-authored text): the painter esc()s at the sink.
    expect(parts.name).toContain("'");
  });

  it('a legacy legendary-rolled copy keeps the def name but reads legendary (the display rule)', () => {
    const def = ITEMS[APEX_NECK];
    expect(wornItemCellParts(def, { rolled: { quality: 'legendary' } })).toEqual({
      name: itemDisplayName(def),
      ariaName: itemDisplayName(def),
      qualityBadge: '',
      qualityBadgeLabelled: '',
      quality: 'legendary',
      color: QUALITY_COLOR.legendary,
    });
  });

  it('an unknown rolled tier narrows back to the def quality (total against a hostile wire)', () => {
    const def = ITEMS[APEX_NECK];
    const parts = wornItemCellParts(def, {
      rolled: { quality: 'constructor' as never },
      name: 'Odd',
    });
    expect(parts.quality).toBe('epic');
    expect(parts.color).toBe(QUALITY_COLOR.epic);
    expect(parts.name).toBe('Odd');
  });

  it('a def with no quality falls to the common hex, never undefined and never a CSS token', () => {
    // The color is consumed by the inspect nameplate and the player-card
    // canvas as well as by DOM style, so it is always a literal from the map
    // (the fresh-reader finding on the first QA fix, which exported the old
    // var() token as the fallback).
    const def = { ...ITEMS[APEX_NECK], quality: undefined } as never;
    const parts = wornItemCellParts(def, undefined);
    expect(parts.quality).toBeUndefined();
    expect(parts.color).toBe(QUALITY_COLOR.common);
    expect(parts.color).toMatch(/^#[0-9a-f]{6}$/i);
    const unknownTier = wornItemCellParts(
      { ...ITEMS[APEX_NECK], quality: 'mythic' } as never,
      undefined,
    );
    expect(unknownTier.color).toBe(QUALITY_COLOR.common);
  });
});
