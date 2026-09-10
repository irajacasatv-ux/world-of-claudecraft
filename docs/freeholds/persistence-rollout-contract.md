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

## 8a. Named gates this contract carries UNCLOSED

Every item here is a MEASURED finding from the review rounds this artifact went through,
left open on purpose rather than fixed at the end of a verification session, and each is a
gate on housing activation rather than a note. None is anonymous: each names what was
measured and who measured it, and the full detail is in
[the findings ledger](qa/persistence-2026-09-08/findings.md) under V12. Nothing here is a
signature and nothing here grants activation.

CAPACITY REFUSALS ARE TERMINAL, and they must not be. A load refused because the local
admission cap was full, or because no background permit arrived inside the login bound, is
recorded with `entry.loaded` set, so it replays for the life of the entry and `retain`'s
lost-entry repair arm cannot reach it. A capacity blip therefore becomes a session-long
housing outage for that account, and a hold has no player-facing surface in this release.
Measured with the shared gate saturated: 8 of 8 logins at 1 join/s refused, and a lone
re-join for a refused account still replayed the hold. The four fixture classes in
section 4 justify a terminal hold for a DATA cause; none of them sanctions one for a
capacity cause, and this contract does not.

THE TWO ADMISSION CAPS SUM PAST THE SHARED GATE. The load cap of four and the write cap of
four are independent counters against a gate whose capacity is seven, and the store was
measured holding all seven while other named producers queued. The write cap's own
rationale says the surplus waits in a bounded set this store owns; that is true of writes
and not of loads, which queue on the shared gate.

RETENTION UNDER A STALLED GATE IS UNBOUNDED. The `entries` map's stated limit is a TIME
bound, join rate times grace period. That describes the healthy path only: a write that
never gets a permit returns without quiescing, so the entry stays dirty, `owesWork` keeps
it, and neither removal path can collect it. Measured at 96 MiB per five thousand owners at
the shipped tier ceiling and 660 MiB at the approved one, with the leave capture on top.
The same shape produces an entry that re-arms every sweep forever with nothing to write
(twelve sweeps, twelve permits, `writes_without_record` climbing); no production sequence
reaching that state has been named.

THE LEAVE RESERVE IS TWO SLOTS IN TOTAL, not two per leaver. With 296 background writes
deferred, 98 of 100 simultaneous leave flushes hit the full `FREEHOLD_PERSIST_LEAVE_FLUSH_MS`
deadline with the write unlanded. Nothing is lost while the process lives, but every leave
adds its full bound to `GameServer.leave`, which is what releases the character lease.

THE LOGIN READ'S DOMINANT BOUND IS UNSTATED. `FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS` is
deliberately short, and neither login-path query uses the statement-timeout seam, so both
inherit the 15,000 ms pool bound on a handshake that has no deadline of its own. In health
these statements are sub-millisecond; a sick database is exactly when this binds.

THE EXPORT READ IS UNBOUNDED. `freeholdsForExport` selects both content columns for every
row with no LIMIT and no byte gate, while the account read's `LIMIT 2` is justified in this
same contract against exactly that hazard. It is the owner's only readback, so the bound
has to be widened rather than copied.

THE FOUR LOAD-FAILURE CAUSES ARE ONE LABEL. `refuse()` reports `unadmitted` for a full
admission cap, a missing permit, a thrown read and a host with no store, alongside the
genuinely row-level stranded-slot cause. That is precisely the discrimination the metric's
own help text promises an operator, and only the free-text detail separates them.

THE WRITE PATH'S CODEC COST IS UNMEASURED AND PAID TWICE. Each save serializes the document
once for the refusal's byte measure and again for the two content columns, measured at
0.225 ms per save at the 420-row ceiling, and `write_ms` brackets only the statement, so
none of it reaches a counter.

THE STORE HOLDS A SECOND COPY OF EVERY ONLINE OWNER'S HOUSE. `entry.state` is a full record
distinct from the sim's live one, and a dirty leaver briefly holds a third. Measured at
10,051 bytes per copy at the shipped ceiling and 69,452 at the approved one. Only the leave
capture is documented today, and the second copy is the larger standing cost.

A FRESH ACCOUNT WHOSE ENTRY RE-READS ITS OWN ROW IS WRITE-BLOCKED for the rest of that
session, and this one is a deliberate trade rather than an unexamined gap. Nothing teaches
a live record its minted public identity, so a first-session record carries the stand-in
for as long as it lives; if that account's store entry is dropped and re-read from the row
it just inserted (the lost-entry reload, or a second character joining), the entry now
holds the row's name while the record still holds the stand-in, the write seal sees two
different names and refuses. Exempting the stand-in from that comparison was tried and
REVERTED: it admits a seeded default over a real house as soon as the returning player's
edits carry its revision past the entry's, which costs the house rather than one session's
edits. The row survives either way, and the case is pinned as it behaves so a fix flips a
red test. THE FIX IS A DESIGN DECISION, not a fourth clause in that expression: teach the
live record its minted identity AT INSTALL, where the store already knows it. Stamping at
COMMIT time was tried in an earlier round and is wrong for a different reason, recorded as
W4 in the findings ledger.

A held row still has NO PLAYER-FACING SURFACE, which section 4 already records; every item
above makes a hold more reachable, so that gap and these are one obligation.

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
