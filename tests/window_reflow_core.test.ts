import { describe, expect, it } from 'vitest';
import {
  anchoredRequestedPos,
  cascadeExempt,
  cascadeOffset,
  placeWindow,
} from '../src/ui/window_reflow_core';

describe('placeWindow', () => {
  const size = { w: 300, h: 200 };
  const viewport = { w: 1600, h: 900 };

  it('leaves a window that already fits untouched', () => {
    const placement = placeWindow(400, 300, size, viewport, 1);
    expect(placement.css).toEqual({ left: 400, top: 300 });
    expect(placement.visual).toEqual({ left: 400, top: 300 });
  });

  it('clamps a window dragged past every edge, on both axes', () => {
    const bottomRight = placeWindow(5000, 5000, size, viewport, 1);
    expect(bottomRight.css).toEqual({ left: 1600 - 300 - 8, top: 900 - 200 - 8 });
    const topLeft = placeWindow(-500, -500, size, viewport, 1);
    expect(topLeft.css).toEqual({ left: 8, top: 8 });
  });

  it('divides the css write by the UI scale, keeping the visual spot scale-independent', () => {
    const placement = placeWindow(400, 300, size, viewport, 2);
    expect(placement.visual).toEqual({ left: 400, top: 300 });
    expect(placement.css).toEqual({ left: 200, top: 150 });
  });

  it('falls back to scale 1 rather than blanking the window on a bad scale read', () => {
    for (const bad of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(placeWindow(400, 300, size, viewport, bad).css).toEqual({ left: 400, top: 300 });
    }
  });
});

describe('anchoredRequestedPos', () => {
  const size = { w: 300, h: 200 };

  it('adjusts only when a saved viewport is present and differs', () => {
    // No saved viewport (a window never explicitly positioned): unchanged.
    expect(anchoredRequestedPos({ left: 900, top: 100 }, size, { w: 1200, h: 700 })).toEqual({
      left: 900,
      top: 100,
    });
    // Same viewport: untouched.
    expect(
      anchoredRequestedPos({ left: 900, top: 100, vw: 1920, vh: 1080 }, size, {
        w: 1920,
        h: 1080,
      }),
    ).toEqual({ left: 900, top: 100 });
  });

  // The regression the bug report described: a window dragged into a corner
  // at 4K must return to the exact same spot after leaving then re-entering
  // fullscreen, not wherever the shrink-time clamp left it.
  it('re-anchors a corner-parked spot across a viewport change, and growing back restores it', () => {
    const shrunk = anchoredRequestedPos({ left: 3500, top: 1900, vw: 3840, vh: 2160 }, size, {
      w: 1920,
      h: 1080,
    });
    expect(shrunk).toEqual({ left: 1580, top: 820 });
    expect(
      anchoredRequestedPos({ ...shrunk, vw: 1920, vh: 1080 }, size, { w: 3840, h: 2160 }),
    ).toEqual({ left: 3500, top: 1900 });
  });
});

// The desktop open cascade's two decisions (extracted from Hud.placeNewWindow;
// the DOM half is window_reflow.ts placeNewWindow, driven end to end in
// tests/hud_window_moved_flag.test.ts).
describe('cascadeExempt', () => {
  const body = (...classes: string[]) => ({ contains: (cls: string) => classes.includes(cls) });

  it('cascades an ordinary desktop window that nothing has placed yet', () => {
    expect(cascadeExempt('char-window', false, body())).toBe(false);
    expect(cascadeExempt('bags', false, body())).toBe(false);
  });

  it('exempts every mobile window, a moved window, and the loot and confirm popups', () => {
    expect(cascadeExempt('char-window', false, body('mobile-touch'))).toBe(true);
    expect(cascadeExempt('char-window', true, body())).toBe(true);
    expect(cascadeExempt('loot-window', false, body())).toBe(true);
    expect(cascadeExempt('confirm-dialog', false, body())).toBe(true);
  });

  it('exempts only the docked cluster of each docked layout', () => {
    for (const [cls, ids] of [
      ['vendor-open', ['vendor-window', 'bags']],
      ['bank-open', ['bank-window', 'bags']],
      ['market-open', ['market-window', 'bags']],
      ['weekly-vault-open', ['bank-window']],
    ] as const) {
      for (const id of ids) expect(cascadeExempt(id, false, body(cls)), `${cls} ${id}`).toBe(true);
      expect(cascadeExempt('char-window', false, body(cls)), `${cls} char-window`).toBe(false);
    }
    // Without its layout class, a docked window cascades like any other.
    expect(cascadeExempt('vendor-window', false, body())).toBe(false);
    expect(cascadeExempt('market-window', false, body())).toBe(false);
  });
});

describe('cascadeOffset', () => {
  it('steps 28px per other open window and wraps after eight', () => {
    expect(cascadeOffset(0)).toBeNull();
    expect(cascadeOffset(-1)).toBeNull();
    expect(cascadeOffset(1)).toBe(28);
    expect(cascadeOffset(2)).toBe(56);
    expect(cascadeOffset(8)).toBe(224);
    expect(cascadeOffset(9)).toBe(28);
  });
});
