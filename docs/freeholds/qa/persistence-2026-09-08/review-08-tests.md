# Test-Coverage Audit: Freeholds bounded persistence (review-08-tests)

**Reviewed:** `c18facd4cc..HEAD` in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds
(branch feature/freeholds, 6 commits), resolved with `git diff --name-only`: **48 files**
(21 tests / test helpers, 19 source, 8 docs+config), 8,924 insertions.

**Targeted runs (every one printed its `Tests` summary line):**
- Baseline, 4 suites: `Test Files 4 passed (4)` / `Tests 232 passed (232)`.
- pg twins (TEST_DATABASE_URL armed from the main checkout `.env`): `2 passed (2)` / `27 passed (27)`
  (they RAN, not skipped).
- `tests/monolith_budget.test.ts`: `22 passed (22)`.
- Re-baseline after every mutation was restored: `232 passed (232)`, `git status --porcelain` empty.

**Measured monolith counts (reported, not raised, per the brief):**
server/game.ts 9,978 vs ceiling 9,983 (5 lines of slack) - server/db.ts 4,605 vs ceiling 4,744
(139) - server/main.ts 4,365 - src/sim/sim.ts 11,737 (unchanged).

## Mutation matrix (14 mutants, all applied and verified on disk, all restored by plain file write)

| # | mutation | suite result | verdict |
|---|---|---|---|
| P1 | `rawVersion > FREEHOLD_PERSIST_VERSION` -> `+ 1` | 1 failed / 231 | RED, killed |
| P2 | tier `unsupported` -> `absent` | 5 failed / 227 | RED, killed |
| P3 | `boundedId` refuses the empty id | 232 passed | **SURVIVED** |
| P3b | same, vs all 5 freehold sim suites | 162 passed | **SURVIVED** |
| P4 | `persistedFreeholdBytes` catch returns 0, not Infinity | 232 passed | **SURVIVED** |
| D1 | CAS `durable_rev = $3` -> `>= $3` | 1 failed / 231 | RED, killed |
| D2 | INSERT column list order swapped (tier <-> layout) | 232 passed | **SURVIVED** |
| D2b | same, vs `freehold_db.pg.test.ts` | 2 failed / 7 | RED (gated tier only) |
| H1 | `BigInt(now) < BigInt(ready)` -> `Number(...)` | 1 failed / 231 | RED, killed |
| H2 | advance `GREATEST` -> `LEAST` | 1 failed / 231 | RED, killed |
| S1 | `blocked()` drops `isHeld` | 11 failed / 221 | RED, killed |
| S2 | `live.rev === state.rev` -> `<=` (backwards arm) | 232 passed | **SURVIVED** |
| S3 | `rearm` drops the `committed` guard | run aborts, 156/232, 1 file failed | RED, killed |
| W1 | drop `freehold,` from the ws_auth join meta | 168 passed (4 files) | **SURVIVED** |
| G1 | metrics `measure:'held'` reports `state.dirty` | 98 passed (3 files) | **SURVIVED** |
| E1 | both export loaders commented out, values stubbed | 95 passed | **SURVIVED** |

## Per-contract verdicts

1. **Absence is only genuine absence; unsupported/malformed/oversize/unadmitted are preserved and
   write-blocked** - COVERED. Decisive: tests/freehold_state.test.ts:180 (`norm(value).kind` not
   `absent` for `{} '' 0 false [] 'null'`), :363/:375/:384 (the durable value is byte-identical
   after the call), tests/server/freehold_persist.test.ts:544 (`writeCount() === 0` across all
   seven hold shapes, after every write door is tried). Mutants P2 and S1 both redden.
2. **Installed before the sim seeds, load-once** - PARTIAL. The ordering and the load-once rule are
   decisive (tests/server/freehold_persist.test.ts:1270, :1228), but the wire that carries the
   record from ws_auth into `join` has no assertion at all (finding 1).
3. **One running plus one pending; FIFO before the permit** - COVERED. tests/server/freehold_persist.test.ts:623
   (1000 marks cost 1 write), :628 (`pending === 1`), :792 (`['enqueue','permit','serialize','writeRow','release']`).
   Mutant S3 reddens.
4. **A stale CAS quiesces** - COVERED. tests/server/freehold_persist.test.ts:865 (`writeCount()` still 1
   after five more save attempts and a flush), :866 (exactly one warn); the SQL fence itself is
   tests/server/freehold_db.test.ts:419. Mutant D1 reddens.
5. **Hearth is account state with one online authority; an advance never lowers either counter** -
   COVERED. Statement order pinned at tests/server/freehold_hearth_db.test.ts:305-311, the BigInt
   comparison at :423 (with the IEEE proof at :416), and the executed GREATEST/serialization proofs
   ran in the pg twin (freehold_hearth_db.pg.test.ts:550, :320, :395, :445). Mutants H1 and H2 redden.
6. **Both tables keep-forever, cascade-only, and both ride the account export** - PARTIAL. The
   retention absence is decisive (tests/server/main_retention_wiring.test.ts, both name forms plus
   the prefix and DELETE forms) and the DDL rationale is pinned on the RAW fragment. The EXPORT half
   is not: mutant E1 (finding 2).
7. **Character delete preserves housing, account delete cascades both rows** - COVERED, but only in
   the TEST_DATABASE_URL-gated tier (freehold_db.pg.test.ts:491, freehold_hearth_db.pg.test.ts:685).
   Both ran green here. On an unarmed run this contract has zero coverage; that is the accepted
   repo split, noted rather than raised.
8. **Initial rows unbound; the plot save never writes the upkeep columns** - COVERED, decisively and
   per-column: tests/server/freehold_db.test.ts:435-440 slices the SET clause and asserts each of
   the six forbidden columns separately, with the DDL CHECK cross-pinned at :145.
9. **src/sim stays pure** - COVERED by the three guards this diff updated: tests/architecture.test.ts
   (scans every sim file), tests/freehold_module.test.ts:454 (both new files added to the source-scan
   list, so a new file cannot escape the scan), tests/localization_fixes.test.ts:1425 (S3 gate).
   tests/server/freehold_persist.test.ts:281 additionally proves the server module holds no
   `Date.now`/`Math.random` and exactly one `setTimeout`, on comment-stripped source.
10. **Production stays dark** - COVERED for the code path (tests/server/freehold_persist.test.ts:1317-1325
    pins the live per-join flag read and that dark answers a hold, not an absence). The
    "named release gates stay unsigned" half is a docs assertion with no test surface; that is
    correct, not a gap.

## Findings

**1. BLOCKING (confidence high) - server/ws_auth.ts:477 and :545. The one wire that delivers the
durable record into the sim has no test.**
`freeholdForAccount` is asserted only NEGATIVELY (tests/server/ws_auth.test.ts:197, inside
`expectNoAdmissionWork`). Nothing asserts it is called on a fresh join, called once, called with the
account id, awaited before `acquireCharacterLease`, or that its result reaches `game.join`'s meta.
Proof: mutant W1 deleted `freehold,` from the join meta and
`ws_auth.test.ts + ws_auth_login_covenant.test.ts + freehold_persist.test.ts + character_lease_ws.test.ts`
stayed green at 168/168. Failure scenario: a merge or a refactor drops that property; every fresh
join then calls `installLoadedFreehold(ctx, id, undefined)`, which returns immediately, so every
account is seeded with a fresh Inn Room, every store entry stays `loaded === false` and therefore
write-blocked, and durable housing is silently and totally dead in production with the whole 8,900
line change green. The fix is one test modeled on the bankBonus pair already in that file
(:1281-1291 positive, :1305-1307 resume-arm negative): assert `deps.freeholdForAccount` called once
with the account id, that `(game.join as any).mock.calls[0][7].freehold` equals the fixture, and the
resume arm where it must NOT be called and `joinMeta.freehold` is undefined.

**2. SHOULD-FIX (confidence high) - tests/server/tunables.test.ts:1115-1118. The account-export
wiring pin is comment-gameable, so contract 6's export half is unpinned in the always-on tier.**
`dbSrc` is read RAW at tests/server/tunables.test.ts:112 (`fs.readFileSync`, no `stripComments`),
while the sibling pin at :648 in the same file does import `stripComments`. Proof: mutant E1
commented out both loader calls in `server/db.ts` (leaving the call text alive inside `//` comments)
and stubbed `freeholds` to `[]` and `freeholdHearth` to `null`; tests/server/tunables.test.ts stayed
green at 95/95. The `toContain('freeholds,')` needle is weaker still: any comma-terminated
occurrence of that word satisfies it. The two `not.toContain('FROM account_freehold...')` arms have
the mirrored defect: a comment naming the table would red them falsely. Failure scenario: the export
loses both keep-forever tables (the owner's only readback) and no always-on test notices. Fix: wrap
`dbSrc` in `stripComments` for this block, and add a behavioral arm to
tests/account_export_state.test.ts (which today never mentions housing) asserting the two keys are
present in the returned bundle.

**3. SHOULD-FIX (confidence high) - src/sim/freehold/types.ts:54 and server/freehold_persist.ts:997-1001.
The realm's real allowlist binding is never executed by any test.**
`FREEHOLD_VISIT_POLICIES` (a 27-line frozen facade with `has`, `size`, `entries`, `keys`, `values`,
`forEach`, `Symbol.iterator`) has ZERO test references; its precedent `FREEHOLD_TIER_IDS` has a full
pin at tests/freehold_content.test.ts:28-56. `createGameFreeholdPersistStore` is pinned only by an
occurrence count (tests/server/freehold_persist.test.ts:1296), never called, so the binding
`validTierIds: FREEHOLD_TIER_IDS, validVisitPolicies: FREEHOLD_VISIT_POLICIES` and the
`serialize`/`hasLive`/`mintPlotId` closures beside it are untested; the persist suite fakes
`normalize` wholesale. Failure scenario: the two sets are transposed (an easy same-shape edit), so
every real row answers `unsupported: tier`, every account is held, nobody's house loads and nobody's
saves - and the 232-test suite is green. Fix: a `FREEHOLD_VISIT_POLICIES` pin in the shape of the
tier one (`[...set]` equals the literal three, `has('guild')` false, mutators absent), plus one arm
that drives the real `normalizeFreehold` through the production sets against a `visitPolicy:'guild'`
row.

**4. SHOULD-FIX (confidence medium) - server/http/game_metrics.ts:656-677. The new
`WOC_FREEHOLD_PERSIST` gauge family has no test.**
`grep WOC_FREEHOLD_PERSIST tests/` returns nothing; the three metrics suites only add
`freeholdPersist: () => freeholdPersistStats()` to their stub sources, which (no store registered)
returns all zeros, so even a future assertion there would read vacuously. Proof: mutant G1 pointed
`measure:'held'` at `state.dirty` and all three suites stayed green at 98/98. Failure scenario: a
measure label is renamed or two measures are transposed; an operator's `held`/`stale_writes` alert
silently reads the wrong series, which is exactly the signal that a realm is refusing to write
players' houses. Fix: one arm in tests/server/http/game_metrics.test.ts with a stub source returning
14 DISTINCT values and an assertion per `measure` label (the WOC_BACKGROUND_DB_GATE family in the
same file is the precedent).

**5. SHOULD-FIX (confidence medium) - server/freehold_persist.ts:261. The documented backwards-revision
arm of `noteRevisionMoved` is untested.**
The comment states "A revision that went BACKWARDS is treated as movement too", but the sweep test
(tests/server/freehold_persist.test.ts:713) only moves the revision forward (7 -> 8). Proof: mutant
S2 changed `===` to `<=` and all 232 tests stayed green. Failure scenario: an older record is
reloaded into the live slot (the case the comment names); the row keeps the newer content the realm
is no longer serving, and the divergence is invisible until someone reads the row. Fix: one more
arm in that test setting `rev = 6` after the write and asserting the sweep still arms a write.

**6. SHOULD-FIX (confidence medium) - server/freehold_db.ts:355-359. The INSERT column list is
unpinned in the always-on tier.**
tests/server/freehold_db.test.ts:358 pins only `INSERT INTO account_freeholds`, the ON CONFLICT
clause, the RETURNING clause and the VALUES array - never the column list that maps `$n` to a
column, and never the `$5::jsonb`/`$6::jsonb` casts that the CAS statement does get pinned for
(:425). Proof: mutant D2 transposed `tier` and `layout` in the column list and the four suites
stayed green at 232/232; the pg twin caught it (2 failures), but that tier skips whenever
TEST_DATABASE_URL is unset. Failure scenario: a column added or reordered in the INSERT while the
values array stays put, shipped from any unarmed local run. Fix: one line,
`expect(folded).toContain('(account_id, plot_index, plot_id, tier, layout, trophies, condition, visit_policy, wire_rev) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9::bigint)')`.

**7. NIT (confidence high) - src/sim/freehold/persisted.ts:255. The deliberate empty-id admission
has no fixture.**
The `boundedId` comment states an empty id "is admitted on purpose ... the preservation rule wins
over tidiness", and that is a real behavior choice: refusing it would push a whole owner into
read-only recovery. Proof: mutant P3 added `value.length > 0 &&` and all 232 tests stayed green;
P3b re-ran it against all five freehold sim suites (162 tests) and it still survived. Fix: two rows
in the malformed/valid table driving `itemId: ''` and `trophyId: ''` and asserting `loaded`.

**8. NIT (confidence high) - src/sim/freehold/persisted.ts:551-557. The unserializable-record arm of
`persistedFreeholdBytes` is untested.**
The `catch`/`typeof text !== 'string'` arms return `Number.POSITIVE_INFINITY` so a record JSON cannot
serialize refuses instead of throwing. Proof: mutant P4 changed the catch to `return 0` and all 232
tests stayed green - i.e. a corrupt record would measure as zero bytes and sail through the ceiling.
The function is exported, so the test is two lines: a record with a `BigInt` field, or a circular
`layout`, asserting `Number.POSITIVE_INFINITY`, and that `normalizeFreehold` answers `oversize` for it.

**9. NIT (confidence medium) - server/freehold_persist.ts:227. The stated reason for `drainWaiters`
being a Set is untested.** The comment says a second concurrent `idle()` "can never orphan the first
one's deadline timer", but no test ever has two drains outstanding at once (every `idle(` call site
in the suite is sequential). One arm: two overlapping `idle()` promises, resolve the write, assert
both resolve true and both deadline jobs are cancelled.

**10. NIT (confidence medium) - server/freehold_persist.ts:702-709.** The synchronous
`enqueue`-throws catch arm (counter bump, `running` reset, `maybeRemove`, `drainCheck`) has no test;
only the asynchronous rejection path is driven (:889). One arm with an `enqueue` port that throws
synchronously would cover it.

**11. NIT (confidence medium) - server/freehold_persist.ts:855.** `oldestDirtyAgeMs` is a MINIMUM
over entries, but every stats test has exactly one dirty entry, so the "oldest" semantics is
unpinned: a mutation to `Math.max` or to the last-seen entry would pass. One arm with two entries
dirtied at different `nowMs` values closes it.

**12. NIT (confidence low) - server/freehold_persist.ts:507.** `refuse()` fills the durable-revision
field of a hold with `ABSENT_HEARTH_REVISION`, a constant whose stated meaning belongs to the hearth
clock (:89). Behaviorally it is the string '0' and nothing asserts it, so this is a readability
defect rather than a bug; a `const ABSENT_DURABLE_REV = '0'` beside it would say what is meant.

**13. NO CHANGE NEEDED (recorded so a later pass does not demand it).** The lone-surrogate branch of
`utf8ByteLength` (src/sim/freehold/persisted.ts:534-536) is unreachable through the public API,
because well-formed `JSON.stringify` escapes a lone surrogate into ASCII before the counter sees it.
The suite states this explicitly at tests/freehold_state.test.ts:639-647 and asserts encoder
agreement instead, which is the right call; the function is not exported and no behavior test can
reach the branch.

## Passed (checks that came back clean, stated so the coverage is auditable)

- **Constant self-comparison (Check 2).** Every load-bearing constant asserted against a shared
  import is ALSO pinned to a literal in the same file: `FREEHOLD_MAX_OWNED_BYTES` is fully
  constrained by `bytes === 104_363` plus the two-sided rounding assertions
  (tests/freehold_state.test.ts:739-743), the row ceilings by the literal details
  `layout_over_ceiling:421` / `trophies_over_ceiling:33`, the id ceiling by `toHaveLength(64)`,
  `FREEHOLD_PLOT_ID_RE.source` by its literal (freehold_db.test.ts:151),
  `FREEHOLD_UPKEEP_BINDING_UNBOUND` by `'unbound_no_history'`, the four persist bounds by
  `toBe(10_000/15_000/4/4)`, and `FREEHOLD_HEARTH_ACCOUNT_LOCK_SQL` by its full literal text before
  it is used as an identity comparand. No unmitigated self-comparison found.
- **SQL asserted by clause, not identity (Check 1).** The DDL and both statements are pinned as
  contiguous named-constraint clauses on COMMENT-STRIPPED text (`codeOnly` in both db suites,
  `stripComments` in the persist suite), with occurrence counts (`count(folded, 'CREATE INDEX')`),
  so a commented-out statement cannot keep a pin green. The one comment-gameable pin in the whole
  change is finding 2.
- **Per-field negatives (Check 5).** Both multi-field guards get one-field-corrupted tables with a
  positive control: the hearth counter guard (10 rows, one column each, plus
  "accepts the exact row the negatives corrupt" at :281) and the upsert input guard (10 fields, plus
  the accept-control at :461, each asserting zero SQL was sent).
- **Either/all arms (Check 4).** The insert-conflict diagnosis drives BOTH arms (stale and
  conflict), the CAS zero-row follow-up drives BOTH (stale and missing), the short-circuit and
  permit paths each have their stated "other arm" test, and the ceiling cases assert both at-ceiling
  and one-over. The only quantified claim with an unexercised arm is finding 5.
- **Vacuity controls (Check 8).** The suites carry explicit anti-vacuity arms rather than relying on
  reviewer trust: the corruption helper is proved to corrupt only its named dimension
  (freehold_state.test.ts:140), the fake recorder is proved to record and to report a genuinely
  missing fragment (freehold_hearth_db.test.ts:82), the worst-case id generator is proved distinct
  and maximal (:714), the "ceiling before any row read" claim uses getter-counting probes with a
  positive control (:804 and :811), the diagnostic allowlist has both a refuse arm and a
  pass-everything-the-loader-produces arm (:920), and the malformed-wins-over-oversize ordering
  first proves the fixture genuinely satisfies both arms (:773). The source-order pins carry a
  presence control (freehold_persist.test.ts:1252) so a renamed method cannot pass by absence. I
  found no hand-picked argmax, no never-present negative token, and no prototype-spy vacuity.
- **Hygiene (Check 7).** No `.only(` or `.skip(` in any changed test file; no assertion weakened;
  the one pin this change RELOCATED (`pruneClientPerfReportsBatch`, tests/server/tunables.test.ts:1129)
  follows the moved body into `server/client_perf_reports_db.ts` with its contract intact, and both
  extractions (`bot_detection_snapshot.ts`, `client_perf_reports_db.ts`) landed with new suites
  rather than losing coverage. `isInJailRoom` kept and extended its coverage across the move
  (tests/moderation_game.test.ts:1024-1044, both bounds and the between-the-walls case).
- **Determinism/round-trip (Check 6).** Both fixed points are pinned in both directions plus the
  canonical key order, aliasing is proved in both directions, and the legacy (version-absent) row is
  covered as an explicit back-compat arm.
