<!-- Research lane appendix for docs/prd/woc/freeholds-and-guildhalls-research.md. Captured 2026-09-05 by a read-only research pass; external claims carry their source URL and unverified items are marked inline. -->

# Housing research: world, instancing, props, persistence, editor, guilds, mobile

> **Dated research, not implementation authority.** Captured 2026-09-05. The
> [proposal](../freeholds-and-guildhalls-research.md) and [state](../../../freeholds/state.md)
> record the requirements adopted on 2026-09-06. Historical
> code inventories, editor capabilities, opinions and market figures below are context,
> not current API guarantees, WOC tuning approval or legal/store approval. Body bullets
> rewritten after capture stand beside the restored original under a "Superseded
> 2026-09-06 by D<n>" marker; the adopted text was captured at revision 383fd7da83.

Read-only survey of the World of ClaudeCraft codebase (worktree add-real-estate,
2026-09-05). Facts with `path:symbol` citations, organized by the seven questions,
ending with recommendation inputs.

## 1. Instancing

- One Sim, one coordinate plane. An "instance" is a REGION of the same world, not a
  separate Sim: everything past `src/sim/data.ts:DUNGEON_X_THRESHOLD`
  (`INSTANCE_X_BASE` 99,400 + 600) is flat floor (`src/sim/world.ts:groundHeight`
  returns `DUNGEON_FLOOR_Y`) with instance-local collision
  (`src/sim/colliders.ts:isInstancedRegion`). Each dungeon owns an x-band
  (`data.ts:instanceOriginX`: base+900+index*600; overflow band base+15,000 for
  index >= 7, `DUNGEON_OVERFLOW_INDEX`); slots stack along z at 500 yd
  (`instanceOrigin`, `instanceSlotForZ`). `INSTANCE_SLOT_COUNT` = 24 per dungeon;
  rifts `RIFT_SLOT_COUNT` = 64 at `RIFT_X_MIN` base+9000; delves `DELVE_SLOT_COUNT`
  24; arena (`ARENA_X`), Yumi maze (`YUMI_BAND_X_MIN`), battleground bands too.
- Slots are empty records pre-allocated in the Sim ctor
  (`src/sim/instances/instance_slot.ts:freshInstanceSlot`; loop in `src/sim/sim.ts`
  over `DUNGEON_LIST`). `src/sim/instances/dungeons.ts:enterDungeon` finds the
  group's existing claim or the first `partyKey === null` slot (else the error
  "All instances of X are busy"), `claimInstance` spawns the DungeonDef's
  mobs/npcs/objects as ordinary entities at origin+offset (`createMob`, `createNpc`,
  `createGroundObject`) and `settleTeleportArrival` moves the player. Instance key
  `instanceKeyFor`: `party:<id>` or `solo:char:<characterId>` (durable across relog,
  issue #1600), so every character already gets a private copy.
- Entry/exit: walk within `DOOR_TRIGGER_RADIUS` 2.0 of a `dungeon_door` object
  entity (`updateDoorTriggers`) or the `enter_dungeon` command gated by
  `server/dungeon_door.ts:findDungeonDoorNear` (8 yd); a `dungeon_exit` ground
  object drops the player at `doorPos + leaveOffset` (`leaveDungeon`).
- Lifetime: `updateInstances` (1 Hz) frees a claim empty for
  `src/sim/types.ts:INSTANCE_EMPTY_TIMEOUT` 300 s (15 min if cleared,
  `src/sim/instances/dungeons.ts:INSTANCE_CLEARED_EMPTY_TIMEOUT`) and despawns its
  entities (`freeInstance`).
  Slots are never persisted; `src/sim/rift/persistence.ts` states runtime instances
  are not restored after a restart.
- Cost model: an unclaimed slot is a plain object; a claimed one is its entities in
  the single `entities` map, ticking like the overworld. Interest:
  `src/sim/types.ts:PLAYER_INTEREST_RADIUS` 90 (NPCs
  `server/interest_policy.ts:NPC_INTEREST_RADIUS` 120; `BG_MATCH_INTEREST_RADIUS` 300),
  per-cell shared gathering `server/interest_candidates.ts`, tiered cadence
  `server/entity_update_cadence.ts:isUpdateDue` (full <= 55 yd, half <= 80,
  quarter beyond). `server/tick_profiler.ts:TickProfiler` measures per-phase ms
  (sim / snapshot / events / saves); nothing is accounted per instance.
- Renderer: `src/render/renderer.ts` (~line 9530) builds an interior when the
  player is within 200 x / 250 z yd of any `instanceOrigin(dungeon.index, slot)`
  via `buildInterior(dungeon.interior, ox, oz)` keyed `${dungeon.id}:${slot}`;
  `src/render/dungeon.ts:buildInterior` builds KayKit-kit rooms from
  `src/sim/dungeon_layout.ts` layouts (~30 draws per interior instance; variants by
  `variantFor`); colliders derive from the same layouts
  (`src/sim/interior_collider_sets.ts:derivedInteriorColliders`).
- Rift precedent (descriptor-driven, `docs/design/rift-portals.md`,
  `docs/design/rift-mode.md`): only `{seed, baseLevel, floorIndex, origin}` crosses
  the wire (`src/world_api/dungeons.ts:riftFloor`), both hosts regenerate geometry
  (`src/sim/rift/rift_gen.ts:generateRiftFloor`, with its OWN Rng, never the sim's)
  and publish colliders at runtime with
  `src/sim/colliders.ts:setRiftRegion/clearRiftRegion` (the only runtime-registered
  collision mechanism; `allocRiftCollisionToken`). Rift world events persist via
  `src/sim/rift/persistence.ts:serializeRiftWorldState/loadRiftWorldState` and
  `server/db.ts:saveRiftState` into `world_state`.
- Personal-space precedent: `src/sim/content/dungeons.ts:dawnhold_castle` is a
  zero-combat walk-in palace (`spawns: []`, `staticDoor: true`, `suggestedPlayers:
  1`, interior 'dawnhold', one keepsake ground object; the Last Keep 'lastkeep' is
  the same pattern). Delves carry a companion NPC (`src/sim/delves/companion.ts`).
  No garrison-like persistent personal space exists.

## 2. Zones

- `src/sim/data.ts:ZONES` (15 `ZoneDef`s, `src/sim/types.ts:ZoneDef` with
  `levelRange`, `zMin/zMax`, optional `xMin/xMax`, `hub`, `pois`), a grid:
  `WORLD_SIZE` 360 center strip plus east/west columns; `WORLD_MIN_X/MAX_X/MIN_Z/
  MAX_Z` derive from the zone rects, so a new column or band extends the bounds
  automatically.
  - Center x[-180,180]: `eastbrook_vale` z[-180,180] L1-7 hub Eastbrook (-14,-100)
    (`src/sim/content/zone1.ts`); `mirefen_marsh` z[180,540] L6-13 hub Fenbridge
    (0,300) r34 (`src/sim/fenbridge_layout.ts:FENBRIDGE_LAYOUT.hub`, zone2.ts);
    `thornpeak_heights` z[540,900] L13-20 Highwatch (0,660) (zone3.ts); realm zone
    z[900,1440] L15-20 Eldergleam (-40,1030), northern 180 yd is open ocean
    (`src/sim/content/realm.ts`); `frostveil` z[1440,1960] L17-20 Icemantle.
  - West x[-540,-180]: `proving_shore` z[-180,180] L1-2 island (Dawnrest Camp,
    `PROVING_SHORE_RECT`); `willowfen` z[180,700] L19-20 Bridgemere; `palmreach`
    z[700,1260] L20; `nightbloom` z[1260,1820] L20 Moonrest; `amberfall`
    z[1820,2380] L18-20.
  - East x[180,540]: `farshore_isle` z[-180,180] L3-7 Gullhaven; `galecrest`
    z[180,700] L20 Wickharbor; `evergarden` z[700,1260] L20; `wraithwood`
    z[1260,1820] L20 Gallowmere; `drakelands` z[1820,2420] L16-20.
- Free land: nothing at z < -180 in any column, the center column north of z 1960,
  or |x| > 540; the instance plane sits at x >= 99,400 so columns "can grow east
  without standing inside an instance band" (data.ts comment). A column zone
  "appends LAST for rng-stream stability" (data.ts). Inside town: the shipped
  Eastbrook is `src/sim/eastbrook_layout.ts:EASTBROOK_LAYOUT` (id
  `eastbrook_civic_layout_v2`, playerStart at the quay (-94,-58));
  `docs/design/eastbrook-revamp/site-plan.md` section 7 proposes dismantling the
  old town around the preserved Grand Armoury (17.5,-5.5) as a future "Wolf Run"
  slice. `docs/design/eastbrook-vale-rebuild/final-report.md` and
  `docs/design/fenbridge-rebuild/master-plan.md` are the town build records. No
  land is reserved for housing anywhere; `docs/design/reliquary.md` says "no
  housing system yet"; `docs/design/professions-system.html` sketches an off-wheel
  Carpenter/Mason housing craft lane marked "Not built now". `data/` holds only
  `data/battleground`; the world is code (`src/sim/content/*`, `src/sim/*_layout.ts`).
- Terrain: `src/sim/world.ts:terrainHeight(x,z,seed)` is procedural (biome
  landness fields) plus authored `HeightStamp` edits (`src/sim/types.ts:HeightStamp`
  {x,z,radius,delta,falloff,mode add|level}; `WorldContent.terrainEdits`, e.g.
  `TOWN_PLAT_TERRAIN_EDITS`, `HARBOR_SAND_TERRAIN_EDITS`) that flatten lots;
  `terrainHeightSansEdits`; `groundHeight` handles instance floors.
- Colliders: `src/sim/colliders.ts` static grid built lazily per (active
  `WorldContent`, seed) from props / placements / blockers (`gridFor`,
  `staticWorldColliders`, `collider_cells.ts` cell index, WeakMap cache);
  `invalidateStaticColliders()` is editor-only. The server runs `BUILTIN_WORLD` and
  never calls `setActiveWorldContent` (comment in `server/fishing_telemetry.ts`;
  `data.ts:isBuiltinWorldActive`). So overworld static geometry is build-time;
  runtime-added geometry exists only for instanced regions (`setRiftRegion`).

## 3. Props and buildings

- Placement is data-as-code: `data.ts:PROPS` (`ZonePropsDef`), the town layouts
  `EASTBROOK_LAYOUT` / `FENBRIDGE_LAYOUT` (buildings with id, position, rotation,
  dims; fences, benches, wall segments, stalls; `src/sim/custom_world_props.ts`
  filters builtin-only ids), `src/sim/building_layout.ts`,
  `src/sim/prop_layout.ts`. Editor placements: `WorldContent.placements:
  PlacedAsset[]` (`src/sim/types.ts:PlacedAsset` {path, x, z, rotY, scale,
  collideRadius}), rendered by `src/render/placed_assets.ts:PlacedAssetsView`
  (live add/update/remove/reSeat/setSelected/showFootprints instancer, TARGET_HEIGHT
  2.2 normalization, "never a Sim entity"); a circle collider is derived when
  `collideRadius` > 0. `BlockerDef` = invisible OBB walls.
- GLBs under `public/models/{props,city,medieval_village_v2,foliage,dungeon,
  creatures,chars,...}`, loaded once (`src/render/assets/loader.ts:loadGltf`),
  merged/instanced at build (`src/render/props.ts`: InstancedMesh per asset part x
  z-band; far cells merged per 120 yd `src/render/prop_cell_core.ts:
  PROP_FAR_CELL_SIZE`, swap at `PROP_FAR_SWAP_DISTANCE` 40). Far foliage = sprite
  impostors (`src/render/foliage_impostor.ts`, `docs/design/far-foliage-impostors.md`).
  Terrain streams in 60 yd chunks (`docs/design/chunk-streaming.md`, 792 chunks).
  New reference-image assets follow the `image-to-glb` skill.
- Budget rules: every new GPU producer is a scheduler client
  (`src/render/gpu_prep_admission.ts`, `gpu_prep_budget_core.ts`); point lights ride
  `src/render/point_light_budget.ts` (live global allocation in `gfx.ts`, not a universal three-light LOW guarantee); interiors
  light via `src/render/interior_light_rig.ts` (`FogSceneState`); `src/render/
  CLAUDE.md` "GPU work: every new producer is a client of the scheduler" and
  `render-performance-reviewer` on such diffs.
- Civic services: `WorldContent.services: WorldServicesDef` {stations, mailboxes,
  noticeboards, musterBoards, graveyards} (`src/sim/types.ts`). Mailboxes spawn in
  the Sim ctor as `kind:'object'` entities with `templateId 'mailbox'`
  (`src/sim/sim.ts` ~2253 via `src/sim/entity.ts:createGroundObject`, ids kept in
  `postOffice.mailboxIds`; `src/sim/content/mailboxes.ts:MailboxDef` {x,z,facing}),
  drawn by `src/render/mailbox.ts` and labeled by `src/render/entity_labels.ts`;
  noticeboards follow the same pattern; `StationDef` {id,type,zoneId,pos,
  masterNpcId} places crafting stations beside master NPCs;
  `src/sim/content/practice_dummies.ts` are mob-template dummies. Client
  presentation: `src/sim/civic_service_placements.ts:buildCivicServicePlacements`
  -> `src/net/civic_service_placements.ts:createCivicServicePlacementsReader`
  (content-generation cached) on the IWorld interaction facet
  (`src/world_api/interaction.ts:CivicServicePlacement`). Bank (personal and
  guild) is gated by proximity to a banker NPC (`src/sim/bank.ts:nearBanker`,
  used by `src/sim/guild_bank.ts`). That is the precedent for a service object
  inside a house: an object entity with a templateId plus a proximity gate.

## 4. Persisted world objects

- No player-placed persistent object exists. Object entities today
  (`grep templateId` in src/sim): loot drops (`ground_<itemId>`), dungeon_door /
  dungeon_exit, mailbox, rift_portal and the rift puzzle objects (pylons, runes,
  chests, descent, exit), delve chests / plates, bg_flag / bg_rune. The fishing
  bobber is render-only (`src/render/fishing_bobber.ts`); no totem entities.
- Persistence seams: `world_state` (`server/db.ts`: key TEXT PK, data JSONB,
  `loadWorldState` / `saveWorldState`, `upsertWorldStateRowIn`) holds realm-level
  docs (mail `mail:%`, market `market:<realm>`, rift events, admin online peaks,
  retention-sweep marker); characters JSONB in `characters`; editor maps in `maps`
  (`server/maps_db.ts:MAPS_SCHEMA`, doc JSONB) sanitized by `src/sim/map_doc.ts`.
  Schema is inline DDL re-applied at boot (no migration files).
- Wire: `server/game.ts:wireEntity` = `identityFields` {k, tid, nm, lv, sk, mnt,
  mh, oh, eq, ...} + `dynamicFields` {x, y, z, f, hp, mhp, dead, loot, h, ...}; a
  per-entity wire cache (`EntityWireCache`) diffs identity / dyn versions so a
  byte-stable idle entity elides after first send; entities enter at
  `INTEREST_RADIUS` 90 and drop at `INTEREST_DROP_RADIUS` with hysteresis. Client:
  `src/net/online.ts:applyWire` (~2740) inside `applySnapshot`. No hard per-viewer
  entity cap. N furniture entities per house would cost a first-appearance record
  (~100 B) per interest crossing, per-tick sim iteration, and spatial-grid
  membership; the rift model (descriptor over the wire, deterministic regeneration,
  runtime collider region) avoids all three. Snapshot keys are pinned by
  `tests/snapshots.test.ts` (`ALL_DELTA_KEYS`, `TERSE_TO_IWORLD`).

## 5. Editor

- `src/editor/` SPA (`editor.html`, `src/editor/CLAUDE.md`): `3d/viewport.ts`
  composes the real `Sim` + `Renderer` over a `WorldContent` registered via
  `setActiveWorldContent`; terrain sculpt (HeightStamp brush,
  `rebuildTerrain(region)`, macro-normal rebake), biome paint, placements
  (`PlacedAssetsView`), blockers, camps / npcs / objects / zones / roads. Select-mode
  drag / rotate / scale / nudge math is the pure
  `src/editor/placement_transform_core.ts` (`PLACEMENT_SCALE_MIN` 0.2 / `MAX` 5,
  `ROTATE_STEP_RAD` 15 deg, `NUDGE_STEP_YD` 0.5 / 2, `TRANSFORM_COMMIT_MS` 400);
  caps `src/sim/map_doc.ts:MAX_PLACEMENTS` 4000, `MAX_TERRAIN_EDITS` 4000; undo
  `undo_core.ts`; saves via `persist.ts` (local, shared sanitizer) and `net.ts` ->
  `server/maps_routes.ts` (RouteDefs) -> `server/maps.ts:MapsService` ->
  `server/maps_db.ts`; player-uploaded GLBs `user/<sha256>`
  (`src/editor/user_assets.ts`, `server/user_assets_routes.ts`,
  `server/user_assets_db.ts`). Playtest is offline only (`playtest.ts`).
- Reuse: `placement_transform_core.ts` and `PlacedAssetsView` are host-agnostic
  enough for an in-game furniture mode (pure core + live instancer); picking and
  camera live in `3d/viewport.ts` / `3d/editor_camera.ts` (free camera, DOM pointer
  events), not the HUD. The HUD-side input precedent is
  `src/ui/hud/action_bar/ground_aim.ts` + `ground_aim_controller.ts:GroundAimController` (raw point, live
  clamp, smart seed; mouse, controller, touch) per
  `docs/design/ground-targeting-input.md`, with `IWorld.groundAimPlacementPreview`
  as the facet member pattern.

## 6. Guild presence

- None in the world. Guilds are social-server state
  (`server/social.ts:createGuildWithLeader`; the `guild_create` WS command in
  `server/game.ts` ~7530 with a paid fee via `server/guild_create_db.ts:
  createPaidGuildWithLeaderAtomic`); guild bank ops at any banker
  (`src/sim/guild_bank.ts` uses `nearBanker`); guild events on the calendar
  (`src/ui/calendar_window.ts`, `server/social.ts:createGuildEvent`); `/g` chat;
  pledge ladder `src/sim/guild_pledge_ladder.ts`. "The Guildhall" is only a letter
  sender name (`src/sim/content/letters.ts`). Guilds have no gathering place.

## 7. Mobile and performance

- `src/render/gfx.ts:resolveDefaultGraphicsPreset`: EVERY touch device starts at
  `PRESET_LOW` because the synchronous world-entry scene build can cross the phone
  WebKit per-process memory ceiling and get the WebContent process killed
  (`src/game/entry_crash_guard.ts`). Tiers `GfxTier` low / medium / high / ultra /
  insane; low budget: 60 fps target, `minRenderScaleMobile` 0.55 (`GFX_BUDGETS`).
  HUD effects tier is resolved from the static preset only
  (`src/game/ui_effects_profile.ts:UiEffectsProfile`), never the FPS governor;
  settings must stay gameplay-neutral (`docs/design/graphics-settings-fairness.md`).
  No named minimum device; `docs/design/player-performance/baselines.md` captures
  were taken on an M4 Max, so the low tier plus the iOS process-kill guard is the
  effective floor in the historical survey. (Superseded 2026-09-06 by D45, retained as
  the dated trail: Interiors: KayKit kit, ~30 draws per instance, max 3 point lights at
  low.) Adopted: the proposed housing room has at most three authored emitters; iOS may
  allow two and pressure may leave one contributing light.
  Ambient grade and silhouettes must preserve actionable information in every case.

## Recommendation inputs

- Instanced private plot is far cheaper: a new `DungeonDef` (next free index >= 10 at
  capture; `src/sim/content/dungeons.ts` already uses 13 and 14 at this revision and the
  adopted indices are 15 and 16 per D15,
  `spawns: []`, `staticDoor`, `overworldDoor`, `interior` key) inherits the slot
  pool, solo / party keys, door trigger, flat floor, interior colliders, and the
  interior renderer; Dawnhold Castle is a working template.
- Open-world neighborhood needs a new zone rect (south of z -180, north of z 1960
  in the center column, or a 4th column), terrain stamps, colliders, props, all
  build-time; the server has NO runtime seam to add or mutate overworld static
  geometry or colliders.
- Render and persist furniture the rift way: a layout descriptor over the wire, a
  deterministic regeneration on both hosts (own Rng seeded from the descriptor),
  colliders via a `setRiftRegion`-style runtime region, state saved through
  `saveWorldState` or a new table; avoid one Sim entity per furniture piece.
- Superseded 2026-09-06 by D42, D43 and D44 (retained as the dated trail). Placement UX:
  compose `placement_transform_core.ts` + `PlacedAssetsView` + the ground-aim seam behind a
  new IWorld facet member implemented in both `Sim` and `ClientWorld`, with
  `tests/world_api_parity.test.ts` updated.
- Adopted placement UX: existing editor math is a precedent, not permission for the sim to import
  the editor or inherit its scale/nudge/cap constants. The housing core uses measured room
  bounds; Wave A has floor placement, explicit input ownership and bounded placement-only
  undo/redo. Later typed surfaces add planar/yaw freedom and fixed ceiling anchors. Scale,
  full-axis gimbal and collision leniency remain adopted exclusions; layout sharing is later.
- Risk 1: monolith ceilings (`tests/monolith_budget.test.ts`; `server/game.ts` has
  a zero-margin ceiling, `src/sim/sim.ts` sits near its own) force every piece
  behind the SimContext, RouteDef, and IWorld seams.
- Risk 2: determinism: house content must never draw the shared `Rng` or read wall
  clocks; a claimed slot that reloads from DB must reconstruct identically on
  server and client (parity golden traces).
- Superseded 2026-09-06 by D45 (retained as the dated trail). Risk 3: mobile LOW memory:
  an interior must reuse the dungeon kit, stay under 3 point lights, and go through the
  prewarm / compile-gate scheduler, or phones crash at entry.
- Adopted risk 3: mobile LOW memory and live light allocation need measured proof through the
  existing preparation scheduler. A three-emitter authoring ceiling alone cannot establish
  safe entry or adequate readability; test the iOS and effective-one-light cases.
- Risk 4: slot lifetime: instances are runtime-only and reaped after 300 s empty,
  so house state must rehydrate from persistence on every claim.
- Every new content record carries deeds, wiki regen, i18n keys, and item art
  obligations (`content-obligations-reviewer`).

The adopted packet separates 07a atomic operation/mutation composition, 07b account
lifecycle/history/binding, 07c account-tier arrival eligibility and 08a safe wire
projection. File 13 owns pure upkeep; 13a owns shared authoritative calendar history,
irrevocable historical finality, bounded projection and private per-generation
delivery/ACK. These are NEW unimplemented contracts, not capabilities of the
historical host survey above. Replay never recreates first-tier presentation;
commit-before-ACK may skip it. Old releases must not reinterpret lifecycle or
calendar data merely because they preserve the tables. See the
[service contract](../freehold-service-contract.md) for exact owner/acceptance seams.
