# Phase 36 QA: audit Showcases and guest books

Audits `phase-36-showcases-and-guest-books.md`. Verdict goes in `progress.md` (row
"36 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 36 (QA) of the Freeholds and Guildhalls feature: audit Showcases and guest
books.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 36 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "36 Showcases and guest books", missing tests,
dead code, privacy coverage (reactions only, no free text), persistence and retention,
and the hot-path rules; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the Postgres and server-test gotcha clusters.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("36" and its row),
  docs/freeholds/phase-36-showcases-and-guest-books.md (what was promised)
- the Phase 36 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 36)
- the pins the diff claims: tests/server/freehold_social_db.test.ts (and its pg twin),
  tests/server/freehold_social_routes.test.ts, tests/server/main_retention_wiring.test.ts,
  tests/server/http/surface_inventory.test.ts, tests/api_error_code_parity.test.ts,
  tests/freehold_showcase_tally.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every guest-book write carries only a reaction id from the closed enum
  (an unknown id is refused with a stable code BEFORE the insert) and no free-text
  column, field, or input exists on the table, the routes, the wire, or the window; the
  block and ignore filter applies to the READ for the viewer, not only to
  the write; the visit policy gates the read; no route path or response carries an
  account id or a friend list (routes are keyed by an opaque plot id, and an unknown, a
  private, and a blocked plot answer one identical 404); the owner-only delete uses
  requireOwned; the cap prunes inside the insert transaction; the vote rail
  is a database constraint, not a check-then-insert; the tally tie-break is
  deterministic; the trophy grants once with the season source id; retention rows are
  registered after listen with knobs from config; exportAccountData covers every new
  table; parameterized SQL everywhere.
- TEST COVERAGE: the reaction enum is pinned by literal ids with a can-fail control and
  the same list feeds the routes, the DDL CHECK, and the window; per-dimension negatives
  (unknown reaction id, non-visitor, blocked author on read, second vote, stranger
  delete); the cap test inserts cap plus one; the
  pg twin exercises the cascade and the unique rail; no constant self-comparison; no
  suite passes on an env-skipped twin alone.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, English in a server
  response, the word "phase" in any code, comment, or commit message, em dashes or
  emojis, generated files hand-edited, the mobile sheet decisions recorded, the
  hud_update_drive registration.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, database-performance-reviewer,
migration-safety, server-hot-path-reviewer, frontend-seam-reviewer,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 36 STEP 3 suite list plus `npx tsc --noEmit` and the pg-armed twin with
  TEST_DATABASE_URL set.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 36 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "36 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-37-charter-service-contract.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 36 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
