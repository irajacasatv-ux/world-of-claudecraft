# Phase 09 QA: audit the furnishing view, light rig, and ghost

Audits `phase-09-render-furnishings.md`. Verdict goes in `progress.md` (row "09 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 09 (QA) of the Freeholds and Guildhalls feature: audit render (the
furnishing view, the stand-in kit, the interior light rig, the placement ghost).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 09 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "09 Render: furnishing view, light rig, ghost",
missing tests, dead code, the scheduler-client rule, the point-light budget, tier
fairness, the pure-core registrations, the tour evidence, the screenshots, and the
renderer.ts ratchet and re-mint; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the Eastbrook re-mint entry, the
  measurement-record entry (commit the series, not a summary), "review the review-fix
  round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("09 Render: furnishing view,
  light rig, ghost" and the row, including the tour evidence and screenshot paths),
  docs/freeholds/phase-09-render-furnishings.md (what was promised)
- the Phase 09 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 09)
- the pins the diff claims: tests/furnishing_layout_core.test.ts,
  tests/furnishing_visuals.test.ts, tests/interior_light_rig.test.ts,
  tests/furnishing_ghost_core.test.ts, tests/furnishing_ghost_visual.test.ts,
  tests/renderer_compile_gate.test.ts, tests/architecture.test.ts (RENDER_PURE_CORES),
  tests/entity_gate_stand_in.test.ts, tests/monolith_budget.test.ts, the two Eastbrook
  fingerprint suites
- the tour output recorded in progress.md and the committed screenshots under
  docs/screenshots/
The agent returns: the promised-versus-delivered table per deliverable, every new module
and where the renderer consumes it, every test added with what it asserts, whether the
tour evidence shows zero live-program events for a walk that actually entered the
Cottage with furnishings placed, the screenshot set (desktop, compact, tablet, before and
after), and any TODO, unused import, or Three import inside a *_core.ts.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; every group with
  new materials attaches through attachSceneGroupGated (grep for a bare scene.add or
  group.add of a freshly built material after boot); program anchors exist and are
  hidden; the sync elides on an unchanged signature and allocates nothing on that path;
  the seat uses the interior floor constant plus the authored lift, never terrainHeight;
  the light rig never adds or removes a directional, hemi, spot, or rect light and draws
  at most three point lights at LOW; the ghost draws valid and blocked at every tier and
  reads no FPS governor; every furnishing def resolves through the one registry; the
  renderer.ts extraction is move-not-rewrite; the Eastbrook literals match a fresh
  re-mint run.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression
  (the compile-gate arm scans the real source with comments stripped; the elision test
  counts gate calls before and after an identical sync; the LOW light count is a
  literal; the tier-fairness test drives the LOW preset and asserts the blocked paint;
  the registry sweep iterates the real content table); orphaned tests; missing negative
  cases (a row whose model key is unknown falls to a stand-in rather than nothing; a
  layout that goes null tears everything down; a moved row keeps its clone).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a *_core.ts or
  *_view.ts on disk that RENDER_PURE_CORES does not list, the word "phase" in any code,
  comment, or commit message, em dashes or emojis, generated files hand-edited, a
  src/render/freehold/ local note where the directory earns one, the renderer.ts
  ceiling lowered and not raised, no new package.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (render-performance-reviewer, frontend-seam-reviewer,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 09 STEP 3 suite list plus `npx tsc --noEmit`; re-run `npm run perf:tour`
  through the Cottage yourself and compare with the recorded evidence; re-run the
  Eastbrook re-mint script and confirm it prints the pinned literals.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. A fix that touches renderer.ts owes a
  fresh re-mint commit. Then review the fix commits with a FRESH reviewer (fixes are
  unreviewed code until someone reads them). `npm run ci:changed` after the last commit;
  read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 09 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "09 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-10-furnishing-colliders.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 09 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
