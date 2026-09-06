# Phase 16 QA: audit the Steward panel and the store surfaces

Audits `phase-16-steward-panel-and-store-surfaces.md`. Verdict goes in `progress.md` (row
"16 QA"). The next implementation phase never starts before this file has run.

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
This is Phase 16 (QA) of the Freeholds and Guildhalls feature: audit the Steward panel
and the store surfaces (the panel core and window, the Charter row, the Master Builder's
Call button, the manage-on-website line, mobile, screenshots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 16 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "16 Steward panel and store surfaces", missing
tests, dead code, the no-prediction rule, the clock-base contract, the per-distribution
surface matrix through HudFeatures, store-policy copy, mobile rules, and i18n
completeness; fix what the audit finds; record a verdict.

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
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge
  origin/feature/masterwrought while PR #3872 is open, else the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
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
  tests/charter_store_view.test.ts, tests/distribution_surfaces.test.ts,
  tests/freehold_store_gates.test.ts, tests/mobile_window_coverage.test.ts,
  tests/hud_update_drive.test.ts, tests/architecture.test.ts (UI_PURE_CORES,
  UI_DOM_MODULES)
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, every read
the panel core makes (and whether any is a clock other than housingNowMs()), every
surface gated and by which HudFeatures row (exactly two rows, D91), and any TODO,
unused import, or copy string that names a token, a wallet, a deed, a marketplace, or
"earn". Absence assertions on a denied surface are DOM/handler/request/accessibility
scans, never bundle scans: purchase code and the charter.* English ship dormant in
every bundle under the runtime capability (D86), so their presence in a bundle is not
a finding.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-16-steward-panel-and-store-surfaces.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

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

- TEST COVERAGE verifies decisive literal/source and negative assertions for every
  boundary above, including actual work before equality, real async/race outcomes and
  honest unknown/denied states. Missing before/after capture, skipped environment test,
  unaccepted release gate or absent artifact is explicit, never silently PASS.
- HYGIENE checks source anchors and imports, ownership, no dead/TODO code, actual
  monolith ceilings, all i18n render sinks and generated-artifact obligations, no
  em/en dash or emoji and no forbidden purchase language. Cross-check every numeric
  literal to state.md Content numbers or its measured/accepted artifact.
Then dispatch every reviewer the implementation STEP 3 and canonical surface matrix
requires, including test-coverage-auditor and qa-checklist. Do not run duplicate shared
commands; inspect parent evidence. Apply ALL findings, including nits, then a fresh
reviewer reads the fixes before the verdict.

- The three money gates: (1) written counsel acceptance, published accepted Terms/
  listing artifacts and the accepted economy-service contract before production enable
  or any housing-bearing store submission; external sign-off status lives in state.md;
  (2) FREEHOLDS_ENABLED defaults off and the server refuses/hides housing purchases
  while dark; (3) the seven-distribution surface map independently gates housing use,
  purchase and approved website management, including complete submodel/handler/
  catalog/DOM/accessibility/error absence on denied surfaces. These are cumulative.
- The economy service owns every price and all token math; the client forwards the
  immutable quote fingerprint and computes no tariff, conversion, discount or burn.

STEP 3 - VALIDATION:
Required named reviewers for this file: privacy-security-review, frontend-seam-reviewer,
test-coverage-auditor, qa-checklist.
- Run the Phase 16 STEP 3 suite list plus `npx tsc --noEmit`, and re-run
  `node scripts/pr_screenshots.mjs` for the housing targets to confirm the committed
  captures are reproducible.

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every Phase 16 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "16 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-17-trophies.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 16 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
