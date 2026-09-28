// The Pale Keeper revive gate (src/ui/keeper_revive_dialog.ts), moved whole
// from tests/hud_confirm_gates.test.ts when runKeeperRevive left
// Hud.requestSpiritHealerResurrect. The revive is irreversible and applies The
// Keeper's Toll, so it is exercised with a mock confirmDialog (the
// tests/daily_rewards_store_behavior.test.ts idiom): the pre-existing command
// must fire ONLY from the second dialog's onOk, never from the bare tap, and
// dismissing either dialog sends nothing. The dialog itself is
// tests/confirm_dialog_controller.test.ts.

import { describe, expect, it, vi } from 'vitest';
import type { ConfirmDialogArgs } from '../src/ui/confirm_dialog_controller';
import { type KeeperReviveHost, runKeeperRevive } from '../src/ui/keeper_revive_dialog';

interface ConfirmCall {
  title: string;
  body: string;
  ok: string;
  cancel: string;
  onOk: () => void;
  onCancel?: () => void;
}

/** A plain host shaped like the Hud members the flow reads (KeeperReviveHost). */
function withLevel(level: number) {
  const confirmations: ConfirmCall[] = [];
  const hud: { -readonly [K in keyof KeeperReviveHost]: KeeperReviveHost[K] } = {
    sim: { player: { level } },
    onResurrectAtSpiritHealer: null,
    confirmDialog: (...[title, body, ok, cancel, onOk, onCancel]: ConfirmDialogArgs) => {
      confirmations.push({ title, body, ok, cancel, onOk, onCancel });
    },
  };
  return { hud, confirmations, request: () => runKeeperRevive(hud) };
}

describe('spirit healer revive confirmation', () => {
  // Talking to the Keeper is two steps: its dialogue (Leave / Revive Me), then a
  // confirmation. Only the confirmation's OK sends the command, and both bodies
  // are worded for whether The Keeper's Toll lands at this level.

  it('opens the dialogue, then the confirm, and revives only from the second OK', () => {
    const { hud, confirmations, request } = withLevel(20);
    const revive = vi.fn();
    hud.onResurrectAtSpiritHealer = revive;

    request();

    expect(revive).not.toHaveBeenCalled();
    expect(confirmations).toHaveLength(1);
    const talk = confirmations[0];
    expect(talk.title).toBe('The Pale Keeper');
    expect(talk.body).toContain("Keeper's Toll");
    expect(talk.body).toContain('75%');
    expect(talk.body).toContain('no penalty');
    expect(talk.body).not.toMatch(/spare/i);
    expect(talk.ok).toBe('Revive Me');
    expect(talk.cancel).toBe('Leave');

    talk.onOk();
    expect(revive).not.toHaveBeenCalled();
    expect(confirmations).toHaveLength(2);
    const confirm = confirmations[1];
    expect(confirm.title).toBe("Accept the Keeper's Toll?");
    expect(confirm.body).toContain('weaker');
    expect(confirm.body).toContain('75%');
    expect(confirm.ok).toBe('Revive Me');
    expect(confirm.cancel).toBe('Cancel');

    confirm.onOk();
    expect(revive).toHaveBeenCalledOnce();
  });

  it('tells a newcomer the Toll is waived, at both steps', () => {
    const { hud, confirmations, request } = withLevel(1);
    hud.onResurrectAtSpiritHealer = vi.fn();

    request();
    expect(confirmations[0].body).toMatch(/spare/);
    confirmations[0].onOk();
    expect(confirmations[1].title).toBe('Let the Keeper raise you?');
    expect(confirmations[1].body).toContain('will not weaken you');
  });

  it('sends nothing when either dialog is dismissed', () => {
    // cancel/Escape tear the dialog down and run only the no-choice callback
    // (see showConfirmDialog); dismissing must leave the command unsent at
    // either step and open nothing further.
    const first = withLevel(20);
    const reviveA = vi.fn();
    first.hud.onResurrectAtSpiritHealer = reviveA;
    first.request();
    expect(first.confirmations).toHaveLength(1);
    first.confirmations[0].onCancel?.();
    expect(first.confirmations).toHaveLength(1);
    expect(reviveA).not.toHaveBeenCalled();

    const second = withLevel(20);
    const reviveB = vi.fn();
    second.hud.onResurrectAtSpiritHealer = reviveB;
    second.request();
    second.confirmations[0].onOk();
    expect(second.confirmations).toHaveLength(2);
    second.confirmations[1].onCancel?.();
    expect(second.confirmations).toHaveLength(2);
    expect(reviveB).not.toHaveBeenCalled();
  });

  it('reads the revive command at the second OK, not when the dialogue opens', () => {
    // The Hud's onResurrectAtSpiritHealer is wired by main.ts after the Hud
    // exists; the flow must read it live, as the Hud method did.
    const { hud, confirmations, request } = withLevel(20);
    request();
    confirmations[0].onOk();
    const revive = vi.fn();
    hud.onResurrectAtSpiritHealer = revive;
    confirmations[1].onOk();
    expect(revive).toHaveBeenCalledOnce();
  });
});
