# Crafted furnishings and Quartermaster patterns: hygiene coverage

Scope: read-only STEP 2 DEAD CODE AND HYGIENE review in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`. Reviewed original commits `86eb86bbe2`, `8bd097d898`, `b3c2452b49`, `3666d89647`, repair commits `ea3b62fad1`, `47655ffb54`, `1be1aef461`, `85f99f6a32`, `5f4821bec7`, `b379ee462d`, and documentation commit `0932963250`, plus current owning source. Added-line scans used each named commit individually; broad baseline ranges were not attributed wholesale to the feature. Initial `git status --short` was clean. No repository mutation, test, gate, generator, or asset production was run by this reviewer. The only writes were this report and a `/tmp` scope inventory.

## Findings

### HN1: P3, high confidence: new runtime content consumers bypass the documented content barrel

Locations: `src/sim/content/freehold/index.ts:1`, `src/sim/data.ts:8`, `src/sim/freehold/crafted_availability.ts:3`.

`src/sim/content/freehold/CLAUDE.md:3` states: “Data only, exposed through `index.ts`.” The new `FURNISHING_PATTERN_ITEMS` catalog is absent from that public surface and `data.ts` imports the leaf directly. The new availability module also imports `FREEHOLD_CRAFTED_FURNISHING_IDS` directly from `furnishings.ts`, although that symbol is already exposed through the barrel. This leaves the documented public API incomplete and establishes avoidable runtime exceptions for future callers.

This is introduced by the original crafting/pattern commits and remains in the current candidate. Inspection of every content/freehold module import shows no runtime edge back into `data.ts` or the behavior package that would justify a cycle escape. `furnishing_patterns.ts`, `furnishings.ts`, and `furnishing_recipes.ts` have only type imports. The one runtime sibling dependency is ledger_schedule to ledger_trial. Existing test-level direct leaf imports predate this change and need no wholesale rewrite.

Suggested fix: add an explicit `FURNISHING_PATTERN_ITEMS` export to the content barrel, merge the `data.ts` import into its existing content/freehold import, and route the availability module through that content barrel. This is a maintainability nit, not evidence of incorrect furnishing behavior. No new bespoke test is necessary; the existing architecture and content gates should verify the import-only repair.

## Coverage and negative evidence

| Concern | Evidence and result |
|---|---|
| Unused imports | Lexical named-import identifier scans over current changed non-generated source/tool/test files found no identifier used only in its import. Actual new exported functions were followed to runtime consumers. This heuristic does not substitute for parent TypeScript/Biome execution. |
| Unused exports | `isFreeholdCraftAvailable`, `recipesForFreeholdAvailability`, `trainRecipe`, `buildWorldHello`, `anchorFields`, `craftingWindowRefreshSig`, and `buildHeroicVendorViewForWorld` all have actual runtime consumers. The accepted stand-in catalog is consumed by geometry/content pins and deliberately reserves later model/placement input, so it is not an abandoned runtime branch. |
| TODO/debug residue | No introduced TODO/FIXME/XXX/debugger/focused-only markers found in the named feature changes. |
| Core import invariant | New sim modules remain deterministic content or SimContext/pure leaves. No new DOM, render/ui/game/net/Three imports or Math.random/Date.now/performance.now calls found. The barrel finding is an internal convention issue, not a host-purity failure. |
| Banned vocabulary | Added code/comment/tool/test lines in the named commits contain no whole-word phase/rent or banned phrase real estate. All eleven full commit messages were scanned and are clear. Formal numbered packet filenames and historical planning labels are workflow references, not introduced player/code vocabulary. |
| Typography | All added text in the eleven named commits, including docs, generated text, and commit messages, scanned clear for em/en dashes and emoji in the configured pictographic range. Native locale punctuation is assessed under the canonical reviewer exception rather than silently rewritten. |
| Commit hygiene | The eleven commits have scoped Conventional Commit subjects and explanatory bodies. No forbidden word in their messages. |
| Generated artifacts | No affirmative evidence of hand editing. Guide/i18n generated changes have matching owning source changes. The weight artifact commit explicitly records measured batches and owning-generator production. A historical diff alone cannot prove generator execution; parent reruns and clean status remain required for guide/i18n freshness. |
| Locale overlays | Five global non-Latin overlays were touched. The item names and guide prose changes fall under the explicit M16 same-change exception at src/ui/CLAUDE.md:458. Separate Reliquary dictionaries add the new page names/prose and follow their owning typed schema. No broad unrelated translation fill was found. |
| Pattern Reliquary membership | None of the three pattern_freehold IDs occurs in `src/sim/content/reliquary.ts`. The page collects the ten output furnishings. |
| Formatter ownership | The two previously unneeded exclusions for accepted-art and naming-originality are removed. The six remaining crafted exclusions preserve byte-sealed source artifacts, not generated-code bypasses. |

## Shipping art and provenance checks

The thirteen accepted target IDs exactly equal the thirteen asset rows. Every shipping file exists. Each exact current SHA-256 and byte count matches its accepted row; total shipping size is 33,156 bytes. Every ID appears in exactly one generated mapping batch, `freehold-crafted-2026-09-07`. There is no missing target, extra accepted row, duplicate ownership, or orphan shipping WebP in this cohort.

The thirteen IDs are: freehold_weapon_rack, freehold_iron_brazier, freehold_patchwork_rug, freehold_hide_armchair, freehold_clockwork_lamp, freehold_glass_floor_lamp, freehold_chart_easel, freehold_jewel_floor_lamp, freehold_set_supper_table, freehold_glow_lantern, pattern_freehold_clockwork_lamp, pattern_freehold_chart_easel, and pattern_freehold_jewel_floor_lamp.

The sealed v2 source record, all seven retained review WebPs, and the 42-capture runtime manifest exist and independently match their recorded byte counts and SHA-256 hashes. Historical/superseded review sheets are explicitly referenced, so they are evidence retention rather than orphan runtime icons. The accepted record declares Codex execution, OpenAI built-in image generation, and conversion through `scripts/convert_item_icons_webp.mjs`. This verifies recorded provenance integrity; this reviewer did not regenerate art or claim to observe historical tool calls.

Final GLB acceptance remains outside these icon records and is explicitly limited in the accepted-art metadata. No icon evidence is being treated as a model placement/performance approval.

## Prior repair round and inherited material

The earlier hygiene receipt under `docs/freeholds/crafted-qa-2026-09-07/reviews/hygiene.md` was used as a candidate checklist, not as an independent verdict. Current source confirms the profession module map now documents train_recipe and recipe_visibility; freehold guidance names actual availability consumers; unnecessary formatter exclusions are removed. Historical comments/locale text from upstream are not relabeled as changes introduced by this packet. No new finding is asserted from the earlier receipt without current evidence.

## Limits and verdict

One actionable finding (HN1), no confirmed runtime dead-code or host-purity defect, and no additional uncertain finding retained after checking the evidence. Parent owns the required typecheck, generator-freshness checks, shared gate and full acceptance checks. This report does not independently certify those checks as run. Resolve HN1 and have the fresh fix reviewer inspect the final import repair before closing this hygiene slice.
