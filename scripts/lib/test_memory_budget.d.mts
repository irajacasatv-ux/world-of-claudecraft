export const MIB: number;

export interface MemoryProbeRecord {
  file: string;
  pid: number;
  cases: number;
  retainedPeakBytes: number;
  retainedEndBytes: number;
  maxRssBytes: number;
}

export type MemoryProbeRow =
  | { file: string; budgetMb: number; verdict: 'missing' }
  | {
      file: string;
      budgetMb: number;
      cases: number;
      retainedPeakMb: number;
      retainedEndMb: number;
      maxRssMb: number;
      verdict: 'ok' | 'over';
    };

export function parseMemoryProbeRecords(text: string): MemoryProbeRecord[];

export function judgeMemoryProbe(opts: {
  files: string[];
  records: MemoryProbeRecord[];
  budgets: Record<string, { retainedMb: number }>;
  ceilingMb: number;
}): { rows: MemoryProbeRow[]; ok: boolean };

export function memoryBudgetProblems(budgets: {
  ceilingMb: number;
  files: Record<string, { retainedMb: number }>;
}): string[];

export function formatMemoryProbeTable(rows: MemoryProbeRow[]): string;
