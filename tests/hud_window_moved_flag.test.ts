// setWindowPixelPosition (window_reflow.ts, extracted from hud.ts, which keeps
// a thin delegator; window_reflow_core.ts owns the placement math and
// window_reflow.ts the requested-spot persistence, see their own test files)
// must mark EVERY explicit pixel-position write with
// `dataset.windowMoved = '1'`, not only a manual drag/resize commit. Without
// that stamp, installWindowReflow's movedWindows() filter never picks up a
// window placed only by the automatic open cascade (placeNewWindow), which is
// exactly the regression a viewport shrink then regrow reproduces: a
// cascaded window (say a second bag window opened over an already-open one)
// silently stops being reflowed and can end up off-screen or invisible after
// a resize. window_drag.ts / window_resize.ts already stamp the flag
// themselves for a real drag or SE-corner resize; this covers the one path
// that only ever went through setWindowPixelPosition directly.

// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { placeNewWindow, setWindowPixelPosition } from '../src/ui/window_reflow';

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

function windowElement(id: string, left: number, top: number, width: number, height: number) {
  const el = document.createElement('section');
  el.id = id;
  el.classList.add('window', 'panel');
  el.getBoundingClientRect = () =>
    ({
      x: left,
      y: top,
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect;
  return el;
}

describe('window-moved stamping', () => {
  it('marks a directly positioned window as moved so it joins the resize reflow', () => {
    setViewport(1_280, 800);
    const el = { dataset: {}, style: {} } as unknown as HTMLElement;
    const rect = { width: 310, height: 408 } as DOMRect;

    setWindowPixelPosition(el, 1_921, 1_024, rect);

    expect(el.dataset.windowMoved).toBe('1');
    expect(el.style.left).toBe('962px');
    expect(el.style.top).toBe('384px');
  });

  it('marks a window the automatic open cascade placed, not only a manually dragged one', () => {
    setViewport(2_560, 1_440);
    const other = windowElement('char-window', 100, 100, 500, 600);
    const bag = windowElement('bags', 100, 100, 310, 408);
    document.body.append(other, bag);

    // Hud hands its own isWindowVisible; the cascade only counts what it says.
    const isWindowVisible = (win: HTMLElement) => !win.hidden;

    expect(bag.dataset.windowMoved).toBeUndefined();
    placeNewWindow(bag, isWindowVisible);

    expect(bag.dataset.windowMoved).toBe('1');
  });
});
