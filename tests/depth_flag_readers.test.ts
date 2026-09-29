// The depth-flag reader audit (tests/helpers/depth_flag_readers.ts) over synthetic
// corpora: each escape the registries in tests/ci_shard_plan.test.ts must refuse, the
// forms they must admit, and the list's exactness. The live registries run the same
// function over the real tests/, scripts/ and repository-root sources.
import { describe, expect, it } from 'vitest';
import { auditDepthFlag } from './helpers/depth_flag_readers';

const FLAG = 'WOC_DEMO_SWEEP';
const READ = "const FULL = process.env.WOC_DEMO_SWEEP === '1';\n";
const LISTED_OTHER_FORM = `tests/a.test.ts: names ${FLAG} outside a comment other than as the exact read process.env.${FLAG} === '1'`;
const unlisted = (file: string) =>
  `${file}: names ${FLAG} outside a comment but is not a listed reader`;

function audit(files: Record<string, string>, listed: string[], pins: string[] = []) {
  return auditDepthFlag(FLAG, new Map(Object.entries(files)), listed, pins);
}

describe('depth-flag reader audit', () => {
  it('admits a listed reader making the exact read, with the flag named in comments', () => {
    const result = audit(
      {
        'tests/a.test.ts': `// runs deeper under WOC_DEMO_SWEEP\n${READ}/* WOC_DEMO_SWEEP */\n`,
        'tests/helpers/b.ts': '// the `WOC_DEMO_SWEEP` flag is read by each suite itself\n',
        'tests/c.test.ts': 'const unrelated = 1;\n',
      },
      ['tests/a.test.ts'],
    );
    expect(result).toEqual({ readers: ['tests/a.test.ts'], violations: [] });
  });

  it.each([
    ['a negated compare', "const PR = process.env.WOC_DEMO_SWEEP !== '1';\n"],
    ['a truthy check', 'if (process.env.WOC_DEMO_SWEEP) run();\n'],
    ['a different value', "const FULL = process.env.WOC_DEMO_SWEEP === 'true';\n"],
    ['a destructure', 'const { WOC_DEMO_SWEEP } = process.env;\n'],
    ['a bracket key', "const FULL = process.env['WOC_DEMO_SWEEP'] === '1';\n"],
    ['a template key', 'const FULL = process.env[`WOC_DEMO_SWEEP`];\n'],
    [
      'a regex over the keys',
      'const k = Object.keys(process.env).find((n) => /^WOC_DEMO_SWEEP$/.test(n));\n',
    ],
    ['a mid-string key', "const [, k] = 'env:WOC_DEMO_SWEEP'.split(':');\n"],
    ['a key after an interpolation', "const k = `${''}WOC_DEMO_SWEEP`;\n"],
  ])('refuses a listed reader that also names the flag through %s', (_label, extra) => {
    const result = audit({ 'tests/a.test.ts': `${READ}${extra}` }, ['tests/a.test.ts']);
    expect(result.violations).toEqual([LISTED_OTHER_FORM]);
  });

  it.each([
    ['a helper module', 'tests/helpers/depth.ts', READ],
    ['a script', 'scripts/sweep.mjs', "export const FULL = process.env['WOC_DEMO_SWEEP'];\n"],
    ['an unlisted suite', 'tests/d.test.ts', 'if (process.env.WOC_DEMO_SWEEP) run();\n'],
    ['a config regex', 'vite.config.ts', 'const deep = /WOC_DEMO_SWEEP/.test(keys);\n'],
    ['a config mid-string', 'vite.config.ts', "const key = 'env:WOC_DEMO_SWEEP'.slice(4);\n"],
  ])('refuses a mention in %s outside the list', (_label, file, text) => {
    const result = audit({ 'tests/a.test.ts': READ, [file]: text }, ['tests/a.test.ts']);
    expect(result.violations).toEqual([unlisted(file)]);
  });

  it('reports every exact reader, so a list missing one or naming a non-reader differs', () => {
    const files = { 'tests/a.test.ts': READ, 'tests/b.test.ts': READ, 'tests/c.test.ts': '' };
    expect(audit(files, ['tests/a.test.ts', 'tests/b.test.ts']).readers).toEqual([
      'tests/a.test.ts',
      'tests/b.test.ts',
    ]);
    // An exact read that only a comment or a string holds is no read at all.
    expect(
      audit({ 'tests/a.test.ts': `// ${READ}const s = "${READ.trim()}";\n` }, []).readers,
    ).toEqual([]);
  });

  it('lets a pin file spell the flag in strings and patterns, never read it live', () => {
    const pin =
      "expect(workflow).not.toContain('WOC_DEMO_SWEEP');\nconst re = /WOC_DEMO_SWEEP/g;\n";
    expect(audit({ 'tests/pin.test.ts': pin }, [], ['tests/pin.test.ts']).violations).toEqual([]);
    expect(audit({ 'tests/pin.test.ts': pin }, []).violations).toEqual([
      unlisted('tests/pin.test.ts'),
    ]);
    const livePin = `${pin}it.skipIf(!process.env.WOC_DEMO_SWEEP)('deep', () => {});\n`;
    expect(audit({ 'tests/pin.test.ts': livePin }, [], ['tests/pin.test.ts']).violations).toEqual([
      `tests/pin.test.ts: names ${FLAG} in live code but is a pin file`,
    ]);
  });
});
