# Crafted furnishings and pattern content evidence

This is the content evidence inventory for the separate 04 QA audit. It describes the authored content and applied repairs at source commit `ea3b62fad1`, following dependency merge `2e24ba8818` (parents `3666d89647` and `54ce808436`). Original implementation commits are `86eb86bbe2`, `8bd097d898`, `b3c2452b49` and `3666d89647`, based on `49ed3f0933`.

The tables are updated evidence, not a final QA verdict. Shared gate, current visual verification and fresh whole-fix review remain coordinator-owned and are not claimed complete here. Finding F01 remains open: the request's explicit profession-path freeze conflicts with the original D85 availability edits. Preserving station/tier/fee mechanics does not satisfy that raw path requirement, and this document grants no waiver. Current disposition belongs to `docs/freeholds/crafted-qa-2026-09-07/findings.md` and the eventual coordinator closeout.

All paths below are repository-relative. Historical exploration and corrections are retained in `docs/freeholds/crafted-qa-2026-09-07/reviews/explore.md`, `reviews/hygiene.md` and `reviews/doc-fix.md` in this evidence directory. Their original observations are not silently rewritten as evidence of the repaired candidate.

## Promised content and current evidence

| Promise | Current implementation | Evidence and boundary |
| --- | --- | --- |
| Ten furnishings, one per existing craft | Ten rare furnishing output definitions and ten corresponding recipes, all with exact signed bills and existing station bindings | `src/sim/content/freehold/furnishings.ts`, `furnishing_recipes.ts`; `tests/furnishing_recipes.test.ts`, `tests/furnishing_crafting.test.ts`, `tests/freehold_content.test.ts` |
| Three deterministic pattern items within those ten | Clockwork Lamp, Chart Easel and Jewel Floor Lamp manuals; exactly one 16-Mark offer each, no luck route | `src/sim/content/freehold/furnishing_patterns.ts`, `src/sim/content/heroic_vendor.ts`; `tests/furnishing_pattern_items.test.ts`, `tests/apex_pattern_channels.test.ts` |
| Art, names, originality, Hearth and guide obligations | Thirteen shipping icons with one provenance owner, all English and required M16 names, one ten-output Hearth page, generated recipes and guide classifications | Per-ID table and guide-repair section below; current visual review remains pending |
| Every authored item remains tradable through ordinary market custody | All thirteen plain authored items and ten signer-only furnishing copies are listed and canceled through actual Sim commands | `tests/furnishing_market_catalog.test.ts`, 23 cases; exact inventory/listing and selected signer preservation |
| Economy, channel and produce restrictions remain decisive | All recipes participate in ordinary economy/channel/firewall sweeps; missing vendor and illegal produce mutations fail by assertion | Mutation results below, both baseline/mutant/restored exits 0/1/0 |
| No profession source edits | Original implementation changed four profession paths for D85 availability and extraction | F01 remains OPEN; no final PASS is recorded here |

## Signed values and source identity

The accepted development artifact is `freehold-crafted-development-calibration-v1`, `docs/freeholds/crafted-content-trial-2026-09-07/calibration.json`, SHA-256 `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`. Fernando's exact development acceptance is retained in `docs/freeholds/crafted-content-trial-2026-09-07/acceptance.md`; the workbook records CAL-RECIPES-A, CAL-PATTERNS-A and CAL-FURN-A at `docs/freeholds/content-numbers-workbook.md`.

Every recipe has `resultCount: 1`, `skillReq: 50`, `itemLevelBudget: 20`, `level: 15`, one rare output and an unchanged 40-copper craft fee. The seven trainer recipes retain the existing 10,000-copper unlock. Every pattern costs 16 Marks, for 48 total, and has output-derived rare quality and 100-copper resale. `tests/furnishing_recipes.test.ts` compares exact bills and transforms to the hash-pinned calibration; `tests/freehold_content.test.ts` independently pins the common numeric literals. The complete crafted set costs 30 decor against the Inn's existing 20 budget; this does not authorize increasing the Inn.

`src/sim/content/freehold/furnishings.ts::FREEHOLD_CRAFTED_FURNISHING_STAND_INS` records measured stand-in transforms, and the accepted calibration links geometry/economy source records. Final GLBs, final geometry/decor calibration, legal room packing, arrival/navigation, hardware LOW measurements and production activation approval remain separately owned later gates. Production approval is still false; this evidence does not sign those gates.

Tier notation in the recipe table uses node-gather tiers for ore, wood and herbs (`src/sim/professions/material_grades.ts`) and crop tiers for produce (`src/sim/content/farm_crops.ts`). Corpse drops, vendor staples and disenchant materials retain their actual source descriptions; no unrelated price-band tier is invented for them. Frozen IDs remain unchanged even where display names differ, including thorium/elderwood and arcane dust/essence.

## Ten recipes

For every output below, the recipe ID is exactly `recipe_<outputId>`. Output definitions are `kind: 'furnishing'`, rare, tradable and unbound. They have no `noMarketList`, gear stats, aura, feast/food charges or item-use action. Ordinary crafting supplies signer-only instance metadata without granting equipment power.

Seven craft bindings come from `src/sim/content/professions.ts::STATION_TYPE_BY_CRAFT`: weaponcrafting/forge, armorcrafting/forge, tailoring/loom, leatherworking/tannery, engineering/toolworks, alchemy/apothecary and cooking/kitchens. The three existing explicit legacy bindings are inscription/apothecary, jewelcrafting/forge and enchanting/toolworks. These are seven craft-map entries, not seven distinct station types. `trainingStationTypeFor` in `src/sim/professions/training.ts` already reads an explicit recipe station before the craft-map fallback.

| Output ID | Craft | Station | Acquisition/trainer row | Exact bill (item units, tier/source) | Produce | Sell copper | Footprint; r; decor |
|---|---|---|---|---|---|---|---|
| `freehold_weapon_rack` | weaponcrafting | forge | existing static forge master, trainer/skill 50 | `elderwood_log` 1 (T3), `thorium_ore` 2 (T3), `rough_hide` 2 (common corpse), `smithing_flux` 1 (vendor staple) | No | 58 | 3 x 2; 1; 1 |
| `freehold_iron_brazier` | armorcrafting | forge | existing static forge master, trainer/skill 50 | `thorium_ore` 4 (T3), `iron_ore` 24 (T2), `smithing_flux` 2 (vendor staple) | No | 64 | 2 x 2; 0.5; 7 |
| `freehold_patchwork_rug` | tailoring | loom | existing static loom master, trainer/skill 50 | `sunpetal_herb` 1 (T3), `homespun_cloth` 4 (common corpse), `spool_of_thread` 2 (vendor staple) | No | 43 | 4 x 8; 0; 1 |
| `freehold_hide_armchair` | leatherworking | tannery | existing static tannery master, trainer/skill 50 | `pristine_hide` 1 (rare corpse), `rough_hide` 4 (common corpse), `thorium_ore` 1 (T3), `tanning_agent` 2 (vendor staple) | No | 26 | 2 x 2; 1; 1 |
| `freehold_clockwork_lamp` | engineering | toolworks | `pattern_freehold_clockwork_lamp`, quartermaster only | `copper_ore` 6 (T1), `smithing_flux` 2 (vendor staple), `arcane_dust` 3 (disenchant/crafting material) | No | 9 | 2 x 2; 1; 1 |
| `freehold_glass_floor_lamp` | alchemy | apothecary | existing static apothecary master, trainer/skill 50 | `pristine_venom_gland` 1 (rare corpse), `venom_gland` 2 (common corpse), `frost_gourd` 1 (produce T3), `sunpetal_herb` 1 (T3), `glass_vial` 1 (vendor staple) | frost_gourd | 53 | 2 x 2; 1; 1 |
| `freehold_chart_easel` | inscription | apothecary | `pattern_freehold_chart_easel`, quartermaster only | `sunpetal_herb` 2 (T3), `arcane_essence` 2 (disenchant/crafting material), `glass_vial` 1 (vendor staple), `goldleaf_herb` 2 (T2) | No | 60 | 2 x 3; 1; 8 |
| `freehold_jewel_floor_lamp` | jewelcrafting | forge | `pattern_freehold_jewel_floor_lamp`, quartermaster only | `thorium_ore` 4 (T3), `arcane_essence` 2 (disenchant/crafting material), `smithing_flux` 2 (vendor staple), `iron_ore` 2 (T2) | No | 39 | 2 x 2; 0.5; 4 |
| `freehold_set_supper_table` | cooking | kitchens | existing static kitchens master, trainer/skill 50 | `prime_cut` 1 (rare corpse), `game_meat` 4 (common corpse), `highland_barley` 2 (produce T3), `frost_gourd` 2 (produce T3), `sunpetal_herb` 1 (T3), `cooking_salt` 2 (vendor staple) | highland_barley, frost_gourd | 54 | 5 x 5; 2; 5 |
| `freehold_glow_lantern` | enchanting | toolworks | existing static toolworks master, trainer/skill 50 | `arcane_essence` 20 (disenchant/crafting material), `arcane_dust` 6 (disenchant/crafting material) | No | 60 | 2 x 2; 0.5; 1 |


The seven trainer rows use the existing static station masters, `acquisition: ['trainer']`, and the existing `teachTierMet`/training-fee rules. No new per-NPC recipe list or station is introduced. The three pattern rows use the existing `drop` teaching convention while acquisition is deterministically vendor-only. `tests/furnishing_recipes.test.ts` drives every trainer row through out-of-range, skill 49, 9,999-copper, successful 10,000-copper debit/learning/result and repeat-refusal cases; all three pattern recipes refuse trainer learning. `tests/furnishing_crafting.test.ts` crafts every output, checks the exact material and 40-copper debit, and rejects every wrong station.

## Three patterns

| Pattern ID | Prefix/name | Quality/resale | Taught recipe | Quartermaster row |
|---|---|---|---|---|
| pattern_freehold_clockwork_lamp | Schematic: Clockwork Lamp | rare / 100 copper | recipe_freehold_clockwork_lamp | { itemId: pattern_freehold_clockwork_lamp, marks: 16 } |
| pattern_freehold_chart_easel | Technique: Chart Easel | rare / 100 copper | recipe_freehold_chart_easel | { itemId: pattern_freehold_chart_easel, marks: 16 } |
| pattern_freehold_jewel_floor_lamp | Design: Jewel Floor Lamp | rare / 100 copper | recipe_freehold_jewel_floor_lamp | { itemId: pattern_freehold_jewel_floor_lamp, marks: 16 } |


Each manual has only `id`, `name`, `kind`, `quality`, `sellValue` and `teachesRecipeId`. Its kind is `recipe`; no equip/use-effect payload, soulbinding or market-deny field is added. The recipe is learned by the existing selected-copy item-use path, which consumes exactly that copy on successful learning. No pattern is a Reliquary relic. No raid, Rift, delve or heroic-dungeon luck channel is added.

`tests/furnishing_pattern_items.test.ts` drives all three real manual IDs from named bag slots. It checks exact selected-copy consumption, sibling preservation, knowledge/result state, already-known and unpracticed/low-skill denials, malformed/stale slots and dead use. Real Quartermaster purchases debit 16 Marks per copy with no copper debit or automatic learning, and preserve state on insufficient Marks, death, range and full-bag refusal.

The complete teaching census in `tests/apex_pattern_channels.test.ts` is **55 teaching items: 54 recipe manuals teaching 76 recipes plus one enchant teaching item**. The non-Crucible subset is 43 teaching items. The drop-recipe partition remains seven disjoint families: gear 10, armor 10, consumables 13, farming 6, rods 1, Crucible 33 and furnishing 3. The original apex-wave header remains historical; it is not repurposed as a live full-catalog count. Every furnishing pattern's actual channel list must equal `['vendor']`.

## Per-ID obligations

Each icon path is `public/ui/items/<id>.webp`. The byte counts and hashes below are the shipping records checked during original source exploration; QA changes did not regenerate or alter these images. `public/ui/items/mapping.json` assigns each ID exactly once to `freehold-crafted-2026-09-07`. Its descriptive source pointer now names accepted `staged-art-v2.json`, with the actual ownership and shipping bytes preserved.

All thirteen English item-name keys live under `entities.items.<id>.name` in `src/ui/i18n.catalog/items.ts`, with required fills in all five `src/ui/i18n.locales/{zh_CN,zh_TW,ja_JP,ko_KR,ru_RU}.ts` files. The names and First Hearth Crafts have retained originality evidence in `docs/freeholds/crafted-content-art-2026-09-07/naming-originality.json`. These are ordinary item names, not newly named NPCs, so `src/ui/world_entity_i18n.ts` needs no new NPC alias. No new conquerable content requires a new Book of Deeds record; existing Homesteader discovery predicates already cover furnishings. The permanent golden adds these thirteen IDs and removes none (`tests/shipped_item_ids.golden.json`).

| ID | WebP bytes / SHA256 | Provenance | Name/M16/originality | Hearth/wiki | Market |
|---|---|---|---|---|---|
| `freehold_weapon_rack` | 1952 / `4100e8d04eba0cf59fe7914a030cb8e90a2c491dd05a6a4c20be3dbbbab45fa0` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_iron_brazier` | 2136 / `588991eacf16699540a8a7b7d537811c0efbc8498aecadbb0ba196e7d274a908` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_patchwork_rug` | 2376 / `b36a7ad324b28563f965658da66c6a043fa2a4ab614e0c960e0fd5a9b17912fb` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_hide_armchair` | 2452 / `4af1b3f00918f3a3fa1bae7b55acfcff4b462f83f8846f460be5669b2e7656cb` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_clockwork_lamp` | 2848 / `dd2d98ea43cde46b91d4811224ab9245e82866b2116b0b11e289d2d2fc391eb5` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_glass_floor_lamp` | 2346 / `e0bb0cca4dc4d288c682296d4a9b5f69f650a91ec759718ec09836c4a567833f` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_chart_easel` | 2214 / `cd6f9d874d978ac4956aa7c2ab33105b111c87355a267d4815682331a94a8fca` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_jewel_floor_lamp` | 2348 / `305a20209d377d21a38d63551ca1f498242bc26aa0107ef3ca9f4603aba4b6c2` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_set_supper_table` | 2502 / `7f3babb7318edb07f906beba5e985ad2da762ee20f7f803b79b5ac5323f26a83` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `freehold_glow_lantern` | 2576 / `ebe6e74fcaa4f380103160613add077fa712484f2f6ab1a4e4904def5aa25755` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | real plain and signer-only listing/cancel, two authored cases |
| `pattern_freehold_clockwork_lamp` | 2794 / `9a6525792b3f241d0dffe0f9a7df96862cc4aff94c01145265cd29bde3d1f3b9` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | none by contract; wiki vendor-learning recipe | real plain-item listing and cancel, one authored case |
| `pattern_freehold_chart_easel` | 3276 / `15d323c951e3d2bf1cf1ac49f6528a7d397e10d03edeba2fec00353ddf1bba32` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | none by contract; wiki vendor-learning recipe | real plain-item listing and cancel, one authored case |
| `pattern_freehold_jewel_floor_lamp` | 3336 / `70ea954748a94d7670536d1eff78d7d757621006e115876d98d2ea63ab3932e4` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | none by contract; wiki vendor-learning recipe | real plain-item listing and cancel, one authored case |

The new Hearth page is `hearth_first_crafts`, following `hearth_basics`. It has exactly the ten furnishing outputs in recipe-table order with each actual profession as its source; patterns have no slot. English page name/description live in `src/sim/content/reliquary.ts`. Page names are present in all eighteen base `src/ui/reliquary_i18n.locales/` tables, and full descriptions in the five required non-Latin tables. `tests/freehold_content.test.ts`, `tests/reliquary_content.test.ts` and `tests/guide.test.ts` pin content membership and generated publication.

The source/provenance artifacts are `docs/freeholds/crafted-content-art-2026-09-07/items.accepted-art.json`, `staged-art-v2.json` and the retained `staged-art.json`. `tests/freehold_crafted_art.test.ts` pins thirteen literal IDs, immutable source lineage, shipping hashes, opaque 128px WebP metadata, distinct paintings, eighteen original Codex generation calls with five corrections, canonical conversion receipts and seven review sheets. The thirteen shipping files total 33,156 bytes. This QA generated no image or model. The original runtime manifest at `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/manifest.json` remains historical implementation evidence; current QA visual approval is not inferred from that earlier acceptance.

## Authored market custody coverage

The original implementation had synthetic furnishing listing fixtures and definition-level tradability checks; it did not execute all thirteen real IDs. `tests/furnishing_market_catalog.test.ts` closes that gap with **23 cases** reported passed in the coordinator's applied-repair evidence (`docs/freeholds/crafted-qa-2026-09-07/findings.md`, F09):

- Thirteen plain authored-item cases each call `Sim.marketList`, assert one exact new listing, no instance metadata, unchanged prior listings and an unrelated inventory sentinel, then call `marketCancel` and require the original listings and complete inventory to return exactly.
- Ten signer-only furnishing cases each call `marketListInstance`, assert that the plain sibling remains in the bag, the exact signer metadata is escrowed, old listings remain unchanged, then cancel and require the exact original inventory and signer copy to return.

Both arms require no emitted error. They exercise real market range/command/custody paths with literal shipped IDs and no catalog-derived test enumeration. They prove possession, selected-copy and listing conservation; they do not independently assert copper conservation. Signed pattern execution is not claimed because this cohort exercises signed furnishing outputs and plain manuals.

## Guide classification and M16 repair

The initial content review found the Set Supper Table among food recipes without an ornamental label. The repair is data-derived:

- `scripts/wiki/build_content.mjs` emits `furnishing: def?.kind === 'furnishing'` for every cooking output and declares the boolean in the generated type. `src/guide/content.generated.ts` now marks the real `freehold_set_supper_table` as `placeable: false`, `station: false`, `furnishing: true`.
- `src/guide/pages/professions_provisioning.ts` renders furnishing rows with the translated ornamental/not-eaten tag and uses accurate ladder prose. Existing meal, feast and field-station rendering stays intact.
- `src/ui/i18n.catalog/guide.ts` owns `guide.profPages.prov.furnishingTag` and `guide.profPages.prov.ladderBodyFurnishings`. Both have actual same-change fills in `zh_CN`, `zh_TW`, `ja_JP`, `ko_KR` and `ru_RU`, with generated resolved counterparts. The prose states that furnishings decorate a Freehold and provide no food or buff. The prior key remains translation history rather than rendered misleading prose.
- `tests/guide_provisioning.test.ts` has three regressions: classify every generated cooking row against actual item kind; render the real supper table with literal ornamental/no-food-or-buff text while preserving food/feast/station examples; inject another furnished row to reject a supper-table-only workaround.

The retained producer report is `docs/freeholds/crafted-qa-2026-09-07/reviews/guide-fix.md`. It records the three intended pre-fix failures. The coordinator's F06 repair receipt records the post-fix three-test pass; this evidence owner additionally inspected the post-fix focused log reporting two files and 152 tests passed. These focused outcomes do not replace current full guide freshness, localization gates or visual review.

The original guide changes remain: `guide.reliquaryPage.catalogBody` and `guide.profPages.craftProse.armorcrafting.ladderBody` describe the expanded Hearth catalog and distinguish the equipment ladder from the new furnishing lesson. The new provisioning keys supplement those original obligations.

## Availability and manual presentation

D85 behavior is covered by `tests/freehold_crafted_availability.test.ts`, `tests/freehold_crafted_presentation.test.ts`, `tests/recipe_visibility.test.ts` and `tests/crafting_reagent_refresh.test.ts`. Dark hosts preserve complete catalog lookup, stored items and knowledge while refusing new learning, crafting and Quartermaster acquisition. The revised dark-acquisition assertion checks missing knowledge immediately after refusal, before later fixture setup. Capability-changing reconnects repaint an open crafting view even when inventory/knowledge are identical.

The subsequent retained-manual presentation repair reuses `apiError.freehold.disabled`; it adds no translation key or simulator rule. `src/ui/hud/professions/recipe_pattern_tooltip_view.ts` displays the realm-unavailable condition, `src/ui/bags_view.ts` suppresses only the unavailable learning hint, and `src/ui/bags_window.ts` reads live capability when opening the lazy row tooltip. The evidence in `docs/freeholds/crafted-qa-2026-09-07/reviews/pattern-presentation-fix.md` records 12 intended failing cases before the repair and 185 passing tests across the three owning suites afterward. Transfer/bank hint priorities, ordinary manuals/formula behavior and actual retained-copy simulation refusal stay covered. Final independent review remains separate.

## Mutation proof and negative controls

`docs/freeholds/crafted-qa-2026-09-07/mutations.json` records both baseline/mutant/restored sequences, and `docs/freeholds/crafted-qa-2026-09-07/mutation-reproduction.py` retains the exact scratch mutation procedure. The first scratch setup lacked `.browserslistrc`; that setup failure was repaired before evidence collection and is not counted as a successful mutation. The accepted mutants ran real selected tests, produced `AssertionError`, and restored byte-identical scratch sources. Live source bytes remained unchanged.

| Mutation | Selected test | Baseline | Mutant | Restored | What failure proves |
| --- | --- | --- | --- | --- | --- |
| Delete the exact `pattern_freehold_clockwork_lamp` 16-Mark row from scratch `src/sim/content/heroic_vendor.ts` | `tests/apex_pattern_channels.test.ts`, title filter `every recipe teaching pattern appears in EXACTLY` | exit 0 | exit 1 | exit 0 | Furnishing patterns require their actual deterministic Quartermaster route; a missing route cannot pass by counting table rows elsewhere |
| Replace Weapon Rack's first `elderwood_log` reagent with `vale_wheat` in scratch `src/sim/content/freehold/furnishing_recipes.ts` | `tests/provisioner_firewall.test.ts`, title filter `covers every bill and admits produce only in cooking and alchemy decor` | exit 0 | exit 1 | exit 0 | A real non-consumable-craft furnishing bill cannot silently acquire produce |

`tests/provisioner_firewall.test.ts` also independently covers both admitted crafts, cooking and alchemy, against crop/seed/missing-item/non-furnishing controls, all eight other crafts against produce, and every furnishing bill against protected keystones/catalysts/non-exempt gear intermediates. Existing hoe/intermediate exceptions remain separate. `tests/recipe_economy.test.ts` continues its ordinary ALL_RECIPES sweep; no furnishing profit exemption was added.

## Completion boundary

This inventory supports content review at `ea3b62fad1` and records specific focused/mutation evidence. It does not certify the subsequent parent formatting repairs, final shared gate, current screenshots, finished whole-fix review or final QA disposition. The original professions-path prohibition remains unresolved and is not reduced to a mechanics-only freeze here. The owner will update state/progress final status only from the coordinator's exact completion message.
