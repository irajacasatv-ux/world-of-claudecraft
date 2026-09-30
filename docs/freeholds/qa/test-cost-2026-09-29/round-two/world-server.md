# Part 5, second slimming round, the world and server cluster: per-file verdicts

Scope: 61 files of the 5 to 20 s CI tier (world quests, dungeons and raids, snapshots and wire
suites, GameServer suites, terrain). Base `8f445b9422`; landed on feature/freeholds as
`7293ac22ce` to `6460ad2b16` (41 commits, cherry-picked; the nightly reader list in
`tests/ci_shard_plan.test.ts` conflicted three times and was resolved as the sorted union).
Method as in `classes.md`; the guild letter row used nine interleaved pairs, and KEEP rows show
one baseline run.

## Verdicts

40 SLIM (three of them MOVE TO NIGHTLY with a PR representative), 21 KEEP. The 40 slimmed files
went from 256.2 s to 113.2 s of local test time (56 percent less). Every mutant on a changed
guard was killed by the slimmed file itself; four must-pass controls were green.

| File | CI s | Verdict | Change | Local s before, after | Mutants k/total |
|---|---|---|---|---|---|
| world_quest_tracing | 15.5 | SLIM, nightly | walks only the `cross` figure per PR; every figure under `WOC_NIGHTLY_SWEEP` (each still covered per PR by the placement case and the pure walk in `world_quest_trace_variants`) | 11.70, 5.91 | 1/1 |
| encounter_wipe | 15.4 | SLIM | one seed, wolf world (was 8 seeds) | 11.50, 1.61 | 2/2 |
| social_classes | 13.2 | SLIM | the Thunder Ward cap case on the wolf world and the file seed; its 90 s timeout removed | 13.01, 2.61 | 1/1 |
| v042_online_ability_resolution | 11.2 | SLIM | one seed, empty world (was 8) | 10.31, 0.38 | 1/1 |
| ignivar_raid_lore | 10.7 | SLIM | one seed, empty world (was 6) | 8.63, 0.39 | 2/2 |
| professions_trend_guild_letter | 10.6 | SLIM | the fresh-crossing case folds into the gains case, which now also asserts the letter id | 7.30, 6.70 | 2/2 |
| server/freehold_wire | 10.4 | KEEP | 117 cases each on a fresh GameServer at about 60 ms; sharing one would couple counters | 7.5 | |
| dungeon_entry_clearance | 10.0 | SLIM, nightly | the shipped seed plus seed 2024 per PR (checked to still land a mob on a door ring); all five seeds nightly | 7.60, 3.26 | 1/1 |
| mob_update_perf | 9.9 | SLIM | the median over 40 measured ticks, not 120 | 7.43, 4.04 | 2/2 |
| quest_dialog_controller | 9.5 | KEEP | 1.3 s locally, under the floor | 1.3 | |
| guild_bank_pg_integration | 9.4 | KEEP | a Postgres suite | | |
| professions_bind_on_trade_online | 9.2 | SLIM | round-trip Sims on the server's seed, empty world | 6.56, 2.04 | 1/1 |
| quest_log_normalization | 9.1 | SLIM | one seed (was 5) | 7.49, 2.20 | 1/1 |
| raid_readout_scope | 8.7 | SLIM | one seed (was 4) | 6.17, 2.26 | 1/1 |
| dungeon_finder | 8.4 | SLIM | seeds 7 and 1234 moved to 42 | 8.55, 6.13 | 2/2 |
| unstuck_online | 8.4 | KEEP | the 10 s unstuck countdown is the behavior | 10.4 | |
| account_wealth_db.pg | 8.3 | KEEP | a Postgres suite | | |
| world_quest_caravan | 8.2 | SLIM | the shipped seed, whose grid the placement checks already build | 6.27, 2.49 | 1/1 |
| bank_wire | 7.9 | SLIM | offline Sims on the server's seed | 5.22, 4.30 | 1/1 |
| vault_wire | 7.9 | SLIM | offline Sims on the server's seed | 6.04, 4.79 | 1/1 |
| battleground_proposal | 7.8 | KEEP | empty world, one seed; its ticks are the asserted windows | 5.9 | |
| equip_router_v026 | 7.8 | SLIM | one seed, empty world | 6.08, 0.37 | 1/1 |
| eastbrook_town_assets | 7.7 | KEEP | the only exact-bytes GLB pin and atlas rebuild check | 6.8 | |
| terrain_height_parity | 7.7 | SLIM, nightly | every other atlas row per PR (each seed keeps half its points); the full atlas nightly | 8.08, 7.15 | 2/3 at PR depth (a 3 yd bump survives PR depth, killed nightly) |
| snapshots_client_merge | 7.7 | SLIM | direct Sims on the server's seed, wire world | 6.24, 1.92 | 1/1 |
| world_quest_puzzle | 7.1 | SLIM | one seed (was 5) | 7.76, 2.42 | 1/1 |
| snapshots_auras | 7.1 | SLIM | seed 1 moved to the server's seed | 4.75, 3.61 | 1/1 |
| snapshots_world | 7.1 | SLIM | seed 991 moved to the server's seed | 6.15, 4.53 | 1/1 on the driven path |
| mount_race | 7.0 | SLIM | seeds 5, 9, 77 moved to 1 | 6.30, 2.92 | 1/1 |
| world_boss | 6.9 | SLIM | seeds 1 and 99 moved to 7 (the gear cap is still reached) | 6.46, 3.72 | 2/2 |
| guild_bank | 6.9 | SLIM | `freshSim` seed 7 moved to 42 | 4.42, 3.72 | 1/1 |
| woc_market_realm_scope_pg_integration | 6.9 | KEEP | a Postgres suite | | |
| professions_attunement_online | 6.8 | SLIM | the tier letter lands after booking, its landing time held under the old 95 s bound | 5.43, 2.47 | 1/1 |
| game_sessions | 6.8 | KEEP | 53 cases on fresh GameServers | 6.1 | |
| snapshots | 6.6 | KEEP | GameServer cases at about 110 ms each | 5.1 | |
| mob_cleave | 6.4 | SLIM | one seed, empty world | 4.69, 0.34 | 1/1 |
| server/community_rifts | 6.4 | SLIM | capacity Sims on the boot seed | 5.39, 2.58 | 1/1 |
| world_quest_reroll | 6.2 | SLIM | restores moved to seed 42 | 4.74, 2.21 | 1/1 |
| nythraxis_full_fight_smoke | 6.1 | KEEP | already empty world, one seed; the ticks are the fight | 4.4 | |
| weekly_quests | 6.1 | SLIM | restores moved from 4711 to 7 | 3.99, 2.47 | 1/1 |
| boss_add_leash | 6.1 | SLIM | one seed, empty world | 5.09, 0.49 | 1/1 |
| mail_wire_cache | 6.0 | KEEP | scoped world, one seed; the delivery windows are asserted | 6.2 | |
| snapshots_cosmetics | 6.0 | SLIM | seed 1 moved to the server's seed | 5.38, 3.79 | 1/1 |
| ignivar_raid_progression | 6.0 | SLIM | one seed, empty world | 5.39, 0.55 | 1/1 |
| professions_admin_restore | 6.0 | SLIM | the draw-free pair moved from seed 77 to the file's seed | 4.75, 3.27 | 1/1 |
| raid_boss_room_welcome | 5.8 | SLIM | one seed, empty world | 4.77, 1.57 | 1/1 |
| guild_letter_online | 5.8 | SLIM | the booked letter lands, its landing time held under the 95 s bound | 6.18, 2.05 | 2/2 |
| escort_quest | 5.8 | KEEP | each route case is the only walkability guard for its route | 4.9 | |
| map_bg_baked | 5.7 | KEEP | the only freshness guard for the baked map plates | 4.8 | |
| chat_log | 5.6 | SLIM | empty world on the server's seed | 4.12, 2.21 | 1/1 |
| snapshots_session | 5.6 | KEEP | GameServer only | 3.9 | |
| arena | 5.4 | SLIM | the draw cases on the file's arena world and seed | 4.17, 2.53 | 1/1 |
| far_terrain_view | 5.3 | SLIM | `setImmediate` yields; the eager-lane negative keeps real timer turns | 4.15, 2.09 | 3/4 |
| server/http/characterization_admin_oauth_internal | 5.3 | KEEP | 1.8 s, all first-case warmup | 1.8 | |
| terrorspark_groundshaker_surface_maps | 5.2 | KEEP | built once; the second build is the reproducibility check | 2.7 | |
| rift_rank_tuning | 5.1 | KEEP | scoped world, cheap per case | 3.3 | |
| pvp_safety | 5.1 | SLIM | the PvE stun case moved from seed 7 to 42 | 4.37, 2.89 | 1/1 |
| masterwork_zone_broadcast | 5.1 | KEEP | rides a hunted proc seed | 3.1 | |
| freehold_instance_online | 5.1 | KEEP | GameServer warmup plus about 100 ms cases | 3.6 | |
| rift_resume_state | 5.1 | SLIM | the solo Sim on the shipped seed | 3.60, 2.24 | 1/1 |
| slope_glue_terrain_floor | 5.0 | KEEP | each seed buys its own geometry | 3.7 | |

**Its own review.** A fresh reader of the cluster's changes found four real problems, fixed and
re-proven before landing: the terrain split first skipped odd points (dropping two of four seeds
from the PR atlas; it now skips odd rows); the `setImmediate` yields let the eager-lane negative
pass with the lane left on (that window uses real timer turns again, and the mutant keeping the
lane on is killed); the door-clearance PR tier now also builds the shipped seed; three comments
were corrected against the code.

**A cheap lever for other suites.** A Sim built on the seed the file's GameServer already booted
(`WORLD_SEED`) is nearly free: collider grids are keyed by the active world content and the seed,
and a scoped `cfg.world` does not change the active content.

**Product levers recorded, not touched.** An empty-world tick costs about 0.4 ms, which every
mail and lockout window pays, and a GameServer construction costs 50 to 100 ms, which dominates
freehold_wire, game_sessions and the snapshot suites.

**Residual notes.** The online tier letter no longer flies the full 90 s (the flight is still
ticked offline through the shared post office path); several restores now load on the seed that
saved them (no seed-derived field in those cases); the pile-up perf case gives slow growth fewer
ticks to show.

Weak pins found that predate this round are listed, with their fixes, in `README.md` here.
