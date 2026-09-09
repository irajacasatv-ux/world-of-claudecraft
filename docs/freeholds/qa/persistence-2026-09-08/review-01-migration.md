## Schema & Persistence Safety Review (migration / compatibility / rollback lane)

**Reviewed:** `c18facd4cc..HEAD` on `feature/freeholds`, read-only. Primary:
`server/freehold_db.ts`, `server/freehold_hearth_db.ts`, `server/freehold_persist.ts`,
`src/sim/freehold/persisted.ts`, `src/sim/freehold/state.ts`, the `ensureSchema` and
`exportAccountData` hunks of `server/db.ts`, the `server/game.ts` / `server/ws_auth.ts` /
`server/main.ts` / `server/periodic_save_flush.ts` wiring, `server/character_save_statement.ts`,
and `docs/freeholds/persistence-rollout-contract.md`. Suites run: 232 passed (4 files).

**Tables or JSONB blobs affected:** `account_freeholds` (new; `layout` and `trophies` JSONB),
`account_freehold_hearth` (new), the `PersistedFreehold` document shape, and the
`exportAccountData` bundle (new `freeholds` and `freeholdHearth` keys). `characters.state` is
NOT touched by this change.

### BLOCKING

- **[server/freehold_persist.ts:400 + server/freehold_db.ts:222-241 + src/sim/freehold/persisted.ts:422-424]
  `FREEHOLD_MAX_OWNED_BYTES` is enforced against two DIFFERENT measurements, and the save path
  enforces it against none. A legal record can be written and then permanently refused on load.**
  Confidence: high (measured against PostgreSQL 16 on the dev database).

  `classify` passes `FREEHOLD_MAX_OWNED_BYTES` (104,448) to `freeholdForAccount`, whose SQL
  compares it to `octet_length(f.layout::text) + octet_length(f.trophies::text)`.
  `normalizeFreehold` compares the same constant to `persistedFreeholdBytes`, which is compact
  `JSON.stringify` of the WHOLE record. Those are not the same number. `jsonb::text` emits a
  space after every `:` and every `,`, and jsonb stores numbers as `numeric`, so a double that
  `JSON.stringify` renders in exponential form expands to full decimal text.

  Measured (script and fixture under the scratchpad; the fixture reproduces the published
  104,363 exactly):

  | Record | sim measure (`persistedFreeholdBytes`) | SQL measure (`owned_bytes`) |
  |---|---|---|
  | the published maximal legal fixture (`tests/freehold_state.test.ts:729-744`) | 104,363 (admitted) | **238,468** (2.28x the limit) |
  | a realistic 420-row house, 24-char item ids, full-precision coords | 64,699 | 69,714 (+7.75%) |

  `runWrite` (`server/freehold_persist.ts:614-658`) serializes and writes with NO byte check
  (`counters.lastWriteBytes` at :641 is recorded, never compared), and `requireUpsertInput`
  (`server/freehold_db.ts:392-418`) has no byte bound either.

  Failure scenario: an owner fills a Citadel to the ceiling the workbook publishes as legal.
  Every autosave succeeds. The realm restarts. `freeholdForAccount` measures the stored row at
  more than the limit, returns `{ kind: 'oversize' }`, `holdResult` write-blocks the account,
  and `installLoadedFreehold` installs nothing, so the owner is served a fresh tier-0 Inn Room
  over a real home that is now read-only on every subsequent boot forever, with no operator
  path back other than raising the constant. The 7.75% realistic gap means the effective load
  ceiling is about 96,900 sim-measured bytes, not 104,448, and nothing states that.

  Note the two published witnesses do not catch this: `tests/freehold_state.test.ts` only ever
  measures in the sim, and `tests/server/freehold_db.pg.test.ts:510` drives the SQL bound with
  an artificial `4096` limit. No test round-trips a near-ceiling record through the real SQL
  read. Fix direction is a decision, not a nit: either measure the same bytes on both sides
  (compare the SQL `owned_bytes` to a separately derived SQL-side constant), or add the
  `persistedFreeholdBytes` refusal to `runWrite` that section 7 of the contract already claims
  exists, so a record that cannot be read back is never written.

### SHOULD-FIX

- **[server/freehold_db.ts:88, :355-359, :370-380] `schema_version` can never be advanced by any
  code in this change, so the forward-version guard is inert for any future shape bump that
  reuses the existing columns.** Confidence: high.
  The column defaults to a hardcoded `1` that is not cross-pinned to `FREEHOLD_PERSIST_VERSION`;
  `FREEHOLD_INSERT_SQL` omits the column, so every insert takes that default; and
  `FREEHOLD_CAS_UPDATE_SQL` omits it from the SET list. The header at :16 groups it with the
  upkeep columns and `created_at`, but it is neither an upkeep column nor a mint-once identity:
  it is the shape declaration the loader's first arm reads.
  Failure scenario: release N+1 bumps `FREEHOLD_PERSIST_VERSION` to 2 and changes a persisted
  meaning without changing the column set (a condition rescale, a `yaw` unit change). Its saves
  go out through the same CAS UPDATE and leave `schema_version = 1`. A rollback to this release
  reads version 1, `normalizeFreehold` accepts the row as its own, and the next autosave
  rewrites it under version-1 semantics. The unsupported arm that exists to prevent exactly
  this never fires. Compounding: `CREATE TABLE IF NOT EXISTS` never revisits a DEFAULT, so
  fixing it later needs an `ALTER ... SET DEFAULT`, and rows already written by v2 but stamped 1
  are indistinguishable from real v1 rows and cannot be backfilled. Cheap now (no rows exist,
  the feature is dark); unfixable after activation. This is the strongest reason to fix in this
  change rather than the next.

- **[server/freehold_persist.ts:757-776] The leave flush uses a strictly weaker dirty test than
  the periodic sweep, and no production code calls `markDirty`, so an edit made in the last
  autosave window before logout is lost.** Confidence: high.
  `saveAllDirty` (:750-755) arms on `noteRevisionMoved(entry) || isDirty(entry)`.
  `flushAndRelease` arms only on `isDirty(entry) || entry.running || entry.pending`. A repo-wide
  grep finds `store.markDirty` called only from `tests/server/freehold_persist.test.ts`; the
  server never calls it, which the `noteRevisionMoved` comment at :244-249 acknowledges as the
  design.
  Failure scenario: a player is granted a tier through `setFreeholdTier` (which bumps `rev` but
  calls no store hook), then logs out inside the ~30 s autosave window. `flushAndRelease` sees
  `dirtyGeneration === committedGeneration`, writes nothing, drops the ref, and `maybeRemove`
  deletes the entry; `releaseFreeholdOnLeave` evicts the live record. The grant is gone with no
  durable trace. This widens sharply once phase 13 adds placement, since every furnishing move
  will ride the same unmarked path. One-line fix: `noteRevisionMoved(entry) || isDirty(entry) || ...`
  (it already returns false for a blocked entry). Every existing `flushAndRelease` test calls
  `markDirty` first, so the gap is untested. The shutdown arm is NOT affected:
  `server/main.ts:4249` calls `game.saveFreeholds()` (which is `saveAllDirty`) before
  `freeholdPersistIdle`, so shutdown does see an unmarked move.

- **[docs/freeholds/persistence-rollout-contract.md:242-244] Section 7's "TWO-LAYER" enforcement
  claim is false in both halves.** Confidence: high.
  It says "the same ceiling is re-checked in the sim, through `persistedFreeholdBytes`, before
  mutation and before save". `persistedFreeholdBytes` has exactly one production caller,
  `normalizeFreehold` at `src/sim/freehold/persisted.ts:423`, which is a LOAD path. There is no
  save-path check. And "the same ceiling" is not the same measure, per the blocking finding
  above. Rewrite to state that the SQL layer bounds the stored jsonb text of the two content
  columns and the sim layer bounds the canonical JSON of the whole record on load only, or land
  the save-side check the sentence describes.

- **[docs/freeholds/persistence-rollout-contract.md:147] The "oversized" fixture row claims
  `normalizeFreehold` refuses "BEFORE deep allocation, mutation or decode". It does not.**
  Confidence: high. `src/sim/freehold/persisted.ts:26-48` documents the order itself: arm 8
  builds the candidate (`buildLayoutRows` / `buildTrophyRows`, called "the one deep allocation"),
  arm 9 measures the bytes. The SQL layer does refuse before decode; the sim layer allocates
  first. The allocation is bounded by the row-count and id-length ceilings, so this is a doc
  defect rather than an unbounded-work defect, but the contract states the opposite of the
  module's own header and a later reader will rely on it.

- **[docs/freeholds/persistence-rollout-contract.md:145] The "future" fixture row attributes
  `{ kind: 'unadmitted' }` to a forward `schema_version`.** Confidence: high.
  The row bundles three different inputs and then names both answers for all of them.
  `freeholdForAccount` answers `unadmitted` for the `plot_index` variant only
  (`server/freehold_db.ts:303-314`); a forward `schema_version` and an unknown `tier` or
  `visit_policy` come back as `{ kind: 'row' }` and are classified `unsupported` by
  `normalizeFreehold`. Split the row, or say which variant produces which answer. An operator
  reading this literally would look for an `unadmitted` diagnostic that a forward-version row
  never emits.

- **[server/freehold_db.ts:112-113] The inline `plot_id` charset CHECK is the one policy
  vocabulary frozen into the DDL, and `CREATE TABLE IF NOT EXISTS` can never relax it.**
  Confidence: medium (a judgement about a future widening, not a present bug).
  This is the direct answer to the brief's question about whether the shape-only split is
  complete: for `tier`, `visit_policy` and `upkeep_binding` it is correct and complete, and the
  reasoning in the comments is right. But `CHECK (plot_id ~ '^[A-Za-z0-9_:-]{1,64}$')` is the
  same class of thing: a policy the wire and `mintFreeholdPlotId` (:507-516) already enforce in
  TypeScript, duplicated where it can never be revised.
  Failure scenario: a later release widens the opaque id (a longer id for a second plot
  namespace, or a new separator). `mintFreeholdPlotId` is updated, the wire is updated, and the
  first insert on an EXISTING realm raises 23514 on a row every other layer considers legal,
  with no `ALTER TABLE ... DROP CONSTRAINT` anywhere in the codebase and no migration mechanism
  to add one. Since the mint function already fails closed on the charset, dropping the CHECK to
  a shape-only `plot_id <> '' AND length(plot_id) <= 128` would preserve the DDL's stated
  intent without freezing the vocabulary. Two weaker members of the same class, worth a
  conscious decision rather than a fix: `CHECK (condition BETWEEN 0 AND 100)` at :124-125 (a
  rescale becomes one-way) and `CHECK (jsonb_typeof(layout) = 'array')` at :138-141 (a v2 that
  keyed placements by id becomes one-way).

### INFO / nits

- **[src/sim/freehold/persisted.ts:345-348]** The forward-version arm fires only for a FINITE
  NUMBER greater than the version. A `version` that is a string, boolean, `null` or `NaN` falls
  past it, survives `onlyKnownFields`, and is repaired to 1 at :409, so the record loads and the
  next save writes it back as this binary's shape. Not reachable from the DB path today
  (`schema_version` is `INT NOT NULL CHECK (>= 1)` and `rowDocument` always supplies a number),
  but the arm is documented as the guard that runs "before this binary's shape is imposed on the
  row at all", and a non-numeric version is exactly the case where that matters. Confidence:
  medium on it being worth changing, high on the behavior.

- **[server/freehold_persist.ts:393]** `rowDocument` does `rev: Number(row.wireRev)`, narrowing
  the exact bigint text that `server/freehold_db.ts:9-13` says never becomes a JS number, and
  the narrowed value is what the next save writes back to `wire_rev`. Unreachable in practice
  (one bump per edit against 2^53), and `rev` is a declared repairable scalar, so this is a
  consistency nit rather than a defect. Note the failure mode if it ever were reached is not
  silent: `requireUpsertInput`'s `Number.isSafeInteger(input.wireRev)` throws, which
  `launch(...).catch` absorbs into `writeFailures` without quiescing.

- **[server/freehold_persist.ts:508]** `refuse()` fills a plot `FreeholdRecoveryHold.durableRev`
  with `ABSENT_HEARTH_REVISION`. Correct value ('0'), wrong constant: it names the hearth clock's
  absent revision, which has nothing to do with a plot's durable fence. Same at :910.

- **[src/sim/freehold/persisted.ts:394-401 vs server/freehold_db.ts:409-411]** `normalizeFreehold`
  clamps `condition` into 0..100 but never rounds, so a fractional condition inside the range
  loads with NO repair reported; `requireUpsertInput` then requires `Number.isSafeInteger` and
  throws on every save of that record. Unreachable from the DB (`condition` is `SMALLINT`), so
  this only bites a non-DB caller of the pure loader, but the two boundaries disagree about what
  a legal condition is.

- **[src/sim/freehold/persisted.ts:249]** `integerNumber` bounds `placementId` and `plinth` by
  integrality only, with no MAGNITUDE bound. Combined with jsonb's `numeric` expansion, one
  furnishing with `placementId: 1.7976931348623157e+308` costs 24 bytes in the sim measure and
  310 bytes on disk. Harmless today (nothing mints placement ids yet), but when phase 13 lets a
  client propose one, the magnitude bound needs to exist or an owner can push their own row past
  the SQL bound and self-inflict a permanent hold. Flagging now because the ceiling derivation is
  being frozen in this change.

- **[server/freehold_db.ts:355-359]** `ON CONFLICT (account_id, plot_index) DO NOTHING` covers the
  primary key only; a collision on the `account_freeholds_plot_id` unique index (:150-151) would
  raise 23505 out of `upsertFreehold` rather than reaching the `currentDurableRev` diagnosis.
  Reachability is effectively zero (a `randomUUID` collision), and the throw is absorbed by
  `launch(...).catch`, so this is a completeness note on the "at most two round trips, and the
  second only ever DIAGNOSES" comment, not a defect.

- **Monolith counts, reported as the brief asks rather than raised:** `server/db.ts` 4,605 lines,
  `server/game.ts` 9,978 lines. The ceilings in `tests/monolith_budget.test.ts` (:1257, :1639)
  are not yet lowered to these.

### PASSED

- **Additive, idempotent DDL.** Both fragments are `CREATE TABLE IF NOT EXISTS` plus one
  `CREATE UNIQUE INDEX IF NOT EXISTS`. No `ALTER`, no `DROP`, no rename, no data migration, no
  backfill. Re-running either against an existing database is a no-op. Both are new tables, so
  the `NOT NULL` columns without defaults (`tier`) cannot fail an `ALTER` on a populated table.
- **Boot and advisory-lock safety.** I read the `ensureSchema` body: both fragments are applied
  on the one client inside the advisory-locked transaction, after the `accounts` parent and
  before `BANK_LEDGER_GROWTH_BUDGET_SCHEMA`, which is the final fragment as section 2 claims.
  Applied unconditionally, never behind `freeholdsEnabled`. No seeding, no backfill, no
  first-boot data step, so nothing to duplicate across concurrent realm boots. Neither fragment
  touches `search_path` (correct: `SET LOCAL` there would leak into every later fragment). No
  `CREATE INDEX CONCURRENTLY` is added, so `server/concurrent_indexes.ts` is correctly untouched.
- **The shape-only split for `tier`, `visit_policy` and `upkeep_binding` is correct.** Each is
  bounded for non-emptiness and length only; the vocabularies live in
  `FREEHOLD_TIER_IDS` / `FREEHOLD_VISIT_POLICIES` and are passed into `normalizeFreehold` as
  values. A retired or forward identity reads back and is preserved read-only rather than
  raising 23514 on a row a later release considers legal. The `unbound_no_history` conditional
  CHECK is safe under a future rename (it goes vacuous, not wrong). The only exception is
  `plot_id`, raised above.
- **ON DELETE policy per row class.** Both tables key and foreign-key on `accounts(id) ON DELETE
  CASCADE` and neither references `characters`, which is exactly what contract section 6 claims:
  character deletion preserves housing, account deletion cascades both. Pinned end to end in
  `tests/server/freehold_db.pg.test.ts:500-508`. The cascade probe rides the
  `PRIMARY KEY (account_id, plot_index)` leading prefix, so the deliberate absence of a separate
  `account_id` index is correct.
- **Parameterized SQL.** Every runtime statement uses `$1..$n`. The only interpolations are the
  schema identifier (guarded by `/^[a-z_][a-z0-9_]*$/` and quoted), the
  `FREEHOLD_UPKEEP_BINDING_UNBOUND` DDL default, and `FREEHOLD_ACCOUNT_PLOT_READ_LIMIT` in a
  `LIMIT` clause: all server-controlled constants in DDL or a fixed bound, which is the
  sanctioned exception. No runtime or user value is concatenated anywhere.
- **Unsupported is not absence, and nothing drops owned content.** The five arms preserve the
  row in every non-`loaded` case; `blocked()` gates `save`, `saveAllDirty` and `flushAndRelease`
  alike; a stale CAS quiesces rather than retrying or overwriting; `installLoadedFreehold`
  installs nothing on a hold; a dark realm and an unregistered store both answer a HOLD rather
  than an absence. The only rewritten values are the three declared scalars, none of them
  content. `freeholdsForExport` hands unsupported and oversized rows out as stored.
- **JSONB shape contract and the round-trip fixed point.** Row to `rowDocument` to
  `normalizeFreehold` to `freeholdStateFromPersisted` to `serializeFreehold` to
  `persistedFreeholdFromState` to the CAS SET list preserves `tier`, `layout`, `trophies`,
  `condition`, `visitPolicy` and `rev` exactly; `plotId` is written on insert only and never
  re-minted; repairs converge on the second pass. `isDecorating` is neutralized at the sim
  boundary and absent from the durable shape. The upkeep columns are provably outside the SET
  list, so a plot save cannot clear a checkpoint or a credit. The three unbound live fields reset
  to zero on reload, which is documented and correct for an unbound row today.
- **Save cadence.** `saveFreeholds` is in `PERIODIC_SAVE_WRITE_NAMES`, `flushAndRelease` runs on
  leave before the lease release, and the shutdown closure calls `game.saveFreeholds()` then
  drains via `freeholdPersistIdle` before `releaseAllCharacterLeases`, which is the slot section 8
  specifies and the right one. The gap is the leave arm's dirty test, raised above, not the
  trigger set.
- **Type integrity.** `durable_rev` and `wire_rev` are BIGINT and cross the boundary as exact
  TEXT with a `^[0-9]+$` guard; the hearth counters are BIGINT compared with `BigInt`, and its
  advance is monotone in the statement (`GREATEST` plus `revision + 1`). `condition SMALLINT`
  matches a 0..100 integer. No 32-bit overflow candidate.
- **Retention and keep-forever.** Neither table appears in the retention sweep, the absence is
  pinned in `tests/server/main_retention_wiring.test.ts`, and both DDLs carry the keep-forever
  rationale. Both ride `exportAccountData` under `freeholds` and `freeholdHearth`.
- **The mixed-release story in section 3 is TRUE where it matters most.** I verified the load
  bearing claim against source: all three fence shapes in `server/character_save_statement.ts`
  write `state = $3` with the whole re-serialized blob, so the contract's whole-blob replacement
  hazard is real as stated, and its conclusion that housing therefore belongs in normalized
  tables is sound. An incapable release genuinely applies neither fragment (no import, no query
  naming either table), genuinely leaves both tables intact, and genuinely neither maintains nor
  exports them. Section 8's "flag off before rolling back" ordering and the read-only
  verification block (no `DELETE`, and none may be added) are correct. The three falsehoods I
  found are in sections 4 and 7 and are listed above; section 3 and section 8 stand.

### Explicit answers to the questions in my role line

1. **Additive idempotence under repeated boot:** yes, both fragments. No caveat.
2. **Can an inline CHECK raise 23514 on a legal future row?** The `tier` / `visit_policy` /
   `upkeep_binding` split is correct, and enforcing those vocabularies in TypeScript is the right
   call. The split is NOT complete: `plot_id`'s charset and 64-character bound is a policy frozen
   inline, and `condition BETWEEN 0 AND 100` and `jsonb_typeof(layout) = 'array'` are weaker
   members of the same class.
3. **ON DELETE per row class:** correct for both tables, and matches the contract.
4. **Versioned load forward compatibility:** a newer numeric `schema_version` is refused whole and
   preserved (correct), but the column can never be SET to a newer value by any code here, which
   makes that arm inert for the future release it exists to protect against. A non-numeric
   version slips past the arm. An unknown tier and an unadmitted `plot_index` are both handled
   correctly. Both oversize and malformed resolves to `malformed`, matching the documented arm
   order.
5. **Can anything silently drop, truncate or rewrite owned content?** Not on the load path, and
   not on the save path's SET list. It CAN be silently lost in two ways: never written at all on
   the leave arm (should-fix 3), and written but then unreadable forever through the divergent
   byte measure (blocking 1).
6. **JSONB shape contract and round-trip fixed point:** holds.
7. **Does the rollout contract state the mixed-release story truthfully?** Yes for sections 3 and
   8, which are the ones that carry the rollback story, and I verified the
   `character_save_statement.ts` claim against source. No for section 7's two-layer enforcement
   sentence and for two rows of the section 4 fixture table.
