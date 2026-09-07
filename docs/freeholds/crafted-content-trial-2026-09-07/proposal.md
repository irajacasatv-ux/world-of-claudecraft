# Crafted furnishings: progression proposal v1

Status: DEVELOPMENT TUNING PROPOSAL, awaiting Fernando acceptance. Production approval remains false.

This proposal answers Fernando's selected direction: seven mid-skill trainer recipes and three longer Marks goals. It supplies concrete recipe and pattern numbers; the geometry evidence supplies measured existing stand-ins. These are original housing calibration choices. Existing recipe values are comparators, not classic-era authority for housing rates.

## Decision to accept

Accept these exact ten recipe bills and outputs for disabled development: skillReq 50, itemLevelBudget 20, effective XP level 15, rare output quality, one furnishing per craft, and the existing station and acquisition seam. The seven trainer recipes cost 1 gold each to learn. Each craft costs 40 copper. The three pattern items cost 16 Marks each, 48 total, and each pattern has sellValue 100. Outputs and patterns remain tradable decor.

Accept the geometry-proposal and measured envelopes as temporary development mappings, including their documented visual differences. Final distinct icons remain due in this content implementation; final GLBs, room packing, navigation and LOW performance approval remain due under their existing gates. This acceptance does not approve production activation or claim a number of player hours.

## Why these numbers

50 is the established third skill band on the 125-point craft ladder. It requires advancement without entering the skill-75 intermediate chain. The same-craft mid-progression recipes anchor material burden. Engineering has no equivalent ordinary skill-50 equipment recipe, so its own existing ocular assembly supplies a lighter repeat-production bill behind the same learning and Marks requirement. Enchanting starts from its own charm material batch, then substitutes rare-gear Arcane Essence for the five epic/legendary-gear Arcane Shards. This removes the epic-salvage requirement without granting a charm or inheriting its effect.

All ten use the named rare-rung comparator recipe_weighted_thorium_band for skillReq 50, budget 20 and durable-output XP level 15. The live sink computes ceil(20 * 2) = 40 copper. The live training ladder computes 10,000 copper at this skill rung; only the seven trainer rows pay it. The pattern route pays Marks and consumes its pattern instead. These are learning thresholds; existing crafting admission is unchanged.

16 Marks is the exact premium pattern price of pattern_clockreel_fishing_rod, above the common 12-Mark pattern price. It is a one-time unlock: the learned recipe can be used again. This proposal sets no elapsed-time or boss-clear target.

For resale, the new proposed rule transfers the accepted vendor furnishing ratio 60/250 to the minimum counterfactual discounted bill and floors to whole copper. The minimum includes the currently unreachable Jack discount as an additional conservative sensitivity. This is a proposed new application of the ratio, not an existing craft pricing rule. Unsignable vendor staples are allowed in the all-signed counterfactual to make the lower bound stricter.

## Exact recipe table

All counts below are per craft. Input value uses the shared buyValue-if-positive, otherwise sellValue rule. It is a catalog diagnostic, not market value or actual gathering time. All rows output one item; the input table includes ordinary vendor binders.

| Furnishing | Craft / station | Learn | Bill | Catalog input (copper) | Minimum incl. sensitivity | Output resale (copper) |
|---|---|---|---|---:|---:|---:|
| Weapon Rack | weaponcrafting / forge | Trainer, 1 gold | elderwood_log 1, thorium_ore 2, rough_hide 2, smithing_flux 1 | 310 | 245 | 58 |
| Iron Brazier | armorcrafting / forge | Trainer, 1 gold | thorium_ore 4, iron_ore 24, smithing_flux 2 | 472 | 268 | 64 |
| Patchwork Rug | tailoring / loom | Trainer, 1 gold | sunpetal_herb 1, homespun_cloth 4, spool_of_thread 2 | 200 | 180 | 43 |
| Hide Armchair | leatherworking / tannery | Trainer, 1 gold | pristine_hide 1, rough_hide 4, thorium_ore 1, tanning_agent 2 | 137 | 111 | 26 |
| Clockwork Lamp | engineering / toolworks | 16 Marks pattern | copper_ore 6, smithing_flux 2, arcane_dust 3 | 82 | 38 | 9 |
| Glass Floor Lamp | alchemy / apothecary | Trainer, 1 gold | pristine_venom_gland 1, venom_gland 2, frost_gourd 1, sunpetal_herb 1, glass_vial 1 | 229 | 223 | 53 |
| Chart Easel | inscription / apothecary | 16 Marks pattern | sunpetal_herb 2, arcane_essence 2, glass_vial 1, goldleaf_herb 2 | 488 | 250 | 60 |
| Jewel Floor Lamp | jewelcrafting / forge | 16 Marks pattern | thorium_ore 4, arcane_essence 2, smithing_flux 2, iron_ore 2 | 332 | 166 | 39 |
| Set Supper Table | cooking / kitchens | Trainer, 1 gold | prime_cut 1, game_meat 4, highland_barley 2, frost_gourd 2, sunpetal_herb 1, cooking_salt 2 | 272 | 226 | 54 |
| Glow Lantern | enchanting / toolworks | Trainer, 1 gold | arcane_essence 20, arcane_dust 6 | 396 | 252 | 60 |

Every item ID is freehold_ followed by its manifest suffix; every recipe ID is recipe_ followed by the full item ID. The complete literal records, comparator records, source item definitions, eligibility witnesses and every discount case are in economy-measurements.json.

## Per-bill derivation

| Furnishing | Named live comparator | Transfer and rounding |
|---|---|---|
| Weapon Rack | recipe_elderwood_battle_staff | Copy the named comparator batch reagent IDs and counts exactly; no rounding. |
| Iron Brazier | recipe_thoriumscale_cuirass | Copy cuirass bill; replace the arcanite bar with equal-or-higher unit-value iron ore, ceil(value / iron unit value), merged with existing iron. No crafted intermediate remains. |
| Patchwork Rug | recipe_sunweave_mantle | Copy the named comparator batch reagent IDs and counts exactly; no rounding. |
| Hide Armchair | recipe_mirewarden_jerkin | Copy the named comparator batch reagent IDs and counts exactly; no rounding. |
| Clockwork Lamp | recipe_copperlens_ocular | Copy ocular assembly inputs; expand its one cogwheel through recipe_cogwheel_blank (one result per batch), summing duplicate raw copper. No intermediate or component crafting fee is billed. No count rounding. |
| Glass Floor Lamp | recipe_elixir_of_the_serpent | Copy the named comparator batch reagent IDs and counts exactly; no rounding. |
| Chart Easel | recipe_sunpetal_grimoire | Copy the named comparator batch reagent IDs and counts exactly; no rounding. |
| Jewel Floor Lamp | recipe_weighted_thorium_band | Copy the named comparator batch reagent IDs and counts exactly; no rounding. |
| Set Supper Table | recipe_marlows_grand_roast | Copy the named comparator batch reagent IDs and counts exactly; no rounding. |
| Glow Lantern | recipe_gatherers_cache | Replace five Arcane Shards (275 copper) with ceil(275 / 18) = 16 Arcane Essence, plus the original 4 essence. Keep 6 dust. Final input is 396 copper; the 13-copper increase comes from outward whole-unit rounding. |

The brazier substitution is arcanite_bar 1 (160 copper) / iron_ore (8 copper) = 20 iron, plus the existing 4 iron: 24 total. Its 472-copper listed input equals the original cuirass bill exactly. The lamp expands one cogwheel at its listed production inputs, not its resale value: 6 copper ore + 2 flux + 3 dust totals 82 copper. No intermediate crafting fee is charged because no intermediate is crafted by this new bill.

The glass lamp consumes the elixir comparator's whole batch but produces one durable decor object rather than two elixirs. The supper table consumes the roast batch but grants no food, Well Fed, charges, use action or aura. The recipe budgets never authorize combat stats.

Full workbook starter comparators are retained alongside the chosen progression comparators. They are context for the higher learning rung, not silently superseded or omitted. The supplied source graphs seal the exact code and definitions used.

## Measured development geometry

The exact table, transforms, source hashes and prototype limitations are in [geometry-review.md](geometry-review.md). The proposed 0.5-unit grid inherits the accepted trial method. Footprints and solid radii round outward from the actual transformed vertices; the rug stays a zero-radius underlay.

| Furnishing | Footprint cells | Solid radius (world units) | Decor cost |
|---|---|---:|---:|
| Weapon Rack | 3 x 2 | 1 | 1 |
| Iron Brazier | 2 x 2 | 0.5 | 7 |
| Patchwork Rug | 4 x 8 | 0 | 1 |
| Hide Armchair | 2 x 2 | 1 | 1 |
| Clockwork Lamp | 2 x 2 | 1 | 1 |
| Glass Floor Lamp | 2 x 2 | 1 | 1 |
| Chart Easel | 2 x 3 | 1 | 8 |
| Jewel Floor Lamp | 2 x 2 | 0.5 | 4 |
| Set Supper Table | 5 x 5 | 2 | 5 |
| Glow Lantern | 2 x 2 | 0.5 | 1 |

All ten cost 30 decor points; together with the eight vendor items, 51. The Cottage budget remains 60. This does not prove physical room fit. The chart and brazier are relatively costly because their existing measured models are more complex. The chair is a plain-chair proxy, the chart is a lectern proxy, and the three cage lamps do not yet have distinct craft appearances. The jewel-lamp proxy has a visible floor post and foot. Replacement models must be remeasured; approval covers only these development mappings.

## Verification and remaining gates

The offline economy producer runs its probe twice and requires byte-identical results. It executes 3,008 discount/signature cases, positive material controls and sixteen forbidden material controls, the 49/50 teaching boundary, pattern learning refusals at zero/49 and success at 50, and positive unattuned skill gain at 50 with none at cap 125. Its skill-gain checks do not claim all archetype configurations.

Maximum batch 50 is reported as arithmetic: 50 items and 2,000 copper craft fees, with per-material undiscounted totals. This is not yet a bag, vault, queue, output-grant or sequential skill-gain execution test. Those checks belong to the implementation after acceptance.

Production release still requires implementation tests, all content obligations, final model measurements, legal maximum room layouts, LOW/performance evidence, and the existing production numeric approvals. The development proposal does not retune published ledger rows, room caps, trainer fees, station gates or the shared economy.

## Reproduction

```sh
node scripts/freeholds/crafted_economy_measure.mjs --out /tmp/crafted-economy-recheck
```

Use a fresh output directory; the producer refuses to overwrite retained evidence. Geometry reproduction and exact stand-in limitations are in geometry-review.md. The complete acceptance payload is [calibration.json](calibration.json), sealed in [calibration.sha256](calibration.sha256). A separate approval record must name that exact version and hash after review. No approval is recorded by generating this document.
