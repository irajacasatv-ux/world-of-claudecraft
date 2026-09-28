// The pet action bar (#petbar): the command and stance buttons under the pet
// frame, moved whole out of the Hud (renderPetBar, clearPetBarGroups, the
// repaint latch, the stance-menu toggle and the mobile-pet-active body flag).
// The pure half, the per-frame facts, the signature, the ordered button set and
// the bag food check, is pet_bar_view.ts; this controller owns the nodes, the
// listeners, the focus carry across a rebuild and the command each press sends.
//
// Hud builds it lazily over itself as the host (so tsc checks the Hud against
// PetBarHost), drives render(pet) every frame from update() with the pet it
// resolved once for the pet frame too, and calls invalidate() wherever the bar
// must rebuild on the next frame: a language switch (relocalizeCoordinatorMemos),
// the pet-feed mode ending (cancelPetFeed) and the bags window's feed pick.
// pendingPetFeed stays a Hud field because the bags window reads and writes it.
//
// A DOM module: it reads #petbar and #bags, toggles a body class and arms the
// touch-hold timer on window.

import { audio } from '../../../game/audio';
import type { Entity } from '../../../sim/types';
import type { IWorld } from '../../../world_api';
import { captureFocusKey, restoreFirstEnabled } from '../../focus_restore';
import { t, tPlural } from '../../i18n';
import { iconDataUrl } from '../../icons';
import type { TouchPeekGuard } from '../../touch_peek';
import { livingSecondaryPet } from '../pet_bar_core';
import {
  bagsHoldPetFood,
  newPetBarFacts,
  type PetBarAutocastToggle,
  type PetBarButton,
  type PetBarContext,
  type PetBarPress,
  petBarButtons,
  petBarFactsInto,
} from './pet_bar_view';

/** How long a touch-hold on an autocast button runs before it flips the
 *  autocast (the touch twin of the desktop right-click). */
const PET_AUTOCAST_TOUCH_HOLD_MS = 2000;

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

/** The Hud members the pet bar reads and drives. */
export interface PetBarHost {
  readonly sim: Pick<
    IWorld,
    | 'entities'
    | 'playerId'
    | 'cfg'
    | 'inventory'
    | 'petSpecialCommandsSupported'
    | 'petAttack'
    | 'petWaterJet'
    | 'petSpecial'
    | 'petTaunt'
    | 'healPet'
    | 'setPetAutoWaterJet'
    | 'setPetAutoSpecial'
    | 'setPetAutoTaunt'
    | 'setPetMode'
  >;
  /** The food-selection mode the Heal Pet button starts, shared with the bags window. */
  pendingPetFeed: boolean;
  /** Tells a touch long-press "peek" (inspect, no action) from a tap. */
  readonly peekGuard: Pick<TouchPeekGuard, 'consume'>;
  /** Leaves the food-selection mode (and invalidates this bar when it was on). */
  cancelPetFeed(): void;
  showError(text: string): void;
  renderBags(): void;
  hideTooltip(): void;
  attachTooltip(el: HTMLElement, html: () => string): void;
}

export class PetBarController {
  /** The signature of what the bar shows. '' until the first paint and after
   *  invalidate(), which no real signature can equal. */
  private lastSig = '';
  // Value-diffed body-class flag: true while a live pet bar is shown. The mobile
  // top-band layout reads body.mobile-pet-active to yield the top-centre line to the
  // pet bar (the sideways consumables row and the Vale Cup indicator drop a band).
  private lastPresent = false;
  private modeMenuOpen = false;
  private readonly facts = newPetBarFacts();
  private readonly ctx: PetBarContext;
  private readonly hud: PetBarHost;

  constructor(hud: PetBarHost) {
    this.hud = hud;
    this.ctx = {
      primaryPetShown: false,
      ownerClass: 'warrior',
      specialCommandsSupported: false,
      pendingPetFeed: false,
      modeMenuOpen: false,
      hasPetFood: () => bagsHoldPetFood(this.hud.sim.inventory),
    };
  }

  /** Rebuild on the next frame: clears the latch to '', which no real
   *  signature can equal (every one starts with the pet id and a colon). */
  invalidate(): void {
    this.lastSig = '';
  }

  // `pet` is resolved ONCE per frame by Hud.update() and passed in, shared with the
  // pet frame above it: both surfaces need the same entity, and each resolving its
  // own would walk the interest-scoped roster twice per frame.
  render(pet: Entity | null): void {
    const bar = $('#petbar');
    const sim = this.hud.sim;
    // Keep commandable Necromancy secondaries visible after Graveguard is gone.
    const primaryPetShown = !!pet && !pet.dead;
    if (!primaryPetShown) pet = livingSecondaryPet(sim.entities.values(), sim.playerId);
    // Value-diffed body-class flag (see field doc): toggled only on a real
    // transition so the per-frame path stays write-free, and on EVERY host so
    // a desktop-to-touch flip never sees it stale.
    const petPresent = !!pet && !pet.dead;
    if (petPresent !== this.lastPresent) {
      this.lastPresent = petPresent;
      document.body.classList.toggle('mobile-pet-active', petPresent);
    }
    if (!pet || pet.dead) {
      bar.style.display = 'none';
      if (this.lastSig !== '') {
        this.clearGroups(bar);
        this.lastSig = '';
      }
      return;
    }
    const ctx = this.ctx;
    ctx.primaryPetShown = primaryPetShown;
    ctx.ownerClass = sim.cfg.playerClass;
    ctx.specialCommandsSupported = sim.petSpecialCommandsSupported;
    ctx.pendingPetFeed = this.hud.pendingPetFeed;
    ctx.modeMenuOpen = this.modeMenuOpen;
    const facts = petBarFactsInto(this.facts, pet, ctx);
    bar.style.display = 'flex';
    if (facts.sig === this.lastSig) return;
    this.lastSig = facts.sig;
    // Focus carry-across through the shared helper (focus_restore.ts, #2528):
    // captureFocusKey owns the activeElement narrowing and the containment
    // check, so this rebuild never steals focus from another open window that
    // happens to reuse the same data-focus-key value.
    const focusedPetActionKey = captureFocusKey(bar);
    this.clearGroups(bar);
    const commands = document.createElement('div');
    commands.className = 'petbar-group';
    const stances = document.createElement('div');
    stances.className = 'petbar-group';
    bar.append(commands, stances);
    const buttons = petBarButtons(pet, ctx, facts);
    for (const button of buttons.commands) this.addButton(commands, button);
    for (const button of buttons.stances) this.addButton(stances, button);
    if (!focusedPetActionKey) return;
    // Finding the rebuilt equivalent stays the caller's own ladder (the
    // shared helper only owns the walk + disabled skip); the pet bar has no
    // degradation rungs, just the one exact action the player was on.
    const replacement = [...bar.querySelectorAll<HTMLButtonElement>('.pet-btn')].find(
      (btn) => btn.dataset.focusKey === focusedPetActionKey,
    );
    // suppressFocusTooltip is attachTooltip's own side channel, kept as a
    // direct write on the resolved button. Dropping the prior
    // `{ preventScroll: true }` is safe: restoreFirstEnabled's bare focus()
    // is the seam's policy, and #petbar is fixed HUD chrome outside any
    // scrollable ancestor, so a re-focused button never needs a scroll
    // correction.
    if (replacement) replacement.dataset.suppressFocusTooltip = 'true';
    restoreFirstEnabled([replacement]);
  }

  // The pet bar is a movable frame ('petBar'), so its rebuild wipes only its
  // OWN group children: an innerHTML clear would destroy the mover's chrome.
  private clearGroups(bar: HTMLElement): void {
    for (const group of bar.querySelectorAll('.petbar-group')) group.remove();
  }

  /** A button's primary activation. Reads the world at press time. */
  private press(press: PetBarPress): void {
    const sim = this.hud.sim;
    switch (press.kind) {
      case 'attack':
        sim.petAttack();
        return;
      case 'waterJet':
        sim.petWaterJet();
        return;
      case 'special':
        sim.petSpecial();
        return;
      case 'taunt':
        sim.petTaunt();
        return;
      case 'healDemon':
        sim.healPet();
        return;
      case 'feed':
        this.toggleFeed();
        return;
      case 'modeMenu':
        this.modeMenuOpen = !this.modeMenuOpen;
        this.lastSig = '';
        return;
      case 'setMode':
        sim.setPetMode(press.mode);
        this.modeMenuOpen = false;
        this.lastSig = '';
        return;
    }
  }

  /** Right-click (desktop), Shift+Enter or touch-hold (mobile): flip the
   *  skill's autocast, so the pet fires it on cooldown on its own. */
  private toggleAutocast(toggle: PetBarAutocastToggle): void {
    const sim = this.hud.sim;
    if (toggle.skill === 'waterJet') sim.setPetAutoWaterJet(toggle.enabled);
    else if (toggle.skill === 'special') sim.setPetAutoSpecial(toggle.enabled);
    else sim.setPetAutoTaunt(toggle.enabled);
    this.lastSig = '';
  }

  // Toggle: a second click cancels the pending feed instead of trapping
  // the player in food-selection mode. Reaching this handler at all
  // means feedState.disabled was false (the button no-ops while
  // disabled), so the food check below is now just a defensive guard.
  private toggleFeed(): void {
    if (this.hud.pendingPetFeed) {
      this.hud.cancelPetFeed();
      return;
    }
    if (!bagsHoldPetFood(this.hud.sim.inventory)) {
      this.hud.showError(t('hud.pet.noPetFood'));
      return;
    }
    this.hud.pendingPetFeed = true;
    this.lastSig = '';
    $('#bags').style.display = 'flex';
    this.hud.renderBags();
  }

  private addButton(parent: HTMLElement, button: PetBarButton): void {
    const { title, tooltip } = button;
    const toggle = button.autocastToggle;
    const btn = document.createElement('button');
    btn.className = 'pet-btn ui-socket';
    btn.dataset.focusKey = button.focusKey;
    if (button.active) btn.classList.add('active', 'is-on');
    if (button.autocast) btn.classList.add('autocast');
    if (button.cooldownText) btn.classList.add('cooldown');
    if (button.disabled) btn.classList.add('disabled');
    btn.title = title;
    btn.setAttribute(
      'aria-label',
      button.cooldownText
        ? `${title}, ${tPlural('hudChrome.plurals.secondsRemaining', Number(button.cooldownText))}`
        : title,
    );
    if (button.disabled) btn.setAttribute('aria-disabled', 'true');
    if (button.active) btn.setAttribute('aria-pressed', 'true');
    if (toggle) {
      // Primary activation casts the skill; it does not toggle autocast. Do
      // not expose this as aria-pressed (which promises the opposite button
      // contract). Announce the secondary mode as descriptive state instead.
      btn.setAttribute(
        'aria-description',
        t(button.autocast ? 'hud.pet.autocastOn' : 'hud.pet.autocastOff'),
      );
      btn.setAttribute('aria-keyshortcuts', 'Shift+Enter');
    }
    const icon = document.createElement('span');
    icon.className = 'icon-label ui-socket-art';
    icon.style.backgroundImage = `url(${iconDataUrl('ability', button.iconId)})`;
    btn.appendChild(icon);
    if (button.cooldownText) {
      const cdText = document.createElement('span');
      cdText.className = 'cdtext ui-socket-cd-text';
      cdText.textContent = button.cooldownText;
      btn.appendChild(cdText);
    }
    let suppressNextClick = false;
    let touchHoldTimer: number | undefined;
    let touchHoldPointerId: number | null = null;
    let touchHoldStartX = 0;
    let touchHoldStartY = 0;
    let touchHoldTriggered = false;
    let touchHoldCanceled = false;
    const clearTouchHoldTimer = () => {
      if (touchHoldTimer !== undefined) window.clearTimeout(touchHoldTimer);
      touchHoldTimer = undefined;
    };
    const runClickAction = () => {
      if (button.cooldownText || button.disabled) return;
      audio.click();
      this.press(button.press);
    };
    btn.addEventListener('click', () => {
      if (suppressNextClick) {
        suppressNextClick = false;
        this.hud.peekGuard.consume();
        this.hud.hideTooltip();
        btn.blur();
        return;
      }
      if (this.hud.peekGuard.consume()) {
        this.hud.hideTooltip();
        btn.blur();
        return;
      }
      runClickAction();
    });
    if (toggle) {
      btn.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || !event.shiftKey || event.repeat || button.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        audio.click();
        this.toggleAutocast(toggle);
      });
      btn.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        if (document.body.classList.contains('mobile-touch')) return;
        if (button.disabled) return; // an inert button fires no secondary action
        audio.click();
        this.toggleAutocast(toggle);
      });
      btn.addEventListener('pointerdown', (event) => {
        if (!document.body.classList.contains('mobile-touch') || event.pointerType !== 'touch') {
          return;
        }
        if (button.disabled) return; // an inert button fires no long-press action
        event.preventDefault();
        clearTouchHoldTimer();
        suppressNextClick = false;
        touchHoldTriggered = false;
        touchHoldCanceled = false;
        touchHoldPointerId = event.pointerId;
        touchHoldStartX = event.clientX;
        touchHoldStartY = event.clientY;
        try {
          btn.setPointerCapture?.(event.pointerId);
        } catch {
          /* pointer already released */
        }
        touchHoldTimer = window.setTimeout(() => {
          if (touchHoldPointerId !== event.pointerId || touchHoldCanceled) return;
          touchHoldTriggered = true;
          suppressNextClick = true;
          audio.click();
          this.toggleAutocast(toggle);
          this.hud.hideTooltip();
          this.hud.peekGuard.consume();
          btn.blur();
        }, PET_AUTOCAST_TOUCH_HOLD_MS);
      });
      btn.addEventListener('pointermove', (event) => {
        if (touchHoldPointerId !== event.pointerId) return;
        const moved = Math.hypot(event.clientX - touchHoldStartX, event.clientY - touchHoldStartY);
        if (moved > 9) {
          touchHoldCanceled = true;
          clearTouchHoldTimer();
        }
      });
      const finishTouchHold = (event: PointerEvent, canceled: boolean) => {
        if (touchHoldPointerId !== event.pointerId) return;
        event.preventDefault();
        const triggered = touchHoldTriggered;
        const movedAway = touchHoldCanceled || canceled;
        clearTouchHoldTimer();
        touchHoldPointerId = null;
        touchHoldTriggered = false;
        touchHoldCanceled = false;
        suppressNextClick = true;
        if (triggered || movedAway) {
          this.hud.peekGuard.consume();
          return;
        }
        if (this.hud.peekGuard.consume()) {
          this.hud.hideTooltip();
          btn.blur();
          return;
        }
        runClickAction();
        btn.blur();
      };
      btn.addEventListener('pointerup', (event) => finishTouchHold(event, false));
      btn.addEventListener('pointercancel', (event) => finishTouchHold(event, true));
    }
    this.hud.attachTooltip(btn, () => tooltip);
    parent.appendChild(btn);
  }
}
