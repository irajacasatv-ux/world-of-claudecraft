# Phase 15 QA: audit the Claudium Charter and Call

Audits `phase-15-claudium-charter-and-call.md`. Verdict goes in `progress.md` (row "15
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 15 (QA) of the Freeholds and Guildhalls feature: audit Claudium, the
Freehold Charter and the Master Builder's Call (the spend kind, the two grants, the
mirror and reconcile, the telemetry source, the flag gating, the service contract).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 15 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "15 Claudium: the Freehold Charter and the
Master Builder's Call", missing tests, dead code, exactly-once on both grants, the
fail-closed flag, the fingerprint rule, the reconcile trust boundary, and the token
firewall; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the Postgres and server/tests
  gotcha clusters, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("15 Claudium: the Freehold
  Charter and the Master Builder's Call" and the row),
  docs/freeholds/phase-15-claudium-charter-and-call.md (what was promised),
  docs/prd/woc/freehold-service-contract.md (what was written for the service; a
  durable PRD-side artifact, never torn down with the packet)
- the Phase 15 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 15)
- the pins the diff claims: tests/server/freehold_gates.test.ts,
  tests/freehold_grant.test.ts, tests/server/freehold_db.test.ts and its pg twin,
  tests/server/claudium.test.ts, tests/server/storage_gates.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, the exact
order of operations in the live-apply host (dry run, spend, apply, persist), where the
purchase key is stored, and any TODO, unused import, price literal, or on-chain word (the
state.md firewall scope; Book of Deeds vocabulary is not firewall vocabulary) under
src/sim/.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the dry run
  precedes money moving; an ambiguous service result never applies a grant; a
  definitive grant applies exactly once and the replayed key is refused from the record,
  not from memory; the Charter mirror lands ONLY after the service reports owned (the
  tampered store row cannot reach it); the rev CAS refuses a stale write; the flag dark
  path refuses the branch AND hides both SKUs; both dispatch arms (RouteDef and the
  legacy ladder) reach the same handleClaudiumApi body; the Call refuses
  no_live_character; the telemetry source rows cover every copper-moving housing
  command; freehold-service-contract.md states the two SKUs, the kind, the fingerprint
  rule, the
  settlement line, and no game-side price.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; the fake service is injected through configureClaudiumRuntime,
  never vi.mock of server/db with sql.includes; a replay case asserts the second call
  mutates nothing; a price-drift case; a flag-dark case per arm; the pg twin exercises
  the CAS conflict); orphaned tests; missing negative cases (a Charter for an account
  that already holds the Cottage, a Call on an Inn Room, a spend while the owner's
  second character is online).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, any borrowed
  pending-row or recovery code, inline logic in server/main.ts, a price or on-chain word
  (the state.md firewall scope) under src/sim/, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, the error-code catalog append-only.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, migration-safety,
database-performance-reviewer, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 15 STEP 3 suite list plus `npx tsc --noEmit`, including the pg-armed
  twin with TEST_DATABASE_URL set after `npm run db:up`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 15 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "15 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row or in
  docs/prd/woc/freehold-service-contract.md.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-16-steward-panel-and-store-surfaces.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 15 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
