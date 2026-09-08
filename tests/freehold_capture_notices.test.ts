import { afterEach, describe, expect, it, vi } from 'vitest';
import { settleFreeholdCaptureNotices } from '../scripts/lib/freehold_capture_notices.mjs';

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
