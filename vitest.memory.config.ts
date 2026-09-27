// The per-file memory probe's config (`npm run test:memory`, scripts/test_memory_probe.mjs).
// The suite's own config plus one setup file that forces a full GC after every case and
// records what the file still holds, run one file per worker, one worker at a time, so a
// record's peak RSS is that file's alone. The probe's setup file goes FIRST: onTestFinished
// callbacks run last-registered first, so it measures after every other setup's cleanup.
import base from './vite.config';

const test = (base as { test: { setupFiles: string[]; execArgv: string[] } }).test;

export default {
  ...base,
  test: {
    ...test,
    setupFiles: ['./tests/helpers/memory_probe_setup.ts', ...test.setupFiles],
    execArgv: [...test.execArgv, '--expose-gc'],
    maxWorkers: 1,
    fileParallelism: false,
    isolate: true,
  },
};
