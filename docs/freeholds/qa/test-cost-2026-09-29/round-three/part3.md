# Part 5, third slimming round, part 3 (item_copy_refusal to mob_warcry)

Scope: 103 files at 2 to 5 s of CI test time that built a full-world Sim with no scoped world.
Base `1d9af4a53b`; landed on feature/freeholds as `ce1a637897` to `1606bb9aa8` (8 commits, batched
by domain, cherry-picked clean). Method in `README.md` here.

## Verdicts

99 SLIM, 4 KEEP. The 99 changed files went from 267.93 s to 101.90 s of local test time (medians of
three interleaved batch runs at one worker), 62 percent less. Every SLIM file kills one source
mutant (99 of 99; the first mob_hex mutant hit a different hex mechanic and the re-aimed one is
killed). No expected value changed, and no case or assertion was removed. This part's NPC world
helper duplicated part 4's and was merged into `worldWithOnlyNpcs` at integration (`1de5a2b23a`).

Unless noted, the change is "empty world" and the mutant was killed. "Only X" means a world holding
only the named NPC.

| File | CI s | Verdict | Change | Local s before, after |
|---|---|---|---|---|
| item_copy_refusal | 2.4 | SLIM | only Trader Wilkes | 2.47, 1.64 |
| item_lock | 2.8 | SLIM | only Trader Wilkes | 4.13, 1.81 |
| item_sets | 2.8 | SLIM | one seed (was three); the pushback case on the first wolf camp | 4.14, 1.36 |
| jewelcrafting_flow | 3.6 | SLIM | | 3.77, 1.74 |
| keeper_revive_line | 3.0 | SLIM | | 2.51, 0.37 |
| lastkeep_map_view | 2.3 | SLIM | | 2.70, 0.44 |
| lightning_bolt_fx | 3.6 | SLIM | `RL_TEST_WORLD` | 2.66, 1.79 |
| listings_command | 3.0 | SLIM | | 2.16, 1.58 |
| loadout_action_bar | 2.7 | SLIM | | 1.88, 0.38 |
| loadout_gear_swap | 3.8 | SLIM | | 3.01, 0.40 |
| localization_fixes | 4.4 | SLIM | its one Sim case | 3.42, 1.96 |
| lockpick_session | 3.9 | SLIM | | 5.10, 0.69 |
| lockpick_timeout | 4.8 | SLIM | | 5.08, 0.77 |
| loot_messaging_sim | 3.6 | SLIM | | 3.14, 0.45 |
| loot_quality_drops | 2.7 | SLIM | | 3.85, 0.48 |
| loot_quality_rift | 3.0 | SLIM | only the rift forge | 2.34, 2.07 |
| loot_quality_wire | 2.8 | SLIM | | 2.12, 0.35 |
| loot_roll_awarded_event | 3.1 | SLIM | | 2.44, 1.68 |
| mage_barrier_scaling | 4.2 | SLIM | one seed (was two) | 4.49, 1.66 |
| mage_tuning_0713 | 3.0 | SLIM | | 2.22, 1.64 |
| mail_bot_welcome | 2.2 | SLIM | | 2.01, 0.38 |
| mail_custody_parcels | 3.7 | SLIM | | 3.77, 0.41 |
| main_hotfix_integration | 2.7 | SLIM | only the quartermaster for the staging case | 2.13, 1.57 |
| manaregen_command | 2.7 | SLIM | | 2.19, 1.60 |
| market_browse_cache | 3.8 | SLIM | only the Merchant | 2.64, 1.81 |
| market_filler_listings | 2.8 | SLIM | only the Merchant | 2.03, 1.60 |
| market_filters | 2.9 | SLIM | only the Merchant | 1.91, 1.66 |
| market_price_sort | 2.8 | SLIM | only the Merchant | 2.43, 1.60 |
| market_sweep | 2.1 | SLIM | only the Merchant | 2.42, 1.80 |
| material_exchange_books | 2.2 | SLIM | only the Merchant | 2.17, 1.58 |
| material_exchange_custody | 2.1 | SLIM | | 2.05, 0.35 |
| material_grade_substitution | 3.5 | SLIM | only the work-order giver | 2.90, 1.73 |
| material_inventory_hub | 3.2 | SLIM | | 2.33, 0.37 |
| material_signature_benefits | 2.8 | SLIM | | 2.72, 0.36 |
| material_slot_load | 3.1 | SLIM | | 2.19, 1.58 |
| material_source_storage_selection | 2.5 | KEEP | already a one-banker world, one seed; the grid build is its floor | 2.42 |
| material_stack_commands | 3.1 | SLIM | | 2.05, 1.59 |
| materials_vault_row_packing | 2.6 | KEEP | already a one-banker world, one seed | 1.67 |
| materials_vault_special | 2.5 | SLIM | one seed (the reload Sim was a second seed) | 2.83, 1.82 |
| melee_haste_additive | 3.1 | SLIM | | 2.02, 0.38 |
| mob_aoe_pulse_telegraph | 3.1 | SLIM | | 2.59, 0.44 |
| mob_arcane_rot | 4.5 | SLIM | one seed (was two); the refresh case zeroes the swing instead of riding hunted seed 31338 | 7.34, 1.84 |
| mob_bleed | 3.6 | SLIM | | 2.64, 1.66 |
| mob_blind | 3.0 | SLIM | | 2.16, 0.49 |
| mob_boss_mechanics | 2.5 | SLIM | | 2.45, 0.40 |
| mob_charge | 3.7 | SLIM | | 2.85, 1.73 |
| mob_chill | 2.5 | SLIM | | 2.11, 0.37 |
| mob_cinder | 3.2 | SLIM | | 2.43, 1.64 |
| mob_combat | 3.1 | SLIM | already one seed | 4.09, 1.81 |
| mob_corrode | 3.1 | SLIM | | 2.06, 0.41 |
| mob_cost_tax | 2.0 | SLIM | | 1.99, 0.38 |
| mob_critvuln | 3.0 | SLIM | | 2.21, 0.37 |
| mob_crowd_cost | 3.4 | KEEP | its one full-world case checks no world mob spawns near the test spot | 2.21 |
| mob_death_throes | 2.9 | SLIM | one Bog Bloat camp | 2.35, 1.66 |
| mob_demoralize | 4.6 | SLIM | one seed (was two) | 3.32, 0.41 |
| mob_desperate_heal | 3.4 | SLIM | | 2.40, 0.41 |
| mob_disarm | 3.7 | SLIM | | 2.85, 1.68 |
| mob_enervate | 2.4 | SLIM | | 2.27, 0.39 |
| mob_enfeeble | 3.2 | SLIM | | 2.20, 0.38 |
| mob_enrage | 3.2 | SLIM | the mob it re-templates is created, not borrowed from the world | 2.87, 0.39 |
| mob_ensnare | 2.7 | SLIM | | 2.02, 0.33 |
| mob_evade_support_kit | 2.7 | SLIM | | 2.24, 1.81 |
| mob_expose | 2.9 | SLIM | | 2.21, 0.36 |
| mob_flee | 4.1 | SLIM | `RL_TEST_WORLD` (the cases borrow its mobs) | 3.31, 2.07 |
| mob_frenzy_on_hit | 2.1 | SLIM | | 2.31, 0.36 |
| mob_frostbite | 3.8 | SLIM | | 3.55, 1.82 |
| mob_hard_leash | 2.6 | KEEP | sharing one world object measured no gain, reverted | 1.90, 1.90 |
| mob_heal_absorb | 3.0 | SLIM | | 2.44, 0.39 |
| mob_hex | 2.1 | SLIM | (the re-aimed mutant) | 2.55, 0.38 |
| mob_hit_floor | 2.7 | SLIM | | 2.13, 0.37 |
| mob_knockback | 2.8 | SLIM | | 3.22, 2.04 |
| mob_lifecycle | 3.5 | SLIM | | 2.76, 0.40 |
| mob_lifeleech | 2.3 | SLIM | | 2.10, 0.37 |
| mob_lockout | 2.9 | SLIM | | 2.16, 1.61 |
| mob_locomotion | 3.4 | SLIM | | 2.67, 1.87 |
| mob_manaburn | 3.0 | SLIM | | 2.23, 0.45 |
| mob_mechanic_spacing | 2.5 | SLIM | | 3.28, 0.46 |
| mob_melee_walk_past | 2.8 | SLIM | | 2.48, 0.42 |
| mob_mend_ally | 3.0 | SLIM | | 2.26, 0.40 |
| mob_mortal_strike | 3.4 | SLIM | | 2.33, 0.37 |
| mob_plague | 2.9 | SLIM | | 2.19, 1.52 |
| mob_purge | 2.7 | SLIM | | 2.29, 0.36 |
| mob_pursuit_all | 3.3 | SLIM | | 2.36, 1.66 |
| mob_rally | 3.6 | SLIM | | 2.91, 0.37 |
| mob_sap_vigor | 2.9 | SLIM | | 2.24, 0.40 |
| mob_scan_counters | 4.5 | SLIM | counting cases; the spawn-clearance check and the purity pair keep the full world | 3.37, 2.71 |
| mob_silence | 2.7 | SLIM | | 2.10, 1.61 |
| mob_siphon_spirit | 3.3 | SLIM | | 2.19, 0.36 |
| mob_smolder | 3.2 | SLIM | | 2.99, 1.76 |
| mob_soulrot | 4.3 | SLIM | | 3.14, 1.81 |
| mob_spell_reflect | 2.9 | SLIM | | 2.60, 0.40 |
| mob_spellvuln | 3.1 | SLIM | | 2.16, 0.37 |
| mob_stack_poison | 3.4 | SLIM | | 2.33, 1.69 |
| mob_stagger | 4.3 | SLIM | | 4.66, 0.59 |
| mob_stoneskin | 3.2 | SLIM | | 2.57, 0.38 |
| mob_swing | 3.2 | SLIM | | 2.62, 0.37 |
| mob_terrify | 3.0 | SLIM | | 2.26, 1.78 |
| mob_thorns | 2.6 | SLIM | | 1.97, 0.34 |
| mob_unreachable_evade | 4.7 | SLIM | culling kept; the searched pin seed is still 15 | 3.74, 2.08 |
| mob_venom | 3.2 | SLIM | | 2.24, 1.65 |
| mob_voskar_emberwing | 2.6 | SLIM | | 2.04, 0.33 |
| mob_vulnerability | 2.9 | SLIM | | 2.71, 0.38 |
| mob_warcry | 2.9 | SLIM | | 2.40, 0.39 |

A pre-existing fragility (mob_disarm's repeat-proc case rides an unforced hit roll) is listed with
its fix in `README.md` here.
