// The freehold persistence store, driven end to end through a fully faked port
// bag: no database, no GameServer, no wall clock. It sits behind the same seam
// the production composition root uses (createFreeholdPersistStore plus the
// register/idle pair), so every acceptance criterion below is checked against
// the real store body rather than a stand-in.
//
// TWO THINGS THIS SUITE EXISTS TO KEEP HONEST:
//  - a held or unread account must produce NO write at all, proved as the
//    ABSENCE of a writeRow call, because a write there would put an empty
//    default over the owner's real furnishings;
//  - the coalescer must cost one running plus one pending write per owner key
//    no matter how many marks arrive, and must clear ONLY the generation the
//    write actually committed.

import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  FreeholdRow,
  FreeholdRowLoad,
  FreeholdUpsert,
  FreeholdUpsertResult,
} from '../../server/freehold_db';
import type { FreeholdHearthLoad } from '../../server/freehold_hearth_db';
import {
  createFreeholdPersistStore,
  FREEHOLD_PERSIST_FLUSH_MAX_PASSES,
  FREEHOLD_PERSIST_MAX_ACTIVE_LOADS,
  FREEHOLD_PERSIST_PERMIT_WAIT_MS,
  FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS,
  type FreeholdPersistPorts,
  type FreeholdPersistStore,
  freeholdPersistIdle,
  installLoadedFreehold,
  type LoadedFreehold,
  registerFreeholdPersistStore,
} from '../../server/freehold_persist';
import { createKeyedSerialWriter } from '../../server/serial_writer';
import {
  FREEHOLD_MAX_OWNED_BYTES,
  type FreeholdLoadResult,
  type PersistedFreehold,
} from '../../src/sim/freehold/persisted';
import type { SimContext } from '../../src/sim/sim_context';
import { methodBody } from '../helpers/method_body';
import { stripComments } from '../helpers/strip_comments';

const SOURCE_PATH = 'server/freehold_persist.ts';

// Deliberately distinctive so the "no identifiers in stats" assertion cannot
// pass by accident against a small counter value.
const ACCOUNT_ID = 918_273;
const OWNER_KEY = `account:${ACCOUNT_ID}`;
const ROW_PLOT_ID = 'plot:rowfixture91';
const OTHER_ACCOUNT_ID = 604_513;
const OTHER_OWNER_KEY = `account:${OTHER_ACCOUNT_ID}`;

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Let the microtask queue settle. The keyed FIFO defers each start by a
 *  microtask, and a write hop is queue, permit, serialize, write. */
async function tick(times = 12): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

function persistedFixture(overrides: Partial<PersistedFreehold> = {}): PersistedFreehold {
  return {
    version: 1,
    plotId: ROW_PLOT_ID,
    tier: 'inn_room',
    layout: [{ placementId: 1, itemId: 'oak_chair', x: 1.5, y: 0, z: -2.25, yaw: 0 }],
    trophies: [{ plinth: 0, trophyId: 'skull_of_something' }],
    condition: 87,
    visitPolicy: 'friends',
    rev: 5,
    ...overrides,
  };
}

function rowFixture(overrides: Partial<FreeholdRow> = {}): FreeholdRow {
  return {
    accountId: ACCOUNT_ID,
    plotIndex: 0,
    plotId: ROW_PLOT_ID,
    schemaVersion: 1,
    durableRev: '7',
    wireRev: '5',
    tier: 'inn_room',
    layout: [{ placementId: 1, itemId: 'oak_chair', x: 1.5, y: 0, z: -2.25, yaw: 0 }],
    trophies: [{ plinth: 0, trophyId: 'skull_of_something' }],
    condition: 87,
    visitPolicy: 'friends',
    upkeepBinding: 'unbound_no_history',
    ownedBytes: 256,
    ...overrides,
  };
}

interface HarnessOptions {
  readRow?: (accountId: number, maxOwnedBytes: number) => Promise<FreeholdRowLoad>;
  rowLoad?: FreeholdRowLoad;
  readHearth?: (accountId: number) => Promise<FreeholdHearthLoad>;
  hearthLoad?: FreeholdHearthLoad;
  normalized?: FreeholdLoadResult;
  serialize?: (ownerKey: string) => PersistedFreehold | null;
  writeRow?: (input: FreeholdUpsert) => Promise<FreeholdUpsertResult>;
  hasLive?: (ownerKey: string) => boolean;
  acquirePermit?: (signal: AbortSignal) => Promise<{ release(): void } | null>;
}

interface DeadlineJob {
  readonly ms: number;
  readonly fire: () => void;
  cancelled: boolean;
  fired: boolean;
}

function harness(options: HarnessOptions = {}) {
  const calls: string[] = [];
  const writes: FreeholdUpsert[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const loadFailures: string[] = [];
  const deadlines: DeadlineJob[] = [];
  const permitSignals: AbortSignal[] = [];
  const ownedBytesSeen: number[] = [];
  const fifo = createKeyedSerialWriter<string>();
  let nowMs = 10_000;
  let minted = 0;

  const readRow =
    options.readRow ??
    (async (): Promise<FreeholdRowLoad> => options.rowLoad ?? { kind: 'absent' });
  const readHearth =
    options.readHearth ??
    (async (): Promise<FreeholdHearthLoad> => options.hearthLoad ?? { kind: 'absent' });
  const writeRow =
    options.writeRow ??
    (async (): Promise<FreeholdUpsertResult> => ({ kind: 'inserted', durableRev: '1' }));
  const serialize = options.serialize ?? ((): PersistedFreehold | null => persistedFixture());

  const ports: FreeholdPersistPorts = {
    async readRow(accountId: number, maxOwnedBytes: number): Promise<FreeholdRowLoad> {
      calls.push('readRow');
      ownedBytesSeen.push(maxOwnedBytes);
      return await readRow(accountId, maxOwnedBytes);
    },
    async readHearth(accountId: number): Promise<FreeholdHearthLoad> {
      calls.push('readHearth');
      return await readHearth(accountId);
    },
    async writeRow(input: FreeholdUpsert): Promise<FreeholdUpsertResult> {
      calls.push('writeRow');
      writes.push(input);
      return await writeRow(input);
    },
    normalize(): FreeholdLoadResult {
      calls.push('normalize');
      return options.normalized ?? { kind: 'loaded', state: persistedFixture(), repaired: [] };
    },
    serialize(ownerKey: string): PersistedFreehold | null {
      calls.push('serialize');
      return serialize(ownerKey);
    },
    hasLive(ownerKey: string): boolean {
      return options.hasLive ? options.hasLive(ownerKey) : false;
    },
    mintPlotId(): string {
      minted += 1;
      return `plot:minted${minted}`;
    },
    async acquirePermit(signal: AbortSignal): Promise<{ release(): void } | null> {
      calls.push('permit');
      permitSignals.push(signal);
      if (options.acquirePermit) return await options.acquirePermit(signal);
      return {
        release(): void {
          calls.push('release');
        },
      };
    },
    enqueue<T>(key: string, signal: AbortSignal, write: () => Promise<T>): Promise<T> {
      calls.push('enqueue');
      return fifo.enqueueCancellable(key, signal, write);
    },
    nowMs(): number {
      return nowMs;
    },
    warn(message: string): void {
      warnings.push(message);
    },
    error(message: string): void {
      errors.push(message);
    },
    recordLoadFailure(kind: string): void {
      loadFailures.push(kind);
    },
    scheduleDeadline(callback: () => void, ms: number): () => void {
      const job: DeadlineJob = { ms, fire: callback, cancelled: false, fired: false };
      deadlines.push(job);
      return () => {
        job.cancelled = true;
      };
    },
  };

  const store = createFreeholdPersistStore(ports);
  return {
    store,
    ports,
    calls,
    writes,
    warnings,
    errors,
    loadFailures,
    deadlines,
    permitSignals,
    ownedBytesSeen,
    setNow(ms: number): void {
      nowMs = ms;
    },
    writeCount(): number {
      return calls.filter((call) => call === 'writeRow').length;
    },
    fireDeadline(): boolean {
      const job = deadlines.find((candidate) => !candidate.cancelled && !candidate.fired);
      if (!job) return false;
      job.fired = true;
      job.fire();
      return true;
    },
  };
}

type Harness = ReturnType<typeof harness>;

/** Load an account and leave the store with one loaded, unheld entry. */
async function loadedStore(options: HarnessOptions = {}): Promise<Harness> {
  const h = harness(options);
  h.store.retain(OWNER_KEY);
  await h.store.preload(ACCOUNT_ID);
  h.calls.length = 0;
  return h;
}

function fakeCtx(freeholdsEnabled = true): SimContext {
  return {
    freeholdsEnabled,
    freeholds: new Map(),
    freeholdKeyReadyAtMs: new Map<string, number>(),
  } as unknown as SimContext;
}

afterEach(() => {
  registerFreeholdPersistStore(null);
});

describe('freehold persist constants', () => {
  it('pins the three bounds the contract names', () => {
    expect(FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS).toBe(10_000);
    expect(FREEHOLD_PERSIST_PERMIT_WAIT_MS).toBe(15_000);
    expect(FREEHOLD_PERSIST_MAX_ACTIVE_LOADS).toBe(4);
    expect(FREEHOLD_PERSIST_FLUSH_MAX_PASSES).toBe(4);
  });

  it('keeps every clock and timer behind a port', () => {
    const source = stripComments(readFileSync(SOURCE_PATH, 'utf8'));
    expect(source).not.toMatch(/Date\.now\(/);
    expect(source).not.toMatch(/Math\.random\(/);
    // The one sanctioned timer is the module-edge default deadline scheduler.
    expect(source.match(/setTimeout\(/g) ?? []).toHaveLength(1);
    expect(source).toContain('const realScheduleDeadline');
  });
});

describe('preload admission', () => {
  it('is a live recorder: one load is one permit, one row read and one hearth read', async () => {
    const h = harness();
    expect(h.calls).toEqual([]);
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(h.calls).toEqual(['permit', 'readRow', 'readHearth', 'release']);
    expect(h.ownedBytesSeen).toEqual([FREEHOLD_MAX_OWNED_BYTES]);
    expect(loaded.accountId).toBe(ACCOUNT_ID);
    expect(h.store.stats().loads).toBe(1);
  });

  it('collapses concurrent preloads onto one load and clears the slot afterwards', async () => {
    const gate = deferred<FreeholdRowLoad>();
    const h = harness({ readRow: async () => await gate.promise });
    const first = h.store.preload(ACCOUNT_ID);
    const second = h.store.preload(ACCOUNT_ID);
    expect(first).toBe(second);
    gate.resolve({ kind: 'absent' });
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect(h.calls.filter((call) => call === 'readRow')).toHaveLength(1);
    expect(h.store.stats().loads).toBe(1);

    // Drop the entry, then load again: a leaked in-flight slot would replay
    // the settled promise and its already minted plot id instead of reading.
    h.store.retain(OWNER_KEY);
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(0);
    const third = await h.store.preload(ACCOUNT_ID);
    expect(h.store.stats().loads).toBe(2);
    expect(third.plotId).toBe('plot:minted2');
    expect(a.plotId).toBe('plot:minted1');
  });

  it('short circuits with zero database work when the record is already live', async () => {
    const h = harness({ hasLive: () => true });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(h.calls).toEqual([]);
    expect(h.store.stats().loads).toBe(0);
    expect(loaded.state).toBeNull();
    expect(loaded.hold).toBeNull();
  });

  it('does read the row when nothing is live (the other arm of the short circuit)', async () => {
    const h = harness({ hasLive: () => false });
    await h.store.preload(ACCOUNT_ID);
    expect(h.calls).toContain('readRow');
    expect(h.store.stats().loads).toBe(1);
  });

  it('replays what the entry knows on a rejoin, without a second read or a second mint', async () => {
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    h.store.retain(OWNER_KEY);
    const first = await h.store.preload(ACCOUNT_ID);
    const again = await h.store.preload(ACCOUNT_ID);
    expect(h.calls.filter((call) => call === 'readRow')).toHaveLength(1);
    expect(again.state).toEqual(first.state);
    expect(again.durableRev).toBe('7');
  });

  it('refuses rather than falls through when the permit is refused', async () => {
    const h = harness({ acquirePermit: async () => null });
    const loaded = await h.store.preload(ACCOUNT_ID);
    // The absence of a row read is the whole point: a refused permit must
    // never become an unadmitted query.
    expect(h.calls).toEqual(['permit']);
    expect(loaded.hold?.kind).toBe('unadmitted');
    expect(loaded.hold?.detail).toContain(String(FREEHOLD_PERSIST_PERMIT_WAIT_MS));
    expect(h.loadFailures).toEqual(['unadmitted']);
    expect(h.store.stats().loadFailures).toBe(1);
  });

  it('reads the row when the permit is granted (the other arm)', async () => {
    const h = harness({ acquirePermit: async () => ({ release: () => undefined }) });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(h.calls).toContain('readRow');
    expect(loaded.hold).toBeNull();
  });

  it('bounds every permit wait with its own live signal', async () => {
    const h = harness();
    await h.store.preload(ACCOUNT_ID);
    await h.store.preload(OTHER_ACCOUNT_ID);
    expect(h.permitSignals).toHaveLength(2);
    for (const signal of h.permitSignals) {
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    }
    expect(h.permitSignals[0]).not.toBe(h.permitSignals[1]);
  });

  it('refuses past the local concurrency cap, before the shared permit', async () => {
    const gate = deferred<FreeholdRowLoad>();
    const h = harness({ readRow: async () => await gate.promise });
    const running: Promise<LoadedFreehold>[] = [];
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_ACTIVE_LOADS; i++) {
      running.push(h.store.preload(ACCOUNT_ID + i));
    }
    await tick();
    expect(h.calls.filter((call) => call === 'readRow')).toHaveLength(
      FREEHOLD_PERSIST_MAX_ACTIVE_LOADS,
    );
    const permitsBefore = h.calls.filter((call) => call === 'permit').length;
    const refused = await h.store.preload(ACCOUNT_ID + FREEHOLD_PERSIST_MAX_ACTIVE_LOADS);
    expect(refused.hold?.kind).toBe('unadmitted');
    expect(refused.hold?.detail).toContain('cap');
    // The cap sits BEFORE the shared permit, so the refused load never asked
    // the gate for one.
    expect(h.calls.filter((call) => call === 'permit')).toHaveLength(permitsBefore);
    expect(h.calls.filter((call) => call === 'readRow')).toHaveLength(
      FREEHOLD_PERSIST_MAX_ACTIVE_LOADS,
    );

    gate.resolve({ kind: 'absent' });
    const settled = await Promise.all(running);
    for (const load of settled) expect(load.hold).toBeNull();
  });
});

describe('preload classification', () => {
  it('gives an absent row a minted plot id, a null state and a null durable revision', async () => {
    const h = harness({ rowLoad: { kind: 'absent' } });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.state).toBeNull();
    expect(loaded.hold).toBeNull();
    expect(loaded.durableRev).toBeNull();
    expect(loaded.plotId).toBe('plot:minted1');
    expect(loaded.plotIndex).toBe(0);
  });

  it('gives a normalized row its state, plot identity and durable revision', async () => {
    const state = persistedFixture({ condition: 42 });
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state, repaired: [] },
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.state).toBe(state);
    expect(loaded.durableRev).toBe('7');
    expect(loaded.plotId).toBe(ROW_PLOT_ID);
    expect(loaded.hold).toBeNull();
    expect(h.calls).toContain('normalize');
  });

  it('warns about repaired scalars without holding the account', async () => {
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture(), repaired: ['condition', 'rev'] },
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold).toBeNull();
    expect(h.warnings.join(' ')).toContain('condition, rev');
  });

  const holdCases: ReadonlyArray<{
    readonly name: string;
    readonly options: HarnessOptions;
    readonly kind: string;
    readonly detail: string;
  }> = [
    {
      name: 'an unsupported document',
      options: {
        rowLoad: { kind: 'row', row: rowFixture() },
        normalized: { kind: 'unsupported', reason: 'tier', detail: 'lodge' },
      },
      kind: 'unsupported',
      detail: 'tier: lodge',
    },
    {
      name: 'a malformed document',
      options: {
        rowLoad: { kind: 'row', row: rowFixture() },
        normalized: { kind: 'malformed', detail: 'layout is not an array' },
      },
      kind: 'malformed',
      detail: 'layout is not an array',
    },
    {
      name: 'a document over the owned-bytes ceiling',
      options: {
        rowLoad: { kind: 'row', row: rowFixture() },
        normalized: { kind: 'oversize', bytes: 200_000, limit: FREEHOLD_MAX_OWNED_BYTES },
      },
      kind: 'oversize',
      detail: '200000 bytes',
    },
    {
      name: 'a document that normalizes to absent',
      options: {
        rowLoad: { kind: 'row', row: rowFixture() },
        normalized: { kind: 'absent' },
      },
      kind: 'malformed',
      detail: 'normalized to absent',
    },
    {
      name: 'a row the reader called oversize',
      options: {
        rowLoad: {
          kind: 'oversize',
          plotIndex: 0,
          plotId: ROW_PLOT_ID,
          durableRev: '9',
          bytes: 300_000,
          limit: FREEHOLD_MAX_OWNED_BYTES,
        },
      },
      kind: 'oversize',
      detail: '300000 owned bytes',
    },
    {
      name: 'a row the reader would not admit',
      options: {
        rowLoad: {
          kind: 'unadmitted',
          plotIndex: 0,
          plotId: ROW_PLOT_ID,
          durableRev: '9',
          detail: 'two rows claim one account slot',
        },
      },
      kind: 'unadmitted',
      detail: 'two rows claim one account slot',
    },
    {
      name: 'a row read that threw',
      options: {
        readRow: async () => {
          throw new Error('connection reset');
        },
      },
      kind: 'unadmitted',
      detail: 'threw',
    },
  ];

  for (const holdCase of holdCases) {
    it(`holds ${holdCase.name} and writes nothing for it`, async () => {
      const h = harness(holdCase.options);
      h.store.retain(OWNER_KEY);
      const loaded = await h.store.preload(ACCOUNT_ID);
      expect(loaded.hold?.kind).toBe(holdCase.kind);
      expect(loaded.hold?.detail).toContain(holdCase.detail);
      expect(loaded.state).toBeNull();
      expect(h.store.stats().held).toBe(1);
      expect(h.loadFailures).toEqual([holdCase.kind]);

      // Every write door, tried in turn. The absence of a writeRow call is the
      // assertion: the durable row keeps the owner's possessions.
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
      h.store.saveAllDirty();
      await h.store.flushAndRelease(OWNER_KEY);
      await tick();
      expect(h.writeCount()).toBe(0);
      expect(h.writes).toEqual([]);
    });
  }

  it('writes for a load that was NOT held (the contrast arm)', async () => {
    const h = await loadedStore();
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick();
    expect(h.writeCount()).toBe(1);
  });

  it('blocks writes for an entry whose load has not landed yet', async () => {
    const h = harness();
    h.store.retain(OWNER_KEY);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    h.store.saveAllDirty();
    await tick();
    expect(h.writeCount()).toBe(0);
  });
});

describe('the hearth clock', () => {
  it('carries a durable clock through', async () => {
    const h = harness({
      hearthLoad: { kind: 'state', state: { readyAtMs: '5000', revision: '3' } },
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hearthReadyAtMs).toBe(5000);
    expect(loaded.hearthRevision).toBe('3');
  });

  it('starts cold when the clock is absent', async () => {
    const h = harness({ hearthLoad: { kind: 'absent' } });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hearthReadyAtMs).toBe(0);
    expect(loaded.hearthRevision).toBe('0');
  });

  it('starts cold and warns when the clock is unsupported', async () => {
    const h = harness({ hearthLoad: { kind: 'unsupported', detail: 'no table' } });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hearthReadyAtMs).toBe(0);
    expect(h.warnings.join(' ')).toContain('no table');
    // A cold hearth is not a reason to hold the freehold row.
    expect(loaded.hold).toBeNull();
  });

  it('starts cold and never faults the load when the clock read throws', async () => {
    const h = harness({
      readHearth: async () => {
        throw new Error('hearth read exploded');
      },
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hearthReadyAtMs).toBe(0);
    expect(loaded.hold).toBeNull();
    expect(h.errors.join(' ')).toContain('hearth');
  });
});

describe('write coalescing', () => {
  it('costs one running plus one pending write across a burst of a thousand marks', async () => {
    const gate = deferred<FreeholdUpsertResult>();
    let served = 0;
    const h = await loadedStore({
      writeRow: async () => {
        served += 1;
        if (served === 1) return await gate.promise;
        return { kind: 'updated', durableRev: String(served) };
      },
    });
    for (let i = 0; i < 1000; i++) {
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
    }
    await tick();
    expect(h.writeCount()).toBe(1);
    const midFlight = h.store.stats();
    expect(midFlight.running).toBe(1);
    // A pending write only ever exists behind a running one, which is why the
    // removal guard can never see pending true with running false.
    expect(midFlight.pending).toBe(1);

    gate.resolve({ kind: 'updated', durableRev: '1' });
    await tick(30);
    expect(h.writeCount()).toBe(2);
    expect(h.calls.filter((call) => call === 'enqueue')).toHaveLength(2);
    expect(h.store.stats().dirty).toBe(0);
  });

  it('lets an edit during a running write survive, and re-arms exactly once', async () => {
    const gates = [deferred<FreeholdUpsertResult>(), deferred<FreeholdUpsertResult>()];
    let served = 0;
    const h = await loadedStore({
      writeRow: async () => {
        const gate = gates[served];
        served += 1;
        return gate ? await gate.promise : { kind: 'updated', durableRev: 'extra' };
      },
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick();
    expect(h.writeCount()).toBe(1);

    // The edit lands after the running write took its snapshot.
    h.store.markDirty(OWNER_KEY);
    expect(h.store.stats().dirty).toBe(1);

    gates[0]?.resolve({ kind: 'updated', durableRev: '11' });
    await tick(30);
    // Only the committed generation cleared, so the later edit is still dirty
    // and armed exactly one more write.
    expect(h.writeCount()).toBe(2);
    gates[1]?.resolve({ kind: 'updated', durableRev: '12' });
    await tick(30);
    expect(h.writeCount()).toBe(2);
    expect(h.store.stats().dirty).toBe(0);
  });

  it('skips the write entirely when the owner holds no live record', async () => {
    const h = await loadedStore({ serialize: () => null });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.calls).toContain('serialize');
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().running).toBe(0);
  });

  it('writes when the record IS live (the other arm of the null-serialize skip)', async () => {
    const h = await loadedStore({ serialize: () => persistedFixture() });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0]?.plotId).toBe('plot:minted1');
    expect(h.writes[0]?.tier).toBe('inn_room');
    expect(h.writes[0]?.wireRev).toBe(5);
    expect(h.writes[0]?.layoutJson).toContain('oak_chair');
    expect(h.writes[0]?.trophiesJson).toContain('skull_of_something');
  });

  it('fences the first write insert-only and every later one on the durable revision', async () => {
    let served = 0;
    const h = await loadedStore({
      writeRow: async () => {
        served += 1;
        return { kind: served === 1 ? 'inserted' : 'updated', durableRev: `rev${served}` };
      },
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writes.map((write) => write.expectedDurableRev)).toEqual([null, 'rev1']);
  });
});

describe('the periodic sweep detects a moved record without a markDirty call', () => {
  // The record's own revision is the movement signal. setFreeholdTier is the
  // one sanctioned tier writer today and it bumps that revision, and the
  // development grant reaches the record THROUGH it, so a tier change made
  // with no server-side hook must still reach the row on the next sweep.
  it('arms a write when the live revision has left the last written one behind', async () => {
    let rev = 7;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => ({ kind: 'updated', durableRev: '2' }),
    });
    // Nothing moved: the sweep writes nothing at all.
    h.store.saveAllDirty();
    await tick(5);
    expect(h.writeCount()).toBe(0);

    // The one sanctioned writer bumped the revision. No markDirty was called.
    rev = 8;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(8);

    // And it settles: a second sweep after the write does not rewrite.
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
  });

  it('never probes a write-blocked entry, so a held row stays untouched', async () => {
    const h = await loadedStore({
      rowLoad: {
        kind: 'oversize',
        plotIndex: 0,
        plotId: ROW_PLOT_ID,
        durableRev: '4',
        bytes: 1,
        limit: 0,
      },
      serialize: () => persistedFixture({ rev: 999 }),
    });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    // The probe itself is skipped, not just the write: a blocked entry may not
    // write, so knowing it moved buys nothing and costs a serialize per sweep.
    expect(h.calls.filter((call) => call === 'serialize')).toHaveLength(0);
    expect(h.store.stats().held).toBe(1);
  });

  it('persists the seeded default on the first sweep when no durable row existed', async () => {
    // An ABSENT row is the one arm where the sim's own free Inn Room record IS
    // the truth: 05 seeds it, and this store writes it out under a freshly
    // generated identity without ever creating a second default.
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      serialize: () => persistedFixture({ rev: 0 }),
    });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    // Insert-only: there is no durable revision to compare against yet.
    expect(h.writes[0].expectedDurableRev).toBeNull();
  });

  it('treats a record that vanished from the live map as nothing to write', async () => {
    // serializeFreehold answers null when the owner holds no live record, and
    // the contract is to SKIP: a default written over a real row destroys the
    // owner's furnishings, and nothing in this realm holds a second copy.
    const h = await loadedStore({ serialize: () => null });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
  });
});

describe('the FIFO and the permit', () => {
  it('takes the key FIFO first and the permit inside the queued closure', async () => {
    const h = await loadedStore();
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.calls).toEqual(['enqueue', 'permit', 'serialize', 'writeRow', 'release']);
    expect(h.calls.indexOf('enqueue')).toBeLessThan(h.calls.indexOf('permit'));
  });

  it('does not deadlock two owners against a permit gate of one', async () => {
    let held = false;
    const waiting: Array<() => void> = [];
    const h = harness({
      acquirePermit: async () => {
        if (held) await new Promise<void>((resolve) => waiting.push(resolve));
        held = true;
        return {
          release(): void {
            held = false;
            waiting.shift()?.();
          },
        };
      },
    });
    h.store.retain(OWNER_KEY);
    h.store.retain(OTHER_OWNER_KEY);
    await h.store.preload(ACCOUNT_ID);
    await h.store.preload(OTHER_ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    h.store.markDirty(OTHER_OWNER_KEY);
    h.store.saveAllDirty();
    await tick(60);
    expect(h.writeCount()).toBe(2);
    expect(h.store.stats().running).toBe(0);
  });

  it('counts a write that never got a permit as a failure and writes nothing', async () => {
    let loadPermit = true;
    const h = harness({
      acquirePermit: async () => {
        if (loadPermit) {
          loadPermit = false;
          return { release: () => undefined };
        }
        return null;
      },
    });
    h.store.retain(OWNER_KEY);
    await h.store.preload(ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().writeFailures).toBe(1);
    expect(h.warnings.join(' ')).toContain(String(FREEHOLD_PERSIST_PERMIT_WAIT_MS));
  });
});

describe('the stale compare-and-swap quiesce', () => {
  it('stops writing for the owner, counts it, and warns exactly once', async () => {
    const h = await loadedStore({
      writeRow: async () => ({ kind: 'stale', durableRev: '99' }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().staleWrites).toBe(1);
    expect(h.store.stats().held).toBe(1);

    for (let i = 0; i < 5; i++) {
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
      h.store.saveAllDirty();
    }
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(30);
    // Never a blind retry with the re-read revision, and never a second warn.
    expect(h.writeCount()).toBe(1);
    expect(h.warnings.filter((line) => line.includes('quiesced'))).toHaveLength(1);
  });

  const refusals: ReadonlyArray<{ readonly result: FreeholdUpsertResult; readonly name: string }> =
    [
      { name: 'a row that vanished', result: { kind: 'missing' } },
      { name: 'a durable conflict', result: { kind: 'conflict', detail: 'plot id already taken' } },
    ];
  for (const refusal of refusals) {
    it(`quiesces on ${refusal.name} and counts a write failure`, async () => {
      const h = await loadedStore({ writeRow: async () => refusal.result });
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
      await tick(30);
      expect(h.store.stats().writeFailures).toBe(1);
      expect(h.store.stats().staleWrites).toBe(0);
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
      await tick(30);
      expect(h.writeCount()).toBe(1);
    });
  }

  it('does not re-arm itself when the write rejects', async () => {
    const h = await loadedStore({
      writeRow: async () => {
        throw new Error('write blew up');
      },
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().writeFailures).toBe(1);
    expect(h.store.stats().running).toBe(0);
  });
});

describe('reference counting and eviction', () => {
  it('drops the entry when references, running and pending are all clear', async () => {
    const h = await loadedStore();
    expect(h.store.stats().entries).toBe(1);
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(0);
  });

  it('keeps the entry while a reference survives (references alone)', async () => {
    const h = await loadedStore();
    h.store.retain(OWNER_KEY);
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(1);
    expect(h.store.stats().running).toBe(0);
    expect(h.store.stats().pending).toBe(0);
  });

  it('keeps the entry while a write is still running (running alone)', async () => {
    let served = 0;
    const h = await loadedStore({
      writeRow: async () => {
        served += 1;
        // Keep the entry perpetually dirty for a bounded number of writes, so
        // the flush exhausts its pass budget with a write still in flight.
        if (served <= 12) h.store.markDirty(OWNER_KEY);
        return { kind: 'updated', durableRev: `rev${served}` };
      },
    });
    h.store.markDirty(OWNER_KEY);
    await h.store.flushAndRelease(OWNER_KEY);
    const midFlight = h.store.stats();
    expect(midFlight.entries).toBe(1);
    expect(midFlight.running + midFlight.pending).toBeGreaterThan(0);
    expect(served).toBeLessThanOrEqual(FREEHOLD_PERSIST_FLUSH_MAX_PASSES + 1);

    await tick(400);
    // Once the last write settles, all three are clear and the entry goes.
    expect(h.store.stats().entries).toBe(0);
  });

  it('survives the same-account swap when the new retain precedes the old release', async () => {
    const gate = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({ writeRow: async () => await gate.promise });
    h.store.markDirty(OWNER_KEY);
    const leaving = h.store.flushAndRelease(OWNER_KEY);
    // The joining session lands under the SAME owner key before the leaver's
    // flush settles.
    h.store.retain(OWNER_KEY);
    gate.resolve({ kind: 'updated', durableRev: '2' });
    await leaving;
    await tick(30);
    expect(h.store.stats().entries).toBe(1);

    // The surviving entry is still a working writer for the new session.
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(2);
  });

  it('drops the entry when no retain preceded the release (the other arm of the swap)', async () => {
    const gate = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({ writeRow: async () => await gate.promise });
    h.store.markDirty(OWNER_KEY);
    const leaving = h.store.flushAndRelease(OWNER_KEY);
    gate.resolve({ kind: 'updated', durableRev: '2' });
    await leaving;
    expect(h.store.stats().entries).toBe(0);
  });

  it('leaves a clean entry alone on the leave path', async () => {
    const h = await loadedStore();
    await h.store.flushAndRelease(OWNER_KEY);
    await tick();
    expect(h.writeCount()).toBe(0);
  });
});

describe('the bounded drain', () => {
  it('drains a write in flight and cancels its deadline', async () => {
    const gate = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({ writeRow: async () => await gate.promise });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick();
    let drained: boolean | null = null;
    const idle = h.store.idle(5_000).then((value) => {
      drained = value;
    });
    await tick();
    expect(drained).toBeNull();
    gate.resolve({ kind: 'updated', durableRev: '3' });
    await idle;
    expect(drained).toBe(true);
    expect(h.deadlines).toHaveLength(1);
    expect(h.deadlines[0]?.cancelled).toBe(true);
    expect(h.deadlines[0]?.ms).toBe(5_000);
  });

  it('flushes what is dirty before it waits', async () => {
    const h = await loadedStore();
    h.store.markDirty(OWNER_KEY);
    expect(await h.store.idle(5_000)).toBe(true);
    expect(h.writeCount()).toBe(1);
  });

  it('answers false at its deadline without throwing', async () => {
    const never = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({ writeRow: async () => await never.promise });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick();
    const idle = h.store.idle(10);
    await tick();
    expect(h.fireDeadline()).toBe(true);
    await expect(idle).resolves.toBe(false);
    never.resolve({ kind: 'updated', durableRev: '4' });
    await tick(30);
  });

  it('never throws when the write it is draining rejects', async () => {
    const h = await loadedStore({
      writeRow: async () => {
        throw new Error('drain time failure');
      },
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick();
    expect(h.store.stats().writeFailures).toBe(1);
    // The entry never committed, so it is still dirty and the drain flushes it
    // once more. The rejection is absorbed both times: idle still answers.
    await expect(h.store.idle(5_000)).resolves.toBe(true);
    expect(h.writeCount()).toBe(2);
    expect(h.store.stats().writeFailures).toBe(2);
  });

  it('closes intake, and still lets a leaving session flush', async () => {
    const h = await loadedStore();
    expect(await h.store.idle(5_000)).toBe(true);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);

    await h.store.flushAndRelease(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
  });

  it('stop() cancels the deadline without closing intake', async () => {
    const h = await loadedStore();
    h.store.stop();
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
  });

  it('stop() settles an outstanding drain rather than leaving it hanging', async () => {
    const never = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({ writeRow: async () => await never.promise });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick();
    const idle = h.store.idle(60_000);
    await tick();
    h.store.stop();
    await expect(idle).resolves.toBe(false);
    expect(h.deadlines[0]?.cancelled).toBe(true);
    never.resolve({ kind: 'updated', durableRev: '5' });
    await tick(30);
  });
});

describe('the registered store handle', () => {
  it('answers true when no store is registered', async () => {
    registerFreeholdPersistStore(null);
    await expect(freeholdPersistIdle(1_000)).resolves.toBe(true);
  });

  it('delegates to the registered store with the deadline it was given', async () => {
    const idle = vi.fn(async () => true);
    registerFreeholdPersistStore({ idle } as unknown as FreeholdPersistStore);
    await expect(freeholdPersistIdle(1_234)).resolves.toBe(true);
    expect(idle).toHaveBeenCalledWith(1_234);
  });

  it('defaults to the shutdown drain bound', async () => {
    const idle = vi.fn(async () => false);
    registerFreeholdPersistStore({ idle } as unknown as FreeholdPersistStore);
    await expect(freeholdPersistIdle()).resolves.toBe(false);
    expect(idle).toHaveBeenCalledWith(FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS);
  });

  it('answers false rather than throwing when the store rejects', async () => {
    registerFreeholdPersistStore({
      idle: async () => {
        throw new Error('drain exploded');
      },
    } as unknown as FreeholdPersistStore);
    await expect(freeholdPersistIdle(50)).resolves.toBe(false);
  });
});

describe('stats', () => {
  it('carries counts only, never an owner key, an account id or a plot id', async () => {
    const h = await loadedStore({ rowLoad: { kind: 'row', row: rowFixture() } });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    const json = JSON.stringify(h.store.stats());
    expect(json).not.toContain(String(ACCOUNT_ID));
    expect(json).not.toContain(OWNER_KEY);
    expect(json).not.toContain(ROW_PLOT_ID);
    expect(json).not.toContain('plot:');
    expect(json).not.toContain('account:');
    for (const value of Object.values(h.store.stats())) {
      expect(typeof value).toBe('number');
    }
  });

  it('reports the dirty age from the store clock and the last write size', async () => {
    const h = await loadedStore();
    h.setNow(20_000);
    h.store.markDirty(OWNER_KEY);
    h.setNow(23_500);
    expect(h.store.stats().oldestDirtyAgeMs).toBe(3_500);
    h.store.save(OWNER_KEY);
    await tick(30);
    const after = h.store.stats();
    expect(after.oldestDirtyAgeMs).toBe(0);
    expect(after.writes).toBe(1);
    expect(after.lastWriteBytes).toBeGreaterThan(0);
    expect(after.permitWaitMsTotal).toBeGreaterThanOrEqual(0);
    expect(after.queueWaitMsTotal).toBeGreaterThanOrEqual(0);
  });
});

describe('installLoadedFreehold', () => {
  const loadedFixture = (overrides: Partial<LoadedFreehold> = {}): LoadedFreehold => ({
    accountId: ACCOUNT_ID,
    plotIndex: 0,
    plotId: ROW_PLOT_ID,
    durableRev: '7',
    state: persistedFixture(),
    hearthReadyAtMs: 0,
    hearthRevision: '0',
    hold: null,
    ...overrides,
  });

  it('installs a loaded record synchronously under the account owner key', () => {
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, loadedFixture());
    const record = ctx.freeholds.get(OWNER_KEY);
    expect(record?.plotId).toBe(ROW_PLOT_ID);
    expect(record?.tier).toBe('inn_room');
    expect(record?.condition).toBe(87);
    expect(record?.layout).toHaveLength(1);
    expect(record?.rev).toBe(5);
    // Ephemeral build presence never comes back from a row.
    expect(record?.isDecorating).toBe(false);
  });

  it('installs nothing for an absent load', () => {
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, loadedFixture({ state: null }));
    expect(ctx.freeholds.size).toBe(0);
  });

  it('installs nothing for a held load', () => {
    const ctx = fakeCtx();
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      loadedFixture({
        hold: { kind: 'malformed', detail: 'bad layout', plotIndex: 0, durableRev: '7' },
        hearthReadyAtMs: 90_000,
      }),
    );
    expect(ctx.freeholds.size).toBe(0);
    expect(ctx.freeholdKeyReadyAtMs.size).toBe(0);
  });

  it('installs nothing when there is no load at all', () => {
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, undefined);
    expect(ctx.freeholds.size).toBe(0);
  });

  it('moves the hearth clock forward when the durable clock is ahead', () => {
    const ctx = fakeCtx();
    ctx.freeholdKeyReadyAtMs.set(OWNER_KEY, 1_000);
    installLoadedFreehold(ctx, ACCOUNT_ID, loadedFixture({ hearthReadyAtMs: 90_000 }));
    expect(ctx.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(90_000);
  });

  it('leaves the hearth clock alone when the durable clock is behind', () => {
    const ctx = fakeCtx();
    ctx.freeholdKeyReadyAtMs.set(OWNER_KEY, 90_000);
    installLoadedFreehold(ctx, ACCOUNT_ID, loadedFixture({ hearthReadyAtMs: 1_000 }));
    expect(ctx.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(90_000);
  });

  it('is discarded by the load-once rule when it runs after the default seed', () => {
    const ctx = fakeCtx();
    // What the join seed would have put there first.
    ctx.freeholds.set(OWNER_KEY, {
      ownerKey: OWNER_KEY,
      plotId: 'plot:unassigned',
      tier: 'inn_room',
      layout: [],
      trophies: [],
      condition: 100,
      conditionStampDay: 0,
      ledgerPaidThroughDay: 0,
      ledgerPrepaidWeeks: 0,
      visitPolicy: 'closed',
      isDecorating: false,
      rev: 0,
    } as never);
    installLoadedFreehold(ctx, ACCOUNT_ID, loadedFixture());
    expect(ctx.freeholds.get(OWNER_KEY)?.plotId).toBe('plot:unassigned');
  });

  it('installs nothing on a dark host', () => {
    const ctx = fakeCtx(false);
    installLoadedFreehold(ctx, ACCOUNT_ID, loadedFixture());
    expect(ctx.freeholds.size).toBe(0);
  });
});

describe('the coordinator side of the wiring (source pins)', () => {
  // server/game.ts and server/main.ts are not unit-drivable (one boots a world
  // loop, the other a server and a pool), so the ORDER guarantees this store
  // depends on are pinned structurally, on comment-stripped source, in the
  // tests/server/main_retention_wiring.test.ts idiom. Every needle is a CALL
  // form so an import line can never satisfy one, and prose describing the
  // order can never keep a broken order green.
  const GAME = stripComments(
    readFileSync(new URL('../../server/game.ts', import.meta.url), 'utf8'),
  );
  const MAIN = stripComments(
    readFileSync(new URL('../../server/main.ts', import.meta.url), 'utf8'),
  );

  it('scans the real coordinators (the presence control for the order pins)', () => {
    expect(GAME).toContain('this.sim.addPlayer(');
    expect(GAME).toContain('this.sim.removePlayer(');
    expect(MAIN).toContain('createWsAuth(');
  });

  it('installs the durable record BEFORE the sim seeds its default', () => {
    // loadFreehold and ensureFreeholdRecord are both LOAD-ONCE. A call placed
    // after addPlayer is a silent no-op that discards the owner's real plot and
    // leaves them standing in an empty Inn Room, which the next sweep would
    // then write over their furnishings. This ordering is the whole guard.
    const body = methodBody(GAME, '  join(');
    const install = body.indexOf('installLoadedFreehold(this.sim.ctx, accountId, meta.freehold)');
    const retain = body.indexOf('this.freeholdPersist.retain(');
    const addPlayer = body.indexOf('this.sim.addPlayer(');
    expect(install).toBeGreaterThan(-1);
    expect(retain).toBeGreaterThan(-1);
    expect(addPlayer).toBeGreaterThan(-1);
    expect(install).toBeLessThan(addPlayer);
    // The retain is SYNCHRONOUS on the join path and ahead of the seed, so a
    // same-account character swap (whose fire-and-forget leave releases the old
    // session) can never drop the entry under the arriving one.
    expect(retain).toBeLessThan(addPlayer);
  });

  it('flushes the plot after the character save and before the record is evicted', () => {
    // removePlayer reaches releaseFreeholdOnLeave, which evicts once the last
    // session sharing the owner key leaves; serializeFreehold then answers null
    // and a flush placed after it writes nothing, silently.
    const body = methodBody(GAME, '  async leave(session: ClientSession, _reason: string)');
    const characterSave = body.indexOf('this.saveCharacterOnLeave(');
    const plotFlush = body.indexOf('this.freeholdPersist.flushAndRelease(');
    const removePlayer = body.indexOf('this.sim.removePlayer(');
    const leaseRelease = body.indexOf('releaseCharacterLease(');
    expect(characterSave).toBeGreaterThan(-1);
    expect(plotFlush).toBeGreaterThan(characterSave);
    expect(removePlayer).toBeGreaterThan(plotFlush);
    // And inside this process's lease window: once the lease drops, a
    // replacement process can load the same account's plot and write it.
    expect(leaseRelease).toBeGreaterThan(plotFlush);
  });

  it('registers the store once and tears its timers down with the coordinator', () => {
    expect(GAME.split('registerFreeholdPersistStore(').length - 1).toBe(1);
    expect(GAME.split('createGameFreeholdPersistStore(').length - 1).toBe(1);
    expect(GAME).toContain('this.freeholdPersist.stop();');
    // The guild-bank loader keeps its pinned position as stop()'s FIRST
    // statement, so the housing teardown lands after it, never before.
    const stopBody = methodBody(GAME, '  stop(): void {');
    const guildStop = stopBody.indexOf('this.guildBankLazyLoader.stop();');
    const freeholdStop = stopBody.indexOf('this.freeholdPersist.stop();');
    expect(guildStop).toBeGreaterThan(-1);
    expect(freeholdStop).toBeGreaterThan(guildStop);
  });

  it('sweeps the plots on the periodic flush, exactly once', () => {
    const body = methodBody(GAME, '  private flushPeriodicSaves(');
    expect(body.split('this.saveFreeholds(').length - 1).toBe(1);
    expect(body).toContain('AUTOSAVE_SECONDS');
  });

  it('pays no durable housing query on a dark realm, and answers a hold rather than absence', () => {
    // The realm flag is read LIVE per fresh join. Dark must answer a HOLD: an
    // absence would invite the store to generate an identity and persist an
    // empty default over a row this realm never read.
    expect(MAIN).toContain('freeholdsEnabled(process.env)');
    expect(MAIN).toContain('freeholdPreloadForAccount(id)');
    expect(MAIN).toContain('freeholdPreloadUnavailable(id,');
    const dep = MAIN.indexOf('freeholdForAccount: (id) =>');
    const gate = MAIN.indexOf('freeholdsEnabled(process.env)', dep);
    const preload = MAIN.indexOf('freeholdPreloadForAccount(id)', dep);
    expect(dep).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(dep);
    expect(preload).toBeGreaterThan(gate);
  });
});
