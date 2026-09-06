# Phase 11 QA: audit build mode UI

Audits `phase-11-build-mode-ui.md`. Verdict goes in `progress.md` (row "11 QA"). The
next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 11 (QA) of the Freeholds and Guildhalls feature: audit build mode UI (the
placement controller, the view core and strip, the furnishing palette, keybinds, pad,
touch, i18n, mobile, screenshots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 11 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "11 Build mode UI", missing tests, dead code,
the no-prediction rule, i18n completeness, the client gate (touch targets, mobile
sheets, safe areas, tier fairness, screenshots), the drive and painter registries, and
the hud.ts and main.ts ratchet; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the hud_update_drive registry
  entry, the capture-rig entry (never find elements by English text), "review the
  review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("11 Build mode UI" and the row,
  including the screenshot paths), docs/freeholds/phase-11-build-mode-ui.md (what was
  promised)
- the Phase 11 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 11)
- the pins the diff claims: tests/build_mode_view.test.ts,
  tests/build_mode_controller.test.ts, tests/build_mode_painter.test.ts,
  tests/furnishing_palette_view.test.ts, tests/build_mode_wiring.test.ts,
  tests/keybinds.test.ts, tests/gamepad_bindings.test.ts, tests/hud_update_drive.test.ts,
  tests/hud_perf_budget.test.ts, tests/mobile_window_coverage.test.ts,
  tests/architecture.test.ts (UI_PURE_CORES, UI_DOM_MODULES), tests/monolith_budget.test.ts
- the committed screenshots under docs/screenshots/ and the scripts/pr_shot_targets.mjs
  entries that produced them
The agent returns: the promised-versus-delivered table per deliverable, every new module
and where Hud or main.ts consumes it, every test added with what it asserts, every
hudChrome.housing.build.* and hudChrome.housing.denied.* key and every render sink that
uses it, every Phase 08 reason id and its mapped key in housing_view.ts (any unmapped
id; any selector outside housing_view.ts), the screenshot set (desktop, compact, tablet,
before and after), and any TODO, unused import, English literal in a render sink, or
setAttribute of a label.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the controller
  decides nothing (no local layout mutation, no optimistic ghost commit; the mirror
  moves only on the descriptor); one send per activation with re-arm on the deny event;
  projectPlacement snaps and validates through the sim's own core; yaw steps by the
  15-degree lattice and wraps; pad bumpers yaw and the d-pad nudges by cell through the
  EXISTING GamepadCallbacks members; touch drag moves and tap confirms through
  MobileControls ownership and a window open releases the pointer without cancelling
  build mode; every other UI key and Escape cancel; the palette excludes every
  non-furnishing slot; the strip targets measure 40x40 and carry safe-area insets; the
  ghost and blocked state draw at the LOW preset; the mobile-sheet decision is recorded
  and consistent with the exception list; the Hud and main.ts extractions are
  move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression
  (the keybind defaults are literals; the reason-to-key map is swept against the real
  reason enum, both directions; the no-prediction pin refuses a send and asserts the
  layout unchanged; the wiring pin exercises cancel on every other bound key; the
  target-size pin measures computed geometry, not a class name; the drive row and
  HOT_PAINTERS entry exist by name); orphaned tests; missing negative cases (build mode
  toggled while dead or in combat, a palette slot emptied mid-placement, a rotate with
  nothing selected, a confirm with the ghost blocked).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, an English literal or
  a `?? 'English'` fallback in any sink, a locale overlay edited, a second deny-line
  selector or a hudChrome.housing namespace other than denied.* for a reason id (D26),
  a *_view.ts or
  *_painter.ts unregistered, a BARE-named module escaping the painter gate, the word
  "phase" in any code, comment, or commit message, em dashes or emojis, generated files
  hand-edited, src/ui/hud/housing/CLAUDE.md present and accurate, the hud.ts and main.ts
  ceilings lowered and not raised.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (frontend-seam-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 11 STEP 3 suite list plus `npx tsc --noEmit`, `npm run i18n:gen`, and
  the i18n completeness and S3 guard suites; with `npm run dev` running, re-run
  `node scripts/mobile_input_zoom_check.mjs` and open the compact capture to confirm the
  strip sits inside the safe area in landscape.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. A visual fix re-captures its screenshot.
  Then review the fix commits with a FRESH reviewer (fixes are unreviewed code until
  someone reads them). `npm run ci:changed` after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 11 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "11 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-12-strongbox-and-station.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 11 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
