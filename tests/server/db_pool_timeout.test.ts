import net from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// The hanging-database guard. Point the pool at a TCP endpoint that ACCEPTS the
// connection but never completes the Postgres startup handshake (it never sends a
// byte). The pool's connectionTimeoutMillis (DB_POOL_CONNECT_TIMEOUT_MS = 5000)
// must then fail the query fast, so a slow or black-holed database degrades into
// isolated query failures instead of a process-wide stall. Real pg here, no mock:
// the connect-timeout wiring only exists in the real driver.

let server: net.Server;
const held: net.Socket[] = [];
let db: typeof import('../../server/db');

beforeAll(async () => {
  server = net.createServer((sock) => {
    // Accept and hold the socket open; never write a byte, so the pg startup never
    // completes and only the connect timeout can end the wait. Swallow the reset
    // the driver sends when it destroys its side after the timeout fires, so an
    // unhandled 'error' cannot fault the suite.
    sock.on('error', () => {});
    held.push(sock);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  // Set the URL BEFORE importing db.ts: it reads DATABASE_URL and builds the Pool
  // at module load. loadEnvFile never overrides an already-set env var, so the real
  // .env cannot replace this black-hole URL.
  process.env.DATABASE_URL = `postgres://user:pass@127.0.0.1:${port}/db`;
  db = await import('../../server/db');
});

afterAll(async () => {
  for (const sock of held) sock.destroy();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  // A parked connect attempt could keep pool.end() from settling; race it with a
  // short timer so the suite can never hang on teardown.
  const ended = db.pool.end().then(() => 'ended' as const);
  const timed = new Promise<'timer'>((resolve) => {
    setTimeout(() => resolve('timer'), 3000).unref();
  });
  const which = await Promise.race([ended, timed]);
  if (which === 'timer') {
    console.warn('db_pool_timeout: pool.end() did not settle within 3s (parked connect)');
  }
});

describe('db pool connect timeout', () => {
  it('rejects a query with a timeout when the database accepts but never answers', async () => {
    // The driver's timers run on the faked clock; the socket, the held handshake
    // and the real pg driver stay real. Waiting out the real 5000 ms proved no
    // more than the faked clock does: still pending just short of the timeout
    // (not an instant failure), rejected with a timeout just past it (not a hang).
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      let error: Error | undefined;
      let settled = false;
      const query = db.pool.query('SELECT 1').then(
        () => {
          settled = true;
        },
        (e: unknown) => {
          error = e as Error;
          settled = true;
        },
      );
      await vi.advanceTimersByTimeAsync(4500);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(4500);
      expect(settled).toBe(true);
      await query;
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toMatch(/timeout/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
