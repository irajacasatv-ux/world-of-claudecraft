// The host-reading half of vitest worker sizing: the pure calculator
// (gate_workers.mjs) fed by the memory sensor (gate_memory.mjs), the core count
// and the two env knobs, GATE_MAX_WORKERS (an absolute override) and
// GATE_WORKER_TIER (a cap). The gates (gate, gate:select, gate:fast) and a bare
// `vitest run` (vite.config.ts's test.maxWorkers, which `npm test` inherits) all
// size their pool here, so one host sizes every run the same way. Every input is
// injectable so a test can drive it without the real host.
import os from 'node:os';
import { resolveAvailableMemoryBytes } from './gate_memory.mjs';
import { computeGateWorkers, resolveGateWorkerTierCap } from './gate_workers.mjs';

/**
 * @param {{
 *   env?: Record<string, string | undefined>,
 *   platform?: string,
 *   cpuCount?: number,
 *   freeMemBytes?: number,
 *   readVmStat?: () => string | null,
 * }} [opts]
 * @returns {number}
 */
export function resolveHostGateWorkers(opts = {}) {
  const env = opts.env ?? process.env;
  return computeGateWorkers({
    cpuCount: opts.cpuCount ?? os.availableParallelism(),
    freeMemBytes: resolveAvailableMemoryBytes({
      platform: opts.platform ?? process.platform,
      freeMemBytes: opts.freeMemBytes ?? os.freemem(),
      readVmStat: opts.readVmStat,
    }),
    envOverride: env.GATE_MAX_WORKERS,
    tierCap: resolveGateWorkerTierCap(env.GATE_WORKER_TIER),
  });
}
