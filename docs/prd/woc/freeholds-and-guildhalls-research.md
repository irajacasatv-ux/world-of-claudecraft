# Freeholds and Guildhalls: housing research and proposal

**Premise moved at the 2026-09-26 release sync (G1, docs/freeholds/state.md, "Premises the 2026-09-26 sync moved"):** officer-keyed guild authority in this document (layout, pay, upgrades, the fund, the store row, visit policy, succession) is a false premise since the release's custom guild ranks: "officer" is now a stamped bank tier, and guild ranks are a ladder with per-rank permissions. A ruling on the hall permission is owed before phase 28 builds, and every check here keys on the permission it names, never the Officer title.

> **STATUS: PACKET REQUIREMENTS ADOPTED 2026-09-06. Nothing is built.**
> The nine rulings in section 12 remain adopted. Fernando approved all R01 to R46
> recommendations on 2026-09-06, plus the closing Codex artwork and legal-team handoff. The
> authoritative decision record is [state](../../freeholds/state.md). This is the
> brainstorm deliverable for the "Real Estate" feature: a deep read of the codebase, the
> MMO housing canon, and the 2024 to 2026 web3 land record, folded into one proposal for
> World of ClaudeCraft. Fernando adopted every recommendation in section 12 on 2026-09-05
> and added one standing constraint: **do everything possible to keep the app stores happy**
> (section 8). The proposal was then re-read against PR #3872 (Masterwrought crafting and
> the Farming profession, merging into release/v0.42.0), and section 3 records what that
> changes. The six raw research lanes (with every source URL) sit beside this file in
> `docs/prd/woc/housing-research/`. A cited historical number does not authorize a runtime value. The economy service
> owns prices; Fernando owns new gameplay tuning. See the [content manifest](../../freeholds/content-manifest.md)
> and [numeric workbook](../../freeholds/content-numbers-workbook.md) for derivation and approval gates.
>
> **Revision note.** This text is the settled propagation, edited in place on 2026-09-06, of the
> proposal adopted on 2026-09-05 at revision `383fd7da83` (also the FernandoX7/add-real-estate
> head). Sections 7, 8, 9, 10, 13 and 14 were replaced (7 under D27, D29, D31 and D64; 8 under
> D28, D29, D30 and D65; 9 under D64 and D65; 10 under D40 to D46; 13 under D1, D29, D31, D38 and
> D50; 14 under D68 and D73 to D75). Section 3 carries two sentence edits (D5/D16 and D37), both
> marked inline, plus one anchor correction (the Maker's Bond `signer` field, review round A3 F1).
> The nine rulings in section 12 are unchanged and its addendum was corrected under D29. Sections
> 1, 2, 4, 5, 6 and 11 carry propagation edits (D15, D27 to D31, D33, D43, D44, D47, D48, D52 to
> D63, D69 and D20), and the 2026-09-06 review round added D76 to D93 citations where a sentence
> changed. D76 to D93 (R47 to R64) are applied as recommended dispositions and were approved by
> Fernando on 2026-09-06 (state.md, "Current phase"); every sentence below that cites one of
> them carries that status. The player deck and the six research appendices were edited the same day; appendix
> text rewritten after capture is marked Superseded with its decision beside the retained
> original.

| | |
|---|---|
| **Tier** | 3 - Flagship $WOC utility |
| **Ease** | 4/5 (new sim system, new IWorld facet, new service SKUs, one new item kind) |
| **Flywheel** | Every priced housing purchase settles in $WOC at the service; weekly upkeep pulls low-tier materials and farm produce off the World Market; deeds resell on the $WOC marketplace |
| **Sustainability** | Recurring sink (upkeep and per-placement furnishings) on top of a one-time land sale |
| **Release authority** | Counsel must accept the entitlement model, Terms and distribution flows; the economy service must accept settlement. Optional deeds need separate signed authority. No legal classification or store approval is claimed. |

## 1. The answer in one page

- **Name it Freeholds (personal) and Guildhalls (guild), never "real estate".** The
  in-game vocabulary for a purchased entitlement is already "charter" (`storage_charters.ts`),
  so the land title is a **Freehold Charter**.
- **Build both, personal first, as one system.** Freeholds are the many-payer loop
  (material upkeep, blueprints, trophies, a daily habit). Guildhalls are the social anchor and
  the pooled big-ticket purchase, and today guilds have no place in the world at all. One
  `freehold` sim module with two owner kinds (`account`, `guild`).
- **Instanced plots, not open-world land.** The existing dungeon slot pool supplies runtime claims,
  Dawnhold Castle is a working zero-combat interior, and the rift system already
  streams a layout descriptor to both hosts and publishes runtime colliders. Open-world land
  has no runtime seam and every scarce-land MMO on record produced land-rush griefing. Shared
  wards come in phase 3 on the same seam.
- **Separate use from checkout.** The intended online house uses a server entitlement.
  Purchases are admitted only for browser web and website-distributed desktop; the other
  distributions, including Seeker, are use-only. Optional deeds have the same web boundary.
  A management link is a separate, default-off capability. Counsel acceptance of the whole
  entitlement and destination flow gates enablement and store submissions (section 8).

- **Price in USD, settle in $WOC.** Whatever rail a player uses to buy Claudium (Stripe,
  SOL, USDC, or $WOC at a discount), the economy service settles housing revenue in $WOC:
  direct on the $WOC rail, market-bought on the others, then a published burn share and a
  treasury that never sells. Token demand exists whether or not the buyer ever holds it, and
  any discount is shown only when the current service quote supplies it. Settlement is a
  product contract, not a token-price or investment-return claim.
- **Upkeep: daily wear, weekly ledger, never destruction.** Condition ticks down a little
  every realm day; the repair is a weekly Steward's Ledger of low-tier gathered materials and
  farm produce, prepayable four weeks initially and twelve later, with an approved web
  repair purchase as a convenience. Below the condition floor
  the amenities lock; the house and its contents are never lost.
- **Trophies are the soul of it.** Initial account-wide eligibility covers every promised
  deed/relic/item/mark/mount/title/Perfected source, including newly completed sources while
  at home. Each qualifying source gets a truthful generic display and known provenance.
  Specialized Legend Stands, full item/mount models and difficulty finishes follow later.
  Unknown historical character/day stays unknown. Trophies are free and never sold.

- **Decor is a profession product.** Every craft gets a furnishing line from existing
  materials; furnishing blueprints are the existing `kind: 'recipe'` pattern items and follow
  the Masterwrought channel doctrine (raid, rift, and a deterministic quartermaster valve).
  Each placement consumes its own copy, so demand recurs.
- **On-chain deeds come after the gameplay, on the web only.** Metaplex Core with freeze and
  burn delegates, tradeable on the $WOC marketplace as its first "serialized collectible".
- **Non-negotiables stay intact.** The game never sells power. The token firewall keeps wallet
  and token vocabulary out of `src/sim/`. The Masterwrought power envelope (R5) and the farming
  calendar model (masterwrought R19) are protected assets housing must not touch. Counsel gates
  the initial entitlement model and Terms, and separately the later optional deed.

## 2. What the codebase already gives us

The three codebase lanes (`housing-research/code-*.md`) are historical seam surveys.
The adopted packet controls new work; its paths and behavior must be re-verified at the
implementing file. Their observations do not mean that housing or its authorization exists.

**Payment rails.** Claudium is bought with Stripe, SOL, USDC, or $WOC (`ClaudiumRail` in
`server/claudium_proxy.ts`); the economy service builds the transaction and computes the burn
and treasury split, and the client signs through the existing `nativeSignAndSend` path. The
bank-storage SKUs (`src/sim/content/storage_charters.ts`, `server/storage_purchases.ts`) are
recovery precedents, not a mandate to replace adopted account entitlement grants. Repeated
Calls and pooled spends additionally require durable operation receipts and recovery; an
account grant alone does not make every spend exactly once. There is no platform
IAP anywhere in the repo today, and the native wallet is enabled only on the Solana dApp
Store build for Seeker devices (`src/net/wallet_capability.ts`).

**Ownership precedents.** Account-wide unlocks live in `accounts.cosmetics` and ride the
`self.cosmetics` wire. On-chain ownership has a working claim-once, re-verify-on-use pattern:
the Seeker Genesis Token entitlement (`server/seeker_entitlement.ts`,
`seeker_ownership_verifier.ts`). Optional deeds may borrow claim/re-verification ideas for service-side transfer authority.
Native housing access remains the server entitlement and never depends on an NFT check.

**Instancing.** An instance is a region of the one Sim (an x-band per dungeon, slots stacked
along z), claimed on entry and keyed `solo:char:<id>` or `party:<id>`, reaped 300 seconds after
it empties, never persisted. `dawnhold_castle` is a zero-combat walk-in palace with
`spawns: []` and a static door. Rifts prove the two hard parts: a small descriptor crosses the
wire and both hosts regenerate geometry deterministically, and `setRiftRegion` publishes
runtime colliders. Furniture must follow the rift model, never one entity per piece.

**Professions and materials.** Six crafting stations exist as `StationDef` records with a
20-yard proximity check that takes a station list (`inRangeStationTypes`), so a house station
composes in without touching recipes. Nine node materials in three tiers (copper, iron,
thorium ore; ironbark, ashwood, elderwood logs; silverleaf, goldleaf, sunpetal herbs) plus
corpse harvests and vendor staples are the upkeep and furnishing inputs, plus farm produce
(section 3); fine grades stop at gather tier 3 (state.md Material-tier facts). The content
manifest uses current item IDs and source recipes; upkeep and upgrade eligibility must not be
reconstructed from that historical shorthand. The professions
design doc already sketched an off-wheel Carpenter and Mason lane "so housing and cosmetics
never pressure the combat wheel"; the adopted scope excludes new Carpenter/Mason crafts from this packet.
File 43 produces a measured future-expansion handoff only.

**Trophy sources.** Reliquary relics are a closed union (item, mark, mount, weapon skin,
title) and deeds carry cosmetic-only rewards; the reliquary doc explicitly defers "housing
museum props". The historical source families include: Thunzharr, Nythraxis, Ignivar and Varkhul,
Korzul, Morthen, Vael, Ysolei, the Wildheart High Priest, the live mount roster, the realm-rare
`slain:*` marks (mounted heads), seven armor sets (stands), and profession specimens.

**Time and decay precedents.** There is no durability or repair mechanic anywhere, so
"condition" is a new concept. The deterministic daily key is `ctx.resetDay` (fed by
`server/raid_reset.ts`, empty in headless), which honor, delves, battlegrounds, and now the
Wyrmfall Core daily and the weekly Maker's Ember roll over on.

**Delivery and audit.** `PostOffice.mailSystemParcel` with a custody ref delivers exact copies
to offline characters exactly once. Economy telemetry books copper flow by command source; a
housing command needs its own source so it does not land in `other`.

**Gaps that are real work.** No remote bank (every bank op requires `nearBanker`); no
guild treasury outside gold; no guild-level deeds or achievements; no player-placed
persistent object (feasts are transient by design, see section 3); no runtime overworld
geometry; every touch device boots at the LOW preset; and the four coordinators are at or
near their line ceilings, so every piece lands behind the SimContext, IWorld, RouteDef, and
painter seams.

## 3. What PR #3872 (Masterwrought and Farming) changes

Reviewed 2026-09-05 at head `0f53c92ff7` (1,872 files, base release/v0.42.0). It is the
professions endgame: Masterwrought apex crafting across all ten crafts, the Perfecting stage
and the orange promotion, Farming as the fifth gathering profession, shared feasts, and the
chase materials that ride the new raid. Housing gains from it in six places and must respect
it in three.

**Farming is a between-sessions system with the persistence shape housing needs.** Plots are
static content rows (`FARM_PATCHES`, four hubs on a tier ladder: Eastbrook, Fenbridge,
Highwatch, the Evergarden parterre) with per-player state persisted in `CharacterState.farmPlots`
under absolute deadlines in the authority's own clock base, load-side allowlists, a duration
clamp, and a zero-clock offline guard (`farm_persist.ts`, `farm_projection.ts`). That offers clock and validation precedents (D5/D16: house state is its own account row, never the character blob): bed ids never renumber, hidden outcomes never cross the wire, and
the client never subtracts a clock the authority did not use. The farmer's watch fee
(`farm_watch_fee.ts`) is paid in kind from produce with a fixed, published consumption order:
the model for how the Steward's Ledger consumes materials.

**Farm produce joins the Ledger; the house never grows crops.** Grain and vegetables are the
third gathering input family beside meat and fish, market-listable, and additive to every
bill (masterwrought R17 and R18). The Steward's Ledger adds a produce line beside ore, wood,
herb, hide, and cloth, which is the demand lever Fernando wants. But bed counts are "part of
the pacing budget, not a balance knob" and farming's gain curve is tuned against a
calendar-days-to-cap model built from real bed counts (masterwrought R19), so a Freehold
garden must add zero beds: it is a living tableau of the owner's real plots (growth stage,
ready glow, withered warning, the Harvest Journal on a board), a farmer NPC as the Steward's
flavor, and nothing that plants. The provisioner firewall test gets an explicit allowlist row
for the upkeep sink.

**Feasts prove player-placed objects and are deliberately not property.** A placed feast is a
real `kind: 'object'` entity riding the normal snapshot, transient in `SimContext.feasts`,
torn down by the room roster, with placement height sampled once from the movement floor
(`feast_placement.ts`). Two consequences: a feast already works inside an instance, so a
Guildhall feast night (the tier-4 party feast and the three apex role feasts) is native on day
one; and furniture must be the persisted, descriptor-based counterpart, never a reuse of
`FeastState`.

**Masterwrought gives housing its best trophies.** A Perfected piece promoted to legendary
carries a player-chosen name and the maker's signature (the Maker's Bond `signer` on
`ItemInstancePayload` in `src/sim/types.ts`, which the professions UI presents as craftedBy). A
Legend Stand that displays the named item with both names is the single most personal trophy
the game can offer. The new deeds map directly: `prog_legendmaker` (a plaque), the grandmaster
deeds for jewelcrafting and inscription (workshop banners), `prog_farming_100` and its
Harvestmaster page (a golden sheaf), the four regional first harvests (garden markers),
`col_golden_harvest`, `prog_field_to_feast`, `col_deepest_cast`.

**Blueprints already exist.** The `kind: 'recipe'` pattern item with `resolvePatternLearn`
(learn on use, consume one copy, tier gate through the shared band math) is the furnishing
blueprint. Housing adds ONE item kind, `furnishing`, not two. Furnishing patterns follow the
R8 channel doctrine (raid tail groups, rift clear draws, the Heroic Quartermaster) and its D13
rule: a luck-gated drop is never a pattern's only faucet, so every furnishing pattern also has
a deterministic vendor or quartermaster row. No pattern takes a Reliquary page (permanent
exclusion); furnishing items may.

**Hall-shared stations have a precedent.** The Master's Field Forge places a `partyShared`
station whose type satisfies every party member in range (`mobile_station.ts`,
`partySharedStationSatisfies`). A Guildhall station is the same predicate over "members
present in the hall". (D37) Repairs, crafts and Ledger draws at home all go through the one
`reagent_sources.ts` planner, never a second implementation: home crafting keeps the shared
bags-first-then-vault behavior, and Ledger payment proposes explicit bags-only, vault-only or
automatic bags-then-vault modes; preview and atomic deduction use the same selected mode and
never silently fall back.

**Three things housing must never touch.** Wyrmfall Core, Maker's Ember, and Sundered Essence
are the Perfecting keystones with a tuned four-to-six-week cadence: no ledger, no furnishing
bill, and no upgrade ever asks for them. The R5 power envelope (at most two worn apex pieces,
one legendary, about five percent over raid BiS) is the protected asset: no housing amenity
adds throughput, and the only buff that can exist in a house is the Well Fed a feast already
grants. And "need the output, never the slot" (R18): nobody needs a profession to own,
upgrade, or maintain a house, because every Ledger material is market-listable.

**One correction to the first draft.** Inscription and Jewelcrafting are no longer empty:
the PR gives them apex recipes (the Deed of Making is inscription's first skill-125 rung, and
the Prismglass Setting is jewelcrafting's). Housing gives them a second, non-combat line, not
their first.

## 4. What the housing canon teaches

Full sources in `housing-research/web-mmo-housing.md` and `web-upkeep-ux.md`.
This is dated comparative research, including secondary reports and opinions. It is not
a current feature inventory, an evidence-based balance formula or approval for WOC power perks.

| Game | What worked | What failed |
|---|---|---|
| WoW Midnight (2025 to 2026) | Instanced neighborhoods of about 50 plots; cheap gold plot, no lottery, no upkeep; 12 house levels raise a decor point budget; decor from achievements (retroactive), professions, vendors, raids; raid trophies tiered by difficulty; free placement with dye and parenting | "No reason to go home"; decor grind; frozen storage cap; a cash-shop exterior priced at $40 read as a broken "player-first" promise |
| FFXIV | Deep decorating; FC workshops, airships and submarines as guild crafting projects | Plot lottery on fixed scarcity; 45-day demolition that resumed after a nine-month pause and erased thousands of houses; "must stay subscribed" resentment |
| ESO | Gold or crowns for nearly every home; furnishings through all five crafts and achievement vendors; rare plans as a market | Furniture caps frozen from 2017 to 2026; subscriber slot doubling; 24-visitor cap limits guild halls |
| OSRS Player-Owned House | The cited reports value useful rooms and accomplishment displays; its power perks are excluded from WOC | The survey is not exhaustive; it establishes no absence of defects or player complaints |
| EverQuest 2 guild halls | Tiers by guild level; amenity slots; weekly upkeep from a pooled escrow prepayable twelve weeks; nonpayment locks, never destroys | Status grind |
| WildStar | Plug sockets (stations, banks, nodes, challenges); numeric editor with parenting; rest XP at a neighbor's plot was the best "reason to visit" ever shipped | The game died for unrelated reasons |
| New World | Weekly tax that only locks perks when unpaid; three houses; trophies per house | Tax had to be cut 90 percent when income broke; tie upkeep to income |
| Ultima Online, ArcheAge, EVE, SWG | Emergent cities and player economies | IDOC scripts, land-grab bots, "abandoned" loot drops, one-man cities: every open-world scarcity system was gamed |

The twelve lessons, ranked: never destroy a house or its contents on a timer; give the house
a job; upkeep cheap, weekly, prepayable, with a grace window; no land scarcity; trophies
earned in content and tiered by difficulty, shown with provenance; cap by point budget and
review measured headroom on a published cadence; bounded placement with later parenting and layout save;
route decor through every profession; build the reason to visit; guild halls as pooled-escrow
shared plots, never auctions; cosmetic-only store with an earnable path to everything inside
the house; performance budgets from day one (per-plot decor counts, light limits, visitor caps).

## 5. What the web3 land record teaches

Full sources in `housing-research/web-web3-land.md`.

**The graveyard.** Decentraland LAND fell about 89 percent and The Sandbox about 95 percent
from peak; Otherdeeds went from about $5,800 at mint to about $210; Ember Sword took $203M in
land pledges, shipped early access, and shut within six months; Illuvium sold $72M of land,
then cut 40 percent of staff. Caladan's April 2026 study counts more than 90 percent of web3
games as dead. The common cause is selling land before there was anything to do on it, on a
fixed supply that priced out late players and collapsed anyway.

**The survivors.** Pixels land held because a plot is a production input with exclusive
industries; Big Time SPACE (the closest analog: an instanced personal expansion that hosts
crafting workshops, sold in rarities and sizes) kept its utility even as prices fell, and its
own post-mortem judged five simultaneous rarity tiers too many for buyers to price; MapleStory
N made the token the only way to create items and burns 20 percent of quarterly revenue.

**Economic analogies are not market forecasts.** The cited Immutable and Helium patterns
explain the required service settlement flow; they do not prove WOC demand, token appreciation,
retention or revenue. Historical land floors and failure rates above remain dated research,
not acceptance criteria. The signed service artifact must publish the actual conversion,
burn and treasury policy before housing revenue is enabled.

**Legal claims require an actual opinion.** No blanket securities, MiCA or proposed
CLARITY exemption follows from a unique plot ID, collection metadata, or absence of profit
rights. The counsel artifact must assess the complete rights and distribution model under
current law. Revenue share, rent, fractional ownership and investment promises are excluded
as product constraints, not asserted legal safe harbors.

**Chosen Solana technology, later.** Metaplex Core offers the required asset/plugin model.
Its published approximate 0.0029 SOL base-asset benchmark is dated context, not the service's
mint quote. Asset-level Permanent Freeze and Burn delegates are capabilities, not permission
for upkeep destruction. Low condition never destroys an entitlement or its contents; signed
transfer/moderation and irreversible-burn authority is required. Guild ownership remains a
server record, not a multisig-deed experiment. See section 9 and the corrected research lane.

## 6. The proposal

### 6.1 Pillars

1. **A home is a record of feats.** The first thing a visitor sees is what you have conquered.
2. **A home has a job.** Strongbox, stations, a hearth to return to, a guild's muster point and
   feast hall.
3. **Priced housing uses the accepted service settlement; crafted goods and upkeep use the
   item economy.** Free trophies, visiting and decoration do not require a token payment.
   None of it touches power.
4. **Nothing you own is ever taken from you by a timer.** Neglect dims the house; it never
   destroys it.
5. **It is beautiful on a phone at the LOW preset,** with the same actionable information on every supported online build whose
   entitlement model is approved. Offline play starts with a fresh Inn Room, without paid progression.

### 6.2 Ownership and where it lives

- Account owns the personal Freehold; guild record owns the Guildhall. Every account
  character shares the same personal home. The free Inn Room is the purchased Cottage's
  predecessor, not a second plot; existing trophy records and placed copies carry forward.
- One personal plot initially and one hall per guild. A later second-home SKU has independent
  condition, prepay and visits, with stable identity from initial persistence. It is granted
  at Cottage tier and upgrades through the same build projects as the primary (D93). Its
  adopted 1.5x material-line schedule is a WOC tuning decision, rounded up per approved
  integer line on every upgrade and Ledger line, not an ArcheAge formula; there is no
  second-home upgrade refusal. The service owns the SKU price.
- Reuse the dungeon slot allocator under D15, not a new arbitrary coordinate band. Runtime
  claims are finite; account entitlement is not scarce. An unavailable slot or conflicting
  realm claim gives busy/retry without an ownership waitlist or a lost home. Internal account
  and guild keys never become public plot identity.
- Interact at the Eastbrook quay gate to choose own home or friend lookup, then explicitly
  enter. Proximity does not teleport. Authorized homes remain visitable while the owner is
  offline. Later gates (Fenbridge in 25a) reuse this flow. Leaving uses the remembered safe
  source gate.
- The Hearth Key uses the approved shared-account cooldown and normal combat/death/jail
  admission rules. NEW 07 `server/freehold_hearth_db.ts` owns `account_freehold_hearth`,
  `FREEHOLD_HEARTH_SCHEMA`, `loadFreeholdHearth` and `advanceFreeholdHearthOnClient`;
  07a advances the account row atomically with accepted remote entry, never from cached
  plot UI. Physical gate entry, refusal and already-home no-op do not advance it. Later
  destination choice in 42 shares this row across homes and alts. Transfer neither copies
  nor clears either account's cooldown. A carried Key is inventory usability, never
  the authorization credential (the ux-spec Hearth Key contract, mirrored by file 06);
  account ownership and current admission rules authorize, and using it consumes nothing.
- The free no-upkeep Inn Room has a bed and three plinths. The first display requires a real
  qualifying accomplishment; a new account can have an honest empty plinth. Paid tiers need
  online entitlement; offline uses a fresh Inn Room and only explicitly authorized dev fixtures.

### 6.3 Tiers

Five tiers named by the item-quality ladder players already read, bought once as land and then
upgraded in place (the WoW house-level model). Upgrades are build projects: a Claudium fee plus
a bill of crafted materials, so each upgrade is itself a profession sink. The Big Time lesson
(five simultaneous SKUs confused pricing) does not apply to sequential upgrades of one plot.

| Tier | Freehold | Guildhall | Rooms | Decor budget (points) | Trophy plinths | Amenity slots | Illustrative fee |
|---|---|---|---|---|---|---|---|
| Common | Cottage | Meeting Hall | 1 | 60 | 4 | 1 | $20 land |
| Uncommon | Lodge | Great Hall | 2 | 120 | 8 | 2 | $25 plus materials |
| Rare | Manor | Bastion | 3 | 200 | 14 | 3 | $50 plus materials |
| Epic | Keep | Fortress | 4 plus a courtyard | 300 | 22 | 4 | $100 plus materials plus a prestige deed |
| Legendary | Citadel | Citadel | 5 plus a courtyard and tower | 420 | 32 | 6 | $200 plus materials plus a prestige deed |

Prestige deeds gate the top two tiers on accomplishment, not just money (a Reliquary curator
rank, a raid clear, or the Legendmaker deed), so the tallest house on the ward is also a feat.
Upgrade bills select concrete approved worksheet rows: upper node fine inputs
`fine_thorium_ore`, `fine_elderwood_log` and `fine_sunpetal_herb` are gather tier 3 in
`src/sim/professions/material_grades.ts::MATERIAL_GRADES`. There is no tier-4 node
fine row. Upper produce is separately sourced from actual
`src/sim/content/farm_crops.ts::FARM_CROPS` IDs, including its tier-4 crops and their
`fineProduceItemId` values. Crop tier, gathering tier, tool tier and price band are
not interchangeable. No bill uses protected Perfecting keystones. Guildhall fees are pooled through the Hall Fund and roughly 3x the freehold
figures as illustrative service references, never game-side multipliers. File 20 owns
a published capacity review every second release; increases require measured LOW headroom,
not an automatic promise. Personal top tiers propose the same account-level OR over existing
`prog_legendmaker`, `col_reliquary_rank_5`, `dgn_nythraxis`, `dgn_ignivar`, or `dgn_varkhul`
credit. Guild top tiers use their own recorded qualifying raid-clear deed. There is no new
profession requirement or escalating invented grind. Upgrades preview exact-copy overflow
and refuse before new fee/material mutation if bags cannot safely accept it. Upgrade
contributions take an explicit source-mode argument per D37 (bags, or the vault inside the
owner's own claim under D18/D47); the bill counts item units per D33; a confirmed fee whose
last leg cannot finish because bags are full re-attempts without a second fee (D89).

### 6.4 Trophies

- File 17 owns account-wide eligibility for all promised deed, Reliquary page/relic, slain
  mark, item, weapon-skin, mount, title, armor-set, curator-rank and Perfected sources. A
  discovered item does not need its whole page completed unless that trophy's actual source
  is page completion. Source-change refresh is event-driven and idempotent, including alts
  and accomplishments completed while home, with no new per-tick catalog scan.
- Every qualifying initial source gets a truthful generic display. Initial heads, busts,
  plaques, set stands and mount markers follow the art manifest. File 23 later supplies full
  statues, actual item/weapon models, named Legend Stands, live cosmetic mount displays,
  title/grandmaster banners, golden sheaf and difficulty finishes. File 24 owns the garden.
  Every promised boss and source resolves initially even when its bespoke form comes later.
- Trophy records are free, non-item and nontransferable. A possession-based display becomes
  inactive when its required copy leaves ownership; accomplishment history remains intact.
  Maker signature, custom item name, achieving character and source day are separate facts.
- Inspect uses the original authoritative provenance when known; unknown character/day/maker
  stays explicitly unknown rather than using entry or reconciliation time. Owner and visitor
  see the same approved public facts, with the existing source link when available.
- Hidden sources remain hidden across visible copy, search, model names, tooltip, aria and
  alt text. Generic silhouettes never disclose an unrevealed boss or reward.
- File 31 introduces guild-first-kill records from actual eligible clear participants and
  their guild at the clear. Current membership never fabricates historical guild credit.
  Existing `src/sim/deeds.ts::onDungeonFinalBossKilledForDeeds` mutates credited
  recipients synchronously. `GameServer.detectActivity` in `server/game.ts` observes
  `deedUnlocked`, collects `pendingDeedRecords` and requests ordinary `saveCharacter`;
  no dedicated all-party clear-save transaction exists. NEW 31 owns immutable clear
  candidate capture, bounded pending work, exact saved-prefix association, 07a durable
  source claim and postcommit publication. Distinct clears survive delayed coalescing,
  including clears without a new character deed. Original recipient order elects the
  carrier, not asynchronous timing; character rewards and actual save order remain intact.
  Member-assigned plinth permissions arrive through files 28/31 and section 6.8.
  Housing capacity never gates gameplay (D83): guild-clear recording capacity never refuses
  `GameServer.join`, `enterDungeon` or a respawn; exhaustion records a bounded, auditable
  clear-not-captured gap with an operator alert, and character rewards, loot and existing
  deeds are unchanged.

### 6.5 Furnishings and blueprints

- **One new item kind:** `furnishing` (placed, consumed on placement, returned to bags on
  pickup). Blueprints are the existing `kind: 'recipe'` pattern items, learned through
  `resolvePatternLearn`, named with the shipped per-craft prefixes (Plans, Pattern, Design,
  Schematic, Technique, Recipe).
- **Every craft gets a line from existing materials:** weaponcrafting (racks, iron fittings),
  armorcrafting (stands, braziers), tailoring (rugs, curtains, banners), leatherworking (hides,
  chairs), engineering (lamps, clocks, gadgets), alchemy (dyes; the dye picker is enabled by
  the apothecary station amenity, with no new amenity kind, slot or station GLB, D90), inscription
  (paintings, maps, scrolls), jewelcrafting (chandeliers, gem lamps), cooking (feast tables and
  food props, beside the real feasts), enchanting (glow effects, enchanted lights). Farming supplies existing produce; cooking recipes or gold vendors supply produce
  decoration. Farming does not become a new craft. Fixed ceiling anchors for chandeliers
  arrive with the later typed-surface editor, and dyes arrive with file 41.
- **Sourcing ladder, the R8 doctrine:** gold vendor basics and crafted staples; Wave A's
  three patterns are Marks-only. Each later rare pattern has one named raid or rift luck
  channel plus a deterministic Marks row. No delve pattern channel is added. Seasonal
  furniture sets are outside this packet; existing decoration never expires.
- **Roster:** the adopted Wave A manifest has eight vendor and ten crafted furnishings
  (eighteen outputs), with three pattern recipes inside the ten. Wave B adds twenty crafted
  outputs, counting produce decoration within that roster. Materials, prices, recipe skills,
  drop weights and decor costs require the referenced manifest and approved numeric workbook.
  Every craft uses existing tradable inputs; new Carpenter/Mason crafts are excluded.

- **Furnishings are marketplace-eligible at every rarity** (the mount rule), so they trade for
  gold on the World Market and for $WOC on the marketplace. Patterns take no Reliquary page.

### 6.6 Amenities: the house's jobs

- **Strongbox:** bank access at home (convenience; the game already sells bank capacity for
  Claudium), built in without amenity-slot cost and without new bank capacity. A station
  uses an amenity slot. Direct Materials Vault chest arrives at Manor; permitted home
  crafting may draw the personal vault earlier through its separate authorization. Guild
  bank access uses its own member/officer rights; a general nearBanker flag cannot grant all services.
- **Stations:** forge, kitchens, apothecary, tannery, loom, toolworks as buildable amenities
  composed into the station list; recipes and their `stationType` gates are unchanged; a
  Guildhall station serves authorized members present, including permitted draws from their
  own personal vault. Station choices remain bounded by the tier amenity slots.
- **Kitchen Garden:** a living tableau of the owner's account-wide real farm plots.
  NEW 17 `server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage`
  and `server/freehold_account_sources.ts::createFreeholdAccountSourceLoader` provide
  the bounded owner-account aggregate; 24 extends their fixed versioned projection with
  normalized farm state and source farming proficiency, without a parallel loader/table.
  The current local character's whole live slice, including a confirmed empty slice,
  replaces that character's saved slice. Other sources remain explicitly saved; failed
  or incomplete coverage never implies empty. Saved-derived ready status remains visibly
  qualified as saved. Guests receive only safe public bed/crop/stage/status facts, without
  source identities, private proficiency, inventory or timers. The owner's board opens
  only the current character's Harvest Journal, and a farmer NPC supplies Steward flavor.
  It plants or harvests nothing and adds no beds.
- **Feast hall:** the Guildhall's long table is where a cook places the party feast or an apex
  role feast; the feast is the shipped object and the Well Fed it grants is the only buff that
  ever exists in a house.
- **Hearth:** the emotional center; the Hearth Key returns you here. A lit hearth is the
  visual condition meter.
- **Guildhall extras:** muster board, calendar board, a pledge-board mirror, and a war table
  that shows authorized guild raid lockouts and actual recorded first kills. The first-kill
  section is explicitly unavailable until file 31, never a generic standings redirect; 31's
  first-kill projection reaches the client through the bounded guild-domain read 30a names,
  with keyed ready and empty states and no new facet member (D82).
- **Explicitly excluded:** rested XP, stat buffs, drop-rate or gathering buffs, extra farm beds,
  teleports that skip content. Convenience only.

### 6.7 Upkeep: the Steward's Ledger

- The retained working targets are condition 0 to 100, personal wear one point per realm
  day and guild wear two. They are WOC choices approved by R05, not classic-era formulas.
  Authority supplies the calendar; the sim uses injected time and never calls a network
  service or wall clock. Wave A hearth appearance and accessible text reflect condition.
- Each bill includes produce plus allowed rotating nonproduce families within the existing
  three-to-five-line target. One published versioned schedule serves each realm week.
  Exact eligible IDs, quantities and substitution/rounding rules come from the content
  manifest and signed calibration worksheet before enablement. Do not infer quantity from
  an inventory maximum stack or invent a new input family.
- Never use Perfecting keystones, gear intermediates or quickening catalysts. Every input
  can be obtained through the market without owning a profession. Repair from 93 costs the
  same flat current bill as repair from 60; missed weeks do not accumulate back bills.
- The Cottage/Citadel 10%/20% weekly gathering-output figures are measurement targets, not
  published ArcheAge balance. File 20 produces the four-week telemetry report and reviewed
  rate artifact; the service owns Call quotes. Missing/stale market prices cannot become a
  guessed conversion or a guaranteed cheapest-rail claim.
- Authority-recorded World Market or economy-service outages suspend wear and debt without
  catch-up. A wholly suspended billing period consumes no prepaid credit; carry it forward
  without repricing. Partial periods keep the flat repair bill without proration or added
  outage charge. Persist the intervals and operational resumption evidence.
- The Master Builder's Call is a permitted web/website-desktop purchase only. Its confirmed
  quoted effect satisfies the current unpaid bill and restores condition to 100; if already
  paid, review clearly identifies repair-only. Future credits remain unchanged. The 1.5x
  reference is an adopted service pricing target, never game-side payment arithmetic.
- Prepay covers four weeks initially, twelve from file 25a. The latter has a primary EQ2
  precedent: [Raising the Banner, GU49](https://www.everquest2.com/news/imported-eq2-enus-1916).
  Review immutable future bill identities and the full material batch. Explicit bags-only,
  vault-only and automatic bags-then-vault modes govern both preview and deduction.
- Amenities work at condition 30 and above; they pause strictly below 30. Entry, visiting,
  placing, moving, removing and placement undo/redo remain possible even at zero, subject
  to their independent access rules. No home, contents or trophy history is destroyed.
  The later finish treatment does not delay Wave A's readable hearth-condition feedback.
- The adopted protective pause after seven absent days and three repair-free return days
  are WOC policy, not Conan or Albion rules. Persist the prior absence/grace transition
  before updating presence; alts cannot repeatedly reset grace. Guild absence uses eligible
  member presence. Ordinary upkeep never burns or freezes native housing access.
- Guildhall upkeep uses the Hall Fund. Its anti-dominance contribution allowance is a weekly
  per-account ceiling (a cap, never a requirement to donate) with an accepted resource/currency
  schedule, not a GW2 cap.
  No demolition, governor-set rates, inflation-driven rate increases or pay-or-lose prompts.

### 6.8 Guildhalls specifically

- The guild record owns the hall. Officers manage layout and projects; members manage only
  their assigned personal trophy plinths. Departure detaches their displays safely while
  preserving personal unlocks/provenance. Officers cannot sell or transfer those rights.
- Guild-owned halls admit current members always; the leader or an officer sets guild, public
  or private visiting (friends is refused for the guild owner kind), public admission is capped
  by the tier column, and non-members enter as guests under the ejection rules (D77). Disband
  is the 28a tombstone disposition: the pooled service balance is refunded pro rata to donors
  by original receipt and fund materials and gold are withdrawn to the guild bank first (D78);
  a guild that holds any keep-forever housing row is never hard-deleted (D79).
- The economy service owns pooled Claudium balance and debit/credit/refund history. The game
  mirrors absolute versioned results. Material/gold contributions and their audit/cap update
  are atomic. Members can read the contribution ledger; officers authorize paid projects.
- R28 adopts one current weekly Hall Ledger-equivalent per account per realm week across
  alts. The signed calibration artifact defines permitted resource/currency amounts and
  rounding without game-side token conversion. No cap or rate is activated by this draft.
- Projects complete when their approved material and fee requirements are met, without an
  artificial multi-week wait. Shared project progress is owned by file 32; completion trophies, vendor
  rewards and vault work are concrete file 32a obligations. Visiting vendors offer only approved cosmetic furnishing stock.
- Feast night uses existing feasts and their unchanged Well Fed effect. The muster board,
  bank, hall stations and authorized raid-lockout/first-kill war table give shared utility.
  File 30 owns amenities; 30a owns muster/war-board projections and later first-kill wiring.

### 6.9 Visiting and social

- Private/friends at first launch; guild/public modes arrive with file 26. Entry checks live
  authorization even if a roster was cached; friend admission is the named owner character's
  outgoing friend list, never the visitor's own list, and a block row on either side refuses
  (D76). Visitors can enter authorized homes while the
  owner is offline; finite runtime capacity yields honest retry. Owner-account sessions do
  not count as visitors, and graphics presets never hide admitted players.
- Switching to private stops new entry; already admitted guests may finish unless the owner
  chooses End visit. Blocking, revoked friendship/membership or End visit safely ejects
  immediately. During building, guests see accepted revisions and a decorating status only,
  never the owner's ghost, history, palette, camera or payment facts.
- Wards arrive later as shared exteriors with plot-entry privacy separate from public travel.
  The adopted working bounds are 50 plot slots and 24 admitted occupants, not an entity
  culling budget. The largest represented guild anchors the ward with stable-ID ties; a
  ward without a guild has no hall anchor. Assignment requires authoritative capacity.
- Monthly Endeavor progress resets on the authority's UTC month; Favor-unlocked decor
  capacity is permanent. Existing furnishings are never removed at rollover. Exact weights
  and thresholds require the approved workbook; no automatic unbounded budget increase.
- Showcases are realm-wide, opt-in and filtered by current privacy. One authenticated account
  vote per realm season, no self-vote or reset by ward move. Proposed 13-week seasons use the
  published realm-week anchor; ties use earliest valid entry then stable ID. Durable result
  identity precedes bounded cosmetic reward delivery.
- Guest books open from the existing gate-door interactable (the D4 object entity whose
  prompt 26's knock already extends) with closed wave/cheer/admire reactions, no free text.
  Proposed rate is one per account/plot/realm day, where the day is the realm reset-day key
  `resetDay` (D84), with the retained 50-entry cap. Names and
  reactions still require privacy, blocking and moderation. Each social table has its own
  bounded retention policy; reaction-only does not mean moderation-free.

## 7. The $WOC flywheel

The adopted settlement goal is service-owned $WOC settlement for eligible priced housing.
It does not guarantee token appreciation, market-price increases, store approval or an
investment return. Gathering, ordinary gold trades and free trophy display stay their own
systems. Accepted catalog/quote, counsel and published Terms gates apply to every priced
file, including 32 and 40, before any purchase can be enabled.

| Housing action | Player route | Authority and limits |
|---|---|---|
| Charter and tier fee | Claudium on approved browser web or website desktop; upgrade materials in game | Service catalog and quote own amount, eligible checkout and settlement; game receives validated grant |
| Steward materials/prepay | Selected bags/vault source in supported housing clients | Versioned approved material bill; no token conversion |
| Master Builder's Call | Same permitted checkout surfaces as Charter | Operation-bound current-bill/repair effect; recover original receipt, never charge again to resolve ambiguity |
| Later optional deed mint/resale | Approved web or website-desktop flow | Signed deed authority, full quoted fees/royalties and explicit furnished-sale manifest |
| Furnishings | World Market for gold; Exchange where its existing capability permits | Per-copy custody and existing market rules; trophies never trade |

The adopted 25% burn/75% treasury split and illustrative resale 3%/7%/90% split remain
service references requiring signed publication, not game-side formulas. No royalty
amount is invented. A discounted $WOC rail is displayed only when returned in the current
valid quote. A payment may use already-held tokens; it is not proof of a new market buy.
The intended non-selling treasury policy requires service acceptance and public wording.

Housing adds no combat, XP, drop, gathering or training bonus. Existing consumables retain
existing effects. Optional deed ownership is proof/transfer functionality, not a native
housing key or a new combat entitlement.

## 8. Distribution capability and release gates

This matrix is the adopted stricter product scope, not a claim of platform approval.
House use itself requires counsel acceptance of the entitlement model, published Terms
and accepted service obligations. No native billing implementation is included here.

| Distribution | Intended online housing use | Charter, upgrade and Call checkout | Housing wallet/token/optional-deed surface |
|---|---|---|---|
| Browser web | After release gates | Eligible service-authorized checkout | Existing approved web capabilities |
| Website-distributed desktop | After release gates | Approved browser handoff | Existing website-desktop capabilities |
| Steam | After release gates | Absent | Absent |
| Epic | After release gates | Absent | Absent, deliberate product restriction |
| App Store iOS | After entitlement-model acceptance | Absent | Absent |
| Google Play Android | After entitlement-model acceptance | Absent | Absent |
| Solana dApp Store Seeker | After release gates | Absent, use-only | Absent for housing; unrelated wallet capability grants no checkout |

- Website-management is independent of use/purchase and defaults off on denied storefronts
  until the complete destination and flow receive written approval. A renamed purchase
  link does not establish permission. Unknown capability refuses new spend.
- Preserve D9: the game server receives no distribution label. The service must supply a
  NEW eligible-checkout issuer/verifier and opaque account/purpose/SKU/policy/quote/operation-
  bound authorization. Account login, Origin, UA, JSON and client probes alone do not prove
  channel eligibility. No such current issuer/verifier is asserted by this proposal.
- Denial removes the whole purchase submodel, catalog fetch, handler, hidden DOM, tooltip,
  aria/alt and fallback error. Material payments remain available. Book of Deeds achievement
  vocabulary is distinct from on-chain deed marketing.
- Apple's 3.1.3(b) makes multiplatform access conditional on in-app availability; 3.1.1
  separately addresses NFT unlocks. Counsel must resolve their application to this model;
  using a server entitlement does not itself prove compliance. [Apple guidelines](https://developer.apple.com/app-store/review/guidelines/).
- Google's declaration and asset-disclosure rules require analysis of the actual build and
  linked services. The packet's stronger no-earn marketing rule is editorial, not a literal
  ban on ordinary achievement vocabulary. [Google blockchain content](https://support.google.com/googleplay/android-developer/answer/13607354).
- Steam's item 13 addresses issuing/exchanging crypto or NFTs. The stripped housing scope
  is a product constraint subject to review, not an approval conclusion. [Steam onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding).
- Epic's precise current blockchain requirements and Solana's relocated publisher policy
  remain signed-artifact verification tasks. Do not repeat a blanket marketplace-link ban
  or claim South Korea alone is Epic's territory policy. Signed supported-country authority
  governs optional deeds; unknown country refuses.
- Store listings, the Terms, the deck and in-game copy say the same thing: cosmetic,
  convenience and access; the game never sells power; no wallet is required to use a home.
  The Google Play declaration determination in the counsel memo describes the actual build.
- No randomized paid plots/furnishings, rent, fractional rights, profit promises or timed
  loss. Counsel, the economy-service maintainer and Fernando own signed acceptance of the
  service contract, counsel memo, Terms amendment, listings and territory/authority schedule.
  These artifacts are release gates; this proposal edits none of their draft contents.

## 9. On-chain deeds (phase 3)

- Optional proof and approved transfer of a particular plot, requested only from web or
  website desktop. One distinct plot identity and one current asset per plot are technical
  uniqueness rules; they do not establish a securities, MiCA or CLARITY exemption.
- The economy service owns minting, current-holder verification and the full quote. Core's
  approximate base-asset benchmark is not a mint tariff. Per-asset permanent delegates are
  configured at mint; collection-wide freeze cannot stand in for individual plot authority.
  [Permanent Freeze Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-freeze-delegate),
  [Permanent Burn Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-burn-delegate).
- Low condition never destroys or denies the house or its contents. No automatic lapse burn.
  Transfer/moderation restriction and irreversible burn require explicit signed authority;
  deletion is not an assumed blanket burn/reissue permission. Native clients consume server
  entitlement and never chain-check optional deeds to enter a home.
- A voluntary furnished sale previews an immutable manifest containing shell/tier and only
  eligible transferable placed copies. Seller trophies/provenance, personal/bound/locked
  copies and omitted belongings remain theirs in verified safe custody. A sale cannot proceed
  if safe custody cannot be proven. An unconditional system-mail promise is not substituted
  for an atomic custody/recovery design.
- Files 37/38 own prepare, freeze, quote, settle, cancel and recover; exactly-once entitlement
  transfer follows verified service confirmation. Full fees and royalty are service-quoted.
  No timer repossession, rent, yield, revenue share, fractional rights or randomized sales.
- Signed counsel, Terms, service and territory/authority artifacts gate enablement. Metadata
  uniqueness and a working SDK are not substitutes for them.
- Holder flair (chat and exterior) is a web/website-desktop presentation of the optional deed,
  owned by 38; native, Steam and Epic construct none.

## 10. Experience and editor

The [UX specification](../../freeholds/ux-spec.md) and
[art brief](../../freeholds/art-brief.md) define the adopted experience.
Use the shared window/bags/plant-sheet/Reliquary families. Current tokens retain Cinzel;
the adopted DESIGN target changes fonts only when the coordinated shared foundation lands.
No housing-local theme fork or restored reverted window-frame module is proposed.

**Arrival, Wave A.** Interact at the Eastbrook gate, choose a home, accept entry, then reveal
an authoritative safe doorway view. A fresh delivered arrival directive permits keyed
welcome and one sampled cue; commit-before-ACK recovery may omit this cosmetic feedback. First Inn and first Cottage arrival use a short automatic skippable
hearth view; ordinary returns and visitor entries stay static. Reconnect/replay does not
repeat it. Any movement/look/confirm/cancel resumes input immediately; the existing camera
director offset blends out through `DIRECTOR_RELEASE_TIME`, not a zero-offset snap. Reduced
motion or an unsafe path starts no directive. Realm daylight and condition cues remain
readable. Ordinary online cosmetic settle remains zero; fallback representations cover late
optional art without inventing a new curtain delay.

**Light and art.** Three authored room emitters is a ceiling under the existing global point
light allocator. iOS may allow two and pressure may leave one. Ambient grade, texture and
silhouette keep the room, door, service identities and floor readable at LOW. Every shipped
ID gets final art through the manifest and image-to-glb pipeline in Codex, not Claude; temporary stand-ins do not
satisfy wave closeout. Reduced motion and mute never erase condition or placement facts. File 09 owns NEW
`GameAudio.playHousingArrival` in existing `src/game/audio.ts` and the sampled
`housing_arrival` cue through the current sound manifest/provenance pipeline; 19
integrates and verifies it. Existing private `playFeedback` is not a public call seam.
Baseline screenshot emulation runs Chromium with the iOS profile; an Android claim
requires its explicit supported profile, and neither emulation is physical-device proof.

**Steward.** Owner-only household and Visitors tabs. Show condition, amenity state, due or
paid-through date, and separate needed/bags/vault amounts. Explicit source selection and
prepay review use the same atomic planner. Quotes and allowed management are independently
capability-gated. The Visitors tab separates draft and confirmed policy, Apply and pending
states, authorized guest roster and End visit. Dates use authority identity and client locale
formatting. Payment/visit outcomes are correlated; closing does not duplicate an operation.

**Build, Wave A.** Detached bounded camera, owned-copy bags-family palette plus trophies,
live decor/plinth/amenity meters, recognizable ghost, footprint/hatch and reason, snapped
floor placement, 15-degree yaw, measured-grid nudge, selection/move/return, explicit Confirm,
Cancel and Finish. Fixed structure remains fixed. Touch has visible tap-only actions and
measured pointer projection; keyboard and gamepad have equivalent controls. A scoped input
arbitration seam distinguishes palette, placement, ordinary window and world without sending
avatar movement or combat. Reduced motion retains stable actionable shapes and text.

**Undo/redo.** Placement-only session history starts in Wave A, bounded by the approved
maximum legal placement-row capacity. Exact-copy/revision preconditions refuse stale inverse
operations atomically. Plot/session change or incompatible external revision clears history
with an explanation. Money, Ledgers, grants, upgrades and sales are outside undo.

**Advanced, Wave B.** Bounded planar translation/free yaw, typed floor/wall/table surfaces and
fixed ceiling anchors, with atomic parent/child movement. Snap mode stays available. Arbitrary
scale, full-axis gimbal and collision leniency are excluded from this packet; doors, bounds
and clearance remain mandatory. Dyes arrive in file 41; save/load/share arrive in file 41a. Imports preview
all shortfalls and reserve existing placed/bag/authorized-bank copies atomically, never mint
missing furniture or leak private names. The dye picker is gated by the built apothecary
station amenity's condition and proximity rules; there is no separate dye station (D90).

**Trophies and guests.** Source-complete initial truthful displays with public known/unknown
provenance; later bespoke forms are labeled later. Hidden source silhouettes follow existing
spoiler rules in every sink. Guests inspect public accepted displays only, including during
building, with clear guest role and safe Leave. NEW `setFreeholdBuildPresence(active)`
and `set_freehold_build_presence` carry ephemeral editor presence; 08 owns authority
through NEW `src/sim/freehold/build_presence.ts::setFreeholdBuildPresence`, 08a
allowlists only `freeholdState.isDecorating`, 11 sends start/stop and 18 consumes it.
Authenticated session/plot/claim authority and stale-entry/sequence checks control
presence; closing, leave, disconnect and revocation clear that session. Multiple
eligible owner sessions aggregate privately. No ghost, inventory, history, camera
or actor identity is public. Later reactions-only guest books remain subject to
social privacy and moderation; visible-entry pruning never removes daily admission
protection, whose durable marker has separate bounded retention authority.

## 11. Engineering blueprint

- **Sim:** `src/sim/freehold/` behind `SimContext`: `condition_core.ts` (daily decay, pause and
  grace rules), `ledger_core.ts` (seeded weekly material order, produce and fine-grade
  eligibility in the watch-fee shape), `layout_core.ts` (placement validation, budgets,
  snapping, parenting), `trophy_eligibility.ts` (deeds, reliquary, and the perfected stamp to
  props), `amenities.ts` (station composition with the hall-shared predicate, strongbox gate),
  `garden_view.ts` (safe tableau over the NEW 17/24 owner-account source boundary
  described below; current-character `myFarmPlots` is only a local slice), `instance.ts` (claim,
  rehydrate, descriptor). Persistence follows `farm_persist.ts`: absolute deadlines in the
  authority's clock base, load-side allowlists, a duration clamp. No wallet or token vocabulary
  anywhere (the firewall test pins it); a purchased effect arrives as a server-applied grant
  after the service confirms, the storage-slot pattern.
- **World API:** `src/world_api/housing.ts` facet uses the adopted D20 member vocabulary in
  state and file 01, not this proposal's superseded `freeholdInfo` sketch. Both `Sim` and
  `ClientWorld` implement it, with the same-change parity pin.
- **Render:** `src/render/freehold/` composing the dungeon interior kit, a placed-furnishing
  instancer modeled on `placed_assets.ts`, runtime colliders via a `setRiftRegion`-style
  region, an interior light rig under the point-light budget, all through the GPU preparation
  scheduler (`render-performance-reviewer` on every diff).
- **Server:** `server/freehold_routes.ts` (RouteDef), `server/freehold_db.ts` (`account_freeholds`
  with internal owner lookup, stable opaque public plot identity, bounded JSONB layout,
  globally fenced active claims, durable receipts and later deed records),
  a Claudium spend kind `freehold` beside `storage` for land, upgrades, and the instant repair,
  bounded projection reads with single-flight (never cached admission authority), atomic
  inventory/housing/receipt mutations, cancellation-aware background admission, per-shape
  byte/entry limits and table-specific retention/replay policy, a `freehold` source in
  economy telemetry, and the distribution gate pins from section 8.
- **Content:** `src/sim/content/freehold/` records (tiers, furnishings, furnishing patterns,
  trophies, ledger schedule) merged by `data.ts`, with every content obligation: deeds (a
  "Homesteader" family), Reliquary pages for furnishing items (a Hearth shelf; patterns take
  none), wiki regen, item art, i18n keys, world-entity names; the provisioner firewall
  allowlist row for the upkeep sink.
- **Economy service:** SKUs for land, upgrades, and the instant repair; the settlement
  conversion policy; and (phase 3) mint and verify endpoints.
- **Tests:** determinism (same seed, same house on both hosts), parity, exactly-once purchase,
  ledger rollover across `resetDay`, pause and grace, budget and placement validation, trophy
  eligibility including the perfected stamp, guild permissions, route contracts, the
  distribution gates, the keystone exclusion (no ledger or bill may name a Perfecting material).

**Risks.** Coordinator ceilings (everything behind seams); determinism (no shared `Rng` draws
from house content, no wall clock); the mobile LOW memory floor (kit reuse, authoritative global light allocation and
readable one-light fallback, prewarm gate); slot rehydration on every claim; the economy-service dependency for anything
priced in USD; a large professions merge landing first (base the PRD on release/v0.42.0 after
#3872 merges, and re-read the station, pattern, and persistence seams then).

### Adopted persistence and delivery owners

All housing module names above are NEW planned seams unless explicitly described
as existing. The [service contract](freehold-service-contract.md) separates exact
existing anchors from adopted future APIs. File 07 owns plot persistence; 07a owns
`server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation`
and `server/freehold_mutation.ts::commitFreeholdMutation`, preserving each exact
legacy transaction touch set. No DB client or lock spans an external service call.
File 07b owns account lifecycle/history/binding; 07c owns private account-tier
arrival marks. First-tier eligibility is at-most-once, not guaranteed presentation:
commit-before-ACK recovery may skip the view and ordinary welcome cue; replay never
remints either. File 08a owns explicit safe descriptor and arrival projections.

File 13 owns pure condition/ledger rules. File 13a owns one shared indexed
authoritative calendar history, irrevocable historical finality, bounded safe
projections and authenticated private per-process-generation delivery/ACK. Mutable
covered history cannot authorize durable wear or credit consumption; future prepay
purchase does not require future finality. Original calendar and immutable credit
attribution survive transfer. Seller condition is materialized through the transfer
boundary, seller account history stays with the seller and buyer protection applies
prospectively without copied or freshly granted grace. No newer serving realm,
soft deactivation or old release may reinterpret those originals.

File 28a extends the 07b lifecycle family after 28's guild/fund setup with separate guild-keyed head/history
SQL and membership-incarnation-bound gameplay observations. Every ordinary current
member qualifies without rank, tenure or donation thresholds. Presence works with
the hall unloaded; offline joins create none. Membership transition fencing retains
valid queued observations without attributing old membership to a new guild.
Files 29/13a consume committed guild history and union overlapping service outages;
they never sum member account grace. Bounded dirty-guild batches and indexed history
replace roster scans, per-member writes or plot fan-out. Deletion/disband retain
unresolved hall/credit/operation dependencies; disband is the tombstone disposition with the
Hall Fund refunded or withdrawn first (D78/D79). Minimum capable-release rollout,
quiescent rollback and completed database/security proof remain release artifacts.

## 12. Rulings adopted 2026-09-05

All nine recommendations were adopted as written:

1. Personal first, guild second, one system.
2. Account-level ownership.
3. Settlement policy: convert fiat and SOL proceeds to $WOC and burn a published share
   (counsel and the economy service still gate the mechanism).
4. Daily wear with a weekly ledger.
5. Land is money-only with everything inside earnable, plus the free Inn Room.
6. On-chain deed on demand in phase 3, web only.
7. Mobile is use-only; purchases happen on the web (matching the marketplace).
8. The illustrative price ladder and the 25 percent burn share as working numbers.
9. Names: Freehold, Guildhall, Freehold Charter, Steward's Ledger, Master Builder's Call,
   Hearth Key, Wards.

Added the same day: the app-store constraint (section 8), and the three PR-driven
refinements in section 3 (produce joins the Ledger, the Kitchen Garden plants nothing, the
Master Builder's Call is priced in Claudium). Its effect is shared, but its purchase
surface follows the adopted mobile-use-only ruling; the older "every platform" checkout
phrase was overbroad. Follow-up refinements R01 through R46 were approved by Fernando
on 2026-09-06 and are recorded in the packet decision register. This adopts
implementation requirements; external legal/service signatures and deployed proof remain
release gates, and numeric calibration artifacts must pass their stated approval gates.

## 13. The MVP: the Cottage slice

Housing does not have to ship all at once. The architecture (one sim module, the
dungeon slot allocation, the entitlement SKU, the IWorld facet) is built once in the first slice and
only extended afterwards, so a thin vertical slice proves the whole loop.

**In:**
- Cottage tier only, account-owned, instanced from the Dawnhold template.
- The Eastbrook gate, the Hearth Key, and the free Inn Room (three plinths, a bed).
- Claudium purchase on approved web/website desktop, with account entitlement grant and
  durable service receipts/recovery. All three money gates apply.
- Build mode v1: detached camera, floor placement, rotate, nudge, select/move/remove,
  placement-only bounded undo/redo and live meters; mouse, gamepad and deliberate touch.
- Account-wide initial coverage of every promised source, with truthful generic displays,
  live refresh, known/unknown public provenance and spoiler-safe silhouettes.
- Eighteen furnishings: eight vendor plus ten crafted, including three pattern recipes
  on the quartermaster row. Every shipped item has final art; no luck-gated patterns yet.
- Built-in personal Strongbox without slot cost or new capacity, and one station slot.
- Steward's Ledger v1: condition, a weekly ledger with a produce line, four-week
  prepay, amenities paused strictly below 30, and the permitted Master Builder's Call checkout.
- Private/friends visiting with explicit gate choice, offline-owner admission, revocation
  and truthful busy retry. Cottage and Inn visitor targets are both 8 under approved R24.
- The distribution gates from section 8.

**Later:** Lodge and enriched furnishings; specialized trophy models/finishes; bounded
advanced typed surfaces with fixed ceiling anchors; twelve-week prepay; guild/public
visiting; Kitchen Garden; Guildhalls, Hall Fund and further tiers; wards, Showcases and
reaction books; optional deeds; dyes, layout sharing and second home.

**Outside this packet:** seasonal furniture sets, delve pattern drops, arbitrary scale,
full-axis gimbal, collision leniency, new Carpenter/Mason professions, native billing,
extra farm beds, new housing power bonuses and speculative investment/rental products.

**What it must prove:** allowed checkout and supported online entitlement use, deterministic
mechanics on both worlds with explicit offline scope, exact-copy custody and restart recovery,
four-week measured material demand without guaranteeing higher prices, trophy delight and
LOW phone performance. File 20 owns the durable evidence and capacity-review artifact.

**Long poles to start in Phase 0, in parallel with the code:** the economy-service SKUs
and the settlement policy, the counsel memo, the store-listing text, and furniture art
through the image-to-glb pipeline in Codex, not Claude.

## 14. Roadmap

The implementing files and paired QA in [the plan](../../freeholds/implementation-plan.md)
own delivery; their wave names disambiguate the original proposal's broad phases.

1. **Paper and acceptance:** adopted state, UX publication, art/content/numeric artifacts,
   service handoffs, counsel/Terms/listing/territory review. Product acceptance does not
   activate unbuilt runtime values or grant external platform approval. Follow the documented dependency sync.
2. **Wave A, Cottage:** section 13 through file 20. Free Inn, Cottage, safe arrival, initial
   source-complete truthful trophies, floor building/undo/redo, initial furnishings, personal
   Strongbox/station, weekly Ledger and permitted checkout, private/friends visiting.
3. **Wave B, enrichment:** files 21 to 27. Lodge, twenty additional crafted outputs, later
   trophy forms/finishes, Kitchen Garden, advanced bounded surfaces/fixed ceiling anchors,
   twelve-week prepay and wider visiting. No seasonal sets or delve pattern channel.
4. **Wave C, Guildhall:** files 28 to 33. Guild ownership, member plinths, service-owned Hall
   Fund, shared stations/bank/feasts/boards, actual guild first kills, Manor/Bastion and
   projects completed by their requirements, with cosmetic visiting vendors.
5. **Wave D, neighbors and optional deeds:** files 34 to 39. Wards, permanent Favor capacity,
   monthly Endeavors, realm opt-in Showcases, moderated reaction books and signed-gate deed
   transfer with the explicit furnished-sale manifest.
6. **Wave E, depth:** files 40 to 44. Keep/Citadel with profession-independent prestige,
   dyes and safe layout sharing, second home. File 43 is a measured future-expansion handoff;
   it does not implement Carpenter/Mason crafts. Each wave closes with final art and evidence.
7. **Final artwork and legal handoff:** 44a inventories and replaces every feature-created
   placeholder icon/image with Codex artwork and verifies all final assets in context.
   All asset-generating files, including GLB work, execute in Codex, not Claude. File 44b
   then revisits the full governing Terms, counsel, storefront/territory/settlement and
   final rights/provenance against the COMPLETED implementation, and hands the concrete
   evidence bundle, NEW `docs/prd/woc/freehold-final-legal-handoff.md`, to the legal
   team with named sign-off tracking. Earlier money and
   release gates still apply before any earlier launch or submission.

## Sources

The six lane reports in `docs/prd/woc/housing-research/` carry every URL: `code-crypto-guilds.md`,
`code-content-systems.md`, `code-world-instancing.md` (this repository), `web-mmo-housing.md`,
`web-upkeep-ux.md`, `web-web3-land.md` (external, fetched 2026-09-05, with unverified claims
marked inline). PR #3872 was read at head `0f53c92ff7` on 2026-09-05: `docs/design/professions.md`
(the Masterwrought apex tier, Farming, the supply matrix), `src/sim/professions/CLAUDE.md`, and the
`farm_*`, `feast*`, `perfecting.ts`, `sundering.ts`, `masterwrought_materials.ts`, `apex_patterns.ts`,
`farm_patterns.ts`, `pattern_items.ts`, and `mobile_station.ts` modules.
