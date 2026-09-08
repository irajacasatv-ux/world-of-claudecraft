// The OFFLINE browser host's half of the Freehold development grant (D81).
//
// Before the offline Sim is built, the entry flow asks the Vite dev server ONCE
// whether the operator started it with ALLOW_DEV_COMMANDS=1, over the dev-only
// loopback bridge GET /__freehold/dev-authorization that
// scripts/lib/freehold_dev_authorization.mjs installs. The answer becomes the
// nonpersisted SimConfig.freeholdDevGrantEnabled permission and nothing else:
// no tier, no receipt, no identity travels here, and the browser never decides
// anything about online ownership. The realm derives the same permission from
// its own env read (server/sim_boot_config.ts).
//
// The resolve is fail-closed on EVERY path: a production build, a non-HTTP(S)
// page, a non-loopback host, any transport or shape failure, a redirect, a
// refusal, a timeout, or the caller's own cancellation all resolve `false` and
// ordinary Inn Room entry continues. It never throws and never reads a query
// parameter, storage, or a VITE_* variable (the plan forbids every one of those
// as a public switch). Everything is injected so the arms pin directly.

export const FREEHOLD_DEV_AUTHORIZATION_PATH = '/__freehold/dev-authorization';
// Loopback only, so the answer is a few milliseconds away; the bound exists so
// a wedged dev server can never stall world entry.
export const FREEHOLD_DEV_AUTHORIZATION_TIMEOUT_MS = 1500;

export interface FreeholdDevBootstrapLocation {
  readonly protocol: string;
  readonly hostname: string;
  readonly origin: string;
}

// The exact request the bridge is asked with: same-origin, no credentials, no
// cache, and a redirect is a failure rather than something to follow.
export interface FreeholdDevAuthorizationFetchInit {
  readonly method: 'GET';
  readonly credentials: 'omit';
  readonly cache: 'no-store';
  readonly redirect: 'error';
  readonly mode: 'same-origin';
  readonly signal: AbortSignal;
}

export interface FreeholdDevAuthorizationResponse {
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
}

export type FreeholdDevAuthorizationFetch = (
  input: string,
  init: FreeholdDevAuthorizationFetchInit,
) => Promise<FreeholdDevAuthorizationResponse>;

export interface FreeholdDevBootstrapDeps {
  readonly fetch: FreeholdDevAuthorizationFetch;
  readonly location: FreeholdDevBootstrapLocation;
  // Meant to be `import.meta.env.DEV`: a production build never asks.
  readonly isDev: boolean;
  // The caller's cancellation (an abandoned entry); the timeout is always armed.
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

// `location.hostname` spells IPv6 loopback with brackets in browsers; both
// spellings are accepted, nothing else is (no suffix, no LAN address).
export function isLoopbackPageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

export function isFreeholdDevBootstrapOrigin(location: FreeholdDevBootstrapLocation): boolean {
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return false;
  if (!isLoopbackPageHost(location.hostname)) return false;
  return (
    typeof location.origin === 'string' && location.origin.startsWith(`${location.protocol}//`)
  );
}

// Exactly one own key, `authorized`, holding the boolean true. A string, a
// number, an array, null, an extra field, or a false all fail.
export function isFreeholdDevAuthorizationPayload(value: unknown): value is { authorized: true } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== 'authorized') return false;
  return (value as { authorized: unknown }).authorized === true;
}

export function isJsonContentType(contentType: string | null): boolean {
  if (contentType === null) return false;
  const mediaType = contentType.split(';')[0] ?? '';
  return mediaType.trim().toLowerCase() === 'application/json';
}

export async function resolveOfflineFreeholdDevGrant(
  deps: FreeholdDevBootstrapDeps,
): Promise<boolean> {
  if (deps.isDev !== true) return false;
  if (!isFreeholdDevBootstrapOrigin(deps.location)) return false;
  if (deps.signal?.aborted) return false;
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, deps.timeoutMs ?? FREEHOLD_DEV_AUTHORIZATION_TIMEOUT_MS);
  deps.signal?.addEventListener('abort', abort, { once: true });
  // The race, not only the signal, bounds the wait: a fetch that ignores its
  // signal (or a body read that never settles) still resolves false on time.
  const aborted = new Promise<false>((resolve) => {
    controller.signal.addEventListener('abort', () => resolve(false), { once: true });
  });
  // Detached on purpose: the browser's fetch throws when invoked as a method
  // of any object other than the global.
  const fetchImpl = deps.fetch;
  const ask = async (): Promise<boolean> => {
    const response = await fetchImpl(`${deps.location.origin}${FREEHOLD_DEV_AUTHORIZATION_PATH}`, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      mode: 'same-origin',
      signal: controller.signal,
    });
    if (response.status !== 200) return false;
    if (!isJsonContentType(response.headers.get('content-type'))) return false;
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return false;
    }
    return isFreeholdDevAuthorizationPayload(parsed);
  };
  try {
    return await Promise.race([ask(), aborted]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    deps.signal?.removeEventListener('abort', abort);
  }
}

// The one call src/main.ts makes: reads the page's real location and fetch.
// A host without either (a non-browser import) resolves false like every other
// failure; the entry flow has no cancel signal of its own, so the timeout is
// the only cancellation here.
export function resolveBrowserFreeholdDevGrant(isDev: boolean): Promise<boolean> {
  try {
    if (typeof fetch !== 'function' || typeof location === 'undefined') {
      return Promise.resolve(false);
    }
    return resolveOfflineFreeholdDevGrant({
      isDev,
      fetch: (input, init) => fetch(input, init),
      location: {
        protocol: location.protocol,
        hostname: location.hostname,
        origin: location.origin,
      },
    });
  } catch {
    return Promise.resolve(false);
  }
}
