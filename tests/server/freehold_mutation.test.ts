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
// Cost: 0.3 s
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { LEASE_TTL_SECONDS } from '../../server/character_lease_db';
import {
  type CharacterSaveHousingHook,
  commitWithHousing,
  housingPersist,
} from '../../server/character_save_housing';
import {
  DbTransactionAborted,
  DbTransactionDeadlineExceeded,
  DbTransactionRolledBack,
} from '../../server/db_transaction_deadline';
import { heldClaims, registerFreeholdAuthority } from '../../server/freehold_authority_registry';
import {
  FREEHOLD_CLAIM_FENCE_SQL,
  FREEHOLD_CLAIM_READ_FENCE_SQL,
  FREEHOLD_CLAIM_RELEASE_READ_SQL,
  FREEHOLD_CLAIM_RELEASE_WAIT_SQL,
  FREEHOLD_CLAIM_STILL_HELD_SQL,
  lockFreeholdClaimFenceOnClient,
  readFreeholdClaimReleasesOnClient,
} from '../../server/freehold_claim_db';
import { readClaimedLoginDurables } from '../../server/freehold_claim_login';
import {
  createFreeholdClaimRegistry,
  FREEHOLD_CLAIM_RENEW_BOUNDS,
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
import { createGameFreeholdHearthTrips } from '../../server/freehold_hearth_trip_host';
import {
  commitFreeholdMutation,
  createFreeholdSaveHook,
  FREEHOLD_HOOK_STATEMENT_TIMEOUT_MS,
  FREEHOLD_VERIFY_BOUNDS,
  type FreeholdMutationOutcome,
  FreeholdMutationRefused,
  type FreeholdMutationRequest,
} from '../../server/freehold_mutation';
import {
  boundFreeholdHookStatementsOnClient,
  FREEHOLD_VERIFY_WAIT_SQL,
} from '../../server/freehold_mutation_db';
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

  it('bounds only the CHECKOUT by a checkoutSignal: a parked one is cut and its late client handed back once, a running transaction never', async () => {
    // Spent: refused before it asks the pool, like a spent signal.
    const spentPool = fakePool();
    const reason = new Error('pass deadline spent');
    await expect(
      runFreeholdTransaction(spentPool.pool, BOUNDS, async () => 1, {
        checkoutSignal: AbortSignal.abort(reason),
      }),
    ).rejects.toBe(reason);
    expect(spentPool.counts()).toEqual({ connects: 0, releases: 0 });
    // Parked: the abort ends the wait, and the client that arrives later goes
    // straight back, exactly once, carrying no statement.
    const base = fakePool();
    let arrive = () => {};
    const parked = {
      connect: () =>
        new Promise((resolve) => {
          arrive = () => resolve(base.pool.connect());
        }),
    } as unknown as FreeholdTxPool;
    const cut = new AbortController();
    const waiting = runFreeholdTransaction(parked, BOUNDS, async () => 1, {
      checkoutSignal: cut.signal,
    }).catch((error: unknown) => error);
    cut.abort(reason);
    expect(await waiting).toBe(reason);
    arrive();
    for (let i = 0; i < 20; i++) await Promise.resolve();
    expect(base.counts()).toEqual({ connects: 1, releases: 1 });
    expect(base.statements).toEqual([]);
    // Running: an abort after the checkout is never handed to the transaction,
    // so the statement answers and COMMIT lands.
    const running = new AbortController();
    const live = fakePool();
    const out = await runFreeholdTransaction(
      live.pool,
      BOUNDS,
      async (tx) => {
        running.abort(reason);
        await tx.query('SELECT 1');
        return 'landed';
      },
      { checkoutSignal: running.signal },
    );
    expect(out).toBe('landed');
    expect(live.texts().slice(1)).toEqual(['SELECT 1', 'COMMIT']);
    expect(live.counts()).toEqual({ connects: 1, releases: 1 });
    // Control: the same abort handed in as `signal` cuts the running statement.
    const cutRun = new AbortController();
    const control = fakePool();
    const err = await runFreeholdTransaction(
      control.pool,
      BOUNDS,
      async (tx) => {
        cutRun.abort(reason);
        await tx.query('SELECT 1');
        return 'landed';
      },
      { signal: cutRun.signal },
    ).catch((error: unknown) => error);
    expect(err).toBeInstanceOf(DbTransactionAborted);
    expect(control.texts()).not.toContain('COMMIT');
  });

  it('bounds a parked checkout by BOTH signals when both are given, and a running transaction by `signal` only', async () => {
    const drain = async () => {
      for (let i = 0; i < 20; i++) await Promise.resolve();
    };
    // Parked: whichever aborts first ends the wait with its own reason; the
    // second abort changes nothing, and the late client goes back once.
    for (const first of ['signal', 'checkoutSignal'] as const) {
      const base = fakePool();
      let arrive = () => {};
      const parked = {
        connect: () =>
          new Promise((resolve) => {
            arrive = () => resolve(base.pool.connect());
          }),
      } as unknown as FreeholdTxPool;
      const signal = new AbortController();
      const checkoutSignal = new AbortController();
      const reasons = { signal: new Error('signal'), checkoutSignal: new Error('checkout') };
      const settled: unknown[] = [];
      const waiting = runFreeholdTransaction(parked, BOUNDS, async () => 1, {
        signal: signal.signal,
        checkoutSignal: checkoutSignal.signal,
      }).then(
        (value) => settled.push(['resolved', value]),
        (error: unknown) => settled.push(error),
      );
      const second = first === 'signal' ? 'checkoutSignal' : 'signal';
      const controllers = { signal, checkoutSignal };
      controllers[first].abort(reasons[first]);
      await drain();
      expect(settled, first).toEqual([reasons[first]]);
      controllers[second].abort(reasons[second]);
      arrive();
      await waiting;
      await drain();
      expect(settled, first).toEqual([reasons[first]]);
      expect(base.counts(), first).toEqual({ connects: 1, releases: 1 });
      expect(base.statements, first).toEqual([]);
    }
    // Running: the checkoutSignal's abort is never handed to the transaction;
    // the signal's cuts it.
    for (const cut of ['checkoutSignal', 'signal'] as const) {
      const f = fakePool();
      const controllers = { signal: new AbortController(), checkoutSignal: new AbortController() };
      const out = await runFreeholdTransaction(
        f.pool,
        BOUNDS,
        async (tx) => {
          controllers[cut].abort(new Error(cut));
          await tx.query('SELECT 1');
          return 'landed';
        },
        { signal: controllers.signal.signal, checkoutSignal: controllers.checkoutSignal.signal },
      ).catch((error: unknown) => error);
      if (cut === 'checkoutSignal') {
        expect(out, cut).toBe('landed');
        expect(f.texts().slice(1), cut).toEqual(['SELECT 1', 'COMMIT']);
      } else {
        expect(out, cut).toBeInstanceOf(DbTransactionAborted);
        expect(f.texts(), cut).not.toContain('COMMIT');
      }
      expect(f.counts().connects, cut).toBe(1);
    }
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

  it('interpolates the hook bound only as a positive safe integer, refused before any SQL', async () => {
    const { tx, seen } = recordingTx(happy);
    for (const bad of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(boundFreeholdHookStatementsOnClient(tx, bad), String(bad)).rejects.toThrow(
        RangeError,
      );
    }
    expect(seen).toEqual([]);
    // Control: the production bound issues the one literal statement.
    await boundFreeholdHookStatementsOnClient(tx, FREEHOLD_HOOK_STATEMENT_TIMEOUT_MS);
    expect(seen.map((s) => s.text)).toEqual(['SET LOCAL statement_timeout = 15000']);
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

  it('refuses each undeclared participant on its own: the Hearth alone, then a plot write alone', () => {
    // Every other participant declared, so each refusal can only come from its
    // own check.
    expect(() =>
      createFreeholdSaveHook({
        ...REQUEST,
        accountIds: [7],
        hearth: { accountId: 8, cooldownMs: 60_000 },
      }),
    ).toThrow(/Hearth account must be a declared account participant/);
    expect(() =>
      createFreeholdSaveHook({
        ...REQUEST,
        accountIds: [7],
        hearth: null,
        plots: [{ ...REQUEST.plots[0], upsert: { ...REQUEST.plots[0].upsert, accountId: 8 } }],
      }),
    ).toThrow(/plot write account must be a declared account participant/);
    // Control: the same request with everything declared builds.
    expect(() =>
      createFreeholdSaveHook({
        ...REQUEST,
        accountIds: [7, 8],
        hearth: { accountId: 8, cooldownMs: 1 },
      }),
    ).not.toThrow();
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

  it('ends a HUNG verify wait at its wall: the deadline destroys the real client at once, released once', async () => {
    // node-postgres rejects a pending query only once release(error) destroys
    // the socket, so the fake's wait never settles until then. A shim that only
    // RECORDED the deadline's release would leave the wait (and the permit and
    // character FIFO behind it) hanging until the driver's query_timeout.
    const seen = { connects: 0, releases: [] as unknown[], texts: [] as string[] };
    let destroy: ((error: Error) => void) | null = null;
    const client = {
      query(text: string) {
        seen.texts.push(text);
        if (text.startsWith('BEGIN')) return Promise.resolve({ rows: [], command: 'BEGIN' });
        return new Promise((_resolve, reject) => {
          destroy = reject;
        });
      },
      release(error?: Error | boolean) {
        seen.releases.push(error);
        if (error) destroy?.(new Error('Connection terminated'));
      },
      on: () => client,
      removeListener: () => client,
    };
    const pool = {
      async connect() {
        seen.connects++;
        return client;
      },
    } as unknown as FreeholdTxPool;
    const flush = async () => {
      for (let i = 0; i < 50; i++) await Promise.resolve();
    };
    vi.useFakeTimers();
    try {
      let out: FreeholdMutationOutcome | null = null;
      void commitFreeholdMutation(
        { save: saveThatRuns({ loseCommit: true }), pool, characterId: 9 },
        HEARTH_ONLY,
      ).then((outcome) => {
        out = outcome;
      });
      await flush();
      expect(seen.texts.at(-1)).toBe(FREEHOLD_VERIFY_WAIT_SQL);
      await vi.advanceTimersByTimeAsync(FREEHOLD_VERIFY_BOUNDS.wallMs - 1);
      await flush();
      expect(out).toBeNull();
      expect(seen.releases).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      await flush();
      expect((out as FreeholdMutationOutcome | null)?.kind).toBe('unresolved');
      expect(seen.connects).toBe(1);
      expect(seen.releases).toHaveLength(1);
      expect(seen.releases[0]).toBeInstanceOf(DbTransactionDeadlineExceeded);
      // The broken client is never handed to the read transaction.
      expect(seen.texts.filter((t) => t.startsWith('BEGIN'))).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
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
        match: (t) => t === FREEHOLD_CLAIM_RELEASE_READ_SQL,
        answer: () => [
          { plot_id: 'plot:b', holder: HOLDER, live: true },
          { plot_id: 'plot:c', holder: HOLDER, live: false },
        ],
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
    // The ids the statement did not return were read once, lock-free.
    const reads = f.statements.filter((s) => s.text === FREEHOLD_CLAIM_RELEASE_READ_SQL);
    expect(reads.map((s) => s.values)).toEqual([[HOLDER, ['plot:b', 'plot:c']]]);
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
    // A checkout held until every trigger has been made, so overlapping passes
    // WOULD hold clients side by side. Opened by hand: no timer.
    let open = () => {};
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    const pool = {
      async connect() {
        await gate;
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
    const passes = [
      renewFreeholdClaims(deps),
      renewFreeholdClaims(deps),
      renewFreeholdClaims(deps),
    ];
    open();
    await Promise.all(passes);
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
    // The number warned is the number counted: both renew chunks and the
    // release chunk behind them.
    expect(warn).toHaveBeenCalledWith(deadlineWarn(3));
    // The next pass STARTS at the first chunk the deadline abandoned.
    await renewFreeholdClaims(deps);
    expect(renews().slice(1).map(firstIdOf)).toEqual([pad(256), pad(512), pad(0)]);
    expect(registry.counters.renewed).toBe(FREEHOLD_CLAIM_RENEW_CHUNK + wantedCount);
    expect(registry.forPlot('plot:zzzz')).toBeUndefined();
  });

  it('starts the next pass at the abandoned chunk wherever the deadline fell, not one chunk later', async () => {
    // The deadline lands after the SECOND chunk, so the chunk the next pass
    // must open with is the third: one chunk later than the last pass would be
    // the second, the plot the pass already renewed.
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < 3 * FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) {
      registry.record(claim(pad(i), i + 1));
    }
    let now = 1_000;
    let renewCalls = 0;
    const f = fakePool([
      {
        match: (t) => t.includes('SET heartbeat_at'),
        answer: (v) => {
          renewCalls++;
          if (renewCalls === 2) now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
          return ((v ?? [])[2] as string[]).map((plot_id) => ({ plot_id }));
        },
      },
    ]);
    const deps = { ...renewDeps(registry, f.pool), nowMs: () => now };
    const renews = () => f.statements.filter((s) => s.text.includes('SET heartbeat_at'));
    await renewFreeholdClaims(deps);
    expect(renews().map(firstIdOf)).toEqual([pad(0), pad(256)]);
    expect(registry.counters.renewChunksAbandoned).toBe(2);
    await renewFreeholdClaims(deps);
    expect(renews().slice(2).map(firstIdOf)).toEqual([pad(512), pad(768), pad(0), pad(256)]);
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
      'freehold claim wanted check threw: 2; those claims are kept and renewed',
    );
    expect(registry.forPlot('plot:a')).toBeDefined();
    expect(registry.forPlot('plot:b')).toBeDefined();
    // Control: the one that answered unwanted left the registry as before.
    expect(registry.forPlot('plot:c')).toBeUndefined();
    const renew = f.statements.find((s) => s.text.includes('SET heartbeat_at'));
    expect(renew?.values?.[2]).toEqual(['plot:a', 'plot:b']);
  });

  it('warns the wanted tests that threw in THIS pass, never the running total: a second pass warns its own one', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const warn = vi.fn();
    const deps = {
      ...renewDeps(registry, fakePool([renewAll]).pool),
      wanted: (): boolean => {
        throw new Error('no owner key');
      },
      warn,
    };
    await renewFreeholdClaims(deps);
    await renewFreeholdClaims(deps);
    const line = 'freehold claim wanted check threw: 1; those claims are kept and renewed';
    expect(warn.mock.calls).toEqual([[line], [line]]);
    // The lasting counter is the running total the warn deliberately is not.
    expect(registry.counters).toMatchObject({ wantedThrew: 2, renewPasses: 2, renewed: 2 });
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

  it('pins the pass deadline under the autosave cadence that starts a pass and under the lease TTL', () => {
    expect(FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS).toBe(20_000);
    // AUTOSAVE_SECONDS is module-private in server/game.ts: scraped (comments
    // stripped), so a re-tuned cadence moves the relation with it.
    const autosave = stripComments(readFileSync('server/game.ts', 'utf8')).match(
      /^const AUTOSAVE_SECONDS = (\d+);$/m,
    );
    const autosaveMs = Number(autosave?.[1]) * 1000;
    expect(autosaveMs).toBeGreaterThan(0);
    expect(FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS).toBeLessThan(autosaveMs);
    expect(FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS).toBeLessThan(LEASE_TTL_SECONDS * 1000);
    // The pass's whole bound (the deadline plus the ONE transaction wall that
    // may straddle it, pinned by the wall case below) is under the cadence too,
    // so a pass that runs to its bound never makes the next trigger skip.
    expect(FREEHOLD_CLAIM_RENEW_BOUNDS.wallMs).toBe(5_000);
    expect(FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS + FREEHOLD_CLAIM_RENEW_BOUNDS.wallMs).toBe(25_000);
    expect(FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS + FREEHOLD_CLAIM_RENEW_BOUNDS.wallMs).toBeLessThan(
      autosaveMs,
    );
  });

  it('mints ONE AbortSignal.timeout of the pass deadline per pass unless a seam is handed in', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([renewAll]);
    // Stubbed, so no real timer is armed.
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockImplementation(() => new AbortController().signal);
    try {
      await renewFreeholdClaims(renewDeps(registry, f.pool));
      expect(timeout).toHaveBeenCalledTimes(1);
      expect(timeout).toHaveBeenCalledWith(FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS);
      // A supplied deadline is the one the signal is minted from.
      await renewFreeholdClaims({ ...renewDeps(registry, f.pool), passDeadlineMs: 1_234 });
      expect(timeout).toHaveBeenCalledTimes(2);
      expect(timeout).toHaveBeenLastCalledWith(1_234);
      const seam = vi.fn(() => new AbortController().signal);
      await renewFreeholdClaims({ ...renewDeps(registry, f.pool), deadlineSignal: seam });
      expect(seam).toHaveBeenCalledTimes(1);
      expect(timeout).toHaveBeenCalledTimes(2);
      expect(registry.counters).toMatchObject({ renewPasses: 3, renewed: 3 });
    } finally {
      timeout.mockRestore();
    }
  });

  it('refuses a pass deadline outside the range AbortSignal.timeout honours before any work, and stays free', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([renewAll]);
    const never = () => new AbortController().signal;
    // A whole number of ms from 1 to 2^31 - 1, the range AbortSignal.timeout
    // honours. It throws on a fraction and past 2^32 - 1 (mid-pass, after the
    // wanted tests), and clamps 0 and anything from 2^31 to 2^32 - 1 to 1 ms
    // (past 2^31 - 1 only a TimeoutOverflowWarning says so), which would
    // abandon every chunk of every pass. 1.5 is the whole-number arm on its
    // own (the lower bound refuses 0.5 as well); 2^31 is the cap on its own.
    for (const passDeadlineMs of [
      0,
      -1,
      Number.NaN,
      Infinity,
      -Infinity,
      0.5,
      1.5,
      2 ** 31,
      2 ** 32,
    ]) {
      const pass = renewFreeholdClaims({
        ...renewDeps(registry, f.pool),
        passDeadlineMs,
        deadlineSignal: never,
      });
      await expect(pass, String(passDeadlineMs)).rejects.toThrow(
        new RangeError(
          'freehold claim renew pass deadline must be a whole number of ms from 1 to 2^31 - 1, the range AbortSignal.timeout honours',
        ),
      );
    }
    expect(f.counts().connects).toBe(0);
    expect(registry.counters).toMatchObject({ renewPasses: 0, renewPassesSkipped: 0, renewed: 0 });
    // Controls: both ends of the range run a whole pass, so no refusal left
    // the single-flight flag set (the signal is injected: no real timer).
    for (const passDeadlineMs of [1, 2 ** 31 - 1]) {
      await renewFreeholdClaims({
        ...renewDeps(registry, f.pool),
        passDeadlineMs,
        deadlineSignal: never,
      });
    }
    expect(registry.counters).toMatchObject({ renewPasses: 2, renewPassesSkipped: 0, renewed: 2 });
  });

  /** Lets every settled promise run its callbacks: no timer. */
  const drain = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };

  /** `base`'s checkouts, except that checkout number `n` arrives only when the
   *  suite calls arrive(); `parked` settles once it is asked for. No timer. */
  const parkingPool = (base: FreeholdTxPool, n: number) => {
    let checkouts = 0;
    let asked = () => {};
    const parked = new Promise<void>((resolve) => {
      asked = resolve;
    });
    let arrive = () => {};
    const pool = {
      connect() {
        checkouts++;
        if (checkouts !== n) return base.connect();
        asked();
        return new Promise((resolve) => {
          arrive = () => resolve(base.connect());
        });
      },
    } as unknown as FreeholdTxPool;
    return { pool, parked, arrive: () => arrive(), checkouts: () => checkouts };
  };
  const deadlineWarn = (chunks: number) =>
    `freehold claim renew pass hit its ${FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS} ms deadline; ${chunks} chunks wait for the next pass or were left undecided`;

  it('cuts a chunk whose checkout hangs at the pass deadline, hands its late client back once, and frees the next pass', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    const f = fakePool([renewAll]);
    // nowMs never moves: only the pass deadline's own signal, aborted by hand,
    // can end the parked chunk or stop the next one starting.
    const parking = parkingPool(f.pool, 1);
    const warn = vi.fn();
    const deadline = new AbortController();
    const deps = {
      ...renewDeps(registry, parking.pool),
      warn,
      deadlineSignal: () => deadline.signal,
    };
    const pass = renewFreeholdClaims(deps);
    await parking.parked;
    deadline.abort();
    await pass;
    expect(parking.checkouts()).toBe(1);
    expect(registry.counters).toMatchObject({
      renewed: 0,
      // The hung chunk, cut in flight, and the one the deadline left unstarted:
      // both abandoned, the cut one included.
      missedHeartbeats: FREEHOLD_CLAIM_RENEW_CHUNK + 1,
      renewChunksAbandoned: 2,
      lost: 0,
      renewPasses: 1,
    });
    expect(registry.count()).toBe(FREEHOLD_CLAIM_RENEW_CHUNK + 1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(deadlineWarn(2));
    // The cut checkout's client, arriving late, goes straight back to the pool
    // exactly once and never carries a statement.
    parking.arrive();
    await drain();
    expect(f.counts()).toEqual({ connects: 1, releases: 1 });
    expect(f.statements).toEqual([]);
    // The single-flight flag is free again: the next trigger runs a whole pass
    // (a fresh deadline, minted per pass), STARTING at the cut chunk.
    deps.deadlineSignal = () => new AbortController().signal;
    await renewFreeholdClaims(deps);
    expect(registry.counters).toMatchObject({
      renewPasses: 2,
      renewPassesSkipped: 0,
      renewed: FREEHOLD_CLAIM_RENEW_CHUNK + 1,
    });
    const renews = f.statements.filter((s) => s.text.includes('SET heartbeat_at'));
    expect(renews.map(firstIdOf)).toEqual([pad(0), pad(256)]);
  });

  it('cuts a renew chunk whose answer carries the clock past the deadline as it throws: abandoned, and the next pass starts there', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    let now = 0;
    let renews = 0;
    const f = fakePool([
      {
        match: (t) => t.includes('SET heartbeat_at'),
        answer: (v) => {
          renews++;
          if (renews > 1) return renewAll.answer(v);
          // The FIRST chunk's statement runs past the deadline and then fails:
          // only the clock says so, the signal never aborts.
          now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
          return sqlError('57014');
        },
      },
    ]);
    const warn = vi.fn();
    const deps = {
      ...renewDeps(registry, f.pool),
      nowMs: () => now,
      warn,
      deadlineSignal: () => new AbortController().signal,
    };
    await renewFreeholdClaims(deps);
    // The thrown chunk is abandoned WITH the rest, never a plain missed
    // heartbeat that lets the next pass open one chunk later.
    expect(registry.counters).toMatchObject({
      renewed: 0,
      missedHeartbeats: FREEHOLD_CLAIM_RENEW_CHUNK + 1,
      renewChunksAbandoned: 2,
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(deadlineWarn(2));
    expect(f.counts().connects).toBe(1);
    await renewFreeholdClaims(deps);
    const firsts = f.statements.filter((s) => s.text.includes('SET heartbeat_at')).map(firstIdOf);
    expect(firsts).toEqual([pad(0), pad(0), pad(256)]);
  });

  it('cuts a renew STATEMENT in flight at the pass deadline at once: the transaction is aborted, the chunk abandoned, the next pass starts there', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    const deadline = new AbortController();
    let asked = () => {};
    const stalled = new Promise<void>((resolve) => {
      asked = resolve;
    });
    const base = fakePool([renewAll]);
    const destroyedWith: unknown[] = [];
    let hang = true;
    // The first renew statement never answers: only a cut of the running
    // transaction (its client destroyed) can end it before its 5 s wall.
    const pool = {
      async connect() {
        const client = await base.pool.connect();
        let cut: ((error: Error) => void) | null = null;
        const wrapped = {
          query(text: string, values?: unknown[]) {
            if (hang && text.includes('SET heartbeat_at')) {
              hang = false;
              asked();
              return new Promise((_resolve, reject) => {
                cut = reject;
              });
            }
            return client.query(text, values);
          },
          release(error?: Error | boolean) {
            if (error) {
              destroyedWith.push(error);
              cut?.(new Error('Connection terminated'));
            }
            client.release();
          },
          on: () => wrapped,
          removeListener: () => wrapped,
        };
        return wrapped;
      },
    } as unknown as FreeholdTxPool;
    const deps = { ...renewDeps(registry, pool), deadlineSignal: () => deadline.signal };
    let done = false;
    const pass = renewFreeholdClaims(deps).then(() => {
      done = true;
    });
    await stalled;
    deadline.abort();
    // Every microtask runs before the next macrotask: no timer fired.
    await new Promise((resolve) => setImmediate(resolve));
    expect(done).toBe(true);
    await pass;
    expect(destroyedWith).toHaveLength(1);
    expect(destroyedWith[0]).toBeInstanceOf(DbTransactionAborted);
    expect(registry.counters).toMatchObject({
      renewed: 0,
      missedHeartbeats: FREEHOLD_CLAIM_RENEW_CHUNK + 1,
      renewChunksAbandoned: 2,
    });
    expect(base.counts()).toEqual({ connects: 1, releases: 1 });
    // The next pass opens at the cut chunk, not one later.
    deps.deadlineSignal = () => new AbortController().signal;
    await renewFreeholdClaims(deps);
    const firsts = base.statements
      .filter((s) => s.text.includes('SET heartbeat_at'))
      .map(firstIdOf);
    expect(firsts).toEqual([pad(0), pad(256)]);
  });

  it('goes on to the next release chunk when one fails before its statement inside the deadline: no re-read, its claims kept, nothing abandoned', async () => {
    for (const arm of ['checkout', 'BEGIN'] as const) {
      const registry = createFreeholdClaimRegistry();
      for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) {
        registry.record(claim(pad(i), i + 1));
      }
      const base = fakePool([
        releaseRule((ids) => ids.map((plot_id) => ({ plot_id }))),
        releaseReadRule(() => []),
      ]);
      let checkouts = 0;
      const pool = {
        async connect() {
          checkouts++;
          if (checkouts === 1 && arm === 'checkout') throw new Error('pool exhausted');
          const client = await base.pool.connect();
          if (checkouts !== 1) return client;
          const failing = {
            query(text: string, values?: unknown[]) {
              if (text.startsWith('BEGIN')) return Promise.reject(sqlError('57P01'));
              return client.query(text, values);
            },
            release: (error?: Error | boolean) => client.release(error),
            on: () => failing,
            removeListener: () => failing,
          };
          return failing;
        },
      } as unknown as FreeholdTxPool;
      const warn = vi.fn();
      await renewFreeholdClaims({
        ...renewDeps(registry, pool),
        wanted: () => false,
        warn,
        deadlineSignal: () => new AbortController().signal,
      });
      // Nothing went out for the first chunk, so nothing is asked about it:
      // no re-read, not even an empty transaction for one.
      expect(checkouts, arm).toBe(2);
      expect(
        base.texts().filter((t) => t.startsWith('BEGIN')),
        arm,
      ).toHaveLength(1);
      expect(base.texts().some(isReleaseRead), arm).toBe(false);
      const sent = base.statements.filter((s) => s.text.includes("holder || '#released'"));
      expect(
        sent.map((s) => (s.values ?? [])[1]),
        arm,
      ).toEqual([[pad(FREEHOLD_CLAIM_RENEW_CHUNK)]]);
      expect(registry.count(), arm).toBe(FREEHOLD_CLAIM_RENEW_CHUNK);
      expect(registry.forPlot(pad(0)), arm).toBeDefined();
      expect(registry.forPlot(pad(FREEHOLD_CLAIM_RENEW_CHUNK)), arm).toBeUndefined();
      expect(registry.counters, arm).toMatchObject({ released: 1, renewChunksAbandoned: 0 });
      expect(warn, arm).not.toHaveBeenCalled();
    }
  });

  it('cuts a release chunk whose checkout is parked at the pass deadline: claims kept, no re-read, the late client back once', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    const f = fakePool([releaseRule(() => new Error('never sent'))]);
    const parking = parkingPool(f.pool, 1);
    const warn = vi.fn();
    const deadline = new AbortController();
    const pass = renewFreeholdClaims({
      ...renewDeps(registry, parking.pool),
      wanted: () => false,
      warn,
      deadlineSignal: () => deadline.signal,
    });
    await parking.parked;
    deadline.abort();
    await expect(pass).resolves.toBeUndefined();
    // No statement went out, so nothing can have landed: every claim stays,
    // the re-read is never asked for, and the second chunk never starts.
    expect(registry.count()).toBe(FREEHOLD_CLAIM_RENEW_CHUNK + 1);
    expect(parking.checkouts()).toBe(1);
    expect(registry.counters).toMatchObject({ released: 0, renewChunksAbandoned: 2 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(deadlineWarn(2));
    parking.arrive();
    await drain();
    expect(f.counts()).toEqual({ connects: 1, releases: 1 });
    expect(f.statements).toEqual([]);
  });

  it("cuts a thrown release's RE-READ whose checkout is parked at the pass deadline: claims kept, the late client back once", async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    registry.record(claim('plot:b', 2));
    const f = fakePool([
      releaseRule(() => new Error('Connection terminated unexpectedly')),
      // Had the re-read run, it would have dropped both.
      { match: (t) => t.startsWith('SELECT plot_id, holder'), answer: () => [] },
    ]);
    const parking = parkingPool(f.pool, 2);
    const warn = vi.fn();
    const deadline = new AbortController();
    const pass = renewFreeholdClaims({
      ...renewDeps(registry, parking.pool),
      wanted: () => false,
      warn,
      deadlineSignal: () => deadline.signal,
    });
    await parking.parked;
    deadline.abort();
    await expect(pass).resolves.toBeUndefined();
    expect(registry.all().map((c) => c.plotId)).toEqual(['plot:a', 'plot:b']);
    expect(registry.counters).toMatchObject({ released: 0, renewChunksAbandoned: 1 });
    expect(warn).toHaveBeenCalledWith(deadlineWarn(1));
    // Only the release's own client so far; the parked one hands back once.
    expect(f.counts()).toEqual({ connects: 1, releases: 1 });
    const before = f.texts();
    parking.arrive();
    await drain();
    expect(f.counts()).toEqual({ connects: 2, releases: 2 });
    expect(f.texts()).toEqual(before);
    expect(before.some((t) => t.startsWith('SELECT plot_id, holder'))).toBe(false);
  });

  it('refuses a re-read on the CLOCK alone: nowMs past the deadline inside the release answer, with a signal that never aborts', async () => {
    for (const arm of ['completed', 'thrown'] as const) {
      const registry = createFreeholdClaimRegistry();
      registry.record(claim('plot:a', 1));
      registry.record(claim('plot:b', 2));
      let now = 0;
      const f = fakePool([
        releaseRule(() => {
          now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
          return arm === 'thrown'
            ? new Error('Connection terminated unexpectedly')
            : [{ plot_id: 'plot:a' }];
        }),
        { match: (t) => t.startsWith('SELECT plot_id, holder'), answer: () => [] },
      ]);
      await renewFreeholdClaims({
        ...renewDeps(registry, f.pool),
        wanted: () => false,
        nowMs: () => now,
        deadlineSignal: () => new AbortController().signal,
      });
      expect(f.counts().connects, arm).toBe(1);
      expect(
        f.texts().some((t) => t.startsWith('SELECT plot_id, holder')),
        arm,
      ).toBe(false);
      expect(
        registry.all().map((c) => c.plotId),
        arm,
      ).toEqual(arm === 'thrown' ? ['plot:a', 'plot:b'] : ['plot:b']);
      expect(registry.counters, arm).toMatchObject({
        released: arm === 'thrown' ? 0 : 1,
        renewChunksAbandoned: 1,
      });
    }
  });

  const releaseRule = (answer: (ids: string[]) => Row[] | Error): Rule => ({
    match: (t) => t.includes("holder || '#released'"),
    answer: (v) => answer((v ?? [])[1] as string[]),
  });
  /** Both release reads: the lock-free one after a completed release and the
   *  FOR SHARE one after a thrown release. */
  const isReleaseRead = (t: string) =>
    t === FREEHOLD_CLAIM_RELEASE_READ_SQL || t === FREEHOLD_CLAIM_RELEASE_WAIT_SQL;
  const releaseReadRule = (answer: () => Row[] | Error): Rule => ({
    match: isReleaseRead,
    answer,
  });
  /** A release read's row, as the database answers it. */
  const readRow = (plot_id: string, holder: string, live: boolean): Row => ({
    plot_id,
    holder,
    live,
  });
  const RELEASED = `${HOLDER}#released`;

  it('abandons the release chunks a deadline reached BETWEEN them leaves unstarted, and keeps their claims', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < 2 * FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) {
      registry.record(claim(pad(i), i + 1));
    }
    let now = 0;
    const f = fakePool([
      releaseRule((ids) => {
        // The first release chunk takes the whole pass deadline.
        now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
        return ids.map((plot_id) => ({ plot_id }));
      }),
    ]);
    const warn = vi.fn();
    await renewFreeholdClaims({
      ...renewDeps(registry, f.pool),
      wanted: () => false,
      nowMs: () => now,
      warn,
    });
    expect(f.texts().filter((t) => t.includes("'#released'"))).toHaveLength(1);
    expect(registry.counters).toMatchObject({
      released: FREEHOLD_CLAIM_RENEW_CHUNK,
      renewChunksAbandoned: 2,
    });
    // The chunk-top stop warns once, with the number it counted.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(deadlineWarn(2));
    expect(registry.forPlot(pad(0))).toBeUndefined();
    expect(registry.count()).toBe(FREEHOLD_CLAIM_RENEW_CHUNK + 1);
  });

  it('re-reads a THROWN release chunk under FOR SHARE: a release that landed leaves, counted; one that did not stays', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    registry.record(claim('plot:b', 2));
    const f = fakePool([
      // The answer was lost: plot:a's release landed, plot:b's did not.
      releaseRule(() => new Error('Connection terminated unexpectedly')),
      releaseReadRule(() => [readRow('plot:a', RELEASED, false), readRow('plot:b', HOLDER, true)]),
    ]);
    await renewFreeholdClaims({ ...renewDeps(registry, f.pool), wanted: () => false });
    expect(registry.forPlot('plot:a')).toBeUndefined();
    expect(registry.forPlot('plot:b')).toBeDefined();
    expect(registry.counters.released).toBe(1);
    // The waiting form, never the lock-free one: a lock-free read could run
    // before a stalled COMMIT became visible and keep a claim already released.
    const reads = f.statements.filter((s) => isReleaseRead(s.text));
    expect(reads.map((s) => [s.text, s.values])).toEqual([
      [FREEHOLD_CLAIM_RELEASE_WAIT_SQL, [HOLDER, ['plot:a', 'plot:b']]],
    ]);
  });

  it('classifies every release read row alike in both arms: ours and live stays; our release leaves counted; the rest leave uncounted', async () => {
    for (const arm of ['thrown', 'completed'] as const) {
      const registry = createFreeholdClaimRegistry();
      const ids = ['plot:a', 'plot:b', 'plot:c', 'plot:d', 'plot:e'];
      for (const [i, plotId] of ids.entries()) registry.record(claim(plotId, i + 1));
      const f = fakePool([
        releaseRule(() =>
          arm === 'thrown' ? new Error('Connection terminated unexpectedly') : [],
        ),
        releaseReadRule(() => [
          // Ours and live: kept for the next pass.
          readRow('plot:a', HOLDER, true),
          // Our release landed: leaves, counted.
          readRow('plot:b', RELEASED, false),
          // An EXPIRED row of ours: no longer anyone's live claim, leaves,
          // uncounted (it would otherwise cost a release every pass forever).
          readRow('plot:c', HOLDER, false),
          // plot:d: no row. plot:e: another holder's (the statement never
          // returns one; a reader that did is still answered gone).
          readRow('plot:e', 'realmB#other', true),
        ]),
      ]);
      await renewFreeholdClaims({ ...renewDeps(registry, f.pool), wanted: () => false });
      expect(
        registry.all().map((c) => c.plotId),
        arm,
      ).toEqual(['plot:a']);
      expect(registry.counters.released, arm).toBe(1);
      const sql =
        arm === 'thrown' ? FREEHOLD_CLAIM_RELEASE_WAIT_SQL : FREEHOLD_CLAIM_RELEASE_READ_SQL;
      const reads = f.statements.filter((s) => isReleaseRead(s.text));
      expect(
        reads.map((s) => [s.text, s.values]),
        arm,
      ).toEqual([[sql, [HOLDER, ids]]]);
    }
  });

  it('pins both release reads whole: holder and liveness per row, ordered, the thrown form FOR SHARE', () => {
    const read = `SELECT plot_id, holder, expires_at > clock_timestamp() AS live
  FROM freehold_plot_claims
 WHERE plot_id = ANY($2::text[])
   AND holder IN ($1::text, $1::text || '#released')
 ORDER BY plot_id`;
    const wait = `${read}\n   FOR SHARE`;
    expect(FREEHOLD_CLAIM_RELEASE_READ_SQL).toBe(read);
    expect(FREEHOLD_CLAIM_RELEASE_WAIT_SQL).toBe(wait);
    // The mutants this pin exists for each really differ from the pinned
    // text, so the toBe above refuses them: FOR KEY SHARE (which the release's
    // NO KEY UPDATE never blocks, so the read would not wait) and the lock-free
    // form.
    for (const mutant of [wait.replace('FOR SHARE', 'FOR KEY SHARE'), wait.replace(/\n.*$/, '')]) {
      expect(mutant).not.toBe(wait);
    }
  });

  it('reads release rows for the asked ids only, from typed fields only, and sends nothing for none or a bad id', async () => {
    const empty = recordingTx(() => []);
    const none = await readFreeholdClaimReleasesOnClient(
      empty.tx as FreeholdQueryable,
      HOLDER,
      [],
      { wait: true },
    );
    expect(none).toEqual(new Map());
    expect(empty.seen).toEqual([]);
    // A bad holder (empty, or past the 119 characters that leave the release
    // suffix room) or a bad plot id throws before any statement.
    const bad: [string, string[]][] = [
      ['', ['plot:a']],
      ['h'.repeat(120), ['plot:a']],
      [HOLDER, ['plot a']],
      [HOLDER, ['plot:a', '']],
    ];
    for (const [holder, ids] of bad) {
      const refused = recordingTx(() => []);
      await expect(
        readFreeholdClaimReleasesOnClient(refused.tx as FreeholdQueryable, holder, ids, {
          wait: false,
        }),
        `${holder.length}:${ids.join(',')}`,
      ).rejects.toThrow(RangeError);
      expect(refused.seen).toEqual([]);
    }
    // The cap from below: the longest live holder, 119 characters, is read as
    // asked, and its own released shape (128 characters) answers released.
    const longest = 'h'.repeat(119);
    for (const wait of [false, true]) {
      const atCap = recordingTx(() => [
        readRow('plot:a', longest, true),
        readRow('plot:b', `${longest}#released`, false),
      ]);
      const readings = await readFreeholdClaimReleasesOnClient(
        atCap.tx as FreeholdQueryable,
        longest,
        ['plot:a', 'plot:b'],
        { wait },
      );
      expect([...readings], String(wait)).toEqual([
        ['plot:a', 'held'],
        ['plot:b', 'released'],
      ]);
      expect(atCap.seen, String(wait)).toEqual([
        {
          text: wait ? FREEHOLD_CLAIM_RELEASE_WAIT_SQL : FREEHOLD_CLAIM_RELEASE_READ_SQL,
          values: [longest, ['plot:a', 'plot:b']],
        },
      ]);
    }
    const asked = ['plot:a', 'plot:b', 'plot:c', 'plot:d'];
    for (const wait of [false, true]) {
      const { tx, seen } = recordingTx(() => [
        // Never asked: absent from the answer.
        readRow('plot:z', HOLDER, true),
        // A non-string id: absent.
        { plot_id: 42, holder: HOLDER, live: true },
        readRow('plot:a', HOLDER, true),
        // A non-string holder, or a liveness that is not a boolean, proves
        // nothing: answered gone, never held.
        { plot_id: 'plot:b', holder: 42, live: true },
        { plot_id: 'plot:c', holder: HOLDER, live: 'true' },
        readRow('plot:d', RELEASED, false),
      ]);
      const readings = await readFreeholdClaimReleasesOnClient(
        tx as FreeholdQueryable,
        HOLDER,
        asked,
        { wait },
      );
      expect([...readings], String(wait)).toEqual([
        ['plot:a', 'held'],
        ['plot:b', 'gone'],
        ['plot:c', 'gone'],
        ['plot:d', 'released'],
      ]);
      expect(seen, String(wait)).toEqual([
        {
          text: wait ? FREEHOLD_CLAIM_RELEASE_WAIT_SQL : FREEHOLD_CLAIM_RELEASE_READ_SQL,
          values: [HOLDER, asked],
        },
      ]);
    }
  });

  it('drops an EXPIRED unwanted claim of ours once, uncounted, instead of releasing it every pass', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([
      // Its row lapsed (the releases failed past the TTL): the release passes
      // it over, and the read answers it ours but expired.
      releaseRule(() => []),
      {
        match: (t) => t.startsWith('SELECT plot_id'),
        answer: () => [readRow('plot:a', HOLDER, false)],
      },
    ]);
    const deps = { ...renewDeps(registry, f.pool), wanted: () => false };
    await renewFreeholdClaims(deps);
    expect(registry.count()).toBe(0);
    expect(registry.counters.released).toBe(0);
    await renewFreeholdClaims(deps);
    expect(f.texts().filter((t) => t.includes("holder || '#released'"))).toHaveLength(1);
  });

  it('keeps a thrown release chunk for the next pass when its re-read throws too', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    registry.record(claim('plot:b', 2));
    let down = true;
    const f = fakePool([
      releaseRule((ids) => (down ? sqlError('57P01') : ids.map((plot_id) => ({ plot_id })))),
      // A lock bound run out (a stalled COMMIT still holding the row) is one.
      releaseReadRule(() => sqlError('55P03')),
    ]);
    const deps = { ...renewDeps(registry, f.pool), wanted: () => false };
    await renewFreeholdClaims(deps);
    expect(registry.count()).toBe(2);
    expect(registry.counters.released).toBe(0);
    expect(f.texts().filter((t) => t === FREEHOLD_CLAIM_RELEASE_WAIT_SQL)).toHaveLength(1);
    // The next pass releases them.
    down = false;
    await renewFreeholdClaims(deps);
    expect(registry.count()).toBe(0);
    expect(registry.counters.released).toBe(2);
  });

  it('never cuts a release STATEMENT at the pass deadline: one in flight when it fires still lands, counted', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const deadline = new AbortController();
    const f = fakePool([
      releaseRule((ids) => {
        // The deadline fires while the release statement is out.
        deadline.abort();
        return ids.map((plot_id) => ({ plot_id }));
      }),
      // Had the deadline cut the release, its re-read would decide instead.
      releaseReadRule(() => [readRow('plot:a', HOLDER, true)]),
    ]);
    await renewFreeholdClaims({
      ...renewDeps(registry, f.pool),
      wanted: () => false,
      deadlineSignal: () => deadline.signal,
    });
    expect(registry.counters.released).toBe(1);
    expect(registry.forPlot('plot:a')).toBeUndefined();
    expect(f.texts().at(-1)).toBe('COMMIT');
    expect(f.texts().some(isReleaseRead)).toBe(false);
    expect(f.counts()).toEqual({ connects: 1, releases: 1 });
  });

  it("refuses a release re-read's CHECKOUT past the pass deadline before any SQL, keeping its claims", async () => {
    for (const arm of ['completed', 'thrown'] as const) {
      const registry = createFreeholdClaimRegistry();
      registry.record(claim('plot:a', 1));
      registry.record(claim('plot:b', 2));
      const deadline = new AbortController();
      const f = fakePool([
        releaseRule(() => {
          deadline.abort();
          return arm === 'thrown'
            ? new Error('Connection terminated unexpectedly')
            : [{ plot_id: 'plot:a' }];
        }),
        // Had the re-read run, it would have dropped every claim it asked about.
        releaseReadRule(() => []),
      ]);
      await renewFreeholdClaims({
        ...renewDeps(registry, f.pool),
        wanted: () => false,
        deadlineSignal: () => deadline.signal,
      });
      // One checkout in the pass, the release's: the re-read never asked.
      expect(f.counts().connects, arm).toBe(1);
      expect(f.texts().some(isReleaseRead), arm).toBe(false);
      expect(
        registry.all().map((c) => c.plotId),
        arm,
      ).toEqual(arm === 'thrown' ? ['plot:a', 'plot:b'] : ['plot:b']);
      expect(registry.counters.released, arm).toBe(arm === 'thrown' ? 0 : 1);
    }
  });

  it('ends a pass by its deadline plus at most ONE transaction wall: the release out runs to its wall, and nothing starts after', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    const deadline = new AbortController();
    let asked = () => {};
    const stalled = new Promise<void>((resolve) => {
      asked = resolve;
    });
    const seen = { connects: 0, releases: 0, statements: [] as string[] };
    // A client whose release statement never answers: only its own wall
    // (which destroys the client) can end it.
    const pool = {
      async connect() {
        seen.connects++;
        let cut: ((error: Error) => void) | null = null;
        const client = {
          query(text: string) {
            seen.statements.push(text);
            if (text.includes("holder || '#released'")) {
              asked();
              return new Promise((_resolve, reject) => {
                cut = reject;
              });
            }
            return Promise.resolve({ rows: [], rowCount: 0, command: text.split(/[ ;]/)[0] });
          },
          release(error?: Error) {
            seen.releases++;
            if (error) cut?.(new Error('Connection terminated'));
          },
          on: () => client,
          removeListener: () => client,
        };
        return client;
      },
    } as unknown as FreeholdTxPool;
    // The wall's own timer, driven by hand: no real wait.
    vi.useFakeTimers();
    try {
      let done = false;
      const pass = renewFreeholdClaims({
        ...renewDeps(registry, pool),
        wanted: () => false,
        deadlineSignal: () => deadline.signal,
      }).then(() => {
        done = true;
      });
      await stalled;
      // The deadline fires with the first release out.
      deadline.abort();
      await vi.advanceTimersByTimeAsync(FREEHOLD_CLAIM_RENEW_BOUNDS.wallMs - 1);
      await drain();
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await pass;
      expect(done).toBe(true);
    } finally {
      vi.useRealTimers();
    }
    // ONE checkout in the whole pass: the thrown release's re-read was refused
    // at its checkout and the second chunk never started. Both are abandoned:
    // the first left undecided by the refused re-read, the second unstarted.
    expect(seen.connects).toBe(1);
    expect(seen.releases).toBe(1);
    expect(seen.statements.filter((t) => t.includes("holder || '#released'"))).toHaveLength(1);
    expect(registry.counters).toMatchObject({
      released: 0,
      renewChunksAbandoned: 2,
      renewPasses: 1,
    });
    expect(registry.count()).toBe(FREEHOLD_CLAIM_RENEW_CHUNK + 1);
  });

  it('drops only the very claim the pass snapshotted: a newer one a login records mid-pass survives, at every drop site', async () => {
    const newer = { plotId: 'plot:a', accountId: 1, generation: '2', acquiredAtMs: 5 };
    const sites: { name: string; wanted: boolean; rules: (relogin: () => void) => Rule[] }[] = [
      {
        name: 'released',
        wanted: false,
        rules: (relogin) => [
          releaseRule((ids) => {
            relogin();
            return ids.map((plot_id) => ({ plot_id }));
          }),
        ],
      },
      {
        name: 'not returned',
        wanted: false,
        rules: (relogin) => [
          releaseRule(() => []),
          releaseReadRule(() => {
            relogin();
            return [];
          }),
        ],
      },
      {
        name: 'thrown',
        wanted: false,
        rules: (relogin) => [
          releaseRule(() => new Error('Connection terminated unexpectedly')),
          releaseReadRule(() => {
            relogin();
            return [readRow('plot:a', RELEASED, false)];
          }),
        ],
      },
      {
        name: 'lost',
        wanted: true,
        rules: (relogin) => [
          { match: (t) => t.includes('SET heartbeat_at'), answer: () => [] },
          {
            match: (t) => t === FREEHOLD_CLAIM_STILL_HELD_SQL,
            answer: () => {
              relogin();
              return [];
            },
          },
        ],
      },
    ];
    for (const site of sites) {
      for (const racing of [true, false]) {
        const label = `${site.name}${racing ? '' : ', control'}`;
        const registry = createFreeholdClaimRegistry();
        registry.record(claim('plot:a', 1));
        const relogin = () => {
          if (racing) registry.record(newer);
        };
        const onLost = vi.fn();
        const warn = vi.fn();
        await renewFreeholdClaims({
          ...renewDeps(registry, fakePool(site.rules(relogin)).pool),
          wanted: () => site.wanted,
          onLost,
          warn,
        });
        if (racing) {
          expect(registry.forPlot('plot:a'), label).toBe(newer);
          expect(registry.forAccount(1), label).toBe(newer);
          // Not this pass's to book or report: the newer claim is its own.
          expect(registry.counters, label).toMatchObject({ released: 0, lost: 0 });
          expect(onLost, label).not.toHaveBeenCalled();
          expect(warn, label).not.toHaveBeenCalled();
        } else {
          // Control: the same site, nothing recorded mid-pass, drops it.
          expect(registry.forPlot('plot:a'), label).toBeUndefined();
        }
      }
    }
  });

  const raceWarn = (count: number) =>
    `freehold claim releases raced a same-holder re-login: ${count}; those claims are dropped and their plots stop writing`;

  it('drops a newer claim at the SAME generation once our release landed: raced, counted, reported lost; a higher generation stays', async () => {
    // A re-login on this realm re-stamps this holder's own row and KEEPS the
    // generation; if its acquire ran in the database before our release
    // statement, the release renamed the row the login re-stamped, so the
    // newer claim is dead. A takeover after our release carries a higher
    // generation and is live.
    for (const arm of ['completed', 'thrown'] as const) {
      for (const generation of ['1', '2']) {
        const label = `${arm}, generation ${generation}`;
        const registry = createFreeholdClaimRegistry();
        registry.record(claim('plot:a', 1));
        const newer = { plotId: 'plot:a', accountId: 1, generation, acquiredAtMs: 5 };
        const relogin = () => registry.record(newer);
        const rules: Rule[] =
          arm === 'completed'
            ? [
                releaseRule((ids) => {
                  relogin();
                  return ids.map((plot_id) => ({ plot_id }));
                }),
              ]
            : [
                releaseRule(() => {
                  relogin();
                  return new Error('Connection terminated unexpectedly');
                }),
                releaseReadRule(() => [readRow('plot:a', RELEASED, false)]),
              ];
        const onLost = vi.fn();
        const warn = vi.fn();
        await renewFreeholdClaims({
          ...renewDeps(registry, fakePool(rules).pool),
          wanted: () => false,
          onLost,
          warn,
        });
        if (generation === '1') {
          expect(registry.forPlot('plot:a'), label).toBeUndefined();
          expect(registry.forAccount(1), label).toBeUndefined();
          expect(registry.counters, label).toMatchObject({ releaseRaced: 1, released: 0, lost: 0 });
          expect(onLost, label).toHaveBeenCalledTimes(1);
          expect(onLost, label).toHaveBeenCalledWith(newer);
          // Production binds no onLost, so the drop is never silent: one
          // fixed line, the count only.
          expect(warn, label).toHaveBeenCalledTimes(1);
          expect(warn, label).toHaveBeenCalledWith(raceWarn(1));
        } else {
          expect(registry.forPlot('plot:a'), label).toBe(newer);
          expect(registry.counters, label).toMatchObject({ releaseRaced: 0, released: 0 });
          expect(onLost, label).not.toHaveBeenCalled();
          expect(warn, label).not.toHaveBeenCalled();
        }
      }
    }
  });

  it('warns ONCE per pass for every race it booked, across chunks and at every exit where the deadline stops the release loop', async () => {
    // Three release chunks. 'whole' and 'chunk top': one plot in each of the
    // first two re-logs at the SAME generation while its chunk's release is
    // out, and 'chunk top' then stops at the third chunk's start. The other
    // arms: only the first chunk races, and the deadline then stops the
    // SECOND chunk at one of the loop's other exits: its checkout cut, its
    // thrown release's FOR SHARE re-read refused, or the lock-free read of an
    // id its completed release did not return refused.
    const arms = [
      'whole',
      'chunk top',
      'checkout cut',
      'thrown, re-read refused',
      'completed, read refused',
    ] as const;
    for (const arm of arms) {
      const registry = createFreeholdClaimRegistry();
      for (let i = 0; i < 2 * FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) {
        registry.record(claim(pad(i), i + 1));
      }
      const twoRaces = arm === 'whole' || arm === 'chunk top';
      const racing = twoRaces ? [pad(0), pad(FREEHOLD_CLAIM_RENEW_CHUNK)] : [pad(0)];
      const deadline = new AbortController();
      let now = 0;
      let releases = 0;
      const f = fakePool([
        releaseRule((ids) => {
          releases++;
          for (const plotId of racing) {
            if (ids.includes(plotId)) {
              const held = registry.forPlot(plotId);
              if (held) registry.record({ ...held, acquiredAtMs: 5 });
            }
          }
          // The second release takes the whole pass deadline.
          if (releases === 2 && arm !== 'whole') now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
          if (releases === 2 && arm === 'thrown, re-read refused') {
            return new Error('Connection terminated unexpectedly');
          }
          if (releases === 2 && arm === 'completed, read refused') {
            return ids.slice(1).map((plot_id) => ({ plot_id }));
          }
          return ids.map((plot_id) => ({ plot_id }));
        }),
        // Had a refused read run, it would have dropped every claim it asked
        // about.
        releaseReadRule(() => []),
      ]);
      let checkouts = 0;
      const pool = {
        connect() {
          checkouts++;
          if (arm !== 'checkout cut' || checkouts !== 2) return f.pool.connect();
          // The second release's checkout never arrives: the deadline fires
          // while it waits (after the chunk-top check let it start).
          queueMicrotask(() => deadline.abort());
          return new Promise(() => {});
        },
      } as unknown as FreeholdTxPool;
      const warn = vi.fn();
      await renewFreeholdClaims({
        ...renewDeps(registry, pool),
        wanted: () => false,
        nowMs: () => now,
        warn,
        deadlineSignal: () => deadline.signal,
      });
      expect(registry.counters.releaseRaced, arm).toBe(racing.length);
      expect(
        warn.mock.calls.filter(([line]) => line === raceWarn(racing.length)),
        arm,
      ).toHaveLength(1);
      if (arm === 'whole') {
        expect(warn, arm).toHaveBeenCalledTimes(1);
        continue;
      }
      expect(warn, arm).toHaveBeenCalledTimes(2);
      // 'chunk top' abandons the third chunk; every other arm the second
      // (which it stopped in) and the third.
      expect(warn, arm).toHaveBeenCalledWith(deadlineWarn(arm === 'chunk top' ? 1 : 2));
      expect(registry.counters.renewChunksAbandoned, arm).toBe(arm === 'chunk top' ? 1 : 2);
      expect(f.texts().filter(isReleaseRead), arm).toEqual([]);
    }
  });

  it('warns the races of THIS pass, never the running total: a second racing pass warns its own one', async () => {
    const registry = createFreeholdClaimRegistry();
    // Every release races: the plot's re-login re-stamps it at the SAME
    // generation while the release is out.
    const f = fakePool([
      releaseRule((ids) => {
        for (const plotId of ids) {
          const held = registry.forPlot(plotId);
          if (held) registry.record({ ...held, acquiredAtMs: 5 });
        }
        return ids.map((plot_id) => ({ plot_id }));
      }),
    ]);
    const warn = vi.fn();
    const deps = { ...renewDeps(registry, f.pool), wanted: () => false, warn };
    registry.record(claim('plot:a', 1));
    await renewFreeholdClaims(deps);
    registry.record(claim('plot:b', 2));
    await renewFreeholdClaims(deps);
    expect(registry.counters).toMatchObject({ releaseRaced: 2, renewPasses: 2 });
    expect(registry.count()).toBe(0);
    // One line per pass, each with that pass's own count.
    expect(warn.mock.calls).toEqual([[raceWarn(1)], [raceWarn(1)]]);
  });

  it('re-checks each release claim right before its statement: one in flight or replaced since the snapshot is left out', async () => {
    for (const arm of ['completed', 'thrown', 'control'] as const) {
      const registry = createFreeholdClaimRegistry();
      for (const [i, plotId] of ['plot:a', 'plot:b', 'plot:c'].entries()) {
        registry.record(claim(plotId, i + 1));
      }
      const newer = { plotId: 'plot:b', accountId: 2, generation: '1', acquiredAtMs: 5 };
      const f = fakePool([
        releaseRule((ids) =>
          arm === 'thrown'
            ? new Error('Connection terminated unexpectedly')
            : ids.map((plot_id) => ({ plot_id })),
        ),
        releaseReadRule(() => [readRow('plot:c', RELEASED, false)]),
      ]);
      // AFTER the snapshot and the checkout, at the release's BEGIN: a login
      // marks plot:a in flight and another records a newer claim for plot:b.
      // Only a check made in the callback itself can see either.
      let hooked = arm === 'control';
      let letGo = () => {};
      const pool = {
        async connect() {
          const client = await f.pool.connect();
          const wrapped = {
            query(text: string, values?: unknown[]) {
              if (!hooked && text.startsWith('BEGIN')) {
                hooked = true;
                letGo = registry.holdInFlight('plot:a');
                registry.record(newer);
              }
              return client.query(text, values);
            },
            release: (error?: Error | boolean) => client.release(error),
            on: () => wrapped,
            removeListener: () => wrapped,
          };
          return wrapped;
        },
      } as unknown as FreeholdTxPool;
      await renewFreeholdClaims({ ...renewDeps(registry, pool), wanted: () => false });
      const release = f.statements.find((s) => s.text.includes("holder || '#released'"));
      const reads = f.statements.filter((s) => isReleaseRead(s.text));
      if (arm === 'control') {
        expect(release?.values?.[1], arm).toEqual(['plot:a', 'plot:b', 'plot:c']);
        expect(registry.count(), arm).toBe(0);
        continue;
      }
      expect(release?.values?.[1], arm).toEqual(['plot:c']);
      // Only what went out is ever re-read.
      expect(
        reads.map((s) => s.values),
        arm,
      ).toEqual(arm === 'thrown' ? [[HOLDER, ['plot:c']]] : []);
      expect(registry.forPlot('plot:a'), arm).toEqual(claim('plot:a', 1));
      expect(registry.forPlot('plot:b'), arm).toBe(newer);
      expect(registry.forPlot('plot:c'), arm).toBeUndefined();
      expect(registry.counters, arm).toMatchObject({ released: 1, releaseRaced: 0, lost: 0 });
      letGo();
      expect(registry.inFlight('plot:a'), arm).toBe(false);
    }
  });

  it('sends no release for a claim already in flight when the pass starts: a chunk all in flight takes no client, a mixed one sends only the free claim', async () => {
    for (const arm of ['all in flight', 'mixed'] as const) {
      const registry = createFreeholdClaimRegistry();
      registry.record(claim('plot:a', 1));
      if (arm === 'mixed') registry.record(claim('plot:b', 2));
      // In flight BEFORE the pass snapshots: a trip, a recovery pass or a login.
      const letGo = registry.holdInFlight('plot:a');
      const f = fakePool([releaseRule((ids) => ids.map((plot_id) => ({ plot_id })))]);
      await renewFreeholdClaims({ ...renewDeps(registry, f.pool), wanted: () => false });
      const sent = f.statements.filter((s) => s.text.includes("holder || '#released'"));
      if (arm === 'all in flight') {
        expect(f.counts(), arm).toEqual({ connects: 0, releases: 0 });
        expect(f.statements, arm).toEqual([]);
      } else {
        expect(
          sent.map((s) => (s.values ?? [])[1]),
          arm,
        ).toEqual([['plot:b']]);
        expect(registry.forPlot('plot:b'), arm).toBeUndefined();
        expect(f.counts().connects, arm).toBe(1);
      }
      expect(registry.forPlot('plot:a'), arm).toEqual(claim('plot:a', 1));
      expect(registry.counters, arm).toMatchObject({
        released: arm === 'mixed' ? 1 : 0,
        renewChunksAbandoned: 0,
      });
      letGo();
    }
  });

  it('never rejects on a throwing warn: the pass runs on and books its claims as before', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    registry.record(claim('plot:b', 2));
    // plot:a renews; plot:b is neither renewed nor still held: taken.
    const f = fakePool([
      { match: (t) => t.includes('SET heartbeat_at'), answer: () => [{ plot_id: 'plot:a' }] },
    ]);
    const warn = vi.fn(() => {
      throw new Error('log sink down');
    });
    const lost: string[] = [];
    const deps = {
      ...renewDeps(registry, f.pool),
      // plot:a's wanted test throws: the pass's first warn, before any chunk.
      wanted: (c: { plotId: string }) => {
        if (c.plotId === 'plot:a') throw new Error('no owner key');
        return true;
      },
      onLost: (c: { plotId: string }) => lost.push(c.plotId),
      warn,
    };
    await expect(renewFreeholdClaims(deps)).resolves.toBeUndefined();
    // Both warns were attempted: the wanted one and the lost one after it.
    expect(warn).toHaveBeenCalledTimes(2);
    expect(registry.counters).toMatchObject({ wantedThrew: 1, renewed: 1, lost: 1 });
    expect(lost).toEqual(['plot:b']);
    await expect(renewFreeholdClaims(deps)).resolves.toBeUndefined();
    expect(registry.counters).toMatchObject({ renewPasses: 2, renewPassesSkipped: 0 });
  });

  it('never rejects on a throwing onLost, at the lost site or the raced one: every claim is still booked and warned', async () => {
    // Two wanted claims nobody holds any more (lost), then two unwanted claims
    // whose release races a same-generation re-login (raced). onLost throws on
    // every call.
    const registry = createFreeholdClaimRegistry();
    for (const [i, plotId] of ['plot:a', 'plot:b', 'plot:c', 'plot:d'].entries()) {
      registry.record(claim(plotId, i + 1));
    }
    const f = fakePool([
      { match: (t) => t.includes('SET heartbeat_at'), answer: () => [] },
      {
        match: (t) => t === FREEHOLD_CLAIM_STILL_HELD_SQL,
        answer: () => [],
      },
      releaseRule((ids) => {
        for (const plotId of ids) {
          const held = registry.forPlot(plotId);
          if (held) registry.record({ ...held, acquiredAtMs: 5 });
        }
        return ids.map((plot_id) => ({ plot_id }));
      }),
    ]);
    const onLost = vi.fn((_claim: { plotId: string }) => {
      throw new Error('host hook down');
    });
    const warn = vi.fn();
    await expect(
      renewFreeholdClaims({
        ...renewDeps(registry, f.pool),
        wanted: (c) => c.plotId === 'plot:a' || c.plotId === 'plot:b',
        onLost,
        warn,
      }),
    ).resolves.toBeUndefined();
    // Every claim was handed over once, the first throw stopping neither site.
    expect(onLost.mock.calls.map(([c]) => c.plotId)).toEqual([
      'plot:a',
      'plot:b',
      'plot:c',
      'plot:d',
    ]);
    expect(registry.count()).toBe(0);
    expect(registry.counters).toMatchObject({
      lost: 2,
      releaseRaced: 2,
      renewPasses: 1,
      onLostThrew: 4,
    });
    expect(warn.mock.calls).toEqual([
      ['freehold claims lost to another holder: 2; their plots stop writing'],
      [raceWarn(2)],
      // The swallowed throws leave a trace: one line, the count only.
      [lostHookWarn(4)],
    ]);
  });

  it('keeps the lost, race and onLost warns safe from a throwing log sink: the pass resolves and is counted', async () => {
    // The same lost, raced and throwing-hook pass, with a log sink that
    // throws on every line: neither the lost line mid-pass nor the finally's
    // race and hook lines may reject the pass or skip its counters. (The
    // wanted-check, abandon and closing-clock lines meet a throwing sink in
    // their own cases.)
    const registry = createFreeholdClaimRegistry();
    for (const [i, plotId] of ['plot:a', 'plot:b', 'plot:c', 'plot:d'].entries()) {
      registry.record(claim(plotId, i + 1));
    }
    const f = fakePool([
      { match: (t) => t.includes('SET heartbeat_at'), answer: () => [] },
      { match: (t) => t === FREEHOLD_CLAIM_STILL_HELD_SQL, answer: () => [] },
      releaseRule((ids) => {
        for (const plotId of ids) {
          const held = registry.forPlot(plotId);
          if (held) registry.record({ ...held, acquiredAtMs: 5 });
        }
        return ids.map((plot_id) => ({ plot_id }));
      }),
    ]);
    const warn = vi.fn((_line: string) => {
      throw new Error('log sink down');
    });
    await expect(
      renewFreeholdClaims({
        ...renewDeps(registry, f.pool),
        wanted: (c) => c.plotId === 'plot:a' || c.plotId === 'plot:b',
        onLost: () => {
          throw new Error('host hook down');
        },
        warn,
      }),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(3);
    expect(registry.counters).toMatchObject({ renewPasses: 1, onLostThrew: 4, releaseRaced: 2 });
  });

  it('counts a throwing onLost per pass: a second pass on one registry warns its own count', async () => {
    const registry = createFreeholdClaimRegistry();
    const warn = vi.fn();
    const onLost = () => {
      throw new Error('host hook down');
    };
    for (const pass of [1, 2]) {
      registry.record(claim(`plot:p${pass}`, pass));
      const f = fakePool([
        { match: (t) => t.includes('SET heartbeat_at'), answer: () => [] },
        { match: (t) => t === FREEHOLD_CLAIM_STILL_HELD_SQL, answer: () => [] },
      ]);
      await renewFreeholdClaims({ ...renewDeps(registry, f.pool), onLost, warn });
    }
    expect(warn.mock.calls.filter(([line]) => String(line).includes('onLost hook'))).toEqual([
      [lostHookWarn(1)],
      [lostHookWarn(1)],
    ]);
    // The lasting counter is the running total the warn deliberately is not.
    expect(registry.counters.onLostThrew).toBe(2);
  });

  it('skips a pass a log sink starts from inside the per-pass warns: the flag is held while they speak', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([
      { match: (t) => t.includes('SET heartbeat_at'), answer: () => [] },
      { match: (t) => t === FREEHOLD_CLAIM_STILL_HELD_SQL, answer: () => [] },
    ]);
    const inner: Promise<void>[] = [];
    const deps = {
      ...renewDeps(registry, f.pool),
      onLost: () => {
        throw new Error('host hook down');
      },
      // A sink that calls the renewer back, on the finally's own warn line.
      warn: (line: string) => {
        if (line.includes('onLost hook')) inner.push(renewFreeholdClaims(deps));
      },
    };
    await renewFreeholdClaims(deps);
    await Promise.all(inner);
    expect(inner).toHaveLength(1);
    expect(registry.counters).toMatchObject({ renewPassesSkipped: 1, renewPasses: 1 });
  });

  it('rejects a pass whose clock throws at its start with NO flag left set: the next pass runs', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([renewAll]);
    let clockDown = true;
    const deps = {
      ...renewDeps(registry, f.pool),
      nowMs: () => {
        if (clockDown) throw new Error('clock port down');
        return 0;
      },
    };
    await expect(renewFreeholdClaims(deps)).rejects.toThrow('clock port down');
    expect(f.statements).toEqual([]);
    clockDown = false;
    await renewFreeholdClaims(deps);
    expect(registry.counters).toMatchObject({ renewPassesSkipped: 0, renewPasses: 1, renewed: 1 });
  });

  const lostHookWarn = (count: number) =>
    `freehold claim onLost hook threw: ${count}; those claims are dropped and booked all the same`;
  // One fixed reason word, in the order the closing read is judged, so an
  // operator can tell a broken clock from a wall clock stepped back; never a
  // number.
  const clockCloseWarn = (
    reason: 'threw' | 'not a number' | 'not finite' | 'backward' | 'overflow',
  ) =>
    `freehold claim renew pass clock gave no usable duration at its close (${reason}); that pass is counted without one`;

  it('warns a throwing onLost once per pass, the count only, even when the pass then stops at its deadline', async () => {
    // Two renew chunks: the first finds its first plot taken by another
    // holder (lost; onLost throws) and takes the whole pass deadline, so the
    // pass stops at the second and leaves from inside the renew loop.
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    let now = 0;
    const f = fakePool([
      {
        match: (t) => t.includes('SET heartbeat_at'),
        answer: (v) => {
          now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
          return ((v ?? [])[2] as string[]).slice(1).map((plot_id) => ({ plot_id }));
        },
      },
      { match: (t) => t === FREEHOLD_CLAIM_STILL_HELD_SQL, answer: () => [] },
    ]);
    const onLost = vi.fn((_claim: { plotId: string }) => {
      throw new Error('host hook down');
    });
    const warn = vi.fn();
    await expect(
      renewFreeholdClaims({
        ...renewDeps(registry, f.pool),
        nowMs: () => now,
        onLost,
        warn,
        deadlineSignal: () => new AbortController().signal,
      }),
    ).resolves.toBeUndefined();
    expect(onLost.mock.calls.map(([c]) => c.plotId)).toEqual([pad(0)]);
    expect(registry.counters).toMatchObject({
      lost: 1,
      renewed: FREEHOLD_CLAIM_RENEW_CHUNK - 1,
      renewChunksAbandoned: 1,
    });
    expect(warn.mock.calls).toEqual([
      ['freehold claims lost to another holder: 1; their plots stop writing'],
      [deadlineWarn(1)],
      [lostHookWarn(1)],
    ]);
  });

  it('warns a booked race and a throwing onLost before the pass rejects on a clock port that throws after them', async () => {
    // Two release chunks: the first races a SAME-generation re-login (whose
    // onLost hook throws), and the clock port dies as its release answers, so
    // the second chunk's start throws. The pass still rejects on a throwing
    // clock; the race and hook lines must still go out, and the hook's throw
    // still be counted, from the finally every exit runs.
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    let clockDown = false;
    let clockThrows = 0;
    // Non-zero and rising until it dies, so a duration booked anyway would
    // show as one; the control pass below books exactly its own.
    let reading = 1_000;
    let releases = 0;
    const f = fakePool([
      releaseRule((ids) => {
        releases++;
        if (releases === 1) {
          const held = registry.forPlot(pad(0));
          if (held) registry.record({ ...held, acquiredAtMs: 5 });
          clockDown = true;
        }
        return ids.map((plot_id) => ({ plot_id }));
      }),
    ]);
    const warn = vi.fn();
    const onLost = vi.fn((_claim: { plotId: string }) => {
      throw new Error('host hook down');
    });
    const deps = {
      ...renewDeps(registry, f.pool),
      wanted: () => false,
      nowMs: () => {
        if (clockDown) {
          // The pass's closing read throws its OWN error, which must not
          // replace the one that stopped the pass.
          clockThrows++;
          throw new Error(clockThrows === 1 ? 'clock port down' : 'clock port still down');
        }
        reading += 10;
        return reading;
      },
      onLost,
      warn,
      deadlineSignal: () => new AbortController().signal,
    };
    await expect(renewFreeholdClaims(deps)).rejects.toThrow(/^clock port down$/);
    expect(clockThrows).toBe(2);
    // The raced drop reached the hook, whose throw is counted on this exit too.
    expect(onLost.mock.calls.map(([c]) => c.plotId)).toEqual([pad(0)]);
    expect(registry.counters).toMatchObject({
      releaseRaced: 1,
      onLostThrew: 1,
      released: FREEHOLD_CLAIM_RENEW_CHUNK - 1,
      // The pass is counted; a duration the dead clock cannot close is not,
      // though the clock had risen by 10 ms before it died.
      renewPasses: 1,
      renewPassMsTotal: 0,
    });
    expect(warn.mock.calls).toEqual([[raceWarn(1)], [lostHookWarn(1)], [clockCloseWarn('threw')]]);
    expect(f.texts().filter((t) => t.includes("holder || '#released'"))).toHaveLength(1);
    // The single-flight flag is free: with the clock back, the next pass runs
    // and releases the chunk the throw left behind, booking its own duration
    // (three readings 10 ms apart: start, the one chunk's start, close).
    clockDown = false;
    clockThrows = 0;
    await renewFreeholdClaims(deps);
    expect(registry.counters).toMatchObject({
      renewPassesSkipped: 0,
      releaseRaced: 1,
      onLostThrew: 1,
      renewPasses: 2,
      renewPassMsTotal: 20,
    });
    expect(registry.count()).toBe(0);
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('resolves a pass whose clock dies only at its close: counted, no duration, one fixed line said under the flag', async () => {
    // The clock answers through the whole pass (rising, non-zero) and throws
    // only on the closing read, which comes after the one renew chunk
    // answers. Four modes: a sink that records, one that throws, one that
    // calls the renewer back on the closing line, and a CLOCK that calls the
    // renewer back (once) on the closing read itself, before it throws.
    const modes = ['records', 'throws', 'calls back', 'clock calls back'] as const;
    for (const mode of modes) {
      const registry = createFreeholdClaimRegistry();
      registry.record(claim('plot:a', 1));
      let clockDown = false;
      let reading = 1_000;
      const f = fakePool([
        {
          ...renewAll,
          answer: (v) => {
            clockDown = true;
            return renewAll.answer(v);
          },
        },
      ]);
      const inner: Promise<void>[] = [];
      const lines: string[] = [];
      let clockCalledBack = false;
      const deps = {
        ...renewDeps(registry, f.pool),
        nowMs: () => {
          if (clockDown) {
            if (mode === 'clock calls back' && !clockCalledBack) {
              clockCalledBack = true;
              inner.push(renewFreeholdClaims(deps));
            }
            throw new Error('clock port down');
          }
          reading += 10;
          return reading;
        },
        warn: (line: string) => {
          lines.push(line);
          if (mode === 'throws') throw new Error('log sink down');
          if (mode === 'calls back') inner.push(renewFreeholdClaims(deps));
        },
      };
      const callsBack = mode === 'calls back' || mode === 'clock calls back';
      await expect(renewFreeholdClaims(deps), mode).resolves.toBeUndefined();
      // Every call back was a counted skip that resolved, never a pass.
      expect(await Promise.allSettled(inner), mode).toEqual(
        callsBack ? [{ status: 'fulfilled', value: undefined }] : [],
      );
      expect(lines, mode).toEqual([clockCloseWarn('threw')]);
      expect(registry.counters, mode).toMatchObject({
        renewed: 1,
        renewPasses: 1,
        renewPassMsTotal: 0,
        // The closing read and its line are both taken while the flag is
        // still held.
        renewPassesSkipped: callsBack ? 1 : 0,
      });
      expect(f.counts().connects, mode).toBe(1);
    }
  });

  // One claim, renewed by one chunk. The clock reads `startAt` until that
  // chunk answers and `closeAt` after it, so `closeAt` is the closing read.
  const closingReadRig = () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    let reading: unknown = 0;
    let close: unknown = 0;
    const f = fakePool([
      {
        ...renewAll,
        answer: (v) => {
          reading = close;
          return renewAll.answer(v);
        },
      },
    ]);
    const lines: string[] = [];
    const deps = {
      ...renewDeps(registry, f.pool),
      nowMs: () => reading as number,
      warn: (line: string) => {
        lines.push(line);
      },
    };
    // Resolves with the lines this one pass said.
    const pass = async (startAt: number, closeAt: unknown): Promise<string[]> => {
      reading = startAt;
      close = closeAt;
      lines.length = 0;
      await renewFreeholdClaims(deps);
      return [...lines];
    };
    return { registry, pass };
  };

  it('adds a pass duration only when the closing read gives a finite one: any other pass is counted, adds nothing and says the closing line', async () => {
    const { registry, pass } = closingReadRig();
    // A NaN or infinite reading (minus infinity included, which a clamp at
    // zero would book silently as a zero duration), and readings that are
    // not numbers at all: a BigInt, an object whose valueOf throws, and two
    // that subtraction would coerce into a finite duration, null (0) and a
    // Date (its epoch ms).
    const unusable: [string, unknown, Parameters<typeof clockCloseWarn>[0]][] = [
      ['NaN', Number.NaN, 'not finite'],
      ['+Infinity', Number.POSITIVE_INFINITY, 'not finite'],
      ['-Infinity', Number.NEGATIVE_INFINITY, 'not finite'],
      ['a BigInt', 1_000n, 'not a number'],
      [
        'a throwing valueOf',
        {
          valueOf() {
            throw new Error('clock reading broken');
          },
        },
        'not a number',
      ],
      ['null', null, 'not a number'],
      ['a Date', new Date(5), 'not a number'],
    ];
    for (const [name, closeAt, reason] of unusable) {
      expect(await pass(0, closeAt), name).toEqual([clockCloseWarn(reason)]);
    }
    // Two finite readings whose difference is not finite: the duration is
    // judged, not only the reading.
    expect(await pass(-Number.MAX_VALUE, Number.MAX_VALUE)).toEqual([clockCloseWarn('not finite')]);
    expect(registry.counters).toMatchObject({ renewPasses: 8, renewed: 8, renewPassMsTotal: 0 });
    // Control: a finite pass books its duration, silently, and nothing
    // poisoned the total.
    expect(await pass(100, 130)).toEqual([]);
    expect(registry.counters).toMatchObject({ renewPasses: 9, renewPassMsTotal: 30 });
    // A ZERO-length pass is a usable duration: silent, and the total stays.
    expect(await pass(100, 100)).toEqual([]);
    expect(registry.counters).toMatchObject({ renewPasses: 10, renewPassMsTotal: 30 });
    // A BACKWARD pass (a wall clock stepped back mid-pass) is no usable
    // duration either: it books nothing, not even a zero, and says so.
    expect(await pass(100, 70)).toEqual([clockCloseWarn('backward')]);
    expect(registry.counters).toMatchObject({ renewPasses: 11, renewPassMsTotal: 30 });
  });

  it('adds a pass duration only while the running total stays finite: prom-client refuses a non-finite inc, failing the scrape', async () => {
    const { registry, pass } = closingReadRig();
    // Each pass reads Number.MAX_VALUE ms, finite on its own; the second
    // would carry the total to Infinity, so it adds nothing, and says so.
    expect(await pass(0, Number.MAX_VALUE)).toEqual([]);
    expect(registry.counters.renewPassMsTotal).toBe(Number.MAX_VALUE);
    expect(await pass(0, Number.MAX_VALUE)).toEqual([clockCloseWarn('overflow')]);
    expect(registry.counters).toMatchObject({
      renewPasses: 2,
      renewed: 2,
      renewPassMsTotal: Number.MAX_VALUE,
    });
  });

  const startClockRefusal = 'freehold claim renew pass start clock reading is not a finite number';

  it('rejects a pass whose start clock reads no finite number, like one that throws: no flag left set, no statement, and the next pass runs', async () => {
    // Minus infinity would make the deadline's clock half true at once (every
    // chunk abandoned, every pass, while the claims lapse); NaN or plus
    // infinity would switch it off.
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([renewAll]);
    let start: unknown = 0;
    const lines: string[] = [];
    const deps = {
      ...renewDeps(registry, f.pool),
      nowMs: () => start as number,
      warn: (line: string) => {
        lines.push(line);
      },
    };
    // And two readings that are not numbers, which Number.isFinite (it
    // coerces nothing) has always refused with the SAME fixed message: these
    // arms guard against a regression to a coercing isFinite, which would
    // answer a BigInt with a TypeError of its own and take null as 0.
    for (const bad of [
      Number.NEGATIVE_INFINITY,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1_000n,
      null,
    ]) {
      start = bad;
      await expect(renewFreeholdClaims(deps), String(bad)).rejects.toThrow(
        new Error(startClockRefusal),
      );
    }
    expect(f.statements).toEqual([]);
    expect(lines).toEqual([]);
    expect(registry.counters).toMatchObject({
      renewPasses: 0,
      renewPassesSkipped: 0,
      renewChunksAbandoned: 0,
      missedHeartbeats: 0,
    });
    start = 0;
    await renewFreeholdClaims(deps);
    expect(registry.counters).toMatchObject({ renewPassesSkipped: 0, renewPasses: 1, renewed: 1 });
  });

  it('never rejects on a mid-pass clock reading that is no finite number: that check leaves the clock half off, and the signal still bounds the pass', async () => {
    // Only a clock that THROWS rejects a pass mid-pass. A BigInt or an object
    // whose valueOf throws would throw in a subtraction though the clock did
    // not, and +Infinity would trip the deadline at once; each, like NaN and
    // null, leaves that check to the signal alone. Two release chunks (a
    // release statement is never cut by the signal): the first chunk's check
    // reads the bad value, its release aborts the signal, and the second
    // chunk is abandoned on the signal, its clock never read.
    const readings: [string, unknown, Parameters<typeof clockCloseWarn>[0]][] = [
      ['a BigInt', 1_000n, 'not a number'],
      [
        'a throwing valueOf',
        {
          valueOf() {
            throw new Error('clock reading broken');
          },
        },
        'not a number',
      ],
      ['+Infinity', Number.POSITIVE_INFINITY, 'not finite'],
      ['NaN', Number.NaN, 'not finite'],
      ['null', null, 'not a number'],
    ];
    for (const [name, bad, reason] of readings) {
      const registry = createFreeholdClaimRegistry();
      for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) {
        registry.record(claim(pad(i), i + 1));
      }
      const deadline = new AbortController();
      const f = fakePool([
        releaseRule((ids) => {
          deadline.abort();
          return ids.map((plot_id) => ({ plot_id }));
        }),
      ]);
      let reads = 0;
      const lines: string[] = [];
      const deps = {
        ...renewDeps(registry, f.pool),
        wanted: () => false,
        // The start reads 0; every later read is the bad value.
        nowMs: () => (reads++ === 0 ? 0 : (bad as number)),
        warn: (line: string) => {
          lines.push(line);
        },
        deadlineSignal: () => deadline.signal,
      };
      await expect(renewFreeholdClaims(deps), name).resolves.toBeUndefined();
      // The first chunk ran (its check did not trip), the second waited on
      // the signal with its claim kept, and the close read the bad value too.
      expect(registry.counters, name).toMatchObject({
        released: FREEHOLD_CLAIM_RENEW_CHUNK,
        renewChunksAbandoned: 1,
        renewPasses: 1,
        renewPassMsTotal: 0,
      });
      expect(
        registry.all().map((c) => c.plotId),
        name,
      ).toEqual([pad(FREEHOLD_CLAIM_RENEW_CHUNK)]);
      expect(lines, name).toEqual([deadlineWarn(1), clockCloseWarn(reason)]);
      expect(reads, name).toBe(3);
    }
  });

  it('skips a pass its own start clock starts: the flag is re-checked after the read', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([renewAll]);
    const inner: Promise<void>[] = [];
    let reads = 0;
    const deps = {
      ...renewDeps(registry, f.pool),
      // A clock port that, on its first read only, calls the renewer itself.
      nowMs: () => {
        reads++;
        if (reads === 1) inner.push(renewFreeholdClaims(deps));
        return 0;
      },
    };
    await renewFreeholdClaims(deps);
    await Promise.all(inner);
    expect(inner).toHaveLength(1);
    // ONE pass ran (the one the clock started), so one client and one renew.
    expect(registry.counters).toMatchObject({ renewPasses: 1, renewPassesSkipped: 1, renewed: 1 });
    expect(f.counts().connects).toBe(1);
  });

  it('skips, never rejects, a call whose start clock starts a pass and then reads no finite number: the flag re-check runs first', async () => {
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:a', 1));
    const f = fakePool([renewAll]);
    const inner: Promise<void>[] = [];
    let reads = 0;
    const deps = {
      ...renewDeps(registry, f.pool),
      // On its first read only: starts a pass itself (whose own start reads
      // 0), then answers this call with NaN.
      nowMs: () => {
        reads++;
        if (reads === 1) {
          inner.push(renewFreeholdClaims(deps));
          return Number.NaN;
        }
        return 0;
      },
    };
    await expect(renewFreeholdClaims(deps)).resolves.toBeUndefined();
    await Promise.all(inner);
    expect(inner).toHaveLength(1);
    expect(registry.counters).toMatchObject({ renewPasses: 1, renewPassesSkipped: 1, renewed: 1 });
    expect(f.counts().connects).toBe(1);
  });

  it('clears the single-flight flag even when its finally throws before it: the next pass runs', async () => {
    // A counters object that refuses every write for the first pass: the
    // pass rejects, and so does every counter statement in its finally.
    const real = createFreeholdClaimRegistry();
    real.record(claim('plot:a', 1));
    const frozen = Object.freeze({ ...real.counters });
    let refuse = true;
    const registry = {
      ...real,
      get counters() {
        return refuse ? frozen : real.counters;
      },
    };
    const f = fakePool([renewAll]);
    const deps = { ...renewDeps(registry, f.pool) };
    await expect(renewFreeholdClaims(deps)).rejects.toThrow(TypeError);
    refuse = false;
    await renewFreeholdClaims(deps);
    expect(real.counters).toMatchObject({ renewPassesSkipped: 0, renewPasses: 1, renewed: 1 });
  });

  it('counts every release chunk a renew stop leaves behind: one per FREEHOLD_CLAIM_RENEW_CHUNK unwanted claims, rounded up', async () => {
    // One wanted claim (one renew chunk) and FREEHOLD_CLAIM_RENEW_CHUNK + 1
    // unwanted ones (two release chunks), behind a deadline already spent.
    const registry = createFreeholdClaimRegistry();
    registry.record(claim('plot:wanted', 99_999));
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    const deadline = new AbortController();
    deadline.abort();
    const f = fakePool([renewAll]);
    const warn = vi.fn();
    await renewFreeholdClaims({
      ...renewDeps(registry, f.pool),
      wanted: (c) => c.plotId === 'plot:wanted',
      warn,
      deadlineSignal: () => deadline.signal,
    });
    // The renew chunk and BOTH release chunks behind it, warned and counted.
    expect(f.counts().connects).toBe(0);
    expect(registry.counters).toMatchObject({
      renewChunksAbandoned: 3,
      missedHeartbeats: 1,
      renewed: 0,
      released: 0,
    });
    expect(warn.mock.calls).toEqual([[deadlineWarn(3)]]);
    expect(registry.count()).toBe(FREEHOLD_CLAIM_RENEW_CHUNK + 2);
  });

  it('never rejects on a throwing warn at the pass deadline either: the abandoned tail is booked as before', async () => {
    const registry = createFreeholdClaimRegistry();
    for (let i = 0; i < FREEHOLD_CLAIM_RENEW_CHUNK + 1; i++) registry.record(claim(pad(i), i + 1));
    let now = 0;
    const f = fakePool([
      {
        ...renewAll,
        answer: (v) => {
          // Each pass's first chunk takes the whole pass deadline.
          now += FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
          return renewAll.answer(v);
        },
      },
    ]);
    const warn = vi.fn(() => {
      throw new Error('log sink down');
    });
    const deps = { ...renewDeps(registry, f.pool), nowMs: () => now, warn };
    await expect(renewFreeholdClaims(deps)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `freehold claim renew pass hit its ${FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS} ms deadline; 1 chunks wait for the next pass or were left undecided`,
    );
    expect(registry.counters).toMatchObject({
      renewed: FREEHOLD_CLAIM_RENEW_CHUNK,
      missedHeartbeats: 1,
      renewChunksAbandoned: 1,
      renewPasses: 1,
    });
    // The flag is free and the cursor moved: the next pass starts at the tail.
    await expect(renewFreeholdClaims(deps)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(registry.counters).toMatchObject({
      renewed: FREEHOLD_CLAIM_RENEW_CHUNK + 1,
      renewPasses: 2,
      renewPassesSkipped: 0,
    });
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

  it('pins the decision that production binds no onLost: the realm renewer passes none', () => {
    // Comments stripped: the wiring's own "NO onLost, by decision" note must
    // not count as a binding.
    const source = stripComments(readFileSync('server/freehold_persist_wiring.ts', 'utf8'));
    const definition = 'export function renewGameFreeholdClaims(';
    const bodyOf = (text: string): string => {
      const start = text.indexOf(definition);
      if (start < 0) return '';
      const end = text.indexOf('\n}\n', start);
      return end < 0 ? '' : text.slice(start, end);
    };
    const bindsOnLost = (body: string): boolean => /\bonLost\b/.test(body);
    const body = bodyOf(source);
    // Positive control: the body was found, whole, and it is the renewer call.
    expect(body).toContain('return renewFreeholdClaims({');
    expect(body).toContain('wanted: (claim, nowMs) =>');
    expect(body).toContain('warn: (message) => console.warn(message),');
    expect(bindsOnLost(body)).toBe(false);
    // The mutant this pin exists for, a hook bound inside that very call, is
    // seen through the same extraction.
    const at = source.indexOf(definition);
    const mutant =
      source.slice(0, at) +
      source
        .slice(at)
        .replace(
          '    wanted: (claim, nowMs) =>',
          '    onLost: () => {},\n    wanted: (claim, nowMs) =>',
        );
    expect(mutant).not.toBe(source);
    expect(bindsOnLost(bodyOf(mutant))).toBe(true);
  });

  it('pins every mention of the renewer by name in server/ to its reviewed per-file count: a new call, alias, binding or re-export fails until reviewed', () => {
    // A second call site elsewhere could bind a hook the pin above never
    // reads, and no list of call shapes holds: an optional call, a
    // parenthesized callee, `.call`, `.bind` (the zero-argument shape the
    // periodic flush takes, a hook bound in its arguments), an alias, a
    // destructure, a string key, a re-export with no `from` all get past one.
    // So this counts WHOLE TOKENS, whatever surrounds them, per file, read off
    // the reviewed tree, in text whose \u escapes are decoded first (an
    // escaped name is the same identifier, or the same string). Two counts:
    // the RAW one, every mention in the file, comments included, so no
    // mention a comment stripper misreads can hide (a `//` inside a string or
    // a regex earlier on the line makes the stripper delete the rest of that
    // line); and the comment-stripped one, with how many of those are the
    // name as a quoted string. Any new mention anywhere changes a count.
    const decodeEscapes = (text: string): string =>
      text.replace(/\\u(?:\{([0-9a-fA-F]+)\}|([0-9a-fA-F]{4}))/g, (written, braced, four) => {
        const code = Number.parseInt(braced ?? four, 16);
        return code <= 0x10ffff ? String.fromCodePoint(code) : written;
      });
    const NAME = /\brenewFreeholdClaims\b/g;
    const QUOTED = /(['"`])renewFreeholdClaims\1/g;
    // Each source is decoded and comment-stripped ONCE, here; every count
    // below reads these two texts (server/game.ts alone is a monolith).
    const textsOf = (source: string) => ({
      raw: decodeEscapes(source),
      stripped: decodeEscapes(stripComments(source)),
    });
    type Texts = ReturnType<typeof textsOf>;
    const mentionsIn = ({ raw, stripped }: Texts) => ({
      raw: raw.match(NAME)?.length ?? 0,
      tokens: stripped.match(NAME)?.length ?? 0,
      strings: stripped.match(QUOTED)?.length ?? 0,
    });
    const files = tsFilesUnder('server').map(({ file, full }) => {
      const source = readFileSync(full, 'utf8');
      return { file: `server/${file}`, source, texts: textsOf(source) };
    });
    expect(files.length).toBeGreaterThan(100);
    const fileOf = (file: string) => {
      const found = files.find((f) => f.file === file);
      if (!found) throw new Error(`no ${file} under server/`);
      return found;
    };
    const sourceOf = (file: string): string => fileOf(file).source;
    const mentioned = Object.fromEntries(
      files
        .map(({ file, texts }) => [file, mentionsIn(texts)] as const)
        .filter(([, counts]) => counts.raw > 0),
    );
    expect(mentioned).toEqual({
      // The definition, and two comments naming it (the header and its doc).
      'server/freehold_claim_registry.ts': { raw: 3, tokens: 1, strings: 0 },
      // Its import and its one call (the case above: that call binds no
      // onLost), and one doc comment naming it.
      'server/freehold_persist_wiring.ts': { raw: 3, tokens: 2, strings: 0 },
      // The flush member's key, bound to the wiring's renewGameFreeholdClaims.
      'server/game.ts': { raw: 1, tokens: 1, strings: 0 },
      // The flush member in the interface, and its name in the write list.
      'server/periodic_save_flush.ts': { raw: 2, tokens: 2, strings: 1 },
    });
    // The wiring's two are exactly its unaliased import and the call the
    // case above reads.
    expect(
      stripComments(sourceOf('server/freehold_persist_wiring.ts'))
        .split('\n')
        .filter((line) => /\brenewFreeholdClaims\b/.test(line))
        .map((line) => line.trim()),
    ).toEqual([
      "import { type FreeholdClaimRegistry, renewFreeholdClaims } from './freehold_claim_registry';",
      'return renewFreeholdClaims({',
    ]);

    // Negative controls, each put through the same counter on top of a real
    // file: every shape a list of matchers let past moves the raw and
    // stripped token counts (and the quoted ones the string count too), an
    // escaped name included; a mention in a comment, or behind a `//` in a
    // string or a regex, moves the raw count alone; and a longer name that
    // contains this one, at either end, moves nothing.
    const base = sourceOf('server/game.ts');
    const baseTexts = fileOf('server/game.ts').texts;
    // The baseline counts once, not once per shape.
    const before = mentionsIn(baseTexts);
    const delta = (added: string) => {
      const after = mentionsIn(textsOf(`${base}\n${added}\n`));
      return {
        raw: after.raw - before.raw,
        tokens: after.tokens - before.tokens,
        strings: after.strings - before.strings,
      };
    };
    const one = { raw: 1, tokens: 1, strings: 0 };
    const quoted = { raw: 1, tokens: 1, strings: 1 };
    const rawOnly = { raw: 1, tokens: 0, strings: 0 };
    const none = { raw: 0, tokens: 0, strings: 0 };
    for (const [shape, moved] of [
      ['void renewFreeholdClaims?.(d);', one],
      ['void (renewFreeholdClaims)(d);', one],
      ['void renewFreeholdClaims.call(null, d);', one],
      ['const flush = renewFreeholdClaims.bind(null, { ...d, onLost: () => {} });', one],
      ['const r = renewFreeholdClaims;', one],
      ['const { renewFreeholdClaims: r } = reg;', one],
      ["void reg['renewFreeholdClaims'](d);", quoted],
      ['void reg["renewFreeholdClaims"](d);', quoted],
      ['void reg[`renewFreeholdClaims`](d);', quoted],
      ["const { renewFreeholdClaims: r } = await import('./freehold_claim_registry');", one],
      ['export { renewFreeholdClaims as renew };', one],
      ["import Def, { renewFreeholdClaims as r } from './freehold_claim_registry';", one],
      ['void renew\\u0046reeholdClaims(d);', one],
      ['void renew\\u{46}reeholdClaims(d);', one],
      ["void reg['renew\\u0046reeholdClaims'](d);", quoted],
      ['// renewFreeholdClaims(d);', rawOnly],
      ["const u = 'a//b'; const f = renewFreeholdClaims.bind(null, d);", rawOnly],
      ['const re = /a\\/\\//; const f = renewFreeholdClaims.bind(null, d);', rawOnly],
      ['void renewFreeholdClaimsLater(d);', none],
      ['void xrenewFreeholdClaims(d);', none],
    ] as const) {
      expect(delta(shape), shape).toEqual(moved);
    }

    // A star re-export carries every name of the registry without writing
    // one, and a namespace object reaches the renewer by a computed key
    // (`reg['renew' + 'FreeholdClaims'](d)`) that no count above sees. So no
    // server file star-re-exports the registry, and its namespace forms (a
    // static `import * as`, a dynamic import(), a require()) are pinned to
    // their reviewed count across server/: none. Both read the decoded text
    // raw AND comment-stripped, so neither a comment that hides a `;` nor a
    // `//` in a string that hides the rest of a line gets one past. Its
    // LIMITS: the NAMESPACE matcher needs `import` or `require` directly
    // before the `(` and the whole path as one literal, so a require function
    // minted by createRequire(import.meta.url), a computed path
    // ('./freehold_claim_' + 'registry') and a template path with a `${}` in
    // it all get past it. They are pinned below as known escapes that move
    // nothing, so a stricter matcher has to update them consciously.
    const SPEC = String.raw`['"\x60][^'"\x60\n]*freehold_claim_registry(?:\.[cm]?[jt]s)?['"\x60]`;
    const STAR = new RegExp(String.raw`\bexport\s*(?:type\s*)?\*[^;]*?\bfrom\s*${SPEC}`, 'g');
    const NAMESPACE = new RegExp(
      String.raw`\bimport\b[^;]*?\*\s*as\b[^;]*?\bfrom\s*${SPEC}|\b(?:import|require)\s*\(\s*${SPEC}`,
      'g',
    );
    const registryRefsIn = ({ raw, stripped }: Texts) => {
      const count = (re: RegExp) =>
        Math.max(raw.match(re)?.length ?? 0, stripped.match(re)?.length ?? 0);
      return { star: count(STAR), namespace: count(NAMESPACE) };
    };
    const reaching = files
      .map(({ file, texts }) => ({ file, ...registryRefsIn(texts) }))
      .filter(({ star, namespace }) => star > 0 || namespace > 0);
    expect(reaching).toEqual([]);
    // The imports of the registry the matchers must NOT count are there to be
    // read: the realm's own named imports of it.
    const refsBefore = registryRefsIn(baseTexts);
    expect(refsBefore).toEqual({ star: 0, namespace: 0 });
    expect(sourceOf('server/game.ts')).toContain(
      "import { createFreeholdClaimRegistry } from './freehold_claim_registry';",
    );

    // Negative controls, through the same matchers on top of the same file.
    const refsDelta = (added: string) => {
      const after = registryRefsIn(textsOf(`${base}\n${added}\n`));
      return {
        star: after.star - refsBefore.star,
        namespace: after.namespace - refsBefore.namespace,
      };
    };
    const star = { star: 1, namespace: 0 };
    const namespace = { star: 0, namespace: 1 };
    const neither = { star: 0, namespace: 0 };
    for (const [shape, moved] of [
      ["export * from './freehold_claim_registry';", star],
      ["export * as claims from './freehold_claim_registry';", star],
      ['export*from"./freehold_claim_registry.ts";', star],
      ["export type * from './freehold_claim_registry';", star],
      [
        "import * as reg from './freehold_claim_registry';\nvoid reg['renew' + 'FreeholdClaims'](d);",
        namespace,
      ],
      ["import Def, * as reg from '../server/freehold_claim_registry';", namespace],
      ["const reg = await import('./freehold_claim_registry');", namespace],
      ['const reg = await import(`./freehold_claim_registry.js`);', namespace],
      ["const reg = require('./freehold_claim_registry');", namespace],
      ["import reg = require('./freehold_claim_registry');", namespace],
      ["import * as reg from './freehold_claim_\\u0072egistry';", namespace],
      ["const u = 'a//b'; const reg = await import('./freehold_claim_registry');", namespace],
      ["import /* ; */ * as reg from './freehold_claim_registry';", namespace],
      ["import { renewFreeholdClaims } from './freehold_claim_registry';", neither],
      ["import type { FreeholdClaimRegistry } from './freehold_claim_registry';", neither],
      ["import * as db from './freehold_claim_db';", neither],
      ["export * from './freehold_claim_db';", neither],
      ["import * as reg from './freehold_claim_registry_v2';", neither],
    ] as const) {
      expect(refsDelta(shape), shape).toEqual(moved);
    }
    // The known escapes named above: each reaches the registry's namespace
    // object today and moves nothing.
    for (const shape of [
      "const req = createRequire(import.meta.url);\nconst reg = req('./freehold_claim_registry');",
      "const reg = await import('./freehold_claim_' + 'registry');",
      `const part = 'registry';\nconst reg = await import(\`./freehold_claim_\${part}\`);`,
    ]) {
      expect(refsDelta(shape), shape).toEqual(neither);
    }
    // The computed key the namespace control calls through is the shape the
    // name counts cannot see: it moves none of them.
    expect(delta("void reg['renew' + 'FreeholdClaims'](d);")).toEqual(none);
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

  it('rolls the generation-1 claim back when the plot insert loses its race: nothing recorded', async () => {
    const { write, registry, f } = writerOn([
      {
        match: (t) => t.includes('INSERT INTO freehold_plot_claims'),
        answer: () => [{ plot_id: 'plot:new' }],
      },
      // The plot row was inserted first by someone else: no row comes back,
      // and the diagnosis finds it at revision 5.
      { match: (t) => t.startsWith('INSERT INTO account_freeholds'), answer: () => [] },
      { match: (t) => t.startsWith('SELECT durable_rev'), answer: () => [{ durable_rev: '5' }] },
    ]);
    const result = await write({ ...UPSERT('plot:new'), expectedDurableRev: null });
    expect(result).toEqual({ kind: 'stale', durableRev: '5' });
    // The claim insert beside it rolled back, so no claim names a row this
    // process did not write, and the registry never learned one.
    expect(f.texts()).toContain('ROLLBACK');
    expect(f.texts()).not.toContain('COMMIT');
    expect(registry.forPlot('plot:new')).toBeUndefined();
  });

  it('refuses a first insert whose claim row carries ANOTHER token than its pending one: never adopted', async () => {
    const { write, registry, f } = writerOn([
      // The minted id is already claimed, so the arm asks the token.
      { match: (t) => t.includes('INSERT INTO freehold_plot_claims'), answer: () => [] },
      {
        match: (t) => t.startsWith('SELECT write_token'),
        answer: () => [{ write_token: 'b'.repeat(32) }],
      },
      { match: (t) => t.startsWith('SELECT durable_rev'), answer: () => [{ durable_rev: '1' }] },
      {
        match: (t) => t.startsWith('WITH fence'),
        answer: () => [{ fenced: 1, durable_rev: '2', stamped: 1 }],
      },
    ]);
    registry.notePending({
      plotId: 'plot:new',
      accountId: 7,
      writeToken: 'a'.repeat(32),
      notedAtMs: 0,
    });
    const result = await write({ ...UPSERT('plot:new'), expectedDurableRev: null });
    expect(result).toEqual({
      kind: 'conflict',
      detail: 'the minted plot identity is already claimed',
    });
    expect(registry.counters.selfAdopted).toBe(0);
    expect(f.texts().some((t) => t.startsWith('WITH fence'))).toBe(false);
    expect(registry.forPlot('plot:new')).toBeUndefined();
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

  it('pins the read fence whole: the full fence, locked FOR NO KEY UPDATE, and the text the hook sends', async () => {
    // A trip proves its claim without writing a row version: this lock is the
    // whole of G4 for it. The hook's own suites match the statement by this
    // constant, so only a literal here can catch a mutant of its text.
    const pinned = `SELECT plot_id FROM freehold_plot_claims
 WHERE plot_id = $1 AND holder = $2 AND generation = $3::bigint
   FOR NO KEY UPDATE`;
    expect(FREEHOLD_CLAIM_READ_FENCE_SQL).toBe(pinned);
    // The mutants this pin exists for each really differ from the pinned text,
    // so the toBe above refuses them (the lock removed; weakened to KEY SHARE,
    // which a takeover's NO KEY UPDATE never waits on; the generation dropped
    // from the fence).
    const mutants = [
      pinned.replace('\n   FOR NO KEY UPDATE', ''),
      pinned.replace('FOR NO KEY UPDATE', 'FOR KEY SHARE'),
      pinned.replace(' AND generation = $3::bigint', ''),
    ];
    for (const mutant of mutants) expect(mutant).not.toBe(pinned);
    const { seen, tx } = recordingTx((text) =>
      text === FREEHOLD_CLAIM_READ_FENCE_SQL ? [{ plot_id: 'plot:a' }] : [],
    );
    const fence = { plotId: 'plot:a', holder: HOLDER, generation: '3' };
    expect(await lockFreeholdClaimFenceOnClient(tx as FreeholdQueryable, fence)).toBe(true);
    expect(seen).toEqual([{ text: pinned, values: ['plot:a', HOLDER, '3'] }]);
    // Control: no row under the fence answers fenced.
    const none = recordingTx(() => []);
    expect(await lockFreeholdClaimFenceOnClient(none.tx as FreeholdQueryable, fence)).toBe(false);
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

  it('holds the plot IN FLIGHT from just before its acquire until after it records, and lets go on every ending', async () => {
    // A renew pass about to release this plot's older claim re-checks this
    // mark right before its statement, so it never renames the row this
    // acquire re-stamps.
    let watched: ReturnType<typeof createFreeholdClaimRegistry> | undefined;
    const marks: string[] = [];
    const mark = (at: string) => marks.push(`${at} ${watched?.inFlight('plot:a')}`);
    const t = deps([
      {
        match: (q) => q.startsWith('SELECT plot_id FROM account_freeholds'),
        answer: () => {
          mark('plot id');
          return [{ plot_id: 'plot:a' }];
        },
      },
      {
        match: (q) => q.startsWith('SELECT 1 FROM freehold_plot_claims'),
        answer: () => {
          mark('busy check');
          return [];
        },
      },
      {
        match: (q) => q.startsWith('WITH t AS'),
        answer: () => {
          mark('acquire');
          return [{ generation: '1', inserted: false, fresh: false }];
        },
      },
    ]);
    watched = t.registry;
    t.readRow.mockImplementation(async () => {
      mark('row');
      return { kind: 'absent' as const };
    });
    t.d.onClaimed.mockImplementation(() => mark('record'));
    await readClaimedLoginDurables(t.d, 7);
    expect(marks).toEqual([
      'plot id false',
      'busy check true',
      'acquire true',
      'row true',
      'record true',
    ]);
    expect(t.registry.forPlot('plot:a')).toBeDefined();
    expect(t.registry.inFlight('plot:a')).toBe(false);
    // Every other ending lets go too: busy at the pre-check, contention on the
    // acquire, a failed row read, an unproved COMMIT, the clock-fault retry.
    const endings: { name: string; t: ReturnType<typeof deps> }[] = [
      {
        name: 'busy',
        t: deps([
          plotRow,
          {
            match: (q) => q.startsWith('SELECT 1 FROM freehold_plot_claims'),
            answer: () => [{ x: 1 }],
          },
        ]),
      },
      {
        name: 'contended',
        t: deps([
          plotRow,
          { match: (q) => q.startsWith('WITH t AS'), answer: () => sqlError('55P03') },
        ]),
      },
      { name: 'row read', t: deps([plotRow, acquireRule]) },
      { name: 'unproved commit', t: deps([]) },
      {
        name: 'clock fault',
        t: deps([plotRow, acquireRule], async () => {
          throw sqlError('42P01');
        }),
      },
    ];
    endings[2].t.readRow.mockRejectedValueOnce(sqlError('XX000'));
    endings[3].t.d.pool = fakePool([plotRow, acquireRule], { commitTag: 'ROLLBACK' }).pool;
    for (const ending of endings) {
      await readClaimedLoginDurables(ending.t.d, 7).catch(() => undefined);
      expect(ending.t.registry.inFlight('plot:a'), ending.name).toBe(false);
      expect(ending.t.registry.forPlot('plot:a') !== undefined, ending.name).toBe(
        ending.name === 'clock fault',
      );
    }
  });

  it('lets go of an earlier in-flight mark before taking another, so a second plot half in one read leaks none', async () => {
    // Unreachable through the types: the plot half runs at most once per read.
    // Reached here only by a readHearth that breaks its type and RESOLVES a
    // `threw` answer, so a plot half that failed after taking its mark runs
    // again in the retry.
    let acquires = 0;
    const t = deps(
      [
        plotRow,
        {
          match: (q) => q.startsWith('WITH t AS'),
          answer: () =>
            ++acquires === 1
              ? sqlError('XX000')
              : [{ generation: '1', inserted: true, fresh: true }],
        },
      ],
      async () => ({ kind: 'threw', error: new Error('clock') }) as never,
    );
    await readClaimedLoginDurables(t.d, 7);
    expect(acquires).toBe(2);
    expect(t.registry.forPlot('plot:a')).toMatchObject({ accountId: 7, generation: '1' });
    expect(t.registry.inFlight('plot:a')).toBe(false);
  });

  /** Every statement answers at once, except that checkout number
   *  `hang.checkout` never arrives and a statement `hang.statement` matches
   *  never answers: only the budget's abort can end either. A statement still
   *  out when its client is destroyed rejects, as a dropped socket does.
   *  `stalled` settles once the read is parked on the hang. */
  function hangingPool(
    rules: Rule[],
    hang: { checkout?: number; statement?: (text: string) => boolean },
  ) {
    const seen = { connects: 0, statements: [] as string[] };
    let onStall = () => {};
    const stalled = new Promise<void>((resolve) => {
      onStall = resolve;
    });
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
      connect() {
        seen.connects++;
        if (seen.connects === hang.checkout) {
          onStall();
          return new Promise(() => {});
        }
        let dead: Error | null = null;
        let parked: ((error: Error) => void) | null = null;
        const client = {
          query(text: string, values?: unknown[]) {
            seen.statements.push(text);
            if (dead) return Promise.reject(dead);
            if (hang.statement?.(text)) {
              onStall();
              return new Promise((_resolve, reject) => {
                parked = reject;
              });
            }
            try {
              return Promise.resolve(answerFor(text, values));
            } catch (error) {
              return Promise.reject(error);
            }
          },
          release(error?: unknown) {
            if (!error) return;
            dead = new Error('Connection terminated');
            parked?.(dead);
            parked = null;
          },
          on: () => client,
          removeListener: () => client,
        };
        return Promise.resolve(client);
      },
    } as unknown as FreeholdTxPool;
    return { pool, seen, stalled };
  }

  /** One read on `pool` whose budget the suite aborts by hand: no timer, no
   *  wall clock. The clock read always faults, so a read that gets that far
   *  runs the plot half again in a second transaction. */
  function budgetedRead(pool: FreeholdTxPool, opts: { abortInClock?: boolean } = {}) {
    const registry = createFreeholdClaimRegistry();
    const onClaimed = vi.fn();
    const budget = new AbortController();
    const reason = new Error('login budget spent');
    const budgetSignal = vi.fn(() => budget.signal);
    // 0 at the read's start, 37 at every reading after it: the duration the
    // read books is its end minus its start.
    let clock = 0;
    const nowMs = () => {
      const at = clock;
      clock = 37;
      return at;
    };
    const read = readClaimedLoginDurables(
      {
        pool,
        registry,
        holder: HOLDER,
        realm: 'test',
        ttlSeconds: 90,
        readRow: async () => ({ kind: 'absent' as const }),
        readHearth: async (db) => {
          await db.query('SELECT hearth');
          if (opts.abortInClock) budget.abort(reason);
          throw sqlError('42P01');
        },
        nowMs,
        onClaimed,
        budgetSignal,
      },
      7,
    ).catch((error: unknown) => error);
    return { registry, onClaimed, budgetSignal, read, reason, abort: () => budget.abort(reason) };
  }

  it('bounds the whole read, the clock-fault retry and both checkouts included, by ONE budget', async () => {
    const settle = async (r: ReturnType<typeof budgetedRead>) => {
      const err = await r.read;
      // ONE budget, minted once for the whole read, never one per transaction.
      expect(r.budgetSignal).toHaveBeenCalledTimes(1);
      expect(r.registry.all()).toEqual([]);
      // ONE read booked, at its whole wall time from the nowMs port.
      expect(r.registry.counters).toMatchObject({
        acquired: 0,
        loginReads: 1,
        loginReadMsTotal: 37,
      });
      expect(r.onClaimed).not.toHaveBeenCalled();
      return err;
    };
    // The FIRST checkout never arrives: the budget ends it.
    const first = hangingPool([plotRow, acquireRule], { checkout: 1 });
    const a = budgetedRead(first.pool);
    await first.stalled;
    a.abort();
    expect(await settle(a)).toBe(a.reason);
    expect(first.seen.connects).toBe(1);
    // The clock faults and the RETRY's checkout never arrives: the SAME budget
    // ends it.
    const second = hangingPool([plotRow, acquireRule], { checkout: 2 });
    const b = budgetedRead(second.pool);
    await second.stalled;
    b.abort();
    expect(await settle(b)).toBe(b.reason);
    expect(second.seen.connects).toBe(2);
    // The retry's own statement never answers: the SAME budget cuts it.
    const stuck = hangingPool([plotRow, acquireRule], {
      statement: (q) => q.startsWith('SELECT plot_id FROM account_freeholds'),
    });
    const c = budgetedRead(stuck.pool);
    await stuck.stalled;
    c.abort();
    expect(await settle(c)).toBeInstanceOf(DbTransactionAborted);
    expect(stuck.seen.connects).toBe(2);
    expect(stuck.seen.statements.some((q) => q.startsWith('WITH t AS'))).toBe(false);
    // Spent during the FIRST transaction: the retry is refused before it asks
    // the pool for a client at all.
    const spent = hangingPool([plotRow, acquireRule], {});
    const d = budgetedRead(spent.pool, { abortInClock: true });
    expect(await settle(d)).toBe(d.reason);
    expect(spent.seen.connects).toBe(1);
    expect(spent.seen.statements.filter((q) => q.startsWith('BEGIN'))).toHaveLength(1);
  });

  it('never records a claim whose COMMIT the budget cut: the read throws ambiguous', async () => {
    const { pool, seen, stalled } = hangingPool([plotRow, acquireRule], {
      statement: (q) => q === 'COMMIT',
    });
    const registry = createFreeholdClaimRegistry();
    const onClaimed = vi.fn();
    const budget = new AbortController();
    const read = readClaimedLoginDurables(
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
        budgetSignal: () => budget.signal,
      },
      7,
    ).catch((error: unknown) => error);
    await stalled;
    budget.abort(new Error('login budget spent'));
    expect(await read).toBeInstanceOf(FreeholdCommitAmbiguous);
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
    // intents reachable, and four obligations are owed in that same change.
    expect(
      FREEHOLD_OPERATION_RECONCILERS.size,
      'the first registered housing operation kind must land WITH: (1) an automatic, ' +
        'idempotent retry of the receipt erase for deactivated accounts that still hold ' +
        'receipts (account.ts runs it once and only logs a failure); (2) a retention story ' +
        'for freehold_operation_receipts (keep-forever today, observed only by the growth ' +
        'monitor); (3) a deactivation story for the OPEN intents of a deactivated account ' +
        '(prepare refuses it, but nothing closes the intents it already holds); (4) a plan ' +
        'that refuses a request naming a copy the bags do not hold, before any transaction ' +
        '(the hook never reads the bags; the missing-copy shape is pinned in ' +
        'tests/server/freehold_mutation.pg.test.ts B)',
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
      /** The host's realm drop (draining, or the vault fence) takes every
       *  re-dispatch before the sim sees it. */
      drop?: boolean;
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
    // The advanced flag each re-dispatch carried, and every warn line.
    const hosted: boolean[] = [];
    const warnings: string[] = [];
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
      redispatch: (session, advanced) => {
        hosted.push(advanced);
        if (opts.drop) return 'dropped';
        // The sim asks admission exactly as useHearthKey would.
        redispatched.push(trips.admission(`account:${session.accountId}`, session.pid));
        return undefined;
      },
      mergeReadyAt: (_key, ms) => merges.push(ms),
      ownerOnline: () => opts.online?.() ?? true,
      accountOf: (key) => {
        const match = /^account:([1-9][0-9]*)$/.exec(key);
        return match ? Number(match[1]) : null;
      },
      cooldownMs: 3_600_000,
      nowMs: () => now,
      warn: (message) => warnings.push(message),
    });
    const settle = async () => {
      release();
      for (let i = 0; i < 10; i++) await Promise.resolve();
    };
    return {
      trips,
      sessions,
      settle,
      merges,
      redispatched,
      hosted,
      warnings,
      advance: (ms: number) => (now += ms),
    };
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
    const warnings: string[] = [];
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
      warn: (message) => warnings.push(message),
    });
    trips.admission('account:7', 1);
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(trips.counters.refusedAfterCommit).toBe(1);
    expect(trips.counters.droppedAfterCommit).toBe(0);
    expect(warnings).toEqual([
      'freehold hearth trip committed but the sim refused its re-dispatch',
    ]);
  });

  it('counts a committed advance a realm drop took on its OWN counter, with no warn line (R-2)', async () => {
    const r = tripRig({ drop: true });
    r.trips.admission('account:7', 1);
    await r.settle();
    // The host heard the advance had committed, so its vault drop can answer busy.
    expect(r.hosted).toEqual([true]);
    expect(r.redispatched).toEqual([]);
    expect(r.trips.counters).toMatchObject({
      advanced: 1,
      droppedAfterCommit: 1,
      refusedAfterCommit: 0,
    });
    expect(r.warnings).toEqual([]);
    // The advance stays spent: the durable clock still merges.
    expect(r.merges).toEqual([3_601_000]);
  });

  it('a realm drop under a deny ticket counts nothing and tells the host no advance committed', async () => {
    const r = tripRig({ drop: true, outcome: () => ({ kind: 'failed', error: null }) });
    r.trips.admission('account:7', 1);
    await r.settle();
    expect(r.hosted).toEqual([false]);
    expect(r.trips.counters).toMatchObject({
      failed: 1,
      droppedAfterCommit: 0,
      refusedAfterCommit: 0,
    });
    expect(r.warnings).toEqual([]);
  });

  it('every new refusal prunes the expired ones, so the memo stays bounded without a leave', async () => {
    for (const [elapsed, kept] of [
      [5_000, 1],
      [4_999, 2],
    ] as const) {
      const r = tripRig({ outcome: () => ({ kind: 'failed', error: null }) });
      r.sessions.set(2, { pid: 2, characterId: 11, accountId: 8, leaseNonce: 'n2' });
      r.trips.admission('account:7', 1);
      await r.settle();
      expect(r.trips.refusalMemoSize()).toBe(1);
      // Nothing touches account 7 while its window runs out (or not); then a
      // second account's trip is refused.
      r.advance(elapsed);
      expect(r.trips.admission('account:8', 2)).toBe('pending');
      await r.settle();
      expect(r.trips.counters.failed, `after ${elapsed} ms`).toBe(2);
      expect(r.trips.refusalMemoSize(), `after ${elapsed} ms`).toBe(kept);
      expect(r.trips.admission('account:8', 2)).toBe('deny');
    }
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

  /** The realm's trip host (server/freehold_hearth_trip_host.ts) over fakes:
   *  one keyed session, a loaded entry with no durable row, and a save that
   *  runs the housing hook (a committed advance) or never reaches it (a deny
   *  ticket). Each precheck is set on the live session once the trip is
   *  running, as a jail, a spectate or a dark flip would land in its window.
   *  'vanished' keeps the session for the trip's own same-session check (the
   *  first lookup after the window) and loses it for the re-dispatch's (the
   *  second). */
  type HostGate = 'jailed' | 'dark' | 'spectating' | 'vanished' | 'none';
  type HostDeps = Parameters<typeof createGameFreeholdHearthTrips>[0];
  async function hostTrip(gate: HostGate, advance: boolean) {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const session: {
        pid: number;
        characterId: number;
        accountId: number;
        leaseNonce: string;
        jailed?: unknown;
        spectating?: unknown;
      } = { pid: 1, characterId: 10, accountId: 7, leaseNonce: 'n1' };
      const denied: string[] = [];
      const used: [string, number][] = [];
      let release!: () => void;
      const window = new Promise<void>((r) => {
        release = r;
      });
      let released = false;
      let lookupsAfterWindow = 0;
      const ctx = {
        freeholdsEnabled: true,
        freeholdKeyReadyAtMs: new Map<string, number>(),
        players: new Map(),
      };
      const trips = createGameFreeholdHearthTrips({
        sim: () => ({
          ctx: ctx as unknown as ReturnType<HostDeps['sim']>['ctx'],
          useItem: (itemId: string, pid: number) => used.push([itemId, pid]),
        }),
        sessionForPid: (pid) => {
          if (released && gate === 'vanished' && ++lookupsAfterWindow > 1) return undefined;
          return pid === session.pid ? session : undefined;
        },
        store: {
          authority: () => ({ loaded: true, blocked: false, plotId: 'plot:a', durableRev: null }),
        },
        claims: {
          forAccount: () => undefined,
          holdInFlight: () => () => {},
        } as unknown as HostDeps['claims'],
        pool: fakePool().pool,
        save: async (_session, hook) => {
          await window;
          return advance ? saveThatRuns()(hook) : false;
        },
        sendDenied: (_session, reason) => denied.push(reason),
        draining: () => false,
        vaultLocked: () => false,
        nowMs: () => 1_000,
      });
      expect(trips.admission('account:7', 1)).toBe('pending');
      if (gate === 'jailed') session.jailed = { returnPos: { x: 0, z: 0 }, returnFacing: 0 };
      if (gate === 'spectating') session.spectating = { characterId: 11 };
      if (gate === 'dark') vi.stubEnv('FREEHOLDS_ENABLED', '0');
      released = true;
      release();
      // The fakes settle on microtasks alone, so a bounded drain replaces any
      // real-time poll; the rest of the trip after its finally is synchronous.
      for (let i = 0; i < 100 && trips.inFlight(7); i++) await Promise.resolve();
      expect(trips.inFlight(7), 'the trip settled inside the microtask drain').toBe(false);
      return {
        counters: { ...trips.counters },
        denied,
        used,
        warned: warn.mock.calls.map((call) => String(call[0])),
        readyAtMs: ctx.freeholdKeyReadyAtMs.get('account:7'),
      };
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
  }

  it.each([
    ['jailed', ['busy']],
    ['dark', ['no_freehold']],
    ['spectating', []],
  ] as const)(
    'counts a %s precheck after a COMMITTED advance as a realm drop: the frame answer, no warn line',
    async (gate, answer) => {
      const r = await hostTrip(gate, true);
      expect(r.counters).toMatchObject({
        advanced: 1,
        droppedAfterCommit: 1,
        refusedAfterCommit: 0,
      });
      // The sim never saw the use, the answer is the frame path's own, and the
      // key stays spent: the durable clock still merges.
      expect(r.used).toEqual([]);
      expect(r.denied).toEqual(answer);
      expect(r.warned).toEqual([]);
      expect(r.readyAtMs).toBe(61_000);
    },
  );

  it.each([
    ['jailed', ['busy']],
    ['dark', ['no_freehold']],
    ['spectating', []],
  ] as const)(
    'keeps a %s precheck under a deny ticket as it was: the frame answer, nothing counted',
    async (gate, answer) => {
      const r = await hostTrip(gate, false);
      expect(r.counters).toMatchObject({ notRun: 1, droppedAfterCommit: 0, refusedAfterCommit: 0 });
      expect(r.used).toEqual([]);
      expect(r.denied).toEqual(answer);
      expect(r.warned).toEqual([]);
    },
  );

  it('control: with no precheck the committed re-dispatch reaches the sim, and a sim refusal warns', async () => {
    // The fake sim never asks admission, so the ticket goes unspent: the R-2
    // class the sim owns, the one counter that keeps its warn line.
    const r = await hostTrip('none', true);
    expect(r.used).toEqual([['hearth_key', 1]]);
    expect(r.denied).toEqual([]);
    expect(r.counters).toMatchObject({ advanced: 1, droppedAfterCommit: 0, refusedAfterCommit: 1 });
    expect(r.warned).toEqual([
      'freehold hearth trip committed but the sim refused its re-dispatch',
    ]);
  });

  it('counts a session gone at the re-dispatch after a COMMITTED advance as a realm drop: nothing sent, no warn line', async () => {
    // Unreachable through run() today (nothing asynchronous sits between its
    // same-session check and this lookup), so the fake forces it: the sim
    // never saw the use, so it can never be the sim's refusal.
    const r = await hostTrip('vanished', true);
    expect(r.counters).toMatchObject({
      advanced: 1,
      abandoned: 0,
      droppedAfterCommit: 1,
      refusedAfterCommit: 0,
    });
    expect(r.used).toEqual([]);
    expect(r.denied).toEqual([]);
    expect(r.warned).toEqual([]);
    expect(r.readyAtMs).toBe(61_000);
    // Under a deny ticket the same loss counts nothing.
    const denied = await hostTrip('vanished', false);
    expect(denied.counters).toMatchObject({
      notRun: 1,
      droppedAfterCommit: 0,
      refusedAfterCommit: 0,
    });
    expect(denied.used).toEqual([]);
    expect(denied.denied).toEqual([]);
    expect(denied.warned).toEqual([]);
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

  it('keeps every housing SQL literal in a *_db.ts module, freehold_tx.ts transaction control excepted', () => {
    // server/CLAUDE.md: SQL lives only in db.ts and *_db.ts. The scope is every
    // freehold_*.ts under server/ (at any depth) plus character_save_housing.ts.
    // ONE named exception: server/freehold_tx.ts, the bounded transaction every
    // housing path rides, may carry transaction control and nothing else
    // (BEGIN, SET LOCAL <name>_timeout, COMMIT, ROLLBACK), the precedent of
    // server/db_transaction_deadline.ts, which issues COMMIT and ROLLBACK itself
    // and is no *_db.ts file either.
    const literals = /`(?:[^`\\]|\\[\s\S])*`|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g;
    // Upper case, the single keywords (a lone lower-case "select" or "update"
    // is English). Any case, the multi-token statement shapes, so a lower-case
    // SQL literal is flagged as well. The shapes are deliberately strict: an
    // English sentence that spells one ('select a target from the list') is
    // flagged too (pinned below), no housing logic module carries one today
    // (the empty offender list proves it), and a module that wants one words
    // it otherwise, since a missed lower-case statement is the costlier miss.
    const sql = [
      /\bSELECT\b/,
      /\bUPDATE\b[\s\S]*?\bSET\b/,
      /\bTRUNCATE\b/,
      // The session forms the receipt growth read used before it moved.
      /\bRESET\s+[a-z_]+/,
      /\bSET\s+[a-z_]+\s*(?:=|TO\b)/,
      /\bselect\b[\s\S]*?\bfrom\b/i,
      /\binsert\s+into\b/i,
      /\bupdate\s+[a-z_][\w.]*\s+set\b/i,
      /\bdelete\s+from\b/i,
      /\bfor\s+(?:no\s+key\s+)?update\b/i,
      /\bfor\s+(?:key\s+)?share\b/i,
      /\bset\s+local\b/i,
      /\block\s+table\b/i,
      /\btruncate\s+table\b/i,
      /\b(?:create|alter|drop)\s+(?:(?:or\s+replace|unique|temp|temporary)\s+)*(?:table|index|trigger|function)\b/i,
    ];
    const sqlLiterals = (code: string): string[] =>
      (code.match(literals) ?? []).filter((literal) => sql.some((re) => re.test(literal)));
    const txControl =
      /^(?:\s|;|BEGIN|COMMIT|ROLLBACK|SET LOCAL [a-z_]+_timeout = (?:\$\{[^}]*\}|[0-9]+))*$/;
    const txControlOnly = (literal: string): boolean => txControl.test(literal.slice(1, -1));
    const housing = serverSources().filter((f) => {
      const base = f.name.split('/').pop() ?? '';
      return base.startsWith('freehold_') || base === 'character_save_housing.ts';
    });
    const logic = housing.filter((f) => !f.name.endsWith('_db.ts'));
    // Vacuity floor near the real count, so a walker that lost the modules fails.
    expect(logic.length).toBeGreaterThanOrEqual(33);
    expect(logic.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        'server/character_save_housing.ts',
        'server/freehold_mutation.ts',
        'server/freehold_receipt_growth_monitor.ts',
        'server/freehold_tx.ts',
      ]),
    );
    const offenders: string[] = [];
    let txControlLiterals = 0;
    for (const f of logic) {
      for (const literal of sqlLiterals(f.code)) {
        if (f.name === 'server/freehold_tx.ts' && txControlOnly(literal)) {
          txControlLiterals++;
          continue;
        }
        offenders.push(`${f.name}: ${literal.slice(0, 80)}`);
      }
    }
    expect(offenders).toEqual([]);
    // The exception is reached: the bounds line of freehold_tx.ts is matched
    // and admitted, so the exemption is load-bearing rather than dead.
    expect(txControlLiterals).toBeGreaterThanOrEqual(3);
    // Positive controls: the matcher flags each statement shape and a real
    // *_db.ts module's text, and the exception admits transaction control only.
    // A placeholder as SOURCE text, built so no literal here carries one.
    const hole = (name: string) => `$${'{'}${name}}`;
    for (const synthetic of [
      "'SELECT 1'",
      '`INSERT INTO t (a) VALUES ($1)`',
      '`UPDATE t\n   SET a = $1`',
      "'DELETE FROM t WHERE a = $1'",
      "'x FOR SHARE'",
      "'x FOR UPDATE'",
      "'x FOR NO KEY UPDATE'",
      `\`SET LOCAL statement_timeout = ${hole('ms')}\``,
      "'RESET statement_timeout'",
      `\`SET statement_timeout = ${hole('ms')}\``,
      // Lower case, every multi-token shape.
      "'select plot_id from freehold_plot_claims'",
      '`insert into t (a) values ($1)`',
      '`update account_freeholds\n   set durable_rev = $1`',
      "'delete from t where a = $1'",
      "'x for update'",
      "'x for no key update'",
      "'x for share'",
      "'x for key share'",
      `\`set local lock_timeout = ${hole('ms')}\``,
      // The table lock, TRUNCATE and the DDL, in either case.
      "'LOCK TABLE t IN EXCLUSIVE MODE'",
      "'lock table t'",
      "'TRUNCATE t'",
      "'truncate table t'",
      "'CREATE TABLE t (a int)'",
      "'create unique index i on t (a)'",
      "'alter table t add column b int'",
      "'drop trigger g on t'",
      "'CREATE OR REPLACE FUNCTION f() RETURNS trigger'",
      // Each temporary modifier on its own, so neither spelling is dead.
      "'CREATE TEMP TABLE t (a int)'",
      "'create temporary table t (a int)'",
    ]) {
      expect(sqlLiterals(`const q = ${synthetic};`), synthetic).toEqual([synthetic]);
    }
    expect(sqlLiterals("throw new Error('the select was refused');")).toEqual([]);
    // The decision on English, pinned both ways: prose that spells a statement
    // shape is flagged (the strict rule above), prose that only shares a
    // keyword is not.
    expect(sqlLiterals("warn('select a target from the list');")).toEqual([
      "'select a target from the list'",
    ]);
    for (const prose of [
      "'update the plot when it loads'",
      "'drop the stale entry'",
      "'truncate the label'",
      "'a lock on the table'",
      "'waiting for the update'",
      "'created a table of owners'",
      "'set the local clock'",
    ]) {
      expect(sqlLiterals(`warn(${prose});`), prose).toEqual([]);
    }
    const claimDb = housing.find((f) => f.name === 'server/freehold_claim_db.ts');
    expect(sqlLiterals(claimDb?.code ?? '').length).toBeGreaterThan(5);
    expect(txControlOnly(`\`SET LOCAL lock_timeout = ${hole('lock')}; \``)).toBe(true);
    expect(txControlOnly("'BEGIN; COMMIT'")).toBe(true);
    expect(txControlOnly("'SELECT 1'")).toBe(false);
    expect(txControlOnly('`BEGIN; SET LOCAL statement_timeout = 5; SELECT 1`')).toBe(false);
    expect(txControlOnly(`\`SET LOCAL search_path = ${hole('schema')}\``)).toBe(false);
    // The exception stays exact: lower-case transaction control is not admitted.
    expect(txControlOnly("'begin; commit'")).toBe(false);
    expect(txControlOnly("'set local lock_timeout = 5'")).toBe(false);
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
