import { describe, expect, it } from 'vitest';
import { resolveHostGateWorkers } from '../scripts/lib/gate_host_workers.mjs';
import { GATE_BYTES_PER_WORKER } from '../scripts/lib/gate_workers.mjs';

const GIB = 1024 * 1024 * 1024;
const PAGE = 16384;

describe('resolveHostGateWorkers', () => {
  it('halves the cores when memory is ample', () => {
    expect(
      resolveHostGateWorkers({ env: {}, platform: 'linux', cpuCount: 16, freeMemBytes: 64 * GIB }),
    ).toBe(8);
  });

  it('clamps to the memory budget per worker', () => {
    expect(
      resolveHostGateWorkers({
        env: {},
        platform: 'linux',
        cpuCount: 16,
        freeMemBytes: 3 * GATE_BYTES_PER_WORKER + GIB / 4,
      }),
    ).toBe(3);
  });

  it('reads darwin availability from vm_stat, not the raw free figure', () => {
    // 12 GiB free, inactive and speculative: eight 1.5 GiB workers (the CPU
    // bound), where the raw freemem alone allows one.
    const vmStat = [
      `Mach Virtual Memory Statistics: (page size of ${PAGE} bytes)`,
      `Pages free:                              ${(4 * GIB) / PAGE}.`,
      `Pages inactive:                          ${(5 * GIB) / PAGE}.`,
      `Pages speculative:                       ${(3 * GIB) / PAGE}.`,
      'Pages purgeable:                                0.',
    ].join('\n');
    expect(
      resolveHostGateWorkers({
        env: {},
        platform: 'darwin',
        cpuCount: 16,
        freeMemBytes: 1.6 * GIB,
        readVmStat: () => vmStat,
      }),
    ).toBe(8);
    expect(
      resolveHostGateWorkers({
        env: {},
        platform: 'darwin',
        cpuCount: 16,
        freeMemBytes: 1.6 * GIB,
        readVmStat: () => null,
      }),
    ).toBe(1);
  });

  it('honors GATE_MAX_WORKERS over every bound and GATE_WORKER_TIER as a cap', () => {
    const host = { platform: 'linux', cpuCount: 16, freeMemBytes: 64 * GIB };
    expect(resolveHostGateWorkers({ ...host, env: { GATE_MAX_WORKERS: '11' } })).toBe(11);
    expect(resolveHostGateWorkers({ ...host, env: { GATE_WORKER_TIER: 'low' } })).toBe(2);
    expect(
      resolveHostGateWorkers({ ...host, env: { GATE_MAX_WORKERS: '6', GATE_WORKER_TIER: 'low' } }),
    ).toBe(6);
  });
});
