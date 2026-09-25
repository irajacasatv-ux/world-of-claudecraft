# Phase 08a: public descriptors and consumer-correct wire state

Wave A. The settled decisions in state.md, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md govern this work. The artifacts
and tests named below are NEW unless the context inventory labels them EXISTING.
No housing implementation is claimed complete by this planning file.

### Starter Prompt
```
This is Phase 08a of the Freeholds and Guildhalls feature: public descriptors and consumer-correct wire state.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out.
This prompt names no model. Keep independent implementation owners disjoint; the parent
integrates shared callers and pins after their reports return.

Goal: deliver committed housing state to each real consumer once, privately and within measured bounds, with decisive command/snapshot-chain proof.

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
  - PRIOR 08 placement/state/history, PRIOR 07 stable opaque plot ID and 07a committed
    operation boundary; PRIOR 01 src/world_api/housing.ts and freehold_snapshot_wire.ts.
  - EXISTING server/bank_wire.ts::emitBankSelfKeys, server/farming_commands.ts,
    server/heavy_self.ts, server/event_frame.ts::filterRoutableEvents and
    server/game.ts selfWireJson and riftStateEventFor resume composition (agent only).
  - EXISTING src/net/bank_snapshot_wire.ts allowlist/malformed policy,
    src/net/online.ts applyRiftStateEvent/applySnapshot (agent only),
    src/net/CLAUDE.md wire-decode sibling rules; tests/helpers/bare_client.ts.
  - EXISTING file-local ALL_DELTA_KEYS/TERSE_TO_IWORLD pins in tests/snapshots.test.ts
    and extracted-emitter
    scrape, tests/bandwidth.test.ts, tests/farming_command_chain_online.test.ts,
    tests/world_api_parity.test.ts and tests/command_schema.test.ts.
- Reports go to the session scratchpad; replies carry a path and short summary.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
1. Define freeholdState and private fhold models in src/world_api/housing.ts and the
   SimEvent union. Public descriptor contains opaque plotId, active arrival/session
   identity, tier, origin, public layout rows and safe condition/build/occupancy summaries;
   NEVER raw ownerKey/account/guild IDs, private bag/vault counts, ledger/payment data,
   source eligibility, ghost/history or unrevealed trophy spoilers. Owner private fhold
   remains their own record while visiting another plot; the active public descriptor
   separately says isOwner/canBuild. Shared public source projection is built once per
   committed public revision; viewer-specific fields are applied after authorization.
2. Add NEW server/freehold_wire.ts::emitFreeholdSelfKeys (beside PRIOR 01's
   dispatchFreeholdCommand) and NEW src/sim/freehold/instance.ts::freeholdStateEventFor.
   Emit after confirmed entry/change,
   on resume/full refresh and explicit clear on leave/session end. A signature belongs to
   the actual receiving consumer/session, never shared globally across recipients; include
   plot identity, claim/arrival epoch and relevant public/private revision. Every new
   consumer gets an initial snapshot even when state is empty or revision 0. Reconnect
   invalidates the signature. Unchanged hot paths allocate/serialize no shared payload.
   Lazy condition/day transitions (realm-day facts in the resetDay vocabulary, D84)
   notify once through authority revisions, not per-tick SQL or repeated full
   serialization. Private feedback is pid-scoped; guest descriptors
   contain only accepted revisions and the allowlisted freeholdState.isDecorating boolean from 08 authority.
3. Fill the PRIOR 01 skeleton src/net/freehold_snapshot_wire.ts with NEW
   decodeFreeholdSelfWire/applyFreeholdStateEvent (owned here; 10 consumes
   applyFreeholdStateEvent) behind a structural mirrors slice,
   DOM-free and ClientWorld-free. Closed allowlists bind both directions; bound encoded
   size/rows/strings before deep allocation. Reject malformed/stale/wrong-plot/old-epoch
   frames atomically, retaining the last valid state with one dev warning; null clears,
   absent is unchanged. A leave-generation prevents a late async frame reopening a plot.
   Future schema is not normalized into an empty owned house. Expose valid received
   state to both hosts through the same facet without aliases to mutable input arrays.
4. Wire every real ClientWorld command payload, session resume and immediate event arm;
   update HEAVY_SELF_CMDS/HEAVY_SELF_ARM_MARKED_CMDS/HEAVY_SELF_EVENTS as actual dirty fields require.
   fhold -> myFreehold enters ALL_DELTA_KEYS, fresh count, TERSE_TO_IWORLD and round-trip
   pins together. Add the extracted emitter module to the snapshot source scrape if its
   shape requires it. No false hardcoded key count and no event-routing broadcast of
   owner-only data. Build ack operation IDs correlate with 08/07a committed results.
5. NEW tests/freehold_snapshot_wire.test.ts and freehold_command_chain_online.test.ts
   drive a real ClientWorld stub socket frame verbatim into server.handleMessage and back
   through snapshots. Test all five placement verbs and every payload field, owner/guest
   isolation, multi-session first reads, identity switch with equal revision/layout,
   empty initialized snapshots, stale/out-of-order/null/absent/resume behavior, strict
   decoder bounds and unchanged serialization counts. tests/bandwidth.test.ts records
   largest legal public/private descriptor bytes from the approved workbook fixtures.

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

<!-- core-ux-arrival-identity:start -->
ACCOUNT ARRIVAL AND PRIVATE PROJECTION CONTRACT:
- 07c owns normalized account+tier committed first-tier eligibility through 07a; 07b
  owns account lifecycle/history. Neither source is a plot-save array or renderer state.
- Preserve acceptedTransitionId, destination public plot ID and confirmed dungeonEntrySeq.
  Keep historical firstTierAtAdmission separate from nullable freshArrivalPresentation.
  Its FreeholdArrivalPresentation carries acceptedTransitionId, playWelcomeCue: true
  and firstTierViewEligible. A NEW owner/visitor acceptance may carry ordinary welcome;
  only an owner winning the committed tier insert may set firstTierViewEligible true.
  Snapshot/resume/replay always set freshArrivalPresentation null. Reconnect/replayed historical positive acceptance, including
  on a new client, emits no new directive or welcome cue. Distinct accepted ordinary
  returns may issue their ordinary cue once. Cosmetic callbacks never mint authority.
- Commit-before-ACK is at-most-once eligibility: a crash may skip the optional view.
  No visible-completion guarantee or permanent routine-entry receipt is introduced.
- Allowlist both self/private and public encoders: no full mark set, account keys, operator
  evidence, service secret or recovery diagnostics. Test distinctive evidence sentinels
  through actual frame encoders and decoders, not merely a type-level omission.
- Install committed lifecycle/calendar projections only for the current generation and
  consistent nonregressing revision/finality/coverage. v1 load after v2 install and stale
  historical duplicate cannot regress state or ACK false installation. Calendar 13a
  distinguishes requested revision from explicit newer installed revision/digest.
- Required database-performance-reviewer before design and on the finished diff,
  migration-safety and privacy-security-review cover source scope, bounds/defaults,
  actual mark commit, encoder privacy and new-client replay. Authority owns calendar
  meaning; locale formatting never changes original source identity or billing facts.
<!-- core-ux-arrival-identity:end -->

INVARIANTS AND CLOSED HANDOFFS:
- Public identity starts in 07; raw account keys are host facts only. Ownership policy
  is checked at authority, never inferred from a public ID or cached descriptor.
- Build intent/ghost/history remain local to the builder. Guests see accepted revisions
  and an informational decorating status; the same public model prepares future generic
  trophies/provenance and owner farm tableau without exposing the viewer's private data.
- Initial delivery is a state transition distinct from an unchanged subsequent revision.
  Include plot/origin/claim identity in consumer signatures; equal row arrays in another
  room cannot elide relocation or teardown. No newly attached consumer starts stale.
- Strict malformed behavior preserves valid owned state and prevents oversized parse
  work. Inactive/leave clears public state, colliders and future render generation;
  owner-private fhold is cleared only under its own account/session lifecycle.
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

PRIVATE ACCOUNT HEARTH MIRROR:
Owner-only fhold/myFreehold.hearthKeyReadyAtMs and hearthKeyRevision come from the
committed account Hearth participant in 07/07a. They are presentation data, never plot
persistence or entry authority. Resume hydrates the current account revision; delayed
older snapshots cannot reset it. Visitors and public descriptors receive neither field.
Exact wire sentinels and serialization/transfer exclusions prove that separation.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- npx tsc --noEmit; npx vitest run tests/freehold_snapshot_wire.test.ts
  tests/freehold_command_chain_online.test.ts tests/server/freehold_wire.test.ts
  tests/freehold_determinism.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts tests/command_facets.test.ts
  tests/architecture.test.ts tests/monolith_budget.test.ts tests/env_protocol.test.ts
  tests/localization_fixes.test.ts.
- Capture query/event/serialization counts for owner, guest and resumed sessions with
  maximum legal descriptor fixtures, including first consumer at revision 0, then unchanged
  update. Rerun related parity scenarios; regenerate only changed sampled payloads in
  their own commit. No DB query may be introduced by rendering or per-viewer serialization.
- Stored surface this phase touches (no new query or DDL): the PRIOR 07
  loadFreeholdHearth and PRIOR 07c loadFreeholdArrivalTiers reads composed on resume
  (bounded single-flight account reads owned there) and the private mirror's
  stored-shape decode. Invoke database-performance-reviewer before those read/workload
  decisions and on the finished diff.
- Required COVERAGE reviewers: cross-platform-sync, privacy-security-review,
  server-hot-path-reviewer, architecture-reviewer, database-performance-reviewer (the
  composed loadFreeholdHearth and loadFreeholdArrivalTiers reads above), migration-safety
  (the mirror stored-shape and wire decode back-compat), test-coverage-auditor,
  qa-checklist.
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
- [ ] All five command payloads round-trip through the real chain with literal field
  pins; ACK maps to the original committed operation. All snapshot registry/count/rename
  and source-scrape pins are current and both worlds satisfy the facet.
- [ ] No public frame leaks account/guild keys, private materials/receipts/source data,
  unconfirmed ghost/history or hidden provenance. Owner-private and visited public data
  remain separate, with authoritative canBuild/isOwner projection.
- [ ] Every consumer gets the first empty/revision 0 state, plot switches with equal layouts
  relocate correctly, resume resets signatures, and unchanged updates serialize no
  repeated shared payload. Public condition/build changes update the right recipients.
- [ ] Strict decoders reject each bad dimension/oversize/stale epoch atomically; null
  clears, absent preserves and late leave/session frames cannot resurrect a plot.
- [ ] Maximum legal public/private byte fixtures and query/event/serialization metrics
  satisfy the measured bound manifest; no per-tick or per-viewer database work exists.
- [ ] All scoped checks and the shared contribution gate passed, every required review
  returned, and the independent fix review found no remaining finding.

STEP 6 - DOC UPDATES + MEMORY:
- Update progress.md row 08a and state.md's implementation ledger with exact files,
  exported symbols, schema/wire/command keys, measured bounds, artifacts and evidence.
  Keep planning "settled" distinct from implementation "built". Record no anonymous
  deferral; carry every named unsigned release gate when applicable.
- Record useful traps in the freeholds memory entry within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
End with status, files, commands/outcomes, review verdicts, release evidence still required,
and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-08a-qa.md

STOPPING RULES:
- Preserve unrelated user work. Stop for an unapproved destructive schema change or a
  required raised monolith ceiling; explain the exact constraint and concrete evidence.
- If a required artifact or runtime proof fails, record FAIL and repair it; do not claim
  approval, invent numbers or silently waive checks. Never push or open/merge a PR.
```
