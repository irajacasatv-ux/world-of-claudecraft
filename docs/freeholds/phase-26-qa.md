# Phase 26 QA: audit open-house visiting

Audits `phase-26-open-house-visiting.md`. Verdict goes in `progress.md` (row "26 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 26 (QA) of the Freeholds and Guildhalls feature: audit open-house
visiting (the guild and public policies, caps by tier, the knock, the visit prompt,
the open-houses read, the public-entry rate limit).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 26 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "26 Open-house visiting", missing tests, dead
code, server authority over every relation, privacy of private houses, hot-path
discipline of the list read and the knock fan-out, and the offline no-op; fix what
the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the server and tests cluster of the gotcha catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("26 Open-house visiting" and
  the row), docs/freeholds/phase-26-open-house-visiting.md (what was promised)
- the Phase 26 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 26)
- the pins the diff claims: tests/freehold_visiting.test.ts,
  tests/server/freehold_wire.test.ts, tests/server/freehold_routes.test.ts,
  tests/freehold_command_chain_online.test.ts, tests/server/http/surface_inventory.test.ts,
  tests/api_error_code_parity.test.ts, tests/visit_prompt_view.test.ts,
  tests/monolith_budget.test.ts, tests/snapshots.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the relation
matrix as tested (every cell), every server read the list route performs and its
cache and bust wiring, where the guildmate predicate is sourced, the rate-limit policy
and its bucket, every event added, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; every relation
  is stamped on the server (a crafted payload claiming friend or guildmate is refused on
  BOTH dispatch arms); the guildmate predicate reflects a roster change within the
  cache's TTL and never grants after a kick beyond it; a private house never appears in
  any list or knock path; the cap boundary per tier holds with the owner excluded from
  the count as Phase 18 pinned; the knock reaches the owner only, once, only when home;
  guild and public are offline no-ops; the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (all sixteen relation-policy
  cells, not a sample; the rate-limit test counts the refused entry, not the elapsed
  time; the list test asserts the absence of the private house by id; the bust test
  changes the policy and re-reads; the offline no-op pin asserts the refusal reason);
  orphaned tests; the chain test carries the knock and the policy fields.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, a persisted visitor log, a database read
  reachable from the tick, the surface inventory row present, the local CLAUDE.md rows
  accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, server-hot-path-reviewer,
cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 26 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 26 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "26 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-27-wave-b-close.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 26 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
