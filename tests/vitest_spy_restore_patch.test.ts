// patches/@vitest__spy@4.1.11.patch: restoring a spy removes it from
// @vitest/spy's module-level REGISTERED_MOCKS set. Upstream keeps every mock
// there for the life of the worker, and a spy's closures hold the object it
// spied on, so a restored spy on a per-test Sim kept the whole world alive:
// the housing wire suite retained 1.7 GB across its cases. These pins drive
// the installed module, so a vitest upgrade that drops the patch (pnpm refuses
// an unused patch, but a re-authored one can lose a hunk) fails here.

import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { collectGarbage } from './helpers/force_gc';

interface Target {
  payload: number[];
  method(value: number): number;
}

function freshTarget(): Target {
  return {
    payload: new Array(1024).fill(7),
    method(value: number) {
      return value + 1;
    },
  };
}

// Built in a function so the test body never holds the target itself.
function spiedAndDropped(release: 'mockRestore' | 'restoreAllMocks' | 'kept'): WeakRef<Target> {
  const target = freshTarget();
  const spy = vi.spyOn(target, 'method');
  target.method(1);
  if (release === 'mockRestore') spy.mockRestore();
  if (release === 'restoreAllMocks') vi.restoreAllMocks();
  return new WeakRef(target);
}

describe('the @vitest/spy restore patch', () => {
  it('is registered for the installed @vitest/spy version', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const spy = JSON.parse(
      readFileSync(new URL('../node_modules/@vitest/spy/package.json', import.meta.url), 'utf8'),
    );
    expect(pkg.pnpm.patchedDependencies[`@vitest/spy@${spy.version}`]).toBe(
      `patches/@vitest__spy@${spy.version}.patch`,
    );
  });

  it('an unrestored spy still holds its object (the retention the patch ends)', async () => {
    const kept = spiedAndDropped('kept');
    await collectGarbage();
    expect(kept.deref()).toBeDefined();
    vi.restoreAllMocks();
  });

  it.each(['mockRestore', 'restoreAllMocks'] as const)(
    'a spy released by %s no longer holds its object',
    async (release) => {
      const dropped = spiedAndDropped(release);
      await collectGarbage();
      expect(dropped.deref()).toBeUndefined();
    },
  );

  it('a restored spy leaves the registry, and a plain or unrestored mock stays in it', () => {
    const target = freshTarget();
    const restored = vi.spyOn(target, 'method');
    restored.mockRestore();
    // A plain vi.fn has no restore to undo, so restoring it keeps it registered.
    const plain = vi.fn();
    plain.mockRestore();
    const unrestored = vi.spyOn(freshTarget(), 'method');
    restored(1);
    plain(2);
    unrestored(3);
    vi.clearAllMocks();
    // clearAllMocks walks REGISTERED_MOCKS: the restored spy is out of it, so
    // its call survives; the other two are still registered and are cleared.
    expect(restored.mock.calls).toEqual([[1]]);
    expect(plain.mock.calls).toEqual([]);
    expect(unrestored.mock.calls).toEqual([]);
    // The restore put the original back.
    expect(target.method(1)).toBe(2);
    expect(vi.isMockFunction(target.method)).toBe(false);
    vi.restoreAllMocks();
  });
});
