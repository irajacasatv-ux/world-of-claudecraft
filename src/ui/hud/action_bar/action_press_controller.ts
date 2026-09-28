// The press, release and cast paths for every action-bar seat and cross hotbar
// cell (extracted from Hud: pressSlot, releaseSlot, castSlot, the cross hotbar
// trio, castPositionAbility, activateFixedAttackSlot and useHotbarItem), plus
// the empowered hold they share. A key, a click, a ring tap and a pad press all
// land here, so every input family keeps the SAME cast semantics: the vehicle
// gate, the ground-aim reticle and its re-press commit, the empower charge, the
// mouseover redirect, the auto-attack QoL and the one item-use path.
//
// Hud members are private, so the controller takes the Hud untyped (the
// hud/vehicle/hud_vehicle_bar.ts shape) and reads every member live through it;
// the members it reads are welded to hud.ts in
// tests/action_press_controller.test.ts. Hud keeps the public entry points
// main.ts, the gamepad routing and the bar buttons call, as one-line delegators.
//
// A DOM module: it reads the body's mobile-touch class and the #bags window's
// open state.

import { CROSS_HOTBAR_ATTACK_ID } from '../../../game/cross_hotbar';
import type { Settings } from '../../../game/settings';
import type { ResolvedAbility } from '../../../sim/sim';
import type { IWorld } from '../../../world_api';
import { crossHotbarActionSlot, EmpowerHold } from '../../empower_hold_core';
import type { FocusTargetsController } from '../../focus_targets_controller';
import { t } from '../../i18n';
import { isPvpHostileTargetId } from '../../pvp_hostile_core';
import { tSim } from '../../sim_i18n';
import { VehicleActionBarController } from '../vehicle/vehicle_action_bar_controller';
import { actionBarCooldownRemaining } from './action_bar_view';
import {
  deferAutoAttackUntilCastEnd,
  hasAutoAttackTarget,
  pressStartsAutoAttack,
} from './attack_on_ability';
import { shouldUseGroundAim, XHB_ONLY_AIM_SLOT } from './ground_aim';
import type { GroundAimController } from './ground_aim_controller';
import type { FreedAttackSlotAbility, HotbarAction } from './hotbar';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

/** One cross hotbar cell's action: an ability or an item, by id. */
type CrossHotbarCellAction = { type: 'ability' | 'item'; id: string };

/** The private Hud members the press paths read and write. */
export interface ActionPressHost {
  readonly sim: IWorld;
  /** The vehicle bar, built on first read; a vehicle session takes slot presses. */
  readonly vehicleControls: { chooseSlot(slot: number): void };
  /** The live aim: the vehicle's during a vehicle session, else the player's. */
  readonly groundAim: Pick<GroundAimController, 'activeSlot' | 'activeAbilityId'>;
  readonly playerGroundAim: Pick<GroundAimController, 'pressPosition'>;
  readonly optionsHooks: { readonly settings: Pick<Settings, 'get'> } | null;
  readonly focusTargets: Pick<FocusTargetsController, 'castTarget'>;
  readonly hoveredCastUnit: (() => number | null) | null;
  /** Written by a timed cast's auto-attack QoL; the event drain arms it. */
  pendingAutoAttackAbilityId: string | null;
  readonly hotbarActions: readonly HotbarAction[];
  readonly tradeOpen: boolean;
  actionForSlot(barSlot: number): HotbarAction;
  abilityForSlot(barSlot: number): ResolvedAbility | null;
  attackSlotIsAttack(): boolean;
  freedAttackSlotAbility(): FreedAttackSlotAbility | null;
  isHotbarItemId(itemId: string): boolean;
  isGroundAimActive(): boolean;
  commitGroundAimAt(): boolean;
  cancelGroundAim(): boolean;
  flashActionSlot(barSlot: number): void;
  showError(text: string): void;
  tryGatherToolUse(itemId: string): boolean;
  renderBags(): void;
}

export class ActionPressController {
  /** The hold-to-charge state for empowered abilities, shared by the key, the
   *  pointer and the pad press edges. The vehicle bar cancels it on entering a
   *  seat (through the Hud's empowerHold getter). */
  readonly empowerHold = new EmpowerHold();
  private readonly hud: ActionPressHost;

  constructor(hud: ActionPressHost) {
    this.hud = hud;
  }

  empoweredAbilityIdForSlot(slot: number): string | null {
    const known = this.hud.abilityForSlot(slot);
    return known?.def.empowerStages ? known.def.id : null;
  }

  // Slot key DOWN: every slot fires immediately (a tap is down + up, so this
  // is the press).
  pressSlot(slot: number): void {
    if (VehicleActionBarController.blocksPlayerActions(this.hud.sim)) {
      this.hud.vehicleControls.chooseSlot(slot);
      return;
    }
    if (this.empowerHold.press(slot, this.empoweredAbilityIdForSlot(slot), this.hud.sim)) return;
    this.castSlot(slot);
  }

  // Slot key UP: release an empowered hold. A non-charging slot already fired
  // on press, so this is a no-op.
  releaseSlot(slot: number): void {
    if (VehicleActionBarController.blocksPlayerActions(this.hud.sim)) return;
    this.empowerHold.releaseSlot(slot, this.hud.sim, (released) =>
      this.hud.flashActionSlot(released),
    );
  }

  activateFixedAttackSlot(): void {
    if (this.hud.sim.player.autoAttack) this.hud.sim.stopAutoAttack();
    else this.hud.sim.startAutoAttack();
    this.hud.flashActionSlot(0);
  }

  // Pad press edge for a cross hotbar cell. Routed through pressSlot when the bar
  // holds the action, so a pad press gets the SAME semantics a key press does
  // (reticle, empower charge, mouseover cast, the auto-attack QoL) rather than a
  // second cast path that would drift from it; the release edge is releaseCrossHotbarAction.
  pressCrossHotbarAction(action: CrossHotbarCellAction): void {
    if (VehicleActionBarController.blocksPlayerActions(this.hud.sim)) return;
    if (action.id === CROSS_HOTBAR_ATTACK_ID || action.type === 'item') {
      this.castCrossHotbarAction(action);
      return;
    }
    const slot = crossHotbarActionSlot(action, this.hud.hotbarActions.length, (barSlot) =>
      this.hud.actionForSlot(barSlot),
    );
    if (slot >= 0) {
      this.pressSlot(slot);
      return;
    }
    const known = this.hud.sim.known.find((ability) => ability.def.id === action.id);
    if (known?.def.empowerStages && this.empowerHold.press(-1, action.id, this.hud.sim)) return;
    this.castCrossHotbarAction(action);
  }

  releaseCrossHotbarAction(action: CrossHotbarCellAction): void {
    if (VehicleActionBarController.blocksPlayerActions(this.hud.sim)) return;
    this.empowerHold.releaseAction(action, this.hud.sim, (slot) => this.hud.flashActionSlot(slot));
  }

  // Tap-shaped cross hotbar fire (no hold edge available). The bar is seeded from
  // the action bar, so the slot lookup almost always hits; an action arranged onto
  // the pad and nowhere else falls back to a plain cast (position abilities keep
  // the reticle via the ability-id aim identity) or the shared item-use seam.
  castCrossHotbarAction(action: CrossHotbarCellAction): void {
    if (VehicleActionBarController.blocksPlayerActions(this.hud.sim)) return;
    // Attack is the fixed slot-0 toggle, not something the sim can cast by id.
    if (action.id === CROSS_HOTBAR_ATTACK_ID) {
      this.activateFixedAttackSlot();
      return;
    }
    const slot = crossHotbarActionSlot(action, this.hud.hotbarActions.length, (barSlot) =>
      this.hud.actionForSlot(barSlot),
    );
    if (slot >= 0) {
      this.castSlot(slot);
      return;
    }
    if (action.type === 'ability') {
      // A pad-only position ability still gets the reticle: aim identity falls
      // back to the ability id (XHB_ONLY_AIM_SLOT), so re-press still commits.
      const known = this.hud.sim.known.find((k) => k.def.id === action.id) ?? null;
      if (known && known.def.targetMode === 'position' && !known.def.selfCentered) {
        if (this.hud.isGroundAimActive()) {
          if (this.hud.groundAim.activeAbilityId() === action.id) {
            this.hud.commitGroundAimAt();
            return;
          }
          this.hud.cancelGroundAim();
        }
        this.castPositionAbility(action.id, known, XHB_ONLY_AIM_SLOT);
        return;
      }
      // The sim owns the refusal for an ability the player no longer knows.
      this.hud.sim.castAbility(action.id);
      return;
    }
    if (this.hud.tradeOpen) return;
    if (this.hud.isHotbarItemId(action.id)) {
      this.useHotbarItem(action.id);
      return;
    }
    // A cell left holding an item this client cannot use is a stale binding, so
    // refuse it out loud rather than eating the press.
    this.hud.showError(tSim('error.noItem'));
  }

  private groundReticleEnabled(): boolean {
    return shouldUseGroundAim(
      document.body.classList.contains('mobile-touch'),
      this.hud.optionsHooks?.settings.get('groundReticle') ?? true,
      this.hud.optionsHooks?.settings.get('touchPreciseGroundAim') ?? true,
    );
  }

  // One decision for a position press (bar slots and the XHB-only fallback):
  // enter aim when the reticle applies and the cast could start (alive, off
  // cooldown; resources and the GCD change while aiming, so they never gate
  // entry), else cast instantly. slotForAim is the re-press commit identity.
  private castPositionAbility(
    abilityId: string,
    resolved: ResolvedAbility,
    slotForAim: number,
  ): void {
    this.hud.playerGroundAim.pressPosition(
      abilityId,
      slotForAim,
      this.groundReticleEnabled() &&
        !this.hud.sim.player.dead &&
        actionBarCooldownRemaining(this.hud.sim.player, resolved) <= 0,
      document.body.classList.contains('mobile-touch'),
    );
  }

  castSlot(barSlot: number): void {
    if (VehicleActionBarController.blocksPlayerActions(this.hud.sim)) {
      this.hud.vehicleControls.chooseSlot(barSlot);
      return;
    }
    if (this.hud.isGroundAimActive()) {
      if (this.hud.groundAim.activeSlot() === barSlot) {
        this.hud.commitGroundAimAt();
        this.hud.flashActionSlot(barSlot);
        return;
      }
      this.hud.cancelGroundAim();
    }
    if (barSlot === 0 && this.hud.attackSlotIsAttack()) {
      this.activateFixedAttackSlot();
      return;
    }
    const action = this.hud.actionForSlot(barSlot);
    if (action?.type === 'ability') {
      // cast by ability id: the server validates against its own known list,
      // so the client-side slot remap never desyncs slot semantics
      const resolved = this.hud.abilityForSlot(barSlot);
      if (resolved) {
        // A keyboard-generated button click has no pointer hold. Resolve it as
        // a minimum-charge tap so an empowered spell can never stay stuck.
        if (resolved.def.empowerStages) {
          this.hud.sim.castAbility(action.id);
          this.hud.sim.releaseEmpoweredAbility(action.id);
          this.hud.flashActionSlot(barSlot);
          return;
        }
        // A self-centered channel (Bladestorm) casts at the caster's own feet:
        // no ground-aim reticle, straight to the normal cast path.
        if (resolved.def.targetMode === 'position' && !resolved.def.selfCentered) {
          this.castPositionAbility(action.id, resolved, barSlot);
        } else {
          const mouseoverPid = this.hud.focusTargets.castTarget(
            resolved.def,
            this.hud.hoveredCastUnit?.() ?? null,
            this.hud.optionsHooks?.settings.get('mouseoverCast') ?? true,
          );
          if (mouseoverPid !== null) {
            this.hud.sim.castAbilityOn(action.id, mouseoverPid);
          } else {
            this.hud.sim.castAbility(action.id);
          }
          // Optional QoL: also engage auto-attack when the ability is an offensive
          // attack, so white swings start without a separate Attack press. Gated on
          // the player setting; pressStartsAutoAttack skips heals/buffs, CC the swing
          // would shatter, and a party-frame redirect. hasAutoAttackTarget keeps
          // requiresTarget:false AOEs from tripping "Invalid attack target" and covers
          // PvP player targets that never carry the mob-only `hostile` flag.
          const tid = this.hud.sim.player.targetId;
          const target = tid !== null ? (this.hud.sim.entities.get(tid) ?? null) : null;
          if (
            this.hud.optionsHooks?.settings.get('startAttackOnAbilityUse') &&
            pressStartsAutoAttack(resolved.effects, mouseoverPid !== null) &&
            hasAutoAttackTarget(target, isPvpHostileTargetId(this.hud.sim, tid))
          ) {
            // A TIMED cast must not engage yet (the aggro-before-damage bug). The
            // recorded id only ARMS once castStart confirms this exact cast began
            // (a refused cast never reaches it); see the Hud's
            // confirmPendingAutoAttackEngage call for why that matters. Instants
            // still engage at once since their damage lands this same tick.
            if (deferAutoAttackUntilCastEnd(resolved.castTime)) {
              this.hud.pendingAutoAttackAbilityId = action.id;
            } else {
              this.hud.sim.startAutoAttack();
            }
          }
        }
        this.hud.flashActionSlot(barSlot);
      } else if (barSlot === 0 && this.hud.freedAttackSlotAbility()) {
        // The freed slot now visibly shows an assigned, named icon (dimmed) even
        // while unusable, so a press must refuse out loud rather than eating the
        // click silently, the same courtesy a stale item binding already gets
        // (castCrossHotbarAction's tSim('error.noItem') above).
        this.hud.showError(t('abilityUi.tooltip.unavailable'));
      }
    } else if (action?.type === 'item' && this.hud.isHotbarItemId(action.id)) {
      if (this.hud.tradeOpen) return;
      this.useHotbarItem(action.id);
      this.hud.flashActionSlot(barSlot);
    }
  }

  // The one item-use path a bar press takes, keyboard or pad: gathering tools
  // route through the interact-style handler first (#2343); everything else
  // (and fishing implements) keeps the plain useItem command.
  private useHotbarItem(itemId: string): void {
    if (!this.hud.tryGatherToolUse(itemId)) this.hud.sim.useItem(itemId);
    if ($('#bags').style.display !== 'none') this.hud.renderBags();
  }
}
