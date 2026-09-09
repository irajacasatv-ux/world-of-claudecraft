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
  FREEHOLD_PERSIST_LEAVE_FLUSH_MS,
  FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE,
  FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS,
  FREEHOLD_PERSIST_MAX_ACTIVE_LOADS,
  FREEHOLD_PERSIST_MAX_ACTIVE_WRITES,
  FREEHOLD_PERSIST_MAX_WRITE_ERRORS,
  FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES,
  FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS,
  FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS,
  FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS,
  type FreeholdPersistPorts,
  type FreeholdPersistStore,
  freeholdPersistIdle,
  installLoadedFreehold,
  type LoadedFreehold,
  registerFreeholdPersistStore,
} from '../../server/freehold_persist';
import { createKeyedSerialWriter } from '../../server/serial_writer';
import {
  FREEHOLD_MAX_LAYOUT_ROWS,
  FREEHOLD_MAX_OWNED_BYTES,
  FREEHOLD_MAX_STORED_BYTES,
  FREEHOLD_MAX_TROPHY_ROWS,
  type FreeholdLoadResult,
  type PersistedFreehold,
  persistedFreeholdBytes,
} from '../../src/sim/freehold/persisted';
import { PENDING_FREEHOLD_PLOT_ID } from '../../src/sim/freehold/state';
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

/**
 * The milliseconds an `AbortSignal.timeout(ms)` was built with, recovered by
 * racing it against real timers. Vitest's fake timers do not reach into the
 * signal, and the constant is the thing under test, so the deadline has to be
 * read from the signal rather than assumed from the source.
 */
function timeoutMsOf(signal: AbortSignal): number {
  const recorded = signalDeadlines.get(signal);
  if (recorded === undefined) throw new Error('signal was not created through the patched timeout');
  return recorded;
}

/** Every AbortSignal.timeout this file's subject creates, with its deadline.
 *  Patched once, restored in afterEach, so the store keeps using the real API
 *  and the test only observes it. */
const signalDeadlines = new WeakMap<AbortSignal, number>();
const realAbortTimeout = AbortSignal.timeout.bind(AbortSignal);
AbortSignal.timeout = ((ms: number) => {
  const signal = realAbortTimeout(ms);
  signalDeadlines.set(signal, ms);
  return signal;
}) as typeof AbortSignal.timeout;

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
  enabled?: () => boolean;
  /** Override the LIVE record's plot identity, for the cases that model a
   *  record the store did not install: a fresh seed standing where a loaded
   *  house used to be. */
  livePlotId?: string | (() => string);
  acquirePermit?: (signal: AbortSignal) => Promise<{ release(): void } | null>;
  enqueue?: <T>(key: string, signal: AbortSignal, write: () => Promise<T>) => Promise<T>;
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
  const deadlines: DeadlineJob[] = [];
  const permitSignals: AbortSignal[] = [];
  const ownedBytesSeen: number[] = [];
  // The LIVE record's plot identity, modelled the way the server maintains it:
  // a row load installs the row's state (so the record carries the row's id), a
  // fresh account seeds the pending placeholder, and a committed write stamps
  // the minted id onto the record. Without this the harness would serialize
  // documents whose identity the real sim could never produce, and the store's
  // identity seal would fire on fixtures rather than on the race it guards.
  const fallbackPlotId =
    options.rowLoad?.kind === 'row' ? options.rowLoad.row.plotId : PENDING_FREEHOLD_PLOT_ID;
  const livePlotIdNow = (): string =>
    typeof options.livePlotId === 'function'
      ? options.livePlotId()
      : (options.livePlotId ?? fallbackPlotId);
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
    identitySets() {
      // The fixture vocabulary, so the harness's own documents are admissible
      // on BOTH sides exactly as a realm's are.
      return {
        validTierIds: new Set(['inn_room', 'cottage', 'manor']) as ReadonlySet<string>,
        validVisitPolicies: new Set(['closed', 'friends', 'open']) as ReadonlySet<string>,
      };
    },
    normalize(): FreeholdLoadResult {
      calls.push('normalize');
      return options.normalized ?? { kind: 'loaded', state: persistedFixture(), repaired: [] };
    },
    serialize(ownerKey: string): PersistedFreehold | null {
      calls.push('serialize');
      const doc = serialize(ownerKey);
      // The identity is the LIVE RECORD's, never the fixture's: a case that
      // wants to model a mismatched record says so by overriding the port.
      return doc === null ? null : { ...doc, plotId: livePlotIdNow() };
    },
    liveRev(ownerKey: string): number | null {
      calls.push('liveRev');
      // The cheap probe answers from the SAME record serialize() would clone,
      // so a test that moves the fixture's revision moves both. It also agrees
      // with hasLive, because in the server both read one map: a case that says
      // nothing is live must not be handed a revision.
      if (options.hasLive && !options.hasLive(ownerKey)) return null;
      return serialize(ownerKey)?.rev ?? null;
    },
    hasLive(ownerKey: string): boolean {
      return options.hasLive ? options.hasLive(ownerKey) : false;
    },
    enabled(): boolean {
      return options.enabled ? options.enabled() : true;
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
      if (options.enqueue) return options.enqueue(key, signal, write);
      return fifo.enqueueCancellable(key, signal, write);
    },
    nowMs(): number {
      return nowMs;
    },
    warn(message: string): void {
      warnings.push(message);
    },
    error(message: string, err?: unknown): void {
      // The DETAIL too, because the bounded-error rule is about what rides the
      // second argument: a harness that dropped it could not tell a classified
      // error object from a raw one carrying row content.
      errors.push(err === undefined ? message : `${message} ${JSON.stringify(err)}`);
    },
    scheduleDeadline(callback: () => void, ms: number): () => void {
      const job: DeadlineJob = {
        ms,
        // Recorded, so "the deadline never fired" is a fact a case can assert
        // rather than a field nothing ever writes.
        fire: () => {
          job.fired = true;
          callback();
        },
        cancelled: false,
        fired: false,
      };
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
  it('pins every bound this store enforces, to a literal', () => {
    // TO A LITERAL, because every other use of these in this file compares a
    // measurement against the constant itself. A self-comparison cannot notice
    // that the value moved: raising the write cap to Infinity or the leave
    // deadline to ten minutes leaves every such assertion green, and the second
    // one is a ten-minute logout block nothing would catch.
    expect(FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS).toBe(10_000);
    expect(FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS).toBe(15_000);
    expect(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS).toBe(5_000);
    expect(FREEHOLD_PERSIST_MAX_ACTIVE_LOADS).toBe(4);
    expect(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES).toBe(4);
    expect(FREEHOLD_PERSIST_FLUSH_MAX_PASSES).toBe(4);
    expect(FREEHOLD_PERSIST_LEAVE_FLUSH_MS).toBe(2_000);
    expect(FREEHOLD_PERSIST_MAX_WRITE_ERRORS).toBe(3);
    expect(FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS).toBe(300_000);
    expect(FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES).toBe(2);
    // The login path's budget must stay SHORTER than the background write's.
    // They were one constant once, and merging them again would put a
    // background write's fifteen seconds on a player's handshake.
    expect(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS).toBeLessThan(
      FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS,
    );
  });

  it('spends the LOAD budget on the login path and the WRITE budget on a save', async () => {
    // Not the message, the SIGNAL. The refusal detail names a number, so an
    // implementation that pointed the login read at the write budget would
    // still print 5000 and pass a message assertion. This reads the abort
    // deadline of the signal the store actually handed the gate.
    const signals: AbortSignal[] = [];
    const gate = deferred<{ release(): void } | null>();
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      acquirePermit: async (signal) => {
        signals.push(signal);
        return await gate.promise;
      },
    });
    const loading = h.store.preload(ACCOUNT_ID);
    await tick(5);
    expect(signals).toHaveLength(1);
    const loadDeadline = timeoutMsOf(signals[0]);

    gate.resolve({ release: () => {} });
    await loading;
    h.store.markDirty(OWNER_KEY);
    h.store.retain(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(20);
    expect(signals.length).toBeGreaterThan(1);
    const writeDeadline = timeoutMsOf(signals[signals.length - 1]);

    expect(loadDeadline).toBe(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS);
    expect(writeDeadline).toBe(FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS);
    expect(loadDeadline).toBeLessThan(writeDeadline);
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
    // The STORED ceiling reaches SQL, never the canonical one. The two are
    // pinned as DIFFERENT numbers here, so a future edit that collapses them
    // back into one fails this line rather than silently making every maximal
    // record unreadable.
    expect(h.ownedBytesSeen).toEqual([FREEHOLD_MAX_STORED_BYTES]);
    expect(FREEHOLD_MAX_STORED_BYTES).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES);
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

  it('installs nothing when the record is already live, but still learns the row', async () => {
    // A second character of the same account is joining, so the LIVE record is
    // the truth and the answer carries no state either way. The read still has
    // to happen: without it the entry never learns its plot id or its durable
    // revision, and an entry that never loaded is write-blocked for the whole
    // session, so the owner would play, furnish, and have every edit silently
    // discarded at logout.
    const h = harness({ hasLive: () => true, rowLoad: { kind: 'row', row: rowFixture() } });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(h.calls).toContain('readRow');
    expect(loaded.state).toBeNull();
    expect(loaded.hold).toBeNull();
    // Learned, so the session can write: identity and fence both present.
    expect(loaded.plotId).toBe(ROW_PLOT_ID);
    expect(loaded.durableRev).toBe('7');
  });

  it('short circuits with zero database work once the entry has already loaded', async () => {
    // The other half: the read happens ONCE. A third character joining the same
    // account must not re-read the row.
    let liveNow = false;
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      hasLive: () => liveNow,
    });
    h.store.retain(OWNER_KEY);
    await h.store.preload(ACCOUNT_ID);
    h.calls.length = 0;
    liveNow = true;
    const again = await h.store.preload(ACCOUNT_ID);
    expect(h.calls).toEqual([]);
    expect(again.state).toBeNull();
    expect(again.durableRev).toBe('7');
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

  it('replays the HEARTH CLOCK it learned, never a cold one', async () => {
    // The replay arms issue no read of their own, so a hard-coded zero here
    // would tell a second character of the same account that the shared travel
    // cooldown is ready when the read that took it said otherwise. The clock is
    // account-wide precisely so a second character cannot double the budget.
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      hearthLoad: { kind: 'state', state: { readyAtMs: '1700000000000', revision: '4' } },
    });
    h.store.retain(OWNER_KEY);
    const first = await h.store.preload(ACCOUNT_ID);
    expect(first.hearthReadyAtMs).toBe(1_700_000_000_000);

    const rejoin = await h.store.preload(ACCOUNT_ID);
    expect(h.calls.filter((call) => call === 'readHearth')).toHaveLength(1);
    expect(rejoin.hearthReadyAtMs).toBe(1_700_000_000_000);
    expect(rejoin.hearthRevision).toBe('4');
  });

  it('replays the hearth clock on the already-live arm too', async () => {
    let liveNow = false;
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      hearthLoad: { kind: 'state', state: { readyAtMs: '1700000000000', revision: '4' } },
      hasLive: () => liveNow,
    });
    h.store.retain(OWNER_KEY);
    await h.store.preload(ACCOUNT_ID);
    liveNow = true;
    const second = await h.store.preload(ACCOUNT_ID);
    // No state, because the live record is the truth; but the clock is a
    // separate durable fact and this arm must not report it cold.
    expect(second.state).toBeNull();
    expect(second.hearthReadyAtMs).toBe(1_700_000_000_000);
    expect(second.hearthRevision).toBe('4');
  });

  it('refuses rather than falls through when the permit is refused', async () => {
    const h = harness({ acquirePermit: async () => null });
    const loaded = await h.store.preload(ACCOUNT_ID);
    // The absence of a row read is the whole point: a refused permit must
    // never become an unadmitted query.
    expect(h.calls).toEqual(['permit']);
    expect(loaded.hold?.kind).toBe('unadmitted');
    expect(loaded.hold?.detail).toContain(String(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS));
    expect(h.store.stats().loadFailures).toBe(1);
    // Split by kind, because the four causes want four operator responses.
    expect(h.store.stats().loadFailuresByKind).toEqual({ unadmitted: 1 });
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
    // The line comes from the sim's own reporter, in its vocabulary, so the
    // bound on what may reach a log lives in one place.
    expect(h.warnings.join(' ')).toContain('repaired:condition,rev');
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
        // The detail the real normalizer produces for an unadmitted tier. A
        // raw tier id here would be a fixture the sim never emits, and the
        // reporter's positive shape bound would replace it, which is the point:
        // row content does not reach a log.
        normalized: { kind: 'unsupported', reason: 'tier', detail: 'not_admitted' },
      },
      kind: 'unsupported',
      detail: 'tier:not_admitted',
    },
    {
      name: 'a malformed document',
      options: {
        rowLoad: { kind: 'row', row: rowFixture() },
        normalized: { kind: 'malformed', detail: 'layout_not_an_array' },
      },
      kind: 'malformed',
      detail: 'layout_not_an_array',
    },
    {
      name: 'a document over the owned-bytes ceiling',
      options: {
        rowLoad: { kind: 'row', row: rowFixture() },
        normalized: { kind: 'oversize', bytes: 200_000, limit: FREEHOLD_MAX_OWNED_BYTES },
      },
      kind: 'oversize',
      detail: 'bytes:200000:limit:',
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
          detoastRefused: false,
          diskBytes: 200_000,
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
      expect(h.store.stats().loadFailuresByKind).toEqual({ [holdCase.kind]: 1 });

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
    // Five hundred marks BEFORE the running write samples its document. All of
    // them are covered by that one write, so none of them earns a second.
    for (let i = 0; i < 500; i++) {
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
    }
    await tick();
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().running).toBe(1);
    expect(h.store.stats().pending).toBe(0);

    // Five hundred more AFTER it sampled. Those are real later edits, and they
    // cost exactly ONE pending write between them, never five hundred.
    for (let i = 0; i < 500; i++) {
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
    }
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

  it('reads ONE integer per loaded owner and clones nothing when nothing moved', async () => {
    // This probe runs synchronously inside the 20 Hz loop body, so its cost is
    // tick cost. Cloning every loaded record here to read one revision put
    // O(owners x layout rows) of copying and garbage on one tick every thirty
    // seconds: measured in tens of milliseconds at five thousand owners against
    // a fifty millisecond budget. The clean sweep must touch serialize ZERO
    // times; only a write may clone.
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev: 7 }),
    });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.calls.filter((call) => call === 'liveRev')).toHaveLength(1);
    expect(h.calls.filter((call) => call === 'serialize')).toHaveLength(0);
    expect(h.writeCount()).toBe(0);
  });

  it('arms a write when the live revision moved BACKWARDS, not only forwards', async () => {
    // A backwards revision is a reload of an older record into a live slot, and
    // the row must follow the record this realm is actually serving. Pinned
    // because the forward arm alone would let an equality-to-inequality edit
    // pass unnoticed.
    let rev = 7;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => ({ kind: 'updated', durableRev: '2' }),
    });
    rev = 6;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(6);
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
        detoastRefused: false,
        diskBytes: 200_000,
      },
      serialize: () => persistedFixture({ rev: 999 }),
    });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    // The probe itself is skipped, not just the write: a blocked entry may not
    // write, so knowing it moved buys nothing and costs a serialize per sweep.
    expect(h.calls.filter((call) => call === 'serialize')).toHaveLength(0);
    expect(h.calls.filter((call) => call === 'liveRev')).toHaveLength(0);
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
    expect(h.warnings.join(' ')).toContain(String(FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS));
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
    // Quiesced, NOT held. The two are separate measures because a rising
    // quiesce count means a writer this realm does not know about is touching
    // these rows, which is exactly what the fence exists to surface, and a
    // recovery hold means something else entirely.
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.store.stats().held).toBe(0);

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

describe('one edit is one durable write, however many arms land on it', () => {
  // A durable write is not free: it rewrites both content columns, burns a
  // compare-and-swap revision and touches updated_at. Re-sending the SAME
  // document because a second arm arrived while the first write was in flight
  // doubles all of that, and shutdown makes it routine rather than rare
  // (saveFreeholds arms every dirty owner, then freeholdPersistIdle arms every
  // one of them again while those writes are still queued on the gate). Each
  // case here drives one real edit through a DIFFERENT arming sequence and
  // asserts one writeRow, and the last case proves the coalescer still lets a
  // genuinely later edit through.

  /** A loaded store whose single write is held open, so every case can arm
   *  again while the first write is genuinely still running. */
  async function heldWriteStore() {
    let rev = 7;
    const gate = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => await gate.promise,
    });
    return {
      h,
      gate,
      edit(next: number): void {
        rev = next;
      },
    };
  }

  it('writes once across the shutdown sequence: a sweep, then the idle drain', async () => {
    const { h, gate, edit } = await heldWriteStore();
    edit(8);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);

    // The write is still out on the gate. This is exactly what server/main.ts
    // does next, and it must not queue a second copy of the same document.
    const drained = h.store.idle(5_000);
    await tick(10);
    gate.resolve({ kind: 'updated', durableRev: '8' });
    await tick(40);
    expect(await drained).toBe(true);
    expect(h.writeCount()).toBe(1);
    expect(h.writes.map((w) => w.wireRev)).toEqual([8]);
  });

  it('writes once across two overlapping sweeps', async () => {
    const { h, gate, edit } = await heldWriteStore();
    edit(8);
    h.store.saveAllDirty();
    await tick(30);
    h.store.saveAllDirty();
    await tick(10);
    gate.resolve({ kind: 'updated', durableRev: '8' });
    await tick(40);
    expect(h.writeCount()).toBe(1);
  });

  it('writes once across a sweep and the leaving flush', async () => {
    const { h, gate, edit } = await heldWriteStore();
    edit(8);
    h.store.saveAllDirty();
    await tick(30);
    const left = h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    gate.resolve({ kind: 'updated', durableRev: '8' });
    await left;
    await tick(20);
    expect(h.writeCount()).toBe(1);
  });

  it('still writes a SECOND time for an edit that arrives after the snapshot', async () => {
    // The anti-vacuity arm. Without it every case above would pass on a store
    // that had simply stopped coalescing a second write into existence at all,
    // which would silently drop the last edit of every session.
    const { h, gate, edit } = await heldWriteStore();
    edit(8);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);

    // A real, later edit while the first write is out.
    edit(9);
    h.store.saveAllDirty();
    await tick(10);
    gate.resolve({ kind: 'updated', durableRev: '8' });
    await tick(40);
    expect(h.writes.map((w) => w.wireRev)).toEqual([8, 9]);
  });
});

describe('the save path refuses what the load path would refuse', () => {
  // WRITABLE IMPLIES READABLE. Without this, a realm can mint a row past its
  // own load ceilings and then hold that account read-only forever, from a row
  // it produced itself. Every case here asserts the ABSENCE of a writeRow call:
  // the refusal has to happen before the statement, not after it.

  /** A 64-CHARACTER id that is 192 BYTES. Legal by the id-length rule, which
   *  counts characters, and the reason the byte ceiling exists at all. */
  const wideId = String.fromCharCode(0x65e5).repeat(64);

  function oversizePersisted(): PersistedFreehold {
    return persistedFixture({
      layout: Array.from({ length: FREEHOLD_MAX_LAYOUT_ROWS }, (_unused, i) => ({
        placementId: i,
        itemId: wideId,
        x: -0.0000012345678901234567,
        y: -0.0000012345678901234567,
        z: -0.0000012345678901234567,
        yaw: -0.0000012345678901234567,
      })),
      rev: 8,
    });
  }

  async function refusingStore(persisted: PersistedFreehold) {
    return await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persisted,
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
  }

  it('is not vacuous: the oversize fixture really is over the byte ceiling with legal row counts', () => {
    const doc = oversizePersisted();
    expect(doc.layout).toHaveLength(FREEHOLD_MAX_LAYOUT_ROWS);
    expect(doc.trophies.length).toBeLessThanOrEqual(FREEHOLD_MAX_TROPHY_ROWS);
    expect(persistedFreeholdBytes(doc)).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES);
  });

  it('writes nothing for a document past the byte ceiling and quiesces the owner', async () => {
    const h = await refusingStore(oversizePersisted());
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    expect(h.calls).not.toContain('writeRow');
    expect(h.store.stats().writeFailures).toBe(1);
    expect(h.errors).toHaveLength(1);
    expect(h.errors[0]).toContain('oversize');
    expect(h.errors[0]).toContain(String(FREEHOLD_MAX_OWNED_BYTES));
    // The identity of the owner never reaches the message.
    expect(h.errors[0]).not.toContain(String(ACCOUNT_ID));
  });

  it('does not retry the refused document on the next sweep', async () => {
    const h = await refusingStore(oversizePersisted());
    h.store.saveAllDirty();
    await tick(30);
    h.store.saveAllDirty();
    await tick(30);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    // One warning, not one per sweep: a quiesced owner is reported once.
    expect(h.errors).toHaveLength(1);
  });

  it('writes nothing for a document past the layout row ceiling', async () => {
    const overLong = persistedFixture({
      layout: Array.from({ length: FREEHOLD_MAX_LAYOUT_ROWS + 1 }, (_unused, i) => ({
        placementId: i,
        itemId: 'oak_chair',
        x: 0,
        y: 0,
        z: 0,
        yaw: 0,
      })),
      rev: 8,
    });
    const h = await refusingStore(overLong);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    expect(h.errors[0]).toContain('layout_over_ceiling');
    expect(h.errors[0]).toContain(String(FREEHOLD_MAX_LAYOUT_ROWS + 1));
  });

  it('writes nothing for a document past the trophy row ceiling', async () => {
    const overLong = persistedFixture({
      trophies: Array.from({ length: FREEHOLD_MAX_TROPHY_ROWS + 1 }, (_unused, i) => ({
        plinth: i,
        trophyId: 'skull_of_something',
      })),
      rev: 8,
    });
    const h = await refusingStore(overLong);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    expect(h.errors[0]).toContain('trophies_over_ceiling');
  });

  it('reports the row ceiling first for a document that breaks both', async () => {
    const both = persistedFixture({
      layout: Array.from({ length: FREEHOLD_MAX_LAYOUT_ROWS + 1 }, (_unused, i) => ({
        placementId: i,
        itemId: wideId,
        x: -0.0000012345678901234567,
        y: -0.0000012345678901234567,
        z: -0.0000012345678901234567,
        yaw: -0.0000012345678901234567,
      })),
      rev: 8,
    });
    // Genuinely both, so the ordering claim is not vacuous.
    expect(persistedFreeholdBytes(both)).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES);
    const h = await refusingStore(both);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.errors[0]).toContain('layout_over_ceiling');
    expect(h.errors[0]).not.toContain('oversize');
  });

  it('still writes a document inside every ceiling', async () => {
    // The anti-vacuity arm: the same harness, one legal document, one write.
    const h = await refusingStore(persistedFixture({ rev: 8 }));
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().writeFailures).toBe(0);
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
    // Clean means what the SWEEP means by clean: the live record's revision
    // matches the last written one. Rewriting an unchanged document on every
    // logout would burn a durable revision per leave.
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: 5 }),
    });
    await h.store.flushAndRelease(OWNER_KEY);
    await tick();
    expect(h.writeCount()).toBe(0);
  });

  it('flushes a record that moved since the last sweep, with no markDirty call', async () => {
    // THE LAST WINDOW. A tier change made between the final sweep and the
    // logout bumps only the record's revision; a leave path testing markDirty
    // alone would drop it, and there is no next sweep to catch it.
    let rev = 5;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    rev = 6;
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(20);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(6);
  });
});

describe('a durable answer no repeat can fix stops the writes', () => {
  it('quiesces after a run of thrown writes, and not before', async () => {
    // A stale or refused answer quiesces on the FIRST reply, because no repeat
    // can change it. A thrown write might be a connection blip, so it gets a
    // few chances; without any bound a row this realm genuinely cannot write is
    // retried on every sweep for the life of the process.
    let rev = 7;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => {
        throw new Error('connection terminated unexpectedly');
      },
    });
    for (let attempt = 1; attempt < FREEHOLD_PERSIST_MAX_WRITE_ERRORS; attempt++) {
      rev += 1;
      h.store.saveAllDirty();
      await tick(30);
      expect(h.writeCount()).toBe(attempt);
      // Still trying: the entry is not quiesced yet.
      expect(h.store.stats().quiesced).toBe(0);
    }
    rev += 1;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(FREEHOLD_PERSIST_MAX_WRITE_ERRORS);
    expect(h.store.stats().quiesced).toBe(1);

    // And it really stops: every later sweep costs nothing.
    for (let i = 0; i < 5; i++) {
      rev += 1;
      h.store.saveAllDirty();
      await tick(30);
    }
    expect(h.writeCount()).toBe(FREEHOLD_PERSIST_MAX_WRITE_ERRORS);
  });

  it('resets the error run on a commit, so a blip never accumulates across a session', async () => {
    // Without the reset, three unrelated blips spread over hours would quiesce
    // a perfectly healthy owner.
    let rev = 7;
    let fail = true;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => {
        if (fail) throw new Error('connection terminated unexpectedly');
        return { kind: 'updated', durableRev: String(rev) };
      },
    });
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_WRITE_ERRORS - 1; i++) {
      rev += 1;
      h.store.saveAllDirty();
      await tick(30);
    }
    fail = false;
    rev += 1;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.store.stats().quiesced).toBe(0);

    // The run is back to zero: two more throws still do not quiesce.
    fail = true;
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_WRITE_ERRORS - 1; i++) {
      rev += 1;
      h.store.saveAllDirty();
      await tick(30);
    }
    expect(h.store.stats().quiesced).toBe(0);
  });

  it('never replays a quiesced entry as if its house were current', async () => {
    // A quiesced entry has NO hold, and it is exactly the entry whose knowledge
    // is known to be stale: the durable revision moved under this realm, which
    // is what the fence exists to detect. Replaying it on a rejoin would
    // install a house another writer has already replaced.
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => ({ kind: 'stale', durableRev: '99' }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.store.stats().quiesced).toBe(1);

    const again = await h.store.preload(ACCOUNT_ID);
    expect(again.state).toBeNull();
    // And no second read went out: the entry is still loaded, just untrusted.
    expect(h.calls.filter((call) => call === 'readRow')).toHaveLength(0);
  });
});

describe('the coalescer, the drain and the age report at their stated edges', () => {
  it('treats a revision that went BACKWARDS as movement, not as clean', () => {
    // Documented and load-bearing: a backwards revision is an older record
    // reloaded into a live slot, and the row should follow the record this
    // realm is actually serving. A `<=` comparison would call it clean and
    // leave the row showing a house the player is no longer in.
    return (async () => {
      let rev = 8;
      const h = await loadedStore({
        rowLoad: { kind: 'row', row: rowFixture() },
        normalized: { kind: 'loaded', state: persistedFixture({ rev: 8 }), repaired: [] },
        serialize: () => persistedFixture({ rev }),
        writeRow: async () => ({ kind: 'updated', durableRev: '9' }),
      });
      h.store.saveAllDirty();
      await tick(20);
      expect(h.writeCount()).toBe(0);

      rev = 7;
      h.store.saveAllDirty();
      await tick(30);
      expect(h.writeCount()).toBe(1);
      expect(h.writes[0].wireRev).toBe(7);
    })();
  });

  it('reports the OLDEST dirty age, not the newest or the last one seen', () => {
    return (async () => {
      const h = await loadedStore();
      h.store.retain(OTHER_OWNER_KEY);
      await h.store.preload(OTHER_ACCOUNT_ID);

      h.setNow(20_000);
      h.store.markDirty(OWNER_KEY);
      h.setNow(26_000);
      h.store.markDirty(OTHER_OWNER_KEY);
      h.setNow(30_000);
      // Two dirty entries, six seconds apart: the report must be the older
      // one's age. A single-entry test cannot tell "oldest" from "any".
      expect(h.store.stats().dirty).toBe(2);
      expect(h.store.stats().oldestDirtyAgeMs).toBe(10_000);
    })();
  });

  it('answers two concurrent drains, not just the one that asked first', () => {
    // drainWaiters is a SET rather than a single promise for exactly this: the
    // shutdown path and a test harness can both be waiting, and a second
    // waiter overwriting the first would leave it pending forever.
    return (async () => {
      const gate = deferred<FreeholdUpsertResult>();
      const h = await loadedStore({ writeRow: async () => await gate.promise });
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
      await tick(10);

      const first = h.store.idle(60_000);
      const second = h.store.idle(60_000);
      gate.resolve({ kind: 'updated', durableRev: '2' });
      expect(await first).toBe(true);
      expect(await second).toBe(true);
    })();
  });

  it('survives a synchronously throwing enqueue without leaving the entry running', () => {
    // The catch around the enqueue call itself, not around the write it
    // schedules. An entry left `running` after a throw can never be removed,
    // never re-armed, and stalls every drain until its deadline.
    return (async () => {
      const h = await loadedStore({
        enqueue: () => {
          throw new Error('the keyed writer refused the enqueue');
        },
      });
      h.store.markDirty(OWNER_KEY);
      h.store.save(OWNER_KEY);
      await tick(20);
      expect(h.writeCount()).toBe(0);
      expect(h.store.stats().writeFailures).toBe(1);
      expect(h.store.stats().running).toBe(0);
      expect(h.errors.join(' ')).toContain('could not be queued');
      // And the drain still answers immediately rather than at its deadline.
      expect(await h.store.idle(60_000)).toBe(true);
    })();
  });
});

describe('a write may only carry the record this entry actually loaded', () => {
  // THE WORST OUTCOME THIS STORE CAN PRODUCE, and the one the whole design
  // exists to prevent: an empty seeded default written over a real house. The
  // compare-and-swap deliberately never touches plot_id, so such a write leaves
  // the identity intact and the loss is invisible in the key.
  //
  // The window is real. A leave drops the store entry while the sim record is
  // still live, and a rejoin landing in between reads the row, learns a durable
  // revision, and is then handed a freshly seeded default once the old
  // session's removePlayer finally evicts.

  it('refuses to write a freshly seeded default over a row with a durable revision', async () => {
    const seeded = persistedFixture({
      plotId: PENDING_FREEHOLD_PLOT_ID,
      tier: 'inn_room',
      layout: [],
      trophies: [],
      rev: 0,
    });
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 9 }), repaired: [] },
      // The live record is a FRESH SEED, not the house the entry loaded: this
      // is the state a rejoin lands in when the old session's removePlayer
      // evicts after the new session's read.
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
      serialize: () => seeded,
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    h.store.saveAllDirty();
    await tick(30);
    // The absence of the write IS the assertion.
    expect(h.writeCount()).toBe(0);
    expect(h.calls).not.toContain('writeRow');
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors[0]).toContain('identity');
  });

  it('refuses a live record whose plot identity is not the one it loaded', async () => {
    const foreign = persistedFixture({ plotId: 'plot:someoneelse', rev: 9 });
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      livePlotId: 'plot:someoneelse',
      serialize: () => foreign,
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
  });

  it('builds the document AS SENT once, and refuses THAT (source pin)', () => {
    // The row receives `entry.plotId`, never the live record's, so the refusal
    // has to run on the document that lands rather than on the one the sim
    // happens to hold. There is no behaviour test for this today: the identity
    // seal above already refuses every live record whose identity differs, so
    // the two objects can only diverge in ways that seal catches first. What
    // remains is the byte measure and any future field, and a structural pin is
    // the honest tool for a difference nothing can yet observe.
    const body = methodBody(
      stripComments(readFileSync(SOURCE_PATH, 'utf8')),
      '  async function runWrite(',
    );
    expect(body).toContain(
      'const document: PersistedFreehold = { ...persisted, plotId: entry.plotId };',
    );
    expect(body).toContain('freeholdWriteRefusal(document,');
    // Every field the row receives reads the built document, so a later field
    // cannot quietly take the live record's value instead.
    for (const field of [
      'JSON.stringify(document.layout)',
      'JSON.stringify(document.trophies)',
      'tier: document.tier',
      'condition: document.condition',
      'visitPolicy: document.visitPolicy',
      'wireRev: document.rev',
      'schemaVersion: document.version',
    ]) {
      expect(body, field).toContain(field);
    }
    // ...and the SEAL still reads the LIVE record, which is the whole point of
    // keeping two names: comparing the document against entry.state would be
    // comparing a value with itself.
    expect(body).toContain('persisted.plotId !== entry.state.plotId');
  });

  it('still writes the record it DID load, so the seal is not just a stopped writer', async () => {
    // The anti-vacuity arm. Without it every case above would pass on a store
    // that had simply stopped writing.
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: 6 }),
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(0);
  });

  it('keeps writing after the FIRST insert for an account that had no row', async () => {
    // The regression this seal could most easily cause. After the insert the
    // entry has a durable revision, and the live record is still the sim's
    // seeded default, so a seal that keyed on the unassigned plot id alone
    // would quiesce every account on its SECOND save, forever.
    let rev = 1;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      serialize: () =>
        persistedFixture({ plotId: PENDING_FREEHOLD_PLOT_ID, layout: [], trophies: [], rev }),
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '1',
      }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);

    rev = 2;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.store.stats().quiesced).toBe(0);
    expect(h.writeCount()).toBe(2);
  });

  it('still writes a seeded default when there is NO durable row to lose', async () => {
    // The first write for an account that has never written is the seeded
    // default, under a freshly minted identity, and it is insert-only. The seal
    // must not block the one case where writing a default is the whole point.
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      serialize: () =>
        persistedFixture({ plotId: PENDING_FREEHOLD_PLOT_ID, layout: [], trophies: [], rev: 1 }),
      writeRow: async () => ({ kind: 'inserted', durableRev: '1' }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].expectedDurableRev).toBeNull();
  });
});

describe('a leaving session may borrow the write reserve', () => {
  it('starts a leaver immediately at the ordinary cap, rather than queueing it', async () => {
    // The leave write is the LAST chance for those edits; every background
    // write it would otherwise queue behind has a next sweep to catch it.
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => {
        const gate = deferred<FreeholdUpsertResult>();
        gates.push(gate);
        return await gate.promise;
      },
    });
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_ACTIVE_WRITES; i++) {
      const key = `account:${OTHER_ACCOUNT_ID + i}`;
      h.store.retain(key, OTHER_ACCOUNT_ID + i);
      await h.store.preload(OTHER_ACCOUNT_ID + i);
      h.store.markDirty(key);
      h.store.save(key);
    }
    await tick(20);
    expect(h.store.stats().running).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES);

    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(20);
    // Running, not deferred, even though the ordinary cap is full.
    expect(h.store.stats().running).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 1);
    expect(h.store.stats().deferredWrites).toBe(0);
    for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(40);
  });

  it('actually waits when its write is DEFERRED, instead of returning at once', async () => {
    // A deferred entry has no chain, and treating a null chain as "nothing to
    // wait for" returned a mass disconnect's every logout in milliseconds:
    // none of the deadline's budget was spent and every entry stayed resident.
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => {
        const gate = deferred<FreeholdUpsertResult>();
        gates.push(gate);
        return await gate.promise;
      },
    });
    const saturated = FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE;
    for (let i = 0; i < saturated; i++) {
      const key = `account:${OTHER_ACCOUNT_ID + i}`;
      h.store.retain(key, OTHER_ACCOUNT_ID + i);
      await h.store.preload(OTHER_ACCOUNT_ID + i);
      h.store.markDirty(key);
      h.store.save(key);
    }
    await tick(20);
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);

    let released = false;
    const leaving = h.store.flushAndRelease(OWNER_KEY).then(() => {
      released = true;
    });
    await tick(30);
    // Deferred, and still waiting: it has not written and has not given up.
    expect(h.store.stats().deferredWrites).toBeGreaterThan(0);
    expect(released).toBe(false);

    // A slot frees; the leaver's own write then runs and the wait ends.
    gates[0].resolve({ kind: 'updated', durableRev: '9' });
    await tick(40);
    for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(40);
    await leaving;
    expect(released).toBe(true);
    expect(h.writes.some((w) => w.accountId === ACCOUNT_ID)).toBe(true);
  });

  it('counts an outstanding capture, so the retained memory is a series', async () => {
    // Each capture is a second full record on top of the entry's own, held
    // until the write lands. At the approved row ceiling a thousand dirty
    // logouts retain tens of megabytes, which should not need a heap dump.
    const gate = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: 6 }),
      writeRow: async () => await gate.promise,
    });
    expect(h.store.stats().leaveCaptures).toBe(0);
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    expect(h.store.stats().leaveCaptures).toBe(1);
    gate.resolve({ kind: 'updated', durableRev: '6' });
    await tick(40);
    // Released with the write, never held for the life of the entry.
    expect(h.store.stats().leaveCaptures).toBe(0);
  });
});

describe('a leaving session never loses its last edits to a queue', () => {
  // The write's precondition is that the sim record still exists: past
  // removePlayer, serialize answers null and the write is a no-op. The leave
  // path is the ONLY window where that holds, so a write that is deferred by
  // the local cap, or whose flush deadline expires, would run after eviction
  // and write nothing at all. The document is captured before the wait.

  /** A store whose live record DISAPPEARS the moment the leave returns, which
   *  is exactly what removePlayer does right after flushAndRelease. */
  async function leavingStore(writeRow: () => Promise<FreeholdUpsertResult>) {
    let evicted = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => (evicted ? null : persistedFixture({ rev: 6 })),
      writeRow,
    });
    return {
      h,
      evict: () => {
        evicted = true;
      },
    };
  }

  it('writes the captured document when the deadline expires before the write runs', async () => {
    const gate = deferred<FreeholdUpsertResult>();
    const { h, evict } = await leavingStore(async () => await gate.promise);
    // A write already in flight for another owner is not needed here: the
    // deadline arm alone is enough to return before this write samples.
    const leaving = h.store.flushAndRelease(OWNER_KEY);
    await tick(2);
    const deadline = h.deadlines.find((job) => job.ms === FREEHOLD_PERSIST_LEAVE_FLUSH_MS);
    deadline?.fire();
    await leaving;
    // The server evicts the record the instant leave returns.
    evict();
    await tick(30);
    gate.resolve({ kind: 'updated', durableRev: '6' });
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(6);
  });

  it('drops the capture once the write it was taken for has settled', async () => {
    // A capture that outlived its write is a document held for the life of the
    // entry, and one that could be re-sent for a LATER session whose record
    // happens to be gone at the moment its write runs. The live record always
    // wins, so nothing stale can shadow an edit, but the capture must still not
    // survive its own write.
    let evicted = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => (evicted ? null : persistedFixture({ rev: 6 })),
      writeRow: async () => ({ kind: 'updated', durableRev: '6' }),
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);

    // The record is gone and the entry is dirty again. With the capture
    // correctly cleared there is nothing to send, and the store SAYS so.
    evicted = true;
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().writesWithoutRecord).toBe(1);
  });

  it('keeps the capture when a write FAILED without quiescing', async () => {
    // The null-permit arm returns false without quiescing, so the entry settles
    // uncommitted, unblocked and still dirty. Dropping its capture there left
    // the next sweep to re-arm a write whose record removePlayer had already
    // evicted, and the leaving session's edits were gone for good. Gate
    // saturation is what produces BOTH that timeout and the deferral the
    // capture exists for, so these two arms sit next to each other.
    let granted = 0;
    let evicted = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => (evicted ? null : persistedFixture({ rev: 6 })),
      acquirePermit: async () => {
        granted += 1;
        // The load gets its permit; the FIRST write does not; later ones do.
        return granted === 2 ? null : { release: () => {} };
      },
      writeRow: async () => ({ kind: 'updated', durableRev: '6' }),
    });
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().writeFailures).toBe(1);
    // Still dirty, still unblocked, and STILL HOLDING its document.
    expect(h.store.stats().dirty).toBe(1);
    expect(h.store.stats().leaveCaptures).toBe(1);

    evicted = true;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(6);
    expect(h.store.stats().writesWithoutRecord).toBe(0);
  });

  it('hands an outstanding capture to a REJOIN, rather than replaying a staler state', async () => {
    // The leaver's unwritten edits live only in the capture. `entry.state`
    // advances at COMMIT, so replaying it would show the returning player a
    // house missing everything they did before logging out, and the next sweep
    // would then write that older record over the capture.
    //
    // A revision comparison in the write path was tried for this and was wrong:
    // `rev` restarts from the last committed value on a replay, so the two
    // counters are on different timelines and preferring the capture there lost
    // the REJOINING session's edits instead. Handing it over at the join is
    // what makes both survive.
    let granted = 0;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: 6, condition: 42 }),
      // The load takes its permit; the leave write is refused one, which is
      // what leaves the capture outstanding.
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : null;
      },
    });
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(20);
    // The write was refused a permit, so the capture is still outstanding.
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().leaveCaptures).toBe(1);

    const rejoin = await h.store.preload(ACCOUNT_ID);
    expect(rejoin.state?.rev).toBe(6);
    expect(rejoin.state?.condition).toBe(42);
    // OFFERED, not yet released. The handshake that read it can still die
    // before it ever creates a live record, and five exits sit between this
    // call and the join, so the capture stays until something confirms.
    expect(h.store.stats().leaveCaptures).toBe(1);
  });

  it('keeps writing for a fresh account whose write served from its capture', async () => {
    // The case that killed the previous two designs. A brand-new account's
    // record carries the pending stand-in for its whole first session, because
    // nothing writes an identity into the sim, and a stand-in is
    // indistinguishable from a fresh seed BY IDENTITY. So the entry must
    // remember the identity its own record carried, not the row's: an entry
    // that remembered the row's minted name would refuse its own record on the
    // second write of every new account.
    let live = true;
    let granted = 0;
    const permit = deferred<{ release(): void } | null>();
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      serialize: () =>
        live ? persistedFixture({ plotId: PENDING_FREEHOLD_PLOT_ID, rev: 6 }) : null,
      hasLive: () => live,
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : await permit.promise;
      },
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '1',
      }),
    });
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    live = false;
    permit.resolve({ release: () => {} });
    await tick(30);
    expect(h.writeCount()).toBe(1);

    // The rejoin is handed the capture, so the record it installs IS the
    // document just written, stand-in identity and all.
    live = true;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    h.store.saveAllDirty();
    await tick(30);
    // Not quiesced, and it keeps writing.
    expect(h.store.stats().quiesced).toBe(0);
    expect(h.errors).toEqual([]);
  });

  it('still refuses a record seeded while the write was in flight', async () => {
    // The mirror, and the hazard the seal exists for. Here the record that
    // exists at commit time is a FRESH SEED of a row that already holds a
    // house, so writing it would put an empty Inn Room over real furnishings.
    let live = true;
    let seeded = false;
    let granted = 0;
    const permit = deferred<{ release(): void } | null>();
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () =>
        !live
          ? null
          : seeded
            ? persistedFixture({ plotId: PENDING_FREEHOLD_PLOT_ID, layout: [], rev: 0 })
            : persistedFixture({ rev: 6 }),
      hasLive: () => live,
      // The record's identity follows the record: the real house while it is
      // the real house, the stand-in once a default has been seeded over it.
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : ROW_PLOT_ID),
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : await permit.promise;
      },
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    live = false;
    permit.resolve({ release: () => {} });
    await tick(30);
    expect(h.writeCount()).toBe(1);

    // A join seeds a DEFAULT rather than adopting anything, and holds the entry.
    live = true;
    seeded = true;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    // The entry was collected when its write settled clean, so retain re-reads
    // it; the sweep must run after that read lands.
    await tick(30);
    h.store.saveAllDirty();
    await tick(30);
    // The absence of a second write IS the assertion: the row keeps the house.
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.store.stats().entries).toBe(1);
    expect(h.store.stats().dirty).toBe(1);
  });

  it('refuses a pristine seed over a FRESH account that has since furnished', async () => {
    // The blind window identity alone cannot close. A brand-new account's
    // record carries the stand-in name for its whole first session, and so does
    // a freshly seeded default, so between that account's first insert and its
    // first reload the two have the same name. What separates them is that a
    // pristine default knows NOTHING: no revision, no layout, no trophies.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
      serialize: () =>
        seeded
          ? persistedFixture({ layout: [], trophies: [], rev: 0 })
          : persistedFixture({ rev: 4 }),
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '1',
      }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].layoutJson).not.toBe('[]');

    // Evicted, then a rejoin seeds an empty default under the SAME stand-in
    // name. The row already holds this account's furnishings.
    seeded = true;
    h.store.saveAllDirty();
    await tick(30);
    // The absence of a second write IS the assertion.
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
  });

  it('refuses a pristine seed over an account that differs ONLY by revision', async () => {
    // The revision half of "knows more", on its own. An account can have moved
    // its record without placing anything (a tier grant bumps the revision and
    // touches no row), so a test that only ever differs by CONTENT would leave
    // that account unprotected.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
      serialize: () => persistedFixture({ layout: [], trophies: [], rev: seeded ? 0 : 3 }),
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '1',
      }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(3);

    seeded = true;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
  });

  it('still writes an ESTABLISHED account that emptied its own house', async () => {
    // The other side of the pristine test, and the reason it requires the
    // stand-in name. A player who removes every furnishing leaves a record that
    // looks exactly like a seed except for its identity, and refusing that
    // would make "remove everything" the one edit that can never be saved.
    let emptied = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () =>
        emptied
          ? persistedFixture({ layout: [], trophies: [], rev: 0 })
          : persistedFixture({ rev: 5 }),
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    emptied = true;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].layoutJson).toBe('[]');
    expect(h.store.stats().quiesced).toBe(0);
  });

  it('still writes a fresh account whose record is LEGITIMATELY still empty', async () => {
    // The anti-vacuity arm, and the reason the test is "knows more" rather than
    // "is a default". An account that has written once and changed nothing has
    // a record identical to a pristine seed, and writing it loses nothing, so
    // refusing there would quiesce a healthy account for no gain.
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
      serialize: () => persistedFixture({ layout: [], trophies: [], rev: 0 }),
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '1',
      }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);

    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(2);
    expect(h.store.stats().quiesced).toBe(0);
  });

  it('keeps the capture when the handshake that read it never joins', async () => {
    // preload runs BEFORE the character lease, and a lease already held, no
    // such character, a forced rename, a throwing character read and a refused
    // join all return without ever creating a record. `alreadyInWorld` is the
    // sharpest: a reconnect after a dropped socket is the very event that
    // produced the capture. Releasing at the read lost the edits outright.
    let granted = 0;
    let live = true;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: 6 }),
      // Live while the session is leaving (which is what lets the capture be
      // taken), then gone, which is what removePlayer does right after.
      hasLive: () => live,
      // The load takes a permit, the LEAVE write is refused one (which is what
      // leaves the capture outstanding), and the sweep after it gets one.
      acquirePermit: async () => {
        granted += 1;
        return granted === 2 ? null : { release: () => {} };
      },
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(20);
    expect(h.store.stats().leaveCaptures).toBe(1);
    // removePlayer evicts the record the instant the leave returns.
    live = false;

    // The handshake reads, then dies before the join.
    await h.store.preload(ACCOUNT_ID);
    expect(h.store.stats().leaveCaptures).toBe(1);

    // The next sweep still has the document, so the edits reach the row.
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(6);
    expect(h.store.stats().writesWithoutRecord).toBe(0);
  });

  it('releases the capture only when the live record CARRIES it', async () => {
    // A bare "is anything live" test was not enough. installLoadedFreehold has
    // four early returns and loadFreehold is load-once on top of them, while
    // retain runs on every join and knows none of that. The reachable case is
    // the same-account character swap, where the record retain sees belongs to
    // the PREVIOUS session and removePlayer is explicitly allowed to evict it
    // afterwards. Comparing revisions fails closed instead.
    let live = true;
    let liveRev = 5;
    let granted = 0;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: liveRev }),
      hasLive: () => live,
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : null;
      },
    });
    liveRev = 6;
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(20);
    expect(h.store.stats().leaveCaptures).toBe(1);
    live = false;

    // No record at all: nothing to confirm.
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    expect(h.store.stats().leaveCaptures).toBe(1);

    // A record exists but is NOT the offered document: the same-account swap,
    // where the install was skipped and this record is the other session's.
    live = true;
    liveRev = 5;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    expect(h.store.stats().leaveCaptures).toBe(1);

    // ...and now it genuinely carries those edits.
    liveRev = 6;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    expect(h.store.stats().leaveCaptures).toBe(0);
  });

  it('writes the LIVE record, never a capture, once a record exists again', async () => {
    // The mirror of the case above. After a rejoin the live record is the only
    // authority; writing a capture over it would put the row out of step with
    // the house the player is standing in, and the next sweep would undo it.
    let liveRev = 6;
    let granted = 0;
    const permit = deferred<{ release(): void } | null>();
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: liveRev }),
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : await permit.promise;
      },
      writeRow: async () => ({ kind: 'updated', durableRev: '9' }),
    });
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    expect(h.writeCount()).toBe(0);

    // The rejoining session edits, so the live record is ahead of the capture.
    liveRev = 15;
    permit.resolve({ release: () => {} });
    await tick(40);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(15);
  });

  it('the gauge returns to zero, so the retention it bounds is falsifiable', async () => {
    // A second leave over a surviving capture holds ONE document and used to
    // count two, so the gauge ratcheted upward and never read zero again. It is
    // this retention's only stated bound, and a bound that cannot read zero is
    // not one.
    let granted = 0;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev: 6 }),
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : null;
      },
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(20);
    expect(h.store.stats().leaveCaptures).toBe(1);
    // A SECOND leave while the first capture is still outstanding.
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(20);
    expect(h.store.stats().leaveCaptures).toBe(1);
  });

  it('never lets a captured document shadow a later live edit', async () => {
    // A live record always wins. If the capture could outrank it, a rejoining
    // session's edits would be silently replaced by the previous session's.
    let rev = 6;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => ({ kind: 'updated', durableRev: '9' }),
    });
    h.store.retain(OWNER_KEY);
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(30);
    expect(h.writes.at(-1)?.wireRev).toBe(6);

    rev = 7;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writes.at(-1)?.wireRev).toBe(7);
  });
});

describe('the store refuses what it cannot represent, rather than repairing it', () => {
  it('holds a row whose wire revision has outgrown a JS number', async () => {
    // normalizeFreehold REPAIRS an out-of-range revision to zero and still
    // answers loaded, so without this the row would come back WRITABLE at
    // revision zero and the next save would write that zero over the larger
    // stored value: the client-facing counter would go backwards, permanently,
    // on a row nothing was wrong with.
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture({ wireRev: '9007199254740993' }) },
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold?.kind).toBe('malformed');
    expect(loaded.hold?.detail).toBe('wire_rev_shape');
    expect(loaded.state).toBeNull();
    // Held, so no write can go out and the row keeps its revision.
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
  });

  it('loads the largest revision it CAN represent, so the refusal is a boundary', async () => {
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture({ wireRev: String(Number.MAX_SAFE_INTEGER) }) },
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold).toBeNull();
    expect(loaded.state).not.toBeNull();
  });

  it('never writes for an entry that was held while its write sat in the queue', async () => {
    // The post-queue re-check. A write enqueued before its entry was held,
    // quiesced or evicted must not run: that is a direct invariant-1 violation,
    // since the entry no longer knows the row it would be fencing on.
    const gate = deferred<FreeholdUpsertResult>();
    let served = 0;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => {
        served += 1;
        if (served === 1) return await gate.promise;
        return { kind: 'updated', durableRev: String(served) };
      },
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(10);
    expect(h.writeCount()).toBe(1);

    // A second write is queued behind the first, and the entry is quiesced
    // while it waits.
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    gate.resolve({ kind: 'stale', durableRev: '99' });
    await tick(40);
    expect(h.store.stats().quiesced).toBe(1);
    // The absence of the second writeRow IS the assertion.
    expect(h.writeCount()).toBe(1);
  });
});

describe('a run of thrown writes is a RUN, bounded in time', () => {
  it('does not quiesce on blips spread further apart than the window', async () => {
    let rev = 7;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => {
        throw new Error('connection terminated unexpectedly');
      },
    });
    // Three throws, each one window apart plus a millisecond. Without the
    // window this is three strikes and a permanently quiesced owner; with it
    // each is a fresh event.
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_WRITE_ERRORS + 2; i++) {
      rev += 1;
      h.setNow(10_000 + i * (FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS + 1));
      h.store.saveAllDirty();
      await tick(30);
    }
    expect(h.store.stats().quiesced).toBe(0);
    expect(h.store.stats().writeFailures).toBe(FREEHOLD_PERSIST_MAX_WRITE_ERRORS + 2);
  });

  it('still quiesces on a run INSIDE the window, so the window is not an escape', async () => {
    let rev = 7;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => {
        throw new Error('connection terminated unexpectedly');
      },
    });
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_WRITE_ERRORS; i++) {
      rev += 1;
      h.setNow(10_000 + i * 1_000);
      h.store.saveAllDirty();
      await tick(30);
    }
    expect(h.store.stats().quiesced).toBe(1);
  });

  it('reports a database error by its CLASSIFICATION, never its row content', async () => {
    // A PostgreSQL error is not a bounded value: a 23514 puts "Failing row
    // contains (...)" in `detail` and a 23505 puts the conflicting key there.
    // That is the one channel that would otherwise carry row content and an
    // account id straight into a console.
    const h = await loadedStore({
      writeRow: async () => {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), {
          code: '23505',
          constraint: 'account_freeholds_plot_id',
          detail: `Key (plot_id)=(${ROW_PLOT_ID}) already exists.`,
          table: 'account_freeholds',
        });
      },
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    const logged = JSON.stringify(h.errors);
    expect(logged).toContain('23505');
    expect(logged).toContain('account_freeholds_plot_id');
    expect(logged).not.toContain(ROW_PLOT_ID);
    expect(logged).not.toContain('Failing row');
  });
});

describe('nothing removes an entry that still owes a durable write', () => {
  // BOTH removal paths, one predicate. They used to differ, and either
  // difference drops a save: maybeRemove checked the deferred set but not
  // dirtiness, and the orphan sweep checked dirtiness but not the deferred set.
  //
  // A DEFERRED, zero-reference entry is unreachable now that a leaving write
  // borrows the reserve and therefore always starts, so the deferred clause in
  // the shared predicate has no behaviour test and is kept for what it says
  // rather than for what today's arming rules imply. What IS reachable, and
  // what these cases drive, is an entry left dirty by a refused permit.

  it('keeps a DIRTY, unreferenced, NOT running entry across every sweep', async () => {
    // The dirty arm on its own. The older case had a dirty entry that was also
    // running, so `running` carried every assertion and dropping the dirty
    // clause changed nothing.
    // The LOAD gets its permit; every write after it is refused one, so the
    // entry is loaded and unblocked but its write never runs.
    let granted = 0;
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : null;
      },
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    // The permit was refused, so nothing is running and nothing was written,
    // but the entry still owes the write.
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().running).toBe(0);
    expect(h.store.stats().dirty).toBe(1);
    await h.store.flushAndRelease(OWNER_KEY);
    for (let i = 0; i < 6; i++) h.store.saveAllDirty();
    await tick(20);
    expect(h.store.stats().entries).toBe(1);
    expect(h.store.stats().dirty).toBe(1);
  });

  it('keeps an entry whose durable READ is still in flight', async () => {
    // A load in flight will call ensureEntry again when it lands, so removing
    // the entry now only resurrects it at zero references, which is the same
    // "entry went missing under a live session" class that retain's reload
    // exists to repair. Both removal paths have to know that, which is why the
    // guard lives in the shared predicate rather than in one of them.
    const gate = deferred<FreeholdRowLoad>();
    const h = harness({ readRow: async () => await gate.promise });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    const loading = h.store.preload(ACCOUNT_ID);
    await tick(10);
    // The session goes away while the read is still out.
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(1);
    // ...and the sweep leaves it alone too, for the same reason.
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    expect(h.store.stats().entries).toBe(1);

    gate.resolve({ kind: 'row', row: rowFixture() });
    await loading;
    await tick(20);
    expect(h.store.stats().loaded).toBe(1);
  });

  it('DOES collect a blocked entry, dirty or not, since it can never write', async () => {
    // The contrast arm: keeping a dirty entry forever would be a leak, not a
    // rescue, once it is held or quiesced and may not write at all.
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => ({ kind: 'stale', durableRev: '99' }),
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.store.stats().quiesced).toBe(1);
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(0);
  });
});

describe('a re-armed write inherits the leaving capture', () => {
  it('writes the last edit even when the re-arm is the write that runs after eviction', async () => {
    // The subtlest arm of the lost-save family. A background write is running
    // and has already sampled; a later edit sets pending; the player leaves and
    // the document is captured; the running write commits and settle RE-ARMS.
    // If the capture were cleared at the top of settle, that re-armed write
    // would run past eviction with nothing to send and the session's last edit
    // would be gone, silently.
    let rev = 6;
    let evicted = false;
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => (evicted ? null : persistedFixture({ rev })),
      writeRow: async () => {
        const gate = deferred<FreeholdUpsertResult>();
        gates.push(gate);
        return await gate.promise;
      },
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(20);
    expect(h.writeCount()).toBe(1);

    // A later edit while that write is out, then the leave.
    rev = 7;
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    const leaving = h.store.flushAndRelease(OWNER_KEY);
    await tick(5);
    gates[0].resolve({ kind: 'updated', durableRev: '6' });
    await tick(10);
    const deadline = h.deadlines.find((job) => job.ms === FREEHOLD_PERSIST_LEAVE_FLUSH_MS);
    deadline?.fire();
    await leaving;
    evicted = true;
    await tick(20);
    for (let round = 0; round < 20 && gates.length > 1; round++) {
      for (const gate of gates.splice(1)) gate.resolve({ kind: 'updated', durableRev: '7' });
      await tick(30);
    }
    expect(h.writes.map((w) => w.wireRev)).toEqual([6, 7]);
  });
});

describe('an entry that went missing under a live session is re-read, not left blocked', () => {
  it('re-reads when retain finds no loaded entry, instead of yielding a blocked one', async () => {
    // retain runs at the END of a handshake whose preload already ran, so a
    // missing entry means something removed it in between: the orphan sweep
    // after a slow handshake, or a leave for another character of the same
    // account. Yielding an unloaded entry would write-block the session for its
    // whole life with no hold, no counter and no log, and every edit the player
    // makes would be discarded at logout, which is precisely the outcome the
    // store exists to prevent.
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    await h.store.preload(ACCOUNT_ID);
    // Two sweeps collect the never-retained entry, exactly as designed.
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    expect(h.store.stats().entries).toBe(0);

    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await tick(20);
    // Loaded again, and therefore able to write.
    expect(h.store.stats().entries).toBe(1);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].expectedDurableRev).toBe('7');
  });

  it('issues NO read at all on a dark realm, however the entry got lost', async () => {
    // The join path's preload is gated on the housing flag in server/main.ts,
    // so this reload would otherwise be the one durable read a realm with
    // housing disabled still issues, once per join, for a feature it does not
    // serve. A dark realm must touch the database not at all.
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() }, enabled: () => false });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await tick(20);
    expect(h.calls).toEqual([]);
    expect(h.store.stats().loads).toBe(0);
    // The entry still exists and is still write-blocked, which is what a dark
    // realm's store costs: one map entry per online account, removed on leave.
    // It is NOT loaded, and the two are separate measures precisely so an
    // operator scraping a dark realm cannot read a climbing entry count as
    // records this realm is persisting.
    expect(h.store.stats().entries).toBe(1);
    expect(h.store.stats().loaded).toBe(0);
  });

  it('costs no extra read on an ordinary join, where the entry IS loaded', async () => {
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    await h.store.preload(ACCOUNT_ID);
    h.calls.length = 0;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await tick(20);
    expect(h.calls).toEqual([]);
  });
});

describe('the leaving flush is bounded', () => {
  it('stops waiting at its own deadline without cancelling the write', async () => {
    // Under gate saturation a logout used to inherit the background write's
    // whole budget: the permit wait plus a statement timeout, times up to four
    // re-arm passes. Every leaving session would block for tens of seconds,
    // GameServer.leave would back up and character leases would be released
    // late, so reconnects wait out the lease. Giving up the WAIT is not giving
    // up the WRITE.
    const gate = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({ writeRow: async () => await gate.promise });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(10);
    expect(h.writeCount()).toBe(1);

    let released = false;
    const leaving = h.store.flushAndRelease(OWNER_KEY).then(() => {
      released = true;
    });
    await tick(20);
    // Still blocked: nothing has fired the deadline yet.
    expect(released).toBe(false);

    const deadline = h.deadlines.find((job) => job.ms === FREEHOLD_PERSIST_LEAVE_FLUSH_MS);
    expect(deadline).toBeDefined();
    deadline?.fire();
    await leaving;
    expect(released).toBe(true);

    // The write was NOT cancelled and the entry was NOT dropped: it is still
    // running, so the row still gets the owner's last edits.
    expect(h.store.stats().running).toBe(1);
    expect(h.store.stats().entries).toBe(1);
    gate.resolve({ kind: 'updated', durableRev: '8' });
    await tick(30);
    expect(h.writeCount()).toBe(1);
    // And only once it settled did the entry go.
    expect(h.store.stats().entries).toBe(0);
  });

  it('cancels its deadline when the write lands first, leaving no timer behind', async () => {
    const h = await loadedStore();
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await h.store.flushAndRelease(OWNER_KEY);
    const leaveDeadlines = h.deadlines.filter((job) => job.ms === FREEHOLD_PERSIST_LEAVE_FLUSH_MS);
    expect(leaveDeadlines).toHaveLength(1);
    expect(leaveDeadlines[0].cancelled).toBe(true);
    expect(leaveDeadlines[0].fired).toBe(false);
  });
});

describe('the local write admission cap', () => {
  // The keyed serial writer serializes per OWNER KEY, so a thousand owners are
  // a thousand independent FIFOs racing for one shared background permit, and
  // that gate's waiter list is UNCAPPED. Bounding each WAIT does not bound the
  // waiter COUNT: the first sweep after a mass login would queue one waiter per
  // owner, each with its own abort timer, and every other named producer would
  // sit behind them. The surplus waits here instead.

  /** `count` loaded owners in ONE store, each with its own key. */
  async function manyOwners(count: number, writeRow: () => Promise<FreeholdUpsertResult>) {
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow,
      serialize: (ownerKey: string) => persistedFixture({ rev: revs.get(ownerKey) ?? 5 }),
    });
    const revs = new Map<string, number>();
    for (let i = 0; i < count; i++) {
      const account = ACCOUNT_ID + i;
      const key = `account:${account}`;
      revs.set(key, 5);
      h.store.retain(key);
      await h.store.preload(account);
    }
    return { h, revs };
  }

  it('never runs more than the cap at once, and drains everything anyway', async () => {
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    let peak = 0;
    let inFlight = 0;
    const { h, revs } = await manyOwners(40, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      const gate = deferred<FreeholdUpsertResult>();
      gates.push(gate);
      const result = await gate.promise;
      inFlight--;
      return result;
    });
    for (const key of revs.keys()) {
      revs.set(key, 6);
      h.store.markDirty(key);
      h.store.save(key);
    }
    await tick(30);
    expect(peak).toBeLessThanOrEqual(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES);

    // Release everything, pumping as slots free, and prove no owner was lost.
    for (let round = 0; round < 60 && gates.length > 0; round++) {
      for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
      await tick(30);
    }
    expect(peak).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES);
    expect(h.writeCount()).toBe(40);
    expect(h.store.stats().dirty).toBe(0);
  });

  it('leaves a deferred owner DIRTY, so the next sweep still owes it a write', async () => {
    // The safety half. A deferred write that quietly cleared its dirty flag
    // would lose the edit forever; the whole reason deferring is safe is that
    // the entry keeps owing the write.
    const gate = deferred<FreeholdUpsertResult>();
    const { h, revs } = await manyOwners(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 3, async () => {
      return await gate.promise;
    });
    for (const key of revs.keys()) {
      revs.set(key, 6);
      h.store.markDirty(key);
      h.store.save(key);
    }
    await tick(30);
    expect(h.writeCount()).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES);
    expect(h.store.stats().dirty).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 3);
    // Nothing lost and nothing double-queued: the deferred owners are still
    // dirty and still uncounted as running.
    expect(h.store.stats().running).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES);
  });

  it('does not answer the shutdown drain until every capped write has run', async () => {
    // A drain that answered while writes were still owed would report success
    // with edits unwritten, which is the exact lie a drain exists to prevent.
    // Note what this does and does not prove: a non-empty deferred set always
    // implies the cap is full, so the running-entry loop would catch this case
    // too. The explicit deferred check in drainCheck is defence in depth behind
    // a same-state filter and no behaviour test can isolate it; it is kept
    // because the two conditions are only equal by today's arithmetic.
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    const { h, revs } = await manyOwners(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 2, async () => {
      const gate = deferred<FreeholdUpsertResult>();
      gates.push(gate);
      return await gate.promise;
    });
    for (const key of revs.keys()) {
      revs.set(key, 6);
      h.store.markDirty(key);
      h.store.save(key);
    }
    await tick(30);
    let drained: boolean | null = null;
    void h.store.idle(60_000).then((value) => {
      drained = value;
    });
    await tick(20);
    expect(drained).toBeNull();

    for (let round = 0; round < 20 && gates.length > 0; round++) {
      for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
      await tick(30);
    }
    expect(drained).toBe(true);
    expect(h.writeCount()).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 2);
  });
});

describe('an abandoned preload does not leak an entry', () => {
  // The handshake reads the durable row BEFORE it acquires the character lease,
  // and several refusals sit between the two. Every one of them returns without
  // reaching retain(), so a preload that is never retained had no removal path
  // at all: the entry stayed for the life of the process holding a parsed
  // record, and preload REPLAYS a loaded entry rather than re-reading, so on a
  // multi-realm deployment it would serve a stale house at every later login.

  function sweep(h: Harness, passes: number): void {
    for (let i = 0; i < passes; i++) h.store.saveAllDirty();
  }

  it('collects a preloaded entry that no session ever retained', async () => {
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    await h.store.preload(ACCOUNT_ID);
    expect(h.store.stats().entries).toBe(1);
    sweep(h, FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES);
    await tick(10);
    expect(h.store.stats().entries).toBe(0);
    // No write went out for it: a collected entry owes nothing.
    expect(h.writeCount()).toBe(0);
  });

  it('does not collect on the first pass, so a join between preload and retain is safe', async () => {
    // The mark pass is the whole reason this is two passes: preload resolves
    // before game.join calls retain, and an entry removed in that window would
    // be replaced by a fresh UNLOADED one that can never write.
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    await h.store.preload(ACCOUNT_ID);
    sweep(h, 1);
    expect(h.store.stats().entries).toBe(1);
    h.store.retain(OWNER_KEY);
    sweep(h, FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES + 2);
    expect(h.store.stats().entries).toBe(1);
  });

  it('never collects a retained, a dirty or a writing entry', async () => {
    const gate = deferred<FreeholdUpsertResult>();
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => await gate.promise,
    });
    // Retained: survives any number of passes.
    sweep(h, 6);
    expect(h.store.stats().entries).toBe(1);

    // Dirty and then writing: still survives, even with the reference dropped.
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(10);
    expect(h.store.stats().running).toBe(1);
    sweep(h, 6);
    expect(h.store.stats().entries).toBe(1);
    gate.resolve({ kind: 'updated', durableRev: '8' });
    await tick(30);
    expect(h.writeCount()).toBe(1);
  });

  it('leaves the immediate removal path alone: a real leave still removes at once', async () => {
    // The contrast case. A session that actually leaves is removed by
    // flushAndRelease on the spot, with no sweep involved, so the sweep is
    // only ever collecting entries no leave will ever come for. Without this
    // arm the cases above could pass on a store that had quietly moved every
    // eviction onto a thirty-second delay.
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    await h.store.preload(ACCOUNT_ID);
    h.store.retain(OWNER_KEY);
    expect(h.store.stats().entries).toBe(1);
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(0);
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
    const stats = h.store.stats();
    for (const [measure, value] of Object.entries(stats)) {
      if (measure === 'loadFailuresByKind') continue;
      expect(typeof value).toBe('number');
    }
    // The one non-scalar measure, checked on both halves: its KEYS are hold
    // kinds from a closed vocabulary and its values are counts, so no identity
    // can ride in on either side.
    for (const [kind, count] of Object.entries(stats.loadFailuresByKind)) {
      expect(['unsupported', 'malformed', 'oversize', 'unadmitted']).toContain(kind);
      expect(typeof count).toBe('number');
    }
  });

  it('reports the dirty age from the store clock and the write byte totals', async () => {
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
    // A total and a high-water mark, never a last sample: one arbitrary write's
    // size at a thousand owners tells an operator nothing about the
    // distribution or about growth toward the byte ceiling.
    expect(after.writeBytesTotal).toBeGreaterThan(0);
    expect(after.maxWriteBytes).toBe(after.writeBytesTotal);
    expect(after.permitWaitMsTotal).toBeGreaterThanOrEqual(0);
    expect(after.queueWaitMsTotal).toBeGreaterThanOrEqual(0);
    expect(after.writeMsTotal).toBeGreaterThanOrEqual(0);
    expect(after.loadMsTotal).toBeGreaterThanOrEqual(0);
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

  it('installs no PLOT for a held load, but keeps the durable hearth clock', () => {
    // The clock is a separate durable fact. An account whose plot row cannot be
    // read still has a Hearth cooldown, and dropping it because the plot was
    // held would hand that account a free travel on every login, on exactly the
    // accounts already in a recovery state.
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
    expect(ctx.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(90_000);
  });

  it('keeps the durable hearth clock when the account has no plot row at all', () => {
    const ctx = fakeCtx();
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      loadedFixture({ state: null, durableRev: null, hearthReadyAtMs: 90_000 }),
    );
    expect(ctx.freeholds.size).toBe(0);
    expect(ctx.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(90_000);
  });

  it('installs no plot from a bag that lost its shape, and says why that is safe', () => {
    // Not reachable from the real store, which always hands a PersistedFreehold
    // or null. The guard is about the FAILURE MODE: falling through would let
    // addPlayer seed a default while the store's entry still believed it loaded
    // a real row. That used to be how a default reached the row; it no longer
    // is, because runWrite's identity seal refuses to write a record still
    // carrying the unassigned plot id over a row that has a durable revision.
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, {
      ...loadedFixture(),
      state: 'not an object',
    } as unknown as LoadedFreehold);
    expect(ctx.freeholds.size).toBe(0);
  });

  it('installs the CLOCK even from a bag whose plot state lost its shape', () => {
    // The two are independent durable facts. Coupling them means one malformed
    // field costs the owner both, including a travel cooldown they already
    // spent.
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, {
      ...loadedFixture({ hearthReadyAtMs: 90_000 }),
      state: 'not an object',
    } as unknown as LoadedFreehold);
    expect(ctx.freeholds.size).toBe(0);
    expect(ctx.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(90_000);
  });

  it('installs the PLOT even from a bag whose clock lost its shape', () => {
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, {
      ...loadedFixture(),
      hearthReadyAtMs: 'soon',
    } as unknown as LoadedFreehold);
    expect(ctx.freeholds.size).toBe(1);
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
    // session) can never drop the entry under the arriving one. It carries the
    // account id, which is what lets the store re-read a row whose entry went
    // away between the handshake's preload and here.
    expect(retain).toBeLessThan(addPlayer);
    expect(body).toContain('this.freeholdPersist.retain(freeholdOwnerKey, accountId)');
  });

  it('releases the store reference if the seed throws, so no reference leaks', () => {
    // The retain is paired with the leave a COMPLETED join guarantees. A throw
    // out of addPlayer means there is no session to leave, so without this the
    // reference is held for the life of the process and the entry can never be
    // collected. Pinned structurally because a throwing addPlayer is not
    // reachable from a unit test of this store.
    const body = methodBody(GAME, '  join(');
    const addPlayer = body.indexOf('this.sim.addPlayer(');
    const release = body.indexOf('this.freeholdPersist.flushAndRelease(freeholdOwnerKey)');
    expect(release).toBeGreaterThan(addPlayer);
    // ...and it is inside a catch, not a second unconditional release.
    const between = body.slice(addPlayer, release);
    expect(between).toContain('catch');
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
