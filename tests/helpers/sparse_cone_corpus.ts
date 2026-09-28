// The corpus the sparse CI checkout cone is derived from (tests/ci_workflow.test.ts):
// every tracked file a UNIT-TEST job can run or load as data, never prose.
//
// The sparse test jobs run only the unit suite (the browser suite runs on the full
// tree in browser-gate), so a screenshot subtree needs to be in the cone only if a
// file those jobs can reach names it. Reachable means:
//   - every test file outside tests/browser/ (the seeds);
//   - every code module a reachable file imports by a relative specifier, in any
//     form (`from`, a side-effect `import '...'`, `import(...)`, `require(...)`);
//   - every code or JSON file a reachable file names by a repo path, with or
//     without a leading `./` or `../` chain (`new URL('../scripts/x.mjs', ...)`)
//     and in a command string (`'node scripts/x.mjs'`), which is how a test
//     spawns a script or loads a data manifest;
//   - every code file under a repo directory a reachable file names, when that
//     file imports a computed specifier (a walked root it imports from, like the
//     fingerprint guard over scripts/assets, or a template like
//     `../src/ui/i18n.locales/${locale}.ts`);
//   - every tracked JSON file outside docs/screenshots, whoever names it, because
//     acceptance manifests are read by path fragments no literal scan can follow
//     (a test-literal-only coupling once missed two of them on its first CI run).
// Markdown is never corpus: it is prose, and a traced full unit run (2026-09-28,
// lane files on, Postgres armed) read no screenshot a markdown file alone names.
//
// Pure: the caller supplies the git index listing and a reader, so a fixture can
// drive it without a repo (tests/sparse_cone_corpus.test.ts).

import path from 'node:path';

const CODE_EXTENSIONS = ['.ts', '.mts', '.cts', '.tsx', '.mjs', '.cjs', '.js'] as const;

const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\(\s*|\bimport\s+)['"](\.{1,2}\/[^'"]+)['"]/g;
const REPO_ROOTS = '(?:scripts|src|server|headless)';
const REPO_PATH_LITERAL = new RegExp(
  `(?<=^|['"\`\\s(])(?:\\.{1,2}/)*(${REPO_ROOTS}/[A-Za-z0-9._/-]+\\.(?:mjs|cjs|js|mts|cts|ts|tsx|json))\\b`,
  'gm',
);
const REPO_DIRECTORY_LITERAL = new RegExp(
  `(?<=^|['"\`\\s(])(?:\\.{1,2}/)*(${REPO_ROOTS}(?:/[A-Za-z0-9._-]+)*)(?=/?(?:['"\`]|\\$\\{))`,
  'gm',
);
/** An import whose specifier is computed: a template, a variable, a call. */
const COMPUTED_IMPORT = /\bimport\s*\(\s*(?!['"][^'"]*['"]\s*\))/;

const isCode = (file: string): boolean => CODE_EXTENSIONS.some((ext) => file.endsWith(ext));
const isScreenshot = (file: string): boolean => file.startsWith('docs/screenshots/');

/** A relative import from `from`, resolved against the index the way the
 *  toolchain resolves it (an extensionless or `.js` specifier naming a `.ts`). */
function resolveImport(from: string, spec: string, index: ReadonlySet<string>): string | null {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    `${base}.mjs`,
    `${base}.js`,
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.mjs$/, '.mts'),
    `${base}/index.ts`,
  ]) {
    if (index.has(candidate)) return candidate;
  }
  return null;
}

/** The test-reachable corpus over `tracked` (the git index), minus `exclude`. */
export function sparseConeCorpus(
  tracked: readonly string[],
  read: (file: string) => string,
  exclude: ReadonlySet<string> = new Set(),
): string[] {
  const index = new Set(tracked);
  const corpus = new Set<string>();
  const queue: string[] = [];
  const admit = (file: string): void => {
    if (corpus.has(file) || exclude.has(file) || isScreenshot(file)) return;
    corpus.add(file);
    if (isCode(file)) queue.push(file);
  };
  for (const file of tracked) {
    if (file.startsWith('tests/') && !file.startsWith('tests/browser/') && isCode(file)) {
      admit(file);
    }
    if (file.endsWith('.json')) admit(file);
  }
  while (queue.length > 0) {
    const file = queue.pop() as string;
    const source = read(file);
    for (const [, spec] of source.matchAll(IMPORT_SPECIFIER)) {
      const target = resolveImport(file, spec, index);
      if (target && isCode(target)) admit(target);
    }
    for (const [, literal] of source.matchAll(REPO_PATH_LITERAL)) {
      if (index.has(literal)) admit(literal);
    }
    if (COMPUTED_IMPORT.test(source)) {
      for (const [, dir] of source.matchAll(REPO_DIRECTORY_LITERAL)) {
        const prefix = `${dir}/`;
        for (const candidate of tracked) {
          if (candidate.startsWith(prefix) && isCode(candidate)) admit(candidate);
        }
      }
    }
  }
  return [...corpus].sort();
}
