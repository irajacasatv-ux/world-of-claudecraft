# Freeholds and Guildhalls: progress

## Status
| Phase | Status | Started | Completed | Verdict / notes |
|---|---|---|---|---|
| 01 Foundation | Not started | | | |
| 01 QA | Not started | | | |
| 02 Furnishing item kind | Not started | | | |
| 02 QA | Not started | | | |
| 03 Content: tiers and basics | Not started | | | |
| 03 QA | Not started | | | |
| 04 Content: crafted and patterns | Not started | | | |
| 04 QA | Not started | | | |
| 05 Instance claim | Not started | | | |
| 05 QA | Not started | | | |
| 06 Interiors, gate, Hearth Key | Not started | | | |
| 06 QA | Not started | | | |
| 07 Persistence | Not started | | | |
| 07 QA | Not started | | | |
| 08 Layout and placement sim | Not started | | | |
| 08 QA | Not started | | | |
| 09 Render furnishings | Not started | | | |
| 09 QA | Not started | | | |
| 10 Furnishing colliders | Not started | | | |
| 10 QA | Not started | | | |
| 11 Build mode UI | Not started | | | |
| 11 QA | Not started | | | |
| 12 Strongbox and station | Not started | | | |
| 12 QA | Not started | | | |
| 13 Condition and ledger core | Not started | | | |
| 13 QA | Not started | | | |
| 14 Distribution surface map | Not started | | | |
| 14 QA | Not started | | | |
| 15 Claudium: Charter and Call | Not started | | | |
| 15 QA | Not started | | | |
| 16 Steward panel and store surfaces | Not started | | | |
| 16 QA | Not started | | | |
| 17 Trophies | Not started | | | |
| 17 QA | Not started | | | |
| 18 Visiting | Not started | | | |
| 18 QA | Not started | | | |
| 19 Art batch | Not started | | | |
| 19 QA | Not started | | | |
| 20 Wave A close (MVP PR) | Not started | | | |
| 20 QA | Not started | | | |
| 21 Lodge tier and upgrade | Not started | | | |
| 21 QA | Not started | | | |
| 22 Furnishings across all crafts | Not started | | | |
| 22 QA | Not started | | | |
| 23 Legend Stand and trophy families | Not started | | | |
| 23 QA | Not started | | | |
| 24 Kitchen Garden tableau | Not started | | | |
| 24 QA | Not started | | | |
| 25 Build mode v2 | Not started | | | |
| 25 QA | Not started | | | |
| 26 Open-house visiting | Not started | | | |
| 26 QA | Not started | | | |
| 27 Wave B close | Not started | | | |
| 27 QA | Not started | | | |
| 28 Guild owner kind and Hall Fund | Not started | | | |
| 28 QA | Not started | | | |
| 29 Guildhall purchase and upkeep | Not started | | | |
| 29 QA | Not started | | | |
| 30 Hall amenities | Not started | | | |
| 30 QA | Not started | | | |
| 31 Guild deeds and first-kill trophies | Not started | | | |
| 31 QA | Not started | | | |
| 32 Hall and Manor tiers | Not started | | | |
| 32 QA | Not started | | | |
| 33 Wave C close | Not started | | | |
| 33 QA | Not started | | | |
| 34 Wards | Not started | | | |
| 34 QA | Not started | | | |
| 35 Ward favor and Endeavors | Not started | | | |
| 35 QA | Not started | | | |
| 36 Showcases and guest books | Not started | | | |
| 36 QA | Not started | | | |
| 37 Charter service contract | Not started | | | |
| 37 QA | Not started | | | |
| 38 Charter mint and trading | Not started | | | |
| 38 QA | Not started | | | |
| 39 Wave D close | Not started | | | |
| 39 QA | Not started | | | |
| 40 Keep and Citadel tiers | Not started | | | |
| 40 QA | Not started | | | |
| 41 Dye station and layout sharing | Not started | | | |
| 41 QA | Not started | | | |
| 42 Second freehold SKU | Not started | | | |
| 42 QA | Not started | | | |
| 43 Carpenter and Mason | Not started | | | |
| 43 QA | Not started | | | |
| 44 Wave E close (final, teardown offer) | Not started | | | |
| 44 QA | Not started | | | |

## Per-phase deliverables and acceptance (the spec each phase file expands)

### Wave A: the Cottage MVP

#### 01 Foundation
Deliverables:
- `src/world_api/housing.ts`: `IWorldHousing` with the MVP member set (`myFreehold`,
  `freeholdLayout`, `housingNowMs()`, `freeholdEnter`, `freeholdLeave`, `placeFurnishing`,
  `moveFurnishing`, `removeFurnishing`, `undoPlacement`, `payLedger`, `freeholdTrophies`,
  `freeholdVisitors`, `setVisitPolicy`), types-only imports, barrel edits, `COMMAND_NAMES`
  and `COMMAND_FACETS` rows, stub implementations on `Sim` (thin delegates into the
  module) and `ClientWorld` (one-line `cmd` sends and null mirrors), parity pin updated.
- `src/sim/freehold/` skeleton behind `SimContext`: `types.ts`, `state.ts`, `index.ts`,
  `CLAUDE.md`; `ctx.freeholds` live map primitive plus its `sim_context.test.ts` pins;
  the `src/sim/CLAUDE.md` system-table row; the extraction that pays for the new
  `sim.ts` delegates and lowers the ceiling.
- `server/freehold_config.ts` `freeholdsEnabled(env)` (strict `'1'`, read live), the
  `freehold.disabled` error code through `npm run new:endpoint` (with its English
  `apiError.freehold.disabled` leaf and `API_ERROR_KEYS` row), `.env.example` row, and a
  dispatch-time refusal of every housing command while dark (the `refusedRiftForgeCommand`
  shape) in a new `server/freehold_wire.ts` with case labels only in `game.ts`.
- `headless/CLAUDE.md` housing cut paragraph beside the farming cut, and an `ACTIONS`
  exclusion `it` in `tests/env_protocol.test.ts`.
- The scaffolded `GET /api/freehold` status stub kept as a registry-only route answering
  `freehold.disabled` while dark; `src/net/freehold_snapshot_wire.ts` created with the
  null mirrors and an empty strict-decode allowlist (Phase 08 fills it).
Acceptance:
- [ ] `tests/world_api_parity.test.ts`, `tests/command_schema.test.ts`,
  `tests/command_facets.test.ts`, `tests/sim_context.test.ts`,
  `tests/monolith_budget.test.ts` (ceiling lowered), `tests/architecture.test.ts` green.
- [ ] Every housing command refuses at dispatch with `FREEHOLDS_ENABLED` unset, pinned.
- [ ] `tests/env_protocol.test.ts` pins that `ACTIONS` carries no housing verb.
- [ ] No behavior yet: `myFreehold` is null on both hosts; the S3 guard passes.

#### 02 Furnishing item kind
Deliverables:
- `FurnishingItemDef extends BaseItemDef { kind: 'furnishing'; furnishing: { footprint,
  r (required; 0 means walk-through), decorCost, surface: 'floor', plinth?: boolean } ;
  use?: never; feast?: never }` in
  `src/sim/types.ts`, `'furnishing'` on `ItemKind`, added to the `OtherItemDef` Exclude
  list, appended to the `ItemDef` union.
- The two compile-time records (`KIND_RANK`, `ITEM_KIND_LABEL_KEYS` with the English
  `itemUi.kind.furnishing` key), `UNSTACKED_KINDS` membership (one per slot), a
  `furnishing` market browse chip and bag chip decision, the icon fallback arm, and
  explicit refusal arms pinned in disenchant, salvage, sunder, perfect, equip, and the
  Exchange eligibility (furnishings are Exchange-eligible per the mount rule, D25,
  pinned here once and never reopened), plus bank, guild bank, trade, mail, and market
  storability (tradable, storable). Placement is the `place_furnishing` command (Phase
  08); a furnishing has no `use` arm.
- A `src/ui/hud/housing/furnishing_tooltip_view.ts` pure core (footprint, decor cost,
  surface, provenance line) on the `recipe_pattern_tooltip_view.ts` precedent, wired
  through the tooltip composer without growing `hud.ts`.
- Test fixture item only (no shipped ids yet): `tests/furnishing_item_kind.test.ts`
  sweeps every consumer group with a synthetic def.
Acceptance:
- [ ] `tsc` clean with the new kind in both exhaustive records.
- [ ] `tests/market_filters.test.ts`, `tests/item_name_color.test.ts`,
  `tests/furnishing_item_kind.test.ts` green; every refusal arm has a negative case.
- [ ] No shipped item carries the new kind yet (no art obligation triggered).

#### 03 Content: tiers, Charter SKU, ledger schedule, vendor basics
Deliverables:
- `src/sim/content/freehold/tiers.ts` (`FREEHOLD_TIERS`: `inn_room` and `cottage` with
  rooms, decor budget, plinths, amenity slots, upkeep flag; deep-frozen; ids are frozen
  save keys), `charters.ts` (`FREEHOLD_CHARTERS`: `freehold_charter_cottage`, tier only,
  no price, no copy; `isKnownFreeholdCharterId`), `ledger_schedule.ts` (the seeded weekly
  material order per line: ore, wood, herb, hide, cloth, fish, produce at tiers 1 and 2
  with `fine_` twins; stack counts flagged TUNING), merged by `data.ts` where applicable.
- `furnishings.ts`: about eight vendor-basic furnishings (a bed, a table, two chairs, a
  rug, a lantern, a chest prop, a bookshelf) with footprint, `r`, decor cost, and a
  stand-in model key, sold for gold by a new Eastbrook furnisher vendor row.
- Every content obligation: WebP icons plus `mapping.json` provenance for every new item
  id, the "Homesteader" deed family opener (first furnishing placed, first Cottage),
  Reliquary Hearth shelf pages for furnishing items, `npm run wiki:content` plus
  `guide.*` keys, `world_entity_i18n.ts` rows for the vendor, non-Latin name fills where
  wordy (M16).
- `tests/freehold_content.test.ts`: literal pins for tiers, charters, schedule ids, the
  keystone exclusion sweep, the power-neutral sweep (no stat, buff, or drop field on any
  furnishing), the deep-frozen and no-price negative pins.
Acceptance:
- [ ] `tests/item_icons.test.ts`, `tests/item_art_consistency.test.ts`,
  `tests/deeds_content.test.ts`, `tests/reliquary_content.test.ts`, `tests/guide.test.ts`,
  `tests/provisioner_firewall.test.ts` (with a new ledger-schedule arm) green.
- [ ] `content-obligations-reviewer` reports no BLOCKING.
- [ ] No furnishing names a Perfecting keystone, gear intermediate, or catalyst.

#### 04 Content: crafted furnishings and quartermaster patterns
Deliverables:
- Ten crafted furnishings, one per craft on the proposal's mapping (weaponcrafting rack,
  armorcrafting stand or brazier, tailoring rug or banner, leatherworking chair,
  engineering lamp or clock, alchemy glass lamp, inscription painting or map,
  jewelcrafting chandelier, cooking feast table prop, enchanting glow light), each a
  `furnishing_recipes.ts` recipe on an existing craft with tier 1 to 3 materials and
  produce where the craft is a consumable line; recipes learnable from the existing
  trainers except the three below.
- Three patterns (`furnishing_patterns.ts`, `RecipeItemDef` rows `pattern_<output>`) on
  the Heroic Quartermaster's deterministic row (D13: no luck-gated faucet in the MVP).
- Art (WebP icons plus provenance) for the ten items and three patterns; deeds and
  Reliquary rows where the contract requires; wiki regen; name fills.
- Channel and economy contracts: `tests/apex_pattern_channels.test.ts` referential
  sweep, `tests/recipe_pattern_items.test.ts` shipped-content sweeps,
  `tests/recipe_economy.test.ts`, the provisioner firewall arm covering furnishing
  recipes (produce allowed, keystones never).
Acceptance:
- [ ] Every new recipe resolves through `resolvePatternLearn` or a trainer row; every
  pattern is Marks-purchasable; no pattern takes a Reliquary page.
- [ ] Content suites green; `content-obligations-reviewer` no BLOCKING.

#### 05 Instance claim
Deliverables:
- `src/sim/content/freehold/dungeons.ts`: `freehold_inn_room` (index 15) and
  `freehold_cottage` (index 16) `DungeonDef` records with empty spawns, placeholder
  interiors (Phase 06 supplies the layouts), `guideVisible: false`, absent from the
  Dungeon Finder; `DungeonDef.claimKey?: 'party' | 'owner'` appended.
- `meta.freeholdOwnerKey` stamped at `addPlayer` from a host option (`account:<id>`
  online via `joinMeta`, `entity:<pid>` offline), `META_EXCLUDE` row; `freeholdKeyFor`
  and owner-keyed `enterDungeon` behaviour in `src/sim/freehold/instance.ts` (claim,
  rehydrate from the live record, descriptor); guests enter under the owner's key.
- Commands `freehold_enter` (from the gate door or the Hearth Key; tier picks the def)
  and `freehold_leave` wired through the facet, `server/freehold_wire.ts`,
  `JAILED_BLOCKED_COMMANDS` (the `HEAVY_SELF_CMDS` rows land in Phase 08 with the `fhold`
  key); text-free `freeholdDenied` reasons declared in append-only order
  (`no_freehold`, `locked`, `cooldown`, `visitors_full`, `not_friend`, `dead`, `combat`),
  each reason's emitting phase named where it is not this one.
- Tests: slim-world instance suite (claim by owner key across two characters of one
  owner, party membership ignored, reap after `INSTANCE_EMPTY_TIMEOUT`, relog rebinds),
  a determinism case, a parity scenario `freehold_claim`.
Acceptance:
- [ ] `tests/dungeons.test.ts` unchanged and green; the new suite green; goldens
  regenerated in their own commit.
- [ ] `architecture-reviewer` and `cross-platform-sync` no BLOCKING.

#### 06 Interiors, the Eastbrook gate, the Hearth Key
Deliverables:
- `INN_ROOM_LAYOUT` and `COTTAGE_LAYOUT` (`DungeonLayout` with `rooms`, `doors`, static
  `decor` with measured radii, plinth anchors as named decor keys, the hearth anchor),
  lift functions, the `interior` union members, `STATIC_INTERIOR_COLLIDERS` entries,
  `groundHeight` arms; render variants (`dawnhold` grammar) and a dressing module under
  `src/render/freehold/`, built on proximity through the existing gated loop.
- The Eastbrook Freehold Gate: a `dungeon_door`-style interactable on the quay that
  calls `freehold_enter` for the owner (tier-routed) with the section 8 "manage on the
  website" line reserved for later phases; leaving returns to the gate used.
- The Hearth Key: a `tool` item granted with every freehold record (holding it is the
  credential; using it consumes nothing), cooldown literal pinned, refused in combat and
  while dead, a payload-aware jailed check for `use_item` carrying the key beside
  `freehold_enter` in `JAILED_BLOCKED_COMMANDS`; entity and item names in i18n.
- Tests: layout derivation (walls, doors, colliders deterministic), the gate and key
  gates, `tests/renderer_compile_gate.test.ts` for the new interiors.
Acceptance:
- [ ] Walking into the gate enters the Inn Room offline and online; the Hearth Key works
  from any zone and drops you at the gate on leave.
- [ ] `render-performance-reviewer` no BLOCKING (interiors ride `attachSceneGroupGated`).

#### 07 Persistence
Deliverables:
- `server/freehold_db.ts`: `FREEHOLD_SCHEMA` (`account_freeholds`: `account_id INT PK
  REFERENCES accounts(id) ON DELETE CASCADE`, `tier TEXT`, `layout JSONB CHECK object`,
  `trophies JSONB`, `condition INT`, `condition_stamp_day INT`, `ledger_paid_week INT`,
  `prepaid_weeks INT`, `last_seen_day INT` (written at join and leave, the away-pause
  source), `hearth_key_ready_ms BIGINT`, `visit_policy TEXT`, `rev BIGINT`,
  `updated_at`; keep-forever comment; index on `ledger_paid_week`), applied by
  `ensureSchema` after
  `SCHEMA`; `freeholdForAccount`, `upsertFreehold` (rev compare-and-swap), a pg-armed
  twin suite; `exportAccountData` row.
- Load at fresh join beside `bankBonusFactsForAccount` into `joinMeta`;
  `loadFreehold(ctx, ownerKey, raw)` / `serializeFreehold(ctx, ownerKey)` /
  `evictFreehold` in `src/sim/freehold/state.ts` with `normalizeFreehold` (allowlists on
  tier, furnishing ids, plinth ids, cell bounds; condition clamp; the day and week
  stamps clamped to today and this week, `hearth_key_ready_ms` in the host clock base;
  never destroys).
- Save path: a per-owner serial writer on the server (autosave cadence, leave, shutdown),
  the rev refusal surfaced as a dev-channel warning, eviction when the last character of
  the account leaves. Offline hosts persist nothing (a fresh offline Sim starts with the
  default Inn Room record; pinned), per D16.
- `/dev freehold <tier>` under `ALLOW_DEV_COMMANDS=1` (D24): a tier setter in
  `state.ts` used by the dev command on both the offline and the server dev path,
  refused without the flag (pinned); Phase 15's grant reuses the setter.
- Tests: round trip, one-corrupt-dimension-per-arm, pre-feature account loads the Inn
  Room default, the cross-clock pin, rev conflict refused, delete cascade.
Acceptance:
- [ ] `migration-safety`, `database-performance-reviewer`, `privacy-security-review` no
  BLOCKING; `tests/server/main_retention_wiring.test.ts` unchanged (keep-forever stated).
- [ ] A house survives server restart and relog online; a fresh offline or headless Sim starts with the default Inn Room record (pinned).

#### 08 Layout core and placement commands
Deliverables:
- `src/sim/freehold/layout_core.ts` (pure leaf, no `sim_context`): room-local cell grid
  from `AuthoredRoom` bounds (pitch literal pinned), `snapToCell`, `yawStep` (15 degrees,
  wrapped), `clampToRoom`, footprint overlap by `r`, decor budget accounting, plinth slot
  rules, `validatePlacement` returning text-free reason ids; `undo` as a bounded stack of
  inverse operations per owner session.
- `placement.ts` commands `place_furnishing` (consume exactly one copy from the named
  slot, `item_copy_ref` tri-state), `move_furnishing`, `remove_furnishing` (return the
  copy to bags or refuse `bags_full` without removing), `undo_placement`; owner-only
  gate (a visitor refuses `not_owner`); `not_owner`, `bags_full`, and `item_locked` (the
  lock-aware item-copy twin) are appended to the `freeholdDenied` enum here; placement
  never locks on condition (D22); `locked` stays the Phase 05 amenity lockout id.
- The `freeholdState` descriptor event (pid-scoped: owner key, tier, origin, layout rows
  `{ id, furnishingId, cell, yaw }`, condition summary), emitted on enter, on every
  accepted change, and re-sent on resume, plus the `freeholdGranted { kind }` variant
  declared beside it (Phase 12 emits kind `station`, Phase 13 kind `ledger`); `server/freehold_wire.ts` emitter; strict
  decode `src/net/freehold_snapshot_wire.ts` into `ClientWorld.freeholdLayout`;
  `ALL_DELTA_KEYS` row for `fhold`; `tests/freehold_command_chain_online.test.ts`.
- Tests: every validation arm with a negative case, no refusal path mutates, same seed
  same layout on both hosts, `tests/freehold_determinism.test.ts`.
Acceptance:
- [ ] Place, move, remove, undo work offline and online with the descriptor mirrored.
- [ ] `architecture-reviewer`, `cross-platform-sync`, `server-hot-path-reviewer` no
  BLOCKING; `tests/snapshots.test.ts` and `tests/bandwidth.test.ts` green.

#### 09 Render: furnishing view, light rig, ghost
Deliverables:
- `src/render/freehold/furnishings.ts` (`FurnishingVisuals` modelled on
  `FarmPatchVisuals`: per-viewer `sync()` from `IWorldHousing.freeholdLayout` keyed by a
  content signature, `attachSceneGroupGated`, program anchors, clones of a loader-cached
  template per furnishing model key, seated on the interior floor constant plus the
  authored lift, torn down on leave) and `furnishing_layout_core.ts` in
  `RENDER_PURE_CORES` (signature diff, seat math, yaw).
- A stand-in kit (a small procedural set keyed by furnishing family) so every furnishing
  renders before Phase 19's art, with the model key resolved through one registry the art
  phase later fills.
- The interior light rig (hearth plus at most two more point lights at LOW) through
  `point_light_budget.ts`; the placement ghost visual (`furnishing_ghost_visual.ts`,
  rotation-aware footprint, valid and blocked states) driven by a renderer setter.
- Tests: `tests/furnishing_layout_core.test.ts`, the `RENDER_PURE_CORES` registration,
  `tests/renderer_compile_gate.test.ts` arm, an offline tour with zero `live-program`
  events.
Acceptance:
- [ ] `render-performance-reviewer` and `frontend-seam-reviewer` no BLOCKING.
- [ ] `npm run perf:tour` through the Cottage shows no compile hitch.

#### 10 Furnishing colliders
Deliverables:
- Generalise the runtime collider region registry beyond the rift band (a sibling
  lookup keyed by instance origin, or a parameterised `setRiftRegion` family renamed to
  `setRuntimeRegion` with the rift as its first client and no behaviour change), pinned
  by the existing rift collider suites staying green.
- `instance.ts` publishes `authoredColliders(rooms, doors, ownerDecor,
  DUNGEON_WALL_HW)` for the owner's placed furnishings on every claim and every accepted
  layout change under one collision token per claim (D17), and clears on free; the client publishes the same set from the
  descriptor through `applyFreeholdStateEvent` (both hosts collide identically).
- Tests: a placed table blocks movement on both hosts; removal clears; the rift suites
  unchanged; determinism of the collider set from the descriptor.
Acceptance:
- [ ] `architecture-reviewer`, `cross-platform-sync` no BLOCKING; rift collider tests
  green.

#### 11 Build mode UI
Deliverables:
- `src/ui/hud/housing/` (barrel, `CLAUDE.md`): `build_mode_controller.ts` (a
  `GroundAimController`-shaped controller parameterised for placement: subject =
  furnishing, `projectPlacement` = `layout_core.snapToCell`, `castAt` = `placeFurnishing`),
  `build_mode_view.ts` pure core (mode state, selection, yaw, undo availability),
  `build_mode_painter.ts` (the strip: rotate left, rotate right, confirm, remove, undo,
  cancel via the `ActionBarPainter` family), `furnishing_palette_view.ts` +
  `furnishing_palette_window.ts` (bags family filtered to `kind === 'furnishing'`, docked
  companion, not a "window" for the mobile aim-release rule).
- Input: `toggleBuildMode`, `rotateFurnishingLeft`, `rotateFurnishingRight` in
  `BIND_ACTIONS` with `Input.dispatchEdge` cases and `main.ts` wiring; pad hooks through
  the existing `GamepadCallbacks` placement members (bumpers yaw, d-pad nudge); touch
  through `MobileControls` pointer ownership (drag moves the ghost, tap confirms) plus the
  40x40 confirm/rotate/cancel strip with safe-area insets.
- i18n: `hudChrome.housing.build.*` English keys; `hud_update_drive` rows for any polled
  painter; mobile sheet decisions; `scripts/pr_shot_targets.mjs` entries.
- Tests: view core, controller, keybind defaults, `tests/mobile_window_coverage.test.ts`,
  `tests/hud_update_drive.test.ts`; screenshots (desktop, compact, tablet).
Acceptance:
- [ ] A furnishing can be placed, rotated, nudged, removed, and undone with mouse, pad,
  and touch; the ghost shows blocked cells; nothing is predicted client-side.
- [ ] `frontend-seam-reviewer` no BLOCKING; screenshots committed.

#### 12 Strongbox and station amenities
Deliverables:
- `amenities.ts`: the Strongbox interactable (a `kind: 'object'` entity spawned on claim
  at the layout's strongbox anchor, visible to every viewer in the claim) satisfying
  `nearBanker` for the owner only (a `freeholdStrongboxSatisfies` arm beside the banker scan, pinned so a visitor is
  refused); the station amenity slot (`build_station` command choosing one of the six
  `StationType`s, a `StationDef`-shaped anchor composed into the crafting gate's station
  list and `inRangeStationTypes` for the owner; `resolveTrain` untouched; the choice
  persists as a `station` field inside the layout JSONB with a normalize allowlist arm in
  `state.ts`, so `migration-safety` reviews this phase); the D18 vault craft gate arm;
  `freeholdGranted { kind: 'station' }` on build.
- The amenity lock rule: below condition 30 both refuse with `locked` (the Steward
  explains in Phase 16).
- Facet: `buildStation`, `myAmenities`; wire and decode; content: the station props on
  the Cottage decor anchors.
- Tests: bank ops at the Strongbox for the owner, refused for a visitor and below 30;
  crafting at the home station with bags-then-vault; training refused at home;
  `tests/professions_crafting_hub.test.ts` unchanged.
Acceptance:
- [ ] `architecture-reviewer`, `cross-platform-sync` no BLOCKING.

#### 13 Condition and the Steward's Ledger core
Deliverables:
- `condition_core.ts` (pure): `conditionAt(conditionStampDay, lastSeenDay, resetDay)`, the 7-day away pause, the
  3 repair-free days on return, lockout at 30, never below 0, never destroys.
- `ledger_core.ts` (pure): `ledgerWeekOf(resetDay)` on the realm weekly reset, the seeded
  weekly line order from `ledger_schedule.ts` (deterministic hash, no `Rng`), `planLedger`
  legs via `planReagentSourceDraw` per line with explicit `gradeIds` for produce, base
  before `fine_`, `null` on shortfall; prepay accounting (4 weeks in wave A); "repairing
  from 93 costs the same as from 60".
- `ledger.ts` `pay_ledger` command (bags then vault, one batch, lock-aware then raw
  `item_locked` twin, Phase 08's id), `freeholdGranted { kind: 'ledger', weeks }` and
  the `short` `freeholdDenied` reason (the only one this phase appends; `not_owner` and
  `item_locked` are Phase 08's, `locked` is the Phase 05 amenity id the ledger never
  emits); the stamps
  are `conditionStampDay`, `ledgerPaidWeek`, `lastSeenDay` (the Phase 07 columns); the
  calendar feed supplies `resetDay` on every host (settle the offline and headless feed
  in STEP 1); ledger state on the record and in the `fhold` key.
- Tests: `tests/freehold_condition.test.ts`, `tests/freehold_ledger.test.ts` (rollover
  across `resetDay`, pause and grace, the keystone exclusion sweep of every possible
  schedule week, one planner per file), determinism.
Acceptance:
- [ ] `architecture-reviewer`, `cross-platform-sync` no BLOCKING;
  `tests/provisioner_firewall.test.ts` green with the ledger arm.

#### 14 Distribution surface map
Deliverables:
- `src/game/distribution_surfaces.ts` (pure): `resolveDistributionSurfaces({ nativeApp,
  desktopApp, mobileCapabilities, desktopProbes })` returning `{ wallet, exchange,
  claudiumStore, freeholdPurchase, freeholdManageOnWebsiteLine, deedSurfaces }`, folding
  the three existing answers (`resolveWalletCapability`, `wocMarketAttachAllowed`, the
  `!NATIVE_APP` Claudium attach) into one module the existing gates call (no behaviour
  change for them, pinned by their suites).
- `HudFeatures.freeholdPurchaseEnabled` and `freeholdManageOnWebsite` rows injected from
  `main.ts`; a seven-row matrix test (web, website desktop, Steam, Epic, App Store,
  Google Play, Seeker dApp Store) through the real Electron config stamps; source pins
  that no wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string ships in a housing path reachable
  by a native or Steam or Epic build; the "earn" scan over `hudChrome.housing.*` and the
  token-string pins live in a new `tests/freehold_store_gates.test.ts` (there is no
  `copy:scan` script; the pre-push copy scan covers dashes and emojis only).
- Resolve O4 (the Seeker row) from the real code and record the verdict in `state.md`.
Acceptance:
- [ ] `tests/distribution_surfaces.test.ts`, `tests/freehold_store_gates.test.ts`,
  `tests/wallet_connection_view.test.ts`,
  `tests/woc_market_wiring.test.ts`, `tests/client_shell.test.ts` green.
- [ ] `frontend-seam-reviewer`, `privacy-security-review` no BLOCKING.

#### 15 Claudium: the Freehold Charter and the Master Builder's Call
Deliverables:
- Spend kind `freehold` in `parseSpendKind`, both `claudium_proxy.ts` unions, and the
  store filter with `isKnownFreeholdCharterId`; the `kind === 'freehold'` branch in
  `handleClaudiumApi` with a `freeholdGrant` runtime hook: for the Charter, a
  once-per-account service grant mirrored into `account_freeholds` (tier `cottage`) by
  `src/sim/freehold/grant.ts` `freeholdGrantCharter(ctx, ownerKey, charterId,
  purchaseKey, { dryRun })` and healed by the store-open reconcile; for the Master
  Builder's Call (`freehold_master_builders_call`, repeatable), a repair-to-full grant
  applied through the sim after a definitive spend with the purchase key stored in the
  record for exactly-once.
- Flag gating (`freeholdsEnabled` refuses the branch and drops the SKUs from the store
  filter), a `freehold` source in `economy_telemetry.ts`, a
  `docs/prd/woc/freehold-service-contract.md` (a durable PRD-side artifact, never torn
  down with the packet) stating the two SKUs, the kind, the fingerprint rule, and the settlement policy line for
  the economy service (O1), a fake-service test harness.
- Tests: `tests/server/freehold_gates.test.ts` (both dispatch arms identical, unknown
  SKU refused, price drift refused, replay grants once, flag dark refuses), the sim grant
  suite through `sim.ctx`.
Acceptance:
- [ ] `privacy-security-review`, `migration-safety`, `database-performance-reviewer` no
  BLOCKING; `tests/server/claudium.test.ts` and `tests/server/storage_gates.test.ts`
  unchanged and green.

#### 16 Steward panel and store surfaces
Deliverables:
- `steward_panel_view.ts` (pure, `PlantSheetWindow` family: hearth-flame condition
  meter, next ledger due via `housingNowMs()`, have/need rows across bags and vault,
  affordability, prepay weeks, the lockout explanation) and `steward_panel_window.ts`
  (buttons: pay from bags, pay from vault, prepay, Master Builder's Call; send-once per
  activation; re-arm on `freeholdDenied`, close on `freeholdGranted`), opened by
  proximity to the hearth anchor read from the layout data (no entity, the
  `farm_bed_interact` idiom); `hudChrome.housing.steward.*` keys; numbers through
  `formatNumber` and `formatDateTime`.
- Store surfaces per Phase 14: the Freehold Charter row in the WOC Store window (web and
  website desktop only; `charter_card_view.ts` family), the Master Builder's Call button
  present only where `freeholdPurchaseEnabled`, the neutral "manage on the website" line
  where `freeholdManageOnWebsite`, no purchase surface elsewhere; mobile sheet rules;
  screenshots.
- Tests: view core, window send-once, the surface matrix through the HUD features, the
  a11y rows; `tests/woc_store_window_contract.test.ts` extended.
Acceptance:
- [ ] `frontend-seam-reviewer` no BLOCKING; every store build shows exactly what section
  8 allows, pinned.

#### 17 Trophies
Deliverables:
- `src/sim/content/freehold/trophies.ts` (`TROPHY_DEFS`: trophy id, source kind and id,
  prop model key, finish; the twelve ready families reduced to the MVP set: boss busts,
  `slain:*` mounted heads, mount paddock markers, armor-set stands, curator plaques,
  farming and legendmaker plaques where already earned), `trophy_eligibility.ts` (pure
  mapping from `deedsEarned`, `illuminatedPages`, marks, owned mounts, the `perfected`
  stamp), `trophies.ts` `syncTrophyUnlocks(ctx, meta)` after the join retro block and on
  first entry, `retro: true` events, plinth placement through the layout core (plinth
  slots cost no budget; the Inn Room's three plinths).
- Provenance tooltip (deed name and day, page, mark, maker) as a
  `trophy_tooltip_view.ts` core; a Trophies tab in the palette; stand-in props.
- Tests: eligibility table pins, retro grant idempotent and draws no rng, a visitor sees
  the owner's trophies, `tests/deeds_content.test.ts` re-pinned for the Homesteader rows.
Acceptance:
- [ ] `architecture-reviewer`, `content-obligations-reviewer`, `frontend-seam-reviewer`
  no BLOCKING; trophies are never items and never tradable, pinned.

#### 18 Visiting
Deliverables:
- `visiting.ts`: the `friends` policy (default) and `private`; `setVisitPolicy` command;
  `freehold_enter` for a visitor resolves the owner by name through the gate (friend
  check server-stamped through the social service, offline no-op), cap 8 from the live
  `enteredBy` roster, visitors are read-only (every placement, pay, and amenity command
  refuses `not_owner`), the who-is-home line in `freeholdVisitors`.
- Server: the friend predicate stamped at dispatch (never trusted from the client),
  `HEAVY_SELF_EVENTS` for visitor arrivals, no persisted visitor log (D8).
- UI: visit prompt on the gate (enter own plot or a friend's by name), the visitor cap
  refusal toast, `hudChrome.housing.visit.*` keys.
- Tests: policy arms, cap, read-only enforcement per command, offline no-op pin, the
  online two-session test.
Acceptance:
- [ ] `privacy-security-review`, `cross-platform-sync`, `server-hot-path-reviewer` no
  BLOCKING.

#### 19 Art batch
Deliverables (batch-heavy: run with `ultracode`):
- GLB models through the `image-to-glb` skill for every wave A furnishing (about
  eighteen), the MVP trophy props, and the Cottage and Inn Room dressing; registered in
  the furnishing model registry, replacing stand-ins; fingerprint pins; prewarm homes.
- `npm run asset:budget`, `npm run perf:tour`, and the LOW-preset phone check inside the
  Cottage (mobile screenshot rig), with the numbers recorded in `progress.md`.
Acceptance:
- [ ] `render-performance-reviewer` no BLOCKING; asset budget and fingerprint suites
  green; no stand-in remains for a shipped id.

#### 20 Wave A close
Deliverables:
- The whole-feature matrix (`qa-checklist.md`) over the wave A diff with results in
  `progress.md`; the guide and wiki pass; before/after screenshots (desktop and mobile)
  through `pr-screenshots`; `docs/prd/woc/freehold-service-contract.md` handed to the
  economy service (O1); the counsel checklist (O2) attached to the PR body as OPEN.
- The MVP PR off the base branch following `.github/PULL_REQUEST_TEMPLATE.md` with
  `FREEHOLDS_ENABLED` defaulting off, opened only after Fernando's push go; CI watched
  to green. No merge.
Acceptance:
- [ ] Matrix all green; `qa-checklist` PASS; PR open and CI green; `state.md` records
  the wave B branching choice.

### Wave B: the Lodge tier and the rest of the first wave

#### 21 Lodge tier and the upgrade build project
Deliverables: the `lodge` tier record (2 rooms, budget 120, 8 plinths, 2 amenity slots,
`LODGE_LAYOUT` and interior); `upgrade_projects.ts` (a Claudium fee SKU
`freehold_upgrade_lodge` plus a materials bill of tier 3 and 4 fine materials and tier 4
produce, contributed over time through a `contribute_upgrade` command with a progress
record, completing on the last contribution; layout carry-over keeps every placed
furnishing that still fits and returns the rest to bags); the second amenity slot.
Acceptance: keystone exclusion sweep over the bill; upgrade exactly-once; the Cottage
layout survives; reviewers no BLOCKING.

#### 22 Furnishings across all ten crafts and the R8 pattern channels
Deliverables (batch-heavy, `ultracode`): about twenty more furnishings (two per craft
plus Farming produce props and garden markers), rare patterns on the three R8 channels
(raid tail groups, rift clear draws, the Heroic Quartermaster) with the D13 valve, art
and every content obligation, the market chip proven at volume.
Acceptance: channel and economy suites green; `content-obligations-reviewer` no BLOCKING.

#### 23 Legend Stand and the remaining trophy families
Deliverables: the Legend Stand (a named Perfected legendary with the player's name and
the Maker's Bond `craftedBy` on the plaque; the item stays in the owner's possession and
the stand reads the instance), the Harvestmaster golden sheaf, the four regional
first-harvest markers, the grandmaster workshop banners, finishes (bronze, silver,
gilded) by normal, heroic, and rift S-rank, the remaining ready families, the in-world
cosmetic wear below condition 30 (cold hearth light, dull trophy finishes, D22); art.
Acceptance: eligibility pins for every family; no trophy is an item; reviewers no
BLOCKING.

#### 24 Kitchen Garden tableau
Deliverables: `garden_view.ts` (projection over the owner's real `myFarmPlots` through
`farmGrowthStage` and `status`; zero beds, pinned against `FARM_PATCHES` and the calendar
model), the Harvest Journal board prop, the farmer NPC as the Steward's flavor (no
vendor, no service), the render tableau in the Cottage garden anchor.
Acceptance: `tests/professions_farming.test.ts` and `tests/professions_zone_rollout.test.ts`
unchanged; reviewers no BLOCKING.

#### 25 Build mode v2
Deliverables: wall and table-top surface snapping (`surface: 'wall' | 'table'` on
furnishing defs, the layout core's surface rules, parenting), redo, the capacity meter,
advanced mode (free rotation), twelve-week prepay, the Fenbridge Freehold Gate.
Acceptance: every new validation arm negative-tested; both hosts regenerate identically;
reviewers no BLOCKING.

#### 26 Open-house visiting
Deliverables: the `guild` and `public` policies, caps by tier (8 to 24), the door knock
and "who is home" line, the visit prompt listing open houses of friends and guildmates,
rate limits on public entry.
Acceptance: `privacy-security-review` and `server-hot-path-reviewer` no BLOCKING.

#### 27 Wave B close
Deliverables: the matrix, screenshots, the wave B PR (or stacked branch per `state.md`).

### Wave C: Guildhalls

#### 28 The guild owner kind, the Meeting Hall, the Hall Fund
Deliverables: owner kind `guild` on the same record type (`guildhall:guild:<id>` key,
`claimKey: 'owner'` resolving the guild id from the session-only `guildMembership`
stamp), the `meeting_hall` tier and layout, rank permissions (leader and officer edit,
members view, the `GUILD_BANK_EDIT_RANKS` family), the Hall Fund escrow (materials plus
a Claudium balance, a member-readable ledger) persisted beside `guild_banks` with the
escrow-delta merge idiom.
Acceptance: `migration-safety`, `privacy-security-review`, `architecture-reviewer` no
BLOCKING.

#### 29 Guildhall purchase and upkeep
Deliverables: pooled Claudium purchase (roughly 3x, service-priced) from the Hall Fund
with officer approval, 2x decay, ledger paid from the Hall Fund, member donations
(materials, gold, Claudium) with a weekly per-member cap and a contribution log with
retention.
Acceptance: exactly-once purchase; retention registered; reviewers no BLOCKING.

#### 30 Hall amenities
Deliverables: the guild bank chest (guild bank access at the hall), the feast hall long
table (the shipped feast object; Well Fed is the only buff), hall-shared stations (a new
predicate over members present in the hall, never the private party predicate), the
muster board, the calendar board, the pledge-board mirror, the war table (read-only
mirrors of existing guild data).
Acceptance: `architecture-reviewer`, `frontend-seam-reviewer` no BLOCKING.

#### 31 Guild-level deeds and first-kill trophies
Deliverables: a guild-level deed record (new `guild_deeds` table and sim state; today
every deed is per character), first-kill banners and raid statues from the guild's
first clears, the hall trophy plinths.
Acceptance: `migration-safety`, `content-obligations-reviewer` no BLOCKING.

#### 32 Great Hall, Manor, Bastion tiers and build projects
Deliverables: `great_hall` (guild uncommon), `manor` (freehold rare) and `bastion`
(guild rare) tiers with layouts, multi-week build projects with a shared progress bar,
project trophies, guild-only vendors that visit when a project completes, the Materials
Vault chest at Manor.
Acceptance: content and reviewer gates.

#### 33 Wave C close
Deliverables: the matrix, screenshots, the wave C PR.

### Wave D: Wards and Charters

#### 34 Wards: shared neighborhoods and exteriors
Deliverables: a ward instance kind (24 to 50 freehold exteriors around a square with a
Guildhall anchor plot), exterior shells per tier, ward assignment and reassignment
rules, the ward as the enter point for member plots.
Acceptance: `server-hot-path-reviewer`, `render-performance-reviewer` no BLOCKING.

#### 35 Ward favor and Endeavors
Deliverables: the ward favor bar (raises every member's decor budget on a published
cadence), monthly ward Endeavors (shared goals with cosmetic rewards only).
Acceptance: never-sell-power sweep; reviewers no BLOCKING.

#### 36 Showcases and guest books
Deliverables: the seasonal Showcase vote with a trophy-decor reward, the guest book with
reactions ONLY (no free text, so no moderation surface; bounded per plot, retention
registered).
Acceptance: `privacy-security-review`, `database-performance-reviewer` no BLOCKING.

#### 37 On-chain Freehold Charter: service contract, ledger table, geo-exclusion
Deliverables: the economy-service mint and verify contract (Metaplex Core asset with
Permanent Freeze and Permanent Burn delegates, collection royalties to the treasury),
the `freehold_deeds` table (claim once, re-verify at use), the geo-exclusion list
(South Korea, following the Epic Games Store list), counsel memo gate recorded as OPEN,
`FREEHOLD_DEEDS_ENABLED` flag default off. No client surface yet.
Acceptance: `privacy-security-review`, `migration-safety` no BLOCKING; no `src/sim/`
change (the token firewall).

#### 38 Charter mint surface and marketplace trading (web only)
Deliverables: the web-only mint surface behind the Exchange gate, deed trading as the
marketplace's "serialized collectible" category (3 percent burned, 7 percent treasury,
90 percent seller), holder flair on the exterior read-only, the distribution matrix
extended so no native, Steam, or Epic build reaches any of it.
Acceptance: the seven-row matrix green; `privacy-security-review` no BLOCKING.

#### 39 Wave D close
Deliverables: the matrix, screenshots, the wave D PR.

### Wave E: depth

#### 40 Keep and Citadel tiers, prestige deeds
Deliverables: `keep` and `citadel` (freehold) and `fortress` and guild `citadel` tiers
with courtyard and tower layouts, the prestige-deed gate on the top two tiers (the deed
choice is a Fernando ruling recorded before the phase starts), budgets 300 and 420.
Acceptance: content and render gates.

#### 41 Dye station and layout sharing
Deliverables: the alchemy dye station amenity and dye recipes, dye slots on furnishing
defs, layout save, load, and share (a layout descriptor export the marketplace never
touches).
Acceptance: reviewers no BLOCKING.

#### 42 Second freehold SKU
Deliverables: a second freehold per account with a progressive upkeep schedule (the
ArcheAge lesson), keyed `account:<id>:2`.
Acceptance: exactly-once purchase; ledger arms; reviewers no BLOCKING.

#### 43 Carpenter and Mason (conditional)
Deliverables: only if the measured furnishing demand (wave A's four-week measurement
plus wave B) proves out and Fernando rules for it: the two off-wheel crafts with their
recipes on the existing professions seams.
Acceptance: content gates; otherwise the phase records "skipped by ruling".

#### 44 Wave E close
Deliverables: the final matrix, the packet teardown offer (surface deferrals first; on
confirmation `git rm -r docs/freeholds/` in its own commit), the wave E PR.
