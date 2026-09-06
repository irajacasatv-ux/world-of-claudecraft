# Phase 32 QA: audit the Great Hall, Manor, and Bastion tiers

Audits `phase-32-hall-and-manor-tiers.md`. Verdict goes in `progress.md` (row "32 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 32 (QA) of the Freeholds and Guildhalls feature: audit the Great Hall,
Manor, and Bastion tiers and build projects.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 32 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "32 Great Hall, Manor, Bastion tiers and build
projects", missing tests, dead code, determinism, the keystone exclusion, the content
obligations, and the render budget; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("32" and its row),
  docs/freeholds/phase-32-hall-and-manor-tiers.md (what was promised)
- the Phase 32 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 32)
- the pins the diff claims: tests/freehold_content.test.ts, tests/freehold_build_project.test.ts,
  tests/freehold_upgrade.test.ts, tests/provisioner_firewall.test.ts,
  tests/deeds_content.test.ts, tests/renderer_compile_gate.test.ts, the tests/server/
  suites the diff added
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every tier row matches the state.md working numbers; each layout's
  colliders derive from the same rooms and doors the renderer draws; the project
  completes only with bill and fee both settled and never loses a contribution; the
  guild bill is paid from the Hall Fund by the rank the Phase 28 permissions allow; the
  vendor spawns only after completion and never in a foreign claim; the Materials Vault
  chest refuses a visitor and a condition below 30; the upgrade grant is exactly-once by
  purchase key; extractions are move-not-rewrite.
- TEST COVERAGE: literal tier numbers written fresh (no self-comparison against the
  table); a same-seed twin run with a work-happened anchor; per-dimension negatives (the
  chest for a visitor, the chest below 30, a bill naming a keystone reddens the firewall
  arm); the escrow-delta merge asserted with two concurrent contributors; orphaned tests.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall, the word "phase" in any code, comment, or commit
  message, em dashes or emojis, generated files hand-edited, stand-ins registered in
  ENTITY_GATE_STAND_INS where art is pending.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, architecture-reviewer,
render-performance-reviewer, frontend-seam-reviewer, privacy-security-review,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 32 STEP 3 suite list plus `npx tsc --noEmit` and `npm run perf:tour`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 32 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "32 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-33-wave-c-close.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 32 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
