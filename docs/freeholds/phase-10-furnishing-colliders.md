# Phase 10: furnishing colliders (the generalised runtime region registry on both hosts)

Wave A, the Cottage MVP. The spec is `progress.md` "10 Furnishing colliders"; the
decision is `state.md` D17 (furnishings are walk-through until this phase, which
generalises the runtime collider region registry beyond the rift band) and
`state.md` D4 (runtime colliders regenerate from the descriptor on both hosts).
This phase generalises the rift region registry, which the release already extracted
out of `src/sim/colliders.ts` into `src/sim/rift_regions.ts` (colliders.ts re-exports its
publish/token verbs), in place or under a rename, with the rift as its first client and
NO behavior change, publishes the owner's
placed-furnishing colliders per claim and per accepted layout change on the server and
from the descriptor on the client, and pins that a placed table blocks movement
identically on both hosts.

Correction, 2026-09-25 (stale since the first v0.44.0 sync, `ffa7ac5ffb`): this file first
planned to MOVE the region
block out of colliders.ts into a new src/sim/runtime_collider_regions.ts. The release
had already moved it into src/sim/rift_regions.ts, so there is no block left to move
and the colliders.ts ceiling that move lowered is not this phase's payment. The steps
below are corrected to generalise that module in place or rename it.

### Starter Prompt
```
This is Phase 10 of the Freeholds and Guildhalls feature: furnishing colliders (the
generalised runtime collider region registry, the sim publish on claim and change, the
client publish from the descriptor).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices, one ordering constraint: the
registry extraction lands first).

Goal: make placed furnishings solid on both hosts by generalising the ONE runtime
collider registry (today specialised to the rift band) so a freehold claim can publish
authoredColliders(rooms, doors, ownerDecor, DUNGEON_WALL_HW) keyed by its instance
origin, with every rift collider suite unchanged and green.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet (colliders.ts is a ratchet
  target), move-not-rewrite extraction, the offline IWorld live-array aliasing, the
  forward walk inheriting a reverse gate (drive controls BETWEEN thresholds), test-pin
  traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "10 Furnishing colliders"),
  and this file
- src/sim/rift_regions.ts: the "Procedural Rift regions" registry the release
  extracted out of colliders.ts (RiftRegion, the module-private RIFT_REGIONS,
  allocRiftCollisionToken, setRiftRegion, clearRiftRegion, riftRegionAt and its O(1)
  candidate-origin derivation through riftNearestFloorOriginZ from src/sim/data.ts, why
  oz is the key and every region shares RIFT_X_MIN as ox); src/sim/colliders.ts (the
  re-export of the three publish/token verbs and the internal riftRegionAt import,
  instanceLocal, isInstancedRegion, every reader that dispatches through riftRegionAt:
  resolveMovement, the sight and pathing samplers); src/sim/collider_cells.ts
  (buildColliderCellIndex, the MAX_BODY_RADIUS registration margin);
  src/sim/interior_collider_sets.ts (STATIC_INTERIOR_COLLIDERS, and
  derivedInteriorColliders: static per interior, cached per dungeon id, which is WHY
  per-owner furniture cannot ride AuthoredDecor)
- src/sim/rift/runs.ts (the setRiftRegion publish on spawn and the clearRiftRegion on
  free), src/sim/rift/authored.ts (authoredColliders), src/sim/dungeon_layout.ts
  (layoutColliders, DUNGEON_WALL_HW), src/sim/data.ts (instanceOrigin, dungeonAt,
  instanceSlotForZ, the freehold indices 15 and 16 in the overflow band),
  src/sim/instances/dungeons.ts (claimInstance, freeInstance, instanceOriginOf),
  src/sim/sim.ts (the single riftCollisionToken field: the per-Sim HOST token that
  isolates Sims, never claims; and `export interface InstanceSlot`, the type home of the
  append-only collisionToken field, on a file at ZERO slack), src/sim/instances/instance_slot.ts
  (freshInstanceSlot initialises the field; the InstanceSlot interface MOVES here as the
  extraction that pays for it, re-exported from sim.ts as a type so every
  `import type { InstanceSlot } from '../sim'` still resolves), src/sim/freehold/{instance.ts,
  placement.ts,layout_core.ts,types.ts} (the claim path, the accepted-change hook, the
  row to AuthoredDecor with r), src/sim/content/freehold/furnishings.ts (r per def from
  Phase 03)
- src/net/online.ts (riftCollisionToken, applyRiftStateEvent: clear the previous region
  before setting the new one, the session-end clear), src/net/freehold_snapshot_wire.ts
  (applyFreeholdStateEvent from Phase 08a), src/render/self_motion_rift_lift.ts (mirrors
  riftRegionAt for the self-motion lift: check whether the freehold band needs a twin or
  is already covered by the dungeon floor arm)
- tests/rift_collider_cells.test.ts, tests/rift_collision_region_online.test.ts,
  tests/rift_sim.test.ts, tests/rift_wall_solidity.test.ts,
  tests/rift_wall_swept_collision.test.ts (the five suites that must stay green
  unchanged), tests/helpers/bare_client.ts (the client token), tests/helpers/instanced_contexts.ts,
  tests/dungeons.test.ts, tests/monolith_budget.test.ts (colliders.ts, sim.ts,
  online.ts rows), src/sim/CLAUDE.md
- Root CLAUDE.md "Modularity" (extract on the rule of three; move-not-rewrite) and
  "Invariants"
The agent returns: the registry's exact lookup contract for the settled sibling module with band-aware
candidate-origin derivation: rift keeps riftNearestFloorOriginZ and freehold derives
instanceOrigin from the actual instance claim without reusing a clamping lookup; the
setRuntimeRegion family retains the rift exports as thin aliases; every reader site
that must dispatch to the generalised lookup, confirmed against the tree for the
SETTLED freehold reader below (the dungeon-band arm of resolvePosition and
sightBlockedAt at their instanceLocal dispatch, dungeonAt and the unclamped slot
inverse of instanceOrigin's z term); the publish and clear sites on both hosts; the
swept-collision and solidity suites' drive shapes; the extraction that pays for any
reader line added to colliders.ts (the region block already left it at the release, so
that move pays for nothing here) and the InstanceSlot move that lowers sim.ts; whether
self_motion_rift_lift.ts needs a twin.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:

Deliverables (at most five):
1. The settled runtime region registry (src/sim/rift_regions.ts generalised in place,
   or renamed) and unchanged-behavior rift aliases.
2. Server per-claim collision identity and pure descriptor-to-collider publication.
3. Client descriptor generation/identity lifecycle and matching local collision region.
4. O(1) host-token reader (per-claim ownership stamps) for movement, sight and pathing,
   no per-tick republish.
5. Rift equivalence, adjacent-claim, two-host and stale-generation lifecycle evidence.

The sibling choice is settled: preserve the rift's candidate-origin algorithm and add
an exact freehold claim-band resolver; do not defer between two architectures. Read the
actual claim slot after checking band and bounds, not a clamped coordinate that aliases
its neighbor. Create one collision identity per claim, publish before any admitted actor
moves there, and dispose after its final user releases it. All accepted 08/08a layout
revisions use the same measured footprint/radius transform; r0 rugs have no obstacle.
Protect door/arrival and occupied-player clearance through authoritative placement
validation before publication, including when the owner builds with guests present.

Client initialization is explicit, including empty/revision 0 descriptors; plotId/origin/claim
epoch changes replace the region even for identical rows. Out-of-order/old-generation
frames cannot restore a left claim. Leave, disconnect, account switch and failed entry
clear the previous collision state at the correct lifecycle point. Owner and all admitted
guests collide against the same committed rows at every graphics preset. No graphics
fallback, mesh load failure or prepared-asset timing changes physical truth.
Sequenced fan-out, three slices; the REGISTRY slice lands and passes the five rift
suites BEFORE the other two start (they consume its exports). Each agent gets ONLY the
Explore summary and its own files; the coordinator edits tests/monolith_budget.test.ts
last:
- Agent REGISTRY: generalise src/sim/rift_regions.ts in place, or rename it (for
  example to src/sim/runtime_collider_regions.ts) with the colliders.ts re-export path
  kept; there is no region block left in colliders.ts to move. It gains
  allocRuntimeCollisionToken, setRuntimeRegion(hostToken, ownerToken, ox,
  oz, colliders, cellSize?), clearRuntimeRegion(hostToken, ownerToken, ox, oz) and
  runtimeRegionAt(hostToken, x, z) with a band-aware candidate-origin derivation: the
  host token is the map key, the ownerToken is stored on the region record and checked
  on clear (the shape the SIM slice below consumes); the rift names
  allocRiftCollisionToken, setRiftRegion, clearRiftRegion stay exported as thin
  aliases that pass the rift token as both hostToken and ownerToken, so no caller
  changes and no behavior changes; the colliders.ts readers re-pointed at the one
  lookup, any line that adds to colliders.ts paid for by an extraction and a LOWERED
  ceiling, tests/runtime_collider_regions.test.ts (an equivalence pin: for a
  published rift floor every movement, sight, and pathing answer is byte-identical
  before and after the generalisation, driven between thresholds, not at extremes; a
  can-fail call counter proving exactly one candidate-origin derivation per freehold
  lookup
  with all 24 slots of indices 15 and 16 claimed; the five rift suites unchanged and
  green).
- Agent SIM: src/sim/freehold/colliders.ts (publishFreeholdColliders(ctx, inst, record)
  = authoredColliders(rooms, doors, ownerDecor, DUNGEON_WALL_HW) with ownerDecor built
  from the layout rows and each def's r, published at the claim's instanceOriginOf under
  ONE collision token per claim (D17): allocated with allocRuntimeCollisionToken at claim
  and stored on the InstanceSlot in an append-only collisionToken field, released with
  clearRuntimeRegion on free. The SETTLED reader (U2a F2), not a design left to the
  implementer: the registry keys freehold regions under the per-Sim HOST token
  (today's ctx.riftCollisionToken, which isolates Sims and never identifies a claim)
  by origin (ox, oz) in a freehold band map beside the rift's oz map; every region
  record carries its claim's collisionToken as its ownerToken, and the REGISTRY
  slice's setRuntimeRegion/clearRuntimeRegion take that ownerToken so a stale clear
  from an earlier claim generation cannot delete a successor's region (the same guard
  shape as the rift's ox check).
  runtimeRegionAt(hostToken, x, z) derives the ONE candidate origin allocation-free:
  dungeonAt(x) for the index (indices 15 and 16), the UNCLAMPED inverse of
  instanceOrigin's z term for the slot (refusing any slot outside
  0..INSTANCE_SLOT_COUNT-1; instanceSlotForZ clamps and is never used here), then the
  region's own half-extent bounds check exactly as riftRegionAt does. The freehold arm
  composes into the existing dungeon-band arm of resolvePosition and sightBlockedAt at
  their instanceLocal dispatch (resolveMovement, isBlocked, lineOfSightClear and the
  pathing samplers already funnel through those two; the Explore agent lists any other
  instanceLocal reader), appending the runtime region's colliders to that origin's
  static interior set; the eight riftToken caller sites in sim.ts and rift/runs.ts stay
  untouched (sim.ts is at zero slack). A freehold publish never uses the host token as
  its identity: the claim token is the ownership stamp. clearFreeholdColliders on
  free), the hooks: on every claim in instance.ts,
  after every accepted change in placement.ts, in the free path; the ctx primitive or
  callback appended if one is needed (mirrored in tests/sim_context.test.ts),
  tests/freehold_colliders.test.ts (a placed table blocks movement through
  resolveMovement; removal clears; the collider set is a deterministic function of the
  descriptor; a def with r: 0 publishes nothing; the owner and a guest collide
  identically; two concurrent claims on one Sim keep independent regions: a table in
  claim A never blocks in claim B and freeing A leaves B's region intact; freeing the
  claim leaves no region and no token behind; two ghost/physics composition pins
  (U2a F4): for every def in src/sim/content/freehold/furnishings.ts the published
  circle r is at most the inscribed radius of its validated footprint and rugs publish
  r = 0 (raising one def's r above its footprint reds it); and a Cottage filled to the
  legal decor budget through validatePlacement, then published, lets resolveMovement
  walk the authored door, arrival and hearth waypoints on BOTH hosts to within body
  radius (removing validatePlacement's door-path arm reds it)).
- Agent NET: src/net/freehold_snapshot_wire.ts applyFreeholdStateEvent publishes the
  same set under the client's host token (online.ts riftCollisionToken, the same map
  key the server's reader uses) with a per-descriptor ownerToken allocated on enter
  and released on leave (the client mirrors one claim at a time, so its lifecycle
  matches the server's per-claim stamp: clear the previous region, set the new one,
  clear on an inactive descriptor and on session end), the same
  authoredColliders call from the same rows so both hosts collide identically, the
  online.ts extraction if a line is needed (lowered ceiling), tests/freehold_collision_region_online.test.ts
  (copied from tests/rift_collision_region_online.test.ts: the descriptor over the live
  wire registers the region on the client; the client's resolveMovement answer equals
  the server's for the same walk; leave clears).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the collider set is a pure function of the descriptor and the content
  radii; no Rng, no clock; both hosts publish from the same rows through the same
  function.
- No behavior change for the rift: the generalisation of rift_regions.ts (and any
  rename) is move-not-rewrite; the five rift suites stay green without edits; the O(1)
  candidate-origin lookup stays O(1).
- No per-tick work: publish only on claim, accepted change, and free; never in a sweep.
- The physics dispatch predicate (isInstancedRegion) is never reused as the vault gate
  (the vault_craft_gate.ts header rule); this phase touches no gate.
- D4: furnishings stay a descriptor; the colliders are regions, never entities.
- Sim purity (src/sim/ imports nothing from render, ui, game, or net); the token
  firewall as state.md scopes it (no on-chain vocabulary in src/sim/: wallet, token,
  $WOC, mint, holder, marketplace, on-chain, Solana; the Book of Deeds is game content);
  the flag untouched.
- i18n: the policy in docs/freeholds/implementation-plan.md; this phase adds no string.
- Monolith ratchet: src/sim/colliders.ts, src/sim/sim.ts, and src/net/online.ts are
  ratchet targets (sim.ts and online.ts at ZERO slack): pay with extraction, then LOWER
  the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any change to swept collision, mob pathing, or line-of-sight semantics beyond reading
  the generalised lookup.
- The ghost's blocked state (it reads validatePlacement from layout_core, never the
  physics registry) and any UI (Phase 11).
- Wall and table-top snapping (Phase 25); ward exteriors (Phase 34).
- Any render change; any content change (every def already carries r from Phase 03).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/runtime_collider_regions.test.ts
  tests/freehold_colliders.test.ts tests/freehold_collision_region_online.test.ts
  tests/rift_collider_cells.test.ts tests/rift_collision_region_online.test.ts
  tests/rift_sim.test.ts tests/rift_wall_solidity.test.ts
  tests/rift_wall_swept_collision.test.ts tests/dungeons.test.ts
  tests/freehold_determinism.test.ts tests/freehold_placement.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/snapshots.test.ts tests/localization_fixes.test.ts`; regenerate the parity
  goldens with UPDATE_PARITY=1 in their own commit only if a sampled field or emit
  changed (a region publish is not sampled; expect no change).
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the move-not-rewrite extraction, the publish sites, tick
  order untouched), cross-platform-sync (both hosts collide identically; the mirror),
  privacy-security-review (src/net/ touched) and server-hot-path-reviewer (the
  per-claim collider registry read inside movement, sight and pathing on the 20 Hz
  loop and the registry's retention across live claims, required even though publish
  never runs per tick). Prompt each for COVERAGE not filtering; each writes its report
  to a file. Do not commit until all findings, including nits, are resolved and freshly
  reviewed.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: architecture-reviewer,
  cross-platform-sync, privacy-security-review, server-hot-path-reviewer,
  test-coverage-auditor, qa-checklist.
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
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- refactor(sim): generalise the rift region registry with the rift as its first client
- feat(sim): publish the owner's furnishing colliders on claim and on every layout change
- feat(net): mirror the furnishing collider set from the freehold descriptor
- test(sim): pin furnishing collision on both hosts and the rift suites unchanged
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The five rift collider suites pass without a single edit; the equivalence pin
  proves the rift path answers identically before and after the generalisation.
- [ ] A placed table blocks movement on the server-driven Sim and on the ClientWorld
  fed by the descriptor; removal clears; freeing the claim leaves no region (pinned).
- [ ] The collider set is deterministic from the descriptor (pinned in
  tests/freehold_colliders.test.ts and the online twin); a def with r: 0 publishes no
  circle (pinned).
- [ ] Each claim holds its own collision token on the InstanceSlot, allocated at claim
  and released on free; two concurrent claims keep independent regions (pinned); no
  freehold publish uses ctx.riftCollisionToken (a grep plus the reviewer's word).
- [ ] No publish runs per tick (a grep of the sweep paths plus the reviewer's word).
- [ ] runtimeRegionAt resolves a freehold position with exactly one candidate-origin
  derivation (the call counter in tests/runtime_collider_regions.test.ts with all 24
  slots of indices 15 and 16 claimed); a stale clearRuntimeRegion carrying an earlier
  claim's ownerToken leaves the successor's region intact (pinned); InstanceSlot lives in
  instance_slot.ts and sim.ts is at or below its previous ceiling.
- [ ] The r-within-footprint sweep and the filled-Cottage door/arrival/hearth walk pass
  on both hosts with their two named negative controls (pinned).
- [ ] All STEP 3 suites green; architecture-reviewer, cross-platform-sync and
  server-hot-path-reviewer confirm ALL findings, including nits, are resolved and
  freshly reviewed; the colliders.ts ceiling is not raised, and any line added there is
  paid for by an extraction and a LOWER ceiling (the release's region move is not this
  change's payment); sim.ts and online.ts likewise if touched.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 10, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 10: the registry module and its
  exports, the alias rule, the per-claim token field and its reader, the publish sites;
  flip D17's "walk-through until Phase 10" note to done).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-10-qa.md

STOPPING RULES:
- Stop and ask if the generalisation cannot keep the rift's O(1) lookup or any rift
  suite needs an edit to pass (that is a behavior change, not a move).
- Stop and ask if a freehold region would overlap another band's candidate origin.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
