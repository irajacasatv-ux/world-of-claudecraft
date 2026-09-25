# Phase 06: the interiors, the Eastbrook Freehold Gate, the Hearth Key

## Functional capture inventory

The exact 06 registry is `scripts/lib/pr_shot_freeholds.mjs::freeholdReviewTargets`:
`freehold-gate` (`gate-own-prompt`), `freehold-inn` (`inn-safe-landing`) and
`freehold-cottage` (`cottage-safe-landing`), each with desktop, compact and tablet
variants. This is nine registry variants and eighteen before/after image files.
The absent-surface baseline uses the real release quay under
`PR_SHOTS_FREEHOLD_BASELINE=1`; it never fabricates a prior prompt or room.
09 still owns its separate twelve day/night variants and final lighting evidence.
Regenerate the planned inventories with `node docs/freeholds/generate-ux-manifests.mjs`;
the unchanged 557 housing keys and expanded 742 planned variants (339 in Wave A)
are requirements, not proof that later capture fixtures exist.


Wave A, the Cottage MVP. The spec is `progress.md` "06 Interiors, the Eastbrook gate, the
Hearth Key"; the decisions are `state.md` (the `interior` union members, `DungeonLayout`
records with lift functions, `STATIC_INTERIOR_COLLIDERS`, the Hearth Key cooldown working
value, `JAILED_BLOCKED_COMMANDS`, D23 and D26) and `state.md` D4 and D13 (stand-ins
before art).
This phase replaces Phase 05's placeholder interiors with the real Inn Room and Cottage
shells, gives the player two ways in (confirming the quay gate prompt, using the Hearth
Key), and is the first player-reachable housing surface, so it is a CLIENT phase with
screenshots. Its offline entry, perf tour and captures depend on Phase 05's default Inn
Room record and `/dev freehold <tier>` fixture (D81), not on Phase 07; on a dark realm
the gate prompt and the Hearth Key are neither spawned nor granted (D85).

### Starter Prompt
```
This is Phase 06 of the Freeholds and Guildhalls feature: the interiors (Inn Room and
Cottage layouts with derived colliders and render variants), the Eastbrook Freehold Gate,
and the Hearth Key.

Harness: Codex. Asset generation in this implementation must use Codex, not Claude.
Follow AGENTS.md and root/directory CLAUDE.md repository contracts; use the active Codex
model and the existing image/model/SFX pipelines, provenance and quality gates.

Goal: author the two interiors as data the sim and the renderer both read (walls, doors,
static decor with measured radii, plinth and hearth anchors), build them on proximity
through the existing gated loop, spawn one tier-routed gate on the Eastbrook quay whose
explicit interact opens the prompt and whose confirmation enters (never proximity, D50),
grant every character of the owning account a Hearth Key that walks them home from any
non-instanced, non-match context on a pinned cooldown, and surface the text-free
refusals as localized toasts.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  and merge it. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on the monolith ratchet (sim.ts, world.ts, renderer.ts,
  hud.ts), renderer.ts edits owing the Eastbrook re-mint, screenshots at the lowest
  graphics preset, capture rigs never finding elements by English text, the jailed
  command set, the S3 i18n guard, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (seams, working numbers, gotchas), docs/freeholds/progress.md
  (only "06 Interiors, the Eastbrook gate, the Hearth Key"), and this file
- src/sim/dungeon_layout.ts (DungeonLayout, DAWNHOLD_LAYOUT with DAWNHOLD_ROOMS, DOORS,
  DECOR, the dawnholdBrazier helper and DAWNHOLD_R_* radii, dawnholdKeepLiftAt,
  layoutColliders, DUNGEON_WALL_HW), src/sim/rift/authored.ts (AuthoredRoom, AuthoredDoor,
  AuthoredDecor, authoredWallSegments, authoredColliders, authoredLiftAt, inAnyRoom,
  roomAt), src/sim/colliders.ts (STATIC_INTERIOR_COLLIDERS), src/sim/interior_collider_sets.ts
  (derivedInteriorColliders), src/sim/dungeon_floor.ts (INTERIOR_LAYOUTS), src/sim/world.ts
  (the groundHeight interior arms), src/sim/types.ts (the interior union, DungeonDef, the
  ItemUse union, the tool item shape with soulbound and noDiscard flags)
- src/sim/content/freehold/{dungeons.ts,tiers.ts} (Phase 05 and 03), src/sim/freehold/
  {instance.ts,state.ts,index.ts,CLAUDE.md} (Phase 05), src/sim/instances/dungeons.ts
  (updateDoorTriggers, DOOR_TRIGGER_RADIUS, the ctor door spawn, leaveDungeon and
  detachFromDungeon's return position), src/sim/entity.ts (createGroundObject), the
  ground-object table src/sim/data.ts GROUND_OBJECTS (exposed as WorldContent.groundObjects
  and spawned by the Sim ctor loop, grep `worldContent.groundObjects` in src/sim/sim.ts;
  no src/sim/content/ zone file carries groundObjects rows) and the non-lootable
  interactable precedent: src/sim/content/mailboxes.ts, its ctor spawn beside that loop
  (grep `'Mailbox'` in src/sim/sim.ts) and its EASTBROOK_LAYOUT SERVICES position in
  src/sim/eastbrook_layout.ts; src/sim/interaction.ts (interact() handles only lootable
  objects and pickUpObject refuses `!obj.lootable`, so the gate needs its own client arm);
  src/game/interactions.ts (both button arms route objects by templateId: dungeon_door,
  dungeon_exit, mailbox, then pickUpObject) and src/game/nearby_interaction.ts (the same
  chain for the nearby-interact press); src/sim/items.ts (useItem, the ItemUse arm chain,
  the placeMobileStation arm), src/sim/professions/mobile_station.ts
  (placeMobileStationFromItem: holding is the credential, using consumes nothing),
  src/sim/content/items.ts (the masters_field_forge item def, the model for the key),
  src/sim/data.ts (mergeItems, where the new src/sim/content/freehold/items.ts table joins
  ITEMS), src/sim/sim.ts (the per-player tick site that calls updateDoorTriggers),
  src/sim/unstuck.ts unstuckLocationAt (how rift, delve, battleground and claimed-instance
  contexts are resolved explicitly), src/sim/sim_context.ts (bgMatches, arenaMatches,
  duels), src/sim/freehold/{state.ts,instance.ts,dev_grant.ts} from Phase 05 (the default
  tier-0 record, setFreeholdTier, the `/dev freehold <tier>` fixture),
  src/game/freehold_dev_bootstrap.ts and scripts/lib/freehold_dev_authorization.mjs (its
  loopback bridge)
- src/render/dungeon.ts (DungeonInteriorVariant, buildInterior and how it resolves a
  layout and variant from the interior string, ensureDungeonAssets, buildPrewarmGroup),
  src/render/dawnhold_dressing.ts (buildDawnholdDressing, ensureDawnholdDressing),
  src/render/renderer.ts (the dungeon proximity loop and builtInteriors, and the PRIVATE
  retireInteriorGroup method reached only as a callback), src/render/gated_scene_attach.ts,
  src/render/CLAUDE.md ("GPU work"
  and RENDER_PURE_CORES), src/render/characters/CLAUDE.md (the subsystem template)
- server/game.ts (JAILED_BLOCKED_COMMANDS and the `case 'use':` dispatch that reads
  msg.item and optional msg.slot), server/freehold_wire.ts, the `use` payload shape
  `{ cmd: 'use', item, slot? }` (grep `cmd: 'use'` in src/net/online.ts; no separate
  item-use command exists)
- src/ui/world_entity_i18n.ts, src/ui/entity_display_core.ts (objects display the raw
  sim name except feasts, so the gate needs a templateId-to-key arm there),
  src/ui/hud/professions/feast_title.ts (the hand-listed templateId map),
  tests/entity_display_name.test.ts, src/ui/map_marker_semantics_core.ts (MapMarkerSemantic
  has dungeon, rift and delve kinds only), src/ui/map_semantic_accessibility_core.ts
  (semanticMapMarkerArt, mapMarkerSemanticLayer, mapMarkerSemanticToken),
  src/ui/minimap_markers.ts, tests/map_marker_semantics.test.ts,
  tests/map_semantic_accessibility_core.test.ts, tests/minimap_markers.test.ts,
  scripts/perf_tour.mjs (PERF_SCENARIO is a label read by src/game/perf_reporter.ts; the
  tour drives movement itself and has no interior route yet),
  src/ui/hud/professions/farming_view.ts
  (farmDeniedLineKey), src/ui/hud/professions/farm_event_feedback.ts (handleFarmEvent) and
  its hud.ts call site, src/ui/hud/housing/ (Phase 02 barrel), src/ui/i18n.catalog/
  hud_chrome.ts (the farming namespace), the item-names catalog module
- tests/renderer_compile_gate.test.ts, tests/architecture.test.ts,
  tests/monolith_budget.test.ts (sim.ts, world.ts, renderer.ts, hud.ts rows),
  tests/item_icons.test.ts, tests/dungeons.test.ts, tests/freehold_instance.test.ts,
  tests/mobile_station_party.test.ts (the field-forge item-use pins),
  .claude/skills/pr-screenshots/SKILL.md, scripts/pr_shot_targets.mjs
The agent returns: the layout authoring recipe (rooms, doors, decor keys, radius helpers,
lift function) and the six touch points per interior with the extraction candidate that
pays for the world.ts arms; how buildInterior resolves a layout and variant by interior
string and where a dressing module hooks in with its prewarm home; the gate spawn site and
the explicit gate interaction call site plus the sim.ts extraction that pays for a per-player call;
the ItemUse arm recipe; the `use` payload field (msg.item) a jailed check can read; the
client object-routing arms to extend; the marker semantic recipe (kind, art token, layer,
accessibility token); the deny-toast wiring recipe and its hud.ts cost; the perf tour
route recipe; the screenshot target recipe (desktop, compact, tablet).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:

Deliverables (at most five):
1. The measured Inn/Cottage layouts, collision/lift derivations and safe entry/exit poses.
2. Explicit Eastbrook gate interaction and the owned Hearth Key, with all authority gates.
3. Shared-grammar interior shells and scheduler-prepared dressing on both room families.
4. The gate prompt, its semantic map marker, keyed refusal feedback and all
   item/entity/i18n/content obligations.
5. Decisive offline/online tests and the desktop/compact/tablet visual evidence.

Consume ux-spec.md's first-moment flow and art-brief.md's measured reference plan. Freeze
room bounds, door swing, protected arrival-to-hearth-to-exit walking path, plinth/amenity
anchors and gate/entry/facing coordinates in content-numbers-workbook.md before runtime
constants. Inn and Cottage share Eastbrook plaster/timber, hearth warmth, quiet window
edge, cloth and truthful empty plinths; a free room is never visually second-rate.

The gate opens the plant-sheet decision-window-family prompt through NEW
src/ui/hud/housing/housing_view.ts and gate_prompt_painter.ts, with own-home and
friend-by-name destinations. Before 18 implements friend lookup, that row is visibly
unavailable through hudChrome.housing.common.unavailable; it becomes live before
Wave A closes. Proximity never triggers entry. All empty/loading/pending/error/locked,
full/busy/recovery and visitor states use hudChrome.housing.gate.* or the one denied
selector; never leak an owner lookup or create a purchase link. Escape/cancel returns
focus to the gate affordance. Use shared focus/keyboard order and 40x40 touch targets
from ux-spec/state, retaining safe areas and returning movement immediately on close.

Successful entry carries authoritative safe position/facing and the existing confirmed
dungeonEntrySeq identity, consumed by 09's arrival coordinator. Only a delivered
freshArrivalPresentation can produce welcome feedback, consumed at most once for
that accepted transition. Its firstTierViewEligible flag from 07c's committed
account/tier winner alone permits the optional camera view; ordinary return/visitor
stays static. Snapshot/resume/replay grants no new output, and commit-before-ACK
loss may omit presentation. The Hearth Key
always resolves current owner authority; holding a tool cannot confer someone else's
plot. Using it while already at the selected home changes neither position nor cooldown.
Its shared account cooldown cannot be bypassed through alts or, later, second plots.
06 creates no added room light; 09 owns realm-daylight continuity and condition grade.
Every screenshot below also captures the prompt and safe landing, with the matching
ux-spec key/state names. 11 and 20 integrate the full arrival flow after 09 lands.
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent LAYOUTS: src/sim/content/freehold/layouts.ts with INN_ROOM_LAYOUT (one room, a
  bed as static decor, three plinth anchors `plinth_1` to `plinth_3` as named decor keys
  without r, the hearth anchor) and COTTAGE_LAYOUT (one room, four plinth anchors, the
  hearth, the strongbox and station anchors reserved as named keys for Phase 12), every
  static decor with a measured r, and `innRoomLiftAt` and `cottageLiftAt` over
  authoredLiftAt; `'inn_room' | 'cottage'` on the interior union; the two
  STATIC_INTERIOR_COLLIDERS entries; the groundHeight arms in src/sim/world.ts paid for by
  an extraction and a LOWERED world.ts ceiling; the Phase 05 records swapped to the real
  interiors with entry inside the room and overworldDoor false; tests/freehold_layouts.test.ts
  (walls and colliders deterministic across two derivations, no room overlap, every anchor
  and the entry inside a room, plinth anchor count equals the tier's plinths, the hearth
  present in both, lift zero on the flat floor).
- Agent GATE AND KEY: src/sim/freehold/gate.ts (the Eastbrook Freehold Gate: one ground
  object with templateId `freehold_gate`, lootable false, respawnTimer Infinity, spawned
  by the ctor beside the mailbox from an EASTBROOK_LAYOUT SERVICES quay position ONLY when
  the Sim's freeholdsEnabled boot config is true (D85: a dark realm spawns no gate; the
  offline and headless hosts pass true under D3); an explicit interact action opens the
  gate prompt and validates authoritative proximity on confirmation before calling
  enterFreehold, tier-routed through freeholdDefForTier; proximity only exposes the
  affordance and NEVER teleports; no new per-player housing tick loop; leaveFreehold
  lands at the authored safe gate position), the `hearth_key` tool item DEF in
  src/sim/content/freehold/items.ts (soulbound, no market listing, sellValue 0, merged by
  src/sim/data.ts, every content obligation applies), and its use arm and cooldown logic
  in src/sim/freehold/hearth_key.ts (D23): an ItemUse arm `{ type: 'freeholdEnter' }`
  that enters from any open-world zone, consumes nothing, refuses in combat and while
  dead through freeholdDenied, refuses from inside a rift floor, a delve, a dungeon or
  any other claimed instance with the reason `instanced` and from inside a battleground,
  an arena match, a duel or while carrying a battleground flag with the reason `match`
  (both ids APPENDED to the Phase 05 enum after `busy`, before Phase 08's ids; the
  contexts are resolved the way src/sim/unstuck.ts resolves them, never by position
  guesswork; using the key at the selected home is the already-home no-op), and refuses
  `cooldown` against the authoritative account Hearth state,
  using its isolated host-clock mirror offline and 07a transaction participant online, the cooldown being the state.md working
  value (60 minutes, the explicitly retained state.md working target; no unsupported
  historical attribution) pinned by test; granted to each character of the owning
  account on its first gate entry and re-granted when absent for inventory usability
  only, and only while the boot config is true (D85); with full bags the entry proceeds
  and no key is minted, the grant retrying on the next entry that finds a free slot;
  owning the item grants no admission authority); the server side: a payload-aware
  jailed check in server/freehold_wire.ts for the `use` command carrying the Hearth Key
  (`msg.cmd === 'use' && msg.item === 'hearth_key'`) beside JAILED_BLOCKED_COMMANDS
  (pinned); tests/freehold_gate_and_key.test.ts, and the dark-realm arms appended to
  tests/server/freehold_wire.test.ts (a Sim built from buildRealmSimConfig with
  FREEHOLDS_ENABLED unset spawns no freehold_gate entity and grants no hearth_key on
  entry; with '1' both happen).
- Agent RENDER: `'inn_room' | 'cottage'` DungeonInteriorVariant members on the dawnhold
  grammar in src/render/dungeon.ts, the layout and variant resolution for the two interior
  strings, src/render/freehold/{index.ts,CLAUDE.md,interior_dressing.ts} (static dressing
  only: the bed, the hearth focal shape awaiting the light/condition grade from 09, the plinth bases as stand-ins; no lights, Phase 09 owns
  the rig) on the dawnhold_dressing.ts shape, built on proximity through the existing
  gated loop with every material in a prewarm home; a renderer.ts edit only if the loop
  cannot resolve the new interiors by data (then the Eastbrook re-mint memory applies);
  the tests/renderer_compile_gate.test.ts arm for the two interiors; a NEW freehold route
  in scripts/perf_tour.mjs (or a sibling scripts/perf_tour_freehold.mjs it imports) run
  offline as `PERF_SCENARIO=bench_freehold_interiors npm run perf:tour`: walk to the
  quay gate, confirm own-home entry through the real prompt, sample the Inn Room, grant
  the Cottage through Phase 05's real `/dev freehold cottage` chat route under the
  loopback bridge (D81), re-enter and sample the Cottage, with zero live-program events
  in both samples.
- Agent CLIENT: the NEW `hudChrome.housing.denied.*` English keys (D92; sentence case;
  no "earn" language): denied.dead "You cannot do that while dead.", denied.combat "You
  cannot do that in combat.", denied.cooldown "Your Hearth Key is still cooling down.",
  denied.instanced "You cannot use this inside an instance.", denied.match "You cannot
  use this during a match."; the gate's templateId row in src/ui/world_entity_i18n.ts
  ("Freehold Gate") plus the templateId-to-key arm in src/ui/entity_display_core.ts so
  the world label and map cores name it by key (objects otherwise display the raw sim
  name) with the object case added to tests/entity_display_name.test.ts; the Hearth Key
  name in the item-names catalog ("Hearth Key") and hudChrome.housing.hearthKey.tooltip
  shipped with its Wave A English "Return to your home. You cannot use this while in
  combat, dead, in jail, inside an instance or during a match." (every refusal the arm
  makes is a stated limit per docs/design/tooltip-writing.md rule 7; the second-home
  sentence belongs to 42's hearthKey.tooltipShared, which inherits the same limits; no
  tooltip ships a mechanic before its handler); src/ui/hud/housing/housing_view.ts with
  `freeholdDeniedLineKey(reason)`
  (UI_PURE_CORES; D26: the ONE deny-line selector over hudChrome.housing.denied.*, total
  over the enum as it stands after this phase: no_freehold to denied.unavailable, busy
  to denied.busy, locked to denied.condition, dead/combat/cooldown/instanced/match to
  their NEW rows, visitors_full and not_friend to denied.permission until 18 appends
  their own rows; later phases append rows to it and never add a second selector) and
  src/ui/hud/housing/freehold_event_feedback.ts (the handleFarmEvent shape) wired at the
  HUD event switch without growing hud.ts (or paid for and lowered); the gate arm in
  src/game/interactions.ts (both button arms) and src/game/nearby_interaction.ts on the
  mailbox precedent (templateId `freehold_gate` opens the prompt through the HUD, never
  pickUpObject, so left-click, right-click and the nearby-interact press all reach it);
  the NEW MapMarkerSemantic arm `{ kind: 'freehold-gate' }` for that templateId in
  src/ui/map_marker_semantics_core.ts with its art token, layer and accessibility token
  in src/ui/map_semantic_accessibility_core.ts and src/ui/minimap_markers.ts, labelled by
  the existing hudChrome.housing.gate.marker ("Freeholds gate"), extended in
  tests/map_marker_semantics.test.ts, tests/map_semantic_accessibility_core.test.ts and
  tests/minimap_markers.test.ts (16 later selects this marker from the Charter receipt);
  the Hearth Key WebP with provenance; tests/housing_view.test.ts; and the
  scripts/pr_shot_targets.mjs entries plus the before/after captures (desktop, compact,
  tablet) through the pr-screenshots skill committed under docs/screenshots/, the Cottage
  captures granted through Phase 05's real `/dev freehold cottage` route under the
  loopback bridge (D81; never a window.__game mutation or a direct setter); and the
  regeneration of ux-key-manifest.json and ux-shot-manifest.json in this phase with every
  cited count updated (D92).
The coordinator runs last: tests/entity_display_name.test.ts re-pin, tests/item_icons.test.ts,
`npm run wiki:content`, and the monolith ceilings.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

<!-- core-ux-gate:start -->
GATE LOOKUP AND ARRIVAL REFINEMENTS (approved D41 and ux-spec.md):
- Phase 06 owns the plant-sheet decision-window composition in housing_view.ts and the
  thin gate prompt painter; Phase 18 extends it with visit_prompt_view.ts. The own tab's
  Enter action is distinct from the friend tab's hudChrome.housing.gate.lookup action.
  A friend name field Enter invokes Find home, never immediate entry. Enter is absent
  until a matching authorized result exists. Successful lookup focuses/announces
  hudChrome.housing.gate.result; Tab reaches Enter. Editing the name immediately clears
  the previous result/capability and shows hudChrome.housing.gate.lookupChanged.
- Carry request identity plus normalized queried name through lookup; old responses
  cannot replace or authorize a newer draft. Failure retains the name for retry. Explicit
  Enter submits only the current result and repeats authoritative admission. Phase 18
  owns actual lookup; Phase 06 owns the composed state/focus contract from the start.
- Physical gate admission does not read the remote Hearth Key cooldown. Test a key
  cooling down while an authorized physical gate entry succeeds. Entry/decoration stay
  independent of low condition; other actual admission restrictions still apply.
- Keep structural room/collision/safe arrival and prepared actionable representations
  ready before reveal through the existing arrival_warmup/arrival_cover path. Online
  additional cosmetic settle stays zero; the existing bounded offline wait cannot promise
  final cosmetics. Late optional art retains prepared readable stand-ins. No new curtain
  delay or first-spawn outdoor sweep is copied into ordinary housing arrivals.
<!-- core-ux-gate:end -->

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: layouts are data, colliders derive identically on every host, the key
  draws no Rng. Isolated offline/headless cooldown behavior reads the injected
  ctx.lockoutNowMs() host clock; online countdown display consumes only the committed
  account mirror through the facet clock-base contract. Online admission exclusively
  uses 07/07a's authoritative database epoch observed after its account participant
  lock, never a Sim/display clock or cached ready value.
- One sim, three hosts: confirmed gate interaction and the key arm run unchanged offline and
  online; the RL env still excludes housing.
- Server authority: confirmed gate interaction and the key resolve in the sim; the
  client sends the existing `use` command with the key's item id and mirrors; a jailed
  session can reach neither path.
- Dark realm (D85): with the boot config false no gate object spawns, no prompt can open
  and no Hearth Key is granted; the offline and headless hosts stay live (D3); the
  interiors, layouts and item defs are the same data on every host.
- Text-free events (D10): every refusal is a freeholdDenied reason resolved to a
  hudChrome.housing.denied.* key client-side; the gate and key names are catalog keys.
- Nothing destroyed, nothing sold: the key is granted, never bought or lost for good.
- Graphics fairness: the interiors draw at every tier; the dressing sheds nothing a
  player acts on.
- Every GPU producer is a scheduler client: dressing groups attach through the gated
  loop with a prewarm home; no bare scene.add after boot.
- Content obligations for the Hearth Key: WebP with provenance, the English name with M16
  fills if wordy, the world-entity row for the gate, wiki regen; no Reliquary page (a
  granted tool is not conquerable loot) and no deed (recorded).
- i18n: the contributor policy in docs/freeholds/implementation-plan.md.
- Token firewall (the state.md scope): no on-chain word (wallet, token, $WOC, mint, holder,
  marketplace, on-chain, Solana) in src/sim/; deed ids and deedsEarned are Book of Deeds
  game content, not firewall vocabulary.
- The monolith note: sim.ts, game.ts, and online.ts are at ZERO slack; world.ts,
  renderer.ts, and hud.ts are in the ratchet; every added line is paid for by an
  extraction and a lowered ceiling.
- Vocabulary: Freehold Gate, Hearth Key, Inn Room; the section 8 "manage on the website"
  line is NOT added here (Phase 16).
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Durable account Hearth storage (07 adds account_freehold_hearth and 07a performs the
  atomic online admission). This file owns only isolated host-clock state and the item
  interaction; the wave PR carries 07 and 07a (D12), so this phase adds no second
  production gate and its online arm proves entry through the real dispatch.
- Furnishing placement, the descriptor, colliders for placed furnishings (Phase 08 to 10);
  the light rig and the furnishing view (Phase 09); the Strongbox and station props on
  their anchors (Phase 12); visiting through the gate (Phase 18); GLB art (Phase 19); the
  Fenbridge gate and the "gate used" memory (Phase 25a).


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

HEARTH KEY CREDENTIAL AND SHARED-ACCOUNT PROOF:
Inventory regrant restores a usable shortcut only; current account/plot admission is
the authority. Test a held/transferred/forged key with no ownership, an absent key with
authorized physical entry, and regrant without minting an entitlement. Remote-key entry
uses 07/07a's account participant and committed private mirror; no plot save can reset
it. Two alts and later two destinations share the duration. Already-home/refused/key-
cooling physical-gate paths do not consume cooldown. This pair's offline behavior is
proved now; online production admission requires the completed 07/07a authority proof.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_layouts.test.ts
  tests/freehold_gate_and_key.test.ts tests/housing_view.test.ts
  tests/freehold_instance.test.ts tests/dungeons.test.ts tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/renderer_compile_gate.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/entity_display_name.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts
  tests/mobile_station_party.test.ts tests/server/freehold_wire.test.ts
  tests/command_schema.test.ts tests/env_protocol.test.ts
  tests/map_marker_semantics.test.ts tests/map_semantic_accessibility_core.test.ts
  tests/minimap_markers.test.ts tests/freehold_dev_grant.test.ts`; `npm run i18n:gen`
  then `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`;
  `npm run wiki:content` then `npx vitest run tests/guide.test.ts`;
  `PERF_SCENARIO=bench_freehold_interiors npm run perf:tour` through both interiors;
  `node scripts/pr_screenshots.mjs` for the captures.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the authoritative gate interaction, the key arm, the world.ts and sim.ts
  extractions), render-performance-reviewer (the dressing as a scheduler client, the
  prewarm home, the perf tour), content-obligations-reviewer (the Hearth Key and gate
  obligations), frontend-seam-reviewer (housing_view.ts, the feedback module, the catalog
  keys, the marker arm, the client interact arms, and the render dressing as
  presentation); the dispatch table adds cross-platform-sync (the enter paths on both
  hosts), privacy-security-review (the jailed `use` check in server/),
  server-hot-path-reviewer (the gate spawn and the key grant on the entry path, no new
  per-player loop), test-coverage-auditor (every pin), then qa-checklist (the completion
  gate). Prompt each for COVERAGE not filtering; each writes its report to a file. Do not commit until ALL findings, including nits, are resolved consistently with
  locked rulings and the fixes have fresh review.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: architecture-reviewer, cross-platform-sync, render-performance-reviewer, content-obligations-reviewer, frontend-seam-reviewer, privacy-security-review, server-hot-path-reviewer, test-coverage-auditor, qa-checklist.
  Dispatch each for COVERAGE and wait for every report. Apply ALL findings including
  nits, then a FRESH reviewer reads the entire fix round. Earlier slice lists are
  ownership examples; this complete roster is the minimum finishing dispatch.
- Database performance reviews happen before implementation decisions and on the finished
  diff whenever SQL/call sites/stored shapes/queues/locks/timeouts/growth change; pair
  migration-safety and privacy-security-review for persistence/authority changes.
- Run node scripts/gate_select.mjs before calling this contribution complete, as well as
  every scoped/PG/visual/SFX check named here. Report exact commands and outcomes. A
  skipped required suite or a reviewer report alone is not a passing shared gate.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the Inn Room and Cottage interior layouts with derived colliders
- feat(render): build the freehold interiors and dressing on proximity
- feat(sim): add the Eastbrook Freehold Gate and the Hearth Key
- feat(ui): localize the gate, the key, and the freehold refusal lines
- docs(screenshots): capture the Inn Room and Cottage interiors
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Confirming the own-home gate action enters the Inn Room offline on Phase 05's default
  record with no seeding step (tests/freehold_gate_and_key.test.ts; D81) and online (the
  two-session arm through the real dispatch); the Hearth Key enters from a non-Eastbrook
  open-world zone; leaving lands at the gate (position pinned by literal).
- [ ] Left-click, right-click and the nearby-interact press on the gate open the prompt
  through the real client routing (src/game/interactions.ts and nearby_interaction.ts,
  pinned), and a proximity walk opens nothing.
- [ ] The cooldown is pinned to the state.md working value (60 minutes) and the ready stamp
  is account-scoped, with private UI mirrors only; dead, combat, and cooldown refuse with a
  freeholdDenied reason and nothing moved; one test per context asserts `instanced` for
  a rift floor, a delve and a dungeon claim and `match` for a battleground, an arena, a
  duel and a flag carrier, each with no teleport; the key is granted once and re-granted
  when absent, and a full-bags entry proceeds with no key minted (pinned); a jailed
  session's `use` of the key is refused (pinned).
- [ ] tests/freehold_layouts.test.ts proves both derivations deterministic; the plinth
  anchor counts equal the tier table; tests/renderer_compile_gate.test.ts covers both
  interiors; `PERF_SCENARIO=bench_freehold_interiors npm run perf:tour` records zero
  live-program events in the Inn Room and the Cottage samples, the Cottage granted
  through Phase 05's fixture (D81).
- [ ] render-performance-reviewer confirms all findings resolved and the fresh fix review passed (interiors ride the gated loop);
  the other reviewers likewise.
- [ ] Every deny reason in the enum maps through freeholdDeniedLineKey to an English key
  with the exact values named in the CLIENT slice (the five NEW rows, the existing
  rows for the rest); hearthKey.tooltip ships the Wave A English; the S3 guard and the
  API error parity pass; the Hearth Key has a WebP and a provenance row; the gate has a
  world-entity row, an entity_display_core arm and a `freehold-gate` marker semantic
  pinned in the three marker suites.
- [ ] The dark-realm arms in tests/server/freehold_wire.test.ts prove no gate entity and
  no Hearth Key grant with FREEHOLDS_ENABLED unset, and both with '1' (D85).
- [ ] Before/after screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and named in progress.md.
- [ ] world.ts, sim.ts, and hud.ts ceilings are LOWER or unchanged; all STEP 3 suites green.
- [ ] Gate proximity never teleports; explicit confirm does on both hosts. Prompt state,
  keyboard/focus return, 40x40 touch/safe area and first safe arrival screenshots match
  ux-spec.md; no player-facing string bypasses the housing key inventory.
- [ ] Gate/key entry reuses confirmed dungeonEntrySeq and the measured safe pose; key
  already-at-home is a no-op with no cooldown spend, and a held key grants no authority.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 06, notes, named unsigned gates, the
  screenshot paths) and docs/freeholds/state.md (the per-phase ledger row 06: new files,
  the two interiors, the gate templateId and its marker kind, the item id, the ItemUse
  type, the appended reason ids instanced and match, 07's separate durable
  account_freehold_hearth authority and its committed private display mirror (never
  persisted inside a plot), the i18n keys; the placeholder-interior note from row 05
  marked swapped).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-06-qa.md

STOPPING RULES:
- Stop and ask if the renderer cannot resolve the new interiors by data and renderer.ts
  must grow (the Eastbrook re-mint and the ceiling are both maintainer territory).
- Stop if the jailed check cannot see the Hearth Key inside the `use` payload (never
  ship a key a jailed session can use).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
