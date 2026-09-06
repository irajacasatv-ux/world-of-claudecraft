# Phase 25 QA: audit build mode v2

Audits `phase-25-build-mode-v2.md`. Verdict goes in `progress.md` (row "25 QA"). The
next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 25 (QA) of the Freeholds and Guildhalls feature: audit build mode v2
(surface snapping and parenting, redo, the capacity meter, advanced mode, twelve-week
prepay, the Fenbridge gate).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 25 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "25 Build mode v2", missing tests, dead code,
determinism, three-host parity of the regenerated layout, server authority over every
new rule, never-destroy, mobile and fairness rules; fix what the audit finds; record
a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the UI cluster of the gotcha catalog, the drive registry entry.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("25 Build mode v2" and the row),
  docs/freeholds/phase-25-build-mode-v2.md (what was promised)
- the Phase 25 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 25), including docs/screenshots/
- the pins the diff claims: tests/freehold_layout_core.test.ts,
  tests/freehold_determinism.test.ts, tests/freehold_ledger.test.ts,
  tests/freehold_command_chain_online.test.ts, tests/world_api_parity.test.ts,
  tests/command_schema.test.ts, tests/keybinds.test.ts, tests/build_mode_view.test.ts,
  tests/capacity_meter_view.test.ts, tests/furnishing_layout_core.test.ts,
  tests/hud_update_drive.test.ts, tests/mobile_window_coverage.test.ts,
  tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every new
validation arm with its reason id and its negative test, the descriptor fields added and
where the strict decode restates them, the keybind and pad and touch wiring sites, the
screenshot files, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; every surface,
  parent, capacity, and yaw rule is enforced in the sim on the server (send a raw frame
  that skips the client projection and confirm the refusal); the client projection and
  the sim agree on the snap target; redo is the exact inverse of undo including the
  parent link; removing an occupied host refuses and moving it moves the children;
  twelve weeks accepted and thirteen refused with nothing consumed; the Fenbridge gate
  round trip on both hosts; the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (one negative case per arm
  that would pass if the arm were deleted; the determinism pin compares colliders and
  geometry, not only rows; the prepay literals are fresh; the chain test sends the new
  fields verbatim; the drive registry names the new painter; the fairness pin runs at
  LOW); orphaned tests.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, a hover-only affordance, a target under 40x40,
  a strip without safe-area insets, a screenshot not referenced, the local CLAUDE.md
  rows accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, frontend-seam-reviewer, cross-platform-sync,
content-obligations-reviewer, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 25 STEP 3 suite list plus `npx tsc --noEmit` and
  `node scripts/mobile_input_zoom_check.mjs` against a running `npm run dev`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 25 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "25 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-26-open-house-visiting.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 25 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
