# Phase 06: the interiors, the Eastbrook Freehold Gate, the Hearth Key

Wave A, the Cottage MVP. The spec is `progress.md` "06 Interiors, the Eastbrook gate, the
Hearth Key"; the decisions are `state.md` (the `interior` union members, `DungeonLayout`
records with lift functions, `STATIC_INTERIOR_COLLIDERS`, the Hearth Key cooldown working
value, `JAILED_BLOCKED_COMMANDS`, D23 and D26) and `brainstorm.md` D4 and D13 (stand-ins
before art).
This phase replaces Phase 05's placeholder interiors with the real Inn Room and Cottage
shells, gives the player two ways in (walking into the quay gate, using the Hearth Key), and
is the first player-reachable housing surface, so it is a CLIENT phase with screenshots.

### Starter Prompt
```
This is Phase 06 of the Freeholds and Guildhalls feature: the interiors (Inn Room and
Cottage layouts with derived colliders and render variants), the Eastbrook Freehold Gate,
and the Hearth Key.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices; the render slice is one dressing module).

Goal: author the two interiors as data the sim and the renderer both read (walls, doors,
static decor with measured radii, plinth and hearth anchors), build them on proximity
through the existing gated loop, spawn one tier-routed gate on the Eastbrook quay that
enters on walk-in, grant every character of the owning account a Hearth Key that walks
them home from any zone on a pinned cooldown, and surface the text-free refusals as
localized toasts.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
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
  Eastbrook zone content and its quay ground objects (grep the Eastbrook zone file under
  src/sim/content/ and its groundObjects rows), src/sim/items.ts (useItem, the ItemUse arm
  chain, the placeMobileStation arm), src/sim/professions/mobile_station.ts
  (placeMobileStationFromItem: holding is the credential, using consumes nothing),
  src/sim/content/profession_items.ts (the Master's Field Forge item def), src/sim/data.ts
  (mergeItems, where the new src/sim/content/freehold/items.ts table joins ITEMS),
  src/sim/sim.ts (the per-player tick site that calls updateDoorTriggers)
- src/render/dungeon.ts (DungeonInteriorVariant, buildInterior and how it resolves a
  layout and variant from the interior string, ensureDungeonAssets, buildPrewarmGroup),
  src/render/dawnhold_dressing.ts (buildDawnholdDressing, ensureDawnholdDressing),
  src/render/renderer.ts (the dungeon proximity loop and builtInteriors,
  retireInteriorGroup), src/render/gated_scene_attach.ts, src/render/CLAUDE.md ("GPU work"
  and RENDER_PURE_CORES), src/render/characters/CLAUDE.md (the subsystem template)
- server/game.ts (JAILED_BLOCKED_COMMANDS and the use_item dispatch), server/freehold_wire.ts,
  the use_item payload shape (grep `use_item` in server/game.ts and src/net/online.ts)
- src/ui/world_entity_i18n.ts, src/ui/hud/professions/feast_title.ts (the hand-listed
  templateId map), tests/entity_display_name.test.ts, src/ui/hud/professions/farming_view.ts
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
the walk-in trigger call site plus the sim.ts extraction that pays for a per-player call;
the ItemUse arm recipe; the use_item payload field a jailed check can read; the deny-toast
wiring recipe and its hud.ts cost; the screenshot target recipe (desktop, compact, tablet).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
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
  object with templateId `freehold_gate` spawned at the quay from the Eastbrook content
  row, lootable false, respawnTimer Infinity; a walk-in trigger on the DOOR_TRIGGER_RADIUS
  rule calling enterFreehold for the walker, tier-routed through freeholdDefForTier, added
  at the same per-player tick site as updateDoorTriggers and paid for by a sim.ts
  extraction; leaveFreehold lands at the gate), the `hearth_key` tool item DEF in
  src/sim/content/freehold/items.ts (soulbound, no market listing, sellValue 0, merged by
  src/sim/data.ts, every content obligation applies), and its use arm and cooldown logic
  in src/sim/freehold/hearth_key.ts (D23): an ItemUse arm `{ type: 'freeholdEnter' }`
  that enters from any zone, consumes nothing, refuses in combat and while dead through
  freeholdDenied, and refuses `cooldown` against `hearth_key_ready_ms`, an absolute ready
  stamp on the live record in the host clock base, the cooldown being the state.md working
  value (60 minutes, TUNING, the classic-era hearthstone reference; Fernando owns the
  final) pinned by test; granted to each character of the owning account on its first gate
  entry and re-granted when absent, since holding it is the credential); the server side:
  a payload-aware jailed check in server/freehold_wire.ts for use_item carrying the Hearth
  Key beside JAILED_BLOCKED_COMMANDS (pinned); tests/freehold_gate_and_key.test.ts.
- Agent RENDER: `'inn_room' | 'cottage'` DungeonInteriorVariant members on the dawnhold
  grammar in src/render/dungeon.ts, the layout and variant resolution for the two interior
  strings, src/render/freehold/{index.ts,CLAUDE.md,interior_dressing.ts} (static dressing
  only: the bed, the cold hearth, the plinth bases as stand-ins; no lights, Phase 09 owns
  the rig) on the dawnhold_dressing.ts shape, built on proximity through the existing
  gated loop with every material in a prewarm home; a renderer.ts edit only if the loop
  cannot resolve the new interiors by data (then the Eastbrook re-mint memory applies);
  the tests/renderer_compile_gate.test.ts arm for the two interiors; an offline
  `npm run perf:tour` through both with zero live-program events.
- Agent CLIENT: `hudChrome.housing.denied.*` English keys (one per reason, no "earn"
  language), the gate's templateId row in src/ui/world_entity_i18n.ts and the Hearth Key
  name in the item-names catalog, src/ui/hud/housing/housing_view.ts with
  `freeholdDeniedLineKey(reason)` (UI_PURE_CORES; D26: the ONE deny-line selector over
  hudChrome.housing.denied.*, later phases append rows to it and never add a second
  selector) and src/ui/hud/housing/
  freehold_event_feedback.ts (the handleFarmEvent shape) wired at the HUD event switch
  without growing hud.ts (or paid for and lowered), the Hearth Key WebP with provenance,
  tests/housing_view.test.ts, and the scripts/pr_shot_targets.mjs entries plus the
  before/after captures (desktop, compact, tablet) through the pr-screenshots skill
  committed under docs/screenshots/.
The coordinator runs last: tests/entity_display_name.test.ts re-pin, tests/item_icons.test.ts,
`npm run wiki:content`, and the monolith ceilings.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: layouts are data, colliders derive identically on every host, the key
  draws no Rng; the cooldown reads ctx.lockoutNowMs() through the facet's clock-base
  contract, never a second clock.
- One sim, three hosts: the gate trigger and the key arm run unchanged offline and
  online; the RL env still excludes housing.
- Server authority: the walk-in and the key resolve in the sim; the client sends use_item
  and mirrors; a jailed session can reach neither path.
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
- Persistence of the record (Phase 07 adds the account_freeholds row with the
  hearth_key_ready_ms column and its normalize arm; this phase only writes the live field).
- Furnishing placement, the descriptor, colliders for placed furnishings (Phase 08 to 10);
  the light rig and the furnishing view (Phase 09); the Strongbox and station props on
  their anchors (Phase 12); visiting through the gate (Phase 18); GLB art (Phase 19); the
  Fenbridge gate and the "gate used" memory (Phase 25).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_layouts.test.ts
  tests/freehold_gate_and_key.test.ts tests/housing_view.test.ts
  tests/freehold_instance.test.ts tests/dungeons.test.ts tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/renderer_compile_gate.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/entity_display_name.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts
  tests/mobile_station_party.test.ts tests/server/freehold_wire.test.ts
  tests/command_schema.test.ts tests/env_protocol.test.ts`; `npm run i18n:gen` then
  `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`;
  `npm run wiki:content` then `npx vitest run tests/guide.test.ts`; `npm run perf:tour`
  through both interiors; `node scripts/pr_screenshots.mjs` for the captures.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the trigger site, the key arm, the world.ts and sim.ts
  extractions), render-performance-reviewer (the dressing as a scheduler client, the
  prewarm home, the perf tour), content-obligations-reviewer (the Hearth Key and gate
  obligations), frontend-seam-reviewer (housing_view.ts, the feedback module, the catalog
  keys, and the render dressing as presentation); the dispatch table adds
  cross-platform-sync (the enter paths on both hosts) and privacy-security-review (the
  jailed use_item check in server/). Prompt each
  for COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

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
- [ ] Walking into the gate enters the Inn Room offline (tests/freehold_gate_and_key.test.ts)
  and online (the two-session arm through the real dispatch); the Hearth Key enters from
  a non-Eastbrook zone; leaving lands at the gate (position pinned by literal).
- [ ] The cooldown is pinned to the state.md working value (60 minutes) and the ready stamp
  is the record's hearth_key_ready_ms field; dead, combat, and cooldown each refuse with a
  freeholdDenied reason and nothing moved; the key is granted once and re-granted when
  absent; a jailed session's use_item on the key is refused (pinned).
- [ ] tests/freehold_layouts.test.ts proves both derivations deterministic; the plinth
  anchor counts equal the tier table; tests/renderer_compile_gate.test.ts covers both
  interiors; `npm run perf:tour` shows zero live-program events through them.
- [ ] render-performance-reviewer reports no BLOCKING (interiors ride the gated loop);
  the other reviewers likewise.
- [ ] Every deny reason has an English key; the S3 guard and the API error parity pass;
  the Hearth Key has a WebP and a provenance row; the gate has a world-entity row.
- [ ] Before/after screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and named in progress.md.
- [ ] world.ts, sim.ts, and hud.ts ceilings are LOWER or unchanged; all STEP 3 suites green.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 06, notes, deferrals, the screenshot
  paths) and docs/freeholds/state.md (the per-phase ledger row 06: new files, the two
  interiors, the gate templateId, the item id, the ItemUse type, the hearth_key_ready_ms
  field Phase 07 must persist, the i18n keys; the placeholder-interior note from row 05
  marked swapped).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-06-qa.md

STOPPING RULES:
- Stop and ask if the renderer cannot resolve the new interiors by data and renderer.ts
  must grow (the Eastbrook re-mint and the ceiling are both maintainer territory).
- Stop if the jailed check cannot see the Hearth Key inside the use_item payload (never
  ship a key a jailed session can use).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
