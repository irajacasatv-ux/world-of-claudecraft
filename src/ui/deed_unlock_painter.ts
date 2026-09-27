// The paint half of the Book of Deeds earned moment and of a friend's deed
// broadcast (extracted from Hud.handleDeedUnlocks and the handleEvents
// deedBroadcast arm). The batching rules are the pure plan's (deeds_view
// buildDeedUnlockPlan): each fresh unlock gets a gold log line (the durable
// copy) and title / border rewards a hint line; the single banner slot shows
// the drain's last unlock; one celebration sound per drain. The on-join retro
// catch-up draws NO banner and NO audio, just one localized summary count.
// This module only draws the plan through the CelebrationHost seam, so Hud
// stays a thin caller and a suite drives the real lines without the Hud.
//
// Swept by the painter gate (HOT_PAINTERS in tests/hud_perf_budget.test.ts):
// it makes no raw DOM write; the deed-link nodes are minted on `document` by
// deed_chat_line.ts and land through the host's logNodes.

import { audio } from '../game/audio';
import { DEEDS } from '../sim/content/deeds';
import { deedBroadcastRendered, deedName, deedTitleText } from './deed_i18n';
import { buildDeedUnlockPlan } from './deeds_view';
import type { DeedsWindow } from './deeds_window';
import { DEED_NAME_TOKEN, deedChatLinkEl, deedLineNodes } from './hud/chat/deed_chat_line';
import type { CelebrationHost } from './hud/professions/skill_level_toast_painter';
import { HUD_LOG } from './hud_tones';
import { formatNumber, t, tPlural } from './i18n';

/** The celebration host plus the node-body chat line (the deed-link splice)
 *  and the Book of Deeds window a line's link jumps into. */
export interface DeedUnlockHost extends CelebrationHost {
  logNodes(nodes: readonly Node[], color: string): void;
  readonly deedsWindow: Pick<DeedsWindow, 'noteUnlocks' | 'openWithDeed'>;
}

export function paintDeedUnlocks(
  host: DeedUnlockHost,
  events: { deedId: string; retro?: boolean }[],
): void {
  const plan = buildDeedUnlockPlan(events, DEEDS);
  // Feed the Book's recent strip the exact session order (the drain order),
  // ahead of the server record that may still be catching up.
  host.deedsWindow.noteUnlocks(plan.logIds);
  for (const id of plan.logIds) {
    // The durable gold log line, with the deed name spliced in as a
    // clickable jump to its card in the Book of Deeds.
    host.logNodes(
      deedLineNodes(document, t('hudChrome.deeds.unlockedBanner', { name: DEED_NAME_TOKEN }), () =>
        deedChatLinkEl(document, deedName(id), () => host.deedsWindow.openWithDeed(id)),
      ),
      HUD_LOG.NOTICE,
    );
  }
  for (const id of plan.titleHintIds) {
    host.log(t('hudChrome.deeds.unlockedTitleHint', { title: deedTitleText(id) }), HUD_LOG.NOTICE);
  }
  // The border sibling of the title hint, same color and placement. A border
  // reward carries no display text of its own (only a palette slug), so the
  // line names the DEED, which is also what the picker lists it under.
  for (const id of plan.borderHintIds) {
    host.log(t('hudChrome.deeds.unlockedBorderHint', { name: deedName(id) }), HUD_LOG.NOTICE);
  }
  if (plan.bannerId !== null) {
    const bannerText = t('hudChrome.deeds.unlockedBanner', { name: deedName(plan.bannerId) });
    // The 'deed' variant, NOT the shared gold level-up treatment: an early
    // character trips three or more deeds in its first five gathering
    // actions, and an identical banner made those read as levels. Copy,
    // lifetime and the announcer push below are untouched: this is
    // presentation only, never information.
    // R38: a deed is a celebration; it queues behind whatever is live
    // instead of replacing it (the first-level-up collision). Full motion:
    // the deed plate has no reduced-motion plan of its own.
    host.showCelebrationBanner(bannerText, 'deed', 'deed', true);
    // The banner div carries no live semantics and the chat log is
    // deliberately aria-live off, so the polite #combat-live region is what
    // a screen reader hears.
    host.announce(bannerText);
  }
  if (plan.playSound) audio.achievement();
  if (plan.retroCount > 0) {
    const retroText = tPlural('hudChrome.plurals.deedsRetroSummary', plan.retroCount, {
      count: formatNumber(plan.retroCount, { maximumFractionDigits: 0 }),
    });
    host.log(retroText, HUD_LOG.NOTICE);
    host.announce(retroText);
  }
}

/** A guildmate's or followed friend's marquee unlock. Id-based on the wire
 *  (the server sends the deed id, never English); the visible line composes in
 *  deed_i18n (Node-pinned there), in the guild-chat green so it reads as social
 *  news. The deed name is spliced in as a clickable jump to that deed's card in
 *  the viewer's own Book. */
export function paintDeedBroadcast(
  host: Pick<DeedUnlockHost, 'logNodes' | 'deedsWindow'>,
  characterName: string,
  deedId: string,
): void {
  host.logNodes(
    deedLineNodes(document, deedBroadcastRendered(characterName, DEED_NAME_TOKEN), () =>
      deedChatLinkEl(document, deedName(deedId), () => host.deedsWindow.openWithDeed(deedId)),
    ),
    HUD_LOG.BROADCAST,
  );
}
