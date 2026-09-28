// Three happy-dom suites stub the portrait chip inline in vi.hoisted and pin that
// they start no fetch (the chip's renderer starts hundreds of GLB fetches on import,
// which outlive happy-dom teardown as ProgressEvent rejections). The two that the
// selective gate reaches through the import graph must stay there: the classifier
// matches its dynamic-import pattern on raw text, comments included, so a shared-helper
// import or a careless comment would quietly put them into the always-run floor.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyTestSource } from '../scripts/lib/test_visibility.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(HERE, file), 'utf8');

describe('the portrait-inert suites', () => {
  it('keep their selective-gate classification', () => {
    expect(classifyTestSource(read('char_window_drag_render_defer.test.ts')).klass).toBe('graph');
    expect(classifyTestSource(read('quest_dialog_controller.test.ts')).klass).toBe('graph');
    // Already partial for reading source, so its class never depended on the stub.
    expect(classifyTestSource(read('char_window.test.ts')).klass).toBe('partial');
  });

  it('each stub the chip and pin zero fetches', () => {
    for (const file of [
      'char_window_drag_render_defer.test.ts',
      'quest_dialog_controller.test.ts',
      'char_window.test.ts',
    ]) {
      const source = read(file);
      expect(source, file).toContain(
        "vi.mock('../src/ui/portrait_chip', () => inertPortraitChip);",
      );
      expect(source, file).toContain("expect(fetched, 'this suite starts no fetch').toEqual([]);");
    }
  });
});
