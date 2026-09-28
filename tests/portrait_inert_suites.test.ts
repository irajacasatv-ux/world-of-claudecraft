// Three happy-dom suites stub the portrait chip inline in vi.hoisted and pin that
// they start no fetch (the chip's renderer starts hundreds of GLB fetches on import,
// which outlive happy-dom teardown as ProgressEvent rejections). The two that the
// selective gate reaches through the import graph must stay out of its always-run
// floor: the classifier matches its dynamic-import pattern on raw text, comments
// included, and floors a file that imports an fs-reading helper, so a shared-helper
// import or a careless comment would quietly move them. The gate's own discovery
// (the same collectSuiteVisibility the local gate and the CI shards call) decides it
// here, so the pin cannot drift from the gate.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSuiteVisibility } from '../scripts/lib/gate_discovery.mjs';
import { stripComments } from './helpers/strip_comments';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (file: string) => fs.readFileSync(path.join(HERE, file), 'utf8');
// A suite that writes and deletes a scratch file under tests/ while this walk runs
// must not fail it: a directory gone between the listing and the read lists nothing,
// and a file gone reads as empty. The three suites checked below are still read
// strictly in the second test and must each be listed, so a missing one still fails.
const orGone = <T>(read: () => T, gone: T): T => {
  try {
    return read();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return gone;
    throw error;
  }
};
// Each suite and whether the gate's always-run floor holds it (char_window reads
// source, so it is floored whatever its stub; the other two must stay graph-selected).
const SUITES = [
  { file: 'char_window_drag_render_defer.test.ts', floored: false },
  { file: 'quest_dialog_controller.test.ts', floored: false },
  { file: 'char_window.test.ts', floored: true },
];

// The recorder, installed in vi.hoisted (so before any import runs) and returned from
// it, the chip stub, and the afterAll that restores fetch and asserts the list is
// empty, each matched as one block so no line can move out of it. Each suite assigns
// fetch exactly twice (the install and the restore) and never stubs it any other way,
// so no window of a suite can run unrecorded.
const RECORDER =
  /^const \{ fetched, inertPortraitChip, realFetch \} = vi\.hoisted\(\(\) => \{\n {2}const fetched: string\[\] = \[\];\n {2}const realFetch = globalThis\.fetch;\n {2}globalThis\.fetch = \(\(input: RequestInfo \| URL, init\?: RequestInit\) => \{\n {4}fetched\.push\(typeof input === 'string' \? input : input instanceof URL \? input\.href : input\.url\);\n {4}return realFetch\(input, init\);\n {2}\}\) as typeof fetch;$/m;
const HOISTED_RETURN = /^ {2}return \{ fetched, inertPortraitChip, realFetch \};\n\}\);$/m;
const CHIP_STUB = /^vi\.mock\('\.\.\/src\/ui\/portrait_chip', \(\) => inertPortraitChip\);$/m;
const AFTER_ALL =
  /^afterAll\(\(\) => \{\n {2}globalThis\.fetch = realFetch;\n {2}expect\(fetched, 'this suite starts no fetch'\)\.toEqual\(\[\]\);\n\}\);$/m;

describe('the portrait-inert suites', () => {
  it('stay where the selective gate put them', () => {
    const { testFiles, alwaysRun } = collectSuiteVisibility({
      root: path.join(HERE, '..'),
      readdirSync: (dir, options) => orGone(() => fs.readdirSync(dir, options), []),
      readFileSync: (file, encoding) => orGone(() => fs.readFileSync(file, encoding), ''),
      join: path.join,
      relative: path.relative,
      sep: path.sep,
    });
    const floor = new Set(alwaysRun);
    for (const { file, floored } of SUITES) {
      // Listed first, so a renamed suite cannot leave its floor check passing vacuously.
      expect(testFiles, file).toContain(`tests/${file}`);
      expect(floor.has(`tests/${file}`), file).toBe(floored);
    }
  });

  it('each install the recorder, stub the chip, and pin zero fetches', () => {
    // Over comment-stripped text, so neither a line nor a block commented out counts.
    for (const { file } of SUITES) {
      const source = stripComments(read(file));
      expect(source, file).toMatch(RECORDER);
      expect(source, file).toMatch(HOISTED_RETURN);
      expect(source, file).toMatch(CHIP_STUB);
      expect(source, file).toMatch(AFTER_ALL);
      expect(source.match(/globalThis\.fetch =/g), file).toHaveLength(2);
      expect(source, file).not.toMatch(/stubGlobal\(\s*['"`]fetch/);
    }
  });

  it('strips a commented-out block before matching (positive control)', () => {
    const block = [
      'afterAll(() => {',
      '  globalThis.fetch = realFetch;',
      "  expect(fetched, 'this suite starts no fetch').toEqual([]);",
      '});',
    ].join('\n');
    expect(block).toMatch(AFTER_ALL);
    expect(stripComments(`/*\n${block}\n*/`)).not.toMatch(AFTER_ALL);
    expect(stripComments(block.replace(/^/gm, '// '))).not.toMatch(AFTER_ALL);
  });
});
