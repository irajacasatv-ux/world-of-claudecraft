import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Byte-equivalence safety net for the i18n scaling refactor. Every
// behavior-preserving change must leave the resolved locale table byte-identical.
// The committed line-item locale slices (src/ui/i18n.resolved.generated/) are the
// anchor: this suite asserts they are tracked by git, regenerate byte-identically,
// and stay deterministic across perturbed-env runs.
// A drift here is a bug in the change, not grounds to re-baseline.
//
// ONE pair of generator runs serves every case. Each run emits the whole tree
// (every slice, the barrel, and the flat key union) into its own throwaway
// directory through the generator's I18N_OUT_DIR override, under a different
// TZ / LC_ALL / temp path (the pairs tests/helpers/i18n_determinism.ts uses). Both
// runs must equal the committed bytes, file set included: that is the freshness
// check (run A against the tree) and the determinism check (run B against the same
// bytes, so A and B agree) at once, without regenerating over the working tree.
// A clean working copy of the artifacts (`git diff --exit-code`, working tree
// against the index) makes "the tree" mean "what is committed", as the former
// regenerate-in-place check did. The pr-checks job's own `npm run i18n:gen` plus
// `git diff` step (docs/qa-gate.md, "Generated i18n artifacts") owns the same
// freshness in CI; what only this suite adds is the perturbed-env determinism.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildScript = path.join(root, 'scripts/i18n_build.mjs');
// The resolved table is a generated DIRECTORY of per-locale modules + a barrel
// (the per-locale emit split), not a single file. A directory pathspec makes both
// `git ls-files --error-unmatch` and `git diff --exit-code` cover every slice.
const generatedPath = 'src/ui/i18n.resolved.generated';
// The flat TranslationKey union is emitted by the SAME generator but lives in the
// catalog directory (its type is the catalog's public surface); it follows the
// same contract: tracked, regen-byte-identical, deterministic. In override mode
// (I18N_OUT_DIR set) the generator emits it INTO the override directory as
// translation_keys.generated.ts, so the perturbed-env runs below exercise this
// emit hermetically, never touching the committed file.
const keysPath = 'src/ui/i18n.catalog/translation_keys.generated.ts';
const KEYS_FILE = path.basename(keysPath);

// Distinct timezone, locale, and temp-dir prefix, so a hidden dependency on any
// of them produces a diff instead of a false pass.
const PERTURBATIONS = [
  { name: 'A', TZ: 'UTC', LC_ALL: 'C', LANG: 'C', prefix: 'i18n-det-a-' },
  {
    name: 'B',
    TZ: 'Asia/Kolkata',
    LC_ALL: 'en_US.UTF-8',
    LANG: 'en_US.UTF-8',
    prefix: 'zzz-i18n-det-b-',
  },
] as const;

interface Emit {
  name: string;
  files: string[];
  bytes: Map<string, Buffer>;
}

function listFilesRecursive(dir: string, rel = ''): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const childRel = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) out.push(...listFilesRecursive(dir, childRel));
    else out.push(childRel);
  }
  return out.sort();
}

function readTree(dir: string, files: string[]): Map<string, Buffer> {
  return new Map(files.map((f) => [f, readFileSync(path.join(dir, f))]));
}

const tempDirs: string[] = [];
const emits: Emit[] = [];
// What the generator must reproduce: the committed slices plus the key union
// under the name the override mode emits it as.
let committedFiles: string[] = [];
let committed = new Map<string, Buffer>();

beforeAll(() => {
  const sliceFiles = listFilesRecursive(path.join(root, generatedPath));
  committed = readTree(path.join(root, generatedPath), sliceFiles);
  committed.set(KEYS_FILE, readFileSync(path.join(root, keysPath)));
  committedFiles = [...committed.keys()].sort();
  for (const perturb of PERTURBATIONS) {
    const dir = mkdtempSync(path.join(tmpdir(), perturb.prefix));
    tempDirs.push(dir);
    execFileSync(process.execPath, [buildScript], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        I18N_OUT_DIR: dir,
        TZ: perturb.TZ,
        LC_ALL: perturb.LC_ALL,
        LANG: perturb.LANG,
      },
    });
    const files = listFilesRecursive(dir);
    emits.push({ name: perturb.name, files, bytes: readTree(dir, files) });
  }
}, 30_000);

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

// The emitted files whose bytes differ from `expected`, by name.
function differing(emit: Emit, expected: Map<string, Buffer>, names: string[]): string[] {
  return names.filter((f) => {
    const got = emit.bytes.get(f);
    const want = expected.get(f);
    return !got || !want || !got.equals(want);
  });
}

describe('i18n resolved-artifact reproducibility', () => {
  it('the generated dense artifact is committed (tracked by git)', () => {
    // An untracked artifact would leave the freshness assertion below comparing
    // against bytes nobody committed. Fail loudly if someone regenerates but
    // forgets to commit it. A directory pathspec errors only if NO file under
    // it is tracked.
    expect(() =>
      execFileSync('git', ['ls-files', '--error-unmatch', '--', generatedPath], {
        cwd: root,
        encoding: 'utf8',
      }),
    ).not.toThrow();
  });

  it('keeps the retired sha256 baseline out of version control', () => {
    // The aggregate baseline left version control in the degit change: a
    // re-committed copy would resurrect the guaranteed pairwise merge conflict
    // between concurrent key-adding PRs. Keep stderr captured so this expected
    // negative probe does not look like a gate failure in the combined log.
    const retiredShaPath = 'src/ui/i18n.resolved.sha256';
    const res = spawnSync('git', ['ls-files', '--error-unmatch', '--', retiredShaPath], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain(retiredShaPath);
    expect(res.error).toBeUndefined();
  });

  it('the working copy of both artifacts is what is committed (no unstaged drift)', () => {
    // Anchors "the tree" the regeneration cases compare against to the index:
    // a regenerated-but-unstaged slice, or a hand edit, fails here.
    expect(() =>
      execFileSync('git', ['diff', '--exit-code', '--', generatedPath, keysPath], {
        cwd: root,
        encoding: 'utf8',
      }),
    ).not.toThrow();
  });

  it('regenerating src/ui/i18n.resolved.generated/ reproduces the committed directory', () => {
    // The dense generated artifact is the tsc safety net and is committed. Like
    // the media manifest, it must regenerate byte-identically: a drift means the
    // generator is non-deterministic or the committed directory is stale. The
    // file SET is compared too, so a removed or added locale surfaces as well.
    const [a] = emits;
    expect(a?.files, `run ${a?.name} emitted a different file set`).toEqual(committedFiles);
    if (!a) return;
    const slices = committedFiles.filter((f) => f !== KEYS_FILE);
    expect(differing(a, committed, slices), 'stale or drifted slices').toEqual([]);
  });

  it('regenerates byte-identically across two perturbed-env runs (determinism)', () => {
    // The committed directory keeps the freshness check above; this ADDS the
    // stronger determinism guarantee: the second run, under a different TZ /
    // LC_ALL / temp path, must emit the same file set and the same bytes (a hidden
    // locale/timezone/path dependency would surface as a diff). The whole emitted
    // tree is compared, the flat key union included.
    expect(emits.map((e) => e.name)).toEqual(['A', 'B']);
    const [a, b] = emits;
    if (!a || !b) return;
    expect(b.files, 'the perturbed runs emitted different file sets').toEqual(a.files);
    expect(differing(b, a.bytes, a.files), 'bytes that moved with the environment').toEqual([]);
  });
});

describe('flat TranslationKey union reproducibility', () => {
  it('the generated key union is committed (tracked by git)', () => {
    // Same rationale as the resolved directory: an untracked union leaves the
    // freshness assertion below without a committed anchor. tsc also depends on
    // it: a fresh clone must typecheck without running the build first.
    expect(() =>
      execFileSync('git', ['ls-files', '--error-unmatch', '--', keysPath], {
        cwd: root,
        encoding: 'utf8',
      }),
    ).not.toThrow();
  });

  it('regenerating reproduces the committed key union', () => {
    // TranslationKey re-exports this union, so a stale file weakens (or falsely
    // strengthens) type checking repo-wide. Like the slices, it must regenerate
    // byte-identically from the catalog: a drift means the committed file is
    // stale or the emit is non-deterministic.
    const [a] = emits;
    if (!a) throw new Error('no generator run');
    expect(differing(a, committed, [KEYS_FILE]), 'stale key union').toEqual([]);
  });

  it('appears in the override directory byte-identically across perturbed runs', () => {
    // Pins BOTH halves of the override contract: the generator honors
    // I18N_OUT_DIR for the union emit (a union written anywhere else is missing
    // here), and the emitted bytes are identical across the two perturbed runs.
    for (const emit of emits) expect(emit.files, `run ${emit.name}`).toContain(KEYS_FILE);
    const [a, b] = emits;
    if (!a || !b) throw new Error('missing a generator run');
    expect(differing(b, a.bytes, [KEYS_FILE]), 'key union moved with the environment').toEqual([]);
  });
});
