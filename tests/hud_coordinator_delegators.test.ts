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
//   sfx router the Hud's own cast-loop set.
//
// Its own file on purpose: importing the coordinator costs a suite several
// hundred MB (tests/CLAUDE.md, "Test cost"), so these cases are kept out of the
// pure-module suites that pin the extracted halves.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { sfx } from '../src/game/sfx';
import { ITEMS } from '../src/sim/data';
import type { SimEvent } from '../src/sim/types';
import {
  type BannerShowArgs,
  BannerSlot,
  type BannerVariant,
  celebrationBannerArgs,
} from '../src/ui/banner_slot';
import { ErrorToastController } from '../src/ui/error_toast_controller';
import { Hud } from '../src/ui/hud';
import type { ChatLogAppendDeps } from '../src/ui/hud/chat/chat_log_appender';
import { ProfessionSurfaceRefresh } from '../src/ui/hud/professions/profession_surface_refresh';
import { setLanguage } from '../src/ui/i18n';
import { celebrationRig } from './helpers/celebration_rig';
import { chatPane } from './helpers/chat_log_deps';
import { chatLines, eventRouterRig } from './helpers/event_router_rig';

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
    // tests/helpers/celebration_rig.ts transcribes showCelebrationBanner and the
    // host's showBanner (whose three arguments lean on BannerSlot.show's own
    // defaults, where the Hud's showBanner spells its own), so the two are held
    // together by what their slots PAINT: the real #banner against the rig's
    // element, at every checkpoint of the duration and advance chain.
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
    hud.celebrationHost().showBanner('Zone', false, 'art.webp');
    rig.host.showBanner('Zone', false, 'art.webp');
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
    const showBanner = vi.fn();
    const showCelebrationBanner = vi.fn();
    const combatAnnouncer = { push: vi.fn() };
    const deedsWindow = { noteUnlocks: vi.fn(), openWithDeed: vi.fn() };
    const reliquaryWindow = { isOpen: false };
    Object.assign(hud, {
      log,
      logNodes,
      showBanner,
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
    host.showBanner('Zone', false, 'art.webp');
    expect(showBanner).toHaveBeenCalledWith('Zone', false, 'art.webp');
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
