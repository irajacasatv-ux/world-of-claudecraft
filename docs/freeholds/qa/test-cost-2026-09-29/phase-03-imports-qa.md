# Part 5, phase 3 (imports): QA

Verdict: PASS. The import cuts measure as intended on this host and in CI, every review finding
is applied, and the fix rounds were read fresh until one came back without a should-fix.

## What landed

- `cdff3140b2`, `755ef96f3e` (before the pause): `src/ui/i18n.ts` stops re-exporting the 21
  non-English locale slices and the generated barrel; the five suites and
  `scripts/i18n_resolved_hash.mjs` that read a locale by name import it directly.
- `65b0d17d2c` (before the pause): the daily world quest catalogs build on first use.
- The QA fix rounds, this session:
  - `ead0ae6c5a`: each match-three day and each bonus ley size builds alone on first read (the
    daily ley catalog stays whole: its route dedupe spans the days in order); a golden digest
    pins every board to the module-load build in either read order; a counting `Rng` proves
    the module seeds nothing at load; the accepted lazy-constant shape is written into
    `src/sim/CLAUDE.md`.
  - `7e41b5fb79`: the lazy-locale pin is measured at runtime (every non-eager generated module
    mocked with a recording pass-through), so a re-export, a top-level `import()`, a reach
    through another module and an odd path spelling all fail it, and the TypeScript import it
    needed is gone; two suites import single slices instead of the barrel; the hash script
    refuses a missing locale and counts what it hashed; stale re-export comments corrected.
  - `e1731f6453`: the fan-out registry's reason for mocking `src/ui/i18n` corrected.
  - `be919f9d2c`: a NaN bonus level fails fast with a `RangeError` (the lazy memo had turned it
    into 256 builder retries and a misleading throw); the `src/sim/CLAUDE.md` shape states its
    conditions; the tests pin the memo slots of unsafe days and that the reverse-order read
    used a fresh module.

## Evidence

- The resolved translation hash is identical before and after the cut: `locales=22
  bytes=32548094 sha256=4b32c5b4...ea6bbd` at `3117492ffa` and at the tip.
- The catalog digest `463fa65c...db28db` is the same on the module-load build (`755ef96f3e`,
  byte-equal to `3117492ffa` for the file) and on the lazy module read forward, in reverse and
  interleaved.
- CI, shard pool (the eight PR shards, full mode): import 4,073.8 and 4,207.0 s on the two
  baseline runs (mean 4,140.4) against 3,452.4 s on run 36583005398 at `07d6b4dad4`, the tip
  that carries both cuts: 16.6 percent less import. Test bodies moved from a mean of 8,613.5 s
  to 6,885.4 s over the same runs, which is phase 2's work, not this phase's.
- Local, this host (Linux, 20 cores, 8 workers, Postgres armed through a scratch Postgres 16,
  lane files in, the cost reporter as a second reporter; a slower host than the one that measured
  the README baseline, so its numbers compare only with each other), before and after the cuts,
  both in a clean worktree without the gitignored `src/ui/i18n.status.json` (so the two suites
  that need it fail in both runs alike):

  | Run | Wall | Import | Test bodies | Series |
  |---|---|---|---|---|
  | `3117492ffa`, before | 1,623.83 s | 3,439.84 s | 8,647.09 s | `data/local_linux_perfile_3117492ffa.tsv`, `data/local_linux_import_modules_3117492ffa.tsv` |
  | `7e41b5fb79`, after (the cuts and their first QA round) | 1,509.40 s | 2,650.80 s | 8,536.63 s | `data/local_linux_perfile_7e41b5fb79.tsv`, `data/local_linux_import_modules_7e41b5fb79.tsv` |

  Import fell 789.0 s (22.9 percent), wall 7.0 percent; test bodies are unchanged within noise.
  Every generated i18n module together: 773.7 s to 96.8 s (the barrel now loads in 17 files
  that import it on purpose, not 759; a slice such as `de_DE` in 18, not 759). The daily
  generation module: 92.2 s to 1.9 s over the same 1,737 files.

## Mutants

All through the restore-verifying runner, each file equal to HEAD before each mutant, a
must-pass control first:

| Pin | Mutants | Result |
|---|---|---|
| lazy catalogs (`tests/world_quest_daily_generation.test.ts`, `tests/world_quest_ley_bonus.test.ts`) | an eager ley build at load; a changed bonus seed lane; no match-three memo; an order-dependent build; no NaN guard; an unsafe day given its own slot; a first level-1 read building level 2; an Rng seeded before the NaN throw; the size table unfrozen; a daily solution unfrozen | 10 of 10 killed |
| lazy locale reach (`tests/i18n_lazy_loader.test.ts`) | barrel `export *`; a slice re-export; import then re-export; a top-level `void import(barrel)`; a slice import added to `src/ui/i18n_interpolation.ts`; a `../ui/...` spelling; a chained dynamic reach; a one-tick settle (three runs); a top-level case after the pin | 11 of 11 killed (the stubbed control re-ran the first six); a case nested inside the pin's own describe survives by design |
| harness cull (`tests/idle_mob_tick_radius.test.ts`) | a bare `new Sim(` in a harness; the caller's radius winning the spread; a wrong radius | 3 of 3 killed |

## The remaining import levers, decided on the numbers

- `en_XA` eager in dev: 37.5 s of local import over 759 files (49 ms each). Making it lazy
  needs an async load path for a dev-only pseudo-locale in `src/ui/i18n.ts`, whose `t()` and
  `setLanguage` are synchronous by contract. Not taken: about 1.5 percent of local import, for
  a behavior change in product i18n code.
- `wireEntity` inside `server/game.ts`: six suites import only it and pay the whole server
  graph (their collect sums to 10.5 s locally, about 7 s of it `server/game.ts`'s graph).
  Extracting it means moving `identityFields`, `dynamicFields`, `wireAura` and
  `threatEntries`, a few hundred lines of wire code, out of a monolith. Not taken: about 1
  percent of the shard pool's remaining gap, for a wire-protocol move that needs a parity
  review of its own. Recorded for the owner of `server/game.ts`'s extraction.
- The per-seed collider build in `src/sim/colliders.ts`: a fresh seed's full-world `Sim`
  constructor costs about 1.9 s on this host under load (70 ms warm). A CPU profile puts 90
  percent of it in terrain height evaluation: `staticWorldColliders` computes every collider's
  top through `terrainHeight`, and each height near a calm pad sizes the pad's skirt through
  forced-calm probes. The only change that is bit-identical by construction, a memo of the
  skirt search's repeated probes, would remove 14.6 percent of the probes (measured over 300
  pads: 18,400 calls, 15,720 unique; 259 of 300 pads settle in one round), about 5 to 8
  percent of a fresh constructor. The real lever, lazy collider tops or a cached height field,
  changes when and how terrain is evaluated in a hot product path and needs a maintainer ruling;
  not taken here, recorded for the report.
- What is left of local import after the cuts (2,486 s) is a broad tail over the sim module
  graph (content 519 s, combat 210 s, rift 126 s, professions 115 s, `data.ts` 109 s, `sim.ts`
  90 s), each module 5 to 50 ms per importing file: no single module is left to make lazy.

## Reviews

- architecture-reviewer on `65b0d17d2c`: 2 should-fix, 6 nits, all applied in `ead0ae6c5a`.
- test-coverage-auditor on `cdff3140b2`/`755ef96f3e`: 4 should-fix, 3 nits, all applied in
  `7e41b5fb79` and `e1731f6453`.
- Fresh reads of the fix rounds, each applied in full, until one came back without a
  should-fix:
  1. architecture (2 should-fix, 6 nits) and coverage (1 should-fix: the new control loaded all
     21 real slices, 2.5 s warm; 5 nits): applied in `be919f9d2c` and `85bc01dfba`.
  2. architecture (2 should-fix: the settle wait missed a chained dynamic import, the bonus
     size table was not frozen; 5 nits): applied in `74f7710a81`.
  3. coverage (1 should-fix on the new `src/sim/CLAUDE.md` wording; 4 nits, including a control
     that only sometimes killed a one-tick settle): applied in `2b1dea1301` (the settle revert
     is now killed 3 of 3).
  4. and 5. architecture and coverage on the wording of that rule (3 and 1 should-fix): a
     general rule kept admitting loopholes through the helpers a builder calls, so it became a
     documented single exception with its proofs named (`3cd7dc617f`, `4535524fc3`).
  6. architecture: PASS, nits only (the beam sides frozen, the proof a further memo owes
     named, two more freeze assertions), applied in `ec4eff90ca`.
- Not changed, recorded: the commits `be919f9d2c` and `85bc01dfba` each carried a comment edit
  outside their subject (the corpus floor's history, a planner comment); other lazy module
  memos under `src/sim` (practice dummies, druid engines, gathering supply, fen willows, the
  generated field's proxies) are not in `src/sim/CLAUDE.md`'s inventory, a gap older than this
  work.
