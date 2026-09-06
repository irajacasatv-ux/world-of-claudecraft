<!-- Research lane appendix for docs/prd/woc/freeholds-and-guildhalls-research.md. Captured 2026-09-05 by a read-only research pass; external claims carry their source URL and unverified items are marked inline. -->

# Upkeep economics, decor economies, trophies, placement UX, housing monetization, guild halls

> **Dated research, not implementation authority.** Captured 2026-09-05. The
> [proposal](../freeholds-and-guildhalls-research.md) and [state](../../../freeholds/state.md)
> record the requirements adopted on 2026-09-06. Historical
> code inventories, editor capabilities, opinions and market figures below are context,
> not current API guarantees, WOC tuning approval or legal/store approval. Body bullets
> rewritten after capture stand beside the restored original under a "Superseded
> 2026-09-06 by D<n>" marker; the adopted text was captured at revision 383fd7da83.

Research report, 2026-09-05. Sources dated 2024 to 2026 where available; older ones are marked. Unverified items are flagged.

## 1. Upkeep economics

### How the cited historical sources describe upkeep

- Star Wars Galaxies (2003-era design, still run on emulators): hourly credit maintenance, small house 384/day up to guild hall 2,400/day; unpaid houses become "condemned" and the door locks until paid; abandoned buildings are packed into the owner's datapad, not destroyed. https://swg.fandom.com/wiki/Housing , https://swgr.org/wiki/structures_and_cities/
- Ultima Online: before Publish 16 (Dec 2002) any owner or friend refreshed a house by opening a door, and an unrefreshed house decayed over about 11 days; Publish 16 made the primary house auto-refresh "for as long as the account remains active"; a condemned house "cannot be refreshed, and will decay within 5 days" and its contents drop on the ground (IDOC). https://www.uoguide.com/Publish_16_-_Housing_Ownership_Changes , https://uo.com/wiki/ultima-online-wiki/technical/previous-publishes/2002-2/publish-16-part-4-2nd-december/ , https://uo.com/wiki/ultima-online-wiki/gameplay/houses-placing-a-house/condemned-houses-idoc/ , https://ultimaonline.fandom.com/wiki/Housing (90-day grace after the account lapses)
- ArcheAge: 10 to 50 tax certificates per week per house at 200 labor each; a late fee after one missed week, demolition after two, with returnable items mailed back. Patron labor regenerates 10 per 5 minutes (about 20,160/week), so one small plot is roughly 10% of a Patron's weekly labor and a large one about 50% (derived, not published). Progressive tax on 3+ properties with a hard cap after 10. https://www.tentonhammer.com/guides/archeage-housing-guide-construction-and-upkeep , https://archeage.fandom.com/wiki/Labor_Points , https://archeage.fandom.com/wiki/Tax_Certificate
- New World (2021 to present): weekly tax 250/500/750/1,000 gold by tier in a low-tax town, governor-set between 5% and 20%; nonpayment locks redecorating, trophy buffs and fast travel but never takes the house. https://www.gamewatcher.com/news/new-world-house-tax , https://newworld.fandom.com/wiki/Housing . Amazon cut taxes 90% on 23 Nov 2021 because trading posts had been shut to stop duping and players "had no means to reliably pay rent"; company income from homeowners was raised to compensate. https://www.mmorpg.com/news/new-world-applies-fix-for-time-skip-bug-reduces-housing-tax-by-90-until-december-2000123708 , https://x.com/playnewworld/status/1463205794095140871 . Lesson: upkeep must be tuned to income, and when income breaks the upkeep must follow.
- EVE Online: structures themselves burn no fuel, services do; navigation structures burn 15 to 40 fuel blocks per hour, quoted at 5M to 30M ISK/day; a Nitrogen Fuel Block was about 20.5k ISK in April 2025. https://wiki.eveuniversity.org/Navigation_structures , http://games.chruker.dk/eve_online/item.php?type_id=4051 , https://support.eveonline.com/hc/en-us/articles/207574929-Service-Modules . The Forsaken Fortress update (26 May 2020) made a structure "abandoned" after 7 days without fuel: no reinforcement, no tether, asset safety off so contents drop as loot; players were warned 48 hours ahead. Result: "trillions of ISK" looted and thousands of stations destroyed; Massively OP called removing asset safety "a colossal mistake". https://support.eveonline.com/hc/en-us/articles/360014282739-Upwell-Structures-Abandoned-State , https://tagn.wordpress.com/2020/05/26/the-forsaken-fortress-update-comes-to-eve-online/ , https://massivelyop.com/2020/06/14/eve-evolved-eve-onlines-asset-safety-bait-and-switch/ . The 2019 to 2021 "scarcity" era (ore cuts to fight inflation) made the game feel like "a second job"; a 2021 "Summer of Rage" forced CCP to promise scarcity would end by late 2021. https://kotaku.com/eve-online-facing-second-summer-of-rage-fan-outcry-1847239662 , https://massivelyop.com/2021/07/24/eve-online-announces-vague-plans-to-end-resource-scarcity-later-this-year/ , https://massivelyop.com/2020/12/28/eve-online-promises-that-scarcity-is-not-the-new-reality-in-its-2020-ecosystem-report/ , https://dunkdinkle.com/why-eve-online-players-are-angry/
- Rust (survival, not MMO): upkeep is paid in the same materials the base is built from, 10% of build cost per day for small bases rising to 33% for large ones; an empty cupboard starts decay after 24 hours. Design intent: "You cannot build larger than your resource farming can sustain." https://falconrust.com/guides/building/upkeep-guide/ , https://rustly.com/guides/rust-tool-cupboard-guide/ , https://wiki.facepunch.com/rust/the_tool_cupboard
- Conan Exiles: 7-day (168 h) timer that only counts down while the owning clan is offline and resets on login; Funcom extends it to 14 days in summer; stated purpose is avoiding server wipes. https://conanexiles.fandom.com/wiki/Building , https://supercraft.host/wiki/conan-exiles/conan_exiles_decay_settings/ , https://xgamingserver.com/blog/conan-exiles-building-decay-guide/
- Albion Online hideouts: power level decays and must be fed power cores, with a 3-day grace before damage; one green core per week is enough for a Roads hideout. https://wiki.albiononline.com/wiki/Hideout , https://albiononline.com/news/devtalk-power-cores , https://forum.albiononline.com/index.php/Thread/187378-Wanting-to-set-up-hideout-small-Guild/ . Personal islands: the official wiki blocked my fetch; one guide says "yours forever" with "no taxes" ( https://www.techfornerd.com/albion-online-personal-island-guide/ ) while a 2026 guide claims "islands close if you stop paying upkeep" ( https://www.albioncodex.com/guides/albion-online-island-guide ). UNVERIFIED conflict; my understanding is personal islands have no upkeep.
- EverQuest 2: twelve-week housing/guildhall prepay is primary-verified in [Raising the Banner, GU49](https://www.everquest2.com/news/imported-eq2-enus-1916), published 2008-10-07. The historical per-amenity amounts remain secondary context: https://eq2.fandom.com/wiki/Guild_Hall_Amenities . WOC's initial four-week limit is its own staging choice.
- No upkeep at all: WoW Midnight ("no lotteries, and no onerous upkeep", house costs a flat 1,000 gold, no repossession) https://www.icy-veins.com/wow/news/blizzard-breaks-down-how-housing-works-in-midnight/ , https://timesaver.gg/blog/wow-midnight-housing-worth-it ; FFXIV (no rent, but the plot is demolished after 45 days without the owner entering, with warnings at 30/35/42 days and suspensions during real disasters) https://www.destructoid.com/ffxiv-housing-demolition-and-relocation-explained/ , https://knowgameplay.blog/ffxiv-auto-demolish-rules-housing-guide ; Guild Wars 2 (upgrades are one-time favor and aetherium sinks) https://wiki.guildwars2.com/wiki/Guild_upgrade ; RuneScape POH (construction is a one-time gold sink; the 2025 overhaul removes the "build in a spot" cost) https://www.mmorpg.com/news/jagex-reveals-runescapes-road-to-restoration-player-owned-housing-overhauls-2000137588 , https://runescape.wiki/w/Gold_sink ; Lost Ark stronghold (no upkeep mentioned in Maxroll's guide) https://maxroll.gg/lost-ark/resources/stronghold-guide ; Black Desert (contribution points are invested, not spent, and fully refundable) https://blackdesertonline.fandom.com/wiki/Housing , https://www.blackdesertfoundry.com/contribution-points-guide/

### Tolerable range

No game publishes upkeep as a share of income. Derived anchors: ArcheAge about 10% of weekly labor for a first plot; New World 250 to 1,000 gold/week tolerated until income was cut off; Rust's 10%/day is a survival-game ceiling that MMO audiences reject (see EVE scarcity). Sinks work at the margin: the OSRS study found a transaction tax "did not meaningfully affect the trading volume" while an item sink pushed luxury prices up. https://arxiv.org/abs/2210.07970 ; Castronova and Lehdonvirta's textbook frames faucets vs sinks. https://mitpress.mit.edu/9780262535069/virtual-economies/

### Grace patterns

Lock, not destroy, is the pattern that survived: SWG lock, New World feature lock, UO 90-day account grace, Albion 3-day grace, Conan offline-only timer. The two "destroy" designs (UO IDOC drops, EVE abandoned loot) are the most resented episodes found.

### Decay while away vs while playing

Offline-only (Conan) and visit-based (FFXIV, old UO) tie decay to absence, which mostly punishes lapsed players; always-on credit or material upkeep (SWG, EVE, Rust) is the only variant that creates steady market demand.

### Key hypothesis (material upkeep raises low-tier prices)

No controlled MMO evidence found. Best analogs are decor demand, not upkeep: ESO players report decorative wax at "over 100k for one stack" and note "the expensive furnishing mats are associated with cheap crafting mats" because they drop rarely from low-tier nodes ( https://forums.elderscrollsonline.com/en/discussion/632925/we-need-to-talk-about-furnishing-mats-prices ); in WoW Midnight every decor recipe needs lumber plus old-expansion mats (Obsidium, Ghost Iron) and auction prices are "high due to material demand across multiple expansions" ( https://blizzardwatch.com/2025/10/11/housing-decor-can-craft-professions-midnight-weve-found-far/ , https://wowvendor.com/media/wow/housing-crafted-decorations/ ). EVE fuel blocks are a permanent ice sink. Treat the hypothesis as plausible but unproven.

## 2. Decor economies as crafting demand

- WoW Midnight: "Every crafting profession will be able to make decor from every expansion" (Blizzard). Found recipes: Inscription 50, Alchemy 24, Blacksmithing 20, Jewelcrafting 20, Leatherworking 18, Tailoring 18, Enchanting 17, Engineering 16, Cooking 8. Over 1,700 decor items; each placement needs its own copy. A legacy-raid blueprint (Scourge Overlord Throne) flips for 150k to 300k gold; a 1-budget Engineering item (Schmancy Goblin String Lights) "always sells quickly, and often in multiples". https://news.blizzard.com/en-gb/article/24234113/midnight-housing-rewarding-decor , https://blizzardwatch.com/2025/10/11/housing-decor-can-craft-professions-midnight-weve-found-far/ , https://lootstrategist.com/2026/07/18/wow-midnight-gold-making-profession-guide/ , https://www.icy-veins.com/wow/news/one-crafted-item-costs-1-budget-and-sells-nonstop-in-wow-midnight/ , https://www.shaylynnhayes.com/a-complete-list-of-profession-craftable-housing-decor-for-world-of-warcraft/
- ESO: ZOS makes plans rare on purpose; Murkmire green plans sell for 200k to 1M gold, vampire plans 1M to 6M, single rare Praxis plans in the tens of millions (thread dated March 2023); but crafted furniture itself sells below material cost. https://forums.elderscrollsonline.com/en/discussion/628990/insane-prices-for-blueprints , https://forums.elderscrollsonline.com/en/discussion/456589/why-dont-furniture-prices-reflect-the-cost-of-crafting , https://forums.elderscrollsonline.com/en/discussion/563388/furniture-plans-and-you-how-to-farm-them
- FFXIV: all eight crafting jobs make furnishings; only Alchemists make orchestrion rolls. https://ffxiv.consolegameswiki.com/wiki/Crafting
- WildStar (2014, older): Architect made "a good fourth of the items in housing"; FABkits were rare drops. https://www.tentonhammer.com/guides/wildstar-tradeskills-and-crafting-guide , https://wildstaronline-archive.fandom.com/wiki/Architect
- EQ2 (older): carpenters make most furniture plus sales displays that let houses act as shops. https://eq2.fandom.com/wiki/Carpentry , https://eq2.fandom.com/wiki/Sales_Display

## 3. Trophies and achievement display

- WoW Midnight: achievement decor is retroactive and once per account, then buyable in copies; final raid bosses drop Argent/Aureate/Gleaming trophies by difficulty (Gleaming was tied to Cutting Edge on PTR). https://news.blizzard.com/en-gb/article/24234113/midnight-housing-rewarding-decor , https://www.icy-veins.com/wow/news/wow-midnight-season-1-raids-reward-trophy-housing-decor/ , https://www.wowhead.com/news/cutting-edge-decor-rewards-for-midnight-house-trophies-for-raid-accomplishments-379219 , https://www.wowhead.com/guide/player-housing/midnight-decor-achievements
- OSRS: Achievement Gallery (80 Construction, 200k) with an Adventure Log showing kill and collection logs, a Boss Lair needing the boss's jar, a cape hanger whose perks work only for the owner, and Skill Hall head trophies stuffed by a taxidermist for 50k. https://oldschool.runescape.wiki/w/Achievement_gallery , https://oldschool.runescape.wiki/w/Cape_hanger , https://oldschool.runescape.wiki/w/Head_trophy_space , https://oldschool.runescape.wiki/w/Kalphite_Queen_head_(mounted)
- GW2: raid trophies bought from Glenna with Magnetite Shards only after killing that boss. https://wiki.guildwars2.com/wiki/Decoration/Guild_hall/Trophies
- EQ2: raid trophies are replicas of the monster and grant tribute-activated buffs. https://eq2.fandom.com/wiki/Raid_Trophies , https://eq2.fandom.com/wiki/Trophy
- FFXIV: achievement certificates via Jonathas buy furnishings; trophy furnishings exist (e.g. Hades Trophy). https://ffxiv.gamerescape.com/wiki/Achievement_Item_Rewards , https://en.ff14housing.com/itemview.php?id=f47bb9a69df
- Destiny 2: no trophy-display feature found. UNVERIFIED (likely does not exist).
- Satisfying pattern across these: visible to visitors, difficulty tier readable at a glance (WoW tiers, OSRS mounted heads), earned copy proof (jar, boss kill), and a linked record (Adventure Log).

## 4. Placement editor UX

- WoW Midnight: Basic mode snaps to surfaces and forbids clipping; Advanced allows free placement, scaling, floating and optional clipping; rotation snaps at 15 degrees with a second gimbal for any axis; decor auto-targets floor/wall/ceiling by type; small decor parents to large decor; grid toggle; dye system (Inscription and Alchemy craft dyes); layouts import/export with rollback; a decor-point budget (250 to 350 indoors by house level, exterior 200 to 250); pets have separate limits; visitor codes and guest book. https://www.icy-veins.com/wow/news/a-first-look-at-player-housing-interior-design/ , https://www.icy-veins.com/wow/news/midnight-housing-update-details/ , https://www.wowhead.com/news/new-house-levels-and-rewards-datamined-increased-decor-budgets-and-medium-size-379677 , https://wowprimer.com/mastering-the-editor-tools-building-your-dream-home-in-wow-midnight , https://us.forums.blizzard.com/en/wow/t/outdoor-decor-limit-is-too-low/2208949
- Sims 4: Ctrl+Z/Y per build session; Alt for off-grid; 9/0 raise and lower; moveobjects for overlap. https://www.carls-sims-4-guide.com/tutorials/building/cheats.php , https://www.positioniseverything.net/all-build-mode-hot-keys-in-the-sims-4/ , https://musthavemods.com/sims-4-build-cheats/
- Palia: overhead, grid and freeform modes; Z toggles grid; "something is in the way" blocking. https://palia.wiki.gg/wiki/Guide:Decorating_the_Housing_Plot , https://www.highgroundgaming.com/palia-housing-guide/
- Animal Crossing: strict grid, no half tiles. https://acnhchill.com/animal-crossing-new-horizons-full-guide/interior-design/ , https://www.gamesradar.com/happy-home-paradises-outdoor-design-tools-belong-in-animal-crossing-new-horizons/
- Fortnite Creative: grid snap from 1 to 1/32 tile, V or D-pad left toggles, hold to phase through collisions, 90-degree rotation. https://dev.epicgames.com/documentation/fortnite/hotkey-and-keybinding-shortcuts-in-fortnite-creative , https://dev.epicgames.com/documentation/en-us/fortnite/using-grid-snapping-in-unreal-editor-for-fortnite
- Enshrouded has undo but no free build camera (top player request; roofs are the pain point); Valheim and Nightingale use snap points, Enshrouded voxels. https://enshrouded.featureupvote.com/suggestions/525049/ , https://enshrouded.featureupvote.com/suggestions/614249/add-free-fly-to-building-bases , https://steamcommunity.com/app/1928980/discussions/0/4348858679332929573/ , https://medium.com/design-bootcamp/enshrouded-construction-mode-ux-review-f5b969e1257a (not fetchable, 403)
- Touch: two-finger rotate, keep the dragged object offset from the finger. https://mobilefreetoplay.com/control-mechanics/ , https://www.supercheats.com/iphoneipad/questions/thesimsfreeplay/241567/how-do-you-rotate-furniture-s.htm
- Gamepad: WoW has native gamepad support, most players layer ConsolePort on top. https://www.pcgamer.com/games/world-of-warcraft/playing-world-of-warcraft-with-a-controller-might-become-my-preferred-playstyle-thanks-to-this-excellent-gamepad-friendly-addon-thats-letting-me-enjoy-azeroth-from-my-couch/
- Top 10 rules: undo/redo; snap toggle with fine subdivisions; typed surface snapping; 15-degree rotation snap plus free gimbal; nudge keys for height; collision leniency as an opt-in; ghost preview with blocked-state feedback; detached build camera; a visible capacity meter; save/share layouts.

## 5. Housing monetization data

- Sims 4 passed $1B lifetime by 2019, 85M players by 2024, and the franchise posted double-digit bookings growth in Q4 FY25. https://levvvel.com/statistics/the-sims/ , https://simscommunity.info/2025/05/06/sims-franchise-andrew-fy25-q4/ , https://variety.com/2024/gaming/news/sims-4-adds-15-million-players-ea-earnings-madden-college-football-1236194103/
- ESO crossed $2B lifetime revenue by 2024 (secondary source); no furnishing share published. https://xynodegaming.com/eso-news-matt-2025/ , https://en.uesp.net/wiki/Online:Crown_Store/Furniture
- WoW: Blizzard promised housing would be "player-first and not revenue-first" and that shop decor excludes iconic or existing items; Hearthsteel launched 12 Feb 2026 at 100 per $1 with "less than 1%" of decor from the shop; by Sept 2026 players cite a $40 exterior and $75 bundle as a broken promise. https://gamerant.com/world-of-warcraft-cash-shop-housing-decor-hearthsteel-live/ , https://us.forums.blizzard.com/en/wow/t/blizzard-you-turned-player-housing-into-a-cash-register/2344065
- Palia (cosmetics-only): 3M downloads before Steam, 12k peak CCU, three outfits priced like a full game, 35% then 40% layoffs, sold to Daybreak 1 July 2024 after shrinking from 150 to 50 staff; Naavik: "revenue is hard to assess". https://naavik.co/digest/daybreak-becoming-mmo-powerhouse/ , https://www.mmorpg.com/editorials/opinion-palia-what-they-say-what-they-deliver-a-look-at-monetization-2000128715 , https://gameworldobserver.com/2024/07/02/daybreak-acquires-singularity-6-palia-1-0-launch , https://techraptor.net/gaming/news/palia-developer-singularity-6-layoffs
- FFXIV: the 45-day rule functions as a subscription retention lever (players must stay subbed to keep the house); about 2,500 houses per server vs twice that many players; the 2022 lottery botch and the 2M gil deposit sink. No official retention numbers. https://nosygamer.blogspot.com/2023/02/some-complaints-about-final-fantasy.html , https://www.pcgamer.com/final-fantasy-14-housing-lottery-explained/ , https://massivelyop.com/2022/04/18/final-fantasy-xivs-naoki-yoshida-addresses-the-current-state-of-investigation-on-the-games-housing-lottery-botch/
- Pocket Camp: Deconstructor of Fun (2017, older) says timer-driven decor monetization degrades the experience. https://www.deconstructoroffun.com/blog/2017/11/29/animal-crossing-pocket-camp-can-an-old-dog-learn-new-tricks
- Consensus: cosmetic decor sales are tolerated (WoW's under-1% shop drew mild reaction), while scarcity of land or upkeep pressure (FFXIV, ArcheAge barons, New World tax) is resented. https://thefanaticalswordsman.com/2014/11/12/the-pros-and-cons-of-archeage-housing-and-pvp/ (older). No Naavik or DoF piece on "homes as a retention loop" was found.

## 6. Guild halls

- GW2: favor from weekly guild missions, capped at 2,000/week and 6,000 total; ArenaNet: "Guild missions should be central to guild play"; aetherium is time-gated mining. https://www.guildwars2.com/en/news/guild-halls-missions-for-all/ , https://wiki.guildwars2.com/wiki/Favor , https://wiki.guildwars2.com/wiki/Guild_mission
- EQ2: amenities with weekly upkeep from escrow, prepay 12 weeks; raid trophies as guild decor. https://eq2.fandom.com/wiki/Guild_Hall_Amenities , https://eq2.fandom.com/wiki/Raid_Trophies
- FFXIV: FC workshops run submarines players check "every 1-2 days"; a leveled fleet yields about 15M gil/month. https://www.icy-veins.com/ffxiv/gil-making-free-companies , https://ffxiv.consolegameswiki.com/wiki/Subaquatic_Voyages
- WoW Midnight: guild neighborhoods need 10 active members in 30 days, 50 plots per layer, plot lost on leaving; monthly Endeavors chosen by the guild leader fill a shared favor bar that unlocks plaza decor, visiting vendors and a chest (250 housing XP, 30 coupons). https://www.icy-veins.com/wow/player-housing-neighborhoods-guide , https://blizzardwatch.com/2026/01/20/rewards-can-unlock-neighborhood-endeavor/ , https://www.icy-veins.com/wow/news/stop-ignoring-wow-neighborhood-endeavors-the-exclusive-decor-is-worth-it/
- ESO: no true guild halls; a member's house is designated, capped at 24 visitors. https://forums.elderscrollsonline.com/en/discussion/507894/what-does-guild-halls-offer-players
- Guild-level trophies: GW2 and EQ2 raid trophies; WoW raid trophies are personal, no guild first-kill banners found.

## Upkeep design recommendation (original lane recommendation, superseded 2026-09-06 by D31, D32, D34, D36 and D54; retained as the dated trail)

- Rate: a house loses 1 condition point per day out of 100 (tier 1) and repair costs materials worth about 10% of an active player's weekly gathering output, anchored on ArcheAge's first-plot share and well under Rust's 10%/day. Tier 2 and 3 cost 1.5x and 2x per repair while decaying at the same daily rate, so the share of income stays flat.
- Paid in: a weekly "repair order" of 3 to 5 low-tier gathered materials drawn from every gathering line (herb, ore, cloth, leather, fish, lumber), rotated so demand spreads and one material never spikes. Token quick fix priced at about 1.5x market value of the materials so it never undercuts gatherers. Never premium-currency only.
- Grace: condition above 30 is cosmetic (scuffs, dust). Below 30, crafting stations, trophy buffs and fast travel lock (the New World and SWG pattern). Condition never reaches destruction; decor and contents are never lost (UO IDOC and EVE's abandoned-loot rule are the two most hated outcomes found).
- Away rules: decay pauses after 7 days offline (Conan) and a returning player gets 3 repair-free days (Albion). No visit-based demolition (FFXIV).
- Guild halls: 2x decay, paid from a guild escrow that officers can prepay 12 weeks (EQ2) and members can donate to with a contribution log; cap weekly guild contribution so large guilds do not trivialize it (GW2 favor cap).
- Failure modes to design out: publish rates in the UI, never governor-set; cap total upkeep for multi-house owners with a progressive schedule and hard cap (ArcheAge); never raise upkeep to fight inflation (EVE scarcity); reduce or pause upkeep automatically when the market is offline (New World's 2021 cut).

## Adopted WOC upkeep and UX

- Condition 0 to 100 and personal/guild daily wear 1/2 are existing WOC working targets.
  Cottage/Citadel 10%/20% of measured weekly gatherer output are calibration objectives,
  not an ArcheAge formula. The labor-regeneration calculation in section 1 uses another
  denominator. The tier repair multipliers in the superseded recommendation above (1.5x and 2x)
  are not imported into the packet.
- Each approved realm-week bill includes produce plus rotating allowed nonproduce families.
  Exact item IDs, quantities, rates and rounding require the signed workbook before enablement.
  Service-owned Call pricing uses the valid quote; it is not a direct token repair in native
  clients. Explicit source selection and immutable four-week/later twelve-week prepay apply.
- Amenities work at 30 and pause below 30. Entry and decoration remain available at zero;
  WOC trophies grant no buffs at all. Ordinary wear never destroys or repossesses anything.
- Protective pause after seven absent days and three repair-free return days are adopted
  WOC policy. Conan's historical abandonment countdown is not a pause-after-seven-days
  precedent; Albion's damage grace does not verify the proposed return grace. See the
  [Funcom staff explanation](https://forums.funcom.com/t/any-news-or-updates-about-the-decay-timer-still-short-if-yes-bye/59972/13).
- Guild donations are pooled, with the service owning Claudium balance. The adopted
  account-wide weekly allowance requires its exact calibration schedule; GW2 Favor caps and
  gold receipt/withdrawal limits do not establish a per-member donation cap. See
  [ArenaNet treasury overview](https://www.guildwars2.com/en-gb/news/building-your-guild-hall/).
- Authority-recorded economic outages pause wear/debt with no catch-up or lost prepaid
  credit. File 20 measures material demand and reviews LOW budget headroom, without promising
  higher prices or automatic capacity increases.
- Editor precedents above do not enlarge WOC scope. Initial floor building has deliberate
  confirmation and bounded placement-only undo/redo; later planar/yaw and typed surfaces
  include fixed ceiling anchors. Scale, full-axis gimbal and collision leniency are excluded;
  save/load/share is later. Seasonal sets, delve pattern drops and new crafts are excluded.
- Fernando approved these refinements with R01-R46 on 2026-09-06. They are adopted
  implementation requirements; external service/legal acceptance and measured calibration
  remain the named release gates, not unanswered product recommendations.

## Not verified / not found

- Material-based upkeep raising low-tier material prices: no controlled MMO evidence; only decor-demand analogs (ESO, WoW Midnight) and EVE's fuel sink.
- Albion personal-island upkeep: official wiki blocked (403); secondary guides conflict.
- Destiny 2 trophy display: nothing found.
- Naavik or Deconstructor of Fun on "homes as a retention loop": nothing found.
- FFXIV and ESO housing revenue or retention figures: not public.
- GW2 Heart of Thorns low-tier material price spike from guild hall upgrades: not found.
- EVE per-service-module fuel rates: support page blocked (403); only navigation structure rates verified.
