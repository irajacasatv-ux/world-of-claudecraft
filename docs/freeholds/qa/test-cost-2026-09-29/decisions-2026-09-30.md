# Part 5 follow-up: the owed decisions, delegated

Fernando, 2026-09-30, on the items Part 5 left for him (verbatim): "For the decisions needed: do
whats best for the project and feature." This record states each decision, the evidence behind
it, and what came of it.

## The ratchet's noise (the lane band, and the shard band with it)

The lane band raise (366,000 to 461,000, `bf4ce76659`) asked him to confirm it or to harvest lane
rows as a median of several runs. Five green full-mode runs of nearly one tree settle both:

| Run | Lane pool (ms) | Shard pool (ms) |
|---|---|---|
| 36610517548 | 332,450 | 7,038,584 |
| 36635499592 | 307,115 | 5,912,504 |
| 36648684156 | 418,492 | 4,937,172 |
| 36654475632 | 368,662 | 4,562,805 |
| 36658730347 | 419,586 | 5,221,653 |

- A per-file median across runs does not steady the lane: over every three of the five, the
  median pools still spread 1.33 times, because runner speed moves every file of a job together
  and a median of per-file values only picks a run.
- The shard pool is noisy too: the last two runs are one tree (the second changed only
  documents), and their shard pools differ by 14.4 percent. The shard band's 10 percent headroom
  rested on an early pair of runs 2.6 percent apart, so a future harvest would false-alarm.

Decision: normalize every harvest for runner speed with a fixed calibration measured in each CI
job, so the pools stop moving with the runner while a real slowdown in the code still shows (a
rescale against the previous table would hide a uniform slowdown, the thing the ratchet exists to
catch). Adopt it only if calibrated runs of one tree agree; otherwise widen both bands to the
measured noise. OUTCOME: ADOPTED (`ce172c7a27` and `a3a2ea964a` build it; `b56af6ee9a` to
`ca9447d69a` anchor it).

- Each CI test job now times a fixed, seeded CPU workload before its tests (about one second) and
  prints it; the harvest scales each job's rows by the reference over that job's measurement.
- The first two calibrated runs showed the CPU loop explains the hardware share of the noise but
  not all of it (on one run of near-identical CPUs, jobs still varied 1.05 to 1.21), so three more
  runs were taken before deciding. Over the five (36724442671, 36726951063, 36730711359,
  36735089417, 36737663127; 50 job calibrations from 100.8 to 202.4 ms, median 177.75): the shard
  pool's spread fell from 1.249 raw to 1.069 calibrated, and the lane's from 1.384 to 1.064.
- The reference is anchored at 178 ms, so a calibrated row is CI time on a median runner and the
  lane rule's 90 s and the carried-row ratio keep their meaning. The table is harvested
  calibrated from run 36735089417 (all ten jobs calibrated, four CPU models).
- The lane's own wide band (`LANE_RATCHET_HEADROOM` 0.5, `LANE_RATCHET_SLACK` 0.8, and the raise
  to 461,000 it carried) is gone: calibrated, the lane is as steady as the shard pool, so both
  share `RATCHET_HEADROOM` 0.1 and `RATCHET_SLACK` 0.2 again. Ceilings: shard 5,886,000 and lane
  464,000 in calibrated time (the shard figure reads as a raise from 5,431,000 but is a change of
  unit; the run that set the old one printed no calibration). Once anchored, a raw or partial
  table is refused, since a raw harvest of the same run would pass the new ceilings.
- Recorded: the harvest drew the heaviest lane of the five, so a light lane on a later harvest
  clears the stale point by only about 2.5 percent; if an unchanged lane reads stale, re-derive
  the band from more runs.

## Shard balance

The fresh table still packed run 36654475632's shards 6.75 to 11.30 minutes: the weights are
per-file test time, while import is about 58 worker-minutes against about 98 of test bodies, a
cost the packing cannot see. Decision: add a per-file import overhead, fitted from the shard logs,
to the packing cost (the table and the ratchet stay test time). OUTCOME: DONE, AND IT GAINS
NOTHING TODAY (`651e140494`). Vitest's per-job
split gives the overhead directly (transform, setup, import and environment over the job's
files, speed-corrected): 803 ms pooled over 24 shard jobs, 697 to 939 per job, so the packer now
costs each file at its weight plus 800 ms. But the balanced sequencer already gives every shard
630 or 631 files, so for any overhead from 0 to 2,000 ms the packs are byte-identical; it stays
because it makes the packer's cost model match a file's real cost at no price. The spread's real
cause is runner speed: the 24 jobs ran at speed factors 0.67 to 1.19, which no packing can see in
advance.

## The collider grid lever

Decision: measure before building. A read-only investigation profiled it (seed 42 and 41 sampled
suites). OUTCOME: NO-GO.

- The grid itself costs about 130 ms warm; about 85 percent of a cold build (750 to 1,050 ms) is
  terrain calm-skirt sizing the grid's sampling forces (1,474 anchors, 81,432 full terrain
  evaluations), plus zone spot generators and decor props.
- Building cells lazily caps near 37 percent: the streetlamp plan spaces every lamp against every
  other across all roads, so the first query still plans the whole world; and a cell's collider
  order changes collision results, so a lazy build must reproduce the eager order exactly. It
  would also move boot cost into live server ticks.
- Keying the grid by the Sim's `world:` is incorrect (an empty test world keeps the built-in
  props, roads and zones, and NPC spots remove lamp and furniture colliders) and saves nothing; a
  precomputed or disk-cached grid would need a freshness test that re-runs the build and would
  give tests a load path the three hosts do not have.
- At stake: about 1,050 CI files pay the build, 18 to 24 worker-minutes of about 89 per full run;
  the lazy lever would save 6 to 9, about 15 to 35 s of shard wall. Not worth the ordering risk
  in two files on the monolith ratchet.
- Recorded, not done: a bit-identical reuse of repeated calm probes (11 percent of probes, about
  80 ms per build); evaluating both calm endpoints in one terrain pass (unmeasured, touches the
  terrain every host reads); `isolate: false` for a pool of pure-sim suites (module globals could
  leak between files).

A real defect the investigation found instead: the RL env's Python wrapper draws a random episode
seed on every `reset()` by default, and the per-seed caches in `src/sim` (the collider grids, the
calm tables) are never released, so a training run's memory grows with every episode. Decision: fix
it precisely, with one host-agnostic call that releases a seed's caches, made by the env server when
it discards an episode's Sim (no eviction the server or tests would ever hit). OUTCOME: DONE
(`e2620ed331`, `6001433849` and five follow-ups). `src/sim/seed_caches.ts` owns the four caches that
can hold more than one seed (the collider grids and pending gate states, the calm tables, the
steepness cache) and exports `releaseSeedCaches(seed)`; the `Env` class moved verbatim into
`headless/env.ts` (the server module reads stdin on import, so tests could not load it), which
releases the outgoing seed after a reset onto a different one and the live seed on close. Measured
over 50 resets onto distinct seeds: the heap after GC went 39.2 to 186.7 MB before (about 3 MB per
seed), and stays 39.3 to 42.2 MB after. A rebuilt seed is bit-identical (collider count, order and
cells; resolvePosition, line of sight, support height, terrain, calm and steepness probes); eleven
mutants killed; the architecture and cross-platform reads clean on their fourth round. Recorded: the
release assumes one env per process (an in-process vector env sharing a seed would need reference
counting), and the Monte Carlo balance scripts build Sims across many seeds without releasing.

## The product questions the tests surfaced

- Swiftmend (Fleetmend in game) with no heal-over-time to consume: fixed toward classic, refusing
  the cast before any cost, cooldown or global cooldown. OUTCOME: DONE (`5b3d4aaaa6`, the stealth
  module `1832b1692f`, the comments `f4e0531d11`). The match moved into
  `src/sim/combat/consume_aura_match.ts`, shared by the pre-check and the effect so they cannot
  disagree; the check draws no rng. Five mutants killed; two fresh architecture reads, the second
  clean. What changes for a player: a refused press no longer pays, keeps a druid's form, rolls no
  set proc, and grants no Vanguard 4pc speed buff. The action bar still shows it usable without a
  heal-over-time, as classic does.
- The dead `src/sim/combat/stealth_focus.ts`: deleted. It was superseded, not lost: the
  release/v0.40.0 merge (`60ab0b6037`) replaced its hate-table wipe on stealth with
  `dropTargetsOnStealth` (`src/sim/combat/stealth.ts`), whose comment gives the design (mobs keep
  classic proximity detection; wiping the hate table is Vanish's alone). The two comments that
  contradicted their code (the self-centred AoE channel branch naming Bladestorm; `/dev
  attune`'s header) are corrected. OUTCOME: DONE.
- A save keeps only the feet's (x, z), so a roof save reloads beside the building: KEPT AS IS. The
  load re-grounds a save and moves one trapped in a prop to clear ground because saved positions go
  stale as towns grow across releases; a stored height would add a new stale-geometry failure (a
  roof moved or removed in a release strands the player in the air) for a rare, harmless case.
  The behavior is now pinned (`d59af7e63a`) and the escape suite pins the relocation.
- Dash characters in player-facing sim readouts (the overpower readout among them): NOT HERE. They
  are pre-existing copy debt across 39 `src/sim/` files whose English is re-localized by the
  client matcher (`src/ui/sim_i18n.ts`); a partial fix would leave the rule half-applied, so it
  belongs to its own copy pass with the i18n model's obligations.

## The balance items

- Groveheart read identically under its three capstones at seed 4242. OUTCOME: A TEST GAP, NOT A
  PRODUCT BUG, NOW PINNED (`1ad8e1d6f5`, `3ea05ffef0`). All three are implemented and wired in
  `src/sim/combat/druid_engines.ts`; the probe never reached them. With three allies the pressure
  kills the party by about 40 s, Verdance peaks at 3 of 5, so Overbloom never fires (Nature's
  Echo and Wild Apex act only through it), and mana never runs short for Quickening's refund to
  matter; with one ally Overbloom fires, but on a full-health ally, so every harvest overheals. A
  read-only recorder (`scripts/groveheart_engine_trace.ts`) now traces the engine at each cast,
  and a case pins each capstone by its tooltip mechanic (Quickening's per-stage mana, Wild Apex's
  1.25 on the Overbloom heal, Nature's Echo's seeded Verdance); seven capstone mutants are killed
  only by it, and Quickening, which had no unit pin anywhere, gained two (five more mutants).
- The Groveheart group floor lets a Groveheart-only 42 percent cut through. DECISION: KEPT. The
  three-ally figure mostly measures how much healing lands before the party dies (about two
  thirds of the window is dead time, the rotation still casting at dead allies), and the design
  doc names three-ally throughput an open tuning question; tightening a floor there would guard a
  harness artifact, not the class. For the class owner: the probe's three-ally profile (a fight
  that ends at the wipe, or pressure that does not wipe) is the change that would make a group
  floor meaningful.
- The demonology five-minute end-pool rule (0.12) was copied from affliction. OUTCOME: MEASURED
  AND KEPT AS A DESIGN CONSTANT (`0ed278dddd`). Demonology ends at 0.0059 at both depths; the
  rotation holds mana at its 30 percent tap floor until health runs out for the tap at about 260
  s, and what is left after that varies from 0.0096 to 0.0186 across five seeds with no balance
  change, so a band from the measurement (0.0072 at affliction's margin) would red on any
  re-roll. The rule reads as the file's header states it: the pool is spent by five minutes, not
  held at the tap floor; a free rank-3 tap is killed at exactly this line. Its sensitivity, for
  the class owner: about 12 percent more health to tap (stamina gear, a cheaper tap) would trip
  it.

## Found on the way: the browser job's font fallback could not run

The third calibration run (36737663127) failed its browser job in setup, not in a test: a
stalled mirror timed out `playwright install-deps`, whose sudo package install outlived the
timeout (it stops only `npx`) and held the dpkg lock, so the font fallback's own install failed
at once and the capability check went red. Fixed in both browser jobs (`4223eb0b5f`, then
`fdcfb70aa9`): a failed install-deps has its leftover install stopped (logged) whatever the font
check finds, a bounded `dpkg --configure -a` finishes an interrupted one, and the fallback waits
for the lock inside its existing bounds, so the job's worst case stays under its 10-minute bound
and the capability check that keeps a font-less suite red is unchanged. A fresh gate read passed
it; its notes are applied, each guarded line killed as a mutant.

## Kept as they are

- The two lane jobs stay separate: they run beside the shards and finish in about four minutes
  against the shards' thirteen, so merging saves runner minutes but no wall time, and it would
  change required check names the merge queue's ruleset holds outside git.
- The release-gate bound stays at 36 until the first `release/**` push measures it (its shards
  carry the lane files, which no run on this branch exercises).
