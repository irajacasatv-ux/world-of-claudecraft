# Persistence review

Read-only specialist persistence_review inspected original furnishing changes 16f2aeed2b..c47e2cb245, merge041fd790ce and developing equipment-power tests against dependency d3dcdaa4af. This coordinator transcription preserves the findings and scope of the full specialist response.

Verdict: two additional coverage findings; no additional runtime defect. Existing loaded-equipment power defect is counted once in the central ledger.

PERSIST-C1: drive journalCharacterSaveSources and journalGuildBookSources with furnishing-only deposit and withdrawal. Assert writes [], anchorsCreated 0, movementRows 0, unchanged-container counts, no query and immutable input. Same-adapter material controls must produce one query/movement. Existing kind registry positively admits junk; furnishings correctly excluded by inspection, executed adapter evidence missing.

PERSIST-C2: serialized custody must survive JSON/restart rehydration in character bag/bank, guild bank, mail full and dirty partitions, and market listings/collections. Assert exact signer and craftedRecipeId, one successful withdraw/collection, no duplicate copy, immutable source saves. Existing tests stopped before restart.

No DDL/SQL/persisted field/JSONB shape changes arise from furnishing. Existing characters.state, guild_banks, mail and market copy payloads reused. Bank/guild merge resolutions retain source-aware material movement. Source registry excludes furnishing before normalization. Copy serialization clones payloads without consulting item kind. Incoming additive material-source tables use existing advisory-lock transaction and lazy anchors; furnishing requires no seed/backfill.

Inspected merge-pg.log: 7 suites95tests passed, writer compatibility, journal transactions, source save cost, lock and index evidence. No additional PG run required for these test-only recommendations. Inherited migration lock_timeout observation excluded: db.ts/material_source_host.ts/material_source_writer.ts byte-identical to upstream, no furnishing overlap. This is not a deferred furnishing finding.

Counts: 2 new coverage findings,0 new runtime defects,0 fixes by reviewer. Finished diff review pending.

## Completed fix review

Persistence specialist follow-up PASS:2found2resolved0remaining. Read completed entity/set/equipment production diff and equipment-power/persistence/journal tests. Guards change only active calculations, leave persisted maps and serializers unchanged. Journal tests drive both real adapters both directions with zeroqueries/anchors/revisions/movements and active material controls. Fresh-load tests cover bag/bank/guild/full+dirty mail/market listing+collection, exact signer/recipe marker, no repeat duplication and unchanged saved source. Inspected corrected persistence-green.log04:46:49:2suites13tests passed. No additional PG needed for test-only fixes. Whole fix round fresh review still coordinator-owned.
