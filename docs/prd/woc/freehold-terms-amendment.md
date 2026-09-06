# Freehold Terms amendment draft

Status: adopted packet requirements, approved 2026-09-06; counsel acceptance remains a release gate. This is
redline-ready replacement/addition text for the future publisher of the Terms;
it does not amend the live Terms. Counsel must reconcile it with the actual
governing Terms, mandatory consumer rights and distribution-specific conditions.
The accepted version must be published before any real housing payment or
housing-bearing storefront submission covered by the counsel certificate.
Signed acceptance is written approval of this text. It does not imply a runtime
cryptographic signature scheme.

Every planned English key in this draft is owned by the NEW `housing` subtree
of existing `hudChromeStrings` in
[src/ui/i18n.catalog/hud_chrome.ts](../../../src/ui/i18n.catalog/hud_chrome.ts).
The subtree is unimplemented. Add English source only in the producing UI work;
regenerate generated bundles rather than editing them.

Fernando owns publication. Counsel owns the signed legal redline and effective
date. The economy-service maintainer owns receipt/refund/settlement facts.
Phases 14 to 16 validate initial behavior/copy; 20 verifies publication evidence.
Phases 37 to 39 validate the later optional transfer schedule before enabling it.
The [counsel memo](freehold-counsel-memo.md) and
[service contract](freehold-service-contract.md) define acceptance artifacts.

## Proposed English amendment text

Each row is actual proposed player-facing text and its English source key. The
publisher uses the same accepted source values for website Terms content; native
builds receive only the distribution-approved subset. Values in braces are
required approved/authoritative substitutions, not optional guessed fallback text.

| English source key | Proposed text |
|---|---|
| `hudChrome.housing.terms.heading` | Homes and Guildhalls |
| `hudChrome.housing.terms.access` | A Freehold Charter provides the housing access and capacity described in your confirmed purchase. Housing features are part of the game service and remain subject to your account permissions, the published game rules and these Terms. |
| `hudChrome.housing.terms.starter` | The Inn Room is the free starting home. Furnishings and personal trophy displays are available through the game's stated activities and trading rules. A housing purchase does not grant combat statistics, combat rewards or faster production. |
| `hudChrome.housing.terms.quote` | Before you confirm a purchase, we show the item or service, its effect, the total price, any applicable fees or taxes, and the Terms that apply. An expired price must be reviewed again before payment. |
| `hudChrome.housing.terms.call` | A confirmed Master Builder's Call restores your home's condition and covers its current unpaid Steward's Ledger. It does not add future prepaid weeks or consume your existing future prepayment credits. If the current Ledger is already paid, the confirmation describes the repair-only service. |
| `hudChrome.housing.terms.upkeep` | Upkeep affects the condition and availability of the amenities identified in the game. Low condition or time away does not remove your home, furnishings or personal trophy records. You can still enter and arrange your home. |
| `hudChrome.housing.terms.outage` | When we declare an upkeep suspension for a qualifying service interruption, covered time adds no wear or debt. A partly active week keeps its existing flat repair bill, without an outage charge. A wholly suspended week carries its prepayment credit forward unchanged. Missed weeks do not create back bills. The Steward shows the updated coverage. |
| `hudChrome.housing.terms.pending` | A request may remain pending while payment or delivery is checked. Its request reference remains available to support. Repeating the same request does not authorize another charge. |
| `hudChrome.housing.terms.refunds` | Refunds, reversals and corrections follow the applicable consumer rights, platform requirements and refund policy shown with your purchase. Contact support with your request reference. We record any approved correction and preserve personal belongings safely before changing housing access. |
| `hudChrome.housing.terms.guild` | A guild hall belongs to the guild's game account record. Authorized officers manage hall purchases and projects. Contributions follow the published allowance and permission rules. Your contribution history does not give you a personal ownership share in the hall. |
| `hudChrome.housing.terms.trophies` | Personal trophy unlocks and their recorded accomplishments remain attached to the qualifying account. Displaying a trophy in a home or hall does not transfer the accomplishment to another account or guild. |
| `hudChrome.housing.terms.privacy` | Your visiting settings control who may enter or view your home. Public listings and displays show only the information described in those settings. You may change visibility, end visits or use the game's blocking and reporting controls. |
| `hudChrome.housing.terms.data` | You may request your permitted account and housing records through the account data process. Deactivation restricts account access and retains records under the published retention policy. A separately approved permanent deletion removes personal data according to that policy while preserving the minimum records required for lawful audit, disputes and protection against repeated transactions. |
| `hudChrome.housing.terms.restoration` | Restoring an account uses its retained home and account records. Restoration does not create another Charter or a new return-grace period. Deleting a character does not delete account housing. |
| `hudChrome.housing.terms.support` | Account restrictions and support recovery follow the published rules and an auditable review process. Time away or an unpaid Ledger alone does not authorize permanent destruction of a home or its contents. |

The following later schedule is web/website-desktop-only and must not appear in
native, Steam, Epic or Seeker housing copy. It has its own signed acceptance gate.
The standard Freehold Charter purchase above is an account entitlement; the
optional deed service below is distinct.

| English source key | Proposed text |
|---|---|
| `hudChrome.housing.terms.webDeedHeading` | Optional deed services |
| `hudChrome.housing.terms.webDeedOptional` | An optional digital deed records the identified Freehold under the approved service rules. It is not required to use your admitted home in the game. It does not grant company ownership, a share of revenue, rent, financial returns or governance rights. |
| `hudChrome.housing.terms.webSaleContents` | Before a voluntary sale, you review the exact home and eligible furnishing copies included. Only those listed contents transfer. Your personal trophy unlocks, their recorded accomplishments, bound belongings and excluded items remain yours in verified safe custody. The home's condition is settled through the transfer time, and existing prepayment credits retain their original terms. Account history and return grace do not transfer. A sale cannot proceed if safe custody cannot be secured. |
| `hudChrome.housing.terms.webTransfer` | Transfers use the approved service and eligibility checks. A transfer remains pending until the service confirms its outcome and the game records the matching account change. An unsupported direct transfer does not authorize game access. Contact support with the saved request reference if confirmation is delayed. |
| `hudChrome.housing.terms.webAuthority` | The accepted deed authority schedule states when the service may restrict transfer or perform an explicitly authorized irreversible action. Low home condition, an unpaid Ledger or time away does not trigger automatic deed destruction. A transfer restriction alone does not remove ordinary game access. |
| `hudChrome.housing.terms.webLimits` | Availability depends on the supported territory and account checks shown by the service. We do not promise a buyer, a resale price, uninterrupted trading or a future market value. Review the confirmed price, fees, included contents and applicable Terms before each transaction. |

## Publisher instructions and certificate

These clauses are additions under the existing account, virtual-goods,
payment/refund, community, privacy and termination provisions. Counsel supplies
the exact accepted cross-references and removes conflicts in a signed redline.
No final section number or existing legal conclusion is invented in this draft.
The accepted redline must not undermine the no-time-loss promise through an
unreviewed generic expiry, forfeiture or inactivity clause.

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
assent process, approved distribution subsets, payment/refund schedule digest,
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
