# Server and database performance COVERAGE review

Historical initial review of `6540713541..67281f8ed4`, by
`/root/server_db_performance`, registered `woc_database_performance`, also applying
server-hot-path-reviewer criteria. Mode: FINISHED_DIFF for the original delivery
and before-decisions review of the described corrections. The read-only reviewer
returned the report inline; the coordinator retained it. This copy expands
compressed prose without changing its findings.

Initial verdict: BLOCK, one P2 high-confidence server hot-path finding, SP01.
No database query, schema, pool, lock, timeout, driver or PostgreSQL configuration
finding was reported. See [current dispositions](../findings.md), the
[finished checkpoint](database-finished.md) and [executed checks](../execution.md).

## Before-decisions conclusion

Collision-free arrivals, denial ordering, jailed feedback and renderer lifecycle
repairs need no additional database planner/concurrency proof if existing save
shapes and cadence remain unchanged. Persistence review should verify ordinary
key inventory save/load; security review owns admission authority.

## Workload and inspected claims

- The realm Sim runs at 20 Hz with a documented admission cap of 5,000 players.
  Each of two authored tiers has 24 owner slots. Reaping runs once per second,
  with a 300-second empty hold.
- Housing shares the existing WebSocket lane of 30 commands per second and burst
  60. Ordinary autosaves remain every 30 seconds, plus existing leave, shutdown
  and exceptional saves. The default shared pool remains 10 clients per realm.
- The key uses ordinary bounded inventory. Plot/cooldown fields remain outside
  character serialization, and the production remote participant always refuses.
  The isolated account map lives until Sim disposal; it is offline/headless state,
  not an approved production cache.
- Gate/key commands perform no I/O. Gate lookup uses the spatial grid and exact
  three-dimensional distance. Minting requires an absent key and inventory capacity.
  The account timestamp changes only after successful remote entry.
- Character serialization retains ordinary cloned inventory; no plot, owner or
  cooldown field was added. Periodic save cadence/write sets are unchanged. There
  is no direct gate/key database call, retry or queue.
- Presence and relay resolve local catalog metadata without query fanout. Owner
  claim occupancy indexes once per sweep and visits the roster once, at most one
  candidate per entity; occupied claims skip further containment.
- Inspected occupancy tests pin 5,000 visits and 48 claims, zero overworld
  containment and 48 occupied-claim tests. The reviewer did not execute them.
- The `freeholds.size` gauge is constant-time and unlabeled; scan/tick counters
  and totals are bounded. No SQL, DDL, index, foreign key, pool, dependency,
  engine, resource or transaction change was found.

Persistence review is triggered by the permanent item and changed arrival
positions in existing character saves. No SQL or database cadence change is
required for the proposed corrections.

## SP01: unsuccessful gate attempts force heavy self serialization

P2, high confidence. `dispatchFreeholdCommand` returns true whenever it invokes
`sim.freeholdEnter`, including refusal and accepted entry without an item grant.
The housing arm in `server/game.ts` therefore sets `session.selfHeavyDirty` on
invocation. Invalid-location probes at the permitted lane rate can dirty every
20 Hz snapshot, rebuilding inventory, mounts, farm, equipment and unrelated heavy
fields. The original wire tests pinned that invocation-based behavior.

Mark heavy self only on actual inventory mutation, using an existing revision or
narrow result. Preserve immediate delivery for a newly granted key. Pin real
dispatch and snapshots for refusal, existing-key success, full-bag success and a
new grant: no new heavy projection for unchanged inventory, one immediate refresh
for the grant. Use aggregate counters only.

## Supplied evidence and limits

The initial coordinator ledger recorded typecheck, generators and changed-file
checks at exit 0; 25 scoped files with 983 passing tests and three release-only
localization skips; a frozen-tip GPU tour with zero required room deltas; and
local PostgreSQL readiness. GPU measurements are not server capacity evidence.
No PG planner, lock, concurrency or acceptance result was supplied, and the
reviewer executed no tests, database commands or benchmarks.

No new disposable-PG proof is required for this diff or the described repairs.
Readiness does not prove later durable-account acceptance. The parent must run
occupancy, server scan, presence and metrics suites through scoped or selected
checks. Owner capacity and repeated physical-entry broadcast cost remain named
deployment prerequisites.

Clean categories: query shape/count/scheduling; schema/index/foreign keys/cascades;
transactions/locks/deadlines/pools; driver/engine/connections; retries/waiters/queues;
shared presence hydration; occupancy allocation; spatial lookup; metric labels
and scrape cost; production clock-map growth, which cannot populate; and save
amplification beyond bounded ordinary inventory/position.
