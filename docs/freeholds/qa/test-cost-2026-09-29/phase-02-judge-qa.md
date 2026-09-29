# Part 5, phase 2 (judge the heavy and suspect tests): QA

Verdict: PASS. Every file outside the lane that weighed 10 s or more in CI (173 files), the 17
lane files and the four suites whose cost sat at collect time were judged, cut where a cheaper
form keeps the guard, and reviewed until a fresh read came back without a should-fix. The
per-file record of each of the nine clusters is under `phase-02/`; this page is the QA of the
whole.

## What landed

Nine cluster agents, each in its own worktree off `a2bd94a83e`, judged one cluster heaviest
first under one playbook (verdicts KEEP, SLIM, MERGE, MOVE TO NIGHTLY, DELETE; never the only
guard of a behavior; no expected value changed to make a slim pass; a mutant per changed
guard, run through a restore-verifying runner with a must-pass control). Their commits were
cherry-picked onto the branch unchanged.

Verdict rows per record (a row can carry two verdicts; the tables are the source):

| Record | KEEP | SLIM | MERGE | MOVE TO NIGHTLY | DELETE | Local test s, the cluster's changed files |
|---|---|---|---|---|---|---|
| classes-a | 0 | 19 | 0 | 1 | 0 | 376.8 to 60.0 (a quiet baseline of the same files: 258.4) |
| classes-b | 1 | 20 | 1 | 0 | 0 | 131.9 to 31.7 |
| encounter | 3 | 23 | 0 | 0 | 0 | 267.9 to 44.1 |
| world | 4 | 21 | 0 | 2 | 0 | 391.1 to 90.0 |
| economy-a | 2 | 18 | 0 | 1 | 0 | 161.6 to 63.7 |
| economy-b | 1 | 18 | 1 | 1 | 0 | 176.7 to 71.5 |
| parity | 0 | 1 | 11 | 0 | 0 | 200.9 to 115.5 (the determinism pair kept) |
| lane | 6 | 5 | 3 | 0 | 0 | 604.2 to 391.9 (eight files) |
| tooling | 12 | 15 | 0 | 1 | 1 | about 117 s saved locally, plus about 30 s per PR in CI (`skill_icons`) |

The shared infrastructure the verdicts needed: the nightly-only depth flag
(`WOC_NIGHTLY_SWEEP`, docs/qa-gate.md "Nightly-only sweep depth"), now read by eight suites;
`tests/helpers/production_idle_cull.ts`, the shipped idle-mob cull pinned to both hosts; and
`tests/helpers/depth_flag_readers.ts`, the audit behind both depth-flag registries.

## Measured

Full armed local runs, 8 workers, lane files in (per file: `data/local_perfile_after_phase2.tsv`):

| Run | Wall | Test bodies | Import | Tests passed |
|---|---|---|---|---|
| Baseline, `faa7a48eba` (README) | 949.19 s | 4,985.75 s | 2,143.79 s | 73,987 |
| After the clusters, `35e89ced9a` | 777.06 s | 3,653.82 s | 2,098.23 s | 73,972 |

Test bodies fell 26.7 percent; import did not move (the import cuts are phase 3). Fifteen fewer
cases: the duplicate-schedule merge in `tests/dot_final_tick.test.ts` (38 to 23) and the
whole-tree malware case. A run at the fix-round tip `03edaf5a3b` (812.85 s, under reviewer
load) was green but for `tests/depth_flag_readers.test.ts`, rewritten while that run was in
flight; the committed file passes 17 of 17 on its own. CI time is re-measured by the harvest in
phase 5.

## Reviews and fix rounds

- Seven fresh reviewers over `a059c8b457..35e89ced9a` (five test-coverage auditors by cluster,
  gate integrity, the QA checklist): 0 blocking. The findings, all applied: forced rolls for
  the cases that rode one seed's luck (a hit, a crit, a proc), comments that claimed what the
  code did not (culling keeping hunted draws, a per-world-object collider cache), a shallow
  freeze of the parity recording shared by coverage cases, a lost Nythraxis shard-0 pin, a
  second escort round that could be skipped silently, the conservation sweep's order
  dependence (a guild-book flush of the previous world committing into the next world's
  store, now drained, so each seed replays alone), a fire sustained floor with no PR
  representative, the skill icon history arm running in no CI job, an unpinned malware gate
  exit path, nightly-reader escapes, a parity shard-index gap, stale records.
- The cluster fix rounds, each with its own mutants, then two fresh reads of the whole fix round
  (gate integrity: 4 warnings, 3 info; test coverage: 1 should-fix, 8 nits), all applied
  (`48dd3cb64c` to `3660e0ae30`). The fresh reads that followed each found the next hole in
  the depth-flag audit or its scanner, so the audit was rebuilt to close classes, not
  spellings: every tracked source naming a flag is audited (git grep), no file but a listed
  reader may spell one outside a comment, a read must be a whole `const` binding, the pins
  build the names from one shared module, and the scanner reads a slash after a reserved
  keyword as a regex (from the masked text, never behind a property dot, always behind a
  spread or a number literal's dot). Five more fresh reads, each answered in full, the
  findings shrinking round by round until the last came back with nits only
  (`a4963554dc` to the number-literal fix).
- The QA checklist's memory item: the parity gate now holds a recording until its coverage
  readers finish; measured with the per-file memory probe, `parity_g` peaks at 197 MiB against
  its 240 MiB budget and the file holding the rift quartet at 238 MiB (ceiling 1024).

## Mutants

Every cluster record carries its mutant table (source mutated, killed or survived, the control).
Survivors are recorded with the reason; every survivor judged a coverage gap also survives the
unchanged file, so no slim lost it. Mine in this phase, all through the runner (each file
verified equal to HEAD before each mutant, restored and re-verified): 62 runs, 14 must-pass
controls passed and 48 fail-expected mutants. 47 were killed on the first run; one (the
scanner reading its keyword from unmasked text) survived because its fixture's comment ended
on a word that had left the keyword list, and was killed after the fixture was corrected.

## Owed

- The CI weights of every changed file (phase 5 re-harvests).
- For Fernando: production idle culling in the balance harnesses would cut the lane about six
  times but re-derives every band (the lane record); the Scouring Mercy heal case's sanity
  bounds encode a 2x crit where the heal crit is 1.5x (its decisive assertion, the flatness
  across Spell Power, is sound); the three `paladin_devotion_balance` rotation pins ride the
  full world's rng (about 15 s locally if re-pinned).
- For the class owner: the druid matrix's `moongrove_3t` and `groveheart` nightly cells assert
  only "above zero" (about 1,500 s of the nightly).
- Watch the first nightly: the skill icon history clone (`git clone --revision`, git 2.49 or
  newer) has only run in a local simulation; it fails closed.
- For the release owner: the corpse harvest sweep's empty-world cut should travel with this
  branch (release/v0.45.0 still runs it on the full world at a 60 s allowance).
