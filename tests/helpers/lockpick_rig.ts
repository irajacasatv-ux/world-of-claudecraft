// The lockpick panel rig (#2517), shared by the controller's managed-close latch
// suite (tests/lockpick_managed_close.test.ts, which drives
// LockpickController.requestClose directly) and the coordinator suite
// (tests/hud_window_coordination.test.ts, which drives the real Hud.closeAll
// over the same controller on a bare Hud.prototype). Moved here whole from the
// latch suite when its closeAll cases left it, so the two files build one
// controller the same way. Free of any src/ui/hud import on purpose.
import { vi } from 'vitest';
import type { SimEvent } from '../../src/sim/types';
import type { FocusTrapHandle } from '../../src/ui/focus_manager';
import { LockpickController } from '../../src/ui/hud/delve/lockpick_controller';
import type { LockpickView } from '../../src/world_api';

export const LIVE: LockpickView = {
  sessionId: 'lp_9_0',
  objectId: 9,
  w: 4,
  h: 4,
  col: 0,
  row: 2,
  page: 1,
  pageCount: 2,
  tries: 2,
  triesTotal: 2,
  lootTier: 'premium',
  allowed: ['set', 'steady', 'ease'],
  visible: [],
  stepTimeoutMs: 15000,
};

// Every controller a case builds, so afterEach can drop its capture-phase window keydown
// listener. Without this a controller left OPEN by one case (which is exactly what the bug
// under test does) keeps a live handler on the shared jsdom window, and its
// stopImmediatePropagation eats the next case's Escape before the new controller sees it.
const built: LockpickController[] = [];

/** Close every controller the rig built (call from afterEach). */
export function closeBuiltLockpicks(): void {
  for (const controller of built.splice(0)) controller.close(false);
}

/**
 * @param host which IWorld the deps model, and the distinction is the whole point.
 *   'online' (the default): `abort` only sends, so `getState()` keeps returning the live view
 *   and the panel is still up when requestClose returns, exactly like ClientWorld waiting on
 *   the server's lockpickEnd. 'offline': `abort` does what Sim does, emitting lockpickEnd
 *   into the drain that `submitAbort`'s own `flushEvents()` reads, so the whole teardown
 *   lands inside the one closeAll call.
 */
export function lockpickRig(initial: LockpickView | null, host: 'online' | 'offline' = 'online') {
  // closeAll reads #ctx-menu and #delve-rite-panel before it ever reaches the topmost
  // scan, and `$` returns null for a missing id, so both must exist.
  document.body.innerHTML =
    '<div id="ctx-menu" style="display:none"></div>' +
    '<div id="delve-rite-panel" class="window panel" style="display:none"></div>' +
    '<div id="lockpick-panel" class="window panel" style="display:none"></div>';
  const panel = document.getElementById('lockpick-panel') as HTMLElement;
  const release = vi.fn();
  const trap: FocusTrapHandle = { focusFirst: vi.fn(), release, opener: vi.fn(() => null) };
  // The controller's own hideTooltip dep. Production wires it as
  // `hideTooltip: () => this.hideTooltip()` where the controller is built, so in the
  // client it IS the Hud's hideTooltip; the coordinator suite gives the Hud its own spy
  // so a case can say which caller owed the hide, never claiming the two can diverge.
  const depsHideTooltip = vi.fn();
  let state: LockpickView | null = initial;
  let pending: SimEvent[] = [];
  const queued: SimEvent[] = [];
  const abort = vi.fn(() => {
    if (queued.length > 0) {
      pending.push(...queued.splice(0));
      return;
    }
    if (host !== 'offline') return;
    // What src/sim/delves/lockpick_controller.ts does: ABANDON the session and emit, both
    // synchronously, so drainEvents returns it inside the same call stack.
    state = null;
    pending.push({ type: 'lockpickEnd', sessionId: LIVE.sessionId, outcome: 'abandoned' });
  });
  const controller = new LockpickController({
    panel,
    keyboardTarget: window,
    openFocusTrap: () => trap,
    getState: () => state,
    engage: vi.fn(),
    act: vi.fn(),
    abort,
    drainEvents: () => {
      const out = pending;
      pending = [];
      return out;
    },
    // The one arm of Hud.handleEvents this path reaches, transcribed from
    // src/ui/hud.ts's `case 'lockpickEnd': this.endLockpick(...)` ->
    // controller.end(outcome, tier, sessionId). Transcribed, NOT pinned: no guard ties this
    // fake to that switch, so a rewrite there would leave these cases green against a mapping
    // the client no longer has.
    handleEvents: (events) => {
      for (const ev of events) {
        if (ev.type === 'lockpickEnd') controller.end(ev.outcome, undefined, ev.sessionId);
        // hud.ts's `case 'lockpickSession': this.openLockpickBoard()`. Faithful because the
        // repeat arm's statement ORDER depends on it: a drained event can re-open this panel.
        if (ev.type === 'lockpickSession') controller.openBoard();
      }
    },
    showBanner: vi.fn(),
    log: vi.fn(),
    hideTooltip: depsHideTooltip,
  });
  built.push(controller);
  return {
    controller,
    panel,
    release,
    abort,
    depsHideTooltip,
    bar: () => panel.querySelector<HTMLElement>('.lp-timer-bar'),
    setState(next: LockpickView | null): void {
      state = next;
    },
    /** Make the NEXT abort's flushEvents drain carry these events. */
    queueOnAbort(...events: SimEvent[]): void {
      queued.push(...events);
    },
  };
}
