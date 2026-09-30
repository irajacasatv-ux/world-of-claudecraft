# Part 5, second slimming round, tooling half B: per-file verdicts

Scope: 49 files of the 5 to 20 s CI tier (economy and delve tooling, server captures, world
content suites), none judged by the first round. Base `8f445b9422`; landed on feature/freeholds
as `71e325633f` to `8e4b7abd41` (45 commits, cherry-picked clean). Method as in `classes.md`.

## Verdicts

44 SLIM (one of them a MERGE within its file, one a MOVE TO NIGHTLY), 5 KEEP. Summed local test
time about 270 s to 114 s at one worker. Mutants: 44 killed on the changed guards, every control
green; `transport_lanes` ran 15 lane-shift mutants at both depths with the same verdict on each.
In the Change column, "empty world" is `EMPTY_TEST_WORLD` and "realm seed" is `WORLD_SEED`.

| File | CI s | Verdict | Change | Local s before, after | Mutants k/s |
|---|---|---|---|---|---|
| audit_cap_probe | 12.4 | SLIM | each sweep reuses one officer Sim, the book reloaded before every op (all 2,326 ops byte-identical to fresh Sims) | 8.68, 1.83 | 1/0 |
| dragonkin_whelp_litter | 12.2 | MERGE (in file) + SLIM | the single-lap case folds into the lap sweep (lap 0 keeps its assertions); shipped idle cull | 8.57, 5.49 | 2/0 |
| discord_db_integration | 10.2 | KEEP | needs Postgres; its 5,000 and 15,000 row fixture is part of what it pins | not run | none |
| cooldown_persist | 10.2 | SLIM | empty world, one seed (was four) | 7.21, 1.62 | 1/0 |
| hub_dummy_drill | 9.9 | SLIM | credit and live-damage cases on the empty world | 7.15, 2.30 | 1/0 |
| quickening_catalyst_gate | 9.7 | SLIM | empty world, one seed | 8.67, 1.84 | 1/0 |
| furnishing_consumer_parity | 9.4 | SLIM | the offline arm on the realm seed the GameServer already builds | 9.13, 7.21 | 1/0 |
| bags | 9.2 | SLIM | empty world (the vendor block on `VENDOR_TEST_WORLD`), one seed | 7.61, 1.89 | 1/0 |
| overlay_ip_scrub | 9.1 | KEEP | a guard suite; each corpus imported once, the CI cost is cold transform | 1.8 (base) | none |
| clue_scrolls | 8.9 | SLIM | twelve seeds become twelve rng states on one seed | 7.20, 4.20 | 1/0 |
| treasure_vault | 8.6 | SLIM | empty world, one seed | 6.64, 1.99 | 1/0 |
| v042_balance_tooltips | 8.3 | SLIM | rolls already pinned; one seed on the empty world | 6.91, 1.83 | 1/0 |
| mastery_reset_rehearsal | 8.3 | SLIM | the corpus on one seed (was eleven); import plus tests 13.4 to 3.3 | 8.38, 0.11 | 1/0 |
| whirlwind_echo | 8.3 | SLIM | empty world, one seed; hit-capped strikes replace hunted seeds | 7.67, 2.24 | 1/0 |
| transport_lanes | 8.3 | MOVE TO NIGHTLY | a 4-yard step on PR, 1-yard under `WOC_NIGHTLY_SWEEP` (reader registered) | 10.33, 4.11 | 4/11 at both depths |
| benison_prayer_tooltip | 8.1 | SLIM | empty world | 6.35, 2.51 | 1/0 |
| v027_port_restorations | 7.9 | SLIM | empty world (the taunt case on `RL_TEST_WORLD`), realm seed | 6.13, 2.27 | 1/0 |
| row_grants_cast | 7.8 | SLIM | empty world | 6.03, 2.15 | 1/0 |
| vanguard_set_bonus_a | 7.6 | SLIM | one seed (was four) | 6.05, 2.04 | 1/0 |
| masterwrought_materials | 7.5 | SLIM | the Sunder Sims on the scoped world | 6.69, 4.24 | 1/0 |
| lockpick_bountiful_jam | 7.4 | SLIM | thirty seeds become thirty rng states; the sweep asserts thirty distinct layouts | 6.03, 0.54 | 2/0 |
| server/movement_override_epoch | 7.3 | SLIM | the ferry voyage under the idle cull; fixtures on the empty world at the realm seed | 8.35, 2.60 | 1/0 |
| skill_icon_converter | 6.9 | KEEP | one CLI spawn per case is the contract; the two over-cap fixtures are the only drivers of retry and hard-fail | 5.3 (base) | none |
| flask_consumables | 6.8 | SLIM | one seed | 5.68, 4.75 | 1/0 |
| benison_dawnweave | 6.8 | SLIM | the rig already dropped every other entity; it now starts from the empty world | 6.31, 4.78 | 1/0 |
| rested_xp | 6.6 | SLIM | empty world, one seed | 5.00, 1.75 | 1/0 |
| climb | 6.6 | SLIM | fixture worlds without camps, NPCs or ground objects | 5.52, 2.81 | 1/0 |
| server/tick_perf_capture | 6.6 | SLIM | the lap probe on the realm seed, still the full world | 5.77, 4.58 | 1/0 |
| stable_yard | 6.4 | KEEP | already scoped; the ticks are the asserted wander window, and the cull would freeze the horses | 4.6 (base) | none |
| inscription_scroll_exclusivity | 6.2 | SLIM | empty world | 5.61, 1.89 | 1/0 |
| xp | 6.1 | SLIM | a one-wolf world on the realm seed | 4.91, 2.19 | 1/0 |
| wildheart | 6.0 | SLIM | the portal cases share the default seed; the loot sweeps keep their roll seeds | 4.66, 3.24 | 1/0 |
| materials_vault | 5.9 | SLIM | relog worlds and the determinism pair on the file's seed | 4.67, 2.42 | 1/0 |
| fiesta | 5.9 | SLIM | one seed | 6.64, 2.65 | 1/0 |
| ip_scrub | 5.8 | SLIM | the gate reads the determinism pair's first scan (the second stays fresh; nothing scanned less) | 4.19, 3.04 | 1/0 |
| sim | 5.7 | SLIM | the world-generation pair on the default seed, still the full world | 5.69, 4.38 | 1/0 |
| hoard_add_casts | 5.6 | SLIM | empty world, one seed | 4.14, 0.45 | 1/0 |
| archetype_ceiling | 5.6 | SLIM | combo and skill-gain Sims on the empty world; hunted-proc cases untouched | 4.15, 2.13 | 1/0 |
| hoard_reward_chest | 5.4 | SLIM | empty world, one seed | 4.38, 0.50 | 1/0 |
| hoard_tentacles | 5.4 | SLIM | empty world | 5.86, 0.69 | 1/0 |
| town_focus_sim | 5.4 | SLIM | empty world, realm seed | 5.88, 2.39 | 1/0 |
| resurrection_reach | 5.3 | SLIM | empty world | 5.57, 2.32 | 1/0 |
| markers | 5.3 | SLIM | a wolf world, realm seed | 4.59, 2.19 | 1/0 |
| fiesta_bots | 5.3 | SLIM | empty world | 4.48, 1.78 | 1/0 |
| playtime | 5.2 | KEEP | already scoped; the ticks are the playtime clock it asserts | 3.5 (base) | none |
| sim_context | 5.2 | SLIM | the seam pairs on one seed, still the full world | 4.26, 3.20 | 1/0 |
| mirefen_dedupe_objectives | 5.2 | SLIM | the idle cull on the Broodmother egg loops | 4.43, 3.17 | 1/0 |
| soulwell | 5.1 | SLIM | empty world | 4.38, 1.87 | 1/0 |
| portals | 5.0 | SLIM | empty world | 3.35, 1.72 | 1/0 |

**The ledger.** Folding the whelp single-lap case into the sweep brought the file's declared
timeouts to 300 s, the default allowance, so its exact row in
`tests/suite_duration_budget.test.ts` was deleted (`0ccd57a829`; a mutant raising one of the
file's timeouts is killed by the ledger).

**transport_lanes.** Of 15 lane-shift mutants, 4 are killed and 11 survive at both depths, the
5 to 6 yard boundary among the survivors: the 1-yard nightly step finds nothing the 4-yard PR
step misses. The nightly depth is kept as the whole sweep, not as extra coverage.

**A measured correction to the brief.** A fresh seed cost about 1 to 1.5 s even on a scoped
world, not the half second the brief estimated, so one seed per file pays more than expected.

Weak pins found that predate this round (the lockpick sweep counting a burnt try as opened, the
town focus hub gate unchecked for the time tier) were fixed in `101080eb9a` and `36b368e245`;
both source mutants survive the old assertions and are killed by the new ones.
