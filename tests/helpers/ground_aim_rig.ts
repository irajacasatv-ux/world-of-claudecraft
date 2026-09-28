// The ground-aim press rig: the Hud fields a position press reads (the world
// slice, the renderer's reticle hook, the options hooks, the slot lookups, the
// used-flash and the player's GroundAimController, built the way the Hud's own
// field initializer builds it), seeded onto any object.
// tests/ground_aim_hud.test.ts seeds a plain host for ActionPressController;
// tests/hud_coordinator_delegators.test.ts seeds a bare Hud.prototype, so the
// same wiring also runs through the real Hud delegators there. It never imports
// the Hud, so the controller suite stays free of the coordinator's graph.
import { type Mock, vi } from 'vitest';
import { ABILITIES } from '../../src/sim/data';
import type { ResolvedAbility } from '../../src/sim/sim';
import type { AbilityDef, Entity } from '../../src/sim/types';
import {
  type AimPoint,
  quickGroundTarget,
  selectedGroundAimPoint,
} from '../../src/ui/hud/action_bar/ground_aim';
import { GroundAimController } from '../../src/ui/hud/action_bar/ground_aim_controller';

export interface GroundAimRigOptions {
  player?: Entity;
  target?: Entity;
  attackable?: boolean;
  range?: number;
  minRange?: number;
  cooldownId?: string;
  abilityDef?: AbilityDef;
  mobileTouch?: boolean;
  touchPrecise?: boolean;
  desktopPreference?: boolean;
  groundAimPlacementPreview?: (abilityId: string, point: AimPoint) => AimPoint;
}

/** The fields the rig seeds. */
export interface GroundAimRig {
  playerGroundAim: GroundAimController;
  sim: {
    player: Entity;
    entities: Map<number, Entity>;
    known: ResolvedAbility[];
    castAbilityAt: Mock;
    groundAimPlacementPreview: Mock;
  };
  renderer: { setGroundAimReticle: Mock };
  optionsHooks: {
    groundAimTargetAttackable?: (targetId: number) => boolean;
    settings: { get(key: 'groundReticle' | 'touchPreciseGroundAim'): boolean };
  } | null;
  mobileActionPage: number;
  actionForSlot(slot: number): { type: 'ability'; id: string } | null;
  abilityForSlot(slot: number): ResolvedAbility | null;
  flashActionSlot: Mock;
}

export function resolvedPositionAbility(
  abilityDef: AbilityDef = ABILITIES.flamestrike,
  range = abilityDef.range,
  minRange?: number,
  cooldownId?: string,
): ResolvedAbility {
  const def = { ...abilityDef, range, minRange };
  return {
    def,
    rank: 1,
    cost: def.cost,
    castTime: def.castTime,
    cooldown: def.cooldown,
    effects: def.effects,
    threatFlat: 0,
    threatMult: 1,
    cooldownId,
  };
}

export function entity(id: number, x: number, z: number): Entity {
  return {
    id,
    pos: { x, y: 0, z },
    facing: 0,
    targetId: null,
    dead: false,
    auras: [],
    cooldowns: new Map(),
  } as unknown as Entity;
}

/** Seeds the rig onto `target` and returns it. Every closure reads `target`
 *  live, so a case that reassigns a field (optionsHooks = null) is seen. */
export function seedGroundAimRig<T extends object>(
  target: T,
  options: GroundAimRigOptions = {},
): T & GroundAimRig {
  const hud = target as T & GroundAimRig;
  const player = options.player ?? entity(1, 0, 0);
  const selected = options.target;
  if (selected) player.targetId = selected.id;
  const abilityDef = options.abilityDef ?? ABILITIES.flamestrike;
  const ability = resolvedPositionAbility(
    abilityDef,
    options.range ?? abilityDef.range,
    options.minRange ?? abilityDef.minRange,
    options.cooldownId,
  );
  document.body.classList.toggle('mobile-touch', options.mobileTouch ?? false);
  hud.mobileActionPage = 0;
  hud.sim = {
    player,
    entities: new Map(
      [...[player, selected].filter((value): value is Entity => !!value)].map((e) => [e.id, e]),
    ),
    known: [ability],
    castAbilityAt: vi.fn(),
    groundAimPlacementPreview: vi.fn(
      options.groundAimPlacementPreview ?? ((_id: string, point: AimPoint) => point),
    ),
  };
  hud.renderer = { setGroundAimReticle: vi.fn() };
  // Mirrors Hud's playerGroundAim field initializer, which neither a plain host
  // nor Object.create(Hud.prototype) runs.
  hud.playerGroundAim = new GroundAimController({
    player: () => hud.sim.player,
    resolveAbility: (id) => hud.sim.known.find((k) => k.def.id === id) ?? null,
    seedTargetPoint: () =>
      selectedGroundAimPoint(
        hud.sim.player,
        hud.sim.entities,
        hud.optionsHooks?.groundAimTargetAttackable,
      ),
    fallbackPoint: () => quickGroundTarget(hud.sim.player, hud.sim.entities),
    castAt: (id, point) => (hud.sim.castAbilityAt as (i: string, p: AimPoint) => void)(id, point),
    clearReticle: () => (hud.renderer.setGroundAimReticle as (r: null) => void)(null),
    projectPlacement: (id, point) =>
      (hud.sim.groundAimPlacementPreview as (i: string, p: AimPoint) => AimPoint)(id, point),
  });
  hud.optionsHooks = {
    groundAimTargetAttackable: () => options.attackable ?? false,
    settings: {
      get: (key) =>
        key === 'touchPreciseGroundAim'
          ? (options.touchPrecise ?? true)
          : (options.desktopPreference ?? true),
    },
  };
  hud.actionForSlot = () => ({ type: 'ability', id: ability.def.id });
  hud.abilityForSlot = () => ability;
  hud.flashActionSlot = vi.fn();
  return hud;
}
