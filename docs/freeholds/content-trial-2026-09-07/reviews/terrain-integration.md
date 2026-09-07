# Final terrain integration supplement

Read-only review found no remaining terrain integration issue in the current diff. No source files or fixtures were edited, and no tests were rerun for this supplement.

## Logged results

The parent confirmed this exact invocation produced `/tmp/freehold-late-gate-fixes.log`:

```sh
npx vitest run tests/reliquary_state.test.ts tests/exchange_eligibility.test.ts tests/terrain_chunk_geometry.test.ts > /tmp/freehold-late-gate-fixes.log 2>&1
```

That log records one failing file and two passing files, with 147 passing tests. Its only failure is the missing `exchangeBrowseCategory` import in the exchange test. Given the confirmed invocation, both the Reliquary suite and terrain chunk geometry suite passed. The chunk test was not a remaining failure.

The newer parent-run `/tmp/freehold-full-gate-repairs.log` is now complete: eight files and all 261 tests passed. Parent identified this invocation as all eight previously failing files, including both terrain suites. This agrees with the earlier focused terrain run at `/tmp/freehold-terrain-regression-green.log` (five files, 127 tests passed).

## Why the chunk golden is preserved

`src/render/terrain_chunk_build.ts` fills its vertex height lattice through `meshTerrainHeight`, whose implementation in `src/render/terrain_mesh_height.ts` samples the authoritative `terrainHeight` from `src/sim/world.ts`. The only additional adjustment is the pre-existing Last Keep terrace subtraction. Restoring the original calm-pad roster therefore restores the terrain input to both simulation height sampling and rendered chunks.

`tests/terrain_chunk_geometry.test.ts` still checks 36 Eastbrook chunks, zero gap chunks, and the unchanged in-rect digest `1d9b0a4a7e0d97c5a11c918b1a8f29c3`. That digest includes position, normal, color, uv and index attributes, using the existing six-decimal hashing precision. No digest was re-minted.

## Current-diff inspection

- `src/sim/terrain_calm_anchors.ts` has only the public content-barrel import and the narrow `FREEHOLD_FURNISHER_NPC_ID` skip added to the existing NPC loop. All earlier pads retain their order and parameters. No host flag influences terrain.
- The content barrel reaches data-only Freehold catalogs; its imports do not add a runtime dependency back into terrain, data.ts, or Sim. The new import does not introduce a value cycle.
- The authored NPC remains at (-66, -96), and the safe-position bootstrap still runs before `market.seed`. Surface admission still skips dynamic NPCs and admits the furnisher only for a lit host. The terrain correction does not allocate entities or draw RNG.
- The new terrain regression explicitly compares dark and lit Sim placement and world heights, then compares the four restored points against independent literals from the existing golden corpus. Its earlier red run exposed the extra pad and all four drifted points.
- `git diff HEAD` remains empty for world.ts, the terrain renderer/build/mesh-height files, both original terrain test files, and `tests/fixtures/terrain_height_parity.v1.f64le.gz`.

The measured WORLD_SEED site remains unchanged after the correction, as recorded in `/tmp/freehold-furnisher-terrain-site.json`: height -0.3226466769196748, freeboard 3.977353323080325, maximum cardinal height delta 0.03791360518818393, and clear radius probes through three yards. The scoped fix adds no terrain risk requiring a golden update or another implementation change.

Parent continues to own the complete integration gate and commit sequence; these scoped and repair logs do not substitute for that final gate.
