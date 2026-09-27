// Node 22+ ships an experimental `localStorage` global gated behind
// `--localstorage-file`; without that flag the global still exists (as a
// getter that resolves to `undefined`) instead of being absent. Vitest's
// jsdom and happy-dom environments only install their own working Storage
// implementation for globals that are NOT already present on globalThis, so
// on a plain `node`/`vitest` invocation Node's broken global wins and both
// `window.localStorage` and `globalThis.localStorage` resolve to `undefined`
// in every DOM-environment test. Replace them with a small in-memory
// Storage-compatible polyfill whenever that happens, so tests get a real
// localStorage/sessionStorage regardless of the Node version running them.
// Storage setup is a no-op on pure Node environment files (no `window`). The
// ProgressEvent shim is global because Three's FileLoader may instantiate it
// from a Node-environment test before jsdom exists.
//
// It also turns the event loop once after every case in a DOM-environment file
// (the last block below): a memory leak in the harness, not in any one suite.

import { afterEach } from 'vitest';

function isUsableStorage(storage: unknown): storage is Storage {
  return (
    typeof storage === 'object' &&
    storage !== null &&
    typeof (storage as Storage).clear === 'function'
  );
}

function makeMemoryStorage(): Storage {
  const data = new Map<string, string>();
  const storage: Storage = {
    getItem: (key: string) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size;
    },
  };
  return storage;
}

function ensureUsable(key: 'localStorage' | 'sessionStorage'): void {
  const win = window as unknown as Record<string, unknown>;
  const glob = globalThis as unknown as Record<string, unknown>;
  // window and globalThis must share ONE Storage instance: code may read via
  // either spelling, and a per-target polyfill would silently desync them.
  const shared = isUsableStorage(win[key]) ? (win[key] as Storage) : makeMemoryStorage();
  for (const target of [window, globalThis] as const) {
    Object.defineProperty(target, key, { value: shared, configurable: true, enumerable: true });
  }
}

const MemoryProgressEvent =
  globalThis.ProgressEvent ??
  class extends Event implements ProgressEvent {
    readonly lengthComputable: boolean;
    readonly loaded: number;
    readonly total: number;

    constructor(type: string, init: ProgressEventInit = {}) {
      super(type, init);
      this.lengthComputable = init.lengthComputable ?? false;
      this.loaded = init.loaded ?? 0;
      this.total = init.total ?? 0;
    }
  };

if (typeof globalThis.ProgressEvent === 'undefined') {
  Object.defineProperty(globalThis, 'ProgressEvent', {
    value: MemoryProgressEvent,
    configurable: true,
    enumerable: true,
  });
}

if (typeof window !== 'undefined') {
  ensureUsable('localStorage');
  ensureUsable('sessionStorage');

  if (typeof window.ProgressEvent === 'undefined') {
    Object.defineProperty(window, 'ProgressEvent', {
      value: MemoryProgressEvent,
      configurable: true,
      enumerable: true,
    });
  }
}

// THE DOM-ENV RETENTION LEAK (the 2026-09-26 test-suite audit). Cases in one
// DOM-environment file run back to back without the event loop ever turning,
// so a timer or async callback a case queues keeps that case's whole DOM tree
// reachable until the file ends, and a window suite that renders a large
// catalog per case climbs by hundreds of MB per case (measured retained heap
// after a forced GC: loot_explorer_window_focus 1,862 MB at its last case,
// reliquary_window_behavior 1,243, daily_rewards_store_behavior 946). One real
// macrotask turn after each case lets those callbacks settle and the trees go.
// The timer is captured at load, before any case can install fake timers, so a
// case that leaves fake timers on cannot hang this hook. Pure Node files skip
// it: they hold no DOM tree and pay nothing.
if (typeof window !== 'undefined') {
  const realSetTimeout = globalThis.setTimeout.bind(globalThis);
  afterEach(() => new Promise<void>((resolve) => realSetTimeout(resolve, 0)));
}
