# Phase 34: Wards: shared neighborhoods and exteriors

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 34 of the Freeholds and Guildhalls feature: Wards: shared neighborhoods and exteriors.

Harness: Codex, not Claude (D74). Follow the root CLAUDE.md "Working style by model
capability" block for effort and fan-out; this prompt names no model.

Goal: give every plot a stable neighborhood through the existing slot pool and descriptors, with race-safe assignment, bounded admission and beautiful tier exteriors.

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
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Gotchas scan (Codex has no memory step): state.md "Gotchas (read before the matching
  phase)" entries on instance bands and footprints, the rift descriptor model,
  ALL_DELTA_KEYS conflicts, server hot paths and cached reads, the scheduler and
  instanced meshes, test-pin traps.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use the sanctioned imagegen/image-to-GLB workflow and its
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "34 Wards"), and this file
- src/sim/instances/dungeons.ts (exported enterDungeon and updateInstances; the
  module-private helpers claimInstance, freeInstance and instanceClaimContains; the
  Nythraxis wide-arena carve-out), src/sim/data.ts (instanceOrigin, INSTANCE_SLOT_COUNT,
  instanceSlotForZ, the x bands),
  src/sim/content/freehold/dungeons.ts (the indices in use), src/sim/freehold/instance.ts
  (claim, rehydrate, the freeholdState descriptor), src/sim/rift/runs.ts
  (riftStateEventFor, the resume re-send), src/sim/rift_regions.ts (setRiftRegion,
  clearRiftRegion, re-exported from src/sim/colliders.ts; the registry Phase 10
  generalises in place or renames)
- server/freehold_db.ts (account_freeholds, the rev compare-and-swap), server/freehold_wire.ts,
  server/cached_read.ts (createCachedRead), server/realm_readout_memo.ts, server/game.ts
  (the riftState re-send after hello; grep riftStateEventFor), server/heavy_self.ts
- src/net/online.ts (applyRiftStateEvent, applyFreeholdStateEvent), src/net/freehold_snapshot_wire.ts
- src/render/freehold/ (the Phase 09 furnishing view, the Phase 06 interior dressing),
  src/render/dungeon.ts (proximity build, disposeInteriorResources) and
  src/render/renderer.ts (the private retireInteriorGroup: scene.remove,
  releaseInteriorExternalRefs, dungeons.disposeInteriorResources, reached through the
  DelveInteriorTracker retire callback), src/render/delve_interior_tracker.ts,
  src/render/gated_scene_attach.ts, src/render/point_light_budget.ts
- tests/snapshots.test.ts (ALL_DELTA_KEYS), tests/freehold_command_chain_online.test.ts,
  tests/dungeons.test.ts, tests/monolith_budget.test.ts
- docs/freeholds/ux-spec.md and the content, measurement, service and policy artifacts
  referenced by state.md that this slice consumes (signed, or still open release gates).
The agent returns: the measured ward footprint and assigned DungeonDef index; descriptor/claim/rehydration
seams; transaction and index design; cache-bust sites; the scheduler/tracker recipe.
Capacity is 50 plots and 24 admitted occupants from state.md, never a graphics cull.
Live-ward concurrency is a pool fact, not a design number: at most INSTANCE_SLOT_COUNT
(src/sim/data.ts, 24) claimed wards per DungeonDef per realm process; saturation is the
honest busy refusal (D50), and the ceiling is cited from that constant, never restated.
The largest represented guild anchors; ties use stable guild ID; no guild means no
anchor. Physical footprint/arrival clearance is measured in the approved geometry
manifest against instanceSlotForZ and the existing claim allocator before art.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.
Database review is required BEFORE implementation decisions and again on the finished
diff, including changes to callers, persisted JSON, caches or workload even when SQL
text stays unchanged. Reuse 07a's global plot fence and reviewed actual legacy
touch-set, including caller-owned saves, character prelocks/nonces, bank-ledger
classification, guild replay and storage/custody effects. Preserve character FIFO
entry and the proved new-participant suffix, never a replacement generic lock order.
Never enter a queue holding a DB client or hold locks
across service IO. Bound admitted work, acquisition/query/transaction deadlines,
projection keys, rows and bytes; background producers use shared admission and
cancellation. Retain one running plus one pending dirty generation, not unbounded
FIFO writes. Supply a query/index inventory (scope, predicates, order, limit, expected
cardinality and supporting index), reverse-FK export/delete access and retention for
every growing shape. Disposable-PG concurrency, plans, query counts and maximum legal
payload evidence are acceptance, not satisfied by fake-pool tests.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 5 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Ward geometry and descriptor: add planned freehold_ward DungeonDef with spawns: [],
   guideVisible: false, claimKey: 'owner', outside FINDER_ACTIVITIES (the room keeps
   `claimKey: 'owner'` and so the World PvP sanctuary, state.md "Non-negotiables").
   Implement pure NEW src/sim/freehold/ward_core.ts with opaque public plotId rows,
   square/door coordinates, tier and
   cosmetic style IDs, measured bounds and deterministic anchor selection. Internal
   account/guild owner keys never appear in viewer wire. One global fenced ward claim
   ward:<wardId> uses existing pool admission/reaping; no per-tick subsystem.
2. Race-safe membership: NEW src/sim/freehold/ward_assignment_core.ts (a pure leaf the
   server calls inside the allocation transaction) orders bounded candidates by lowest
   occupancy then stable ward ID; PostgreSQL alone authorizes allocation. Extend
   server/freehold_db.ts with indexed ward membership tied to Phase 07 stable plot ID,
   freehold_wards and required reverse-FK/export access. Enforce unique (ward_id,
   ward_plot) and one membership per plot. Lock affected wards in stable ID order,
   recheck capacity and update old/new occupancy in one bounded transaction. Create a
   ward only after authoritative candidates are full. Owner-requested moves alone;
   full target refuses without moving or losing anything. Bounded indexed candidate
   selection, single-flight roster reads and commit-then-bust prevent stale capacity
   authorization or whole-table scans.
3. Admission, doors and wire: NEW src/sim/freehold/wards.ts admits at most 24 occupants,
   refuses a busy claim honestly, and keeps already admitted entities visible on every
   preset. The
   member door resolves plotId server-side and enforces current visit/block/guild
   permissions even for offline owners. Emit/re-send pid-scoped wardState after claim,
   change and resume through server/freehold_wire.ts. Strict src/net/ward_wire.ts
   decode and runtime collider registry preserve last valid state on malformed input;
   shared projections never authorize entry. Add exactly two housing facet members
   through both worlds (D20 verb-first style; one five-edit parity batch per member in
   tests/world_api_parity.test.ts plus the command schema/facet pins): the `myWard` read
   (the viewer's ward's opaque public plot/marker rows, occupancy and the bounded move
   candidates) and the `moveWard(wardId)` command (owner-requested move only), with real
   command-chain tests.
4. Exterior art and UX: final tier shell kits use one InstancedMesh per kit through
   attachSceneGroupGated, prewarm homes, point_light_budget and tracked retirement
   modelled on DelveInteriorTracker. Add NEW src/render/freehold/ward_exteriors.ts and
   its registered pure core (RENDER_PURE_CORES). Gate/door affordances, the
   roster/marker surface, anchor identity and full/busy/reassignment states use
   ux-spec's later-wave map marker/list family and the exact keyed copy in the table
   below (D92); refusals resolve through the D26 freeholdDeniedLineKey selector with
   the denied rows appended there. Register the NEW `housing-ward` target (scenes
   ward-square, ward-exterior, ward-roster, ward-busy-cap, ward-door and
   ward-move-review x desktop/compact/tablet: 18 variants, the 544 milestone)
   in ux-spec section 11 (housingReviewTargets), append the key rows to ux-spec section
   10, and regenerate ux-shot-manifest.json and ux-key-manifest.json in the same
   change; no stand-in art ships.
5. Proof: literal capacity/anchor fixtures, same-seed work-happened twin, world/facet/
   snapshot/command pins, reconnect descriptor and both-host collider checks. In
   disposable PG race final-slot claims and opposite moves, assert uniqueness/cap/
   membership preservation and bounded contention; record plans, query counts,
   maximum descriptor bytes and no per-tick SQL. Run perf tour and prove scheduler
   retirement and LOW actionable visibility.

Exact English keys this phase adds (D92: title case for titles and buttons, sentence
case for status rows; tooltips per docs/design/tooltip-writing.md). The visit action
reuses 18's gate prompt keys; a non-owner move request reuses denied.permission;
loading/unavailable rows are named here because common.loading names the home, not the
neighborhood:

| Key | Exact English |
| --- | --- |
| hudChrome.housing.ward.title | Neighborhood |
| hudChrome.housing.ward.roster | Neighborhood Roster |
| hudChrome.housing.ward.loading | Loading the neighborhood... |
| hudChrome.housing.ward.unavailable | The neighborhood roster is unavailable right now. |
| hudChrome.housing.ward.occupancy | {claimed} of {capacity} plots claimed |
| hudChrome.housing.ward.anchor | Guild anchor: {guild} |
| hudChrome.housing.ward.noAnchor | No guild anchors this neighborhood. |
| hudChrome.housing.ward.openGround | Open ground |
| hudChrome.housing.ward.door | Door of {owner} |
| hudChrome.housing.ward.privateDoor | A private home |
| hudChrome.housing.ward.move | Move Here |
| hudChrome.housing.ward.moveReview | Move your home to this neighborhood? Your plot and furnishings move with it. |
| hudChrome.housing.ward.movePending | Moving your home... |
| hudChrome.housing.ward.moved | Your home now stands in its new neighborhood. |
| hudChrome.housing.denied.wardFull | This neighborhood is full. Your home stays where it is. |
| hudChrome.housing.denied.wardBusy | This neighborhood is busy right now. Try again shortly. |
| hudChrome.housing.denied.wardSame | Your home is already in this neighborhood. |

INVARIANTS THIS PHASE MUST KEEP:
Every player-visible string, including error, aria, tooltip and empty-state text,
uses an English hudChrome.housing.* key and the formatters from src/ui/i18n.ts.
Tooltips follow docs/design/tooltip-writing.md. Reuse docs/freeholds/ux-spec.md and the
shared family/painter/window lifecycle, focus return, keyboard/gamepad, touch safe-area,
reduced-motion and graphics-fairness contracts; do not fork the theme. New paths,
symbols, wire fields, tables and tests under housing/freehold are PLANNED unless an
earlier completed ledger row owns them. Re-find every existing anchor in the tree.
No power sale, keystone/gear-intermediate/quickening-catalyst bill, new farm bed,
repossession or calendar destruction. Sim stays deterministic and token-free; all
server player events are keyed data. Coordinators compose siblings and never grow
past their pinned ceilings. Fresh tests use literal expectations and negative controls.


Out of scope:
Any behavior beyond these deliverables, any invented balance rate, and any production flag enable.

ACCOUNT AUTHORITY, CALENDAR AND RECOVERY ACCEPTANCE:
Consume 07b's single account lifecycle authority: NEW
server/freehold_lifecycle_db.ts::loadFreeholdLifecycle/loadFreeholdLifecycleProtectionPage/
advanceFreeholdLifecycleOnClient, coordinated by
server/freehold_lifecycle.ts::createFreeholdLifecycleCoordinator and the accepted
server/freehold_lifecycle_binding.ts::resolveFreeholdLifecycleBinding policy registry.
Capture authenticated observations before queues; committed monotonic transitions,
not authentication login or a plot-local last-seen field, authorize account grace.
Immutable multi-return history or lossless prefix facts cover dormant/foreign plots;
union overlapping lifecycle protection and service suspensions exactly, never sum
independent credits, force-write foreign plots or restart grace on an alt/plot switch.

07c's NEW server/freehold_arrival_db.ts::loadFreeholdArrivalTiers/
markFreeholdArrivalTierOnClient owns normalized account+tier marks, separate from
lifecycle and plot saves. Only the committed accepted-owner-entry insert winner
has first-tier eligibility. NEW arrivals may receive a private freshArrivalPresentation
directive; snapshot/resume/replay set it null even with firstTierAtAdmission history.
Commit-before-ACK can skip presentation; no exactly-once visible/audio promise and
no permanent receipt for routine visits. Second plots and transfers do not duplicate,
copy or clear account arrival marks or seller lifecycle history.

13/13a own shared source calendar/history/checkpoint evaluation. Preserve calendarId,
schemaVersion/resetPolicyId and immutable prepaid bill/rate/material/receipt identities
across foreign-realm claims and transfers. No rebinding to serving realm/browser zone.
Historical dependencies of durable condition/bill/credit effects must be irrevocably
finalized and read at consistent committed calendar/lifecycle revisions; unfinalized,
missing or unsupported coverage keeps the affected effect pending. A future-credit
purchase does not require future time to be finalized. Long absences/outages use
bounded indexed prefix probes, never lifetime scans or absent-day/week loops.
Calendar-only exclusive writers and compatible shared mutation readers follow 07a's
actual legacy touch-set proof; no invented reverse lock hierarchy. Current-generation
projection/ACK identity cannot regress after delayed loads or superseded delivery.
Server-only operator evidence, secrets and diagnostics never reach either owner or
visitor wire: explicit allowlist builders and distinctive sentinel tests prove it.

At a sale/ownership transfer, materialize the old owner's condition at the transfer
boundary from finalized original calendar/lifecycle history; preserve source calendar
and immutable credits, retain seller account history, and apply buyer lifecycle only
prospectively without copying grace. Unknown authority holds application for bounded
original-operation recovery/accepted compensation, never a replacement charge or
silent calendar reset. Current local custody/fence guards still apply.
Character deletion, soft deactivation, restoration, true account deletion and export
are separate: deactivation is not an FK cascade; restored history/credits/receipts keep
their meaning. Explicit housing export loaders expose allowed facts only. Unknown or
oversized originals remain durable/read-only with bounded diagnostic/reference, not
empty/new-home defaults or filtered destructive arrival-set rewrites.
07's persistence-rollout-contract.md and 07b's lifecycle-policy-binding.md/
lifecycle-db-contract.md plus 13a's upkeep-calendar-db-contract.md name minimum
capable releases, measured bounds, exact schema/save fixtures and accepted policies.
Enable only a proven capable rollout; unchanged normalized rows do not prove an old
binary implements lifecycle, export or saves. Rollback quiesces NEW effects and
preserves accepted original-operation recovery identities and supported recovery.
Each consuming implementation/QA runs relevant two-character/two-plot/two-realm,
dormant-history, delayed-generation, finality/transfer, deactivation/restore/export
and capable/uncapable-release fixtures through real composition and disposable PG.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_wards.test.ts
  tests/freehold_determinism.test.ts tests/dungeons.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/env_protocol.test.ts tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/renderer_compile_gate.test.ts tests/pr_shot_targets.test.ts
  tests/localization_fixes.test.ts tests/server/freehold_wards_db.test.ts
  tests/server/main_retention_wiring.test.ts`; the pg-armed twin with TEST_DATABASE_URL
  set; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`;
  `npm run perf:tour`; parity goldens if regenerated.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, render-performance-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  Database review runs before decisions and again on the completed diff. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] The approved geometry manifest proves claim footprint, arrival paths and deterministic anchor; 50 plots and 24 admitted occupants are literal-pinned and no admitted entity is culled.
- [ ] Disposable-PG final-slot/opposite-move races preserve every membership and item; indexed bounded candidates and stable lock order pass recorded plans and contention checks.
- [ ] Opaque plot descriptors round-trip/re-send on resume, preserve malformed prior state, and produce identical colliders/exteriors on both hosts; current ACL governs every door.
- [ ] Final exterior art, LOW fairness and desktop/compact/tablet ward/door/busy screenshots meet ux-spec; no live-program events or retired scene leaks; the `housing-ward` target (ward-square, ward-exterior, ward-roster, ward-busy-cap, ward-door, ward-move-review) and the ward key rows are registered and both manifests regenerated in this phase's commits (D92).
- [ ] A flagged owner and a flagged ward neighbour in the same ward are not hostile,
  through the real sim hostility arm and the client verdict (src/ui/pvp_hostile_core.ts):
  the ward is a World PvP sanctuary (tests/freehold_world_pvp_sanctuary.test.ts).
- [ ] All validation, actual-surface reviews, fresh fix review and contribution gate pass.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 34 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-34-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
