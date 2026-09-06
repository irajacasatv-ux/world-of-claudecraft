# Phase 08: layout core and placement commands (the pure leaf, the four commands, the descriptor)

Wave A, the Cottage MVP. The spec is `progress.md` "08 Layout core and placement
commands"; the decisions are `state.md` D16 (the live record) and D17 (walk-through
furnishings until Phase 10) and `brainstorm.md` D4 (furnishings are a descriptor, never
entities) and D10 (text-free events). This phase ships `layout_core.ts` (a pure placement
leaf both hosts and the client preview share), the `place_furnishing`,
`move_furnishing`, `remove_furnishing`, and `undo_placement` command bodies, the
pid-scoped `freeholdState` descriptor event re-sent on resume, the `fhold` self key with
strict decodes, and the payload-field chain test. After it, a furnishing can be placed,
moved, removed, and undone offline and online, with nothing drawn yet.

### Starter Prompt
```
This is Phase 08 of the Freeholds and Guildhalls feature: layout core and placement
commands (the pure placement leaf, the four placement commands, the freeholdState
descriptor and the fhold self key, the chain test).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices over disjoint files).

Goal: make the layout a validated, deterministic descriptor on both hosts: a pure core
decides every placement with text-free reason ids, the four commands mutate the live
record only on success and consume exactly one item copy, and the descriptor plus the
owner's account state cross the wire through the existing event and self-key channels
with strict client decodes.

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
- Memory scan: MEMORY.md and entries on the offline IWorld live-array aliasing (predict
  BEFORE the send), the ALL_DELTA_KEYS exact count, parity golden regeneration, the
  monolith ratchet, the S3 i18n guard, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "08 Layout core and placement
  commands"), and this file
- src/sim/freehold/{types.ts,state.ts,instance.ts,index.ts,CLAUDE.md} as Phases 01 to 07
  left them (FreeholdState, ctx.freeholds, the owner key stamp, the claim path);
  src/sim/content/freehold/{furnishings.ts,tiers.ts,dungeons.ts} (the r, decor cost, and
  plinth flags per def; the decor budget and plinth count per tier); INN_ROOM_LAYOUT and
  COTTAGE_LAYOUT in src/sim/content/freehold/layouts.ts (D23: layouts are content;
  src/sim/dungeon_layout.ts keeps only the helpers and the Dawnhold exemplar) with their
  AuthoredRoom bounds and the plinth anchors as named decor keys
- src/sim/rift/authored.ts (AuthoredRoom, AuthoredDoor, AuthoredDecor, roomAt, inAnyRoom),
  src/sim/geometry2d.ts, src/editor/placement_transform_core.ts (rotateStep, wrapAngle,
  ROTATE_STEP_RAD: COPY the two angle helpers into the leaf; src/sim may never import
  src/editor)
- src/sim/item_copy_ref.ts (selectedInventorySlot, consumeSelectedInventorySlot: the
  tri-state), src/sim/item_lock.ts (countUnlockedInSlots, removeUnlockedFromSlots),
  src/sim/bags.ts (addStacked, countFit, bagsFullError, UNSTACKED_KINDS),
  src/sim/professions/feast.ts (placeFeastAction: the gate order, the copy selection,
  the 'locked' twin deny, no refusal path mutates), src/sim/professions/pattern_items.ts
  (resolvePatternLearn: a pure resolver with a load-bearing deny ORDER)
- src/sim/types.ts (the SimEvent union: farmDenied as the text-free reason model, the
  riftState variant as the descriptor model; append-only), src/sim/rift/runs.ts
  (riftStateEventFor), server/game.ts (the resume re-send site: grep riftStateEventFor;
  the farming case group calling dispatchFarmingCommand; selfWireJson and its maybe,
  maybeRaw, maybeSerialized closures; HEAVY_SELF_REFRESH_TICKS), server/farming_commands.ts
  (dispatchFarmingCommand, appendFarmPlotsWire), server/bank_wire.ts (emitBankSelfKeys:
  the (pid, rev) signature gate), server/heavy_self.ts (HEAVY_SELF_CMDS,
  HEAVY_SELF_ARM_MARKED_CMDS, HEAVY_SELF_EVENTS), server/event_frame.ts
  (filterRoutableEvents), server/freehold_wire.ts as Phases 01 and 05 left it
- src/net/online.ts (applyRiftStateEvent and its call in the events loop, the fplot line
  in applySnapshot, the IWorldFarming one-liners, farmNowMs), src/net/bank_snapshot_wire.ts
  (applyBankSelfWire: the closed allowlist bound both ways with AssertNever, malformed
  policy, the one dev-channel warn), src/net/freehold_snapshot_wire.ts (it EXISTS from
  Phase 01 with the null mirror declarations and an EMPTY strict-decode allowlist; this
  phase fills the empty allowlist Phase 01 created), src/net/CLAUDE.md "Wire-decode
  siblings"
- src/world_api/housing.ts and src/world_api.ts (COMMAND_NAMES already carries
  place_furnishing, move_furnishing, remove_furnishing, undo_placement; COMMAND_FACETS)
- tests/farming_command_chain_online.test.ts (the model: a real ClientWorld on a stub
  socket, its raw send fed verbatim to server.handleMessage), tests/snapshots.test.ts
  (ALL_DELTA_KEYS, its exact count, TERSE_TO_IWORLD, the fplot round-trip arm, the scrape
  that counts bare `emit('key'` in extracted emitter modules), tests/bandwidth.test.ts,
  tests/helpers/bare_client.ts, tests/professions_feast.test.ts (the no-refusal-path-mutates
  pattern), tests/bank_sockets.test.ts (the same-seed determinism shape with a
  work-happened anchor), tests/parity/scenarios.ts and tests/parity/trace.ts (Scenario,
  META_EXCLUDE), tests/monolith_budget.test.ts (sim.ts, game.ts, online.ts at zero slack)
- Root CLAUDE.md "Modularity" and "Invariants"; src/sim/CLAUDE.md
The agent returns: the room bounds and the plinth anchors to grid against; the exact
copy-consumption call chain and the 'locked' twin; the SimEvent append recipe for a
text-free descriptor and deny (no matcher needed) and the resume re-send site; the
maybe-emitter recipe with the three tests/snapshots.test.ts edits (registry row, count,
rename row) plus the round-trip arm; the strict-decode shape; the chain test harness;
the extraction candidates in sim.ts, game.ts, and online.ts that pay for the new lines.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last:
tests/world_api_parity.test.ts if a member kind changes, tests/snapshots.test.ts,
tests/monolith_budget.test.ts):
- Agent CORE: src/sim/freehold/layout_core.ts (a pure leaf with NO sim_context import:
  FREEHOLD_CELL_PITCH as a literal, the room-local cell grid from AuthoredRoom bounds,
  snapToCell, yawStep (15 degrees, wrapped), clampToRoom, footprintOverlaps by r,
  decorBudgetUsed against the tier budget, the plinth slot rules (a plinth-flagged def
  only on a plinth anchor, one per anchor), validatePlacement returning a text-free
  PlacementReason id per arm, and a bounded UndoStack of inverse operations),
  tests/freehold_layout_core.test.ts (every validation arm with a negative case; snap and
  wrap literals; the undo stack bound).
- Agent SIM: src/sim/freehold/placement.ts (placeFurnishing, moveFurnishing,
  removeFurnishing, undoPlacement as fn(ctx, ..., pid?): resolve, alive, standing in a
  claim keyed by the caller's OWN owner key (a visitor refuses 'not_owner'; placement
  never reads condition, D22: only amenities lock), validatePlacement, then the
  mutation: place consumes exactly one copy from the named slot through the
  item_copy_ref tri-state with the 'item_locked' twin deny for a locked item copy (this
  phase appends item_locked beside not_owner and bags_full; 'locked' stays the amenity
  lockout id Phase 05 declared);
  remove returns the copy to bags or refuses 'bags_full' WITHOUT removing; undo replays
  the inverse; every accepted change pushes an undo entry, bumps the record's wire rev,
  and emits), the freeholdState and freeholdDenied SimEvent variants appended to the union
  (owner key, tier, origin, layout rows { id, furnishingId, cell, yaw }, a condition
  summary; the freeholdDenied reason enum gains not_owner and bags_full explicitly here
  beside every layout_core reason id; enums append-only) and the freeholdGranted { kind }
  variant DECLARED beside them in this phase (no emitter yet: Phase 12 emits kind
  'station', Phase 13 kind 'ledger'), freeholdStateEventFor(ctx, pid) in instance.ts emitted
  on enter and on every accepted change, the Sim delegates (thin; paid by an extraction,
  then a lowered sim.ts ceiling), tests/freehold_placement.test.ts (each command's arms
  with negatives; no refusal path mutates bags, layout, or rev; a visitor is refused;
  exactly one copy consumed) and tests/freehold_determinism.test.ts (same seed, same
  layout; the offline Sim and a server-driven Sim produce byte-identical descriptors), a
  parity scenario freehold_placement in tests/parity/scenarios.ts.
- Agent SERVER: server/freehold_wire.ts (the four command bodies behind
  dispatchFreeholdCommand with TYPE-only guards, the flag refusal unchanged;
  emitFreeholdSelfKeys(maybe, sim, session, anchorSession) emitting fhold from the
  record's rev behind a per-session (pid, rev) signature, null when the account owns no
  record; the resume re-send of freeholdStateEventFor beside riftStateEventFor), the
  HEAVY_SELF_CMDS and HEAVY_SELF_EVENTS rows, the selfWireJson call and the case labels
  in game.ts (paid by an extraction, lowered ceiling), tests/server/freehold_wire.test.ts
  extended, tests/freehold_command_chain_online.test.ts (copied from the farming chain:
  every placement command's raw client frame reaches the sim; a field rename fails it),
  the tests/snapshots.test.ts edits (ALL_DELTA_KEYS row for fhold, the exact count,
  TERSE_TO_IWORLD fhold -> myFreehold, a round-trip arm on the fplot model).
- Agent NET: src/net/freehold_snapshot_wire.ts (FILL the empty allowlist Phase 01
  created in this file, never a second sibling: decodeFreeholdSelfWire for fhold into
  ClientWorld.myFreehold and applyFreeholdStateEvent into ClientWorld.freeholdLayout, both
  strict: closed allowlists bound to the types both ways, a malformed row DROPPED, one
  dev-channel warn, no t(), DOM-free, ClientWorld-free through a structural mirrors
  slice), the four ClientWorld one-liners sending the real payloads (terse snake_case
  fields, optional booleans only when true), the immediate-arm mirror call beside
  applyRiftStateEvent, tests/helpers/bare_client.ts defaults, the online.ts extraction
  that pays with a lowered ceiling, tests/freehold_snapshot_wire.test.ts (valid frame
  adopted, each malformed dimension dropped, null clears, absent leaves unchanged).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: layout_core draws no Rng and reads no clock; the descriptor is a pure
  function of the record; same seed gives the same layout on both hosts.
- Server authority: the client sends and mirrors; the client-side preview (Phase 11)
  reads the same pure core but decides nothing; every outcome arrives as an event or the
  next delta.
- D4 and D10: furnishings never become entities; every deny and grant is a text-free,
  id-carrying, pid-scoped SimEvent resolved to hudChrome.housing.* keys client-side; no
  sim_i18n or server_i18n matcher row (the S3 guard proves it).
- Wire discipline: COMMAND_NAMES and reason enums are append-only; the delta invariant
  (absent key means unchanged, explicit null clears); the descriptor is re-sent on
  resume; ALL_DELTA_KEYS carries fhold with its count and rename row.
- Never destroys: remove refuses bags_full without removing; no refusal path mutates.
- Token firewall as state.md scopes it: no on-chain vocabulary in src/sim/ (wallet,
  token, $WOC, mint, holder, marketplace, on-chain, Solana, the on-chain Freehold Charter
  deed); the Book of Deeds is game content and not firewall vocabulary. The flag still
  refuses every housing command at dispatch while dark.
- i18n: the policy in docs/freeholds/implementation-plan.md; this phase adds no player
  string (reason ids only).
- Monolith ratchet: src/sim/sim.ts, server/game.ts, and src/net/online.ts sit at ZERO
  slack; every delegate, case label, or mirror line is paid for by an extraction, then
  LOWER the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any rendering of furnishings or the ghost (Phase 09); runtime colliders (Phase 10:
  furnishings stay walk-through, D17); build mode UI, keybinds, touch (Phase 11).
- Condition and ledger derivation (Phase 13); any condition read in placement.ts (D22:
  placement, moving, removing, and undo never lock on condition).
- Trophies on plinths (Phase 17), visitors and visit policy (Phase 18), the economy
  telemetry source row (Phase 15; no command here moves copper).
- Wall or table-top snapping, redo, the capacity meter (Phase 25).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_layout_core.test.ts
  tests/freehold_placement.test.ts tests/freehold_determinism.test.ts
  tests/freehold_snapshot_wire.test.ts tests/freehold_command_chain_online.test.ts
  tests/server/freehold_wire.test.ts tests/architecture.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts tests/world_api_parity.test.ts tests/command_schema.test.ts
  tests/command_facets.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/env_protocol.test.ts tests/localization_fixes.test.ts
  tests/professions_feast.test.ts`; then regenerate the parity goldens with
  `UPDATE_PARITY=1 npx vitest run tests/parity` in their own commit and re-run them clean.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the pure leaf, the command gate order, the sim.ts extraction),
  cross-platform-sync (the facet, the events, the mirrors, the chain), server-hot-path-reviewer
  (the self-key signature gate, the descriptor payload, the heavy-self rows), and
  privacy-security-review (server/ and src/net/ touched). Prompt each for COVERAGE not
  filtering; each writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the freehold layout core and the four placement commands
- feat(server): dispatch placement commands and emit the freehold descriptor on enter, change, and resume
- feat(net): mirror the freehold descriptor and the fhold self key through strict decodes
- test(net): pin the placement command chain over the live wire
- test(parity): regenerate goldens for the freehold placement scenario
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Place, move, remove, and undo work offline (tests/freehold_placement.test.ts through
  the Sim delegates) and online (the chain test drives every command through the real
  dispatch and asserts the mirrored descriptor).
- [ ] Every validatePlacement arm has a negative case; no refusal path mutates bags, the
  layout, the undo stack, or the rev (pinned per command).
- [ ] Exactly one copy is consumed per placement through the named slot; remove refuses
  bags_full without removing (pinned).
- [ ] The freeholdState event is emitted on enter and on every accepted change and is
  re-sent on resume (pinned in tests/server/freehold_wire.test.ts); fhold is in
  ALL_DELTA_KEYS with its count, rename row, and round-trip arm.
- [ ] Same seed gives the same layout on both hosts (tests/freehold_determinism.test.ts);
  goldens regenerated in their own commit.
- [ ] All STEP 3 suites green including tests/snapshots.test.ts and
  tests/bandwidth.test.ts; the four reviewers report no BLOCKING; sim.ts, game.ts, and
  online.ts ceilings are LOWER than before.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 08, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 08: new files, the three SimEvents
  (freeholdState, freeholdDenied with not_owner and bags_full, freeholdGranted { kind })
  and their enums, the fhold key, the four commands now live, the cell pitch literal).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-08-qa.md

STOPPING RULES:
- Stop and ask if a placement rule cannot be expressed without reading the clock or
  drawing Rng.
- Stop and ask if the descriptor would need to carry English text or a hidden field.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
