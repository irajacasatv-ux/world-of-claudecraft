// The ONE online authority for the Hearth Key travel cooldown (C01, refining
// D67). The clock belongs to the ACCOUNT: one row per account, keyed and
// foreign-keyed on accounts(id). Owning the Hearth Key item is inventory
// usability and nothing else, so no plot row, no character blob and no wire
// mirror may ever carry this cooldown. That is not tidiness. A plot is
// transferable and a character is deletable, so a cooldown living on either
// would let an account buy, sell or delete its way to a fresh ready key, and
// the second freehold (D67) shares this single row precisely so a second home
// cannot double the travel budget.
//
// The client's freeholdKeyReadyAtMs mirror is a committed UI value and never an
// authorization. The rule this module exists to serve is that every accepted
// remote entry re-reads and advances this row inside the entry transaction,
// under the account participant lock, so a cached or forged client value cannot
// buy a trip.
//
// STATED AS THE RULE, NOT AS SHIPPED BEHAVIOR, because it is not performed yet.
// `advanceFreeholdHearthOnClient` below has ZERO production callers in this
// release: the realm admission participant that would call it is the 07a work,
// and until then `freeholdKeyAdmission` refuses outright rather than consulting
// this row. So nothing writes account_freehold_hearth in a shipped realm,
// `loadFreeholdHearth` answers `absent` for every account, and the isolated
// per-Sim clock in src/sim/freehold/hearth_key.ts is the only cooldown a player
// meets. The advance is written, proved against real PostgreSQL and reachable
// by nothing. It is here rather than in 07a because the capability the rollout
// contract names is the whole PAIR: a release that reads the clock but cannot
// advance it is not capable, and enabling housing on one would hand out a free
// travel at every relogin.
//
// TWO INVARIANTS a future reader must not break WHEN THAT CALLER LANDS:
//   1. ONE clock reading per accepted entry, taken from the DATABASE, after
//      the account participant lock. now() is the transaction timestamp on
//      purpose: two statements inside one accepted entry can never disagree
//      about when it happened, and no process clock enters the decision.
//   2. An accepted advance never DECREASES ready_at_ms or revision. GREATEST
//      plus a bare `revision + 1` are that guarantee in the statement itself,
//      so a regressed database clock can only make the key later, never
//      earlier and never eligible while it is unready.
//
// Refusals, an already-home no-op and the physical door do not advance the
// row: only an ACCEPTED remote entry does, and the advance commits with that
// entry or not at all (this module never opens or closes a transaction).
//
// Both counters are BIGINT and cross into TypeScript as decimal TEXT, never as
// a JS number: an epoch-milliseconds value plus a cooldown is comfortably
// inside 2^53 today, but every comparison and every sum here is BigInt so the
// module cannot silently start rounding if that ever stops being true.
import type { Pool } from 'pg';
import type { FreeholdQueryable } from './freehold_db';

/** Absent means READY, with the zero revision: an account that has never
 *  travelled has no row, and lazily writing one from a plain read would turn
 *  every status poll into a write. The one writer is the entry transaction. */
export const ABSENT_FREEHOLD_HEARTH: FreeholdHearthState = { readyAtMs: '0', revision: '0' };

/** A decimal, non-negative, canonically formatted BIGINT as PostgreSQL renders
 *  it. Leading zeros, a sign, or a float rendering means the column is not what
 *  this module believes it is, which is 'unsupported', never a usable value. */
const NON_NEGATIVE_BIGINT_TEXT = /^(0|[1-9][0-9]*)$/;

const bigintText = (value: unknown): string | null =>
  typeof value === 'string' && NON_NEGATIVE_BIGINT_TEXT.test(value) ? value : null;

/**
 * Idempotent DDL, applied by ensureSchema (server/db.ts) inside the boot
 * advisory-lock transaction. Parameterized on the schema so the real-PostgreSQL
 * suite can install it in a private schema; the identifier guard and the quoted
 * placeholder substitution are storagePurchaseSchema's, unchanged.
 *
 * Deliberately WITHOUT a SET LOCAL search_path ceremony, matching
 * server/freehold_db.ts: this fragment defines no function and no trigger, so
 * it needs no fixed execution path, and ensureSchema runs every fragment on ONE
 * client inside ONE transaction where a SET LOCAL search_path would leak into
 * every later fragment until explicitly replayed back. Qualifying the created
 * object and leaving the GUC alone is the smaller blast radius. `accounts`
 * stays unqualified for the same reason it does in maps_db.ts: the foreign key
 * must resolve through the applying connection's own search_path.
 */
export function freeholdHearthSchema(schemaName = 'public'): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(schemaName)) {
    throw new Error('freehold hearth schema must be a simple lowercase identifier');
  }
  const schema = `"${schemaName}"`;
  return `
-- The shared-account Hearth Key travel cooldown, one row per account.
-- account_id is BOTH the primary key and the foreign key, so the account
-- delete cascade is already index-backed and a second index would be dead
-- weight on a table that is only ever read and updated by exact key.
--
-- KEEP FOREVER: this table is deliberately EXEMPT from the retention sweep
-- (server/retention_sweep.ts) and has no age column to sweep on. Pruning an
-- idle account's row is not reclaiming garbage, it is handing every character
-- on that account a free ready key, which is the exact bypass the account-level
-- clock exists to close. The table is bounded by the account table itself:
-- at most one row per account, removed only when the account is.
CREATE TABLE IF NOT EXISTS "__woc_freehold_hearth_schema__".account_freehold_hearth (
  account_id INT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  ready_at_ms BIGINT NOT NULL DEFAULT 0,
  revision BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_freehold_hearth_ready_nonnegative CHECK (ready_at_ms >= 0),
  CONSTRAINT account_freehold_hearth_revision_nonnegative CHECK (revision >= 0)
);

`.replaceAll('"__woc_freehold_hearth_schema__"', schema);
}

export const FREEHOLD_HEARTH_SCHEMA = freeholdHearthSchema();

/** The durable cooldown, both counters as decimal BIGINT text. */
export interface FreeholdHearthState {
  readonly readyAtMs: string;
  readonly revision: string;
}

export type FreeholdHearthLoad =
  | { readonly kind: 'absent' }
  | { readonly kind: 'state'; readonly state: FreeholdHearthState }
  | { readonly kind: 'unsupported'; readonly detail: string };

/** One indexed primary-key read, and a READ ONLY one: a missing row is
 *  'absent' (ABSENT_FREEHOLD_HEARTH, ready at revision zero) and is NEVER
 *  created here. A row whose counters do not read back as non-negative BIGINT
 *  text is 'unsupported', never quietly reported as absence, because absence
 *  means ready and a damaged row must not grant a trip. */
export async function loadFreeholdHearth(
  db: FreeholdQueryable,
  accountId: number,
): Promise<FreeholdHearthLoad> {
  const res = await db.query(
    `SELECT ready_at_ms::text AS ready_at_ms, revision::text AS revision
       FROM account_freehold_hearth
      WHERE account_id = $1`,
    [accountId],
  );
  const row = res.rows?.[0];
  if (row === undefined) return { kind: 'absent' };
  const readyAtMs = bigintText(row.ready_at_ms);
  const revision = bigintText(row.revision);
  if (readyAtMs === null || revision === null) {
    return {
      kind: 'unsupported',
      // CLASSIFIES, never identifies. Every detail on this module's refusals is
      // logged verbatim by the persistence store's warn port, and that channel
      // holds the same identity-free rule as the counters beside it: an
      // operator dashboard is entitled to know WHAT refused, not WHOSE.
      detail: 'hearth counters are not non-negative bigint text',
    };
  }
  return { kind: 'state', state: { readyAtMs, revision } };
}

export type FreeholdHearthAdvance =
  | {
      readonly kind: 'advanced';
      readonly readyAtMs: string;
      readonly revision: string;
      readonly nowMs: string;
    }
  | {
      readonly kind: 'cooldown';
      readonly readyAtMs: string;
      readonly revision: string;
      readonly nowMs: string;
    }
  | { readonly kind: 'unsupported'; readonly detail: string };

/** Step 1. The account participant, taken FIRST so the epoch in step 3 is read
 *  under it and two entries on one account cannot both observe a ready key.
 *  FOR KEY SHARE, not FOR UPDATE: a concurrent character save takes FOR KEY
 *  SHARE on this same parent row, and FOR UPDATE here would block that save
 *  into its own lock timeout (the measured character_delete_db.ts finding).
 *  Two hearth entries still serialize, because KEY SHARE is not the lock that
 *  orders them: the FOR UPDATE row lock in step 3 is. */
export const FREEHOLD_HEARTH_ACCOUNT_LOCK_SQL =
  'SELECT id FROM accounts WHERE id = $1 FOR KEY SHARE';

/** Step 2. Lazy, conflict-safe first-use initialization, and it lives HERE, in
 *  the admitted entry transaction, rather than in loadFreeholdHearth: a plain
 *  read must never write. */
export const FREEHOLD_HEARTH_INIT_SQL =
  'INSERT INTO account_freehold_hearth (account_id) VALUES ($1) ON CONFLICT (account_id) DO NOTHING';

/** Step 3. The counters and the ONE authoritative epoch, observed together,
 *  once, after the participant lock, under the row lock that orders concurrent
 *  entries on this account. now() is the transaction clock deliberately. */
export const FREEHOLD_HEARTH_READ_FOR_UPDATE_SQL = `SELECT ready_at_ms::text AS ready_at_ms,
       revision::text AS revision,
       (EXTRACT(EPOCH FROM now()) * 1000)::bigint::text AS now_ms
  FROM account_freehold_hearth
 WHERE account_id = $1
   FOR UPDATE`;

/** Step 5. The monotonicity guarantee, in the statement: GREATEST can only
 *  push ready_at_ms forward and `revision + 1` can only count up, so an
 *  accepted advance under a regressed database clock makes the key later, never
 *  earlier. Exported so the real-PostgreSQL suite drives this exact text with a
 *  now_ms the eligibility guard above could never produce. */
export const FREEHOLD_HEARTH_ADVANCE_SQL = `UPDATE account_freehold_hearth
   SET ready_at_ms = GREATEST(ready_at_ms, $2::bigint + $3::bigint),
       revision = revision + 1,
       updated_at = now()
 WHERE account_id = $1
 RETURNING ready_at_ms::text AS ready_at_ms, revision::text AS revision`;

/**
 * Check and advance the account's Hearth cooldown INSIDE the caller's already
 * open transaction, on the caller's client. It never issues BEGIN, COMMIT or
 * ROLLBACK, never sleeps and never retries: the caller owns the transaction,
 * its timeouts and its retry policy, and the advance commits with the accepted
 * entry or disappears with it.
 *
 * The statement order IS the contract: account participant lock, conflict-safe
 * initialization, locking read of the counters plus the single epoch, then
 * either a refusal that writes NOTHING or the monotone update.
 */
export async function advanceFreeholdHearthOnClient(
  client: FreeholdQueryable,
  accountId: number,
  cooldownMs: number,
): Promise<FreeholdHearthAdvance> {
  if (!Number.isSafeInteger(cooldownMs) || cooldownMs < 0) {
    return {
      kind: 'unsupported',
      detail: `hearth cooldown ${String(cooldownMs)} is not a non-negative safe integer`,
    };
  }
  const account = await client.query(FREEHOLD_HEARTH_ACCOUNT_LOCK_SQL, [accountId]);
  if ((account.rows?.length ?? 0) === 0) {
    return { kind: 'unsupported', detail: 'the account row is absent' };
  }
  await client.query(FREEHOLD_HEARTH_INIT_SQL, [accountId]);
  const read = await client.query(FREEHOLD_HEARTH_READ_FOR_UPDATE_SQL, [accountId]);
  const row = read.rows?.[0];
  if (row === undefined) {
    return { kind: 'unsupported', detail: 'the hearth row vanished under lock' };
  }
  const readyAtMs = bigintText(row.ready_at_ms);
  const revision = bigintText(row.revision);
  const nowMs = bigintText(row.now_ms);
  if (readyAtMs === null || revision === null || nowMs === null) {
    return {
      kind: 'unsupported',
      detail: 'the hearth read is not non-negative bigint text',
    };
  }
  // BigInt, never Number: the comparison that decides a trip must not depend
  // on a float that happens to be exact today.
  if (BigInt(nowMs) < BigInt(readyAtMs)) {
    return { kind: 'cooldown', readyAtMs, revision, nowMs };
  }
  const advanced = await client.query(FREEHOLD_HEARTH_ADVANCE_SQL, [
    accountId,
    nowMs,
    String(cooldownMs),
  ]);
  const updated = advanced.rows?.[0];
  const nextReadyAtMs = bigintText(updated?.ready_at_ms);
  const nextRevision = bigintText(updated?.revision);
  if (nextReadyAtMs === null || nextRevision === null) {
    return {
      kind: 'unsupported',
      detail: 'the hearth advance returned no usable row',
    };
  }
  return { kind: 'advanced', readyAtMs: nextReadyAtMs, revision: nextRevision, nowMs };
}

/** The subject-access read (exportAccountData): the account's one cooldown row,
 *  or null when it has never travelled. Counters ship as text for the same
 *  reason they are read as text everywhere else here. */
export async function freeholdHearthForExport(
  db: Pool,
  accountId: number,
): Promise<Record<string, unknown> | null> {
  const res = await db.query(
    `SELECT ready_at_ms::text AS ready_at_ms, revision::text AS revision, updated_at
       FROM account_freehold_hearth
      WHERE account_id = $1`,
    [accountId],
  );
  return res.rows[0] ?? null;
}
