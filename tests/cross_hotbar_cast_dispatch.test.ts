// @vitest-environment jsdom

// ActionPressController.pressCrossHotbarAction / releaseCrossHotbarAction, the
// pad's press and release edges, over castCrossHotbarAction, the tap-shaped fire
// (all three extracted from Hud into src/ui/hud/action_bar/action_press_controller.ts;
// the Hud's one-line delegators are driven in tests/hud_coordinator_delegators.test.ts).
// All route back through the slot entry points so a cross-hotbar cast keeps the
// semantics a key press has (reticle, empower, sport tap, mouseover, the
// auto-attack QoL), and the interesting half is what happens when the action is
// NOT on the bar.
//
// The slot search is barSlot-indexed, NOT array-indexed: barSlot 0 is the fixed
// Attack seat and 1..ACTION_BAR_ABILITY_SLOTS are the configurable slots, so a
// loop bounded by the array length silently skips the LAST one. That is the
// off-by-one this file pins, together with the three fallback arms.
//
// The last block pins the other half of the same seam: which ids Hud.syncSlotMap
// hands the pad as newly learnable actions (actionBarEligibleKnownIds; the Hud's
// own hand-off is driven in tests/hud_coordinator_delegators.test.ts).

import { afterEach, describe, expect, it, type Mock, type MockInstance, vi } from 'vitest';
import { CROSS_HOTBAR_ATTACK_ID } from '../src/game/cross_hotbar';
import { ABILITIES } from '../src/sim/data';
import type { AbilityDef } from '../src/sim/types';
import type { EmpowerHold } from '../src/ui/empower_hold_core';
import { ACTION_BAR_ABILITY_SLOTS } from '../src/ui/hud/action_bar/action_bar_layout_core';
import type { ActionPressHost } from '../src/ui/hud/action_bar/action_press_controller';
import { ActionPressController } from '../src/ui/hud/action_bar/action_press_controller';
import { actionBarEligibleKnownIds } from '../src/ui/hud/action_bar/hotbar';
import { tSim } from '../src/ui/sim_i18n';
import { isStanceBarAbilityGroup } from '../src/ui/stance_bar_view';

type Action = { type: 'ability' | 'item'; id: string } | null;

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

interface CastHarness {
  press: ActionPressController;
  sim: {
    castAbility: Mock;
    releaseEmpoweredAbility: Mock;
    known: { def: AbilityDef }[];
    useItem: Mock;
    tradeInfo: unknown;
  };
  castSlot: MockInstance<(barSlot: number) => void>;
  pressSlot: MockInstance<(slot: number) => void>;
  activateFixedAttackSlot: MockInstance<() => void>;
  empowerHold: EmpowerHold;
  flashActionSlot: Mock;
  showError: Mock;
  tryGatherToolUse: Mock;
  renderBags: Mock;
}

/** The real press controller over a host carrying a faithful fake of the action
 *  bar controller's slot contract (the Hud's actionForSlot, isHotbarItemId and
 *  hotbarActions forward to it): barSlot 0 is the Attack seat (null while the
 *  Attack button owns it), barSlot n is the array's index n-1. The three slot
 *  entry points it routes to are stubbed on the controller itself. */
function makeHud(
  opts: {
    bar?: Action[];
    attackSeat?: Action;
    usableItemIds?: readonly string[];
    tradeOpen?: boolean;
    gatherToolHandled?: boolean;
    knownIds?: readonly string[];
  } = {},
): CastHarness {
  document.body.innerHTML = '<div id="bags" style="display:none"></div>';
  const bar = opts.bar ?? Array.from({ length: ACTION_BAR_ABILITY_SLOTS }, () => null);
  const usable = new Set(opts.usableItemIds ?? []);
  // tradeOpen is derived (sim.tradeInfo !== null, the Hud getter), so the open
  // trade is staged the way the real world reports one.
  const sim: CastHarness['sim'] = {
    castAbility: vi.fn(),
    releaseEmpoweredAbility: vi.fn(),
    known: (opts.knownIds ?? []).map((id) => ({ def: ABILITIES[id] })),
    useItem: vi.fn(),
    tradeInfo: opts.tradeOpen ? { items: [] } : null,
  };
  const host = {
    sim,
    hotbarActions: bar,
    actionForSlot: (barSlot: number) =>
      barSlot === 0 ? (opts.attackSeat ?? null) : (bar[barSlot - 1] ?? null),
    isHotbarItemId: (itemId: string) => usable.has(itemId),
    get tradeOpen() {
      return sim.tradeInfo !== null;
    },
    flashActionSlot: vi.fn(),
    showError: vi.fn(),
    tryGatherToolUse: vi.fn(() => opts.gatherToolHandled ?? false),
    renderBags: vi.fn(),
  };
  const press = new ActionPressController(host as unknown as ActionPressHost);
  return {
    press,
    sim,
    castSlot: vi.spyOn(press, 'castSlot').mockImplementation(() => {}),
    pressSlot: vi.spyOn(press, 'pressSlot').mockImplementation(() => {}),
    activateFixedAttackSlot: vi
      .spyOn(press, 'activateFixedAttackSlot')
      .mockImplementation(() => {}),
    empowerHold: press.empowerHold,
    flashActionSlot: host.flashActionSlot,
    showError: host.showError,
    tryGatherToolUse: host.tryGatherToolUse,
    renderBags: host.renderBags,
  };
}

describe('cross hotbar hold routing', () => {
  it('routes an on-bar press through pressSlot at the last bar slot', () => {
    const last = ACTION_BAR_ABILITY_SLOTS - 1;
    const hud = makeHud({ bar: barWith(last, { type: 'ability', id: 'glacial_front' }) });

    hud.press.pressCrossHotbarAction({ type: 'ability', id: 'glacial_front' });

    expect(hud.pressSlot).toHaveBeenCalledExactlyOnceWith(ACTION_BAR_ABILITY_SLOTS);
    expect(hud.sim.castAbility).not.toHaveBeenCalled();
  });

  it('starts an empowered off-bar ability without immediately releasing it', () => {
    const hud = makeHud({ knownIds: ['glacial_front'] });

    const fallback = vi.spyOn(hud.press, 'castCrossHotbarAction');

    hud.press.pressCrossHotbarAction({ type: 'ability', id: 'glacial_front' });

    expect(hud.sim.castAbility).toHaveBeenCalledExactlyOnceWith('glacial_front');
    expect(hud.sim.releaseEmpoweredAbility).not.toHaveBeenCalled();
    expect(hud.empowerHold.active).toBe(true);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('keeps the unchanged fallback for a non-empowered off-bar ability', () => {
    const hud = makeHud({ knownIds: ['defensive_stance'] });
    const fallback = vi.spyOn(hud.press, 'castCrossHotbarAction');

    hud.press.pressCrossHotbarAction({ type: 'ability', id: 'defensive_stance' });

    expect(fallback).toHaveBeenCalledExactlyOnceWith({
      type: 'ability',
      id: 'defensive_stance',
    });
    expect(hud.sim.castAbility).toHaveBeenCalledExactlyOnceWith('defensive_stance');
  });

  it('uses the unchanged fallback for an empowered ability the player does not know', () => {
    const hud = makeHud();
    const fallback = vi.spyOn(hud.press, 'castCrossHotbarAction');

    hud.press.pressCrossHotbarAction({ type: 'ability', id: 'glacial_front' });

    expect(fallback).toHaveBeenCalledExactlyOnceWith({
      type: 'ability',
      id: 'glacial_front',
    });
  });

  it.each([
    { type: 'ability' as const, id: CROSS_HOTBAR_ATTACK_ID },
    { type: 'item' as const, id: 'minor_healing_potion' },
  ])('delegates $type actions unchanged', (action) => {
    const hud = makeHud({ usableItemIds: ['minor_healing_potion'] });
    const fallback = vi.spyOn(hud.press, 'castCrossHotbarAction');

    hud.press.pressCrossHotbarAction(action);

    expect(fallback).toHaveBeenCalledExactlyOnceWith(action);
  });

  it('releases only the matching live empowered ability once', () => {
    const hud = makeHud({ knownIds: ['glacial_front'] });
    hud.press.pressCrossHotbarAction({ type: 'ability', id: 'glacial_front' });

    hud.press.releaseCrossHotbarAction({ type: 'ability', id: 'dragons_breath' });
    expect(hud.sim.releaseEmpoweredAbility).not.toHaveBeenCalled();
    hud.press.releaseCrossHotbarAction({ type: 'ability', id: 'glacial_front' });
    hud.press.releaseCrossHotbarAction({ type: 'ability', id: 'glacial_front' });

    expect(hud.sim.releaseEmpoweredAbility).toHaveBeenCalledExactlyOnceWith('glacial_front');
    expect(hud.flashActionSlot).not.toHaveBeenCalled();
  });

  it('does nothing on release without a live charge', () => {
    const hud = makeHud({ knownIds: ['glacial_front'] });

    hud.press.releaseCrossHotbarAction({ type: 'ability', id: 'glacial_front' });

    expect(hud.sim.releaseEmpoweredAbility).not.toHaveBeenCalled();
  });
});

describe('slot hold routing', () => {
  interface SlotHarness {
    press: ActionPressController;
    empowerHold: EmpowerHold;
    sim: {
      castAbility: Mock;
      releaseEmpoweredAbility: Mock;
    };
    abilityForSlot: Mock;
    castSlot: MockInstance<(barSlot: number) => void>;
    flashActionSlot: Mock;
  }

  /** The real pressSlot and releaseSlot over a host whose slot resolves to an
   *  empowered (or a plain) ability; castSlot is stubbed on the controller. */
  function makeSlotHud(empowered: boolean): SlotHarness {
    const host = {
      sim: {
        castAbility: vi.fn(),
        releaseEmpoweredAbility: vi.fn(),
      },
      abilityForSlot: vi.fn(() =>
        empowered ? { def: ABILITIES.glacial_front } : { def: ABILITIES.defensive_stance },
      ),
      flashActionSlot: vi.fn(),
    };
    const press = new ActionPressController(host as unknown as ActionPressHost);
    return {
      press,
      empowerHold: press.empowerHold,
      sim: host.sim,
      abilityForSlot: host.abilityForSlot,
      castSlot: vi.spyOn(press, 'castSlot').mockImplementation(() => {}),
      flashActionSlot: host.flashActionSlot,
    };
  }

  it('starts and releases an empowered slot through the real press methods', () => {
    const hud = makeSlotHud(true);

    hud.press.pressSlot(4);
    hud.press.pressSlot(4);
    expect(hud.sim.castAbility).toHaveBeenCalledExactlyOnceWith('glacial_front');
    expect(hud.sim.releaseEmpoweredAbility).not.toHaveBeenCalled();
    expect(hud.castSlot).not.toHaveBeenCalled();
    hud.press.releaseSlot(4);

    expect(hud.sim.releaseEmpoweredAbility).toHaveBeenCalledExactlyOnceWith('glacial_front');
    expect(hud.flashActionSlot).toHaveBeenCalledExactlyOnceWith(4);
  });

  it('keeps non-empowered press fallthrough and release no-op behavior', () => {
    const hud = makeSlotHud(false);

    hud.press.pressSlot(4);
    hud.press.releaseSlot(4);

    expect(hud.castSlot).toHaveBeenCalledExactlyOnceWith(4);
    expect(hud.sim.castAbility).not.toHaveBeenCalled();
    expect(hud.sim.releaseEmpoweredAbility).not.toHaveBeenCalled();
    expect(hud.flashActionSlot).not.toHaveBeenCalled();
  });
});

function barWith(index: number, action: Action): Action[] {
  const bar: Action[] = Array.from({ length: ACTION_BAR_ABILITY_SLOTS }, () => null);
  bar[index] = action;
  return bar;
}

describe('castCrossHotbarAction slot routing', () => {
  it('routes an action on the LAST desktop slot through castSlot, not the fallback', () => {
    const last = ACTION_BAR_ABILITY_SLOTS - 1;
    const hud = makeHud({ bar: barWith(last, { type: 'ability', id: 'heroic_strike' }) });

    hud.press.castCrossHotbarAction({ type: 'ability', id: 'heroic_strike' });

    // barSlot, not array index: the last slot is ACTION_BAR_ABILITY_SLOTS itself.
    expect(hud.castSlot).toHaveBeenCalledWith(ACTION_BAR_ABILITY_SLOTS);
    expect(hud.sim.castAbility).not.toHaveBeenCalled();
  });

  it('routes the first desktop slot through castSlot at barSlot 1', () => {
    const hud = makeHud({ bar: barWith(0, { type: 'ability', id: 'rend' }) });

    hud.press.castCrossHotbarAction({ type: 'ability', id: 'rend' });

    expect(hud.castSlot).toHaveBeenCalledWith(1);
  });

  it('matches the Attack seat at barSlot 0 when the player parked an action there', () => {
    const hud = makeHud({ attackSeat: { type: 'ability', id: 'charge' } });

    hud.press.castCrossHotbarAction({ type: 'ability', id: 'charge' });

    expect(hud.castSlot).toHaveBeenCalledWith(0);
  });

  it('never matches a slot the Attack button owns', () => {
    // Attack on: actionForSlot(0) is null even though the array holds an action
    // at index 0, and index 0 is barSlot 1, which must still match on its own.
    const hud = makeHud({ bar: barWith(0, { type: 'ability', id: 'charge' }), attackSeat: null });

    hud.press.castCrossHotbarAction({ type: 'ability', id: 'charge' });

    expect(hud.castSlot).toHaveBeenCalledWith(1);
    expect(hud.castSlot).not.toHaveBeenCalledWith(0);
  });

  it('toggles auto-attack for the Attack action, which no slot can hold', () => {
    const hud = makeHud();

    hud.press.castCrossHotbarAction({ type: 'ability', id: CROSS_HOTBAR_ATTACK_ID });

    expect(hud.activateFixedAttackSlot).toHaveBeenCalledTimes(1);
    expect(hud.castSlot).not.toHaveBeenCalled();
  });

  it('does not confuse an item with an ability of the same id', () => {
    const hud = makeHud({
      bar: barWith(4, { type: 'ability', id: 'shared_id' }),
      usableItemIds: ['shared_id'],
    });

    hud.press.castCrossHotbarAction({ type: 'item', id: 'shared_id' });

    expect(hud.castSlot).not.toHaveBeenCalled();
    expect(hud.sim.useItem).toHaveBeenCalledWith('shared_id');
  });
});

describe('castCrossHotbarAction fallback for an action off the desktop bar', () => {
  it('still casts an ability the bar does not hold', () => {
    const hud = makeHud();

    hud.press.castCrossHotbarAction({ type: 'ability', id: 'defensive_stance' });

    expect(hud.castSlot).not.toHaveBeenCalled();
    expect(hud.sim.castAbility).toHaveBeenCalledWith('defensive_stance');
    expect(hud.showError).not.toHaveBeenCalled();
  });

  it('uses an item the bar does not hold', () => {
    const hud = makeHud({ usableItemIds: ['minor_healing_potion'] });

    hud.press.castCrossHotbarAction({ type: 'item', id: 'minor_healing_potion' });

    expect(hud.castSlot).not.toHaveBeenCalled();
    expect(hud.sim.useItem).toHaveBeenCalledWith('minor_healing_potion');
    expect(hud.showError).not.toHaveBeenCalled();
  });

  it('takes the gathering-tool handler first, exactly as a bar press does', () => {
    const hud = makeHud({ usableItemIds: ['copper_pick'], gatherToolHandled: true });

    hud.press.castCrossHotbarAction({ type: 'item', id: 'copper_pick' });

    expect(hud.tryGatherToolUse).toHaveBeenCalledWith('copper_pick');
    expect(hud.sim.useItem).not.toHaveBeenCalled();
  });

  it('refuses an item the bar cannot use out loud instead of eating the press', () => {
    const hud = makeHud({ usableItemIds: [] });

    hud.press.castCrossHotbarAction({ type: 'item', id: 'rusty_longsword' });

    expect(hud.sim.useItem).not.toHaveBeenCalled();
    expect(hud.showError).toHaveBeenCalledTimes(1);
    const [text] = hud.showError.mock.calls[0] as [string];
    expect(text).toBe(tSim('error.noItem'));
    expect(text).not.toContain('rusty_longsword');
    expect(text.length).toBeGreaterThan(0);
  });

  it('stays silent while a trade window is open', () => {
    const hud = makeHud({ usableItemIds: ['minor_healing_potion'], tradeOpen: true });

    hud.press.castCrossHotbarAction({ type: 'item', id: 'minor_healing_potion' });

    expect(hud.sim.useItem).not.toHaveBeenCalled();
    expect(hud.showError).not.toHaveBeenCalled();
  });
});

// actionBarEligibleKnownIds, the list Hud.syncSlotMap hands the pad mid-session
// ("you learned something new"). Stances are the interesting id: pad mode hides
// the desktop stance bar, so a stance learned after the cross hotbar was seeded
// reaches a controller player ONLY through this offer. The list is filtered by
// action-bar eligibility alone, and a stance-group filter creeping back here would
// silently strand Guarded Stance on a pad again.
describe('actionBarEligibleKnownIds: the known-ability offer to the pad', () => {
  /** The offer for a known list of real content records: what makes an id a
   *  stance is the shipped exclusiveGroup, not a shape the test gets to invent. */
  function offeredIds(knownIds: readonly string[]): string[] {
    return actionBarEligibleKnownIds(knownIds.map((id) => ({ def: ABILITIES[id] })));
  }

  it('offers a stance the pad has no other way to reach', () => {
    expect(isStanceBarAbilityGroup(ABILITIES.defensive_stance.exclusiveGroup)).toBe(true);

    expect(offeredIds(['mortal_strike', 'defensive_stance'])).toContain('defensive_stance');
  });

  it('withholds a passive, which no bar seat can cast', () => {
    expect(ABILITIES.measured_fury.passive).toBe(true);

    expect(offeredIds(['mortal_strike', 'measured_fury'])).toEqual(['mortal_strike']);
  });
});
