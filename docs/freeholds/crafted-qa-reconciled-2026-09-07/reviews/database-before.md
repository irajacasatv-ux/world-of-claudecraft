# Crafted content database performance review

Coordinator transcription of the woc_database_performance reviewer report.
Mode: FINISHED_DIFF. Reviewed the ten named implementation and repair commits
at 0932963250, excluding unrelated release integration. Verdict: PASS, no findings.
The reviewer performed no database commands or tests and could not write its own
report under its read-only role; the coordinator owns execution evidence.

Database performance applies because the existing character JSON gains bounded
catalog identities. Ten learned recipe IDs, thirteen discovered item IDs and ten
Reliquary IDs add 1,255 serialized bytes in the authored cohort: 324 recipe bytes,
355 discovery bytes and 576 Reliquary bytes. The current merged full-character
fixture is pinned at 213,006 bytes, below the unchanged 229,376-byte warning.
This is a modeled serialized fixture, not a universal maximum or PostgreSQL
storage/WAL measurement. Historical producer evidence reported eleven passing
serializer tests; fresh coordinator results remain required.

The scoped changes add no SQL calls on commands, login, reconnect, ticks or saves.
buildWorldHello is pure and adds an optional capability flag. Existing knowledge
uses a Set; sanitizeKnownRecipeIds caps input at 512 IDs of at most 64 characters
before the existing grandfather union. Discovery and Reliquary sets remain
catalog bounded, and the recent-find ring stays capped. There is no per-find save.
Craft batches remain capped at 50 sequential crafts.

Autosave remains every 30 seconds, with at most four save workers and coalesced
overlapping non-shutdown waves. At 1,000 fully progressed active characters the
increment is 1.255 MB per wave, or about 41.8 kB/s; at the configured 5,000-player
admission ceiling it is 6.275 MB, or about 209.2 kB/s. These are application-payload
calculations and do not claim that either population is sustainable capacity.

Reviewed: server/world_hello.ts buildWorldHello; server/game.ts join/resume,
flushPeriodicSaves, saveAll and saveAllSnapshot; server/db.ts saveCharacterState;
server/character_blob_size.ts; src/sim/sim.ts addPlayer/serializeCharacter;
src/sim/professions/crafting.ts acquireRecipeForRecipe; training.ts
sanitizeKnownRecipeIds; deeds.ts discovery serialization; reliquary.ts serialization
and restore; tests/professions_blob_growth.test.ts. No scoped changes to query
shape/frequency, indexes, foreign keys, cascades, transactions, lock order,
timeouts, pools, database driver/engine/resources/topology or size observability.

No EXPLAIN, concurrency or database benchmark is necessary for this content-only
increment. Persistence and security reviewers should assess retained identities,
dark-host load compatibility, rollback and authoritative acquisition. Current
serializer and furnishing tests are the remaining coordinator proof.
