# Merge test resolution

Owned tests only, excluding art/polish tests. No files staged or committed by this agent. No generated files edited. Parent owns execution of deterministic tests, formatting and gates.

## Conflict paths resolved

- tests/ci_workflow.test.ts: unioned both branches' sparse-cone exclusions. Also added the Phase 04 crafted screenshot exclusion as a separate QA finding, below.
- tests/command_schema.test.ts: retained all scanner behavior. Combined pins 231 client sends, 245 dispatch cases, 14 dispatch-only cases require parent test confirmation. Incoming retirement of the Rift enchant sender and addition of the guild roster sender offset on the send axis; the former remains a dispatch tombstone.
- tests/world_api_parity.test.ts: measured the resolved literal directly: 383 unique entries, 105 data, 278 methods. Kept facet-union count checks. Incoming removed enchantRiftItem and added seven methods/data entries; Freeholds adds thirteen independent members. No duplicates.
- tests/deed_i18n.test.ts: 302 names/descriptions and 47 titles. Bramblehide contributes no title; Homesteader contributes one.
- tests/deed_icons.test.ts: 302 catalog deeds, 291 painted, eleven pending. Existing pending-set identity checks retained.
- tests/deeds_content.test.ts: 302 deeds, 3535 Renown; per-category merged additions retained. Parent measured live digest a14bb473b44d75a31072545c0ea3a2f1c294e46852768b19aa32e35f83ce4ece and count/Renown. The common baseline ed507834... remains independently pinned. Added proofs reconstructing BOTH parent catalogs: remove Bramblehide to reproduce Freeholds' 105aaca5...; remove two Homesteader rows to reproduce incoming ec055f18.... This prevents a reminted combined digest concealing either parent's trigger changes.
- tests/deeds_view.test.ts: predicted combined fresh-character visibility 288, category buckets 292, with four feats and ten hidden unearned deeds. Parent verification required.
- tests/helpers/bare_client.ts: retained incoming emptyModifiers import/default; retained Freehold-aware recipeList. Dropped incoming ALL_RECIPES import because the combined helper has no remaining use of it.
- tests/item_compare.test.ts: unioned new sameItemCopy/shouldCompareCopies imports with FURNISHING fixture; kept both branches' cases.
- tests/monolith_budget.test.ts: all six conflicting ceilings lowered to measured newline counts. Each exactly equals ours + incoming - common base and is below BOTH parent file counts. No new headroom, no unexplained ceiling increase. Table below.
- tests/professions_blob_growth.test.ts: composed isolated contributions of the ten crafted furnishings/three manuals, eight vendor furnishings, two Homesteader deeds, field_kit and incoming Bramblehide/Nythgap content. Bramblehide is stripped only after packet content has been isolated so parent contributions cannot contaminate one another. Retained incoming 1548-byte split (35 deeds, 742 discoveries, 771 Reliquary), packet 1255-byte crafted split, 632 vendor bytes, 85 Homesteader bytes, 12 field_kit bytes, and the historical 209474 baseline. Expected combined fixture 213006, band 212626..213007, width unchanged at 381; warn threshold remains 229376. ALL new combined blob figures are predictions pending the parent fixture run, not independently executed measurements.
- tests/profile_page.test.ts: character total 433 predicted from combined catalog, pending parent test.
- tests/reliquary_content.test.ts: combined pins 44 pages, 462 overview, 433 character, 505 slots, 351 distinct item IDs. Both Hearth pages/collections and incoming Bramblehide/Nythgap additions retained. Parent tests must confirm.
- tests/reliquary_i18n.test.ts: 44 page names/descriptions, 88 manifest rows, forty previously covered pages including Bramblehide; preserved M16_NEW_PAGES and crafted-page all-locale name obligation.
- tests/reliquary_state.test.ts: 41 scoring pages (44 minus three existing exclusions) with explicit two-Hearth-page inclusion assertion.

## Monolith measurements

Command was a Python read-only script using git show for merge-base, HEAD and MERGE_HEAD, then Path.read_text().count('\n') for the working tree, the exact countLines idiom used by the test.

| File | Common base | Freeholds | Incoming | Combined pin |
| --- | ---: | ---: | ---: | ---: |
| src/ui/hud.ts | 18677 | 18652 | 18577 | 18552 |
| src/render/renderer.ts | 12989 | 12988 | 12903 | 12902 |
| src/sim/sim.ts | 11983 | 11940 | 11919 | 11876 |
| src/main.ts | 11448 | 11371 | 11385 | 11308 |
| server/game.ts | 10327 | 10271 | 10290 | 10234 |
| src/net/online.ts | 5854 | 5695 | 5788 | 5629 |

The runtime owner confirmed both branches' leaf extractions survive, including Freehold recipe/training/mob/surface bootstrap and upstream ability/threat/client wire leaves. Newline counts independently verify that the net reductions compose without loss.

## Separate compatibility and QA fixes

1. tests/furnishing_rift_admission.test.ts had cleanly merged obsolete enchantRiftItem/rift_enchant_item coverage, old Rift stat expectations and no forge placement. The current API intentionally retires enchant and gates upgrade/socket at a live forge. Updated the test to the two current operations, moved players with the shared moveToRiftForge helper, matched the independently tested band-ladder projection and asserted retired enchant metadata is absent. Preserved named-slot and legacy-id selectors, state/currency/inventory/entity/RNG immutability on furnishing refusal, and positive shell controls through offline Sim and full ClientWorld -> GameServer -> snapshot/events paths. The separate incoming rift_forge_dispatch.test.ts pins the retired tombstone. Parent must run this suite.
2. tests/ci_workflow.test.ts gains /docs/screenshots/freehold-crafted-content-2026-09-07/ in SPARSE_CONE. Parent reproduced omission (25 pass, two failures including unresolved-index duplication), owns repair of the five workflow cones, and will verify after staging. Evidence log: /tmp/freeholds-crafted-qa-ci-cone-before.log.

## Remaining parent verification

Run the resolved test suites and tsc after staging the merge resolution, then apply repository formatting. Counts not explicitly described as measured above need suite confirmation. No conflict markers remain in the owned paths. No tests or gates were run by this agent to avoid duplicating the parent's deterministic execution.

## Follow-up integration fix

Parent reported that the resolved typecheck failed only tests/rift_progression.test.ts:80: spreading the full ItemDef union and adding a rolled-stat record could synthetically create a furnishing with stats. Narrowed the selected shell to actual ring armor before composing the stat projection. Invalid fixture identity now throws explicitly; no ItemDef widening or type assertion. Parent evidence: /tmp/freeholds-crafted-qa-tsc-resolved.log. Parent also reports 22 scoped content suites / 744 tests pass.

## Follow-up authored market coverage and async harness

- Added tests/furnishing_market_catalog.test.ts: thirteen literal authored IDs exercise actual Sim.marketList/marketCancel; ten literal furnishings additionally exercise signer-only marketListInstance/marketCancel. Each checks exactly one new listing, untouched pre-existing listings, inventory conservation including a sentinel stack, removal of the escrow listing on reclaim, and exact signer payload roundtrip. Signed cases also retain a plain same-ID copy to prove correct custody selection. No runtime catalog table supplies the case list and no production data is mutated. Parent owns execution.
- Parent's first merged pin run reported 16/17 files, 709 passed, one skipped, four failures limited to the online Rift harness expecting undefined after commands became Promise<boolean>. Updated the harness to route real commandOutcome frames, require promise-shaped returns and correlation IDs, await false on furnishing refusal and true on the valid shell, and retain event/snapshot assertions. Evidence: /tmp/freeholds-crafted-qa-merge-pins.log. Parent reported typecheck passes following the ring-armor narrowing.
