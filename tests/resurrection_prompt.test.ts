// @vitest-environment happy-dom

// The resurrection offer prompt (src/ui/hud/revive/resurrection_prompt.ts), extracted
// from the Hud's handleEvents 'resurrectionOffer' arm and its
// closeResurrectionPrompt. Driven over a plain host shaped like the Hud members
// it reads (ResurrectionPromptHost). The prompt markup itself is showStackPrompt
// (tests/prompt_dialog.test.ts); the Hud routing of the offer and the respawn
// line through the real handleEvents run in tests/hud_coordinator_delegators.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/ui/i18n';
import { PROMPT_TIMEOUT_MS } from '../src/ui/prompt_dialog';
import { ResurrectionPrompt } from '../src/ui/hud/revive/resurrection_prompt';

function rig(dead = true) {
  const respondToResurrection = vi.fn();
  const sim = { player: { dead }, respondToResurrection };
  return { sim, respondToResurrection, prompt: new ResurrectionPrompt({ sim }) };
}

const stackCount = (): number => document.querySelector('#prompt-stack')?.childElementCount ?? -1;

/** The live prompt's accept (0) or decline (1) button. */
function button(prompt: ResurrectionPrompt, index: 0 | 1): HTMLButtonElement {
  const el = prompt.element;
  if (!el) throw new Error('no live resurrection prompt');
  return el.querySelectorAll('button')[index];
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="prompt-stack"></div>';
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('HUD resurrection confirmation prompt', () => {
  it('removes the previous resurrection prompt before replacing it', () => {
    // Moved whole from tests/hud_resurrection_prompt.test.ts (it seeded the
    // Hud's resurrectionPromptEl field; the singleton lives here now).
    const { prompt } = rig();
    const previous = document.createElement('div');
    document.querySelector('#prompt-stack')?.appendChild(previous);
    (prompt as unknown as { el: HTMLElement | null }).el = previous;

    prompt.close();

    expect(previous.isConnected).toBe(false);
    expect(prompt.element).toBe(null);
  });
});

describe('ResurrectionPrompt.offer', () => {
  it('paints nothing for a player who is alive, and answers nothing', () => {
    const { prompt, respondToResurrection } = rig(false);
    prompt.offer('Lumina');
    expect(stackCount()).toBe(0);
    expect(prompt.element).toBe(null);
    expect(respondToResurrection).not.toHaveBeenCalled();
  });

  it('shows one focused, escaped Accept / Decline prompt for a dead player', () => {
    const { prompt } = rig();
    prompt.offer('<i>Lumina</i>');
    expect(stackCount()).toBe(1);
    const el = prompt.element as HTMLElement;
    expect(el.parentElement?.id).toBe('prompt-stack');
    expect(el.querySelector('.prompt-text b')?.textContent).toBe('<i>Lumina</i>');
    const [accept, decline] = [...el.querySelectorAll('button')];
    expect(accept.textContent).toBe(t('hud.prompts.acceptResurrection'));
    expect(decline.textContent).toBe(t('hud.prompts.decline'));
    expect(document.activeElement).toBe(accept);
  });

  it('keeps ONE prompt: a newer offer replaces the older one', () => {
    const { prompt } = rig();
    prompt.offer('Lumina');
    const older = prompt.element as HTMLElement;
    prompt.offer('Aldric');
    expect(older.isConnected).toBe(false);
    expect(stackCount()).toBe(1);
    expect(prompt.element?.textContent).toContain('Aldric');
  });

  it('answers the sim once per path and drops the singleton on every one', () => {
    const accept = rig();
    accept.prompt.offer('Lumina');
    button(accept.prompt, 0).click();
    expect(accept.respondToResurrection.mock.calls).toEqual([[true]]);
    expect(accept.prompt.element).toBe(null);

    document.body.innerHTML = '<div id="prompt-stack"></div>';
    const decline = rig();
    decline.prompt.offer('Lumina');
    button(decline.prompt, 1).click();
    expect(decline.respondToResurrection.mock.calls).toEqual([[false]]);
    expect(decline.prompt.element).toBe(null);

    document.body.innerHTML = '<div id="prompt-stack"></div>';
    const ignored = rig();
    ignored.prompt.offer('Lumina');
    vi.advanceTimersByTime(PROMPT_TIMEOUT_MS);
    expect(ignored.respondToResurrection.mock.calls).toEqual([[false]]);
    expect(ignored.prompt.element).toBe(null);
    expect(stackCount()).toBe(0);
  });

  it('a prompt closed early never answers on its timeout', () => {
    const { prompt, respondToResurrection } = rig();
    prompt.offer('Lumina');
    prompt.close();
    vi.advanceTimersByTime(PROMPT_TIMEOUT_MS);
    expect(respondToResurrection).not.toHaveBeenCalled();
  });
});
