# Phase 10 QA: audit the furnishing colliders

Audits `phase-10-furnishing-colliders.md`. Verdict goes in `progress.md` (row "10 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 10 (QA) of the Freeholds and Guildhalls feature: audit the furnishing
colliders (the generalised runtime collider region registry, the sim publish on claim
and change, the client publish from the descriptor).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 10 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "10 Furnishing colliders", missing tests, dead
code, the move-not-rewrite extraction, determinism of the collider set, both hosts
colliding identically, no per-tick publish, and the monolith ratchet; fix what the
audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the forward-walk-inherits-reverse-gate
  entry, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("10 Furnishing colliders" and the
  row), docs/freeholds/phase-10-furnishing-colliders.md (what was promised)
- the Phase 10 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 10); for the extraction commit, a side-by-side of the
  moved region block against its pre-move text in colliders.ts
- the pins the diff claims: tests/runtime_collider_regions.test.ts,
  tests/freehold_colliders.test.ts, tests/freehold_collision_region_online.test.ts, the
  five rift suites (tests/rift_collider_cells.test.ts,
  tests/rift_collision_region_online.test.ts, tests/rift_sim.test.ts,
  tests/rift_wall_solidity.test.ts, tests/rift_wall_swept_collision.test.ts) with
  `git diff <phase-start>..HEAD -- tests/rift_*` expected EMPTY, tests/sim_context.test.ts,
  tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the moved block
diff (any line that changed beyond an import path or a name alias), every reader site
re-pointed at the generalised lookup and any left behind, every test added with what it
asserts, the publish and clear call sites on both hosts, and any TODO, unused import, or
alias that nothing calls.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the extraction
  is move-not-rewrite (the moved bodies match; the rift aliases forward with identical
  signatures; the O(1) candidate-origin derivation survives for the rift band); the
  freehold candidate origin derives from the claim's true instanceOriginOf and never
  from a clamp that maps a neighbouring slot; every reader (movement, sight, pathing)
  dispatches through the one lookup; publish fires on claim, on every accepted change,
  and on free, and NEVER in a sweep; the client clears the previous region before
  setting the new one and clears on session end; the owner and a guest collide
  identically; a def with r: 0 publishes no circle; every claim holds its own collision
  token on the InstanceSlot, allocated at claim and released on free, and no freehold
  publish touches ctx.riftCollisionToken; the reader resolves a position's token through
  the claim at that position; self_motion_rift_lift.ts either needed no twin (stated
  why) or got one.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (the
  equivalence pin drives positions BETWEEN thresholds on both sides of a wall and
  compares full answers, not booleans; the blocks-movement pin proves the same walk
  passes with the table removed; the online twin feeds the real descriptor frame; the
  determinism pin compares collider arrays element-wise across two Sims; the
  no-per-tick pin exercises updateInstances and asserts zero publishes; the
  concurrent-claims pin places in claim A, walks in claim B, then frees A and walks in B
  again); orphaned tests; missing negative cases (two claims of the same def in adjacent
  slots do not share a region or a token; a stale region or token after free; a row at a
  room edge; a rug with r: 0 beside a table with r above 0).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a rift-named helper
  left in colliders.ts beside its alias, the architecture import invariant, the word
  "phase" in any code, comment, or commit message, em dashes or emojis, generated files
  hand-edited, src/sim/CLAUDE.md and src/sim/freehold/CLAUDE.md rows for the new
  modules, the colliders.ts ceiling lowered and not raised.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, cross-platform-sync, privacy-security-review,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 10 STEP 3 suite list plus `npx tsc --noEmit`; confirm from the vitest
  summary that every rift suite RAN and passed.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 10 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "10 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-11-build-mode-ui.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 10 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
