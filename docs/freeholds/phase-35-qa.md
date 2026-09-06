# Phase 35 QA: audit ward favor and Endeavors

Audits `phase-35-ward-favor-and-endeavors.md`. Verdict goes in `progress.md` (row
"35 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 35 (QA) of the Freeholds and Guildhalls feature: audit ward favor and
Endeavors.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 35 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "35 Ward favor and Endeavors", missing tests,
dead code, determinism, the never-sell-power rule, and three-host parity; fix what the
audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", "guard exemptions must be positive".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("35" and its row),
  docs/freeholds/phase-35-ward-favor-and-endeavors.md (what was promised)
- the Phase 35 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 35)
- the pins the diff claims: tests/freehold_ward_favor.test.ts, tests/freehold_content.test.ts
  (the power-neutral sweep), tests/freehold_wards.test.ts, tests/sim_context.test.ts,
  tests/snapshots.test.ts, the tests/server/ suites the diff added
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: favor is credited only from the settled events and never from a
  purchase; the month boundary comes from the calendar feed, never Date; the decor bonus
  gates new placements only and never removes an existing one; Endeavor completion is
  read-time and rewards land exactly once per member; concurrent progress merges through
  the escrow-delta idiom; the descriptor fields decode strictly; extractions are
  move-not-rewrite.
- TEST COVERAGE: the power-neutral sweep is POSITIVE (every reward id must appear in an
  allowlist of cosmetic prop ids, never "not in a forbidden list"); a can-fail control
  exists for the sweep; literal rank steps written fresh; a same-seed twin run with a
  work-happened anchor; per-dimension negatives (a purchase event credits nothing, a
  counter below target completes nothing, a second completion grants nothing).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall, the word "phase" in any code, comment, or commit
  message, em dashes or emojis, generated files hand-edited, the freehold/ CLAUDE.md rows,
  the hud_update_drive registration for the ward panel.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, cross-platform-sync, privacy-security-review,
migration-safety, frontend-seam-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 35 STEP 3 suite list plus `npx tsc --noEmit` and the pg-armed twin with
  TEST_DATABASE_URL set.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 35 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "35 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-36-showcases-and-guest-books.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 35 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
