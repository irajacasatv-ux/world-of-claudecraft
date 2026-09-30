# Part 5, third slimming round, part 5 (rng_draw_compensation to zones_command)

Scope: 103 files at 2 to 5 s of CI test time that built a full-world Sim with no scoped world.
Base `1d9af4a53b`; landed on feature/freeholds as `e4bf85528f` to `e272fff97b` (89 commits,
cherry-picked clean). Method in `README.md` here: local times are the medians of three base and
three tip batch runs of every changed file together at one worker (json reporter), interleaved on a
shared host (load about 20 to 30); compare a row's two numbers, not rows with each other.

## Verdicts

89 SLIM, 14 KEEP. The 89 changed files went from 219.98 s to 111.07 s of local test time. Mutants:
96 runs, 91 killed, 5 survived, every control green (1,331 tests in the all-files control); each of
the five survivors also survives the base file (three were replaced by a mutant on the live path,
which is killed). The mutant specs lived in the session's scratch space and are not kept in the
repository.

Unless the Change column says otherwise, the change is "empty world" (`EMPTY_TEST_WORLD`), and the
file's one mutant was killed.

| File | CI s | Verdict | Change | Local s before, after |
|---|---|---|---|---|
| rng_draw_compensation | 2.8 | SLIM | | 1.96, 0.37 |
| rogue_energy_fix | 2.9 | SLIM | | 2.03, 0.34 |
| rogue_eye_jab_swing_reset | 3.0 | SLIM | | 1.98, 1.58 |
| rogue_shadeslip_friendly | 2.9 | SLIM | | 2.09, 1.70 |
| rogue_stealth_targeting | 3.5 | SLIM | all four Sims (the first mutant hit a dead module; the live-path one is killed) | 2.47, 1.94 |
| rogue_wicked_slash_normalization | 2.3 | SLIM | | 2.23, 1.79 |
| salvage_copy_selection | 2.6 | SLIM | | 2.17, 0.37 |
| saved_pos_exit | 3.1 | SLIM | the addPlayer agreement Sims | 2.20, 1.71 |
| scripted_walk | 4.1 | SLIM | one seed (was two) | 3.30, 1.82 |
| server/admin_guild_bank_view | 3.4 | SLIM | | 2.52, 0.43 |
| server/gathering_goal_commands | 3.1 | SLIM | | 2.55, 0.44 |
| server/mail_partition_rearm_vault | 2.3 | SLIM | | 1.93, 0.40 |
| server/market_sold_volume | 2.5 | SLIM | the two end-to-end sales on the empty world plus the Merchant | 2.43, 1.63 |
| server/vault_direct_claim_host | 2.7 | SLIM | | 2.06, 0.35 |
| server/vault_reward_state | 2.9 | SLIM | the seven ledger Sims | 2.41, 0.42 |
| server/woc_market_custody | 4.5 | SLIM | | 3.23, 0.54 |
| session_command | 3.1 | SLIM | | 2.10, 1.70 |
| set_bonus_mods | 2.6 | SLIM | | 2.01, 0.36 |
| shadowform_heal_break | 3.0 | SLIM | | 2.97, 1.76 |
| shaman_spiritmend_engine | 2.6 | SLIM | | 2.05, 0.36 |
| shaman_stonebound_benchmark | 3.3 | SLIM | | 2.08, 1.68 |
| shaman_thundercall_engine | 3.2 | SLIM | | 2.11, 0.38 |
| shaman_warspirit_engine | 3.3 | SLIM | | 2.27, 0.48 |
| shapeshift_resource_persist | 2.8 | SLIM | | 2.03, 1.56 |
| shield_block | 3.3 | SLIM | all thirteen Sims | 2.71, 1.79 |
| signature_reworks | 3.9 | SLIM | | 3.15, 2.04 |
| sim_i18n_rift_mechanics | 2.6 | SLIM | | 1.95, 0.37 |
| sloomtooth_drowned | 2.7 | SLIM | | 1.86, 0.41 |
| social_aggro | 3.2 | SLIM | `RL_TEST_WORLD` (the first wolf camp) | 2.51, 1.70 |
| social | 4.9 | SLIM | live-wolf cases on a world of the wolf camps and Marshal Redbrook; the storyline gate on the stripped social world (the first mutant was a weak pin, see below) | 5.16, 4.08 |
| spatial | 4.1 | SLIM | the two whole-world scans share one full world ticked 200 times (they only read it); roster and combat-flag cases on the empty world | 5.57, 3.48 |
| spec_baselines | 2.5 | SLIM | | 2.10, 1.58 |
| speed_command | 2.7 | SLIM | | 2.12, 1.68 |
| spell_crit_shared_core | 3.2 | SLIM | | 2.30, 0.46 |
| spell_power | 4.2 | SLIM | Frostbolt forces its hit and crit draws instead of riding seed 7 | 3.34, 1.96 |
| spell_resist | 2.9 | SLIM | | 1.98, 1.82 |
| starter_items | 3.6 | SLIM | | 3.08, 1.71 |
| stats_command | 2.6 | SLIM | a pinned expected string now writes its dash character as a unicode escape | 1.99, 1.61 |
| summoned_add_respawn | 2.6 | KEEP | already on an empty world; sharing one world object measured as noise, reverted | 1.71 |
| tab_target_sim | 3.8 | SLIM | | 2.69, 0.43 |
| talent_ability_crit | 4.5 | SLIM | one seed (was two); the always-crit case forces its draws instead of hunted seed 1 | 3.26, 0.39 |
| talent_cast_hooks_v026 | 2.7 | SLIM | one seed (was two) | 3.56, 0.40 |
| talent_gladesong_channel_v026 | 3.4 | SLIM | the chapel wall stays (static collider geometry); the replacement mutant on the channel heal's line of sight is killed | 2.70, 1.80 |
| talent_nonwarrior_runtime_v026 | 3.8 | SLIM | | 2.92, 1.71 |
| talent_save_migration_v026 | 2.9 | SLIM | (a pre-existing gap, see below) | 1.98, 1.71 |
| talents_command | 2.8 | SLIM | | 2.09, 1.68 |
| tank_parity | 3.1 | SLIM | | 2.14, 1.68 |
| target_command | 2.5 | SLIM | `RL_TEST_WORLD` | 2.05, 1.65 |
| targetbuffs_command | 2.3 | SLIM | | 2.20, 1.71 |
| temple | 2.7 | KEEP | the exit case lands at the overworld door and builds the full grid either way | 2.81 |
| temporal_acceleration | 2.4 | SLIM | | 2.15, 1.65 |
| terrain_calm_anchor_freehold | 4.9 | KEEP | the two seeds are the golden corpus under test | 5.08 |
| threat_command | 2.8 | SLIM | `RL_TEST_WORLD` | 2.02, 1.62 |
| titans_grip_penalty | 3.0 | SLIM | `RL_TEST_WORLD` | 2.05, 1.60 |
| trade_material_sources | 2.5 | SLIM | | 2.33, 0.43 |
| trinket_aura_tooltip | 4.0 | SLIM | an unused seed parameter dropped | 2.43, 0.51 |
| trivial_mob_passive | 2.7 | SLIM | `RL_TEST_WORLD` (no NPCs) | 2.09, 1.67 |
| tutorial_graduation_deed | 3.8 | SLIM | a Proving Shore world: the rail givers and the two ferry bells only | 2.61, 1.91 |
| unequip_item | 2.5 | SLIM | | 1.98, 1.69 |
| varkhul_dev_raid | 3.0 | SLIM | | 2.31, 0.47 |
| varkhul_encounter | 4.7 | SLIM | already one seed | 4.79, 0.75 |
| varkhul_engage | 3.3 | SLIM | | 2.17, 0.48 |
| varkhul_intercept_beam_encounter | 4.0 | SLIM | | 2.86, 0.62 |
| vehicle_station_placement | 2.3 | KEEP | reads the full world's spawned hostile camps | 3.53 |
| vendor_buyback_instance | 4.2 | SLIM | the empty world plus Trader Wilkes | 2.95, 1.67 |
| vendor_partial_sell | 2.8 | SLIM | the empty world plus Trader Wilkes | 2.28, 1.71 |
| voidfeast_gate | 4.6 | SLIM | one seed (seed 8 dropped) | 3.60, 0.46 |
| voss_controllability | 2.7 | SLIM | | 1.96, 0.35 |
| warfare_season2 | 3.5 | SLIM | | 3.13, 2.09 |
| warfare_set_bonuses | 2.9 | SLIM | `RL_TEST_WORLD` | 3.15, 1.76 |
| warfare_titles | 2.4 | SLIM | the empty world plus FURY | 2.82, 1.65 |
| warfare_vendor_npc | 3.2 | KEEP | its world-build case builds the full grid on the file's seed anyway; measured as noise, reverted | 2.31 |
| warfare_vendor_view | 2.4 | SLIM | | 2.07, 0.36 |
| warlock_pet_skills | 4.8 | SLIM | | 3.21, 1.87 |
| warrior_combat_mastery_v026 | 3.4 | SLIM | `RL_TEST_WORLD` | 2.30, 1.85 |
| warrior_rage_economy | 3.0 | SLIM | hits a wolf placed beside the warrior instead of the first overworld mob | 1.98, 0.35 |
| warrior_stances | 2.8 | SLIM | | 2.28, 1.69 |
| weakening_hex | 3.2 | SLIM | | 2.15, 0.36 |
| weapon_skin_sim | 3.2 | SLIM | | 2.55, 0.43 |
| weekly_rewards | 2.8 | KEEP | already a keeper-only world at one seed; the time is the asserted clears | 3.03 |
| weekly_vault_world_row | 3.0 | SLIM | the Thornpeak target camps only, one seed (was two) | 2.19, 1.72 |
| wire_aura | 2.8 | SLIM | | 2.24, 0.43 |
| world_api_parity | 2.6 | SLIM | the probe Sim (its cost was a top-level setup the json reporter misses; reporter line 4.08 to 1.10) | 0.06, 0.06 |
| world_boss_cc | 2.3 | SLIM | | 2.07, 1.61 |
| world_content_services | 3.1 | KEEP | its one full-world Sim is the subject | 3.15 |
| world_population_invariant | 2.8 | KEEP | the whole overworld's boot population is what it checks | 2.89 |
| world_quest_activity | 2.9 | SLIM | a world holding only the maze keeper | 2.30, 0.39 |
| world_quest_calligraphy_deed | 2.9 | KEEP | already scoped on one seed | 3.09 |
| world_quest_caravans | 2.1 | KEEP | already the empty world on one seed | 1.91 |
| world_quest_champion | 3.1 | KEEP | one seed; a scoped world measured as noise | 2.07 |
| world_quest_daily_levels | 3.6 | SLIM | a world holding only the ley cache and the candy box | 2.93, 1.62 |
| world_quest_forging | 4.4 | KEEP | already scoped on one seed | 4.41 |
| world_quest_glider_boost | 2.7 | SLIM | a world holding only Flightmaster Zephyr (without him the instructor switches off) | 2.23, 0.37 |
| world_quest_ley_bonus | 2.9 | KEEP | one seed; a scoped world measured as noise | 2.10 |
| world_quest_match3 | 3.6 | SLIM | a world holding only the candy box and the ley cache | 2.61, 1.81 |
| world_quest_rewards | 3.3 | SLIM | each case places its own kill target (`world_quest_zone_hunts` still checks kill targets spawn in their areas) | 2.44, 1.91 |
| world_quest_salvage | 3.0 | SLIM | no camps or NPCs, every ground object kept | 2.25, 1.68 |
| world_quest_shadow_wire | 2.5 | SLIM | | 1.90, 1.59 |
| world_quest_state | 2.8 | SLIM | | 1.82, 0.36 |
| world_quest_trace_persistence | 3.5 | KEEP | already scoped on one seed | 4.12 |
| wyrmwatch_harbor_house | 4.5 | SLIM | the walking Sim spawns only the harbormaster (idle cull kept) | 4.01, 2.43 |
| xp_command | 2.8 | SLIM | | 1.99, 1.56 |
| zones_command | 3.3 | SLIM | | 2.13, 1.57 |

**Why many slimmed files still take about 1.6 s.** The static collider grid is keyed by the active
world content, which stays the built-in world when only `cfg.world` changes, so a Sim that ticks
movement, checks line of sight or places an NPC still builds the full overworld grid for its seed
(about 1.3 to 1.8 s locally); only files that never touch colliders fell to about 0.4 s. A further
cut in this tier has to come from that grid build (a product-side lever the owner holds).

Pre-existing gaps (a talent migration arm no case reaches, a group XP pin that matches only by
coincidence) and a dead module are listed with their fixes in `README.md` here.
