# Privacy & Security Review: Freeholds bounded persistence (c18facd4cc..HEAD)

Reviewed in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds (read-only).
Range c18facd4cc..HEAD, 6 commits, 48 files, 8924 insertions / 218 deletions.

Read in full: server/freehold_db.ts, server/freehold_hearth_db.ts, server/freehold_persist.ts,
src/sim/freehold/persisted.ts, src/sim/freehold/load_report.ts, server/bot_detection_snapshot.ts,
server/client_perf_reports_db.ts, the diffs to server/db.ts, server/game.ts, server/main.ts,
server/ws_auth.ts, server/http/game_metrics.ts, server/periodic_save_flush.ts, src/sim/jail.ts,
src/sim/freehold/{index,types}.ts, .env.example, DEPLOY.md. Also read for the seam:
server/freehold_wire.ts, server/sim_boot_config.ts, server/linkdead.ts (planJoin),
src/sim/freehold/{state,hearth_key}.ts, server/account.ts (export route).

Verification run: npx vitest run tests/freehold_state.test.ts tests/server/freehold_db.test.ts
tests/server/freehold_hearth_db.test.ts tests/server/freehold_persist.test.ts
-> Test Files 4 passed (4), Tests 232 passed (232).

Measured monolith counts (the brief asks for numbers, not a finding):
server/game.ts 9978 (ceiling 9983), server/db.ts 4605 (ceiling 4744).

## BLOCKING

None. No client value can authorize a Hearth entry or shape a durable row, every statement is
parameterized, no secret is added or logged, and the dark realm neither queries nor writes.

## SHOULD-FIX

1. **A preload whose handshake then fails leaks its store entry forever, and the stale entry
   later replays a stale house.** server/freehold_persist.ts:397-411 and :547-575, reached from
   server/ws_auth.ts:477. `classify` calls `ensureEntry`, which inserts into `entries`; the only
   removal is `maybeRemove`, reachable only from `settle` and `flushAndRelease`. `retain` happens
   later, inside `game.join` (server/game.ts:3293). Every path between them that returns without
   joining leaks: `!leased` (ws_auth.ts:480, the ordinary relog / second-client case),
   `!refreshedCharacter` (:509), `force_rename` (:517), and a throw from `getCharacter`.
   Severity should-fix, confidence high on the mechanism (the suite's own eviction test at
   tests/server/freehold_persist.test.ts:313-316 has to call `retain` then `flushAndRelease` to
   clear an entry a bare `preload` created).
   Failure scenario A (memory): N distinct accounts hit a lease conflict over one realm uptime;
   each leaves one permanent entry holding up to FREEHOLD_MAX_OWNED_BYTES (102 KiB) of parsed
   layout and trophies in `entry.state`. Nothing sweeps it, and `stats().entries` overcounts.
   Failure scenario B (staleness): account A's join fails on realm 1 after the read, leaving a
   loaded entry. A plays on realm 2 and redecorates. A rejoins realm 1 hours later; `preload`
   takes the `entry?.loaded` replay path (:561-564), installs the HOURS-OLD house, and the first
   save fences on the stale `durableRev`, so the CAS returns 'stale' and the owner is quiesced
   for the whole session while seeing the wrong house.

2. **The `hasLive` short circuit can mint a permanently write-blocked entry, silently discarding a
   whole session of housing edits.** server/freehold_persist.ts:552-557 with server/game.ts:3904
   vs :3923. `leave` calls `flushAndRelease` at 3904 (entry deleted, refs 0) but evicts the sim
   record only at `removePlayer` (3923), with an awaited `releaseCharacterLease` between them.
   In that window `ctx.freeholds` still holds the record while the store entry is gone.
   Failure scenario: character A of account X logs out; while A's leave is awaiting the lease
   release, character B of the same account completes its handshake. `preload` sees
   `ports.hasLive(ownerKey)` true, so it returns early through `ensureEntry`, which creates a
   FRESH entry with `loaded: false`; nothing on the session path ever sets `loaded` again
   (`preload` is called once per fresh join and short-circuits identically on any later
   same-account join). `blocked()` (:271) is therefore true for B's entire session, so `save`,
   `saveAllDirty` and `flushAndRelease` all no-op SILENTLY (`arm` returns with no warn at :715).
   Every furnishing B places that session is lost at logout, with no log line and no counter
   beyond `held` staying 0 (a `loaded:false` entry is not counted as held either). Severity
   should-fix; confidence high on the mechanism, medium on how often the window is hit (it needs
   a concurrent same-account join inside one DB round trip).

3. **The owned-bytes ceiling is enforced on READ only, never on WRITE, so the store can persist a
   row it can never read back.** server/freehold_persist.ts:639-641 computes
   `counters.lastWriteBytes` and then writes regardless; `FREEHOLD_MAX_OWNED_BYTES` is checked
   only in `normalizeFreehold` (src/sim/freehold/persisted.ts:422-424) and in the SQL bound
   (server/freehold_db.ts:232-233). Today the ceiling was derived to admit the maximal legal
   record (420 rows / 32 trophies / 64-char ids = 104,363 bytes under 104,448), so it is not
   reachable now.
   Failure scenario: a later content change raises the largest `decorBudget` past 420, or lowers
   the smallest positive `decorCost` below 1, without re-deriving FREEHOLD_MAX_OWNED_BYTES. A
   player fills the new budget, the save succeeds, and at the next login the account read
   classifies the row 'oversize', which is a PERMANENT write-blocking hold: their house becomes
   read-only and never recovers on its own. The asymmetry is the defect; a write-side refusal (or
   at minimum a warn) would fail closed. Severity should-fix, confidence high on the asymmetry,
   medium on reachability. The same asymmetry applies to FREEHOLD_MAX_LAYOUT_ROWS and
   FREEHOLD_MAX_TROPHY_ROWS.

4. **`schema_version` has no writer at all, so the version-preservation arm can never fire.**
   server/freehold_db.ts:355-359 (INSERT column list omits `schema_version`, taking the DDL
   default 1) and :370-380 (the CAS SET list excludes it, with a comment saying it "stays exactly
   as the writer that owns them left them"). No such writer exists anywhere in the diff, and
   `PersistedFreehold.version` is never mapped to the column.
   Failure scenario: a later release bumps FREEHOLD_PERSIST_VERSION to 2 and writes v2 content.
   The row still reports `schema_version = 1`, so `rowDocument` (freehold_persist.ts:386) hands
   `version: 1` to `normalizeFreehold`, and the "version FIRST, before this binary's shape is
   imposed" arm (persisted.ts:345-348) never triggers on a rollback. If v2 adds a field the old
   binary still refuses via `unknown_field` (malformed, preserved), but if v2 only changes the
   MEANING of an existing field, the old binary reads it as a valid v1 record and re-saves it,
   which is the exact silent content edit this file is built to prevent. Severity should-fix,
   confidence high on the fact, medium on the impact.

5. **The server's load site bypasses the bounded diagnostic reporter that was written for it.**
   src/sim/freehold/load_report.ts is a positive-shape detail bound that "fails closed", exported
   on the barrel (src/sim/freehold/index.ts:39-43), but server/freehold_persist.ts:478-491 rebuilds
   the detail string by hand and :338-340 / :457-459 log it (and
   `normalized.repaired.join(', ')`) straight to `ports.warn`. Nothing on the shipped path calls
   `freeholdLoadDiagnostic` or `warnFreeholdLoad`.
   Failure scenario: a future edit to persisted.ts echoes a row value into a `detail` (an item id,
   a plot id, an over-long string) to make a fault easier to diagnose. `load_report.ts` would
   replace it with `unclassified`; the shipped server path prints it verbatim into the realm log,
   which is exactly the unbounded-bytes-in-a-log-costume problem that file's header names.
   Severity should-fix, confidence high.

6. **The development tier grant becomes DURABLE for the first time, and nothing says so.**
   server/sim_boot_config.ts:35 derives `freeholdDevGrantEnabled` from `ALLOW_DEV_COMMANDS === '1'`;
   `devGrantFreeholdTier` writes through `setFreeholdTier`, which bumps the record revision, and
   the new `noteRevisionMoved` sweep (server/freehold_persist.ts:257-265) reads that bump as an
   edit and writes the granted tier to `account_freeholds`. Before this change a grant died with
   the realm process.
   Failure scenario: a staging or dev realm runs with ALLOW_DEV_COMMANDS=1 against a shared or
   later-promoted database; a granted Citadel is now a durable row that outlives the flag, the
   process, and any later `ALLOW_DEV_COMMANDS=0`, and loads as a real entitlement once
   FREEHOLDS_ENABLED goes on. This does not violate the ALLOW_DEV_COMMANDS rule (production must
   never set it), but it converts a previously ephemeral cheat into a permanent one, and it is the
   kind of fact docs/freeholds/persistence-rollout-contract.md and the DEPLOY.md paragraph should
   state. Severity should-fix (documentation, or an explicit refusal to persist a dev-granted tier),
   confidence high on the mechanism.

## NIT

7. **An internal account id reaches a console line.** server/freehold_hearth_db.ts:129 (also :212,
   :218, :226, :245) interpolates `account ${accountId}` into `detail`, and
   server/freehold_persist.ts:364 logs that detail through `ports.warn`. It contradicts the
   identity-free diagnostic invariant stated in src/sim/freehold/load_report.ts:8-15 and in
   FreeholdPersistStats (freehold_persist.ts:141-144). There IS house precedent for logging an
   account id (server/epic/routes.ts:111, server/account_wealth.ts:326), so this is a nit rather
   than a rule 8 violation; the plot-side warns correctly log only `plotIndex`. Confidence high.

8. **A bigint crosses into a JS number one layer above the boundary that forbids it.**
   server/freehold_persist.ts:393 does `rev: Number(row.wireRev)` on a value freehold_db.ts is at
   pains to hand up as exact text. Harmless today (wire_rev increments once per sim edit and the
   save path refuses a non-safe integer at freehold_db.ts:412), but it is the one place the stated
   discipline is broken, and the consequence would be a permanently throwing write rather than a
   fenced one. Confidence high on the fact, low on the impact.

9. **`requireUpsertInput` does not bound the two lengths the DDL CHECKs.** server/freehold_db.ts:400-405
   requires `tier` and `visitPolicy` non-empty, while the table CHECKs `length(...) <= 64` and
   `<= 32` (:129, :132). Unreachable today (both are closed short unions), but the module's own
   rule is "every structural refusal happens BEFORE a byte reaches the database" (:388-391); a
   longer future identity would raise 23514 instead of a clean TypeError. Confidence high.

10. **A thrown database error does not quiesce, so the 30 s sweep can retry a permanently failing
    write forever.** `applyWriteResult` quiesces on 'stale', 'missing' and 'conflict'
    (server/freehold_persist.ts:594-611), but a raised pg error unwinds through the `.catch` at
    :687-691, which only counts and logs; `settle(entry, false)` then leaves the entry armable, and
    the next `saveAllDirty` re-arms it. The header at :12-32 claims "a failing row cannot become a
    retry loop against the pool", which is true only for the three diagnosed results. Concrete
    (if unlikely) input: a `plot_id` unique-index violation (23505), which the insert's
    `ON CONFLICT (account_id, plot_index)` does not cover, retried every sweep for the realm's life.
    Confidence high on the mechanism, low on reachability.

11. **A hearth constant is used as a plot revision.** server/freehold_persist.ts:508 sets
    `durableRev: ABSENT_HEARTH_REVISION` on a FreeholdRecoveryHold. Same string ('0'), wrong
    vocabulary; `freeholdPreloadUnavailable` (:910) uses the literal for the same field. Cosmetic.

12. **`advanceFreeholdHearthOnClient` has no production caller.** The module header
    (server/freehold_hearth_db.ts:11-14) says "every accepted remote entry re-reads and advances
    this row inside the entry transaction", but the only online entry gate is
    `freeholdKeyAdmission: () => false` (server/sim_boot_config.ts:54) and the live cooldown is the
    process-local map in src/sim/freehold/hearth_key.ts:31-34. Contract 5 is correct AS WRITTEN and
    the fence is closed (no bypass exists), but the prose describes a path that does not exist yet;
    a reader could believe the durable clock is live. Confidence high.

13. **`meta.freehold` is read off a spread bag with no structural guard.** server/game.ts:3292 reads
    `meta.freehold` from the join meta, which is built as `{...meta, ...}` in
    server/ws_auth.ts:365-393. This is SAFE today: `requestMetadata` returns a closed
    `{ ip, userAgent }` (server/main.ts:1390), the fresh arm sets `freehold` AFTER the spread
    (ws_auth.ts:545), and the resume arm cannot reach `installLoadedFreehold` because `planJoin`
    only ever answers 'resume' or 'reject' when `sameCharacter` is non-null
    (server/linkdead.ts:72-86), with no await between the `hasSessionForCharacter` check and
    `game.join`. It is worth naming because the failure mode if any of those three facts changes is
    a client-declared house: `installLoadedFreehold` would call `loadFreehold` with a forged tier
    and layout, and the store would then persist it. Labelled an opinion / hardening note, not a
    defect. Confidence high that it is not exploitable today.

## INFO

- `noteRevisionMoved` (server/freehold_persist.ts:257-265) deep-serializes EVERY loaded owner on
  every periodic sweep, up to 452 rows each. The comment acknowledges the cost; flagging it for
  the hot-path reviewer's lane rather than mine.
- `freeholdsForExport` (server/freehold_db.ts:523-536) is deliberately unbounded in size so an
  oversized row rides out as stored. Correct for a subject-access read; it does mean the export
  response has no ceiling if a row ever exceeds the load bound. The route is rate limited
  (server/account.ts:466).

## PASSED

- **Parameterized SQL, every statement.** All six freehold statements use `$n` placeholders. The
  only interpolations are module constants: `LIMIT ${FREEHOLD_ACCOUNT_PLOT_READ_LIMIT}`
  (freehold_db.ts:241) and `'${FREEHOLD_UPKEEP_BINDING_UNBOUND}'` (:96, :145).
- **Both DDL builders' schema substitution is safe.** `freeholdSchema` (freehold_db.ts:71-75) and
  `freeholdHearthSchema` (freehold_hearth_db.ts:65-69) reject anything outside
  `/^[a-z_][a-z0-9_]*$/` before quoting, and substitute into a quoted placeholder. The only callers
  pass the default 'public' or a hardcoded test constant ('freehold_pg_test',
  'freehold_hearth_pg_test'). No user input reaches an identifier.
- **`persistedFreeholdFromState` drops `ownerKey`, verified.** src/sim/freehold/persisted.ts:432-453
  copies eight named fields and no owner identity; `PersistedFreehold` has no such member; the
  round trip re-attaches it from the caller's argument (:468-471). No internal account identity
  enters the durable blob, so a later plot transfer cannot carry the seller's key.
- **No account id or owner key reaches a viewer.** `LoadedFreehold` is consumed only by
  `installLoadedFreehold`; nothing puts it on a wire frame. The owner key
  (`account:<id>`, freehold_wire.ts:113-118) is server-only and stamped from the authenticated
  session, never from a frame.
- **Metric labels are bounded.** The new `woc_freehold_persist` gauge
  (server/http/game_metrics.ts:655-677) carries one label, `measure`, over 14 fixed literals. No ip,
  account, token or id. `FreeholdPersistStats` is counts, byte totals and millisecond totals only.
- **Client values cannot authorize a Hearth entry or shape the durable row.** The write path
  serializes exclusively from the live sim record (`serializeFreehold`, freehold_persist.ts:1002-1005)
  keyed by the server-stamped owner key; `installLoadedFreehold` moves `freeholdKeyReadyAtMs` FORWARD
  ONLY (:967-972); `advanceFreeholdHearthOnClient` takes its epoch from `now()` under the account
  participant lock and advances with `GREATEST(...)` plus `revision + 1`; `place_furnishing` takes a
  bag SLOT, never an item id (freehold_wire.ts:194-205).
- **Dark realm: no durable query, and a hold rather than an absence.** server/main.ts:3820-3823 calls
  `freeholdPreloadUnavailable` when `freeholdsEnabled(process.env)` is false, so no row is read; the
  hold makes `installLoadedFreehold` a no-op and every entry write-blocked, so a realm that never
  read a row can never write an empty default over it. `freeholdPreloadForAccount` answers the same
  hold when no store is registered.
- **Account data export.** Both loaders are `WHERE account_id = $1` and ride the bearer-resolved,
  rate-limited self-service route (server/account.ts:463-476). `freeholdsForExport` returns every
  durable column of the row (including `upkeep_checkpoint`, `upkeep_credit`, both revisions and both
  timestamps) in stable order, unnormalized, so nothing an owner is entitled to is omitted;
  `freeholdHearthForExport` returns the whole hearth row. Neither exposes another account's data and
  neither adds a credential, token or IP to the bundle.
- **Keep-forever and cascade.** Both tables are absent from the retention sweep table list, with the
  reason recorded at server/main.ts:3986-3998; `ON DELETE CASCADE` from accounts(id) is the only
  removal path; no character-deletion path touches either table. The single account DELETE in the
  tree (server/federated_auth_db.ts:12-19) is the unreachable-provision cleanup, which is the
  intended cascade.
- **Secrets.** No credential, key, token or connection string added. `.env.example` and DEPLOY.md
  gain comment-only text. No server-only value reaches a client bundle (`server/freehold_persist.ts`
  is server-side; the sim modules import nothing from server/).
- **Sim determinism and purity.** src/sim/freehold/persisted.ts, load_report.ts, types.ts and jail.ts
  contain no `Math.random`, `Date.now`, `performance.now`, `process.env`, DOM or server import. The
  store keeps its one wall clock and its one `setTimeout` at the server module edge
  (freehold_persist.ts:184-187, :1013).
- **Dev-command gating.** `ALLOW_DEV_COMMANDS` is not defaulted on anywhere in the diff and no
  deploy/compose file sets it; the dev grant still requires both `ctx.devCommands` and
  `ctx.freeholdDevGrantEnabled` (src/sim/freehold/dev_grant.ts:31). See finding 6 for the durability
  consequence.
- **Input validation at the durable boundary.** `requireAccountId`, `requireUpsertInput` and
  `readBigintText` refuse before a byte reaches the database; `normalizeFreehold` bounds container
  shape, `__proto__` own-key pollution, unknown fields, row counts, id lengths and finally bytes,
  in that order, before allocating; the account read is `LIMIT 2` with the size measured in SQL.
- **The two extractions are behavior-preserving.** server/bot_detection_snapshot.ts and
  server/client_perf_reports_db.ts move the bodies verbatim (same parameterized SQL, same columns,
  no new PII); `isInJailRoom` moves unchanged into src/sim/jail.ts.
- **Contracts 2, 3, 4, 8 hold as written.** Install before seed (game.ts:3292 precedes
  `sim.addPlayer` at :3294); the key's FIFO is entered before the permit is requested
  (`runWrite` runs inside `ports.enqueue`, permit acquired at :620); a stale CAS quiesces rather
  than retrying (:594-604); the insert omits and the CAS SET list excludes all three upkeep columns,
  with the DDL CHECK at freehold_db.ts:144-146 making it structural.
