// The shared offline-entry overlay pass (scripts/enter_offline_game.mjs): which
// control it clicks on each spawn greeting. The ferry note's guidance variant
// leads with "Turn guidance on", so a first-button click accepted golden
// guidance for every capture that rode the bell; the pass must always decline.

import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { entryOverlayPass, GREETING_DECLINE } from '../scripts/enter_offline_game.mjs';

type Control = 'guidance-on' | 'guidance-off' | 'close' | 'play' | 'skip';
const SELECTOR: Record<Control, string> = {
  'guidance-on': '[data-guidance="on"]',
  'guidance-off': '[data-guidance="off"]',
  close: '[data-close]',
  play: '[data-play]',
  skip: '[data-skip]',
};

function stage(
  popups: Partial<Record<'tutorial-greeting' | 'profession-tutorial', Control[]>>,
  display = 'block',
) {
  const clicks: string[] = [];
  const popup = (id: string, controls: Control[]) => ({
    // The first button in document order: what the old pass clicked.
    querySelector: (selector: string) => {
      if (selector === 'button') return { click: () => clicks.push(`${id}:${controls[0]}`) };
      const found = controls.find((c) => SELECTOR[c] === selector);
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
    expect(entryOverlayPass().greetingUp).toBe(true);
    expect(clicks).toEqual(['tutorial-greeting:guidance-off']);
  });

  it('closes a plain note and skips, never plays, the play/skip variant', () => {
    const plain = stage({ 'tutorial-greeting': ['close'] });
    entryOverlayPass();
    expect(plain).toEqual(['tutorial-greeting:close']);
    const choice = stage({ 'tutorial-greeting': ['play', 'skip'] });
    entryOverlayPass();
    expect(choice).toEqual(['tutorial-greeting:skip']);
  });

  it('closes the professions tutorial through its close control', () => {
    const clicks = stage({ 'profession-tutorial': ['close'] });
    entryOverlayPass();
    expect(clicks).toEqual(['profession-tutorial:close']);
  });

  it('reports a greeting with no declining control as up, and clicks nothing on it', () => {
    const clicks = stage({ 'tutorial-greeting': ['play'] });
    expect(entryOverlayPass().greetingUp).toBe(true);
    expect(clicks).toEqual([]);
  });

  it('reports nothing up and clicks nothing on a quiet screen', () => {
    const clicks = stage({});
    expect(entryOverlayPass()).toEqual({
      introUp: false,
      tutorialUp: false,
      cameraPromptUp: false,
      greetingUp: false,
    });
    expect(clicks).toEqual([]);
  });

  it('ignores a greeting that is present but display:none', () => {
    const clicks = stage({ 'tutorial-greeting': ['guidance-on', 'guidance-off'] }, 'none');
    expect(entryOverlayPass().greetingUp).toBe(false);
    expect(clicks).toEqual([]);
  });
});

describe('GREETING_DECLINE', () => {
  // The same markup the HUD renders (tutorial_greeting_window.ts and
  // profession_tutorial_window.ts): the selector list finds each form's
  // declining control, and never the accept button that leads the guidance form.
  it('finds the declining control of every greeting form', () => {
    const document = new Window().document;
    const forms: [string, string][] = [
      [
        '<button data-guidance="on" class="cd-ok">on</button><button data-guidance="off">off</button>',
        'off',
      ],
      ['<button class="btn cd-ok" data-close>close</button>', 'close'],
      ['<button data-play>play</button><button data-skip>skip</button>', 'skip'],
      ['<button class="x-btn" data-close>x</button><button data-close>ok</button>', 'x'],
    ];
    expect(GREETING_DECLINE).toBe('[data-guidance="off"], [data-close], [data-skip]');
    for (const [markup, expected] of forms) {
      document.body.innerHTML = `<div id="tutorial-greeting">${markup}</div>`;
      const found = document.getElementById('tutorial-greeting')?.querySelector(GREETING_DECLINE);
      expect(found?.textContent, markup).toBe(expected);
    }
  });
});
