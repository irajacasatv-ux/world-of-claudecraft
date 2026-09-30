# Part 5, second slimming round, the classes cluster: per-file verdicts

Scope: the 68 files of the classes cluster in the 5 to 20 s CI tier (class kits, talents,
tanks, pets, procs), none judged by the first round. Base `8f445b9422`; landed on
feature/freeholds as `71861551ce` to `93af874db9` (71 commits, cherry-picked; the one conflict
was the nightly reader list in `tests/ci_shard_plan.test.ts`, resolved as the sorted union).

## Method

The shared brief (`README.md` in this directory): CI s is the per-file CI test time at two
workers from run 36610517548; local s is `npx vitest run <file> --maxWorkers=1`, the `tests`
figure, the median of three interleaved runs of the base and the slimmed file on a shared host
(compare a row's two numbers, not rows with each other). Mutants went through the
restore-verifying runner, each batch after its commit, a passing control first. "Pinned" means
the case now forces its hit, crit or resist roll instead of riding a hunted seed; no expected
value moved.

## Verdicts

65 SLIM, 2 partly MOVE TO NIGHTLY, 1 KEEP. Summed local test time 392.0 s to 131.1 s (67 percent
less). Mutants: 106 runs, 93 killed, 13 survived; one survivor was a loss from the slim and was
fixed (ability_drill), and the other twelve survive on the unmodified files too.

| File | CI s | Verdict | Change | Local s before, after | Mutants k/s |
|---|---|---|---|---|---|
| hunter_spec_loops | 14.6 | SLIM | 7 full-world seeds to 1 on the empty world; rolls pinned | 10.78, 1.78 | 2/0 |
| talent_effect_primitives_v026 | 14.3 | SLIM | about 20 seeds to 1; the full-world case on the empty world | 10.69, 1.76 | 2/0 |
| threat | 12.7 | SLIM | hunted seeds 1 and 43 fold into 42; Shadewolf pins its last Cinder Jolt | 8.78, 7.66 | 2/1 |
| trinkets_raid | 12.6 | SLIM | empty world; the determinism case on the file's seed | 10.40, 2.28 | 2/0 |
| rogue_engines | 10.9 | SLIM | empty world, rolls pinned, a stream-parking tick dropped | 11.69, 2.24 | 2/1 |
| ability_vfx_cast_requirements | 10.4 | MOVE TO NIGHTLY (tier 1 walk) | PR walks tier 0 as world caster and local player; reader registered | 10.34, 7.42 | 1/2 |
| talent_swap_auras | 9.9 | SLIM | 7 seeds to 1, three rigs off the full world | 10.24, 1.95 | 1/0 |
| paladin_protection_abilities | 9.7 | SLIM | empty world, rolls pinned (four Oath Chain cases went red unpinned) | 7.62, 2.07 | 1/0 |
| ignivar_set_bonus_paladin | 9.7 | SLIM | 4 full-world seeds to 1 on the empty world | 7.10, 1.61 | 1/0 |
| healing_training | 9.7 | SLIM | a world with only the sparring master; Aether Surge pinned | 6.82, 2.25 | 2/0 |
| combat_res_released_ghost | 9.3 | SLIM | offline rigs on `WORLD_SEED` on the empty world: 4 grids to 1 | 8.02, 3.17 | 1/0 |
| shaman_thundercall_rework | 9.3 | SLIM | empty world; three procs pinned | 7.24, 1.83 | 2/0 |
| ability_drill | 8.5 | SLIM | empty world, a landed cast pinned, plus a resisted-cast case | 7.95, 2.85 | 2/0 |
| talent_full_hit_scaling | 8.4 | SLIM | 5 seeds to 1; Sunward Disc pinned | 7.17, 2.12 | 1/0 |
| spec_signatures | 8.1 | SLIM | empty world, 1 seed | 5.64, 1.77 | 1/3 |
| aura_track_catalog | 8.0 | SLIM | 5 seeds to 1 | 6.83, 1.70 | 1/0 |
| talent_tooltip_accuracy | 8.0 | MOVE TO NIGHTLY (locale sweep) | PR scans es, zh_CN, cs_CZ; every locale nightly; reader registered | 1.51, 0.27 | 1/0 |
| class_spec_kits | 7.8 | SLIM | 9 full-world Sims on 4 seeds to empty-world Sims on 1 | 6.61, 0.38 | 1/0 |
| druid_bear_tank_kit | 7.7 | SLIM | 2 seeds to 1; heal case on the empty world, refusal case on the wolf world | 7.99, 2.00 | 1/1 |
| paladin_veilbound_march | 7.5 | SLIM | empty world | 4.84, 1.81 | 1/0 |
| warrior_row_runtime_v026 | 7.5 | SLIM | 9 seeds to 1 | 6.04, 1.57 | 1/1 |
| tank_crit_immunity (four pair files) | 6.1 to 7.4 | SLIM (helper) | see the note below | 4.77 to 5.08, 2.33 to 2.53 | 7/0 |
| paladin_dawns_wrath | 7.4 | SLIM | rigs on the empty world; the trace keeps the full world | 6.79, 1.97 | 2/0 |
| rogue_poison_coatings | 7.3 | SLIM | 2 seeds to 1 on the empty world; the flat-coat comparison pinned | 5.78, 1.94 | 2/0 |
| priest_benison | 7.2 | SLIM | 2 full-world seeds to 1 on the empty world | 6.64, 1.82 | 1/0 |
| rogue_utility_poisons | 7.2 | SLIM | empty world | 6.18, 1.78 | 2/0 |
| summon_threat_seed | 7.2 | SLIM | empty world | 4.67, 1.94 | 1/0 |
| frost_mage_procs | 7.1 | SLIM | 4 seeds to 1; spend order and Shatter pinned; the proc hunt keeps natural rolls | 6.87, 3.34 | 1/0 |
| paladin_retribution_abilities | 7.0 | SLIM | empty world, rolls pinned | 5.48, 1.76 | 1/0 |
| rogue_sap_control | 6.9 | SLIM | 2 seeds to 1 on the empty world | 5.43, 1.78 | 1/0 |
| pet_commands_module | 6.8 | SLIM | about 20 seeds to 1 | 7.44, 1.66 | 2/0 |
| priest_talent_mechanics | 6.8 | SLIM | empty world, rolls pinned | 5.04, 2.03 | 2/0 |
| druid_spell_pack | 6.8 | SLIM | empty world | 4.89, 1.84 | 1/0 |
| combat_damage | 6.8 | SLIM | 16 full-world Sims on 3 seeds to 1 seed on the empty world | 6.61, 0.43 | 1/0 |
| ignivar_set_bonus_priest | 6.7 | SLIM | 3 seeds to 1 on the empty world | 4.80, 1.48 | 1/0 |
| chain_heal | 6.6 | SLIM | 2 seeds to 1; the falloff crit pinned | 5.07, 2.02 | 1/0 |
| pet_combat_regen | 6.6 | SLIM | empty world; places its webwood spider (now explicitly hostile) | 4.86, 1.82 | 1/1 |
| rogue_talents_v029 | 6.5 | SLIM | empty world, rolls pinned | 4.99, 1.81 | 2/0 |
| chronomancy_echo | 6.5 | SLIM | empty world | 4.73, 2.01 | 1/0 |
| aspect_exclusion | 6.4 | SLIM | 2 seeds to 1 on the empty world | 5.47, 1.85 | 1/0 |
| druid_form_auto_unshift | 6.4 | SLIM | empty world; Lunar Tempest pinned | 5.36, 1.86 | 1/0 |
| combat_auras | 6.4 | SLIM | about 20 Sims to 1 seed on the empty world | 4.44, 0.42 | 1/0 |
| pet_scaling | 6.2 | SLIM | 3 seeds to 1; the mounted-owner case keeps the full world | 5.79, 1.86 | 2/0 |
| cooldown_manager_catalog | 6.1 | SLIM | 36 Sims on the empty world | 5.60, 0.88 | 1/0 |
| mage_fireball_form | 6.1 | SLIM | empty world | 4.73, 1.88 | 1/0 |
| paladin_sun_verdict | 6.0 | SLIM | 2 seeds to 1; mark replacement pinned | 4.10, 1.64 | 1/0 |
| paladin_radiant_resonance | 6.0 | SLIM | empty world | 4.09, 1.86 | 1/0 |
| paladin_percentage_tooltip | 5.9 | SLIM | 3 seeds to 1 on the empty world | 4.64, 0.34 | 1/0 |
| paladin_rite_of_many | 5.8 | SLIM | empty world | 5.51, 1.79 | 1/0 |
| chronomancy_cascade | 5.8 | SLIM | empty world | 3.80, 1.97 | 1/0 |
| rogue_finisher_scaling | 5.8 | SLIM | empty world, rolls pinned | 3.72, 1.79 | 2/0 |
| ignivar_varkhul_health | 5.7 | SLIM | 3 seeds to 1 on the empty world | 4.64, 0.38 | 1/0 |
| shaman_talents_v029 | 5.7 | SLIM | empty world, rolls pinned | 4.45, 1.82 | 1/0 |
| form_swing | 5.7 | SLIM | empty world; places its own dummy; Rendclaw pinned | 3.95, 1.69 | 1/1 |
| stealth_pet_vanish | 5.6 | SLIM | 2 seeds to 1 on the empty world | 3.79, 1.62 | 1/0 |
| hunter_patch_up_v026 | 5.6 | SLIM | empty world | 4.85, 1.89 | 2/0 |
| progression/talent_mutations_v2 | 5.3 | SLIM | 5 seeds to 1 | 4.74, 1.69 | 1/0 |
| set_proc_clearcasting | 5.3 | SLIM | 7 seeds to 1 | 5.45, 1.94 | 1/0 |
| paladin_choice_rows | 5.3 | SLIM | empty world | 3.72, 1.71 | 1/0 |
| dawnreaver_damage_tooltip | 5.2 | SLIM | about 36 Sims on the empty world | 4.43, 1.88 | 1/1 |
| rogue_balance_pass | 5.1 | SLIM | 2 seeds to 1; Thuggery pinned; the no-mastery arm forces its roll | 3.47, 1.54 | 2/0 |
| sickness_undispellable | 5.1 | SLIM | 2 seeds to 1 on the empty world | 3.39, 1.65 | 1/0 |
| combat_effect_dispatch | 5.0 | SLIM | empty world; Garrote and Gouge pinned | 4.37, 1.86 | 2/0 |
| warlock_pet_progression | 5.0 | SLIM | empty world | 3.24, 1.67 | 1/0 |
| warlock_feedback_probe | 5.0 | KEEP | its world lives in `scripts/warlock_balance_probe.ts`, already isolated | 3.2 (survey) | none |

**The tank crit pairs.** The shared helper `tests/tank_crit_immunity_util.ts` changed, not the
four pair files. At the natural 5 percent each fight rolled about one crit in a hundred swings,
so every "still eats crits" case rode the seed; the wolf's own crit roll is now forced (still
drawn, inside its swing), so a non-tank takes a crit on every hit and a committed tank none. The
wolf swings four times as often over a 60 s window instead of 240 s, the same swing count. The
helper's 120 s timeout override, sized for the old window, was then dropped (`25c3fd60b1`).

**The one loss, fixed.** On the old seed ability_drill's single mage cast was resisted, so the
case had guarded the resist-branch credit in `spell_resist.ts` by accident and never the landed
path it names. Pinning a landed cast moved it to the hit path, and a new case pins a resist, so
both credit sites are guarded on any stream.

**Coverage now reached only nightly.** A raw-notation entry in a locale table other than es,
zh_CN or cs_CZ, and an effect family only the tier 1 vfx plan uses.

**Pin caveat.** Fixing `rng.next` at 0.9 makes a spell fail against a target two or more levels
above the caster; no pinned rig here does that.

Weak pins found that predate this round are listed, with their fixes, in `README.md` here.
