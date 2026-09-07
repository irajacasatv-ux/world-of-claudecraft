# Development geometry and decor proposal

Status: concrete measured proposal, pending Fernando's acceptance. Production is
disabled and no approval is recorded. This document covers MEASURE-SPACE and the
vendor subset of CAL-DECOR-A/B. It supplies development item fields without claiming
approved Freehold rooms, final furnishing GLBs or a production performance result.

## Proposed rows

Dimensions below are transformed X width, Y height and Z depth in existing world
units. Display decimals are abbreviated; use the complete numbers in
[geometry-measurements.json](geometry-measurements.json). Footprints are integer
cells at the proposed 0.5-unit pitch. Radii and dimensions are different measures:
the solid radius encloses every transformed vertex, including the corners.

| Item ID | Proposed scale | Measured width x height x depth | Footprint | Radius | Decor cost |
|---|---|---|---|---:|---:|
| `freehold_timber_bed` | 1.15 | 2.300140 x 1.725263 x 3.450000 | 5 x 7 | 2.5 | 4 |
| `freehold_round_table` | 1.25 | 2.404081 x 1.249985 x 2.483825 | 5 x 5 | 1.5 | 2 |
| `freehold_spindle_chair` | 1.3 | 0.975058 x 1.594457 x 0.975058 | 2 x 2 | 1 | 1 |
| `freehold_low_stool` | 1.2 | 0.900000 x 0.600037 x 0.900000 | 2 x 2 | 0.5 | 1 |
| `freehold_woven_rug` | X 0.25, Y 1, Z 2/13 | 2 x approximately 0 x 4 | 4 x 8 | 0 | 1 |
| `freehold_brass_lantern` | 1 | 0.639985 x 0.925192 x 0.639985 | 2 x 2 | 0.5 | 1 |
| `freehold_storage_chest` | 1.2 | 2.040000 x 1.560099 x 1.734937 | 5 x 4 | 1.5 | 3 |
| `freehold_open_bookshelf` | 0.7 | 2.800000 x 2.099893 x 0.384533 | 6 x 1 | 1.5 | 8 |

The existing bookcase's library placement scale of 1.4 produced a 5.6-unit width
and 4.20-unit height. That is a large hall object. The proposal explicitly halves
that scale for household development use, preserving its geometry and source
identity. No final art or household scale approval is implied. The retained chest
scale is also large, approximately as tall as the chair back. Its complete size
is presented for acceptance rather than silently reduced.

The rug uses the project's existing processional plane recipe, transformed to
one by two measured floor tiles, giving a normal rectangular room rug. The new
tile span is proposed tuning. It is not inferred from icon pixels. The original
0.02-unit floor lift is retained. The recorded approximately 1.59e-15 Y extent is
the actual Float32 rotation residue, not a guessed thickness or hidden epsilon.
Its `r: 0` comes from the approved underlay class. Every other row remains solid.

## Source mapping and identity

The seven GLBs are existing KayKit assets covered by the current dungeon/furniture
attribution to Kay Lousberg under CC0 1.0 in `CREDITS.md`. They are third-party assets already present
in the repository, not project-authored final Freehold models. The rug recipe is
project-authored source under the root MIT code license. No file in `public/` was
generated, edited, exported or re-registered by this evidence work.

| Item suffix | Exact measured source | Renderer identity |
|---|---|---|
| `timber_bed` | `public/models/dungeon/bed_b_single.glb` | `PROP_ASSET_DEFS.kcasBedSingle` |
| `round_table` | `public/models/dungeon/table_round_medium.glb` | `PROP_ASSET_DEFS.kcasTableRoundMedium` |
| `spindle_chair` | `public/models/dungeon/chair.glb` | `PROP_ASSET_DEFS.kcasChair` |
| `low_stool` | `public/models/dungeon/stool_round.glb` | `PROP_ASSET_DEFS.kcasStoolRound` |
| `woven_rug` | `src/render/rift_decor.ts::buildRug` | Existing guarded `PlaneGeometry(8, 26)` recipe, no GLB |
| `brass_lantern` | `public/models/dungeon/lantern_standing.glb` | Existing gatehouse placement at 1.5; proposed two-thirds multiplier returns it to authored unit scale |
| `storage_chest` | `public/models/dungeon/chest.glb` | `PROP_ASSET_DEFS.kcasChest`, closed default pose only |
| `open_bookshelf` | `public/models/biome/kcas_bookcase.glb` | `PROP_ASSET_DEFS.kcasBookcase` |

The complete GLB SHA-256 seals are below. The rug source-file and exact guarded
function hashes, tool versions, other source hashes and per-primitive matrices
are retained in the machine-readable measurement artifact.

| Item suffix | Source SHA-256 |
|---|---|
| `timber_bed` | `f6bf2a03818e67675f74906694cdb0ee0df88e3bf15248aff2663bbe132d3fc8` |
| `round_table` | `f538fa2d74c5ad9db9b944556643da72f0a0a585d15182d56dbf3585f8e2cc73` |
| `spindle_chair` | `e69174fcb023d1a4198eb7e6c8f85c6ba0f13bd8cd74fb3901243522e97ae444` |
| `low_stool` | `dee35142402c3cc2de412eb646e248e980fc84f5299f8790eb22f3f31f5dbf61` |
| `brass_lantern` | `bd3aaea19a21580e7d04ebee72fc9723380da8c8f23a5514a31122e570b3c890` |
| `storage_chest` | `3883d220e77bfc7d40e5821b1e2cdadc27b206b5a7430d58ee1303643c8f1ace` |
| `open_bookshelf` | `195c23e42038f4caa5c143dccaccf5c2fada9255274e76ccac25395435fedec6` |

The [lantern geometry inspection](geometry-lantern-inspection.png) confirms a low
framed cage with a broad cap and top ring, rather than a tall pole lamp. It uses
diagnostic flat shading, not the source material or a promised final brass
finish. Reproduce it with `node scripts/freeholds/geometry_lantern_inspection.mjs`.

## Measurement and derivation

`node scripts/freeholds/geometry_measure.mjs` prints the reproducible evidence.
The tool decodes the existing compressed GLBs using the installed, pinned
gltf-transform and meshoptimizer libraries. For every active default-scene mesh
primitive it records decoded local accessor bounds, the complete parent-composed
node matrix, and bounds measured from the individually transformed vertices.
It refuses skinned models, morph targets and non-triangle primitives. It measures
the chest's closed default pose; no interaction or animation is reused.

For GLBs, the proposed normalization matches `src/render/props.ts::propAsset`:
apply the authored node matrix, center the combined X/Z extent, and subtract
minimum Y. Then apply the explicit proposed scale. Existing instance yaw and
world translation are excluded because item-local yaw zero and origin are the
catalog measurement basis. Existing location/scale witnesses are literal rows
from `src/render/lastkeep_dressing.ts`, sealed and checked by the tool. The new
bookcase multiplier and rug transform are separately declared in the proposal.
The lantern's existing gatehouse placement is in
`scripts/assets/battleground/dressing.mjs`; its proposed two-thirds multiplier
returns the low cage to its authored unit scale. The retained GLB bytes are the
measurement sources. Historical raw pack inputs are not present and are not
claimed as reconstructed first-party asset-generation provenance.

The reference `floor_tile_small.glb` measures exactly 2 units along X and Z.
The proposed grid divides that module into four cells per side. Footprint width
and depth are `ceil(measuredExtent / pitch)`. Solid radius is the maximum actual
transformed vertex distance from the centered X/Z origin, rounded upward to the
next grid-pitch multiple. There is no rounding down or epsilon forgiveness for
small codec overhangs. The record retains exact unused envelope and circle space.
Every row proves its vertex containment and the exact quarter-turn footprint.

The grid is an explicit development lattice. It does not establish the coarsest
compatible grid for an unbuilt Freehold room. The interior owner must reconcile
the actual room modules, polygons, anchors and protected paths before placement
activation. Item containment on an open lattice is not a doorway, arrival-path
or full legal-room-layout test.

## Comparative decor costs

The proposed reference unit is one mapped chair. Its source has 294 triangles,
one primitive, one material and 8,342 decoded accessor bytes. Each item's proposed
cost is the positive integer ceiling of the greatest ratio to those four chair
metrics. The rug remains budgeted even though it is walk-through. Source metrics
remain unchanged when a model is scaled.

| Item suffix | Triangles | Primitives | Materials | Decoded accessor bytes | Encoded embedded texture bytes |
|---|---:|---:|---:|---:|---:|
| `timber_bed` | 1108 | 1 | 1 | 26460 | 27841 |
| `round_table` | 506 | 1 | 1 | 11668 | 27841 |
| `spindle_chair` | 294 | 1 | 1 | 8342 | 27841 |
| `low_stool` | 268 | 1 | 1 | 6821 | 27841 |
| `woven_rug` | 2 | 1 | 1 | 140 | 0 |
| `brass_lantern` | 264 | 1 | 1 | 5978 | 27828 |
| `storage_chest` | 728 | 2 | 1 | 20020 | 24520 |
| `open_bookshelf` | 2212 | 1 | 1 | 64336 | 27841 |

This is a comparative static-geometry method, not calibrated GPU milliseconds.
Encoded texture bytes and hashes are retained separately. Identical texture
payloads may share residency, while actual GPU formats, mip retention, material
splitting, shadow passes and the rug's transparent overdraw require the later
renderer/LOW capture. Neither encoded texture size nor accessor bytes are
mislabelled as actual total GPU residency.

Under the approved Inn/Cottage decor budgets, positive unit costs bound mutable
copy counts by 20 and 60. For this vendor subset, the proposed method also bounds
source triangles by 5,880 and 17,640 respectively, before physical placement
constraints. These are mathematical envelopes, not constructed legal rooms or
performance captures. One of every vendor furnishing costs 21 points, so that
combination exceeds the Inn's budget. The budget is not raised to make it fit.
Future crafted content and fixed dressing require their own inventory and costs.

## Owner decisions and activation boundaries

| Decision for Fernando | Concrete proposal |
|---|---|
| Development model identities | Accept the exact seven credited existing GLBs plus the existing flat rug recipe as temporary readable sources; final GLBs remain mandatory before shipping |
| Household size | Retain the five listed existing furniture scales, use authored unit scale for the lantern, half the existing library scale for the bookcase, and one-by-two floor tiles for the rug; chest dimensions are intentionally exposed above |
| Trial placement arithmetic | Accept 0.5-unit cells derived by quartering the measured existing floor tile, outward cell envelopes and outward pitch-rounded solid radii; preserve the rug underlay class |
| Trial decor method | Accept positive ceiling of the maximum chair-relative triangle/primitive/material/accessor-byte ratio; keep the approved room budgets unchanged |

Acceptance would admit these values as disabled development tuning fixtures only.
It would not sign final MEASURE-SPACE room geometry, CAL-DECOR production costs,
final models, maximum legal layout or LOW performance gates. ART/CORE owns room
and final model reconciliation, CONTENT/ART owns the resulting decor calibration,
and Fernando remains the approver. All affected item IDs are explicit above.

The parent ran `tests/freehold_trial_geometry.test.ts` successfully against the
arithmetic module. It covers composed transforms, corner containment, outward
rounding at a measured overhang, nonuniform underlay transforms, positive decor
ratios and rejected invalid inputs. The final measurement command is rerun after
the proposal and producer are frozen so the retained hashes cover the exact rows.
