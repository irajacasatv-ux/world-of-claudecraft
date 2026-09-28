// The shared #confirm-dialog modal, extracted whole from Hud.confirmDialog as a
// MOVE, not a rewrite: the markup, the aria naming and description, the
// z-index floor, the focus trap, the key activation binder, the button order
// and every listener are the same. Hud keeps confirmDialog as a one-line
// delegator (every call site and every injected `confirmDialog` dep still
// reaches the dialog through it) and passes itself as the host, so the members
// below are public on Hud and tsc checks the Hud against this interface.
//
// The slot is shared with the input modal (src/ui/input_controller.ts): one
// #confirm-dialog id, one trap field, one pending no-choice callback. The
// fire-and-clear of that callback (the R40 family contract) lives here too,
// because every route that dismisses the slot without a choice (a cancel
// click, the Esc route through Hud.closeManagedWindow, replacement by a newer
// confirm or by the input modal) answers it through fireConfirmCancel.
//
// Registered in UI_DOM_MODULES (tests/architecture.test.ts): it mints the
// #confirm-dialog element. Named *_controller so the painter gate's filename
// sweep holds it to the cold contract (tests/hud_perf_budget.test.ts). The
// managed-close registry (CODE_BUILT) records it as the confirm half of that
// shared id.

import { audio } from '../game/audio';
import { bindDialogKeyActivation } from './dialog_key_activation';
import { esc } from './esc';
import type { FocusManager, FocusTrapHandle } from './focus_manager';
import { svgIcon } from './ui_icons';

/** The confirm dialog's arguments, in order: the one shape every
 *  confirm-gated flow calls. `onCancel` is the no-choice callback. */
export type ConfirmDialogArgs = [
  title: string,
  body: string,
  okText: string,
  cancelText: string,
  onOk: () => void,
  onCancel?: () => void,
];

/** The shared #confirm-dialog slot on the Hud. */
export interface ConfirmSlot {
  /** The open modal's focus trap. Shared by the confirm and input modals (one
   *  #confirm-dialog id; they never coexist), and released by
   *  Hud.closeManagedWindow on the Esc route. */
  confirmTrap: FocusTrapHandle | null;
  /** The pending no-choice callback of the OPEN confirm dialog (R40 family):
   *  fired exactly once on ANY dismissal that is not the OK button (cancel
   *  click, Esc through closeManagedWindow, replacement by a newer modal), so
   *  a flow that must always answer (the per-use effect confirm sends the
   *  harvest either way) can never hang on a dismissed dialog. Null for every
   *  dialog that passed no onCancel; cleared BEFORE onOk runs. */
  confirmOnCancel: (() => void) | null;
}

/** The Hud members the confirm dialog drives. */
export interface ConfirmDialogHost extends ConfirmSlot {
  /** The one FocusManager every window shares. */
  readonly focusManager: Pick<FocusManager, 'open'>;
  bringWindowToFront(el: HTMLElement): void;
}

/** Fire-and-clear the open confirm dialog's no-choice callback (see
 *  ConfirmSlot.confirmOnCancel). Safe to call when none is pending. */
export function fireConfirmCancel(slot: ConfirmSlot): void {
  const pending = slot.confirmOnCancel;
  slot.confirmOnCancel = null;
  pending?.();
}

// Minimal modal confirm dialog (reuses the .window/.panel chrome). Built on
// demand and removed on dismiss.
export function showConfirmDialog(
  host: ConfirmDialogHost,
  title: string,
  body: string,
  okText: string,
  cancelText: string,
  onOk: () => void,
  onCancel?: () => void,
): void {
  host.confirmTrap?.release(false);
  host.confirmTrap = null;
  // A replaced dialog was dismissed without a choice: its pending
  // no-choice callback (if any) fires before the new one takes the slot.
  fireConfirmCancel(host);
  document.getElementById('confirm-dialog')?.remove();
  host.confirmOnCancel = onCancel ?? null;
  const el = document.createElement('div');
  el.id = 'confirm-dialog';
  el.className = 'window panel';
  el.style.display = 'block';
  // Kept inline rather than folded onto markDialogRoot: that helper would also set
  // tabindex=-1 on the root, which this focusManager-trapped prompt does not use
  // (byte-preserving on the trap). The dialog is named via aria-labelledby.
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'confirm-dialog-title');
  // The body is the DESCRIPTION, not decoration: on a destroy confirm it
  // carries what dies, whether anything is refunded, and what it costs. With
  // focus landing on OK, a screen reader announces the dialog name and the
  // focused control, so without this association the warning is never read
  // aloud and the accept is one keypress away.
  el.setAttribute('aria-describedby', 'confirm-dialog-body');
  el.innerHTML =
    `<div class="panel-title"><span id="confirm-dialog-title">${esc(title)}</span><button type="button" class="x-btn" data-cancel aria-label="${esc(cancelText)}">${svgIcon('close')}</button></div>` +
    `<div class="cd-body" id="confirm-dialog-body">${esc(body)}</div>` +
    `<div class="cd-actions"><button type="button" class="btn" data-cancel>${esc(cancelText)}</button><button type="button" class="btn cd-ok" data-ok>${esc(okText)}</button></div>`;
  document.body.appendChild(el);
  host.bringWindowToFront(el);
  // A confirm prompt is the topmost modal by definition: the window band tops
  // out at 89 and the armory inspect overlay sits at 90, so floor it above
  // both or a purchase confirmation opens invisibly underneath.
  el.style.zIndex = String(Math.max(Number(el.style.zIndex) || 0, 95));
  host.confirmTrap = host.focusManager.open({ root: () => el });
  bindDialogKeyActivation(el);
  el.querySelector<HTMLElement>('[data-ok]')?.focus();
  const close = () => {
    host.confirmTrap?.release();
    host.confirmTrap = null;
    el.remove();
  };
  el.querySelectorAll('[data-cancel]').forEach((b) => {
    b.addEventListener('click', () => {
      audio.click();
      close();
      fireConfirmCancel(host);
    });
  });
  el.querySelector('[data-ok]')?.addEventListener('click', () => {
    // A made choice: the no-choice callback must NOT fire on the removal.
    host.confirmOnCancel = null;
    close();
    onOk();
  });
}
