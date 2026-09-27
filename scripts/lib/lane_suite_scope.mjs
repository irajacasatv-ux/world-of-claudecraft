// Which long-sims lane files a LOCAL vitest run leaves out. The CI_LONG_SUITES
// files (lib/ci_shard_plan.mjs) are the balance harnesses and rotation sims
// CI runs in the dedicated long-sims lane jobs on every PR; on a laptop they
// are the long tail of a bare `npm test` or a gate_select run. Locally they
// are opt-in: vite.config.ts adds what this returns to test.exclude.
//
// Every rule fails toward MORE tests:
//   - CI (the CI env var GitHub Actions sets) never excludes anything, so the
//     shards, the lanes, release-gate and the nightly are untouched;
//   - WOC_LANE_SUITES=1 includes them all (`npm run gate`, the full merge bar,
//     sets it, so it stays CI-equivalent);
//   - a run that names a lane file keeps it: any positional CLI argument that
//     is a substring of the file's path, which is vitest's own filter rule, so
//     `npx vitest run tests/druid_balance_probe.test.ts`, `vitest run druid`
//     and `vitest run tests/` all keep the files they name.

import { CI_LONG_SUITES } from './ci_shard_plan.mjs';

/** The opt-in, as the env overlay a caller merges into a vitest run. */
export function laneSuitesOptInEnv() {
  return { WOC_LANE_SUITES: '1' };
}

// vitest subcommands, never file filters.
const VITEST_COMMANDS = new Set(['run', 'related', 'watch', 'dev', 'bench', 'list']);

/**
 * @param {string[]} argv the vitest process argv (process.argv)
 * @returns {string[]} the positional filter arguments, slash-normalized
 */
export function vitestFilterArgs(argv) {
  const cli = argv.findIndex((arg) => /(?:^|[\\/])vitest(?:\.cmd|\.mjs)?$/.test(arg));
  const tail = cli >= 0 ? argv.slice(cli + 1) : argv.slice(2);
  const filters = [];
  for (let i = 0; i < tail.length; i++) {
    const arg = tail[i];
    if (arg.startsWith('-')) {
      // `--config x`, `-t name`: a known value flag's value is not a filter. An
      // unknown flag consumes nothing, so its value, if it has one, reads as a
      // filter, which can only keep more lane files, never fewer.
      if (VALUE_FLAGS.has(arg)) i++;
      continue;
    }
    if (VITEST_COMMANDS.has(arg)) continue;
    filters.push(arg.replaceAll('\\', '/'));
  }
  return filters;
}

// vitest flags whose value may follow as a separate argument.
const VALUE_FLAGS = new Set([
  '--config',
  '-c',
  '--root',
  '-r',
  '--dir',
  '--project',
  '--reporter',
  '--outputFile',
  '--testNamePattern',
  '-t',
  '--shard',
  '--maxWorkers',
  '--pool',
  '--environment',
  '--mode',
  '--exclude',
  '--retry',
  '--testTimeout',
  '--hookTimeout',
]);

/**
 * @param {{ env: Record<string, string | undefined>, argv: string[] }} opts
 * @returns {string[]} lane files to add to test.exclude (repo-relative)
 */
export function localLaneExclusions({ env, argv }) {
  if (env.CI) return [];
  if (env.WOC_LANE_SUITES === '1') return [];
  const filters = vitestFilterArgs(argv);
  return CI_LONG_SUITES.filter((file) => !filters.some((filter) => file.includes(filter)));
}
