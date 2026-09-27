import { describe, expect, it, type Mock, vi } from 'vitest';
import { collectGarbage } from './force_gc';
import { releasedSpyOn } from './released_spy';

class Counter {
  payload = new Array(1024).fill(3);
  total = 0;
  add(step: number): number {
    this.total += step;
    return this.total;
  }
}

interface Holder {
  payload: number[];
  size(): number;
}

const shared = new Counter();
const ownMethod = { twice: (value: number) => value * 2 };
const ownOriginal = ownMethod.twice;
let dropped: WeakRef<Holder> | null = null;
let registered: Mock<() => number> | null = null;

// Built in a function so no test scope holds the spied object. Its method is
// an own closure over the object, so the saved original, the recorded `this`
// and a call-through sharing the release closure's scope each hold it.
function spyOnADroppedHolder(): WeakRef<Holder> {
  const holder: Holder = { payload: new Array(1024).fill(5), size: () => holder.payload.length };
  const stub = releasedSpyOn(holder, 'size');
  holder.size();
  registered = stub;
  return new WeakRef(holder);
}

// These cases run in order: each release happens when its case finishes, so
// the case after it reads what the release left behind.
describe('releasedSpyOn', () => {
  it('calls through with the call-site this and records the call', () => {
    const stub = releasedSpyOn(shared, 'add');
    expect(shared.add(4)).toBe(4);
    expect(shared.total).toBe(4);
    expect(stub).toHaveBeenCalledExactlyOnceWith(4);
    stub.mockReturnValueOnce(99);
    expect(shared.add(1)).toBe(99);
    expect(shared.total).toBe(4);
    releasedSpyOn(ownMethod, 'twice');
    expect(ownMethod.twice(5)).toBe(10);
  });

  it('puts a prototype method and an own method back when its case finishes', () => {
    expect(Object.hasOwn(shared, 'add')).toBe(false);
    expect(shared.add).toBe(Counter.prototype.add);
    expect(ownMethod.twice).toBe(ownOriginal);
    expect(vi.isMockFunction(ownMethod.twice)).toBe(false);
  });

  it('spies on an object that is then dropped', () => {
    dropped = spyOnADroppedHolder();
  });

  it('keeps no hold on that object once its case finished, though the vi.fn stays registered', async () => {
    await collectGarbage();
    expect(dropped?.deref()).toBeUndefined();
    // The released mock was reset: no recorded call and no recorded `this`.
    expect(registered?.mock.calls).toEqual([]);
    expect(registered?.mock.contexts).toEqual([]);
    expect(() => registered?.()).toThrow(/ran after its test finished/);
  });

  it('refuses a key that is not a method', () => {
    const target = { value: 1 } as unknown as { value: () => number };
    expect(() => releasedSpyOn(target, 'value')).toThrow(/not a method/);
  });
});
