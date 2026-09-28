// @vitest-environment happy-dom

// The lockpick panel's managed-window close path (#2517).
//
// `#lockpick-panel` is a `.window.panel`, so `Hud.closeAll()` picks it up through
// `topmostOpenWindow()` and hands it to `closeManagedWindow`. With no `case` for its id it
// fell to the `default:` arm, which is `el.style.display = 'none'` and nothing else: the
// 100ms countdown interval kept firing into a hidden subtree for the rest of the attempt,
// the focus trap stayed armed on an invisible panel, and the live session was never
// withdrawn (the server kept burning the per-step clock on a board the player could not see).
//
// The keyboard Escape never showed this. `LockpickController` installs a capture-phase
// window keydown handler that calls `stopImmediatePropagation`, so Escape is handled by the
// controller and never reaches `src/game/input.ts`'s bubble listener at all. The GAMEPAD
// escape is the reachable path: `dispatchGamepadAction('escape')` in `src/main.ts` calls
// `hud.closeAll()` directly, with no DOM event for that capture handler to intercept.
//
// The latch cases here drive `LockpickController.requestClose()`, the one method the
// managed-window arm calls (`requestClose()` then `hideTooltip()`, nothing else), directly:
// they pin the controller's own withdraw / hedge / close rules, which need no Hud around them.
// The routing cases that drive the real `closeAll()` over the same rig (the topmost scan, the
// withdraw and its tooltip hide, the three-call sweep, and the keyboard / gamepad teardown
// parity) live in tests/hud_window_coordination.test.ts, which pays the coordinator import;
// the rig is tests/helpers/lockpick_rig.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimEvent } from '../src/sim/types';
import { closeBuiltLockpicks, lockpickRig as harness, LIVE } from './helpers/lockpick_rig';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(() => {
  closeBuiltLockpicks();
  // Not the inline mockRestore()s a failing expect would skip: a spy left on the shared
  // jsdom window turns one red case into a cascade in every case after it.
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('lockpick panel: LockpickController.requestClose (the managed-close latch)', () => {
  it('completes the teardown offline, inside the one requestClose call', () => {
    // The other host. Sim.lockpickAbort emits lockpickEnd synchronously and submitAbort's own
    // flushEvents drains it, so end() -> close() runs before requestClose returns. Without this
    // case every assertion in the suite describes only the online (deferred) shape.
    const h = harness(LIVE, 'offline');
    h.controller.openBoard();
    expect(vi.getTimerCount()).toBe(1);

    h.controller.requestClose();

    expect(h.abort).toHaveBeenCalledTimes(1);
    expect(h.panel.style.display, 'the round trip landed in the same stack').toBe('none');
    expect(h.release).toHaveBeenCalledTimes(1);
    expect(h.release).toHaveBeenCalledWith(true);
    expect(vi.getTimerCount()).toBe(0);
    // Nothing is left selectable: the panel is hidden, and a hidden panel leaves the
    // managed-window scan (pinned on the Hud in tests/hud_window_coordination.test.ts), so a
    // repeat sweep moves on to the next window.
  });

  it('withdraws, re-sends once, then closes, so a repeat request cannot wedge on the panel', () => {
    // SkinEventController.open() sweeps `for (i < 20 && closeTop())` to clear the stack before
    // a roll reveal, and closeTop IS closeAll. Online the withdrawal leaves the panel up, so
    // without the per-session latch this spins all 20 iterations here, fires 20 aborts, and
    // never reaches the windows underneath. The panel ends HIDDEN, not merely silent: a hidden
    // panel is what the Hud's topmost scan skips (pinned in tests/hud_window_coordination.test.ts).
    const h = harness(LIVE);
    h.controller.openBoard();

    h.controller.requestClose(); // first: withdraw
    expect(h.abort).toHaveBeenCalledTimes(1);
    expect(h.panel.style.display).toBe('block');

    h.controller.requestClose(); // second: re-send, then close
    // Two, not one and not one per iteration. ClientWorld.rawCmd drops on a closed socket
    // with no queue and no retry, so a repeat request has to hedge that the first abort was
    // never sent; closing on the assumption it landed would hide a live board and forfeit
    // the chest. Closing anyway on the same pass is what bounds it at two.
    expect(h.abort, 'one hedge re-send, not one per sweep pass').toHaveBeenCalledTimes(2);
    expect(h.panel.style.display).toBe('none');
    expect(h.release).toHaveBeenCalledWith(true);

    // The panel is hidden (asserted above), which is what lets the sweep move on; and
    // nothing more was sent on the way out.
    expect(h.abort, 'no third abort').toHaveBeenCalledTimes(2);
  });

  it('re-arms the withdrawal for a NEW session, so the latch cannot silence a real abort', () => {
    // Pick one lock, withdraw, engage another: the second withdraw must still reach the
    // server, or the latch would have converted #2517's forfeiture into a subtler one.
    //
    // Honest about what this can and cannot separate: the id keying and openPanel's reset
    // BOTH satisfy it, and no reachable input tells them apart (openBoard runs openPanel on
    // every lockpickSession). It pins the behavior, not the mechanism; the reset carries its
    // own comment saying which case it is really there for.
    const h = harness(LIVE);
    h.controller.openBoard();
    h.controller.requestClose();
    expect(h.abort).toHaveBeenCalledTimes(1);

    h.setState({ ...LIVE, sessionId: 'lp_9_1' });
    h.controller.openBoard();
    h.controller.requestClose();
    expect(h.abort, 'a fresh session withdraws on its own').toHaveBeenCalledTimes(2);
    // The count alone stopped separating the arms once the repeat arm started re-sending:
    // both send an abort. What still tells them apart is that the FRESH arm defers the close.
    expect(h.panel.style.display, 'a fresh session withdraws and waits, it does not close').toBe(
      'block',
    );
    expect(h.release, 'and its trap survives until lockpickEnd').not.toHaveBeenCalled();
  });

  it("does not clobber a board that the withdrawal's own event drain re-opened", () => {
    // Why the repeat arm closes BEFORE it re-sends. submitAbort ends in flushEvents, which
    // runs the whole handleEvents switch, and its lockpickSession / lockpickOffer arms call
    // openPanel. With the statements the other way round the close lands last and tears down
    // a board the drain had just legitimately opened, leaving the player staring at nothing
    // while the server believes a fresh lock is live.
    const h = harness(LIVE);
    h.controller.openBoard();
    h.controller.requestClose(); // withdraw, latch set, panel still up (online shape)
    expect(h.abort).toHaveBeenCalledTimes(1);

    // The next abort's drain carries a fresh session, the way a re-engage would.
    h.queueOnAbort({ type: 'lockpickSession', sessionId: 'lp_9_2' } as SimEvent);

    h.controller.requestClose(); // repeat arm: close, then re-send, whose drain re-opens the board

    expect(h.abort).toHaveBeenCalledTimes(2);
    expect(h.panel.style.display, 'the re-opened board survives the dismissal').toBe('block');
  });

  it('re-arms after a same-id re-engage, which the id keying alone cannot catch', () => {
    // The collision openPanel's reset exists for. The sim mints
    // `lp_${objectId}_${ctx.tickCount}`, so a withdraw and a re-engage on one chest inside a
    // tick reuse the string. Reachable here, and NOT vacuous: without the reset the reopened
    // board takes the repeat arm on its first dismissal and closes optimistically.
    const h = harness(LIVE);
    h.controller.openBoard();
    h.controller.requestClose();
    expect(h.abort).toHaveBeenCalledTimes(1);

    // Same session id, fresh board.
    h.controller.openBoard();
    h.controller.requestClose();
    expect(h.panel.style.display, 'the reopened board withdraws and waits').toBe('block');
    expect(h.release, 'no optimistic close on a re-engaged board').not.toHaveBeenCalled();
  });

  it('routes the keyboard Escape through the same funnel, latch included', () => {
    // The fix's central claim is that the key handler and the managed-window case share one
    // method. Nothing pinned it: reverting bindKeys to its old inline
    // `if (live) this.submitAbort(); else this.close();` left all cases green, because a
    // FIRST dismissal is identical either way. The latch is what separates them, so press
    // Escape twice and require the second press to behave like requestClose's repeat arm.
    const h = harness(LIVE);
    h.controller.openBoard();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(h.abort).toHaveBeenCalledTimes(1);
    expect(h.panel.style.display, 'the first Escape withdraws and waits').toBe('block');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(h.abort, 'the second hedges the re-send').toHaveBeenCalledTimes(2);
    expect(h.panel.style.display, 'and closes').toBe('none');
    expect(h.release).toHaveBeenCalledWith(true);
  });

  it('dismisses the ante selector outright, releasing the trap and returning focus', () => {
    // No live session to withdraw from, so this is the arm that must reach close():
    // the trap release (and with it the WCAG 2.4.3 focus return) has no other route.
    const h = harness(null);
    h.controller.openAnte(9);
    expect(h.panel.style.display).toBe('block');

    h.controller.requestClose();

    expect(h.abort, 'nothing live to abort').not.toHaveBeenCalled();
    // release(true), the FocusManager's restoreFocus flag: focus goes back to the opener
    // (WCAG 2.4.3). A release(false) regression, or the default arm's bare hide, fails here.
    expect(h.release).toHaveBeenCalledTimes(1);
    expect(h.release).toHaveBeenCalledWith(true);
    expect(h.panel.style.display).toBe('none');
  });

  it('drops the capture-phase key handler, so a later Escape cannot re-fire on a closed panel', () => {
    // NAMED for the listener, and it has to be probed AS the listener. The obvious version
    // (close, dispatch Escape, assert nothing happened) is worthless: close() sets
    // display:none BEFORE it unbinds, and the handler's own first line bails on
    // `display !== 'block'`, so a stale listener is silent anyway and the case stays green
    // with the whole removeEventListener block deleted.
    const remove = vi.spyOn(window, 'removeEventListener');
    const h = harness(null);
    h.controller.openAnte(9);
    h.controller.requestClose();
    // The registration is on the CAPTURE phase, which is what lets the controller beat
    // src/game/input.ts's bubble listener; unbinding without that flag is a silent no-op.
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function), true);

    // And the behavioral half: with the panel shown again, a surviving listener WOULD act,
    // so this distinguishes "unbound" from "merely short-circuited by the display guard".
    h.panel.style.display = 'block';
    h.release.mockClear();
    h.abort.mockClear();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(h.release, 'no handler is left on the window').not.toHaveBeenCalled();
    expect(h.abort).not.toHaveBeenCalled();

    // The FIELD was cleared alongside the unbind, which neither assertion above can see.
    // bindKeys() early-returns on a non-null keyHandler, so dropping just the
    // `this.keyHandler = null` line leaves the next open with no Escape and no pick hotkeys
    // at all, while the removeEventListener spy stays perfectly green.
    const add = vi.spyOn(window, 'addEventListener');
    h.controller.openAnte(9);
    expect(
      add.mock.calls.filter(([type]) => type === 'keydown'),
      'the reopened panel rebinds its keyboard',
    ).toHaveLength(1);
  });
});
