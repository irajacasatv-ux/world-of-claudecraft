// The review scope every reviewer agent and the /qa skill start from
// (scripts/lib/review_scope.mjs, printed by scripts/review_scope.mjs).
//
// Guards: the exact git calls the scope makes (the integration base resolveSelectBase picks,
// a merge-base, one rename-splitting working-tree diff, one untracked listing, and nothing
// else, so no form of `@{upstream}` can creep back in); the union of committed, staged,
// unstaged, and untracked files, sorted and deduplicated; fail-loud on an unresolvable base
// or a failed git call; and the CLI's two outputs and its exit status. The nearest suite,
// tests/ci_changed_base.test.ts, pins the shared base resolver and the shell-free git
// runner, not these.
// Cost: 300 ms
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveReviewScope } from '../scripts/lib/review_scope.mjs';

type Result = { status: number | null; stdout?: string; error?: Error };

/** A fake git keyed by the joined argument list; unknown calls fail the probe. */
function fakeGit(answers: Record<string, Result>) {
  const calls: string[][] = [];
  const run = (cmd: string, args: string[]): Result => {
    calls.push([cmd, ...args]);
    return answers[args.join(' ')] ?? { status: 1, stdout: '' };
  };
  return { run, calls };
}

const RELEASES =
  'for-each-ref --format=%(refname:short) --sort=-v:refname refs/remotes/origin/release';

const baseAnswers = (extra: Record<string, Result> = {}): Record<string, Result> => ({
  [RELEASES]: { status: 0, stdout: 'origin/release/v0.45.0\norigin/release/v0.44.2\n' },
  'rev-parse --verify origin/release/v0.45.0^{commit}': { status: 0, stdout: 'abc\n' },
  'merge-base HEAD origin/release/v0.45.0': { status: 0, stdout: 'mb123\n' },
  'diff --name-only --no-renames -z mb123': { status: 0, stdout: 'src/b.ts\0CLAUDE.md\0' },
  'ls-files --others --exclude-standard -z': { status: 0, stdout: 'src/new.ts\0src/b.ts\0' },
  ...extra,
});

describe('resolveReviewScope', () => {
  it('scopes against the newest release branch with exactly these git calls', () => {
    const { run, calls } = fakeGit(baseAnswers());
    expect(resolveReviewScope({ run })).toEqual({
      base: 'origin/release/v0.45.0',
      mergeBase: 'mb123',
      files: ['CLAUDE.md', 'src/b.ts', 'src/new.ts'],
    });
    // The whole call list, not a spelling check: any extra call (an `@{u}` probe, a
    // `..HEAD` range that drops uncommitted edits, a rename-hiding diff) fails here.
    expect(calls).toEqual([
      ['git', ...RELEASES.split(' ')],
      ['git', 'rev-parse', '--verify', 'origin/release/v0.45.0^{commit}'],
      ['git', 'merge-base', 'HEAD', 'origin/release/v0.45.0'],
      ['git', 'diff', '--name-only', '--no-renames', '-z', 'mb123'],
      ['git', 'ls-files', '--others', '--exclude-standard', '-z'],
    ]);
  });

  it('honors the GATE_SELECT_BASE override with exactly these git calls', () => {
    const { run, calls } = fakeGit({
      'rev-parse --verify feature/base^{commit}': { status: 0, stdout: 'def\n' },
      'merge-base HEAD feature/base': { status: 0, stdout: 'mb456\n' },
      'diff --name-only --no-renames -z mb456': { status: 0, stdout: 'server/x.ts\0' },
      'ls-files --others --exclude-standard -z': { status: 0, stdout: '' },
    });
    expect(resolveReviewScope({ env: { GATE_SELECT_BASE: 'feature/base' }, run })).toEqual({
      base: 'feature/base',
      mergeBase: 'mb456',
      files: ['server/x.ts'],
    });
    expect(calls).toEqual([
      ['git', 'rev-parse', '--verify', 'feature/base^{commit}'],
      ['git', 'merge-base', 'HEAD', 'feature/base'],
      ['git', 'diff', '--name-only', '--no-renames', '-z', 'mb456'],
      ['git', 'ls-files', '--others', '--exclude-standard', '-z'],
    ]);
  });

  it('fails loud when no integration base resolves', () => {
    const { run } = fakeGit({ [RELEASES]: { status: 0, stdout: '' } });
    expect(() => resolveReviewScope({ run })).toThrow(/could not resolve an integration base/);
  });

  it('fails loud when HEAD shares no history with the base', () => {
    const missing = baseAnswers();
    delete missing['merge-base HEAD origin/release/v0.45.0'];
    expect(() => resolveReviewScope({ run: fakeGit(missing).run })).toThrow(/no merge-base/);
    const empty = baseAnswers({
      'merge-base HEAD origin/release/v0.45.0': { status: 0, stdout: '\n' },
    });
    expect(() => resolveReviewScope({ run: fakeGit(empty).run })).toThrow(/no merge-base/);
  });

  it('fails loud when the diff or the untracked listing fails', () => {
    const noDiff = baseAnswers();
    delete noDiff['diff --name-only --no-renames -z mb123'];
    expect(() => resolveReviewScope({ run: fakeGit(noDiff).run })).toThrow(/git diff/);
    const noUntracked = baseAnswers();
    delete noUntracked['ls-files --others --exclude-standard -z'];
    expect(() => resolveReviewScope({ run: fakeGit(noUntracked).run })).toThrow(/untracked/);
  });
});

describe('scripts/review_scope.mjs', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  // HEAD as the base works in any clone (no remote refs needed): the merge-base is HEAD.
  const cli = (args: string[], base: string) =>
    spawnSync(process.execPath, [path.join(root, 'scripts/review_scope.mjs'), ...args], {
      cwd: root,
      encoding: 'utf8',
      // No optional index refresh, so the test never contends for .git/index.lock.
      env: { ...process.env, GATE_SELECT_BASE: base, GIT_OPTIONAL_LOCKS: '0' },
    });

  it('prints the merge-base commit with --base', () => {
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
    const res = cli(['--base'], 'HEAD');
    expect(res.status).toBe(0);
    expect(res.stdout.trim()).toBe(head.stdout.trim());
  });

  it('exits 1 with a named error when the base does not resolve', () => {
    const res = cli([], 'refs/heads/no-such-branch-for-review-scope');
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/^\[review_scope\] review scope: could not resolve/m);
    expect(res.stdout).toBe('');
  });
});
