// The LOGIN-path bounds of the housing persistence store: the permit wait, the
// statement bound and the whole-preload budget a joining player's housing read
// answers to, and the one arithmetic the handshake needs to split that budget
// across its two asks. Moved out of server/freehold_persist.ts (its monolith
// ceiling) with the fix that made the budget per handshake; the store
// re-exports the three constants so every importer's contract point is
// unchanged. Pure: no clock, no timer, no I/O.

/**
 * The LOGIN-path bound, deliberately shorter than the write one, because the
 * handshake awaits this read: it is bounded at the same 5,000 as
 * DB_POOL_CONNECT_TIMEOUT_MS rather than SHORTER than it (an earlier version of
 * this line claimed shorter, and the two numbers are equal), and a joining
 * player must not sit fifteen seconds waiting for a permit to read two small
 * rows. Under gate saturation this still stalls ONE ASK for a full five
 * seconds before answering a hold, which is carried as a named gate in
 * docs/freeholds/persistence-rollout-contract.md rather than tuned here; the
 * handshake's second ask waits only inside what the first left of the one
 * housing budget below (freeholdReaskBudgetMs). The local
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
 * three times the permit bound above. In health these two statements are
 * sub-millisecond; a sick database is exactly when the difference binds, and
 * the handshake is the one place a slow read is paid by a player rather than by
 * a sweep.
 *
 * PER STATEMENT, AND IT DOES NOT COVER THE WHOLE TRANSACTION. The combined port
 * (readDurables, in server/freehold_persist_wiring.ts) puts both reads on ONE
 * checked-out client, which is the real saving. But SET LOCAL bounds each
 * statement separately (measured: two 300 ms sleeps under a 400 ms bound both ran,
 * 612 ms elapsed), and BEGIN and SET LOCAL both run BEFORE the lowered bound is
 * in force, so both answer to the pool session default.
 *
 * AND COMMIT ANSWERS TO NEITHER SERVER-SIDE BOUND, which every earlier version
 * of this docblock got wrong in the same direction. Measured on PostgreSQL 16
 * with a deferred constraint trigger putting two seconds of work inside the
 * commit itself: under `SET LOCAL statement_timeout = 300` the COMMIT ran
 * 2,008 ms and COMMITTED. Its only ceiling is the driver's own query_timeout,
 * DB_QUERY_TIMEOUT_MS, measured to reject a COMMIT at its deadline. So the floor
 * on the worst case is 5,000 (DB_POOL_CONNECT_TIMEOUT_MS) + 2 x 15,000
 * (DB_STATEMENT_TIMEOUT_MS, for BEGIN and SET LOCAL) + 2 x 2,000 (the two reads)
 * + 65,000 (DB_QUERY_TIMEOUT_MS, for COMMIT) = 104,000 ms, not the 41,000 this
 * paragraph published, nor the 9,000 or the 19,000 before that.
 *
 * WHICH IS WHY THE WHOLE PRELOAD IS CAPPED, not the statements alone: see
 * FREEHOLD_PERSIST_LOGIN_BUDGET_MS below.
 */
export const FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS = 2_000;

/**
 * THE CAP ON THE WHOLE PRELOAD, which is the gate section 8a of the rollout
 * contract carried open and which the statement bound above narrows without
 * closing.
 *
 * WHAT IT BOUNDS. Every step of a login-path load has a bound of its own (the
 * local admission cap answers at once, the permit wait is 5,000, each read is
 * 2,000) and the SUM of them had none, because the steps the store does not
 * own answer to the pool: a pool checkout, BEGIN, SET LOCAL and a COMMIT that
 * neither server-side timeout covers add up to a measured floor of 104,000 ms.
 * A login that spends that long does not fail: it keeps running, and the socket
 * behind it can die meanwhile. The chain then acquires a character lease and
 * joins anyway, and the mid-handshake death re-check hands the session it just
 * created to socketClosed, leaving a linkdead ghost holding a realm slot and
 * that lease for the whole grace window while the player's every re-login is
 * refused as already in world.
 *
 * WHY IT IS A CONSTANT AND NOT "THE HANDSHAKE'S REMAINING BUDGET", which is how
 * the gate was written and which rests on a premise that is FALSE. AUTH_TIMEOUT_MS
 * (server/ws_auth.ts, 10,000 ms) is cleared synchronously by the first-frame
 * handler BEFORE authenticateWebSocket runs, and that file says so: it bounds
 * upgrade-to-first-frame only, never the handshake's database work. There is no
 * remaining budget to read, so nothing is threaded from the handshake. What is
 * borrowed is the MAGNITUDE: 10,000 ms is the wait the product already treats as
 * the most a connecting player should spend, and a housing read has no claim on
 * more than that. Stated as a deliberate ceiling rather than dressed up as a
 * derivation.
 *
 * WHAT IT COSTS WHEN IT FIRES. The login is NOT refused: refusing a login over a
 * durable housing read reverses a decision this packet has already taken and
 * pinned (server/ws_auth.ts catches that read for exactly this reason, and a
 * test proves a thrown read joins with nothing installed). The PRELOAD is
 * refused instead, with a hold, so the player joins on the sim's default record
 * and no write goes out for that account. The refusal deliberately does NOT
 * touch the store entry: the read it gave up waiting for is still in flight
 * behind a single-flight slot, and letting it finish and fill the entry is
 * strictly better than marking the entry held over a read that then succeeds.
 *
 * ONE BUDGET PER HANDSHAKE, NOT PER ASK. Ruling (b) for the twelfth path asks
 * twice, once before the character lease and again after the character read,
 * and each ask used to arm this whole budget and its own permit wait: up to
 * 20,000 ms of housing per login, the second half inside the lease-held window,
 * past the client's 10,000 ms entry watchdog (src/net/entry_watch.ts), which
 * reopens the linkdead-ghost outcome this cap closed. Found by the hot-path and
 * database reviews of that ruling, 2026-09-26. So the re-ask gets only what the
 * first ask left (freeholdReaskBudgetMs). A re-ask that runs out answers
 * no_budget, a hold, and the join then installs what answerForInstall decides:
 * the loaded entry when there is one, else nothing (write-blocked, loud at the
 * seal, never a loss, since a collected entry owes no work). A remaining budget
 * of zero still lets a loaded entry's replay answer, because the replay settles
 * in microtasks and the deadline is a timer.
 */
export const FREEHOLD_PERSIST_LOGIN_BUDGET_MS = 10_000;

/** What a caller may ask of one preload. `budgetMs` narrows the whole-preload
 *  cap for this call (never widens it: see freeholdPreloadBudgetMs); `reask`
 *  marks the handshake's second ask, so the store can count what it costs. */
export interface FreeholdPreloadOptions {
  readonly budgetMs?: number;
  readonly reask?: boolean;
}

/** The cap one preload runs under: the whole budget when none is asked, the
 *  asked budget when it is smaller, never more than the whole budget, and zero
 *  for a value that is not a finite non-negative number, so a broken caller can
 *  only shorten the wait. */
export function freeholdPreloadBudgetMs(requestedMs: number | undefined): number {
  if (requestedMs === undefined) return FREEHOLD_PERSIST_LOGIN_BUDGET_MS;
  if (!Number.isFinite(requestedMs) || requestedMs <= 0) return 0;
  return Math.min(FREEHOLD_PERSIST_LOGIN_BUDGET_MS, requestedMs);
}

/** The re-ask's share of the handshake's one housing budget: what the first
 *  ask left, so the two asks together never pass it. A negative elapsed time (a
 *  clock that ran backwards) counts as zero and gives the whole budget, never
 *  more; a non-finite one gives none. */
export function freeholdReaskBudgetMs(firstAskMs: number): number {
  if (!Number.isFinite(firstAskMs)) return 0;
  return freeholdPreloadBudgetMs(FREEHOLD_PERSIST_LOGIN_BUDGET_MS - Math.max(0, firstAskMs));
}
