// @vitest-environment happy-dom

// ActionPressController (src/ui/hud/action_bar/action_press_controller.ts), the
// press, release and cast paths extracted from Hud. The moved cases stay where
// they were: the cross hotbar trio and the slot hold routing in
// tests/cross_hotbar_cast_dispatch.test.ts, the ground-aim flow in
// tests/ground_aim_hud.test.ts and the furnishing item refusal in
// tests/furnishing_consumer_parity.test.ts; the Hud's one-line delegators run in
// tests/hud_coordinator_delegators.test.ts. This suite holds the arms none of
// them reached (the vehicle gate on every entry point, the fixed Attack toggle,
// the keyboard empowered tap, the mouseover redirect, the auto-attack QoL and
// its timed-cast deferral, the freed Attack seat's refusal, the bar item arm and
// its open-bags repaint, the ground-aimed shock bomb's seat, cooldown and bag
// click) and the weld to the private Hud members it reads.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ABILITIES } from '../src/sim/data';
import type { AbilityDef, Entity } from '../src/sim/types';
import type { ActionPressHost } from '../src/ui/hud/action_bar/action_press_controller';
import { ActionPressController } from '../src/ui/hud/action_bar/action_press_controller';
import { XHB_ONLY_AIM_SLOT } from '../src/ui/hud/action_bar/ground_aim';
import { t } from '../src/ui/i18n';
import { hudDeclares, interfaceMembers } from './helpers/hud_host_weld';
import { stripComments } from './helpers/strip_comments';

// happy-dom replaces the global URL, so the sources are read by path.
const SOURCE = readFileSync(
  join(process.cwd(), 'src/ui/hud/action_bar/action_press_controller.ts'),
  'utf8',
);
const HUD = readFileSync(join(process.cwd(), 'src/ui/hud.ts'), 'utf8');

type BarAction = { type: 'ability' | 'item'; id: string } | null;

interface RigOptions {
  bar?: Record<number, BarAction>;
  abilities?: Record<number, AbilityDef>;
  vehicle?: boolean;
  attackSlotIsAttack?: boolean;
  settings?: Partial<Record<string, boolean>>;
  target?: Partial<Entity>;
  castTarget?: number | null;
  hovered?: number | null;
  freedAttackSlot?: boolean;
  usableItemIds?: readonly string[];
  tradeOpen?: boolean;
  bagsOpen?: boolean;
}

/** The real controller over a plain host shaped like the Hud members it reads
 *  (ActionPressHost). A bar seat resolves to the ability records named in
 *  `abilities`; the player's target is a live hostile mob unless overridden. */
function rig(opts: RigOptions = {}) {
  document.body.innerHTML = `<div id="bags" style="display:${opts.bagsOpen ? 'block' : 'none'}"></div>`;
  const target = opts.target
    ? ({ id: 9, kind: 'mob', dead: false, hostile: true, ...opts.target } as Entity)
    : null;
  const sim = {
    playerId: 1,
    vehicleSession: opts.vehicle ? { vehicleId: 1 } : null,
    player: { id: 1, autoAttack: false, targetId: target ? target.id : null, dead: false },
    entities: new Map(target ? [[target.id, target]] : []),
    known: [],
    castAbility: vi.fn(),
    castAbilityOn: vi.fn(),
    releaseEmpoweredAbility: vi.fn(),
    startAutoAttack: vi.fn(),
    stopAutoAttack: vi.fn(),
    useItem: vi.fn(),
  };
  const usable = new Set(opts.usableItemIds ?? []);
  const host = {
    sim,
    vehicleControls: { chooseSlot: vi.fn() },
    groundAim: { activeSlot: () => null, activeAbilityId: () => null },
    playerGroundAim: { pressPosition: vi.fn() },
    optionsHooks: { settings: { get: (key: string) => opts.settings?.[key] } },
    focusTargets: { castTarget: vi.fn(() => opts.castTarget ?? null) },
    hoveredCastUnit: opts.hovered === undefined ? null : () => opts.hovered ?? null,
    pendingAutoAttackAbilityId: null as string | null,
    hotbarActions: [],
    tradeOpen: opts.tradeOpen ?? false,
    actionForSlot: (slot: number) => opts.bar?.[slot] ?? null,
    abilityForSlot: (slot: number) => {
      const def = opts.abilities?.[slot];
      return def ? { def, effects: def.effects, castTime: def.castTime } : null;
    },
    attackSlotIsAttack: () => opts.attackSlotIsAttack ?? false,
    freedAttackSlotAbility: () =>
      opts.freedAttackSlot ? { def: ABILITIES.charge, cost: 0, known: false } : null,
    isHotbarItemId: (itemId: string) => usable.has(itemId),
    isGroundAimActive: () => false,
    commitGroundAimAt: vi.fn(() => true),
    cancelGroundAim: vi.fn(() => false),
    flashActionSlot: vi.fn(),
    showError: vi.fn(),
    tryGatherToolUse: vi.fn(() => false),
    renderBags: vi.fn(),
  };
  return { host, sim, press: new ActionPressController(host as unknown as ActionPressHost) };
}

const ability = (id: string): BarAction => ({ type: 'ability', id });

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('ActionPressController: the vehicle gate on every entry point', () => {
  it('hands slot presses and casts to the vehicle bar and swallows every other edge', () => {
    const { host, sim, press } = rig({
      vehicle: true,
      bar: { 3: ability('glacial_front') },
      abilities: { 3: ABILITIES.glacial_front },
    });

    press.pressSlot(3);
    press.castSlot(4);
    press.releaseSlot(3);
    press.pressCrossHotbarAction({ type: 'ability', id: 'glacial_front' });
    press.releaseCrossHotbarAction({ type: 'ability', id: 'glacial_front' });
    press.castCrossHotbarAction({ type: 'ability', id: 'defensive_stance' });

    expect(host.vehicleControls.chooseSlot.mock.calls).toEqual([[3], [4]]);
    expect(sim.castAbility).not.toHaveBeenCalled();
    expect(sim.releaseEmpoweredAbility).not.toHaveBeenCalled();
    expect(press.empowerHold.active).toBe(false);
    expect(host.flashActionSlot).not.toHaveBeenCalled();
  });

  it('leaves the vehicle bar alone outside a session (the gate is the session)', () => {
    const { host, sim, press } = rig({
      bar: { 3: ability('glacial_front') },
      abilities: { 3: ABILITIES.glacial_front },
    });

    press.pressSlot(3);

    expect(host.vehicleControls.chooseSlot).not.toHaveBeenCalled();
    expect(sim.castAbility).toHaveBeenCalledExactlyOnceWith('glacial_front');
    expect(press.empowerHold.active).toBe(true);
  });
});

describe('ActionPressController: the fixed Attack seat', () => {
  it('toggles auto-attack from slot 0 and flashes the seat each time', () => {
    const { host, sim, press } = rig({ attackSlotIsAttack: true });

    press.castSlot(0);
    expect(sim.startAutoAttack).toHaveBeenCalledTimes(1);
    expect(sim.stopAutoAttack).not.toHaveBeenCalled();
    sim.player.autoAttack = true;
    press.castSlot(0);

    expect(sim.stopAutoAttack).toHaveBeenCalledTimes(1);
    expect(sim.startAutoAttack).toHaveBeenCalledTimes(1);
    expect(host.flashActionSlot.mock.calls).toEqual([[0], [0]]);
  });

  it('refuses a freed seat whose assigned ability cannot be used, out loud', () => {
    const { host, sim, press } = rig({ bar: { 0: ability('charge') }, freedAttackSlot: true });

    press.castSlot(0);

    expect(host.showError).toHaveBeenCalledExactlyOnceWith(t('abilityUi.tooltip.unavailable'));
    expect(sim.castAbility).not.toHaveBeenCalled();
    expect(sim.startAutoAttack).not.toHaveBeenCalled();
    expect(host.flashActionSlot).not.toHaveBeenCalled();
  });
});

describe('ActionPressController.castSlot: the ability arm', () => {
  it('resolves a keyboard press on an empowered slot as a minimum-charge tap', () => {
    const { host, sim, press } = rig({
      bar: { 2: ability('glacial_front') },
      abilities: { 2: ABILITIES.glacial_front },
    });

    press.castSlot(2);

    expect(sim.castAbility).toHaveBeenCalledExactlyOnceWith('glacial_front');
    expect(sim.releaseEmpoweredAbility).toHaveBeenCalledExactlyOnceWith('glacial_front');
    expect(sim.castAbility.mock.invocationCallOrder[0]).toBeLessThan(
      sim.releaseEmpoweredAbility.mock.invocationCallOrder[0],
    );
    expect(press.empowerHold.active).toBe(false);
    expect(host.flashActionSlot).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('redirects to the mouseover unit, fed the hovered unit and the live setting', () => {
    const { host, sim, press } = rig({
      bar: { 5: ability('flash_heal') },
      abilities: { 5: ABILITIES.flash_heal },
      hovered: 7,
      castTarget: 42,
      settings: { mouseoverCast: false },
    });

    press.castSlot(5);

    expect(host.focusTargets.castTarget).toHaveBeenCalledExactlyOnceWith(
      ABILITIES.flash_heal,
      7,
      false,
    );
    expect(sim.castAbilityOn).toHaveBeenCalledExactlyOnceWith('flash_heal', 42);
    expect(sim.castAbility).not.toHaveBeenCalled();
    expect(host.flashActionSlot).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('casts at the current target when nothing redirects, the mouseover setting defaulting on', () => {
    const { host, sim, press } = rig({
      bar: { 1: ability('sinister_strike') },
      abilities: { 1: ABILITIES.sinister_strike },
    });

    press.castSlot(1);

    expect(host.focusTargets.castTarget).toHaveBeenCalledExactlyOnceWith(
      ABILITIES.sinister_strike,
      null,
      true,
    );
    expect(sim.castAbility).toHaveBeenCalledExactlyOnceWith('sinister_strike');
    expect(sim.castAbilityOn).not.toHaveBeenCalled();
    // The QoL setting is off (unset), so no swing starts.
    expect(sim.startAutoAttack).not.toHaveBeenCalled();
  });

  it('engages auto-attack at once for an instant attack on a live hostile target', () => {
    expect(ABILITIES.sinister_strike.castTime).toBe(0);
    const { host, sim, press } = rig({
      bar: { 1: ability('sinister_strike') },
      abilities: { 1: ABILITIES.sinister_strike },
      settings: { startAttackOnAbilityUse: true },
      target: {},
    });

    press.castSlot(1);

    expect(sim.startAutoAttack).toHaveBeenCalledTimes(1);
    expect(host.pendingAutoAttackAbilityId).toBeNull();
  });

  it('defers a timed cast: it records the id for castStart instead of engaging now', () => {
    expect(ABILITIES.fireball.castTime).toBeGreaterThan(0);
    const { host, sim, press } = rig({
      bar: { 1: ability('fireball') },
      abilities: { 1: ABILITIES.fireball },
      settings: { startAttackOnAbilityUse: true },
      target: {},
    });

    press.castSlot(1);

    expect(sim.castAbility).toHaveBeenCalledExactlyOnceWith('fireball');
    expect(sim.startAutoAttack).not.toHaveBeenCalled();
    expect(host.pendingAutoAttackAbilityId).toBe('fireball');
  });

  it.each([
    { name: 'the setting is off', settings: {}, target: {}, castTarget: null },
    {
      name: 'the target is dead',
      settings: { startAttackOnAbilityUse: true },
      target: { dead: true },
      castTarget: null,
    },
    {
      name: 'the press was redirected',
      settings: { startAttackOnAbilityUse: true },
      target: {},
      castTarget: 42,
    },
  ])('never engages when $name', ({ settings, target, castTarget }) => {
    const { host, sim, press } = rig({
      bar: { 1: ability('sinister_strike') },
      abilities: { 1: ABILITIES.sinister_strike },
      settings,
      target,
      castTarget,
    });

    press.castSlot(1);

    expect(sim.startAutoAttack).not.toHaveBeenCalled();
    expect(host.pendingAutoAttackAbilityId).toBeNull();
    expect(host.flashActionSlot).toHaveBeenCalledExactlyOnceWith(1);
  });
});

describe('ActionPressController.castSlot: the item arm', () => {
  const potion = { type: 'item' as const, id: 'minor_healing_potion' };

  it('uses a hotbar item through the gather-tool check and flashes the seat', () => {
    const { host, sim, press } = rig({ bar: { 4: potion }, usableItemIds: [potion.id] });

    press.castSlot(4);

    expect(host.tryGatherToolUse).toHaveBeenCalledExactlyOnceWith(potion.id);
    expect(sim.useItem).toHaveBeenCalledExactlyOnceWith(potion.id);
    expect(host.renderBags).not.toHaveBeenCalled();
    expect(host.flashActionSlot).toHaveBeenCalledExactlyOnceWith(4);
  });

  it('repaints the bags only while the bags window is open', () => {
    const { host, sim, press } = rig({
      bar: { 4: potion },
      usableItemIds: [potion.id],
      bagsOpen: true,
    });

    press.castSlot(4);

    expect(sim.useItem).toHaveBeenCalledExactlyOnceWith(potion.id);
    expect(host.renderBags).toHaveBeenCalledTimes(1);
  });

  it('stays silent while a trade window is open, and ignores an item it cannot use', () => {
    const trading = rig({ bar: { 4: potion }, usableItemIds: [potion.id], tradeOpen: true });
    trading.press.castSlot(4);
    expect(trading.sim.useItem).not.toHaveBeenCalled();
    expect(trading.host.flashActionSlot).not.toHaveBeenCalled();

    const stale = rig({ bar: { 4: potion } });
    stale.press.castSlot(4);
    expect(stale.sim.useItem).not.toHaveBeenCalled();
    expect(stale.host.showError).not.toHaveBeenCalled();
    expect(stale.host.flashActionSlot).not.toHaveBeenCalled();
  });
});

describe('ActionPressController: the ground-aimed shock bomb (ported from the release Hud)', () => {
  const bomb = { type: 'item' as const, id: 'clockwork_shock_bomb' };
  const withCooldowns = (r: ReturnType<typeof rig>, cooldowns: [string, number][] = []) => {
    (r.sim.player as { cooldowns?: Map<string, number> }).cooldowns = new Map(cooldowns);
    return r;
  };

  it('takes the position press from its bar seat, never the plain item use', () => {
    const { host, sim, press } = withCooldowns(rig({ bar: { 5: bomb }, usableItemIds: [bomb.id] }));

    press.castSlot(5);

    expect(host.playerGroundAim.pressPosition).toHaveBeenCalledExactlyOnceWith(
      bomb.id,
      5,
      true,
      false,
    );
    expect(sim.useItem).not.toHaveBeenCalled();
    expect(host.tryGatherToolUse).not.toHaveBeenCalled();
    expect(host.flashActionSlot).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('reads its own cooldown entry: on cooldown it casts without the reticle', () => {
    const { host, press } = withCooldowns(rig({ bar: { 5: bomb }, usableItemIds: [bomb.id] }), [
      [bomb.id, 3],
    ]);

    press.castSlot(5);

    expect(host.playerGroundAim.pressPosition).toHaveBeenCalledExactlyOnceWith(
      bomb.id,
      5,
      false,
      false,
    );
  });

  it('enters the bag click aim under the pad-only identity, and declines every other item', () => {
    const { host, sim, press } = withCooldowns(rig());

    expect(press.startItemGroundAim('minor_healing_potion')).toBe(false);
    expect(host.playerGroundAim.pressPosition).not.toHaveBeenCalled();
    expect(press.startItemGroundAim(bomb.id)).toBe(true);
    expect(host.playerGroundAim.pressPosition).toHaveBeenCalledExactlyOnceWith(
      bomb.id,
      XHB_ONLY_AIM_SLOT,
      true,
      false,
    );
    expect(sim.useItem).not.toHaveBeenCalled();
  });
});

describe('ActionPressController: the weld to the private Hud members it reads', () => {
  it('every ActionPressHost member is declared on the Hud', () => {
    const members = interfaceMembers(SOURCE, 'ActionPressHost');
    expect(members).toEqual([
      'sim',
      'vehicleControls',
      'groundAim',
      'playerGroundAim',
      'optionsHooks',
      'focusTargets',
      'hoveredCastUnit',
      'pendingAutoAttackAbilityId',
      'hotbarActions',
      'tradeOpen',
      'actionForSlot',
      'abilityForSlot',
      'attackSlotIsAttack',
      'freedAttackSlotAbility',
      'isHotbarItemId',
      'isGroundAimActive',
      'commitGroundAimAt',
      'cancelGroundAim',
      'flashActionSlot',
      'showError',
      'tryGatherToolUse',
      'renderBags',
    ]);
    for (const member of members) expect(hudDeclares(HUD, member), member).toBe(true);
    // The declaration reader has teeth.
    expect(hudDeclares(HUD, 'noSuchHudMemberXyz')).toBe(false);
  });

  it('the Hud builds one controller over itself and reads it from the ring and hold deps', () => {
    const code = stripComments(HUD);
    expect(code).toContain('this.actionPressState ??= new ActionPressController(this);');
    // The vehicle bar's cancel list reaches the controller's own hold.
    expect(code).toContain(
      '  private get empowerHold(): EmpowerHold {\n    return this.actionPress.empowerHold;\n  }',
    );
    const empowered =
      'empoweredAbilityIdForSlot: (slot) => this.actionPress.empoweredAbilityIdForSlot(slot),';
    expect(code.split(empowered).length - 1).toBe(2);
    expect(code).toContain(
      'activateFixedAttackSlot: () => this.actionPress.activateFixedAttackSlot(),',
    );
  });
});
