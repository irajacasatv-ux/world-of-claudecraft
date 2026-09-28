// The sparse cone's corpus rule (tests/helpers/sparse_cone_corpus.ts) over a
// fixture index, one case per arm: what enters (unit tests, their imports, the
// repo files they name, every JSON) and what never does (browser tests,
// markdown, code nothing reaches, the screenshots themselves).

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

  it('takes every unit test, what it imports, and the repo files it names', () => {
    expect(corpus).toEqual(
      expect.arrayContaining([
        'tests/a.test.ts',
        'tests/helpers/h.ts',
        'src/ui/view.ts',
        'scripts/lib/tool.mjs',
        'scripts/capture_shot.mjs',
        'scripts/lib/runner.mjs',
      ]),
    );
  });

  it('takes every JSON outside docs/screenshots, whoever names it', () => {
    expect(corpus).toContain('docs/freeholds/accepted-art.json');
    expect(corpus).not.toContain('docs/screenshots/accepted/manifest.json');
  });

  it('never takes a browser test, markdown, or code no unit test reaches', () => {
    for (const file of [
      'tests/browser/b.browser.test.ts',
      'scripts/browser_only.mjs',
      'docs/design/notes.md',
      'scripts/orphan_shot.mjs',
    ]) {
      expect(corpus, file).not.toContain(file);
    }
    expect(corpus).toHaveLength(7);
  });

  it('honors the caller exclusion and follows nothing through an excluded file', () => {
    const without = sparseConeCorpus(tracked, read, new Set(['tests/helpers/h.ts']));
    expect(without).not.toContain('tests/helpers/h.ts');
    expect(without).not.toContain('src/ui/view.ts');
  });
});
