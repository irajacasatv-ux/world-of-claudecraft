# Persistence finishing COVERAGE review

Reviewer `woc_persistence` (`persistence_evidence_closure`), retained by the
coordinator from the returned report. Scope: `3fa4965a3c186982aafd44b3ec9b9d9851ace52d`
through the working tree including untracked content and compatibility tests.
Root/server and applicable local guidance were read. The change is in scope
because catalog membership affects persisted data even without new fields.

Verdict PASS for the reviewed content. No verified persistence defect or open
nit; high confidence. This is not overall gate or production activation approval.
No files were edited, tests run, DB commands performed or commits made by this reviewer.

## Affected data

- `characters.state` JSONB: physical copies retain inventory, bank and vendorBuyback
  fields. Progress retains deedStats.itemsDiscovered, reliquary.firstFind with
  folded counts, recent and illuminatedPages. Manual deeds use existing deeds,
  activeTitle, activeBorder and recomputed renown.
- `character_deeds`: the existing observer/index can receive the two IDs when
  future manual grant callers exist. This contribution adds definitions only.
- Existing guild_banks books and world_state market/mail blobs can carry the new
  IDs through the already implemented furnishing custody contract. Storage and
  writers are unchanged.
- No housing table or durable bill is introduced. Tier/Charter/trial definitions
  have no new economic or persistence consumer.

## Documented deployment condition

High operational severity, high confidence: an older catalog permanently loses
new discovery and Reliquary metadata after restore followed by save. Current
filters are in deeds.ts:505 and reliquary.ts:195, :242 and :303. The reviewer
compared prior-release predicates in local origin/release/v0.42.0 at
`dca7476e0eea3d50994b02cf1ef5dc068cc89327`; destructive membership gates already
exist there. The existing fleet-wide compatible-writer and backup-restoration
boundary at DEPLOY.md:302 is correctly applied in acceptance.md:44.

Turning the flag off on a current binary preserves definitions; it cannot make
an older binary safe. This is a documented release condition, not a new defect.
Do not generalize the loss claim to every physical copy or earned-deed key:
those loaders may retain dormant unknown IDs. Old reward catalogs can clear
worn title/border selections and recompute lower Renown.

## COVERAGE

- Additive/idempotent/advisory-lock DDL: N/A. No server runtime, DDL, migration,
  column, constraint or index change.
- Populated DB and old rows: no new shape. Missing fragments use freshDeedStats
  and freshReliquaryState defaults; actual old-row test at freehold_furnisher:155.
  No renamed field needs a compatibility bridge.
- Save paths: shared serializer writes affected fragments at sim.ts:4129/:4302.
  Autosave saveAll at server/game.ts:2720, leave saveCharacter :4160, queued
  serializer :4326, saveAllSnapshot :4746 and shutdown saveAll('shutdown') at
  server/main.ts:4205 remain. No field-specific save branch is missing.
- SQL/indexes: no query/predicate change. Deed insert remains parameterized and
  replay-safe with ON CONFLICT (character_id, deed_id) DO NOTHING.
- Seed/backfill/races: none introduced. NPC construction is in-memory, not a DB
  seed. Existing custody coordination is unchanged.
- Actual content round trip: freehold_furnisher:131 purchases all eight IDs,
  serializes through JSON and restores on a current flag-off binary, asserting
  copies, money, discovery, first-find/counts, completion and illumination.
- Counts/sparse state: acquisition :48 exercises repeat purchases/count three;
  existing generic Reliquary tests cover recent/provenance and unknown-ID
  rejection. The maximal fixture pins every new entry at count 999999.
- Prior-catalog characterization: freehold_catalog_rollback:16 explicitly
  substitutes the catalog dependency, runs real restore/serialize, proves loss
  of all eight new IDs/Hearth metadata and retains known-old positive controls.
  It does not claim old-binary execution.
- Existing custody: furnishing_persistence:67 covers signed bag/bank/guild-bank,
  mail and market round trips. This is inherited kind-level evidence, not an
  all-eight-ID DB integration test.
- Growth: professions_blob_growth:2229 independently attributes 188 + 444 = 632
  bytes, retains Homesteader 85 and Field Kit 12 and pins 210203 total. Band width
  and 229376 warning stay intact (19173 modeled headroom). Raw JSON bytes do not
  establish compression, WAL, latency or simultaneously reachable player state.

## Evidence and limits

The inspected integration log had thirteen passing files, including actual
furnishing/blob suites; both failures were confined to Reliquary catalog tests.
The later detailed acceptance receipt has 725 passes, zero failures and three
inherited release-only localization branches pending; the catalog then passes.
The old-catalog characterization reports one passing test.

No production fleet inventory, drain/rollout exercise, backup restoration or PG
benchmark was performed. These remain activation/operations evidence, not missing
schema proof for this catalog change. Production approval remains false and NPC
voice is a required pre-shipping item.
