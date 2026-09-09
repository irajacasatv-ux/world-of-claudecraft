# Review 05: determinism, tick phase, SimContext seam, sim purity, move-not-rewrite

All three extractions are clean MOVES (one is byte-identical by `diff`, two differ only in the
receiver/parameter change the brief named). No rng draw, no tick phase and no SimContext callback
was touched. Five should-fix findings, all in the new persistence wiring, none of them a
determinism break.

## Gates (run in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds)

| Gate | Result |
|---|---|
| `npx vitest run tests/parity` | PASS: 12 files, 265 passed, 1 skipped |
| `npx vitest run tests/architecture.test.ts` | PASS: 113 passed |
| `npx tsc --noEmit` | PASS (exit 0) |
| freehold + extraction units (8 files) | PASS: 260 passed |
| wiring + budget (8 files) | PASS: 338 passed |
| biome over the 42 changed `.ts` | 0 errors, 77 warnings (the known-red warning class) |

No parity fixture, golden trace or draw-order digest appears anywhere in
`git diff --name-only c18facd4cc..HEAD`, so the parity pass is against the unmodified digest.

Monolith counts measured (the brief asked for the numbers, not a finding):
`server/game.ts` 9978 lines against a 9983 ceiling; `server/db.ts` 4605 against 4744;
`src/sim/sim.ts` 11737 against 11737 (untouched by this diff).

## Move-not-rewrite: all three clean

1. `server/client_perf_reports_db.ts`. `git show c18facd4cc:server/db.ts | sed -n '4113,4277p'`
   diffed against `sed -n '20,184p' server/client_perf_reports_db.ts` returns EMPTY: 165 lines
   byte-identical, including the 51-placeholder INSERT, the parameter array order, the
   `JSON.stringify(row.rawSummary)` position, and the prune batch's `Number.isFinite` guard and
   `Math.max(1, Math.floor(...))` clamps. The only additions are the file header and
   `import { pool } from './db'`. `server/db.ts:4125-4137` re-exports the type and all five names,
   so no caller re-points. The db.ts <-> client_perf_reports_db.ts import cycle matches the existing
   `server/character_lease_db.ts:19` precedent exactly (same `import { pool } from './db'`, same
   dereference-inside-function-bodies-only discipline), so the partial-evaluation hazard is the one
   the repo already accepts.

2. `server/bot_detection_snapshot.ts`. Body identical field for field and in the same order
   (`capturedAt`, `simTime`, x, z, facing, dead, inCombat, targetId, instanceSlot,
   instanceDungeonId, level, classId, hp, maxHp, resource, maxResource, resourceType, autoAttack,
   followTargetId, moveSpeed, onGround), same `if (!e) return null` early arm, same
   `sim.instanceInfoAt(e.pos)` call and same `?? null` coalescing. The two changes the brief named
   are both behavior-preserving: `this.sim` becomes the injected `sim`, and `session: ClientSession`
   becomes `pid: number` where the sole caller (`server/game.ts:3167`) passed `session.pid` before
   and passes `session.pid` now. `SessionRuntimeSnapshot` was correctly dropped from game.ts's
   import list. `BotDetectionSnapshotSim = Pick<Sim, 'entities' | 'instanceInfoAt' | 'time'>` names
   `Sim` type-only from a `server/` file, which the sim-side no-Sim-import scan does not cover and
   does not need to.

3. `isInJailRoom` into `src/sim/jail.ts:78`. Body byte-identical, `private` dropped, planted
   directly beside `isInJailCage` which reads the same `JAIL_CENTER` with the cage half-extent.
   Sole caller `server/game.ts:2718` moved from `this.isInJailRoom(entity.pos)` to
   `isInJailRoom(entity.pos)`; `JAIL_CENTER`/`JAIL_OUTER_HALF` came out of game.ts's jail import and
   `isInJailRoom` went in. `tests/moderation_game.test.ts:1049-1050` pins both the new call form and
   the absence of `private isInJailRoom`, and adds direct boundary arms at
   `JAIL_OUTER_HALF` and `JAIL_OUTER_HALF + 0.01`.

## Findings

`[SHOULD-FIX] (confidence: high)` **server/freehold_persist.ts:964** - `installLoadedFreehold`
returns before the Hearth block for BOTH a hold and an absent plot row
(`if (!loaded || loaded.hold !== null || loaded.state === null) return;`), discarding a durable
Hearth clock the store deliberately read and carried. `classify` reads the hearth unconditionally
(:401) and `holdResult` puts `hearthReadyAtMs` on the hold result (:347), and the cooldown is
ACCOUNT state in its own table, independent of the plot row. **Failure scenario** (reachable the
moment 07a wires the advance): account 42's plot row is forward/malformed/oversize, so every join
answers a hold, while `account_freehold_hearth.ready_at_ms` sits 40 minutes out. The install returns
early, `ctx.freeholdKeyReadyAtMs` stays 0, and every character on that account reads a ready Hearth
Key on every relog - precisely the "hand every character on that account a free ready key" outcome
`server/main.ts:3995` says the table exists to prevent. Same shape for an account that has a hearth
row and no plot row yet. **Fix**: run the forward-only merge at :967-972 unconditionally and gate
only the `loadFreehold` call on `hold === null && state !== null`; add a persist-store arm that
holds a plot and still restores the clock.

`[SHOULD-FIX] (confidence: high on the path, medium on the window)`
**server/freehold_persist.ts:561-564** - the `preload` replay arm tests `entry.hold === null` where
every other write decision uses `blocked()`/`isHeld()` (:267-271), and `quiesced` is a separate flag
that `applyWriteResult` sets at :596 and :606 without ever setting `hold`. `snapshotOf` (:324) then
reports `hold: entry.hold`, i.e. null. **Failure scenario**: another realm process writes account
42's row, this realm's CAS comes back `stale`, the entry quiesces with `entry.state` frozen at the
pre-quiesce document. The last character leaves; `flushAndRelease` sees `blocked` and flushes
nothing, `refs` reaches 0, but a write is still `running`/`pending` so `maybeRemove` keeps the
entry; `removePlayer` then evicts the live record. The player reconnects inside that window:
`preload` takes the replay arm and answers `state = <stale document>, hold = null`, so
`installLoadedFreehold` installs a house several revisions behind as the live record. The player
decorates in the wrong house for that session and every edit is silently dropped (writes stay
blocked). The durable row is never harmed. **Fix**: use `blocked(entry)` in the replay arm and
synthesize a hold when `entry.quiesced`.

`[SHOULD-FIX] (confidence: high)` **src/sim/freehold/load_report.ts:71,105** - neither
`freeholdLoadDiagnostic` nor `warnFreeholdLoad` has a production caller. The only importers are the
barrel (`src/sim/freehold/index.ts:41-42`) and `tests/freehold_state.test.ts:19`. The actual load
site hand-builds its own operator text and never routes it through `boundedDetail`:
`server/freehold_persist.ts:338` (`holdResult`), `:456` (the repair line), `:599` and `:608`
(`applyWriteResult`). `docs/freeholds/persistence-rollout-contract.md:149-151` states the opposite
("Operator diagnostics go through `freeholdLoadDiagnostic` and `warnFreeholdLoad`"). **Failure
scenario**: nothing leaks today, because every detail that reaches those strings currently
originates in persisted.ts's or freehold_db.ts's bounded vocabulary. The defect is that the guard is
unwired, so it is one edit away: `applyWriteResult:607` already prints `result.detail` from the
`conflict` arm verbatim, and any future widening of a `FreeholdRecoveryHold.detail` producer (an
echoed `plot_id`, a driver error message) reaches the operator log with nothing in between. **Fix**:
route `holdResult`/`applyWriteResult` details through `freeholdLoadDiagnostic`, or delete the module
plus its three barrel exports and correct section 4 of the contract.

`[SHOULD-FIX] (confidence: high)` **src/sim/freehold/types.ts:50-51** -
`const VISIT_POLICIES = new Set<string>(['closed', 'friends', 'open'])` duplicates the
`FreeholdVisitPolicy` union declared three lines above it, with no compile-time link and no test
pin (grep: the only non-barrel consumer is `server/freehold_persist.ts:1000`). The stated model,
`FREEHOLD_TIER_IDS` at `src/sim/content/freehold/tiers.ts:25`, is DERIVED
(`new Set(FREEHOLD_TIERS.map((tier) => tier.id))`) and therefore cannot drift; this one can.
**Failure scenario**: a later phase adds `'guild'` to the union and ships the wire plus
`setVisitPolicy`. `tsc` stays green, the plot saves fine (the DDL check is shape-only,
`server/freehold_db.ts:130`). On the next login `normalizeFreehold` (`persisted.ts:368`) answers
`unsupported: visit_policy`, the store installs a permanent hold, and every account that used the
new policy goes read-only and write-blocked until an operator notices. **Fix**: derive both from one
source, `export const FREEHOLD_VISIT_POLICY_IDS = ['closed','friends','open'] as const;` plus
`export type FreeholdVisitPolicy = (typeof FREEHOLD_VISIT_POLICY_IDS)[number];`, and build the
frozen facade over that; or add an exhaustiveness pin
(`const _: Record<FreeholdVisitPolicy, true> = { closed: true, friends: true, open: true };`).

`[SHOULD-FIX] (confidence: high on the divergence, low on live impact)`
**server/freehold_persist.ts:969-972 vs src/sim/freehold/CLAUDE.md:75-77** - a server module is now
the second writer of `ctx.freeholdKeyReadyAtMs`, and the sim's own doc paragraph still says the map
is "read against `lockoutNowMs` only on commands and updated only after successful remote entry".
The diff edited two other bullets of that file and left this one. The forward-only merge rule is now
implemented twice: `Math.max(readyAt, now + HEARTH_KEY_COOLDOWN_MS)` in
`src/sim/freehold/hearth_key.ts:34` and `if (readyAtMs > liveReadyAtMs)` in the server module, so
the two can drift. There is no live bug today because the write is unreachable (see Note 1), and the
sibling rule this file states for `ctx.freeholds` and `tier` IS honored:
`installLoadedFreehold:966` goes through `loadFreehold`, and `setFreeholdTier` remains the sole tier
writer (`tests/freehold_dev_grant.test.ts:355` source scan green). **Fix**: add a sim-side writer
(`loadHearthReadyAt(ctx, ownerKey, readyAtMs)` in `hearth_key.ts` or `state.ts`) the server calls,
and update the CLAUDE.md paragraph in the same change.

`[NOTE] (confidence: high)` **advanceFreeholdHearthOnClient has no production caller.** Grep across
`server/`, `src/` and `headless/` finds it only in `tests/server/freehold_hearth_db*.test.ts`; and
`server/sim_boot_config.ts:54` still binds `freeholdKeyAdmission: () => false`, so on the server
`useHearthKey` (`hearth_key.ts:28`) denies `busy` before it ever reads the clock. The whole hearth
read-and-install path is therefore dead on the online host today. The rollout contract records this
for the incapable-release case (line 120), but section 2 item 4 (lines 74-76) lists honoring the
authority "through `loadFreeholdHearth` and `advanceFreeholdHearthOnClient`" as a CAPABILITY
requirement with no deferred-to-07a marker, so no build cut from this tree can satisfy its own
capability test. The section is explicitly forward-looking, so this may be deliberate; if it is, a
one-line marker on item 4 would say so.

`[NOTE] (confidence: high)` **src/sim/freehold/index.ts:39-60** - the barrel gains 12 names from
`persisted.ts` and 3 from `load_report.ts`, of which exactly one (`persistedFreeholdFromState`) has
a barrel consumer (`tests/freehold_dev_grant.test.ts:21`). The production consumer,
`server/freehold_persist.ts:35-44`, imports from the files directly. The directory's own stated
policy sits eight lines below the addition ("applyFreeholdOwnerStamp stays OFF the barrel:
`seedFreeholdOnJoin` is its one caller and the direct tests import state.ts, so no consumer outside
the module needs it"). Not a defect; a public-surface call for the parent.

`[NOTE] (confidence: medium)` **A host-minted plot id becomes sim state on the second session.**
`mintFreeholdPlotId` (`server/freehold_db.ts:507`) draws host randomness; the id lands in the row's
`plot_id` column, and on the NEXT login `freeholdStateFromPersisted` (`persisted.ts:486`) writes it
into the live `FreeholdState.plotId`, while offline and headless always carry
`PENDING_FREEHOLD_PLOT_ID`. Nothing in `src/sim/` branches on `plotId` today (`instance.ts`,
`gate.ts` and `hearth_key.ts` all key on the OWNER key; `myFreeholdView` returns null), so there is
no host fork now, and the parity gate structurally cannot see one because no offline record ever
loads a durable row. Worth one line in `src/sim/freehold/CLAUDE.md` saying `plotId` is
presentation-only and must never gate sim behavior. The store side is correct as written:
`runWrite:645` writes `entry.plotId`, not `persisted.plotId`, so the sim's `plot:unassigned` never
reaches the row.

`[NOTE] (confidence: low)` **server/game.ts:3293** - the `retain` is not inside a try/finally. Any
throw between it and `return session` (for instance `reconcileWornMechChromaForJoin` at :3331 or the
bank-ledger journal construction) leaks a reference: the entry can never satisfy `maybeRemove`
(`refs > 0` forever), so it stays in `entries` and in the `woc_freehold_persist{measure="entries"}`
gauge for the process lifetime. No wrong write results (once the record is evicted `ports.serialize`
answers null and `runWrite:638` skips), so the cost is a slow map leak plus a misleading gauge. I
found no call on that stretch that plausibly throws, hence low confidence.

## Coverage: invariants checked and found clean

- **No findings in RNG draw-order.** `src/sim/sim.ts`, `src/sim/sim_context.ts` and every
  tick-phase module are absent from `git diff --name-only c18facd4cc..HEAD`. The two new sim files
  draw nothing: pinned by `tests/freehold_module.test.ts`'s directory scan for
  `/Math\.random|Date\.now|performance\.now|\.rng\b/` (which carries an anti-vacuity assertion that
  the comment stripper left real code behind), and confirmed by my own grep. Parity is green against
  an unmodified digest.
- **No findings in tick-phase order.** No `lap?.()` marker moved, no `tick*`/`update*` call was
  relocated, and the inline `engagedPids` pass is untouched, because `sim.ts` is not in the diff at
  all. The new server work rides the periodic-save flush (`saveFreeholds` appended to
  `PERIODIC_SAVE_WRITE_NAMES`) and the shutdown closure, neither of which is a sim tick phase.
- **No findings in shared entry points.** None was relocated: `meleeSwing`, `mobSwing`,
  `updateRangedPetAttack`, `pulseGroundAoE`, `applyTaunt` and their delegates are outside the diff.
- **No findings in the SimContext contract.** No callback was added, renamed or repurposed
  (`sim_context.ts` untouched). `server/freehold_persist.ts` consumes `SimContext` as a parameter,
  which is the sanctioned direction, and does not import `Sim`. The one contract concern is the
  second `freeholdKeyReadyAtMs` writer above.
- **No findings in `src/sim` purity.** `tests/architecture.test.ts` is green over both new files;
  `tests/freehold_module.test.ts` adds a directory-local scan for clocks, rng and a concrete `Sim`
  import that also covers them; my own grep found no `Math.random`, `Date.now`, `performance.now`,
  `process.`, `require(`, `three` or `server/` import in `persisted.ts` or `load_report.ts`.
  `load_report.ts`'s single `console.warn` is the sanctioned dev channel.
- **i18n at the emit site: N/A, and the guard was widened correctly.** No player-facing `emit`
  literal moved modules. `tests/localization_fixes.test.ts:1425-1426` ADDS both new files to the S3
  scanned set, which enlarges the guard rather than exempting anything.
- **No findings in `ctx.freeholds` iteration order.** Nothing iterates it. Every access in the tree
  is `.get`/`.has`/`.set`/`.delete`/`.size`: `instance.ts:137,201`, `hearth_key.ts:15`,
  `gate.ts:18`, `state.ts:111,114,130,141,153,156,166,201,205`,
  `server/freehold_persist.ts:1006`, `server/game.ts:5356`, `server/main.ts:3840`. The persistence
  store's OWN `entries` map is iterated unsorted (`saveAllDirty:752`, `idle:791`, `stats:830`,
  `drainCheck:725`), but it is host state and the only consequence is the order of database writes;
  it never touches sim state or the rng stream, and `noteRevisionMoved`'s
  `ports.serialize` is a pure clone-and-read. No determinism fork.
- **`setFreeholdTier` is still the sole tier writer.** The source-scan pin at
  `tests/freehold_dev_grant.test.ts:355` is green, and the new server module never assigns `.tier`
  (it reads through `serializeFreehold`).
- **`state.ts` is still the sole `ctx.freeholds` lifecycle writer.** `installLoadedFreehold` inserts
  through `loadFreehold` (`freehold_persist.ts:966`). The `hasLive` read at :1006 goes straight to
  the map, but reads are not covered by that rule and match the existing precedent the freehold
  CLAUDE.md already sanctions for the record gauge.
- **Module placement is right.** `persisted.ts` and `load_report.ts` are pure leaves in the owning
  directory with no SimContext dependency and a direct unit test
  (`tests/freehold_state.test.ts`, 1003 new lines, importing both files directly), following the
  named `professions/farm_persist.ts` + `farm_load_report.ts` precedent. Correct under module-first;
  neither belongs on `sim.ts`.
- **No dead code from the extractions.** All three source blocks are deleted at their old sites, no
  commented-out remnant, no unused import (tsc clean, biome reports zero errors), no orphaned `ctx`
  or `session` parameter. The one dead-code item is `load_report.ts` (finding 3).

## Count by severity

BLOCKING 0, SHOULD-FIX 5, NOTE 4.
