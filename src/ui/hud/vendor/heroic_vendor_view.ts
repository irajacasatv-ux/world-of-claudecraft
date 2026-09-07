// Pure, host-agnostic view model for the Heroic Quartermaster window.
//
// The pure-core half of the pure-core + thin-consumer split (reference
// vendor_view.ts): it decides which stock rows render and whether the viewer
// can afford each at their current Heroic Marks balance. The DOM/i18n side
// lives in heroic_vendor_window.ts. DOM-free and i18n-free so
// tests/heroic_vendor.test.ts can drive it directly.

import { HEROIC_MARK_ITEM_ID } from '../../../sim/content/dungeon_difficulty';
import { HEROIC_VENDOR_STOCK, type HeroicVendorOffer } from '../../../sim/content/heroic_vendor';
import { ITEMS } from '../../../sim/data';
import { isFreeholdCraftAvailable } from '../../../sim/freehold';
import type { ItemDef } from '../../../sim/types';
import type { IWorld } from '../../../world_api';

export interface HeroicShopRow {
  itemId: string;
  item: ItemDef;
  /** Price in Heroic Marks (the heroic_mark inventory item). */
  marks: number;
  affordable: boolean;
}

export interface HeroicShopView {
  rows: HeroicShopRow[];
  /** The viewer's current Heroic Marks balance (bag count). */
  balance: number;
}

/** Build the structured shop view: stock rows resolved against the item table
 * and the viewer's marks balance. Unknown item ids are dropped (never render a
 * row the sim would refuse to sell). */
export function buildHeroicVendorView(
  stock: readonly HeroicVendorOffer[],
  items: Record<string, ItemDef>,
  balance: number,
  freeholdsEnabled = false,
): HeroicShopView {
  const rows: HeroicShopRow[] = [];
  for (const offer of stock) {
    const item = items[offer.itemId];
    if (!item || !isFreeholdCraftAvailable(freeholdsEnabled === true, offer.itemId)) continue;
    rows.push({
      itemId: offer.itemId,
      item,
      marks: offer.marks,
      affordable: balance >= offer.marks,
    });
  }
  return { rows, balance };
}

// Compose the existing purse and row reads outside the HUD coordinator.
export function buildHeroicVendorViewForWorld(
  world: Pick<IWorld, 'inventory' | 'cfg'>,
): HeroicShopView {
  const balance = world.inventory
    .filter((slot) => slot.itemId === HEROIC_MARK_ITEM_ID)
    .reduce((sum, slot) => sum + slot.count, 0);
  return buildHeroicVendorView(
    HEROIC_VENDOR_STOCK,
    ITEMS,
    balance,
    world.cfg.freeholdsEnabled === true,
  );
}
