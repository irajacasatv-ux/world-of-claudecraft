# Persistence finishing review

Coordinator transcription of independent `persistence_finish` final report. Read-only specialist; no commands that modify files or databases were run.

Verdict: PASS for scoped static review. Zero verified defects and zero nits.

Scope: `49ed3f0933..3666d89647`, persistence seams after `2e24ba8818`, and current QA fixes. Furnishing kind predates this packet. The packet adds catalog identities and progress, with no DDL, SQL, columns, serialized fields, renames or backfills. Current `server/db.ts` is identical to incoming `54ce808436`; unrelated upstream database changes are outside this bounded review.

| Existing storage | Affected data |
| --- | --- |
| `characters.state` | Inventory, personal bank, buyback, ten recipe IDs, thirteen discovery IDs, ten furnishing first finds and one Hearth illumination |
| `guild_banks.data` | Stored copies |
| `world_state.data` | Realm market listings/collections and mail attachments |
| Exchange records | Existing furnishing custody documents and associated records when used |
| Bank audit paths | Ordinary transfer and reagent-consumption records |

Verified clean categories:

- Inventory, bank and knowledge use existing whole-character serialization at `sim.ts:4124` and `:4225`. Autosave and shutdown share `saveAllSnapshot` (`game.ts:4720`), and leave awaits final save (`:4095`). No new field needs wiring.
- Disabled-host catalogs remain registered. Knowledge loading is bounded by shape, not filtered by catalog (`sim.ts:3324`). Real serialize/load/serialize fixed points in `professions_blob_growth.test.ts` retain the added IDs.
- Signed furnishings retain existing cloning/load policies in bags, bank, guild bank, mail and market. Unknown item IDs remain dormant recoverable custody data (`bank.ts:750`, `market.ts:1230`, `mail/post_office.ts:1236`).
- Queries remain parameterized (`character_save_statement.ts:148`, `db.ts:4440`, `mail_db.ts:105`). Vault audit capacity is reserved before crafting mutations (`crafting.ts:903`). No predicate, index, cadence or transaction boundary changed.
- No feature migration is owed. Existing schema orchestration begins its transaction before the advisory lock and commits normally (`db.ts:1273`, `:1280`, `:1456`).
- No new saved field introduces old-row hazards. Compatibility tests include absent fields and malformed knowledge.

Verified existing rollback boundary: disabling the feature flag is safe for retained catalog content; binary rollback to a catalog lacking the IDs is not lossless. `DEPLOY.md:302-314` already states this. The reviewer independently checked prior release `f740ca1ff8`: `deeds.ts:376` filters discoveries through its own ITEMS, and `reliquary.ts:187`/`:234` filters first finds and pages through its own catalog. Arbitrary mixed catalogs and rollback are not certified.

The integrated modeled fixture is 213,006 bytes, retaining 1,255 crafted bytes plus 1,548 incoming-content bytes. This is fixture evidence, not production storage or latency measurement. The coordinator subsequently ran the requested `furnishing_persistence`, `character_state_backcompat` and `professions_blob_roundtrip` suites successfully in `../logs/integration-final.log`; that historical combined run's sole failure is a separately corrected stale Rift wire assertion.

No mixed-binary deployment, crash-recovery or production-load experiment was performed. Final shared gate results remain coordinator-owned.
