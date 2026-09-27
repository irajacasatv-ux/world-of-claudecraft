// The housing persistence store's WRITE-SIDE and LIFECYCLE bounds, each with the
// measurement or the failure it stands on: the drain deadline, the background
// permit wait, the load and write admission caps, the drain cap and the leave
// reserve, the leave flush bound, the orphan sweep's grace and the flush passes.
// Moved whole out of server/freehold_persist.ts (its monolith ceiling), which
// re-exports every one, so no importer changed. The login-path bounds are in
// server/freehold_login_bounds.ts and the thrown-run retry clock's in
// server/freehold_write_retry.ts.

/** How long the shutdown drain waits for running and pending writes before it
 *  gives up and answers false. Finite by contract: a drain that can block
 *  forever is a hung realm restart. */
export const FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS = 10_000;

/** The bound on a BACKGROUND WRITE's wait for a shared background permit.
 *  server/background_db_gate.ts keeps its waiter list UNCAPPED, so a caller
 *  that queues without a bounded signal is the thing that grows without limit
 *  under a stalled pool. The login path has its own, shorter bound below. */
export const FREEHOLD_PERSIST_WRITE_PERMIT_WAIT_MS = 15_000;

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
