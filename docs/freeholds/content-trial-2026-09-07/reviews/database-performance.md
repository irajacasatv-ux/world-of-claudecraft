# Database performance finishing review

Mode FINISHED_DIFF. Reviewer `woc_database_performance`
(`database_evidence_closure`). Retained by the coordinator from the returned
report. Full scope: `3fa4965a3c186982aafd44b3ec9b9d9851ace52d` through the working
tree, including untracked content. Root/local guidance was applied. Actual eight
furnishings, Furnisher acquisition, Hearth, two Homesteader records and the trial
schedule were reviewed against their existing database consumers.

Verdict PASS. Zero actionable findings or nits. This closes database review,
not the pending contribution gate or production activation. No files, tests,
benchmarks, database connections or database commands were touched by the reviewer.

## Workload assumptions

- Eight catalog entries use existing vendor/inventory paths. Purchases update
  bounded in-memory discovery/Reliquary state without a new DB request or queue.
- Existing 30-second autosave, leave flush and shutdown saves remain unchanged.
  `GameServer.saveAllSnapshot` uses at most four workers per realm and coalesces
  overlapping ordinary save waves.
- Eight discoveries, eight first-find/count entries, one illuminated page and two
  deed entries grow existing metadata. Discovery/page membership is catalog
  bounded, recent history is capped at 12 and obtain counts at 1e9. Physical
  copies retain existing container limits.
- Both deeds remain manual with no new production grant caller. Loaded records
  can add two rows to the same batched login reconciliation, with no extra query.
  Uniqueness remains `(character_id, deed_id)`.
- A normal rarity refresh retains two deed and three Reliquary aggregate queries
  plus unchanged transaction control. Five-minute cache and single flight are
  per process: R realms may refresh R times per normal cache cycle. Existing
  error behavior remains unchanged.
- For shared pool maximum P, configured topology is R times (P + 4): shared
  pool, two quota clients, one listener and one cancellation client per realm.
  Boot clients, tooling and deployment overlap are additional. This warning
  bound is not an enforced universal connection reserve.
- Illustrative arithmetic: 1000 characters matching this fixture add 717000 raw
  serialized bytes per save wave from the combined 717-byte content increase.
  This is not measured PostgreSQL storage, WAL or throughput.

## Measured coordinator evidence

The maximal fixed-point fixture is 210203 UTF-8 bytes. Furnishings/Hearth add
632 bytes (188 discovery + 444 Reliquary); Homesteader adds 85. The independent
Field Kit 12-byte contribution and historical equations remain. The tracking
band retains its width and CHARACTER_BLOB_WARN_BYTES remains 229376, leaving
19173 bytes above this fixture. The fixture has documented exclusions and is not
a universal upper bound for all legal characters.

`/tmp/freehold-trial-integration.log` includes passing real furnishing and blob
cases but had two unrelated Reliquary assertions fail; it is not a green whole
gate. The later 14-file acceptance result has 725 passed / 3 inherited
localization skips / zero failures and includes the corrected catalog, but does
not include the maximal-blob suite. The old-catalog characterization passed one
test and explicitly does not execute an older binary or PostgreSQL.

## COVERAGE: static inference

- DB-C01, scope: no runtime server, schema/index, DB dependency or deployment
  topology change. Four changed PostgreSQL integration suites only reorder
  imports. Earlier CI changes add screenshot checkout paths.
- DB-C02, acquisition/save cadence: declarative records and conditional NPC
  construction call existing bounded `noteRelicObtain` state updates, not saves.
  Existing scheduler and database call sites remain unchanged.
- DB-C03, stored growth: restoreDeedStats, serializeReliquaryState and
  sanitizeObtainCount retain existing bounds. Growth tests remove exact new
  identities from settled real serializer output, without widening warnings.
- DB-C04, aggregation: reliquaryRarityCounts retains three sequential filtered
  aggregates sharing the deed denominator. Eight possible item groups and one
  page group are added, without per-item SQL. Scans still process eligible
  character blobs; bounded incremental growth is not constant-cost work.
- DB-C05, writes/indexes: insertCharacterDeeds retains one parameterized batch.
  Character-leading uniqueness and account-leading character_deeds_account
  indexes cover both FK cascade directions; recent-earns index remains.
  No new reverse lookup or predicate needs an index.
- DB-C06, transaction/pool behavior: saveCharacterState stringifies before
  checkout and retains transaction, locking, cancellation and journaling. No
  transaction, retry, timeout override, admission bypass or connection is added.
- DB-C07, schedule: one shared frozen row is returned from twelve. No durable
  billing, production calendar or database consumer is introduced.
- DB-C08, observability: blob-size reports, high-water/p99, last-save age,
  failures, rarity refresh timing and pool occupancy remain intact.

## Runtime proof and limits

No new PG runtime benchmark is required for this content-only database effect.
No planner, version, compressed-storage, WAL, pool-reserve or throughput claim
is made. Production activation and future DB/capacity changes require their own
review. Fleet/rollback compatibility remains the persistence review's primary
scope. Clean categories include cadence, fan-out, result cardinality, growth,
indexes, batching, retention, cache scope, transactions, lock ordering, retries,
cancellation, topology, driver/engine/config and observability.
