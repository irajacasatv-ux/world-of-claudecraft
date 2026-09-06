# Freehold economy-service contract draft

Status: adopted packet requirements, approved 2026-09-06; external sign-off remains a release gate. This is a
concrete implementation handoff, not an accepted tariff or deployed API. All
contract field names and operation names below are NEW planned names unless an
existing source file is explicitly identified. The packet decision record remains
in [state.md](../../freeholds/state.md).

The economy-service maintainer owns prices, conversion, payment settlement and
receipts. Fernando owns product approval and activation. Phase 07a produces the
game transaction composition; 13 produces pure upkeep/finality rules and NEW 13a
produces authoritative calendar storage/ingress/host wiring; 15 produces
the initial adapter and fake-service conformance suite; 20 validates the first
production acceptance certificate. Phase 15 appends the first two rows and
Phases 21, 29, 32, 37, 38, 40 and 42 append their SKU/effect rows, in the uniform
effect-inventory template below, with paired QA evidence before their
respective activation.
Phases 14 and 16 consume capability and price states without authorizing spend.

Existing decisions underpin these adopted, unsigned contract requirements: D1
under "Locked decisions" in [state.md](../../freeholds/state.md) supplies the
once-per-account Charter shape; D9 there keeps the game server unaware of
distribution. D21 and D22 in the same section respectively constrain optional
deed surfaces and preserve ordinary housing use at low condition. Fernando approved
R01 through R46 on 2026-09-06. The new interfaces and deny-default policy
requirements are adopted; live service behavior, tariff publication, legal
acceptance and platform determinations still require the named external evidence.

In-client player text referenced by this contract uses only the
`hudChrome.housing.*` ids pinned by [ux-spec.md](../../freeholds/ux-spec.md) and
[ux-key-manifest.json](../../freeholds/ux-key-manifest.json) (D92) in the NEW
`housing` subtree of existing `hudChromeStrings` in
[src/ui/i18n.catalog/hud_chrome.ts](../../../src/ui/i18n.catalog/hud_chrome.ts).
That subtree is not implemented. Its producing UI work adds English source
values only; generated bundles are regenerated, never edited by hand.

## Release gates and acceptance certificate

Every priced operation requires all three gates: signed counsel acceptance for
its complete distribution flow, published accepted Terms, and an accepted
economy-service contract with a published versioned catalog/settlement schedule.
Feature flags alone never satisfy these gates. Development fake-service use does
not satisfy them either. Adding a SKU repeats the gates for that SKU and effect.

| Required artifact | Accountable signer | Required evidence | Gating event | Current status |
|---|---|---|---|---|
| Service protocol acceptance | Economy-service maintainer and game-server maintainer | Contract digest, deployed protocol version, conformance evidence, receipt recovery runbook | Any real paid operation | Unsigned; disabled |
| Checkout authorization acceptance | Economy-service maintainer, security reviewer and counsel | Exact NEW issuer/verifier, accepted checkout-session proof, opaque authorization binding and expiry/revocation/replay conformance | Any new real spend | Unimplemented/unsigned; disabled |
| Calendar authority acceptance | Economy-service maintainer and game-server maintainer | Stable calendar/schema/reset-policy identity, coverage/finality guarantees, per-process-generation push/ACK and bootstrap/reconciliation proof, versioned workload contract | Upkeep evaluation or dependent paid effect enablement | Proposed/unsigned; disabled |
| Catalog and settlement publication | Economy-service maintainer and Fernando | Exact SKU rows, accepted rails, prices, expiry policy, conversion and fee rules, burn/treasury publication URL and digest | A SKU becoming purchasable | Unsigned; disabled |
| Upkeep calibration acceptance | Fernando and economy-service maintainer | Accepted numeric provenance worksheet, versioned bill schedule, material eligibility and source measurements | A bill or guild allowance becoming payable | Unsigned; disabled |
| Legal and Terms acceptance | Counsel and Fernando | Signed memo, published Terms version, approved distribution capabilities | Production enablement or housing-bearing storefront submission | Unsigned; disabled |
| Operational acceptance | Game-server maintainer, economy-service maintainer and operator | Restart/outage/replay/refund drills, bounded load evidence, monitoring and on-call owner | Production enablement | Unsigned; disabled |
| Capable-release acceptance | Game-server maintainer and Fernando | Named minimum capable build/service/schema versions, compatible rollout matrix, full account export/lifecycle coverage and quiescent rollback/recovery procedure | Housing enablement | Proposed/unsigned; disabled |

The signed certificate supplies artifact IDs and digests, effective date, signer
identity and role, exact build/service versions, approved distributions/SKUs, and
revocation status. Missing, expired, revoked or mismatched evidence fails closed.
Certificate fields are deliberately unsigned release gates, not undecided design.
Signed acceptance means a written approval artifact. It does not imply a runtime
cryptographic signature scheme. Any such scheme requires its own exact wire,
issuer/key distribution, validation and rotation protocol plus tests. Independently,
15/37 must prove authenticated bounded service responses, complete operation/
fingerprint/effect checks and typed terminal outcomes. Malformed or nonterminal
responses never authorize a grant or establish that no debit occurred.

## Catalog, quote and settlement authority

The service returns a versioned catalog. Each entry binds `sku`, operation `kind`,
effect-schema version, prerequisite schema, eligibility-policy version, currency,
amount representation, tax/fee disclosures, `catalogVersion`, publication digest,
and whether the SKU is enabled. A game-side allowlist permits only implemented
effect schemas; an unfamiliar entry cannot create a button or authorize a grant.

A quote binds `quoteId`, `catalogVersion`, `operationId`, internal authenticated
`accountId`, opaque `plotId`, optional `guildId`, `kind`, `sku`, the complete
effect/input fingerprint, expected resource revisions, total amount, currency,
fees/taxes, `expiresAt`, settlement-policy version and terms version. The service
owns quote lifetime and authoritative expiry checks. The client formats returned
values in their actual accepted service denomination. Existing
[src/ui/i18n.ts](../../../src/ui/i18n.ts) exports `t`, `formatNumber`,
`formatDateTime` and `formatMoney`; `formatMoney` formats game copper and MUST NOT
format or convert Claudium, $WOC, SOL or fiat service amounts. Phase 16 consumes
the accepted service amount/currency schema with locale-aware formatting; missing
or unsupported denominations are unavailable. The client does not derive a price
from
USD examples, a guild multiplier, market values, mint-cost estimates or a token
exchange rate. Expired quotes require a new visible quote and confirmation before
spend. A quote revision cannot silently replace a player's accepted total.

Catalog absence, disabled SKU, stale catalog, unsupported effect, missing quote,
unknown currency, expired quote and service outage all produce `price-unavailable`
or a more specific typed status. Existing home use and material-only actions stay
available under their ordinary rules. No fallback price is charged or displayed.
Denied distributions never fetch or construct the purchase submodel, including
hidden DOM, accessibility labels, errors and retry paths.

## Current payment source evidence

These are existing code anchors, separately verified from the NEW housing work:

| Current source | Export/member or observed behavior | Evidence boundary |
|---|---|---|
| [server/http/types.ts](../../../server/http/types.ts) | Exported `CtxAccount` contains account identity and scope | No authenticated running distribution |
| [server/claudium_proxy.ts](../../../server/claudium_proxy.ts) | Exported `ClaudiumSpendInput` has no trusted checkout/channel field | Existing spend input is not the proposed opaque authorization contract |
| [server/claudium_proxy.ts](../../../server/claudium_proxy.ts) | Private `callServiceDetailed` writes the outgoing `x-woc-economy-secret` header | Observed server-to-service credential only; the external verifier and its semantics are not present in this tree and require signed evidence |
| [src/runtime.ts](../../../src/runtime.ts) | Exported `DesktopBridge` has optional member `wocExchangeSupported` | Client presentation capability, not a standalone export or checkout attestation |
| [src/game/woc_market_wiring.ts](../../../src/game/woc_market_wiring.ts) | Exported `wocMarketAttachAllowed` consumes that bridge capability | Existing Exchange presentation behavior, not implemented housing authorization |

Origin, user agent, client JSON and linked store accounts cannot attest which
physical client is running. Neither the outgoing server credential nor a client
presentation flag establishes an eligible housing checkout. These source facts
do not claim that a remote verifier was inspected or already accepts this model.

## Checkout authorization and the D9 boundary

Preserve D9 literally: the game server does not learn a distribution/channel
label. The NEW required economy-service issuer/verifier authorizes an actual
eligible checkout channel and session under its signed policy. It does not claim
to identify the physical application from unverifiable signals. The service's
internal eligibility policy and checkout-session evidence stay on that service.
The planned client implementation applies the seven-distribution housing
presentation rules; that housing map is not shipped yet. Those rules neither
issue nor prove payment authorization.

The NEW `checkoutAuthorization` is an opaque authorization reference bound by the
service to the authenticated account, purpose/kind, SKU, policy version, accepted
quote, operation identity and full plot/guild/effect fingerprint. The game host
passes the opaque reference and obtains the service's validated safe effect or
typed refusal. It never decodes a channel claim or accepts one in request JSON.
The service validates the binding, issuer authenticity, session eligibility,
expiry/revocation and idempotent consumption before any new debit. Cross-account,
cross-purpose, cross-SKU, cross-quote and cross-operation reuse refuse. A repeated
original operation discovers its existing outcome instead of authorizing a new
debit. Authorizations and checkout proof are not logged or exposed to spectators.

Phases 15 and 37 require a signed artifact specifying the actual issuer and
verifier's external repository/module or immutable signed interface-artifact
identity, exact interfaces, proof of an approved checkout session/channel, protected
handoff and storage, authorization lifetime/revocation, exact bindings, status
discovery and conformance fixtures. The service maintainer and security reviewer
must prove that the issuer cannot turn an arbitrary client capability, Origin,
user agent or linked store account into an eligible checkout. Counsel accepts
the complete resulting flow. These interfaces and proofs are not shipped today;
their unaccepted state blocks new real spend rather than inviting an implementer
to invent distribution attestation.

Proposed game consumers are NEW `server/freehold_purchases.ts` for opaque
authorization, quote, spend and status/reconcile adapter calls, reached from the
client through two RouteDef rows appended to the existing `server/freehold_routes.ts`
table, POST `/api/freehold/quote` (Prepare, a mutating method with a typed body of
sku, opaque plotId, source selection and an optional client idempotency key; a
repeated key returns the same open intent: returns operationId, quoteId,
catalogVersion, expiresAt, amount, currency, fee/tax disclosures and terms version,
never the authorization reference) and GET `/api/freehold/operation/:operationId`
(the side-effect-free status read by operation identity); NEW
`server/freehold_operation_db.ts` for protected durable authorization bindings,
fingerprints, intents and receipts; and later NEW
`server/freehold_deed_proxy.ts` for deed operations through the same boundary.
The external economy service owns the issuer/verifier. No game consumer learns
a channel label or becomes physical-distribution attestation. These file owners
are verified in the adopted producer chain, not existing source files.

Unknown eligibility or failed authorization refuses new spend. It does not
strand an already accepted payment: receipt discovery, original-operation local
application and an accepted compensation path continue under the recorded
immutable outcome without requiring a new checkout session or current eligibility.
No recovery path charges again to replace an expired authorization. Existing
entitlement/ownership/custody guards still apply to the local effect.

## Settlement publication

This adopted service contract requires every accepted housing purchase to settle
in $WOC
through the economy service, including conversion of any supported fiat or SOL
input. Claudium is the quoted purchase interface where the existing store uses it;
the game never computes its underlying conversion or settlement. This rule does
not approve a rail or authorize an unimplemented checkout. The service's signed
settlement publication MUST enumerate each supported input rail, quoted input
denomination, conversion execution point and rate authority,
slippage/requote policy, fees, taxes, rounding, settlement denomination, treasury
destination identifier, burn mechanism, burn timing, failure treatment, and
reconciliation evidence. It supplies the exact burn/treasury/resale/royalty values
for the accepted version. Existing illustrative packet ratios are design targets
only and are not acceptance certificates. Each successful receipt identifies the
applied version and reconcilable settlement record; any delayed burn has a
discoverable pending/final record. Unsupported rails are refused. Only the
service computes or executes conversion, division, burn and treasury settlement.

## Identity and durable protocol

The 07a producer assigns NEW `server/freehold_operation_db.ts` exports
`prepareFreeholdOperation` and `applyFreeholdOperation`, and NEW
`server/freehold_mutation.ts` export `commitFreeholdMutation`. The producer is
[07a transactional mutation boundary](../../freeholds/phase-07a-transactional-mutation-boundary.md)
with [paired QA](../../freeholds/phase-07a-qa.md). These are adopted documentation
contracts; none of these APIs exists in the source tree yet. The external service
adapter exposes equivalent typed prepare/spend/status/reconcile behavior without
requiring these internal names to become HTTP endpoint names.

An operation identity is immutable and unique. Its fingerprint binds the acting
account, target opaque plot, guild if present, SKU, kind, exact intended effect,
resource revisions, quote and catalog versions, source selection, fixed bill
batch, any custody manifest and the opaque checkout-authorization binding. The
service rejects reuse with any changed field. Authentication supplies the game
account; the NEW service issuer/verifier supplies eligible-checkout authorization
without revealing a channel label to the game host. Request JSON asserts neither
authority. Public events contain `operationId`, `plotId`, `kind`, typed
status/reason and safe values, never raw account keys, credentials or service
receipts. Only matching operation/plot/kind responses complete the initiating UI.

| State/transition | Required durable behavior |
|---|---|
| Prepare | Obtain the service's validated opaque checkout authorization outside DB admission. Validate current entitlement, plot fence, resource preconditions, current catalog and quote. Persist a discoverable intent, protected authorization reference and fingerprint before any external spend. Commit preparation and release the DB client. |
| Spend request | Submit the original operation identity, opaque authorization and accepted quote. The service revalidates checkout eligibility/binding before a new debit, stores a unique idempotency record and exposes status lookup by operation identity. It may report pending; pending is not a successful grant. |
| Confirmed service outcome | A terminal outcome is immutable. Success supplies a discoverable receipt bound to the full fingerprint; refusal supplies proof that no debit occurred. A later refund is a separate linked record. |
| Apply | Load the stored intent and verify the confirmed receipt, its original accepted authorization binding and current local effect guards. Later checkout expiry/eligibility changes do not block recovery of that accepted payment. `applyFreeholdOperation` stages the exact effect. `commitFreeholdMutation` atomically commits inventory/material/gold/fund effects, housing effect, receipt identity and intent transition. Failed fencing, revision or receipt guards abort all local halves. |
| Acknowledge | Publish the committed result/revision only after commit. Duplicate callers receive the same outcome; they cannot regrant the effect. A wire revision is distinct from the durable expected revision. |
| Ambiguous request or commit | Retain the discoverable intent. Query/retry only the original operation identity; never create a replacement purchase to resolve uncertainty. Reconcile service and local receipt authority before retrying application. |
| Recovery | On restart/login/store opening and bounded background recovery, discover unresolved intents and service outcomes. Resume idempotent application or the accepted compensation flow. Recovery cannot depend on the original client staying connected. |

No database transaction, checked-out client, advisory lock or process-local writer
is held while making external service calls. Required serialization is acquired
before database admission; workers never recursively queue or flush their own
character. Background reconciliation joins the existing shared admission seam
with bounded queues, cancellation, workload deadlines and retry backoff from the
service's accepted policy. Autosave permits one running write and one pending
dirty generation per owner, clearing only a committed generation.

The bounded live applied-key list is a cache, never replay authority. Durable
operation/receipt identities remain valid for supported replay and recovery. The
default is to retain compact replay tombstones indefinitely while removing
unneeded payload. Any later compaction requires an accepted service-enforced
replay horizon and proof that old identities can no longer be charged or applied.
Hard account deletion must preserve the minimum nonidentifying anti-replay
identity and lawfully retained audit authority specified by the accepted written
retention schedule (a named component of the counsel evidence bundle and the
Terms certificate under the state.md "Counsel, Terms and storefront model" gate
row). 07a states the ON DELETE policy per row class (D88): intent rows cascade
only when no open operation exists; applied tombstones retain a nonidentifying
operation identity with the account reference nulled or scalar and cascade only
under the accepted retention schedule. Soft account deactivation is a separate
operation described below; it does not trigger these hard-deletion rules or
erase replay history.

## Transaction composition and workload evidence

07a produces an ordered touch-set manifest for each mutation and recovery path.
It preserves the exact legacy effects carried by the captured character snapshot:
account parents; character pre-lock and nonce-fenced update; bank-ledger receipt
classification; market/mail effects when present; sorted guild-bank replay;
storage purchase advisory-lock/receipt effects; and custody completion. Housing
work has one documented extension position before commit with no later legacy
lock reversing the order. Include foreign-key parents, unique-conflict waits and
deferred triggers. A generic accounts-to-receipts hierarchy is not this proof.

The current-source export inventory is evidence for that future manifest, not a
completed housing touch-set proof:

| Existing source | Exact export/member and scope |
|---|---|
| [server/db.ts](../../../server/db.ts) | `saveCharacterState`, `saveCharacterAndMarketState`, `saveCharacterAndGuildBankState` and `saveCharacterStateOnClient` carry actual save call order and the caller-owned-helper distinction |
| [server/bank_ledger_save_effects_db.ts](../../../server/bank_ledger_save_effects_db.ts) | `lockCharacterSaveEffectAccountsOnClient` owns account-parent lock work |
| [server/character_save_transaction.ts](../../../server/character_save_transaction.ts) | `prepareCharacterSaveEffects` validates captured effects; `beginCharacterSaveTx` opens the bounded transaction, not the complete save sequence |
| [server/character_save_statement.ts](../../../server/character_save_statement.ts) | `CHARACTER_SAVE_ROW_LOCK_SQL` and `runFencedCharacterUpdate` supply row pre-lock and fenced update; `characterUpdateStatement` and `liveSaveFence` describe statement/fence construction |
| [server/bank_ledger_batch_db.ts](../../../server/bank_ledger_batch_db.ts) | `writeBankLedgerCommandBatches` classifies/claims the captured receipt prefix in the caller transaction |
| [server/guild_bank_receipt_db.ts](../../../server/guild_bank_receipt_db.ts) | `prepareGuildBankReceiptReplay`, `guildBankSavesForNewClaims` and `writeClaimedGuildBankEffectsOnClient` prepare, select and write newly claimed guild effects |
| [server/storage_purchase_db.ts](../../../server/storage_purchase_db.ts) | `lockStorageAppliedEffectAccountsOnClient`, `writeStorageAppliedEffectsOnClient` and `beginStoragePurchase` own existing storage effect/start authority, not housing operations |
| [server/woc_market_custody.ts](../../../server/woc_market_custody.ts) | Exported `createWocMarketCustody` returns `runSerialized`, the incompatible-shared-effect flush/recheck precedent |
| [server/serial_writer.ts](../../../server/serial_writer.ts) | `createKeyedSerialWriter` supplies FIFO, not database atomicity or bounded queue admission |

Character FIFO precedes the existing market writer where applicable.
Character-only paths flush
incompatible shared effects before admission and recheck inside the admitted job.
The caller-owned save helper alone does not prove pre-lock fencing. The manifest
prices every added statement and deferred effect in deadlines and workload counts.

The database, persistence and security reviewers validate this manifest before
implementation decisions and on the finished diff. Disposable-PostgreSQL proof
races housing with autosave, storage start/apply, guild replay, account/character
deletion and lease takeover, including pending legacy side effects and ambiguous
commits; Phase 07a's deliverable 5 and its QA mirror this list. Record aggregate outcome, bounded duration, query count, queue/pool wait,
encoded bytes, timeout/cancellation and replay results, without private rows.
Each growing table/read has a query/index/retention inventory, not a blanket index
rule. Do not add an independent pool or claim guaranteed interactive reserve.

## Effect inventory and guild fund

Every producer appends one row per SKU in this template. `SKU id` is the literal
catalog id the producing phase names in its own file (15's two ids are recorded
in state.md's per-phase ledger row 15 when 15 lands); `kind` is the Claudium
spend kind literal `freehold` for every housing SKU; `idempotency scope` is the
identity the service keys the operation on; `refund disposition` names the row
of the signed refund schedule; `dark/outage` states the behavior while
`FREEHOLDS_ENABLED` is off or an upkeep suspension is open.

| Producer | SKU id | kind | Idempotency scope | Refund disposition | Dark/outage behavior | Effect contract |
|---|---|---|---|---|---|---|
| 15 Cottage Charter | `freehold_charter_cottage` | `freehold` | account-once | signed schedule row for the Charter | dark: refused and hidden from the store filter; outage: purchase unavailable, no guessed price | Once-per-account entitlement grant with durable receipt recovery; an already granted entitlement cannot be purchased again as a repeatable action. |
| 15 Master Builder's Call | `freehold_master_builders_call` | `freehold` | account plus plot, repeatable | signed schedule row for the Call | dark: refused; outage: unavailable, and a wholly suspended week consumes no credit | A confirmed result restores condition to the state.md maximum and satisfies the current unpaid weekly bill. Future prepay credits are preserved and none are added. An already-paid current bill has an explicit repair-only quote/effect. |
| 21 Lodge upgrade | `freehold_upgrade_lodge` | `freehold` | account plus plot, once per tier step | signed schedule row for tier fees | dark: refused; outage: unavailable | Fixed tier/input/custody preview and exact material deduction accompany the quoted effect. Upgrade contributions take an explicit source-mode argument per D37 (bags, or the vault inside the owner's own claim under D18/D47); the bill counts item units per D33; refuse before new spend if overflow cannot fit in authorized safe custody, and a confirmed fee whose last leg cannot finish because bags are full re-attempts without a second fee (D89). |
| 32 Great Hall, Bastion and Manor | three price-free rows named by 32 | `freehold` | account or guild plus plot, once per tier step | signed schedule rows | dark: refused; outage: unavailable | Same upgrade contract as 21, with the guild owner kind's officer authorization. |
| 29 Meeting Hall Charter | `guildhall_charter_meeting_hall` | `freehold` | guild-once, officer-plus | signed schedule row | dark: refused; outage: unavailable | Service owns pooled currency debit/credit authority; game owns atomic material/gold effects and membership/permission validation. Officers authorize paid projects. |
| 29 Hall Fund donation | `hall_fund_donation_claudium` | `freehold` | guild plus donor account plus realm week, repeatable under the allowance | pro rata by original receipt (see the end-of-life row) | dark: refused; outage: unavailable | Currency contributions and refunds use the external intent/receipt protocol and the service's absolute result. |
| 37, 38 optional deed operations | the service-published deed operation ids (mint, list, cancel, settle) the deed contract names | `freehold` | plot plus asset per operation ID | signed deed refund schedule | NEW spend refused while NEW `FREEHOLD_DEEDS_ENABLED` or the NEW `allowSerializedCollectibles` flag is off or the service is unavailable; accepted original operations recover | Apply the separate deed contract, immutable furnished-sale manifest, authority schedule and territory gate; buyer capacity per D80. |
| 40 Keep, Fortress and Citadel | four tier/SKU rows named by 40 | `freehold` | account or guild plus plot, once per tier step | signed schedule rows | dark: refused; outage: unavailable | Same upgrade contract as 21, with the D63 prestige gate. |
| 42 second freehold | `freehold_charter_second` | `freehold` | account-once at `plot_index` 1; refuses without a primary and at the two-plot cap with `freehold.second_plot_cap` | signed schedule row | refused while `FREEHOLDS_ENABLED` is off or the service is unavailable; accepted original operations recover | Grants a Cottage-tier record at the new admitted plot index (D93); the second plot upgrades through the same 21/32/40 build projects as the primary, with every integer material line at ceil(1.5x) of the approved primary line per D67, and there is no second-home upgrade refusal (D93). Existing stable opaque plot identities remain stable. Each bill/prepay/condition record is plot-specific. |

Guild responses contain an absolute balance with `serviceBalanceRevision`, never
a locally computed delta standing in for the service ledger. Older responses do
not overwrite newer mirrors. Material/gold state has its own revision. Each
contribution binds guild, contributing account across alts, realm week, accepted
allowance-schedule version and operation identity. Materials/gold deduction, donor
cap accounting and audit insertion commit atomically. Currency contributions and
refunds use the external intent/receipt protocol and the service's absolute result.

The adopted anti-dominance target is the ruling sheet's one current weekly Hall
Ledger equivalent per account and realm week, not a GW2 rule. No game-side token
conversion computes it. Phase 29's accepted calibration artifact publishes exact
material/gold and service-currency allowance rows, aggregation, rounding and
refund treatment; no currency contribution activates without those rows. Member
views show the permitted contribution audit, while membership checks remain live.

| Hall Fund end-of-life (D78) | Required behavior |
|---|---|
| Disband with a nonzero pooled service balance | On disband (28a's tombstone disposition, D79) the pooled service balance is refunded pro rata to donor accounts by original receipt as separately identified immutable refund operations linked to those receipts; the game only requests the operation and mirrors the settled absolute balance. |
| Fund materials and gold at disband | 29 adds an officer-plus withdraw-to-guild-bank verb for fund materials and gold on the 07a rail, used before the refund request; that verb is the materialization the disband guard requires. |
| Disband-permitted state (28a's explicit safe disposition) | Fund materials and gold at zero and the service balance settled or refund-requested; only then does the tombstone disposition (D79) proceed. |

### Guild lifecycle authority and membership transitions

[28a guild lifecycle and membership](../../freeholds/phase-28a-guild-lifecycle-and-membership.md)
and its paired QA extend the 07b module family after 28's guild/fund setup.
This is the approved R10 eligible-member presence rule, distinct from R28 donation
allowances. Every ordinary current member rank qualifies without tenure, rank,
donation or activity thresholds. A current member's admitted gameplay presence
protects the guild even while its hall is unloaded. Member personal grace is
never copied or summed into guild protection.

NEW `guild_freehold_lifecycle` and `guild_freehold_lifecycle_history` use separate
guild-keyed static SQL under NEW `server/freehold_lifecycle_db.ts`. Extend its
load/page/advance APIs, the pure planner/coordinator and the committed projection
installer with typed account/guild scope. Guild identity never occupies an
account-keyed row. Guild history stores immutable protection transitions with
indexed generation/time pages, stable lifecycle/calendar/reset-policy binding
and exact checkpoints/finality; latest-only activity is insufficient. NEW
`server/freehold_lifecycle_binding.ts` resolves durable guild binding, not the
observer account's binding or current serving realm.

Existing [server/social_db.ts](../../../server/social_db.ts) members
`PgSocialDb.guildMembership` (returning `rosterPages` on origin/release/v0.42.0),
`addGuildMemberAtomic` (its limit parameter removed there; the cap is read from the
FOR UPDATE guild row up to `GUILD_ROSTER_MAX_MEMBERS`, 1,000 seats, in
`src/sim/guild_roster.ts`), `transferGuildLeader` and `removeGuildMember`, plus
[server/social.ts](../../../server/social.ts) `SocialTransport.onGuildMembershipChanged`
and `buyRosterPage`, and the release's `server/guild_roster_page_db.ts` roster page
purchase (account KEY SHARE, guilds row UPDATE, `guild_roster_receipts` insert,
character save, all inside `beginCharacterSaveTx` behind
`acquirePaidGuildCreateClient`; `guild_roster_receipts` cascades with guilds and
characters), are distinct membership seams re-verified against the newest
origin/release/** at every guild phase start (the packet base predates them).
The display roster/cache and current stamps do not prove past membership.
28a adds the narrowly scoped membership incarnation and transition fencing.
Typed gameplay observations carry authenticated character/account identity,
guild and source binding, process/session/lease generation, immutable pre-queue
observation time and server-controlled incarnation evidence. Leave/kick/rejoin/
transfer/disband closes the old binding and settles its captured final eligible
observation before publishing the membership change. Offline joins add no
presence; online joins record actual presence under the new binding. Rank changes
do not restart grace, and joining another guild copies no prior grace. An obsolete
queued incarnation cannot count as new membership. Unresolved historical evidence
is retained while affected evaluation remains unavailable.

Only periodic timestamps coalesce to one running and one pending generation per
dirty guild; admission and return transitions retain their boundaries. Bounded
character-key observation batches replace full roster scans, character hydration,
per-member writes and account-history fan-out. Use shared admission/deadlines and
07a's measured actual lock touch sets, preserving the different legacy membership
orders. No new pool, polling listener or tick SQL. Guild-history protection never
requires account-head locks solely to derive presence. Hall/credit/operation/
protection dependencies prevent destructive guild-head deletion; observer deletion
cannot cascade guild history, and disband explicitly materializes or retains
unresolved dependencies. A guild that holds any keep-forever housing row
(`guild_deeds`, first clears) is never hard-deleted: disband is the 28a tombstone
disposition (D79), retaining the guild row with a tombstone status, removing
member rows, releasing the realm name through a tombstone-aware uniqueness rule
and keeping `guild_deeds` rows attached; the guard extends the existing
`beginGuildBankDelete` guard at both guild-deleting call sites (`guildDisband`, and
`guildLeave` last-member-out) before any member row is deleted, and GM character or account deletion routes through the same guard
(leadership passes to the highest-ranked remaining member or, with none, the
tombstone disposition applies with fund disposition per D78). Lossless compaction
must prove all dependent replay safe.

Files 29/13a consume committed guild history and exactly union service outages
before upkeep effects. Current-generation installation cannot regress a guild
revision. Member-facing `ghall` reveals only authorized derived condition/protection,
never observation identities or lifetime history. The future lifecycle database
contract must show disposable PostgreSQL evidence for simultaneous returns/alts,
unloaded halls, delayed observation versus membership/lease changes, atomic
membership publication, overlapping protection, stale install, deletion/disband,
index plans, bounded queue/client/query counts, deadlines and growth. Written
service/game acceptance is still required before enabling dependent paid effects;
this packet supplies no executed database or deployment proof.

## Calendar authority and outage handling

The adopted 13/13a producers assign the following NEW ownership following
static database review. These are planned names, not current exports or deployed
routes:

| Proposed owner | Exact responsibility |
|---|---|
| NEW `src/sim/freehold/state.ts` | `FreeholdUpkeepSuspension`, `FreeholdUpkeepCalendarState` and `FreeholdUpkeepCheckpoint` type the injected interval/calendar state and bounded persisted source checkpoint |
| NEW `server/freehold_db.ts`, producer 13a | Extend its earlier planned `FREEHOLD_SCHEMA`; `applyFreeholdUpkeepCalendar`, `loadFreeholdUpkeepCalendar`, server-only `FreeholdUpkeepAuthoritySuspension` and `FreeholdUpkeepDbBudget` own shared history per stable calendar, exact coverage summaries and bounded plot/credit projections; never append a lifetime outage array to every plot |
| NEW `server/freehold_upkeep_ingress.ts`, producer 13a | `createFreeholdUpkeepIngress`, `configureFreeholdUpkeepIngressRuntime`, `handleFreeholdUpkeepIngress`, `routes` and `FreeholdUpkeepIngressBudget` own authenticated authority intake at planned `POST /internal/freeholds/upkeep-calendar`, with one shared handler for both dispatcher arms |
| NEW `src/sim/freehold/condition_core.ts` and `src/sim/freehold/ledger_core.ts` | Consume the deterministic scoped calendar/interval projection, with no network or wall clock |
| Existing [server/sim_calendar_feed.ts](../../../server/sim_calendar_feed.ts), producer 13a | Exported `SimCalendarSink` and `feedRealmCalendar` are the online host-calendar extension seam |
| Existing [src/game/utc_day.ts](../../../src/game/utc_day.ts), producer 13a | Exported `feedSimCalendar` is the offline host-calendar extension seam; headless receives an explicit deterministic injected fixture rather than an assumed existing feed |

The planned ingress uses existing
[server/http/middleware/require_internal_secret.ts](../../../server/http/middleware/require_internal_secret.ts)
export `requireInternalSecretFailClosed` with
dedicated NEW `FREEHOLD_UPKEEP_SECRET_HEADER` value
`x-woc-freehold-upkeep-secret` and NEW `FREEHOLD_UPKEEP_SECRET_ENV` value
`FREEHOLD_UPKEEP_SERVICE_SECRET`. Absent or wrong secret refuses before body
parsing. These are names, not secret values, and do not attest checkout channel
or geography. NEW 13a owns storage/projection and authority-ingress database
acceptance; it shares the existing admission/deadline/lifecycle seams. Phase 07a
retains all operation and receipt ownership; the outage ingress creates no
parallel paid-operation store.

The producer is
[13a authoritative upkeep calendar](../../freeholds/phase-13a-authoritative-upkeep-calendar.md)
with [paired QA](../../freeholds/phase-13a-qa.md). It produces NEW
`docs/freeholds/upkeep-calendar-db-contract.md`
with exact measured request/SQL/index/cardinality/growth/deadline and deployment
proof. No numerical request or database limit is selected by this draft.

Server-only `FreeholdUpkeepAuthoritySuspension` in NEW `server/freehold_db.ts`
retains `suspensionId`, `authorityVersion`, `calendarId`, `scope`, `reasonCode`,
`startMs`, nullable `endMs`, `revisionId` and `operatorEvidenceRef`. The sim's
distinct NEW `FreeholdUpkeepSuspension` allowlists only `calendarId`, `startMs`,
`endMs` and safe public-enum `reasonCode`. The server authority record must not
be imported into sim or serialized onto the wire. NEW
`server/freehold_wire.ts` builds owner and visitor projections explicitly from
their separate 08a/13 allowlists, never by serializing a whole DB/sim object.
Owner-private is player-visible: both actual encoders must exclude distinctive
operator-evidence, secret and diagnostic sentinels even if an unexpected property
appears on the source object.

`calendarId` is a stable service-issued identity. `schemaVersion` and
`resetPolicyId` define calendar meaning separately from update
`authorityVersion`. The service's accepted identity binds the configured realm
reset policy, whose existing boundaries are owned by
[server/raid_reset.ts](../../../server/raid_reset.ts) exports `resetDayKey`,
`eventLeadDayKey`, `dailyResetRemainingSec` and `nextWeeklyRaidResetMs`, with
[server/realm.ts](../../../server/realm.ts) export `REALM_RESET_TIME_ZONE`.
Do not substitute an invented UTC week: every has-the-day-rolled-over fact
(ledger, upkeep, prepay, condition, guest-book daily admission, Showcase realm
week, the per-account weekly cap) uses the realm day `resetDay` and the Tuesday
week anchor, epoch-ms fields are display-only, and only the Endeavor month uses
the UTC calendar month (D84). Plot checkpoints and every immutable
credit retain their ORIGINAL source calendar/schema/reset-policy identity across
claims, sale, reconnect and process/realm changes. A new identity or reset policy
requires an explicit accepted migration contract, never implicit reinterpretation.
Realm-day/billing evaluation uses that source reset policy; fixed elapsed-day
division across DST cannot replace it. A truly pre-upkeep unbound row stays
`unbound_no_history` with upkeep disabled until accepted prospective binding
commits. Ambiguous populated or unsupported future shapes preserve the original
read-only state and bounded diagnostic/reference rather than inferring a calendar
from the serving realm or browser timezone.

The sim-facing `FreeholdUpkeepCalendarState` carries bounded relevant
`upkeepSuspensions`, exact cumulative suspended-day and wholly-suspended-period
prefix facts, `coverageStartMs`, `coveredThroughMs` and `finalizedThroughMs`.
Missing historical or future coverage is pending, never an empty/no-outage
calendar. A host cannot advance an authority watermark from silence or wall time.
Persist bounded `FreeholdUpkeepCheckpoint` source/finality/prefix facts and the
original identity on credits, not lifetime interval arrays per plot.

Every historical dependency of a durable condition/checkpoint, bill
classification, credit consumption or credit carry requires irrevocably
finalized facts. Enforce
`coverageStartMs <= finalizedThroughMs <= coveredThroughMs`, with nonregressing
installed coverage/finality. A covered but mutable tail can support provisional
read-only presentation only; hold the affected durable effect pending until its
exact historical dependencies are final, then recheck under the transaction's
calendar/lifecycle guards. Purchasing future prepaid credits under an accepted
schedule does NOT require future time to be finalized. Subsequent evaluation
and consumption of elapsed coverage require finality. Test a tail correction
between load and commit without inventing new outage arithmetic.

Keep ONE shared indexed source history and exact normalized summaries per stable
`calendarId`. Atomically update the head revision, history and summaries. A delta
binds predecessor/new revision and canonical payload fingerprint; conflicting
duplicate, missing predecessor or unsupported schema/policy refuses publication.
Indexed predecessor/endpoint probes and credit-rank selection resolve long-absent
plots and capped credits without all-history loads or day/week loops. Finalized
prefixes are immutable with a bounded open tail; a conflicting historical
correction requires a separately reviewed bounded repair workflow. Keep shared
history indefinitely with growth metrics until a lossless dependency-watermark
rebase proves dormant plots, immutable credits, original-operation recovery and
every explicitly supported capable-release reader safe. No TTL, newest-N clipping or calendar identity
deletion/reuse is authorized.

The calendar-only writer takes its head `FOR UPDATE` and never locks account,
character, plot or receipt rows. Housing material/paid-effect mutations take the
source head `FOR SHARE` at 07a's reviewed composition hook, validate revision and
coverage/finality, and retain it through commit. The shared-reader/isolated-writer design
has static database review; actual touch-set, PostgreSQL concurrency and bounded
query/timeout proof remain 13a/07a acceptance requirements. Snapshot loaders
release shared reads before joining another writer queue. Recovery/maintenance
must not invert calendar-to-plot order or delete/reuse a referenced identity;
multiple calendars sort only within the reviewed new-participant suffix. It is not a new
generic lock hierarchy or a claim that runtime tests passed.

After secret authentication, the NEW ingress acquires an immediate measured
rate/concurrency permit BEFORE body read, parse or digest, or refuses with no
waiter queue. Fixed configured producer identity bounds admission keys. NEW
`FreeholdUpkeepIngressBudget` supplies measured `maxInFlightBodies`,
`maxRequestsPerWindow` and `windowMs`; existing
[server/ratelimit.ts](../../../server/ratelimit.ts) exports `rateLimitNow` and
`windowedRateLimitOutcome` supply conventions, without global database rate-limit
work. Hold/release the permit exactly once across response/error/abort; raw
buffers, parsing, hashing and duplicate storms belong in the workload proof.
This is separate from shared database admission.

For each admitted request the NEW ingress uses existing
[server/http/middleware/body.ts](../../../server/http/middleware/body.ts) export
`withBody` and [server/http_util.ts](../../../server/http_util.ts) export
`DEFAULT_JSON_BODY_MAX_BYTES`, plus strict measured record/ID/result bounds.
Shared [server/background_db_gate.ts](../../../server/background_db_gate.ts)
`BackgroundDbGate.tryAcquire` refuses without a pending work queue.
`FreeholdUpkeepDbBudget` names acquisition, lock, statement, idle-transaction and
transaction-wall deadlines, with measured values owned by 13a. Existing
[server/db_transaction_deadline.ts](../../../server/db_transaction_deadline.ts)
exports `createDbTransactionDeadline` and `backendCancelViaPool` supply the
reviewed deadline/cancellation seam; no new pool, polling task or LISTEN connection
is introduced. HTTP/body bounds alone do not bound database work.

The game operator and economy-service deployment owner jointly provide the
private per-generation routing artifact in the NEW 13a database contract and this
service acceptance. It names private/loopback and authenticated encrypted routing,
authenticated recipient identity, generation registration/expiry, key
configuration, bounded retries/ACK/reconciliation and deployment evidence.
Existing [deploy/user-data.sh](../../../deploy/user-data.sh) denies public
`/internal/*`; preserve that entire prefix denial. Never expose all internal
routes to make delivery work or treat a shared secret as proof of private
transport. This audit has not inspected deployed routing; written signatures
are not runtime cryptographic-response proof.

Every live process generation, including idle rolling peers, receives the update.
A guarded atomic install binds actual `processGeneration`, `calendarId`, committed
revision/digest, consistent lifecycle revision and nonregressing coverage/finality.
Obsolete-generation completion, a lower revision, regressing watermarks or a
same-revision different digest cannot replace installed state. For load A(v1),
install B(v2), then resume A, A never replaces B. The private ACK outcomes are:

| Outcome | Exact meaning |
|---|---|
| `current` | A new head or duplicate of the current durable revision/digest installs or verifies that head before ACK, naming `requestedRevision`, `requestedDigest`, `installedRevision`, `installedDigest`, `calendarId` and actual `processGeneration`. |
| `superseded` | A historical duplicate matching immutable retained history can ACK only after a verified newer current head is installed; name both requested and installed revision/digest identities. Never install the old payload or claim it is current. |
| Conflict/refusal | Same revision/different digest, unknown historical identity, predecessor gap, unsupported schema/policy or obsolete generation produces no installation ACK and no replacement. |
| Pending/refusal | Incomplete load/recovery or missing authority facts preserves known committed state without claiming a ready projection. |

Recheck installed identity while constructing the ACK; a concurrent newer install
changes the result to explicit `superseded`. Bounded decoded committed facts,
not the incoming payload, prove revision/digest identity. Bootstrap loads current
durable coverage before readiness; mutation/claim also checks committed calendar
and lifecycle revision and historical finality. Those fences supplement delivery
to idle processes. Missing delivery, historical finality or required coverage
holds affected evaluation/new spend; it never fabricates no outage or invalidates
original-operation recovery of an already accepted payment.

`upkeepSuspensions` is the planned safe interval projection of that shared
persisted history, with only the allowlisted sim fields above, not a per-plot
lifetime array or server evidence record. A missing end means
the interval remains active. Closed intervals use a start-inclusive,
end-exclusive boundary. Merge overlaps deterministically; never double-credit
suspended time. A higher authority version may close an open interval but cannot
silently rewrite previously applied bills or prepaid rate versions.

The economy service/operator opens a suspension for World Market or
economy-service disruption that invalidates the published upkeep assumptions.
The game persists the authority update before applying it. Upkeep arithmetic
consumes injected calendar/suspension data in the deterministic core, never RPC or
wall-clock calls. During a qualifying suspension there is no condition wear or
new debt for the covered time. Resume from the accepted end boundary with no
catch-up wear/debt. Preserve paid bill versions and all prepay credits. A partially
active billing week retains its already fixed flat bill if the player chooses
repair, with no added outage charge and no fractional prorating. Missed weeks
never accumulate back bills. A wholly suspended billing period consumes no
prepaid credit: carry that credit forward without repricing or losing its
original receipt/material attribution. The Steward shows the shifted coverage
truthfully. Phase 13's fixtures pin these boundaries, paid-rate versions and
original-credit attribution through restart and interval revision.

| Timeline | Required result |
|---|---|
| Service unavailable before a quote | Purchase unavailable; no intent authorizes a guessed price. Existing house use continues. |
| Checkout eligibility unknown or opaque authorization invalid | Refuse new spend; do not infer the running distribution from a client header, linked account or UI flag. |
| Payment accepted before authorization expiry or eligibility change | Recover the immutable original outcome and local effect or accepted compensation; no new authorization, operation or debit is required merely for recovery. |
| Service accepts spend, response is lost | Intent stays pending; original-key status lookup discovers the immutable receipt. No second debit. |
| Confirmed spend, game commit fails | Receipt remains discoverable; recover local apply under the original identity or the signed compensation policy. No success toast before commit. |
| Outage begins and realm restarts | Persisted open interval continues pausing covered upkeep through restart; no default-to-running gap. |
| Authority unavailable at a due boundary | Hold the affected upkeep evaluation pending authoritative calendar reconciliation; do not invent covered time or charge catch-up later. |
| Authority closes an interval | Apply the newer version idempotently, resume from its end, preserve fixed paid bills/credits and report the accepted pause. |

## Calibration, refunds and support

The calibration artifact is a versioned, signed data document with exact item IDs,
units and quantities per realm-week bill, mandatory produce, eligibility source,
tier/plot applicability, arithmetic/rounding, measurement cohort/method, source
snapshot, excluded progression inputs, prepay batching, guild allowances and
effective calendar boundaries. Phases 03 and 13 produce schedules; 20 supplies the
measured acceptance report; later content producers append their exact rows.
The service validates the accepted digest before a dependent quote. A target
percentage or an inventory maximum stack is not an approved quantity.

Refunds and reversals are separately identified immutable operations linked to
the original receipt. The service alone authorizes and posts the monetary result.
The game records any accepted entitlement/effect adjustment atomically and only
after safely preserving personal items and trophy provenance. Upkeep/absence
alone never authorizes repossession, deletion or burn. A contested payment freezes
new transactions for the affected operation while support reconciles; it does
not silently erase the home or repeatedly debit to repair uncertainty.

The signed refund schedule names eligibility, applicable consumer/platform rights,
rail-specific reversal handling, settlement/burn reconciliation and the permitted
local effect for each SKU. Until accepted, real spend stays disabled. Support can
find an operation by its opaque reference, inspect permitted redacted state and
request an audited retry/compensation; it cannot alter a terminal receipt or mint
an unrecorded grant. Ownership of that support reconciliation: the operator
tooling is service-owned and operator-authenticated on the economy service; the
game side owns no operator route or admin page in this packet and applies an
accepted monetary outcome only through the 07a/15 original-operation recovery
reader (login, store-open and bounded background recovery, the Recovery row above),
which records the immutable linked outcome as the entitlement/effect adjustment
atomically through 07a. A game-side operator surface would be a
new product ruling, not an implementation choice. Export and account-removal
behavior follow the distinct
lifecycle paths below; neither deactivation nor an old export implementation is
treated as proof of hard deletion or complete housing-data export.

## Account Hearth authority and admitted recovery reads

NEW 07 `server/freehold_hearth_db.ts` owns `FREEHOLD_HEARTH_SCHEMA`,
`loadFreeholdHearth` and `advanceFreeholdHearthOnClient`, backed by NEW
`account_freehold_hearth` with account primary/FK identity, `ready_at_ms` and
monotonic revision/clock semantics. Private plot UI is a committed mirror only.
07a validates and advances the account participant atomically with accepted remote
Hearth entry under the actual reviewed legacy touch-set order. Online epoch time
is observed after acquiring that participant and admitted without regression;
offline/headless use isolated injected host-clock state and the approved duration.
Refusal, already-home no-op and physical-gate entry do not advance the cooldown.
42 shares the same account row across destinations, alts and processes. Sale
neither copies nor clears seller or buyer cooldown. Character deletion preserves
it; account export, deactivation, restoration and separately authorized hard
deletion must explicitly handle it. The accepted workload/rollout artifact proves
bounds, indexed access, FK waits and real PostgreSQL same-account entry races,
including commit-before-ACK. No existing implemented housing cooldown is claimed.

Zero tick/render/viewer SQL remains required. This does not prohibit necessary
store-open, status or original-operation recovery reads. File 15 admits those
bounded reads through the single operation/projection owner with shared admission,
single-flight, cancellation, measured query/index/byte limits and original identity.
Status/reconciliation outside a spend request never needs another debit. No new
per-viewer poller, unconstrained query or parallel operation ledger is permitted.

## Account lifecycle, export and capable rollout

The current account-removal path in
[server/account.ts](../../../server/account.ts) calls `setAccountDeactivated`:
this is soft deactivation, not a hard account-row deletion or foreign-key cascade.
Adopted 07b/07c account integration and the 07a mutation boundary must distinguish
these paths and test each one:

| Path | Proposed housing contract |
|---|---|
| Character deletion | Preserve account housing, arrival-tier marks, account lifecycle, credits and durable operation/replay authority. An open housing operation blocks character or account deletion with the mapped refusal class in `server/character_delete_db.ts` (the storage guard shape); the deletion race is in the real-PG list (D88). |
| Soft account deactivation | Apply the account's access restriction while retaining housing, account history and operation identities under the accepted retention policy. Do not manufacture new absence/grace or delete housing through an assumed cascade. |
| Authorized restoration | Reload the retained account/plot state and reconcile the original operations under existing identities. Do not grant a fresh Charter, first-arrival mark or fresh return grace merely because the account is restored. |
| Separately authorized hard deletion | Explicitly remove the account's personal/public housing projections and account-owned rows according to the accepted lifecycle/retention policy, while preserving minimal lawful dispute and nonidentifying replay authority. No current soft-deactivation endpoint is claimed to implement this workflow. |
| Account export | Extend existing [server/db.ts](../../../server/db.ts) export `exportAccountData` with explicit housing loaders and safe projections; the existing character-state projection does not load new housing tables. |

The required export includes owned plots and custody, private arrival-tier history,
account lifecycle/protection checkpoints, shared-account Hearth readiness/revision,
original calendar/bill/credit attribution,
and permitted operation/recovery facts. That list is the Wave A export; later
producers append their own export/erasure rows in their phases (guest books,
votes, wards, layouts, hall contributions and deed rows in 26, 29, 34, 35, 36, 38
and 41a). It excludes operator evidence, secrets,
checkout authorizations, private service diagnostics and other accounts' data.
Unsupported or oversized stored state is preserved in its original row with a
bounded diagnostic/reference; do not require a second bounded blob to contain an
oversized original. Export/readiness failure does not normalize it to a fresh Inn,
empty outage history or a new grace period.

The 07b account lifecycle owner is NEW `server/freehold_lifecycle_db.ts`,
with `FREEHOLD_LIFECYCLE_SCHEMA`, `loadFreeholdLifecycle` and
`advanceFreeholdLifecycleOnClient` and `loadFreeholdLifecycleProtectionPage`.
NEW `server/freehold_lifecycle.ts` export `createFreeholdLifecycleCoordinator`
captures authenticated gameplay observation time before queues and commits
monotonic account presence/transition facts. NEW
`server/freehold_lifecycle_binding.ts` export `resolveFreeholdLifecycleBinding`
consumes the accepted NEW `docs/freeholds/lifecycle-policy-binding.md` artifact;
13/13a consume that result without selecting a timezone. Every personal plot consumes
the same committed account lifecycle authority; a sale never copies that
authority to another account. At the confirmed transfer boundary, materialize the
seller-owned condition using the applicable irrevocable calendar/protection facts
through that boundary. Preserve the plot's source calendar identity and immutable
prepaid credits. Preserve the seller's lifecycle and arrival history on the
seller account. From the boundary forward, the buyer's own committed lifecycle
applies prospectively; it neither reinterprets earlier condition nor copies or
creates a grace period. Preserve immutable multiple-cycle account protection
history or lossless prefix facts for dormant plots; latest-only grace is
insufficient. Union overlapping account absence/grace and service suspensions
before applying protection, without double-counting independent totals or
force-writing foreign claimed plots. Missing finality/coverage leaves the local effect pending
under the original accepted operation, not a replacement debit.
NEW 07c separately owns normalized account arrival tiers. Preserve unsupported
stored tier identifiers while constraining the writer's accepted vocabulary.
A committed winning entry mark conveys first-tier eligibility, not visual
completion; replay/resume emits no new camera/welcome directive, and a
commit-before-ACK crash may skip the presentation. An ordinary visit gains no
permanent receipt. Character deletion preserves this account history.

No current pre-Freehold release is claimed to maintain new housing semantics.
The activation artifact must name the minimum capable release/build and exact
supported rollout combinations for schema, writes, account presence, exports,
calendar projections, credits and recovery. Untouched normalized tables do not
prove that an old binary maintains their behavior; old whole-character rewrites
also require explicit compatibility proof. Before activation, all participating
hosts must meet the named capability or an explicitly tested compatible rollout.

Rollback first quiesces new housing mutations/spend and affected background work,
preserves pending operation/custody/receipt identities and original stored state,
then follows the accepted capable-recovery or forward-recovery procedure. Do not
run an old binary as though it continued calendar, grace, export or receipt
semantics. A rollback manifest names every surviving writer/reader and who owns
pending recovery; no discard, reinterpretation or silent replay-key pruning is
authorized. These are future release acceptance requirements, not executed proof.

The service states below map to the manifest ids (D92); no `service.*` family
exists. The two rows marked "16, D92" are carried by ux-spec and the manifest
with Phase 16 as owner, which ships their English source in its own change (the
[listing drafts](freehold-store-listing-drafts.md) list the full purchase set).

| Service state | Key (`hudChrome.housing.` prefix) | English source | Surface |
|---|---|---|---|
| Price or catalog unavailable | `charter.unavailable` | This purchase is unavailable right now. | Approved purchase surfaces |
| Quote loading | `charter.quoteLoading` | Loading current price... | Approved purchase surfaces |
| Quote expired | `charter.quoteExpired` | This quote has expired. Review the current quote before confirming. | Approved purchase surfaces |
| Price changed | `charter.priceChanged` | The price has changed. Review the new price before confirming. | Approved purchase surfaces |
| Pending | `charter.pending` | Your purchase is being confirmed. | Initiating permitted surface |
| Reconciling an original operation | `charter.reconciling` | Checking your original purchase. You do not need to buy again. | Matching recovered operation |
| Request reference (16, D92) | `charter.reference` | Request reference: {operationId} | Support-safe result |
| Charter recovered or complete | `charter.received` | Your Cottage is ready. | Matching recovered operation |
| Call recovered or complete | `granted.call` | Your home's condition is restored. | Matching recovered operation |
| Upkeep paused by a recorded outage | `steward.outagePause` | Upkeep is paused while the market service is unavailable. No missed upkeep will be added later. | Steward |
| Support review (16, D92) | `charter.supportReview` | This request needs a support review. Your request reference is saved. | Matching operation |

All player copy uses English catalog keys and formatted values. Technical
settlement text is developer/service documentation, not native or storefront
marketing. No monetary or legal approval is claimed by this draft.

## Final implementation and legal-team handoff

The final [Codex artwork pass](../../freeholds/phase-44a-final-codex-artwork.md)
inventories and replaces every feature-created placeholder icon/image with final
Codex artwork, verifies it in the completed experience and records source, rights
and provenance. Every asset-generating implementation file, including GLB work,
must execute in Codex, not Claude, using the repository's existing asset workflows.
This documentation session generates no assets.

The subsequent [final legal-team handoff](../../freeholds/phase-44b-final-legal-handoff.md)
revisits this document against the COMPLETED implementation and final artwork.
It produces NEW `docs/prd/woc/freehold-final-legal-handoff.md`; that future
artifact is not yet a file, signature or delivery receipt.
Fernando owns delivery of the concrete review bundle to the legal team; counsel
owns its legal determination. The bundle contains the complete governing Terms
and housing redline, this memo/contract family, exact storefront and territory/
authority schedules, published settlement/refund facts, completed build/service
identities, reachable-flow evidence, data/retention/export handling and final
asset rights/provenance. It records every factual change since earlier acceptance,
a dated file/digest inventory, named reviewers, submission/receipt evidence and
the resulting written decisions or tracked external sign-off gates. No signature,
legal opinion or external delivery is represented as completed by this draft.

This closing revisit supplements every earlier money, platform and production
release gate. It never postpones required acceptance until after an earlier paid
launch or storefront submission. A changed completed flow or asset renews the
affected acceptance requirement before its release.
