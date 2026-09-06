# Freehold Terms amendment draft

Status: adopted packet requirements, approved 2026-09-06; counsel acceptance remains a release gate. This is
redline-ready replacement/addition text for the future publisher of the Terms;
it does not amend the live Terms. Counsel must reconcile it with the actual
governing Terms, mandatory consumer rights and distribution-specific conditions.
The accepted version must be published before any real housing payment or
housing-bearing storefront submission covered by the counsel certificate.
Signed acceptance is written approval of this text. It does not imply a runtime
cryptographic signature scheme.

Terms clauses are not HUD i18n sinks: the client never renders Terms text, it
LINKS to one canonical document (see "Publication artifacts" below), so no
`hudChrome.housing.*` key exists for any clause here. The publication artifacts
are a NEW root `TERMS_AND_CONDITIONS_FREEHOLD_DRAFT.md` redline against
[TERMS_AND_CONDITIONS.md](../../../TERMS_AND_CONDITIONS.md) (the
[marketplace precedent](../../../TERMS_AND_CONDITIONS_MARKETPLACE_DRAFT.md),
kept beside the live Terms and never replacing them) and, after counsel
acceptance, the publisher's edit of [public/terms.html](../../../public/terms.html)
with its markdown mirror. Phase 20 creates the root draft file from this
amendment inside its handoff-ready artifact package; 44b revisits it. In-client
purchase copy uses the ux-spec and ux-key-manifest `hudChrome.housing.*` ids
listed in the [store listing drafts](freehold-store-listing-drafts.md) (D92).

Fernando owns publication. Counsel owns the signed legal redline and effective
date. The economy-service maintainer owns receipt/refund/settlement facts.
Phases 14 to 16 validate initial behavior/copy; 20 verifies publication evidence.
Phases 37 to 39 validate the later optional transfer schedule before enabling it.
The [counsel memo](freehold-counsel-memo.md) and
[service contract](freehold-service-contract.md) define acceptance artifacts.

## Proposed English amendment text

Each row is actual proposed clause text under a proposed clause label (the
section anchor counsel assigns in the signed redline). There is one Terms
document: every shell links the same canonical page through
[src/ui/terms_link.ts](../../../src/ui/terms_link.ts) (same-origin `/terms` on
the site, otherwise `CANONICAL_TERMS_URL` in
[src/client_origin.ts](../../../src/client_origin.ts)), so native, Steam, Epic
and Seeker players read the whole accepted Terms, including the web-only deed
schedule below, exactly as the live section 22 already lets every shell read the
marketplace clauses. No per-distribution Terms subset is delivered or claimed.
Values in braces are required approved/authoritative substitutions, not optional
guessed fallback text.

| Proposed clause label | Proposed text |
|---|---|
| `housing.heading` | Homes and Guildhalls |
| `housing.access` | A Freehold Charter provides the housing access and capacity described in your confirmed purchase. Housing features are part of the game service and remain subject to your account permissions, the published game rules and these Terms. |
| `housing.starter` | The Inn Room is the free starting home. Furnishings and personal trophy displays are available through the game's stated activities and trading rules. A housing purchase does not grant combat statistics, combat rewards or faster production. |
| `housing.quote` | Before you confirm a purchase, we show the item or service, its effect, the total price, any applicable fees or taxes, and the Terms that apply. An expired price must be reviewed again before payment. |
| `housing.call` | A confirmed Master Builder's Call restores your home's condition and covers its current unpaid Steward's Ledger. It does not add future prepaid weeks or consume your existing future prepayment credits. If the current Ledger is already paid, the confirmation describes the repair-only service. |
| `housing.upkeep` | Upkeep affects the condition and availability of the amenities identified in the game. Low condition or time away does not remove your home, furnishings or personal trophy records. You can still enter and arrange your home. |
| `housing.outage` | When we declare an upkeep suspension for a qualifying service interruption, covered time adds no wear or debt. A partly active week keeps its existing flat repair bill, without an outage charge. A wholly suspended week carries its prepayment credit forward unchanged. Missed weeks do not create back bills. The Steward shows the updated coverage. |
| `housing.pending` | A request may remain pending while payment or delivery is checked. Its request reference remains available to support. Repeating the same request does not authorize another charge. |
| `housing.refunds` | Refunds, reversals and corrections follow the applicable consumer rights, platform requirements and refund policy shown with your purchase. Contact support with your request reference. We record any approved correction and preserve personal belongings safely before changing housing access. |
| `housing.guild` | A guild hall belongs to the guild's game record, which is never an account. Authorized officers manage hall purchases and projects. Contributions follow the published allowance and permission rules. Your contribution history does not give you a personal ownership share in the hall. |
| `housing.trophies` | Personal trophy unlocks and their recorded accomplishments remain attached to the qualifying account. Displaying a trophy in a home or hall does not transfer the accomplishment to another account or guild. |
| `housing.privacy` | Your visiting settings control who may enter or view your home. Public listings and displays show only the information described in those settings. You may change visibility, end visits or use the game's blocking and reporting controls. |
| `housing.data` | You may request your permitted account and housing records through the account data process. Deactivation restricts account access and retains records under the published retention policy. A separately approved permanent deletion removes personal data according to that policy while preserving the minimum records required for lawful audit, disputes and protection against repeated transactions. |
| `housing.restoration` | Restoring an account uses its retained home and account records. Restoration does not create another Charter or a new return-grace period. Deleting a character does not delete account housing. |
| `housing.support` | Account restrictions and support recovery follow the published rules and an auditable review process. Time away or an unpaid Ledger alone does not authorize permanent destruction of a home or its contents. |

The following later schedule describes a web/website-desktop-only SERVICE. It
is described and disclaimed inside the one canonical Terms document the way the
live section 22 disclaims the marketplace ("not available in the App on any
platform"); the restriction on native, Steam, Epic and Seeker applies to in-app
housing copy, storefront metadata and purchase/deed surfaces (the phase 14 map
and the listing drafts), never to the linked Terms text, which every shell can
read. It has its own signed acceptance gate. The standard Freehold Charter
purchase above is an account entitlement; the optional deed service below is
distinct.

| Proposed clause label | Proposed text |
|---|---|
| `housing.webDeedHeading` | Optional deed services |
| `housing.webDeedOptional` | An optional digital deed records the identified Freehold under the approved service rules. It is not required to use your admitted home in the game. It does not grant company ownership, a share of revenue, rent, financial returns or governance rights. |
| `housing.webSaleContents` | Before a voluntary sale, you review the exact home and eligible furnishing copies included. Only those listed contents transfer. Your personal trophy unlocks, their recorded accomplishments, bound belongings and excluded items remain yours in verified safe custody. The home's condition is settled through the transfer time, and existing prepayment credits retain their original terms. Account history and return grace do not transfer. A sale cannot proceed if safe custody cannot be secured. |
| `housing.webTransfer` | Transfers use the approved service and eligibility checks. A transfer remains pending until the service confirms its outcome and the game records the matching account change. An unsupported direct transfer does not authorize game access. Contact support with the saved request reference if confirmation is delayed. |
| `housing.webAuthority` | The accepted deed authority schedule states when the service may restrict transfer or perform an explicitly authorized irreversible action. Low home condition, an unpaid Ledger or time away does not trigger automatic deed destruction. A transfer restriction alone does not remove ordinary game access. |
| `housing.webLimits` | Availability depends on the supported territory and account checks shown by the service. We do not promise a buyer, a resale price, uninterrupted trading or a future market value. Review the confirmed price, fees, included contents and applicable Terms before each transaction. |

## Publisher instructions and certificate

These clauses are additions under the existing account, virtual-goods,
payment/refund, community, privacy and termination provisions. Counsel supplies
the exact accepted cross-references and removes conflicts in a signed redline.
No final section number or existing legal conclusion is invented in this draft.
The accepted redline must not undermine the no-time-loss promise through an
unreviewed generic expiry, forfeiture or inactivity clause.

### Live clauses to reconcile

The live Terms ([public/terms.html](../../../public/terms.html), "Last updated:
25 August 2026", mirrored by [TERMS_AND_CONDITIONS.md](../../../TERMS_AND_CONDITIONS.md))
and the live Privacy Policy ([public/privacy.html](../../../public/privacy.html),
"Last updated: 21 June 2026") carry clauses the housing promises contradict or
depend on. The signed redline disposes of each row; the Privacy Policy is an
explicit redline target (sections 2, 6 and 8) for wallet transactions, retention
and the deactivation/deletion distinction, not only the Terms.

| Live clause | Quoted text (verified 2026-09-06) | Required disposition |
|---|---|---|
| Terms 8, sale of virtual items | "We do not sell virtual items or currency, we do not buy them back" | Redline: paid Charters, tier fees and Calls sell access, capacity and convenience for real payment; `housing.access` and `housing.starter` replace the blanket denial for housing while keeping the licence framing ("You do not own them. We grant you a limited, revocable licence"). |
| Terms 8, wipe reservation | "We may modify, remove, reset, or wipe virtual items, currency, characters, and game worlds at any time ... without liability or compensation" | Redline: carve housing records out of a generic wipe under `housing.upkeep` and `housing.support`; any reset of housing state follows the recorded authority and consumer-rights rules in `housing.refunds`. |
| Terms 9, token issuance | "We do not issue, mint, control, manage, promote as an investment, or guarantee the $WOC token" | Redline: a minted optional deed is something the service issues; `housing.webDeedOptional` must state that the deed is not the $WOC token and section 9 must not deny issuing the deed asset. |
| Terms 12, service changes | "We may need to reset or wipe data" | Redline or disclaimer: the same housing carve-out as Terms 8; a discontinued housing service follows `housing.support`, never a silent wipe. |
| Terms 19, termination | "On termination, your licence to use the Service ends" plus the marketplace escrow sentence | Redline: add the housing operation and custody disposition (pending housing operations and safe custody resolve under `housing.pending` and `housing.refunds` before or alongside closure), mirroring the section 10 escrow sentence. |
| Terms 22, app store terms | "The $WOC marketplace (Section 10) is not available in the App on any platform" | Leave, and extend the same one-document pattern: housing purchase and the optional deed service are not available in the App on any platform; housing use follows the accepted entitlement model. |
| Privacy 2, wallet verification | "does not involve any transaction, signature that moves funds, or transfer of SOL" | Redline: the optional web deed service involves signed transactions and SOL/$WOC settlement; scope the sentence to holder-flair verification and describe the deed service separately. |
| Privacy 6, inactive accounts | "We may close and delete accounts that have been inactive for a long period" | Redline: reconcile with `housing.upkeep` and the listing `noTimeLoss` claim; inactivity alone never deletes a home, and any inactive-account closure follows the accepted retention schedule and `housing.data`. |
| Privacy 8, account deletion | "To delete your entire account and associated personal information, use the account deletion option in the Game or App" | Redline: the in-game option performs soft deactivation today ([server/account.ts](../../../server/account.ts) `setAccountDeactivated`); `housing.data` and `housing.restoration` must describe deactivation, restoration and the separately authorized permanent deletion truthfully. |

The [current payment source evidence](freehold-service-contract.md#current-payment-source-evidence)
and [planned adapter owners](freehold-service-contract.md#checkout-authorization-and-the-d9-boundary)
define the following boundary. Publisher/service evidence must distinguish the
game's account authentication
from the NEW service-owned authorization of an actual eligible checkout session.
The game host receives an opaque account/purpose/SKU/policy/quote/operation-bound
authorization and validated effect, not a distribution label. No existing
physical-client attestation is claimed. The exact issuer/verifier and checkout
proof require signed acceptance under the service contract before new spend.
An expired authorization or later eligibility change does not invalidate recovery
of an already accepted payment under its original operation/receipt; the pending
and refund clauses must describe that result accurately. This is implementation
evidence for counsel, not additional technical text for the player-facing Terms.
The [account lifecycle and rollout contract](freehold-service-contract.md#account-lifecycle-export-and-capable-rollout)
also requires explicit safe housing export loaders, distinct deactivation/
restoration/hard-deletion handling, preservation of replay authority, and a named
minimum capable build with quiescent rollback. An old binary keeping new tables
untouched is not evidence that it implements new housing or export semantics.

The certificate records counsel identity/signature, Fernando's approval,
accepted text digest, effective date, published URL/version, required notice and
assent process, the single canonical Terms URL every shell links plus the
per-distribution in-app copy and metadata subset, payment/refund schedule digest,
retention schedule digest and any later deed schedule digest. All are currently
unsigned/unpublished. The gating event is real paid enablement or a covered
housing-bearing storefront submission; its disposition is disabled until the
matching certificate and publication exist. No live Terms file is edited here.

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
