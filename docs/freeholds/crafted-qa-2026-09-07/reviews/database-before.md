# Mode: `PROPOSED_CHANGE`

Pre-decision database review for the crafted-content QA correction round. The production paths and original committed packet were inspected at `49ed3f0933..3666d89647`. This is not certification of the in-progress upstream merge or of later QA fixes.

# Verdict: `PASS`

No actionable database performance finding in the original packet. The proposed QA work may proceed within the existing bounded catalog, inventory, serializer, and admission contracts. A finished-diff database review remains required because the packet expands stored data.

# Workload assumptions

- `src/sim/content/freehold/furnishing_recipes.ts` / `FURNISHING_RECIPES`: ten recipes, one output each, two to six authored reagent entries, at most 32 authored reagent units in a bill. Every recipe has skill requirement 50. The unchanged `craftCastDurationSec` maps these to three sim-seconds per craft; `CRAFT_BATCH_MAX` remains 50 sequential crafts.
- Acquisition, training, quartermaster purchase, cast start, and availability checks execute in the Sim. They add zero direct SQL calls per request or tick. Vault consumption uses one existing reservation for the completed craft's complete take list, not one asynchronous query per ingredient.
- `server/game.ts` / `AUTOSAVE_SECONDS`, `saveAll`, `saveAllSnapshot`: full character saves every 30 seconds, plus existing leave, shutdown, and explicit durability paths. Autosave sweeps do not overlap and use at most four workers. A save still targets one character row; its existing material-source and ledger work depends on actual container changes.
- Stored cohort: ten knowledge strings, thirteen item discoveries, ten first-find entries, and one illuminated Hearth page. Known-recipe load limits remain 512 entries of at most 64 characters. No new per-event history or table is introduced; the Reliquary recent ring remains capped at twelve.
- The approved fixture grows from 210,203 to 211,458 serialized UTF-8 bytes, a 1,255-byte increase. At the test header's modeled 1,000 online characters, if every character reaches this cohort, this adds 1,255,000 serialized input bytes per 30-second save sweep, approximately 41,833 bytes/second. This arithmetic is not a WAL, storage, throughput, or latency measurement. Actual population and ownership mix were not supplied.
- `server/reliquary_rarity_db.ts` / `reliquaryRarityCounts`: the production refresh continues to issue three sequential aggregate statements, sharing the existing denominator and five-minute single-flight cache. The cohort can add thirteen discovery-array elements and one illuminated-page element per eligible character; results gain at most ten item groups and one page group. Realm processes each own their cache, so refresh load multiplies by process count.
- Pool topology is unchanged: one realm process owns its shared pool, two General-quota clients, one listener, and a maximum-one cancellation side pool. The code default shared pool is ten, giving fourteen connections per realm at cancellation peak before boot, tooling, and restart overlap. `background_db_gate.ts` explicitly provides composition headroom, not a guaranteed interactive reserve. No new connection-reserve or capacity claim is accepted here.

# Evidence

Measured evidence:

- Supplied historical artifact `docs/freeholds/crafted-content-trial-2026-09-07/reviews/implementation-database-performance.md` reports eleven passing serializer tests, 19,161 professions bytes, 211,458 whole-character bytes, and the 210,203-byte counterfactual. It attributes the new cohort to knowledge 324, discoveries 355, and Reliquary 576 bytes. This reviewer did not execute or independently reproduce that historical run.
- No PostgreSQL plan, concurrency, lock, storage, WAL, or latency measurement was supplied or produced by this reviewer.

Static inference:

- `git diff 49ed3f0933..3666d89647 -- server package.json pnpm-lock.yaml docker-compose.yml DEPLOY.md .env.example` confines server changes to `game.ts` hello construction and the pure `world_hello.ts` builder. No SQL, schema, index, pool, driver, engine, resource, timeout, or deployment configuration change belongs to this packet.
- `src/sim/freehold/crafted_availability.ts` / `isFreeholdCraftAvailable`, `src/sim/professions/train_recipe.ts` / `trainRecipe`, `crafting.ts` / `acquireRecipeForRecipe`, `resolveCraftForRecipe`, `maxCraftCountForRecipe`, and `craftItem`: availability adds synchronous catalog gates and no database callback.
- `src/sim/sim_context.ts` / `reservePlannedVaultConsumption`, `server/game.ts` / realm Sim reservation callback, `server/bank_ledger_session.ts` / `reserveVaultConsumption`, and `bank_ledger_outbox.ts` / `tryReservePrepared`: existing pre-mutation reservation covers the entire exact vault take list. Existing outbox ceilings remain 2,048 rows or 2 MiB per session and 65,536 rows or 64 MiB per process; refusal precedes reagent mutation.
- `server/db.ts` / `saveCharacterState`, `server/character_save_statement.ts` / `runFencedCharacterSave`: ordinary nonce-fenced saves retain the existing character-row lock then update sequence, existing conditional source journal and ledger effects, and pre-checkout serialization. No new transaction boundary or lock order is introduced.
- `tests/professions_blob_growth.test.ts` pins 214 current recipe IDs, 215 retained recipe IDs, the exact 1,255-byte attribution, the real serialize/load/serialize fixed point, and the unchanged 20,480 professions structural ceiling and 229,376-byte warning threshold. The warning is not a hard save limit.
- `server/reliquary_rarity_db.ts` / `reliquaryRarityCounts` and `server/main.ts` / `refreshDeedsRarityShared`: no per-player hydration, new cadence, or extra query is added by the new content; aggregate output remains catalog bounded.

# Findings

none

# Required runtime proof

No new disposable-Postgres, EXPLAIN, concurrency, or load-test evidence is required for this bounded serializer/content delta. This review makes no new planner, pool-reserve, timeout, or PostgreSQL performance claim.

The coordinator should reproduce the serializer evidence on the settled QA tree with `npx vitest run tests/professions_blob_growth.test.ts` and supply aggregate pass/fail counts and serialized byte totals. Availability and acquisition checks requested from the coordinator are `tests/freehold_crafted_availability.test.ts`, `tests/furnishing_crafting.test.ts`, and `tests/furnishing_pattern_items.test.ts`. These are finishing evidence, not work executed by this reviewer. No raw character blobs, row values, query parameters, credentials, or unredacted logs are needed.

If merge resolutions or QA fixes touch database behavior, the finished review must rescope and request coordinator-owned disposable PostgreSQL evidence on the intended versions for any planner, index, pool, lock, or timeout claim.

# Clean categories

- Added query count and per-request, per-login, per-event, and per-tick database cadence.
- New database fan-out, hydration, retries, and per-ingredient asynchronous queues.
- Catalog growth, serialized byte attribution, existing inventory limits, and retention needs introduced by this packet.
- Aggregate result cardinality and reuse of the existing rarity cache.
- Changed predicates, joins, ordering, JSONB expression indexes, foreign-key cascades, and reverse lookups: none introduced.
- Changed transaction scope, lock order, acquire/query/transaction deadlines, and boot or maintenance policy: none introduced.
- Changed pool topology, driver or engine versions, and claimed connection reserves: none introduced.
- Existing blob-size warning and aggregate growth observability remain connected.

Finished review pairing: request `woc_persistence` and `woc_security` together. Stored identities and disable/rollback behavior belong to persistence; the host availability flag and acquisition authority belong to security. Their review remains necessary even though no database-performance correction was found.
