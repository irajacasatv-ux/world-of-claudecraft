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
//   else to renderer.handleEvent (the noticeboard arm is the vehicle).
//
// Its own file on purpose: importing the coordinator costs a suite several
// hundred MB (tests/CLAUDE.md, "Test cost"), so these cases are kept out of the
// pure-module suites that pin the extracted halves.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimEvent } from '../src/sim/types';
import {
  type BannerShowArgs,
  BannerSlot,
  type BannerVariant,
  celebrationBannerArgs,
} from '../src/ui/banner_slot';
import { Hud } from '../src/ui/hud';
import type { ChatLogAppendDeps } from '../src/ui/hud/chat/chat_log_appender';
import { celebrationRig } from './helpers/celebration_rig';
import { chatPane } from './helpers/chat_log_deps';

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
