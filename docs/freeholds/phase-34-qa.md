# Phase 34 QA: audit Wards

Audits `phase-34-wards.md`. Verdict goes in `progress.md` (row "34 QA"). The next
implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 34 (QA) of the Freeholds and Guildhalls feature: audit Wards (the shared
ward instance, exteriors, assignment, the door to member plots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 34 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "34 Wards", missing tests, dead code,
determinism, three-host parity, the hot-path rules, and the render budget; fix what the
audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the offline IWorld live-array aliasing entry.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("34" and its row),
  docs/freeholds/phase-34-wards.md (what was promised)
- the Phase 34 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 34)
- the pins the diff claims: tests/freehold_wards.test.ts, tests/freehold_determinism.test.ts,
  tests/snapshots.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/world_api_parity.test.ts, tests/server/freehold_wards_db.test.ts,
  tests/renderer_compile_gate.test.ts, tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: assignment is a pure function of roster and content (no Date, no Rng, no
  Map iteration order leaking from the DB); a reassignment never drops a row, a
  furnishing, or a trophy; the descriptor is re-sent on resume and the client mirror
  starts null; both hosts produce identical exteriors and collider sets from one
  descriptor; the member door enters under the owner's key and honours the visit
  policy; the ward footprint reaps only when empty; the roster read is cached,
  single-flight, and busted on assignment; extractions are move-not-rewrite.
- TEST COVERAGE: literal cap and floor written fresh; a same-seed twin run with a
  work-happened anchor; per-dimension negatives (full ward refused, a stranger's door
  refused, a malformed descriptor row dropped without clearing the mirror); the new
  self key or event has its ALL_DELTA_KEYS row, TERSE_TO_IWORLD row, and round-trip arm;
  the chain test exercises the real ClientWorld send; orphaned tests.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall (no on-chain word in the style slot), the
  word "phase" in any code, comment, or commit message, em dashes or emojis, generated
  files hand-edited, the RENDER_PURE_CORES registration, the freehold/ CLAUDE.md rows.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, render-performance-reviewer,
server-hot-path-reviewer, cross-platform-sync, migration-safety,
privacy-security-review, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 34 STEP 3 suite list plus `npx tsc --noEmit`, `npm run perf:tour`, and
  the pg-armed twin with TEST_DATABASE_URL set.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 34 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "34 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-35-ward-favor-and-endeavors.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 34 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
