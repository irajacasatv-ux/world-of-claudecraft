# Phase 12: Strongbox and station amenities (bank access at home, the station slot, the vault arm)

Wave A, the Cottage MVP. The spec is `progress.md` "12 Strongbox and station
amenities"; the decisions are `brainstorm.md` D6 (the Strongbox is bank access at home:
no new container, no dupe surface) and D7 (the station amenity composes into the
existing gate; recipes and their `stationType` gates unchanged; training untouched),
and `state.md` D18 (the plot's station may draw from the vault through an explicit,
negative-tested arm). This phase ships `amenities.ts`: the Strongbox interactable
spawned on claim, visible to every viewer in the claim, that satisfies the banker
proximity gate for the owner only, the
`build_station` command filling the Cottage's one amenity slot with one of the six
station types composed into the crafting gate and the in-range HUD read, the D18 vault
craft gate arm, and the amenity lock below condition 30. Convenience only: nothing here
changes a combat, progression, gathering, or drop number.

### Starter Prompt
```
This is Phase 12 of the Freeholds and Guildhalls feature: Strongbox and station
amenities (bank access at home, the station amenity slot composed into the crafting
gate, the vault craft gate arm, the amenity lock rule).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices, two shared pin files).

Goal: let the owner bank and craft at home through the seams that already exist (the
ONE banker proximity gate, the parameterised station list, the ONE reagent planner,
the vault craft gate with an explicit owner-with-station arm), refused for a visitor
and below condition 30, with training still requiring the town station.

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
- Memory scan: MEMORY.md and entries on the vault craft gate (every instance band
  refuses; the arm must be explicit), guard exemptions must be POSITIVE (a "not in
  scope" predicate exempts everything), the world_api parity pins, the monolith ratchet,
  the S3 i18n guard, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "12 Strongbox and station
  amenities"), and this file
- src/sim/bank.ts (nearBanker and nearBankerTemplateId over ctx.bankerIds within
  BANKER_RANGE: the ONE proximity gate the vault and the guild bank import; the
  bankDeposit and bankWithdraw gate order; bankInfoFor and bankInfoWireRevFor, null
  away from a banker), src/sim/materials_vault.ts (every op nearBanker-gated),
  src/sim/guild_bank.ts (imports nearBanker rather than growing a second reach rule),
  src/sim/sim_context.ts (bankerIds, stationPlacements)
- src/sim/professions/stations.ts (isAtStation, isAtAnyStation, inRangeStationTypes,
  stationTypesSignature: every function takes the station LIST as a parameter),
  src/sim/professions/mobile_station.ts (partySharedStationSatisfies,
  activeMobileStationCraftsForViewer behind the mst scalar),
  src/sim/professions/crafting.ts (evaluateCraftAdmission: the three station arms and
  the station_required deny), src/sim/professions/training.ts (resolveTrain: UNTOUCHED),
  src/sim/content/professions.ts (STATIONS, STATION_RADIUS, STATION_TYPE_BY_CRAFT),
  src/sim/types.ts (StationDef with masterNpcId, StationType), src/sim/professions/CLAUDE.md
- src/sim/vault_craft_gate.ts (vaultDrawBlocked: the membership arms, the west fast
  path, the geometry backstop; the header "NEW INSTANCED CONTENT MUST BE ADDED HERE"
  and "NEVER reuse colliders.ts isInstancedRegion"), server/vault_wire.ts (the cvault
  key probes the same gate every snapshot: the arm must stay cheap),
  tests/vault_craft_gate.test.ts (the layout-independence pin), tests/craft_from_vault.test.ts
  (the one-planner-per-file pin)
- src/sim/professions/feast.ts (the kind 'object' spawn recipe: createGroundObject,
  templateId, objectItemId = null, lootable = false, respawnTimer = Infinity),
  src/sim/instances/dungeons.ts (claimInstance's object spawns pushed onto
  inst.objectIds so freeInstance tears them down; instanceAt), src/sim/freehold/
  {instance.ts,state.ts,layout_core.ts,placement.ts,types.ts} (the claim path, the
  strongbox and station anchors as named decor keys in COTTAGE_LAYOUT from Phase 06,
  the record's amenity fields, the stored condition read), src/sim/content/freehold/tiers.ts
  (amenity slots per tier: Inn Room 0, Cottage 1)
- server/bank_wire.ts (emitBankSelfKeys: the bank key follows bankInfoWireRevFor, so a
  Strongbox that satisfies the gate emits it for free), server/game.ts (the mst scalar
  site, the bank and vault case groups), server/freehold_wire.ts, src/net/online.ts
  (the mst mirror, the bank mirror), src/net/crafting_wire.ts
- src/game/nearby_interaction.ts (tryNearbyInteraction, NearbyInteractionWorld: the
  press funnel; the station proximity note), src/game/feast_interact.ts (a
  templateId-keyed proximity interact sibling), src/ui/hud.ts (openBank; the crafting
  in-range read), src/ui/hud/professions/crafting_view.ts (inRangeStationTypes
  consumer), src/ui/hud/professions/feast_title.ts and tests/entity_display_name.test.ts
  (a templateId title map pinned both ways), src/ui/world_entity_i18n.ts
- src/world_api/housing.ts, src/world_api/bank.ts, src/world_api/professions.ts
  (stationPlacements), src/world_api.ts (COMMAND_NAMES append rule)
- tests/bank.test.ts, tests/bank_wire.test.ts, tests/vault_wire.test.ts,
  tests/professions_crafting_hub.test.ts (UNCHANGED after this phase),
  tests/mobile_station_party.test.ts, tests/mobile_station_walk.test.ts,
  tests/professions_station_online.test.ts, tests/helpers/instanced_contexts.ts,
  tests/world_api_parity.test.ts, tests/monolith_budget.test.ts
- Root CLAUDE.md "Modularity" and "Invariants" (never sell power)
The agent returns: the ONE-gate composition point for the Strongbox (an arm inside
nearBanker so bank, vault, and guild bank inherit it, versus a wrapper at each caller;
pick the one that keeps a single reach rule); the two consumer sites where the owner's
station list must join ctx.stationPlacements (the craft admission and the in-range HUD
read) and why isAtAnyStation and resolveTrain must NOT see it; the exact position for
the D18 arm inside vaultDrawBlocked (after the membership arms, before the geometry
backstop, cheap enough for the per-snapshot cvault probe) and the pins it must keep
green; the spawn recipe with the roster push; the press funnel shape; the extraction
candidates in sim.ts, game.ts, and online.ts.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last:
tests/world_api_parity.test.ts for buildStation and myAmenities, tests/command_schema.test.ts
and tests/command_facets.test.ts for build_station, tests/snapshots.test.ts if the
fhold shape grows, tests/monolith_budget.test.ts):
- Agent STRONGBOX: src/sim/freehold/amenities.ts (spawnFreeholdAmenities(ctx, inst,
  record) on every claim: the Strongbox kind 'object' entity at the layout's strongbox
  anchor on the feast spawn recipe, pushed onto inst.objectIds, VISIBLE to every viewer
  in the claim like any snapshot entity (only the bank gate below is owner-only); the amenity lock
  predicate amenitiesLocked(record) reading the stored condition, below 30 locked;
  freeholdStrongboxSatisfies(ctx, e): the viewer stands inside a claim keyed by their
  OWN owner key, within BANKER_RANGE of that claim's Strongbox, and amenities are not
  locked), the arm inside nearBanker (ONE gate: `nearBanker(ctx, e) ||
  freeholdStrongboxSatisfies(ctx, e)` folded into bank.ts so bank, vault, guild bank,
  and the bank self key inherit it), the deeds NPC ledger left alone
  (nearBankerTemplateId stays banker-only), myAmenities on the facet plus the amenity
  rows on the freeholdState descriptor, the world-entity name row, src/game/strongbox_interact.ts
  (the press funnel on the feast_interact model opening the real bank window through
  the existing openBank), tests/freehold_strongbox.test.ts (deposit and withdraw succeed
  for the owner at the Strongbox; a visitor in the same plot is refused; the owner
  outside range is refused; below 30 refused with locked; the bank self key emits at
  the Strongbox; a visitor sees the Strongbox entity in their snapshot while the gate
  refuses them; freeInstance removes the entity; respawnTimer stays Infinity across the
  respawn sweep).
- Agent STATION: the build_station command (buildStation(type) on the facet; the wire
  token appended to COMMAND_NAMES and tagged in COMMAND_FACETS; the body in amenities.ts:
  owner-only, one of the six StationTypes, the Cottage's one slot, refuses 'no_slot',
  'bad_station', and 'locked' below 30, records the choice as a `station` field INSIDE
  the layout JSONB (one of the six StationType strings, or absent) with a normalize
  allowlist arm appended to normalizeFreehold in src/sim/freehold/state.ts (an unknown
  value drops the field, never the layout; pinned in tests/freehold_state.test.ts), emits
  freeholdGranted { kind: 'station' } (the variant Phase 08 declared) and re-emits the
  descriptor), the station prop
  entity at the layout's station anchor on claim, freeholdStationsFor(ctx, pid) returning
  a StationDef-shaped anchor for the OWNER while their claim is up (masterNpcId absent
  or a distinct FreeholdStationDef so it satisfies the crafting arm only), composed into
  the station list at exactly two consumer sites: evaluateCraftAdmission and the
  in-range read behind mst and inRangeStationTypes (isAtAnyStation and resolveTrain
  never see it), the dispatch line in server/freehold_wire.ts, the ClientWorld one-liner
  and decode, tests/freehold_station.test.ts (crafting a recipe with a stationType at
  the home station succeeds for the owner and draws bags-then-vault through the ONE
  planner; a visitor is refused station_required; below 30 refused; a second
  build_station refuses no_slot; training at home is refused; the Maker's Bond unbind is
  not satisfied at home; tests/professions_crafting_hub.test.ts byte-unchanged).
- Agent VAULT-GATE: the D18 arm in src/sim/vault_craft_gate.ts (vaultDrawBlocked
  returns false when the player stands inside a claim whose key equals
  meta.freeholdOwnerKey AND the record has a built station AND amenities are not
  locked; placed after the membership arms and before the geometry backstop; a
  visitor's plot, an owner without a station, and a locked house all stay refused; the
  header's "NEW INSTANCED CONTENT" list gains the freehold row), tests/vault_craft_gate.test.ts
  arms (owner with station allowed; visitor refused; owner without station refused;
  below 30 refused; the layout-independence pin unchanged; the per-snapshot cost stays
  one claim lookup), tests/vault_wire.test.ts arm (cvault opens at the home station for
  the owner), tests/craft_from_vault.test.ts one-planner pin unchanged.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Never sell power: the Strongbox and the station change no combat, progression,
  gathering, or drop number; recipes and their stationType gates are unchanged;
  training still requires the town station; the Maker's Bond unbind never satisfies at
  home.
- ONE gate, ONE planner: banker proximity stays a single reach rule (nearBanker);
  reagent sourcing stays planReagentSourceDraw; the vault arm is explicit in
  vault_craft_gate.ts and negative-tested for a visitor's plot (D18); isInstancedRegion
  is never the vault predicate.
- The amenity lock: below condition 30 both amenities refuse with 'locked' (the
  Steward explains in Phase 16); the door still opens; nothing is destroyed.
- Determinism: the spawn draws no Rng; entity ids come from ctx.nextId in claim order;
  respawnTimer = Infinity on every interactable (or the respawn sweep re-arms it).
- Server authority; D4 (only the two interactables are entities; the layout stays a
  descriptor); D10 text-free events (new reason ids append-only; the build grant rides
  the Phase 08 freeholdGranted { kind } variant with kind 'station', never a new kind).
- Token firewall as state.md scopes it: no on-chain vocabulary in src/sim/ (wallet,
  token, $WOC, mint, holder, marketplace, on-chain, Solana, the on-chain Freehold Charter
  deed); the Book of Deeds is game content and not firewall vocabulary. The flag still
  refuses build_station at dispatch while dark.
- i18n: the policy in docs/freeholds/implementation-plan.md; the entity names are
  world-entity keys; any HUD line is a hudChrome.housing.* key.
- Monolith ratchet: src/sim/sim.ts, server/game.ts, and src/net/online.ts sit at ZERO
  slack; every delegate, case label, or mirror line is paid for by an extraction, then
  LOWER the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The Steward panel and the "locked" explanation copy (Phase 16); condition derivation
  (Phase 13: this phase reads the stored condition; Phase 13 swaps the read for
  conditionAt behind the same predicate).
- The Strongbox as a NEW container (D6: it is bank access; no strongbox inventory, no
  new self key beyond the existing bank key).
- The guild bank chest and hall-shared stations (Phase 30), the Materials Vault chest
  (Phase 32), the dye station (Phase 41), any Claudium or store surface, station props'
  real art (Phase 19: stand-ins through the Phase 09 registry).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_strongbox.test.ts
  tests/freehold_station.test.ts tests/vault_craft_gate.test.ts tests/craft_from_vault.test.ts
  tests/professions_crafting_hub.test.ts tests/mobile_station_party.test.ts
  tests/mobile_station_walk.test.ts tests/professions_station_online.test.ts
  tests/bank.test.ts tests/bank_wire.test.ts tests/vault_wire.test.ts
  tests/freehold_state.test.ts tests/entity_display_name.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/freehold_command_chain_online.test.ts tests/freehold_determinism.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/localization_fixes.test.ts tests/env_protocol.test.ts`; regenerate the parity
  goldens with UPDATE_PARITY=1 in their own commit if the amenity spawn changed a sampled
  field or emit on a driven scenario.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the gate compositions, the vault arm, claim-order ids, the
  sim.ts extraction), cross-platform-sync (the facet, the command, the descriptor rows,
  the mst read on both hosts), privacy-security-review (server/ and src/net/ touched;
  the vault arm is an anti-cheat surface), and migration-safety (the `station` field
  inside the persisted layout JSONB and its normalize arm). Prompt each for COVERAGE not
  filtering; each writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): spawn the Strongbox on claim and let the owner bank at home through the one proximity gate
- feat(sim): add the station amenity slot composed into the crafting gate for the owner
- feat(sim): allow vault draws at the owner's built home station
- feat(net): wire build_station and the amenity rows on both hosts
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Bank deposit and withdraw succeed for the owner at the Strongbox and are refused
  for a visitor, out of range, and below condition 30 (pinned per arm); the bank self
  key emits at the Strongbox (tests/bank_wire.test.ts arm).
- [ ] A recipe with a stationType crafts at the home station for the owner, drawing
  bags then vault through planReagentSourceDraw; a visitor is refused; below 30 refused;
  training at home refused; tests/professions_crafting_hub.test.ts is byte-unchanged.
- [ ] vaultDrawBlocked has the explicit owner-with-station arm with the four negative
  cases (visitor, no station, locked, the layout-independence pin) green.
- [ ] build_station is on COMMAND_NAMES, tagged, dispatched, refused while dark, and in
  the chain test; buildStation and myAmenities are on both prototypes with the parity
  pin updated.
- [ ] The Strongbox and station entities ride inst.objectIds, keep respawnTimer
  Infinity, are visible to every viewer in the claim, and vanish on freeInstance
  (pinned).
- [ ] The built station persists as the `station` field inside the layout JSONB; an
  unknown value drops the field and keeps the layout (pinned in
  tests/freehold_state.test.ts); build_station emits freeholdGranted { kind: 'station' }.
- [ ] All STEP 3 suites green; the four reviewers report no BLOCKING; sim.ts, game.ts,
  and online.ts ceilings are LOWER than before.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 12, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 12: new files, the two facet
  members, the build_station command and its reason ids, the entity template ids, the
  vault arm; mark D18 implemented).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-12-qa.md

STOPPING RULES:
- Stop and ask if the Strongbox cannot satisfy the bank gate without a second reach
  rule, or if the station cannot join the list without touching a recipe or
  resolveTrain.
- Stop and ask if the vault arm cannot stay a single claim lookup (the cvault probe
  runs every snapshot).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
