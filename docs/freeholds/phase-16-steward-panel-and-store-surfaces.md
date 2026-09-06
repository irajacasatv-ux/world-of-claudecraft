# Phase 16: the Steward panel and the store surfaces

Wave A, the Cottage MVP. The spec is `progress.md` "16 Steward panel and store surfaces";
the decisions are `brainstorm.md` D9 (the surface map gates every purchase surface), D10
(text-free events resolved to `hudChrome.housing.*` keys), and proposal section 10 (the
Steward panel: the hearth-flame condition meter, next ledger due, have and need across
bags and vault, one-click pay from bags, pay from vault, and the Master Builder's Call).
This phase ships the panel on the `PlantSheetWindow` family, the Freehold Charter row in
the WOC Store window where Phase 14 allows it, the Call button where purchase is enabled,
the neutral manage-on-the-website line elsewhere, and the screenshots. Nothing here
predicts an outcome: the panel mirrors the Phase 13 planner and the sim decides.

### Starter Prompt
```
This is Phase 16 of the Freeholds and Guildhalls feature: the Steward panel and the
store surfaces (steward_panel_view.ts and steward_panel_window.ts, the Charter row in
the WOC Store window, the Master Builder's Call button, the manage-on-website line,
mobile sheets, screenshots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three UI slices on existing families).

Goal: give the owner one window at the hearth that shows condition, the next ledger
due, have and need across bags and vault, prepay, and the pay buttons, plus the
Charter and Call purchase surfaces exactly where the distribution map allows them and a
neutral line everywhere else, all English t() keys, all numbers formatted, mobile as a
sheet, with before and after screenshots.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on screenshots at the lowest graphics preset,
  capture rigs never finding elements by English text, the window shell coordinate
  model, mobile orientation landscape-only, the hud_update_drive registry, the vanilla
  frontend stack, the UI gotcha cluster, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "16 Steward panel and store
  surfaces"), and this file
- src/ui/hud/housing/ as Phase 11 left it (the barrel, CLAUDE.md, build_mode_*,
  furnishing_palette_*), src/ui/hud/professions/farming_plant_sheet_view.ts
  (PlantSheetInput, PlantSheetViewModel, buildPlantSheetView, canOpenPlantSheet: the
  pure core that mirrors the sim gate order and never predicts),
  src/ui/hud/professions/farming_plant_sheet_window.ts (PlantSheetWindowDeps,
  PlantSheetWindow: open, close, paint, notifyFarmEvent re-arm and close, setPendingSend,
  the send-once-per-activation guard, cold on purpose), src/ui/hud/professions/farming_view.ts
  (farmDeniedLineKey, the grant-line selectors), src/ui/hud/professions/index.ts, the
  Hud composition of the plant sheet (grep plantSheetWindow in src/ui/hud.ts) and the
  farmDenied arm that feeds it
- src/world_api/housing.ts (myFreehold, freeholdLayout, housingNowMs, payLedger),
  src/sim/freehold/ledger_core.ts and condition_core.ts (Phase 13: the planner and
  conditionAt the view mirrors), src/net/freehold_snapshot_wire.ts (the fhold fields the
  view reads), the freeholdGranted and freeholdDenied variants in src/sim/types.ts
- src/game/nearby_interaction.ts (tryNearbyInteraction) and src/game/farm_bed_interact.ts
  (the pure decide pair measured with the sim's own distance): the hearth anchor joins
  this funnel; src/sim/content/freehold/layouts.ts (D23: the hearth anchor Phase 06
  placed as a named decor key; a layout datum, never an entity)
- src/ui/woc_store_view.ts, src/ui/daily_rewards_window.ts (hosts charterSectionHtml),
  src/ui/charter_card_view.ts (charterName, charterCardHtml, charterSectionHtml,
  charterRefusalText, charterGrantedText), src/ui/purchase_intent_record.ts,
  src/ui/charter_fit_memory.ts, the claudiumPurchase bag on Hud and hud.attachClaudium
  (how a spend is issued with kind and expectedCostClaudium from the store row),
  src/ui/hud.ts HudFeatures (freeholdPurchaseEnabled, freeholdManageOnWebsite from
  Phase 14) and the dailyRewardsEnabled consumer
- src/ui/i18n.catalog/hud_chrome.ts (the housing namespace; the bank and farming
  namespaces as models), src/ui/i18n/ formatters (formatNumber, formatDateTime,
  formatMoney), src/ui/CLAUDE.md (PainterHost, write elision, the perf budget, the
  item-cell mark family), src/ui/hud/CLAUDE.md, src/styles/CLAUDE.md,
  src/styles/hud.mobile.css (the mobile sheet base selector list),
  tests/mobile_window_coverage.test.ts (MOBILE_WINDOW_EXCEPTIONS),
  tests/hud_update_drive.test.ts, tests/architecture.test.ts (UI_PURE_CORES,
  UI_DOM_MODULES), tests/language_fanout_registry.test.ts (the relocalize sweep)
- tests/farming_plant_sheet_view.test.ts, tests/woc_store_window_contract.test.ts,
  tests/charter_store_view.test.ts, tests/browser/a11y.browser.test.ts (the charter
  card rows), scripts/pr_shot_targets.mjs (the compact and tablet device boxes),
  .claude/skills/pr-screenshots/SKILL.md
- src/ui/hud.ts row in tests/monolith_budget.test.ts, root CLAUDE.md "Modularity"
The agent returns: the plant-sheet core and painter recipe (deps, lifecycle, the event
re-arm), the hearth interact funnel shape, how the store window composes charter cards
and issues a spend with the fingerprint, the HudFeatures read shape, the mobile sheet
decision recipe, the pr_shot_targets entry shape, the Hud composition lines a new window
costs and the extraction that pays for them, the i18n formatter imports.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except src/ui/hud.ts, the housing barrel, and the catalog module, which
the coordinator edits last):
- Agent PANEL: src/ui/hud/housing/steward_panel_view.ts (pure, UI_PURE_CORES: the
  hearth-flame meter from conditionAt, next ledger due from the fhold week and
  housingNowMs(), have and need rows across bags and vault from the Phase 13 planner
  with the SAME gradeIds and order, affordability per source, prepay weeks up to 4, the
  lockout explanation below 30, the away-pause and grace notes, the Call row only when
  freeholdPurchaseEnabled, the manage-on-website row only when freeholdManageOnWebsite)
  and steward_panel_window.ts (the PlantSheetWindow painter: buttons pay from bags, pay
  from vault, prepay, Master Builder's Call; send-once per activation with aria-busy;
  re-arm on freeholdDenied, close on freeholdGranted; opened by proximity to the hearth
  ANCHOR read from the layout data through tryNearbyInteraction with a pure decide pair,
  the farm_bed_interact idiom, no entity); rows appended to the one freeholdDeniedLineKey
  and freeholdGrantedLineKey selectors in src/ui/hud/housing/housing_view.ts (D26: never
  a second selector or namespace); tests for the core against both
  Sim-shaped and ClientWorld-shaped inputs and for the window's send-once guard.
- Agent STORE: the Freehold Charter row in the WOC Store window through the
  charter_card_view.ts family (web and website desktop only, gated by
  HudFeatures.freeholdPurchaseEnabled, never by a distribution string), the spend
  issued through the existing claudiumPurchase hooks with kind freehold and the row's
  expectedCostClaudium as the fingerprint, the refusal and granted lines through the
  charter text selectors, the Call button's spend from the panel through the same
  hooks; the neutral manage-on-website line in the panel and the store where
  freeholdManageOnWebsite; tests/woc_store_window_contract.test.ts extended (the row
  appears with purchase enabled, is absent otherwise, and the fingerprint is the row's
  price verbatim), the a11y rows.
- Agent MOBILE+I18N: hudChrome.housing.steward.* and hudChrome.housing.store.* English
  keys (no "earn", no token word, no store name in the neutral line), the M16 fills only
  where a value is wordy, `npm run i18n:gen`; the styles section in
  src/styles/components.css and the mobile sheet membership in hud.mobile.css (or a
  reasoned MOBILE_WINDOW_EXCEPTIONS entry), safe-area insets, 40x40 targets, 16px
  inputs; the scripts/pr_shot_targets.mjs entries (desktop, compact, tablet) for the
  panel and the store row; the pr-screenshots capture committed under docs/screenshots/
  with the lowest graphics preset seeded and elements found by ids, never English text.
The coordinator edits last: src/ui/hud.ts (compose the window through the housing
barrel, feed the freeholdDenied and freeholdGranted arms, pay each line with an
extraction and lower the ceiling), the housing index.ts barrel, the hud_update_drive
registry row if the panel is polled. Every agent writes any report longer than a screen
to a file and replies with the path plus a short summary. Never `mode: "plan"` on
teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before FREEHOLDS_ENABLED is set in
  production and before any store submission carrying housing copy (the store row ships
  dark behind the server flag and the client map); (2) the fail-closed flag defaulting
  off (the server refuses while dark; the client shows the row only where the map
  allows AND the store says the SKU exists); (3) the per-distribution surface map: every
  purchase surface in this phase reads HudFeatures.freeholdPurchaseEnabled, never
  NATIVE_APP or a distribution string, pinned by the surface matrix through the HUD
  features.
- The economy service owns prices and token math: the panel and the store render the
  service's price and forward it as the fingerprint; the client never derives a price,
  a discount, or a burn.
- Store policy: no wallet, $WOC, on-chain deed, or marketplace string in the panel or the row; no
  "earn" language; the manage-on-website line is neutral; nothing reads as timed loss
  (the lockout copy says amenities pause, nothing is lost).
- Server authority: the panel mirrors the Phase 13 planner and the fhold fields; it
  never predicts an outcome; every button sends once and waits for the event.
- The clock-base contract: every timer derives through housingNowMs() and the fhold
  stamps; never subtract Date.now from an authority value.
- Client gates: touch targets 40x40 minimum, inputs 16px, landscape mobile, safe-area
  insets, a mobile-sheet decision for the window id, no hover-only essential
  information, graphics tiers gameplay-neutral, screenshots desktop and mobile.
- i18n: the policy in docs/freeholds/implementation-plan.md; numbers, dates, and money
  through formatNumber, formatDateTime, formatMoney; a relocalize arm if the window is
  signature-gated.
- Monolith: hud.ts is a coordinator with a ceiling; compose through the barrel and pay
  each line with an extraction.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any sim, server, or wire change (Phases 13 and 15 own the planner, the events, and
  the spend branch; if the panel needs a field the fhold key lacks, stop and record it).
- The trophy case tab (Phase 17), the visit prompt (Phase 18), twelve-week prepay
  (Phase 25), the Guildhall Hall Fund panel (Wave C).
- Native billing or any purchase surface where the map says no.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/steward_panel_view.test.ts`;
  `npx vitest run tests/steward_panel_window.test.ts`; `npx vitest run
  tests/woc_store_window_contract.test.ts tests/charter_store_view.test.ts
  tests/distribution_surfaces.test.ts tests/freehold_store_gates.test.ts
  tests/architecture.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts tests/mobile_window_transform.test.ts
  tests/mobile_window_layout.test.ts tests/language_fanout_registry.test.ts
  tests/renderer_compile_gate.test.ts tests/monolith_budget.test.ts`; `npm run i18n:gen`
  then `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`;
  `node scripts/pr_screenshots.mjs` for the new targets and
  `node scripts/mobile_input_zoom_check.mjs` against a running `npm run dev`; the
  browser a11y suite for the new rows (`npm run test:browser`, the a11y file).
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  frontend-seam-reviewer (pure-core completeness, the painter recipe, write elision,
  the perf budget, mobile, i18n sink classification). Prompt it for COVERAGE not
  filtering; it writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(ui): add the Steward panel on the plant-sheet window family
- feat(ui): show the Freehold Charter and the Master Builder's Call where the map allows
- feat(styles): make the Steward panel a mobile sheet with safe-area insets
- docs(screenshots): capture the Steward panel and the Charter row on desktop and mobile
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The panel opens by proximity to the layout's hearth anchor (no entity), shows
  condition, the next due date through
  housingNowMs(), have and need rows that equal the Phase 13 planner's legs for the
  same inventory (a paired pin), affordability per source, prepay up to 4, and the
  lockout explanation below 30.
- [ ] Each button sends exactly once per activation, re-arms on freeholdDenied, and
  closes on freeholdGranted (pinned with a fake world).
- [ ] With freeholdPurchaseEnabled true the Charter row and the Call button render and
  forward the store price verbatim as the fingerprint; with it false neither renders
  and, where freeholdManageOnWebsite is true, the neutral line does (the seven-row
  matrix through HudFeatures in tests/woc_store_window_contract.test.ts).
- [ ] No wallet, $WOC, deed, marketplace, or "earn" string in the new keys
  (tests/freehold_store_gates.test.ts still green after the keys land).
- [ ] The window id has a mobile sheet decision; targets are 40x40; inputs 16px; the
  zoom check passes; screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and named in progress.md.
- [ ] hud.ts is not longer than before; the panel is in UI_PURE_CORES and
  UI_DOM_MODULES; the drive registry row exists if polled.
- [ ] All STEP 3 suites green; frontend-seam-reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 16, notes, deferrals, the screenshot
  paths) and docs/freeholds/state.md (the per-phase ledger row 16: the modules, the
  window id, the i18n keys, the shot targets).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-16-qa.md

STOPPING RULES:
- Stop and record it if the panel needs a value the fhold key or the facet does not
  carry (a wire change belongs to a sim phase, not here).
- Stop if any surface would have to read NATIVE_APP or a distribution string directly
  (the map is the only gate).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
