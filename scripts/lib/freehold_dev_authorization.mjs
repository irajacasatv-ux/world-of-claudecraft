// Dev-only loopback bridge for the Freehold development grant (D81).
//
// The Vite dev server answers GET /__freehold/dev-authorization with the ONE
// strict affirmative `{"authorized":true}` so the OFFLINE browser Sim can learn
// that the operator started `npm run dev` with ALLOW_DEV_COMMANDS=1 (the same
// env read the realm maps into SimConfig.freeholdDevGrantEnabled in
// server/sim_boot_config.ts). It carries no tier, no receipt and no identity:
// the browser turns the boolean into a nonpersisted Sim permission and nothing
// else, so browser fixture state can never become online ownership.
//
// Admission is two-layered and both layers are pinned: vite.config.ts installs
// the plugin ONLY under the exact flag, and the plugin installs its middleware
// ONLY when constructed with `enabled: true`, so a misuse in either place still
// serves nothing (the path then 404s like any unknown path). A request is
// admitted by the real socket address PLUS the Host header through the
// diagnostics guard (never a header alone), and a present Origin must be the
// same loopback origin. EVERY refusal answers alike, 404 with one fixed body,
// exactly as the path answers when the plugin is not installed: a 403 or a
// 405 would tell a requester that can reach the dev port (`--host`) that the
// endpoint exists, an oracle for ALLOW_DEV_COMMANDS=1 on the machine. The
// verdict keeps a `reason` for the tests; the wire never carries it. Zero
// dependencies beyond that guard. vite.config.ts is outside tsconfig
// `include`, so the typed surface lives in the sibling .d.mts.
import { diagnosticsReadAllowed, sameOrigin } from './diagnostics_capture_guard.mjs';

export const FREEHOLD_DEV_AUTHORIZATION_PATH = '/__freehold/dev-authorization';
export const FREEHOLD_DEV_AUTHORIZATION_BODY = '{"authorized":true}';
// The one body every refusal answers with (404, text/plain), whatever the
// reason: never the reason text, never a hint that the path is served.
export const FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY = 'not found';

// Strictly the string '1', the same read server/freehold_config.ts and
// server/sim_boot_config.ts make: 'true', ' 1', '01' and friends stay off.
export function freeholdDevAuthorizationEnabled(env) {
  return typeof env === 'object' && env !== null && env.ALLOW_DEV_COMMANDS === '1';
}

function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

// Sorts a request into: not ours (`pass`, the middleware calls next()), ours
// but refused (`refuse` with the status the middleware answers), or ours and
// admitted (`allow`). Directly testable without a server.
export function classifyFreeholdDevAuthorizationRequest(req) {
  const url = typeof req?.url === 'string' ? req.url : '';
  const queryAt = url.indexOf('?');
  const pathOnly = queryAt === -1 ? url : url.slice(0, queryAt);
  if (pathOnly !== FREEHOLD_DEV_AUTHORIZATION_PATH) return { kind: 'pass' };
  // The endpoint takes no input at all: a query string is refused outright
  // rather than ignored, so no future parameter can grow on it unnoticed.
  if (queryAt !== -1) return { kind: 'refuse', status: 404, reason: 'no query string' };
  if (req.method !== 'GET') return { kind: 'refuse', status: 404, reason: 'GET only' };
  const host = headerValue(req.headers?.host);
  // The real socket address AND the Host header, the shared diagnostics
  // guard's rule. Its stated bound applies here too: a same-host reverse
  // proxy or an ssh tunnel presents a loopback socket plus a loopback Host
  // and is admitted, exactly as that guard already accepts for its own
  // read endpoint; the operator who terminates such a hop on the dev box
  // has opted in to it.
  if (!diagnosticsReadAllowed(req.socket?.remoteAddress, host)) {
    return { kind: 'refuse', status: 404, reason: 'loopback requests only' };
  }
  const origin = headerValue(req.headers?.origin);
  // A present Origin must be the same loopback origin. An ABSENT Origin is
  // admitted on purpose: a same-origin GET fetch sends none, and that is the
  // only request the bootstrap makes. Nothing is lost by admitting it: the
  // answer is a fixed boolean with no side effect, and a cross-site page
  // that provoked the request could not read it (opaque cross-site) and
  // gained nothing if it could.
  if (origin !== undefined && !sameOrigin(origin, host)) {
    return { kind: 'refuse', status: 404, reason: 'same-origin loopback requests only' };
  }
  return { kind: 'allow' };
}

// `apply: 'serve'` plus configureServer: the middleware exists under `vite`
// (dev) only; `vite preview` never calls configureServer and a production
// build has no server at all.
export function freeholdDevAuthorizationPlugin(options) {
  const enabled = options?.enabled === true;
  return {
    name: 'woc-freehold-dev-authorization',
    apply: 'serve',
    configureServer(server) {
      if (!enabled) return;
      server.middlewares.use((req, res, next) => {
        const verdict = classifyFreeholdDevAuthorizationRequest(req);
        if (verdict.kind === 'pass') {
          next();
          return;
        }
        res.setHeader('Cache-Control', 'no-store');
        if (verdict.kind === 'refuse') {
          res.statusCode = verdict.status;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY);
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(FREEHOLD_DEV_AUTHORIZATION_BODY);
      });
    },
  };
}
