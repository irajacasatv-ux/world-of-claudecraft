# Freeholds content source freeze, 2026-09-07

Status: evidence inventory only. No furnishing or Ledger numeric artifact is approved
by this record. Production furnishing acquisition and Ledger billing remain disabled. The exact known values
and missing producers below are intended for review; they do not authorize guessed
defaults or an unsigned content release.

## Evidence revision

Inspected checkout: `feature/freeholds` at
`3fa4965a3c186982aafd44b3ec9b9d9851ace52d`. The source hashes below identify the bytes
inspected, including working-tree files, before this record was authored. A later
source edit requires revalidation; a hash records provenance, not approval.

| Source | SHA-256 |
|---|---|
| `docs/freeholds/state.md` | `42e1b74088d560724ef56b169b9981c22b3b2f1df39e2c4c8cda43be89f2ed29` |
| `docs/freeholds/content-numbers-workbook.md` | `6b89444416733c15a9e0f4a869e1efbc9df688e63a21cbd4460ef1f981997499` |
| `docs/freeholds/content-manifest.md` | `c7ddc1a70d4511d47b03fb307edb4fafc940733d30b7a10b15edddcf53ef4fe0` |
| `docs/freeholds/art-brief.md` | `60b8f184a353adbb48605122ac0fcf02fd13ebad78de1baf5698a4ffe9957710` |
| `docs/freeholds/ruling-sheet.md` | `a4dabf9109594896c981ffdddb2459c5ed4ea379f3f5e3affbf702db068ec3e1` |
| `src/sim/types.ts` | `5bd5ee47b236f008a0c42a84c45db16a5c61aaa794db7f249305c2178e861dcc` |

The numeric workbook section F explicitly retains `UNSIGNED` for CAL-VENDOR-A,
CAL-DECOR-A/B and MEASURE-SPACE. Its opening contract allows disabled trial fixtures
only when their measured derivation is recorded. No per-item vendor acquisition
burden, approved geometry mapping or render-cost measurement was found for these
eight IDs, so this record supplies no trial buy/sell/quality/cost/bounds literals.

## Approved tier targets and their exact authority

The source is `state.md`, "Content numbers (approved working targets and measured
activation rows)", duplicated in numeric workbook section A. The approving artifact
is `ruling-sheet.md::R05` mapped to `state.md::D31`, under "Settlement decisions
approved 2026-09-06". That section names Fernando and records his response,
"approve all recommendations." R05 retains existing values as owner-adopted working
targets. `R07`/`D33` separately requires evidence and approval for absent numeric
outputs. These adopted targets are not measured furnishing costs or room geometry.

| Planned tier ID | Rooms | Decor budget | Plinths | Amenity slots | Upkeep | Derivation and rounding |
|---|---|---|---|---|---|---|
| `inn_room` | 1 | 20 | 3 | 0 | false | Direct adopted tier-0 row; no calculation or rounding |
| `cottage` | 1 | 60 | 4 | 1 | true | Direct adopted Cottage row and its weekly upkeep contract; no calculation or rounding |

Fernando owns these working capacity targets. Their approving day is the recorded
2026-09-06 R05 decision, and their exact source bytes are hashed above. No later
calibration or signature is claimed by this record. The Cottage's illustrative
fee does not enter a sim definition; the Charter allowlist carries the tier only.
Inn Room remains free with no upkeep. Cottage's `upkeep: true` describes the tier's
future billing eligibility, and does not provide an approved bill or activate a
charge. Room dimensions, plinth anchors and legal physical capacity remain subject
to MEASURE-SPACE and the relevant room/LOW acceptance.

## Ledger source freeze and pending CAL-LEDGER-A

The controlling approval is `ruling-sheet.md::R06`/`state.md::D32`, recorded in the
same 2026-09-06 Fernando decision. It approves one owner-independent published
schedule per realm week, produce in every bill, rotating permitted nonproduce
families, and the existing target of three to five material lines. It explicitly
requires Fernando/service approval of literal bills before enable. Workbook section
C supplies exact eligible item identities and base-before-fine order; sections D/E
supply the production method. Section F still marks CAL-LEDGER-A UNSIGNED.

| CAL-LEDGER-A field or gate | Known source or contract | Current exact result / missing evidence |
|---|---|---|
| Eligible family and grade identities | Workbook section C: ore, wood, herb, hide, cloth, fish and produce, with explicit source bands and real fine twins | Identity inventory can be authored; it is not a selected or quantified bill |
| Per-week and per-tier selected line IDs | Produce on every bill; no repeated family; allowed remaining families rotate | UNSIGNED exact bill rows, including each selected alternative |
| Per-line integer item units | Workbook sections D/E: measured per-resource output and an approved allocation vector | UNSIGNED raw results, integer vectors and measured yield observations |
| Allowed grades per selected line | The approved section C candidate lists preserve base-first preference; no invented fine hide, cloth or fish | UNSIGNED selected bill records and their explicit grade lists |
| Content version and cycle | Versioned finite cycle, exhaustive enumeration, immutable after approval | UNSIGNED actual content version, cycle length, ordered rows and content hash |
| Week identity and selection encoding | Planned key `(contentVersion, realmWeekAnchor)`; injected Tuesday realm-week semantics; independent of owner and shared sim RNG | UNSIGNED published schedule encoding and its fixture set; no current-date sampling or invented starting week |
| Allocation, normalization and tolerance | Actual per-resource yields; economy-service-accepted market snapshot for unlike-family comparison; explicit missing/stale-price policy | UNSIGNED allocation vector, market snapshot/version, burden tolerance and acceptance precision plan |
| Quantity rounding | Initial method: nearest positive whole unit, half upward; report raw and integer results and achieved target ratio | No input vector exists to round; UNSIGNED approved row-level results and pinned rounding evidence |
| Burden objectives | Existing working Cottage approximately 10% and Citadel approximately 20% of measured reference gatherer weekly output | Objectives only; no middle-tier curve, activity hours or equal-value resource sum is derived |
| All-cycle acceptance | Every selected ID resolves; produce always present; base-first order; all families reachable; no duplicate family or protected input; noncrafter acquisition; immutable bills | UNSIGNED operational cycle fixtures; eligible-ID tests alone do not satisfy this gate |
| Calibration report | Workbook section E requires actual cohort/replay provenance, yields and failures, activities and gaps, unit vectors, valued totals and the four-week report | No such measured report accompanies this source freeze |
| Approval | CONTENT produces with UPKEEP; Fernando and economy service approve exact literal bills | UNSIGNED approval identity/day for a concrete artifact version/content hash |
| Prepay | Approved initial capacity is four weeks; fixed approved vectors for each future week, summed without repricing | No prepaid bill can be authorized without the signed schedule |
| Twelve-week extension | Workbook section F requires the signed twelve-week CAL-LEDGER-A version and calendar-authority acceptance recorded in state before raising the default | UNSIGNED extension artifact and authority acceptance; the twelve-week target does not enable it |
| Second-home derivation | Adopted later rule `ceil(primaryUnits * 1.5)` for each approved integer line | No primary approved units exist, so no second-home values can be computed |

Every eventual bill row must record units, source revision, derivation, rounding,
fixture IDs, owner, approval identity/day, actual version/content hash, activation
gate and superseded version. A version attached to an eligible-ID registry is not a
CAL-LEDGER-A schedule version. No ready-to-spend schedule, quantities, prepay vectors
or operational bill lookup is produced here. The owning tables work can publish
eligible identities and an explicitly empty approved schedule surface without
inventing any missing number. Production upkeep remains closed until the signed
schedule and all applicable authority, replay, burden and release gates pass.

## Routine deed renown derivation

The Homesteader opener's renown uses an existing authored-content rule instead of
a new housing balance rate. `docs/design/deeds.md`, "Rules that bind every deed",
assigns routine deeds 5 renown. `src/sim/content/deeds.ts::DEEDS.prog_first_steps`
and `DEEDS.prog_talented` are literal routine first-action comparators: each uses
category `progression` and renown 5. The new `homesteader_first_furnishing` and
`homesteader_first_cottage` records use that category and renown value with the
manifest's `manual` trigger. Derivation is direct application of the routine scale;
there is no rounding or monetary value. Grant implementation remains with the
placement and confirmed Cottage-grant owners, respectively.

The manifest's Homesteader deed rows explicitly supply the reward forms:
`homesteader_first_furnishing` carries its title and
`homesteader_first_cottage` carries its border. Both retain the routine renown
value above and remain cosmetic only. The owning content/art work supplies the
complete reward registration and required art in the same change; neither reward
is omitted or treated as an unresolved product choice in this source freeze.

## Exact vendor roster and known fields

These are the approved planned rows from the content manifest, in its order.
`modelKey` below names the planned asset identity; it is not a member of the current
`FurnishingItemDef` TypeScript shape. Every row belongs to `hearth_basics`, uses floor
placement, and names `freehold_furnisher` as its eventual ordinary gold vendor.

| Item ID and planned model key | English name | Surface | Collision class | Additional fixed identity |
|---|---|---|---|---|
| `freehold_timber_bed` | Timber Bed | floor | solid, radius requires measurement | Broad headboard and folded cream quilt |
| `freehold_round_table` | Round Table | floor | solid, radius requires measurement | Open knee space and heavy rounded rim |
| `freehold_spindle_chair` | Spindle Chair | floor | solid, radius requires measurement | Tall narrow back |
| `freehold_low_stool` | Low Stool | floor | solid, radius requires measurement | Three legs and worn seat |
| `freehold_woven_rug` | Woven Rug | floor | walk-through underlay, `r: 0` | Flat woven border; still consumes decor capacity |
| `freehold_brass_lantern` | Brass Lantern | floor | solid, radius requires measurement | Floor-standing cage and warm core |
| `freehold_storage_chest` | Storage Chest | floor | solid, radius requires measurement | Decorative only; no bank or vault interaction |
| `freehold_open_bookshelf` | Open Bookshelf | floor | solid, radius requires measurement | Staggered books, open spaces and substantial sides |

The rug radius is a literal semantic rule in the manifest's record contract, not a
measurement inferred from an image. Its derivation is direct adoption of the explicit
walk-through-underlay class; rounding is not applicable. The approved packet is the
source of that class. All positive solid radii remain MEASURE-SPACE outputs.

## Per-item numeric readiness

`UNSIGNED` means no exact candidate value has a recorded derivation and approval in
the inspected evidence. It never means zero, a default quality or an optional field
that can be omitted to bypass calibration. Footprint width/depth are cell counts;
the room grid and the conversion from measured transformed geometry are themselves
MEASURE-SPACE outputs. No grid pitch or rounding policy is selected here.

| Item ID | Buy copper | Sell copper | Quality | Width cells | Depth cells | Radius | Decor cost |
|---|---|---|---|---|---|---|---|
| `freehold_timber_bed` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED |
| `freehold_round_table` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED |
| `freehold_spindle_chair` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED |
| `freehold_low_stool` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED |
| `freehold_woven_rug` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | 0, explicit underlay | UNSIGNED |
| `freehold_brass_lantern` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED |
| `freehold_storage_chest` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED |
| `freehold_open_bookshelf` | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED | UNSIGNED |

## Available comparators and absent measurements

The following inspected material values are concrete baseline evidence allowed by
the workbook. They do not establish a furnishing price, quality or acquisition
burden. In particular these material definitions are not vendor-stocked and carry
no `buyValue`; deriving a hypothetical retail price from their sell value would add
an unsupported economy rule.

| Source symbol and item ID | Existing quality | Existing sell copper | Permitted use |
|---|---|---|---|
| `src/sim/content/items.ts::BASE_ITEMS`, `copper_ore` | common | 4 | Material comparison input only |
| `src/sim/content/items.ts::BASE_ITEMS`, `ironbark_log` | common | 4 | Material comparison input only |
| `src/sim/content/profession_items.ts::PROFESSION_ITEMS`, `rough_hide` | common | 5 | Material comparison input only |
| `src/sim/content/profession_items.ts::PROFESSION_ITEMS`, `homespun_cloth` | common | 4 | Material comparison input only |

At the inspected checkout, these planned artifact files do not exist:

- `docs/freeholds/art/reference-manifest.md`, the actual per-reference admission and hashes.
- `docs/freeholds/art/space-measurements.json`, the transformed geometry, grid and collision evidence.
- `docs/freeholds/art/asset-budget-register.md`, the asset and maximum-layout cost evidence.

None of the eight planned `public/models/props/<item-id>.glb` files exists. Existing
dungeon bed and stool models are unrelated shipped assets: no approved mapping,
normalization transform or intended height connects them to these furnishing IDs.
Their bounds cannot substitute for the missing Freehold measurement rows. Newly
prepared item icons establish image identity only; pixels do not establish world
dimensions, collider radii, legal room packing or render costs for a shipping model.
The coordinator's [staged art provenance](content-art-2026-09-07/staged-art.json) and
[size review](content-art-2026-09-07/size-review.webp) record that work independently
and explicitly retain pending runtime item admission.

## Required producers and approval fields

| Artifact | Concrete producer output still required | Owner and approval |
|---|---|---|
| CAL-VENDOR-A | All eight literal buy/sell copper values and qualities; actual comparator rows; acquisition-burden evidence; derivation and any rounding; economy invariant fixtures | CONTENT produces; Fernando approval identity/day and the approved version/content hash remain UNSIGNED |
| MEASURE-SPACE | Approved model source per ID; raw/shipping bounds; normalization transform and intended world height; grid pitch and footprint conversion; solid radius or the declared underlay class; clearance and legal-placement fixtures | ART/CORE produces; actual geometry approval artifact and version/content hash remain UNSIGNED |
| CAL-DECOR-A/B | Positive integer decorCost per ID; shipping triangles, primitives, materials and residency; legal maximum-layout packing and LOW performance captures; measured derivation and rounding | CONTENT with ART produces; Fernando approval identity/day and the approved version/content hash remain UNSIGNED |

Each finished artifact must also record units, fixture IDs, activation gate and its
superseded version, following workbook section F. No approval identity, approval
date, measurement, tolerance or source revision is filled on behalf of an owner.
The artifact version and content hash must identify the actual approved literals.

## Safe implementation boundary

The current `src/sim/types.ts::FurnishingItemDef` requires `sellValue`,
`furnishing.footprint.width`, `furnishing.footprint.depth`, `furnishing.r`,
`furnishing.decorCost` and `furnishing.surface`. It forbids power/use/stack fields.
Although `buyValue` and `quality` are optional in `BaseItemDef`, the manifest and
CAL-VENDOR-A require approved explicit vendor values; optional typing is not numeric
approval. `src/sim/items.ts::buyItem` requires a live merchant stocking the item and
a valid price before ordinary copper acquisition succeeds.

No complete vendor furnishing definition can be built from the known fields above.
Consequently this source freeze adds no partial or cast `FurnishingItemDef`, merges
no furnishing into `src/sim/data.ts::ITEMS`, and adds no furnisher NPC, stock or spawn
predicate. Acquiring the planned furnishings stays unavailable for both values of
`freeholdsEnabled` until valid signed rows exist. The ordinary D85 dark-host rule
will still be required when activation is implemented; setting the feature flag
does not approve missing numeric sources.

The already approved Inn Room/Cottage capacity targets and a price-free Charter
allowlist can be authored independently. Eligible material identity tables can be
authored independently of unsigned bill units. Neither action authorizes furnishing
acquisition or invents a weekly bill. Runtime furnishing pages, shipped-item pins
and vendor source hints must wait for complete item definitions; a catalog must not
reference unimplemented IDs or make unobtainable furnishings affect completion.

Before adding the runtime furnishing rows, recheck every artifact above against all
eight IDs, preserve the exact approved underlay rule, and test ordinary purchase,
sell and custody behavior along with D85 off/on spawning. The coordinator owns the
shared same-change content, localization, art, catalog and final QA obligations.
