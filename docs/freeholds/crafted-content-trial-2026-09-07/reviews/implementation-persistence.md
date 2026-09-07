# Persistence review

Coordinator transcription of the read-only persistence reviewer. Verdict: no verified defects. The worker reported eleven passing serializer fixed-point tests; final shared gate remains pending.

The contribution adds bounded values to existing inventory, known-recipe, discovery and Reliquary collections. No stored fields, SQL, DDL, indexes, constraints, save cadence, or custody serializer changed. Current-build dark hosts retain ownership and knowledge. The known-recipe load cap remains 512; the maximal fixture retains 215 entries. The permanent item golden adds exactly thirteen IDs and removes none.

Measured modeled growth is 1,255 bytes: 324 knowledge, 355 discoveries, and 576 Reliquary. Existing structural ceilings and historical counterfactuals are preserved.

Disabling the flag on the current build preserves state. An older binary without these catalogs keeps unknown item copies and recipe strings but can discard unknown discovery and Reliquary progress during load/save. Lossless old-binary rollback is not claimed.
