# Phase 07 QA: audit bounded persistence and stable plot identity

Audits [phase-07-persistence.md](phase-07-persistence.md). The implementation's exact five-or-fewer deliverables,
state.md decisions and ux-spec.md are the acceptance contract.

## What already happened, and what this QA inherits

A VERIFICATION SESSION ran on 2026-09-09 against tip `7269da3a5d` and left the branch at
`3864adacb9` (eleven commits, `9468d374d9..3864adacb9`). It is not a substitute for this
QA and it did not claim to be: it verified the eighth round, found two defects, fixed one
of them wrongly, was caught by its own fresh reviewers, and reverted. Read
[the findings ledger](qa/persistence-2026-09-08/findings.md) sections "ROUNDS SEVEN, EIGHT
AND NINE" and "ROUND TEN" before anything else, and treat every ruling in them as a claim
to re-test rather than a conclusion to inherit.

What it established, with evidence, so this QA does not spend its budget re-deriving it:

- `node scripts/gate_select.mjs` PASSED, exit 0, all 12 steps green, at `f55a103fd7`, with
  the PostgreSQL suites armed. The selective planner FELL BACK to the full suite on a
  1,728-path diff, so the run was the deeper check: 4,217 of 4,218 files passed, 63,654
  tests passed, 2 expected-fail, 28 skipped, plus the browser suite at 429.
- `npm run ci:changed` exit 0 after the final commit. `npx tsc --noEmit` exit 0.
- Both `.pg` suites are ARMED and EXECUTED: 32 passed with `TEST_DATABASE_URL` set, the
  same 32 skipped with it unset, which is how the arming is proved.
- The diff base has MOVED to `origin/release/v0.42.0` (observed in the gate's own
  selection line). state.md's "Worktree, base, and merge-forward" is still the authority
  on which base to merge; do not take the base out of this file.
- Roughly seventy-five mutants were run over the store's guards across five passes. The
  survivors are either now pinned or RULED in the source with the reason. Every ruling is
  listed below and every one of them is a claim this QA should try to break.

## THE INVENTORY THIS QA MUST CLOSE

The verification session left these OPEN, deliberately and by name. They are the whole of
the outstanding nits, should-fixes and blocking-adjacent findings across six reviewers,
and closing them is the primary work of this phase, not a coda to it. Each row names the
measurement and who took it, so nothing here needs re-discovery. The contract carries the
same list as release gates in
[persistence-rollout-contract.md](persistence-rollout-contract.md) section 8a; the ledger
carries the detail under V12 and U3.

FOUR OF THESE ARE DECISIONS, NOT WORK. They change behaviour or policy in a bounded store
where nine of ten fix rounds introduced a defect worse than the one they closed. Bring the
maintainer a recommendation and the evidence; do not implement a fourth heuristic and call
it closed. They are marked RULING OWED.

| # | Severity | Finding | Measured | Disposition |
|---|---|---|---|---|
| C1 | BLOCKING-adjacent, RULING OWED | A fresh account whose store entry re-reads the row it just inserted is write-blocked for the rest of the session. Nothing teaches a live record its minted identity, so the entry holds the row's name while the record holds the stand-in. | Reproduced against the real store: `quiesced: 1`, one error line, every later edit discarded. PINNED AS IT BEHAVES in a case named `KNOWN DEFECT`. | The fix is to teach the record its minted identity AT INSTALL, where the store already knows it, which retires C1, the pristine arm and the revision-regression arm together. `stampFreeholdPlotId` did this at COMMIT time and W4 showed that is wrong; stamping at install is a different change. Exempting the stand-in from the name comparison was tried in round nine and REVERTED (it admits a seeded default over a real house). Do not try it again without reading U1. |
| C2 | SHOULD-FIX, RULING OWED | An admission-class load refusal (local cap full, or no permit inside the login bound) is recorded as a TERMINAL hold, so a capacity blip becomes a session-long housing outage and `retain`'s repair arm cannot reach it (`holdResult` has already set `loaded`). | database-performance: with the shared gate saturated, 8 of 8 logins at 1 join/s refused; a lone re-join for a refused account still replayed the hold. | Section 4's fixture classes sanction a terminal hold for a DATA cause and never for a capacity one. Smallest correction named by the reviewer: do not set `loaded` for admission causes, or carry a `retryable` flag `preload` and `retain` consult. |
| C3 | SHOULD-FIX, RULING OWED | Under a sustained permit refusal the `entries` map's stated TIME bound does not apply at all, because `owesWork` is what suspends it. The entry stays dirty, is never collected, and keeps its capture. | server-hot-path, reproduced: after 30 sweeps `entries=1 dirty=1 quiesced=0 writeFailures=30`; after logout and 10 more, `entries=1 leaveCaptures=1`. 96 MiB per 5,000 owners at the shipped ceiling, 660 MiB at the approved one. | The reviewer is explicit that quiescing on permit refusal is the WRONG fix (it drops a healthy owner's edits for a transient stall). The seam the file already names is the keyed bounded cache with LRU eviction in `server/discord_status_cache.ts`. |
| C4 | SHOULD-FIX | A dirty entry with no live record and no capture re-arms every sweep forever and is never collected. | database-performance: 12 offline sweeps, 12 gate permits, `writesWithoutRecord` 1 to 13, `oldestDirtyAgeMs` unbounded. NO production sequence reaching this state was named by anyone, which is itself worth resolving. | Either name the reachable sequence or prove there is none. If reachable, the reviewer's smallest correction is to advance `committedGeneration` in the `persisted === null` arm. |
| C5 | SHOULD-FIX | The load cap (4) and write cap (4) are independent and sum past the shared gate's capacity of 7. | database-performance, measured: the store held 7 of 7 permits with other named producers queued behind it. During drain the demand is 14 against 7. | Share one budget, or state the overcommit explicitly in the contract as accepted. |
| C6 | SHOULD-FIX | The leave reserve is two slots in TOTAL, not two per leaver, and `pumpLoop` drains one insertion-ordered set at the non-leaving cap. | database-performance: with 296 background writes deferred, 98 of 100 simultaneous leave flushes hit the full 2,000 ms deadline with the write unlanded. Every leave adds its bound to `GameServer.leave`, which releases the character lease. | Have `pumpLoop` prefer leaving entries. |
| C7 | SHOULD-FIX | The login read inherits the 15,000 ms pool statement timeout, three times the deliberately short permit bound, on a handshake with no deadline of its own (`authTimer` is cleared on the first message). | database-performance, static plus the constants: worst case 5,000 + 2 x (5,000 + 15,000) = 45,000 ms. | Wrap both login-path reads in the existing `runWithStatementTimeout` seam, or state the 15 s term in the docblock and the contract. |
| C8 | SHOULD-FIX | `freeholdsForExport` has no LIMIT and no byte gate, while the account read's `LIMIT 2` is justified in the same contract against exactly that hazard. It is the owner's only readback. | database-performance: 501 rows for one account returned in full, 3.4 ms, `Index Scan`, on the request path with one pool client. | Bound it, widened as the export needs, plus the on-disk pre-gate. |
| C9 | SHOULD-FIX | Four distinct load-failure causes all report `kind: 'unadmitted'`, which is exactly the discrimination the metric's own help text promises an operator. | database-performance, measured: `loadFailuresByKind` read `{"unadmitted": 196}` for a pure capacity burst. | Give `refuse()` a kind parameter (`cap_full`, `no_permit`, `read_threw`, `no_store`), leaving `unadmitted` for the row-level cause, and update the DEPLOY.md bullet in the same change. A provisional caveat is already in DEPLOY.md and must be removed when this lands. |
| C10 | SHOULD-FIX | The write path serializes each document TWICE (the refusal's byte measure, then the two content columns) and none of that codec cost reaches a counter; `write_ms` brackets only the statement. | server-hot-path: 363 us per write at 420 rows (clone 7.5, refusal 228.0, column stringify 127.7); database-performance measured the same work at 0.225 ms. Measuring the columns and adding the fixed wrapper would save about 60 percent. | Add a `codec_ms` measure beside `write_ms`, which is that family's own stated rule, and consider the single-serialization form. |
| C11 | SHOULD-FIX | `entry.state` is a SECOND full copy of every online owner's house, distinct from the sim's live record, and a dirty leaver briefly holds a THIRD. Only the capture is documented. | server-hot-path: 10,051 bytes per copy at the shipped ceiling, 69,452 at the approved one; +48 MiB at 5,000 online today, +331 MiB at the approved ladder. | Document the standing cost where the field is declared, as the capture already is, or reduce it. |
| C12 | SHOULD-FIX | The shutdown drain's own derivation counts only the statement; the codec is serial and does not overlap. | server-hot-path: 5,000 maximal writes x 363 us = 1.82 s of single-threaded CPU ADDED to the concurrency window, taking a maximal-record drain to about 8 s against the 10 s deadline. Irrelevant at today's Cottage ceiling, load-bearing if Citadel ships unchanged. | Re-derive `FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS` against the codec, and restate which entry point produced the existing "2.9 s / 1,584 unwritten" figures, which the reviewer could not reproduce through `idle()`. |
| C13 | SHOULD-FIX | `leave` now blocks `removePlayer` and the lease release for up to `FREEHOLD_PERSIST_LEAVE_FLUSH_MS` more, and the leaving entity stays in every nearby viewer's interest set for those extra seconds. | server-hot-path: worst-case lease release moves from about 4 s to about 6 s. The serialized path is `takeOverCharacter`, which awaits `leave()`. | Decide whether the reconnecting player should wait the whole chain. |
| C14 | NIT | The store can hold 4 of the shared gate's 7 permits in steady state and 8 during drain, and DEPLOY.md's alert list names neither `deferred_writes` nor `permit_wait_ms`, which are the leading indicators of C2, C3 and C5. | server-hot-path. | Add both to the alert list. |
| C15 | NIT | Per-save WAL cost is unpublished, and every CAS save rewrites both content columns even when byte-identical. | database-performance: 3,671 bytes of WAL per save for the compressible maximal record, 39,257 for an incompressible one (table grew 808 kB over 20 saves). | Publish the measured per-save WAL bound in the contract's section 7 bounds table. The conditional-assignment fix has a real planner cost; measure before adopting. |
| C16 | NIT | `freehold_db.ts` calls the incompressible record "32,827 bytes on disk"; the reviewer measured 32,980 and 35,523 depending on the ids used, and the 97,932 uncompressed figure is header-inclusive. | database-performance. | Label 32,827 as one sample rather than a bound, and add the header clause so a later reader reproducing it is not 8 bytes off. |
| C17 | NIT | `server/game.ts`'s join releases the freehold retain on an `addPlayer` throw but not if anything between `addPlayer` and the single `return session` throws. A leaked reference pins the entry for the process lifetime. | architecture. NOT FIXED in the verification session because `server/game.ts` is at its zero-slack ratchet ceiling (9920) and the fix adds lines. | Pay for it by extraction and LOWER the ceiling, per the ratchet rule. |
| C18 | NIT | `server/game.ts`'s leave evaluates `freeholdOwnerKeyForAccount(session.accountId)`, which THROWS on a non-positive id, above both the lease release and `removePlayer`. Unreachable today because join would have thrown first. | architecture. | Reuse the key computed at join, or read it inside `flushAndRelease`'s own guard. |
| C19 | NIT | `server/freehold_persist.ts` is 2,073 lines and is not on the monolith ratchet list. | architecture. | A maintainer decision before the file grows further. |
| C20 | NIT | A leave capture strictly older than the last committed write, with the record already evicted and the entry still dirty, refuses on `revisionRegressed` and logs "the live record is not the record this entry loaded", which is misleading: the capture is simply superseded and nothing is lost by refusing it. | architecture, low confidence on reachability. | One false ERROR line and a quiesce the next login clears. Correct the message or the arm. |
| C21 | NIT | `bodyOf(name)` in `tests/freehold_module.test.ts` resolves by suffix and returns the FIRST match, so two files exporting one name silently collapse; and the `CONSTRUCTORS` exemption list grew in the same change that widened the scan, with nothing pinning that the three exempted bodies really are constructors. | test-coverage. | Both are latent today. |
| C22 | OWED, 08a inherits | A fresh account's live record answers to `plot:unassigned` in one session and to its minted id in the next, for timing reasons alone, while `account_freeholds` declares a UNIQUE `plot_id` because a client echoes it back. | architecture. Latent: `freeholdDescriptorFor` has no production caller and the wire is dark. | Closed by C1's fix if C1 is taken. Otherwise 08a inherits it. |
| C23 | OWED, named gap | A write-blocked hold has NO player-facing surface: the owner sees the free tier-0 Inn Room with none of their furnishings and no explanation. Every item above makes a hold more reachable. | Recorded in the contract's section 4. | The release that lights housing up owes it. That gap and C2/C3 are one obligation. |

### WHERE THE INVENTORY STANDS after the rulings round, 2026-09-10

The four RULING OWED rows and the two scope rows are settled and executed. Read the
table below as the record of what each row WAS; this is what happened to it.

- **C1, C22 and the eighth path: CLOSED.** `installLoadedFreehold` installs a default
  carrying the load's own minted identity on the ABSENT arm, through the existing
  load-once path, so an online record answers to its own name from its first session
  and the write seal's name comparison is TOTAL for every entry class. The fresh read
  found the mint was per ENTRY rather than per owner, which the ruling as written did
  not cover, so the absent arm also adopts a live record's identity when there is one.
  `revisionRegressed` is un-gated from `standInSeed` in the same change, with its own
  executed proof. FOUR pins flipped, not the two the ruling anticipated.
- **C2: CLOSED.** The three admission kinds no longer set `entry.loaded`, so a later
  join re-reads them; the four data kinds stay terminal. The entry stays write-blocked
  while unrepaired, which is the caveat the ruling attached.
- **C3: RECORDED, not built.** The derived ceiling (about ten thousand three hundred
  concurrently dirty owners per sweep) is in the contract's section 8a with its
  composition. No cache, and therefore no eviction policy, because an eviction policy
  here decides whose unwritten edits may be dropped.
- **C5, policy half: ACCEPTED, with the arithmetic**, in section 8a, and the
  peak-concurrency pin is written against that answer through the real gate.
- **C23: SCOPED, built separately**, in
  [held-plot-surface-scope.md](held-plot-surface-scope.md): the exact keys, the render
  sink each goes to, and the two groups the player is told apart out of eight kinds.
- **The section 8a login budget gate: CLOSED**, and the premise it was written on was
  refuted with a measurement. See the contract and ROUND FIFTEEN in the ledger.
  AND IT CARRIED A NINTH PATH, found at round seventeen: the cap leaves its read in
  flight by design, so that read's `classify` can land BEFORE the record is seeded, where
  the ordering refusal cannot see it. Closed by giving the store the one fact it lacked,
  which of its loads a caller has abandoned. ROUND SEVENTEEN in the ledger.
- **Offline and headless plot identity: ACCEPTED AND DOCUMENTED**, in the contract, in
  `src/sim/freehold/CLAUDE.md`, in `state.ts` and on the type itself.

C4, C6 to C21 were closed earlier in this phase and their dispositions are unchanged.

### Runtime proof the database reviewer named as still required

Independent of the rows above, and each one a test rather than an argument: a regression pin
that an entry refused on the admission cap or the permit is RE-READ on a later
`preload`/`retain` instead of replaying its hold; a peak-concurrency pin that
`activeLoads + activeWrites` never exceeds the intended shared budget, driven through the
real `createBackgroundDbGate`; a pin that a dirty entry with no live record and no capture
is COLLECTED rather than re-armed; a pin that a leaving entry's write starts ahead of
background writes already deferred; and a `freehold_db.pg.test.ts` case on an account with
many rows, one past the pre-gate, asserting the export does not render it. The drain pin
landed in the verification session; the export one landed with the Y6 fix and gained its
boundary arm at the rulings round.

ALL SIX HAVE NOW LANDED, and the sixth was owed only on the record. The re-read pin came
with ruling 2 (an entry refused on the cap or the permit is not `loaded`, stays
write-blocked, and is re-read on the next retain, with a contrast arm proving a DATA hold
still replays). The peak-concurrency pin came with ruling 4, driven through the real
`createBackgroundDbGate`. The leaving-entry pin landed with the pump's leaver preference
and gained a second arm at the rulings round (a rejoin that takes its capture back leaves
the leaver subset too).

C4's, the pin that a dirty entry with no live record and no capture is COLLECTED rather
than re-armed, LANDED AT `4648c4b1e6`, before the rulings round, and this row said it was
owed for two rounds after that. It drives the ports directly, asserts the write reaches
its permit and issues no statement, asserts the entry stops being dirty so no later sweep
re-arms it, and asserts it is then collected. What was actually open is the other half,
whether any production sequence reaches that arm, and round seventeen settled it: NO in
this release, through a six-step enumeration written out in the ledger so it can be
attacked rather than trusted. The arm remains a bound on a state the furnishing writer
will make reachable, which is what its own comment says it is.

### Rulings this QA should try to break rather than inherit

Each was verified by mutation and is stated in the source as unpinnable or redundant. Two
fresh reviewers re-tested them and agreed, which is exactly why a third attempt is worth
the budget: three of the last ten rounds turned a "cannot be reached" into a live defect.

- `owesWork`'s `running`, `pending` and deferred-set clauses are all redundant under
  today's arming rules; only the in-flight-load and dirty clauses are decisive.
- `runWrite`'s post-queue `blocked()` re-check is the middle of three layers of one gate
  and nothing outside a write result can block an entry. Removing all three DOES fail.
- The mint-once guard on the absent arm cannot be reached twice for one entry.
- The orphan sweep's consecutive-pass reset cannot be isolated, because every path out of
  owing work at zero references removes the entry through `maybeRemove` on the spot.
- The seal's pristine arm and its layout, trophies, tier, condition and visit-policy
  dimensions are dead while the name comparison is TOTAL, and become load-bearing the
  moment it is narrowed. Round nine narrowed it, which is how they mattered.
- A record carrying a REAL plot name still goes backwards onto the row, deliberately;
  only a stand-in-named record is refused on a regressed revision.
  THIS RULING IS RETIRED at the rulings round, and it is the one the list above asked
  a later reader to try to break. Un-gating `revisionRegressed` reverses it, and it
  should be reversed: a live revision below the entry's last committed one means the
  live record is not the record that commit came from, since every install a rejoin is
  offered carries at least the committed revision and every sanctioned mutator only
  increments, and writing it walks the client-facing wire counter backwards
  permanently, which is exactly the harm the loader's own `wire_rev_shape` hold refuses
  on the read side. Two behaviour pins encoded the old rule and both flipped.

### Starter Prompt
```
This is Phase 07 QA of the Freeholds and Guildhalls feature: bounded persistence and stable plot identity.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block and its effort/fan-out rules.

Goal: verify every promised behavior and artifact, CLOSE the carried inventory this
phase inherits, apply ALL findings including nits, and have a second fresh reviewer
verify the fix round before recording a verdict.

READ THIS FIRST, before any tool call: docs/freeholds/phase-07-qa.md sections "What
already happened, and what this QA inherits", "THE INVENTORY THIS QA MUST CLOSE" and
"Rulings this QA should try to break rather than inherit". A verification session already
ran against tip 7269da3a5d and left the branch at 3864adacb9. It found two defects, fixed
one of them WRONGLY, was caught by its own fresh reviewers, and reverted. Nine of the ten
fix rounds on server/freehold_persist.ts have introduced a defect worse than the one they
closed, and the suite was green every single time. Assume this branch is still wrong and
prefer finding a defect over confirming the work. A green suite is the START of your
investigation, never the end.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean and the tip is 3864adacb9; otherwise ask
  the user. The untracked .env there is gitignored and DELIBERATE, but it does NOT carry
  TEST_DATABASE_URL: arm the PG suites explicitly from the main checkout's DATABASE_URL,
  as STEP 3 says. Do NOT push and do NOT open or merge a PR under any circumstances.
- Follow state.md "Worktree, base, and merge-forward": fetch origin --prune; merge the the
  newest release/**; release-merge-audit after non-empty merge and frozen install if
  patches/ moved.
- Read root/directory CLAUDE.md. Memory scan: MEMORY.md, freeholds entry, test-pin traps,
  apply ALL findings, review the review-fix round. Preserve unrelated work.

STEP 1 - LOAD CONTEXT (agents only for planning docs and coordinators):
- An Explore agent reads phase-07-persistence.md, state.md, ux-spec.md, the content/art manifests,
  matching progress row and all actual implementation commits including the complete
  diff, tests and artifacts. It reports to a scratch file: promise/evidence matrix,
  new symbols and real consumers, mutation/authority paths, literal pins and missing arms.

STEP 2 - AUDIT:
- Spawn independent CORRECTNESS, TEST COVERAGE, and DEAD CODE/HYGIENE readers. Every
  report goes to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT and no
  filtering of nits or uncertain issues. Apply this exact coverage inventory:
  - Independently inspect schema-version and identity migration from an absent row,
    legacy row, future-schema row and malformed/oversized owned layout. No destructive
    normalization, default replacement or silent item/trophy loss is allowed.
  - Test actual query/index plans, maximum legal bytes, reverse FK behavior, per-account
    bounded loading and no speculative ledger-week index. No test is only a DDL string.
  - Inspect the per-row-class ON DELETE outcomes (D88): plot and Hearth rows cascade with
    the account, an open housing operation refuses the deletion with 07a's
    CharacterFreeholdOperationOpen class and character.freehold_operation_open code,
    and 07a's tombstones keep their nonidentifying identity. Day-keyed columns carry the
    resetDay vocabulary from the binding-resolved reset zone, never the serving process
    constant, with epoch-ms companions display-only (D84).
  - Delay/cancel DB writes while producing edits; verify one running+one pending dirty
    generation, latest state survives, no queue waits hold clients, and all lifecycle
    paths reuse the same writer/admission. A stale durable CAS never drops an acked effect.
  - Verify 07b account lifecycle delegation, no plot-local presence/grace writer, last-owner leave
    while a claim is referenced, pending write failure and shutdown flush. Ordinary FIFO
    is not enough; exercise coalescing. Prove offline/headless no-storage and dev gates.
  - Re-verify the injected bankBonusForAccount binding on the merged tree at phase start
    (the release closure widens its return to include characterCount) and cite that
    tree, not the planning one-liner. Record all exported symbols/real consumers and
    the mandatory future 07a dependency explicitly.
- Required domain COVERAGE review: migration-safety, database-performance-reviewer,
  privacy-security-review, server-hot-path-reviewer, architecture-reviewer,
  cross-platform-sync, frontend-seam-reviewer (the src/game bootstrap and the
  src/main.ts firewall extraction), test-coverage-auditor, qa-checklist.
  Database performance runs before new DB decisions and on the finished diff. Parent
  runs deterministic gates once; reviewers inspect their evidence.

<!-- core-dev-bridge-qa:start -->
BRIDGE CORRECTNESS AND FIX-ROUND COVERAGE:
- Verify the separate permission is named freeholdDevGrantEnabled and defaults false.
  The server predicate uses existing diagnosticsReadAllowed on real socket and Host.
  Account first-tier marks are produced by 07c; 07b owns lifecycle history. Neither
  appears in plot serialization or is inferred from an unknown/future row. Verify 07
  creates no second default record or tier writer: 05's Inn Room record, setFreeholdTier
  and the D24 fixture are reused (D81) and only persisted.
- Reproduce the source gap first: ordinary offline DEV supplies general devCommands
  without ALLOW_DEV_COMMANDS. Verify the PRIOR 05 separate readonly nonpersisted housing
  permission (D81), its default false and live/fake SimContext pins, never a silent
  change to generic devCommands. Only both permissions allow the real chat route/sole
  tier setter; this phase adds only the persisted save behind that setter.
- Inspect the PRIOR 05 scripts/lib/freehold_dev_authorization.mjs and
  scripts/lib/freehold_dev_authorization.d.mts,
  src/game/freehold_dev_bootstrap.ts and src/sim/freehold/dev_grant.ts plus every actual
  Vite/bootstrap/Sim/context/server delegation. The endpoint is exact GET
  /__freehold/dev-authorization and configureServer-only apply:'serve'. Preserve
  defineConfig({ ... }) AST shape; reject preview/production exposure with flag 1.
- Exercise unset/0/other versus exact flag 1; real non-loopback socket with forged
  loopback Host/Origin; loopback socket with absent/malformed/external/wildcard Host;
  wrong method and unrelated path. Affirmative body has the one exact true boolean,
  JSON type and no-store. No arbitrary environment/account/purchase/receipt disclosure.
- Browser refuses before fetch when not DEV, not HTTP(S) or not a loopback document.
  Exercise absent/HTML/extra-field/malformed/redirect/refusal/failure/cancelled replies;
  all yield false and keep ordinary Inn startup. Late replies cannot authorize another
  entry. The server dev path retains the ordinary setter/save contract under its separate
  exact server flag; no volatile server-tier overlay or paid receipt is introduced.
  No credentials/cache/redirect, public VITE_* bridge, query/storage/UA/window
  override, user setting or made-up timeout is allowed.
- Run the real flag-off browser: Inn succeeds and /dev freehold cottage refuses. Run
  ALLOW_DEV_COMMANDS=1 npm run dev -- --host 127.0.0.1: begin in Inn and execute the real
  chat command, then read ordinary state to prove Cottage. Fixtures call assertLoopbackUrl
  first, never directly inject tier or a receipt. Developer offline state cannot become
  online persisted ownership; permission never reaches save/export/public wire.
- The PRIOR 05 tests/freehold_dev_authorization.test.ts,
  tests/freehold_dev_bootstrap.test.ts, tests/freehold_dev_grant.test.ts and
  tests/freehold_offline_default.test.ts (each extended here with its persistence arm),
  tests/vite_dev_watch.test.ts, tests/dockerignore_context.test.ts and SimContext pins
  must execute. Inspect the PRIOR 05 .dockerignore helper/declaration admission and the
  coordinator extraction/ceiling changes. Add frontend-seam-reviewer for the bootstrap
  and browser behavior; security must review the real socket/Host boundary.
<!-- core-dev-bridge-qa:end -->


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

- Verify literal unbound_no_history 07 rows, future/malformed/oversized owned fixtures,
  original-row preservation with bounded diagnostic references, exports and
  soft-deactivation restore.
  Inspect rollout capability floor and actual wholesale legacy character-save behavior.

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

The existing constructor type is src/sim/types.ts::SimConfig, consumed by Sim;
SimContext owns the context permission field. Verify the housing-only permission's
configuration/context pins under those exact symbols and ordinary devCommands intact.

STEP 3 - VALIDATION:
- npx tsc --noEmit; npx vitest run tests/server/freehold_db.test.ts
  tests/server/freehold_hearth_db.test.ts
  tests/server/freehold_persist.test.ts tests/freehold_state.test.ts
  tests/freehold_offline_default.test.ts tests/freehold_dev_grant.test.ts
  tests/dev_commands.test.ts tests/professions_farming_state.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/localization_fixes.test.ts tests/env_protocol.test.ts
  tests/server/main_retention_wiring.test.ts tests/freehold_module.test.ts
  tests/schema_wiring.test.ts tests/server/ws_auth.test.ts
  tests/server/http/game_metrics.test.ts tests/server/http/metrics_single_registry.test.ts
  tests/game_state_metrics.test.ts tests/server/tunables.test.ts
  tests/server/freehold_wire.test.ts tests/freehold_instance.test.ts
  tests/freehold_gate_and_key.test.ts tests/freehold_key_persistence.test.ts
  tests/freehold_arrival.test.ts.
- Prove the arming rather than assuming it: run the two .pg suites ONCE WITH the variable
  and ONCE WITH `env -u TEST_DATABASE_URL`, and record both counts. The same number
  passing and skipping is what proves they were armed; 32 and 32 is the current answer.
- npm run db:up; with TEST_DATABASE_URL set to the disposable development database,
  npx vitest run tests/server/freehold_db.pg.test.ts
  tests/server/freehold_hearth_db.pg.test.ts. Use a private schema, assert
  tests ran, and clean it after. Record real plans for account/public plot/CAS queries,
  bounded row/byte/query counts, delayed-DB coalescing and cancellation evidence.
- Run every scoped command listed in the implementation file and node scripts/gate_select.mjs.
  A skipped PG suite is not a pass. FOUR THINGS THE LAST SESSION LEARNED THE HARD WAY
  about that gate: it FELL BACK to the full suite on a 1,728-path diff and took about
  16 minutes of test time, so budget for the deeper run rather than the selective one;
  run it with NOTHING else running, because its one previous failure was a subprocess
  ETIMEDOUT in tests/item_art_audit_builder.test.ts (untouched by this branch, 7/7 in
  isolation) under concurrent agent load; NEVER pipe its exit code through tee, which
  reported success over a real exit 1; and its browser step REWRITES four PNGs under
  docs/screenshots/cosmetics-window and docs/screenshots/intentional-gathering-pr1, which
  are gate artifacts to `git checkout --` and never to commit. Assert work happened, use literal expected outcomes,
  include controls that pass when a rejected precondition is removed, and never derive
  expected values from the production object under test.

<!-- core-dev-bridge-qa-validation:start -->
- Run npx vitest run tests/freehold_dev_authorization.test.ts
  tests/freehold_dev_bootstrap.test.ts tests/freehold_dev_grant.test.ts
  tests/freehold_offline_default.test.ts tests/vite_dev_watch.test.ts
  tests/dockerignore_context.test.ts tests/sim_context.test.ts, plus the actual flag-off,
  flag-on, preview and production browser/endpoint fixtures from the implementation.
  Record executed modes/outcomes; a static endpoint-name scan is not runtime proof.
<!-- core-dev-bridge-qa-validation:end -->

STEP 3b - CLOSE THE CARRIED INVENTORY:
- Rows C1 to C23 in this file are the outstanding blocking-adjacent, should-fix and nit
  findings from six reviewers, each with its measurement and its source already recorded.
  Closing them is the PRIMARY work of this phase, not a coda to it. Do not re-derive a
  measurement that is already written down; verify it, then act.
- FOUR ARE MARKED RULING OWED (C1, C2, C3, and the policy half of C5). They change
  behaviour or policy in a bounded store with the failure record above. Bring the
  maintainer a recommendation with the evidence and STOP on those; do not implement a
  fourth heuristic and call it closed. C1 in particular has a known-good shape (teach the
  live record its minted identity AT INSTALL) and two known-bad ones (stamp at COMMIT,
  which W4 refuted; exempt the stand-in from the name comparison, which round nine tried
  and had to revert) - read U1 and W4 in the ledger before proposing anything.
- The five runtime proofs the database reviewer named as still required are listed under
  "Runtime proof the database reviewer named as still required". They are tests, not
  arguments, and the drain one already landed.
- Every ruling under "Rulings this QA should try to break rather than inherit" is a claim
  to attack with a mutation, not a conclusion to accept. Report any you break.
- A MUTATION PASS is the check that has caught the most on this subsystem, by a wide
  margin: mutate on disk, run the OWNING suite, confirm RED, restore by plain file write,
  confirm green, and report every SURVIVING mutant as a coverage gap. Run a no-op control
  first and prove the tests actually ran (a full "Tests N failed | M passed" line), because
  a harness that silently fails to apply its patch reads as a clean bill of health.

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
- Record progress.md 07 QA verdict PASS or FAIL, all found/fixed counts, commands,
  evidence and remaining external release gates. Update state ledger for changed facts.
- Preserve useful freeholds/test-pin memory within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
Return verdict, counts, files, commands/outcomes and reviewer verdicts, then the FULL PATH:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07a-transactional-mutation-boundary.md

STOPPING RULES:
- FAIL names phase-07-persistence.md as the next rerun with findings attached. Never waive a required
  check or silently invent a balance value. No push, opened PR or PR merge.
```
