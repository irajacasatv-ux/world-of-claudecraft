# Phase 07c QA: audit account first-tier arrival eligibility

Audits [phase-07c-arrival-eligibility.md](phase-07c-arrival-eligibility.md). The implementation's exact five-or-fewer deliverables,
state.md decisions and ux-spec.md are the acceptance contract.

### Starter Prompt
```
This is Phase 07c QA of the Freeholds and Guildhalls feature: account first-tier arrival eligibility.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block and its effort/fan-out rules.

Goal: verify every promised behavior and artifact, apply ALL findings including nits,
and have a second fresh reviewer verify the fix round before recording a verdict.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Follow state.md "Worktree, base, and merge-forward": fetch origin --prune; merge the the
  newest release/**; release-merge-audit after non-empty merge and frozen install if
  patches/ moved.
- Read root/directory CLAUDE.md. Memory scan: MEMORY.md, freeholds entry, test-pin traps,
  apply ALL findings, review the review-fix round. Preserve unrelated work.

STEP 1 - LOAD CONTEXT (agents only for planning docs and coordinators):
- An Explore agent reads phase-07c-arrival-eligibility.md, state.md, ux-spec.md, the content/art manifests,
  matching progress row and all actual implementation commits including the complete
  diff, tests and artifacts. It reports to a scratch file: promise/evidence matrix,
  new symbols and real consumers, mutation/authority paths, literal pins and missing arms.

STEP 2 - AUDIT:
- Spawn independent CORRECTNESS, TEST COVERAGE, and DEAD CODE/HYGIENE readers. Every
  report goes to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT and no
  filtering of nits or uncertain issues. Apply this exact coverage inventory:
  - Verify normalized schema, explicit account loader/insert writer and accepted tier
    allowlist separately from unknown/future stored-ID preservation. No whole-set rewrite.
  - Race same/different tier marks from two plots and processes; fault before insert,
    rollback (then retry on the same process: the mirror is unchanged and the retried
    insert wins) and commit-before-ACK. Assert exactly one durable mark, at-most-once optional
    eligibility and no guarantee of visual delivery. Guest/rejected/seen return writes zero.
  - Replay historical positive acceptance to a fresh client, resume same transition and
    deliver out-of-order frames; assert zero new first-tier directive/welcome cue. Distinct
    accepted returns receive one ordinary cue; render completion creates no authority.
  - Verify isolated offline/headless account fixture sets, no online-imported browser
    permission, full private mark-set exclusion and actual encoder evidence sentinels.
  - Exercise character delete, account soft-deactivate/restore, hard delete (cascade of
    marks under D88, refused while a 07a operation is open), sale/transfer,
    explicit safe exports, real FK/unique waits and no per-tick/snapshot SQL.
- Required domain COVERAGE review: database-performance-reviewer, migration-safety, privacy-security-review, server-hot-path-reviewer, architecture-reviewer, cross-platform-sync, test-coverage-auditor, qa-checklist.
  Database performance runs before new DB decisions and on the finished diff. Parent
  runs deterministic gates once; reviewers inspect their evidence.

STEP 3 - VALIDATION:
- npx tsc --noEmit; npx vitest run tests/server/freehold_arrival_db.test.ts
  tests/freehold_arrival_authority.test.ts tests/freehold_state.test.ts
  tests/architecture.test.ts tests/world_api_parity.test.ts. (08 creates
  tests/freehold_determinism.test.ts; it is not run here.)
- With TEST_DATABASE_URL set for the disposable private schema, npx vitest run
  tests/server/freehold_arrival_db.pg.test.ts tests/server/freehold_mutation.pg.test.ts.
- Verify literal query counts and actual mark outcomes under concurrent connection/process
  fixtures, account deletion/FK waits and rollback. Reconnect a new client after historical
  positive acceptance and assert zero new directive/cue rather than trusting client cache.
- Run actual export/account/character lifecycle, SimContext/headless and encoder suites
  found by the source census, plus all 05 bridge fixture tests affected by the mirror.
- Run every scoped command listed in the implementation file and node scripts/gate_select.mjs.
  A skipped PG suite is not a pass. Assert work happened, use literal expected outcomes,
  include controls that pass when a rejected precondition is removed, and never derive
  expected values from the production object under test.

STEP 4 - FIX:
- Apply ALL findings including nits; document a conflict with a locked decision and its
  ruling rather than silently dropping it. Rerun affected checks and a FRESH reviewer
  reads every fix, including evidence or screenshot changes. Commit fixes separately
  with scoped Conventional Commits and a body, explicit paths, never git add -A, no
  coauthor trailer and no word "phase" in messages. npm run ci:changed after last commit.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every implementation acceptance row has concrete passing evidence.
- [ ] All findings were resolved, and a fresh reviewer verified the entire fix round.
- [ ] Shared gate and mandatory scoped runtime/visual proof passed with exact outcomes.

STEP 6 - DOC UPDATES + MEMORY:
- Record progress.md 07c QA verdict PASS or FAIL, all found/fixed counts, commands,
  evidence and remaining external release gates. Update state ledger for changed facts.
- Preserve useful freeholds/test-pin memory within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
Return verdict, counts, files, commands/outcomes and reviewer verdicts, then the FULL PATH:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-08-layout-and-placement-sim.md

STOPPING RULES:
- FAIL names phase-07c-arrival-eligibility.md as the next rerun with findings attached. Never waive a required
  check or silently invent a balance value. No push, opened PR or PR merge.
```
