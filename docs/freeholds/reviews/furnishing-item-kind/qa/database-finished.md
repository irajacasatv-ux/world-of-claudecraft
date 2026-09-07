# Finished database performance review

Coordinator transcription of database_finished specialist response. Mode FINISHED_DIFF, scope original16f2aeed2b..c47e2cb245, merge041fd790ce vs d3dcdaa4af and QA repairs. Read-only, no DB connection or tests by reviewer.

Verdict PASS,0found0remaining, no additional runtime proof required for this finished database diff.

Existing character saves every30seconds plus leave/shutdown/transaction triggers unchanged. No new pool/client/waiter/reserve; realm pool defaults10, shared budget accounts quota/listener/cancellation. One copy per general slot, materials-only capacity not available. Existing personal208/guild60/listing12 ceilings remain; mail3attachment/100player-send-time limits do not bound all system/returned mail. Metadata remains authored content, custody stores existing IDs/payload. Ordinary bank audit rows can still occur; zero material-journal work does not mean zero total persistence.

Measured evidence inspected: merge-pg.log7suites95tests passed using disposablePG16. Unchanged materials zerojournal statements, changed materials onebatch; FOR NO KEY UPDATE allows FK child while stronger comparison produces55P03. Distinguishes forced index feasibility from planner selection;10kextraanchors with seqscans enabled selected character/material-container indexes. Save-cost/writer/journal/audit-growth pass. persistence-green13tests and furnishing-expanded207tests inspected; furnishing both adapter directions zeroquery/anchor/revision/movement with active material controls; immutable restart copies and repeat negatives.

Static: db.ts,host/writer/journal,queue,dependencies,pool byte-identical incoming; bank/guild retain upstream material-source/replay bodies with furnishing admission only. deriveMaterialItemIds positively junk; project skips nonregistry before normalization. Character adapter keeps bank/vault fixed order on caller transaction; guild batched statement/caller lock order unchanged. Mail/market/Exchange reuse rate/transaction/sweep/custody paths, no peritemquery/backgroundtask. Equipment/Perfecting fixes add no stored fields/hydration/queues/DBcalls. Existing freehold status auth unchanged.

Clean categories: query shape/frequency/batching; call fan-out/save cadence; indices/FK lookup; cardinality/write amplification; transaction/lock order; pool/admission/timeouts; driver/engine/deployment; queues/background work; observability/audit growth; furnishing journal exclusion/custody.

Inherited boot lock_timeout excluded after byteidentity to dependency and no furnishing overlap. Not a deferred finding. Shared contribution gate remains coordinator-owned.
