# Freehold counsel memo draft

Status: adopted packet requirements, approved 2026-09-06; external sign-off remains a release gate. This document
is the product team's factual instruction and requested acceptance record for
counsel. It is not a legal opinion, platform approval or permission to launch.
There are no signed determinations in this draft.
Signatures here record written acceptance; they do not establish a runtime
cryptographic signature protocol or prove remote service authentication.

This memo carries no player-facing keys. In-client housing copy referenced by
this family uses only the `hudChrome.housing.*` ids pinned by
[ux-spec.md](../../freeholds/ux-spec.md) and
[ux-key-manifest.json](../../freeholds/ux-key-manifest.json) (D92) in the NEW
`housing` subtree of existing `hudChromeStrings` in
[src/ui/i18n.catalog/hud_chrome.ts](../../../src/ui/i18n.catalog/hud_chrome.ts);
Terms clauses and storefront metadata are separate sinks (the
[Terms amendment](freehold-terms-amendment.md) redline and the submission
owner's metadata file), never HUD keys.

Fernando is the accountable release owner. Retained product/platform counsel owns
the legal determination and jurisdiction schedule. The economy-service maintainer
owns settlement evidence; the game-server maintainer owns entitlement/custody
evidence; the storefront submission owner appointed by Fernando owns actual build,
metadata and review correspondence. Phases 14 to 16 produce first-wave evidence;
20 verifies release acceptance. Phases 37 to 39 repeat acceptance for optional deed
services, with the [territory and authority schedule](freehold-territory-authority-schedule.md).

## Proposed instructions to counsel

Please assess the complete implemented product and connected purchase/recovery
flows, not only the presence of a checkout button. Housing uses authenticated
server account entitlements across approved distributions. The free Inn Room,
decoration, personal trophy proof and permitted visiting form the common gameplay
experience. Paid Charters purchase access/capacity and Calls provide upkeep
convenience. Housing introduces no combat power, production multiplier, new farm
beds, random paid rewards, rent, financial return, fractional ownership or
governance rights. Furnishings remain obtainable through ordinary play/trade under
the packet's content rules. These are adopted product requirements to verify against the
release build, not claims about regulatory classification.

Low condition or absence does not remove the home, furnishings, personal trophy
records or ordinary entry/building access. A voluntary approved later sale is a
separate explicit transaction: the buyer receives the identified plot and only
the eligible furnishing copies listed in the immutable confirmation manifest.
The seller's personal/bound goods and trophy unlock/provenance remain theirs in
verified safe custody. Refunds, moderation, deletion and account recovery use
recorded authority; no automatic lapse burn is permitted.

The current account-removal route performs soft deactivation. Counsel must
distinguish that access restriction and authorized restoration from a separately
authorized hard-deletion/retention workflow. Restoration does not create new
housing, arrival or grace history. A voluntary transfer neither copies nor clears
either account's shared Hearth cooldown. The required safe account export explicitly
loads housing, arrival, lifecycle/checkpoint, credit and permitted recovery
records, excluding operator evidence and secrets. The
[account lifecycle and rollout contract](freehold-service-contract.md#account-lifecycle-export-and-capable-rollout)
records the existing source anchors and exact adopted distinctions.

On a voluntary sale, materialize condition under the seller's applicable
irrevocable protection/calendar facts through the transfer boundary, preserve the
original calendar and immutable credits, and retain seller account history.
The buyer's own committed lifecycle applies prospectively without copying or
creating grace. This proposal does not assume older releases implement those
semantics: acceptance must name a minimum capable build, compatible rollout and
quiescent rollback with original-operation recovery.

All real payment pricing, conversion, settlement, fees and burn publication are
service-owned under the [service contract](freehold-service-contract.md). The
packet's illustrative prices and ratios are not offered prices. Assess the actual
rails and final disclosures in the signed service publication. The optional later
deed is offered only on approved browser web and website-distributed desktop.
Native clients consume the game-server entitlement and never require a holder
RPC, possession proof or deed mint to render or use an admitted home.

## Distribution determination matrix

This is the adopted product scope; the distribution certificate remains unsigned.
`Use` requires written acceptance of the complete entitlement model before
enablement. `Manage` is an independent capability for an identified destination
and complete return flow; its neutral label does not establish permission.
Purchase and deed denial includes catalogs, hidden controls, handlers, errors,
accessibility text, external destinations and storefront metadata.

| Distribution | Proposed Use | Charter/Call purchase | Manage | Optional deed surfaces | Required written determination |
|---|---|---|---|---|---|
| Browser web | Yes, gated | Yes, gated | Approved flow only | Later, gated | Consumer/payment/territory model and each connected service |
| Website-distributed desktop | Yes, gated | Yes, gated | Approved flow only | Later, gated | Desktop distribution, payment and connected-service model |
| Apple App Store | Yes, gated | No | Default off | No | Multiplatform access and IAP requirement, NFT unlock restriction, storefront-specific steering, complete metadata |
| Google Play | Yes, gated | No | Default off | No | Billing/declaration applicability and connected-service disclosures |
| Steam | Yes, gated | No | Default off | No | Proposed account-access build and excluded service surfaces |
| Epic Games Store | Yes, gated | No | Default off | No | Current Addendum/guidelines applicability, complete build and store-page disclosures |
| Solana dApp Store / Seeker | Yes, gated | No | Default off | No | Current publisher policy and complete use-only build |

No row implies that the absence of a purchase button by itself makes access
permissible. The policy choice keeps housing purchase off on Seeker regardless of
unrelated wallet support in the application. A new distribution capability
requires a new product ruling, implemented tests and signed acceptance.

The [current payment source evidence](freehold-service-contract.md#current-payment-source-evidence)
shows that the payment stack does not authenticate physical client distribution.
Account/scope authentication, the calling server's service secret, a UI flag,
Origin, user agent, request JSON and linked store accounts do not provide that
proof. D9 keeps the game server unaware of distribution. The adopted service
contract therefore requires a NEW economy-service issuer/verifier for an actual
eligible checkout channel/session. It returns an opaque account/purpose/SKU/
policy/quote/operation-bound authorization and validated effect to the game host,
without a channel label. Counsel must assess that exact required checkout proof
and complete flow as an external acceptance artifact; no existing attestation or
platform approval is claimed. Unknown eligibility refuses new spend, while an
accepted payment remains recoverable under its original operation and receipt.
The [planned adapter owners](freehold-service-contract.md#checkout-authorization-and-the-d9-boundary)
assign the game purchase/deed consumers and durable operation records separately
from the external issuer/verifier. D9 is an existing decision under
"Locked decisions" in [state.md](../../freeholds/state.md); the new interfaces
are adopted requirements and remain unimplemented.

## Required determinations and primary evidence

Sources below were retrieved on 2026-09-05; the Solana Mobile publisher policy
was re-retrieved on 2026-09-06 at its current host. Counsel revalidates policy
text for the actual submission date and archives a dated copy/digest in the
signed artifact.

| Determination artifact | Evidence and required scope | Gate disposition today |
|---|---|---|
| Apple entitlement-model determination | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), 3.1.1, 3.1.1(a), 3.1.3(b), 3.1.5. Section 3.1.3(b) conditions multiplatform access on also offering the items through IAP. Assess this proposed no-native-purchase model explicitly, including any applicable storefront exception and the prohibition on NFT ownership unlocking app features. | EXTERNAL determination not accepted; Apple housing enablement/submission blocked. No native billing expansion is silently authorized. |
| Google classification/declaration determination | [Blockchain-based Content](https://support.google.com/googleplay/android-developer/answer/13607354). Assess the actual build and connected services, Financial features declaration applicability, billing, rewards presentation and disclosures. The packet's stronger vocabulary restriction is a product rule. | EXTERNAL determination not accepted; Play housing enablement/submission blocked. |
| Steam product determination | [Steamworks Onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding), prohibited content item 13. It excludes blockchain applications issuing or allowing exchange of cryptocurrency/NFTs. Obtain a determination for this specific isolated build and cross-platform entitlement use. | EXTERNAL determination not accepted; Steam housing enablement/submission blocked. |
| Epic current-policy determination | [Content Guidelines](https://cdn2.unrealengine.com/epic-games-store-content-guidelines-f8accc43356e.pdf) require applicable Blockchain Addendum compliance. The exact [Blockchain Technology Guidelines](https://dev.epicgames.com/docs/epic-games-store/requirements-guidelines/distribution-requirements/blockchain) could not be retrieved in the audit. Counsel must archive the current text and accepted agreement. | EXTERNAL current-text/acceptance artifact required; no inferred China/South Korea list or blanket link claim. |
| Seeker current-policy determination | [dApp Store introduction](https://docs.solanamobile.com/dapp-store/intro) and [Terms of Use](https://legal.solanamobile.com/en/dapp-store-tos) do not approve this housing integration. The [Solana Mobile Publisher Policy](https://legal.solanamobile.com/publisher-policy-web) (retrieved 2026-09-06; "Last Updated: Jul 21, 2026"; the old solanamobile.com URL redirects there) states it is part of and subject to the Solana Mobile dApp Store Developer Agreement; the policy text itself carries no in-app purchase, NFT, digital-asset or territory rule and defers to that Developer Agreement and the Terms of Use, which counsel must confirm verbatim. | EXTERNAL current-text/acceptance artifact required, including the Solana Mobile dApp Store Developer Agreement (current signed text) as a named acceptance artifact; purchase and deeds stay off. |
| Linked-Terms metadata determination | The client links one canonical Terms document from every shell ([src/ui/terms_link.ts](../../../src/ui/terms_link.ts)); the accepted Terms describe the web-only deed service the way live section 22 describes the marketplace. Determine whether linked Terms content counts as app metadata or an external purchase reference under Apple 3.1.1(a) and Google's declaration, so no per-distribution Terms rendering is invented. | EXTERNAL determination not accepted; the one-document mechanism is the only delivery mechanism proposed. |
| Payment/territory determination | Actual signed service catalog, conversion/burn/refund schedule, age/account controls, sanctions/geography evidence and proposed Terms. Assess each approved rail and jurisdiction without treating uniqueness as a blanket exemption. | Supported list remains empty until the signed schedule accepts explicit rows. |
| Custody/delegate determination | [Deed contract](freehold-deed-service-contract.md), per-asset transfer freeze, proposed optional authority, furnished manifest, consumer rights, account deletion/export and security controls. | No mint/list/transfer or irreversible authority use before signed acceptance. |

These are tracked external deliverables with a disabled gating event, not
unanswered implementation questions. If an external determination rejects a
proposed surface, that surface stays disabled; Fernando records a separate product
scope revision before any alternative implementation or listing is prepared.

## Text and review package

Counsel receives the actual proposed
[Terms amendment](freehold-terms-amendment.md),
[store listing and review-note drafts](freehold-store-listing-drafts.md),
[economy-service contract](freehold-service-contract.md),
[deed-service contract](freehold-deed-service-contract.md), and
[territory/authority schedule](freehold-territory-authority-schedule.md).
In-client player text is supplied as the `hudChrome.housing.*` ids pinned by
ux-spec and the UX key manifest (D92); Terms clauses arrive as the amendment's
redline text and store listings as storefront metadata, and no legal prose from
this memo is automatically inserted into the HUD.

The evidence bundle includes build/distribution identifiers, approved capability
matrix, the NEW service issuer/verifier and accepted checkout-session proof,
cross-binding/expiry/replay/refusal conformance, screenshots of all reachable
housing/store/support states, route and
catalog-denial tests, receipt/replay/custody proof, actual purchase destination
and return-flow captures, data inventory/retention schedule, and the complete
public listing/review notes. It also includes the live governing documents the
amendment reconciles: [public/terms.html](../../../public/terms.html),
[public/privacy.html](../../../public/privacy.html),
[TERMS_AND_CONDITIONS.md](../../../TERMS_AND_CONDITIONS.md),
[TERMS_AND_CONDITIONS_MARKETPLACE_DRAFT.md](../../../TERMS_AND_CONDITIONS_MARKETPLACE_DRAFT.md)
(whose open `[COUNSEL]` questions in sections 8, 9 and 10 and the section 17
liability cap are inherited, as the 44b handoff cites them)
and [src/ui/terms_link.ts](../../../src/ui/terms_link.ts). Test accounts use
fictional public data; credentials are delivered through the established secure
review process, never these docs.

## Acceptance record to be signed

| Certificate field | Required content | Status |
|---|---|---|
| Memo identity | Version, digest, date, responsible counsel identity and jurisdiction of advice | Unsigned |
| Product facts | Exact release build, service versions, factual exceptions and tested flow evidence | Unaccepted |
| Distribution schedule | One explicit accepted/denied row per proposed distribution, entitlement model and management destination | No accepted rows |
| Terms acceptance | Accepted redline digest, publisher, public URL/version and effective date | Unpublished |
| Payment/authority schedule | Exact accepted rails, territories, delegate powers, retention/refund rules and revocation owner | No accepted rows |
| Signatures | Counsel determination; Fernando product/release acceptance; service maintainer factual acceptance | Unsigned |

The release owner verifies matching live versions and revocation status before
production enablement or a housing-bearing storefront submission. This session
produces drafts only; it submits no store materials and represents no approval.

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
