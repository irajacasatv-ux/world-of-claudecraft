// Town Focus (#1143): persistent per-player harvest-component focus, settable
// only while standing in the current zone's town hub (the lightweight town-tag
// stand-in; see professions/focus.ts). The panel shows the allocation and lets
// it be edited even out of town (so a player can see what they have), but
// disables the steppers/save outside town: the real gate is server-side in
// Sim.setTownFocus, this is a cosmetic usability gate.
//
// Moved whole out of the Hud (its draft, re-spec tier, repaint latch, opener
// and every method that touched them): the view is town_focus_view.ts, the
// painter town_focus_window.ts, and this controller owns the panel's state and
// open/paint/close lifecycle. Hud builds it lazily over itself as the host (so
// tsc checks the Hud against TownFocusHost) plus the panel's windowFocus
// bridge over the ONE FocusManager every window shares, keeps toggleTownFocus
// and townFocusOpen as its public entry points, drives refreshIfChanged from
// the slow band of update(), and routes the managed close (Escape / closeAll /
// gamepad) to close().
//
// A DOM module: it reads and hides the #town-focus-window root.

import { zoneAt } from '../../../sim/data';
import {
  computeRespecCost,
  FOCUS_POINT_BUDGET,
  isInTownZone,
  type RespecPaymentTier,
} from '../../../sim/professions/focus';
import type { IWorld } from '../../../world_api';
import type { WindowFocusBridge } from '../../window_focus';
import { buildTownFocusView, stepTownFocus, townFocusRenderSig } from './town_focus_view';
import { renderTownFocusWindow } from './town_focus_window';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

/** The Hud members the panel reads and drives. */
export interface TownFocusHost {
  readonly sim: Pick<IWorld, 'player' | 'townFocus' | 'townFocusPending' | 'setTownFocus'>;
  /** Clears the transient overlays (context menu, tooltip) before an open. */
  closeOtherWindows(keep?: string | string[]): void;
  hideTooltip(): void;
}

export class TownFocusController {
  private draft: Record<string, number> | null = null;

  /** The #1144 re-spec payment tier the panel's Save will charge. Defaults to
   *  'time', the free tier, so an untouched picker never surprises the player
   *  with a charge; reset alongside the draft on every fresh open. */
  private respecTier: RespecPaymentTier = 'time';

  /** The signature of what the panel currently shows (#2500). `''` until the
   *  first paint arms it, which no real signature can spell (every one carries
   *  the in-town flag, the budget and a row per component). */
  private lastSig = '';

  // Standalone trapping window (#2525): the train / unbind shape, one
  // windowFocus bridge plus one opener field. The panel was outside the shared
  // focus system entirely: absent from every windowFocus(rootSel) call site and
  // not one of the two documented opt-outs (#bags and #bank-window, which pair
  // with a second window and must stay Tab-passable), so it had no Tab trap and
  // no return-to-opener. It was not the last out (vendor, trade and map still
  // are; crafting joined at #2876, report at qr-19-report-window-focus-trap-carveout);
  // it is the one that became REACHABLE, because
  // #2500 stopped the panel rebuilding itself twice a second and focus started
  // surviving long enough for the missing hand-back to matter.
  private openerFocus: HTMLElement | null = null;

  constructor(
    private readonly host: TownFocusHost,
    private readonly windowFocus: WindowFocusBridge,
  ) {}

  /** Standing in the current zone's town hub: the gate behind the minimap
   *  button and the panel's enabled controls. */
  isInTown(): boolean {
    const pos = this.host.sim.player.pos;
    return isInTownZone(pos, zoneAt(pos.x, pos.z));
  }

  toggle(): void {
    const el = $('#town-focus-window');
    if (el.style.display === 'block') {
      this.close();
      return;
    }
    this.host.closeOtherWindows('#town-focus-window');
    // Open on the QUEUED allocation when one waits: re-saving it never restarts the clock.
    this.draft = { ...(this.host.sim.townFocusPending?.allocation ?? this.host.sim.townFocus) };
    this.respecTier = 'time';
    this.render();
    // AFTER the first paint, the train / unbind ordering: captureFocus records
    // the opener (the minimap button) and installs the trap over a root that is
    // by then populated and displayed. The one case where AFTER would be worse
    // than BEFORE is unreachable: if the paint could leave focus INSIDE the
    // panel, captureFocus would record an in-window opener and the bridge's
    // in-window arm would then decline to release the trap on close. It cannot,
    // because the root is display:none until this paint, so a browser has
    // already blurred its stale children to <body>, and activeFocusable()
    // rejects <body>.
    this.openerFocus = this.windowFocus.captureFocus();
  }

  render(): void {
    const inTown = this.isInTown();
    const allocation = this.draft ?? this.host.sim.townFocus;
    const pending = this.host.sim.townFocusPending;
    const view = buildTownFocusView(allocation, FOCUS_POINT_BUDGET, inTown, pending);
    // Re-arm the latch on EVERY paint, whatever caused it (the open, a step, a
    // language switch), so the slow-band probe below elides against the state
    // actually on screen rather than against the last thing the probe itself
    // painted.
    this.lastSig = townFocusRenderSig(view);
    // #1144: the cost preview for the CHOSEN tier, priced off the committed
    // allocation vs the draft (never the raw request), the same pair
    // Sim.setTownFocus charges against server-side.
    const cost = computeRespecCost(this.host.sim.townFocus, allocation, this.respecTier);
    renderTownFocusWindow(
      $('#town-focus-window'),
      view,
      { tier: this.respecTier, cost },
      {
        onStep: (component, delta) => {
          this.draft = stepTownFocus(
            this.draft ?? this.host.sim.townFocus,
            component,
            delta,
            FOCUS_POINT_BUDGET,
          );
          this.render();
        },
        onTierChange: (tier) => {
          this.respecTier = tier;
          this.render();
        },
        onSave: () => {
          this.host.sim.setTownFocus(this.draft ?? {}, this.respecTier);
          this.draft = null;
          this.close();
        },
        onClose: () => this.close(),
      },
    );
  }

  /** Slow-band staleness check for an OPEN panel (#2500). The panel used to
   *  repaint on the open check alone, so an idle one discarded and rebuilt its
   *  entire subtree twice a second: wasted work, and it destroyed the keyboard
   *  user's focused control on a timer. Rebuild only when what the panel shows
   *  actually moves (an edit to the draft, or walking in or out of town). The
   *  open check comes FIRST so a closed panel costs nothing at all, and
   *  render() owns the re-arm so every other paint cause arms it too. */
  refreshIfChanged(): void {
    if (!this.isOpen) return;
    const sig = townFocusRenderSig(
      buildTownFocusView(
        this.draft ?? this.host.sim.townFocus,
        FOCUS_POINT_BUDGET,
        this.isInTown(),
        this.host.sim.townFocusPending,
      ),
    );
    if (sig === this.lastSig) return;
    this.render();
  }

  /** The ONE close path: the X and Save go through onClose/onSave, Escape and
   *  the gamepad go through Hud.closeAll -> closeManagedWindow's
   *  `town-focus-window` case, and the toggle re-press comes straight here. So
   *  releasing the trap and handing focus back once, here, covers every one of
   *  them.
   *
   *  Deliberately NOT guarded on `isOpen` the way closeTrain/closeUnbind
   *  guard on their npc id: those hold open state in a field, this panel reads
   *  it off the DOM, every caller is already guarded, and a redundant call is a
   *  no-op (the opener is nulled below, and releasing a released trap does
   *  nothing). A guard would also make the "a later close cannot re-steal focus"
   *  test pass for the wrong reason.
   *
   *  KNOWN EDGE, NOT fixed here, and the obvious local fix is a trap. The panel
   *  is deliberately readable out of town while the slow band hides
   *  #mm-town-focus out of town, so a player can open it in town, walk out, and
   *  close with the opener no longer rendered. FocusManager then refuses the
   *  hand-back (no client rects: moving focus somewhere invisible is a WCAG
   *  2.4.11 failure), focus is left standing, and the browser drops it to <body>
   *  with the panel. That is the pre-#2525 outcome, never worse, and the trap is
   *  released either way.
   *  Do NOT "fix" it by keeping the button visible while the panel is open: the
   *  hand-back lands, then the next slow tick (<=500ms later) hides the button
   *  again now that the panel is closed, and focus drops anyway. A flicker
   *  instead of a loss. The real fix is a fallback destination, which
   *  makeWindowFocus passes for NO window (closeTrain / closeUnbind hand back to
   *  a gossip button that is already gone), so it belongs to the bridge and the
   *  whole family, not to this one caller. */
  close(): void {
    $('#town-focus-window').style.display = 'none';
    this.draft = null;
    this.host.hideTooltip();
    this.windowFocus.restoreFocus(this.openerFocus);
    this.openerFocus = null;
  }

  get isOpen(): boolean {
    return $('#town-focus-window').style.display === 'block';
  }
}
