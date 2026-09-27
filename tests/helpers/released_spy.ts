// A call-through spy that lets go of what it spied on. vi.spyOn registers its
// mock in @vitest/spy's module-level REGISTERED_MOCKS set, and the mock's
// closures hold the spied object (its restore closure closes over it), so an
// unrestored spy on `server.sim` kept a whole Sim, and through it the
// GameServer, alive until the worker exited: 117 cases of the housing wire
// suite retained 1.7 GB. patches/@vitest__spy@4.1.11.patch removes a spy from
// that set when it is RESTORED; this helper does not depend on the patch. It
// installs a plain vi.fn that calls the saved original through a holder, and
// when its test finishes (onTestFinished, after the afterEach hooks) it puts
// the original back, empties the holder and resets the mock, so the vi.fn
// that stays registered holds no object, no call arguments and no `this`.
// Use it for any spy on a per-test world object (a Sim, a GameServer, a
// session); a spy on a module singleton such as console gains nothing.

import { type Mock, onTestFinished, vi } from 'vitest';

// biome-ignore lint/suspicious/noExplicitAny: the Mock type's own procedure bound.
type Procedure = (...args: any[]) => any;
type MethodKey<T> = { [K in keyof T]-?: T[K] extends Procedure ? K : never }[keyof T];

interface Held {
  fn: Procedure | null;
}

// Built in its own scope on purpose: V8 gives every closure of one function a
// single shared context, so a call-through written inline in releasedSpyOn
// would capture `target` and the saved descriptor through the release
// closure's variables, and the registered vi.fn would keep the Sim alive.
function callThrough(held: Held, name: string): Procedure {
  return function (this: unknown, ...args: unknown[]) {
    const fn = held.fn;
    if (fn === null) throw new Error(`releasedSpyOn: ${name} ran after its test finished`);
    return fn.apply(this, args);
  };
}

export function releasedSpyOn<T extends object, K extends MethodKey<T>>(
  target: T,
  key: K,
): Mock<Extract<T[K], Procedure>> {
  const original = target[key];
  if (typeof original !== 'function') {
    throw new TypeError(`releasedSpyOn: ${String(key)} is not a method`);
  }
  // A second stub over a live one would restore in callback order, which is not
  // a contract; one stub per key per case, reuse the first.
  if (vi.isMockFunction(original)) {
    throw new TypeError(`releasedSpyOn: ${String(key)} is already stubbed in this case`);
  }
  const own = Object.getOwnPropertyDescriptor(target, key);
  const held: Held = { fn: original as Procedure };
  const stub = vi.fn(callThrough(held, String(key)));
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: own?.enumerable ?? false,
    writable: true,
    value: stub,
  });
  onTestFinished(() => {
    if (own) Object.defineProperty(target, key, own);
    else delete target[key];
    held.fn = null;
    stub.mockReset();
  });
  return stub as unknown as Mock<Extract<T[K], Procedure>>;
}
