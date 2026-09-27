// Loaded only by vitest.memory.config.ts (`npm run test:memory`). After every case's whole
// teardown it forces a full GC and reads the heap still in use, so a climb across a file's
// cases is retention, not garbage. At the end of the file it appends one JSON record to
// TEST_MEMORY_PROBE_OUT: the case count, the peak and final retained heap, and the worker's
// peak RSS. scripts/lib/test_memory_budget.mjs judges the records.

import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeEach, expect } from 'vitest';
import { collectGarbage } from './force_gc';

// The working directory, not import.meta.url: a DOM environment serves this module from
// a non-file URL. Vitest runs every worker from the project root.
const repoRoot = process.cwd();
const out = process.env.TEST_MEMORY_PROBE_OUT;
let cases = 0;
let peak = 0;

async function retainedBytes(): Promise<number> {
  await collectGarbage();
  return process.memoryUsage().heapUsed;
}

beforeEach(({ onTestFinished }) => {
  onTestFinished(async () => {
    cases++;
    peak = Math.max(peak, await retainedBytes());
  });
});

afterAll(async () => {
  if (!out) return;
  const testPath = expect.getState().testPath ?? '';
  const end = await retainedBytes();
  const record = {
    file: path.relative(repoRoot, testPath).split(path.sep).join('/'),
    pid: process.pid,
    cases,
    retainedPeakBytes: Math.max(peak, end),
    retainedEndBytes: end,
    // resourceUsage reports kilobytes on every platform (libuv normalizes darwin's bytes).
    maxRssBytes: process.resourceUsage().maxRSS * 1024,
  };
  appendFileSync(out, `${JSON.stringify(record)}\n`);
});
