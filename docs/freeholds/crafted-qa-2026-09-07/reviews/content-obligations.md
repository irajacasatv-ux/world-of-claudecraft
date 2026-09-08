# Crafted furnishings content obligations review

Reviewed the thirteen item records below, their ten `recipe_freehold_*` recipe records, three quartermaster rows, and `hearth_first_crafts`. Scope: original range `49ed3f0933..3666d89647` against the current merged candidate in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`. This is the initial finishing review; the parent was still resolving/staging the merge during inspection. No repository edits, tests, generators, or art production were performed by this reviewer.

Parent-run evidence: `/tmp/freeholds-crafted-qa-content-first.log` records **22 test files, 744 tests passed**, started 16:37:17, duration 12.01s. The parent supplied the exact command:

```sh
npx vitest run tests/freehold_content.test.ts tests/furnishing_pattern_items.test.ts tests/apex_pattern_channels.test.ts tests/apex_pattern_items.test.ts tests/farm_pattern_items.test.ts tests/recipe_pattern_items.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/professions_crafting_hub.test.ts tests/train_view.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/reliquary_content.test.ts tests/market_filters.test.ts tests/furnishing_item_kind.test.ts tests/architecture.test.ts tests/furnishing_recipes.test.ts tests/furnishing_crafting.test.ts tests/freehold_crafted_availability.test.ts tests/freehold_crafted_presentation.test.ts tests/freehold_crafted_art.test.ts tests/recipe_visibility.test.ts --maxWorkers=4
```

This evidence includes the thirteen-asset hash/metadata/lineage test. It does not establish final wiki freshness, deeds, or M16 gate success; those remain in the parent's final command matrix. No previous-tip validation has been represented as a current-tree pass.

## Findings, including low-severity observations

1. **[WARNING / P2, high confidence] `src/guide/content.generated.ts:20517`, `src/guide/pages/professions_provisioning.ts:78`, `src/ui/i18n.catalog/guide.ts:3402`: the inert Set Supper Table is presented as an edible cooking output.** The generated row has `placeable: false` and `station: false`; the renderer appends a clarifying tag only for those two flags and otherwise emits a bare name. Its surrounding prose says early rungs are single dishes eaten from bags. The renderer's own header at `professions_provisioning.ts:69` explicitly recognizes this exact ambiguity for the prior mobile-station case. `freehold_set_supper_table` is `kind: 'furnishing'` with no food, aura, feast, or use payload (`src/sim/content/freehold/furnishings.ts:235`), so a player cannot eat it or gain a buff. This is a semantic obligation missed by regenerating an existing projection. Add a data-derived furnishing classification and translated ornamental/not-edible tag, make the surrounding prose accurate, regenerate, and cover the rendered output. The generator classification is `scripts/wiki/build_content.mjs:1374`; do not solve it by pretending the item is a feast. Reported to parent for repair.

2. **[INFO / P3, high confidence] `public/ui/items/mapping.json:6689`: the batch's `styleReference` prose points readers to `staged-art.json`, although final source ownership is `staged-art-v2.json`.** The actual `provenanceRecord` correctly resolves through the accepted manifest, whose `sourceEvidence` points to v2. There is no hash or runtime ownership failure. Updating the prose reference would remove a minor audit navigation ambiguity.

No other missing item, M16, Hearth, acquisition, or conquerable-content obligation was found in the inspected scope. No additional low-confidence gameplay concern is being suppressed.

## Exact thirteen-ID obligation table

`Art PASS` means the individually named `public/ui/items/<id>.webp` is in the accepted thirteen-ID batch at `public/ui/items/mapping.json:6665`, has an asset/sourceRecord entry in `docs/freeholds/crafted-content-art-2026-09-07/items.accepted-art.json`, and is covered by the passing final-source/sealed-shipping assertions in `tests/freehold_crafted_art.test.ts`. `Names PASS` means canonical English plus all five required non-Latin fills. Every output's recipe id is exactly `recipe_` followed by its item id.

| Item id | Canonical record | Acquisition / reference | WebP bytes / mapping / provenance | English + M16 | Hearth / wiki |
|---|---|---|---|---|---|
| `freehold_weapon_rack` | `furnishings.ts:107` | Weaponcrafting, trainer, forge | 1952 / Art PASS | Names PASS | Ordinary profession relic; recipe present |
| `freehold_iron_brazier` | `furnishings.ts:123` | Armorcrafting, trainer, forge | 2136 / Art PASS | Names PASS | Ordinary profession relic; recipe present |
| `freehold_patchwork_rug` | `furnishings.ts:139` | Tailoring, trainer, loom | 2376 / Art PASS | Names PASS | Ordinary profession relic; recipe present |
| `freehold_hide_armchair` | `furnishings.ts:155` | Leatherworking, trainer, tannery | 2452 / Art PASS | Names PASS | Ordinary profession relic; recipe present |
| `freehold_clockwork_lamp` | `furnishings.ts:171` | Engineering, schematic, toolworks | 2848 / Art PASS | Names PASS | Ordinary profession relic; wiki vendor acquisition |
| `freehold_glass_floor_lamp` | `furnishings.ts:187` | Alchemy, trainer, apothecary | 2346 / Art PASS | Names PASS | Ordinary profession relic; recipe present |
| `freehold_chart_easel` | `furnishings.ts:203` | Inscription, technique, apothecary | 2214 / Art PASS | Names PASS | Ordinary profession relic; wiki vendor acquisition |
| `freehold_jewel_floor_lamp` | `furnishings.ts:219` | Jewelcrafting, design, forge | 2348 / Art PASS | Names PASS | Ordinary profession relic; wiki vendor acquisition |
| `freehold_set_supper_table` | `furnishings.ts:235` | Cooking, trainer, kitchens | 2502 / Art PASS | Names PASS | Ordinary profession relic; recipe present; provisioning semantics FAIL |
| `freehold_glow_lantern` | `furnishings.ts:251` | Enchanting, trainer, toolworks | 2576 / Art PASS | Names PASS | Ordinary profession relic; recipe present |
| `pattern_freehold_clockwork_lamp` | `furnishing_patterns.ts:6` | Teaches `recipe_freehold_clockwork_lamp`; quartermaster 16 Marks | 2794 / Art PASS | Names PASS | Correctly excluded; wiki learned recipe says vendor |
| `pattern_freehold_chart_easel` | `furnishing_patterns.ts:14` | Teaches `recipe_freehold_chart_easel`; quartermaster 16 Marks | 3276 / Art PASS | Names PASS | Correctly excluded; wiki learned recipe says vendor |
| `pattern_freehold_jewel_floor_lamp` | `furnishing_patterns.ts:22` | Teaches `recipe_freehold_jewel_floor_lamp`; quartermaster 16 Marks | 3336 / Art PASS | Names PASS | Correctly excluded; wiki learned recipe says vendor |

Record paths in the table are under `src/sim/content/freehold/`. Pattern rows are `src/sim/content/heroic_vendor.ts:250`. Recipe records are the ten frozen rows of `src/sim/content/freehold/furnishing_recipes.ts:5`, spread into `src/sim/content/recipes.ts:4684`. Items merge through `src/sim/data.ts:364` and `:391`. The passing recipe and channel suites test referential integrity, seven trainer/three document separation, and the complete channel partition rather than inferring channels from filenames. Existing Crucible content makes furnishings the seventh family and the live item total 55; 43 is the non-Crucible subtotal.

English item IDs are at `src/ui/i18n.catalog/items.ts:3014`, with all thirteen English values at `:3701`. All thirteen actual localized name values were read in each overlay: `zh_CN.ts:15459`, `zh_TW.ts:15466`, `ja_JP.ts:15786`, `ko_KR.ts:15798`, `ru_RU.ts:16022` under `src/ui/i18n.locales/`. These are real fills, not English stubs. No new world-entity id registration is owed for ordinary items.

The new Hearth page is `src/sim/content/reliquary.ts:1892`: ten explicit `fromProfession` entries, `clearSource: { kind: 'none' }`, no personal-completion exclusion, and no pattern relic. Its description explicitly says seven trainer recipes, three quartermaster documents, and ornamental furnishings. The page name exists in all eighteen base Reliquary locale dictionaries; the five required non-Latin dictionaries also carry translated descriptions (`src/ui/reliquary_i18n.locales/{zh_CN,zh_TW}.ts:206`, `{ja_JP,ko_KR}.ts:207`, `ru_RU.ts:205`). The generated recipe rows for the three patterns say `acquisition: 'vendor'` at `src/guide/content.generated.ts:8855`, `:14563`, `:15311`. The updated catalog prose at `src/ui/i18n.catalog/guide.ts:2296` truthfully explains the same split and excludes documents from relics.

Provenance is explicit about the actual harness: accepted manifest `:4` and staged v2 source `:5` say `executionHarness: 'Codex'`; generator is OpenAI built-in image generation. The accepted manifest binds source v2 SHA256 `c9e46f0c5752513c11a0245800c02df872c57292a033eeabc4d940a5fc86875f`, carries all thirteen original/master/shipping records, and retains canonical conversion and visual review evidence. `CREDITS.md:170` attributes the thirteen paintings consistently. The passing art suite pins eighteen generation calls including five corrections and seven reviewed sheets. The checked-in originality record has an exact-name search record and generic-vocabulary verdict for all thirteen item names and `First Hearth Crafts`; no new coined term is present.

## Claim verdicts and limits

- Exactly ten inert outputs, one per existing craft: **PASS**.
- Exactly three correctly linked quartermaster-only teaching documents: **PASS**.
- Thirteen committed WebPs, one current mapping owner per ID, sealed provenance, actual Codex execution: **PASS**, with the styleReference navigation nit above.
- All thirteen canonical English names and five M16 name fills: **PASS by inspection**; final M16 execution remains parent-owned.
- Ordinary Hearth profession pages for outputs, patterns excluded: **PASS**.
- Wiki ten recipe records and truthful trainer/vendor acquisition: **PASS**.
- Wiki no false food/buff implications: **FAIL**, finding 1.
- New conquerable content or unique conquerable loot: **N-A**. No dungeon, delve, raid, boss, zone, rare, or encounter is added. Existing `homesteader_first_furnishing` and `homesteader_first_cottage` at `src/sim/content/deeds.ts:3324` and `:3333` already cover housing milestones; adding a deed per ordinary furniture recipe is not owed.
- Retuning accepted economy/geometry numbers: **N-A**. No combat formula is introduced. Approved development calibration is accepted context; production approval remains false.
- Final models, room packing/navigation/arrival, physical LOW hardware, production numeric activation: **still named release gates owned by 19/20**, not current implementation failures and not certified by this review. No assets were generated.
- Final merged-tree wiki/i18n/deeds/gate completion: **PENDING parent evidence and any repair**.

Six charter checks: **1 Book of Deeds N-A; 2 Reliquary PASS; 3 Wiki FAIL (semantic presentation), freshness pending; 4 Item art/names PASS by evidence/inspection, final M16 execution pending; 5 Referential integrity PASS; 6 Balance formulas N-A for new classic combat math, accepted development calibration preserved.**

Overall initial content-obligations verdict: **FAIL pending provisioning guide correction**, plus one nonblocking provenance prose nit. Final acceptance must attach current-tree final gates after the correction.
