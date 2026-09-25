# Phase 07: bounded persistence and stable plot identity

Wave A. The settled decisions in state.md, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md govern this work. The artifacts
and tests named below are NEW unless the context inventory labels them EXISTING.
No housing implementation is claimed complete by this planning file.

### Starter Prompt
```
This is Phase 07 of the Freeholds and Guildhalls feature: bounded persistence and stable plot identity.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out.
This prompt names no model. Keep independent implementation owners disjoint; the parent
integrates shared callers and pins after their reports return.

Goal: preserve every owned plot across restart with stable identity, bounded load/save work and mixed-release recovery; keep cross-record transfers dark until 07a.

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
  - EXISTING server/db.ts ensureSchema/exportAccountData; server/ws_auth.ts injected
    bankBonusForAccount callback; the server/main.ts binding of that callback over
    computeBankBonus and bankBonusFactsForAccount (re-verify its exact closure at phase
    start after merge-forward: the release branch widens the return to include
    characterCount); server/bank_entitlements.ts; server/CLAUDE.md.
  - EXISTING server/serial_writer.ts::createKeyedSerialWriter,
    server/periodic_save_flush.ts::runPeriodicSaveFlush, server/background_db_gate.ts,
    server/db_connection_budget.ts, server/cached_read.ts, server/guild_bank_lazy_loader.ts.
    FIFO does not coalesce work; periodic saves are not cross-write atomicity.
  - EXISTING server/account_export_state.ts, server/character_delete_db.ts,
    server/retention_sweep.ts, server/concurrent_indexes.ts; private-schema PG test
    recipe in tests/server/storage_purchase_db.pg.test.ts.
  - PRIOR 01-06 src/sim/freehold/{types.ts,state.ts,instance.ts,hearth_key.ts,index.ts};
    EXISTING src/sim/professions/farm_persist.ts and farm_load_report.ts;
    src/sim/dev_commands.ts, server/sim_boot_config.ts, headless/CLAUDE.md;
    tests/monolith_budget.test.ts, tests/sim_context.test.ts and
    tests/professions_farming_state.test.ts.
- Reports go to the session scratchpad; replies carry a path and short summary.

<!-- core-bridge-context:start -->
BRIDGE SOURCE INVENTORY (verified engineering contract under approved D27-D75):
- The current offline src/main.ts constructor supplies devCommands: import.meta.env.DEV;
  it does NOT receive server ALLOW_DEV_COMMANDS. Read it through the Explore agent.
- EXISTING src/sim/types.ts::SimConfig and src/sim/sim_context.ts expose devCommands;
  server/sim_boot_config.ts uses the strict process.env.ALLOW_DEV_COMMANDS === '1'.
- EXISTING vite.config.ts::diagnosticsCapturePlugin, scripts/lib/diagnostics_capture_guard.mjs
  ::diagnosticsReadAllowed, the file-local defineConfigObject helper in tests/vite_dev_watch.test.ts,
  tests/dockerignore_context.test.ts and .dockerignore provide the exact Vite/loopback/
  config-shape/import-admission contracts. Installed Vite and official configureServer
  docs must still match when implementation begins; a DEV build alone is not proof of
  the local server endpoint. No preview or production middleware may expose it.
<!-- core-bridge-context:end -->

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
1. NEW server/freehold_db.ts::FREEHOLD_SCHEMA, FreeholdRow, freeholdForAccount and
   upsertFreehold. account_freeholds starts with primary key (account_id, plot_index),
   a unique opaque public plot_id, FK account deletion, schema_version and distinct
   durable_rev/wire_rev. Initially admit plot_index 0 only; 42 admits the second plot
   without changing identity. The same identity admits 38's furnished-plot transfer
   under D80 without change: the sold plot keeps its stable plot_id and moves to the
   buyer's plot_index 0 only while that record is tier 0, and the seller receives a
   fresh tier-0 record at index 0 with a new plot_id. Carry tier, layout/trophies
   JSONB, condition, visit_policy, updated_at and explicit upkeep binding state.
   Initial rows are unbound_no_history with no upkeep-derived day/week stamp or credit.
   Bound checkpoint/credit shapes retain source calendar/schema/reset-policy identity;
   every day-keyed fact they carry uses the realm-day resetDay vocabulary from
   resetDayKey over the zone the accepted binding's reset_policy_id resolves to (the D84
   realm reset zone, identical across realm processes, never the serving process's bare
   REALM_RESET_TIME_ZONE) and the emberWeekAnchorOf week, and any epoch-ms companion is
   display-only (D84). updated_at and the Hearth ready_at_ms below are
   ordering/authority timestamps, not calendar facts.
   07b owns account presence/absence/grace history and 07c owns account+tier marks; neither
   belongs to this plot row or its serialization. 13/13a own bound upkeep migration.
   Add idempotent shape CHECKs and a query/index inventory for account lookup,
   public-plot lookup, CAS and reverse FKs. No speculative ledger_paid_week index. The same storage output produces the separate
   account Hearth schema below; plot saves never write its committed private mirror.
2. src/sim/freehold/state.ts::normalizeFreehold/loadFreehold/serializeFreehold/evictFreehold
   and PersistedFreehold: deep-copy serialization and versioned load result distinguish
   absent legacy data, safely repaired known scalar, unsupported version, malformed
   owned content and oversize. Only ABSENT pre-feature data resolves to 05's in-memory
   tier-0 Inn Room record (D81); 07 persists that record without changing its identity
   and never creates a second default.
   Preserve unknown/newer/oversized owned rows in their original durable location, plus
   bounded diagnostics/reference; the bounded recovery metadata need not contain the
   oversized original. Never reinterpret unsupported checkpoint/credit shape as absence;
   expose read-only recovery instead of replacing or silently dropping possessions.
   Enforce content-derived rows/IDs/string/encoded-byte ceilings before deep allocation,
   mutation, save and decode. Publish the largest legal and over-limit fixtures in
   tests/freehold_state.test.ts and the measured bound rows in content-numbers-workbook.md.
3. NEW server/freehold_persist.ts owns bounded per-plot loading/saving: coalesce to one
   running write plus one pending dirty generation, serialize only inside admitted work,
   clear only the committed generation, reuse existing background admission/deadlines
   and pool. Fresh-join account lookup is bounded/single-flight and resumes reuse memory.
   Consume 07b committed account lifecycle revisions; plot saves never advance
   account presence or create return grace. Preserve explicit unbound/no-history until
   the accepted binding is committed; serving realm alone cannot reinterpret stamps. Stale durable CAS quiesces mutations and reconciles safely; never
   blindly overwrite acknowledged live state. 07a owns all cross-record commits.
4. Wire this plot save lifecycle into periodic dirty save, leave and shutdown; preserve dirty
   work on failure/cancellation. Evict only after active sessions/claims, in-flight
   operations and pending writes release references, so later offline-owner visitors
   retain the loaded plot. Export every private owned row/recovery artifact through the
   explicit table loaders wired into exportAccountData, not the existing character-only
   projector. Distinguish soft deactivation/restoration, hard deletion and anti-replay
   retention; soft deactivation preserves all rows, character deletion preserves account
   state, and true account deletion follows the service contract's "Identity and
   durable protocol" hard-deletion rule (nonidentifying anti-replay identity retained
   per the accepted retention schedule, an artifact of the "Counsel, Terms and
   storefront model" gate row) and 07a's per-row-class ON DELETE policy (D88): plot
   and Hearth rows cascade, and an open housing operation blocks the deletion with 07a's
   CharacterFreeholdOperationOpen class and its character.freehold_operation_open code.
   07b/07c extend these safe exports. Keep original operation
   identities through rollback quiescence.
   Report queue wait, dirty age, bytes, admission/pool wait, timeout/CAS/failure counts
   without player data. account_freeholds is bounded plots per account, keep-forever.
5. PRIOR 05 owns setFreeholdTier (the one tier writer), the default Inn Room record,
   the D24 /dev freehold <tier> fixture and the housing-only developer authorization
   bridge that places that command behind BOTH general devCommands and the separate
   nonpersisted freeholdDevGrantEnabled permission (D81; the modules are named in
   phase-05-instance-claim.md and re-verified below); this phase creates no second
   default, no second tier writer and no second bridge. It adds the persisted save
   behind the same setter and extends the PRIOR 05 tests/freehold_dev_grant.test.ts
   (SIM owner) and tests/freehold_offline_default.test.ts (INTEGRATION owner) with the
   persistence-absent arm: a fresh offline/headless Sim keeps 05's entity-keyed Inn
   Room record and persists nothing even when authorization fails. The exact
   authorization/constructor, real command and browser fixtures prove no direct tier
   injection or paid receipt.
   All fixtures use approved state numbers; ordinary generic dev behavior is unchanged. The separately flag-authorized server dev
   command still uses the ordinary tier setter and server save contract, without a
   browser-derived permission or invented paid service receipt.

ACCOUNT HEARTH AUTHORITY (C01, within existing schema/lifecycle outputs):
07 owns NEW server/freehold_hearth_db.ts with FREEHOLD_HEARTH_SCHEMA,
loadFreeholdHearth and advanceFreeholdHearthOnClient. The one account_freehold_hearth
row uses account_id as PK/FK, ready_at_ms and a monotonic revision. Initial absent
legacy state is ready with revision zero; lazy first-use row initialization uses an
account-keyed conflict-safe insert inside the admitted transaction, never a GET write; unsupported future data is preserved under
07's read-only recovery contract. Read one authoritative database epoch timestamp after
locking the account participant; clock regression cannot make an unready key eligible,
and accepted updates never decrease ready_at_ms or revision. Offline/headless use
isolated injected host-clock state and the same state.md duration, never online SQL.

Only 07a's accepted remote Hearth entry may check and advance this participant in the
same transaction as accepted entry effects. The cached private
fhold/myFreehold.hearthKeyReadyAtMs and hearthKeyRevision are committed UI mirrors,
excluded from serializeFreehold, plot autosave and transfer manifests. A cached value
never authorizes. Refused, already-home and physical-gate entry do not advance it.
Transfer copies or clears neither account's cooldown; every alt and later destination
uses the same account row. Character deletion preserves it; account export, soft
deactivation, restoration and true account deletion each have explicit tested handling.

Use bounded indexed account lookup and admitted single-flight mirror loads, actual
PK/FK wait inventory, keep-forever account row ownership and capability-aware rollout.
NEW tests/server/freehold_hearth_db.test.ts and freehold_hearth_db.pg.test.ts prove
same-account cross-alt/process/destination races, absent/unsupported load, rollback,
clock regression, stale UI revision, commit-before-ACK and lifecycle/export behavior.
This 07 pair proves the schema, load, account helper and lifecycle primitives now;
07a owns the subsequent accepted-entry composition and complete entry races.
Real-PG tests execute with TEST_DATABASE_URL; query/byte/lock evidence and before/final
DB, persistence and security review are required. No extra receipt per routine entry
or plot-keyed cooldown store is introduced.

<!-- core-dev-bridge:start -->
HOUSING-ONLY DEVELOPER BRIDGE (part of deliverable 5; PRIOR 05 APIs re-verified below,
D81; the persisted save behind setFreeholdTier is this phase's only NEW arm):
- The TOOLING owner re-verifies the PRIOR 05 scripts/lib/freehold_dev_authorization.mjs
  and scripts/lib/freehold_dev_authorization.d.mts exporting freeholdDevAuthorizationPlugin
  ({ enabled }) and a directly tested request predicate. It registers configureServer
  only with apply: 'serve'; never configurePreviewServer or a production/game route.
  The Vite composition passes enabled: process.env.ALLOW_DEV_COMMANDS === '1' and
  preserves literal defineConfig({ ... }), including its AST-pinned object shape.
  Re-verify the PRIOR 05 .dockerignore admission of that helper and declaration and the
  tests/dockerignore_context.test.ts obligation; no unrelated build context widening.
- The endpoint is exactly GET /__freehold/dev-authorization. Unrelated paths fall through;
  wrong methods, missing/disabled opt-in or failed diagnosticsReadAllowed socket+Host
  checks refuse. Test the real remoteAddress plus Host, not Origin/Host claims alone.
  Only an explicitly enabled loopback request returns the exact affirmative JSON
  {"freeholdDevGrantEnabled":true}, with JSON content type and Cache-Control: no-store.
  Read no account, tier, receipt, purchase or arbitrary environment data. There is no
  public VITE_* substitute and no preview/production endpoint, even with the shell flag.
- The BOOTSTRAP owner re-verifies the PRIOR 05 src/game/freehold_dev_bootstrap.ts
  exporting injected, testable resolveOfflineFreeholdDevGrant. Before the offline Sim
  construction, require import.meta.env.DEV and an HTTP(S) loopback DOCUMENT origin;
  otherwise do not fetch.
  Fetch only the same-origin endpoint without credentials, redirects or caching. Accept
  only the exact affirmative shape. Missing endpoint, HTML fallback, refused/malformed/
  failed/redirected/cancelled request resolves false and ordinary Inn initialization
  continues. Tie cancellation to the entry lifecycle, so a late reply cannot configure
  a different entry. Introduce no new timeout literal or additional cosmetic settle wait.
- The SIM owner keeps the PRIOR 05 readonly, nonpersisted SimConfig/Sim/SimContext
  freeholdDevGrantEnabled, default false, with its live context/fake-host pins, and adds
  the persisted save behind setFreeholdTier. The PRIOR 05 src/sim/freehold/dev_grant.ts
  gates the D24 fixture: it requires BOTH ctx.devCommands and this permission before
  calling setFreeholdTier; src/sim/dev_commands.ts contributes only thin delegation.
  Authorization stays outside the tier setter because independent legitimate service
  effects use it too. server/sim_boot_config.ts sets the housing permission from the
  same exact server flag, preserving its existing general-dev policy. Neither permission
  alone suffices. The browser permission is for this offline Sim only, never a user
  setting, local/query storage flag, UA/window.__game override, paid receipt or online
  authority; offline developer fixture tiers never become online persisted ownership.
- The INTEGRATION owner re-verifies the PRIOR 05 bootstrap composition before the
  existing offline constructor, pays any src/main.ts/src/sim/sim.ts additions through
  behavior-preserving sibling extraction and lowered/rechecked monolith ceilings,
  updates SimContext pins and owns real browser
  command proof. Generic /dev commands and ordinary Inn startup are unchanged.
  Reviewable launch: ALLOW_DEV_COMMANDS=1 npm run dev -- --host 127.0.0.1.
  Screenshot setup first calls existing assertLoopbackUrl, invokes the real
  /dev freehold cottage chat route and reads ordinary world state; no direct setter,
  fake receipt, window.__game mutation or second offline entry is an authorization path.

BRIDGE VALIDATION AND REVIEW EVIDENCE:
- Extend the PRIOR 05 tests/freehold_dev_authorization.test.ts and
  tests/freehold_dev_bootstrap.test.ts with the persistence-absent arm; they already
  cover exact flag 1 versus unset/0/other strings, actual socket and forged Host/Origin,
  absent/malformed/external/wildcard Host, wrong method/path, JSON shape/extra fields,
  no-store, redirect/HTML/error/refusal/cancellation and unsupported origin/protocol.
- The SIM owner extends the PRIOR 05 tests/freehold_dev_grant.test.ts (deliverable 5),
  which covers both permissions independently false and true, the real chat delegation
  and sole setter, with the saved-tier arm; the INTEGRATION owner extends the PRIOR 05
  tests/freehold_offline_default.test.ts with the persistence-absent arm (permission
  failure still does not prevent 05's Inn default, and nothing is written). Preserve
  generic dev-command behavior.
- Re-run tests/vite_dev_watch.test.ts and tests/dockerignore_context.test.ts unchanged. Real
  flag-off browser starts in Inn and refuses Cottage; real flag-on loopback browser
  starts in Inn, then the actual command grants Cottage. Production build and preview
  expose no endpoint even with flag 1. Browser developer fixtures create no paid receipts or
  online persisted entitlement, and permission is absent from serialization/export/wire.
- Run npx vitest run tests/freehold_dev_authorization.test.ts
  tests/freehold_dev_bootstrap.test.ts tests/freehold_dev_grant.test.ts
  tests/freehold_offline_default.test.ts tests/vite_dev_watch.test.ts
  tests/dockerignore_context.test.ts, plus tests/sim_context.test.ts and the real browser
  fixtures owned above. Record executed browser server modes and command outcomes;
  source-string checks alone do not prove loopback/refusal/build absence.
- Add frontend-seam-reviewer for bootstrap/cancellation/browser input behavior alongside
  the complete security, architecture, parity and test reviewers already required.
<!-- core-dev-bridge:end -->

INVARIANTS AND CLOSED HANDOFFS:
- This file owns persistence plumbing only. 07a must land before online operations
  transfer character items or money into housing. Separate autosave is never a transfer
  transaction. The live wire revision is not the database expected revision.
- Raw recovery data is not viewer JSON, is bounded before parse, and is never silently
  written back as a default on older servers. Export/delete cover its ownership.
- Every persisted collection has a schema/version/entry/byte bound and provenance in the
  content-numbers workbook. Query/index evidence names real predicates and row counts;
  large live-table index additions follow concurrent_indexes.ts.
- No per-tick SQL, independent pool or claimed guaranteed reserve. All background work
  uses shared admission and workload-specific timeouts; boot DDL retains its allowance.
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


CORE STORAGE CAPABILITY AND LIFECYCLE CONTRACT:
- NEW FUTURE docs/freeholds/persistence-rollout-contract.md is part of deliverable 4: name
  minimum capable release, pre-07 (old release), future and populated fixtures, source
  binding, export and soft-deactivate/restore/hard-delete behavior, rollout and rollback
  quiescence. The old release lacks housing behavior and replaces characters.state
  wholesale; normalized table preservation alone cannot establish mixed-release
  correctness. Do not enable housing on an incapable writer/exporter or promise it
  continues lifecycle semantics.
- Unknown future data remains unchanged/read-only. Account/tier writer CHECKs restrict
  new writes without filtering away unsupported stored identifiers. Add schema fragments
  under ensureSchema advisory serialization after FK parents and before final growth
  guard; preserve repeated-boot/additive compatibility and concurrent-index requirements.
- 07b is the sole account lifecycle/history authority; 07c is sole first-tier eligibility
  authority. 07a supplies both transaction composition. The browser-only dev bridge does
  not grant online account binding, import fixture state or mint receipts.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- npx tsc --noEmit; npx vitest run tests/server/freehold_db.test.ts
  tests/server/freehold_hearth_db.test.ts
  tests/server/freehold_persist.test.ts tests/freehold_state.test.ts
  tests/freehold_offline_default.test.ts tests/freehold_dev_grant.test.ts
  tests/dev_commands.test.ts tests/professions_farming_state.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/localization_fixes.test.ts tests/env_protocol.test.ts
  tests/server/main_retention_wiring.test.ts.
- npm run db:up; with TEST_DATABASE_URL set to the disposable development database,
  npx vitest run tests/server/freehold_db.pg.test.ts
  tests/server/freehold_hearth_db.pg.test.ts. Use a private schema, assert
  tests ran, and clean it after. Record real plans for account/public plot/CAS queries,
  bounded row/byte/query counts, delayed-DB coalescing and cancellation evidence.
- Invoke database-performance-reviewer before database/workload decisions and on the
  finished diff whenever this file touches SQL, storage shapes, queues, locks or growth.
- Required COVERAGE reviewers: migration-safety, database-performance-reviewer,
  privacy-security-review, server-hot-path-reviewer, architecture-reviewer,
  cross-platform-sync, frontend-seam-reviewer (the src/game bootstrap and the
  src/main.ts firewall extraction), test-coverage-auditor, qa-checklist.
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
- [ ] Reapplying DDL is safe; primary/public identities, JSONB checks and actual-query
  indexes pass fake-pool and real-PG tests. Character delete preserves; account delete
  cascades plot and Hearth rows, is refused with the mapped class while a housing
  operation is open (D88), and export includes all owned state/recovery records.
- [ ] Maximum legal rows load unchanged; unsupported, unknown-owned and oversized rows
  remain recoverable/read-only without inventory loss or destructive autosave. Each
  scalar repair test proves unrelated fields survive; cross-clock fixtures pass.
- [ ] Slow DB produces one running plus one pending generation; new edits during write
  survive, shutdown/leave use the same queue, no client is held while awaiting a queue,
  and eviction waits for every live claim/session/write reference.
- [ ] 07b account lifecycle and 07c arrival authority stay outside plot serialization.
  Explicit unbound/no-history, safe exports and capable-release rollback are pinned. Fresh owner sessions use
  a bounded single-flight load; resume/second character do not overwrite newer memory.
- [ ] Housing dev grant requires both distinct permissions; exact flag/loopback bridge,
  ordinary Inn preservation, cancellation, strict payload and production/preview absence
  are proven by scoped and real-browser tests. Offline/headless persist nothing;
  global production entry remains gated until 07a and every byte/row bound has evidence.
- [ ] All scoped checks and the shared contribution gate passed, every required review
  returned, and the independent fix review found no remaining finding.

STEP 6 - DOC UPDATES + MEMORY:
- Update progress.md row 07 and state.md's implementation ledger with exact files,
  exported symbols, schema/wire/command keys, measured bounds, artifacts and evidence.
  Keep planning "settled" distinct from implementation "built". Record no anonymous
  deferral; carry every named unsigned release gate when applicable.
- Record useful traps in the freeholds memory entry within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
End with status, files, commands/outcomes, review verdicts, release evidence still required,
and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07-qa.md

STOPPING RULES:
- Preserve unrelated user work. Stop for an unapproved destructive schema change or a
  required raised monolith ceiling; explain the exact constraint and concrete evidence.
- If a required artifact or runtime proof fails, record FAIL and repair it; do not claim
  approval, invent numbers or silently waive checks. Never push or open/merge a PR.
```
