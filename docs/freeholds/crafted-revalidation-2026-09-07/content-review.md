# Fresh crafted furnishings content-obligations review

Reviewed worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, HEAD `7f4fe99619`. Scope is the existing contribution in `86eb86bbe2`, `8bd097d898`, `b3c2452b49`, `3666d89647` and its subsequent repairs. Release-branch changes unrelated to this cohort are not treated as new furnishing content. Review used the content-obligations-reviewer criteria, root/local guidance, live source, tests, signed development evidence, and direct inspection of the final icon sheet. No source was edited and no test or generator was executed by this reviewer.

## Verdict

PASS for the reviewed content obligations. No new correctness gap, missing obligation, or nit found. Existing guide classification, provenance-reference and calibration-source repairs are present. This is a content review, not the final shared-gate verdict or authorization to activate production.

Parent-run validation inspected in `/tmp/freeholds-content-scoped-tests.log`: the requested scoped invocation reports **17 files, 721 tests passed** at the current merged HEAD. Parent also reports `npx tsc --noEmit` passed. Wiki/i18n regeneration and current shared gate remain parent-owned; this report does not substitute historical logs for their current results. Additional art, acquisition and recipe suites were read for decisive coverage, not rerun.

## Record inventory

Every output below has recipe ID `recipe_<output ID>` and committed art `/public/ui/items/<output ID>.webp`.

| Output ID | Craft / station | Learning | Per-record obligation verdict |
|---|---|---|---|
| `freehold_weapon_rack` | weaponcrafting / forge | trainer | PASS |
| `freehold_iron_brazier` | armorcrafting / forge | trainer | PASS |
| `freehold_patchwork_rug` | tailoring / loom | trainer | PASS |
| `freehold_hide_armchair` | leatherworking / tannery | trainer | PASS |
| `freehold_clockwork_lamp` | engineering / toolworks | pattern | PASS |
| `freehold_glass_floor_lamp` | alchemy / apothecary | trainer | PASS |
| `freehold_chart_easel` | inscription / apothecary | pattern | PASS |
| `freehold_jewel_floor_lamp` | jewelcrafting / forge | pattern | PASS |
| `freehold_set_supper_table` | cooking / kitchens | trainer | PASS |
| `freehold_glow_lantern` | enchanting / toolworks | trainer | PASS |

Teaching items: `pattern_freehold_clockwork_lamp`, `pattern_freehold_chart_easel`, `pattern_freehold_jewel_floor_lamp`. Each has PASS for exact definition, taught recipe, deterministic 16-Mark Quartermaster row, tradability, art/provenance and names. None is a Reliquary relic. The new page is `hearth_first_crafts`, following existing `hearth_basics`.

## Evidence and obligation decisions

1. **Book of Deeds: N-A.** This cohort adds crafted ornamental items and teaching documents, no new zone, rare, dungeon, delve, raid, boss or other conquerable encounter. It does not owe an invented encounter deed. Existing housing deeds and their tests remain available. Definitions in `src/sim/content/freehold/furnishings.ts:107` onward contain only furnishing fields; `tests/freehold_content.test.ts:283` checks the absence of stats, food, charges, use, binding and other power fields.

2. **Reliquary/Hearth: PASS.** `src/sim/content/reliquary.ts:1892` appends `hearth_first_crafts` with ten hand-listed output IDs, exact matching profession sources and `clearSource: { kind: 'none' }`. The three patterns do not occur as relics. `tests/freehold_content.test.ts:346` pins the exact ten outputs/source sequence. `tests/reliquary_content.test.ts:382` pins the two-page Hearth inventory, and its literal page size at `:3076` remains ten. No phantom overall Hearth cap or extra Wave B furniture was introduced.

3. **Wiki guide: PASS for source/content coverage; current freshness execution is parent-owned.** The generated catalog includes `hearth_first_crafts` at `src/guide/content.generated.ts:7954` and all ten recipe IDs. English prose at `src/ui/i18n.catalog/guide.ts:2312` names the seven trainers and three Marks documents and distinguishes patterns from relics. The previous edible-supper-table error is repaired: generated provisioning data at `src/guide/content.generated.ts:20533` classifies the actual table as furnishing, and the guide prose at `src/ui/i18n.catalog/guide.ts:3404` states that furnishing outputs give no food or buff. The ornamental tag at `:3407` is present. No new guide route or entity type is needed for these records.

4. **Art, names, originality and Codex execution: PASS.** All thirteen exact WebP paths are tracked by git. `public/ui/items/mapping.json:6665` owns this cohort under `freehold-crafted-2026-09-07`, points to the accepted manifest, and now names the correct v2 source. `CREDITS.md:170` attributes the original Codex/OpenAI-generated paintings. The accepted manifest seals `staged-art-v2.json` with SHA-256 `c9e46f0c5752513c11a0245800c02df872c57292a033eeabc4d940a5fc86875f`; it links thirteen shipping hashes to distinct originals and normalized masters, retains the superseded source lineage, and records canonical `npm run assets:items` receipts. `tests/freehold_crafted_art.test.ts:102` onward checks that seal, Codex producer identity, exact cohort, shipping bytes, opacity, size, original/master lineage, eighteen generation/edit calls and seven retained review sheets.

   Directly viewed `docs/freeholds/crafted-content-art-2026-09-07/shipping-size-review-final.webp`. All thirteen subjects are complete and recognizable at the shown inventory sizes. The rug retains its cloth silhouette in the circle; the three document illustrations visibly correspond to their actual output paintings; the jewel lamp has a floor base. Materials and lighting are coherent with the existing style. No regeneration or replacement is warranted. This inspection is not final-GLB, physical-device, or LOW-performance approval.

   English IDs/names are present at `src/ui/i18n.catalog/items.ts:3014` and `:3701`. All thirteen have actual `zh_CN`, `zh_TW`, `ja_JP`, `ko_KR`, `ru_RU` name values, with Hearth page entries in the corresponding Reliquary locale files. The names are descriptive generic object/document terms. The same-change `naming-originality.json` retains exact-phrase searches and the generic-vocabulary verdict for every item and First Hearth Crafts. No new named NPC/world entity is introduced by this cohort, so no extra world-entity ID registration is owed.

5. **Referential integrity and acquisition: PASS.** `src/sim/data.ts:359` merges pattern items beside farm patterns, while `src/sim/content/recipes.ts:4684` merges the furnishing recipe table. Output definitions and every reagent resolve through existing base/profession item sources. Verified the authored input IDs in `items.ts` and `profession_items.ts`, including barley/gourd, harvest components and Arcane Dust/Essence. `tests/furnishing_recipes.test.ts:55` pins one-to-one merged/indexed recipes and actual reagent definitions; its trainer arm drives all seven through real static-station training. `tests/furnishing_pattern_items.test.ts` drives all three selected bag-slot learns and the real Quartermaster purchase/refusal path. `src/sim/content/heroic_vendor.ts:250` contains precisely the three 16-Mark offers. The channel test retains seven disjoint recipe families, 55 teaching items (54 recipe documents plus one enchant formula), 76 taught recipes, 43 non-Crucible items and the Crucible cohort; furnishings use vendor-only acquisition. Protected-input and illegal-produce controls at `tests/provisioner_firewall.test.ts:523` onward remain substantive. The pattern 'drop' metadata denotes the existing manual-learning contract and does not introduce a luck route.

6. **Numeric source and no-power contract: PASS for accepted disabled development.** Compared every exact authored bill, craft/station/channel, output resale and footprint/radius/decor row against the workbook tables at `docs/freeholds/content-numbers-workbook.md:272` onward. All ten retain resultCount 1, skillReq 50, itemLevelBudget 20, level 15 and rare ornamental outputs. CAL-RECIPES-A specifies the existing 40-copper fee and seven 10000-copper trainer unlocks; CAL-PATTERNS-A fixes 16 Marks and 100-copper resale. In particular Glow Lantern remains 20 Arcane Essence and 6 Arcane Dust. `tests/freehold_content.test.ts:333` independently pins the shared recipe values, while `tests/furnishing_recipes.test.ts:90` pins the accepted exact bills/transforms and calibration hash. Its added evidence rows independently rehash the three formatter-exempt source artifacts.

   Acceptance is explicit in `docs/freeholds/crafted-content-trial-2026-09-07/acceptance.md`, tied to calibration SHA-256 `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`. These are accepted housing-development tuning, not invented classic-era combat formulas. The immutable proposal's old pending fields are correctly interpreted through the separate acceptance record. `productionApproved` remains false. Final model geometry, room packing/navigation, hardware LOW, production calibration and activation remain later gates.

## Boundary retained

Historical QA F01 concerns the older literal profession-path freeze. The parent is reconciling it prospectively against the current request's narrower `evaluateCraftAdmission`/`resolveTrain` protection using `/tmp/freeholds-protected-functions.json`. This review supplies no implicit waiver and does not rewrite that historical FAIL. No new content failure follows from the reviewed exact records, and the already repaired content findings should not be duplicated.

Final check lines: **1 Deeds N-A; 2 Reliquary PASS; 3 Wiki source coverage PASS (current freshness parent-owned); 4 Art/names PASS; 5 Referential integrity PASS; 6 Accepted development numbers PASS.**
