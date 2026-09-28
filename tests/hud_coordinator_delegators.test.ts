// @vitest-environment happy-dom

// The thin Hud delegators the banner, celebration and chat extractions left
// behind (src/ui/banner_slot.ts, src/ui/hud/chat/chat_log_appender.ts, the
// celebration painters), driven as the REAL Hud methods on a bare
// Hud.prototype rig. The extracted modules have their own suites, and the
// celebration and chat-pane rigs (tests/helpers/celebration_rig.ts,
// tests/helpers/chat_log_deps.ts) copy this wiring rather than running it, so
// this file is where a swapped argument or a rebuilt-per-call deps object in
// src/ui/hud.ts fails:
// - showBanner reaches the slot with its arguments in order, and a bare
//   prototype resolves the slot lazily;
// - showCelebrationBanner and the celebration host forward exactly what the
//   celebration rig forwards;
// - log() threads announceWhenFiltered and plainText into chatLogLine in that
//   order, over one deps object built once and reused;
// - handleEvents drops another player's personal events and hands everything
//   else to renderer.handleEvent (the noticeboard arm is the vehicle), and the
//   gate holds in front of the loot arm too;
// - handleEvents' router pass (the loot and profession event routers) prints
//   the same lines the router rig (tests/helpers/event_router_rig.ts) does;
// - log(), appendChatItemLink() and the lazy profession-surface latch match
//   what the chat-pane and router rigs transcribe, and playEventSfx hands the
//   sfx router the Hud's own cast-loop set;
// - the press entry points (pressSlot, releaseSlot, castSlot and the pad's
//   cross hotbar edges) reach ONE lazily built ActionPressController with their
//   arguments, the ground-aim delegates reach the live aim (the player's, or
//   the vehicle's during a session), the page flip cancels an armed aim first,
//   and syncSlotMap offers the pad what actionBarEligibleKnownIds returns
//   (tests/helpers/ground_aim_rig.ts is the rig tests/ground_aim_hud.test.ts
//   drives the controller over);
// - the shared #confirm-dialog slot's two Hud-only no-choice routes: the Esc
//   route through closeManagedWindow's confirm arm (plus replacement through the
//   real confirmDialog delegator), and the input modal taking the slot through
//   inputDialog (moved from tests/hud_confirm_gates.test.ts; the dialog itself
//   is tests/confirm_dialog_controller.test.ts);
// - the Town Focus panel's Escape / closeAll route: closeManagedWindow's
//   town-focus arm reaches the lazily built TownFocusController, whose bridge
//   the Hud builds over its own FocusManager (moved from
//   tests/town_focus_repaint_gate.test.ts);
// - handleEvents routes a resurrection offer to the lazily built
//   ResurrectionPrompt and prints the respawn line (moved from
//   tests/hud_resurrection_prompt.test.ts; the prompt is
//   tests/resurrection_prompt.test.ts);
// - handleEvents' harvestPreferenceOpen arm holds the pid gate AND the
//   spectator gate (moved from tests/harvest_preference_hud.test.ts);
// - appendChatItemLink threads a copy's instance payload into the link, so a
//   furnishing's forged loot-quality tier never names it (moved from
//   tests/furnishing_tooltip_view.test.ts);
// - cancelPetFeed ends the feed mode on the lazily built pet bar, which owns
//   it (src/ui/hud/pet_bar/, whose own suites are
//   tests/pet_bar_controller.test.ts and tests/pet_bar_view.test.ts).
//
// The window-management cases (closeAll, the managed closes, the map window
// lifecycle, buildActionBar's listeners) live in the sibling coordinator file
// tests/hud_window_coordination.test.ts.
//
// Its own file on purpose: importing the coordinator costs a suite several
// hundred MB (tests/CLAUDE.md, "Test cost"), so these cases are kept out of the
// pure-module suites that pin the extracted halves.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { sfx } from '../src/game/sfx';
import { ABILITIES, ITEMS, ZONES } from '../src/sim/data';
import type { ItemInstancePayload, SimEvent } from '../src/sim/types';
import {
  type BannerShowArgs,
  BannerSlot,
  type BannerVariant,
  celebrationBannerArgs,
} from '../src/ui/banner_slot';
import { ErrorToastController } from '../src/ui/error_toast_controller';
import { FocusManager } from '../src/ui/focus_manager';
import { Hud } from '../src/ui/hud';
import { ActionPressController } from '../src/ui/hud/action_bar/action_press_controller';
import type { AimPoint } from '../src/ui/hud/action_bar/ground_aim';
import type { ChatLogAppendDeps } from '../src/ui/hud/chat/chat_log_appender';
import { PetBarController } from '../src/ui/hud/pet_bar';
import { ProfessionSurfaceRefresh } from '../src/ui/hud/professions/profession_surface_refresh';
import { setLanguage, t } from '../src/ui/i18n';
import { TOWN_FOCUS_COMPONENTS } from '../src/ui/hud/town_focus/town_focus_view';
import { FURNISHING } from './fixtures/furnishing_item';
import { celebrationRig } from './helpers/celebration_rig';
import { chatPane } from './helpers/chat_log_deps';
import { chatLines, eventRouterRig } from './helpers/event_router_rig';
import { seedGroundAimRig } from './helpers/ground_aim_rig';

/** The Hud members these cases call or read, typed off the real public
 *  signatures where one exists; the private ones are named here and reached
 *  through the bare prototype. */
interface DelegatorRig {
  showBanner: Hud['showBanner'];
  showCelebrationBanner: Hud['showCelebrationBanner'];
  log: Hud['log'];
  handleEvents: Hud['handleEvents'];
  celebrationHost(): ReturnType<typeof celebrationRig>['host'];
  chatLogDeps(): ChatLogAppendDeps;
  logNodes(nodes: readonly Node[], color: string): void;
  [field: string]: unknown;
}

const bareHud = (): DelegatorRig => Object.create(Hud.prototype) as DelegatorRig;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="banner"></div>';
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Hud.showBanner: the lazily built #banner slot', () => {
  it('resolves on a bare prototype, builds ONE slot, and paints #banner through it', () => {
    // No field initializer ran on this object, which is exactly what the
    // handleEvents rigs build; an eager slot field left it undefined here.
    const hud = bareHud();
    const banner = document.getElementById('banner') as HTMLElement;
    expect(
      hud.showBanner('Level 2!', true, undefined, 'default', undefined, 2600, null, 'levelup'),
    ).toBe('show');
    expect(banner.textContent).toBe('Level 2!');
    expect(banner.style.opacity).toBe('1');
    // The same slot, so the same R38 queue: a deed behind the live level-up
    // waits its turn instead of replacing it (a rebuilt slot would show it).
    expect(
      hud.showBanner('First Steps', true, undefined, 'deed', undefined, 2600, null, 'deed'),
    ).toBe('queued');
    expect(banner.textContent).toBe('Level 2!');
    const slot = hud.bannerSlot;
    expect(slot).toBeInstanceOf(BannerSlot);
    expect(hud.bannerSlot).toBe(slot);
  });
});

describe('Hud.showBanner and showCelebrationBanner: the argument order into the slot', () => {
  it('showBanner hands all eight arguments to BannerSlot.show in order, and returns its outcome', () => {
    const show = vi.spyOn(BannerSlot.prototype, 'show').mockReturnValue('queued');
    const hud = bareHud();
    // Eight distinct values, so any two swapped positions fail the call match.
    const args: BannerShowArgs = [
      'Stuck? Hold still.',
      false,
      'icon.webp',
      'skill',
      ['line one', 'line two'],
      1234,
      'unstuck',
      'loot',
    ];
    expect(hud.showBanner(...args)).toBe('queued');
    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.calls[0]).toEqual(args);
  });

  it('showCelebrationBanner routes its six arguments through celebrationBannerArgs', () => {
    const show = vi.spyOn(BannerSlot.prototype, 'show').mockReturnValue('show');
    const hud = bareHud();
    hud.showCelebrationBanner('Gatherer', 'deed', 'skill', false, 'crest.webp', 'Mining 50');
    // Spelled out, not only derived: the positions the slot receives.
    expect(show.mock.calls[0]).toEqual([
      'Gatherer',
      false,
      'crest.webp',
      'skill',
      'Mining 50',
      2600,
      null,
      'deed',
    ]);
    hud.showCelebrationBanner('Level 3!', 'levelup');
    expect(show.mock.calls[1]).toEqual(celebrationBannerArgs('Level 3!', 'levelup'));
    expect(show.mock.calls[1]).toEqual([
      'Level 3!',
      true,
      undefined,
      'default',
      undefined,
      2600,
      null,
      'levelup',
    ]);
  });

  it('the celebration rig paints the same banners, on the same clock, as the real Hud', () => {
    // tests/helpers/celebration_rig.ts transcribes showCelebrationBanner, so the
    // two are held together by what their slots PAINT: the real #banner against
    // the rig's element, at every checkpoint of the duration and advance chain
    // (an ambient first, through Hud.showBanner and the rig's own slot).
    const hud = bareHud();
    const rig = celebrationRig();
    const real = document.getElementById('banner') as HTMLElement;
    const paint = (el: HTMLElement) => ({
      html: el.innerHTML,
      classes: el.className,
      opacity: el.style.opacity,
      display: el.style.display,
    });
    const celebration: [string, 'levelup' | 'deed', BannerVariant, boolean, string, string] = [
      'Gatherer',
      'deed',
      'skill',
      false,
      'crest.webp',
      'Mining 50',
    ];
    hud.showBanner('Zone', false, 'art.webp');
    rig.slot.show('Zone', false, 'art.webp');
    hud.showCelebrationBanner(...celebration);
    rig.showCelebrationBanner(...celebration);
    const seen: string[] = [];
    for (const step of [0, 2599, 1, 249, 1, 2600, 250]) {
      vi.advanceTimersByTime(step);
      expect(paint(real), `after +${step}ms`).toEqual(paint(rig.bannerEl));
      seen.push(real.textContent ?? '');
    }
    // Not vacuous: the ambient showed, then the queued celebration took the
    // slot after the fade gap, on both.
    expect(seen).toContain('Zone');
    expect(seen.some((text) => text.includes('Gatherer'))).toBe(true);
  });
});

describe('Hud.celebrationHost: the seam the celebration painters draw through', () => {
  it('forwards every member to the Hud with its arguments in order', () => {
    const hud = bareHud();
    const log = vi.fn();
    const logNodes = vi.fn();
    const showCelebrationBanner = vi.fn();
    const combatAnnouncer = { push: vi.fn() };
    const deedsWindow = { noteUnlocks: vi.fn(), openWithDeed: vi.fn() };
    const reliquaryWindow = { isOpen: false };
    Object.assign(hud, {
      log,
      logNodes,
      showCelebrationBanner,
      combatAnnouncer,
      deedsWindow,
      reliquaryWindow,
    });
    const host = hud.celebrationHost();
    // The same member set the celebration rig builds, so the rig cannot grow
    // or drop a member the real seam lacks.
    expect(Object.keys(host).sort()).toEqual(Object.keys(celebrationRig().host).sort());

    host.log('text', 'var(--gold)');
    expect(log).toHaveBeenCalledWith('text', 'var(--gold)');
    const nodes = [document.createTextNode('n')];
    host.logNodes(nodes, 'var(--gold)');
    expect(logNodes).toHaveBeenCalledWith(nodes, 'var(--gold)');
    host.showCelebrationBanner('Gatherer', 'deed', 'skill', false, 'crest.webp', 'Mining 50');
    expect(showCelebrationBanner).toHaveBeenCalledWith(
      'Gatherer',
      'deed',
      'skill',
      false,
      'crest.webp',
      'Mining 50',
    );
    host.announce('Deed earned');
    expect(combatAnnouncer.push).toHaveBeenCalledWith('Deed earned', expect.any(Number));
    const matchMedia = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValueOnce({ matches: true } as MediaQueryList)
      .mockReturnValueOnce({ matches: false } as MediaQueryList);
    expect(host.reducedMotion()).toBe(true);
    expect(host.reducedMotion()).toBe(false);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(host.deedsWindow).toBe(deedsWindow);
    expect(host.reliquaryWindow).toBe(reliquaryWindow);
  });

  it('Hud.logNodes appends the same line the chat-pane rig transcribes', () => {
    const pane = chatPane();
    const hud = chatHud();
    const ours = document.createElement('span');
    ours.textContent = 'Deed: [First Steps]';
    const theirs = ours.cloneNode(true) as HTMLElement;
    hud.logNodes([ours], 'var(--gold)');
    pane.logNodes([theirs], 'var(--gold)');
    const real = hud.chatLogEl as HTMLElement;
    expect(real.innerHTML).toBe(pane.chatLogEl.innerHTML);
    expect(real.lastElementChild?.getAttribute('data-chan')).toBe('system');
  });
});

/** A bare Hud whose chat pane is real: the fields log() and the cached deps
 *  read, with the channel filter hiding 'guild' lines. */
function chatHud(): DelegatorRig & { chatAnnouncer: { push: ReturnType<typeof vi.fn> } } {
  const hud = bareHud();
  const chatLogEl = document.createElement('div');
  Object.assign(hud, {
    chatLogEl,
    combatLogEl: document.createElement('div'),
    chatTimestamps: false,
    chatClock: '24h',
    chatAnnouncer: { push: vi.fn() },
    hideIfFiltered: (div: HTMLElement, chan: string) => {
      if (chan === 'guild') div.classList.add('chat-hidden');
    },
    attachTooltip: vi.fn(),
    itemTooltip: vi.fn(() => ''),
    maskChat: (text: string) => text,
  });
  return hud as DelegatorRig & { chatAnnouncer: { push: ReturnType<typeof vi.fn> } };
}

describe('Hud.log: announceWhenFiltered then plainText, into chatLogLine', () => {
  const TOKEN_LINE = 'Loot: [[i:minor_healing_potion]]';

  it('a filtered line still announces, and its item token still links (true, false)', () => {
    const hud = chatHud();
    hud.log(TOKEN_LINE, '#fff', undefined, 'guild', true, false);
    const line = (hud.chatLogEl as HTMLElement).lastElementChild as HTMLElement;
    expect(line.classList.contains('chat-hidden')).toBe(true);
    expect(hud.chatAnnouncer.push).toHaveBeenCalledTimes(1);
    expect(line.querySelector('.chat-item-link')).not.toBeNull();
  });

  it('a filtered line stays silent, and a plainText line renders verbatim (false, true)', () => {
    const hud = chatHud();
    hud.log(TOKEN_LINE, '#fff', undefined, 'guild', false, true);
    const line = (hud.chatLogEl as HTMLElement).lastElementChild as HTMLElement;
    expect(line.classList.contains('chat-hidden')).toBe(true);
    expect(hud.chatAnnouncer.push).not.toHaveBeenCalled();
    expect(line.querySelector('.chat-item-link')).toBeNull();
    expect(line.textContent).toContain(TOKEN_LINE);
  });
});

describe('Hud.chatLogDeps: built once and reused for every line', () => {
  it('two lines share one deps object, whose closures still read live state', () => {
    const hud = chatHud();
    // The item-link half is spread in at build time, so counting its builds
    // counts the deps builds through the real log() path.
    const linkDeps = vi.spyOn(
      Hud.prototype as unknown as { chatItemLinkDeps(): unknown },
      'chatItemLinkDeps',
    );
    hud.log('first', '#fff');
    const deps = hud.chatLogDeps();
    hud.chatTimestamps = true;
    hud.log('second', '#fff');
    expect(linkDeps).toHaveBeenCalledTimes(1);
    expect(hud.chatLogDeps()).toBe(deps);
    // Reuse froze nothing: the Show Timestamps flip between the two lines
    // reaches the second one through the cached timestampClock closure.
    const [first, second] = [...(hud.chatLogEl as HTMLElement).children];
    expect(first.querySelector('.chat-ts')).toBeNull();
    expect(second.querySelector('.chat-ts')).not.toBeNull();
  });
});

describe('Hud.handleEvents head: the personal-event gate and the renderer pass-through', () => {
  const NOTICEBOARD = {
    type: 'noticeboard',
    noticeboardId: 'noticeboard_eastbrook',
    boardId: 'eastbrook_noticeboard',
    state: 'empty',
  } as const;

  function eventsHud() {
    const hud = bareHud();
    const handleEvent = vi.fn();
    const openGuildBoard = vi.fn();
    Object.assign(hud, {
      sim: {
        playerId: 17,
        entities: new Map(),
        craftingIdentity: { synced: false },
        craftSkills: {},
        gatheringProficiency: {},
      },
      renderer: { handleEvent },
      playEventSfx: vi.fn(),
      meters: { onEvent: vi.fn() },
      isNythraxisEvent: () => false,
      noticeboardPopup: { show: vi.fn() },
      leaderboardWindow: { openGliderRankings: vi.fn() },
      openGuildBoard,
    });
    return { hud, handleEvent, openGuildBoard };
  }

  it("hands the viewer's own and pid-less events to the renderer, and runs their arm", () => {
    const { hud, handleEvent, openGuildBoard } = eventsHud();
    const own: SimEvent = { ...NOTICEBOARD, pid: 17 };
    hud.handleEvents([own]);
    expect(handleEvent).toHaveBeenCalledTimes(1);
    expect(handleEvent).toHaveBeenCalledWith(own);
    expect(openGuildBoard).toHaveBeenCalledWith('eastbrook_noticeboard');
    const shared: SimEvent = { ...NOTICEBOARD };
    hud.handleEvents([shared]);
    expect(handleEvent).toHaveBeenLastCalledWith(shared);
  });

  it("drops another player's personal event before the renderer or any arm sees it", () => {
    const { hud, handleEvent, openGuildBoard } = eventsHud();
    hud.handleEvents([{ ...NOTICEBOARD, pid: 18 }]);
    expect(handleEvent).not.toHaveBeenCalled();
    expect(openGuildBoard).not.toHaveBeenCalled();
  });
});

// Moved whole from tests/error_toast_controller.test.ts (the loot arm's own
// cases stayed there, over the loot event router): the personal-event gate is
// the coordinator's, so this one needs the real handleEvents.
describe('held loot error toast through the HUD: the personal-event gate', () => {
  const heldText = 'Your bags are full; [[i:greyjaw_hide_boots]] is waiting on the corpse for you.';

  function rig() {
    const el = document.createElement('div');
    // The #banner element the Hud's lazy slot (banner_slot.ts) resolves on its
    // first banner, as the drain tail's celebration observer builds itself.
    const bannerEl = document.createElement('div');
    bannerEl.id = 'banner';
    document.body.append(bannerEl);
    const hud = Object.assign(Object.create(Hud.prototype), {
      sim: {
        playerId: 7,
        player: { name: 'LootTester' },
        craftingIdentity: { synced: false },
        craftSkills: {},
        gatheringProficiency: {},
      },
      renderer: { handleEvent: vi.fn() },
      playEventSfx: vi.fn(),
      meters: { onEvent: vi.fn() },
      isNythraxisEvent: vi.fn(() => false),
      lootRolls: { closeForItem: vi.fn() },
      errorToast: new ErrorToastController(el),
      log: vi.fn(),
    });
    return { el, bannerEl, hud, send: (events: SimEvent[]) => hud.handleEvents(events) };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    setLanguage('en');
    document.body.innerHTML = '<div id="bags" style="display:none"></div>';
    vi.spyOn(audio, 'lootItem').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setLanguage('en');
  });

  it('does not warn for someone else or for a normal successful roll', () => {
    const { el, hud, send } = rig();
    send([{ type: 'loot', text: heldText, pid: 8 }]);
    expect(hud.log).not.toHaveBeenCalled();
    send([{ type: 'loot', text: 'Aaa wins [[i:greyjaw_hide_boots]] (100)', pid: 7 }]);
    expect(el.textContent).toBe('');
    expect(vi.getTimerCount()).toBe(0);
    expect(hud.lootRolls.closeForItem).toHaveBeenCalledTimes(1);
  });
});

describe('Hud.log and Hud.appendChatItemLink: what the chat-pane rig transcribes', () => {
  it('log() appends the same line as the pane, defaults and explicit arguments alike', () => {
    const pane = chatPane();
    const hud = chatHud();
    // The defaults (accent color, the system channel, announce off, links on).
    hud.log('Loot: [[i:minor_healing_potion]]');
    pane.log('Loot: [[i:minor_healing_potion]]');
    // Every argument spelled, on a channel neither filter hides.
    const args = [
      'Plain [[i:minor_healing_potion]]',
      '#fff',
      'seal.webp',
      'party',
      true,
      true,
    ] as const;
    hud.log(...args);
    pane.log(...args);
    const real = hud.chatLogEl as HTMLElement;
    expect(real.children).toHaveLength(2);
    expect(real.innerHTML).toBe(pane.chatLogEl.innerHTML);
    expect(hud.chatAnnouncer.push.mock.calls.map((c) => c[0])).toEqual(
      pane.chatAnnouncer.push.mock.calls.map((c) => c[0]),
    );
    // Not vacuous: the first line linked its token, the second kept it verbatim.
    expect(real.children[0].querySelector('.chat-item-link')).not.toBeNull();
    expect(real.children[1].querySelector('img')).not.toBeNull();
  });

  it('appendChatItemLink mints the same link node as the pane, unknown ids included', () => {
    const pane = chatPane();
    const hud = chatHud() as ReturnType<typeof chatHud> & {
      appendChatItemLink(parent: HTMLElement, itemId: string): void;
    };
    for (const itemId of ['minor_healing_potion', 'no_such_item_x']) {
      const ours = document.createElement('div');
      const theirs = document.createElement('div');
      hud.appendChatItemLink(ours, itemId);
      pane.appendChatItemLink(theirs, itemId);
      expect(ours.innerHTML, itemId).toBe(theirs.innerHTML);
      expect(ours.textContent, itemId).not.toBe('');
    }
  });
});

describe('Hud.handleEvents router pass: the loot and profession event routers', () => {
  const PLAYER_ID = 7;
  const CUES = [
    'lootItem',
    'coin',
    'gather',
    'gatherRareTier',
    'craftSuccess',
    'masterwork',
    'disenchant',
    'salvage',
    'enchant',
    'fishReel',
  ] as const;
  const grant = (itemId: string, count: number): SimEvent => ({
    type: 'loot',
    text: `You receive: ${ITEMS[itemId]?.name ?? itemId}${count > 1 ? ` x${count}` : ''}.`,
    pid: PLAYER_ID,
    silent: true,
    callerLogs: true,
  });
  // One burst across both routers and most arms: elided hub grants, a plain
  // hub line, a line-less roll close, and the gather, craft, disenchant, fishing, unbind, tool-effect,
  // masterwork-zone and attuned-zone arms, in an order that interleaves them.
  const BURST: SimEvent[] = [
    grant('copper_ore', 5),
    {
      type: 'gatherResult',
      pid: PLAYER_ID,
      nodeId: 'n1',
      nodeType: 'ore',
      professionId: 'mining',
      itemId: 'copper_ore',
      rarity: 'rare',
      qty: 5,
      rareEvent: null,
    } as SimEvent,
    { type: 'loot', text: 'You receive: Copper Ore x3.', pid: PLAYER_ID } as SimEvent,
    {
      type: 'loot',
      text: 'Everyone passed on [[i:copper_ore]].',
      pid: PLAYER_ID,
      callerLogs: true,
    } as SimEvent,
    grant('eastbrook_arming_sword', 1),
    {
      type: 'craftResult',
      pid: PLAYER_ID,
      ok: true,
      recipeId: 'recipe_x',
      itemId: 'eastbrook_arming_sword',
      count: 3,
    } as SimEvent,
    {
      type: 'disenchantResult',
      pid: PLAYER_ID,
      ok: true,
      itemId: 'eastbrook_arming_sword',
      materialItemId: 'arcane_dust',
      count: 2,
    } as SimEvent,
    {
      type: 'fishingResult',
      pid: PLAYER_ID,
      itemId: 'copper_ore',
      quality: 'common',
      zoneId: 'eastbrook_vale',
      band: 0,
    } as SimEvent,
    {
      type: 'unbindResult',
      pid: PLAYER_ID,
      ok: true,
      itemId: 'eastbrook_arming_sword',
      fee: 2500,
    } as SimEvent,
    {
      type: 'toolEffectResult',
      pid: PLAYER_ID,
      action: 'slot',
      ok: true,
      professionId: 'mining',
      effectId: 'gatherers_cache',
    } as unknown as SimEvent,
    {
      type: 'masterworkZone',
      pid: PLAYER_ID,
      crafterPid: 3,
      crafterName: 'Crafter',
      itemId: 'eastbrook_arming_sword',
      recipeId: 'recipe_x',
      zoneId: 'eastbrook_vale',
    } as SimEvent,
    { type: 'attunedZone', celebrantName: 'Torvald', pairId: 'alchemy+cooking' } as SimEvent,
  ];

  beforeEach(() => {
    document.body.innerHTML =
      '<div id="bags" style="display:block"></div><div id="crafting-window" style="display:none"></div>';
    for (const cue of CUES) vi.spyOn(audio, cue).mockImplementation(() => {});
  });

  const cueCounts = () =>
    CUES.map((cue) => (audio[cue] as unknown as { mock: { calls: unknown[] } }).mock.calls.length);

  it('prints, cues and repaints exactly what the router rig does, over the real handleEvents', () => {
    const rig = eventRouterRig({ sim: { playerId: PLAYER_ID } });
    rig.routeEvents(BURST);
    const rigCues = cueCounts();
    const rigBags = rig.renderBags.mock.calls.length;
    const rigCloses = rig.lootRolls.closeForItem.mock.calls.length;
    vi.clearAllMocks();

    const hud = chatHud();
    const renderBags = vi.fn();
    const closeForItem = vi.fn();
    Object.assign(hud, {
      sim: {
        playerId: PLAYER_ID,
        craftingIdentity: { synced: false },
        craftSkills: {},
        gatheringProficiency: {},
      },
      renderer: { handleEvent: vi.fn() },
      playEventSfx: vi.fn(),
      meters: { onEvent: vi.fn() },
      isNythraxisEvent: () => false,
      lootRolls: { closeForItem },
      renderBags,
      renderCrafting: vi.fn(),
      showError: vi.fn(),
      openUnbindNpcId: null,
      professionsWindow: { isOpen: false, render: vi.fn() },
    });
    hud.handleEvents(BURST);

    const real = hud.chatLogEl as HTMLElement;
    expect(chatLines({ chatLogEl: real })).toEqual(chatLines(rig));
    expect(real.innerHTML).toBe(rig.chatLogEl.innerHTML);
    expect(cueCounts()).toEqual(rigCues);
    expect(renderBags.mock.calls.length).toBe(rigBags);
    expect(closeForItem.mock.calls.length).toBe(rigCloses);
    // Not vacuous: every logging arm of the burst printed (the two elided hub
    // grants did not), and the cues and the bag refresh really ran.
    expect(real.children).toHaveLength(9);
    expect(rigCues.reduce((a, b) => a + b, 0)).toBeGreaterThan(3);
    expect(rigBags).toBeGreaterThan(0);
    expect(rigCloses).toBe(1);
  });
});

describe('Hud.playEventSfx: the spatial sound router over the Hud own sets', () => {
  it('hands the router this Hud, so a castStop clears the Hud cast-loop set', () => {
    const unloop = vi.spyOn(sfx, 'unloop').mockImplementation(() => {});
    const hud = bareHud();
    const castLoopIds = new Set([5, 6]);
    Object.assign(hud, { sim: { entities: new Map() }, castLoopIds, mobAggroed: new Set() });
    (hud as unknown as { playEventSfx(ev: SimEvent): void }).playEventSfx({
      type: 'castStop',
      entityId: 5,
      success: false,
    });
    expect(unloop).toHaveBeenCalledWith('cast:5', 0.2);
    expect([...castLoopIds]).toEqual([6]);
  });
});

describe('Hud.refreshOpenProfessionSurfacesIfChanged: the lazy convergence latch', () => {
  const identity = (switchCount: number) => ({
    version: 1,
    synced: true,
    craftSkills: {},
    activeArchetype: 'leatherworking',
    pairedMajor: 'tailoring',
    hobbyCraft: null,
    attunedPairs: ['leatherworking+tailoring'],
    switchCount,
    amendsProgress: 0,
    amendsRequired: 5,
    knownRecipes: [],
  });

  it('builds one latch over the live world, the char window and renderCrafting', () => {
    document.body.innerHTML = '<div id="crafting-window" style="display:flex"></div>';
    const hud = bareHud() as ReturnType<typeof bareHud> & {
      refreshOpenProfessionSurfacesIfChanged(): void;
    };
    const renderIfOpen = vi.fn();
    const renderCrafting = vi.fn();
    Object.assign(hud, {
      sim: { craftingIdentity: identity(0), professionsState: { skills: [] } },
      charWindow: { renderIfOpen },
      renderCrafting,
    });
    hud.refreshOpenProfessionSurfacesIfChanged();
    expect(renderIfOpen).toHaveBeenCalledTimes(1);
    expect(renderCrafting).toHaveBeenCalledTimes(1);
    // The same latch, so an unmoved mirror elides both repaints.
    hud.refreshOpenProfessionSurfacesIfChanged();
    expect(renderIfOpen).toHaveBeenCalledTimes(1);
    const latch = hud.professionSurfaces;
    expect(latch).toBeInstanceOf(ProfessionSurfaceRefresh);
    expect(hud.professionSurfaces).toBe(latch);
    // The world is read live through the thunk: a replaced mirror converges.
    hud.sim = { craftingIdentity: identity(1), professionsState: { skills: [] } };
    hud.refreshOpenProfessionSurfacesIfChanged();
    expect(renderIfOpen).toHaveBeenCalledTimes(2);
    expect(renderCrafting).toHaveBeenCalledTimes(2);
  });
});

describe('Hud press entry points: one lazily built ActionPressController', () => {
  it('forwards pressSlot, releaseSlot, castSlot and the pad edges with their arguments', () => {
    const methods = [
      'pressSlot',
      'releaseSlot',
      'castSlot',
      'pressCrossHotbarAction',
      'releaseCrossHotbarAction',
    ] as const;
    const spies = Object.fromEntries(
      methods.map((name) => [
        name,
        vi.spyOn(ActionPressController.prototype, name).mockImplementation(() => {}),
      ]),
    ) as Record<(typeof methods)[number], ReturnType<typeof vi.spyOn>>;
    const hud = bareHud() as DelegatorRig & {
      pressSlot: Hud['pressSlot'];
      releaseSlot: Hud['releaseSlot'];
      castSlot: Hud['castSlot'];
      pressCrossHotbarAction: Hud['pressCrossHotbarAction'];
      releaseCrossHotbarAction: Hud['releaseCrossHotbarAction'];
    };
    const cell = { type: 'ability' as const, id: 'glacial_front' };
    const other = { type: 'item' as const, id: 'minor_healing_potion' };

    hud.pressSlot(3);
    hud.releaseSlot(4);
    hud.castSlot(5);
    hud.pressCrossHotbarAction(cell);
    hud.releaseCrossHotbarAction(other);

    expect(spies.pressSlot).toHaveBeenCalledExactlyOnceWith(3);
    expect(spies.releaseSlot).toHaveBeenCalledExactlyOnceWith(4);
    expect(spies.castSlot).toHaveBeenCalledExactlyOnceWith(5);
    expect(spies.pressCrossHotbarAction).toHaveBeenCalledExactlyOnceWith(cell);
    expect(spies.releaseCrossHotbarAction).toHaveBeenCalledExactlyOnceWith(other);
    // A bare prototype resolves the controller lazily, builds it ONCE, and every
    // call lands on that one instance (one empowered hold across all inputs).
    const press = hud.actionPress;
    expect(press).toBeInstanceOf(ActionPressController);
    expect(hud.actionPress).toBe(press);
    for (const name of methods) expect(spies[name].mock.contexts, name).toEqual([press]);
    // The vehicle bar's cancel list reads the controller's own hold.
    expect(hud.empowerHold).toBe((press as ActionPressController).empowerHold);
  });
});

describe('Hud ground aim: the delegates and the page flip, over the ground-aim rig', () => {
  interface AimHud {
    castSlot: Hud['castSlot'];
    isGroundAimActive: Hud['isGroundAimActive'];
    cancelGroundAim: Hud['cancelGroundAim'];
    groundAimAbilityRange: Hud['groundAimAbilityRange'];
    updateGroundAimPoint: Hud['updateGroundAimPoint'];
    nudgeGroundAimPoint: Hud['nudgeGroundAimPoint'];
    groundAimReticle: Hud['groundAimReticle'];
    commitGroundAimAt: Hud['commitGroundAimAt'];
    commitGroundAim: Hud['commitGroundAim'];
    cycleMobileActionPage(): void;
  }
  const aimHud = (options: Parameters<typeof seedGroundAimRig>[1] = {}) =>
    seedGroundAimRig(bareHud() as unknown as AimHud, options);

  afterEach(() => {
    document.body.classList.remove('mobile-touch');
  });

  it('cancels active aim before flipping the mobile action page', () => {
    const hud = aimHud({ mobileTouch: true });
    hud.castSlot(3);
    const pagesObservedWhileCancelling: number[] = [];
    hud.renderer.setGroundAimReticle.mockImplementation((reticle) => {
      if (reticle === null) pagesObservedWhileCancelling.push(hud.mobileActionPage);
    });

    hud.cycleMobileActionPage();

    expect(hud.isGroundAimActive()).toBe(false);
    expect(pagesObservedWhileCancelling).toEqual([0]);
    expect(hud.mobileActionPage).toBe(1);
    expect(hud.renderer.setGroundAimReticle).toHaveBeenCalledWith(null);
  });

  it('drives the player aim through the real castSlot and every delegate', () => {
    const hud = aimHud({ range: 30 });

    hud.castSlot(3);
    expect(hud.isGroundAimActive()).toBe(true);
    expect(hud.groundAimAbilityRange()).toBe(30);
    hud.updateGroundAimPoint({ x: 10, z: 5 });
    hud.nudgeGroundAimPoint(1, 0);
    expect(hud.playerGroundAim.rawAimPoint()).toEqual({ x: 11, z: 5 });
    expect(hud.groundAimReticle()?.point).toEqual({ x: 11, z: 5 });
    expect(hud.commitGroundAim()).toBe(true);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledExactlyOnceWith('flamestrike', { x: 11, z: 5 });
    expect(hud.isGroundAimActive()).toBe(false);

    hud.castSlot(3);
    expect(hud.commitGroundAimAt({ x: 4, z: 0 })).toBe(true);
    expect(hud.sim.castAbilityAt).toHaveBeenLastCalledWith('flamestrike', { x: 4, z: 0 });
    hud.castSlot(3);
    expect(hud.cancelGroundAim()).toBe(true);
    expect(hud.isGroundAimActive()).toBe(false);
    expect(hud.sim.castAbilityAt).toHaveBeenCalledTimes(2);
  });

  it('reads the vehicle aim, and hands the vehicle bar the press, during a vehicle session', () => {
    const hud = aimHud();
    const point: AimPoint = { x: 5, z: 6 };
    const aim = {
      isActive: vi.fn(() => true),
      cancel: vi.fn(() => true),
      abilityRange: vi.fn(() => 12),
      updatePoint: vi.fn(),
      nudge: vi.fn(),
      reticle: vi.fn(() => null),
      commitAt: vi.fn(() => true),
    };
    const chooseSlot = vi.fn();
    // The lazily built vehicle bar, pre-seated so the getter returns it.
    Object.assign(hud, { vehicleBar: { aim, chooseSlot } });
    Object.assign(hud.sim, { vehicleSession: { vehicleId: 1 } });

    expect(hud.isGroundAimActive()).toBe(true);
    expect(hud.cancelGroundAim()).toBe(true);
    expect(hud.groundAimAbilityRange()).toBe(12);
    hud.updateGroundAimPoint(point);
    hud.nudgeGroundAimPoint(3, 4);
    expect(hud.groundAimReticle()).toBeNull();
    expect(hud.commitGroundAimAt(point)).toBe(true);
    expect(hud.commitGroundAim()).toBe(true);
    hud.castSlot(3);

    expect(aim.isActive).toHaveBeenCalledTimes(1);
    expect(aim.cancel).toHaveBeenCalledTimes(1);
    expect(aim.abilityRange).toHaveBeenCalledTimes(1);
    expect(aim.updatePoint).toHaveBeenCalledExactlyOnceWith(point);
    expect(aim.nudge).toHaveBeenCalledExactlyOnceWith(3, 4);
    expect(aim.reticle).toHaveBeenCalledTimes(1);
    expect(aim.commitAt.mock.calls).toEqual([[point], []]);
    expect(chooseSlot).toHaveBeenCalledExactlyOnceWith(3);
    expect(hud.playerGroundAim.isActive()).toBe(false);
    expect(hud.sim.castAbilityAt).not.toHaveBeenCalled();
  });
});

describe('Hud.syncSlotMap: the pad offer is actionBarEligibleKnownIds of the known list', () => {
  it('reseeds the bar, offers the eligible known ids in order, and repins the page', () => {
    const hud = bareHud();
    const syncKnownAbilities = vi.fn();
    const syncCrossHotbarKnown = vi.fn();
    Object.assign(hud, {
      actionBarController: { syncKnownAbilities },
      optionsHooks: { gamepad: { syncCrossHotbarKnown } },
      // Real content records: a stance is offered, a passive is withheld.
      sim: {
        known: ['mortal_strike', 'measured_fury', 'defensive_stance'].map((id) => ({
          def: ABILITIES[id],
        })),
      },
      currentMobileActionPage: vi.fn(() => 1),
    });

    (hud as unknown as { syncSlotMap(): void }).syncSlotMap();

    expect(syncKnownAbilities).toHaveBeenCalledTimes(1);
    expect(syncCrossHotbarKnown).toHaveBeenCalledExactlyOnceWith([
      'mortal_strike',
      'defensive_stance',
    ]);
    expect(hud.mobileActionPage).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// The shared #confirm-dialog slot: the two no-choice routes that run through
// the Hud (moved whole from tests/hud_confirm_gates.test.ts). The REAL
// confirmDialog delegator, closeManagedWindow's confirm arm and the inputDialog
// delegator, over a bare prototype with the trap and window plumbing stubbed.
// ---------------------------------------------------------------------------

interface RealDialogHud {
  confirmDialog: Hud['confirmDialog'];
  closeManagedWindow(el: HTMLElement): void;
  inputDialog(opts: { title: string }): void;
}

function realDialogHud(): RealDialogHud {
  const hud = Object.create(Hud.prototype) as Record<string, unknown>;
  hud.focusManager = { open: () => ({ release: () => {} }) };
  hud.bringWindowToFront = () => {};
  hud.confirmTrap = null;
  hud.confirmOnCancel = null;
  return hud as unknown as RealDialogHud;
}

describe('confirmDialog no-choice callback through the Hud (the R40 family contract)', () => {
  it('fires on the Esc route (closeManagedWindow) and on replacement by a newer dialog', () => {
    document.body.innerHTML = '';
    const hud = realDialogHud();
    const onCancel = vi.fn();
    hud.confirmDialog('T', 'B', 'OK', 'Cancel', vi.fn(), onCancel);
    const el = document.getElementById('confirm-dialog');
    if (!el) throw new Error('dialog not painted');
    hud.closeManagedWindow(el);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(document.getElementById('confirm-dialog')).toBeNull();

    const replaced = vi.fn();
    hud.confirmDialog('T1', 'B', 'OK', 'Cancel', vi.fn(), replaced);
    hud.confirmDialog('T2', 'B', 'OK', 'Cancel', vi.fn());
    expect(replaced).toHaveBeenCalledTimes(1);
    // The second dialog carried no onCancel: dismissing it fires nothing more.
    const second = document.getElementById('confirm-dialog');
    if (!second) throw new Error('second dialog not painted');
    hud.closeManagedWindow(second);
    expect(replaced).toHaveBeenCalledTimes(1);
  });

  it('fires when the INPUT modal takes the shared slot (the fourth no-choice route)', () => {
    // inputDialog shares the #confirm-dialog element, so a rename prompt
    // (or any input modal) replacing an open R40 ask is a dismissal without
    // a choice: the pending callback must answer before the modal takes it.
    document.body.innerHTML = '';
    const hud = realDialogHud();
    const replaced = vi.fn();
    hud.confirmDialog('T', 'B', 'OK', 'Cancel', vi.fn(), replaced);
    hud.inputDialog({
      title: 'Rename',
    });
    expect(replaced).toHaveBeenCalledTimes(1);
    // The input modal itself carries no confirm callback: closing it fires
    // nothing more.
    const el = document.getElementById('confirm-dialog');
    if (!el) throw new Error('input modal not painted');
    hud.closeManagedWindow(el);
    expect(replaced).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// The Town Focus panel's managed close (moved whole from
// tests/town_focus_repaint_gate.test.ts, section 6). The Hud builds the
// TownFocusController lazily over itself and the panel's windowFocus bridge
// over its ONE FocusManager, seeded here for real, so the case drives the
// shipped wiring end to end: the toggle delegator, the lazy build, the
// bridge, closeManagedWindow's town-focus arm and the townFocusOpen getter.
// ---------------------------------------------------------------------------

describe('the Town Focus panel through the Hud: the Escape / closeAll route', () => {
  const COMPONENT = TOWN_FOCUS_COMPONENTS[0];

  function makeFocusHud(allocation: Record<string, number> = { [COMPONENT]: 2 }) {
    document.body.innerHTML = '';
    // The real opener: the minimap button whose click handler calls toggleTownFocus.
    const opener = document.createElement('button');
    opener.id = 'mm-town-focus';
    document.body.appendChild(opener);
    const el = document.createElement('div');
    el.id = 'town-focus-window';
    el.className = 'window panel';
    document.body.appendChild(el);
    // Standing on a real town hub, so the panel paints its steppers enabled.
    const hub = ZONES[0].hub;
    const hud = bareHud() as DelegatorRig & {
      toggleTownFocus: Hud['toggleTownFocus'];
      readonly townFocusOpen: boolean;
      closeManagedWindow(el: HTMLElement): void;
    };
    Object.assign(hud, {
      sim: {
        player: { pos: { x: hub.x, z: hub.z } },
        townFocus: { ...allocation },
        townFocusPending: null,
        setTownFocus: vi.fn(),
      },
      focusManager: new FocusManager(),
      closeContextMenu: vi.fn(),
      hideTooltip: vi.fn(),
    });
    return { hud, el, opener };
  }

  const stepButton = (el: HTMLElement, component: string, role: 'dec' | 'inc') => {
    const btn = el.querySelector<HTMLButtonElement>(`[data-focus-key="${component}:${role}"]`);
    expect(btn, `no ${role} stepper for ${component}`).not.toBeNull();
    return btn as HTMLButtonElement;
  };

  let restoreRects: () => void;
  beforeEach(() => {
    // FocusManager.restore defers focus a tick; the manager reads
    // getClientRects().length to mean "rendered", and the DOM lays nothing
    // out, so report one rect (tests/town_focus_repaint_gate.test.ts section 6
    // explains the stub and its consequences).
    const spy = vi
      .spyOn(Element.prototype, 'getClientRects')
      .mockReturnValue([{}] as unknown as DOMRectList);
    restoreRects = () => spy.mockRestore();
  });
  afterEach(() => {
    restoreRects();
    document.body.innerHTML = '';
  });

  it('returns focus to the opener through closeManagedWindow, the Escape / closeAll route', () => {
    const { hud, el, opener } = makeFocusHud();
    opener.focus();
    hud.toggleTownFocus();
    expect(stepButton(el, COMPONENT, 'inc').disabled).toBe(false);
    stepButton(el, COMPONENT, 'inc').focus();
    // Escape and the gamepad both land in closeAll -> closeManagedWindow, whose
    // `town-focus-window` case is the only thing standing between them and a
    // focus drop to <body>.
    hud.closeManagedWindow(el);
    vi.runAllTimers();
    expect(hud.townFocusOpen).toBe(false);
    expect(document.activeElement).toBe(opener);
  });
});

// ---------------------------------------------------------------------------
// The resurrection offer and the respawn line through the real handleEvents
// (moved whole from tests/hud_resurrection_prompt.test.ts). A minimal Hud able
// to run those arms (the noticeboard suite's Object.create idiom; stub every
// field the drain touches).
// ---------------------------------------------------------------------------

function eventHarness(player: { dead: boolean }) {
  const hud = bareHud() as DelegatorRig & { log: ReturnType<typeof vi.fn> };
  Object.assign(hud, {
    sim: {
      playerId: 17,
      player: { dead: player.dead, pos: { x: 0, z: 0 } },
      craftingIdentity: { synced: false },
      craftSkills: {},
      gatheringProficiency: {},
      respondToResurrection: vi.fn(),
    },
    renderer: { handleEvent: vi.fn() },
    playEventSfx: vi.fn(),
    meters: { onEvent: vi.fn() },
    isNythraxisEvent: vi.fn(() => false),
    showBanner: vi.fn(),
    log: vi.fn(),
  });
  return hud;
}

/** The Hud's lazily built resurrection prompt's live element. */
const resurrectionPromptEl = (hud: DelegatorRig): HTMLElement | null =>
  (hud as unknown as { resurrectionPrompt: { element: HTMLElement | null } }).resurrectionPrompt
    .element;

function offerEvent(): SimEvent {
  return { type: 'resurrectionOffer', fromName: 'Lumina', pid: 17 } as SimEvent;
}

describe('HUD resurrection confirmation prompt through handleEvents', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="prompt-stack"></div>';
  });

  it('an offer arriving while the player is alive never paints a prompt', () => {
    // Online, a rez can complete against a player who is no longer dead (they
    // released, respawned, or took another healer's rez while this cast was in
    // flight). The arm used to show the centred prompt unconditionally, and
    // the per-frame `!p.dead` closer removed it on the very next frame: a
    // one-frame dark-panel flash at 34% centre, and an offer that was
    // unanswerable anyway (the sim keeps offers only for dead players).
    const hud = eventHarness({ dead: false });

    hud.handleEvents([offerEvent()]);

    expect(document.querySelector('#prompt-stack')?.childElementCount).toBe(0);
    expect(resurrectionPromptEl(hud)).toBe(null);
  });

  it('an offer arriving while dead still shows the prompt', () => {
    // The guard must not eat the real thing: the normal online order delivers
    // the death snapshot ticks before any rez can finish casting.
    const hud = eventHarness({ dead: true });

    hud.handleEvents([offerEvent()]);

    expect(document.querySelector('#prompt-stack')?.childElementCount).toBe(1);
    expect(resurrectionPromptEl(hud)).not.toBe(null);
  });
});

describe('the respawn chat line through handleEvents', () => {
  // The sim tags a Keeper revive's respawn event with sickness: 'resurrection'
  // exactly when The Keeper's Toll landed; the HUD reads that tag to say the
  // character is back but weaker, and keeps the penalty-free line otherwise.
  it('says weaker for a tagged respawn and rested for a plain one', () => {
    const tagged = eventHarness({ dead: false });
    tagged.handleEvents([{ type: 'respawn', pid: 17, sickness: 'resurrection' } as SimEvent]);
    expect(tagged.log).toHaveBeenCalledTimes(1);
    expect(tagged.log.mock.calls[0][0]).toBe(t('hud.system.respawnKeeperToll'));
    expect(tagged.log.mock.calls[0][0]).toMatch(/weaker/);

    const plain = eventHarness({ dead: false });
    plain.handleEvents([{ type: 'respawn', pid: 17 } as SimEvent]);
    expect(plain.log).toHaveBeenCalledTimes(1);
    expect(plain.log.mock.calls[0][0]).toBe(t('hud.system.respawn'));
    expect(plain.log.mock.calls[0][0]).not.toMatch(/weaker|Toll/);
  });
});

// ---------------------------------------------------------------------------
// The pet food-selection mode's end through the Hud. The mode is the pet bar's
// own state; the bags window and the bag closes end it through this delegator,
// and the bar (built lazily over the Hud) repaints its Heal Pet button.
// ---------------------------------------------------------------------------

describe('Hud.cancelPetFeed: ends the feed mode on the pet bar that owns it', () => {
  it('ends the mode on the one lazily built bar, and a second call leaves it ended', () => {
    const setFeed = vi.spyOn(PetBarController.prototype, 'setFeedPending');
    const hud = bareHud() as DelegatorRig & {
      cancelPetFeed: Hud['cancelPetFeed'];
      petBar: PetBarController;
    };
    const bar = hud.petBar;
    expect(bar).toBeInstanceOf(PetBarController);
    bar.setFeedPending(true);
    hud.cancelPetFeed();
    expect(bar.feedPending).toBe(false);
    expect(hud.petBar).toBe(bar);
    expect(setFeed.mock.calls).toEqual([[true], [false]]);
    expect(setFeed.mock.contexts).toEqual([bar, bar]);
    // The redraw is the bar's own (the mode is in its signature,
    // tests/pet_bar_controller.test.ts); a second call only restates the end.
    hud.cancelPetFeed();
    expect(bar.feedPending).toBe(false);
    expect(setFeed.mock.calls).toEqual([[true], [false], [false]]);
  });
});

// ---------------------------------------------------------------------------
// The harvest preference picker's personal event through the real
// handleEvents (moved whole from tests/harvest_preference_hud.test.ts).
// ---------------------------------------------------------------------------

describe('the spectator bug: the generic pid gate is not enough for harvestPreferenceOpen', () => {
  // Online, the server's event router maps a spectating moderator's session
  // to the ANCHOR's pid and delivers the anchor's personal events; ClientWorld's
  // applySnapshot re-anchors `playerId` to that same pid while spectating (see
  // src/net/CLAUDE.md, applySnapshot). So the generic `ev.pid !== sim.playerId`
  // gate at the top of handleEvents PASSES the anchor's own harvestPreferenceOpen
  // event straight through to a spectating moderator, who never asked for it.
  // This drives the real Hud.prototype.handleEvents (no test-local routing
  // stand-in) against a bare Object.create fixture, stubbing only the
  // per-event side effects this event's siblings might otherwise touch.
  const ANCHOR_PID = 7;

  // A standalone structural type, deliberately NOT intersected with `Hud`
  // itself: `Hud & { sim: unknown; ... }` collapses to `never` because
  // several of these field names (prevCraftSkills, craftTierUpDrains, ...)
  // are PRIVATE on the real class, and TS refuses an intersection where a
  // private member's declaring class differs. `handleEvents` is typed off
  // `Hud['handleEvents']` so the call below is the REAL public method's
  // exact signature; every other field the method body touches is named
  // here as `unknown` and assigned through it, never read back as Hud.
  interface HudTestHarness {
    handleEvents: Hud['handleEvents'];
    sim: unknown;
    renderer: unknown;
    meters: unknown;
    harvestPreferenceController: unknown;
    isNythraxisEvent: unknown;
    playEventSfx: unknown;
    prevCraftSkills: unknown;
    prevCraftSkillLevels: unknown;
    prevGatheringSkillLevels: unknown;
    craftTierUpDrains: unknown;
  }

  function makeHud(spectating: string | null): {
    hud: HudTestHarness;
    open: ReturnType<typeof vi.fn>;
  } {
    const open = vi.fn();
    const sim = {
      playerId: ANCHOR_PID,
      spectating,
      entities: new Map(),
      craftingIdentity: { synced: false },
      craftSkills: {},
      gatheringProficiency: {},
    };
    // Object.create(Hud.prototype) puts the REAL Hud.prototype.handleEvents
    // on the returned object's prototype chain; only the instance fields
    // that method's body reaches are stamped on directly.
    const hud = Object.create(Hud.prototype) as HudTestHarness;
    hud.sim = sim;
    hud.renderer = { handleEvent: vi.fn() };
    hud.meters = { onEvent: vi.fn() };
    hud.harvestPreferenceController = { open };
    hud.isNythraxisEvent = () => false;
    hud.playEventSfx = () => {};
    hud.prevCraftSkills = null;
    hud.prevCraftSkillLevels = null;
    hud.prevGatheringSkillLevels = null;
    hud.craftTierUpDrains = 0;
    return { hud, open };
  }

  const evFor = (pid: number): SimEvent[] => [{ type: 'harvestPreferenceOpen', pid }];

  it("opens for the viewer's own pid event, not spectating", () => {
    const { hud, open } = makeHud(null);
    hud.handleEvents(evFor(ANCHOR_PID));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('never opens for a foreign pid event, not spectating', () => {
    const { hud, open } = makeHud(null);
    hud.handleEvents(evFor(ANCHOR_PID + 1));
    expect(open).not.toHaveBeenCalled();
  });

  it("never opens for the spectated anchor's own event while spectating", () => {
    const { hud, open } = makeHud('SomeAnchorName');
    // The generic gate alone would pass this: sim.playerId reads the anchor's
    // pid while spectating, matching the event's pid exactly.
    hud.handleEvents(evFor(ANCHOR_PID));
    expect(open).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// A furnishing's chat item link through the real Hud.appendChatItemLink (moved
// whole from tests/furnishing_tooltip_view.test.ts).
// ---------------------------------------------------------------------------

describe('furnishing chat item links', () => {
  function linkText(itemId: string, instance?: ItemInstancePayload): string {
    const hud = Object.create(Hud.prototype) as {
      attachTooltip: () => void;
      appendChatItemLink(parent: HTMLElement, id: string, copy?: ItemInstancePayload): void;
    };
    hud.attachTooltip = () => {};
    const parent = document.createElement('div');
    hud.appendChatItemLink(parent, itemId, instance);
    return parent.textContent ?? '';
  }

  it('never names a forged loot-quality tier on a furnishing link', () => {
    const rolled: ItemInstancePayload = {
      lootQuality: { version: 1, tier: 4, weights: [4, 900, 200, 6, 7] },
    };
    const previous = ITEMS[FURNISHING.id];
    ITEMS[FURNISHING.id] = FURNISHING;
    try {
      expect(linkText(FURNISHING.id, rolled)).toBe(linkText(FURNISHING.id));
      // Control: the same roll on real gear does change the link's name.
      expect(linkText('worn_sword', rolled)).not.toBe(linkText('worn_sword'));
    } finally {
      if (previous === undefined) delete ITEMS[FURNISHING.id];
      else ITEMS[FURNISHING.id] = previous;
    }
  });
});
