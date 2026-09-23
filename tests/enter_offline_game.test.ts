// The shared offline-entry overlay pass (scripts/enter_offline_game.mjs): which
// control it clicks on each spawn greeting. The ferry note's guidance variant
// leads with "Turn guidance on", so a first-button click accepted golden
// guidance for every capture that rode the bell; the pass must always decline.
// The real markup is pinned in tests/greeting_decline.test.ts; this suite drives
// the pass's own branches over a fake DOM.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { entryOverlayPass, GREETING_DECLINE } from '../scripts/enter_offline_game.mjs';

type Control = 'guidance-on' | 'guidance-off' | 'close';
const SELECTOR: Record<Control, string> = {
  'guidance-on': '[data-guidance="on"]',
  'guidance-off': '[data-guidance="off"]',
  close: '[data-close]',
};

function stage(
  popups: Partial<Record<'tutorial-greeting' | 'profession-tutorial', Control[]>>,
  display = 'block',
) {
  const clicks: string[] = [];
  const popup = (id: string, controls: Control[]) => ({
    // A selector list matches the first control in document order that any of
    // its parts matches, the real querySelector rule; `button` matches the first
    // control of all, which is what the old pass clicked.
    querySelector: (selector: string) => {
      const parts = selector.split(',').map((part) => part.trim());
      const found = controls.find((c) => parts.includes('button') || parts.includes(SELECTOR[c]));
      return found ? { click: () => clicks.push(`${id}:${found}`) } : null;
    },
  });
  vi.stubGlobal('getComputedStyle', () => ({ display }));
  vi.stubGlobal('document', {
    getElementById: (id: string) => {
      const controls = popups[id as keyof typeof popups];
      return controls ? popup(id, controls) : null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  });
  return clicks;
}
afterEach(() => vi.unstubAllGlobals());

describe('entryOverlayPass', () => {
  it('declines the ferry guidance note even though "on" is its first button', () => {
    const clicks = stage({ 'tutorial-greeting': ['guidance-on', 'guidance-off'] });
    expect(entryOverlayPass(GREETING_DECLINE).greetingUp).toBe(true);
    expect(clicks).toEqual(['tutorial-greeting:guidance-off']);
  });

  it('closes a plain note through its close control', () => {
    const plain = stage({ 'tutorial-greeting': ['close'] });
    entryOverlayPass(GREETING_DECLINE);
    expect(plain).toEqual(['tutorial-greeting:close']);
  });

  it('closes the professions tutorial through its close control', () => {
    const clicks = stage({ 'profession-tutorial': ['close'] });
    entryOverlayPass(GREETING_DECLINE);
    expect(clicks).toEqual(['profession-tutorial:close']);
  });

  it('reports a greeting with no declining control as up, and clicks nothing on it', () => {
    const clicks = stage({ 'tutorial-greeting': ['guidance-on'] });
    expect(entryOverlayPass(GREETING_DECLINE).greetingUp).toBe(true);
    expect(clicks).toEqual([]);
  });

  it('reports nothing up and clicks nothing on a quiet screen', () => {
    const clicks = stage({});
    expect(entryOverlayPass(GREETING_DECLINE)).toEqual({
      introUp: false,
      tutorialUp: false,
      cameraPromptUp: false,
      greetingUp: false,
    });
    expect(clicks).toEqual([]);
  });

  it('ignores a greeting that is present but display:none', () => {
    const clicks = stage({ 'tutorial-greeting': ['guidance-on', 'guidance-off'] }, 'none');
    expect(entryOverlayPass(GREETING_DECLINE).greetingUp).toBe(false);
    expect(clicks).toEqual([]);
  });
});
