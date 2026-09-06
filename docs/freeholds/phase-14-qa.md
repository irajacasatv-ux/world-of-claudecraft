# Phase 14 QA: audit the distribution surface map

Audits `phase-14-distribution-surface-map.md`. Verdict goes in `progress.md` (row "14
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 14 (QA) of the Freeholds and Guildhalls feature: audit the distribution
surface map (the pure module, the seven-distribution matrix, the HudFeatures rows, the
store-policy source pins, the "earn" scan, the O4 verdict).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 14 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "14 Distribution surface map", missing tests,
dead code, the fail-closed arms, the unchanged verdicts of the two gates that read the
map and the untouched resolveWalletCapability, the main.ts firewall, and the store-policy pins; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the source-scan traps (a scoped
  scan falling back to whole-file; guard exemptions must be POSITIVE), "review the
  review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("14 Distribution surface map" and
  the row), docs/freeholds/phase-14-distribution-surface-map.md (what was promised)
- the Phase 14 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 14)
- the pins the diff claims: tests/distribution_surfaces.test.ts,
  tests/freehold_store_gates.test.ts, tests/wallet_connection_view.test.ts,
  tests/woc_market_wiring.test.ts, tests/client_shell.test.ts,
  tests/electron_desktop_config.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the seven-row
matrix as the test actually asserts it (every field per distribution), the before and
after verdict tables of wocMarketAttachAllowed and the Claudium attach plus proof that
resolveWalletCapability is untouched, where the HudFeatures rows are injected and
consumed, the allowlist the source pin uses, and any TODO, unused import, or arm that
resolves true on a missing probe.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; every map arm
  fails closed on a missing, throwing, unknown, or malformed input; freeholdPurchase is
  true on the web and the literal 'website' desktop stamp ONLY (never Steam, Epic, App
  Store, Google Play, or Seeker); freeholdManageOnWebsiteLine is true exactly where the
  house is usable and purchase is false; deedSurfaces is off for Seeker (D21);
  wocMarketAttachAllowed and the Claudium attach produce byte-identical verdicts before
  and after (diff the decision tables); resolveWalletCapability is untouched and its
  result is passed in from main.ts; the map is not imported under src/net; the server is untouched; the O4 verdict in state.md matches the code.
- TEST COVERAGE: the matrix drives the REAL electron/desktop_config.cjs stamps and the
  REAL normalizeSolanaMobileCapabilities (not hand-written booleans); each row asserts
  every field by literal; a per-dimension fail-closed case exists; the source pin's
  allowlist is POSITIVE and the pin was proven with a planted string (look for the
  mutation evidence in the phase notes; if absent, plant one, watch it fail, revert);
  the "earn" scan reads the catalog values, not a copied list; no constant
  self-comparison; orphaned tests.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a fourth copy of a
  distribution decision anywhere under src/, the word "phase" in any code, comment, or
  commit message, em dashes or emojis, generated i18n bundles hand-edited, the new key
  neutral (no store name, no token word).
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (frontend-seam-reviewer, privacy-security-review,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 14 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 14 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "14 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row or the
  O4 verdict.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-15-claudium-charter-and-call.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 14 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
