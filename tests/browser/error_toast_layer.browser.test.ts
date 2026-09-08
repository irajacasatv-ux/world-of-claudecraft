import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup } from './_harness';

beforeEach(async () => {
  await page.viewport(844, 390);
  document.body.className = 'mobile-touch game-active mobile-window-open';
});

afterEach(() => {
  cleanup();
  document.body.className = '';
});

function mountedToast(): { toast: HTMLElement; bags: HTMLElement } {
  const ui = document.createElement('div');
  ui.id = 'ui';
  ui.style.setProperty('--app-vw', '844px');
  ui.style.setProperty('--app-vh', '390px');
  ui.style.setProperty('--ui-scale', '1');
  const bags = document.createElement('div');
  bags.id = 'bags';
  bags.className = 'window panel';
  bags.style.display = 'flex';
  bags.style.zIndex = '51';
  const toast = document.createElement('div');
  toast.id = 'error-msg';
  toast.textContent = 'Freeholds are not available on this realm.';
  toast.style.opacity = '1';
  ui.append(toast, bags);
  document.body.append(ui);
  return { toast, bags };
}

describe('mobile refusal toast above the Bags sheet', () => {
  it('paints above the overlapping sheet and remains pointer-inert', () => {
    const { toast, bags } = mountedToast();
    const bounds = toast.getBoundingClientRect();
    const sheet = bags.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(x).toBeGreaterThan(sheet.left);
    expect(x).toBeLessThan(sheet.right);
    expect(y).toBeGreaterThan(sheet.top);
    expect(y).toBeLessThan(sheet.bottom);
    expect(getComputedStyle(bags).zIndex).toBe('95');
    expect(getComputedStyle(toast).pointerEvents).toBe('none');

    // Pointer events do not change paint order. Temporarily enabling them
    // makes the browser hit-test the top painted surface at the overlap.
    toast.style.pointerEvents = 'auto';
    try {
      expect(document.elementFromPoint(x, y)).toBe(toast);
    } finally {
      toast.style.removeProperty('pointer-events');
    }
    expect(getComputedStyle(toast).pointerEvents).toBe('none');
    expect(document.elementFromPoint(x, y)).toBe(bags);
  });

  it('preserves the existing desktop toast and managed-window layers', () => {
    document.body.className = 'game-active';
    const { toast, bags } = mountedToast();
    // The desktop base: release/v0.42.0 seats #error-msg at 90 in hud.css
    // (above the ordinary .window focus band, 50 to 89, so a mail or vendor
    // deny toast never mis-layers with a window); this branch's touch rule
    // only steps that base one above the mobile sheet's forced 95, and never
    // touches the desktop value.
    expect(getComputedStyle(toast).zIndex).toBe('90');
    expect(getComputedStyle(toast).pointerEvents).toBe('none');
    expect(getComputedStyle(bags).zIndex).toBe('51');
  });
});
