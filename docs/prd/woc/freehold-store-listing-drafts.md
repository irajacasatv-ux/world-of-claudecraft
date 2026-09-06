# Freehold store listing and review-note drafts

Status: adopted packet requirements, approved 2026-09-06; external sign-off remains a release gate. These are
actual proposed English listings and purchase copy, not submitted store metadata.
Only the accepted capability/build combination may use a row. Counsel acceptance,
published Terms and economy-service acceptance all precede paid enablement and
the applicable housing-bearing storefront submission. The
[counsel memo](freehold-counsel-memo.md) owns policy evidence; the
[territory/authority schedule](freehold-territory-authority-schedule.md) owns
accepted jurisdictions and any later deed authority.

Fernando owns product copy approval and names the submission owner. Counsel owns
distribution/flow acceptance. The economy-service maintainer owns the quoted
values. Phases 14 to 16 produce surface/copy tests and captures; 20 verifies Wave A
acceptance. Phases 37 to 39 author and validate a separately approved later listing
for the optional deed service. Do not advertise Guildhalls, wards, showcases or
advanced decoration in the first-wave listing before their delivery gates pass.

Written signature/acceptance records in this draft are release artifacts, not a
runtime cryptographic protocol. The
[account lifecycle and rollout contract](freehold-service-contract.md#account-lifecycle-export-and-capable-rollout)
requires explicit safe housing exports, distinction between soft deactivation
and hard deletion/restoration, and a named minimum capable release with quiescent
rollback. Store review notes must describe the actual accepted build, not claim
that an older release maintains housing semantics merely by retaining tables.

## English source copy and seven listing assemblies

Every player-visible string below is a proposed English `hudChrome.housing.*`
key owned by the NEW `housing` subtree of existing `hudChromeStrings` in
[src/ui/i18n.catalog/hud_chrome.ts](../../../src/ui/i18n.catalog/hud_chrome.ts).
That subtree is unimplemented. Implementing sessions add English source values
only and regenerate generated bundles, never edit them by hand. Use the exported
`t` from [src/ui/i18n.ts](../../../src/ui/i18n.ts) at every sink, with its
`formatNumber` and `formatDateTime` for applicable values. Its `formatMoney`
formats game copper; it MUST NOT format or convert Claudium, $WOC, SOL or fiat
amounts. Phase 16 formats service amounts in the quote's actual accepted
denomination and refuses unavailable/unsupported currency schemas.
Proper nouns match the packet. Neither the ordinary Book of Deeds nor personal
trophy provenance is the optional transfer service.

| Source key | Exact English source |
|---|---|
| `hudChrome.housing.listing.title` | A place to call home |
| `hudChrome.housing.listing.common` | Step inside your Inn Room, arrange your furnishings and display trophies from your adventures. Set who may visit, then welcome friends into a home that feels like yours. |
| `hudChrome.housing.listing.web` | Start with a free Inn Room. A Freehold Charter adds a Cottage with more room to decorate and an amenity slot. Housing purchases provide access, cosmetic space and convenience without adding combat power. Review the current offer in the WOC Store. |
| `hudChrome.housing.listing.websiteDesktop` | Start with a free Inn Room. A Freehold Charter adds a Cottage with more room to decorate and an amenity slot. Housing purchases provide access, cosmetic space and convenience without adding combat power. Review the current offer in the WOC Store. |
| `hudChrome.housing.listing.apple` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `hudChrome.housing.listing.google` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `hudChrome.housing.listing.steam` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `hudChrome.housing.listing.epic` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `hudChrome.housing.listing.seeker` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `hudChrome.housing.listing.noTimeLoss` | Your home, furnishings and personal trophy records stay with you while you are away. |
| `hudChrome.housing.listing.imageAltInn` | An Inn Room with warm hearth light, a furnishing palette and a personal trophy display. |
| `hudChrome.housing.listing.imageAltCottage` | A decorated Cottage with a clear entry path and a view of the hearth. |

| Distribution | Exact proposed listing assembly | Purchase/deed behavior |
|---|---|---|
| Browser web | `listing.title`, `listing.common`, `listing.web`, `listing.noTimeLoss` | Charter/Call only after all gates; deed copy absent until later separate approval |
| Website-distributed desktop | `listing.title`, `listing.common`, `listing.websiteDesktop`, `listing.noTimeLoss` | Same gated product scope |
| Apple App Store | `listing.title`, `listing.common`, `listing.apple`, `listing.noTimeLoss` | Housing purchase/deed content absent; use itself waits for the Apple entitlement-model determination |
| Google Play | `listing.title`, `listing.common`, `listing.google`, `listing.noTimeLoss` | Housing purchase/deed content absent; actual build/declaration accepted before submission |
| Steam | `listing.title`, `listing.common`, `listing.steam`, `listing.noTimeLoss` | Housing purchase/deed content absent; exact build acceptance required |
| Epic Games Store | `listing.title`, `listing.common`, `listing.epic`, `listing.noTimeLoss` | Housing purchase/deed content absent; current policy/build acceptance required |
| Solana dApp Store / Seeker | `listing.title`, `listing.common`, `listing.seeker`, `listing.noTimeLoss` | Housing purchase/deed content absent; current publisher-policy/build acceptance required |

In the assembly table, all shortened keys have the prefix
`hudChrome.housing.`. The actual English values above are complete copy, not
instructions to improvise a listing. Do not show Cottage pictures on a denied
listing unless counsel accepts an accurate entitlement/access explanation for the
exact build. The free Inn Room image supplies a truthful common first-wave target.

## WOC Store purchase surface

These rows are browser-web and website-desktop only. The complete purchasing
submodel is absent elsewhere: labels, price fetch, thumbnails used as sales links,
CTA/keyboard handlers, hidden DOM, aria text, errors, deep links and retry routes.
Each field below binds the current accepted quote/effect; no illustrative number
is substituted. A refused quote shows unavailability without a guessed total.

These adopted distribution rules govern the future housing UI and metadata;
the housing capability map is not implemented. The
[current payment source evidence](freehold-service-contract.md#current-payment-source-evidence)
does not attest the physical client to the payment service. The NEW economy-service issuer/
verifier must authorize an actual eligible checkout channel/session and bind its
opaque authorization to account, purpose, SKU, policy, quote and operation. The
game host receives only that opaque authorization and a validated effect/refusal,
never a channel label, preserving D9. The signed issuer/verifier, checkout proof
and conformance artifact gates new spend; existing account authentication,
server secrets, UI flags, Origin, user agent and linked store accounts are not
substitutes. Unknown eligibility refuses new spend. An already accepted payment
still recovers through its original operation without a new checkout/debit.
The [planned adapter ownership](freehold-service-contract.md#checkout-authorization-and-the-d9-boundary)
keeps external verification, the game purchase/deed consumers and protected
durable operation bindings separate. The source block records observed outgoing
credentials only, not an inspected remote verifier.

| English source key | Exact English source |
|---|---|
| `hudChrome.housing.store.charterTitle` | Freehold Charter |
| `hudChrome.housing.store.charterDescription` | Add a Cottage to your account, with more space for furnishings and personal trophy displays. Includes access and convenience, with no added combat power. |
| `hudChrome.housing.store.charterDetails` | {roomCount} room, {decorBudget} decor capacity, {plinthBudget} trophy plinths and {amenityBudget} amenity slot. |
| `hudChrome.housing.store.charterOwned` | Your account already has this Charter. |
| `hudChrome.housing.store.callTitle` | Master Builder's Call |
| `hudChrome.housing.store.callDescription` | Restore your home's condition and cover its current unpaid Steward's Ledger. Your future prepayment credits stay unchanged. |
| `hudChrome.housing.store.callRepairOnly` | This Ledger is already paid. This Call restores condition only. |
| `hudChrome.housing.store.price` | Total: {price} |
| `hudChrome.housing.store.feeDetails` | Fees and taxes: {feeDetails} |
| `hudChrome.housing.store.quoteExpiry` | Price valid until {expiresAt}. |
| `hudChrome.housing.store.review` | Review purchase |
| `hudChrome.housing.store.confirm` | Confirm purchase |
| `hudChrome.housing.store.cancel` | Cancel |
| `hudChrome.housing.store.terms` | Purchase Terms |
| `hudChrome.housing.store.pending` | Your purchase is being checked. You can keep playing. |
| `hudChrome.housing.store.complete` | Your purchase is complete. |
| `hudChrome.housing.store.unavailable` | This offer is unavailable right now. |
| `hudChrome.housing.store.expired` | This price has expired. Review the new total before confirming. |
| `hudChrome.housing.store.manageWebsite` | Manage on the website |

`store.charterDetails` is Cottage-specific English, populated from state Content
numbers and the accepted catalog, not a generic sentence with guessed plural
rules. Later SKUs author complete plural-safe keys. Display a formatted total and
service-authored fee components through keyed structured fields; never render
untrusted service HTML or untranslated free-form descriptions in `feeDetails`.
The quoted effect includes target home, current bill treatment and source/balance
facts, with an explicit confirmation and operation-correlated result.

The neutral `store.manageWebsite` row is independent of purchase capability. Its
default is absent on denied distributions. It appears only where written approval
covers the exact destination and complete onward/return flow. It is never a way
to route a denied platform to checkout under a different label.

## Later optional deed copy, approved web surfaces only

These keys are included solely as the concrete future review draft for 37/38.
They do not appear in the first-wave store or any native/Steam/Epic/Seeker listing.
All prices and fees still come from an accepted service quote.

| English source key | Exact English source |
|---|---|
| `hudChrome.housing.store.webDeedTitle` | Optional Freehold deed |
| `hudChrome.housing.store.webDeedDescription` | Create an optional record for this Freehold through the approved service. Your game access does not require this record. |
| `hudChrome.housing.store.webSaleReview` | Review the home and furnishings included in this sale. |
| `hudChrome.housing.store.webSaleIncluded` | Included in the sale |
| `hudChrome.housing.store.webSaleRetained` | Staying with you |
| `hudChrome.housing.store.webSaleCustody` | Your personal trophy records and excluded belongings remain yours. The sale proceeds only when their safe storage is confirmed. |
| `hudChrome.housing.store.webSaleCondition` | The home's condition is recorded through the transfer time. Existing prepayment credits keep their original terms. Account return grace does not transfer. |
| `hudChrome.housing.store.webSalePending` | This sale is being confirmed. Its request reference is saved. |
| `hudChrome.housing.store.webSaleAvailability` | This service is unavailable for this account or location. |
| `hudChrome.housing.store.webSaleNoPromise` | A listing does not guarantee a buyer or a future price. |

## Proposed review notes for the submission owner

The following paragraphs are actual draft reviewer correspondence, not public
marketing. The submission owner attaches tested build facts and the signed
certificate before sending them. They must never be used to hide connected
services or assert a platform's approval without evidence.

| Distribution | Proposed reviewer note |
|---|---|
| Browser web | The housing offer shown on this distribution is the accepted account-entitlement Charter and upkeep convenience service. The attached flow captures show the exact quote, terms, confirmation, pending/recovery and support states. The service catalog is the price authority. Optional deed services are absent from the first-wave build. |
| Website-distributed desktop | This direct-distribution build exposes only the housing operations covered by the attached capability and service certificates. The attached capture follows the complete checkout and return path. Game access uses the authenticated server entitlement. |
| Apple App Store | This submission contains housing gameplay using the account model described in the attached signed entitlement determination. Housing purchase controls and purchase-routing destinations are absent. Please assess the disclosed multiplatform model and complete connected-service description against the applicable policies. The attached determination explicitly addresses 3.1.3(b); the absence of checkout is not presented as sufficient approval. |
| Google Play | This submission contains the housing gameplay demonstrated in the attached build captures. Housing purchase and optional deed-service surfaces are absent. The attached accepted declaration determination describes the actual build and connected services; the submitted Financial features answers match that determination. |
| Steam | This build provides the account-based housing gameplay shown in the attached evidence. Housing purchase and optional deed-service surfaces are absent. The complete connected-service and entitlement model is disclosed in the attached determination for this exact build. |
| Epic Games Store | This build provides the account-based housing gameplay shown in the attached evidence. Housing purchase and optional deed-service surfaces are absent. The attached current-policy determination and any applicable accepted agreement describe this exact build and store page. |
| Solana dApp Store / Seeker | This build provides housing gameplay only. Housing purchase and optional deed services are absent, including navigation to those services. The attached current publisher-policy determination covers this exact build; other application capabilities are disclosed separately and accurately. |

## Copy acceptance and evidence certificate

Public housing marketing avoids the words earn, income and yield, and any promise
of monetary return. Native, Steam, Epic and Seeker player text has no token,
wallet or on-chain-deed labels, URLs or alt-text sales payloads. Ordinary trophy
accomplishments use the approved Book of Deeds vocabulary. Tooltips authored by
implementation follow [tooltip-writing.md](../../design/tooltip-writing.md);
these listing/confirmation rows are not substitutes for resolved mechanic
tooltips. This is the packet's editorial rule, not a quote of platform policy.

For each distribution the signed certificate identifies actual build and catalog
versions, accepted key set/digest, screenshot set, denied-surface test result,
complete destination captures, counsel memo version, published Terms version,
service acceptance version including NEW checkout issuer/verifier and proof,
reviewer-correspondence archive, and Fernando's
release approval. Signatures and publication are currently absent. Missing or
mismatched evidence blocks that listing submission and affected feature enablement.
The evidence includes transfer-boundary condition, original calendar/credit
preservation, retained seller history and prospective buyer lifecycle without
copied/new grace. No listing promises otherwise.
Source URLs and retrieval dates are recorded in the linked counsel memo; policy
revalidation at actual submission remains a named external acceptance obligation.

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
