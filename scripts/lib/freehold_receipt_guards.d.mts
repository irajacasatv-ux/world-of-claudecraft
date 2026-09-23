export function baselineRuntimeRefusal(input: {
  head: string;
  expected: string;
  applicationDiff: readonly string[];
  applicationUntracked: readonly string[];
}): string | null;
export function outputPlacementRefusal(input: {
  output: string;
  before: string;
  after: string;
  performance: string;
  files: readonly string[];
}): string | null;
