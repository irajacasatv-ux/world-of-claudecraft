# Freeholds bounded persistence: database performance and scaling review

**Mode:** FINISHED_DIFF (`c18facd4cc..HEAD`, six commits, in
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`)
**Verdict:** BLOCK (one P1 and eight P2 findings, all actionable)

I edited nothing in that worktree. All database work ran against the disposable dev
container on 127.0.0.1:5433 (`eastbrook-db`, `postgres:16-alpine`, the `npm run db:up`
instance), always inside a private schema that is dropped at the end. No production or
shared database was touched, and no row values, credentials or query parameters appear
below.

---

## Workload assumptions

| Axis | Value used |
|---|---|
| Host | one 4-vCPU box; Postgres in a container on the SAME host as the game loop |
| Pool | `DB_POOL_MAX_CLIENTS` default 10, `connectionTimeoutMillis` 5,000, server `statement_timeout` 15,000, driver `query_timeout` 65,000 (`server/db.ts:290-297`) |
| Background gate | `createBackgroundDbGate(10)` -> capacity `max(1, 10-3)` = **7**, waiter list UNCAPPED (`server/background_db_gate.ts`) |
| Target concurrency | 1,000 online accounts, one durable plot row per account |
| Fresh-join reads | 2 sequential queries per fresh join (plot + hearth), under ONE gate permit (`freehold_persist.ts:397-401`) |
| Resume-join reads | 0 |
| Periodic cadence | one sweep per `AUTOSAVE_SECONDS` (30 s), inside the 20 Hz tick body (`game.ts:2640, 2683-2697`) |
| Per-tick / per-broadcast queries | **none**; `dispatchFreeholdCommand` and `server/freehold_wire.ts` issue no SQL |
| Row cardinality | `account_freeholds` 1 row/account, `account_freehold_hearth` 1 row/account, both keep-forever, both bounded by the accounts table |
| Row size | legal maximum 104,448 owned bytes (`FREEHOLD_MAX_OWNED_BYTES`); a plausible furnished plot measured 5,631 bytes at 60 layout rows |
| Realm topology | several realm processes may share one Postgres; each builds its own pool |

---

## Evidence

### Measured (disposable Postgres, 127.0.0.1:5433, private schema, dropped after)

Suites, as the brief asked:

- `tests/server/freehold_db.pg.test.ts` + `tests/server/freehold_hearth_db.pg.test.ts`
  with `TEST_DATABASE_URL` set: **Test Files 2 passed, Tests 27 passed, 645 ms.**
  Contrast run with the variable unset: **2 skipped, 27 skipped** -- so the 27 really
  executed against real Postgres rather than silently skipping.
- `tests/freehold_state.test.ts`, `tests/server/freehold_db.test.ts`,
  `tests/server/freehold_hearth_db.test.ts`, `tests/server/freehold_persist.test.ts`:
  **4 passed, 232 passed.**
- `npx tsc --noEmit`: exit 0.

Plans I captured myself, 200,000 accounts x 1 plot row, 5,631-byte layout, after ANALYZE
(`EXPLAIN (ANALYZE, BUFFERS)`, no planner GUCs forced -- the repo's own pin forces
`enable_seqscan = off`, which proves an index CAN serve the predicate; this proves the
planner DOES pick it at real cardinality):

```
account read  (freehold_db.ts:222)   Limit -> Index Scan using account_freeholds_pkey
                                      Index Cond: (account_id = $1)
                                      rows=1  Execution Time 0.160 ms   Buffers: shared read=4
hearth read   (freehold_hearth_db.ts:116)  Index Scan using account_freehold_hearth_pkey
                                      Execution Time 0.016 ms
CAS update    (freehold_db.ts:370)   Update -> Index Scan using account_freeholds_pkey
                                      Index Cond: (account_id, plot_index)  Filter: durable_rev
                                      Execution Time 0.222 ms
diagnosis     (freehold_db.ts:384)   Index Scan using account_freeholds_pkey  0.028 ms
export        (freehold_db.ts:528)   Index Scan using account_freeholds_pkey  0.013 ms
FK cascade    DELETE FROM ONLY account_freeholds WHERE $1 = account_id
                                      -> Index Scan using account_freeholds_pkey  0.038 ms
```

Warm end-to-end round trips: normal account read **0.73 ms/call**.

Detoast cost curve for the `octet_length(f.layout::text)` bound (median of 7):

```
layout rows | octet_length(text) | pg_column_size | account read
        420 |             52,390 |          2,045 |     1.5 ms
      4,200 |            528,090 |         18,639 |     7.2 ms
     42,000 |          5,322,890 |        184,933 |    58.5 ms
    200,000 |         25,488,890 |        879,795 |   242.4 ms
    400,000 |         51,088,890 |      1,759,240 |   524.3 ms
```
Roughly **10 microseconds of database CPU per KB of stored JSON text**, paid before the
bound is applied.

Store-level measurements, driving the real `createFreeholdPersistStore`, the real
`createBackgroundDbGate` and the real `createKeyedSerialWriter` with 1,000 owners:

```
steady-state saveAllDirty(), SYNCHRONOUS, 1000 loaded owners, nothing changed:
  layout rows=  0   median 0.44 ms   max  0.57 ms   writes 0
  layout rows= 20   median 1.14 ms   max  1.33 ms   writes 0
  layout rows= 60   median 3.44 ms   max 10.51 ms   writes 0
  layout rows=200   median 7.48 ms   max  8.81 ms   writes 0
  layout rows=420   median 15.69 ms  max 17.59 ms   writes 0     <- max legal layout

mass first write, 1000 owners, real gate:
  poolMax=10 gateCap=7 | sync burst 5.7 ms | peak gate waiters 993 | peak inFlight 7 | drained | wall  699 ms
  poolMax= 4 gateCap=1 | sync burst 4.4 ms | peak gate waiters 999 | peak inFlight 1 | drained | wall 4707 ms
  poolMax= 1 gateCap=1 | sync burst 8.2 ms | peak gate waiters 999 | peak inFlight 1 | drained | wall 4754 ms
  capacity-1 with markDirty+save layered on top: drained=true, keyed FIFO pendingKeys=0 (NO deadlock)

duplicate-write accounting, ONE owner, ONE real edit (rev 7 -> 8):
  a) one sweep only                    -> 1 write   ["rev=8"]
  b) sweep then idle()  (main.ts order) -> 2 writes  ["rev=8","rev=8"]
  c) two overlapping sweeps             -> 2 writes  ["rev=8","rev=8"]
  d) sweep then flushAndRelease (leave)  -> 2 writes  ["rev=8","rev=8"]

abandoned preload (handshake rejected after the read, no retain):
  5,000 preloads -> 5,000 store entries retained, none ever removed
```

Monolith counts, as the brief asked (reported, not raised):
`server/game.ts` **9,978** lines against a 9,983 ceiling (5 lines of slack);
`server/db.ts` **4,605** lines against a 4,744 ceiling (139 lines of slack);
`server/freehold_persist.ts` 1,017 lines, no budget row.

### Static inference

- `server/game.ts:5068-5074` `saveFreeholds()` is `async` but has no `await` before
  `saveAllDirty()`, so its whole body runs SYNCHRONOUSLY inside `runPeriodicSaveFlush`,
  which runs inside the guarded tick body at `game.ts:2640`.
- `server/game.ts:3293` `retain()` is called unconditionally, with no
  `freeholdsEnabled` check. On a dark realm this is the only store contact; the entry is
  `loaded === false`, so `blocked()` short-circuits `noteRevisionMoved` before any
  serialize, and `flushAndRelease` removes it on leave. Dark-realm cost is one Map entry
  per online account. Correct.
- `server/db.ts:1287-1394`: boot DDL runs on a dedicated `Client` built from the
  connection string alone (no `statement_timeout`, no `query_timeout`) plus an explicit
  `SET LOCAL statement_timeout = 0` before the advisory lock. Neither
  `FREEHOLD_PERSIST_PERMIT_WAIT_MS` nor `DB_STATEMENT_TIMEOUT_MS` reaches the two new
  fragments.
- `server/freehold_hearth_db.ts:199` `advanceFreeholdHearthOnClient` has **no production
  caller**; only `tests/server/freehold_hearth_db.test.ts` and the pg twin drive it.
- `server/freehold_persist.ts:734-748` `markDirty` and `save` have **no production
  caller** either. `saveAllDirty` -> `noteRevisionMoved` is the only dirty detector that
  runs in this build.
- Row-lock compatibility, checked against the Postgres conflict table:
  `FOR KEY SHARE` conflicts only with `FOR UPDATE`. The character save path takes
  `FOR NO KEY UPDATE` (`bank_ledger_save_effects_db.ts:134`) or `FOR KEY SHARE`
  (`:151`); neither conflicts with the hearth's `FOR KEY SHARE`. Nothing on the hot save
  path takes `FOR UPDATE` on `accounts`; the four callers that do
  (`character_create_db.ts:50`, `maps_db.ts:88`/`:134`, `staff_db.ts:80`,
  `user_assets_db.ts:76`) are rare, non-hot paths.

---

## Findings

### P1-1 One real edit produces two byte-identical durable writes whenever an arm lands while a write is in flight

**Confidence:** high (measured, four scenarios).
**Path:** `server/freehold_persist.ts:667` (`settle`), `:714-721` (`arm`), `:762`
(`flushAndRelease`), `:791-793` (`idle`); driven from `server/main.ts:4249` then `:4296`.

`arm()` sets `entry.pending = true` unconditionally when a write is running.
`settle()` then re-arms on `entry.pending` alone: `const rearm = entry.pending ||
(committed && isDirty(entry));`. But `runWrite` samples its generation and its document
*after* the permit wait (`:633-635`), so the running write already covers every edit that
existed when `arm()` was called. The pending flag is redundant by construction, and the
re-armed write serializes and sends the SAME document again.

**Failure scenario (shutdown, the routine one):** `server/main.ts:4249` calls
`game.saveFreeholds()`, which arms every dirty owner. Their writes are still waiting on
the 7-permit gate when `server/main.ts:4296` calls `freeholdPersistIdle`, whose `idle()`
loops the entries and arms every one that is still `isDirty` -- which is all of them,
because `committedGeneration` only advances at commit. Every owner gets a second,
identical `UPDATE account_freeholds` that rewrites `layout` and `trophies`, bumps
`durable_rev` a second time and touches `updated_at`. Measured: **2 writes for 1 edit**,
and **2,000 writes for 1,000 owners** on the mass-first-write run. This doubles the
durable work inside the 10-second `FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS` window, exactly
when the deadline is tightest.

The same doubling occurs when a 30 s sweep lands while the previous sweep's write is
still out (case c), and on the leave path (case d) -- where the code contradicts its own
comment: `flushAndRelease` says "A clean entry is left alone: rewriting an unchanged
document on every logout would burn a durable revision per leave", but its condition
`isDirty(entry) || entry.running || entry.pending` calls `arm()` for an entry that is
merely `running`, which does precisely that.

**Smallest correction:** record the generation the running write snapshotted
(`entry.snapshotGeneration = generation` next to `:634`) and re-arm on
`entry.dirtyGeneration > entry.snapshotGeneration` rather than on the bare `pending`
flag. If a one-liner is preferred: `const rearm = isDirty(entry) && (entry.pending ||
committed);` at `:667`, plus dropping `|| entry.running || entry.pending` from the
`arm()` half of the `:762` condition while keeping the chain await. Pin it with a test
that asserts exactly one `writeRow` call for one edit across the
`saveAllDirty()`-then-`idle()` sequence.

---

### P2-2 An abandoned preload leaks a store entry for the process lifetime

**Confidence:** high for the leak (measured 5,000/5,000 retained); medium for the
staleness consequence (needs a second realm process).
**Path:** `server/freehold_persist.ts:307-310` (`maybeRemove`), `:499-511` (`refuse`),
`:397-402` (`classify` -> `ensureEntry`); trigger at `server/ws_auth.ts:477`.

`preload()` creates the entry; the only removal is `maybeRemove`, which runs only from
`settle()` and `flushAndRelease()`. `flushAndRelease` is reached only through
`GameServer.leave`, which is reached only if `addClient` succeeded.

**Failure scenario:** `server/ws_auth.ts:477` awaits `freeholdForAccount(accountId)`
(entry created, `loaded === true`, `state` up to 102 KiB), then `:478-482` acquires the
character lease and returns `WS_AUTH_ERROR.alreadyInWorld` on failure. `retain()` is
never called, `leave()` never runs, `maybeRemove` never runs. There are five such
abandonment paths after the preload (lease refusal, `noSuchCharacter`, `forceRename`, a
thrown `getCharacter`, and the max-online-characters refusal at the top of `addClient`).
A double-login race is a routine event, so the map grows monotonically toward one entry
per distinct account that has ever hit one.

Two costs. Memory: bounded by distinct accounts, not by online accounts, at up to 102 KiB
each. Correctness on a multi-realm deployment: a leaked entry is `loaded`, so `preload`
returns the CACHED `state` and `durableRev` forever (`:561-564`). If another realm writes
the row in the meantime, the player's next login on this process installs the OLD house
and the first save CAS-fences and quiesces -- one session of wrong house with saving
disabled. No data loss (the row on disk is protected), and it clears on the next login.

**Smallest correction:** call `maybeRemove(entry)` at the end of `classify`/`refuse` when
`entry.refs === 0` and nothing is running or pending, or add a bounded idle sweep over
`refs === 0` entries. Pin the entry count after a preload that is never retained.

---

### P2-3 The `octet_length` bound detoasts and text-renders the whole JSONB before it is applied

**Confidence:** high (measured curve).
**Path:** `server/freehold_db.ts:222-241` (`FREEHOLD_ACCOUNT_READ_SQL`), header claim at
`:214-221`.

The header's claim -- "the two content columns come back NULL past it, so an oversized
row never crosses the wire into a deep parse" -- is TRUE for the wire and for the JS
parse. It is not true for the database. `octet_length(f.layout::text)` must fully detoast
the column and render the entire JSONB to text before any comparison can happen, so the
bound bounds the CLIENT, not the server.

**Failure scenario:** the recovery machinery exists because the authors believe oversize
rows can reach disk (the rollout contract's rollback case: a later release with a larger
decor budget writes a row, a rollback to this build reads it). A 5.3 MB row costs **58.5
ms** of database CPU per account read; a 25 MB row costs **242 ms**; a 51 MB row costs
**524 ms**. That cost is paid once per LOGIN for that account (the entry is re-read after
each logout evicts it), while holding one of 7 background permits and one of 10 pool
clients, on the box where Postgres and the game loop share four cores. A handful of such
accounts reconnecting together is a visible tick stall.

**Smallest correction:** short-circuit the pathological case with a cheap pre-gate on the
stored size before the text render, e.g.
`CASE WHEN pg_column_size(f.layout) + pg_column_size(f.trophies) > 1048576 THEN $2 + 1
ELSE COALESCE(octet_length(...),0) + ... END`. `pg_column_size` reads the TOAST pointer
header without detoasting. A 1 MiB gate sits ten times above the 102 KiB real bound, so
nothing near a legal row is ever misclassified, and it caps the worst-case detoast at
about 10 ms instead of half a second. Keep `octet_length` as the authoritative measure
below the gate -- the reason it was chosen over `pg_column_size` is still right. Pin the
gate with an oversize fixture in the pg suite.

---

### P2-4 The per-kind load-failure port is declared but never wired, so `load_failures` conflates every hold cause

**Confidence:** high.
**Path:** `server/freehold_persist.ts:134` (`recordLoadFailure?`), `:337`
(`ports.recordLoadFailure?.(hold.kind)`), unwired at `:993-1016`
(`createGameFreeholdPersistStore` port bag), consumed at
`server/http/game_metrics.ts:667`.

`holdResult` faithfully reports the kind, and the composition root never supplies the
callback, so the classification is dropped on the floor in production. The scrape sees
one `load_failures` number.

**Failure scenario:** `woc_freehold_persist{measure="load_failures"}` climbs. The operator
cannot tell whether that is "N accounts have unreadable rows" (a data incident that needs
the rollback contract), "the local admission cap is full" (a login-storm capacity
signal), "no background permit within 15,000 ms" (pool or gate saturation, which needs
the pool knob), or "the durable load threw" (a database fault). Those four demand
different responses and one of them is not urgent at all.

**Smallest correction:** pass `recordLoadFailure` in the port bag at `:993-1016` into a
per-kind counter, and add a `kind` label (or a second gauge family) at
`game_metrics.ts:652-676`. Pin that the composition root supplies it.

---

### P2-5 `held` conflates recovery holds with compare-and-swap quiesces

**Confidence:** high.
**Path:** `server/freehold_persist.ts:267` (`isHeld = entry.hold !== null || entry.quiesced`),
`server/http/game_metrics.ts:666`.

**Failure scenario:** `held` rising means either "these accounts' rows could not be read"
or "these accounts lost a CAS to a writer this realm does not know about" -- the second
being a strong signal that a second realm process is writing the same rows, which is the
one condition the whole `durable_rev` fence exists to detect. Merging them hides it.

**Smallest correction:** emit `held` and `quiesced` as separate measures. `staleWrites` is
already counted at `:595` and exported, but it is a cumulative total; a live `quiesced`
occupancy is the alertable form.

---

### P2-6 The housing sweep is the only periodic write whose synchronous cost is unattributed in the tick profiler

**Confidence:** high (measured cost; the omission is visible in the same object literal).
**Path:** `server/game.ts:2693` `saveFreeholds: () => this.saveFreeholds(),`.

Its three siblings on the lines directly above take `sample`
(`saveMarket(sample)`, `saveMail(sample)`, `saveRifts(sample)`) precisely so their
synchronous window lands in the tick profiler's saves budget. `saveFreeholds` does not.

**Failure scenario:** `saveAllDirty()` is fully synchronous (no `await` before it in
`saveFreeholds`), and it serializes -- deep-cloning `layout` and `trophies` -- once per
LOADED owner. Measured at 1,000 owners: **0.44 ms** with empty layouts, **3.44 ms** at 60
layout rows, **15.69 ms** at the 420-row legal maximum, every 30 seconds, inside one 50 ms
tick, producing **zero writes** in steady state. When that shows up in production it is an
unexplained 30-second-periodic tick spike with no lap attributing it, and the profiler
sample that would have named it is one argument away.

**Smallest correction:** thread the sample through the way the three siblings do. The
serialize itself is a separate, larger question: `noteRevisionMoved` pays a full deep
clone (`serializeFreehold` -> `cloneFreeholdState`) plus a second copy
(`persistedFreeholdFromState`) only to read `live.rev`. Comparing `entry.state.rev`
against `ctx.freeholds.get(ownerKey)?.rev` directly would answer the same question at
zero allocation; the clone is only needed once movement is confirmed.

---

### P2-7 A login-path wait is bounded at 15 s, three times the pool's own connect timeout

**Confidence:** high.
**Path:** `server/freehold_persist.ts:69` (`FREEHOLD_PERSIST_PERMIT_WAIT_MS = 15_000`),
`:520-533` (the wait), awaited at `server/ws_auth.ts:477`.

The handshake awaits `freeholdForAccount(accountId)` on the fresh-join arm, and that call
can sit on the background gate for the full 15 seconds before answering a hold. Every
other bound on that path is shorter: `DB_POOL_CONNECT_TIMEOUT_MS` is 5,000 and the pool's
server-side `statement_timeout` is 15,000.

**Failure scenario:** a mass reconnect after a realm restart saturates the 7-permit gate
(autosave-adjacent producers, storage-purchase recovery, escrow, paid guild creation and
character delete all share it). A joining player's handshake blocks up to 15 s waiting for
a permit whose only purpose is to read two small rows, and then still gets a hold.

**Smallest correction:** give the login-path read its own, shorter bound (the pool's own
5,000 ms connect budget is the natural sibling) and keep 15,000 for the write path. The
local admission cap already makes an immediate refusal safe: it is a hold, not a failure.
State the two constants separately so a future reader cannot merge them.

---

### P2-8 Loads are capacity-capped; writes are not

**Confidence:** high (measured 993-999 peak gate waiters).
**Path:** `server/freehold_persist.ts:77` (`FREEHOLD_PERSIST_MAX_ACTIVE_LOADS = 4`,
enforced at `:515`), against `:714-721` (`arm`) and `:677-710` (`launch`), which have no
equivalent.

The keyed serial writer serializes per OWNER KEY, so 1,000 owners means 1,000 independent
FIFOs racing for one shared gate. The store's own header warns that
"server/background_db_gate.ts keeps its waiter list UNCAPPED, so a caller that queues
without a bounded signal is the thing that grows without limit". Bounding each WAIT at 15
s does not bound the waiter COUNT.

**Failure scenario:** the first sweep after a mass login on a realm where most accounts
have no durable row arms every one of them at once. Measured: **993 simultaneous gate
waiters at gate capacity 7**, and **999 at gate capacity 1**, each with its own
`AbortSignal.timeout` timer, created in one burst. It drained cleanly in the harness (699
ms at capacity 7, 4.7 s at capacity 1) because the fake write was 2 ms; with a real 0.2 ms
statement the arithmetic holds, but the gate is FIFO, so for the duration of that burst
every other named producer -- storage-purchase recovery, escrow, character delete --
queues behind up to a thousand housing writes.

**Smallest correction:** apply the same local admission shape the loads already use, a
small `FREEHOLD_PERSIST_MAX_ACTIVE_WRITES` checked in `launch()` with the surplus staying
dirty for the next sweep rather than queuing on the shared gate. Unlike a load, deferring
a write is free: the entry stays dirty and the next sweep picks it up. Pin peak
concurrency and peak gate waiters in a test.

---

### P2-9 A logout can block on the gate for the whole permit-plus-statement budget

**Confidence:** medium-high (path is clear; not driven end to end here).
**Path:** `server/freehold_persist.ts:757-776` (`flushAndRelease`), awaited at
`server/game.ts:3904` inside `GameServer.leave`.

`flushAndRelease` arms and then awaits `entry.chain`, and that chain contains the 15 s
permit wait plus a statement bounded at `DB_STATEMENT_TIMEOUT_MS` (15,000). Under gate
saturation a single logout therefore blocks for up to about 30 s before the session
completes its leave; `FREEHOLD_PERSIST_FLUSH_MAX_PASSES` is 4, so a re-arming entry can
extend that further.

**Failure scenario:** the mass-disconnect case. Gate saturated, every leaving session
awaits a housing flush, `GameServer.leave` backs up, and character leases are released
late because the freehold flush deliberately sits above the lease release. Nothing
corrupts, but reconnects wait out the lease.

**Smallest correction:** give the leave-path flush its own short deadline
(`Promise.race` against a bounded timer, leaving the write to the shutdown drain if it
misses) rather than inheriting the background write's budget. This one is partly settled
by P2-7 and P2-8; if those land, the exposure shrinks a lot.

---

### P2-10 Cumulative totals are exposed as a Gauge, not a Counter

**Confidence:** high. **Path:** `server/http/game_metrics.ts:655-676`.

`loads`, `load_failures`, `writes`, `write_failures`, `stale_writes`,
`permit_wait_ms_total` and `queue_wait_ms_total` are monotonic process totals published
through a `Gauge`. `rate()` and `increase()` over a gauge do not get counter-reset
handling, so every realm restart shows as a rate artifact. There IS repo precedent
(`WOC_BACKGROUND_DB_GATE` does the same with `acquired`/`refused`/`cancelled`), so this is
a consistency call rather than a novel defect; I raise it because the housing family is
the one an operator will alert on for durability.
**Smallest correction:** split the seven cumulative measures into a `Counter` family and
leave `entries`/`dirty`/`running`/`pending`/`held`/`oldest_dirty_age_ms` on the gauge.

---

### P2-11 There is no write-duration signal at all

**Confidence:** high. **Path:** `server/http/game_metrics.ts:652-676`,
`server/freehold_persist.ts:145-160` (`FreeholdPersistStats`).

`permit_wait_ms_total` and `queue_wait_ms_total` measure everything EXCEPT the statement.
The failure mode that actually matters here -- a durable write that has become slow and is
pinning a gate permit and a pool client -- is only visible indirectly, as OTHER work's
permit waits rising.
**Smallest correction:** add `write_ms_total` around the `ports.writeRow` call at
`:642-653` (and a `load_ms_total` around `classify`). Two counters, same shape as the
two that already exist.

---

### P2-12 `last_write_bytes` is a last-sample gauge

**Confidence:** high. **Path:** `server/freehold_persist.ts:641`,
`server/http/game_metrics.ts:675`.

A single global "most recent write's byte count" is unaggregatable: at 1,000 owners a
scrape samples one arbitrary write, so the value tells an operator nothing about the size
distribution and nothing about growth toward the 102 KiB ceiling.
**Smallest correction:** make it `write_bytes_total` (a counter, divisible by `writes` for
a mean) and, if a ceiling alarm is wanted, `max_write_bytes` as a high-water gauge.

---

### P2-13 The only dirty detector in this build is revision-based, and the two explicit ones are dead

**Confidence:** high (grep-confirmed); the harm is forward-looking.
**Path:** `server/freehold_persist.ts:734-748` (`markDirty`, `save`), `:257-265`
(`noteRevisionMoved`).

Neither `markDirty` nor `save` has a production caller. `saveAllDirty` ->
`noteRevisionMoved` compares `live.rev` against `entry.state.rev`, and the live record's
`rev` is bumped today by `setFreeholdTier` alone (`src/sim/freehold/state.ts:165-170`).
The steady-state measurement confirms this is CORRECT today: zero spurious writes at
1,000 owners across five sweeps, which answers the brief's "can it write more often than
the record actually changes" with no for the steady state (and the shutdown/overlap
doubling is P1-1, a different mechanism).

**Failure scenario (the next phase, not this one):** the furnishing placement writer
lands. If it mutates `state.layout` without bumping `state.rev`, the sweep sees nothing,
`markDirty` has no caller to fall back on, and every placement is silently lost at
logout -- with `oldest_dirty_age_ms` reading 0 the whole time, because the entry never
became dirty. **Smallest correction:** pin the coupling now -- a test asserting that
every sanctioned mutator of `FreeholdState` bumps `rev`, or that `noteRevisionMoved`
detects a layout-only edit. Cheap here, expensive to discover later.

---

### P2-14 Every plot save is a non-HOT update that rewrites both btrees

**Confidence:** medium (inferred from the index set and row size; not separately measured).
**Path:** `server/freehold_db.ts:150-151` (`account_freeholds_plot_id`), `:370-380`.

The table carries two btrees (the PK and the unique `plot_id`). The CAS UPDATE changes
neither indexed column, so a HOT update is available in principle, but a 5 KB row leaves
little free space on the page, so most saves will produce new entries in both indexes plus
TOAST churn on `layout`. At the current write rate (rev changes only) this is negligible;
it matters mostly because P1-1 doubles it.
**Smallest correction:** none needed now. If write volume grows, a `fillfactor` on the
table is the standard lever. Recorded so the cost is on the record rather than
rediscovered.

---

### Nit-15 A hearth constant stands in for a plot revision

**Confidence:** high. **Path:** `server/freehold_persist.ts:508`.

`refuse()` builds a `FreeholdRecoveryHold` with `durableRev: ABSENT_HEARTH_REVISION`.
The value ('0') is right; the name is from the hearth clock and the field is the plot's
durable revision. Dev-channel only, no behavior. A literal `'0'` with a one-line comment,
or a `FREEHOLD_ABSENT_DURABLE_REV` beside it, reads correctly.

---

## Required runtime proof

1. **P1-1 regression pin.** A store test asserting exactly ONE `writeRow` call for one
   edit across `saveAllDirty()` -> `idle()`, across two overlapping sweeps, and across
   `saveAllDirty()` -> `flushAndRelease()`. Mock-level; no database needed.
2. **P2-3 oversize gate.** A `tests/server/freehold_db.pg.test.ts` case on the
   disposable instance inserting a deliberately oversize row and asserting both the
   `oversize` classification AND that the read does not detoast (compare
   `EXPLAIN (ANALYZE, BUFFERS)` execution time, or assert the pre-gate short-circuits).
   Do NOT land the correction without this: the whole point is a cost, and only an
   executed plan shows it.
3. **P2-8 peak-concurrency pin.** A test asserting peak in-flight writes and peak gate
   waiters stay under the new cap on a mass-arm burst. Mock-level with the real gate,
   the shape I used above.
4. **P2-2 entry accounting.** A test asserting the store retains no entry for a preload
   that is never retained.
5. Nothing further is owed on the plans themselves: the account read, the CAS update,
   the diagnosis read, the export read and the FK cascade probe all reach
   `account_freeholds_pkey` at 200,000 rows without a forced GUC, and the repo's own pin
   already covers the `enable_seqscan = off` question.

## Clean categories

- **Index fit.** The deliberate absence of a separate `account_id` index is **correct
  and measured**. `PRIMARY KEY (account_id, plot_index)` serves the account read
  (`Index Cond: (account_id = $1)`, no sort, no seq scan at 200,000 rows) and serves the
  real `ON DELETE CASCADE` probe (`DELETE FROM ONLY ... WHERE $1 = account_id` -> Index
  Scan on the same key). A second index would be pure write amplification. The
  `account_freeholds_plot_id` unique index is required by the wire echo, and
  `account_freehold_hearth` correctly ships with the PK alone.
- **Result-set bounds.** `LIMIT 2` (`FREEHOLD_ACCOUNT_PLOT_READ_LIMIT`) bounds the
  account read; one row per account bounds the hearth read; the export loaders are
  PK-scoped. No unbounded scan exists on any path.
- **Statement count.** The CAS upsert is ONE statement on the happy path (insert-or-CAS);
  the diagnosis read fires only when the first statement affected zero rows, and it never
  retries. A fresh join is exactly two queries; a resume is zero.
- **Hearth lock order and mode.** `FOR KEY SHARE` on the account parent then `FOR UPDATE`
  on the row is right. `FOR KEY SHARE` conflicts only with `FOR UPDATE`, so it cannot
  block the ~33/s character save (which takes `FOR NO KEY UPDATE` or `FOR KEY SHARE`),
  and the pg suite proves with `pg_blocking_pids` that two concurrent entries serialize on
  the row lock (or on the `ON CONFLICT DO NOTHING` speculative insert at first use), not
  on the participant lock. `GREATEST` plus a bare `revision + 1` keep the advance monotone
  in the statement. One caveat for the record, not a defect in this diff:
  `advanceFreeholdHearthOnClient` has no production caller yet, so this whole judgment is
  about a path that is not reachable in this build.
- **Transaction scope.** The plot store never opens a transaction; the hearth module
  explicitly never issues BEGIN/COMMIT/ROLLBACK and runs on the caller's client. No pool
  client is held across a FIFO wait or an enqueue.
- **FIFO-then-permit ordering.** Correct everywhere: `runWrite` acquires the permit from
  INSIDE the enqueued thunk, `loadOnce` takes no FIFO at all, and `flushAndRelease` awaits
  the chain from outside any permit. Measured no deadlock at gate capacity 1 with 50
  owners plus layered `markDirty`/`save`, drained with `pendingKeys() === 0`.
- **Per-tick and per-broadcast work.** No query runs per tick or per broadcast.
  `dispatchFreeholdCommand` and `server/freehold_wire.ts` touch no database. The only
  per-tick cost is the 30 s synchronous sweep (P2-6).
- **Deadline scoping.** No short bound leaks onto boot DDL: `ensureSchema` runs on a
  dedicated `Client` with no `statement_timeout`/`query_timeout` and an explicit
  `SET LOCAL statement_timeout = 0` before the advisory lock. Both fragments are
  `CREATE ... IF NOT EXISTS` only, no `ALTER`, no `CONCURRENTLY`, and
  `tests/schema_wiring.test.ts` pins byte-identical re-application plus the absence of
  `DROP`/`TRUNCATE`/`ALTER COLUMN`.
- **Stored-data growth and retention.** Both tables are correctly keep-forever and
  correctly absent from the retention sweep: one row per account, no per-event or
  per-session growth, the accounts cascade as the only removal path, and both ride
  `exportAccountData`. The rationale is written where the sweep table is declared
  (`server/main.ts:3986-3999`), in the DDL, in `DEPLOY.md` and in `.env.example`.
- **Connection budget.** No new pool, no new dedicated client, no bypass path. Every
  statement rides the shared `pool` behind the existing named-producer gate, so the
  per-realm term in `db_connection_budget.ts` is unchanged and the multi-realm arithmetic
  in `server/db.ts:241-262` still holds.
- **Dark-realm cost.** With `FREEHOLDS_ENABLED` unset, `server/main.ts:3820-3824` never
  calls the store, so zero queries are issued. The unconditional `retain` at
  `server/game.ts:3293` creates one `loaded === false` entry per online account, which
  `blocked()` short-circuits before any serialize and `flushAndRelease` removes on leave.
  Production today pays nothing.
- **Driver and engine configuration.** Unchanged. No pool option, timeout, planner GUC or
  `pg` version is touched by this diff.

## Cross-cutting dispatch

The oversize-row rollback behavior (P2-3's reachability), the "unsupported rows preserved
read-only" contract and the `durable_rev` fence across a version downgrade belong to
**migration-safety**. Nothing in this diff needs **privacy-security-review** on my
account: the metric family is counts and millisecond totals only, no owner key, account id
or plot id reaches a gauge, and the export loaders hand back the owner's own rows.
