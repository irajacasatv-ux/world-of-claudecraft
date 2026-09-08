// The offline host's half of the Freehold development grant (D81): every arm
// of resolveOfflineFreeholdDevGrant against an injected fetch, the pure
// predicates it composes, the thin browser adapter over the real globals, and
// the src/main.ts bootstrap site (one awaited call before the Sim build; the
// verdict is the only thing that reaches offlineWorldConfig).
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FREEHOLD_DEV_AUTHORIZATION_PATH as BRIDGE_PATH } from '../scripts/lib/freehold_dev_authorization.mjs';
import {
  FREEHOLD_DEV_AUTHORIZATION_PATH,
  FREEHOLD_DEV_AUTHORIZATION_TIMEOUT_MS,
  type FreeholdDevAuthorizationFetch,
  type FreeholdDevAuthorizationFetchInit,
  type FreeholdDevAuthorizationResponse,
  type FreeholdDevBootstrapLocation,
  isFreeholdDevAuthorizationPayload,
  isFreeholdDevBootstrapOrigin,
  isJsonContentType,
  isLoopbackPageHost,
  resolveBrowserFreeholdDevGrant,
  resolveOfflineFreeholdDevGrant,
} from '../src/game/freehold_dev_bootstrap';
import { stripComments } from './helpers/strip_comments';

const LOOPBACK: FreeholdDevBootstrapLocation = {
  protocol: 'http:',
  hostname: 'localhost',
  origin: 'http://localhost:5173',
};
const AFFIRMATIVE = '{"authorized":true}';

function response(
  body: string,
  status = 200,
  contentType: string | null = 'application/json',
): FreeholdDevAuthorizationResponse {
  return {
    status,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    text: async () => body,
  };
}

interface FetchCall {
  input: string;
  init: FreeholdDevAuthorizationFetchInit;
}

function fetchAnswering(
  answer: (init: FreeholdDevAuthorizationFetchInit) => Promise<FreeholdDevAuthorizationResponse>,
) {
  const calls: FetchCall[] = [];
  const fetchImpl: FreeholdDevAuthorizationFetch = (input, init) => {
    calls.push({ input, init });
    return answer(init);
  };
  return { fetchImpl, calls };
}

const fetchReturning = (res: FreeholdDevAuthorizationResponse) => fetchAnswering(async () => res);

function deps(fetchImpl: FreeholdDevAuthorizationFetch, overrides = {}) {
  return { fetch: fetchImpl, location: LOOPBACK, isDev: true, timeoutMs: 200, ...overrides };
}

afterEach(() => vi.unstubAllGlobals());

describe('isLoopbackPageHost', () => {
  it.each(['localhost', '127.0.0.1', '::1', '[::1]', 'LOCALHOST'])('admits %s', (host) => {
    expect(isLoopbackPageHost(host)).toBe(true);
  });

  it.each([
    'localhost.evil.com',
    '192.168.1.2',
    'example.com',
    '127.0.0.1.evil.com',
    'evil.127.0.0.1',
    '0.0.0.0',
    '127.0.0.2',
    '',
  ])('refuses %s', (host) => {
    expect(isLoopbackPageHost(host)).toBe(false);
  });
});

describe('isFreeholdDevBootstrapOrigin', () => {
  it.each([
    ['http loopback', LOOPBACK],
    ['https loopback', { protocol: 'https:', hostname: '127.0.0.1', origin: 'https://127.0.0.1' }],
  ])('admits %s', (_label, location) => {
    expect(isFreeholdDevBootstrapOrigin(location)).toBe(true);
  });

  it.each([
    ['file:', { protocol: 'file:', hostname: '', origin: 'null' }],
    [
      'capacitor:',
      { protocol: 'capacitor:', hostname: 'localhost', origin: 'capacitor://localhost' },
    ],
    [
      'a LAN host',
      { protocol: 'http:', hostname: '192.168.1.2', origin: 'http://192.168.1.2:5173' },
    ],
    [
      'a public host',
      { protocol: 'https:', hostname: 'example.com', origin: 'https://example.com' },
    ],
    [
      'an origin that disagrees with the protocol',
      { protocol: 'http:', hostname: 'localhost', origin: 'https://localhost:5173' },
    ],
  ])('refuses %s', (_label, location) => {
    expect(isFreeholdDevBootstrapOrigin(location)).toBe(false);
  });
});

describe('isFreeholdDevAuthorizationPayload', () => {
  it('admits exactly { authorized: true }', () => {
    expect(isFreeholdDevAuthorizationPayload({ authorized: true })).toBe(true);
    expect(isFreeholdDevAuthorizationPayload(JSON.parse(AFFIRMATIVE))).toBe(true);
  });

  it.each([
    ['an extra field', { authorized: true, tier: 2 }],
    ['a string true', { authorized: 'true' }],
    ['false', { authorized: false }],
    ['a number', { authorized: 1 }],
    ['a differently cased key', { Authorized: true }],
    ['an empty object', {}],
    ['an array', [true]],
    ['null', null],
    ['a bare true', true],
    ['a bare string', 'authorized'],
    ['undefined', undefined],
  ])('refuses %s', (_label, value) => {
    expect(isFreeholdDevAuthorizationPayload(value)).toBe(false);
  });
});

describe('isJsonContentType', () => {
  it.each([
    'application/json',
    'application/json; charset=utf-8',
    'Application/JSON ',
    ' application/json',
  ])('admits %s', (value) => {
    expect(isJsonContentType(value)).toBe(true);
  });

  it.each([
    'text/html; charset=utf-8',
    'text/json',
    'application/jsonx',
    'application/ld+json',
    '',
  ])('refuses %s', (value) => {
    expect(isJsonContentType(value)).toBe(false);
  });

  it('refuses a missing header', () => {
    expect(isJsonContentType(null)).toBe(false);
  });
});

describe('resolveOfflineFreeholdDevGrant', () => {
  it('resolves true on 200 + application/json + the exact payload, asking exactly once', async () => {
    const { fetchImpl, calls } = fetchReturning(response(AFFIRMATIVE));
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.input).toBe('http://localhost:5173/__freehold/dev-authorization');
  });

  it('pins the request: same-origin, no credentials, no cache, no redirect, a signal', async () => {
    const { fetchImpl, calls } = fetchReturning(response(AFFIRMATIVE));
    await resolveOfflineFreeholdDevGrant(deps(fetchImpl));
    const init = calls[0]?.init;
    expect(init?.method).toBe('GET');
    expect(init?.credentials).toBe('omit');
    expect(init?.cache).toBe('no-store');
    expect(init?.redirect).toBe('error');
    expect(init?.mode).toBe('same-origin');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal.aborted).toBe(false);
  });

  it('asks over https too, at the page origin', async () => {
    const { fetchImpl, calls } = fetchReturning(response(AFFIRMATIVE));
    const location = { protocol: 'https:', hostname: '[::1]', origin: 'https://[::1]:5173' };
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl, { location }))).resolves.toBe(true);
    expect(calls[0]?.input).toBe(`https://[::1]:5173${FREEHOLD_DEV_AUTHORIZATION_PATH}`);
  });

  it.each([
    ['an extra field', '{"authorized":true,"tier":2}'],
    ['a string true', '{"authorized":"true"}'],
    ['false', '{"authorized":false}'],
    ['a number', '{"authorized":1}'],
    ['an array', '[true]'],
    ['null', 'null'],
    ['a bare true', 'true'],
    ['an empty object', '{}'],
    ['a receipt-shaped object', '{"authorized":true,"receipt":"abc"}'],
  ])('resolves false on a 200 whose body is %s', async (_label, body) => {
    const { fetchImpl } = fetchReturning(response(body));
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(false);
  });

  it.each([204, 301, 302, 304, 403, 404, 500])(
    'resolves false on status %s even with the exact payload',
    async (status) => {
      const { fetchImpl } = fetchReturning(response(AFFIRMATIVE, status));
      await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(false);
    },
  );

  it.each(['text/html; charset=utf-8', 'text/plain', 'application/jsonx', null])(
    'resolves false on content-type %s even with the exact payload',
    async (contentType) => {
      const { fetchImpl } = fetchReturning(response(AFFIRMATIVE, 200, contentType));
      await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(false);
    },
  );

  it.each(['{authorized:true}', '', '<html>', '{"authorized":true'])(
    'resolves false on malformed JSON %s',
    async (body) => {
      const { fetchImpl } = fetchReturning(response(body));
      await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(false);
    },
  );

  it('resolves false when the fetch rejects (a network error or a refused redirect)', async () => {
    const { fetchImpl } = fetchAnswering(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(false);
  });

  it('resolves false when the fetch throws synchronously', async () => {
    const fetchImpl: FreeholdDevAuthorizationFetch = () => {
      throw new TypeError('Illegal invocation');
    };
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(false);
  });

  it('resolves false when the body read rejects', async () => {
    const { fetchImpl } = fetchReturning({
      status: 200,
      headers: { get: () => 'application/json' },
      text: () => Promise.reject(new Error('body lost')),
    });
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl))).resolves.toBe(false);
  });

  it('resolves false on the timeout when the fetch never settles and ignores its signal', async () => {
    const { fetchImpl, calls } = fetchAnswering(() => new Promise(() => {}));
    const started = Date.now();
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl, { timeoutMs: 20 }))).resolves.toBe(
      false,
    );
    expect(Date.now() - started).toBeLessThan(FREEHOLD_DEV_AUTHORIZATION_TIMEOUT_MS);
    expect(calls[0]?.init.signal.aborted).toBe(true);
  });

  it('resolves false on the timeout when the fetch honors its signal', async () => {
    const { fetchImpl } = fetchAnswering(
      (init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('AbortError')));
        }),
    );
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl, { timeoutMs: 20 }))).resolves.toBe(
      false,
    );
  });

  it('resolves false without asking when the caller already cancelled', async () => {
    const { fetchImpl, calls } = fetchReturning(response(AFFIRMATIVE));
    const controller = new AbortController();
    controller.abort();
    await expect(
      resolveOfflineFreeholdDevGrant(deps(fetchImpl, { signal: controller.signal })),
    ).resolves.toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('resolves false when the caller cancels mid-flight, and aborts the request', async () => {
    let settle: ((res: FreeholdDevAuthorizationResponse) => void) | undefined;
    const { fetchImpl, calls } = fetchAnswering(
      () =>
        new Promise((resolve) => {
          settle = resolve;
        }),
    );
    const controller = new AbortController();
    const pending = resolveOfflineFreeholdDevGrant(
      deps(fetchImpl, { signal: controller.signal, timeoutMs: 5000 }),
    );
    await Promise.resolve();
    expect(calls).toHaveLength(1);
    controller.abort();
    await expect(pending).resolves.toBe(false);
    expect(calls[0]?.init.signal.aborted).toBe(true);
    // A late answer changes nothing.
    settle?.(response(AFFIRMATIVE));
    await expect(pending).resolves.toBe(false);
  });

  it('never asks outside a DEV build', async () => {
    const { fetchImpl, calls } = fetchReturning(response(AFFIRMATIVE));
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl, { isDev: false }))).resolves.toBe(
      false,
    );
    expect(calls).toHaveLength(0);
  });

  it.each([
    ['file:', { protocol: 'file:', hostname: '', origin: 'null' }],
    [
      'capacitor:',
      { protocol: 'capacitor:', hostname: 'localhost', origin: 'capacitor://localhost' },
    ],
    [
      'a LAN host',
      { protocol: 'http:', hostname: '192.168.1.2', origin: 'http://192.168.1.2:5173' },
    ],
    [
      'a public host',
      { protocol: 'https:', hostname: 'example.com', origin: 'https://example.com' },
    ],
    [
      'a loopback-prefixed suffix',
      { protocol: 'http:', hostname: 'localhost.evil.com', origin: 'http://localhost.evil.com' },
    ],
  ])('never asks from %s', async (_label, location) => {
    const { fetchImpl, calls } = fetchReturning(response(AFFIRMATIVE));
    await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl, { location }))).resolves.toBe(
      false,
    );
    expect(calls).toHaveLength(0);
  });

  it.each(['localhost', '127.0.0.1', '::1', '[::1]'])(
    'asks from loopback host %s',
    async (hostname) => {
      const { fetchImpl, calls } = fetchReturning(response(AFFIRMATIVE));
      const location = { protocol: 'http:', hostname, origin: `http://${hostname}:5173` };
      await expect(resolveOfflineFreeholdDevGrant(deps(fetchImpl, { location }))).resolves.toBe(
        true,
      );
      expect(calls).toHaveLength(1);
    },
  );

  it('pins the exported timeout bound at 1500 ms (the default-parameter behaviour is proven by the timeout cases above)', () => {
    expect(FREEHOLD_DEV_AUTHORIZATION_TIMEOUT_MS).toBe(1500);
  });
});

describe('resolveBrowserFreeholdDevGrant (the src/main.ts call)', () => {
  it('reads the real location and fetch, and resolves true on the affirmative', async () => {
    const calls: unknown[][] = [];
    vi.stubGlobal('fetch', (...args: unknown[]) => {
      calls.push(args);
      return Promise.resolve(response(AFFIRMATIVE));
    });
    vi.stubGlobal('location', {
      protocol: 'http:',
      hostname: '127.0.0.1',
      origin: 'http://127.0.0.1:5173',
    });
    await expect(resolveBrowserFreeholdDevGrant(true)).resolves.toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe('http://127.0.0.1:5173/__freehold/dev-authorization');
    expect(calls[0]?.[1]).toMatchObject({ credentials: 'omit', mode: 'same-origin' });
  });

  it('never fetches outside DEV', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(response(AFFIRMATIVE)));
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('location', {
      protocol: 'http:',
      hostname: 'localhost',
      origin: 'http://localhost',
    });
    await expect(resolveBrowserFreeholdDevGrant(false)).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resolves false without a fetch or a location (a non-browser host)', async () => {
    vi.stubGlobal('fetch', undefined);
    vi.stubGlobal('location', {
      protocol: 'http:',
      hostname: 'localhost',
      origin: 'http://localhost',
    });
    await expect(resolveBrowserFreeholdDevGrant(true)).resolves.toBe(false);
    vi.stubGlobal('fetch', () => Promise.resolve(response(AFFIRMATIVE)));
    vi.stubGlobal('location', undefined);
    await expect(resolveBrowserFreeholdDevGrant(true)).resolves.toBe(false);
  });

  it('resolves false when reading the location throws', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(response(AFFIRMATIVE)));
    vi.stubGlobal('location', {
      get protocol(): string {
        throw new Error('detached');
      },
      hostname: 'localhost',
      origin: 'http://localhost',
    });
    await expect(resolveBrowserFreeholdDevGrant(true)).resolves.toBe(false);
  });
});

describe('the bootstrap has no public switch', () => {
  const source = stripComments(
    readFileSync(new URL('../src/game/freehold_dev_bootstrap.ts', import.meta.url), 'utf8'),
  );

  it('scans the real module (presence control for the absences below)', () => {
    expect(source).toContain('resolveOfflineFreeholdDevGrant');
  });

  it.each([
    'localStorage',
    'sessionStorage',
    'URLSearchParams',
    'location.search',
    'VITE_',
    'cookie',
  ])('never reads %s', (token) => {
    expect(source).not.toContain(token);
  });
});

describe('src/main.ts bootstraps the grant once, before the offline Sim', () => {
  const main = stripComments(readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8'));
  const start = main.indexOf('async function startOffline(');
  const body = main.slice(start, main.indexOf('\n}\n', start));

  it('resolves the verdict through the DEV flag and hands it to offlineWorldConfig', () => {
    expect(start).toBeGreaterThan(-1);
    const call =
      'const freeholdDevGrantEnabled = await resolveBrowserFreeholdDevGrant(import.meta.env.DEV);';
    expect(body).toContain(call);
    expect(body.indexOf(call)).toBeLessThan(body.indexOf('new Sim('));
    const config = body.slice(
      body.indexOf('offlineWorldConfig({'),
      body.indexOf('}),', body.indexOf('offlineWorldConfig({')),
    );
    expect(config).toContain('freeholdDevGrantEnabled,');
    expect(main.match(/resolveBrowserFreeholdDevGrant\(/g)).toHaveLength(1);
    expect(main).toContain(
      "import { resolveBrowserFreeholdDevGrant } from './game/freehold_dev_bootstrap';",
    );
  });
});

describe('the bridge path literal', () => {
  it('is the same string on the browser side and the Node plugin side', () => {
    // The browser bundle cannot import the Node plugin, so the path is
    // duplicated; this is the one place the two copies meet.
    expect(FREEHOLD_DEV_AUTHORIZATION_PATH).toBe(BRIDGE_PATH);
    expect(FREEHOLD_DEV_AUTHORIZATION_PATH).toBe('/__freehold/dev-authorization');
  });
});
