// The Character and Crafting windows' profession convergence latch (extracted
// from the Hud's refreshOpenProfessionSurfacesIfChanged and its
// lastProfessionSurfaceSig field). Both windows are cold painters, so a late
// online cprof or professions snapshot would leave an open one stale: the Hud
// polls this on the slow band, and the personal attunement arm probes it at
// once (hud/professions/profession_event_router.ts). The signature itself is
// the pure professionSurfaceRefreshSig; this class only holds the last one and
// repaints the open surfaces when it moves.
//
// A DOM module: it reads #crafting-window's display, the open-state test the
// crafting window's other repaint gates spell the same way.

import type { IWorld } from '../../../world_api';
import { buildGatheringProficiencyRows } from './gathering_view';
import { professionSurfaceRefreshSig } from './profession_identity_view';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

/** The Hud members the latch repaints through. */
export interface ProfessionSurfaceRefreshDeps {
  /** The live world, read per probe (both hosts). */
  world(): IWorld;
  /** CharWindow.renderIfOpen: a closed sheet is never painted. */
  renderCharWindowIfOpen(): void;
  renderCrafting(): void;
}

export class ProfessionSurfaceRefresh {
  // Character and Crafting are cold painters. Diff the local crafting
  // identity plus the gathering proficiency rows on the slow band so a late
  // online cprof or professions snapshot replaces stale archetype art/title
  // and Gathering numbers without repainting for attunedZone bystanders.
  private lastSig = '';

  constructor(private readonly deps: ProfessionSurfaceRefreshDeps) {}

  refreshIfChanged(): void {
    // Unlike the isOpen-gated siblings on the slow band, the signature is
    // computed even with both surfaces closed: at the 2 Hz slow cadence the
    // stringify is negligible, and keeping the signature warm means reopening
    // a surface (which always paints fresh) is not followed by a redundant
    // signature-diff repaint on the next slow tick.
    const world = this.deps.world();
    const sig = professionSurfaceRefreshSig(
      world.craftingIdentity,
      buildGatheringProficiencyRows(world),
    );
    if (sig === this.lastSig) return;
    this.lastSig = sig;
    this.deps.renderCharWindowIfOpen();
    if ($('#crafting-window').style.display === 'flex') this.deps.renderCrafting();
    // The open VENDOR window deliberately does NOT ride this signature, even
    // though a gathering counter is one of the things its goods rows are now
    // painted from (the tool gate, sim/content/vendor_row_gates.ts). No
    // player-reachable path crosses a threshold while that window is up: it
    // closes past NPC_WINDOW_CLOSE_RANGE of the merchant, a harvest needs the
    // player within INTERACT_RANGE of a node, and no node sits close enough to
    // a counter stocking a gated tool for both to hold at once. The separation
    // is asserted against those two constants in
    // tests/professions_tool_gate.test.ts rather than trusted, so content that
    // moves a node or a merchant into that gap fails there instead of silently
    // becoming a stale lock.
    //
    // The one exception is the `/dev gather` cheat, which grants proficiency
    // from anywhere on a dev realm. Cosmetic only: the lock is advisory, the
    // buy path re-runs the same resolver, and proficiency only ever rises in
    // session, so a stale row is over-locked rather than wrongly open. (The
    // sole decrement anywhere is the one-time mastery reset, which runs inside
    // applyState at character load, when no window can be open.)
  }
}
