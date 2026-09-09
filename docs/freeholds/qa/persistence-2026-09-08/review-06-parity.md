## Parity / Sync Report (review-06, cross-host + IWorld drift)

**Scope:** the three sim hosts (offline browser `Sim`, authoritative server, headless RL env),
the two `IWorld` implementations, the durable-record load/save round trip, and the plot-id
charset triplication. Diff `c18facd4cc..HEAD` in
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
**IWorld members checked:** 13 (the whole `IWorldHousing` facet)
**Wire fields checked:** 0 admitted housing self keys + 8 `PersistedFreehold` fields against
13 `account_freeholds` columns
**SimEvents checked:** 1 (`freeholdDenied`); the `SimEvent` union is untouched

Verification actually run (all from the freeholds worktree):
- `npx tsc --noEmit` exit 0.
- `npx vitest run tests/architecture.test.ts tests/world_api_parity.test.ts tests/env_protocol.test.ts`
  -> `Test Files 3 passed (3)`, `Tests 530 passed (530)`.
- `npx vitest run tests/parity` -> `Test Files 12 passed (12)`, `Tests 265 passed | 1 skipped (266)`.
- `npx vitest run tests/localization_fixes.test.ts` -> `Tests 50 passed | 3 skipped (53)` (S3 green).
- The seven freehold suites individually: 87 + 21 + 48 + 76 + 15 + 23 + 23 = 293 passed.
  One batched run of those seven lost a worker (`Worker exited unexpectedly`, 217/293); two
  re-runs of the same set at `--maxWorkers=8` were clean (232/232 twice). I record it as a local
  contention flake, not a finding, because every file passes alone and the losses reproduce nowhere.

---

### The four questions I was asked

**1. Offline and headless with no persistence backend: CORRECT, confirmed.**
`persisted.ts` and `load_report.ts` have zero callers inside `src/sim/`; every caller is
`server/freehold_persist.ts`. `installLoadedFreehold` lives in `server/`, so neither the offline
`Sim` nor `headless/env_server.ts` can reach it. Both hosts still seed the default tier-0 Inn Room
through `seedFreeholdOnJoin` and evict through `releaseFreeholdOnLeave`, and
`tests/freehold_offline_default.test.ts:225` drives exactly the persistence-absent arm (a dev grant
does not reach `serializeCharacter`, and a fresh `Sim` comes back at `inn_room`). The parity gate is
green with unchanged goldens, which is the machine proof that no sim behavior moved. The
`isInJailRoom` move into `src/sim/jail.ts:73` is byte-for-byte and adds an export only.

**2. Does anything here need an IWorld member, a wire key, or a command? NO. Confirmed.**
The diff touches none of `src/world_api.ts`, `src/world_api/`, `src/net/`, `src/ui/hud.ts`,
`src/ui/sim_i18n.ts`, `src/ui/server_i18n.ts`, or `src/sim/types.ts` (verified by an empty
`git diff` over exactly those paths). `FREEHOLD_SELF_DECODERS` and `FREEHOLD_SELF_KEYS` in
`src/net/freehold_snapshot_wire.ts` are still empty, `server/game.ts`'s `wireEntity`/`selfWireJson`
gained no housing field, and `ClientWorld.myFreehold` / `freeholdLayout`
(`src/net/online.ts:1522-1523`) stay null literals. Nothing durable reaches a client. See INFO-1
for the pre-existing asymmetry this diff makes materially wider.

**3. The headless RL action-space exclusion: STILL HOLDS.**
`headless/env_server.ts:122` still passes `freeholdsEnabled: true` and nothing else about the env
changed. `src/sim/obs.ts` is untouched, so `obs_size` and `num_actions` are unmoved, and
`tests/env_protocol.test.ts:122` ("exposes no housing verb in the RL action space") passes: it pins
all ten `FREEHOLD_WIRE_COMMANDS` as absent from `ACTIONS` and additionally stem-scans for
`freehold`/`housing` with a live positive control. Nothing in this diff adds an obs field, a
reward term, or an action, so the Python NDJSON handshake is unaffected.

**4. Parity goldens and `tests/parity/harness.test.ts`: NOTHING OWED.**
No `Entity` or `PlayerMeta` field was added, so the exclusion-by-default sampler needs no decision,
and `harness.test.ts:249` already carries `freeholdOwnerKey` in `META_EXCLUDE` with its
justification (pre-existing). `tests/parity` is green with the goldens as committed, which proves
the change is behavior-preserving on the sim. The one thing I would flag for the FUTURE, not this
diff: `src/sim/freehold/CLAUDE.md` warns that `ctx.freeholds` walks in insertion order and that once
07 feeds it, that order is host-dependent. This diff is the first change that actually makes the
server's insertion order differ from the offline one (install-before-seed on the join arm). I
grepped `src/`, `server/` and `headless/` for `freeholds.values()`, `.keys()`, `.entries()`,
`.forEach` and `of ctx.freeholds`: there are ZERO iterations today, so the hazard is armed but not
tripped. The first sim-side iterator must sort by owner key.

---

### CRITICAL

None. I could not support a finding at this severity: the feature is dark
(`FREEHOLDS_ENABLED` strict `'1'`, and `server/main.ts:3821` gates the preload on it), no housing
key crosses the wire, and no sim behavior moved.

---

### WARNING (should-fix)

**W1. `retain()` can create a permanently write-dead entry, losing an account's house for a whole
session.** severity: should-fix, confidence: medium.
- `server/freehold_persist.ts:781` `retain(ownerKey)` calls `ensureEntry(ownerKey, 0)`, which builds
  an entry with `loaded: false` and `accountId: 0`. `preload()` (`:546`) is the ONLY place `loaded`
  ever becomes true. Nothing later re-runs a load for an entry that already exists, so an entry born
  in `retain` is `blocked()` (`:271`, `!entry.loaded`) forever.
- Failure scenario: account A has character X online, so the entry holds `refs: 1`. The player logs
  in as character Y (same account). `server/ws_auth.ts:474` calls `freeholdForAccount(A)` before the
  lease acquire; `preload` sees `hasLive` true and answers `state: null`. The handshake then awaits
  the lease acquire, moderation reads and the join queue. In that window the grace-expiry sweep
  fires the fire-and-forget `leave(X)`: `server/game.ts:3904` `flushAndRelease` drops `refs` 1 to 0
  and `maybeRemove` (`:305`) deletes the entry, and `removePlayer` evicts the record from
  `ctx.freeholds` because Y is not on the roster yet. Y's `join()` then runs
  `installLoadedFreehold` (a no-op, `state` is null) and `retain`, which creates the unloaded entry.
  Y is seeded a fresh default Inn Room, and because the entry is blocked, `markDirty`, `save`,
  `saveAllDirty` and `flushAndRelease` all write nothing for Y's whole session. The durable row is
  not overwritten (fail-closed works), so this is a "your house is gone until you relog" bug rather
  than data loss.
- The `linkdeadOthers` loop at `server/game.ts:3284` handles the swap where the old session is still
  present at join time; it does not cover the sweep landing in the preload-to-retain gap.
- Not covered by a test: `tests/server/freehold_persist.test.ts` calls `retain` eleven times, always
  on an entry a `preload` already created, and `:1258` pins only the source ORDER of install / retain
  / addPlayer.
- Two shapes of fix, either works: have `retain` refuse to create an entry it did not load (and have
  `join()` treat a missing entry as a re-preload), or have `preload` take the reference itself so the
  entry cannot reach `refs: 0` between the read and the join.

**W2. The write path enforces neither the byte ceiling nor the row-count ceilings the load path
refuses on, so this realm can write a row it will then refuse forever.** severity: should-fix,
confidence: high (mechanism), low (reachability today).
- `runWrite` (`server/freehold_persist.ts:614-654`) serializes the live record and calls
  `ports.writeRow` with no size check. It even measures the bytes at `:641`
  (`counters.lastWriteBytes`) and uses them only for a metric. `persistedFreeholdBytes`,
  `FREEHOLD_MAX_LAYOUT_ROWS` and `FREEHOLD_MAX_TROPHY_ROWS` are exported from
  `src/sim/freehold/persisted.ts` and have NO production caller: the import block at
  `server/freehold_persist.ts:35-42` takes `FREEHOLD_MAX_OWNED_BYTES` for the READ only.
- Failure scenario: a later phase (08 placement, 17 trophies) lets a live record grow past
  104,448 bytes, or a furnishing id is authored with multi-byte characters (the ceiling comment at
  `persisted.ts:107` explicitly says a legal-by-length id can be illegal by bytes). The write
  succeeds, the player logs out, and the NEXT load answers `oversize`, which write-blocks that
  account permanently and leaves the owner in a default Inn Room every session from then on. The
  preservation design is meant to make an unreadable row a recovery case, not a case this realm
  manufactures itself.
- Fix: call `persistedFreeholdBytes(persisted)` and check the two row counts in `runWrite` before
  `writeRow`, and refuse the write (hold the entry) rather than producing an unreadable row.

**W3. `normalizeFreehold` admits scalars that `requireUpsertInput` refuses, so a load that succeeds
can make every subsequent write throw.** severity: should-fix, confidence: high (mechanism), low
(reachability today).
- `src/sim/freehold/persisted.ts:394-404` clamps `condition` into 0..100 with `finiteNumber` only
  (a FRACTIONAL 47.5 is admitted unrepaired) and accepts `rev` on `Number.isInteger(rawRev) &&
  rawRev >= 0`, which admits values far above `Number.MAX_SAFE_INTEGER`.
  `server/freehold_db.ts:409` and `:412` demand `Number.isSafeInteger` for both and throw a
  `TypeError` otherwise.
- Failure scenario: 13's upkeep code writes a fractional `condition` into the live record (a decay
  rate times elapsed days is the obvious producer). The load admits it, the record installs, and
  every write from then on throws inside `runWrite`. `launch`'s `.catch`
  (`server/freehold_persist.ts:686`) swallows it and returns `committed: false`, so the entry never
  re-arms and the account silently stops persisting while logging one error per sweep. Nothing about
  this is visible to the player.
- Today the durable path cannot produce either value (`condition SMALLINT` at
  `server/freehold_db.ts:94`, `wire_rev BIGINT` at `:90`, and a `rev` above 2^53 needs 9e15 writes),
  so this is a trap set for the next phase rather than a live defect.
- Fix: make `condition` and `rev` `Number.isSafeInteger` checks in `normalizeFreehold` and repair
  them (both are already on the sanctioned `FreeholdRepairedField` list), so the leaf's admission
  policy and the writer's validation are the same predicate.

**W4. The live sim record and the durable row disagree on `plotId` for the whole first session.**
severity: should-fix, confidence: high.
- On the absent arm, `server/freehold_persist.ts:411` mints a real id
  (`entry.plotId = ports.mintPlotId()`), and `runWrite:645` writes `entry.plotId`, NOT
  `persisted.plotId`. Meanwhile `installLoadedFreehold` returns early for `state === null`
  (`:963`), so `addPlayer`'s seed leaves the live record at
  `PENDING_FREEHOLD_PLOT_ID` (`src/sim/freehold/state.ts:34`, the literal `'plot:unassigned'`).
  No code path ever stamps the minted id onto the live record.
- Failure scenario, when 08a lands the producer: `myFreeholdView` publishes `plot:unassigned` for
  every account in its first session while the row on disk says `plot:9f3a1c`. The client echoes
  `this.myFreehold?.plotId` back on every build-presence frame (`src/net/online.ts:4376`), so the
  server compares `plot:unassigned` against the real id and refuses forever with no diagnostic.
  Separately, every fresh account in the realm reports the SAME public plot identity in memory,
  which defeats the opaque-per-plot identity the brand in `src/sim/freehold/types.ts:18` exists to
  protect.
- `tests/server/freehold_persist.test.ts:1209` pins the load-once behavior but no test asserts that
  a fresh account's live record ends up carrying the minted id.
- Fix: on the absent arm, install the minted plot id into the live record (or return it in
  `LoadedFreehold` and have `installLoadedFreehold` stamp it before the seed).

**W5. `load_report.ts` has no production caller: the module is dead in the shipping path.**
severity: should-fix, confidence: high.
- `warnFreeholdLoad` and `freeholdLoadDiagnostic` (`src/sim/freehold/load_report.ts:71, :105`) are
  referenced only by the barrel, `tests/freehold_state.test.ts` and the localization scan. The
  server instead hand-rolls its own strings: the repaired line at
  `server/freehold_persist.ts:452-455` and the `detail` composition at `:476-489`.
- Consequence: the `boundedDetail` positive-shape guard, which the file's header calls "the only
  thing standing between a corrupt row and a log", protects nothing in production, and the
  round-trip arm at `tests/freehold_state.test.ts:937` that is supposed to catch a widened producer
  guards a function nobody calls. The server path is safe TODAY only because every `detail`
  `normalizeFreehold` produces is already a fixed word or a bounded number; a future producer that
  echoes a row string reaches `console.warn` with nothing in the way.
- This is a genuine drift between the documented source of truth (the sim leaf owns the bounded
  classification vocabulary) and the mirror (the server formats its own).
- Fix: route the two server sites through `freeholdLoadDiagnostic`, or delete `load_report.ts` and
  move the bound into `freehold_persist.ts`. Either is fine; having both shapes is the problem.

**W6. `advanceFreeholdHearthOnClient` has no caller, so the durable Hearth clock never advances.**
severity: should-fix, confidence: high (fact), medium (whether it is deliberate).
- `server/freehold_hearth_db.ts:199` exports it and `tests/server/freehold_hearth_db.test.ts` drives
  48 tests over it, but nothing in `server/` calls it. `useHearthKey`
  (`src/sim/freehold/hearth_key.ts:34`) advances only the in-memory
  `ctx.freeholdKeyReadyAtMs`.
- Consequence: `ready_at_ms` stays 0 forever, so the read half wired here
  (`installLoadedFreehold:966-972`) is a no-op in practice, and the "ONE online authority" contract
  is only half-built. Across a realm restart the cooldown is lost, which is exactly the bypass the
  account-level clock exists to close (`server/freehold_hearth_db.ts:74-79` says so explicitly).
- I cannot tell from the diff whether the write half is deliberately deferred to a later phase. If
  it is, say so in `docs/freeholds/persistence-rollout-contract.md`, because the current text reads
  as though the authority is complete.

**W7. A write-blocked (held) account gets no durable Hearth clock at all.** severity: should-fix,
confidence: high.
- `installLoadedFreehold` returns before the hearth merge whenever `loaded.hold !== null`
  (`server/freehold_persist.ts:963`).
- Failure scenario (once W6 is wired): an account whose plot row is malformed or oversize is
  write-blocked, which is correct for the PLOT, but it also silently starts every session with a
  cold Hearth cooldown. The cooldown is account state in a different table and has nothing to do
  with the plot row's integrity, so a corrupt plot row should not hand out free travel.
- Fix: split the hearth merge out of the `hold` early-return; only the `state` install belongs
  behind it.

---

### INFO

**INFO-1. `myFreehold` / `freeholdLayout` are asymmetric between the two worlds, and this diff makes
that asymmetry cover real content.** Pre-existing and deliberate, not a regression.
`Sim.myFreehold` (`src/sim/sim.ts:11627`) returns a real `FreeholdView` off `ctx.freeholds`, while
`ClientWorld.myFreehold` (`src/net/online.ts:1522`) is a null literal that nothing assigns. Before
this change both worlds held only a default record so the gap was cosmetic; after it, the server's
record can carry a real tier, layout and trophies that no online consumer can see. Documented as
intended at `src/world_api/housing.ts:17-22` and `src/net/freehold_snapshot_wire.ts:10-17`, and
`tests/world_api_parity.test.ts` is green because both worlds declare the member. Recording it so
the 08a producer knows the gap is now load-bearing rather than empty.

**INFO-2. `ctx.freeholdKeyReadyAtMs` gains a new writer with no eviction.**
`evictFreehold` (`src/sim/freehold/state.ts:141`) deletes only from `ctx.freeholds`; the hearth map
is never pruned. Before this diff the map only grew when a player actually used a Hearth Key;
`installLoadedFreehold:972` now writes it on the join path. It is bounded by distinct accounts per
realm lifetime with a short string key and a number, so I am not calling it a leak worth fixing, but
it IS a per-host asymmetry (offline and headless never populate it this way) and it is the reason
the in-memory cooldown survives a relog within one process. Worth one line in the contract doc.

**INFO-3. `ABSENT_HEARTH_REVISION` is a fourth deliberate literal copy.**
`server/freehold_persist.ts:89` duplicates `ABSENT_FREEHOLD_HEARTH.revision`
(`server/freehold_hearth_db.ts:40`) so a fake port bag needs no database module. The comment states
the reason and I agree with it; no test pins the two together, but a divergence would red the
persist suite's fixtures immediately, so I am not raising it.

---

### The drift risk I was asked to judge explicitly: the plot-id charset

There are FOUR live copies of one contract, not three, plus a fifth in a test:

| # | Where | Exact form | Pinned by |
|---|-------|-----------|-----------|
| 1 | `src/sim/freehold/persisted.ts:124` `FREEHOLD_PLOT_ID_SHAPE` | `/^[A-Za-z0-9_:-]{1,64}$/` | **NOTHING cross-pins it.** Behavioral arms only: `tests/freehold_state.test.ts:192-199` (missing, non-string, `plot/`, empty, 65 chars) |
| 2 | `server/freehold_wire.ts:153-154` `OPAQUE_ID_RE` + `OPAQUE_ID_MAX_LEN` | `/^[A-Za-z0-9_:-]+$/` with a separate `length <= 64` | `tests/freehold_module.test.ts:336-337`, a SOURCE-TEXT pin against a fresh literal |
| 3 | `server/freehold_db.ts:40` `FREEHOLD_PLOT_ID_RE` | `/^[A-Za-z0-9_:-]{1,64}$/` | `tests/server/freehold_db.test.ts:151`, a `.source` pin against an independent literal |
| 4 | `server/freehold_db.ts:112-113` the DDL `CHECK (plot_id ~ ...)` | `'^[A-Za-z0-9_:-]{1,64}$'` | `tests/server/freehold_db.test.ts:116` (DDL text) and `freehold_db.pg.test.ts:201, 231, 236` (live 23514) |
| 5 | `tests/freehold_offline_default.test.ts:35` `WIRE_PLOT_ID` | `/^[A-Za-z0-9_:-]{1,64}$/` | it IS a pin, on the seeded default only |

**What catches a divergence today:** each of copies 2, 3 and 4 is pinned to its OWN independent
literal. Copy 1, the new one this diff adds, is pinned to nothing but its own behavior.

**What that misses, concretely.** The dangerous direction is widening. Suppose a later phase needs a
`.` in a plot id (a tenant suffix, a shard tag). The author widens copies 2, 3 and 4. Three tests go
red, each naming its own literal, and the author updates all three literals. Nothing anywhere
mentions `src/sim/freehold/persisted.ts`, and `tests/freehold_state.test.ts` stays green because its
negative fixture is `plot/9f3a1c`, a slash, not a dot. The result: the wire admits the id, the DDL
stores it, `mintFreeholdPlotId` produces it, and then `normalizeFreehold` answers
`malformed('plot_id_shape')` on every load. Every account minted after the widening is
write-blocked forever, its house invisible, and the only symptom is a `console.warn` line. That is
precisely the failure mode the whole preservation design exists to avoid, arriving through the one
copy nobody pinned.

The narrowing direction is nearly as bad in reverse: narrow copy 1 alone and existing minted ids
start refusing on load, again with only a log line.

**What SHOULD catch it.** Two options, and I would take the second:
1. Cheap: add an arm to the existing cross-pin at `tests/freehold_module.test.ts:327` that also
   reads `src/sim/freehold/persisted.ts` and asserts the literal
   `const FREEHOLD_PLOT_ID_SHAPE = /^[A-Za-z0-9_:-]{1,64}$/;`, alongside the two it already checks.
   That test is already the declared home of this contract ("Pin the charset here, against a fresh
   literal and a source read, so widening one side without the other reds"); it just does not know
   copy 1 exists. One line, and it makes all four move together or none.
2. Structural, and the one the file's own design already points at: `normalizeFreehold` takes
   `validTierIds` and `validVisitPolicies` as VALUES precisely so the leaf owns no content policy
   (`NormalizeFreeholdOptions`, `persisted.ts:198`). The plot-id charset is the same kind of
   caller-side fact. Add `plotIdShape: RegExp` to `NormalizeFreeholdOptions` and have
   `createGameFreeholdPersistStore` (`:997`) pass `FREEHOLD_PLOT_ID_RE`. Copy 1 disappears by
   construction, the sim leaf's unit tests supply their own regex exactly as they supply their own
   tier set, and the remaining three copies keep their existing pins. This is the option that
   matches the file's stated doctrine rather than adding a fourth pin to a fourth copy.

The header comment at `persisted.ts:117-123` says the literal is held "rather than built from
FREEHOLD_MAX_ID_LENGTH so it reads exactly like its two siblings". That reasoning acknowledges the
duplication and then does not guard it, which is the gap.

Note also that `FREEHOLD_MAX_ID_LENGTH = 64` (`persisted.ts:87`), `FREEHOLD_PLOT_ID_MAX_LEN = 64`
(`freehold_db.ts:34`) and `OPAQUE_ID_MAX_LEN = 64` (`freehold_wire.ts:152`) are three more copies of
one number. Copies 2 and 3 are source-pinned; copy 1 is not. Whichever fix you take for the charset
should cover the length with it.

---

### Could a durable record loaded on one host produce different sim behavior on another?

No, with one caveat I could not close.

- The admission sets are the SIM's own. `createGameFreeholdPersistStore:998-1000` passes
  `FREEHOLD_TIER_IDS` (`src/sim/content/freehold.ts`) and `FREEHOLD_VISIT_POLICIES`
  (`src/sim/freehold/types.ts:54`), so the two `as FreeholdTier` / `as FreeholdVisitPolicy` casts in
  `freeholdStateFromPersisted:489, 494` can only ever hold identities the sim's own unions name.
  A server-only tier could not be smuggled in.
- `freeholdStateFromPersisted:491-493` explicitly zeroes `conditionStampDay`,
  `ledgerPaidThroughDay` and `ledgerPrepaidWeeks` and sets `isDecorating: false`, so a loaded record
  cannot fabricate calendar history that the offline host would never produce. That is contract 8
  and it holds as written.
- No sim code branches on `plotId`, and no sim code iterates `ctx.freeholds`, so neither the
  host-dependent minted id nor the host-dependent map order can fork a seed today.
- The realm and the sim read the SAME flag: `server/sim_boot_config.ts:51` and
  `server/main.ts:3821` both call `freeholdsEnabled(process.env)`, so the preload and the sim's
  `ctx.freeholdsEnabled` cannot disagree.
- The caveat: the loaded `tier` chooses the dungeon in `enterFreehold` via `freeholdDefForTier`, so
  an online player with a durable `cottage` enters a different instance than an offline player at
  `inn_room`. That is persistence doing its job (a different input, not a different rule) and it
  rides the existing entity/instance wire, so it needs no new key. Recording it so nobody later
  reads it as drift.

---

### PASSED

- IWorld: all 13 `IWorldHousing` members present and same-kind on both worlds;
  `tests/world_api_parity.test.ts` green; the facet and the `IWORLD_MEMBERS` pin are untouched, which
  is correct because this diff adds no member.
- Wire protocol: zero housing keys encoded and zero decoded. `FREEHOLD_SELF_KEYS` is still `[]` and
  `wireEntity` / `selfWireJson` gained no field, so there is no encode-without-decode or
  decode-without-encode to find.
- Commands: no `cmd({...})` sender added, no dispatch arm added. The ten housing tokens are unchanged
  on both sides.
- SimEvents: the `SimEvent` union (`src/sim/types.ts`) is untouched, so `src/ui/hud.ts` owes nothing.
- i18n: `tests/localization_fixes.test.ts` green (50 passed, 3 skipped), and both new sim modules are
  registered in the S3 scan list (`tests/localization_fixes.test.ts:1425-1426`), which is the
  same-change obligation met. Every new string in this diff is `console.warn` / `console.error`
  dev-channel English, so no matcher entry is owed.
- Determinism: `tests/architecture.test.ts` green. No `Math.random`, `Date.now` or
  `performance.now` under `src/sim/`; `persisted.ts` and `load_report.ts` import only `./types` and
  each other; `nowMs: Date.now` is injected as a PORT in `server/`, never in the sim.
- Contracts 2 and 6 from the brief, spot-checked and holding: install-before-seed is real and
  source-pinned (`server/game.ts:3287-3294`, `tests/server/freehold_persist.test.ts:1258`), and both
  tables are absent from the retention sweep with the reasoning written at `server/main.ts:3986-3996`
  and pinned by `tests/server/main_retention_wiring.test.ts`.

---

### Comparison tables

#### IWorld parity: IWorldHousing (13 members, all unchanged by this diff)

| Member | In IWorld | Sim impl | ClientWorld impl | Server handler | Status |
|--------|-----------|----------|------------------|----------------|--------|
| myFreehold | housing.ts:32 | sim.ts:11627 (real view) | online.ts:1522 (null literal) | none (no wire key) | ASYMMETRIC, pre-existing, INFO-1 |
| freeholdLayout | housing.ts:37 | sim.ts:11631 (real view) | online.ts:1523 (null literal) | none (no wire key) | ASYMMETRIC, pre-existing, INFO-1 |
| housingNowMs | housing.ts:44 | sim.ts:11635 | online.ts | n/a | MATCH |
| freeholdEnter | housing.ts:49 | sim.ts:11639 | online.ts:4342 | game.ts dispatch (live) | MATCH |
| freeholdLeave | housing.ts:50 | sim.ts:11643 | online.ts:4345 | game.ts dispatch (live) | MATCH |
| placeFurnishing | housing.ts:55 | sim.ts | online.ts | dark no-op | MATCH (both dark) |
| moveFurnishing | housing.ts:59 | sim.ts | online.ts | dark no-op | MATCH (both dark) |
| removeFurnishing | housing.ts:63 | sim.ts | online.ts | dark no-op | MATCH (both dark) |
| undoPlacement | housing.ts:67 | sim.ts | online.ts | dark no-op | MATCH (both dark) |
| redoPlacement | housing.ts:68 | sim.ts | online.ts | dark no-op | MATCH (both dark) |
| payLedger | housing.ts:72 | sim.ts | online.ts | dark no-op | MATCH (both dark) |
| setVisitPolicy | housing.ts:76 | sim.ts | online.ts:4366 | dark no-op | MATCH (both dark) |
| setFreeholdBuildPresence | housing.ts:81 | sim.ts | online.ts:4372 | dark no-op | MATCH (both dark) |

#### Durable round trip: PersistedFreehold field vs column vs re-read

| Field | Written by runWrite (persist.ts:642-653) | Column (freehold_db.ts) | Re-read by rowDocument (persist.ts:374-392) | Status |
|-------|------------------------------------------|-------------------------|---------------------------------------------|--------|
| version | not sent (column default 1) | `schema_version INT` :88 | `version: row.schemaVersion` | MATCH |
| plotId | `entry.plotId`, NOT `persisted.plotId` | `plot_id TEXT` :87 | `plotId: row.plotId` | **DRIFT, see W4** |
| tier | `persisted.tier` | `tier TEXT` :91 | `tier: row.tier` | MATCH |
| layout | `JSON.stringify(persisted.layout)` | `layout JSONB` :92 | `layout: row.layout` | MATCH |
| trophies | `JSON.stringify(persisted.trophies)` | `trophies JSONB` :93 | `trophies: row.trophies` | MATCH |
| condition | `persisted.condition` | `condition SMALLINT` :94 | `condition: row.condition` | **admit/refuse gap, W3** |
| visitPolicy | `persisted.visitPolicy` | `visit_policy TEXT` :95 | `visitPolicy: row.visitPolicy` | MATCH |
| rev | `wireRev: persisted.rev` | `wire_rev BIGINT` :90 | `rev: Number(row.wireRev)` | **admit/refuse gap, W3** |
| (fence) | `expectedDurableRev: entry.durableRev` | `durable_rev BIGINT` :89 | `entry.durableRev = row.durableRev` | MATCH |
| (unwritten) | never sent | `upkeep_binding` / `upkeep_checkpoint` / `upkeep_credit` :96-98 | not read | MATCH (contract 8, deliberate) |
| (size) | UNCHECKED at write | n/a | `FREEHOLD_MAX_OWNED_BYTES` at read | **ASYMMETRIC, see W2** |

#### The plot-id charset: four live copies, one unpinned

See the dedicated table in "The drift risk I was asked to judge explicitly" above.

#### Host surface: what each host holds

| | offline `Sim` | server | headless env |
|---|---|---|---|
| housing module present | yes | yes | yes |
| `freeholdsEnabled` | opt-in (`main.ts` / test fixtures) | `freeholdsEnabled(process.env)`, dark by default | hardcoded true (env_server.ts:122) |
| persistence backend | none | `freehold_persist` + 2 tables | none |
| record source | `seedFreeholdOnJoin` default only | `installLoadedFreehold` then the seed | `seedFreeholdOnJoin` default only |
| plot id | `plot:unassigned` (shared) | minted per account on disk, `plot:unassigned` live in session 1 (W4) | `plot:unassigned` (shared) |
| hearth clock | in-memory only | in-memory, durable read wired, durable write NOT wired (W6) | in-memory only |
| RL actions | n/a | n/a | zero housing verbs, pinned |
