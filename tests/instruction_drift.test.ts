// The instruction-file drift guard. Instruction files (every CLAUDE.md and AGENTS.md, the
// .claude agents and skills, the .agents skills, and the AI-architecture docs) are read by
// every AI session that works in their area, so a name in them that no longer resolves
// misleads every later contributor. The writing standard and the maintenance loop live in
// docs/ai-architecture.md; judgment-level drift (a claim the code contradicts) is the
// docs-librarian agent's job, and this file is the mechanical floor under it.
//
// Guards: every path, source-module name, and npm script an instruction file names in
// backticks resolves in the tree (rules in scripts/lib/instruction_refs.mjs); every
// exemption below still matches a real reference; every agent and skill is named after its
// file and cataloged in docs/ai-architecture.md; every reviewer the docs/qa-gate.md
// coverage table names exists.
// Cost: 400 ms
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  extractRefs,
  isInstructionFile,
  unresolvedRefs,
} from '../scripts/lib/instruction_refs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');

/** Tracked files plus untracked ones that are not ignored, so a file created in the same
 *  change resolves before it is staged. */
function repoFiles(): string[] {
  const res = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
    shell: false,
  });
  if (res.status !== 0) throw new Error(`git ls-files failed: ${res.stderr}`);
  return [...new Set(res.stdout.split('\n').filter(Boolean))];
}

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

  it('checks repo-rooted paths strictly and never by suffix', () => {
    expect(check('CLAUDE.md', '`src/sim/sim.ts` `src/sim/gone.ts`')).toEqual(['src/sim/gone.ts']);
    // `sim/sim.ts` is not rooted (no top-level `sim/`), so a suffix match is enough.
    expect(check('CLAUDE.md', '`sim/sim.ts`')).toEqual([]);
  });

  it('resolves a path from the instruction file own directory, and module specifiers', () => {
    expect(check('server/parse/CLAUDE.md', '`contract.ts`')).toEqual([]);
    expect(check('tests/CLAUDE.md', '`server/perf_gate`')).toEqual([]);
    expect(check('CLAUDE.md', '`src/render/nameplate_combo`')).toEqual([]);
  });

  it('checks bare source-module names against every basename', () => {
    expect(check('CLAUDE.md', '`nameplate_combo.ts` `nameplate_gone.ts`')).toEqual([
      'nameplate_gone.ts',
    ]);
  });

  it('checks npm scripts, reading a trailing colon as a glob', () => {
    expect(check('CLAUDE.md', '`npm run gate` `npm run native:*` `npm run gone`')).toEqual([
      'gone',
    ]);
  });

  it('skips placeholders, ranges, URLs, flags, remote refs, and scratch output', () => {
    expect(
      check(
        'CLAUDE.md',
        '`src/<x>.ts` `{a}/b.ts` `parity_a..g.test.ts` `https://x.y/a.ts` `--out/x.ts` `origin/release/` `tmp/a.ts` `dist/a.js`',
      ),
    ).toEqual([]);
  });
});

describe('instruction files', () => {
  const files = repoFiles();
  const index = buildIndex(files);
  const rootScripts = Object.keys(JSON.parse(read('package.json')).scripts ?? {});
  const fileSet = new Set(files);

  const raw = files.filter(isInstructionFile).flatMap((file) => {
    const scripts = new Set(rootScripts);
    const top = file.split('/')[0];
    if (file.includes('/') && fileSet.has(`${top}/package.json`)) {
      for (const s of Object.keys(JSON.parse(read(`${top}/package.json`)).scripts ?? {})) {
        scripts.add(s);
      }
    }
    return unresolvedRefs({ file, refs: extractRefs(read(file)), index, scripts }).map((r) => ({
      file,
      ...r,
    }));
  });
  const local = (r: { file: string; token: string }) =>
    path.posix.join(path.posix.dirname(r.file), r.token);
  const gitIgnored = ignored(raw.flatMap((r) => [r.token, local(r)]));
  const unexcused = raw.filter((r) => !gitIgnored.has(r.token) && !gitIgnored.has(local(r)));

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
  const frontmatterName = (rel: string) =>
    read(rel).match(/^---\n[\s\S]*?^name:\s*(\S+)\s*$/m)?.[1];

  it('names every agent and skill after its file', () => {
    for (const a of agents) expect(frontmatterName(`.claude/agents/${a}.md`), a).toBe(a);
    for (const s of skills) expect(frontmatterName(`.claude/skills/${s}/SKILL.md`), s).toBe(s);
  });

  it('catalogs every agent and skill in docs/ai-architecture.md', () => {
    const catalog = read('docs/ai-architecture.md');
    const missing = [...agents, ...skills].filter((n) => !catalog.includes(`\`${n}\``));
    expect(missing, 'Add a catalog row for each new agent or skill').toEqual([]);
  });

  it('routes only to reviewers that exist (docs/qa-gate.md "Reviewer coverage")', () => {
    const doc = read('docs/qa-gate.md');
    const start = doc.indexOf('## Reviewer coverage');
    expect(start, 'the Reviewer coverage section moved').toBeGreaterThan(-1);
    const rows = doc
      .slice(start)
      .split('\n')
      .filter((l) => l.startsWith('| ') && !l.startsWith('| Concern') && !l.startsWith('|---'));
    const named = rows.flatMap((row) =>
      [...(row.split('|')[2] ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    );
    expect(named.length).toBeGreaterThan(0);
    expect(named.filter((n) => !agents.includes(n))).toEqual([]);
  });
});
