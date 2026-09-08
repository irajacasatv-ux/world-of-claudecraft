import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ZoneDef } from '../src/sim/types';

const prepare = vi.hoisted(() => vi.fn());
vi.mock('../src/render/zone_character_dependencies', () => ({
  prepareZoneCharacterDependencies: prepare,
}));

import {
  awaitPrewarmOwnerTask,
  prepareBoundedZoneCharacterDependencies,
} from '../src/render/zone_character_dependency_wait';

function owner() {
  return { prewarmDependencyController: new AbortController(), zonePrewarmHost: () => ({}) };
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('zone dependency owner wait', () => {
  it('uses the remaining boot budget and removes its abort listener after timing out', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    prepare.mockReturnValue(new Promise(() => {}));
    const host = owner();
    const removed = vi.spyOn(host.prewarmDependencyController.signal, 'removeEventListener');
    const task = prepareBoundedZoneCharacterDependencies(
      host,
      {} as ZoneDef,
      performance.now() + 25,
    );
    const rejection = expect(task).rejects.toThrow('dependency deadline');
    await vi.advanceTimersByTimeAsync(25);
    await rejection;
    expect(removed).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retires one renderer promptly without interrupting another owner of the same cache fetch', async () => {
    let resolve!: () => void;
    prepare.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const old = owner();
    const live = owner();
    const deadline = performance.now() + 5000;
    const retiredTask = prepareBoundedZoneCharacterDependencies(old, {} as ZoneDef, deadline);
    const liveTask = prepareBoundedZoneCharacterDependencies(live, {} as ZoneDef, deadline);
    const rejection = expect(retiredTask).rejects.toThrow('prewarm cancelled');
    old.prewarmDependencyController.abort();
    await rejection;
    resolve();
    await liveTask;
    expect(live.prewarmDependencyController.signal.aborted).toBe(false);
  });

  it('releases deferred first-paint users on retirement even if that renderer never paints', async () => {
    const host = owner();
    const task = awaitPrewarmOwnerTask(new Promise(() => {}), host);
    const rejection = expect(task).rejects.toThrow('prewarm cancelled');
    host.prewarmDependencyController.abort();
    await rejection;
  });

  it('preserves a real dependency failure and cleans the deadline timer', async () => {
    vi.useFakeTimers();
    prepare.mockRejectedValue(new Error('required body failed'));
    await expect(
      prepareBoundedZoneCharacterDependencies(owner(), {} as ZoneDef, performance.now() + 5000),
    ).rejects.toThrow('required body failed');
    expect(vi.getTimerCount()).toBe(0);
  });
});
