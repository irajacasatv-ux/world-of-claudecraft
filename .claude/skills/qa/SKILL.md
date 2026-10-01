---
name: qa
description: Run the full end-of-contribution QA review over the current change (the qa-checklist gate, the test-coverage auditor, and the domain reviewers it names).
user-invocable: true
---

You are running the project's end-of-contribution QA gate. Do this now, before the change is
called done.

1. Scope the review with `node scripts/review_scope.mjs`: the branch's changes against its
   integration base (the newest `origin/release/*`, which work is based off; `main` trails it),
   plus staged, unstaged, and untracked work. `--base` prints the merge-base for a full
   `git diff`. Never scope against `@{upstream}`: a pushed branch tracks its own remote copy,
   so that scope is empty. On a branch stacked on another feature branch, the base is the
   parent: run `GATE_SELECT_BASE=<parent> node scripts/review_scope.mjs`, and put the same
   base in every reviewer's brief (a subagent does not inherit your shell's environment). If
   the user passed an argument (a feature name, phase, or file list), use it to focus the
   scope.

2. Dispatch the `qa-checklist` agent over that scope. It is the read-only gate: it scales its
   own depth to the size of the change, checks every repo invariant in play, and ends with an
   adversarial "what is missing" pass. Let it run; do not duplicate its work inline.

3. If the change is more than a trivial single-surface edit, also dispatch
   `test-coverage-auditor` in parallel with `qa-checklist`, and brief `qa-checklist` to
   cover plain correctness bugs and dead code the change left behind. Prompt every reviewer
   for COVERAGE (report every gap with confidence and severity), not filtering.

4. Dispatch the domain reviewer agents that `qa-checklist` names for the surfaces this diff
   touches (for example `privacy-security-review`, `migration-safety`,
   `database-performance-reviewer` for SQL, indexes, query call sites, pool or lock behavior,
   timeout policy, or stored-data growth, `cross-platform-sync`,
   `architecture-reviewer`, and on a release branch `release-malware-audit`). Spawn them fresh;
   never have the implementer review its own work.

5. Run the deterministic floor yourself so the verdict rests on green checks, not only agent
   reasoning: `npm run ci:changed` (Biome on the changed files), `npx tsc --noEmit`, and
   `npx vitest run tests/architecture.test.ts tests/localization_fixes.test.ts`. Report any red.

6. Confirm each consequential finding against the code before acting on it; this is the
   filtering pass the reviewers leave to you. Then fix every BLOCKING and SHOULD-FIX finding, in
   focused commits. Fix commits are unreviewed code: send each fix round back to fresh
   reviewers (the ones whose surface it touches) until a round returns no SHOULD-FIX, and give
   each reader a tool budget so it reports instead of running out of turns. Report what you
   fixed and what remains as VERIFY (needs a run or E2E) or NICE-TO-HAVE.

End with a one-line verdict: READY or NOT READY, and the list of any VERIFY items the maintainer
still has to run by hand (for example `npm run perf:tour`, `npm run test:browser`, or the mobile E2E
scripts). READY is advisory judgment; `node scripts/gate_select.mjs` is the deterministic pre-merge
contract (same step list as `npm run gate` with a selective test substitution; release tier on
`release/**`; see `docs/qa-gate.md`), so if neither it nor a watched-green CI run whose pr-gate test
legs ran, on the pushed tip of a branch cleared for pushing, has passed this session, list it as the
first VERIFY item. `npm run gate` remains the deeper full-suite check when you want it.
