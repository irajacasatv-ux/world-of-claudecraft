# Phase 23 QA: audit the Legend Stand and the remaining trophy families

Audits `phase-23-legend-stand-and-trophy-families.md`. Verdict goes in `progress.md`
(row "23 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 23 (QA) of the Freeholds and Guildhalls feature: audit the Legend Stand
and the remaining trophy families (eligibility, the finishes, the plaque projection,
the props, the cosmetic wear below 30, every content obligation).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 23 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "23 Legend Stand and the remaining trophy
families", missing tests, dead code, determinism, three-host parity, the no-item and
never-tradable rules, the read-only trophy module, and the render budget; fix what the
audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the parity goldens entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("23 Legend Stand and the
  remaining trophy families" and the row),
  docs/freeholds/phase-23-legend-stand-and-trophy-families.md (what was promised)
- the Phase 23 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 23)
- the pins the diff claims: tests/freehold_trophies.test.ts,
  tests/freehold_condition.test.ts, tests/freehold_content.test.ts,
  tests/deeds_content.test.ts,
  tests/reliquary_content.test.ts, tests/trophy_tooltip_view.test.ts,
  tests/snapshots.test.ts, tests/renderer_compile_gate.test.ts, the parity goldens
The agent returns: the promised-versus-delivered table per family (the twelve ready
families minus the Phase 17 set, each with its source id, trophy id, finish, prop or
stand-in); the plaque fields the descriptor carries and where each is read from; every
test added with what it asserts; every write the trophy module performs (it should
perform none outside the freehold record); any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every family's source id exists in the tree and maps to exactly one
  trophy id; the finish per tier is right on both hosts; the Legend Stand reads the
  item and never moves, locks, binds, or consumes it, and darkens (never removes) when
  the item leaves possession; the retro grant is idempotent across a second join and a
  relog; a visitor sees the owner's trophies through the descriptor; no hidden instance
  field crosses the wire; below condition 30 the hearth light is cold and every finish
  dull on both hosts, restored at 30, nothing removed and no actionable readout hidden
  (D22); the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (source ids as fresh
  literals; a negative case per family and per Legend Stand rule; the no-item sweep
  compares every trophy id against ITEMS and would fail on a collision; the
  never-tradable pin exercises the market, trade, mail, and bank arms; the zero-Rng pin
  uses the observer, not an inference); orphaned tests; the parity scenario fires the
  retro path.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant (reliquary write ownership), the word "phase" in any code, comment,
  or commit message, em dashes or emojis, generated files hand-edited, a stand-in not
  listed as a deferral, a finish material attached outside the scheduler, the local
  CLAUDE.md rows accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, content-obligations-reviewer,
render-performance-reviewer, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 23 STEP 3 suite list plus `npx tsc --noEmit`, `npm run wiki:content`
  followed by `npx vitest run tests/guide.test.ts`, and `npm run perf:tour`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 23 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "23 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-24-kitchen-garden-tableau.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 23 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
