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
//     every local gate sets it on every vitest leg (`npm run gate`,
//     `node scripts/gate_select.mjs`, and the gate_shadow validator), so a gate
//     never drops a lane file, neither on a full-suite fallback nor when the
//     import graph reaches one;
//   - a run that names a lane file keeps it, the way vitest matches a filter:
//     a trailing :line dropped, then the filter as written (lowercased, a
//     leading ./ stripped) or the path it resolves to from the root, as a
//     substring of the file's lowercased path. `npx vitest run
//     ./tests/druid_balance_probe.test.ts`, `vitest run Warlock` and `vitest
//     run tests/` keep what they name.

import path from 'node:path';
import { CI_LONG_SUITES } from './ci_shard_plan.mjs';

/** The opt-in, as the env overlay a caller merges into a vitest run. */
export function laneSuitesOptInEnv() {
  return { WOC_LANE_SUITES: '1' };
}

/**
 * A gate's vitest steps with the opt-in merged LAST, so no step's own env can
 * opt a gate back out of the lane files.
 *
 * @template {{ env?: Record<string, string> }} T
 * @param {readonly T[]} steps
 * @returns {T[]}
 */
export function withLaneSuitesOptIn(steps) {
  return steps.map((step) => ({ ...step, env: { ...(step.env ?? {}), ...laneSuitesOptInEnv() } }));
}

// vitest subcommands. Only the first positional argument can be one; a later
// command word (`vitest run list`) is a filter, as vitest reads it.
const VITEST_COMMANDS = new Set(['run', 'related', 'watch', 'dev', 'bench', 'list']);

/**
 * @param {string[]} argv the vitest process argv (process.argv)
 * @returns {string[]} the positional filter arguments, slash-normalized
 */
export function vitestFilterArgs(argv) {
  const cli = argv.findIndex((arg) => /(?:^|[\\/])vitest(?:\.cmd|\.mjs)?$/.test(arg));
  const tail = cli >= 0 ? argv.slice(cli + 1) : argv.slice(2);
  const filters = [];
  let sawPositional = false;
  for (let i = 0; i < tail.length; i++) {
    const arg = tail[i];
    // A lone `-` reads as a filter. vitest itself drops it (and the argument
    // after it); keeping it can only keep more lane files, never fewer.
    if (arg.startsWith('-') && arg !== '-') {
      // `--config x`, `-t name`: a known value flag's value is not a filter. An
      // unknown flag consumes nothing, so its value, if it has one, reads as a
      // filter, which can only keep more lane files, never fewer.
      if (VALUE_FLAGS.has(arg)) i++;
      continue;
    }
    const first = !sawPositional;
    sawPositional = true;
    if (first && VITEST_COMMANDS.has(arg)) continue;
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
 * The forms a CLI filter matches in, as vitest reads it: a trailing `:line` is
 * dropped, and the filter matches as written (lowercased, forward slashes, any
 * leading ./ stripped) or as the path it resolves to from the root (which
 * collapses `..`, `//` and `/./` and makes an absolute path relative).
 *
 * @param {string} filter
 * @param {string} root
 * @returns {string[]}
 */
export function normalizeVitestFilter(filter, root) {
  const bare = filter.replace(/:\d+$/, '');
  let raw = bare.replaceAll('\\', '/');
  while (raw.startsWith('./')) raw = raw.slice(2);
  const resolved = path.relative(root, path.resolve(root, bare)).replaceAll('\\', '/');
  // An empty form is the root itself (`.`, an absolute root, `tests/..`): it is a
  // substring of every path, so it keeps every lane file, as vitest would run them.
  return [...new Set([raw.toLowerCase(), resolved.toLowerCase()])];
}

/**
 * @param {{ env: Record<string, string | undefined>, argv: string[], root?: string }} opts
 * @returns {string[]} lane files to add to test.exclude (repo-relative)
 */
export function localLaneExclusions({ env, argv, root = process.cwd() }) {
  if (env.CI !== undefined) return [];
  const optIn = env.WOC_LANE_SUITES;
  if (optIn !== undefined && optIn !== '' && optIn !== '0') return [];
  const forms = vitestFilterArgs(argv).flatMap((filter) => normalizeVitestFilter(filter, root));
  return CI_LONG_SUITES.filter((file) => !forms.some((form) => file.toLowerCase().includes(form)));
}
