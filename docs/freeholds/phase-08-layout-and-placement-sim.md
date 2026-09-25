# Phase 08: bounded placement and session undo/redo

Wave A. The settled decisions in state.md, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md govern this work. The artifacts
and tests named below are NEW unless the context inventory labels them EXISTING.
No housing implementation is claimed complete by this planning file.

### Starter Prompt
```
This is Phase 08 of the Freeholds and Guildhalls feature: bounded placement and session undo/redo.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out.
This prompt names no model. Keep independent implementation owners disjoint; the parent
integrates shared callers and pins after their reports return.

Goal: place, move, remove, undo and redo exact furniture copies through one deterministic plan and the committed 07a transaction boundary.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Sync per state.md "Worktree, base, and merge-forward": git fetch origin --prune; use the
  newest origin/release/**. Run release-merge-audit after any non-empty merge and pnpm
  install --frozen-lockfile when patches/ moved.
- Memory scan: MEMORY.md, freeholds entry, test-pin traps, apply ALL findings, and
  review the review-fix round. Record changed seam/ceiling/base facts in state.md before
  editing dependent code. Read each changed directory's CLAUDE.md.

STEP 1 - LOAD CONTEXT (through agents, never planning docs or coordinators directly):
- One Explore agent reads this file, its paired QA, state.md, the matching progress row,
  implementation-plan.md review table, ux-spec.md and the three content/art artifacts.
- It reads the following existing seams and prior outputs, returning exact exports,
  readers/writers, pin sites, known failure behavior and a promised-versus-tree table:
  - PRIOR 07/07a src/sim/freehold/{types.ts,state.ts,instance.ts,index.ts},
    server/freehold_mutation.ts::commitFreeholdMutation and operation/claim DB modules.
  - PRIOR 03/04/06 src/sim/content/freehold/{furnishings.ts,tiers.ts,layouts.ts};
    EXISTING src/sim/rift/authored.ts::AuthoredRoom/AuthoredDoor/AuthoredDecor and
    src/sim/geometry2d.ts; content-numbers-workbook.md's measured floor/grid/clearance rows.
  - EXISTING src/editor/placement_transform_core.ts::rotateStep/wrapAngle/ROTATE_STEP_RAD
    as behavior reference only, never an import into sim; src/sim/item_copy_ref.ts,
    src/sim/item_lock.ts, src/sim/bags.ts, src/sim/professions/feast.ts and
    src/sim/professions/pattern_items.ts for exact-copy/gate-order behavior.
  - PRIOR 01 housing facet, command registry including redo_placement, null mirrors and
    server/freehold_wire.ts. EXISTING tests/farming_command_chain_online.test.ts,
    tests/command_schema.test.ts, tests/command_facets.test.ts, tests/parity/scenarios.ts,
    tests/parity/trace.ts, tests/world_api_parity.test.ts and tests/monolith_budget.test.ts.
- Reports go to the session scratchpad; replies carry a path and short summary.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
1. NEW src/sim/freehold/layout_core.ts is a DOM/Three/SimContext-free geometry leaf.
   Export snapToCell/yawStep/clampToRoom/validatePlacement and budget usage from the
   authored room manifest. FREEHOLD_CELL_PITCH is a reproducible measured value with
   source/derivation, not an invented literal. Validate finite safe coordinates, normal
   mode's wrapped 15-degree yaw lattice, transformed footprint bounds, solid clearance,
   required door/arrival/walking paths, room/plinth support and decor/plinth/amenity
   budgets. Walk-through rugs publish no obstacle and may underlay solid furniture while
   retaining their own boundary/budget rules. The grid, radius and collision proof all
   use the same authored transforms; a circular r does not substitute for footprint.
2. NEW src/sim/freehold/placement.ts owns pure plans and SimContext application for
   placeFurnishing/moveFurnishing/removeFurnishing. Resolve caller/session/current plot,
   alive/current owner, exact copy and lock state, placement/occupant safety, capacity
   and revision before any mutation. Visitor attempts refuse not_owner; condition never
   gates entry, placement, removal or history. Place consumes the selected exact unlocked
   item copy once; remove returns that same copy or refuses bags_full without mutation.
   Never entomb an owner/guest or obstruct the safe exit; occupancy is authoritative.
   The first successful place for a character raises 03's homesteader_first_furnishing
   deed (trigger kind manual, cosmetic only) through the existing src/sim/deeds.ts::
   grantDeed seam after the placement mutation applies, identically in both hosts
   (online after the 07a commit, offline in the same synchronous plan); a refused plan,
   an undo or a later placement raises nothing new. tests/freehold_placement.test.ts
   pins the raise and those negative arms beside tests/deeds_content.test.ts.
3. NEW src/sim/freehold/placement_history.ts owns undoPlacement/redoPlacement for a
   build session, bounded by the approved maximum legal placement-row count. Entries
   retain exact-copy identity and expected revision/operation preconditions. Journal only
   confirmed placement edits; each undo/redo is an atomic plan, not a recursive new
   history entry. A missing/locked/spent returned copy, incompatible external revision,
   changed plot/session or changed ownership clears/refuses safely with a keyed reason.
   Money, ledgers, sales and permanent unlocks never enter this journal. Latest own
   undo/redo advances the expected revision correctly; no arbitrary extra history cap.
4. Extend the five placement commands and the separate ephemeral build-presence
   command, Sim delegates and server/freehold_wire.ts with
   bounded type guards, operation correlation and exact payload pins. Implement the
   C03 build_presence.ts authority below in this command-authority output. Online
   placement plans
   commit through 07a and publish ACK only after durable success, sharing the current
   global fence; retries reuse their original operation ID. Offline Sim applies the same
   plan deterministically. Append all reason IDs, including item_locked distinct from
   amenity locked, without changing existing enum order. freeholdGranted is declared as
   a text-free variant with its later kind owners. 08a owns the descriptor and snapshot
   transport; production placement stays dark until that consumer contract is complete.
5. NEW tests/freehold_layout_core.test.ts, freehold_placement.test.ts,
   freehold_placement_history.test.ts and freehold_determinism.test.ts cover every arm,
   maximum legal/over-limit layouts, exact-copy loss/duplication controls and every
   history boundary. Extend server/freehold_wire and command/facet pins. Add a parity
   scenario with a work-happened anchor; regenerate goldens in their own commit.
   Consume 07a real-PG transfer tests rather than claiming separate autosaves are atomic.

EPHEMERAL BUILD-PRESENCE CONTRACT (C03; D20 names remain unchanged):
NEW facet setFreeholdBuildPresence(active: boolean) and command
set_freehold_build_presence carry active, acknowledged opaque plotId,
acceptedTransitionId and monotonic buildPresenceSeq. The host supplies authenticated
session and current claim generation; payload identities only reject stale delivery.
01 owns the stub/registry, 08 implements NEW
src/sim/freehold/build_presence.ts::setFreeholdBuildPresence and 08a publishes only
freeholdState.isDecorating. UI 11 sends start/stop through the real command; 18 reads the
public boolean. Public false is initialized explicitly, including empty first snapshots.

Capture the actual receiving socket binding before queues and validate it again at
dispatch, extending the housing ingress seam with trusted host metadata. No client
field supplies that authority. buildPresenceSeq is scoped to that binding; reconnect
starts a fresh inactive window while preserving acceptedTransitionId history. An old
socket or queued old-generation frame cannot set or clear the new window. Test reload
and reconnect with a reset client counter after a previously larger sequence.

Current edit authority and the accepted plot/entry must match before start. Track only
bounded current authorized sessions privately and aggregate true while any edits.
Close/leave/disconnect/permission or claim revocation clears that session immediately.
The host clears through the accepted GameServer.socketClosed path immediately,
preserving its stale-socket identity guard rather than waiting for linkdead leave.
A late close cannot clear a newer entry; stale start or sequence replay cannot revive
one. Reconnect starts inactive and 11 may explicitly reenter after fresh authority.
Presence does not save SQL/JSON, consume a receipt, bump durable layout history, or
include ghost, camera, selected copy, bags/vault, undo history or actor/account IDs.
Presence-only changes invalidate the public descriptor's ephemeral revision/signature
without mutating durable_rev; unchanged state creates no repeated payload allocation.

Pin both worlds, all command/facet/dispatch/RL exclusions and isolated offline/headless
behavior. NEW tests/freehold_build_presence.test.ts plus the actual command-chain/wire
suite prove two owner sessions, guest refusal, disconnect/revocation, stale entry/sequence,
reconnect inactive, independent-session clears and exact owner/visitor public key sets.
A visitor observes the same committed furniture while an owner edits; no ghost leaks.

INVARIANTS AND CLOSED HANDOFFS:
- Bounds are measured from the largest legal layout, all permitted nested copies and
  bounded item metadata. Validate entry/byte ceilings before allocation and persistence.
  A missing approval/measurement row keeps the affected content gated; no late guessing.
- 08a, not this file, owns freeholdState/fhold projection (including
  applyFreeholdStateEvent), strict decodes and snapshot census. 09 reads that public
  descriptor and 10 adds runtime colliders. Until 10, physical furnishings are
  walk-through, while authoritative placement safety already applies.
- Normal snapped yaw remains available after 25 introduces explicit advanced free planar
  translation/free yaw and typed wall/table/ceiling anchors. Full-axis gimbal, arbitrary
  scale and collision-leniency are excluded. Capacity meters and redo are Wave A in 11.
- A rejected plan mutates no inventory, layout, journal, durable/wire revision or receipt.
  Client previews reuse the leaf and cannot authorize placement or manufacture a copy.
- Pure sim behavior uses SimContext, no wall clock or host imports, no new Rng draw.
  IWorld is the renderer/UI seam; BOTH worlds and all facet/command/event pins change
  together. No internal account or guild ownership key crosses a public descriptor.
- Module-first siblings own logic. A coordinator edit is paid by a behavior-preserving
  extraction and a remeasured/lowered ceiling; never raise a ceiling without permission.
- Every player string resolves through an English hudChrome.housing.* key; use the
  tooltip-writing skill for every tooltip. Shared API/kind keys retain their own catalog.
  Regenerate artifacts; never hand-edit generated files or locale overlays.
- The state token firewall applies to on-chain vocabulary, with the Book of Deeds
  gameplay exception. Housing never sells power or destroys a home for condition.
- Never add a balance literal absent from state or a source/approved calibration row.
  A pending external acceptance has a concrete artifact, owner and closed release gate;
  it is not an unresolved implementation choice. Feature flags default off.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- npx tsc --noEmit; npx vitest run tests/freehold_layout_core.test.ts
  tests/freehold_placement.test.ts tests/freehold_placement_history.test.ts
  tests/freehold_determinism.test.ts tests/server/freehold_wire.test.ts
  tests/server/freehold_mutation.test.ts tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/env_protocol.test.ts
  tests/localization_fixes.test.ts tests/professions_feast.test.ts
  tests/deeds_content.test.ts.
- Run tests/server/freehold_mutation.pg.test.ts with TEST_DATABASE_URL armed for the
  real transfer/fence/receipt boundary. Regenerate parity via UPDATE_PARITY=1 npx vitest
  run tests/parity in its own commit, then npx vitest run tests/parity clean.
- Invoke database-performance-reviewer before database/workload decisions and on the
  finished diff whenever this file touches SQL, storage shapes, queues, locks or growth.
- Required COVERAGE reviewers: architecture-reviewer, cross-platform-sync, database-performance-reviewer, migration-safety, server-hot-path-reviewer, privacy-security-review, test-coverage-auditor, qa-checklist.
  Each reports all findings to a file. The parent applies ALL findings including nits,
  then a FRESH reviewer reads the fixes. No unreviewed fix is accepted.
- Run node scripts/gate_select.mjs before completion; npm run gate is the deeper option.
  Record exact commands, exit codes, exercised/omitted suites and material risks.

STEP 4 - COMMIT CADENCE:
- Commit coherent dependency-first chunks with Conventional Commits scope and a body,
  explicit paths, never git add -A, no coauthor trailer and no word "phase" in a message.
  Separate extraction/parity provenance if applicable. Run npm run ci:changed after
  the last commit and read its exit code. Do not push or open/merge a PR.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] Every geometry/gate arm has a can-fail negative and a control; maximum legal
  measured layout fits, one-over-limit refuses, protected paths and occupants stay safe.
- [ ] All five commands preserve exact-copy custody; every refusal changes nothing and
  online acknowledgment follows 07a atomic commit. Fake/real PG prove no duplicated/lost
  furniture across restart, stale revision, old fence and replay.
- [ ] Undo/redo obey the derived finite session bound and exact revision/copy identity;
  stale inverse, locked/spent returned copy and session/plot change refuse safely.
- [ ] Offline and online share the same pure plan and deterministic outcomes. Reason
  and command enums append only, RL excludes every new verb and zero-power stays pinned.
- [ ] No descriptor/mirror ownership is duplicated from 08a and no capacity/redo work is
  incorrectly deferred to 25; every geometry/cost value has an artifact source.
- [ ] All scoped checks and the shared contribution gate passed, every required review
  returned, and the independent fix review found no remaining finding.

STEP 6 - DOC UPDATES + MEMORY:
- Update progress.md row 08 and state.md's implementation ledger with exact files,
  exported symbols, schema/wire/command keys, measured bounds, artifacts and evidence.
  Keep planning "settled" distinct from implementation "built". Record no anonymous
  deferral; carry every named unsigned release gate when applicable.
- Record useful traps in the freeholds memory entry within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
End with status, files, commands/outcomes, review verdicts, release evidence still required,
and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-08-qa.md

STOPPING RULES:
- Preserve unrelated user work. Stop for an unapproved destructive schema change or a
  required raised monolith ceiling; explain the exact constraint and concrete evidence.
- If a required artifact or runtime proof fails, record FAIL and repair it; do not claim
  approval, invent numbers or silently waive checks. Never push or open/merge a PR.
```
