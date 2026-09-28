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
import { maskCommentsAndStrings } from './helpers/declared_timeouts';

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

// The recorder, installed in vi.hoisted (so before any import runs) and returned by the
// callback's first return, the chip stub, and the afterAll that restores fetch and asserts
// the list is empty, each matched as one block so no line can move out of it, and each
// required to be live code. No line between the recorder and its return may reach column
// 0 or mention return (in a comment or string too, which fails closed); an indented early
// close either destructures undefined or breaks vitest's hoisting, and both fail when the
// suite loads. Each suite's code also names globalThis.fetch exactly three times (the
// capture, the install and the restore), never stubs fetch through vi.stubGlobal, and
// names realFetch and fetched exactly five times each, the uses those blocks hold: so the
// captured real fetch cannot be put back or called around the recorder, however the
// target is spelled, nor the list emptied before the check. This pin does not see a fetch
// captured or built under another spelling, and it trusts the scanner below.
const RECORDER =
  /^const \{ fetched, inertPortraitChip, realFetch \} = vi\.hoisted\(\(\) => \{\n {2}const fetched: string\[\] = \[\];\n {2}const realFetch = globalThis\.fetch;\n {2}globalThis\.fetch = \(\(input: RequestInfo \| URL, init\?: RequestInit\) => \{\n {4}fetched\.push\(typeof input === 'string' \? input : input instanceof URL \? input\.href : input\.url\);\n {4}return realFetch\(input, init\);\n {2}\}\) as typeof fetch;(?:\n(?:(?![^\n]*\breturn\b) {2}[^\n]*)?)*?\n {2}return \{ fetched, inertPortraitChip, realFetch \};\n\}\);$/m;
const CHIP_STUB = /^vi\.mock\('\.\.\/src\/ui\/portrait_chip', \(\) => inertPortraitChip\);$/m;
const AFTER_ALL =
  /^afterAll\(\(\) => \{\n {2}globalThis\.fetch = realFetch;\n {2}expect\(fetched, 'this suite starts no fetch'\)\.toEqual\(\[\]\);\n\}\);$/m;

/** Whether some match of a block pattern is live code, not inside a comment or a string:
 *  the file's masking over the match's span must equal the match's own masking. */
const isLive = (raw: string, code: string, pattern: RegExp): boolean =>
  [...raw.matchAll(new RegExp(pattern.source, `${pattern.flags}g`))].some(
    (m) => code.slice(m.index, m.index + m[0].length) === maskCommentsAndStrings(m[0]),
  );

/** The checks a suite's raw source fails; the suites and the controls both run it. The
 *  source is read through the repo's tokenizing scanner (maskCommentsAndStrings, whose
 *  fixtures pin it in tests/suite_duration_budget.test.ts): it blanks comments and string
 *  contents but understands strings, templates and regex literals, so a comment marker
 *  inside a string can neither hide code nor keep a commented-out block. */
const failedChecks = (raw: string): string[] => {
  const code = maskCommentsAndStrings(raw);
  const counted = (name: string, pattern: RegExp, want: number): [string, boolean] => {
    const found = code.match(pattern)?.length ?? 0;
    return [`${name} ${found} times in code, want ${want}`, found === want];
  };
  const checks: [string, boolean][] = [
    ['the recorder, in vi.hoisted and returned by its first return', isLive(raw, code, RECORDER)],
    ['the chip stub', isLive(raw, code, CHIP_STUB)],
    ['the afterAll restore and zero-fetch assertion', isLive(raw, code, AFTER_ALL)],
    counted('globalThis.fetch named', /\bglobalThis\.fetch\b/g, 3),
    counted('realFetch named', /\brealFetch\b/g, 5),
    counted('fetched named', /\bfetched\b/g, 5),
    ['no vi.stubGlobal of fetch', !isLive(raw, code, /\bstubGlobal\(\s*(['"`])fetch\1/)],
  ];
  return checks.filter(([, holds]) => !holds).map(([name]) => name);
};

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
    for (const { file } of SUITES) expect(failedChecks(read(file)), file).toEqual([]);
  });

  it('fails a suite with a block commented out or worked around (positive controls)', () => {
    // Each control edits a real suite and runs it through the same failedChecks; an edit
    // that finds nothing to replace leaves the suite passing, so its control fails.
    const raw = read('char_window.test.ts');
    const recorder = 'the recorder, in vi.hoisted and returned by its first return';
    const opener = 'const { fetched, inertPortraitChip, realFetch } = vi.hoisted(() => {';
    const close = '\n  return { fetched, inertPortraitChip, realFetch };\n});';
    expect(failedChecks(raw)).toEqual([]);
    expect(failedChecks(raw.replace(opener, opener.replace('vi.hoisted', '')))).toEqual([recorder]);
    expect(failedChecks(raw.replace(close, `\n});\nvi.hoisted(() => {${close}`))).toEqual([
      recorder,
    ]);
    // An earlier return in any form, placed before the recorder's own, including one
    // behind a comment marker inside a string.
    const decoy = "{ ['fetch' + 'ed']: [], inertPortraitChip, ['real' + 'Fetch']: null }";
    for (const early of [
      `  return ${decoy};`,
      `  if (true) return ${decoy};`,
      `  {\n    return ${decoy};\n  }`,
      `  const url = '//'; return ${decoy};`,
    ]) {
      expect(failedChecks(raw.replace(close, `\n${early}${close}`)), early).toEqual([recorder]);
    }
    expect(failedChecks(raw.replace(CHIP_STUB, ''))).toEqual(['the chip stub']);
    // A block that is not live code: commented out, commented out behind a string that
    // holds a comment marker, or wrapped in a template string.
    for (const hide of [
      (block: string) => `/*\n${block}\n*/`,
      (block: string) => `const url = '//'; /*\n${block}\n*/`,
      (block: string) => `const text = \`\n${block}\n\`;`,
    ]) {
      expect(failedChecks(raw.replace(AFTER_ALL, hide))).toContain(
        'the afterAll restore and zero-fetch assertion',
      );
    }
    const counts = (name: string, found: number, want: number) =>
      `${name} ${found} times in code, want ${want}`;
    expect(failedChecks(`${raw}\nbeforeAll(() => {\n  globalThis.fetch = vi.fn();\n});\n`)).toEqual(
      [counts('globalThis.fetch named', 4, 3)],
    );
    for (const call of ['window.fetch = realFetch;', "const url = '//'; void realFetch(url);"]) {
      expect(failedChecks(`${raw}\n${call}\n`), call).toEqual([counts('realFetch named', 6, 5)]);
    }
    expect(failedChecks(`${raw}\nafterEach(() => {\n  fetched.length = 0;\n});\n`)).toEqual([
      counts('fetched named', 6, 5),
    ]);
    for (const stub of [
      "vi.stubGlobal('fetch', vi.fn());",
      "const url = '//'; vi.stubGlobal('fetch', vi.fn());",
    ]) {
      expect(failedChecks(`${raw}\n${stub}\n`), stub).toEqual(['no vi.stubGlobal of fetch']);
    }
    // Words in comments and strings are not code, so they neither count nor stub.
    expect(
      failedChecks(
        `${raw}\n// vi.stubGlobal('fetch', realFetch) with fetched\nconst t = 'realFetch';\n`,
      ),
    ).toEqual([]);
  });
});
