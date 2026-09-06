# Phase 28 QA: audit the guild owner kind, the Meeting Hall, and the Hall Fund

Audits `phase-28-guild-owner-kind-and-hall-fund.md`. Verdict goes in `progress.md` (row
"28 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 28 (QA) of the Freeholds and Guildhalls feature: audit the guild owner
kind, the Meeting Hall, and the Hall Fund (the guildhall record and claim, rank
permissions, the tier and layout, the escrow and its persistence).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 28 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "28 The guild owner kind, the Meeting Hall,
the Hall Fund", missing tests, dead code, determinism, three-host parity, server
authority over rank and membership, persistence back-compat and the escrow-delta
merge, and the token firewall; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave C. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the Postgres cluster of the gotcha catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the STEP 1 decisions Phase 28 recorded),
  docs/freeholds/progress.md ("28 The guild owner kind, the Meeting Hall, the Hall Fund"
  and the row), docs/freeholds/phase-28-guild-owner-kind-and-hall-fund.md (what was
  promised)
- the Phase 28 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 28)
- the pins the diff claims: tests/freehold_guildhall.test.ts,
  tests/freehold_hall_fund.test.ts, tests/server/freehold_db.test.ts,
  tests/sim_context.test.ts, tests/world_api_parity.test.ts, tests/snapshots.test.ts,
  tests/monolith_budget.test.ts, the guild bank suites
The agent returns: the promised-versus-delivered table per deliverable, the DDL text
added, every read of guildMembership and where it is stamped, every write to the Hall
Fund and its delta record, the export rows added, every test added with what it
asserts, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the guild claim
  key ignores party and character; a kicked member loses edit and entry on the next
  stamp; every edit command refuses a plain member on BOTH dispatch arms; the fund
  merge never persists a whole book from one session and bounds its size; a stale rev
  is refused, never merged; the guild bank suites are unchanged and green; the
  extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (rank cases per command, not
  one representative; the DDL pinned as literal text; the cascade and pre-feature cases
  against the pg twin ARMED; the live-view pin mutates through the Sim and reads through
  ctx); orphaned tests; a determinism case with a work-happened anchor.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant and the token firewall at the state.md scope (no on-chain vocabulary in
  src/sim/ per the state.md list; the Book of Deeds is game content), the word "phase" in any code, comment, or commit message, em dashes or
  emojis, generated files hand-edited, a table without a keep-forever comment or a
  retention registration, the local CLAUDE.md rows accurate, the STEP 1 decisions
  recorded in state.md.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (migration-safety, privacy-security-review, architecture-reviewer,
cross-platform-sync, database-performance-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 28 STEP 3 suite list plus `npx tsc --noEmit` and the pg-armed twin.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 28 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "28 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-29-guildhall-purchase-and-upkeep.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 28 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
