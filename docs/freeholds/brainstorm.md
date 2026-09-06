# Freeholds and Guildhalls: adopted proposal and tree context

The packet is settled by D1-D93 in [state.md](state.md) ("Locked decisions" for D1-D75 and
"Settlement round 2" for D76-D93, which await Fernando's word). The complete answered
[ruling sheet](ruling-sheet.md) records Fernando's 2026-09-06 approval, his additions and
the round-2 rows R47-R64 (D93, R64, is the fix round's coordinator ruling). Every
decision, D1 and D9 included, is defined in state.md and never here; cite state.md for any
D. There is no separate decision or unresolved-question list here. Nothing is built.

## Adopted proposal and explicit refinements

The nine adopted proposal rulings remain the foundation: personal then guild housing,
account ownership, service-owned settlement, daily wear and weekly Ledger, money-only
land with earnable decoration/free Inn, optional web-only deeds, mobile use-only,
attributed working values and fixed housing vocabulary. Sections 3 and 8 remain
mandatory: protected crafting inputs, produce in the Ledger, decorative Kitchen Garden,
Claudium-priced Call and store-safe entitlement/copy behavior.

The approved packet makes purchase web/website-desktop only, with independent approved
website management; delivers complete Wave A first-moment/build/Steward/trophy/visit UX;
locks exact content/source manifests; excludes seasonal furniture sets, unbounded
advanced transforms and new Carpenter/Mason professions; and requires every wave's
final art. Shared account lifecycle, bounded durable histories, atomic custody and
service recovery use the reviewed source seams. Every asset-producing implementation
uses Codex. After 44 QA, 44a replaces feature-created placeholder icons/images through
Codex, then 44b revisits all Terms/legal material for the final legal-team handoff.
Earlier legal/platform/service release gates remain mandatory.

## Current tree and reuse

The source audit found no Freeholds implementation. Existing systems provide the listed
seams, but new housing owners, opaque service authorization, lifecycle/calendar bindings
and their proofs are explicit producing deliverables. Their existence is not assumed from
a similar subsystem. 13 produces the keep-forever `freehold_ledgers` relation for
immutable paid bills in `server/freehold_db.ts`; it is not an existing table. The dated
factual source inventory is in state.md; verify changed anchors before implementing a
dependent file.

## Reuse map (exact symbols, verified against the tree on 2026-09-05, drift re-checked 2026-09-06)
| Need | Reuse | Where |
|---|---|---|
| System module behind the seam | `SimContext` views, `createSimContext` passthrough | `src/sim/sim_context.ts`, `src/sim/CLAUDE.md` |
| Instanced region of the one world | `InstanceSlot` (exported from `src/sim/sim.ts`), `freshInstanceSlot`, `instanceKeyFor`, `freeInstance` (module-private in `src/sim/instances/dungeons.ts`; extend in place, never import it), `instanceOrigin`, `INSTANCE_X_BASE` bands | `src/sim/sim.ts`, `src/sim/instances/`, `src/sim/data.ts` |
| Interior shell from data | `DungeonLayout` + `DungeonInteriorVariant` (`dawnhold`), `DungeonInteriors.buildInterior`, `retireInteriorGroup` (private on the renderer, reached through the interior tracker callback) | `src/sim/dungeon_layout.ts`, `src/render/dungeon.ts`, `src/render/renderer.ts` |
| Descriptor over the wire + runtime colliders + resume re-send | `riftStateEventFor`, `applyRiftStateEvent` (private ClientWorld member), `setRiftRegion` / `clearRiftRegion` | `src/sim/rift/runs.ts`, `src/sim/colliders.ts`, `server/game.ts`, `src/net/online.ts` |
| Persisted deadlines, load-side allowlists | `serializeFarmPlots` / `normalizeFarmPlots`, `FARM_MAX_GROW_MS` | `src/sim/professions/farm_persist.ts` |
| In-kind bill planner with a published order | `planWatchFee`, `eligibleWatchFeeItemIds` | `src/sim/professions/farm_watch_fee.ts` |
| Bags-then-vault draw | `planReagentSourceDraw`, `countMinusPlanned` | `src/sim/professions/reagent_sources.ts` |
| Placed object recipe | `createGroundObject` + `templateId` + `respawnTimer = Infinity`, `feastPlacementHeight` | `src/sim/entity.ts`, `src/sim/professions/feast.ts`, `feast_placement.ts` |
| Blueprints | `RecipeItemDef` + `resolvePatternLearn` (kind `'recipe'`, the R8/D53 channels) | `src/sim/professions/pattern_items.ts`, `src/sim/content/farm_patterns.ts` |
| Station gate composition | `isAtStation`, `inRangeStationTypes`, `partySharedStationSatisfies` | `src/sim/professions/stations.ts`, `mobile_station.ts` |
| Purchase entitlement | `handleClaudiumApi`, `parseSpendKind` (file-local; extend its union in place), `configureClaudiumRuntime`, `isKnownStorageSkuId` | `server/claudium.ts`, `server/claudium_proxy.ts`, `src/sim/content/storage_charters.ts` |
| Account entitlement row | `account_weapon_cosmetics` shape, `grantAccountWeaponSkins`, injected `bankBonusForAccount` at fresh join; on the packet base 7d140843d2 `server/main.ts` binds it as a one-liner around `computeBankBonus(await bankBonusFactsForAccount(id))`, and origin/release/v0.42.0 widens it to a closure that also returns `characterCount`, so the current binding is re-verified at phase start | `server/db.ts`, `server/ws_auth.ts`, `server/main.ts`, `server/bank_entitlements.ts` |
| Domain DDL + retention | `<DOMAIN>_SCHEMA` applied by `ensureSchema`, `createRetentionSweep` | `server/db.ts`, `server/retention_sweep.ts` |
| RouteDef table | `npm run new:endpoint`, `server/http/registry.ts`, `tests/server/http/surface_inventory.ts` | `server/http/` |
| Fail-closed flag | `steamEnabled`, `riftForgeWireEnabled`, `wocMarketConfig.enabled` | `server/steam/config.ts`, `server/rift_forge_gate.ts`, `server/woc_market_routes.ts` |
| Self-wire per-account key | `emitBankSelfKeys`, `maybe` (a local closure in the `server/game.ts` snapshot emitter; each self key is one call there), `applyBankSelfWire` (strict decode) | `server/bank_wire.ts`, `server/game.ts`, `src/net/bank_snapshot_wire.ts` |
| Command dispatch sibling | `dispatchFarmingCommand`, `HEAVY_SELF_CMDS`, `JAILED_BLOCKED_COMMANDS` | `server/farming_commands.ts`, `server/heavy_self.ts`, `server/game.ts` |
| Runtime props synced from IWorld through the compile gate | `FarmPatchVisuals`, `attachSceneGroupGated`, `RENDER_PURE_CORES` (file-local pin list) | `src/render/farm_patches.ts`, `farm_patches_core.ts`, `src/render/gated_scene_attach.ts`, `tests/architecture.test.ts` |
| Placement input on mouse, pad, touch | `GroundAimController`, `padGroundAimCallbacks`, `MobileControls.onGroundAimMove/Tap`, `GroundAimReticleVisual` | `src/ui/hud/action_bar/`, `src/game/pad_ground_aim_wiring.ts`, `src/render/ground_aim_reticle_visual.ts` |
| Yaw and nudge math | `rotateStep`, `wrapAngle`, `nudgeDelta` (copy the two angle helpers; sim may not import `src/editor`) | `src/editor/placement_transform_core.ts` |
| Window families | `BankWindow` (strongbox opens the real bank), `PlantSheetWindow` (Steward panel), bags grid (palette), `ActionBarPainter` (build strip) | `src/ui/bank_window.ts`, `src/ui/hud/professions/`, `src/ui/hud/action_bar/` |
| Distribution detection | `resolveWalletCapability`, `wocMarketAttachAllowed`, `WocMarketShellBridge.wocExchangeSupported?()` (optional desktop-bridge probe, not a function export), `NATIVE_APP`, `DESKTOP_APP` | `src/net/wallet_capability.ts`, `src/game/woc_market_wiring.ts`, `src/client_origin.ts` |
| Trophy sources | `deedsEarned`, reliquary marks, `slain:*` marks, mount possession, the `perfected` stamp, Maker's Bond `ItemInstancePayload.signer` | `src/sim/content/deeds.ts`, `src/sim/reliquary.ts`, `src/sim/types.ts` |

## Work and handoff inventory

[README.md](README.md) and [progress.md](progress.md) own the complete bounded chain;
[implementation-plan.md](implementation-plan.md) owns reviewer triggers and execution
rules; [qa-checklist.md](qa-checklist.md) owns scoped and whole-wave evidence. The UX,
content, numeric and art artifacts are durable source contracts, not optional notes.
Former O1/O2/O3/O5 are concrete service/legal/calibration/art handoffs with named
producing files and release gates; O4 is Seeker use-only; O6 is the current base-sync
protocol; O7 is the full Hearth shelf contract without an invented global page cap.
All dispositions are recorded in state.md and the answered ruling sheet.
