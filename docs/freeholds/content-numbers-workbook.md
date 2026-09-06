# Freeholds numeric provenance and calibration workbook

Status: approved, UNBUILT packet handoff under R01 to R46 and the round-2 dispositions
D76-D93 (R47-R64, applied as recommended and awaiting Fernando's word). This is a filled inventory
of existing working targets, verified source baselines and concrete unsigned production
artifacts. It contains no invented final balance values. [state.md](state.md) owns
adopted numbers and decisions; [content-manifest.md](content-manifest.md) owns exact
content membership. A pending signature is a tracked release gate, not an invitation
for an implementer to select an undocumented number.

Every numeric production artifact records value, unit, source revision, derivation,
rounding, fixture IDs, owner, approval identity and day, producing implementation/QA,
activation gate and superseded version. A field marked UNSIGNED has a concrete
producer below. Disabled content can carry trial fixtures, visibly marked TUNING,
when the producer records their measured derivation. No unsigned fixture enables
production acquisition, spending, upkeep, progression or a paid SKU.

## A. Filled working target register

Unless a row says tree-derived, these are WOC/proposal working targets owned by
Fernando, not classic-era facts. R05 retains them explicitly as owned TUNING targets. The economy
service owns every price, fee, conversion, discount, royalty and settlement split.
Illustrative dollars and multipliers never calculate an in-game payment.

| Record | Filled working value / unit | Provenance | Producing owner and acceptance gate |
|---|---|---|---|
| Inn Room | 1 room; 20 decor; 3 plinths; 0 amenities; free; no upkeep | State Content numbers; proposal starter room | 03/06 CONTENT/INTERIOR; 20 final room/art/LOW acceptance |
| Cottage / Meeting Hall | 1 room; 60 decor; 4 plinths; 1 amenity; illustrative $20 | Proposal 6.3 and state | 03/28 CONTENT; service quote for actual fee; 20/33 release |
| Lodge / Great Hall | 2 rooms; 120 decor; 8 plinths; 2 amenities; illustrative $25 upgrade | Proposal 6.3 and state | 21/32 CONTENT; approved bill and quote; 27/33 release |
| Manor / Bastion | 3 rooms; 200 decor; 14 plinths; 3 amenities; illustrative $50 upgrade | Proposal 6.3 and state | 32 CONTENT; approved bill and quote; 33 release |
| Keep / Fortress | 4 rooms plus courtyard; 300 decor; 22 plinths; 4 amenities; illustrative $100 upgrade | Proposal 6.3 and state | 40 CONTENT; approved bill/prestige/quote; 44 release |
| Citadel | 5 rooms plus courtyard/tower; 420 decor; 32 plinths; 6 amenities; illustrative $200 upgrade | Proposal 6.3 and state | 40 CONTENT; approved bill/prestige/quote; 44 release |
| Guild fee comparison | Roughly 3 times personal illustrative fee | Proposal 6.3 and state | 29/32/40 SERVICE; actual guild SKU quote, never client multiplication |
| Condition range and repair | 0 to 100; a valid repair restores 100; repair from 93 costs the same as from 60 | Proposal 6.7 and state | 13 UPKEEP; same bill identity and full restore tests |
| Daily wear | Personal 1, guild 2 condition per eligible realm day | Proposal 6.7, state | 13/29 UPKEEP; authority-fed day and suspension/grace fixtures |
| Amenity threshold | Amenities available at 30, pause only below 30; entry/build/undo still available at 0 | D22 and proposal 6.7 | 12/13/16/23/30/41; literal boundary fixtures |
| Protective absence policy | Pause after 7 absent days; 3 repair-free return days | Proposal recommendation and state; WOC-owned choice | 13/29; preserve prior-absence transition across account alts, restart and suspension |
| Ledger family lines | 3 to 5 material lines, including produce every week under approved R06 | Proposal 6.7 plus R06 | 03 schedule; 13 immutable bill versions; signed exact units before activation |
| Upkeep target | Cottage about 10%, Citadel about 20% of measured reference gatherer's weekly output | Proposal 6.7; objective, not an external observed rate | 03/13 calibration; 20 four-week measured report; Fernando/service signature |
| Call comparison | About 1.5 times current bill market value, illustrative only | Proposal 6.7 and state | 15/16 SERVICE; quote states current bill/repair effect and exact price |
| Prepay capacity | 4 weeks in A, 12 from 25a | Proposal MVP/later recommendation and state; twelve-week precedent verified separately | 13/25a UPKEEP; fixed versioned bills, first disallowed fifth/thirteenth week |
| Hearth Key | 60 minutes; one account cooldown shared across later destinations | State and approved R41 | 07/07a account-row authority, 06/42 consumers; transaction timestamp and cross-alt/process/destination denial/race tests |
| Snapped yaw | 15 degrees | Proposal 10 and inspected editor `ROTATE_STEP_RAD` reference | 08/11 PLACEMENT; pure sim-owned value, no editor import |
| Personal visitor progression | Cottage 8, Lodge 12, Manor 16, Keep 20, Citadel 24 | State working progression | 18/26/40; owner-account sessions excluded; capacity controls admission, not rendering |
| Guild-hall visitor cap | Meeting Hall, Great Hall, Bastion: UNSIGNED (the Cottage row 8 stands until Fernando signs the hall-tier values, D77) | State D77 and the Visitors row; no invented literal | 32 CONTENT/LAYOUT sets the column from the signed rows; 28 pins the Cottage stand-in |
| Inn visitor cap | 8 | Approved TUNING R24, reused Cottage target; not a classic-era fact | Fernando owns the approved target; 18 admission fixtures |
| Public entry throttle | One knock per account and plot per 10 seconds | State plus R24/R25 identity clarification | 26 SERVER; authenticated rate-limit tests, ordinary owner entry unaffected |
| Ward capacity | 50 plots, 24 admitted occupants | Proposal 6.9 adopted working bounds (50 plot slots, 24 admitted occupants) retained by D57 | 34 DB/INTERIOR; transactional admission and measured footprint; all admitted players visible |
| Favor | 4 ranks; 10 additional decor per rank; capacity permanent under R32; awards are properties of the stable plot ID and travel with the plot (D80) | State targets plus approved no-loss refinement | 35 CONTENT; signed threshold/reward artifact before enable |
| Endeavor cadence | Authority's UTC calendar month, utcDay.slice(0, 7), never resetDay (D84) | Proposal monthly cadence plus R32 | 35 CALENDAR/CONTENT; calendar boundary and restart proof |
| Showcase | 13 weeks per season on resetDay realm weeks and the Tuesday anchor (D84); one account vote per realm season; no self-vote | State duration and R33 | 36 SOCIAL; published anchor, immutable close/result identity |
| Guest book | 50 entries per plot; closed reactions wave/cheer/admire | State cap and approved R34 enum | 36 SOCIAL/DB; concurrent insert/prune and deterministic oldest order |
| Guest author rate | One reaction per account, plot and realm day (the resetDay realm day, D84) | Approved TUNING R34 | Fernando owns the approved target; 36 per-account/day persistence fixture |
| Guild donor cap | One current weekly Hall Ledger-equivalent per account per realm week (ledgerWeekOf, D84) across alts; a ceiling, never a requirement to donate | Approved TUNING R28, not a GW2 rate | 29 SERVICE/CONTENT; accepted unit/currency normalization schedule |
| Contribution retention | 90 days | State operational working value | 29 DB; bounded indexed retention and donor export proofs |
| Dye palette/channels | 8 dye IDs; 0 to 2 declared tint channels per item; picker enabled by the home apothecary station amenity, no station GLB (D90) | State and approved manifest palette | 41 ART/CONTENT; exact neutral-lit swatches and recipes signed |
| Saved layouts | 5 slots per plot | State | 41a CORE/DB; all entry/byte caps include every saved layout |
| Second-home bill | Each integer Ledger, prepay and upgrade line rounded up after multiplying primary approved units by 1.5; no second-home upgrade refusal (D93) | State multiplier, approved R41 rounding and D93 | 42 CONTENT/SERVICE; ceil boundary pins, price remains service-owned |
| Initial burn/treasury example | 25% / 75% | Adopted proposal working split | 15 accepted service statement; no game calculation |
| Resale example | 3% burn, 7% treasury, 90% seller; royalty separately quoted/published | State working split | 37/38 accepted deed service/counsel artifact, no game calculation |
| Furnishing roster | A: 8 vendor + 10 crafted = 18; 3 patterns teach outputs inside ten. B: 20 additional, 2 per existing craft | Actual packet arithmetic and approved R12 manifest | 03/04/22 CONTENT; exact roster and page union pins |
| Pattern vendor floor | 100 copper `sellValue` | Current `APEX_PATTERN_ITEMS` / `FARM_PATTERN_ITEMS` contract | 04/22 CONTENT; row-by-row literal pin, not a Marks amount |
| Budget review cadence | Every second release | Proposal 6.3 | 20 creates recurring report; later release owner attaches measured LOW comparison, never automatic capacity growth |

## B. Verified source baselines, not new housing rates

These source records were read in the actual tree. They may calibrate an artifact,
but copying an unrelated count, chance or skill requirement does not establish a
housing bill. Never confuse progression/gather tiers with the separate material
price band.

| Existing source | Observed baseline | Permitted use / limitation |
|---|---|---|
| `src/sim/content/professions.ts::CRAFT_RING` | Engineering, Alchemy, Cooking, Leatherworking, Tailoring, Inscription, Enchanting, Jewelcrafting, Weaponcrafting, Armorcrafting; current maxSkill 125 each | Exact craft IDs and live trainer/station contracts; no new craft or cap |
| `src/sim/professions/gathering_materials.ts::NODE_MATERIAL_TABLE` | Common/uncommon/rare/epic/legendary node yield units 1/2/2/3/4 | Measured gatherer replay must use this table and live probabilities; not a weekly quantity |
| `src/sim/professions/material_grades.ts::MATERIAL_GRADES` | Nine base/fine node pairs at gatherTier 1, 2 or 3 | Grade substitution and resource identity. No tier-4 node-fine record exists |
| `src/sim/content/farm_crops.ts::FARM_CROPS` | Four low-tier crops below; existing crop growth times and survival model | Preserve exact farming loop; no new beds, growth, survival or gain values |
| `src/sim/content/farm_crops.ts::farmCropSkillThreshold` | Crop tier threshold `(tier - 1) * 25` | Existing planting band only, never a new furnishing recipe gate |
| `src/sim/content/items.ts::FISHING_TABLES_BY_BAND` | Source band/zone, all outcomes including empty hooks and junk | Replay actual catches, not max-stack counts or successful-cast-only averages |
| `src/sim/content/recipes.ts` | Existing reagent/output/skill/acquisition/station rows | Concrete comparator rows below; preserve training/admission/discount logic |
| `src/sim/professions/masterwrought_materials.ts::emberWeekAnchorOf` | Pure most-recent Tuesday from injected resetDay; empty calendar returns empty | 13 extracts the calendar leaf into src/sim/realm_week.ts (re-exported unchanged) and ledgerWeekOf is that helper for shared realm-week identity (D84); never import keystone grants into housing |
| `src/sim/content/apex_patterns.ts`, `farm_patterns.ts` | Pattern ID and teaching contracts, output-derived quality, uniform sellValue 100 | Pattern shape only; existing luck weights/Marks prices are not housing rates |

Concrete recipe comparators in `src/sim/content/recipes.ts`: weaponcrafting
`recipe_eastbrook_arming_sword`; armorcrafting `recipe_eastbrook_chain_vest`;
tailoring `recipe_eastbrook_wool_trousers`; leatherworking
`recipe_tanned_leather_jerkin`; alchemy `recipe_minor_healing_potion`; cooking
`recipe_tough_jerky`; inscription `recipe_silverleaf_primer`; jewelcrafting
`recipe_hammered_copper_band`; enchanting `recipe_gatherers_cache`; engineering
`recipe_thorium_mining_pick`. Record the full live row in each calibration evidence
file. The enchanting/engineering examples are station/teaching/economy references,
not permission to bill charged charms, tools or gear intermediates. Cooking produce
furniture also compares to the current `FARM_RECIPES` rows without inheriting their
food or power effect. Housing outputs always mint actual decor, never a copied gear
stat block.

## C. Exact eligible weekly material IDs

Each entry names an actual shipped ID. Bracket order is the explicit base-first
substitution preference for THAT line, not an instruction to add amounts together.
Fine produce is an explicit housing planner grade list; it must not widen the
node-only `MATERIAL_GRADES` table. A bill selects one listed line identity per chosen
family according to its approved schedule. Housing never consumes signed/instance
payloads as if they were interchangeable bare counts without the normal selected
source planner's explicit eligibility.

| Family / progression source | Published allowed line identities, base then fine where real | Existing source and exclusions |
|---|---|---|
| Ore, tier 1 | `copper_ore`, `fine_copper_ore` | NODE_MATERIAL_TABLE + MATERIAL_GRADES |
| Ore, tier 2 | `iron_ore`, `fine_iron_ore` | Same |
| Wood, tier 1 | `ironbark_log`, `fine_ironbark_log` | Same |
| Wood, tier 2 | `ashwood_log`, `fine_ashwood_log` | Same |
| Herb, tier 1 | `silverleaf_herb`, `fine_silverleaf_herb` | Same |
| Herb, tier 2 | `goldleaf_herb`, `fine_goldleaf_herb` | Same |
| Hide, existing common corpse harvest | `rough_hide` only | HARVEST_COMPONENT_ITEMS; no invented fine or separate tier-2 hide |
| Cloth, existing common corpse harvest | `homespun_cloth` only | HARVEST_COMPONENT_ITEMS; no invented fine or separate tier-2 cloth |
| Fish, Eastbrook source | `raw_mirror_trout` or `raw_river_perch`, each its own line | FISHING_TABLES_BY_BAND; no fine twin |
| Fish, Mirefen source | `raw_marsh_pike` or `raw_bog_eel`, each its own line | Same; no rare catch, cooked dish or junk substitution |
| Produce, tier 1 grain | `vale_wheat`, `fine_vale_wheat` | FARM_CROPS |
| Produce, tier 1 root | `brook_carrot`, `fine_brook_carrot` | FARM_CROPS |
| Produce, tier 2 grain | `marsh_rice`, `fine_marsh_rice` | FARM_CROPS |
| Produce, tier 2 root | `bog_beet`, `fine_bog_beet` | FARM_CROPS |

The requested quantity is an integer number of ITEM UNITS. `stackSize`, an inventory
container's maximum stack, or a vendor buy-stack default never determines a ledger
quantity. Replace historical wording "three to five stacks" with "three to five
material lines" under the adopted R06 rule. The UI may display an
actual stack arrangement secondarily, derived from the owned inventory.

Exclude every Perfecting keystone, gear intermediate and quickening catalyst from
ALL ledger, furnishing and upgrade bills. The existing firewall's named deny set,
including `wyrmfall_core`, `sundered_essence` and `makers_ember`, is the authority;
run the complete deny set and word-family sweep rather than these examples alone.
All approved inputs have a normal obtainable/tradable route for a non-profession
owner to buy; no quest-only item, bound character requirement, rare specimen or
self-gating prerequisite may become upkeep by implication.

Upper upgrade material candidates already in the tree are `fine_thorium_ore`,
`fine_elderwood_log`, `fine_sunpetal_herb` and existing high-tier fine produce.
The actual tier-4 produce IDs are `gilded_sunmelon`, `evergarden_greens`,
`gilded_yam`, `evergarden_pumpkin` and their corresponding `fine_` IDs.
`highland_barley`, `frost_gourd`, `thornpeak_cabbage`, `frost_lentils` and their
fine twins are tier 3. These are eligibility candidates for the approved bill, not
permission to invent a fourth node-material grade. The 21/32/40 bill artifact names
exact selected IDs/units and the content-tier meaning explicitly.

## D. Realm-week schedule and quantity rounding contract

03 produces a versioned, finite content schedule with stable row IDs, sorted eligible
family alternatives from section C and signed quantity vectors. The conceptual artifact
schedule key is `(contentVersion, realmWeekAnchor)`: NEW planned metadata fields, not
existing exports or schema members. 03 owns both planned schedule-key fields in NEW
`src/sim/content/freehold/ledger_schedule.ts`; 13 consumes them in NEW
`src/sim/freehold/ledger_core.ts`, preserving the version on each immutable quoted bill.
Persisted bill/operation identity follows the 07/07a contract. The tuple never uses
account, guild, character, local timezone or an RNG draw. The anchor uses the
authority-fed Tuesday week semantics already carried by `emberWeekAnchorOf`; 13 extracts
that pure calendar leaf into `src/sim/realm_week.ts` (re-exported unchanged) and
`ledgerWeekOf(resetDay)` is the housing name for it (D84). Same content and same injected
week yield the same ordered bill for every owner. A schedule version also fixes every
later prepaid week it quotes. Empty, malformed or backwards calendar data never creates a
fresh bill or consumes a prepay credit.

File 13a owns the authoritative calendar's finalized historical facts. Account
protection comes from 07b's committed lifecycle history across every absence/return
cycle, unioned with service outage protection without subtracting overlap twice.
Keep the source calendar/schema/reset meaning stable through takeover or transfer;
never rebind a dormant plot's existing history to its serving realm. Unsupported or
ambiguous stored authority remains preserved and unavailable for affected mutation.
Durable condition, elapsed-bill and credit-consumption effects wait for irrevocable
facts through their historical dependencies. Future prepay purchase requires the
published immutable schedule and current prerequisites, not future-time finality.
Monotonic generation checks reject stale installs. Player projections expose only
selected safe dates, display timezone and reason; operator evidence, internal
authority fields and private lifecycle history stay out of every player payload.
The exact consumer contract and keyed connected-refresh/unavailable states are in
[ux-spec.md](ux-spec.md), section 2.4; reconnect copy is reserved for connection loss.

The immutable approved schedule table supplies its line count between the existing
three and five target. Produce is selected for EVERY weekly bill. Remaining selected
families rotate deterministically; the producer exhaustively enumerates the finite
cycle and proves every candidate ID resolves, base precedes fine, all families are
reachable, produce is never omitted, no repeated family row appears in a bill and
no protected input enters. Hashing chooses only from signed schedule rows and has
no access to the shared sim RNG. The exact finite cycle length/hash encoding is a
versioned content implementation artifact with exhaustive fixtures, not a new
balance literal that a planner must guess today.

Quantity derivation records measured per-resource unit yield and an approved
allocation vector. Preserve the raw real-valued result and integer result in the
worksheet. CAL-LEDGER-A's calibration producer records and pins its integer rounding
rule alongside the signed quantity vector. The initial calibration method is nearest
positive whole unit with half cases upward, followed by reporting the achieved target
ratio for the artifact's signature; it never silently normalizes a failing ratio.
This method does not approve an unmeasured production quantity. If a candidate
rounds below a usable line or exceeds the approved burden tolerance, revise the
measured allocation and obtain the recorded signature before activation. The second-home rule is separately `ceil(primaryUnits * 1.5)`
under R41. Here `primaryUnits` is a pseudocode operand for the approved primary
bill's integer item units, not an exported symbol or a stored field. Prepay sums the already approved integer vectors for the exact future
weeks; it does not multiply today's bill by the number of weeks. Confirm shows the
fixed complete batch before one atomic deduction.

Bags-only, vault-only and automatic bags-then-vault use the SAME source-mode planner
for affordability, displayed line counts, confirmation and actual deduction. Upgrade
contributions pass the same explicit source-mode argument (bags, or the vault inside the
owner's own claim) and a confirmed fee whose last leg cannot finish because bags are
full re-attempts without a second fee (D89). Fine
substitution preference applies inside each explicitly selected source. Immutable
bills retain the planned `contentVersion` metadata and paid status through price changes, restart, service
outage and calendar rollover. A confirmed Call satisfies the current unpaid bill
and restores condition without creating future prepay credit under approved R08;
repair-only behavior when the bill is already paid must be quoted explicitly.

## E. Reproducible gathering calibration protocol

Artifact CAL-LEDGER-A is produced by 03 CONTENT with 13 UPKEEP and 20 ECONOMY QA.
Its reference population and observed data must be explicit before trial bills are
accepted. A "weekly active gatherer" means an account's observed eligible gathering
and farming activity in an authority realm week, with actual activity time reported;
it does not mean an invented number of hours or every account online at reset.
Use the upstream reference farmer's actual recorded check-in protocol when testing
farming, preserve its existing beds/tools/proficiency/survival, and separately report
ordinary field gathering, corpse harvest and fishing. Do not credit housing with
extra attempts or cherry-pick only successful harvests.

The calibration author records these fields for every observation or deterministic
replay segment: source commit and content version; replay seed and command trace;
authority reset-day sequence; realm-week anchor; pseudonymous account/cohort identity;
profession and actual proficiency/tool/grade/zone/node-or-crop; owned accessible bed
count and crop/check-in timeline; active gathering seconds and elapsed realm days;
attempts, failures and admitted outcomes; exact granted item IDs and units including
fine grades; capacity refusals, cancellations and offline gaps; carried/vault
boundaries; relevant market-price snapshot/version and source timestamps; counted
output and excluded windfall/specimen/keystone output with reasons; trial bill ID;
base/fine units consumed; final normalized burden and approval signature. Raw private
player identifiers stay outside public packet evidence.

Use actual units first. Where unlike families are compared, the economy-service
accepted market snapshot supplies a common valuation and its stale/missing-price
policy; never add a fish unit and an ore unit as equal value without an explicitly
approved normalization. Report both unit vectors and valued totals so a price change
cannot hide a supply problem. No game-side token conversion is needed or allowed.
A scarce/missing market series is recorded as insufficient calibration evidence and
keeps that bill disabled, rather than becoming a guessed price.

The four-week Wave A report records the actual cohort distribution, median and spread
by family, tier, proficiency and active-time band; exact sample size and inclusion
rules; every published bill/week; rounded target ratios; purchase versus self-gather
split; active supply coverage; and protected-economy impact. It compares to the same
upstream baseline and observes the existing 10%/20% objectives without asserting a
material price rise. No numeric sample-size threshold or middle-tier burden curve
is invented here: Fernando and service sign the recorded sampling/precision plan
before it can authorize bills. A report with inadequate evidence fails the gate.

## F. Unsigned production artifact register

Every row below is a concrete deliverable with a closed method and gate. UNSIGNED
is the final-value field today. Its producer fills exact literals from evidence,
not from taste. A signature must name the actual artifact version and content hash;
a verbal claim that numbers are "tuned" is insufficient.

| Artifact / all fields it must produce | Final value now | Source and derivation | Owner / producing implementation | Acceptance and release gate |
|---|---|---|---|---|
| CAL-LEDGER-A: every week/tier line ID, units, allowed grades, cycle/version, allocation and tolerance | UNSIGNED calibration output | Sections C to E; state targets; measured gatherer report | 03 CONTENT; 13 UPKEEP; Fernando/service | All cycle fixtures, noncrafter purchase path, immutable prepay, four-week 20 report before enable; ledger_core.ts takes the prepay cap as an injected input with LEDGER_PREPAY_MAX_WEEKS as the shipped default: 25a proves 12 through the injected cap and raises the default only in the change that records the signed twelve-week CAL-LEDGER-A version and the 13a calendar-authority acceptance in state.md |
| CAL-VENDOR-A: buy/sell copper and quality for each eight basic IDs | UNSIGNED per-item table | Existing low-tier furnishing-comparable item/material values and recorded acquisition burden; no arbitragable sell floor | 03 CONTENT; Fernando | Exact per-ID price/quality fixtures and economy invariant; 20 release |
| CAL-RECIPES-A: per ten recipe reagent ID/count, resultCount, skillReq, itemLevelBudget (the craft gold-sink driver; the bronze hoe precedent in src/sim/content/recipes.ts carries 10), quality, station, acquisition and craft fee | UNSIGNED per-recipe table | Full concrete comparator rows above; existing training/gain/discount/fee semantics; protected-input and no-power checks | 04 CONTENT; Fernando | Every allowed archetype discount path, maximum batch, positive skill/gain and tradable output tested; 20 release |
| CAL-PATTERNS-A: three Marks amounts, output-derived qualities, source rows | UNSIGNED, sellValue already 100 | Existing pattern shape plus approved recipe burden; deterministic Marks valve | 04 CONTENT; Fernando | Exactly three one-to-one patterns, no luck route, all icons/source pages; 20 release |
| CAL-DECOR-A/B: each item decorCost and all render cost measurements | UNSIGNED positive integer costs | Measured shipping model triangles/primitives/materials/residency and legal layout packing; state room caps | 03/04 CONTENT with 19 ART; 22 extends; Fernando | Finite row bound, fully furnished maximum-layout LOW/perf capture; 20/27 release |
| CAL-UPGRADE: each tier's exact material bill and quoted fee/product conditions; bill legs are integer item units (D33, D89), never stackSize | UNSIGNED bill table; live fee SERVICE QUOTE | State ladder, existing eligible upper materials, approved acquisition burden, no intermediate/keystone | 21/32/40 CONTENT and SERVICE | Every tier noncrafter purchase path, safe overflow refusal, one durable receipt; 27/33/44 release |
| CAL-RECIPES-B: twenty complete recipe rows (per recipe: reagent ID and integer item units, resultCount, skillReq, quality, station, acquisition, itemLevelBudget, which drives the craft gold sink in src/sim/professions/crafting.ts), six pattern Marks costs, the nythraxis_housing per-row weight and the rift Draw 8 chance | UNSIGNED complete table | Manifest craft/surface/channel roster; comparator/economy calibration; existing raid/rift draw semantics | 22 CONTENT; Fernando | Exactly twenty outputs/two per craft; one luck channel plus Marks per pattern; replay draw-order proof; 27 release |
| CAL-HALL-CAP: material/copper allowance and service currency allowance, rounding, conversion version and retained donor identity | UNSIGNED normalization schedule; approved target 1 ledger-equivalent | R28 current Hall Ledger value and service-authoritative pooled balance, no game token arithmetic | 29 SERVICE/CONTENT/DB; Fernando | Account-across-alts concurrent cap, mixed contributions, refunds, the D78 end-of-life pro-rata refund by original receipt with the officer withdraw-to-guild-bank verb, and realm-week rollover; 33 release |
| CAL-HALL-STOCK: exact allowed pre-existing furniture IDs per completed hall tier and vendor presence | UNSIGNED stock availability/price table | Manifest A/B cosmetics only; actual completed project state | 32a CONTENT/SERVICE | No power/training bypass, deterministic hydrate, no artificial duration; 33 release |
| CAL-FAVOR: four rank thresholds, ledger/visit/Endeavor event weights, positive daily/account limits where needed, permanent rewards | UNSIGNED event/rank table | Existing deduplicable ledger/visit/completion records and approved cooperative effort calibration, state 4/+10 targets | 35 CONTENT; Fernando | Distinct real visits only, self/alt/farm prevention, idempotent bounded reward delivery, no loss on month reset; 39 release |
| CAL-ENDEAVORS: exact monthly objective/reward IDs, thresholds and contribution limits | UNSIGNED monthly content table | Existing cosmetic ledger/visit/content events; measured cooperative cohort and no-new-power constraint | 35 CONTENT; Fernando | Monthly authority boundaries; all objectives reachable without new profession/power; 39 release |
| CAL-SOCIAL: Showcase season anchor/result identity, exact cosmetic reward source and reaction rate | UNSIGNED anchor/reward schedule; R34 approved one/day | Section G; existing 13-week/50-entry targets and approved account rules | 36 SOCIAL/CONTENT; Fernando | Concurrent vote/book caps, privacy, close/restart/bounded reward proof; 39 release |
| CAL-DYES: eight recipes, item qualities/values, skills/stations, channel/mask/color values | UNSIGNED recipe and measured swatch table | Exact manifest dye roster; approved neutral-lit material board; existing Alchemy recipe/economy methods | 41 CONTENT/ART; Fernando | All eight obtainable; zero power; the apothecary-amenity condition/proximity gate (D90); actual copy consumption and masks; 44 release |
| CAL-SERVICE: every personal/guild Charter, Call, upgrade, later deed and second-home price; royalties, conversion and burn statement | SERVICE SIGNATURE REQUIRED | Accepted economy-service catalog/quote and counsel/Terms artifacts | 15/21/29/32/37/38/40/42 SERVICE | All three money gates, distribution capability, durable recovery and published exact policy |
| MEASURE-SPACE: room grid/dimensions, floor polygons, fixed anchors, paths and per-model bounds | UNSIGNED measurement artifact | Approved art/room geometry and maximum legal fixture construction, section H | 03/06/08/19/25/34 ART/CORE | Sim/render parity, arrival safety, physical layout and LOW captures before relevant content enable |
| MEASURE-BOUNDS: plot/layout/queue/log entry and byte limits, JSON codec, worst-case fixtures and the two 41a layout-share import bounds, the per-session layout_import lane budget (the NEW MsgLane member in server/msg_lanes.ts) and the per-account import budget (a bounded LRU map keyed by accountId in phase-26's idiom), both frames per window | UNSIGNED derived hard-bound artifact | Section H, actual legal catalog and schema parser bounds | 07/08/17/19/24/25/28a/29/31/34/41/41a CORE/DB | Reject oversize before parse/mutation, indexed finite growth, restart/concurrency tests before each wave |

The per-item tables expand over EVERY manifest row and every new recipe/pattern/dye
ID, not a sampled subset. The artifact author records the final exact table in this
workbook or a linked versioned appendix before activation; source paths and evidence
remain accessible after packet teardown. A future normal content release may revise
values only by producing a new signed version and preserving already paid bills.

## G. Month and season anchor derivation

Realm month is the authority UTC `YYYY-MM` derived from validated injected utcDay
(utcDay.slice(0, 7), or a utcMonth fed beside utcDay in feedRealmCalendar), never resetDay,
which is the 03:00 realm-reset civil day (D84). The fixture 2026-10-01T03:30Z (2026-09-30
23:30 in America/New_York) yields 2026-10.
Month start/end use the authority's civil calendar, never a client's timezone or a
fixed thirty-day approximation. Monthly progress resets; permanent Favor capacity
and placed property do not.

The Showcase epoch is the first enabled season's approved Tuesday realm-week anchor,
recorded verbatim in CAL-SOCIAL before enable. It is an operational activation
artifact, not an arbitrary invented historical date. Season index is whole realm
weeks elapsed from that immutable epoch divided by the existing thirteen-week
length, rounded down. A backwards/empty calendar cannot reopen voting or results.
Changing ward does not change a vote identity. Tie order is earliest valid entry,
then stable plot ID. Retain a durable season result and reward identity independently
of the bounded entry/vote tables. 36 owns entry, vote and book retention separately;
retention cannot delete the evidence required to prevent duplicate awards.

Guest-book daily consumption survives the visible entry lifecycle. File 36 owns NEW
freehold_guest_book_daily_claims in server/freehold_social_db.ts, with unique (account_id,
plot_id, realm_day_id). Its globally stable realm_day_id is the resetDay realm day (D84),
never utcDay, and preserves the signed CAL-SOCIAL calendar/reset binding across revisions.
The guest book opens from the existing gate-door interactable (the D4 object entity whose
prompt 26's knock already extends); 36 adds no new world entity. calendar_id/reset_id are
immutable references, not alternate uniqueness rails that reopen a day. Pruning to the
existing visible-entry cap, owner/moderation deletion or restart never clears that day's
claim. Current ACL/input, reviewed plot participant, conflict-safe claim, append and
deterministic prune share one transaction; failure rolls everything back.

NEW pruneFreeholdGuestBookDailyClaims performs bounded indexed cleanup only after
the nonregressing admission/closed-day watermark excludes that day for every supported
retry/restart/rolling-release peer. Recheck captured attempts after fence acquisition;
expired attempts refuse before cleanup. Unavailable retirement proof retains claims.
No guessed TTL or extra duration is introduced. Measure every growing social relation:
freehold_showcase_entries, freehold_showcase_votes, freehold_showcase_results,
freehold_showcase_awards, freehold_guest_book_entries and
freehold_guest_book_daily_claims. Each needs row/byte bounds, indexes/reverse-FK access,
expiry access, cleanup producer/batches, compatibility, export and deletion behavior.
Retain actual PostgreSQL plans/query counts, lock waits and peak admitted cleanup cost.
Separate visible retention from durable rate/reward evidence. The fixture proves
an author still cannot add another reaction after intervening authors, prune/deletion,
an alt/process or restart; only the next admitted authoritative day permits it.

## H. Measurement and finite-size derivation

No pixel/world-unit conversion, room dimension, collision radius, grid pitch,
parent height, query bound or serialized byte ceiling is guessed in this packet.
The art/space producer emits a measured machine-readable fixture manifest and its
source hash before placement/persistence activates. Every model row records raw and
shipping bounds, normalization transform, intended world height, transformed X/Z
footprint, safe collider radius or explicit walk-through class, vertical clearance,
occupied surface class, table top plane/polygon and child sockets where applicable,
and fixed ceiling socket clearance. Radius encloses the actual transformed solid
shape; `r: 0` is restricted to declared walk-through underlays. A rug may lie under
solid furniture without letting that solid furniture bypass collision or budgets.

Room records contain floor polygon/grid origin/pitch, doorway and arrival pose,
protected walking corridor, hearth/Strongbox/station/plinth anchors, camera navigation
volume and view path, structural roof/walls, and exclusion volumes. Door, structure,
roof and arrival path remain fixed. The grid comes from measured repeated room/model
modules; choose the coarsest exact compatible grid that supports the approved
furniture layout and prove it with fixtures. If the geometry has no compatible grid,
revise the authored art or submit a signed tuning change; never conceal drift in
floating-point epsilon. Precision/tolerance fields are measured export/codec error
bounds and tested at edge poses. Table child transforms follow the same measured
parent transform. Invalid ceiling clearance refuses placement.

For each tier, construct the maximal legal fixture set against approved costs,
plinths, amenities, floor/surface capacities and parent rules. Ordinary furnishing
costs are positive integer decor costs; fixed authored dressing is outside mutable
placements, and underlays are still budgeted. The mathematical upper envelope is
bounded by decorBudget divided by the smallest approved positive decorCost, rounded
down, plus independent plinth/amenity record capacities where stored separately.
Then tighten to physical legal packing if the accepted solver can prove that bound.
Never claim the tighter number without the witness/upper-bound evidence. Retain the
maximal legal fixture and a one-over refusal fixture. Account bounds include all
permitted plots; guild bounds include members' assigned plinth ownership, not an
unbounded per-member list. Ward bounds include all admitted plots/occupants.

Serialized limits derive from that finite row bound and actual strict schema limits:
longest approved IDs, bounded exact-copy/provenance fields using existing source
validators, declared numeric codec/precision, every legal tint/parent field and
revision, and all independent array capacities. Generate the worst-case canonical
JSON fixture, encode UTF-8 and measure bytes; account for wire envelopes, all five
saved layouts, import/share-code encoding expansion and nested structures. Published
limits must admit that valid maximum and reject one-over/oversized strings/depth,
nonfinite numbers and duplicate IDs before mutation or large allocation. Measure
parse/encode and DB row/update costs with that fixture. The DB owner specifies query
LIMITs and indexed cardinalities from these actual shapes and a workload deadline,
not a guessed universal JSON allowance.

Undo/redo history uses the approved maximum legal placement-row capacity as its
session bound under R18. Bound each exact inverse payload and the combined journal;
clear with an honest keyed explanation on plot/session change or incompatible public
revision. Funds, purchases, ledger credits and completed sales are outside placement
history. Save coalescing remains one running plus one pending dirty generation;
byte-bounded pending state, durable receipts and account/guild authority fences are
specified separately from the user's cosmetic layout capacity.

## I. UX and art constants

Every UX constant is imported by label from state Content numbers, including shared
spacing/type/motion/contrast/window/touch rules, the verified current-to-adopted theme
mapping, screenshot viewports and seed, existing camera envelope and authored/effective
light counts. This workbook does not fork those token values. The art author supplies
measured room/model/material values through MEASURE-SPACE and CAL-DYES. Three authored
room emitters is a ceiling; global allocation may supply two or one contributing
point lights. Essential placement footprints, blocked shapes/reasons, floor bounds,
capacity values and all admitted players remain readable in every graphics tier.

All inherited/source values are revalidated if the base tree moves. Record the new
fact in state before adjusting a dependent content, art or implementation record.


## J. Final artwork and legal evidence closure

All generated assets associated with the measured records above are produced with
Codex, not Claude. The [44a artwork closeout](phase-44a-final-codex-artwork.md)
reconciles the full feature-created placeholder icon/image inventory to finished
registered assets, provenance and desktop/compact/tablet plus LOW proof. It preserves
all earlier numeric calibration, per-wave art and activation gates. The final
[44b legal-team handoff](phase-44b-final-legal-handoff.md) records the actual signed
or outstanding external artifacts against the completed implementation and artwork.
An external signature remains a tracked release gate with its concrete producer;
it is not an unanswered product choice or permission to enable unsigned economics.
