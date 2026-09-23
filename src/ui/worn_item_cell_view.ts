// The ONE authority for how an item cell describes the COPY it holds
// (the rule of three): the character sheet's
// paperdoll row, the inspect card's row, and the player card's gear rows all
// grew the same triple in the same change (instance-effective quality, the
// color that quality maps to, and the player-chosen legendary name replacing
// the def name), and two more surfaces (the mail chip, the trade row) were
// found still reading the def alone. Every item cell reads this instead, so a
// missed surface becomes a call-site edit rather than a rediscovery.
//
// A pure core (UI_PURE_CORES, tests/architecture.test.ts): no DOM, no host
// state. The chosen name is player-authored text and leaves here RAW; the
// painter esc()s it at its sink (D13-2: a VALUE, never a key). The icon is
// deliberately NOT built here: the painter asks its PainterHost `itemIcon`
// dep with the quality this returns, so the icon seam stays injected.
import type { ItemDef, ItemInstancePayload } from '../sim/types';
import { itemDisplayName } from './entity_i18n';
import { QUALITY_COLOR } from './icons';
import { tooltipEffectiveQuality } from './item_instance_tooltip';
import { itemPresentationInstance } from './item_instance_view';
import { lootQualityAriaName, lootQualityBadgeHtml } from './loot_quality_view';

export interface WornItemCellParts {
  /** The chosen legendary name when the kind supports it, else the def's
   *  localized display name. Furnishing always keeps its authored name.
   *  Player-authored when it is the former: esc it. */
  name: string;
  /** Decorative (aria-hidden) quality badge for a cell whose accessible name
   *  is `ariaName` (bags, banks, vendor, market rows): one channel per surface. */
  qualityBadge: string;
  /** The same badge carrying its own accessible label, for a standalone chip
   *  (mail, trade, market pick and collect rows, paperdoll and inspect rows)
   *  where nothing else names the quality. */
  qualityBadgeLabelled: string;
  ariaName: string;
  /** The copy's effective quality (the rolled override narrowed to a known
   *  tier, else the def's), the value the icon rim and the label share.
   *  Furnishing always keeps its authored quality. */
  quality: ItemDef['quality'];
  /** The name color that quality maps to: always a hex literal from
   *  QUALITY_COLOR (the common rung when the map has no entry), never a CSS
   *  token, because the inspect card's nameplate and the player card's canvas
   *  consume it where a var() would not resolve. */
  color: string;
}

export function wornItemCellParts(
  item: ItemDef,
  instance: ItemInstancePayload | null | undefined,
): WornItemCellParts {
  instance = itemPresentationInstance(item.kind, instance ?? undefined);
  const quality = tooltipEffectiveQuality(item, instance ?? undefined);
  return {
    name: instance?.name ?? itemDisplayName(item),
    qualityBadge: lootQualityBadgeHtml(instance ?? undefined),
    qualityBadgeLabelled: lootQualityBadgeHtml(instance ?? undefined, { labelled: true }),
    ariaName: lootQualityAriaName(instance?.name ?? itemDisplayName(item), instance ?? undefined),
    quality,
    color: QUALITY_COLOR[quality ?? 'common'] ?? QUALITY_COLOR.common,
  };
}
