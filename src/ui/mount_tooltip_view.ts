import { MOUNTS } from '../sim/content/mounts';
import type { ItemDef } from '../sim/types';
import { t } from './i18n';
import { MOUNT_DESC_KEYS, mountSpecLines } from './mount_labels';
import { tooltipLine } from './tooltip_line_core';

/** Collectible reins show the mount's flavor, mobility, and summon instruction. */
export function mountTooltipLines(item: ItemDef): string {
  if (item.kind !== 'mount') return '';
  const mountDef = MOUNTS[item.mount];
  if (!mountDef) return '';
  let html = '';
  const descKey = MOUNT_DESC_KEYS[mountDef.key];
  if (descKey) html += tooltipLine('tt-desc', t(descKey));
  for (const line of mountSpecLines({ speedPct: Math.round(mountDef.moveSpeedPct * 100) })) {
    html += tooltipLine('tt-green', line);
  }
  html += tooltipLine('tt-sub', t('hudChrome.mounts.useToRide'));
  return html;
}
