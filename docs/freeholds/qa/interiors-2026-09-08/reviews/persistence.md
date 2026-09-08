# Persistence review

Historical persistence review, before the PR01 regression was added. See [the current disposition ledger](../findings.md) for closure evidence and the remaining final-review requirement.

Scope: original delivery 654071354172b3e252cfc03a1e85efde2daddaa6 through current working tree, including arrival and server fixes. Read-only woc_persistence reviewer. One P2 coverage finding, no verified data-loss or authority defect.

PR01: tests/freehold_gate_and_key.test.ts:291 and tests/freehold_instance_online.test.ts:440 do not drive serializeCharacter -> JSON encode/decode -> addPlayer. Add both-room retained-key/no-duplicate/safe-outdoor-reload and old-row tests. Neither account deadline, owner stamp nor entry sequence should leak into character/plot blobs. Include a bank round trip if bank evidence is claimed. No PG fixture is needed.

Verified: src/sim/sim.ts:4062 saves position/facing; 4080 clones inventory; 4082 saves bank. server/game.ts:4116 retains existing serialized write queue; periodic/shutdown saves at4535 and final leave at3949 are unchanged. Inventory restore at3083 and prior release origin/release/v0.42.0 57a2ced3bd preserve unknown item IDs; prior useItem refuses unknown definitions, so rollback retains a dormant key by static inspection. Current interior reload uses existing dungeon-door relocation at2763. owner_arrival.ts chooses existing/first unclaimed slot synchronously, and dungeons.ts resolves before claim/travel mutation while preserving rebucket, pose, facing and sequence. gate.ts grants only after accepted entry, absent carried key and capacity. freehold_wire.ts marks heavy self only on acting inventory revision change. sim_boot_config.ts production participant denies remote key before clock/admission.

Affected persistence is ordinary characters.state inventory/bank/position only. No changed DDL, SQL, constraints, indexes, stored field, pool, queue, write cadence or schema operation. Plot records and the isolated account clock remain in memory; dungeonEntrySeq stays session/wire state.

Limits: reviewer ran no tests/database commands and wrote no files; coordinator persisted this report. Static rollback compatibility is not a two-binary replay. A prior binary can use its existing fallback door for unknown rooms. Durable account cooldown/database epoch/private committed mirror and production enablement remain 07/07a; injected participants prove protocol only.
