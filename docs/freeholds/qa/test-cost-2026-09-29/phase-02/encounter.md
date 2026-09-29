# Part 5 test cost: the encounter cluster

Twenty-six heavy files (raid and dungeon encounters, the Crucible set bonuses, loot and
gold sweeps, mob evade, delves, the fortress route, PvP). Base `a2bd94a83e`; commits
`6a581ed71e` to `178f800f11` plus the record commit. Local figures are the medians of
three `npx vitest run <file> --maxWorkers=1` runs, before and after back to back on the
same host (`tests` from the Duration line; `import` moved by at most 0.4 s either way and
is not a lever here). CI seconds are the two baseline PR runs (36493201427 /
36501749917) from `data/ci_perfile_ms.tsv`.

## What cost what

1. A fresh seed per case. Almost every case built its full-world Sim on its own seed, and a
   seed the file has not built costs about 0.5 s (the per-seed collider grids,
   `gridFor` in `src/sim/colliders.ts`). The Varkhul, Ignivar and set-bonus files paid
   that 15 to 45 times each. Remedy: one seed per file; a seed-probed case keeps its seed.
2. The whole overworld ticking under an instance fight or a long wait. Remedy:
   production's idle culling (`idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS`), which the
   server and the offline client both set.
3. Seed sweeps. The loot, gold and affix sweeps built one world per seed (166 scoped
   worlds in `dungeons` alone). Remedy: one seed, then advance the shared rng `offset`
   draws per iteration, which rolls the same path from a new stream position.

## Proof that nothing was lost

- Every changed file: 3 of 3 green after (the timing runs), plus the targeted runs.
- Executed assertions per case (`expect.getState().assertionCalls`, recorded by a
  temporary `afterEach`) are identical before and after for every case of every changed
  file.
- Mutation (scratchpad runner, HEAD-verified restores): 33 mutants aimed at the guarded
  source, 29 killed by the slimmed files; the 4 survivors all sit on the fortress route
  and the base file survives the same ones (below). 7 must-pass controls passed.
- Seed-specific cases found by reseeding: the Forge Wave golden trace
  (`ignivar_encounter`) keeps its seed 418. The warlock gear-swap damage pair matched only
  on its probed seed 518 (two strikes at different rng positions); it now stubs identical
  non-critical rolls, the `dawnreaver_damage` rig's technique, and runs culled like the
  rest of its file (both 1.25x cases fail under a dropped and a 1.3x multiplier). The
  Judgment layout case now moves the encounter rng by burning draws on one seed, which
  pins that the layout comes from `ctx.rng` (a layout derived from the seed alone would
  no longer move).

## Per file

| File | CI s | Verdict | Change | Local tests s before / after | Mutants killed / total (source) |
|---|---|---|---|---|---|
| varkhul_forge_encounter_adds | 77.4 / 75.1 | SLIM | one seed (harness `FORGE_SEED`), culling in the forge harness | 27.19 / 2.89 | 2/2 (`encounters/varkhul.ts` exposure aura lifetime; `content/dungeons.ts` Warden Quake cadence) |
| varkhul_encounter | 75.5 / 74.7 | SLIM | one seed (42) | 26.67 / 1.99 | 1/1 (`varkhul_shared_pyre.ts` missing-soaker penalty) |
| varkhul_forge_encounter | 72.1 / 70.8 | SLIM | one seed, culling (shared harness) | 24.32 / 2.00 | 1/1 (`varkhul_cinder_artificer.ts` portal window) |
| ignivar_encounter_tanking_lifecycle | 62.7 / 37.3 | SLIM | one seed, culling in `ignivar_harness` | 23.34 / 2.91 | 1/1 (`encounters/ignivar.ts` Molten Armor refresh, culled tick path) |
| ignivar_forge_judgment | 58.2 / 33.8 | SLIM | one seed, culling, layout by rng burns, 45 s declared timeout dropped (case now about 1.5 s) | 19.49 / 2.29 | 2/2 (`ignivar.ts` safe-refuge draw, finale meteor cadence) |
| ignivar_encounter | 53.9 / 31.5 | SLIM | one seed except the 418 golden, culling (harness) | 19.19 / 3.26 | 1/1 (`ignivar.ts` Falling Cinders cadence) |
| dungeons | 36.8 / 35.6 | SLIM | three seed sweeps become rng-offset sweeps on seed 99; other cases share seed 99 | 11.49 / 1.36 | 2/2 (`loot/loot_roll.ts` heroic block gate, heroic group draw) |
| ignivar_set_bonus_warlock | 34.1 / 34.3 | SLIM | one seed (518), culling, gear-swap pair on stubbed rolls instead of a probed seed | 11.00 / 1.97 | 3/3 (`combat/necromancy.ts` Gravebrand 4pc dropped, twice, and 1.3x) |
| ignivar_set_bonus_druid | 30.7 / 31.3 | SLIM | one seed | 11.00 / 1.78 | 1/1 (`content/classes.ts` Moonscorch 2pc cap) |
| forgefather_fortress_route | 34.1 / 19.9 | SLIM | culling on the shared beforeAll Sim | 11.86 / 1.76 | 1/5 (`pathfind.ts` climb slope killed; step height 0.3 and 0.05, carry clearance and run speed survive, as they do on the base file) |
| battleground | 14.8 / 30.0 | KEEP | already one seed on `EMPTY_TEST_WORLD`; cost is spread over 185 cases and the modeled matchmaking waits | 10.05 (baseline row) | none |
| heroic_finale_gold | 21.9 / 21.6 | SLIM | one seed, rng-offset sweeps | 7.25 / 1.63 | 1/1 (`loot_roll.ts` heroic money swap) |
| ignivar_set_bonus_hunter | 20.0 / 19.4 | SLIM | one seed, culling | 6.59 / 1.47 | 1/1 (`combat/hunter_packlord.ts` 4pc threshold, culled live cases) |
| immobile_mob_evade | 18.4 / 16.2 | SLIM | culling | 5.13 / 1.29 | 1/1 (`mob/locomotion.ts` immobile evade snap) |
| nythraxis_raid_unit | 16.8 / 17.4 | KEEP | already one seed on `NYTHRAXIS_TEST_WORLD`; cost is modeled fight time over 62 cases | 5.88 (baseline row) | none |
| ignivar_set_bonus_shaman | 15.3 / 18.0 | SLIM | one seed | 8.39 / 1.74 | 1/1 (`combat/shaman_thundercall_kit.ts` Stormkindled 2pc) |
| gravewyrm_boss_gold | 16.4 / 16.3 | SLIM | one seed (1234, so the 2000-roll band is byte-identical), rng-offset heroic sweep | 5.61 / 1.04 | 1/1 (`loot_roll.ts` heroic money swap) |
| rift_progression | 16.7 / 15.8 | SLIM | one seed | 5.70 / 1.16 | 1/1 (`rift/progression.ts` upgrade cost ladder) |
| dawnreaver_damage | 12.0 / 18.1 | SLIM | culling | 7.52 / 3.64 | 1/1 (`combat/effect_dispatch.ts`: an added draw beside the multiplier) |
| mob_combat | 15.0 / 14.9 | SLIM | one seed | 5.15 / 1.04 | 1/1 (`mob/combat_profile.ts` leash clears autoAttack) |
| delves | 13.1 / 16.6 | SLIM | affix sweep by rng offset on seed 42; relog hosts on the file's sparse fixture | 6.74 / 2.38 | 2/2 (`delves/runs.ts` affix count, implemented-affix filter) |
| ignivar_set_bonus_mage | 14.2 / 12.1 | SLIM | one seed | 7.85 / 2.36 | 1/1 (`combat/frost_mage.ts` Frostquench 2pc) |
| mob_unreachable_evade | 9.7 / 14.0 | SLIM | one world seed (the rift seed still varies), culling | 5.71 / 1.46 | 1/1 (`mob/reachability.ts` stall clock, culled path) |
| ignivar_set_bonus_rogue | 10.3 / 12.4 | SLIM | one seed | 5.76 / 1.11 | 1/1 (`combat/rogue_engines.ts` Cinderfang 2pc) |
| instance_provenance_boundaries | 9.5 / 12.2 | SLIM | one seed | 4.94 / 1.56 | 1/1 (`items.ts` buyback payload) |
| world_pvp | 11.5 / 10.1 | KEEP | already one seed on a camp-free world; cost is five full 300 s disarm countdowns the cases assert | 6.58 (baseline row) | none |

Total over the 23 changed files: 267.89 s of local test time before, 44.09 s after
(223.80 s saved, 84 percent). The warlock row is its own later back-to-back pair, taken
after the gear-swap change; the other 22 rows come from one sequential sweep.

## Judgments

- The six set-bonus files do not duplicate a shared mechanism test: each pins its own
  class's four bonuses at their own reader sites, and the only repeated shape (the
  resolver registration case) reads that class's sets and costs milliseconds. No MERGE;
  each file keeps its cases on one seed.
- Culling reshapes the shared rng (passive idle rolls move to per-mob lanes,
  `src/sim/mob/idle_rng.ts`). It was applied only where every case stayed green with
  unchanged assertion counts. Draw observers around `sim.tick()` now see the fights' own
  draws only: `dawnreaver_damage` records 21 (it recorded about 2,700 unculled, almost all
  far idle rolls), so its `> 20` floor sits one under the live count, and the comment says
  so; the forge replay records 42.
- Two fresh coverage reviews ran over the diff; every finding was applied (comments that
  overstated a sweep or a seed claim, the rift pin's dependence on the world seed, the
  warlock seed coupling) or judged: the dropped 45 s timeout on the Judgment finale is
  kept dropped (the case measures about 1.5 s against the 20 s default), and the Artificer
  portal draw check calls the encounter directly, so culling cannot touch it.

## Owed

- `forgefather_fortress_route`: cutting the step height from 0.9 to 0.05, raising the
  carried-body clearance from 0.5 to 50, or cutting run speed from 7 to 2 all leave the
  route green, before and after this change. Only the climb slope bites. The header's claim that the
  suite exercises the tread step-up and the steep-ground strip is not what the thresholds
  prove; worth a look by the route's owner.
- `src/sim/types.ts` (the `idleMobTickRadius` comment) still says deterministic tests
  leave culling unset unless they pin it; the Ignivar and Varkhul harnesses now set it.
  Product text, not touched here.
- The shard weights for these files are stale until the next harvest (not touched here).

## Product-side levers seen, not touched

- The per-seed collider grid (`gridFor`, `staticWorldColliders` in `src/sim/colliders.ts`)
  rebuilds every building and prop collider per seed although only the height reads
  (`topY` from the seed's terrain) depend on it. Building the seed-free part once would
  cut every fresh-seed Sim across the suite.
- Making the per-mob passive idle lane independent of the cull radius would let any test
  cull without moving the shared rng (at the price of a parity golden re-mint).
- `world_pvp` ticks the 300 s disarm countdown at full resolution five times; a coarser
  host clock for idle countdowns would be a product change.
