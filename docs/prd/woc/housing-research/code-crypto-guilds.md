<!-- Research lane appendix for docs/prd/woc/freeholds-and-guildhalls-research.md. Captured 2026-09-05 by a read-only research pass; external claims carry their source URL and unverified items are marked inline. -->

# Codebase research: crypto rails, guilds, bank, holder tiers, telemetry

**Premise moved at the 2026-09-26 release sync (G1, docs/freeholds/state.md, "Premises the 2026-09-26 sync moved"):** guild ranks are now a ladder: `guilds.ranks JSONB` holds each guild's ladder and `guild_members.rank` holds ladder ids ('r1'..'r99' too); server checks resolve per-rank permissions, not inline rank comparisons.

> **Dated research, not implementation authority.** Captured 2026-09-05. The
> [proposal](../freeholds-and-guildhalls-research.md) and [state](../../../freeholds/state.md)
> record the requirements adopted on 2026-09-06. Historical
> code inventories, editor capabilities, opinions and market figures below are context,
> not current API guarantees, WOC tuning approval or legal/store approval. Body bullets
> rewritten after capture stand beside the restored original under a "Superseded
> 2026-09-06 by D<n>" marker; the adopted text was captured at revision 383fd7da83.

Worktree: /Users/fernando/orca/workspaces/world-of-claudecraft/add-real-estate (read-only survey, 2026-09-05).

## 1. Claudium purchase rails and catalog

- Architecture. Claudium is a server-authoritative soft currency whose peg, price, balance and grant ledger live in an external economy service. The game server only proxies: `server/claudium.ts:handleClaudiumApi` dispatches `/api/claudium/*` behind `createActiveGuard`, and `server/claudium_proxy.ts` (`claudiumBalance`, `claudiumSkus`, `claudiumPurchase`, `claudiumNativeQuote`, `claudiumNativeConfirm`, `claudiumSpend`, `claudiumStore`, `claudiumHistory`, `claudiumStripeWebhook`) fails closed to typed unavailable results when `WOC_ECONOMY_SERVICE_URL` or `WOC_ECONOMY_INTERNAL_SECRET` is unset (`claudiumServiceConfigured`). Peg comment on `ClaudiumPriceResult`: 1 Claudium = 0.01 USD.
- Rails. `ClaudiumRail = 'stripe' | 'sol' | 'usdc' | 'woc'` (`server/claudium_proxy.ts`). Stripe: POST `/api/claudium/purchase` with `rail:'stripe'` returns `ClaudiumStripeIntent` (clientSecret + publishableKey); the client mounts Stripe Embedded Checkout via `src/net/stripe_checkout.ts:openStripeCheckout`; the webhook is forwarded by `handleClaudiumStripeWebhook`. Native rails (SOL, USDC, $WOC): POST `/api/claudium/native/quote` returns a service-built base64 transaction plus `split: { burnBase, treasuryBase, treasury }`; the client signs via `ClaudiumSigners.nativeSignAndSend` and posts to `/api/claudium/native/confirm` (`src/net/economy_sdk.ts:startClaudiumPurchase`, `confirmNativeSettlement`). Wired in `src/main.ts` at the `startClaudiumPurchase` call. A SOL rail exists.
- $WOC split. The burn/treasury split is computed by the service and passed through (`ClaudiumWocIntent.burnBase/treasuryBase/treasury`, `ClaudiumNativePriceResult.discountBps`). No Claudium split constant lives in this repo. The only local mirror of a schedule is the marketplace dev arm: `server/woc_market_proxy.ts:DEV_BURN_BPS = 300`, `DEV_TREASURY_BPS = 700` (3% burn, 7% treasury, 90% seller), matching README line 191.
- What Claudium buys. `claudiumStore` is filtered to two families: weapon skins (`src/sim/content/weapon_skins.ts:WEAPON_SKINS`, kind `skin`, account-wide) and bank storage SKUs (`src/sim/content/storage_charters.ts:STORAGE_SKUS`, kind `storage`: `strongbox_rung_01..12` at 6 slots each, `strongbox_charter_1/2/3/complete` at 12/24/48/72 slots). `parseSpendKind` accepts `cosmetic | skin | item | storage` but only skin and storage are handled. Guild creation is NOT Claudium: `src/sim/guild_bank.ts:GUILD_CREATION_FEE_COPPER = 10_000` (1 gold), charged by `server/paid_guild_creation.ts:createPaidGuildCreationCoordinator` (`GUILD_CREATION_FEE_GOLD`).
- Delivery/persistence. Skins: the service grant ledger is authoritative; the server mirrors into `account_weapon_cosmetics` (`server/db.ts`, columns `skin_ids JSONB`, `loadout JSONB`) via `grantAccountWeaponSkins`, injected as `configureClaudiumRuntime({grantWeaponSkins, storagePurchase})`. Storage: no grant row; `storage_purchases` table (`server/storage_purchase_db.ts`: `idempotency_key UNIQUE`, `expected_cost_claudium INT`, `status`, `spend_claim_token`) plus `storage_purchase_applied_receipts`; the flow in `server/storage_purchases.ts` (`STORAGE_KEY_PATTERN`, `STORAGE_MAX_EXPECTED_COST_CLAUDIUM = 1_000_000`) applies slots exactly once through `src/sim/bank.ts:bankGrantStorageSlots`. Next-rung Claudium price is joined onto `BankInfo` by `server/storage_store_cache.ts` (`STORAGE_PRICE_MAX_STALE_MS`).

## 2. Token firewall and no-pay-to-win text

- Guard: `tests/architecture.test.ts`, describe block "the $WOC token firewall over src/sim". The allowlist is ONE file, pinned by set equality: `FIREWALL_ALLOWED = ['src/sim/daily_rewards_stub.ts']` (holder_tier.ts and types.ts were removed from it). An allowlisted file must be a read-only projection (`PROJECTION_RULES`: exactly one `export function`, no control flow, no value imports, no re-exports).
- Banned identifiers (`FIREWALL_RE`, matched on comment-stripped source, compound-friendly, no left boundary): wallet, pubkey, solana, usdcents, pricecents, amountbase, settlementquote, bondcents, custodyclaim, lamports, base58, bs58, keypair, secret_key / private_key, blockhash, spl_token, send_transaction / sign_transaction, treasury + {wallet, pubkey, address, bps, cents, leg, share, base, cut, fee, account}, woc + {balance, price, amount, payout, transfer}, {tx, txn, bond, settlement, burn, transfer, der, escrow, payer, seller, mint} + signature, signature + {reused, required, field, header, verified, at_ms, bytes}. Bare `treasury`, `token`, `signature` are allowed (game vocabulary).
- Policy text. README.md "Web3" (lines 184 to 193): "the game never sells power: nothing bought from us, in any currency, grants stats, gear, or progression". `TERMS_AND_CONDITIONS.md` section 9: holding $WOC "never grants or withholds gameplay power"; wallet linking "is cosmetic and read-only". Section 8: virtual items are licensed, not owned; the game does not sell virtual items or currency.
- Carve-outs verbatim in `docs/prd/woc/holder-cosmetic-flair.md` line 27, `docs/prd/woc/wallet-link.md` line 56, `docs/prd/woc/marketplace.md` line 374: "token utility is appearance, convenience, access, realm-operation, or player-to-player trade". `docs/prd/woc/marketplace.md` "Constraints (non-negotiable)" (line 326): token firewall, non-custodial, the game computes no token math, graceful degradation, server authority.

## 3. Guilds

- Ranks. `server/social.ts:GuildRank = 'leader' | 'officer' | 'member'`, mirrored in `src/sim/guild_bank.ts:GUILD_RANKS` (lockstep-pinned by `tests/guild_bank.test.ts`). Server permission checks are inline `membership.rank` comparisons in `SocialService` (invite/kick/motd/events need officer-plus; promote, demote-officer, disband need leader; `guildSetRank`). No guild levels, perks, or guild-level achievements exist (grep for guildLevel/guildPerk is empty). Guild-related deeds are per-character: `soc_guild_joined`, `soc_guild_founded`, `pvp_vcup_guild_win` in `src/sim/content/deeds.ts`.
- Guild bank. `GuildBankState { treasury: copper, inventory, purchasedSlots }`; `GUILD_BANK_TREASURY_CAP = 1_000_000_000` copper; ladder `GUILD_BANK_RUNG_SLOTS` (24 then six rungs of 6, max 60), priced by `GUILD_BANK_RUNG_PRICES` (rung 0 purse-paid 9g, rungs 1 to 6 treasury-paid 2g50s to 100g). Withdraw permission: `requireOfficerBook` against `GUILD_BANK_EDIT_RANKS = {leader, officer}`, reading the session-only `PlayerMeta.guildMembership` stamp written by `stampGuildMembership` (`Sim.setPlayerGuildMembership`); every op also requires `nearBanker`. Any member can VIEW (`guildBankInfoFor` stamps `canEdit`). `IWorld` facet `src/world_api/guild_bank.ts`: `guildBankInfo`, `guildBankLog`, `guildBankDepositGold/WithdrawGold/Deposit/Withdraw/BuySlots`. Server modules: `server/guild_bank_state.ts`, `guild_bank_op_guard.ts` (`GUILD_BANK_OP_BURST = 10`, `GUILD_BANK_OP_REFILL_PER_SECOND = 2`), `guild_bank_log.ts`, `guild_bank_receipt_db.ts` (the capture also named `guild_bank_settle_gate.ts` and `guild_book_holders.ts`, an unsettled-holder index, from a branch that never merged; neither file exists at this revision or on release/v0.42.0).
- Postgres (`server/social_db.ts`): `guilds` (id, name, realm, created_at, motd, motd_set_by, pledge settings), `guild_members` (character_id PK, guild_id, rank, joined_at), `guild_events`, `guild_pledges`, `guild_pledge_cooldowns`, `guild_pledge_ladder`, `guild_banks` (guild_id PK, realm, data JSONB). Audit: `server/db.ts:bank_ledger` (op, item_id, count, copper_delta, purchased_slots_after, container 'personal'|guild, container_id). Moderation: `guild_moderation_actions` (`server/admin_guilds_schema.ts`). Guild creation is atomic in `server/guild_create_db.ts` (guild + leader + empty bank + create_fee receipt).
- Treasury currency: gold only. No Claudium or $WOC guild treasury exists anywhere.
- Pledge board (`docs/prd/guild-pledge-board.md`): pledges are declarations, not membership; officer-plus (the `GUILD_BANK_EDIT_RANKS` family) accept/reject; discovery via the world's town signposts (`src/ui/hud/guild_board/`), roster via `server/guild_roster.ts`.

## 4. Bank storage

- Access. Personal bank, Materials Vault, and guild bank all require `src/sim/bank.ts:nearBanker` (`BANKER_RANGE = INTERACT_RANGE + 2`, i.e. 7 yards) against `ctx.bankerIds`, the NPCs flagged `banker: true` in `src/sim/content/zone1.ts`, `zone2.ts`, `zone3.ts`, `proving_shore.ts`. `bankInfo`, `vaultInfo`, `guildBankInfo` stream only while in range (`bankInfoFor` returns null otherwise). Facet: `src/world_api/bank.ts` (`BankInfo`, `BankBonusSource`, `bankDeposit/Withdraw/BuySlots`, `bankUnlockSocket`, `bankSocketBag/UnsocketBag`, `vaultDeposit/Withdraw/DepositAll/BuyUpgrade`).
- Ladder (`src/sim/bank.ts`): `BANK_BASE_SLOTS = 24`, `BANK_EXPANSION_SLOTS = 6`, `BANK_EXPANSION_PRICES` (12 rungs, 500 to 1,200,000 copper), `BANK_PURCHASED_SLOTS_MAX = 72`, `BANK_MAX_BONUS_SLOTS = 16`, `BANK_BAG_SOCKETS = 4` at `BANK_SOCKET_PRICES` (100g/200g/350g/500g). Bonus slots: `server/bank_entitlements.ts:BANK_BONUS_SOURCES` (+2 email, +2 Discord, +2 wallet link, +2 per qualified referral capped at 5), computed by `computeBankBonus` and stamped at join.
- Remote bank: none. No item, mount, or spell bypasses `nearBanker`; mounts note that summoning is bags-only and a bank withdrawal is a separate step (`src/sim/mounts.ts`). The closest placeable-object precedent is the transient field crafting station `src/sim/professions/mobile_station.ts:placeMobileStationForPlayer` (`PlayerMeta.mobileStation`, never serialized; IWorld `placeMobileStation` in `world_api/professions.ts`, wire `place_mobile_station`).

## 5. Holder tiers and Seeker entitlement

- Tiers. `src/sim/holder_tier.ts:HOLDER_TIER_DEFS` (18 rungs from 1 $WOC "ember" to `WOC_MAX_SUPPLY` "sovereign"), `holderTierForBalance`, `holderTierIndexForBalance`. The sim never applies tiers as rules.
- Balances. `server/woc_balance.ts:cachedWocBalance` / `fetchWocBalance` (raw Solana RPC, `SOLANA_RPC_URL` + `WOC_MINT` server env, `CACHE_TTL_MS` = 2 min, `WOC_BALANCE_CACHE_MAX_ENTRIES = 1024`), `holderInfoForPubkey`, `/api/woc/balance` via `handleWocBalance`. Online players are refreshed by `GameServer.refreshAllHolderTiers` every `HOLDER_TIER_REFRESH_MS = 60_000` (`server/game.ts`), broadcast as the entity wire field `ht`. Wallet link: `server/db.ts:wallet_links (account_id PK, pubkey UNIQUE, linked_at)`, read by `walletForAccount`; challenge/sign flow in `server/wallet_link.ts` (`buildLinkMessage`, `verifySolanaSignature`), re-auth in `server/wallet_reauth.ts`.
- Seeker. `server/seeker_entitlement.ts` routes GET/POST `/api/seeker/entitlement` (active guard, native-app only, `WALLET_LINK_POLICY` rate limit). Claim needs a native attestation (`verifySeekerSolanaArtifactAttestation`) plus a linked wallet, then RPC-verifies a Seeker Genesis Token: `server/seeker_genesis_token.ts:isSeekerGenesisToken` checks Token-2022 extensions against `SEEKER_GENESIS_TOKEN_MINT_AUTHORITY`, `_METADATA_ADDRESS`, `_GROUP_ADDRESS` and a positive balance; RPC in `seeker_genesis_token_rpc.ts` behind `seekerRpcExecutor` (bounded, single-flight). The claim is booked once per mint in `seeker_entitlement_claims (mint PK, account_id UNIQUE, claimant_wallet, proof_version 'sgt-v1', verification_slot)` via `claimAvailableSeekerEntitlement` (conflict on an already-claimed mint). What it grants: the native daily-rewards spin (`server/daily_rewards.ts` gates `/api/daily-rewards/spin` on `hasSeekerEntitlement` and re-verifies ownership on use through `verifyCurrentSeekerEntitlement` -> `seeker_ownership_verifier.ts:createSeekerOwnershipVerifier`). Pattern: claim once, re-verify current chain ownership at each use.

## 6. Account wealth and economy telemetry

- `server/account_wealth_db.ts:ACCOUNT_WEALTH_SCHEMA`: `account_wealth (account_id PK, purse_copper, mail_copper, market_copper, total_copper, updated_at)`, index on total. Swept every `ACCOUNT_WEALTH_REFRESH_MS = 60_000` by `server/account_wealth.ts:startAccountWealthSweep` under `ACCOUNT_WEALTH_SWEEP_LOCK_KEY`; escrow totals aggregate in SQL (`aggregateEscrowTotals`) over mail/market `world_state` blobs. Reads: `readTopWealthHolders` (`TOP_WEALTH_HOLDERS_LIMIT = 100`), `accountWealthBreakdown`, `largeGoldMovementsForAccount` (10-gold threshold in `bank_ledger_indexes.ts`). A housing gold sink or escrow would need its own column and aggregation arm.
- `server/economy_telemetry.ts`: `COPPER_FLOW_SOURCES` (quest, vendor, loot, market, mail, bank, delve, craft, trade, wager, dev, other) with `SOURCE_BY_COMMAND` mapping client commands to sources (`copperFlowSourceForCommand`); an unmapped housing command books as `other`. Harvest series: `HARVEST_BANDS`, `NODE_TIERS`. Copper flow is a per-command delta trend, not a ledger.

## Reusable seams for housing

- `server/claudium.ts:parseSpendKind` + `ClaudiumGameHooks` / `configureClaudiumRuntime`: add a housing spend kind beside `storage` with a runtime hook.
- `server/storage_purchases.ts` + `storage_purchase_db.ts`: the pending-record, idempotency-key, exactly-once apply pattern. (Historical, superseded 2026-09-06: the durable-receipt half, `storage_purchase_applied_receipts`, is the exemplar state.md names; the pending-row and recovery machinery is NOT reused per D1.)
- `src/sim/content/storage_charters.ts` (`isKnownStorageSkuId`): the game-side SKU allowlist pattern.
- `src/net/economy_sdk.ts:startClaudiumPurchase` + `src/net/stripe_checkout.ts`: Stripe, SOL, USDC, $WOC checkout already wired in `src/main.ts`.
- `src/sim/guild_bank.ts:requireOfficerBook` / `GUILD_BANK_EDIT_RANKS` / `stampGuildMembership`: guild-house permissions.
- `guild_banks` JSONB-per-guild persistence (`server/social_db.ts`) and `bank_ledger` container audit rows.
- Superseded 2026-09-06 by D29 and D64 (retained as the dated trail): `server/seeker_entitlement.ts` + `seeker_ownership_verifier.ts` + `seeker_entitlement_claims`: on-chain deed claim-once, re-verify-on-use.
- Adopted: Seeker entitlement modules are historical chain-verification precedents only. Native housing access is a server entitlement, never optional-deed verification. Adopted Seeker housing is use-only; unrelated wallet rails do not authorize housing purchase. D9 keeps distribution labels out of the game server; the new eligible-checkout verifier belongs to the service.
- `server/bank_entitlements.ts:BANK_BONUS_SOURCES`: account-fact bonus registry.
- `src/world_api/<domain>.ts` facet + `tests/world_api_parity.test.ts` + `src/sim/sim_context.ts` for the new sim system and IWorld surface.
- `server/economy_telemetry.ts:SOURCE_BY_COMMAND` and `account_wealth` for reporting.

## Adopted housing boundaries

The initial Charter mirrors an account entitlement under D1. Repeated Calls and pooled
Hall Fund operations additionally require durable receipts, discoverable intent and
exactly-once recovery; do not copy a bounded receipt cache as replay authority. The service
owns guild Claudium balance and currency arithmetic. Officers authorize projects; member
plinth rights are a separate personal-display permission. Fund and donation limits require
the accepted calibration artifact. Current wallet or linked-account facts do not prove
checkout distribution eligibility. These are adopted implementation obligations, not shipped APIs.

The adopted implementation split gives 28 guild/fund setup and 28a the 07b-family
guild lifecycle extension. Guild head/history SQL is guild-keyed and separate from
account lifecycle. All current ordinary members qualify through admitted gameplay
even with the hall unloaded; membership-incarnation fencing preserves valid
observations across leave/kick/rejoin/disband without inventing historical membership.
Files 29/13a union committed guild protection with service outages. No personal
grace aggregation, offline-join activity, full-roster write fan-out or new pool is
authorized. The [service contract](../freehold-service-contract.md#guild-lifecycle-authority-and-membership-transitions)
names the exact adopted future ownership and required database evidence.
