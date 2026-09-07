# Freehold furnisher terrain correction

The NPC calm-pad roster in `src/sim/terrain_calm_anchors.ts` included every authored NPC definition, independently of whether a host spawned that NPC. Admitting the Freehold Furnisher therefore added a required 6/14 pad to dark and lit hosts, altering four existing golden sample points across seeds 42 and 2147483647.

The existing roster now skips `FREEHOLD_FURNISHER_NPC_ID`, imported through the content public barrel. This vendor stands on its measured existing ground in both modes. No change to world.ts, NpcDef, flags, NPC coordinates, spawn order, IDs, or RNG behavior was needed.

Files changed for this correction:

- `src/sim/terrain_calm_anchors.ts`
- `tests/terrain_calm_anchor_freehold.test.ts`

The new regression checks that all 106 earlier NPC pads remain in the same order, that the furnisher adds no pad, and that dark and lit Sim construction returns the same pre-furnisher terrain, ground, and placement heights at the four reported points. The independent literal heights come from the existing golden corpus. The original corpus still enforces its two-ULP contract and was not edited or regenerated.

Restored values (delta is corrected height minus the accidental pad height; terrain and ground shared each value):

| Seed | x | z | Corrected height | Delta |
| --- | --- | --- | --- | --- |
| 42 | -60 | -96 | -0.41517106585608576 | 0.0009823293968255764 |
| 42 | -66 | -90 | -0.43374254929874984 | 0.1389119343260074 |
| 2147483647 | -60.863476185594166 | -92.86172453079594 | -0.10891595743617682 | -0.0063526464240769714 |
| 2147483647 | -61.825141408007866 | -93.82338975320965 | 0.08224219563562438 | -0.06282668776904243 |

Validation:

- Red: `npx vitest run tests/terrain_calm_anchor_freehold.test.ts` failed all three tests for the extra NPC pad and the four reported height drifts. Log: `/tmp/freehold-terrain-regression-red.log`.
- Green: `npx vitest run tests/terrain_calm_anchor_freehold.test.ts tests/terrain_calm_anchor_doors.test.ts tests/terrain_height_parity.test.ts tests/freehold_npc_spawn.test.ts tests/architecture.test.ts` passed five files and 127 tests. This includes the unchanged full terrain corpus and the earlier dark entity/RNG fingerprint. Log: `/tmp/freehold-terrain-regression-green.log`.
- `npx @biomejs/biome check --write src/sim/terrain_calm_anchors.ts tests/terrain_calm_anchor_freehold.test.ts` passed, formatting only the new test. Log: `/tmp/freehold-terrain-biome.log`.
- Scoped `git diff --check` passed; `git diff --numstat` for the terrain fixture and existing terrain parity test was empty.

The actual WORLD_SEED site was measured again through groundHeight, resolvePosition, roadDistance and a real lit Sim. Artifact: `/tmp/freehold-furnisher-terrain-site.json`; executable probe: `/tmp/freehold-furnisher-terrain-site.ts`. The position remains (-66, -96), actual ground/lit NPC y is -0.3226466769196748, freeboard remains 3.977353323080325 and maximum cardinal 0.6-yard height delta remains 0.03791360518818393. Both recorded measurements changed by exactly zero. Radii 0.6, 1, 2 and 3 still resolve to the exact authored position. Road distance remains 12.63744766317716; the nearest existing NPCs remain 6 and 10 yards away.

Parent was notified that integrated evidence regeneration and the full gate can resume. No staging or commits by this agent.
