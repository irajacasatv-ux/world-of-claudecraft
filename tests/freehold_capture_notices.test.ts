import { afterEach, describe, expect, it, vi } from 'vitest';
import { GREETING_DECLINE } from '../scripts/enter_offline_game.mjs';
import {
  settleFreeholdCaptureNotices,
  settleFreeholdCaptureOverlays,
} from '../scripts/lib/freehold_capture_notices.mjs';

type Scene = {
  boot?: 'visible' | 'hidden';
  performance?: 'visible' | 'hidden';
  dismissal?: string;
};
function fakePage(initial: Scene = {}, delayed: Scene[] = []) {
  const scene = { ...initial };
  const actions: string[] = [];
  const timeout = new Error('notice settlement timed out');
  vi.stubGlobal('document', {
    getElementById: (id: string) =>
      (id === 'gpu-notice' ? scene.boot : id === 'perf-nudge' ? scene.performance : null)
        ? {}
        : null,
  });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) =>
      key === 'woc_perf_nudge_dismissed' ? (scene.dismissal ?? null) : null,
  });
  const visible = (selector: string) =>
    selector.startsWith('#gpu-notice:')
      ? scene.boot === 'visible'
      : scene.performance === 'visible';
  const dismiss = (method: string, selector: string) => {
    expect(visible(selector)).toBe(true);
    actions.push(`${method}:${selector}`);
    if (selector.startsWith('#gpu-notice:')) scene.boot = 'hidden';
    else scene.performance = 'hidden';
  };
  const waitForFunction = vi.fn(
    async (predicate: () => string | false, options: { timeout: number }) => {
      expect(options).toEqual({ timeout: 45_000 });
      actions.push('wait');
      let value = predicate();
      while (!value && delayed.length) {
        Object.assign(scene, delayed.shift());
        value = predicate();
      }
      if (!value) throw timeout;
      return { jsonValue: async () => value, dispose: async () => {} };
    },
  );
  const page = {
    waitForFunction,
    $: vi.fn(async (selector: string) => (visible(selector) ? {} : null)),
    click: vi.fn(async (selector: string) => dismiss('click', selector)),
    tap: vi.fn(async (selector: string) => dismiss('tap', selector)),
    waitForSelector: vi.fn(async (selector: string, options: { hidden: boolean }) => {
      expect(options).toEqual({ hidden: true });
      expect(visible(selector)).toBe(false);
    }),
  };
  return {
    page: page as unknown as Parameters<typeof settleFreeholdCaptureNotices>[0],
    scene,
    actions,
    timeout,
    waitForFunction,
  };
}
afterEach(() => vi.unstubAllGlobals());

describe('Freehold capture notice settlement', () => {
  it('waits for a delayed performance notice before dismissal, closing the post-capture race', async () => {
    const f = fakePage({}, [{ performance: 'visible' }]);
    expect(await settleFreeholdCaptureNotices(f.page, false)).toEqual({
      noticeResolution: 'performance-notice',
      dismissedIds: ['perf-nudge'],
    });
    expect(f.actions).toEqual(['wait', 'click:#perf-nudge:not([hidden]) .perf-nudge-dismiss']);
    expect(f.scene.performance).toBe('hidden');
  });
  it('uses touch dismissal for a presented performance notice', async () => {
    const f = fakePage({ performance: 'visible' });
    expect(await settleFreeholdCaptureNotices(f.page, true)).toEqual({
      noticeResolution: 'performance-notice',
      dismissedIds: ['perf-nudge'],
    });
    expect(f.actions).toEqual(['wait', 'tap:#perf-nudge:not([hidden]) .perf-nudge-dismiss']);
  });
  it('settles a shown boot notice and dismisses both actual visible notices', async () => {
    const f = fakePage({ boot: 'visible', performance: 'visible' });
    expect(await settleFreeholdCaptureNotices(f.page, false)).toEqual({
      noticeResolution: 'boot-notice',
      dismissedIds: ['gpu-notice', 'perf-nudge'],
    });
    expect(f.actions).toEqual([
      'wait',
      'click:#gpu-notice:not([hidden]) .gpu-notice-dismiss',
      'click:#perf-nudge:not([hidden]) .perf-nudge-dismiss',
    ]);
  });
  it('does not click a boot notice that was already dismissed', async () => {
    const f = fakePage({ boot: 'hidden' });
    expect(await settleFreeholdCaptureNotices(f.page, false)).toEqual({
      noticeResolution: 'boot-notice',
      dismissedIds: [],
    });
    expect(f.actions).toEqual(['wait']);
  });
  it('accepts only the exact prior performance dismissal without inventing a click', async () => {
    const f = fakePage({ dismissal: 'hardware-acceleration' });
    expect(await settleFreeholdCaptureNotices(f.page, false)).toEqual({
      noticeResolution: 'prior-performance-dismissal',
      dismissedIds: [],
    });
    expect(f.actions).toEqual(['wait']);
  });
  it.each(['', '1', 'software', 'hardware-acceleration,integrated-gpu'])(
    'does not treat dismissal %j as settlement',
    async (dismissal) => {
      const f = fakePage({ dismissal });
      await expect(settleFreeholdCaptureNotices(f.page, false)).rejects.toBe(f.timeout);
      expect(f.actions).toEqual(['wait']);
    },
  );
  it('propagates the wait timeout without dismissing or silently claiming readiness', async () => {
    const f = fakePage();
    await expect(settleFreeholdCaptureNotices(f.page, true)).rejects.toBe(f.timeout);
    expect(f.actions).toEqual(['wait']);
  });
});

type Visibility = 'shown' | 'display-none' | 'visibility-hidden';
type OverlayScene = {
  // Each .tut-card on the page: whether it carries a .tut-skip, and how it shows.
  cards?: { skip: boolean; vis?: Visibility }[];
  note?: 'guidance' | 'close' | 'bare';
  noteVis?: Visibility;
  professions?: 'close' | 'bare';
};
function overlayPage(schedule: OverlayScene[]) {
  // One scene per pass: an overlay can arrive late, on the sim's own timer.
  let pass = 0;
  const clicks: string[] = [];
  let scene: OverlayScene = {};
  const control = (name: string, onClick: () => void, attribute?: string) => ({
    click: () => {
      clicks.push(name);
      onClick();
    },
    hasAttribute: (a: string) => a === attribute,
  });
  // The pass asks for the declining control through the shared selector list.
  const asks = (selector: string, part: string) =>
    selector
      .split(',')
      .map((p) => p.trim())
      .includes(part);
  const styleOf = (vis: Visibility = 'shown') => ({
    display: vis === 'display-none' ? 'none' : 'block',
    visibility: vis === 'visibility-hidden' ? 'hidden' : 'visible',
  });
  vi.stubGlobal('getComputedStyle', (element: { vis?: Visibility }) => styleOf(element.vis));
  vi.stubGlobal('document', {
    querySelectorAll: (selector: string) =>
      selector === '.tut-card'
        ? (scene.cards ?? []).map((card, i) => ({
            vis: card.vis,
            querySelector: (inner: string) =>
              inner === '.tut-skip' && card.skip
                ? control(`tut-skip-${i}`, () => {
                    scene.cards = (scene.cards ?? []).filter((c) => c !== card);
                  })
                : null,
          }))
        : [],
    getElementById: (id: string) => {
      if (id === 'tutorial-greeting' && scene.note)
        return {
          vis: scene.noteVis,
          querySelector: (inner: string) => {
            if (asks(inner, '[data-guidance="off"]') && scene.note === 'guidance')
              return control('guidance-off', () => (scene.note = undefined), 'data-guidance');
            if (asks(inner, '[data-close]') && scene.note === 'close')
              return control('note-close', () => (scene.note = undefined), 'data-close');
            return null;
          },
        };
      if (id === 'profession-tutorial' && scene.professions)
        return {
          querySelector: (inner: string) =>
            asks(inner, '[data-close]') && scene.professions === 'close'
              ? control('professions-close', () => (scene.professions = undefined), 'data-close')
              : null,
        };
      return null;
    },
  });
  const page = {
    evaluate: vi.fn(async (fn: (decline: string) => string[], decline: string) => {
      expect(decline).toBe(GREETING_DECLINE);
      scene = { ...scene, ...(schedule[pass] ?? {}) };
      pass++;
      return fn(decline);
    }),
  };
  return {
    page: page as unknown as Parameters<typeof settleFreeholdCaptureOverlays>[0],
    clicks,
    passes: () => pass,
  };
}

describe('Freehold capture overlay settlement', () => {
  it('declines a late ferry guidance note, never accepting it, then waits out three quiet passes', async () => {
    const f = overlayPage([{}, { note: 'guidance' }]);
    const result = await settleFreeholdCaptureOverlays(f.page, { pollMs: 0 });
    expect(result).toEqual({ dismissedOverlays: ['tutorial-greeting:guidance-off'], passes: 5 });
    expect(f.clicks).toEqual(['guidance-off']);
    // Pass 1 quiet, pass 2 dismisses (resets the count), passes 3 to 5 quiet.
    expect(f.passes()).toBe(5);
  });
  it('skips every shown tutorial-family card and closes the plain note and the professions tutorial', async () => {
    const f = overlayPage([
      { cards: [{ skip: true }, { skip: true }], note: 'close', professions: 'close' },
    ]);
    const result = await settleFreeholdCaptureOverlays(f.page, { pollMs: 0 });
    expect(result.dismissedOverlays).toEqual([
      'tutorial-card',
      'tutorial-card',
      'tutorial-greeting:close',
      'profession-tutorial',
    ]);
    expect(f.clicks).toEqual(['tut-skip-0', 'tut-skip-1', 'note-close', 'professions-close']);
    expect(f.passes()).toBe(4);
  });
  it('treats a display:none or visibility:hidden overlay as absent and clicks nothing', async () => {
    const f = overlayPage([
      {
        cards: [
          { skip: true, vis: 'display-none' },
          { skip: true, vis: 'visibility-hidden' },
        ],
        note: 'close',
        noteVis: 'visibility-hidden',
      },
    ]);
    expect(await settleFreeholdCaptureOverlays(f.page, { pollMs: 0 })).toEqual({
      dismissedOverlays: [],
      passes: 3,
    });
    expect(f.clicks).toEqual([]);
  });
  it('returns nothing dismissed only after three consecutive quiet passes', async () => {
    const f = overlayPage([]);
    expect(await settleFreeholdCaptureOverlays(f.page, { pollMs: 0 })).toEqual({
      dismissedOverlays: [],
      passes: 3,
    });
    expect(f.passes()).toBe(3);
  });
  it.each([
    ['a note', { note: 'bare' } as OverlayScene, 'tutorial-greeting:no-control'],
    ['a card', { cards: [{ skip: false }] } as OverlayScene, 'tutorial-card:no-control'],
    [
      'the professions tutorial',
      { professions: 'bare' } as OverlayScene,
      'profession-tutorial:no-control',
    ],
  ])(
    'refuses %s with no locale-independent control rather than shooting it',
    async (_, scene, tag) => {
      const f = overlayPage([scene]);
      await expect(settleFreeholdCaptureOverlays(f.page, { pollMs: 0 })).rejects.toThrow(tag);
      expect(f.clicks).toEqual([]);
    },
  );
  it('throws when an overlay keeps returning instead of settling', async () => {
    const f = overlayPage(Array.from({ length: 10 }, () => ({ cards: [{ skip: true }] })));
    await expect(
      settleFreeholdCaptureOverlays(f.page, { pollMs: 0, maxPasses: 10 }),
    ).rejects.toThrow('did not settle');
    expect(f.passes()).toBe(10);
  });
});
