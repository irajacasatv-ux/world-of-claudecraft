# Freeholds and Guildhalls: housing research and proposal

> **STATUS: PROPOSAL, RULINGS ADOPTED 2026-09-05. Nothing is built.** This is the
> brainstorm deliverable for the "Real Estate" feature: a deep read of the codebase, the
> MMO housing canon, and the 2024 to 2026 web3 land record, folded into one proposal for
> World of ClaudeCraft. Fernando adopted every recommendation in section 12 on 2026-09-05
> and added one standing constraint: **do everything possible to keep the app stores happy**
> (section 8). The proposal was then re-read against PR #3872 (Masterwrought crafting and
> the Farming profession, merging into release/v0.42.0), and section 3 records what that
> changes. The six raw research lanes (with every source URL) sit beside this file in
> `docs/prd/woc/housing-research/`. Every number here is illustrative unless it cites a file
> or a source; the economy service and Fernando own the final figures.

| | |
|---|---|
| **Tier** | 3 - Flagship $WOC utility |
| **Ease** | 4/5 (new sim system, new IWorld facet, new service SKUs, one new item kind) |
| **Flywheel** | Every housing purchase settles in $WOC at the service; weekly upkeep pulls low-tier materials and farm produce off the World Market; deeds resell on the $WOC marketplace |
| **Sustainability** | Recurring sink (upkeep and per-placement furnishings) on top of a one-time land sale |
| **Reg risk** | Medium for entitlement-only housing (the storage-charter precedent); High once deeds go on-chain (counsel gates, as the marketplace did) |

## 1. The answer in one page

- **Name it Freeholds (personal) and Guildhalls (guild), never "real estate".** The
  in-game vocabulary for a purchased entitlement is already "charter" (`storage_charters.ts`),
  so the land title is a **Freehold Charter**.
- **Build both, personal first, as one system.** Freeholds are the many-payer loop
  (material upkeep, blueprints, trophies, a daily habit). Guildhalls are the social anchor and
  the pooled big-ticket purchase, and today guilds have no place in the world at all. One
  `freehold` sim module with two owner kinds (`account`, `guild`).
- **Instanced plots, not open-world land.** Every character already has a durable private
  instance key, Dawnhold Castle is a working zero-combat interior, and the rift system already
  streams a layout descriptor to both hosts and publishes runtime colliders. Open-world land
  has no runtime seam and every scarce-land MMO on record produced land-rush griefing. Shared
  wards come in phase 3 on the same seam.
- **Store-safe by construction.** Housing is a Claudium-priced server entitlement, exactly
  like the Strongbox storage charters, so it works identically on web, desktop, Steam, Epic,
  App Store, Google Play, and the Solana dApp Store. Wallets, $WOC, deeds, and the marketplace
  appear only where each store allows them (web, the website desktop build, and the Seeker
  dApp Store build). Nothing in the native apps mentions a token, a wallet, or a deed.
- **Price in USD, settle in $WOC.** Whatever rail a player uses to buy Claudium (Stripe,
  SOL, USDC, or $WOC at a discount), the economy service settles housing revenue in $WOC:
  direct on the $WOC rail, market-bought on the others, then a published burn share and a
  treasury that never sells. Token demand exists whether or not the buyer ever holds it, and
  paying directly in $WOC is a market buy, not a sale.
- **Upkeep: daily wear, weekly ledger, never destruction.** Condition ticks down a little
  every realm day; the repair is a weekly Steward's Ledger of low-tier gathered materials and
  farm produce, prepayable twelve weeks, with an instant repair as the fast lane. Below a floor
  the amenities lock; the house and its contents are never lost.
- **Trophies are the soul of it.** Every conquerable reward the game has, now including a
  named legendary from the Masterwrought Perfecting chain and the Harvestmaster's golden
  sheaf, becomes a placeable trophy the moment it is earned, retroactively, free, tiered by
  difficulty, with provenance on inspect. Trophies are earned, never sold.
- **Decor is a profession product.** Every craft gets a furnishing line from existing
  materials; furnishing blueprints are the existing `kind: 'recipe'` pattern items and follow
  the Masterwrought channel doctrine (raid, rift, and a deterministic quartermaster valve).
  Each placement consumes its own copy, so demand recurs.
- **On-chain deeds come after the gameplay, on the web only.** Metaplex Core with freeze and
  burn delegates, tradeable on the $WOC marketplace as its first "serialized collectible".
- **Non-negotiables stay intact.** The game never sells power. The token firewall keeps wallet
  and token vocabulary out of `src/sim/`. The Masterwrought power envelope (R5) and the farming
  calendar model (masterwrought R19) are protected assets housing must not touch. Counsel gates
  the on-chain deed and the Terms revision.

## 2. What the codebase already gives us

The three codebase lanes (`housing-research/code-*.md`) found that most of the plumbing exists.

**Payment rails.** Claudium is bought with Stripe, SOL, USDC, or $WOC (`ClaudiumRail` in
`server/claudium_proxy.ts`); the economy service builds the transaction and computes the burn
and treasury split, and the client signs through the existing `nativeSignAndSend` path. The
bank-storage SKUs (`src/sim/content/storage_charters.ts`, `server/storage_purchases.ts`) are
the exact template for a housing SKU: a game-side allowlist, a durable pending row with an
idempotency key, and an exactly-once apply through a sim grant function. There is no platform
IAP anywhere in the repo today, and the native wallet is enabled only on the Solana dApp
Store build for Seeker devices (`src/net/wallet_capability.ts`).

**Ownership precedents.** Account-wide unlocks live in `accounts.cosmetics` and ride the
`self.cosmetics` wire. On-chain ownership has a working claim-once, re-verify-on-use pattern:
the Seeker Genesis Token entitlement (`server/seeker_entitlement.ts`,
`seeker_ownership_verifier.ts`). A deed NFT would follow it verbatim.

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
corpse harvests and vendor staples are the upkeep and furnishing inputs. The professions
design doc already sketched an off-wheel Carpenter and Mason lane "so housing and cosmetics
never pressure the combat wheel"; that lane is a phase 4 option, not a launch requirement.

**Trophy sources.** Reliquary relics are a closed union (item, mark, mount, weapon skin,
title) and deeds carry cosmetic-only rewards; the reliquary doc explicitly defers "housing
museum props". Twelve ready trophy families: Thunzharr, Nythraxis, Ignivar and Varkhul,
Korzul, Morthen, Vael, Ysolei, the Wildheart High Priest, six mounts, the realm-rare
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
clamp, and a zero-clock offline guard (`farm_persist.ts`, `farm_projection.ts`). That is the
template for house state: bed ids never renumber, hidden outcomes never cross the wire, and
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
carries a player-chosen name and the maker's signature (the Maker's Bond `craftedBy`). A
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
present in the hall". Repairs and crafts at home draw materials bags-first-then-vault through
the one `reagent_sources.ts` planner, never a second implementation.

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

| Game | What worked | What failed |
|---|---|---|
| WoW Midnight (2025 to 2026) | Instanced neighborhoods of about 50 plots; cheap gold plot, no lottery, no upkeep; 12 house levels raise a decor point budget; decor from achievements (retroactive), professions, vendors, raids; raid trophies tiered by difficulty; free placement with dye and parenting | "No reason to go home"; decor grind; frozen storage cap; a cash-shop exterior priced at $40 read as a broken "player-first" promise |
| FFXIV | Deep decorating; FC workshops, airships and submarines as guild crafting projects | Plot lottery on fixed scarcity; 45-day demolition that resumed after a nine-month pause and erased thousands of houses; "must stay subscribed" resentment |
| ESO | Gold or crowns for nearly every home; furnishings through all five crafts and achievement vendors; rare plans as a market | Furniture caps frozen from 2017 to 2026; subscriber slot doubling; 24-visitor cap limits guild halls |
| OSRS Player-Owned House | Every room does a job (altar, restore pool, teleport nexus, bank via servant, costume room that frees bank space, mounted heads); skill-gated rooms make the house itself a trophy | None to speak of; the 2025 overhaul only removes friction |
| EverQuest 2 guild halls | Tiers by guild level; amenity slots; weekly upkeep from a pooled escrow prepayable twelve weeks; nonpayment locks, never destroys | Status grind |
| WildStar | Plug sockets (stations, banks, nodes, challenges); numeric editor with parenting; rest XP at a neighbor's plot was the best "reason to visit" ever shipped | The game died for unrelated reasons |
| New World | Weekly tax that only locks perks when unpaid; three houses; trophies per house | Tax had to be cut 90 percent when income broke; tie upkeep to income |
| Ultima Online, ArcheAge, EVE, SWG | Emergent cities and player economies | IDOC scripts, land-grab bots, "abandoned" loot drops, one-man cities: every open-world scarcity system was gamed |

The twelve lessons, ranked: never destroy a house or its contents on a timer; give the house
a job; upkeep cheap, weekly, prepayable, with a grace window; no land scarcity; trophies
earned in content and tiered by difficulty, shown with provenance; cap by point budget and
raise it on a published cadence; free placement with stacking, parenting, and layout save;
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

**The token patterns with durable demand.** Mandatory-path sinks, not optional ones.
"Buy with fiat, settle in token": Immutable routes 20 percent of every fee through IMX and
buys it on market when the payer has none; Helium mints USD-pegged credits only by burning HNT,
so burn volume rises when price falls. USD-denominated recurring fees paid in token
self-adjust to price. One-off supply burns and treasury buybacks support price, not demand.
Revenue share, rent yield, or fractional deeds are the securities trigger (Stoner Cats, Illuvium
IIP-45-R); the SEC's March 2026 release exempts in-game items and access rights only when they
carry no profit rights.

**Solana specifics.** Metaplex Core is the 2026 standard: about 0.0029 SOL per asset, with
Royalties, Permanent Freeze Delegate (soulbound or lapsed-plot freeze), and Permanent Burn
Delegate (issuer re-issue) plugins. Magic Eden and Tensor honor royalties only when the
collection enforces them. Star Atlas DACs are the only live guild-multisig property precedent
and are still pre-launch; guild halls should be server-side entitlements owned by the guild
record, not multisig deeds.

## 6. The proposal

### 6.1 Pillars

1. **A home is a record of feats.** The first thing a visitor sees is what you have conquered.
2. **A home has a job.** Strongbox, stations, a hearth to return to, a guild's muster point and
   feast hall.
3. **Every housing action touches $WOC and the item economy, and none of it touches power.**
4. **Nothing you own is ever taken from you by a timer.** Neglect dims the house; it never
   destroys it.
5. **It is beautiful on a phone at the LOW preset,** and it is the same house in every store's
   build.

### 6.2 Ownership and where it lives

- **Owner kinds:** `account` (a Freehold, enterable by every character on the account) and
  `guild` (a Guildhall owned by the guild record, permissions from the existing
  `leader / officer / member` ranks and the `GUILD_BANK_EDIT_RANKS` family).
- **One Freehold per account at launch, one Guildhall per guild.** A second freehold is a
  phase 4 SKU with a progressive upkeep schedule (the ArcheAge lesson).
- **Instanced.** A Freehold is a private instance keyed `freehold:account:<id>`, a Guildhall
  `guildhall:guild:<id>`, both on a new instance band with Dawnhold as the interior template.
  The house rehydrates from persistence on every claim (slots are runtime-only) and the
  layout crosses the wire as a descriptor both hosts regenerate deterministically.
- **Entry:** a Freehold Gate on the Eastbrook quay and a second in Fenbridge (the two hubs),
  an interactive door like the dungeon doors; plus a Hearth Key item on a cooldown that walks
  you home from anywhere (convenience, free with the freehold, and, like the Master's Field
  Forge, holding it is the credential and using it consumes nothing). Leaving drops you at the
  gate you used.
- **Free "Inn Room" for everyone.** A tiny no-upkeep room at the Eastbrook inn with three
  trophy plinths and a bed. Everyone places their first mounted head, everyone passes the
  Freehold Gate, and nobody can say achievement display is paywalled.

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
Upgrade bills use tier-3 and tier-4 fine materials and tier-4 produce, never the Perfecting
keystones. Guildhall fees are pooled through the Hall Fund and roughly 3x the freehold
figures. Budgets are raised on a published cadence (every second release) so caps never freeze.

### 6.4 Trophies

- **Source of truth:** the character's `deedsEarned`, `deedStats.itemsDiscovered`, reliquary
  marks, mount possession, account cosmetics, and the `perfected` stamp on an owned copy. A pure
  `trophy_eligibility` core maps those to trophy props. Trophies are granted retroactively on
  first entry and cost nothing.
- **Forms:** mounted heads for `slain:*` realm rares and boss marks; statues and busts for raid
  and world bosses; weapon racks and armor stands that show the actual item model for unique
  drops and set pieces; the **Legend Stand** for a named, promoted Masterwrought piece (the
  player's name for it and the maker's signature both on the plaque); a paddock or perch for
  mounts; banners for titles and grandmaster deeds; the Harvestmaster's golden sheaf and the
  regional first-harvest markers for the garden; plaques for curator ranks and feats.
- **Tiered by difficulty:** normal, heroic, and rift S-rank variants read at a glance (bronze,
  silver, gilded finishes), the WoW Argent, Aureate, Gleaming rule.
- **Provenance on inspect:** the tooltip names the deed, the character, and the date, and
  links to the Book of Deeds entry. Visitors see the same tooltip.
- **Guild trophies (phase 2):** first-kill banners and raid statues need a new guild-level deed
  record; today every deed is per character.

### 6.5 Furnishings and blueprints

- **One new item kind:** `furnishing` (placed, consumed on placement, returned to bags on
  pickup). Blueprints are the existing `kind: 'recipe'` pattern items, learned through
  `resolvePatternLearn`, named with the shipped per-craft prefixes (Plans, Pattern, Design,
  Schematic, Technique, Recipe).
- **Every craft gets a line from existing materials:** weaponcrafting (racks, iron fittings),
  armorcrafting (stands, braziers), tailoring (rugs, curtains, banners), leatherworking (hides,
  chairs), engineering (lamps, clocks, gadgets), alchemy (dyes and the dye station), inscription
  (paintings, maps, scrolls), jewelcrafting (chandeliers, gem lamps), cooking (feast tables and
  food props, beside the real feasts), enchanting (glow effects, enchanted lights). Farming
  supplies the produce props and the garden markers.
- **Sourcing ladder, the R8 doctrine:** vendor basics for gold; crafted staples; rare patterns
  as raid tail groups, rift clear draws, and delve rewards; every luck-gated pattern also on a
  deterministic quartermaster or achievement-vendor row (D13); seasonal sets. The rare-plan
  market (ESO's most valuable furnishing plans sell for millions) is the collector's economy.
- **Furnishings are marketplace-eligible at every rarity** (the mount rule), so they trade for
  gold on the World Market and for $WOC on the marketplace. Patterns take no Reliquary page.

### 6.6 Amenities: the house's jobs

- **Strongbox:** bank access at home (convenience; the game already sells bank capacity for
  Claudium). A Materials Vault chest at the Manor tier. Guildhalls get the guild bank chest.
- **Stations:** forge, kitchens, apothecary, tannery, loom, toolworks as buildable amenities
  composed into the station list; recipes and their `stationType` gates are unchanged; a
  Guildhall station serves every member present, the `partyShared` predicate over the hall.
- **Kitchen Garden:** a living tableau of the owner's real farm plots with the Harvest Journal
  on a board and a farmer NPC as the Steward's flavor. It plants nothing and adds no beds.
- **Feast hall:** the Guildhall's long table is where a cook places the party feast or an apex
  role feast; the feast is the shipped object and the Well Fed it grants is the only buff that
  ever exists in a house.
- **Hearth:** the emotional center; the Hearth Key returns you here. A lit hearth is the
  visual condition meter.
- **Guildhall extras:** muster board, calendar board, a pledge-board mirror, and a war table
  that shows the guild's raid lockouts and first kills.
- **Explicitly excluded:** rested XP, stat buffs, drop-rate or gathering buffs, extra farm beds,
  teleports that skip content. Convenience only.

### 6.7 Upkeep: the Steward's Ledger

- **Condition** is 0 to 100. It loses one point per realm day (keyed on `ctx.resetDay`, so it is
  deterministic and headless-safe), two per day for a Guildhall. Wear is visible: dust, dimmed
  hearth, creaking door, flickering lanterns.
- **Repair** is a weekly Steward's Ledger: three to five stacks of low-tier materials drawn from
  every gathering line (ore, wood, herb, hide, cloth, fish, and now produce), rotated by a
  seeded weekly schedule so demand spreads and no single material spikes. Quantity scales with
  tier; the material tier does not. Fine grades and any produce at or below the ledger's tier
  qualify, in a fixed published consumption order (the watch-fee rule). Repairing to full from
  93 costs the same as from 60, so a weekly habit is never penalized.
- **Never** a Perfecting keystone, a gear reagent, or the quickening catalyst.
- **Cost anchor:** about ten percent of an active gatherer's weekly output at the Cottage tier
  (the ArcheAge first-plot share), rising to about twenty percent at the Citadel. The rate lives
  in server config, publishes in the UI, and pauses automatically when the World Market or the
  economy service is offline (New World's 2021 emergency tax cut is the warning).
- **Instant repair, the Master Builder's Call:** priced in USD and paid in Claudium, so it is
  the same action on every platform, at about 1.5x the ledger's market value so it never
  undercuts gatherers. On the web the cheapest Claudium is the discounted $WOC rail, and the
  service settles the revenue in $WOC either way (section 7).
- **Prepay** up to twelve weeks of ledgers (the EverQuest 2 escrow rule). Materials draw
  bags-first-then-vault through `reagent_sources.ts`.
- **Grace and lockout:** above 30, cosmetic wear only. Below 30, amenities lock (stations,
  strongbox, trophy finishes go dull, the hearth goes out). At zero the door still opens,
  nothing is lost, nothing is repossessed, and one ledger restores everything.
- **Away rules:** decay pauses after seven consecutive days without any login on the account
  (Conan), and a returning player gets three repair-free days.
- **Guildhalls:** 2x decay, paid from the Hall Fund; officers prepay; any member can donate
  materials, gold, or Claudium with a contribution log; a weekly per-member donation cap keeps
  large guilds from trivializing it (the Guild Wars 2 favor cap).
- **Never:** demolition, item loss, governor-set rates, raising upkeep to fight inflation.

### 6.8 Guildhalls specifically

- Owned by the guild record; permissions ride the existing ranks. Leader and officers edit
  layout and buy amenities; members place their own trophies on member plinths.
- **Hall Fund:** a guild escrow beside the gold treasury holding materials and a Claudium
  balance for fees and upkeep, with a ledger every member can read.
- **Guild projects:** tier upgrades are multi-week build projects with a shared progress bar,
  the FFXIV airship and WoW Endeavor model; finishing one unlocks a hall trophy.
- **Weekly reasons to gather:** the feast night, the muster board, the war table, guild-only
  vendors that visit when a project completes.

### 6.9 Visiting and social

- Open-house toggle: private, friends, guild, public. Visitor cap per tier (8 to 24).
- Guest book with reactions; a "Showcase" vote each season with a trophy-decor reward.
- Phase 3 **Wards**: shared instanced neighborhoods of 24 to 50 freehold exteriors around a
  square with a Guildhall as the anchor plot, a ward favor bar that raises everyone's decor
  budget, and monthly ward Endeavors (WoW's model, which is the one that shipped and worked).

## 7. The $WOC flywheel

The consumer pays in whatever the platform allows; the economy service settles in $WOC. That
split is what makes the design both store-safe and token-positive.

| Housing action | What the player pays | What the service does with it | Policy carve-out |
|---|---|---|---|
| Buy the land (Freehold Charter) | Claudium, bought on the web with Stripe, SOL, USDC, or $WOC (discounted) | Settles in $WOC: direct on the $WOC rail, market-bought on the others; then a published split (adopted proposal: 25 percent burned, 75 percent to a treasury that never sells) | Access |
| Tier upgrade fee | Claudium plus crafted materials | Same settlement | Access |
| Materials for upgrades and ledgers | Gathered, farmed, crafted, or bought on the World Market for gold | Off-chain; this is the item-economy demand | n/a |
| Instant repair (Master Builder's Call) | Claudium, same on every platform | Same settlement | Convenience |
| Deed mint and resale (phase 3, web only) | $WOC on the marketplace | 3 percent burned, 7 percent treasury, 90 percent seller; collection royalty to the treasury | Player-to-player trade |
| Furnishings and blueprints | Gold (World Market) or $WOC (marketplace, web only) | Marketplace fee split | Player-to-player trade |
| Holder flair on the exterior | Holding $WOC (existing tiers) | None; read-only | Appearance |

**On the "buying with $WOC lowers the price" worry.** Price falls when tokens are sold. A
player who pays $WOC into a burn or a non-selling treasury has to acquire those tokens first
(a market buy) and the tokens then leave circulation or sit still. That is the most bullish
rail we have, which is why the existing store already discounts it. The risk to avoid is the
treasury selling; state publicly that it never does.

**One refinement to the adopted rulings, driven by the app-store constraint.** The first
draft made the instant repair a $WOC-only action. A wallet action cannot exist in the App
Store or Google Play builds, so the same house would have had a feature that vanishes by
platform. Pricing it in Claudium keeps one path everywhere; the $WOC rail's discount and the
service-level settlement keep the token demand. The $WOC-exclusive surfaces are the deed mint,
deed trading, marketplace furnishing trades, and holder flair, all on the web where they belong.

**Why this is not pay-to-win.** Every purchasable thing is appearance (trophies are earned,
not sold), convenience (a bank chest, a station, a faster repair), or access (the plot, a
tier). No purchasable thing changes a number in combat, progression, or drops. That is the
verbatim carve-out in the three $WOC PRDs and the Terms.

## 8. Store-safe by construction

Fernando's standing constraint: do everything possible to keep the app stores happy. The
design answers it structurally rather than with disclaimers.

| Distribution | House usable | Buy land, upgrades, instant repair | Wallet, $WOC, deed, marketplace surfaces |
|---|---|---|---|
| Web (worldofclaudecraft.com) | Yes | Yes, Claudium via Stripe, SOL, USDC, $WOC | Yes (the existing gates) |
| Website desktop build (Electron) | Yes | Yes, through the browser handoff | Yes (the `wocExchangeSupported` gate) |
| Steam | Yes | No purchase surface; "buy on the website" | None (Steamworks rule 13) |
| Epic | Yes | No purchase surface | None in-app (Epic bars its payments and marketplace links) |
| App Store (iOS) | Yes | No purchase surface unless a native IAP SKU is added later, at the same USD price, sold as Claudium | None, and no mention of tokens, wallets, or deeds |
| Google Play | Yes | Same as iOS | None in-app; the listing declares tokenized assets per policy |
| Solana dApp Store (Seeker) | Yes | Yes, wallet rails per the existing Seeker capability | Yes (the store permits it) |

Rules the implementation pins with tests:

- The house is a server entitlement; on-chain deed ownership unlocks nothing in any native
  app (Apple 3.1.1). The entitlement does the unlocking everywhere.
- No wallet, $WOC balance, deed, mint, or marketplace string or control ships in an App
  Store, Google Play, Steam, or Epic bundle path that a player can reach; the existing
  distribution gates are the enforcement point, and a source pin keeps housing behind them.
- No purchase in a native app outside the platform's own billing; today that means no
  purchase surface at all in the App Store and Google Play builds, with the house fully
  usable and a neutral "manage on the website" line.
- No "earn" language anywhere in housing copy (Google Play), no randomized furnishing boxes
  or plot drops for money (Google Play gambling rule), no timed loss (nothing is ever
  repossessed, so there is never a pay-or-lose prompt).
- Deed features are geo-excluded where play-to-earn is barred (South Korea), following the
  Epic Games Store's own exclusion list.
- Store listings, the Terms, and the in-game copy say the same thing: cosmetic, convenience,
  and access; the game never sells power; the token is optional.
- Counsel reviews the store-listing text and the Terms revision before the first housing
  release, as with the marketplace.

## 9. On-chain deeds (phase 3)

- **What:** the Freehold Charter minted as a Metaplex Core asset to the linked wallet,
  on request, from the web or website-desktop client only. Unique per plot (ward, plot
  number, tier, founding date) so it is neither a fungible series under MiCA nor a
  mass-minted fundraising series under the proposed CLARITY safe harbor.
- **How:** the Seeker pattern. Claim once (server mints via the economy service, books the
  mint in a `freehold_deeds` table), re-verify current ownership at each use. Permanent
  Freeze Delegate freezes a lapsed or moderated plot; Permanent Burn Delegate lets the server
  re-issue after an account deletion. Collection-level royalties to the treasury.
- **Trading:** a deed is the first "serialized collectible" on the $WOC marketplace, the
  category the policy already defines and keeps dark. Selling the deed transfers the plot and
  its furnishings; trophies and personal items return to the seller by system mail.
- **Gates:** counsel memo and Terms revision (section 9 of the Terms currently says we do not
  issue or control any token, and a minted deed is something we issue); economy-service mint
  and verify endpoints; the store rules in section 8.
- **Never:** revenue share, rent yield, fractional deeds, randomized plot drops for money.

## 10. Experience and editor

Design language: `DESIGN.md` tokens throughout (midnight ink, parchment, bronze and gold
edges, Cinzel headings, Alegreya Sans UI). The house is a window family plus a per-frame
painter, never a new banner in `hud.ts`.

**Arrival.** The gate opens on a short establishing pan to the hearth (skippable, reduced
motion aware). Realm time of day carries into the interior; the hearth and lanterns are the
only dynamic lights (three point lights at LOW is the whole budget).

**The Steward panel.** Condition meter drawn as the hearth flame, next ledger due, the
ledger's materials with "have / need" across bags and vault, and one-click "repair from bags",
"repair from vault", and "Master Builder's Call". Decor budget and plinth counts as meters.
Visitor setting. The Kitchen Garden board shows the Harvest Journal. All values through
`formatNumber` and `t()`.

**Build mode.** Toggle with one key or the HUD button; the camera detaches to a free build
camera; the HUD dims to the palette (Trophies, Furnishings, Amenities, Layouts).

- Ghost preview with a blocked state ("something is in the way", never a silent refusal).
- Surface-typed snapping (floor, wall, table top) with a grid toggle and fine subdivisions;
  placement height sampled once from the movement floor, the feast rule.
- Rotation snaps at 15 degrees with a free gimbal in Advanced mode; nudge keys for height;
  small items parent to large ones so moving a table moves what sits on it.
- Undo and redo for the whole session; collision leniency as an Advanced opt-in.
- Capacity meter always visible; a layout save, load, and share (the WoW retrofit, shipped
  day one).
- Gamepad: sticks move and rotate, bumpers change height, triggers cycle snap modes.
  Touch: drag with a finger offset so the piece is visible, two-finger rotate, an on-screen
  nudge pad. The ground-aim controller (`docs/design/ground-targeting-input.md`) is the
  input precedent for all three.

**Trophy case.** A catalog of everything earned, grouped by the Reliquary shelves, with the
unearned silhouettes visible (the hunt), a "place" action, and the provenance tooltip.

**Visitors.** A door knock, a guest book by the door, and a compact "who is home" line.

## 11. Engineering blueprint

- **Sim:** `src/sim/freehold/` behind `SimContext`: `condition_core.ts` (daily decay, pause and
  grace rules), `ledger_core.ts` (seeded weekly material order, produce and fine-grade
  eligibility in the watch-fee shape), `layout_core.ts` (placement validation, budgets,
  snapping, parenting), `trophy_eligibility.ts` (deeds, reliquary, and the perfected stamp to
  props), `amenities.ts` (station composition with the hall-shared predicate, strongbox gate),
  `garden_view.ts` (the plot tableau projection over `myFarmPlots`), `instance.ts` (claim,
  rehydrate, descriptor). Persistence follows `farm_persist.ts`: absolute deadlines in the
  authority's clock base, load-side allowlists, a duration clamp. No wallet or token vocabulary
  anywhere (the firewall test pins it); a purchased effect arrives as a server-applied grant
  after the service confirms, the storage-slot pattern.
- **World API:** `src/world_api/housing.ts` facet (`freeholdInfo`, `freeholdEnter`,
  `freeholdPlace`, `freeholdMove`, `freeholdRemove`, `freeholdRepair`, `freeholdTrophies`,
  `freeholdVisitors`, and the guild twins), implemented in both `Sim` and `ClientWorld`, with
  the parity pin updated in the same change.
- **Render:** `src/render/freehold/` composing the dungeon interior kit, a placed-furnishing
  instancer modeled on `placed_assets.ts`, runtime colliders via a `setRiftRegion`-style
  region, an interior light rig under the point-light budget, all through the GPU preparation
  scheduler (`render-performance-reviewer` on every diff).
- **Server:** `server/freehold_routes.ts` (RouteDef), `server/freehold_db.ts` (`freeholds`
  keyed by owner kind and id with a JSONB layout, `freehold_ledgers`, `freehold_deeds` later),
  a Claudium spend kind `freehold` beside `storage` for land, upgrades, and the instant repair,
  cached reads with single-flight, a retention story for every table, a `freehold` source in
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
from house content, no wall clock); the mobile LOW memory floor (kit reuse, three lights,
prewarm gate); slot rehydration on every claim; the economy-service dependency for anything
priced in USD; a large professions merge landing first (base the PRD on release/v0.42.0 after
#3872 merges, and re-read the station, pattern, and persistence seams then).

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
Master Builder's Call is priced in Claudium so it exists on every platform).

## 13. The MVP: the Cottage slice

Housing does not have to ship all at once. The architecture (one sim module, the
instance band, the entitlement SKU, the IWorld facet) is built once in the first slice and
only extended afterwards, so a thin vertical slice proves the whole loop.

**In:**
- Cottage tier only, account-owned, instanced from the Dawnhold template.
- The Eastbrook gate, the Hearth Key, and the free Inn Room (three plinths, a bed).
- Purchase with Claudium through the storage-charter flow; the service settles in $WOC.
- Build mode v1: floor placement, rotate, nudge, remove, undo; mouse and touch.
- Retroactive trophies from every existing deed and relic, with the provenance tooltip.
- About twenty furnishings: vendor basics, one crafted piece per craft, three patterns
  on the quartermaster row (no luck-gated drops yet).
- Strongbox and one station slot.
- Steward's Ledger v1: condition, a weekly ledger with a produce line, four-week
  prepay, the lockout at 30, the Master Builder's Call.
- Friends-only visiting, visitor cap 8.
- The distribution gates from section 8.

**Out until later phases:** Guildhalls and the Hall Fund, tiers above Cottage, wall and
ceiling snapping, dyes, layout sharing, wards, Showcases, guest books, the on-chain
Freehold Charter, the Kitchen Garden tableau, the feast hall dressing, gamepad polish
beyond the basics.

**What it proves:** the entitlement flow end to end on every platform, deterministic
house state on both hosts, whether the ledger lifts low-tier material prices (measure
over four weeks), trophy delight, and LOW-preset phone performance.

**Long poles to start in Phase 0, in parallel with the code:** the economy-service SKUs
and the settlement policy, the counsel memo, the store-listing text, and furniture art
through the image-to-glb pipeline.

## 14. Roadmap

1. **Phase 0, decisions and paper:** the PRD off release/v0.42.0 once #3872 lands, the counsel
   memo (entitlement now, deed later), the economy-service SKU spec, the upkeep rates draft,
   the store-listing text.
2. **Phase 1, Freehold:** the Cottage slice (section 13) first, then the Lodge tier, the Eastbrook gate and Hearth Key, the
   free Inn Room, build mode v1, about forty furnishings across all ten crafts plus vendor
   basics and the first furnishing patterns on the R8 channels, retroactive trophies from every
   existing deed and relic including the Legend Stand and the Harvestmaster sheaf, strongbox and
   one station, the Kitchen Garden tableau, the Steward's Ledger with materials and produce plus
   the Master Builder's Call, open-house visiting, the distribution gates.
3. **Phase 2, Guildhall:** guild ownership, the Hall Fund, guild bank chest, feast hall, muster
   board and war table, hall-shared stations, guild-level deeds and first-kill trophies, Manor
   and Bastion tiers, build projects.
4. **Phase 3, Wards and Charters:** shared neighborhoods, exteriors, ward favor and Endeavors,
   showcases, the on-chain Freehold Charter and deed trading on the marketplace.
5. **Phase 4, depth:** Keep and Citadel tiers, the dye station, layout sharing, a second
   freehold SKU, and the Carpenter and Mason off-wheel crafts if furnishing demand proves out.

## Sources

The six lane reports in `docs/prd/woc/housing-research/` carry every URL: `code-crypto-guilds.md`,
`code-content-systems.md`, `code-world-instancing.md` (this repository), `web-mmo-housing.md`,
`web-upkeep-ux.md`, `web-web3-land.md` (external, fetched 2026-09-05, with unverified claims
marked inline). PR #3872 was read at head `0f53c92ff7` on 2026-09-05: `docs/design/professions.md`
(the Masterwrought apex tier, Farming, the supply matrix), `src/sim/professions/CLAUDE.md`, and the
`farm_*`, `feast*`, `perfecting.ts`, `sundering.ts`, `masterwrought_materials.ts`, `apex_patterns.ts`,
`farm_patterns.ts`, `pattern_items.ts`, and `mobile_station.ts` modules.
