# Freeholds and Guildhalls: cross-phase state

Only what the next session needs. Update at the end of every phase and QA.

## Worktree, base, and merge-forward
- Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`
- Branch: `feature/freeholds` (LOCAL; see "Push policy").
- Base at packet creation (2026-09-05): the head of open PR #3872
  (`origin/feature/masterwrought` at `0f53c92ff7`, Masterwrought crafting and Farming,
  itself based on `release/v0.42.0`). The packet tip carries three cherry-picked docs
  commits (the proposal, the deck and index, the feature-plan skill refresh) on top.
- Dependency PR #3872: OPEN and, at packet creation, CONFLICTING against
  `origin/release/v0.42.0` (the release moved 37 commits past the PR base). Merge-forward
  rule, repeated in every starter prompt:
  - While PR #3872 is OPEN: at every phase start `git fetch origin --prune` and
    `git merge origin/feature/masterwrought` (its fresh head, never a stale copy).
  - Once PR #3872 has MERGED: discover the newest release branch
    (`git branch -r | grep 'origin/release/' | sort -V | tail -1`), compare with
    `git rev-list --left-right --count HEAD...origin/release/<newest>`, merge it, and
    DELETE this dependency block from `state.md`.
  - After any non-empty merge run the `release-merge-audit` skill; if the merge touched
    `patches/`, run `pnpm install --frozen-lockfile` before anything else.
- Push policy: the branch stays local until Fernando says to push. Pushes go to `origin`,
  never a fork. A PR is opened only by a wave close phase, after the whole-feature matrix,
  and only after the push is sanctioned. Never merge a PR from a session.

## Current phase
Phase 01 (`phase-01-foundation.md`): NOT STARTED. Packet committed locally; nothing built.

## Locked decisions
Rulings (proposal section 12, adopted 2026-09-05, never reopened): personal first and
one system; account-level ownership; convert fiat and SOL to $WOC and burn a published
share (counsel and the economy service gate the mechanism); daily wear with a weekly
ledger; land money-only with everything inside earnable plus the free Inn Room; on-chain
deed on demand in wave D, web only; mobile use-only with purchases on the web; the
illustrative price ladder and 25 percent burn share as working numbers; the names.
Additions: the app-store constraint (section 8); produce joins the Ledger; the Kitchen
Garden plants nothing (zero beds); the Master Builder's Call is Claudium-priced.

Survey decisions D1 to D14 are in `brainstorm.md`. Additional decisions locked at packet
creation from the sim survey:
- D15 **The freehold rides the dungeon slot pool, owner-keyed.** Two `DungeonDef`
  records in `src/sim/content/freehold/dungeons.ts` (`freehold_inn_room` at index 15,
  `freehold_cottage` at index 16, both `spawns: []`, `guideVisible: false`, absent from
  `FINDER_ACTIVITIES`), a new `DungeonDef.claimKey?: 'party' | 'owner'` (append-only), and
  `meta.freeholdOwnerKey` stamped by the host at `addPlayer` (`account:<id>` online, the
  `feastOwnerKey`-style `entity:<pid>` fallback offline), session-only and listed in the
  parity `META_EXCLUDE`. Guests enter under the owner's key exactly as a party member
  joins a claim. Occupancy and reaping ride `updateInstances` unchanged. No new band, no
  new pool primitive.
- D16 **Live state is a Sim-owned map keyed by owner key**: `ctx.freeholds: Map<ownerKey,
  FreeholdState>` with the guild-bank load/serialize/evict idiom (`loadFreehold`,
  `serializeFreehold`, `evictFreehold`), so two characters of one account share one live
  record. The server persists it in `account_freeholds` with a `rev` compare-and-swap
  upsert (a stale write is refused, never merged). Offline hosts persist NOTHING: the
  offline world is a fresh `Sim` on every entry (every `serializeCharacter` caller lives in
  `server/`, pinned by `tests/professions_farming_state.test.ts`), so a fresh offline Sim
  starts with the default Inn Room record, pinned. Nothing lives only on the instance slot.
- D17 **Furnishings are walk-through in wave A until Phase 10**, which generalises the
  runtime collider region registry (`allocRiftCollisionToken`, `setRiftRegion`,
  `clearRiftRegion`) beyond the rift band and publishes the owner's placed-furnishing
  colliders per claim under ONE collision token per claim (allocated at claim on the
  `InstanceSlot`, released on free; the server holds many claims at once). Every
  furnishing def carries a REQUIRED collision radius `r` from Phase 03 on (`r: 0` means
  walk-through, as for a rug), so Phase 10 adds no content churn.
- D18 **The plot's crafting station may draw from the vault.** `vault_craft_gate.ts`
  gains an explicit arm for "standing in a claim you own with a built station", because
  the proposal's bags-then-vault rule for crafts at home outranks the open-world-only
  default (pinned by a negative case for a visitor's plot).
- D19 **Trophies are furnishing-shaped records, never items.** `trophy_eligibility.ts`
  maps deed ids, illuminated Reliquary pages, `slain:*` marks, owned mounts, and the
  `perfected` stamp to trophy prop ids; `syncTrophyUnlocks(ctx, meta)` runs after the
  join retro block and on first entry, reads only, and records unlocks in the freehold
  record with `retro: true` events. Trophies occupy plinth slots, cost no decor points,
  and are never tradable.
- D20 **Facet member names.** The packet renames the proposal's section 11 facet sketch
  (`freeholdInfo`, `freeholdPlace`, `freeholdMove`, `freeholdRemove`, `freeholdRepair`) to
  `myFreehold`, `placeFurnishing`, `moveFurnishing`, `removeFurnishing`, `payLedger` (the
  farming facet's verb-first style). Do not rename them back.
- D21 **Ruling 6 outranks the section 8 Seeker row for deed surfaces.** Every on-chain
  Freehold Charter surface (mint, trade, holder flair) is web and website-desktop only;
  the Seeker dApp Store row is OFF for deeds. The Seeker PURCHASE row (Claudium) is O4.
- D22 **Only amenities lock below condition 30.** Placement, moving, removing, undo, and
  entry never lock on condition (the proposal locks stations, the Strongbox, and trophy
  finishes; the door always opens). The in-world cosmetic wear (cold hearth light, dull
  trophy finishes) lands with the finishes in Phase 23.
- D23 **Layouts are content.** `INN_ROOM_LAYOUT`, `COTTAGE_LAYOUT`, and every later tier
  layout live in `src/sim/content/freehold/layouts.ts` (data-as-code);
  `src/sim/dungeon_layout.ts` keeps the helpers and the Dawnhold exemplar. The Hearth Key
  item def lives in `src/sim/content/freehold/items.ts`; its use arm and cooldown logic in
  `src/sim/freehold/hearth_key.ts`.
- D24 **The dev grant.** `/dev freehold <tier>` under `ALLOW_DEV_COMMANDS=1` (offline and
  the server dev path) sets the record's tier through a setter in
  `src/sim/freehold/state.ts`, lands in Phase 07, is refused without the flag (pinned),
  and is what the perf tour and the offline Cottage use. Phase 15's Charter grant reuses
  the same setter; Phase 21 extends the command for `lodge`.
- D25 **Furnishings are Exchange-eligible** at every rarity (the mount rule, proposal
  section 6.5), decided and pinned once in Phase 02; the Exchange itself stays behind its
  existing web-only gate, so no native or Steam or Epic build reaches a furnishing trade.
- D26 **One deny-line selector.** `freeholdDeniedLineKey(reason)` lives once in
  `src/ui/hud/housing/housing_view.ts` over one `hudChrome.housing.denied.*` namespace;
  every later phase appends rows to it, never a second selector or namespace.

## Non-negotiables (every phase)
- Determinism: all randomness via `Rng`; housing draws NONE (placement, upkeep, and the
  seeded weekly ledger order are pure functions of content and the realm calendar); no
  wall clock in `src/sim/` (`ctx.lockoutNowMs()` and `ctx.resetDay` are the clocks).
- One sim, three hosts: the module runs unchanged offline, online, and headless; the RL
  env excludes housing by a pin.
- Server authority: every outcome is decided in the sim on the server; the client
  predicts nothing and mirrors deltas.
- Token firewall: no on-chain vocabulary in `src/sim/` (wallet, token, $WOC, mint, holder,
  marketplace, on-chain, Solana, and the on-chain Freehold Charter deed). The Book of Deeds
  (deed ids, `deedsEarned`, guild deeds) is game content and is NOT firewall vocabulary. A
  purchased effect arrives as a server-applied grant after the economy service confirms.
- Store policy: `FREEHOLDS_ENABLED === '1'` read live, default off; no purchase surface
  and no wallet, $WOC, on-chain deed, or marketplace string in any App Store, Google Play, Steam,
  or Epic path; no "earn" language; nothing repossessed, nothing destroyed, no timed loss.
- Never sell power: no amenity or furnishing changes a combat, progression, gathering, or
  drop number; the only buff in a house is a feast's Well Fed.
- Never a Perfecting keystone (`wyrmfall_core`, `sundered_essence`, `makers_ember`), a
  gear intermediate, or the quickening catalyst in any ledger, furnishing, or upgrade
  bill. Zero new farm beds. Recipes and their `stationType` gates unchanged.
- Vocabulary fixed; "phase" never leaves this directory; no em dashes, en dashes, or
  emojis anywhere.

## Validation matrix (by change type; pick every row the phase touched)
| Change type | Run |
|---|---|
| Any code | `npx tsc --noEmit`; the phase's own vitest files one at a time; `npm run ci:changed` after the LAST commit (read the exit code) |
| `src/sim/` | `npx vitest run tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts` plus the module's suite and a determinism (same seed, same state) case; parity goldens (`tests/parity/`) regenerated with `UPDATE_PARITY=1` in their own commit when a sampled field or emit changes |
| `src/sim/content/` | `npx vitest run tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/market_filters.test.ts`; `npm run wiki:content` then `npx vitest run tests/guide.test.ts` |
| `src/world_api/` | `npx vitest run tests/world_api_parity.test.ts tests/command_schema.test.ts tests/command_facets.test.ts` |
| Wire or snapshot | `npx vitest run tests/snapshots.test.ts tests/env_protocol.test.ts tests/bandwidth.test.ts` plus the housing chain test |
| `server/` | the domain suite under `tests/server/`; `npx vitest run tests/server/http/surface_inventory.test.ts tests/server/http/error_codes.test.ts tests/server/main_retention_wiring.test.ts tests/api_error_code_parity.test.ts`; pg-armed twins with `TEST_DATABASE_URL=postgres://eastbrook:change-me@localhost:5433/eastbrook` after `npm run db:up` |
| `src/ui/`, `src/styles/`, `src/render/` | `npx vitest run tests/architecture.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts`; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`; `node scripts/pr_screenshots.mjs` for visual change; `npm run perf:tour` for GPU producers |
| `headless/` | `npx vitest run tests/env_protocol.test.ts tests/client_env.test.ts` |
| Merge bar | CI green on the wave PR (`gh pr checks --watch`); `node scripts/gate_select.mjs` only for a change CI cannot see |

## Seams and names (verified 2026-09-05; anchors to re-verify, not promises)
- Sim module: `src/sim/freehold/` behind `SimContext` with an `index.ts` barrel and a
  local `CLAUDE.md`; modules planned: `types.ts`, `state.ts` (load/serialize/evict),
  `instance.ts` (claim, rehydrate, descriptor), `layout_core.ts` (pure placement leaf),
  `placement.ts` (commands), `condition_core.ts`, `ledger_core.ts`, `ledger.ts` (pay),
  `amenities.ts`, `trophy_eligibility.ts`, `trophies.ts`, `visiting.ts`, `grant.ts`
  (server-only grant functions, never on `COMMAND_NAMES`); that is the wave A list, and
  later phases append their own modules (`hearth_key.ts`, `colliders.ts`, `upgrade.ts`,
  `hall_fund.ts`, `guild_deeds.ts`, `garden_view.ts`, `wards.ts`, and so on). New
  `SimContext` primitives
  and callbacks are appended and mirrored in `tests/sim_context.test.ts` (`CALLBACK_KEYS`
  and the fake host); a `freehold/` row joins the `src/sim/CLAUDE.md` system table.
- Content: `src/sim/content/freehold/` (`tiers.ts`, `charters.ts`, `furnishings.ts`,
  `furnishing_recipes.ts`, `furnishing_patterns.ts`, `ledger_schedule.ts`,
  `trophies.ts`, `dungeons.ts`, `layouts.ts`, `items.ts`), merged by `src/sim/data.ts`
  where the table is item or dungeon data (tiers and layouts are served by reference). Item kind `furnishing`
  (`FurnishingItemDef`), the one new kind. Patterns are `RecipeItemDef` rows
  (`pattern_<output>`), never a new kind.
- Facet: `src/world_api/housing.ts` (`IWorldHousing`), pinned in
  `tests/world_api_parity.test.ts` (five edits per member batch), commands appended to
  `COMMAND_NAMES` and tagged in `COMMAND_FACETS` in `src/world_api.ts`.
- Instances: `DungeonDef.claimKey`, `freehold_inn_room` (index 15), `freehold_cottage`
  (index 16); interiors `'inn_room'` and `'cottage'` on the `interior` union with
  `DungeonLayout` records (`INN_ROOM_LAYOUT`, `COTTAGE_LAYOUT`) plus lift functions,
  `STATIC_INTERIOR_COLLIDERS` entries, `groundHeight` arms, render variants.
- Wire: self key `fhold` (owner account state, strict decode in
  `src/net/freehold_snapshot_wire.ts`, created in Phase 01 with an empty allowlist and
  filled in Phase 08), pid-scoped `freeholdState` descriptor event
  (re-sent on resume like `riftStateEventFor`), text-free `freeholdDenied` and
  `freeholdGranted` events; server sibling `server/freehold_wire.ts`
  (`dispatchFreeholdCommand`, `emitFreeholdSelfKeys`); `HEAVY_SELF_CMDS` /
  `HEAVY_SELF_EVENTS` rows; `JAILED_BLOCKED_COMMANDS` for the gate and Hearth Key.
- Server: `server/freehold_db.ts` (`FREEHOLD_SCHEMA`, `account_freeholds`, later
  `freehold_ledgers`, wave D `freehold_deeds`), `server/freehold_routes.ts` (registered
  in `server/http/registry.ts`, never inline in `main.ts`), `server/freehold_config.ts` (`freeholdsEnabled`), error family `freehold.*`,
  Claudium spend kind `freehold` beside `storage`, telemetry source `freehold`, a
  `freeholdForAccount` read at fresh join beside `bankBonusFactsForAccount`.
- Client: `src/render/freehold/` (`furnishings.ts` painter modelled on
  `FarmPatchVisuals`, `furnishing_layout_core.ts` in `RENDER_PURE_CORES`, the interior
  dressing, `furnishing_ghost_visual.ts`), `src/ui/hud/housing/` (barrel + `CLAUDE.md`:
  `build_mode_*`, `furnishing_palette_*`, `steward_panel_*`, `trophy_case_*`),
  `src/game/distribution_surfaces.ts`, `HudFeatures.freeholdPurchaseEnabled`, keybinds
  `toggleBuildMode`, `rotateFurnishingLeft`, `rotateFurnishingRight`.
- i18n: `hudChrome.housing.*` in `src/ui/i18n.catalog/hud_chrome.ts`; item names in the
  item-names domain; `apiError.freehold.*` via `npm run new:endpoint`; world-entity names
  in `src/ui/world_entity_i18n.ts`.
- Deeds family "Homesteader"; Reliquary "Hearth shelf" (furnishing items only; patterns
  never); provisioner firewall arm for the ledger schedule table.

## Content numbers (working values; the economy service and Fernando own the finals)
The tier ladder (proposal section 6.3; the Inn Room is the packet's tier 0):

| Tier | Freehold | Guildhall | Rooms | Decor budget | Plinths | Amenity slots | Illustrative fee |
|---|---|---|---|---|---|---|---|
| 0 | Inn Room | (none) | 1 | 20 | 3 | 0 | free, every account, no upkeep |
| Common | Cottage | Meeting Hall | 1 | 60 | 4 | 1 | $20 land (Claudium, service-priced) |
| Uncommon | Lodge | Great Hall | 2 | 120 | 8 | 2 | $25 plus materials |
| Rare | Manor | Bastion | 3 | 200 | 14 | 3 | $50 plus materials |
| Epic | Keep | Fortress | 4 plus a courtyard | 300 | 22 | 4 | $100 plus materials plus a prestige deed |
| Legendary | Citadel | Citadel | 5 plus a courtyard and tower | 420 | 32 | 6 | $200 plus materials plus a prestige deed |

Guildhall fees are roughly 3x the freehold figures, pooled through the Hall Fund.
Condition 0 to 100, minus 1 per realm day for a Freehold and 2 for a Guildhall
(`ctx.resetDay`), pause after 7 days without a login on the account (`last_seen_day`), 3
repair-free days on return, amenities lock below 30 (D22), the door always opens, nothing
is destroyed. Ledger: 3 to 5 stacks of tier 1 and 2 materials across ore, wood, herb,
hide, cloth, fish, and produce in a seeded weekly order; base grade before `fine_`; bags
then vault; prepay up to 4 weeks in wave A (12 from Phase 25); repairing from 93 costs
the same as from 60; the cost anchor is about ten percent of an active gatherer's weekly
output at the Cottage rising to about twenty percent at the Citadel. Master Builder's Call
about 1.5x the ledger's market value, Claudium, service-priced. Upgrade bills: tier 3 and
4 fine materials and tier 4 produce, never a keystone.

MVP literals pinned by tests (TUNING, Fernando owns the finals): Hearth Key cooldown 60
minutes (the classic-era hearthstone reference), persisted as `hearth_key_ready_ms`;
visitor cap 8 at the Cottage; the 15-degree yaw step (`ROTATE_STEP_RAD`); the placement
cell pitch is settled in Phase 08 from the room bounds and pinned there.

Wave B to E working values (TUNING, every one owned by Fernando unless the economy
service owns it): pattern `sellValue` 100 (the shipped pattern contract); visitor caps 8,
12, 16, 20, 24 by tier; public-entry rate limit one knock per plot per 10 seconds; Ward
size 24 to 50 plots (working 50) around a square with one Guildhall anchor plot (working
cap 24 members visible); ward favor four ranks, plus 10 decor points per rank for every
member; Endeavor month boundary settled in Phase 35 from the realm calendar; Showcase
season 13 weeks; guest book 50 entries per plot with reactions only; Guildhall donation
cap per member per week settled in Phase 29 as a multiple of one ledger; the Guildhall
contribution log retention window 90 days; dye palette
eight dye ids; layout save slots 5; the second freehold's ledger 1.5x stacks; deed
resale split 3 percent burned, 7 percent treasury, 90 percent seller with a collection
royalty to the treasury (the economy service's number, published, never computed in the
game); Keep and Citadel budgets 300 and 420, plinths 22 and 32, amenity slots 4 and 6.

## Per-phase ledgers (fill as phases complete)
| Phase | New files | IWorld members | SimEvents | Wire keys and commands | Endpoints | Tables | i18n keys |
|---|---|---|---|---|---|---|---|
| 01 | | | | | | | |

## OPEN items and policy gates
See `brainstorm.md` O1 to O7. The three money gates, each with an owner:
1. Counsel sign-off before `FREEHOLDS_ENABLED` is set in production and before any store
   submission carrying housing copy (owner: counsel; Fernando triggers).
2. Fail-closed flag defaulting off, pinned by tests from Phase 01 (owner: this packet).
3. The seven-distribution surface map pinned by tests from Phase 14 (owner: this packet);
   the Seeker row is O4 until the tree proves it.

## Gotchas (read before the matching phase)
- `src/sim/sim.ts` (ceiling 12006), `server/game.ts` (10336), and `src/net/online.ts`
  (5861) sit at ZERO monolith slack: every delegate or case label added must be paid for
  by extracting an existing block first, then lower the ceiling. `IWORLD_MEMBERS` probes
  the prototypes, so facet methods stay one-line delegates on `Sim` and `ClientWorld`.
- `OtherItemDef.kind` is an `Exclude` list: add `'furnishing'` to it or the new kind
  silently becomes a generic usable (Phase 02).
- `tests/market_filters.test.ts` fails on any `ItemKind` without a browse bucket.
- Parity goldens sample every `PlayerMeta` field by default; a session-only stamp goes in
  `META_EXCLUDE` with a justification; a new emit on a driven path reddens goldens until
  regenerated in its own commit.
- The vault craft gate refuses vault draws inside every instance band; the freehold arm
  (D18) must be explicit and negative-tested.
- `respawnTimer = Infinity` is required on any lootable-false ground object or the
  respawn sweep re-arms it one second later.
- Instances never persist; the row is the truth and the live slot is a cache rebuilt on
  every claim.
- `ALL_DELTA_KEYS` in `tests/snapshots.test.ts` is an exact count; every release sync
  conflicts on it. Bare `emit('key'` in an extracted emitter module is what the scrape
  counts.
- The character blob is CHARACTER state; the freehold is ACCOUNT state (D5). A pre-feature
  binary's first save drops unknown blob fields (forward-only rollout), one more reason
  the row lives outside the blob.
- Bed and crop ids are frozen save keys; furnishing ids, trophy ids, and plinth ids are
  frozen the same way once persisted.
- The offline `farmNowMs` returns the sim clock and the online one `Date.now()`: a house
  timer follows the facet's clock-base contract (`housingNowMs()`), never subtracting any
  other clock.
