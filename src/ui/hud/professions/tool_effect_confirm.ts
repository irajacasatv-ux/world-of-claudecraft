// The R40 per-use effect confirm (gather_node_interact.ts
// GatherEffectConfirmGate.ask), moved whole out of Hud.confirmToolEffectUse. It
// rides the one confirm-dialog family, so the focus trap, dialog key
// activation, aria naming, gamepad A/B, and mobile tap treatment are all
// inherited. OK confirms the spend; the cancel button, the X, and Esc all
// decline, and DECLINING STILL GATHERS (the ruling's letter: prompt mode gates
// the charge, never the gather), which is why the body copy says so and why
// `proceed` runs on every dismissal path via the onCancel hook.
//
// Hud keeps confirmToolEffectUse as the public entry point the interact key
// reaches (src/game/interact_key_gather.ts), and passes itself as the host.

import { formatNumber, t } from '../../i18n';
import { toolEffectNameKey } from '../../tool_effect_name';
import type { ConfirmDialogArgs } from '../dialog';

/** The Hud member the effect confirm drives. */
export interface ToolEffectConfirmHost {
  confirmDialog(...args: ConfirmDialogArgs): void;
}

/** Ask whether to spend one charge of the effect; `proceed` answers exactly
 *  once with the player's choice, on OK and on every no-choice dismissal. */
export function askToolEffectConfirm(
  host: ToolEffectConfirmHost,
  prompt: { effectId: string; charges: number },
  proceed: (confirmed: boolean) => void,
): void {
  const nameKey = toolEffectNameKey(prompt.effectId);
  // An unknown effect id (a newer server's catalog) cannot compose the
  // ask: degrade to an unconfirmed harvest rather than a broken dialog.
  if (nameKey === undefined) {
    proceed(false);
    return;
  }
  let answered = false;
  const answer = (confirmed: boolean) => {
    if (answered) return;
    answered = true;
    proceed(confirmed);
  };
  host.confirmDialog(
    t('hudChrome.professions.toolEffectConfirmTitle', { effect: t(nameKey) }),
    t('hudChrome.professions.toolEffectConfirmBody', {
      charges: formatNumber(prompt.charges, { maximumFractionDigits: 0 }),
    }),
    t('hudChrome.professions.toolEffectConfirmAccept'),
    t('hudChrome.professions.toolEffectConfirmDecline'),
    () => answer(true),
    () => answer(false),
  );
}
