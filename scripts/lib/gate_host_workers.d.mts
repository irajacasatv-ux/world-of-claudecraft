export function resolveHostGateWorkers(opts?: {
  env?: Record<string, string | undefined>;
  platform?: string;
  cpuCount?: number;
  freeMemBytes?: number;
  readVmStat?: () => string | null;
}): number;
