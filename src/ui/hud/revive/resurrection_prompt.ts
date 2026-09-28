// The resurrection offer prompt, moved whole out of the Hud: the
// handleEvents 'resurrectionOffer' arm, closeResurrectionPrompt, and the
// resurrectionPromptEl singleton it guards. The prompt itself is the shared
// #prompt-stack prompt (showStackPrompt in prompt_dialog.ts).
//
// Hud routes the event here and closes the prompt from its per-frame `!p.dead`
// check; it builds this lazily over itself as the host, so tsc checks the Hud
// against ResurrectionPromptHost and a bare Hud.prototype rig resolves it.

import { audio } from '../../../game/audio';
import { esc } from '../../esc';
import { t } from '../../i18n';
import { showStackPrompt } from '../../prompt_dialog';

/** The Hud members the offer prompt reads. */
export interface ResurrectionPromptHost {
  readonly sim: {
    readonly player: { readonly dead: boolean };
    respondToResurrection(accept: boolean): void;
  };
}

export class ResurrectionPrompt {
  // The one live offer prompt, mirroring the sim's single latest offer.
  private el: HTMLElement | null = null;

  constructor(private readonly host: ResurrectionPromptHost) {}

  /** The live prompt, or null when none is showing. */
  get element(): HTMLElement | null {
    return this.el;
  }

  /** Present a resurrection offer from `fromName`. */
  offer(fromName: string): void {
    // An offer completing against a player who is no longer dead (they
    // released, respawned, or accepted another healer's rez while this
    // cast was in flight, all ordinary in online group play) is
    // unanswerable: the sim keeps offers only for dead players. Showing
    // it anyway painted the centred prompt for exactly one frame before
    // the per-frame `!p.dead` closer removed it, a split-second
    // dark-panel flash. The guard reads the same mirror the closer does,
    // so the two can never disagree.
    if (!this.host.sim.player.dead) return;
    // Same "someone is asking you to respond to a prompt" vocabulary as
    // party/guild invite; questAccept() was retired, see invitePrompt().
    audio.invitePrompt();
    // The sim keeps one authoritative latest offer per dead player. Mirror
    // that singleton in the HUD so an older prompt can never answer a newer
    // Chronomancer's offer.
    this.close();
    this.el = showStackPrompt(
      t('hud.prompts.resurrectionOffer', {
        name: `<b>${esc(fromName)}</b>`,
      }),
      t('hud.prompts.acceptResurrection'),
      () => {
        this.el = null;
        this.host.sim.respondToResurrection(true);
      },
      () => {
        this.el = null;
        this.host.sim.respondToResurrection(false);
      },
      t('hud.prompts.decline'),
      () => {
        this.el = null;
        this.host.sim.respondToResurrection(false);
      },
      true,
    );
  }

  /** Remove the live prompt, if any (the player is alive again, or a newer
   *  offer replaces it). */
  close(): void {
    this.el?.remove();
    this.el = null;
  }
}
