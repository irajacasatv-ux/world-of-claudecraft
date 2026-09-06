# Phase 16: the Steward panel and the store surfaces

Wave A, the Cottage MVP. The spec is `progress.md` "16 Steward panel and store surfaces";
the decisions are `state.md` D9 (the surface map gates every purchase surface), D10
(text-free events resolved to `hudChrome.housing.*` keys), and proposal section 10 (the
Steward panel: the hearth-flame condition meter, next ledger due, have and need across
bags and vault, one-click pay from bags, pay from vault, and the Master Builder's Call).
This phase ships the panel on the `PlantSheetWindow` family, the Freehold Charter row in
the WOC Store window where Phase 14 allows it, the Call button where purchase is enabled,
the neutral management line only where its independent capability is approved
(otherwise absent by default), and the screenshots. Nothing here
predicts an outcome: the panel mirrors the Phase 13 planner and the sim decides.

## Exact screenshot integration contract

These are NEW planned helper APIs. 09 introduces the common helper, constructor,
visual selector and one import/spread in scripts/pr_shot_targets.mjs, initially with
its functional interior-only capture subset. 11 extends that same
scripts/lib/pr_shot_housing.mjs build target; 16/17/18 append their own functional
descriptors as their UI lands. Never register a later nonfunctional UI target. No new screenshot runner or multi-image capture API is introduced.
The registry has one optional-clip result and one image per uniquely keyed variant.

Registration is cumulative by actual producer: file 09 registers the interior
baseline subset (12 variants); file 11 extends the same target to 89; file 16
reaches 178; file 17 reaches 226; file 18 reaches 330. File 20 verifies the complete
wave A set (330 of the 733-variant program inventory in ux-spec section 11; 21 to 42
register their own milestones and each wave close verifies its union). Earlier files
require only their registered working subset,
never nonfunctional future UI. These are derived inventory counts, not new gameplay
or tuning values.

The common housingVariants, housingVisualWhen and supplied beforeLoad are
owned initially by 09 and extended by 11 exactly as ux-spec.md section 11 defines them.
Append only this file's implemented target; validate the registered cumulative subset
of 178 working variants. Later UI targets register only when their producer lands:

```js
{
  key: 'housing-steward-store',
  label: 'Steward material sources and permitted Charter surfaces',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/steward_panel_',
    'src/ui/charter_store_view.ts',
    'src/ui/woc_store_view.ts',
    'src/ui/daily_rewards_window.ts',
    'src/game/distribution_surfaces.ts',
    'src/sim/freehold/condition_core.ts',
    'src/sim/freehold/ledger_core.ts',
  ],
  variants: [
    ...housingVariants([
      'steward-bags', 'steward-vault', 'steward-automatic',
      'steward-vault-unavailable', 'steward-prepay-review',
      'steward-condition-30', 'steward-condition-29', 'steward-inn',
      'steward-pending', 'steward-refused', 'steward-reconnect',
      'charter-ready', 'charter-pending', 'charter-cancelled',
      'charter-reconciling', 'charter-reconciled',
      'charter-quote-unavailable', 'charter-quote-expired',
    ]),
    ...housingVariants(['charter-ready', 'charter-reconciled'], {
      surface: 'website-desktop', views: housingDesktop,
    }),
    ...housingDeniedSurfaces.flatMap((surface) =>
      housingVariants(['charter-denied'], { surface })),
    ...housingVariants(['steward-condition-29'], { theme: 'parchment' }),
    ...housingVariants(['steward-condition-29'], { theme: 'highContrast' }),
    ...housingVariants(['steward-condition-29'], { forcedColors: 'active' }),
    ...housingVariants(['steward-condition-29'], { motion: 'reduce' }),
    ...housingVariants(['steward-prepay-review'], { input: 'keyboard' }),
  ],
  capture: captureHousingStewardStore,
},
```

Every captureHousing* stages exactly variant.scene through its real UI/authority
fixture, asserts the matching state and returns one optional-clip result. Interior
scenes use 09's full-viewport {}; UI scenes return { clip: '#ui' }. Missing required
after-state throws. The registered working subset must include every exact
target/variant and identity dimension for its producers; 20 verifies the full union.
No callback side shot or sequence-to-last-state substitute.

### Starter Prompt
```
This is Phase 16 of the Freeholds and Guildhalls feature: the Steward panel and the
store surfaces (steward_panel_view.ts and steward_panel_window.ts, the Charter row in
the WOC Store window, the Master Builder's Call button, the manage-on-website line,
mobile sheets, screenshots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three UI slices on existing families).

Goal: give the owner one window at the hearth that shows condition, the next ledger
due, have and need across bags and vault, prepay, and the pay buttons, plus the
Charter and Call purchase surfaces exactly where the distribution map allows them and a
neutral management line only under its independently approved capability, absent by
default otherwise; all English t() keys, all numbers formatted, mobile as a
sheet, with before and after screenshots.

Asset execution: every step that creates or regenerates shipping GLBs, reference
artwork, icons or images MUST be done by Codex, not Claude. Use
.agents/skills/woc-image-to-glb/SKILL.md and its shared canonical workflow for GLBs;
use Codex image generation for raster artwork. Capture actual rendered screenshots
as evidence. Ship final assets with provenance, credits, manifest and in-context proof.
phase-44a-final-codex-artwork.md audits/replaces residual feature-created placeholder
icons/images and produces final-artwork-audit.md before phase-44b-final-legal-handoff.md.
That final sweep does not postpone artwork owned here. 44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

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
  Phase 14: exactly these two rows per D91) and the dailyRewardsEnabled consumer
- src/game/distribution_surfaces.ts and its probe fixtures (Phase 14); server/claudium.ts
  and the game-side quote/status read surface and fingerprint field named in phase-15
  D3 (this file consumes exactly those module and endpoint names: the two RouteDef
  rows on server/freehold_routes.ts, POST /api/freehold/quote (it persists the
  intent and returns the checkoutAuthorization, so the origin check gates it; the
  origin check never gates GET or HEAD) and the status read GET
  /api/freehold/operation/:operationId, handled by server/freehold_purchases.ts; the
  quote carries quoteId, catalogVersion, expiresAt, amount, currency, feeDetails and
  termsVersion, and the spend forwards operationId and quoteId beside
  expectedCostClaudium)
- src/ui/i18n.catalog/hud_chrome.ts (the housing namespace; the bank and farming
  namespaces as models), src/ui/i18n.ts formatters (formatNumber, formatDateTime,
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
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

Deliverables (at most five):
1. Authoritative Steward view. steward_panel_view.ts mirrors 13's same source-mode
   planner, immutable bill/version and authority-calendar stamps. Show a hearth-flame
   condition meter, next Ledger due, bags/vault have/need per material, source-specific
   affordability, bags-only/vault-only/automatic payment, and complete fixed prepay
   batch up to four future weeks. Inn Room has no upkeep. At 30 amenities work; below 30
   explain the pause while entry, building and belongings stay safe. Show absence,
   return-grace and service-suspension status without a pay-or-lose tone. All numeric
   values are state/content data, displayed via formatNumber/formatDateTime/formatMoney
   imported from src/ui/i18n.ts; housingNowMs() supplies compatible calendar time.
   Authoritative timestamps/calendar identities are formatted by client locale in
   the intended realm timezone, including due date, paid-through and shifted outage
   coverage. Every day-rolled-over fact the panel shows (due, paid-through, prepay
   coverage, condition day) is a realm-day resetDay key the server produces through
   resetDayKey(ms, REALM_RESET_TIME_ZONE) per D84; epoch-ms wire fields are
   display-only. The hearth-flame condition meter is a procedural svgIcon recipe in
   src/ui/ui_icons.ts owned here (deliberately final SVG art with no raster art, no
   Codex step and no art-brief reference board; 44a records the explicit final-art
   verdict in its inventory). A wholly
   suspended bill period carries its existing prepaid credit forward unchanged; a
   partially active week keeps its fixed voluntary repair bill, no back-bill
   accumulation. The refreshing Ledger key keeps old rows readable without
   authorizing stale payment. Vault-unavailable aria retains known bag count. The
   condition tooltip limits its promise to condition itself: independent entry/access
   rules still apply. The 16px floor applies to coarse input/select/textarea, not all text.
2. Focused decision window. steward_panel_window.ts uses PlantSheetWindow's cold
   lifecycle and the real .window.panel family, not bank's nontrapping exception,
   under the NEW window id steward-window (an explicit mobile-sheet pin in
   src/styles/hud.mobile.css, pinned by tests/mobile_window_coverage.test.ts).
   The panel's own availability is housing use: the server entitlement gate read
   through the housing facet (myFreehold), never a HudFeatures row (D91).
   Hearth interaction opens via the shared press funnel and authored anchor; proximity
   alone does not open a window. Pin nearby-without-interaction and out-of-range
   interaction as closed; only an explicit accepted in-range press opens it. Preserve
   draft source/weeks and focused action on
   relocalize, skip disabled controls and return focus on close. A blocking payment
   confirmation uses installPromptDialog and always clears inert ownership. Pending
   sends carry operationId+plotId+kind correlation; unrelated grants/denials do not
   close/rearm the panel and late responses never reopen it. Matching success refreshes
   the readable paid state; matching refusal preserves the selection for correction.
   Loading, empty, error, locked, visitor read-only, pending, success and reconnect
   states all have hudChrome.housing.* keys and explicit ux-spec.md acceptance.
3. Approved Charter and Call submodels. WOC Store uses charter_card_view.ts and
   existing purchase hooks with kind freehold and exact service quote fingerprint.
   Charter and panel Call appear only on browser web/website desktop, only with live
   catalog availability and the independent purchase capability. Quote unavailable,
   changed-price, confirmation, cancel, pending and recovered-result states are keyed;
   receipt effect names the current bill credit or repair-only result and never
   implies extra prepay. A denied surface has no purchase node/handler/catalog fetch,
   hidden DOM, aria/error copy or fallback wallet vocabulary. Neutral website
   management appears only when its independently approved capability permits it.
   hudChrome.housing.charter.* is the only key family for this card (D92): the
   listing drafts adopt these ids and no store.* namespace exists. NEW rows this
   file adds under charter.* with exact English: charter.feeDetails = "Fees and
   taxes: {feeDetails}"; charter.quoteExpiry = "Price valid until {expiresAt}.";
   charter.terms = "Purchase Terms" (the Terms link); charter.section =
   "Freeholds" (the Store section heading beside Strongbox Charters, the h3 pattern
   of charter_card_view.ts); charter.reference = "Request reference: {operationId}"
   and charter.supportReview = "This request needs a support review. Your request
   reference is saved." (the error and reconnect states cite them; the drafts' former
   service.reference and service.supportReview rows adopt these ids). This phase also
   owns the Steward feedback rows granted.ledgerPaid = "Your Ledger is paid.",
   granted.prepaid = "Your Ledger is paid through {date}." and granted.call = "Your
   home's condition is restored.", and the refusal rows denied.materials = "You do not
   have enough materials in the selected source." and denied.offlinePurchase =
   "Purchases need an online connection.". ux-spec carries every row and both
   manifests regenerate in this phase with every cited count updated (D92). The
   review step shows the item, its effect, the total
   price, service-authored fee and tax components as keyed structured fields and the
   Terms link before confirmation, matching the Terms amendment's quote sentence.
   The Call card uses the existing steward.call, steward.callCurrentTooltip,
   steward.callRepairTooltip and steward.reviewCall rows; no charter.call* row is
   added. The Charter card's unaffordable arm reuses hudChrome.wocStore.needMoreBody
   exactly as the Call does (the shipped store affordability family; no housing
   needMore key is added).
   NEW src/ui/charter_store_view.ts is the housing purchase submodel sibling,
   composed by existing woc_store_view.ts and charter_card_view.ts. The source file
   does not exist yet: existing tests/charter_store_view.test.ts currently exercises
   those shipped storage-charter helpers. Extend its integration arms without erasing
   existing storage behavior and add focused tests for the new housing module.
   Receipt action hudChrome.housing.charter.showGate opens the existing map,
   selects/highlights the real Eastbrook housing marker (the housing
   MapMarkerSemantic arm 06 produces with the gate.marker label) and focuses marker
   detail.
   It never teleports, invokes Hearth Key, clears cooldown or bypasses entry rules.
   If map/marker is unavailable, keep receipt and show charter.mapUnavailable with retry.
   Quote expiry uses charter.quoteExpired, selected from the expiresAt the POST
   /api/freehold/quote response carries (the status read stays GET);
   only a valid actual amount comparison may select charter.priceChanged. An expired
   quote does not assert a price change.
   Visitors never see another owner's purchase state; any permitted account Store
   remains the visitor's own account context outside the visit flow. Source/copy
   actions and the Visitors-tab extension from 18 preserve shared selected-tab/focus.
4. Shared design and mobile behavior. Apply ux-spec.md's mapped current/target theme
   contract, hearth visual language and exact hudChrome.housing.steward/charter keys.
   Window-title, tab and button keys use title case per DESIGN.md 5.4 (D92); status,
   description, radio and aria keys stay sentence case; ux-spec carries the rows.
   Source tables preserve row identity and item marks; no hover-only affordability
   or restriction. Trap/return uses the shared FocusManager, gamepad topmost dialog
   navigation and keyboard order from the spec. Mobile sheet membership is explicit,
   all targets 40x40, inputs 16px and safe areas honored; low motion/static themes retain
   every action. Register pure/DOM modules, relocalize and any actual polled drive;
   pay coordinator growth by extraction.
5. Steward/store proof and screenshots. Tests pair every displayed source mode with
   the actual planner and prove exactly-once send, wrong-operation reply immunity,
   source-shortfall/no-loss, prepay cap, no-upkeep, condition 30/29 and outage display.
   Seven capability rows, produced by the real distribution_surfaces verdict
   function on 14's probe fixtures, run through real HUD/store hooks with DOM/
   accessibility/network absence assertions. Add the exact housing-steward-store
   helper entry below and path-selection pins; capture desktop/compact/tablet all
   payment states plus permitted/denied store, unavailable quote,
   classic/parchment/highContrast and keyboard/touch/pad focus. Run frontend and
   privacy review plus fresh fix review.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) written counsel acceptance, published accepted Terms/
  listing artifacts and the accepted economy-service contract before production enable
  or any housing-bearing store submission; external sign-off status lives in state.md;
  (2) FREEHOLDS_ENABLED defaults off and the server refuses/hides housing purchases
  while dark; (3) the seven-distribution surface map independently gates housing use,
  purchase and approved website management, including complete submodel/handler/
  catalog/DOM/accessibility/error absence on denied surfaces. These are cumulative.
- The economy service owns prices and token math: the panel and the store render the
  service's price and forward it as the fingerprint; the client never derives a price,
  a discount, or a burn.
- Absence on a denied storefront is a runtime contract (D86): no DOM node, handler,
  request, fetched catalog, error copy or accessible text. Purchase code and the
  charter.* English keys ship dormant in every bundle under the runtime capability;
  the review notes and the 44b handoff say "not rendered or reachable", never
  "absent from the bundle".
- Store policy: no wallet, $WOC, on-chain deed, or marketplace string in the panel or the row; no
  "earn" language; the manage-on-website line is neutral; nothing reads as timed loss
  (the lockout copy says amenities pause, nothing is lost).
- Server authority: the panel mirrors the Phase 13 planner and the fhold fields; it
  never predicts an outcome; every button sends once and waits for the event.
- The clock-base contract: every timer derives through housingNowMs() and the fhold
  stamps; never subtract Date.now from an authority value.
- Client gates: touch targets 40x40 minimum, inputs 16px, landscape mobile, safe-area
  insets, the steward-window mobile-sheet pin, no hover-only essential
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
- The trophy case window and the palette Trophies tab wiring (Phase 17), the visit
  prompt (Phase 18), twelve-week prepay (Phase 25a), the Guildhall Hall Fund panel
  (Wave C).
- Native billing or any purchase surface where the map says no.

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: privacy-security-review, frontend-seam-reviewer,
test-coverage-auditor, qa-checklist.
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
  filtering; it writes its report to a file. Do not commit until ALL findings, including nits, are resolved and the fixes have fresh review.

- Required reviewers for the complete settled diff: frontend-seam-reviewer and privacy-security-review.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(ui): add the Steward panel on the plant-sheet window family
- feat(ui): show the Freehold Charter and the Master Builder's Call where the map allows
- feat(styles): make the Steward panel a mobile sheet with safe-area insets
- docs(screenshots): capture the Steward panel and the Charter row on desktop and mobile
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] Only explicit interact while in range of the layout's hearth anchor opens the
  panel (no entity). Merely approaching, waiting nearby or interacting out of range
  keeps it closed. The accepted interaction shows
  condition, the next due date through
  housingNowMs(), have and need rows that equal the Phase 13 planner's legs for the
  same inventory (a paired pin), affordability per source, prepay up to 4, and the
  lockout explanation below 30.
- [ ] Each button sends once per operation. Only matching operationId/plotId/kind
  replies settle pending state; unrelated/late replies preserve focus/draft and never
  reopen or close another operation. Matching success visibly refreshes paid state.
- [ ] With freeholdPurchaseEnabled true the Charter row and the Call button render and
  forward the store price verbatim as the fingerprint; with it false neither renders
  and, where freeholdManageOnWebsite is true, the neutral line does. The seven-row
  matrix in tests/woc_store_window_contract.test.ts is produced by calling the real
  distribution_surfaces verdict function on the phase-14 probe fixtures and feeding
  its two housing fields into the Hud features bag (never hand-written boolean
  pairs), then asserting DOM/handler/request absence; phase 14's main.ts source pin
  is the wiring leg (D91: exactly two rows).
- [ ] The review step renders charter.feeDetails, charter.quoteExpiry and the
  charter.terms link from the service quote before charter.confirm is enabled
  (pinned in tests/charter_store_view.test.ts); the charter-ready capture shows them.
- [ ] No wallet, $WOC, on-chain-deed marketing, marketplace, or purchase "earn" string
  in reachable purchase keys; ordinary Book of Deeds provenance remains valid
  (tests/freehold_store_gates.test.ts still green after the keys land).
- [ ] steward-window has its mobile sheet pin; targets are 40x40; inputs 16px; the
  zoom check passes; screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and named in progress.md.
- [ ] hud.ts is not longer than before; the panel is in UI_PURE_CORES and
  UI_DOM_MODULES; the drive registry row exists if polled.
- [ ] All STEP 3 suites green; frontend-seam-reviewer confirms ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 16, notes, named unsigned gates, the
  screenshot paths) and docs/freeholds/state.md (the per-phase ledger row 16: the
  modules, the window id steward-window, the i18n keys including the six NEW
  charter.* rows (feeDetails, quoteExpiry, terms, section, reference and
  supportReview), the shot targets).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, external release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-16-qa.md

STOPPING RULES:
- Stop and record it if the panel needs a value the fhold key or the facet does not
  carry (a wire change belongs to a sim phase, not here).
- Stop if any surface would have to read NATIVE_APP or a distribution string directly
  (the map is the only gate).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
