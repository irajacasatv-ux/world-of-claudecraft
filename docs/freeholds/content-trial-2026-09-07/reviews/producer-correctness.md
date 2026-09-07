# Trial producer correctness review

Scope: `scripts/freeholds/economy*`, `scripts/freeholds/geometry*`, their two focused tests, and the matching retained trial artifacts under `docs/freeholds/content-trial-2026-09-07/`. Baseline: parent checkpoint `6e08300223`; new files were inspected from the shared working tree. Review date: 2026-09-07.

Read-only audit. I did not run either producer, Vitest, a shared gate, or runtime acceptance tests. Parent reports both measurement commands exited 0, economy 5 tests passed and geometry 6 tests passed. I inspected the code, parsed retained evidence, compared hashes to current source bytes, and viewed the diagnostic lantern image. Numeric runtime admission still awaits the user's concrete approval; that is not counted as a defect in the proposal.

## Findings

### F1. P2, seal the geometry bytes that were actually measured

Files: `scripts/freeholds/geometry_measure.mjs:18`, `:26`, `:77`, `:133`, `:220`.

`measureGlb` decodes `source(path)` and later calls `seal(path)`, which itself independently reads the file once for length and again for its hash. Proposal/source witnesses and the final input list are also reread independently. A file change while asynchronous GLB decoding is pending can therefore produce measurements of old bytes accompanied by the new file's hash; even a seal's byte length and hash need not describe the same buffer. The same provenance weakness applies to the reconstructed rug's full-source seal. This matters in this shared worktree, where producer evidence is explicitly an acceptance artifact and other owners are editing inputs concurrently.

The retained geometry artifact currently matches every inspected source hash, so I am not alleging corruption in the present snapshot. The generator does not guarantee the provenance it claims on a future run.

Requested fix: read and cache one immutable buffer per source, parse/decode and hash that same buffer, and reject source drift before emitting the finished artifact. Add a small can-fail source-drift fixture through the actual producer helper. The economy driver's captured esbuild inputs plus end-of-run drift checks demonstrate the intended standard without requiring its bundler architecture here.

### F2. P2, the rug source-change guard accepts geometry changes it ignores

Files: `scripts/freeholds/geometry_measure.mjs:110`, `:119`, `:135`; related coverage `tests/freehold_trial_geometry.test.ts:86`.

`measureRug` checks only that the current function contains three old snippets, then constructs a hardcoded `PlaneGeometry(8, 26)` and fixed rotation/lift itself. For example, adding `rug.scale.x = 2` to the real `buildRug` leaves all three snippets present. The producer would still measure the old width, but record the new function SHA and report the exact guarded source recipe. An additional geometry transform or position mutation has the same failure mode. This is a false-negative in the explicit 'source changed; review' guard, not a request to execute arbitrary renderer code.

The current real function is exactly the simple recipe described, and the retained rug measurements agree with that current recipe. The issue is that the evidence producer silently accepts a changed source it no longer reproduces.

Requested fix: execute the isolated source factory through a controlled measurement seam, or validate the entire recognized source function against its explicit accepted source identity before using the matching recipe. Reject any unsupported source shape. Add a mutation fixture that changes geometry while retaining the three existing snippets and prove the guard fails. Keep the transparent-overdraw and no-GLB boundaries explicit.

Findings total: 2. No additional nits. Both need repair and fresh review before this producer slice is considered complete.

## Positive correctness evidence

### Economy execution and accounting

- `economy_measure.mjs` actually bundles `economy_replay.ts`; its esbuild loader seals the exact compiled input buffers. It checks every recorded source and HEAD again before writing output. It records source commit, Node version, source graph hash, whole-measurement hash and per-fixture hashes, with null approval fields and productionApproved false.
- The retained evidence has 14 nonempty observations, 12 bills and 8 vendor rows. Its byte SHA is `e6e6c4334999835f30c8f81735ef113de328a23948ff77531247a123d272204d`, matching the proposal document. Its declared measurement SHA is `7da54311c24cbd73d5f185b74964076e78cde232f08e3aee05f68d5604c208d2`.
- `economy_harness.ts` and `economy_replay.ts` drive actual Sim gathering/corpse/farm/fishing entry points, `updateCasting`, and `drainGatheringGrants`. They do not replace live yield tables with a spreadsheet model. Setup tool/seed/proficiency grants, teleports, dead-corpse fixtures, perfect fishing reeling, injected visits and the restricted tick surface are all disclosed. `REFERENCE_FARMER.visitsPerDay` actually supplies the inherited two-visit cadence; applying bed-count attempts to other gathering sources is clearly a new laboratory proposal.
- The first admitted fishing shore probe remains the first measured catch. Failed shore probes remain in the action trace. The producer preserves real bags and does not clear them to boost output; the hide fixture records 56 attempts, one failed final attempt and 115 ordinary hide units. Signed/windfall materials, specimens, husks and off-lineage outcomes do not inflate the eligible baseline. Crop preparation time is separate from the week, final replants are not credited as output, and seed purchases are explicitly unmeasured.
- The prose does not claim an observed player cohort, weekly player hours, real travel/combat cost, or accepted market prices. Per-line eligible grade units are combined only within their own resource line. Cross-family totals are separately labelled NPC-base-floor copper sensitivity, never a substitute market normalization. Fine substitution is one unit-vector payment choice, not an added second charge.
- Across the retained 12 bills, the exact set of `(family, materialTier, alternativeId, gradeIds)` tuples equals the captured 18-row approved eligibility inventory. Every bill has three distinct families with produce first. No protected keystone or quickening ID appears. Captured material comparators are junk, without noTrade or soulbound flags. Existing base-before-fine order is retained. Hide/cloth sharing of the ordinary source across two material-tier rows is explicit, not an invented new grade.
- `roundTrialUnits` implements positive half-up rounding, retains raw values and rejects a result below one. The examples are substantive: node 55 -> 6, crop 291 -> 29, eel 12 -> 1. Per-line achieved shares and the aggregate half-unit sensitivity bound expose the integer effect; no tolerance is claimed approved. The finite twelve-row cycle is not represented as a twelve-week prepay entitlement.
- Vendor 250 buy / 60 sell / common comes from the real sellable Linen Pouch tuple; no resale-derived retail multiplier is invented. The eight-piece 2000-copper comparison is the real Traveler's Knapsack buy value. The ore-sale equivalent uses upward whole-unit rounding, `ceil(250/4) = 63`, while retaining the measured 55-unit source output and 140 cast seconds. It is explicitly gross sale capacity, not net profit or a promised acquisition time.

### Geometry and derived costs

- Seven actual retained GLBs and the project rug recipe are the explicit temporary sources. The proposal makes its new choices visible: floor-tile quartering, household bookshelf half-scale, lantern two-thirds of the existing placement scale, and rug tile span. Existing prop URL mappings and scale witness strings are checked. Final Freehold assets are not claimed to exist.
- The decoder traverses the active default scene, composes each node's world matrix and measures each transformed vertex. Skins, morph targets and nontriangle primitives refuse. The installed gltf-transform `Accessor.getElement` implementation decodes normalized integer positions, so the use of encoded POSITION attributes is correct. `propAsset` follows the same conceptual node-transform, X/Z centering and floor-seating order; the listed mapped prop definitions have no extra yaw/strip transform to silently omit.
- The current retained geometry artifact has 8 rows, all with positive finite footprints and true vertex-envelope/solid-radius containment results. Quarter-turn footprints swap width/depth. Its current source/input hashes all match disk. Its byte SHA is `aa3e35884452ff6c2b228c439ee731daf5fddace19bd213601aae3a16d8bc8f1`.
- The pitch is derived from an actually measured 2-unit floor tile divided by the proposed four subdivisions. Bounds/radii round outward without hiding codec overhang in an epsilon. Solid radial containment is based on maximum transformed vertex distance, which also encloses triangle interiors; the rug is the only walk-through row and retains the explicit 0.02 floor lift.
- Costs `[4,2,1,1,1,1,3,8]` match the positive ceiling of the maximum chair-relative triangle/primitive/material/decoded-accessor-byte ratio. The sum is 21, so the full vendor set does exceed the Inn's 20-point budget as disclosed. The 5880/17640 triangle envelopes follow mathematically from 20/60 times the 294-triangle reference and do not assert that those layouts physically fit.
- Source accessor bytes and encoded texture payload bytes are distinguished from actual GPU residency/frame time. Renderer splitting, mip formats, transparent overdraw, room polygons, door/arrival paths, legal maximum packing and LOW device measurements remain explicitly unmeasured. No hidden claim of final MEASURE-SPACE or production CAL-DECOR acceptance was found.
- The viewed diagnostic image is a low cage lantern with cap and ring, matching the accompanying description. Its flat shading is clearly disclosed and does not claim final brass materials or new generated shipping art.

## Source freshness and test coverage boundaries

The economy evidence is a correctly identified snapshot of the source bytes captured during its run, but the current shared worktree now differs in five recorded sources: `docs/freeholds/content-completion-checklist-2026-09-07.md`, `src/sim/content/freehold/furnishings.ts`, `src/sim/content/freehold/index.ts`, `src/sim/content/freehold/ledger_schedule.ts`, and `src/sim/data.ts`. This is expected concurrent implementation activity, not an extra finding against the captured run. Before final acceptance sealing, rerun and compare the actual observations/rows, or explicitly document a reviewed evidence carry-forward. Do not merely replace hashes around old results: the harness constructs real Sims, so changed initialization/content can affect observations.

The five economy tests exercise rounding, unusable observations, resale comparators and an exhaustive synthetic alternative cycle. The six geometry tests exercise transforms, containment, rounding, rug normalization and comparative costs. These are meaningful arithmetic tests, but they do not execute either complete producer or inspect the full retained artifact corpus. The parent-run producer exit codes and this actual corpus inspection supply separate evidence. F1/F2 require focused source-sealing/source-change regression fixtures; later runtime reviews must separately pin the admitted actual item/schedule/page records and D3/D85 behavior.

Pending numeric acceptance is honest and expected. Final runtime correctness, item/vendor/Hearth obligations, production signatures, shipping models, later room/performance measurements and the four-week report are outside this bounded review.
