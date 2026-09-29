# Part 5 test cost: the long-sims lane cluster

The 17 `CI_LONG_SUITES` files (`scripts/lib/ci_shard_plan.mjs`), run by the two "PR long
sims" jobs on every PR and by the nightly tests job at full depth
(`WOC_FULL_BALANCE_SWEEP=1`). Baseline from `data/ci_perfile_ms.tsv`: 2,070 s of lane test
time per PR (mean of the two PR runs) and 8,739 s nightly, 7,876 s of it the eleven diet
readers.

## Where the time goes

Fifteen of the files are probe harnesses: each probe builds a full-world `Sim` and ticks it
for the probe's window. Counting ticks per file from the harness code
(`scripts/owned_class_balance_probe.ts`, `scripts/druid_balance_probe.ts`,
`scripts/hunter_dps_probe.ts`, `scripts/warlock_balance_probe.ts`) against the PR CI series
gives 7.6 to 9.4 ms per tick in the lane for every one of them, so their test time is ticks
and almost nothing else: Sim construction is under a second per fresh seed with a few seeds
per file, and a scenario costs only the ticks it runs. The measured cuts below land within a
few points of the tick model (DPS metrics 37.5 percent of ticks removed, 35.8 percent of
time; healer probes 25 and 28.1). The two other files: `eastbrook_gameplay_integration`, where
one case (two worlds ticked 2,500 times each) was 95 percent of the file, and
`nythraxis_matrix`, two tsx child processes of four Monte Carlo fights each.

Production idle culling, the first remedy on the menu, is not a slim here: with
`idleMobTickRadius` set every passive idle roll moves to a per-mob lane
(`src/sim/mob/idle_rng.ts`), which reshapes the shared stream each probe's crits and procs
draw from, so it moves every banded number. It is the largest lever in the lane and is
recorded under "Ruling owed" with its measured effect.

## Per file

CI s: the two PR runs' mean / the nightly. Local: `npx vitest run <file> --maxWorkers=1`,
three runs of each arm back to back (the arms interleaved), medians of the Duration line's
`tests` and `import`; the before arm is the base commit's file copied beside it. Import stayed
at 0.4 to 2.8 s in both arms everywhere (collect cost is not where this cluster spends).

| File | CI s | Verdict | Change | Local tests s, before to after | Mutants |
|---|---|---|---|---|---|
| druid_balance_probe | 286 / 3,054 | SLIM (diet) + MOVE (two profiles to the nightly) | PR diet runs the two banded profiles, moongrove_1t and wildfang, every capstone each: 6 of 12 probes. moongrove_3t and groveheart asserted only "best capstone above zero" (blind to a zero under one or two capstone rows); the nightly keeps all 12. At PR time an all-rows zero stays visible only through the PBE rows the sibling suites run (Moongrove three-target under improved_hurricane, Groveheart under berserk); a zero under the other capstone rows alone is nightly-only. The Bruin determinism case re-runs the banded seed against the band case's run (was two runs at a seed nothing else builds). | 176.82 to 95.11 (46.2%) | 4/4 killed: `WILD_APEX_MULT` 1.25 to 1.6 (`src/sim/combat/druid_engines.ts`) reds the diet band; a per-call drift in `runDruidBruinTankProbe` reds determinism; Groveheart casting nothing and Moongrove dead at three targets (`scripts/owned_class_balance_probe.ts`) are killed at PR time by healer_probes and dps_metrics, the representatives of the two profiles moved to the nightly |
| owned_class_balance_dps_metrics | 145 / 249 | SLIM (diet) | Diet keeps the eight three-target sustained runs plus the two single-target runs with an assertion (Packlord's Stampede, Wildfang's Redharvest): 10 of 16. The only target-count branches (Coldsight Volley, Thundercall Earthquake and Chain Lightning) are extra three-target buttons, so the three-target priority is a superset; the dropped specs' single-target rotations run on every PR in dps_probes, role_bands and druid_bands. Nightly unchanged. | 90.93 to 58.36 (35.8%) | 4/4 killed: Moongrove dead at three targets and Packlord never pressing Stampede, killed by the slimmed file; Coldsight and Thundercall dead at one target, killed by dps_probes (the representative for the dropped runs) |
| owned_class_balance_healer_contract | 120 / 484 | MERGE (one assertion) | Drops the single-target Spiritmend average (two diet probes, five nightly); its one assertion, hps above zero, is held per run at one and three allies by healer_probes in the same lane. | 74.65 to 60.96 (18.3%) | 2/2 killed: single-ally Spiritmend casting nothing is killed by healer_probes; healers starting at 30 percent mana still reds this file |
| owned_class_balance_healer_probes | 120 / 174 | SLIM | Every fixed profile run is paid once (one seed, 29_910): the Priest pressure case reads the three-ally Doctrine and Benison runs (both hold absorb above zero and a Vigil weave there: 2,898 absorbed, 3 casts), and the determinism case re-runs Spiritmend against its first run. Four fresh seeds became one. | 76.30 to 54.83 (28.1%) | 5/5 killed: Benison never weaving Seraphic Vigil, Doctrine never shielding, a per-call drift in `runOwnedHealerProbe`, and the two MERGE/MOVE proofs above |
| owned_class_balance_groveheart | 88 / 151 | MERGE (one probe) | The heal-over-time case reads the contract case's three-ally run at 29_914 (Wildbloom 2,142 there) instead of its own at 29_913. | 56.41 to 48.91 (13.3%) | 1/1 killed: heal-over-time ticks attributed to the ally, not the healer (`src/sim/combat/auras.ts`) |
| owned_class_balance_dps_probes | 63 / 84 | SLIM, narrowing | The determinism case re-runs the Bloodhook case's Fieldcraft fixture against its run (was two three-target runs at a seed nothing else builds). A narrowing: no lane suite now runs a multi-target DPS probe twice, so harness determinism under several targets (the three-target rotation branches) is no longer pinned in the lane; the sim's own determinism under several targets stays with the parity goldens (multi-target scenarios such as Consecration and Arcane Explosion must reproduce their committed traces). | 40.60 to 31.76 (21.8%) | 2/2 killed: a per-call drift in `runOwnedClassDpsProbe`; Fieldcraft never applying its Bloodhook wound |
| eastbrook_gameplay_integration | 108 / 152 | SLIM | The projection case switched the active world content every tick, bumping the content generation 5,000 times, so every tick rebuilt the terrain region, road and bounds caches keyed on it. Each world now runs its 2,500 ticks under its own content; the comparison, tick count and respawn check are unchanged. | 61.04 to 27.91 (54.3%) | 1/1 killed: the Eastbrook bank moved onto the Wolf Run wander lane (`src/sim/eastbrook_layout.ts`) forks the projection |
| nythraxis_matrix | 50 / 62 | MERGE (two children to one) | One child at the non-default shard 1 of 2 (exactly seed 2 across the four plans, in plan order) carries the gear, talent and cast assertions; the five cast assertions moved from seed 1 (the shard-0 child) to seed 2. As first committed this left shard 0's own sample (seed 1) unpinned; the review round below restores that pin without a second fight. | 27.49 to 14.09 (48.7%) | 2/2 killed: the shard index ignored (always 0), and Monte Carlo sharding dropped (`scripts/nythraxis_matrix.ts`); plus the review round's 5 |
| hunter_dps_balance | 175 / 627 | KEEP | Twelve 90 s probes, every one inside a ratio band; already on the two-seed diet. | unchanged (99.5 in the baseline) | none needed |
| owned_class_raid_armor_avoidance | 155 / 701 | KEEP | Eight 120 s level-24 probes; the Vespers median and best-other ceilings need all eight, and the window is a long-fight guard. | unchanged (87.5) | none needed |
| owned_class_balance_role_bands | 136 / 602 | KEEP | Seven probe configurations at two seeds, all inside ratio bands. | unchanged (77.0) | none needed |
| owned_class_raid_sustain_bands | 126 / 1,276 | KEEP | Three specs at two seeds, 120 s, mana and cadence long-fight guards. | unchanged (70.5) | none needed |
| owned_class_balance_druid_bands | 80 / 164 | KEEP | Every probe feeds a band. Known release-owned red on the nightly full sweep (194.3 against 191, the wildfang ceiling); not re-banded here. | unchanged (45.8) | none needed |
| warlock_anchor_affliction, _demonology, _destruction | 84, 86, 92 / 263, 211, 244 | KEEP | Two cases of two 120 s probes each, every one inside a band; already on the two-seed diet. | unchanged (48.4, 50.6, 53.1) | none needed |
| warlock_five_minute_windows | 156 / 241 | KEEP | Three 300 s windows guard time-to-empty mana; never shortened. | unchanged (91.8) | none needed |

Mutation totals: 20 mutants in two batches, 18 expected kills all killed (three of them are
listed under two files above, the file they prove and the file that kills them) and 2
must-pass controls (a comment appended to each harness) passed; every run printed its Tests
line and the runner verified each file against HEAD before every mutant.

Local total over the eight changed files: 604.2 s to 391.9 s of test time, 212.3 s saved (35
percent). Scaled by each file's measured ratio, the PR lane saves about 350 s of its 2,070 s
(about 146 s in half a, 203 s in half b), and the nightly about 290 s (the druid matrix keeps
its full depth there).

Verified before the diet change: `runDruidBalanceSeed(4242)` narrowed to the two kept
profiles returns cells identical to the whole matrix's (each probe is its own fresh Sim), and
the diet's best builds read the documented actuals (moongrove_1t 155.82, wildfang 198.89).

## The nightly full sweep: redundant configurations

Found by reading the harnesses for runs that repeat a configuration or whose result another
run already contains. None is changed here; each is a lever for its owner.

1. (Ruled 2026-09-29, "One seed, every row", and done: one seed, every capstone row above zero,
   nightly-only; see `rulings-2026-09-29.md`.) The druid matrix's moongrove_3t and groveheart
   cells: 48 of the 96 nightly probes (8 seeds
   x 3 capstones x 2 profiles, 123 s each), about 1,500 s of the file's 3,054 s, for an
   assertion ("the best capstone's seed average is above zero") that more seeds only weaken,
   since the average drops zero seeds. One seed of them, or real bands on them, would carry
   the same or more. The matrix is the design doc's measurement, so this is the owner's call.
2. `owned_class_raid_sustain_bands` and `owned_class_raid_armor_avoidance` run byte-identical
   probes: Thundercall, Warspirit and Vespers at seed 29_931 against the level 22, 23 and 24
   Nythraxis profiles (nine probes nightly, about 250 s; three at PR time, about 60 s of lane
   time). They live in different lane halves, so only a file merge (a `CI_LONG_SUITES` edit)
   could share them.
3. The warlock level-20 dummy tripwire at seed 42 (each anchor file, 120 s) is the exact first
   120 s of the five-minute window at seed 42 (`warlock_five_minute_windows`, same default
   scenario; the rotation never reads the window length). About 60 s of lane time per PR and
   per nightly across the three specs; the same file-merge caveat applies.
4. `owned_class_balance_dps_metrics` nightly: the eight specs' 15 s burst probes are the exact
   first 15 s of their 60 s sustained probes at the same seed and targets (the rotation never
   reads the window). One run with a 15 s checkpoint would give both; 16 of 32 probes, about
   20 percent of that file's ticks.
5. Removed in this change: the healer contract's single-target Spiritmend average (five
   probes nightly).

## Ruling owed: production idle culling in the balance harnesses

Ruled 2026-09-29 ("Adopt and re-band"), and done: the harnesses boot the cull through
`scripts/probe_sim.ts` and every lane band was re-measured at it (`rulings-2026-09-29.md` in
this record). The measurement below is what the ruling was asked on.

Measured with a scratch probe that builds every harness Sim with
`idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS` (what the server and the offline client
run), same probes back to back, one worker:

| Probe | Unculled ms | Culled ms | Unculled value | Culled value |
|---|---|---|---|---|
| Warspirit, level 24, 120 s, seed 29_930 | 14,854 | 1,931 | 175.62 dps | 169.53 |
| Vespers, same | 11,005 | 1,150 | 159.15 | 155.48 |
| Thundercall, same | 10,185 | 1,095 | 156.14 | 155.15 |
| Warspirit, seed 29_931 | 11,786 | 1,741 | 161.20 | 152.79 |
| Vespers, seed 29_931 | 10,536 | 1,208 | 154.65 | 147.56 |
| Thundercall, seed 29_931 | 10,334 | 1,158 | 168.30 | 133.81 |
| Spiritmend, three allies, 60 s, seed 29_910 | 6,746 | 1,346 | 274.30 hps | 255.55 |
| Affliction, heroic, 120 s, seed 42 | 14,146 | 1,853 | 189.27 dps | 189.82 |

Six to nine times faster per probe: the lane would fall from about 2,070 s to about 300 s per
PR and the diet readers' nightly from about 7,900 s to about 1,100 s. The cost is one full
re-banding of both configurations (every band is pinned to a measurement at its own
configuration), because per-seed values re-roll by up to 20 percent (Thundercall at 29_931).
The two-seed means the raid sustain diet asserts stay inside their bands in this sample
(Thundercall over Vespers 0.954 against the 0.66 floor, Warspirit 1.064 against 0.76 to
1.16). In favour: the probes would measure what production runs, and far-world content moves,
which forced most of the re-anchors recorded in these files' comments, would stop re-rolling
them (construction-time spawn draws still would). Not applied here: the rule for this work is
that a remedy which moves an asserted number is reverted.

## Product-side levers seen, not touched

- `setActiveWorldContent` bumps a global content generation on every call, even when it
  switches back to a world already active, so the terrain region, road and world-bounds caches
  keyed on it rebuild after any switch. Keying them by world identity would make a switch back
  free; only tests alternate worlds today, so this is low value outside them.
- A probe harness checkpoint (record a run's result at 15 s or 120 s without stopping it)
  would make item 3 and item 4 above free inside one file.

## Owed

- The ruling above, and the owner's call on nightly item 1.
- The Nythraxis case's declared allowance was sized for two child runs; the coordinator's
  `35e89ced9a` re-sized it for one (420 s case, 300 s child, ledger rows exact).
- The shard weights for these files re-measure at the next harvest from a green full-mode run
  (the lane files are not weight-gated, so nothing carries a local row meanwhile).

## Review round

Three findings on the cuts above, all applied (branch `test-cost/lane-fix`, from `35e89ced9a`).

1. Should-fix, `nythraxis_matrix`: the one-child merge left shard 0's sample (seed 1 across
   the four plans) unpinned, and the first commit's claim that one child "pins the selection
   that two children pinned" overstated it. The sharding rule moved into
   `scripts/lib/nythraxis_matrix_core.mjs` (`seedSampleInShard`, `plansForShard`, the script
   now calls both) and `tests/nythraxis_matrix_core.test.ts` pins it for every shard index in
   both modes without a fight; a comment-stripped source pin in the matrix suite holds the
   script to the rule. The case comment now says the cast assertions read seed 2's fights.
2. Nit, `druid_balance_probe`: the diet comment said the sibling suites hold the dropped
   profiles' pin "per run"; they run the PBE talent rows, so a zero under the matrix's other
   capstone rows alone is nightly-only. The comment (and the row above) now says so.
3. Nit, `owned_class_balance_dps_probes`: the determinism reuse is recorded as the narrowing
   it is (row above and the file's comment).

Mutants (`scripts/lib/nythraxis_matrix_core.mjs` unless named), 6 run: shard 0 dropping its
sample and shard 0 taking the wrong sample are both killed by the core suite; the same
shard-0 drop PASSES the one-child matrix case (the gap the finding named, now closed by the
core suite); an inline shard-0 bypass in `scripts/nythraxis_matrix.ts` is killed by the source
pin; swapped standard-mode plan shards are killed by the core suite; the control (a comment
appended to the core) passed. All four changed test files ran green twice, `tsc` clean.
