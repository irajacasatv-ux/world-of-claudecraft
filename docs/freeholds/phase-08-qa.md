# Phase 08 QA: audit bounded placement and session undo/redo

Audits [phase-08-layout-and-placement-sim.md](phase-08-layout-and-placement-sim.md). The implementation's exact five-or-fewer deliverables,
state.md decisions and ux-spec.md are the acceptance contract.

### Starter Prompt
```
This is Phase 08 QA of the Freeholds and Guildhalls feature: bounded placement and session undo/redo.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block and its effort/fan-out rules.

Goal: verify every promised behavior and artifact, apply ALL findings including nits,
and have a second fresh reviewer verify the fix round before recording a verdict.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Follow state.md "Worktree, base, and merge-forward": fetch origin --prune; merge the
  current feature/masterwrought while PR #3872 is open, otherwise newest release/**;
  release-merge-audit after non-empty merge and frozen install if patches/ moved.
- Read root/directory CLAUDE.md. Memory scan: MEMORY.md, freeholds entry, test-pin traps,
  apply ALL findings, review the review-fix round. Preserve unrelated work.

STEP 1 - LOAD CONTEXT (agents only for planning docs and coordinators):
- An Explore agent reads phase-08-layout-and-placement-sim.md, state.md, ux-spec.md, the content/art manifests,
  matching progress row and all actual implementation commits including the complete
  diff, tests and artifacts. It reports to a scratch file: promise/evidence matrix,
  new symbols and real consumers, mutation/authority paths, literal pins and missing arms.

STEP 2 - AUDIT:
- Spawn independent CORRECTNESS, TEST COVERAGE, and DEAD CODE/HYGIENE readers. Every
  report goes to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT and no
  filtering of nits or uncertain issues. Apply this exact coverage inventory:
  - Exercise every finite/NaN/unsafe coordinate, wrapped/lattice yaw, room-edge and
    rotated-footprint arm, solid overlap, rug underlay, plinth/decor/amenity cap and
    maximum legal/one-over byte/row layout. Required doors, arrival paths and live
    occupants cannot be blocked by an accepted edit.
  - Drive each command through the Sim delegate and server dispatcher. Lock/consume
    exact copies in adversarial order; every refusal preserves bags, layout, history,
    durable/wire revisions and operation receipts. Condition 0 cannot gate placement.
    Assert the first successful placement raises homesteader_first_furnishing through
    src/sim/deeds.ts::grantDeed exactly once per character in both hosts (online only
    after the 07a commit); a refused plan, an undo and a second placement raise nothing
    new, and the deed grants no power (cosmetic renown and title only, per the manifest).
  - Undo/redo confirmed operations, then spend/lock a returned copy, change plot/session,
    interleave an owner's other session or revoke ownership. Stale inverses never mint
    copies; expected revisions advance through ordinary history without false refusal.
  - Inspect 07a integration and real-PG crash/race evidence. ACK follows durable commit,
    stale fencing refuses, retry uses the same operation ID and no separate autosave is
    passed off as atomicity. Match the source-frozen physical/calibration manifests.
  - Verify 08a exclusively owns descriptor/mirror/snapshot transport, 11 owns Wave A
    capacity UI and redo is already live. No full-axis/scale/leniency mode slips in.
- Required domain COVERAGE review: architecture-reviewer, cross-platform-sync, database-performance-reviewer, migration-safety, server-hot-path-reviewer, privacy-security-review, test-coverage-auditor, qa-checklist.
  Database performance runs before new DB decisions and on the finished diff. Parent
  runs deterministic gates once; reviewers inspect their evidence.

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

STEP 3 - VALIDATION:
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
- Run every scoped command listed in the implementation file and node scripts/gate_select.mjs.
  A skipped PG suite is not a pass. Assert work happened, use literal expected outcomes,
  include controls that pass when a rejected precondition is removed, and never derive
  expected values from the production object under test.

STEP 4 - FIX:
- Apply ALL findings including nits; document a conflict with a locked decision and its
  ruling rather than silently dropping it. Rerun affected checks and a FRESH reviewer
  reads every fix, including evidence or screenshot changes. Commit fixes separately
  with scoped Conventional Commits and a body, explicit paths, never git add -A, no
  coauthor trailer and no word "phase" in messages. npm run ci:changed after last commit.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every implementation acceptance row has concrete passing evidence.
- [ ] All findings were resolved, and a fresh reviewer verified the entire fix round.
- [ ] Shared gate and mandatory scoped runtime/visual proof passed with exact outcomes.

STEP 6 - DOC UPDATES + MEMORY:
- Record progress.md 08 QA verdict PASS or FAIL, all found/fixed counts, commands,
  evidence and remaining external release gates. Update state ledger for changed facts.
- Preserve useful freeholds/test-pin memory within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
Return verdict, counts, files, commands/outcomes and reviewer verdicts, then the FULL PATH:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-08a-descriptor-and-wire.md

STOPPING RULES:
- FAIL names phase-08-layout-and-placement-sim.md as the next rerun with findings attached. Never waive a required
  check or silently invent a balance value. No push, opened PR or PR merge.
```
