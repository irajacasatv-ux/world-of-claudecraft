import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { itemOffhandModelUrl, itemWeaponModelUrl } from '../src/render/characters/manifest';
import { ITEMS } from '../src/sim/data';
import type { ItemDef } from '../src/sim/types';
import { entityTranslationManifest, itemDisplayName } from '../src/ui/entity_i18n';
import { ITEM_IMAGE_IDS, iconDataUrl, weaponIconUrl } from '../src/ui/icons';
import { FURNISHING } from './fixtures/furnishing_item';

const GEAR_ID = 'test_furnishing_asset_gear';
const GEAR: ItemDef = {
  id: GEAR_ID,
  name: 'Asset Control Sword',
  kind: 'weapon',
  quality: 'rare',
  sellValue: 1,
  slot: 'mainhand',
  weapon: { min: 1, max: 2, speed: 2 },
  heroicOf: 'worn_sword',
};

beforeEach(() => {
  ITEMS[FURNISHING.id] = { ...FURNISHING, heroicOf: 'worn_sword' };
  ITEMS[GEAR_ID] = GEAR;
  ITEM_IMAGE_IDS.add(FURNISHING.id);
});
afterEach(() => {
  delete ITEMS[FURNISHING.id];
  delete ITEMS[GEAR_ID];
  ITEM_IMAGE_IDS.delete(FURNISHING.id);
});

describe('furnishing authored asset identity', () => {
  it('uses the furnishing art URL instead of inheriting a weapon painting', () => {
    expect(weaponIconUrl(FURNISHING.id)).toBeNull();
    expect(iconDataUrl('item', FURNISHING.id)).toBe(`/ui/items/${FURNISHING.id}.webp`);
    expect(weaponIconUrl(GEAR_ID)).toBe('/ui/items/worn_sword.webp');
    expect(iconDataUrl('item', GEAR_ID)).toBe('/ui/items/worn_sword.webp');
  });

  it('refuses inherited held weapon and offhand models with eligible weapon controls', () => {
    expect(itemWeaponModelUrl(FURNISHING.id)).toBeNull();
    expect(itemOffhandModelUrl(FURNISHING.id)).toBeNull();
    expect(itemWeaponModelUrl(GEAR_ID)).toBe('models/weapons/sword_a.glb');
    expect(itemOffhandModelUrl(GEAR_ID)).toBe('models/weapons/sword_a.glb');
  });

  it('registers the furnishing own English name while real heroic gear retains its base key', () => {
    const entries = entityTranslationManifest();
    expect(entries.filter((entry) => entry.kind === 'item' && entry.id === FURNISHING.id)).toEqual([
      {
        kind: 'item',
        id: FURNISHING.id,
        field: 'name',
        key: 'entities.items.test_furnishing_consumer.name',
        source: 'Steel Side Table',
        group: 'item',
      },
    ]);
    expect(entries.filter((entry) => entry.kind === 'item' && entry.id === GEAR_ID)).toEqual([]);
    expect(itemDisplayName(ITEMS[FURNISHING.id])).toBe('Steel Side Table');
    expect(itemDisplayName(GEAR)).toBe('Pitted Shortsword');
  });
});
