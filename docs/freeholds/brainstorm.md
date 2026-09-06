# Freeholds and Guildhalls: brainstorm (the proposal plus the survey deltas)

The vision, the nine rulings, the store-safe model, the MVP slice, and the roadmap are the
proposal's (`docs/prd/woc/freeholds-and-guildhalls-research.md`, cited by section below).
This file records only what the 2026-09-05 codebase survey ADDED: the decisions the tree
forces, the reuse map with exact symbols, the new work, and the items still open.

## What the proposal locked (do not reopen)
Section 12, all adopted as written on 2026-09-05:
1. Personal first, guild second, one system.
2. Account-level ownership.
3. Settlement: convert fiat and SOL proceeds to $WOC and burn a published share (counsel
   and the economy service gate the mechanism).
4. Daily wear with a weekly ledger.
5. Land is money-only with everything inside earnable, plus the free Inn Room.
6. On-chain deed on demand in the Wards and Charters wave, web only.
7. Mobile is use-only; purchases happen on the web.
8. The illustrative price ladder and the 25 percent burn share as working numbers.
9. Names: Freehold, Guildhall, Freehold Charter, Steward's Ledger, Master Builder's Call,
   Hearth Key, Wards (plus Inn Room and Legend Stand from the deck).

Same-day additions: the app-store constraint (section 8, "do everything possible to keep
the app stores happy"), and the three PR #3872 refinements (section 3): produce joins the
Ledger, the Kitchen Garden plants nothing, the Master Builder's Call is Claudium-priced so
it exists on every platform.

The Cottage MVP (section 13) ships first, end to end on every host and every store build,
before the Lodge tier or the guild owner kind widens the architecture.

## Current state
Nothing housing-shaped exists in `src/sim/`, `server/`, `src/net/`, `src/render/`,
`src/ui/`, or `headless/` (every grep for freehold, furnish, housing, homestead, build mode
returns prose, item names, and interior-layout comments only). Every seam the proposal
names has a live sibling to copy; none has to be invented.

## Decisions the survey forces (adopted by this packet; flag any objection before Phase 1)
- D1 **Charter purchase shape.** The Freehold Charter is a once-per-account grant the
  economy service records (`owned: true`, the weapon-skin model), mirrored into a new
  `account_freeholds` row by a `configureClaudiumRuntime` hook and healed by the
  `/api/claudium/store` reconcile. It rides the existing `POST /api/claudium/spend` route
  with a game-side SKU allowlist (`src/sim/content/freehold/charters.ts`, the
  `STORAGE_SKUS` twin) and a new spend kind `freehold`. The storage flow's pending-row and
  recovery machinery is NOT reused: a plot is account state, not a live bag mutation.
- D2 **The Inn Room is tier 0 of one ladder.** One freehold record per account. Every
  account holds the free Inn Room (no upkeep, three plinths, a bed); the Cottage is an
  in-place tier upgrade of the same record, and the three plinths' trophies carry over.
- D3 **Offline hosts hold the Inn Room only.** The browser offline world and the headless
  env own the full sim module, but the Cottage tier arrives only as a server-applied grant.
  Offline, the Cottage exists through `/dev freehold cottage` under `ALLOW_DEV_COMMANDS=1`
  and in tests. Land stays money-only.
- D4 **Furnishings are a descriptor, never entities.** The layout crosses the wire as a
  small descriptor (rows of furnishing id, cell, yaw) on a pid-scoped `freeholdState`
  event, re-sent on resume like the rift floor; both hosts regenerate geometry and runtime
  colliders deterministically (the `setRiftRegion` region API). Only the handful of
  interactables (for example the gate door, the Strongbox, the station, a placed feast,
  and in later waves the boards, chests, and vendors) are `kind: 'object'` entities
  riding the normal interest-scoped snapshot.
- D5 **Freehold state is account state.** Persisted in its own `account_freeholds` row
  (`server/freehold_db.ts`), loaded once at fresh join beside the bank bonus facts, never
  inside the character blob (an alt's stale blob must never resurrect a layout). Live
  state is keyed by owner key (`account:<id>` online, `entity:<pid>` offline per D15),
  never by pid, so two
  characters of one account online at once share one house.
- D6 **The Strongbox is bank access at home.** An interactable in the plot that satisfies
  the banker proximity gate for the owner. No new container, no dupe surface; the bank
  window and its item-cell mark family come for free. Locked below condition 30.
- D7 **The station amenity composes into the existing gate.** A `StationDef`-shaped anchor
  inside the plot joins the station list handed to `isAtStation` and `inRangeStationTypes`
  for the owner; recipes and their `stationType` gates are unchanged; training still
  requires the town station (`resolveTrain` is untouched). Locked below condition 30.
- D8 **Nothing ticks.** Condition derives at read time from a stamp and elapsed realm days
  (`ctx.resetDay`, the farm absolute-deadline idiom); the ledger week reuses the realm
  weekly reset; the paid week is an indexed column evaluated at join, claim, and pay, never
  by a per-tick sweep. Visitors are the live claim roster (`InstanceSlot.enteredBy`), not a
  persisted log.
- D9 **The distribution surface map is one pure client module** with a seven-distribution
  matrix test (web, website desktop, Steam, Epic, App Store, Google Play, Seeker dApp
  Store) and a `HudFeatures.freeholdPurchaseEnabled` row. The server never learns the
  distribution; the housing purchase surface is a client gate STRICTER than the Claudium
  store's `!NATIVE_APP` rule (section 8: no purchase surface on Steam or Epic either).
- D10 **Text-free events.** Every housing deny and grant is an id-carrying, pid-scoped
  `SimEvent` (the `farmDenied` model) resolved to `hudChrome.housing.*` keys client-side;
  no `sim_i18n` or `server_i18n` matcher rows unless a phase proves it needs an English
  emit.
- D11 **The RL env excludes housing**, recorded in `headless/CLAUDE.md` beside the farming
  cut and pinned by an `ACTIONS` exclusion test.
- D12 **One PR per wave**, each off the base with `FREEHOLDS_ENABLED` defaulting off; the
  packet teardown offer comes at the very end (wave E close).
- D13 **Art is the long pole and gets stand-ins.** Furnishing and trophy GLBs land in a
  dedicated wave A phase through the `image-to-glb` skill; earlier phases render a
  stand-in kit so every code path is testable before the art exists. Item icons (WebP)
  ride the content phases as same-change obligations, as the repo requires.
- D14 **A furnishing recipe belongs to an existing craft.** Ten crafted pieces, one per
  craft, on the proposal's mapping (section 6.5); Carpenter and Mason stay a wave E option.

## Reuse map (exact symbols, verified against the tree on 2026-09-05)
| Need | Reuse | Where |
|---|---|---|
| System module behind the seam | `SimContext` views, `createSimContext` passthrough | `src/sim/sim_context.ts`, `src/sim/CLAUDE.md` |
| Instanced region of the one world | `InstanceSlot`, `freshInstanceSlot`, `instanceKeyFor`, `freeInstance`, `instanceOrigin`, `INSTANCE_X_BASE` bands | `src/sim/instances/`, `src/sim/data.ts` |
| Interior shell from data | `DungeonLayout` + `DungeonInteriorVariant` (`dawnhold`), `DungeonInteriors.buildInterior`, `retireInteriorGroup` | `src/sim/dungeon_layout.ts`, `src/render/dungeon.ts` |
| Descriptor over the wire + runtime colliders + resume re-send | `riftStateEventFor`, `applyRiftStateEvent`, `setRiftRegion` / `clearRiftRegion` | `src/sim/rift/`, `server/game.ts`, `src/net/online.ts` |
| Persisted deadlines, load-side allowlists | `serializeFarmPlots` / `normalizeFarmPlots`, `FARM_MAX_GROW_MS` | `src/sim/professions/farm_persist.ts` |
| In-kind bill planner with a published order | `planWatchFee`, `eligibleWatchFeeItemIds` | `src/sim/professions/farm_watch_fee.ts` |
| Bags-then-vault draw | `planReagentSourceDraw`, `countMinusPlanned` | `src/sim/professions/reagent_sources.ts` |
| Placed object recipe | `createGroundObject` + `templateId` + `respawnTimer = Infinity`, `feastPlacementHeight` | `src/sim/professions/feast.ts`, `feast_placement.ts` |
| Blueprints | `RecipeItemDef` + `resolvePatternLearn` (kind `'recipe'`, the R8/D13 channels) | `src/sim/professions/pattern_items.ts`, `src/sim/content/farm_patterns.ts` |
| Station gate composition | `isAtStation`, `inRangeStationTypes`, `partySharedStationSatisfies` | `src/sim/professions/stations.ts`, `mobile_station.ts` |
| Purchase entitlement | `handleClaudiumApi`, `parseSpendKind`, `configureClaudiumRuntime`, `isKnownStorageSkuId` | `server/claudium.ts`, `server/claudium_proxy.ts`, `src/sim/content/storage_charters.ts` |
| Account entitlement row | `account_weapon_cosmetics` shape, `grantAccountWeaponSkins`, `bankBonusFactsForAccount` at join | `server/db.ts`, `server/ws_auth.ts`, `server/bank_entitlements.ts` |
| Domain DDL + retention | `<DOMAIN>_SCHEMA` applied by `ensureSchema`, `createRetentionSweep` | `server/db.ts`, `server/retention_sweep.ts` |
| RouteDef table | `npm run new:endpoint`, `server/http/registry.ts`, `tests/server/http/surface_inventory.ts` | `server/http/` |
| Fail-closed flag | `steamEnabled`, `riftForgeWireEnabled`, `wocMarketConfig.enabled` | `server/steam/config.ts`, `server/rift_forge_gate.ts`, `server/woc_market_routes.ts` |
| Self-wire per-account key | `emitBankSelfKeys`, `maybe`, `applyBankSelfWire` (strict decode) | `server/bank_wire.ts`, `src/net/bank_snapshot_wire.ts` |
| Command dispatch sibling | `dispatchFarmingCommand`, `HEAVY_SELF_CMDS`, `JAILED_BLOCKED_COMMANDS` | `server/farming_commands.ts`, `server/heavy_self.ts`, `server/game.ts` |
| Runtime props synced from IWorld through the compile gate | `FarmPatchVisuals`, `attachSceneGroupGated`, `RENDER_PURE_CORES` | `src/render/farm_patches.ts`, `farm_patches_core.ts` |
| Placement input on mouse, pad, touch | `GroundAimController`, `padGroundAimCallbacks`, `MobileControls.onGroundAimMove/Tap`, `GroundAimReticleVisual` | `src/ui/hud/action_bar/`, `src/game/pad_ground_aim_wiring.ts`, `src/render/ground_aim_reticle_visual.ts` |
| Yaw and nudge math | `rotateStep`, `wrapAngle`, `nudgeDelta` (copy the two angle helpers; sim may not import `src/editor`) | `src/editor/placement_transform_core.ts` |
| Window families | `BankWindow` (strongbox opens the real bank), `PlantSheetWindow` (Steward panel), bags grid (palette), `ActionBarPainter` (build strip) | `src/ui/bank_window.ts`, `src/ui/hud/professions/`, `src/ui/hud/action_bar/` |
| Distribution detection | `resolveWalletCapability`, `wocMarketAttachAllowed`, `wocExchangeSupported`, `NATIVE_APP`, `DESKTOP_APP` | `src/net/wallet_capability.ts`, `src/game/woc_market_wiring.ts`, `src/client_origin.ts` |
| Trophy sources | `deedsEarned`, reliquary marks, `slain:*` marks, mount possession, the `perfected` stamp, Maker's Bond `craftedBy` | `src/sim/content/deeds.ts`, `src/sim/reliquary.ts` |

## New work (the packet's phases)
Wave A builds the architecture once: the facet, the sim module, the `furnishing` kind, the
content records, the instance band and interiors, the account row, the layout core and
placement commands, the render view, build mode, the two amenities, condition and the
Ledger, the surface map, the Charter and the Master Builder's Call, the Steward panel,
trophies, visiting, the art batch, and the wave close. Waves B to E only extend it (see
`README.md` and `implementation-plan.md`).

## OPEN items (an owner and a blocking verdict each)
The proposal marks nothing OPEN; these are the items that gate a RELEASE or need an
answer from outside the tree. None blocks Phase 1.
- O1 Economy-service catalog: SKU rows for the Cottage Charter and the Master Builder's
  Call under spend kind `freehold`, the settlement conversion policy, the burn share
  publication. Owner: the economy service and Fernando. Blocks the purchase flow going
  live (Phase 15 ships behind the flag against a fake service).
- O2 Counsel memo and Terms revision (entitlement now, deed later); store-listing text
  (Google Play declares tokenized assets; App Store copy mentions no token, wallet, or
  deed). Owner: counsel. Blocks enabling `FREEHOLDS_ENABLED` in production and the native
  store submissions, never the build.
- O3 Upkeep rate literals: stack counts per line and the seeded weekly order (content,
  flagged TUNING for the maintainer like `FARM_WATCH_FEE_BY_TIER`). Owner: Fernando.
  Phase 13 ships a draft and the MVP measures for four weeks.
- O4 The Seeker dApp Store purchase row: section 8 says "wallet rails per the existing
  Seeker capability", but the Claudium store attaches only when `!NATIVE_APP` today. Phase
  14 pins the matrix from the real code; if the tree cannot honour section 8 for Seeker
  without native billing work, the row becomes "usable, manage on the website" and
  Fernando rules. Owner: Fernando.
- O5 Furniture art references for the image-to-glb pipeline (about twenty furnishings,
  the trophy families, the Cottage and Inn Room dressing). Owner: Fernando. Blocks Phase
  19, not the code before it.
- O6 PR #3872 is CONFLICTING against `release/v0.42.0` at packet creation; every phase
  merges its fresh head until it merges. Owner: Fernando's release process.
- O7 The Reliquary page budget for furnishing items (the proposal grants a Hearth shelf;
  patterns take none). Phase 03 follows `docs/design/reliquary.md`; a page count over the
  shelf contract goes back to Fernando.
