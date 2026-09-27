import { describe, expect, it, vi } from 'vitest';
import { CI_LONG_SUITES } from '../scripts/lib/ci_shard_plan.mjs';
import { buildFullGateSteps } from '../scripts/lib/gate_steps.mjs';
import {
  laneSuitesOptInEnv,
  localLaneExclusions,
  vitestFilterArgs,
} from '../scripts/lib/lane_suite_scope.mjs';

const VITEST = '/repo/node_modules/.bin/vitest';
const argv = (...args: string[]) => ['/usr/bin/node', VITEST, ...args];

describe('local lane-suite scope', () => {
  it('leaves every lane file out of a bare local run', () => {
    expect(localLaneExclusions({ env: {}, argv: argv('run') })).toEqual([...CI_LONG_SUITES]);
    expect(localLaneExclusions({ env: {}, argv: argv('run', '--maxWorkers=8') })).toEqual([
      ...CI_LONG_SUITES,
    ]);
    expect(CI_LONG_SUITES.length).toBeGreaterThan(0);
  });

  it('drops nothing under CI or with the opt-in', () => {
    expect(localLaneExclusions({ env: { CI: 'true' }, argv: argv('run') })).toEqual([]);
    expect(localLaneExclusions({ env: laneSuitesOptInEnv(), argv: argv('run') })).toEqual([]);
    // Only the exact opt-in value counts.
    expect(
      localLaneExclusions({ env: { WOC_LANE_SUITES: 'true' }, argv: argv('run') }),
    ).toHaveLength(CI_LONG_SUITES.length);
  });

  it('keeps a lane file the run names, by vitest substring filter', () => {
    const [first] = CI_LONG_SUITES;
    const kept = (args: string[]) =>
      CI_LONG_SUITES.filter(
        (f) => !localLaneExclusions({ env: {}, argv: argv(...args) }).includes(f),
      );
    expect(kept(['run', first])).toEqual([first]);
    expect(kept(['run', 'tests/'])).toEqual([...CI_LONG_SUITES]);
    expect(kept(['run', 'warlock_anchor'])).toEqual(
      CI_LONG_SUITES.filter((f) => f.includes('warlock_anchor')),
    );
    expect(kept(['related', first, '--run'])).toEqual([first]);
  });

  it('reads only positional filters, never a known flag value or a subcommand', () => {
    expect(
      vitestFilterArgs(
        argv('run', '--config', 'vitest.memory.config.ts', '-t', 'druid', 'tests\\a.test.ts'),
      ),
    ).toEqual(['tests/a.test.ts']);
    expect(vitestFilterArgs(argv('list', '--filesOnly', 'x'))).toEqual(['x']);
    // An unknown flag consumes nothing: its value reads as a filter, which can
    // only keep more lane files.
    expect(vitestFilterArgs(argv('run', '--someFutureFlag', 'value'))).toEqual(['value']);
  });

  it('is applied by vite.config.ts test.exclude', async () => {
    // A URL import: vite.config.ts sits outside the tsconfig include on purpose.
    vi.resetModules();
    const config = (await import(
      /* @vite-ignore */ new URL('../vite.config.ts', import.meta.url).href
    )) as { default: { test: { exclude: string[] } } };
    const expected = localLaneExclusions({ env: process.env, argv: process.argv });
    const { exclude } = config.default.test;
    expect(exclude.filter((pattern) => CI_LONG_SUITES.includes(pattern))).toEqual(expected);
    // This worker's own argv names no lane file, so outside CI the list is whole.
    if (!process.env.CI && process.env.WOC_LANE_SUITES !== '1') {
      expect(expected).toEqual([...CI_LONG_SUITES]);
    }
  });

  it('keeps the full merge bar CI-equivalent', () => {
    const full = buildFullGateSteps(4, { releaseTier: false, repoRoot: '/repo' }).find(
      (s) => s.name === 'vitest (full suite)',
    );
    expect(full?.env).toMatchObject(laneSuitesOptInEnv());
  });
});
