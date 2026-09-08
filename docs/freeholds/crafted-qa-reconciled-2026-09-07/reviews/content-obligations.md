# Crafted furnishing content obligations review

Scope: required content-obligations-reviewer, COVERAGE, read-only. Reviewed the specified original implementation commits (86eb86bbe2, 8bd097d898, b3c2452b49, 3666d89647), repair commits (ea3b62fad1, 47655ffb54, 1be1aef461, 85f99f6a32, 5f4821bec7, b379ee462d), and current content/art/localization state. Planning manifest and signed-number requirements were supplied by the required context explorer. No implementation, asset generation, tests, regeneration, or gates were run by this reviewer. Parent owns deterministic validation once.

Result: no confirmed actionable content-obligation defects or nits. Inspection PASS, conditional on the parent's required fresh tests/regeneration. The report does not declare the packet or production ready.

## Records and obligations

All rows below have exactly named committed WebP art, one current mapping owner (freehold-crafted-2026-09-07), matching accepted shipping hash, an English item catalog entry, all five non-Latin name fills, and a shipped-id golden entry. Furnishing outputs are the exact ten selected manifest forms, each rare, kind furnishing, surface floor, with r/decorCost and no combat/food/feast payload. Pattern records are recipe items, never extra furniture outputs.

| Item id | Form / teaching identity | Acquisition | Hearth relic |
| --- | --- | --- | --- |
| freehold_weapon_rack | Empty freestanding timber weapon rack | weaponcrafting trainer recipe | Yes |
| freehold_iron_brazier | Raised iron bowl | armorcrafting trainer recipe | Yes |
| freehold_patchwork_rug | Flat patchwork underlay, r 0 | tailoring trainer recipe | Yes |
| freehold_hide_armchair | Hide, stitching, timber armchair | leatherworking trainer recipe | Yes |
| freehold_clockwork_lamp | Weighted floor lamp with winding detail | engineering pattern recipe | Yes |
| freehold_glass_floor_lamp | Amber vessel in floor frame | alchemy trainer recipe | Yes |
| freehold_chart_easel | Freestanding decorative chart | inscription pattern recipe | Yes |
| freehold_jewel_floor_lamp | Faceted jewel in stable floor setting | jewelcrafting pattern recipe | Yes |
| freehold_set_supper_table | Inert set table | cooking trainer recipe | Yes |
| freehold_glow_lantern | Floor cage and contained glow | enchanting trainer recipe | Yes |
| pattern_freehold_clockwork_lamp | Schematic: Clockwork Lamp | One quartermaster row, 16 Marks | No |
| pattern_freehold_chart_easel | Technique: Chart Easel | One quartermaster row, 16 Marks | No |
| pattern_freehold_jewel_floor_lamp | Design: Jewel Floor Lamp | One quartermaster row, 16 Marks | No |

Evidence: src/sim/content/freehold/furnishings.ts:19, furnishing_recipes.ts:5, furnishing_patterns.ts:5; src/sim/content/heroic_vendor.ts:250; src/ui/i18n.catalog/items.ts:3014 and :3701; public/ui/items/mapping.json generatedBatches entry; tests/shipped_item_ids.golden.json. Item and pattern tables merge through src/sim/data.ts:364 and :391.

## Art execution, provenance, and quality

Read the canonical docs/design/item-icon-art-style.md, current producer README, staged-art-v2.json, items.accepted-art.json, and previous implementation-visual.md review. Independently checked 99 recursively referenced path/size/SHA-256 records across source and acceptance manifests: zero missing files, zero mismatches. These include retained ignored originals/512px masters, converter, references, current/historical sources, shipping files, and review artifacts. All thirteen shipping files match their accepted hashes, are unique, and are 1,952 to 3,336 bytes. Source evidence retains thirteen separate Codex built-in image generation results and five targeted edits, exact prompts and ordered edit references, conversion receipts, source/master/shipping metadata and supersession history. Current originals and masters remain available. CREDITS.md:170 attributes the batch correctly.

Visually inspected shipping-size-review-final.webp, master-review-3.webp, and desktop-hearth-ja_JP.png through the image viewer. The final sheet exposes every current item at 128/40/28/22px, grayscale and circular crop. Complete objects remain recognizable; rug framing is corrected, lamps are visually distinct, and the three document illustrations reproduce the output identities. The inert supper table shows tableware, the rack is empty, and jewel lighting is on a supported floor form. No visible text/pseudo-writing, quality frame, transparency, cropped subject, or visually mismatched pattern remains. Master-review-3 preserves the intended material and construction at larger size. The Japanese Hearth runtime capture shows the ten outputs and translated page prose in a readable panel.

Runtime acceptance is explicitly limited in items.accepted-art.json: 42 accepted desktop/mobile/guide captures, injected output inventory for presentation, actual quartermaster purchases, and no final GLB/placement or physical LOW profiling claim. This is accurate scope separation. Existing model stand-ins are specifically development-only; final models remain the named owner 19 Wave A close gate, not a defect deferred out of this audit.

Reference-method question considered and reconciled: the reusable generation brief recommends feeding an identity image, same-family painting and global anchors. This producer instead explicitly records agent-viewed house anchors for the initial text-only calls, with actual edit-target/output reference images in subsequent corrections. The canonical acceptance/provenance criteria require truthful reference roles, retained evidence and actual visual conformity; those are present. The prior visual review explicitly accepted the supported text-only method at implementation-visual.md:20, and the acceptance manifest records final quality. There is no false claim that style pixels were supplied. I do not classify a different initial prompting method by itself as a shipped content or quality defect, and did not generate art during QA.

## Localization, wiki, Deeds, and Reliquary

M16 is the express exception to the general contributor overlay prohibition. Every new item name has a real zh_CN/zh_TW/ja_JP/ko_KR/ru_RU value. Both new cooking guide keys (guide.profPages.prov.ladderBodyFurnishings and furnishingTag) also have all five fills. New Hearth page prose is present in the dedicated Reliquary locale tables, including all five non-Latin locales. The overlay edits needed to carry these fills are required work, not hygiene violations. Relevant rule: src/ui/CLAUDE.md:458.

The ten output relics are hand-listed exactly once on hearth_first_crafts, appended after hearth_basics, with the ten correct profession source hints and clearSource none. Patterns do not occur in this page or as Reliquary item ids. No arbitrary global Hearth page cap is added. Evidence: src/sim/content/reliquary.ts:1892. The generated guide includes hearth_first_crafts at src/guide/content.generated.ts:7954, and guide copy at src/ui/i18n.catalog/guide.ts:2312 explains the seven trainer/three Marks-document split and ornamental nature. Freshness itself requires the parent's actual generator/test execution.

No new conquerable zone, dungeon, delve, boss or rare is introduced by this content set, so it owes no new conquerable-content Deed. Existing furnishing/training accounting tests are changed, but this does not create a missing content Deed. Unrelated merged Roots' Bramblehide Deed additions are outside the specified content commits.

## Signed numeric and reference integrity

The producer's acceptance.md records Fernando's acceptance of freehold-crafted-development-calibration-v1, SHA-256 c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b. This is scoped to disabled development and explicitly authorizes thirteen final icons and same-change obligations. It does not authorize production activation or final GLBs.

The exact live bills, output resale values, rare quality, skillReq 50, budget 20, level 15, count 1, and pattern resale 100/Marks 16 agree with the signed calibration records inspected. All furnishing r/decor/footprint and stand-in transforms have corresponding accepted rows. The three pattern teachesRecipeId values resolve to their existing drop-acquisition recipes, quartermaster rows reference these real items, and the merged catalog contains the ten outputs. Seven crafts retain their existing station bindings and the three legacy bindings are inscription/apothecary, jewelcrafting/forge, enchanting/toolworks. Produce occurs in cooking and alchemy bills only. Detailed behavior and economy checks remain with correctness reviewer and parent suites.

Production numeric signatures and final geometry/room/navigation/LOW review remain explicit activation artifacts. Treating the accepted development numbers as unapproved guesses, demanding a ceiling chandelier now, requiring a delve pattern channel, imposing a Hearth cap, or demanding final GLBs now would contradict the reconciled scope.

## Per-check outcome

- Book of Deeds: N/A, no new conquerable content in this set.
- Reliquary pages: inspection PASS, exact curated ten outputs and no patterns; parent runs the required suites.
- Wiki guide: content/prose inspection PASS; fresh regeneration/test outcome pending parent evidence.
- Item art and names: inspection PASS; 99 evidence pins consistent, thirteen item rows complete, non-Latin fills present. Parent runs icon/i18n suites.
- Referential integrity: inspection PASS for output/recipe/pattern/quartermaster/Reliquary links. Parent runs merged catalog and channel suites.
- Balance numbers: inspection PASS against signed disabled-development payload; production and final-model approvals remain separate named gates.
