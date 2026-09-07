# Database performance review: maximal character fixture

Reviewer: woc_database_performance (`review_blob_growth`), read-only. Coordinator preserved the reviewer findings here because that role cannot write files.

## Proposed change

Verdict: BLOCK until the exact catalog growth was attributed. P2: the maximal fixture earns every catalog deed, so the historical Crucible/hammer equations now included two later entries. The focused failure received 53415 rather than 53330, exactly 85 bytes.

Static attribution: `homesteader_first_furnishing` is 28 ASCII characters and `homesteader_first_cottage` is 25. Each non-first JSON entry with the fixture date `2026-08-08` adds 16 punctuation/date bytes, yielding 44 + 41 = 85. The selected title and border remain the older fixture selections and add no bytes.

Recommended correction: clone the settled deed object, assert and remove these exact entries before the historical equations. Preserve the independent Field Kit +12 proof, historical baselines, fixed-point checks and legal container ceilings. Shift both tracking edges by 85, retain the 381-byte width, and keep the warning threshold unchanged.

Production trace: manual deeds are excluded from NON_MANUAL_ORDER and these two IDs have no new grant caller. Future grants deduplicate by deed ID. The existing board refresh query receives two additional catalog parameter rows, with no extra query or cadence change. Existing save and deed-upsert batching, character/account-leading indexes, pool topology and timeout policy remain unchanged.

## Finished diff

Verdict: PASS. No findings remain.

Coordinator command `npx vitest run tests/professions_blob_growth.test.ts` exited 0 with 11 tests passed (`/tmp/freehold-blob-growth-fixed.log`). The reviewer read the actual output and the finished diff. Scoped Biome exited 0, with four warnings on unchanged lines.

Passing literal assertions establish:

| Measurement | Bytes |
|---|---:|
| Furnishing deed | 44 |
| Cottage deed | 41 |
| Combined increase | 85 |
| Full fixture | 209571 |
| Without Field Kit | 209559 |
| Historical fixture after removing both additions | 209474 |
| Exclusive lower tracking edge | 209191 |
| Exclusive upper tracking edge | 209572 |
| Unchanged warning threshold | 229376 |
| Warning headroom | 19805 |

The settled state is preserved by cloning its deed object. Historical fixtureDelta and forgeBaseline equations, Field Kit +12 proof, fixed point and container assertions remain intact. Both edges move equally; the tracking width is unchanged.

Workload assumptions: existing autosaves every 30 seconds with four workers per realm; 1000 modeled maximal characters add 85000 serialized bytes per save wave. This is not measured PostgreSQL storage or WAL. Pool topology remains one pool per realm, default maximum 10, sharing PostgreSQL. The fixture is a storage-rich modeled character, not every possible character state.

Clean categories: stored-data growth attribution, query count/fan-out, relevant FK reverse indexes, batching, transactions/locks, timeouts, connection topology, dependencies/configuration, warning policy and historical regression assertions. No additional database runtime proof or persistence/security review is needed for this bounded test-only repair. No files were changed by the reviewer.
