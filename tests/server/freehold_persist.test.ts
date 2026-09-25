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

import { readdirSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBackgroundDbGate } from '../../server/background_db_gate';
import type {
  FreeholdRow,
  FreeholdRowLoad,
  FreeholdUpsert,
  FreeholdUpsertResult,
} from '../../server/freehold_db';
import type { FreeholdHearthLoad } from '../../server/freehold_hearth_db';
import { readLoginDurables } from '../../server/freehold_hearth_load';
import { installLoadedFreehold } from '../../server/freehold_install';
import {
  createFreeholdPersistStore,
  FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES,
  FREEHOLD_PERSIST_FLUSH_MAX_PASSES,
  FREEHOLD_PERSIST_LEAVE_FLUSH_MS,
  FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE,
  FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS,
  FREEHOLD_PERSIST_LOGIN_BUDGET_MS,
  FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS,
  FREEHOLD_PERSIST_MAX_ACTIVE_LOADS,
  FREEHOLD_PERSIST_MAX_ACTIVE_WRITES,
  FREEHOLD_PERSIST_MAX_WRITE_ERRORS,
  FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES,
  FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS,
  FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS,
  FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS,
  FREEHOLD_RETRYABLE_HOLD_KINDS,
  type FreeholdPersistPorts,
  type FreeholdPersistStore,
  type LoadedFreehold,
} from '../../server/freehold_persist';
import {
  freeholdPersistIdle,
  registerFreeholdPersistStore,
} from '../../server/freehold_persist_registry';
import { seedWouldLandOnRealRow } from '../../server/freehold_write_seal';
import { createKeyedSerialWriter } from '../../server/serial_writer';
import {
  FREEHOLD_MAX_LAYOUT_ROWS,
  FREEHOLD_MAX_OWNED_BYTES,
  FREEHOLD_MAX_STORED_BYTES,
  FREEHOLD_MAX_TROPHY_ROWS,
  type FreeholdLoadResult,
  type PersistedFreehold,
  persistedFreeholdBytes,
  persistedFreeholdFromState,
} from '../../src/sim/freehold/persisted';
import {
  defaultFreeholdState,
  ensureFreeholdRecord,
  evictFreehold,
  PENDING_FREEHOLD_PLOT_ID,
} from '../../src/sim/freehold/state';
import type { SimContext } from '../../src/sim/sim_context';
import { methodBody } from '../helpers/method_body';
import { stripComments } from '../helpers/strip_comments';

const SOURCE_PATH = 'server/freehold_persist.ts';

// Deliberately distinctive so the "no identifiers in stats" assertion cannot
// pass by accident against a small counter value.
const ACCOUNT_ID = 918_273;
const OWNER_KEY = `account:${ACCOUNT_ID}`;
const ROW_PLOT_ID = 'plot:rowfixture91';
// The identity a fresh account's own insert mints, distinct from the row
// fixture's, for the cases that model an entry re-reading the row it wrote.
const MINTED_PLOT_ID = 'plot:minted1';
const OTHER_ACCOUNT_ID = 604_513;
/** The shipped pool size the realm runs with (DB_POOL_MAX_CLIENTS_DEFAULT in
 *  server/db.ts), spelled here rather than imported, because that module opens a
 *  real Pool at module scope and this suite's whole point is that it drives the
 *  store with no database. Read as a source literal below, so the two cannot
 *  drift apart silently. */
const DEFAULT_DB_POOL_MAX_CLIENTS = 10;
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
  livePlotId?: string | ((ownerKey: string) => string);
  acquirePermit?: (signal: AbortSignal) => Promise<{ release(): void } | null>;
  enqueue?: <T>(key: string, signal: AbortSignal, write: () => Promise<T>) => Promise<T>;
  /** The COMBINED login port, which the real server binds and the two-port pair
   *  above only stands in for. Off by default so every existing case keeps
   *  driving the fallback; the cases that pass it are the only coverage the
   *  production arm has. */
  readDurables?: FreeholdPersistPorts['readDurables'];
  /** Override the deadline scheduler, for the one case that models a host whose
   *  timers refuse to arm. */
  scheduleDeadline?: FreeholdPersistPorts['scheduleDeadline'];
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
  // a row load installs the row's state (so the record carries the row's id),
  // and a fresh account seeds the pending stand-in and KEEPS IT for the whole
  // session, because nothing writes an identity into the sim. An earlier
  // version of this comment said a committed write stamps the minted id onto
  // the record; that stamp was deleted, and the comment outliving it is what
  // hid a live defect (a fresh account whose entry re-read its own row was
  // quiesced for its whole session) behind a harness that looked faithful.
  // Without this the harness would serialize documents whose identity the real
  // sim could never produce, and the store's seal would fire on fixtures rather
  // than on the race it guards.
  //
  // KNOWN GAP in the bag below, now bounded rather than merely stated. By
  // default `hasLive()` answers false while `serialize()` still returns a
  // document, so most cases run on a liveness state the server cannot produce
  // (it reads one map for both).
  //
  // ITS EXACT SCOPE, measured rather than feared. Only ONE production decision
  // reads `hasLive`: preload's already-live arm. `liveRev` and `serialize` are
  // the other two liveness reads and this bag keeps them mutually consistent,
  // because both derive from the case's own `serialize`. So the divergence
  // reaches exactly one branch, and only on a SECOND preload, since the first
  // legitimately runs before addPlayer seeds anything. Four cases pass `hasLive`
  // and do exercise that arm, both sub-arms. Five model a rejoin through the
  // combination the server cannot produce; each conclusion still holds for the
  // production sub-case it describes, and what the gap costs is DISCRIMINATION,
  // not correctness: none of those five can notice a regression in the
  // already-live arm.
  //
  // DERIVING hasLive FROM serialize WAS TRIED AND REVERTED. It is the right
  // shape and it reds four cases that model a COLD join with the default
  // document, which would have to be rewritten to keep saying what they say.
  // That is a suite-wide change, not a fix, and it is recorded here rather than
  // taken at the end of an audit.
  // THE POST-FIX MODEL. A row load installs the row's state, so the record
  // carries the row's id; an ABSENT load mints one and installLoadedFreehold now
  // installs a default carrying it, so the record carries the MINTED id from the
  // first session rather than the stand-in. The stand-in is what a record seeded
  // WITHOUT an install carries (addPlayer's ensureFreeholdRecord after an
  // eviction), which is the case every seal test overrides `livePlotId` to model.
  //
  // PER OWNER, because a realm's records are. The default used to answer the
  // LAST id minted by anyone, so a case driving two accounts handed the first
  // owner's record the second owner's identity: a state no realm can produce,
  // and one the write path's insert refusal correctly rejects.
  //
  // ATTRIBUTED THROUGH THE ACCOUNT WHOSE ROW READ IS IN FLIGHT, and that is
  // exact FOR SEQUENTIAL LOADS ONLY, which is what every case here drives.
  // `mintingFor` is one variable set when a read starts and read when the mint
  // happens, which is after both that load's reads resolve, so two loads for
  // DIFFERENT accounts overlapping would attribute the first one's mint to the
  // second. That is the same defect this replaced, one level up. No case reaches
  // it (the concurrent multi-account cases pin `livePlotId` to a constant), so
  // it is stated rather than closed: a case that interleaves two accounts'
  // reads owes a per-account attribution first.
  const livePlotIdNow = (ownerKey: string): string => {
    if (typeof options.livePlotId === 'function') return options.livePlotId(ownerKey);
    if (options.livePlotId !== undefined) return options.livePlotId;
    if (options.rowLoad?.kind === 'row') return options.rowLoad.row.plotId;
    return mintedByOwner.get(ownerKey) ?? PENDING_FREEHOLD_PLOT_ID;
  };
  const fifo = createKeyedSerialWriter<string>();
  let nowMs = 10_000;
  let minted = 0;
  /** The owner whose row read is in flight, so a mint can be attributed. */
  let mintingFor = '';
  const mintedByOwner = new Map<string, string>();

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
      mintingFor = `account:${accountId}`;
      return await readRow(accountId, maxOwnedBytes);
    },
    async readHearth(accountId: number): Promise<FreeholdHearthLoad> {
      calls.push('readHearth');
      return await readHearth(accountId);
    },
    ...(options.readDurables
      ? {
          readDurables: async (accountId: number, maxOwnedBytes: number) => {
            calls.push('readDurables');
            ownedBytesSeen.push(maxOwnedBytes);
            // biome-ignore lint/style/noNonNullAssertion: guarded by the spread.
            return await options.readDurables!(accountId, maxOwnedBytes);
          },
        }
      : {}),
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
      return doc === null ? null : { ...doc, plotId: livePlotIdNow(ownerKey) };
    },
    livePlotId(ownerKey: string): string | null {
      // BOUND TO hasLive, STRICTLY, because production reads both off ONE map
      // (`deps.sim.ctx.freeholds.get(ownerKey)`): no record means no identity,
      // and a harness that answered an identity for an owner it also says is
      // not live models a state the server cannot produce. The looser form,
      // which only consulted hasLive when a case supplied one, left the
      // identity-adoption arm covered by exactly that impossible state.
      //
      // The default is FALSE, like hasLive's, so a case that wants a live
      // identity says `hasLive: () => true` and means it.
      if (!(options.hasLive ? options.hasLive(ownerKey) : false)) return null;
      return serialize(ownerKey) === null ? null : livePlotIdNow(ownerKey);
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
      const id = `plot:minted${minted}`;
      if (mintingFor !== '') mintedByOwner.set(mintingFor, id);
      return id;
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
      if (options.scheduleDeadline) return options.scheduleDeadline(callback, ms);
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
    // THE TWO THIS BLOCK USED TO OMIT, under a title that claims every bound.
    // The drain cap was referenced by no test at all, so dropping the drain arm
    // of writeCap entirely was invisible; the leave reserve appeared only as
    // `MAX_ACTIVE_WRITES + LEAVE_WRITE_RESERVE`, which is the self-comparison
    // this block's own comment forbids.
    expect(FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES).toBe(8);
    expect(FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE).toBe(2);
    expect(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS).toBe(2_000);
    expect(FREEHOLD_MAX_STORED_BYTES).toBe(106_496);
    // The drain runs ABOVE the steady-state cap, which is the whole reason it
    // has a constant of its own: at the steady cap the ten-second deadline
    // covers about a quarter of a realm.
    expect(FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES).toBeGreaterThan(
      FREEHOLD_PERSIST_MAX_ACTIVE_WRITES,
    );
    // And the login statement bound stays under the login PERMIT bound, so the
    // statement can never be the dominant term on a handshake.
    expect(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS).toBeLessThan(
      FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS,
    );
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

  it('keeps every clock and timer behind a port, in EVERY file the store split into', () => {
    // ACROSS THE WHOLE STORE, not one file. Several modules have come off this
    // file and each is driveable from a Vitest for exactly this reason; a scan
    // pinned to SOURCE_PATH would have let a fresh clock or timer land in any of
    // them. Count-free on purpose: two separate rounds left a number here that
    // the next extraction falsified.
    //
    // DERIVED FROM THE DIRECTORY, never re-typed and never from the store's own
    // imports. A hand-written list goes stale the next time a module comes off,
    // and it goes stale SILENTLY, because every entry still exists and the
    // anti-staleness floor below reads clean; that is exactly what happened when
    // the revision probe was extracted. An IMPORT-derived list is the same trap
    // one level down: it drops any sibling the store does not import itself
    // (server/freehold_install.ts, which performs the hearth-clock merge and is
    // precisely where a Date.now is a behaviour bug, and
    // server/freehold_persist_registry.ts), and it cannot see a module extracted
    // from a sibling rather than from the store. The directory can see all of
    // them.
    //
    // ONE EXCLUSION, and it is a decision rather than an omission: the
    // composition root binds Date.now to the store's nowMs port, which is its
    // whole job.
    const COMPOSITION_ROOT = 'server/freehold_persist_wiring.ts';
    const files = readdirSync('server')
      .filter((name) => /^freehold_[a-z_]+\.ts$/.test(name))
      .map((name) => `server/${name}`)
      .filter((path) => path !== COMPOSITION_ROOT)
      .sort();
    // The derivation is pinned, so a filter that stopped matching would scan an
    // empty list and still pass. Both files an import-derived list LOST are
    // named, so narrowing it that way again reds here.
    for (const required of [
      SOURCE_PATH,
      'server/freehold_install.ts',
      'server/freehold_persist_registry.ts',
      'server/freehold_write_seal.ts',
      'server/freehold_load_outcome.ts',
      'server/freehold_revision_probe.ts',
      'server/freehold_hearth_load.ts',
    ])
      expect(files, required).toContain(required);
    expect(files).not.toContain(COMPOSITION_ROOT);
    let timers = 0;
    for (const file of files) {
      const source = stripComments(readFileSync(file, 'utf8'));
      expect(source, file).not.toMatch(/Date\.now\(/);
      expect(source, file).not.toMatch(/Math\.random\(/);
      expect(source, file).not.toMatch(/performance\.now\(/);
      timers += (source.match(/setTimeout\(/g) ?? []).length;
    }
    // The one sanctioned timer across all of them is the module-edge default
    // deadline scheduler, and it lives in the store itself.
    expect(timers).toBe(1);
    expect(stripComments(readFileSync(SOURCE_PATH, 'utf8'))).toContain(
      'const realScheduleDeadline',
    );
    // AND THE WALKER WALKED: a file list that went stale by a rename would read
    // as a clean bill of health, so every entry must exist and be non-trivial.
    for (const file of files) {
      expect(readFileSync(file, 'utf8').length, file).toBeGreaterThan(400);
    }
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
    gate.resolve({ kind: 'absent' });
    const [a, b] = await Promise.all([first, second]);
    // THE PROPERTY, not the promise identity. preload is async, so each call
    // returns its own wrapper around the one in-flight load; what single-flight
    // means is that the two callers get the SAME ANSWER off ONE read, which is
    // what these three assertions say. An identity check on the returned
    // promises would go red on a wrapper that changed nothing.
    expect(a).toBe(b);
    expect(h.calls.filter((call) => call === 'readRow')).toHaveLength(1);
    expect(h.store.stats().loads).toBe(1);

    // Drop the entry, then load again: a leaked in-flight slot would replay the
    // settled promise instead of reading. Counted on the READ, not on the plot
    // id: the id used to be the proxy here and it no longer distinguishes the
    // two, because a recreated entry now ADOPTS the live record's identity
    // rather than minting a second one (see below).
    h.store.retain(OWNER_KEY);
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(0);
    const third = await h.store.preload(ACCOUNT_ID);
    expect(h.store.stats().loads).toBe(2);
    expect(h.calls.filter((call) => call === 'readRow')).toHaveLength(2);
    // With no record live, the second load mints a fresh identity, which is the
    // ordinary shape: adoption is pinned on its own below, where a record IS
    // live, because that is the only state it exists for.
    expect(a.plotId).toBe('plot:minted1');
    expect(third.plotId).toBe('plot:minted2');
  });

  it('ADOPTS the live record identity rather than minting a second one for the row', async () => {
    // ONE IDENTITY PER OWNER, not per entry. The mint is per ENTRY, and an entry
    // the orphan sweep collects between a preload and its retain is recreated
    // empty: minting again there gives the ROW a second identity while the
    // record installed from the first one keeps answering to the first, for the
    // life of that session, which the write seal then reads as two different
    // records and quiesces the account over.
    //
    // A LIVE RECORD IS THE PRECONDITION, so hasLive says so: production reads
    // the identity and the liveness off ONE map, and an entry that finds no
    // record has nothing to adopt.
    // ROW_PLOT_ID rather than MINTED_PLOT_ID, deliberately: MINTED_PLOT_ID is the
    // same literal the harness's FIRST mint produces, so adopting it and minting
    // it are indistinguishable and the assertion below would be vacuous.
    const h = harness({
      rowLoad: { kind: 'absent' },
      hasLive: () => true,
      livePlotId: ROW_PLOT_ID,
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.plotId).toBe(ROW_PLOT_ID);
    // AND NOTHING WAS MINTED. The harness's mint is monotonic and its first
    // answer is plot:minted1, which is what an unconditional mint would show.
    expect(loaded.plotId).not.toBe('plot:minted1');
    expect(h.store.stats().loadFailures).toBe(0);
  });

  it('REFUSES to name a row for a record it did not install', async () => {
    // THE OTHER HALF, and a defect this round's own fixes created. A live record
    // carrying the STAND-IN was seeded WITHOUT an install, because
    // installLoadedFreehold returns early on any hold, and loadFreehold is
    // load-once, so nothing can ever teach that record the name a row would be
    // created under. Minting one anyway inserts a row whose own record never
    // learns its name; applyWriteResult then caches the record's stand-in and
    // the seal's name comparison is inert BY VALUE EQUALITY for the life of that
    // entry, which is the eighth path arrived at from the other side.
    //
    // Both new arms produce this state: an admission hold whose entry ruling 2
    // now leaves re-readable, and the whole-preload cap's in-flight read landing
    // behind its refusal. It is refused once, here, rather than in each.
    const h = harness({
      rowLoad: { kind: 'absent' },
      hasLive: () => true,
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold?.kind).toBe('unnamed_record');
    expect(loaded.state).toBeNull();
    expect(loaded.durableRev).toBeNull();
    // TERMINAL, because nothing in this session can rename a load-once record.
    // The NEXT login builds a fresh entry whose install runs before the seed.
    expect(h.store.stats().loaded).toBe(1);
    expect(h.store.stats().held).toBe(1);
    // AND NOTHING IS WRITTEN, so the account that has no row still has none.
    h.store.markDirty(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
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
    // ITS OWN KIND, not the row-level one. A missing permit is pool or gate
    // saturation and an operator's response to it is nothing like the response
    // to a row this build cannot read; they shared one label until this round.
    expect(loaded.hold?.kind).toBe('no_permit');
    expect(loaded.hold?.detail).toContain(String(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS));
    expect(h.store.stats().loadFailures).toBe(1);
    expect(h.store.stats().loadFailuresByKind).toEqual({ no_permit: 1 });
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
    // A login storm filling the local cap is a CAPACITY signal, and it must not
    // read as the row-level stranded-slot cause.
    expect(refused.hold?.kind).toBe('cap_full');
    expect(refused.hold?.detail).toContain('cap');
    expect(h.store.stats().loadFailuresByKind).toEqual({ cap_full: 1 });
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
      // THE OTHER ARM of the same refusal, which had no store-level case at
      // all. Past the on-disk pre-gate the stored text was never rendered, so
      // there is no measured length and reporting one would be a number nobody
      // took: the detail has to name the DISK bytes and the limit that was
      // never measured, and the refusal counts separately because the two mean
      // different things to an operator.
      name: 'a row refused on its on-disk size before anything was rendered',
      options: {
        rowLoad: {
          kind: 'oversize',
          plotIndex: 0,
          plotId: ROW_PLOT_ID,
          durableRev: '9',
          bytes: 0,
          limit: FREEHOLD_MAX_STORED_BYTES,
          detoastRefused: true,
          diskBytes: 4_000_000,
        },
      },
      kind: 'oversize',
      detail: '4000000 on-disk bytes past the pre-gate',
    },
    {
      name: 'a row the reader would not admit',
      options: {
        rowLoad: {
          kind: 'unadmitted',
          plotIndex: 1,
          plotId: ROW_PLOT_ID,
          durableRev: '9',
          detail: 'plot_index 1 is outside the admitted slot 0',
        },
      },
      kind: 'unadmitted',
      // THE REAL PRODUCER'S TEXT, not a hand-written stand-in.
      // server/freehold_db.ts builds this string, and it reaches a log through
      // the store's warn port, so the shape bound in
      // src/sim/freehold/load_report.ts has to admit it. A fixture that invented
      // its own prose proved the bound admitted the fixture, not the producer.
      detail: 'plot_index 1 is outside the admitted slot 0',
    },
    {
      name: 'a row read that threw',
      options: {
        readRow: async () => {
          throw new Error('connection reset');
        },
      },
      kind: 'read_threw',
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
      // The pre-gate refusal is counted SEPARATELY from the measured one, in
      // both directions, because the two mean different things to an operator:
      // one says the row was too large to look at, the other says it was
      // measured and refused.
      const preGate = holdCase.options.rowLoad;
      const refusedOnDisk = preGate?.kind === 'oversize' && preGate.detoastRefused;
      expect(h.store.stats().preGateRefusals).toBe(refusedOnDisk ? 1 : 0);

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

  it('replaces an unadmitted detail the log vocabulary does not name', async () => {
    // The bound is a POSITIVE shape test and it is applied where the producer
    // lives outside this module. A row reader that started interpolating a plot
    // id, an item id or a row's own text into its detail would have printed it
    // verbatim on the store's warn port; it now reads `unclassified`, which
    // costs an operator one detail and leaks nothing.
    const h = harness({
      rowLoad: {
        kind: 'unadmitted',
        plotIndex: 1,
        plotId: ROW_PLOT_ID,
        durableRev: '4',
        detail: 'plot plot:secret-name-9f3a for account 918273 is stranded',
      },
    });
    h.store.retain(OWNER_KEY);
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold?.kind).toBe('unadmitted');
    expect(loaded.hold?.detail).toBe('unclassified');
    expect(h.warnings.join(' ')).not.toContain('secret-name-9f3a');
    expect(h.warnings.join(' ')).not.toContain(String(ACCOUNT_ID));
  });

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

  it('ARMS a write when the live revision moved BACKWARDS, and the seal then refuses it', async () => {
    // DETECTION IS NOT ADMISSION, and this case is where the two answers part.
    // The probe treats a backwards revision as movement, because a live record
    // that is not the one this entry committed is exactly the state worth
    // looking at; the seal then refuses to write it. The rule this used to pin
    // (a record carrying a real plot name goes backwards onto the row,
    // deliberately) is RETIRED: a live revision below the entry's last
    // committed one means the live record is not the record that commit came
    // from, and writing it walks the client-facing wire counter backwards
    // permanently, which is what the loader's own wire_rev_shape hold refuses
    // on the read side.
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
    // ARMED: without the backwards arm of the probe nothing would have been
    // armed at all and the refusal below could never have been reached.
    expect(h.store.stats().writeFailures).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors[0]).toContain('identity');
    // AND NOT WRITTEN: the row keeps the revision the entry committed.
    expect(h.writeCount()).toBe(0);
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
    // Including the null-revision guard in the sweep's own probe: without it
    // every pass over a loaded entry whose record is gone marks it dirty and
    // arms a write that can only ever land in `writes_without_record`.
    // serializeFreehold answers null when the owner holds no live record, and
    // the contract is to SKIP: a default written over a real row destroys the
    // owner's furnishings, and nothing in this realm holds a second copy.
    const h = await loadedStore({ serialize: () => null });
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    // The sweep did not even ARM one: without the null-revision guard the entry
    // would be marked dirty on every pass and each armed write would reach the
    // statement with no document to send.
    expect(h.store.stats().writesWithoutRecord).toBe(0);
    expect(h.store.stats().dirty).toBe(0);
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

  it('keeps the entry while a write is still running', async () => {
    // NOT "running alone", which is what this used to claim. The entry is also
    // dirty throughout, and a mutation pass shows the dirty clause is what
    // carries the assertion: dropping `entry.running` from `owesWork` leaves
    // this green. Three of that predicate's five clauses are redundant under
    // today's arming rules, and the predicate says so where it is declared.
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
    // Documented and load-bearing for the PROBE: a `<=` comparison would call a
    // backwards revision clean, and the store would never look at a live record
    // that is not the one it committed. What the probe hands to is the seal,
    // which refuses the write; this case pins that the probe SAW it, which is
    // the half a `<=` mutant kills.
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
      expect(h.store.stats().writeFailures).toBe(0);

      rev = 7;
      h.store.saveAllDirty();
      await tick(30);
      // NOT written, but SEEN: a `<=` probe books no failure at all here.
      expect(h.writeCount()).toBe(0);
      expect(h.store.stats().writeFailures).toBe(1);
      expect(h.store.stats().quiesced).toBe(1);
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
      // And the drain still answers IMMEDIATELY rather than at its deadline,
      // but it answers FALSE: nothing is running, pending or deferred, so there
      // is nothing left to wait for, and the entry is still dirty and unblocked
      // with nobody to re-arm it. Answering true here would report a clean drain
      // over an owner's unwritten edits.
      expect(await h.store.idle(60_000)).toBe(false);
      expect(h.deadlines.some((job) => job.fired)).toBe(false);
      expect(h.store.stats().dirty).toBe(1);
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
    // comparing a value with itself, because `document` carries entry.plotId by
    // construction. The seal moved to server/freehold_write_seal.ts, so what is
    // pinned here is WHICH VALUE runWrite hands it; every arm of the comparison
    // itself is driven directly in tests/server/freehold_write_seal.test.ts.
    expect(body).toContain('seedWouldLandOnRealRow(persisted, entry)');
    expect(body).not.toContain('seedWouldLandOnRealRow(document');
    const seal = stripComments(readFileSync('server/freehold_write_seal.ts', 'utf8'));
    expect(seal).toContain('persisted.plotId !== entry.state.plotId');
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

  it('counts ONE capture when a second leave lands over a surviving one', async () => {
    // The gauge is the only stated bound on this retention, and a bound that
    // cannot read zero is not one. A second leave over a surviving capture
    // holds ONE document and used to count TWO, so the series ratcheted upward
    // and never came back down. Two leaves, one write held open across both.
    const gate = deferred<FreeholdUpsertResult>();
    let rev = 6;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => await gate.promise,
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    expect(h.store.stats().leaveCaptures).toBe(1);

    // The same owner leaves again while the first write is still on the gate.
    rev = 7;
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    // ONE document is retained, so the gauge reads one. Counting the two
    // captures rather than the one retained document is what made it ratchet.
    expect(h.store.stats().leaveCaptures).toBe(1);

    gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(60);
    // And it returns to zero, which is the property the ratchet destroyed.
    expect(h.store.stats().leaveCaptures).toBe(0);
  });

  it("re-captures on a second leave, so the LAST session's edits are the ones written", async () => {
    // The sibling of the gauge case above, and the half it cannot see. The
    // gauge reads one either way; what separates them is WHICH document is
    // retained. A second leave that kept the stale capture instead of taking a
    // fresh one discards the second session's edits silently, and only shows up
    // when the record is already evicted by the time the write runs, which is
    // exactly what the capture exists for.
    const gate = deferred<FreeholdUpsertResult>();
    let rev = 6;
    let live = true;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      hasLive: () => live,
      serialize: () => (live ? persistedFixture({ rev }) : null),
      writeRow: async () => await gate.promise,
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    expect(h.store.stats().leaveCaptures).toBe(1);

    // The same owner edits again and leaves again, still behind the held write.
    rev = 7;
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    // The record is gone by the time the write runs, so the capture is the only
    // document there is.
    live = false;
    gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(60);
    h.store.saveAllDirty();
    await tick(60);

    // THE SECOND session's revision, not the first's: that is the assertion the
    // gauge case cannot make.
    expect(h.writes.at(-1)?.wireRev).toBe(7);
  });

  it('takes no capture at all for a HELD entry, so a hold retains nothing', async () => {
    // A held entry flushes nothing, and "nothing" has to include the eager
    // clone: taking a capture it can never write would retain a second full
    // record per held logout, on exactly the accounts already in recovery.
    const h = await loadedStore({
      rowLoad: {
        kind: 'oversize',
        plotIndex: 0,
        plotId: ROW_PLOT_ID,
        durableRev: '4',
        bytes: 200_000,
        limit: FREEHOLD_MAX_STORED_BYTES,
        detoastRefused: false,
        diskBytes: 8_000,
      },
    });
    expect(h.store.stats().held).toBe(1);
    // DIRTY as well as held, which is the state that separates the two arms:
    // markDirty has no hold test of its own, so a held entry can carry a dirty
    // generation, and it is only there that dropping the `!blocked` guard
    // changes anything.
    h.store.markDirty(OWNER_KEY);
    expect(h.store.stats().dirty).toBe(1);
    h.calls.length = 0;
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().leaveCaptures).toBe(0);
    // The absence of the clone IS the assertion: no serialize, and no write.
    expect(h.calls).not.toContain('serialize');
    expect(h.calls).not.toContain('writeRow');
  });

  it('never even enqueues a write for a held entry', async () => {
    // The FIRST of the three layers of the same gate, pinned on its own. arm()
    // refuses before the keyed FIFO, so a held owner costs no queue slot and no
    // background permit. Without this the write would be enqueued and refused a
    // layer later, which is the same row outcome and a different cost.
    const h = await loadedStore({
      rowLoad: {
        kind: 'unadmitted',
        plotIndex: 3,
        plotId: ROW_PLOT_ID,
        durableRev: '4',
        detail: 'plot_index 3 is outside the admitted slot 0',
      },
    });
    expect(h.store.stats().held).toBe(1);
    h.calls.length = 0;
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.calls).not.toContain('enqueue');
    expect(h.calls).not.toContain('permit');
    expect(h.writeCount()).toBe(0);
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

  it("serves a fresh account's write from its capture once the record is gone", async () => {
    // RETITLED to what it proves. It was named for the entry-identity arm and
    // never reached it: neither of the two mutants it cited (the entry
    // remembering the row's name, either way round) failed it. The reason was
    // an impossible harness state, now fixed above, and with the state made
    // reachable the second half of the case runs straight into the carried
    // fresh-account quiesce instead, which has its own case below.
    //
    // What is left is worth keeping on its own: a brand-new account's write
    // lands from the CAPTURE after removePlayer has evicted the record, which
    // is the whole reason the capture is taken before the wait.
    let live = true;
    let granted = 0;
    let inserted = false;
    const permit = deferred<{ release(): void } | null>();
    const h = await loadedStore({
      // THE ROW APPEARS ONCE IT IS INSERTED. A readRow pinned to `absent`
      // modelled a state the database cannot be in: the store re-read the same
      // account after a confirmed insert, found nothing, fenced insert-only a
      // second time and minted a SECOND identity for one account. With
      // `entry.durableRev` null on that second write the seal is structurally
      // disarmed, so the case could never reach the arm it is named for.
      readRow: async (): Promise<FreeholdRowLoad> =>
        inserted
          ? { kind: 'row', row: rowFixture({ plotId: MINTED_PLOT_ID, wireRev: '6' }) }
          : { kind: 'absent' },
      normalized: {
        kind: 'loaded',
        state: persistedFixture({ plotId: MINTED_PLOT_ID, rev: 6 }),
        repaired: [],
      },
      // THE MINTED NAME, not the stand-in. A record that is live while its own
      // load is still running carries whatever the install gave it, and after
      // the identity fix that is the minted id. A record carrying the STAND-IN
      // at this point would be one seeded WITHOUT an install, which the absent
      // arm now refuses to name a row for at all.
      livePlotId: MINTED_PLOT_ID,
      serialize: () => (live ? persistedFixture({ rev: 6 }) : null),
      hasLive: () => live,
      acquirePermit: async () => {
        granted += 1;
        return granted === 1 ? { release: () => {} } : await permit.promise;
      },
      writeRow: async (input) => {
        inserted = true;
        return {
          kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
          durableRev: '1',
        };
      },
    });
    void h.store.flushAndRelease(OWNER_KEY);
    await tick(10);
    live = false;
    permit.resolve({ release: () => {} });
    await tick(30);
    expect(h.writeCount()).toBe(1);

    // The write carried the CAPTURE, not a null serialize: the record was gone
    // before the permit landed, so without it this write would have reached the
    // statement with nothing to send.
    expect(h.writes[0].wireRev).toBe(6);
    expect(h.store.stats().writesWithoutRecord).toBe(0);
    expect(h.store.stats().leaveCaptures).toBe(0);
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

  it('refuses a reseeded default over a FRESH account that has since furnished', async () => {
    // WHICH ARM REFUSES HERE HAS CHANGED, and the case is renamed rather than
    // left claiming the old one. It used to model the blind window where a fresh
    // account's record and a freshly seeded default shared the stand-in name, so
    // only the pristine arm could separate them. `installLoadedFreehold` names
    // the minted record now, so the entry's cached identity is the minted id and
    // the reseeded default's is the stand-in: the NAME comparison refuses first
    // and short-circuits the rest. What this case still proves at the store
    // level is the outcome, that a reseed over a furnished account is refused
    // and the owner quiesces. The pristine arm itself is driven with literals in
    // tests/server/freehold_write_seal.test.ts, which needs no store.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : MINTED_PLOT_ID),
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

  it('refuses a reseeded default over an account that differs ONLY by revision', async () => {
    // The revision half of "knows more" used to be what this isolated. It is not
    // any more, for the reason the case above gives: the name comparison refuses
    // first for every entry class. Kept for the OUTCOME, that an account which
    // moved its record without placing anything (a tier grant bumps the revision
    // and touches no row) is still protected from a reseed. The dimension itself
    // is driven in tests/server/freehold_write_seal.test.ts.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : MINTED_PLOT_ID),
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
    //
    // AT A HIGHER REVISION, which is the only shape a real emptying has. The
    // fixture used to sit at revision ZERO to look as much like a seed as
    // possible, which modelled a state no sanctioned writer can produce: every
    // mutator increments, so removing twelve furnishings from a record at five
    // leaves it at six, not at zero. A revision BELOW the entry's last committed
    // one is now refused for every entry class, so the old fixture proved the
    // claim through a state the sim cannot reach.
    let emptied = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      serialize: () =>
        emptied
          ? persistedFixture({ layout: [], trophies: [], rev: 6 })
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

  it('still writes a fresh account whose OWN record is legitimately still empty', async () => {
    // THE ANTI-VACUITY ARM, and what it controls has changed with the fixture.
    // It used to model a record identical to a pristine seed, which needed the
    // stand-in name; the record carries its INSTALLED name now, so `standInSeed`
    // is false and the pristine arm is never reached at all. What it still
    // controls, and the reason it is not deleted, is that neither the identity
    // arm nor the insert refusal fires on an account whose own empty record is
    // exactly what it committed: writing it loses nothing, and refusing would
    // quiesce a healthy owner for no gain.
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: MINTED_PLOT_ID,
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

  it('refuses a seed the returning player has ALREADY TOUCHED', async () => {
    // THE SEVENTH PATH, and the one the pristine test does not reach. A seed
    // stops being pristine the instant the returning player does anything: one
    // tier grant today, one furnishing once that writer lands. The record is
    // then a stand-in identity at revision one standing against an entry that
    // committed revision seven, both other tests pass, and the empty default is
    // compare-and-swapped over the real house with plot_id untouched.
    //
    // What SEPARATED them was the regressed revision, and since the install fix
    // the name comparison refuses first here too. The regression discriminator
    // is pinned on its own, with literals and its own mutants, in
    // tests/server/freehold_write_seal.test.ts; what this case proves is the
    // outcome, that a touched reseed never lands on the row.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : MINTED_PLOT_ID),
      serialize: () =>
        seeded
          ? // The fresh default, then ONE edit on top of it: not pristine any more.
            persistedFixture({ tier: 'cottage', layout: [], trophies: [], rev: 1 })
          : persistedFixture({ tier: 'cottage', rev: 7 }),
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '2',
      }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(7);
    expect(h.writes[0].layoutJson).not.toBe('[]');

    seeded = true;
    h.store.saveAllDirty();
    await tick(30);
    // The absence of a second write IS the assertion: without it the row would
    // take layoutJson '[]' at wireRev 1 over a house stored at wireRev 7.
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors[0]).toContain('identity');
  });

  it('does NOT refuse a rejoin replay at the revision the entry committed', async () => {
    // THE COMPANION PROOF the identity fix owes, and the direction that made a
    // revision comparison wrong once before. W1 established that a rejoin replay
    // RESTARTS the record's revision from the last COMMITTED value, so the
    // discriminator has to be strictly-below rather than not-above: an entry
    // that committed seven and is handed a record back at seven is looking at
    // its own document, not at a different record.
    let rev = 7;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture({ wireRev: '7' }) },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => ({ kind: 'updated', durableRev: '9' }),
    });
    // The replay itself: same revision, so the probe sees no movement and only
    // an explicit mark arms it. It must be WRITTEN, not refused.
    h.store.markDirty(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(7);
    expect(h.store.stats().quiesced).toBe(0);

    // And the ordinary case after it: the returning player edits, the revision
    // climbs, and the write lands.
    rev = 8;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(2);
    expect(h.writes[1].wireRev).toBe(8);
    expect(h.store.stats().quiesced).toBe(0);
    expect(h.errors).toEqual([]);
  });

  it('refuses a REGRESSED revision for a ROW-LOADED entry, which the stand-in gate used to hide', async () => {
    // THE UN-GATING, proved on the entry class it was dead for. The
    // discriminator used to be checked only under the stand-in identity, on the
    // reasoning that any other name is already refused by the comparison above.
    // After the install fix no online record carries the stand-in, so that gate
    // would have made this arm dead code on the one host it exists for. Its live
    // case is the same-account character swap: the record the store sees belongs
    // to the previous session, carries the SAME real plot name, and sits below
    // the revision this entry committed.
    let rev = 7;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture({ wireRev: '7' }) },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 7 }), repaired: [] },
      // The SAME real name throughout, so the name comparison cannot be what
      // refuses this and only the revision can.
      livePlotId: ROW_PLOT_ID,
      serialize: () => persistedFixture({ rev }),
      writeRow: async () => ({ kind: 'updated', durableRev: '9' }),
    });
    h.store.markDirty(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);

    rev = 6;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.store.stats().writeFailures).toBe(1);
  });

  it('REFUSES an empty default over a MINTED account whose reseed caught up', async () => {
    // THE EIGHTH PATH, CLOSED. This case was pinned AS IT BEHAVED, asserting the
    // defect, so the fix would flip a red test rather than be discovered; this
    // is that flip.
    //
    // The seal's name comparison was INERT for an entry that minted its own row:
    // applyWriteResult caches the identity the LIVE RECORD carried, nothing
    // taught a live record its minted name, so that entry's cached name WAS the
    // stand-in and a freshly seeded default carried the same literal. The two
    // continuity tests were then the whole seal and both are revision-shaped, so
    // a reseed whose revision had CAUGHT UP satisfied neither and the empty
    // tier-0 Inn Room was compare-and-swapped over the house.
    //
    // installLoadedFreehold now installs a default carrying the minted identity
    // on the ABSENT arm, so the live record answers to its own name from the
    // first session and a RESEED (ensureFreeholdRecord after an eviction, which
    // has no install in front of it) carries the stand-in. The two differ, and
    // the name comparison fires.
    let seeded = false;
    const house = persistedFixture({ tier: 'cottage', condition: 91, rev: 7 });
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      // The record's identity: the MINTED one while it is the installed record,
      // the stand-in once it has been reseeded without an install.
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : 'plot:minted1'),
      serialize: () =>
        seeded
          ? // The reseeded default, edited past the entry's committed revision.
            persistedFixture({
              tier: 'inn_room',
              layout: [],
              trophies: [],
              condition: 100,
              visitPolicy: 'closed',
              rev: 9,
            })
          : house,
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '2',
      }),
    });
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].layoutJson).not.toBe('[]');
    expect(h.writes[0].plotId).toBe('plot:minted1');

    seeded = true;
    h.store.saveAllDirty();
    await tick(30);
    // NO SECOND WRITE. The row keeps the house, and the owner is write-blocked
    // for the session with an error line rather than losing it silently.
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors[0]).toContain('identity');
  });

  it('REFUSES the same reseed when its revision EQUALS the committed one', async () => {
    // The neighbouring case, because the old escape threshold was `>=` and not
    // `>`. Kept separate so a future change that only moves a boundary is still
    // caught: this one is refused by the NAME, with both revisions equal, so it
    // reaches the seal through a different arm than the case above.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : 'plot:minted1'),
      serialize: () =>
        seeded
          ? persistedFixture({
              tier: 'inn_room',
              layout: [],
              trophies: [],
              condition: 100,
              visitPolicy: 'closed',
              rev: 7,
            })
          : persistedFixture({ tier: 'cottage', condition: 91, rev: 7 }),
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: '2',
      }),
    });
    h.store.saveAllDirty();
    await tick(30);
    seeded = true;
    h.store.markDirty(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors[0]).toContain('identity');
  });

  it('REFUSES the same reseed for a ROW-LOADED entry, which is why this is about the MINT', async () => {
    // The contrast arm, and the reason the two KNOWN DEFECT cases above are
    // about the entry that minted its own row rather than about the seal in
    // general. Identical shape, one difference: this entry loaded a ROW, so its
    // cached name is the row's and the seeded default's stand-in differs from
    // it. The name comparison fires and the house survives.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture({ wireRev: '7' }) },
      normalized: {
        kind: 'loaded',
        state: persistedFixture({ tier: 'cottage', condition: 91, rev: 7 }),
        repaired: [],
      },
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : ROW_PLOT_ID),
      serialize: () =>
        seeded
          ? persistedFixture({
              tier: 'inn_room',
              layout: [],
              trophies: [],
              condition: 100,
              visitPolicy: 'closed',
              rev: 9,
            })
          : persistedFixture({ tier: 'cottage', condition: 91, rev: 7 }),
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    seeded = true;
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors[0]).toContain('identity');
  });

  it('KEEPS WRITING a fresh account whose entry re-reads the row it wrote', async () => {
    // THE MIRROR OF THE EIGHTH PATH, and the other half this fix closes. It was
    // pinned AS IT BEHAVED, asserting a quiesce; this is the flip.
    //
    // Nothing used to teach a live record its minted name, so a first-session
    // record carried the stand-in for as long as it lived. If that account's
    // store entry was dropped and RE-READ from the row it had just inserted
    // (retain's lost-entry reload, or a second character joining), entry.state
    // came back carrying the ROW's name while the same live record still carried
    // the stand-in, the names differed, and the account was write-blocked for
    // the rest of its session with a misleading message.
    //
    // Round nine tried to close it by exempting the stand-in from the name
    // comparison, which REOPENED a data-loss path (a seeded default whose
    // revision climbs past the entry's own is then admitted over a real row) and
    // was reverted. The fix is at the source instead: the record is installed
    // carrying the minted identity, so the re-read entry and the live record
    // agree and there is nothing for the seal to refuse.
    let inserted = false;
    let rev = 4;
    const h = harness({
      readRow: async (): Promise<FreeholdRowLoad> =>
        inserted
          ? { kind: 'row', row: rowFixture({ plotId: MINTED_PLOT_ID, wireRev: String(rev) }) }
          : { kind: 'absent' },
      normalized: {
        kind: 'loaded',
        state: persistedFixture({ plotId: MINTED_PLOT_ID, rev: 4 }),
        repaired: [],
      },
      // The record installed on the absent arm carries the id the store minted,
      // which is what the harness's mint returns first.
      livePlotId: MINTED_PLOT_ID,
      hasLive: () => true,
      serialize: () => persistedFixture({ rev }),
      writeRow: async (input) => {
        inserted = true;
        return {
          kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
          durableRev: '1',
        };
      },
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].plotId).toBe(MINTED_PLOT_ID);

    await h.store.flushAndRelease(OWNER_KEY);
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    expect(h.store.stats().entries).toBe(0);
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    await tick(30);

    rev = 9;
    h.store.saveAllDirty();
    await tick(30);
    // A SECOND WRITE LANDS, carrying the session's later edit, and nothing is
    // quiesced or logged. The row keeps the same identity throughout.
    expect(h.writeCount()).toBe(2);
    expect(h.writes[1].plotId).toBe(MINTED_PLOT_ID);
    expect(h.writes[1].wireRev).toBe(9);
    expect(h.store.stats().quiesced).toBe(0);
    expect(h.errors).toEqual([]);
  });

  it('refuses a seed over a ROW that carries content at revision zero', async () => {
    // WHAT THIS PINS, stated exactly, because the case it was first written for
    // is not the case it reaches. A durable row is UNTRUSTED EXTERNAL INPUT, so
    // a real tier at wire revision zero is a shape an older build or a second
    // writer can leave behind, and the seal must refuse a seed standing over it
    // even though the revision has not regressed and the seed is pristine.
    //
    // It is refused by the NAME comparison, not by the pristine arm: a
    // row-loaded entry caches the row's identity and the seed carries the
    // stand-in. Mutating the pristine arm away leaves this case green. That is
    // recorded rather than dressed up, and the arm's own comment says why it is
    // still kept.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture({ wireRev: '0', tier: 'manor' }) },
      normalized: {
        kind: 'loaded',
        // A real tier, no layout, and revision zero: the revision dimension
        // alone sees nothing here, so the tier dimension has to carry it.
        state: persistedFixture({ tier: 'manor', layout: [], trophies: [], rev: 0 }),
        repaired: [],
      },
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : ROW_PLOT_ID),
      serialize: () => persistedFixture({ tier: 'inn_room', layout: [], trophies: [], rev: 0 }),
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    seeded = true;
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    // The absence of the write IS the assertion: the manor row survives.
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().quiesced).toBe(1);
  });

  it('refuses a seed whose revision has CLIMBED PAST the entry it stands over', async () => {
    // The shape a round-nine exemption admitted, and the reason that exemption
    // was reverted. A returning player who touches the seed enough times inside
    // one sweep interval carries its revision ABOVE the entry's last committed
    // one, at which point a continuity test alone sees nothing wrong: the
    // revision has not regressed, the record is not pristine, and the empty
    // tier-0 default lands on the house. `entry.state.rev + 1` edits is all it
    // takes, so this is two or three furnishings once that writer exists.
    let seeded = false;
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture({ wireRev: '2' }) },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 2 }), repaired: [] },
      // The live record is a FRESH SEED that has since been edited three times,
      // so its revision is above the entry's and its content is still empty.
      livePlotId: () => (seeded ? PENDING_FREEHOLD_PLOT_ID : ROW_PLOT_ID),
      serialize: () =>
        seeded
          ? persistedFixture({ layout: [], trophies: [], rev: 3 })
          : persistedFixture({ rev: 2 }),
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    seeded = true;
    h.store.saveAllDirty();
    await tick(30);
    // The absence of the write IS the assertion: the row keeps the house.
    expect(h.writeCount()).toBe(0);
    expect(h.writes).toEqual([]);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors[0]).toContain('identity');
  });

  it('still writes a NAMED record whose revision only CLIMBS', async () => {
    // THE ANTI-VACUITY ARM for the regression test: the reason it compares
    // against the entry's own committed revision rather than refusing every
    // climb. A brand-new account edits its house all session under the name its
    // install gave the record, and every one of those writes must land. The
    // fixture carried the STAND-IN when it was written, which is the state the
    // install fix removed; it carries the installed name now, and the title says
    // so rather than describing a record no online host produces.
    let rev = 3;
    const h = await loadedStore({
      rowLoad: { kind: 'absent' },
      livePlotId: MINTED_PLOT_ID,
      serialize: () => persistedFixture({ rev }),
      writeRow: async (input) => ({
        kind: input.expectedDurableRev === null ? 'inserted' : 'updated',
        durableRev: String(rev),
      }),
    });
    for (const next of [4, 5, 6]) {
      h.store.saveAllDirty();
      await tick(30);
      rev = next;
    }
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(4);
    expect(h.writes.map((write) => write.wireRev)).toEqual([3, 4, 5, 6]);
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

  // DELETED at the persistence QA and replaced by this note. It was titled "the
  // gauge returns to zero, so the retention it bounds is falsifiable" and its
  // body asserted one, then one again, and never zero: a strictly weaker copy of
  // "counts ONE capture when a second leave lands over a surviving one" above,
  // which drives the same two leaves over one held write and DOES assert the
  // return to zero. A case whose title names an assertion it does not make is
  // worse than no case.
  // A case titled "the gauge returns to zero, so the retention it bounds is
  // falsifiable" stood here and was DELETED at the persistence QA: its body
  // asserted one, then one again, and never zero. It was a strictly weaker copy
  // of "counts ONE capture when a second leave lands over a surviving one"
  // above, which drives the same two leaves over one held write and DOES assert
  // the return to zero, and of "releases a retained capture on the removal
  // paths, so the gauge can read zero" below. A case whose title names an
  // assertion it does not make is worse than no case.

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

  it('never writes for an entry that was quiesced while its write sat in the queue', async () => {
    // WHAT THIS PINS, stated exactly, because it used to claim more. The arm it
    // actually reaches is `settle`'s re-arm gate: the pending write is never
    // launched once the running one quiesces the entry. It does NOT reach
    // `runWrite`'s post-queue `blocked()` re-check, which a mutation pass
    // proved: removing that re-check leaves this case green, because the write
    // it guards is never enqueued in the first place.
    //
    // That re-check is kept as the third layer of the same gate (arm refuses,
    // runWrite re-checks, flushAndRelease refuses), and removing ALL THREE does
    // fail this suite. No behaviour test can isolate the middle one, because
    // nothing outside a write result can block an entry and every re-arm path
    // is already gated. Said here rather than left for the next reader to
    // rediscover as a passing test that proves nothing.
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

describe('the two admission caps sum past the shared gate, and that is the accepted answer', () => {
  it('never holds more PERMITS than the gate grants, however far its own caps sum past it', async () => {
    // RULING 4, pinned against the answer that was taken. The load cap (4) and
    // the write cap (4) are independent counters against a gate whose capacity
    // is smaller, so the store's own demand can exceed the gate's supply: 8 in
    // steady state and 12 during a drain, against 7. Sharing ONE budget between
    // them was considered and rejected, because it couples a player's login read
    // to a sweep's writes, which is the coupling the two constants were split to
    // avoid. What bounds real concurrency is the GATE, not the caps, and this
    // case is the executed proof of that rather than an argument for it.
    //
    // Driven through the REAL createBackgroundDbGate, not a fake, because the
    // claim is about how this store composes with the one gate the realm shares.
    // Cross-pinned against server/db.ts, because a pool size copied by hand is a
    // number that goes stale the moment the real one moves.
    expect(readFileSync('server/db.ts', 'utf8')).toContain(
      `const DB_POOL_MAX_CLIENTS_DEFAULT = ${DEFAULT_DB_POOL_MAX_CLIENTS};`,
    );
    const gate = createBackgroundDbGate(DEFAULT_DB_POOL_MAX_CLIENTS);
    const capacity = gate.stats().max;
    // The overcommit is the premise, so it is asserted rather than assumed: both
    // the steady-state demand and the drain demand exceed the supply.
    expect(FREEHOLD_PERSIST_MAX_ACTIVE_LOADS + FREEHOLD_PERSIST_MAX_ACTIVE_WRITES).toBeGreaterThan(
      capacity,
    );
    expect(
      FREEHOLD_PERSIST_MAX_ACTIVE_LOADS + FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES,
    ).toBeGreaterThan(capacity);

    // BOTH KINDS OF WORK PARK while holding their permits, which is the only
    // state in which the two caps can be demanding at once.
    const releaseReads: Array<() => void> = [];
    const releaseWrites: Array<() => void> = [];
    let peakPermits = 0;
    const h = harness({
      readRow: () =>
        new Promise<FreeholdRowLoad>((resolve) => {
          releaseReads.push(() => resolve({ kind: 'row', row: rowFixture() }));
        }),
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      // These entries load a ROW, so their live records carry the row's
      // identity; the harness cannot infer that from a readRow FUNCTION the way
      // it does from a rowLoad value.
      livePlotId: ROW_PLOT_ID,
      acquirePermit: async (signal) => {
        const permit = await gate.acquire(signal);
        if (permit === null) return null;
        peakPermits = Math.max(peakPermits, gate.stats().inFlight);
        return permit;
      },
      writeRow: () =>
        new Promise<FreeholdUpsertResult>((resolve) => {
          releaseWrites.push(() => resolve({ kind: 'updated', durableRev: '9' }));
        }),
    });

    // A set of owners already loaded and dirty, so their writes can fill the
    // write cap; then a burst of fresh logins, whose reads fill the load cap.
    const writers: string[] = [];
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 2; i++) {
      const accountId = OTHER_ACCOUNT_ID + i;
      const key = `account:${accountId}`;
      writers.push(key);
      h.store.retain(key, accountId);
      const loading = h.store.preload(accountId);
      await tick(10);
      releaseReads.shift()?.();
      await loading;
      h.store.markDirty(key);
    }
    h.store.saveAllDirty();
    await tick(40);
    expect(h.store.stats().activeWrites).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES);

    const logins = Array.from({ length: FREEHOLD_PERSIST_MAX_ACTIVE_LOADS + 3 }, (_, i) =>
      h.store.preload(OTHER_ACCOUNT_ID + 900 + i),
    );
    await tick(60);

    // THE BOUND THAT HOLDS: the gate never grants more than its capacity, so no
    // number of housing producers can put more clients on the pool than the
    // realm budgeted for every named producer together.
    expect(peakPermits).toBeLessThanOrEqual(capacity);
    expect(gate.stats().inFlight).toBeLessThanOrEqual(capacity);
    // AND HOUSING REALLY DID SATURATE IT, which is what makes the sentence above
    // load bearing instead of vacuous: the surplus waited for a permit rather
    // than running anyway, and it is housing holding every one of them.
    expect(gate.stats().inFlight).toBe(capacity);
    expect(gate.stats().waiting).toBeGreaterThan(0);

    // Let everything finish: releasing the parked work frees permits, which
    // admits the queued work, which parks in turn, so this drains in passes
    // rather than in one sweep.
    for (let pass = 0; pass < 20; pass++) {
      while (releaseReads.length > 0) releaseReads.shift()?.();
      while (releaseWrites.length > 0) releaseWrites.shift()?.();
      await tick(40);
    }
    await Promise.all(logins.map((login) => login.catch(() => undefined)));
  });
});

describe('the WHOLE preload is capped against the login budget', () => {
  /** Fire EVERY armed budget deadline, not the first: retain's repair reload is
   *  a preload of its own and arms one beside the case's explicit call, so
   *  firing only the first leaves the other caller parked on the same gated
   *  read. */
  const fireBudget = (h: Harness): void => {
    const armed = h.deadlines.filter(
      (deadline) => deadline.ms === FREEHOLD_PERSIST_LOGIN_BUDGET_MS && !deadline.cancelled,
    );
    expect(armed.length, 'a login budget deadline must be armed').toBeGreaterThan(0);
    for (const job of armed) job.fire();
  };

  it('arms ONE deadline for the whole load, at the budget, and cancels it on the answer', async () => {
    // Every STEP of a login-path load has a bound of its own and the SUM of
    // them had none: the pool checkout, BEGIN, SET LOCAL and a COMMIT that
    // neither server-side timeout covers answer to the pool, for a measured
    // floor of 104,000 ms. This is the cap on the whole thing.
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    await h.store.preload(ACCOUNT_ID);
    const budget = h.deadlines.filter((job) => job.ms === FREEHOLD_PERSIST_LOGIN_BUDGET_MS);
    expect(budget).toHaveLength(1);
    expect(budget[0]?.cancelled).toBe(true);
    expect(budget[0]?.fired).toBe(false);
    expect(FREEHOLD_PERSIST_LOGIN_BUDGET_MS).toBe(10_000);
  });

  it('refuses the LOAD, not the login, when the budget runs out', async () => {
    // The player joins, on the sim's default record, and no write goes out for
    // that account. Refusing the LOGIN over a durable housing read reverses a
    // decision this packet has already taken and pinned.
    const gate = deferred<FreeholdRowLoad>();
    const h = harness({ readRow: async () => await gate.promise });
    const loading = h.store.preload(ACCOUNT_ID);
    await tick(20);
    fireBudget(h);
    const answer = await loading;
    expect(answer.hold?.kind).toBe('no_budget');
    expect(answer.state).toBeNull();
    // The DURABLE ROW IS LEFT UNTOUCHED, which is what a hold means here:
    // installLoadedFreehold installs nothing for it. The account is NOT then
    // write-blocked for the session, and that difference is the defect this
    // round's own fresh read found: the in-flight read fills the entry, so the
    // store's absent arm has to refuse to name a row for a record no install
    // ever reached ('REFUSES to name a row for a record it did not install').
    expect(answer.durableRev).toBeNull();
    expect(h.store.stats().loadFailuresByKind).toEqual({ no_budget: 1 });
    expect(h.warnings.some((line) => line.includes('no_budget'))).toBe(true);
    // The detail rides the same bound every other housing log line does.
    expect(h.warnings.some((line) => line.includes('unclassified'))).toBe(false);
    gate.resolve({ kind: 'absent' });
    await tick(20);
  });

  it('leaves the ENTRY alone, so the read it gave up on still fills it', async () => {
    // THE ONE HOLD IN THIS STORE THAT DOES NOT TOUCH THE ENTRY. The read is
    // still in flight behind a single-flight slot; marking the entry held would
    // overwrite whatever that read then learns, and the honest answer is that
    // this LOGIN got nothing, not that the account is unreadable.
    const gate = deferred<FreeholdRowLoad>();
    const h = harness({
      readRow: async () => await gate.promise,
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    const loading = h.store.preload(ACCOUNT_ID);
    await tick(20);
    fireBudget(h);
    expect((await loading).hold?.kind).toBe('no_budget');
    // NOTHING WRITTEN ON THE ENTRY AT ALL, which is three separate facts: no
    // hold, no `loaded`, and no failure booked against the entry. Asserting the
    // hold alone left a refusal that stamped `loaded` green, and a stamped
    // `loaded` is what stops the repair arm ever reaching this entry again.
    expect(h.store.stats().held).toBe(0);
    expect(h.store.stats().loaded).toBe(0);
    expect(h.store.stats().entries).toBe(1);

    // The read lands afterwards and the entry becomes writable, exactly as it
    // would have if the login had waited.
    gate.resolve({ kind: 'row', row: rowFixture() });
    await tick(30);
    expect(h.store.stats().loaded).toBe(1);
    expect(h.store.stats().held).toBe(0);
    const replay = await h.store.preload(ACCOUNT_ID);
    expect(replay.hold).toBeNull();
    expect(replay.state?.rev).toBe(5);
  });

  it('creates NO row for a record the refused login is about to seed', async () => {
    // THE NINTH PATH, reproduced against the store before it was closed. The
    // load-side ordering refusal reads the LIVE RECORD, so it can only fire once
    // something has been seeded. This refusal leaves its read in flight by
    // design, and the handshake still has a lease acquire and a character reload
    // to run on the same saturated pool: the read lands in THAT window, before
    // addPlayer seeds anything, so livePlotId answers null rather than the
    // stand-in and the absent arm mints.
    //
    // What that produced, measured: entry loaded and unheld holding
    // `plot:minted1`, a row INSERTED under that name, writeFailures 0 and
    // quiesced 0, while the record addPlayer seeded a moment later carried the
    // stand-in. applyWriteResult then caches the RECORD's stand-in, so the
    // seal's name comparison is inert BY VALUE EQUALITY for the life of that
    // entry, which is the eighth path arrived at from a third side.
    //
    // IT IS PINNED ON THE OUTCOME, not on the mechanism: what must not happen is
    // that a row is created under a name its record can never learn, and the
    // guard that delivers that is order-independent.
    const gate = deferred<FreeholdRowLoad>();
    let seeded = false;
    const h = harness({
      readRow: async () => await gate.promise,
      hasLive: () => seeded,
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
    });
    const loading = h.store.preload(ACCOUNT_ID);
    await tick(20);
    fireBudget(h);
    expect((await loading).hold?.kind).toBe('no_budget');

    // The read lands while the handshake is still below the budget refusal and
    // above the seed. NOTHING is live yet, so the load-side test cannot fire.
    gate.resolve({ kind: 'absent' });
    await tick(30);
    const replay = await h.store.preload(ACCOUNT_ID);
    expect(replay.hold).toBeNull();
    expect(replay.plotId).toBe(MINTED_PLOT_ID);

    // Only now does the join reach addPlayer, and it seeds the STAND-IN because
    // installLoadedFreehold returned early on the no_budget hold.
    seeded = true;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);

    // Two sweeps, because a guard that refuses once is satisfied by a constant.
    h.store.saveAllDirty();
    await tick(40);
    h.store.saveAllDirty();
    await tick(40);
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors.some((line) => line.includes('refused (unnamed)'))).toBe(true);
    // ONE line, not one per sweep: an operator log that repeats every thirty
    // seconds for the life of a process is noise, not a diagnosis.
    expect(h.errors.filter((line) => line.includes('refused (unnamed)'))).toHaveLength(1);
  });

  it('costs one LOGOUT, not an account: the refused entry is collected and re-reads clean', async () => {
    // THE PROPERTY THAT MAKES THE REFUSAL SAFE, and the one a reader should
    // check before accepting it. Quiescing is terminal FOR THAT ENTRY, so if the
    // entry outlived the account the owner would be write-blocked forever, which
    // is a worse outcome than the path being closed.
    //
    // WHAT IT IS BOUNDED BY IS THE LOGOUT, not the session, and the weaker claim
    // is the true one. The poisoned RECORD is evicted by `removePlayer` only
    // when the last session sharing the owner key leaves, so while another
    // character of the same account is still online the record survives the
    // entry, and each new login's classify sees the stand-in and takes the
    // TERMINAL `unnamed_record` hold again. Bounded, never unbounded, because the
    // account fully logging out clears it; an earlier version of this case said
    // "one session", which is stronger than the code supports.
    const gate = deferred<FreeholdRowLoad>();
    let seeded = false;
    const h = harness({
      readRow: async () => await gate.promise,
      hasLive: () => seeded,
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
    });
    const loading = h.store.preload(ACCOUNT_ID);
    await tick(20);
    fireBudget(h);
    expect((await loading).hold?.kind).toBe('no_budget');
    gate.resolve({ kind: 'absent' });
    await tick(30);
    seeded = true;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    h.store.saveAllDirty();
    await tick(40);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.writeCount()).toBe(0);

    // The LAST session of the account leaves, in production order: the leave
    // flush runs while the record is still live and `removePlayer` evicts it
    // afterwards. A quiesced entry is BLOCKED, so its dirty clause stops counting
    // and it owes nothing: both removal paths may collect it.
    await h.store.flushAndRelease(OWNER_KEY);
    seeded = false;
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    await tick(30);
    expect(h.store.stats().entries).toBe(0);

    // The next login builds a fresh entry and reads clean. NO ROW was ever
    // created, so the row arm is not involved: the absent arm mints again, and
    // this time the answer carries no hold, so installLoadedFreehold names the
    // record before addPlayer can seed one.
    const second = await h.store.preload(ACCOUNT_ID);
    expect(second.hold).toBeNull();
    expect(second.state).toBeNull();
    expect(second.durableRev).toBeNull();
    expect(second.plotId).not.toBe('');
    expect(h.store.stats().quiesced).toBe(0);
  });

  it('still names a row when a SIBLING login is still waiting on the same read', async () => {
    // `beginLoad` is single-flight, so two characters of one account ride ONE
    // read. The refusal above is a property of the CALLER, not of the read, and
    // a first version recorded it against the ACCOUNT: an account whose two
    // characters joined together and whose first login overran was then
    // write-blocked for its whole session, with the second login's install
    // standing right there ready to name the record. Zero waiters is the test,
    // and it is exact rather than conservative because classify runs inside the
    // load promise, before any surviving waiter's own race has resolved.
    const gate = deferred<FreeholdRowLoad>();
    let seeded = false;
    const h = harness({
      readRow: async () => await gate.promise,
      hasLive: () => seeded,
      livePlotId: PENDING_FREEHOLD_PLOT_ID,
    });
    const first = h.store.preload(ACCOUNT_ID);
    const second = h.store.preload(ACCOUNT_ID);
    await tick(20);
    // ONLY the first login's budget fires; the second is still waiting.
    const armed = h.deadlines.filter(
      (deadline) => deadline.ms === FREEHOLD_PERSIST_LOGIN_BUDGET_MS && !deadline.cancelled,
    );
    expect(armed.length).toBe(2);
    armed[0]?.fire();
    expect((await first).hold?.kind).toBe('no_budget');

    gate.resolve({ kind: 'absent' });
    const answer = await second;
    expect(answer.hold).toBeNull();
    expect(answer.plotId).toBe(MINTED_PLOT_ID);

    // AND THE MINT IS NOT WHERE THIS CASE STOPS, which is the defect its first
    // version had. Asserting the mint and going home is what let the TENTH path
    // through: the REFUSED login reaches addPlayer first, because it stopped
    // waiting earlier and is always ahead in the pipeline, and seeds the
    // stand-in; the sibling's own install is then silently discarded by
    // loadFreehold's load-once guard, and the entry is left writable holding a
    // name its record can never learn. Reproduced against the store before the
    // insert refusal existed: a row inserted under plot:minted1 with
    // write_failures 0 and quiesced 0, after which applyWriteResult caches the
    // record's stand-in and the seal's name comparison is inert by value
    // equality for the life of that entry.
    seeded = true;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    h.store.saveAllDirty();
    await tick(40);
    // NO ROW IS CREATED, which is the thing that cannot be undone. The refusal
    // is order-independent, so which login reached the sim first cannot matter.
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().writeFailures).toBe(1);
    expect(h.store.stats().quiesced).toBe(1);
    expect(h.errors.some((line) => line.includes('refused (unnamed)'))).toBe(true);
  });

  it('still names a row for a login that WAITED for its own read', async () => {
    // The anti-vacuity arm, and the one that keeps the refusal above from being
    // satisfied by a constant: the ordinary absent-row login mints, because its
    // answer IS installed. Without it, refusing every absent load would pass.
    const h = harness({ rowLoad: { kind: 'absent' } });
    const answer = await h.store.preload(ACCOUNT_ID);
    expect(answer.hold).toBeNull();
    expect(answer.plotId).toBe(MINTED_PLOT_ID);
  });

  it('clears the abandonment with the read, so the NEXT login is not refused', async () => {
    // An abandonment that outlived its own read would refuse a perfectly
    // ordinary later load for the same account, which is a housing outage
    // manufactured by the guard against one.
    const gate = deferred<FreeholdRowLoad>();
    const h = harness({ readRow: async () => await gate.promise });
    const loading = h.store.preload(ACCOUNT_ID);
    await tick(20);
    fireBudget(h);
    expect((await loading).hold?.kind).toBe('no_budget');
    gate.resolve({ kind: 'absent' });
    await tick(30);

    // A FRESH entry, as the next login builds after the held one is collected.
    await h.store.flushAndRelease(OWNER_KEY);
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    await tick(30);
    expect(h.store.stats().entries).toBe(0);
    const second = await h.store.preload(ACCOUNT_ID);
    expect(second.hold).toBeNull();
    expect(second.plotId).not.toBe('');
  });

  it('runs the load UNCAPPED rather than refusing it when the timer cannot be armed', async () => {
    // A scheduler that will not schedule must not refuse a login: the behaviour
    // that predates the cap is the safe fallback, and it says so on the error
    // port rather than failing silently.
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      scheduleDeadline: () => {
        throw new Error('no timers');
      },
    });
    const answer = await h.store.preload(ACCOUNT_ID);
    expect(answer.hold).toBeNull();
    expect(answer.state).not.toBeNull();
    expect(h.errors.some((line) => line.includes('uncapped'))).toBe(true);
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
    // THE DRAIN'S OWN deadline, selected by its duration rather than by being
    // the only one: the login-path load in loadedStore schedules the whole
    // preload cap beside it, and both are cancelled.
    const drainDeadlines = h.deadlines.filter((job) => job.ms === 5_000);
    expect(drainDeadlines).toHaveLength(1);
    expect(drainDeadlines[0]?.cancelled).toBe(true);
    // AND NOTHING WAS LEFT ARMED. A deadline that fires after its own work has
    // settled is how a cancelled timer becomes a false not-drained answer.
    expect(h.deadlines.every((job) => job.cancelled || job.fired)).toBe(true);
    // The preload's cap is the other one, cancelled the moment the load landed.
    const budgetDeadlines = h.deadlines.filter(
      (job) => job.ms === FREEHOLD_PERSIST_LOGIN_BUDGET_MS,
    );
    expect(budgetDeadlines).toHaveLength(1);
    expect(budgetDeadlines[0]?.cancelled).toBe(true);
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
    // once more. The rejection is absorbed both times: idle still ANSWERS, and
    // it answers FALSE, because the second rejection leaves the same edits
    // unwritten and unblocked. It answers at once rather than at its deadline:
    // nothing is running, pending or deferred, so there is nothing to wait for.
    await expect(h.store.idle(5_000)).resolves.toBe(false);
    expect(h.deadlines.some((job) => job.fired)).toBe(false);
    expect(h.writeCount()).toBe(2);
    expect(h.store.stats().writeFailures).toBe(2);
  });

  it('drains an owner whose RECORD MOVED with no markDirty call', async () => {
    // The drain uses the SAME detector as the periodic sweep and the leave
    // flush, because the revision probe is the only dirty detector with a
    // production caller in this release: an isDirty-only drain could not see an
    // edit at all. It was correct before this only by the shutdown ORDERING in
    // server/main.ts, which is a property of another file.
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      normalized: { kind: 'loaded', state: persistedFixture({ rev: 5 }), repaired: [] },
      // The record moved. Nothing called markDirty, which is exactly the
      // production shape: markDirty has no production caller.
      serialize: () => persistedFixture({ rev: 6 }),
      writeRow: async () => ({ kind: 'updated', durableRev: '8' }),
    });
    expect(h.store.stats().dirty).toBe(0);
    await expect(h.store.idle(5_000)).resolves.toBe(true);
    expect(h.writeCount()).toBe(1);
    expect(h.writes[0].wireRev).toBe(6);
  });

  it('closes intake, and still lets a leaving session flush', async () => {
    const h = await loadedStore();
    expect(await h.store.idle(5_000)).toBe(true);
    // The drain itself writes whatever it found moved, so the arms below are
    // measured against that baseline rather than against zero.
    const drained = h.writeCount();
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    // Intake is closed: neither door adds a write.
    expect(h.writeCount()).toBe(drained);

    await h.store.flushAndRelease(OWNER_KEY);
    await tick(30);
    expect(h.writeCount()).toBe(drained + 1);
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

  it('installs nothing for a load that has NO state but still names a row', () => {
    // durableRev non-null means a row exists and this answer simply carries no
    // state for it, which is preload's already-live arm. Installing a default
    // there would put an empty record over a live one; loadFreehold is
    // load-once so it would be a no-op anyway, and this says so.
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, loadedFixture({ state: null }));
    expect(ctx.freeholds.size).toBe(0);
  });

  it('installs a DEFAULT carrying the minted identity when there is no durable row', () => {
    // THE ABSENT ARM, and the fix for the eighth path. This case used to assert
    // that nothing at all is installed, and that is exactly what left an online
    // record answering to the stand-in for its whole first session: the store
    // minted the identity the row would be inserted under, the record never
    // learned it, and the write seal's name comparison was then inert BY VALUE
    // EQUALITY for that entry class, because a freshly reseeded default carries
    // the same literal.
    const ctx = fakeCtx();
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      loadedFixture({ state: null, durableRev: null, plotId: MINTED_PLOT_ID }),
    );
    const record = ctx.freeholds.get(OWNER_KEY);
    expect(record?.plotId).toBe(MINTED_PLOT_ID);
    // A DEFAULT, and nothing else: the free tier-0 Inn Room at revision zero.
    expect(record?.tier).toBe('inn_room');
    expect(record?.layout).toEqual([]);
    expect(record?.trophies).toEqual([]);
    expect(record?.condition).toBe(100);
    expect(record?.visitPolicy).toBe('closed');
    expect(record?.rev).toBe(0);
    expect(record?.ownerKey).toBe(OWNER_KEY);
  });

  it('installs NOTHING over a record that is already live, whatever it carries', () => {
    // THE SAFE FORM'S DEFINING PROPERTY. The unsafe form stamps the minted
    // identity onto whatever record exists, which rewrites a freshly SEEDED
    // default's identity to the minted name and kills the seal's name
    // comparison and, through the stand-in test, both continuity arms with it.
    // Going through loadFreehold is what makes that impossible: it is load-once.
    const ctx = fakeCtx();
    ctx.freeholds.set(OWNER_KEY, defaultFreeholdState(OWNER_KEY, PENDING_FREEHOLD_PLOT_ID));
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      loadedFixture({ state: null, durableRev: null, plotId: MINTED_PLOT_ID }),
    );
    expect(ctx.freeholds.get(OWNER_KEY)?.plotId).toBe(PENDING_FREEHOLD_PLOT_ID);
    expect(ctx.freeholds.size).toBe(1);
  });

  it('installs nothing for an absent load whose identity the WIRE would refuse', () => {
    // The identity crosses the same spread bag every other field here does, and
    // one the wire refuses would make every later build-presence frame fail at
    // the type boundary with no diagnostic at all. An unchecked identity is not
    // installed and the account falls back to the stand-in, which is what it
    // had before this arm existed.
    for (const bad of ['', 'plot/slash', 'plot:' + 'x'.repeat(64)]) {
      const ctx = fakeCtx();
      installLoadedFreehold(
        ctx,
        ACCOUNT_ID,
        loadedFixture({ state: null, durableRev: null, plotId: bad }),
      );
      expect(ctx.freeholds.size, bad).toBe(0);
    }
  });

  it('COUPLES the install to the seal: a reseed over an INSTALLED identity is refused', () => {
    // THE COUPLING THE THREE FLIPPED SEAL CASES DO NOT HAVE. Each of those sets
    // the live identity by fixture, so reverting the install arm leaves all
    // three green and the eighth path's whole regression protection is one unit
    // case in another describe. This one derives BOTH identities from the real
    // sim: the record the install created, and the record ensureFreeholdRecord
    // seeds after an eviction. Revert the install and it reds on the first line.
    const ctx = fakeCtx();
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      loadedFixture({ state: null, durableRev: null, plotId: MINTED_PLOT_ID }),
    );
    const installed = ctx.freeholds.get(OWNER_KEY);
    expect(installed, 'the absent arm must install a record').toBeDefined();
    if (!installed) return;
    // What applyWriteResult would cache after a commit: the LIVE record's
    // identity, with the content the session went on to build.
    const committed = persistedFreeholdFromState({ ...installed, tier: 'cottage', rev: 7 });
    expect(committed.plotId).toBe(MINTED_PLOT_ID);

    // The record is evicted at the last session out and reseeded on the next
    // join with no install in front of it, which is the window the seal exists
    // for. Its revision then catches up, which is what defeats both continuity
    // arms and leaves the name comparison as the only thing standing.
    evictFreehold(ctx, OWNER_KEY);
    const reseeded = ensureFreeholdRecord(ctx, OWNER_KEY);
    expect(reseeded?.plotId).toBe(PENDING_FREEHOLD_PLOT_ID);
    if (!reseeded) return;
    const seedDoc = persistedFreeholdFromState({ ...reseeded, rev: 9 });
    expect(seedWouldLandOnRealRow(seedDoc, { state: committed, durableRev: '2' })).toBe(true);
  });

  it('installs nothing on the absent arm of a DARK host', () => {
    // loadFreehold honors the flag, so the arm cannot seed a dark realm. Without
    // this the new install would be the one record inserter that ignores it.
    const ctx = fakeCtx(false);
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      loadedFixture({ state: null, durableRev: null, plotId: MINTED_PLOT_ID }),
    );
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
    // The clock is installed on the absent arm too, above the plot entirely, so
    // an account with no row still carries its Hearth cooldown. The plot half of
    // this answer now seeds the default that carries the minted identity, which
    // is a separate claim pinned above; what this case owns is the clock.
    const ctx = fakeCtx();
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      loadedFixture({
        state: null,
        durableRev: null,
        plotId: MINTED_PLOT_ID,
        hearthReadyAtMs: 90_000,
      }),
    );
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

  it('installs no hearth clock on a dark host either', () => {
    // The record inserters honor the flag MECHANICALLY, and the durable clock is
    // the third writer of sim-owned housing state fed from a durable read. Its
    // dark-host guarantee used to be a property of two facts in other files: the
    // composition root gates the preload, and the unavailable answer carries a
    // zero clock the forward-only merge already refuses. Neither is this
    // module's, so the guard is here and this is what proves it.
    const ctx = fakeCtx(false);
    installLoadedFreehold(ctx, ACCOUNT_ID, {
      accountId: ACCOUNT_ID,
      plotIndex: 0,
      plotId: ROW_PLOT_ID,
      durableRev: '7',
      state: persistedFixture(),
      hearthReadyAtMs: 9_000,
      hearthRevision: '3',
      hold: null,
    });
    expect(ctx.freeholds.size).toBe(0);
    expect(ctx.freeholdKeyReadyAtMs.size).toBe(0);
    // The LIT contrast, so this is not a stopped installer.
    const lit = fakeCtx(true);
    installLoadedFreehold(lit, ACCOUNT_ID, {
      accountId: ACCOUNT_ID,
      plotIndex: 0,
      plotId: ROW_PLOT_ID,
      durableRev: '7',
      state: persistedFixture(),
      hearthReadyAtMs: 9_000,
      hearthRevision: '3',
      hold: null,
    });
    expect(lit.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(9_000);
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
    // BOTH HALVES, in the two files they now live in. The coordinator binds
    // before the seed; the binding module does install-then-retain inside that
    // one call. Splitting the assertion is what keeps it decisive after the
    // extraction: an ordering pin on the coordinator alone would pass however
    // the binding module ordered its two statements.
    const body = methodBody(GAME, '  join(');
    const bind = body.indexOf('bindFreeholdOnJoin(');
    const addPlayer = body.indexOf('this.sim.addPlayer(');
    expect(bind).toBeGreaterThan(-1);
    expect(addPlayer).toBeGreaterThan(-1);
    expect(bind).toBeLessThan(addPlayer);
    // The retain is SYNCHRONOUS on the join path and ahead of the seed, so a
    // same-account character swap (whose fire-and-forget leave releases the old
    // session) can never drop the entry under the arriving one. It carries the
    // account id, which is what lets the store re-read a row whose entry went
    // away between the handshake's preload and here.
    const binding = stripComments(readFileSync('server/freehold_session_binding.ts', 'utf8'));
    const install = binding.indexOf('installLoadedFreehold(ctx, accountId, loaded)');
    const retain = binding.indexOf('store.retain(ownerKey, accountId)');
    expect(install).toBeGreaterThan(-1);
    expect(retain).toBeGreaterThan(install);
    // And it is SYNCHRONOUS: an async binding would let the seed land first.
    expect(binding).not.toContain('export async function bindFreeholdOnJoin');
  });

  it('releases the store reference if the seed throws, so no reference leaks', () => {
    // The retain is paired with the leave a COMPLETED join guarantees. A throw
    // out of addPlayer means there is no session to leave, so without this the
    // reference is held for the life of the process and the entry can never be
    // collected. Pinned structurally because a throwing addPlayer is not
    // reachable from a unit test of this store.
    const body = methodBody(GAME, '  join(');
    const addPlayer = body.indexOf('this.sim.addPlayer(');
    const release = body.indexOf('releaseFreeholdBinding(this.freeholdPersist, freeholdOwnerKey)');
    expect(release).toBeGreaterThan(addPlayer);
    // INSIDE THE CATCH BLOCK, not merely after it. A slice-contains-catch test
    // is satisfied by a release moved out to just past the closing brace, and
    // that release runs on every SUCCESSFUL join: refs drops to zero while the
    // player is online, the orphan sweep collects the entry, and the session's
    // edits are discarded at logout with no hold and no counter. This reads the
    // block itself: from `catch (err) {` to the release there is no closing
    // brace, so the release is still inside it.
    const catchAt = body.indexOf('catch (err) {', addPlayer);
    expect(catchAt).toBeGreaterThan(addPlayer);
    expect(catchAt).toBeLessThan(release);
    expect(body.slice(catchAt + 'catch (err) {'.length, release)).not.toContain('}');
    // Exactly two releases in the whole join: the catch, and the guard below.
    expect(body.split('releaseFreeholdBinding(').length - 1).toBe(2);
    // AND THE WHOLE WINDOW, not addPlayer alone. A dozen throwable calls sit
    // between the seed and the `clients.set` that makes this session leavable,
    // and a throw in any of them leaks the same reference and leaves a seeded
    // record with no removePlayer to evict it, both for the process lifetime.
    const guarded = body.indexOf('let joined = false;');
    const closed = body.indexOf('joined = true;');
    const finallyRelease = body.indexOf(
      'releaseFreeholdBinding(this.freeholdPersist, freeholdOwnerKey)',
      release + 1,
    );
    expect(guarded).toBeGreaterThan(addPlayer);
    expect(closed).toBeGreaterThan(guarded);
    expect(finallyRelease).toBeGreaterThan(closed);
    // INSIDE THE FINALLY BLOCK, read the same way as the catch above. A
    // contains-'finally' test is satisfied by a release moved out past the
    // block's closing brace, which is the identical hole this case already
    // closes one line up for the catch: from `finally {` to the release there
    // is no closing brace, so the release is still inside it.
    const finallyAt = body.indexOf('finally {', closed);
    expect(finallyAt).toBeGreaterThan(closed);
    expect(finallyAt).toBeLessThan(finallyRelease);
    expect(body.slice(finallyAt + 'finally {'.length, finallyRelease)).not.toContain('}');
    // The record the seed inserted is taken back out with it, or nothing evicts it.
    expect(body.slice(finallyRelease)).toContain('this.sim.removePlayer(pid)');
    expect(body.indexOf('this.clients.set(pid, session)')).toBeLessThan(closed);
  });

  it('gives the reference back even when the flush rejects', () => {
    // THE SWALLOW MOVED, AND NOTHING PINNED IT. It used to sit at the call site
    // in server/game.ts and is now in the binding module that owns the pairing,
    // which is the right home and a place no reader of the leave path will look.
    // If a later edit drops it, flushAndRelease's rejection escapes the leave's
    // `finally` ABOVE the lease release and removePlayer, stranding the entry and
    // the seeded record for the life of the process: invariant 1 territory, and
    // unreachable from a unit test of this store because every caller is the
    // coordinator. The old call-site catch was unpinned too, so coverage did not
    // regress; it was never there.
    const binding = stripComments(readFileSync('server/freehold_session_binding.ts', 'utf8'));
    // Sliced by hand: methodBody closes on a two-space brace, and this is a
    // top-level function whose body closes at column zero.
    const opens = binding.indexOf('export async function flushFreeholdBinding(');
    expect(opens).toBeGreaterThan(-1);
    const body = binding.slice(opens, binding.indexOf('\n}', opens));
    expect(body).toContain('.flushAndRelease(ownerKey)');
    expect(body).toContain('.catch(');
    // And it is the FLUSH that is caught, not something after it: the release is
    // the half that must happen, so the catch has to sit on that same promise.
    const flushAt = body.indexOf('.flushAndRelease(ownerKey)');
    expect(body.slice(flushAt)).toContain('.catch(');
    expect(body.slice(0, flushAt)).not.toContain('.catch(');
  });

  it('flushes the plot after the character save and before the record is evicted', () => {
    // removePlayer reaches releaseFreeholdOnLeave, which evicts once the last
    // session sharing the owner key leaves; serializeFreehold then answers null
    // and a flush placed after it writes nothing, silently.
    // ACROSS BOTH HALVES, because the leave path is now a settlement inside a
    // try and three release lines inside its finally. The character save is in
    // the settlement; the plot flush, the lease release and removePlayer are in
    // the finally, in that order.
    const body = methodBody(GAME, '  async leave(session: ClientSession, _reason: string)');
    const settle = body.indexOf('await this.settleLeavingSession(session)');
    const guard = body.indexOf('} finally {');
    const plotFlush = body.indexOf('flushFreeholdBinding(this.freeholdPersist,');
    const removePlayer = body.indexOf('this.sim.removePlayer(');
    const leaseRelease = body.indexOf('releaseCharacterLease(');
    const settlement = methodBody(GAME, '  private async settleLeavingSession(');
    const characterSave = settlement.indexOf('await this.saveCharacterOnLeave(session)');
    expect(characterSave).toBeGreaterThan(-1);
    expect(settle).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(settle);
    expect(plotFlush).toBeGreaterThan(guard);
    expect(removePlayer).toBeGreaterThan(plotFlush);
    // AND ALL THREE RUN ON EVERY EXIT. All three callers invoke leave() as
    // `void this.leave(...)` with no catch, so a rejection in the settlement
    // used to skip the store release, the lease release and removePlayer
    // permanently: a pinned entry, a record nothing evicts, and a character
    // lease held to its TTL.
    // NOTHING between the settlement and the guard: the try holds that one call,
    // so every statement that can reject is inside it.
    expect(body.slice(settle, guard).replace(/\s+/g, ' ').trim()).toBe(
      'await this.settleLeavingSession(session);',
    );
    // The key is READ off the session, never re-derived: deriving it here would
    // put freeholdOwnerKeyForAccount's throw above all three lines.
    expect(body).toContain('const freeholdOwnerKey = session.freeholdOwnerKey;');
    expect(body).not.toContain('freeholdOwnerKeyForAccount(');
    // And inside this process's lease window: once the lease drops, a
    // replacement process can load the same account's plot and write it.
    expect(leaseRelease).toBeGreaterThan(plotFlush);
  });

  it('gives the four session REGISTRATIONS back on every exit, not at the end of the settlement', () => {
    // THE HOLE THE THREE RELEASES ABOVE DID NOT COVER. The settlement's own tail
    // still held four registrations, so a rejection anywhere above them (a final
    // save that exhausts its five attempts, then a guild-book revert that
    // faults) skipped all four while the finally released the freehold
    // reference, the lease and the sim entity. The character was then gone from
    // `clients` and from the sim while `sessionsByCharacterId` still mapped it:
    // planJoin answered 'character already in world' for every later login for
    // the life of the process, takeOverCharacter reported success and changed
    // nothing, and every whisper, mail and party lookup kept resolving to the
    // dead session and sending into a closed socket.
    const body = methodBody(GAME, '  async leave(session: ClientSession, _reason: string)');
    const settlement = methodBody(GAME, '  private async settleLeavingSession(');
    const guard = body.indexOf('} finally {');
    expect(guard).toBeGreaterThan(-1);
    for (const registration of [
      'this.sessionsByCharacterId.delete(session.characterId)',
      'this.guildBookHolders.dropSession(session)',
      'session.bankLedgerJournal.outbox.discard()',
      'storageRecovery.offline(session.characterId)',
    ]) {
      const at = body.indexOf(registration);
      expect(at, registration).toBeGreaterThan(guard);
      // AND NOWHERE ELSE. Left in the settlement as well, the throw path is
      // fixed and the healthy path runs each of them twice.
      expect(settlement, registration).not.toContain(registration);
    }
    // BEFORE the flush, the lease release and removePlayer, all of which await:
    // the registrations are what makes the character re-enterable, and holding
    // them behind a durable write is how a slow database becomes a locked-out
    // player.
    expect(body.indexOf('this.sessionsByCharacterId.delete(session.characterId)')).toBeLessThan(
      body.indexOf('flushFreeholdBinding(this.freeholdPersist,'),
    );
    // IDENTITY-GUARDED, AND THE GUARD COVERS BOTH CHARACTER-KEYED CALLS. A
    // same-account character swap sets the new session before the old one's
    // fire-and-forget leave arrives here, so an unguarded delete evicts the live
    // session's own registration, and an unguarded storageRecovery.offline marks
    // a LIVE character offline: it drops that character's gold-rail ordering
    // hold and its recovery-drive hold and makes it a capacity-eviction
    // candidate. The other two are keyed by session identity and cannot reach a
    // sibling, which is why only these two are guarded.
    expect(body).toContain(
      'const stillMine = this.sessionsByCharacterId.get(session.characterId) === session;',
    );
    expect(body).toContain(
      'if (stillMine) this.sessionsByCharacterId.delete(session.characterId);',
    );
    expect(body).toContain('if (stillMine) storageRecovery.offline(session.characterId);');
    // THE REVERT RUNS FIRST, above both index drops. Dropping a session from
    // them without reverting its unflushed ops strands uncommitted money deltas
    // on the live book: no mark for the disband guard, no session for the settle
    // gate, and the next officer's op serializes that book and commits them.
    // BOTH drops, which is what the sentence above claims: asserting only the
    // holder index left the OTHER one, the character map, free to move above the
    // revert, and that is the index whose ordering the money argument is about.
    const revert = body.indexOf('this.reconcileOwnGuildBooks(session)');
    expect(revert).toBeGreaterThan(guard);
    expect(revert).toBeLessThan(body.indexOf('this.guildBookHolders.dropSession(session)'));
    expect(revert).toBeLessThan(
      body.indexOf('if (stillMine) this.sessionsByCharacterId.delete(session.characterId);'),
    );
    // AND NOWHERE ELSE ON THE LEAVE PATH: left in the settlement as well, the
    // throw path is fixed and the healthy path reverts twice.
    expect(settlement).not.toContain('this.reconcileOwnGuildBooks(session)');
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
    expect(MAIN).toContain('game.sim.ctx.freeholdsEnabled');
    expect(MAIN).toContain('freeholdPreloadForAccount(id)');
    expect(MAIN).toContain('freeholdPreloadUnavailable(id,');
    // THE CONTIGUOUS CLAUSE, not three index comparisons. Both call forms sit
    // after the gate text whichever arm each one occupies, so an ordering pin
    // passes with the two arms SWAPPED: a lit realm answering every join with a
    // hold, and a dark realm issuing a durable read per join, both green.
    // Verified by applying that exact swap to this file's own text and re-running
    // the old arithmetic. This reads the ternary itself, the way the DDL CHECK
    // pins in tests/server/freehold_db.test.ts read theirs.
    const clause = MAIN.replace(/\s+/g, ' ');
    expect(clause).toContain(
      'freeholdForAccount: (id) => game.sim.ctx.freeholdsEnabled ' +
        '? freeholdPreloadForAccount(id) ' +
        ': Promise.resolve(freeholdPreloadUnavailable(id,',
    );
    // ONE SOURCE for the join path's decision. The store's own port reads
    // ctx.freeholdsEnabled, and so do both record inserters and retain's repair
    // reload; a live process.env read here disagreed with all of them across an
    // in-process flag flip. The live read belongs to the wire and the route.
    expect(clause).not.toContain('freeholdForAccount: (id) => freeholdsEnabled(process.env)');
  });
});

describe('the combined login port, which is what the server actually binds', () => {
  // EVERY OTHER CASE IN THIS FILE DRIVES THE FALLBACK. The two-port readRow and
  // readHearth pair is what the harness binds by default and what the store calls
  // on a host with no transaction seam; the real server binds readDurables, one
  // bounded transaction over both statements. A suite that never drives the
  // production arm cannot notice the two disagreeing, which is exactly what they
  // did before this block existed.
  it('is preferred over the two-port pair, and reads the same byte ceiling', async () => {
    const h = harness({
      readDurables: async (_accountId, _maxOwnedBytes) => ({
        row: { kind: 'absent' as const },
        hearth: { kind: 'absent' as const },
      }),
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    // ONE read, not three: the pair must not run beside the combined port.
    expect(h.calls).toEqual(['permit', 'readDurables', 'release']);
    expect(h.ownedBytesSeen).toEqual([FREEHOLD_MAX_STORED_BYTES]);
    // And a genuinely absent row still resolves to absence, which is the ONE
    // case allowed to become the free tier-0 default.
    expect(loaded.hold).toBeNull();
    expect(loaded.state).toBeNull();
    expect(loaded.durableRev).toBeNull();
  });

  it('carries a THROWN clock as a value: the clock goes cold, the plot does not hold', async () => {
    // The whole reason the port's hearth field is a union rather than a rejection.
    // On one shared transaction a rejecting clock read would roll the row back
    // with it, turning a clock fault into a write-blocking hold on the house.
    const h = harness({
      readDurables: async () => ({
        row: { kind: 'row' as const, row: rowFixture({ durableRev: '4' }) },
        hearth: { kind: 'threw' as const, error: new Error('clock read exploded') },
      }),
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    // THE PLOT LANDED. Not a hold, not an absence: the row's own state.
    expect(loaded.hold).toBeNull();
    expect(loaded.state).not.toBeNull();
    expect(loaded.durableRev).toBe('4');
    // THE CLOCK IS COLD, and the failure is reported rather than swallowed silently.
    expect(loaded.hearthReadyAtMs).toBe(0);
    expect(loaded.hearthRevision).toBe('0');
    // DO NOT TRIM THE NEXT LINE. It is the only assertion here that kills a
    // mutant deleting coldHearth: normalizeHearthLoad falls through to the same
    // zero and the same '0', so the two values above cannot tell them apart, and
    // the log is the only evidence that the failure was noticed at all.
    expect(h.errors.join(' ')).toContain('freehold hearth clock read failed');
  });

  it('answers a HOLD when the ROW half rejects, exactly as the two-port pair does', async () => {
    // The asymmetry stated in one place: the plot fails CLOSED, the clock fails
    // open. A rejecting port takes the row with it, and loadOnce turns that into
    // a hold, so nothing is written over a row this host could not read.
    const h = harness({
      readDurables: async () => {
        throw new Error('row read exploded');
      },
    });
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold?.kind).toBe('read_threw');
    expect(loaded.state).toBeNull();
    // WRITE-BLOCKED for the session, which is invariant 1.
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(20);
    expect(h.writes).toEqual([]);
  });

  it('resolves a malformed clock payload the SAME WAY on both port shapes', async () => {
    // THE DIVERGENCE THIS CASE EXISTS FOR. readLoginPair used to normalize the
    // combined arm's clock outside the `try` the fallback arm had, so a payload
    // that threw inside normalizeHearth answered a cold clock on one host and
    // held the whole login on the other. Which port a host binds must not decide
    // whether an account can write this session. ONE payload through BOTH arms,
    // and each arm asserted against fixed literals rather than against the other:
    // comparing the two would pass if both regressed the same way.
    const malformed = { kind: 'state', state: null } as unknown as FreeholdHearthLoad;
    const viaPair = await harness({
      rowLoad: { kind: 'row', row: rowFixture({ durableRev: '2' }) },
      readHearth: async () => malformed,
    }).store.preload(ACCOUNT_ID);
    const viaCombined = await harness({
      readDurables: async () => ({
        row: { kind: 'row' as const, row: rowFixture({ durableRev: '2' }) },
        hearth: malformed,
      }),
    }).store.preload(ACCOUNT_ID);
    // Neither holds, both land the plot, both start the clock cold.
    for (const loaded of [viaPair, viaCombined]) {
      expect(loaded.hold).toBeNull();
      expect(loaded.durableRev).toBe('2');
      expect(loaded.hearthReadyAtMs).toBe(0);
      expect(loaded.hearthRevision).toBe('0');
    }
  });
});

describe('the composition root that binds the combined port (source pins)', () => {
  // A SURVIVING MUTANT PUT THIS BLOCK HERE. Removing the clock swallow left all
  // 180 cases green, and `tsc` stays silent because dropping the `threw` arm only
  // NARROWS the value against the port's declared union. Nothing in this suite
  // imports the wiring module (it binds the real pool at module scope), so the
  // properties that make a shared transaction safe had no coverage of any kind.
  // These are structural pins, which is the honest tool for a binding whose real
  // behaviour needs a live pool; the transaction semantics they rest on were
  // measured against PostgreSQL and are recorded in section 8a of the rollout
  // contract.
  const WIRING = stripComments(readFileSync('server/freehold_persist_wiring.ts', 'utf8'));
  /** One port binding's own text, from its key to the next sibling key. Scoping
   *  matters more than usual here: an earlier version of the swallow pin ran its
   *  window to the next `}),` and so covered the WHOLE factory tail, which an
   *  identical catch attached to any other port would have satisfied. */
  const binding = (key: string, nextKey: string): string => {
    const at = WIRING.indexOf(`${key}:`);
    expect(at).toBeGreaterThan(-1);
    const stop = WIRING.indexOf(`${nextKey}:`, at);
    expect(stop).toBeGreaterThan(at);
    return WIRING.slice(at, stop);
  };

  it('binds BOTH login statements to ONE bounded transaction, through the policy', () => {
    const durables = binding('readDurables', 'writeRow').replace(/\s+/g, ' ');
    // ONE wrapper for the pair, not one per read: two wrappers is the defect
    // this replaced, and it costs four times the round trips on the login path.
    expect(durables.split('runWithStatementTimeout(').length - 1).toBe(1);
    expect(durables).toContain('FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS');
    // THROUGH THE POLICY MODULE, which is what makes the fail-open/fail-closed
    // rule executable at all: the closures in this file bind the real pool at
    // module scope, so nothing imports them and a mutant that deleted the clock
    // swallow left the whole suite green. The behaviour cases below drive
    // readLoginDurables directly; this pin is only that the binding uses it.
    expect(durables).toContain('readLoginDurables<FreeholdQueryable>(');
    // BOTH on the transaction's own `query`, never on the pool: a statement sent
    // to `pool` runs on a different client and escapes the bound entirely.
    expect(durables).toContain('run({ query })');
    expect(durables).toContain('freeholdForAccount(db,');
    expect(durables).toContain('loadFreeholdHearth(db,');
    expect(durables).not.toContain('freeholdForAccount(pool');
    expect(durables).not.toContain('loadFreeholdHearth(pool');
  });

  it('binds all four LIVE-RECORD reads through the function this suite drives', () => {
    // A SURVIVING MUTANT closed this once: replacing the identity probe's
    // binding with `() => null` left every case green, because every case
    // supplied its own port and the BINDING was never executed. The four reads
    // are now ONE function, `freeholdLivenessPorts`, which the harness above
    // binds over its own live map, so every case in this file executes the
    // composition root's liveness answers; its own suite,
    // tests/server/freehold_liveness.test.ts, drives each read against a real
    // map. What is left to pin here is that the root really spreads it, over
    // the live sim context, and binds no liveness port of its own beside it.
    const flat = WIRING.replace(/\s+/g, ' ');
    expect(flat).toContain('...freeholdLivenessPorts(() => deps.sim.ctx),');
    // A port written after the spread would override it silently.
    for (const port of ['hasLive:', 'serialize:', 'liveRev:', 'livePlotId:']) {
      expect(WIRING, port).not.toContain(port);
    }
  });

  it('EXECUTES the login policy: both reads answer, the clock lands with the row', async () => {
    // The first case that runs this code at all. Every earlier pin over the
    // combined port was source text, because the composition root binds the
    // real pool at module scope and nothing imports it.
    const seen: string[] = [];
    const got = await readLoginDurables<'db'>(
      async (run) => await run('db'),
      async (db) => {
        seen.push(`row:${db}`);
        return { kind: 'row', row: rowFixture() };
      },
      async (db) => {
        seen.push(`hearth:${db}`);
        return { kind: 'state', state: { readyAtMs: '90000', revision: '4' } };
      },
    );
    expect(seen).toEqual(['row:db', 'hearth:db']);
    expect(got.row.kind).toBe('row');
    expect(got.hearth).toEqual({ kind: 'state', state: { readyAtMs: '90000', revision: '4' } });
  });

  it('EXECUTES the login policy: the CLOCK fails open WITHOUT aborting the transaction', async () => {
    // A SURVIVING MUTANT closed. The first version of this case asserted only the
    // answer, and the answer is the same either way: with the inner catch
    // removed the clock's throw propagates out of the callback, the outer guard
    // sees a captured row and rebuilds the identical `threw` value. What DOES
    // differ is the transaction: without the catch the helper rolls it back and
    // rethrows for a fault in a read that fails OPEN by design, which is the
    // asymmetry this module exists to keep. So the case asserts the callback
    // RESOLVED, which is the property the catch actually buys.
    const boom = new Error('hearth read failed');
    let callbackSettled: 'resolved' | 'rejected' | 'pending' = 'pending';
    const got = await readLoginDurables<'db'>(
      async (run) => {
        try {
          const answer = await run('db');
          callbackSettled = 'resolved';
          return answer;
        } catch (err) {
          callbackSettled = 'rejected';
          throw err;
        }
      },
      async () => ({ kind: 'row', row: rowFixture() }),
      async () => {
        throw boom;
      },
    );
    expect(callbackSettled).toBe('resolved');
    expect(got.row.kind).toBe('row');
    expect(got.hearth).toEqual({ kind: 'threw', error: boom });
  });

  it('EXECUTES the login policy: a COMMIT fault keeps the clock it already read', async () => {
    // THE REGRESSION THIS CASE EXISTS FOR. The guard used to capture the ROW
    // alone, so a transaction that rejected AFTER both statements had answered
    // rebuilt the clock half from the outer error and reported `threw`, which
    // the store normalizes to the COLD clock, which reads as READY. The store
    // then remembers that zero on the entry and replays it to every later
    // character of the account for the rest of the session without reading
    // again. A clock that was READ is not an unreadable clock.
    const commitFault = new Error('connection terminated');
    const got = await readLoginDurables<'db'>(
      async (run) => {
        const answered = await run('db');
        void answered;
        throw commitFault;
      },
      async () => ({ kind: 'row', row: rowFixture() }),
      async () => ({
        kind: 'state',
        state: { readyAtMs: '90000', revision: '4' },
      }),
    );
    expect(got.row.kind).toBe('row');
    // The clock it read, NOT { kind: 'threw' }.
    expect(got.hearth).toEqual({ kind: 'state', state: { readyAtMs: '90000', revision: '4' } });
  });

  it('EXECUTES the login policy: the PLOT fails closed when no row was captured', async () => {
    // The other half of the asymmetry, and the one line that decides it. With
    // no row in hand the rejection is rethrown, so loadOnce turns it into a
    // HOLD and nothing is written over a row this host could not read.
    const rowFault = new Error('row read failed');
    await expect(
      readLoginDurables<'db'>(
        async (run) => await run('db'),
        async () => {
          throw rowFault;
        },
        async () => ({ kind: 'absent' }),
      ),
    ).rejects.toBe(rowFault);
  });

  it('EXECUTES the login policy: a transaction that fails BEFORE the row rethrows', async () => {
    // BEGIN, SET LOCAL or the pool checkout itself. No statement ran, so there
    // is no row and no clock, and the plot must still fail closed.
    const connectFault = new Error('pool checkout timed out');
    await expect(
      readLoginDurables<'db'>(
        async () => {
          throw connectFault;
        },
        async () => ({ kind: 'row', row: rowFixture() }),
        async () => ({ kind: 'absent' }),
      ),
    ).rejects.toBe(connectFault);
  });

  it('keeps the two-port fallback BOUNDED beside it, on the same constant', () => {
    // The pair every behaviour case in this file drives, and the store's declared
    // surface for a host with no transaction seam. Extracting the composition
    // root DROPPED both wrappers and left the pair on the pool's 15,000 ms
    // session default, while the file header claimed the move changed nothing. Dead on this host, because readDurables
    // is bound and the store prefers it, and pinned anyway: a fallback whose
    // bound silently differs from the real path is worse than no fallback.
    for (const [key, next] of [
      ['readRow', 'readHearth'],
      ['readHearth', 'readDurables'],
    ] as const) {
      const body = binding(key, next).replace(/\s+/g, ' ');
      expect(body).toContain('runWithStatementTimeout(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS');
      expect(body).toContain('({ query }');
      expect(body).not.toContain('(pool,');
    }
  });
});

describe('the gaps a mutation pass over the store found', () => {
  it('an ADMISSION hold is repairable: not loaded, still write-blocked, and re-read', async () => {
    // RULING 2. `entry.loaded` is what preload's replay arms and retain's
    // lost-entry repair consult, and holdResult used to set it for every kind,
    // so an account refused by a CAPACITY blip replayed that refusal for the
    // life of the entry: measured with the shared gate saturated, eight of eight
    // logins at one join per second were refused and a lone re-join for a
    // refused account still replayed the hold. The four fixture classes sanction
    // a terminal hold for a DATA cause, where a repeat read cannot change the
    // answer, and none of them sanctions one for a capacity cause.
    // EVERY KIND IN THE SET, not one of them: the set is what holdResult reads,
    // so a case that drives only no_permit leaves deleting cap_full and
    // read_threw from it green. Each is produced by a different port fault.
    expect([...FREEHOLD_RETRYABLE_HOLD_KINDS].sort()).toEqual([
      'cap_full',
      'no_budget',
      'no_permit',
      'read_threw',
    ]);
    for (const kind of ['cap_full', 'no_permit', 'read_threw'] as const) {
      const faulted = harness({
        rowLoad: { kind: 'row', row: rowFixture() },
        acquirePermit:
          kind === 'no_permit'
            ? async () => null
            : kind === 'read_threw'
              ? async () => ({ release: () => {} })
              : undefined,
        readRow:
          kind === 'read_threw'
            ? async () => {
                throw new Error('the read threw');
              }
            : undefined,
      });
      if (kind === 'cap_full') {
        // The local admission cap is filled by holding four loads open.
        const held = deferred<FreeholdRowLoad>();
        const capped = harness({ readRow: async () => await held.promise });
        const parked = Array.from({ length: FREEHOLD_PERSIST_MAX_ACTIVE_LOADS }, (_, i) =>
          capped.store.preload(OTHER_ACCOUNT_ID + i),
        );
        await tick(20);
        const refused = await capped.store.preload(ACCOUNT_ID);
        expect(refused.hold?.kind, kind).toBe('cap_full');
        expect(capped.store.stats().loaded, kind).toBe(0);
        held.resolve({ kind: 'absent' });
        await Promise.all(parked);
        continue;
      }
      const answer = await faulted.store.preload(ACCOUNT_ID);
      expect(answer.hold?.kind, kind).toBe(kind);
      // NOT loaded, which is the whole of ruling 2: the repair arm consults it.
      expect(faulted.store.stats().loaded, kind).toBe(0);
      expect(faulted.store.stats().held, kind).toBe(1);
    }

    let refuse = true;
    const h = harness({
      acquirePermit: async () => (refuse ? null : { release: () => {} }),
      rowLoad: { kind: 'row', row: rowFixture() },
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold?.kind).toBe('no_permit');
    // NOT loaded, and held. The gauge tells an operator how many entries can
    // actually write, so counting a refused one there was a second thing wrong.
    expect(h.store.stats().loaded).toBe(0);
    expect(h.store.stats().held).toBe(1);

    // STILL WRITE-BLOCKED while it is unrepaired, which is the caveat that makes
    // the change safe: `blocked()` is `!loaded || isHeld`, so both halves refuse
    // and no write goes out for this owner in the meantime.
    h.store.markDirty(OWNER_KEY);
    h.store.saveAllDirty();
    await tick(30);
    expect(h.writeCount()).toBe(0);

    // AND RE-READ on the next join, rather than replaying the refusal.
    refuse = false;
    h.calls.length = 0;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await tick(30);
    expect(h.calls).toContain('readRow');
    expect(h.store.stats().loaded).toBe(1);
    expect(h.store.stats().held).toBe(0);
  });

  it('a DATA hold stays TERMINAL, because a repeat read cannot change the answer', async () => {
    // The contrast arm, and the reason ruling 2 is about admission causes alone.
    // An unreadable row reads the same way every time: re-reading it spends a
    // permit and a statement on the login path for an answer that cannot move.
    const h = harness({
      rowLoad: {
        kind: 'oversize',
        plotIndex: 0,
        plotId: ROW_PLOT_ID,
        durableRev: '4',
        bytes: 200_000,
        limit: 100_000,
        detoastRefused: false,
        diskBytes: 200_000,
      },
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    const loaded = await h.store.preload(ACCOUNT_ID);
    expect(loaded.hold?.kind).toBe('oversize');
    expect(h.store.stats().loaded).toBe(1);
    h.calls.length = 0;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await tick(20);
    expect(h.calls).toEqual([]);
  });

  it('a rejoin that takes back a capture takes the entry out of the LEAVER subset too', async () => {
    // THE SUBSET OUTLIVING ITS SUPERSET. `retain` used to clear the capture with
    // two inline lines, doing the gauge and the null and leaving the entry in
    // `deferredLeavers`, which exists only so `pumpLoop` can find a deferred
    // LEAVER. A rejoin inside the deferral window then parked a CAPTURELESS
    // entry at the head of that set: `nextDeferred` returned it on every
    // admission and `pumpLoop` priced it at the NON-leaving cap, so the two
    // reserved slots never reached the genuine leavers queued behind it. That is
    // the starvation the reserve was rebuilt to end.
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    let rejoinerLive = false;
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      hasLive: (key) => key === OWNER_KEY && rejoinerLive,
      writeRow: async () => {
        const gate = deferred<FreeholdUpsertResult>();
        gates.push(gate);
        return await gate.promise;
      },
    });
    const dirtyLeaver = async (key: string, accountId: number): Promise<void> => {
      h.store.retain(key, accountId);
      await h.store.preload(accountId);
      h.store.markDirty(key);
      void h.store.flushAndRelease(key);
      await tick(20);
    };
    // Fill the ordinary cap, queue four behind it, then let two leavers take the
    // whole reserve, so every later leaver has to come through the pump.
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 4; i++) {
      const key = `account:${OTHER_ACCOUNT_ID + i}`;
      h.store.retain(key, OTHER_ACCOUNT_ID + i);
      await h.store.preload(OTHER_ACCOUNT_ID + i);
      h.store.markDirty(key);
      h.store.save(key);
    }
    await tick(20);
    for (let i = 0; i < FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE; i++) {
      await dirtyLeaver(`account:${OTHER_ACCOUNT_ID + 500 + i}`, OTHER_ACCOUNT_ID + 500 + i);
    }
    const leavingCap = FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE;
    expect(h.store.stats().activeWrites).toBe(leavingCap);

    // THE REJOINER. It leaves dirty, is deferred with a capture, and comes
    // straight back: its live record now carries the captured revision, so
    // retain hands the capture back.
    // Counted as a DELTA: the two reserve leavers above are still holding their
    // own captures, because a capture is released when its write settles and
    // theirs are gated open.
    const heldBefore = h.store.stats().leaveCaptures;
    await dirtyLeaver(OWNER_KEY, ACCOUNT_ID);
    expect(h.store.stats().leaveCaptures).toBe(heldBefore + 1);
    rejoinerLive = true;
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    expect(h.store.stats().leaveCaptures).toBe(heldBefore);

    // A GENUINE leaver behind it, also deferred and still holding its capture.
    const laterKey = `account:${OTHER_ACCOUNT_ID + 900}`;
    await dirtyLeaver(laterKey, OTHER_ACCOUNT_ID + 900);
    expect(h.store.stats().leaveCaptures).toBe(heldBefore + 1);

    // One slot frees. The pump must reach the entry that still holds a capture,
    // at the LEAVING cap; with the rejoiner still in the subset it answered
    // first, was priced at the non-leaving cap, and nothing launched at all.
    const before = h.writes.length;
    gates[0].resolve({ kind: 'updated', durableRev: '9' });
    await tick(40);
    const launched = h.writes.slice(before).map((write) => write.accountId);
    expect(launched).toContain(OTHER_ACCOUNT_ID + 900);
    expect(launched).not.toContain(ACCOUNT_ID);
    for (const gate of gates) gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(40);
  });

  it('a DEFERRED leaver waits, and the pump then prefers it over the queue', async () => {
    // MUTATION GAP, and the case that named it did not reach it. Dropping the
    // deferred-set clause from the flush wait left the suite green, because the
    // case titled "actually waits when its write is DEFERRED" saturates with
    // MAX + RESERVE background writes, which `save()` arms at the NON-leaving
    // cap: four launch, two defer, and the leaver then arms at the leaving cap
    // against four actives and LAUNCHES. Its write was never deferred.
    //
    // This one defers a leaver for real, by filling the LEAVING cap with two
    // earlier leavers, and proves both halves: the flush does not return while
    // its write sits in the deferred set, and the pump prefers it over the
    // background writes queued ahead of it. Before the pump honored the reserve,
    // a leaver that missed the arm-time window was re-admitted at the NON-leaving
    // cap in insertion order, behind every background write already queued, and
    // spent its whole deadline with the write unlanded.
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => {
        const gate = deferred<FreeholdUpsertResult>();
        gates.push(gate);
        return await gate.promise;
      },
    });
    const leaver = async (offset: number): Promise<void> => {
      const key = `account:${OTHER_ACCOUNT_ID + offset}`;
      h.store.retain(key, OTHER_ACCOUNT_ID + offset);
      await h.store.preload(OTHER_ACCOUNT_ID + offset);
      h.store.markDirty(key);
      void h.store.flushAndRelease(key);
      await tick(20);
    };
    // Four background writes fill the ordinary cap and four more queue behind it.
    for (let i = 0; i < FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + 4; i++) {
      const key = `account:${OTHER_ACCOUNT_ID + i}`;
      h.store.retain(key, OTHER_ACCOUNT_ID + i);
      await h.store.preload(OTHER_ACCOUNT_ID + i);
      h.store.markDirty(key);
      h.store.save(key);
    }
    await tick(20);
    expect(h.store.stats().activeWrites).toBe(FREEHOLD_PERSIST_MAX_ACTIVE_WRITES);
    expect(h.store.stats().deferredWrites).toBe(4);

    // Two leavers borrow the whole reserve at arm time.
    for (let i = 0; i < FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE; i++) await leaver(500 + i);
    const leavingCap = FREEHOLD_PERSIST_MAX_ACTIVE_WRITES + FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE;
    expect(h.store.stats().activeWrites).toBe(leavingCap);

    // The third leaver has no reserve left and is DEFERRED.
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    h.store.markDirty(OWNER_KEY);
    let released = false;
    const leaving = h.store.flushAndRelease(OWNER_KEY).then(() => {
      released = true;
    });
    await tick(30);
    expect(h.store.stats().leaveCaptures).toBeGreaterThan(0);
    // It has not written and it has not given up: this is the assertion the
    // deferred-set clause in the flush wait exists for.
    expect(h.writes.some((write) => write.accountId === ACCOUNT_ID)).toBe(false);
    expect(released).toBe(false);

    // One slot frees. The LEAVER goes next, not the oldest background entry.
    const writesBefore = h.writes.length;
    gates[0].resolve({ kind: 'updated', durableRev: '9' });
    await tick(40);
    const started = h.writes.slice(writesBefore);
    expect(started.length).toBeGreaterThan(0);
    expect(started[0].accountId).toBe(ACCOUNT_ID);

    for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(60);
    for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(60);
    await leaving;
    expect(released).toBe(true);
  });

  it('the drain runs ABOVE the steady-state cap, which is the constant it has for it', async () => {
    // FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES was observable by nothing:
    // dropping the `draining ?` arm of writeCap entirely left every case green,
    // including the drain's own, which asserts only that idle() stays unresolved
    // and that all the writes eventually land. Both are true at any cap.
    const gates: Array<Deferred<FreeholdUpsertResult>> = [];
    const h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      writeRow: async () => {
        const gate = deferred<FreeholdUpsertResult>();
        gates.push(gate);
        return await gate.promise;
      },
    });
    const owners = FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES + 3;
    for (let i = 0; i < owners; i++) {
      const key = `account:${OTHER_ACCOUNT_ID + i}`;
      h.store.retain(key, OTHER_ACCOUNT_ID + i);
      await h.store.preload(OTHER_ACCOUNT_ID + i);
      h.store.markDirty(key);
    }
    // NOT armed before the drain: the drain arms them itself, so the cap in
    // force is the drain's own.
    const drained = h.store.idle(60_000);
    await tick(40);
    expect(h.store.stats().activeWrites).toBe(FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES);
    for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(60);
    for (const gate of gates.splice(0)) gate.resolve({ kind: 'updated', durableRev: '9' });
    await tick(60);
    await expect(drained).resolves.toBe(true);
    expect(h.writeCount()).toBe(owners);
  });

  it('measures the codec and the two wait totals as EXACT advances of the store clock', async () => {
    // The four millisecond totals were asserted only with toBeGreaterThanOrEqual(0),
    // which every accumulation already guarantees through its own Math.max(0, ...),
    // so deleting all four accumulations left the suite green. maxWriteBytes was
    // compared against writeBytesTotal after exactly ONE write, which is the one
    // sample count where a total, a high-water mark and a last-sample gauge are
    // the same number.
    // The clock is advanced INSIDE each bracket, so both totals are exact
    // advances rather than whatever a real clock happened to do: 40 ms inside
    // the codec (the serialize call sits in it) and 700 ms inside the statement.
    let h!: Harness;
    let docSize: 'small' | 'first' | 'large' = 'first';
    const sized = (): PersistedFreehold =>
      docSize === 'small'
        ? persistedFixture({ layout: [], trophies: [] })
        : docSize === 'large'
          ? persistedFixture({
              layout: Array.from({ length: 12 }, (_, i) => ({
                placementId: i + 1,
                itemId: 'oak_chair',
                x: 1.5,
                y: 0,
                z: -2.25,
                yaw: 0,
              })),
            })
          : persistedFixture();
    h = harness({
      rowLoad: { kind: 'row', row: rowFixture() },
      serialize: () => {
        h.setNow(10_040);
        return sized();
      },
      writeRow: async () => {
        h.setNow(10_740);
        return { kind: 'updated', durableRev: '9' };
      },
    });
    h.store.retain(OWNER_KEY, ACCOUNT_ID);
    await h.store.preload(ACCOUNT_ID);
    h.setNow(10_000);
    const afterLoad = h.store.stats();
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    const after = h.store.stats();
    // The statement bracket and the codec bracket are DIFFERENT spans and both
    // move: write_ms is the statement, codec_ms is the serialize, clone and
    // refusal walk that sit between the permit and it. EXACT, because a
    // greater-than-or-equal-to-zero assertion is true of a deleted accumulation.
    expect(after.codecMsTotal - afterLoad.codecMsTotal).toBe(40);
    expect(after.writeMsTotal - afterLoad.writeMsTotal).toBe(700);
    // The high-water mark is a MARK, not the total and not the LAST SAMPLE. The
    // second write here used to be the same size as the first, so `mark ===
    // first` was equally true of a gauge holding the last sample; the two are
    // only separable by a write that is SMALLER. A third, larger one then
    // proves the mark still climbs, so it is not simply the first sample.
    expect(after.maxWriteBytes).toBe(after.writeBytesTotal);
    const first = after.maxWriteBytes;
    expect(first).toBeGreaterThan(0);

    docSize = 'small';
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    const twice = h.store.stats();
    const smaller = twice.writeBytesTotal - first;
    expect(smaller).toBeGreaterThan(0);
    expect(smaller).toBeLessThan(first);
    // A last-sample gauge would read `smaller` here.
    expect(twice.maxWriteBytes).toBe(first);

    docSize = 'large';
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    const thrice = h.store.stats();
    const larger = thrice.writeBytesTotal - twice.writeBytesTotal;
    expect(larger).toBeGreaterThan(first);
    // And a first-sample gauge would still read `first` here.
    expect(thrice.maxWriteBytes).toBe(larger);
  });

  it('stops owing a write that has no record and no capture, instead of re-arming forever', async () => {
    // MUTATION GAP that no behaviour case could reach through the store's own
    // arming rules, which is the honest reason it had none: markDirty has no
    // production caller, the revision probe cannot dirty an entry with no live
    // record, and GameServer.leave always flushes while the record is still
    // live. So it is driven through the ports directly, which is what the
    // furnishing writer will make ordinary.
    const h = await loadedStore({
      rowLoad: { kind: 'row', row: rowFixture() },
      hasLive: () => false,
      serialize: () => null,
    });
    h.store.markDirty(OWNER_KEY);
    h.store.save(OWNER_KEY);
    await tick(30);
    // The write reached its permit, found nothing to send, and issued no
    // statement.
    expect(h.writeCount()).toBe(0);
    expect(h.store.stats().writesWithoutRecord).toBe(1);
    // AND IT STOPPED OWING IT. Without the generation advance the entry stays
    // dirty, every later sweep re-arms the same empty write and spends a permit
    // on it, and owesWork keeps the entry resident for the life of the process.
    expect(h.store.stats().dirty).toBe(0);
    h.store.saveAllDirty();
    h.store.saveAllDirty();
    await tick(30);
    expect(h.store.stats().writesWithoutRecord).toBe(1);
    // Nothing is owed, nothing is referenced: the entry is collectable again.
    await h.store.flushAndRelease(OWNER_KEY);
    expect(h.store.stats().entries).toBe(0);
  });

  it('refuses an owner key and an account id that name different accounts', async () => {
    const h = harness();
    expect(() => h.store.retain('account:1', ACCOUNT_ID)).toThrow(/different accounts/);
    // The matching pair is admitted, so the guard is not a stopped door.
    expect(() => h.store.retain(OWNER_KEY, ACCOUNT_ID)).not.toThrow();
  });

  it('installs nothing from an answer that names a different account', () => {
    const ctx = fakeCtx();
    installLoadedFreehold(ctx, ACCOUNT_ID, {
      accountId: OTHER_ACCOUNT_ID,
      plotIndex: 0,
      plotId: ROW_PLOT_ID,
      durableRev: '7',
      state: persistedFixture(),
      hearthReadyAtMs: 5_000,
      hearthRevision: '3',
      hold: null,
    });
    expect(ctx.freeholds.size).toBe(0);
    expect(ctx.freeholdKeyReadyAtMs.size).toBe(0);
    // The same answer under its OWN account installs, so the guard is decisive.
    installLoadedFreehold(ctx, OTHER_ACCOUNT_ID, {
      accountId: OTHER_ACCOUNT_ID,
      plotIndex: 0,
      plotId: ROW_PLOT_ID,
      durableRev: '7',
      state: persistedFixture(),
      hearthReadyAtMs: 5_000,
      hearthRevision: '3',
      hold: null,
    });
    expect(ctx.freeholds.size).toBe(1);
  });

  it('resets the orphan grace on every preload arm that touches an existing entry', async () => {
    // The grace exists because preload resolves before the join calls retain, so
    // an entry sits at zero references for the width of a handshake. It counted
    // from the last RETAIN, not the last touch, so a handshake wider than one
    // sweep interval lost its entry anyway and the session was write-blocked.
    const h = harness({ rowLoad: { kind: 'row', row: rowFixture() } });
    await h.store.preload(ACCOUNT_ID);
    expect(h.store.stats().entries).toBe(1);
    // One sweep marks it.
    h.store.saveAllDirty();
    expect(h.store.stats().entries).toBe(1);
    // A second preload, which is what a slow or retried handshake does, touches
    // the entry again and the mark restarts.
    await h.store.preload(ACCOUNT_ID);
    h.store.saveAllDirty();
    expect(h.store.stats().entries).toBe(1);
    // Without a touch, two consecutive sweeps collect it.
    h.store.saveAllDirty();
    expect(h.store.stats().entries).toBe(0);
  });

  it('releases a retained capture on the ordinary flush, so the gauge reads zero', async () => {
    // WHAT THIS ACTUALLY PROVES, said plainly. It drives one ordinary flush, and
    // `settle`'s own `!owesWork` release runs first, so `maybeRemove` finds the
    // document already null and the delete-site call added beside it is a no-op
    // here. That release predates this round in inline form, so this case pins
    // pre-existing behaviour: the gauge returns to zero on the ordinary path.
    //
    // The delete-site calls are DEFENSIVE and no test reaches them; the argument
    // that nothing can is in releaseCapture's own docblock. An earlier version
    // of this comment claimed neither removal path cleared the document, which
    // read as a repair for a defect that was never reachable.
    const h = await loadedStore({ rowLoad: { kind: 'row', row: rowFixture() } });
    h.store.markDirty(OWNER_KEY);
    await h.store.flushAndRelease(OWNER_KEY);
    await tick(30);
    // The write landed and settle released it, which is the ordinary path.
    expect(h.store.stats().leaveCaptures).toBe(0);
    expect(h.store.stats().entries).toBe(0);
  });
});
