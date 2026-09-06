# Phase 37 QA: audit the on-chain Freehold Charter service contract

Audits `phase-37-charter-service-contract.md`. Verdict goes in `progress.md` (row
"37 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 37 (QA) of the Freeholds and Guildhalls feature: audit the on-chain
Freehold Charter service contract, the freehold_deeds table, geo-exclusion, and the
FREEHOLD_DEEDS_ENABLED flag.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 37 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "37 On-chain Freehold Charter", missing tests,
dead code, the token firewall, the three money gates, persistence safety, and secret
handling; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", "no sensitive material in the open repo".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("37" and its row),
  docs/freeholds/phase-37-charter-service-contract.md (what was promised),
  docs/prd/woc/freehold-deed-service-contract.md (what was written)
- the Phase 37 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat --name-only`, then the full diff of every touched file (the commits named in
  progress.md row 37)
- the pins the diff claims: tests/server/freehold_deed_routes.test.ts,
  tests/server/freehold_deeds_db.test.ts (and its pg twin), tests/server/http/surface_inventory.test.ts,
  tests/api_error_code_parity.test.ts, tests/architecture.test.ts (the token firewall)
The agent returns: the promised-versus-delivered table per deliverable, the touched
path list (any src/sim/ path is a BLOCKING finding), the list of new symbols and where
each is consumed, every test added with what it asserts, every numeric literal in
server/ the diff added (a price, burn, split, or royalty constant is BLOCKING), and any
TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: the flag is strict '1', read live per call, and requires FREEHOLDS_ENABLED
  too; every deed route refuses while dark BEFORE any DB or service call; the proxy
  never throws and never coerces a string into a grant; the claim-once rail is a
  database constraint; verification is throttled and never per tick; the geo arm reads
  the header the attribution module names and applies the recorded unknown policy; the
  export row and cascade exist; the contract doc matches the code (endpoint names,
  statuses, the OPEN counsel gate with an owner).
- TEST COVERAGE: the flag pin toggles the env and asserts refusal per route with
  'unset', 'true', '0', and '1'-without-FREEHOLDS_ENABLED; the geo pin uses a literal
  'KR' and an absent header; the pg twin proves the second claim is a no-op and the
  cascade; a thrown fetch yields unavailable; no constant self-comparison; the
  surface inventory and error-code snapshots updated in the same change.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, any secret, URL, or
  key material in a committed file, English in a server response, the word "phase" in
  any code, comment, or commit message, em dashes or emojis, generated files hand-edited,
  the .env.example rows commented out (never set).
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, migration-safety,
database-performance-reviewer, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 37 STEP 3 suite list plus `npx tsc --noEmit`, the pg-armed twin with
  TEST_DATABASE_URL set, and `git diff <phase-start>..HEAD --name-only | grep '^src/sim/'`
  (must print nothing).

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 37 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "37 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row; the
  counsel gate stays OPEN.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-38-charter-mint-and-trading.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 37 file as the next file
  to re-run with the findings attached.
- A src/sim/ path in the diff or a token-math constant in server/ is a FAIL, not a fix
  this QA makes on its own.
- Do not push the branch; never merge a PR.
```
