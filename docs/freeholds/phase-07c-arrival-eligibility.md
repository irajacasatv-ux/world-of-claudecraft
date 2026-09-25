# Phase 07c: account first-tier arrival eligibility

Wave A. The settled decisions in state.md, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md govern this work. The artifacts
and tests named below are NEW unless the context inventory labels them EXISTING.
No housing implementation is claimed complete by this planning file.

### Starter Prompt
```
This is Phase 07c of the Freeholds and Guildhalls feature: account first-tier arrival eligibility.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out.
This prompt names no model. Keep independent implementation owners disjoint; the parent
integrates shared callers and pins after their reports return.

Goal: Commit at-most-once account-wide first-tier eligibility and distinguish immutable history from a fresh presentation directive.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Sync per state.md "Worktree, base, and merge-forward": git fetch origin --prune;
  use the newest
  origin/release/**. Run release-merge-audit after any
  non-empty merge and pnpm install --frozen-lockfile when patches/ moved.
- Memory scan: MEMORY.md, freeholds entry, test-pin traps, apply ALL findings, and
  review the review-fix round. Record changed seam/ceiling/base facts in state.md before
  editing dependent code. Read each changed directory's CLAUDE.md.

STEP 1 - LOAD CONTEXT (through agents, never planning docs or coordinators directly):
- One Explore agent reads this file, its paired QA, state.md, the matching progress row,
  implementation-plan.md review table, ux-spec.md and the three content/art artifacts.
- It reads the following existing seams and prior outputs, returning exact exports,
  readers/writers, pin sites, known failure behavior and a promised-versus-tree table:
  - EXISTING server/db.ts::ensureSchema/exportAccountData and touchLogin;
    server/account.ts::handleAccountDeactivate and server/character_delete_db.ts;
    server/periodic_save_flush.ts::PeriodicSaveWrites/runPeriodicSaveFlush,
    the exported GameServer class in server/game.ts and its join/leave/saveAll members,
    server/main.ts shutdown wiring,
    server/linkdead.ts::planJoin and the async server/ws_auth.ts authentication shell.
    Verify actual symbols from state facts; auth/analytics are not gameplay presence.
  - EXISTING server/character_save_statement.ts::runFencedCharacterSave,
    server/character_save_transaction.ts::beginCharacterSaveTx, server/serial_writer.ts,
    server/background_db_gate.ts, server/raid_reset.ts and server/realm.ts.
  - PRIOR 07 plot load/preservation and 07a transaction/claim/operation foundation.
    Read current source-supported reset policy and the accepted binding artifact; never
    use the serving realm or auth last_login as an implicit account policy assignment.
- Reports go to the session scratchpad; replies carry a path and short summary.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
1. NEW server/freehold_arrival_db.ts owns FREEHOLD_ARRIVAL_SCHEMA,
   loadFreeholdArrivalTiers and markFreeholdArrivalTierOnClient. Normalize private
   account_freehold_arrival_tiers(account_id, tier_id) with account-leading composite PK
   and account-delete FK cascade (permitted under D88 because marks are not operation
   rows; an open 07a operation still blocks the deletion with the mapped class).
   Writer-accepted tier vocabulary is separately pinned
   from stored-ID preservation: old/future identifiers are never removed by a filtered
   whole-set rewrite. Read at most supported tier count plus bounded diagnostics under
   account single-flight; unsupported owned rows remain intact. No plot arrival array.
2. markFreeholdArrivalTierOnClient uses INSERT ON CONFLICT DO NOTHING RETURNING inside
   07a's accepted-owner-entry transaction. Only the committed insert winner receives new
   first-tier eligibility; rollback creates none. Current account/session/plot authority
   and accepted transition precede insertion; guest/rejected entry and confirmed-seen
   ordinary returns write nothing. Include real unique/FK waits in the 07a touch-set map.
   Cold load is one account-indexed query, eligible attempt one conflict-safe insert,
   and tick/snapshot/render completion zero SQL. No permanent receipt per routine entry.
3. Define the private arrival result as acceptedTransitionId, destination public plot ID,
   confirmed dungeonEntrySeq, historical firstTierAtAdmission and explicit nullable
   freshArrivalPresentation. Its NEW FreeholdArrivalPresentation value carries the
   same acceptedTransitionId, playWelcomeCue: true and firstTierViewEligible boolean.
   Each NEW accepted owner/visitor arrival may carry the ordinary welcome cue; only
   the committed newly inserted owner tier can set firstTierViewEligible true.
   Snapshot/resume/replay always set freshArrivalPresentation null, preserving history. A positive historical fact is NOT a replayable permission.
   firstTierAtAdmission and any stored when-it-happened stamp are utcDay/epoch
   provenance, never a realm-day rollover fact; nothing in this table is day-keyed (D84).
   The committed winning newly accepted owner transition may issue the first-tier
   directive once; replay/resume preserves identity/history but emits no new directive
   or welcome cue, including on a new client. Distinct ordinary accepted returns may
   issue their ordinary cue once. Commit-before-ACK gives at-most-once eligibility:
   a crash can skip an optional view; no exactly-once visual completion guarantee.
4. The Sim account/fixture arrival set is a private bounded mirror, excluded from plot
   serialization and public descriptors; it installs only from committed results, and a
   rolled-back attempt leaves it unchanged so the next attempt on the same process is
   still made. Offline/headless use isolated in-memory account
   or entity fixture identity and deterministic accepted-transition injection, persisting
   nothing. They do not derive identity from wall time or share browser fixture authority
   with online accounts. The 05 dev bridge/tier setter (D81) remains authoritative for
   fixture permission; neither mirror nor render completion grants a paid receipt/tier.
   08a owns transport and 09 consumes the fresh directive with normal UX/input/SFX rules.
5. NEW tests/server/freehold_arrival_db.test.ts and freehold_arrival_db.pg.test.ts plus
   tests/freehold_arrival_authority.test.ts prove two-plot/two-process same-tier winner,
   distinct-tier survival, rollback then same-process retry (the mirror stays unchanged
   and the retried insert wins), commit-before-ACK crash, new-client resume/replay,
   offline/account isolation, guest/rejected no-write and no visual-completion mutation.
   Export private account marks with safe explicit loader, preserve on character delete,
   sale/transfer and soft deactivation, reuse on restore, cascade true account deletion.
   Pin query counts/real unique+FK contention, unknown stored-ID preservation and bounded
   metrics. The global marker never inherits a buyer or seller plot revision.

INVARIANTS AND CLOSED HANDOFFS:
- Preserve all prior owned/protection/replay state. Unsupported future fields/versions
  stay unchanged and read-only; absent pre-feature state alone gets an empty default.
- Keep body/query/row/byte/admission/transaction bounds tied to measured approved artifacts,
  not invented literals. Hydrate before queues; queues hold no DB client. Use the actual
  07a legacy touch-set composition, including FK/unique/deferred effects and maintenance;
  never introduce a universal replacement lock order or a new pool/listener.
- Final activation requires the named capable-release/binding artifacts. An old binary
  leaving new tables untouched does not implement housing presence, export or recovery.
  Rollback quiesces mutation and preserves original recovery identities; no destructive
  downgrade, old-shape rewrite or deletion can erase protection/custody.
- This is committed first-tier eligibility, never a visible-completion ledger. Keep the
  account lifecycle/absence store separate; neither feature's history authorizes the other.
- 08a encoders allowlist only required safe arrival facts/directives. Full tier sets,
  account keys, operator evidence, service secrets and recovery diagnostics never enter
  public or private player wire. Distinctive sentinel tests exercise actual encoders.
- A cached seen result may suppress work but cannot grant eligibility; one durable insert
  authority decides cross-process races. Fresh directives belong to the actual accepted
  transition, not current join time, resumed historical hints or later art readiness.
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
- npx tsc --noEmit; npx vitest run tests/server/freehold_arrival_db.test.ts
  tests/freehold_arrival_authority.test.ts tests/freehold_state.test.ts
  tests/architecture.test.ts tests/world_api_parity.test.ts. (08 creates
  tests/freehold_determinism.test.ts; it is not run here.)
- With TEST_DATABASE_URL set for the disposable private schema, npx vitest run
  tests/server/freehold_arrival_db.pg.test.ts tests/server/freehold_mutation.pg.test.ts.
- Verify literal query counts and actual mark outcomes under concurrent connection/process
  fixtures, account deletion/FK waits and rollback. Reconnect a new client after historical
  positive acceptance and assert zero new directive/cue rather than trusting client cache.
- Run actual export/account/character lifecycle, SimContext/headless and encoder suites
  found by the source census, plus all 05 bridge fixture tests affected by the mirror.
- Invoke database-performance-reviewer before database/workload decisions and on the
  finished diff whenever this file touches SQL, storage shapes, queues, locks or growth.
- Required COVERAGE reviewers: database-performance-reviewer, migration-safety, privacy-security-review, server-hot-path-reviewer, architecture-reviewer, cross-platform-sync, test-coverage-auditor, qa-checklist.
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
- [ ] One account+tier insert authority wins across all plots/realms and preserves unknown
  stored identifiers; no plot save, guest, render callback or routine receipt owns marks.
- [ ] History and fresh directives are distinct; restart/new-client replay does not remint
  camera/audio and the documented commit-before-ACK crash can skip only the optional view.
- [ ] Account lifecycle, ownership/transfer/deletion/restore, private encoder and offline
  fixture boundaries pass actual tests, including PG unique/FK waits and query bounds.
- [ ] 08a/09 consume the named contract and every required review/fix-round gate passes.
- [ ] All scoped checks and the shared contribution gate passed, every required review
  returned, and the independent fix review found no remaining finding.

STEP 6 - DOC UPDATES + MEMORY:
- Update progress.md row 07c and state.md's implementation ledger with exact files,
  exported symbols, schema/wire/command keys, measured bounds, artifacts and evidence.
  Keep planning "settled" distinct from implementation "built". Record no anonymous
  deferral; carry every named unsigned release gate when applicable.
- Record useful traps in the freeholds memory entry within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
End with status, files, commands/outcomes, review verdicts, release evidence still required,
and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07c-qa.md

STOPPING RULES:
- Preserve unrelated user work. Stop for an unapproved destructive schema change or a
  required raised monolith ceiling; explain the exact constraint and concrete evidence.
- If a required artifact or runtime proof fails, record FAIL and repair it; do not claim
  approval, invent numbers or silently waive checks. Never push or open/merge a PR.
```
