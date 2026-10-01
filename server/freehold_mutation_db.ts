// The housing mutation boundary's OWN statements (server/freehold_mutation.ts;
// docs/freeholds/mutation-touch-set-manifest.md P1 and P9): the hook's explicit
// statement bound and the verify's wait on the character row. Every other
// statement the boundary issues belongs to its participants' *_db.ts modules,
// so the boundary module itself carries no SQL (the source guard in
// tests/server/freehold_mutation.test.ts, 'the housing authority boundary').
import type { FreeholdQueryable } from './freehold_db';

/** The wait (P9 step 1): FOR SHARE conflicts with the hung save's FOR NO KEY
 *  UPDATE on the character row, so it returns only once that transaction
 *  resolved, and its own transaction commits at once so it holds the row for
 *  one round trip. */
export const FREEHOLD_VERIFY_WAIT_SQL = 'SELECT 1 FROM characters WHERE id = $1 FOR SHARE';

export async function waitOutCharacterRowOnClient(
  tx: FreeholdQueryable,
  characterId: number,
): Promise<void> {
  await tx.query(FREEHOLD_VERIFY_WAIT_SQL, [characterId]);
}

/** The hook's statement bound, for the hook's statements whatever bound the
 *  save opened with. The value is interpolated (SET LOCAL takes no bind
 *  parameter), so it is refused unless it is a positive safe integer of ms. */
export async function boundFreeholdHookStatementsOnClient(
  tx: FreeholdQueryable,
  statementTimeoutMs: number,
): Promise<void> {
  if (!Number.isSafeInteger(statementTimeoutMs) || statementTimeoutMs <= 0) {
    throw new RangeError('freehold hook statement timeout must be a positive integer of ms');
  }
  await tx.query(`SET LOCAL statement_timeout = ${statementTimeoutMs}`);
}
