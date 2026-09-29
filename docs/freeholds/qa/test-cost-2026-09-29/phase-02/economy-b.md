# Part 5 test cost, cluster economy-b

Branch `test-cost/economy-b`, cut from `a2bd94a83e` and rebased onto `5b08a5f09a` (the only
conflict was the `WOC_NIGHTLY_SWEEP` reader list in `tests/ci_shard_plan.test.ts`, resolved
as the union). Twenty-one files, heaviest CI first: sixteen plain suites and five Postgres
suites. The CI figure is the two baseline PR runs (`../data/ci_perfile_ms.tsv`, run
36493201427 then 36501749917). The local figures are the medians of three
`npx vitest run <file> --maxWorkers=1` runs (the `tests` figure of the Duration line), before
and after measured back to back on a shared, loaded host. Only the before-to-after
difference is the claim; import time moved by host noise only (every change here is a test
body cut). The Postgres suites ran through the scratchpad `with_pg.sh` after the arm was
proven (`tests/server/freehold_db.pg.test.ts` 16 of 16), and every pg run below reported
its full case count with none skipped. Mutants ran through the scratchpad runner (the
target equals HEAD before each mutant, restore verified, a Tests line required as proof
the run happened); every batch carried a must-pass control, and every control passed.

## Where the time went

- Fresh seeds. A file pays for every seed it builds: about half a second for a full world,
  and on this loaded host about 0.4 s for a fresh seed of `EMPTY_TEST_WORLD` too
  (`unique_equipped` spent 10 s on fifteen of them). Most rows below share one seed per
  file and move world-blind cases onto the empty test world. Where a case needed its own
  draw stream, the Sim reuses the shared world and re-seeds `sim.rng`, the idiom
  `loot_roll`'s dedup case already used. A seed a case hunted (the reliquary masterwork
  seed 21) was never moved.
- Full-world ticks without production's idle culling (the fixes walks, the faction
  hearthstone and battle standard, the awarded-loot 90-second decay walk).
- Real sleeps a case was not about (the guild bank boot-load retries and the exhausted
  leave flush: 5.25 s of backoff).
- In the Postgres suites: shipped lock and idle bounds (kept), a fixture's per-row
  foreign-key triggers, test-chosen probe timeouts, and measurement repeats.

## Per-file record

| File | CI ms | Verdict | Change | Local tests s before, after | Mutants killed/total (source mutated) |
|---|---|---|---|---|---|
| guild_bank_persistence | 25,270 / 23,844 | SLIM | Seeds 3, 99 and 9913 become the GameServer's `WORLD_SEED`. The boot-load retry pair and the exhausted leave flush wait out their backoff on a faked `setTimeout` (the file's own 70-second-bound idiom); the give-up case now also pins all three read attempts. The leave flush drops its 30 s declared timeout (under the file default). | 12.83, 6.27 | 5/5 (`server/leave_character_save.ts` reconcile dropped, reconcile never reached; `server/game.ts` one boot attempt, the loud line reworded; `server/guild_bank_state.ts` oversized row loaded) |
| faction_rewards | 27,399 / 16,090 | SLIM | Eleven seeds (101 to 111) become one, and every Sim runs with production idle culling. | 12.17, 2.55 | 4/4 (`content/faction_rewards.ts` hearthstone cooldown, teleport dropped, battle standard threshold, out-of-radius reset) |
| unique_equipped | 21,942 / 21,416 | SLIM | Twenty-one empty-world seeds (the fifteen warriors and six reload Sims) become one. | 10.47, 0.88 | 3/3 (`items.ts` equip refusal off, duplicate never benched, benched copy loses its instance) |
| perfecting | 21,268 / 21,998 | SLIM | About thirty empty-world seeds plus ten full worlds (the four reloads and six apex crafters) become one empty-world seed; no case reads world geometry and every rng arm forces or counts its draws. | 9.93, 0.87 | 5/5 (`professions/perfecting.ts` success inverted, bind dropped; `professions/crafting.ts` commission bond dropped, head-start rank dropped; `item_instance_load.ts` upper rank bound dropped) |
| mail_expiry | 22,534 / 11,986 | SLIM | Six `tickFor(sim, 100)` gaps (2,000 ticks each) between a read or take and its repeat become one sim-second (`ELAPSE_SECONDS`): every clock is compared exactly, so any elapsed time shows a re-extended clock. The 47-second flights stay (see mail). | 7.64, 6.00 | 3/3 (`mail/post_office.ts` a take always restarts the clock, a repeat read extends it, sub-silver coin counted as escrow) |
| reliquary_state | 17,440 / 16,823 | SLIM | `makeSim` builds the empty test world; the four world-reading cases (the banker, two Trader Wilkes buybacks, the hunted masterwork seed and its control) build a full world on the one shared seed 21. The incidental seeds 99 (determinism twin) and 43 (reload) become the default. | 6.85, 1.83 | 4/4 (`reliquary.ts` retro fill pushes recent, a movement find stamps clears, re-obtain writes no carrier; `items.ts` buyback without the movement flag) |
| awarded_loot_hold | 16,508 / 17,680 | SLIM | Every corpse is hand-built and no case reads the world, so the file runs on the empty test world (the 90-second decay walk was 1,800 full-world ticks). The determinism twin reruns the default seed instead of building seed 7. Drops a 30 s declared timeout (under the file default). | 13.29, 1.39 | 3/3 (`mob/locomotion.ts` corpse decays four times fast; `loot/awarded_loot_hold.ts` hold window 60 s, hold open to all) |
| masterwrought_cap | 14,761 / 19,216 | SLIM | Twenty empty-world seeds become one. | 9.32, 0.78 | 3/3 (`equipment_rules.ts` cap off by one, sub-cap reads the def quality, worn instances ignored) |
| mail | 15,298 / 15,777 | KEEP | Already one seed of a scoped world. Each case pays one real 47-second flight (about 0.19 s), and the flight cannot be skipped from a test: the post office's in-flight index keys `deliverAt` at booking, so pulling a letter's `deliverAt` in does not land it. | 4.99 (one profiling run), unchanged | n/a |
| loot_roll | 10,703 / 19,173 | SLIM | Nine full-world seeds (42, 7, 1234, 0, 5, 123, 1, 99, 2024) become one empty-world build; `makeSim(seed)` re-seeds `sim.rng` with the case's own seed, so every same-seed twin still compares two runs of one stream. | 6.75, 0.35 | 4/4 (`loot/loot_roll.ts` cross-group dedup off, normalOnly rows rolled on heroic, the remainder swap draws from 0, need read as greed) |
| sim_quests_economy | 14,934 / 14,743 | SLIM | The two RL cases build seed 42, which every other Sim in the file already builds, instead of seeds 123 and 999. | 4.97, 3.87 | 2/2 (`obs.ts` NaN on the position slot while moving, killed by the finiteness case; `Math.random` in the hp slot, killed by the replay case) |
| town_focus_pending | 14,241 / 14,173 | SLIM | Seven full-world seeds (21, 3 to 7, 9) become one seed of the empty test world: town focus reads only the zone hub's position. | 5.10, 0.72 | 3/3 (`professions/town_focus_commands.ts` resolves early, skips the affordability cancel; `professions/town_focus_pending.ts` loads an absolute clock) |
| equip_drop_core | 11,402 / 11,224 | SLIM | The six sim-authority seeds become one empty-world seed. | 4.43, 0.89 | 3/3 (`items.ts` unique refusal off on the sim side; `equipment_rules.ts` cap off by one; `ui/equip_drop_core.ts` candidate quality dropped on the client side) |
| trinket_tooltip_view | 9,131 / 11,959 | SLIM | The Gambler's Die case built a full world for every seed it tried until all four fortunes rolled; it now builds one Sim per iteration on the shared seed and re-seeds `sim.rng` (the fortune is one `ctx.rng.int`). `wearing()` runs on the empty test world. | 5.76, 0.20 | 3/3 (`combat/trinkets.ts` last fortune unreachable, lucky-streak tick count, snake-eyes refund dropped) |
| heroic_vendor | 10,714 / 10,329 | SLIM | The mark persistence cases' five extra vendor-world seeds (21 to 25) become the default 5. | 3.28, 0.77 | 3/3 (`instances/dungeons.ts` marked set not written, telemetry kept across a reset; `professions/daily_gate_load.ts` date dropped on load) |
| fixes | 10,809 / 9,285 | SLIM (per case) | The four long full-world walks (the open-shore swim, 400 ticks; the town wall, 120; the deep-water chase, 240; the dungeon placement sweep with its 220-tick lift ride) run with production idle culling through a file-local `makeCulledSim`, since `fixes_shared.ts` is shared with a file outside this cluster. The two loot cases judged KEEP in the earlier pass are untouched. | 6.26, 3.71 | 3/3 (`fatigue.ts` warning log never fires; `mob/move_toward.ts` a swimming mob sinks to the floor; `ignivar_forge_lift.ts` the lift never arrives) |
| character_save_statement_pg_integration | 20,783 / 15,977 | MERGE (one case) + KEEP | Time: three cases wait the shipped 2 s lock bound on a real contended lock (KEEP: they are the only proof the bound fires, one per writer and table), and the lock-versus-statement case slept 2.5 s past the lock bound, then slept again until the 5 s statement bound. Its first half folds into the second: one running statement cancelled with 57014 at the statement bound proves both claims (a lock bound that cut a running statement ends it near 2 s with 55P03, failing the code and the floor). The constants' values and order are pinned in `tests/server/save_offline_character_state.test.ts`. The declared-timeout ledger row (600,000) is unchanged. | 16.45, 13.97 | 2/2 (`server/offline_character_save_db.ts` a statement bound equal to the lock bound, killed by the merged case alone; lock bound dropped) |
| woc_market_bond_pg_integration | 17,804 / 17,139 | SLIM (three arms) + KEEP | Time: the shipped 2 s guard lock bounds (KEEP), a 2.6 s stall past the shipped 2 s idle bound (KEEP), a one-time database and schema build (about 2.6 s), and three test-chosen 1.2 s probe lock timeouts in the NO KEY blocking arms. The probe becomes `PROBE_LOCK_TIMEOUT_MS = 300`: `lock_timeout` fires only on a real lock wait, so any positive bound proves the block. The self-conflict arm's waited floor moves from 1,000 to 250 ms with it (incidental: it is the probe bound less a margin). | 16.36, 13.80 | 3/3, test-level (these arms pin PostgreSQL lock-mode facts the escrow cap rests on, not product code): listing negative control unblocked, accounts negative control unblocked, self-conflict taken as KEY SHARE |
| admin_db_integration | 17,282 / 17,016 | SLIM | Time: 4.86 s loading 500k `play_sessions` rows, 3.5 s of it the inline foreign key's per-row trigger checks. The key is now added after the load in one validating scan; the table ends in the same shape, and the indexes (the shipped one included) are still built empty and maintained row by row through the load, as the fixture's comment requires. The EXPLAIN ANALYZE plan pin is unchanged. | 4.85, 1.54 | 2/2 (`server/admin_db.ts` the week window back to the COALESCE form; `server/admin_db_indexes.ts` index renamed) |
| woc_market_delivery_pg_integration | 15,358 / 17,825 | MOVE TO NIGHTLY (two measurement repeats) + KEEP | Time: two escrow cost measurements (three container shapes times four passes, three maximum-prefix passes: about 5 s) and two shipped 2 s lock bounds (KEEP). The repeats exist for the logged timing samples; the suite now reads `WOC_NIGHTLY_SWEEP === '1'` itself. PR: each shape runs its create pass and its change pass, and one maximum-prefix pass, which is the statement-timeout proof. Nightly: the full depth. The revision pin reads `String(MATERIAL_SOURCE_PASSES)` (one revision per changing pass). Path added to the reader list in `tests/ci_shard_plan.test.ts`; both depths ran green; the declared-timeout ledger row (450,000) is unchanged. | 12.84, 9.49 | 2/2 on the PR tier (`server/material_source_journal_db.ts` revision stalls, killed by the two-pass case; `server/woc_market_db.ts` `ESCROW_STATEMENT_TIMEOUT_MS` 40, killed by the one-pass maximum-prefix case and the two-pass case) |
| mail_custody_overlay_pg_integration | 15,302 / 15,282 | SLIM | Ten full-world host seeds (the live Sims and every restart) become one seed of the empty test world: the overlay reads the post office, its mailboxes (`BUILTIN_WORLD.services`) and the vault. | 7.12, 1.62 | 3/3 (`server/mail_custody_overlay.ts` bake DELETE dropped, pending refs not scoped by recipient, replay off) |

Totals over the 20 changed files: 176.67 s of local test time before, 71.49 s after
(105.18 s saved, 60 percent). Of that, the Postgres suites account for 57.62 s before and
40.42 s after.

## Owed

- `tests/sim_quests_economy.test.ts`, the RL finiteness smoke: in 600 steps the rogue never
  enters combat, auto-attacks or starts a GCD, so a NaN on those observation slots passes
  it (checked on the original seed 123 too; a pre-existing gap, not a thinning loss).
- (Closed.) `tests/suite_duration_budget.test.ts` was red on `c1b40fd9bb` from outside this
  cluster (`tests/parity/run_scenarios.ts` passed an unsizable `c.timeout`); the coordinator
  fixed it in `5b08a5f09a`, and it is green on this branch's rebased tip.
- The CI weight rows of the changed files are stale until the harvest re-measures them.

## Product-side levers seen, not touched

- A fresh seed of the empty test world still costs about 0.4 s on a loaded host, so the
  per-seed collider build is not only the full world's. A cache keyed by what the grids
  actually read (the terrain seed and the active colliders) would make many seeds cheap.
- The post office has no index-aware way to land an in-flight letter early, so every mail
  suite ticks out real 47-second flights (about 0.19 s each on the empty world).
- `Sim` defaults `idleMobTickRadius` to off, so every full-world test that ticks pays for
  every idle mob unless it opts in; the shipped hosts all opt in.
