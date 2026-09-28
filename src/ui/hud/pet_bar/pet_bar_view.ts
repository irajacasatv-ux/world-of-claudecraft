// The pet action bar's pure half (extracted from Hud.renderPetBar beside
// pet_bar_controller.ts): the facts one frame of the bar derives from the pet,
// the repaint signature the controller latches on, the ordered buttons a
// rebuild paints (every caption and tooltip resolved), and the bag food check
// the Heal Pet button reads. DOM-free: the controller owns the nodes, the
// listeners, the focus carry across a rebuild and the command each press sends.
//
// Per frame the controller fills ONE reused context and ONE reused facts
// record, so a steady frame allocates what the bar always did (the signature
// string and the signature-skill state); petBarButtons runs only past a moved
// signature.

import { ITEMS, MOBS } from '../../../sim/data';
import { petCanForceTaunt } from '../../../sim/pet/pet_taunt_gate';
import type { Entity, InvSlot, PetMode, PlayerClass } from '../../../sim/types';
import { esc } from '../../esc';
import { type TranslationKey, t } from '../../i18n';
import {
  PET_ACTION_ICONS,
  type PetSpecialButtonState,
  petFeedButtonState,
  petSpecialButtonState,
} from '../../pet_action_icons';

/** What one frame of the bar reads besides the pet, filled into one reused
 *  record by the controller. */
export interface PetBarContext {
  /** The primary pet is alive and shown; false while a living Necromancy
   *  secondary stands in for a dead or despawned one. */
  primaryPetShown: boolean;
  ownerClass: PlayerClass;
  /** The world negotiated the template signature skills (IWorld.petSpecial). */
  specialCommandsSupported: boolean;
  /** The Hud's food-selection mode (the bags window shares it). */
  pendingPetFeed: boolean;
  /** The stance menu is expanded. */
  modeMenuOpen: boolean;
  /** Whether the bags hold feedable food, read only where the bar needs it. */
  hasPetFood: () => boolean;
}

/** The per-frame facts a rebuild's buttons depend on, plus their signature. */
export interface PetBarFacts {
  mode: PetMode;
  /** The Growl / Water Jet cooldown, whole seconds. */
  cooldown: number;
  autoTaunt: boolean;
  autoWaterJet: boolean;
  canTaunt: boolean;
  special: PetSpecialButtonState | null;
  /** The repaint signature. Never '' for a real pet: it starts with the pet id
   *  and a colon, so '' is the controller's "rebuild next frame" sentinel. */
  sig: string;
}

export function newPetBarFacts(): PetBarFacts {
  return {
    mode: 'defensive',
    cooldown: 0,
    autoTaunt: false,
    autoWaterJet: false,
    canTaunt: false,
    special: null,
    sig: '',
  };
}

/** Derive one frame's facts into `out` (reused across frames) and return it. */
export function petBarFactsInto(out: PetBarFacts, pet: Entity, ctx: PetBarContext): PetBarFacts {
  const mode = pet.petMode ?? 'defensive';
  const petTemplate = MOBS[pet.templateId];
  const cd = Math.ceil(Math.max(0, pet.petTauntTimer));
  const autoTaunt = pet.petAutoTaunt === true;
  const autoWaterJet = pet.petAutoWaterJet === true;
  const canTaunt = petCanForceTaunt(pet.templateId);
  const special = ctx.specialCommandsSupported
    ? petSpecialButtonState(petTemplate, pet.petSkillTimer, pet.petAutoSkill)
    : null;
  const ownerClass = ctx.ownerClass;
  const actionCooldownSig =
    pet.templateId === 'water_elemental'
      ? `water-jet:${cd}:${autoWaterJet ? 'auto' : 'manual'}`
      : canTaunt
        ? `${cd}:${autoTaunt ? 'auto' : 'manual'}`
        : 'no-taunt';
  const specialCooldownSig = special
    ? `${special.iconId}:${special.cooldown}:${special.autocast ? 'auto' : 'manual'}`
    : 'no-special';
  // Feed-button reason (full HP / no food) folds in so the pet bar redraws
  // when either flips, even while the pet stays otherwise unchanged.
  const feedSig =
    ownerClass === 'warlock'
      ? ''
      : (petFeedButtonState(pet.hp, pet.maxHp, ctx.hasPetFood()).reasonKey ?? 'ok');
  out.mode = mode;
  out.cooldown = cd;
  out.autoTaunt = autoTaunt;
  out.autoWaterJet = autoWaterJet;
  out.canTaunt = canTaunt;
  out.special = special;
  out.sig = `${pet.id}:${ctx.primaryPetShown ? 'primary' : 'secondary'}:${ownerClass}:${mode}:${actionCooldownSig}:${specialCooldownSig}:${ctx.pendingPetFeed ? 'feed' : ''}:${ctx.modeMenuOpen ? 'modes' : ''}:${feedSig}`;
  return out;
}

/** What a button's primary activation (click, tap, Enter) sends. */
export type PetBarPress =
  | {
      readonly kind:
        | 'attack'
        | 'waterJet'
        | 'special'
        | 'taunt'
        | 'healDemon'
        | 'feed'
        | 'modeMenu';
    }
  | { readonly kind: 'setMode'; readonly mode: PetMode };

/** The secondary activation (right-click, Shift+Enter, touch-hold): set the
 *  skill's autocast to `enabled`, the opposite of what this rebuild shows. */
export interface PetBarAutocastToggle {
  readonly skill: 'waterJet' | 'special' | 'taunt';
  readonly enabled: boolean;
}

export interface PetBarButton {
  readonly iconId: string;
  /** The accessible name and native title. It stays the action name even while
   *  the button is disabled; the WHY rides the rich tooltip instead. */
  readonly title: string;
  /** The rich hover tooltip's html, every interpolated string escaped. */
  readonly tooltip: string;
  readonly focusKey: string;
  readonly press: PetBarPress;
  readonly autocastToggle: PetBarAutocastToggle | null;
  readonly active: boolean;
  readonly autocast: boolean;
  /** Whole seconds left as the socket shows them; undefined when ready. */
  readonly cooldownText: string | undefined;
  /** Kept visible (never hidden) but greyed and inert. */
  readonly disabled: boolean;
}

export interface PetBarButtons {
  /** The command group, in paint order. */
  readonly commands: readonly PetBarButton[];
  /** The stance group: the stance-menu toggle, then the three modes while open. */
  readonly stances: readonly PetBarButton[];
}

const PET_MODE_LABEL_KEYS: Record<PetMode, TranslationKey> = {
  passive: 'hud.pet.passive',
  defensive: 'hud.pet.defensive',
  aggressive: 'hud.pet.aggressive',
};
const PET_MODE_DESC_KEYS: Record<PetMode, TranslationKey> = {
  passive: 'hud.pet.passiveDesc',
  defensive: 'hud.pet.defensiveDesc',
  aggressive: 'hud.pet.aggressiveDesc',
};
const PET_MODES: readonly PetMode[] = ['passive', 'defensive', 'aggressive'];
const MODE_ICONS: Record<PetMode, string> = {
  passive: PET_ACTION_ICONS.passive,
  defensive: PET_ACTION_ICONS.defensive,
  aggressive: PET_ACTION_ICONS.aggressive,
};

const petTooltip = (title: string, desc: string): string =>
  `<div class="tt-title">${esc(title)}</div><div class="tt-desc">${esc(desc)}</div>`;
const petModeLabel = (m: PetMode): string => t(PET_MODE_LABEL_KEYS[m]);

interface ButtonOpts {
  active?: boolean;
  autocast?: boolean;
  cooldownText?: string;
  autocastToggle?: PetBarAutocastToggle;
  focusKey?: string;
  disabled?: boolean;
}

function petBarButton(
  iconId: string,
  title: string,
  tooltip: string,
  press: PetBarPress,
  opts: ButtonOpts = {},
): PetBarButton {
  return {
    iconId,
    title,
    tooltip,
    focusKey: opts.focusKey ?? iconId,
    press,
    autocastToggle: opts.autocastToggle ?? null,
    active: opts.active === true,
    autocast: opts.autocast === true,
    cooldownText: opts.cooldownText,
    disabled: opts.disabled === true,
  };
}

/** The ordered buttons one rebuild paints, from the facts that moved its signature. */
export function petBarButtons(pet: Entity, ctx: PetBarContext, facts: PetBarFacts): PetBarButtons {
  const { mode, cooldown: cd, autoTaunt, autoWaterJet, canTaunt, special } = facts;
  const commands: PetBarButton[] = [
    petBarButton(
      PET_ACTION_ICONS.attack,
      t('hud.pet.attack'),
      petTooltip(t('hud.pet.petAttackTitle'), t('hud.pet.petAttackDesc')),
      { kind: 'attack' },
    ),
  ];
  if (pet.templateId === 'water_elemental') {
    // Right-click (desktop) or touch-hold (mobile) toggles autocast: the pet
    // then fires Water Jet on cooldown on its own, the same as pet Growl.
    commands.push(
      petBarButton(
        PET_ACTION_ICONS.waterJet,
        t('hud.pet.waterJet'),
        petTooltip(t('hud.pet.waterJetTitle'), t('hud.pet.waterJetDesc')),
        { kind: 'waterJet' },
        {
          autocast: autoWaterJet,
          cooldownText: cd > 0 ? `${cd}` : undefined,
          autocastToggle: { skill: 'waterJet', enabled: !autoWaterJet },
        },
      ),
    );
  }
  if (special) {
    commands.push(
      petBarButton(
        special.iconId,
        t(special.labelKey),
        petTooltip(t(special.titleKey), t(special.descKey)),
        { kind: 'special' },
        {
          autocast: special.autocast,
          cooldownText: special.cooldown > 0 ? `${special.cooldown}` : undefined,
          autocastToggle: { skill: 'special', enabled: !special.autocast },
        },
      ),
    );
  }
  if (canTaunt) {
    commands.push(
      petBarButton(
        PET_ACTION_ICONS.taunt,
        t('hud.pet.taunt'),
        petTooltip(t('hud.pet.petTauntTitle'), t('hud.pet.petTauntDesc')),
        { kind: 'taunt' },
        {
          autocast: autoTaunt,
          cooldownText: cd > 0 ? `${cd}` : undefined,
          autocastToggle: { skill: 'taunt', enabled: !autoTaunt },
        },
      ),
    );
  }
  if (ctx.ownerClass === 'warlock' && ctx.primaryPetShown) {
    commands.push(
      petBarButton(
        PET_ACTION_ICONS.healDemon,
        t('hud.pet.healDemon'),
        petTooltip(t('hud.pet.healDemon'), t('hud.pet.healDemonDesc')),
        { kind: 'healDemon' },
      ),
    );
  } else {
    const feedState = petFeedButtonState(pet.hp, pet.maxHp, ctx.hasPetFood());
    commands.push(
      petBarButton(
        PET_ACTION_ICONS.feed,
        // Accessible name stays "Heal Pet" even when disabled; the disabled
        // reason lives in the rich tooltip below, never in the aria-label.
        t('hud.pet.healPet'),
        feedState.reasonKey
          ? petTooltip(t('hud.pet.healPet'), t(feedState.reasonKey))
          : petTooltip(t('hud.pet.healPet'), t('hud.pet.healPetDesc')),
        { kind: 'feed' },
        // A pending feed stays clickable so the toggle can CANCEL it, even once
        // the pet has regenerated back to full HP (which would otherwise flip
        // feedState.disabled true and trap the player in food-selection mode).
        {
          active: ctx.pendingPetFeed,
          disabled: feedState.disabled && !ctx.pendingPetFeed,
        },
      ),
    );
  }
  const stances: PetBarButton[] = [
    petBarButton(
      MODE_ICONS[mode],
      petModeLabel(mode),
      petTooltip(`${t('hud.pet.stanceTitle')}: ${petModeLabel(mode)}`, t('hud.pet.stanceDesc')),
      { kind: 'modeMenu' },
      { active: true, focusKey: 'stance-menu' },
    ),
  ];
  if (ctx.modeMenuOpen) {
    for (const entry of PET_MODES) {
      stances.push(
        petBarButton(
          MODE_ICONS[entry],
          t(PET_MODE_LABEL_KEYS[entry]),
          petTooltip(t(PET_MODE_LABEL_KEYS[entry]), t(PET_MODE_DESC_KEYS[entry])),
          { kind: 'setMode', mode: entry },
          { active: mode === entry, focusKey: `stance-${entry}` },
        ),
      );
    }
  }
  return { commands, stances };
}

/** True when the bags hold at least one edible food stack. Mirrors the food
 *  check in Sim.feedPet, so the pet-feed flow never starts when it cannot
 *  possibly complete. */
export function bagsHoldPetFood(inventory: readonly InvSlot[]): boolean {
  return inventory.some((s) => {
    const item = ITEMS[s.itemId];
    return !!item && item.kind === 'food' && !!item.foodHp && s.count > 0;
  });
}
