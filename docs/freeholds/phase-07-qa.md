# Phase 07 QA: audit persistence

Audits `phase-07-persistence.md`. Verdict goes in `progress.md` (row "07 QA"). The next
implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 07 (QA) of the Freeholds and Guildhalls feature: audit persistence (the
account_freeholds row, the fresh-join read, normalize and serialize, the rev-fenced save
path, export and delete, the offline default pin).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 07 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "07 Persistence", missing tests, dead code,
determinism, the persistence gate (additive DDL, back-compat, index, keep-forever,
export, cascade, the pg-armed twin), the never-destroys rule, the D16 rule that offline
and headless hosts persist nothing, and the monolith ratchet; fix what the audit finds;
record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog (prove tests RAN; a pg-armed suite
  that skips is not a pass), the Postgres gotcha cluster, "review the review-fix round",
  "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("07 Persistence" and the row),
  docs/freeholds/phase-07-persistence.md (what was promised)
- the Phase 07 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 07)
- the pins the diff claims: tests/server/freehold_db.test.ts,
  tests/server/freehold_db.pg.test.ts, tests/server/freehold_persist.test.ts,
  tests/freehold_state.test.ts, tests/freehold_offline_default.test.ts,
  tests/freehold_dev_grant.test.ts, tests/server/main_retention_wiring.test.ts,
  tests/monolith_budget.test.ts
- the seams the diff joined: server/db.ts ensureSchema order and exportAccountData,
  server/ws_auth.ts fresh-join arm, server/periodic_save_flush.ts, src/sim/sim.ts addPlayer,
  src/sim/dev_commands.ts handleDevChat (the /dev freehold arm and its devCommands gate)
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts and whether the
pg-armed twin actually RAN (the describe.skip arm is silent), the DDL text as written,
and any TODO, unused import, or field the row stores that nothing reads.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the DDL is
  additive and idempotent and re-applies cleanly on a second boot; every JSONB column has
  its CHECK; the ledger_paid_week index exists; the keep-forever comment is in the DDL, not
  only in a test; the CAS upsert is ONE statement and a stale rev is refused rather than
  merged; the fresh-join read is one round trip and a resume reloads nothing; two
  characters of one account share one live record; eviction fires only after the last
  character leaves; normalizeFreehold drops fields and never the house; day and week
  stamps are realm-calendar integers re-anchored on a future value, hearth_key_ready_ms
  sits in the host clock base, and no code subtracts a foreign clock; last_seen_day is
  written at join and at leave; /dev freehold <tier> goes through the one setter on
  both dev paths and is refused without ALLOW_DEV_COMMANDS=1; a fresh
  offline Sim (constructed the way src/main.ts constructs it) and the headless env start
  with the default Inn Room record, and no code path under src/game/, src/main.ts,
  src/net/, or headless/ writes storage for the freehold; the export row is present and
  the cascade proven; the extractions are move-not-rewrite (diff the moved bodies);
  nothing per tick touches the pool.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (DDL
  literals pinned as fresh strings, not read back from the module; the CAS refusal
  asserts the refused verdict AND that the stored row is unchanged; one negative case per
  normalize arm, per dimension, each proving the OTHER fields survive; the pg suite
  asserts it ran when TEST_DATABASE_URL is set; the cross-clock pin exercises the
  re-anchor; the same-seed determinism case has a work-happened anchor; the offline
  default pin builds the Sim with the real main.ts constructor shape and asserts the
  record's tier, plinths, and condition by literal; the no-storage scan strips comments,
  lists the files it scanned, and fails closed on an unreadable file rather than
  passing on an empty set); orphaned tests; missing negative cases (a future
  condition_stamp_day, a negative ledger_paid_week, prepaid_weeks of 5, a NaN condition,
  a far-future hearth_key_ready_ms, an unknown visit_policy, an unknown tier string, a
  layout that is not an object, /dev freehold with an unknown tier).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, a column the row stores that no code reads without a stated owner
  phase, the word "phase" in any code, comment, or commit message, em dashes or emojis,
  generated files hand-edited, src/sim/freehold/CLAUDE.md updated for state.ts, the
  monolith ceilings lowered and not raised.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (migration-safety, database-performance-reviewer,
privacy-security-review, server-hot-path-reviewer, architecture-reviewer for the
src/sim/ slice, test-coverage-auditor), and finally qa-checklist (the completion gate),
all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 07 STEP 3 suite list plus `npx tsc --noEmit`, including the pg-armed twin
  with `npm run db:up` and TEST_DATABASE_URL set; confirm from the vitest summary that the
  pg suite reported passed tests, not skipped ones.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 07 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "07 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-08-layout-and-placement-sim.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 07 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
