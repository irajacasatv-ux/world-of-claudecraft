export function laneSuitesOptInEnv(): { WOC_LANE_SUITES: string };

export function vitestFilterArgs(argv: string[]): string[];

export function normalizeVitestFilter(filter: string, root: string): string;

export function localLaneExclusions(opts: {
  env: Record<string, string | undefined>;
  argv: string[];
  root?: string;
}): string[];
