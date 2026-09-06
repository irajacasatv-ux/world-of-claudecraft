# Phase 15 QA: audit the Claudium Charter and Call

Audits `phase-15-claudium-charter-and-call.md`. Verdict goes in `progress.md` (row "15
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 15 (QA) of the Freeholds and Guildhalls feature: audit Claudium, the
Freehold Charter and the Master Builder's Call (the spend kind, the two grants, the
mirror and reconcile, the telemetry source, the flag gating, the service contract).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 15 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "15 Claudium: the Freehold Charter and the
Master Builder's Call", missing tests, dead code, exactly-once on both grants, the
fail-closed flag, the fingerprint rule, the reconcile trust boundary, and the token
firewall; fix what the audit finds; record a verdict.

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
  origin/feature/masterwrought while PR #3872 is open, else the newest origin/release/**;
  release-merge-audit after a non-empty merge; pnpm install --frozen-lockfile if
  patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the Postgres and server/tests
  gotcha clusters, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("15 Claudium: the Freehold
  Charter and the Master Builder's Call" and the row),
  docs/freeholds/phase-15-claudium-charter-and-call.md (what was promised),
  docs/prd/woc/freehold-service-contract.md (what was written for the service; a
  durable PRD-side artifact, never torn down with the packet)
- the Phase 15 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 15)
- the pins the diff claims: tests/server/freehold_gates.test.ts,
  tests/freehold_grant.test.ts, tests/server/freehold_db.test.ts and its pg twin,
  tests/server/freehold_routes.test.ts (the quote and status routes),
  tests/server/http/surface_inventory.test.ts, tests/server/claudium.test.ts,
  tests/server/storage_gates.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, the exact
order of operations in the live-apply host (dry run, persist discoverable intent, unlocked service IO, atomic grant/receipt, mirror), where the
purchase key is stored, and any TODO, unused import, price literal, or on-chain word (the
state.md firewall scope; Book of Deeds vocabulary is not firewall vocabulary) under
src/sim/.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-15-claudium-charter-and-call.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

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
  while dark; (3) the seven-distribution surface map independently gates housing purchase,
  approved website management and the deed surfaces (housing use is the server
  entitlement gate read through the housing facet, never a map or HudFeatures row, per
  D91), including complete submodel/handler/catalog/DOM/accessibility/error absence on
  denied surfaces as the D86 runtime contract. These are cumulative.
- The economy service owns every price and all token math; the client forwards the
  immutable quote fingerprint and computes no tariff, conversion, discount or burn.

STEP 3 - VALIDATION:
Required named reviewers for this file: architecture-reviewer, privacy-security-review,
database-performance-reviewer, migration-safety, server-hot-path-reviewer,
test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run the Phase 15 STEP 3 suite list plus `npx tsc --noEmit`, including the pg-armed
  twin with TEST_DATABASE_URL set after `npm run db:up`.

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
- [ ] Every Phase 15 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "15 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row or in
  docs/prd/woc/freehold-service-contract.md.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-16-steward-panel-and-store-surfaces.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 15 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
