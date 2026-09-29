// The depth-flag reader audit (tests/helpers/depth_flag_readers.ts) over synthetic
// corpora: each escape the registries in tests/ci_shard_plan.test.ts must refuse, the
// forms they must admit, and the list's exactness. The live registries run the same
// function over the real tests/ and scripts/ trees.
import { describe, expect, it } from 'vitest';
import { auditDepthFlag } from './helpers/depth_flag_readers';

const FLAG = 'WOC_DEMO_SWEEP';
const READ = "const FULL = process.env.WOC_DEMO_SWEEP === '1';\n";

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
  ])('refuses a listed reader that also reads the flag through %s', (_label, extra) => {
    const result = audit({ 'tests/a.test.ts': `${READ}${extra}` }, ['tests/a.test.ts']);
    expect(result.violations).toEqual([
      `tests/a.test.ts: reads ${FLAG} in a form other than process.env.${FLAG} === '1'`,
    ]);
  });

  it.each([
    ['a bracket key', "const FULL = process.env['WOC_DEMO_SWEEP'] === '1';\n"],
    ['a template key', 'const FULL = process.env[`WOC_DEMO_SWEEP`];\n'],
  ])('refuses a listed reader that spells the flag in a string: %s', (_label, extra) => {
    const result = audit({ 'tests/a.test.ts': `${READ}${extra}` }, ['tests/a.test.ts']);
    expect(result.violations).toEqual([`tests/a.test.ts: spells ${FLAG} inside a string`]);
  });

  it.each([
    ['a helper module', 'tests/helpers/depth.ts', READ],
    ['a script', 'scripts/sweep.mjs', "export const FULL = process.env['WOC_DEMO_SWEEP'];\n"],
    ['an unlisted suite', 'tests/d.test.ts', 'if (process.env.WOC_DEMO_SWEEP) run();\n'],
  ])('refuses a read or a spelling in %s outside the list', (_label, file, text) => {
    const result = audit({ 'tests/a.test.ts': READ, [file]: text }, ['tests/a.test.ts']);
    expect(result.violations).toEqual([
      `${file}: names ${FLAG} in code or a string but is not a listed reader`,
    ]);
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

  it('lets the pin files spell the flag, and only them', () => {
    const pin = "expect(workflow).not.toContain('WOC_DEMO_SWEEP');\n";
    expect(audit({ 'tests/pin.test.ts': pin }, [], ['tests/pin.test.ts']).violations).toEqual([]);
    expect(audit({ 'tests/pin.test.ts': pin }, []).violations).toEqual([
      `tests/pin.test.ts: names ${FLAG} in code or a string but is not a listed reader`,
    ]);
  });
});
