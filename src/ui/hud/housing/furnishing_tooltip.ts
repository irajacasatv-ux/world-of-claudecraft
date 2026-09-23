import type { FurnishingItemDef, ItemDef, ItemInstancePayload } from '../../../sim/types';
import type { IWorld } from '../../../world_api';
import { tEntity } from '../../entity_i18n';
import { esc } from '../../esc';
import { formatNumber, t } from '../../i18n';
import {
  instanceLockLine,
  instancePartyTradeLine,
  instanceTitleHtml,
  vendorSellTooltipLine,
} from '../../item_instance_tooltip';
import { itemKindLabel, itemQualityLabel } from '../../item_kind_label';
import { tooltipLine } from '../../tooltip_line_core';
import { furnishingTooltipRows } from './furnishing_tooltip_view';

/** The item-card composition seam formats numbers and escapes every localized line. */
export function furnishingTooltipLines(item: ItemDef, instance?: ItemInstancePayload): string {
  let html = '';
  for (const row of furnishingTooltipRows(item, instance)) {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(row.values)) {
      values[key] = typeof value === 'number' ? formatNumber(value) : value;
    }
    html += tooltipLine('tt-desc', t(row.key, values));
  }
  return html;
}

/** Furnishing cards expose placement and custody facts, never gear or use capabilities. */
export function furnishingItemTooltip(
  item: FurnishingItemDef,
  instance: ItemInstancePayload | undefined,
  world: Pick<IWorld, 'partyTradeMsRemaining'>,
): string {
  // Resolve this item's identity directly: heroic aliases and promoted copy
  // names belong to equipment, and must not rename a furnishing's card.
  let html = instanceTitleHtml(
    item,
    undefined,
    tEntity({ kind: 'item', id: item.id, field: 'name' }),
  );
  html += tooltipLine(
    'tt-sub',
    t('itemUi.tooltip.qualityKind', {
      quality: itemQualityLabel(item.quality),
      kind: itemKindLabel(item.kind, item.id),
    }),
  );
  if (item.soulbound) {
    html += `<div class="tt-sub" style="color:var(--gold)">${esc(t('hudChrome.itemSoulbound'))}</div>`;
    // Def-gated like the gear card (release 034ef032b0): a party-trade marker on
    // a drop that is no longer bind-on-pickup promises nothing.
    html += instancePartyTradeLine(
      instance,
      (untilMs) => world.partyTradeMsRemaining(untilMs),
      item.kind,
    );
  }
  html += instanceLockLine(instance);
  html += furnishingTooltipLines(item, instance);
  html += vendorSellTooltipLine(item);
  return html;
}
