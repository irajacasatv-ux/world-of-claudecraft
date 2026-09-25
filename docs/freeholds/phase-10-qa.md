# Phase 10 QA: audit the furnishing colliders

Audits `phase-10-furnishing-colliders.md`. Verdict goes in `progress.md` (row "10 QA").
The next implementation phase never starts before this file has run.

Correction, 2026-09-25 (stale since the first v0.44.0 sync, `ffa7ac5ffb`): the release
already extracted the region block out of `src/sim/colliders.ts` into
`src/sim/rift_regions.ts` (colliders.ts re-exports its publish/token verbs), so the
audited change generalises that module in place or renames it; there is no colliders.ts
block to compare, and that ceiling is not the change's payment. The audit steps below are
corrected to match.

### Starter Prompt
```
This is Phase 10 (QA) of the Freeholds and Guildhalls feature: audit the furnishing
colliders (the generalised runtime collider region registry, the sim publish on claim
and change, the client publish from the descriptor).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 10 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "10 Furnishing colliders", missing tests, dead
code, the move-not-rewrite generalisation of src/sim/rift_regions.ts, determinism of the
collider set, both hosts colliding identically, no per-tick publish, and the monolith
ratchet; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the forward-walk-inherits-reverse-gate
  entry, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("10 Furnishing colliders" and the
  row), docs/freeholds/phase-10-furnishing-colliders.md (what was promised)
- the Phase 10 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 10); for the registry commit, a side-by-side of
  src/sim/rift_regions.ts (or its renamed successor) against its pre-change text
- the pins the diff claims: tests/runtime_collider_regions.test.ts,
  tests/freehold_colliders.test.ts, tests/freehold_collision_region_online.test.ts, the
  five rift suites (tests/rift_collider_cells.test.ts,
  tests/rift_collision_region_online.test.ts, tests/rift_sim.test.ts,
  tests/rift_wall_solidity.test.ts, tests/rift_wall_swept_collision.test.ts) with
  `git diff <phase-start>..HEAD -- tests/rift_*` expected EMPTY,
  tests/sim_context.test.ts, tests/monolith_budget.test.ts The agent returns: the
  promised-versus-delivered table per deliverable, the registry diff (any rift line that
  changed beyond an import path or a name alias), every reader site re-pointed at the
  generalised lookup and any left behind, every test added with what it asserts, the
  publish and clear call sites on both hosts, and any TODO, unused import, or alias that
  nothing calls.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the generalisation
  is move-not-rewrite (the rift bodies match; the rift aliases forward with identical
  signatures; the O(1) candidate-origin derivation survives for the rift band); the
  freehold candidate origin derives from the claim's true instanceOriginOf and never from
  a clamp that maps a neighbouring slot; every reader (movement, sight, pathing)
  dispatches through the one lookup; publish fires on claim, on every accepted change, and
  on free, and NEVER in a sweep; the client clears the previous region before setting the
  new one and clears on session end; the owner and a guest collide identically; a def with
  r: 0 publishes no circle; every claim holds its own collision token on the InstanceSlot
  (the interface now in instance_slot.ts), allocated at claim and released on free, and no
  freehold publish uses the host token as its identity; the reader derives the one
  candidate origin under the host token (dungeonAt plus the UNCLAMPED slot inverse,
  bounds-checked against the region) and honours the per-claim ownership stamp on set and
  clear; self_motion_rift_lift.ts either needed no twin (stated why) or got one.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (the
  equivalence pin drives positions BETWEEN thresholds on both sides of a wall and
  compares full answers, not booleans; the blocks-movement pin proves the same walk
  passes with the table removed; the online twin feeds the real descriptor frame; the
  determinism pin compares collider arrays element-wise across two Sims; the
  no-per-tick pin exercises updateInstances and asserts zero publishes; the
  concurrent-claims pin places in claim A, walks in claim B, then frees A and walks in B
  again; the candidate-origin call counter reads exactly one derivation per lookup
  with all 24 slots of indices 15 and 16 claimed; the r-within-footprint sweep iterates
  the real furnishings.ts table and reds when one def's r is raised above its
  footprint; the filled-Cottage walk reaches door, arrival and hearth on both hosts
  and reds when validatePlacement's door-path arm is removed); orphaned tests; missing
  negative cases (two claims of the same def in adjacent slots do not share a region
  or a token; a stale region or token after free; a stale clear with an earlier claim
  token; a row at a room edge; a rug with r: 0 beside a table with r above 0).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a rift-named helper
  left in the registry module or colliders.ts beside its alias, the architecture import
  invariant, the word "phase" in any code, comment, or commit message, em dashes or
  emojis, generated files hand-edited, src/sim/CLAUDE.md and src/sim/freehold/CLAUDE.md
  rows for the new modules, the colliders.ts ceiling not raised and, if the diff added a
  line there, lowered by an extraction (the release's region move is not this change's
  payment). Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the
  surfaces the diff touched (architecture-reviewer, cross-platform-sync,
  privacy-security-review, server-hot-path-reviewer for the per-claim registry read on the
  movement, sight and pathing hot paths, test-coverage-auditor), and finally qa-checklist
  (the completion gate), all for COVERAGE, all to files.

SETTLED COVERAGE ADDITIONS:
- The sibling/band resolver choice is closed. Exercise exact band/slot boundaries,
  adjacent claims and outside-band positions so no clamped lookup aliases a neighbor.
- First empty/revision 0 consumer registers correctly; equal-row different-origin/claim swaps,
  out-of-order descriptor, leave/disconnect/account switch and late generation all leave
  the correct region or no region. No visual load/quality change alters physics.
- Publish precedes first admitted movement and only follows a committed safe layout.
  Place beside an owner/guest and near door/arrival paths to prove rejection before
  collider mutation; all refusals preserve old region/state. Compare both hosts at LOW.
- Prove O(1) candidate lookup and zero per-tick republish with real call counters, and
  five unchanged rift suites with a can-fail equivalence test rather than reviewer word.

STEP 3 - VALIDATION:
- Run the Phase 10 STEP 3 suite list plus `npx tsc --noEmit`; confirm from the vitest
  summary that every rift suite RAN and passed.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: architecture-reviewer,
  cross-platform-sync, privacy-security-review, server-hot-path-reviewer,
  test-coverage-auditor, qa-checklist.
  Dispatch each for COVERAGE and wait for every report. Apply ALL findings including
  nits, then a FRESH reviewer reads the entire fix round. Earlier slice lists are
  ownership examples; this complete roster is the minimum finishing dispatch.
- Database performance reviews happen before implementation decisions and on the finished
  diff whenever SQL/call sites/stored shapes/queues/locks/timeouts/growth change; pair
  migration-safety and privacy-security-review for persistence/authority changes.
- Run node scripts/gate_select.mjs before calling this contribution complete, as well as
  every scoped/PG/visual/SFX check named here. Report exact commands and outcomes. A
  skipped required suite or a reviewer report alone is not a passing shared gate.

STEP 4 - FIX:
- Apply ALL findings, including nits. Resolve a conflict with a locked decision
  explicitly before PASS; a recorded conflict is not a deferred fix. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 10 acceptance box is verified by a check that ran, not by inspection.
- [ ] Every finding, including every nit, is resolved and a fresh reviewer has verified
  the complete fix round. No deferred review finding remains.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "10 QA": verdict (PASS / FAIL), counts found and
  fixed, and the fresh fix-review evidence. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, fresh fix-review evidence, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-11-build-mode-ui.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 10 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
