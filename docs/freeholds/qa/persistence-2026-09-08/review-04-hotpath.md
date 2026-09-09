# Review 04: server hot path (non-SQL budget)

Diff: `c18facd4cc..HEAD` on `feature/freeholds`. Scope gate: the diff touches
`server/game.ts`, `server/main.ts`, `server/ws_auth.ts`, `server/periodic_save_flush.ts`,
`server/http/game_metrics.ts` and four new `server/` modules. Full checklist applies: the
sweep member runs inside the 20 Hz loop body and the preload runs on the WS handshake.

Measured line counts (reported, not raised): `server/db.ts` 4605 (ceiling 4865),
`server/game.ts` 9978 (ceiling 10761), `server/freehold_persist.ts` 1017.
`npx vitest run tests/server/freehold_persist.test.ts` printed `Tests 76 passed (76)`.

## F1 (blocking, high) The 30 s sweep deep-clones every loaded plot TWICE, inside the tick body, to read one integer

`server/freehold_persist.ts:257` `noteRevisionMoved` -> `ports.serialize(entry.ownerKey)`,
composed at `server/freehold_persist.ts:1002` as `serializeFreehold` (a deep clone:
`cloneFreeholdState`, `src/sim/freehold/state.ts:74`, spreads the record and maps both row
arrays) followed by `persistedFreeholdFromState` (`src/sim/freehold/persisted.ts:432`, a
SECOND full map over layout and trophies). The entire result is discarded except
`live.rev === entry.state.rev` (`server/freehold_persist.ts:261`).

This runs synchronously inside the 20 Hz loop. `saveFreeholds` (`server/game.ts:5068`) is an
`async` method with no `await` in its body, so `saveAllDirty()` runs to completion in the
synchronous prefix; `runPeriodicSaveFlush` (`server/periodic_save_flush.ts:130`) calls it
from `flushPeriodicSaves` (`server/game.ts:2693`), which the module header itself states
"runs inside the 20 Hz loop body, so it must return synchronously". Unlike
`saveMarket`/`saveMail`/`saveRifts`, which hand their work to an off-loop writer, this
member's whole cost lands on one tick.

Measured (`scratchpad/ph07/sweep_bench.mjs`, a faithful transcription of the two functions,
run on this dev Mac; the production box is a 4-vCPU shared host, so scale up 2-4x):

| online accounts | layout rows | sweep p50 | sweep max | rev-only p50 |
|---|---|---|---|---|
| 1000 | 40 | 1.11 ms | 1.22 ms | 0.017 ms |
| 1000 | 120 | 2.63 ms | 2.75 ms | 0.013 ms |
| 1000 | 420 (cap) | 8.85 ms | 9.22 ms | 0.013 ms |
| 5000 | 40 | 3.60 ms | 4.35 ms | 0.089 ms |
| 5000 | 120 | 12.02 ms | 15.90 ms | 0.046 ms |
| 5000 | 420 (cap) | 40.73 ms | 45.48 ms | 0.051 ms |

Garbage: tens of MB per sweep (2 x (layout + trophy) objects per owner;
`FREEHOLD_MAX_LAYOUT_ROWS` is 420 and `FREEHOLD_MAX_TROPHY_ROWS` is 32).

Failure scenario: 5000 online accounts on a lit realm with ordinary 120-row houses. Every
30 s one tick spends 12 ms here on THIS machine, which on the production host is a
meaningful fraction of the 50 ms tick budget and stacks with the character autosave issued
in the same tick; at the 420-row cap it is 41 ms here and a multi-tick stall there. Nothing
in the diff bounds it: it is O(entries x layout rows) with two allocations per row.

Seam that fixes it: the information the probe wants is one integer already on the live
record. Add a cheap port beside the existing `hasLive` (`server/freehold_persist.ts:127`,
composed at `:1006` as a plain `ctx.freeholds.has`), e.g.
`liveRev(ownerKey): number | null` reading `deps.sim.ctx.freeholds.get(ownerKey)?.rev`, and
serialize ONLY inside `runWrite` (`:635`), which already does. That is the measured
rev-only column: 0.05 ms at 5000 owners, about 500x cheaper, with identical semantics
(including the backwards-revision arm). Alternatively give the sweep a per-pass budget and
amortize, but the port is strictly better and smaller.

## F2 (should-fix, high) `entries` has no eviction for a preload that never became a join

`entries` is removed only by `maybeRemove` (`server/freehold_persist.ts:307`), called only
from `settle` (`:673`), the `launch` catch (`:707`) and `flushAndRelease` (`:775`). A
preload creates and fully populates an entry (`classify` -> `ensureEntry`,
`server/freehold_persist.ts:402`; `refuse` -> `ensureEntry`, `:500`) with `refs` 0, and
`retain` is what pairs with the release.

`server/ws_auth.ts:477` calls `freeholdForAccount` BEFORE the lease acquire, and there are
five abandonment paths between that call and `game.join`'s `retain`
(`server/game.ts:3293`):
- `acquireCharacterLease` returns false -> `alreadyInWorld` reject (`ws_auth.ts:481`);
- the post-lease `getCharacter` reload returns null -> `noSuchCharacter` (`:509`);
- `force_rename` -> reject (`:517`);
- the reload throws -> rethrow (`:526`);
- `game.join` takes the `planJoin` reject or resume arm (`game.ts:3276`, `:3277`), both of
  which return before the retain.

Failure scenario: a player's client flaps and reconnects while its old session is still
linkdead. Each attempt hits `alreadyInWorld`; the account's store entry is created, filled
with the account's full `PersistedFreehold` (up to 420 layout rows, roughly 34 KB at the
cap, ~4 KB for a modest house), and never removed for the life of the process. Repeats for
the SAME account reuse the entry, so growth is one leaked entry per DISTINCT account that
ever abandoned a fresh join, unbounded over uptime: 10,000 such accounts at a modest house
is roughly 40 MB of realm-process memory that never comes back. The existing test at
`tests/server/freehold_persist.test.ts:313` acknowledges the shape: it has to call
`retain` then `flushAndRelease` by hand just to drop an entry a bare `preload` created.

Second-order effect: a leaked entry is `loaded`, so a later successful join for that
account replays `entry.state` from the `entry?.loaded` arm (`:561`) instead of re-reading.
If the row moved in the meantime (another realm process, an operator edit), that session
plays with a stale house and its first write hits the CAS and quiesces.

Seam that fixes it: this store is the account-keyed bounded-cache shape
(`server/discord_status_cache.ts`), which pairs its keyed Map with a size bound and LRU
eviction. Either give `entries` that bound, or make the preload's entry provisional until
a `retain` claims it (drop an unreferenced, never-retained entry on a short TTL or at the
next sweep). A sweep-side `if (entry.refs === 0 && !entry.running && !entry.pending)
entries.delete(...)` inside `saveAllDirty` would close it with the machinery already there.

## F3 (should-fix, high mechanism / medium frequency) The `hasLive` short-circuit can hand a same-account rejoin a permanently write-blocked, invisible entry

`preload` checks `ports.hasLive(ownerKey)` FIRST (`server/freehold_persist.ts:553`) and, on
a hit, returns `snapshotOf(known, null)` over an entry it may have just created with
`loaded: false`. Separately, `leave` deletes the entry at
`server/game.ts:3904` (`flushAndRelease` -> refs 0 -> `maybeRemove`) but does not evict the
LIVE sim record until `this.sim.removePlayer(session.pid)` at `server/game.ts:3923`
(`releaseFreeholdOnLeave`). Between those two lines sits
`await releaseCharacterLease(...)` (`server/game.ts:3920`), a full database round trip.

Failure scenario: a player logs out character A and immediately logs in character B on the
same account through a new socket. B's handshake preload lands inside that round-trip
window. `hasLive` is still true (the record is not evicted yet), so `preload` returns
immediately over a BRAND NEW entry with `loaded: false`, `hold: null`. `blocked()`
(`:271`) is therefore true for B's whole session: `save` refuses, `saveAllDirty` skips,
`flushAndRelease` writes nothing. Two sub-cases:
- B's `addPlayer` runs before A's `removePlayer`: the live record survives, B decorates all
  session, and NOTHING is ever persisted.
- B's `addPlayer` runs after: `releaseFreeholdOnLeave` evicts, then `seedFreeholdOnJoin`
  seeds a default empty Inn Room, so B plays in an EMPTY house AND writes nothing.

Both are silent: `hold` is null, so no warn fires and the `held` gauge does not count it
(`isHeld` at `:267` tests `hold !== null || quiesced` and ignores `!loaded`).

Seam that fixes it: require the entry to actually be loaded before short-circuiting, i.e.
move the `hasLive` test after the `entry?.loaded` arm and gate it on `entry?.loaded === true
&& ports.hasLive(ownerKey)`. Falling through to the real load when the entry is absent is
also correct: `loadFreehold` is load-once so the live record is untouched, and the entry
comes back write-enabled. (This overlaps a correctness lane; I am reporting it here because
the defect is in the store's collection lifecycle.)

## F4 (should-fix, high) The leave path's new await binds session teardown to a 15 s permit wait, with no `try`/`finally` behind it

`server/game.ts:3904` awaits `flushAndRelease`, and `this.sim.removePlayer(session.pid)`
(`:3923`) plus `releaseCharacterLease` (`:3920`) sit behind it in a function with no
`try`/`finally`.

On the reject question the brief asks: I traced no path today by which
`flushAndRelease` rejects. `arm`/`launch` wrap the enqueue in `try`/`catch`
(`server/freehold_persist.ts:684`), the chain carries `.catch` (`:687`) and a `settle`
guarded by its own `try` (`:696`), and the flush loop awaits with `.catch(() => undefined)`
(`:771`). So the answer is no, not as written. It is unguarded by construction though: the
`Date.now`/`entries` calls outside the `try` and any future port that throws synchronously
would strand the entity in the sim (ticked and broadcast to everyone in interest range,
with nobody driving it) and hold the character lease until its TTL. A `try { ... } finally
{ ... }` around the tail is cheap insurance.

The LATENCY is the live problem. `flushAndRelease` awaits up to
`FREEHOLD_PERSIST_FLUSH_MAX_PASSES` chains, and each `runWrite` waits up to
`FREEHOLD_PERSIST_PERMIT_WAIT_MS` (15 s, `:69`) for a background permit, plus the key's
FIFO wait behind a write already running for that owner (itself possibly waiting its own
15 s). Failure scenario: the pool stalls, the background gate saturates (capacity is
`poolMax - 3`, `server/background_db_gate.ts:18`), and every leaving session now blocks for
up to 15 to 30 s before `removePlayer` runs. At scale that is a realm full of undriven
ghost entities being broadcast, and `takeOverCharacter` (which awaits `leave()`) refusing
relogins for the same window.

Seam that fixes it: `serializeFreehold` once synchronously at leave and hand the store the
SNAPSHOT (so the write no longer needs the live record and need not be awaited), or bound
the flush wait with a short deadline (a `Promise.race` against a 1 to 2 s timer) and let
the periodic sweep and the shutdown drain finish the rest. Either way the ordering
constraint the comment cites is preserved.

## F5 (should-fix, medium-high) The sweep arms every dirty entry at once: an unbounded burst of gate waiters ahead of the character autosave

`saveAllDirty` (`server/freehold_persist.ts:750`) and `idle` (`:791`) `arm` every qualifying
entry in one synchronous loop, with no per-pass budget. Each armed write goes to
`writer.enqueueCancellable(ownerKey, ...)`; the writer serializes per KEY, and every owner
is a distinct key, so all N start at once and all N call `gate.acquire(signal)` inside
`runWrite` (`:620`). `server/background_db_gate.ts` keeps its waiter list uncapped by
design.

Contrast the sibling: the character autosave (`GameServer.saveAllSnapshot`,
`server/game.ts:4522`) is a bounded-concurrency sweep, at most `SAVE_CONCURRENCY`
outstanding acquires at a time.

Failure scenario: first light-up of `FREEHOLDS_ENABLED` on a realm with 1000 online
accounts. Every entry loads `absent` (no rows yet) so `entry.state` is null, and
`noteRevisionMoved`'s guard `entry.state !== null && ...` (`:261`) cannot short-circuit:
the first sweep arms a durable insert for EVERY online account, in one tick. 1000 waiters
queue on a gate whose capacity is roughly `poolMax - 3`. `runPeriodicSaveFlush` issues
`saveCharacters` first, but its workers acquire lazily, so each character save that
completes goes to the BACK of a 1000-deep FIFO. At a 50 ms query the drain is about 7 s at
1000 and about 35 s at 5000, and the 15 s permit bound means most freehold writes at 5000
abandon with a `writeFailures` bump and a warn line, then retry on the next sweep. Character
durability is stalled behind housing for that window. The same shape recurs on any
realm-wide event that dirties many records.

Seam that fixes it: a per-pass arm budget in `saveAllDirty` (the `retention_sweep.ts`
per-run-budget idea, or `saveAllSnapshot`'s bounded worker pool), so the sweep drains over
several passes instead of one burst. Cheap partial mitigation: skip the first write for an
untouched default record (rev 0, empty layout and trophies), which removes the light-up herd
entirely at the cost of an account with no row until it first decorates.

## F6 (should-fix, medium) The load admission cap refuses rather than defers, and a refusal is sticky for the whole session

`FREEHOLD_PERSIST_MAX_ACTIVE_LOADS` is 4 (`server/freehold_persist.ts:77`) and
`loadOnce` refuses immediately past it (`:515`). `refuse` -> `holdResult` sets
`entry.loaded = true` with an `unadmitted` hold (`:329`), and `preload`'s `entry?.loaded`
arm (`:561`) then replays that hold for every later join of that account until the entry is
evicted. A slot is held for the whole load, INCLUDING the up-to-15 s permit wait (`:521`),
not just the queries.

Failure scenario: a realm restart. 1000 accounts reconnect over a minute or two while the
pool is cold and the gate is contended. Loads 5 and beyond are refused outright; each
refused account is write-blocked and installs nothing, so `seedFreeholdOnJoin` gives it a
default empty Inn Room. The row is safe (invariant 1 holds, which is the right call), but
the player-visible outcome is "my house is empty" for the whole session, with no retry, at
exactly the moment the most players are joining at once. There is also no metric that
separates `unadmitted` from the other hold kinds at the gauge (`recordLoadFailure` takes a
kind, but `WOC_FREEHOLD_PERSIST` publishes only the `load_failures` total,
`server/http/game_metrics.ts:667`).

Seam that fixes it: make a REFUSED load retryable rather than terminal. Either do not set
`loaded` on the `unadmitted`-from-admission arm (leave the entry unloaded so the next join
re-attempts, at the cost of a write-blocked session either way), or let a refused preload
re-enter once on a later join. Raising the cap alone does not fix it; the stickiness is the
part that turns a transient contention spike into a session-long outage. At minimum, label
the `load_failures` gauge by kind so an operator can see a refusal storm.

## F7 (should-fix, medium) The shutdown drain's own deadline is shorter than the permit wait its writes use

`FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS` is 10 s (`server/freehold_persist.ts:63`);
`FREEHOLD_PERSIST_PERMIT_WAIT_MS` is 15 s (`:69`). `idle` arms every dirty entry and each
`runWrite` may sit 15 s on `acquirePermit` before giving up.

Failure scenario: shutdown under gate contention (the moment the other drains and the
shutdown `saveAll` are running). The drain deadline fires at 10 s while its own writes are
still waiting for a permit they cannot get for another 5 s. `server/main.ts:4297` logs
"freehold persistence drain deadline reached", the shutdown proceeds to the lease sweep and
closes the pool, and the still-waiting writes then fail against a closing pool. The drain is
correctly BOUNDED (a plain `setTimeout` cancelled on completion at `:814`, so it cannot hang
the restart, and `freeholdPersistIdle` never throws), but under contention it is guaranteed
to abandon rather than merely at risk.

Supporting arithmetic: the shutdown closure now awaits four sequential drains,
`bankLedgerIdle` 10 s (`server/main.ts:4267`), `soldVolumeWriterIdle` 10 s (`:4288`),
`freeholdPersistIdle` 10 s (`:4296`), `stopUnstuckRecords` 5 s (`:4301`), 35 s total worst
case where it was 25 s, against a fixed `stop_grace_period: 75s` (`docker-compose.yml:283`)
that also has to cover the shutdown `saveAll` for every online character. The drains have no
shared remaining-budget clock, so each new one is purely additive.

Seam that fixes it: pass the drain's REMAINING budget down as the permit-wait signal
(`AbortSignal.timeout(min(remaining, PERMIT_WAIT))`) so a drain-time write never outlives
its own drain, and consider a shared shutdown deadline the four drains split (that last part
is a repo-wide change, not this diff's obligation).

## F8 (should-fix, medium) The new tick work is not billed to the `saves` phase, and the worst store state is invisible

Two observability gaps, against check 6:
- `server/game.ts:2693` passes `sample` to `saveMarket`, `saveMail` and `saveRifts` but not
  to `saveFreeholds`, so the synchronous sweep cost lands in the profiler's `total` with no
  phase attribution while its siblings bill into `saves` via `createTickSaveObserver`
  (`server/tick_profiler.ts:29`). This is exactly the failure
  `server/periodic_save_flush.ts:16` documents ("their time went unattributed"), repeated
  for the new member. Given F1's numbers, a sweep regression will show up only as
  unexplained tick growth. Fix: time `saveAllDirty()` and `tickProfiler.add('saves', ms)`,
  or route it through the same sample.
- `stats().held` (`server/freehold_persist.ts:834`) counts `isHeld` only, which is
  `hold !== null || quiesced`. An entry stuck `!loaded` forever, the F3 class, is
  write-blocked but counted nowhere. Fix: publish a `blocked` measure, or add `unloaded`
  beside `held`.

Not a finding, noted for completeness: `loads`, `writes`, `write_failures`,
`stale_writes`, `permit_wait_ms_total` and `queue_wait_ms_total` are monotonic counters
published as `Gauge` measures, so `rate()`/`increase()` do not get counter-reset semantics
across a restart. `WOC_BACKGROUND_DB_GATE` in the same file does the same thing, so this is
the file's existing convention, not this diff's regression.

## F9 (nit, high) `retain` is unconditional, so a DARK realm still allocates a store entry per online account

`server/game.ts:3293` calls `this.freeholdPersist.retain(...)` with no `freeholdsEnabled`
guard, and `retain` (`server/freehold_persist.ts:782`) creates the entry via
`ensureEntry(ownerKey, 0)`. On production today (housing off) `installLoadedFreehold`
correctly no-ops, but every join still creates a placeholder entry and every leave removes
it, and `saveAllDirty` iterates them all every 30 s. The work per entry is trivial
(`blocked()` short-circuits on `!loaded`) and the refs balance, so this is not a leak. The
real cost is the gauge: `WOC_FREEHOLD_PERSIST{measure="entries"}` will read as the online
account count on a realm where housing is disabled, and its help text says "loaded
entries". Fix: gate the retain on `freeholdsEnabled`, or document the dark-realm reading in
the gauge help.

## F10 (nit, high) `drainCheck` is O(entries) per settled write

`drainCheck` (`server/freehold_persist.ts:723`) walks the whole `entries` map on every
settle while a drain is outstanding. At shutdown with 5000 entries and 500 dirty, that is
2.5M map steps for the drain. Correct and cheap in absolute terms (a few hundred ms at
worst), but it is O(N) per write where a running-plus-pending COUNTER maintained by
`launch`/`settle` would make it O(1). Worth folding in if F5 raises the burst size.

## F11 (nit, high) `markDirty` and `save` have no production caller

Grep of `server/` finds only `retain`, `flushAndRelease`, `saveAllDirty` and `stop` on
`this.freeholdPersist` (`server/game.ts:2793`, `:3293`, `:3904`, `:5070`). So 100 percent of
dirty detection today rides `noteRevisionMoved`, the expensive probe of F1, and the two
cheap paths are dead code. That is context for F1 rather than a defect on its own: it means
the fix in F1 is not optional relief, it is the only path there is.

## F12 (nit, medium) Retention: the keep-forever verdict is defensible; the absence pin is adequate but evadable

The verdict holds. `account_freeholds` is `PRIMARY KEY (account_id, plot_index)` with the
writer admitting only `FREEHOLD_PRIMARY_PLOT_INDEX`, so it is one row per account, and
`account_freehold_hearth` is `account_id INT PRIMARY KEY`. Neither grows per event, per
session or per day; both cascade from `accounts`; both ride the export
(`freeholdsForExport`, `freeholdHearthForExport`). Both carry an explicit keep-forever
comment AT the DDL (`server/freehold_db.ts:77`, `server/freehold_hearth_db.ts:76`), which is
what `server/CLAUDE.md` "Hot paths" actually requires; the `server/main.ts` comment is a
bonus. Growth is bounded at one row per account that has logged into a lit realm, at a
`FREEHOLD_MAX_OWNED_BYTES` (102 KB) ceiling per row and a few hundred bytes in practice.

The absence pin (`tests/server/main_retention_wiring.test.ts:328`) is the right SHAPE (it
copies the `bank_ledger` asymmetry pin, and it backstops with the table-array order pin),
but every needle is a negative literal string test: `not.toContain("name:
'account_freeholds'")`, `not.toContain('pruneFreehold')`, `not.toContain('DELETE FROM
account_freeholds')`. A prune wired through a constant, e.g. `{ name: FREEHOLD_PLOT_TABLE,
pruneBatch: ... }` with the batch named `pruneHousingBatch`, satisfies all of them. That is
the negative-predicate weakness; a positive assertion over the sweep's table-name ARRAY
(assert the exact expected set, so any addition reds) would be strictly stronger. Nit
because the DDL comments and the reviewer path both cover the realistic case.

## F13 (nit, low) `registerFreeholdPersistStore` is a module singleton a second GameServer silently overwrites

`server/freehold_persist.ts:868` holds one module-level `registered`, set from the
GameServer constructor (`server/game.ts:1867`). A second GameServer in one process replaces
it without a warning; the first store keeps its entries and stays reachable through its own
GameServer but is invisible to `freeholdPersistIdle` and `freeholdPersistStats`. Production
runs one GameServer per realm process, so this is a test-hygiene concern. It matches the
`server/unstuck_records.ts` shape the header cites, so it is consistent; a warn on
overwrite would make an accidental double-construction visible.

## F14 (nit, low) The fresh-join handshake now pays two more sequential round trips

`server/ws_auth.ts:477` awaits `freeholdForAccount` right after `bankBonusForAccount`, and
`classify` (`server/freehold_persist.ts:400`) runs the row read and the hearth read in
sequence under one permit. So a fresh join gains one permit acquire plus two serial
queries on the critical path, ahead of the lease acquire. The serialization under one permit
is deliberate and correct (two concurrent queries would be two checkouts against one
admission), and the handshake cannot fail on it. Flagging only the shape: the bank bonus and
the freehold read are independent and could overlap, at the cost of one extra concurrent
checkout. Judgement call, not a defect.

## F15 (nit, low, arguably out of diff scope) The O(1) owner-key index the phase-05 comment deferred to THIS slice did not land

`src/sim/freehold/state.ts:199` says the roster walk in `releaseFreeholdOnLeave` is
"O(players) per leave (about 16 us at 5000, measured)" and that an owner-key to
live-session-count index "is named work for the persistence slice, which reshapes both
hooks anyway". This is that slice, and the walk is unchanged. The cost is genuinely small
(about 80 ms total across a full 5000-player logout wave), so this is a note that the
deferral is now unowned rather than a request to do it here.

## Answers to the brief's direct questions

- **Fresh-join read cost and single-flight.** Single-flight is correct: `inFlightLoads` is
  keyed by account, joined by concurrent preloads, and cleared with an identity guard
  (`server/freehold_persist.ts:565`, `:571`); `loadOnce` never rejects, so the `finally`
  always runs and the map cannot leak. The read itself is one round trip with `LIMIT 2` on a
  PK leading-prefix scan. Cost per fresh join: one permit acquire plus two serial queries
  (F14), with the admission stickiness of F6.
- **Does a second character of the same account short-circuit without database work?**
  Yes, on the normal path. `ports.hasLive` (`:553`) is checked before anything else, and on
  a lit realm the first character's `seedFreeholdOnJoin` guarantees a live record, so the
  second join returns synchronously with no row read and no hearth read, and the zero hearth
  value it returns is harmless because `installLoadedFreehold` only ever moves the clock
  forward (`:972`). The exception is F3: inside the leave-path window the same short-circuit
  fires over an UNLOADED entry and silently write-blocks the session.
- **The sweep at 1000 and 5000 online accounts.** Not acceptable as written at 5000; see F1
  for the measured table. 1000 accounts at ordinary house sizes (about 2.6 ms on a dev Mac,
  more on the production box) is tolerable but already the single most expensive thing in
  the autosave tick, and it buys one integer.
- **Can `flushAndRelease` reject and skip `sim.removePlayer`?** Not as written, no; I
  traced every arm. The real exposure is latency (F4), plus the absence of a `try`/`finally`
  that would make the guarantee structural rather than incidental.
- **Are the store's collections bounded and do they SHRINK?** `inFlightLoads`, `drainWaiters`
  and the running/pending flags are bounded and shrink correctly. `entries` does NOT shrink
  on the abandoned-handshake path (F2). Held entries shrink through the ordinary
  retain/release pair, and a hold is per-entry state rather than a separate collection.
- **Can the shutdown drain hang the restart?** No. `idle` schedules a plain `setTimeout`
  deadline, cancels it on completion, resolves `false` at the deadline, and
  `freeholdPersistIdle` swallows throws. The issues are the internal inconsistency and the
  additive budget in F7.
- **Does anything new run inside the 20 Hz loop body?** Yes: `saveFreeholds` ->
  `saveAllDirty`, entirely synchronous, O(entries x layout rows). That is F1, and it is the
  finding that matters most in this diff.
- **Is keep-forever defensible, and is the absence pin the right guard?** Yes and mostly;
  see F12.

## Clean categories

- **Shared (viewer-identical) reads.** No viewer-identical read is added. The freehold row
  and hearth reads are per-account private data, so `createCachedRead` and the
  epoch-keyed `singleFlight` do not apply; the store IS the keyed per-account cache shape,
  which is why F2 measures it against `discord_status_cache.ts`'s size bound. No moderation
  action in this diff can change what either read returns, so no bust wire is owed today (if
  a future moderation action edits `account_freeholds`, the in-memory `entry.state` and the
  live sim record will not see it and the owner will simply quiesce on the CAS; worth a
  comment when that action lands).
- **Broadcast work.** Nothing in this diff touches the snapshot, event or interest paths. No
  new per-session serialization, no payload that grows per entity per tick.
- **Hot endpoints and the WS message path.** No new REST route. The one new request-path
  cost is the handshake preload (F14/F6), which respects the existing lease and admission
  bounds. The new `WOC_FREEHOLD_PERSIST` gauge's `collect()` walks `entries` once per
  scrape, negligible. No unbounded loop over another player's data on a request path.
- **The three extractions.** `server/bot_detection_snapshot.ts` is byte-for-byte the old
  method body with the receiver changed, called from the same place at the same cadence;
  `isInJailRoom` moving to `src/sim/jail.ts` changes nothing about its per-session call;
  `server/client_perf_reports_db.ts` moves the insert and the retention batch out of
  `server/db.ts` with the prune wiring intact. No hot-path change in any of the three.
- **Retention registration mechanics.** Both DDLs carry the explicit keep-forever comment
  the seam requires, the account cascade is the removal path, and both tables ride the
  subject-access export.
