// THE LOGIN PATH'S DURABLE READ POLICY, in one small named module: the clock
// read turned into the pair the store installs (a ready time and a revision, or
// a cold clock), and the COMBINED read that puts both login statements on one
// transaction. Extracted from server/freehold_persist.ts
// because none of it needs the store's private state, only somewhere to log, and
// because the clock's failure policy is the deliberate ASYMMETRY that file argues
// at length: the plot fails CLOSED (an unreadable row holds the account and the
// row is left alone) while the clock fails OPEN (an unreadable clock starts cold
// and the login proceeds). Keeping that policy in one small named module is what
// stops the next reader restoring symmetry by accident.

import type { FreeholdRowLoad } from './freehold_db';
import type { FreeholdHearthLoad } from './freehold_hearth_db';
import type { FreeholdHearthAnswer } from './freehold_persist';

/** The absent clock's revision, spelled through a constant on both sides: the
 *  plot fence and the hearth counter are different counters that share a value,
 *  and a bare zero is how a later reader comes to think they are one. */
export const ABSENT_HEARTH_REVISION = '0';

/** What the store installs for one account: a forward-only ready time and the
 *  revision it was read at. */
export interface FreeholdHearthReading {
  readonly readyAtMs: number;
  readonly revision: string;
}

/** The cold clock, and the ONE place its shape is written. */
export const COLD_HEARTH: FreeholdHearthReading = {
  readyAtMs: 0,
  revision: ABSENT_HEARTH_REVISION,
};

/**
 * A durable clock load, normalized. A `state` load answers its own numbers, with
 * a non-finite or non-positive ready time floored to zero rather than carried
 * onward as NaN. Every other kind answers the cold clock, and an `unsupported`
 * one says so, because that kind means a row EXISTS in a shape this build cannot
 * read: silently starting cold there hides a schema the realm has outgrown.
 *
 * COLD IS READY, and that is the fail-open half of this module's asymmetry
 * rather than an oversight. The sibling reader's docblock once claimed the
 * 'unsupported' kind is what stops a damaged row granting a trip; it is not,
 * and both files now say so. The kind buys the WARN. Refusing the trip belongs
 * to the 07a admission participant, which is the caller that has a trip to
 * refuse; nothing writes the row in this release, so nothing acts on it yet.
 */
export function normalizeHearthLoad(
  load: FreeholdHearthLoad,
  warn: (message: string) => void,
): FreeholdHearthReading {
  if (load.kind === 'state') {
    const readyAtMs = Number(load.state.readyAtMs);
    return {
      readyAtMs: Number.isFinite(readyAtMs) && readyAtMs > 0 ? readyAtMs : 0,
      revision: load.state.revision,
    };
  }
  if (load.kind === 'unsupported') {
    warn(`freehold hearth clock unsupported (${load.detail}); the cooldown starts cold`);
  }
  return COLD_HEARTH;
}

/**
 * BOTH LOGIN READS INSIDE ONE TRANSACTION, as a function a Vitest can drive.
 *
 * It lives here rather than inside the composition root because the composition
 * root binds the real pool at module scope, so nothing imports it and nothing
 * executes its closures: a mutant that deleted the clock swallow, which is the
 * one property that makes a shared transaction safe, left the whole suite green
 * and `tsc` silent. The BINDING stays there; the POLICY is here, where a case
 * can reject the transaction and read what comes back.
 *
 * THE POLICY, and it is the asymmetry this module exists to keep in one place.
 * The plot fails CLOSED: a rejection with NO row in hand is rethrown, so the
 * caller holds the account rather than handing it a default over a row this
 * host could not read. The clock fails OPEN: any clock fault answers a cold
 * clock and the login proceeds.
 *
 * BOTH HALVES ARE CAPTURED AS THEY ARE READ. The guard has to be around the
 * WHOLE transaction, because an inner catch on the clock's own promise cannot
 * see the COMMIT the transaction helper issues afterwards, and a clock fault
 * that KILLS the connection makes that COMMIT reject. Capturing only the row
 * then threw away a clock both statements had already answered and substituted
 * the cold one, which reads as READY: the store remembers that zero on the
 * entry and replays it to every later character of the account for the rest of
 * the session without reading again. An UNREADABLE clock starts cold; a clock
 * that was read does not.
 */
export async function readLoginDurables<Q>(
  inTransaction: <T>(run: (query: Q) => Promise<T>) => Promise<T>,
  readRow: (query: Q) => Promise<FreeholdRowLoad>,
  readHearth: (query: Q) => Promise<FreeholdHearthLoad>,
): Promise<{ row: FreeholdRowLoad; hearth: FreeholdHearthAnswer }> {
  let row: FreeholdRowLoad | undefined;
  let hearth: FreeholdHearthAnswer | undefined;
  try {
    return await inTransaction(async (query) => {
      row = await readRow(query);
      hearth = await readHearth(query).catch((error: unknown) => ({
        kind: 'threw' as const,
        error,
      }));
      return { row, hearth };
    });
  } catch (error) {
    if (row === undefined) throw error;
    return { row, hearth: hearth ?? { kind: 'threw' as const, error } };
  }
}
