// The instruction-file drift guard. Instruction files (every CLAUDE.md and AGENTS.md, the
// .claude agents and skills, the .agents skills, and the AI-architecture docs) are read by
// every AI session that works in their area, so a name in them that no longer resolves
// misleads every later contributor. The writing standard and the maintenance loop live in
// docs/ai-architecture.md; judgment-level drift (a claim the code contradicts) is the
// docs-librarian agent's job, and this file is the mechanical floor under it.
//
// Guards: every path, source-module name, and npm script an instruction file names in
// backticks resolves in the tree (each rule of scripts/lib/instruction_refs.mjs has a
// positive and a negative unit case, because the whole-tree case can only see a rule that
// rejects too much); every instruction-file class is scanned; every exemption below still
// matches a real reference; the agent and skill catalogs in docs/ai-architecture.md match
// the directories exactly; every role the docs/qa-gate.md coverage table names exists. The
// nearest suite, tests/codex_setup.test.ts, pins the Codex configuration's content, not
// these.
// Cost: 500 ms
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildIndex,
  extractRefs,
  isInstructionFile,
  listRepoFiles,
  packageScriptsFor,
  unresolvedRefs,
} from '../scripts/lib/instruction_refs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// CRLF to LF, so a Windows checkout with autocrlf reads the same text the rules expect.
const normalize = (text: string) => text.replaceAll('\r\n', '\n');
const read = (rel: string) => normalize(readFileSync(path.join(root, rel), 'utf8'));
/** The `name:` field of a file's leading frontmatter block. */
const nameOf = (text: string) =>
  text.match(/^---\n([\s\S]*?)\n---\n/)?.[1].match(/^name:\s*(\S+)\s*$/m)?.[1];
const scriptsOf = (packageJson: string) => Object.keys(JSON.parse(read(packageJson)).scripts ?? {});

/** A NUL-separated (`-z`) git listing, so git never quotes a non-ASCII path. */
function gitPaths(args: string[]): string[] {
  const res = spawnSync('git', [...args, '-z'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
    shell: false,
  });
  if (res.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${res.stderr}`);
  return res.stdout.split('\0').filter(Boolean);
}

/** The repo's files for resolution (see listRepoFiles). */
const repoFiles = () => listRepoFiles(gitPaths);

/** The subset of `paths` git ignores (generated or local-only output, never drift). */
function ignored(paths: string[]): Set<string> {
  if (paths.length === 0) return new Set();
  const res = spawnSync('git', ['check-ignore', '--stdin'], {
    cwd: root,
    input: paths.join('\n'),
    encoding: 'utf8',
    shell: false,
  });
  // 0: some ignored, 1: none ignored, anything else: git failed.
  if (res.status !== 0 && res.status !== 1)
    throw new Error(`git check-ignore failed: ${res.stderr}`);
  return new Set(res.stdout.split('\n').filter(Boolean));
}

/** References that deliberately name something that is not a file in this tree. Keyed by
 *  instruction file, then token; each value says why. A row whose reference is gone fails
 *  the stale-exemption case below, so this table cannot outlive what it excuses. */
const EXEMPT: Record<string, Record<string, string>> = {
  '.claude/skills/asset-pipeline/SKILL.md': {
    'preview/held_attack.png': 'pipeline output under tmp/asset_pipeline/<job>/',
    'held_hero/right/attack.png': 'pipeline output under tmp/asset_pipeline/<job>/',
  },
  'scripts/asset_pipeline/CLAUDE.md': {
    'public/models/chars/skins/': 'created by the cosmetic-body lane on --apply',
    'library/thumbs/': 'pipeline output under tmp/asset_pipeline/',
    'preview_model/': 'pipeline output under tmp/asset_pipeline/<job>/',
    'held_hero/right/attack.png': 'pipeline output under tmp/asset_pipeline/<job>/',
  },
  '.claude/skills/extract-and-test/SKILL.md': {
    'threat_table.ts': 'a naming example',
    'helpers.ts': 'a naming anti-example',
    'utils.ts': 'a naming anti-example',
  },
  '.claude/skills/release-merge-audit/SKILL.md': {
    'upstream/': 'a git remote name prefix',
    'up/': 'a git remote name prefix',
  },
  'scripts/assets/CLAUDE.md': {
    'bin/': 'the bin/ of an expanded KTX-Software release package',
  },
  'server/parse/CLAUDE.md': {
    'contract/types.ts': 'the woc-parse-service file this directory vendors',
  },
  'src/CLAUDE.md': { 'src/world_api/index.ts': 'named as deliberately absent' },
  'src/world_api/CLAUDE.md': { 'src/world_api/index.ts': 'named as deliberately absent' },
  'src/sim/professions/CLAUDE.md': { 'action_throttle.ts': 'a retired module, named on purpose' },
  'src/styles/CLAUDE.md': {
    'window_frame.ts': 'the reverted module the doc warns against resurrecting',
  },
};

describe('instruction_refs rules', () => {
  const index = buildIndex([
    'src/sim/sim.ts',
    'src/render/nameplate_combo.ts',
    'tests/server/perf_gate.test.ts',
    'server/parse/contract.ts',
  ]);
  const scripts = new Set(['gate', 'native:sync']);
  const check = (file: string, text: string) =>
    unresolvedRefs({ file, refs: extractRefs(text), index, scripts }).map((r) => r.token);

  it('checks a repo-rooted path strictly, from the root or the file directory, never by suffix', () => {
    expect(check('CLAUDE.md', '`src/sim/sim.ts` `src/sim/gone.ts`')).toEqual(['src/sim/gone.ts']);
    // `server/` is a top-level dir, so this is rooted: the suffix match in tests/ must not count.
    expect(check('CLAUDE.md', '`server/perf_gate.test.ts`')).toEqual(['server/perf_gate.test.ts']);
    expect(check('tests/CLAUDE.md', '`server/perf_gate.test.ts`')).toEqual([]);
    expect(check('tests/CLAUDE.md', '`src/sim/sim.ts`')).toEqual([]);
  });

  it('resolves an extensionless module specifier from the root or the file directory', () => {
    expect(check('tests/CLAUDE.md', '`src/render/nameplate_combo`')).toEqual([]);
    expect(check('tests/CLAUDE.md', '`server/perf_gate`')).toEqual([]);
    expect(check('CLAUDE.md', '`src/render/gone_module`')).toEqual(['src/render/gone_module']);
  });

  it('resolves a non-rooted path by a whole-segment suffix only', () => {
    expect(check('CLAUDE.md', '`sim/sim.ts`')).toEqual([]);
    expect(check('CLAUDE.md', '`im/sim.ts` `sim/gone.ts`')).toEqual(['im/sim.ts', 'sim/gone.ts']);
  });

  it('checks bare source-module names against every basename', () => {
    expect(check('CLAUDE.md', '`nameplate_combo.ts` `nameplate_gone.ts`')).toEqual([
      'nameplate_gone.ts',
    ]);
  });

  it('checks npm and pnpm scripts exactly, reading only a trailing colon as a glob', () => {
    expect(check('CLAUDE.md', '`npm run gate` `npm run native:*`')).toEqual([]);
    expect(check('CLAUDE.md', '`npm run gat` `npm run native` `pnpm run gone`')).toEqual([
      'gat',
      'native',
      'gone',
    ]);
  });

  it('skips placeholders, ranges, URLs, flags, remote refs, home, absolute, and scratch paths', () => {
    const skipped = [
      'src/<x>.ts',
      '{a}/b.ts',
      'parity_a..g.test.ts',
      '../a.ts',
      'https://x.y/a.ts',
      '--out/x.ts',
      'origin/release/',
      '~/x/a.ts',
      '/abs/a.ts',
      '$HOME/a.ts',
      '@scope/a.ts',
      'a|b/c.ts',
      'a=b/c.ts',
      'src/x/*.ts',
      'tmp/a.ts',
      'dist/a.js',
      'dist-env/a.cjs',
    ];
    expect(check('CLAUDE.md', skipped.map((t) => `\`${t}\``).join(' '))).toEqual([]);
  });

  it('skips only the dist output directories, not every name that starts with "dist"', () => {
    expect(check('CLAUDE.md', '`district/a.ts` `distance_gone.ts`')).toEqual([
      'district/a.ts',
      'distance_gone.ts',
    ]);
  });

  it('normalizes anchors, line suffixes, wrapping punctuation, and a leading ./', () => {
    expect(
      check(
        'CLAUDE.md',
        '`src/sim/sim.ts#L1` `src/sim/sim.ts:12` `(src/sim/sim.ts),` `./src/sim/sim.ts`',
      ),
    ).toEqual([]);
    expect(check('CLAUDE.md', '`src/sim/gone.ts:12-20`')).toEqual(['src/sim/gone.ts']);
  });

  it('reports the line and kind of each reference', () => {
    expect(extractRefs('intro\nrun `npm run gate` on `src/a.ts` and `b.mjs`')).toEqual([
      { line: 2, kind: 'script', token: 'gate' },
      { line: 2, kind: 'path', token: 'src/a.ts' },
      { line: 2, kind: 'module', token: 'b.mjs' },
    ]);
  });

  it('recognizes every instruction-file class and nothing near it', () => {
    for (const file of [
      'CLAUDE.md',
      'src/ui/CLAUDE.md',
      'AGENTS.md',
      'deep/AGENTS.md',
      '.claude/agents/qa-checklist.md',
      '.claude/skills/qa/SKILL.md',
      '.agents/skills/woc-qa/SKILL.md',
      'docs/qa-gate.md',
      'docs/ai-architecture.md',
      'docs/codex.md',
    ]) {
      expect(isInstructionFile(file), file).toBe(true);
    }
    for (const file of [
      'MY_CLAUDE.md',
      'CLAUDE.md.bak',
      '.claude/agents/sub/x.md',
      '.claude/skills/qa/README.md',
      '.agents/skills/woc-qa/references/x.md',
      'docs/other.md',
      'nested/docs/qa-gate.md',
    ]) {
      expect(isInstructionFile(file), file).toBe(false);
    }
  });

  it('lists tracked and untracked files, minus unstaged deletes, once each', () => {
    const answers: Record<string, string[]> = {
      'ls-files --deleted': ['b.ts'],
      'ls-files --cached --others --exclude-standard': ['a.md', 'b.ts', 'new.ts', 'a.md'],
    };
    expect(listRepoFiles((args) => answers[args.join(' ')] ?? [])).toEqual(['a.md', 'new.ts']);
  });

  it('reads a CRLF checkout the same as LF', () => {
    expect(nameOf(normalize('---\r\nname: qa-checklist\r\ntools: Read\r\n---\r\nbody'))).toBe(
      'qa-checklist',
    );
    expect(nameOf('---\r\nname: qa-checklist\r\n---\r\nbody')).toBeUndefined();
  });

  it('adds a top-level directory package.json to the root scripts', () => {
    const files = new Set(['package.json', 'bot/package.json']);
    const readScripts = (p: string) => (p === 'package.json' ? ['gate'] : ['start']);
    expect([...packageScriptsFor({ file: 'bot/CLAUDE.md', files, readScripts })]).toEqual([
      'gate',
      'start',
    ]);
    expect([...packageScriptsFor({ file: 'src/CLAUDE.md', files, readScripts })]).toEqual(['gate']);
    expect([...packageScriptsFor({ file: 'CLAUDE.md', files, readScripts })]).toEqual(['gate']);
  });
});

describe('instruction files', () => {
  type Miss = { file: string; line: number; kind: string; token: string };
  let scanned: string[] = [];
  let unexcused: Miss[] = [];

  // Built here rather than at collection, so a git failure fails these cases only and the
  // unit rules above still report.
  beforeAll(() => {
    const files = repoFiles();
    const fileSet = new Set(files);
    const index = buildIndex(files);
    // Any other listed file missing from disk fails loud in read(): never a silent skip.
    scanned = files.filter(isInstructionFile);
    const raw: Miss[] = scanned.flatMap((file) =>
      unresolvedRefs({
        file,
        refs: extractRefs(read(file)),
        index,
        scripts: packageScriptsFor({ file, files: fileSet, readScripts: scriptsOf }),
      }).map((r) => ({ file, ...r })),
    );
    // Only a path can be generated or local-only output; a script or module name never is.
    const local = (r: Miss) => path.posix.join(path.posix.dirname(r.file), r.token);
    const paths = raw.filter((r) => r.kind === 'path');
    const gitIgnored = ignored(paths.flatMap((r) => [r.token, local(r)]));
    unexcused = raw.filter(
      (r) => r.kind !== 'path' || (!gitIgnored.has(r.token) && !gitIgnored.has(local(r))),
    );
  });

  it('scan every instruction-file class', () => {
    for (const probe of [
      'CLAUDE.md',
      'AGENTS.md',
      '.claude/agents/qa-checklist.md',
      '.claude/skills/qa/SKILL.md',
      '.agents/skills/woc-qa/SKILL.md',
      'docs/qa-gate.md',
      'docs/ai-architecture.md',
      'docs/codex.md',
      'src/sim/CLAUDE.md',
    ]) {
      expect(scanned, probe).toContain(probe);
    }
  });

  it('name only paths, modules, and npm scripts that exist', () => {
    const drift = unexcused
      .filter((r) => EXEMPT[r.file]?.[r.token] === undefined)
      .map((r) => `${r.file}:${r.line} ${r.kind} \`${r.token}\``);
    expect(
      drift,
      'Fix each reference, or, if it deliberately names a non-file (an output, an example, ' +
        'an external repo), add an EXEMPT row with the reason',
    ).toEqual([]);
  });

  it('carry no exemption whose reference is gone', () => {
    const stale = Object.entries(EXEMPT).flatMap(([file, tokens]) =>
      Object.keys(tokens)
        .filter((token) => !unexcused.some((r) => r.file === file && r.token === token))
        .map((token) => `${file} \`${token}\``),
    );
    expect(stale, 'Remove each EXEMPT row whose reference no longer appears').toEqual([]);
  });
});

describe('the agent and skill roster', () => {
  const agents = readdirSync(path.join(root, '.claude/agents'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3))
    .sort();
  const skills = readdirSync(path.join(root, '.claude/skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const frontmatterName = (rel: string) => nameOf(read(rel));
  /** One `## heading` section of a doc, up to the next `## ` heading. */
  const section = (doc: string, heading: string) => {
    const start = doc.indexOf(`\n## ${heading}\n`);
    expect(start, `the "${heading}" section moved`).toBeGreaterThan(-1);
    const end = doc.indexOf('\n## ', start + 1);
    return doc.slice(start, end === -1 ? undefined : end);
  };
  /** The backticked names in one column of a section's table body rows (header skipped). */
  const column = (text: string, index: number) =>
    text
      .split('\n')
      .filter((l) => l.startsWith('| ') && !/^\|[-|\s]+\|$/.test(l))
      .slice(1)
      .flatMap((row) => [...(row.split('|')[index] ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1]));

  it('names every agent and skill after its file', () => {
    expect(agents.length).toBeGreaterThan(0);
    expect(skills.length).toBeGreaterThan(0);
    for (const a of agents) expect(frontmatterName(`.claude/agents/${a}.md`), a).toBe(a);
    for (const s of skills) expect(frontmatterName(`.claude/skills/${s}/SKILL.md`), s).toBe(s);
  });

  it('catalogs exactly the agents and skills that exist, in docs/ai-architecture.md', () => {
    const doc = read('docs/ai-architecture.md');
    expect([...column(section(doc, 'Reviewers'), 1)].sort()).toEqual(agents);
    expect([...column(section(doc, 'Skills'), 1)].sort()).toEqual(skills);
  });

  it('routes only to roles that exist (docs/qa-gate.md "Reviewer coverage")', () => {
    const table = section(read('docs/qa-gate.md'), 'Reviewer coverage');
    const claude = column(table, 2);
    expect(claude.length).toBeGreaterThan(0);
    expect(claude.filter((n) => !agents.includes(n))).toEqual([]);
    const codex = column(table, 3);
    expect(codex.length).toBeGreaterThan(0);
    const missing = codex.filter((n) =>
      n.startsWith('$')
        ? !existsSync(path.join(root, '.agents/skills', n.slice(1), 'SKILL.md'))
        : !existsSync(path.join(root, '.codex/agents', `${n}.toml`)),
    );
    expect(missing).toEqual([]);
  });
});
