// The EXECUTED proof for server/freehold_hearth_db.ts against real PostgreSQL
// (the novel-SQL rule: a fake client cannot tell whether the DDL parses,
// whether two same-account entries really serialize, whether a rollback really
// leaves the counters alone, or whether GREATEST really clamps a replayed
// epoch). The PG16 shard provides TEST_DATABASE_URL; a local run without it
// skips and the always-on text pins in freehold_hearth_db.test.ts still stand.
//
// The FK parents are MINIMAL STAND-INS (id-only accounts, plus a characters
// table that exists only so the character-deletion arm has something real to
// delete): this suite proves the account_freehold_hearth DDL and its four
// statements, not the core schema, and the production parents exist long
// before ensureSchema reaches this module.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL ?? '';
const d = url === '' ? describe.skip : describe;

// A PRIVATE schema, the repo idiom for every database-gated suite. It is not
// tidiness: this suite DROPS its schema in both beforeAll and afterAll, and the
// module functions it drives issue UNQUALIFIED SQL, so without an isolated
// search_path a developer who points TEST_DATABASE_URL at a database that
// already carries the game schema (the documented dev database is on the same
// 127.0.0.1:5433 this harness uses) would destroy the REAL
// account_freehold_hearth table. That table is keep-forever by design: every
// dropped row is a free ready Hearth Key for an account that had one on
// cooldown, and nothing can reconstruct it.
const SCHEMA = 'freehold_hearth_pg_test';

const COOLDOWN_MS = 900_000;
const READY_ACCOUNT = 1;
const RACE_ACCOUNT = 2;
const CASCADE_ACCOUNT = 3;
const CHARACTER_ACCOUNT = 4;
const EXPORT_ACCOUNT = 5;
const ROLLBACK_ACCOUNT = 6;
const STALE_ACCOUNT = 7;
const FIRST_USE_RACE_ACCOUNT = 8;
const CHECK_ACCOUNT = 9;
const ROW_LOCK_RACE_ACCOUNT = 10;
const NUMERIC_PARSER_ACCOUNT = 11;

d('account_freehold_hearth against real PostgreSQL', () => {
  // Imported lazily so the suite skips clean without pg installed state.
  let pool: import('pg').Pool;
  let probe: import('pg').Pool;
  let db: typeof import('../../server/freehold_hearth_db');
  let hearthSchema: string;

  /** The waiter's pid and the statement it is stuck on, or null while nothing
   *  is blocked by `holderPid`. Polled on the WAITER on purpose: a holder's own
   *  pg_stat_activity row reports the last statement it ran and looks frozen
   *  for the rest of its transaction, so it can never tell us who is waiting. */
  async function blockedBy(
    holderPid: number,
  ): Promise<{ pid: number; query: string; waitEvent: string } | null> {
    const waiting = await probe.query(
      `SELECT pid, query, wait_event_type || ':' || COALESCE(wait_event, '') AS wait_event
         FROM pg_stat_activity
        WHERE datname = current_database()
          AND application_name = $1
          AND wait_event_type = 'Lock'
          AND $2::int = ANY(pg_blocking_pids(pid))
        ORDER BY pid
        LIMIT 1`,
      [SCHEMA, holderPid],
    );
    const row = waiting.rows[0];
    return row
      ? { pid: Number(row.pid), query: String(row.query), waitEvent: String(row.wait_event) }
      : null;
  }

  async function waitForBlock(holderPid: number, budgetMs = 5_000) {
    const started = Date.now();
    for (;;) {
      const blocked = await blockedBy(holderPid);
      if (blocked) return { ...blocked, waitedMs: Date.now() - started };
      if (Date.now() - started > budgetMs) return null;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }

  const backendPid = async (client: import('pg').PoolClient): Promise<number> =>
    Number((await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);

  const readRow = async (accountId: number) =>
    (
      await pool.query(
        `SELECT ready_at_ms::text AS ready_at_ms, revision::text AS revision
           FROM account_freehold_hearth WHERE account_id = $1`,
        [accountId],
      )
    ).rows[0] ?? null;

  beforeAll(async () => {
    const { Pool } = await import('pg');
    db = await import('../../server/freehold_hearth_db');
    // search_path is a STARTUP option so the module functions, which take the
    // pool or a pooled client and issue unqualified SQL, land in the private
    // schema. max 4 covers the race (two contenders) with headroom; the probe
    // pool is separate so polling can never queue behind a blocked contender.
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
    probe = new Pool({
      connectionString: url,
      max: 1,
      options: `-c search_path=${SCHEMA}`,
      application_name: `${SCHEMA}_probe`,
      statement_timeout: 15_000,
    });
    await pool.query('CREATE TABLE accounts (id SERIAL PRIMARY KEY)');
    await pool.query(
      `CREATE TABLE characters (
         id SERIAL PRIMARY KEY,
         account_id INT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
       )`,
    );
    await pool.query(
      `INSERT INTO accounts (id)
       VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11)`,
    );
    await pool.query('INSERT INTO characters (id, account_id) VALUES (1, $1), (2, $1)', [
      CHARACTER_ACCOUNT,
    ]);
    // The DDL executes for real, TWICE: idempotency is part of the contract
    // (ensureSchema re-runs every fragment at every boot).
    hearthSchema = db.freeholdHearthSchema(SCHEMA);
    await pool.query(hearthSchema);
    await pool.query(hearthSchema);
  }, 30_000);

  afterAll(async () => {
    if (probe) await probe.end();
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

  it("runs entirely inside its private schema, never the caller's default", async () => {
    const where = await pool.query('SELECT current_schema() AS s');
    expect(where.rows[0].s).toBe(SCHEMA);
    // SCOPED TO THIS SCHEMA, the way the plot suite beside it already is. An
    // unfiltered catalog query asserts that NO other schema holds a table of
    // this name, which is false on the documented recipe: TEST_DATABASE_URL is
    // pointed at a database that already carries the game schema, so `public`
    // holds one legitimately, and any concurrent tenant holds one too. It went
    // red on exactly that, in a full-suite run where another suite applied the
    // real schema first.
    const owner = await pool.query(
      `SELECT schemaname FROM pg_tables
        WHERE tablename = 'account_freehold_hearth' AND schemaname = current_schema()`,
    );
    expect(owner.rows.map((r: { schemaname: string }) => r.schemaname)).toEqual([SCHEMA]);
    // ANTI-VACUITY for the filter: the unqualified name this suite's own pool
    // resolves must be the private one, which is the property `current_schema()`
    // filtering could otherwise hide.
    const resolved = await pool.query(
      `SELECT n.nspname AS schema
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.oid = to_regclass('account_freehold_hearth')`,
    );
    expect(resolved.rows[0].schema).toBe(SCHEMA);
  });

  it('applies a third time with no error, and installs exactly one index', async () => {
    await expect(pool.query(hearthSchema)).resolves.toBeTruthy();
    // The primary key IS the foreign key column, so the account delete cascade
    // is already index-backed. A second index here would be dead weight.
    const indexes = await pool.query(
      `SELECT indexname FROM pg_indexes
        WHERE schemaname = $1 AND tablename = 'account_freehold_hearth'
        ORDER BY indexname`,
      [SCHEMA],
    );
    expect(indexes.rows.map((r: { indexname: string }) => r.indexname)).toEqual([
      'account_freehold_hearth_pkey',
    ]);
    const key = await pool.query(
      `SELECT a.attname
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      [`${SCHEMA}.account_freehold_hearth`],
    );
    expect(key.rows.map((r: { attname: string }) => r.attname)).toEqual(['account_id']);
  });

  it("restores the caller's in-flight search_path after the fragment", async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL search_path = pg_catalog, pg_temp');
      await client.query(hearthSchema);
      const after = await client.query('SELECT current_setting($1) AS p', ['search_path']);
      expect(after.rows[0].p).toBe('pg_catalog, pg_temp');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('refuses a negative ready_at_ms, by its named constraint', async () => {
    // One field bad, the other left valid: a single merged constraint would
    // pass one of this pair.
    await expect(
      pool.query(
        `INSERT INTO account_freehold_hearth (account_id, ready_at_ms, revision)
         VALUES ($1, -1, 0)`,
        [CHECK_ACCOUNT],
      ),
    ).rejects.toMatchObject({
      code: '23514',
      constraint: 'account_freehold_hearth_ready_nonnegative',
    });
    expect(await readRow(CHECK_ACCOUNT)).toBeNull();
  });

  it('refuses a negative revision, by its named constraint', async () => {
    await expect(
      pool.query(
        `INSERT INTO account_freehold_hearth (account_id, ready_at_ms, revision)
         VALUES ($1, 0, -1)`,
        [CHECK_ACCOUNT],
      ),
    ).rejects.toMatchObject({
      code: '23514',
      constraint: 'account_freehold_hearth_revision_nonnegative',
    });
    expect(await readRow(CHECK_ACCOUNT)).toBeNull();
  });

  it('accepts the exact row the two check negatives corrupt, then removes it', async () => {
    await pool.query(
      `INSERT INTO account_freehold_hearth (account_id, ready_at_ms, revision) VALUES ($1, 0, 0)`,
      [CHECK_ACCOUNT],
    );
    expect(await readRow(CHECK_ACCOUNT)).toEqual({ ready_at_ms: '0', revision: '0' });
    await pool.query('DELETE FROM account_freehold_hearth WHERE account_id = $1', [CHECK_ACCOUNT]);
  });

  it('loads truly absent state as absent, and creates no row doing it', async () => {
    expect(await db.loadFreeholdHearth(pool, READY_ACCOUNT)).toEqual({ kind: 'absent' });
    expect(await readRow(READY_ACCOUNT)).toBeNull();
    expect(db.ABSENT_FREEHOLD_HEARTH).toEqual({ readyAtMs: '0', revision: '0' });
  });

  it('initializes lazily from truly absent state and advances, inside one transaction', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const before = await client.query(
        'SELECT count(*)::int AS n FROM account_freehold_hearth WHERE account_id = $1',
        [READY_ACCOUNT],
      );
      expect(before.rows[0].n).toBe(0);
      const advanced = await db.advanceFreeholdHearthOnClient(client, READY_ACCOUNT, COOLDOWN_MS);
      expect(advanced.kind).toBe('advanced');
      if (advanced.kind !== 'advanced') throw new Error('unreachable');
      // First use: revision 0 became 1, and ready_at_ms is the transaction
      // epoch plus the cooldown, to the millisecond.
      expect(advanced.revision).toBe('1');
      expect(BigInt(advanced.readyAtMs)).toBe(BigInt(advanced.nowMs) + BigInt(COOLDOWN_MS));
      // Uncommitted: a fresh connection still sees nothing.
      expect(await readRow(READY_ACCOUNT)).toBeNull();
      await client.query('COMMIT');
    } finally {
      client.release();
    }
    // Commit before acknowledge: the value is visible to a fresh connection.
    const durable = await readRow(READY_ACCOUNT);
    expect(durable).not.toBeNull();
    expect(durable?.revision).toBe('1');
    const load = await db.loadFreeholdHearth(pool, READY_ACCOUNT);
    expect(load).toEqual({
      kind: 'state',
      state: { readyAtMs: durable?.ready_at_ms, revision: '1' },
    });
    // Still on cooldown, so a second entry in a NEW transaction refuses.
    const second = await pool.connect();
    try {
      await second.query('BEGIN');
      const refused = await db.advanceFreeholdHearthOnClient(second, READY_ACCOUNT, COOLDOWN_MS);
      expect(refused.kind).toBe('cooldown');
      await second.query('COMMIT');
    } finally {
      second.release();
    }
    expect(await readRow(READY_ACCOUNT)).toEqual(durable);
  });

  it('leaves both counters exactly as they were when the caller rolls back', async () => {
    const seed = await pool.connect();
    try {
      await seed.query('BEGIN');
      expect((await db.advanceFreeholdHearthOnClient(seed, ROLLBACK_ACCOUNT, 0)).kind).toBe(
        'advanced',
      );
      await seed.query('COMMIT');
    } finally {
      seed.release();
    }
    const before = await readRow(ROLLBACK_ACCOUNT);
    expect(before?.revision).toBe('1');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Cooldown 0, so this one is eligible and really does write.
      const advanced = await db.advanceFreeholdHearthOnClient(client, ROLLBACK_ACCOUNT, 0);
      expect(advanced.kind).toBe('advanced');
      if (advanced.kind !== 'advanced') throw new Error('unreachable');
      expect(advanced.revision).toBe('2');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    // The advance rode the caller's transaction and died with it: no revision
    // burned, no ready_at_ms moved.
    expect(await readRow(ROLLBACK_ACCOUNT)).toEqual(before);
  });

  it('serializes a steady-state same-account race: exactly one advances', async () => {
    const seed = await pool.connect();
    try {
      await seed.query('BEGIN');
      expect((await db.advanceFreeholdHearthOnClient(seed, RACE_ACCOUNT, 0)).kind).toBe('advanced');
      await seed.query('COMMIT');
    } finally {
      seed.release();
    }
    const before = await readRow(RACE_ACCOUNT);

    const winner = await pool.connect();
    const loser = await pool.connect();
    try {
      await winner.query('BEGIN');
      await loser.query('BEGIN');
      const winnerPid = await backendPid(winner);
      const loserPid = await backendPid(loser);
      const winnerResult = await db.advanceFreeholdHearthOnClient(
        winner,
        RACE_ACCOUNT,
        COOLDOWN_MS,
      );
      expect(winnerResult.kind).toBe('advanced');

      // The loser now runs the same entry against the same account. It must
      // NOT be allowed to observe the pre-advance row.
      const started = Date.now();
      const loserPromise = db.advanceFreeholdHearthOnClient(loser, RACE_ACCOUNT, COOLDOWN_MS);
      const blocked = await waitForBlock(winnerPid);
      expect(blocked).not.toBeNull();
      expect(blocked?.pid).toBe(loserPid);
      // The row lock in the locking read is what orders two entries. (The
      // accounts participant lock is FOR KEY SHARE and self-compatible by
      // design, which is exactly why it does not block a concurrent character
      // save either.)
      // MEASURED, not assumed: with the winner's UPDATE already written, the
      // loser queues at the conflict-safe INSERT, one statement earlier than
      // the locking read. ON CONFLICT DO NOTHING must wait on the winning
      // transaction id before it can decide whether its conflicting tuple
      // survives. (The accounts participant lock is NOT where the queue forms:
      // FOR KEY SHARE is self-compatible by design, which is exactly why it
      // does not block a concurrent character save either. The row lock in the
      // locking read is the other serialization point, driven on its own
      // below.)
      expect(blocked?.query).toContain('INSERT INTO account_freehold_hearth');
      expect(blocked?.query).toContain('ON CONFLICT (account_id) DO NOTHING');
      expect(blocked?.waitEvent).toBe('Lock:transactionid');

      await winner.query('COMMIT');
      const loserResult = await loserPromise;
      const elapsedMs = Date.now() - started;
      expect(loserResult.kind).toBe('cooldown');
      if (loserResult.kind !== 'cooldown') throw new Error('unreachable');
      if (winnerResult.kind !== 'advanced') throw new Error('unreachable');
      // The loser reads the ADVANCED value, not the value it would have seen
      // before the winner committed.
      expect(loserResult.readyAtMs).toBe(winnerResult.readyAtMs);
      expect(loserResult.revision).toBe(winnerResult.revision);
      expect(loserResult.readyAtMs).not.toBe(before?.ready_at_ms);
      await loser.query('COMMIT');
      // Exactly one advance landed: revision moved by one, not two.
      const after = await readRow(RACE_ACCOUNT);
      expect(after?.revision).toBe(String(BigInt(before?.revision ?? '0') + 1n));
      expect(after?.ready_at_ms).toBe(winnerResult.readyAtMs);
      expect(blocked?.waitedMs).toBeLessThan(5_000);
      expect(elapsedMs).toBeLessThan(15_000);
    } finally {
      await winner.query('ROLLBACK').catch(() => {});
      await loser.query('ROLLBACK').catch(() => {});
      winner.release();
      loser.release();
    }
  }, 30_000);

  it('serializes a FIRST-USE same-account race on the conflict-safe insert', async () => {
    expect(await readRow(FIRST_USE_RACE_ACCOUNT)).toBeNull();
    const winner = await pool.connect();
    const loser = await pool.connect();
    try {
      await winner.query('BEGIN');
      await loser.query('BEGIN');
      const winnerPid = await backendPid(winner);
      const loserPid = await backendPid(loser);
      const winnerResult = await db.advanceFreeholdHearthOnClient(
        winner,
        FIRST_USE_RACE_ACCOUNT,
        COOLDOWN_MS,
      );
      expect(winnerResult.kind).toBe('advanced');

      const loserPromise = db.advanceFreeholdHearthOnClient(
        loser,
        FIRST_USE_RACE_ACCOUNT,
        COOLDOWN_MS,
      );
      const blocked = await waitForBlock(winnerPid);
      expect(blocked).not.toBeNull();
      expect(blocked?.pid).toBe(loserPid);
      // With no row yet, the block lands on the speculative insert, one
      // statement earlier than the steady-state race above. Both arms end the
      // same way: exactly one entry advances.
      expect(blocked?.query).toContain('INSERT INTO account_freehold_hearth');
      expect(blocked?.query).toContain('ON CONFLICT (account_id) DO NOTHING');

      await winner.query('COMMIT');
      const loserResult = await loserPromise;
      expect(loserResult.kind).toBe('cooldown');
      if (loserResult.kind !== 'cooldown') throw new Error('unreachable');
      if (winnerResult.kind !== 'advanced') throw new Error('unreachable');
      expect(loserResult.readyAtMs).toBe(winnerResult.readyAtMs);
      expect(loserResult.revision).toBe('1');
      await loser.query('COMMIT');
      expect(await readRow(FIRST_USE_RACE_ACCOUNT)).toEqual({
        ready_at_ms: winnerResult.readyAtMs,
        revision: '1',
      });
    } finally {
      await winner.query('ROLLBACK').catch(() => {});
      await loser.query('ROLLBACK').catch(() => {});
      winner.release();
      loser.release();
    }
  }, 30_000);

  it('serializes on the locking read when the winner has written nothing yet', async () => {
    // The OTHER serialization point, driven deliberately: the winner has taken
    // the participant lock, run the conflict-safe insert and the locking read,
    // and has written NOTHING (exactly the state a refusal leaves behind for
    // the rest of the caller's transaction). A second entry must still not be
    // allowed to observe the row, and this is the arm where the FOR UPDATE row
    // lock, not the insert, is what holds it. The row must already exist and be
    // COMMITTED: with no row, both contenders queue on the speculative insert
    // instead (the first-use arm below), and the row lock never gets its turn.
    const seed = await pool.connect();
    try {
      await seed.query('BEGIN');
      expect((await db.advanceFreeholdHearthOnClient(seed, ROW_LOCK_RACE_ACCOUNT, 0)).kind).toBe(
        'advanced',
      );
      await seed.query('COMMIT');
    } finally {
      seed.release();
    }

    const winner = await pool.connect();
    const loser = await pool.connect();
    try {
      await winner.query('BEGIN');
      await loser.query('BEGIN');
      const winnerPid = await backendPid(winner);
      const loserPid = await backendPid(loser);
      await winner.query(db.FREEHOLD_HEARTH_ACCOUNT_LOCK_SQL, [ROW_LOCK_RACE_ACCOUNT]);
      await winner.query(db.FREEHOLD_HEARTH_INIT_SQL, [ROW_LOCK_RACE_ACCOUNT]);
      const held = await winner.query(db.FREEHOLD_HEARTH_READ_FOR_UPDATE_SQL, [
        ROW_LOCK_RACE_ACCOUNT,
      ]);
      expect(held.rows[0].revision).toBe('1');

      const started = Date.now();
      const loserPromise = db.advanceFreeholdHearthOnClient(
        loser,
        ROW_LOCK_RACE_ACCOUNT,
        COOLDOWN_MS,
      );
      const blocked = await waitForBlock(winnerPid);
      expect(blocked).not.toBeNull();
      expect(blocked?.pid).toBe(loserPid);
      expect(blocked?.query).toContain('FOR UPDATE');
      expect(blocked?.query).toContain(
        '(EXTRACT(EPOCH FROM now()) * 1000)::bigint::text AS now_ms',
      );
      expect(blocked?.query).not.toContain('INSERT INTO');
      expect(blocked?.waitEvent).toBe('Lock:transactionid');

      // The winner abandons its transaction, so the loser inherits an
      // untouched, fresh row and legitimately advances. The lock delayed it; it
      // never corrupted it.
      await winner.query('ROLLBACK');
      const loserResult = await loserPromise;
      expect(Date.now() - started).toBeLessThan(15_000);
      expect(loserResult.kind).toBe('advanced');
      if (loserResult.kind !== 'advanced') throw new Error('unreachable');
      expect(loserResult.revision).toBe('2');
      await loser.query('COMMIT');
      expect(await readRow(ROW_LOCK_RACE_ACCOUNT)).toEqual({
        ready_at_ms: loserResult.readyAtMs,
        revision: '2',
      });
    } finally {
      await winner.query('ROLLBACK').catch(() => {});
      await loser.query('ROLLBACK').catch(() => {});
      winner.release();
      loser.release();
    }
  }, 30_000);

  it('costs four statements when it advances and three when it refuses', async () => {
    const client = await pool.connect();
    const issued: string[] = [];
    const counting = {
      query: (text: string, values?: unknown[]) => {
        issued.push(text);
        return client.query(text, values as never[]);
      },
    };
    try {
      await client.query('BEGIN');
      expect((await db.advanceFreeholdHearthOnClient(counting, STALE_ACCOUNT, 0)).kind).toBe(
        'advanced',
      );
      // Participant lock, conflict-safe insert, locking read, monotone update.
      expect(issued).toHaveLength(4);
      issued.length = 0;
      expect(
        (await db.advanceFreeholdHearthOnClient(counting, STALE_ACCOUNT, COOLDOWN_MS)).kind,
      ).toBe('advanced');
      issued.length = 0;
      // Now unready: the refusal stops after the locking read and writes nothing.
      expect(
        (await db.advanceFreeholdHearthOnClient(counting, STALE_ACCOUNT, COOLDOWN_MS)).kind,
      ).toBe('cooldown');
      expect(issued).toHaveLength(3);
      expect(issued.some((text) => text.includes('UPDATE account_freehold_hearth'))).toBe(false);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('a stale caller replaying an old epoch cannot lower ready_at_ms or revision', async () => {
    const seed = await pool.connect();
    try {
      await seed.query('BEGIN');
      const advanced = await db.advanceFreeholdHearthOnClient(seed, STALE_ACCOUNT, COOLDOWN_MS);
      expect(advanced.kind).toBe('advanced');
      await seed.query('COMMIT');
    } finally {
      seed.release();
    }
    const before = await readRow(STALE_ACCOUNT);
    expect(before?.revision).toBe('1');

    // The reviewed advance statement, driven directly with a now_ms the
    // eligibility guard could never hand it: a stale caller replaying an epoch
    // from long before the current ready_at_ms. GREATEST is what makes that
    // harmless, and this is the only way to observe its left arm winning.
    const replayed = await pool.query(db.FREEHOLD_HEARTH_ADVANCE_SQL, [STALE_ACCOUNT, '1', '0']);
    expect(replayed.rows[0].ready_at_ms).toBe(before?.ready_at_ms);
    // Never lowered, and the revision still only counts up.
    expect(replayed.rows[0].revision).toBe('2');
    expect(BigInt(String(replayed.rows[0].ready_at_ms))).toBeGreaterThan(1n);

    // The other arm of GREATEST, for real: a now_ms far in the FUTURE does move
    // the value forward, so the clamp is not simply ignoring its input.
    const future = String(BigInt(before?.ready_at_ms ?? '0') + 10_000n);
    const forward = await pool.query(db.FREEHOLD_HEARTH_ADVANCE_SQL, [STALE_ACCOUNT, future, '5']);
    expect(forward.rows[0].ready_at_ms).toBe(String(BigInt(future) + 5n));
    expect(forward.rows[0].revision).toBe('3');
  });

  it('carries bigint counters past 2^53 as exact text, never a rounded number', async () => {
    const huge = '9007199254740993';
    await pool.query(
      `INSERT INTO account_freehold_hearth (account_id, ready_at_ms, revision)
       VALUES ($1, $2::bigint, $3::bigint)
       ON CONFLICT (account_id) DO UPDATE SET ready_at_ms = $2::bigint, revision = $3::bigint`,
      [CASCADE_ACCOUNT, huge, huge],
    );
    expect(await db.loadFreeholdHearth(pool, CASCADE_ACCOUNT)).toEqual({
      kind: 'state',
      state: { readyAtMs: huge, revision: huge },
    });
    // The value a Number round trip destroys, proving the ::text cast is doing
    // real work rather than agreeing with a lucky double.
    expect(String(Number(huge))).toBe('9007199254740992');

    // And the key is not ready: a Number comparison would have granted it.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const refused = await db.advanceFreeholdHearthOnClient(client, CASCADE_ACCOUNT, COOLDOWN_MS);
      expect(refused.kind).toBe('cooldown');
      if (refused.kind !== 'cooldown') throw new Error('unreachable');
      expect(refused.readyAtMs).toBe(huge);
      expect(BigInt(refused.nowMs)).toBeLessThan(BigInt(huge));
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('renders both counters as text in the DATABASE, not by driver luck', async () => {
    // node-pg happens to hand BIGINT back as a string today, so dropping the
    // ::text casts would look harmless from here. It is not: the cast is the
    // module's OWN guarantee, and a caller that configures an int8 type parser
    // (or a future driver default) must not be able to round a cooldown. This
    // pool does exactly that, on its own connection, touching no global.
    const { Pool, types } = await import('pg');
    const numeric = new Pool({
      connectionString: url,
      max: 1,
      options: `-c search_path=${SCHEMA}`,
      application_name: `${SCHEMA}_numeric`,
      types: {
        getTypeParser: (oid: number, format?: unknown) =>
          oid === 20
            ? (value: string) => Number(value)
            : (types.getTypeParser as (o: number, f?: unknown) => unknown)(oid, format),
      },
    } as never);
    try {
      const huge = '9007199254740993';
      await numeric.query(
        `INSERT INTO account_freehold_hearth (account_id, ready_at_ms, revision)
         VALUES ($1, $2::bigint, $2::bigint)`,
        [NUMERIC_PARSER_ACCOUNT, huge],
      );
      // Anti-vacuity: the override really bites on an uncast bigint, and really
      // destroys the value.
      const raw = await numeric.query(
        'SELECT ready_at_ms FROM account_freehold_hearth WHERE account_id = $1',
        [NUMERIC_PARSER_ACCOUNT],
      );
      expect(typeof raw.rows[0].ready_at_ms).toBe('number');
      expect(String(raw.rows[0].ready_at_ms)).toBe('9007199254740992');
      // The module's own read survives it, exactly.
      expect(await db.loadFreeholdHearth(numeric, NUMERIC_PARSER_ACCOUNT)).toEqual({
        kind: 'state',
        state: { readyAtMs: huge, revision: huge },
      });
      const exported = await db.freeholdHearthForExport(numeric, NUMERIC_PARSER_ACCOUNT);
      expect(exported?.ready_at_ms).toBe(huge);
      expect(exported?.revision).toBe(huge);
      const client = await numeric.connect();
      try {
        await client.query('BEGIN');
        const refused = await db.advanceFreeholdHearthOnClient(
          client,
          NUMERIC_PARSER_ACCOUNT,
          COOLDOWN_MS,
        );
        expect(refused.kind).toBe('cooldown');
        if (refused.kind !== 'cooldown') throw new Error('unreachable');
        expect(refused.readyAtMs).toBe(huge);
        expect(refused.revision).toBe(huge);
        // And the ADVANCE arm: with the key made ready, the RETURNING clause
        // must also survive the parser, counter and all.
        await client.query(
          'UPDATE account_freehold_hearth SET ready_at_ms = 0 WHERE account_id = $1',
          [NUMERIC_PARSER_ACCOUNT],
        );
        const advanced = await db.advanceFreeholdHearthOnClient(client, NUMERIC_PARSER_ACCOUNT, 0);
        expect(advanced.kind).toBe('advanced');
        if (advanced.kind !== 'advanced') throw new Error('unreachable');
        expect(advanced.revision).toBe('9007199254740994');
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    } finally {
      await numeric.end();
    }
  });

  it('cascades on account deletion, and survives character deletion untouched', async () => {
    // Character deletion PRESERVES the account cooldown: deleting a character
    // must never be a way to reset the shared clock.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      expect(
        (await db.advanceFreeholdHearthOnClient(client, CHARACTER_ACCOUNT, COOLDOWN_MS)).kind,
      ).toBe('advanced');
      await client.query('COMMIT');
    } finally {
      client.release();
    }
    const before = await readRow(CHARACTER_ACCOUNT);
    expect(before?.revision).toBe('1');
    await pool.query('DELETE FROM characters WHERE account_id = $1', [CHARACTER_ACCOUNT]);
    expect(
      (
        await pool.query('SELECT count(*)::int AS n FROM characters WHERE account_id = $1', [
          CHARACTER_ACCOUNT,
        ])
      ).rows[0].n,
    ).toBe(0);
    expect(await readRow(CHARACTER_ACCOUNT)).toEqual(before);

    // True account deletion DOES take it, through the primary key's own FK.
    expect(await readRow(CASCADE_ACCOUNT)).not.toBeNull();
    await pool.query('DELETE FROM accounts WHERE id = $1', [CASCADE_ACCOUNT]);
    expect(await readRow(CASCADE_ACCOUNT)).toBeNull();
  });

  it('exports the one row for the subject-access bundle, and null without one', async () => {
    expect(await db.freeholdHearthForExport(pool, EXPORT_ACCOUNT)).toBeNull();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      expect(
        (await db.advanceFreeholdHearthOnClient(client, EXPORT_ACCOUNT, COOLDOWN_MS)).kind,
      ).toBe('advanced');
      await client.query('COMMIT');
    } finally {
      client.release();
    }
    const exported = await db.freeholdHearthForExport(pool, EXPORT_ACCOUNT);
    expect(exported).not.toBeNull();
    expect(Object.keys(exported ?? {}).sort()).toEqual(['ready_at_ms', 'revision', 'updated_at']);
    expect(exported?.revision).toBe('1');
    expect(typeof exported?.ready_at_ms).toBe('string');
    expect(exported?.updated_at).toBeInstanceOf(Date);
  });
});
