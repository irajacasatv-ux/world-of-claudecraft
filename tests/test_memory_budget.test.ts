import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  formatMemoryProbeTable,
  judgeMemoryProbe,
  type MemoryProbeRecord,
  MIB,
  memoryBudgetProblems,
  parseMemoryProbeRecords,
} from '../scripts/lib/test_memory_budget.mjs';

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

function record(file: string, peakMb: number, endMb = peakMb): MemoryProbeRecord {
  return {
    file,
    pid: 1,
    cases: 3,
    retainedPeakBytes: peakMb * MIB,
    retainedEndBytes: endMb * MIB,
    maxRssBytes: 900 * MIB,
  };
}

describe('judgeMemoryProbe', () => {
  const budgets = { 'tests/a.test.ts': { retainedMb: 300 } };

  it('passes a file at or under its budget, and fails one over it', () => {
    const at = judgeMemoryProbe({
      files: ['tests/a.test.ts'],
      records: [record('tests/a.test.ts', 300)],
      budgets,
      ceilingMb: 1024,
    });
    expect(at.ok).toBe(true);
    const over = judgeMemoryProbe({
      files: ['tests/a.test.ts'],
      records: [record('tests/a.test.ts', 301, 120)],
      budgets,
      ceilingMb: 1024,
    });
    expect(over.ok).toBe(false);
    // The PEAK is judged, so a file that climbs and then frees still fails.
    expect(over.rows[0]).toMatchObject({
      verdict: 'over',
      retainedPeakMb: 301,
      retainedEndMb: 120,
    });
  });

  it('holds a file with no budget of its own to the ceiling', () => {
    const row = (mb: number) =>
      judgeMemoryProbe({
        files: ['tests/b.test.ts'],
        records: [record('tests/b.test.ts', mb)],
        budgets,
        ceilingMb: 1024,
      }).rows[0];
    expect(row(1024)).toMatchObject({ verdict: 'ok', budgetMb: 1024 });
    expect(row(1025)).toMatchObject({ verdict: 'over', budgetMb: 1024 });
  });

  it('fails a requested file that left no record', () => {
    const verdict = judgeMemoryProbe({
      files: ['tests/a.test.ts', 'tests/b.test.ts'],
      records: [record('tests/a.test.ts', 10)],
      budgets,
      ceilingMb: 1024,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.rows[1]).toEqual({
      file: 'tests/b.test.ts',
      budgetMb: 1024,
      verdict: 'missing',
    });
    expect(formatMemoryProbeTable(verdict.rows)).toMatch(/^MISSING .*tests\/b\.test\.ts$/m);
  });

  it('parses one record per line and skips blank lines', () => {
    const lines = `${JSON.stringify(record('tests/a.test.ts', 5))}\n\n${JSON.stringify(record('tests/b.test.ts', 6))}\n`;
    expect(parseMemoryProbeRecords(lines).map((r) => r.file)).toEqual([
      'tests/a.test.ts',
      'tests/b.test.ts',
    ]);
  });
});

describe('memoryBudgetProblems', () => {
  it('refuses a budget above the ceiling, a non-integer budget, and a non-test path', () => {
    expect(
      memoryBudgetProblems({
        ceilingMb: 1024,
        files: {
          'tests/a.test.ts': { retainedMb: 1025 },
          'tests/b.test.ts': { retainedMb: 1.5 },
          'src/c.ts': { retainedMb: 10 },
        },
      }),
    ).toEqual([
      'tests/a.test.ts: retainedMb 1025 is above the ceiling',
      'tests/b.test.ts: retainedMb must be a positive integer',
      'src/c.ts: not a tests/**/*.test.ts path',
    ]);
    // A zero budget, and a ceiling that is not a positive integer.
    expect(
      memoryBudgetProblems({ ceilingMb: 1024, files: { 'tests/d.test.ts': { retainedMb: 0 } } }),
    ).toEqual(['tests/d.test.ts: retainedMb must be a positive integer']);
    expect(memoryBudgetProblems({ ceilingMb: 0, files: {} })).toEqual([
      'ceilingMb must be a positive integer, got 0',
    ]);
  });

  it('finds nothing wrong with the committed budgets, and every budgeted file exists', () => {
    const budgets = JSON.parse(read('scripts/test_memory_budgets.json'));
    expect(memoryBudgetProblems(budgets)).toEqual([]);
    const files = Object.keys(budgets.files);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files)
      expect(existsSync(new URL(`../${file}`, import.meta.url)), file).toBe(true);
  });
});

describe('the probe wiring', () => {
  it('is the test:memory npm script', () => {
    expect(JSON.parse(read('package.json')).scripts['test:memory']).toBe(
      'node scripts/test_memory_probe.mjs',
    );
  });

  it('runs one file per worker with the GC exposed and the probe setup first', async () => {
    // A URL import: the root configs sit outside the tsconfig include on purpose.
    const config = (await import(
      /* @vite-ignore */ new URL('../vitest.memory.config.ts', import.meta.url).href
    )) as {
      default: {
        test: {
          setupFiles: string[];
          execArgv: string[];
          maxWorkers: number;
          fileParallelism: boolean;
        };
      };
    };
    const { test } = config.default;
    expect(test.setupFiles[0]).toBe('./tests/helpers/memory_probe_setup.ts');
    expect(test.setupFiles).toContain('./tests/jsdom_local_storage_setup.ts');
    expect(test.execArgv).toEqual(['--max-old-space-size=2048', '--expose-gc']);
    expect(test.maxWorkers).toBe(1);
    expect(test.fileParallelism).toBe(false);
  });
});

describe('the probe measures after every other cleanup', () => {
  // vitest runs onTestFinished callbacks last-registered first, so the probe setup,
  // FIRST in vitest.memory.config.ts setupFiles, registers first and measures last,
  // after the other setups' cleanups (the DOM files' event-loop turn among them).
  const order: string[] = [];
  it('registers two finish callbacks', ({ onTestFinished }) => {
    onTestFinished(() => {
      order.push('registered first');
    });
    onTestFinished(() => {
      order.push('registered second');
    });
  });

  it('ran them last-registered first', () => {
    expect(order).toEqual(['registered second', 'registered first']);
  });
});
