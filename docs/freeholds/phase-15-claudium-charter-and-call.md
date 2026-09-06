# Phase 15: Claudium, the Freehold Charter and the Master Builder's Call

Wave A, the Cottage MVP. The spec is `progress.md` "15 Claudium: the Freehold Charter and
the Master Builder's Call"; the decisions are `state.md` D1 (the Charter is a
once-per-account grant the economy service records, mirrored into `account_freeholds`,
healed by the store-open reconcile, riding `POST /api/claudium/spend` with a game-side
SKU allowlist and a new spend kind `freehold`; the storage pending-row machinery is NOT
reused) and `state.md` D16 (the row with a rev compare-and-swap). This phase ships the
spend kind on the server, the two grants through the sim, the telemetry source, the flag
gating, and `docs/prd/woc/freehold-service-contract.md` (a durable PRD-side artifact,
never torn down with the packet) as the service-contract handoff (handoff-ready;
acceptance status recorded as an unsigned release gate unless a signature artifact is
on file). It ships
NO client surface (Phase 16) and tests against a fake service.

### Starter Prompt
```
This is Phase 15 of the Freeholds and Guildhalls feature: Claudium, the Freehold Charter
and the Master Builder's Call (spend kind freehold, the Charter grant into the account
row, the repair grant, the telemetry source, flag gating, the service contract doc).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices behind existing seams).

Goal: let the economy service sell exactly two things for housing, the Freehold Charter
(once per account, tier cottage) and the Master Builder's Call (repeatable, repair to
full), through the existing Claudium spend route with a new kind, and land each grant in
the account row and the live sim exactly once, while the game forwards a price
fingerprint and computes no price, peg, burn, or split.

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
- Memory scan: MEMORY.md and entries on the bank-storage packet and PR #3670 (the
  storage purchase flow, the FOR KEY SHARE locked wait, the pg twin), the storage SKUs
  service half (PR #32), the woc marketplace dev deploy being MAINNET, Postgres gotchas,
  server/tests gotchas, test-pin traps.

- Invoke database-performance-reviewer before storage/query/lock/cadence decisions;
  send the scoped diff surface and approved artifacts, then review the finished diff.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "15 Claudium: the Freehold
  Charter and the Master Builder's Call"), and this file
- server/claudium.ts (parseSpendKind, the kind === 'storage' branch in handleClaudiumApi,
  the /api/claudium/store filter line that uses isKnownStorageSkuId, the store-open
  reconcile that mirrors owned skins only after the service says owned,
  configureClaudiumRuntime and the ClaudiumGameHooks shape with grantWeaponSkins and
  storagePurchase, the "computes NO peg/price/balance" header), server/claudium_proxy.ts
  (the two hand-typed kind unions on ClaudiumStoreItem and ClaudiumSpendInput, the
  claudiumStore response filter, claudiumSpendDetailed, callServiceDetailed and
  neverReached), server/claudium_spend_wire.ts (parseClaudiumSpendWireResult)
- server/storage_purchases.ts (executeStoragePurchase: the locked order, the dry run
  before money moves, DEFINITIVE_REFUSAL_REASONS, the refusal vocabulary; read it to
  know what NOT to reuse), server/live_character_resolver.ts (resolveLiveCharacterFrom),
  server/main.ts (the configureClaudiumRuntime call and storagePurchaseHost closure; the
  legacy /api/claudium ladder that also calls handleClaudiumApi, the dual-edit rule)
- server/db.ts (grantAccountWeaponSkins and loadAccountCosmetics: the upsert idiom),
  server/freehold_db.ts as Phase 07 left it (FREEHOLD_SCHEMA, freeholdForAccount,
  upsertFreehold with the rev compare-and-swap, the pg twin), server/ws_auth.ts (the
  fresh-join account facts read where freeholdForAccount is called)
- src/sim/content/freehold/charters.ts (Phase 03: FREEHOLD_CHARTERS,
  isKnownFreeholdCharterId, no price, no copy), src/sim/content/storage_charters.ts (the
  twin), src/sim/bank.ts (bankGrantStorageSlots and StorageGrantResult: the dryRun
  contract and the live appliedStorageKeys adjunct, not durable replay authority), src/sim/freehold/state.ts
  and types.ts (the record: tier, condition stamp, the applied purchase keys field to
  add), src/sim/freehold/condition_core.ts (Phase 13: the repair-to-full arm)
- server/economy_telemetry.ts (COPPER_FLOW_SOURCES and SOURCE_BY_COMMAND),
  server/freehold_config.ts (freeholdsEnabled), server/http/error_codes.ts (append-only)
- tests/server/storage_gates.test.ts (the kind === 'storage' branch through both
  dispatch arms, the tampered owned:true row), tests/server/claudium.test.ts (store
  filtering, the mirror-only-after-authoritative-own rule, limiter order),
  tests/storage_charters.test.ts (the grant suite through sim.ctx),
  tests/server/helpers/ (fakeCtx, FakeRes, makeReq, FakeCharactersDb),
  tests/server/freehold_db.test.ts and its pg twin (Phase 07),
  tests/server/freehold_routes.test.ts and server/freehold_routes.ts (Phase 01: the
  freehold RouteDef table this phase appends to), server/http/registry.ts,
  tests/server/http/surface_inventory.test.ts, server/character_delete_db.ts (the
  CharacterStoragePurchaseOpen guard shape D88 mirrors)
- server/CLAUDE.md ("Hot paths", the dual-edit rule), server/http/CLAUDE.md
The agent returns: the exact edit list for a new spend kind (parseSpendKind, both proxy
unions, the store filter, the branch site); the runtime hook shape to add
(freeholdGrant beside grantWeaponSkins, and a live-apply hook beside storagePurchase);
the reconcile path that heals a lost Charter mirror; the rev CAS call shape; the
StorageGrantResult union to mirror; the telemetry rows to add; the fake-service harness
shape used by storage_gates.test.ts; the extraction that pays for any server/game.ts
line (none expected: the purchase path is REST, not WS).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

Deliverables (at most five):
1. Extend the existing durable housing operation boundary. Phase 07a owns
   server/freehold_mutation.ts::commitFreeholdMutation and
   server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation
   (the freehold_operations and freehold_operation_receipts rows under
   FREEHOLD_OPERATION_SCHEMA; 15 extends those rows, never a parallel table).
   Extend those records for the service: bind immutable operationId/idempotency key,
   account, opaque plotId, SKU, operation fingerprint (quoteId, catalogVersion, sku,
   amount and currency), the protected opaque checkoutAuthorization reference the
   service issued (stored and forwarded unchanged, never decoded, never logged or
   exposed on any wire), expected durable revision and globally fenced owner
   generation before repeated spend. Persist discoverable intent before service IO,
   release DB clients/locks, then call the service. The extended rows inherit 07a's
   D88 ON DELETE policy per row class: intent rows cascade only when no open operation
   exists, applied tombstones keep a nonidentifying operation identity, and an open
   Charter or Call operation blocks character or account deletion with 07a's
   CharacterFreeholdOperationOpen refusal class in character_delete_db.ts (the
   CharacterStoragePurchaseOpen guard shape). The
   authoritative service outcome and target grant receipt commit atomically before
   live mirrors acknowledge success. appliedPurchaseKeys may be a bounded live adjunct;
   it is never replay authority. Retain compact durable identities unless a signed
   service replay horizon permits proven safe tombstone/compaction. Do not copy the
   storage purchase pending-row/ladder/queue subsystem or create a second housing
   transaction framework.
   Preserve 07a's real legacy transaction touch set/relative locks, bank-ledger
   classifier before guild replay and existing storage/custody tail. Use its reviewed
   housing composition hook before COMMIT with the concrete participant manifest and
   disposable-PG proof. runFencedCharacterUpdate from
   server/character_save_statement.ts owns pre-lock/nonce fencing; beginCharacterSaveTx
   supplies deadlines, not that fence. Never replace this with an unchecked InitPlan
   or an invented generic account/character/guild/receipt lock hierarchy.
   Consume 13a's sole server/freehold_upkeep_ingress.ts calendar boundary and 13's safe
   src/sim/freehold/state.ts projection. source calendarId/schemaVersion/resetPolicyId
   and committed lifecycle/authority revisions retain original bill/receipt identity.
   Every historical dependency of durable condition/bill/credit evaluation/consumption
   must be irrevocably finalized; otherwise hold the affected local effect pending.
   Buying future credits does not require future finality. The mutable covered tail is
   never durable authority. The 07a effect transaction uses compatible calendar-head
   FOR SHARE and lifecycle guards at the reviewed hook, rechecks finalized dependencies
   and lower revision CAS, and preserves original-key recovery without another debit.
   No second interval store, receipt journal, poll or calendar migration. 13a's guarded
   process-generation/revision/digest install and exact current/superseded/conflicting
   ACKs are the sole source of live calendar status. A confirmed payment keeps its
   agreed recovery guarantee while local application waits for irrevocable facts.
   Service responses must be authenticated and bounded-decoded with full original
   operation fingerprint/effect validation. Malformed/nonterminal status is neither
   a grant nor proof of no debit. Existing claudium_proxy.ts outgoing credential,
   timeout and redirect refusal do not implement this NEW receipt/status protocol;
   written signed acceptance is not cryptographic runtime response verification.
2. Confirmed grant core. NEW src/sim/freehold/grant.ts (the state.md module list's
   grant.ts) exports freeholdGrantCharter and freeholdGrantRepair.
   freeholdGrantCharter upgrades the existing Inn Room to
   Cottage once per account, carrying approved exact furnishings and trophy records
   in place, and raises the Homesteader deed homesteader_first_cottage (Phase 03's
   content-manifest row, trigger kind manual) through the existing
   src/sim/deeds.ts::grantDeed(ctx, meta, deedId) call for the character whose
   admitted session receives the Cottage tier grant, once, never on a dry run, a
   replayed receipt or an alt; a grant applied by recovery with no admitted session
   raises it on the account's next admitted entry to the Cottage claim (the claim path
   already knows the entering character), still exactly once. freeholdGrantRepair sets
   condition 100 and satisfies the current unpaid
   Ledger bill, adds no future credit and consumes no future prepay. If this week's
   bill is already paid, the immutable quoted result explicitly says repair-only.
   Dry runs mutate nothing; grants remain server-only ctx operations, absent from
   COMMAND_NAMES and IWorld. Charter owned reconciliation requires service authority,
   never an unverified client/store row. A new Call requires a valid admitted target
   session; an already-confirmed receipt still recovers after that session disconnects.
3. Spend/reconcile integration. parseSpendKind, both claudium_proxy unions, store
   filtering and both dispatch paths add the two known freehold SKUs behind the
   default-off flag: freehold_charter_cottage from Phase 03's charters.ts and the
   Master Builder's Call id freehold_master_builders_call this phase appends to that
   allowlist (repeatable, no tier, no price, no copy). The game-side quote and status
   surfaces 16 and the listing copy consume are two NEW RouteDef rows appended by hand
   to Phase 01's server/freehold_routes.ts (registered in server/http/registry.ts; the
   generator is not rerun for the existing domain): POST /api/freehold/quote (the
   contract's Prepare row; a mutating method, so origin_check, content_type and the
   body schema gate it: a typed JSON body of sku, opaque plotId, source selection and
   an optional client idempotency key; it obtains the service quote and the opaque
   checkoutAuthorization, persists the intent through prepareFreeholdOperation and
   returns operationId, quoteId, catalogVersion, expiresAt, amount, currency,
   feeDetails and termsVersion, never the authorization reference; a repeated body
   with the same idempotency key returns the same open intent, never a second one)
   and GET /api/freehold/operation/:operationId (the side-effect-free status read by
   operation identity: pending, confirmed, refused or recovered with safe values
   only), each with its tests/server/http/surface_inventory.test.ts row (method POST
   and GET respectively) and its freehold.* error catalog rows. /api/claudium/store
   rows are not widened; the Charter's owned flag still rides the existing store row
   for reconcile. The spend rides POST /api/claudium/spend
   with kind freehold carrying operationId and quoteId beside expectedCostClaudium; NEW
   server/freehold_purchases.ts matches all three against the stored intent (a
   mismatch is quote drift), forwards the stored opaque authorization and uses the
   shared operation boundary and live-owner resolver; unknown SKU, kind mismatch,
   quote drift, expired quote, missing hook and unaccepted gates fail closed. The
   quote fields 16's charter.feeDetails, charter.quoteExpiry and charter.terms rows
   render (owner 16, exact English in phase-16 and ux-spec section 8; D92, one owner
   per key) are supplied by this route; the client formats expiresAt with
   formatDateTime and never formats a service amount with formatMoney. Ambiguous debit
   retries/reconciles only the original operation key, never issues a replacement
   charge. Store-open
   Charter reconciliation and bounded background receipt recovery share admitted,
   cancellation-aware work; no lock spans network IO and no per-tick SQL is added.
   Telemetry records housing copper sources without computing service money values.
4. Service contract handoff and growth rails. Validate the already-produced durable
   docs/prd/woc/freehold-service-contract.md (handoff-ready; acceptance status recorded
   as an unsigned release gate unless a signature artifact is on file): initial SKU
   catalog/versioned quotes,
   once-owned Charter versus repeatable Call, exact current-bill repair effect,
   account/plot/guild-bound idempotency, immutable outcomes, refund and ambiguity
   rules, published conversion/burn policy and outage intervals. Service acceptance,
   counsel and published Terms remain explicit release gates in state.md. Inventory
   actual receipt/recovery queries, predicates, ordering, limits, indexes, retention,
   row/encoded-byte bounds and monitoring for growth, oldest pending intent, queue
   wait, pool wait and failures. Reuse 07's admission/deadline and export policy and
   07a's D88 deletion policy. Support reconciliation ownership is explicit: the economy
   service owns the support tooling and the monetary side (its "Calibration, refunds
   and support" section); this phase adds no operator route or admin page, and an
   accepted entitlement/effect adjustment reaches the game only as an immutable linked
   outcome discovered by the same original-operation status reader and applied
   atomically through 07a, the contract's Recovery row.
   Literal D9 retains game-server ignorance of distribution. Service-owned NEW
   verification yields opaque account/purpose/SKU/policy/quote/operation-bound
   authorization, independently of client labels and UI capability. The service
   artifact must identify its issuer/verifier, conformance evidence and exact fact
   authorized before release; no current trusted channel field is invented. Unknown
   eligibility refuses a new charge, but an already confirmed payment remains
   recoverable under the original identity.
   No housing SQL runs per tick, render frame or viewer refresh. Store-open/status and
   original-operation recovery may issue explicitly admitted bounded queries through
   the shared operation/projection owners. Account/operation single-flight, request
   cancellation and measured connection/query/index/result limits bound demand; no
   independent UI scan or poller. Recovery always keeps the original operation identity
   and immutable receipt. Record receipt growth and accepted retention semantics.
5. Crash/race proof. Fake-service tests prove both route paths, tampered ownership,
   quote drift and disabled catalogs. Disposable-PG tests prove service-confirmed
   effect+receipt atomicity, timeout after debit, restart before/after grant, owner
   disconnect, same-key cross-process races, stale CAS/global-fence refusal, replay
   after live-array compaction and the D88 deletion race (character/account deletion
   against an open operation refuses with CharacterFreeholdOperationOpen; a closed one
   proceeds). A
   failed apply stays discoverable for original-key recovery with neither loss nor
   duplicate effect. The fake service proves the game-side binding arm: apply refuses a
   receipt whose authorization binding does not match the stored intent, the stored
   reference is forwarded byte-identical and never decoded, and no wire, log or event
   carries it; the service-side cross-account, cross-SKU, cross-quote and
   cross-operation reuse refusals are owed by the signed issuer/verifier conformance
   fixtures, not proven here. Run database review before/final,
   migration-safety, privacy-security-review and architecture review of grant purity;
   preserve existing storage behavior tests unchanged.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) written counsel acceptance, published accepted Terms/
  listing artifacts and the accepted economy-service contract before production enable
  or any housing-bearing store submission; external sign-off status lives in state.md;
  (2) FREEHOLDS_ENABLED defaults off and the server refuses/hides housing purchases
  while dark; (3) the seven-distribution surface map independently gates housing purchase,
  approved website management and the deed surfaces (housing use is the server
  entitlement gate read through the housing facet, never a map or HudFeatures row, per
  D91), including complete submodel/handler/catalog/DOM/accessibility/error absence on
  denied surfaces as the D86 runtime contract. These are cumulative.
- The economy service owns prices and token math: the client forwards quoteId and
  expectedCostClaudium verbatim and the server matches them, with operationId, against
  the stored intent fingerprint; the game never computes a peg, a burn, a split, or a
  price; no price literal in src/sim/content/freehold/charters.ts (a negative property
  pin).
- Exactly-once: durable operation receipt identity is replay authority; target effect and applied
  receipt commit atomically. A bounded live key array cannot authorize recovery or
  forget an old effect. Stale CAS/global-fence refusal leaves recoverable intent intact.
- Server authority and the storage-slot pattern: a purchased effect arrives as a
  server-applied grant after the service confirms; the grant functions are never on
  COMMAND_NAMES or IWorld.
- Token firewall as state.md scopes it: no on-chain word (wallet, token, $WOC, mint,
  holder, marketplace, on-chain, Solana) in src/sim/; the Book of Deeds is game content
  and is not firewall vocabulary; the on-chain words live in
  docs/prd/woc/freehold-service-contract.md and server/ only.
- Persistence gate: additive idempotent DDL only, JSONB back-compat for older rows, an
  exportAccountData row already present (Phase 07), keep-forever stated.
- i18n: the policy in docs/freeholds/implementation-plan.md; refusal reasons are stable
  tokens the client localizes (the storage vocabulary), new freehold apiError leaves append by hand to the existing domain catalog and
  mappings, preserving scaffold names; rerunning the generator for an existing domain fails.
- Hot paths: zero tick/render/viewer SQL; admitted bounded store-open/status and
  original-operation recovery queries use shared owners, single-flight/cancellation and
  measured query/index/result limits. Preserve original identity and receipt growth rails.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any client purchase surface, store row, button, or toast (Phase 16).
- The storage pending-row, recovery coordinator, ladder hold, or applied-effect queue
  machinery (D1 says do not reuse it).
- Gold-priced housing anything (land is money-only: the state.md "Locked decisions"
  rulings preamble and D3).
- The Lodge upgrade SKU (Phase 21), the second freehold SKU (Phase 42), any deed mint
  (Wave D).

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: architecture-reviewer, privacy-security-review,
database-performance-reviewer, migration-safety, server-hot-path-reviewer,
test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run: `npx tsc --noEmit`; `npx vitest run tests/server/freehold_gates.test.ts`;
  `npx vitest run tests/freehold_grant.test.ts` (the sim grant suite); `npx vitest run
  tests/server/claudium.test.ts tests/server/storage_gates.test.ts
  tests/server/storage_purchases.test.ts tests/storage_charters.test.ts
  tests/server/freehold_db.test.ts tests/server/freehold_routes.test.ts
  tests/server/http/surface_inventory.test.ts tests/server/http/error_codes.test.ts
  tests/server/main_retention_wiring.test.ts tests/api_error_code_parity.test.ts
  tests/localization_fixes.test.ts tests/architecture.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts tests/freehold_content.test.ts`; then the pg-armed twin
  with `TEST_DATABASE_URL=postgres://eastbrook:change-me@localhost:5433/eastbrook` after
  `npm run db:up`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md,
  the full roster above: architecture-reviewer (grant.ts purity, no Rng, no wall clock),
  privacy-security-review (the spend branch, the fingerprint, the authorization
  reference handling, the reconcile trust boundary, the two routes, the flag),
  migration-safety (the record fields, the D88 ON DELETE policy and any DDL),
  database-performance-reviewer (before storage decisions and on the finished diff: the
  upsert, the CAS, the quote/status reads, any index), server-hot-path-reviewer (the
  store-open reconcile, the status route and the bounded recovery work),
  test-coverage-auditor (every pin above) and qa-checklist (the whole diff). Prompt each
  for COVERAGE not filtering; each writes its report to a file. Do not commit until ALL
  findings, including nits, are resolved consistently with locked rulings and the fixes
  have fresh review.

- Required reviewers for the complete settled diff: architecture-reviewer,
  privacy-security-review, migration-safety, database-performance-reviewer,
  server-hot-path-reviewer, test-coverage-auditor and qa-checklist (the same seven as
  the required list above).
  Database performance reviews happen before implementation decisions and again on
  the finished diff; persistence/security pair on stored/authority surfaces. Runtime
  PG evidence, bounded workload/query/index/byte limits and cancellation are required.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): grant the Freehold Charter and the Master Builder's Call exactly once
- feat(server): add the freehold spend kind with the quote and status routes behind the flag
- feat(server): mirror the Charter into the account row and book freehold telemetry
- docs(prd): write the freehold service contract for the two housing SKUs
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] A Charter spend through the fake service lands tier cottage in account_freeholds
  and in the live record when the owner is online, once; a replayed key grants once; a
  second Charter refuses already_granted; the store-open reconcile heals a deleted
  mirror ONLY after the service reports owned (the tampered row case);
  homesteader_first_cottage is raised exactly once for the receiving character, never
  on a dry run, a replayed receipt or an alt, and on the next admitted Cottage entry
  after a session-less recovery (tests/freehold_grant.test.ts arms).
- [ ] A Call requires a valid admitted target when initiated, restores 100 and credits
  this unpaid bill exactly once, preserves future prepay, and recovers original-key
  confirmed intent after disconnect/restart. An already-paid bill has an explicit
  quoted repair-only outcome; no duplicate grant after live-array compaction.
- [ ] Unknown SKU, price drift (the fake service answers price_changed), an expired
  quote, a receipt whose authorization binding mismatches the stored intent, and the
  dark flag refuse through BOTH dispatch arms identically; the store filter hides both
  SKUs while dark; POST /api/freehold/quote and GET
  /api/freehold/operation/:operationId have surface-inventory rows with those methods,
  refuse while dark and never return the authorization reference; GET on the quote
  path answers 405 with Allow, a POST with a cross-site Origin is refused by
  origin_check under API_ORIGIN_CHECK_ENFORCE, and a replayed idempotency key mints no
  second intent (all pinned in tests/server/freehold_routes.test.ts).
- [ ] tests/server/claudium.test.ts and tests/server/storage_gates.test.ts pass
  UNCHANGED; the pg-armed twin passes with the D88 deletion-race arm
  (CharacterFreeholdOperationOpen; N tests ran, 0 skipped).
- [ ] docs/prd/woc/freehold-service-contract.md exists with the two SKU ids
  (freehold_charter_cottage and freehold_master_builders_call), the kind, the
  fingerprint rule, the settlement policy line, and is marked handoff-ready with its
  acceptance status recorded as an unsigned release gate unless a signature artifact is
  on file.
- [ ] No price literal in src/sim/content/freehold/; no on-chain word (the state.md
  firewall scope) in src/sim/ (tests/architecture.test.ts); the grant functions are absent from COMMAND_NAMES and
  IWORLD_MEMBERS (pinned).
- [ ] All STEP 3 suites green; all triggered reviewers confirm ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 15, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 15: the spend kind, the two SKU ids,
  the hook names, the telemetry source, the record fields including the authorization
  reference, the two routes with their methods, the quote fields the three charter.*
  keys 16 owns render (no key is added here), any code; the service artifact and its
  unaccepted/accepted release gate status).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, external release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-15-qa.md

STOPPING RULES:
- Stop if a repeated purchase lacks durable discoverable intent and atomic receipt/
  target application through 07a. The housing-specific durable extension is authorized;
  copying the storage pending-row subsystem is outside the locked design.
- Stop if any path would compute a price, peg, burn, or split in the game.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
