# Database merge precheck

Reviewer: db_merge_precheck (woc_database_performance), proposed-change mode.
Verdict: PASS for merge decisions; runtime evidence pending.

No merge-induced finding. Preserve both storage/freehold and material-source imports, material transfer selection, load normalization, FIFO saves, locked preimages, atomic journaling, writer guards and aggregate budget. Original furnishing diff contains no SQL. Material registry positively requires kind junk; projectMaterialContainer excludes ids outside it. Furnishing movement introduces no material-journal query/revision and retains existing slot capacities.

Workload: 30-second autosaves plus leave/shutdown/transaction saves, pool 10 per realm, incoming material journal one conditional batched statement, aggregate retained-row budget 10,000,000. No new furnishing worker, queue, query or connection. FK reverse indices and lock order preserved by incoming implementation. Review is static, no measured evidence yet.

Required disposable PG suites: material_source_save_cost_pg_integration, material_source_writer_pg_integration, material_source_journal_pg_integration, server/bank_ledger_growth_budget.pg. Unit evidence: material-source connection, character adapter, journal and storage cost. Pair persistence/security on finished integration.
