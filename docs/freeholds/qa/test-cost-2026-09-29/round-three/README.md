# Part 5, the third slimming round: record and QA

After the second round, run 36635499592 measured the summed PR shard test step at 87.78 min,
24.2 percent under the 115.73 min baseline, short of the ruled 25 percent (86.8 min). Vitest's own
split showed where the time sat: test bodies 98.6 worker-minutes, import 57.9. A scan of the
harvested table found 548 files at 2 to 5 s of CI test time that built a Sim on the full
overworld with no scoped world (29.3 CI minutes); after removing every file an earlier round had
judged or changed, and the files the weak-pin fixers held, 515 remained (27.3 CI minutes). This
round judged all of them, in five alphabetical parts of 103.

## Method

The shared brief: the same remedies as round two (`../round-two/README.md`), led by a scoped world
(`EMPTY_TEST_WORLD`, `RL_TEST_WORLD`, or `worldWithOnlyNpcs` from `tests/helpers/npc_world.ts`, the
built-in world holding only named NPCs), after checking the system under test does not switch
itself off on a custom world; KEEP where a case needs the full world. One source mutant per SLIM
file, killed by the slimmed file (this is what shows the scoped world did not switch the system
off). Timing in batches: every changed file of a part together at one worker with the json
reporter, three runs at the base and three at the tip, interleaved; per-file medians. The host
carried five parts at once (load 12 to 30), so compare a file's two numbers, not files with each
other.

## Totals

| Part | Files | SLIM | KEEP | Local s before, after (changed files) | Record |
|---|---|---|---|---|---|
| 1 | 103 | 97 | 6 | 390.93, 143.97 | `part1.md` |
| 2 | 103 | 92 | 11 | 249.38, 96.11 | `part2.md` |
| 3 | 103 | 99 | 4 | 267.93, 101.90 | `part3.md` |
| 4 | 103 | 96 | 7 | 263.39, 120.99 | `part4.md` |
| 5 | 103 | 89 | 14 | 219.98, 111.07 | `part5.md` |
| all | 515 | 473 | 42 | 1,391.61, 574.04 (59 percent less) | |

Every SLIM file killed its mutant. Where a first mutant hit a path the file never reaches, a
replacement on the live path was killed and the first recorded. Measured in CI (run 36648684156,
green, full mode, at `481a87079f`): the summed shard test step 78.03 min, 32.6 percent under the
baseline, and the slowest shard job 13.85 min, both on the pre-round weight table (shards spread
6.27 to 11.58 min); the harvest of that run rebalances them (`../phase-05-rebalance-qa.md`).

## What bounds this tier now

A Sim's collider grid is built from the active built-in world and the seed, whatever `world:` the
Sim is given, so an empty-world Sim still builds it (about 1.1 to 1.8 s locally) on the first tick
that moves a player, a line-of-sight check, or a safe-position query. Files that never touch
colliders fell to about 0.4 s; files that do floor at about 1.5 s. A further cut here has to come
from that grid build in `src/sim/` (the collider lever recorded for the owner), not from scoping
worlds more tightly.

## Integration

The five parts landed by cherry-pick, each part's changed files run at the tip before the next
(97, 188 across parts 2 and 4, 99 and 89 files, all green), with `tsc` and the cross-cutting guard
suites after the last. Parts 3 and 4 each added the same NPC-world helper under a different name;
they were merged into `worldWithOnlyNpcs` (`1de5a2b23a`). A part-2 helper's `git stash pop` took
part 1's stashed change (git's stash is shared across every worktree of one repository); part 1
re-applied, re-timed and re-mutated the affected file, and no worktree held another's change at
integration.

## Weak pins found, and fixed

The parts' mutants and reviews found cases that claimed a guard they did not hold (a source mutant
survived the unmodified file). A fixer made each catch its mutant, test changes only, every kill
re-run after a passing control (`0b2a975ffa` to `a369bcf50c`, 14 commits; 28 final runs, 0
unexpected):

- talent_save_migration_v026: the load arm's migration was never needed by any case; the load
  case now checks the loaded bar the migration alone repairs.
- social: the duo case matched the three-member bonus by coincidence (a duo reads 1.0); the duo
  and a new trio case pin the classic bonus as literals.
- heroic_loot_flair: the chosen boss's table is Normal-only, so the heroic swap never ran; the
  cases kill a drakonid with a forced low roll and pin the exact corpse on each difficulty.
- hoard_room: the two-yard step was checked only for parity; every cap now reads back its step.
- priest_class_spec_kits: a different gate refused the forged cast before the spec gate; the case
  now reaches the spec gate and pins its refusal, then the same setup after the switch.
- overpower_command: a whole-second window hid the rounding; part-second windows pin it.
- Six review findings in part 1's files: an energy proc read on a gain natural regen also paid; a
  paladin-only cleanup gate; a push outcome checked with `every` over an empty list; a quest log
  empty before the attune it claimed to keep; delve companion fights against an overworld boar;
  a ward-stone distance check never exercised. Each now kills its mutant.
- mob_disarm's swing helper said it forced a landed hit but rolled the real miss chance, so the
  repeat-proc case held only on the seed's current stream; it now forces the hit (`d79558e5ca`).

## For the owner

- `src/sim/combat/stealth_focus.ts` (`clearHostileTargetingOnStealth`) has no importer in `src/`;
  the live path is `dropTargetsOnStealth` plus `dropSelfFromHostileFocus`.
- The collider grid build is the floor of hundreds of suites (above).
- The overpower readout's player text in `src/sim/social/chat_readouts.ts` carries a dash
  character the repo's copy rule forbids (its test now matches it loosely).
- The header comment above `completeAllQuestsForDev` in `src/sim/quests/dev_quest_commands.ts`
  says the attune drops in-progress trackers; the body keeps them, which the test now pins.
- A few cases now ride the current rng stream and fail loudly, not silently, if content shifts it:
  the Venom Dividend proc, the delve companion's swings, the duo case's level-2 wolf.
