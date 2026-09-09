// The EXECUTED proof for server/freehold_db.ts against real PostgreSQL. A fake
// pool cannot tell whether the DDL parses, whether a named CHECK actually
// refuses its bad value, whether the compare-and-swap fence converges under
// contention, or whether the account read reaches an index instead of scanning:
// those are the claims this suite settles. The always-on text pins live in the
// twin, tests/server/freehold_db.test.ts, which keeps its value when this file
// skips.
//
// The FK parents are MINIMAL STAND-INS (an id-only accounts table and an
// account-owned characters table): this suite proves the account_freeholds DDL
// and its statements, not the core schema, and the production parents exist
// long before ensureSchema reaches this module.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  FREEHOLD_MAX_LAYOUT_ROWS,
  FREEHOLD_MAX_OWNED_BYTES,
  FREEHOLD_MAX_STORED_BYTES,
  FREEHOLD_MAX_TROPHY_ROWS,
  normalizeFreehold,
  persistedFreeholdBytes,
} from '../../src/sim/freehold/persisted';
import {
  MAXIMAL_FREEHOLD_OPTS,
  MAXIMAL_FREEHOLD_POLICY,
  MAXIMAL_FREEHOLD_REV,
  MAXIMAL_FREEHOLD_TIER,
  maximalLegalFreeholdRecord,
} from '../helpers/maximal_freehold';
import { checkRelationUsesPartialIndex, rootPlanFromExplainRow } from '../helpers/pg_plan';

const url = process.env.TEST_DATABASE_URL ?? '';
const d = url === '' ? describe.skip : describe;

// A PRIVATE schema, the repo idiom for every database-gated suite
// (tests/server/storage_purchase_db.pg.test.ts, tests/discord_db_integration.test.ts). It
// is not tidiness: this suite DROPS its schema in both beforeAll and afterAll,
// deletes rows between cases, and the module functions it drives issue
// UNQUALIFIED SQL, so without an isolated search_path a developer who points
// TEST_DATABASE_URL at a database that already carries the game schema (the
// documented local dev database is on the same 127.0.0.1:5433 the user-space
// Postgres harness uses) destroys REAL player data. account_freeholds is
// keep-forever by design: each row IS a player's built home, reconstructible
// from nothing. The equivalent storage-purchase suite proved the hazard on a
// live database during a go-live pass, where it dropped 13 real rows and then
// failed anyway, because CREATE TABLE IF NOT EXISTS accounts found the real
// accounts table and the id-only INSERT violated its NOT NULL columns.
const SCHEMA = 'freehold_pg_test';

const PLOT_ID = 'plot:0123456789abcdef0123456789abcdef';

/** Every column the CHECK cases drive, as one good row to corrupt ONE field of. */
const BASE_ROW: Record<string, unknown> = {
  account_id: 1,
  plot_index: 0,
  plot_id: PLOT_ID,
  schema_version: 1,
  durable_rev: 1,
  wire_rev: 0,
  tier: 'cottage',
  layout: '[]',
  trophies: '[]',
  condition: 100,
  visit_policy: 'closed',
  upkeep_binding: 'unbound_no_history',
  upkeep_checkpoint: null,
  upkeep_credit: null,
};

const RAW_INSERT = `INSERT INTO ${SCHEMA}.account_freeholds
    (account_id, plot_index, plot_id, schema_version, durable_rev, wire_rev, tier,
     layout, trophies, condition, visit_policy, upkeep_binding,
     upkeep_checkpoint, upkeep_credit)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13::jsonb, $14::jsonb)`;

const RAW_INSERT_VALUES = (over: Record<string, unknown> = {}): unknown[] => {
  const row = { ...BASE_ROW, ...over };
  return [
    row.account_id,
    row.plot_index,
    row.plot_id,
    row.schema_version,
    row.durable_rev,
    row.wire_rev,
    row.tier,
    row.layout,
    row.trophies,
    row.condition,
    row.visit_policy,
    row.upkeep_binding,
    row.upkeep_checkpoint,
    row.upkeep_credit,
  ];
};

interface Captured {
  text: string;
  values: unknown[] | undefined;
}

/** Wraps a real client so a case can EXPLAIN or re-run EXACTLY the statement the
 *  module shipped, and count the round trips it actually took. */
function recorder(target: {
  query(text: string, values?: unknown[]): Promise<{ rows?: Record<string, unknown>[] }>;
}) {
  const calls: Captured[] = [];
  return {
    calls,
    db: {
      query: async (text: string, values?: unknown[]) => {
        calls.push({ text, values });
        return await target.query(text, values);
      },
    },
  };
}

d('account_freeholds against real PostgreSQL', () => {
  // Imported lazily so the suite skips clean with no pg import at all.
  let pool: import('pg').Pool;
  let db: typeof import('../../server/freehold_db');
  let plotSchema: string;
  let accountId: number;

  const constraintNames = async (): Promise<string[]> => {
    const res = await pool.query(
      `SELECT conname FROM pg_constraint
        WHERE conrelid = '${SCHEMA}.account_freeholds'::regclass
        ORDER BY conname`,
    );
    return res.rows.map((r: { conname: string }) => r.conname);
  };

  const storedRow = async (id: number): Promise<Record<string, unknown> | undefined> => {
    const res = await pool.query(
      `SELECT plot_index, plot_id, tier, condition, visit_policy, upkeep_binding,
              durable_rev::text AS durable_rev, wire_rev::text AS wire_rev,
              jsonb_array_length(layout) AS layout_rows,
              octet_length(layout::text) AS layout_bytes,
              octet_length(trophies::text) AS trophies_bytes,
              upkeep_checkpoint, upkeep_credit
         FROM ${SCHEMA}.account_freeholds WHERE account_id = $1 ORDER BY plot_index`,
      [id],
    );
    return res.rows[0];
  };

  beforeAll(async () => {
    const { Pool } = await import('pg');
    db = await import('../../server/freehold_db');
    // search_path is a STARTUP option so the module functions, which take the
    // pool and issue unqualified SQL, land in the private schema.
    pool = new Pool({
      connectionString: url,
      max: 4,
      options: `-c search_path=${SCHEMA}`,
      application_name: SCHEMA,
      statement_timeout: 15_000,
    });
    const admin = new Pool({ connectionString: url, max: 1 });
    await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await admin.query(`CREATE SCHEMA ${SCHEMA}`);
    await admin.end();
    await pool.query('CREATE TABLE accounts (id SERIAL PRIMARY KEY)');
    await pool.query(
      `CREATE TABLE characters (
         id SERIAL PRIMARY KEY,
         account_id INT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
       )`,
    );
    await pool.query('INSERT INTO accounts (id) VALUES (1), (2)');
    await pool.query("SELECT setval('accounts_id_seq', 100)");
    // The DDL executes for real, TWICE: idempotence is part of the contract,
    // because ensureSchema re-applies every fragment at every boot.
    plotSchema = db.freeholdSchema(SCHEMA);
    await pool.query(plotSchema);
    await pool.query(plotSchema);
    accountId = 1;
  }, 30_000);

  afterAll(async () => {
    if (!pool) return;
    await pool.end();
    // Drop the whole private schema, never a bare table name: a DROP TABLE here
    // would resolve through whatever search_path the connection ended up with
    // and could take the real table with it.
    const { Pool } = await import('pg');
    const admin = new Pool({ connectionString: url, max: 1 });
    await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await admin.end();
  });

  beforeEach(async () => {
    // Qualified on purpose: cleanup must never depend on a search_path.
    await pool.query(`DELETE FROM ${SCHEMA}.account_freeholds`);
    await pool.query(`DELETE FROM ${SCHEMA}.characters`);
  });

  it("runs entirely inside its private schema, never the caller's default", async () => {
    // The isolation IS the safety property, so it gets its own decisive pin: a
    // regression that drops the search_path option shows up here rather than as
    // a silently destroyed production table.
    const where = await pool.query('SELECT current_schema() AS s');
    expect(where.rows[0].s).toBe(SCHEMA);
    const owner = await pool.query(
      "SELECT schemaname FROM pg_tables WHERE tablename = 'account_freeholds'",
    );
    expect(owner.rows.map((r: { schemaname: string }) => r.schemaname)).toEqual([SCHEMA]);
  });

  it('applies its DDL again with no error and no catalog drift', async () => {
    const before = await constraintNames();
    await pool.query(plotSchema);
    const after = await constraintNames();
    expect(after).toEqual(before);
    // Named, so a production 23514 reports the rule it broke.
    expect(after).toContain('account_freeholds_plot_id_charset');
    expect(after).toContain('account_freeholds_unbound_carries_no_upkeep');
    const indexes = await pool.query(
      `SELECT indexname FROM pg_indexes
        WHERE schemaname = $1 AND tablename = 'account_freeholds' ORDER BY indexname`,
      [SCHEMA],
    );
    // Exactly two: the primary key and the unique plot identity. No third index
    // on account_id, because account_id LEADS the primary key.
    expect(indexes.rows.map((r: { indexname: string }) => r.indexname)).toEqual([
      'account_freeholds_pkey',
      'account_freeholds_plot_id',
    ]);
  });

  it('accepts a well-formed row and refuses each single-field corruption of it', async () => {
    // The positive control first: without it every refusal below could be
    // passing for a reason unrelated to the field it corrupts.
    await expect(pool.query(RAW_INSERT, RAW_INSERT_VALUES())).resolves.toBeDefined();
    await pool.query(`DELETE FROM ${SCHEMA}.account_freeholds`);

    const cases: { label: string; over: Record<string, unknown>; constraint: string }[] = [
      {
        label: 'a negative plot slot',
        over: { plot_index: -1 },
        constraint: 'account_freeholds_plot_index_shape',
      },
      {
        label: 'a plot id carrying a slash',
        over: { plot_id: 'plot:bad/id' },
        constraint: 'account_freeholds_plot_id_charset',
      },
      {
        label: 'a plot id past 64 characters',
        over: { plot_id: `plot:${'a'.repeat(70)}` },
        constraint: 'account_freeholds_plot_id_charset',
      },
      {
        label: 'a zero schema version',
        over: { schema_version: 0 },
        constraint: 'account_freeholds_schema_version_positive',
      },
      {
        label: 'a zero durable revision',
        over: { durable_rev: 0 },
        constraint: 'account_freeholds_durable_rev_positive',
      },
      {
        label: 'a negative wire revision',
        over: { wire_rev: -1 },
        constraint: 'account_freeholds_wire_rev_nonnegative',
      },
      {
        label: 'a condition past 100',
        over: { condition: 101 },
        constraint: 'account_freeholds_condition_range',
      },
      {
        label: 'a negative condition',
        over: { condition: -1 },
        constraint: 'account_freeholds_condition_range',
      },
      {
        label: 'an empty tier',
        over: { tier: '' },
        constraint: 'account_freeholds_tier_shape',
      },
      {
        label: 'a tier past 64 characters',
        over: { tier: 'x'.repeat(65) },
        constraint: 'account_freeholds_tier_shape',
      },
      {
        label: 'an empty visit policy',
        over: { visit_policy: '' },
        constraint: 'account_freeholds_visit_policy_shape',
      },
      {
        label: 'a visit policy past 32 characters',
        over: { visit_policy: 'x'.repeat(33) },
        constraint: 'account_freeholds_visit_policy_shape',
      },
      {
        label: 'an empty upkeep binding',
        over: { upkeep_binding: '' },
        constraint: 'account_freeholds_upkeep_binding_shape',
      },
      {
        label: 'an upkeep binding past 32 characters',
        over: { upkeep_binding: 'x'.repeat(33) },
        constraint: 'account_freeholds_upkeep_binding_shape',
      },
      {
        label: 'a layout that is an object, not a list',
        over: { layout: '{}' },
        constraint: 'account_freeholds_layout_array',
      },
      {
        label: 'trophies that are an object, not a list',
        over: { trophies: '{}' },
        constraint: 'account_freeholds_trophies_array',
      },
      {
        label: 'an unbound row carrying an upkeep checkpoint',
        over: { upkeep_checkpoint: '{"day":1}' },
        constraint: 'account_freeholds_unbound_carries_no_upkeep',
      },
      {
        label: 'an unbound row carrying an upkeep credit',
        over: { upkeep_credit: '{"weeks":2}' },
        constraint: 'account_freeholds_unbound_carries_no_upkeep',
      },
    ];

    for (const { label, over, constraint } of cases) {
      // Exactly ONE field differs from BASE_ROW in every case, so the refusal
      // is attributable to that field and to no other.
      expect(Object.keys(over), label).toHaveLength(1);
      const error = await pool
        .query(RAW_INSERT, RAW_INSERT_VALUES(over))
        .then(() => null)
        .catch((err: { code?: string; constraint?: string }) => err);
      expect(error, `${label} must be refused`).not.toBeNull();
      expect(error?.code, label).toBe('23514');
      expect(error?.constraint, label).toBe(constraint);
    }
    // And the other arm of the upkeep rule: a BOUND row may carry both stamps.
    await expect(
      pool.query(
        RAW_INSERT,
        RAW_INSERT_VALUES({
          upkeep_binding: 'bound_v1',
          upkeep_checkpoint: '{"day":1}',
          upkeep_credit: '{"weeks":2}',
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('refuses one plot identity answering for two different accounts', async () => {
    await pool.query(RAW_INSERT, RAW_INSERT_VALUES({ account_id: 1 }));
    const error = await pool
      .query(RAW_INSERT, RAW_INSERT_VALUES({ account_id: 2 }))
      .then(() => null)
      .catch((err: { code?: string; constraint?: string }) => err);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23505');
    expect(error?.constraint).toBe('account_freeholds_plot_id');
    // Two accounts may each own a plot; it is the shared IDENTITY that refuses.
    await expect(
      pool.query(RAW_INSERT, RAW_INSERT_VALUES({ account_id: 2, plot_id: 'plot:second' })),
    ).resolves.toBeDefined();
  });

  it('inserts, reads back, and advances the durable revision', async () => {
    const insert = recorder(pool);
    const inserted = await db.upsertFreehold(insert.db, {
      accountId,
      plotIndex: db.FREEHOLD_PRIMARY_PLOT_INDEX,
      plotId: db.mintFreeholdPlotId(),
      tier: 'cottage',
      layoutJson: JSON.stringify([{ placementId: 1, itemId: 'chair', x: 1, y: 0, z: 2, yaw: 0 }]),
      trophiesJson: JSON.stringify([{ plinth: 0, trophyId: 'skull' }]),
      condition: 88,
      visitPolicy: 'friends',
      wireRev: 4,
      expectedDurableRev: null,
    });
    expect(inserted).toEqual({ kind: 'inserted', durableRev: '1' });
    // One statement for the whole write, no probe before it.
    expect(insert.calls).toHaveLength(1);

    const read = recorder(pool);
    const load = await db.freeholdForAccount(read.db, accountId, 64 * 1024);
    expect(read.calls).toHaveLength(1);
    if (load.kind !== 'row') throw new Error(`expected a row, got ${load.kind}`);
    expect(load.row.tier).toBe('cottage');
    expect(load.row.condition).toBe(88);
    expect(load.row.visitPolicy).toBe('friends');
    expect(load.row.durableRev).toBe('1');
    expect(load.row.wireRev).toBe('4');
    expect(load.row.upkeepBinding).toBe(db.FREEHOLD_UPKEEP_BINDING_UNBOUND);
    expect(load.row.layout).toEqual([
      { placementId: 1, itemId: 'chair', x: 1, y: 0, z: 2, yaw: 0 },
    ]);
    expect(load.row.ownedBytes).toBeGreaterThan(0);

    const updated = await db.upsertFreehold(pool, {
      accountId,
      plotIndex: db.FREEHOLD_PRIMARY_PLOT_INDEX,
      plotId: load.row.plotId,
      tier: 'lodge',
      layoutJson: '[]',
      trophiesJson: '[]',
      condition: 70,
      visitPolicy: 'open',
      wireRev: 5,
      expectedDurableRev: load.row.durableRev,
    });
    expect(updated).toEqual({ kind: 'updated', durableRev: '2' });

    // The same fence a second time is a stale save, and it wrote nothing.
    const stale = await db.upsertFreehold(pool, {
      accountId,
      plotIndex: db.FREEHOLD_PRIMARY_PLOT_INDEX,
      plotId: load.row.plotId,
      tier: 'citadel',
      layoutJson: '[]',
      trophiesJson: '[]',
      condition: 10,
      visitPolicy: 'closed',
      wireRev: 99,
      expectedDurableRev: load.row.durableRev,
    });
    expect(stale).toEqual({ kind: 'stale', durableRev: '2' });
    const after = await storedRow(accountId);
    expect(after?.tier).toBe('lodge');
    expect(after?.durable_rev).toBe('2');
    expect(after?.wire_rev).toBe('5');

    // And the vanished-target arm, on a slot that never existed.
    const missing = await db.upsertFreehold(pool, {
      accountId,
      plotIndex: 7,
      plotId: 'plot:nowhere',
      tier: 'lodge',
      layoutJson: '[]',
      trophiesJson: '[]',
      condition: 70,
      visitPolicy: 'open',
      wireRev: 1,
      expectedDurableRev: '1',
    });
    expect(missing).toEqual({ kind: 'missing' });
  });

  it('never lets two saves from one revision both win', async () => {
    await pool.query(RAW_INSERT, RAW_INSERT_VALUES({ tier: 'cottage' }));
    const winnerClient = await pool.connect();
    const loserClient = await pool.connect();
    let loser: Awaited<ReturnType<typeof db.upsertFreehold>> | null = null;
    try {
      await winnerClient.query('BEGIN');
      await loserClient.query('BEGIN');
      const save = (tier: string) => ({
        accountId,
        plotIndex: db.FREEHOLD_PRIMARY_PLOT_INDEX,
        plotId: PLOT_ID,
        tier,
        layoutJson: '[]',
        trophiesJson: '[]',
        condition: 50,
        visitPolicy: 'closed',
        wireRev: 1,
        expectedDurableRev: '1',
      });
      const winner = await db.upsertFreehold(winnerClient, save('manor'));
      expect(winner).toEqual({ kind: 'updated', durableRev: '2' });

      // The loser's UPDATE reaches the row lock and BLOCKS on the uncommitted
      // winner. Proving it actually waited is what makes this a race rather
      // than two sequential saves that happen to produce the same answer.
      const pending = db.upsertFreehold(loserClient, save('keep'));
      let blocked = false;
      for (let attempt = 0; attempt < 200 && !blocked; attempt++) {
        const waiting = await pool.query(
          `SELECT count(*)::int AS n FROM pg_stat_activity
            WHERE application_name = $1 AND state = 'active' AND wait_event_type = 'Lock'`,
          [SCHEMA],
        );
        blocked = Number(waiting.rows[0].n) > 0;
        if (!blocked) await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);

      await winnerClient.query('COMMIT');
      loser = await pending;
      await loserClient.query('COMMIT');
    } finally {
      winnerClient.release();
      loserClient.release();
    }
    // Exactly one winner: the loser re-evaluated the row after the commit, found
    // the fence moved, and reports the CURRENT revision so its caller can rebase.
    expect(loser).toEqual({ kind: 'stale', durableRev: '2' });
    const after = await storedRow(accountId);
    expect(after?.tier).toBe('manor');
    expect(after?.durable_rev).toBe('2');
  });

  it('cascades with its account and survives character deletion', async () => {
    const created = await pool.query('INSERT INTO accounts DEFAULT VALUES RETURNING id');
    const doomed = Number(created.rows[0].id);
    const character = await pool.query(
      'INSERT INTO characters (account_id) VALUES ($1) RETURNING id',
      [doomed],
    );
    await pool.query(RAW_INSERT, RAW_INSERT_VALUES({ account_id: doomed }));

    // Character deletion preserves account housing: a player who deletes every
    // character must still find the home they built when they roll a new one.
    await pool.query('DELETE FROM characters WHERE id = $1', [Number(character.rows[0].id)]);
    expect(await storedRow(doomed)).toBeDefined();

    // The account cascade is the ONE removal path this table has.
    await pool.query('DELETE FROM accounts WHERE id = $1', [doomed]);
    expect(await storedRow(doomed)).toBeUndefined();
  });

  it('nulls oversized owned content in SQL and leaves the stored row untouched', async () => {
    const layout = Array.from({ length: 400 }, (_, i) => ({
      placementId: i + 1,
      itemId: `furnishing_${i}`,
      x: i,
      y: 0,
      z: -i,
      yaw: 0,
    }));
    await db.upsertFreehold(pool, {
      accountId,
      plotIndex: db.FREEHOLD_PRIMARY_PLOT_INDEX,
      plotId: PLOT_ID,
      tier: 'manor',
      layoutJson: JSON.stringify(layout),
      trophiesJson: JSON.stringify([{ plinth: 0, trophyId: 'skull' }]),
      condition: 100,
      visitPolicy: 'closed',
      wireRev: 1,
      expectedDurableRev: null,
    });
    const before = await storedRow(accountId);
    const storedBytes = Number(before?.layout_bytes ?? 0) + Number(before?.trophies_bytes ?? 0);
    expect(before?.layout_rows).toBe(400);
    expect(storedBytes).toBeGreaterThan(4096);

    const capture = recorder(pool);
    const load = await db.freeholdForAccount(capture.db, accountId, 4096);
    if (load.kind !== 'oversize') throw new Error(`expected oversize, got ${load.kind}`);
    expect(load.bytes).toBe(storedBytes);
    expect(load.limit).toBe(4096);
    expect(load.plotId).toBe(PLOT_ID);
    expect(load.durableRev).toBe('1');

    // The content never crossed the wire: re-run the EXACT statement the module
    // sent and look at what PostgreSQL actually handed back.
    const echoed = await pool.query(capture.calls[0].text, capture.calls[0].values);
    expect(echoed.rows[0].layout).toBeNull();
    expect(echoed.rows[0].trophies).toBeNull();
    expect(Number(echoed.rows[0].owned_bytes)).toBe(storedBytes);

    // Refusing to load is not a licence to alter: the row is byte-identical.
    expect(await storedRow(accountId)).toEqual(before);

    // The other arm: a bound above the row loads the whole layout.
    const loaded = await db.freeholdForAccount(pool, accountId, storedBytes);
    if (loaded.kind !== 'row') throw new Error(`expected a row, got ${loaded.kind}`);
    expect(Array.isArray(loaded.row.layout)).toBe(true);
    expect((loaded.row.layout as unknown[]).length).toBe(400);

    // And the subject-access read hands the oversized content out AS STORED.
    const exported = await db.freeholdsForExport(pool, accountId);
    expect(exported).toHaveLength(1);
    expect((exported[0].layout as unknown[]).length).toBe(400);
    expect(exported[0].plot_id).toBe(PLOT_ID);
    expect(exported[0].upkeep_binding).toBe(db.FREEHOLD_UPKEEP_BINDING_UNBOUND);
    expect(await db.freeholdsForExport(pool, 2)).toEqual([]);
  });

  it('refuses a row past the on-disk pre-gate WITHOUT rendering it to text', async () => {
    // The cost this gate exists to stop is real and reachable: the recovery
    // contract's own rollback case is a later release writing a row this build
    // then has to read. octet_length must fully DETOAST the column and render
    // the whole value before the authoritative bound can be applied, so without
    // a pre-gate the bound protects the client and not the database, at roughly
    // ten microseconds of database CPU per KB of stored text, on a login, while
    // holding one background permit and one pool client.
    //
    // Deterministic pseudo-random ids, so the row genuinely does not compress:
    // a compressible fixture would understate its own on-disk size and could
    // pass this test while never crossing the gate.
    let seed = 123_456_789;
    const nextId = (): string => {
      let out = '';
      while (out.length < 64) {
        seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
        out += seed.toString(36);
      }
      return out.slice(0, 64);
    };
    const huge = Array.from({ length: 4_000 }, (_unused, i) => ({
      placementId: i,
      itemId: nextId(),
      x: -0.0000012345678901234567,
      y: -0.0000012345678901234567,
      z: -0.0000012345678901234567,
      yaw: -0.0000012345678901234567,
    }));
    // Written through raw SQL on purpose: upsertFreehold is not the path that
    // produces such a row, a wider future release is.
    await pool.query(
      RAW_INSERT,
      RAW_INSERT_VALUES({ layout: JSON.stringify(huge), trophies: '[]' }),
    );

    const stored = await pool.query(
      `SELECT pg_column_size(layout) + pg_column_size(trophies) AS disk,
              octet_length(layout::text) + octet_length(trophies::text) AS text
         FROM ${SCHEMA}.account_freeholds WHERE account_id = $1`,
      [accountId],
    );
    const disk = Number(stored.rows[0].disk);
    const text = Number(stored.rows[0].text);
    // Anti-vacuity for the fixture: it must really be past the gate, and its
    // text form must really be far bigger than the stored ceiling, or the case
    // proves nothing.
    expect(disk).toBeGreaterThan(db.FREEHOLD_STORED_DETOAST_GATE_BYTES);
    expect(text).toBeGreaterThan(FREEHOLD_MAX_STORED_BYTES);

    const capture = recorder(pool);
    const load = await db.freeholdForAccount(capture.db, accountId, FREEHOLD_MAX_STORED_BYTES);
    if (load.kind !== 'oversize') throw new Error(`expected oversize, got ${load.kind}`);
    // The decisive assertion: NO text length was measured, because none was
    // rendered. A refusal that reported a number here would have paid for it.
    expect(load.detoastRefused).toBe(true);
    expect(load.bytes).toBe(0);
    expect(load.diskBytes).toBe(disk);

    // And the executed plans agree. The module's own statement touches far
    // fewer buffers than the same statement with the gate removed, because the
    // removed-gate form has to read the TOAST pages to build the text.
    const gatedPlan = await pool.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${capture.calls[0].text}`,
      capture.calls[0].values,
    );
    const ungatedPlan = await pool.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
       SELECT COALESCE(octet_length(f.layout::text), 0) AS owned_bytes
         FROM ${SCHEMA}.account_freeholds f WHERE f.account_id = $1`,
      [accountId],
    );
    const buffersOf = (res: { rows: Record<string, unknown>[] }): number => {
      const walk = (node: Record<string, unknown>): number => {
        let total =
          Number(node['Shared Hit Blocks'] ?? 0) + Number(node['Shared Read Blocks'] ?? 0);
        for (const child of (node.Plans as Record<string, unknown>[] | undefined) ?? []) {
          total += walk(child);
        }
        return total;
      };
      return walk(rootPlanFromExplainRow(res.rows[0]) as unknown as Record<string, unknown>);
    };
    expect(buffersOf(gatedPlan)).toBeLessThan(buffersOf(ungatedPlan));

    // Refusing to read is not a licence to alter: the row is still there.
    const after = await pool.query(
      `SELECT jsonb_array_length(layout) AS rows FROM ${SCHEMA}.account_freeholds
        WHERE account_id = $1`,
      [accountId],
    );
    expect(Number(after.rows[0].rows)).toBe(4_000);
  });

  it('round-trips the maximal legal record through jsonb and reads it back as a row', async () => {
    // THE DECISIVE PROOF that writable implies readable. jsonb is not a byte
    // copy of the text that went in: it re-renders every object with a space
    // after each colon and each comma, and it stores every JSON number as
    // `numeric`. So the SQL bound measures a WIDER text than the canonical JSON
    // FREEHOLD_MAX_OWNED_BYTES bounds, and handing the canonical number to the
    // read would classify the largest record this realm is allowed to write as
    // permanently oversize. Only an executed round trip can settle that.
    const admitted = normalizeFreehold(maximalLegalFreeholdRecord(), MAXIMAL_FREEHOLD_OPTS);
    if (admitted.kind !== 'loaded') throw new Error(`fixture refused: ${admitted.kind}`);
    const state = admitted.state;

    // The fixture's identities sit exactly at the STORED column ceilings, so a
    // future widening of either constant without a re-measure fails here.
    expect(MAXIMAL_FREEHOLD_TIER.length).toBe(db.FREEHOLD_TIER_COLUMN_MAX_LENGTH);
    expect(MAXIMAL_FREEHOLD_POLICY.length).toBe(db.FREEHOLD_VISIT_POLICY_COLUMN_MAX_LENGTH);

    await db.upsertFreehold(pool, {
      accountId,
      plotIndex: db.FREEHOLD_PRIMARY_PLOT_INDEX,
      plotId: state.plotId,
      tier: state.tier,
      layoutJson: JSON.stringify(state.layout),
      trophiesJson: JSON.stringify(state.trophies),
      condition: state.condition,
      visitPolicy: state.visitPolicy,
      wireRev: state.rev,
      expectedDurableRev: null,
    });

    // What PostgreSQL actually stores, measured the way the read bound measures
    // it. The unit suite computes this same number from the canonical JSON plus
    // the separators jsonb re-renders; this is the executed half of that pair.
    const stored = await storedRow(accountId);
    const storedBytes = Number(stored?.layout_bytes ?? 0) + Number(stored?.trophies_bytes ?? 0);
    expect(storedBytes).toBe(106_032);
    expect(storedBytes).toBeGreaterThan(persistedFreeholdBytes(state));
    expect(storedBytes).toBeLessThanOrEqual(FREEHOLD_MAX_STORED_BYTES);

    // The bound the store actually passes ADMITS it.
    const load = await db.freeholdForAccount(pool, accountId, FREEHOLD_MAX_STORED_BYTES);
    if (load.kind !== 'row') throw new Error(`expected a row, got ${load.kind}`);
    expect((load.row.layout as unknown[]).length).toBe(FREEHOLD_MAX_LAYOUT_ROWS);
    expect((load.row.trophies as unknown[]).length).toBe(FREEHOLD_MAX_TROPHY_ROWS);

    // And every worst-case number survives the numeric round trip EXACTLY, so
    // the positional codec rule is proved against the engine rather than
    // asserted: a coordinate that came back re-rendered would change the
    // record's bytes on the next save and drift the ceiling.
    expect(load.row.layout).toEqual(state.layout);
    expect(load.row.trophies).toEqual(state.trophies);
    expect(load.row.wireRev).toBe(String(MAXIMAL_FREEHOLD_REV));

    // The regression witness: the CANONICAL ceiling refuses this row. If a
    // future edit hands FREEHOLD_MAX_OWNED_BYTES back to the SQL read, the
    // maximal record becomes permanently unreadable, and this arm says so.
    const wrongBound = await db.freeholdForAccount(pool, accountId, FREEHOLD_MAX_OWNED_BYTES);
    expect(wrongBound.kind).toBe('oversize');

    // Re-normalizing what came back off disk loads again: the record survives a
    // full write, store, read, normalize cycle without crossing a ceiling.
    const reloaded = normalizeFreehold(
      {
        version: load.row.schemaVersion,
        plotId: load.row.plotId,
        tier: load.row.tier,
        layout: load.row.layout,
        trophies: load.row.trophies,
        condition: load.row.condition,
        visitPolicy: load.row.visitPolicy,
        rev: Number(load.row.wireRev),
      },
      MAXIMAL_FREEHOLD_OPTS,
    );
    expect(reloaded.kind).toBe('loaded');
  });

  it('reaches the primary key for the account read, never a sequential scan', async () => {
    await pool.query(RAW_INSERT, RAW_INSERT_VALUES());
    const capture = recorder(pool);
    await db.freeholdForAccount(capture.db, accountId, 64 * 1024);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // A test table holding a handful of rows is cheaper to read whole, so the
      // planner is RIGHT to pick a Seq Scan here and the plan would prove
      // nothing. enable_seqscan = off (transaction-scoped, rolled back below)
      // asks the question this pin actually cares about: CAN account_id = $1 be
      // served by an index, and is that index the primary key rather than a
      // second one somebody added? Seeding tens of thousands of rows to make the
      // index attractive on cost would prove the same thing far more slowly and
      // would still drift with planner settings.
      await client.query('SET LOCAL enable_seqscan = off');
      const readPlan = rootPlanFromExplainRow(
        (
          await client.query(
            `EXPLAIN (FORMAT JSON) ${capture.calls[0].text}`,
            capture.calls[0].values,
          )
        ).rows[0],
      );
      const readCheck = checkRelationUsesPartialIndex(
        readPlan,
        'account_freeholds',
        'account_freeholds_pkey',
      );
      expect(readCheck.ok, readCheck.reason).toBe(true);

      // The same key serves the accounts ON DELETE CASCADE probe, which is the
      // whole reason no separate account_id index exists.
      const cascadePlan = rootPlanFromExplainRow(
        (
          await client.query(
            `EXPLAIN (FORMAT JSON) SELECT 1 FROM account_freeholds WHERE account_id = $1`,
            [accountId],
          )
        ).rows[0],
      );
      const cascadeCheck = checkRelationUsesPartialIndex(
        cascadePlan,
        'account_freeholds',
        'account_freeholds_pkey',
      );
      expect(cascadeCheck.ok, cascadeCheck.reason).toBe(true);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
