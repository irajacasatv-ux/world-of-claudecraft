# Crafted furnishings correctness audit

Reviewer: fresh read-only correctness auditor. Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`. Reviewed current HEAD `0932963250`, using pre-content baseline `86eb86bbe2^` (`49ed3f09333f4f1293edda9a98fe590c5651c20e`) and the individually requested implementation/repair commits. The broad baseline-to-HEAD range includes upstream integration, so unrelated upstream edits were not attributed to this content task.

**Inspection verdict: PASS. Verified findings: 0, including nits. Runtime/shared gate status: pending coordinator evidence.** No repository files were changed, no tests or gates were launched, and no assets were generated. This report is not the contribution's final PASS; the coordinator owns fresh execution, mutation checks, and the remaining reviewer reports.

## Protected behavior and simulation invariants

- High-confidence independent declaration comparison: TypeScript AST parsing of the complete `evaluateCraftAdmission` declaration at `src/sim/professions/crafting.ts:628` produced identical 8,599-byte before/current declarations, SHA-256 `02084dd3b64fc40fc1f15bf18226964176f232ebd763829ca9402728772870c3`. The complete `resolveTrain` declaration at `src/sim/professions/training.ts:138` is also byte-identical, 1,040 bytes, SHA-256 `ca7437959bbc99f2f155217bc25f8a8b0f9ffb5b420808ae83728567fc90bbd3`. Comparison ran against current working-tree contents, not only the historical revalidation report.
- Inspected every requested profession-source diff. `crafting.ts` adds availability guards at acquisition, direct resolution, maximum-count projection, and command admission. It does not alter the protected admission function, reagent planner, removal order, craft fee, teach tiers, or RNG draw sites. `training.ts` changes only the command-owner comment. `pattern_items.ts` changes a comment; the existing rollback already cloned/restored knowledge before this task.
- `src/sim/professions/train_recipe.ts:9` moves the existing command body and adds the availability decision before validation and payment. Dead/caller resolution, successful fee subtraction followed by acquisition, last-result assignment, personal result arguments and void return are preserved. `src/sim/sim.ts:8718` is a thin delegate. `ctx.stationPlacements` reads the identical live facade array (`sim.ts:5070`); `ctx.emit` is bound through `(ev) => sim.emit(ev)` (`sim.ts:5392`). No new or repurposed SimContext callback is introduced.
- The new availability leaf and recipe visibility projection use content and the host capability only. The projection cache keys catalog length, matching the existing recipe lookup's documented append/remove contract; lit hosts return the original catalog and dark hosts retain filtered identity. No player/world state is cached. No new Math.random, wall-clock read, DOM/browser/Three import, or tick-phase reordering occurs in this task's sim changes. New behavior is in focused modules; the coordinator shrinks.
- `tests/furnishing_crafting.test.ts:195` directly replays trainer/pattern acquisition and crafting for ordinary and Jack characters with identical events, saves, and RNG continuation. It pins zero draws for learning/start, one ordinary draw per completed craft, and two for Jack. Execution belongs to the coordinator.

## Ten recipes and unchanged station bindings

All IDs below use recipe prefix `recipe_freehold_` and output prefix `freehold_`. Every recipe has skillReq **50**, itemLevelBudget **20**, level **15**, resultCount **1**, and a rare furnishing output. Seven training fees remain the shared **10,000 copper** fee; successful craft sink is the existing **40 copper** charge, with its existing broke-character semantics unchanged.

| Suffix | Craft | Station | Acquisition | Exact bill |
|---|---|---|---|---|
| weapon_rack | weaponcrafting | forge | trainer | elderwood_log 1; thorium_ore 2; rough_hide 2; smithing_flux 1 |
| iron_brazier | armorcrafting | forge | trainer | thorium_ore 4; iron_ore 24; smithing_flux 2 |
| patchwork_rug | tailoring | loom | trainer | sunpetal_herb 1; homespun_cloth 4; spool_of_thread 2 |
| hide_armchair | leatherworking | tannery | trainer | pristine_hide 1; rough_hide 4; thorium_ore 1; tanning_agent 2 |
| clockwork_lamp | engineering | toolworks | drop-pattern | copper_ore 6; smithing_flux 2; arcane_dust 3 |
| glass_floor_lamp | alchemy | apothecary | trainer | pristine_venom_gland 1; venom_gland 2; frost_gourd 1; sunpetal_herb 1; glass_vial 1 |
| chart_easel | inscription | apothecary | drop-pattern | sunpetal_herb 2; arcane_essence 2; glass_vial 1; goldleaf_herb 2 |
| jewel_floor_lamp | jewelcrafting | forge | drop-pattern | thorium_ore 4; arcane_essence 2; smithing_flux 2; iron_ore 2 |
| set_supper_table | cooking | kitchens | trainer | prime_cut 1; game_meat 4; highland_barley 2; frost_gourd 2; sunpetal_herb 1; cooking_salt 2 |
| glow_lantern | enchanting | toolworks | trainer | arcane_essence 20; arcane_dust 6 |

Source: `src/sim/content/freehold/furnishing_recipes.ts:5` (individual rows begin at 7, 36, 61, 86, 115, 140, 173, 202, 231, 268). Seven physical-station bindings agree with the unchanged `STATION_TYPE_BY_CRAFT` at `src/sim/content/professions.ts:536`. Inscription/apothecary, jewelcrafting/forge and enchanting/toolworks explicitly preserve existing recipe-bound legacy stations. No station is introduced or remapped.

Produce occurs in exactly the alchemy and cooking rows. No seed, keystone, Masterwrought protected intermediate, Perfecting material, or gear-chain output is present. Tier terminology must keep its existing distinction: `material_tier.ts` is the masterwork price-band classification, while gather/progression tiers are separate. Under that source, elderwood/sunpetal are tier 2, iron/thorium/goldleaf tier 1, and all other listed bill IDs default to tier 0. No tier table changed.

## Pattern/channel contract

The exact three items are `pattern_freehold_clockwork_lamp` (Schematic), `pattern_freehold_chart_easel` (Technique), and `pattern_freehold_jewel_floor_lamp` (Design), all rare with sellValue 100 and one taught recipe each (`src/sim/content/freehold/furnishing_patterns.ts:5`). Their taught recipes have exactly `acquisition: ['drop']`; this is the established physical-manual learning route, not a new loot channel.

Each has exactly one Heroic Quartermaster stock row at **16 Marks** (`src/sim/content/heroic_vendor.ts:250`). The seven trainer recipes have no manual def. The recipe-derived universe and exact channel comparisons cover furnishing patterns and refuse extra raid, dungeon, rift, ordinary vendor, quest, gather, fishing, mail, ground-object, starter, crafting-result and delve-cache/shop channels. Furnishing patterns resolve to exactly `['vendor']` in `tests/apex_pattern_channels.test.ts:253`. No new drop function or random draw is added.

The channel suite's header at line 17 correctly states **55 teaching items = 54 recipe manuals teaching 76 drop recipes + 1 enchant formula**. Actual literal pins are at `tests/apex_pattern_channels.test.ts:177`, `:679`, `:680`, and `:699`: 76 drop recipes, 55 total teaching items, 43 non-Crucible teaching items, 76 recipes taught and one enchant. Seven disjoint families have literals 10 gear + 10 armor + 13 consumable + 6 farm + 1 rod + 33 Crucible + 3 furnishing. The older apex-source header labels its 28 as historical, not the current merged total; it does not need to pretend furnishing manuals are apex records.

## Numeric authority, geometry, neutrality, and market

The accepted immutable development payload is `docs/freeholds/crafted-content-trial-2026-09-07/calibration.json`, SHA-256 `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`. Its accompanying `acceptance.md` explicitly supersedes the proposal's historical pending status for development only and accepts the exact bills, resale, prices, transforms, footprints, radii and decor costs. The context explorer independently supplies the workbook/manifest reconciliation. The current records match the ten selected forms: the jewel lamp is floor-supported, all ten use floor surfaces, and the rug is a walk-through underlay. There is no inferred ceiling/tabletop form, Wave A chandelier, or extra furnishing behind a pattern.

All ten output records (`src/sim/content/freehold/furnishings.ts:107`) carry only id/name/kind/quality/sellValue/furnishing, and furnishing only footprint/r/decorCost/surface. No stats, equip slot, use, buff, aura or feast payload is authored. `craftBonusStatsFor` already refuses furnishing stats (`crafting.ts:165`), while existing rare-copy signer behavior remains. Runtime tests expect the output to contain only its maker payload and unchanged character auras (`tests/furnishing_crafting.test.ts:53`). Exact geometry/resale and narrow field-shape pins are at `tests/freehold_content.test.ts:240`; skill/budget literals are at `:333`.

`tests/recipe_economy.test.ts:140` walks the full ALL_RECIPES catalog, including all ten, and requires output vendor value strictly below the shared input valuation; the ten-record content pin prevents disappearance from shrinking coverage. `tests/provisioner_firewall.test.ts:539` covers every bill with positive and negative controls, including both produce crafts.

R18 is satisfied by unchanged market eligibility: no furnishing carries soulbound/noMarketList and the existing anonymous-copy transfer rules accept its maker-only payload. `tests/furnishing_market_catalog.test.ts:52` lists and reclaims every one of the ten outputs plus three patterns; `:81` does the same for each exact signer-only furnishing copy while preserving a plain sibling. Market runtime code was not changed by this task.

The appended Hearth page (`src/sim/content/reliquary.ts:1892`) lists the ten outputs, never pattern IDs. It adds no generic page cap. Final GLBs and their geometry/navigation/performance approval remain the explicit Wave A close gate owned by 19; the signed development stand-ins and current inspection do not waive it.

## Availability and no-spend refusal

`src/sim/freehold/crafted_availability.ts:9` is reused at acquisition (`crafting.ts:372`), direct craft (`:840`), maximum count (`:1316`), cast-start (`:1493`), trainer command (`train_recipe.ts:9`), and Marks purchase (`instances/heroic_vendor.ts:30`). A dark refusal precedes fee/material/Mark consumption and leaves already-retained recipes/items valid catalog identities. Pattern learning keeps the selected copy and rolls back prior knowledge on mint refusal using the pre-existing rollback at `pattern_items.ts:148`. The pure protected validators remain unchanged.

`tests/freehold_crafted_availability.test.ts` covers all ten refused training/direct-grant/craft attempts with unchanged inventory/copper/known-recipe retention and zero RNG draws, all three selected pattern refusals, and all three refused Marks purchases with an ordinary existing-pattern positive control. `tests/furnishing_recipes.test.ts:153` drives all seven successful trainer paths and refusal/retry cases. `tests/furnishing_pattern_items.test.ts:126` drives selected-slot learning through the live item command and validates exactly one copy consumed, one learned recipe, locked sibling identity preserved, duplicate refusal, and zero-practice/tier refusals.

## Scope interpretation and remaining evidence

The current user-adopted scope protects `evaluateCraftAdmission`, `resolveTrain`, station bindings, and training/economy semantics. It expressly supersedes the historical whole-professions-directory prohibition. The focused command extraction and availability guards comply; retaining the old prohibition as a present defect would contradict the reconciled request.

No remediation is needed from this correctness inspection. Shared runtime results, negative mutation execution, art obligations and final QA completion are owned by the coordinator/other reviewers. This reviewer has not relabeled historical implementation checks as newly run evidence.
