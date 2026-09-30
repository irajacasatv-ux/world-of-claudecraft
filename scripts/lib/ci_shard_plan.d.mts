export const CI_GUARD_SUITES: readonly string[];
export const CI_GUARD_PREFIXES: readonly string[];
export const LANE_THRESHOLD_MS: number;
export const CARRIED_LOCAL_TO_CI_RATIO: number;
export function ciTimeWeight(ms: number, carriedRow: object | undefined): number;
export function laneThresholdOver(
  weights: Readonly<Record<string, number>>,
  carried: Readonly<Record<string, object>>,
  lane: readonly string[],
): string[];
export const SHARD_POOL_CEILING_MS: number;
export const LANE_POOL_CEILING_MS: number;
export const RATCHET_HEADROOM: number;
export const RATCHET_SLACK: number;
export const LANE_RATCHET_HEADROOM: number;
export const LANE_RATCHET_SLACK: number;
export function poolWeights(
  weights: Readonly<Record<string, number>>,
  carried: Readonly<Record<string, object>>,
  lane: readonly string[],
): { shard: number; lane: number };
export function ratchetProblems(
  pools: { shard: number; lane: number },
  ceilings: { shard: number; lane: number },
): string[];
export const CI_LONG_SUITES: readonly string[];
export const CI_LONG_SUITE_HALVES: { readonly a: readonly string[]; readonly b: readonly string[] };
export const FLOOR_SANITY_MIN: number;

export function collectedLaneFiles(opts: {
  testFiles: string[];
  exists: (p: string) => boolean;
  suites?: readonly string[];
}): string[];

export function parseShardArg(argv: string[]): { index: number; total: number } | null;

export function resolveWorkerCount(opts: { cores: number; envValue?: string }): {
  workers: number;
  source: 'default' | 'env' | 'invalid';
};

export function buildFloor(opts: {
  alwaysRun: string[];
  testFiles: string[];
  changedTestFiles: string[];
}): { floor: string[]; missingGuards: string[] };

export interface ShardLeg {
  name: string;
  cmd: string;
  args: string[];
}

export function buildShardPlan(opts: {
  mode: string;
  changedPaths: string[];
  alwaysRun: string[];
  testFiles: string[];
  shard: { index: number; total: number };
  workers: number;
  exists: (p: string) => boolean;
}): {
  mode: 'full' | 'selective';
  reason: string;
  legs: ShardLeg[];
  floorCount?: number;
  relatedCount?: number;
  outsideFloorCount?: number;
  laneExcluded: string[];
  laneFloorCount?: number;
};

export function buildLanePlan(opts: {
  mode: string;
  changedPaths: string[];
  alwaysRun: string[];
  testFiles: string[];
  workers: number;
  exists: (p: string) => boolean;
  half: 'a' | 'b';
}): {
  mode: 'full' | 'selective';
  reason: string;
  legs: ShardLeg[];
  laneFiles: string[];
};
