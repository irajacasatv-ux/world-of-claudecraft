// The sparse cone's corpus rule (tests/helpers/sparse_cone_corpus.ts) over a
// fixture index, one seeded case per reach arm and per resolution candidate, so
// a broken alternation drops a named file here rather than quietly shrinking
// the real cone: what enters (unit tests, their imports in every form, the repo
// files they name, the roots they import from by a computed specifier, every
// JSON) and what never does (browser tests, markdown, code nothing reaches, the
// screenshots themselves).

import { describe, expect, it } from 'vitest';
import { sparseConeCorpus } from './helpers/sparse_cone_corpus';

const FILES: Record<string, string> = {
  'tests/a.test.ts': [
    "import { helper } from './helpers/h';",
    "import { lib } from '../scripts/lib/tool.mjs';",
    "const script = 'scripts/capture_shot.mjs';",
    "const doc = 'docs/design/notes.md';",
  ].join('\n'),
  'tests/helpers/h.ts': "export { deep } from '../../src/ui/view.js';",
  'src/ui/view.ts': "export const deep = 'docs/screenshots/view-evidence/x.png';",
  'scripts/lib/tool.mjs': "export const lib = 'docs/screenshots/tool-output/';",
  'scripts/capture_shot.mjs': "import { run } from './lib/runner.mjs'; run();",
  'scripts/lib/runner.mjs': 'export const run = () => {};',
  // One seed per remaining import form and resolution candidate.
  'tests/forms.test.ts': [
    "const lazy = await import('../src/lazy');",
    "const legacy = require('../src/legacy.cjs');",
    "import '../src/side_effect';",
    "export * from '../src/barrel';",
    "import { typed } from '../scripts/typed.mjs';",
    "import { View } from '../src/view_tsx';",
  ].join('\n'),
  'src/lazy.ts': '',
  'src/legacy.cjs': '',
  'src/side_effect.ts': '',
  'src/barrel/index.ts': '',
  'scripts/typed.mts': '',
  'src/view_tsx.tsx': '',
  // Repo paths named with a ../ chain and inside a command string.
  'tests/named.test.ts': [
    "const url = new URL('../scripts/url_named.mjs', import.meta.url);",
    "spawnSync('sh', ['-c', 'node scripts/cmd_named.mjs --flag']);",
  ].join('\n'),
  'scripts/url_named.mjs': '',
  'scripts/cmd_named.mjs': '',
  // A walked root imported by a computed specifier admits the files under it;
  // the same directory literal without a computed import admits nothing.
  'tests/walk.test.ts': [
    "const root = new URL('../scripts/walked', import.meta.url);",
    'for (const file of walk(root)) await import(file);',
  ].join('\n'),
  'scripts/walked/one/fingerprint.mjs': "const out = 'docs/screenshots/walked/';",
  'tests/template.test.ts': 'const mod = await import(`../src/dyn/${name}.ts`);',
  'src/dyn/one.ts': '',
  'tests/names_only.test.ts': "const root = '../scripts/listed';",
  'scripts/listed/only_listed.mjs': "const out = 'docs/screenshots/listed/';",
  'scripts/orphan_shot.mjs': "const out = 'docs/screenshots/orphan/';",
  'tests/browser/b.browser.test.ts': "import '../../scripts/browser_only.mjs';",
  'scripts/browser_only.mjs': "const out = 'docs/screenshots/browser/';",
  'docs/design/notes.md': 'See docs/screenshots/prose-only/a.png',
  'docs/freeholds/accepted-art.json': '{"files":["docs/screenshots/accepted/a.png"]}',
  'docs/screenshots/accepted/manifest.json': '{}',
};
const tracked = Object.keys(FILES);
const read = (file: string): string => {
  const source = FILES[file];
  if (source === undefined) throw new Error(`read outside the index: ${file}`);
  return source;
};

describe('sparseConeCorpus', () => {
  const corpus = sparseConeCorpus(tracked, read);

  it.each([
    ['a static from import, extensionless to .ts', 'tests/helpers/h.ts'],
    ['an export-from with a .js specifier naming a .ts', 'src/ui/view.ts'],
    ['a static import of an .mjs', 'scripts/lib/tool.mjs'],
    ['a repo path literal', 'scripts/capture_shot.mjs'],
    ['an import inside a named script', 'scripts/lib/runner.mjs'],
    ['a dynamic import()', 'src/lazy.ts'],
    ['a require()', 'src/legacy.cjs'],
    ['a side-effect import', 'src/side_effect.ts'],
    ['a directory import resolving to index.ts', 'src/barrel/index.ts'],
    ['an .mjs specifier naming an .mts', 'scripts/typed.mts'],
    ['an extensionless specifier naming a .tsx', 'src/view_tsx.tsx'],
    ['a ../-prefixed new URL path', 'scripts/url_named.mjs'],
    ['a path inside a command string', 'scripts/cmd_named.mjs'],
    ['a file under a root imported by a computed specifier', 'scripts/walked/one/fingerprint.mjs'],
    ['a file under a template import prefix', 'src/dyn/one.ts'],
  ])('takes %s', (_, file) => {
    expect(corpus).toContain(file);
  });

  it('takes every JSON outside docs/screenshots, whoever names it', () => {
    expect(corpus).toContain('docs/freeholds/accepted-art.json');
    expect(corpus).not.toContain('docs/screenshots/accepted/manifest.json');
  });

  it('never takes a browser test, markdown, an unimported root, or code no unit test reaches', () => {
    for (const file of [
      'tests/browser/b.browser.test.ts',
      'scripts/browser_only.mjs',
      'docs/design/notes.md',
      'scripts/listed/only_listed.mjs',
      'scripts/orphan_shot.mjs',
    ]) {
      expect(corpus, file).not.toContain(file);
    }
    // The seven unit-test seeds, the fourteen files they reach, and the one JSON.
    expect(corpus).toHaveLength(22);
  });

  it('honors the caller exclusion and follows nothing through an excluded file', () => {
    const without = sparseConeCorpus(tracked, read, new Set(['tests/helpers/h.ts']));
    expect(without).not.toContain('tests/helpers/h.ts');
    expect(without).not.toContain('src/ui/view.ts');
  });
});
