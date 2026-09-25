# Phase 38: optional Charter mint and furnished-plot trading

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 38 of the Freeholds and Guildhalls feature: optional Charter mint and furnished-plot trading.

Harness: Codex, not Claude. Follow the root CLAUDE.md working-style block for effort and
fan-out; this prompt names no model.

Goal: offer voluntary furnished-plot transfers only on approved web surfaces, with explicit contents confirmation and provably safe custody after service settlement.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on the marketplace review and hardening packet,
  the dev deploy being MAINNET, the wallet re-auth review, the exchange website-desktop
  PR, distribution gates, test-pin traps.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use the sanctioned imagegen/image-to-GLB workflow and its
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the counsel gate status, the Phase 37 decisions),
  docs/freeholds/progress.md (only "38 Charter mint surface and marketplace trading
  (web only)"),
  this file, docs/prd/woc/freehold-deed-service-contract.md
- src/game/distribution_surfaces.ts and tests/distribution_surfaces.test.ts (the Phase
  14 seven-row matrix), src/game/woc_market_wiring.ts (wocMarketAttachAllowed,
  wocMarketBrowserHandoffAllowed), src/net/wallet_capability.ts, electron/desktop_config.cjs
  (wocExchangeSupported), src/ui/hud.ts HudFeatures (freeholdPurchaseEnabled,
  dailyRewardsEnabled), tests/client_shell.test.ts, tests/woc_market_wiring.test.ts,
  tests/electron_desktop_config.test.ts
- server/woc_market_routes.ts (the policy switches allowMounts and allowMechChromas
  beside which NEW allowSerializedCollectibles lands, the closed BROWSE_CATEGORIES
  literal mirror, the wallet_required/terms_required and stepup_* refusals, the status
  route), server/woc_market_stepup.ts (WocStepUpOperation, stepUpBindingDigest,
  verifyStepUpProof), server/woc_market.ts
  (WocMarketService; a tracked monolith at its ceiling), tests/monolith_budget.test.ts,
  server/woc_market_db.ts, server/woc_market_proxy.ts (service-computed splits),
  server/freehold_deed_routes.ts, server/freehold_deeds_db.ts, server/freehold_deed_proxy.ts
  (Phase 37), server/chat_flair_stamp.ts (stampChatSenderFlair: the holder flair
  precedent), server/freehold_wire.ts (the ward descriptor serialization)
- src/ui/ the Exchange window family (grep woc_market under src/ui/), src/ui/hud/housing/,
  src/sim/freehold/ward_core.ts (the reserved style slot from Phase 34; READ ONLY, the
  sim does not change), src/sim/exchange_eligibility.ts (ExchangeBrowseCategory, the
  closed browse union; READ ONLY), server/character_delete_db.ts (the storage-guard
  refusal shape D88 maps)
- tests/server/woc_market_routes.test.ts, tests/server/freehold_deed_routes.test.ts
- docs/freeholds/ux-spec.md and the signed content, measurement, service and policy
  artifacts referenced by state.md that this slice consumes.
- Required durable artifacts: docs/freeholds/content-manifest.md,
  docs/freeholds/content-numbers-workbook.md, docs/freeholds/art-brief.md and
  docs/freeholds/ux-spec.md; docs/prd/woc/freehold-service-contract.md,
  docs/prd/woc/freehold-counsel-memo.md, docs/prd/woc/freehold-terms-amendment.md,
  docs/prd/woc/freehold-store-listing-drafts.md,
  docs/prd/woc/freehold-deed-service-contract.md and
  docs/prd/woc/freehold-territory-authority-schedule.md.
The agent returns: the exact distribution/Exchange/WocMarketService seams and monolith extraction,
service draft acceptance, stable plot identity and transfer transaction. The settled
sale transfers shell/tier and eligible transferable placed furnishings in a signed
immutable manifest. Trophy unlock/provenance, personal/bound copies and omitted goods
remain seller-owned in verified safe custody. Housing entitlement is an authoritative
server fact; native clients never derive access from a chain query. The opaque flair
ID vocabulary is the approved art manifest, unknown IDs render no flair. Client
distribution capabilities (14's deedSurfaces) control presentation only: denied
deed-capability builds have no holder flair, including exterior/banner, chat or other
presentation paths. The NEW economy-service
issuer/verifier alone validates actual eligible checkout session and territory;
NEW server/freehold_deed_proxy.ts consumes verified opaque allow/refusal/effects,
with protected binding/receipt owned by 07a. The game learns no channel label or
physical-client attestation and never infers authority from request headers.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.
Database review is required BEFORE implementation decisions and again on the finished
diff, including changes to callers, persisted JSON, caches or workload even when SQL
text stays unchanged. Reuse 07a's global plot fence and reviewed actual legacy
touch-set, including caller-owned saves, character prelocks/nonces, bank-ledger
classification, guild replay and storage/custody effects. Preserve character FIFO
entry and the proved new-participant suffix, never a replacement generic lock order.
Never enter a queue holding a DB client or hold locks
across service IO. Bound admitted work, acquisition/query/transaction deadlines,
projection keys, rows and bytes; background producers use shared admission and
cancellation. Retain one running plus one pending dirty generation, not unbounded
FIFO writes. Supply a query/index inventory (scope, predicates, order, limit, expected
cardinality and supporting index), reverse-FK export/delete access and retention for
every growing shape. Disposable-PG concurrency, plans, query counts and maximum legal
payload evidence are acceptance, not satisfied by fake-pool tests.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 5 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Distribution and mint card: consume Phase 14's deedSurfaces capability from
   src/game/distribution_surfaces.ts (14's source pin, already asserted per row by
   tests/distribution_surfaces.test.ts); 38 changes no distribution row and adds no
   HudFeatures row (D91 fixes exactly two: freeholdPurchaseEnabled and
   freeholdManageOnWebsite). The deed window attaches only where deedSurfaces permits,
   through the same main.ts junction wocMarketAttachAllowed reads. NEW
   src/ui/deed_card_view.ts and deed_card_window.ts plus a client-side Homes tab in
   the Exchange window over the NEW plot-listing feed (no new ExchangeBrowseCategory
   member: the closed union in src/sim/exchange_eligibility.ts and the
   BROWSE_CATEGORIES literal mirror stay unchanged) reuse the cold-window family and
   ux-spec keyed states, focus and mobile rules. Deed, mint and listing copy lives in
   a NEW hudChrome.housing.deed.* block of src/ui/i18n.catalog/hud_chrome.ts, the one
   namespace registered in 14's tests/freehold_store_gates.test.ts web-only allowlist;
   that allowlist extension carries its own mutation probe (a planted on-chain word
   outside hudChrome.housing.deed.* still fails) in the same change. Money states
   reuse charter.* (price, quoteLoading, quoteExpired, priceChanged, confirm, pending,
   cancelled, unavailable, receipt). NEW keys under hudChrome.housing with exact
   English (D92), appended to ux-spec.md's key tables with the section 10 outline row
   and the section 11 housing-deed screenshot target (scenes deed-card, deed-homes-tab,
   deed-contents-review, deed-step-up, deed-listed, deed-sold, deed-received and
   deed-buyer-capacity x desktop/compact/tablet, deed-card and deed-homes-tab on
   website-desktop, and deed-denied across the six denied surfaces: 44 variants, the
   648 milestone), and ux-key-manifest.json plus
   ux-shot-manifest.json regenerated in this same change with every cited count
   updated: deed.title "Optional Freehold Deed"; deed.mint "Mint Freehold Deed";
   deed.homesTab "Homes"; deed.list "List This Home"; deed.cancelListing "Cancel
   Listing"; deed.buy "Buy This Home"; deed.confirmSale "Confirm Sale"; deed.included
   "These items transfer with the home: {count}"; deed.retained "These items stay
   with you: {count}"; deed.minted "Your Freehold Deed is minted."; deed.listed "Your
   home is listed. Its contents are locked until the sale settles or you cancel.";
   deed.sold "Your home is sold. Your Inn Room is ready."; deed.received "Your new
   home is ready."; deed.noListings "No homes are listed right now."; deed.stepUp
   "Sign with your linked wallet to continue."; deed.flairAria "Freehold Deed
   holder flair"; deed.description "Create an optional record for this Freehold through the
   approved service. Your game access does not require this record."; deed.saleReview
   "Review the home and furnishings included in this sale."; deed.includedHeading
   "Included in the sale"; deed.retainedHeading "Staying with you"; deed.custody "Your
   personal trophy records and excluded belongings remain yours. The sale proceeds
   only when their safe storage is confirmed."; deed.custodyUnavailable "Your excluded
   belongings need safe storage before this sale can proceed."; deed.conditionCredits
   "The home's condition is recorded through the transfer time. Existing prepayment
   credits keep their original terms. Account return grace does not transfer.";
   deed.salePending "This sale is being confirmed. Its request reference is saved.";
   deed.requestPending "This request is being confirmed. Your request reference is
   saved."; deed.supportRecovery "This request needs a support review. Your home
   records and belongings are preserved."; deed.noPricePromise "A listing does not
   guarantee a buyer or a future price."; the service-unavailable state reuses 37's
   charter.serviceUnavailable; and denied.deedBuyerCapacity "You do not have a free
   home slot for this purchase." (mirrored by the apiError.freehold.deed.buyer_capacity
   protocol leaf with the same English). The listing drafts and the deed contract
   adopt these ids and this English (D92). A complete denied purchase/deed submodel is
   absent as a runtime contract: no DOM node, handler, request, fetched catalog, error
   copy or
   accessible text; the deed code and its English keys ship dormant in every bundle
   under the runtime capability, and the review notes and the 44b handoff say so
   explicitly (D86). Seven-row matrix and source/bundle pins prove it.
2. Prepare, custody and listing: NEW server/freehold_deed_market.ts owns a NEW
   plot-listing relation freehold_deed_listings (indexed, bounded pages, its own
   retention, export and delete rows in the query/index inventory) and its browse
   feed. The listing is plot-shaped (a furnished plot is account state, not an ItemDef
   or a bag copy), never a WocListingRow, which requires item: InvSlot, itemId,
   sellerCharacter and sellerWallet and whose escrow runs against a character-bound
   bag custody session. WocMarketService delegates in server/woc_market.ts are limited
   to config, refusal mapping, step-up and quote plumbing, never escrowInsertListing or
   the bag custody bridge; every line extracted from server/woc_market.ts lowers its
   monolith pin. NEW allowSerializedCollectibles policy switch beside
   allowMounts/allowMechChromas in server/woc_market_routes.ts, default off: the feed
   and every deed listing route refuse while it is off, and 39 pins that default as 38
   output. Listing and seller-side settlement require the WocStepUp challenge from
   server/woc_market_stepup.ts with a NEW WocStepUpOperation kind
   'list_freehold_plot' whose stepUpBindingDigest covers the manifest digest plus every
   money figure shown; woc_market.wallet_required and woc_market.terms_required refuse
   before any reservation or service IO, the existing stepup_* refusal codes apply, and
   recovery of an accepted operation needs no new challenge. Authenticated current
   seller prepares an immutable manifest of stable plot/shell/tier/revision and exact
   eligible item-copy IDs with service quote fingerprint. At prepare,
   quote/confirmation, listing and NEW-spend settlement, server/freehold_deed_proxy.ts
   consumes the service's verified opaque authorization/effect or typed refusal. The
   service alone checks actual checkout-session/territory eligibility and complete
   account/purpose/SKU/policy/quote/operation/custody binding; no channel/country
   claim enters the game host. Reserve the plot and listed copies behind the
   global fence, reject edit/upgrade/second listing races, and preview ALL excluded
   bound/personal pieces and their exact safe destination. Treasury delegate freezes
   the asset only after verified preparation. If seller custody for omitted goods
   cannot be proven, refuse before listing or spend; no implicit deletion or mail.
3. Atomic settlement and recovery: explicit seller contents confirmation authorizes
   voluntary transfer, distinct from no-loss upkeep. Service confirms the exact
   manifest/outcome; a bounded transaction updates buyer server entitlement, plot
   owner, included exact-copy custody, seller safe custody and durable receipt once.
   Buyer capacity (D80): the purchased plot occupies the buyer's plot_index 0 only when
   that record is at tier 0 (Inn Room); the buyer's retained copies and displays are
   previewed to a safe destination by the same manifest rule as the seller's;
   otherwise the operation refuses with the literal code freehold.deed.buyer_capacity
   (registered in the five Phase 01 catalogs/pins: ERROR_CODES, apiErrorStrings,
   API_ERROR_KEYS, EXPECTED_CODES and KNOWN_CODES) before any reservation or service
   IO. After 42, the purchased plot may occupy the buyer's free index under 42's
   two-plot cap. The seller receives a fresh tier-0 record at index 0 with account
   trophy unlocks retained. Ward Favor capacity awards (35) are properties of the
   stable plot ID and travel with the plot; the seller's fresh record starts at the
   base budget. The deed contract's Preconditions row names this rule.
   Seller's account trophy unlocks/provenance remain; detach their displays and keep
   bound/personal items. Cancel/thaw restores exact original custody; ambiguous service
   completion retries the same intent and recovers without exposing an intermediate
   owner or duplicate furniture. Later checkout expiry, revocation or changed
   territory eligibility refuses NEW spend but cannot strand an accepted outcome:
   discover/apply or compensate the original immutable operation without another
   checkout session or debit. NEW server/freehold_operation_db.ts owns protected
   binding/fingerprint/receipt through prepareFreeholdOperation/applyFreeholdOperation;
   NEW server/freehold_mutation.ts commitFreeholdMutation owns atomic game effects,
   both produced by 07a. Current local entitlement/custody guards still apply.
   07's account_freehold_hearth row remains each account's own travel history:
   transfer, cancellation and recovery neither copy nor clear seller or buyer
   ready_at_ms/revision, and no transferred plot contains authoritative cooldown.
   A deed freeze/burn alone never removes existing
   entitlement or access. No DB lock spans IO; no src/sim/ change is required because
   the earlier generic plot/custody seam owns all gameplay effects.
4. Cosmetic flair and public presentation: stamp an opaque cosmetic flair ID at
   server/freehold_wire.ts serialization using the existing chat_flair_stamp.ts
   precedent, never a service lookup per viewer/frame. Strict ward_wire.ts unknown
   IDs become none. The client presentation projection strips holder flair unless
   14's deedSurfaces capability permits it; renderers and chat consume
   that gated projection, never a raw ID unconditionally. Seeker/App Store/Play/
   Steam/Epic therefore construct no holder-flair submodel, exterior/banner variant,
   chat badge, hidden DOM, error copy or accessible label. The D9-ignorant server
   receives no distribution label or physical-client proof. Ordinary server housing
   entitlement and gameplay Book of Deeds work on these same denied clients.
   Allowed exterior/material variants use scheduler prewarm and retirement. Public
   descriptors omit chain vocabulary, account IDs, sale-private metadata and service
   authority. Capture allowed ward flair and exact denied projection/DOM/ARIA/error
   absence, alongside web contents/cancel/recovery and native ordinary-home use.
   The same known valid flair ID must render on both allowed distributions and
   disappear on all five denied distributions plus an unknown-capability build;
   unknown flair IDs remain a separate refusal/control arm.
5. Proof: dark flag and NEW allowSerializedCollectibles/WOC_MARKET_ENABLED refusals;
   strict matrix, no-price-arithmetic, no-src/sim, no new BROWSE_CATEGORIES member,
   deedSurfaces defined once in 14's module and source/bundle gates. Real-PG
   listing/placement/transfer races, exact included/excluded custody, timeout/restart,
   cancel/recover and historical receipt replay show no loss/duplication; real-PG
   fixtures for buyer-at-Inn-Room, buyer-at-Cottage, buyer-with-two-plots-after-42 and
   seller-post-sale each pin a literal refusal code or resulting row set (D80), and a
   listing attempt without a valid step-up proof returns the step-up refusal before
   any reservation or service IO (fakeCtx and the pg twin). Bound listing pages, cache
   keys, query/verify cadence and background recovery; export/erasure and immutable
   replay retention remain correct after account owner changes. An open listing or
   transfer operation blocks character or account deletion with 07a's mapped refusal
   class in character_delete_db.ts (D88); the deletion race joins the real-PG list.

INVARIANTS THIS PHASE MUST KEEP:
Every player-visible string, including error, aria, tooltip and empty-state text,
uses an English hudChrome.housing.* key and the formatters from src/ui/i18n.ts.
Tooltips follow docs/design/tooltip-writing.md. Reuse docs/freeholds/ux-spec.md and the
shared family/painter/window lifecycle, focus return, keyboard/gamepad, touch safe-area,
reduced-motion and graphics-fairness contracts; do not fork the theme. New paths,
symbols, wire fields, tables and tests under housing/freehold are PLANNED unless an
earlier completed ledger row owns them. Re-find every existing anchor in the tree.
No power sale, keystone/gear-intermediate/quickening-catalyst bill, new farm bed,
repossession or calendar destruction. Sim stays deterministic and token-free; all
server player events are keyed data. Coordinators compose siblings and never grow
past their pinned ceilings. Fresh tests use literal expectations and negative controls.
The three money gates apply to EVERY priced action: (1) signed counsel acceptance,
published Terms and accepted economy-service contract/catalog before production enable
or housing storefront submission; (2) fail-closed live flags, default off, refusing
every NEW priced action while dark; original accepted-operation recovery
remains admitted under the recorded immutable outcome; (3) independent per-distribution use, purchase,
website-management and deed capabilities, pinned for all seven distributions. Charter
and Call checkout is browser web and website-distributed desktop only. Seeker is
use-only with deeds off. App Store, Google Play, Steam and Epic have no purchase or
deed submodel, catalog fetch, handler, hidden DOM, error or accessibility purchase
text. Website management is independently approved and defaults off on denied stores.
No housing copy on native, Steam or Epic names a token, wallet or on-chain deed.
Purchase benefits use cosmetic, convenience and access language, never earn/income/yield.
The economy service owns every price, conversion, fee, royalty, burn and split. The
game forwards opaque IDs and versioned quote fingerprints, never computes token math
or substitutes a stale quote. Durable discoverable intent precedes spend; housing
receipt authority and effects commit through the NEW 07a operation/mutation
producers, consumed by the Phase 15 purchase and Phase 37 deed adapters.
No bounded live key array provides replay authority and no lock spans service IO.
Unknown, expired or changed quotes for NEW spend require a fresh quote and
explicit confirmation; an accepted original operation recovers without a new debit.

Out of scope:
Any behavior beyond these deliverables, any invented balance rate, and any production flag enable.

PROPOSED SERVICE AUTHORIZATION AND RECOVERY CONTRACT:
Preserve literal D9: the game server receives no distribution/channel label,
country assertion or physical-client attestation. The NEW external economy-service
issuer/verifier and policy module verify an actual eligible checkout session and
current territory under signed policy; the signed acceptance names their exact
external repository/module or interface-artifact identity and conformance proof.
Account auth, Origin, user agent, client JSON, linked stores, a desktop bridge
capability and an outgoing server secret are not physical-distribution proof.
The service binds NEW checkoutAuthorization to account, purpose/kind, SKU, policy
version, accepted quote, operation and full plot/guild/custody fingerprint. The game
consumes only the opaque protected reference and service-verified allow/refusal/effect;
it never issues eligibility from headers, accepts a channel JSON field or logs/exposes
the authorization. Unknown/malformed/unverified eligibility refuses NEW spend.
The adapter authenticates the actual service response and bounds decode before
validating the complete operation/effect/fingerprint. A signed acceptance document
is not proof of runtime cryptographic validation. Malformed or nonterminal results
never grant a local effect or prove that no debit occurred; preserve the original
operation for bounded status discovery and recovery.

NEW source ownership is explicit: 07a's
server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation owns
protected authorization binding, fingerprint and durable receipt authority;
server/freehold_mutation.ts::commitFreeholdMutation owns atomic local effects.
Phase 15's NEW server/freehold_purchases.ts is the initial opaque quote/status/
authorization consumer; NEW server/freehold_deed_proxy.ts is the later deed consumer
of that same verified boundary. No game geo or distribution-attestation module is
introduced. These are proposed producers, not existing exports; read prepared
phase-07a-transactional-mutation-boundary.md and its QA before implementation.

Dark flags and unknown/current eligibility refuse new paid actions, not recovery of
an already accepted original operation. Receipt/status discovery, local application
or accepted compensation use its immutable outcome and original protected binding
without a new checkout session or debit. Current local entitlement, ownership, fence
and custody guards still apply. Rejected/expired new quotes need fresh confirmation;
an accepted historical quote is not a fallback new purchase. Both service conformance
and game tests cover forged eligibility inputs, cross-binding reuse, policy/territory/
expiry changes before new spend, and accepted-operation recovery after those changes.

ACCOUNT AUTHORITY, CALENDAR AND RECOVERY ACCEPTANCE:
Consume 07b's single account lifecycle authority: NEW
server/freehold_lifecycle_db.ts::loadFreeholdLifecycle/loadFreeholdLifecycleProtectionPage/
advanceFreeholdLifecycleOnClient, coordinated by
server/freehold_lifecycle.ts::createFreeholdLifecycleCoordinator and the accepted
server/freehold_lifecycle_binding.ts::resolveFreeholdLifecycleBinding policy registry.
Capture authenticated observations before queues; committed monotonic transitions,
not authentication login or a plot-local last-seen field, authorize account grace.
Immutable multi-return history or lossless prefix facts cover dormant/foreign plots;
union overlapping lifecycle protection and service suspensions exactly, never sum
independent credits, force-write foreign plots or restart grace on an alt/plot switch.

07c's NEW server/freehold_arrival_db.ts::loadFreeholdArrivalTiers/
markFreeholdArrivalTierOnClient owns normalized account+tier marks, separate from
lifecycle and plot saves. Only the committed accepted-owner-entry insert winner
has first-tier eligibility. NEW arrivals may receive a private freshArrivalPresentation
directive; snapshot/resume/replay set it null even with firstTierAtAdmission history.
Commit-before-ACK can skip presentation; no exactly-once visible/audio promise and
no permanent receipt for routine visits. Second plots and transfers do not duplicate,
copy or clear account arrival marks or seller lifecycle history.

13/13a own shared source calendar/history/checkpoint evaluation. Preserve calendarId,
schemaVersion/resetPolicyId and immutable prepaid bill/rate/material/receipt identities
across foreign-realm claims and transfers. No rebinding to serving realm/browser zone.
Historical dependencies of durable condition/bill/credit effects must be irrevocably
finalized and read at consistent committed calendar/lifecycle revisions; unfinalized,
missing or unsupported coverage keeps the affected effect pending. A future-credit
purchase does not require future time to be finalized. Long absences/outages use
bounded indexed prefix probes, never lifetime scans or absent-day/week loops.
Calendar-only exclusive writers and compatible shared mutation readers follow 07a's
actual legacy touch-set proof; no invented reverse lock hierarchy. Current-generation
projection/ACK identity cannot regress after delayed loads or superseded delivery.
Server-only operator evidence, secrets and diagnostics never reach either owner or
visitor wire: explicit allowlist builders and distinctive sentinel tests prove it.

At a sale/ownership transfer, materialize the old owner's condition at the transfer
boundary from finalized original calendar/lifecycle history; preserve source calendar
and immutable credits, retain seller account history, and apply buyer lifecycle only
prospectively without copying grace. Unknown authority holds application for bounded
original-operation recovery/accepted compensation, never a replacement charge or
silent calendar reset. Current local custody/fence guards still apply.
Character deletion, soft deactivation, restoration, true account deletion and export
are separate: deactivation is not an FK cascade; restored history/credits/receipts keep
their meaning. Explicit housing export loaders expose allowed facts only. Unknown or
oversized originals remain durable/read-only with bounded diagnostic/reference, not
empty/new-home defaults or filtered destructive arrival-set rewrites.
07's persistence-rollout-contract.md and 07b's lifecycle-policy-binding.md/
lifecycle-db-contract.md plus 13a's upkeep-calendar-db-contract.md name minimum
capable releases, measured bounds, exact schema/save fixtures and accepted policies.
Enable only a proven capable rollout; unchanged normalized rows do not prove an old
binary implements lifecycle, export or saves. Rollback quiesces NEW effects and
preserves accepted original-operation recovery identities and supported recovery.
Each consuming implementation/QA runs relevant two-character/two-plot/two-realm,
dormant-history, delayed-generation, finality/transfer, deactivation/restore/export
and capable/uncapable-release fixtures through real composition and disposable PG.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/distribution_surfaces.test.ts
  tests/client_shell.test.ts tests/woc_market_wiring.test.ts tests/electron_desktop_config.test.ts
  tests/freehold_store_gates.test.ts tests/server/woc_market_routes.test.ts
  tests/server/freehold_deed_routes.test.ts tests/server/freehold_deed_market.test.ts
  tests/deed_card_view.test.ts tests/server/http/surface_inventory.test.ts
  tests/api_error_code_parity.test.ts tests/architecture.test.ts tests/monolith_budget.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/localization_fixes.test.ts`
  (tests/server/freehold_deed_market.test.ts and tests/deed_card_view.test.ts are NEW,
  38) plus the tests/server/ suites the SERVER slice added and the pg-armed twin; `npm run
  i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`; `node
  scripts/pr_screenshots.mjs`; `git diff
  <phase-start>..HEAD --name-only | grep '^src/sim/'` must print nothing.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, cross-platform-sync, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces (content-obligations-reviewer covers the flair art variants
  and the Book of Deeds control arm); actual additional surfaces trigger their
  canonical reviewer.
  Database review runs before decisions and again on the completed diff. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] Web/website-only deed surfaces and full denied submodel absence pass matrix/source/bundle checks; dark new-action routes refuse, accepted original operations remain recoverable, and all three money gates/service-price rules hold. The ux-spec key/target rows and both regenerated manifests are in the diff (D92); 14's deedSurfaces has one definition and no HudFeatures row was added (D91). The housing-deed scenes (deed-card, deed-homes-tab, deed-contents-review, deed-step-up, deed-listed, deed-sold, deed-received, deed-buyer-capacity, deed-denied) are registered in both regenerated manifests (D92).
- [ ] Confirmed furnished manifest transfers precisely shell/tier and eligible placed copies; seller trophies, bound/personal and omitted copies remain in verified custody; unsafe preparation refuses atomically. Buyer capacity, the seller's fresh tier-0 record and plot-bound Favor capacity follow D80 with literal real-PG fixtures; listing without a valid wallet step-up refuses before reservation or service IO.
- [ ] Real-PG edit/list/settle races and timeout/restart/cancel/recovery prove exact-copy and entitlement consistency using durable receipt authority, never native chain access.
- [ ] Opaque flair stays cosmetic; unknown IDs and denied deed-capability clients render none at actual projection/DOM/error/ARIA boundaries. Allowed ward flair and denied ordinary-home/Book of Deeds controls pass, with no sim path change and scheduler-safe ux-spec captures.
- [ ] All unit/PG/growth evidence, reviews, fresh fix review and contribution gate pass.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 38 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record allowSerializedCollectibles (NEW, default off) beside FREEHOLD_DEEDS_ENABLED in
state.md's "Runtime safety and distribution" gate row so 39's pointer resolves.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-38-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
