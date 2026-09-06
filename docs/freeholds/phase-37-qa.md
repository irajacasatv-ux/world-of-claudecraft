# Phase 37 QA: audit optional Charter service contract and authority gates

Audits `phase-37-charter-service-contract.md`. Record the verdict in `progress.md` row "37 QA".
The next implementation starts only after this audit passes.

### Starter Prompt
```
This is Phase 37 QA of the Freeholds and Guildhalls feature.
Harness: Claude Code. Follow the root CLAUDE.md working-style block for effort and fan-out.
Goal: verify every promised deliverable, adversarial failure case and settled ruling
against the real implementation diff; fix all findings and review the fix round.

STEP 0 - PRE-FLIGHT:
Work in the state.md worktree/branch. Verify git status is clean; ask if it is dirty.
Sync per state.md "Worktree, base, and merge-forward"; after a non-empty merge run the
release-merge-audit skill and install frozen dependencies if patches/ moved. Scan memory
for test-pin traps, "apply ALL findings" and "review the review-fix round".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent over state.md, progress.md row 37, ux-spec.md, the implementation
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
- Audit the concrete service draft against every signed authority/policy gate.
  Individual freeze must be asset-level; burn is separate and explicitly authorized.
  Low condition, absence and failed upkeep cannot burn or remove housing access.
- The service owns current territory and actual eligible checkout verification;
  unknown/unsupported eligibility refuses NEW spend. Game geo/header parsing or
  channel attestation is a finding. Auth, Origin/UA/JSON, linked stores, bridge
  capability and outgoing server secret cannot prove a running distribution.
  Reject cross-account/purpose/SKU/quote/operation authorization reuse; signed
  issuer/verifier proof identifies its external owner before activation.
  Service quotes full cost; no copied base-asset cost drives payment: the source-scan
  pin in NEW tests/server/freehold_deed_pins.test.ts proves server/freehold_deed_config.ts,
  freehold_deed_proxy.ts and freehold_deed_routes.ts carry no price, SOL or split
  literal, and the packet quotes the Metaplex Core page by reference only. The same
  suite validates the territory fixtures against the machine field table in
  docs/prd/woc/freehold-territory-authority-schedule.md.
- Repeated transfer custody and receipt authority are more than ON CONFLICT once-claim.
  Test competing processes, restart, timeout-after-debit, stale response and erasure
  without deleting another owner's housing or replay authority. freehold_deeds and
  its receipt rows are pinned OFF the retention sweep in the style of
  tests/server/main_retention_wiring.test.ts's storage-receipt/bank_ledger arm.
- Pin all three money gates, strict new-action flags, current local ownership,
  opaque service verification, error catalogs and no src/sim/ diff or secrets. Route
  guards are createActiveGuard/rateLimit/current-owner; no game-side operator route or
  admin page exists (support reconciliation is service-owned). The .env.example rows
  (both deed flags commented out) and the DEPLOY.md "Environment keys" rows for
  FREEHOLD_DEEDS_ENABLED and the allowSerializedCollectibles env key state opt-in,
  unset by default on the host and no production enable without the release gates,
  and the docs(deploy) commit carrying them exists on the head.
  Required src/ui/i18n.catalog/api_error.ts::apiErrorStrings leaves, src/ui/api_error_i18n.ts mappings,
  their generator-owned i18n outputs and parity tests are explicitly allowed. Assert
  apiError.freehold.* protocol mirrors retain matching approved English and exact
  API_ERROR_KEYS parity, while all authored UX-spec/key-manifest strings remain
  hudChrome.housing.* (the three eligibility rows 37 names, charter.serviceUnavailable,
  charter.eligibilityUnconfirmed and charter.supportPointer, carry their exact English
  in ux-spec and the regenerated key manifest, D92). Reject a duplicate HUD namespace or
  API entries added to that UX manifest. Verify generated owners and allowed diff
  fixtures; separately reject runtime purchase/deed components, submodels, catalog
  fetches, handlers, CTAs, hidden DOM or ARIA.
  07a owns durable protected binding/receipt and atomic mutation; the deed proxy
  consumes it. After checkout expiry/revocation or territory/policy change, an
  accepted original operation discovers/applies or compensates its recorded outcome
  without a new checkout session or debit, under current local custody guards.
Audit strict decode, malformed/max-size preservation, current authorization, keyed
player strings, focus return and all input modes where UI exists, deterministic
three-host parity, no monolith growth, and test-pin freshness where applicable.
Dispatch migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
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
in progress.md row "37 QA" and state.md's ledger. Preserve signed-artifact status.

STEP 7 - FINAL RESPONSE FORMAT:
Report verdict, findings and fixes, exact checks, gate status and FULL PATH of next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-38-charter-mint-and-trading.md

STOPPING RULES:
A FAIL verdict reruns the owning implementation with the findings attached. Do not
push the branch or open/merge a PR in this audit.
```
