// @vitest-environment jsdom

// The pet action bar's DOM half (src/ui/hud/pet_bar/pet_bar_controller.ts),
// driven over a fake PetBarHost. The cases under "the Warlock pet signature
// bar" moved here whole from tests/pet_action_bar_hud.test.ts, which drove the
// same code as Hud.renderPetBar on a bare Hud.prototype rig (and paid the
// coordinator import for it); their bodies are unchanged. The harness keeps the
// old rig's member names: `renderPetBar` is the controller's render and
// `petModeMenuOpen` its stance-menu toggle. The pure half is
// tests/pet_bar_view.test.ts.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PetBarController, type PetBarHost } from '../src/ui/hud/pet_bar';
import { t, tPlural } from '../src/ui/i18n';
import { makeWriterFacet } from '../src/ui/painter_host';
import { hudDeclares, interfaceMembers } from './helpers/hud_host_weld';
import { stripComments } from './helpers/strip_comments';

vi.mock('../src/game/audio', () => ({
  audio: { click: vi.fn() },
}));
// A pass-through t() that records its keys, so the cooldown case can tell the
// catalog key from a concatenation that renders the same English.
const tCalls = vi.hoisted(() => vi.fn());
vi.mock('../src/ui/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/ui/i18n')>();
  const recordingT: typeof actual.t = (key, values) => {
    tCalls(key, values);
    return actual.t(key, values);
  };
  return { ...actual, t: recordingT };
});
// Additive, never bare (the reliquary_window_behavior lesson): the canvas
// resolvers stay stubbed; every export the factory does not name passes
// through.
vi.mock('../src/ui/icons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/ui/icons')>()),
  iconDataUrl: (kind: string, id: string) => `mock:${kind}:${id}`,
  QUALITY_COLOR: {},
  raidMarkerDataUrl: vi.fn(() => ''),
  auraImageUrl: vi.fn(() => null),
  cachedProceduralIconDataUrl: vi.fn((kind: string, id: string) => `mock:${kind}:${id}`),
  hasAbilityIconIdentity: vi.fn(() => false),
  hasAuraImageIdentity: vi.fn(() => false),
  hasAuraRecipe: vi.fn(() => false),
  proceduralIconDataUrl: vi.fn((kind: string, id: string) => `mock:${kind}:${id}`),
}));

type PetTemplateId = 'emberkin' | 'forest_wolf' | 'gloomshade' | 'water_elemental';
type PetOwnerClass = 'hunter' | 'mage' | 'warlock';

interface PetBarHarness {
  sim: {
    cfg: { playerClass: PetOwnerClass };
    entities: Map<number, Record<string, unknown>>;
    playerId: number;
    inventory: { itemId: string; count: number }[];
    petSpecialCommandsSupported: boolean;
    petAttack: ReturnType<typeof vi.fn>;
    petSpecial: ReturnType<typeof vi.fn>;
    petTaunt: ReturnType<typeof vi.fn>;
    petWaterJet: ReturnType<typeof vi.fn>;
    healPet: ReturnType<typeof vi.fn>;
    setPetAutoSpecial: ReturnType<typeof vi.fn>;
    setPetAutoTaunt: ReturnType<typeof vi.fn>;
    setPetAutoWaterJet: ReturnType<typeof vi.fn>;
    setPetMode: ReturnType<typeof vi.fn>;
  };
  /** The controller's stance-menu toggle (private state, reached for the rig). */
  petModeMenuOpen: boolean;
  peekGuard: { consume(): boolean };
  attachTooltip: ReturnType<typeof vi.fn>;
  hideTooltip: ReturnType<typeof vi.fn>;
  openBagsForFeed: ReturnType<typeof vi.fn>;
  showError: ReturnType<typeof vi.fn>;
  /** PetBarController.render. */
  renderPetBar(pet: unknown): void;
  controller: PetBarController;
}

function pointerEvent(type: string): Event {
  const event = new MouseEvent(type, { bubbles: true, clientX: 10, clientY: 10 });
  Object.defineProperties(event, {
    pointerId: { value: 7 },
    pointerType: { value: 'touch' },
  });
  return event;
}

function makeHud(
  templateId: PetTemplateId,
  capability = true,
  petState: {
    hp?: number;
    maxHp?: number;
    petAutoSkill?: boolean;
    petMode?: 'passive' | 'defensive' | 'aggressive';
    petSkillTimer?: number;
  } = {},
  ownerClass: PetOwnerClass = 'warlock',
): PetBarHarness {
  const owner = { id: 1, kind: 'player', ownerId: null, auras: [] };
  const pet = {
    id: 2,
    kind: 'mob',
    ownerId: 1,
    templateId,
    dead: false,
    auras: [],
    hp: 100,
    maxHp: 100,
    petMode: 'defensive',
    petTauntTimer: 0,
    petAutoTaunt: true,
    petSkillTimer: 0,
    petAutoSkill: true,
    ...petState,
  };
  const host = {
    sim: {
      cfg: { playerClass: ownerClass },
      entities: new Map<number, Record<string, unknown>>([
        [1, owner],
        [2, pet],
      ]),
      playerId: 1,
      // One edible stack, so the Heal Pet food check passes (the old rig
      // stubbed hasPetFood to true; the check is bagsHoldPetFood now).
      inventory: [{ itemId: 'baked_bread', count: 1 }],
      petSpecialCommandsSupported: capability,
      petAttack: vi.fn(),
      petSpecial: vi.fn(),
      petTaunt: vi.fn(),
      petWaterJet: vi.fn(),
      healPet: vi.fn(),
      setPetAutoSpecial: vi.fn(),
      setPetAutoTaunt: vi.fn(),
      setPetAutoWaterJet: vi.fn(),
      setPetMode: vi.fn(),
    },
    peekGuard: { consume: () => false },
    attachTooltip: vi.fn(),
    hideTooltip: vi.fn(),
    openBagsForFeed: vi.fn(),
    showError: vi.fn(),
  };
  // The fake host is cast at this one boundary; the controller reads it through
  // PetBarHost, which tsc holds the real Hud to. A private facet per rig: the
  // Hud hands its shared one over in production.
  const writers = makeWriterFacet(
    new Map(),
    new Map(),
    new Map(),
    new Map(),
    () => {},
    () => {},
  );
  const controller = new PetBarController(host as unknown as PetBarHost, writers);
  const menu = controller as unknown as { modeMenuOpen: boolean };
  return Object.defineProperties(host, {
    controller: { value: controller },
    renderPetBar: {
      value: (petArg: unknown) =>
        controller.render(petArg as Parameters<PetBarController['render']>[0]),
    },
    petModeMenuOpen: {
      get: () => menu.modeMenuOpen,
      set: (open: boolean) => {
        menu.modeMenuOpen = open;
      },
    },
  }) as unknown as PetBarHarness;
}

beforeEach(() => {
  document.body.innerHTML = '<div id="petbar"></div>';
  tCalls.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.className = '';
});

describe('Hud Warlock pet signature bar', () => {
  it('shows Emberkin Felbolt as a damage active and never gives Emberkin Taunt', () => {
    const hud = makeHud('emberkin');
    hud.renderPetBar(hud.sim.entities.get(2) ?? null);

    const felbolt = document.querySelector<HTMLButtonElement>('[title="Felbolt"]');
    expect(felbolt).not.toBeNull();
    // Shared socket pins keep pet state and icon structure on the common visual recipe.
    expect(felbolt?.classList.contains('ui-socket')).toBe(true);
    expect(felbolt?.querySelector('.ui-socket-art')).not.toBeNull();
    const stanceMenu = document.querySelector<HTMLButtonElement>('[data-focus-key="stance-menu"]');
    expect(stanceMenu?.classList.contains('ui-socket')).toBe(true);
    expect(stanceMenu?.classList.contains('is-on')).toBe(true);
    expect(
      document.querySelector<HTMLElement>('[data-focus-key="pet_attack"] .icon-label')?.style
        .backgroundImage,
    ).toContain('mock:ability:pet_attack');
    expect(felbolt?.querySelector<HTMLElement>('.icon-label')?.style.backgroundImage).toContain(
      'mock:ability:emberkin_felbolt',
    );
    expect(
      document.querySelector<HTMLElement>('[data-focus-key="pet_mend"] .icon-label')?.style
        .backgroundImage,
    ).toContain('mock:ability:pet_mend');
    expect(
      document.querySelector<HTMLElement>('[data-focus-key="stance-menu"] .icon-label')?.style
        .backgroundImage,
    ).toContain('mock:ability:pet_defensive');
    expect(document.querySelector('[title="Taunt"]')).toBeNull();
    expect(felbolt?.getAttribute('aria-description')).toBe(
      'Autocast on. Right-click, touch-hold, or press Shift+Enter to turn it off.',
    );
    expect(felbolt?.hasAttribute('aria-pressed')).toBe(false);

    felbolt?.click();
    expect(hud.sim.petSpecial).toHaveBeenCalledTimes(1);

    felbolt?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(hud.sim.setPetAutoSpecial).toHaveBeenCalledWith(false);

    felbolt?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }),
    );
    expect(hud.sim.setPetAutoSpecial).toHaveBeenCalledTimes(2);
    felbolt?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        repeat: true,
        bubbles: true,
      }),
    );
    expect(hud.sim.setPetAutoSpecial).toHaveBeenCalledTimes(2);
  });

  it('shows Duskmurk Chain and Taunt, including touch-hold autocast control', () => {
    vi.useFakeTimers();
    document.body.classList.add('mobile-touch');
    const hud = makeHud('gloomshade');
    hud.renderPetBar(hud.sim.entities.get(2) ?? null);

    const chain = document.querySelector<HTMLButtonElement>('[title="Abyssal Chain"]');
    expect(chain).not.toBeNull();
    expect(chain?.querySelector<HTMLElement>('.icon-label')?.style.backgroundImage).toContain(
      'mock:ability:gloomshade_abyssal_chain',
    );
    expect(document.querySelector('[title="Taunt"]')).not.toBeNull();

    chain?.dispatchEvent(pointerEvent('pointerdown'));
    vi.advanceTimersByTime(2100);
    expect(hud.sim.setPetAutoSpecial).toHaveBeenCalledWith(false);
    chain?.dispatchEvent(pointerEvent('pointerup'));
    chain?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(hud.sim.petSpecial).not.toHaveBeenCalled();
  });

  it('renders all eight synthetic command identities into their live button branches', () => {
    const expectIcon = (selector: string, id: string): void => {
      expect(document.querySelector<HTMLElement>(selector)?.style.backgroundImage, id).toContain(
        `mock:ability:${id}`,
      );
    };

    const mage = makeHud('water_elemental', true, { hp: 50, maxHp: 100 }, 'mage');
    mage.renderPetBar(mage.sim.entities.get(2) ?? null);
    expectIcon('[data-focus-key="pet_attack"] .icon-label', 'pet_attack');
    expectIcon('[data-focus-key="pet_water_jet"] .icon-label', 'pet_water_jet');
    expectIcon('[data-focus-key="pet_feed"] .icon-label', 'pet_feed');

    document.body.innerHTML = '<div id="petbar"></div>';
    const hunter = makeHud(
      'forest_wolf',
      true,
      { hp: 50, maxHp: 100, petMode: 'aggressive' },
      'hunter',
    );
    hunter.petModeMenuOpen = true;
    hunter.renderPetBar(hunter.sim.entities.get(2) ?? null);
    expectIcon('[data-focus-key="pet_growl"] .icon-label', 'pet_growl');
    expectIcon('[data-focus-key="stance-passive"] .icon-label', 'pet_passive');
    expectIcon('[data-focus-key="stance-defensive"] .icon-label', 'pet_defensive');
    expectIcon('[data-focus-key="stance-aggressive"] .icon-label', 'pet_aggressive');

    document.body.innerHTML = '<div id="petbar"></div>';
    const warlock = makeHud('emberkin');
    warlock.renderPetBar(warlock.sim.entities.get(2) ?? null);
    expectIcon('[data-focus-key="pet_mend"] .icon-label', 'pet_mend');
  });

  it('renders cooldown as inert and toggles an initially disabled autocast on', () => {
    const hud = makeHud('emberkin', true, { petSkillTimer: 7.2, petAutoSkill: false });
    hud.renderPetBar(hud.sim.entities.get(2) ?? null);

    const felbolt = document.querySelector<HTMLButtonElement>('[title="Felbolt"]');
    expect(felbolt?.classList.contains('cooldown')).toBe(true);
    expect(felbolt?.querySelector('.cdtext')?.textContent).toBe('8');
    expect(felbolt?.getAttribute('aria-label')).toBe('Felbolt, 8 seconds remaining');
    // The label is one catalog key with named values, never a concatenation.
    expect(tCalls).toHaveBeenCalledWith('hudChrome.petBarButton.cooldownAria', {
      name: 'Felbolt',
      remaining: tPlural('hudChrome.plurals.secondsRemaining', 8),
    });
    expect(felbolt?.getAttribute('aria-description')).toBe(
      'Autocast off. Right-click, touch-hold, or press Shift+Enter to turn it on.',
    );

    felbolt?.click();
    expect(hud.sim.petSpecial).not.toHaveBeenCalled();
    felbolt?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(hud.sim.setPetAutoSpecial).toHaveBeenCalledWith(true);
  });

  it('fails closed and hides signature buttons without negotiated server support', () => {
    const emberkin = makeHud('emberkin', false);
    emberkin.renderPetBar(emberkin.sim.entities.get(2) ?? null);
    expect(document.querySelector('[title="Felbolt"]')).toBeNull();
    expect(document.querySelector('[title="Taunt"]')).toBeNull();

    document.body.innerHTML = '<div id="petbar"></div>';
    const gloomshade = makeHud('gloomshade', false);
    gloomshade.renderPetBar(gloomshade.sim.entities.get(2) ?? null);
    expect(document.querySelector('[title="Abyssal Chain"]')).toBeNull();
    expect(document.querySelector('[title="Taunt"]')).not.toBeNull();
  });

  it('restores the same action focus across a cooldown repaint', () => {
    const hud = makeHud('emberkin');
    hud.renderPetBar(hud.sim.entities.get(2) ?? null);
    const first = document.querySelector<HTMLButtonElement>('[title="Felbolt"]');
    first?.focus();

    const pet = hud.sim.entities.get(2);
    if (!pet) throw new Error('Missing pet fixture.');
    pet.petSkillTimer = 7.2;
    hud.renderPetBar(hud.sim.entities.get(2) ?? null);

    const replacement = document.querySelector<HTMLButtonElement>('[title="Felbolt"]');
    expect(document.activeElement).toBe(replacement);
    expect(replacement?.dataset.focusKey).toBe('emberkin_felbolt');
    expect(replacement?.dataset.suppressFocusTooltip).toBe('true');
  });

  it('keeps commanding surviving Necromancy summons after Graveguard dies (issue: pet bar vanishes)', () => {
    const hud = makeHud('emberkin', true, {}, 'warlock');
    // Graveguard has died and unraveled off the roster (pet/mob/locomotion.ts
    // despawnPet after its corpse timer), so the primary-pet resolver now
    // returns null, exactly as findOwnPet would. A Skeletal Warrior the same
    // cast raised is still alive and fighting.
    hud.sim.entities.set(3, {
      id: 3,
      kind: 'mob',
      ownerId: 1,
      templateId: 'necromancy_skeletal_warrior',
      dead: false,
      auras: [],
      hp: 40,
      maxHp: 40,
      petMode: 'aggressive',
    });

    hud.renderPetBar(null);

    const bar = document.getElementById('petbar');
    expect(bar?.style.display).not.toBe('none');
    const attack = document.querySelector<HTMLButtonElement>('[data-focus-key="pet_attack"]');
    expect(attack).not.toBeNull();
    attack?.click();
    expect(hud.sim.petAttack).toHaveBeenCalledTimes(1);

    const stanceMenu = document.querySelector<HTMLButtonElement>('[data-focus-key="stance-menu"]');
    expect(stanceMenu).not.toBeNull();
    expect(document.querySelector<HTMLButtonElement>('[data-focus-key="pet_mend"]')).toBeNull();
  });

  it('still hides the pet bar once every demon is gone', () => {
    const hud = makeHud('emberkin', true, {}, 'warlock');
    hud.sim.entities.delete(2);

    hud.renderPetBar(null);

    expect(document.getElementById('petbar')?.style.display).toBe('none');
  });

  it('rebuilds and hides without touching the movable-frame chrome beside its groups', () => {
    // The pet bar is a HUD frame (HUD_FRAME_SPECS 'petBar'): MovableFrame
    // mints its corner button, grip, name chip and edge glow as DIRECT
    // children of #petbar, so the rebuild and the hide path may wipe only
    // the .petbar-group children, never bar.innerHTML.
    const CHROME = ['tf-move-btn', 'mf-resize-grip', 'tf-frame-label', 'tf-edge-glow'];
    const bar = document.getElementById('petbar') as HTMLElement;
    for (const cls of CHROME) {
      const el = document.createElement(cls === 'tf-frame-label' ? 'span' : 'button');
      el.className = cls;
      bar.appendChild(el);
    }
    const hud = makeHud('emberkin');
    hud.renderPetBar(hud.sim.entities.get(2) ?? null);
    expect(bar.querySelectorAll('.petbar-group')).toHaveLength(2);
    // A signature change rebuilds the groups in place.
    hud.petModeMenuOpen = true;
    hud.renderPetBar(hud.sim.entities.get(2) ?? null);
    expect(bar.querySelectorAll('.petbar-group')).toHaveLength(2);
    // Dismissed pet: the groups go, the chrome stays.
    hud.sim.entities.delete(2);
    hud.renderPetBar(null);
    expect(bar.style.display).toBe('none');
    expect(bar.querySelectorAll('.petbar-group')).toHaveLength(0);
    for (const cls of CHROME) {
      expect(bar.querySelector(`.${cls}`), cls).not.toBeNull();
    }
  });

  it('keeps a non-colour autocast cue in forced-colors mode', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/hud.css'), 'utf8');
    const forcedColors = css.slice(
      css.indexOf('@media (forced-colors: active)', css.indexOf('.pet-btn.autocast')),
      css.indexOf('.pet-btn.cooldown', css.indexOf('.pet-btn.autocast')),
    );
    expect(forcedColors).toContain('.pet-btn.autocast');
    expect(forcedColors).toContain('outline: 3px double Highlight');
    expect(forcedColors).toContain('content: "↻"');
  });
});

describe('PetBarController: the latch, the presses and the host seam', () => {
  const groups = () => [...document.querySelectorAll('#petbar .petbar-group')];

  it('holds a steady frame on its signature, and invalidate() forces exactly one rebuild', () => {
    const hud = makeHud('forest_wolf', true, { hp: 50, maxHp: 100 }, 'hunter');
    const pet = hud.sim.entities.get(2) ?? null;
    hud.renderPetBar(pet);
    const painted = groups();
    expect(painted).toHaveLength(2);
    // An unchanged frame keeps the very same nodes: nothing was rebuilt.
    hud.renderPetBar(pet);
    expect(groups()).toEqual(painted);
    expect(groups()[0]).toBe(painted[0]);
    expect(hud.attachTooltip).toHaveBeenCalledTimes(4);
    // invalidate() is what the language switch calls:
    // the next frame rebuilds, and the one after it holds again.
    hud.controller.invalidate();
    hud.renderPetBar(pet);
    const rebuilt = groups();
    expect(rebuilt[0]).not.toBe(painted[0]);
    expect(hud.attachTooltip).toHaveBeenCalledTimes(8);
    hud.renderPetBar(pet);
    expect(groups()[0]).toBe(rebuilt[0]);
  });

  it('toggles the stance menu, and a picked mode is sent and closes it', () => {
    const hud = makeHud('forest_wolf', true, {}, 'hunter');
    const pet = hud.sim.entities.get(2) ?? null;
    hud.renderPetBar(pet);
    expect(document.querySelector('[data-focus-key="stance-passive"]')).toBeNull();
    document.querySelector<HTMLButtonElement>('[data-focus-key="stance-menu"]')?.click();
    expect(hud.petModeMenuOpen).toBe(true);
    hud.renderPetBar(pet);
    const passive = document.querySelector<HTMLButtonElement>('[data-focus-key="stance-passive"]');
    expect(passive).not.toBeNull();
    // The worn mode is the pressed one of the three.
    expect(
      document.querySelector('[data-focus-key="stance-defensive"]')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(passive?.hasAttribute('aria-pressed')).toBe(false);
    passive?.click();
    expect(hud.sim.setPetMode).toHaveBeenCalledExactlyOnceWith('passive');
    expect(hud.petModeMenuOpen).toBe(false);
    hud.renderPetBar(pet);
    expect(document.querySelector('[data-focus-key="stance-passive"]')).toBeNull();
  });

  it('Heal Pet starts the feed mode, cancels a pending one, and refuses with no food', () => {
    const hud = makeHud('forest_wolf', true, { hp: 50, maxHp: 100 }, 'hunter');
    const pet = hud.sim.entities.get(2) ?? null;
    const feed = () => document.querySelector<HTMLButtonElement>('[data-focus-key="pet_feed"]');
    hud.renderPetBar(pet);
    feed()?.click();
    expect(hud.controller.feedPending).toBe(true);
    expect(hud.openBagsForFeed).toHaveBeenCalledTimes(1);
    // The pending mode joins the signature: the button repaints pressed.
    hud.renderPetBar(pet);
    expect(feed()?.getAttribute('aria-pressed')).toBe('true');
    // A second press ends the mode the bar owns, redraws it unpressed, and
    // opens nothing.
    feed()?.click();
    expect(hud.controller.feedPending).toBe(false);
    expect(hud.openBagsForFeed).toHaveBeenCalledTimes(1);
    hud.renderPetBar(pet);
    expect(feed()?.hasAttribute('aria-pressed')).toBe(false);

    // No food: the button is inert, and a press that still reaches the guard
    // (the bags emptied after the paint) says so instead of starting the mode.
    hud.sim.inventory = [];
    feed()?.click();
    expect(hud.showError).toHaveBeenCalledExactlyOnceWith(t('hud.pet.noPetFood'));
    expect(hud.controller.feedPending).toBe(false);
    expect(hud.openBagsForFeed).toHaveBeenCalledTimes(1);
    hud.renderPetBar(pet);
    expect(feed()?.getAttribute('aria-disabled')).toBe('true');
  });

  it('setFeedPending redraws only on a flip, which is how the bags window ends the mode', () => {
    const hud = makeHud('forest_wolf', true, { hp: 50, maxHp: 100 }, 'hunter');
    const pet = hud.sim.entities.get(2) ?? null;
    hud.renderPetBar(pet);
    const painted = groups();
    // Setting the mode it already holds leaves the latch alone.
    hud.controller.setFeedPending(false);
    hud.renderPetBar(pet);
    expect(groups()[0]).toBe(painted[0]);
    hud.controller.setFeedPending(true);
    hud.renderPetBar(pet);
    const pressed = groups();
    expect(pressed[0]).not.toBe(painted[0]);
    hud.controller.setFeedPending(false);
    hud.renderPetBar(pet);
    expect(groups()[0]).not.toBe(pressed[0]);
    expect(hud.controller.feedPending).toBe(false);
  });

  it('writes the bar display through the elided facet, on the element it resolved once', () => {
    const hud = makeHud('forest_wolf', true, {}, 'hunter');
    const pet = hud.sim.entities.get(2) ?? null;
    const bar = document.getElementById('petbar') as HTMLElement;
    hud.renderPetBar(pet);
    expect(bar.style.display).toBe('flex');
    // A foreign write survives steady frames: nothing rewrites an unchanged value.
    bar.style.display = 'grid';
    hud.renderPetBar(pet);
    hud.renderPetBar(pet);
    expect(bar.style.display).toBe('grid');
    // A real change writes, both ways.
    hud.renderPetBar(null);
    expect(bar.style.display).toBe('none');
    hud.renderPetBar(pet);
    expect(bar.style.display).toBe('flex');
    // The element is not re-queried per frame: a swapped-in #petbar is never read.
    bar.id = '';
    const swapped = document.createElement('div');
    swapped.id = 'petbar';
    document.body.appendChild(swapped);
    hud.renderPetBar(null);
    expect(bar.style.display).toBe('none');
    expect(swapped.style.display).toBe('');
  });

  it('stays welded to the Hud members PetBarHost names, and the Hud builds one over itself', () => {
    const controllerSource = readFileSync(
      resolve(process.cwd(), 'src/ui/hud/pet_bar/pet_bar_controller.ts'),
      'utf8',
    );
    const hudSource = readFileSync(resolve(process.cwd(), 'src/ui/hud.ts'), 'utf8');
    const members = interfaceMembers(controllerSource, 'PetBarHost');
    expect(members).toEqual([
      'sim',
      'peekGuard',
      'openBagsForFeed',
      'showError',
      'hideTooltip',
      'attachTooltip',
    ]);
    for (const member of members) expect(hudDeclares(hudSource, member), member).toBe(true);
    const code = stripComments(hudSource);
    expect(code).toContain('this.petBarState ??= new PetBarController(this, this.writerFacet);');
    // update() drives it with the pet it resolved once for the pet frame.
    expect(code).toContain('this.petBar.render(pet);');
    // Only the language switch invalidates the bar, in any call form; the feed
    // mode is read and ended through the controller, whose signature carries it.
    expect(code).not.toContain('resetPetBarSig');
    expect(code.split('this.petBar.invalidate(').length - 1).toBe(1);
    expect(code).toContain('this.petBar.invalidate();');
    expect(code).toContain('pendingPetFeed: () => this.petBar.feedPending,');
    expect(code).toContain('setPendingPetFeed: (active) => this.petBar.setFeedPending(active),');
    expect(code).toContain('this.petBar.setFeedPending(false);');
  });
});
