# Optional Freehold deed-service contract draft

Status: adopted packet requirements, approved 2026-09-06; external sign-off remains a release gate. This is the
concrete later-wave contract draft, not a deployed API, completed mint or legal
approval. All schemas and operation states below are NEW planned contract names.
The service is browser-web and website-desktop only; native, Steam, Epic and
Seeker clients expose no mint, listing, transfer, holder flair or related purchase
surface. The game's account entitlement remains the authority for housing use.

The surface limit follows existing D21 in
[state.md](../../freeholds/state.md); the service and custody details remain
adopted requirements and remain unimplemented. In-client player text referenced
here uses only the `hudChrome.housing.*` ids pinned by
[ux-spec.md](../../freeholds/ux-spec.md) and
[ux-key-manifest.json](../../freeholds/ux-key-manifest.json) (D92) in the NEW
`housing` subtree of existing `hudChromeStrings` in
[src/ui/i18n.catalog/hud_chrome.ts](../../../src/ui/i18n.catalog/hud_chrome.ts);
the deed copy at the end of this file is proposed English whose keys Phase 38
names in its own file, adding English source only and regenerating generated
bundles rather than editing them by hand.

Phase 37 produces the verified service adapter, SDK/version and authority proof,
territory enforcement, signed service/counsel artifact and conformance tests.
Phase 38 produces the permitted web client and furnished-sale custody flow;
39 verifies its complete acceptance. The economy-service maintainer owns payment,
external asset operation and receipt authority. The game-server maintainer owns
game entitlement/copy custody and recovery. Counsel owns the legal authority and
territory determination. Fernando owns product approval and release enablement.

The three money gates apply to every operation: accepted counsel determination,
published accepted Terms, and the accepted economy-service protocol plus exact
catalog/settlement publication. The
[service contract](freehold-service-contract.md) supplies durable intent,
idempotency, quotes, refunds, replay retention and bounded operational requirements.
The [authority schedule](freehold-territory-authority-schedule.md) has no accepted
territory or irreversible-action rows yet, so production remains disabled.

The [current payment source evidence](freehold-service-contract.md#current-payment-source-evidence)
has no trusted running-distribution fact. Existing D9 under "Locked decisions"
in [state.md](../../freeholds/state.md) keeps the game server unaware of
distribution. The NEW economy-service issuer/verifier authorizes an
actual eligible checkout channel/session and supplies an opaque account/purpose/
SKU/policy/quote/operation-bound authorization. The game host sees the opaque
authorization and validated effect/refusal, not a channel label. Account auth,
calling-server secrets, UI capabilities, Origin, user agent, client JSON and
linked store accounts cannot establish the physical application. The actual
issuer/verifier and accepted checkout proof require the signed service artifact
and conformance evidence before any new paid deed operation. Unknown eligibility
refuses new spend; accepted outcomes still recover under the original operation.

Exact planned owners are NEW `server/freehold_deed_proxy.ts` for this deed
adapter, NEW `server/freehold_purchases.ts` for the initial purchase/status
consumer, and NEW `server/freehold_operation_db.ts` for shared protected
authorization bindings, fingerprints, intents and receipts. The external
economy service owns its issuer/verifier; signed acceptance names its exact
repository/module or immutable interface-artifact identity. No game adapter
owns channel/geography proof. The service's source-evidence block describes the
observed outgoing credential only; no remote verifier is claimed inspected.

## Product and identity contract

One distinct opaque `plotId` identifies a game plot, with at most one current
service-recognized deed asset for that plot. Metadata binds service schema/version,
plot identity and the permitted public presentation without account identifiers
or private names. Collection membership is permitted technical organization, not
proof of legal uniqueness or exemption. No deed operation sells combat power,
production, random paid rewards, rent, financial returns, fractional ownership
or governance rights.

An optional deed state change alone does not grant, revoke or block ordinary game
access. Native clients load the server entitlement and public housing projection
without a chain RPC or a holder proof. Only the authorized game-server transaction
following a confirmed approved transfer changes the account entitlement. After
that transaction the buyer's approved client accesses the home through the same
normal entitlement mechanism. It does not inspect asset ownership to unlock it.

Mint, listing, cancel, transfer and recovery all bind `operationId`, `plotId`,
`kind`, authenticated internal account identity, asset identity if present,
quote/version, opaque checkout-authorization binding, custody-manifest digest,
expected plot/ownership revisions, territory-policy version and authority-policy
version. Reusing a key with different
input refuses. External terminal outcomes and their receipts are immutable;
compensation is a linked new operation, never a rewritten outcome. Unknown
outcomes are retried/discovered under the original key only.

## Immutable furnished-sale manifest

The explicit sale transfers the identified plot shell/tier and the eligible
transferable placed furnishing copies that both parties confirm. It is not a
sale of trophy accomplishments or an implicit transfer of every seller item.
The immutable manifest contains:

| Manifest component | Required exact content |
|---|---|
| Identity and versions | Operation, seller/buyer internal identities, opaque plot, shell/tier, asset, layout revision, entitlement revision, content schema, terms/catalog/authority versions and canonical digest |
| Included contents | Exact persistent copy identities, content IDs, eligible transfer state, permitted dye/appearance, placement transforms and parent relations for each included furnishing |
| Retained contents | Every excluded, bound, personal or omitted copy with verified authorized custody destination, plus the seller's trophy records/displays that detach without transferring unlock/provenance |
| Preconditions | Current ownership/fence, no conflicting reservation/listing/paid operation, buyer capacity, source-copy uniqueness, payload/row/byte bounds and current territory/account eligibility. Buyer capacity (D80): the purchased plot occupies the buyer's `plot_index` 0 only when that record is at tier 0 (Inn Room); the buyer's retained copies and displays are previewed to a safe destination by the same manifest rule as the seller's; otherwise the operation refuses with the literal code `freehold.deed.buyer_capacity`. After 42, the purchased plot may occupy the buyer's free index under 42's two-plot cap. Seller post-sale rule (D80): the seller receives a fresh tier-0 record at index 0 with account trophy unlocks retained; Ward Favor capacity awards are properties of the stable plot ID and travel with the plot, and the seller's fresh record starts at the base budget. Seller wallet step-up: a fresh server-issued challenge signed by the account's linked wallet (NEW `WocStepUpOperation` value `list_freehold_plot` in 38, beside the existing `create_listing` and `accept_directed_offer` values in `server/woc_market_stepup.ts`), bound to the manifest digest plus every money figure shown; the existing `woc_market.wallet_required` and `woc_market.terms_required` error codes refuse before reservation |
| Transfer boundary | Expected seller/buyer lifecycle revisions, original calendar/checkpoint and credit identities, authoritative transfer instant, and condition materialized through that boundary under irrevocable facts |
| Confirmation | The exact visible included/retained preview, authoritative price/fees, accepted terms, fingerprint and both parties' valid authorization |

Existing trophy unlocks and known source character/day/provenance remain attached
to their qualifying account. Guild trophies and member records do not silently
become a seller's transferable property. Any guild-specific operation requires its
own implemented permission/effect row and signed service acceptance before use.
Fixed built-in shell/amenity objects are described as part of the declared tier,
not falsely counted as transferable inventory copies.

Before listing, the game proves that every retained item can remain in or move to
an existing authorized safe container through the atomic transfer composition.
It then records reservations and custody durably. If that cannot be proven, refuse
listing before a fee or external asset mutation. No silent deletion, invented mail
storage, copy substitution or overflow floor drop is allowed. Listing freezes the
manifest and included-copy mutations. A change to contents requires safe cancel,
release/reconcile of the original listing, a new manifest and fresh confirmation.

At confirmed game application, materialize condition through the transfer boundary
under the old owner's applicable committed protection and irrevocable calendar
facts. Preserve original calendar meaning and every immutable prepaid credit's
bill/rate/material/receipt attribution. Seller lifecycle and arrival-tier history
remain on the seller account. The account Hearth cooldown from NEW 07
`server/freehold_hearth_db.ts` also remains with each account; transfer copies or
clears neither seller nor buyer readiness. The buyer's committed account lifecycle applies
only prospectively after the boundary; transfer neither copies seller grace nor
creates fresh buyer grace. This personal-sale authority remains account-scoped
under NEW `server/freehold_lifecycle_db.ts` from 07b; the later 28a guild branch
uses separate guild-keyed storage. 07a composes the guarded personal authority
into the transfer. Missing required finality/coverage holds the accepted
operation pending or follows its accepted compensation path without another debit.

## Service/game state machine

| Planned state | Meaning and permitted transition |
|---|---|
| `unminted` | Game entitlement exists independently. An accepted mint quote can prepare a discoverable mint intent; no mint cost is inferred from a base-asset benchmark. |
| `mint-prepared` | Intent and expected asset identity are durable before the service acts. Service retries/discovery use the original operation identity. |
| `mint-confirmed` | Service has a final receipt for the exact asset/plot binding and verified required plugin authorities. The game commits only the optional presentation record. |
| `listing-prepared` | Current owner, manifest, custody/reservations, eligibility and quote are validated durably. No buyer access changes. |
| `listed-frozen` | Service confirms per-asset transfer protection and the exact listing identity. Included contents remain immutable. Guests see the last permitted public layout; private confirmation/custody details stay private. |
| `transfer-prepared` | Current seller authority, buyer eligibility and the D80 buyer capacity rule (refusing with `freehold.deed.buyer_capacity`), quote, manifest and both confirmations are revalidated. A durable transfer intent exists before settlement or external transfer. |
| `transfer-confirmed` | Service provides the immutable successful settlement/transfer receipt. The game may now apply the prevalidated exact manifest; it cannot assume a timeout means failure. |
| `game-applied` | `commitFreeholdMutation` atomically records the transfer-boundary condition, preserved calendar/credits, game entitlement, included copies, custody effects and receipt identity under compatible ownership/lifecycle fences. Seller account history remains theirs; buyer lifecycle applies prospectively without copied/new grace. Exactly one account holds the admitted entitlement. Only now is game completion acknowledged. |
| `cancel-pending` | Service verifies no confirmed sale won the race. Cancel uses its original identity; cancel and settle cannot both become terminal success for the same listing. |
| `cancel-confirmed` | Service confirms no transfer/debit remains pending and the correct per-asset state. The game releases reservations and restores the seller's safe state atomically. |
| `recovery-required` | Any ambiguous external/local transition preserves durable intent, receipts and reservations. Bounded reconciliation discovers authority and resumes the original transition or accepted compensation. No asset or belongings disappear because the client disconnected. |

The service verifies current authoritative territory and checkout-session
eligibility at prepare, quote/confirmation, listing and new-spend settlement
boundaries. The game adapter validates the service's opaque authorization/effect
and current local ownership/custody guards without learning a channel label.
Later expiry or eligibility change does not block original-operation recovery of
an accepted payment; recovery uses its immutable receipt and accepted compensation
policy where needed. A cached cosmetic
holder stamp cannot authorize any of these actions. Direct unsupported asset
transfers do not grant game access: hold new deed transactions and enter the
accepted support/reconciliation process; do not silently move the entitlement.
Cosmetic reads are bounded, cached and batched; rendering descriptors must not
perform per-viewer/per-plot SQL or chain verification.

The operation protocol never holds a DB client or lock across service/network IO.
The 07a producer assigns NEW `server/freehold_operation_db.ts` exports
`prepareFreeholdOperation` and `applyFreeholdOperation`, plus NEW
`server/freehold_mutation.ts` export `commitFreeholdMutation`. These preserve the
ordered legacy touch-set, including captured
character bank/storage/market/custody effects. Cross-owner game application uses
the reviewed stable multi-owner order and global plot fencing; it does not invent
a generic receipts-last hierarchy. On ambiguous commit, re-read durable receipt
authority before retry; a finite in-memory key list is not replay protection.
The [producer ownership record](freehold-service-contract.md#identity-and-durable-protocol)
identifies the exact adopted 07a implementation/QA files. Their NEW source APIs
remain unimplemented; the documentation does not claim shipped exports.

## Delegate and no-time-loss authority

For per-plot transfer protection, install the permanent freeze delegate at the
asset level when minting. Collection-wide freezing is not the per-plot control.
The authority remains able to thaw under its accepted policy; an irrevocable
no-authority configuration cannot implement recoverable listing cancellation.
Phase 37 pins the actual service SDK/plugin version and proves this behavior.

Condition, an unpaid Ledger, ordinary absence and an upkeep suspension never
trigger automatic lapse burn, home deletion, furnishing deletion, trophy deletion
or entitlement revocation. Per-asset freeze restricts deed transfer only. It does
not implement a native access lock. Minting does not grant an unbounded moderation
power merely because the SDK supports it.

The permanent burn capability is separate, irreversible authority. No burn
operation or enabled burn delegation ships without a signed schedule naming each
permitted trigger, authorizer, case evidence, confirmation controls and entitlement
/custody handling. The accepted trigger list is currently empty. If a later
accepted design requires that permanent plugin, it must be configured at creation
and verified in mint evidence; it cannot be assumed addable later. Never promise
recovery of the same burned asset. The approved support policy must preserve or
restore the game entitlement separately when its recorded decision requires it.

Primary technical sources, retrieved 2026-09-05:
[Permanent Freeze Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-freeze-delegate)
documents creation-time configuration, transfer persistence and asset versus
collection scope.
[Permanent Burn Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-burn-delegate)
documents separate permanent authority and irreversible burn.
These capabilities do not supply legal permission. Any full mint quote comes from
the service, including selected plugins, transaction costs and storage; no fixed
mint-cost literal is a runtime tariff.

## Support, export, retention and acceptance

Support actions require an authenticated operator role, case ID, reason code,
policy version, evidence digest and recorded authorizer. That operator tooling
(operation lookup by opaque reference, redacted state inspection, audited
retry/compensation requests) is service-owned and authenticated on the economy
service; the game side owns no operator route or admin page in this packet and
applies an accepted outcome only through the 07a/15 original-operation recovery
reader, recording the entitlement/custody adjustment atomically. Recovery is
auditable and operation-correlated. Refund/reversal terms identify monetary outcome,
buyer/seller entitlement, exact copy custody and settlement/burn reconciliation;
no partial rollback is represented as completed. Privacy export returns permitted
account-owned housing/custody/operation history and private account arrival,
lifecycle/checkpoint and credit records through explicit safe housing loaders.
It excludes operator evidence, credentials, checkout authorizations and other
accounts' facts. Existing account removal is soft deactivation, not a hard cascade;
restoration preserves original retained identities and creates no fresh grace.
Separately authorized hard deletion follows the accepted retention/custody
workflow while preserving minimal durable replay authority and lawful dispute
evidence. Character deletion preserves account housing. No arbitrary retention
interval or new deletion mechanism is implied. The
[account lifecycle and rollout contract](freehold-service-contract.md#account-lifecycle-export-and-capable-rollout)
owns these distinctions and the named minimum capable-release/rollback gate.

Signed acceptance here means written approval, not an unspecified runtime
cryptographic signature protocol. Authenticated service responses still require
bounded decoding and complete operation/fingerprint/effect validation. An unknown,
malformed or nonterminal response cannot grant the transfer or prove no debit.

| Required certificate | Signer and evidence | Gating event | Status |
|---|---|---|---|
| Service conformance | Economy-service and game-server maintainers: exact protocol/SDK versions, NEW checkout issuer/verifier and accepted session proof, opaque binding, immutable receipt/status discovery, same-key recovery after eligibility change, quote/cancel/settle and cross-process race evidence | Mint/list/transfer enablement | Unsigned; disabled |
| Custody acceptance | Game-server maintainer and persistence/security/database reviewers: exact manifest fixtures, overflow refusal, seller-retained proof, atomic multi-owner transfer and crash/restart evidence | Listing/transfer enablement | Unaccepted; disabled |
| Territory/authority acceptance | Counsel, economy-service maintainer and Fernando: signed supported-country/action schedule, current policy texts and revocation controls | Any deed operation | No accepted rows |
| Commercial publication | Economy-service maintainer and Fernando: exact quote/fee/settlement/royalty/refund schedule and published Terms digest | Any priced deed operation | Unpublished; disabled |
| Distribution acceptance | Counsel and Fernando: accepted web/website build/copy and denial proof for all other distributions | Production enablement or related listing submission | Unsigned; disabled |
| Capable rollout and recovery | Game-server/service maintainers and Fernando: named minimum capable release, supported mixed-version matrix, quiescent rollback and pending-transfer recovery ownership | Deed enablement | Proposed/unaccepted |

QA covers service-confirmed/local-failed transfer, response loss, restart, lease
takeover, cancellation racing settlement (the composed cases this contract
defines: `cancel-pending` racing `transfer-confirmed`, seller disconnect during
`listing-prepared`, and restart between `transfer-confirmed` and `game-applied`,
each with a real-PG fixture and a literal terminal state), changed holder, stale
quote, unknown geography, forbidden/native routes, insufficient seller custody,
duplicate copies, buyer capacity (buyer at Inn Room, buyer at Cottage, buyer with
two plots after 42, seller post-sale record) and its races, same-key
changed-fingerprint refusal, replay after cache
compaction, transfer-boundary condition/calendar/credit preservation, seller
history retention, prospective buyer lifecycle without copied/new grace,
deactivation/restoration/hard-deletion/export distinctions, no lapse burn and
independent native entitlement use. Each growing
record and authority lookup has bounded admission, query/index and retention
evidence. Required certificates record identities, signatures, versions, digests,
effective dates and revocation state. Unsigned fields are explicit release gates.

Per D92 Phase 38 names these keys in its own file under the
`hudChrome.housing.deed.*` family with exactly this English (together with the
sale rows the [listing drafts](freehold-store-listing-drafts.md) list); ux-spec
and the manifest carry them with 38 as owner. The on-chain deed's player-facing
name is "Optional Freehold Deed" (`deed.title`), never a name containing
"Charter"; the mint action reads "Mint Freehold Deed" and its receipt "Your
Freehold Deed is minted." (the coordinator ruling on DK F2).

| Deed state | Key (`hudChrome.housing.` prefix, owner 38) | English source | Allowed surface |
|---|---|---|---|
| Review sale contents | `deed.saleReview` | Review the home and furnishings included in this sale. | Approved web/website only |
| Custody unavailable | `deed.custodyUnavailable` | Your excluded belongings need safe storage before this sale can proceed. | Approved web/website only |
| Request pending | `deed.requestPending` | This request is being confirmed. Your request reference is saved. | Approved web/website only |
| Support recovery | `deed.supportRecovery` | This request needs a support review. Your home records and belongings are preserved. | Approved web/website only |
| Service unavailable | `charter.serviceUnavailable` (owner 37) | This service is unavailable for this account or location. | Approved web/website only |

These English rows use the existing catalog/formatter pipeline. Service and
authority diagnostics remain separate from player text and contain no raw keys,
private wallet data or unfiltered remote error messages.

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
