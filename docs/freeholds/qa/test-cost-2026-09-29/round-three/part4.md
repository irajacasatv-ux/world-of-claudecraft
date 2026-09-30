# Part 5, third slimming round, part 4 (mob_ward_allies to rift_wall_swept_collision)

Scope: 103 files at 2 to 5 s of CI test time that built a full-world Sim with no scoped world.
Base `1d9af4a53b`; landed on feature/freeholds as `602b1ca938` to `6b86c1c5f3` (10 commits,
batched by domain, cherry-picked clean). Method in `README.md` here.

## Verdicts

96 SLIM, 7 KEEP. The 96 changed files went from 263.39 s to 120.99 s of local test time (medians of
three base and three tip batch runs at one worker, interleaved); every changed file measured faster.
Every SLIM file kills one source mutant (for two files the first mutant survived the base file too
and the replacement is killed; both gaps are in `README.md`), five controls green, no pinned value
moved.

A new helper, `tests/helpers/npc_world.ts` (`worldWithOnlyNpcs`), builds the built-in world holding
only the named NPCs (no camps, no other NPC, no ground object); fourteen files here use it.

Unless noted, the change is "empty world" and the mutant was killed. "Only X" means a world from
`worldWithOnlyNpcs` holding X.

| File | CI s | Verdict | Change | Local s before, after |
|---|---|---|---|---|
| mob_ward_allies | 3.1 | SLIM | (no ticks, no grid) | 3.65, 0.42 |
| mob_warstomp | 3.4 | SLIM | | 3.20, 0.38 |
| mount_jump | 2.5 | KEEP | already a world with no camps, NPCs or objects; its ticks are the asserted ride window | 2.26 |
| mount_transition | 4.8 | SLIM | | 3.16, 2.22 |
| movement_metrics | 2.5 | SLIM | | 1.95, 1.63 |
| natures_fury | 2.7 | SLIM | | 2.01, 0.37 |
| nearby_command | 2.3 | SLIM | | 2.41, 1.74 |
| noticeboard_interaction | 3.3 | SLIM | board-only cases; roster, service-NPC and tinker cases keep the full world | 3.69, 2.69 |
| noticeboard_listings_event | 2.8 | SLIM | (the board spawns from the active world's services) | 2.74, 0.39 |
| nythraxis_aldric_npc | 3.5 | SLIM | encounter cases; the two placement guards keep the full world | 2.68, 2.10 |
| nythraxis_final_quest | 2.4 | SLIM | only the Highwatch Aldric | 2.78, 2.00 |
| nythraxis_loot_budget | 2.6 | SLIM | | 1.92, 0.37 |
| nythraxis_priest_heal | 3.3 | SLIM | | 3.02, 1.72 |
| obs_interaction | 3.6 | SLIM | one wolf camp, Chronicler Saul and the supply crates | 2.80, 1.84 |
| offhand_dual_wield | 3.3 | SLIM | | 2.74, 0.44 |
| off_stream_rng | 3.6 | KEEP | already stripped worlds; the camp arrays are what it tests | 2.80 |
| okku_placement | 2.9 | SLIM | only Okrim (placement reads only static colliders) | 2.00, 1.62 |
| opened_object_view | 3.1 | SLIM | only the castaway crates | 2.17, 0.42 |
| overpower_command | 2.9 | SLIM | (replacement mutant; a pre-existing gap) | 2.31, 1.64 |
| owner_claim_occupancy | 3.0 | SLIM | | 2.05, 0.46 |
| paladin_aegis | 4.9 | SLIM | | 3.95, 2.05 |
| paladin_beacon | 4.6 | SLIM | | 3.67, 1.87 |
| paladin_dawn_rhythm | 2.2 | SLIM | | 2.50, 1.72 |
| paladin_divine_tome | 2.7 | KEEP | one case needs the rite giver; a one-NPC world measured no gain (the per-seed grid dominates) | 2.75 |
| paladin_retribution_aura | 2.7 | SLIM | | 2.03, 0.34 |
| paladin_valkyrs_calling | 3.0 | SLIM | | 3.80, 1.75 |
| parry | 3.3 | SLIM | | 2.47, 0.45 |
| party_command | 2.8 | SLIM | | 2.13, 1.66 |
| pathfind | 3.0 | SLIM | the two movement Sims (fences are static props) | 2.40, 1.87 |
| persisted_position_escape | 3.2 | SLIM | every load but the custom-world case; the fixture state built once | 3.66, 2.13 |
| persistence_round_trip | 4.5 | SLIM | | 3.48, 1.97 |
| pet_afk_farm | 3.0 | SLIM | a one-wolf-camp world (the same adopted wolves) | 3.01, 1.67 |
| pet_command | 3.2 | SLIM | a one-wolf-camp world | 5.92, 1.77 |
| pet_mounted_heel | 3.1 | SLIM | | 2.31, 1.68 |
| pettaunt_command | 2.8 | SLIM | a one-wolf-camp world | 2.23, 1.61 |
| pois_command | 2.1 | SLIM | | 2.10, 1.57 |
| potion_command | 3.0 | SLIM | | 2.09, 1.75 |
| practice_dummies | 2.6 | KEEP | already a scoped practice-row world, one seed | 2.09 |
| priest_class_spec_kits | 2.8 | SLIM | (replacement mutant; a pre-existing gap) | 1.97, 0.35 |
| priest_cleanup | 3.9 | SLIM | one seed (was two) | 6.68, 1.77 |
| priest_doctrine | 4.2 | SLIM | | 3.25, 1.82 |
| prof_intro_quest | 3.2 | SLIM | only the quest giver | 2.37, 1.81 |
| profession_quest_objectives | 2.7 | SLIM | | 2.97, 0.43 |
| professions_acquisition_salvage_sink | 4.2 | SLIM | | 2.99, 1.66 |
| professions_archetype_title | 3.0 | SLIM | | 2.47, 0.43 |
| professions_archetype | 4.5 | SLIM | | 3.41, 2.08 |
| professions_attunement_events | 2.7 | SLIM | only the attune master | 2.00, 1.64 |
| professions_battlefield_xp | 2.9 | SLIM | | 3.15, 0.40 |
| professions_blob_roundtrip | 4.0 | SLIM | already one seed | 2.89, 1.66 |
| professions_contracts | 2.6 | SLIM | (the built-in stations check stays in `world_content_services`) | 1.99, 0.38 |
| professions_crafting_hub | 3.8 | SLIM | only Quartermaster Bree; the reload Sim on the file's seed | 5.66, 1.83 |
| professions_enchant_family_cast | 4.5 | SLIM | | 3.14, 0.47 |
| professions_farming_state | 4.2 | SLIM | | 2.92, 2.00 |
| professions_gathering | 3.9 | SLIM | | 3.21, 1.70 |
| professions_hobby_craft | 2.8 | SLIM | | 2.31, 0.40 |
| professions_market | 3.6 | SLIM | only the Merchant | 2.49, 1.98 |
| professions_perks | 2.6 | SLIM | | 2.84, 0.40 |
| professions_session_teardown | 4.2 | SLIM | | 2.87, 1.84 |
| professions_skill_caps | 3.9 | SLIM | one seed (was three); the masterwork proc forced | 5.12, 1.78 |
| professions_starter_tools | 3.4 | SLIM | only the four gather-quest givers, the vendor and the Merchant | 2.37, 1.65 |
| professions_station_placement | 3.4 | KEEP | its one Sim case is a same-seed determinism pair of the real world | 3.82 |
| professions_tool_effect_craft | 2.8 | SLIM | | 3.13, 0.37 |
| professions_tool_effect_recharge | 4.2 | SLIM | | 3.31, 1.95 |
| professions_tool_recharge_cast | 3.4 | SLIM | | 2.74, 0.42 |
| professions_training | 3.8 | SLIM | | 2.95, 1.73 |
| professions_work_orders | 3.0 | SLIM | only the six order masters | 3.40, 1.76 |
| professions_zone_rollout | 3.1 | SLIM | the live gather-mark drive | 2.14, 1.75 |
| proficiency_display_heal | 2.9 | SLIM | | 2.22, 1.71 |
| progression_xp | 3.7 | SLIM | (inns are static props) | 3.51, 0.43 |
| progression | 2.7 | SLIM | the two talent-row Sims | 2.09, 0.65 |
| progression/talents | 3.4 | SLIM | | 2.77, 0.41 |
| projectile_travel | 2.4 | SLIM | a one-wolf-camp world (the target is still the first camp wolf) | 2.68, 1.82 |
| provisioning_supply_line_apex | 2.6 | SLIM | (kitchen stations are services) | 2.79, 0.50 |
| provisioning_supply_line | 3.5 | SLIM | | 3.00, 0.45 |
| ptr_dev_vendor | 3.0 | SLIM | | 2.34, 1.80 |
| pyroblast | 4.7 | SLIM | | 3.51, 1.81 |
| quartermaster_gear | 2.7 | SLIM | (house stock is seeded without the merchant NPC) | 1.96, 0.41 |
| quest_command | 2.6 | SLIM | | 2.03, 1.53 |
| quest_commands | 3.4 | SLIM | only the q_wolves giver | 2.31, 1.85 |
| quest_fallback | 2.9 | SLIM | only the Highwatch Aldric | 2.23, 1.60 |
| quest_gated_ground_object | 2.6 | SLIM | every ground object kept, no camps or NPCs | 2.01, 0.54 |
| quest_link_share | 3.6 | SLIM | | 2.51, 1.72 |
| quest_progress_migration | 3.0 | SLIM | | 2.22, 1.58 |
| quest_recipe_rewards | 3.6 | SLIM | | 2.51, 0.43 |
| quest_repeat_repro | 2.1 | SLIM | only the q_wolves giver | 2.07, 1.63 |
| quest_reward | 2.1 | SLIM | only the turn-in NPC | 2.40, 1.70 |
| queued_command | 3.1 | SLIM | | 2.14, 1.74 |
| raid_boss_melee_reach | 2.3 | SLIM | | 2.33, 0.46 |
| raid_buffs | 4.0 | SLIM | | 3.04, 1.68 |
| raid_lockout_world | 2.4 | SLIM | | 1.97, 0.36 |
| raid_wipe_cooldowns | 2.9 | SLIM | | 1.86, 0.34 |
| raid_wipe_entrant_reset | 2.1 | SLIM | (raid instances spawn regardless) | 2.29, 0.38 |
| rare_ogre_spawn | 2.5 | SLIM | (the 300 rolls assert invariants, no pinned draw) | 2.13, 0.35 |
| raw_cooking_catches | 3.2 | SLIM | | 2.59, 0.47 |
| realm_builder_monument | 4.0 | KEEP | the reserved-id case pins the full world's allocator and rng fingerprint | 3.45 |
| reserved_singleton_entity_ids | 3.0 | KEEP | pins the real world's singleton roster | 2.86 |
| reserved_surface_npc_bootstrap | 2.8 | SLIM | (the Sim is only a fixture) | 2.04, 1.53 |
| retired_heroic_items | 3.2 | SLIM | | 2.13, 1.79 |
| reward_counters | 2.6 | SLIM | | 2.13, 0.34 |
| rift_forge_place_gate | 3.1 | SLIM | only the Riftwright | 2.20, 1.63 |
| rift_line_of_sight | 2.5 | SLIM | (the mutant restricted to the Sim case) | 2.35, 0.36 |
| rift_progression | 3.6 | SLIM | only the Riftwright (already one seed) | 2.77, 1.74 |
| rift_wall_swept_collision | 2.6 | SLIM | | 2.53, 0.41 |

**Forced roll.** professions_skill_caps drops its hunted seed and forces the masterwork proc draw,
relying on the source comment that a successful craft makes exactly one draw (pinned by
`professions_craft_cast`, whose complete-draw count is now exact, `32e8d3092d`).
