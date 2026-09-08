# Crafted furnishings and quartermaster patterns: STEP 2 hygiene coverage

Read-only reviewer: packet_explore. Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`. Original implementation reviewed at `49ed3f09333f4f1293edda9a98fe590c5651c20e..3666d89647609bef4fb98ed5eab0bb4b6e1cfefa`. Merge integration observed separately against `origin/feature/masterwrought` at `54ce808436`. No repository edits, asset generation, test runs, gates, staging, or commits performed by this reviewer. Local `/tmp` report/evidence files are the only writes.

Parent owns deterministic commands and final integration. This report records all findings, low-confidence concerns, refutations, and observed repairs. Current worktree continued changing while inspected; this is not a certification of the final integrated tree. Earlier conflicts were not treated as defects; latest read showed zero unresolved paths.

## Findings and adjudication

| ID | Priority | Confidence | Original location | Finding and implication | Current disposition |
|---|---|---|---|---|---|
| H1 | P2 | High | `.github/workflows/ci.yml:638`, also 863,970,1267,1372; `tests/ci_workflow.test.ts:332` | New tracked crafted runtime screenshot subtree is missing from all five sparse cones and the literal `SPARSE_CONE`. The reference-corpus guard includes JSON and Markdown outside screenshots, so accepted-art and planning/validation references make this a required cone entry even without a unit test opening the PNGs. The set equality at original test line549 fails. | Parent repaired all five current workflow entries at639,867,977,1277,1385 and literal current333. Observed the exact entry in every location. Parent must run the relevant gate/test; this reviewer did not. |
| H2 | P3 | High for missing hash consumers, medium for necessity judgment | `biome.json:129`, `biome.json:130`; `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-fresh-fix.md:32` | Eight explicit formatter exclusions are justified as preserving already hash-linked bytes, but accepted-art and naming-originality have no exact byte-hash consumer anywhere at original tip. Six exclusions are clearly necessary; these two have no demonstrated immutable-byte need. The review statement that all eight are hash-linked is inaccurate. | Open hygiene decision: remove the two unneeded exclusions and format those two files, or document an actual existing immutable-byte requirement. Do not invent a new seal simply to justify ignoring formatting. The overrides disable formatting only, not lint or tests. |
| H3 | P3 | High | `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-sim.md:3`; `implementation-parity.md:3` | Authoritative review transcriptions contain dozens of collapsed words, including `tobase49ed3f`, `leafimports`, `onceperjoin/resume`, `logs87craftingtests+51consumer tests`, `bothdirections`, `personaltrainresult/anchorwire`. These impede checking evidence and make the independent-review receipt difficult to read. | Open. Normalize word spacing without rewriting the reviewers' conclusions or inventing proof. |
| H4 | P3 | High | `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-persistence.md:3`; `implementation-authority.md:4` | Persistence receipt still says final shared gate pending, with no final closure. Authority receipt still says fresh review pending; its later coordinator gate closure does not explicitly mark fresh independent review complete. Implementation-validation line46 claims all reviews/findings complete. Historical states are useful but final-state attribution is unclear. | Open. Preserve historical observations and add an explicit final status referencing existing actual evidence, distinguishing coordinator closure from independent fresh review. |
| H5 | P3 | High | `src/sim/professions/CLAUDE.md:201`; `src/sim/professions/training.ts:4`; `src/sim/freehold/CLAUDE.md:90` | Source seam documentation did not follow extraction: profession module map lacks new `train_recipe.ts` and `recipe_visibility.ts`; training header still assigns mutation to `Sim.trainRecipe`; freehold guide still calls sim.ts the runtime consumer, despite crafting/UI consumers. This can direct later work back into the coordinator or conceal the availability seam. | Open, subject to parent's user freeze/D85 reconciliation. Update docs to actual owners, no speculative runtime changes needed. |
| H6 | Refuted | High | `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/capture.mjs:4`, `capture-mobile.mjs:4`, `capture-guide-prose.mjs:4`, `vite.config.mjs:1` | Initial suspicion: direct execution from committed paths fails because imports resolve under a nonexistent screenshot scripts folder. Deeper trace found `runtime/manifest.json::reproduction.instructions` already explicitly stages the three scripts and config into root tmp with names preserved, where every relative import resolves properly. | Refuted and promptly retracted to parent. No new README or script mutation needed. Keep sealed originals. |
| H7 | P3 inherited | High | Current `src/ui/i18n.locales/ru_RU.ts:8441,8483,11199,15507` plus generated counterparts | Four upstream Nythraxis translations contain em dashes. Every exact line exists in `origin/feature/masterwrought`; none is introduced by original furnishings range. Root no-dash convention applies broadly, but attribution is upstream integration rather than this content implementation. | Reported for completeness. Parent determines integration scope. Any fix should edit locale source then regenerate, never hand-edit resolved bundles. |

No confirmed runtime dead-code defect found. No confirmed architecture dependency inversion, orphan icon, unauthorized original locale write, or pattern Reliquary membership found.

## Sparse-checkout proof for H1

Original `tests/ci_workflow.test.ts:306` starts the screenshot-subtree contract. It derives tracked screenshot directories from the index and parses all tracked reference-carrying `.ts`, `.mts`, `.cts`, `.tsx`, `.mjs`, `.cjs`, `.js`, `.json`, and `.md` files outside `docs/screenshots`. Lines507 to511 establish this corpus; lines537 to540 inspect references matching `docs/screenshots/<subtree>`; lines544 to549 require exact set equality against the sparse cone.

`docs/freeholds/crafted-content-art-2026-09-07/items.accepted-art.json::review.runtime.manifest` references the new subtree, as do state/progress and implementation-validation. It is tracked at original tip. Therefore the new path must appear in every one of the five equivalent sparse cones and their test literal.

`tests/freehold_crafted_art.test.ts` reads accepted-art, sealed source v2, prior v1, review sheets and shipping WebPs. Its AcceptedRecord type does not validate runtime manifest/capture hashes and it does not directly open the runtime PNG files. This does not remove the cone requirement: the workflow test deliberately uses a broader tracked reference corpus. The file-read trace proves the requirement without running a test.

Current repair was observed by `rg`: exactly five workflow entries and one SPARSE_CONE literal. Parent verification remains necessary.

## Exact formatter-exclusion evidence

Every byte count and SHA below was recomputed directly from `git show 3666d89647:<path>`. Exact SHA consumers were discovered via complete-tree `git grep -l -F <sha> 3666d89647 --`. Full references retained in `/tmp/freeholds-crafted-hygiene-hash-overrides.json`.

| File (under docs/freeholds) | Bytes | SHA-256 | Exact byte-hash references | Assessment |
|---|---:|---|---:|---|
| `crafted-content-art-2026-09-07/items.accepted-art.json` | 17324 | `d94d41fc39a3e51bd87c9b4428b9ee3cb8e7b05b21aec9a689343f4acfd8d18d` | 0 | No demonstrated need for byte-preserving formatter exclusion. Its child paths/hashes are values that formatting preserves. |
| `crafted-content-art-2026-09-07/naming-originality.json` | 11746 | `c049f4dcf4c2906bdf9769f732e8686aeadcb69038427fba20e97cbd66731de6` | 0 | No demonstrated need for byte-preserving formatter exclusion. |
| `crafted-content-art-2026-09-07/staged-art-v2.json` | 70685 | `c9e46f0c5752513c11a0245800c02df872c57292a033eeabc4d940a5fc86875f` | 5 | Necessary: accepted source record and tests pin exact original bytes. |
| `crafted-content-art-2026-09-07/staged-art.json` | 66558 | `c2173d933b1741f813639f3dd2d9aa87e28f9b03297687901e6ca2a4ed846a0c` | 2 | Necessary: v2 lineage and test pin retain historical source bytes. |
| `crafted-content-trial-2026-09-07/calibration.json` | 27928 | `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b` | 8 | Necessary: signed acceptance/calibration consumers. |
| `crafted-content-trial-2026-09-07/geometry-measurements.json` | 75312 | `c340590e9b89415432f7c0712dacfea273486d3cc42b20900f1ae0004336a8c8` | 3 | Necessary: signed calibration and geometry review/validation lineage. |
| `crafted-content-trial-2026-09-07/geometry-proposal.json` | 8417 | `d944116ea84fedc226635cb74fa5c6dadccca531622439f8b47e84e2d2e6825f` | 4 | Necessary: geometry and calibration chain. |
| `crafted-content-trial-2026-09-07/economy-measurements.json` | 1925504 | `8e7a10f6b5f1e073c1652fe4819a0c16a8f44071e1f8b1649c2d70afa4f8e64e` | 1 | Necessary: calibration links full measured source bytes. |

## Coverage of dead code, architecture, language and generated output

The entire original diff was retained in `/tmp/freeholds-crafted-implementation-full.diff` and its 232-file inventory is in the exploration report. Original added source lines were scanned with exact added-line tracking, rather than scanning all inherited source and attributing it to the packet.

| Surface | Result and scope |
|---|---|
| Unused imports | Lexical identifier-occurrence scan of changed original `.ts`, `.tsx`, `.mjs`, `.cjs`, `.js` files found no import identifier referenced only in its import. This is heuristic evidence, not a replacement for parent TypeScript/Biome checks. |
| Unused exports | New runtime exports `isFreeholdCraftAvailable`, `recipesForFreeholdAvailability`, `trainRecipe`, `buildWorldHello`, `anchorFields`, `craftingWindowRefreshSig`, `buildHeroicVendorViewForWorld` each have actual consumers. `HEROIC_VENDOR_STOCK` remains directly consumed by HUD selection logic; it is not a dead import after adding the world-aware builder. |
| Stand-in catalog | Consumed by tests and declared as approved later renderer/placement input. It is data scheduled for a later implementation packet, not an abandoned runtime branch. No removal recommendation. |
| Temporary/debug code | Original added lines had zero TODO/FIXME/XXX/debugger/focused `.only(` hits. |
| Sim architecture | Original sim additions have no DOM/window/render/ui/net/game/Three imports and no Math.random, Date.now, performance.now introduction. Dependencies remain pure leaf modules or approved barrels. Detailed behavioral judgment belongs to sim/correctness reviewers. |
| Banned product vocabulary | Original added code/comments and relevant JSON had zero word-boundary phase/rent/real estate hits. Planning document phase labels are expected workflow descriptions and not game vocabulary. |
| Typography | Original added code/comments/JSON and four full commit messages had no em dashes, en dashes, or emoji in the scan. Commit messages use scoped Conventional Commit subjects and meaningful bodies. No complete historical-document typography claim is made. |
| Generated source | Original generated changes match source content shape: item/recipe/reliquary catalogs, five locale values and guide outputs. No direct evidence of hand editing. A diff cannot establish historical generation procedure or freshness; parent regeneration and no-diff evidence are still required. |
| Locale policy | Original global locale writes only touch allowed `zh_CN`, `zh_TW`, `ja_JP`, `ko_KR`, `ru_RU`, with 13 new item names and two relevant guide prose values. These are the documented M16 exception. Separate Reliquary dictionaries add required shelf/page names and prose. No unauthorized original generic locale fill discovered. |
| Reliquary membership | None of the three literal pattern IDs occurs in original Reliquary content; ten furnishing outputs belong to ordinary profession discovery rows. |

Machine snapshots: `/tmp/freeholds-crafted-hygiene-scan.json` (empty original hit list), `/tmp/freeholds-crafted-hygiene-merge-scan.json` (separately attributed merge hits). The merge scan is limited to original owned paths, not a second whole-upstream release audit.

## Art, ownership, provenance and runtime evidence

All thirteen shipping WebPs were checked against original accepted metadata with exact bytes/hashes, each unique, opaque128px, total33156 bytes. Mapping assigns each exactly once to `freehold-crafted-2026-09-07`. Seven current/historical review sheets are explicitly referenced with hashes, not unreferenced orphans. Original/master intermediates under ignored tmp are retained as lineage metadata; not falsely claimed committed shipping assets.

The thirteen IDs are `freehold_weapon_rack`, `freehold_iron_brazier`, `freehold_patchwork_rug`, `freehold_hide_armchair`, `freehold_clockwork_lamp`, `freehold_glass_floor_lamp`, `freehold_chart_easel`, `freehold_jewel_floor_lamp`, `freehold_set_supper_table`, `freehold_glow_lantern`, `pattern_freehold_clockwork_lamp`, `pattern_freehold_chart_easel`, and `pattern_freehold_jewel_floor_lamp`.

Original accepted source declares executionHarness Codex, built-in OpenAI image generation, eighteen calls with five corrections, sealed v1/v2 source, canonical conversion receipts, reviewed current paintings. No asset was generated or edited during this audit.

Runtime manifest SHA is `09ab384da4112f60b75cf8ebff986451dad6fda709fef158dda160713c653832`,143845 bytes. It retains42 accepted captures:16 desktop,22 corrected mobile,2 guide catalogs,2 guide prose. It explicitly rejects earlier attempts and the original mobile set. Fixture grants of ten output items are presentation setup, while three pattern purchases use real Quartermaster buttons and48 Marks. No mail was sent, and no hardware LOW/final placement/GLB approval is claimed.

The manifest already documents copying three capture scripts and vite.config into root tmp before running them. Root-relative tmp makes ../scripts and ../vite.config.ts correct. The temp config uses127.0.0.1:5185 and disables HMR/watch only. Ordinary stock offline configuration at `src/game/offline_world_config.ts:20` enables Freeholds when no custom world is supplied; no VITE_FREEHOLDS_ENABLED env setting is required. Script order is desktop, corrected mobile, guide prose. The final manifest is a curated union, not every output from each historical run. No change to sealed scripts is justified by H6.

## Original versus merge candidate

The original content scan had zero relevant banned-language hits. A separate current-worktree diff against3666d89647 found existing upstream comments in server/game.ts about earlier implementation phases, a historical accepted-art narrative in tests/item_art_consistency.test.ts, and a phase18 comment in tests/reliquary_content.test.ts. All exact strings were verified in origin/feature/masterwrought. They are not this packet's product-language defects.

The four Russian Nythraxis em-dash values and generated mirrors also exactly match upstream. These remain reported as inherited convention violations (H7), with explicit provenance and no accusation of unauthorized new locale work by the furnishing implementation.

No final freshness claim is made while parent merge workers and QA fixes continue. Parent must run the shared commands once, and final content/QA reviewers must examine the completed candidate.

## Corrections to exploration evidence

`/tmp/freeholds-crafted-qa-explore.md` previously overstated original real-item listing coverage in its thirteen-ID obligations table. Corrected: original furnishing_item_kind listing assertions are synthetic fixtures, not a real thirteen-ID cohort. Parent worker is adding true real-ID coverage. Tradability is still supported by item policy/content; original end-to-end listing proof is not claimed.

The initial direct-path reproduction-script suspicion was sent as P2 before manifest instructions were fully inspected, then explicitly retracted. H6 records the evidence and refutation so it cannot accidentally return as a blocking finding.
