# Part 5 test cost, cluster economy-a

Branch `test-cost/economy-a` off `a2bd94a83e`. Twenty-one files, heaviest CI first. The CI
figure is the mean of the two baseline PR runs (`../data/ci_perfile_ms.tsv`). The local
figures are the medians of three `npx vitest run <file> --maxWorkers=1` runs each: the base
version (`a2bd94a83e`) measured first, then the branch tip right after it, on a shared and
loaded host (load average 20 to 30 from other agents). The before figures therefore sit
above the baseline README's quiet-host series, and only the before-to-after difference is
the claim. Mutants ran through the scratchpad runner (restore verified against HEAD before
each mutant, a Tests line required as proof the run happened). Every batch carried a
must-pass control, and every control passed.

## The cost model behind most rows

A full-world `Sim` pays about half a second the first time a file builds a given seed (the
constructor's safe-position search builds that seed's collider grids for the ACTIVE world
content), then a few ms per Sim on that seed. Three remedies cover most of this cluster:
- one seed per file where the seed is incidental (reload targets, determinism twins,
  identity or scope checks, forced rolls);
- the empty controlled world (`EMPTY_TEST_WORLD`, stations kept) where the code under test
  reads no camp, NPC or ground object and the case pins no seed-probed value;
- skipping idle waits the case is not about (bite waits, retry backoff).

A seed that a case HUNTED (a probed roll, rarity or catch) was never moved.

## Per-file record

| File | CI ms | Verdict | Change | Local tests s before, after | Mutants killed/total (source mutated) |
|---|---|---|---|---|---|
| corpse_harvest_sim | 47,830 | SLIM | The two #2513/#2514 corpus sweeps (about 280 fresh Sims each), the same-seed twin loops (#2474, #2504) and the zero-draw refusal arms run on `NO_SEED_PIN_WORLD` (the empty controlled world); every absolute seed pin stays on `CORPSE_TEST_WORLD`. The sweeps drop their 60 s declared timeouts (no ledger row; both were under the file default). | 26.79, 12.03 | 7/7: `professions/gathering.ts` (yielding filter dropped, dedupe dropped, junk filter kept twice), `professions/corpse_harvest_grant.ts` (ledger needs two yields, a draw before the capacity gate, the #2509 refusal burns the claim) |
| audit_conservation_property | 39,144 | MOVE TO NIGHTLY (sweeps) + SLIM (P6) | Each property sweep keeps its full seed count under `WOC_NIGHTLY_SWEEP === '1'` and runs the first fifth on PR; the named witnesses and the coverage floor are unchanged (the thinned PR run clears the floor with room: fewest successful op 462, every event arm reached). The exhausted leave flush steps the retry backoff on a faked `setTimeout` instead of sleeping 3.75 s per drive. Path added to the exact reader list in `tests/ci_shard_plan.test.ts`. Declared timeouts unchanged, so the 2,700,000 ledger row stays exact. | 20.99, 3.64 | Corrected by the fix round below (the first-round figures rode a harness defect). PR tier: 3 killed, a treasury mint in `guild_bank.ts` withdraw-gold (7 of 9 sweep cases), a skipped give-up reconcile in `server/leave_character_save.ts` and a skipped live-book revert in `server/guild_book_holders.ts` (both by the two P6 cases, on the faked clock; no sweep sees the revert at either depth). Neither depth: a netted-replay rescue that accepts a still-short log (`server/guild_bank_state.ts`); its first-round kill at seed 6163 was carried state, and `audit_cur_conservation` plus `guild_bank_persistence` catch it on PR (11 failures). Survive at BOTH depths, so no thinning loss: 4 (`guild_bank.ts` purge-arm revert, ladder compare-and-swap, withdraw shortfall; `guild_bank_state.ts` aliased delta log). Nightly-depth run of the unmutated file green. |
| professions_farming | 32,722 | SLIM | Eight arbitrary harness seeds move: 7, 9, 1, 2024, 777, 4242 and 555 to seed 41, the different-seed negative 778 to 4; every probed seed stays. The anti-chore arms now also run on 41: the fix round's stored-seed sweep carries the lateness mutants (first round: they kept 1234, where a +7 lateness offset absorbed at 41 is caught). | 14.06, 9.69 (9.20 after the fix round) | 6/6 on the first-round tree, plus the fix round's 5/5 lateness mutants on the new case (`professions/farming.ts` late yield-seed offset, late skill boost, cross-Sim leak at plant (3 cases), a growth-tick draw, golden always; `farm_persist.ts` load restarts growth) |
| professions_fishing | 29,519 | SLIM | The casts-to-200 derivation reads each segment's seconds from a table built once by `segmentSeconds` and, since the fix round, runs `evaluate()`'s own `combine()` on it (4.1 s to about 0.16 s; legal 16 and strict 3 unchanged, every table entry pinned to `evaluate()`). The empty-hook routing arm pulls each bite deadline to the next tick (5.3 s to 0.3 s) and drops its 60 s timeout. | 14.78, 6.57 | 2/2 (`professions/fishing.ts` empty-hook emit dropped, a schedule literal moved) |
| professions_enchant_salvage_arc | 27,920 | SLIM | Seventeen offline Sims on seventeen seeds share `WORLD_SEED`, which the live GameServer cases already build. | 9.27, 1.00 | 3/3 (`professions/enchanting.ts` crafted-victim slot marker ignored, replace arm drops the marker; `market.ts` listing drops the marker) |
| professions_deeds_playthrough | 22,429 | SLIM | The koi beat pulls each session's bite deadline to the next tick instead of ticking the full world through every drawn wait. The hunted stream literals downstream are incidental stream positions (the file's own header says to re-hunt them together) and were re-recorded in order: koi 17 to 15, veins 195/61/132 to 153/28/133, specimen 9 to 10. The beat drops its 90 s timeout. | 7.16, 2.39 | 2/2 (`combat/casting_lifecycle.ts` bite event dropped; `deeds.ts` collectItems miscounts the koi) |
| corpse_harvest_scope | 19,485 | SLIM | Seventeen seeds become one (`SCOPE_SEED`). | 8.27, 0.69 | 3/5 (`professions/corpse_harvest_scope.ts` dungeon corpse-slot check, actor finiteness, delve band). The 2 survivors (rift `memberIds` check, open-world actor inside an instance) survive the base version too: a pre-existing gap, owed below. |
| harvest_preference_sim | 14,328 | SLIM | Six reload Sims on six seeds share makeSim's seed. | 4.59, 1.32 | 4/4 (`professions/harvest_preference.ts` malformed revives All, legacy row refused, null save dropped, material not saved) |
| gather_node_harvest | 14,118 | SLIM | The gated-path determinism pair drops its extra seed (4242) for the default; the probed seeds 1 and 2 stay. | 6.33, 5.45 | 1/1 (`professions/gathering.ts` cross-Sim leak in the gatherResult quantity) |
| corpse_harvest_result_event | 14,048 | KEEP | Every rig seed is hunted per slot (the header's re-hunt ledger). A roads-stripped probe showed no clear gain inside this host's noise and was not kept. | 8.04 (one profiling run), unchanged | n/a |
| gather_attribution | 12,776 | SLIM | Four full-world seeds become one (`BARE_SEED`); the two-seed case's second seed rides the empty world. | 4.19, 2.65 | 4/4 (`material_gatherer.ts` persisted beats the character id, bare Sim invents an identity, host default beats persisted; `sim.ts` primary ignores the host identity) |
| professions_craft_xp | 12,316 | SLIM | All cases (the 220-recipe boundedness sweep included) run on `EMPTY_TEST_WORLD`, stations kept. | 6.24, 0.49 | 3/3 (`professions/crafting.ts` XP not learning-coupled, full grant halved, skill unclamped) |
| farm_ready | 12,222 | SLIM | Production idle-mob culling on the harness, and three extra seeds become 41; the rng-invisibility twin opts out of culling (its non-vacuity needs the world's own draws). | 4.99, 2.17 | 5/5 (`professions/farm_ready.ts` notice repeats, sweep draws; `sim.ts` no login notice; `professions/farming.ts` sweep order reversed, plant leak) |
| professions_blob_roundtrip | 12,029 | SLIM | Five reload Sims share the file's seed. | 4.18, 1.21 | 2/2 (`farm_persist.ts` ready time drifts per save; `professions/wheel.ts` craft skill unclamped) |
| professions_feast | 11,289 | SLIM | The bag-versus-bite pair (seed 7) and the zero-draw twins (4242) move to seed 42; the twins keep the wolf world. | 4.17, 3.10 | 3/3 (`professions/feast.ts` bite drops the wellFed carry, bite draws, cross-run leak) |
| craft_roll_events | 10,906 | SLIM | Every roll is forced, so all ten cases share one seed of the empty world (was eight seeds and three full worlds). | 3.43, 0.18 | 4/4 (`professions/crafting.ts` bonus-stats arm dropped, statless craft records, effect gate ignored; `professions/perfecting.ts` rank-after wrong) |
| professions_blob_growth | 10,785 | SLIM | Twelve settle-pass seeds become one (31). Probe: on the empty world the player entity ids are identical across seeds (44 and 49 at every seed probed: 31 to 34, 52, 53), so one seed loses no id-difference coverage. | 6.33, 1.45 | 2/2 (`professions/training.ts` knownRecipes uncapped, string knownRecipes throws). A farm-drift and a skill-clamp mutant survive both base and branch: they are the round-trip suite's guards, not this one's. |
| professions_commissions | 10,339 | SLIM | Nine offline Sims on six seeds share `WORLD_SEED` with the GameServer cases; every proc arm already forces its draw. | 5.12, 1.17 | 3/3 (`social/trade.ts` bound copy not locked, no bind stamp; `professions/crafting.ts` sub-rare commission not armed) |
| corpse_harvest_grant | 10,169 | KEEP | Seeds 3, 6, 15 and 30 are hunted; seed 11's claim-timing case relies on a non-signable roll (a specimen grant would land after the claim), so moving it is not free. | 3.75 (one profiling run), unchanged | n/a |
| craft_from_vault | 10,045 | SLIM | The determinism twins' two extra seeds become the default. | 3.38, 2.30 | 2/2 (`professions/crafting.ts` a vault take draws, the vault ledger leaks across runs) |
| wellfed | 13,226 | SLIM | Seeds 43 and 4242 become 42. The tree-wide namespace scan (2.2 s, file reading bound; a raw-text prefilter saved about 0.1 s and was not kept) is the only guard of its claim: KEEP as is. | 7.35, 6.16 | 4/4 (`wellfed.ts` mint draws, per-kind id, duration halved, a retired id planted in src) |

Totals over the 19 changed files: 161.62 s of local test time before, 63.66 s after
(97.96 s saved, 61 percent). Import time did not move (these are test-body cuts). The two
KEEP files are unchanged.

## Owed

- Closed in the fix round: the conservation sweeps' runs no longer share carried state
  (see below).
- The sweeps' FENCE arm never notices the live-book revert being skipped
  (`server/guild_book_holders.ts`), at PR or nightly depth; only the two P6 give-up cases
  catch it. Either the fence-arm revert is redundant under the escrow design or the
  effective-total check cannot see it; a reviewer should judge.
- `tests/audit_conservation_property.test.ts` catches the netted-rescue mint at neither depth
  now that runs are independent; two other PR suites do (see the row).
- `tests/corpse_harvest_scope.test.ts` leaves the rift `memberIds` check and the open-world
  "actor inside an instance" check unguarded (both mutants survive the base version too).
- The shard-weight rows for these files still carry their old CI times; the harvest
  (`node scripts/ci_shard_weights_harvest.mjs --carry-local --supersede`) re-measures them.
  Not touched here, per the rules.

## Product-side levers seen, not touched

- The static collider build (`src/sim/colliders.ts` `staticWorldColliders(seed)`) folds the
  seed's terrain height into every collider, so each new seed rebuilds the whole grid (about
  half a second). Splitting the seed-free footprint from per-seed heights would make a fresh
  seed cheap. It is the dominant remaining cost in this cluster, where the leftover seeds
  are hunted and cannot be merged.
- A Sim built with `world: EMPTY_TEST_WORLD` still builds the ACTIVE world content's grid for
  its seed, because colliders read the `data.ts` module global (the coupling `sim.ts`
  documents), so an empty world is only cheap on a seed the file has already built.
- `server/leave_character_save.ts` sleeps through a module-local `setTimeout` with no
  injectable delay; suites have to fake timers to skip it.

## Fix round (review findings), branch `test-cost/economy-a-fix` off `35e89ced9a`

1. Sweep runs were not independent (SHOULD-FIX). The carried state: a coalesced guild-book
   holder flush from the PREVIOUS world. `requestGuildBookFlush`
   (`server/guild_book_holders.ts`) arms its follow-up save only when the previous save
   settles, so between the two saves of one chain the per-character save queue reads empty;
   `drainStragglingSaves` checked only that queue, so the follow-up
   (`saveCharacterWithBackgroundPermit`, captured with an async stack from the dead world)
   committed world 6162's character row into world 6163's store (same character and guild
   ids) mid-run. Evidence under the netted-rescue mutant, before the fix: seeds 6000 to 6163
   fail at 6163; 6162 then 6163 fails; 6163 alone, 6000 then 6163, and 6163 twice pass; a
   1 ms settle between runs passes. The fix: the drain also waits on each session's
   `guildBookFlushInFlight` flag (set across that gap) and runs BEFORE the store reset. After
   it, 6162 then 6163 passes and the whole P4 other-dirty sweep (6000 to 6299) passes under
   the same mutant, so the 6163 kill was the defect itself, not a real witness: nothing to
   restore on the PR tier. The header now says why a seed replays alone.
2. The depth comment (SHOULD-FIX) now claims only what mutation proved: the PR tier catches
   the withdraw-gold treasury mint; this file catches the netted-rescue mint at neither
   depth, and `audit_cur_conservation` plus `guild_bank_persistence` catch it on PR.
3. Anti-chore luck (NIT). A new case sweeps six hand-written stored yield seeds across the
   32-bit range, plain and toniced, twins harvested on time and 12 hours late, on the default
   seed; the two plant-driven arms go back to seed 41 (`ANTI_CHORE_SEED` removed).
4. Fishing search (NIT). `evaluate()` is now `combine()` over `segmentSeconds`; the search
   runs the same `combine()` on its table, and every table entry is pinned to
   `evaluate()`'s own per-segment term (search 14 ms to about 160 ms; file 6.49 to 6.71 s).
5. Upstream divergence (record only). `release/v0.45.0` still runs the corpse harvest
   #2513/#2514 sweeps on the full world with 60 s declared timeouts. The empty-world change
   in `tests/corpse_harvest_sim.test.ts` should go upstream with this branch, or the two
   copies diverge at the next release sync.

Mutants (each batch with a passing control): the harness fix kept the withdraw-gold mint
(7 of 9 sweep cases) and the P6 reconcile skip killed, the P6 cases also kill the holder
revert skip, the nightly-depth control passed, the netted-rescue mint survives both depths
here and is killed by the two other PR suites (11 failures), and the other four survivors
still survive at nightly depth. Farming: +1, +7 and +13 lateness offsets on the yield seed, a
late skill boost and a late tonic drop, 5/5 killed by the new case on seed 41. Fishing: a
schedule literal, an edit to `evaluate()`'s segment term and an edit to `combine()`, 3/3
killed by the search case. Local test medians, base `35e89ced9a` then branch:
audit_conservation_property 3.73 to 3.45 s, professions_farming 9.62 to 9.20 s,
professions_fishing 6.49 to 6.71 s.
