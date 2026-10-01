// THE GLOBAL PLOT CLAIM: one authoritative realm process per plot, proved by a
// database lease plus a monotonically increasing fencing GENERATION per opaque
// plot id (07a deliverable 1; docs/freeholds/mutation-touch-set-manifest.md P2
// to P6). Every realm on one database shares these rows, so a second realm of
// one account is answered `busy` instead of being silently write-blocked (the
// rollout contract's R2), and a holder that crashed stops renewing, expires,
// and is fenced by the next claimant's newer generation: its late writes match
// no row.
//
// THE LEASE POLICY IS THE CHARACTER LEASE'S, reused rather than guessed: the
// same LEASE_TTL_SECONDS, the same per-boot PROCESS_LEASE_HOLDER, the same
// expiry-or-same-holder steal arms, and the renewer rides the autosave cadence
// beside heartbeatCharacterLeases. There is NO same-account arm: an account
// alive on another realm keeps its home there until that realm lets go.
//
// THE FENCE IS (holder, generation), compared IN THE STATEMENT that locks the
// row, never check-then-write. Expiry decides only when another realm may TAKE
// the claim; a holder whose lease lapsed with nobody taking it may still write,
// because nobody else can have. A release keeps the row, so a generation never
// restarts.
//
// Time is clock_timestamp(), never now(): now() is the transaction START, so a
// login that began before a concurrent release committed would read the
// released row as live and refuse.
//
// KEEP FOREVER, deliberately exempt from the retention sweep: one row per plot
// id ever claimed, cascading with its account, so it is bounded by the plots.
import { randomBytes } from 'node:crypto';
import type { FreeholdQueryable } from './freehold_db';

/** The per-attempt write token: 16 random bytes as hex, one per write. */
export const FREEHOLD_WRITE_TOKEN_RE = /^[0-9a-f]{32}$/;

export function mintFreeholdWriteToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * The claim DDL, applied by ensureSchema immediately after the Hearth fragment.
 * Tables and indexes only, so (like FREEHOLD_SCHEMA) it needs no search_path
 * ceremony; `schemaName` qualifies the created objects for the private-schema
 * suite, and `accounts` resolves through the applying connection's own path.
 */
export function freeholdClaimSchema(schemaName = 'public'): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(schemaName)) {
    throw new Error('freehold claim schema must be a simple lowercase identifier');
  }
  const schema = `"${schemaName}"`;
  return `
-- KEEP FOREVER, and deliberately exempt from the retention sweep
-- (server/retention_sweep.ts): one row per plot id ever claimed, removed only by
-- its account's cascade. A release keeps the row, because the fencing generation
-- must never restart: a fresh row at generation 1 would re-admit a late write
-- from an earlier generation-1 era. account_id is nullable ON PURPOSE (a
-- guild-owned plot arrives later with its own owner column and a num_nonnulls
-- CHECK added NOT VALID); every writer in this release sets it.
CREATE TABLE IF NOT EXISTS "__woc_freehold_claim_schema__".freehold_plot_claims (
  plot_id TEXT PRIMARY KEY,
  account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
  realm TEXT NOT NULL,
  holder TEXT NOT NULL,
  generation BIGINT NOT NULL,
  write_token TEXT,
  acquired_at TIMESTAMPTZ NOT NULL,
  heartbeat_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT freehold_plot_claims_plot_id_charset CHECK (plot_id ~ '^[A-Za-z0-9_:-]{1,64}$'),
  CONSTRAINT freehold_plot_claims_generation_positive CHECK (generation >= 1),
  CONSTRAINT freehold_plot_claims_realm_shape CHECK (realm <> '' AND length(realm) <= 64),
  -- The holder is REALM#uuid (server/character_lease_db.ts): at most 64 + 1 + 36.
  CONSTRAINT freehold_plot_claims_holder_shape CHECK (holder <> '' AND length(holder) <= 128),
  CONSTRAINT freehold_plot_claims_token_shape
    CHECK (write_token IS NULL OR write_token ~ '^[0-9a-f]{32}$')
) WITH (fillfactor = 80);
-- fillfactor 80: the renewer and every plot write rewrite each live row on the
-- autosave cadence, on columns no index covers, so page room keeps those
-- versions on the same page.
-- PROBED FIRST (07a): a no-op CREATE INDEX IF NOT EXISTS still takes the
-- table's SHARE lock and holds it to the boot COMMIT, which would block every
-- other realm's claim writes through this realm's whole boot.
DO $freehold_plot_claims_indexes$
BEGIN
  -- The renewer, the release and the shutdown release select by holder.
  IF to_regclass('"__woc_freehold_claim_schema__".freehold_plot_claims_holder') IS NULL THEN
CREATE INDEX IF NOT EXISTS freehold_plot_claims_holder
  ON "__woc_freehold_claim_schema__".freehold_plot_claims (holder);
  END IF;
  -- The account cascade and the export.
  IF to_regclass('"__woc_freehold_claim_schema__".freehold_plot_claims_account') IS NULL THEN
CREATE INDEX IF NOT EXISTS freehold_plot_claims_account
  ON "__woc_freehold_claim_schema__".freehold_plot_claims (account_id);
  END IF;
END;
$freehold_plot_claims_indexes$;
`.replaceAll('"__woc_freehold_claim_schema__"', schema);
}

export const FREEHOLD_CLAIM_SCHEMA = freeholdClaimSchema();

export interface FreeholdClaimFence {
  readonly plotId: string;
  readonly holder: string;
  /** Exact bigint text, as RETURNING hands it back. */
  readonly generation: string;
}

export type FreeholdClaimAcquire =
  | {
      readonly kind: 'acquired';
      readonly generation: string;
      /** A different holder's expired claim was taken, advancing the fence. */
      readonly takeover: boolean;
    }
  | { readonly kind: 'busy' };

/** A live claim held by ANOTHER holder, read WITHOUT a lock, so a refused alt
 *  never holds the holder's row (ON CONFLICT DO UPDATE locks the conflicting
 *  row even when its WHERE is false). */
export const FREEHOLD_CLAIM_BUSY_SQL = `SELECT 1 FROM freehold_plot_claims
 WHERE plot_id = $1 AND holder <> $2 AND expires_at > clock_timestamp()`;

/** The acquire (manifest P4). ONE clock reading for the three stamps, through
 *  the CTE, so a fresh row's acquired_at equals its heartbeat_at exactly and a
 *  takeover is recognizable in RETURNING (a same-holder re-acquire keeps its
 *  older acquired_at). */
export const FREEHOLD_CLAIM_ACQUIRE_SQL = `WITH t AS (SELECT clock_timestamp() AS at)
INSERT INTO freehold_plot_claims AS c
       (plot_id, account_id, realm, holder, generation, acquired_at, heartbeat_at, expires_at)
SELECT $1, $2, $3, $4, 1, t.at, t.at, t.at + make_interval(secs => $5) FROM t
ON CONFLICT (plot_id) DO UPDATE
   SET realm = EXCLUDED.realm,
       holder = EXCLUDED.holder,
       generation = CASE WHEN c.holder = EXCLUDED.holder THEN c.generation
                         ELSE c.generation + 1 END,
       acquired_at = CASE WHEN c.holder = EXCLUDED.holder THEN c.acquired_at
                          ELSE EXCLUDED.acquired_at END,
       heartbeat_at = EXCLUDED.heartbeat_at,
       expires_at = EXCLUDED.expires_at
 WHERE c.expires_at <= clock_timestamp() OR c.holder = EXCLUDED.holder
RETURNING generation::text AS generation,
          (xmax = 0) AS inserted,
          (acquired_at = heartbeat_at) AS fresh`;

function requireText(name: string, value: string, max: number): string {
  if (typeof value !== 'string' || value === '' || value.length > max) {
    throw new RangeError(`freehold claim ${name} must be a non-empty string of at most ${max}`);
  }
  return value;
}

function requirePlotId(plotId: string): string {
  if (typeof plotId !== 'string' || !/^[A-Za-z0-9_:-]{1,64}$/.test(plotId)) {
    throw new RangeError('freehold claim plot id must match the plot id charset');
  }
  return plotId;
}

function requireTtl(ttlSeconds: number): number {
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new RangeError('freehold claim ttl must be a positive integer of seconds');
  }
  return ttlSeconds;
}

function requireGeneration(generation: string): string {
  if (typeof generation !== 'string' || !/^[1-9][0-9]{0,18}$/.test(generation)) {
    throw new RangeError('freehold claim generation must be positive bigint text');
  }
  return generation;
}

function requireToken(token: string): string {
  if (typeof token !== 'string' || !FREEHOLD_WRITE_TOKEN_RE.test(token)) {
    throw new RangeError('freehold write token must be 32 lowercase hex characters');
  }
  return token;
}

/**
 * Take, keep or refuse the claim on one plot, inside the caller's transaction
 * (the login read). A live foreign claim answers `busy` from the lock-free
 * pre-check; otherwise the upsert takes an expired claim (advancing the
 * generation), re-stamps this holder's own (keeping its generation), or inserts
 * generation 1. The answer is trusted only if the caller's COMMIT proves it
 * (runFreeholdTransaction's tag check).
 */
export async function acquireFreeholdClaim(
  db: FreeholdQueryable,
  input: {
    readonly plotId: string;
    readonly accountId: number;
    readonly realm: string;
    readonly holder: string;
    readonly ttlSeconds: number;
  },
): Promise<FreeholdClaimAcquire> {
  const plotId = requirePlotId(input.plotId);
  if (!Number.isSafeInteger(input.accountId) || input.accountId <= 0) {
    throw new RangeError('freehold claim account id must be a positive safe integer');
  }
  const realm = requireText('realm', input.realm, 64);
  const holder = requireText('holder', input.holder, FREEHOLD_LIVE_HOLDER_MAX);
  const ttl = requireTtl(input.ttlSeconds);
  const live = await db.query(FREEHOLD_CLAIM_BUSY_SQL, [plotId, holder]);
  if ((live.rowCount ?? live.rows?.length ?? 0) > 0) return { kind: 'busy' };
  const res = await db.query(FREEHOLD_CLAIM_ACQUIRE_SQL, [
    plotId,
    input.accountId,
    realm,
    holder,
    ttl,
  ]);
  const row = res.rows?.[0] as { generation?: unknown; inserted?: unknown; fresh?: unknown };
  if (!row) return { kind: 'busy' };
  if (typeof row.generation !== 'string') {
    throw new TypeError('freehold_plot_claims.generation must come back as exact bigint text');
  }
  return {
    kind: 'acquired',
    generation: requireGeneration(row.generation),
    takeover: row.inserted !== true && row.fresh === true,
  };
}

/** G4 for a write (manifest P1 and P2): the fence re-proved and the row locked
 *  in ONE statement whose WHERE is on the row itself, so a lock wait re-checks
 *  the latest version and a takeover that committed during the wait is seen.
 *  It stamps this attempt's token, which is what a later verify reads. */
export const FREEHOLD_CLAIM_FENCE_SQL = `UPDATE freehold_plot_claims
   SET write_token = $4
 WHERE plot_id = $1 AND holder = $2 AND generation = $3::bigint
RETURNING plot_id`;

export async function fenceFreeholdClaimOnClient(
  tx: FreeholdQueryable,
  fence: FreeholdClaimFence,
  writeToken: string,
): Promise<boolean> {
  const res = await tx.query(FREEHOLD_CLAIM_FENCE_SQL, [
    requirePlotId(fence.plotId),
    requireText('holder', fence.holder, FREEHOLD_LIVE_HOLDER_MAX),
    requireGeneration(fence.generation),
    requireToken(writeToken),
  ]);
  return (res.rowCount ?? res.rows?.length ?? 0) === 1;
}

/** The ambiguous-retry arm (manifest P2): lock this holder's row and read the
 *  token the LAST write left. The lock waits for a transaction still holding
 *  the row, so the token read is never the pre-commit version. Null: fenced. */
export const FREEHOLD_CLAIM_TOKEN_LOCK_SQL = `SELECT write_token FROM freehold_plot_claims
 WHERE plot_id = $1 AND holder = $2 AND generation = $3::bigint
   FOR NO KEY UPDATE`;

export async function lockFreeholdClaimTokenOnClient(
  tx: FreeholdQueryable,
  fence: FreeholdClaimFence,
): Promise<{ readonly writeToken: string | null } | null> {
  const res = await tx.query(FREEHOLD_CLAIM_TOKEN_LOCK_SQL, [
    requirePlotId(fence.plotId),
    requireText('holder', fence.holder, FREEHOLD_LIVE_HOLDER_MAX),
    requireGeneration(fence.generation),
  ]);
  const row = res.rows?.[0] as { write_token?: unknown } | undefined;
  if (!row) return null;
  return { writeToken: typeof row.write_token === 'string' ? row.write_token : null };
}

/** The first insert of an absent plot (manifest P3): generation 1 under a
 *  freshly minted id, inside the transaction that inserts the plot row, so a
 *  lost plot-insert race rolls BOTH back. A conflict means the minted id is
 *  already claimed, which only a retry of this realm's own ambiguous insert or
 *  a collision can produce; the caller decides which from the token. */
export const FREEHOLD_CLAIM_INSERT_SQL = `WITH t AS (SELECT clock_timestamp() AS at)
INSERT INTO freehold_plot_claims
       (plot_id, account_id, realm, holder, generation, write_token,
        acquired_at, heartbeat_at, expires_at)
SELECT $1, $2, $3, $4, 1, $5, t.at, t.at, t.at + make_interval(secs => $6) FROM t
ON CONFLICT (plot_id) DO NOTHING
RETURNING plot_id`;

export async function insertFreeholdClaimOnClient(
  tx: FreeholdQueryable,
  input: {
    readonly plotId: string;
    readonly accountId: number;
    readonly realm: string;
    readonly holder: string;
    readonly writeToken: string;
    readonly ttlSeconds: number;
  },
): Promise<boolean> {
  if (!Number.isSafeInteger(input.accountId) || input.accountId <= 0) {
    throw new RangeError('freehold claim account id must be a positive safe integer');
  }
  const res = await tx.query(FREEHOLD_CLAIM_INSERT_SQL, [
    requirePlotId(input.plotId),
    input.accountId,
    requireText('realm', input.realm, 64),
    requireText('holder', input.holder, FREEHOLD_LIVE_HOLDER_MAX),
    requireToken(input.writeToken),
    requireTtl(input.ttlSeconds),
  ]);
  return (res.rowCount ?? res.rows?.length ?? 0) === 1;
}

/** The renewer's two statements (manifest P5), each locking its rows in
 *  ascending plot id through the subselect so two multi-row statements can
 *  never cycle. RETURNING names exactly the claims still held. */
export const FREEHOLD_CLAIM_RENEW_SQL = `UPDATE freehold_plot_claims
   SET heartbeat_at = clock_timestamp(),
       expires_at = clock_timestamp() + make_interval(secs => $2)
 WHERE plot_id IN (
   SELECT plot_id FROM freehold_plot_claims
    WHERE holder = $1 AND plot_id = ANY($3::text[])
    ORDER BY plot_id
      FOR NO KEY UPDATE SKIP LOCKED)
RETURNING plot_id`;

/** The renewer's lock-free follow-up for the ids a chunk did NOT return: a row
 *  SKIP LOCKED passed over (a trip or a write holding it) is still this holder's
 *  and only missed one heartbeat; a row another holder now owns was taken. */
export const FREEHOLD_CLAIM_STILL_HELD_SQL = `SELECT plot_id FROM freehold_plot_claims
 WHERE holder = $1 AND plot_id = ANY($2::text[])`;

export async function freeholdClaimsStillHeldOnClient(
  tx: FreeholdQueryable,
  holder: string,
  plotIds: readonly string[],
): Promise<Set<string>> {
  if (plotIds.length === 0) return new Set();
  const res = await tx.query(FREEHOLD_CLAIM_STILL_HELD_SQL, [
    requireText('holder', holder, FREEHOLD_LIVE_HOLDER_MAX),
    plotIds.map(requirePlotId),
  ]);
  return returnedPlotIds(res);
}

/** The holder a RELEASED claim carries: the releasing holder plus this suffix.
 *  Renaming, not only expiring, is what makes a release final: the renewer and
 *  the write fence both match the LIVE holder exactly, so a renewal already in
 *  flight when the release commits cannot revive the claim, and a late write of
 *  the releasing process is fenced; another holder (or this one again) takes it
 *  as a takeover, advancing the generation. At most 128 characters (101 + 9). */
export const FREEHOLD_CLAIM_RELEASED_SUFFIX = '#released';

/** A LIVE holder leaves room for the release suffix inside the column's
 *  128-character shape, so a release can never fail its own CHECK. Read only
 *  inside the functions below, at call time. */
const FREEHOLD_LIVE_HOLDER_MAX = 128 - FREEHOLD_CLAIM_RELEASED_SUFFIX.length;

/** Release keeps the row (the generation must survive) and touches only rows
 *  still live, so a long-lived process does not rewrite every claim it ever
 *  held in a keep-forever table. SKIP LOCKED: a row a write abandoned at the
 *  drain deadline still holds is left to expire on its own rather than failing
 *  the whole release. */
export const FREEHOLD_CLAIM_RELEASE_SQL = `UPDATE freehold_plot_claims
   SET expires_at = clock_timestamp(),
       holder = holder || '${FREEHOLD_CLAIM_RELEASED_SUFFIX}'
 WHERE plot_id IN (
   SELECT plot_id FROM freehold_plot_claims
    WHERE holder = $1 AND plot_id = ANY($2::text[]) AND expires_at > clock_timestamp()
    ORDER BY plot_id
      FOR NO KEY UPDATE SKIP LOCKED)
RETURNING plot_id`;

export const FREEHOLD_CLAIM_RELEASE_ALL_SQL = `UPDATE freehold_plot_claims
   SET expires_at = clock_timestamp(),
       holder = holder || '${FREEHOLD_CLAIM_RELEASED_SUFFIX}'
 WHERE plot_id IN (
   SELECT plot_id FROM freehold_plot_claims
    WHERE holder = $1 AND expires_at > clock_timestamp()
    ORDER BY plot_id
      FOR NO KEY UPDATE SKIP LOCKED)
RETURNING plot_id`;

function returnedPlotIds(res: { rows?: unknown[] }): Set<string> {
  const ids = new Set<string>();
  for (const row of res.rows ?? []) {
    const plotId = (row as { plot_id?: unknown }).plot_id;
    if (typeof plotId === 'string') ids.add(plotId);
  }
  return ids;
}

/** Inside the renewer's one transaction: the renewed set, then the released
 *  set. An empty list issues no statement. */
export async function renewFreeholdClaimRows(
  tx: FreeholdQueryable,
  holder: string,
  plotIds: readonly string[],
  ttlSeconds: number,
): Promise<Set<string>> {
  if (plotIds.length === 0) return new Set();
  const res = await tx.query(FREEHOLD_CLAIM_RENEW_SQL, [
    requireText('holder', holder, FREEHOLD_LIVE_HOLDER_MAX),
    requireTtl(ttlSeconds),
    plotIds.map(requirePlotId),
  ]);
  return returnedPlotIds(res);
}

export async function releaseFreeholdClaimRows(
  tx: FreeholdQueryable,
  holder: string,
  plotIds: readonly string[],
): Promise<Set<string>> {
  if (plotIds.length === 0) return new Set();
  const res = await tx.query(FREEHOLD_CLAIM_RELEASE_SQL, [
    requireText('holder', holder, FREEHOLD_LIVE_HOLDER_MAX),
    plotIds.map(requirePlotId),
  ]);
  return returnedPlotIds(res);
}

export async function releaseAllFreeholdClaimRows(
  tx: FreeholdQueryable,
  holder: string,
): Promise<number> {
  const res = await tx.query(FREEHOLD_CLAIM_RELEASE_ALL_SQL, [
    requireText('holder', holder, FREEHOLD_LIVE_HOLDER_MAX),
  ]);
  return returnedPlotIds(res).size;
}

/** The verify's claim read (manifest P9), issued only AFTER the verify's lock
 *  on the character row has waited out the hung transaction, as its own
 *  statement, so it sees that transaction's committed outcome. */
export const FREEHOLD_CLAIM_VERIFY_SQL = `SELECT holder, generation::text AS generation, write_token
  FROM freehold_plot_claims WHERE plot_id = $1`;

export async function readFreeholdClaimOnClient(
  tx: FreeholdQueryable,
  plotId: string,
): Promise<{ holder: string; generation: string; writeToken: string | null } | null> {
  const res = await tx.query(FREEHOLD_CLAIM_VERIFY_SQL, [requirePlotId(plotId)]);
  const row = res.rows?.[0] as
    | { holder?: unknown; generation?: unknown; write_token?: unknown }
    | undefined;
  if (!row || typeof row.holder !== 'string' || typeof row.generation !== 'string') return null;
  return {
    holder: row.holder,
    generation: row.generation,
    writeToken: typeof row.write_token === 'string' ? row.write_token : null,
  };
}

/** The account export's claim rows: an ALLOWLIST. The holder (a per-boot
 *  process id), the generation and the token are server internals and never
 *  leave the server. Bounded by the account's plots. */
export const FREEHOLD_CLAIM_EXPORT_SQL = `SELECT plot_id, realm, acquired_at, heartbeat_at, expires_at
  FROM freehold_plot_claims WHERE account_id = $1 ORDER BY plot_id`;

export async function freeholdClaimsForExport(
  db: FreeholdQueryable,
  accountId: number,
): Promise<unknown[]> {
  if (!Number.isSafeInteger(accountId) || accountId <= 0) {
    throw new RangeError('freehold claim export account id must be a positive safe integer');
  }
  const res = await db.query(FREEHOLD_CLAIM_EXPORT_SQL, [accountId]);
  return res.rows ?? [];
}
