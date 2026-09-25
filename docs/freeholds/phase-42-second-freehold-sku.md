# Phase 42: second freehold admission and shared Hearth cooldown

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 42 of the Freeholds and Guildhalls feature: second freehold admission and shared Hearth cooldown.

Harness: Claude Code. Follow the root CLAUDE.md working-style block for effort and
fan-out; this prompt names no model.

Goal: admit a second personal plot on the existing stable identity and custody seams, with independent home state and the approved progressive Ledger.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V | tail -1`), compare
  with `git rev-list --left-right --count HEAD...origin/release/<newest>`, and merge it.
  After any non-empty merge run the release-merge-audit skill;
  `pnpm install --frozen-lockfile` if the merge touched patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on the storage-charter purchase flow, exactly-once
  grants, migration safety and guarded constraint changes, world_api parity pins, the
  distribution matrix, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "42 Second freehold
  admission and shared Hearth cooldown"), and this file
- src/sim/content/freehold/charters.ts (FREEHOLD_CHARTERS, isKnownFreeholdCharterId),
  ledger_schedule.ts and src/sim/freehold/ledger_core.ts (the bill planner), condition_core.ts,
  state.ts (ctx.freeholds keyed by owner key; loadFreehold, serializeFreehold,
  evictFreehold), grant.ts (the Phase 15 Charter grant with its purchase key),
  instance.ts (the owner key at claim), visiting.ts, wards.ts (the plot assignment), the
  Hearth Key module from Phase 06
- src/world_api/housing.ts (myFreehold and every member that assumes one plot),
  src/net/online.ts (the fhold mirror), src/net/freehold_snapshot_wire.ts,
  server/freehold_wire.ts (emitFreeholdSelfKeys), server/freehold_db.ts (Phase 07 stable plot identity and indexed account/plot lookup;
  the rev CAS upsert), server/db.ts (exportAccountData),
  server/claudium.ts (the freehold spend arm and the store filter), server/ws_auth.ts
  (freeholdForAccount at fresh join)
- src/game/distribution_surfaces.ts, src/ui/hud/housing/ (the steward panel and the
  store surfaces from Phase 16), tests/freehold_grant.test.ts, tests/freehold_ledger.test.ts,
  tests/server/freehold_db.test.ts, tests/world_api_parity.test.ts
- docs/freeholds/ux-spec.md and the signed content, measurement, service and policy
  artifacts referenced by state.md that this slice consumes.
- Required durable artifacts: docs/freeholds/content-manifest.md,
  docs/freeholds/content-numbers-workbook.md, docs/freeholds/art-brief.md and
  docs/freeholds/ux-spec.md; docs/prd/woc/freehold-service-contract.md,
  docs/prd/woc/freehold-counsel-memo.md, docs/prd/woc/freehold-terms-amendment.md,
  docs/prd/woc/freehold-store-listing-drafts.md,
  docs/prd/woc/freehold-deed-service-contract.md and
  docs/prd/woc/freehold-territory-authority-schedule.md.
The agent returns: all primary-only admission assumptions, the existing Phase 07 stable opaque
plot identity, bounded account/plot-index lookup, fenced grants and Phase 15 receipts.
No primary-key migration is introduced here. myFreeholds is primary-first and
myFreehold remains the primary alias. Each second-plot approved integer material line
is ceil(primary schedule line * 1.5), fixed with its schedule/prepay version, never
service token math. The Hearth Key defaults primary, destination is chosen in Steward
and its existing 60-minute cooldown is account-shared across homes and alts.
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
Assign disjoint implementation ownership by the following 4 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Second-plot admission: use Phase 07 account+plot-index lookup and stable public
   plotId through the same ctx.freeholds map/fence. NEW src/sim/freehold/second_plot.ts
   is the sibling module behind the SimContext seam that owns second-plot admission
   (the primary-owned precondition and the two-plot cap), plot-index resolution for
   myFreeholds/myFreehold and the per-line ceil(1.5x) derivation the Ledger and
   upgrade planners call; its state stays on ctx.freeholds as a live view, and NEW
   tests/freehold_second_plot.test.ts pins it. Initial primary remains unchanged;
   the freehold_charter_second content SKU admits a second only when primary is
   owned (otherwise refusing with the literal code NEW
   freehold.second_plot_primary_required), rejects a third with the literal code
   freehold.second_plot_cap and carries no literal price or purchase copy. The second
   plot is granted at the Cottage tier,
   the tier the Freehold Charter grants (D1/D2: the Inn Room is the account's one free
   tier-0 record and is never duplicated); its price is the CAL-SERVICE row the
   service publishes. The second plot upgrades through the same build projects as the
   primary (D93): 21's upgrade_lodge and the later 32 and 40 projects act on the plot
   whose claim the owner is inside (the current claim, the plot myFreeholds resolves
   for it), contribute_upgrade and its complete arm (finishUpgrade) take that plot, the
   second plot's upgrade progress is read through its own myFreeholds projection's
   upgrade field while myFreehold.upgrade stays the primary's (the both-world facet pin
   names that field), the upgrade fee receipt binds that plot's stable ID through its
   07a operation row (one
   plot's fee never covers the other), and there is NO second-home upgrade refusal
   (freehold.second_plot_cap and freehold.second_plot_primary_required are the two
   codes this phase registers in the five Phase 01 catalogs/pins, mirrored by apiError
   leaves carrying the English of denied.secondHomeCap and
   charter.secondRequiresPrimary; the D67/D93 refinement is recorded in state.md). The
   1.5x rule
   covers every integer line of the second plot: each material line of its upgrade
   bills is ceil(1.5x) the primary's signed CAL-UPGRADE line (derived per line, never
   a second signed row) and its weekly Ledger and prepay lines are ceil(1.5x) the
   primary schedule (CAL-LEDGER-A), per D67. Interplay with 38 (D80): after this phase
   a purchased furnished plot may
   occupy the buyer's free index under the two-plot cap and refuses with
   freehold.deed.buyer_capacity when both indexes are occupied; a sold primary is
   replaced by the seller's fresh tier-0 record at index 0, while a sold second plot
   frees index 1 with no replacement record (D2 grants one Inn Room per account); each
   plot's Ward Favor capacity award travels with its stable plot ID. myFreeholds
   is primary-first; myFreehold is the byte-compatible primary alias. Do not expose
   account:<id> keys on public wire or replace earlier ward/deed/social plot IDs.
2. Independent plot upkeep and shared account lifecycle: second plot has its own
   condition checkpoint, Ledger version, prepay, visit policy and ward slot, but
   consumes the SAME 07b committed account lifecycle/protection history and 07c
   normalized account arrival-tier marks. It creates no plot-local grace/presence
   store, first-tier history or ordinary-visit receipt. The content-owned 1.5 multiplier applies ceil
   separately to every integer line of the approved primary schedule (the weekly
   Ledger and prepay lines of CAL-LEDGER-A at the plot's tier); no floating
   inventory quantity, cross-plot credit, retroactive prepaid repricing or stale
   bill fallback. Hearth Key destination defaults primary with explicit Steward
   selection; consume 07's NEW server/freehold_hearth_db.ts owner, with
   FREEHOLD_HEARTH_SCHEMA, loadFreeholdHearth and advanceFreeholdHearthOnClient.
   Its normalized account_freehold_hearth(account_id PK/FK, ready_at_ms, revision)
   is the SAME authority across both homes, alts and realms; no plot owns a cooldown
   and cached private UI is only a committed mirror. 07a checks/advances this account
   participant atomically with accepted remote Hearth entry under the reviewed
   actual touch-set, using the authoritative transaction's epoch clock observed
   after account acquisition and nonregressing clock admission. Commit precedes ACK.
   Refused entry, already-home no-op and physical-gate entry advance nothing.
   Disconnect/restart retains the approved 60-minute duration; offline/headless use
   isolated injected host-clock state with that same duration. Transfer/cancel/
   recovery never copy or clear either seller or buyer cooldown. Character deletion
   preserves it; 07b soft deactivation/restore, explicit account export and true
   account hard-delete remain distinct reviewed lifecycle paths.
   A second plot cannot restart return grace or first-tier
   presentation; both consume committed account revisions and private fresh-arrival
   directives, never replay historical eligibility on resume. Preserve each plot's
   source calendar/reset identity and immutable credit attribution. Finalized
   historical coverage and the exact union of lifecycle/service protection guard
   durable effects; missing/unsupported history stays pending/read-only, never
   empty-outage data or a guessed serving-realm binding. Existing combat/travel
   admission stays intact.
3. Durable grant and bounded mirror: second SKU follows the accepted service catalog,
   durable intent/receipt and atomic account/plot/character transfer seam, current
   ownership/fence and fresh quote. No bounded purchase-key array guarantees replay.
   Join returns at most the approved two plot projections via indexed lookup;
   strict self-wire decode and both-world facet/command pins preserve old primary
   consumers. Existing exports/delete include both stable rows under 07a's
   per-row-class ON DELETE policy (D88): an open second-SKU purchase or transfer
   operation blocks character or account deletion with the mapped refusal class in
   character_delete_db.ts and the deletion race joins the real-PG list; receipts
   retain replay authority and all load/save/background limits continue to apply.
4. Steward/store UX and proof: independent plot tabs/status, destination selection,
   current second-plot material bill and initial/owned/pending/error quote states use
   ux-spec family. Money states reuse charter.* and the destination row reuses
   steward.hearthDestination/hearthKey.destination; NEW keys under hudChrome.housing
   with exact English (D92), appended to ux-spec.md's key tables with the section 10
   outline row and the section 11 housing-second-home screenshot target (scenes
   second-home-primary-tab, second-home-second-tab, second-home-hearth-destination,
   second-home-card, second-home-owned and second-home-bill x desktop/compact/tablet,
   second-home-card on website-desktop, and second-home-denied across the six denied
   surfaces: 37 variants, the 742 milestone that completes the program inventory), both
   manifests regenerated in this same change with every cited count updated:
   steward.primaryTab "Primary Home"; steward.secondTab "Second Home";
   charter.secondTitle "Second Freehold Charter"; charter.secondSummary "Open a second
   Cottage with its own upkeep, visitors and ward slot."; charter.secondRequiresPrimary
   "You need a Cottage or larger primary home before buying a second home.";
   charter.secondOwned "This account already has a second home.";
   charter.secondReceived "Your second home is ready."; steward.secondBillNote "A
   second home's upkeep and upgrade lines are one and a half times the primary
   schedule, rounded up." (the Steward Upgrade tab inside the second plot shows that
   plot's own ceil(1.5x) bill, D93); denied.secondHomeCap "You already have two homes."
   (mirrored by the apiError.freehold.second_plot_cap protocol leaf with the same
   English; there is no second-home upgrade refusal and no key for one, D93); and
   hearthKey.tooltipShared "Return to your selected home. You cannot use this while in
   combat, dead, in jail, inside an instance or during a match. Your homes share its
   cooldown." (42 owns the shared-cooldown tooltip and its limits are byte-consistent
   with 06's hearthKey.tooltip; 06 ships the singular wording). Purchase submodel
   exists only on approved browser/website builds as a runtime contract: on a denied
   storefront no DOM node, handler, request, fetched catalog, error copy or accessible
   text exists while the purchase code and English keys ship dormant in every bundle
   under the runtime
   capability, and the review notes and the 44b handoff say so (D86); second-SKU tests
   cover all seven distributions and denied DOM/catalog/handlers.
   Literal odd/even ceil cases and deterministic twin/old-new wire cases accompany
   real-PG concurrent purchase/CAS recovery. Extend 07's freehold_hearth_db unit/PG
   suites: simultaneous same-account alts/processes/realms/destinations produce one
   accepted cooldown advance; refused entry changes neither location nor clock.
   Pin stale UI, restart, commit-before-ACK, physical-gate/no-op, seller/buyer transfer,
   deactivation/restore/export and clock regression. Record bounded indexed account
   loads, query/lock/FK waits and capable-release fixtures. Prove no third plot
   (freehold.second_plot_cap), no second plot without a primary
   (freehold.second_plot_primary_required, a real-PG fixture), stale quotation,
   first-home mutation or custody loss;
   the grant test pins the literal Cottage tier and an upgrade on the second plot runs
   the primary's build project with every material line at ceil(1.5x) and no refusal
   (D93; the odd/even boundary cases cover the upgrade bill lines too).
   Capture the desktop/compact/tablet second-home-* scenes (primary-tab, second-tab,
   hearth-destination, card, owned, bill), second-home-card on website-desktop and
   second-home-denied on every denied surface.

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
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_second_plot.test.ts
  tests/freehold_grant.test.ts tests/freehold_ledger.test.ts tests/freehold_condition.test.ts
  tests/freehold_wards.test.ts tests/freehold_determinism.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/freehold_command_chain_online.test.ts tests/distribution_surfaces.test.ts
  tests/freehold_store_gates.test.ts tests/client_shell.test.ts tests/server/freehold_db.test.ts
  tests/server/freehold_hearth_db.test.ts tests/server/freehold_hearth_db.pg.test.ts
  tests/server/storage_gates.test.ts tests/server/http/surface_inventory.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts` plus the
  tests/server/ suites added and the pg-armed twin with TEST_DATABASE_URL set; `npm run
  i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs`;
  parity goldens if regenerated.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch content-obligations-reviewer, architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  Database review runs before decisions and again on the completed diff. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] Second grant reuses stable identity from 07, is exactly-once under real-PG concurrent/restart receipt tests, refuses without primary (freehold.second_plot_primary_required) or at the two-plot cap (freehold.second_plot_cap), and leaves all primary consumers unchanged. The second plot is granted at the literal Cottage tier; an upgrade on it runs the primary's build project with every integer material line at ceil(1.5x) and no refusal (D93); the 38 interplay (free-index occupancy, buyer_capacity at two plots, sold-primary replacement, sold-second freeing) has literal real-PG fixtures (D80).
- [ ] Independent state/ward/visits and per-line ceil(1.5) with immutable prepaid versions pass literal odd/even boundary tests; no stale quote or schedule fallback.
- [ ] Hearth defaults primary and both destinations atomically consume the same 07 account_freehold_hearth row through 07a. The 60-minute account history survives alt/realm/restart/transfer; stale mirrors never authorize, refused/no-op/gate entry never advances, and concurrent PG entry/clock/lifecycle/rollout proofs pass with existing combat restrictions.
- [ ] Bounded two-row join/export/delete under D88 (an open operation blocks deletion with the mapped refusal class), strict wire/parity, seven-distribution complete surface absence as a runtime contract with dormant code (D86), the NEW keys in ux-spec.md and both regenerated manifests (D92), and desktop/compact/tablet states pass all three money gates/service-price checks.
- [ ] All suites, real-PG plans/custody evidence, reviews and contribution gate pass.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 42 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-42-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
