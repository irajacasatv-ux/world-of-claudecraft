<!-- Research lane appendix for docs/prd/woc/freeholds-and-guildhalls-research.md. Captured 2026-09-05 by a read-only research pass; external claims carry their source URL and unverified items are marked inline. -->

# Web3 virtual land, housing, and game-token design: research report

> **Dated research, not implementation authority.** Captured 2026-09-05. The
> [proposal](../freeholds-and-guildhalls-research.md) and [state](../../../freeholds/state.md)
> record the requirements adopted on 2026-09-06. Historical
> code inventories, editor capabilities, opinions and market figures below are context,
> not current API guarantees, WOC tuning approval or legal/store approval.

Date: 2026-09-05. Sources are 2024 to 2026 unless marked older. Claims that rest on search snippets or secondary write-ups (DappRadar, Medium, the Star Atlas Q2 2026 economy PDF, and the Pixels fandom page were blocked to fetch) are marked where used.

Scope: the examples below are dated reports, several secondary or unverified. They do
not establish that every land project failed, forecast WOC prices, or prove a legal
exemption. WOC retains no rent/profit rights and server-entitlement access as product
constraints; signed current platform/legal acceptance remains mandatory.

## 1. Virtual land history and outcomes

- **Decentraland.** 90,601 parcels, fixed, sold in MANA auctions 2017 to 2018 (https://decentraland.fandom.com/wiki/LAND). Average floor 1.73 ETH (2022) to 0.18 ETH (Jun 2024), down 89% (https://www.coingecko.com/research/publications/metaverse-land-prices); about $60 today (https://www.coingecko.com/en/nft/decentraland). A $2.4M 116-parcel estate marks near $8.9k (https://cryptoslate.com/rip-metaverse-land-values-capitulate-as-24m-metaverse-plot-collapses-to-just-9000/). Use today is events and builder scenes; a secondary write-up citing Foundation analytics claims 68k monthly wallet connections (Feb 2026) and $4.2M Q4 2025 secondary sales (https://www.cryptonewsnavigator.com/academy/article/decentraland-isnt-dead-and-the-virtual-land-data-proves-it; unverified against primary data). The 2022 "38 DAU" dispute shows chain-only DAU undercounts play (https://www.coindesk.com/web3/2022/10/07/its-lonely-in-the-metaverse-decentralands-38-daily-active-users-in-a-13b-ecosystem).
- **The Sandbox.** 166,464 LAND, fixed (https://crypto.com/price/nft-collections/sandbox-1?blockchain=0). 2.86 ETH (2021) to 0.13 ETH (2024), down 95% (CoinGecko above); about 0.058 ETH / $63 in 2026 (https://coinstats.app/nft/the_sandbox-2/). 25,000+ owners by 2024 (https://www.sandbox.game/en/blog/looking-back-on-2024-and-whats-next-for-the-sandbox/3426/); use is seasonal quest experiences, some NFT-gated (https://sandboxgame.medium.com/everything-you-need-to-know-about-alpha-season-4s-nft-gating-0821b9013441). The asset failed; the creator platform limps.
- **Otherside / Otherdeeds.** 55,000 deeds at 305 APE (~$5,800) sold out in about three hours on 30 Apr 2022; 55,843 ETH (~$157M) burned in gas; Yuga refunded failed-tx gas (https://decrypt.co/99219/otherside-nft-mint-burned-more-157m-ethereum, https://decrypt.co/99521/yuga-labs-refunds-gas-fees-for-failed-transactions-during-bored-ape-otherdeed-mint). Floor 5 ETH (May 2022) to 0.28 ETH (2024) (CoinGecko above) to 0.109 ETH (~$210) in Jul 2026 (https://www.forbes.com/digital-assets/nfts/otherdeed-for-otherside-othr/). Yuga cut staff to focus on Otherside (https://www.theblock.co/post/255243/yuga-labs-cuts-employees-focuses-on-metaverse-extension-amid-restructuring), sold the CryptoPunks IP in May 2025 (https://www.theblock.co/post/354114/yuga-labs-sells-cryptopunks-ip-to-nonprofit-infinite-node-foundation), and only the 2025 to 2026 roadmap promises land-based production and crafting (https://insidebitcoins.com/news/yuga-labs-reveals-the-otherside-nft-roadmap-for-2025-2026). Land sold four years before land gameplay.
- **Axie Infinity Homeland.** Lunacia plots are tokenized (https://whitepaper.axieinfinity.com/gameplay/land). Passive AXS land staking ended in 2023 and holders dumped (https://www.blockchaingamer.biz/news/30056/end-of-axie-land-staking-tarnishes-launch-of-homelands-open-beta/). Homeland's 190,000 AXS/month pool (https://blog.axieinfinity.com/p/homelands-reward-renaissance) sunsets 17 Jun 2026 (https://www.tradingview.com/news/coindar:649e1fefb094b:0-axie-infinity-to-sunset-homeland-on-june-17/) for Terrariums: activate a plot, spend Lunium (Global Lunium bought with crypto, non-tradable, revenue to Sky Mavis), earn in-game-only bAXS (https://www.blockchaingamer.biz/news/42450/sky-mavis-launches-axies-land-nft-game-terrariums/). The full land game was cut to a yield loop.
- **Illuvium Zero.** 19,969 plots by Dutch auction on Immutable X, 2 to 5 Jun 2022, 4,018 ETH (~$72M) (https://cointelegraph.com/news/72m-illuvium-nft-land-dutch-auction-saves-buyers-thousands-on-gas-fees). Five tiers; T5 boosts fuel up to 900% (https://illuvium.fandom.com/wiki/Lands; https://portal.illuvium.io/governance/iip-20). 20,000 of a planned 100,000 exist, "no additional Land sales are currently planned", Zero gets minor updates only (https://portal.illuvium.io/illuvium-zero-frequently-asked-questions-faq). IIP-45-R (Jan 2024) gives landowners 5% of digital product revenue (https://portal.illuvium.io/governance/iip-45-r). About 40% of staff cut early 2025; ILV is 99.8% off its high (https://decrypt.co/307115/illuvium-ethereum-game-studio-restructuring; https://thedefiant.io/news/nfts-and-web3/illuvium-team-cuts-wages-to-extend-runway).
- **Pixels (Ronin).** 5,000 Farm Land NFTs, Feb 2022, minted by the top 2,000 point earners (https://coinjournal.net/nfts/farmland-by-pixels/buy/). Free Specks, rented plots (renter forfeits a large yield share), owned plots (highest yield, exclusive industries, sharecropper income) (https://docs.pixels.xyz/economics/land). Land specs purchasable with in-game currency as a "limited teaser" of ownership (https://pixels.fandom.com/wiki/Pixels_Land_Info; snippet only, page blocked). Floor about 0.125 ETH (https://opensea.io/collection/pixels-farm). DAU went 5k to 1.5M after the Ronin move (https://x.com/Ronin_Network/status/1872621252885848195) then fell (https://medium.com/@footprintofficial/june-2024-web3-game-report-pixels-decline-and-sector-insight-833b25db8ab8); response: VIP paywalls, staking tied to in-game spend, heavier withdrawal fees (https://games.gg/news/pixels-updates-token-utility/). Land held better because it is a production input.
- **Star Atlas (Solana).** Claim Stakes: five tiers priced in USD, $32 Common to $7,776 Legendary (https://playtoearn.com/news/star-atlas-introduces-claim-stakes-heres-everything-you-need-to-know-, Dec 2022); enlistable for passive R4 resources, live in the C4 test realm (https://aephia.com/star-atlas/weekly-star-atlas-newsletter-237/). Fixed per tier; still pre-launch. POLIS holders took control of a $1.67M DAO treasury in Jul 2025 (https://coinmarketcap.com/cmc-ai/star-atlas-polis/latest-updates/, secondary).
- **Big Time SPACE (closest analog).** Instanced expansion of the player's Time Machine: 5 rarities x 3 sizes, immutable issuance table; rarity caps attachable Workshops (Forges, Armories, Time Wardens) and craftable cosmetic/hourglass rarity, size caps slots; bought or rented on Open Loot (https://wiki.bigtime.gg/big-time-economy/economy-components/personal-metaverse/space; https://about.openloot.com/rentals). Launch $299 (Rare Small) to $3,299 (Exalted Large); by Apr 2022 most types traded below launch and five tiers were judged too many (https://gamestx.substack.com/p/deep-dive-into-big-time-land-pricing). Hourglasses crafted in SPACE gate BIGTIME drops; the 2025 economy update raised hourglass cost and time (https://playtoearn.com/news/big-time-releases-economy-update-with-changes-to-hourglass-crafting-more). BIGTIME $0.729 (Dec 2023) to about $0.009 (Sept 2026) (https://www.coinlore.com/coin/big-time). Utility persists; prices did not. Current SPACE floors: unverified.
- **Sunflower Land.** Farms expand progressively, no fixed scarcity; FLOWER (May 2025) sinks: 5 to 20% trade fees, auctions, gem buys; only 75% of spent FLOWER recycles; seasonal resources expire after 3 months (https://docs.sunflower-land.com/project/economy-tokenomics.md; https://games.gg/news/sunflower-land-flower-token/). Expansion-as-NFT: unverified.
- **Parallel.** No land; Colony (Solana, Seeker-only alpha Sept 2025) sinks PRIME into AI avatars and cosmetics (https://playtoearn.com/news/parallel-colony-early-alpha-access-solana-seeker; https://docs.echelon.io/echelon-prime-foundation/3.0-prime-sinks/3.1-live-sinks/avatars); 10% of supply burned Jul 2025 (https://coinmarketcap.com/cmc-ai/echelon-prime/latest-updates/, secondary).

## 2. What killed most land models

- **Speculation before gameplay.** Caladan (Apr 2026): 93% of web3 games dead, 300+ shut, tokens ~95% off, Axie DAU 2.7M to ~5,500, studios raised before shipping (https://www.coindesk.com/markets/2026/04/23/more-than-90-of-web3-games-failed-after-usd15-billion-boom-as-gamers-never-showed-up-caladan). Ember Sword took $203M in land pledges (Aug 2021), realized about $11M, shipped early access Dec 2024, shut May 2025 (https://www.pcgamesn.com/ember-sword/shut-down-crypto-mmorpg; https://gamerant.com/ember-sword-shutting-down-why-crypto-game-funding-ran-out-blockchain/). MMORPG.com, May 2026: builders "forgot they were supposed to be building games" (https://www.mmorpg.com/columns/pixel-real-estate-and-empty-worlds-what-happened-to-the-web3-gaming-future-2000138049).
- **Fixed scarcity locked out late players** and collapsed anyway: six-figure parcels pushed players into DAOs (https://spectrum.ieee.org/metaverse-real-estate, 2022); average land fell 72% by mid-2024 (CoinGecko above).
- **Rentals hollowed play.** Axie scholarships split 70/20/10 (https://medium.com/yield-guild-games/yield-guild-explains-play-to-earn-and-scholarships-bb1e097c2a61); YGG scholar revenue was about $94k in Q1 2022 and more scholars did not raise it (https://naavik.co/digest/yield-guild-games-update/, 2022); Pixels rented plots forfeit most yield (docs above).
- **Extractive emissions.** SLP emissions dwarfed the breeding sink; SLP fell from $0.39 to under $0.004 (https://chainclarity.io/axie-infinity; https://www.coindesk.com/tech/2022/02/08/axie-infinity-reduces-slp-emissions-to-prevent-collapse). Delphi (Dec 2025): incentive dependence, bot-heavy revenue, funding down 55% YoY (https://www.cryptopolitan.com/delphi-digital-for-web2-5-as-gamefi/). BGA 2025: "era of discipline", revenue-first (https://blockchaingamealliance.net/bga-2025-state-of-the-industry-report/).
- **Regulators and platforms.** SEC Stoner Cats (2023, $1M, NFTs destroyed) (https://www.wsgr.com/en/insights/not-so-nfty-what-the-impact-theory-and-stoner-cats-enforcement-actions-could-mean-for-nfts.html); Dapper $4M class settlement 2024 (https://www.coindesk.com/policy/2024/06/04/dapper-labs-agrees-to-4m-settlement-in-class-action-securities-suit); South Korea still bars P2E/NFT games as gambling (https://casinobeats.com/2025/08/05/uncertainty-swirls-over-south-koreas-nfts-video-games-are-a-form-of-gambling-stance/); Steam ban (section 4).

## 3. Token utility patterns with durable demand

- **Meaningful sinks are mandatory-path sinks.** MapleStory N: Fission (burn NXPC) is the only way to create items, Fusion redeems them; plus quarterly burns of 20% of revenue (3.84M NXPC on 27 Nov 2025) (https://playtoearn.com/news/maplestory-universe-introduces-quarterly-nxpc-token-burn-starting-nov-27; https://dappradar.com/blog/maplestory-universe-nxpc-token-economy-tokenomics). Sunflower: 5 to 20% trade fees, 75% recycle (docs above). Pixels emitted 22M PIXEL versus 11M spent in one month and targets 1:1 (https://egamers.io/pixels-introduces-new-features-and-token-insights/). One-off supply burns (Parallel's 10%) are cosmetic: no recurring demand.
- **Buy with fiat, settle in token.** Immutable: 20% of every fee must be paid in IMX; if the payer lacks IMX the protocol buys it on market (https://medium.com/coinmonks/tokenomics-101-immutable-x-1bc3c32d6d7b); staking is funded by that fee pool, not inflation, since Jun 2025 (https://nftnewstoday.com/2025/07/24/inside-the-imx-ecosystem-can-staking-sustain-nft-innovation-on-immutable). Illuvium: non-Fuel purchases trigger Fuel buy-back and burn (IIP-45-R above). Axie Terrariums: crypto buys non-tradable Lunium (above). Helium: USD-pegged Data Credits are minted only by burning HNT, so burn volume rises when price falls (https://docs.helium.com/tokens/data-credit/; https://docs.helium.com/tokens/hnt-token/).
- **Token-gated access and tiers.** Sandbox season NFT gating and Pixels VIP (above) work because the gate is content and convenience, not stats.
- **Staking or locking for perks.** Star Atlas POLIS locker is vote-escrow (https://coinmarketcap.com/cmc-ai/star-atlas-polis/latest-updates/, secondary); Illuvium stakers can take sILV2 spendable in-game (https://medium.com/illuvium/28-everything-you-need-to-know-about-staking-ilv-6669594b2fac); Pixels auto-stakes in-game balances and routes withdrawal fees to stakers (above).
- **USD-denominated upkeep paid in token** (the Helium pattern) creates recurring buy demand that self-adjusts to price; the risk is that if upkeep is also payable in materials, the token leg is optional and demand vanishes in a downturn.
- **Buybacks.** Ronin about $4.5M RON buybacks from Sept 2025 (https://finance.yahoo.com/news/ron-crypto-parabolic-ronin-reveals-204503011.html); YGG $1.1M in Q4 2025 (https://coinmarketcap.com/cmc-ai/yield-guild-games/latest-updates/) yet shut YGG Play on 31 Jul 2026 (https://decrypt.co/372852/yield-guild-kills-crypto-game-publishing-arm-lays-off-35-ai-pivot); Illuvium IIP-22 daily vault buybacks (https://portal.illuvium.io/governance/iip-22); buybacks became widespread in 2025 (https://www.dwf-labs.com/research/547-token-buybacks-in-web3). Buybacks support price, not demand.
- **Legal interpretation requires counsel.** The original secondary summary at https://www.gtlaw.com/en/insights/2026/3/sec-clarifies-status-of-crypto-assets-under-federal-securities-laws-signals-potential-exemptive-and-safe-harbor-framework is historical context, not a finding that all in-game items without profit rights are exempt. The complete WOC rights, transactions and promotion need current primary-law analysis; no single economic attribute settles classification.
- **Counter-argument.** Fiat/SOL-only land with optional $WOC upkeep gives the token no mandatory path. Delphi recommends removing speculative token design and using stable-value payments (above); a16z frames app-token demand as "cash flows" from fees on legitimate activity (https://a16zcrypto.com/posts/article/guide-to-tokens/, Aug 2024). The synthesis from Immutable, Helium, and MapleStory: price in USD, settle every land purchase and upkeep by auto-buying $WOC with the fiat or SOL and burning or treasuring it, so demand exists without any player holding or selling $WOC and without selling power.

## 4. Policy verification and proposed WOC boundary (2026-09-05)

- **US/EU:** this survey provides no securities, MiCA or CLARITY safe-harbor opinion. A
  unique plot tuple or collection membership cannot decide legal fungibility. Current
  legislation and authority remain counsel-artifact verification work. Original trails:
  [SEC remarks](https://www.sec.gov/newsroom/speeches-statements/atkins-remarks-regulation-crypto-assets-031726),
  [ESMA MiCA](https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica).
- **Apple:** review the actual entitlement/checkout flow against 3.1.1, 3.1.1(a), 3.1.3(b)
  and 3.1.5. Multiplatform content has in-app-availability conditions; server entitlement
  alone does not establish approval. The old blanket mining/ICO ban was overbroad; the
  guidelines have specific permitted categories and qualifications. [Apple guidelines](https://developer.apple.com/app-store/review/guidelines/).
- **Google Play:** declaration/disclosure depends on the actual tokenized-asset behavior;
  returns from trading/play cannot be glamorized. WOC's no-earn marketing rule is stronger
  editorial scope, not a literal ban on ordinary achievement wording. [Google policy](https://support.google.com/googleplay/android-developer/answer/13607354).
- **Steam:** item 13 prohibits blockchain applications issuing or exchanging crypto/NFTs.
  The packet's absent wallet/deed/purchase surfaces do not themselves prove acceptance.
  [Steam onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding).
- **Epic:** official general guidelines require the Blockchain Addendum. The exact current
  blockchain page could not be retrieved in the source verification. Historical third-party
  marketplace-link and country summaries above are not present-day authority; the packet's
  no-purchase/no-deed row is its own stricter product choice.
- **Seeker:** unrelated wallet capability is not a housing integration. The relocated current
  publisher policy needs verification in the signed handoff; adopted housing is use-only.
- **Implementation scope:** browser web and website desktop checkout only; other distributions
  use-only subject to the accepted entitlement model. No native billing work. Management
  links are independently approved and default off. Optional deeds require signed supported-
  country authority with unknown-country refusal, never a Korea-only legal assumption.
- No paid randomized property, rent, fractional rights or investment promises. Counsel,
  Terms, service and listing acceptance gate release; no acceptance is claimed by this lane.

## 5. Solana specifics

- **Chosen later standard:** Metaplex Core. Its approximate 0.0029 SOL base-asset benchmark is dated context; the service quotes plugins, fees and storage. Per-asset permanent freeze/burn capabilities configured at mint do not authorize automatic lapse destruction. Individual restrictions cannot be implemented by freezing the entire collection. [Core](https://www.metaplex.com/docs/core), [Permanent Freeze Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-freeze-delegate), [Permanent Burn Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-burn-delegate). Other historical compression cost figures are not adopted housing tariffs.
- **Royalties.** Magic Eden and Tensor treat royalties as optional unless the collection enforces them via MIP-1 or Core (https://help.magiceden.io/en/articles/6645652-understanding-optional-royalties-on-magic-eden-how-royalties-work-on-me; https://www.theblock.co/post/177414/solana-nft-platform-magic-eden-opts-for-optional-royalty-payments).
- **Precedents.** Star Atlas Claim Stakes (USD-priced, section 1); Honeyland minted 4,001 Land NFTs in 2024, market cap about $367k (https://www.coingecko.com/en/nft/honeyland-land); Nyan Heroes shut 16 May 2025, Genesis Cats down 70%+ (https://decrypt.co/320501/solana-game-nyan-heroes-shuts-down); Aurory rebranded from Seekers of Tokane in Oct 2025, no land (https://solanacompass.com/projects/aurory).
- **MapleStory N (Avalanche Henesys L1, live 15 May 2025).** Items are NFTs; NXPC Fission is the sole item source, Fusion redeems; NESO is the soft currency; 20% of quarterly revenue is burned (https://decrypt.co/320289/maplestory-n-game-avalanche-surging-nxpc-token; burn article above; Reactor fusion relaunch Jan 2026: https://medium.com/maplestory-universe/announcement-reactor-item-fusion-relaunch-advance-guide-c8031bc5fec1). No housing system found.

## 6. Guild-owned property

- YGG held Axie land as 15.8% of treasury ($2.78M) in Sept 2021 (https://medium.com/yield-guild-games/yield-guild-games-asset-treasury-report-september-2021-1de8b56fdd5e); scholar revenue collapsed (Naavik above); YGG Play closed 31 Jul 2026 (Decrypt above). Guild-as-landlord did not hold.
- EnterDAO LandWorks (Decentraland/Voxels rental protocol) and MetaOasis DAO (35 Sandbox plots) were 2022 experiments (https://medium.com/enterdao/enabling-permissionless-land-renting-through-landworks-7a2a428bb0a2; IEEE above); no 2024+ activity verified.
- Star Atlas DACs pool ships and claim stakes under multisig treasuries with on-chain voting (https://aephia.com/star-atlas/guilds-in-star-atlas/): the only living precedent, still pre-launch. Solana Squads-multisig deed ownership for a guild hall: no game precedent found.

## Adopted WOC constraints, external acceptance gates remain

1. Ship useful housing before optional deed transfer. Historical losses are not a WOC forecast.
2. Keep account entitlements available without artificial land scarcity; finite runtime claims
   return busy/retry. Five sequential tiers follow the adopted proposal, not this lane's old
   three-SKU recommendation.
3. No new power, farm beds, rent, revenue share or fractional rights. Existing crafts provide
   furnishings; seasonal sets, delve patterns and new Carpenter/Mason crafts are excluded.
4. Service owns all quote/conversion/burn/treasury values. No game-side token arithmetic,
   mandatory player wallet for home use or guaranteed token-price effect.
5. Signed counsel/Terms/service/territory acceptance gates the complete flow. Unique metadata
   is a technical requirement, never automatic SEC/MiCA/CLARITY approval.
6. Optional deeds use individually authorized per-asset delegate rights. No lapse burn or
   native chain-gated entry. Irreversible burn needs separately recorded authority.
7. Voluntary furnished sale uses an immutable shell/tier/eligible-copy manifest; trophies,
   personal/bound/locked copies and omitted goods stay with the seller in verified custody.
8. Browser web and website desktop are the adopted checkout/deed surfaces. Seeker and the
   other storefront builds are use-only; default-off management has separate approval.
9. Guild ownership and pooled currency remain service/server records with role checks and
   member plinth rights, not a speculative multisig property system.
