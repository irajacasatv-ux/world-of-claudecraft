// The depth-flag reader audit (tests/helpers/depth_flag_readers.ts) over synthetic
// corpora: each escape the registries in tests/ci_shard_plan.test.ts must refuse, the
// forms they must admit, and the list's exactness. The live registries run the same
// function over every tracked source that names a flag.
import { describe, expect, it } from 'vitest';
import { auditDepthFlag } from './helpers/depth_flag_readers';

const FLAG = 'WOC_DEMO_SWEEP';
const READ = "const FULL = process.env.WOC_DEMO_SWEEP === '1';\n";
const otherForm = (file: string) =>
  `${file}: names ${FLAG} outside a comment other than as a binding read`;
const unlisted = (file: string) =>
  `${file}: names ${FLAG} outside a comment but is not a listed reader`;

function audit(files: Record<string, string>, listed: string[]) {
  return auditDepthFlag(FLAG, new Map(Object.entries(files)), listed);
}

describe('depth-flag reader audit', () => {
  it('admits a listed binding read, with the flag named in comments anywhere', () => {
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
    ['an inverted exact read', "const PR = !(process.env.WOC_DEMO_SWEEP === '1');\n"],
    ['an exact read inside a ternary', "const D = process.env.WOC_DEMO_SWEEP === '1' ? 0.5 : 1;\n"],
    ['a reassignable binding', "let DEEP = process.env.WOC_DEMO_SWEEP === '1';\n"],
    ['a var binding', "var DEEP = process.env.WOC_DEMO_SWEEP === '1';\n"],
    ['a property assignment', "cfg.full = process.env.WOC_DEMO_SWEEP === '1';\n"],
    [
      'a read after a regex after return',
      'function f(s) { return /\\/*/.test(s); }\nconst X = !!process.env.WOC_DEMO_SWEEP;\n',
    ],
  ])('refuses a listed reader that also names the flag through %s', (_label, extra) => {
    const result = audit({ 'tests/a.test.ts': `${READ}${extra}` }, ['tests/a.test.ts']);
    expect(result.violations).toEqual([otherForm('tests/a.test.ts')]);
  });

  it.each([
    ['a helper module', 'tests/helpers/depth.ts', READ],
    ['a script', 'scripts/sweep.mjs', "export const FULL = process.env['WOC_DEMO_SWEEP'];\n"],
    ['a product module', 'src/sim/depth.ts', READ],
    ['an unlisted suite', 'tests/d.test.ts', 'if (process.env.WOC_DEMO_SWEEP) run();\n'],
    ['a config regex', 'vite.config.ts', 'const deep = /WOC_DEMO_SWEEP/.test(keys);\n'],
    ['a config mid-string', 'vite.config.ts', "const key = 'env:WOC_DEMO_SWEEP'.slice(4);\n"],
    [
      'a pin spelling it in a string',
      'tests/pin.test.ts',
      "expect(x).not.toContain('WOC_DEMO_SWEEP');\n",
    ],
  ])('refuses a mention in %s outside the list', (_label, file, text) => {
    const result = audit({ 'tests/a.test.ts': READ, [file]: text }, ['tests/a.test.ts']);
    expect(result.violations).toEqual([unlisted(file)]);
  });

  it('refuses a source the scanner cannot read, even in a comment or listed', () => {
    const svelte = '<script>\n// WOC_DEMO_SWEEP\n</script>\n';
    expect(audit({ 'tests/fixture.svelte': svelte }, []).violations).toEqual([
      `tests/fixture.svelte: names ${FLAG} in a source the audit cannot read`,
    ]);
    expect(audit({ 'tests/fixture.svelte': svelte }, ['tests/fixture.svelte']).readers).toEqual([]);
  });

  it('reports every binding reader, so a list missing one or naming a non-reader differs', () => {
    const files = { 'tests/a.test.ts': READ, 'tests/b.test.ts': READ, 'tests/c.test.ts': '' };
    expect(audit(files, ['tests/a.test.ts', 'tests/b.test.ts']).readers).toEqual([
      'tests/a.test.ts',
      'tests/b.test.ts',
    ]);
    // A read that only a comment or a string holds is no read at all.
    expect(
      audit({ 'tests/a.test.ts': `// ${READ}const s = "${READ.trim()}";\n` }, []).readers,
    ).toEqual([]);
  });

  it('lets a file build the name from parts', () => {
    const pin = "const flag = ['WOC_DEMO', 'SWEEP'].join('_');\nexpect(x).not.toContain(flag);\n";
    expect(audit({ 'tests/pin.test.ts': pin }, []).violations).toEqual([]);
  });
});
