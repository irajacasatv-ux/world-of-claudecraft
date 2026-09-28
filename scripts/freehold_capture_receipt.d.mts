/** Reads a checkout: `git -C cwd ...args`, stdout with the trailing newline trimmed. */
export type ReceiptGit = (cwd: string, ...args: string[]) => string;

export const FREEHOLD_RECEIPT_BASELINE_COMMIT: string;

export const FREEHOLD_RECEIPT_RUNTIME_PATHS: readonly string[];

export function sealFreeholdCaptures(args: string[], io?: { git?: ReceiptGit }): string;

export function runReceiptCli(
  argv: string[],
  io?: { log?: (line: string) => void; error?: (line: string) => void; git?: ReceiptGit },
): number;
