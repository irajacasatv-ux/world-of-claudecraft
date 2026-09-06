# Phase 42 QA: audit the second freehold SKU

Audits `phase-42-second-freehold-sku.md`. Verdict goes in `progress.md` (row "42 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 42 (QA) of the Freeholds and Guildhalls feature: audit the second
freehold SKU and the progressive upkeep schedule.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 42 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "42 Second freehold SKU", missing tests, dead
code, exactly-once purchase, the three money gates, persistence safety of the key
change, and three-host parity; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the Postgres gotcha cluster.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("42" and its row),
  docs/freeholds/phase-42-second-freehold-sku.md (what was promised)
- the Phase 42 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 42)
- the pins the diff claims: tests/freehold_second_plot.test.ts, tests/freehold_grant.test.ts,
  tests/freehold_ledger.test.ts, tests/server/freehold_db.test.ts (and its pg twin),
  tests/distribution_surfaces.test.ts, tests/freehold_store_gates.test.ts,
  tests/world_api_parity.test.ts, tests/snapshots.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every consumer
of myFreehold and whether its behavior for a one-plot account is unchanged, the DDL the
diff added (a bare DROP is BLOCKING), every numeric literal near the multiplier (a
literal outside the content table is a finding), the list of new symbols and where each
is consumed, every test added with what it asserts, and any TODO, unused import, or
stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: the second grant is exactly-once by purchase key and refused without the
  first BEFORE any spend; the flag refuses while dark; the multiplier comes from content
  and applies only to the second plot; ledgers, condition, prepay, visit policy, and
  ward slot are independent per plot; the key change is additive, idempotent, and every
  existing row loads as plot 1; the self key carries both plots and the strict decode
  drops a malformed second row without clearing the first; the Hearth Key follows the
  recorded rule; the store filter and the surface matrix hide the SKU where policy
  forbids; extractions are move-not-rewrite.
- TEST COVERAGE: literal SKU ids and multiplier written fresh; a replayed key and a
  third attempt both asserted; a same-seed twin run with a work-happened anchor;
  per-dimension negatives (no first Charter, flag dark, a native build, a Steam stamp,
  a malformed second row); the pg twin applies the DDL twice and loads a pre-change row;
  the five parity edits are in; no constant self-comparison.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall, any price or copy on the SKU record, the word
  "phase" in any code, comment, or commit message, em dashes or emojis, generated files
  hand-edited, the mobile sheet decision.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, architecture-reviewer, migration-safety,
cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 42 STEP 3 suite list plus `npx tsc --noEmit` and the pg-armed twin with
  TEST_DATABASE_URL set.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 42 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "42 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row; note
  that Phase 43 needs the Carpenter and Mason ruling recorded before it starts.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, the Phase 43 ruling
status, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-43-carpenter-and-mason.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 42 file as the next file
  to re-run with the findings attached.
- A bare DROP in the DDL or a price on the SKU record is a FAIL, never a fix this QA
  makes on its own.
- Do not push the branch; never merge a PR.
```
