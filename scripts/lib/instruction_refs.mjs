// Reference extraction and resolution for the instruction-file drift guard
// (tests/instruction_drift.test.ts). Instruction files (every CLAUDE.md, AGENTS.md, the
// .claude agents and skills, the .agents skills, and the docs they route through) are read
// by every AI session that touches their area, so a path, module, or npm script they name
// that no longer exists misleads every later contributor. This module finds those names
// mechanically; judgment-level drift (a claim the code contradicts, two files disagreeing)
// is the docs-librarian agent's job.
//
// Only backticked text is read: prose is too loose to check, and the repo's convention is
// to backtick every path, symbol, and command. Within a backticked span:
// - `npm run <name>` / `pnpm run <name>` must name a script of the root package.json or of
//   the package.json in the file's own top-level directory; `<prefix>:*` is a glob.
// - a token with a slash is a path. One whose first segment is a tracked top-level
//   directory is checked strictly (from the repo root or the file's own directory, as a
//   file, a directory, or an extensionless module specifier). Any other slashed token with
//   a file extension or a trailing slash may also resolve as the suffix of a tracked path,
//   because instruction files name paths relative to the area they describe.
// - a bare source-module name (`foo_bar.ts`, `baz.mjs`, `Panel.svelte`) must be the
//   basename of some tracked file.
// Placeholders (`<name>`, `{x}`, `*`, `$VAR`, `a..d` ranges), URLs and schemes, home,
// absolute and parent-relative paths, flags, remote refs (`origin/...`), and scratch or
// build output (`tmp/`, `dist/`, `dist-<name>/`) are skipped. Pure: callers pass the repo's file list
// (tracked plus untracked, not ignored) and the package scripts.

import path from 'node:path';

const EXT =
  /\.(ts|tsx|mjs|cjs|js|json|md|py|sh|css|html|svelte|ya?ml|toml|glb|webp|png|jpg|mp3|sql|txt)$/;
const MODULE = /^[A-Za-z0-9][A-Za-z0-9_.-]*\.(ts|tsx|mjs|cjs|js|svelte)$/;
const SPECIFIER_EXTS = ['.ts', '.tsx', '.mjs', '.cjs', '.js', '.test.ts'];
const SKIP_CHARS = /[*<>{}$|=\\]|\.\./;
const SKIP_PREFIX = /^(~|\/|@|-|origin\/|tmp\/|dist(-[\w-]+)?\/)/;

/** The files the guard reads: instruction files plus the AI-architecture docs. */
export function isInstructionFile(file) {
  return (
    /(^|\/)(CLAUDE|AGENTS)\.md$/.test(file) ||
    /^\.claude\/agents\/[^/]+\.md$/.test(file) ||
    /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(file) ||
    /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(file) ||
    ['docs/qa-gate.md', 'docs/ai-architecture.md', 'docs/codex.md'].includes(file)
  );
}

/**
 * The npm scripts an instruction file may name: the root package.json's, plus those of the
 * package.json in the file's own top-level directory (for example bot/ or electron/).
 * @param {{ file: string, files: Set<string>, readScripts: (packageJson: string) => string[] }} args
 */
export function packageScriptsFor({ file, files, readScripts }) {
  const scripts = new Set(readScripts('package.json'));
  const top = file.split('/')[0];
  if (file.includes('/') && files.has(`${top}/package.json`)) {
    for (const s of readScripts(`${top}/package.json`)) scripts.add(s);
  }
  return scripts;
}

/** @param {string[]} tracked repo-relative posix paths from `git ls-files` */
export function buildIndex(tracked) {
  const files = new Set(tracked);
  const dirs = new Set();
  const basenames = new Set();
  for (const f of tracked) {
    basenames.add(path.posix.basename(f));
    let d = path.posix.dirname(f);
    while (d !== '.') {
      dirs.add(d);
      d = path.posix.dirname(d);
    }
  }
  const topDirs = new Set([...dirs].filter((d) => !d.includes('/')));
  const all = [...files, ...dirs];
  return {
    exists: (p) => files.has(p) || dirs.has(p),
    isModuleSpecifier: (p) => SPECIFIER_EXTS.some((ext) => files.has(p + ext)),
    suffixExists: (p) => all.some((a) => a.endsWith(`/${p}`)),
    hasBasename: (name) => basenames.has(name),
    isTopDir: (segment) => topDirs.has(segment),
  };
}

/**
 * Every checkable reference in a file's backticked spans.
 * @returns {{ line: number, kind: 'script' | 'path' | 'module', token: string }[]}
 */
export function extractRefs(text) {
  const refs = [];
  text.split('\n').forEach((lineText, i) => {
    for (const span of lineText.matchAll(/`([^`]+)`/g)) {
      const body = span[1];
      for (const m of body.matchAll(/\b(?:npm|pnpm) run ([A-Za-z0-9:_.-]+)/g)) {
        refs.push({ line: i + 1, kind: 'script', token: m[1] });
      }
      for (const raw of body.split(/\s+/)) {
        let token = raw.replace(/^["'(]+/, '').replace(/["'),.;:]+$/, '');
        if (!token || SKIP_CHARS.test(token) || token.includes('://') || SKIP_PREFIX.test(token)) {
          continue;
        }
        token = token
          .replace(/^\.\//, '')
          .replace(/#.*$/, '')
          .replace(/:\d+(-\d+)?$/, '');
        if (!token) continue;
        if (token.includes('/')) refs.push({ line: i + 1, kind: 'path', token });
        else if (MODULE.test(token)) refs.push({ line: i + 1, kind: 'module', token });
      }
    }
  });
  return refs;
}

/**
 * The references in `file` that resolve to nothing.
 * @param {{ file: string, refs: ReturnType<typeof extractRefs>, index: ReturnType<typeof buildIndex>, scripts: Set<string> }} args
 */
export function unresolvedRefs({ file, refs, index, scripts }) {
  const dir = path.posix.dirname(file);
  const out = [];
  for (const ref of refs) {
    if (ref.kind === 'script') {
      const ok = ref.token.endsWith(':')
        ? [...scripts].some((s) => s.startsWith(ref.token))
        : scripts.has(ref.token);
      if (!ok) out.push(ref);
      continue;
    }
    if (ref.kind === 'module') {
      if (!index.hasBasename(ref.token)) out.push(ref);
      continue;
    }
    const clean = ref.token.replace(/\/$/, '');
    const local = path.posix.join(dir, clean);
    const strict = index.isTopDir(clean.split('/')[0]);
    const shaped = EXT.test(clean) || ref.token.endsWith('/');
    if (!strict && !shaped) continue;
    const resolves =
      index.exists(clean) ||
      index.exists(local) ||
      (strict && (index.isModuleSpecifier(clean) || index.isModuleSpecifier(local))) ||
      (!strict && index.suffixExists(clean));
    if (!resolves) out.push(ref);
  }
  return out;
}
