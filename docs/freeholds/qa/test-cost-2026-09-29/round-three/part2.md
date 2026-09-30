# Part 5, third slimming round, part 2 (equipment_proficiency to item_copy_confirm_window)

Scope: 103 files at 2 to 5 s of CI test time that built a full-world Sim with no scoped world.
Base `1d9af4a53b`; landed on feature/freeholds as `512f213090` to `5dd7fe14af` (17 commits,
batched by domain, cherry-picked clean). Method in `README.md` here. Local s is the median per-file
duration of three base and three tip batch runs at one worker; where a file's cost sits in a
`beforeAll`, the reporter's per-file duration (hooks included, the figure the CI harvest reads) is
given too.

## Verdicts

92 SLIM, 11 KEEP. The 92 changed files went from 249.38 s to 96.11 s (251.92 s to 96.99 s with
hooks). Every SLIM file kills one source mutant (all 92 killed, controls green; for five files the
first mutant hit a path the file never reaches and the replacement is killed). Three slims were
measured and reverted to KEEP; they are left out of the totals.

Unless noted, the change is "empty world" and the mutant was killed.

| File | CI s | Verdict | Change | Local s before, after |
|---|---|---|---|---|
| equipment_proficiency | 4.8 | SLIM | | 5.91, 0.45 |
| error_text_i18n_core | 2.3 | SLIM | | 2.19, 1.73 |
| facing_stability | 3.8 | SLIM | `RL_TEST_WORLD` | 2.64, 1.87 |
| faction_rewards | 4.3 | SLIM | a quartermaster-only world | 3.96, 2.73 |
| factions | 2.5 | KEEP | its one Sim ticks the overworld; a scoped try gained nothing | |
| farm_crop_mark_zone_guard | 2.3 | SLIM | | 1.91, 0.38 |
| farm_deny_bed_correlation | 2.5 | SLIM | | 2.95, 0.47 |
| farm_intro_quest_content | 2.2 | SLIM | Farmer Jessica only | 2.28, 1.66 |
| farm_pattern_items | 3.0 | SLIM | | 2.14, 0.63 |
| farm_quest_objective | 3.6 | SLIM | Foreman Odell only | 3.25, 2.29 |
| farmer_vendor_purchase | 4.8 | SLIM | the four farmers only | 4.14, 2.40 |
| farming_gate1_faucet | 2.6 | SLIM | Hollis and Verbena only | 2.56, 1.72 |
| fear_standable_support | 2.9 | SLIM | | 2.29, 1.89 |
| fear_wall_guard | 2.6 | SLIM | | 2.90, 1.74 |
| fenbridge_layout_suite | 4.8 | KEEP | reverted: the grid build moved to the collision cases | 3.46, 3.67 |
| ferry_bell | 2.5 | SLIM | the two bells only | 2.04, 0.35 |
| ferry_hud | 2.5 | SLIM | | 1.94, 0.45 |
| ferry_view_route | 2.8 | SLIM | | 2.04, 0.54 |
| fishing_bobber | 2.9 | SLIM | | 2.02, 0.38 |
| flametongue | 2.6 | SLIM | | 2.09, 1.66 |
| forge_workshop_input | 2.7 | SLIM | | 1.87, 0.38 |
| forgebreaker_commission | 2.7 | SLIM | | 2.01, 0.42 |
| forgebreaker_quest | 4.6 | SLIM | | 3.38, 2.27 |
| forgefather_fortress | 3.1 | SLIM | `WORLD_SEED` kept | 2.36, 1.89 |
| form_command | 2.5 | SLIM | | 2.31, 1.64 |
| form_cross_shift_billing | 3.3 | KEEP | near its floor (the grid build on the first tick) | |
| freehold_furnisher | 3.1 | KEEP | reverted: within noise | 2.54, 2.42 |
| freehold_instance | 4.7 | SLIM | one seed (the determinism pair moved from 1234 to 99) | 3.39, 2.11 |
| freehold_offline_default | 2.6 | KEEP | already scoped, one seed | |
| freehold_world_pvp_sanctuary | 2.1 | KEEP | already scoped, one seed | |
| frost_nova_break | 3.2 | SLIM | | 2.32, 2.09 |
| furnishing_recipes | 3.1 | SLIM | | 2.50, 0.41 |
| garden_maze_collision | 2.7 | SLIM | | 3.26, 1.94 |
| gather_rare_events | 3.8 | SLIM | | 2.75, 0.55 |
| gathering_goal_cache | 3.5 | SLIM | the bankers only | 2.60, 1.84 |
| gathering_goal_once_use_recipe | 2.8 | KEEP | near its floor; a scoped try measured slower | |
| glacial_front | 3.8 | SLIM | | 2.50, 1.74 |
| global_invite | 3.1 | SLIM | | 2.26, 1.60 |
| gold_command | 3.2 | SLIM | | 2.13, 1.57 |
| gravewyrm_boss_gold | 2.6 | SLIM | seed 1234 kept; the 2,000-roll sample changes on the empty world, no expected value moved | 3.25, 0.52 |
| gravewyrm_farm_exploit | 3.7 | SLIM | | 2.45, 1.72 |
| ground_object_placement | 3.3 | KEEP | pins the real world's spawns at the shipped seed | |
| group_buff_self_stacking | 2.8 | SLIM | | 2.02, 0.43 |
| guild_bank_log_view | 2.8 | SLIM | | 1.85, 0.39 |
| guild_roster | 2.2 | SLIM | | 2.16, 0.37 |
| guild_roster_page_pg_integration | 4.5 | SLIM | timed and mutated with Postgres armed | 2.45, 0.51 (hooks 3.00, 0.90) |
| guild_roster_transport | 4.1 | SLIM | | 3.31, 0.64 |
| hallowed_wall_bounce | 2.7 | SLIM | (replacement mutant) | 1.86, 0.41 |
| harvest_preference_sim | 4.5 | SLIM | | 3.11, 1.77 |
| haste_set_bonus | 3.7 | SLIM | | 2.57, 1.67 |
| headless_gathering_goal | 2.5 | SLIM | | 2.57, 0.53 |
| heal | 4.7 | SLIM | | 3.88, 0.57 |
| heal_power | 3.9 | SLIM | one seed (was two) | 4.27, 2.01 |
| heal_spellpower | 3.0 | SLIM | | 2.37, 1.84 |
| heroic_finale_gold | 5.0 | SLIM | | 4.30, 0.54 |
| heroic_leap_preview | 2.6 | SLIM | | 1.98, 1.70 |
| heroic_loot_budget | 2.8 | SLIM | | 0.16, 0.17 (hooks 2.05, 0.55) |
| heroic_loot_flair | 2.6 | SLIM | (replacement mutant; a pre-existing gap, see `README.md`) | 2.00, 0.49 |
| heroic_soulbound | 2.6 | SLIM | | 2.19, 0.38 |
| hoard_bone_reaper | 3.9 | SLIM | | 4.99, 0.78 |
| hoard_boss | 3.7 | SLIM | | 3.95, 0.61 |
| hoard_boulder | 2.7 | SLIM | | 3.13, 0.53 |
| hoard_cave_bosses | 4.3 | SLIM | | 3.83, 0.67 |
| hoard_chest_lift | 3.3 | SLIM | (replacement mutant) | 2.36, 0.55 |
| hoard_cocoon | 4.6 | SLIM | | 3.15, 0.56 |
| hoard_control_casts | 5.0 | SLIM | one seed (was two) | 4.03, 0.56 |
| hoard_forge_hammer | 3.3 | SLIM | | 3.00, 0.50 |
| hoard_ice_age | 3.5 | SLIM | | 2.60, 0.46 |
| hoard_lightning_strike | 3.2 | SLIM | | 2.46, 0.49 |
| hoard_mushroom | 2.1 | SLIM | | 2.46, 0.47 |
| hoard_room | 2.5 | SLIM | (replacement mutant; a pre-existing gap, see `README.md`) | 1.99, 0.37 |
| hoard_room_scope | 2.8 | SLIM | | 2.02, 0.40 |
| hoard_silk_snare | 3.0 | SLIM | (replacement mutant) | 2.08, 0.38 |
| hoard_storm_static | 3.4 | SLIM | | 2.23, 0.41 |
| hoard_tide_pattern | 3.2 | SLIM | | 2.71, 0.50 |
| hoard_vault_rescale | 4.9 | SLIM | one seed (was two) | 3.76, 0.60 |
| hub_healing_drill | 3.0 | KEEP | already a scoped hub world, one seed | |
| hunter_class_spec_kits | 2.6 | SLIM | | 1.86, 0.36 |
| hunter_trap | 3.4 | SLIM | | 2.83, 1.82 |
| ignivar_dev_raid | 3.8 | SLIM | | 3.45, 1.90 |
| ignivar_exit_routing | 3.8 | SLIM | | 2.78, 1.77 |
| ignivar_keep_entrance | 3.1 | SLIM | | 2.08, 1.66 |
| ignivar_lava_moat | 2.5 | SLIM | | 3.87, 0.51 |
| ignivar_lift_car_walls | 3.7 | SLIM | | 2.85, 1.15 |
| ignivar_raid_entry | 4.6 | SLIM | | 3.34, 2.12 |
| ignivar_raid_flow | 2.2 | SLIM | | 2.38, 0.52 |
| ignivar_raid_trash_restoration | 2.7 | SLIM | | 1.92, 0.40 |
| ignivar_raid_trash_tuning | 2.0 | SLIM | | 2.04, 0.39 |
| ignivar_set_bonus_hunter | 3.2 | KEEP | the empty world moved a pinned value (a forced-crit window 14 to 12), reverted | |
| ignivar_set_bonus_rogue | 3.6 | SLIM | | 2.86, 1.74 |
| ignivar_trash_automata | 3.9 | SLIM | | 2.80, 0.46 |
| ignivar_weekly_lockout | 4.8 | SLIM | | 3.50, 2.06 |
| imbue_exclusive | 3.7 | SLIM | | 2.59, 1.68 |
| immobile_mob_evade | 4.0 | SLIM | the empty world replaces the idle cull | 3.45, 1.82 |
| inert_instance_corpse | 2.3 | SLIM | | 2.23, 0.45 |
| inscription_flow | 3.7 | SLIM | | 3.05, 1.88 |
| inspect_command | 2.9 | SLIM | | 2.25, 0.39 |
| interact_object_credit | 2.3 | SLIM | Bellkeeper Tam and the three bells only | 2.82, 1.65 |
| interest_candidates | 2.5 | KEEP | reverted: within noise | 1.78, 1.71 |
| interior_encounter_prewarm_rig_key | 2.7 | SLIM | | 1.94, 0.37 |
| inventory_order | 2.8 | SLIM | | 2.06, 0.55 |
| inventory_sort | 5.0 | SLIM | | 3.79, 0.80 |
| item_copy_confirm_window | 2.6 | SLIM | | 2.25, 0.37 |

**What a custom world switches off.** Giving a Sim a world does not turn off the ferry, harbor or
Eastbrook vault checks; it does switch off vehicles, weekly quests, a world quest whose NPC is
missing, and every camp, NPC and ground object, so each slim was checked against that list.

**The shared stash.** A helper in this part ran `git stash pop` and took up part 1's stashed
change (git's stash is shared across every worktree of one repository); both were put back, and at
integration neither worktree held the other's change (checked before cherry-picking).
