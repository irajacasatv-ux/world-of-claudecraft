import { describe, expect, it, vi } from 'vitest';
import {
  type LegendaryRegaliaCache,
  legendaryRegaliaActive,
  legendaryRegaliaEmitDt,
  updateLegendaryRegaliaCache,
} from '../src/render/legendary_regalia_core';
import type { ItemDef, ItemInstancePayload } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';

const armor = {
  id: 'probe_furnishing_regalia_armor',
  name: 'Regalia Test Armor',
  kind: 'armor',
  slot: 'chest',
  armorType: 'mail',
  quality: 'rare',
  sellValue: 0,
} satisfies ItemDef;
const weapon = {
  id: 'probe_furnishing_regalia_weapon',
  name: 'Regalia Test Weapon',
  kind: 'weapon',
  slot: 'mainhand',
  weapon: { min: 1, max: 2, speed: 2 },
  quality: 'rare',
  sellValue: 0,
} satisfies ItemDef;
const items: Record<string, ItemDef> = {
  [FURNISHING.id]: FURNISHING,
  [armor.id]: armor,
  [weapon.id]: weapon,
};
const legendary: ItemInstancePayload = { rolled: { quality: 'legendary' } };

const copies: Array<{ name: string; payload: ItemInstancePayload }> = [
  { name: 'legacy legendary roll', payload: legendary },
  { name: 'masterwork roll', payload: { rolled: { quality: 'legendary', masterwork: true } } },
  { name: 'named promotion', payload: { ...legendary, name: 'Regalia Test Name' } },
  { name: 'Perfected promotion', payload: { ...legendary, perfected: true, signer: 'Maker' } },
];

describe('furnishing legendary regalia boundary', () => {
  it.each(copies)(
    'excludes the $name furnishing while armor and weapons retain their glow',
    ({ payload }) => {
      const instances = { chest: payload };
      const before = structuredClone(instances);
      expect(legendaryRegaliaActive(instances, { chest: armor.id }, items)).toBe(true);
      expect(legendaryRegaliaActive(instances, { chest: weapon.id }, items)).toBe(true);
      const active = legendaryRegaliaActive(instances, { chest: FURNISHING.id }, items);
      expect(active).toBe(false);
      expect(legendaryRegaliaEmitDt(active, false, 1 / 60, 0)).toBe(0);
      expect(instances).toEqual(before);
    },
  );

  it('keeps an eligible gear glow beside furnishing and preserves unresolved legacy copies', () => {
    expect(
      legendaryRegaliaActive(
        { chest: legendary, mainhand: legendary },
        {
          chest: FURNISHING.id,
          mainhand: weapon.id,
        },
        items,
      ),
    ).toBe(true);
    expect(
      legendaryRegaliaActive({ chest: legendary }, { chest: 'unresolved_legacy_item' }, items),
    ).toBe(true);
    expect(legendaryRegaliaActive({ chest: legendary }, {}, items)).toBe(true);
    expect(legendaryRegaliaActive({ chest: { rolled: { quality: 'epic' } } }, {}, items)).toBe(
      false,
    );
  });

  it('invalidates cached glow on equipment-map replacement with the same instance reference', () => {
    const cache: LegendaryRegaliaCache = {};
    const instances = { chest: legendary };
    updateLegendaryRegaliaCache(cache, instances, { chest: armor.id }, items);
    expect(cache.legendaryRegalia).toBe(true);
    updateLegendaryRegaliaCache(cache, instances, { chest: FURNISHING.id }, items);
    expect(cache.legendaryRegalia).toBe(false);
    expect(legendaryRegaliaEmitDt(cache.legendaryRegalia, false, 1 / 60, 0)).toBe(0);
    updateLegendaryRegaliaCache(cache, instances, { chest: weapon.id }, items);
    expect(cache.legendaryRegalia).toBe(true);
  });

  it('retains reference-based cache elision and invalidates on replacement of the instance map', () => {
    const cache: LegendaryRegaliaCache = {};
    const quality = vi.fn(() => 'legendary');
    const instances: Partial<Record<string, ItemInstancePayload>> = {
      chest: {
        rolled: {
          get quality() {
            return quality();
          },
        },
      },
    };
    const equipment = { chest: armor.id };
    updateLegendaryRegaliaCache(cache, instances, equipment, items);
    expect(cache.legendaryRegalia).toBe(true);
    expect(quality).toHaveBeenCalledOnce();
    updateLegendaryRegaliaCache(cache, instances, equipment, items);
    expect(cache.legendaryRegalia).toBe(true);
    expect(quality).toHaveBeenCalledOnce();
    updateLegendaryRegaliaCache(
      cache,
      { chest: { rolled: { quality: 'epic' } } },
      equipment,
      items,
    );
    expect(cache.legendaryRegalia).toBe(false);
  });
});
