import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { CI_LONG_SUITES } from '../scripts/lib/ci_shard_plan.mjs';
import { buildFullGateSteps } from '../scripts/lib/gate_steps.mjs';
import {
  laneSuitesOptInEnv,
  localLaneExclusions,
  normalizeVitestFilter,
  vitestFilterArgs,
  withLaneSuitesOptIn,
} from '../scripts/lib/lane_suite_scope.mjs';
import { stripComments } from './helpers/strip_comments';

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

  it('drops nothing under any CI value or any opt-in value but empty or 0', () => {
    for (const ci of ['true', '1', '']) {
      expect(localLaneExclusions({ env: { CI: ci }, argv: argv('run') }), ci).toEqual([]);
    }
    expect(localLaneExclusions({ env: laneSuitesOptInEnv(), argv: argv('run') })).toEqual([]);
    for (const on of ['1', 'true', 'yes']) {
      expect(localLaneExclusions({ env: { WOC_LANE_SUITES: on }, argv: argv('run') })).toEqual([]);
    }
    for (const off of ['', '0']) {
      expect(
        localLaneExclusions({ env: { WOC_LANE_SUITES: off }, argv: argv('run') }),
        off,
      ).toHaveLength(CI_LONG_SUITES.length);
    }
  });

  it('matches a named file the way vitest does: case, a leading ./, an absolute path', () => {
    const [first] = CI_LONG_SUITES;
    const root = '/repo';
    const kept = (...args: string[]) =>
      CI_LONG_SUITES.filter(
        (f) => !localLaneExclusions({ env: {}, argv: argv(...args), root }).includes(f),
      );
    expect(kept('run', `./${first}`)).toEqual([first]);
    expect(kept('run', `${root}/${first}`)).toEqual([first]);
    expect(kept('run', first.toUpperCase())).toEqual([first]);
    expect(kept('run', './tests/a.test.ts', `./${first}`)).toEqual([first]);
    // vitest resolves the filter too (.. and // collapse) and drops a :line suffix.
    expect(kept('run', `tests/../${first}`)).toEqual([first]);
    expect(kept('run', `${first}:12`)).toEqual([first]);
    // A filter naming the root itself names every file.
    expect(kept('run', '.')).toEqual([...CI_LONG_SUITES]);
    expect(normalizeVitestFilter(`${root}/tests/X.test.ts`, root)).toContain('tests/x.test.ts');
    expect(normalizeVitestFilter('.\\tests\\x.test.ts', root)).toContain('tests/x.test.ts');
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

  it('merges the gate opt-in LAST, so no leg can opt out, and keeps its other env', () => {
    const steps: Array<{ name: string; env?: Record<string, string> }> = [
      { name: 'a' },
      { name: 'b', env: { I18N_RELEASE_TIER: '1' } },
      { name: 'c', env: { WOC_LANE_SUITES: '0' } },
    ];
    const [plain, tier, optedOut] = withLaneSuitesOptIn(steps);
    expect(plain.env).toEqual(laneSuitesOptInEnv());
    expect(tier.env).toEqual({ I18N_RELEASE_TIER: '1', ...laneSuitesOptInEnv() });
    expect(optedOut.env).toEqual(laneSuitesOptInEnv());
  });

  it('keeps gate_select and gate_shadow from dropping a lane file on any vitest leg', () => {
    // Comment-stripped, so a comment cannot stand in for the wiring. gate_select
    // splices and locks only the opted-in copy of its vitest legs; gate_shadow's
    // one vitest spawn carries the opt-in.
    const select = stripComments(
      readFileSync(new URL('../scripts/gate_select.mjs', import.meta.url), 'utf8'),
    );
    expect(select).toContain('const gatedVitestSteps = withLaneSuitesOptIn(vitestSteps);');
    expect(select).toContain(
      'steps.splice(anchor >= 0 ? anchor + 1 : steps.length, 0, ...gatedVitestSteps);',
    );
    expect(select).toContain('const lockedSteps = new Set(gatedVitestSteps);');
    expect(select).not.toMatch(/\.\.\.vitestSteps\b/);
    const optIn = select.indexOf('withLaneSuitesOptIn(vitestSteps)');
    expect(select.slice(optIn)).not.toMatch(/vitestSteps\.(?:push|unshift|splice)\(/);
    const shadow = stripComments(
      readFileSync(new URL('../scripts/gate_shadow.mjs', import.meta.url), 'utf8'),
    );
    expect(shadow).toContain('env: { ...process.env, ...laneSuitesOptInEnv() }');
    expect(shadow.match(/'vitest'/g)).toHaveLength(1);
  });

  it('keeps the full merge bar CI-equivalent', () => {
    const full = buildFullGateSteps(4, { releaseTier: false, repoRoot: '/repo' }).find(
      (s) => s.name === 'vitest (full suite)',
    );
    expect(full?.env).toMatchObject(laneSuitesOptInEnv());
  });
});
