# Part 5, the second slimming round: record and QA

Ruled 2026-09-29 with the three-worker trial ("Trial 3 workers, then slim"): after the trial was
reverted, a slimming round over the 5 to 20 s tier of per-file CI test time, whose files no round
had judged (the first round, `../phase-02/`, judged every file over 10 s that it reached).

## Method

The shared brief (quoted in each cluster record's Method line): per-file CI time at two workers
from run 36610517548; local time `npx vitest run <file> --maxWorkers=1`, the `tests` figure,
medians of three runs of the base and the slimmed file interleaved on a shared host; one source
mutant per changed guard through the restore-verifying runner (commit first, each mutated file
equal to HEAD, a passing control first), killed by the slimmed file, or for a MERGE or DELETE by
the suite that keeps the guard. The remedies, cheapest first: a scoped world
(`EMPTY_TEST_WORLD` and kin), one seed per file (or the seed the file's GameServer already
booted), production idle culling, a hunted seed replaced by a forced draw
(`tests/helpers/forced_rng.ts`), a costly sweep moved to nightly depth with a PR representative
(`WOC_NIGHTLY_SWEEP`, the reader registered in `tests/ci_shard_plan.test.ts`). No expected value
was changed to make a slim pass.

## Totals

| Cluster | Files | Changed | Kept | Local s before, after (changed files) | Record |
|---|---|---|---|---|---|
| classes | 68 | 67 | 1 | 392.0, 131.1 | `classes.md` |
| economy | 58 | 48 | 10 | 281.8, 102.9 | `economy.md` |
| world and server | 61 | 40 | 21 | 256.2, 113.2 | `world-server.md` |
| tooling half A | 49 | 39 | 10 | 226.2, 87.8 | `tooling-a.md` |
| tooling half B | 49 | 44 | 5 | about 270, 114 | `tooling-b.md` |
| all | 285 | 238 | 47 | about 1,426, 549 | |

Measured in CI (run 36635499592, green, full mode): the summed shard test step 87.78 min against
94.02 and 98.95 at two workers before; test bodies summed over the shards 112.1 to 98.6
worker-minutes, import unchanged. The harvest of that run lowered the shard pool 16.0 percent and
the shard ceiling with it (`../phase-05-rebalance-qa.md`). Ten suites moved part of their sweep
to nightly depth, each with a PR representative and a mutant killed at both depths or shown to
need the full depth (one, frostveil_pit_escape, later went back to a single depth: see below).

## Weak pins found, and fixed

Each cluster ran mutants on its files and kept the survivors that also survive the unmodified
file: tests that claimed a guard they did not hold. Two fixers made each catch its mutant (test
changes only; a passing control first; every kill re-run after the commit):

- `4abe9923cf` to `c5be0390d8` (16 commits): spec_signatures counted seeded ticks, stance and rage
  decay as the cast's effect; rogue_engines ran the Veiled Edge case with a set bonus that doubled
  the edge; druid_bear_tank_kit's refusal case ran at full health; pet_combat_regen's owner stayed
  in combat on the wild mob's hate table alone; dawnreaver_damage_tooltip never compared the Dawn's
  Wrath tooltip with combat; form_swing derived its expectation from the constant it guards;
  threat's tame case accepted any wild wolf instead of the tamed one's respawn;
  dungeon_entry_clearance's PR seed never exercised the first door projection; far_terrain_view
  accepted any padded tile set; guild_letter_online looped over a retired subsystem's bots.
- `ab357b4cd0` to `6f8b18e7cf` (15 commits): the masterwork determinism twin (whose forced draws in
  this round hid construction-time draw drift, a loss the fix restores); a physics stall case whose
  knockback never happened; the market listing expiry; quality armor compared without the item
  instance; the deeds retro twin blind to a join leak; the Jack normal arm; a second craft-complete
  draw; tolling_bells, whose bells vanished because the encounter reset, not because of the walls;
  a parkour staircase that measured an obstacle instead of speed; skin_event's re-open draw; the
  Mass Barrier tie order; a dungeon parity walk that never mantled its coffin.
- Two in tooling half B, fixed at integration: the lockpick jam sweep counted a burnt try's
  consolation loot as opened (`101080eb9a`), and the town focus hub gate was never checked for the
  time tier (`36b368e245`).

Two fresh coverage audits then read the round: one the thirty-one fixer commits above, one the
round's riskiest decisions (the ten nightly moves, the three deletions, the forced-roll helpers,
the fake-timer suites, the architecture scan rewrite). Both came back FIX with one should-fix each
and INFO notes; all were applied:

- The Mass Barrier tie pin could not tell the id rule from join order (the recipients arrive
  id-sorted, so only dropping both sorts exposed it); the allies now join against id order
  (`1c47cd93a5`; the double mutant the old pin let through is killed).
- The forced wolf crit in the tank pairs was never proven to fire: each non-tank case now asserts a
  crit on every landed hit, and the force is narrowed to the crit roll itself (`05ec9420cb`).
- The pool timeout checks now let the socket settle, so a shorter timeout cannot pass unsettled
  (`79f1c28c88`); the leave-save backoff is stepped one sleep at a time (`d721b07d7b`); the nightly
  terrain sweep must compare every point (`7d768a3b6a`); the FFA owner lock gained a real
  determinism pair after its vacuous one was deleted (`8d508afd3c`); a lane shift at a ferry bend
  is walked yard by yard at PR depth (`c209c6ea5d`); the frostveil escape asserts the same
  property at both depths (`4f22694c34`), which made its nightly arm pure time, so the flag read
  went (`481a87079f`); veiled_hollow's comment claim was true and it is unchanged.
- The door-ring safe-ground check now holds each mob to its own spawn floor (`9d95bbc256`), and the
  parkour flat-run premise pins the classic run speed as a literal (`b8f39a8291`). The Dawn's Wrath
  cast path was confirmed guarded by `paladin_dawns_wrath` (five cases fail without it).

Three physics cases that passed without exercising what they named were rebuilt: the charge case
aimed at a stall the town no longer has, and now charges out of a fenced pen only a routed charge
escapes (`a1655d30e1`, `c13ae84d2a`); a support-agreement case compared one expression with itself
and was deleted, its two mutants killed by other cases (`6f28dcc5e6`); and the roof persistence
case climbed rising terrain and let a restore two yards underground through, so it now pins where a
restored save stands before any tick (`d59af7e63a`, both its mutants killed).

Shown equivalent, no change: a Bladestorm radius mutant in a self-centred channel branch no shipped
ability reaches (its comment names Bladestorm wrongly); a projectile taunt guard only a hidden
ability reaches; a masterwork apex bump no reader sees; a border type check the setter repeats; a
skin rank guard, a leap arm lock, and two deed-loop mutants that hang rather than survive.

## For the owner

- A save keeps only the feet's (x, z), so a player saved standing on a roof or a canopy reloads
  beside the building (a save trapped inside a prop moves to clear ground by design). Persisting
  the feet height would make the roof case a real pin; a save-compatibility decision.

- Swiftmend with no HoT to consume says "Nothing to consume." but still spends mana and goes on
  cooldown (the generic `consumeAura` effect); the classic spell refuses the cast at no cost. A
  product question, unchanged.
- The self-centred AoE channel branch in `src/sim/combat/casting_lifecycle.ts` is unreachable by
  any shipped ability, and its comment names Bladestorm, which uses position targeting.
- Product levers seen by the clusters, not touched: placing the overworld's NPCs during Sim
  construction builds the static collider grid (about 1 to 2 s, the dominant warmup of hundreds of
  suites); GameServer has no world option; an empty-world tick costs about 0.4 ms.
- `mail_instance` (13.7 s in CI) pays a real 47 s flight per case; only a product-side clock seam
  would shorten it.
