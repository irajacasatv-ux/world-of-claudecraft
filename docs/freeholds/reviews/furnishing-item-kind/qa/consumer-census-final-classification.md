# Final literal consumer census additions

Reviewed supplied census at sealed source commit `ce0e25ec85`. Input: `/tmp/freeholds-02-audit/consumer-census-final-additions.txt`; all 77 rows are classified individually below. `TOUCHED` includes guards moved by integration and guards/presentation calls added by QA. `UNTOUCHED-BY-DESIGN` requires a positive discriminator or a distinct union with no furnishing admission path. Line numbers refer to the supplied sealed snapshot.

This is a literal-search supplement, **not an overall PASS**. Q27 (Exchange quality/copy descriptors) and Q28 (Rift forge metadata admission) were missed property-driven consumers outside this literal list and remain open pending fixes and decisive tests. The earlier broader no-MISSED verdict is withdrawn.

| # | Source site | Classification | Reason |
|---:|---|---|---|
| 1 | src/sim/professions/gathering_goal_projection.ts:78 | UNTOUCHED-BY-DESIGN | `SavedGatheringGoal.kind`: invalid goal versus commission projection, not ItemKind. |
| 2 | src/sim/professions/gathering_goal_projection.ts:90 | UNTOUCHED-BY-DESIGN | Invalid saved-goal refusal; the discriminant describes a gathering goal. |
| 3 | src/ui/hud/professions/harvest_preference_view.ts:55 | UNTOUCHED-BY-DESIGN | Harvest preference option `all`, not an item definition. |
| 4 | src/ui/hud/professions/harvest_preference_view.ts:70 | UNTOUCHED-BY-DESIGN | Harvest preference `all` display arm; no item action. |
| 5 | src/ui/hud/professions/gathering_source_painter.ts:62 | UNTOUCHED-BY-DESIGN | Gathering source view `unknown` arm. |
| 6 | src/ui/hud/professions/gathering_source_painter.ts:77 | UNTOUCHED-BY-DESIGN | Gathering source view `corpse` arm. |
| 7 | src/ui/hud/professions/gathering_source_painter.ts:114 | UNTOUCHED-BY-DESIGN | Gathering source view `node` arm. |
| 8 | src/ui/hud/professions/gathering_source_painter.ts:139 | UNTOUCHED-BY-DESIGN | Gathering source view `farm` arm. |
| 9 | src/ui/hud/professions/gathering_goal_view.ts:133 | UNTOUCHED-BY-DESIGN | Harvest preference `material` discriminant selects the preferred material ID. |
| 10 | src/ui/hud/professions/gathering_goal_view.ts:173 | UNTOUCHED-BY-DESIGN | Saved goal `recipe` discriminant selects requested craft count. |
| 11 | src/sim/professions/perfecting_swap.ts:94 | TOUCHED | QA refuses furnishing before recipe and progress metadata can authorize a rank swap. |
| 12 | src/sim/material_sources.ts:142 | UNTOUCHED-BY-DESIGN | Material gatherer provenance `character` identity clone. |
| 13 | src/sim/material_sources.ts:184 | UNTOUCHED-BY-DESIGN | Validates a `character` gatherer identity, not an item kind. |
| 14 | src/sim/material_sources.ts:190 | UNTOUCHED-BY-DESIGN | Validates `offline` or `headless` gatherer identities, not item definitions. |
| 15 | src/ui/hud/professions/professions_harvest_entry_controller.ts:50 | UNTOUCHED-BY-DESIGN | Harvest preference signature includes material ID only in its material arm. |
| 16 | src/ui/hud/professions/professions_harvest_entry_controller.ts:60 | UNTOUCHED-BY-DESIGN | Localizes the `all` harvest preference label. |
| 17 | server/character_save_statement.ts:283 | UNTOUCHED-BY-DESIGN | `CharacterSaveFence.kind` refuses unleased database save routing. |
| 18 | server/character_save_statement.ts:286 | UNTOUCHED-BY-DESIGN | Database lease fence `nonce` arm. |
| 19 | server/character_save_statement.ts:294 | UNTOUCHED-BY-DESIGN | Database lease fence `nonce` arm. |
| 20 | server/character_save_statement.ts:372 | UNTOUCHED-BY-DESIGN | Database save fence rejects `unleased`; no item semantics. |
| 21 | src/sim/professions/perfecting_bonus.ts:23 | UNTOUCHED-BY-DESIGN | Positive `weapon` and `twohand` conjunction selects equipment multiplier; furnishing cannot satisfy the weapon predicate. |
| 22 | src/sim/professions/perfecting_bonus.ts:32 | TOUCHED | Original furnishing refusal retained in extracted Perfecting bonus lookup. |
| 23 | src/sim/professions/perfecting_bonus.ts:69 | TOUCHED | QA prevents a raw furnishing payload from receiving a Perfecting stat bonus. |
| 24 | src/ui/item_compare.ts:63 | TOUCHED | QA returns no power comparison rows for a furnishing candidate. |
| 25 | src/ui/item_compare.ts:64 | TOUCHED | QA excludes a furnishing already present in a decoded equipment slot from the comparison baseline. |
| 26 | src/ui/hud.ts:6444 | TOUCHED | Furnishing takes its dedicated tooltip composer before generic power branches. |
| 27 | src/ui/hud.ts:6876 | TOUCHED | QA computes weapon DPS only from a positive weapon kind. |
| 28 | src/ui/item_instance_tooltip.ts:181 | TOUCHED | QA uses the generic custody deadline sentence for furnishing, avoiding an impossible equip instruction. |
| 29 | src/ui/item_instance_tooltip.ts:397 | UNTOUCHED-BY-DESIGN | Material-source row `gatherer` identity display; not ItemKind. |
| 30 | src/sim/professions/corpse_harvest_inspection.ts:125 | UNTOUCHED-BY-DESIGN | Harvest preference material-selection arm. |
| 31 | src/sim/professions/harvest_preference.ts:199 | UNTOUCHED-BY-DESIGN | Harvest preference material ID resolver. |
| 32 | src/sim/professions/harvest_preference.ts:233 | UNTOUCHED-BY-DESIGN | Harvest preference `all` yields no preferred components. |
| 33 | src/ui/hud/professions/gathering_goal_painter.ts:136 | UNTOUCHED-BY-DESIGN | Gathering goal `commission` display, distinct from ItemKind. |
| 34 | src/ui/vault_window.ts:341 | TOUCHED | Outer `special` is a vault row union; QA threads the resolved item kind into the shared instance glyph projection. |
| 35 | src/ui/vault_window.ts:403 | UNTOUCHED-BY-DESIGN | `special` vault row decides whether instance material provenance exists; custody display only. |
| 36 | src/ui/vault_window.ts:413 | UNTOUCHED-BY-DESIGN | `special` vault row forwards its instance to the tooltip, whose furnishing route is guarded. |
| 37 | src/ui/vault_window.ts:430 | UNTOUCHED-BY-DESIGN | `special` vault row selects the identity-preserving slot operation, not power eligibility. |
| 38 | src/ui/material_sources_dialog.ts:162 | UNTOUCHED-BY-DESIGN | Material-source choice row `gatherer` identity arm. |
| 39 | src/sim/professions/harvest_admission.ts:180 | UNTOUCHED-BY-DESIGN | Harvest preference material-selection arm. |
| 40 | src/sim/professions/harvest_admission.ts:226 | UNTOUCHED-BY-DESIGN | Filters harvest preference options by their material arm. |
| 41 | src/sim/professions/harvest_admission.ts:230 | UNTOUCHED-BY-DESIGN | Resolved harvest admission `unavailable` result, not an item definition. |
| 42 | src/sim/professions/harvest_preference_commands.ts:16 | UNTOUCHED-BY-DESIGN | Harvest preference material ID selection. |
| 43 | src/sim/professions/gathering_goal_actions.ts:27 | UNTOUCHED-BY-DESIGN | Missing or invalid gathering goal disables its action. |
| 44 | src/sim/professions/gathering_goal_persist.ts:41 | UNTOUCHED-BY-DESIGN | Saved gathering goal validator's recipe arm. |
| 45 | src/sim/professions/gathering_goal_persist.ts:49 | UNTOUCHED-BY-DESIGN | Saved gathering goal validator's commission arm. |
| 46 | src/ui/item_instance_glyph_mark.ts:51 | TOUCHED | QA gives unsigned furnishing the plain item aria label instead of claiming a maker mark. |
| 47 | src/ui/hud/player_card/player_card_data.ts:45 | TOUCHED | QA positively gates peer card weapon DPS on weapon kind. |
| 48 | src/ui/hud/loot/loot_window_controller.ts:380 | UNTOUCHED-BY-DESIGN | Corpse harvest request status `settled`, not ItemKind. |
| 49 | src/sim/entity.ts:336 | TOUCHED | QA skips furnishing before reading authored or instance equipment power. |
| 50 | src/sim/entity.ts:419 | UNTOUCHED-BY-DESIGN | Aura kind `buff_str` contributes the active aura value; unrelated to ItemKind. |
| 51 | src/sim/guild_bank_material.ts:538 | UNTOUCHED-BY-DESIGN | Material movement replay format `legacy` versus exact sources. |
| 52 | src/sim/guild_bank_material.ts:581 | UNTOUCHED-BY-DESIGN | Inverse material movement replay format `legacy`, not item admission. |
| 53 | src/ui/hud/loot/corpse_harvest_window.ts:113 | UNTOUCHED-BY-DESIGN | Harvest preference `all` label. |
| 54 | src/ui/hud/loot/corpse_harvest_window.ts:122 | UNTOUCHED-BY-DESIGN | Corpse harvest view status `checking`. |
| 55 | src/ui/hud/loot/corpse_harvest_window.ts:123 | UNTOUCHED-BY-DESIGN | Corpse harvest view status `unavailable`. |
| 56 | src/ui/hud/loot/corpse_harvest_window.ts:145 | UNTOUCHED-BY-DESIGN | Harvest preference `material` selects an earned harvest tier bonus, not furnishing power. |
| 57 | src/ui/hud/loot/corpse_harvest_window.ts:151 | UNTOUCHED-BY-DESIGN | Harvest preference `all` presentation. |
| 58 | src/ui/hud/loot/corpse_harvest_view.ts:68 | UNTOUCHED-BY-DESIGN | Harvest preference options collect material IDs. |
| 59 | src/ui/hud/loot/corpse_harvest_view.ts:80 | UNTOUCHED-BY-DESIGN | Settled corpse harvest status with response data. |
| 60 | src/ui/hud/loot/corpse_harvest_view.ts:97 | UNTOUCHED-BY-DESIGN | Checking corpse harvest status. |
| 61 | src/ui/hud/loot/corpse_harvest_view.ts:152 | UNTOUCHED-BY-DESIGN | Checking corpse harvest view signature. |
| 62 | src/ui/hud/loot/corpse_harvest_view.ts:158 | UNTOUCHED-BY-DESIGN | Harvest preference `all` view signature. |
| 63 | src/sim/dev/bis_gear.ts:53 | UNTOUCHED-BY-DESIGN | Positive armor-or-weapon predicate excludes furnishing from developer best-gear selection. |
| 64 | src/sim/equipment_rules.ts:304 | TOUCHED | QA excludes furnishing from the incoming Masterwrought family cap calculation. |
| 65 | src/sim/equipment_rules.ts:311 | TOUCHED | QA excludes furnishing from already-worn Masterwrought family cap calculation. |
| 66 | src/sim/materials_vault.ts:651 | UNTOUCHED-BY-DESIGN | Transfer result union `refused`, not an item definition. |
| 67 | src/sim/materials_vault.ts:652 | UNTOUCHED-BY-DESIGN | Transfer result union `full`, not an item definition. |
| 68 | src/sim/combat/crafted_collection_effects.ts:68 | UNTOUCHED-BY-DESIGN | Entity `player` discriminator; collection power is derived through the guarded worn-set count. |
| 69 | src/sim/combat/crafted_collection_effects.ts:111 | UNTOUCHED-BY-DESIGN | Entity `player` discriminator for collection owner resolution. |
| 70 | src/sim/combat/crafted_collection_effects.ts:116 | UNTOUCHED-BY-DESIGN | Positive living, in-combat player and derived collection ID; ItemKind power is excluded upstream by the worn-set guard. |
| 71 | src/sim/combat/crafted_collection_effects.ts:123 | UNTOUCHED-BY-DESIGN | Entity `player` discriminator in collection event weighting. |
| 72 | src/sim/combat/crafted_collection_effects.ts:201 | UNTOUCHED-BY-DESIGN | Hostile ownerless mob event source predicate; Entity kind, not ItemKind. |
| 73 | src/sim/material_gatherer.ts:177 | UNTOUCHED-BY-DESIGN | Material gatherer identity distinguishes character from host-local identity. |
| 74 | src/sim/material_gatherer.ts:202 | UNTOUCHED-BY-DESIGN | Material gatherer identity `character` arm. |
| 75 | src/sim/combat/damage.ts:598 | UNTOUCHED-BY-DESIGN | Shield source Entity `player` discriminator; no item admission. |
| 76 | src/sim/guild_bank.ts:870 | UNTOUCHED-BY-DESIGN | Material move selection `exact` carries concrete provenance sources. |
| 77 | src/sim/set_bonus_mods.ts:39 | TOUCHED | QA excludes furnishing from shared worn-set counts before either client or sim can derive set power. |

Literal rows: **77 classified: 15 TOUCHED, 62 UNTOUCHED-BY-DESIGN, 0 MISSED within this supplied list**. Property-driven Q27/Q28 are outside the literal list and prevent an overall census PASS until resolved. No tests or gate commands were run by this reviewer; coordinator evidence remains the shared validation source.
