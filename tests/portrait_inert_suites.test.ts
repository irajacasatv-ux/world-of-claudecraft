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
// must not fail it: a file or directory gone between the listing and the read is
// skipped, never one of the three suites checked below.
const orGone = <T>(read: () => T, gone: T): T => {
  try {
    return read();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return gone;
    throw error;
  }
};
const SUITES = [
  'char_window_drag_render_defer.test.ts',
  'quest_dialog_controller.test.ts',
  'char_window.test.ts',
];

describe('the portrait-inert suites', () => {
  it('stay where the selective gate put them', () => {
    const { alwaysRun } = collectSuiteVisibility({
      root: path.join(HERE, '..'),
      readdirSync: (dir, options) => orGone(() => fs.readdirSync(dir, options), []),
      readFileSync: (file, encoding) => orGone(() => fs.readFileSync(file, encoding), ''),
      join: path.join,
      relative: path.relative,
      sep: path.sep,
    });
    const floor = new Set(alwaysRun);
    expect(floor.has('tests/char_window_drag_render_defer.test.ts')).toBe(false);
    expect(floor.has('tests/quest_dialog_controller.test.ts')).toBe(false);
    // Already in the floor for reading source, so its place never depended on the stub.
    expect(floor.has('tests/char_window.test.ts')).toBe(true);
  });

  it('each install the recorder, stub the chip, and pin zero fetches', () => {
    // Over comment-stripped text and anchored to whole lines, so neither a line nor a
    // block commented out counts.
    for (const file of SUITES) {
      const source = stripComments(read(file));
      expect(source, file).toMatch(
        /^ {2}globalThis\.fetch = \(\(input: RequestInfo \| URL, init\?: RequestInit\) => \{$/m,
      );
      expect(source, file).toMatch(
        /^ {4}fetched\.push\(typeof input === 'string' \? input : input instanceof URL \? input\.href : input\.url\);$/m,
      );
      expect(source, file).toMatch(
        /^vi\.mock\('\.\.\/src\/ui\/portrait_chip', \(\) => inertPortraitChip\);$/m,
      );
      expect(source, file).toMatch(/^afterAll\(\(\) => \{$/m);
      expect(source, file).toMatch(/^ {2}globalThis\.fetch = realFetch;$/m);
      expect(source, file).toMatch(
        /^ {2}expect\(fetched, 'this suite starts no fetch'\)\.toEqual\(\[\]\);$/m,
      );
    }
  });
});
