// The review scope every read-only reviewer and the /qa skill start from: the files a
// change touches, measured against the branch's integration base, plus the work not yet
// committed. One resolver, so the reviewers, `npm run ci:changed` and the selective gate
// all agree on what "the change" is.
//
// The base is resolveSelectBase's (scripts/lib/gate_discovery.mjs): the GATE_SELECT_BASE
// override, then the newest `origin/release/*` by version sort, then `origin/main`, then
// `origin/HEAD`. Never
// `@{upstream}`: a pushed branch tracks its own remote copy, so a scope taken against the
// upstream is empty the moment the branch is pushed, and an empty scope makes every
// reviewer exit "out of scope" on a change it never read.
//
// `git diff --name-only --no-renames <merge-base>` compares the working tree with the
// merge-base, so it covers committed, staged, and unstaged changes in one call, and lists a
// rename by both ends (git's default rename detection would hide the old path, which is the
// one a reviewer greps the instruction files for); untracked files come from
// `git ls-files --others --exclude-standard`. Pure: takes an injected `run` (the
// resolveSelectBase shape) so a unit test never shells out.

import { resolveSelectBase } from './gate_discovery.mjs';

/** @typedef {(cmd: string, args: string[]) => { status: number | null, stdout?: string, error?: Error }} Run */

/** @param {string | undefined} stdout */
const lines = (stdout) =>
  (stdout ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * @param {{ env?: Record<string, string | undefined>, run: Run }} deps
 * @returns {{ base: string, mergeBase: string, files: string[] }}
 * @throws {Error} when no base resolves or a git call fails (fail loud, never a silently
 *   empty scope)
 */
export function resolveReviewScope({ env = {}, run }) {
  const { base, reason } = resolveSelectBase({ env, run });
  if (!base) throw new Error(`review scope: could not resolve an integration base (${reason})`);

  const mb = run('git', ['merge-base', 'HEAD', base]);
  const mergeBase = lines(mb.stdout)[0];
  if (mb.error !== undefined || mb.status !== 0 || !mergeBase) {
    throw new Error(`review scope: no merge-base between HEAD and ${base}`);
  }

  const diff = run('git', ['diff', '--name-only', '--no-renames', mergeBase]);
  if (diff.error !== undefined || diff.status !== 0) {
    throw new Error(`review scope: git diff against ${mergeBase} failed`);
  }
  const untracked = run('git', ['ls-files', '--others', '--exclude-standard']);
  if (untracked.error !== undefined || untracked.status !== 0) {
    throw new Error('review scope: git ls-files for untracked files failed');
  }

  const files = [...new Set([...lines(diff.stdout), ...lines(untracked.stdout)])].sort();
  return { base, mergeBase, files };
}
