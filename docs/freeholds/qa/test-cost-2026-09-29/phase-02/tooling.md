# Test cost, tooling cluster

Branch `test-cost/tooling`, based on `a2bd94a83e`. Local figures are the medians of three
`npx vitest run <file> --maxWorkers=1` runs, before and after back to back, from the
`Duration` line (`tests`, and `collect` where the work moved out of collection). CI figures
are the two PR runs of the baseline (`data/ci_perfile_ms.tsv`, run 36493201427 / 36501749917),
in ms. Every mutant ran through the scratchpad runner (HEAD-equality check before each mutant,
verified restore, a Tests line required) with one must-pass control per batch; every kill
below is from the changed file itself.

| File | CI ms (PR runs) | Verdict | Change | Local s before, after | Mutants killed | Owed |
|---|---|---|---|---|---|---|
| `skill_icons` | 28167 / 34737 | SLIM | The history probe's `git cat-file` and `git show` run with `GIT_NO_LAZY_FETCH=1`. In the PR shards' blobless depth-1 clone they lazily fetched the source commit and then each of 36 former blobs, one network round trip each (nightly, a plain shallow clone: 1957 ms). Simulated with a local blobless clone: lazy 36 fetches 7.7 s over `file://`, with the flag the arm skips in 24 ms; a full local clone still verifies all 36. | tests 4.24, 3.51 (local unchanged; the cut is CI-only, about 30 s a PR) | 1/1: manifest pin and history digest moved together, only the blob arm sees it | Re-measure the weight row |
| `underwater_compile_gate` | 32924 / 20208 | SLIM | The `src/sim/world` mock memoizes `terrainHeight(x, z, seed)`: every medium-tier case rebuilt the shader water, whose shore apron samples the real terrain across the map (about 0.6 s a build, 11 of the file's 13 s in a profile). Geometry is unchanged, modules still fresh per load. | tests 11.02, 2.14 | 4/4 in `src/render/underwater.ts` (underside not linked, stale epoch settles, underside never held) and `src/render/water.ts` (underside FrontSide) | |
| `sfx_export_core` | 25662 / 27267 | KEEP | One full ffprobe/ffmpeg conformance pass over the 706 published tracks (the module caches by blob, so the three builds pay it once). `sfx:check` does not run in PR CI, so this is the PR tier's only conformance sweep of the published set. | 75.9 in the loaded baseline run (local ffprobe runs under Rosetta) | none (no change) | Lever below |
| `i18n_resolved_equivalence` | 23677 / 23998 | SLIM | Six generator runs (two in place over the committed tree, two per determinism call) became one perturbed pair into temp dirs, each compared with the committed bytes and file set (freshness, determinism and the union's override emit at once), plus a `git diff` pinning the working copy to the index. It no longer rewrites the working tree. | tests 12.07, 4.61 | 4/4 in `scripts/i18n_build.mjs` and the catalog: TZ-dependent emit, dropped module, union written outside the override dir, stale committed slices | |
| `localization_coverage` | 21905 / 21763 | SLIM | The per-locale key match ran about five `expect()` calls per key over the whole English table (21 locales, a quarter second each). It now collects missing, mistyped, empty and placeholder-marked keys and asserts the list once, naming every offender. | tests 8.26, 2.89 | 5/5 in the `de_DE` resolved slice: blank value, TODO marker, missing key, number leaf, branch flattened to a string | |
| `i18n_status_registry` | 20980 / 16273 | SLIM | The sim-scope arm called `simDictProvidedKeys(lang)`, which builds a new Set per call, once per key and locale; it now reads it once per locale. The two-scan determinism case stays (the only guard of the gitignored status file). | tests 7.64, 5.82 | 1/1 in `src/ui/sim_i18n.ts` (provided keys drop the base table) | Collect 3 s is the registry JSON load |
| `malware_scan` | 18027 / 18184 | DELETE (one case) | Dropped `the real working tree has zero HIGH-severity findings`: `scanTree` over every tracked file plus the HIGH filter, exactly what `npm run security:gate` runs as its own step in pr-checks, release-checks, the nightly and both local gates. Proof: a planted `curl ... \| sudo bash` line in `src/game/app_viewport.ts` makes that step exit 1 (clean tree exit 0), before and after the deletion. `docs/security/malware-scan-catalog.md` updated. | tests 10.59, 0.29 | DELETE proof as stated; 90 rule pins unchanged; `gate_select_plan` still lists the file always-run | Stale sentences outside my scope: `.github/workflows/ci.yml` (the "asserts the same inside npm test" comment above the malicious-code gate step), `.claude/skills/release-malware-audit/SKILL.md` (step 1), `tests/CLAUDE.md` ("zero high-severity findings allowed in the tree") |
| `placement_integrity` | 17018 / 16943 | SLIM | Pad sizing memoized per row (three arms re-sized every pad) and the water surface cached per lattice point in both walks, like the heights already were. | tests 5.80, 4.82 | 2/2: every skirt dropped (`src/sim/terrain_calm_anchors.ts`), climb gate collapsed (`src/sim/pathfind.ts`) | |
| `server/storage_purchases` | 16360 / 15620 | SLIM | Four cases waited out the recovery coordinator's real retry backoff (1 to 6 s each, 13 of 15 s). They fake `setTimeout` only (Date, performance and setImmediate stay real) and the poll advances the fake clock between real turns; `afterEach` resets on the arming clock, then restores. | tests 15.14, 1.35 | 3/3: null reason settled as refusal, retry timer never drives (`server/storage_recovery_coordinator.ts`), offline keeps the yield latch | |
| `item_art_audit_builder` | 17221 / 13473 | KEEP | The CLI case runs `--verify-only` on the live catalog (7.1 s standalone: an esbuild sim bundle plus a sharp decode of every art file) and pins its fingerprint; nothing else runs that CLI. | 12.9 baseline | none | Lever below |
| `interior_encounter_prewarm_pass` | 14671 / 14658 | SLIM | The test's three macrotask shims (idle callback, GPU-work yield, drain) hop on `setImmediate` instead of `setTimeout(0)`. The pass reads no clock, so the drain budgets a hop count (still 200); each hop had cost Node's 1 ms timer floor, about half a second per case. | tests 18.22, 0.64 | 4/4 in `src/render/interior_encounter_prewarm_pass.ts`: no set claim, no body claim, no release on failure, unchained bodies | |
| `server/new_endpoint` | 13947 / 13918 | KEEP | The golden end to end (generator, `tsc` over six emitted files, a child vitest over four) is the scaffold's only real proof. | 11.9 baseline | none | |
| `physics_audit_world` | 9360 / 18067 | SLIM | `makeSim` uses production idle culling (`idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS`). Measured incidental: every case's per-tick player position, grounding, vertical speed and climb state are byte-identical with and without it (1,874 ticks), and so is the crypt census (13 mobs). | tests 5.89, 2.99 | 2/2 (`JUMP_VELOCITY` 16 and 0.5 in `src/sim/player_motion.ts`) | |
| `ci_shard_plan` | 12517 / 14767 | SLIM | One memoized walk and read of the real test corpus serves the four cases that each re-walked it (guard and lane resolution, both env-flag registries). Adds this cluster's nightly reader to the `WOC_NIGHTLY_SWEEP` list. The fifteen spawned entry runs are the file's real cost and stay. | tests 25.50, 23.79 | 3/3: a new nightly reader, a new diet reader, a lane file the tree lacks | Merge: see below |
| `movement_latency_baseline` | 13169 / 14000 | KEEP | Every cell is pinned in the committed baseline table; the cost is shared harness Sim builds (`findSafePos`) and the twin trajectory. | 7.8 baseline | none | Lever below |
| `i18n_emit_shape` | 13583 / 11496 | SLIM | Each leg ran its generator four times; the orphan and a diverged live slice are now planted together, and one regen shows the sweep, the rewrite arm, the skip arm (every other slice's mtime) and byte identity. | tests 8.38, 3.73 | 5/5 in `scripts/lib/write_module_dir.mjs` and `scripts/i18n_build.mjs`: no skip arm, skip any existing, no orphan sweep, nondeterministic game emit, rm-and-recreate | |
| `finite_pose_guard` | 11897 / 12446 | SLIM | `rig` uses production idle culling; measured incidental: per-tick pose, velocity, health and fall start byte-identical (756 ticks). | tests 3.89, 2.25 | 2/2 in `src/sim/finite_pose_guard.ts` | |
| `language_fanout_registry` | 13238 / 10733 | SLIM | `vi.mock('../src/ui/i18n')` with the three exports the deed and reliquary channels call: the registry-by-identity case otherwise imported every resolved locale slice (nightly 2334 ms against 10.7 to 13.2 s on PR shards, the cold transform). | tests 1.55, 0.62 (warm cache; the cut is the CI transform) | 2/2 in `src/ui/locale_channels.ts` (channel dropped, channel doubled) | |
| `server/pbe_boost` | 10690 / 13136 | KEEP | The retry-budget case (2.1 s) rebuilds a boosted state per name attempt inside product code. | 7.1 baseline | none | Lever below |
| `sfx_studio_server_security` | 12096 / 11362 | KEEP | One `/api/catalog` call is 5.3 s (profiled): the analysis cache is pre-seeded, the time is the studio's own track discovery. | 20.3 baseline (loaded) | none | Lever below |
| `deed_icon_converter` | 12477 / 10539 | KEEP | Three over-cap encode fixtures (1.2 to 1.7 s) are the retry and hard-fail paths' only drivers. | 13.0 baseline | none | |
| `snapshots_self_wire` | 11419 / 11469 | SLIM | Standalone Sims share seed 7 (27, 28 and 1 bought nothing: the cases set what they send by hand), saving three collider-grid builds. A mutant showed the climb case could not see the `cl` rounding (every sample was whole or capped); a fractional sample now pins it. | tests 3.83, 1.87 | 2/2 in `server/game.ts` (Ascension charges capped, `cl` unrounded; the second survived before the added sample) | |
| `mob_portrait_source_manifest` | 11001 / 11364 | KEEP | Its spawned `--check` / `--write` runs are the CLI's exit-code contract. | 8.2 baseline | none | |
| `bandwidth` | 10881 / 11422 | KEEP | Measured: 100 measured ticks instead of 200 moves the asserted reduction from 72 to 68 percent for 0.9 s; not worth moving a measured number. | 5.2 baseline | none | |
| `icon_asset_audit` | 12019 / 9730 | KEEP | The complete accepted-art audit (3.6 s of sharp work) is the only full pass. | 5.7 baseline | none | |
| `fire_short_fight_tuning` | 409 / 568 (42.4 s local collect, invisible) | MOVE TO NIGHTLY (sweep) + into hooks | All measurement moved from describe bodies into `beforeAll`. The 40-seed sustained pool runs only under `WOC_NIGHTLY_SWEEP === '1'` (added to the `ci_shard_plan` list); PR takes the pool's first five seeds for both ceilings, the Ignite share and Ignite conservation (five-seed ratios 1.08 at 60 s, 1.00 at 120 s against 1.25), and the 0.95 floor runs nightly only (a five-seed mean swings about 0.07). Nightly-mode output is identical to the baseline to the printed digit. | collect 44.33 + tests 0.24, collect 1.80 + tests 8.74 | 2/2, representative only (`-t "sustained parity"`): Ignite over-banking (`ignitionPct` 0.9) and a crit explosion (+60 percent) in `src/sim/content/talents_classic.ts` | |
| `chronomancy_heal_parity` | 8 / 6 (13.5 s local collect) | KEEP, into a hook | The 2,400-tick run moved into `beforeAll` so the weights see it. Idle culling was tried and reverted: it forks the rng stream the crit rolls read (Mend 171.5 to 174.5 HPS). | collect 14.85 + 0, collect 1.72 + tests 13.58 | 1/1 (Temporal Mend rank 4 overtuned, `src/sim/content/classes.ts`) | |
| `gather_node_placement` | 12333 / 7489 (11.6 s local collect) | SLIM + into hooks | The flood reads each point's passability, ride height, swim depth and gradient through a per-point memo (they were re-read from every neighbour), and the zone floods, the maze-wall flood and the sea sweep run in `beforeAll`. | collect 11.62 + tests 4.60, collect 1.13 + tests 12.82 | 2/2: a node moved into the maze-wall pocket (`src/sim/content/gather_nodes.ts`), the climb gate collapsed | |
| `duplicate_test_blocks` | 17 / 22 (5.9 s local collect) | KEEP, into a hook | The one corpus parse moved into `beforeAll` (own 60 s allowance). The parser helper is shared with its own suite, so it was not touched. | collect 5.36 + 0.01, collect 0.11 + tests 5.16 | 1/1 (a planted duplicate block) | |

**Total local time saved:** about 117 s of test and collection time across the cluster
(fire 34, prewarm pass 17.6, storage purchases 13.8, malware 10.3, underwater 8.9,
resolved equivalence 7.5, localization 5.4, emit shape 4.7, the rest under 3 s each), plus
about 30 s per PR run of `skill_icons` lazy fetching that only the CI checkout pays. About
38 s of formerly invisible collection work (fire, chronomancy, gather, duplicate blocks) now
shows in measured test time, so the shard weights can balance it.

## Owed

- **Weights:** every changed file needs its row re-measured
  (`node scripts/ci_shard_weights_harvest.mjs --carry-local --supersede`), not touched here.
  The collection-to-hook moves raise four rows from near zero.
- **Merge with `feature/freeholds`:** `tests/ci_shard_plan.test.ts` conflicts with the other
  clusters' `WOC_NIGHTLY_SWEEP` list. Resolution: keep this branch's `corpusSource(f)` filter
  line and take the union of the lists, sorted (`fire_short_fight_tuning` sits between
  `emerald_deck_escape` and `lake_shores`). Upstream now also has
  `tests/helpers/production_idle_cull.ts`; the two culling changes here spell the same config
  inline and can switch to it after the merge.
- **Stale malware sentences** outside this change's scope, listed in the table row.

## Product-side levers seen, not touched

- `terrainHeight` is uncached and is the hot frame in four of these files: player motion
  samples it every tick for a standing player (26 of the fire harness's 44 s), the shader
  water apron samples it across the map on every build, `findSafePos` in Sim construction,
  and the content floods. A per-seed height cache, or skipping the vertical pass for a
  grounded player that did not move, would speed dozens of suites and the server tick.
- `scripts/sfx_studio/audio_io.mjs` `publicPath` re-runs `discoverSfxTracks` (a readdir of
  all 706 tracks) twice per catalog key, O(keys x files): 5.3 s of one studio request.
- `sfx:check` is not in PR CI, which is why `sfx_export_core` has to ffprobe every published
  track on every PR. With `sfx:check` in pr-checks (it is turbo-cached), the export suite
  could validate a representative subset.
- `server/pbe_boost.ts` builds a whole boosted character state (a world build) per name
  attempt; one build per class, re-stamped with each name, would do.
- `simDictProvidedKeys` builds a new Set per call (the scanner is its only caller).
