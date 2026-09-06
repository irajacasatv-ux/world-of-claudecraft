# Phase 01 QA: audit the foundation

Audits `phase-01-foundation.md`. Verdict goes in `progress.md` (row "01 QA"). The next
implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 01 (QA) of the Freeholds and Guildhalls feature: audit the foundation (the
facet, the sim module skeleton, the flag, the RL exclusion).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 01 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "01 Foundation", missing tests, dead code,
determinism, three-host parity, i18n completeness, and the fail-closed flag; fix what
the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("01 Foundation" and the row),
  docs/freeholds/phase-01-foundation.md (what was promised)
- the Phase 01 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 01)
- the pins the diff claims: tests/world_api_parity.test.ts, tests/sim_context.test.ts,
  tests/monolith_budget.test.ts, tests/env_protocol.test.ts,
  tests/server/freehold_wire.test.ts, tests/server/freehold_routes.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub that returns a value the facet's type does not promise.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the facet member
  kinds match on both prototypes; every housing command refuses while dark on BOTH
  dispatch arms; the ctx.freeholds view is live (mutation through the Sim is visible
  through ctx); the extractions are move-not-rewrite (diff the moved bodies); offline and
  online stubs behave identically (null, no-op).
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; literal counts written fresh; the flag pin toggles the env
  and asserts refusal per command; the ACTIONS exclusion asserts absence by literal);
  orphaned tests; missing negative cases (flag set to 'true' or '0' still dark).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, the local CLAUDE.md present and accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (cross-platform-sync, architecture-reviewer, privacy-security-review,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for COVERAGE,
all to files.

STEP 3 - VALIDATION:
- Run the Phase 01 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 01 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "01 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-02-furnishing-item-kind.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 01 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
