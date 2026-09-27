#!/usr/bin/env node
// Per-file test memory probe: `npm run test:memory` measures every file budgeted in
// scripts/test_memory_budgets.json; `npm run test:memory -- <test files>` measures those
// instead (a file with no budget of its own is held to the ceiling). Each file runs alone
// in its own worker under vitest.memory.config.ts, whose setup file forces a full GC after
// every case and records what the file still holds. Exits 1 when a file is over budget,
// produced no record, or failed its own tests. The judgement is pure
// (lib/test_memory_budget.mjs); this entry only spawns and reports.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatMemoryProbeTable,
  judgeMemoryProbe,
  memoryBudgetProblems,
  parseMemoryProbeRecords,
} from './lib/test_memory_budget.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shell = process.platform === 'win32';
const vitestBin = path.join(repoRoot, 'node_modules', '.bin', shell ? 'vitest.cmd' : 'vitest');

const budgets = JSON.parse(
  readFileSync(path.join(repoRoot, 'scripts', 'test_memory_budgets.json'), 'utf8'),
);
const problems = memoryBudgetProblems(budgets);
if (problems.length > 0) {
  console.error(`[test:memory] scripts/test_memory_budgets.json:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

const requested = process.argv
  .slice(2)
  .map((arg) => path.relative(repoRoot, path.resolve(arg)).split(path.sep).join('/'));
const files = requested.length > 0 ? requested : Object.keys(budgets.files);

const dir = mkdtempSync(path.join(os.tmpdir(), 'woc-test-memory-'));
const out = path.join(dir, 'records.jsonl');
let res;
let records = [];
try {
  res = spawnSync(vitestBin, ['run', '--config', 'vitest.memory.config.ts', ...files], {
    stdio: 'inherit',
    cwd: repoRoot,
    env: { ...process.env, TEST_MEMORY_PROBE_OUT: out },
    shell,
  });
  if (existsSync(out)) records = parseMemoryProbeRecords(readFileSync(out, 'utf8'));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const verdict = judgeMemoryProbe({
  files,
  records,
  budgets: budgets.files,
  ceilingMb: budgets.ceilingMb,
});
console.log(
  `\n[test:memory] retained heap after a forced GC per case (ceiling ${budgets.ceilingMb} MiB)`,
);
console.log(formatMemoryProbeTable(verdict.rows));
if (res.status !== 0) {
  console.error(
    `[test:memory] FAIL: vitest exited ${res.status ?? 'killed'}; a red file is no memory verdict`,
  );
  process.exit(res.status ?? 1);
}
if (!verdict.ok) {
  console.error('[test:memory] FAIL: a file is over its budget or left no record (see the table)');
  process.exit(1);
}
console.log('[test:memory] PASS');
