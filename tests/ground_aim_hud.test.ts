// @vitest-environment happy-dom

// The ground-aim flow of a position press, driven through the real
// ActionPressController (src/ui/hud/action_bar/action_press_controller.ts,
// extracted from Hud.castSlot / castCrossHotbarAction / castPositionAbility)
// over the shared rig in tests/helpers/ground_aim_rig.ts. The Hud's own
// ground-aim delegates and its page-flip cancel run against the real Hud in
// tests/hud_coordinator_delegators.test.ts, over the same rig.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ABILITIES } from '../src/sim/data';
import type { ActionPressHost } from '../src/ui/hud/action_bar/action_press_controller';
import { ActionPressController } from '../src/ui/hud/action_bar/action_press_controller';
import { type AimPoint, XHB_ONLY_AIM_SLOT } from '../src/ui/hud/action_bar/ground_aim';
import { GroundAimController } from '../src/ui/hud/action_bar/ground_aim_controller';
import {
  entity,
  type GroundAimRig,
  type GroundAimRigOptions,
  seedGroundAimRig,
} from './helpers/ground_aim_rig';

interface GroundAimHarness extends GroundAimRig {
  groundAim: GroundAimController;
  castSlot(slot: number): void;
  isGroundAimActive(): boolean;
  groundAimAbilityRange(): number | null;
  updateGroundAimPoint(point: AimPoint | null): void;
  nudgeGroundAimPoint(dx: number, dz: number): void;
  groundAimReticle(): {
    point: AimPoint;
    radius: number;
    school: string;
    dimmed: boolean;
    blocked: boolean;
  } | null;
  commitGroundAimAt(point?: AimPoint | null): boolean;
  commitGroundAim(): boolean;
}

/** The press controller over a plain host seeded by the rig. The host carries
 *  the Hud's thin ground-aim delegates, each a one-line forward to the live aim
 *  (the player's: this rig has no vehicle session); the real ones are driven in
 *  tests/hud_coordinator_delegators.test.ts. */
function makeHud(options: GroundAimRigOptions = {}): GroundAimHarness & {
  press: ActionPressController;
} {
  const rig = seedGroundAimRig({} as object, options);
  const aim = rig.playerGroundAim;
  const host = Object.assign(rig, {
    groundAim: aim,
    isGroundAimActive: () => aim.isActive(),
    cancelGroundAim: () => aim.cancel(),
    groundAimAbilityRange: () => aim.abilityRange(),
    updateGroundAimPoint: (point: AimPoint | null) => aim.updatePoint(point),
    nudgeGroundAimPoint: (dx: number, dz: number) => aim.nudge(dx, dz),
    groundAimReticle: () => aim.reticle(),
    commitGroundAimAt: (point?: AimPoint | null) => aim.commitAt(point),
    commitGroundAim: () => aim.commitAt(),
  });
  const press = new ActionPressController(host as unknown as ActionPressHost);
  return Object.assign(host, { press, castSlot: (slot: number) => press.castSlot(slot) });
}

/** The same harness with an EMPTY bar, so castCrossHotbarAction takes the
 *  no-slot fallback and aim identity resolves by ability id. */
function makeXhbOnlyHud(options: GroundAimRigOptions = {}): GroundAimHarness & {
  hotbarActions: unknown[];
  castCrossHotbarAction(action: { type: 'ability' | 'item'; id: string }): void;
} {
  const hud = makeHud(options);
  hud.actionForSlot = () => null;
  // The slot scan reads the bar length through the host (Hud's hotbarActions
  // accessor over its action bar controller).
  return Object.assign(hud, {
    hotbarActions: [],
    castCrossHotbarAction: (action: { type: 'ability' | 'item'; id: string }) =>
      hud.press.castCrossHotbarAction(action),
  });
}

describe('ground aim press behavior', () => {
  it('enters precise touch aim for every non-self-centered position ability', () => {
    const positionAbilities = Object.values(ABILITIES).filter(
      (def) => def.targetMode === 'position' && !def.selfCentered,
    );

    expect(positionAbilities.length).toBeGreaterThan(1);
    for (const abilityDef of positionAbilities) {
      const hud = makeHud({ abilityDef, mobileTouch: true, touchPrecise: true });

      hud.castSlot(3);

      expect(hud.groundAim.activeAbilityId()).toBe(abilityDef.id);
      expect(hud.sim.castAbilityAt).not.toHaveBeenCalled();
    }
  });

  it('quick touch mode casts at the smart seed without entering aim', () => {
    const hud = makeHud({ mobileTouch: true, touchPrecise: false });

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 0, z: 15 });
  });

  it('desktop reticle-off casting keeps the target-feet fallback', () => {
    const target = entity(2, 12, 0);
    const hud = makeHud({ target, attackable: false, desktopPreference: false });

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 12, z: 0 });
  });

  it('desktop same-slot re-press commits the active aim', () => {
    const hud = makeHud();
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 9, z: 4 });

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 9, z: 4 });
  });

  it('seeds an attackable selected target clamped to range', () => {
    const target = entity(2, 50, 0);
    const hud = makeHud({ target, attackable: true });

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(true);
    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 30, z: 0 });
  });

  it('seeds ahead at half range when there is no selected target', () => {
    const hud = makeHud();

    hud.castSlot(3);

    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 0, z: 15 });
    expect(hud.groundAim.rawAimPoint()).not.toEqual({ x: 0, z: 0 });
  });

  it('seeds ahead when the selected target is not attackable', () => {
    const hud = makeHud({ target: entity(2, 12, 0), attackable: false });

    hud.castSlot(3);

    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 0, z: 15 });
  });

  it('uses the live selected target when the attackability hook is absent', () => {
    const target = entity(2, 12, 0);
    const hud = makeHud({ target });
    hud.optionsHooks = null;

    hud.castSlot(3);

    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 12, z: 0 });
  });

  it('seeds ahead when the selected target is dead', () => {
    const target = entity(2, 12, 0);
    target.dead = true;
    const hud = makeHud({ target, attackable: true });

    hud.castSlot(3);

    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 0, z: 15 });
  });

  it('seeds ahead when the selected target is the player', () => {
    const player = entity(1, 0, 0);
    player.targetId = player.id;
    const hud = makeHud({ player, attackable: true });

    hud.castSlot(3);

    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 0, z: 15 });
  });

  it('casts immediately instead of entering aim while on cooldown', () => {
    const target = entity(2, 12, 0);
    const hud = makeHud({ target, attackable: true });
    hud.sim.player.cooldowns.set('flamestrike', 4);

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 12, z: 0 });
  });

  it('reads the resolved cooldown key before entering aim', () => {
    const hud = makeHud({ cooldownId: 'shared_clock' });
    hud.sim.player.cooldowns.set('shared_clock', 4);

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledOnce();
  });

  it('uses the smart seed for the mobile cooldown fallback', () => {
    const hud = makeHud({ mobileTouch: true });
    hud.sim.player.cooldowns.set('flamestrike', 4);

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 0, z: 15 });
  });

  it('enters aim when Forbidden Reflection bypasses the running cooldown', () => {
    const hud = makeHud();
    hud.sim.player.cooldowns.set('flamestrike', 4);
    hud.sim.player.auras.push({
      id: 'wlk_forbidden_reflection',
      name: 'Forbidden Reflection',
      kind: 'internal_cd',
      remaining: 5,
      duration: 5,
      value: 0,
      sourceId: hud.sim.player.id,
      school: 'shadow',
      empowerAbilities: ['flamestrike'],
    });

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(true);
    expect(hud.sim.castAbilityAt).not.toHaveBeenCalled();
  });

  it('casts immediately instead of entering aim while dead', () => {
    const hud = makeHud({ mobileTouch: true });
    hud.sim.player.dead = true;

    hud.castSlot(3);

    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 0, z: 15 });
  });

  it('marks a point inside the authored minimum range blocked, not dimmed', () => {
    const hud = makeHud({ minRange: 8 });
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 3, z: 0 });

    const reticle = hud.groundAimReticle();

    expect(reticle?.point).toEqual({ x: 3, z: 0 });
    expect(reticle?.blocked).toBe(true);
    expect(reticle?.dimmed).toBe(false);
  });

  it('leaves an unclamped point at the minimum-range boundary unblocked', () => {
    const hud = makeHud({ minRange: 8 });
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 8, z: 0 });

    const reticle = hud.groundAimReticle();

    expect(reticle?.point).toEqual({ x: 8, z: 0 });
    expect(reticle?.blocked).toBe(false);
    expect(reticle?.dimmed).toBe(false);
  });

  it('re-clamps the raw point from the player current position', () => {
    const hud = makeHud();
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 100, z: 0 });
    hud.sim.player.pos.x = -50;

    const reticle = hud.groundAimReticle();

    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 100, z: 0 });
    expect(reticle?.point).toEqual({ x: -20, z: 0 });
    expect(reticle?.dimmed).toBe(true);
  });

  it('leashes a pad nudge to the ability range edge', () => {
    const hud = makeHud({ range: 30 });
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 0, z: 0 });

    hud.nudgeGroundAimPoint(100, 0);

    expect(hud.groundAim.rawAimPoint()).toEqual({ x: 30, z: 0 });
    expect(hud.groundAimReticle()?.point).toEqual({ x: 30, z: 0 });
  });

  it('nudges and clamps from the live player position', () => {
    const hud = makeHud({ range: 30 });
    hud.sim.player.pos.x = 40;
    hud.sim.player.pos.z = -10;
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 40, z: -10 });

    hud.nudgeGroundAimPoint(-100, 100);

    const distance = Math.hypot(
      (hud.groundAim.rawAimPoint()?.x ?? 0) - hud.sim.player.pos.x,
      (hud.groundAim.rawAimPoint()?.z ?? 0) - hud.sim.player.pos.z,
    );
    expect(distance).toBeCloseTo(30);
    expect(hud.groundAimReticle()?.point).toEqual(hud.groundAim.rawAimPoint());
  });

  it('exposes the active range and commits through the pad entry point', () => {
    const hud = makeHud({ range: 30 });
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 10, z: 5 });

    expect(hud.groundAimAbilityRange()).toBe(30);
    expect(hud.commitGroundAim()).toBe(true);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 10, z: 5 });
    expect(hud.groundAimAbilityRange()).toBeNull();
  });

  it('commits the same live clamp shown by the reticle', () => {
    const hud = makeHud();
    hud.castSlot(3);
    hud.updateGroundAimPoint({ x: 100, z: 0 });
    hud.sim.player.pos.x = -50;
    const shown = hud.groundAimReticle();

    hud.commitGroundAimAt();

    expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', shown?.point);
    expect(hud.isGroundAimActive()).toBe(false);
  });

  describe('XHB-only aim identity', () => {
    it('enters aim under the sentinel slot for a pad-only position ability', () => {
      const hud = makeXhbOnlyHud();

      hud.castCrossHotbarAction({ type: 'ability', id: 'flamestrike' });

      expect(hud.groundAim.activeAbilityId()).toBe('flamestrike');
      expect(hud.groundAim.activeSlot()).toBe(XHB_ONLY_AIM_SLOT);
      expect(hud.sim.castAbilityAt).not.toHaveBeenCalled();
    });

    it('commits on a same-cell re-press by ability id', () => {
      const hud = makeXhbOnlyHud();

      hud.castCrossHotbarAction({ type: 'ability', id: 'flamestrike' });
      hud.castCrossHotbarAction({ type: 'ability', id: 'flamestrike' });

      expect(hud.isGroundAimActive()).toBe(false);
      expect(hud.sim.castAbilityAt).toHaveBeenCalledTimes(1);
      expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 0, z: 15 });
    });

    it('quick mode still casts at a point, never a plain castAbility', () => {
      const hud = makeXhbOnlyHud({ mobileTouch: true, touchPrecise: false });

      hud.castCrossHotbarAction({ type: 'ability', id: 'flamestrike' });

      expect(hud.isGroundAimActive()).toBe(false);
      expect(hud.sim.castAbilityAt).toHaveBeenCalledWith('flamestrike', { x: 0, z: 15 });
    });
  });

  describe('placement projection', () => {
    it('returns the world-projected placement dimmed through the press harness', () => {
      const groundAimPlacementPreview = vi.fn((id: string, point: AimPoint) =>
        id === 'heroic_leap' ? { x: point.x + 3, z: point.z - 6 } : point,
      );
      const hud = makeHud({
        abilityDef: ABILITIES.heroic_leap,
        groundAimPlacementPreview,
      });

      hud.castSlot(3);
      hud.updateGroundAimPoint({ x: 0, z: 20 });

      const reticle = hud.groundAimReticle();
      expect(groundAimPlacementPreview).toHaveBeenCalledWith('heroic_leap', { x: 0, z: 20 });
      expect(reticle?.point).toEqual({ x: 3, z: 14 });
      expect(reticle?.dimmed).toBe(true);
    });

    it('paints the projected landing dimmed while committing the clamped aim', () => {
      const castAt = vi.fn();
      const controller = new GroundAimController({
        player: () => entity(1, 0, 0),
        resolveAbility: () => ({
          def: { id: 'heroic_leap', range: 30, school: 'physical' },
          effects: [],
        }),
        seedTargetPoint: () => null,
        fallbackPoint: () => ({ x: 0, z: 0 }),
        castAt,
        clearReticle: vi.fn(),
        projectPlacement: (id, point) =>
          id === 'heroic_leap' ? { x: point.x, z: point.z - 6 } : point,
      });

      controller.begin('heroic_leap', 3);
      controller.updatePoint({ x: 0, z: 20 });

      const reticle = controller.reticle();
      expect(reticle?.point).toEqual({ x: 0, z: 14 });
      expect(reticle?.dimmed).toBe(true);

      controller.commitAt();
      expect(castAt).toHaveBeenCalledWith('heroic_leap', { x: 0, z: 20 });
    });

    it('leaves an unadjusted ability bright at its own point', () => {
      const controller = new GroundAimController({
        player: () => entity(1, 0, 0),
        resolveAbility: () => ({
          def: { id: 'flamestrike', range: 30, school: 'fire' },
          effects: [],
        }),
        seedTargetPoint: () => null,
        fallbackPoint: () => ({ x: 0, z: 0 }),
        castAt: vi.fn(),
        clearReticle: vi.fn(),
        projectPlacement: (_id, point) => point,
      });

      controller.begin('flamestrike', 3);
      controller.updatePoint({ x: 0, z: 20 });

      const reticle = controller.reticle();
      expect(reticle?.point).toEqual({ x: 0, z: 20 });
      expect(reticle?.dimmed).toBe(false);
    });
  });
});

describe('Hud ground aim source wiring', () => {
  it('delegates placement projection to the world seam', () => {
    const source = readFileSync(join(process.cwd(), 'src/ui/hud.ts'), 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

    expect(code).toContain(
      'projectPlacement: (id, point) => this.sim.groundAimPlacementPreview(id, point)',
    );
  });
});
