// vite.config.ts sizes every vitest worker: a 2 GiB heap cap (test.execArgv) and,
// for a bare `vitest run` / `npm test`, the gates' host sizing as the default
// maxWorkers (scripts/lib/gate_host_workers.mjs). Both are read from the loaded
// config, and the cap is also read back from this worker's own heap.

import { getHeapStatistics } from 'node:v8';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GATE_BYTES_PER_WORKER } from '../scripts/lib/gate_workers.mjs';

const MIB = 1024 * 1024;

// A URL, not a literal specifier: vite.config.ts sits outside the tsconfig include
// on purpose, and a literal import would pull it into the typecheck.
const VITE_CONFIG = new URL('../vite.config.ts', import.meta.url).href;

async function loadTestConfig(): Promise<{ execArgv?: string[]; maxWorkers?: number }> {
  vi.resetModules();
  const config = (await import(/* @vite-ignore */ VITE_CONFIG)) as {
    default: { test: { execArgv?: string[]; maxWorkers?: number } };
  };
  return config.default.test;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('vitest worker sizing', () => {
  it('caps every worker heap at 2 GiB', async () => {
    expect((await loadTestConfig()).execArgv).toEqual(['--max-old-space-size=2048']);
  });

  it('runs this worker under that cap (old space 2048 MiB plus the young generation)', () => {
    const limitMib = getHeapStatistics().heap_size_limit / MIB;
    expect(limitMib).toBeGreaterThanOrEqual(2048);
    expect(limitMib).toBeLessThan(2400);
  });

  it('sizes a bare run through the host sizing, GATE_MAX_WORKERS included', async () => {
    vi.stubEnv('GATE_MAX_WORKERS', '5');
    expect((await loadTestConfig()).maxWorkers).toBe(5);
    vi.stubEnv('GATE_MAX_WORKERS', '3');
    expect((await loadTestConfig()).maxWorkers).toBe(3);
  });

  it('budgets 1.5 GiB of memory per worker, under the 2 GiB heap cap', () => {
    // The heaviest files peak at 1.1 to 2.2 GB RSS on their own; see the constant's note.
    expect(GATE_BYTES_PER_WORKER).toBe(1536 * MIB);
    expect(GATE_BYTES_PER_WORKER).toBeLessThan(2048 * MIB);
  });
});
