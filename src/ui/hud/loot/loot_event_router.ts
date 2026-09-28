// The HUD's routing of the grant hub's 'loot' event (extracted whole from the
// Hud's per-event switch, the quest_event_router.ts shape): the held-loot
// warning toast, the roll-win banner, the generic grant line (which a
// professions grant's own result line stands in for, #2430), the loot-roll
// prompt close, the generic cue (which a grant owning its own cue silences),
// and the open bags refresh.
//
// It takes a typed host (LootEventHost) and Hud passes itself, so tsc checks Hud
// against the host; the member names are also welded in tests/loot_event_router.test.ts.

import { audio } from '../../../game/audio';
import type { ItemInstancePayload, SimEvent } from '../../../sim/types';
import type { BannerShowArgs } from '../../banner_slot';
import { heldLootWarningText } from '../../held_loot_warning_view';
import { HUD_LOG } from '../../hud_tones';
import { lootQualityReceiptBody } from '../../loot_quality_receipt';
import { lootRollWinBanner } from '../../loot_roll_win_view';
import { localizeLootText } from '../../loot_text_i18n_core';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

type LootEvent = Extract<SimEvent, { type: 'loot' }>;

/** The private Hud members the router drives. */
export interface LootEventHost {
  readonly sim: { readonly player?: { readonly name: string } | null };
  readonly errorToast: { show(text: string, durationMs?: number, heldLoot?: boolean): void };
  showBanner(...args: BannerShowArgs): unknown;
  log(text: string | readonly Node[], color?: string): void;
  /** Appends one clickable chat item link (an exact copy's when given). */
  appendChatItemLink(parent: HTMLElement, itemId: string, instance?: ItemInstancePayload): void;
  readonly lootRolls: { closeForItem(text: string, exactRollId?: number): void };
  renderBags(): void;
}

/** Present one sim event through the loot arm. True when it was a 'loot'
 *  event, so the HUD's per-event switch skips it. */
export function applyLootEventPresentation(h: LootEventHost, ev: SimEvent): boolean {
  switch (ev.type) {
    case 'loot': {
      const heldWarning = heldLootWarningText(ev.text);
      if (heldWarning) h.errorToast.show(heldWarning, 7500, true);
      const wonBanner = lootRollWinBanner(ev.text, h.sim.player?.name);
      if (wonBanner) h.showBanner(...wonBanner);
      // callerLogs: a professions grant whose own result event (gatherResult
      // / fishingResult / craftResult / disenchantResult / salvageResult /
      // enchantResult) renders the player-visible line for this same grant,
      // richer than this one (rolled quality color, quantity, a clickable
      // item link). The hub line stands down so one action prints one line
      // (#2430). Everything else in this arm still runs for those grants:
      // the loot-roll close below, the bag refresh, and the independent
      // audio guard.
      // The body is the localized line, or, for a quality-rolled copy, the
      // nodes whose item link carries that exact copy (lootReceiptBody).
      if (!ev.callerLogs) h.log(lootReceiptBody(h, ev), HUD_LOG.GOOD);
      if (
        / wins .+ \(\d+\)$/.test(ev.text) ||
        /^Everyone passed on .+\.$/.test(ev.text) ||
        / assigned .+ to .+\.$/.test(ev.text) ||
        /^.+ was not assigned and is free for all\.$/.test(ev.text)
      )
        h.lootRolls.closeForItem(ev.text, ev.rollId);
      // silent: the audio half of the same idea, and independent of it (a
      // caller can own the cue without owning the line). A professions
      // grant sets this when it owns the cue for the same grant: it has a
      // dedicated one and the generic ding would stack on top, or it
      // replays that same ding itself exactly once for a whole multi-item
      // command (the harvestResult arm, profession_event_router.ts), or its
      // result event is cue-free by contract and the ding would be the only
      // sound at all (the Maker's Bond unbind, #2458).
      if (!ev.silent) {
        if (ev.text.includes('loot') || ev.text.includes('Sold') || ev.text.includes('Bought back'))
          audio.coin();
        else audio.lootItem();
      }
      if ($('#bags').style.display !== 'none') h.renderBags();
      break;
    }
    default:
      return false;
  }
  return true;
}

/** The generic grant line's body (src/ui/loot_quality_receipt.ts): the
 *  localized text, or for a quality-rolled copy the nodes whose item link
 *  opens that exact copy rather than the catalogue definition. */
function lootReceiptBody(h: LootEventHost, ev: LootEvent): string | Node[] {
  return lootQualityReceiptBody(document, ev, localizeLootText, (parent, id, copy) =>
    h.appendChatItemLink(parent, id, copy),
  );
}
