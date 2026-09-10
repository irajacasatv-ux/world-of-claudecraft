// THE COMPOSITION ROOT for the housing persistence store: the one place that
// binds server/freehold_persist.ts's declared ports to the real pool, the real
// sim and the real background gate. It lives beside the store rather than
// inside it so the store file imports no SQL at all and is defined purely by
// its port surface, which is what lets a Vitest drive the whole lifecycle with
// neither a database nor a GameServer. Moved here WHOLE from the tail of
// server/freehold_persist.ts; nothing in the factory changed.
import { FREEHOLD_TIER_IDS } from '../src/sim/content/freehold';
import { normalizeFreehold, persistedFreeholdFromState } from '../src/sim/freehold/persisted';
import { serializeFreehold } from '../src/sim/freehold/state';
import { FREEHOLD_VISIT_POLICIES } from '../src/sim/freehold/types';
import type { SimContext } from '../src/sim/sim_context';
import { pool, runWithStatementTimeout } from './db';
import { freeholdForAccount, mintFreeholdPlotId, upsertFreehold } from './freehold_db';
import { loadFreeholdHearth } from './freehold_hearth_db';
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
    // The two-port fallback, UNBOUNDED and unused on this host: the pair below
    // is what the store actually calls. Kept because the ports are the store's
    // declared surface and a host without a transaction seam still needs them.
    readRow: (accountId, maxOwnedBytes) => freeholdForAccount(pool, accountId, maxOwnedBytes),
    readHearth: (accountId) => loadFreeholdHearth(pool, accountId),
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
    readDurables: (accountId, maxOwnedBytes) =>
      runWithStatementTimeout(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS, async (query) => ({
        row: await freeholdForAccount({ query }, accountId, maxOwnedBytes),
        // CAUGHT, not propagated: a rejection here would roll the transaction
        // back and take the row with it, turning a clock fault into a plot hold.
        // The store answers a cold clock for a thrown read either way, and this
        // keeps that identical to the unshared shape.
        hearth: await loadFreeholdHearth({ query }, accountId).catch((error: unknown) => ({
          kind: 'threw' as const,
          error,
        })),
      })),
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
