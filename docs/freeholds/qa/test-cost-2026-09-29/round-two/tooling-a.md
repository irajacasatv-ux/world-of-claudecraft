# Part 5, second slimming round, tooling half A: per-file verdicts

Scope: 49 files of the 5 to 20 s CI tier (guides and guards, physics and movement, hoards and
delves, water, server plumbing). Base `8f445b9422`; landed on feature/freeholds as `1adb6da98c` to
`0e8010547f` (40 commits, cherry-picked; the nightly reader list resolved as the sorted union).
Method as in `classes.md`.

## Verdicts

39 changed (three partly MOVE TO NIGHTLY, one of them later back to a single depth; one deletes
a duplicated case), 10 KEEP. The 39 changed
files went from 226.2 s to 87.8 s of local test time. Every survivor in the table also survives the
base file, so no coverage was lost.

| File | CI s | Verdict | Change | Local s before, after | Mutants k/s |
|---|---|---|---|---|---|
| guide | 14.1 | SLIM | Trader Wilkes spawned from his NPC def on the empty world (placing the overworld NPCs built the collider grid) | 4.81, 4.99 (noise; per-case sums 4.13, 3.80) | 1/0 |
| architecture | 12.3 | SLIM | the four Reliquary write patterns run in one read and strip per file; violations come back in the same order | 6.93, 6.81 (that case 337 to 120 ms) | 7/0 |
| mastery_mechanism | 10.5 | SLIM | empty world, one seed; the DoT case forces its hit | 8.52, 1.79 | 4/0 |
| heroic_leap | 10.2 | SLIM | one seed instead of eight | 8.86, 1.64 | 5/1 |
| crest_icon_art | 10.0 | SLIM | counts translucent pixels and asserts once, not one expect per pixel | 7.05, 0.07 | 1/0 (a hand-built one-pixel translucent WebP) |
| parkour | 9.8 | SLIM | one content object per prop layout; idle cull | 7.18, 4.17 | 5/3 |
| hoard_goblin | 9.4 | SLIM | idle cull | 7.21, 3.46 | 4/0 |
| sim_i18n_name_collisions | 9.3 | KEEP | about 1.2 s of cases; loading every locale is the guard | | |
| furnishing_tool_parity | 9.1 | KEEP | a full world per host by design | | |
| skin_event | 9.0 | SLIM | one seed | 6.24, 1.55 | 3/2 |
| hoard_pulsars | 8.8 | SLIM | idle cull (the empty world changes when the orbs turn immune, so it was rejected) | 5.59, 3.52 | 3/0 |
| dragonkin_brood | 8.6 | SLIM | empty world; the fiat-kill case keeps the full world plus the cull | 7.05, 2.40 | 5/0 |
| umbral_anchor_marker | 8.3 | SLIM | one empty-world caster helper | 7.17, 0.36 | 4/0 |
| perfect_moment | 8.3 | SLIM | empty world | 6.14, 1.79 | 4/0 |
| server/leave_character_save | 8.3 | SLIM | the retry ladder runs on fake timers | 8.27, 0.01 | 3/0 |
| scree | 8.2 | SLIM | the built-in sweep computed once; offenders asserted once | 5.95, 3.80 | 6/0 |
| veiled_hollow | 7.9 | MOVE TO NIGHTLY (part) | PR walks the Starfall face walk and jump; the whole face and yaw matrix nightly | 6.45, 3.16 | 2/0 at both depths |
| tolling_bells | 7.8 | SLIM | one seed, idle cull | 5.38, 2.35 | 3/1 |
| game_state_metrics | 7.7 | KEEP | a GameServer per case, and GameServer has no world option | | |
| water_paint_order | 7.5 | KEEP | one shared water build; 336k of 339k terrain samples are unique, so a memo cannot pay | | |
| ruinbolt_feedback | 7.5 | SLIM | empty world, one seed | 6.37, 1.81 | 3/0 |
| env_protocol | 7.4 | SLIM | one seed | 8.35, 2.77 | 4/0 |
| lockpick_hud_sync | 6.9 | DELETE (one case) | its 30-seed no-drain loop was line for line the one in lockpick_bountiful_jam | 5.46, 0.37 | see below |
| orange_promotion | 6.8 | SLIM | one seed; the reload Sim on the empty world | 6.93, 1.58 | 5/0 |
| physics_character | 6.8 | SLIM | one content object per layout; idle cull (a later audit deleted a case that compared one expression with itself, `6f28dcc5e6`) | 7.91, 4.71 | 2/1 |
| physics_audit_interactions | 6.7 | SLIM | empty world | 4.55, 1.69 | 1/1 |
| ghost_dead_gate | 6.6 | SLIM | vendor world with its ground objects kept | 4.48, 2.29 | 4/0 |
| r5_envelope_probe | 6.6 | KEEP | lane durations calibrated to pinned floors; the probe script is outside the list | | |
| water_approach_core | 6.5 | MOVE TO NIGHTLY (part) | a 1 yd lattice per PR (worst lead 2.15 s), the half-yard lattice nightly (2.04 s); both clear the 1.5 s deadline | 4.81, 1.26 | 4/0 (a 2,100 ms deadline passes PR depth by design, killed nightly) |
| server/db_pool_timeout | 6.3 | SLIM | fake timers against the real socket and pg driver: still pending at 4.5 s, timed out by 9 s | 6.69, 1.66 | 3/0 |
| tutorial_greeting | 6.1 | SLIM | the reload on the file's own seed | 4.30, 3.03 | 2/0 |
| interest | 6.1 | KEEP | a GameServer per case | | |
| hoard_orbital_lightning | 6.0 | SLIM | idle cull | 5.94, 3.07 | 1/1 |
| interaction | 5.9 | SLIM | empty world for the two-player helper; the quest-NPC case on the file's seed | 4.33, 1.84 | 4/0 |
| weapon_stow | 5.8 | SLIM | wolf world | 4.53, 3.19 | 3/0 |
| curator_broadcast | 5.7 | KEEP | a GameServer per case | | |
| server/http/parity | 5.6 | KEEP | one beforeAll runs the whole corpus once | | |
| swim_dive | 5.6 | SLIM | one deep-lake content object | 3.60, 1.83 | 3/0 |
| frostveil_pit_escape | 5.5 | MOVE TO NIGHTLY (part), later reverted | PR walks the 4 cardinal headings, nightly all 16; after an audit both depths assert that some heading escapes (`4f22694c34`), so the flag read went (`481a87079f`) | 4.22, 2.35 | 2/0 at both depths |
| border_waters | 5.4 | SLIM | actor-template Sims on the empty world | 3.57, 3.14 | 2/0 |
| furnishing_commerce_parity | 5.4 | KEEP | the offline side already scoped; the online side is a GameServer | | |
| dev_bis_gear | 5.3 | SLIM | empty world, one seed | 3.54, 0.44 | 3/0 |
| lockpick_command | 5.3 | SLIM | empty world, one seed | 5.02, 0.63 | 2/1 |
| fear_break_chance | 5.3 | SLIM | empty world, one seed; the landing rolls forced; the always-breaks case draws the worst roll | 5.46, 1.61 | 4/0 |
| linkdead | 5.2 | KEEP | a GameServer per case | | |
| water_apron_bathymetry | 5.2 | SLIM | one apron build for all cases; per-vertex checks asserted once | 5.28, 1.95 | 3/0 |
| mass_barrier_theme | 5.2 | SLIM | one seed | 3.86, 1.51 | 2/1 |
| ground_target_cast | 5.2 | SLIM | empty world | 3.71, 1.68 | 2/0 |
| signature_mechanics_v2 | 5.1 | SLIM | empty world, one seed | 4.49, 1.46 | 2/0 |

**The deleted lockpick case.** The kept suites kill three mutants the deleted case guarded; a
board lagging one column survives the jam sweep and the deleted case alike and is killed by the
per-step cases. The deletion relies on `tests/lockpick_bountiful_jam.test.ts` keeping its no-drain
sweep at PR depth, which it does (and it now counts only a premium grant as opened, `101080eb9a`).

**A case now stricter.** fear_break_chance's always-breaks case forces its worst draw: on the new
rng stream it had let through a break chance capped at one half, which the old seed caught only by
luck.

**Product levers recorded, not touched.** Placing overworld NPCs during Sim construction builds the
static collider grid (about 2 s, the dominant warmup in dozens of suites); GameServer has no world
option, so every server suite pays for the production world.

Weak pins found that predate this round, including a vacuous physics_audit_interactions case (its
knockback never happens: the level-60 player never draws aggro from the level-5 wolf), are listed
with their fixes in `README.md` here.
