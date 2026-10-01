// The housing mutation boundary and its claim and Hearth-trip machinery, driven
// with fakes and literals: the bounded transaction runner, the housing hook's
// participant order and refusals, the outcome classification (including the
// ambiguous-COMMIT verify arms), the claim registry and renewer, the fenced
// plot writer, the claimed login read, the operation recovery producer, the
// Hearth trip's admission contract, and the boundary pins (who may reach the
// advance, the one ticket setter, no registered kind, the precheck matrix).
//
// Guards: the decisions of server/freehold_mutation.ts, freehold_tx.ts,
// freehold_claim_registry.ts, freehold_fenced_write.ts, freehold_claim_login.ts,
// freehold_operation_recovery.ts, freehold_hearth_trip.ts and
// character_save_housing.ts without a database. The real-PG behavior of the
// same seams is pinned in tests/server/freehold_mutation.pg.test.ts and
// tests/server/freehold_claim.pg.test.ts, which cannot drive these arms
// deterministically (a lost COMMIT answer, a renewer chunk that throws).
//
// Cost: 87 ms
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  type CharacterSaveHousingHook,
  commitWithHousing,
  housingPersist,
} from '../../server/character_save_housing';
import { DbTransactionRolledBack } from '../../server/db_transaction_deadline';
import { heldClaims, registerFreeholdAuthority } from '../../server/freehold_authority_registry';
import { FREEHOLD_CLAIM_FENCE_SQL } from '../../server/freehold_claim_db';
import { readClaimedLoginDurables } from '../../server/freehold_claim_login';
import {
  createFreeholdClaimRegistry,
  FREEHOLD_CLAIM_RENEW_CHUNK,
  FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS,
  releaseAllFreeholdClaims,
  renewFreeholdClaims,
} from '../../server/freehold_claim_registry';
import {
  FREEHOLD_FENCED_CAS_SQL,
  type FreeholdQueryable,
  type FreeholdUpsert,
} from '../../server/freehold_db';
import { createFreeholdFencedWriter } from '../../server/freehold_fenced_write';
import { createFreeholdHearthTrips } from '../../server/freehold_hearth_trip';
import {
  commitFreeholdMutation,
  createFreeholdSaveHook,
  FREEHOLD_CLAIM_READ_FENCE_SQL,
  FREEHOLD_HOOK_STATEMENT_TIMEOUT_MS,
  FREEHOLD_VERIFY_WAIT_SQL,
  type FreeholdMutationOutcome,
  FreeholdMutationRefused,
  type FreeholdMutationRequest,
} from '../../server/freehold_mutation';
import type { OpenFreeholdOperation } from '../../server/freehold_operation_db';
import {
  createFreeholdOperationRecovery,
  FREEHOLD_OPERATION_RECONCILERS,
} from '../../server/freehold_operation_recovery';
import {
  FreeholdCommitAmbiguous,
  type FreeholdTxPool,
  freeholdCommitMayHaveLanded,
  freeholdTxBeginSql,
  runFreeholdTransaction,
} from '../../server/freehold_tx';
import { hearthKeyUseRefusal } from '../../server/freehold_wire';
import { stripComments } from '../helpers/strip_comments';
import { tsFilesUnder } from '../helpers/ts_files_under';

// ---------------------------------------------------------------------------
// A scripted pg client: answers by the first matching rule, records every
// statement, and can be told to lose a COMMIT's answer.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;
type Rule = { match: (text: string) => boolean; answer: (values?: unknown[]) => Row[] | Error };

function fakePool(rules: Rule[] = [], opts: { commitTag?: string; loseCommit?: boolean } = {}) {
  const statements: { text: string; values?: unknown[] }[] = [];
  let connects = 0;
  let releases = 0;
  const client = {
    async query(text: string, values?: unknown[]) {
      statements.push({ text, values });
      if (text === 'COMMIT') {
        if (opts.loseCommit) throw new Error('Connection terminated unexpectedly');
        return { rows: [], rowCount: 0, command: opts.commitTag ?? 'COMMIT' };
      }
      if (text === 'ROLLBACK' || text.startsWith('BEGIN'))
        return { rows: [], rowCount: 0, command: 'BEGIN' };
      const rule = rules.find((r) => r.match(text));
      const answer = rule ? rule.answer(values) : [];
      if (answer instanceof Error) throw answer;
      return { rows: answer, rowCount: answer.length, command: 'SELECT' };
    },
    release() {
      releases++;
    },
    on() {
      return client;
    },
    removeListener() {
      return client;
    },
  };
  // Cast once, here: the fake implements the narrow surface the modules use,
  // not node-postgres's whole QueryResult type.
  const pool = {
    async connect() {
      connects++;
      return client;
    },
    async query(text: string, values?: unknown[]) {
      return client.query(text, values);
    },
  } as unknown as FreeholdTxPool & FreeholdQueryable;
  return {
    pool,
    statements,
    texts: () => statements.map((s) => s.text),
    counts: () => ({ connects, releases }),
  };
}

const sqlError = (code: string): Error => Object.assign(new Error(`pg ${code}`), { code });

const BOUNDS = {
  operation: 'test',
  statementMs: 2_000,
  lockMs: 1_000,
  idleMs: 2_000,
  wallMs: 5_000,
};

describe('runFreeholdTransaction', () => {
  it('opens with ONE round trip carrying every bound, commits, and releases', async () => {
    const f = fakePool();
    await runFreeholdTransaction(f.pool, BOUNDS, async (tx) => tx.query('SELECT 1'));
    expect(f.texts()).toEqual([
      'BEGIN; SET LOCAL statement_timeout = 2000; SET LOCAL lock_timeout = 1000; SET LOCAL idle_in_transaction_session_timeout = 2000',
      'SELECT 1',
      'COMMIT',
    ]);
    expect(f.counts()).toEqual({ connects: 1, releases: 1 });
  });

  it('refuses a missing bound before it checks out a client', () => {
    expect(() => freeholdTxBeginSql({ ...BOUNDS, lockMs: 0 })).toThrow(RangeError);
    expect(() => freeholdTxBeginSql({ ...BOUNDS, idleMs: 1.5 })).toThrow(RangeError);
  });

  it('treats a ROLLBACK command tag as a proved rollback, never a success', async () => {
    const f = fakePool([], { commitTag: 'ROLLBACK' });
    await expect(runFreeholdTransaction(f.pool, BOUNDS, async () => 1)).rejects.toBeInstanceOf(
      DbTransactionRolledBack,
    );
  });

  it('calls a lost COMMIT answer ambiguous, and a failure before COMMIT not', async () => {
    const lost = fakePool([], { loseCommit: true });
    await expect(runFreeholdTransaction(lost.pool, BOUNDS, async () => 1)).rejects.toBeInstanceOf(
      FreeholdCommitAmbiguous,
    );
    // Control: the same codeless error BEFORE commit is a plain failure.
    const early = fakePool([{ match: (t) => t === 'SELECT 1', answer: () => new Error('socket') }]);
    const err = await runFreeholdTransaction(early.pool, BOUNDS, (tx) =>
      tx.query('SELECT 1'),
    ).catch((e: unknown) => e);
    expect(err).not.toBeInstanceOf(FreeholdCommitAmbiguous);
  });

  it('classifies only proved rollbacks as not landed', () => {
    expect(freeholdCommitMayHaveLanded(sqlError('55P03'))).toBe(false);
    expect(freeholdCommitMayHaveLanded(sqlError('57014'))).toBe(false);
    expect(freeholdCommitMayHaveLanded(new DbTransactionRolledBack('op', 'ROLLBACK'))).toBe(false);
    expect(freeholdCommitMayHaveLanded(new Error('Connection terminated'))).toBe(true);
    expect(freeholdCommitMayHaveLanded(sqlError('57P01'))).toBe(true);
  });

  it('refuses a spent signal before it asks the pool, so it never queues a waiter', async () => {
    const f = fakePool();
    const reason = new Error('budget spent');
    await expect(
      runFreeholdTransaction(f.pool, BOUNDS, async () => 1, { signal: AbortSignal.abort(reason) }),
    ).rejects.toBe(reason);
    expect(f.counts()).toEqual({ connects: 0, releases: 0 });
    // Control: a live signal still checks out and runs.
    const live = fakePool();
    await runFreeholdTransaction(live.pool, BOUNDS, async () => 1, {
      signal: new AbortController().signal,
    });
    expect(live.counts()).toEqual({ connects: 1, releases: 1 });
  });

  it('sends no ROLLBACK after a COMMIT that answered ROLLBACK or lost its answer', async () => {
    // The ROLLBACK tag already ended the transaction, and a lost answer
    // destroys the socket: a ROLLBACK after either is a wasted round trip.
    for (const opts of [{ commitTag: 'ROLLBACK' }, { loseCommit: true }]) {
      const f = fakePool([], opts);
      await runFreeholdTransaction(f.pool, BOUNDS, (tx) => tx.query('SELECT 1')).catch(() => 1);
      expect(f.texts().slice(1)).toEqual(['SELECT 1', 'COMMIT']);
    }
    // Control: a failure BEFORE commit does roll back.
    const early = fakePool([{ match: (t) => t === 'SELECT 1', answer: () => sqlError('22P02') }]);
    await runFreeholdTransaction(early.pool, BOUNDS, (tx) => tx.query('SELECT 1')).catch(() => 1);
    expect(early.texts().slice(1)).toEqual(['SELECT 1', 'ROLLBACK']);
  });

  it('interpolates only positive safe integers into SET LOCAL', () => {
    const bad: unknown[] = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53];
    bad.push('1; RESET ALL', '1000', null, undefined);
    for (const key of ['statementMs', 'lockMs', 'idleMs', 'wallMs'] as const) {
      for (const value of bad) {
        expect(() => freeholdTxBeginSql({ ...BOUNDS, [key]: value as number })).toThrow(RangeError);
      }
    }
    expect(freeholdTxBeginSql({ ...BOUNDS, statementMs: 2 ** 53 - 1 })).toContain(
      `statement_timeout = ${2 ** 53 - 1};`,
    );
  });
});

// ---------------------------------------------------------------------------
// The hook: order and refusals.
// ---------------------------------------------------------------------------
function recordingTx(answers: (text: string, values?: unknown[]) => Row[] | Error) {
  const seen: { text: string; values?: unknown[] }[] = [];
  return {
    seen,
    tx: {
      async query(text: string, values?: unknown[]) {
        seen.push({ text, values });
        const answer = answers(text, values);
        if (answer instanceof Error) throw answer;
        return { rows: answer, rowCount: answer.length };
      },
    },
  };
}

const HOLDER = 'realm#holder';
const UPSERT = (plotId: string): FreeholdUpsert & { expectedDurableRev: string } => ({
  accountId: 7,
  plotIndex: 0,
  plotId,
  tier: 'inn_room',
  layoutJson: '[]',
  trophiesJson: '[]',
  condition: 100,
  visitPolicy: 'closed',
  wireRev: 1,
  schemaVersion: 1,
  expectedDurableRev: '4',
});

/** Answers every participant as a success. */
const happy = (text: string): Row[] => {
  if (text.includes('FROM freehold_plot_claims') && text.includes('FOR NO KEY UPDATE')) {
    return [{ plot_id: 'plot:b' }];
  }
  if (text.startsWith('UPDATE freehold_plot_claims')) return [{ plot_id: 'plot:a' }];
  if (text.startsWith('UPDATE account_freeholds')) return [{ durable_rev: '5' }];
  if (text.startsWith('SELECT id FROM accounts')) return [{ id: 7 }];
  if (text.includes('FROM account_freehold_hearth') && text.includes('FOR UPDATE')) {
    return [{ ready_at_ms: '0', revision: '3', now_ms: '1000', clock_ms: '1000' }];
  }
  if (text.startsWith('UPDATE account_freehold_hearth'))
    return [{ ready_at_ms: '61000', revision: '4' }];
  if (text.includes('FROM freehold_operations WHERE operation_id = $1 FOR UPDATE')) {
    return [
      {
        account_id: 7,
        plot_id: 'plot:a',
        kind: 'test_kind',
        fingerprint: 'f'.repeat(64),
        expected_durable_rev: '4',
        fence_generation: '2',
      },
    ];
  }
  if (text.startsWith('INSERT INTO freehold_operation_receipts'))
    return [{ operation_id: 'fop:x' }];
  return [];
};

const REQUEST: FreeholdMutationRequest = {
  accountIds: [7],
  claimProofs: [{ plotId: 'plot:b', holder: HOLDER, generation: '2' }],
  plots: [
    { upsert: UPSERT('plot:a'), fence: { plotId: 'plot:a', holder: HOLDER, generation: '2' } },
  ],
  operations: [
    {
      operationId: 'fop:x',
      accountId: 7,
      fingerprint: 'f'.repeat(64),
      fenceGeneration: '2',
      expectedDurableRev: '4',
    },
  ],
  hearth: { accountId: 7, cooldownMs: 60_000 },
};

const kindOf = (text: string): string => {
  if (text.startsWith('SET LOCAL statement_timeout')) return 'bound';
  if (text === FREEHOLD_CLAIM_READ_FENCE_SQL) return 'G4 read';
  if (text === FREEHOLD_CLAIM_FENCE_SQL) return 'G4 write';
  if (text.includes('pg_advisory_xact_lock')) return 'G5b';
  if (text.includes('freehold_operation')) return 'G6';
  if (text.startsWith('UPDATE account_freeholds')) return 'G7';
  if (text.includes('account_freehold_hearth') || text.startsWith('SELECT id FROM accounts'))
    return 'G8';
  return text;
};

describe('the housing hook', () => {
  it('runs its participants in the manifest order: bound, G4 by plot id, G5b and G6, G7, G8', async () => {
    const { hook } = createFreeholdSaveHook(REQUEST);
    const { tx, seen } = recordingTx(happy);
    await hook.run(tx);
    const order = seen.map((s) => kindOf(s.text));
    expect(order[0]).toBe('bound');
    expect(seen[0].text).toBe(
      `SET LOCAL statement_timeout = ${FREEHOLD_HOOK_STATEMENT_TIMEOUT_MS}`,
    );
    // plot:a (a write fence) sorts before plot:b (a read proof).
    expect(order.slice(1, 3)).toEqual(['G4 write', 'G4 read']);
    expect(seen[1].values?.[0]).toBe('plot:a');
    expect(seen[2].values?.[0]).toBe('plot:b');
    const g5 = order.indexOf('G5b');
    const g7 = order.indexOf('G7');
    const g8 = order.indexOf('G8');
    expect(g5).toBeGreaterThan(2);
    expect(g7).toBeGreaterThan(g5);
    expect(g8).toBeGreaterThan(g7);
    expect(order.slice(g8).every((k) => k === 'G8')).toBe(true);
  });

  it('declares its accounts ascending and deduplicated, for the save G1 set', () => {
    const { hook } = createFreeholdSaveHook({
      ...REQUEST,
      accountIds: [9, 7, 9],
      plots: [],
      operations: [],
      hearth: null,
      claimProofs: [],
    });
    expect(hook.accountIds).toEqual([7, 9]);
  });

  it('refuses an undeclared account participant before any SQL', () => {
    expect(() => createFreeholdSaveHook({ ...REQUEST, accountIds: [8] })).toThrow(
      /declared account participant/,
    );
  });

  it('refuses an operation whose account is not a declared participant, before any SQL', () => {
    expect(() =>
      createFreeholdSaveHook({
        ...REQUEST,
        operations: [{ ...REQUEST.operations[0], accountId: 8 }],
      }),
    ).toThrow(/operation account must be a declared account participant/);
  });

  it('refuses to close an intent of ANOTHER account than the one it locked', async () => {
    const { hook } = createFreeholdSaveHook(REQUEST);
    const { tx } = recordingTx((t) =>
      t.includes('FROM freehold_operations WHERE operation_id = $1 FOR UPDATE')
        ? [{ ...happy(t)[0], account_id: 9 }]
        : happy(t),
    );
    const err = await hook.run(tx).catch((e: unknown) => e);
    expect((err as FreeholdMutationRefused).refusal).toEqual({
      kind: 'operation',
      operationId: 'fop:x',
      reason: 'account',
    });
  });

  it('stamps a FRESH token per write fence and a fresh advance token, distinct per attempt', async () => {
    const one = createFreeholdSaveHook(REQUEST);
    const two = createFreeholdSaveHook(REQUEST);
    expect(one.writeTokens.get('plot:a')).toMatch(/^[0-9a-f]{32}$/);
    expect(one.advanceToken).toMatch(/^[0-9a-f]{32}$/);
    expect(one.writeTokens.get('plot:a')).not.toBe(two.writeTokens.get('plot:a'));
    expect(one.advanceToken).not.toBe(two.advanceToken);
    const { tx, seen } = recordingTx(happy);
    await one.hook.run(tx);
    expect(seen.find((s) => s.text === FREEHOLD_CLAIM_FENCE_SQL)?.values?.[3]).toBe(
      one.writeTokens.get('plot:a'),
    );
    const advance = seen.find((s) => s.text.startsWith('UPDATE account_freehold_hearth'));
    expect(advance?.values?.[3]).toBe(one.advanceToken);
  });

  for (const [name, broken, kind] of [
    ['a lost claim', (t: string) => (t === FREEHOLD_CLAIM_FENCE_SQL ? [] : null), 'claim'],
    ['a stale plot', (t: string) => (t.startsWith('UPDATE account_freeholds') ? [] : null), 'plot'],
    [
      'a closed operation',
      (t: string) => (t.startsWith('INSERT INTO freehold_operation_receipts') ? [] : null),
      'operation',
    ],
    [
      'a Hearth cooldown',
      (t: string) =>
        t.includes('FROM account_freehold_hearth') && t.includes('FOR UPDATE')
          ? [{ ready_at_ms: '5000', revision: '3', now_ms: '1000', clock_ms: '1000' }]
          : null,
      'hearth',
    ],
  ] as const) {
    it(`refuses on ${name} by THROWING, so the save rolls every half back`, async () => {
      const { hook } = createFreeholdSaveHook(REQUEST);
      const { tx } = recordingTx((t, v) => broken(t) ?? happy(t));
      const err = await hook.run(tx).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(FreeholdMutationRefused);
      expect((err as FreeholdMutationRefused).refusal.kind).toBe(kind);
    });
  }
});

describe('commitWithHousing', () => {
  const tx = () => {
    const calls: string[] = [];
    return {
      calls,
      t: {
        async query(text: string) {
          calls.push(text);
          return { rows: [] };
        },
        async commit() {
          calls.push('commit');
        },
        async commitChecked() {
          calls.push('commitChecked');
        },
      },
    };
  };

  it('commits an unhooked save exactly as before', async () => {
    const { calls, t } = tx();
    await commitWithHousing(t, undefined, []);
    expect(calls).toEqual(['commit']);
  });

  it('refuses a hook whose account was not locked at G1, before running it', async () => {
    const { calls, t } = tx();
    const run = vi.fn(async () => {});
    const hook: CharacterSaveHousingHook = {
      accountIds: [7],
      run,
      commitSent() {},
      committed() {},
    };
    await expect(commitWithHousing(t, hook, [3])).rejects.toThrow(/not locked/);
    expect(run).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
    // Control: the same hook with its account locked runs and commits checked.
    await commitWithHousing(t, hook, [3, 7]);
    expect(run).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['commitChecked']);
  });

  it('wraps the persist call only when the hook asks', async () => {
    const persist = async () => 'done';
    expect(housingPersist(undefined, persist)).toBe(persist);
    const seen: string[] = [];
    const hook = {
      accountIds: [],
      run: async () => {},
      commitSent() {},
      committed() {},
      wrapPersist: async <T>(p: () => Promise<T>) => {
        seen.push('in');
        return p();
      },
    } as CharacterSaveHousingHook;
    expect(await housingPersist(hook, persist)()).toBe('done');
    expect(seen).toEqual(['in']);
  });
});

// ---------------------------------------------------------------------------
// commitFreeholdMutation: the outcome comes from the hook.
// ---------------------------------------------------------------------------
type SaveScript = (hook: CharacterSaveHousingHook) => Promise<boolean>;

/** A save that runs the hook inside the persist wrapper, the way db.ts does. */
const saveThatRuns =
  (opts: { loseCommit?: boolean; refuse?: boolean } = {}): SaveScript =>
  async (hook) => {
    const job = async () => {
      const persist = async () => {
        if (opts.refuse) throw new FreeholdMutationRefused({ kind: 'claim', plotId: 'plot:a' });
        await hook.run(recordingTx(happy).tx);
        hook.commitSent();
        if (opts.loseCommit) throw new Error('Connection terminated unexpectedly');
        hook.committed();
        return true;
      };
      return housingPersist(hook, persist)();
    };
    return hook.wrap ? hook.wrap(job) : job();
  };

const verifyPool = (landed: boolean | 'mixed') =>
  fakePool([
    { match: (t) => t === FREEHOLD_VERIFY_WAIT_SQL, answer: () => [{ '?column?': 1 }] },
    {
      match: (t) => t.includes('advance_token'),
      answer: () => [{ advance_token: landed === false ? 'other' : 'MATCH' }],
    },
  ]);

describe('commitFreeholdMutation', () => {
  const HEARTH_ONLY: FreeholdMutationRequest = {
    accountIds: [7],
    claimProofs: [],
    plots: [],
    operations: [],
    hearth: { accountId: 7, cooldownMs: 60_000 },
  };

  it('answers committed with the advance from a proved COMMIT', async () => {
    const out = await commitFreeholdMutation(
      { save: saveThatRuns(), pool: fakePool().pool, characterId: 1 },
      HEARTH_ONLY,
    );
    expect(out.kind).toBe('committed');
    expect((out as Extract<FreeholdMutationOutcome, { kind: 'committed' }>).hearth?.revision).toBe(
      '4',
    );
    expect((out as Extract<FreeholdMutationOutcome, { kind: 'committed' }>).verified).toBe(false);
  });

  it('answers not_run when the save never reached the hook, whatever its boolean', async () => {
    for (const result of [true, false]) {
      const out = await commitFreeholdMutation(
        { save: async () => result, pool: fakePool().pool, characterId: 1 },
        HEARTH_ONLY,
      );
      expect(out).toEqual({ kind: 'not_run' });
    }
  });

  it('answers refused with the participant refusal, and verifies nothing', async () => {
    const pool = verifyPool(true);
    const out = await commitFreeholdMutation(
      { save: saveThatRuns({ refuse: true }), pool: pool.pool, characterId: 1 },
      HEARTH_ONLY,
    );
    expect(out).toEqual({ kind: 'refused', refusal: { kind: 'claim', plotId: 'plot:a' } });
    expect(pool.counts().connects).toBe(0);
  });

  it('verifies a lost COMMIT answer: the wait first, then the token read, inside the persist wrap', async () => {
    // The token the hook stamped is minted per attempt, so the fake pool learns
    // it from the statement the hook issued.
    let minted = '';
    const save: SaveScript = async (hook) => {
      const persist = async () => {
        const { tx, seen } = recordingTx(happy);
        await hook.run(tx);
        minted = String(
          seen.find((s) => s.text.startsWith('UPDATE account_freehold_hearth'))?.values?.[3],
        );
        hook.commitSent();
        throw new Error('Connection terminated unexpectedly');
      };
      return housingPersist(hook, persist)();
    };
    const pool = fakePool([
      { match: (t) => t === FREEHOLD_VERIFY_WAIT_SQL, answer: () => [{ x: 1 }] },
      { match: (t) => t.includes('advance_token'), answer: () => [{ advance_token: minted }] },
    ]);
    const out = await commitFreeholdMutation(
      { save, pool: pool.pool, characterId: 42 },
      HEARTH_ONLY,
    );
    expect(out.kind).toBe('committed');
    expect((out as Extract<FreeholdMutationOutcome, { kind: 'committed' }>).verified).toBe(true);
    const texts = pool.texts().filter((t) => !t.startsWith('BEGIN') && t !== 'COMMIT');
    expect(texts[0]).toBe(FREEHOLD_VERIFY_WAIT_SQL);
    expect(pool.statements.find((s) => s.text === FREEHOLD_VERIFY_WAIT_SQL)?.values).toEqual([42]);
  });

  it('answers not_landed when the token on the row is another attempt', async () => {
    const out = await commitFreeholdMutation(
      { save: saveThatRuns({ loseCommit: true }), pool: verifyPool(false).pool, characterId: 1 },
      HEARTH_ONLY,
    );
    expect(out.kind).toBe('not_landed');
  });

  it('answers unresolved when the verify itself cannot read', async () => {
    const broken = fakePool([
      { match: (t) => t === FREEHOLD_VERIFY_WAIT_SQL, answer: () => sqlError('55P03') },
    ]);
    const out = await commitFreeholdMutation(
      { save: saveThatRuns({ loseCommit: true }), pool: broken.pool, characterId: 1 },
      HEARTH_ONLY,
    );
    expect(out.kind).toBe('unresolved');
  });

  it('pins the verify wait as a literal FOR SHARE on the character row', () => {
    expect(FREEHOLD_VERIFY_WAIT_SQL).toBe('SELECT 1 FROM characters WHERE id = $1 FOR SHARE');
  });

  /** Counts real checkouts, the live peak, and what each release was handed. */
  const countingPool = (inner: FreeholdTxPool) => {
    let live = 0;
    const seen = { connects: 0, peak: 0, releases: [] as unknown[] };
    const pool: FreeholdTxPool = {
      async connect() {
        seen.connects++;
        live++;
        seen.peak = Math.max(seen.peak, live);
        const client = await inner.connect();
        return {
          query: (text: string, values?: unknown[]) => client.query(text, values),
          release: (error?: Error | boolean) => {
            live--;
            seen.releases.push(error);
            client.release(error);
          },
          on: (event: 'error', listener: (error: Error) => void) => client.on(event, listener),
          removeListener: (event: 'error', listener: (error: Error) => void) =>
            client.removeListener(event, listener),
        } as unknown as Awaited<ReturnType<FreeholdTxPool['connect']>>;
      },
    };
    return { pool, seen };
  };

  it('runs the wait and the reads on ONE checkout, released once and healthy', async () => {
    const inner = verifyPool(false);
    const counted = countingPool(inner.pool);
    const out = await commitFreeholdMutation(
      { save: saveThatRuns({ loseCommit: true }), pool: counted.pool, characterId: 9 },
      HEARTH_ONLY,
    );
    expect(out.kind).toBe('not_landed');
    // Both transactions ran (the wait, then the token read) on the one client.
    const texts = inner.texts().filter((t) => !t.startsWith('BEGIN') && t !== 'COMMIT');
    expect(texts[0]).toBe(FREEHOLD_VERIFY_WAIT_SQL);
    expect(texts.some((t) => t.includes('advance_token'))).toBe(true);
    expect(inner.texts().filter((t) => t === 'COMMIT')).toHaveLength(2);
    expect(counted.seen).toEqual({ connects: 1, peak: 1, releases: [undefined] });
  });

  it('ends the verify on a client the wait left broken: no second checkout, released once with the error', async () => {
    const broken = new Error('socket gone');
    const inner = fakePool([
      { match: (t) => t === FREEHOLD_VERIFY_WAIT_SQL, answer: () => broken },
    ]);
    const counted = countingPool(inner.pool);
    const out = await commitFreeholdMutation(
      { save: saveThatRuns({ loseCommit: true }), pool: counted.pool, characterId: 9 },
      HEARTH_ONLY,
    );
    expect(out.kind).toBe('unresolved');
    expect(inner.texts().some((t) => t.includes('advance_token'))).toBe(false);
    expect(counted.seen.connects).toBe(1);
    expect(counted.seen.releases).toHaveLength(1);
    expect(counted.seen.releases[0]).toBe(broken);
  });

  it('runs the live apply INSIDE serialize, after the commit and only for a commit', async () => {
    const events: string[] = [];
    const serialize = async <T>(job: () => Promise<T>) => {
      events.push('enter');
      const r = await job();
      events.push('exit');
      return r;
    };
    await commitFreeholdMutation(
      { save: saveThatRuns(), pool: fakePool().pool, characterId: 1 },
      HEARTH_ONLY,
      { serialize, onCommitted: () => events.push('apply') },
    );
    expect(events).toEqual(['enter', 'apply', 'exit']);
    events.length = 0;
    await commitFreeholdMutation(
      { save: saveThatRuns({ refuse: true }), pool: fakePool().pool, characterId: 1 },
      HEARTH_ONLY,
      { serialize, onCommitted: () => events.push('apply') },
    );
    expect(events).toEqual(['enter']);
  });
});

// ---------------------------------------------------------------------------
// The claim registry and renewer.
// ---------------------------------------------------------------------------
describe('the claim renewer', () => {
  const claim = (plotId: string, accountId: number) => ({
    plotId,
    accountId,
    generation: '1',
    acquiredAtMs: 0,
  });

  it('renews the wanted, keeps a skipped-but-held one, drops a taken one, releases the rest', async () => {
    const registry = createFreeholdClaimRegistry();
    for (const [p, a] of [
      ['plot:a', 1],
      ['plot:b', 2],
      ['plot:c', 3],
      ['plot:d', 4],
    ] as const)
      registry.record(claim(p, a));
    const f = fakePool([
      { match: (t) => t.includes('SET heartbeat_at'), answer: () => [{ plot_id: 'plot:a' }] },
      // plot:b was SKIP LOCKED and is still ours; plot:c is not.
      {
        match: (t) => t.startsWith('SELECT plot_id FROM freehold_plot_claims'),
        answer: () => [{ plot_id: 'plot:b' }],
      },
      {
        match: (t) => t.includes('SET expires_at = clock_timestamp()'),
        answer: () => [{ plot_id: 'plot:d' }],
      },
    ]);
    const lost: string[] = [];
    await renewFreeholdClaims({
      registry,
      pool: f.pool,
      holder: HOLDER,
      ttlSeconds: 90,
      wanted: (c) => c.plotId !== 'plot:d',
      onLost: (c) => lost.push(c.plotId),
      nowMs: () => 0,
      warn: () => {},
    });
    expect(registry.counters.renewed).toBe(1);
    expect(registry.counters.missedHeartbeats).toBe(1);
    expect(registry.counters.lost).toBe(1);
    expect(registry.counters.released).toBe(1);
    expect(lost).toEqual(['plot:c']);
    expect(registry.forPlot('plot:a')).toBeDefined();
    expect(registry.forPlot('plot:b')).toBeDefined();
    expect(registry.forPlot('plot:c')).toBeUndefined();
    expect(registry.forPlot('plot:d')).toBeUndefined();
    // The ids went out SORTED.
    const renew = f.statements.find((s) => s.text.includes('SET heartbeat_at'));
    expect(renew?.values?.[2]).toEqual(['plot:a', 'plot:b', 'plot:c']);
  });

  it('drops only the claims a release actually released: a skipped live one stays for the next pass', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    registry.record(claim('plot:b', 2));
    registry.record(claim('plot:c', 3));
    const f = fakePool([
      // The release returned only plot:a; plot:b was SKIP LOCKED (still ours),
      // plot:c had already expired (no longer anyone's live claim).
      { match: (t) => t.includes("holder || '#released'"), answer: () => [{ plot_id: 'plot:a' }] },
      {
        match: (t) => t.startsWith('SELECT plot_id FROM freehold_plot_claims'),
        answer: () => [{ plot_id: 'plot:b' }],
      },
    ]);
    await renewFreeholdClaims({
      registry,
      pool: f.pool,
      holder: HOLDER,
      ttlSeconds: 90,
      wanted: () => false,
      nowMs: () => 0,
      warn: () => {},
    });
    expect(registry.counters.released).toBe(1);
    expect(registry.forPlot('plot:a')).toBeUndefined();
    expect(registry.forPlot('plot:b')).toBeDefined();
    expect(registry.forPlot('plot:c')).toBeUndefined();
  });

  it('counts a THROWN chunk as missed heartbeats and keeps every claim in it', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([
      { match: (t) => t.includes('SET heartbeat_at'), answer: () => sqlError('57014') },
    ]);
    await renewFreeholdClaims({
      registry,
      pool: f.pool,
      holder: HOLDER,
      ttlSeconds: 90,
      wanted: () => true,
      nowMs: () => 0,
      warn: () => {},
    });
    expect(registry.counters.missedHeartbeats).toBe(1);
    expect(registry.counters.lost).toBe(0);
    expect(registry.forPlot('plot:a')).toBeDefined();
  });

  it('chunks at the bound, one transaction per chunk', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++)
      registry.record(claim(`plot:${String(i).padStart(4, '0')}`, i + 1));
    const f = fakePool([
      {
        match: (t) => t.includes('SET heartbeat_at'),
        answer: (v) => ((v ?? [])[2] as string[]).map((plot_id) => ({ plot_id })),
      },
    ]);
    await renewFreeholdClaims({
      registry,
      pool: f.pool,
      holder: HOLDER,
      ttlSeconds: 90,
      wanted: () => true,
      nowMs: () => 0,
      warn: () => {},
    });
    const renews = f.statements.filter((s) => s.text.includes('SET heartbeat_at'));
    expect(renews.map((s) => ((s.values ?? [])[2] as string[]).length)).toEqual([
      FREEHOLD_CLAIM_RENEW_CHUNK,
      1,
    ]);
    expect(f.counts().connects).toBe(2);
  });

  it('keeps an in-flight hold wanted until its LAST release', () => {
    const registry = createFreeholdClaimRegistry();
    const a = registry.holdInFlight('plot:a');
    const b = registry.holdInFlight('plot:a');
    a();
    a();
    expect(registry.inFlight('plot:a')).toBe(true);
    b();
    expect(registry.inFlight('plot:a')).toBe(false);
  });

  const renewAll: Rule = {
    match: (t) => t.includes('SET heartbeat_at'),
    answer: (v) => ((v ?? [])[2] as string[]).map((plot_id) => ({ plot_id })),
  };
  const pad = (i: number) => `plot:${String(i).padStart(4, '0')}`;
  const firstIdOf = (s: { values?: unknown[] }) => ((s.values ?? [])[2] as string[])[0];
  const renewDeps = (
    registry: ReturnType<typeof createFreeholdClaimRegistry>,
    pool: FreeholdTxPool,
  ) => ({
    registry,
    pool,
    holder: HOLDER,
    ttlSeconds: 90,
    wanted: () => true,
    nowMs: () => 0,
    warn: () => {},
  });

  it('runs one pass at a time: overlapping triggers are skipped and counted, peak one client', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    const f = fakePool([renewAll]);
    let active = 0;
    let peak = 0;
    // A slow checkout, so overlapping passes WOULD hold clients side by side.
    const pool = {
      async connect() {
        await new Promise((resolve) => setTimeout(resolve, 2));
        const client = await f.pool.connect();
        active++;
        peak = Math.max(peak, active);
        let out = false;
        const leased = {
          query: (text: string, values?: unknown[]) => client.query(text, values),
          release: () => {
            if (!out) active--;
            out = true;
            client.release();
          },
          on: () => leased,
          removeListener: () => leased,
        };
        return leased;
      },
    } as unknown as FreeholdTxPool;
    const deps = renewDeps(registry, pool);
    await Promise.all([
      renewFreeholdClaims(deps),
      renewFreeholdClaims(deps),
      renewFreeholdClaims(deps),
    ]);
    expect(peak).toBe(1);
    expect(f.counts().connects).toBe(2);
    expect(registry.counters).toMatchObject({
      renewPasses: 1,
      renewPassesSkipped: 2,
      renewed: FREEHOLD_CLAIM_RENEW_CHUNK + 1,
    });
    // Once the pass has ended, the next trigger runs.
    await renewFreeholdClaims(deps);
    expect(registry.counters).toMatchObject({ renewPasses: 2, renewPassesSkipped: 2 });
    expect(peak).toBe(1);
  });

  it('abandons the chunks its deadline leaves unstarted as missed heartbeats, and starts there next pass', async () => {
    const registry = createFreeholdClaimRegistry();
    const wantedCount = 2 * FREEHOLD_CLAIM_RENEW_CHUNK + 1;
    for (let i = 0; i < wantedCount; i++) registry.record(claim(pad(i), i + 1));
    registry.record(claim('plot:zzzz', 9_999));
    let now = 1_000;
    let stall = true;
    const f = fakePool([
      {
        match: (t) => t.includes('SET heartbeat_at'),
        answer: (v) => {
          // The first chunk takes the whole pass deadline.
          if (stall) now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
          stall = false;
          return ((v ?? [])[2] as string[]).map((plot_id) => ({ plot_id }));
        },
      },
    ]);
    const warn = vi.fn();
    const deps = {
      ...renewDeps(registry, f.pool),
      wanted: (c: { plotId: string }) => c.plotId !== 'plot:zzzz',
      nowMs: () => now,
      warn,
    };
    const renews = () => f.statements.filter((s) => s.text.includes('SET heartbeat_at'));
    await renewFreeholdClaims(deps);
    expect(renews().map(firstIdOf)).toEqual([pad(0)]);
    expect(registry.counters).toMatchObject({
      renewed: FREEHOLD_CLAIM_RENEW_CHUNK,
      missedHeartbeats: FREEHOLD_CLAIM_RENEW_CHUNK + 1,
      // The two renew chunks left, and the release chunk behind them.
      renewChunksAbandoned: 3,
      released: 0,
      lost: 0,
      renewPasses: 1,
      renewPassMsTotal: FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS,
    });
    expect(registry.count()).toBe(wantedCount + 1);
    expect(f.texts().some((t) => t.includes("'#released'"))).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deadline'));
    // The next pass STARTS at the first chunk the deadline abandoned.
    await renewFreeholdClaims(deps);
    expect(renews().slice(1).map(firstIdOf)).toEqual([pad(256), pad(512), pad(0)]);
    expect(registry.counters.renewed).toBe(FREEHOLD_CLAIM_RENEW_CHUNK + wantedCount);
    expect(registry.forPlot('plot:zzzz')).toBeUndefined();
  });

  it('starts each full pass one chunk later than the last, so no chunk is always last', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < 2 * FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) {
      registry.record(claim(pad(i), i + 1));
    }
    const f = fakePool([renewAll]);
    const deps = renewDeps(registry, f.pool);
    for (let pass = 0; pass < 4; pass++) await renewFreeholdClaims(deps);
    const firsts = f.statements.filter((s) => s.text.includes('SET heartbeat_at')).map(firstIdOf);
    const [a, b, c] = [pad(0), pad(256), pad(512)];
    expect(firsts).toEqual([a, b, c, b, c, a, c, a, b, a, b, c]);
    expect(registry.counters.renewed).toBe(4 * (2 * FREEHOLD_CLAIM_RENEW_CHUNK + 1));
  });

  it('keeps and renews a claim whose wanted test throws, counted, with one fixed warn per pass', async () => {
    const registry = createFreeholdClaimRegistry();
    for (const [p, a] of [
      ['plot:a', 1],
      ['plot:b', 2],
      ['plot:c', 3],
    ] as const)
      registry.record(claim(p, a));
    const f = fakePool([renewAll]);
    const warn = vi.fn();
    await renewFreeholdClaims({
      ...renewDeps(registry, f.pool),
      wanted: (c) => {
        if (c.accountId !== 3) throw new Error(`no owner key for ${c.accountId}`);
        return false;
      },
      warn,
    });
    expect(registry.counters).toMatchObject({ wantedThrew: 2, renewed: 2, released: 0 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'freehold claim wanted check threw; those claims are kept and renewed',
    );
    expect(registry.forPlot('plot:a')).toBeDefined();
    expect(registry.forPlot('plot:b')).toBeDefined();
    // Control: the one that answered unwanted left the registry as before.
    expect(registry.forPlot('plot:c')).toBeUndefined();
    const renew = f.statements.find((s) => s.text.includes('SET heartbeat_at'));
    expect(renew?.values?.[2]).toEqual(['plot:a', 'plot:b']);
  });

  it('retires a pending token on an unclaimed plot once nothing wants its owner, and only then', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:held', 1));
    const note = (plotId: string, accountId: number, mark: string, notedAtMs: number) =>
      registry.notePending({ plotId, accountId, writeToken: mark.repeat(32), notedAtMs });
    note('plot:held', 1, 'a', 5);
    note('plot:gone', 2, 'b', 6);
    note('plot:kept', 3, 'c', 7);
    note('plot:odd', 4, 'd', 8);
    const asked: { plotId: string; accountId: number; acquiredAtMs: number }[] = [];
    const f = fakePool([renewAll]);
    await renewFreeholdClaims({
      ...renewDeps(registry, f.pool),
      wanted: ({ plotId, accountId, acquiredAtMs }) => {
        asked.push({ plotId, accountId, acquiredAtMs });
        if (accountId === 4) throw new Error('no owner key');
        return accountId === 1 || accountId === 3;
      },
    });
    expect(registry.pendingToken('plot:gone')).toBeNull();
    // Still wanted (the store holds the owner): its insert retry needs it.
    expect(registry.pendingToken('plot:kept')).toBe('c'.repeat(32));
    // A throwing test keeps it, the safe side.
    expect(registry.pendingToken('plot:odd')).toBe('d'.repeat(32));
    // A claimed plot's token is the writer's, never the sweep's.
    expect(registry.pendingToken('plot:held')).toBe('a'.repeat(32));
    expect(registry.counters).toMatchObject({ pendingSwept: 1, wantedThrew: 1 });
    // The host's own question, aged from when the token was noted.
    expect(asked).toContainEqual({ plotId: 'plot:gone', accountId: 2, acquiredAtMs: 6 });
    expect(asked.filter((q) => q.plotId === 'plot:held')).toHaveLength(1);
  });

  it('hands the renewer a fresh array of the claims held, never its own storage', () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:b', 2));
    registry.record(claim('plot:a', 1));
    const all = registry.all();
    expect(all).not.toBe(registry.all());
    all.pop();
    expect(registry.count()).toBe(2);
    expect(registry.all()).toHaveLength(2);
  });

  it('hands the shutdown release the LIVE registry, so a release at exit books claim_released', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    registry.record(claim('plot:b', 2));
    registerFreeholdAuthority({ claims: registry, trips: { counters: {} } } as Parameters<
      typeof registerFreeholdAuthority
    >[0]);
    try {
      expect(heldClaims()).toBe(registry);
      const f = fakePool([
        {
          match: (t) => t.includes("'#released'") && !t.includes('ANY('),
          answer: () => [{ plot_id: 'plot:a' }, { plot_id: 'plot:b' }],
        },
      ]);
      expect(
        await releaseAllFreeholdClaims({ pool: f.pool, holder: HOLDER, registry: heldClaims() }),
      ).toBe(2);
      expect(registry.count()).toBe(0);
      expect(registry.counters.released).toBe(2);
    } finally {
      registerFreeholdAuthority(null);
    }
    expect(heldClaims()).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The fenced writer.
// ---------------------------------------------------------------------------
describe('the fenced plot writer', () => {
  const writerOn = (rules: Rule[]) => {
    const registry = createFreeholdClaimRegistry();
    const f = fakePool(rules);
    const write = createFreeholdFencedWriter({
      pool: f.pool,
      registry,
      holder: HOLDER,
      realm: 'test',
      ttlSeconds: 90,
      nowMs: () => 0,
    });
    return { registry, f, write };
  };

  it('answers fenced with NO statement when this process holds no claim for the plot', async () => {
    const { f, write, registry } = writerOn([]);
    expect(await write(UPSERT('plot:a'))).toEqual({ kind: 'fenced' });
    expect(f.statements).toEqual([]);
    expect(registry.counters.fencedWrites).toBe(1);
  });

  it('writes an existing row in ONE autocommit statement', async () => {
    const { f, write, registry } = writerOn([
      {
        match: (t) => t.startsWith('WITH fence AS MATERIALIZED'),
        answer: () => [{ fenced: 1, durable_rev: '5', stamped: 1 }],
      },
    ]);
    registry.record({ plotId: 'plot:a', accountId: 7, generation: '3', acquiredAtMs: 0 });
    expect(await write(UPSERT('plot:a'))).toEqual({ kind: 'updated', durableRev: '5' });
    expect(f.texts()).toHaveLength(1);
    expect(f.counts().connects).toBe(0);
    expect(f.statements[0].values?.slice(11)).toEqual(['plot:a', HOLDER, '3']);
  });

  it('drops the claim on a fenced answer, and notes a pending token on an unproved throw', async () => {
    const fenced = writerOn([
      {
        match: (t) => t.startsWith('WITH fence'),
        answer: () => [{ fenced: 0, durable_rev: null, stamped: 0 }],
      },
    ]);
    fenced.registry.record({ plotId: 'plot:a', accountId: 7, generation: '3', acquiredAtMs: 0 });
    expect(await fenced.write(UPSERT('plot:a'))).toEqual({ kind: 'fenced' });
    expect(fenced.registry.forPlot('plot:a')).toBeUndefined();

    const lost = writerOn([
      { match: (t) => t.startsWith('WITH fence'), answer: () => new Error('socket gone') },
    ]);
    lost.registry.record({ plotId: 'plot:a', accountId: 7, generation: '3', acquiredAtMs: 0 });
    await expect(lost.write(UPSERT('plot:a'))).rejects.toThrow('socket gone');
    expect(lost.registry.pendingToken('plot:a')).toMatch(/^[0-9a-f]{32}$/);
    // Control: a proved rollback notes nothing.
    const proved = writerOn([
      { match: (t) => t.startsWith('WITH fence'), answer: () => sqlError('57014') },
    ]);
    proved.registry.record({ plotId: 'plot:a', accountId: 7, generation: '3', acquiredAtMs: 0 });
    await expect(proved.write(UPSERT('plot:a'))).rejects.toThrow();
    expect(proved.registry.pendingToken('plot:a')).toBeNull();
  });

  it('ADOPTS the row revision when the locked token proves its earlier write landed', async () => {
    const { f, write, registry } = writerOn([
      {
        match: (t) => t.startsWith('SELECT write_token'),
        answer: () => [{ write_token: 'a'.repeat(32) }],
      },
      { match: (t) => t.startsWith('SELECT durable_rev'), answer: () => [{ durable_rev: '9' }] },
      {
        match: (t) => t.startsWith('WITH fence'),
        answer: (v) => [{ fenced: 1, durable_rev: String(Number(v?.[2]) + 1), stamped: 1 }],
      },
    ]);
    registry.record({ plotId: 'plot:a', accountId: 7, generation: '3', acquiredAtMs: 0 });
    registry.notePending({
      plotId: 'plot:a',
      accountId: 7,
      writeToken: 'a'.repeat(32),
      notedAtMs: 0,
    });
    expect(await write(UPSERT('plot:a'))).toEqual({ kind: 'updated', durableRev: '10' });
    expect(registry.counters.selfAdopted).toBe(1);
    expect(registry.pendingToken('plot:a')).toBeNull();
    // Control: another token keeps the store's expected revision.
    const other = writerOn([
      {
        match: (t) => t.startsWith('SELECT write_token'),
        answer: () => [{ write_token: 'b'.repeat(32) }],
      },
      {
        match: (t) => t.startsWith('WITH fence'),
        answer: (v) => [{ fenced: 1, durable_rev: String(Number(v?.[2]) + 1), stamped: 1 }],
      },
    ]);
    other.registry.record({ plotId: 'plot:a', accountId: 7, generation: '3', acquiredAtMs: 0 });
    other.registry.notePending({
      plotId: 'plot:a',
      accountId: 7,
      writeToken: 'a'.repeat(32),
      notedAtMs: 0,
    });
    expect(await other.write(UPSERT('plot:a'))).toEqual({ kind: 'updated', durableRev: '5' });
    expect(other.registry.counters.selfAdopted).toBe(0);
    expect(f.counts().connects).toBe(1);
  });

  it('inserts a first plot with its generation-1 claim and records it only after the commit', async () => {
    const { write, registry } = writerOn([
      {
        match: (t) => t.includes('INSERT INTO freehold_plot_claims'),
        answer: () => [{ plot_id: 'plot:new' }],
      },
      {
        match: (t) => t.startsWith('INSERT INTO account_freeholds'),
        answer: () => [{ durable_rev: '1' }],
      },
    ]);
    const result = await write({ ...UPSERT('plot:new'), expectedDurableRev: null });
    expect(result).toEqual({ kind: 'inserted', durableRev: '1' });
    expect(registry.forPlot('plot:new')?.generation).toBe('1');
  });

  /** A first insert whose COMMIT answer is lost, a renew pass, then the
   *  store's retry of the same insert, which finds its own claim row. */
  async function ambiguousFirstInsert(ownerWanted: boolean) {
    const opts = { loseCommit: true };
    let landed = false;
    let landedToken: string | null = null;
    const registry = createFreeholdClaimRegistry();
    const f = fakePool(
      [
        {
          match: (t) => t.includes('INSERT INTO freehold_plot_claims'),
          answer: () => (landed ? [] : [{ plot_id: 'plot:new' }]),
        },
        {
          match: (t) => t.startsWith('INSERT INTO account_freeholds'),
          answer: () => [{ durable_rev: '1' }],
        },
        {
          match: (t) => t.startsWith('SELECT write_token'),
          // The lost COMMIT landed: the row carries the token it stamped.
          answer: () => [{ write_token: landedToken }],
        },
        { match: (t) => t.startsWith('SELECT durable_rev'), answer: () => [{ durable_rev: '1' }] },
        {
          match: (t) => t.startsWith('WITH fence'),
          answer: () => [{ fenced: 1, durable_rev: '2', stamped: 1 }],
        },
      ],
      opts,
    );
    const write = createFreeholdFencedWriter({
      pool: f.pool,
      registry,
      holder: HOLDER,
      realm: 'test',
      ttlSeconds: 90,
      nowMs: () => 42,
    });
    const first = { ...UPSERT('plot:new'), expectedDurableRev: null };
    await expect(write(first)).rejects.toBeInstanceOf(FreeholdCommitAmbiguous);
    expect(registry.forPlot('plot:new')).toBeUndefined();
    landedToken = registry.pendingToken('plot:new');
    expect(landedToken).toMatch(/^[0-9a-f]{32}$/);
    const asked: unknown[] = [];
    await renewFreeholdClaims({
      registry,
      pool: f.pool,
      holder: HOLDER,
      ttlSeconds: 90,
      wanted: (c) => {
        asked.push(c);
        return ownerWanted;
      },
      nowMs: () => 50,
      warn: () => {},
    });
    expect(asked).toEqual([
      { plotId: 'plot:new', accountId: 7, generation: '1', acquiredAtMs: 42 },
    ]);
    opts.loseCommit = false;
    landed = true;
    return { registry, token: landedToken, retry: await write(first) };
  }

  it('keeps an ambiguous FIRST insert token through a pass while the owner is wanted, then adopts', async () => {
    const { registry, retry } = await ambiguousFirstInsert(true);
    expect(retry).toEqual({ kind: 'inserted', durableRev: '2' });
    expect(registry.counters).toMatchObject({ selfAdopted: 1, pendingSwept: 0 });
    expect(registry.forPlot('plot:new')?.generation).toBe('1');
    expect(registry.pendingToken('plot:new')).toBeNull();
  });

  it('retires that token once nothing wants the owner: the stranded question is dropped', async () => {
    const { registry, retry } = await ambiguousFirstInsert(false);
    expect(registry.counters).toMatchObject({ selfAdopted: 0, pendingSwept: 1 });
    // Nothing would have asked again; a retry that did is refused, never adopted.
    expect(retry).toEqual({
      kind: 'conflict',
      detail: 'the minted plot identity is already claimed',
    });
    expect(registry.forPlot('plot:new')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The claimed login read.
// ---------------------------------------------------------------------------
describe('the claimed login read', () => {
  const deps = (rules: Rule[], readHearth?: () => Promise<never>) => {
    const registry = createFreeholdClaimRegistry();
    const f = fakePool(rules);
    const readRow = vi.fn(async () => ({ kind: 'absent' as const }));
    return {
      registry,
      f,
      readRow,
      d: {
        pool: f.pool,
        registry,
        holder: HOLDER,
        realm: 'test',
        ttlSeconds: 90,
        readRow,
        readHearth: readHearth ?? (async () => ({ kind: 'absent' as const })),
        nowMs: () => 123,
        onClaimed: vi.fn(),
      },
    };
  };
  const plotRow: Rule = {
    match: (t) => t.startsWith('SELECT plot_id FROM account_freeholds'),
    answer: () => [{ plot_id: 'plot:a' }],
  };

  it('reads the clock FIRST, then claims, then reads the row, and records after COMMIT', async () => {
    const t = deps([
      plotRow,
      {
        match: (q) => q.startsWith('WITH t AS'),
        answer: () => [{ generation: '2', inserted: false, fresh: true }],
      },
    ]);
    const out = await readClaimedLoginDurables(t.d, 7);
    expect(out.row).toEqual({ kind: 'absent' });
    expect(t.registry.forPlot('plot:a')).toEqual({
      plotId: 'plot:a',
      accountId: 7,
      generation: '2',
      acquiredAtMs: 123,
    });
    expect(t.registry.counters.takeovers).toBe(1);
    expect(t.d.onClaimed).toHaveBeenCalledWith(7);
    const texts = t.f.texts();
    expect(texts.indexOf('COMMIT')).toBeGreaterThan(
      texts.findIndex((q) => q.startsWith('WITH t AS')),
    );
  });

  it('answers claim_busy from the lock-free pre-check, never reading the row or recording', async () => {
    const t = deps([
      plotRow,
      {
        match: (q) => q.startsWith('SELECT 1 FROM freehold_plot_claims'),
        answer: () => [{ x: 1 }],
      },
    ]);
    const out = await readClaimedLoginDurables(t.d, 7);
    expect(out.row).toEqual({ kind: 'claim_busy', plotIndex: 0, plotId: 'plot:a' });
    expect(t.readRow).not.toHaveBeenCalled();
    expect(t.registry.all()).toEqual([]);
    expect(t.f.texts().some((q) => q.startsWith('WITH t AS'))).toBe(false);
  });

  it('answers claim_busy for lock contention on the acquire', async () => {
    const t = deps([
      plotRow,
      { match: (q) => q.startsWith('WITH t AS'), answer: () => sqlError('55P03') },
    ]);
    expect((await readClaimedLoginDurables(t.d, 7)).row.kind).toBe('claim_busy');
  });

  it('keeps the claim when the CLOCK faults: a second transaction runs the plot half, clock cold', async () => {
    const t = deps(
      [
        plotRow,
        {
          match: (q) => q.startsWith('WITH t AS'),
          answer: () => [{ generation: '1', inserted: true, fresh: true }],
        },
      ],
      async () => {
        throw sqlError('42P01');
      },
    );
    const out = await readClaimedLoginDurables(t.d, 7);
    expect(out.hearth.kind).toBe('threw');
    expect(t.registry.forPlot('plot:a')?.generation).toBe('1');
    expect(t.f.counts().connects).toBe(2);
  });

  it('holds the plot (rethrows) when its COMMIT cannot be proved, and records no claim', async () => {
    const registry = createFreeholdClaimRegistry();
    const f = fakePool(
      [
        plotRow,
        {
          match: (q) => q.startsWith('WITH t AS'),
          answer: () => [{ generation: '1', inserted: true, fresh: true }],
        },
      ],
      { commitTag: 'ROLLBACK' },
    );
    await expect(
      readClaimedLoginDurables(
        {
          pool: f.pool,
          registry,
          holder: HOLDER,
          realm: 'test',
          ttlSeconds: 90,
          readRow: async () => ({ kind: 'absent' as const }),
          readHearth: async () => ({ kind: 'absent' as const }),
          nowMs: () => 0,
        },
        7,
      ),
    ).rejects.toBeInstanceOf(DbTransactionRolledBack);
    expect(registry.all()).toEqual([]);
  });

  it('holds the plot (rethrows) when the row read itself fails', async () => {
    const t = deps([
      plotRow,
      {
        match: (q) => q.startsWith('WITH t AS'),
        answer: () => [{ generation: '1', inserted: true, fresh: true }],
      },
    ]);
    t.readRow.mockRejectedValueOnce(sqlError('XX000'));
    await expect(readClaimedLoginDurables(t.d, 7)).rejects.toThrow();
    expect(t.registry.all()).toEqual([]);
  });

  const acquireRule: Rule = {
    match: (q) => q.startsWith('WITH t AS'),
    answer: () => [{ generation: '1', inserted: true, fresh: true }],
  };

  it('supersedes a pending token on the plot it records, and only on a recorded claim', async () => {
    const pendingOn = (registry: ReturnType<typeof createFreeholdClaimRegistry>, plotId: string) =>
      registry.notePending({ plotId, accountId: 7, writeToken: 'a'.repeat(32), notedAtMs: 0 });
    const t = deps([plotRow, acquireRule]);
    pendingOn(t.registry, 'plot:a');
    pendingOn(t.registry, 'plot:z');
    await readClaimedLoginDurables(t.d, 7);
    expect(t.registry.forPlot('plot:a')).toBeDefined();
    expect(t.registry.pendingToken('plot:a')).toBeNull();
    expect(t.registry.pendingToken('plot:z')).toBe('a'.repeat(32));
    expect(t.registry.counters).toMatchObject({ loginReads: 1, loginReadMsTotal: 0 });
    // Control: a busy answer records nothing and leaves the question open.
    const busy = deps([
      plotRow,
      {
        match: (q) => q.startsWith('SELECT 1 FROM freehold_plot_claims'),
        answer: () => [{ x: 1 }],
      },
    ]);
    pendingOn(busy.registry, 'plot:a');
    expect((await readClaimedLoginDurables(busy.d, 7)).row.kind).toBe('claim_busy');
    expect(busy.registry.pendingToken('plot:a')).toBe('a'.repeat(32));
  });

  /** Every checkout and every statement takes `stepMs`, and a statement still
   *  running when its client is destroyed rejects, as a dropped socket does. */
  function slowPool(stepMs: number, rules: Rule[], opts: { hangCommit?: boolean } = {}) {
    const seen = { connects: 0, statements: [] as string[] };
    const answerFor = (text: string, values?: unknown[]) => {
      if (text === 'COMMIT') return { rows: [], rowCount: 0, command: 'COMMIT' };
      if (text === 'ROLLBACK' || text.startsWith('BEGIN')) {
        return { rows: [], rowCount: 0, command: 'BEGIN' };
      }
      const answer = rules.find((r) => r.match(text))?.answer(values) ?? [];
      if (answer instanceof Error) throw answer;
      return { rows: answer, rowCount: answer.length, command: 'SELECT' };
    };
    const pool = {
      async connect() {
        seen.connects++;
        await new Promise((resolve) => setTimeout(resolve, stepMs));
        const running = new Set<(error: Error) => void>();
        let dead: Error | null = null;
        const client = {
          query(text: string, values?: unknown[]) {
            seen.statements.push(text);
            return new Promise((resolve, reject) => {
              if (dead) return reject(dead);
              running.add(reject);
              if (text === 'COMMIT' && opts.hangCommit) return;
              setTimeout(() => {
                if (!running.delete(reject)) return;
                try {
                  resolve(answerFor(text, values));
                } catch (error) {
                  reject(error);
                }
              }, stepMs);
            });
          },
          release(error?: unknown) {
            if (!error) return;
            dead = new Error('Connection terminated');
            for (const reject of running) reject(dead);
            running.clear();
          },
          on: () => client,
          removeListener: () => client,
        };
        return client;
      },
    } as unknown as FreeholdTxPool;
    return { pool, seen };
  }

  it('bounds the whole read, the clock-fault retry and both checkouts included, by ONE budget', async () => {
    // 50 ms per step: the clock faults at 150 ms, its ROLLBACK is still out
    // when the 175 ms budget fires, and the retry is refused before it asks
    // the pool. Without the shared budget the retry ran a full second
    // transaction past it and the read succeeded at about 400 ms.
    const { pool, seen } = slowPool(50, [plotRow, acquireRule]);
    const registry = createFreeholdClaimRegistry();
    const onClaimed = vi.fn();
    const started = Date.now();
    const err = await readClaimedLoginDurables(
      {
        pool,
        registry,
        holder: HOLDER,
        realm: 'test',
        ttlSeconds: 90,
        readRow: async () => ({ kind: 'absent' as const }),
        readHearth: async (db) => {
          await db.query('SELECT hearth');
          throw sqlError('42P01');
        },
        nowMs: () => Date.now(),
        onClaimed,
        budgetMs: 175,
      },
      7,
    ).catch((error: unknown) => error);
    const elapsed = Date.now() - started;
    expect((err as Error).name).toBe('TimeoutError');
    expect(elapsed).toBeLessThan(175 + 150);
    expect(seen.connects).toBe(1);
    expect(seen.statements.filter((q) => q.startsWith('BEGIN'))).toHaveLength(1);
    expect(registry.all()).toEqual([]);
    expect(onClaimed).not.toHaveBeenCalled();
    expect(registry.counters.loginReads).toBe(1);
    expect(registry.counters.loginReadMsTotal).toBeGreaterThanOrEqual(150);
  });

  it('never records a claim whose COMMIT the budget cut: the read throws ambiguous', async () => {
    const { pool, seen } = slowPool(10, [plotRow, acquireRule], { hangCommit: true });
    const registry = createFreeholdClaimRegistry();
    const onClaimed = vi.fn();
    const started = Date.now();
    const err = await readClaimedLoginDurables(
      {
        pool,
        registry,
        holder: HOLDER,
        realm: 'test',
        ttlSeconds: 90,
        readRow: async () => ({ kind: 'absent' as const }),
        readHearth: async () => ({ kind: 'absent' as const }),
        nowMs: () => 0,
        onClaimed,
        budgetMs: 150,
      },
      7,
    ).catch((error: unknown) => error);
    expect(err).toBeInstanceOf(FreeholdCommitAmbiguous);
    expect(Date.now() - started).toBeLessThan(150 + 150);
    expect(seen.statements.at(-1)).toBe('COMMIT');
    expect(seen.statements.some((q) => q.startsWith('WITH t AS'))).toBe(true);
    expect(registry.all()).toEqual([]);
    expect(registry.counters.acquired).toBe(0);
    expect(onClaimed).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Operation recovery.
// ---------------------------------------------------------------------------
describe('operation recovery', () => {
  it('ships with NO registered kind, so a scheduled pass issues nothing', () => {
    // A TRIPWIRE, not only a pin: registering the first kind makes receipts and
    // intents reachable, and three stories are owed in that same change.
    expect(
      FREEHOLD_OPERATION_RECONCILERS.size,
      'the first registered housing operation kind must land WITH: (1) an automatic, ' +
        'idempotent retry of the receipt erase for deactivated accounts that still hold ' +
        'receipts (account.ts runs it once and only logs a failure); (2) a retention story ' +
        'for freehold_operation_receipts (keep-forever today, observed only by the growth ' +
        'monitor); (3) a deactivation story for the OPEN intents of a deactivated account ' +
        '(prepare refuses it, but nothing closes the intents it already holds)',
    ).toBe(0);
    const discover = vi.fn();
    const recovery = createFreeholdOperationRecovery({
      reconcilers: FREEHOLD_OPERATION_RECONCILERS,
      discover,
      tryAcquirePermit: () => ({ release() {} }),
      holdInFlight: () => () => {},
      warn: () => {},
    });
    recovery.schedule(7);
    expect(discover).not.toHaveBeenCalled();
  });

  it('reconciles each open intent under its ORIGINAL id, holds unknown kinds, single flight', async () => {
    const reconcile = vi.fn(async (_intent: OpenFreeholdOperation) => 'applied' as const);
    const holds: string[] = [];
    const warn = vi.fn();
    const recovery = createFreeholdOperationRecovery({
      reconcilers: new Map([['test_kind', { reconcile }]]),
      discover: async () => [
        {
          operationId: 'fop:1',
          accountId: 7,
          characterId: null,
          plotId: 'plot:a',
          kind: 'test_kind',
          fingerprint: 'f'.repeat(64),
          copyRefs: [],
          expectedDurableRev: '1',
          fenceGeneration: '1',
        },
        {
          operationId: 'fop:2',
          accountId: 7,
          characterId: null,
          plotId: null,
          kind: 'other_kind',
          fingerprint: 'f'.repeat(64),
          copyRefs: [],
          expectedDurableRev: null,
          fenceGeneration: null,
        },
      ],
      tryAcquirePermit: () => ({ release() {} }),
      holdInFlight: (plotId) => {
        holds.push(plotId);
        return () => {};
      },
      warn,
    });
    recovery.schedule(7);
    recovery.schedule(7);
    await recovery.idle();
    expect(recovery.counters.passes).toBe(1);
    expect(reconcile).toHaveBeenCalledTimes(1);
    expect(reconcile.mock.calls[0][0]).toMatchObject({ operationId: 'fop:1' });
    expect(recovery.counters.applied).toBe(1);
    expect(recovery.counters.unknownKind).toBe(1);
    expect(holds).toEqual(['plot:a']);
    expect(String(warn.mock.calls[0][0])).not.toContain('fop:');
  });

  it('skips a pass when the gate has no immediate permit, never queueing', async () => {
    const discover = vi.fn(async () => []);
    const recovery = createFreeholdOperationRecovery({
      reconcilers: new Map([['test_kind', { reconcile: async () => 'held' as const }]]),
      discover,
      tryAcquirePermit: () => null,
      holdInFlight: () => () => {},
      warn: () => {},
    });
    recovery.schedule(7);
    await recovery.idle();
    expect(discover).not.toHaveBeenCalled();
    expect(recovery.counters.skippedNoPermit).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// The Hearth trip's admission contract.
// ---------------------------------------------------------------------------
describe('the Hearth trip admission', () => {
  type Session = {
    pid: number;
    characterId: number;
    accountId: number;
    leaseNonce: string | undefined;
    left?: boolean;
  };
  const tripRig = (
    opts: {
      outcome?: () => FreeholdMutationOutcome;
      authority?: ReturnType<Parameters<typeof createFreeholdHearthTrips>[0]['authority']>;
      claim?: { plotId: string; holder: string; generation: string };
      /** Whether the sim roster still holds the owner (default: it does). */
      online?: () => boolean;
      leaseNonce?: string;
    } = {},
  ) => {
    const sessions = new Map<number, Session>([
      [
        1,
        {
          pid: 1,
          characterId: 10,
          accountId: 7,
          leaseNonce: 'leaseNonce' in opts ? opts.leaseNonce : 'n1',
        },
      ],
    ]);
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const merges: number[] = [];
    const redispatched: string[] = [];
    let now = 1_000;
    const trips = createFreeholdHearthTrips({
      sessionForPid: (pid) => sessions.get(pid),
      authority: () =>
        opts.authority === undefined
          ? { loaded: true, blocked: false, plotId: 'plot:a', durableRev: '3' }
          : opts.authority,
      claimFor: () => opts.claim ?? { plotId: 'plot:a', holder: HOLDER, generation: '2' },
      commit: vi.fn(async () => {
        await gate;
        return (
          opts.outcome?.() ??
          ({
            kind: 'committed',
            plots: [],
            hearth: { kind: 'advanced', readyAtMs: '3601000', revision: '4', nowMs: '1000' },
            verified: false,
          } as FreeholdMutationOutcome)
        );
      }),
      redispatch: (session) => {
        // The sim asks admission exactly as useHearthKey would.
        redispatched.push(trips.admission('account:7', session.pid));
      },
      mergeReadyAt: (_key, ms) => merges.push(ms),
      ownerOnline: () => opts.online?.() ?? true,
      accountOf: (key) => (key === 'account:7' ? 7 : null),
      cooldownMs: 3_600_000,
      nowMs: () => now,
      warn: () => {},
    });
    const settle = async () => {
      release();
      for (let i = 0; i < 10; i++) await Promise.resolve();
    };
    return { trips, sessions, settle, merges, redispatched, advance: (ms: number) => (now += ms) };
  };

  it('answers pending, then re-dispatches with an admit ticket and merges AFTER the trip', async () => {
    const r = tripRig();
    expect(r.trips.admission('account:7', 1)).toBe('pending');
    // Single flight: a second use while pending is silent and starts nothing.
    expect(r.trips.admission('account:7', 1)).toBe('pending');
    await r.settle();
    expect(r.redispatched).toEqual(['admit']);
    expect(r.merges).toEqual([3_601_000]);
    expect(r.trips.counters.started).toBe(1);
    expect(r.trips.counters.advanced).toBe(1);
    // The ticket died with its re-dispatch: a client use now starts a new trip.
    expect(r.trips.admission('account:7', 1)).toBe('pending');
  });

  it('NEVER admits on a cooldown: merges first, then the ticket denies', async () => {
    const r = tripRig({
      outcome: () => ({
        kind: 'refused',
        refusal: {
          kind: 'hearth',
          result: { kind: 'cooldown', readyAtMs: '9000', revision: '4', nowMs: '1000' },
        },
      }),
    });
    r.trips.admission('account:7', 1);
    await r.settle();
    expect(r.redispatched).toEqual(['deny']);
    expect(r.merges).toEqual([9_000]);
    expect(r.trips.counters.cooldown).toBe(1);
    // A cooldown arms no refusal memo.
    expect(r.trips.admission('account:7', 1)).toBe('pending');
  });

  it('meters every other outcome for its OWN account only', async () => {
    const r = tripRig({ outcome: () => ({ kind: 'failed', error: null }) });
    r.trips.admission('account:7', 1);
    await r.settle();
    expect(r.redispatched).toEqual(['deny']);
    expect(r.trips.admission('account:7', 1)).toBe('deny');
    expect(r.trips.counters.metered).toBe(1);
    r.advance(5_000);
    expect(r.trips.admission('account:7', 1)).toBe('pending');
  });

  it('counts a hook that never ran apart from a failure, and still meters it', async () => {
    const r = tripRig({ outcome: () => ({ kind: 'not_run' }) });
    r.trips.admission('account:7', 1);
    await r.settle();
    expect(r.trips.counters.notRun).toBe(1);
    expect(r.trips.counters.failed).toBe(0);
    expect(r.redispatched).toEqual(['deny']);
    expect(r.trips.admission('account:7', 1)).toBe('deny');
  });

  it('denies before any queue for a blocked entry, an unloaded one, or a durable row without a claim', () => {
    for (const authority of [
      null,
      { loaded: false, blocked: true, plotId: 'plot:a', durableRev: null },
      { loaded: true, blocked: true, plotId: 'plot:a', durableRev: '3' },
    ]) {
      const r = tripRig({ authority });
      expect(r.trips.admission('account:7', 1)).toBe('deny');
      expect(r.trips.counters.refusedPreQueue).toBe(1);
      expect(r.trips.counters.started).toBe(0);
    }
    const noClaim = tripRig({ claim: { plotId: 'plot:other', holder: HOLDER, generation: '1' } });
    expect(noClaim.trips.admission('account:7', 1)).toBe('deny');
    // Control: an absent row needs no claim.
    const absent = tripRig({
      authority: { loaded: true, blocked: false, plotId: 'plot:a', durableRev: null },
    });
    expect(absent.trips.admission('account:7', 1)).toBe('pending');
  });

  it('abandons a trip whose session left or changed: no re-dispatch, a merge only for a live owner', async () => {
    const r = tripRig();
    r.trips.admission('account:7', 1);
    r.sessions.set(1, { pid: 1, characterId: 10, accountId: 7, leaseNonce: 'n2' });
    await r.settle();
    expect(r.redispatched).toEqual([]);
    // The committed advance is the account's: the rotated session (or any
    // sibling) must not keep the clock its login read before this commit.
    expect(r.merges).toEqual([3_601_000]);
    expect(r.trips.counters.abandoned).toBe(1);
    const gone = tripRig({ online: () => false });
    gone.trips.admission('account:7', 1);
    gone.sessions.delete(1);
    await gone.settle();
    expect(gone.redispatched).toEqual([]);
    expect(gone.merges).toEqual([]);
    expect(gone.trips.counters.abandoned).toBe(1);
  });

  it('counts a committed advance the sim refused to re-dispatch', async () => {
    const sessions = new Map([[1, { pid: 1, characterId: 10, accountId: 7, leaseNonce: 'n1' }]]);
    const trips = createFreeholdHearthTrips({
      sessionForPid: (pid) => sessions.get(pid),
      authority: () => ({ loaded: true, blocked: false, plotId: 'plot:a', durableRev: null }),
      claimFor: () => undefined,
      commit: async () => ({
        kind: 'committed',
        plots: [],
        hearth: { kind: 'advanced', readyAtMs: '5', revision: '1', nowMs: '1' },
        verified: false,
      }),
      redispatch: () => {
        // The sim refused (died in the window) before asking admission.
      },
      mergeReadyAt: () => {},
      ownerOnline: () => true,
      accountOf: () => 7,
      cooldownMs: 1,
      nowMs: () => 0,
      warn: () => {},
    });
    trips.admission('account:7', 1);
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(trips.counters.refusedAfterCommit).toBe(1);
  });

  it('denies a session that does not belong to the owner key, and a leaving one', () => {
    const r = tripRig();
    expect(r.trips.admission('account:8', 1)).toBe('deny');
    expect(r.trips.admission('entity:1', 1)).toBe('deny');
    r.sessions.set(1, { pid: 1, characterId: 10, accountId: 7, leaseNonce: 'n1', left: true });
    expect(r.trips.admission('account:7', 1)).toBe('deny');
  });

  it('keeps an unexpired refusal across a relog, so the meter still holds', async () => {
    const r = tripRig({ outcome: () => ({ kind: 'failed', error: null }) });
    r.trips.admission('account:7', 1);
    await r.settle();
    // The account's last session leaves and the account relogs on a new pid.
    r.sessions.delete(1);
    r.trips.onSessionLeft();
    r.sessions.set(2, { pid: 2, characterId: 11, accountId: 7, leaseNonce: 'n2' });
    expect(r.trips.admission('account:7', 2)).toBe('deny');
    expect(r.trips.counters.metered).toBe(1);
    expect(r.trips.counters.started).toBe(1);
    r.advance(5_000);
    expect(r.trips.admission('account:7', 2)).toBe('pending');
  });

  it('prunes a refusal set after the last leave once it expires, never before', async () => {
    const r = tripRig({ outcome: () => ({ kind: 'failed', error: null }) });
    r.trips.admission('account:7', 1);
    // The last session leaves while the trip runs; its outcome lands after.
    r.sessions.delete(1);
    r.trips.onSessionLeft();
    await r.settle();
    expect(r.trips.counters.abandoned).toBe(1);
    expect(r.trips.refusalMemoSize()).toBe(1);
    r.advance(4_999);
    r.trips.onSessionLeft();
    expect(r.trips.refusalMemoSize()).toBe(1);
    r.advance(1);
    r.trips.onSessionLeft();
    expect(r.trips.refusalMemoSize()).toBe(0);
  });

  it('merges an abandoned cooldown while the owner is online, and installs nothing once it is not', async () => {
    const cooldown = (): FreeholdMutationOutcome => ({
      kind: 'refused',
      refusal: {
        kind: 'hearth',
        result: { kind: 'cooldown', readyAtMs: '9000', revision: '4', nowMs: '1000' },
      },
    });
    let online = true;
    const r = tripRig({ outcome: cooldown, online: () => online });
    r.trips.admission('account:7', 1);
    // A takeover rotates the session: abandoned, but another session of the
    // account is live, so the account-wide clock must not stay stale.
    r.sessions.set(1, { pid: 1, characterId: 10, accountId: 7, leaseNonce: 'n2' });
    await r.settle();
    expect(r.trips.counters.abandoned).toBe(1);
    expect(r.redispatched).toEqual([]);
    expect(r.merges).toEqual([9_000]);
    // The same abandon with no live session left: the last leave evicted the
    // clock, and a merge would install an entry nothing ever evicts.
    online = false;
    const gone = tripRig({ outcome: cooldown, online: () => online });
    gone.trips.admission('account:7', 1);
    gone.sessions.delete(1);
    await gone.settle();
    expect(gone.trips.counters.abandoned).toBe(1);
    expect(gone.merges).toEqual([]);
  });

  it('answers a DIFFERENT pid of the pending account deny, and the same pid silence', async () => {
    const r = tripRig();
    r.sessions.set(2, { pid: 2, characterId: 11, accountId: 7, leaseNonce: 'n2' });
    expect(r.trips.admission('account:7', 1)).toBe('pending');
    // Only the trip's own session is re-dispatched, so a sibling's use would
    // never be answered: it gets busy now instead.
    expect(r.trips.admission('account:7', 2)).toBe('deny');
    expect(r.trips.admission('account:7', 1)).toBe('pending');
    expect(r.trips.counters.started).toBe(1);
    await r.settle();
    expect(r.redispatched).toEqual(['admit']);
  });

  it('refuses before any queue a session that carries no lease nonce', () => {
    const r = tripRig({ leaseNonce: undefined });
    expect(r.trips.admission('account:7', 1)).toBe('deny');
    expect(r.trips.counters.refusedPreQueue).toBe(1);
    expect(r.trips.counters.started).toBe(0);
    expect(r.trips.inFlight(7)).toBe(false);
  });

  it('clears pending when the save REJECTS, and denies the re-dispatch', async () => {
    const r = tripRig({
      outcome: () => {
        throw new Error('the save rejected');
      },
    });
    r.trips.admission('account:7', 1);
    expect(r.trips.inFlight(7)).toBe(true);
    await r.settle();
    expect(r.trips.inFlight(7)).toBe(false);
    expect(r.trips.counters.failed).toBe(1);
    expect(r.redispatched).toEqual(['deny']);
    expect(r.merges).toEqual([]);
  });

  it('times every trip into tripMsTotal through the host clock', async () => {
    const r = tripRig();
    expect(r.trips.counters.tripMsTotal).toBe(0);
    r.trips.admission('account:7', 1);
    r.advance(250);
    await r.settle();
    expect(r.trips.counters.tripMsTotal).toBe(250);
    r.trips.admission('account:7', 1);
    expect(r.trips.counters.tripMsTotal).toBe(250);
  });

  it('refuses an unsupported clock: counted, busy under the deny ticket, nothing merged, metered', async () => {
    const r = tripRig({
      outcome: () => ({
        kind: 'refused',
        refusal: {
          kind: 'hearth',
          result: { kind: 'unsupported', detail: 'the account row is absent' },
        },
      }),
    });
    r.trips.admission('account:7', 1);
    await r.settle();
    expect(r.trips.counters).toMatchObject({ unsupported: 1, advanced: 0, cooldown: 0 });
    expect(r.redispatched).toEqual(['deny']);
    expect(r.merges).toEqual([]);
    expect(r.trips.admission('account:7', 1)).toBe('deny');
    expect(r.trips.counters.metered).toBe(1);
  });
});

describe('the Hearth use precheck the re-dispatch replays', () => {
  it('agrees with the frame path: draining, vault lock, spectating, then jailed, then dark', () => {
    const lit = { FREEHOLDS_ENABLED: '1' } as NodeJS.ProcessEnv;
    const dark = {} as NodeJS.ProcessEnv;
    expect(hearthKeyUseRefusal({ draining: true, vaultLocked: true, spectating: {} }, dark)).toBe(
      'draining',
    );
    expect(hearthKeyUseRefusal({ vaultLocked: true, spectating: {} }, dark)).toBe('vault_locked');
    expect(hearthKeyUseRefusal({ spectating: {} }, lit)).toBe('spectating');
    expect(hearthKeyUseRefusal({ jailed: {} }, lit)).toBe('jailed');
    expect(hearthKeyUseRefusal({}, dark)).toBe('dark');
    expect(hearthKeyUseRefusal({ spectating: {}, jailed: {} }, dark)).toBe('spectating');
    expect(hearthKeyUseRefusal({ draining: false, vaultLocked: false }, lit)).toBeNull();
    expect(hearthKeyUseRefusal({}, lit)).toBeNull();
  });

  it('is the order the frame path runs its own gates in', () => {
    const game = stripComments(readFileSync('server/game.ts', 'utf8'));
    // handleMessage drops every frame of a draining realm and of a character
    // whose vault loot is fenced, BEFORE dispatchMessage sees it.
    const handle = game.slice(game.indexOf('  handleMessage(session: ClientSession, raw: string)'));
    const draining = handle.indexOf('if (this.draining) return;');
    const vaultLock = handle.indexOf('if (this.vault.guard.isLocked(session.characterId)) return;');
    const dispatchCall = handle.indexOf('this.dispatchMessage(session, msg, raw, receivedAtMs);');
    expect(draining).toBeGreaterThan(-1);
    expect(vaultLock).toBeGreaterThan(draining);
    expect(dispatchCall).toBeGreaterThan(vaultLock);
    const dispatch = game.slice(game.indexOf('  private dispatchMessage('));
    const spectating = dispatch.indexOf('if (session.spectating) {');
    const jailed = dispatch.indexOf('if (session.jailed && refusedJailedTravelCommand(msg)) {');
    const darkGate = dispatch.indexOf('if (refusedFreeholdCommand(msg)) {');
    const useCase = dispatch.indexOf("case 'use':");
    expect(spectating).toBeGreaterThan(-1);
    expect(jailed).toBeGreaterThan(spectating);
    expect(darkGate).toBeGreaterThan(jailed);
    expect(useCase).toBeGreaterThan(darkGate);
  });
});

// ---------------------------------------------------------------------------
// The authority boundary, pinned on the server side.
// ---------------------------------------------------------------------------
describe('the housing authority boundary', () => {
  // Through the shared walker (tests/CLAUDE.md): server/ has subdirectories.
  const serverSources = () => {
    const files = tsFilesUnder('server').map((f) => ({
      name: `server/${f.file}`,
      code: stripComments(readFileSync(f.full, 'utf8')),
    }));
    // A walker that found nothing would pass every scan below vacuously.
    expect(files.length).toBeGreaterThan(400);
    expect(files.map((f) => f.name)).toContain('server/http/game_metrics.ts');
    return files;
  };

  it('lets only the housing hook call advanceFreeholdHearthOnClient', () => {
    const callers = serverSources()
      .filter((f) => f.name !== 'server/freehold_hearth_db.ts')
      .filter((f) => f.code.includes('advanceFreeholdHearthOnClient('))
      .map((f) => f.name);
    expect(callers).toEqual(['server/freehold_mutation.ts']);
  });

  it('sets the trip ticket in exactly one place', () => {
    const trip = stripComments(readFileSync('server/freehold_hearth_trip.ts', 'utf8'));
    expect(trip.split('ticket = minted;').length - 1).toBe(1);
    expect(trip.split('redispatchWithTicket(').length - 1).toBe(2);
    expect(trip.match(/ticket = /g)?.length).toBe(2);
  });

  it('keeps every dev path away from the trip, mutation, operation and claim modules', () => {
    const housing = [
      'freehold_hearth_trip',
      'freehold_hearth_trip_host',
      'freehold_mutation',
      'freehold_operation_db',
      'freehold_operation_recovery',
      'freehold_claim_db',
    ];
    for (const f of serverSources().filter((s) => /dev/.test(s.name))) {
      for (const module of housing) expect(f.code, f.name).not.toContain(`./${module}'`);
    }
  });

  it('lets no production module prepare an operation while no kind is registered', () => {
    // The definition itself is the positive control: the same scan finds it.
    const sources = serverSources();
    const definers = sources
      .filter((f) => f.code.includes('export async function prepareFreeholdOperation('))
      .map((f) => f.name);
    expect(definers).toEqual(['server/freehold_operation_db.ts']);
    const calls = /\bprepareFreeholdOperation\s*\(/;
    const definition = 'export async function prepareFreeholdOperation(';
    const callers = sources
      .filter((f) => calls.test(f.code.replace(definition, '')))
      .map((f) => f.name);
    expect(callers).toEqual([]);
    // And the matcher is live: a call in some module would be seen.
    expect(calls.test('await prepareFreeholdOperation(pool, i);')).toBe(true);
  });

  it('pins the fenced CAS fragments that carry the claim order, each with a negative control', () => {
    const fence =
      'WITH fence AS MATERIALIZED (\n  SELECT plot_id FROM freehold_plot_claims\n' +
      '   WHERE plot_id = $12 AND holder = $13 AND generation = $14::bigint\n';
    const lock = '     FOR NO KEY UPDATE\n), cas AS (';
    const casGate =
      '   WHERE account_id = $1 AND plot_index = $2 AND durable_rev = $3::bigint\n' +
      '     AND EXISTS (SELECT 1 FROM fence)\n  RETURNING durable_rev::text AS durable_rev';
    const stamp =
      'stamp AS (\n  UPDATE freehold_plot_claims\n     SET write_token = $11\n' +
      '   WHERE plot_id = $12 AND EXISTS (SELECT 1 FROM cas)\n';
    const fragments: [string, string, (sql: string) => string][] = [
      ['the MATERIALIZED fence CTE', fence, (sql) => sql.replace('AS MATERIALIZED (', 'AS (')],
      ['the fence row lock', lock, (sql) => sql.replace('FOR NO KEY UPDATE', 'FOR KEY SHARE')],
      [
        'the cas gated on the fence',
        casGate,
        (sql) => sql.replace('\n     AND EXISTS (SELECT 1 FROM fence)', ''),
      ],
      [
        'the stamp only when the cas wrote',
        stamp,
        (sql) => sql.replace('EXISTS (SELECT 1 FROM cas)', 'EXISTS (SELECT 1 FROM fence)'),
      ],
    ];
    const sql = FREEHOLD_FENCED_CAS_SQL;
    for (const [name, fragment, mutate] of fragments) {
      expect(sql.includes(fragment), name).toBe(true);
      const mutated = mutate(sql);
      expect(mutated, name).not.toBe(sql);
      expect(mutated.includes(fragment), name).toBe(false);
    }
    // The fence is taken first: G4 before G7, and the stamp after the cas.
    expect(sql.indexOf(fence)).toBe(0);
    expect(sql.indexOf(casGate)).toBeGreaterThan(sql.indexOf(lock));
    expect(sql.indexOf(stamp)).toBeGreaterThan(sql.indexOf(casGate));
  });

  it('wires the realm admission to the trip, never to the offline default', () => {
    const game = stripComments(readFileSync('server/game.ts', 'utf8'));
    expect(game).toContain(
      "(ownerKey, pid) => this.freeholdHearthTrips?.admission(ownerKey, pid) ?? 'deny',",
    );
    const boot = stripComments(readFileSync('server/sim_boot_config.ts', 'utf8'));
    expect(boot).toContain("freeholdKeyAdmission: NonNullable<SimConfig['freeholdKeyAdmission']>,");
    expect(boot).not.toContain("'admit'");
  });
});
