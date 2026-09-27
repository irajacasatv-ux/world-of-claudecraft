// Which long-sims lane files a bare LOCAL vitest run leaves out. The
// CI_LONG_SUITES files (lib/ci_shard_plan.mjs) are the balance harnesses and
// rotation sims CI runs in the dedicated long-sims lane jobs on every PR; on a
// laptop they are the long tail of a bare `npm test` or `npx vitest run`. There
// they are opt-in: vite.config.ts adds what this returns to test.exclude.
//
// Every rule fails toward MORE tests:
//   - any CI value (the CI env var GitHub Actions sets) excludes nothing, so the
//     shards, the lanes, release-gate and the nightly are untouched;
//   - WOC_LANE_SUITES set to anything but empty or 0 includes them all, and
//     both local gates set it on every vitest leg (`npm run gate` and
//     `node scripts/gate_select.mjs`), so a gate never drops a lane file,
//     neither on a full-suite fallback nor when the import graph reaches one;
//   - a run that names a lane file keeps it, by vitest's own filter rule: a
//     positional argument, lowercased, with a leading ./ stripped and an
//     absolute path made repo-relative, that is a substring of the file's
//     lowercased path. `npx vitest run ./tests/druid_balance_probe.test.ts`,
//     `vitest run Warlock` and `vitest run tests/` keep what they name.

import path from 'node:path';
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
 * A CLI filter as vitest matches it: lowercased, an absolute path made relative
 * to the project root, forward slashes, any leading ./ stripped.
 *
 * @param {string} filter
 * @param {string} root
 */
export function normalizeVitestFilter(filter, root) {
  let out = filter.replaceAll('\\', '/');
  if (path.isAbsolute(filter)) out = path.relative(root, filter).replaceAll('\\', '/');
  while (out.startsWith('./')) out = out.slice(2);
  return out.toLowerCase();
}

/**
 * @param {{ env: Record<string, string | undefined>, argv: string[], root?: string }} opts
 * @returns {string[]} lane files to add to test.exclude (repo-relative)
 */
export function localLaneExclusions({ env, argv, root = process.cwd() }) {
  if (env.CI !== undefined) return [];
  const optIn = env.WOC_LANE_SUITES;
  if (optIn !== undefined && optIn !== '' && optIn !== '0') return [];
  const filters = vitestFilterArgs(argv).map((filter) => normalizeVitestFilter(filter, root));
  return CI_LONG_SUITES.filter(
    (file) => !filters.some((filter) => file.toLowerCase().includes(filter)),
  );
}
