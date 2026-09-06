# Phase 40 QA: audit the Keep and Citadel tiers and the prestige gate

Audits `phase-40-keep-and-citadel-tiers.md`. Verdict goes in `progress.md` (row "40 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 40 (QA) of the Freeholds and Guildhalls feature: audit the Keep and
Citadel tiers, the courtyard and tower layouts, and the prestige-deed gate.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 40 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "40 Keep and Citadel tiers, prestige deeds",
missing tests, dead code, determinism, the never-sell-power rule at the prestige gate,
the content obligations, and the render budget; fix what the audit finds; record a
verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", "QA gap versus superseding ruling".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the prestige ruling as recorded), docs/freeholds/progress.md
  ("40" and its row), docs/freeholds/phase-40-keep-and-citadel-tiers.md (what was
  promised)
- the Phase 40 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 40)
- the pins the diff claims: tests/freehold_content.test.ts, tests/freehold_prestige_gate.test.ts,
  tests/freehold_build_project.test.ts, tests/provisioner_firewall.test.ts,
  tests/deeds_content.test.ts, tests/renderer_compile_gate.test.ts, the tests/server/
  suites the diff added
The agent returns: the promised-versus-delivered table per deliverable, whether the
gate reads exactly the ruled source with the ruled holder rule, the list of new symbols
and where each is consumed, every test added with what it asserts, and any TODO,
unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every tier row matches state.md; the prestige gate reads the ruled source
  and nothing else, grants nothing, and is checked BEFORE any spend (the dry run refuses
  first); no Claudium or store path reaches the upgrade without it; the courtyard has no
  ceiling modules and the tower lifts agree between groundHeight and the render; every
  bill is keystone-free; the project keeps contributions; extractions are move-not-rewrite.
- TEST COVERAGE: literal budgets, plinths, and amenity slots written fresh; the gate has
  a positive, a negative, and a holder-rule case per the ruling; a same-seed twin run
  with a work-happened anchor; per-dimension negatives (a bill with a keystone reddens
  the firewall arm, a spend without the source is refused before the service call).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall, the word "phase" in any code, comment, or commit
  message, em dashes or emojis, generated files hand-edited, stand-ins registered where
  art is pending, RENDER_PURE_CORES registrations.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, render-performance-reviewer,
architecture-reviewer, privacy-security-review, frontend-seam-reviewer,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 40 STEP 3 suite list plus `npx tsc --noEmit`, `npm run perf:tour`, and
  `npm run asset:budget`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision or the recorded ruling, in which case record it). Re-run the
  validation matrix. Commit fixes separately from the verdict, Conventional Commits with
  scope and body, EXPLICIT paths, never `git add -A`, the word "phase" nowhere. Then
  review the fix commits with a FRESH reviewer (fixes are unreviewed code until someone
  reads them). `npm run ci:changed` after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 40 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "40 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-41-dye-station-and-layout-sharing.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 40 file as the next file
  to re-run with the findings attached.
- A gate that reads a source other than the ruled one is a FAIL, never a fix this QA
  makes on its own.
- Do not push the branch; never merge a PR.
```
