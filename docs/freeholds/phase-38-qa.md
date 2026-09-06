# Phase 38 QA: audit the Charter mint surface and marketplace trading

Audits `phase-38-charter-mint-and-trading.md`. Verdict goes in `progress.md` (row
"38 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 38 (QA) of the Freeholds and Guildhalls feature: audit the Charter mint
surface, the serialized collectible category, holder flair, and the extended
distribution matrix.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 38 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "38 Charter mint surface and marketplace
trading", missing tests, dead code, the token firewall, the three money gates, the store
policy, and the seven-row matrix; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the marketplace review verdict, "dev deploy is MAINNET".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("38" and its row),
  docs/freeholds/phase-38-charter-mint-and-trading.md (what was promised)
- the Phase 38 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat --name-only`, then the full diff of every touched file (the commits named in
  progress.md row 38)
- the pins the diff claims: tests/distribution_surfaces.test.ts, tests/client_shell.test.ts,
  tests/woc_market_wiring.test.ts, tests/freehold_store_gates.test.ts,
  tests/server/woc_market_routes.test.ts, tests/server/freehold_deed_routes.test.ts, the
  tests/server/ suites the diff added
The agent returns: the promised-versus-delivered table per deliverable, the touched
path list (any src/sim/ path is BLOCKING), every numeric literal the diff added near
deed or collectible code, the list of new symbols and where each is consumed, every test
added with what it asserts, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deed surface is gated by the surface map AND the HudFeatures row
  (two independent gates); each of the seven distributions resolves as recorded; every
  route refuses while either flag is dark before any service call; the listing freezes
  through the service and the holder changes only after a confirmed settlement; the
  transfer rule recorded in state.md is what the code does; the flair id is opaque and
  an unknown id renders nothing; the seller's furnishings and trophies survive a sale;
  no split, burn, or royalty is computed in the game.
- TEST COVERAGE: the matrix has one `it` per distribution with the deed column asserted
  by literal; the source pins scan the real bundle paths, not a fixture; per-dimension
  negatives (flag dark, market dark, native build, the Seeker capability triple, off per
  D21, Steam stamp, Epic stamp, malformed flair id); the settlement test asserts the holder is unchanged on an unavailable
  result; no constant self-comparison; the grep pin for token math has a can-fail
  control.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, any deed, wallet,
  mint, or marketplace string in a native, Steam, or Epic path, English in a server
  response, the word "phase" in any code, comment, or commit message, em dashes or
  emojis, generated files hand-edited, the mobile sheet decision for the mint card.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, frontend-seam-reviewer,
server-hot-path-reviewer, cross-platform-sync, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 38 STEP 3 suite list plus `npx tsc --noEmit`, the pg-armed twin with
  TEST_DATABASE_URL set, and `git diff <phase-start>..HEAD
  --name-only | grep '^src/sim/'` (must print nothing).

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 38 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "38 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row; both
  deed flags recorded as off with the counsel gate OPEN.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-39-wave-d-close.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 38 file as the next file
  to re-run with the findings attached.
- A src/sim/ path in the diff, a token-math constant, or a deed string in a native,
  Steam, or Epic path is a FAIL, not a fix this QA makes on its own.
- Do not push the branch; never merge a PR.
```
