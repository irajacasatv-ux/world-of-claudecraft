# Freehold territory and authority schedule draft

Status: adopted packet requirements, approved 2026-09-06; external sign-off remains a release gate. This is the
acceptance schema and fail-closed policy, not a list of approved jurisdictions or
an assertion of legal authority. The adopted initial supported-country list and
irreversible-action list are empty; neither is a deployed source export or an
externally accepted jurisdiction/authority schedule. No country, including
South Korea, is inferred to be approved or to be the only excluded territory.

In-client player text referenced by this schedule uses only the
`hudChrome.housing.*` ids pinned by [ux-spec.md](../../freeholds/ux-spec.md) and
[ux-key-manifest.json](../../freeholds/ux-key-manifest.json) (D92) in the NEW
`housing` subtree of existing `hudChromeStrings` in
[src/ui/i18n.catalog/hud_chrome.ts](../../../src/ui/i18n.catalog/hud_chrome.ts);
the eligibility copy at the end of this file is proposed English whose keys
Phase 37 names in its own file.

Fernando owns release activation and appointment of accountable operators.
Retained product/platform counsel owns jurisdiction, platform and authority
determinations. The economy-service maintainer owns technical enforcement and
payment/service eligibility facts. The game-server maintainer owns entitlement,
identity and custody facts. The designated security/operator owner owns protected
signing access, audit review and revocation response. These exact roles must be
bound to named signers in the acceptance certificate before enablement.

Phase 14 produces client distribution-capability enforcement; 15/20 validate the
NEW service checkout issuer/verifier and initial purchase eligibility. Phase 37
produces the signed later deed schedule and test fixtures; 38 validates client
and transactional enforcement; 39 verifies
the complete release evidence. No implementing session chooses countries or
irreversible triggers from memory, a platform rumor or a plugin capability.

## Versioned supported-territory artifact

Signed acceptance means a written approval artifact. It does not specify or prove
a runtime cryptographic signature scheme. Any such mechanism needs an explicit
wire/key-distribution/verifier/rotation contract and tests. The service must still
authenticate its accepted policy and bounded responses; the game validates the
complete original operation/fingerprint/effect without learning channel or
geography proof. Malformed or nonterminal responses never authorize an effect or
establish no debit.

The signed service artifact contains `policyId`, monotonic `policyVersion`,
effective/expiry boundaries, product/service versions, accepted counsel-memo
digest, accepted Terms digest, recorded written-approval identity, revocation
status, and explicit approved rows. Each approved row supplies:

| Field | Required interpretation |
|---|---|
| Territory | Exact accepted country/region identifier and any narrower eligibility constraints |
| Distribution and checkout scope | Product distribution row and exact accepted checkout channel/session; no implicit wildcard or claim to attest the physical running application |
| Operations | Exact allowed service kinds/SKUs, such as purchase, mint, list, cancel, settle or support action; no inferred sibling permission |
| Eligibility facts | Accepted source, freshness requirement and conflict-resolution policy for account, location, age and applicable service restrictions |
| Legal/platform basis | Dated primary policy/agreement evidence, counsel determination and applicability to the complete connected flow |
| Effective scope | Start/end, release/service version, revocation and required revalidation event |

Each `supportedTerritories` row is a machine record with exactly these field
names and types. Phase 37's fixture JSON schema and the external policy module's
signed artifact MUST both validate against this table (Phase 37 produces the
signed later deed schedule and test fixtures, exercised through real composition
and disposable PostgreSQL in its deliverable 5 and STEP 3 validation); a field this
table does not name
requires a schedule revision, never an ad hoc key.

| Field | Type and standard |
|---|---|
| `territory` | ISO 3166-1 alpha-2 country code, uppercase string, required |
| `subdivision` | ISO 3166-2 subdivision code string for a narrower eligibility constraint, optional (absent means the whole country row) |
| `distribution` | enum: one of the seven distribution rows the Phase 14 map defines (browser web, website-distributed desktop, Apple App Store, Google Play, Steam, Epic Games Store, Solana dApp Store / Seeker), using the literal ids 14's `distribution_surfaces.ts` exports |
| `checkoutScope` | string id of the accepted checkout channel/session class; exact match, no wildcard, no physical-application claim |
| `operations` | array of enum {`purchase`, `mint`, `list`, `cancel`, `settle`, `support`}; no inferred sibling permission |
| `sku` | array of accepted catalog SKU id strings; an empty array permits no priced operation |
| `eligibilitySource` | string id of the accepted eligibility fact source for account, location, age and service restrictions |
| `freshnessMaxAgeMs` | integer milliseconds; an older eligibility fact refuses new spend |
| `conflictPolicy` | enum {`refuse`, `strictestWins`} for conflicting eligibility facts |
| `evidenceDigest` | lowercase hex SHA-256 of the dated legal/platform evidence file |
| `determinationRef` | string id of the counsel determination record for this row |
| `effectiveFromMs` | integer epoch milliseconds UTC |
| `expiresAtMs` | integer epoch milliseconds UTC, or null for open-ended until revocation |
| `minServiceVersion` | string, the service version this row applies from |
| `minReleaseVersion` | string, the game release this row applies from |
| `revalidationEvent` | enum {`policyChange`, `releaseChange`, `expiry`, `revocation`} |
| `policyVersion` | integer, the artifact-level monotonic version repeated on the row |

Proposed initial policy value: `supportedTerritories = []`. The NEW external
economy-service policy module owns the signed accepted rows and the initial
deny-default behavior; nothing here claims deployed enforcement. Its exact
repository/module or immutable signed policy-artifact identity is required in
acceptance. The game consumers NEW `server/freehold_purchases.ts` and NEW
`server/freehold_deed_proxy.ts` consume only verified typed allow/refusal/effect
through the opaque authorization boundary; they do not own channel/geography
proof or a second local territory-policy authority. Protected operation bindings
remain in NEW `server/freehold_operation_db.ts`. No implementing session fills
an unaccepted row by guessing a country.
A missing row, unaccepted/unauthenticated policy, stale/expired policy, unsupported operation,
unknown or conflicting geography, denied account, unavailable trusted eligibility
source or unaccepted policy version refuses the new operation.

The economy service validates territory and checkout-session eligibility using
the exact accepted proof sources in its signed schedule. Client-selected country,
locale, timezone, URL parameters, UI capability, Origin, user agent and untrusted
proxy headers cannot authorize a territory or prove a physical distribution.
Linked store accounts also do not attest the running application. The
[current payment source evidence](freehold-service-contract.md#current-payment-source-evidence)
records the exact existing account/spend/bridge owners and outgoing credential,
without claiming an inspected remote verifier. Existing
account/scope authentication and the server-to-service secret establish neither
an eligible checkout channel nor a trusted physical-client distribution.

The NEW economy-service issuer/verifier is required to authorize an actual
eligible checkout channel/session. It supplies an opaque authorization bound to
account, purpose/kind, SKU, policy, quote, operation and target/effect fingerprint.
The game host receives this opaque reference and the validated effect/refusal;
it does not receive a distribution/channel label, preserving D9 literally. The
service's internal channel and territory proof does not cross that boundary. The
signed artifact must name the actual issuer/verifier, accepted checkout proof,
protected handoff, expiry/revocation and binding/replay conformance. Those are NEW
required capabilities, not claims about current payment authentication.

The accepted service implementation verifies trusted upstream/proxy provenance
where the signed territory evidence requires it, without treating a geography
signal as distribution attestation. An unavailable or ambiguous required fact
fails closed for new spend. Do not persist precise location when a coarser
approved fact suffices; retention/export follow the accepted written data schedule.
The [account lifecycle and rollout contract](freehold-service-contract.md#account-lifecycle-export-and-capable-rollout)
distinguishes current soft deactivation from restoration and separately authorized
hard deletion, with safe explicit housing export and retained replay authority.
This policy module does not reinterpret deactivation as a cascade or expose
operator evidence, authorizations or raw geography in player exports.

The service rechecks eligibility at prepare, quote/confirmation and any new-spend
settlement. A policy change refuses new prohibited mutations; existing confirmed
receipts enter the accepted recovery/refund process under their recorded version,
without a new checkout authorization or debit merely because authorization expired
or eligibility changed. It never turns an unknown outcome into permission to
submit another payment. Policy changes
do not silently delete a home or personal belongings. Per-request current
authorization is separate from cached cosmetic/public projections.

## Authority schedule

| Proposed capability | Product boundary | Required accepted evidence | Current disposition |
|---|---|---|---|
| Per-asset listing freeze/thaw | Protect only the target deed transfer during a recorded listing/transfer/cancel/recovery; ordinary game access remains independent | Correct asset-level creation-time delegate, operation/case identity, custody manifest, least-privilege signer, traceable outcome and thaw recovery | Proposed; cannot activate before signed service/authority acceptance |
| Support reconciliation | Discover immutable receipts and safely complete or compensate their recorded game effects. Ownership: the operator tooling (operation lookup by opaque reference, redacted state inspection, audited retry/compensation requests) is service-owned and operator-authenticated on the economy service; the game side owns no operator route or admin page in this packet and applies an accepted outcome only through the 07a/15 original-operation recovery reader | Original operation identity, service and game evidence, authenticated service operator role, accepted refund/custody policy | Proposed; production authority unaccepted |
| Transfer restriction for moderation/legal instruction | Restrict only the specifically authorized operation/asset according to the accepted case; no timer-based loss | Signed trigger row, legal/moderation case, authorized approver, scope/duration/review and appeal/support handling | No accepted trigger rows; disabled |
| Irreversible burn | Never an automatic response to absence, low condition or an unpaid Ledger | Explicit signed trigger row, counsel/Fernando approval, separate burn capability at mint if required, verified case/confirmation, custody and game-entitlement disposition | Proposed initial external-policy value `approvedIrreversibleActions = []`; unimplemented and unaccepted |
| Entitlement transfer | Only the approved confirmed furnished-sale manifest changes the game owner atomically | Service settlement/transfer receipt, both parties' eligibility/authorization, stable plot fence, exact copy/custody and durable application receipt | Proposed; unaccepted until 37/38 proof |

The same NEW external service policy module owns `approvedIrreversibleActions`,
including the adopted initial empty list and accepted signed action rows; no
game source export or deployed allow/deny behavior is claimed. Each accepted
action row names its authorized operator role, signing authority
identifier, authentication/approval controls, allowed reason enum, evidence
requirements, target scope, immutable audit form, review/revocation procedure and
entitlement/custody effects. Each `approvedIrreversibleActions` row is a machine
record with exactly these field names and types; 37's fixture JSON schema and the
external module's signed artifact MUST both validate against it:

| Field | Type and standard |
|---|---|
| `actionId` | string id, unique within the artifact |
| `action` | enum {`freeze`, `thaw`, `transferRestrict`, `burn`} |
| `targetScope` | enum {`asset`, `listing`}; collection-wide scope is not a permitted value |
| `operatorRole` | string id of the authorized operator role |
| `signingAuthority` | string identifier of the signing authority (an identifier, never key material) |
| `approvalControls` | array of enum {`counselCase`, `fernandoApproval`, `twoPersonApproval`} |
| `reasons` | array of enum {`legalInstruction`, `moderationCase`, `supportCompensation`, `ownerRequest`} |
| `evidence` | array of enum {`caseId`, `confirmationDigest`, `custodyManifestDigest`, `operationId`} required before execution |
| `entitlementEffect` | enum {`none`, `hold`, `restore`} |
| `custodyEffect` | enum {`none`, `hold`, `restore`} |
| `auditForm` | string id of the immutable audit record schema |
| `reviewProcedure` | string id of the review/appeal procedure |
| `revocationProcedure` | string id of the revocation procedure |
| `effectiveFromMs` | integer epoch milliseconds UTC |
| `expiresAtMs` | integer epoch milliseconds UTC, or null |
| `policyVersion` | integer, the artifact-level monotonic version repeated on the row |

Private signing material never enters the repository,
game client or audit export. An SDK's ability to freeze or burn supplies none of
these permissions. A frozen/burned external asset is not an instruction for a
native client to lock access or erase housing state.

## Current primary-policy evidence to validate at acceptance

Primary retrieval date for the packet audit: 2026-09-05; the Solana Mobile
publisher policy was re-retrieved on 2026-09-06 at its current host.

| Surface/authority | Primary source | Acceptance obligation |
|---|---|---|
| Apple | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Obtain the specific entitlement-model determination, explicitly including 3.1.3(b), through the counsel memo before housing enablement/submission. |
| Google Play | [Blockchain-based Content](https://support.google.com/googleplay/android-developer/answer/13607354) | Accept actual build/declaration and connected-flow treatment. |
| Steam | [Steamworks Onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding) | Accept the isolated build and cross-platform entitlement model. |
| Epic | [Content Guidelines](https://cdn2.unrealengine.com/epic-games-store-content-guidelines-f8accc43356e.pdf) and [Blockchain Technology Guidelines](https://dev.epicgames.com/docs/epic-games-store/requirements-guidelines/distribution-requirements/blockchain) | Exact blockchain page was unavailable in the audit. Counsel must obtain/archive current text and applicable agreement; no assumed territory list. |
| Seeker | [dApp Store introduction](https://docs.solanamobile.com/dapp-store/intro), [Terms of Use](https://legal.solanamobile.com/en/dapp-store-tos), [Solana Mobile Publisher Policy](https://legal.solanamobile.com/publisher-policy-web) (retrieved 2026-09-06, "Last Updated: Jul 21, 2026") | The publisher policy is part of and subject to the Solana Mobile dApp Store Developer Agreement and carries no purchase, NFT or territory rule of its own. Counsel archives the current policy text, the Terms of Use and the Developer Agreement (current signed text) as named acceptance artifacts before accepting the use-only build; housing purchase/deeds remain off. |
| Metaplex authority | [Permanent Freeze Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-freeze-delegate), [Permanent Burn Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-burn-delegate) | Verify selected service/plugin version and asset scope. Legal authorization is the separately signed schedule, never inferred from technical support. |

See [counsel memo](freehold-counsel-memo.md) for the precise observed policy issues,
not an assertion that any platform has approved this product. No legal regime or
technical uniqueness feature is declared a blanket exemption in this schedule.

## Required signed artifact and release test

The accepted artifact supplies named counsel, Fernando, service maintainer and
security/operator signers; identities/signatures; version/digest; dated current
policy evidence; exact supported rows; NEW checkout issuer/verifier and accepted
proof/conformance; authority rows; effective/expiry dates;
published player Terms/disclosures; operational revocation contact; and executable
allow/deny fixtures. All signatures are currently absent and both approved lists
remain empty. These are explicit external release gates, not OPEN design items.

Before enabling an affected feature or submitting a housing-bearing storefront
build, verify the live build/service/policy digests match the accepted artifact.
Tests must cover empty list, unknown country, conflicting/stale evidence, spoofed
client geography, unaccepted/tampered policy, policy rollback, revocation, current holder
change, unsupported SKU, cross-account/purpose/SKU/quote/operation authorization
reuse, unproved checkout session, direct denied-route access, cancel/settle race,
accepted-payment recovery after expiry/eligibility change, and no-time-loss
preservation. The service boundary authorizes only an accepted checkout
channel/session under its policy even when a client falsely presents a permitted
capability. It does not claim to identify an unverifiable physical distribution.
The rollout artifact names the minimum capable release and compatible
writer/reader/service combinations. Rollback quiesces affected new operations
and preserves pending recovery identities; it does not claim that a pre-Freehold
binary continues lifecycle/calendar/export or policy semantics.

Per D92 Phase 37 names these keys in its own file under the existing
`hudChrome.housing.charter.*` family with exactly this English; ux-spec and the
manifest carry them with 37 as owner. The "unavailable" sentence is the same
state the deed contract and listing drafts cite; it is named once.

| Eligibility state | Key (`hudChrome.housing.` prefix, owner 37) | English source | Surface |
|---|---|---|---|
| Service unavailable for account or location | `charter.serviceUnavailable` | This service is unavailable for this account or location. | Approved service surfaces only |
| Eligibility unconfirmed | `charter.eligibilityUnconfirmed` | Eligibility could not be confirmed. Please try again later. | Approved service surfaces only |
| Support pointer | `charter.supportPointer` | Contact support with your saved request reference. | Relevant permitted result |

No player diagnostic exposes raw location evidence, policy internals, signing
authority or private account identifiers. Use the keyed safe result, while the
authorized audit records the exact typed reason and policy version.

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
