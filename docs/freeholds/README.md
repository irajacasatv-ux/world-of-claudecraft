# Freeholds and Guildhalls: planning packet

Player and guild housing as the flagship $WOC utility. Instanced personal plots
(Freeholds) and guild plots (Guildhalls) built as ONE sim module with two owner kinds,
bought as a Claudium-priced server entitlement (a Freehold Charter), kept up through a
weekly Steward's Ledger of low-tier materials and farm produce, decorated with
profession-made furnishings and auto-granted trophies, and, on the web only and only
after counsel signs off, minted on demand as an on-chain Freehold Charter.

The proposal is the input, not something this packet re-derives:
`docs/prd/woc/freeholds-and-guildhalls-research.md` (rulings adopted 2026-09-05, all nine
locked; section 13 is the Cottage MVP slice; section 14 the roadmap; section 11 the
engineering blueprint; section 8 the store-safe rules; section 3 the PR #3872 constraints)
plus its six appendices under `docs/prd/woc/housing-research/` and the player deck
`docs/prd/woc/freeholds-and-guildhalls-deck.html`.

Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch
`feature/freeholds`, based on the head of open PR #3872 (`feature/masterwrought`, itself on
`release/v0.42.0`). The branch stays LOCAL until Fernando says to push. `state.md` carries
the merge-forward rule.

## Index
- [brainstorm.md](brainstorm.md): what the proposal locked, what the codebase survey added
  (the decisions D1 to D14), the reuse map, new work, OPEN items and policy gates.
- [implementation-plan.md](implementation-plan.md): the canonical workflow, the review
  dispatch rules (the packet's ONE copy), the PR cadence per wave, the phase summary table.
- [progress.md](progress.md): status table (implementation and QA rows) plus per-phase
  deliverable and acceptance checklists (the per-phase spec every phase file expands).
- [state.md](state.md): the cross-phase cheat sheet: worktree, base, dependency PR and the
  merge-forward rule, locked decisions D15 to D26, non-negotiables, the validation matrix,
  seams and names, working numbers, per-phase ledgers, OPEN items, policy gates, gotchas.
- [qa-checklist.md](qa-checklist.md): the whole-feature integration matrix, run at every
  wave close and once at packet completion.
- Phase files, each self-contained (paste the starter prompt into a fresh session inside
  the packet worktree). Strict order: a phase, then its QA, then the next phase.

## Waves and phases
Every wave ends with a close phase that runs the integration matrix and opens that wave's
PR off the base branch (flag default off). Waves are sequential; a wave never starts until
the previous wave's close QA has passed.

### Wave A: the Cottage MVP (section 13), playable end to end on every host and every store build
| Phase | Files |
|---|---|
| 01 Facet, sim module skeleton, feature flag, RL exclusion | [phase-01-foundation.md](phase-01-foundation.md), [phase-01-qa.md](phase-01-qa.md) |
| 02 The `furnishing` item kind | [phase-02-furnishing-item-kind.md](phase-02-furnishing-item-kind.md), [phase-02-qa.md](phase-02-qa.md) |
| 03 Content: tiers, Charter SKU, ledger schedule, vendor basics | [phase-03-content-tiers-and-basics.md](phase-03-content-tiers-and-basics.md), [phase-03-qa.md](phase-03-qa.md) |
| 04 Content: crafted furnishings and quartermaster patterns | [phase-04-content-crafted-and-patterns.md](phase-04-content-crafted-and-patterns.md), [phase-04-qa.md](phase-04-qa.md) |
| 05 Instance claim (owner-keyed) | [phase-05-instance-claim.md](phase-05-instance-claim.md), [phase-05-qa.md](phase-05-qa.md) |
| 06 Interiors, the Eastbrook gate, the Hearth Key | [phase-06-interiors-gate-and-hearth-key.md](phase-06-interiors-gate-and-hearth-key.md), [phase-06-qa.md](phase-06-qa.md) |
| 07 Persistence | [phase-07-persistence.md](phase-07-persistence.md), [phase-07-qa.md](phase-07-qa.md) |
| 08 Layout core and placement commands | [phase-08-layout-and-placement-sim.md](phase-08-layout-and-placement-sim.md), [phase-08-qa.md](phase-08-qa.md) |
| 09 Render: furnishing view, light rig, ghost | [phase-09-render-furnishings.md](phase-09-render-furnishings.md), [phase-09-qa.md](phase-09-qa.md) |
| 10 Furnishing colliders | [phase-10-furnishing-colliders.md](phase-10-furnishing-colliders.md), [phase-10-qa.md](phase-10-qa.md) |
| 11 Build mode UI | [phase-11-build-mode-ui.md](phase-11-build-mode-ui.md), [phase-11-qa.md](phase-11-qa.md) |
| 12 Strongbox and station amenities | [phase-12-strongbox-and-station.md](phase-12-strongbox-and-station.md), [phase-12-qa.md](phase-12-qa.md) |
| 13 Condition and the Steward's Ledger core | [phase-13-condition-and-ledger-core.md](phase-13-condition-and-ledger-core.md), [phase-13-qa.md](phase-13-qa.md) |
| 14 Distribution surface map | [phase-14-distribution-surface-map.md](phase-14-distribution-surface-map.md), [phase-14-qa.md](phase-14-qa.md) |
| 15 Claudium: the Freehold Charter and the Master Builder's Call | [phase-15-claudium-charter-and-call.md](phase-15-claudium-charter-and-call.md), [phase-15-qa.md](phase-15-qa.md) |
| 16 Steward panel and store surfaces | [phase-16-steward-panel-and-store-surfaces.md](phase-16-steward-panel-and-store-surfaces.md), [phase-16-qa.md](phase-16-qa.md) |
| 17 Trophies | [phase-17-trophies.md](phase-17-trophies.md), [phase-17-qa.md](phase-17-qa.md) |
| 18 Visiting | [phase-18-visiting.md](phase-18-visiting.md), [phase-18-qa.md](phase-18-qa.md) |
| 19 Art batch (furnishing and trophy models) | [phase-19-art-batch.md](phase-19-art-batch.md), [phase-19-qa.md](phase-19-qa.md) |
| 20 Wave A close: integration, screenshots, the MVP PR | [phase-20-wave-a-close.md](phase-20-wave-a-close.md), [phase-20-qa.md](phase-20-qa.md) |

### Wave B: the Lodge tier and the rest of the first wave (section 14, item 2)
| Phase | Files |
|---|---|
| 21 Lodge tier and the upgrade build project | [phase-21-lodge-tier-and-upgrade.md](phase-21-lodge-tier-and-upgrade.md), [phase-21-qa.md](phase-21-qa.md) |
| 22 Furnishings across all ten crafts and the R8 pattern channels | [phase-22-furnishings-all-crafts.md](phase-22-furnishings-all-crafts.md), [phase-22-qa.md](phase-22-qa.md) |
| 23 Legend Stand and the remaining trophy families | [phase-23-legend-stand-and-trophy-families.md](phase-23-legend-stand-and-trophy-families.md), [phase-23-qa.md](phase-23-qa.md) |
| 24 Kitchen Garden tableau | [phase-24-kitchen-garden-tableau.md](phase-24-kitchen-garden-tableau.md), [phase-24-qa.md](phase-24-qa.md) |
| 25 Build mode v2: surface snapping, redo, twelve-week prepay, Fenbridge gate | [phase-25-build-mode-v2.md](phase-25-build-mode-v2.md), [phase-25-qa.md](phase-25-qa.md) |
| 26 Open-house visiting | [phase-26-open-house-visiting.md](phase-26-open-house-visiting.md), [phase-26-qa.md](phase-26-qa.md) |
| 27 Wave B close | [phase-27-wave-b-close.md](phase-27-wave-b-close.md), [phase-27-qa.md](phase-27-qa.md) |

### Wave C: Guildhalls (section 14, item 3)
| Phase | Files |
|---|---|
| 28 The guild owner kind, the Meeting Hall, the Hall Fund | [phase-28-guild-owner-kind-and-hall-fund.md](phase-28-guild-owner-kind-and-hall-fund.md), [phase-28-qa.md](phase-28-qa.md) |
| 29 Guildhall purchase and upkeep | [phase-29-guildhall-purchase-and-upkeep.md](phase-29-guildhall-purchase-and-upkeep.md), [phase-29-qa.md](phase-29-qa.md) |
| 30 Hall amenities: guild bank chest, feast hall, shared stations, boards | [phase-30-hall-amenities.md](phase-30-hall-amenities.md), [phase-30-qa.md](phase-30-qa.md) |
| 31 Guild-level deeds and first-kill trophies | [phase-31-guild-deeds-and-first-kill-trophies.md](phase-31-guild-deeds-and-first-kill-trophies.md), [phase-31-qa.md](phase-31-qa.md) |
| 32 Great Hall, Manor, Bastion tiers and build projects | [phase-32-hall-and-manor-tiers.md](phase-32-hall-and-manor-tiers.md), [phase-32-qa.md](phase-32-qa.md) |
| 33 Wave C close | [phase-33-wave-c-close.md](phase-33-wave-c-close.md), [phase-33-qa.md](phase-33-qa.md) |

### Wave D: Wards and Charters (section 14, item 4)
| Phase | Files |
|---|---|
| 34 Wards: shared neighborhoods and exteriors | [phase-34-wards.md](phase-34-wards.md), [phase-34-qa.md](phase-34-qa.md) |
| 35 Ward favor and Endeavors | [phase-35-ward-favor-and-endeavors.md](phase-35-ward-favor-and-endeavors.md), [phase-35-qa.md](phase-35-qa.md) |
| 36 Showcases and guest books | [phase-36-showcases-and-guest-books.md](phase-36-showcases-and-guest-books.md), [phase-36-qa.md](phase-36-qa.md) |
| 37 On-chain Freehold Charter: service contract, ledger table, geo-exclusion | [phase-37-charter-service-contract.md](phase-37-charter-service-contract.md), [phase-37-qa.md](phase-37-qa.md) |
| 38 Charter mint surface and marketplace trading (web only) | [phase-38-charter-mint-and-trading.md](phase-38-charter-mint-and-trading.md), [phase-38-qa.md](phase-38-qa.md) |
| 39 Wave D close | [phase-39-wave-d-close.md](phase-39-wave-d-close.md), [phase-39-qa.md](phase-39-qa.md) |

### Wave E: depth (section 14, item 5)
| Phase | Files |
|---|---|
| 40 Keep and Citadel tiers, prestige deeds | [phase-40-keep-and-citadel-tiers.md](phase-40-keep-and-citadel-tiers.md), [phase-40-qa.md](phase-40-qa.md) |
| 41 Dye station and layout sharing | [phase-41-dye-station-and-layout-sharing.md](phase-41-dye-station-and-layout-sharing.md), [phase-41-qa.md](phase-41-qa.md) |
| 42 Second freehold SKU | [phase-42-second-freehold-sku.md](phase-42-second-freehold-sku.md), [phase-42-qa.md](phase-42-qa.md) |
| 43 Carpenter and Mason (conditional on furnishing demand and a ruling) | [phase-43-carpenter-and-mason.md](phase-43-carpenter-and-mason.md), [phase-43-qa.md](phase-43-qa.md) |
| 44 Wave E close: final matrix, packet teardown offer, PR | [phase-44-wave-e-close.md](phase-44-wave-e-close.md), [phase-44-qa.md](phase-44-qa.md) |

## How to start
Paste the starter prompt from `phase-01-foundation.md` into a fresh Claude Code session
whose working directory is the packet worktree. Every phase and QA ends by naming the next
file to run; follow that chain. Never start phase N+1 before `phase-N-qa.md` has run and
recorded a verdict in `progress.md`.

## Rules that never relax
- The word "phase" appears in this directory only; never in code, comments, commit
  messages, or PR text.
- Vocabulary is fixed (ruling 9 plus the deck): Freehold, Guildhall, Freehold Charter,
  Steward's Ledger, Master Builder's Call, Hearth Key, Wards, Inn Room, Legend Stand.
  Never "real estate", never "house level", never "rent".
- No on-chain vocabulary inside `src/sim/` (the token firewall: wallet, token, $WOC, mint,
  holder, marketplace, on-chain, Solana, the on-chain Charter deed); the Book of Deeds is
  game content, not firewall vocabulary. A purchased effect arrives as a server-applied
  grant after the economy service confirms.
- Nothing purchasable changes a number in combat, progression, or drops. Trophies are
  earned, never sold. Nothing is ever repossessed or destroyed.
- The branch stays local until Fernando says to push; pushes go to `origin`, never a fork;
  a PR is never merged by a session.
