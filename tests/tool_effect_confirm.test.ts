// The R40 per-use effect confirm (src/ui/hud/professions/tool_effect_confirm.ts), moved whole
// from tests/hud_confirm_gates.test.ts when askToolEffectConfirm left
// Hud.confirmToolEffectUse. It rides the same confirm-dialog family as the
// Keeper and Marks gates, but unlike them its cancel PATHS all answer
// (declining still gathers), so `proceed` must fire exactly once with the
// player's answer on OK, cancel, and every no-choice dismissal.

import { describe, expect, it, vi } from 'vitest';
import type { ConfirmDialogArgs } from '../src/ui/hud/dialog/confirm_dialog_controller';
import { askToolEffectConfirm } from '../src/ui/hud/professions/tool_effect_confirm';

interface EffectConfirmCall {
  title: string;
  body: string;
  ok: string;
  cancel: string;
  onOk: () => void;
  onCancel?: () => void;
}

/** A plain host shaped like the Hud member the ask drives (ToolEffectConfirmHost). */
function effectHarness() {
  const confirmations: EffectConfirmCall[] = [];
  const hud = {
    confirmDialog: (...[title, body, ok, cancel, onOk, onCancel]: ConfirmDialogArgs) => {
      confirmations.push({ title, body, ok, cancel, onOk, onCancel });
    },
  };
  return {
    confirmations,
    ask: (prompt: { effectId: string; charges: number }, proceed: (confirmed: boolean) => void) =>
      askToolEffectConfirm(hud, prompt, proceed),
  };
}

describe('the R40 per-use effect confirm (askToolEffectConfirm)', () => {
  it('OK answers confirmed exactly once; nothing fires from the bare open', () => {
    const { ask, confirmations } = effectHarness();
    const proceed = vi.fn();
    ask({ effectId: 'artisans_eye', charges: 7 }, proceed);
    expect(proceed).not.toHaveBeenCalled();
    expect(confirmations).toHaveLength(1);
    const call = confirmations[0];
    // The body names the remaining charges: the marginal-spend fact.
    expect(call.body).toContain('7');
    call.onOk();
    expect(proceed).toHaveBeenCalledTimes(1);
    expect(proceed).toHaveBeenCalledWith(true);
    // The answered latch: a late second callback cannot double-send.
    call.onCancel?.();
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('a dismissal answers unconfirmed exactly once (declining still gathers)', () => {
    const { ask, confirmations } = effectHarness();
    const proceed = vi.fn();
    ask({ effectId: 'gatherers_cache', charges: 1 }, proceed);
    const call = confirmations[0];
    expect(call.onCancel).toBeDefined();
    call.onCancel?.();
    expect(proceed).toHaveBeenCalledTimes(1);
    expect(proceed).toHaveBeenCalledWith(false);
    call.onOk();
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('an unknown effect id degrades to an unconfirmed answer with NO dialog', () => {
    const { ask, confirmations } = effectHarness();
    const proceed = vi.fn();
    ask({ effectId: 'constructor', charges: 3 }, proceed);
    expect(confirmations).toHaveLength(0);
    expect(proceed).toHaveBeenCalledTimes(1);
    expect(proceed).toHaveBeenCalledWith(false);
  });
});
