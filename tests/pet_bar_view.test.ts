// The pet action bar's pure half (src/ui/hud/pet_bar/pet_bar_view.ts): the
// per-frame facts and repaint signature, the ordered button set a rebuild
// paints, and the Heal Pet food check. DOM-free, so it runs in plain Node; the
// DOM half is tests/pet_bar_controller.test.ts.

import { describe, expect, it, vi } from 'vitest';
import type { Entity, PlayerClass } from '../src/sim/types';
import {
  bagsHoldPetFood,
  newPetBarFacts,
  type PetBarButton,
  type PetBarContext,
  petBarButtons,
  petBarFactsInto,
} from '../src/ui/hud/pet_bar';
import { t } from '../src/ui/i18n';

function petOf(templateId: string, state: Record<string, unknown> = {}): Entity {
  return {
    id: 2,
    kind: 'mob',
    ownerId: 1,
    templateId,
    dead: false,
    auras: [],
    hp: 50,
    maxHp: 100,
    petMode: 'defensive',
    petTauntTimer: 0,
    petAutoTaunt: true,
    petSkillTimer: 0,
    petAutoSkill: true,
    ...state,
  } as unknown as Entity;
}

function ctxOf(ownerClass: PlayerClass, over: Partial<PetBarContext> = {}): PetBarContext {
  return {
    primaryPetShown: true,
    ownerClass,
    specialCommandsSupported: true,
    pendingPetFeed: false,
    modeMenuOpen: false,
    hasPetFood: () => true,
    ...over,
  };
}

const sigOf = (pet: Entity, ctx: PetBarContext): string =>
  petBarFactsInto(newPetBarFacts(), pet, ctx).sig;

const shape = (buttons: readonly PetBarButton[]) =>
  buttons.map((b) => `${b.focusKey}:${b.press.kind}${b.autocastToggle ? '+auto' : ''}`);

describe('petBarFactsInto: the per-frame facts and the repaint signature', () => {
  it('fills the one reused record it is handed, and a real signature is never empty', () => {
    const out = newPetBarFacts();
    const facts = petBarFactsInto(out, petOf('forest_wolf'), ctxOf('hunter'));
    expect(facts).toBe(out);
    expect(facts.sig.startsWith('2:')).toBe(true);
    expect(facts.canTaunt).toBe(true);
    expect(facts.special).toBeNull();
  });

  it('spells the exact signature the Hud latched on, field by field', () => {
    expect(sigOf(petOf('forest_wolf', { petTauntTimer: 2.2 }), ctxOf('hunter'))).toBe(
      '2:primary:hunter:defensive:3:auto:no-special:::ok',
    );
    expect(
      sigOf(
        petOf('water_elemental', { petAutoWaterJet: true, hp: 100 }),
        ctxOf('mage', { pendingPetFeed: true, modeMenuOpen: true }),
      ),
    ).toBe(
      '2:primary:mage:defensive:water-jet:0:auto:no-special:feed:modes:hudChrome.petFeed.disabledFullHp',
    );
    expect(
      sigOf(petOf('emberkin', { petSkillTimer: 7.2, petAutoSkill: false }), ctxOf('warlock')),
    ).toBe('2:primary:warlock:defensive:no-taunt:emberkin_felbolt:8:manual:::');
  });

  it('moves the signature on every value a rebuild reads', () => {
    const pet = petOf('forest_wolf');
    const base = sigOf(pet, ctxOf('hunter'));
    const moved = [
      sigOf(petOf('forest_wolf', { petTauntTimer: 1 }), ctxOf('hunter')),
      sigOf(petOf('forest_wolf', { petAutoTaunt: false }), ctxOf('hunter')),
      sigOf(petOf('forest_wolf', { petMode: 'passive' }), ctxOf('hunter')),
      sigOf(petOf('forest_wolf', { id: 9 }), ctxOf('hunter')),
      sigOf(petOf('forest_wolf', { hp: 100 }), ctxOf('hunter')),
      sigOf(pet, ctxOf('hunter', { hasPetFood: () => false })),
      sigOf(pet, ctxOf('hunter', { pendingPetFeed: true })),
      sigOf(pet, ctxOf('hunter', { modeMenuOpen: true })),
      sigOf(pet, ctxOf('hunter', { primaryPetShown: false })),
      sigOf(pet, ctxOf('mage')),
    ];
    for (const sig of moved) expect(sig).not.toBe(base);
    expect(new Set(moved).size).toBe(moved.length);
    // And a steady frame holds it.
    expect(sigOf(petOf('forest_wolf'), ctxOf('hunter'))).toBe(base);
  });

  it('never reads the bags for a warlock signature (the demon mends, it is not fed)', () => {
    const hasPetFood = vi.fn(() => true);
    sigOf(petOf('emberkin'), ctxOf('warlock', { hasPetFood }));
    expect(hasPetFood).not.toHaveBeenCalled();
    sigOf(petOf('forest_wolf'), ctxOf('hunter', { hasPetFood }));
    expect(hasPetFood).toHaveBeenCalledTimes(1);
  });

  it('drops the signature skill without negotiated support', () => {
    const facts = petBarFactsInto(
      newPetBarFacts(),
      petOf('emberkin'),
      ctxOf('warlock', { specialCommandsSupported: false }),
    );
    expect(facts.special).toBeNull();
    expect(facts.sig).toContain(':no-special:');
  });
});

describe('petBarButtons: the ordered button set one rebuild paints', () => {
  const build = (pet: Entity, ctx: PetBarContext) =>
    petBarButtons(pet, ctx, petBarFactsInto(newPetBarFacts(), pet, ctx));

  it('orders each class its commands, with autocast only where the pet can autocast', () => {
    expect(shape(build(petOf('forest_wolf'), ctxOf('hunter')).commands)).toEqual([
      'pet_attack:attack',
      'pet_growl:taunt+auto',
      'pet_feed:feed',
    ]);
    expect(shape(build(petOf('water_elemental'), ctxOf('mage')).commands)).toEqual([
      'pet_attack:attack',
      'pet_water_jet:waterJet+auto',
      'pet_feed:feed',
    ]);
    expect(shape(build(petOf('emberkin'), ctxOf('warlock')).commands)).toEqual([
      'pet_attack:attack',
      'emberkin_felbolt:special+auto',
      'pet_mend:healDemon',
    ]);
    // A Necromancy secondary standing in for a dead demon is fed, not mended.
    const secondary = build(
      petOf('necromancy_skeletal_warrior'),
      ctxOf('warlock', { primaryPetShown: false }),
    ).commands;
    expect(shape(secondary).at(-1)).toBe('pet_feed:feed');
  });

  it('sets each autocast toggle to the opposite of what the rebuild shows', () => {
    const on = build(petOf('emberkin'), ctxOf('warlock')).commands[1];
    expect(on.autocast).toBe(true);
    expect(on.autocastToggle).toEqual({ skill: 'special', enabled: false });
    const off = build(
      petOf('forest_wolf', { petAutoTaunt: false, petTauntTimer: 3 }),
      ctxOf('hunter'),
    ).commands[1];
    expect(off.autocast).toBe(false);
    expect(off.autocastToggle).toEqual({ skill: 'taunt', enabled: true });
    expect(off.cooldownText).toBe('3');
  });

  it('keeps the Heal Pet name and moves the reason into the tooltip, and a pending feed stays pressable', () => {
    const full = build(petOf('forest_wolf', { hp: 100 }), ctxOf('hunter')).commands.at(-1);
    expect(full?.title).toBe(t('hud.pet.healPet'));
    expect(full?.disabled).toBe(true);
    expect(full?.tooltip).toContain(t('hudChrome.petFeed.disabledFullHp'));
    const pending = build(
      petOf('forest_wolf', { hp: 100 }),
      ctxOf('hunter', { pendingPetFeed: true }),
    ).commands.at(-1);
    expect(pending?.active).toBe(true);
    expect(pending?.disabled).toBe(false);
    const ready = build(petOf('forest_wolf'), ctxOf('hunter')).commands.at(-1);
    expect(ready?.disabled).toBe(false);
    expect(ready?.tooltip).toContain(t('hud.pet.healPetDesc'));
  });

  it('shows the stance toggle alone, and the three modes with the worn one pressed while open', () => {
    const closed = build(petOf('forest_wolf', { petMode: 'aggressive' }), ctxOf('hunter')).stances;
    expect(shape(closed)).toEqual(['stance-menu:modeMenu']);
    expect(closed[0].iconId).toBe('pet_aggressive');
    expect(closed[0].active).toBe(true);
    const open = build(
      petOf('forest_wolf', { petMode: 'aggressive' }),
      ctxOf('hunter', { modeMenuOpen: true }),
    ).stances;
    expect(shape(open)).toEqual([
      'stance-menu:modeMenu',
      'stance-passive:setMode',
      'stance-defensive:setMode',
      'stance-aggressive:setMode',
    ]);
    expect(open.map((b) => b.active)).toEqual([true, false, false, true]);
    expect(open[1].press).toEqual({ kind: 'setMode', mode: 'passive' });
  });

  it('builds every tooltip as a title over a description', () => {
    for (const button of build(petOf('water_elemental'), ctxOf('mage')).commands) {
      expect(button.tooltip).toMatch(
        /^<div class="tt-title">.+<\/div><div class="tt-desc">.+<\/div>$/,
      );
    }
  });
});

describe('bagsHoldPetFood: the Heal Pet food check', () => {
  it('needs a counted stack of real, healing food', () => {
    expect(bagsHoldPetFood([{ itemId: 'baked_bread', count: 1 } as never])).toBe(true);
    expect(bagsHoldPetFood([{ itemId: 'baked_bread', count: 0 } as never])).toBe(false);
    expect(bagsHoldPetFood([{ itemId: 'worn_sword', count: 1 } as never])).toBe(false);
    expect(bagsHoldPetFood([{ itemId: 'no_such_item_x', count: 1 } as never])).toBe(false);
    expect(bagsHoldPetFood([])).toBe(false);
  });
});
