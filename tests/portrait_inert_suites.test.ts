// Three happy-dom suites stub the portrait chip inline in vi.hoisted and pin that
// they start no fetch (the chip's renderer starts hundreds of GLB fetches on import,
// which outlive happy-dom teardown as ProgressEvent rejections). The two that the
// selective gate reaches through the import graph must stay out of its always-run
// floor: the classifier matches its dynamic-import pattern on raw text, comments
// included, and floors a file that imports an fs-reading helper, so a shared-helper
// import or a careless comment would quietly move them. The gate's own discovery
// decides it here, so the pin cannot drift from the gate.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSuiteVisibility } from '../scripts/lib/gate_discovery.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (file: string) => fs.readFileSync(path.join(HERE, file), 'utf8');
const SUITES = [
  'char_window_drag_render_defer.test.ts',
  'quest_dialog_controller.test.ts',
  'char_window.test.ts',
];

describe('the portrait-inert suites', () => {
  it('stay where the selective gate put them', () => {
    const { alwaysRun } = collectSuiteVisibility({
      root: path.join(HERE, '..'),
      readdirSync: fs.readdirSync,
      readFileSync: fs.readFileSync,
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
    // Anchored to whole lines, so a commented-out line does not count.
    for (const file of SUITES) {
      const source = read(file);
      expect(source, file).toMatch(
        /^ {2}globalThis\.fetch = \(\(input: RequestInfo \| URL, init\?: RequestInit\) => \{$/m,
      );
      expect(source, file).toMatch(
        /^vi\.mock\('\.\.\/src\/ui\/portrait_chip', \(\) => inertPortraitChip\);$/m,
      );
      expect(source, file).toMatch(/^ {2}globalThis\.fetch = realFetch;$/m);
      expect(source, file).toMatch(
        /^ {2}expect\(fetched, 'this suite starts no fetch'\)\.toEqual\(\[\]\);$/m,
      );
    }
  });
});
