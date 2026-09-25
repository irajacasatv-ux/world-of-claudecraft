# Phase 12: Strongbox and station amenities (bank access at home, the station slot, the vault arm)

Wave A, the Cottage MVP. The spec is `progress.md` "12 Strongbox and station
amenities"; the decisions are `state.md` D6 (the Strongbox is bank access at home:
no new container, no dupe surface), D7 (the station amenity composes into the
existing gate; recipes and their `stationType` gates unchanged; training untouched)
and D18 (the plot's station may draw from the vault through an explicit,
negative-tested arm). This phase ships NEW `src/sim/freehold/amenities.ts` (the
Strongbox and station amenity core behind the SimContext seam): the Strongbox interactable
spawned on claim, visible to every viewer in the claim, that grants personal-bank access through service-specific authorization for the owner only, the
`build_station` command filling the Cottage's one amenity slot with one of the six
station types composed into the crafting gate and the in-range HUD read, the D18 vault
craft gate arm, and the amenity lock below condition 30. Convenience only: nothing here
changes a combat, progression, gathering, or drop number.

### Starter Prompt
```
This is Phase 12 of the Freeholds and Guildhalls feature: Strongbox and station
amenities (bank access at home, the station amenity slot composed into the crafting
gate, the vault craft gate arm, the amenity lock rule).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices, two shared pin files).

Goal: let the owner bank and craft at home through the seams that already exist (the
shared banker geometry and explicit personal-bank authorization, the parameterised station list, the ONE reagent planner,
the vault craft gate with an explicit owner-with-station arm), refused for a visitor
and below condition 30, with training still requiring the town station.

Asset execution: every step that creates or regenerates shipping GLBs, reference
artwork, icons or images MUST be done by Codex, not Claude. Use
.agents/skills/woc-image-to-glb/SKILL.md and its shared canonical workflow for GLBs;
use Codex image generation for raster artwork. Capture actual rendered screenshots
as evidence. Ship final assets with provenance, credits, manifest and in-context proof.
phase-44a-final-codex-artwork.md audits/replaces residual feature-created placeholder
icons/images and produces final-artwork-audit.md before phase-44b-final-legal-handoff.md.
That final sweep does not postpone artwork owned here. 44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

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
- Memory scan: MEMORY.md and entries on the vault craft gate (every instance band
  refuses; the arm must be explicit), guard exemptions must be POSITIVE (a "not in
  scope" predicate exempts everything), the world_api parity pins, the monolith ratchet,
  the S3 i18n guard, test-pin traps.

- Invoke database-performance-reviewer before storage/query/lock/cadence decisions;
  send the scoped diff surface and approved artifacts, then review the finished diff.

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
The agent returns: the shared reach predicate and separate bank/vault/guild service
authorization consumers; the Strongbox arm grants only personal bank access, with
negative pins against vault/guild capability inheritance; the two consumer sites where the owner's
station list must join ctx.stationPlacements (the craft admission and the in-range HUD
read) and why isAtAnyStation and resolveTrain must NOT see it; the exact position for
the D18 arm inside vaultDrawBlocked (after the membership arms, before the geometry
backstop, cheap enough for the per-snapshot cvault probe) and the pins it must keep
green; the spawn recipe with the roster push; the press funnel shape; the extraction
candidates in sim.ts, game.ts, and online.ts.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

Deliverables (at most five):
1. Built-in Strongbox access. NEW src/sim/freehold/amenities.ts (the Strongbox and
   station amenity core behind the SimContext seam, the module 30's registry when-list
   cites) spawns the claim-scoped visible object
   at the authored anchor, tracks it in inst.objectIds and keeps respawnTimer Infinity.
   freeholdStrongboxSatisfies checks owner, current claim, BANKER_RANGE and condition.
   Strongbox is personal-bank access with no extra capacity and no amenity-slot cost.
   Separate service authorization from shared geometry: do not broaden nearBanker so
   materials_vault.ts or guild_bank.ts inherit this right. All eight nearBanker-gated
   personal-bank operations consume the capability-specific home-bank arm, each with
   its own arm in tests/freehold_strongbox.test.ts: bankInfoFor, bankInfoWireRevFor,
   bankDeposit, bankWithdraw and bankBuySlots (src/sim/bank.ts) and bankUnlockSocket,
   bankSocketBag and bankUnsocketBag (src/sim/bank_sockets.ts); the Strongbox is the
   whole bank at home (D6), so no op answers the town refusal there and no new refusal
   key is needed. Town banker behavior and nearBankerTemplateId remain unchanged. A
   visitor can see the prop but cannot open or mutate personal banking.
2. Station slot and crafting projection. build_station fills the Cottage's one
   amenity slot from the six allowed StationTypes and is owner-only. The persisted
   station field has a positive normalizer allowlist. freeholdStationsFor composes
   into evaluateCraftAdmission and the HUD in-range read only. The existing town
   station list, isAtAnyStation, resolveTrain and Maker's Bond unbind never inherit
   home permissions. The Strongbox and one station coexist. Entry and building still
   work at zero condition; only the amenity service is paused below 30, available at 30.
3. Explicit personal vault crafting arm. vaultDrawBlocked checks owned current claim,
   built valid station and available amenity after membership arms and before geometry
   fallback; the cvault projection uses the same cheap read. Material consumption
   retains one planReagentSourceDraw. Home crafting can draw the owner's personal
   vault without opening direct Materials Vault management. Direct vault chest access
   is the later Manor amenity; guild bank access requires the later guild chest plus
   membership, never a Strongbox. Phase 30 extends station access to permitted guild
   members drawing their own vault, without sharing private vault data.
4. Thin interaction and wire integration. strongbox_interact.ts uses the shared press
   funnel and real bank window: the Strongbox opener opens the shared bank window with
   the personal pane (and the Vault tab where the gate admits it) and no Guild tab;
   30's guild chest opener composes the inverse (Guild tab only).
   buildStation/myAmenities, build_station, text-free
   grants/denials, descriptor amenity rows and mst projection traverse IWorld, both
   worlds, command tags, server dispatch and strict decoder together. Claim teardown
   removes both objects. Denied/paused hints use hudChrome.housing.* through the one
   selector and existing window/focus family in ux-spec.md. This phase owns the
   hudChrome.housing.interior.* rows it appends to 09's base (exact English; ux-spec
   carries them with 12 as owner): interior.strongbox = "Strongbox";
   interior.strongboxTooltip = "Open your personal bank here. This does not add storage
   space."; interior.stationTooltip = "Use this home's {station}. Recipes keep their
   normal skill and training requirements."; interior.strongboxVisitorTooltip = "This
   Strongbox opens the owner's personal bank. Guests cannot use it.";
   interior.strongboxPausedTooltip = "This Strongbox is paused by the home's condition.
   The owner can restore condition to use it."; interior.stationVisitorTooltip = "This
   station is for the home's authorized users."; interior.stationPausedTooltip = "This
   station is paused by the home's condition. The owner can restore condition to use
   it.". This phase regenerates ux-key-manifest.json (its seven interior.* rows, owner
   12) in its own change with every cited count updated (D92); it adds no
   ux-shot-manifest.json variant.
   Interior tooltips branch on the actual service authorization/condition model:
   owner-ready, visitor read-only and condition-paused are distinct keys. A mere
   hearth asset or inaccessible owner service does not imply condition lockout.
   Low condition alone cannot prevent entry/decoration; independent admission rules
   still apply. Only form controls input/select/textarea have the coarse 16px floor.
   Station persistence distinguishes absent/default, malformed known-schema and valid
   unsupported future identifiers. Preserve a future owned station's original record
   read-only under 07's capability/recovery contract; do not drop it, construct an empty
   station or grant a second station. Pin original value/ownership through load/save,
   denied mutation and recovery, separately from absent and known malformed fixtures.
5. Boundary proof. Pin owner/visitor/out-of-range/condition 29/30 for banking and
   crafting; assert personal bank allowed while direct vault and guild bank stay
   denied at Strongbox. Pin simultaneous Strongbox+station, second station refusal,
   no town training/unbind bypass, cvault owner-only data and zero new per-tick SQL
   (pinned by a fake-pool query counter in NEW
   tests/server/freehold_amenities_online.test.ts, owned here, which drives GameServer
   with a spied pg pool the way tests/server/title_reads.test.ts does, over a driven
   tick and snapshot window with the Strongbox and station built and the cvault probe
   live, asserting zero queries attributed to amenity reads; plus
   tests/architecture.test.ts proving src/sim/freehold/ imports nothing from server/).
   Rerun bank/vault/guild authorization and station online suites, command/wire parity,
   persistence normalization and object teardown. Invoke database-performance-reviewer
   before storage/caller decisions and on finished diff, alongside architecture,
   cross-platform, privacy, migration and frontend reviewers for these surfaces.

INVARIANTS THIS PHASE MUST KEEP:
- Never sell power: the Strongbox and the station change no combat, progression,
  gathering, or drop number; recipes and their stationType gates are unchanged;
  training still requires the town station; the Maker's Bond unbind never satisfies at
  home.
- Shared geometry, explicit service permission, ONE planner: nearBanker retains town
  reach behavior; the Strongbox personal-bank capability never leaks direct vault/guild access;
  reagent sourcing stays planReagentSourceDraw; the vault arm is explicit in
  vault_craft_gate.ts and negative-tested for a visitor's plot (D18); isInstancedRegion
  is never the vault predicate.
- The amenity lock: below condition 30 both amenities refuse with 'locked' (rendered
  through 06's one freeholdDeniedLineKey selector as the existing
  hudChrome.housing.denied.condition row, no second selector and no new key; the
  Steward explains in Phase 16); the door still opens; nothing is destroyed.
- Determinism: the spawn draws no Rng; entity ids come from ctx.nextId in claim order;
  respawnTimer = Infinity on every interactable (or the respawn sweep re-arms it).
- Server authority; D4 (only the two interactables are entities; the layout stays a
  descriptor); D10 text-free events (new reason ids append-only; the build grant rides
  the Phase 08 freeholdGranted { kind } variant with kind 'station', never a new kind).
- Token firewall as state.md scopes it: no on-chain vocabulary in src/sim/ (wallet,
  token, $WOC, mint, holder, marketplace, on-chain, Solana, the on-chain Freehold Charter
  deed); the Book of Deeds is game content and not firewall vocabulary. The flag still
  refuses build_station at dispatch while dark; per D85 the sim's freeholdsEnabled boot
  config (beside devCommands on the SimConfig seam) spawns no gate on a dark realm, so
  no claim and therefore no Strongbox or station exists there, while the offline host
  stays live under D3.
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
  (Phase 32), the dye picker (Phase 41: per D90 it is enabled by this phase's station
  amenity when built as apothecary, with no new amenity kind, extra slot or station
  GLB), any Claudium or store surface, station props' real art (Phase 19: stand-ins
  through the Phase 09 registry).

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_strongbox.test.ts
  tests/freehold_station.test.ts tests/vault_craft_gate.test.ts tests/craft_from_vault.test.ts
  tests/professions_crafting_hub.test.ts tests/mobile_station_party.test.ts
  tests/mobile_station_walk.test.ts tests/professions_station_online.test.ts
  tests/bank.test.ts tests/bank_wire.test.ts tests/vault_wire.test.ts
  tests/freehold_state.test.ts tests/entity_display_name.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/freehold_command_chain_online.test.ts tests/freehold_determinism.test.ts
  tests/server/freehold_amenities_online.test.ts tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/localization_fixes.test.ts tests/env_protocol.test.ts`; regenerate the parity
  goldens with UPDATE_PARITY=1 in their own commit if the amenity spawn changed a sampled
  field or emit on a driven scenario.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md,
  the full roster above: architecture-reviewer (the gate compositions, the vault arm,
  claim-order ids, the sim.ts extraction), cross-platform-sync (the facet, the command,
  the descriptor rows, the mst read on both hosts), privacy-security-review (server/ and
  src/net/ touched; the vault arm is an anti-cheat surface), database-performance-reviewer
  (before storage decisions and on the finished diff: the amenity reads and the cvault
  probe), migration-safety (the `station` field inside the persisted layout JSONB and
  its normalize arm), server-hot-path-reviewer (the per-snapshot cvault probe and the
  mst scalar), frontend-seam-reviewer (strongbox_interact.ts and the HUD in-range
  read), test-coverage-auditor (every pin above) and qa-checklist (the whole diff).
  Prompt each for COVERAGE not filtering; each writes its report to a file. Do not
  commit until ALL findings, including nits, are resolved and the fixes have fresh
  review.

- Required reviewers for the complete settled diff: architecture-reviewer,
  cross-platform-sync, privacy-security-review, migration-safety, frontend-seam-reviewer,
  server-hot-path-reviewer, database-performance-reviewer, test-coverage-auditor and
  qa-checklist (the same nine as the required list above).
  Database performance reviews happen before implementation decisions and again on
  the finished diff; persistence/security pair on stored/authority surfaces. Runtime
  PG evidence, bounded workload/query/index/byte limits and cancellation are required.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): spawn the Strongbox on claim and let the owner bank at home through the one proximity gate
- feat(sim): add the station amenity slot composed into the crafting gate for the owner
- feat(sim): allow vault draws at the owner's built home station
- feat(net): wire build_station and the amenity rows on both hosts
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] Each of the eight personal-bank operations named in deliverable 1 succeeds for the
  owner at the Strongbox and is refused for a visitor, out of range, and below condition
  30 (one arm per operation in tests/freehold_strongbox.test.ts); the bank self key
  emits at the Strongbox (tests/bank_wire.test.ts arm); the spied-pool query counter
  in tests/server/freehold_amenities_online.test.ts reads zero across the driven
  GameServer tick and snapshot window.
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
  unsupported but structurally valid future station ID preserves the exact original
  record/read-only recovery state; it is never dropped or treated as absent. A genuinely
  absent station remains absent. Malformed known-schema repair follows 07's explicit
  validation policy with original preservation/diagnostics, separately tested from the
  future-ID arm in tests/freehold_state.test.ts. build_station emits
  freeholdGranted { kind: 'station' } only after accepted mutation.
- [ ] ux-key-manifest.json is regenerated in this phase's diff with the seven owner-12
  interior.* rows and every cited count updated (D92).
- [ ] All STEP 3 suites green; all triggered reviewers confirm ALL findings, including nits, are resolved and freshly reviewed; sim.ts, game.ts,
  and online.ts ceilings are LOWER than before.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 12, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 12: new files including
  src/sim/freehold/amenities.ts, the seven interior.* keys and the regenerated
  manifest, the two facet members, the build_station command and its reason ids, the
  entity template ids, the vault arm; mark D18 implemented).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, external release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-12-qa.md

STOPPING RULES:
- Stop if the Strongbox would broaden vault/guild authorization or the station would
  alter a recipe, training or unbind rule. Preserve shared geometry behind explicit
  service capabilities; this locked decision is not deferred to the implementer.
- Stop and ask if the vault arm cannot stay a single claim lookup (the cvault probe
  runs every snapshot).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
