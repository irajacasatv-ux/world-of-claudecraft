# Crafted content persistence review

Coordinator transcription of the woc_persistence review. No verified runtime
defect; one accepted P3 coverage finding, PER-1. The reviewer ran no tests or
database commands and made no file edits.

PER-1: tests/freehold_crafted_availability.test.ts proves refused use retains an
unused pattern, while furnishing_persistence.test.ts proves a synthetic item
round trip. No single test preserves the actual ten crafted furnishings and
three unused patterns, knowledge, discoveries and Reliquary progress through
enabled, disabled and re-enabled current-build hosts. Add that JSON round trip
to the existing availability suite, with full value comparisons and nonempty
authored-cohort controls. This is missing regression coverage, not observed loss.

Affected existing storage is characters.state inventory, bank, knownRecipes,
deedStats.itemsDiscovered and Reliquary firstFind/illuminatedPages. Existing
guild_banks and world_state market/mail custody can carry the same identities.
The scoped commits change no DDL, queries, indexes, constraints, stored fields,
seeds, backfills or custody persistence implementations.

Current catalogs remain complete on a dark host; capability gates admission,
not loading/serialization. Shape-valid knowledge and copies retain compatibility.
Periodic, shutdown and leave saves use the existing shared character serializer.
The settled serializer fixture attributes 324 knowledge bytes, 355 discovery
bytes and 576 Reliquary bytes to the cohort, totaling 1,255 bytes; the current
complete fixture is 213,006 bytes. These are serialized fixture measurements.

The pre-content source at 86eb86bbe2^ retains shape-valid recipe strings and
unknown inventory copies, but filters unknown discovery and Reliquary IDs/pages.
Current corresponding filters remain in deeds.ts and reliquary.ts. Disabling the
flag on this build preserves progress; removing the catalog via old-binary
rollback is not lossless. Existing rollback tests characterize earlier basic
furnishings and do not execute an actual older binary for all crafted IDs.

Shared initial validation was 20 files, 938 tests passed and three release-only
checks skipped. Final gate and new round-trip execution are coordinator-owned.
