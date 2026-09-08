import { HEARTH_KEY_COOLDOWN_MS, HEARTH_KEY_ITEM_ID } from '../../../sim/freehold/gate_rules';
import type { ItemDef } from '../../../sim/types';
import { formatNumber, t } from '../../i18n';
import { tooltipLine } from '../../tooltip_line_core';

/** Total reuse duration is live mechanic metadata, never an invented ready-time mirror. */
export function hearthKeyTooltipLines(item: ItemDef): string {
  if (item.id !== HEARTH_KEY_ITEM_ID) return '';
  return (
    tooltipLine(
      'tt-sub',
      t('abilityUi.tooltip.cooldownSeconds', {
        seconds: formatNumber(HEARTH_KEY_COOLDOWN_MS / 1000),
      }),
    ) + tooltipLine('tt-desc', t('hudChrome.housing.hearthKey.tooltip'))
  );
}
