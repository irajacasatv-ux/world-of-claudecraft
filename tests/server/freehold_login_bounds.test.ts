// The housing store's login-path bounds (server/freehold_login_bounds.ts): the
// three constants the handshake's housing read answers to, and the arithmetic
// that makes the whole-preload budget ONE budget per handshake across its two
// asks (ruling (b)'s re-ask), found by the hot-path and database reviews of that
// ruling. Pure, so every edge is driven with literals.

import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS,
  FREEHOLD_PERSIST_LOGIN_BUDGET_MS,
  FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS,
  freeholdPreloadBudgetMs,
  freeholdReaskBudgetMs,
} from '../../server/freehold_login_bounds';
import * as store from '../../server/freehold_persist';

describe('the login-path bounds', () => {
  it('are the literals the rollout contract names', () => {
    expect(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS).toBe(5_000);
    expect(FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS).toBe(2_000);
    expect(FREEHOLD_PERSIST_LOGIN_BUDGET_MS).toBe(10_000);
  });

  it('are the same bindings the store re-exports, so no importer sees a copy', () => {
    expect(store.FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS).toBe(FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS);
    expect(store.FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS).toBe(
      FREEHOLD_PERSIST_LOGIN_STATEMENT_TIMEOUT_MS,
    );
    expect(store.FREEHOLD_PERSIST_LOGIN_BUDGET_MS).toBe(FREEHOLD_PERSIST_LOGIN_BUDGET_MS);
  });
});

describe('freeholdPreloadBudgetMs: one preload can only narrow the budget', () => {
  it.each([
    { requested: undefined, cap: 10_000 },
    { requested: 3_000, cap: 3_000 },
    { requested: 10_000, cap: 10_000 },
    { requested: 50_000, cap: 10_000 },
    { requested: 0, cap: 0 },
    { requested: -5, cap: 0 },
    { requested: Number.NaN, cap: 0 },
    { requested: Number.POSITIVE_INFINITY, cap: 0 },
  ])('asked $requested, runs under $cap', ({ requested, cap }) => {
    expect(freeholdPreloadBudgetMs(requested)).toBe(cap);
  });
});

describe('freeholdReaskBudgetMs: the re-ask gets what the first ask left', () => {
  it.each([
    { firstAskMs: 0, left: 10_000 },
    { firstAskMs: 1, left: 9_999 },
    { firstAskMs: 7_000, left: 3_000 },
    { firstAskMs: 9_999, left: 1 },
    { firstAskMs: 10_000, left: 0 },
    { firstAskMs: 12_000, left: 0 },
    // A clock that ran backwards counts the first ask as free, never more.
    { firstAskMs: -4_000, left: 10_000 },
    { firstAskMs: Number.NaN, left: 0 },
    { firstAskMs: Number.POSITIVE_INFINITY, left: 0 },
    { firstAskMs: Number.NEGATIVE_INFINITY, left: 0 },
  ])('a first ask of $firstAskMs ms leaves $left ms', ({ firstAskMs, left }) => {
    expect(freeholdReaskBudgetMs(firstAskMs)).toBe(left);
  });

  it('keeps the two asks inside one budget for every whole-millisecond first ask', () => {
    for (let firstAskMs = 0; firstAskMs <= 12_000; firstAskMs += 250) {
      const left = freeholdReaskBudgetMs(firstAskMs);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(Math.min(firstAskMs, FREEHOLD_PERSIST_LOGIN_BUDGET_MS) + left).toBe(
        FREEHOLD_PERSIST_LOGIN_BUDGET_MS,
      );
    }
  });
});
