// THE COMPOSITION ROOT for the housing persistence store: the one place that
// binds server/freehold_persist.ts's declared ports to the real pool, the real
// sim and the real background gate. It lives beside the store rather than
// inside it so the store file imports no SQL at all and is defined purely by
// its port surface, which is what lets a Vitest drive the whole lifecycle with
// neither a database nor a GameServer. Moved here from the tail of
// server/freehold_persist.ts. An earlier version of this line claimed the move
// changed nothing in the factory; a reviewer showed it had silently dropped the
// statement bound off the two-port fallback, which is restored below.
import { FREEHOLD_TIER_IDS } from '../src/sim/content/freehold';
import { normalizeFreehold } from '../src/sim/freehold/persisted';
import { FREEHOLD_VISIT_POLICIES } from '../src/sim/freehold/types';
import type { SimContext } from '../src/sim/sim_context';
import { pool, runWithStatementTimeout } from './db';
import {
  type FreeholdQueryable,
  freeholdForAccount,
  mintFreeholdPlotId,
  upsertFreehold,
} from './freehold_db';
import { loadFreeholdHearth } from './freehold_hearth_db';
import { readLoginDurables } from './freehold_hearth_load';
import { freeholdLivenessPorts } from './freehold_liveness';
import {
  createFreeholdPersistStore,
  FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS,
  type FreeholdPersistStore,
} from './freehold_persist';
import { createKeyedSerialWriter } from './serial_writer';

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
    // The two-port fallback: unused on THIS host, because readDurables below is
    // bound and the store prefers it, but still BOUNDED. Extracting this file
    // dropped these two wrappers and left the pair on the pool's 15,000 ms
    // session default; that was a regression, not a decision, and a reviewer
    // caught the header claiming otherwise. Kept because the ports are the
    // store's declared surface and a host without a transaction seam still
    // needs them. The WHOLE preload's own cap sits above both shapes, in the
    // store (FREEHOLD_PERSIST_LOGIN_BUDGET_MS).
    readRow: (accountId, maxOwnedBytes) =>
      runWithStatementTimeout(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS, (query) =>
        freeholdForAccount({ query }, accountId, maxOwnedBytes),
      ),
    readHearth: (accountId) =>
      runWithStatementTimeout(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS, (query) =>
        loadFreeholdHearth({ query }, accountId),
      ),
    // BOTH LOGIN READS, BOUNDED, ON ONE CHECKED-OUT CLIENT. The bound needs the
    // one seam that can lower the pool's own statement timeout, and that seam is
    // a transaction; wrapping each read separately bought the right bound at
    // four times the network cost, on the one path where a player is waiting.
    // Eight round trips and two clients held across four statements apiece
    // became five and one. The store's permit bound is deliberately short and
    // would otherwise sit in front of a statement three times longer than
    // itself; see FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS for the residual
    // this still does not close.
    //
    // The ROW read may throw: loadOnce turns that into a hold. If it does, this
    // transaction rolls back and the clock is never read, which is the same cold
    // clock the caller would have taken anyway.
    //
    // THE GUARD IS AROUND THE WHOLE TRANSACTION, not around the clock read, and
    // that distinction is the fix for a real hole. An inner `.catch` sees only
    // loadFreeholdHearth's own promise; it cannot see the COMMIT that
    // runWithStatementTimeout issues afterwards. A clock fault that leaves the
    // connection USABLE (a relation error, a statement timeout) lets COMMIT
    // answer a ROLLBACK tag and the row lands. A clock fault that KILLS the
    // connection (backend crash, restart, dropped socket) makes COMMIT reject,
    // the helper rethrow, and the port reject, which loadOnce turns into a
    // write-blocking hold on the house for a fault in the clock. The two-port
    // pair answers that same fault with a cold clock and a normal login, and
    // which port a host binds must not decide it. So the row is captured as it
    // is read, and any later rejection with a row in hand is answered as a
    // thrown CLOCK rather than a failed row.
    readDurables: (accountId, maxOwnedBytes) =>
      readLoginDurables<FreeholdQueryable>(
        (run) =>
          runWithStatementTimeout(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS, (query) =>
            run({ query }),
          ),
        (db) => freeholdForAccount(db, accountId, maxOwnedBytes),
        (db) => loadFreeholdHearth(db, accountId),
      ),
    writeRow: (input) => upsertFreehold(pool, input),
    // ONE declaration of the realm's identity sets, consumed by BOTH sides.
    // Declaring them twice is how a load that refuses a tier and a save that
    // accepts it come to disagree.
    normalize: (raw) => normalizeFreehold(raw, REALM_IDENTITY_SETS),
    identitySets: () => REALM_IDENTITY_SETS,
    // All four liveness reads over the ONE live map, through the function the
    // store's suite binds too, so the two cannot model different sims.
    ...freeholdLivenessPorts(() => deps.sim.ctx),
    enabled: () => deps.sim.ctx.freeholdsEnabled,
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
