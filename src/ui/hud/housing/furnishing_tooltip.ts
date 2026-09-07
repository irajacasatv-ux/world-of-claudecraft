import type { ItemDef, ItemInstancePayload } from '../../../sim/types';
import { formatNumber, t } from '../../i18n';
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
