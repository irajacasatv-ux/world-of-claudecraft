# Freeholds content manifest

Status: approved, UNBUILT packet artifact under the answered R01 to R46 rulings and the
round-2 dispositions D76-D93 (R47-R64, applied as recommended and approved on 2026-09-06).
Existing source IDs below were inspected at 7d140843d2. Every
`freehold_` ID, housing page ID, asset filename and recipe named as planned below is
NEW work. No housing item, reference approval, art or gameplay implementation is
claimed here. The locked decisions in [state.md](state.md) control activation. All quantity and price fields use [content-numbers-workbook.md](content-numbers-workbook.md).

The roster is deliberately exact: Wave A has eighteen furnishings, eight vendor
basics plus one output from each existing craft. Its three pattern recipes teach
three of those ten outputs. Wave B adds twenty outputs, two per craft; its two
produce displays are inside the twenty. Farming remains a gathering profession.
This resolves proposal section 13's approximate twenty, without adding unlisted
content. Names are approved planned generic English names. The content/art author owns the
same-change originality check before authoring shipping item names, including
exact-phrase and coined-token searches under `src/sim/content/CLAUDE.md`. A planned
name is not evidence of that check.

## Record and ownership contract

Each table row expands into a complete planned record. For suffix S, the item ID is
`freehold_S`, recipe ID is `recipe_freehold_S`, model key is `freehold_S`, shipped art
is `public/models/props/freehold_S.glb`, and item icon is
`public/ui/items/freehold_S.webp`. These deterministic expansions name exact NEW
filenames, not wildcard delivery. Pattern rows additionally produce
`pattern_freehold_S`, its matching `.webp`, and the teaching recipe reference; no
pattern is an extra furniture copy. A housing label resolves the canonical localized
item name, never a second untranslated name embedded in a painter.

The table's owner column owns data, acquisition, icon/provenance, item-name keys and M16
fills where required, wiki generation and guide text, shipped-ID golden additions, Hearth
page membership, Book of Deeds records for every new piece of conquerable content
(docs/design/deeds.md, pinned by tests/deeds_content.test.ts), power-neutral/exclusion
tests, and acquisition/market pins in the SAME content change. The art owner owns the
model, measured bounds, collision record, fingerprint, model-registry/prewarm row and
screenshots. Implementation stand-ins must be declared and readable; final GLBs and icons
are mandatory at the closing gate for the wave that ships the ID. Every file generating
these assets, including content-owned icons, must run with Codex, not Claude, using the
established image/model pipelines. See [art-brief.md](art-brief.md). The additional final
[44a Codex artwork closeout](phase-44a-final-codex-artwork.md) inventories and replaces
all feature-created placeholder icons/images across every wave; it does not defer these
same-change or per-wave obligations. Its completed provenance accompanies the [44b
legal-team handoff](phase-44b-final-legal-handoff.md).

All movable Wave A items use floor placement. Tables gain measured parent surfaces
only when the advanced editor lands. Rugs have required `r: 0` and explicit underlay
semantics, never an invisible wall; solid furniture still uses measured collision
and protected door/arrival clearance. Fixed bed/hearth/door dressing is independent
of purchasable vendor copies. Every furnishing is tradable by its actual per-copy
custody rules and carries no stat, aura, experience, gathering, drop or food effect.
A decorative chest never opens bank or vault storage. The built-in Strongbox has
personal-bank authority only and costs no amenity slot; each usable station does.

## Wave A vendor basics

The planned Eastbrook furnisher stock contains these eight IDs, priced in ordinary
gold through the signed content worksheet. The source entity's planned ID is
`freehold_furnisher`, bound to an authored reachable Eastbrook fixture in 03/06.
Names and accessibility text resolve through normal entity/item localization.
All rows belong to planned page `hearth_basics` on the NEW Hearth shelf.

| Exact planned item ID | Planned English name | Source/channel | Placement | Art and icon suffix | Visual identity | Same-change owner / final art |
|---|---|---|---|---|---|---|
| `freehold_timber_bed` | Timber Bed | `freehold_furnisher`, gold vendor | floor | `timber_bed` by expansion above | A broad headboard, folded cream quilt and restrained carved corner | 03 CONTENT / 19 VENDOR |
| `freehold_round_table` | Round Table | `freehold_furnisher`, gold vendor | floor | `round_table` by expansion above | Open knee space and a heavy rounded rim | 03 CONTENT / 19 VENDOR |
| `freehold_spindle_chair` | Spindle Chair | `freehold_furnisher`, gold vendor | floor | `spindle_chair` by expansion above | Tall narrow back; recognizably different from the stool | 03 CONTENT / 19 VENDOR |
| `freehold_low_stool` | Low Stool | `freehold_furnisher`, gold vendor | floor | `low_stool` by expansion above | Low three-legged silhouette and a worn seat | 03 CONTENT / 19 VENDOR |
| `freehold_woven_rug` | Woven Rug | `freehold_furnisher`, gold vendor | floor underlay | `woven_rug` by expansion above | Flat woven border, warm cloth field and walk-through underlay | 03 CONTENT / 19 VENDOR |
| `freehold_brass_lantern` | Brass Lantern | `freehold_furnisher`, gold vendor | floor | `brass_lantern` by expansion above | Floor-standing cage and small steady warm core | 03 CONTENT / 19 VENDOR |
| `freehold_storage_chest` | Storage Chest | `freehold_furnisher`, gold vendor | floor | `storage_chest` by expansion above | Decorative chest with plain clasp; no bank interaction | 03 CONTENT / 19 VENDOR |
| `freehold_open_bookshelf` | Open Bookshelf | `freehold_furnisher`, gold vendor | floor | `open_bookshelf` by expansion above | Staggered books, readable negative space and substantial sides | 03 CONTENT / 19 VENDOR |

## Wave A crafted furnishings

The ten craft IDs are the existing `src/sim/content/professions.ts::CRAFT_RING`
IDs. The recipe owner preserves `STATION_TYPE_BY_CRAFT` and explicit recipe station
binding, including forge for jewelcrafting, apothecary for inscription and toolworks
for enchanting where the shipped recipe family supplies it. Seven rows are taught
by the existing corresponding trainer. Engineering, inscription and jewelcrafting
are the three Marks-only patterns; their prefixes reuse the shipped Schematic,
Technique and Design contract. Every recipe's literal bill, skill band and quality
must be signed in the numeric worksheet before that row can activate. Every
ProfessionRecipeRecord balance field is in that rule, itemLevelBudget (the required
craft gold-sink driver) and skillReq included; the values live in the workbook's
CAL-RECIPES-A row.

| Exact planned item ID | Planned English name | Existing craft / recipe source | Channel | Surface | Art/icon suffix | Identity and constraints | Same-change owner / final art |
|---|---|---|---|---|---|---|---|
| `freehold_weapon_rack` | Weapon Rack | `weaponcrafting`; `recipe_freehold_weapon_rack` | trainer | floor | `weapon_rack` | Empty freestanding rack, never claims weapon ownership | 04 CONTENT / 19 CRAFTED |
| `freehold_iron_brazier` | Iron Brazier | `armorcrafting`; `recipe_freehold_iron_brazier` | trainer | floor | `iron_brazier` | Raised iron bowl; ornamental emitter request only | 04 CONTENT / 19 CRAFTED |
| `freehold_patchwork_rug` | Patchwork Rug | `tailoring`; `recipe_freehold_patchwork_rug` | trainer | floor underlay | `patchwork_rug` | Broad sewn cloth panels, no collision obstacle | 04 CONTENT / 19 CRAFTED |
| `freehold_hide_armchair` | Hide Armchair | `leatherworking`; `recipe_freehold_hide_armchair` | trainer | floor | `hide_armchair` | Soft hide sling, dark timber arms and visible stitching | 04 CONTENT / 19 CRAFTED |
| `freehold_clockwork_lamp` | Clockwork Lamp | `engineering`; `recipe_freehold_clockwork_lamp` | Marks only | floor | `clockwork_lamp` | Weighted base, exposed winding detail and sheltered light | 04 CONTENT / 19 CRAFTED |
| `freehold_glass_floor_lamp` | Glass Floor Lamp | `alchemy`; `recipe_freehold_glass_floor_lamp` | trainer | floor | `glass_floor_lamp` | Amber glass vessel in a floor-supported protective frame | 04 CONTENT / 19 CRAFTED |
| `freehold_chart_easel` | Chart Easel | `inscription`; `recipe_freehold_chart_easel` | Marks only | floor | `chart_easel` | Freestanding parchment chart, never leaks hidden map content | 04 CONTENT / 19 CRAFTED |
| `freehold_jewel_floor_lamp` | Jewel Floor Lamp | `jewelcrafting`; `recipe_freehold_jewel_floor_lamp` | Marks only | floor | `jewel_floor_lamp` | Faceted jewel in a stable floor-supported metal setting | 04 CONTENT / 19 CRAFTED |
| `freehold_set_supper_table` | Set Supper Table | `cooking`; `recipe_freehold_set_supper_table` | trainer | floor | `set_supper_table` | Inert table setting and cloth, no food charge or Well Fed | 04 CONTENT / 19 CRAFTED |
| `freehold_glow_lantern` | Glow Lantern | `enchanting`; `recipe_freehold_glow_lantern` | trainer | floor | `glow_lantern` | Soft glow within a substantial floor-supported open cage | 04 CONTENT / 19 CRAFTED |

All ten belong to planned page `hearth_first_crafts`. The three exact pattern IDs
are `pattern_freehold_clockwork_lamp`, `pattern_freehold_chart_easel` and
`pattern_freehold_jewel_floor_lamp`. Their acquisition is Heroic Quartermaster
Marks stock only in Wave A, with no raid, rift, delve or heroic-dungeon luck channel.
They are tradable recipe items with `sellValue: 100`, verified against the current
`src/sim/content/apex_patterns.ts` and `src/sim/content/farm_patterns.ts` contract.
The Marks amount remains the signed worksheet's content output. Pattern quality is
derived from the final output definition; no invented independent rarity.

## Wave B crafted furnishings and pattern channels

These twenty rows are NEW outputs, not replacements for Wave A. `raid + Marks`
means one named Nythraxis final-boss housing tail group on the existing base loot
source `nythraxis_scourge_of_thornpeak` (a NEW partitioned rollGroup `nythraxis_housing`
appended BELOW `nythraxis_farm`; the existing groups gain no row), plus the deterministic
Heroic Quartermaster stock row. `rift + Marks` means one NEW appended draw at the end of
the existing winning B/A/S clear-tail seam (addRiftClearGearLoot in
src/sim/rift/progression.ts, a Draw 8 over a NEW sorted exported
HOUSING_RIFT_PATTERN_ITEM_IDS at the signed chance; the existing RIFT_PATTERN_ITEM_IDS
and FARM_RIFT_DROP_ITEM_IDS lists are never edited), plus that stock row. Every pattern
belongs to exactly one luck channel.
Housing adds no delve channel or heroic-dungeon channel. Channel odds and Marks
amounts are worksheet outputs, never copied from the unrelated apex rates.

| Exact planned item ID | Planned English name | Existing craft | Channel | Surface | Art/icon suffix | Identity and constraints | Hearth page | Same-change owner / final art |
|---|---|---|---|---|---|---|---|---|
| `freehold_wall_weapon_rack` | Wall Weapon Rack | `weaponcrafting` | raid + Marks | wall | `wall_weapon_rack` | Horizontal brackets, empty of unowned weapon appearances | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_hearth_tool_stand` | Hearth Tool Stand | `weaponcrafting` | trainer | floor | `hearth_tool_stand` | Tongs and poker on a safe stable stand | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_armor_display_stand` | Armor Display Stand | `armorcrafting` | rift + Marks | floor | `armor_display_stand` | Decorative empty support; actual armor display belongs to trophy records | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_riveted_screen` | Riveted Screen | `armorcrafting` | trainer | floor | `riveted_screen` | Open iron fretwork, readable safe collision silhouette | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_stitched_hide_rug` | Stitched Hide Rug | `leatherworking` | trainer | floor underlay | `stitched_hide_rug` | Supple hide panels, never a false slain-creature trophy | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_high_back_chair` | High Back Chair | `leatherworking` | trainer | floor | `high_back_chair` | Broad stitched back and a comfortably recessed seat | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_woven_curtains` | Woven Curtains | `tailoring` | rift + Marks | wall | `woven_curtains` | Cloth tied to fixed window-side anchors; no structural window movement | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_embroidered_runner` | Embroidered Runner | `tailoring` | trainer | table | `embroidered_runner` | Flat textile parented to measured tabletop | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_pendulum_clock` | Pendulum Clock | `engineering` | raid + Marks | floor | `pendulum_clock` | Clock face and housed pendulum; reduced-motion still pose | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_brass_weather_instrument` | Brass Weather Instrument | `engineering` | trainer | table | `brass_weather_instrument` | Cosmetic tabletop instrument with legible mechanical forms | `hearth_workshop` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_dyers_jar_set` | Dyers Jar Set | `alchemy` | trainer | table | `dyers_jar_set` | Sealed color jars; visual decor, separate from functional dye recipes | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_glass_terrarium` | Glass Terrarium | `alchemy` | trainer | table | `glass_terrarium` | Inert miniature greenery with protective glass frame | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_framed_wall_chart` | Framed Wall Chart | `inscription` | rift + Marks | wall | `framed_wall_chart` | Authored spoiler-safe map composition and broad wood frame | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_reading_scroll_stand` | Reading Scroll Stand | `inscription` | trainer | floor | `reading_scroll_stand` | Open scroll and floor stand; no arbitrary player text | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_jewel_chandelier` | Jewel Chandelier | `jewelcrafting` | raid + Marks | fixed ceiling | `jewel_chandelier` | Pinned ceiling socket and short jewel drops; advanced placement prerequisite | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_gem_inlay_side_table` | Gem Inlay Side Table | `jewelcrafting` | trainer | floor | `gem_inlay_side_table` | Small table with embedded jewel band, no free-floating gems | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_harvest_display_basket` | Harvest Display Basket | `cooking` | trainer | floor | `harvest_display_basket` | Produce display made with existing produce; no new farm bed | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_garden_marker_tableau` | Garden Marker Tableau | `cooking` | trainer | floor | `garden_marker_tableau` | Produce crate and garden markers as one inert furnishing output | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_votive_light_pedestal` | Votive Light Pedestal | `enchanting` | trainer | floor | `votive_light_pedestal` | Stone pedestal with steady decorative light core | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |
| `freehold_bound_orb_stand` | Bound Orb Stand | `enchanting` | trainer | floor | `bound_orb_stand` | Suspended-looking orb attached to an explicit floor stand | `hearth_table_and_light` | 22 CONTENT/ART; 25 advanced-surface gate |

Exact later pattern IDs are `pattern_freehold_wall_weapon_rack`,
`pattern_freehold_armor_display_stand`, `pattern_freehold_woven_curtains`,
`pattern_freehold_pendulum_clock`, `pattern_freehold_framed_wall_chart` and
`pattern_freehold_jewel_chandelier`. Each creates its own icon and provenance row.
The table names every channel now. The six patterns are the approved R12/R27
roster choice, not a claim that the original proposal fixed six. Remaining Wave B
recipes are trainer taught. No new acquisition gate may be improvised by 22.

Wall, tabletop and fixed-ceiling items remain acquisition/placement gated until the
25 advanced-editor acceptance passes; a player is never sold an unusable chandelier
under a floor-only editor. A canary data record can exist with disabled acquisition.
The cooking basket and marker tableau consume approved existing produce through
ordinary Cooking recipes. They do not create beds, alter survival/growth, remotely
harvest, or teach Farming. Kitchen Garden projection in 24 is separate from these
inert owned copies. It extends 17's NEW
`server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage` and
`server/freehold_account_sources.ts::createFreeholdAccountSourceLoader` to aggregate
the account owner's farm sources through the same bounded cache and invalidation.
Only a current-generation local authoritative farm-and-skill slice is live; it
replaces the whole corresponding saved slice, including a confirmed empty slice.
Remote/nonlocal committed snapshots remain explicitly saved even when the host
farm clock derives their stage. Incomplete/unavailable sources never imply no farms,
readiness or live changes. Public rows expose only opaque visual identity, bed/crop,
stage/status and truthful source freshness, never source character/account/realm,
hidden skill/survival inputs, raw timers/flags or whole farm views. The owner's
Journal action stays current-character private; guests inspect the safe owner tableau.
No new poller, farming identity, bed or timer prediction follows from this display.

## Trophy source completeness, identity and provenance

17 owns a generated REVIEW INVENTORY, not generated gameplay content: enumerate all
live `DEEDS`, every `ReliquaryRelicDef` source kind and page, mount/skin/title
ownership, armor-set membership, rare slain marks and valid Perfected copies. Emit
one explicit authored eligibility mapping for every promised source, or a justified
availability exclusion (retired, developer-only, not yet discoverable). No current
catalog count is a ceiling. In particular the inspected mount catalog has more than
the packet's former six-mount shorthand; derive the inventory from `MOUNTS` and
`MOUNT_KEYS`, filter with actual acquisition/visibility policy and test the result.

A canonical source key combines source kind and immutable source ID, including
required difficulty where applicable. Multiple Reliquary pages referring to the same
source do not mint duplicate trophy unlocks. Trophy IDs are NEW records of the form
`freehold_trophy_<kind>_<safeSourceId>`, never item IDs, never tradeable goods, never
sold. `safeSourceId` is a placeholder in this NEW frozen-ID template, not an existing
export or an invented encoding. 17 owns its explicit encoding and collision contract
in planned `src/sim/content/freehold/trophies.ts` and
`src/sim/freehold/trophy_eligibility.ts`, with runtime validation in planned
`src/sim/freehold/trophies.ts`. A catalog extension must preserve frozen persisted IDs. Every valid source
gets a truthful generic display in Wave A even if its bespoke model arrives in 23.

| Source class | Existing authoritative source | Wave A generic display | Specialized form owner | Provenance and eligibility rule |
|---|---|---|---|---|
| Deed, including progression/chronicle/title reward | `src/sim/content/deeds.ts::DEEDS`, account deed ownership | Framed achievement plaque | 23 source-specific banner, statue or sheaf | Actual deed ID, source character/day when known; title must be owned, not merely catalogued. |
| Individual discovered item | `ReliquaryRelicDef` kind `item`, existing discovery evidence | Item relief plaque with truthful localized item identity | 23 weapon rack or item/armor display | A discovered relic does not require whole-page illumination; possession-sensitive actual copy display is a separate condition. |
| Illuminated Reliquary page | `src/sim/reliquary.ts`, exported `ReliquaryState` member `illuminatedPages`; exported synchronization function `syncIlluminatedPages` | Book-and-page plaque | 23 collection display | Actual page ID and completion evidence; the existing character-state member is not standalone account-wide proof, and planned account aggregation cannot invent a date. |
| Rare kill/other mark | Catalogued `mark` and `slain:*` evidence | Inscribed source medallion on freestanding plaque | 19 qualified head family; 23 further silhouettes | Actual qualifying mark; a new account gets no mounted head without proof. |
| Mount | Catalogued `mount` and account mount ownership | Paddock marker on a floor-supported display | 23 cosmetic actual mount appearance/paddock | Owning a marker grants no mount, speed or duplicate reins; respect unavailable/developer source policy. |
| Weapon skin | Catalogued `weapon_skin` and account skin ownership | Weapon-appearance relief plaque | 23 actual cosmetic appearance rack | Display only an owned skin, no weapon item mint or purchase advertisement. |
| Title | Catalogued `title` and associated owned deed | Title plaque | 23 banner | Localized title from actual deed reward, sanitized public source character. |
| Armor set | Live set entries and corresponding discovered members | Stand plaque showing actual discovered pieces | 23 piece-by-piece stand | Never imply complete set from one item; unowned pieces remain absent/undiscovered as appropriate. |
| Profession specimen | `professions_specimens` item/mark sources | Specimen plaque | 23 specimen cabinet | Display truthful obtained specimen; do not substitute ordinary material for rare proof. |
| Curator rank | Existing curator-rank deeds in `src/sim/content/deeds.ts::DEEDS`, with actual account deed ownership | Rank plaque with the localized source rank | 23 rank display refinement | Enumerate the live rank-deed source set; do not infer a completed rank from current page count or invent its date. |
| Named Perfected legendary | `src/sim/professions/perfecting.ts` and exact current copy payload | Named-work plaque | 23 Legend Stand | `perfected`, legendary promotion and actual chosen name required. If the exact copy leaves authorized account custody, keep unlock and provenance, darken live-copy display. The Legend Stand copy reference is the stable subset (owning character id, itemId, instance.name, instance.signer, perfected, rolled.quality legendary), never itemCopyPin, which hashes the whole payload. The known source day is the owning character's prog_legendmaker deed day (deedsEarned, a utcDay stamp); no promotion day exists on the copy, so a copy without that deed day uses the unknown-day discriminator. |
| Guild clear/project | New 31 guild-clear evidence (the sixteen `guild_first_<boss>_<difficulty>` guild deeds below) / 32 durable project completion record | Introduced in guild wave using same plaque family | 31 first-clear banner/statue; 32a project trophy | Membership at credited clear, no retro proof inferred from current guild; project condition truly completed. |

The Wave A generic display family 19 builds is exactly this column's set: the plaque
variants, the inscribed source medallion on a freestanding plaque, the stand plaque, the
paddock marker on a floor-supported display and the qualified head family; no source
class maps to a bust form and none is built (art-brief section 8 and phase 19 deliverable
3 name the same set).

Trophy requirement text uses UX's exact source-predicate keys: slain sources select
trophies.requireSlain with the validated localized creature name; Masterwork,
node-gather, golden-harvest and perfect-specimen marks select their respective
concrete predicate arms. No generic Complete-mark sentence or humanized ID is used.
The source display label remains independently localized, so Slain: Mogger is a
source label and never the creature argument in a Defeat sentence.

Provenance record: stable source identity, difficulty/mark, immutable known source
character identity and public name projection, known authoritative source day or
explicit unknown-day discriminator (utcDay stamps of when the source happened, per D84;
the captured public character name and day are a snapshot written at grant and read
back as such, per D79), optional page and exact-copy reference. Account
aggregation is authoritative and refreshes on source changes, login and first entry,
batched without a per-tick full scan. Public projection includes only approved
provenance fields, never account IDs, private inventory or full item payloads.
Missing historical dates stay unknown; first visit is never substituted. Owner and
guest inspect the same public values.

Unearned discoverable sources may show a silhouette and localized acquisition hint.
Hidden sources disclose no boss, item, title, page, difficulty, reward model name,
search term, aria text or example until the owning visibility rule allows it. Their
placeholder uses the NEW planned `hudChrome.housing.trophies.hidden` and
`hudChrome.housing.trophies.hiddenAria` keys from the UX spec; 17 owns their English
catalog rows. These identify intentionally hidden accomplishments. The distinct NEW
`hudChrome.housing.trophies.unknownSource` key describes missing original provenance,
never spoiler suppression. No Place action is available on an unqualified source. Actual source names use existing localized
resolvers inside the keyed housing provenance lines in the UX spec.

## Specialized trophy model inventory for 23

These planned model keys name concrete art families. Bronze is the normal clear
finish; silver requires the corresponding heroic evidence; gilded requires actual
S-rank rift evidence for a rift source. An unrelated S-rank clear never gilds a normal
raid statue. Shape/trim/mark remains distinguishable when bloom and specular are off.
Condition can dull decorative finish, never obscure source identity or proof.

| Planned model key / display form | Existing qualifying source | Model and refinement owner |
|---|---|---|
| `freehold_trophy_thunzharr_statue`, Thunzharr statue | `cmb_thunzharr` | 23 TROPHIES, posed mountain silhouette from the live creature reference |
| `freehold_trophy_nythraxis_statue`, Nythraxis statue | `dgn_nythraxis`, heroic counterpart only for silver | 23 TROPHIES, actual source character silhouette |
| `freehold_trophy_ignivar_statue`, Ignivar statue | `dgn_ignivar`, heroic counterpart only for silver | 23 TROPHIES |
| `freehold_trophy_varkhul_statue`, Varkhul statue | `dgn_varkhul`, heroic counterpart only for silver | 23 TROPHIES |
| `freehold_trophy_korzul_statue`, Korzul statue | `dgn_gravewyrm_sanctum`, corresponding heroic source | 23 TROPHIES |
| `freehold_trophy_morthen_statue`, Morthen statue | `dgn_hollow_crypt`, corresponding heroic source | 23 TROPHIES |
| `freehold_trophy_vael_statue`, Vael statue | `dgn_sunken_bastion`, corresponding heroic source | 23 TROPHIES |
| `freehold_trophy_ysolei_statue`, Ysolei statue | `dgn_drowned_temple`, corresponding heroic source | 23 TROPHIES |
| `freehold_trophy_wildheart_priest_statue`, High Priest statue | `dgn_wildheart_basin`, corresponding heroic source | 23 TROPHIES, resolve exact live priest appearance before art |
| `freehold_trophy_rare_head_<safeSourceId>`, qualified mounted head | Every visible qualified `slain:*` source | 19/23 TROPHIES, a freestanding framed head in floor-only Wave A; typed wall adaptation in B |
| `freehold_trophy_item_stand`, armor display and `freehold_trophy_weapon_rack`, weapon display | Actual discovered/possessed item or owned weapon-skin source | 23 TROPHIES and character/item appearance adapters |
| `freehold_trophy_mount_paddock`, mount appearance display | Every eligible live owned mount source | 23 TROPHIES, reuse owned cosmetic model with bounded static/animation policy |
| `freehold_trophy_title_banner`, title/grandmaster banner | All actual title-reward deeds and every `prog_grandmaster_<craft>` | 23 TROPHIES; existing ten-craft roster, including jewelcrafting and inscription |
| `freehold_trophy_specimen_cabinet`, profession specimens | `professions_specimens` and actual specimen inventory/discovery | 23 TROPHIES |
| `freehold_trophy_harvest_sheaf`, harvest collection | `prog_farming_100`, `col_golden_harvest`, `prog_field_to_feast` each as its own truthful source key | 23 TROPHIES; 24 presentation integration |
| `freehold_trophy_harvest_marker`, regional first-harvest marker | `chr_vale_first_harvest`, `chr_marsh_first_harvest`, `chr_peaks_first_harvest`, `chr_evergarden_first_harvest` | 23 TROPHIES |
| `freehold_trophy_anglers_display`, angler display | `col_deepest_cast` | 23 TROPHIES |
| `freehold_trophy_rift_obelisk`, rift display | `dgn_rift`, `dgn_rift_s_rank`, actual qualifying relic marks | 23 TROPHIES; S-rank gilded only on qualifying source |
| `freehold_trophy_legend_stand`, Legend Stand | Actual named promoted Perfected copy, `prog_legendmaker` as accomplishment context | 23 TROPHIES and eligibility owner |
| `freehold_trophy_guild_first_<boss>_<difficulty>`, guild first-clear banner/statue: sixteen ids, boss in the FINAL_BOSS_DUNGEONS roster (src/sim/deeds.ts) and difficulty in normal, heroic. Banner family with a per-boss emblem for the five dungeon final bosses `morthen`, `vael_the_mistcaller`, `ysolei`, `korzul_the_gravewyrm`, `wildheart_high_priest`; statue for the three raid bosses `nythraxis_scourge_of_thornpeak`, `ignivar_herald_of_the_last_flame`, `varkhul_forgefather_of_the_last_flame`; finish by 23's finishFor (normal bronze, heroic silver) | The matching 31 guild deed `guild_first_<boss>_<difficulty>` (same sixteen ids), earned by the first committed source claim per (guild_id, deed_id) | 31 CONTENT/ART; the sixteen ids are the frozen set |
| `freehold_trophy_project_<tier>`, hall build-project model | Completed approved 32/40 project proof, never elapsed time alone | 32a/40 CONTENT/ART |

The model key may be shared by many source records. Each model has a concrete
reference sheet and export output via [art-brief.md](art-brief.md), and each source
record has its own truthful provenance. No fabricated new trophy item icons are
required for non-item records; the trophy renderer uses registered family art with
source-aware silhouettes. Where a new catalog image is needed it has provenance and
a manifest row, not an undeclared item WebP.

## Hearth shelf and same-change completion contract

NEW shelf ID `hearth` and its localized shelf name are approved under R23. Add it to
`ReliquaryShelfId` in `src/sim/content/reliquary.ts`, shared navigation and shelf
ordering in `src/ui/reliquary_view.ts`, label/i18n and painter handling, source hint
routing, selection/deep-link/focus behavior and all catalog content tests. Append
new pages at the end without changing any existing page ID or order. There is no
existing global page cap to spend.

| Planned page ID | Exact membership | Source hint / producing owner |
|---|---|---|
| `hearth_basics` | The eight Wave A vendor IDs above, in table order | New furnisher vendor ID, 03 |
| `hearth_first_crafts` | The ten Wave A crafted output IDs above, in table order | Each existing craft plus truthful pattern acquisition routes, 04 |
| `hearth_workshop` | The ten Wave B outputs whose page column names this page | Each existing craft; relevant raid/rift/Marks routes, 22 |
| `hearth_table_and_light` | The ten remaining Wave B output IDs | Each existing craft; relevant raid/rift/Marks routes, 22 |

Patterns and trophy records never occupy this shelf. Collection pages never mint
paid entitlements, furnish a room, or substitute for owned-copy checks. These planned
furnishings are normally obtainable/tradable, so ordinary discovery/completion
semantics apply, including normal gold-vendor and market-acquired furnishings. Paid
entitlement proof is excluded, not every furnishing obtained through payment. Any
later personal, retired or unavailable record must use the
actual exclusion policy and a reviewed test; do not inflate completion denominator
with unobtainable paid proof. Remeasure slot/unique/character completion fingerprints
rather than treating their former totals as caps. Reuse existing watch/recent limits
without mislabelling them page limits. Each wave verifies full union/nav/source/name/
icon/ownership/completion/guide coverage and no raw English leak.

## Deeds and later-wave reward content

Every family below is NEW content a phase file produces; the manifest carries it so the
content-obligations reviewer, the Endeavor and Showcase producers and the 44 preservation
audit have a row to check. The same-change obligations of the ownership paragraph above
(art where the record is visual, item-name or deed-name English keys and M16 fills, wiki
regen and guide keys, Book of Deeds pins, power-neutral tests) apply to each row; deeds
are cosmetic-only records, never power.

### Homesteader deeds (03)

The ids are frozen here; phase-03 appends the rows at the END of `src/sim/content/deeds.ts`
with DEED_ORDER rows and trigger kind `manual` (granted only by an explicit grantDeed
call, so no DeedTrigger or DeedFlagId widening). Later content phases (17, 21, 22, 23, 24,
28, 31) extend the family under the same rule.

| Exact planned deed ID | Planned English name | Trigger | Raised by | Reward | Owner |
|---|---|---|---|---|---|
| `homesteader_first_furnishing` | Homesteader | manual | 08, through the src/sim/deeds.ts grantDeed seam after the first successful placement mutation applies, identically on both hosts, for the character that placed the furnishing (phase-08 deliverable 2) | cosmetic renown and title only | 03 CONTENT |
| `homesteader_first_cottage` | Householder | manual | 15, through the same grantDeed(ctx, meta, deedId) call inside the confirmed grant, exactly once for the character whose admitted session receives the Cottage tier grant (phase-15 deliverable 2) | cosmetic renown and border only | 03 CONTENT |

### Guild first-clear deeds (31)

31 ships the guild deed record family `guild_first_<boss>_<difficulty>` for the sixteen
sources the trophy table above names (every FINAL_BOSS_DUNGEONS template at normal and
heroic), as keep-forever `guild_deeds` rows keyed (guild_id, deed_id) in
`src/sim/content/freehold/guild_deeds.ts`, append-only order. Art (the banner or statue
prop above), deed-name keys, wiki and deeds pins are 31 CONTENT obligations; the
projection reads the captured public-name snapshot beside the nullable earned_by FK
(D79).

### Endeavor content (35)

`src/sim/content/freehold/endeavors.ts` carries append-only goal IDs
`freehold_endeavor_<goal>` and cosmetic reward props `freehold_endeavor_reward_<prop>`.
Each reward prop is a furnishing-shaped record with the same art (`.glb` and `.webp` by
the expansion rule), item-name key and M16, wiki, deed and Reliquary columns as the
furnishing tables; weights, thresholds, targets and contribution limits are UNSIGNED per
the workbook's CAL-ENDEAVORS row until approved, and an unapproved row cannot activate.
Monthly activities are cosmetic: no stat, training, recipe/drop/gathering advantage or
paid input. Owner: 35 CONTENT.

| Planned ID template | Kind | Same-change obligations | Values |
|---|---|---|---|
| `freehold_endeavor_<goal>` | monthly goal with metric and threshold | English name/description keys, wiki row, distinct-visit identity and contribution fingerprint stated here before enable | UNSIGNED, CAL-ENDEAVORS |
| `freehold_endeavor_reward_<prop>` | cosmetic reward prop delivered to safe item custody | model and icon by expansion, provenance, name originality, wiki, Book of Deeds record where conquerable, Reliquary none (trophy-decor unlock) | UNSIGNED, CAL-ENDEAVORS |

### Showcase reward (36)

The season-result source key mints a permanent owner unlock of trophy-decor reward
props, never a new power reward. Obligations 36 consumes: Book of Deeds, one cosmetic
record for the season win (docs/design/deeds.md, pinned by tests/deeds_content.test.ts);
Reliquary, none (a trophy-decor unlock, not conquerable unique loot); wiki regen and
committed WebP art per the item obligations; changed reward props use the scheduler,
prewarm and retirement contract. Owner: 36 CONTENT.

### Kitchen Garden entities (24)

| Exact planned ID | Kind | Contract | Owner |
|---|---|---|---|
| `freehold_farmer` | NpcDef in NEW `src/sim/content/freehold/npcs.ts`, merged into NPCS by `src/sim/data.ts` | English name Farmer through the `src/ui/world_entity_i18n.ts` row; greeting only; no `farmer` flag, no vendor, banker, market, cardMaster, questIds or dynamic row | 24 CONTENT |
| `harvest_journal_board` | `kind: 'object'` ground interactable spawned on claim at the garden anchor | display name through the feast_title templateId map to `hudChrome.housing.garden.board`, never a raw English name; lootable false, respawnTimer Infinity, torn down with the claim | 24 CONTENT |

## Later wave stock and dye roster

Guild vendors in 32a reuse the completed Wave A/B furnishing IDs as cosmetic stock;
32a produces the exact per-tier availability list from those rows with a recorded
source/price worksheet. No trainer recipe or power item may enter by implication.
Guild first-clear and project trophies use the planned ID families above and signed
clear/project evidence. Showcase trophies in 36 use a season-result source key and
permanent owner unlock, never a new power reward (the Showcase reward row above states
the deed, Reliquary, wiki and art obligations). Seasonal furniture sets and new
Carpenter/Mason professions are explicitly outside the approved packet scope.

The eight dye IDs below are approved R40 content, not sampled RGB values or invented
recipe costs. 41's art owner authors and approves a neutral-lit material swatch board
using the corresponding visible material role in the approved Eastbrook design
reference; 41's content owner records the actual recipe bill in the numeric worksheet.
Each result ID produces the same-name item WebP and source provenance, and enters the
normal English item catalog. Housing selection uses that canonical localized item
name, without creating a second dye-label namespace. Dyeable materials expose
zero, one or two declared channels; no tint on provenance, rarity, source marks or
placement validity overlays.

| Planned dye ID | Planned English name | Exact material/reference role | Source/recipe owner |
|---|---|---|---|
| `freehold_dye_plaster_cream` | Plaster Cream | Warm unshadowed plaster / cream cloth | Existing Alchemy, 41; swatch and bill artifact |
| `freehold_dye_hearth_amber` | Hearth Amber | Amber lantern/hearth material, not sampled emitted radiance | Existing Alchemy, 41 |
| `freehold_dye_timber_brown` | Timber Brown | Warm timber's neutral material midtone | Existing Alchemy, 41 |
| `freehold_dye_slate_charcoal` | Slate Charcoal | Quiet slate/iron material dark with visible headroom | Existing Alchemy, 41 |
| `freehold_dye_window_blue` | Window Blue | Cool blue textile complement to daylight | Existing Alchemy, 41 |
| `freehold_dye_roof_teal` | Roof Teal | Approved reference teal roof material | Existing Alchemy, 41 |
| `freehold_dye_cloth_red` | Cloth Red | Approved reference red cloth/roof family | Existing Alchemy, 41 |
| `freehold_dye_leaf_green` | Leaf Green | Muted garden-green textile complement | Existing Alchemy, 41 |

Dyes are a later-wave extension, never counted in the eighteen or twenty furnishing
outputs. Their precise material values, quantities, skill requirements, station
binding and economy invariants are unsigned production artifacts with explicit 41
ownership and pre-enable acceptance. The dye picker is enabled by the home station
amenity of type apothecary (D90): no new amenity kind, no extra slot, no dye station
furnishing or amenity row and no station GLB; the art row is the neutral-lit swatch board
and channel masks only. Dyeing consumes the selected owned dye and acts only at that
amenity with condition at least the existing threshold. Ordinary build/undo remains
available at every condition.
