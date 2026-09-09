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
import { mergeFreeholdKeyReadyAt } from '../src/sim/freehold/hearth_key';
import { freeholdLoadDiagnostic } from '../src/sim/freehold/load_report';
import {
  FREEHOLD_MAX_STORED_BYTES,
  type FreeholdLoadResult,
  type FreeholdWriteRefusalOptions,
  freeholdStateFromPersisted,
  freeholdWriteRefusal,
  normalizeFreehold,
  type PersistedFreehold,
  persistedFreeholdFromState,
} from '../src/sim/freehold/persisted';
import { loadFreehold, serializeFreehold, stampFreeholdPlotId } from '../src/sim/freehold/state';
import { asFreeholdPlotId, FREEHOLD_VISIT_POLICIES } from '../src/sim/freehold/types';
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

/**
 * The cap the SHUTDOWN DRAIN runs at, and the reserve a LEAVING session may
 * borrow. Both exist because the steady-state cap is calibrated against a realm
 * that is also serving logins, escrow, storage recovery and character deletes
 * on the same background gate, and neither of these moments is that.
 *
 * The drain is the one moment nothing else contends for the gate, and the two
 * constants have to be read as a PAIR: at four concurrent writes and a ten
 * millisecond statement, FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS covers about four
 * thousand owners. Measured, a thousand dirty owners drained in 2.9 seconds and
 * five thousand did not finish, leaving 1,584 owners' edits unwritten. Raising
 * the cap for the drain alone is what makes the deadline cover the realm rather
 * than a quarter of it; the shared gate's own capacity of seven still bounds
 * what actually reaches the database.
 *
 * The leave reserve is smaller and for a different reason: a leaving session's
 * write is the LAST chance for that owner's edits, and without a reserve it
 * queues behind an insertion-ordered backlog of background writes that have a
 * next sweep to catch them. Two slots keep a mass disconnect from starving the
 * one write that cannot be retried.
 */
export const FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES = 8;
export const FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE = 2;

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

/** Consecutive THROWN writes for one owner before the store stops trying. A
 *  stale or refused write already quiesces on the first answer, because those
 *  are answers no repeat can change; a thrown one might be a connection blip,
 *  so it gets a second and a third chance before the same treatment. Without a
 *  bound, a row this realm genuinely cannot write is retried on every sweep for
 *  the life of the process. */
export const FREEHOLD_PERSIST_MAX_WRITE_ERRORS = 3;

/** How close together those thrown writes have to be to count as one RUN. A
 *  connection blip an hour after the last one is a new event, not a third
 *  strike: without a window, three unrelated blips across a long session
 *  quiesce a healthy owner, and a quiesced entry stops installing its own house
 *  on the next join, so the player meets an empty room and every edit they make
 *  there is discarded. Five minutes is far longer than any transient the pool
 *  recovers from and far shorter than a session. */
export const FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS = 300_000;

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
// KNOWN LIMIT, named rather than left to be discovered: this is a TIME bound,
// not a size one, so peak `entries` is the join rate times the grace period and
// not a cap. Each entry holds one parsed record, and a dirty leaver briefly
// holds two. `entries` and `leave_captures` are both published, so the growth
// is watchable; if a realm ever needs a hard cap, the seam that fits is the
// keyed bounded cache with LRU eviction in server/discord_status_cache.ts.

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
  /** THE SAME two sets that `normalize` is bound to, exposed so the save path
   *  can refuse exactly what the load path would. Two sets that could drift
   *  apart would put the writable-implies-readable property back on trust. */
  identitySets(): FreeholdWriteRefusalOptions;
  /** serializeFreehold plus persistedFreeholdFromState. Null means the owner
   *  holds no live record, and the write is skipped entirely. */
  serialize(ownerKey: string): PersistedFreehold | null;
  hasLive(ownerKey: string): boolean;
  /** Teach the live record the durable identity its row carries, once the
   *  durable side knows it. Answers false when there is nothing to teach. */
  stampPlotId(ownerKey: string, plotId: string): boolean;
  /** Whether this realm serves housing at all. The store never reads the
   *  environment itself; the composition root binds this to the sim's own
   *  flag. A DARK realm must issue no durable read of any kind, which is why
   *  the only read this store starts on its own consults it. */
  enabled(): boolean;
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
  /** EVERY entry the store holds, including the reference-only placeholders a
   *  join creates before any read. On a dark realm that is one per online
   *  account and nothing else, so this measure alone must never be read as
   *  "records this realm is persisting": `loaded` is that number. */
  readonly entries: number;
  /** Entries that have finished a durable read, and so the only ones that can
   *  write. Zero on a dark realm however many entries exist. */
  readonly loaded: number;
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
  /** Writes that reached the statement with no document to send: the terminal
   *  state of every lost-save path this store has had. */
  readonly writesWithoutRecord: number;
  /** Oversize refusals taken on the ON-DISK pre-gate, where no text length was
   *  measured, as opposed to the measured byte bound. */
  readonly preGateRefusals: number;
  /** Owners whose write is waiting on the store's own admission cap rather than
   *  on the shared gate. The cap's whole claim is that the surplus waits in a
   *  bounded set this store owns, and an unobservable set is an unfalsifiable
   *  claim. */
  readonly deferredWrites: number;
  readonly activeWrites: number;
  /** Documents captured at leave and not yet written: a second full record each
   *  on top of the entry's own, retained until the write lands. */
  readonly leaveCaptures: number;
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
  /** The account id lets the store re-read a row whose entry went away between
   *  the handshake's preload and this call. */
  retain(ownerKey: string, accountId?: number): void;
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
  /** The durable Hearth clock this entry read, remembered so the REPLAY arms of
   *  preload report the clock they learned rather than a cold one. A second
   *  character of the same account, or a rejoin after the sim evicted the live
   *  record, takes those arms and issues no read of its own. */
  hearthReadyAtMs: number;
  hearthRevision: string;
  /**
   * The document captured at LEAVE, used only when the live record is already
   * gone by the time the write runs. See flushAndRelease for why it has to be
   * taken before the wait.
   *
   * ITS COST IS A CHOSEN NUMBER, not a discovered one: this is a SECOND full
   * record on top of `state`, held until the write lands, so the worst case is
   * the number of simultaneous dirty leavers times the record ceiling.
   * Measured, a thousand simultaneous dirty logouts at the approved 420-row
   * ceiling retain about 66 MiB, and 0.1 MiB with empty layouts. That is the
   * price of not losing a leaving session's last edits, and `leave_captures`
   * publishes the count so it never has to be found in a heap dump.
   */
  leaveDocument: PersistedFreehold | null;
  /** Thrown writes since the last commit. A single throw is usually a blip
   *  worth one more sweep; a run of them is a row this realm cannot write, and
   *  retrying it every sweep forever is a loop against the pool. */
  writeErrors: number;
  /** When the last thrown write landed, so a run is a RUN and not a tally of
   *  unrelated blips hours apart. */
  lastWriteErrorMs: number;
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
  /** Consecutive sweep passes that have seen this entry with no session
   *  references and no work owed. It is collected on the
   *  FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES-th; anything that gives it work or a
   *  reference resets the count. */
  orphanPasses: number;
  running: boolean;
  pending: boolean;
  chain: Promise<void> | null;
  /** Resolvers waiting for this entry's next settle. A DEFERRED entry has no
   *  chain to await, and treating that as "nothing to wait for" made the leave
   *  flush return instantly under a mass disconnect, spending none of its
   *  budget and leaving the entry resident. */
  settleWaiters: Array<() => void>;
}

/**
 * The ONE diagnostic channel that would otherwise bypass the classification
 * bound. `ports.error(message, err)` prints whatever it is handed, and a
 * PostgreSQL error object is not a bounded value: a 23514 or 23502 puts
 * `Failing row contains (...)` in `detail`, and a 23505 puts the conflicting
 * key value there. On a write path that is an account id and row content in a
 * console, which is exactly what src/sim/freehold/load_report.ts exists to
 * prevent.
 *
 * Applied ONLY where a pg error can actually arrive: the row read, the hearth
 * read and the write. A throw out of this module's own code is a programming
 * bug whose stack is the useful part, and bounding it there would hide the line.
 *
 * `message` is kept because it is what makes a line readable, and it is NOT a
 * pure classification: a few SQLSTATEs embed a parameter in it. Every parameter
 * this module sends is JSON it generated itself, so nothing player-authored can
 * ride out that way today; it is the field to watch if that ever changes.
 */
function boundedDatabaseError(err: unknown): Record<string, unknown> {
  if (typeof err !== 'object' || err === null) return { message: String(err) };
  const source = err as { code?: unknown; constraint?: unknown; message?: unknown };
  return {
    code: typeof source.code === 'string' ? source.code : undefined,
    constraint: typeof source.constraint === 'string' ? source.constraint : undefined,
    message: typeof source.message === 'string' ? source.message : undefined,
  };
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
  /** Documents captured at leave and not yet written. Each is a SECOND full
   *  record on top of entry.state, so at the approved 420-row ceiling a
   *  thousand simultaneous dirty logouts retain about 67 MiB until their writes
   *  land. Bounded by the number of dirty leavers, and published, because a
   *  retention that only shows up in a heap dump is not a bound. */
  let leaveCaptures = 0;
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
    // The terminal state of every lost-save path: a write that reached the
    // statement with no document to send. It used to be silent, which is why
    // three separate versions of that bug had to be found by reading rather
    // than by watching.
    writesWithoutRecord: 0,
    // Which arm of the oversize refusal fired. The on-disk pre-gate and the
    // measured byte bound mean different things to an operator: one says the
    // row was too big to even look at, the other says it was measured and
    // refused.
    preGateRefusals: 0,
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
      hearthReadyAtMs: 0,
      hearthRevision: ABSENT_HEARTH_REVISION,
      leaveDocument: null,
      writeErrors: 0,
      lastWriteErrorMs: 0,
      refs: 0,
      dirtyGeneration: 0,
      committedGeneration: 0,
      snapshotGeneration: Number.POSITIVE_INFINITY,
      snapshotRev: null,
      dirtySinceMs: 0,
      orphanPasses: 0,
      running: false,
      pending: false,
      chain: null,
      settleWaiters: [],
    };
    entries.set(ownerKey, created);
    return created;
  }

  // Removal needs all three at once: no live reference, nothing running, and
  // nothing pending. Any one of them alone keeps the entry, which is what lets
  // a visitor hold an offline owner's plot loaded.
  /**
   * ONE predicate for "this entry still owes durable work", shared by BOTH
   * removal paths. They used to differ: maybeRemove checked the deferred set
   * but not dirtiness, and the orphan sweep checked dirtiness but not the
   * deferred set. Either omission drops a save. The concrete sequence for the
   * first one: a write is launched and waiting on a saturated gate, the player
   * logs out, the flush arms nothing new and times out, then the permit wait
   * expires and settle runs without re-arming, at which point maybeRemove would
   * delete a still-dirty entry and the edits are gone with only a warn.
   *
   * A BLOCKED entry owes nothing: it is held or quiesced and may not write, so
   * keeping it dirty forever would be a leak rather than a rescue.
   */
  const owesWork = (entry: FreeholdPersistEntry): boolean =>
    entry.running ||
    // A durable read in flight will call ensureEntry again when it lands, so
    // removing the entry now only resurrects it at zero references, which is
    // the same "entry went missing under a live session" class that retain's
    // reload exists to repair. It belongs in the SHARED predicate, or the
    // unification is only half true.
    (entry.accountId > 0 && inFlightLoads.has(entry.accountId)) ||
    entry.pending ||
    // Redundant TODAY, and kept deliberately: a deferred entry is always dirty
    // and unblocked, so the clause below already covers it, and no behaviour
    // test can isolate this one. The two conditions are equal only by the
    // current arming rules, and this is the clause that says what the deferred
    // set means rather than what today's arithmetic happens to imply.
    deferredWrites.has(entry) ||
    (isDirty(entry) && !blocked(entry));

  function maybeRemove(entry: FreeholdPersistEntry): void {
    if (entry.refs > 0 || owesWork(entry)) return;
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
    // Iterated DIRECTLY, not over a copy: deleting the current key during a Map
    // iteration is well defined, and the copy allocated an N-pointer array
    // inside the tick body (measured 42.6 KiB per sweep at five thousand
    // owners) for nothing.
    for (const entry of entries.values()) {
      if (entry.refs > 0 || owesWork(entry)) {
        entry.orphanPasses = 0;
        continue;
      }
      entry.orphanPasses++;
      // DRIVEN BY THE CONSTANT, so the documented grace period and the code
      // cannot drift: a constant the implementation never reads is a comment
      // wearing an export's clothes.
      if (entry.orphanPasses < FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES) continue;
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
      // The clock this entry LEARNED, never a hard-coded cold one. These are
      // the replay arms: they issue no read, so reporting 0 here would tell a
      // second character of the same account that the shared Hearth cooldown is
      // ready when the read that took it said otherwise.
      hearthReadyAtMs: entry.hearthReadyAtMs,
      hearthRevision: entry.hearthRevision,
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
      ports.error(
        'freehold hearth clock read failed; the cooldown starts cold:',
        boundedDatabaseError(err),
      );
      return { readyAtMs: 0, revision: ABSENT_HEARTH_REVISION };
    }
  }

  /** The wire revision arrives as EXACT bigint text, because a bigint that has
   *  already been through a JS number is a value nothing can trust. The
   *  persisted document holds a number, so the narrowing has to happen
   *  somewhere; it happens HERE, once, and its caller HOLDS the row rather than
   *  handing a broken value onward.
   *
   *  Holding is the point. normalizeFreehold REPAIRS an out-of-range `rev` to
   *  zero and still answers `loaded`, so a row whose wire_rev has outgrown a JS
   *  number would come back writable at revision zero and the next save would
   *  write that zero over the larger stored value: the client-facing counter
   *  would go backwards, permanently, on a row nothing was wrong with. */
  const representableRev = (text: string): boolean => Number.isSafeInteger(Number(text));

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
    // Remembered on the entry, not only returned: every later replay of this
    // entry has to answer with the same clock, and none of them reads again.
    entry.hearthReadyAtMs = hearth.readyAtMs;
    entry.hearthRevision = hearth.revision;

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
      if (rowLoad.detoastRefused) counters.preGateRefusals++;
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
    if (!representableRev(row.wireRev)) {
      // Held, never repaired. See representableRev.
      return holdResult(
        entry,
        {
          kind: 'malformed',
          detail: 'wire_rev_shape',
          plotIndex: row.plotIndex,
          durableRev: row.durableRev,
        },
        hearth,
      );
    }
    const normalized = ports.normalize(rowDocument(row));
    if (normalized.kind === 'loaded') {
      if (normalized.repaired.length > 0) {
        // Through the sim's own reporter, so the bound that decides what may
        // reach a log lives in ONE place. Hand-building the line here would
        // route around it.
        const repaired = freeholdLoadDiagnostic(normalized);
        ports.warn(
          `freehold plot index ${row.plotIndex} loaded with ${repaired?.detail ?? 'repairs'}`,
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

    // The DETAIL comes from the sim's reporter, never from this module. Its
    // whole job is a POSITIVE shape bound on what may reach a log, and a
    // hand-built string here would pass a corrupt row's own text straight
    // through it, which is the unbounded-bytes problem wearing a log costume.
    const diagnostic = freeholdLoadDiagnostic(normalized);
    const detail = diagnostic?.detail ?? 'a durable row normalized to absent';
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
      ports.error('freehold durable load failed; the account is held:', boundedDatabaseError(err));
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
      if (entry?.loaded) {
        entry.accountId = accountId;
        return Promise.resolve(snapshotOf(entry, null));
      }
      // The live record is still the truth and must not be overwritten by a
      // read, so the answer below carries no state either way. But WITHOUT the
      // read this entry never learns its plot id or its durable revision, and
      // an entry that never loaded is write-blocked for the whole session: the
      // owner would play, furnish, and have every edit discarded at logout with
      // nothing reported. So read, then answer with no state.
      return beginLoad(accountId, ownerKey).then((loaded) => ({ ...loaded, state: null }));
    }
    // Load-once, like loadFreehold: a re-preload replays what the entry knows
    // (so a rejoin after the sim evicted the record re-installs the real
    // house) and never mints a second plot id or reads the row twice.
    if (entry?.loaded) {
      entry.accountId = accountId;
      // blocked(), not `hold === null`. A QUIESCED entry has no hold and yet is
      // exactly the entry whose knowledge is known to be stale: the durable
      // revision moved under this realm, which is what the fence exists to
      // detect. Replaying its state would install a house another writer has
      // already replaced, as if it were current.
      return Promise.resolve(snapshotOf(entry, blocked(entry) ? null : entry.state));
    }
    return beginLoad(accountId, ownerKey);
  }

  /** The single-flight durable read. Two joins of one account collapse onto one
   *  load, and the slot is identity-guarded so a load started after ours is
   *  never unregistered by ours. */
  function beginLoad(accountId: number, ownerKey: string): Promise<LoadedFreehold> {
    const existing = inFlightLoads.get(accountId);
    if (existing) return existing;
    let tracked!: Promise<LoadedFreehold>;
    tracked = loadOnce(accountId, ownerKey).finally(() => {
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
      // `written` IS the document as sent, identity included, because runWrite
      // builds it that way. The entry therefore agrees with the row from the
      // first insert, and that agreement is the comparison standing between a
      // rejoin race and a wiped house.
      entry.state = written;
      // ...and the LIVE record learns it too, so the three agree from here on.
      ports.stampPlotId(entry.ownerKey, entry.plotId);
      entry.writeErrors = 0;
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
      const live = ports.serialize(entry.ownerKey);
      // THE NEWER DOCUMENT WINS, with the live record winning ties. The capture
      // stands in when the record is gone, which on the leave path is expected.
      // It also stands in when the live record is OLDER: a rejoin inside the
      // deferral window replays the entry's last COMMITTED state, which is the
      // pre-leave revision, so a strict live-always-wins rule silently rolled
      // the leaving session's edits back to it. Ties go to the live record, so
      // a capture can still never shadow an edit made after it.
      const captured = entry.leaveDocument;
      const persisted =
        live === null ? captured : captured !== null && captured.rev > live.rev ? captured : live;
      if (persisted !== null) entry.snapshotRev = persisted.rev;
      // No live record and nothing captured. Writing here would put a default
      // over a real row, which is invariant 1.
      if (persisted === null) {
        counters.writesWithoutRecord++;
        return false;
      }
      // IDENTITY, not just presence. A live record still carrying the unassigned
      // plot id has never been loaded from a row nor minted one: it is a fresh
      // seed by construction. Writing it over a row that HAS a durable revision
      // erases tier, layout, trophies, condition and visit policy, and because
      // the compare-and-swap deliberately never touches plot_id, the loss leaves
      // the identity intact and is invisible in the key.
      //
      // The window is real: a leave drops the store entry while the sim record
      // is still live, so a rejoin landing in between reads the row, learns a
      // durable revision, and is then handed a freshly seeded default when the
      // old session's removePlayer finally evicts. Refusing preserves the row,
      // at the cost of one session played on a default record with no writes.
      const seededOverReal =
        entry.durableRev !== null &&
        entry.state !== null &&
        persisted.plotId !== entry.state.plotId;
      if (seededOverReal) {
        counters.writeFailures++;
        entry.quiesced = true;
        if (!entry.quiesceWarned) {
          entry.quiesceWarned = true;
          ports.error(
            `freehold plot index ${entry.plotIndex} write refused (identity): the live record is not the record this entry loaded, so no further writes go out for this owner`,
          );
        }
        return false;
      }
      // WRITABLE IMPLIES READABLE. A document past any load ceiling would mint
      // a row this realm can never read back, so it quiesces the owner instead:
      // the row on disk stays the last one that WAS readable, and a record this
      // size only grows, so retrying it every sweep would be a loop against the
      // pool rather than a recovery.
      // The SAME identity sets the loader is bound to, so the two sides refuse
      // the same documents rather than nearly the same ones.
      // The document AS SENT, so the refusal validates the identity that lands
      // on disk rather than the one the live record happens to carry.
      const document: PersistedFreehold = { ...persisted, plotId: entry.plotId };
      const refusal = freeholdWriteRefusal(document, ports.identitySets());
      if (refusal !== null) {
        counters.writeFailures++;
        entry.quiesced = true;
        if (!entry.quiesceWarned) {
          entry.quiesceWarned = true;
          const measure =
            refusal.kind === 'oversize'
              ? `${refusal.bytes} bytes past the limit of ${refusal.limit}`
              : refusal.kind === 'layout_over_ceiling' || refusal.kind === 'trophies_over_ceiling'
                ? `${refusal.rows} rows past the limit of ${refusal.limit}`
                : refusal.detail;
          ports.error(
            `freehold plot index ${entry.plotIndex} write refused (${refusal.kind}): ${measure}; no further writes go out for this owner`,
          );
        }
        return false;
      }
      const layoutJson = JSON.stringify(document.layout);
      const trophiesJson = JSON.stringify(document.trophies);
      const writeBytes = Buffer.byteLength(layoutJson) + Buffer.byteLength(trophiesJson);
      counters.writeBytesTotal += writeBytes;
      if (writeBytes > counters.maxWriteBytes) counters.maxWriteBytes = writeBytes;
      const writeStartMs = ports.nowMs();
      const result = await ports.writeRow({
        accountId: entry.accountId,
        plotIndex: entry.plotIndex,
        plotId: entry.plotId,
        tier: document.tier,
        layoutJson,
        trophiesJson,
        condition: document.condition,
        visitPolicy: document.visitPolicy,
        wireRev: document.rev,
        // The shape THIS document was serialized in, from the document itself:
        // the writer is the only party that knows it, and a later or earlier
        // build reads the column to decide whether it may interpret the row.
        schemaVersion: document.version,
        expectedDurableRev: entry.durableRev,
      });
      counters.writeMsTotal += Math.max(0, ports.nowMs() - writeStartMs);
      return applyWriteResult(entry, result, generation, snapshotAtMs, document);
    } finally {
      permit.release();
    }
  }

  /** Wake anything waiting for this entry to stop owing a write. */
  function releaseSettleWaiters(entry: FreeholdPersistEntry): void {
    if (entry.settleWaiters.length === 0) return;
    for (const wake of entry.settleWaiters.splice(0)) wake();
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
    releaseSettleWaiters(entry);
    // Cleared HERE and not above, so a RE-ARMED write inherits the capture: a
    // write launched out of settle samples its document after its own permit
    // wait, past the point where the leaving session's record still exists.
    //
    // And only when the entry no longer OWES the write. The null-permit arm of
    // runWrite returns false WITHOUT quiescing, so an entry can settle
    // uncommitted, unblocked and still dirty; dropping its capture there left
    // the next sweep to re-arm a write whose record removePlayer had already
    // evicted, and the leaving session's edits were gone for good. Gate
    // saturation produces both that timeout and the deferral the capture exists
    // for, so the two arms are adjacent rather than exotic.
    if (!owesWork(entry) && entry.leaveDocument !== null) {
      leaveCaptures--;
      entry.leaveDocument = null;
    }
    pumpDeferredWrites();
    maybeRemove(entry);
    drainCheck();
  }

  function launch(entry: FreeholdPersistEntry): void {
    deferredWrites.delete(entry);
    // A leaving flush parked on this entry has something to await again.
    releaseSettleWaiters(entry);
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
          // A RUN, not a lifetime tally: an error further back than the window
          // starts a fresh count rather than adding to one.
          const failedAtMs = ports.nowMs();
          const withinWindow =
            entry.lastWriteErrorMs > 0 &&
            failedAtMs - entry.lastWriteErrorMs <= FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS;
          entry.writeErrors = withinWindow ? entry.writeErrors + 1 : 1;
          entry.lastWriteErrorMs = failedAtMs;
          ports.error(
            `freehold plot index ${entry.plotIndex} write failed:`,
            boundedDatabaseError(err),
          );
          if (entry.writeErrors >= FREEHOLD_PERSIST_MAX_WRITE_ERRORS && !entry.quiesced) {
            entry.quiesced = true;
            entry.quiesceWarned = true;
            ports.error(
              `freehold plot index ${entry.plotIndex} quiesced after ${entry.writeErrors} thrown writes; no further writes go out for this owner`,
            );
          }
          return false;
        })
        .then((committed) => {
          // settle must never reject: an unsettled chain would leave the entry
          // running forever, and a drain waiting on it would only ever answer
          // at its deadline.
          try {
            settle(entry, committed);
          } catch (err) {
            // RAW: a throw out of settle is a programming bug, not a database
            // answer, and reducing it to three pg fields drops the stack that
            // would name the line.
            ports.error('freehold write settle failed:', err);
            // The slot was already released inside settle, so the deferred set
            // and any waiting drain must still be served: otherwise a drain
            // waits out its whole deadline for work that is finished.
            pumpDeferredWrites();
            drainCheck();
          }
        });
    } catch (err) {
      counters.writeFailures++;
      // RAW, for the same reason: a throwing enqueue is this process failing,
      // not PostgreSQL answering.
      ports.error(`freehold plot index ${entry.plotIndex} write could not be queued:`, err);
      entry.running = false;
      entry.chain = null;
      activeWrites--;
      maybeRemove(entry);
      drainCheck();
      // This catch can run INSIDE the pump's own loop, and pumpDeferredWrites
      // latches on `pumping`, so the call below is a no-op there and the loop's
      // next iteration does the work instead. It matters on the other path,
      // where launch was reached from arm and no pump is running.
      pumpDeferredWrites();
    }
  }

  /** Start as many deferred writes as the local cap now allows. Called every
   *  time a slot frees, so the set drains without a timer. */
  let draining = false;
  /** The concurrent-write cap in force right now. */
  const writeCap = (leaving: boolean): number =>
    (draining ? FREEHOLD_PERSIST_DRAIN_MAX_ACTIVE_WRITES : FREEHOLD_PERSIST_MAX_ACTIVE_WRITES) +
    (leaving ? FREEHOLD_PERSIST_LEAVE_WRITE_RESERVE : 0);

  let pumping = false;
  function pumpDeferredWrites(): void {
    if (pumping) return;
    pumping = true;
    try {
      pumpLoop();
    } finally {
      pumping = false;
    }
  }

  function pumpLoop(): void {
    while (activeWrites < writeCap(false) && deferredWrites.size > 0) {
      const next = deferredWrites.values().next().value;
      if (next === undefined) return;
      deferredWrites.delete(next);
      // The wait may have outlived the reason for the write: the entry could
      // have been evicted, held or quiesced since it was deferred.
      if (!live(next) || blocked(next) || next.running || !isDirty(next)) {
        // It left the deferred set without a write, so it may now be removable:
        // without this the entry waits for the orphan sweep instead.
        releaseSettleWaiters(next);
        maybeRemove(next);
        continue;
      }
      launch(next);
    }
  }

  // Exactly one running plus one pending per owner key: a burst of a thousand
  // marks costs one write in flight and one behind it, never a thousand.
  function arm(entry: FreeholdPersistEntry, leaving = false): void {
    if (blocked(entry)) return;
    if (!entry.running && activeWrites >= writeCap(leaving)) {
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

    // markDirty and save are the store's EXPLICIT dirty seam and have no
    // production caller in this release. The revision sweep below is the only
    // detector that runs, which is safe exactly because every sanctioned
    // mutator of a FreeholdState bumps its revision, and that coupling is
    // pinned by a source scan in tests/freehold_module.test.ts rather than left
    // to a future author to remember. The furnishing placement writer is the
    // caller these are here for; until it lands they are driven only by tests.
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
      // The SAME dirty test the periodic sweep uses, not a weaker one: a tier
      // change made since the last sweep bumps only the record's revision, so
      // an isDirty-only check here would drop the whole last window of edits at
      // logout, which is precisely when there is no next sweep to catch them.
      const moved = noteRevisionMoved(entry);
      if (!blocked(entry) && (moved || isDirty(entry) || entry.running || entry.pending)) {
        // arm() directly rather than save(), so a closed intake (a shutdown
        // already under way) still lets a leaving session write out its last
        // edits. A clean entry is left alone: rewriting an unchanged document
        // on every logout would burn a durable revision per leave.
        // CAPTURED BEFORE THE WAIT, because the write's precondition is that the
        // sim record still exists and this is the only window where that holds.
        // A deferred write, or one whose deadline expires below, runs AFTER
        // removePlayer has evicted the record, and would then serialize to null
        // and write nothing at all: the leaving session's last edits would be
        // silently gone. One clone per dirty logout buys that back.
        entry.leaveDocument = ports.serialize(ownerKey);
        if (entry.leaveDocument !== null) leaveCaptures++;
        // LEAVING, so it may borrow the reserve: this write is the last chance
        // for these edits, and every background write it would otherwise queue
        // behind has a next sweep to catch it.
        arm(entry, true);
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
            // A DEFERRED entry has no chain and is still owed a write, so a
            // null chain alone does not mean there is nothing to wait for.
            // Treating it that way returned a mass disconnect's every logout in
            // milliseconds, spending none of the budget the deadline exists to
            // bound and leaving every entry resident.
            if (chain === null && !deferredWrites.has(entry)) break;
            const settled =
              chain?.catch(() => undefined) ??
              new Promise<void>((resolve) => {
                entry.settleWaiters.push(resolve);
              });
            await Promise.race([settled, expiry]);
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
    retain(ownerKey: string, accountId = 0): void {
      const entry = ensureEntry(ownerKey, accountId);
      entry.refs++;
      entry.orphanPasses = 0;
      // AN UNLOADED ENTRY HERE IS A LOST ONE. retain runs at the end of a
      // handshake whose preload already ran, so the store should have a loaded
      // entry for this owner. If it does not, something removed it in between:
      // the orphan sweep after a slow handshake, or a leave for another
      // character of the same account. Yielding a `loaded: false` entry would
      // write-block the session for its whole life, with no hold, no counter
      // and no log, and every edit the player makes would be discarded at
      // logout. So re-read instead. The read is single-flight and load-once, so
      // a normal join, where the entry IS loaded, costs nothing.
      // ...but never on a DARK realm. The join path's own preload is gated on
      // the housing flag in server/main.ts, so this reload would otherwise be
      // the one durable read a realm with housing disabled still issues, once
      // per join, for a feature it does not serve.
      // The RESULT is discarded on purpose: the joining session already has
      // whatever its own handshake read, and this read exists to make the ENTRY
      // able to write, not to change what the player was handed. It rides the
      // same single-flight slot and the same admission cap of four as any other
      // load, so a storm of them cannot outrun the gate.
      if (!entry.loaded && accountId > 0 && ports.enabled()) {
        void preload(accountId).catch(() => undefined);
      }
    },

    idle(deadlineMs: number): Promise<boolean> {
      // Intake closes HERE rather than in stop(), so a GameServer.stop()
      // earlier in the shutdown sequence cannot refuse this drain's own
      // enqueues.
      intake = false;
      // The drain runs at its own cap: nothing else contends for the shared
      // gate once intake is closed, and the deadline has to cover the realm
      // rather than a quarter of it.
      draining = true;
      for (const entry of entries.values()) {
        if (isDirty(entry)) arm(entry);
      }
      pumpDeferredWrites();
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
      let loaded = 0;
      let oldestDirtyAtMs = 0;
      for (const entry of entries.values()) {
        if (isDirty(entry)) dirty++;
        if (entry.running) running++;
        if (entry.pending) pending++;
        if (entry.hold !== null) held++;
        if (entry.quiesced) quiesced++;
        if (entry.loaded) loaded++;
        if (
          entry.dirtySinceMs > 0 &&
          (oldestDirtyAtMs === 0 || entry.dirtySinceMs < oldestDirtyAtMs)
        ) {
          oldestDirtyAtMs = entry.dirtySinceMs;
        }
      }
      return {
        entries: entries.size,
        loaded,
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
        writesWithoutRecord: counters.writesWithoutRecord,
        preGateRefusals: counters.preGateRefusals,
        deferredWrites: deferredWrites.size,
        activeWrites,
        leaveCaptures,
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
      loaded: 0,
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
      writesWithoutRecord: 0,
      preGateRefusals: 0,
      deferredWrites: 0,
      activeWrites: 0,
      leaveCaptures: 0,
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
  // A STRUCTURAL guard, not a type assertion. This value arrives on a spread
  // meta bag that crosses a module boundary, and every field below is read
  // straight into sim state; a bag that lost its shape would install a record
  // with undefined fields rather than refusing.
  if (!loaded || typeof loaded !== 'object') return;
  const ownerKey = freeholdOwnerKeyForAccount(accountId);
  // The CLOCK FIRST, and unconditionally. It is a separate durable fact from
  // the plot: an account whose plot row is held, or absent entirely, still has
  // a Hearth cooldown, and dropping it because the plot could not be installed
  // hands that account a free travel on every login. The forward-only merge
  // itself belongs to the sim, which owns the Map.
  // INDEPENDENTLY guarded, because they are independent durable facts: a bag
  // that lost its clock must still install the plot, and vice versa. Coupling
  // them means one malformed field costs the owner both.
  if (typeof loaded.hearthReadyAtMs === 'number') {
    mergeFreeholdKeyReadyAt(ctx, ownerKey, loaded.hearthReadyAtMs);
  }
  if (loaded.hold !== null || loaded.state === null) return;
  if (typeof loaded.state !== 'object') {
    // A skip here means addPlayer seeds a default while the store's entry still
    // believes it loaded a real row, which used to be how a default reached the
    // row. It no longer is: runWrite's identity seal refuses to write a record
    // still carrying the unassigned plot id over a row that HAS a durable
    // revision, so the row survives and the account is write-blocked instead.
    // A throw here would refuse the login for a case the real store cannot
    // produce, which is a worse trade than one held session.
    return;
  }
  loadFreehold(ctx, ownerKey, freeholdStateFromPersisted(loaded.state, ownerKey));
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
/** The realm's live tier and visit-policy vocabulary. Both sides of the
 *  writable-implies-readable property read it from here. */
const REALM_IDENTITY_SETS = {
  validTierIds: FREEHOLD_TIER_IDS as ReadonlySet<string>,
  validVisitPolicies: FREEHOLD_VISIT_POLICIES,
};

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
    // ONE declaration of the realm's identity sets, consumed by BOTH sides.
    // Declaring them twice is how a load that refuses a tier and a save that
    // accepts it come to disagree.
    normalize: (raw) => normalizeFreehold(raw, REALM_IDENTITY_SETS),
    identitySets: () => REALM_IDENTITY_SETS,
    serialize: (ownerKey) => {
      const state = serializeFreehold(deps.sim.ctx, ownerKey);
      return state === null ? null : persistedFreeholdFromState(state);
    },
    hasLive: (ownerKey) => deps.sim.ctx.freeholds.has(ownerKey),
    stampPlotId: (ownerKey, plotId) =>
      stampFreeholdPlotId(deps.sim.ctx, ownerKey, asFreeholdPlotId(plotId)),
    enabled: () => deps.sim.ctx.freeholdsEnabled,
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
