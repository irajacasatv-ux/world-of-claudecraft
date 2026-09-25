# Freehold persistence: capable-release rollout and rollback contract

What this file is: the engineering capability statement for durable player housing.
It sits behind the storage seam the persistence contribution builds
([../../server/freehold_db.ts](../../server/freehold_db.ts),
[../../server/freehold_hearth_db.ts](../../server/freehold_hearth_db.ts) and
[../../server/freehold_persist.ts](../../server/freehold_persist.ts)), and it is the
named producing artifact for the
"Source calendar, lifecycle and rollout capability" row in
[state.md](state.md) "Tracked release and handoff gates". Two things a later reader
must not break. First, this is a contract, never an approval: it states what a capable
release is and what an incapable one does, and it grants nothing. Second, every claim
below is anchored to a real path or an exported symbol, so a rename moves the anchor
and a reader can always check the claim against the tree.

Scope, and what this contract does NOT cover. It covers the two normalized housing
tables, the store that reads and writes them, their export, their lifecycle behavior
and the order in which the feature is turned on and off. It does not cover cross-record
commits, which belong to the [transactional mutation boundary
file](phase-07a-transactional-mutation-boundary.md); it does not cover account
presence, absence or protection history, which belong to the [account lifecycle
file](phase-07b-account-lifecycle.md); it does not cover [arrival-tier
marks](phase-07c-arrival-eligibility.md); and it does not cover [upkeep calendar
facts](phase-13a-authoritative-upkeep-calendar.md). Turning the housing flag off does
not revert those, because none of them exists yet.

## 1. Status

STATUS: `FREEHOLDS_ENABLED` is OFF everywhere and production remains disabled.
Nothing in this file may be read as permission to enable it.

This artifact is UNSIGNED. The named service, operations and database owners must
accept it before upkeep activation, alongside the other artifacts its gate row lists.
An unsigned contract is an engineering description of behavior, not an operator
authorization, and it must never be presented as service, database or operations
acceptance.

The flag itself is `freeholdsEnabled` in
[../../server/freehold_config.ts](../../server/freehold_config.ts): exactly the strict
string `1`, defaulting off, with every other value keeping the realm dark. The REST
status route and the housing wire predicate read it live; `buildRealmSimConfig`
snapshots it once at boot, so a running realm needs a restart to change what its Sim
believes. Flipping the env on a live realm opens the route and the wire while the Sim
stays dark, which is a half-enabled realm and is not a supported state.

## 2. The minimum capable release

The minimum capable release is the first release whose server satisfies every line
below. The release tag is filled in by the wave close that publishes these modules;
until that close lands, this section is a capability test and not a version number.
Do not substitute a guessed tag.

A server is CAPABLE when all of the following hold.

1. It carries [../../server/freehold_db.ts](../../server/freehold_db.ts),
   [../../server/freehold_hearth_db.ts](../../server/freehold_hearth_db.ts) and
   [../../server/freehold_persist.ts](../../server/freehold_persist.ts).
2. `ensureSchema` in [../../server/db.ts](../../server/db.ts) applies BOTH schema
   fragments, `FREEHOLD_SCHEMA` then `FREEHOLD_HEARTH_SCHEMA`, inside the boot
   advisory-locked transaction, after the fragment that creates the `accounts` parent
   both tables reference with `ON DELETE CASCADE`, and before the growth-budget
   fragment that closes the boot transaction. Neither table references the other, so
   their relative order is a convention rather than a dependency, and it is fixed as
   plot then Hearth so the boot-call ordering pin has one stable answer. Both are
   applied UNCONDITIONALLY, never behind `freeholdsEnabled`: the tables exist before
   the feature does, so enabling is a flag change and never a migration.
   `freeholdSchema(schemaName)` exists only for the private-schema real-PG test recipe;
   the unparameterized `FREEHOLD_SCHEMA` arm is the one a boot applies.
3. `exportAccountData` in [../../server/db.ts](../../server/db.ts) exports BOTH tables,
   through `freeholdsForExport` and `freeholdHearthForExport`, under the bundle keys
   `freeholds` (an array, empty when the account owns no plot) and `freeholdHearth`
   (one record, or null). The existing character-state projector reads only
   `characters.state` and cannot reach a normalized table; it must not be asked to.
4. It honors the account Hearth authority through `loadFreeholdHearth` and
   `advanceFreeholdHearthOnClient`. The PLANNED private `fhold/myFreehold.hearthKeyReadyAtMs`
   and `hearthKeyRevision` values are committed UI mirrors. A mirror never authorizes.
   MARKER, so a reader does not mistake this for a shipped path: only
   `loadFreeholdHearth` has a production caller in this release. The advance is
   written, tested against real PostgreSQL and reachable by nothing, because the realm
   participant that would call it is the 07a work. It is listed here because the
   capability the contract names is the whole pair: a release that reads the clock but
   cannot advance it is not capable, and enabling housing on one would hand out a free
   travel on every relogin.
5. It registers the store with `registerFreeholdPersistStore` and drains it with
   `freeholdPersistIdle` in the shutdown closure, in the slot section 8 fixes.
6. It treats both tables as keep-forever. Neither appears in
   [../../server/retention_sweep.ts](../../server/retention_sweep.ts), whose swept-table
   list is declared in [../../server/main.ts](../../server/main.ts); the plot table
   is bounded plots per account and the reverse foreign-key account cascade is its only
   removal path. The obligation is a keep-forever comment at the DDL plus an absence
   assertion in
   [../../tests/server/main_retention_wiring.test.ts](../../tests/server/main_retention_wiring.test.ts),
   the shape that file already uses for `bank_ledger` and the storage receipts.

Every process sharing one `DATABASE_URL` must be capable before housing is enabled on
any of them. Capability is a property of the fleet, not of the process an operator
happens to be looking at.

## 3. What an INCAPABLE release does against a populated database

An incapable release is any build from before these modules existed. Run one against a
database that already holds housing rows and this is exactly what happens.

- It applies NEITHER schema fragment. It has no import for either module, so its
  `ensureSchema` never mentions the tables. Existing tables are left as they are.
- It NEVER reads and never writes either table. It has no loader, no writer and no
  query naming `account_freeholds` or `account_freehold_hearth`.
- It REPLACES `characters.state` wholesale on every character save. Every fence shape
  in [../../server/character_save_statement.ts](../../server/character_save_statement.ts)
  writes `state = $3` with the entire re-serialized blob, and both statement forms
  (`characterUpdateStatement` and `characterPreimageUpdateStatement`) do the same. A key
  the old binary does not know is not merged and not preserved: it is gone on that
  character's next autosave.

The consequence, stated plainly because it is the whole point of this section.

Normalized tables OUTSIDE `characters` SURVIVE an old writer. That survival is a
property of the old binary having no statement that addresses them, and it is the only
thing survival proves. The same old writer:

- does NOT maintain them. Condition, layout, trophies, visit policy and the durable
  revision stop advancing while players keep playing, so the rows silently go stale and
  a later capable binary resumes from a durable revision older than what actually
  happened at the table.
- does NOT export them. Its `exportAccountData` bundle has no `freeholds` key and no
  `freeholdHearth` key, so any subject-access export served during that window is
  incomplete for that account.
- does NOT honor the account Hearth authority. `advanceFreeholdHearthOnClient` never
  runs, so the shared account cooldown is neither observed nor advanced, and the one
  account-keyed row that C01 makes authoritative is bypassed rather than respected.
- DOES delete any housing value that lives inside the character blob, on the first save
  of that character, by the whole-blob replacement above. This is the hazard DEPLOY.md
  already writes down once under "Bank Storage rollback caveats". Keeping housing in
  the normalized tables rather than the blob is what confines this exposure to the
  committed UI mirrors, and it is a reason those mirrors must stay excluded from
  anything durable.

Therefore: NORMALIZED-TABLE PRESERVATION ALONE DOES NOT ESTABLISH MIXED-RELEASE
CORRECTNESS. "The rows are still there" answers a question nobody needed answered. A
mixed fleet, capable and incapable processes against the same database, must NOT have
housing enabled. Deploy the capable build everywhere first, stop the old process before
starting the new one per realm, and do not overlap them during a rolling restart.

## 4. The four fixture classes

The contract is written against four durable-state classes, and the persistence tests
carry a fixture for each. Each row states what the current release does and what it
must never do.

| Class | Fixture | What the current release does | What it must NEVER do |
|---|---|---|---|
| pre-07 | An account with no row in either table, the shape an old release leaves behind | `freeholdForAccount` answers `{ kind: 'absent' }` and `loadFreeholdHearth` answers `{ kind: 'absent' }`, which reads as `ABSENT_FREEHOLD_HEARTH` (ready, revision `0`). The account keeps its in-memory tier-0 Inn Room record, and the first durable write is insert-only (`FreeholdUpsert.expectedDurableRev` null) | Create a second default record, mint a `plot_id` for an account that has never written, report absence as a repair, or write anything at all on a read |
| future | A row whose `schema_version` exceeds `FREEHOLD_PERSIST_VERSION`, or one whose `tier` or `visit_policy` is outside the accepted vocabulary, or one carrying a `plot_index` above `FREEHOLD_PRIMARY_PLOT_INDEX` while only the primary index is admitted | The two causes answer DIFFERENTLY, and the difference is which layer saw the row. A forward version, tier or visit policy reaches `normalizeFreehold`, which answers `{ kind: 'unsupported' }` with the reason `version`, `tier` or `visit_policy`; the SQL reader never inspects those columns. Only the stranded `plot_index` is `{ kind: 'unadmitted' }`, because the slot is the one thing the reader itself admits. The store turns either into a `FreeholdRecoveryHold`, and `installLoadedFreehold` installs the hold in place of a state, so the record is read-only | Rewrite, downgrade, drop, normalize or re-encode the row; let an autosave overwrite it; reinterpret an unsupported shape as absence; or treat an unknown stored identifier as invalid input to be filtered away |
| populated | A legal current row at the measured maximum: `FREEHOLD_MAX_LAYOUT_ROWS` layout rows and `FREEHOLD_MAX_TROPHY_ROWS` trophies, with identifiers at `FREEHOLD_MAX_ID_LENGTH` and a `plot_id` at `FREEHOLD_PLOT_ID_MAX_LEN` matching `FREEHOLD_PLOT_ID_RE` | Loads unchanged and round-trips through `persistedFreeholdFromState` and `freeholdStateFromPersisted` without loss. Repairs are confined to the scalar set `FreeholdRepairedField` (`condition`, `rev`, `version`) and are reported in `FreeholdLoadResult.repaired` | Truncate, reorder or de-duplicate rows to make the maximum fit; repair a field it did not actually change; or let one scalar repair disturb any unrelated field |
| oversized | A row past `FREEHOLD_STORED_DETOAST_GATE_BYTES` on disk, or whose measured bytes exceed `FREEHOLD_MAX_STORED_BYTES` in the reader, or `FREEHOLD_MAX_OWNED_BYTES` in the sim | `freeholdForAccount` answers `{ kind: 'oversize', bytes, limit }` and `normalizeFreehold` refuses the same way. The two refuse at DIFFERENT depths, stated plainly rather than claimed alike: the reader refuses before the content columns cross the wire, so nothing is parsed at all, while the sim's ceiling is measured on the canonical JSON of an already-built candidate, which means the row counts are checked before any allocation but the byte check itself follows the build. The row counts are what bound that build, and they are checked first. The store installs a hold and the operator sees only a bounded, redacted diagnostic | Parse or allocate the oversized content in order to decide; write a truncated replacement; clear the row; or require the bounded diagnostic to carry the oversized original |

Two rules cut across all four. Every diagnostic derived from ROW CONTENT goes
through `freeholdLoadDiagnostic`, which carries a kind and a bounded detail and no
player data. The save path's own refusals and the store's operational lines are
built where they are raised, from this codebase's own literals rather than from a
row, and a database error reaches a log through a wrapper that keeps only its
code, its constraint and its message. And a hold is a REFUSAL TO WRITE,
never a refusal to serve: the account keeps playing, and only its housing writes
quiesce.

A hold has NO PLAYER-FACING SURFACE in this release, and that is a deliberate gap
rather than an oversight. An owner whose row is held sees the free tier-0 Inn Room
with none of their furnishings and no explanation, and nothing they do will save.
The alternative, a message about a durable read, is not something this release has
the vocabulary for: the housing UI is dark, so there is nowhere to put it. The
surface is owed by the release that lights housing up, and it is named here so that
release inherits the obligation rather than discovering it. Until then, the only
observer is an operator watching `woc_freehold_persist{measure="held"}`.

### The development tier grant is now DURABLE

Stated plainly because it changes what a dev command costs. `devGrantFreeholdTier`
reaches the live record through `setFreeholdTier`, which bumps the record revision,
and the periodic sweep writes any record whose revision has moved. So on a realm with
housing enabled, a `/dev` tier grant is no longer a session-local convenience: it is
written to `account_freeholds` and survives every later login, on whatever account the
grant was aimed at.

That is the correct behavior for a grant that reaches the one sanctioned tier writer,
and it is exactly why `ALLOW_DEV_COMMANDS=1` must never be set in production: before
this release the blast radius of a stray grant was one session, and now it is an
account's durable record. Nothing here relaxes that rule, and nothing about housing
adds a new way to reach the grant; the dev command gate is unchanged.

## 5. Source binding

Initial rows are explicitly UNBOUND. `upkeep_binding` carries
`FREEHOLD_UPKEEP_BINDING_UNBOUND`, the literal `unbound_no_history`. Such a row carries
no upkeep-derived day stamp, no week stamp and no credit. There is nothing to
reinterpret, which is the point: a serving realm cannot infer a calendar from a row
that never claimed one. The rule is enforced in the DDL rather than left to a writer:
the `account_freeholds_unbound_carries_no_upkeep` CHECK refuses any row that claims
the unbound binding while also carrying an upkeep checkpoint or a credit, so the
combination that would assert a billing history that never ran cannot be stored.

`updated_at` on the plot row and `ready_at_ms` on the Hearth row are ORDERING AND
AUTHORITY timestamps. They are not calendar facts and no consumer may read them as one.

When day-keyed facts arrive, they arrive with the [condition and ledger core
file](phase-13-condition-and-ledger-core.md) and the [upkeep calendar
file](phase-13a-authoritative-upkeep-calendar.md), and they use the realm-day
`resetDay` vocabulary: the string `resetDayKey`
([../../server/raid_reset.ts](../../server/raid_reset.ts)) produces over the zone the
ACCEPTED BINDING'S reset policy resolves to, with the week anchor from
`emberWeekAnchorOf`
([../../src/sim/professions/masterwrought_materials.ts](../../src/sim/professions/masterwrought_materials.ts)).
Never the serving process's own `REALM_RESET_TIME_ZONE`
([../../server/realm.ts](../../server/realm.ts)): the serving process is one of several
and its bare zone is a local accident, not an account's calendar. Any epoch-millisecond
companion beside such a fact is DISPLAY ONLY.

Recorded honestly, because it changes what this release can promise: no reset-policy
identity, resolver or table exists in code today. A reset policy identifier, a policy
resolver and a housing week helper return no hits anywhere under `src/`, `server/`,
`tests/`, `headless/` or `scripts/`. This release therefore BINDS NOTHING and has no
resolver to call, which is exactly why its rows are unbound with no history. The
migration from unbound to bound is owned by the two files named above, against the
accepted binding artifact the gate row names, and it is not attempted here.

One related trap. The live record's `conditionStampDay` and `ledgerPaidThroughDay` are
numbers documented as a UTC day, seeded zero by the default record. They are the WRONG
TYPE for the realm-day vocabulary and are not persisted as calendar facts. The durable
row carries the explicit unbound binding instead.

## 6. Account lifecycle

Housing is ACCOUNT state. Every row below follows from that one sentence.

| Path | Behavior | Anchor |
|---|---|---|
| Account export | Both tables ride the bundle, through their own explicit loaders, under the keys `freeholds` and `freeholdHearth` | `exportAccountData` in [../../server/db.ts](../../server/db.ts); `freeholdsForExport`; `freeholdHearthForExport` |
| Soft deactivation | Rows are PRESERVED. The access restriction applies; no cascade fires, and no absence or grace is manufactured | `setAccountDeactivated` in [../../server/account.ts](../../server/account.ts) |
| Authorized restoration | Rows are PRESERVED and the retained state is reloaded. No fresh Charter, no first-arrival mark and no fresh grace is granted merely because an account came back | the same `setAccountDeactivated`, cleared |
| Character deletion | Rows are PRESERVED. Deleting a character never touches either housing table, because neither is keyed on a character | `deleteOwnedCharacterRow` in [../../server/character_delete_db.ts](../../server/character_delete_db.ts) |
| True account deletion | BOTH rows cascade, through the `accounts` foreign key each table declares | `FREEHOLD_SCHEMA` and `FREEHOLD_HEARTH_SCHEMA` |
| Retention | Keep-forever. Neither table is swept; the account cascade is the only removal path | [../../server/retention_sweep.ts](../../server/retention_sweep.ts), with the absence pinned in [../../tests/server/main_retention_wiring.test.ts](../../tests/server/main_retention_wiring.test.ts) |

One item is OWED, not delivered, and this contract carries it as a named gate rather
than claiming it. An open housing operation must refuse a character or account
deletion, with a mapped refusal class and a stable error code. That class and code are
owned by the [transactional mutation boundary
file](phase-07a-transactional-mutation-boundary.md), because no housing operation row
exists yet for anything to be open against. Nothing in the current release refuses a
deletion on housing grounds, and no reader may act as though it does. The precedent
shape it will follow is `CharacterStoragePurchaseOpen` in
[../../server/character_delete_db.ts](../../server/character_delete_db.ts). Housing
activation must not precede that refusal landing.

## 7. Bounds

Every persisted collection carries a row ceiling, a byte ceiling and a query ceiling, and
each one is derived from an approved number rather than chosen. The derivation rule is the
one [content-numbers-workbook.md](content-numbers-workbook.md) section H states: build the
maximal legal fixture against approved costs and capacities, encode canonical JSON as
UTF-8 and measure it, then publish a limit that ADMITS that maximum and REJECTS one over,
before mutation or large allocation.

The settled symbols, their values, and where each value comes from.

| Ceiling | Symbol | Value | Derivation |
|---|---|---|---|
| Layout rows per plot | `FREEHOLD_MAX_LAYOUT_ROWS` | 420 | The largest approved `decorBudget` on the tier ladder, Citadel at 420, divided by the smallest approved positive `decorCost`, 1 |
| Trophy rows per plot | `FREEHOLD_MAX_TROPHY_ROWS` | 32 | The largest approved plinth count, Citadel |
| Identifier length | `FREEHOLD_MAX_ID_LENGTH` | 64 | The longest approved content identifier a layout or trophy row may carry, checked before decode |
| Public plot id length | `FREEHOLD_PLOT_ID_MAX_LEN` | 64 | The shared opaque public identity limit already pinned in [../../server/freehold_wire.ts](../../server/freehold_wire.ts), matched by `FREEHOLD_PLOT_ID_RE` |
| Account read rows | `FREEHOLD_ACCOUNT_PLOT_READ_LIMIT` | 2 | The approved two-plot account cap, read WIDER than the writer admits so a forward row is preserved rather than filtered away |
| Owned bytes per plot, canonical JSON | `FREEHOLD_MAX_OWNED_BYTES` | 101376 | Measured, see below |
| Owned bytes per plot, as stored | `FREEHOLD_MAX_STORED_BYTES` | 106496 | Measured against PostgreSQL 16, see below |

Both byte ceilings are MEASURED values, and they are TWO DIFFERENT MEASUREMENTS of one
record rather than one number used twice. The maximal legal fixture, and the two-over
refusal fixture beside it, are published in
[../../tests/helpers/maximal_freehold.ts](../../tests/helpers/maximal_freehold.ts) and
driven from [../../tests/freehold_state.test.ts](../../tests/freehold_state.test.ts).

`FREEHOLD_MAX_OWNED_BYTES` bounds the CANONICAL JSON the sim serializes: the maximal
legal record measures 101139 UTF-8 bytes through the exact serializer the save path uses,
rounded up to 101376.

`FREEHOLD_MAX_STORED_BYTES` bounds what PostgreSQL renders back out of jsonb, which is
what the SQL `octet_length` measure actually sees. jsonb is not a byte copy of the text
that went in: it re-renders every object with a space after each colon and each comma,
and it stores every JSON number as `numeric`, which always prints positionally. The same
record's two content columns measure 100866 bytes as canonical JSON and 106032 bytes as
stored text, so the stored ceiling is 106496. The gap is fixed rather than unbounded only
because the codec refuses a number whose JSON text carries an exponent; without that rule
an all-exponential record would pass the canonical ceiling and store at nearly six times
its size.

Enforcement is THREE-STAGE, and each stage bounds what it can actually see. SQL applies a
cheap ON-DISK pre-gate first (`FREEHOLD_STORED_DETOAST_GATE_BYTES`, read from the TOAST
pointer header without detoasting), then `FREEHOLD_MAX_STORED_BYTES` through an
`octet_length` bound that nulls the content columns before any deep parse can reach them. The sim applies `FREEHOLD_MAX_OWNED_BYTES` through
`persistedFreeholdBytes`, on load and, through `freeholdWriteRefusal`, before every save:
a document past any load ceiling is never written, so a row this realm produces is always
a row this realm can read back. The executed proof of the pair is the maximal-record round
trip in
[../../tests/server/freehold_db.pg.test.ts](../../tests/server/freehold_db.pg.test.ts),
which writes the maximal record, reads it back as a row at the stored bound, and asserts
that the canonical bound refuses the very same row.

Query and plan evidence: produced by two real-Postgres suites, both executed armed
against PostgreSQL 16 on 2026-09-08.
[../../tests/server/freehold_db.pg.test.ts](../../tests/server/freehold_db.pg.test.ts)
supplies the account read plan, the compare-and-swap race and the cascade behavior, and
[../../tests/server/freehold_hearth_db.pg.test.ts](../../tests/server/freehold_hearth_db.pg.test.ts)
supplies the account participant lock wait and the same-account race. Both suites skip
clean without `TEST_DATABASE_URL`, so an unarmed run must never be read as evidence: the
armed run is the one that counts, and it is the one recorded here.

The workbook row for these bounds is in
[content-numbers-workbook.md](content-numbers-workbook.md) section H, landed in the same
change that measured them. The ceiling is therefore PUBLISHED. Publication is not
permission: every gate in section 1 still stands, and housing remains disabled.

## 8. Rollout and rollback quiescence

### Enable order

Every step assumes the release gates in [state.md](state.md) "Tracked release and
handoff gates" are signed, this contract included.

1. Deploy the capable build to EVERY process sharing the database, with
   `FREEHOLDS_ENABLED` unset. Boot applies both fragments unconditionally, so the
   tables exist before the feature does and enabling never needs a migration window.
2. Confirm the whole fleet is capable against section 2. One incapable process is
   enough to make the fleet incapable; section 3 says what it would do.
3. Set `FREEHOLDS_ENABLED=1` and RESTART each realm process. The route and the wire
   read the flag live, but the realm Sim snapshots it at boot, so a restart is what
   actually enables housing. Stop the old process before starting the new one per
   realm; do not overlap them.
4. Verify on a dark-realm control that a process without the flag still answers the
   disabled refusal, refuses every housing frame at dispatch and boots a dark Sim.

### The shutdown drain, and why it sits where it sits

`freeholdPersistIdle(FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS)` belongs in the
[../../server/main.ts](../../server/main.ts) shutdown closure AFTER the character saves
and BEFORE `releaseAllCharacterLeases`, the slot the bank ledger and market
sold-volume drains already occupy, and for the same reason.

Once the leases drop, a replacement process may immediately load the same account. A
plot write still queued here would then flush after that process has already read the
durable row. Either it loses the compare-and-set and the owner's last edits are gone
without a trace, or, if it did not have to compete, it lands over state a live process
is already serving. Draining first closes that window on a clean restart.

The drain is BOUNDED, deliberately. A database that accepts the connection and never
answers must not hold the process past the supervisor's kill grace, because that would
lose the character saves already flushed above to SIGKILL and skip the lease sweep
entirely. A generation the deadline abandons leaves the same hole a crash leaves, and
the durable compare-and-set refuses a stale write rather than corrupting a good one.
The drain never throws; a missed deadline logs one line and the shutdown continues.

### Rolling back

TURN THE FEATURE FLAG OFF BEFORE ROLLING BACK. Unset `FREEHOLDS_ENABLED` and restart
on the CAPABLE build first, so the realm stops accepting housing mutations while it can
still persist the ones already in flight and can still drain its queue. A rollback that
reverts the binary first strands in-flight housing edits on a process that is about to
lose its only writer.

What a rollback to an incapable release leaves behind:

- Both tables INTACT. No old code path addresses them, so nothing is dropped or
  rewritten. Section 3 is the full account of why that is not reassurance.
- UNMAINTAINED. Condition, layout, trophies, visit policy and the durable revision stop
  advancing while players keep playing. Rows read plausible and are simply old.
- UNEXPORTED. A subject-access export served during that window omits both bundle keys
  and is incomplete for every account that owns a plot.
- The account Hearth authority UNOBSERVED and unadvanced, so nothing enforces the
  shared account cooldown the row exists to hold.
- Any housing value inside `characters.state` DELETED on that character's next save, by
  the whole-blob replacement in
  [../../server/character_save_statement.ts](../../server/character_save_statement.ts).
  The normalized tables are the durable home precisely so this exposure stays confined
  to the committed UI mirrors.

The window is ONE-WAY. An incapable binary records no housing progress anywhere, so
rolling forward resumes from the durable revision the capable build last committed and
recovers nothing a player did in between. That is the whole reason the flag comes off
first: a flag-off window is quiet, and a binary-first window is lossy.

A rollback manifest naming every surviving writer and reader and the owner of each
pending recovery is required by
[../prd/woc/freehold-service-contract.md](../prd/woc/freehold-service-contract.md)
"Account lifecycle, export and capable rollout". It is produced at activation, by the
named operations owner, and it is not a step in this file.

### Data rollback

There is no housing backfill and no migration marker, so there is nothing to undo.
Rollback is a binary and flag operation, and the only data step is a verification.

Precondition: EVERY realm process on this database is STOPPED. These are reads; run
them while the fleet is down so the answers cannot move underneath the operator.

```sql
-- 1. Housing rows present, and the newest durable plot write on this database.
--    Compare newest_plot_write to the moment the incapable binary took over: every
--    housing action after that moment is unrecorded and is NOT recovered by rolling
--    forward.
SELECT count(*) AS plots, max(updated_at) AS newest_plot_write
  FROM account_freeholds;

-- 2. The account Hearth authority rows, which an incapable binary neither reads nor
--    advances. A nonzero count on a fleet about to run an incapable build is the
--    signal to keep the feature flag off rather than to proceed.
SELECT count(*) AS hearth_rows, max(updated_at) AS newest_hearth_write
  FROM account_freehold_hearth;
```

There is deliberately NO `DELETE` step here, and none may be added. Removing these rows
is not a rollback, it is destruction of player property: both tables are keep-forever
and their only sanctioned removal path is the account cascade. If an operator concludes
rows must go, that is a restore-from-backup decision with a named owner, not a runbook
step. The table and column names above are owned by `FREEHOLD_SCHEMA` and
`FREEHOLD_HEARTH_SCHEMA`; a rename there updates this block in the same change.

## 8a. Named gates this contract carries, CLOSED and UNCLOSED

Every item here is a MEASURED finding from the review rounds this artifact went
through. Each names what was measured and who measured it, and the full detail is
in [the findings ledger](qa/persistence-2026-09-08/findings.md). An item marked
CLOSED is closed in code with a test; the rest are gates on housing activation
rather than notes. Nothing here is a signature and nothing here grants activation.

CAPACITY REFUSALS WERE TERMINAL. CLOSED at the rulings round, and the fresh read
of that round found the close had opened something else, which is closed with it
and recorded below under the identity gate. A load refused
because the local admission cap was full, because no background permit arrived
inside the login bound, or because the read threw, no longer sets `entry.loaded`,
so `preload`'s replay arms and `retain`'s lost-entry repair both re-read it
instead of replaying the refusal. Measured before the fix, with the shared gate
saturated: 8 of 8 logins at 1 join/s refused, and a lone re-join for a refused
account still replayed the hold. The four DATA kinds (`unadmitted`,
`unsupported`, `malformed`, `oversize`) stay TERMINAL, because the same row
answers the same way every time and a repeat read spends a permit and a statement
on a login path for nothing. The entry stays WRITE-BLOCKED while it is
unrepaired: `blocked()` is `!loaded || isHeld`, so both halves refuse until a
later read actually succeeds. One consequence for an operator, recorded in
DEPLOY.md as well: `loaded` and `held` no longer sum to `entries` for a capacity
hold.

A NEW LOGIN READ AHEAD OF THE PRELOAD, from the release/v0.44.0 sync. The
release's account ledger adds two direct pool queries per fresh login
(`loadAccountLedger` in `server/account_ledger_db.ts`, called from
`server/ws_auth.ts` before the housing preload). They bypass the background gate,
carry no row limit and run on the pool's default statement timeout. They do not
spend the housing budget and nothing new sits between the preload and
`bindFreeholdOnJoin`, so the window the identity gate rests on is unchanged. What
does change: under the saturated pool this section measured, those two reads queue
for the same clients, so a `no_budget` hold at login is more likely than the figures
below were measured with. Not re-measured at the sync; no code change follows.

THE TWO ADMISSION CAPS SUM PAST THE SHARED GATE. ACCEPTED, with the arithmetic,
rather than shared. The load cap of four and the write cap of four are
independent counters against a gate whose capacity is seven on the shipped pool
(`backgroundDbCapacity(DB_POOL_MAX_CLIENTS_DEFAULT)`), so housing's own demand is
8 in steady state and 12 during a drain (the drain raises the write cap to
eight), against 7. The store was measured holding all seven while other named
producers queued.

The alternative was one shared budget, and it was REJECTED: it couples a player's
login read to a sweep's writes, which is the coupling the two constants were
split to avoid, and it would make a saturated write cap refuse logins. So this
contract states the overcommit instead: HOUSING MAY HOLD UP TO SEVEN OF SEVEN
PERMITS IN STEADY STATE AND ALL OF THEM DURING A DRAIN, and the other named
producers wait behind it. What actually bounds concurrency is the GATE, not the
caps: the caps decide how much work housing offers, the gate decides how much
runs, and the surplus waits in a bounded set the store owns rather than on an
uncapped queue. ALERT ON `permit_wait_ms` for the producers behind it; that is
the leading indicator, and DEPLOY.md names it. The peak-concurrency pin the
database reviewer asked for is written against THIS answer, driven through the
real `createBackgroundDbGate`: housing never holds more permits than the gate
grants, and its own two caps do sum past that capacity.

RETENTION: THE `entries` MAP HAS NO SIZE BOUND, and its DERIVED CEILING is
recorded here rather than closed with a cache. There is no eviction policy,
because an eviction policy here is a decision about whose unwritten edits may be
dropped, and nothing has asked for one.

The stated limit is a TIME bound, join rate times grace period, and that
describes the healthy path only: `owesWork` is what suspends collection, so a
dirty entry whose write never gets a permit is kept by both removal paths.
Measured at 96 MiB per five thousand owners at the shipped tier ceiling and
660 MiB at the approved one, with the leave capture on top. The same shape
produces an entry that re-arms every sweep with nothing to write (twelve sweeps,
twelve permits, `writes_without_record` climbing); no production sequence
reaching that state has been named.

No refusal is needed to suspend it, either. One ordinary `saveAllDirty` pass at
five thousand loaded, unblocked owners leaves `dirty=5000 deferred=4996
active=4`, and every deferred entry satisfies `owesWork` through its deferred
clause. At the measured throughput, about 345 writes per second at the steady
cap, that backlog clears in roughly 14.5 seconds, inside the thirty-second
interval, so health recovers on its own.

THE CEILING, which is the number to derive again before a realm is sized past it:
about TEN THOUSAND THREE HUNDRED concurrently dirty owners per sweep. It is the
write cap divided by the statement latency, times the autosave period. Below it
the map is self-limiting; above it the deferred set never empties, `entries`
stops being collectable at all, and `oldest_dirty_age_ms` grows without bound. If
a hard cap is wanted anyway, the seam the file already names is the keyed bounded
cache with LRU eviction in `server/discord_status_cache.ts`, and the decision it
forces is which owner's unwritten edits an eviction is allowed to drop.

THE LEAVE RESERVE WAS TWO SLOTS IN TOTAL. CLOSED at the persistence QA. The
reserve is still two, but the mechanism that made it worthless is fixed:
`pumpLoop` admitted a deferred entry at the NON-leaving cap in insertion order,
so a leaver that missed the arm-time window queued behind every background write
already deferred, which is what produced the measured 98 of 100 flushes hitting
the full deadline. The pump now prefers a deferred entry holding a leave capture
and admits it at the leaving cap. A SECOND way to defeat it was found at the
rulings round and closed with it: `retain` cleared a returning owner's capture
inline instead of through `releaseCapture`, leaving the entry in the leaver
subset with no capture, at the head of the set the pump reads, priced at the
non-leaving cap. Every leave still adds its bound to `GameServer.leave`, and that
bound is now inherited by the character takeover path and every moderation kick
as well, because both await it.

THE LOGIN READ HAD NO BOUND ON THE WHOLE OF IT. CLOSED at the rulings round, and
BOTH of the numbers this paragraph used to carry were wrong.

The premise first. An earlier version said the handshake has a deadline of its
own and that the preload spends from it. It does not: `AUTH_TIMEOUT_MS`
(`server/ws_auth.ts`, 10,000 ms) is cleared SYNCHRONOUSLY by the first-frame
handler before `authenticateWebSocket` runs, and that file's own docblock says so
in as many words: it bounds upgrade-to-first-frame only, never the handshake's
database work. The database reviewer's original finding said the same and this
document overwrote it.

Then the arithmetic. `runWithStatementTimeout` issues five statements on one
checked-out client: BEGIN, SET LOCAL, the two reads, COMMIT. `SET LOCAL
statement_timeout` bounds each statement separately at READ COMMITTED (measured:
two 300 ms sleeps under a 400 ms bound both completed, 612 ms elapsed), and BEGIN
and SET LOCAL both run BEFORE the lowered bound is in force, so both answer to
the pool session default. AND COMMIT ANSWERS TO NEITHER SERVER-SIDE BOUND, which
every published figure got wrong in the same direction. Measured on PostgreSQL 16
with a DEFERRABLE INITIALLY DEFERRED constraint trigger putting two seconds of
work inside the commit itself: under `SET LOCAL statement_timeout = 300` the
COMMIT ran 2,008 ms and COMMITTED, against a control at the session default that
took the same 2,008 ms. MEASURED BOTH WAYS, because a reviewer pointed out that
the claim was otherwise wider than its evidence: both probes had LOWERED the
bound, so neither tested a session-level `statement_timeout` binding the commit
work. A third probe set the SESSION value to 300 ms with no SET LOCAL at all, and
that COMMIT ran 2,007 ms and committed too. Its only ceiling is the driver's own `query_timeout`
(`DB_QUERY_TIMEOUT_MS`), measured to reject a COMMIT at its deadline with a
client-side read timeout carrying no SQLSTATE. So the floor is
5,000 (`DB_POOL_CONNECT_TIMEOUT_MS`) + 2 x 15,000 (`DB_STATEMENT_TIMEOUT_MS`, for
BEGIN and SET LOCAL) + 2 x 2,000 (the two reads) + 65,000 (`DB_QUERY_TIMEOUT_MS`,
for COMMIT) = 104,000 ms. The 41,000 this section published priced COMMIT at the
lowered bound; the prose beside it argued 54,000; the 19,000 and the 9,000 before
those omitted five statements between them.

THE FIX IS A CAP ON THE WHOLE PRELOAD, `FREEHOLD_PERSIST_LOGIN_BUDGET_MS`, and
not a lower statement bound, which was considered and rejected because it does
not bound BEGIN, SET LOCAL or COMMIT and so narrows the number without closing
the gate. It is a STATED CEILING rather than a derived share of a deadline that
does not exist: 10,000 ms is the wait the product already treats as the most a
connecting player should spend, and a housing read has no claim on more. What it
prevents is the chain outliving the socket: past the cap the load is refused, so
the handshake stops waiting rather than running on to take a character lease and
join behind a socket that has died, which leaves a linkdead ghost holding a realm
slot and that lease for the whole grace window while the player's every re-login
is refused as already in world.

THE LOGIN ITSELF IS NOT REFUSED, and that is deliberate: refusing a login over a
durable housing read reverses a decision this packet has already taken and
pinned. The player joins on the sim's default record and no write goes out for
that account, which is the same failure mode a thrown read already had. The
refusal books its own metric kind, `no_budget`, and deliberately does NOT touch
the store entry: the read it gave up waiting for is still in flight behind a
single-flight slot, and letting it finish and fill the entry is strictly better
than marking the entry held over a read that then succeeds.

A CLOCK FAULT MUST NOT BECOME A PLOT HOLD, and it took three attempts. A thrown
hearth read is carried across the port as a VALUE rather than a rejection. The
guard is around the WHOLE transaction, because an inner catch on the hearth
promise cannot see the COMMIT the timeout helper issues afterwards, and a clock
fault that KILLS the connection (backend crash, restart, dropped socket) makes
that COMMIT reject. AND BOTH HALVES ARE CAPTURED AS THEY ARE READ, which the
second attempt got wrong: capturing only the row threw away a clock both
statements had already answered whenever the COMMIT rejected, and substituted the
cold clock, which reads as READY. The store then remembers that zero on the entry
and replays it to every later character of the account for the whole session
without reading again. An UNREADABLE clock starts cold; a clock that was READ does
not. The policy now lives in `server/freehold_hearth_load.ts` as
`readLoginDurables`, out of the composition root, because the root binds the real
pool at module scope: nothing imported it, nothing executed its closures, and the
one surviving mutant of that round lived there. Five behaviour cases drive it.

THE EXPORT READ WAS UNBOUNDED. CLOSED at the persistence QA: `freeholdsForExport`
carries `FREEHOLD_EXPORT_ROW_LIMIT` (20, WIDENED rather than copied from the
account read's 2, so a slot this build does not admit is still exported) and the
same on-disk pre-gate the account read uses, with an authoritative rendered
measure behind it. A row past the gate keeps its identity, both revisions and
every scalar column and reports its measured on-disk size in place of content.
Proved against real PostgreSQL on an account holding one ordinary row and one row
past the gate, and at the truncation boundary in both directions.

TWO RESIDUALS ON THAT READ, named at the rulings round rather than left implied.
FIRST, the rendered ceiling is only reachable for content that COMPRESSES: for
incompressible content the on-disk pre-gate binds first at 131,072 bytes and the
wider bound is never reached, so an incompressible row above the pre-gate comes
back with its size instead of its content on the owner's ONLY readback of it.
That is the trade the pre-gate exists to make, because measuring an incompressible
row means detoasting it, which is the cost being avoided. SECOND, the two upkeep
JSONB columns are selected RAW, past both bounds. That is safe only because of
the DDL: this build writes NULL and the unbound-carries-no-upkeep CHECK holds them
NULL for every row it can produce. The release that starts writing them owes them
the same pre-gate and measure the two content columns carry.

THE FOUR LOAD-FAILURE CAUSES WERE ONE LABEL. CLOSED at the persistence QA, and
there are NINE kinds now, not seven: the rulings round added `no_budget` for the
whole-preload cap and `unnamed_record` for the ordering refusal below. Read them
as three groups. FOUR are DATA incidents and their hold is terminal (`unadmitted`
for the row-level stranded slot, `unsupported`, `malformed`, `oversize`); FOUR are
CAPACITY causes and their hold is repairable (`cap_full`, `no_permit`,
`read_threw`, `no_budget`); ONE is neither (`unnamed_record`), terminal for a
reason of its own. The repairable set is DERIVED by subtraction from the kind
list, so a kind added later lands in exactly one group by construction; an earlier
version claimed that derivation while spelling three literals, and the very commit
that wrote it added a kind the set did not know about. A host with no store answers
the same hold SHAPE through `freeholdPreloadUnavailable` but books no counter at
all, so it never reaches the series. DEPLOY.md carries the corrected reading.

THE WRITE PATH'S CODEC COST IS PAID TWICE, and is now MEASURED. A `codec_ms`
counter sits beside `write_ms` and brackets everything between the permit and the
statement. Re-measured per save at the 420-row ceiling: the clone 0.0084 ms, the
projection 0.0049 ms, the refusal walk plus canonical JSON plus the encode
0.1464 ms, the two column serializations plus the byte length 0.0382 ms, 0.1979 ms
for the block. The earlier 0.225 ms figure stands on magnitude. WHAT REMAINS is
the double serialization itself, and the shape the counter now exposes: this is
UNYIELDING synchronous time between the permit and the statement, about 0.99 s at
five thousand drained owners, which escapes the tick profiler's save lap as well.

THE STORE HOLDS A SECOND COPY OF EVERY ONLINE OWNER'S HOUSE. `entry.state` is a
full record distinct from the sim's live one, and a dirty leaver briefly holds a
third. Measured at 10,051 bytes per copy at the shipped ceiling and 69,452 at the
approved one. Only the leave capture is documented in the source today, and the
second copy is the larger standing cost.

THE MISSING IDENTITY STAMP. CLOSED at the rulings round, in the SAFE form, as one
change, and it closes both halves of it.

It was a WRITE-THROUGH first, and the eighth distinct path to an empty tier-0 Inn
Room landing on a real row. For an account whose entry MINTED its own row,
`applyWriteResult` cached the identity the LIVE RECORD carried, which was the
stand-in, and a freshly seeded default carried the same literal, so the seal's
name comparison was inert BY VALUE EQUALITY for that entry class. The two
continuity arms then had to carry it alone and both are revision-shaped, so a
reseeded default whose revision had caught up satisfied neither. Reproduced three
times against the real store: a row holding tier cottage, one furnishing, one
trophy, condition 91 and policy friends at wire revision 7 was
compare-and-swapped to an empty Inn Room at wire revision 8 and again at 9, with
`quiesced` 0, `write_failures` 0, no error line and `plot_id` untouched.

It was a REFUSAL second, and the mirror of the same gap: a fresh account whose
store entry was dropped and re-read from the row it had just inserted held the
row's name against a live record still holding the stand-in, so the seal saw two
names and write-blocked the account for the rest of its session with a misleading
line.

THE FIX, in the form that was taken: `installLoadedFreehold` installs a default
record carrying the load's own minted `plotId` on the ABSENT arm only, through the
existing `loadFreehold`, which is load-once and already honors the dark-realm
flag, so `addPlayer`'s `ensureFreeholdRecord` then returns it untouched. The
UNSAFE form stamps the minted identity onto whatever record is already live,
bypassing load-once; that rewrites a freshly seeded default's identity to the
minted name, kills the name comparison and, through `standInSeed`, both
continuity arms with it, and is a new path to the same loss. It was refuted with
evidence rather than argued away.

A THIRD REFUSAL LANDED WITH IT, and it exists because the two changes above
RE-OPENED this gate from the other side. `installLoadedFreehold` is the only thing
that teaches a live record its minted name, and it returns early on ANY hold.
Ruling 2 made an admission hold re-readable and the budget cap left its entry
untouched for its in-flight read to fill, so for the first time an entry could be
held at login and WRITABLE afterwards with no install ever having run: the record
kept the stand-in, the store minted a name for the row, the entry cached the
record's stand-in at the first commit, and the seal's name comparison was inert by
value equality for the life of that entry, which is the eighth path arrived at
from the other side. Found by the fresh read of the fix round, not by its own
green tests. So `classify`'s absent arm now REFUSES to name a row for a record it
did not install: a live record carrying the stand-in gets an `unnamed_record`
hold, terminal for that entry, and no row is created at all. Nothing is lost by
it, because there was no row, and the next login builds a fresh entry whose
install runs before the seed.

TWO OTHER THINGS LANDED WITH IT. `revisionRegressed` is un-gated from `standInSeed`,
because after the fix no ONLINE record carries the stand-in and the discriminator
would otherwise be dead for the same-account character swap; it has its own
executed proof, including the arm that matters most, that a rejoin replay AT the
committed revision is not refused. And the MINT was found to be per ENTRY rather
than per owner: an entry the orphan sweep collects between a preload and its
retain is recreated empty, and minting again there gave the ROW a second identity
while the record kept the first. The absent arm now adopts the live record's
identity when there is one.

FOUR EXISTING PINS FLIPPED, not the two that were anticipated. Two of them
encoded a rule that a record carrying a REAL plot name goes backwards onto the
row deliberately. That rule is RETIRED rather than dropped: a live revision
below the entry's last committed one means the live record is not the record
that commit came from, since every install a rejoin is offered carries at least
the committed revision (with one known hole, the twelfth path: an answer read
before another session edited and was evicted carries an older house, which the
store's next write carries silently while that session's capture is still
unwritten, and which, once that capture has committed, is refused only by a
write that samples it strictly below the committed revision; see the findings
ledger's harness-fidelity section) and every sanctioned mutator only increments,
and writing it would walk the client-facing wire counter backwards permanently,
which is the exact harm the loader's own `wire_rev_shape` hold refuses on the
read side. What it newly refuses is a superseded leave capture offered to a
rejoin as the install source: refusing loses nothing, the row survives, and it
books a write failure and quiesces an entry that is about to be collected
anyway.

OFFLINE AND HEADLESS PLOT IDENTITY: THE DIVERGENCE IS ACCEPTED AND DOCUMENTED.
Online records now answer to a unique minted identity from their first session.
Offline and headless hosts have no store and no minter, so every record on them
carries the one literal stand-in, `plot:unassigned`, forever. The fix therefore
WIDENS an existing divergence from session two onward to session one onward. It
is harmless while `plotId` is presentation-only, which is what
`src/sim/freehold/types.ts` says it is, and it is not harmless to a consumer that
KEYS on it: correct online, colliding offline. THE PHASE THAT MAKES `plotId`
LOAD-BEARING AS A KEY MUST SUPPLY A MINTER FOR THOSE HOSTS FIRST, and anything
minting ids inside `src/sim/` must draw from `Rng`, never a clock and never
`Math.random`. Recorded in `src/sim/freehold/CLAUDE.md` beside the record
lifecycle so the next author of that directory reads it there.

ONE ACCOUNT ONLINE ON TWO REALMS HAS ONE OF THEM WRITE-BLOCKED, SILENTLY.
`account_freeholds` is keyed `(account_id, plot_index)` with no realm column, and
the store is per realm PROCESS, while characters are realm-scoped and the session
cap is counted in one process's own client map. Both handshakes read `durable_rev`
7 and install the same house; the realm the player furnishes on wins the
compare-and-swap; the other realm's next write fences on 7, is diagnosed stale and
quiesces for the life of the entry, with only a warn line and the `quiesced`
gauge. The ROW survives in either ordering, which is the fence doing its job, but
one session's edits are discarded with no player-facing surface. Recorded here as
an activation gate rather than fixed: housing rows are account-scoped and shared
by every realm on one database. If it must be closed, 07a's mutation boundary is
where a cross-realm claim belongs.

THE ACCOUNT CASCADE HAS NO PRODUCTION CALLER. Both DDL fragments state that the
accounts `ON DELETE CASCADE` is the only removal path there is, and that is true
of the SCHEMA. It is not true of the product: the player-facing account removal is
a SOFT delete that sets `deactivated_at` and leaves the row in place, so it fires
no cascade, and the only hard `DELETE FROM accounts` in the tree removes a
password-less, token-less provisioning loser that can never own a plot. Housing
rows therefore persist for accounts a player believes are deleted. That is a
retention and disclosure decision, not a data-loss one, and it is owed an explicit
answer: follow `account_attribution`'s erase-on-soft-delete precedent, or state
that housing is keep-forever through a soft delete.

A FORWARD STEP OF THE DATABASE CLOCK PERMANENTLY BRICKS AN ACCOUNT'S HEARTH KEY.
The stated monotonicity invariant covers a REGRESSED clock only. In the normal
flow `GREATEST` is never the binding term, so an accepted advance under an NTP
step or a container clock jump writes a far-future `ready_at_ms`, and monotonicity
then makes it permanent: no statement can lower it, absence is the only ready
state, the table is exempt from the retention sweep, and the account cascade above
has no production caller. Owed at 07a, where the caller lands: treat a reading past
`now_ms` plus the cooldown as corrupt rather than authoritative, which fails closed
for the trip and gives an operator a signal instead of a silent lifetime lockout.
Related: `now()` is the TRANSACTION timestamp, so a long entry transaction records
a cooldown that starts at BEGIN and is short by the transaction's duration.

A REFUSED LOGIN HANDS BACK A COLD HEARTH CLOCK, which is READY, and the merge is
forward-only so nothing later lowers it. `freeholdBudgetRefusal` answers
`hearthReadyAtMs` 0 and every other refusal passes `COLD_HEARTH`, whose ready
time is also 0, so on a database slow enough to overrun the login budget the same
account is handed a ready Hearth on EVERY login. `server/freehold_install.ts`
argues the opposite in its own comment, that merging the clock unconditionally is
what stops a held account getting a free travel per login, and that protection is
defeated by the value every hold path actually supplies. The in-flight read does
learn the real clock, but only onto the store entry, after the session has been
answered. Harmless in this build because nothing writes the row and the key is
refused anyway; it becomes one free travel per slow login the moment 07a starts
writing. This is a sharper statement of the gate below rather than a second one.

THE HEARTH READ FAILS OPEN WHILE THE PLOT READ OF THE SAME LOAD FAILS CLOSED.
`readHearth` catches every error and answers a cold clock, and the merge is
forward-only, so an owner key the sim does not yet hold starts READY. The trigger
is concrete: the load's pool checkout times out, or a statement hits its bound,
under the same saturation the permit bound exists for. Harmless today because
nothing writes the row; it becomes one free travel per pool blip the moment 07a
starts writing rows. AN `unsupported` CLOCK IS PART OF THIS GATE, corrected at the
rulings round: the reader's docblock claimed that kind is what stops a damaged row
granting a trip, and it is not. It is normalized to the cold clock with a WARN,
which is ready. The kind buys the operator a named warning; refusing the trip
belongs to the 07a participant, which is the caller that has a trip to refuse.

THE HEARTH KEY IS GRANTED ONLINE AND PERMANENTLY REFUSED. On a lit realm the
Freehold Gate grants the key and every use is refused by the realm's hard-false
key admission, emitting the `busy` denial: "This home is active elsewhere or still
opening. Try again shortly.", indefinitely. Offline and headless the same item
works. Intentional per the 07a plan and named in the source, so it is
rollout-gating: either do not grant the key while admission is hard-false, or give
the refusal its own reason token and catalog line.

`server/freehold_persist.ts` IS ON THE MONOLITH RATCHET at its exact measured
count, which forbids the next line without granting any slack. Cite the ratchet
row in `tests/monolith_budget.test.ts`, not a number here, which is the anchor
rule this document is otherwise written to; the row's own comment carries the
whole walk, including every lowering and the one raise this packet recorded
against itself. WHETHER THE FILE SHOULD BE SPLIT, and along which seam, is a
maintainer decision this contract does not take, though four modules have now
come off it (`server/freehold_persist_wiring.ts`,
`server/freehold_write_seal.ts`, `server/freehold_install.ts` and
`server/freehold_persist_registry.ts`) and each was a seam the file already had.
The ratchet also has no admission rule of its own: nothing adds a file to it, so
the next monolith to form is untracked until someone notices.

A HELD ROW STILL HAS NO PLAYER-FACING SURFACE, which section 4 also records. Every
capacity item above makes a hold more reachable, so that gap and they are one
obligation. It is SCOPED at the rulings round and built separately, because the
identity fix touches the sim's load path and the surface touches the HUD, and
merging them makes one reviewable change into two unreviewable halves. THE DESIGN
IS RECORDED IN `docs/freeholds/held-plot-surface-scope.md`: the exact `t()` keys,
the render sink each one goes to, and which load-failure kinds the
player is told apart. It is a scope document, not an implementation: no key in it
exists in the catalog yet.

## 9. Cross-links

Outbound, the documents this contract depends on:

- [../../DEPLOY.md](../../DEPLOY.md), whose "Bank Storage rollback caveats" bullet
  already writes down the whole-blob replacement hazard section 3 reasons about, and
  whose operational notes own the environment reference.
- [state.md](state.md), for "Worktree, base, and merge-forward", the C01 account Hearth
  authority, the lifecycle extension boundary and the gate row this artifact answers.
- [progress.md](progress.md), for the implementation ledger this contract's producing
  work reports into.
- [../prd/woc/freehold-service-contract.md](../prd/woc/freehold-service-contract.md),
  whose "Account lifecycle, export and capable rollout" section states the requirement
  this file is the answer to, and whose "Identity and durable protocol" owns the
  hard-deletion rule section 6 defers to.
- [content-numbers-workbook.md](content-numbers-workbook.md) section H, which owns the
  bounds derivation section 7 cites and must receive the measured byte row.
- The [producing work's own specification](phase-07-persistence.md).

Inbound. Each is the responsibility of the producing work's documentation step, and
none may be reported as done until the file actually carries the line:

- DEPLOY.md carries the housing operational bullet, landing in this same contribution,
  that names the two tables, their keep-forever status and the flag-off-before-rollback
  rule of section 8, and points here for the capability and quiescence detail.
- state.md owes the gate-row citation of this file by name plus the implementation
  ledger entry for the modules section 2 lists.
- progress.md owes the persistence row citation of this file as delivered evidence.
- The service contract owes the reciprocal pointer from "Account lifecycle, export and
  capable rollout" to this file as its activation artifact.

Nothing in this file is a signature, and no cross-link creates one.
