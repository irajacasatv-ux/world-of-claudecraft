# UI merge resolution

Owned files: `src/ui/bag_item_context_menu.ts`, `src/ui/hud.ts`, and `src/ui/i18n.catalog/hud_chrome.ts`. Resolution compared index stages 1, 2, and 3; no file outside this ownership was edited.

## Decisions

- The context menu keeps the furnishing-only lock/unlock early return and omits the default use row for that kind. The full menu forwards both upstream material source arguments into `bagItemNewActions`, preserving view/separate/take/combine actions for eligible materials.
- The shared item tooltip keeps `furnishingTooltipLines(item, instance)` and the extracted mount tooltip integration. The maker line now calls upstream `materialMakersMarkLines(item, instance, materialSources)` only for non-furnishings. That helper includes legacy signed-item fallback; the furnishing core already paints its own maker line, so unconditional composition would duplicate it. Upstream material provenance, required-level and vendor-line extractions remain intact.
- The English catalog keeps all four housing keys and the independent upstream unavailable-material-selection key. No locale overlay or generated file was edited.

## Coverage concerns and nits for the packet audit

1. Existing comments in the touched UI files still contain the word forbidden by the packet hygiene criterion (run the packet word scan); these originated before this conflict resolution. Keep the hygiene auditor responsible for scope-wide cleanup.
2. Tooltip composition still invokes shared instance, combat and consumable helper branches before the housing lines. The furnishing type and runtime gate audit must prove synthetic/malformed instance payloads cannot advertise or confer power; this resolution only preserves existing composition.
3. Generated translations remain the parent's regeneration responsibility. A fresh generator run is required before typechecking the merged housing and material keys.
4. The context-menu regression matrix should pass material-source arguments on a furnishing control as well as real materials, to prove the early furnishing refusal is not weakened by upstream source actions.

## Verification boundary

No tests, formatter, typecheck, staging, or commits were run, per ownership instructions. Static combined diff inspection confirms the three owned files contain no conflict markers and that furnishing integrations coexist with upstream additions. The parent owns regeneration and shared validation.

## Tooltip test integration repair

Additional ownership: `tests/furnishing_tooltip_view.test.ts` only. The initial shared scoped run failed four composed tooltip cases at `this.sim.player.level`, because the prototype-only HUD fixture had no world after upstream extracted `itemRequiredLevelLine`. The fixture now supplies a real `Sim` over the existing `EMPTY_TEST_WORLD`, typed through `IWorld`; every production tooltip branch remains live and all existing assertions are preserved.

The same run emitted unrelated GLTF texture loading warnings because the DOM host imported character preview and portrait asset preloads. Added the existing peer-test mocks for `render/characters`, `render/characters/assets`, and `render/characters/portrait`, following `tests/action_bar_hud_facade.test.ts` and `tests/ground_aim_hud.test.ts`. No tooltip renderer helper, item data, or behavior under test is mocked. The suggested `tests/gathering_source_inspect.test.ts` does not exist in this checkout.

Two fixture issues addressed: missing live world (the four failures share one cause) and unrelated character asset side effects. No test or typecheck was run by this worker; the parent owns the shared rerun. No files were staged or committed.

## C2 / H1 furnishing card power claims and H2 directory contract

Owner files: `src/ui/hud/housing/`, `src/ui/hud.ts`, and `tests/furnishing_tooltip_view.test.ts`. Applied the extract-and-test and tooltip-writing skills. Parent ran the new tests before source edits and recorded eleven failures in `tooltip-red.log`: ten exposed unsupported shared-card claims and one was the new source-reader fixture using an HTTP import URL in happy-dom. The source reader now uses the repository-relative path. Parent also caught the new test armor fixture using an invalid armor weight and a broad union spread; the fixture now narrows to the armor union arm and uses mail.

The existing housing composer now exports `furnishingItemTooltip`, called as an early return from the real HUD item tooltip. It composes only furnishing identity and authored quality, source-resolved placement rows, copy maker/lock, def-level Soulbound, the existing party-trade deadline line, and vendor value. It does not run the generic equipment, consumable, heroic, enchant, Masterwork, Perfecting, or Rift card branches. Equipment-only heroic aliases and promoted copy names cannot rename the furnishing. No source item or instance is mutated. The pure placement core is unchanged and has no runtime imports. The parent explicitly agreed to preserve the existing party-trade wording and to avoid commission-only binding descriptions or new housing keys.

Tests exercise the real HUD with independently literal gear/food controls, valid furnishing plus valid power-bearing copies, inherited heroic tags, malformed equipment/consumable records, copy immutability, and retained rarity/vendor/placement/lock/soulbound/maker/deadline facts. A compiled-output guard explicitly proves the placement core has no runtime import closure or direct browser/Three host access. Existing escaped maker and action-bar assertions remain intact. The local directory contract now anchors `FurnishingTooltipRow` instead of a counted inventory and documents the full card boundary and narrow IWorld deadline dependency.

The HUD line count is 18,663, below its pre-fix 18,664 baseline; no new coordinator logic beyond the early dispatch. No generated files, locale overlays, or assets were edited. Parent owns post-fix tests, typecheck, formatting, gate, staging, commits and fresh review; this report does not predeclare their results.

## Loaded equipment display projections

Additional ownership: `src/ui/item_compare.ts`, `src/ui/hud/player_card/player_card_data.ts`, and `tests/item_compare.test.ts`, alongside the existing HUD and furnishing tooltip test. Cross-platform review found that a loaded furnishing in an equipment slot could change comparison and damage-source displays even after the simulation stopped granting its power. Tests first pinned furnishing as both comparison candidate and equipped item, real armor/weapon controls, actual HUD hover differences, actual HUD stat-source rows, and actual player-card damage text from restored character state. The parent red run was five failures and 43 passes in two files (`display-red.log`), proving the three affected display surfaces before source changes.

`itemStatDeltas` now refuses a furnishing candidate and treats equipped furnishing power as absent, including rolled stats, weapon DPS, affixes, warfare, and ratings. HUD stat sources require positively eligible gear and its DPS branch requires weapon kind. Player-card DPS uses the same positive weapon-kind boundary. Saved equipment and copy payloads remain unchanged. Removed the unused player-card `itemDisplayName` import. Parent later reported the display rerun at 56 passes in three files and typecheck exit 0.

## Custody deadline wording

The generic party trade line claimed that equipping a furnishing could end its trade window. Exact live one-minute and one-hour furnishing sentences plus ordinary gear controls failed twice before source changes (`custody-tooltip-red.log`); expiry controls already passed. `instancePartyTradeLine` now accepts the item kind and uses a generic custody-only English key for furnishing. Equipment keeps the original equip-closure sentence and all paths still resolve time through the actual IWorld deadline method. The shared helper header now describes this distinction.

The coordinator explicitly approved the separate generic `hudChrome.itemTooltip.partyTradeWindowCustody` key and recorded its compatibility with the locked housing inventory: the four housing leaves and six furnishing label leaves remain unchanged. The contributor i18n exemption is a separate exact-key predicate AND membership in the generated locale's pending registry. Tests prove the predicate rejects absent pending membership, related/suffixed keys, and unknown keys. The parent regenerated all derived files; this worker edited only the canonical English catalog and predicate tests. This fixes the earlier report's temporary decision to preserve the original wording.

## F1 shared owned-cell identity, quality, glyph, and accessible facts

Frontend review found raw copied power still changing furnishing names, legendary rims, Masterwork/enchant corner marks, and accessible names in bags, banks, and other shared item cells. The initial four-suite red run recorded five failures and 56 passes (`cell-red.log`). The new pure `itemPresentationInstance` core keeps only signer, lock, bound recipient, bind-on-trade, and party deadline data for furnishing. It returns a fresh projection without changing storage; a copy with no supported facts stays present as an empty payload so its generic marker remains. Other item kinds and unknown definitions preserve the original reference and behavior.

The shared projection now feeds `wornItemCellParts`, tooltip identity/quality, and `bagInstanceGlyphKind`. `itemDisplayName` no longer resolves furnishing through an equipment-only heroic alias. Known bag, personal-bank, guild-bank, and vault cells pass their kind into glyph selection and the shared accessible-key resolver; an unsigned furnishing's generic mark uses the existing plain item accessible name instead of claiming a maker. Signed, bound, lock, unknown-id, and ordinary gear semantics remain intact. `bagQualityKey` accepts the existing weak row shape. `effectiveQuality`'s input contract now names its sole property read; generic `tooltipEffectiveQuality` preserves the actual fallback quality type, eliminating the inherited false ItemDef cast from bag rows.

Tests include authored name/rare quality with real promoted gear controls; actual bag, personal-bank, and guild-bank cells for signed and unsigned copied power; an independent locked bag case; and direct pure-core cases for Masterwork, bare rolled enchant stats, explicit enchant, name, quality, Perfected, rank, binding, bonus, charges, worn recipe marker, and Rift data. Every unsigned power-only fixture asserts the exact empty projection and generic/plain accessible result. Separate tests pin exact retained custody data, immutable input, bound/false flags, absent copy, and original references for weapon, armor, junk, and unknown kinds. Test review caught and resolved one fixture using the nonexistent kind `material`; its eligible material control now uses `junk`.

The new pure module is registered in `UI_PURE_CORES`; existing bank/guild painter contract pins now require kind-aware shared calls. No further HUD lines were added. Parent owns all formatting, final matrices, gate, commits, and the independent review of the entire fix round. Reviewers `frontend_reviewer` and `test_coverage_auditor` have been sent the completed F1 source/test inventory.

The finishing readers requested two F1 boundary pins, now applied: `boundTo: 0` retains its real binding marker (the projection uses definedness), and an empty signer is unsigned for furnishing, matching the existing housing maker row. An explicit empty-signer test preserves legacy gear's previous behavior while requiring furnishing generic/plain accessible facts. The parent approved the source normalization and reported the initial post-fix cell matrix at 158 passing tests in eight files. Its final rerun includes these boundaries and the corrected weak-kind control table, including an explicit unknown string.
