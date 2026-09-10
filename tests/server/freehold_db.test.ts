// Text-level and behavioral pins for server/freehold_db.ts against a capturing
// fake pool. A fake pool cannot tell whether the SQL parses, whether a CHECK
// really refuses, or whether the compare-and-swap fence converges under
// contention: that executed proof is the TEST_DATABASE_URL-gated twin,
// tests/server/freehold_db.pg.test.ts. These pins anchor the load-bearing
// CLAUSES instead (the named constraints, the CAS fence and its deliberately
// SHORT set list, the in-SQL byte bound and its LIMIT) and every classification
// arm the two statements can produce. Each anchor is a contiguous clause, never
// a lone keyword, and never a constant compared against its own import.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_ACCOUNT_PLOT_READ_LIMIT,
  FREEHOLD_EXPORT_DETOAST_GATE_BYTES,
  FREEHOLD_EXPORT_MAX_RENDERED_BYTES,
  FREEHOLD_EXPORT_ROW_LIMIT,
  FREEHOLD_PLOT_ID_MAX_LEN,
  FREEHOLD_PLOT_ID_PREFIX,
  FREEHOLD_PLOT_ID_RE,
  FREEHOLD_PRIMARY_PLOT_INDEX,
  FREEHOLD_SCHEMA,
  FREEHOLD_STORED_DETOAST_GATE_BYTES,
  FREEHOLD_UPKEEP_BINDING_UNBOUND,
  type FreeholdUpsert,
  freeholdForAccount,
  freeholdSchema,
  freeholdsForExport,
  mintFreeholdPlotId,
  upsertFreehold,
} from '../../server/freehold_db';
import { stripComments } from '../helpers/strip_comments';

interface Captured {
  text: string;
  values: unknown[] | undefined;
}

/** Queued results, in statement order. An Error in the queue is THROWN by that
 *  statement, so a case can drive the database's own constraint violations. */
function makeCapture(results: ({ rows?: Record<string, unknown>[] } | Error)[] = []) {
  const calls: Captured[] = [];
  const query = async (text: string, values?: unknown[]) => {
    calls.push({ text, values });
    const next = results.shift() ?? {};
    if (next instanceof Error) throw next;
    const rows = next.rows ?? [];
    return { rows, rowCount: rows.length };
  };
  return { calls, db: { query } };
}

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;
// SQL comments are stripped before every source match (the
// tests/server/storage_purchase_db.test.ts idiom): a -- line or a /* */ wrap
// carrying the pinned text must never keep a pin green while the statement it
// describes is dead.
const codeOnly = (sql: string): string =>
  sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, '');
const fold = (sql: string): string => sql.replace(/\s+/g, ' ');

const PLOT_ID = 'plot:0123456789abcdef0123456789abcdef';

/** One durable row as the account read's SELECT list hands it back. */
function readRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    plot_index: 0,
    plot_id: PLOT_ID,
    schema_version: 1,
    durable_rev: '7',
    wire_rev: '12',
    tier: 'cottage',
    condition: 91,
    visit_policy: 'friends',
    upkeep_binding: FREEHOLD_UPKEEP_BINDING_UNBOUND,
    disk_bytes: 480,
    owned_bytes: 512,
    layout: [{ placementId: 1, itemId: 'chair', x: 0, y: 0, z: 0, yaw: 0 }],
    trophies: [{ plinth: 0, trophyId: 'skull' }],
    ...over,
  };
}

const VALID_UPSERT: FreeholdUpsert = {
  accountId: 42,
  plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
  plotId: PLOT_ID,
  tier: 'cottage',
  layoutJson: '[]',
  trophiesJson: '[]',
  condition: 100,
  visitPolicy: 'closed',
  wireRev: 3,
  schemaVersion: 1,
  expectedDurableRev: '4',
};

const corrupt = (patch: Record<string, unknown>): FreeholdUpsert =>
  ({ ...VALID_UPSERT, ...patch }) as FreeholdUpsert;

describe('the freehold plot DDL', () => {
  it('creates one row per account plot slot behind named, shape-only CHECKs', () => {
    const code = codeOnly(FREEHOLD_SCHEMA);
    const folded = fold(code);

    expect(count(code, 'CREATE TABLE IF NOT EXISTS "public".account_freeholds')).toBe(1);
    expect(folded).toContain('account_id INT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE');
    expect(folded).toContain('plot_index SMALLINT NOT NULL');
    expect(folded).toContain('plot_id TEXT NOT NULL');
    expect(folded).toContain('schema_version INT NOT NULL DEFAULT 1');
    expect(folded).toContain('durable_rev BIGINT NOT NULL DEFAULT 1');
    expect(folded).toContain('wire_rev BIGINT NOT NULL DEFAULT 0');
    expect(folded).toContain("layout JSONB NOT NULL DEFAULT '[]'::jsonb");
    expect(folded).toContain("trophies JSONB NOT NULL DEFAULT '[]'::jsonb");
    expect(folded).toContain('condition SMALLINT NOT NULL DEFAULT 100');
    expect(folded).toContain("visit_policy TEXT NOT NULL DEFAULT 'closed'");
    expect(folded).toContain("upkeep_binding TEXT NOT NULL DEFAULT 'unbound_no_history'");
    expect(folded).toContain('upkeep_checkpoint JSONB');
    expect(folded).toContain('upkeep_credit JSONB');

    // Every CHECK is NAMED, so a 23514 in production names the rule it broke
    // instead of an anonymous ordinal. Name and predicate are pinned as one
    // contiguous clause: a rename that kept the predicate, or a predicate
    // rewrite that kept the name, both red here.
    expect(folded).toContain(
      'CONSTRAINT account_freeholds_plot_index_shape CHECK (plot_index >= 0)',
    );
    expect(folded).toContain(
      "CONSTRAINT account_freeholds_plot_id_charset CHECK (plot_id ~ '^[A-Za-z0-9_:-]{1,64}$')",
    );
    expect(folded).toContain(
      'CONSTRAINT account_freeholds_schema_version_positive CHECK (schema_version >= 1)',
    );
    expect(folded).toContain(
      'CONSTRAINT account_freeholds_durable_rev_positive CHECK (durable_rev >= 1)',
    );
    expect(folded).toContain(
      'CONSTRAINT account_freeholds_wire_rev_nonnegative CHECK (wire_rev >= 0)',
    );
    expect(folded).toContain(
      'CONSTRAINT account_freeholds_condition_range CHECK (condition BETWEEN 0 AND 100)',
    );
    expect(folded).toContain(
      "CONSTRAINT account_freeholds_tier_shape CHECK (tier <> '' AND length(tier) <= 64)",
    );
    expect(folded).toContain(
      "CONSTRAINT account_freeholds_visit_policy_shape CHECK (visit_policy <> '' AND length(visit_policy) <= 32)",
    );
    expect(folded).toContain(
      "CONSTRAINT account_freeholds_upkeep_binding_shape CHECK (upkeep_binding <> '' AND length(upkeep_binding) <= 32)",
    );
    expect(folded).toContain(
      "CONSTRAINT account_freeholds_layout_array CHECK (jsonb_typeof(layout) = 'array')",
    );
    expect(folded).toContain(
      "CONSTRAINT account_freeholds_trophies_array CHECK (jsonb_typeof(trophies) = 'array')",
    );
    expect(folded).toContain(
      "CONSTRAINT account_freeholds_unbound_carries_no_upkeep CHECK (upkeep_binding <> 'unbound_no_history' " +
        'OR (upkeep_checkpoint IS NULL AND upkeep_credit IS NULL))',
    );
    // The DDL's charset text and the TypeScript guard are authored separately
    // in two dialects; this is the cross-pin that keeps them from drifting.
    expect(FREEHOLD_PLOT_ID_RE.source).toBe('^[A-Za-z0-9_:-]{1,64}$');
    expect(FREEHOLD_UPKEEP_BINDING_UNBOUND).toBe('unbound_no_history');

    // The tier and visit-policy CHECKs are SHAPE ONLY on purpose: a value this
    // build does not admit must still read back so recovery can preserve it.
    expect(folded).not.toContain('tier IN (');
    expect(folded).not.toContain('visit_policy IN (');

    expect(count(folded, 'PRIMARY KEY (account_id, plot_index)')).toBe(1);
    expect(folded).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS account_freeholds_plot_id ON "public".account_freeholds (plot_id);',
    );

    // NO account-only index: account_id LEADS the primary key, so the accounts
    // cascade probe and the account read both ride that key's own btree, and a
    // second index would be permanent write amplification on every plot save.
    // Two arms, because the qualified form would slip past the bare literal.
    expect(folded).not.toContain('ON account_freeholds (account_id)');
    expect(folded).not.toMatch(/CREATE (?:UNIQUE )?INDEX[^;]*account_freeholds \(account_id\)/);
    expect(count(folded, 'CREATE INDEX')).toBe(0);
    expect(count(folded, 'CREATE UNIQUE INDEX')).toBe(1);

    // ensureSchema re-applies this fragment at every boot, so every statement
    // is guarded and nothing here is destructive.
    expect(count(code, 'CREATE TABLE')).toBe(count(code, 'CREATE TABLE IF NOT EXISTS'));
    expect(code).not.toMatch(/CREATE (?:UNIQUE )?INDEX (?!IF NOT EXISTS)/);
    expect(code).not.toMatch(/\b(?:DROP|TRUNCATE|ALTER COLUMN)\b/i);
  });

  it('states the keep-forever rationale in the fragment itself', () => {
    // The comment rides in the RAW fragment (codeOnly would strip it), and it
    // is the only place a future retention author meets the judgement: this
    // table is bounded per ACCOUNT and each row IS a player's built home.
    expect(FREEHOLD_SCHEMA).toContain('KEEP FOREVER');
    expect(FREEHOLD_SCHEMA).toContain('deliberately exempt from the retention sweep');
    expect(FREEHOLD_SCHEMA).toContain('never grows per event, per session or per day');
    expect(FREEHOLD_SCHEMA).toContain('the only removal path there is');
    // And the no-extra-index judgement, so the next reader does not "fix" it.
    expect(FREEHOLD_SCHEMA).toContain('NO separate account_id index, on purpose');
    expect(FREEHOLD_SCHEMA).toContain('server/play_session_retention_db.ts');
  });

  it('qualifies every created object for a private schema, and refuses a hostile name', () => {
    const isolated = freeholdSchema('freehold_pg_test');
    expect(isolated).toContain('CREATE TABLE IF NOT EXISTS "freehold_pg_test".account_freeholds');
    expect(isolated).toContain('ON "freehold_pg_test".account_freeholds (plot_id)');
    // Decisive form of "differ ONLY in the schema qualifier": putting the
    // default qualifier back must reproduce the shipped fragment byte for byte.
    expect(isolated.replaceAll('"freehold_pg_test"', '"public"')).toBe(FREEHOLD_SCHEMA);
    // The foreign-key parent stays UNQUALIFIED so it resolves through the
    // applying connection's own search_path, the maps_db.ts rule.
    expect(isolated).toContain('REFERENCES accounts(id) ON DELETE CASCADE');
    expect(isolated).not.toContain('REFERENCES "freehold_pg_test".accounts');

    expect(() => freeholdSchema('public; DROP SCHEMA public')).toThrow(
      /simple lowercase identifier/,
    );
    expect(() => freeholdSchema('Mixed')).toThrow(/simple lowercase identifier/);
    expect(() => freeholdSchema('9lives')).toThrow(/simple lowercase identifier/);
  });
});

describe('the account read', () => {
  it('bounds owned content in SQL, in one round trip, with an explicit LIMIT', async () => {
    const cap = makeCapture([{ rows: [readRow()] }]);
    const load = await freeholdForAccount(cap.db, 42, 4096);
    expect(load.kind).toBe('row');
    // ONE round trip for the whole account: the classification is a pure
    // function of the single result set, never a follow-up probe.
    expect(cap.calls).toHaveLength(1);
    expect(cap.calls[0].values).toEqual([42, 4096]);

    const folded = fold(cap.calls[0].text);
    expect(FREEHOLD_ACCOUNT_PLOT_READ_LIMIT).toBe(2);
    expect(folded).toContain('LIMIT 2');
    expect(folded).toContain('ORDER BY f.plot_index LIMIT 2');
    expect(folded).toContain('WHERE f.account_id = $1');
    // The AUTHORITATIVE bound is measured once per row in SQL, on the
    // UNCOMPRESSED text form, and it nulls BOTH content columns past the bound
    // so an oversized row never crosses the wire into a deep parse.
    expect(folded).toContain(
      'ELSE COALESCE(octet_length(f.layout::text), 0) + COALESCE(octet_length(f.trophies::text), 0) END AS owned_bytes',
    );
    // OFFSET 0 is an optimization BARRIER: without it the planner inlines the
    // measure into all three output expressions and renders the text three
    // times, which is the residual the pre-gate exists to bound.
    expect(folded).toContain('OFFSET 0');
    expect(folded).toContain('LEFT JOIN LATERAL');
    expect(folded).toContain('CASE WHEN b.owned_bytes <= $2 THEN f.layout ELSE NULL END AS layout');
    expect(folded).toContain(
      'CASE WHEN b.owned_bytes <= $2 THEN f.trophies ELSE NULL END AS trophies',
    );
    // AHEAD of it, the cheap on-disk pre-gate. pg_column_size appears in the
    // gate ONLY: it reads the TOAST pointer header without detoasting, which is
    // the whole point, and it must never stand in for the authoritative
    // measure, because it reports the COMPRESSED size.
    expect(folded).toContain(
      'COALESCE(pg_column_size(f.layout), 0) + COALESCE(pg_column_size(f.trophies), 0) AS disk_bytes',
    );
    expect(folded).toContain(`> ${FREEHOLD_STORED_DETOAST_GATE_BYTES} THEN NULL`);
    // AND ONLY THE ADMITTED SLOT IS MEASURED. The LIMIT admits two rows so a
    // stranded slot is SEEN rather than read as absence, but the caller reads
    // content from the primary row alone: rendering the second one shipped its
    // whole layout across the wire to be discarded, and doubled the render on a
    // hyper-compressible pair. Nulling the measure outside the slot nulls both
    // content CASEs with it.
    expect(folded).toContain(`WHEN f.plot_index <> ${FREEHOLD_PRIMARY_PLOT_INDEX} THEN NULL`);
    // The gate sits above the UNCOMPRESSED datum size of the maximal legal
    // record (97932 bytes), which is the theoretical ceiling for any legal
    // row's on-disk size because TOAST compression can only shrink it. So no
    // legal row is ever refused unmeasured, however badly it compresses.
    expect(FREEHOLD_STORED_DETOAST_GATE_BYTES).toBeGreaterThan(97_932);
    // pg_column_size appears in the GATE only, once. It must never stand in for
    // the authoritative measure, because it reports the COMPRESSED size, and it
    // must not be spelled out twice: the barrier below names it once so the
    // toast header is read a single time.
    expect(count(folded, 'pg_column_size(f.layout)')).toBe(1);
    expect(folded).not.toContain('octet_length(f.layout::text)) AS owned_bytes');
    // Both bigints leave the database as text and are never cast in SQL either.
    expect(folded).toContain('f.durable_rev::text AS durable_rev');
    expect(folded).toContain('f.wire_rev::text AS wire_rev');
  });

  it('reads an account with no row as absence', async () => {
    const cap = makeCapture([{ rows: [] }]);
    expect(await freeholdForAccount(cap.db, 42, 4096)).toEqual({ kind: 'absent' });
  });

  it('maps the admitted primary slot into a row', async () => {
    const cap = makeCapture([{ rows: [readRow()] }]);
    const load = await freeholdForAccount(cap.db, 42, 4096);
    if (load.kind !== 'row') throw new Error(`expected a row, got ${load.kind}`);
    expect(load.row).toEqual({
      accountId: 42,
      plotIndex: 0,
      plotId: PLOT_ID,
      schemaVersion: 1,
      durableRev: '7',
      wireRev: '12',
      tier: 'cottage',
      layout: [{ placementId: 1, itemId: 'chair', x: 0, y: 0, z: 0, yaw: 0 }],
      trophies: [{ plinth: 0, trophyId: 'skull' }],
      condition: 91,
      visitPolicy: 'friends',
      upkeepBinding: 'unbound_no_history',
      ownedBytes: 512,
    });
  });

  it('classifies a row past the byte bound as oversize, with its content nulled', async () => {
    const cap = makeCapture([
      { rows: [readRow({ owned_bytes: 9001, layout: null, trophies: null })] },
    ]);
    const load = await freeholdForAccount(cap.db, 42, 4096);
    expect(load).toEqual({
      kind: 'oversize',
      plotIndex: 0,
      plotId: PLOT_ID,
      durableRev: '7',
      bytes: 9001,
      limit: 4096,
      detoastRefused: false,
      diskBytes: 480,
    });
  });

  it('classifies a row past the on-disk pre-gate as oversize with NO measured text length', async () => {
    // Past the gate the stored text was never rendered, so there is no text
    // length to report and the refusal says so instead of inventing one. This
    // is the arm that keeps a multi-megabyte row from costing hundreds of
    // milliseconds of database CPU on a login.
    const cap = makeCapture([
      {
        rows: [readRow({ owned_bytes: null, disk_bytes: 5_000_000, layout: null, trophies: null })],
      },
    ]);
    const load = await freeholdForAccount(cap.db, 42, 4096);
    expect(load).toEqual({
      kind: 'oversize',
      plotIndex: 0,
      plotId: PLOT_ID,
      durableRev: '7',
      bytes: 0,
      limit: 4096,
      detoastRefused: true,
      diskBytes: 5_000_000,
    });
  });

  it('holds all FOUR copies of the plot identity charset to one rule', () => {
    // The charset lives in four places: the wire's own regex, this module's
    // FREEHOLD_PLOT_ID_RE, the DDL CHECK, and normalizeFreehold's shape test.
    // Three of them had a pin and the fourth did not, so widening the charset
    // later would red three tests, the author would update three literals, and
    // the loader would then mark every newly minted id malformed and
    // write-block the account. One rule, one assertion.
    // The CHARACTER CLASS is the shared rule; the wire bounds length with its
    // own OPAQUE_ID_MAX_LEN rather than a quantifier, so the two halves are
    // asserted separately.
    const CHARSET = '[A-Za-z0-9_:-]';
    const BOUNDED = `${CHARSET}{1,64}`;
    const wire = stripComments(
      readFileSync(resolve(process.cwd(), 'server/freehold_wire.ts'), 'utf8'),
    );
    const sim = stripComments(
      readFileSync(resolve(process.cwd(), 'src/sim/freehold/persisted.ts'), 'utf8'),
    );
    const ddl = codeOnly(freeholdSchema('public'));
    expect(FREEHOLD_PLOT_ID_RE.source).toBe(`^${BOUNDED}$`);
    expect(wire, 'server/freehold_wire.ts').toContain(`${CHARSET}+`);
    expect(sim, 'src/sim/freehold/persisted.ts').toContain(BOUNDED);
    expect(ddl, 'the DDL CHECK').toContain(BOUNDED);
    // Anti-vacuity: the class really is what admits and refuses.
    expect(FREEHOLD_PLOT_ID_RE.test('plot:9f3a1c')).toBe(true);
    expect(FREEHOLD_PLOT_ID_RE.test('plot/9f3a1c')).toBe(false);
    expect(FREEHOLD_PLOT_ID_RE.test('plot.9f3a1c')).toBe(false);
    expect(FREEHOLD_PLOT_ID_RE.test('plot=')).toBe(false);
  });

  it('never reads a stranded unadmitted slot as absence', async () => {
    // The whole point of the LIMIT-2 headroom: an account whose ONLY row sits
    // outside the admitted slot must be SEEN. Reading it as "no plot" would let
    // the writer mint a second plot and bury the first where nothing looks.
    const cap = makeCapture([{ rows: [readRow({ plot_index: 1, durable_rev: '3' })] }]);
    const load = await freeholdForAccount(cap.db, 42, 4096);
    expect(load.kind).not.toBe('absent');
    expect(load).toEqual({
      kind: 'unadmitted',
      plotIndex: 1,
      plotId: PLOT_ID,
      durableRev: '3',
      detail: 'plot_index 1 is outside the admitted slot 0',
    });
  });

  it('loads the primary slot even when an unadmitted sibling came back beside it', async () => {
    const cap = makeCapture([
      { rows: [readRow({ plot_index: 0 }), readRow({ plot_index: 1, plot_id: 'plot:other' })] },
    ]);
    const load = await freeholdForAccount(cap.db, 42, 4096);
    if (load.kind !== 'row') throw new Error(`expected a row, got ${load.kind}`);
    expect(load.row.plotIndex).toBe(0);
  });

  it('carries a bigint revision past the safe-integer range through untouched', async () => {
    const huge = '9007199254740993';
    const cap = makeCapture([{ rows: [readRow({ durable_rev: huge, wire_rev: huge })] }]);
    const load = await freeholdForAccount(cap.db, 42, 4096);
    if (load.kind !== 'row') throw new Error(`expected a row, got ${load.kind}`);
    expect(typeof load.row.durableRev).toBe('string');
    expect(typeof load.row.wireRev).toBe('string');
    expect(load.row.durableRev).toBe(huge);
    expect(load.row.wireRev).toBe(huge);
    // The value chosen is exactly one a JS number CANNOT hold, so this is a
    // real proof of exactness rather than an accident of a small fixture.
    expect(String(Number(huge))).not.toBe(huge);
  });

  it('refuses a revision that did not arrive as exact bigint text', async () => {
    const cap = makeCapture([{ rows: [readRow({ durable_rev: 7 })] }]);
    await expect(freeholdForAccount(cap.db, 42, 4096)).rejects.toThrow(/exact bigint text/);
  });

  it('refuses a bad account id and a bad byte bound before touching the database', async () => {
    const badAccount = makeCapture();
    await expect(freeholdForAccount(badAccount.db, 0, 4096)).rejects.toThrow(
      /positive safe integer/,
    );
    expect(badAccount.calls).toHaveLength(0);

    // A non-finite bound would make the SQL comparison answer NULL, nulling
    // both content columns while the JS side still called the row fine.
    const badBound = makeCapture();
    await expect(freeholdForAccount(badBound.db, 42, Number.NaN)).rejects.toThrow(
      /maxOwnedBytes must be a positive safe integer/,
    );
    expect(badBound.calls).toHaveLength(0);
  });
});

describe('the compare-and-swap upsert', () => {
  it('inserts, and never overwrites, when the caller holds no revision', async () => {
    const cap = makeCapture([{ rows: [{ durable_rev: '1' }] }]);
    const result = await upsertFreehold(cap.db, {
      ...VALID_UPSERT,
      expectedDurableRev: null,
    });
    expect(result).toEqual({ kind: 'inserted', durableRev: '1' });
    expect(cap.calls).toHaveLength(1);

    const folded = fold(cap.calls[0].text);
    expect(folded).toContain('INSERT INTO account_freeholds');
    // DO NOTHING, never DO UPDATE: an insert that finds a row lost a race, and
    // overwriting there would discard whatever the winner built.
    expect(folded).toContain('ON CONFLICT (account_id, plot_index) DO NOTHING');
    expect(folded).not.toContain('DO UPDATE');
    expect(folded).toContain('RETURNING durable_rev::text AS durable_rev');
    // The COLUMN LIST, pinned to a literal in the always-on tier: the ordering
    // of the values below is only meaningful against the columns they fill, and
    // a silent reorder would write every field into the wrong column.
    expect(folded).toContain(
      '(account_id, plot_index, plot_id, tier, layout, trophies, condition, visit_policy, wire_rev, schema_version)',
    );
    expect(folded).toContain(
      'VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9::bigint, $10)',
    );
    expect(cap.calls[0].values).toEqual([
      42,
      0,
      PLOT_ID,
      'cottage',
      '[]',
      '[]',
      100,
      'closed',
      '3',
      1,
    ]);
  });

  it('diagnoses a plot identity collision as a conflict rather than throwing', async () => {
    // ON CONFLICT (account_id, plot_index) does NOT absorb a plot_id unique
    // violation: the minted identity collided with another account's row. The
    // caller's response is the same as for any other conflict, so it must be
    // classified rather than surfacing as an unexplained database fault.
    const collision = Object.assign(new Error('duplicate key value'), {
      code: '23505',
      constraint: 'account_freeholds_plot_id',
    });
    const cap = makeCapture([collision]);
    expect(await upsertFreehold(cap.db, { ...VALID_UPSERT, expectedDurableRev: null })).toEqual({
      kind: 'conflict',
      detail: 'the minted plot identity is already in use by another row',
    });
    // One statement: a collision is diagnosed by the error, never by a probe.
    expect(cap.calls).toHaveLength(1);
  });

  it('never turns another database fault into a conflict', async () => {
    // The contrast arm. Swallowing an unrelated error as "conflict" would hide
    // a real fault behind a routine-looking classification forever.
    const fault = Object.assign(new Error('connection terminated'), { code: '57P01' });
    const cap = makeCapture([fault]);
    await expect(
      upsertFreehold(cap.db, { ...VALID_UPSERT, expectedDurableRev: null }),
    ).rejects.toThrow('connection terminated');
  });

  it('diagnoses a conflicting insert as stale, with the winner revision', async () => {
    const cap = makeCapture([{ rows: [] }, { rows: [{ durable_rev: '5' }] }]);
    const result = await upsertFreehold(cap.db, {
      ...VALID_UPSERT,
      expectedDurableRev: null,
    });
    expect(result).toEqual({ kind: 'stale', durableRev: '5' });
    // Exactly one follow-up, and it only READS.
    expect(cap.calls).toHaveLength(2);
    expect(fold(cap.calls[1].text)).toContain(
      'SELECT durable_rev::text AS durable_rev FROM account_freeholds WHERE account_id = $1 AND plot_index = $2',
    );
    expect(cap.calls[1].values).toEqual([42, 0]);
  });

  it('reports a conflicting insert whose row then vanished as a conflict, never as absence', async () => {
    const cap = makeCapture([{ rows: [] }, { rows: [] }]);
    const result = await upsertFreehold(cap.db, {
      ...VALID_UPSERT,
      expectedDurableRev: null,
    });
    expect(result).toEqual({
      kind: 'conflict',
      detail: 'insert conflicted but no row was present to diagnose',
    });
  });

  it('advances the durable revision on a matching fence', async () => {
    const cap = makeCapture([{ rows: [{ durable_rev: '5' }] }]);
    const result = await upsertFreehold(cap.db, VALID_UPSERT);
    expect(result).toEqual({ kind: 'updated', durableRev: '5' });
    expect(cap.calls).toHaveLength(1);
    expect(cap.calls[0].values).toEqual([42, 0, '4', 'cottage', '[]', '[]', 100, 'closed', '3', 1]);
  });

  it('fences on the exact revision and writes NOTHING the upkeep writer owns', async () => {
    const cap = makeCapture([{ rows: [{ durable_rev: '5' }] }]);
    await upsertFreehold(cap.db, VALID_UPSERT);
    const folded = fold(cap.calls[0].text);
    const setClause = folded.slice(folded.indexOf(' SET ') + 5, folded.indexOf(' WHERE '));
    const whereClause = folded.slice(folded.indexOf(' WHERE '), folded.indexOf('RETURNING'));

    expect(whereClause).toContain(
      'account_id = $1 AND plot_index = $2 AND durable_rev = $3::bigint',
    );
    expect(setClause).toContain('durable_rev = durable_rev + 1');
    expect(setClause).toContain('updated_at = now()');
    expect(setClause).toContain('tier = $4');
    expect(setClause).toContain('layout = $5::jsonb');
    expect(setClause).toContain('trophies = $6::jsonb');
    expect(setClause).toContain('condition = $7');
    expect(setClause).toContain('visit_policy = $8');
    expect(setClause).toContain('wire_rev = $9::bigint');
    // schema_version IS written. The writer is the only party that knows which
    // shape it just serialized, and the column is what a later or EARLIER build
    // reads to decide whether it may interpret the row at all. Left to the
    // column DEFAULT, a release writing shape 2 would leave every row claiming
    // shape 1 and a rollback would accept documents it cannot read.
    expect(setClause).toContain('schema_version = $10');

    // THE SET LIST IS THE INVARIANT. The plot save is not the upkeep writer and
    // must never clear a bound checkpoint or a granted credit, and the plot
    // identity is minted once. Each of these gets its own assertion so a
    // regression names the column it started writing.
    expect(setClause).not.toContain('upkeep_checkpoint');
    expect(setClause).not.toContain('upkeep_credit');
    expect(setClause).not.toContain('upkeep_binding');
    expect(setClause).not.toContain('plot_id');
    expect(setClause).not.toContain('created_at');
  });

  it('separates a moved fence (stale) from a vanished row (missing)', async () => {
    // BOTH arms of the one follow-up diagnosis, because they differ only in
    // whether that SELECT found anything.
    const moved = makeCapture([{ rows: [] }, { rows: [{ durable_rev: '9' }] }]);
    expect(await upsertFreehold(moved.db, VALID_UPSERT)).toEqual({
      kind: 'stale',
      durableRev: '9',
    });
    expect(moved.calls).toHaveLength(2);

    const gone = makeCapture([{ rows: [] }, { rows: [] }]);
    expect(await upsertFreehold(gone.db, VALID_UPSERT)).toEqual({ kind: 'missing' });
    expect(gone.calls).toHaveLength(2);
  });

  it('accepts the valid input it refuses every single-field corruption of', async () => {
    // The positive control: without it, every negative below could be passing
    // for a reason unrelated to the field it corrupts.
    const ok = makeCapture([{ rows: [{ durable_rev: '5' }] }]);
    await expect(upsertFreehold(ok.db, VALID_UPSERT)).resolves.toEqual({
      kind: 'updated',
      durableRev: '5',
    });

    const cases: { field: string; patch: Record<string, unknown>; message: RegExp }[] = [
      { field: 'accountId', patch: { accountId: 0 }, message: /accountId/ },
      { field: 'plotIndex', patch: { plotIndex: -1 }, message: /plotIndex/ },
      { field: 'plotId', patch: { plotId: 'plot:bad/id' }, message: /plotId/ },
      { field: 'tier', patch: { tier: '' }, message: /tier/ },
      { field: 'visitPolicy', patch: { visitPolicy: '' }, message: /visitPolicy/ },
      { field: 'layoutJson', patch: { layoutJson: 5 }, message: /layoutJson/ },
      { field: 'trophiesJson', patch: { trophiesJson: null }, message: /trophiesJson/ },
      { field: 'condition', patch: { condition: 101 }, message: /condition/ },
      { field: 'wireRev', patch: { wireRev: -1 }, message: /wireRev/ },
      // Anything but exact digits would raise 22P02 at $3::bigint and abort the
      // caller's whole transaction, so it is refused before a byte is sent.
      {
        field: 'expectedDurableRev',
        patch: { expectedDurableRev: '1e3' },
        message: /expectedDurableRev/,
      },
    ];
    for (const { field, patch, message } of cases) {
      const cap = makeCapture();
      await expect(
        upsertFreehold(cap.db, corrupt(patch)),
        `expected a refusal for ${field}`,
      ).rejects.toThrow(message);
      expect(cap.calls, `${field} must be refused before any SQL is sent`).toHaveLength(0);
    }
  });
});

describe('mintFreeholdPlotId', () => {
  it('mints a prefixed, wire-legal, bounded, unrepeated identity', () => {
    const first = mintFreeholdPlotId();
    const second = mintFreeholdPlotId();
    expect(FREEHOLD_PLOT_ID_PREFIX).toBe('plot:');
    expect(first.startsWith('plot:')).toBe(true);
    expect(FREEHOLD_PLOT_ID_RE.test(first)).toBe(true);
    expect(first.length).toBeLessThanOrEqual(FREEHOLD_PLOT_ID_MAX_LEN);
    expect(FREEHOLD_PLOT_ID_MAX_LEN).toBe(64);
    // A dash-stripped UUID: 5 prefix characters plus 32 hex.
    expect(first).toHaveLength(37);
    expect(second).not.toBe(first);
    expect(mintFreeholdPlotId(() => 'abc')).toBe('plot:abc');
  });

  it('refuses a generator whose output would die silently at the wire boundary', () => {
    // The charset arm. A dot, a slash or base64 padding persists perfectly and
    // then makes every build-presence frame refuse with no diagnostic.
    expect(() => mintFreeholdPlotId(() => 'ab/cd')).toThrow(/opaque plot id charset/);
    expect(() => mintFreeholdPlotId(() => 'ab.cd')).toThrow(/opaque plot id charset/);
    expect(() => mintFreeholdPlotId(() => 'abcd==')).toThrow(/opaque plot id charset/);
    // The length arm, on a charset-legal id: 70 hex characters plus the prefix
    // is past both the wire ceiling and the DDL's plot_id CHECK.
    expect(() => mintFreeholdPlotId(() => 'a'.repeat(70))).toThrow(/opaque plot id charset/);
  });
});

describe('the subject-access export statement', () => {
  it('carries both bounds in the statement, not only in the docblock', async () => {
    // The one statement this round rewrote by hand was the one with no text
    // assertion: its only coverage was the real-PostgreSQL suite, which skips
    // wherever no database is armed. The account read has had this arm since it
    // was written; the export had none.
    const cap = makeCapture([{ rows: [] }]);
    await freeholdsForExport(cap.db as never, 7);
    expect(cap.calls).toHaveLength(1);
    const folded = fold(codeOnly(cap.calls[0].text));
    expect(cap.calls[0].values).toEqual([7]);
    // The ROW bound, widened rather than copied from the account read's, so a
    // slot this build does not admit is still exported.
    expect(folded).toContain(`LIMIT ${FREEHOLD_EXPORT_ROW_LIMIT}`);
    expect(FREEHOLD_EXPORT_ROW_LIMIT).toBeGreaterThan(FREEHOLD_ACCOUNT_PLOT_READ_LIMIT);
    // The BYTE bound, the same on-disk pre-gate the account read uses: the
    // measure never detoasts, and past it both content columns come back NULL
    // while every scalar column and the measured size survive.
    expect(folded).toContain(
      'COALESCE(pg_column_size(f.layout), 0) + COALESCE(pg_column_size(f.trophies), 0) AS disk_bytes',
    );
    expect(folded).toContain(`> ${FREEHOLD_EXPORT_DETOAST_GATE_BYTES} THEN NULL`);
    // AND THE AUTHORITATIVE MEASURE BEHIND IT. The pre-gate reads the COMPRESSED
    // size, so on its own it bounds nothing: the content columns must be gated
    // on the rendered length, which is itself NULL when the pre-gate refused.
    expect(folded).toContain(
      `CASE WHEN b.owned_bytes <= ${FREEHOLD_EXPORT_MAX_RENDERED_BYTES} THEN f.layout ELSE NULL END AS layout`,
    );
    expect(folded).toContain(
      `CASE WHEN b.owned_bytes <= ${FREEHOLD_EXPORT_MAX_RENDERED_BYTES} THEN f.trophies ELSE NULL END AS trophies`,
    );
    expect(FREEHOLD_EXPORT_MAX_RENDERED_BYTES).toBe(425_984);
    expect(folded).toContain('OFFSET 0');
    // Stable order, and the account scoped by a bound parameter rather than by
    // interpolation.
    expect(folded).toContain('WHERE f.account_id = $1');
    expect(folded).toContain('ORDER BY f.plot_index');
    // Every column an owner is entitled to is still named, so a bound cannot
    // quietly become an omission.
    for (const column of [
      'plot_index',
      'plot_id',
      'schema_version',
      'durable_rev',
      'wire_rev',
      'tier',
      'condition',
      'visit_policy',
      'upkeep_binding',
      'upkeep_checkpoint',
      'upkeep_credit',
      'created_at',
      'updated_at',
    ]) {
      expect(folded, column).toContain(column);
    }
  });
});
