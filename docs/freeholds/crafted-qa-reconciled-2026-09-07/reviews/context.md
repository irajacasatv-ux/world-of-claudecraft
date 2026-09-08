# Crafted furnishing QA context report

Read-only Explore report at HEAD `09329632507b3073a5948588f312842a05280ddf`.
Repository: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
This report supplies context and inspection evidence. The parent owns current test execution, findings disposition, integration, and the final verdict.

## Preflight and history

Use the packet worktree above on `feature/freeholds`. It was clean at the initial read. State records PR #3872 as merged at `6111e6d206`, with `origin/release/v0.42.0` integrated by `7f4fe99619`. Fetch with prune, discover the newest `origin/release/**`, merge its head, and run the release merge audit after a nonempty merge. Install with `pnpm install --frozen-lockfile` if `patches/` moved. Never push this branch or merge a PR.

Pre-content baseline: `49ed3f09333f4f1293edda9a98fe590c5651c20e`, also `86eb86bbe2^`. The original four content commits are `86eb86bbe2`, `8bd097d898`, `b3c2452b49`, and `3666d89647`. The original content diff has 232 files, including large signed measurement artifacts. Historical QA repairs span six source commits and 80 files after integration `2e24ba8818`. The raw baseline-to-HEAD range also includes unrelated release commits; these require merge provenance, not attribution to this content producer.

First-parent task history:

```text
0932963250 docs(freeholds): reconcile crafted content validation and handoff
7f4fe99619 Merge remote-tracking branch 'origin/release/v0.42.0' into feature/freeholds
4ab837d475 docs(freeholds): record the crafted-content audit verdict
b379ee462d chore(freeholds): measure missing suites for the integrated CI inventory
5f4821bec7 fix(freeholds): finish mobile refusal and integration regressions
85f99f6a32 test(freeholds): capture guide and manual availability repairs
1be1aef461 fix(freeholds): explain unavailable manual use through touch menus
47655ffb54 test(freeholds): enforce calibration seals and format integration guards
ea3b62fad1 fix(freeholds): correct crafted content guidance and QA coverage
2e24ba8818 chore(freeholds): reconcile the current crafting dependency
3666d89647 docs(wiki): regenerate guide content for the furnishing recipes and patterns
b3c2452b49 feat(content): add art, Hearth shelf pages, and name fills for the crafted furnishings
8bd097d898 feat(content): add three furnishing patterns on the Heroic Quartermaster row
86eb86bbe2 feat(content): add ten crafted furnishings, one recipe per craft
```

Current scope explicitly preserves the full `evaluateCraftAdmission` and `resolveTrain` declarations plus existing station, training, and economy behavior. It permits the existing availability seams and supersedes the historical whole-directory profession freeze. Preserve the previous FAIL verdict as history: 29 findings, 28 accepted repairs, and the then-unresolved F01 scope conflict. The current reconciliation is not a retrospective QA PASS.

## Promised versus delivered

| Deliverable | Delivered evidence and required acceptance |
|---|---|
| Ten crafted outputs, one per existing craft | Exact manifest roster below. All ten current recipe records and furnishing definitions match the accepted development calibration. Registration uses `FURNISHING_RECIPES` in `ALL_RECIPES`, and `FREEHOLD_FURNISHINGS` in `ITEMS`. Run the content, recipe, and crafting suites. |
| Three patterns within those ten outputs | Engineering, inscription, and jewelcrafting use the Schematic, Technique, and Design prefixes. Each has one rare teaching item, one drop-acquisition recipe, and one 16-Mark quartermaster offer. No additional furniture output or luck channel. Run the pattern/channel suites and the missing-quartermaster mutation. |
| Same-change obligations | Thirteen final 128px WebPs, provenance, English names and five M16 fills, originality evidence, ten ordinary relics on `hearth_first_crafts`, and owner-generated wiki output. Patterns receive no relic slot. Existing profession and quartermaster sources supply discovery. |
| Literal and behavior evidence | The channel contract pins 55 teaching items: 54 recipe manuals teaching 76 drop recipes plus one enchant item; 43 non-Crucible teaching items; seven disjoint recipe families. Every recipe pins skill 50, budget 20, level 15, and one output. All seven trainers and three selected-slot pattern uses have behavior tests. Dark-host refusals preserve possessions and knowledge. |

## Signed sources and asset gates

`docs/freeholds/content-numbers-workbook.md`, section F, records CAL-RECIPES-A, CAL-PATTERNS-A, and CAL-FURN-A. The accepted artifact is `freehold-crafted-development-calibration-v1` at `docs/freeholds/crafted-content-trial-2026-09-07/calibration.json`, SHA-256 `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`. Its adjacent `acceptance.md` records Fernando's acceptance of every exact recipe, resale value, pattern price, and measured stand-in geometry for disabled development. Proposal-time pending fields remain historical. `productionApproved` remains false.

Every recipe has `resultCount: 1`, `skillReq: 50`, `itemLevelBudget: 20`, `level: 15`, a rare output, and a 40-copper craft fee. Seven trainer unlocks cost 10,000 copper each. Three patterns cost 16 Marks each and sell for 100 copper. Original housing values are accepted calibration, not claims of classic-era provenance.

Independent current bundle comparison found all ten complete recipe objects equal to the signed payload. Footprints, radii, decor costs, floor surface, quality, resale, and exact stand-in transforms also match. `/tmp/freeholds-qa-calibration-compare.json` records 50 successful comparison booleans. The table is not a new owner signature.

All ten movable outputs use floor placement; the rug is a walk-through underlay. The Wave A jewel lamp is floor-supported. The chandelier belongs to the twenty-output Wave B roster and gains fixed ceiling anchors in 25. No tabletop or ceiling geometry may be inferred now.

Final crafted GLBs remain an explicit owner-19 gate: `scripts/assets/freehold_crafted/`, `export_freehold_crafted.mjs`, `freehold_crafted.json`, and `tests/freehold_crafted_asset.test.ts`. Room packing, protected arrival/corridors, navigation, and physical hardware LOW evidence retain their later owners. Accepted stand-ins do not prove these. There is no new asset generation in this audit. The final 44a Codex placeholder-image pass does not waive same-change icons or final art at each wave close.

Original icon evidence lives under `docs/freeholds/crafted-content-art-2026-09-07/`. `staged-art-v2.json` records thirteen initial Codex generation calls and five targeted edits, reference lineage, original/master hashes, and canonical conversion receipts. `items.accepted-art.json` seals the shipping bytes and source record. `public/ui/items/mapping.json` batch `freehold-crafted-2026-09-07` owns exactly thirteen IDs; CREDITS records that ownership. No new GLB or SFX was generated.

The original accepted runtime manifest contains 42 captures: sixteen desktop, twenty-two mobile, two guide, and two catalog-prose captures. It covers six locales, actual 48-Mark purchases, bags, bank, tooltips, trainer states, and unsent mail previews. Injected presentation inventory is distinguished from real acquisition. Historical QA adds eleven final combined guide/manual captures, including actual touch refusal. These are browser emulation, not physical-device or hardware LOW proof.

## Ten-recipe table

The recipe ID is `recipe_<output ID>`. Node tiers below are `gatherTier` from `material_grades.ts`, not the distinct price/proc bands in `material_tier.ts`. Harvest/salvage inputs and vendor staples have their own source contracts; they must not be assigned invented node tiers. Both produce inputs are actual tier-3 crops.

| Output | Craft | Station | Acquisition/trainer row | Exact bill by source tier | Produce | sell | footprint /r/decor |
|---|---|---|---|---|---|---|---|
| freehold_weapon_rack | weaponcrafting | forge | static forge master; trainer | elderwood_log x1 (nodeT3); thorium_ore x2 (nodeT3); rough_hide x2 (harvest/salvage); smithing_flux x1 (vendor) | none | 58 | 3x2 / 1 / 1 |
| freehold_iron_brazier | armorcrafting | forge | static forge master; trainer | thorium_ore x4 (nodeT3); iron_ore x24 (nodeT2); smithing_flux x2 (vendor) | none | 64 | 2x2 / 0.5 / 7 |
| freehold_patchwork_rug | tailoring | loom | static loom master; trainer | sunpetal_herb x1 (nodeT3); homespun_cloth x4 (harvest/salvage); spool_of_thread x2 (vendor) | none | 43 | 4x8 / 0 / 1 |
| freehold_hide_armchair | leatherworking | tannery | static tannery master; trainer | pristine_hide x1 (harvest/salvage); rough_hide x4 (harvest/salvage); thorium_ore x1 (nodeT3); tanning_agent x2 (vendor) | none | 26 | 2x2 / 1 / 1 |
| freehold_clockwork_lamp | engineering | toolworks | pattern_freehold_clockwork_lamp | copper_ore x6 (nodeT1); smithing_flux x2 (vendor); arcane_dust x3 (harvest/salvage) | none | 9 | 2x2 / 1 / 1 |
| freehold_glass_floor_lamp | alchemy | apothecary | static apothecary master; trainer | pristine_venom_gland x1 (harvest/salvage); venom_gland x2 (harvest/salvage); frost_gourd x1 (cropT3); sunpetal_herb x1 (nodeT3); glass_vial x1 (vendor) | frost_gourd | 53 | 2x2 / 1 / 1 |
| freehold_chart_easel | inscription | apothecary | pattern_freehold_chart_easel | sunpetal_herb x2 (nodeT3); arcane_essence x2 (harvest/salvage); glass_vial x1 (vendor); goldleaf_herb x2 (nodeT2) | none | 60 | 2x3 / 1 / 8 |
| freehold_jewel_floor_lamp | jewelcrafting | forge | pattern_freehold_jewel_floor_lamp | thorium_ore x4 (nodeT3); arcane_essence x2 (harvest/salvage); smithing_flux x2 (vendor); iron_ore x2 (nodeT2) | none | 39 | 2x2 / 0.5 / 4 |
| freehold_set_supper_table | cooking | kitchens | static kitchens master; trainer | prime_cut x1 (harvest/salvage); game_meat x4 (harvest/salvage); highland_barley x2 (cropT3); frost_gourd x2 (cropT3); sunpetal_herb x1 (nodeT3); cooking_salt x2 (vendor) | highland_barley, frost_gourd | 54 | 5x5 / 2 / 5 |
| freehold_glow_lantern | enchanting | toolworks | static toolworks master; trainer | arcane_essence x20 (harvest/salvage); arcane_dust x6 (harvest/salvage) | none | 60 | 2x2 / 0.5 / 1 |


Seven crafts follow `STATION_TYPE_BY_CRAFT`. The three established legacy bindings are inscription/apothecary, jewelcrafting/forge, and enchanting/toolworks. No new station is introduced.

## Three-pattern table

| ID | Prefix | Quality | Teaches | Quartermaster row | Marks | sell |
|---|---|---|---|---|---|---|
|pattern_freehold_clockwork_lamp|Schematic:|rare|recipe_freehold_clockwork_lamp|HEROIC_VENDOR_STOCK exact one pattern_freehold_clockwork_lamp|16|100|
|pattern_freehold_chart_easel|Technique:|rare|recipe_freehold_chart_easel|HEROIC_VENDOR_STOCK exact one pattern_freehold_chart_easel|16|100|
|pattern_freehold_jewel_floor_lamp|Design:|rare|recipe_freehold_jewel_floor_lamp|HEROIC_VENDOR_STOCK exact one pattern_freehold_jewel_floor_lamp|16|100|


Wave A acquisition is Marks-only. No raid, rift, delve, or heroic-dungeon luck channel may carry these patterns. The seven trainer recipes stay outside every drop channel.

## Per-item obligation table

The exact name key is `entities.items.<id>.name`. The five checked M16 overlays are `zh_CN`, `zh_TW`, `ja_JP`, `ko_KR`, and `ru_RU`. Each row has a committed `public/ui/items/<id>.webp`, the same exact-ID provenance batch, and an originality record in `naming-originality.json`. These existence checks do not substitute for the content reviewer's visual or linguistic review.

| Item ID | WebP exists | provenance | EN name | five M16 keys | Reliquary | wiki source | deed/entity |
|---|---|---|---|---|---|---|---|
|freehold_weapon_rack|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_iron_brazier|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_patchwork_rug|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_hide_armchair|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_clockwork_lamp|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_glass_floor_lamp|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_chart_easel|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_jewel_floor_lamp|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_set_supper_table|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|freehold_glow_lantern|true|batch exact ID|true|true|hearth_first_crafts|matching craft recipe + Hearth|N/A existing sources|
|pattern_freehold_clockwork_lamp|true|batch exact ID|true|true|excluded as required|quartermaster teaching route|N/A existing sources|
|pattern_freehold_chart_easel|true|batch exact ID|true|true|excluded as required|quartermaster teaching route|N/A existing sources|
|pattern_freehold_jewel_floor_lamp|true|batch exact ID|true|true|excluded as required|quartermaster teaching route|N/A existing sources|


No new NPC, quest, dungeon, or conquerable source is created. New named-entity and deed records are therefore not applicable; existing profession and quartermaster sources remain. Hearth currently contains `hearth_basics` followed by `hearth_first_crafts`. This exact current inventory is not a permanent global page cap. Current full/character completion pins are 462/433; historical 448/419 measurements must not erase incoming content.

## Every profession-directory change

| File | Edit | Preserved contract |
|---|---|---|
| `crafting.ts` | Adds availability checks to acquisition, craft resolution, craft start, and maximum batch calculation. | Guards precede spending or mutation. The complete admission declaration, fee formulas, station rules, and economy logic are unchanged. |
| `pattern_items.ts` | Clarifies the existing rollback comment for a real dark-host refusal. | The existing previous-knowledge restoration and no-consumption failure path remain. All three selected-slot refusals are tested. |
| `recipe_visibility.ts` | Adds a cached host-availability projection. | Lit hosts retain `ALL_RECIPES`; dark hosts reuse their projection until append/remove changes catalog length. There is no player-state cache. Same-length replacement is outside the existing `recipeById` cache contract. |
| `train_recipe.ts` | Extracts the former Sim command and checks availability before the shared validator. | Available content retains death/player resolution, validation, fee, acquisition, and event order. Dark refusal returns `train_not_taught_here` with fee zero. |
| `training.ts` | Updates a caller comment to the extracted module. | `resolveTrain`, `teachTierMet`, and training fee semantics are unchanged. |
| `CLAUDE.md` | Documents the extraction and cache. | Documentation only. |
| `enchanting.ts` | Incoming release adds Riftbound gear rejection and rolled-stat classification in both admission/resolution paths. | This is release provenance, not an original furnishing change. It does not introduce furnishing station or training rules. |

A fresh TypeScript-parser comparison from the pre-content baseline to current HEAD establishes:

| Declaration | Byte-identical | Bytes | SHA-256 |
|---|---|---|---|
| `evaluateCraftAdmission` | Yes | 8599 | `02084dd3b64fc40fc1f15bf18226964176f232ebd763829ca9402728772870c3` |
| `resolveTrain` | Yes | 1040 | `ca7437959bbc99f2f155217bc25f8a8b0f9ffb5b420808ae83728567fc90bbd3` |

The receipt is `/tmp/freeholds-qa-protected-functions.json`. Declaration identity is not complete behavior proof; the surrounding acquisition and refusal suites remain required.

`isFreeholdCraftAvailable` is the shared output/pattern predicate. `acquireRecipeForRecipe` covers direct grants and pattern use. Training checks before the validator and fee. Craft start, completion, and maximum-batch paths all guard. Quartermaster admission checks before Marks spending. UI recipe, trainer, and vendor lists use the mirrored hello capability, while all catalog identities remain registered.

## Added test contracts

| Suite | Assertions added or extended |
|---|---|
| `furnishing_pattern_items` | Exact three definitions and single 16-Mark rows; exact seven/three acquisition partition. Every pattern is used from a selected bag slot, learns once, consumes exactly the clicked copy, and preserves the locked survivor. Retry, missing profession, skill 49, stale/malformed/wrong-item slot, death, insufficient Marks, range, and full-bag negatives conserve state. |
| `apex_pattern_channels` | Furnishings form the seventh disjoint family of three; 76 drop recipes, 55 teaching items, and 43 non-Crucible items. Each furnishing pattern is vendor-only. A missing-quartermaster mutation must actually run and fail. |
| `recipe_pattern_items` | Existing whole-catalog teaching-item sweeps automatically cover the three new merged rows. No original direct source edit or count pin is needed. |
| `recipe_economy` | Existing `ALL_RECIPES` sweep includes all ten outputs and permits no resale profit or new exception. The trainer inventory gains exactly seven furnishing rows. |
| `provisioner_firewall` | All ten full bills; produce only for cooking/alchemy; protected keystones, catalyst, gear intermediates, seeds, other craft identities, and non-furnishing outputs refuse. Positive controls and an injected invalid full bill establish that the sweep can fail. |
| `freehold_content` | Exact ten new/eight existing outputs, literal footprints/radii/decor/resale/rarity, finite placement fields, no power payload, binding, or market prohibition. Each recipe pins skill 50, budget 20, level 15, and one output. Ten ordinary relics have actual profession sources. |
| `professions_crafting_hub` | Adds the three explicit furnishing legacy-station identities to the literal exception contract. |
| `furnishing_recipes` | Each recipe merges once and resolves both indexes; exact acquisition/station identities; accepted calibration hash, all bills/transforms, and three sealed child evidence hashes; deep immutability. All seven static trainers exercise range, skill 49, 9999 copper, successful 10000-copper learning, and replay. Three pattern recipes refuse trainer learning. |
| `furnishing_crafting` | Each of ten real crafts pays reagents/40 copper and produces the expected item/gain. Covers station and capacity refusal, maximum 50-craft batch with signed-material discounts, lost materials during a batch, and deterministic execution. |
| `freehold_crafted_availability` | All ten dark-host trainer, direct-grant, and carried-knowledge craft refusals preserve inventory, copper, knowledge, and RNG. All three pattern uses preserve the selected copy; all three purchases preserve Marks. An existing pattern remains purchasable as a positive control. |
| `freehold_crafted_art` | Thirteen items, immutable source seal, distinct originals/masters/shipping hashes, eighteen calls and five edits, reference lineage, conversion receipts, and native-size review sheets. |
| `freehold_crafted_presentation` | Actual client starts dark; only strict boolean true enables content; legacy hello and anchor fields remain unchanged; trainer/vendor filtering and reconnect refresh work in both directions. |
| `recipe_visibility` | Stable list identity and append/remove invalidation. |
| `furnishing_market_catalog` | Actual ten-item catalog can be listed by a noncrafter, with relevant refusal controls. |
| `professions_blob_growth` | Real serializer fixed points and exact knowledge/discovery/relic additions stay within existing bounds. No schema or query change. |
| Guide, bags, tooltip, and browser suites | Wiki freshness, furnishing exclusion from edible feast results, accurate vendor/manual prose, unavailable-manual feedback, real touch refusal, enabled learning, and the mobile error-toast layer above Bags. |

`/tmp/freeholds-qa-added-tests.md` contains the added test registration inventory across the original four and six repair source commits. `/tmp/freeholds-qa-diff-<commit>.txt` retains every complete per-commit patch. Parameterized titles represent multiple cases; actual executed counts must come from the parent's current Vitest receipts.

## Exact validation and finishing contract

```sh
npx tsc --noEmit
npx vitest run tests/freehold_content.test.ts tests/furnishing_pattern_items.test.ts tests/apex_pattern_channels.test.ts tests/apex_pattern_items.test.ts tests/farm_pattern_items.test.ts tests/recipe_pattern_items.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/professions_crafting_hub.test.ts tests/train_view.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/market_filters.test.ts tests/furnishing_item_kind.test.ts tests/architecture.test.ts
npm run wiki:content
npx vitest run tests/guide.test.ts
npm run i18n:gen
npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts
git status --porcelain
node scripts/gate_select.mjs
npm run ci:changed
```

Run `ci:changed` after the actual last commit, including verdict/evidence commits, and read the exit code. Commit fixes separately from the verdict, using explicit paths, a Conventional Commit scope and body, and no forbidden vocabulary or punctuation. Never use `git add -A`.

State's additional change-type matrix names these current surface checks:

- Sim: `tests/architecture.test.ts`, `tests/sim_context.test.ts`, `tests/monolith_budget.test.ts`, relevant module suites, and deterministic behavior. Update parity goldens only for intended changed sampled state/events under the normal parity contract.
- World API: `tests/world_api_parity.test.ts`, `tests/command_schema.test.ts`, and `tests/command_facets.test.ts`.
- Wire: `tests/snapshots.test.ts`, `tests/env_protocol.test.ts`, `tests/bandwidth.test.ts`, and the housing chain tests.
- Server: actual domain suites, `tests/server/http/surface_inventory.test.ts`, `tests/server/http/error_codes.test.ts`, `tests/server/main_retention_wiring.test.ts`, `tests/api_error_code_parity.test.ts`, and applicable PostgreSQL twins with a real isolated database.
- UI: architecture, `tests/hud_update_drive.test.ts`, `tests/mobile_window_coverage.test.ts`, `tests/renderer_compile_gate.test.ts`, i18n, and actual screenshots for changed visual behavior. `npm run perf:tour` applies to GPU producers.
- Asset verification: `node scripts/item_art_audit.mjs --verify-only`, plus the committed art/seal tests and independent visual review.

The original calibration producer commands are `node scripts/freeholds/crafted_economy_measure.mjs --out <scratch>` and `node scripts/freeholds/crafted_geometry_measure.mjs > <scratch-json>`. Exact historical geometry commands and outcomes live in `geometry-validation.json`. Verify immutable accepted bytes and current literal behavior. Do not regenerate accepted source evidence merely to match newer code. A changed numeric value or measurement producer requires its own admissible evidence and approval boundary.

No new SFX, GLB, or GPU producer is introduced by this audit, so no new per-asset audio/export/performance evidence is inferred or required solely from the audit label. Shared-gate SFX conformance remains mandatory. If a fix introduces such a producer, its full pipeline applies. Current PG-armed shared-gate evidence is stronger than a local unarmed pass; never claim a skipped required PG suite ran.

`qa-checklist.md` assigns the whole-feature runtime matrix to wave closes 20, 27, 33, 39, and 44. This audit checks promised and touched surfaces without pretending future placement, room, or UI work exists. Every current acceptance claim needs an executed check. Existing sealed captures can be reviewed; visual fixes require final-source recapture. Hardware LOW and production approval remain separate.

Required finishing reviewers are `content-obligations-reviewer`, `test-coverage-auditor`, then `qa-checklist`, all prompted for COVERAGE and reporting to files. Wait for every report, address all findings including nits, and have a fresh reviewer inspect the entire fix round. Genuine non-defects need explicit reasoned disposition; no deferred-nit PASS. SQL, stored-shape, queue, lock, timeout, or growth changes trigger database performance review before decisions and on the final diff, paired with persistence/security where applicable.

## Memory sources

Read the repository memory directory at `/Users/fernando/.claude/projects/-Users-fernando-Documents-world-of-claudecraft/memory/`:

- `MEMORY.md`, `test-pin-traps-index.md`, and `reusable-gotchas-index.md`, including content and pin clusters.
- `review-the-review-fix-round.md` and `apply-all-review-findings.md`.
- `new-item-content-hidden-obligations.md`, `mapping-an-orphan-tag-retires-the-corpus-fixtures.md`, `interrupted-mutation-proof-leaves-a-mutant.md`, and `freeholds-crafted-qa-lessons.md`.

Relevant lessons: prove a mutant was applied and tests actually ran; keep expectations independent of implementation; avoid comment-satisfied source pins and vacuous fixtures; restore scratch mutations exactly; every new ID owes art/provenance and M16 fills; fresh fix review must inspect comments and evidence as well as code. Memory's F01 FAIL handoff is historical and superseded prospectively by the current scope reconciliation. Its older no-local-gate preference conflicts with the current explicit request, which requires the local shared gate.

## Findings, limits, and handoff

No new confirmed content, calibration, protected-validator, or acquisition defect was found by this context exploration. The three audit reviewers and required finishing reviewers own their independent findings and verdicts.

The full principal source diffs were inspected for content tables, profession guards/wrappers, wire capability, UI projections, mapping, stock, guide output, and name sources. Supporting test/asset inventories and signed JSON were inspected through records, schemas, and hashes. This report does not claim manual review of every row in the 2 MB measurement series or all unrelated incoming release files; these remain retained source evidence and merge-audit scope.

The parent must update progress row `04 QA` with the fresh verdict, found/resolved counts, and fresh whole-fix review evidence; update state if the ledger changes; record useful memory. Preserve historical FAIL evidence.

PASS next file: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-05-instance-claim.md`.

FAIL next file: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-04-content-crafted-and-patterns.md`, with findings attached. Do not start 05 before paired QA passes.

Coordinator DOC-1 correction: the comparison receipt has ten rows and five boolean fields per row, so 50 successful field comparisons. The copied report's former count of 60 was corrected during final documentation review; the receipt and comparison outcomes are unchanged.
