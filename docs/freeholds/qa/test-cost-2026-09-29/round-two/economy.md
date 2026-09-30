# Part 5, second slimming round, the economy cluster: per-file verdicts

Scope: 58 files of the 5 to 20 s CI tier (professions, crafting, loot, market, bank, deeds, mail,
farming, freeholds). Base `8f445b9422`; landed on feature/freeholds as `0ae96dee7a` to
`dfbb93b794` (53 commits, cherry-picked; the nightly reader list resolved as the sorted union).
Method as in `classes.md`.

## Verdicts

48 SLIM (one also deletes a vacuous case, one MOVE TO NIGHTLY), 10 KEEP. The 48 changed files went
from 281.84 s to 102.91 s of local test time (63 percent less). Mutants: 75 of 83 killed; seven of
the eight survivors also survive the base file, and the eighth cannot reach the case it aimed at
(a separate mutant kills that case). A new helper, `tests/helpers/forced_rng.ts`, forces a draw
where a case used to ride a hunted seed; four files use it (crafting, Jack, masterwork, silent
loot).

| File | CI s | Verdict | Change | Local s before, after | Mutants k/total |
|---|---|---|---|---|---|
| freehold_dungeon_defs | 15.7 | MOVE TO NIGHTLY | the drop sweep runs seeds 1 and `WORLD_SEED` per PR, all eight under `WOC_NIGHTLY_SWEEP` (reader registered) | 10.08, 3.42 | 2/2 (a seed-1032-only collider survives PR by design, killed nightly) |
| mail_instance | 13.7 | KEEP | each case pays a real 47 s flight; the GameServer case is the only instanced wire guard | 10.14 | |
| professions_tool_effect_slot | 12.9 | SLIM | 7 reload seeds to 1 | 8.24, 1.59 | 2/2 |
| farming_anti_chore | 12.3 | SLIM | 5 seeds to 41; production idle cull on the world-tick case | 9.77, 3.11 | 3/3 |
| gathering_rhythm | 11.8 | SLIM | seed 42 to 4242; the wire twin re-seeds its rng instead of building seed 777 | 9.44, 6.98 | 2/2 |
| market | 10.2 | SLIM | vendor world | 6.57, 2.82 | 2/3 |
| loot_quality_auto_equip | 10.1 | SLIM | 5 full-world seeds to 1 empty-world seed | 7.30, 0.37 | 2/3 |
| deeds | 9.7 | SLIM | twins on seeds 7 and 1234 to 42; tampered-border Sims on the vendor world | 6.63, 3.89 | 2/5 |
| professions_jack | 9.4 | SLIM | hunted seeds 51, 96 and 1 replaced by forced draws in the same bands | 6.30, 2.55 | 3/3 |
| professions_nudges | 9.1 | SLIM | seeds 3121, 3122 and 9001 to 3120 | 6.63, 2.75 | 2/2 |
| professions_enchanting_commands | 8.8 | SLIM | offline Sims on the empty world, one seed | 5.71, 2.87 | 1/1 |
| professions_node_persist | 8.7 | SLIM | 5 reload seeds to 1 | 6.09, 1.63 | 2/2 |
| bank_view | 8.6 | SLIM | 5 seeds to 1 vendor-world seed | 7.57, 1.69 | 1/1 |
| server/storage_purchase_db.pg | 8.4 | KEEP | waits the shipped 2 s bounds plus Postgres `deadlock_timeout` | 8.04 | |
| loot_ffa_sim | 8.4 | SLIM + DELETE one case | party cases start the lock one tick from lapse; a determinism twin that compared two clamped zeros deleted | 6.88, 2.26 | 3/3 |
| bank_sockets | 8.4 | SLIM | seeds 7, 99 and 1234 to 42 | 5.98, 2.19 | 1/1 |
| professions_masterwork | 8.4 | SLIM | seeds 74, 7 and 66 to 21; proc windows forced | 6.66, 2.68 | 3/4 |
| deeds_sites_pin | 8.1 | SLIM | empty world | 7.02, 1.88 | 2/2 |
| professions_commission_order | 7.9 | SLIM | empty world; twin seed 55 to 7 | 7.30, 3.19 | 2/2 |
| server/mail_custody_overlay | 7.9 | SLIM | 16 full-world Sims to 1 empty-world seed | 6.32, 0.55 | 1/1 |
| freehold_crafted_availability | 7.7 | SLIM | seeds 43 and 5 to 42 | 5.22, 2.73 | 2/2 |
| professions_craft_cast | 7.6 | SLIM | empty world; seeds 99 and 1234 to 42 | 6.57, 0.50 | 1/2 |
| professions_crafting | 7.4 | SLIM | empty world, one seed; hunted seeds 1 and 2 replaced by forced draws | 8.07, 0.48 | 2/2 |
| harvest_component_materials | 7.3 | SLIM | seeds 11, 77 and 3 to 1 empty-world seed | 5.24, 1.60 | 1/1 |
| storage_charters | 7.3 | SLIM | seeds 5, 7 and 9 to 42 | 5.06, 1.67 | 1/1 |
| deed_records_table | 7.3 | SLIM | the throwaway save Sim on `WORLD_SEED` on the empty world | 4.82, 3.43 | 1/1 |
| professions_mount_interlock | 7.3 | SLIM | 7 seeds to 1 | 5.43, 1.66 | 1/1 |
| loot_drops | 7.3 | SLIM | empty world; seed 7 to 1234 | 6.30, 1.95 | 1/1 |
| professions_silent_loot | 7.1 | SLIM | hunted seed 74 replaced by a forced miss then proc on seed 42 | 4.74, 3.63 | 1/1 |
| market_instance | 7.1 | SLIM | vendor world | 4.80, 3.28 | 1/1 |
| farm_recipes | 7.0 | SLIM | seeds 11, 13 and 7 to 1 empty-world seed | 4.77, 1.61 | 2/2 |
| quest_item_presence | 7.0 | SLIM | seeds 31 to 34 to 1 vendor-world seed | 5.79, 1.52 | 2/2 |
| loot_master_sim | 7.0 | SLIM | empty world | 5.33, 2.00 | 2/2 |
| professions_grandfather | 6.9 | SLIM | empty world; reload seeds 7 and 11 to 42 | 4.76, 1.48 | 1/1 |
| professions_tier_mail | 6.9 | SLIM | 6 reload seeds to 1 | 7.98, 1.59 | 2/2 |
| freehold_capture_contract | 6.7 | KEEP | no Sim; 104 script-receipt cases | 4.05 | |
| lastflame_enchant | 6.6 | SLIM | three full-world cases on the empty world | 4.87, 4.49 | 1/1 |
| server/woc_market_escrow_queue | 6.3 | KEEP | the cost is the GameServer build | 6.66 | |
| ladder_crafting | 6.1 | SLIM | 4 seeds to 1 empty-world seed | 6.36, 0.44 | 1/1 |
| freehold_module | 6.1 | KEEP | compares seeded full-world hosts | 3.67 | |
| professions_mastery_reset | 6.0 | SLIM | seeds 43 and 44 to 42 | 4.23, 1.96 | 1/1 |
| furnishing_item_kind | 6.0 | KEEP | already one seed on a camp-free world that keeps its NPCs | 4.49 | |
| bank | 5.9 | SLIM | seeds 1 and 123 to 42 | 4.41, 2.16 | 2/2 |
| gathering_goal_runtime | 5.8 | SLIM | empty world, one seed | 4.37, 1.63 | 1/1 |
| deeds_dirty_keys | 5.8 | SLIM | seed 7 to 42 | 4.05, 2.60 | 1/1 |
| hoard_loot | 5.8 | SLIM | 4 seeds to 1 empty-world seed | 6.48, 0.50 | 1/1 |
| forgebreaker_ember | 5.7 | SLIM | seed 84 to 83 | 3.95, 2.62 | 1/1 |
| professions_trend_delivery_kind | 5.6 | KEEP | already on the empty world; ticks the real letter delay | 4.48 | |
| corpse_harvest_rights | 5.5 | SLIM | seeds 31, 32, 22 and 23 to 21 | 4.85, 1.20 | 2/3 |
| professions_skill | 5.3 | SLIM | twin seed 99 to 7 | 3.83, 2.22 | 1/1 |
| woc_market_settlement_pg_integration | 5.2 | KEEP | the cost is the one-time schema build | 3.19 | |
| loot_explorer_window_focus | 5.2 | KEEP | 2.87 s locally, under the floor | 2.87 | |
| profession_attunement_quests | 5.2 | SLIM | seeds 9043 and 4242 to 9042 | 5.55, 3.08 | 1/1 |
| freehold_npc_spawn | 5.2 | KEEP | pins a full-world entity and rng fingerprint | 4.37 | |
| furnishing_crafting | 5.1 | SLIM | empty world | 3.22, 0.47 | 1/1 |
| market_orders | 5.0 | SLIM | vendor world | 3.16, 1.74 | 1/1 |
| professions_admission_drift | 5.0 | SLIM | empty world | 3.60, 0.43 | 1/1 |
| item_instance | 5.0 | SLIM | vendor world | 3.54, 1.82 | 2/2 |

**The deleted FFA twin.** A cross-Sim leak and a half-speed countdown both survive the deleted
twin on the base file (it compared two clamped zeros), which is how it was shown vacuous; its
90 s timeout went with it (no ledger row).

**A measured correction.** Empty-world Sims came out far cheaper than full or vendor-world ones
(ladder_crafting 6.36 s to 0.44 s), against the first round's note that an empty world still paid
the full collider build: the build is keyed by the active world content and the seed, and the
static grid is built by placing overworld NPCs, which an empty world does not have.

Weak pins found that predate this round, and the masterwork determinism twin's lost view of
construction-time draw drift, are listed with their fixes in `README.md` here.
