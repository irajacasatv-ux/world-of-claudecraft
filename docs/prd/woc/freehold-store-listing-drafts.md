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

## Storefront metadata copy and seven listing assemblies

Three text sinks appear in this draft and each has its own delivery mechanism.
Store listing text (title, description, screenshot alt text) is storefront
metadata entered in App Store Connect, the Play Console, Steamworks, the Epic
developer portal and the dApp Store publisher portal by the submission owner;
`src/ui` never renders it, so it is NOT a `hudChrome.housing.*` key and adds no
row to the exact UX key manifest. In-client purchase copy (the next section)
uses ONLY the `hudChrome.housing.*` ids pinned by
[ux-spec.md](../../freeholds/ux-spec.md) and
[ux-key-manifest.json](../../freeholds/ux-key-manifest.json) (D92: `charter.*`,
`steward.*`, `granted.*`); Phase 16 adds the English source values to the NEW
`housing` subtree of existing `hudChromeStrings` in
[src/ui/i18n.catalog/hud_chrome.ts](../../../src/ui/i18n.catalog/hud_chrome.ts)
and regenerates generated bundles, never editing them by hand. Terms clauses
are the third sink and live in the
[Terms amendment](freehold-terms-amendment.md) as redline text. At every
in-client sink use the exported `t` from [src/ui/i18n.ts](../../../src/ui/i18n.ts)
with its `formatNumber` and `formatDateTime` for applicable values. Its
`formatMoney` formats game copper; it MUST NOT format or convert Claudium, $WOC,
SOL or fiat amounts. Phase 16 formats service amounts in the quote's actual
accepted denomination and refuses unavailable/unsupported currency schemas.
Proper nouns match the packet. Neither the ordinary Book of Deeds nor personal
trophy provenance is the optional transfer service.

The metadata rows below are identified by a field label for the submission
owner's per-distribution metadata file (English now; per-locale metadata is a
later submission-owner deliverable, never an i18n catalog row). Phase 20's
evidence bundle carries the exact submitted text and its digest.

| Metadata field (not a HUD key) | Exact English source |
|---|---|
| `title` | A place to call home |
| `common` | Step inside your Inn Room, arrange your furnishings and display trophies from your adventures. Set who may visit, then welcome friends into a home that feels like yours. |
| `web` | Start with a free Inn Room. A Freehold Charter adds a Cottage with more room to decorate and an amenity slot. Housing purchases provide access, cosmetic space and convenience without adding combat power. Review the current offer in the WOC Store. |
| `websiteDesktop` | Start with a free Inn Room. A Freehold Charter adds a Cottage with more room to decorate and an amenity slot. Housing purchases provide access, cosmetic space and convenience without adding combat power. Review the current offer in the WOC Store. |
| `apple` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `google` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `steam` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `epic` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `seeker` | Make your Inn Room your own with furnishings and trophy displays. Arrange your home, manage visits and share a quiet place with friends. |
| `noTimeLoss` | Your home, furnishings and personal trophy records stay with you while you are away. |
| `imageAltInn` | An Inn Room with warm hearth light, a furnishing palette and a personal trophy display. |
| `imageAltCottage` | A decorated Cottage with a clear entry path and a view of the hearth. |

| Distribution | Exact proposed listing assembly | Purchase/deed behavior |
|---|---|---|
| Browser web | `title`, `common`, `web`, `noTimeLoss` | Charter/Call only after all gates; deed copy absent until later separate approval |
| Website-distributed desktop | `title`, `common`, `websiteDesktop`, `noTimeLoss` | Same gated product scope |
| Apple App Store | `title`, `common`, `apple`, `noTimeLoss` | Housing purchase/deed content absent; use itself waits for the Apple entitlement-model determination |
| Google Play | `title`, `common`, `google`, `noTimeLoss` | Housing purchase/deed content absent; actual build/declaration accepted before submission |
| Steam | `title`, `common`, `steam`, `noTimeLoss` | Housing purchase/deed content absent; exact build acceptance required |
| Epic Games Store | `title`, `common`, `epic`, `noTimeLoss` | Housing purchase/deed content absent; current policy/build acceptance required |
| Solana dApp Store / Seeker | `title`, `common`, `seeker`, `noTimeLoss` | Housing purchase/deed content absent; current publisher-policy/build acceptance required |

The actual English values above are complete copy, not instructions to
improvise a listing. Do not show Cottage pictures on a denied listing unless
counsel accepts an accurate entitlement/access explanation for the exact build.
The free Inn Room image supplies a truthful common first-wave target. The
`noTimeLoss` claim must match the live Terms and Privacy Policy after the
reconciliation the Terms amendment names (inactive-account deletion and wipe
reservations); it is not published against an unreconciled clause.

## WOC Store purchase surface

These rows are browser-web and website-desktop only, gated by exactly the two
`HudFeatures` rows Phase 14 injects, `freeholdPurchaseEnabled` and
`freeholdManageOnWebsite` (D91); housing use itself is the server entitlement
gate read through the housing facet, never a `HudFeatures` row. The complete
purchasing submodel is absent elsewhere: labels, price fetch, thumbnails used as
sales links, CTA/keyboard handlers, hidden DOM, aria text, errors, deep links and
retry routes. Absence is a runtime contract (no DOM node, handler, request,
fetched catalog, error copy or accessible text); the purchase code and its
English keys ship dormant in every bundle under that runtime capability, and the
reviewer notes below say so explicitly (D86). Each field below binds the current
accepted quote/effect; no illustrative number is substituted. A refused quote
shows unavailability without a guessed total.

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

The in-client keys are the manifest ids and their exact manifest English
(window titles, tabs and buttons in title case per D92 and DESIGN.md 5.4). The
six rows marked "16, D92" are the Store section heading, fee and tax, quote
validity, Purchase Terms, request-reference and support-review lines D92 adds
under `charter.*`; ux-spec and the manifest already carry them with Phase 16 as
owner, and 16 ships their English source in its own change. No `store.*` family
exists.

| Purchase state | Key (`hudChrome.housing.` prefix) | Exact English source |
|---|---|---|
| Store section heading (16, D92) | `charter.section` | Freeholds |
| Charter card title | `charter.title` | Freehold Charter |
| Charter card summary | `charter.summary` | Open a Cottage to furnish, display your trophies and welcome friends. |
| Charter card boundary | `charter.boundary` | A cosmetic home with convenience and access features. It grants no combat power. |
| Charter card free room | `charter.freeRoom` | An Inn Room is free for every account. |
| Charter card art | `charter.artAria` | Cottage interior with a hearth and space for your furnishings |
| Charter already owned | `charter.owned` | This account already has a Cottage or a larger home. |
| Call title | `steward.call` | Master Builder's Call |
| Call effect, current bill unpaid | `steward.callCurrentTooltip` | Pay the current unpaid Ledger and restore condition to {maximum}. Future prepaid weeks stay unchanged. |
| Call effect, repair-only | `steward.callRepairTooltip` | Restore condition to {maximum}. Your current Ledger is already paid. Future prepaid weeks stay unchanged. |
| Call review action | `steward.reviewCall` | Review Master Builder's Call |
| Quote loading | `charter.quoteLoading` | Loading current price... |
| Price | `charter.price` | Price: {price} |
| Fees and taxes (16, D92) | `charter.feeDetails` | Fees and taxes: {feeDetails} |
| Quote validity (16, D92) | `charter.quoteExpiry` | Price valid until {expiresAt}. |
| Review action | `charter.review` | Review Purchase |
| Confirm action | `charter.confirm` | Confirm Purchase |
| Cancel action | shared confirmation prompt | The existing blocking prompt's Cancel action (no housing key) |
| Purchase Terms link (16, D92) | `charter.terms` | Purchase Terms |
| Pending | `charter.pending` | Your purchase is being confirmed. |
| Reconciling an original purchase | `charter.reconciling` | Checking your original purchase. You do not need to buy again. |
| Charter complete | `charter.received` | Your Cottage is ready. |
| Call complete | `granted.call` | Your home's condition is restored. |
| Receipt heading | `charter.receipt` | Purchase Confirmation |
| Request reference (16, D92) | `charter.reference` | Request reference: {operationId} |
| Support review (16, D92) | `charter.supportReview` | This request needs a support review. Your request reference is saved. |
| Unavailable | `charter.unavailable` | This purchase is unavailable right now. |
| Quote expired | `charter.quoteExpired` | This quote has expired. Review the current quote before confirming. |
| Price changed | `charter.priceChanged` | The price has changed. Review the new price before confirming. |
| Cancelled | `charter.cancelled` | Purchase cancelled. |
| Management line | `steward.manageWebsite` | Manage on the Website |
| Management line aria | `steward.manageWebsiteAria` | Open approved home management on the website |

The accepted Charter card (ux-spec section 8) carries no separate capacity line;
Cottage room, decor, plinth and amenity facts are Steward and tier facts, not
purchase copy, and a later SKU that needs such a line names its plural-safe key
in its own phase. Display a formatted total and service-authored fee components
through keyed structured fields; never render untrusted service HTML or
untranslated free-form descriptions in `feeDetails`. The quoted effect includes
target home, current bill treatment and source/balance facts, with an explicit
confirmation and operation-correlated result.

The neutral `steward.manageWebsite` row is independent of purchase capability.
Its default is absent on denied distributions. It appears only where written
approval covers the exact destination and complete onward/return flow. It is
never a way to route a denied platform to checkout under a different label.

## Later optional deed copy, approved web surfaces only

This English is included solely as the concrete future review draft for 37/38.
It does not appear in the first-wave store or any native/Steam/Epic/Seeker listing.
All prices and fees still come from an accepted service quote. Per D92 Phase 38
names these keys in its own file under the `hudChrome.housing.deed.*` family with
exactly this English; ux-spec and the manifest carry them with 38 as owner. The
on-chain deed's player-facing name is "Optional Freehold Deed" (title case) and
never a name containing "Charter": the D1 entitlement alone is the Freehold
Charter (the coordinator ruling on DK F2). The
[deed contract](freehold-deed-service-contract.md) lists the same states once.

| Deed or sale state | Key (`hudChrome.housing.` prefix, owner 38) | Exact English source |
|---|---|---|
| Deed title | `deed.title` | Optional Freehold Deed |
| Deed description | `deed.description` | Create an optional record for this Freehold through the approved service. Your game access does not require this record. |
| Sale review | `deed.saleReview` | Review the home and furnishings included in this sale. |
| Included contents heading | `deed.includedHeading` | Included in the sale |
| Retained contents heading | `deed.retainedHeading` | Staying with you |
| Custody statement | `deed.custody` | Your personal trophy records and excluded belongings remain yours. The sale proceeds only when their safe storage is confirmed. |
| Condition and credits | `deed.conditionCredits` | The home's condition is recorded through the transfer time. Existing prepayment credits keep their original terms. Account return grace does not transfer. |
| Sale pending | `deed.salePending` | This sale is being confirmed. Its request reference is saved. |
| Service unavailable | `charter.serviceUnavailable` (owner 37) | This service is unavailable for this account or location. |
| No price promise | `deed.noPricePromise` | A listing does not guarantee a buyer or a future price. |

## Proposed review notes for the submission owner

The following paragraphs are actual draft reviewer correspondence, not public
marketing. The submission owner attaches tested build facts and the signed
certificate before sending them. They must never be used to hide connected
services or assert a platform's approval without evidence. Every denied-build
note below uses "absent" in the D86 sense the certificate states explicitly:
the housing purchase and deed submodel is not rendered or reachable at runtime
(no DOM node, handler, request, fetched catalog, error copy or accessible text),
while the shared bundle carries that code and its English keys dormant under the
runtime capability; the note never claims the bundle contains no purchase
vocabulary.

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

Absence on a denied storefront is a runtime contract: no DOM node, handler,
request, fetched catalog, error copy or accessible text. Purchase code and its
English keys ship dormant in every bundle under the runtime capability; the
review notes above and the 44b handoff say so explicitly, counsel confirms it in
44b, and denied-surface evidence is a DOM/handler/request scan, never a bundle
scan (D86).

For each distribution the signed certificate identifies actual build and catalog
versions, the accepted in-client key set (the `ux-key-manifest.json` ids Phase 16
ships, including the six 16-owned `charter.*` rows above) and its digest, the
submitted metadata text and its digest, screenshot set, denied-surface test result,
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
