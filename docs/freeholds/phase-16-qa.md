# Phase 16 QA: audit the Steward panel and the store surfaces

Audits `phase-16-steward-panel-and-store-surfaces.md`. Verdict goes in `progress.md` (row
"16 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 16 (QA) of the Freeholds and Guildhalls feature: audit the Steward panel
and the store surfaces (the panel core and window, the Charter row, the Master Builder's
Call button, the manage-on-website line, mobile, screenshots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 16 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "16 Steward panel and store surfaces", missing
tests, dead code, the no-prediction rule, the clock-base contract, the per-distribution
surface matrix through HudFeatures, store-policy copy, mobile rules, and i18n
completeness; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the UI gotcha cluster, the
  hud_update_drive registry, screenshots at the lowest graphics preset, "review the
  review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("16 Steward panel and store
  surfaces" and the row), docs/freeholds/phase-16-steward-panel-and-store-surfaces.md
  (what was promised)
- the Phase 16 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 16), including the committed screenshots under
  docs/screenshots/
- the pins the diff claims: tests/steward_panel_view.test.ts,
  tests/steward_panel_window.test.ts, tests/woc_store_window_contract.test.ts,
  tests/freehold_store_gates.test.ts, tests/mobile_window_coverage.test.ts,
  tests/hud_update_drive.test.ts, tests/architecture.test.ts (UI_PURE_CORES,
  UI_DOM_MODULES)
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, every read
the panel core makes (and whether any is a clock other than housingNowMs()), every
surface gated and by which HudFeatures row, and any TODO, unused import, or copy string
that names a token, a wallet, a deed, a marketplace, or "earn".

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the have and
  need rows equal the Phase 13 planner for the same inventory (same gradeIds, same
  order, bags then vault); the panel never predicts (no local condition or due
  arithmetic beyond conditionAt and the fhold stamps; no Date.now against an authority
  value); every button is send-once with the re-arm and close arms; the Charter row and
  the Call button read HudFeatures only; the fingerprint is the store row's price
  verbatim; the neutral line appears exactly where freeholdManageOnWebsite is true; the
  hearth interact is measured against the layout anchor (no entity) with the sim's own
  distance function; the deny and grant lines come from the one housing_view.ts
  selectors (D26); the mobile sheet
  decision is deliberate and the transform re-declared where left is re-pinned.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; the core is tested against Sim-shaped AND ClientWorld-shaped
  inputs; the send-once guard is proven with a second activation; the matrix through
  HudFeatures covers all seven rows; the a11y rows exist); orphaned tests; missing
  negative cases (freeholdDenied for a different owner does not re-arm, a stale fhold
  frame does not reopen a closed panel, prepay at the cap disables the button).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a hud.ts banner
  section instead of a composed module, hover-only information, a target under 40x40,
  an input under 16px, a locale overlay edited, the generated bundle hand-edited, the
  word "phase" in any code, comment, or commit message, em dashes or emojis, the housing
  CLAUDE.md updated for the new modules, screenshots present for desktop AND mobile.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (frontend-seam-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 16 STEP 3 suite list plus `npx tsc --noEmit`, and re-run
  `node scripts/pr_screenshots.mjs` for the housing targets to confirm the committed
  captures are reproducible.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 16 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "16 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-17-trophies.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 16 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
