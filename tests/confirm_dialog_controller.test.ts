// @vitest-environment happy-dom

// The shared #confirm-dialog modal (src/ui/confirm_dialog_controller.ts),
// extracted from Hud.confirmDialog. Driven over a plain host shaped like the
// Hud's slot (ConfirmDialogHost), so this suite needs no coordinator import.
// The R40 no-choice callback contract: every dismissal that is not the OK
// button fires it exactly once. The cancel click and the replacement arms live
// here; the two routes that need the Hud (the Esc route through
// Hud.closeManagedWindow, and the input modal taking the slot through
// Hud.inputDialog) run over the real delegators in
// tests/hud_coordinator_delegators.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type ConfirmDialogHost,
  fireConfirmCancel,
  showConfirmDialog,
} from '../src/ui/confirm_dialog_controller';

/** The slot a bare Hud carries, with the trap and window plumbing stubbed. */
function host(): ConfirmDialogHost & { trapReleases: boolean[] } {
  const trapReleases: boolean[] = [];
  return {
    trapReleases,
    focusManager: {
      open: () => ({
        release: (restore = true) => {
          trapReleases.push(restore);
        },
      }),
    } as unknown as ConfirmDialogHost['focusManager'],
    bringWindowToFront: () => {},
    confirmTrap: null,
    confirmOnCancel: null,
  };
}

const dialog = (): HTMLElement => {
  const el = document.getElementById('confirm-dialog');
  if (!el) throw new Error('dialog not painted');
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('confirmDialog no-choice callback (the R40 family contract)', () => {
  it('fires once on a cancel click and never on OK', () => {
    // Moved whole from tests/hud_confirm_gates.test.ts (it drove the real
    // Hud.confirmDialog on a bare prototype; the body now lives here).
    document.body.innerHTML = '';
    const hud = host();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    showConfirmDialog(hud, 'T', 'B', 'OK', 'Cancel', onOk, onCancel);
    const el = document.getElementById('confirm-dialog');
    if (!el) throw new Error('dialog not painted');
    (el.querySelector('.cd-actions [data-cancel]') as HTMLElement).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOk).not.toHaveBeenCalled();
    expect(document.getElementById('confirm-dialog')).toBeNull();

    const onOk2 = vi.fn();
    const onCancel2 = vi.fn();
    showConfirmDialog(hud, 'T', 'B', 'OK', 'Cancel', onOk2, onCancel2);
    (document.querySelector('#confirm-dialog [data-ok]') as HTMLElement).click();
    expect(onOk2).toHaveBeenCalledTimes(1);
    expect(onCancel2).not.toHaveBeenCalled();
  });

  it('fires once when a newer confirm replaces it, and the newer one carries only its own', () => {
    const hud = host();
    const replaced = vi.fn();
    showConfirmDialog(hud, 'T1', 'B', 'OK', 'Cancel', vi.fn(), replaced);
    showConfirmDialog(hud, 'T2', 'B', 'OK', 'Cancel', vi.fn());
    expect(replaced).toHaveBeenCalledTimes(1);
    // One dialog in the slot, the newer one, and the older trap was released
    // WITHOUT a focus restore (the newer dialog takes focus instead).
    expect(document.querySelectorAll('#confirm-dialog')).toHaveLength(1);
    expect(document.getElementById('confirm-dialog-title')?.textContent).toBe('T2');
    expect(hud.trapReleases).toEqual([false]);
    expect(hud.confirmOnCancel).toBeNull();
    // Dismissing the newer one fires nothing more.
    (dialog().querySelector('.panel-title [data-cancel]') as HTMLElement).click();
    expect(replaced).toHaveBeenCalledTimes(1);
  });

  it('clears the pending callback BEFORE onOk runs, so a flow reopening from OK keeps its own', () => {
    const hud = host();
    const first = vi.fn();
    const second = vi.fn();
    showConfirmDialog(
      hud,
      'T',
      'B',
      'OK',
      'Cancel',
      () => {
        // The Keeper's two-step shape: OK opens the next confirm in the slot.
        showConfirmDialog(hud, 'T2', 'B', 'OK', 'Cancel', vi.fn(), second);
      },
      first,
    );
    (dialog().querySelector('[data-ok]') as HTMLElement).click();
    expect(first).not.toHaveBeenCalled();
    expect(hud.confirmOnCancel).toBe(second);
  });
});

describe('fireConfirmCancel: fire-and-clear over the shared slot', () => {
  it('runs the pending callback once and clears it; a second call is a no-op', () => {
    const cancel = vi.fn();
    const slot = { confirmTrap: null, confirmOnCancel: cancel };
    fireConfirmCancel(slot);
    fireConfirmCancel(slot);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(slot.confirmOnCancel).toBeNull();
  });
});

describe('the dialog chrome', () => {
  it('is a named, described modal whose OK takes focus, cancel before OK, above the window band', () => {
    const hud = host();
    const raised: HTMLElement[] = [];
    hud.bringWindowToFront = (el) => {
      raised.push(el);
      el.style.zIndex = '60';
    };
    showConfirmDialog(hud, '<b>Destroy?</b>', 'Gone for good.', 'Destroy', 'Keep', vi.fn());
    const el = dialog();
    expect(el.className).toBe('window panel');
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('aria-labelledby')).toBe('confirm-dialog-title');
    expect(el.getAttribute('aria-describedby')).toBe('confirm-dialog-body');
    // Escaped, never parsed as markup.
    expect(document.getElementById('confirm-dialog-title')?.textContent).toBe('<b>Destroy?</b>');
    expect(document.getElementById('confirm-dialog-body')?.textContent).toBe('Gone for good.');
    const actions = [...el.querySelectorAll<HTMLButtonElement>('.cd-actions button')];
    expect(actions.map((b) => b.textContent)).toEqual(['Keep', 'Destroy']);
    expect(el.querySelector('.panel-title .x-btn')?.getAttribute('aria-label')).toBe('Keep');
    expect(document.activeElement).toBe(el.querySelector('[data-ok]'));
    // Raised through the host, then floored above the band and the inspect overlay.
    expect(raised).toEqual([el]);
    expect(el.style.zIndex).toBe('95');
    expect(hud.confirmTrap).not.toBeNull();
  });
});
