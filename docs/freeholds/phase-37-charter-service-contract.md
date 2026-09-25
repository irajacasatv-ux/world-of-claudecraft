# Phase 37: optional Charter service contract and authority gates

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 37 of the Freeholds and Guildhalls feature: optional Charter service contract and authority gates.

Harness: Claude Code. Follow the root CLAUDE.md working-style block for effort and
fan-out; this prompt names no model.

Goal: land the server contract dark with durable deed/receipt identity and explicit transfer/authority policy. Required error catalogs and mappings ship with server errors; runtime client purchase/deed surfaces and sim changes remain outside this slice.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  and merge it. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on the marketplace review verdict and hardening
  packet, the dev deploy being MAINNET, fail-closed flags, the RouteDef scaffold,
  migration safety, no sensitive material in the open repo, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "37 On-chain Freehold
  Charter: service contract, ledger table, geo-exclusion"), and this file;
  docs/prd/woc/freeholds-and-guildhalls-research.md section 9
  only (the on-chain design) and section 8's signed platform/territory gates
- server/claudium_proxy.ts (claudiumServiceConfigured and the public typed
  unavailable-result pattern; its private helper is inspected as evidence only), server/claudium_spend_wire.ts (parse, never coerce),
  server/woc_market_proxy.ts (createWocMarketEconomyProxy, the service-computed fee
  splits the game never derives), server/woc_market_routes.ts (wocMarketConfig, the
  woc_market.disabled 403 refusal), server/steam/config.ts (steamEnabled)
- server/seeker_entitlement_db.ts (SEEKER_ENTITLEMENT_SCHEMA, the keep-forever comment,
  claimAvailableSeekerEntitlement with ON CONFLICT DO NOTHING, hasSeekerEntitlement),
  server/seeker_entitlement.ts (verifyCurrentSeekerEntitlement), server/db.ts (ensureSchema
  order, exportAccountData), server/freehold_db.ts, server/freehold_config.ts
- server/http/types.ts (CtxAccount: account/scope, no checkout-channel authority),
  server/claudium_proxy.ts (ClaudiumSpendInput and the private callServiceDetailed
  outgoing server-credential pattern, not an exported helper or checkout proof),
  src/runtime.ts (DesktopBridge.wocExchangeSupported) and
  src/game/woc_market_wiring.ts (wocMarketAttachAllowed: client presentation only),
  server/http/CLAUDE.md, server/http/registry.ts, .env.example, DEPLOY.md (the
  "Environment keys" table Phase 01 opens beside FREEHOLDS_ENABLED)
- tests/server/seeker_entitlement.test.ts, tests/server/storage_gates.test.ts,
  tests/server/http/surface_inventory.ts, tests/architecture.test.ts (the token firewall
  pin over src/sim), tests/monolith_budget.test.ts
- docs/freeholds/ux-spec.md and the signed content, measurement, service and policy
  artifacts referenced by state.md that this slice consumes.
- Required durable artifacts: docs/freeholds/content-manifest.md,
  docs/freeholds/content-numbers-workbook.md, docs/freeholds/art-brief.md and
  docs/freeholds/ux-spec.md; docs/prd/woc/freehold-service-contract.md,
  docs/prd/woc/freehold-counsel-memo.md, docs/prd/woc/freehold-terms-amendment.md,
  docs/prd/woc/freehold-store-listing-drafts.md,
  docs/prd/woc/freehold-deed-service-contract.md and
  docs/prd/woc/freehold-territory-authority-schedule.md.
The agent returns: the typed proxy/error/registration shape, persistent claim and receipt seams,
NEW service-owned checkout/territory authorization boundary and artifact status. Validate the concrete
freehold-deed-service-contract.md draft and its authority/territory schedule with
counsel and economy-service owners; absence of signature is a release gate, not an
unanswered design choice. The economy service verifies current territory and actual
eligible checkout session under the signed policy; unknown eligibility refuses NEW
spend. Accepted original operations remain recoverable. The game learns no country,
distribution/channel label or physical-client attestation. No KR-only claim or claim
of verified Epic/Solana current policy is permitted. The service policy module owns
the accepted supported-territory rows; counsel accepts their legal basis. Its exact
external repository/module or signed interface-artifact identity and current-policy
proof must be recorded before production enable; it is not a game geo module.
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
1. Service and authority artifact: finalize docs/prd/woc/freehold-deed-service-contract.md
   with mint, verify, prepare/freeze/quote/settle/cancel/recover contracts, immutable
   furnished-sale manifest identity and durable operation/account/plot binding. One
   current distinct Core asset per stable plot; collection membership is allowed and
   is not a legal conclusion. Individual freeze uses a PER-ASSET permanent delegate
   configured at mint, with recoverable thaw authority. Irreversible burn has its own
   separately signed recovery/moderation triggers and recorded authorization. No
   automatic lapse burn, upkeep destruction or door/entitlement denial. Document
   treasury royalties and fee splits as service-published values, not game arithmetic.
   The Metaplex Core page state.md cites is the live source for the base-asset cost:
   quote it as dated context by reference only, never as a figure in the packet or the
   code and never as the full mint quote (the service alone quotes the mint).
2. Typed proxy and fail-closed policy: NEW server/freehold_deed_config.ts strict
   live '1' also requires freeholdsEnabled; FREEHOLD_DEEDS_ENABLED defaults off for
   new deed actions. Add the .env.example rows (both deed flags commented out) and
   the matching DEPLOY.md "Environment keys" rows for FREEHOLD_DEEDS_ENABLED and for
   the env key behind the NEW allowSerializedCollectibles switch 38 lands (38's landing
   does not change the default), each stating opt-in, unset by default on the host
   /opt/eastbrook/.env, and that production never enables either without the recorded
   release gates; commit them as `docs(deploy): document the deed flags as opt-in and
   unset by default` with a body. NEW server/freehold_deed_proxy.ts owns
   mint/verify/quote/status
   adapter methods consuming the service's opaque verified allow/refusal/effect.
   Follow the typed-result pattern in server/claudium_proxy.ts with strict parsing
   and bounded IO; callServiceDetailed is private evidence, never an exported import.
   Thrown/network/malformed/unknown authority replies are typed unavailable and
   refuse NEW spend. The NEW economy-service issuer/verifier alone checks the
   actual eligible checkout session and current territory under signed policy;
   its opaque authorization binds account, purpose/kind, SKU, policy version, quote,
   operation and full plot/guild/custody fingerprint. The game checks binding via
   the verified service outcome, receives no channel/country claim and does not infer
   authority from headers, auth, Origin/UA/JSON, linked stores or server secret.
   No game geo parser or physical-client attestation module is added. Expiry or
   policy change cannot strand an accepted original operation or cause a new debit.
3. Durable claim/custody storage: freehold_deeds in freehold_deeds_db.ts references
   Phase 07 opaque stable plot identity and tracks one current asset with immutable
   transfer/receipt history, service revision and ownership/mutation fence. A
   once-claim INSERT is insufficient for repeated transfers: apply confirmed events
   transactionally through the NEW 07a producers: server/freehold_operation_db.ts
   prepareFreeholdOperation/applyFreeholdOperation own protected opaque authorization
   binding, fingerprint and durable receipt; server/freehold_mutation.ts
   commitFreeholdMutation owns atomic local custody/effect application. Phase 15's
   NEW server/freehold_purchases.ts is the initial opaque adapter consumer; the
   deed proxy consumes the same boundary, never duplicates its receipt authority.
   Additive/idempotent schema, reverse FK/export/delete policy
   and deliberate keep-forever replay rows: freehold_deeds and its receipt rows are
   pinned OFF the retention sweep by the same style of assertion as
   tests/server/main_retention_wiring.test.ts "neither storage receipts nor
   bank_ledger are placed on the retention sweep". Account erasure removes personal links
   according to the signed retention policy without destroying another owner's
   entitlement or reusable replay authority. Verification for an actual use is fresh;
   cosmetic stamps are bounded cached projections, never authority or per-frame IO.
4. Registry routes and tests: hand-author freehold_deed_routes.ts using the Phase 01
   RouteDef recipe, register import/spread and append deeds_disabled, geo-excluded,
   unavailable and already-claimed errors to the existing freehold block plus
   ERROR_CODES, API_ERROR_KEYS, EXPECTED_CODES and KNOWN_CODES. Do not rerun the
   existing-domain scaffold. Claim/status operations are guarded by createActiveGuard
   (server/http/middleware/bearer_active_guard.ts, instantiated per route table as
   activeAccount), rateLimit, authentication and current ownership. The service
   verifies opaque checkout and territory authority; game routes never accept or
   decode a channel/country label. Support reconciliation is service-owned tooling:
   the game applies an accepted entitlement/effect adjustment only through 07a's
   bounded recovery producer reading the immutable outcome, and 37 adds no game-side
   operator route or admin page (the service contract records this ownership).
   The three player-facing eligibility states the territory schedule proposes are NEW
   keys under the existing hudChrome.housing.charter.* family with exact English (D92;
   ux-spec carries the rows and ux-key-manifest.json regenerates in this phase with
   every cited count updated): charter.serviceUnavailable = "This service is
   unavailable for this account or location." (named once here; 38 reuses it for
   deeds), charter.eligibilityUnconfirmed = "Eligibility could not be confirmed. Please
   try again later." and charter.supportPointer = "Contact support with your saved
   request reference."; the apiError.freehold.* leaves for geo-excluded and
   unavailable mirror that English, and the keys ship dormant wherever the surface is
   denied (D86).
   Dark new-action gates refuse before service IO. Protected status/recovery of an
   accepted original intent remains admitted without new checkout authorization or
   debit, subject to current local entitlement/custody guards. Extend surface
   inventory and fakeCtx tests for both arms.
5. Runtime and handoff proof: disposable PG tests cover duplicate/cross-process
   claim, receipt replay after cache compaction, restart, service timeout after debit,
   stale revision, account delete and bounded verify recovery. Record query/index,
   cache/queue/deadline, bytes and retention evidence. NEW
   tests/server/freehold_deed_pins.test.ts holds the source-scan pin (beside 15's
   src/sim/content/freehold/ price pin) proving server/freehold_deed_config.ts,
   freehold_deed_proxy.ts and freehold_deed_routes.ts carry no price, SOL or split
   literal, and the territory fixture-schema validation named below. Validate signed
   counsel memo, Terms/listing drafts, supported countries and
   separate freeze/burn authority; flags stay dark until accepted. 37's territory
   fixtures and the external policy module's signed artifact both validate against the
   machine field table in docs/prd/woc/freehold-territory-authority-schedule.md
   (identifier names and types per row, owned by that schedule); 37 invents no second
   shape. Diff-path proof permits only required UI error leaves
   in src/ui/i18n.catalog/api_error.ts::apiErrorStrings, API_ERROR_KEYS in src/ui/api_error_i18n.ts,
   their generator-owned i18n artifacts and corresponding parity tests. Re-find the
   generated owners before editing; never hand-edit generated output. No runtime
   purchase/deed component, submodel, catalog fetch, handler, CTA, hidden DOM or ARIA
   surface is introduced, and src/sim/ remains unchanged. Test the explicit allowed
   catalog/mapping diff and forbidden runtime-surface cases separately.

INVARIANTS THIS PHASE MUST KEEP:
Every authored housing player string in ux-spec.md and its key manifest uses an
English hudChrome.housing.* key. Required runtime apiError.freehold.* protocol
bindings mirror that approved English in api_error.ts and API_ERROR_KEYS; they are
not a second housing HUD namespace or additional UX-manifest keys. Keep the allowed
error-catalog/generated parity diff while runtime purchase/deed surfaces remain
absent. Use the formatters from src/ui/i18n.ts.
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
- Run: `npx tsc --noEmit`; `npx vitest run tests/server/freehold_deed_routes.test.ts
  tests/server/freehold_deeds_db.test.ts tests/server/freehold_deed_pins.test.ts
  tests/server/http/surface_inventory.test.ts
  tests/server/http/error_codes.test.ts tests/server/new_endpoint.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/architecture.test.ts tests/monolith_budget.test.ts tests/server/main_retention_wiring.test.ts`;
  the pg-armed twin with TEST_DATABASE_URL set after `npm run db:up`; `git diff
  <phase-start>..HEAD --name-only | grep '^src/sim/'` must print nothing.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
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
- [ ] Concrete service/authority/territory artifacts specify all operations, furnished manifest custody, per-asset delegation and separately authorized irreversible burn; no automatic lapse loss or unsupported policy/cost claim.
- [ ] Every dark new-action route refuses before IO; the service rejects unknown/unsupported eligibility before NEW spend, while accepted original-operation recovery remains possible without new debit. The game sees opaque verified results only; all money gates, the narrow required error-catalog/mapping allowlist, runtime purchase/deed-surface absence and no src/sim/ diff are pinned. The .env.example rows and the DEPLOY.md "Environment keys" rows for both deed flags state opt-in, unset by default and no production enable without the release gates, in the docs(deploy) commit.
- [ ] Persistent plot/current-asset/receipt identity survives repeated transfers, restart and competing processes; service IO holds no DB lock and fresh verification is separate from cached cosmetics.
- [ ] Export/erasure, reverse-FK indexes, permanent replay authority, bounded recovery and real-PG proof are recorded; a missing external signature remains a release gate.
- [ ] All route/error/unit/PG tests, fresh reviews and contribution gate pass.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 37 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record FREEHOLD_DEEDS_ENABLED beside FREEHOLDS_ENABLED in state.md's "Runtime safety
and distribution" gate row so 39's pointer resolves.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-37-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
