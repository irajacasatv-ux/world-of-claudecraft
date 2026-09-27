export function laneSuitesOptInEnv(): { WOC_LANE_SUITES: string };

export function vitestFilterArgs(argv: string[]): string[];

export function localLaneExclusions(opts: {
  env: Record<string, string | undefined>;
  argv: string[];
}): string[];
