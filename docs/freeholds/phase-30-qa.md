# Phase 30 QA: audit the hall amenities

Audits `phase-30-hall-amenities.md`. Verdict goes in `progress.md` (row "30 QA"). The
next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 30 (QA) of the Freeholds and Guildhalls feature: audit the hall amenities
(the guild bank chest, the feast hall table, hall-shared stations, the four boards).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 30 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "30 Hall amenities", missing tests, dead code,
never-sell-power, the hall-shared predicate's independence from the party predicate,
the read-only boards, the D18 arm, and the render budget; fix what the audit finds;
record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave C. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the UI cluster of the gotcha catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the STEP 1 decisions Phase 30 recorded),
  docs/freeholds/progress.md ("30 Hall amenities" and the row),
  docs/freeholds/phase-30-hall-amenities.md (what was promised)
- the Phase 30 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 30)
- the pins the diff claims: tests/freehold_strongbox.test.ts,
  tests/freehold_station.test.ts,
  tests/professions_crafting_hub.test.ts, tests/mobile_station_party.test.ts,
  tests/craft_from_vault.test.ts, tests/professions_feast.test.ts,
  tests/entity_display_name.test.ts, tests/renderer_compile_gate.test.ts,
  tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the call graph
of the hall-shared predicate (every function it calls), every station arm in the
crafting gate and the HUD's in-range list source, every window a board opens and the
data it reads, every server file touched (there should be none beyond wire or i18n
glue), every test added with what it asserts, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the hall-shared
  predicate admits only members present inside the claim footprint and never calls the
  party predicate; the HUD in-range set equals the gate's answer; the chest opens the
  guild bank only and refuses a non-member, a distant member, and below 30 on BOTH
  hosts; the feast at the table is the shipped object with the shipped Well Fed and
  nothing else; each board opens its existing window and reads no new path; the D18
  arm matches the recorded decision with its negative case; the extractions are
  move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (the party-predicate
  independence is a structural or spy pin, not a comment; the presence test places a
  party member outside the footprint; the never-sell-power sweep checks the feast's
  aura id against the shipped one; the three unchanged suites show no diff; the title
  map is pinned both directions); orphaned tests; a determinism case with a
  work-happened anchor.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, a prop attached outside the scheduler, a
  stand-in not listed as a deferral, a hover-only affordance, the STEP 1 decisions
  recorded in state.md, the local CLAUDE.md rows accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, frontend-seam-reviewer,
render-performance-reviewer, cross-platform-sync if the facet or events changed,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 30 STEP 3 suite list plus `npx tsc --noEmit` and `npm run perf:tour`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 30 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "30 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-31-guild-deeds-and-first-kill-trophies.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 30 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
