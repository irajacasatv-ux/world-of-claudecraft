# Database performance: FINISHED_DIFF

Coordinator transcription of the independent `database_finish` specialist's final report. No database commands, tests, benchmarks or writes were performed by the specialist.

Verdict: PASS. Zero actionable findings attributable to the assigned diff.

Scope: original crafted packet `49ed3f0933..3666d89647`, merge `2e24ba8818` and current fixes to reviewed paths. Database modules inherited from `54ce808436` were checked for integration changes; this is not an audit of all upstream features.

Workload and measured attribution:

- Ten recipes, one output each, two to six reagent entries, maximum 30 authored reagent units per craft. Skill 50 yields three sim-seconds per craft. Batch maximum remains 50 sequential crafts.
- Acquisition, training, purchase and crafting add zero direct SQL calls per command/login/tick. Vault consumption retains one reservation for the whole planned take list.
- Existing full-character autosave runs every 30 seconds. Sweeps do not overlap and use at most four workers, alongside existing leave/shutdown/durability paths.
- Added progress is ten knowledge strings, thirteen discovery IDs, ten first finds and one page. Knowledge bounds remain 512 entries of at most 64 characters; the recent-find ring remains twelve.
- Executed fixture: 213,006 bytes, including 1,255 crafted bytes (324 knowledge, 355 discoveries, 576 Reliquary). Counterfactual: 211,751 bytes. The 381-byte tracking band, 20,480-byte professions ceiling and 229,376-byte warning are unchanged. Fixture headroom is 16,370 bytes.
- At the fixture's modeled 1,000 fully participating characters, the content delta is 1,255,000 serialized input bytes per sweep, approximately 41,833 bytes/second. These are arithmetic projections, not measured throughput or WAL.
- Existing rarity refresh runs three aggregate statements behind a five-minute per-process cache. Added cardinality is at most ten item groups and one page group.
- Unchanged connection accounting: pool default ten, two General-quota clients, one listener and one cancellation connection at peak, fourteen per realm before boot/maintenance/tooling/restart overlap. Background admission is headroom, not an enforced interactive reserve.

Source evidence:

- Original server changes are the pure `buildWorldHello` and its two callers. No hydration or database work is added.
- Crafting and training add synchronous availability checks, with no queue or persistence callback addition.
- `game.ts:1828` retains guarded whole-plan reservation. Outbox admission remains 2,048 rows/2 MiB per session and 65,536 rows/64 MiB per process.
- `db.ts:3447` retains serialization before checkout, fenced character-row writes, conditional source/ledger effects and transaction boundaries. Acknowledgement extraction adds no database call.
- SQL, outbox, save, pool and rarity behavior remains preserved. The lockfile change concerns Three.js, and Compose forwards the Rift switch; neither changes PostgreSQL or its driver.
- `character_save_statement.ts:122` retains byte observation and deferred warnings.

The supplied growth logs also report 165,870, 346,836 and 3,883,486-byte material-source fixtures. Thus 213,006 is a particular modeled fixture, not a universal character-size ceiling. No planner, lock, pool, latency, storage or WAL measurement was supplied or inferred.

Inherited limitation outside this delta: `scheduleBankLedgerHighWaterSave` (`game.ts:4216`) clears its flag before save settlement, coalescing one microtask burst rather than all outstanding saves across event-loop turns. The keyed writer does not coalesce those jobs. Baseline and current code are identical, and existing recipes already reach the same callback. Added catalog IDs introduce no new reachability or cadence. A general one-pending-save guarantee is not certified; no queue refactor is required by this content delta.

Clean categories: SQL calls and cadence; fan-out and hydration; catalog/storage growth; pagination and retention; predicates/indexes/constraints; transactions/locks/timeouts; drivers/engine/resources/topology; existing size and save observability. No additional PostgreSQL runtime experiment is required for this bounded delta. Persistence and security were paired reviews; the contribution gate remains separate.
