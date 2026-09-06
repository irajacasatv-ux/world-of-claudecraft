# Phase 34: Wards (shared neighborhoods and exteriors)

Wave D, Wards and Charters. The spec is `progress.md` "34 Wards: shared neighborhoods and
exteriors"; the decisions are `state.md` and `brainstorm.md` (D4 descriptors, D8 nothing
ticks, D15 the slot pool, D16 owner-keyed state). This phase ships the ward instance
kind (24 to 50 freehold exteriors around a square with a Guildhall anchor plot), exterior
shells per tier, deterministic ward assignment and reassignment, and the ward as the
enter point for member plots.

### Starter Prompt
```
This is Phase 34 of the Freeholds and Guildhalls feature: Wards (the shared ward
instance, exterior shells per tier, assignment and reassignment, the ward as the door to
member plots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: give every freehold a place in a shared, instanced neighborhood on the existing
slot pool and descriptor seams, with exteriors regenerated deterministically on both
hosts from one small descriptor, and with no per-tick work and no forced moves.

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
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on instance bands and footprints, the rift
  descriptor model, ALL_DELTA_KEYS conflicts, server hot paths and cached reads, the
  scheduler and instanced meshes, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "34 Wards"), and this file
- src/sim/instances/dungeons.ts (enterDungeon, claimInstance, freeInstance,
  updateInstances, instanceClaimContains and the Nythraxis wide-arena carve-out,
  instanceSlotForZ), src/sim/data.ts (instanceOrigin, INSTANCE_SLOT_COUNT, the x bands),
  src/sim/content/freehold/dungeons.ts (the indices in use), src/sim/freehold/instance.ts
  (claim, rehydrate, the freeholdState descriptor), src/sim/rift/runs.ts
  (riftStateEventFor, the resume re-send), src/sim/colliders.ts (setRiftRegion,
  clearRiftRegion, the Phase 10 generalised registry)
- server/freehold_db.ts (account_freeholds, the rev compare-and-swap), server/freehold_wire.ts,
  server/cached_read.ts (createCachedRead), server/realm_readout_memo.ts, server/game.ts
  (the riftState re-send after hello; grep riftStateEventFor), server/heavy_self.ts
- src/net/online.ts (applyRiftStateEvent, applyFreeholdStateEvent), src/net/freehold_snapshot_wire.ts
- src/render/freehold/ (the Phase 09 furnishing view, the Phase 06 interior dressing),
  src/render/dungeon.ts (proximity build, retireInteriorGroup), src/render/delve_interior_tracker.ts,
  src/render/gated_scene_attach.ts, src/render/point_light_budget.ts
- tests/snapshots.test.ts (ALL_DELTA_KEYS), tests/freehold_command_chain_online.test.ts,
  tests/dungeons.test.ts, tests/monolith_budget.test.ts
The agent returns: a free DungeonDef index for the ward and the footprint arm the ward
needs (a ward is wider than a dungeon claim); the rift descriptor recipe end to end
(emit, re-send on resume, client mirror, colliders); the account_freeholds column
additions the ward needs; the cached-read and serialize-once shapes; the render tracker
to copy for exterior retirement; the extraction candidates that pay for new lines.
Settle in STEP 1 and record in state.md before implementing: the ward plot cap
(working: 50 plots, the state.md value) and the visible-member cap (working: 24), the
anchor-plot rule (the Guildhall most members share, else empty), and the ward claim
footprint.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SIM: src/sim/content/freehold/dungeons.ts freehold_ward (spawns: [],
  guideVisible: false, claimKey: 'owner', absent from FINDER_ACTIVITIES), the ward claim
  keyed ward:<wardId> that every member and guest enters, src/sim/freehold/ward_core.ts
  (the pure descriptor: plot rows { ownerKey, plotIndex, tier, style }, the square
  layout math, the anchor plot), src/sim/freehold/ward_assignment_core.ts (least-full open
  ward in ward-id order, a new ward opens only when every open ward is at cap,
  reassignment only on the owner's request to a friend's or guild's ward with a free
  plot, never forced, never loses anything), src/sim/freehold/wards.ts (claim, the
  pid-scoped wardState event on enter and after each change, the member door that enters
  the plot under the owner's key), tests/freehold_wards.test.ts (determinism, assignment,
  the door, occupancy reaping), the sim.ts delegates paid by extraction.
- Agent SERVER: ward_id and ward_plot columns on account_freeholds (ADD COLUMN IF NOT
  EXISTS, indexed) and a freehold_wards table (ward_id, realm, anchor_guild_id nullable,
  created_at; keep-forever comment) in server/freehold_db.ts; the ward roster read behind
  createCachedRead with single-flight and a bust on assignment; the descriptor built once
  per ward per change; the wardState re-send on resume beside riftStateEventFor; the
  exportAccountData rows; tests/server/freehold_wards_db.test.ts plus the pg twin.
- Agent NET: applyWardStateEvent in a src/net/ward_wire.ts sibling (strict decode, a
  malformed row dropped), the runtime colliders for exterior shells through the region
  registry, the online.ts lines paid by extraction, the chain test arm.
- Agent RENDER: src/render/freehold/ward_exteriors.ts (one InstancedMesh per tier shell
  kit, attached through attachSceneGroupGated, retired on leave through a tracker keyed
  by ward origin like DelveInteriorTracker, a prewarm home for every shell material,
  point lights within budget) plus ward_exteriors_core.ts in RENDER_PURE_CORES.
The coordinator edits last: tests/world_api_parity.test.ts (any facet member: wardView,
requestWardMove), tests/snapshots.test.ts, tests/monolith_budget.test.ts, parity goldens
in their own commit. Every agent writes any report longer than a screen to a file and
replies with the path plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: assignment and layout are pure functions of the roster and content; no
  Rng; no wall clock; both hosts regenerate byte-identical exteriors from the descriptor.
- Nothing ticks: occupancy rides updateInstances; the roster is read at claim and on
  change; no per-tick DB or sim work.
- Server authority; interest scoping and delta guards unchanged; every new self key or
  event pinned (ALL_DELTA_KEYS, the chain test).
- Nothing destroyed, no forced move: a reassignment never drops a furnishing, a trophy,
  or the record.
- Token firewall at the state.md scope (the style slot is a cosmetic id, never an
  on-chain word such as holder, mint, or marketplace); the i18n
  policy in docs/freeholds/implementation-plan.md; vocabulary fixed; "phase" in no code,
  comment, commit, or PR text; sim.ts, game.ts, and online.ts ceilings LOWER after this
  phase.

Out of scope (do NOT do in this phase):
- Favor, Endeavors (Phase 35); Showcases and guest books (Phase 36); holder flair (Phase
  38 fills the reserved style slot); exterior customization beyond the tier shell.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_wards.test.ts
  tests/freehold_determinism.test.ts tests/dungeons.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/env_protocol.test.ts tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/renderer_compile_gate.test.ts tests/localization_fixes.test.ts
  tests/server/freehold_wards_db.test.ts tests/server/main_retention_wiring.test.ts`;
  the pg-armed twin with TEST_DATABASE_URL set; `npm run perf:tour`; parity goldens if
  regenerated.
- Spawn review agents per docs/freeholds/implementation-plan.md: architecture-reviewer,
  render-performance-reviewer, server-hot-path-reviewer, plus cross-platform-sync (the
  new event and facet), migration-safety (columns and table), privacy-security-review
  (server/ and src/net/). Prompt each for COVERAGE not filtering; each writes its report
  to a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the ward instance, its descriptor, and deterministic plot assignment
- feat(server): persist ward membership and re-send the ward descriptor on resume
- feat(net): mirror the ward descriptor and its exterior colliders
- feat(render): draw ward exteriors as instanced tier shells through the scheduler
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] A new freehold lands in the least-full open ward; the plot cap and the
  visible-member cap are pinned by fresh literals; a same-seed twin run assigns
  identically; a reassignment request to a full ward is refused with a text-free reason
  and moves nothing.
- [ ] The wardState descriptor round-trips the wire, is re-sent on resume, and both
  hosts regenerate identical exteriors and colliders (the determinism suite arm).
- [ ] A member door in the ward enters the plot under the owner's key; a visitor obeys
  the plot's visit policy; occupancy reaping frees the ward slot.
- [ ] No per-tick DB read; the roster read is cached and busted on assignment
  (server-hot-path-reviewer no BLOCKING); no live-program events on the perf tour.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 34, notes, deferrals) and
  docs/freeholds/state.md (ledger row 34: the DungeonDef, the event, wire keys, facet
  members, columns and table; the capacity, anchor, and footprint decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-34-qa.md

STOPPING RULES:
- Stop and ask if the ward footprint cannot fit the slot pool without widening
  instanceSlotForZ for every def (a pool-wide change is a maintainer decision).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
