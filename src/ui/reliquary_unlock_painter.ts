// The paint half of a Reliquary catalog fill and of a friend's Illumination
// broadcast (extracted from Hud.handleReliquaryUnlocks and the handleEvents
// reliquaryIlluminationBroadcast arm). The batching rules are the pure plan's
// (reliquary_view buildReliquaryUnlockPlan): each unlock gets a gold log line;
// rank-up outranks Illumination outranks a plain unlock for the single banner
// slot; one sound per drain; reducedMotion trims motion only. Membership is
// NEVER invented here: the event is presentation-only. This module only draws
// the plan through the CelebrationHost seam, so Hud stays a thin caller and a
// suite drives the real lines without the Hud.
//
// Swept by the painter gate (HOT_PAINTERS in tests/hud_perf_budget.test.ts):
// it makes no raw DOM write; the name-link nodes are minted on `document` by
// deed_chat_line.ts and land through the host's logNodes.

import { audio } from '../game/audio';
import { RELIQUARY_PAGES, RELIQUARY_PAGES_BY_ID } from '../sim/content/reliquary';
import { deedName } from './deed_i18n';
import { DEED_NAME_TOKEN, deedChatLinkEl, deedLineNodes } from './hud/chat/deed_chat_line';
import type { CelebrationHost } from './hud/professions/skill_level_toast_painter';
import { HUD_LOG } from './hud_tones';
import { formatNumber, t, tPlural } from './i18n';
import {
  reliquaryIlluminationBroadcastLine,
  reliquaryIlluminationBroadcastRendered,
  reliquaryPageName,
} from './reliquary_i18n';
import { reliquaryRelicDisplayName } from './reliquary_labels';
import {
  buildReliquaryUnlockPlan,
  CURATOR_BORDER_REWARD,
  curatorRankNameKey,
  type ReliquaryUnlockEventModel,
  reliquaryFlashKey,
  reliquaryRelicPageId,
  reliquaryRelicPageIndex,
} from './reliquary_view';
import type { ReliquaryWindow } from './reliquary_window';

/** The celebration host plus the node-body chat line (the name-link splice)
 *  and the Reliquary window a line's link jumps into and an unlock refreshes. */
export interface ReliquaryUnlockHost extends CelebrationHost {
  logNodes(nodes: readonly Node[], color: string): void;
  readonly reliquaryWindow: Pick<
    ReliquaryWindow,
    | 'isOpen'
    | 'open'
    | 'openWithPage'
    | 'flashRelics'
    | 'celebrateIllumination'
    | 'refreshIfChanged'
  >;
}

/** Named Curator rank for rank-up toast/banner (cosmetic chrome only). */
function curatorRankDisplayName(rank: number): string {
  return t(curatorRankNameKey(rank), { rank: formatNumber(rank) });
}

export function paintReliquaryUnlocks(
  host: ReliquaryUnlockHost,
  events: ReliquaryUnlockEventModel[],
): void {
  const reducedMotion = host.reducedMotion();
  const plan = buildReliquaryUnlockPlan(events, reducedMotion);
  // One catalog index for the whole drain, feeding the SAME resolution the
  // Reliquary's own recent strip uses (reliquaryRelicPageId: the first
  // authored page listing the slot). A chip and its own announcement
  // therefore cannot point at different pages.
  const pageIndex = reliquaryRelicPageIndex(RELIQUARY_PAGES);
  for (const log of plan.logs) {
    // One shared resolver for chat, banner, and every window surface: the two
    // ladders here each carried their own humanized fallback, and only one of
    // them stripped a colon namespace, so `mount:swift_gryphon` printed
    // differently in the log than on the banner for the same unlock.
    const name = reliquaryRelicDisplayName(log.kind, log.id);
    const pageId = reliquaryRelicPageId(pageIndex, log.id);
    if (pageId === null) {
      // A relic the catalog no longer places has nowhere to jump, so the line
      // stays plain rather than offering a link that opens nothing (the
      // recent strip's inert-chip policy).
      host.log(t('hudChrome.reliquary.unlockToast', { name }), HUD_LOG.NOTICE);
      continue;
    }
    // The durable gold line, with the relic name spliced in as a clickable
    // jump to the page that holds it.
    host.logNodes(
      deedLineNodes(document, t('hudChrome.reliquary.unlockToast', { name: DEED_NAME_TOKEN }), () =>
        deedChatLinkEl(document, name, () => host.reliquaryWindow.openWithPage(pageId)),
      ),
      HUD_LOG.NOTICE,
    );
  }
  // Durable Illumination log survives even when rank-up claims the banner slot.
  if (plan.illuminatedPageId && plan.banner?.kind !== 'illuminate') {
    const pageName = reliquaryPageName(plan.illuminatedPageId);
    // Captured for the link closure: a property narrowing does not survive
    // into a callback, and the jump target is exactly the illuminated page.
    const jumpId = plan.illuminatedPageId;
    // Membership via Object.hasOwn (the reliquary_i18n pageDef idiom): the
    // record has a normal prototype, so an `in`/truthiness check would let
    // a forged id like "constructor" through.
    if (!Object.hasOwn(RELIQUARY_PAGES_BY_ID, jumpId)) {
      // A page the catalog no longer holds (client/server catalog drift)
      // would jump to a window that opens un-navigated, so the line stays
      // plain instead of carrying a dead link: the relic line's inert-link
      // policy above, applied to both Illumination emitters.
      host.log(t('hudChrome.reliquary.illuminateToast', { name: pageName }), HUD_LOG.NOTICE);
    } else {
      host.logNodes(
        deedLineNodes(
          document,
          t('hudChrome.reliquary.illuminateToast', { name: DEED_NAME_TOKEN }),
          () => deedChatLinkEl(document, pageName, () => host.reliquaryWindow.openWithPage(jumpId)),
        ),
        HUD_LOG.NOTICE,
      );
    }
  }
  if (plan.banner) {
    const banner = plan.banner;
    let bannerText: string;
    if (banner.kind === 'rankUp') {
      const rankName = curatorRankDisplayName(banner.rank);
      bannerText = t('hudChrome.reliquary.rankUpBanner', {
        rank: formatNumber(banner.rank),
        name: rankName,
      });
      // The rank is the whole collection's, so its link lands on Overview,
      // the one surface that shows the seal and the catalog total.
      host.logNodes(
        deedLineNodes(
          document,
          t('hudChrome.reliquary.rankUpToast', {
            rank: formatNumber(banner.rank),
            name: DEED_NAME_TOKEN,
          }),
          () => deedChatLinkEl(document, rankName, () => host.reliquaryWindow.open('overview')),
        ),
        HUD_LOG.NOTICE,
      );
      // The one rank whose deed bridge rewards a nameplate border earns a
      // second, durable line: the rank banner alone never says the border is
      // now wearable, and the Book of Deeds is where it is put on.
      if (CURATOR_BORDER_REWARD !== null && banner.rank === CURATOR_BORDER_REWARD.rank) {
        host.log(
          t('hudChrome.reliquary.borderWearableNote', {
            name: deedName(CURATOR_BORDER_REWARD.deedId),
          }),
          HUD_LOG.NOTICE,
        );
      }
    } else if (banner.kind === 'illuminate') {
      const pageName = reliquaryPageName(banner.pageId);
      bannerText = t('hudChrome.reliquary.illuminateBanner', { name: pageName });
      // The banner's own Illumination line is clickable too: this is the
      // branch that fires when Illumination OWNS the banner slot, and a
      // single-site conversion would leave it plain.
      const jumpId = banner.pageId;
      if (!Object.hasOwn(RELIQUARY_PAGES_BY_ID, jumpId)) {
        // Same drift guard as the durable arm: a catalog-unknown page gets
        // the plain line, never a link that would open un-navigated. The
        // banner prose above keeps the (fallback) name on purpose: it is
        // text, not a jump, and a drift drain is a dev/ops anomaly worth
        // seeing.
        host.log(t('hudChrome.reliquary.illuminateToast', { name: pageName }), HUD_LOG.NOTICE);
      } else {
        host.logNodes(
          deedLineNodes(
            document,
            t('hudChrome.reliquary.illuminateToast', { name: DEED_NAME_TOKEN }),
            () =>
              deedChatLinkEl(document, pageName, () => host.reliquaryWindow.openWithPage(jumpId)),
          ),
          HUD_LOG.NOTICE,
        );
      }
    } else {
      const relic = banner.relic;
      const name = reliquaryRelicDisplayName(relic.kind, relic.id);
      bannerText = t('hudChrome.reliquary.unlockToast', { name });
    }
    host.showCelebrationBanner(bannerText, 'deed', 'deed', plan.motion);
    host.announce(bannerText);
  }
  if (plan.playSound) audio.achievement();
  // Immediate open-window refresh so silhouette grids fill live.
  // refreshIfChanged, NOT bare render(): the prebuilt-input path
  // classifies the repaint as world-driven, which keeps the live region
  // silent when the announced count did not change; a bare render() reads
  // as player-driven and re-announces a count the player never asked
  // about (the Phase 13 QA regression). Offline the ownership digest
  // moves in the same tick, so this paints immediately. Online the event
  // frame can precede the heavy snapshot that moves the mirror, in which
  // case this call elides and the grid converges when that snapshot lands
  // plus the slow band (the old bare render() painted the same stale
  // mirror, just noisily).
  if (plan.refreshWindow && host.reliquaryWindow.isOpen) {
    // Arm the celebration one-shots BEFORE the refresh, so the repaint that
    // shows the fill is the one that carries them. Both are consumed by a
    // render, so a refresh that elides (the online snapshot-lag case above)
    // leaves them armed for the paint that actually shows the new state
    // instead of firing on a surface that has not caught up yet. Reduced
    // motion is handled in CSS for both, so a player who prefers less motion
    // still gets the static treatment rather than nothing.
    host.reliquaryWindow.flashRelics(plan.logs.map((log) => reliquaryFlashKey(log.kind, log.id)));
    if (plan.illuminatedPageId !== null) {
      host.reliquaryWindow.celebrateIllumination(plan.illuminatedPageId);
    }
    host.reliquaryWindow.refreshIfChanged();
  }
  // On-join catch-up: one localized summary line, the same treatment the
  // Book of Deeds gives its retro pass. No banner, no audio, and no forced
  // window rebuild (the slow-band signature picks the new fills up).
  if (plan.retroCount > 0) {
    const retroText = tPlural('hudChrome.plurals.reliquaryRetroSummary', plan.retroCount, {
      count: formatNumber(plan.retroCount, { maximumFractionDigits: 0 }),
    });
    host.log(retroText, HUD_LOG.NOTICE);
    host.announce(retroText);
  }
}

/** A guildmate's or followed friend's first-ever page Illumination (Phase 18),
 *  the deed broadcast's Reliquary sibling. Id-based on the wire (the server
 *  sends the page id, never English); the line composes in reliquary_i18n
 *  (Node-pinned there), guild-chat green, with the page name spliced in as a
 *  clickable jump to that page in the viewer's own Reliquary. A catalog-unknown
 *  page id (mixed-version drift; membership via Object.hasOwn, the
 *  reliquary_i18n pageDef idiom) keeps the plain line rather than a dead link:
 *  the Illumination toast's inert-link policy. */
export function paintReliquaryIlluminationBroadcast(
  host: Pick<ReliquaryUnlockHost, 'logNodes' | 'reliquaryWindow'>,
  characterName: string,
  pageId: string,
): void {
  if (!Object.hasOwn(RELIQUARY_PAGES_BY_ID, pageId)) {
    // Text NODES, never the token-parsing log path: this branch is the one
    // place a remote-origin string (name + raw page id) reaches chat, and it
    // must stay structurally inert rather than incidentally safe via the name
    // charset.
    host.logNodes(
      [document.createTextNode(reliquaryIlluminationBroadcastLine(characterName, pageId))],
      HUD_LOG.BROADCAST,
    );
  } else {
    host.logNodes(
      deedLineNodes(
        document,
        reliquaryIlluminationBroadcastRendered(characterName, DEED_NAME_TOKEN),
        () =>
          deedChatLinkEl(document, reliquaryPageName(pageId), () =>
            host.reliquaryWindow.openWithPage(pageId),
          ),
      ),
      HUD_LOG.BROADCAST,
    );
  }
}
