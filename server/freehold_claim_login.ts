// THE LOGIN READ, WITH THE GLOBAL CLAIM (07a; the touch-set manifest's P4). The
// store's combined login port (readDurables) binds here on a realm that
// claims: one bounded transaction that proves this realm may serve the plot
// BEFORE it reads the row it will serve.
//
// THE ORDER IS THE CONTRACT:
// 1. The Hearth clock FIRST. A clock fault aborts the transaction, and had the
//    claim come first that abort would have rolled the claim back silently
//    while this realm believed it held it. On a fault the transaction is
//    rolled back and a SECOND one (a fresh checkout, since the fault may have
//    killed the connection) runs the plot half with the clock answered cold:
//    07's asymmetry kept, the plot fails closed and the clock fails open.
// 2. The plot id, read without a lock. No row at the primary slot means there
//    is nothing to claim yet (the first insert claims it, P3), and the ordinary
//    read answers `absent` or `unadmitted` as before.
// 3. A LOCK-FREE busy pre-check: another holder's LIVE claim answers
//    `claim_busy` at once, before the upsert (which would lock that holder's
//    row even when it refused) and before the row read (a busy realm reads
//    nothing it may not serve).
// 4. The acquire upsert, then 07's row read, unchanged.
// 5. COMMIT with its tag checked. Only a proved COMMIT records the claim; a
//    lost answer leaves it unrecorded (it then expires after the TTL), and the
//    read is answered as THROWN so the store holds the plot rather than serving
//    a row whose claim it cannot prove.
//
// A lock or statement timeout on the acquire (55P03, 57014) is contention on
// the claim row, not a fault in the plot: it answers `claim_busy`, the
// repairable hold, rather than the generic read hold.
import { acquireFreeholdClaim } from './freehold_claim_db';
import type { FreeholdClaimRegistry } from './freehold_claim_registry';
import type { FreeholdQueryable, FreeholdRowLoad } from './freehold_db';
import type { FreeholdHearthLoad } from './freehold_hearth_db';
import type { FreeholdHearthAnswer } from './freehold_persist_types';
import { type FreeholdTxPool, runFreeholdTransaction } from './freehold_tx';

/** The login transaction's bounds: 07's 2 s statement bound, a lock bound under
 *  it so a held claim row answers 55P03 (busy) before the statement bound, an
 *  idle bound, and the store's whole-login budget as the wall. */
export const FREEHOLD_CLAIM_LOGIN_BOUNDS = Object.freeze({
  operation: 'freehold login read',
  statementMs: 2_000,
  lockMs: 1_000,
  idleMs: 2_000,
  wallMs: 10_000,
});

export const FREEHOLD_PRIMARY_PLOT_ID_SQL =
  'SELECT plot_id FROM account_freeholds WHERE account_id = $1 AND plot_index = 0';

/** Carries the claim-busy answer out of the transaction (so it commits nothing
 *  further and the row is never read). */
class ClaimBusy extends Error {
  constructor(readonly plotId: string) {
    super('freehold claim busy');
  }
}

const contentionCode = (error: unknown): boolean => {
  const code = (error as { code?: unknown } | null)?.code;
  return code === '55P03' || code === '57014';
};

export interface FreeholdClaimLoginDeps {
  readonly pool: FreeholdTxPool;
  readonly registry: FreeholdClaimRegistry;
  readonly holder: string;
  readonly realm: string;
  readonly ttlSeconds: number;
  readRow(db: FreeholdQueryable): Promise<FreeholdRowLoad>;
  readHearth(db: FreeholdQueryable): Promise<FreeholdHearthLoad>;
  nowMs(): number;
  /** This realm just became the plot's proved authority: the operation
   *  recovery pass for the account is scheduled here (fire and forget). */
  onClaimed?(accountId: number): void;
}

export async function readClaimedLoginDurables(
  deps: FreeholdClaimLoginDeps,
  accountId: number,
): Promise<{ row: FreeholdRowLoad; hearth: FreeholdHearthAnswer }> {
  const { registry } = deps;
  let acquired: { plotId: string; generation: string; takeover: boolean } | null = null;
  const plotHalf = async (db: FreeholdQueryable): Promise<FreeholdRowLoad> => {
    const primary = await db.query(FREEHOLD_PRIMARY_PLOT_ID_SQL, [accountId]);
    const plotId = (primary.rows?.[0] as { plot_id?: unknown } | undefined)?.plot_id;
    if (typeof plotId === 'string') {
      let claim: Awaited<ReturnType<typeof acquireFreeholdClaim>>;
      try {
        claim = await acquireFreeholdClaim(db, {
          plotId,
          accountId,
          realm: deps.realm,
          holder: deps.holder,
          ttlSeconds: deps.ttlSeconds,
        });
      } catch (error) {
        if (contentionCode(error)) throw new ClaimBusy(plotId);
        throw error;
      }
      if (claim.kind === 'busy') throw new ClaimBusy(plotId);
      acquired = { plotId, generation: claim.generation, takeover: claim.takeover };
    }
    return deps.readRow(db);
  };
  const busy = (plotId: string): FreeholdRowLoad => {
    registry.counters.busy++;
    return { kind: 'claim_busy', plotIndex: 0, plotId };
  };
  const record = () => {
    if (acquired === null) return;
    registry.record({
      plotId: acquired.plotId,
      accountId,
      generation: acquired.generation,
      acquiredAtMs: deps.nowMs(),
    });
    registry.counters.acquired++;
    if (acquired.takeover) registry.counters.takeovers++;
    deps.onClaimed?.(accountId);
  };

  let hearth: FreeholdHearthAnswer | undefined;
  try {
    const row = await runFreeholdTransaction(deps.pool, FREEHOLD_CLAIM_LOGIN_BOUNDS, async (tx) => {
      try {
        hearth = await deps.readHearth(tx);
      } catch (error) {
        hearth = { kind: 'threw', error };
        throw error;
      }
      return plotHalf(tx);
    });
    record();
    return { row, hearth: hearth as FreeholdHearthAnswer };
  } catch (error) {
    if (error instanceof ClaimBusy) {
      return { row: busy(error.plotId), hearth: hearth ?? { kind: 'threw', error } };
    }
    // A clock fault: the plot half again, alone, with the clock answered cold.
    if (hearth !== undefined && hearth.kind === 'threw' && acquired === null) {
      const clock = hearth;
      try {
        const row = await runFreeholdTransaction(deps.pool, FREEHOLD_CLAIM_LOGIN_BOUNDS, plotHalf);
        record();
        return { row, hearth: clock };
      } catch (retryError) {
        if (retryError instanceof ClaimBusy) return { row: busy(retryError.plotId), hearth: clock };
        throw retryError;
      }
    }
    // The plot half failed, or COMMIT could not be proved: the row is held.
    throw error;
  }
}
