// Pure half of the per-file test memory probe (scripts/test_memory_probe.mjs, `npm run
// test:memory`): parse the records the probe's setup file writes (one JSON line per test
// file) and judge each file against scripts/test_memory_budgets.json. Kept free of I/O so
// Vitest pins every verdict without spawning a suite.
//
// The judged figure is RETAINED heap: heapUsed after a forced full GC at the end of every
// case, peak over the file. Garbage cannot inflate it, so a file that climbs case over case
// is holding something (the spy registry held a whole Sim per case before
// patches/@vitest__spy@4.1.11.patch). Peak RSS is reported beside it for context only: it
// moves with GC timing and allocator behaviour, not with what a file keeps.

export const MIB = 1024 * 1024;

/**
 * @typedef {{
 *   file: string,
 *   pid: number,
 *   cases: number,
 *   retainedPeakBytes: number,
 *   retainedEndBytes: number,
 *   maxRssBytes: number,
 * }} MemoryProbeRecord
 */

/**
 * @param {string} text
 * @returns {MemoryProbeRecord[]}
 */
export function parseMemoryProbeRecords(text) {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

/**
 * Judge every requested file. A file with no record is `missing` (it crashed, was skipped,
 * or never ran), which fails the probe: a memory check that cannot see a file must not
 * report it as within budget. A file with no budget of its own is held to the ceiling.
 *
 * @param {{
 *   files: string[],
 *   records: MemoryProbeRecord[],
 *   budgets: Record<string, { retainedMb: number }>,
 *   ceilingMb: number,
 * }} opts
 */
export function judgeMemoryProbe({ files, records, budgets, ceilingMb }) {
  const byFile = new Map(records.map((record) => [record.file, record]));
  const rows = files.map((file) => {
    const budgetMb = budgets[file]?.retainedMb ?? ceilingMb;
    const record = byFile.get(file);
    if (!record) return { file, budgetMb, verdict: /** @type {const} */ ('missing') };
    const retainedPeakMb = Math.round(record.retainedPeakBytes / MIB);
    return {
      file,
      budgetMb,
      cases: record.cases,
      retainedPeakMb,
      retainedEndMb: Math.round(record.retainedEndBytes / MIB),
      maxRssMb: Math.round(record.maxRssBytes / MIB),
      verdict: /** @type {const} */ (retainedPeakMb > budgetMb ? 'over' : 'ok'),
    };
  });
  return { rows, ok: rows.every((row) => row.verdict === 'ok') };
}

/**
 * The budgets file's own contract: every budget is a positive whole number of MiB no
 * higher than the ceiling, so no single entry can quietly exempt a file from it.
 *
 * @param {{ ceilingMb: number, files: Record<string, { retainedMb: number }> }} budgets
 * @returns {string[]} one problem per line; empty when the file is sound
 */
export function memoryBudgetProblems(budgets) {
  const problems = [];
  if (!Number.isInteger(budgets.ceilingMb) || budgets.ceilingMb <= 0) {
    problems.push(`ceilingMb must be a positive integer, got ${budgets.ceilingMb}`);
  }
  for (const [file, budget] of Object.entries(budgets.files)) {
    const mb = budget?.retainedMb;
    if (!Number.isInteger(mb) || mb <= 0)
      problems.push(`${file}: retainedMb must be a positive integer`);
    else if (mb > budgets.ceilingMb)
      problems.push(`${file}: retainedMb ${mb} is above the ceiling`);
    if (!/^tests\/.+\.test\.ts$/.test(file))
      problems.push(`${file}: not a tests/**/*.test.ts path`);
  }
  return problems;
}

/**
 * @param {ReturnType<typeof judgeMemoryProbe>['rows']} rows
 * @returns {string}
 */
export function formatMemoryProbeTable(rows) {
  const lines = ['verdict  retained(peak/end MiB)  budget  rss MiB  cases  file'];
  for (const row of rows) {
    if (row.verdict === 'missing') {
      lines.push(
        `MISSING  -                       ${String(row.budgetMb).padStart(6)}  -        -      ${row.file}`,
      );
      continue;
    }
    const retained = `${row.retainedPeakMb}/${row.retainedEndMb}`.padEnd(22);
    lines.push(
      `${row.verdict === 'ok' ? 'ok     ' : 'OVER   '}  ${retained}  ${String(row.budgetMb).padStart(6)}  ${String(row.maxRssMb).padStart(7)}  ${String(row.cases).padStart(5)}  ${row.file}`,
    );
  }
  return lines.join('\n');
}
