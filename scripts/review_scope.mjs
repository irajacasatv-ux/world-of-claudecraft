#!/usr/bin/env node
// Prints the review scope (scripts/lib/review_scope.mjs): the files the current change
// touches against the branch's integration base, including staged, unstaged, and
// untracked work, one per line.
//
//   node scripts/review_scope.mjs          the changed files
//   node scripts/review_scope.mjs --base   the merge-base commit, for `git diff <base>`
//
// GATE_SELECT_BASE=<ref> overrides the integration base, as it does for the gate.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveReviewScope } from './lib/review_scope.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {(cmd: string, args: string[]) => { status: number | null, stdout?: string, error?: Error }} */
function run(cmd, args) {
  // git is a real executable: no shell, or cmd.exe eats the caret in the base
  // resolver's `^{commit}` probes on Windows (tests/ci_changed_base.test.ts).
  const res = spawnSync(cmd, args, { encoding: 'utf8', shell: false, cwd: REPO_ROOT });
  return { status: res.status, stdout: res.stdout, error: res.error };
}

try {
  const scope = resolveReviewScope({ env: process.env, run });
  if (process.argv.includes('--base')) console.log(scope.mergeBase);
  else for (const file of scope.files) console.log(file);
} catch (err) {
  console.error(`[review_scope] ${err.message}`);
  process.exitCode = 1;
}
