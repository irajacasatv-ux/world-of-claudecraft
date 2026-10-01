export declare function resolveReviewScope(deps: {
  env?: Record<string, string | undefined>;
  run: (cmd: string, args: string[]) => { status: number | null; stdout?: string; error?: Error };
}): { base: string; mergeBase: string; files: string[] };
