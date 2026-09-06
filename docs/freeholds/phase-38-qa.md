# Phase 38 QA: audit optional Charter mint and furnished-plot trading

Audits `phase-38-charter-mint-and-trading.md`. Record the verdict in `progress.md` row "38 QA".
The next implementation starts only after this audit passes.

### Starter Prompt
```
This is Phase 38 QA of the Freeholds and Guildhalls feature.
Harness: Codex, not Claude. Follow the root CLAUDE.md working-style block for effort and fan-out.
Goal: verify every promised deliverable, adversarial failure case and settled ruling
against the real implementation diff; fix all findings and review the fix round.

STEP 0 - PRE-FLIGHT:
Work in the state.md worktree/branch. Verify git status is clean; ask if it is dirty.
Sync per state.md "Worktree, base, and merge-forward"; after a non-empty merge run the
release-merge-audit skill and install frozen dependencies if patches/ moved. Scan memory
for test-pin traps, "apply ALL findings" and "review the review-fix round".

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use the sanctioned imagegen/image-to-GLB workflow and its
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent over state.md, progress.md row 38, ux-spec.md, the implementation
file, referenced signed artifacts, the complete scoped diff and all claimed tests.
Return to a scratch report: promised/delivered table, each new symbol's actual consumer,
each test's assertion and failure control, changed anchors, unused code and gate evidence.

STEP 2 - AUDIT:
Deliverables (at most five):
1. Complete promised/delivered and adversarial correctness report.
2. Decisive test, runtime-evidence and hygiene coverage report.
3. Applied fixes, fresh fix review and recorded final gate verdict.

Fan out three read-only coverage auditors: correctness, test coverage, and hygiene.
Each reports every issue, including uncertain issues and nits, with severity/confidence
and evidence to a file. Audit these specific requirements:
- Trace each included and excluded exact item copy through prepare, freeze, quote,
  settle, cancel and recover. The manifest is immutable; edit/upgrade/listing races
  cannot substitute contents. Personal/bound copies and trophy unlocks stay seller's.
  Buyer capacity (D80): real-PG fixtures for buyer-at-Inn-Room (the purchased plot
  occupies index 0, the buyer's retained copies and displays reach the previewed safe
  destination, the Favor capacity award follows the plot ID), buyer-at-Cottage (the
  literal refusal freehold.deed.buyer_capacity before reservation or service IO),
  buyer-with-two-plots-after-42 (the same refusal when no index is free; occupancy of
  the free index otherwise) and seller-post-sale (a fresh tier-0 record at index 0
  with account trophy unlocks retained and the base capacity budget).
- Exercise real-PG competing settlements, timeout after debit, restart, historical
  replay and current-owner changes. No intermediate ownership or duplicate copy;
  unsafe seller/buyer custody refuses before mutation and no lock spans service IO.
  Add the composed cases the deed contract defines: cancel-pending racing
  transfer-confirmed (one terminal success only), seller disconnect during
  listing-prepared (no asset or belongings disappear) and restart between
  transfer-confirmed and game-applied (the original transition resumes), each with a
  real-PG fixture and a literal terminal state. An open listing or transfer blocks
  character or account deletion with the mapped refusal class (D88).
- Native use consumes only server entitlement; optional deed state alone never
  destroys access. Every denied distribution has no purchase/deed catalog or submodel
  as a runtime contract (no DOM node, handler, request, fetched catalog, error copy or
  accessible text) while the dormant code and keys ship in every bundle (D86).
- The service verifies actual eligible checkout session/territory at each new-spend
  boundary and returns opaque verified effects/refusals, never a channel label.
  Reject forged auth/Origin/UA/JSON/linked-store/server-secret/bridge proofs and
  cross-account/purpose/SKU/quote/operation authorization reuse. After later policy,
  territory or expiry changes, recover only the accepted original outcome without
  another checkout session/debit, subject to current local entitlement/custody guards.
  07a's exact operation/mutation modules retain sole durable binding/receipt ownership.
  Missing, expired, consumed and relinked-wallet step-up proofs refuse listing;
  cross-manifest signature reuse refuses; woc_market.wallet_required and
  terms_required refuse before reservation or service IO; accepted-operation recovery
  needs no new challenge.
- WocMarketService delegates are limited to config, refusal mapping, step-up and quote
  plumbing (never escrowInsertListing or the bag custody bridge) and are paid by
  extraction; the diff adds no ExchangeBrowseCategory or BROWSE_CATEGORIES member,
  defines deedSurfaces nowhere (14's module keeps the one definition and its seven-row
  literals are untouched), adds no HudFeatures row (D91), keeps every deed/mint/listing
  key under hudChrome.housing.deed.* (the mint, listing, sale-review, custody,
  condition-and-credits, pending, support-recovery and no-price-promise rows 38 names
  with exact English, plus 37's charter.serviceUnavailable reused) with
  tests/freehold_store_gates.test.ts still
  failing on a planted on-chain word outside that namespace, and carries the ux-spec
  rows plus both regenerated manifests (D92). NEW allowSerializedCollectibles defaults
  off and refuses the feed and every listing route. Flair remains an opaque public
  ID; the client capability projection removes it on Seeker/App Store/Play/Steam/
  Epic before renderer/chat consumption. Test actual projection, banner/chat/DOM,
  errors and accessibility absence, not only a missing mint card. The same known
  valid ID renders on both allowed web/website distributions and is absent on all
  five denied distributions plus unknown-capability builds. Unknown IDs render none
  in a separate arm. Those same denied clients retain
  ordinary server housing entitlement and gameplay Book of Deeds. Server remains
  D9-ignorant, with no src/sim/ change or per-viewer service verification.
- Trace seller and buyer account_freehold_hearth rows through transfer/cancel/replay:
  neither ready_at_ms nor revision is copied or cleared, and no plot field owns the
  cooldown. Both accounts retain independent existing travel history.
- Pin all three money gates and service-owned price/royalty/split; fresh quote and
  explicit contents confirmation cannot be skipped by recovery or stale UI.
Audit strict decode, malformed/max-size preservation, current authorization, keyed
player strings, focus return and all input modes where UI exists, deterministic
three-host parity, no monolith growth, and test-pin freshness where applicable.
Dispatch migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, cross-platform-sync, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor and qa-checklist
for the actual surfaces, including persistence/DB review of JSON or caller changes.
Database performance must have reviewed decisions and the finished diff; fake pools
do not prove locks, query plans or concurrency.

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

STEP 3 - VALIDATION:
Run every implementation STEP 3 command and required disposable-PG evidence. Record
exact commands, exit codes and evidence paths; an env-skipped suite is not runtime
proof. Run node scripts/gate_select.mjs before completion.

STEP 4 - FIX:
Apply ALL findings including nits. Re-run affected checks. A fresh reviewer reads the
fix commits before completion. Commit fixes separately using scoped Conventional
Commits with bodies and EXPLICIT paths, no coauthor trailer, no word "phase".
Run npm run ci:changed after the last commit and read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every implementation acceptance has a decisive recorded check and evidence.
- [ ] All findings are applied; contradictions with a locked ruling are resolved in
  the report without silently changing that ruling. No unresolved implementation gap.
- [ ] The fresh fix review passes and the shared contribution gate passes.

STEP 6 - DOC UPDATES + MEMORY:
Record PASS or FAIL, findings/fixes, actual commands, evidence and tracked release gates
in progress.md row "38 QA" and state.md's ledger. Preserve signed-artifact status.

STEP 7 - FINAL RESPONSE FORMAT:
Report verdict, findings and fixes, exact checks, gate status and FULL PATH of next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-39-wave-d-close.md

STOPPING RULES:
A FAIL verdict reruns the owning implementation with the findings attached. Do not
push the branch or open/merge a PR in this audit.
```
