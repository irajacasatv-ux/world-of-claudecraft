# 07a workload evidence (2026-09-30)

The bounded-workload evidence the 07a packet's deliverable 5 asks for, beside the touch-set
manifest ([../../mutation-touch-set-manifest.md](../../mutation-touch-set-manifest.md),
section 10) and the real-PG suites that prove its interleaves
(`tests/server/freehold_claim.pg.test.ts`, `tests/server/freehold_mutation.pg.test.ts`).
Measured on the Linux host (about 2.1 times slower than the Mac, so compare these only with
each other) against a userspace PostgreSQL 16.14 on localhost, in a throwaway schema, driving
the REAL server modules. The script is below, so the run is repeatable.

## Results (5,000 owners, the shutdown drain's concurrency of 8)

| Path | Measured | Reading |
|---|---|---|
| 07's plain CAS (`upsertFreehold` UPDATE arm), 5,000 writes | 180 ms | the baseline the drain bound was set against |
| 07a fenced CAS (`upsertFencedFreehold`, ONE statement), 5,000 writes | 267 ms | about 1.5 times the plain CAS on the database side, still one round trip, so the store's 10,000 ms drain (`FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS`) is untouched by the fence; the drain's own measured 6,944 ms at 5,000 owners is store mechanics at a modeled 10 ms statement, which the real statement undercuts |
| the renewer, 5,000 wanted claims (20 chunks of 256) | 131 ms | renewed 5,000, missed 0, lost 0; one pass is ceil(H/256) short transactions for H wanted claims (20 here), each one renew statement plus a lock-free follow-up read only when SKIP LOCKED passed a row over, run one at a time on one pool client |
| the claimed login read, 500 logins at the store's load cap of 4 | p50 1.0 ms, p99 2.1 ms, max 2.9 ms | the three added statements (plot-id pre-read, busy pre-check, acquire) cost about a millisecond against the 2,000 ms login statement bound |
| the receipts export at 10,000 receipts for one account | Limit over an Index Scan of `freehold_operation_receipts_account`, 8 shared buffers, 0.071 ms | the ordered index serves the newest-first limit without reading the account's history |

## Verdict against the manifest's PASS rules

- Drain at 5,000 owners on the fenced write: PASS (the database half of the drain is 267 ms;
  the rest is the store's own bounded mechanics, unchanged by 07a).
- Renewer at 5,000 wanted plots: PASS (131 ms here, and a median 138 ms per pass against the
  grown 201,000-row table below, far inside the pass deadline, the 30 s cadence and the 90 s TTL).
- Receipts export at 10,000 receipts: PASS (index-ordered limit, no sort).
- Login floor: the added statements are about 1 ms at p99 here; the contract's re-derived floor
  counts them by their statement bound, not by this measurement.

Not measured here, and named as such: the P9 hold against a concurrent `characters` UPDATE
under load, and a first-rollout boot against a populated database with a second realm serving.
The renewer against a GROWN claims table is measured in the next section.

## Grown claims table (201,000 rows, 61 holders)

The claims table is keep-forever (one row per plot id ever claimed, a release keeps the row),
so the renewer's and the release's statements were re-measured against a table grown the way
production grows it: 201,000 ANALYZEd rows (63 MB with indexes) across 61 holders, of which
190,000 are RELEASED (holder ending `#released`, expired), 6,000 are live under 60 other holders
(100 each), and 5,000 are live under the bench holder. Plot ids are md5-spread like minted ids,
so a chunk's rows sit on random pages. Each statement ran under `EXPLAIN (ANALYZE, BUFFERS)` in a
transaction that was rolled back, with the parameters the renewer sends (the holder, the TTL and
the first 256 of the holder's ids in sort order); the renewer itself is the REAL
`renewFreeholdClaims` at 5,000 wanted claims, with a wanted predicate of the wiring's shape (the
owner key, the store map, the sim map, the in-flight map, the young-claim age).

| Statement or path | Plan on the grown table | Buffers | Time |
|---|---|---|---|
| `FREEHOLD_CLAIM_RENEW_SQL`, one 256-id chunk | Nested Loop: the locked subselect is a BitmapAnd of `freehold_plot_claims_holder` and `freehold_plot_claims_pkey`, the outer an Index Scan of `freehold_plot_claims_pkey` per id | 2,952 hit | 5.8 ms |
| `FREEHOLD_CLAIM_STILL_HELD_SQL`, 256 ids | Bitmap Heap Scan over the same BitmapAnd | 904 hit | 1.3 ms |
| `FREEHOLD_CLAIM_RELEASE_SQL`, 256 ids | Nested Loop, same shape as the renew | 5,516 hit | 7.6 ms |
| `FREEHOLD_CLAIM_RELEASE_ALL_SQL`, the holder's 5,000 live claims, AS SHIPPED | Hash Semi Join whose outer is a **Seq Scan of all 201,000 rows** (the locked subselect on `freehold_plot_claims_holder`) | 80,383 hit, 5,370 of them the scan | 264 ms |
| `FREEHOLD_CLAIM_RELEASE_ALL_SQL`, FIXED (outer `holder = $1`) | Hash Semi Join whose outer is a Bitmap Heap Scan of `freehold_plot_claims_holder` (5,000 rows, 1,148 heap blocks) | 75,765 hit, 1,154 of them the outer read | 118 ms |
| the renewer, one pass at 5,000 wanted claims (20 chunks) | 20 transactions in sequence on one client | | median 138 ms over 7 passes (134 to 146); renewed 35,000, missed 0, lost 0, skipped 0, abandoned 0 |
| the renewer's synchronous part before its first await | one copy, one sort, 5,000 wanted tests, the pending sweep, the first chunk's checkout call | | median 1.4 ms (2.1 ms on the cold first pass); 1.0 ms with the checkout taken out |

Readings:

- **One finding, fixed.** The shutdown release had no chunk bound, so its subselect returns
  every live claim of the holder and the planner served the bare `plot_id IN (...)` with a hash
  semi join over a sequential scan of the whole keep-forever table: a cost that grows with the
  table's age, not with this process's claims. The outer `holder = $1` qual (now in
  `FREEHOLD_CLAIM_RELEASE_ALL_SQL`, with the reason at the constant) gives that read the holder
  index; the plan suite pins that both reads reach `freehold_plot_claims_holder`
  (`tests/server/freehold_claim.pg.test.ts`, the plan case), and that pin fails on the old text.
  The remaining 118 ms is the 5,000 row writes themselves (a release rewrites `holder`, which is
  indexed, so those versions are not HOT), inside the release's 2,000 ms deadline.
- **The chunked statements are bounded by their array.** With at most 256 ids the planner
  estimates a handful of rows and probes the primary key per id; a larger table only makes the
  sequential alternative dearer, so their cost follows the chunk, not the table.
- **The holder index stays selective as the table grows.** A released row is renamed
  `holder#released`, so the live holder's key in `freehold_plot_claims_holder` covers only the
  rows this boot still holds; the 190,000 released rows sit under other keys.
- **The pass cost follows H, not the table.** 138 ms for 5,000 claims is about 7 ms per chunk,
  a few hundred times inside the pass deadline (`FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS`) and the
  30 s cadence. The pass is single-flight and holds one pool client at a time, so a brownout
  that stretches it skips triggers (counted) rather than stacking clients.

## The script

Bundle with `npx esbuild <script> --bundle --platform=node --format=cjs --external:pg` from
this directory and run with `NODE_PATH=<repo>/node_modules`.

```ts
// 07a workload evidence against the scratch PostgreSQL 16 (never a shared DB):
// the shutdown-drain shape on the fenced CAS against 07's plain CAS, the
// renewer at 5,000 wanted claims, the claimed login read, and the receipts
// export plan at 10,000 receipts. Drives the REAL server modules.
import { Pool } from 'pg';
import { acquireFreeholdClaim, freeholdClaimSchema } from '../../../../server/freehold_claim_db';
import { createFreeholdClaimRegistry, renewFreeholdClaims } from '../../../../server/freehold_claim_registry';
import { readClaimedLoginDurables } from '../../../../server/freehold_claim_login';
import {
  freeholdForAccount,
  freeholdSchema,
  upsertFencedFreehold,
  upsertFreehold,
} from '../../../../server/freehold_db';
import { freeholdHearthSchema, loadFreeholdHearth } from '../../../../server/freehold_hearth_db';
import { freeholdOperationSchema, FREEHOLD_OPERATION_EXPORT_RECEIPTS_SQL } from '../../../../server/freehold_operation_db';

const URL = 'postgres://postgres:postgres@127.0.0.1:55432/wocc_ci';
const SCHEMA = 'bench07a';
const N = Number(process.env.N ?? 5000);
const HOLDER = 'bench#holder';

async function main() {
  const admin = new Pool({ connectionString: URL, max: 1 });
  await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await admin.query(`CREATE SCHEMA ${SCHEMA}`);
  await admin.end();
  const pool = new Pool({ connectionString: URL, max: 10, options: `-c search_path=${SCHEMA}` });
  await pool.query('CREATE TABLE accounts (id SERIAL PRIMARY KEY, deactivated_at TIMESTAMPTZ)');
  await pool.query('CREATE TABLE characters (id SERIAL PRIMARY KEY, account_id INT REFERENCES accounts(id) ON DELETE CASCADE)');
  for (const ddl of [freeholdSchema(SCHEMA), freeholdHearthSchema(SCHEMA), freeholdClaimSchema(SCHEMA), freeholdOperationSchema(SCHEMA)]) await pool.query(ddl);
  await pool.query(`INSERT INTO accounts (id) SELECT g FROM generate_series(1, ${N}) g`);
  const plot = (i: number) => `plot:bench${String(i).padStart(6, '0')}`;
  const doc = (i: number, rev: number, expected: string | null) => ({
    accountId: i, plotIndex: 0, plotId: plot(i), tier: 'inn_room', layoutJson: '[]', trophiesJson: '[]',
    condition: 100, visitPolicy: 'closed', wireRev: rev, schemaVersion: 1, expectedDurableRev: expected,
  });
  // Seed rows and claims.
  for (let i = 1; i <= N; i++) await upsertFreehold(pool, doc(i, 0, null));
  const registry = createFreeholdClaimRegistry();
  for (let i = 1; i <= N; i++) {
    const c = await acquireFreeholdClaim(pool, { plotId: plot(i), accountId: i, realm: 'bench', holder: HOLDER, ttlSeconds: 90 });
    if (c.kind !== 'acquired') throw new Error('seed acquire');
    registry.record({ plotId: plot(i), accountId: i, generation: c.generation, acquiredAtMs: 0 });
  }
  await pool.query('ANALYZE');
  const drain = async (label: string, write: (i: number) => Promise<unknown>) => {
    const t0 = performance.now();
    let next = 1;
    const workers = Array.from({ length: 8 }, async () => {
      while (next <= N) { const i = next++; await write(i); }
    });
    await Promise.all(workers);
    console.log(`${label}: ${N} writes at concurrency 8 in ${(performance.now() - t0).toFixed(0)} ms`);
  };
  // 07's plain CAS (the baseline), then the fenced CAS, each one revision on.
  await drain('07 plain CAS (upsertFreehold UPDATE arm)', (i) => upsertFreehold(pool, doc(i, 1, '1')));
  await drain('07a fenced CAS (upsertFencedFreehold, one statement)', (i) =>
    upsertFencedFreehold(pool, doc(i, 2, '2'), { plotId: plot(i), holder: HOLDER, generation: '1', writeToken: 'a'.repeat(32) }));
  // The renewer at N wanted claims.
  {
    const t0 = performance.now();
    await renewFreeholdClaims({ registry, pool, holder: HOLDER, ttlSeconds: 90, wanted: () => true, nowMs: () => 0, warn: console.warn });
    console.log(`renewer: ${N} wanted claims in ${(performance.now() - t0).toFixed(0)} ms (renewed ${registry.counters.renewed}, missed ${registry.counters.missedHeartbeats}, lost ${registry.counters.lost})`);
  }
  // The claimed login read: 500 logins, concurrency 4 (the store's load cap).
  {
    const lat: number[] = [];
    let next = 1;
    const workers = Array.from({ length: 4 }, async () => {
      while (next <= 500) {
        const i = next++;
        const t0 = performance.now();
        await readClaimedLoginDurables({
          pool, registry, holder: HOLDER, realm: 'bench', ttlSeconds: 90,
          readRow: (db) => freeholdForAccount(db, i, 106496),
          readHearth: (db) => loadFreeholdHearth(db, i),
          nowMs: () => 0,
        }, i);
        lat.push(performance.now() - t0);
      }
    });
    await Promise.all(workers);
    lat.sort((a, b) => a - b);
    console.log(`claimed login read: 500 at concurrency 4, p50 ${lat[249].toFixed(1)} ms, p99 ${lat[494].toFixed(1)} ms, max ${lat[499].toFixed(1)} ms`);
  }
  // The receipts export plan at 10,000 receipts for one account.
  {
    await pool.query(`INSERT INTO freehold_operation_receipts (operation_id, account_id, plot_id, kind, outcome, fingerprint, applied_durable_rev, closed_at)
      SELECT 'fop:' || lpad(g::text, 32, '0'), 1, '${plot(1)}', 'bench_kind', 'applied', repeat('f', 64), g, now() - make_interval(secs => g)
        FROM generate_series(1, 10000) g`);
    await pool.query('ANALYZE freehold_operation_receipts');
    const plan = await pool.query(`EXPLAIN (ANALYZE, BUFFERS) ${FREEHOLD_OPERATION_EXPORT_RECEIPTS_SQL.replace('$1', '1').replace('$2', '201')}`);
    console.log('receipts export plan at 10,000 receipts:');
    for (const row of plan.rows) console.log('  ' + row['QUERY PLAN']);
  }
  await pool.end();
  const cleanup = new Pool({ connectionString: URL, max: 1 });
  await cleanup.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await cleanup.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

## The grown-table script

Built and run the same way as the script above.

```ts
// 07a grown-claims-table evidence against the scratch PostgreSQL 16 (never a
// shared DB, its own schema, dropped after): a freehold_plot_claims table of
// about 200,000 ANALYZEd rows across 61 holders, most of them RELEASED
// (holder ending '#released'), plus 5,000 live rows for the bench holder and
// 100 live rows for each of 60 other holders. Then the EXPLAIN (ANALYZE,
// BUFFERS) of the renewer's and the release's statements with realistic
// parameters, and the REAL renewFreeholdClaims at 5,000 wanted claims: the
// per-pass wall time and the synchronous part before its first await.
import { Pool } from 'pg';
import {
  FREEHOLD_CLAIM_RELEASE_ALL_SQL,
  FREEHOLD_CLAIM_RELEASE_SQL,
  FREEHOLD_CLAIM_RENEW_SQL,
  FREEHOLD_CLAIM_STILL_HELD_SQL,
  freeholdClaimSchema,
} from '../../../../server/freehold_claim_db';
import {
  createFreeholdClaimRegistry,
  FREEHOLD_CLAIM_RENEW_CHUNK,
  renewFreeholdClaims,
} from '../../../../server/freehold_claim_registry';

const URL = 'postgres://postgres:postgres@127.0.0.1:55432/wocc_ci';
const SCHEMA = 'c_bench07a_grown';
const RELEASED = Number(process.env.RELEASED ?? 190_000);
const OTHER_HOLDERS = 60;
const OTHER_LIVE_EACH = 100;
const MINE = 5_000;
const HOLDER = 'bench#holder';

/** The wiring's predicate shape (server/freehold_persist_wiring.ts): the owner
 *  key (the same check freeholdOwnerKeyForAccount makes), the store's map, the
 *  sim's map, the in-flight map, the young-claim age. Inlined so the bench
 *  pulls no sim modules. */
function ownerKey(accountId: number): string {
  if (!Number.isSafeInteger(accountId) || accountId <= 0) throw new Error('bad account');
  return `account:${accountId}`;
}

async function main() {
  const admin = new Pool({ connectionString: URL, max: 1 });
  await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await admin.query(`CREATE SCHEMA ${SCHEMA}`);
  await admin.end();
  const pool = new Pool({ connectionString: URL, max: 10, options: `-c search_path=${SCHEMA}` });
  try {
    const total = RELEASED + OTHER_HOLDERS * OTHER_LIVE_EACH + MINE;
    await pool.query('CREATE TABLE accounts (id SERIAL PRIMARY KEY)');
    await pool.query(freeholdClaimSchema(SCHEMA));
    await pool.query(`INSERT INTO accounts (id) SELECT g FROM generate_series(1, ${total}) g`);
    // 60 other holders, REALM#uuid-shaped; released rows rotate across them.
    const holderExpr = (g: string) =>
      `'realm' || ((${g}) % 6) || '#' || md5('holder' || ((${g}) % ${OTHER_HOLDERS}))::uuid`;
    const t0 = performance.now();
    await pool.query(
      `INSERT INTO freehold_plot_claims
         (plot_id, account_id, realm, holder, generation, acquired_at, heartbeat_at, expires_at)
       SELECT 'plot:' || md5('released' || g), g, 'realm' || (g % 6),
              ${holderExpr('g')} || '#released', 1 + (g % 5),
              now() - interval '30 days', now() - interval '1 day', now() - interval '1 day'
         FROM generate_series(1, ${RELEASED}) g`,
    );
    await pool.query(
      `INSERT INTO freehold_plot_claims
         (plot_id, account_id, realm, holder, generation, acquired_at, heartbeat_at, expires_at)
       SELECT 'plot:' || md5('other' || g), ${RELEASED} + g, 'realm' || (g % 6),
              ${holderExpr('g')}, 1, now(), now(), now() + interval '90 seconds'
         FROM generate_series(1, ${OTHER_HOLDERS * OTHER_LIVE_EACH}) g`,
    );
    const base = RELEASED + OTHER_HOLDERS * OTHER_LIVE_EACH;
    await pool.query(
      `INSERT INTO freehold_plot_claims
         (plot_id, account_id, realm, holder, generation, acquired_at, heartbeat_at, expires_at)
       SELECT 'plot:' || md5('mine' || g), ${base} + g, 'bench', '${HOLDER}', 1,
              now(), now(), now() + interval '90 seconds'
         FROM generate_series(1, ${MINE}) g`,
    );
    await pool.query('ANALYZE freehold_plot_claims');
    const shape = (
      await pool.query(
        `SELECT count(*)::int AS rows,
                count(DISTINCT regexp_replace(holder, '#released$', ''))::int AS holders,
                count(*) FILTER (WHERE holder LIKE '%#released')::int AS released,
                count(*) FILTER (WHERE holder = $1)::int AS mine,
                pg_size_pretty(pg_total_relation_size('freehold_plot_claims')) AS size
           FROM freehold_plot_claims`,
        [HOLDER],
      )
    ).rows[0];
    console.log(
      `seeded in ${(performance.now() - t0).toFixed(0)} ms: ${JSON.stringify(shape)} (ANALYZEd)`,
    );

    const mine = (
      await pool.query(
        'SELECT plot_id, account_id FROM freehold_plot_claims WHERE holder = $1 ORDER BY plot_id',
        [HOLDER],
      )
    ).rows as { plot_id: string; account_id: number }[];
    const chunk = mine.slice(0, FREEHOLD_CLAIM_RENEW_CHUNK).map((r) => r.plot_id);
    const explain = async (label: string, sql: string, values: unknown[]) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const plan = await client.query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`, values);
        await client.query('ROLLBACK');
        console.log(`\n${label}:`);
        for (const row of plan.rows) console.log(`  ${row['QUERY PLAN']}`);
        const text = plan.rows.map((r) => String(r['QUERY PLAN'])).join('\n');
        if (/Seq Scan on freehold_plot_claims/.test(text)) {
          console.log(`  FINDING: ${label} reads the grown table by sequential scan`);
        }
      } finally {
        client.release();
      }
    };
    await explain('FREEHOLD_CLAIM_RENEW_SQL, one 256-id chunk', FREEHOLD_CLAIM_RENEW_SQL, [
      HOLDER,
      90,
      chunk,
    ]);
    await explain('FREEHOLD_CLAIM_STILL_HELD_SQL, 256 ids', FREEHOLD_CLAIM_STILL_HELD_SQL, [
      HOLDER,
      chunk,
    ]);
    await explain('FREEHOLD_CLAIM_RELEASE_SQL, 256 ids', FREEHOLD_CLAIM_RELEASE_SQL, [
      HOLDER,
      chunk,
    ]);
    await explain(
      'FREEHOLD_CLAIM_RELEASE_ALL_SQL, the 5,000 live claims of the holder',
      FREEHOLD_CLAIM_RELEASE_ALL_SQL,
      [HOLDER],
    );

    // The REAL renewer at 5,000 wanted claims on that table.
    const registry = createFreeholdClaimRegistry();
    for (const row of mine) {
      registry.record({
        plotId: row.plot_id,
        accountId: row.account_id,
        generation: '1',
        acquiredAtMs: 0,
      });
    }
    const storeRefs = new Map<string, number>(mine.map((r) => [ownerKey(r.account_id), 1]));
    const simLive = new Map<string, unknown>();
    const deps = {
      registry,
      pool,
      holder: HOLDER,
      ttlSeconds: 90,
      wanted: (claim: { plotId: string; accountId: number; acquiredAtMs: number }, now: number) => {
        const key = ownerKey(claim.accountId);
        return (
          (storeRefs.get(key) ?? 0) > 0 ||
          simLive.has(key) ||
          registry.inFlight(claim.plotId) ||
          now - claim.acquiredAtMs < 10_000
        );
      },
      nowMs: () => Date.now(),
      warn: (m: string) => console.warn(m),
    };
    const walls: number[] = [];
    const syncs: number[] = [];
    for (let pass = 0; pass < 7; pass++) {
      const start = performance.now();
      const running = renewFreeholdClaims(deps);
      syncs.push(performance.now() - start);
      await running;
      walls.push(performance.now() - start);
    }
    const c = registry.counters;
    const fmt = (xs: number[]) => xs.map((x) => x.toFixed(2)).join(', ');
    const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    console.log(
      `\nrenewer, ${mine.length} wanted claims (${Math.ceil(mine.length / FREEHOLD_CLAIM_RENEW_CHUNK)} chunks), 7 passes:`,
    );
    console.log(`  per-pass wall ms: ${fmt(walls)} (median ${median(walls).toFixed(1)})`);
    console.log(`  synchronous part before the first await, ms: ${fmt(syncs)} (median ${median(syncs).toFixed(2)})`);
    console.log(
      `  counters: renewed ${c.renewed}, missed ${c.missedHeartbeats}, lost ${c.lost}, passes ${c.renewPasses}, skipped ${c.renewPassesSkipped}, abandoned ${c.renewChunksAbandoned}, pass ms total ${c.renewPassMsTotal}`,
    );
    // The synchronous part alone, isolated from the pool: a pool whose
    // checkout never answers, so the call returns at the first await.
    const isolated = createFreeholdClaimRegistry();
    for (const claim of registry.all()) isolated.record(claim);
    const stuck = { connect: () => new Promise<never>(() => {}) };
    const isolatedSyncs: number[] = [];
    for (let i = 0; i < 7; i++) {
      const fresh = createFreeholdClaimRegistry();
      for (const claim of isolated.all()) fresh.record(claim);
      const start = performance.now();
      void renewFreeholdClaims({ ...deps, registry: fresh, pool: stuck });
      isolatedSyncs.push(performance.now() - start);
    }
    console.log(
      `  synchronous part alone (checkout never answers), ms: ${fmt(isolatedSyncs)} (median ${median(isolatedSyncs).toFixed(2)})`,
    );
  } finally {
    await pool.end();
    const cleanup = new Pool({ connectionString: URL, max: 1 });
    await cleanup.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await cleanup.end();
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
```
