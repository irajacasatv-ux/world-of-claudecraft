// The review scope every reviewer agent and the /qa skill start from
// (scripts/lib/review_scope.mjs, printed by scripts/review_scope.mjs).
//
// Guards: the scope is taken against the integration base resolveSelectBase picks, never
// `@{upstream}` (empty the moment a branch is pushed); it unions committed, staged,
// unstaged, and untracked files, sorted and deduplicated; an unresolvable base or a failed
// git call fails loud instead of returning an empty scope.
// Cost: 140 ms
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
  'diff --name-only mb123': { status: 0, stdout: 'src/b.ts\nCLAUDE.md\n' },
  'ls-files --others --exclude-standard': { status: 0, stdout: 'src/new.ts\nsrc/b.ts\n' },
  ...extra,
});

describe('resolveReviewScope', () => {
  it('scopes against the newest release branch and unions every kind of change', () => {
    const { run, calls } = fakeGit(baseAnswers());
    expect(resolveReviewScope({ run })).toEqual({
      base: 'origin/release/v0.45.0',
      mergeBase: 'mb123',
      files: ['CLAUDE.md', 'src/b.ts', 'src/new.ts'],
    });
    // The working-tree diff against the merge-base is what carries staged and unstaged
    // edits; a `..HEAD` range would drop them.
    expect(calls).toContainEqual(['git', 'diff', '--name-only', 'mb123']);
  });

  it('never consults @{upstream}, which is empty once a branch is pushed', () => {
    const { run, calls } = fakeGit(baseAnswers());
    resolveReviewScope({ run });
    expect(calls.flat().some((arg) => arg.includes('upstream'))).toBe(false);
  });

  it('honors the GATE_SELECT_BASE override', () => {
    const { run } = fakeGit(
      baseAnswers({
        'rev-parse --verify feature/base^{commit}': { status: 0, stdout: 'def\n' },
        'merge-base HEAD feature/base': { status: 0, stdout: 'mb456\n' },
        'diff --name-only mb456': { status: 0, stdout: 'server/x.ts\n' },
        'ls-files --others --exclude-standard': { status: 0, stdout: '' },
      }),
    );
    expect(resolveReviewScope({ env: { GATE_SELECT_BASE: 'feature/base' }, run })).toEqual({
      base: 'feature/base',
      mergeBase: 'mb456',
      files: ['server/x.ts'],
    });
  });

  it('fails loud when no integration base resolves', () => {
    const { run } = fakeGit({ [RELEASES]: { status: 0, stdout: '' } });
    expect(() => resolveReviewScope({ run })).toThrow(/could not resolve an integration base/);
  });

  it('fails loud when HEAD shares no history with the base', () => {
    const answers = baseAnswers();
    delete answers['merge-base HEAD origin/release/v0.45.0'];
    expect(() => resolveReviewScope({ run: fakeGit(answers).run })).toThrow(/no merge-base/);
  });

  it('fails loud when the diff or the untracked listing fails', () => {
    const noDiff = baseAnswers();
    delete noDiff['diff --name-only mb123'];
    expect(() => resolveReviewScope({ run: fakeGit(noDiff).run })).toThrow(/git diff/);
    const noUntracked = baseAnswers();
    delete noUntracked['ls-files --others --exclude-standard'];
    expect(() => resolveReviewScope({ run: fakeGit(noUntracked).run })).toThrow(/untracked/);
  });
});
