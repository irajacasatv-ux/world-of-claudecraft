// The dev-only loopback bridge for the Freehold development grant (D81),
// exercised against the extracted .mjs directly: the strict flag read, the
// request verdict over the real socket address PLUS the Host header (and a
// present Origin), the plugin's exact affirmative response, its refusals, and
// the vite.config.ts admission by comment-stripped text (the AST half, which
// proves the spread sits inside `plugins`, lives in tests/vite_dev_watch.test.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  classifyFreeholdDevAuthorizationRequest,
  FREEHOLD_DEV_AUTHORIZATION_BODY,
  FREEHOLD_DEV_AUTHORIZATION_PATH,
  FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY,
  type FreeholdDevAuthorizationRequest,
  freeholdDevAuthorizationEnabled,
  freeholdDevAuthorizationPlugin,
} from '../scripts/lib/freehold_dev_authorization.mjs';
import { stripComments } from './helpers/strip_comments';

const LOOPBACK_HOST = '127.0.0.1:5173';

function request(overrides: Partial<FreeholdDevAuthorizationRequest> = {}) {
  return {
    url: FREEHOLD_DEV_AUTHORIZATION_PATH,
    method: 'GET',
    headers: { host: LOOPBACK_HOST },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function serve(
  plugin: ReturnType<typeof freeholdDevAuthorizationPlugin>,
  req: FreeholdDevAuthorizationRequest,
) {
  let handler:
    | ((
        req: FreeholdDevAuthorizationRequest,
        res: { statusCode: number; setHeader(n: string, v: string): void; end(b?: string): void },
        next: () => void,
      ) => void)
    | undefined;
  const use = vi.fn((fn: NonNullable<typeof handler>) => {
    handler = fn;
  });
  plugin.configureServer({ middlewares: { use } });
  const headers = new Map<string, string>();
  const res = {
    statusCode: 0,
    body: undefined as string | undefined,
    ended: false,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    end(body?: string) {
      this.body = body;
      this.ended = true;
    },
  };
  const next = vi.fn();
  if (handler) handler(req, res, next);
  return { res, headers, next, use };
}

// vite.config.ts admits the plugin through this one predicate (pinned below),
// so these strict-string cases are the production admission rule itself.
describe('freeholdDevAuthorizationEnabled reads exactly the string "1"', () => {
  it('admits ALLOW_DEV_COMMANDS=1', () => {
    expect(freeholdDevAuthorizationEnabled({ ALLOW_DEV_COMMANDS: '1' })).toBe(true);
  });

  it.each([
    ['unset', {}],
    ['0', { ALLOW_DEV_COMMANDS: '0' }],
    ['true', { ALLOW_DEV_COMMANDS: 'true' }],
    ['leading space', { ALLOW_DEV_COMMANDS: ' 1' }],
    ['trailing space', { ALLOW_DEV_COMMANDS: '1 ' }],
    ['01', { ALLOW_DEV_COMMANDS: '01' }],
    ['empty', { ALLOW_DEV_COMMANDS: '' }],
  ])('refuses %s', (_label, env) => {
    expect(freeholdDevAuthorizationEnabled(env)).toBe(false);
  });

  it('refuses a missing env object', () => {
    expect(freeholdDevAuthorizationEnabled(undefined)).toBe(false);
  });
});

describe('the request verdict', () => {
  it('pins the path and the one affirmative body', () => {
    expect(FREEHOLD_DEV_AUTHORIZATION_PATH).toBe('/__freehold/dev-authorization');
    expect(FREEHOLD_DEV_AUTHORIZATION_BODY).toBe('{"authorized":true}');
    const parsed = JSON.parse(FREEHOLD_DEV_AUTHORIZATION_BODY) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual(['authorized']);
    expect(parsed.authorized).toBe(true);
  });

  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
    'admits a real loopback socket %s with a loopback Host',
    (remoteAddress) => {
      const req = request({ socket: { remoteAddress } });
      expect(classifyFreeholdDevAuthorizationRequest(req)).toEqual({ kind: 'allow' });
    },
  );

  it.each(['127.0.0.1:5173', 'localhost:5173', '[::1]:5173', 'localhost'])(
    'admits a loopback Host %s from a loopback socket',
    (host) => {
      expect(classifyFreeholdDevAuthorizationRequest(request({ headers: { host } }))).toEqual({
        kind: 'allow',
      });
    },
  );

  it.each([
    ['external', 'evil.example:5173'],
    ['wildcard', '*'],
    ['malformed', 'evil:port:x'],
    ['loopback-prefixed suffix', 'localhost.evil.com:5173'],
    ['unspecified address', '0.0.0.0:5173'],
    ['empty', ''],
  ])('refuses a %s Host header with 404 even from a loopback socket', (_label, host) => {
    const req = request({ headers: { host } });
    expect(classifyFreeholdDevAuthorizationRequest(req)).toMatchObject({
      kind: 'refuse',
      status: 404,
    });
  });

  it('refuses an absent Host header with 404', () => {
    const req = request({ headers: {} });
    expect(classifyFreeholdDevAuthorizationRequest(req)).toMatchObject({
      kind: 'refuse',
      status: 404,
    });
  });

  it.each([
    ['external', '203.0.113.9'],
    ['private LAN', '192.168.1.20'],
    ['missing', undefined],
  ])('refuses a %s socket address with 404 even with a loopback Host', (_label, remoteAddress) => {
    const req = request({ socket: { remoteAddress } });
    expect(classifyFreeholdDevAuthorizationRequest(req)).toMatchObject({
      kind: 'refuse',
      status: 404,
    });
  });

  it('refuses a request with no socket at all', () => {
    expect(classifyFreeholdDevAuthorizationRequest(request({ socket: undefined }))).toMatchObject({
      kind: 'refuse',
      status: 404,
    });
  });

  it.each([
    ['external', 'http://evil.example'],
    ['external on the same port', 'http://evil.example:5173'],
    ['opaque null', 'null'],
    ['empty', ''],
    ['a different loopback spelling', 'http://localhost:5173'],
    ['a non-http scheme', 'capacitor://127.0.0.1:5173'],
  ])('refuses a forged %s Origin with 404', (_label, origin) => {
    const req = request({ headers: { host: LOOPBACK_HOST, origin } });
    expect(classifyFreeholdDevAuthorizationRequest(req)).toMatchObject({
      kind: 'refuse',
      status: 404,
    });
  });

  it('admits the same loopback Origin, and a request that sends none', () => {
    const same = request({ headers: { host: LOOPBACK_HOST, origin: `http://${LOOPBACK_HOST}` } });
    expect(classifyFreeholdDevAuthorizationRequest(same)).toEqual({ kind: 'allow' });
    expect(classifyFreeholdDevAuthorizationRequest(request())).toEqual({ kind: 'allow' });
  });

  it.each(['POST', 'HEAD', 'OPTIONS', 'get'])('refuses method %s with 404', (method) => {
    const req = request({ method });
    expect(classifyFreeholdDevAuthorizationRequest(req)).toEqual({
      kind: 'refuse',
      status: 404,
      reason: 'GET only',
    });
  });

  it.each([
    `${FREEHOLD_DEV_AUTHORIZATION_PATH}?x=1`,
    `${FREEHOLD_DEV_AUTHORIZATION_PATH}?`,
    `${FREEHOLD_DEV_AUTHORIZATION_PATH}?tier=2`,
  ])('refuses the exact path with a query string (%s) with 404', (url) => {
    const req = request({ url });
    expect(classifyFreeholdDevAuthorizationRequest(req)).toEqual({
      kind: 'refuse',
      status: 404,
      reason: 'no query string',
    });
  });

  it.each([
    `${FREEHOLD_DEV_AUTHORIZATION_PATH}/`,
    `${FREEHOLD_DEV_AUTHORIZATION_PATH}x`,
    '/__freehold/dev-authorizatio',
    '/__freehold/',
    '/__diagnostics/latest',
    '/',
    '',
  ])('passes any other path (%s) through untouched', (url) => {
    const req = request({ url });
    expect(classifyFreeholdDevAuthorizationRequest(req)).toEqual({ kind: 'pass' });
  });

  it('passes a request with no url through', () => {
    expect(classifyFreeholdDevAuthorizationRequest(request({ url: undefined }))).toEqual({
      kind: 'pass',
    });
    expect(classifyFreeholdDevAuthorizationRequest(undefined)).toEqual({ kind: 'pass' });
  });

  it('reads the first value of a repeated Host or Origin header', () => {
    const allowed = request({
      headers: { host: [LOOPBACK_HOST, 'evil.example'], origin: [`http://${LOOPBACK_HOST}`] },
    });
    expect(classifyFreeholdDevAuthorizationRequest(allowed)).toEqual({ kind: 'allow' });
    const forged = request({ headers: { host: ['evil.example', LOOPBACK_HOST] } });
    expect(classifyFreeholdDevAuthorizationRequest(forged)).toMatchObject({
      kind: 'refuse',
      status: 404,
    });
  });
});

describe('freeholdDevAuthorizationPlugin', () => {
  it('is a dev-server-only plugin', () => {
    const plugin = freeholdDevAuthorizationPlugin({ enabled: true });
    expect(plugin.name).toBe('woc-freehold-dev-authorization');
    expect(plugin.apply).toBe('serve');
    expect(typeof plugin.configureServer).toBe('function');
  });

  it('answers an admitted request with exactly the affirmative JSON, no-store', () => {
    const { res, headers, next } = serve(
      freeholdDevAuthorizationPlugin({ enabled: true }),
      request(),
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
    expect(res.body).toBe('{"authorized":true}');
    expect(headers.get('cache-control')).toBe('no-store');
    expect(headers.get('content-type')).toBe('application/json');
    expect(Object.keys(JSON.parse(res.body ?? '') as object)).toEqual(['authorized']);
  });

  it('answers a failed loopback check with 404, the fixed refusal body, and never the affirmative', () => {
    const { res, headers, next } = serve(
      freeholdDevAuthorizationPlugin({ enabled: true }),
      request({ socket: { remoteAddress: '203.0.113.9' } }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.ended).toBe(true);
    expect(res.body).toBe(FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY);
    expect(res.body).not.toContain('authorized');
    expect(headers.get('cache-control')).toBe('no-store');
    expect(headers.get('content-type')).not.toBe('application/json');
  });

  it('answers a forged Host with 404 and the fixed refusal body', () => {
    const { res, next } = serve(
      freeholdDevAuthorizationPlugin({ enabled: true }),
      request({ headers: { host: 'evil.example:5173' } }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.body).toBe(FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY);
  });

  it('answers a wrong method with 404 and the fixed refusal body', () => {
    const { res, next } = serve(
      freeholdDevAuthorizationPlugin({ enabled: true }),
      request({ method: 'POST' }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.body).toBe(FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY);
  });

  it('gives every refusal the SAME status and body, so no refusal is an existence oracle', () => {
    // A non-loopback socket, a forged Host, a wrong method and a query string
    // are four different reasons; over the wire they are one answer, the one
    // an uninstalled plugin's path gives (404). The reason survives only on
    // the classifier verdict, never in the body.
    const shapes = [
      request({ socket: { remoteAddress: '203.0.113.9' } }),
      request({ headers: { host: 'evil.example:5173' } }),
      request({ method: 'POST' }),
      request({ url: `${FREEHOLD_DEV_AUTHORIZATION_PATH}?tier=2` }),
    ];
    const answers = shapes.map((req) => {
      const { res } = serve(freeholdDevAuthorizationPlugin({ enabled: true }), req);
      return [res.statusCode, res.body] as const;
    });
    for (const answer of answers) expect(answer).toEqual([404, 'not found']);
    expect(new Set(shapes.map((req) => classifyFreeholdDevAuthorizationRequest(req).kind))).toEqual(
      new Set(['refuse']),
    );
    expect(FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY).toBe('not found');
    expect(FREEHOLD_DEV_AUTHORIZATION_REFUSAL_BODY).not.toContain('authorized');
  });

  it('answers the path with a query string with 404', () => {
    const { res, next } = serve(
      freeholdDevAuthorizationPlugin({ enabled: true }),
      request({ url: `${FREEHOLD_DEV_AUTHORIZATION_PATH}?tier=2` }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.body).not.toContain('authorized');
  });

  it('calls next() for every unrelated path and writes nothing', () => {
    for (const url of ['/', '/index.html', `${FREEHOLD_DEV_AUTHORIZATION_PATH}/`, '/api/status']) {
      const { res, headers, next } = serve(
        freeholdDevAuthorizationPlugin({ enabled: true }),
        request({ url }),
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.ended).toBe(false);
      expect(res.statusCode).toBe(0);
      expect(headers.size).toBe(0);
    }
  });

  it.each([
    ['enabled: false', { enabled: false }],
    ['an empty options object', {}],
    ['no options', undefined],
  ])('installs no middleware at all with %s', (_label, options) => {
    const plugin = freeholdDevAuthorizationPlugin(options as { enabled: boolean } | undefined);
    const { use, res, next } = serve(plugin, request());
    expect(use).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.ended).toBe(false);
  });
});

describe('vite.config.ts admits the bridge only through the module flag predicate', () => {
  const config = stripComments(readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8'));
  const flat = config.replace(/\s+/g, ' ');

  it('imports the predicate and the plugin from the extracted module', () => {
    expect(flat).toContain(
      "import { freeholdDevAuthorizationEnabled, freeholdDevAuthorizationPlugin, } from './scripts/lib/freehold_dev_authorization.mjs';",
    );
  });

  it('spreads the plugin in under freeholdDevAuthorizationEnabled(process.env) and nowhere else', () => {
    expect(flat).toContain(
      '...(freeholdDevAuthorizationEnabled(process.env) ? [freeholdDevAuthorizationPlugin({ enabled: true })] : [])',
    );
    // Exactly the import plus the one admission: a second call site (or a
    // bare `freeholdDevAuthorizationPlugin(...)` outside the conditional) is
    // how the endpoint would leak past the flag.
    expect(config.match(/freeholdDevAuthorizationPlugin/g)).toHaveLength(2);
    expect(config.match(/freeholdDevAuthorizationEnabled/g)).toHaveLength(2);
    // One rule, one spelling: the config never re-reads the flag inline, so
    // the strict-string cases above are what protect production admission.
    expect(config).not.toContain('ALLOW_DEV_COMMANDS');
  });

  it('keeps the endpoint path out of the config itself (the module owns it)', () => {
    expect(config).not.toContain('/__freehold/dev-authorization');
  });
});

describe('the bridge stays in the production Docker build context', () => {
  it('rides the scripts/lib/ allowlist', () => {
    const dockerignore = readFileSync(new URL('../.dockerignore', import.meta.url), 'utf8');
    expect(dockerignore).toContain('!scripts/lib/');
  });
});
