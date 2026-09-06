// GET /api/freehold (server/freehold_routes.ts): the FREEHOLDS_ENABLED gate
// behind the shared bearer read guard. Scaffolded by `npm run new:endpoint`
// and extended. Pins:
//  - dark (the flag unset, '0', or a truthy-looking near miss): a bearer
//    caller gets the stable freehold.disabled 503 serialized through the
//    pipeline's problem+json envelope (withErrors, the frame the dispatcher
//    mounts outermost), read live per request;
//  - lit ('1'): the same caller gets exactly { enabled: true, freehold: null };
//  - an unauthenticated caller gets the guard's 401 in BOTH states (auth
//    mounts ahead of the handler, so the flag never leaks to an anonymous
//    probe), a banned account 403s, and a read-scoped token is accepted on
//    this GET;
//  - the per-IP housing-read limiter (HOUSING_READ_POLICY) is mounted BY
//    IDENTITY ahead of the bearer guard, and once the bucket is spent the
//    route answers rate_limit.exceeded 429 before the guard's token lookup
//    runs, so a dark realm's constant 503 never buys unbounded database reads;
//    the bucket is housing-only (a spent public-read window leaves this route
//    untouched) and the policy is tier-1 only (an allowed request records
//    nothing on the pg tier-2 store, with a 'global' policy through the same
//    store as the positive control).
process.env.DATABASE_URL ||= 'postgres://test:test@127.0.0.1:5433/wocc_new_endpoint_scaffold';

import type * as http from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetFreeholdDbForTests,
  routes,
  setFreeholdDbForTests,
} from '../../server/freehold_routes';
import { compose } from '../../server/http/compose';
import { PUBLIC_READ_POLICY, rateLimit } from '../../server/http/middleware/rate_limit';
import { withErrors } from '../../server/http/middleware/with_errors';
import type { Ctx, RateLimitOutcome, RateLimitStore } from '../../server/http/types';
import {
  HOUSING_READ_MAX_PER_MINUTE,
  housingReadRateLimited,
  PUBLIC_READ_MAX_PER_MINUTE,
  publicReadRateLimited,
  resetHousingReadRateLimits,
  resetPublicReadRateLimits,
  setRateLimitTier2Store,
} from '../../server/ratelimit';
import { fakeCtx, makeReq } from './helpers';

interface FakeResShape {
  statusCode: number;
  body: string;
  getHeader(name: string): string | number | string[] | undefined;
}

function captured(res: http.ServerResponse): {
  status: number;
  body: unknown;
  contentType: unknown;
} {
  const fake = res as unknown as FakeResShape;
  return {
    status: fake.statusCode,
    body: fake.body ? JSON.parse(fake.body) : undefined,
    contentType: fake.getHeader('content-type'),
  };
}

// Full AccountModerationStatus fixtures for the guard's moderation gate.
function okStatus() {
  return {
    locked: false,
    banned: false,
    suspendedUntil: null,
    reason: '',
    message: '',
    chatMutedUntil: null,
    chatStrikes: 0,
  };
}
function bannedStatus() {
  return {
    locked: true,
    banned: true,
    suspendedUntil: null,
    reason: 'banned',
    message: 'This account has been banned.',
    chatMutedUntil: null,
    chatStrikes: 0,
  };
}

const VALID_BEARER = `Bearer ${'a'.repeat(64)}`;

/** Run the one route through the same outermost error frame the dispatcher
 *  mounts, then its own middleware, then the handler: a thrown HttpError
 *  serializes exactly as a live /api request would see it. */
function runRoute(ctx: Ctx): Promise<void> {
  const route = routes[0];
  return compose([withErrors(), ...(route.middleware ?? [])])(ctx, async () => {
    await route.handler(ctx);
  });
}

function bearerCtx(): Ctx {
  return fakeCtx({
    method: 'GET',
    url: '/api/freehold',
    headers: { authorization: VALID_BEARER },
  });
}

function authenticatedDb(scope: 'full' | 'read' = 'full'): void {
  setFreeholdDbForTests({
    accountAndScopeForToken: async () => ({ accountId: 1, scope }),
    moderationStatusForAccount: async () => okStatus(),
  });
}

// The housing-read bucket is module memory (and the public-read bucket the
// isolation arm spends is shared with every other mount of that policy);
// reset both on both sides so a spent window never leaks between tests (the
// tests/server/deeds.test.ts idiom). The tier-2 store slot is cleared too, so
// the recording store one arm wires never outlives it.
beforeEach(() => {
  resetHousingReadRateLimits();
  resetPublicReadRateLimits();
});

afterEach(() => {
  resetFreeholdDbForTests();
  resetHousingReadRateLimits();
  resetPublicReadRateLimits();
  setRateLimitTier2Store(null);
  vi.unstubAllEnvs();
});

/** A tier-2 store that allows everything and counts what it was asked to record. */
function recordingStore(): RateLimitStore & { hits: number } {
  const outcome: RateLimitOutcome = { allowed: true, remaining: 1, resetSeconds: 0 };
  const store = {
    hits: 0,
    async hit() {
      store.hits++;
      return outcome;
    },
    async reset() {},
  };
  return store;
}

/** The rateLimit factory tags its middleware with the policy name, so a mount
 *  is pinned by identity rather than by scanning source text. */
function policyNameOf(mw: unknown): string | undefined {
  return (mw as { rateLimitPolicyName?: string }).rateLimitPolicyName;
}

describe('GET /api/freehold: the route table', () => {
  it('is exactly one registry-only bearer GET on the api surface', () => {
    expect(routes.map((r) => `${r.method} ${r.path} ${r.surface}`)).toEqual([
      'GET /api/freehold api',
    ]);
    expect(routes[0].middleware).toHaveLength(2);
  });

  it('mounts the housing-read limiter BY IDENTITY, ahead of the bearer guard', () => {
    const [limiter, guard] = routes[0].middleware ?? [];
    // The canonical onion order (tests/server/http/onion_order.test.ts): the
    // ip-keyed limiter runs before auth, which is what keeps the guard's two
    // Postgres reads behind the bucket instead of in front of it. The policy
    // is the dedicated housing one, never the shared public-read mount.
    expect(policyNameOf(limiter)).toBe('housing_read');
    expect(policyNameOf(guard)).toBeUndefined();
  });
});

describe('GET /api/freehold: the housing-read budget', () => {
  it('answers rate_limit.exceeded 429 once the per-IP window is spent, before the token lookup', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', undefined);
    const tokenLookup = vi.fn(async () => ({ accountId: 1, scope: 'full' as const }));
    const moderationLookup = vi.fn(async () => okStatus());
    setFreeholdDbForTests({
      accountAndScopeForToken: tokenLookup,
      moderationStatusForAccount: moderationLookup,
    });
    // Spend the housing bucket for this IP directly on the tier-1 limiter (the
    // fakeCtx request carries the same 127.0.0.1 remote address).
    for (let i = 0; i < HOUSING_READ_MAX_PER_MINUTE; i++) {
      housingReadRateLimited(makeReq({ method: 'GET', url: '/api/freehold' }));
    }
    const ctx = bearerCtx();
    await runRoute(ctx);
    const out = captured(ctx.res);
    expect(out.status).toBe(429);
    expect(out.contentType).toBe('application/problem+json');
    expect(out.body).toMatchObject({
      type: 'about:blank',
      status: 429,
      code: 'rate_limit.exceeded',
      instance: '/api/freehold',
    });
    // The whole point of the mount order: a spent window costs the database
    // nothing, neither the token read nor the moderation read.
    expect(tokenLookup).not.toHaveBeenCalled();
    expect(moderationLookup).not.toHaveBeenCalled();
  });

  it('serves the request under the window and pays the guard reads once each', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', undefined);
    const tokenLookup = vi.fn(async () => ({ accountId: 1, scope: 'full' as const }));
    const moderationLookup = vi.fn(async () => okStatus());
    setFreeholdDbForTests({
      accountAndScopeForToken: tokenLookup,
      moderationStatusForAccount: moderationLookup,
    });
    const ctx = bearerCtx();
    await runRoute(ctx);
    expect(captured(ctx.res).status).toBe(503);
    expect(tokenLookup).toHaveBeenCalledTimes(1);
    expect(moderationLookup).toHaveBeenCalledTimes(1);
  });

  it('the bucket is housing-only: a spent public-read window leaves this route untouched', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    authenticatedDb();
    // Exhaust the SHARED public-read bucket for this IP (the map, asset and
    // deeds reads' window); a NAT-mate browsing those must not spend the
    // housing budget for every account behind the address.
    for (let i = 0; i < PUBLIC_READ_MAX_PER_MINUTE; i++) {
      publicReadRateLimited(makeReq({ method: 'GET', url: '/api/maps/public' }));
    }
    expect(publicReadRateLimited(makeReq({ method: 'GET', url: '/api/maps/public' })).allowed).toBe(
      false,
    );
    const ctx = bearerCtx();
    await runRoute(ctx);
    expect(captured(ctx.res)).toMatchObject({ status: 200, body: { enabled: true } });
  });

  it('is tier-1 only: an allowed request records nothing on the pg tier-2 store', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', undefined);
    authenticatedDb();
    const store = recordingStore();
    setRateLimitTier2Store(store);
    // Positive control FIRST: a 'global' policy through the same store
    // records a hit, proving the store is wired (a zero against an unwired
    // store would be vacuous).
    await rateLimit(PUBLIC_READ_POLICY)(
      fakeCtx({ method: 'GET', url: '/api/maps/public' }),
      async () => {},
    );
    const wired = store.hits;
    expect(wired).toBeGreaterThan(0);
    const ctx = bearerCtx();
    await runRoute(ctx);
    // The request went through (the dark 503 is the handler's answer, so the
    // limiter allowed it) and the pg store never saw it: a bound mounted to
    // make a dark realm cheaper must not add a database write per request.
    expect(captured(ctx.res).status).toBe(503);
    expect(store.hits).toBe(wired);
  });
});

describe('GET /api/freehold: dark realm (FREEHOLDS_ENABLED not exactly 1)', () => {
  it.each([
    ['unset', undefined],
    ['0', '0'],
    ['true', 'true'],
    [' 1', ' 1'],
  ])('answers freehold.disabled 503 in the problem+json envelope (flag %s)', async (_, value) => {
    vi.stubEnv('FREEHOLDS_ENABLED', value);
    authenticatedDb();
    const ctx = bearerCtx();
    await runRoute(ctx);
    const out = captured(ctx.res);
    expect(out.status).toBe(503);
    expect(out.contentType).toBe('application/problem+json');
    expect(out.body).toMatchObject({
      type: 'about:blank',
      status: 503,
      code: 'freehold.disabled',
      instance: '/api/freehold',
    });
    // The exact envelope key set (the lit case pins its body the same way):
    // the pipeline's six problem+json fields and nothing housing-specific
    // beside them. The server emits the CODE, never English housing prose
    // (the client localizes the code); the title and detail are the
    // pipeline's generic status reason.
    expect(Object.keys(out.body as object).sort()).toEqual([
      'code',
      'detail',
      'instance',
      'status',
      'title',
      'type',
    ]);
    expect(JSON.stringify(out.body)).not.toMatch(/not enabled/i);
  });

  it('still refuses an unauthenticated caller with the guard 401, not the flag', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', undefined);
    setFreeholdDbForTests({ accountAndScopeForToken: async () => null });
    const ctx = fakeCtx({ method: 'GET', url: '/api/freehold' });
    await runRoute(ctx);
    expect(captured(ctx.res)).toMatchObject({
      status: 401,
      body: { error: 'not authenticated', code: 'auth.required' },
    });
  });
});

describe('GET /api/freehold: lit realm (FREEHOLDS_ENABLED=1)', () => {
  it('answers exactly { enabled: true, freehold: null } for an authenticated caller', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    authenticatedDb();
    const ctx = bearerCtx();
    await runRoute(ctx);
    expect(captured(ctx.res)).toMatchObject({
      status: 200,
      body: { enabled: true, freehold: null },
    });
    expect(Object.keys(captured(ctx.res).body as object).sort()).toEqual(['enabled', 'freehold']);
  });

  it('accepts a read-scoped token on this GET (createReadGuard, not the mutation guard)', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    authenticatedDb('read');
    const ctx = bearerCtx();
    await runRoute(ctx);
    expect(captured(ctx.res).status).toBe(200);
  });

  it('reads the flag live per request: the same module answers both states', async () => {
    authenticatedDb();
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    const lit = bearerCtx();
    await runRoute(lit);
    expect(captured(lit.res).status).toBe(200);
    vi.stubEnv('FREEHOLDS_ENABLED', '0');
    const dark = bearerCtx();
    await runRoute(dark);
    expect(captured(dark.res)).toMatchObject({ status: 503, body: { code: 'freehold.disabled' } });
  });

  it('401s without a bearer token', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    setFreeholdDbForTests({ accountAndScopeForToken: async () => null });
    const ctx = fakeCtx({ method: 'GET', url: '/api/freehold' });
    await runRoute(ctx);
    expect(captured(ctx.res)).toMatchObject({
      status: 401,
      body: { error: 'not authenticated', code: 'auth.required' },
    });
  });

  it('403s a banned account (moderation gate)', async () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    setFreeholdDbForTests({
      accountAndScopeForToken: async () => ({ accountId: 1, scope: 'full' }),
      moderationStatusForAccount: async () => bannedStatus(),
    });
    const ctx = bearerCtx();
    await runRoute(ctx);
    expect(captured(ctx.res).status).toBe(403);
  });
});
