# Crafted furnishing development geometry proposal

Status: **DEVELOPMENT TUNING, proposed, awaiting Fernando acceptance.** Approval is null and production remains disabled. This artifact supplies numeric stand-in geometry and comparative decor costs for the ten exact crafted IDs. It does not modify the catalog, acquisition, recipes, item art, renderer, room geometry or production gates.

## Numeric proposal

All dimensions and radii use existing world units. Footprints use the accepted vendor trial lattice: an executed measurement of `public/models/dungeon/floor_tile_small.glb` is exactly 2 along X, divided by 4 for a 0.5 pitch. Width/depth/radius round outward with no epsilon or codec-overhang forgiveness. Display dimensions round to six decimal places only; the complete JSON is the numerical authority.

| Item ID | Measured X width x Y height x Z depth | Footprint cells | Solid r | Decor cost |
|---|---|---|---:|---:|
| `freehold_weapon_rack` | 1.250053 x 1.500000 x 0.812555 | 3 x 2 | 1 | 1 |
| `freehold_iron_brazier` | 0.813105 x 1.500000 x 0.813105 | 2 x 2 | 0.5 | 7 |
| `freehold_patchwork_rug` | 2.000000 x 0.000000 x 4.000000 | 4 x 8 | 0 | 1 |
| `freehold_hide_armchair` | 0.975058 x 1.594457 x 0.975058 | 2 x 2 | 1 | 1 |
| `freehold_clockwork_lamp` | 0.959978 x 1.387788 x 0.959978 | 2 x 2 | 1 | 1 |
| `freehold_glass_floor_lamp` | 0.959978 x 1.387788 x 0.959978 | 2 x 2 | 1 | 1 |
| `freehold_chart_easel` | 0.754509 x 1.500000 x 1.036134 | 2 x 3 | 1 | 8 |
| `freehold_jewel_floor_lamp` | 0.857021 x 2.000000 x 0.520585 | 2 x 2 | 0.5 | 4 |
| `freehold_set_supper_table` | 2.500000 x 2.357173 x 2.500000 | 5 x 5 | 2 | 5 |
| `freehold_glow_lantern` | 0.639985 x 0.925192 x 0.639985 | 2 x 2 | 0.5 | 1 |

The rug has approximately 1.59e-15 world-unit Y extent from the existing rotated Float32 plane recipe, not a fabricated thickness. Its zero radius follows the approved walk-through underlay class. It still pays one decor point. The supper table total height includes its tall bottle and tabletop composition; it is not a claim about tabletop height.

## Exact source identity and transformation

Each GLB measures its complete active default scene, preserving all parts, materials and authored node transforms. Item-local yaw is zero and world translation is omitted. Normalization centers the complete X/Z extent, subtracts minimum Y, then applies the explicit scale. This follows the earlier trial and `props.ts::propAsset`; it is not a claim that specialist streetlamp runtime normalization is reused. The actual translation, complete scale vector, post-scale floor lift and per-primitive source matrices are retained in [geometry-measurements.json](geometry-measurements.json).

| Item ID | Retained source and existing identity | Proposed scale derivation |
|---|---|---|
| `freehold_weapon_rack` | `public/models/biome/hex_weaponrack.glb`; `PROP_ASSET_DEFS.hexWeaponRack` | `6.2500009158006655`; Measured authored unit-scale rack height is 0.23999996483325958 world units. Propose three accepted grid cells (1.5 units) tall, deriving scale as 1.5 / measured height. This is new household tuning, not a verified existing placement transform. |
| `freehold_iron_brazier` | `public/models/props/yumi_brazier_stand.glb`; `YUMI_MAZE_ASSET_URL.brazier_stand` | `1.15384619616898`; Propose three accepted development grid cells high for a household standing bowl; source dimension measured before deriving the uniform scale. |
| `freehold_patchwork_rug` | `src/render/rift_decor.ts`; `buildRug` | `[0.25, 1, 0.15384615384615385]`; Reuse vendor development rug dimensions: one by two measured floor tiles; retained source floor lift 0.02. |
| `freehold_hide_armchair` | `public/models/dungeon/chair.glb`; `PROP_ASSET_DEFS.kcasChair` | `1.3`; Existing exact scale witness is sealed and checked in the proposal. |
| `freehold_clockwork_lamp` | `public/models/dungeon/lantern_standing.glb`; `battleground assetId dungeon/lantern_standing` | `1.5`; Existing exact scale witness is sealed and checked in the proposal. |
| `freehold_glass_floor_lamp` | `public/models/dungeon/lantern_standing.glb`; `battleground assetId dungeon/lantern_standing` | `1.5`; Existing exact scale witness is sealed and checked in the proposal. |
| `freehold_chart_easel` | `public/models/props/inscription_lectern.glb`; `ARTISAN_ASSET_URL.inscription_lectern (retained inventory metadata)` | `1.3636363340803421`; Propose three accepted development grid cells high; existing retained metadata target is 1.1, so this is an explicit new household proposal, not the current placement transform. |
| `freehold_jewel_floor_lamp` | `public/models/props/streetlamp_amberfall_crystal.glb`; `STREETLAMP_ASSET_DEFS.amberfall_crystal` | `0.36363636363636365`; Propose four accepted development grid cells high. Current streetlamp targetHeight is 5.5 and uses separate footprint normalization; this trial instead uniformly scales decoded source geometry to 2 world units and recenters combined X/Z bounds. |
| `freehold_set_supper_table` | `public/models/dungeon/table_medium_tablecloth_decorated_b.glb`; `existing GLB filename table_medium_tablecloth_decorated_b (no furnishing registration)` | `1.25`; Propose same scalar as accepted vendor round table, not a claimed existing placement scale for this exact table; full measured extents must be accepted. |
| `freehold_glow_lantern` | `public/models/dungeon/lantern_standing.glb`; `battleground assetId dungeon/lantern_standing` | `1`; Reuse accepted vendor cage normalization and authored unit scale; shared source is explicit, not ten distinct finished models. |

The rack authored height measures 0.23999996483325958 units; authored unit scale is too small for this household proposal. Its 1.5-unit height is a new proposed three-cell target. The brazier and lectern use the same three-cell target; the jewel lamp uses four cells (2 units). These are explicit development sizing choices, not observed historical furnishing placements. Uniform scale is target height divided by the measured source height with no pre-rounding. The chair uses the retained 1.3 placement witness. Clockwork and Glass lamps use the existing 1.5 gatehouse lantern scale. Glow Lantern uses the previously accepted unit-scale cage. Supper Table uses a proposed 1.25 scalar, borrowed as a comparison from the vendor round table, not mislabeled as the existing scale for this exact source.

## Proxy fidelity and decisions

The identity decision is part of acceptance. These are measured existing objects, not newly authored Freehold art. Craft material identity and distinct silhouette are intentionally unresolved where listed.

| Exact ID | Form evidence and gap |
|---|---|
| `freehold_weapon_rack` | Inspected empty freestanding timber rack with broad base and crossbar. No weapons are present; final bracket and workmanship design remains unbuilt. |
| `freehold_iron_brazier` | Inspected raised empty bowl on a stable pedestal. Material finish and iron rivets are not represented by this diagnostic; no flame or point light is included. |
| `freehold_patchwork_rug` | Exact accepted flat rug recipe and 2 by 4 world-unit transform. No patchwork panels or stitch texture; zero collision comes from underlay class. |
| `freehold_hide_armchair` | Existing upright wooden chair proxy. It has no soft hide sling, stitching or armchair width; accept as numeric development placeholder only and remeasure final armchair. |
| `freehold_clockwork_lamp` | Weighted low cage proxy; no exposed winding mechanism or Engineering workmanship. Existing cage form inspected in accepted vendor evidence. No emitted light or animation is added. |
| `freehold_glass_floor_lamp` | Floor-supported low cage proxy; no amber glass vessel or Alchemy workmanship. Existing cage form inspected in accepted vendor evidence. No emitted light or animation is added. |
| `freehold_chart_easel` | Inspected freestanding book lectern proxy with pedestal. It is not a parchment chart easel: no geographic content is introduced and final chart form requires replacement and remeasurement. |
| `freehold_jewel_floor_lamp` | Inspected faceted lamp head suspended from a substantial freestanding post and foot. Floor-supported streetlamp proxy, not a ceiling chandelier. Final metal jewel setting and household proportions remain unbuilt. |
| `freehold_set_supper_table` | Existing table with cloth and inert tabletop composition. No charges, food grants, Well Fed, consumption or station functionality is reused. Inspected whole height includes a tall bottle above the table surface; height is not tabletop height. |
| `freehold_glow_lantern` | Existing substantial low standing cage proxy. No Enchanting finish, animated glow, point light or gameplay effect is included. |

The [rack](geometry-rack-inspection.png), [brazier](geometry-brazier-inspection.png), [chart proxy](geometry-chart-inspection.png), [jewel lamp](geometry-jewel-inspection.png) and [supper table](geometry-table-inspection.png) were inspected through projections of decoded vertices. Diagnostic flat shading does not reproduce source textures or prove their material finish. The floor lamp visibly has a post and foot; it has no ceiling socket dependency and is not the later chandelier. The rack is empty. The earlier [lantern inspection](../content-trial-2026-09-07/geometry-lantern-inspection.png) is the same retained cage source used here.

The normal chair does not conservatively predict the final hide armchair width, and the book lectern does not predict final easel depth. Those are explicit proxy limitations, not passed final-art requirements. Acceptance permits disabled development fixtures for these exact source models only. Replacing any model requires measuring the replacement before using its footprint, radius or cost. The repeated cage model does not establish ten distinct crafted appearances.

## Measured rendering inputs and comparative costs

The producer decodes retained meshopt GLBs with installed pinned gltf-transform and meshoptimizer libraries. It rejects skinned, morph-targeted and non-triangle geometry. It measures decoded POSITION vertices after all parent-composed transforms, counts rendered triangles and primitives in the default scene, deduplicates material identities and decoded accessors within each asset, and records every embedded texture payload size and SHA-256. It does not export models or invoke final asset generation.

The reference chair is measured again and asserted equal to the accepted vendor measurement: 294 triangles, 1 primitive, 1 material and 8,342 decoded accessor bytes. `decorCost = max(1, ceil(max(triangles/294, primitives/1, materials/1, decodedGeometryBytes/8342)))`. Each full component ratio appears in the JSON. Texture bytes are recorded separately, consistent with the accepted method.

| Item ID | Triangles | Primitives | Materials | Decoded accessor bytes | Textures | Encoded texture bytes |
|---|---:|---:|---:|---:|---:|---:|
| `freehold_weapon_rack` | 42 | 1 | 1 | 1344 | 1 | 26164 |
| `freehold_iron_brazier` | 1951 | 1 | 1 | 46962 | 3 | 227895 |
| `freehold_patchwork_rug` | 2 | 1 | 1 | 140 | 0 | 0 |
| `freehold_hide_armchair` | 294 | 1 | 1 | 8342 | 1 | 27841 |
| `freehold_clockwork_lamp` | 264 | 1 | 1 | 5978 | 1 | 27828 |
| `freehold_glass_floor_lamp` | 264 | 1 | 1 | 5978 | 1 | 27828 |
| `freehold_chart_easel` | 2100 | 1 | 1 | 48662 | 3 | 191325 |
| `freehold_jewel_floor_lamp` | 1168 | 3 | 3 | 23356 | 3 | 86759 |
| `freehold_set_supper_table` | 1200 | 1 | 1 | 28234 | 1 | 27841 |
| `freehold_glow_lantern` | 264 | 1 | 1 | 5978 | 1 | 27828 |

One of every crafted stand-in costs 30 points. Combined with the accepted vendor subset's 21 points, one of each of all eighteen would total 51 points. This exceeds the unchanged Inn budget of 20 and is below the unchanged Cottage budget of 60. This is only budget arithmetic, not proof that these objects fit a legal room.

Positive costs retain the existing copy-count bounds of 20 and 60, and chair-relative triangle costs bound mutable source triangles by 5,880 and 17,640 respectively before room constraints. No room budget is raised. Fixed dressing, actual GPU texture format and mip residency, sharing/deduplication, material conversion, shadows, overdraw, emitter limits and real LOW-device frame time remain separate measurement obligations. Scaling does not reduce source triangle/accessor counts. There are no additional lights, flame meshes, particle systems or animation playback in this static evidence, and their eventual costs are not silently treated as zero.

## Provenance and reproducibility

KayKit assets retain the CREDITS.md CC0 attribution for the corresponding dungeon/furniture, Halloween and Medieval Hexagon packs. Yumi brazier, inscription lectern and Amberfall crystal streetlamp retain their exact CREDITS.md project-generated Tripo prop attribution and project-only reuse; they are not CC0. The rug recipe is project source under the root MIT code license. Retained GLB bytes are the measurement source, without claims to reconstruct unavailable historical raw generator inputs.

| Item ID | Source SHA-256 |
|---|---|
| `freehold_weapon_rack` | `ce9c93a09a5c961a49cef4e723dbb14458dbf2634e77a265e73fae139f0c9f18` |
| `freehold_iron_brazier` | `d40737b062f86859806b6e3aacb89924fbd0a3773a714ba8c747077da2efacbe` |
| `freehold_patchwork_rug` | `ebdf851444eea5b1ed93ec824bdd159006a68150f1793a8c387728bcda848472` |
| `freehold_hide_armchair` | `e69174fcb023d1a4198eb7e6c8f85c6ba0f13bd8cd74fb3901243522e97ae444` |
| `freehold_clockwork_lamp` | `bd3aaea19a21580e7d04ebee72fc9723380da8c8f23a5514a31122e570b3c890` |
| `freehold_glass_floor_lamp` | `bd3aaea19a21580e7d04ebee72fc9723380da8c8f23a5514a31122e570b3c890` |
| `freehold_chart_easel` | `9561ddd05b882b23e7d23a94ab9f11ff43171674c7256d89345b5cb4d2441416` |
| `freehold_jewel_floor_lamp` | `0bc09ff610e99db7df715dbf5101e8517fd7e8d0278e2372755475be797c446f` |
| `freehold_set_supper_table` | `48463d0766272e0dd22f2d76bc19f03837b51c57396e68bf209ca66e77cfc308` |
| `freehold_glow_lantern` | `bd3aaea19a21580e7d04ebee72fc9723380da8c8f23a5514a31122e570b3c890` |

Reproduce from the worktree root:

```sh
node scripts/freeholds/crafted_geometry_measure.mjs > /tmp/crafted-geometry.json
cmp docs/freeholds/crafted-content-trial-2026-09-07/geometry-measurements.json /tmp/crafted-geometry.json
npx vitest run tests/freehold_trial_geometry.test.ts
```

The measurement command passed twice with byte-identical output. All ten containment and quarter-turn assertions passed; the shared arithmetic suite passed 12 tests. Biome passed after formatting the two new scripts. [geometry-validation.json](geometry-validation.json) records exact commands, outcomes and artifact seals. The parent owns the contribution gate and records any broader checks separately.

The diagnostic command is `node scripts/freeholds/crafted_geometry_inspection.mjs <existing-glb-path> <diagnostic-png-path>`. It projects existing geometry only. The retained diagnostics correspond respectively to the exact source paths in the mapping table, without model transformation or new mesh generation.

Proposal SHA-256: `d944116ea84fedc226635cb74fa5c6dadccca531622439f8b47e84e2d2e6825f`. Measurement SHA-256: `c340590e9b89415432f7c0712dacfea273486d3cc42b20900f1ae0004336a8c8`. Tool versions, producer hash, arithmetic source hashes, proposal hash and retained-source seals are in the JSON. The producer snapshots each input once and checks unchanged bytes before emitting evidence.

## Acceptance scope and unchanged release gates

Fernando may accept these exact source mappings, household transformations, ten derived footprint/radius/cost rows and the declared proxy gaps as DEVELOPMENT TUNING. Acceptance is presently null. ART/CORE owns model/room reconciliation, CONTENT/ART owns decor calibration, and Fernando owns development acceptance. This proposal supersedes no signed production artifact.

Acceptance does not sign final MEASURE-SPACE room modules, polygons, doors, arrival corridors or packing; it does not sign CAL-DECOR production costs or LOW performance. It does not activate acquisition, spending, recipes, placement, progression or paid products. Shipping GLBs, distinct craft art, final model fingerprints, final emitter residency and limits, maximum legal room-layout captures and LOW-device evidence remain mandatory before their existing gates can close.
