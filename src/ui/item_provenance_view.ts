// Tracked-item provenance tooltip lines (src/sim/item_provenance.ts): the
// owner-only footer under an epic or legendary copy's card. Three facts, in
// this order: where the copy came from and who first obtained it (a kill, a
// quest reward, or a generic "obtained"), how many hands it has changed
// since (only once it has), and its item ID (the guid a support request
// quotes). Pure string builders (a UI_PURE_CORES member): no DOM, no clock,
// so every variant is Node-testable; the date comes from the record's own
// host epoch ms through the i18n formatter.
//
// Peers never see these lines: the eqi inspect wire and publicInstanceView
// leave guid and provenance out by construction, so an inspect card and a
// market row render nothing here, on both hosts.

import type { ItemInstancePayload, ItemProvenance } from '../sim/types';
import { esc } from './esc';
import { formatDateTime, formatNumber, t } from './i18n';

const MOB_SOURCE_PREFIX = 'mob:';
const QUEST_SOURCE_PREFIX = 'quest:';

/** The origin line's key for a provenance source id. */
export function provenanceOriginKey(
  source: string,
):
  | 'hudChrome.itemTooltip.lootedBy'
  | 'hudChrome.itemTooltip.questRewardTo'
  | 'hudChrome.itemTooltip.obtainedBy' {
  if (source.startsWith(MOB_SOURCE_PREFIX)) return 'hudChrome.itemTooltip.lootedBy';
  if (source.startsWith(QUEST_SOURCE_PREFIX)) return 'hudChrome.itemTooltip.questRewardTo';
  return 'hudChrome.itemTooltip.obtainedBy';
}

/** The plain-text facts the lines are built from, for the tests and any
 *  surface that composes them differently. */
export function itemProvenanceFacts(provenance: ItemProvenance): {
  origin: string;
  previousOwners: string | null;
} {
  const origin = t(provenanceOriginKey(provenance.source), {
    name: provenance.by,
    date: formatDateTime(provenance.at, { dateStyle: 'medium' }),
  });
  const transfers = provenance.transfers ?? 0;
  const previousOwners =
    transfers > 0
      ? t('hudChrome.itemTooltip.previousOwners', { count: formatNumber(transfers) })
      : null;
  return { origin, previousOwners };
}

/** The footer lines for one copy: empty for an untracked payload. */
export function itemProvenanceLines(instance?: ItemInstancePayload): string {
  if (!instance?.guid) return '';
  let html = '';
  if (instance.provenance) {
    const facts = itemProvenanceFacts(instance.provenance);
    html += `<div class="tt-sub">${esc(facts.origin)}</div>`;
    if (facts.previousOwners !== null)
      html += `<div class="tt-sub">${esc(facts.previousOwners)}</div>`;
  }
  html += `<div class="tt-sub tt-item-guid">${esc(
    t('hudChrome.itemTooltip.itemGuid', { guid: instance.guid }),
  )}</div>`;
  return html;
}
