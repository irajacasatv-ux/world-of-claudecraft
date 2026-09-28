// @vitest-environment happy-dom
// Direct behavioral pins for the shared modal prompt recipe
// (src/ui/prompt_dialog.ts), the rule-of-three extraction behind the bags,
// bank, and vendor quantity/confirm prompts. The three windows pin their
// DELEGATION to the module (source pins plus the vendor painter's behavioral
// drive); this suite pins the recipe itself, so a semantic break that keeps
// the source tokens still fails somewhere. It also holds the timed
// #prompt-stack accept/decline prompt (showStackPrompt, moved off the Hud).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dismissInstalledPrompt,
  installPromptDialog,
  PROMPT_TIMEOUT_MS,
  showStackPrompt,
} from '../src/ui/prompt_dialog';

function rig(withInputAriaLabel = false) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const opener = document.createElement('button');
  root.appendChild(opener);
  const prompt = document.createElement('div');
  prompt.className = 'prompt';
  prompt.innerHTML = '<div class="prompt-text">How many?</div>';
  const input = document.createElement('input');
  input.className = 'prompt-number';
  input.type = 'number';
  if (withInputAriaLabel) input.setAttribute('aria-label', 'Amount');
  const confirm = document.createElement('button');
  confirm.textContent = 'Ok';
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  prompt.append(input, confirm, cancel);
  document.body.appendChild(prompt);
  let closed = 0;
  const close = () => {
    closed += 1;
    prompt.remove();
  };
  const handle = installPromptDialog(prompt, opener, close, {
    inertRoot: root,
    idPrefix: 'test-prompt-title',
  });
  return {
    root,
    opener,
    prompt,
    input,
    confirm,
    cancel,
    handle,
    closedCount: () => closed,
    cleanup: () => {
      prompt.remove();
      root.remove();
    },
  };
}

describe('installPromptDialog: the shared modal recipe', () => {
  it('wires role, aria-modal, aria-labelledby, and names an unlabeled quantity input', () => {
    const r = rig();
    try {
      expect(r.prompt.getAttribute('role')).toBe('dialog');
      expect(r.prompt.getAttribute('aria-modal')).toBe('true');
      expect(r.prompt.classList.contains('ui-panel-strong')).toBe(true);
      expect(r.input.classList.contains('ui-input')).toBe(true);
      expect(r.confirm.classList.contains('ui-btn')).toBe(true);
      expect(r.confirm.classList.contains('ui-btn--red')).toBe(true);
      expect(r.cancel.classList.contains('ui-btn')).toBe(true);
      const title = r.prompt.querySelector('.prompt-text') as HTMLElement;
      expect(title.id).toMatch(/^test-prompt-title-\d+$/);
      expect(r.prompt.getAttribute('aria-labelledby')).toBe(title.id);
      // The anonymous number input is named by the prompt's own question.
      expect(r.input.getAttribute('aria-labelledby')).toBe(title.id);
    } finally {
      r.cleanup();
    }
  });

  it('leaves an input that carries its own aria-label alone (the better name wins)', () => {
    const r = rig(true);
    try {
      expect(r.input.getAttribute('aria-label')).toBe('Amount');
      expect(r.input.getAttribute('aria-labelledby')).toBeNull();
    } finally {
      r.cleanup();
    }
  });

  it('marks the window root inert on install; dismiss clears inert and runs the close exactly once', () => {
    const r = rig();
    try {
      expect(r.root.inert).toBe(true);
      r.handle.dismiss();
      expect(r.root.inert).toBe(false);
      expect(r.closedCount()).toBe(1);
      expect(r.prompt.isConnected).toBe(false);
    } finally {
      r.cleanup();
    }
  });

  it('dismissAndReturn clears inert BEFORE refocusing the opener (a focus into an inert subtree is dropped)', () => {
    const r = rig();
    try {
      r.input.focus();
      r.handle.dismissAndReturn();
      expect(r.root.inert).toBe(false);
      expect(document.activeElement).toBe(r.opener);
    } finally {
      r.cleanup();
    }
  });

  it('Escape tears down, returns focus, and stops both the default and the bubble', () => {
    const r = rig();
    try {
      const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      let reachedWindow = false;
      const windowSpy = () => {
        reachedWindow = true;
      };
      window.addEventListener('keydown', windowSpy);
      r.input.dispatchEvent(e);
      window.removeEventListener('keydown', windowSpy);
      expect(e.defaultPrevented).toBe(true);
      // The bubble must stop at the prompt: the input layer's window-level
      // keydown runs the global escape action (closeAll) regardless of
      // defaultPrevented, so one keypress would also shut the whole window.
      expect(reachedWindow).toBe(false);
      expect(r.closedCount()).toBe(1);
      expect(r.root.inert).toBe(false);
      expect(document.activeElement).toBe(r.opener);
    } finally {
      r.cleanup();
    }
  });

  it('Enter keeps its default while the prompt is attached and cancels it once detached', () => {
    const r = rig();
    try {
      const attached = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      let reachedWindow = false;
      const windowSpy = () => {
        reachedWindow = true;
      };
      window.addEventListener('keydown', windowSpy);
      r.confirm.dispatchEvent(attached);
      window.removeEventListener('keydown', windowSpy);
      // Native activation must survive (Enter on the confirm button)...
      expect(attached.defaultPrevented).toBe(false);
      // ...but the bubble must still stop: without it the same press reaches
      // the global chat/jump bind and steals the WCAG 2.4.3 focus return.
      expect(reachedWindow).toBe(false);
      // A submit handler at the target phase can remove the prompt DURING the
      // dispatch; the listener still runs (the event path is fixed at
      // dispatch) and must THEN cancel the default, or the browser runs the
      // activation against the freshly re-landed focus.
      r.prompt.remove();
      const detached = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      r.prompt.dispatchEvent(detached);
      expect(detached.defaultPrevented).toBe(true);
    } finally {
      r.cleanup();
    }
  });

  it('Space stops its bubble too (prompt buttons are not tag-exempt at the input layer)', () => {
    const r = rig();
    try {
      const space = new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true,
      });
      let reachedWindow = false;
      const windowSpy = () => {
        reachedWindow = true;
      };
      window.addEventListener('keydown', windowSpy);
      r.cancel.dispatchEvent(space);
      window.removeEventListener('keydown', windowSpy);
      expect(space.defaultPrevented).toBe(false);
      expect(reachedWindow).toBe(false);
    } finally {
      r.cleanup();
    }
  });

  it('Tab cycles inside the prompt: shift-Tab on the first control wraps to the last, Tab on the last wraps to the first', () => {
    const r = rig();
    try {
      r.input.focus();
      const back = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      r.input.dispatchEvent(back);
      expect(back.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(r.cancel);
      const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      r.cancel.dispatchEvent(forward);
      expect(forward.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(r.input);
    } finally {
      r.cleanup();
    }
  });
});

describe('dismissInstalledPrompt: the element-keyed teardown registry', () => {
  it('routes a registered prompt through its own dismiss (inert cleared, close run)', () => {
    const r = rig();
    try {
      expect(r.root.inert).toBe(true);
      dismissInstalledPrompt(r.prompt);
      expect(r.root.inert).toBe(false);
      expect(r.closedCount()).toBe(1);
      expect(r.prompt.isConnected).toBe(false);
    } finally {
      r.cleanup();
    }
  });

  it('plainly removes an element this recipe never installed', () => {
    const stray = document.createElement('div');
    stray.className = 'prompt';
    document.body.appendChild(stray);
    dismissInstalledPrompt(stray);
    expect(stray.isConnected).toBe(false);
  });
});

describe('showStackPrompt: the timed #prompt-stack accept / decline prompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="prompt-stack"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('is an accessible yes/no dialog, focuses Yes, and accepts only after the click', () => {
    // Moved whole from tests/hud_resurrection_prompt.test.ts (it drove the
    // real Hud.showPrompt on a bare prototype; the body now lives here).
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    const prompt = showStackPrompt(
      'A mage wants to resurrect you.',
      'Yes',
      onAccept,
      onDecline,
      'No',
      vi.fn(),
      true,
    );

    expect(prompt.getAttribute('role')).toBe('alertdialog');
    expect(prompt.getAttribute('aria-modal')).toBe('false');
    const titleId = prompt.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId ?? '')?.textContent).toBe(
      'A mage wants to resurrect you.',
    );
    const [accept, decline] = [...prompt.querySelectorAll('button')];
    expect(accept.textContent).toBe('Yes');
    expect(decline.textContent).toBe('No');
    expect(document.activeElement).toBe(accept);
    expect(onAccept).not.toHaveBeenCalled();

    accept.click();
    expect(onAccept).toHaveBeenCalledOnce();
    expect(onDecline).not.toHaveBeenCalled();
    expect(prompt.isConnected).toBe(false);
  });

  it('declines on the decline click, and titles every prompt with its own id', () => {
    const onDecline = vi.fn();
    const first = showStackPrompt('One', 'Yes', vi.fn(), onDecline, 'No');
    const second = showStackPrompt('Two', 'Yes', vi.fn(), vi.fn(), 'No');
    expect(first.getAttribute('aria-labelledby')).not.toBe(second.getAttribute('aria-labelledby'));
    // Not focused unless asked: an unfocused prompt leaves the player where they were.
    expect(document.activeElement).not.toBe(first.querySelector('button'));
    (first.querySelectorAll('button')[1] as HTMLElement).click();
    expect(onDecline).toHaveBeenCalledOnce();
    expect(first.isConnected).toBe(false);
    expect(second.isConnected).toBe(true);
  });

  it('times out into onDecline by default, into onTimeout when given, and never after an answer', () => {
    const declined = vi.fn();
    showStackPrompt('Default', 'Yes', vi.fn(), declined, 'No');
    const timedOut = vi.fn();
    const ownDecline = vi.fn();
    showStackPrompt('Ready?', 'Ready', vi.fn(), ownDecline, 'Not Ready', timedOut);
    const answered = vi.fn();
    const early = showStackPrompt('Answered', 'Yes', vi.fn(), answered, 'No');
    (early.querySelectorAll('button')[0] as HTMLElement).click();

    vi.advanceTimersByTime(PROMPT_TIMEOUT_MS - 1);
    expect(declined).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(declined).toHaveBeenCalledOnce();
    expect(timedOut).toHaveBeenCalledOnce();
    expect(ownDecline).not.toHaveBeenCalled();
    expect(answered).not.toHaveBeenCalled();
    expect(document.querySelector('#prompt-stack')?.childElementCount).toBe(0);
  });
});
