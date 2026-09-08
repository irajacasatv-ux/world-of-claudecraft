# Freeholds room, furnishing and trophy art brief

Status: approved, UNBUILT packet artifact. The answered R01 to R46 rulings and
final Codex artwork/legal handoff additions control this implementation contract.
This brief supplies direction, exact planned reference/asset inventories, owners and
acceptance. It is not a generated image, approved housing source sheet or completed
model. The existing DESIGN reference images are approved interface references; that
does not approve an unmade housing room or its model dimensions. No images or models
are produced in this audit.

[ux-spec.md](ux-spec.md) owns player goals, keyed copy, focus/input and interaction
states. [content-manifest.md](content-manifest.md) owns every approved furnishing and
trophy source. [content-numbers-workbook.md](content-numbers-workbook.md) owns measured
geometry, numeric provenance and unsigned calibration gates. [state.md](state.md)
remains the decision authority. Housing art must satisfy all four together.

Every asset-generating implementation file must run with Codex, not Claude. This
includes reference images, GLBs, item/pattern/dye icons, textures, room dressing
and replacement artwork in every wave. Follow the existing image generation and
image-to-GLB intake/export workflows. Final source approval, rights/provenance and
measured acceptance remain required for the actual generated assets.

## 1. The desired room

The player steps out of Eastbrook bustle into a small place that feels inhabited,
safe and personal. The hearth is the first compositional destination. Warm plaster
catches its light, dark timber gives the room a readable frame, and a cool window
edge recalls the world outside. The layout leaves a clear path to the fire and a
quiet space for the player's first chosen object. Accomplishments become the focal
points; purchasable trim does not overwhelm them.

The Inn Room and Cottage have equal artistic finish. The Inn is intimate, with a
made bed, carefully arranged light and three honest empty plinth locations. The
Cottage gives more space and customization with the same material quality, clear
circulation and composed views. The free room must never resemble a gray prototype
or a deliberately shabby advertisement for an upgrade. Default mounted-head art
appears only when account source evidence qualifies. An empty plinth is a welcoming
invitation, never a counterfeit first victory.

The room is memorable through proportions, workmanship and material grouping:
substantial joinery, small asymmetries, a well-used threshold, softly folded cloth,
a few books and stable silhouettes. Avoid random clutter, bright outline noise,
shiny plastic wood, all-over gold, a black cave on LOW, huge hero-asset furniture in
a tiny room, or elaborate decoration that makes the walking route ambiguous.

## 2. Existing approved references and current interface mapping

| Existing reference path | Observed contribution | Use and boundary |
|---|---|---|
| `docs/design/design-language/desktop-style-reference.png` | Warm Eastbrook plaster/timber, teal/red roofs, greenery, warm lantern pools; restrained dark panels with fine bronze/gold edges and cream labels | World/chrome mood and material grouping; illustrative image text is never copied |
| `docs/design/design-language/desktop-approved-layout-reference.png` | Open world center, restrained edge panels, map and compact utility rail; luminous reward card as limited accent | Housing palette leaves the room visible; do not build a fullscreen showroom for ordinary placement |
| `docs/design/eastbrook-vale-rebuild/imagegen-prompts.md` | Existing generation specification format | Reference-generation authoring recipe, not automatic approval of new images |
| `docs/design/eastbrook-vale-rebuild/imagegen-provenance.md` | Recorded image authorship, rights and source trail | Provenance record shape; every new sheet needs its own row |
| `docs/design/eastbrook-vale-rebuild/img2threejs-intake.md` | Existing staged image-to-model evidence | Intake and review example; never skip a new family's intake |
| `docs/image-to-glb-asset-workflow.md` | Export, optimize, serialize-and-preview, fingerprint and in-game proof | Pipeline contract; current local render/preload rules override historical eager-preload wording |

`DESIGN.md` is the adopted UI target. The shared foundation is not shipped at the
inspected tree: current classic `theme.ts` colors and Cinzel display font differ
from adopted target colors and Alegreya typography. Housing consumes the actual
shared `.window.panel`, bags/bank, plant-sheet, action-bar and Reliquary families.
11 checks coordinated foundation readiness and records its current token mapping;
it cannot implement an isolated replacement theme. The nonexistent reverted
`window_frame.ts` is not a reusable family. The current/adopted exact token values,
motion timings and contrast targets are recorded in state Content numbers. World
material color is distinct from interactive UI theme color; a parchment/high-contrast
UI still frames the same warm home without recoloring gameplay validity states.

## 3. Material and color board

19 DRESSING owns one neutral-lit semantic material board with each swatch labelled
by material role, source reference, color space, vertex color/albedo value and shader
family. A generated picture's baked shadow/highlight is not extracted as an albedo
map. The reference sheet fixes the visual relationship; the exporter authors honest
material values and proves them under both Standard and Lambert rendering. All
numeric material values are signed measured art fields, not arbitrary packet RGB.

| Material family | Visible treatment | Where it repeats | LOW and tint contract |
|---|---|---|---|
| Warm plaster | Cream midtone with restrained uneven grain and darker seam contact | Inn/Cottage walls and chimney breast | Preserve warm midtone without AO; broad value grouping remains visible |
| Dark timber | Warm brown, legible bevels, large joint rhythm, grain along the beam | Structural frame, bed, table, shelves and display stands | Never crush to uniform black; matched vertex colors under Lambert |
| Hearth stone | Warm-gray stone blocks, softened worn edges and visible mortar | Hearth, floor-edge anchors, plinth base | Geometry and material boundaries read without normal maps |
| Iron and aged brass | Matte iron with local warm brass highlights, restrained contrast | Handles, hinges, lamps, brazier, tools, trophy supports | No mirror finish required; silhouette remains readable without specular |
| Quiet cloth | Cream, muted red, teal and subdued green accents; believable fold weight | Quilt, rug, chair, curtain and runner | Large stitches and borders survive distance; dye masks never touch validity UI |
| Parchment/books | Warm page value, broad ruled detail and muted covers | Bookshelf, chart easel, scroll stand, provenance display | Art uses no illegible pseudo-player text or spoiler map labels |
| Glass/jewel | Protected colored core with a substantial metal/support frame | Alchemy/jewel lamps, chandelier, terrarium | Opaque/low-cost presentation keeps form when transmission/reflection is absent |
| Cool window edge | Restrained blue daylight complement to hearth warmth | Window surround and nearby surfaces | Time continuity changes grade without making night unreadable |
| Greenery/produce | Botanical variety from the actual crop identity and a muted leaf family | Kitchen tableau, basket, terrarium, later garden projection | Inert decor never imitates harvest readiness or new interactive beds |

Default room color gives the eye a warm center, quiet edges and a cool exterior
reminder. The approved reference's red/teal accents are small visual anchors, not
instructions to paint every furnishing a different saturated color. The eight
approved dyes in the content manifest reuse this material-role palette. 41 produces
the exact neutral-lit dye swatches, names, channel masks and item icon references;
no dye modifies trophy proof, source difficulty, rarity or placement feedback. The
dye picker is enabled by the home station amenity of type apothecary: no new amenity
kind, no extra slot and no dye station GLB (D90), so the only dye art is the swatch
and channel-mask board below.

## 4. Room geometry, circulation and authored vistas

06 INTERIOR owns the measured room/layout file and collision-safe camera geometry;
19 DRESSING owns the finished shapes and their measurement updates. Both consume the
same MEASURE-SPACE record before placement or final art activates. Grid, dimensions,
clearance, room floor height, sockets and transformed bounds are numeric measurement
outputs, not values selected from this diagram.

```text
INN ROOM, composition only             COTTAGE, composition only
+-------------------------+           +-------------------------------+
| cool window   bed       |           | window     hearth      window  |
|                         |           |    display focus / hearth view |
| plinth   hearth  plinth |           | plinth                   plinth|
|                         |           |                               |
|    clear arrival view   |           |      furnishing negative space |
|                         |           |                               |
| door -> clear path      |           | personal bank     station slot |
|                 plinth  |           | door -> clear route            |
+-------------------------+           +-------------------------------+

Door, arrival, hearth, roof/walls and structural sockets are fixed.
Movable furnishings occupy only the approved measured placement area.
```

The Inn bed is part of the authored welcome dressing and does not secretly consume
the player's purchased furniture or grant a tradeable copy. Buying a Timber Bed
creates an ordinary owned furnishing with normal custody. Distinguish fixed dressing
from the pickable palette with cursor/affordance semantics, not a hidden exception.
The three Inn plinths are empty until actual eligible trophies are selected. The
Cottage's personal Strongbox is built-in personal-bank access, outside the amenity
slot budget. Its station slot is an intentional space, not another storage chest.
Direct Materials Vault chest access is the later Manor unlock; nearby decorative
chests must not imply that authority exists earlier.

Leave a guaranteed route from arrival to door, hearth, Strongbox and available
station. A player filling the entire legal decor budget cannot wall off the exit or
arrive inside a furnishing. Fixed structural dressing cannot be picked up, rotated,
hidden through placement tricks or used to invalidate this route. Tabletop supports
and fixed-ceiling sockets enter with the advanced editor; no Wave A lamp or trophy
requires a ceiling or wall. Ceiling fixtures never intersect the head/camera space.
Rugs are flat walk-through underlays with measured visible footprint; they may sit
under valid furniture but never erase that furniture's collision or cost.

Authored views must work from the actual chase camera, detached build camera and
compact touch composition. At arrival, the door frame gives a brief threshold view
of the hearth and first display. Turning toward the window reveals the quiet color
edge and larger personal decorating area. A return view toward the door remains
recognizable. Keep tall furniture out of protected view/camera volumes. Occluder
fade uses the existing gated fade lifecycle and a stand-in, never a first-frame
transparent-material flip. Reduced motion keeps the same usable visibility without
spatial flourish.

## 5. Arrival, hearth and sound direction

At the Eastbrook gate, one authored sign/door landmark is visible from ordinary
approach and the existing map marker family. Interaction opens own-home/friend
choice; proximity never teleports. A successful authoritative entry aligns the
arrival pose and camera facing before movement input is sampled. The short optional
hearth view uses the shared camera-director envelope and measured safe path. Input
cancellation resumes control immediately while the existing director release blends
its camera offset; reduced motion uses the static safe pose. Never transplant the
long outdoor first-spawn sweep into the Inn Room. Structural preparation owns the
arrival cover. Online entry adds no cosmetic settling wait; delayed decoration
keeps its truthful prepared stand-in rather than blocking an otherwise safe entry.

File 08a's NEW nullable freshArrivalPresentation is the only fresh presentation
permission, as specified in UX. New accepted owner and visitor arrivals can carry
ordinary keyed welcome feedback. Only a committed 07c account-tier insert winner
on a new owner transition can carry firstTierViewEligible for the optional camera.
Historical eligibility, repeated paint, snapshot, replay and resume never remint
either cue or first-tier view, even on a new client. A commit-before-ACK crash may
skip presentation; the design promises no exactly-once visible or audible output.
The cue follows the sanctioned sampled SFX pipeline.
06/07c/08a/09/11 own the entry event, safe composition and cue consumption; 09 owns NEW
`GameAudio.playHousingArrival` and sampled `housing_arrival` through the sanctioned
authoring/manifest pipeline. File 19 consumes that output and owns final room mix,
integration, provenance and conformance evidence. No anonymous audio URL, oscillator
shortcut or raw English line enters the renderer. Cue duplication on snapshot replay,
reconnect or cosmetic model load is a failure. Sound-off remains fully comprehensible.
The UX spec is the exact key/copy owner.

Hearth appearance is an honest condition projection from Wave A: warm working fire
when maintained, visibly quieter/duller below the existing amenity threshold, with
an unchanged understandable room at zero. A candle/hearth appearance can change
cosmetically, but source/account condition never depends on the effect frame rate.
Show the actual condition and explanation in Steward; a dim scene alone is not a
mechanic explanation. No burning eviction notice, collapse crack, countdown threat
or pay-or-lose visual. Later trophy finish wear refines this behavior; it does not
postpone basic condition feedback until 23. The Steward's fireplace-shaped condition
emblem (ux-spec section 5) is a procedural `src/ui/ui_icons.ts` svgIcon recipe owned
by 16 as deliberately final SVG art: it is not a raster asset, needs no reference board
in section 8, and 44a's inventory records that explicit final-art verdict.

Indoor daylight follows the realm's existing time grade. Night retains the hearth
composition and readable circulation. Lighting change cannot hide ghost footprint,
blocked hatch/reason, floor boundary, budget state or any admitted visitor.

## 6. Lighting budget and LOW finish

Three authored housing point-light emitters is the existing proposal ceiling, not
three guaranteed live contributors. Their semantic priority is hearth, practical
work/read light, and optional ornamental accent. Register requests through
`src/render/point_light_budget.ts` and the existing light sink. All placed lamps
compete within that shared allocation; never instantiate an unlimited light per
furniture copy. Boot-owned directional, hemisphere, spot and rect-light counts stay fixed. The
existing scheduler may allocate and retire budgeted point lights through 09; the
point-light lifecycle is permitted by that boot-rig invariant. Regrade the existing sun/hemi
through the approved interior lighting seam instead of adding another sun or ambient
light after boot.

The inspected `src/render/gfx.ts` iOS profile can admit two points; live pressure may
leave one effective contributor. Existing interior state rig application also omits
LOW on this tree, so 09/19 explicitly implement and test the LOW material/grade path.
The fallback is designed, not merely the high-tier room with its lights deleted:
plaster midtone, hearth-colored material, directional value separation, readable
floor/door edges and substantial prop silhouettes remain. The one-contributor image
must still look like a warm home. Ornamental glass and jewel forms stay attractive
through opaque/shared Lambert treatment when high-tier reflection/emission detail
is unavailable.

Every material/texture/scene attach is a preparation-scheduler client. Use
`surfaceMat`, immutable shared loaded assets, deferred world preloads, gated scene
attach/reveal, and retained representations while linking. Add actual gate sites and
stand-ins to `ENTITY_GATE_STAND_INS` when applicable. No new queue, secondary preview
context or uncached material per instance without the existing integration contract.
The ready/blocked placement visual has an immediate inexpensive geometric fallback
that preserves identical validity, hatch/reason and bounds on every preset while
richer models prepare. UI blur, particles, bloom, pulsing and ambient motion may shed;
validation truth and visible participants may not.

## 7. Furnishing and trophy family art contract

All exact furnishing IDs, sources and surfaces are in the content manifest. The
family is coherent without being identical: vendor pieces are practical joinery;
crafts show their makers through method and materials. Weaponcrafting has bracket
and tool forms; Armorcrafting has broad rivets/iron construction; Leatherworking has
stitched tension and soft seats; Tailoring has woven rhythm; Engineering has housed
mechanisms; Alchemy has protected glass; Inscription has framed/parchment structure;
Jewelcrafting has set facets in substantial supports; Cooking has a believable table
and produce composition; Enchanting has quiet held light with a stable support.

The A Jewel Floor Lamp is explicitly floor-supported. The B Jewel Chandelier uses
fixed-ceiling sockets and remains unavailable until advanced placement works. The A
Chart Easel is freestanding; the B wall chart is the actual wall piece. A mounted
head sits on a freestanding framed display in floor-only A, with later typed wall
support if authored. Every lamp has geometry that makes its placement support clear.
The Set Supper Table is inert decor; the later usable feast surface invokes the
existing feast mechanic separately without new housing power.

Trophies deserve more sculptural care than arbitrary loot clutter. A plaque has
clear border, inset field and honest source icon; a named source statue preserves
the creature's defining silhouette; an armor stand shows actual qualified pieces;
a weapon rack uses the actual owned appearance; the Legend Stand places its named
work and maker context in a quiet readable frame. The model is not a giant embedded
English paragraph. Public provenance text appears through the keyed UI projection,
with scene labels only through existing localized label rendering if necessary.

Normal/heroic/S-rank identity has silhouette/trim/mark redundancy alongside
bronze/silver/gilded finish. Do not imply a global S-rank unlock gilds unrelated
boss statues. All-source Wave A generic displays are final authored art, not missing
model placeholders: they truthfully display every qualifying source while 23 adds
the specialized forms listed in the manifest. Unknown historical dates stay unknown;
hidden source placeholders reveal no future encounter through their model or icon.
Every qualified source is free and never sold; a reference sheet is never proof of
qualification. Owner/guest screenshots must show matching public provenance.

The Kitchen Garden tableau in 24 uses the account owner's safe farm projection,
independent of the inert Cooking furniture copies. Its art never reveals an alt's
identity, hidden survival/proficiency inputs or an unexposed timer. A saved remote
source remains visibly saved even if the host derives its stage from the committed
snapshot; unavailable coverage is not an empty garden or a ready harvest. Only the
current-generation local authority can supply a live source. Guests inspect this
safe decor, while the owner can separately open the current character's private
Harvest Journal. Reuse normal localized crop/Journal identities and the UX source
state contract; no plant animation predicts readiness or implies remote tending.

## 8. Exact planned reference and evidence inventory

Every path in this section is NEW planned output unless labelled existing. 19's art
lead owns the rights/intake ledger and keeps the brief/content roster in sync. It
records generator/request, source refs and rights, creation day, image hash,
identity-critical observations, operator approval or rejection and approved revision.
A source is admitted only after the operator approves that actual generated/reference
sheet. No inferred prior approval. Rejected images remain outside runtime assets.

| Exact planned path or deterministic expansion | Subject / producing owner | Required evidence before model work |
|---|---|---|
| `docs/freeholds/art/references/freehold-material-board.png` | Semantic neutral-lit material board, 19 DRESSING | Explicit material roles, approved warm/cool balance, Standard/LOW intent |
| `docs/freeholds/art/references/eastbrook-home-gate.png` | Gate/door approach and map-marker relation, 06 INTERIOR / 19 DRESSING | Reachable site, safe interaction and neighboring Eastbrook fit |
| `docs/freeholds/art/references/inn-room-roomboard.png` | Inn plan, arrival/hearth/door/window views, 06/19 DRESSING | Equal finish, fixed starter bed, honest empty plinths, measured safe circulation |
| `docs/freeholds/art/references/cottage-roomboard.png` | Cottage plan and matching views, 06/19 DRESSING | Built-in Strongbox, station slot, decorating negative space and camera safety |
| `docs/freeholds/art/references/freehold-basics-board.png` | All eight A vendor pieces with readable identity, 19 VENDOR | Each exact manifest ID labelled, matching silhouette/detail views |
| `docs/freeholds/art/references/freehold-crafted-a-board.png` | All ten A craft pieces, 19 CRAFTED | Stable floor support and distinct craft workmanship; exactly three pattern outputs |
| `docs/freeholds/art/references/freehold-trophies-a-board.png` | Final generic plaque variants, source medallion on plaque, stand plaque, paddock marker and qualified head families exactly as the content manifest's Wave A generic display column lists them (no bust form), 19 TROPHIES | All-source truthful display; hidden silhouette; no false trophy default |
| `docs/freeholds/art/references/freehold-dressing-board.png` | Hearth, door, structural kit, plinth, Strongbox and station anchor family, 19 DRESSING | Fixed/movable visual distinction and measured sockets |
| `docs/freeholds/art/references/freehold-crafted-b-board.png` | Exact twenty B outputs, 22 ART | Wall/table/fixed-ceiling surfaces and two Cooking produce outputs inside twenty |
| `docs/freeholds/art/references/freehold-trophies-b-board.png` | Every specialized family from manifest section 23 inventory, 23 TROPHIES | Creature/item likeness, truthful difficulty and real source coverage |
| `docs/freeholds/art/references/freehold-guildhall-board.png` | Meeting Hall/Great Hall/Bastion, feast/war/muster boards, member plinths and project vendors; 28 room, 30 amenity, 30a board, 31 guild-trophy, 32 tier and 32a project/vendor ART | Same material family at social scale; authorized board interaction; final wave C forms |
| `docs/freeholds/art/references/freehold-ward-board.png` | Neighborhood square, approved exterior forms, guild anchor, doors and showcase display, 34/35/36 ART | Measured capacity footprint; sightlines; every admitted player visible |
| `docs/freeholds/art/references/freehold-depth-board.png` | Keep/Fortress/Citadel and later layout surfaces, 40/42 ART (no dye station model: D90) | Preserved character, no unexplained new material theme; measured large-tier limits |
| `docs/freeholds/art/references/freehold-dye-board.png` | Exact eight approved dye swatches and channel masks, 41 ART | Neutral-lit values, approved names, LOW and color-vision readability |
| `docs/freeholds/art/references/<model-key>-turnaround.png` | Each exact furnishing model and each specialized/dressing model's admitted detail reference | Named owner of corresponding family; front, side, rear/three-quarter, support/underside where needed |
| `docs/freeholds/art/reference-manifest.md` | Complete rights/admission/hash manifest, 19 ART lead and every later extension owner | Every referenced file resolves; approval is explicit per source revision |
| `docs/freeholds/art/space-measurements.json` | MEASURE-SPACE exact room/model transform/bounds/socket/camera records, 06/19/25/34 CORE/ART | Machine-readable geometry fixtures and source hashes, no guessed dimensions |
| `docs/freeholds/art/asset-budget-register.md` | Per-asset and maximal legal layout budget record, 19 lead; 22/23/28/34/40 extend | Measured comparative baseline, chosen contract, signature and rejection boundary |

A contact board establishes family consistency, but a tiny object inside it is not
an adequate model reference. Each item must have sufficient admitted individual
views for its identity-critical features before export work. Turnaround expansion
is exact: every model key in the content manifest produces its own named file if
the contact image alone fails intake. The manifest records whether a shared family
view or that exact turnaround is the admitted source for each key.

## 9. Export, optimize, fingerprint and runtime asset inventory

The implementing art session uses the repository's image-to-GLB skill and the current
img2threejs intake gates. This packet does not waive suitability/rights/approval,
sculpt-spec or validation gates. Read the actual installed skills and
`scripts/assets/CLAUDE.md` before choosing exporter details. Existing batch exemplars
are `scripts/assets/farm_props/` and `scripts/assets/eastbrook_town/`; the mailbox
family is the small-asset exemplar. Use one disjoint family owner and let the art
lead integrate common registry/spec/media changes after every family reports.

| NEW family directory | Exact output contract | Producing implementation and parsed-GLB test |
|---|---|---|
| `scripts/assets/freehold_basics/` | Eight `public/models/props/<item-id>.glb` from manifest vendor table | 19 VENDOR; `tests/freehold_basics_asset.test.ts` |
| `scripts/assets/freehold_crafted/` | Ten A crafted GLBs, later twenty B GLBs by exact item ID | 19 CRAFTED / 22 ART; `tests/freehold_crafted_asset.test.ts` extended deliberately |
| `scripts/assets/freehold_trophies/` | Shared A generic models plus every approved specialized family model | 19/23/31/32a/36 ART; `tests/freehold_trophies_asset.test.ts` |
| `scripts/assets/freehold_dressing/` | Fixed room/door/hearth/plinth/Strongbox/station and each later tier/ward form | 19/28/30/30a/32/34/40/41 ART; `tests/freehold_dressing_asset.test.ts` |

Each family produces `model.js`, `export_entry.js`, an explicitly named family export
driver, `source_fingerprint.mjs` and an owned spec under `scripts/assets/specs/`.
Exact planned driver/spec pairs are `export_freehold_basics.mjs` /
`freehold_basics.json`, `export_freehold_crafted.mjs` / `freehold_crafted.json`,
`export_freehold_trophies.mjs` / `freehold_trophies.json`, and
`export_freehold_dressing.mjs` / `freehold_dressing.json`. The spec preserves required
extras/sockets. Model keys and source references are enumerated in the spec before
building. Temporary intake/raw GLBs/previews stay under the implementing session's
`tmp/` until evidence selection; approved required reference provenance is retained.

Static dressing keys are planned `freehold_inn_shell`, `freehold_cottage_shell`,
`freehold_hearth`, `freehold_entry_door`, `freehold_plinth`,
`freehold_personal_strongbox` and `freehold_station_<stationType>` for the exact
existing supported station types. Later layout keys append their actual approved
tier ID; 28/32/34/40 must enumerate that finite key set before their art build and
update the same registry/fingerprint coverage. A decorative storage chest is the
separate furnishing ID, never the Strongbox adapter. Family source meshes name
semantic systems and `Socket_*` anchors; +Z faces front, floor seating uses the
shared measured interior height, and X/Z centering follows the runtime normalization
contract. Parent surfaces and collider envelopes use transformed shipping bounds.

Choose per-asset triangles, primitives, materials, textures, byte limits and total
maximal-layout costs from measured source exemplars before building. The banker
chest's verified 2,048 triangles (pinned in tests/render_glb_replacement_assets.test.ts)
and the mailbox's 1,640 (tests/eastbrook_mailbox_asset.test.ts) are comparator
observations, not universal housing budgets. Other counts and bytes are re-read from current pins
at the art session. Prefer shared vertex-color material buckets and existing shared
surface atlas treatment where it fits. A unique texture set or extra preview context
requires a measured need and its own scheduler/residency proof, never an aesthetic
assumption. No stand-in is a permanent exemption from the final art gate.

The family driver proves deterministic repeat export. Export raw GLBs, run the shared
optimizer through `scripts/assets/build_assets.mjs`, inspect and validate BOTH raw
and shipping serialized artifacts, and preview each from front, side, three-quarter
and grazing angles. Compare against the admitted actual image with critical-feature
scores required by the installed intake skill. Do not invent or lower that skill's
threshold. Rework a failed silhouette, support, material separation or socket; never
re-pin its failure as accepted. The parsed GLB test records exact bytes/hash, actual
triangles/primitives/materials, vertex payload, texture/skin/animation contract,
meshopt/extension contract, bounds/sockets and live source fingerprint.

Fingerprint inputs include actual authoring code, exporter/spec/shared helpers,
reference images, relevant atlas, shared optimizer and `pnpm-lock.yaml` as the
current contract requires. A fingerprinted input change requires deterministic
re-export, media regeneration and reviewed pins. A fingerprint-only rebuild that
changes size is investigated before any pin update. Register every GLB in the media
manifest, furnishing/trophy registry and tier-independent DEFERRED world preload.
Use immutable shared loader assets, `surfaceMat` conversion and scheduler gates.
Every body hidden during preparation retains a truthful stand-in. Renderer
coordinators stay within their verified monolith budgets.

Item icons are separate exact `public/ui/items/<item-id>.webp` paintings with
`public/ui/items/mapping.json` provenance, including every pattern and dye ID, under
the actual `woc-item-icon-v1` style. Icons show the real item, not an unrelated reused
inventory image or a cropped illegible room view. Gold/rare marks and ownership
badges remain UI layers. English names, M16 fills where wordy, shipped-ID append pins,
Hearth pages, wiki/guide and entity-name obligations land with the content row.
Rights/CREDITS and reference/provenance updates land with the art, in its authorized
implementation session.

## 10. Per-wave final-art release gates

| Wave close owner | Required final inventory | Required proof before enable/release |
|---|---|---|
| A, 20 | Both finished rooms and gate, all eighteen furniture GLBs/icons, three pattern icons, all-source generic trophy families, fixed dressing and readable ghost | Desktop/compact/tablet UX matrix; actual LOW iOS two/one contributor fallback; doorway/camera/placement witness; no production stand-ins |
| B, 27 | Lodge and exact twenty additional furniture outputs, six pattern icons, specialized trophy forms, Kitchen Garden tableau and advanced supports | Typed floor/wall/table/fixed-ceiling scenes, parent/undo atomicity, all-source/difficulty/provenance/hidden-source proof and max-layout LOW |
| C, 33 | Meeting Hall/Great Hall/Bastion art, boards, feast and bank/station access, member and guild trophies, project/vendor art | Officer/member/guest view differences; crowded admitted-player visibility; final social-room composition and numeric/perf register |
| D, 39 | Ward exteriors/square, shared guild anchor, Endeavor and Showcase displays/guestbook presentation | Measured ward occupancy and sightlines, all admitted players visible on LOW, privacy/opt-in/source correctness |
| E, 44 | Keep/Fortress/Citadel, the eight dye swatches and channel masks (no dye station GLB, D90), later layout/second-home visuals | Largest legal furnished space/layout storage/perf proof, no incomplete sold content, every new ID final art and signed measurements |

A staged family may use registered readable stand-ins during development while its
feature remains disabled. Any missing reference, invalid source approval, failed
round-trip/model proof or missing final art blocks that family's content activation
and its wave close. The gate records exact affected IDs, accountable producer and
failed evidence; it does not leave an unowned "artist decides later" task. 20 creates
the every-second-release budget review artifact with matched LOW evidence. No review
cadence automatically increases a player's capacity or degrades the quality bar.

### Final Codex artwork inventory and legal evidence

[44a, final Codex artwork](phase-44a-final-codex-artwork.md) runs with Codex after
the ordinary wave gates. It inventories every feature-created placeholder icon and
image across all waves, including content/item/pattern/dye art, room or store imagery,
trophy/board illustrations and later social surfaces. Each inventory row records
its consumer, source approval, final asset, registration, rights/provenance and
before/after acceptance. Replace every such placeholder with finished Codex artwork
using the established style; retain stable gameplay IDs and readable UI overlays.
A declared temporary model stand-in must also have its already-required finished
registered GLB before its content can ship. Final closeout cannot waive or delay an
earlier family's asset-generation, reference, GLB or activation gate.

Verify the final registered assets in real desktop, compact and tablet scenes and
LOW, including the approved reduced-light phone cases. Rebuild media/icon mappings,
source fingerprints, provenance/CREDITS and affected asset pins through their normal
producers. The screenshot inventory in UX remains the exact Wave A contract (seven
registered targets, 339 variants); a later art owner that needs changed-surface
evidence registers its target and variants in ux-spec section 11 and regenerates
ux-shot-manifest.json in the same change, never captures under an unregistered alias
and never substitutes concept art for in-game proof (U3 F4).

[44b, final legal handoff](phase-44b-final-legal-handoff.md) then revisits Terms,
listings, surface restrictions, service contracts and artwork rights/provenance
against the completed implementation. It produces the final legal-team evidence
package in NEW `docs/prd/woc/freehold-final-legal-handoff.md`, with exact revision
and sign-off tracking. Earlier legal/platform release
gates remain in force. Producing the handoff is distinct from an external message
or release approval.

## 11. Visual and technical acceptance evidence

The exact screenshot registry entries and state list live in UX and the owning
06/09/11/16/17/18 implementation files; the seven Wave A targets are registered
by their functional producer, and a
later wave extends the registry before it captures. Art acceptance includes desktop,
compact and tablet views (compact/tablet baselines are Chromium with iOS-profile
emulation); empty,
ready and blocked palette/ghost with hatch/reason; explicit Inn/Cottage day/night; maximum furniture/plinth budget;
condition at/under the real threshold; owner-building visitor view; actual item and
provenance display; reduced motion; current shared theme variants; and lowest phone
lighting/material profile. Touch captures show the entire UI so safe areas and
Confirm/Rotate/Cancel remain inspectable. Keyboard and gamepad captures preserve the
same selected object/action rather than a mouse-only mockup. Inspect real live scene
states, not pasted UI or concept renders.

Run the family's parsed-GLB tests, content/icon/provenance/fingerprint obligations,
render preload/compile/stand-in/light-budget guards and relevant camera/placement
fixtures. Capture the actual touched interiors/ward through `npm run perf:tour` and
`node scripts/gpu_hitch_capture.mjs`; inspect live-program, timeout, residency and
CPU construction evidence. `npm run asset:budget` reports aggregate and added cost;
if a pre-existing aggregate ceiling is already red, record exact baseline/delta and
the measured family acceptance, never claim a global pass. Screenshots do not prove
SFX, permissions, custody or two-client fanout: retain separate audio conformance,
authority/restart tests and real owner/guest integration evidence. The shared gate
and relevant content/render/frontend/security/DB reviewers remain mandatory under
the canonical QA matrix for each actual implementation diff. In particular, the
35/36 reward/prop producers require render-performance-reviewer alongside content
review, with changed-prop preparation, retirement and measured LOW/performance proof.
