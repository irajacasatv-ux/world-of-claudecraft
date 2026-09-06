# Phase 24 QA: audit the Kitchen Garden tableau

Audits `phase-24-kitchen-garden-tableau.md`. Verdict goes in `progress.md` (row "24
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 24 (QA) of the Freeholds and Guildhalls feature: audit the Kitchen Garden
tableau (the garden projection, the Harvest Journal board, the farmer NPC, the render
tableau, the zero-bed rule).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 24 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "24 Kitchen Garden tableau", missing tests,
dead code, determinism, three-host parity, the hidden-slot leak rule, the zero-bed
rule against the farming calendar model, and render fairness; fix what the audit
finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the farming calendar model entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("24 Kitchen Garden tableau" and
  the row), docs/freeholds/phase-24-kitchen-garden-tableau.md (what was promised)
- the Phase 24 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 24)
- the pins the diff claims: tests/freehold_garden_view.test.ts,
  tests/professions_farming.test.ts, tests/professions_zone_rollout.test.ts,
  tests/snapshots.test.ts, tests/entity_display_name.test.ts,
  tests/renderer_compile_gate.test.ts, tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, the import
graph of garden_view.ts, every field the garden rows carry (against the PlotState hidden
slots), whether any farming file changed, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the tableau rows
  equal the owner's live plots on both hosts at the same nowMs; the projection follows
  the clock-base contract (no Date.now subtraction from an authority stamp); a visitor
  sees the owner's garden per the decision state.md records; the board opens the
  existing Harvest Journal and nothing else; the farmer NPC has no vendor, gossip
  service, or state write; the board and NPC are torn down on free; the extractions are
  move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (the zero-bed pin compares
  FARM_BED_IDS and FARMING_GAIN_SCHEDULE against fresh literals, not against themselves;
  the hidden-slot pin asserts the exact key set of a garden row; the one-to-one pin has
  a control that fails on an added or dropped row; the fairness pin exercises LOW and
  the top preset); orphaned tests; a determinism case with a work-happened anchor.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, garden_view importing farm_patches or any content table, the word
  "phase" in any code, comment, or commit message, em dashes or emojis, generated files
  hand-edited, a prop attached outside the scheduler, the local CLAUDE.md row accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, render-performance-reviewer,
cross-platform-sync if the descriptor changed, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 24 STEP 3 suite list plus `npx tsc --noEmit` and `npm run perf:tour`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 24 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "24 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-25-build-mode-v2.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 24 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
