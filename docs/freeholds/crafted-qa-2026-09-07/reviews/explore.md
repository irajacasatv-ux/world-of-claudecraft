# Crafted furnishings QA context exploration

Read-only STEP 1 report, pinned to implementation baseline 49ed3f09333f4f1293edda9a98fe590c5651c20e and tip 3666d89647609bef4fb98ed5eab0bb4b6e1cfefa. The parent is concurrently merging newer dependency content, so this snapshot does not certify the pending merged tree. No gates or repo mutations were performed by this explorer. Raw complete implementation diff is retained at `/tmp/freeholds-crafted-implementation-full.diff`; every test's added assertion lines are retained at `/tmp/freeholds-crafted-test-additions.json`.

## Immediate requirements and conflicts

- Worktree `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch `feature/freeholds`. Fetch origin with prune. While dependency PR #3872 is OPEN merge freshly fetched origin/feature/masterwrought. Once MERGED discover newest origin/release/** by version sorting, compare HEAD divergence then merge and remove the dependency block. Nonempty merges require release-merge-audit; changed patches require frozen-lockfile pnpm install first. Keep local; never push or merge a PR.
- Ledger 04: development implementation complete locally; ledger 04 QA: Not started. Four commits: `86eb86bbe2` recipes, `8bd097d898` patterns, `b3c2452b49` art/obligations, `3666d89647` wiki/evidence. The four hashes are present in git history, although progress/state describe four commits without enumerating them.
- Accepted development calibration is artifact `freehold-crafted-development-calibration-v1`, SHA256 `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`. Acceptance.md records Fernando's acceptance of the immediately preceding exact v1. Its old proposal status is intentionally immutable and superseded by acceptance for disabled development. Production approval stays false. Final GLB, room packing/navigation/arrival, LOW hardware and production numerical activation signatures remain named release gates owned by 19/20, not waived QA findings.
- **Literal requirement conflict:** actual diff changes `src/sim/professions/crafting.ts`, `pattern_items.ts`, and adds `recipe_visibility.ts`, `train_recipe.ts`. Therefore `git diff <baseline>..HEAD -- src/sim/professions/` is NONEMPTY. `training.ts` is byte-identical. `evaluateCraftAdmission` remains unchanged. The new guards preserve station/fee/tier mechanics and enforce D85's dark-host policy, but the current QA's literal no-files-touched command cannot pass. Parent must reconcile explicitly before PASS.
- **Stale count wording:** baseline already contains Crucible manuals/33 recipes. Correct current literals are 55 recipe items, 76 drop recipes, 43 non-Crucible recipe items, furnishing the SEVENTH family. Progress/state explicitly record this truth. Reverting to 43 total/sixth family would delete merged coverage. The separate apex source file did not change and uses historical 28/TWELVE wording, plus an explicit instruction that the live count derives in the test; do not reinterpret historical wave counts as current full catalog totals.
- **Station wording:** STATION_TYPE_BY_CRAFT covers seven crafts only. Manifest explicitly retains forge for jewelcrafting, apothecary for inscription and toolworks for enchanting via existing recipe-family bindings. All ten shipped rows match these approved bindings.
- **Locale wording:** implementation-plan explicitly allows five non-Latin M16 fills as exception to no-overlay edits. All five global locale overlays changed only for those required values. Reliquary's separate per-base-locale dictionaries add page names in all eighteen base languages, with full descriptions in the five non-Latin tables.

## Promised versus delivered

| Deliverable | Delivered implementation | Evidence / remaining check |
|---|---|---|
| Exactly ten outputs, one per existing craft, selected manifest forms | Ten rare furnishing defs, ten frozen recipe records, canonical ALL_RECIPES/data merge, existing seven map stations plus three explicit recipe bindings | Literal identities, bill hash, execution and wrong-station tests exist; run them at final merged tree |
| Three patterns within those ten, deterministic Marks-only acquisition | Clockwork Lamp, Chart Easel and Jewel Floor Lamp patterns, rare, sell 100, one 16-Mark vendor row each, drop teaching convention | Pattern bag-slot consumption/denials and quartermaster purchase/denials; seventh-family channel arm requires exactly vendor |
| Same-change final icons, provenance, names, originality, Hearth/wiki obligations | 13 WebPs, one mapping owner, sealed original/master/shipping lineage, M16 names, one ten-relic page, generated profession recipes and Hearth page, two changed guide prose keys | Asset evidence explicitly Codex/OpenAI built-in image generation; final runtime 42-capture manifest accepted in art record; generated freshness must rerun |
| Literal economy/channel/firewall/acquisition behavior | New dedicated furnishing suites, channel 55/76/43, ordinary economy sweep over ALL_RECIPES, protected material/produce control arm | Needs required channel-deletion mutation demonstration; no such mutation execution performed by explorer |
| Preserve professions implementations unchanged | Not delivered literally: four paths changed for dark-host availability and extraction | Mechanics freeze is largely retained, but user must resolve literal path freeze against D85 before PASS |

## Exact numeric sources

CAL-RECIPES-A has every recipe at resultCount 1, skillReq 50, itemLevelBudget 20, level 15, rare output and craft fee 40 copper. Seven training unlocks retain existing 10000-copper fee. CAL-PATTERNS-A fixes three patterns at 16 Marks each, 48 total, rare output-derived quality and 100-copper resale. CAL-FURN-A binds exact output resale/geometry/positive integer decor cost/transform to the accepted calibration records. A complete set totals 30 decor, above the Inn's 20 budget; this does not authorize increasing the Inn.

Tier annotations below distinguish node gather tiers from unrelated price-band tiers. T1/T2/T3 for ore/herb/wood come from MATERIAL_GRADES; produce tier comes from FARM_CROPS. Corpse harvests and vendor staples retain their named source without inventing a nonexistent node tier. Arcane Essence/Dust display as Chime Essence/Dust; thorium/elderwood display as Osmium/Highpine, but frozen IDs remain unchanged.

## Ten recipes

All recipe IDs are `recipe_<outputId>`; all crafted outputs are `kind: furnishing`, rare, unbound/tradable, have no `noMarketList`, no use/feast/stat/aura payload and contain only id/name/kind/quality/sellValue/furnishing fields.

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

Training is data-driven: recipe acquisition includes trainer, trainingStationTypeFor uses explicit recipe station then craft map fallback; resident static station masters teach it when teachTierMet compares tiers. No separate NPC recipe ID list is required. Existing TRAINING_FEE_BY_TIER is [0,2500,10000,40000,160000]. Seven trainer recipes all have full real Sim.trainRecipe cases for out-of-range, skill49, copper9999, successful 10000 debit/knowledge event and repeat refusal. Three patterns all have trainer-not-taught-here negatives.

## Three patterns

| Pattern ID | Prefix/name | Quality/resale | Taught recipe | Quartermaster row |
|---|---|---|---|---|
| pattern_freehold_clockwork_lamp | Schematic: Clockwork Lamp | rare / 100 copper | recipe_freehold_clockwork_lamp | { itemId: pattern_freehold_clockwork_lamp, marks: 16 } |
| pattern_freehold_chart_easel | Technique: Chart Easel | rare / 100 copper | recipe_freehold_chart_easel | { itemId: pattern_freehold_chart_easel, marks: 16 } |
| pattern_freehold_jewel_floor_lamp | Design: Jewel Floor Lamp | rare / 100 copper | recipe_freehold_jewel_floor_lamp | { itemId: pattern_freehold_jewel_floor_lamp, marks: 16 } |

Each has only id/name/kind/quality/sellValue/teachesRecipeId. No stackSize, use, soulbound or noMarketList; bind by consumption only. Every offer appears once in HEROIC_VENDOR_STOCK. None gets a Reliquary relic or raid/rift/delve/heroic dungeon channel. The seven trainer rows are the other seven outputs, with no pattern IDs.

## Per-ID same-change obligations

All IDs below are in merged item data, English item catalog and all five required M16 overlays (zh_CN, zh_TW, ja_JP, ko_KR, ru_RU); shipped_item_ids.golden adds exactly these thirteen IDs. `world_entity_i18n.ts` needs no new named-NPC mapping for ordinary item IDs because canonical item names resolve through the item catalog. No new conquerable content is introduced; existing Homesteader triggers already cover furnishings. Thus new Book of Deeds records are not owed for these ordinary recipe outputs/patterns. Ten outputs receive ordinary profession-source Hearth relics; patterns explicitly receive none.

| ID | WebP bytes / SHA256 | Provenance | Name/M16/originality | Hearth/wiki | Market |
|---|---|---|---|---|---|

| `freehold_weapon_rack` | 1952 / `4100e8d04eba0cf59fe7914a030cb8e90a2c491dd05a6a4c20be3dbbbab45fa0` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_iron_brazier` | 2136 / `588991eacf16699540a8a7b7d537811c0efbc8498aecadbb0ba196e7d274a908` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_patchwork_rug` | 2376 / `b36a7ad324b28563f965658da66c6a043fa2a4ab614e0c960e0fd5a9b17912fb` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_hide_armchair` | 2452 / `4af1b3f00918f3a3fa1bae7b55acfcff4b462f83f8846f460be5669b2e7656cb` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_clockwork_lamp` | 2848 / `dd2d98ea43cde46b91d4811224ab9245e82866b2116b0b11e289d2d2fc391eb5` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_glass_floor_lamp` | 2346 / `e0bb0cca4dc4d288c682296d4a9b5f69f650a91ec759718ec09836c4a567833f` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_chart_easel` | 2214 / `cd6f9d874d978ac4956aa7c2ab33105b111c87355a267d4815682331a94a8fca` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_jewel_floor_lamp` | 2348 / `305a20209d377d21a38d63551ca1f498242bc26aa0107ef3ca9f4603aba4b6c2` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_set_supper_table` | 2502 / `7f3babb7318edb07f906beba5e985ad2da762ee20f7f803b79b5ac5323f26a83` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `freehold_glow_lantern` | 2576 / `ebe6e74fcaa4f380103160613add077fa712484f2f6ab1a4e4904def5aa25755` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | hearth_first_crafts, profession source; generated craft recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `pattern_freehold_clockwork_lamp` | 2794 / `9a6525792b3f241d0dffe0f9a7df96862cc4aff94c01145265cd29bde3d1f3b9` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | none by contract; wiki vendor-learning recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `pattern_freehold_chart_easel` | 3276 / `15d323c951e3d2bf1cf1ac49f6528a7d397e10d03edeba2fec00353ddf1bba32` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | none by contract; wiki vendor-learning recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |
| `pattern_freehold_jewel_floor_lamp` | 3336 / `70ea954748a94d7670536d1eff78d7d757621006e115876d98d2ea63ab3932e4` | mapping batch freehold-crafted-2026-09-07; sourceRecord sealed v2 | EN yes / M16 yes / recorded yes | none by contract; wiki vendor-learning recipe | tradable by content policy; original furnishing_item_kind listing tests cover a synthetic fixture, not this real ID |

Art lineage records executionHarness Codex and built-in image generation; 18 distinct calls include five corrected versions. Canonical conversion receipts and seven sealed review sheets exist. Final shipping icons total 33156 bytes. Runtime acceptance is a 42-capture manifest at docs/screenshots/freehold-crafted-content-2026-09-07/runtime/manifest.json, SHA256 09ab384da4112f60b75cf8ebff986451dad6fda709fef158dda160713c653832 (143845 bytes). Recorded six actual locales, all thirteen icons, real 48->0 Mark purchase sequences on desktop/mobile, bags/bank/trainer/tooltips/unsent mail; zero browser errors/unloaded images. Hardware LOW and final placement/GLB proofs are explicitly not supplied here.

Guide delta adds exactly ten craft recipe rows and the Hearth page. Pattern recipes use vendor acquisition in generated guide display. The two prose keys changed are guide.reliquaryPage.catalogBody and guide.profPages.craftProse.armorcrafting.ladderBody. The latter narrows 'trainer ladder' to 'equipment ladder' to avoid claiming nine total lessons after the new furnishing. A generated provisioning row also gains the inert supper table with placeable:false/station:false; hygiene/correctness reviewer should judge whether this existing recipe-category projection implies food behavior in its rendering (not established as a bug by this explorer).

## Tests added and exact assertion coverage

- furnishing_recipes: exactly ten unique canonical recipe/result index merges, literal seven trainer/three pattern craft/station identities, exact bill+stand-in transform equality to SHA-pinned calibration, deep freeze; seven real trainer command flows with range/skill/money/refusal/replay and three pattern trainer negatives.
- furnishing_pattern_items: exact 3 shapes/IDs/names/qualities/price rows; 7/3 acquisition partition; every real pattern used from named bag slot at skill50, consumes clicked copy only while locked sibling survives, learns+wireRev/trainResult; repeat at skill0 reports already-known; unpracticed profession and skill49 refusal preserve bag/copper/knowledge; wrong/malformed/stale slot and dead denials; each real purchase twice at 16 Marks no copper/no learning; insufficient Marks/dead/range/full-bag negatives preserve possessions.
- furnishing_crafting: ten actual craft executions consume exact bill and 40 copper, create one signer-only furnishing and unchanged auras; ten wrong-station negatives; 50-cast capped signed-discount batch and retained remainder, full bags, late missing materials stop batch, ordinary/Jack full same-seed state/events/next RNG draws.
- freehold_crafted_availability: dark host keeps complete catalogs but hides ten recipe list entries, denies trainer/craft/acquire and pattern use/vendor purchase without possessions or RNG mutation.
- freehold_crafted_presentation: real client starts dark, strict true hello capability, extracted legacy hello/copy-anchor equivalence, exactly seven lesson and three stock-row filtering, malformed boolean negatives, reconnect in both directions with state preservation and UI capability refresh.
- freehold_crafted_art: literal thirteen IDs, sealed final source hash, original/master/shipping hashes, 18 calls/5 corrections, exact references and canonical receipts, seven review sheets and native-size/circular comparisons.
- recipe_visibility: stable cached dark list, shared live lit catalog, append/splice invalidation with furnishing filtering.
- freehold_content extends 18 furnishing literal identities, dimensions/r/decor/resale, outer+placement field closed shape, no power/stack/use/bind/list-deny, finite positive costs/radius with exact rug zero-radius exceptions, skill50/budget20/level15/result1 per recipe, exact ten Hearth profession sources.
- apex_pattern_channels adds seventh disjoint furnishing family; complete drop partition 76 = gear10+armor10+consumable13+farm6+rod1+Crucible33+furnishing3; furnishing channels must equal ['vendor']; shipped pattern floor55/non-Crucible43/recipes taught76/enchants taught1. Existing no-fourth-channel broad sweeps now include furnishing IDs automatically.
- recipe_economy still sweeps ALL_RECIPES with no exception list for 'never vendors above inputs', material supply, discount/max skill and gold sink. Change adds literal seven furnishing trainer rows to referential inventory. It did not add a furnishing-specific profit exemption.
- provisioner_firewall adds complete ten-bill eligibility sweep, produce only cooking/alchemy, every protected keystone/catalyst/non-exempt gear intermediate rejected for all ten, and can-fail positive/negative controls for all crop base/fine produce, all eight forbidden crafts, all seeds, non-furnishing outputs, nonexistent material, plus allowed copper.
- professions_crafting_hub adds explicit station-required entries for chart/glow/jewel because those three crafts lack craft-map stations. Existing bound rows for the other seven are automatically swept.
- recipe_pattern_items is unchanged but global shipped shape/tradability sweep includes all three; prior generic resolver, deny order, real online slot teaching tests remain. furnishing_pattern_items drives the actual useItem -> useRecipePatternItem -> resolvePatternLearn chain, so direct resolver import is unnecessary for success coverage.
- professions_blob_growth pins ten new known-recipe IDs, 215 total with retired, 19161 profession bytes, 211458 total character, exact 1255 growth attribution and counterfactual 210203; cap remains 20480 and warning229376.
- Remaining changed tests are explicit catalog inventory/fixture opt-in/source boundary re-pins. The complete per-file added assertions are in /tmp/freeholds-crafted-test-additions.json; their file inventory is appended below.

## Validation to run at the final tree

Original required command matrix:

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

Add actual changed-surface tests: furnishing_recipes/furnishing_crafting/freehold_crafted_availability/freehold_crafted_presentation/freehold_crafted_art/recipe_visibility/professions_blob_growth; sim_context+monolith_budget; snapshots/env_protocol/bandwidth+housing chain; world_api_parity/command_schema/command_facets for cfg surface; server HTTP surface/error/retention/API parity floor; hud_update_drive/mobile_window_coverage/renderer_compile_gate; owning UI/server suites. Mutation challenge must delete one quartermaster row in a scratch copy and observe the channel suite fail, then restore. All existing code remains untouched by explorer; parent owns exact executions.

Reviewer minimum: independent correctness, test coverage and hygiene; content-obligations-reviewer, test-coverage-auditor, then qa-checklist. Actual runtime/wire/UI/growth changes additionally trigger architecture, cross-platform, security, frontend, database before+after, persistence, and server-hot-path read work. Eight exact JSON formatter exclusions are added in biome.json for immutable hash-bound bytes; gate-integrity review can assess no lint/pipeline weakening. Registered Codex equivalent roles are allowed; content/hot-path/gate reviewer concerns lacking a registered role must use corresponding .claude/agents criteria in a read-only fallback. No reviewer repeats parent gate.

## Findings and uncertainties for adjudication

1. High confidence requirement conflict: nonempty professions diff vs literal freeze. Mechanics gates are unchanged; D85 dark-host feature guards are new. Must resolve expressly before PASS, no silent waiver.
2. High confidence planning drift: QA 43-total/sixth-family and map-only all-ten constraints are stale against baseline Crucible and signed explicit station bindings. Correct current literal truth above; reconcile docs/report.
3. Documentation nit: progress/state say 'four authorized commits' but omit their IDs, while QA specifically says commits named in row04. Record actual hashes in final evidence/ledger.
4. Check stale local guidance: professions module map does not mention new train_recipe/recipe_visibility, training.ts header still says effects live in Sim.trainRecipe. Root says source seams and moved-source documentation remain accurate; assess current merge before fixing because upstream changed guidance.
5. Potential generated provisioning categorization: inert supper-table included in guide provisioning cooking list; no power payload exists, but renderer semantics need assessment before declaring it harmless.
6. No claimed channel-deletion mutation evidence yet. Existing exact channel assertion is strong but QA specifically requires running the can-fail mutation.
7. All recorded implementation validation belongs to original tip, not merged final tree; no old pass substitutes for current runs.

Do not re-open historical prior-pair QA findings, retune accepted development numbers, or treat production signatures as current implementation failures. These remain explicitly gated artifacts.

## Complete changed-file inventory

- `CREDITS.md`
- `biome.json`
- `docs/freeholds/content-numbers-workbook.md`
- `docs/freeholds/crafted-content-art-2026-09-07/README.md`
- `docs/freeholds/crafted-content-art-2026-09-07/catalog-verification.json`
- `docs/freeholds/crafted-content-art-2026-09-07/items.accepted-art.json`
- `docs/freeholds/crafted-content-art-2026-09-07/master-review-1.webp`
- `docs/freeholds/crafted-content-art-2026-09-07/master-review-2.webp`
- `docs/freeholds/crafted-content-art-2026-09-07/master-review-3.webp`
- `docs/freeholds/crafted-content-art-2026-09-07/master-review-4.webp`
- `docs/freeholds/crafted-content-art-2026-09-07/naming-originality.json`
- `docs/freeholds/crafted-content-art-2026-09-07/rug-framing-final.webp`
- `docs/freeholds/crafted-content-art-2026-09-07/shipping-size-review-final.webp`
- `docs/freeholds/crafted-content-art-2026-09-07/shipping-size-review.webp`
- `docs/freeholds/crafted-content-art-2026-09-07/staged-art-v2.json`
- `docs/freeholds/crafted-content-art-2026-09-07/staged-art.json`
- `docs/freeholds/crafted-content-trial-2026-09-07/acceptance.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/calibration.json`
- `docs/freeholds/crafted-content-trial-2026-09-07/calibration.sha256`
- `docs/freeholds/crafted-content-trial-2026-09-07/economy-measurements.json`
- `docs/freeholds/crafted-content-trial-2026-09-07/economy-source-hashes.json`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-brazier-inspection.png`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-chart-inspection.png`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-jewel-inspection.png`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-measurements.json`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-proposal.json`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-rack-inspection.png`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-review.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-table-inspection.png`
- `docs/freeholds/crafted-content-trial-2026-09-07/geometry-validation.json`
- `docs/freeholds/crafted-content-trial-2026-09-07/implementation-validation.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/proposal.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/economy-coverage.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/final-coverage.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-authority.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-content.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-coverage.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-database-performance.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-fresh-fix.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-parity.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-persistence.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-qa.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-sim.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-visual.md`
- `docs/freeholds/crafted-content-trial-2026-09-07/validation.md`
- `docs/freeholds/progress.md`
- `docs/freeholds/state.md`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/capture-guide-prose.mjs`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/capture-mobile.mjs`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/capture.mjs`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/catalog-prose-1440.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/catalog-prose-390.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-bags-thirteen-icons.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-bank-thirteen-icons.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-furnishing-tooltip.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-hearth-en.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-hearth-ja_JP.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-hearth-ko_KR.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-hearth-ru_RU.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-hearth-zh_CN.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-hearth-zh_TW.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-mail-pattern-parcels.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-pattern-tooltip.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-quartermaster-after-purchase.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-quartermaster-patterns.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-trainer-affordable.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-trainer-locked.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/desktop-trainer-no-copper.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/guide-desktop.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/guide-mobile.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/manifest.json`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-bags-thirteen-icons.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-bank-lower-icons.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-bank-thirteen-icons.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-en.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-ja_JP.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-ko_KR.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-lower-en.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-lower-ja_JP.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-lower-ko_KR.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-lower-ru_RU.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-lower-zh_CN.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-lower-zh_TW.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-ru_RU.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-zh_CN.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-hearth-zh_TW.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-mail-pattern-parcels.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-portrait-orientation.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-quartermaster-after-purchase.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-quartermaster-patterns.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-trainer-affordable.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-trainer-locked.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/mobile-landscape-trainer-no-copper.png`
- `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/vite.config.mjs`
- `public/ui/items/freehold_chart_easel.webp`
- `public/ui/items/freehold_clockwork_lamp.webp`
- `public/ui/items/freehold_glass_floor_lamp.webp`
- `public/ui/items/freehold_glow_lantern.webp`
- `public/ui/items/freehold_hide_armchair.webp`
- `public/ui/items/freehold_iron_brazier.webp`
- `public/ui/items/freehold_jewel_floor_lamp.webp`
- `public/ui/items/freehold_patchwork_rug.webp`
- `public/ui/items/freehold_set_supper_table.webp`
- `public/ui/items/freehold_weapon_rack.webp`
- `public/ui/items/mapping.json`
- `public/ui/items/pattern_freehold_chart_easel.webp`
- `public/ui/items/pattern_freehold_clockwork_lamp.webp`
- `public/ui/items/pattern_freehold_jewel_floor_lamp.webp`
- `scripts/freeholds/crafted_economy_measure.mjs`
- `scripts/freeholds/crafted_economy_probe.ts`
- `scripts/freeholds/crafted_geometry_inspection.mjs`
- `scripts/freeholds/crafted_geometry_measure.mjs`
- `scripts/item_art_audit.mjs`
- `server/game.ts`
- `server/world_hello.ts`
- `src/guide/content.generated.ts`
- `src/net/item_copy_anchor_wire.ts`
- `src/net/online.ts`
- `src/sim/content/freehold/furnishing_patterns.ts`
- `src/sim/content/freehold/furnishing_recipes.ts`
- `src/sim/content/freehold/furnishings.ts`
- `src/sim/content/freehold/index.ts`
- `src/sim/content/heroic_vendor.ts`
- `src/sim/content/recipes.ts`
- `src/sim/content/reliquary.ts`
- `src/sim/data.ts`
- `src/sim/freehold/crafted_availability.ts`
- `src/sim/freehold/index.ts`
- `src/sim/instances/heroic_vendor.ts`
- `src/sim/professions/crafting.ts`
- `src/sim/professions/pattern_items.ts`
- `src/sim/professions/recipe_visibility.ts`
- `src/sim/professions/train_recipe.ts`
- `src/sim/sim.ts`
- `src/ui/hud.ts`
- `src/ui/hud/professions/crafting_view.ts`
- `src/ui/hud/vendor/heroic_vendor_view.ts`
- `src/ui/hud/vendor/train_view.ts`
- `src/ui/i18n.catalog/guide.ts`
- `src/ui/i18n.catalog/items.ts`
- `src/ui/i18n.catalog/translation_keys.generated.ts`
- `src/ui/i18n.locales/ja_JP.ts`
- `src/ui/i18n.locales/ko_KR.ts`
- `src/ui/i18n.locales/ru_RU.ts`
- `src/ui/i18n.locales/zh_CN.ts`
- `src/ui/i18n.locales/zh_TW.ts`
- `src/ui/i18n.resolved.generated/cs_CZ.ts`
- `src/ui/i18n.resolved.generated/da_DK.ts`
- `src/ui/i18n.resolved.generated/de_DE.ts`
- `src/ui/i18n.resolved.generated/en.ts`
- `src/ui/i18n.resolved.generated/en_CA.ts`
- `src/ui/i18n.resolved.generated/en_XA.ts`
- `src/ui/i18n.resolved.generated/es.ts`
- `src/ui/i18n.resolved.generated/es_ES.ts`
- `src/ui/i18n.resolved.generated/fr_CA.ts`
- `src/ui/i18n.resolved.generated/fr_FR.ts`
- `src/ui/i18n.resolved.generated/id_ID.ts`
- `src/ui/i18n.resolved.generated/it_IT.ts`
- `src/ui/i18n.resolved.generated/ja_JP.ts`
- `src/ui/i18n.resolved.generated/ko_KR.ts`
- `src/ui/i18n.resolved.generated/nl_NL.ts`
- `src/ui/i18n.resolved.generated/pending.ts`
- `src/ui/i18n.resolved.generated/pl_PL.ts`
- `src/ui/i18n.resolved.generated/pt_BR.ts`
- `src/ui/i18n.resolved.generated/ru_RU.ts`
- `src/ui/i18n.resolved.generated/sv_SE.ts`
- `src/ui/i18n.resolved.generated/tr_TR.ts`
- `src/ui/i18n.resolved.generated/vi_VN.ts`
- `src/ui/i18n.resolved.generated/zh_CN.ts`
- `src/ui/i18n.resolved.generated/zh_TW.ts`
- `src/ui/reliquary_i18n.locales/cs_CZ.ts`
- `src/ui/reliquary_i18n.locales/da_DK.ts`
- `src/ui/reliquary_i18n.locales/de_DE.ts`
- `src/ui/reliquary_i18n.locales/es.ts`
- `src/ui/reliquary_i18n.locales/fr_FR.ts`
- `src/ui/reliquary_i18n.locales/id_ID.ts`
- `src/ui/reliquary_i18n.locales/it_IT.ts`
- `src/ui/reliquary_i18n.locales/ja_JP.ts`
- `src/ui/reliquary_i18n.locales/ko_KR.ts`
- `src/ui/reliquary_i18n.locales/nl_NL.ts`
- `src/ui/reliquary_i18n.locales/pl_PL.ts`
- `src/ui/reliquary_i18n.locales/pt_BR.ts`
- `src/ui/reliquary_i18n.locales/ru_RU.ts`
- `src/ui/reliquary_i18n.locales/sv_SE.ts`
- `src/ui/reliquary_i18n.locales/tr_TR.ts`
- `src/ui/reliquary_i18n.locales/vi_VN.ts`
- `src/ui/reliquary_i18n.locales/zh_CN.ts`
- `src/ui/reliquary_i18n.locales/zh_TW.ts`
- `src/world_api/entity_roster.ts`
- `tests/apex_pattern_channels.test.ts`
- `tests/apex_pattern_items.test.ts`
- `tests/bag_filter.test.ts`
- `tests/crafted_item_tooltip_coverage.test.ts`
- `tests/crafting_reagent_refresh.test.ts`
- `tests/crucible_reliquary.test.ts`
- `tests/deeds_content.test.ts`
- `tests/exchange_eligibility.test.ts`
- `tests/freehold_content.test.ts`
- `tests/freehold_crafted_art.test.ts`
- `tests/freehold_crafted_availability.test.ts`
- `tests/freehold_crafted_presentation.test.ts`
- `tests/freehold_module.test.ts`
- `tests/furnishing_crafting.test.ts`
- `tests/furnishing_item_kind.test.ts`
- `tests/furnishing_pattern_items.test.ts`
- `tests/furnishing_recipes.test.ts`
- `tests/guide.test.ts`
- `tests/guide_reliquary_hearth.test.ts`
- `tests/helpers/bare_client.ts`
- `tests/heroic_vendor.test.ts`
- `tests/hud_update_drive.test.ts`
- `tests/item_art_audit_builder.test.ts`
- `tests/item_art_consistency.test.ts`
- `tests/masterwrought_art_completion.test.ts`
- `tests/monolith_budget.test.ts`
- `tests/professions_blob_growth.test.ts`
- `tests/professions_craft_xp.test.ts`
- `tests/professions_crafting_hub.test.ts`
- `tests/profile_page.test.ts`
- `tests/provisioner_firewall.test.ts`
- `tests/provisioning_supply_line.test.ts`
- `tests/provisioning_supply_line_apex.test.ts`
- `tests/recipe_economy.test.ts`
- `tests/recipe_visibility.test.ts`
- `tests/reliquary_content.test.ts`
- `tests/reliquary_empty_shelf.test.ts`
- `tests/reliquary_hearth_shelf.test.ts`
- `tests/reliquary_hearth_window.test.ts`
- `tests/reliquary_i18n.test.ts`
- `tests/reliquary_state.test.ts`
- `tests/shipped_item_ids.golden.json`
- `tests/train_window_hud.test.ts`


Correction during STEP 2 hygiene review: the original furnishing_item_kind listing assertions use a synthetic fixture; they do not exercise all thirteen real item IDs. The table above is corrected. Parent-owned worker is adding real-ID coverage during QA; this original exploration report does not claim that work is already verified.
