// Freeholds (player housing) authenticated API surface: the caller's housing
// status read. Scaffolded by `npm run new:endpoint` (the authenticated rung:
// the shared bearer read guard, moderation-gated and scope-enforced) and then
// adapted to the FREEHOLDS_ENABLED gate.
//
// Rung: AUTHENTICATED (bearer required). Auth runs ahead of the FLAG CHECK,
// and behind the housing IP limiter this route mounts first (the onion order
// below), so an unauthenticated caller gets the pipeline's auth
// refusal whether or not the realm is lit; a bearer caller on a dark realm
// then gets the stable freehold.disabled 503 through the pipeline's error
// path (the steam.disabled precedent, server/steam/routes.ts). The public
// descriptor (myFreehold) lands with its producer later, so the lit body
// carries `freehold: null` until then. The read takes no input today;
// freehold.invalid_input (scaffolded beside it in server/http/error_codes.ts)
// stays reserved for its future input validation. Registry-only: born after
// the ladder migration, so it has no legacy twin (server/http/CLAUDE.md), and
// under the API_DISPATCH=legacy rollback arm the path 404s instead of
// answering freehold.disabled.
//
// The read is rate-limited on its OWN per-IP housing bucket
// (HOUSING_READ_POLICY over housingReadRateLimited, server/ratelimit.ts),
// mounted AHEAD of the bearer guard in the canonical onion order (ip-limit
// before auth, tests/server/http/onion_order.test.ts). That placement is what
// bounds the cost of a dark realm: the guard's two uncached Postgres reads
// (token, then moderation status) run per request to produce a constant 503,
// and a limiter mounted behind the guard would meter nothing the database had
// not already paid. Auth stays ahead of the flag check on purpose (the flag
// never leaks to an anonymous probe), so the bound is the limiter, not a
// reorder. Two deliberate choices in that policy: the bucket is housing-only
// (never the shared public-read map, so a NAT-mate pulling assets or browsing
// the map cannot spend this route's budget for every account behind the IP),
// and it is TIER-1 ONLY (the WOC_MARKET_READ_POLICY opt-out), so an allowed
// request pays no pg rate_limits UPSERT: a bound mounted to make a dark realm
// cheaper must never add a database write the unmetered route did not pay.
// The cost of the ip-before-auth order, stated plainly: the bucket is keyed on
// the IP alone, so unauthenticated probes that only ever 401 still spend it,
// and one prober can exhaust the window for every account behind that IP. That
// is the accepted trade while the route returns nothing but a status flag; a
// later housing endpoint that returns something worth denying (15, 30a) must
// re-decide the key class rather than copy this mount order.

import { accountAndScopeForToken, moderationStatusForAccount } from './db';
import { freeholdsEnabled } from './freehold_config';
import { HttpError } from './http/errors';
import { type BearerActiveGuardDb, createReadGuard } from './http/middleware/bearer_active_guard';
import { HOUSING_READ_POLICY, rateLimit } from './http/middleware/rate_limit';
import type { Ctx, RouteDef } from './http/types';
import { json } from './http_util';

// The bearer guard reads its token + moderation status through this seam; the
// production default is the real db.ts reads, so the guard bans/suspensions and
// enforces token scope out of the box. A test swaps in a fake, no Postgres.
export type FreeholdDb = BearerActiveGuardDb;

const REAL_FREEHOLD_DB: FreeholdDb = {
  accountAndScopeForToken,
  moderationStatusForAccount,
};
let freeholdDb: FreeholdDb = REAL_FREEHOLD_DB;

/** Override the db seam with a fake (test-only; merges over the real reads). */
export function setFreeholdDbForTests(overrides: Partial<FreeholdDb>): void {
  freeholdDb = { ...REAL_FREEHOLD_DB, ...overrides };
}

/** Restore the real db seam after an override (test-only). */
export function resetFreeholdDbForTests(): void {
  freeholdDb = REAL_FREEHOLD_DB;
}

// Shared bearer guard (moderation-gated + scope-enforced): accepts a read OR full token.
const authGuard = createReadGuard(() => freeholdDb);

/** The lit status body. `freehold` stays null until the descriptor's producer lands. */
export interface FreeholdStatusBody {
  enabled: true;
  freehold: null;
}

/** GET /api/freehold: authenticated. Dark (FREEHOLDS_ENABLED not exactly '1',
 *  read live per request) answers freehold.disabled 503 through the pipeline's
 *  error path; lit answers the minimal status body. */
async function freeholdHandler(ctx: Ctx): Promise<void> {
  if (!freeholdsEnabled()) throw new HttpError(503, 'freehold.disabled');
  const body: FreeholdStatusBody = { enabled: true, freehold: null };
  json(ctx.res, 200, body);
}

export const routes: RouteDef[] = [
  {
    method: 'GET',
    path: '/api/freehold',
    surface: 'api',
    middleware: [rateLimit(HOUSING_READ_POLICY), authGuard],
    handler: freeholdHandler,
  },
];
