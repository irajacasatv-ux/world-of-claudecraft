# Phase 08a QA: audit public descriptors and consumer-correct wire state

Audits [phase-08a-descriptor-and-wire.md](phase-08a-descriptor-and-wire.md). The implementation's exact five-or-fewer deliverables,
state.md decisions and ux-spec.md are the acceptance contract.

### Starter Prompt
```
This is Phase 08a QA of the Freeholds and Guildhalls feature: public descriptors and consumer-correct wire state.
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
- An Explore agent reads phase-08a-descriptor-and-wire.md, state.md, ux-spec.md, the content/art manifests,
  matching progress row and all actual implementation commits including the complete
  diff, tests and artifacts. It reports to a scratch file: promise/evidence matrix,
  new symbols and real consumers, mutation/authority paths, literal pins and missing arms.

STEP 2 - AUDIT:
- Spawn independent CORRECTNESS, TEST COVERAGE, and DEAD CODE/HYGIENE readers. Every
  report goes to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT and no
  filtering of nits or uncertain issues. Apply this exact coverage inventory:
  - Inspect all owner and guest frames, including error/hidden/null/initial/resume
    branches: public identity must be opaque and private bag/vault/receipt/account/guild
    data, ghost/history and hidden trophy spoilers must never appear.
  - Attach a second consumer at the same revision, attach at empty/revision 0, switch between
    equal-layout plots with different origin/claim, leave then receive an old frame,
    and reconnect. Verify correct initial delivery, relocation, clear and stale refusal.
  - Test type and size guards before deep work, independent input-array mutation,
    malformed-row atomic retention, absent/null semantics and out-of-order epochs.
  - Drive each real command frame through ClientWorld -> dispatcher -> 07a commit ->
    descriptor mirror. Assert every field by literal and a can-fail rename/control.
  - Remeasure ALL_DELTA_KEYS/count/rename/source-scrape, both-host facet pins and maximum
    descriptor bytes. Query/event/serialization counters prove no repeated shared
    serialization or per-viewer/per-tick database work; scope private feedback correctly.
- Required domain COVERAGE review: cross-platform-sync, privacy-security-review,
  server-hot-path-reviewer, architecture-reviewer, database-performance-reviewer (the
  PRIOR 07 loadFreeholdHearth and PRIOR 07c loadFreeholdArrivalTiers reads composed on
  resume; no new query), migration-safety (the mirror stored-shape and wire decode
  back-compat), test-coverage-auditor, qa-checklist.
  Database performance runs before new DB decisions and on the finished diff. Parent
  runs deterministic gates once; reviewers inspect their evidence.

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

PRIVATE ACCOUNT HEARTH MIRROR:
Owner-only fhold/myFreehold.hearthKeyReadyAtMs and hearthKeyRevision come from the
committed account Hearth participant in 07/07a. They are presentation data, never plot
persistence or entry authority. Resume hydrates the current account revision; delayed
older snapshots cannot reset it. Visitors and public descriptors receive neither field.
Exact wire sentinels and serialization/transfer exclusions prove that separation.

Verify exact server/heavy_self.ts exports HEAVY_SELF_CMDS,
HEAVY_SELF_ARM_MARKED_CMDS and HEAVY_SELF_EVENTS against changed source fields.
Presence-only public changes never invent a private heavy-field mutation or serialization.

STEP 3 - VALIDATION:
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
- Record progress.md 08a QA verdict PASS or FAIL, all found/fixed counts, commands,
  evidence and remaining external release gates. Update state ledger for changed facts.
- Preserve useful freeholds/test-pin memory within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
Return verdict, counts, files, commands/outcomes and reviewer verdicts, then the FULL PATH:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-09-render-furnishings.md

STOPPING RULES:
- FAIL names phase-08a-descriptor-and-wire.md as the next rerun with findings attached. Never waive a required
  check or silently invent a balance value. No push, opened PR or PR merge.
```
