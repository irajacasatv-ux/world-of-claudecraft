// THE ACCOUNT EXPORT'S HOUSING SECTION (exportAccountData in server/db.ts), as
// ONE loader so db.ts carries one line for every housing table there is.
// Housing lives in its own normalized tables that the characters.state
// projector cannot reach, and most of them are keep-forever, so this export is
// the only readback an owner has.
//
// EVERY READ IS AN ALLOWLIST AND EVERY KEEP-FOREVER READ IS BOUNDED (the
// touch-set manifest's section 9): the claim holder (a per-boot process id), the
// fencing generation, the write and advance tokens, the operation fingerprint
// and the fence generation are server internals and never leave the server;
// operation ids appear here, and only here, because they are the owner's own
// records. The keys keep 07's `freeholds` and `freeholdHearth` and add three.
import type { Pool } from 'pg';
import { freeholdClaimsForExport } from './freehold_claim_db';
import { freeholdsForExport } from './freehold_db';
import { freeholdHearthForExport } from './freehold_hearth_db';
import { freeholdOperationsForExport } from './freehold_operation_db';

export interface FreeholdAccountExport {
  readonly freeholds: Awaited<ReturnType<typeof freeholdsForExport>>;
  readonly freeholdHearth: Awaited<ReturnType<typeof freeholdHearthForExport>>;
  readonly freeholdClaims: unknown[];
  readonly freeholdOperations: unknown[];
  readonly freeholdOperationReceipts: unknown[];
}

export async function freeholdAccountExport(
  pool: Pool,
  accountId: number,
): Promise<FreeholdAccountExport> {
  const freeholds = await freeholdsForExport(pool, accountId);
  const freeholdHearth = await freeholdHearthForExport(pool, accountId);
  const freeholdClaims = await freeholdClaimsForExport(pool, accountId);
  const operations = await freeholdOperationsForExport(pool, accountId);
  return {
    freeholds,
    freeholdHearth,
    freeholdClaims,
    freeholdOperations: operations.intents,
    freeholdOperationReceipts: operations.receipts,
  };
}
