# Phase 08 QA: audit the layout core and placement commands

Audits `phase-08-layout-and-placement-sim.md`. Verdict goes in `progress.md` (row "08
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 08 (QA) of the Freeholds and Guildhalls feature: audit the layout core and
placement commands (the pure leaf, the four commands, the freeholdState descriptor and
the fhold self key, the chain test).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 08 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "08 Layout core and placement commands", missing
tests, dead code, determinism, three-host parity of the descriptor, text-free events,
the delta invariant, and the monolith ratchet; fix what the audit finds; record a
verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog (constant self-comparison, strip
  comments before a source pin), the offline IWorld live-array aliasing entry, "review
  the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("08 Layout core and placement
  commands" and the row), docs/freeholds/phase-08-layout-and-placement-sim.md (what was
  promised)
- the Phase 08 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 08)
- the pins the diff claims: tests/freehold_layout_core.test.ts,
  tests/freehold_placement.test.ts, tests/freehold_determinism.test.ts,
  tests/freehold_snapshot_wire.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/server/freehold_wire.test.ts, tests/snapshots.test.ts (the fhold rows),
  tests/parity/scenarios.ts (the freehold_placement scenario and its goldens),
  tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, the exact
SimEvent shapes as appended, the fhold decode allowlist as written, and any TODO, unused
import, or reason id that no test exercises.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; layout_core has
  no sim_context import and reads no clock; the two copied angle helpers match the editor
  originals; the gate ORDER in each command (resolve, alive, owner-only with not_owner,
  validate, mutate, emit), that placement.ts reads condition NOWHERE (D22), and that no
  refusal path mutates; exactly one copy consumed through the named slot and the
  'item_locked' twin for a locked copy; remove refuses bags_full without removing; the
  freeholdGranted { kind } variant is declared with no emitter in this diff;
  undo replays the true inverse and is bounded; the descriptor is emitted on enter, on
  every accepted change, and re-sent on resume; the client mirror moves only on the event
  and the delta, never on the send; the fhold key obeys the delta invariant (absent means
  unchanged, null clears); the decode drops a malformed ROW rather than the frame or
  renders it; the extractions are move-not-rewrite (diff the moved bodies); offline and
  online produce byte-identical descriptors for the same seed and script.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (a
  negative case per validatePlacement arm proving the OTHER arms still pass; the
  no-mutation pins compare a cloned before-state; the chain test asserts a renamed field
  FAILS; the ALL_DELTA_KEYS count is written fresh; the parity scenario's coverage shard
  asserts placement actually fired; the determinism case has a work-happened anchor);
  orphaned tests; missing negative cases (a visitor placing in the owner's plot refuses
  not_owner, a plinth def on a floor cell, a floor def on a plinth, two rows on one cell,
  a yaw outside the 15-degree lattice, an undo on an empty stack, a house at condition 0
  still accepting a placement).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, a reason id emitted nowhere, an English string in any emit (the S3
  guard), the word "phase" in any code, comment, or commit message, em dashes or emojis,
  generated files hand-edited, src/sim/freehold/CLAUDE.md updated for layout_core.ts and
  placement.ts, the monolith ceilings lowered and not raised.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, cross-platform-sync, server-hot-path-reviewer,
privacy-security-review, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 08 STEP 3 suite list plus `npx tsc --noEmit`; run tests/parity clean
  (without UPDATE_PARITY) and confirm the goldens commit stands alone.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 08 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "08 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-09-render-furnishings.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 08 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
