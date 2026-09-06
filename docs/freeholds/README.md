# Freeholds and Guildhalls: planning packet

Implementation has not started. This packet specifies a free Inn Room, personal
Freeholds and Guildhalls, furnishing and trophy display, visiting, and later housing
depth. The accepted product dispositions belong in state.md; implementation evidence
belongs in progress.md. A complete plan is not evidence that the feature is built or
that an unsigned external release artifact has been accepted.

The input is the [adopted proposal](../prd/woc/freeholds-and-guildhalls-research.md),
its research appendices and the [player deck](../prd/woc/freeholds-and-guildhalls-deck.html).
The nine original rulings and proposal sections 3 and 8 remain mandatory. The final
state decisions D1-D75 record deliberate scope/timing differences and their propagation.
Fernando approved R01-R46 on 2026-09-06; the answered ruling sheet records his exact
words and the final legal/Codex-asset/Codex-image additions D73-D75.

Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
Branch: `feature/freeholds`. The settle-and-polish session stays local: no push,
opened PR or PR merge. Follow [state.md](state.md) "Worktree, base, and merge-forward"
for current facts and the exact dependency protocol, never assume a stale release head.

## Index

| Source | Responsibility |
|---|---|
| [state.md](state.md) | Locked product decisions, actual tree facts, authoritative content numbers, release gates and implementation ledger. |
| [brainstorm.md](brainstorm.md) | Adopted proposal context and recorded dispositions; no competing decision list. |
| [implementation-plan.md](implementation-plan.md) | Workflow, reviewer trigger matrix, money and persistence gates, release and preservation rules. |
| [progress.md](progress.md) | Implementation/QA status, bounded work summaries and exact next-file chain. |
| [qa-checklist.md](qa-checklist.md) | Scoped, whole-wave and final integration evidence. |
| [ux-spec.md](ux-spec.md) | Durable screen/flow/state/input/focus/copy and exact screenshot contract. |
| [ux-key-manifest.json](ux-key-manifest.json) | Exact machine-checkable housing key/source inventory. |
| [ux-shot-manifest.json](ux-shot-manifest.json) | Exact expanded screenshot variants and producing file ownership. |
| [content-manifest.md](content-manifest.md) | Exact content/acquisition/trophy/source inventory and producing work. |
| [content-numbers-workbook.md](content-numbers-workbook.md) | Numerical source, derivation, rounding, measurement, approval and activation evidence. |
| [art-brief.md](art-brief.md) | Room/furniture/trophy reference direction, measured bounds, final model and visual acceptance. |
| [audit-record.md](audit-record.md) | Dated factual audit evidence and source verification; not runtime or external approval. |
| [ruling-sheet.md](ruling-sheet.md) | Answered settlement questions, verbatim dispositions and propagation evidence; adopted on 2026-09-06 with the user's exact response and D27-D75 mapping. |

13a also produces NEW FUTURE `docs/freeholds/upkeep-calendar-db-contract.md` during
implementation: exact reviewed SQL/schema, bounds, locks, budgets and real-PG evidence.
It is a future deliverable, not an existing packet artifact or a current README link.
07 produces NEW FUTURE `docs/freeholds/persistence-rollout-contract.md`; 07b produces
NEW FUTURE `docs/freeholds/lifecycle-policy-binding.md` and
`docs/freeholds/lifecycle-db-contract.md`. These are owned implementation evidence
outputs, also excluded from the current artifact count.

## External handoffs

The following drafts are concrete outputs. Signature/publication/conformance acceptance
remains an explicit production or submission gate; it is never guessed or silently
reported complete. The service owns all prices and token arithmetic.

| Handoff | Producing and validating work |
|---|---|
| [Service contract](../prd/woc/freehold-service-contract.md) | 07a owns durable operations; 15 validates initial quote/authorization/grant/recovery, 20 verifies release evidence; later priced work extends the same catalog. |
| [Counsel memo](../prd/woc/freehold-counsel-memo.md) | 14/15/16 apply the capability/copy contract; 20 requires written housing entitlement/platform acceptance. |
| [Terms amendment](../prd/woc/freehold-terms-amendment.md) | 15/16 prepare the exact accepted product terms; 20 verifies approved publication before enable/submission. |
| [Store listing drafts](../prd/woc/freehold-store-listing-drafts.md) | 14/16 match every allowed and denied surface; 20 verifies the reviewed listing/review-note assemblies. |
| [Optional deed service contract](../prd/woc/freehold-deed-service-contract.md) | 37 verifies service/authority readiness, 38 proves voluntary furnished-sale custody and recovery, 39 verifies release gates. |
| [Territory and authority schedule](../prd/woc/freehold-territory-authority-schedule.md) | 37/38 enforce signed supported territories and explicit per-asset authority; unknown eligibility refuses new operations. |

The current UX inventory has 329 English keys and 330 screenshot variants. Registration
follows functioning producers: 09 starts with 12 room variants, 11 reaches 89, 16 reaches
178, 17 reaches 226, 18 reaches 330; 20 verifies the full set. These derived inventories
are not balance values or evidence that implementation exists.

## Waves and exact chain

The packet has 56 bounded work items and 56 paired QA files: the original 44 numeric
items plus twelve suffixed items. Wave A has 25 pairs, B has 8, C has 9, D has 6 and E has 8.
All 112 implementation/QA status rows are Not started. These are a checked inventory,
not a balance number or an implementation claim. Every implementation has at most five
coherent outputs; acceptance assertions are not extra outputs.

Run each implementation, its paired QA, then the next row. The suffixes are full work
items with their own QA: 07a, 07b, 07c, 08a, 13a, 25a, 28a, 30a, 32a, 41a, 44a and 44b. No item is renumbered.
Wave closes prepare reviewable deliverables after local gates; publishing later requires
separate explicit authorization under state.md. This audit authorizes no publication.

### Wave A: Cottage MVP

| Work item | Implementation | QA |
|---|---|---|
| 01 Foundation | [phase-01-foundation.md](phase-01-foundation.md) | [phase-01-qa.md](phase-01-qa.md) |
| 02 Furnishing item kind | [phase-02-furnishing-item-kind.md](phase-02-furnishing-item-kind.md) | [phase-02-qa.md](phase-02-qa.md) |
| 03 Content: tiers, Charter SKU, ledger schedule, vendor basics | [phase-03-content-tiers-and-basics.md](phase-03-content-tiers-and-basics.md) | [phase-03-qa.md](phase-03-qa.md) |
| 04 Content: crafted furnishings and quartermaster patterns | [phase-04-content-crafted-and-patterns.md](phase-04-content-crafted-and-patterns.md) | [phase-04-qa.md](phase-04-qa.md) |
| 05 Instance claim | [phase-05-instance-claim.md](phase-05-instance-claim.md) | [phase-05-qa.md](phase-05-qa.md) |
| 06 Interiors, the Eastbrook gate, the Hearth Key | [phase-06-interiors-gate-and-hearth-key.md](phase-06-interiors-gate-and-hearth-key.md) | [phase-06-qa.md](phase-06-qa.md) |
| 07 Persistence | [phase-07-persistence.md](phase-07-persistence.md) | [phase-07-qa.md](phase-07-qa.md) |
| 07a Transactional mutations and global claim fencing | [phase-07a-transactional-mutation-boundary.md](phase-07a-transactional-mutation-boundary.md) | [phase-07a-qa.md](phase-07a-qa.md) |
| 07b Account lifecycle and protection history | [phase-07b-account-lifecycle.md](phase-07b-account-lifecycle.md) | [phase-07b-qa.md](phase-07b-qa.md) |
| 07c Account first-tier arrival eligibility | [phase-07c-arrival-eligibility.md](phase-07c-arrival-eligibility.md) | [phase-07c-qa.md](phase-07c-qa.md) |
| 08 Layout core and placement commands | [phase-08-layout-and-placement-sim.md](phase-08-layout-and-placement-sim.md) | [phase-08-qa.md](phase-08-qa.md) |
| 08a Public descriptors and consumer-correct wire state | [phase-08a-descriptor-and-wire.md](phase-08a-descriptor-and-wire.md) | [phase-08a-qa.md](phase-08a-qa.md) |
| 09 Render: furnishing view, light rig, ghost | [phase-09-render-furnishings.md](phase-09-render-furnishings.md) | [phase-09-qa.md](phase-09-qa.md) |
| 10 Furnishing colliders | [phase-10-furnishing-colliders.md](phase-10-furnishing-colliders.md) | [phase-10-qa.md](phase-10-qa.md) |
| 11 Build mode UI | [phase-11-build-mode-ui.md](phase-11-build-mode-ui.md) | [phase-11-qa.md](phase-11-qa.md) |
| 12 Strongbox and station amenities | [phase-12-strongbox-and-station.md](phase-12-strongbox-and-station.md) | [phase-12-qa.md](phase-12-qa.md) |
| 13 Condition and the Steward's Ledger core | [phase-13-condition-and-ledger-core.md](phase-13-condition-and-ledger-core.md) | [phase-13-qa.md](phase-13-qa.md) |
| 13a Authoritative upkeep calendar | [phase-13a-authoritative-upkeep-calendar.md](phase-13a-authoritative-upkeep-calendar.md) | [phase-13a-qa.md](phase-13a-qa.md) |
| 14 Distribution surface map | [phase-14-distribution-surface-map.md](phase-14-distribution-surface-map.md) | [phase-14-qa.md](phase-14-qa.md) |
| 15 Claudium: the Freehold Charter and the Master Builder's Call | [phase-15-claudium-charter-and-call.md](phase-15-claudium-charter-and-call.md) | [phase-15-qa.md](phase-15-qa.md) |
| 16 Steward panel and store surfaces | [phase-16-steward-panel-and-store-surfaces.md](phase-16-steward-panel-and-store-surfaces.md) | [phase-16-qa.md](phase-16-qa.md) |
| 17 Trophies | [phase-17-trophies.md](phase-17-trophies.md) | [phase-17-qa.md](phase-17-qa.md) |
| 18 Visiting | [phase-18-visiting.md](phase-18-visiting.md) | [phase-18-qa.md](phase-18-qa.md) |
| 19 Art batch | [phase-19-art-batch.md](phase-19-art-batch.md) | [phase-19-qa.md](phase-19-qa.md) |
| 20 Wave A close | [phase-20-wave-a-close.md](phase-20-wave-a-close.md) | [phase-20-qa.md](phase-20-qa.md) |

### Wave B: Lodge, furnishings and visiting

| Work item | Implementation | QA |
|---|---|---|
| 21 Lodge tier and the upgrade build project | [phase-21-lodge-tier-and-upgrade.md](phase-21-lodge-tier-and-upgrade.md) | [phase-21-qa.md](phase-21-qa.md) |
| 22 Furnishings across all ten crafts and the R8 pattern channels | [phase-22-furnishings-all-crafts.md](phase-22-furnishings-all-crafts.md) | [phase-22-qa.md](phase-22-qa.md) |
| 23 Legend Stand and the remaining trophy families | [phase-23-legend-stand-and-trophy-families.md](phase-23-legend-stand-and-trophy-families.md) | [phase-23-qa.md](phase-23-qa.md) |
| 24 Kitchen Garden tableau | [phase-24-kitchen-garden-tableau.md](phase-24-kitchen-garden-tableau.md) | [phase-24-qa.md](phase-24-qa.md) |
| 25 Build mode v2 | [phase-25-build-mode-v2.md](phase-25-build-mode-v2.md) | [phase-25-qa.md](phase-25-qa.md) |
| 25a Twelve-week prepay and the Fenbridge gate | [phase-25a-prepay-and-fenbridge-gate.md](phase-25a-prepay-and-fenbridge-gate.md) | [phase-25a-qa.md](phase-25a-qa.md) |
| 26 Open-house visiting | [phase-26-open-house-visiting.md](phase-26-open-house-visiting.md) | [phase-26-qa.md](phase-26-qa.md) |
| 27 Wave B close | [phase-27-wave-b-close.md](phase-27-wave-b-close.md) | [phase-27-qa.md](phase-27-qa.md) |

### Wave C: Guildhalls

| Work item | Implementation | QA |
|---|---|---|
| 28 The guild owner kind, the Meeting Hall, the Hall Fund | [phase-28-guild-owner-kind-and-hall-fund.md](phase-28-guild-owner-kind-and-hall-fund.md) | [phase-28-qa.md](phase-28-qa.md) |
| 28a Guild lifecycle and membership evidence | [phase-28a-guild-lifecycle-and-membership.md](phase-28a-guild-lifecycle-and-membership.md) | [phase-28a-qa.md](phase-28a-qa.md) |
| 29 Guildhall purchase and upkeep | [phase-29-guildhall-purchase-and-upkeep.md](phase-29-guildhall-purchase-and-upkeep.md) | [phase-29-qa.md](phase-29-qa.md) |
| 30 Hall amenities | [phase-30-hall-amenities.md](phase-30-hall-amenities.md) | [phase-30-qa.md](phase-30-qa.md) |
| 30a Hall boards | [phase-30a-hall-boards.md](phase-30a-hall-boards.md) | [phase-30a-qa.md](phase-30a-qa.md) |
| 31 Guild-level deeds and first-kill trophies | [phase-31-guild-deeds-and-first-kill-trophies.md](phase-31-guild-deeds-and-first-kill-trophies.md) | [phase-31-qa.md](phase-31-qa.md) |
| 32 Great Hall, Manor, Bastion tiers and build projects | [phase-32-hall-and-manor-tiers.md](phase-32-hall-and-manor-tiers.md) | [phase-32-qa.md](phase-32-qa.md) |
| 32a Project rewards and direct vault access | [phase-32a-project-rewards-and-vault.md](phase-32a-project-rewards-and-vault.md) | [phase-32a-qa.md](phase-32a-qa.md) |
| 33 Wave C close | [phase-33-wave-c-close.md](phase-33-wave-c-close.md) | [phase-33-qa.md](phase-33-qa.md) |

### Wave D: Wards and optional Charters

| Work item | Implementation | QA |
|---|---|---|
| 34 Wards: shared neighborhoods and exteriors | [phase-34-wards.md](phase-34-wards.md) | [phase-34-qa.md](phase-34-qa.md) |
| 35 Ward favor and Endeavors | [phase-35-ward-favor-and-endeavors.md](phase-35-ward-favor-and-endeavors.md) | [phase-35-qa.md](phase-35-qa.md) |
| 36 Showcases and guest books | [phase-36-showcases-and-guest-books.md](phase-36-showcases-and-guest-books.md) | [phase-36-qa.md](phase-36-qa.md) |
| 37 On-chain Freehold Charter: service contract, ledger table, geo-exclusion | [phase-37-charter-service-contract.md](phase-37-charter-service-contract.md) | [phase-37-qa.md](phase-37-qa.md) |
| 38 Charter mint surface and marketplace trading (web only) | [phase-38-charter-mint-and-trading.md](phase-38-charter-mint-and-trading.md) | [phase-38-qa.md](phase-38-qa.md) |
| 39 Wave D close | [phase-39-wave-d-close.md](phase-39-wave-d-close.md) | [phase-39-qa.md](phase-39-qa.md) |

### Wave E: Housing depth and program close

| Work item | Implementation | QA |
|---|---|---|
| 40 Keep and Citadel tiers, prestige deeds | [phase-40-keep-and-citadel-tiers.md](phase-40-keep-and-citadel-tiers.md) | [phase-40-qa.md](phase-40-qa.md) |
| 41 Dye station | [phase-41-dye-station-and-layout-sharing.md](phase-41-dye-station-and-layout-sharing.md) | [phase-41-qa.md](phase-41-qa.md) |
| 41a Layout saves and public sharing | [phase-41a-layout-save-and-sharing.md](phase-41a-layout-save-and-sharing.md) | [phase-41a-qa.md](phase-41a-qa.md) |
| 42 Second freehold SKU | [phase-42-second-freehold-sku.md](phase-42-second-freehold-sku.md) | [phase-42-qa.md](phase-42-qa.md) |
| 43 Existing-craft coverage and future expansion handoff | [phase-43-carpenter-and-mason.md](phase-43-carpenter-and-mason.md) | [phase-43-qa.md](phase-43-qa.md) |
| 44 Wave E integration close | [phase-44-wave-e-close.md](phase-44-wave-e-close.md) | [phase-44-qa.md](phase-44-qa.md) |
| 44a Final Codex artwork | [phase-44a-final-codex-artwork.md](phase-44a-final-codex-artwork.md) | [phase-44a-qa.md](phase-44a-qa.md) |
| 44b Final legal revisit and handoff | [phase-44b-final-legal-handoff.md](phase-44b-final-legal-handoff.md) | [phase-44b-qa.md](phase-44b-qa.md) |

## How to start

The next implementation file is [phase-01-foundation.md](phase-01-foundation.md):
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-01-foundation.md`.
Paste its starter prompt into a fresh session in the packet worktree after the packet
checks/reviews are complete. The product rulings are already approved; nothing is built. Each STEP 7 names the full next path.
The final 44b QA ends the program after 44a Codex artwork and 44b legal handoff;
completion does not authorize teardown or a remote action.

## Invariants and preservation

Housing grants cosmetic, convenience and access features, never combat/progression/drop
power. Existing feast behavior remains unchanged. Low condition never repossesses a home,
removes owned furnishings/trophy records or prevents entry/decoration by itself; actual
independent admission and service-specific amenity restrictions still apply.

Use the exact names and English hudChrome.housing.* strings in ux-spec, with shared
item/entity/API namespaces only where their existing sinks require them. The Book of
Deeds remains ordinary gameplay vocabulary. Denied storefronts have no housing purchase
or on-chain-deed submodel, including hidden DOM, handlers, fetched catalogs, errors and
accessible text. Website management is independently approved. The game server remains
unaware of distribution; the service verifies opaque purpose-bound authorization.

ux-spec, decisions, the answered ruling sheet, content/numeric/art manifests, audit and service/counsel/Terms/listing/
territory artifacts remain durable source material. Any future authorized scaffolding
cleanup must first preserve them, prove incoming links and content/anchor equivalence,
receive independent review, and obtain approval of the exact remaining deletion diff.
The 43 handoff excludes new professions from this packet; it does not keep a conditional
Carpenter/Mason implementation promise alive.
