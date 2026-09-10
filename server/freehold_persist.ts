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
// reaching into the coordinator. The bindings themselves, and therefore every
// SQL import, live in server/freehold_persist_wiring.ts: this file names its
// ports and nothing else supplies them.
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

import { mergeFreeholdKeyReadyAt } from '../src/sim/freehold/hearth_key';
import { boundedFreeholdDetail, freeholdLoadDiagnostic } from '../src/sim/freehold/load_report';
import {
  FREEHOLD_MAX_STORED_BYTES,
  type FreeholdLoadResult,
  type FreeholdWriteRefusalOptions,
  freeholdStateFromPersisted,
  freeholdWriteRefusal,
  type PersistedFreehold,
} from '../src/sim/freehold/persisted';
// BY PATH, like the persistence leaf and the hearth clock above, and for the
// same reason those two give in src/sim/freehold/index.ts: this module is the
// server-side durable consumer, so it reaches the leaf it needs rather than
// pulling the directory's whole public surface into a server graph. Named here
// because these three ARE on the barrel, so without a reason a later reader
// cannot tell the deliberate exception from drift.
import { loadFreehold, PENDING_FREEHOLD_PLOT_ID } from '../src/sim/freehold/state';
import type { SimContext } from '../src/sim/sim_context';
import {
  FREEHOLD_PRIMARY_PLOT_INDEX,
  type FreeholdRowLoad,
  type FreeholdUpsert,
  type FreeholdUpsertResult,
} from './freehold_db';
import type { FreeholdHearthLoad } from './freehold_hearth_db';
import { freeholdOwnerKeyForAccount } from './freehold_wire';

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
 * handshake awaits this read: it is bounded at the same 5,000 as
 * DB_POOL_CONNECT_TIMEOUT_MS rather than SHORTER than it (an earlier version of
 * this line claimed shorter, and the two numbers are equal), and a joining
 * player must not sit fifteen seconds waiting for a permit to read two small
 * rows. Under gate saturation this still stalls a handshake for a full five
 * seconds before answering a hold, which is carried as a named gate in
 * docs/freeholds/persistence-rollout-contract.md rather than tuned here. The local
 * admission cap already makes an early answer safe: it is a HOLD, not a
 * failure, so the account joins on its live record and simply does not write.
 * The two are separate constants on purpose; merging them puts a background
 * write's budget on a player's login.
 */
export const FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS = 5_000;

/**
 * The SERVER-SIDE statement bound on the two login-path reads, applied through
 * the runWithStatementTimeout seam in server/db.ts.
 *
 * Without it both reads inherit the pool's DB_STATEMENT_TIMEOUT_MS of 15,000,
 * three times the permit bound above, on a handshake whose own budget is
 * AUTH_TIMEOUT_MS = 10,000 (server/ws_auth.ts) and which has already spent from
 * it on auth, moderation, cosmetics, the character read and the bank bonus. In
 * health these two statements are sub-millisecond; a sick database is exactly
 * when the difference binds, and the handshake is the one place a slow read is
 * paid by a player rather than by a sweep.
 *
 * PER STATEMENT, NOT PER LOGIN. The combined port (readDurables, bound in
 * server/freehold_persist_wiring.ts) puts both reads on ONE checked-out client,
 * but SET LOCAL bounds each separately: measured on the dev database, two 300 ms
 * sleeps under a 400 ms bound both completed, 612 ms elapsed. Worst case 5,000
 * (DB_POOL_CONNECT_TIMEOUT_MS) + 2 x 2,000 = 9,000 ms against a 10,000 ms
 * handshake, down from 19,000 when each read took its own checkout. Nine against
 * ten is not slack: what is still missing is a cap on the WHOLE preload against
 * the handshake's remaining budget, without which an overrunning login has its
 * socket closed while the chain runs on, takes a lease and joins. Section 8a.
 */
export const FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS = 2_000;

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
 * thousand owners. Measured at that cap, a thousand dirty owners drained in
 * 2.9 seconds and five thousand did not finish, leaving 1,584 owners' edits
 * unwritten; re-measured at the raised cap, five thousand drained in 6,944 ms,
 * inside the deadline. That second number is the one this constant stands on and
 * it was missing here, so the block argued from the figures it contradicts.
 * The shared gate's own capacity of seven still bounds what actually reaches the
 * database, so at the default pool the eighth slot can only ever be parked on a
 * permit wait: `active_writes` reads eight while seven are working.
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

/**
 * Every reason a durable load can refuse, as a VALUE so a consumer can walk it.
 *
 * The metrics family that labels on this kind used to key its series on
 * whatever the by-kind tally happened to contain, which made its bounded-label
 * promise a property of the union type rather than of anything at runtime. It
 * now walks this list (the server/offline_fence_refusals.ts OFFLINE_FENCE_WRITERS
 * shape), so a widened producer cannot grow the series set on its own and a
 * kind that has never fired reads zero rather than being absent.
 */
export const FREEHOLD_LOAD_FAILURE_KINDS = [
  'unsupported',
  'malformed',
  'oversize',
  // The genuinely ROW-LEVEL cause: the SQL reader saw rows for this account and
  // none of them sits in the admitted slot. It is a data incident.
  'unadmitted',
  // The three ADMISSION causes, split out because the metric's own help text
  // promises an operator four different responses and one label cannot give
  // them: a full local cap is a login-storm capacity signal, a missing permit is
  // pool or gate saturation, and a thrown read is a database fault. A host with
  // no store answers the same hold SHAPE but books no counter at all, so it is
  // deliberately absent from this list.
  'cap_full',
  'no_permit',
  'read_threw',
] as const;

/** Why an account's durable row must not be written this session. `kind` is the
 *  classification the load produced; `detail` is dev-channel prose. */
export interface FreeholdRecoveryHold {
  /** Derived from the list above, so the two can never drift apart. */
  readonly kind: (typeof FREEHOLD_LOAD_FAILURE_KINDS)[number];
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
  /**
   * BOTH login reads on ONE checked-out client, when the host can offer it.
   *
   * The two above are the fallback and the shape a Vitest drives; this is the
   * shape a pool wants. Bounding each read on its own means a transaction each
   * (connect, BEGIN, SET LOCAL, the statement, COMMIT), so a handshake pays
   * eight round trips and holds two clients across four statements apiece for
   * two small reads. Sharing one transaction pays five and holds one, and it is
   * also what lets a future change cap the pair against the handshake's
   * remaining budget rather than each half separately.
   *
   * A host that does not supply it gets the two ports in sequence, unbounded,
   * which is what every test does.
   */
  readDurables?(
    accountId: number,
    maxOwnedBytes: number,
  ): Promise<{
    row: FreeholdRowLoad;
    /** A THROWN clock read is a VALUE here, not a rejection, so the row beside
     *  it still lands. Sharing a transaction must not make a hearth fault hold
     *  the plot: the two are separate durable facts and the clock failing open
     *  while the plot fails closed is a deliberate asymmetry carried as a named
     *  gate, not something a round-trip saving may quietly change. */
    hearth: FreeholdHearthLoad | { readonly kind: 'threw'; readonly error: unknown };
  }>;
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
  /** BOTH deadlines the store owns: the shutdown drain's, and the per-leave
   *  flush bound inside flushAndRelease, which fires far more often (one per
   *  dirty logout). Injected so tests drive them without a wall clock; the
   *  module-edge default below is the only setTimeout in this file. */
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
  /** Entries held by ANY recovery hold, DATA or CAPACITY. A row this build could
   *  not interpret is one cause; a full local admission cap, a missing
   *  background permit and a thrown read are the others, and they mean opposite
   *  things to an operator. Read `loadFailuresByKind` to tell them apart. */
  readonly held: number;
  /** Entries quiesced by an answer no repeat of the same payload can fix. FIVE
   *  producers, and only the first is the compare-and-swap fence: a stale CAS, a
   *  missing or conflicting row, the write seal refusing a record that is not
   *  the one this entry loaded, the writable-implies-readable refusal, and a run
   *  of thrown writes inside the error window. Read it against `staleWrites` and
   *  `writeFailures` rather than alone, because only `staleWrites` means a
   *  second writer is touching these rows. Kept apart from `held` because the
   *  two are counted independently and must never be summed. */
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
  /** Serialization, cloning and the write refusal's own walk: the synchronous
   *  work between the permit and the statement, which `write_ms` deliberately
   *  does not bracket. */
  readonly codecMsTotal: number;
  readonly loadMsTotal: number;
  readonly oldestDirtyAgeMs: number;
  readonly writeBytesTotal: number;
  readonly maxWriteBytes: number;
  /** Writes that held a background permit with no document to send. No
   *  statement is issued: the arm returns before the row is ever touched. The
   *  terminal state of every lost-save path this store has had. */
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
  /** Settle any outstanding drain as NOT drained, which cancels that drain's
   *  deadline. Does NOT close intake, and does not cancel a leave-flush deadline
   *  already armed: those are bounded at two seconds and cancel themselves. */
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
   * ceiling retain 66.2 MiB, and 0.29 MiB with empty layouts. That is the
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
  /** The SUBSET of deferredWrites holding a leave capture, kept so the pump can
   *  prefer a leaver in O(1) rather than scanning the whole deferred set on
   *  every admission. Scanning made the shutdown drain quadratic in the deferred
   *  count: `pumpLoop` asks twice per settle, once to admit and once to discover
   *  the cap is full, and at five thousand deferred owners that is millions of
   *  iterations to answer a question the insertion order used to answer at once.
   *  Every deferredWrites mutation below keeps this in step. */
  const deferredLeavers = new Set<FreeholdPersistEntry>();
  let activeWrites = 0;
  /** Documents captured at leave and not yet written. Each is a SECOND full
   *  record on top of entry.state, so at the approved 420-row ceiling a
   *  thousand simultaneous dirty logouts retain 66.2 MiB until their writes
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
    // The CODEC, beside the statement rather than inside it. Every save
    // serializes the document twice (once for the refusal's byte measure and
    // once for the two content columns) and clones it twice before that, and
    // none of it reached a counter while `write_ms` bracketed only the
    // statement. Measured at 0.198 ms per save at the 420-row ceiling, of which
    // the refusal walk is 74 percent, and it is UNYIELDING synchronous time
    // between the permit and the statement, so it escapes the tick profiler's
    // save lap as well.
    codecMsTotal: 0,
    loadMsTotal: 0,
    // A TOTAL plus a high-water mark rather than a last-sample gauge: at a
    // thousand owners a scrape samples one arbitrary write, which says nothing
    // about the size distribution or about growth toward the byte ceiling.
    writeBytesTotal: 0,
    maxWriteBytes: 0,
    // The terminal state of every lost-save path: a write that held a permit
    // with no document to send, and issued no statement at all. It used to be
    // silent, which is why three separate versions of that bug had to be found
    // by reading rather than by watching.
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
   *
   * DETECTION IS NOT ADMISSION, and the two answers differ for one case. This
   * probe says a backwards revision is a CHANGE worth looking at; the write
   * seal in runWrite then decides whether that particular record may land, and
   * for a record still carrying the stand-in plot identity it says no, because
   * a stand-in record whose revision fell below the entry's last committed one
   * is a freshly seeded default rather than a reload. A record carrying a real
   * plot name still goes backwards onto the row exactly as this comment says.
   * Written down because the two rationales read as contradictory otherwise,
   * and a later reader reconciling them by relaxing the seal would reopen the
   * seventh path to an empty default over a real house.
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
    // ONE ACCOUNT, not two. The row is selected by `entry.accountId` while the
    // document comes from `ports.serialize(entry.ownerKey)`, so a mismatched
    // pair would compare-and-swap one account's house onto another's row, and
    // because the swap never touches plot_id the loss would be invisible in the
    // key. Every caller today derives both from one authenticated account id, so
    // this is the check that keeps that a property rather than a convention.
    if (accountId > 0 && ownerKey !== freeholdOwnerKeyForAccount(accountId)) {
      throw new Error('freehold owner key and account id name different accounts');
    }
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
   *
   * THREE OF THE FIVE CLAUSES ARE REDUNDANT TODAY, not one, and a mutation pass
   * establishes which: dropping `running`, `pending` or the deferred set alone
   * leaves the suite green, while dropping the in-flight-load clause or the
   * dirty clause fails it. All three are redundant for the same reason, that
   * today's arming rules make an entry that is running, pending or deferred
   * also dirty and unblocked, so the last clause already covers them. They are
   * kept, and named here rather than one of them, because each says what its
   * own state MEANS rather than what the current arithmetic happens to imply,
   * and because the equality is a property of arm() that arm() does not
   * declare. An earlier version of this comment claimed only the deferred
   * clause was in that position; it was three.
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
    deferredWrites.has(entry) ||
    (isDirty(entry) && !blocked(entry));
  // NOT a clause of its own for the retained leave document, deliberately, and
  // the reason is worth writing down because it is the shape of a defect this
  // packet has already made once. `settle` clears the capture only when the
  // entry NO LONGER owes work, so a `leaveDocument !== null` clause here would
  // make the capture its own reason to be kept and it could never be released.
  // The accounting gap it was reaching for is closed at the two DELETE sites
  // instead, through releaseCapture below.

  /** Drop a retained leave document and its accounting together. `leave_captures`
   *  is the ONLY published bound on that retention, and a bound that can only
   *  climb is not one: an entry deleted while it still held a capture would take
   *  the document with it and leave the gauge one higher forever.
   *
   *  AT BOTH DELETE SITES, AND DEFENSIVELY THERE. No sequence has been built
   *  that reaches either delete holding a capture, and the argument is short:
   *  `flushAndRelease` captures only for an unblocked entry, every route from
   *  there to `!owesWork(entry)` runs through `settle`, which releases first,
   *  and a deferred entry cannot become blocked while deferred because `blocked`
   *  only flips inside a running write and `arm` never defers a running one. The
   *  calls stay because the coincidence is a property of three separate rules
   *  and this makes it a guarantee, but they are not repairs and no test can
   *  reach them. */
  function releaseCapture(entry: FreeholdPersistEntry): void {
    if (entry.leaveDocument === null) return;
    leaveCaptures--;
    entry.leaveDocument = null;
    // It is no longer a leaver, whatever set it is still sitting in.
    deferredLeavers.delete(entry);
  }

  function maybeRemove(entry: FreeholdPersistEntry): void {
    if (entry.refs > 0 || owesWork(entry)) return;
    if (live(entry)) {
      releaseCapture(entry);
      entries.delete(entry.ownerKey);
    }
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
        // UNFALSIFIABLE, and kept: no behaviour test isolates this reset,
        // because every path out of "owes work" at zero references removes the
        // entry through maybeRemove on the spot, and retain resets the count
        // itself for the referenced case. It states that the grace period
        // counts CONSECUTIVE passes rather than passes in total, which is what
        // the constant beside it means; dropping it would leave the count a
        // lifetime tally that collects an entry a whole grace period early the
        // first time one becomes collectable by some future path.
        entry.orphanPasses = 0;
        continue;
      }
      entry.orphanPasses++;
      // DRIVEN BY THE CONSTANT, so the documented grace period and the code
      // cannot drift: a constant the implementation never reads is a comment
      // wearing an export's clothes.
      if (entry.orphanPasses < FREEHOLD_PERSIST_ORPHAN_SWEEP_PASSES) continue;
      if (live(entry)) {
        releaseCapture(entry);
        entries.delete(entry.ownerKey);
      }
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
    // Per KIND, because the causes demand different operator responses:
    // unreadable rows and a stranded plot slot are data incidents, a full
    // admission cap is a login-storm capacity signal, a missing permit is pool
    // saturation, and a thrown read is a database fault. They were one label
    // once; the metric's own help text promised the discrimination the label
    // could not give.
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

  /** Normalize one hearth answer, or the absence of one. Total: a clock this
   *  store cannot read starts COLD rather than faulting the plot load beside it,
   *  which is a deliberate asymmetry carried as a named gate. */
  function normalizeHearth(load: FreeholdHearthLoad): { readyAtMs: number; revision: string } {
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
  }

  const coldHearth = (err: unknown): { readyAtMs: number; revision: string } => {
    ports.error(
      'freehold hearth clock read failed; the cooldown starts cold:',
      boundedDatabaseError(err),
    );
    return { readyAtMs: 0, revision: ABSENT_HEARTH_REVISION };
  };

  /** The two login reads, on one client when the host offers one. The row half
   *  is allowed to throw, because loadOnce turns that into a HOLD; the clock
   *  half is not, because a clock this store cannot read starts cold. */
  async function readLoginPair(
    accountId: number,
  ): Promise<{ rowLoad: FreeholdRowLoad; hearth: { readyAtMs: number; revision: string } }> {
    if (ports.readDurables) {
      const both = await ports.readDurables(accountId, FREEHOLD_MAX_STORED_BYTES);
      return {
        rowLoad: both.row,
        hearth:
          both.hearth.kind === 'threw'
            ? coldHearth(both.hearth.error)
            : normalizeHearth(both.hearth),
      };
    }
    const rowLoad = await ports.readRow(accountId, FREEHOLD_MAX_STORED_BYTES);
    try {
      return { rowLoad, hearth: normalizeHearth(await ports.readHearth(accountId)) };
    } catch (err) {
      return { rowLoad, hearth: coldHearth(err) };
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
    const { rowLoad, hearth } = await readLoginPair(accountId);
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
      // MINT ONCE, and unreachable defence rather than a live guard: classify
      // runs at most once per entry (beginLoad is single-flight per account and
      // every later preload replays a loaded entry), so nothing today can reach
      // this line twice for one entry. A mutation pass confirms it: minting
      // unconditionally leaves the suite green. It stays because the alternative
      // failure is a second identity on a row that already has one, and it is
      // named here so a later reader does not delete it as dead weight or write
      // a test around a state the store cannot produce.
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
          // THROUGH THE BOUND, because this detail is built in another module
          // from a row's own plot_index. The reporter is not the only route to a
          // log, so the bound is applied where the producer is outside this file.
          detail: boundedFreeholdDetail(rowLoad.detail),
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

  function refuse(
    accountId: number,
    ownerKey: string,
    // The CAUSE, not the class. Every one of these is an admission refusal, and
    // an operator's response to each is different, so they must not share the
    // row-level label.
    kind: 'cap_full' | 'no_permit' | 'read_threw',
    detail: string,
  ): LoadedFreehold {
    const entry = ensureEntry(ownerKey, accountId);
    return holdResult(
      entry,
      {
        kind,
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
      return refuse(accountId, ownerKey, 'cap_full', 'the local load admission cap is full');
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
          'no_permit',
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
      return refuse(accountId, ownerKey, 'read_threw', 'the durable load threw');
    } finally {
      activeLoads--;
    }
  }

  // ASYNC on purpose, even though every return below is already a promise.
  // `freeholdOwnerKeyForAccount` THROWS on a non-positive or non-safe account
  // id, and `retain`'s repair reload calls this fire-and-forget behind a
  // `.catch`. A synchronous throw walks straight past that catch, out of
  // GameServer.join, after retain has already taken a reference that no path
  // then releases. Making the function async turns it into a rejection the catch
  // can see. Unreachable today (accounts.id is INT4 and the handshake refuses a
  // malformed id first), which is why it is a shape fix rather than a defect.
  async function preload(accountId: number): Promise<LoadedFreehold> {
    const ownerKey = freeholdOwnerKeyForAccount(accountId);
    const entry = entries.get(ownerKey);
    // A second character of the same account is joining: the live record is
    // the truth and there is nothing to read. state null so the caller
    // installs nothing over it.
    if (ports.hasLive(ownerKey)) {
      if (entry?.loaded) {
        entry.accountId = accountId;
        // THE GRACE COUNTS FROM THE LAST TOUCH, not from the last retain. The
        // mark-and-sweep exists because preload resolves before the join calls
        // retain, so an entry legitimately sits at zero references for the width
        // of a handshake; without this reset a handshake wider than one sweep
        // interval loses its entry anyway and the session is write-blocked.
        entry.orphanPasses = 0;
        return snapshotOf(entry, null);
      }
      // The live record is still the truth and must not be overwritten by a
      // read, so the answer below carries no state either way. But WITHOUT the
      // read this entry never learns its plot id or its durable revision, and
      // an entry that never loaded is write-blocked for the whole session: the
      // owner would play, furnish, and have every edit discarded at logout with
      // nothing reported. So read, then answer with no state.
      const loaded = await beginLoad(accountId, ownerKey);
      const touched = entries.get(ownerKey);
      if (touched) touched.orphanPasses = 0;
      return { ...loaded, state: null };
    }
    // Load-once, like loadFreehold: a re-preload replays what the entry knows
    // (so a rejoin after the sim evicted the record re-installs the real
    // house) and never mints a second plot id or reads the row twice.
    if (entry?.loaded) {
      entry.accountId = accountId;
      entry.orphanPasses = 0;
      // blocked(), not `hold === null`. A QUIESCED entry has no hold and yet is
      // exactly the entry whose knowledge is known to be stale: the durable
      // revision moved under this realm, which is what the fence exists to
      // detect. Replaying its state would install a house another writer has
      // already replaced, as if it were current.
      //
      // An outstanding LEAVE CAPTURE outranks `entry.state`, which only ever
      // advances at commit. The capture is the previous session's last edits,
      // still unwritten; replaying the committed state instead would show the
      // returning player a house missing everything they did before logging
      // out, and would then overwrite the capture on the next sweep. Handing it
      // Handing it over does NOT release it. `retain` is the confirmation and
      // releases it there, and only when the live record actually carries it;
      // see offerCapture for the five handshake exits that make releasing here
      // a lost-save path of its own.
      return snapshotOf(entry, blocked(entry) ? null : offerCapture(entry));
    }
    const loaded = await beginLoad(accountId, ownerKey);
    const touched = entries.get(ownerKey);
    if (touched) touched.orphanPasses = 0;
    return loaded;
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
    /** The identity the LIVE RECORD carried when this write sampled it. */
    persistedPlotId: string,
  ): boolean {
    if (result.kind === 'inserted' || result.kind === 'updated') {
      counters.writes++;
      entry.durableRev = result.durableRev;
      // THE ENTRY REMEMBERS THE RECORD'S IDENTITY, NOT THE ROW'S. Two different
      // identities are in play and each belongs where it is: the ROW receives
      // `entry.plotId`, because that is its durable public name, while the
      // entry's cached state keeps the identity the LIVE RECORD carried,
      // because the only thing that state is compared against is a live record.
      //
      // That is what lets the seal below tell "this is the record I have been
      // writing" from "this is a default somebody seeded", without the store
      // ever having to write an identity into the sim. A fresh account's record
      // legitimately carries the pending stand-in for its whole first session,
      // and a stand-in is indistinguishable from a fresh seed by identity
      // alone, so an entry that remembered the ROW's name instead would refuse
      // its own record on the second write of every new account.
      //
      // A ROUND NINE EDIT REMOVED THIS and was reverted. With the seal's
      // stand-in exemption in place the two looked equivalent, and they are
      // not: `entry.state` is also what `offerCapture` hands a rejoin, and
      // `installLoadedFreehold` sets the live record's identity from that
      // document, so caching the row's name here TEACHES the sim a different
      // name on every replay. That is a cross-host behaviour change wearing a
      // simplification's clothes.
      entry.state = { ...written, plotId: persistedPlotId };
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
      // The codec measure OPENS here, at the first clone, and closes after the
      // second serialization: everything between the permit and the statement.
      const codecStartMs = snapshotAtMs;
      const generation = entry.dirtyGeneration;
      entry.snapshotGeneration = generation;
      const liveRecord = ports.serialize(entry.ownerKey);
      // THE LIVE RECORD WINS WHENEVER ONE EXISTS. The capture stands in only
      // for the window where there is none, which is what it was taken for: a
      // leave, then eviction, then this write.
      //
      // A revision comparison was tried here and was WRONG. `rev` restarts from
      // the last committed value when a rejoin replays the entry's state, so
      // the capture's revision and the live record's are counters on two
      // different timelines and "newer" is not decidable from them: preferring
      // the capture lost the REJOINING session's edits, which is the mirror of
      // the bug it was meant to fix. The leaver's edits are preserved a level
      // up instead, by handing the capture to the rejoin (see preload), so by
      // the time a live record exists again it already carries them.
      const persisted = liveRecord ?? entry.leaveDocument;
      if (persisted !== null) entry.snapshotRev = persisted.rev;
      // No live record and nothing captured. Writing here would put a default
      // over a real row, which is invariant 1.
      if (persisted === null) {
        counters.writesWithoutRecord++;
        // AND STOP OWING THE WRITE. Nothing here can ever be written: there is
        // no record and no capture, so every later sweep would re-arm the same
        // empty write, spend a permit on it and count it again, forever, and
        // `owesWork` would keep the entry resident for the life of the process.
        // Advancing the committed generation is safe because it discards no
        // edit: the edits are already gone with the record, and a rejoin
        // re-dirties the entry through the revision probe the moment a live
        // record exists again. NO PRODUCTION SEQUENCE reaches this arm in this
        // release (markDirty has no production caller, the revision probe cannot
        // dirty an entry with no record, and GameServer.leave always flushes
        // while the record is still live), so this is a bound on a state the
        // furnishing writer will make reachable rather than a live repair.
        if (entry.committedGeneration < generation) entry.committedGeneration = generation;
        entry.dirtySinceMs = isDirty(entry) ? snapshotAtMs : 0;
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
      //
      // THREE TESTS, because identity alone has a blind window. A brand-new
      // account's record legitimately carries the stand-in identity for its
      // whole first session, and so does a freshly seeded default, so between
      // that account's first insert and its first reload the two are
      // indistinguishable by name.
      const standInSeed = persisted.plotId === PENDING_FREEHOLD_PLOT_ID;
      // The second test refuses an UNTOUCHED seed without needing a name: a
      // PRISTINE default carries no information at all, so refusing to write
      // one over a row can never lose anything, and an entry that knows more
      // than a pristine default is an entry whose record has diverged from one.
      //
      // MEASURED, so nobody has to guess what it is still for: while the entry
      // loaded a ROW the name comparison above catches every reseed first, so
      // this arm is dead there and removing it leaves the suite green. For an
      // entry that MINTED its own row it is the opposite: see the OPEN GATE
      // below, where the name comparison cannot fire at all and this arm plus
      // the revision test are the only things standing.
      //
      // IT IS KEPT BECAUSE THE NAME COMPARISON IS EXACTLY WHAT A FUTURE ROUND
      // WILL NARROW. Round nine exempted the stand-in from it to stop a healthy
      // fresh account being quiesced, and in that shape this arm and the one
      // below were the only things left standing between a seeded default and a
      // real house. The gate that fix is carried under will narrow it again.
      // This arm also reads the CONTENT directly, so unlike the revision test
      // below it survives a future writer that adds a furnishing and forgets to
      // bump the revision.
      const pristineSeed =
        standInSeed &&
        persisted.rev === 0 &&
        persisted.layout.length === 0 &&
        persisted.trophies.length === 0;
      // TOTAL over the persisted shape, and expressed against `persisted`
      // rather than against the sim's default constants. This arm is only ever
      // read when `pristineSeed` holds, so `persisted` IS the pristine default
      // standing in front of the entry, and "knows more" is exactly "differs
      // from it in any field a row carries". Enumerating rev, layout and
      // trophies alone left tier, condition and visit policy out, which made
      // the arm silently depend on every tier change also bumping the revision:
      // true today, and a property enforced in another file.
      const entryKnowsMore =
        entry.state !== null &&
        (entry.state.rev > 0 ||
          entry.state.layout.length > 0 ||
          entry.state.trophies.length > 0 ||
          entry.state.tier !== persisted.tier ||
          entry.state.condition !== persisted.condition ||
          entry.state.visitPolicy !== persisted.visitPolicy);
      // The third test closes the REST of it, and it is the one the other two
      // miss. A seed stops being pristine the instant the returning player
      // touches it: one tier grant, or one furnishing once that writer lands,
      // and the record is a stand-in identity at revision one standing against
      // an entry that committed revision seven. Both other tests pass, the
      // empty default is compare-and-swapped over the real house, and because
      // the swap never touches plot_id the loss is invisible in the key.
      //
      // A REGRESSED REVISION IS THE DISCRIMINATOR, and it is decidable where
      // "newer" is not. Every sanctioned writer of a live record only ever
      // increments its revision (the coupling is pinned by a source scan in
      // tests/freehold_module.test.ts), and every install this store offers a
      // rejoin carries at least the revision the entry last committed, so a
      // live record BELOW that has to be a different record. It is checked only
      // under the stand-in identity because a record carrying any other name is
      // already refused by the first test.
      //
      // WHICH DIMENSIONS A TEST CAN ISOLATE, measured rather than assumed. For a
      // ROW-LOADED entry only the identity and revision dimensions can be killed
      // by a behaviour case; the pristine arm and its layout, trophies, tier,
      // condition and visit-policy dimensions cannot, because the name
      // comparison catches every reseed there first. They are kept for totality
      // over the persisted shape and listed here rather than pinned by a case
      // that reaches them through a different arm. A case that passes for the
      // wrong reason is the failure this packet has already recorded twice, and
      // it recorded it a third time on the case that named the caught-up seed.
      const revisionRegressed = entry.state !== null && persisted.rev < entry.state.rev;
      // THE FIRST TEST JUDGES A NAME ONLY WHEN THERE IS ONE, and this is the
      // correction that lets the other two carry the stand-in case alone.
      //
      // A bare `persisted.plotId !== entry.state.plotId` quiesced a healthy
      // fresh account for the rest of its session, which is the Y1 failure
      // seen from the other end. Nothing teaches a live record its minted name,
      // so a first-session record carries the stand-in for as long as it lives;
      // but if that account's store entry is dropped and RE-READ from the row
      // it just inserted (retain's lost-entry reload, or a second character
      // joining on preload's already-live-but-unloaded arm), `entry.state`
      // comes back carrying the ROW's minted name while the same live record
      // still carries the stand-in. The names differ, nothing is wrong, and the
      // account was write-blocked with a misleading "the live record is not the
      // record this entry loaded".
      //
      // A STAND-IN IS THE ABSENCE OF A NAME, not a different one, so it is
      // judged by CONTINUITY instead: pristine-and-the-entry-knows-more, or a
      // regressed revision. A record carrying any OTHER name is a different
      // record by construction and is still refused outright.
      // ANY NAME THAT IS NOT THE ONE THIS ENTRY LOADED, stand-in included.
      //
      // AND THIS TEST IS NOT TOTAL. It is total for an entry that loaded a ROW,
      // whose cached name is the row's minted id while a freshly seeded default
      // carries the stand-in. It is INERT for an entry that MINTED its own row:
      // `applyWriteResult` caches the identity the LIVE RECORD carried, nothing
      // teaches a live record its minted name, so that entry's cached name IS
      // the stand-in and a reseeded default carries the same literal. The two
      // are equal, this comparison is false by value equality, and the two
      // continuity tests below are the whole seal. Both are revision-shaped, so
      // a reseeded default whose revision has CAUGHT UP satisfies neither and
      // the empty tier-0 default lands on the house. That is the EIGHTH path,
      // reproduced against this store and pinned AS IT BEHAVES in a case named
      // KNOWN DEFECT, and it is carried as an open gate in
      // docs/freeholds/persistence-rollout-contract.md section 8a. Its fix is
      // the same design decision the paragraph below already owes: teach the
      // live record its minted identity AT INSTALL, on the ABSENT arm only,
      // which makes this comparison total for every entry class. Do not close it
      // by adding a fourth clause here; four rounds have each tried that.
      //
      // ROUND NINE EXEMPTED THE STAND-IN HERE AND IT WAS REVERTED, because the
      // exemption is a data-loss hole: for an entry that loaded a ROW, its
      // cached name is the row's, a freshly seeded default carries the stand-in,
      // and skipping the comparison left only the continuity tests below. Those
      // catch a seed whose revision is BELOW the entry's, and a returning player
      // needs only `entry.state.rev + 1` edits inside one sweep interval to
      // carry it above, at which point the empty tier-0 default is
      // compare-and-swapped over the house. Executed against the real store both
      // ways: refused without the exemption, written with it.
      //
      // The exemption existed to stop a healthy fresh account being quiesced
      // when its entry re-reads the row it inserted (the live record still
      // carries the stand-in while the re-read entry now holds the row's name).
      // That failure is real and is carried as a named gate rather than paid for
      // in data loss: refusing a write costs one session's edits, admitting a
      // seed costs the house. Fail closed. The gate's actual fix is to teach the
      // live record its minted identity at INSTALL, which is a design decision
      // for the maintainer, not a fourth heuristic in this expression.
      //
      // GUARDED ON ITS OWN, not by the chain below: hoisting this to a name
      // takes it out from behind `entry.state !== null`, and an entry with no
      // cached state is every account's very first write.
      const foreignIdentity = entry.state !== null && persisted.plotId !== entry.state.plotId;
      // `entry.durableRev !== null` is EQUAL to `entry.state !== null` by
      // today's arithmetic, not by declaration: all three writers of
      // `entry.state` set `entry.durableRev` in the same statement (classify's
      // row arm, classify's absent arm and applyWriteResult). A mutation pass
      // confirms it, so no behaviour test can isolate it. It is kept because it
      // says what the guard MEANS, which is that a row exists to lose.
      const seededOverReal =
        entry.durableRev !== null &&
        entry.state !== null &&
        (foreignIdentity || (pristineSeed && entryKnowsMore) || (standInSeed && revisionRegressed));
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
                : boundedFreeholdDetail(refusal.detail);
          ports.error(
            `freehold plot index ${entry.plotIndex} write refused (${refusal.kind}): ${measure}; no further writes go out for this owner`,
          );
        }
        return false;
      }
      const layoutJson = JSON.stringify(document.layout);
      const trophiesJson = JSON.stringify(document.trophies);
      const writeBytes = Buffer.byteLength(layoutJson) + Buffer.byteLength(trophiesJson);
      counters.codecMsTotal += Math.max(0, ports.nowMs() - codecStartMs);
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
      return applyWriteResult(entry, result, generation, snapshotAtMs, document, persisted.plotId);
    } finally {
      permit.release();
    }
  }

  /**
   * Offer a rejoining session the capture if one is outstanding, WITHOUT
   * releasing it. Two-phase on purpose.
   *
   * Releasing here was a lost-save path of its own. `preload` runs on the
   * handshake BEFORE the character lease, and five exits sit between the two:
   * a lease already held, no such character, a forced rename, a throwing
   * character read, and a refused join. None of them ever creates a live
   * record, so a capture released here vanished with nothing holding the edits,
   * and `alreadyInWorld` is the sharpest of them because a reconnect after a
   * dropped socket is the very event that produced the capture.
   *
   * `retain` is the confirmation, and it is synchronous on the same tick as the
   * install. Until it comes, the capture stays and a sweep can still write it,
   * which is the outcome that keeps the edits.
   */
  function offerCapture(entry: FreeholdPersistEntry): PersistedFreehold | null {
    return entry.leaveDocument ?? entry.state;
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
    if (!owesWork(entry)) releaseCapture(entry);
    pumpDeferredWrites();
    maybeRemove(entry);
    drainCheck();
  }

  function launch(entry: FreeholdPersistEntry): void {
    undefer(entry);
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
      // A leaving flush parked on this entry has nothing left to await: every
      // other exit from an armed write wakes them, and this one did not, so a
      // parked leaver spent its whole deadline on a write that had already
      // finished failing.
      releaseSettleWaiters(entry);
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

  /** The first deferred entry holding a LEAVE CAPTURE, or the first entry at
   *  all. A leaver's write is the last chance for those edits, and every
   *  background write it would otherwise queue behind has a next sweep to catch
   *  it, so insertion order is the wrong order for it. Without this the reserve
   *  bought nothing past the first two leavers: `arm` admits a leaver at
   *  writeCap(true), but a leaver that missed that window lands in the deferred
   *  set and the pump then re-admits it at writeCap(false), behind every
   *  background write already queued. */
  function nextDeferred(): FreeholdPersistEntry | undefined {
    const leaver = deferredLeavers.values().next().value;
    if (leaver !== undefined) return leaver;
    return deferredWrites.values().next().value;
  }

  /** Both sets, together, so the subset can never outlive its superset. */
  function undefer(entry: FreeholdPersistEntry): void {
    deferredWrites.delete(entry);
    deferredLeavers.delete(entry);
  }

  function pumpLoop(): void {
    while (deferredWrites.size > 0) {
      const next = nextDeferred();
      if (next === undefined) return;
      // The leaver may borrow the reserve here exactly as `arm` lets it.
      if (activeWrites >= writeCap(next.leaveDocument !== null)) return;
      undefer(next);
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
      // A leaver's write is the last chance for those edits, so the pump must be
      // able to find it without walking the backlog it is queued behind.
      if (entry.leaveDocument !== null) deferredLeavers.add(entry);
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
    // TWO DIFFERENT QUESTIONS, and answering them with one predicate is what
    // made this a false success. "Is anything still moving" decides when to stop
    // WAITING, and the three states above are all of it. "Did everything land"
    // decides what to ANSWER, and it is not the same set: runWrite's null-permit
    // arm returns false WITHOUT quiescing, and settle re-arms only on `pending
    // || (committed && dirty)`, so an entry can sit unblocked, still dirty, not
    // running, not pending and not deferred, with nobody left to re-arm it.
    // Waiting longer buys nothing there, which is why this resolves at once
    // rather than burning the deadline; but answering TRUE would report a clean
    // drain over an owner's unwritten edits, on the one signal an operator has
    // that a restart was safe.
    const unwritten = [...entries.values()].some((entry) => isDirty(entry) && !blocked(entry));
    for (const waiter of [...drainWaiters]) waiter.finish(!unwritten);
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
      // THE SWEEP RUNS EVEN WITH INTAKE CLOSED, and above the guard rather than
      // below it. This is the store's only periodic hook, so an entry whose
      // session went away without a leave has no other removal path, and
      // `idle()` closes intake one way and `stop()` deliberately does not reopen
      // it: leaving the sweep behind the guard retired the entries map's only
      // time bound for any store that outlives a drain.
      sweepOrphans();
      if (!intake) return;
      for (const entry of entries.values()) {
        if (noteRevisionMoved(entry) || isDirty(entry)) arm(entry);
      }
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
        // Released BEFORE reassigning: a second leave over a surviving capture
        // holds one document and used to count two, and the gauge that is this
        // retention's only stated bound then ratcheted upward and never read
        // zero again.
        // ONLY WHEN THERE IS SOMETHING TO REPLACE IT WITH. A null answer means
        // the record is already gone, which is the exact window the capture
        // exists for, so overwriting with it would discard the very edits it
        // holds. Released before reassigning, because a second leave over a
        // surviving capture holds one document and used to count two.
        const captured = ports.serialize(ownerKey);
        if (captured !== null) {
          if (entry.leaveDocument !== null) leaveCaptures--;
          entry.leaveDocument = captured;
          leaveCaptures++;
        }
        // LEAVING, so it may borrow the reserve: this write is the last chance
        // for these edits, and every background write it would otherwise queue
        // behind has a next sweep to catch it.
        arm(entry, true);
        // The capture may have been taken after an earlier arm already deferred
        // this entry, so the leaver subset is reconciled here as well as at the
        // deferral itself.
        if (entry.leaveDocument !== null && deferredWrites.has(entry)) {
          deferredLeavers.add(entry);
        }
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
      // THE CONFIRMATION HALF of the capture handover, and it confirms THIS
      // DOCUMENT rather than the existence of some record.
      //
      // A bare presence test was not enough. installLoadedFreehold has four
      // early returns (no bag, a hold, a null state, a bag that lost its shape)
      // and loadFreehold is load-once on top of that, while retain runs on
      // every join and knows none of it. The reachable case is the same-account
      // character swap: preload's already-live arm never offers the capture at
      // all, the install returns early, and the record retain sees belongs to
      // the PREVIOUS session, which removePlayer is explicitly allowed to evict
      // afterwards. The capture was dropped over edits that reached nothing.
      //
      // Comparing the live revision to the captured one fails CLOSED: a skipped
      // install leaves the revision where it was, so the capture survives to
      // the next sweep, which is the outcome that keeps the edits.
      //
      // AND A REVISION IS ALL IT CAN COMPARE. Adding the plot identity beside it
      // was considered and REJECTED as ineffective, not as too costly: the two
      // records that can be confused here are the previous session's and the
      // newly installed one, both belong to the SAME owner, and two records of
      // one account always carry the same identity (the stand-in for a fresh
      // account, the row's minted id for a loaded one). An identity compare
      // separates nothing this one does not.
      if (entry.leaveDocument !== null && ports.liveRev(ownerKey) === entry.leaveDocument.rev) {
        leaveCaptures--;
        entry.leaveDocument = null;
      }
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
      // THE SAME DETECTOR THE OTHER TWO ENTRY POINTS USE, not a weaker one.
      // saveAllDirty and flushAndRelease both probe the live revision first,
      // and the revision sweep is the ONLY dirty detector with a production
      // caller in this release, so an isDirty-only drain could not see an edit
      // at all. It was correct only by the shutdown ORDERING in server/main.ts
      // (game.stop, then saveFreeholds, then this), which is a property of
      // another file and not of the drain.
      for (const entry of entries.values()) {
        if (noteRevisionMoved(entry) || isDirty(entry)) arm(entry);
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
        codecMsTotal: counters.codecMsTotal,
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
    // THROUGH THE CONSTANTS, not two bare zeroes. This file argues at length
    // that the plot fence and the hearth counter are different counters that
    // share a value, and spelling either as a literal here is how a later reader
    // learns they are one.
    hearthRevision: ABSENT_HEARTH_REVISION,
    hold: {
      kind: 'unadmitted',
      detail,
      plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
      durableRev: FREEHOLD_ABSENT_DURABLE_REV,
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
      codecMsTotal: 0,
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
  // AND IT HAS TO NAME THIS ACCOUNT. LoadedFreehold carries accountId precisely
  // so the answer names its subject, and this is the one field the structural
  // guard above skipped. If a bag ever crossed with another account's answer,
  // that account's house and Hearth clock would install under this owner key,
  // and the store's seal cannot catch it because the seal compares identities,
  // not accounts. The blast radius would be two houses.
  if (loaded.accountId !== accountId) return;
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
