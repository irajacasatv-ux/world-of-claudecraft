// The Pale Keeper's two-step revive over the shared confirm dialog, moved whole
// out of Hud.requestSpiritHealerResurrect. Talking to the Keeper (world click,
// interact key) opens its dialogue, and Revive Me there opens a level-aware
// confirmation (the keys come from keeper_revive_dialog_core.ts): the raise is
// irreversible and charges The Keeper's Toll from level 10 up. Only the second
// OK sends the command; cancel/Escape at either step sends nothing.
//
// Hud keeps requestSpiritHealerResurrect as the one-line entry point the
// interaction layer calls, and passes itself as the host, so tsc checks the
// Hud against KeeperReviveHost.

import { t } from '../../i18n';
import type { ConfirmDialogArgs } from '../dialog';
import { keeperReviveConfirm, keeperReviveDialogue } from './keeper_revive_dialog_core';

/** The Hud members the revive flow drives. */
export interface KeeperReviveHost {
  /** Read at each step, so the second step words the Toll for the live level. */
  readonly sim: { readonly player: { readonly level: number } };
  /** The revive command main.ts wires; read at the second OK, never earlier. */
  readonly onResurrectAtSpiritHealer: (() => void) | null;
  confirmDialog(...args: ConfirmDialogArgs): void;
}

/** Open the Keeper's dialogue; its Revive Me opens the confirmation, and only
 *  that confirmation's OK sends the revive. */
export function runKeeperRevive(host: KeeperReviveHost): void {
  const talk = keeperReviveDialogue(host.sim.player.level);
  host.confirmDialog(t(talk.titleKey), t(talk.bodyKey), t(talk.okKey), t(talk.cancelKey), () => {
    const sure = keeperReviveConfirm(host.sim.player.level);
    host.confirmDialog(t(sure.titleKey), t(sure.bodyKey), t(sure.okKey), t(sure.cancelKey), () =>
      host.onResurrectAtSpiritHealer?.(),
    );
  });
}
