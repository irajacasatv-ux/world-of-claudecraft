# Part 5, third slimming round, part 1 (ability_avoidance to equip_trinket)

Scope: 103 files at 2 to 5 s of CI test time that built a full-world Sim with no scoped world.
Base `1d9af4a53b`; landed on feature/freeholds as `8e9d515546` to `3cbb2629ab` (102 commits,
cherry-picked clean). Method in `README.md` here. The host carried a load of 12 to 30 during the
timing, so base medians sit above a quiet run (account_ledger_sim read 9.22 s here against 4.54 s
quiet); compare a row's two numbers, not rows with each other. (b) marks a second five-round batch.

## Verdicts

97 SLIM, 6 KEEP. The 97 changed files went from 391.70 s to 143.73 s of local test time (the
table's own sum; the part's report quoted 390.93 and 143.97 before four rows were re-timed). Every SLIM
file kills one source mutant; every control passed. Six fresh reviewers then traced every SLIM file
for a case that now passed vacuously, which led to the fixes listed below the table.

Unless noted, the change is "empty world" and the mutant was killed.

| File | CI s | Verdict | Change | Local s before, after |
|---|---|---|---|---|
| ability_avoidance | 2.2 | SLIM | | 2.81, 2.21 |
| absorb_credit | 4.2 | SLIM | one seed (was two) | 4.63, 0.39 |
| account_ledger_sim | 3.7 | SLIM | one seed (was two) | 9.22, 2.42 |
| action_bar_secondary_requirements | 2.7 | SLIM | | 6.81, 1.73 |
| aldric_meteor_quest | 2.9 | SLIM | only Aldric, the Merchant, Trader Wilkes and the meteor (see the fixes) | 2.65, 2.22 |
| apex_feast_craft | 4.1 | SLIM | | 5.77, 2.33 |
| arena_command | 2.8 | SLIM | | 2.30, 1.66 |
| arena_respawn_intent | 3.8 | SLIM | | 9.44, 1.63 |
| arena_rotation | 3.1 | SLIM | | 2.92, 1.56 |
| aspect_monkey | 2.7 | KEEP | one Sim, one tick; the tick builds the same grid | 2.10 |
| assist_command | 3.2 | SLIM | | 5.41, 1.55 |
| attack_command | 2.7 | SLIM | | 2.08, 1.58 |
| avatar_break_control | 4.1 | SLIM | | 6.97, 2.03 |
| bags_command | 2.8 | SLIM | | 3.05, 0.33 |
| bags_pool_honest_refusal | 2.6 | SLIM | | 2.92, 0.39 |
| baseline_interrupts | 2.8 | SLIM | | 2.22, 0.37 |
| bastion_ward_stone | 2.8 | SLIM | only the ward stones | 2.10, 0.40 |
| beacon_spiral | 3.3 | SLIM | the live climb | 3.09, 2.10 |
| blocker_colliders | 4.3 | SLIM | the walk's custom world drops camps and ground objects | 6.84, 4.41 |
| bloodrift_combo_scaling | 2.9 | SLIM | | 5.43, 2.07 |
| bootcamp_disengage | 4.2 | SLIM | only the Proving Shore camps | 4.73, 1.75 |
| bop_party_trade | 3.5 | SLIM | | 3.41, 1.66 |
| bop_trade_cleanup | 2.6 | SLIM | | 3.21, 1.88 |
| breath | 3.4 | SLIM | one shared deep-lake world (was a fresh copy per case) | 2.84, 1.77 |
| broker_custody | 2.6 | SLIM | | 3.65, 0.47 |
| buffs_command | 3.0 | SLIM | | 2.37, 1.78 |
| buyback_command | 3.2 | SLIM | | 2.46, 1.60 |
| cancel_aura | 2.8 | SLIM | | 2.16, 1.63 |
| cannon_endless_session | 4.5 | KEEP | already culled; the vehicle station turns off on any custom world | 6.33 |
| card_duel_audio_events | 3.3 | SLIM | only the card master | 4.98, 1.62 |
| card_duel_sim | 3.5 | SLIM | only the card master | 2.89, 1.63 |
| cascade_playtest_dev | 3.4 | SLIM | | 2.88, 1.87 |
| caster_set_bonus | 2.8 | SLIM | | 2.30, 1.74 (b) |
| casting_command | 3.7 | SLIM | | 4.45, 1.59 |
| cauterize | 2.6 | SLIM | | 3.26, 2.27 |
| character_blob_size | 3.7 | SLIM | the serialized blob is byte-identical | 7.52, 0.45 |
| character_state_backcompat | 2.7 | SLIM | one seed (was two) | 3.23, 1.61 |
| charge_rooted_refusal | 3.4 | SLIM | `RL_TEST_WORLD` | 2.82, 1.67 |
| chat_bubble_style | 2.5 | SLIM | | 2.49, 1.86 |
| cheater_mark_client | 2.8 | SLIM | | 2.40, 0.53 |
| cheetah_daze | 3.7 | SLIM | | 3.26, 1.70 |
| choice_rows_engine | 2.8 | SLIM | | 2.15, 0.44 |
| choice_rows_wave2 | 4.5 | SLIM | | 9.11, 1.64 |
| chronomancy_cascade_relief | 4.3 | SLIM | | 3.05, 1.70 |
| chronomancy_cascade_threat | 3.2 | SLIM | | 3.41, 1.81 |
| class_health_table | 2.5 | SLIM | | 2.72, 2.02 |
| colossal_might_v026 | 2.7 | SLIM | `RL_TEST_WORLD` | 3.02, 1.57 |
| combat_event_fidelity | 4.9 | SLIM | one seed (was two) | 6.21, 2.23 |
| combat_threat_modifiers | 3.6 | SLIM | | 4.41, 1.71 |
| combo_command | 3.1 | SLIM | | 2.41, 1.93 (b) |
| commanding_shout | 4.2 | SLIM | one seed (was two) | 8.50, 2.26 |
| community_test_accounts | 2.5 | SLIM | the reload Sims | 3.37, 2.76 |
| completed_command | 3.1 | SLIM | | 2.15, 1.80 |
| consider_command | 3.1 | SLIM | | 2.39, 1.53 |
| consumable_command | 3.5 | SLIM | | 4.90, 1.52 |
| cooldown_manager_view | 3.8 | SLIM | | 3.95, 0.41 |
| cooldowns_command | 3.1 | SLIM | | 2.51, 1.88 |
| copper_dig_pathing | 2.7 | KEEP | reads every overworld camp spawn and the real tunnel_rat camp | 2.10 |
| crafted_collection_effects | 3.1 | SLIM | | 9.14, 0.50 |
| crucible_healer_combat | 3.6 | SLIM | the Regrowth roll and crit forced (see the fixes) | 3.54, 2.02 (b) |
| crucible_vendor_reach | 3.1 | SLIM | only the Quartermaster | 2.85, 1.84 |
| crucible_vendor | 3.0 | SLIM | only the Quartermaster | 3.07, 2.01 |
| daily_gate_load | 2.5 | SLIM | | 2.72, 1.59 |
| daily_rewards_stub | 2.7 | SLIM | | 1.99, 0.48 |
| dawnhold_map_view | 3.3 | SLIM | | 6.53, 0.54 |
| dawnhold | 2.1 | SLIM | | 5.11, 1.52 |
| dead_party_loot | 3.2 | SLIM | | 3.75, 1.55 |
| death_lesson | 3.2 | SLIM | | 2.76, 1.84 |
| deck_prediction | 3.4 | KEEP | the idle cull measured no gain, restored to base | 3.39 |
| deeds_content | 3.7 | SLIM | the live deed cases | 5.01, 2.89 |
| deeds_encounter_cleanup | 3.1 | SLIM | | 1.93, 0.45 |
| delve_companion | 4.3 | SLIM | only the wild boar camps | 8.88, 1.73 |
| delve_geometry | 2.9 | SLIM | | 2.46, 0.52 |
| delve_render | 2.6 | SLIM | | 3.59, 0.41 |
| delve_shop | 2.8 | SLIM | | 7.31, 0.39 |
| demoralizing_shout | 2.4 | SLIM | | 2.60, 1.65 |
| dev_god | 4.3 | SLIM | | 3.23, 0.40 |
| dev_kit | 3.5 | SLIM | | 7.33, 0.76 |
| dev_quest_commands | 2.1 | SLIM | | 3.35, 1.93 |
| dev_world_quest_cannon | 2.2 | KEEP | vehicles switch off on any custom world, which would make the rejection case vacuous | 2.34 |
| dev_world_quest_daily | 3.6 | SLIM | only the two activation objects | 2.57, 1.96 |
| dev_world_quest_wisp_selector | 3.0 | SLIM | only the wisp maze instructor | 2.57, 0.39 |
| dev_world_quests | 4.1 | SLIM | | 9.41, 2.21 |
| dock_collision | 4.9 | SLIM | per-case content without camps, NPCs or ground objects | 5.11, 3.58 |
| dragons_breath | 2.9 | SLIM | | 2.45, 2.00 |
| druid_form_speed_stack | 3.2 | SLIM | | 2.10, 1.59 |
| druid_wand | 3.7 | SLIM | | 6.88, 2.12 |
| duel_module | 2.7 | SLIM | | 2.06, 0.38 |
| dungeon_door_softlock_1894 | 2.9 | SLIM | | 2.71, 2.00 |
| dungeon_miniboss_stomp | 3.0 | SLIM | | 2.79, 0.40 |
| dungeon_pack_aggro | 2.7 | SLIM | | 2.81, 0.35 |
| dungeon_parkour | 3.4 | SLIM | | 3.27, 0.39 |
| dungeons_command | 2.8 | SLIM | | 5.82, 1.85 |
| eastbrook_ferry_berth | 4.9 | KEEP | the ferry, berth and harbor exist only on the built-in world; already culled | 4.19 |
| eastbrook_wolves_lifecycle | 2.6 | SLIM | only Marshal Redbrook and one wolf camp | 3.01, 1.94 |
| elixir | 4.9 | SLIM | | 4.72, 2.32 |
| emissary_cache | 2.8 | SLIM | re-applied after the shared-stash mix-up, re-timed and re-mutated | 2.42, 1.83 (b) |
| enchants_magnitude_invariants | 2.4 | SLIM | | 5.22, 0.41 |
| entity_roster_version | 2.7 | SLIM | | 2.32, 0.50 |
| entity_roster | 4.8 | SLIM | one seed (was two) | 5.36, 0.40 |
| equip_jewelry | 3.1 | SLIM | | 4.76, 0.49 |
| equip_level_requirement | 3.1 | SLIM | | 2.41, 0.36 |
| equip_trinket | 2.5 | SLIM | | 5.55, 1.57 |

**Fixes after review.** aldric_meteor_quest's vendor-sell case had gone vacuous (the Merchant sells
nothing herself; on the full world Trader Wilkes nearby let the case reach the no-sell guard, and
without him the refusal came from "There is no merchant nearby"), so he is kept and the survivor
is killed. crucible_healer_combat's empty-world rolls lost the Regrowth crit, so the real cast took
the uncapped ward branch and still passed; the two rolls are forced as the full world gave them,
with an assertion that the ward is the capped one. dawnhold's comment was corrected (the empty
world still spawns a few service mobs). deck_prediction was restored to base.

Weak pins the review found that predate this round are listed with their fixes in `README.md`
here.
