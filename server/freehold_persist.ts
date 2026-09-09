// The bounded lifecycle between an account's LIVE freehold record and its
// DURABLE row: single-flight loading, one-running-plus-one-pending write
// coalescing, reference-counted eviction, a bounded shutdown drain, and the
// counters a scrape reads. It owns no SQL and mutates no sim state of its own:
// every side effect is an injected port (the row reader and writer in
// server/freehold_db.ts, the hearth clock in server/freehold_hearth_db.ts, the
// sim's serialize hook, the shared background gate, the per-key FIFO), so a
// Vitest drives the whole store with no database and no GameServer. The
// composition root reaches the live store through registerFreeholdPersistStore
// and freeholdPersistIdle (the server/unstuck_records.ts shape), never by
// reaching into the coordinator.
//
// TWO INVARIANTS A FUTURE READER MUST NOT BREAK.
//
// 1. A LOAD THAT DID NOT PRODUCE A TRUSTED ROW LEAVES THE ROW ALONE, FOR THE
//    LIFE OF THE ENTRY. An unsupported, malformed, oversize or unadmitted row,
//    a load the permit or the local cap refused, and an entry whose durable
//    read has not finished yet are all WRITE-BLOCKED: save() refuses,
//    saveAllDirty() skips, flushAndRelease() writes nothing, and the row on
//    disk stays byte for byte as it was. The owner's furnishings and trophies
//    are in that row and the sim seeds a free default record for anyone who
//    holds none, so a write from a blocked entry would overwrite real
//    possessions with an empty Inn Room, and nothing else in this realm holds
//    a second copy to recover them from. Fail closed, always.
//
// 2. THE KEY'S FIFO FIRST, THEN THE PERMIT, NEVER THE REVERSE (the two
//    deadlock rules in server/serial_writer.ts). A closure that holds a
//    background permit while it waits for its key's FIFO deadlocks at a gate
//    capacity of one: the write running ahead of it cannot finish without the
//    permit the waiter is sitting on. Both waits are bounded (the permit wait
//    by AbortSignal.timeout), and a refused permit is a REFUSAL, never a
//    fall-through to doing the work unadmitted.

import { FREEHOLD_TIER_IDS } from '../src/sim/content/freehold';
import {
  FREEHOLD_MAX_STORED_BYTES,
  type FreeholdLoadResult,
  freeholdStateFromPersisted,
  freeholdWriteRefusal,
  normalizeFreehold,
  type PersistedFreehold,
  persistedFreeholdFromState,
} from '../src/sim/freehold/persisted';
import { loadFreehold, serializeFreehold } from '../src/sim/freehold/state';
import { FREEHOLD_VISIT_POLICIES } from '../src/sim/freehold/types';
import type { SimContext } from '../src/sim/sim_context';
import { pool } from './db';
import {
  FREEHOLD_PRIMARY_PLOT_INDEX,
  type FreeholdRowLoad,
  type FreeholdUpsert,
  type FreeholdUpsertResult,
  freeholdForAccount,
  mintFreeholdPlotId,
  upsertFreehold,
} from './freehold_db';
import { type FreeholdHearthLoad, loadFreeholdHearth } from './freehold_hearth_db';
import { freeholdOwnerKeyForAccount } from './freehold_wire';
import { createKeyedSerialWriter } from './serial_writer';

/** How long the shutdown drain waits for running and pending writes before it
 *  gives up and answers false. Finite by contract: a drain that can block
 *  forever is a hung realm restart. */
export const FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS = 10_000;

/** The bound on a BACKGROUND WRITE's wait for a shared background permit.
 *  server/background_db_gate.ts keeps its waiter list UNCAPPED, so a caller
 *  that queues without a bounded signal is the thing that grows without limit
 *  under a stalled pool. The login path has its own, shorter bound below. */
export const FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS = 15_000;

/**
 * The LOGIN-path bound, deliberately shorter than the write one, because the
 * handshake awaits this read: every other bound on that path is shorter too
 * (DB_POOL_CONNECT_TIMEOUT_MS is 5,000), and a joining player must not sit
 * fifteen seconds waiting for a permit to read two small rows. The local
 * admission cap already makes an early answer safe: it is a HOLD, not a
 * failure, so the account joins on its live record and simply does not write.
 * The two are separate constants on purpose; merging them puts a background
 * write's budget on a player's login.
 */
export const FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS = 5_000;

/** Local concurrency cap on durable loads, applied BEFORE the shared permit
 *  (the guild-bank lazy loader's admission cap). Past the cap a load is
 *  refused rather than queued: a local waiter list would be the unbounded
 *  queue the shared gate already warns about, and a refused load is safe
 *  because it is write-blocked, so the account simply gets no durable house
 *  this session and its row is untouched. */
export const FREEHOLD_PERSIST_MAX_ACTIVE_LOADS = 4;

/**
 * The local admission cap on CONCURRENT WRITES, the twin of the load cap above
 * and for a sharper reason: the keyed serial writer serializes per OWNER KEY,
 * so a thousand owners are a thousand independent FIFOs racing for one shared
 * background permit, and server/background_db_gate.ts keeps its waiter list
 * UNCAPPED. Bounding each WAIT does not bound the waiter COUNT. Measured, the
 * first sweep after a mass login queued 993 simultaneous waiters at gate
 * capacity 7, each with its own abort timer, and every other named producer
 * (storage-purchase recovery, escrow, character delete) queued behind them.
 *
 * Deferring a write is free in a way deferring a load is not: the entry stays
 * dirty and the next sweep picks it up, and the shutdown drain keeps pumping
 * the deferred set until it empties or the deadline fires. So the surplus waits
 * HERE, in a bounded set this store owns, rather than on a shared queue.
 */
export const FREEHOLD_PERSIST_MAX_ACTIVE_WRITES = 4;

/** The durable revision a recovery hold reports when there is no row to name
 *  one. Its own constant rather than the hearth clock's ABSENT_HEARTH_REVISION,
 *  which shares the value but names a different counter: this is the PLOT's
 *  compare-and-swap fence. Dev-channel only, but a field named for the wrong
 *  counter is how a later reader learns the wrong model. */
export const FREEHOLD_ABSENT_DURABLE_REV = '0';

/**
 * How long GameServer.leave waits for a leaving session's last durable write
 * before it stops blocking on it.
 *
 * Without a bound, leave inherits the background write's whole budget: the
 * permit wait plus a statement bounded by DB_STATEMENT_TIMEOUT_MS, and
 * FREEHOLD_PERSIST_FLUSH_MAX_PASSES re-arms can extend it further. Under gate
 * saturation, which is exactly the mass-disconnect case, every leaving session
 * would block for tens of seconds, GameServer.leave would back up, and
 * character leases would be released late, so reconnects wait out the lease.
 *
 * Giving up the WAIT is not giving up the WRITE: the write is already queued
 * and keeps running, the entry stays in the store until it settles, and the
 * shutdown drain still waits for it. All this bounds is how long a logout
 * blocks.
 */
export const FREEHOLD_PERSIST_LEAVE_FLUSH_MS = 2_000;

/**
 * The zero-reference entry sweep is MARK AND SWEEP over two passes, so an
 * entry lives at least one full AUTOSAVE_SECONDS period after its last
 * reference goes away rather than being collected the instant it has none.
 *
 * It exists because a reference is not guaranteed. The handshake reads the
 * durable row BEFORE it acquires the character lease, and five refusals sit
 * between the two (a lease already held, no such character, a forced rename, a
 * throwing character read, and the max-online-characters cap). Every one of
 * them returns without ever reaching retain(), so the entry that read created
 * had no other removal path and stayed for the life of the process, holding a
 * parsed record. A double login is routine, so the map grew toward one entry
 * per distinct account that ever hit one.
 *
 * The marked entry is also the STALE one on a multi-realm deployment: preload
 * replays a loaded entry rather than re-reading, so an abandoned entry would
 * serve an old house for every later login on this process.
 */
export const FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES = 2;

/** How many write passes one flushAndRelease will wait through. A committed
 *  write that finds fresh edits re-arms exactly once, so two passes is the
 *  normal ceiling; the bound is here so a pathological re-arm cannot hold a
 *  leaving session open. */
export const FREEHOLD_PERSIST_FLUSH_MAX_PASSES = 4;

/** The revision an absent hearth clock reports, matching ABSENT_FREEHOLD_HEARTH
 *  in server/freehold_hearth_db.ts. Duplicated as a literal on purpose: this
 *  module takes only TYPES from the hearth module, so a fake port bag in a
 *  Vitest needs no database module in its runtime graph. */
const ABSENT_HEARTH_REVISION = '0';

/** Why an account's durable row must not be written this session. `kind` is the
 *  classification the load produced; `detail` is dev-channel prose. */
export interface FreeholdRecoveryHold {
  readonly kind: 'unsupported' | 'malformed' | 'oversize' | 'unadmitted';
  readonly detail: string;
  readonly plotIndex: number;
  readonly durableRev: string;
}

/** One account's durable answer, as the join path consumes it. `state` null
 *  with `hold` null means NO durable row exists: the caller keeps the default
 *  record the sim seeds, and this store persists it under the freshly minted
 *  plot id. `hold` non-null means install nothing and write nothing. */
export interface LoadedFreehold {
  readonly accountId: number;
  readonly plotIndex: number;
  readonly plotId: string;
  /** Null when no durable row exists yet, so the first write is insert-only. */
  readonly durableRev: string | null;
  readonly state: PersistedFreehold | null;
  readonly hearthReadyAtMs: number;
  readonly hearthRevision: string;
  readonly hold: FreeholdRecoveryHold | null;
}

/** Every side effect the store has. Nothing here touches a pool, a Sim or a
 *  session directly, which is what lets one Vitest drive the whole lifecycle. */
export interface FreeholdPersistPorts {
  readRow(accountId: number, maxOwnedBytes: number): Promise<FreeholdRowLoad>;
  readHearth(accountId: number): Promise<FreeholdHearthLoad>;
  writeRow(input: FreeholdUpsert): Promise<FreeholdUpsertResult>;
  /** normalizeFreehold bound to the realm's live tier and visit-policy sets. */
  normalize(raw: unknown): FreeholdLoadResult;
  /** serializeFreehold plus persistedFreeholdFromState. Null means the owner
   *  holds no live record, and the write is skipped entirely. */
  serialize(ownerKey: string): PersistedFreehold | null;
  hasLive(ownerKey: string): boolean;
  /** The live record's own revision, or null when the owner holds none. A
   *  CHEAP read: the periodic sweep asks every loaded owner this question on
   *  every pass, so it must not clone anything. serialize() is the expensive
   *  answer and belongs inside the write, where its result is actually used. */
  liveRev(ownerKey: string): number | null;
  mintPlotId(): string;
  acquirePermit(signal: AbortSignal): Promise<{ release(): void } | null>;
  enqueue<T>(key: string, signal: AbortSignal, write: () => Promise<T>): Promise<T>;
  nowMs(): number;
  warn(message: string): void;
  error(message: string, err?: unknown): void;
  /** The ONE timer the store owns: the shutdown drain deadline. Injected so
   *  tests drive it without a wall clock; the module-edge default below is the
   *  only setTimeout in this file. */
  scheduleDeadline?(callback: () => void, ms: number): () => void;
}

/** Scrape-safe counters. COUNTS, BYTE TOTALS AND MILLISECOND TOTALS ONLY: no
 *  owner key, no account id, no plot id ever appears here, because these are
 *  read by an operator dashboard and a metrics endpoint that are not entitled
 *  to player identity. */
export interface FreeholdPersistStats {
  readonly entries: number;
  readonly dirty: number;
  readonly running: number;
  readonly pending: number;
  /** Entries held by a RECOVERY hold: a row this build could not interpret. */
  readonly held: number;
  /** Entries quiesced by a durable answer no repeat can fix, which is the one
   *  condition the compare-and-swap fence exists to detect. Kept apart from
   *  `held` because a rising quiesce count means a second writer is touching
   *  these rows, and merging the two hides exactly that. */
  readonly quiesced: number;
  readonly loads: number;
  readonly loadFailures: number;
  /** The same total, split by the hold kind that caused it. */
  readonly loadFailuresByKind: Readonly<Record<string, number>>;
  readonly writes: number;
  readonly writeFailures: number;
  readonly staleWrites: number;
  readonly permitWaitMsTotal: number;
  readonly queueWaitMsTotal: number;
  readonly writeMsTotal: number;
  readonly loadMsTotal: number;
  readonly oldestDirtyAgeMs: number;
  readonly writeBytesTotal: number;
  readonly maxWriteBytes: number;
}

export interface FreeholdPersistStore {
  /** Bounded, single-flight per account. Never rejects: an admission refusal
   *  or a throwing port answers with a hold. */
  preload(accountId: number): Promise<LoadedFreehold>;
  markDirty(ownerKey: string): void;
  /** Fire and forget, coalesced to one running plus one pending write. */
  save(ownerKey: string): void;
  /** Enqueue every dirty owner; never awaits a write. */
  saveAllDirty(): void;
  /** The leave path: flush, then drop one reference. */
  flushAndRelease(ownerKey: string): Promise<void>;
  retain(ownerKey: string): void;
  /** Close intake, flush what is already dirty, and drain to a finite
   *  deadline. True when drained, false at the deadline. Never throws. */
  idle(deadlineMs: number): Promise<boolean>;
  stats(): FreeholdPersistStats;
  /** Cancel the store's own timer. Does NOT close intake. */
  stop(): void;
}

// Bound at the module edge, the server/unstuck_records.ts REAL_DEPS shape, so
// the store body itself never names a wall clock or a timer.
const realScheduleDeadline = (callback: () => void, ms: number): (() => void) => {
  const timer = setTimeout(callback, ms);
  return () => clearTimeout(timer);
};

interface FreeholdPersistEntry {
  readonly ownerKey: string;
  /** 0 until a load fills it in. An entry created by retain() carries the
   *  placeholder, and is write-blocked (`loaded` false) until its load lands,
   *  so the placeholder can never reach a row. */
  accountId: number;
  plotIndex: number;
  plotId: string;
  durableRev: string | null;
  /** The last state known to match the durable row, so a rejoin after the sim
   *  evicted the live record re-installs the real house instead of letting the
   *  join seed a default over it. */
  state: PersistedFreehold | null;
  loaded: boolean;
  hold: FreeholdRecoveryHold | null;
  /** A durable answer no repeat of the same payload can fix (stale, missing,
   *  conflict). The declared FreeholdRecoveryHold union has no member for it,
   *  so it is its own flag with the same write-blocking force. */
  quiesced: boolean;
  quiesceWarned: boolean;
  refs: number;
  dirtyGeneration: number;
  committedGeneration: number;
  /** The generation the RUNNING write sampled its document at, so a second
   *  write is armed only for edits that write cannot already be carrying.
   *  Infinity while a write is queued but has not sampled yet: the sample
   *  happens after the permit wait, so everything before it is covered. */
  snapshotGeneration: number;
  /** The live revision the RUNNING write is carrying, or null before it has
   *  sampled. The sweep's dirty detector compares the live record against the
   *  last COMMITTED state, which stays behind for as long as a write is in
   *  flight, so without this a second sweep re-detects the very edit the
   *  running write is already carrying. */
  snapshotRev: number | null;
  dirtySinceMs: number;
  /** True once a sweep pass has seen this entry with no session references.
   *  The next pass collects it; anything that gives it work clears the mark. */
  orphanMarked: boolean;
  running: boolean;
  pending: boolean;
  chain: Promise<void> | null;
}

export function createFreeholdPersistStore(ports: FreeholdPersistPorts): FreeholdPersistStore {
  const entries = new Map<string, FreeholdPersistEntry>();
  const inFlightLoads = new Map<number, Promise<LoadedFreehold>>();
  /** Owners that wanted a write while the local write cap was full. They stay
   *  DIRTY, so nothing is lost: they are launched as slots free, and by the
   *  next sweep if the process is still up. Insertion-ordered, so the owner
   *  that waited longest goes first. */
  const deferredWrites = new Set<FreeholdPersistEntry>();
  let activeWrites = 0;
  const scheduleDeadline = ports.scheduleDeadline ?? realScheduleDeadline;
  let activeLoads = 0;
  let intake = true;
  // Every outstanding idle() call. A set rather than one slot so a second
  // drain (a supervised restart racing a test teardown) can never orphan the
  // first one's deadline timer.
  const drainWaiters = new Set<{ finish(drained: boolean): void }>();
  const counters = {
    loads: 0,
    loadFailures: 0,
    loadFailuresByKind: {} as Record<string, number>,
    writes: 0,
    writeFailures: 0,
    staleWrites: 0,
    permitWaitMsTotal: 0,
    queueWaitMsTotal: 0,
    // The two durations the wait totals deliberately exclude: a durable write
    // that has become slow is pinning a gate permit AND a pool client, and
    // without these it is visible only indirectly, as OTHER work's waits rising.
    writeMsTotal: 0,
    loadMsTotal: 0,
    // A TOTAL plus a high-water mark rather than a last-sample gauge: at a
    // thousand owners a scrape samples one arbitrary write, which says nothing
    // about the size distribution or about growth toward the byte ceiling.
    writeBytesTotal: 0,
    maxWriteBytes: 0,
  };

  const isDirty = (entry: FreeholdPersistEntry): boolean =>
    entry.dirtyGeneration > entry.committedGeneration;

  /**
   * The periodic sweep's own dirty detector, so a record that moved without a
   * markDirty call still reaches the row. The live record carries its own
   * revision and every sanctioned writer bumps it (setFreeholdTier is the one
   * that exists today, and the development grant reaches the record through
   * it), so a live revision that has left the last written one behind IS the
   * edit. Callers that want promptness still call markDirty; this closes the
   * gap for a writer that has no server-side hook.
   *
   * It reads ONE INTEGER per loaded owner, never a clone. That is not a
   * micro-optimization: this runs synchronously inside the 20 Hz loop body
   * (runPeriodicSaveFlush is documented as having to return synchronously), so
   * cloning every loaded record here would put O(owners x layout rows) of
   * copying and garbage on one tick every thirty seconds. Measured at the
   * approved 420-row ceiling, the clone shape cost tens of milliseconds per
   * sweep at five thousand owners against a fifty millisecond tick budget.
   * serialize() stays inside runWrite, where the result is the thing written.
   *
   * A blocked entry is never probed: it must not write, so knowing it moved
   * buys nothing. A revision that went BACKWARDS is treated as movement too:
   * that is a reload of an older record into a live slot, and the row should
   * follow the record this realm is actually serving.
   */
  const noteRevisionMoved = (entry: FreeholdPersistEntry): boolean => {
    if (blocked(entry)) return false;
    const liveRev = ports.liveRev(entry.ownerKey);
    if (liveRev === null) return false;
    if (entry.state !== null && liveRev === entry.state.rev) return false;
    // entry.state only advances at COMMIT, so while a write is in flight it
    // still names the pre-edit revision and every sweep would re-detect the
    // same edit. Compare against what the running write is actually carrying.
    if (entry.running && entry.snapshotRev !== null && liveRev === entry.snapshotRev) return false;
    entry.dirtyGeneration++;
    if (entry.dirtySinceMs === 0) entry.dirtySinceMs = ports.nowMs();
    return true;
  };

  const isHeld = (entry: FreeholdPersistEntry): boolean => entry.hold !== null || entry.quiesced;

  // Invariant 1 in one predicate: an entry that is held, quiesced, or has not
  // finished a durable read may not write.
  const blocked = (entry: FreeholdPersistEntry): boolean => !entry.loaded || isHeld(entry);

  const live = (entry: FreeholdPersistEntry): boolean => entries.get(entry.ownerKey) === entry;

  function ensureEntry(ownerKey: string, accountId: number): FreeholdPersistEntry {
    const existing = entries.get(ownerKey);
    if (existing) {
      if (accountId > 0) existing.accountId = accountId;
      return existing;
    }
    const created: FreeholdPersistEntry = {
      ownerKey,
      accountId,
      plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
      plotId: '',
      durableRev: null,
      state: null,
      loaded: false,
      hold: null,
      quiesced: false,
      quiesceWarned: false,
      refs: 0,
      dirtyGeneration: 0,
      committedGeneration: 0,
      snapshotGeneration: Number.POSITIVE_INFINITY,
      snapshotRev: null,
      dirtySinceMs: 0,
      orphanMarked: false,
      running: false,
      pending: false,
      chain: null,
    };
    entries.set(ownerKey, created);
    return created;
  }

  // Removal needs all three at once: no live reference, nothing running, and
  // nothing pending. Any one of them alone keeps the entry, which is what lets
  // a visitor hold an offline owner's plot loaded.
  function maybeRemove(entry: FreeholdPersistEntry): void {
    if (entry.refs > 0 || entry.running || entry.pending || deferredWrites.has(entry)) return;
    if (live(entry)) entries.delete(entry.ownerKey);
  }

  /**
   * Collect entries no session refers to any more. MARK AND SWEEP rather than
   * immediate removal: preload resolves before the join calls retain(), so an
   * entry legitimately sits at zero references for the width of a handshake,
   * and removing it there would hand the joining session a fresh unloaded entry
   * that can never write. One pass marks, the next collects.
   *
   * Nothing dirty, running, pending or mid-load is ever collected: those are
   * the states in which the entry still owes a durable write or is about to be
   * filled in. A collected entry loses only cached knowledge, and the next
   * login reads the row again.
   */
  function sweepOrphans(): void {
    for (const entry of [...entries.values()]) {
      if (entry.refs > 0 || entry.running || entry.pending || isDirty(entry)) {
        entry.orphanMarked = false;
        continue;
      }
      // A load still in flight will call ensureEntry again when it lands.
      if (entry.accountId > 0 && inFlightLoads.has(entry.accountId)) {
        entry.orphanMarked = false;
        continue;
      }
      if (!entry.orphanMarked) {
        entry.orphanMarked = true;
        continue;
      }
      if (live(entry)) entries.delete(entry.ownerKey);
    }
  }

  function snapshotOf(
    entry: FreeholdPersistEntry,
    state: PersistedFreehold | null,
  ): LoadedFreehold {
    return {
      accountId: entry.accountId,
      plotIndex: entry.plotIndex,
      plotId: entry.plotId,
      durableRev: entry.durableRev,
      state,
      hearthReadyAtMs: 0,
      hearthRevision: ABSENT_HEARTH_REVISION,
      hold: entry.hold,
    };
  }

  function holdResult(
    entry: FreeholdPersistEntry,
    hold: FreeholdRecoveryHold,
    hearth: { readyAtMs: number; revision: string },
  ): LoadedFreehold {
    entry.loaded = true;
    entry.hold = hold;
    entry.plotIndex = hold.plotIndex;
    counters.loadFailures++;
    // Per KIND, because the four causes demand four different operator
    // responses: unreadable rows are a data incident, a full admission cap is
    // a login-storm capacity signal, a missing permit is pool saturation, and
    // a thrown read is a database fault. One conflated number names none of
    // them.
    counters.loadFailuresByKind[hold.kind] = (counters.loadFailuresByKind[hold.kind] ?? 0) + 1;
    ports.warn(
      `freehold plot index ${hold.plotIndex} held (${hold.kind}): ${hold.detail}; the durable row is left untouched`,
    );
    return {
      accountId: entry.accountId,
      plotIndex: hold.plotIndex,
      plotId: entry.plotId,
      durableRev: null,
      state: null,
      hearthReadyAtMs: hearth.readyAtMs,
      hearthRevision: hearth.revision,
      hold,
    };
  }

  async function readHearth(accountId: number): Promise<{ readyAtMs: number; revision: string }> {
    try {
      const load = await ports.readHearth(accountId);
      if (load.kind === 'state') {
        const readyAtMs = Number(load.state.readyAtMs);
        return {
          readyAtMs: Number.isFinite(readyAtMs) && readyAtMs > 0 ? readyAtMs : 0,
          revision: load.state.revision,
        };
      }
      if (load.kind === 'unsupported') {
        ports.warn(`freehold hearth clock unsupported (${load.detail}); the cooldown starts cold`);
      }
      return { readyAtMs: 0, revision: ABSENT_HEARTH_REVISION };
    } catch (err) {
      ports.error('freehold hearth clock read failed; the cooldown starts cold:', err);
      return { readyAtMs: 0, revision: ABSENT_HEARTH_REVISION };
    }
  }

  // The durable row is turned back into the document normalizeFreehold admits.
  // The row reader owns the column shapes; this is the one place the two meet.
  function rowDocument(row: {
    schemaVersion: number;
    plotId: string;
    tier: string;
    layout: unknown;
    trophies: unknown;
    condition: number;
    visitPolicy: string;
    wireRev: string;
  }): unknown {
    return {
      version: row.schemaVersion,
      plotId: row.plotId,
      tier: row.tier,
      layout: row.layout,
      trophies: row.trophies,
      condition: row.condition,
      visitPolicy: row.visitPolicy,
      rev: Number(row.wireRev),
    };
  }

  async function classify(accountId: number, ownerKey: string): Promise<LoadedFreehold> {
    // One permit covers both reads, so they run in sequence: two concurrent
    // queries would be two pool checkouts against one admission.
    // The STORED ceiling, not the canonical one: the SQL bound measures the
    // text PostgreSQL renders back out of jsonb, which is wider than the JSON
    // that went in. Handing it FREEHOLD_MAX_OWNED_BYTES would refuse the
    // maximal record this realm is allowed to write.
    const rowLoad = await ports.readRow(accountId, FREEHOLD_MAX_STORED_BYTES);
    const hearth = await readHearth(accountId);
    const entry = ensureEntry(ownerKey, accountId);

    if (rowLoad.kind === 'absent') {
      // No durable row: the sim's default record IS the truth, and this store
      // persists it under one freshly minted plot id. Never a second default,
      // never a second tier.
      entry.loaded = true;
      entry.hold = null;
      entry.plotIndex = FREEHOLD_PRIMARY_PLOT_INDEX;
      if (entry.plotId === '') entry.plotId = ports.mintPlotId();
      entry.durableRev = null;
      entry.state = null;
      return {
        accountId,
        plotIndex: entry.plotIndex,
        plotId: entry.plotId,
        durableRev: null,
        state: null,
        hearthReadyAtMs: hearth.readyAtMs,
        hearthRevision: hearth.revision,
        hold: null,
      };
    }

    if (rowLoad.kind === 'oversize') {
      return holdResult(
        entry,
        {
          kind: 'oversize',
          // Two different measures, named as such: past the on-disk pre-gate
          // the stored text was never rendered, so reporting a text length
          // there would be a number nothing took.
          detail: rowLoad.detoastRefused
            ? `${rowLoad.diskBytes} on-disk bytes past the pre-gate, so the ${rowLoad.limit} byte stored limit was never measured`
            : `${rowLoad.bytes} owned bytes over the ${rowLoad.limit} byte limit`,
          plotIndex: rowLoad.plotIndex,
          durableRev: rowLoad.durableRev,
        },
        hearth,
      );
    }

    if (rowLoad.kind === 'unadmitted') {
      return holdResult(
        entry,
        {
          kind: 'unadmitted',
          detail: rowLoad.detail,
          plotIndex: rowLoad.plotIndex,
          durableRev: rowLoad.durableRev,
        },
        hearth,
      );
    }

    const row = rowLoad.row;
    const normalized = ports.normalize(rowDocument(row));
    if (normalized.kind === 'loaded') {
      if (normalized.repaired.length > 0) {
        ports.warn(
          `freehold plot index ${row.plotIndex} repaired ${normalized.repaired.join(', ')} on load`,
        );
      }
      entry.loaded = true;
      entry.hold = null;
      entry.plotIndex = row.plotIndex;
      entry.plotId = row.plotId;
      entry.durableRev = row.durableRev;
      entry.state = normalized.state;
      return {
        accountId,
        plotIndex: row.plotIndex,
        plotId: row.plotId,
        durableRev: row.durableRev,
        state: normalized.state,
        hearthReadyAtMs: hearth.readyAtMs,
        hearthRevision: hearth.revision,
        hold: null,
      };
    }

    const detail =
      normalized.kind === 'unsupported'
        ? `${normalized.reason}: ${normalized.detail}`
        : normalized.kind === 'oversize'
          ? `${normalized.bytes} bytes over the ${normalized.limit} byte limit`
          : normalized.kind === 'malformed'
            ? normalized.detail
            : 'a durable row normalized to absent';
    const kind: FreeholdRecoveryHold['kind'] =
      normalized.kind === 'unsupported'
        ? 'unsupported'
        : normalized.kind === 'oversize'
          ? 'oversize'
          : 'malformed';
    return holdResult(
      entry,
      { kind, detail, plotIndex: row.plotIndex, durableRev: row.durableRev },
      hearth,
    );
  }

  function refuse(accountId: number, ownerKey: string, detail: string): LoadedFreehold {
    const entry = ensureEntry(ownerKey, accountId);
    return holdResult(
      entry,
      {
        kind: 'unadmitted',
        detail,
        plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
        durableRev: FREEHOLD_ABSENT_DURABLE_REV,
      },
      { readyAtMs: 0, revision: ABSENT_HEARTH_REVISION },
    );
  }

  async function loadOnce(accountId: number, ownerKey: string): Promise<LoadedFreehold> {
    counters.loads++;
    if (activeLoads >= FREEHOLD_PERSIST_MAX_ACTIVE_LOADS) {
      return refuse(accountId, ownerKey, 'the local load admission cap is full');
    }
    activeLoads++;
    try {
      const permitStartMs = ports.nowMs();
      const permit = await ports.acquirePermit(
        AbortSignal.timeout(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS),
      );
      counters.permitWaitMsTotal += Math.max(0, ports.nowMs() - permitStartMs);
      // A null permit is a refusal. Running the read anyway is exactly the
      // fall-through the shared gate exists to prevent.
      if (!permit) {
        return refuse(
          accountId,
          ownerKey,
          `no background permit within ${FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS} ms`,
        );
      }
      const loadStartMs = ports.nowMs();
      try {
        return await classify(accountId, ownerKey);
      } finally {
        counters.loadMsTotal += Math.max(0, ports.nowMs() - loadStartMs);
        permit.release();
      }
    } catch (err) {
      ports.error('freehold durable load failed; the account is held:', err);
      return refuse(accountId, ownerKey, 'the durable load threw');
    } finally {
      activeLoads--;
    }
  }

  function preload(accountId: number): Promise<LoadedFreehold> {
    const ownerKey = freeholdOwnerKeyForAccount(accountId);
    const entry = entries.get(ownerKey);
    // A second character of the same account is joining: the live record is
    // the truth and there is nothing to read. state null so the caller
    // installs nothing over it.
    if (ports.hasLive(ownerKey)) {
      const known = entry ?? ensureEntry(ownerKey, accountId);
      known.accountId = accountId;
      return Promise.resolve(snapshotOf(known, null));
    }
    // Load-once, like loadFreehold: a re-preload replays what the entry knows
    // (so a rejoin after the sim evicted the record re-installs the real
    // house) and never mints a second plot id or reads the row twice.
    if (entry?.loaded) {
      entry.accountId = accountId;
      return Promise.resolve(snapshotOf(entry, entry.hold === null ? entry.state : null));
    }
    const existing = inFlightLoads.get(accountId);
    if (existing) return existing;
    let tracked!: Promise<LoadedFreehold>;
    tracked = loadOnce(accountId, ownerKey).finally(() => {
      // Identity-guarded: only clear the slot while it still holds THIS
      // promise, so a load started after ours is never unregistered by ours.
      if (inFlightLoads.get(accountId) === tracked) inFlightLoads.delete(accountId);
    });
    inFlightLoads.set(accountId, tracked);
    return tracked;
  }

  function applyWriteResult(
    entry: FreeholdPersistEntry,
    result: FreeholdUpsertResult,
    generation: number,
    snapshotAtMs: number,
    written: PersistedFreehold,
  ): boolean {
    if (result.kind === 'inserted' || result.kind === 'updated') {
      counters.writes++;
      entry.durableRev = result.durableRev;
      entry.state = written;
      if (entry.committedGeneration < generation) entry.committedGeneration = generation;
      // Every edit that survived this write arrived at or after the snapshot,
      // so the snapshot instant is the exact lower bound on their age.
      entry.dirtySinceMs = isDirty(entry) ? snapshotAtMs : 0;
      return true;
    }
    if (result.kind === 'stale') {
      counters.staleWrites++;
      entry.quiesced = true;
      if (!entry.quiesceWarned) {
        entry.quiesceWarned = true;
        ports.warn(
          `freehold plot index ${entry.plotIndex} quiesced: the durable revision moved under this realm, so no further writes go out for this owner`,
        );
      }
      return false;
    }
    counters.writeFailures++;
    entry.quiesced = true;
    const detail = result.kind === 'missing' ? 'the row vanished' : result.detail;
    ports.error(
      `freehold plot index ${entry.plotIndex} write refused (${result.kind}): ${detail}; no further writes go out for this owner`,
    );
    return false;
  }

  async function runWrite(entry: FreeholdPersistEntry, enqueuedAtMs: number): Promise<boolean> {
    counters.queueWaitMsTotal += Math.max(0, ports.nowMs() - enqueuedAtMs);
    // Re-checked AFTER the queue wait: the entry may have been held or
    // evicted while this write sat in the FIFO.
    if (!live(entry) || blocked(entry)) return false;
    const permitStartMs = ports.nowMs();
    const permit = await ports.acquirePermit(
      AbortSignal.timeout(FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS),
    );
    counters.permitWaitMsTotal += Math.max(0, ports.nowMs() - permitStartMs);
    if (!permit) {
      counters.writeFailures++;
      ports.warn(
        `freehold plot index ${entry.plotIndex} write got no background permit within ${FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS} ms`,
      );
      return false;
    }
    try {
      // The generation and the snapshot are sampled together, inside the
      // closure and adjacent, so the committed generation describes exactly
      // the document that goes to the row.
      const snapshotAtMs = ports.nowMs();
      const generation = entry.dirtyGeneration;
      entry.snapshotGeneration = generation;
      const persisted = ports.serialize(entry.ownerKey);
      if (persisted !== null) entry.snapshotRev = persisted.rev;
      // The owner holds no live record any more. Writing here would put a
      // default over a real row, which is invariant 1.
      if (persisted === null) return false;
      // WRITABLE IMPLIES READABLE. A document past any load ceiling would mint
      // a row this realm can never read back, so it quiesces the owner instead:
      // the row on disk stays the last one that WAS readable, and a record this
      // size only grows, so retrying it every sweep would be a loop against the
      // pool rather than a recovery.
      const refusal = freeholdWriteRefusal(persisted);
      if (refusal !== null) {
        counters.writeFailures++;
        entry.quiesced = true;
        if (!entry.quiesceWarned) {
          entry.quiesceWarned = true;
          const measure =
            refusal.kind === 'oversize' ? `${refusal.bytes} bytes` : `${refusal.rows} rows`;
          ports.error(
            `freehold plot index ${entry.plotIndex} write refused (${refusal.kind}): ${measure} past the limit of ${refusal.limit}; no further writes go out for this owner`,
          );
        }
        return false;
      }
      const layoutJson = JSON.stringify(persisted.layout);
      const trophiesJson = JSON.stringify(persisted.trophies);
      const writeBytes = Buffer.byteLength(layoutJson) + Buffer.byteLength(trophiesJson);
      counters.writeBytesTotal += writeBytes;
      if (writeBytes > counters.maxWriteBytes) counters.maxWriteBytes = writeBytes;
      const writeStartMs = ports.nowMs();
      const result = await ports.writeRow({
        accountId: entry.accountId,
        plotIndex: entry.plotIndex,
        plotId: entry.plotId,
        tier: persisted.tier,
        layoutJson,
        trophiesJson,
        condition: persisted.condition,
        visitPolicy: persisted.visitPolicy,
        wireRev: persisted.rev,
        expectedDurableRev: entry.durableRev,
      });
      counters.writeMsTotal += Math.max(0, ports.nowMs() - writeStartMs);
      return applyWriteResult(entry, result, generation, snapshotAtMs, persisted);
    } finally {
      permit.release();
    }
  }

  function settle(entry: FreeholdPersistEntry, committed: boolean): void {
    entry.running = false;
    entry.chain = null;
    activeWrites--;
    // Clear ONLY what the write actually committed: an edit that landed while
    // the write was out is still dirty here, and re-arms exactly one more
    // write. A write that did NOT commit never re-arms itself, so a failing
    // row cannot become a retry loop against the pool.
    const rearm = entry.pending || (committed && isDirty(entry));
    entry.pending = false;
    if (rearm && live(entry) && !blocked(entry)) {
      // Straight back into the slot this write just freed, so a re-arm is
      // never pushed behind the deferred set it was already ahead of.
      launch(entry);
      return;
    }
    pumpDeferredWrites();
    maybeRemove(entry);
    drainCheck();
  }

  function launch(entry: FreeholdPersistEntry): void {
    deferredWrites.delete(entry);
    activeWrites++;
    entry.running = true;
    entry.pending = false;
    // Nothing sampled yet, and the sample happens AFTER the permit wait, so
    // every edit that exists between here and there is already covered.
    entry.snapshotGeneration = Number.POSITIVE_INFINITY;
    entry.snapshotRev = null;
    const enqueuedAtMs = ports.nowMs();
    // Never aborted: coalescing is the generation, not a cancelled queue
    // entry, and there is at most one queued write per key at a time.
    const controller = new AbortController();
    try {
      entry.chain = ports
        .enqueue(entry.ownerKey, controller.signal, () => runWrite(entry, enqueuedAtMs))
        .catch((err: unknown) => {
          counters.writeFailures++;
          ports.error(`freehold plot index ${entry.plotIndex} write failed:`, err);
          return false;
        })
        .then((committed) => {
          // settle must never reject: an unsettled chain would leave the entry
          // running forever, and a drain waiting on it would only ever answer
          // at its deadline.
          try {
            settle(entry, committed);
          } catch (err) {
            ports.error('freehold write settle failed:', err);
          }
        });
    } catch (err) {
      counters.writeFailures++;
      ports.error(`freehold plot index ${entry.plotIndex} write could not be queued:`, err);
      entry.running = false;
      entry.chain = null;
      activeWrites--;
      pumpDeferredWrites();
      maybeRemove(entry);
      drainCheck();
    }
  }

  /** Start as many deferred writes as the local cap now allows. Called every
   *  time a slot frees, so the set drains without a timer. */
  function pumpDeferredWrites(): void {
    while (activeWrites < FREEHOLD_PERSIST_MAX_ACTIVE_WRITES && deferredWrites.size > 0) {
      const next = deferredWrites.values().next().value;
      if (next === undefined) return;
      deferredWrites.delete(next);
      // The wait may have outlived the reason for the write: the entry could
      // have been evicted, held or quiesced since it was deferred.
      if (!live(next) || blocked(next) || next.running || !isDirty(next)) continue;
      launch(next);
    }
  }

  // Exactly one running plus one pending per owner key: a burst of a thousand
  // marks costs one write in flight and one behind it, never a thousand.
  function arm(entry: FreeholdPersistEntry): void {
    if (blocked(entry)) return;
    if (!entry.running && activeWrites >= FREEHOLD_PERSIST_MAX_ACTIVE_WRITES) {
      // The local cap, applied BEFORE the shared gate. The entry stays dirty,
      // so nothing is lost and nothing is retried against the pool: it waits
      // in a set this store can measure instead of on an uncapped queue every
      // other named background producer has to sit behind.
      deferredWrites.add(entry);
      return;
    }
    if (entry.running) {
      // ONLY for an edit the running write cannot be carrying. The running
      // write samples its document after the permit wait, so it already covers
      // everything that existed when it was armed; a bare `pending = true`
      // here re-sent that identical document, bumped a second durable
      // revision and touched updated_at for nothing. Shutdown made it routine:
      // saveFreeholds arms every dirty owner, then freeholdPersistIdle arms
      // every one of them again while the first writes are still on the gate,
      // doubling the durable work inside the drain deadline.
      if (entry.dirtyGeneration > entry.snapshotGeneration) entry.pending = true;
      return;
    }
    launch(entry);
  }

  function drainCheck(): void {
    if (drainWaiters.size === 0) return;
    // A deferred write is owed work exactly like a pending one.
    if (deferredWrites.size > 0) return;
    for (const entry of entries.values()) {
      if (entry.running || entry.pending) return;
    }
    for (const waiter of [...drainWaiters]) waiter.finish(true);
  }

  return {
    preload,

    markDirty(ownerKey: string): void {
      const entry = entries.get(ownerKey);
      // Nothing is loaded for this owner, so there is nothing to persist and
      // nothing this store is entitled to blind-write.
      if (!entry) return;
      entry.dirtyGeneration++;
      if (entry.dirtySinceMs === 0) entry.dirtySinceMs = ports.nowMs();
    },

    save(ownerKey: string): void {
      if (!intake) return;
      const entry = entries.get(ownerKey);
      if (!entry) return;
      arm(entry);
    },

    saveAllDirty(): void {
      if (!intake) return;
      for (const entry of entries.values()) {
        if (noteRevisionMoved(entry) || isDirty(entry)) arm(entry);
      }
      // Same pass, because this is the store's only periodic hook: an entry
      // whose session went away without a leave has no other removal path.
      sweepOrphans();
    },

    async flushAndRelease(ownerKey: string): Promise<void> {
      const entry = entries.get(ownerKey);
      if (!entry) return;
      // A held entry flushes NOTHING. The leave path still drops its
      // reference, so the entry can be evicted and re-read on a later join.
      if (!blocked(entry) && (isDirty(entry) || entry.running || entry.pending)) {
        // arm() directly rather than save(), so a closed intake (a shutdown
        // already under way) still lets a leaving session write out its last
        // edits. A clean entry is left alone: rewriting an unchanged document
        // on every logout would burn a durable revision per leave.
        arm(entry);
        // BOUNDED. Past the deadline this stops WAITING, never the write: the
        // write is queued and keeps running, the entry stays until it settles,
        // and the shutdown drain still waits for it. A logout that inherited
        // the background write's full budget would back up GameServer.leave
        // under gate saturation and release character leases late.
        let expired = false;
        let onExpiry!: () => void;
        const expiry = new Promise<void>((resolve) => {
          onExpiry = resolve;
        });
        const cancelDeadline = scheduleDeadline(() => {
          expired = true;
          onExpiry();
        }, FREEHOLD_PERSIST_LEAVE_FLUSH_MS);
        try {
          for (let pass = 0; pass < FREEHOLD_PERSIST_FLUSH_MAX_PASSES && !expired; pass++) {
            const chain = entry.chain;
            if (chain === null) break;
            await Promise.race([chain.catch(() => undefined), expiry]);
          }
        } finally {
          cancelDeadline();
        }
      }
      entry.refs = Math.max(0, entry.refs - 1);
      maybeRemove(entry);
    },

    // Synchronous by contract: the server fires a leave for the old character
    // and then adds the new one under the SAME owner key, so the new
    // session's retain must be able to land before the old session's
    // release completes.
    retain(ownerKey: string): void {
      const entry = ensureEntry(ownerKey, 0);
      entry.refs++;
      entry.orphanMarked = false;
    },

    idle(deadlineMs: number): Promise<boolean> {
      // Intake closes HERE rather than in stop(), so a GameServer.stop()
      // earlier in the shutdown sequence cannot refuse this drain's own
      // enqueues.
      intake = false;
      for (const entry of entries.values()) {
        if (isDirty(entry)) arm(entry);
      }
      const bounded = Math.max(1, Math.floor(deadlineMs));
      return new Promise<boolean>((resolve) => {
        let settled = false;
        let cancel: (() => void) | null = null;
        const waiter = {
          finish(drained: boolean): void {
            if (settled) return;
            settled = true;
            drainWaiters.delete(waiter);
            try {
              cancel?.();
            } catch {
              /* a timer that will not cancel must never fault a shutdown */
            }
            cancel = null;
            resolve(drained);
          },
        };
        drainWaiters.add(waiter);
        try {
          cancel = scheduleDeadline(() => waiter.finish(false), bounded);
        } catch (err) {
          ports.error('freehold drain deadline could not be scheduled:', err);
          waiter.finish(false);
          return;
        }
        drainCheck();
      });
    },

    stats(): FreeholdPersistStats {
      let dirty = 0;
      let running = 0;
      let pending = 0;
      let held = 0;
      let quiesced = 0;
      let oldestDirtyAtMs = 0;
      for (const entry of entries.values()) {
        if (isDirty(entry)) dirty++;
        if (entry.running) running++;
        if (entry.pending) pending++;
        if (entry.hold !== null) held++;
        if (entry.quiesced) quiesced++;
        if (
          entry.dirtySinceMs > 0 &&
          (oldestDirtyAtMs === 0 || entry.dirtySinceMs < oldestDirtyAtMs)
        ) {
          oldestDirtyAtMs = entry.dirtySinceMs;
        }
      }
      return {
        entries: entries.size,
        dirty,
        running,
        pending,
        held,
        quiesced,
        loads: counters.loads,
        loadFailures: counters.loadFailures,
        loadFailuresByKind: { ...counters.loadFailuresByKind },
        writes: counters.writes,
        writeFailures: counters.writeFailures,
        staleWrites: counters.staleWrites,
        permitWaitMsTotal: counters.permitWaitMsTotal,
        queueWaitMsTotal: counters.queueWaitMsTotal,
        writeMsTotal: counters.writeMsTotal,
        loadMsTotal: counters.loadMsTotal,
        oldestDirtyAgeMs: oldestDirtyAtMs === 0 ? 0 : Math.max(0, ports.nowMs() - oldestDirtyAtMs),
        writeBytesTotal: counters.writeBytesTotal,
        maxWriteBytes: counters.maxWriteBytes,
      };
    },

    // Timers only. Intake is NOT flipped here: an outstanding drain is
    // settled as not-drained rather than left hanging on a cancelled timer.
    stop(): void {
      for (const waiter of [...drainWaiters]) waiter.finish(false);
    },
  };
}

let registered: FreeholdPersistStore | null = null;

/** The composition root's handle on the live store, so shutdown can drain
 *  without reaching into GameServer (the server/unstuck_records.ts shape).
 *  Passing null unregisters, which is what a test teardown does. */
export function registerFreeholdPersistStore(store: FreeholdPersistStore | null): void {
  registered = store;
}

/** The composition root's fresh-join read (server/ws_auth.ts, beside the bank
 *  bonus). Never rejects: with no store registered it answers a HOLD, so the
 *  join installs nothing and writes nothing rather than seeding a default over
 *  a row it could not read. */
export async function freeholdPreloadForAccount(accountId: number): Promise<LoadedFreehold> {
  const store = registered;
  if (store) return await store.preload(accountId);
  return freeholdPreloadUnavailable(accountId, 'no persistence store is registered on this host');
}

/**
 * The answer for a join that must not touch durable housing at all: a dark
 * realm, or a host with no store. It is a HOLD rather than an absence, so
 * installLoadedFreehold installs nothing and every later write for that account
 * is blocked. Answering absence here would be the dangerous shape: the sim
 * seeds a free default record for anyone who holds none, and an absence would
 * invite the store to mint an identity and persist that empty Inn Room over a
 * row this host never read.
 */
export function freeholdPreloadUnavailable(accountId: number, detail: string): LoadedFreehold {
  return {
    accountId,
    plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
    plotId: '',
    durableRev: null,
    state: null,
    hearthReadyAtMs: 0,
    hearthRevision: '0',
    hold: {
      kind: 'unadmitted',
      detail,
      plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
      durableRev: '0',
    },
  };
}

/** The scrape-safe counters, for the game-state metrics source. Zeroes when no
 *  store is registered, which is the honest reading of "nothing is loaded". */
export function freeholdPersistStats(): FreeholdPersistStats {
  return (
    registered?.stats() ?? {
      entries: 0,
      dirty: 0,
      running: 0,
      pending: 0,
      held: 0,
      quiesced: 0,
      loads: 0,
      loadFailures: 0,
      loadFailuresByKind: {},
      writes: 0,
      writeFailures: 0,
      staleWrites: 0,
      permitWaitMsTotal: 0,
      queueWaitMsTotal: 0,
      writeMsTotal: 0,
      loadMsTotal: 0,
      oldestDirtyAgeMs: 0,
      writeBytesTotal: 0,
      maxWriteBytes: 0,
    }
  );
}

/** Drain the registered store, if there is one. Never throws and never hangs:
 *  no store is a drained store. */
export async function freeholdPersistIdle(
  deadlineMs: number = FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS,
): Promise<boolean> {
  const store = registered;
  if (!store) return true;
  try {
    return await store.idle(deadlineMs);
  } catch {
    return false;
  }
}

/**
 * Install one account's durable answer into the sim. PURE and SYNCHRONOUS, and
 * it MUST run BEFORE the sim seeds its default record for this account:
 * loadFreehold is load-once, so a call made after the seed is silently
 * discarded and the owner's real plot never reaches the live map. Nothing
 * happens for an absent load (there is no durable row, so the seeded default
 * IS the record) or a held one (invariant 1: install nothing, write nothing).
 */
export function installLoadedFreehold(
  ctx: SimContext,
  accountId: number,
  loaded: LoadedFreehold | undefined,
): void {
  if (!loaded || loaded.hold !== null || loaded.state === null) return;
  const ownerKey = freeholdOwnerKeyForAccount(accountId);
  loadFreehold(ctx, ownerKey, freeholdStateFromPersisted(loaded.state, ownerKey));
  const readyAtMs = loaded.hearthReadyAtMs;
  if (!Number.isFinite(readyAtMs) || readyAtMs <= 0) return;
  const liveReadyAtMs = ctx.freeholdKeyReadyAtMs.get(ownerKey) ?? 0;
  // Only ever forward: a durable clock behind the live one is a stale read,
  // and moving the cooldown backwards would hand out a free travel.
  if (readyAtMs > liveReadyAtMs) ctx.freeholdKeyReadyAtMs.set(ownerKey, readyAtMs);
}

/**
 * The realm's store, composed. This factory exists so the coordinator's
 * constructor stays two lines: every port below is a closure over the live sim,
 * the shared background gate and the pool, and none of it belongs in a file at
 * its line ceiling. The store itself never sees any of these.
 *
 * The gate is optional exactly as it is for the guild bank lazy loader: a host
 * without one runs unadmitted rather than reaching for a global, and the bound
 * on the permit wait lives in the store.
 */
export function createGameFreeholdPersistStore(deps: {
  readonly sim: { readonly ctx: SimContext };
  readonly backgroundDbGate?: {
    acquire(signal?: AbortSignal): Promise<{ release(): void } | null>;
  };
}): FreeholdPersistStore {
  const writer = createKeyedSerialWriter<string>();
  const gate = deps.backgroundDbGate;
  return createFreeholdPersistStore({
    readRow: (accountId, maxOwnedBytes) => freeholdForAccount(pool, accountId, maxOwnedBytes),
    readHearth: (accountId) => loadFreeholdHearth(pool, accountId),
    writeRow: (input) => upsertFreehold(pool, input),
    normalize: (raw) =>
      normalizeFreehold(raw, {
        validTierIds: FREEHOLD_TIER_IDS,
        validVisitPolicies: FREEHOLD_VISIT_POLICIES,
      }),
    serialize: (ownerKey) => {
      const state = serializeFreehold(deps.sim.ctx, ownerKey);
      return state === null ? null : persistedFreeholdFromState(state);
    },
    hasLive: (ownerKey) => deps.sim.ctx.freeholds.has(ownerKey),
    liveRev: (ownerKey) => deps.sim.ctx.freeholds.get(ownerKey)?.rev ?? null,
    mintPlotId: () => mintFreeholdPlotId(),
    // No gate means no admission control on this host, not an unbounded wait.
    acquirePermit: gate
      ? (signal) => gate.acquire(signal)
      : () => Promise.resolve({ release: () => {} }),
    enqueue: (key, signal, write) => writer.enqueueCancellable(key, signal, write),
    nowMs: Date.now,
    warn: (message) => console.warn(message),
    error: (message, err) => console.error(message, ...(err === undefined ? [] : [err])),
  });
}
