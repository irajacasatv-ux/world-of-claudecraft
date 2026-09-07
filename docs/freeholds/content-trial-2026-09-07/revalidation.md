# Integrated trial revalidation

The original accepted evidence remains byte-identical and is sealed in
[acceptance.md](acceptance.md). Revalidation executes the producers again; it
does not refresh hashes around an old result or change the accepted trial values.

## Economy

Observed command, exit 0:

```sh
node scripts/freeholds/economy_measure.mjs --out docs/freeholds/content-trial-2026-09-07/revalidation
```

The complete `measurements` object and every fixture hash are identical to the
accepted artifact. Measurement payload SHA-256 remains
`7da54311c24cbd73d5f185b74964076e78cde232f08e3aee05f68d5604c208d2`.
The new source graph includes integrated item/NPC/Ledger content. This proves no
observed yield, exclusion, comparator, rounding, or bill changed in that replay.
It does not claim player-hour, market, cohort, or production calibration.

## Geometry

Independent correctness review identified two producer weaknesses: hashing a
separate read after GLB decoding, and recognizing only fragments of the copied
rug factory. The producer now caches and hashes exactly the decoded buffers,
checks all inputs for drift before emitting, and checks the complete unique rug
factory's AST-selected source against its accepted hash. Added geometry or scale
statements, disk changes, and mutated decoder buffers refuse measurement.

Observed command, exit 0 after correcting TypeScript's aliased version lookup:

```sh
node scripts/freeholds/geometry_measure.mjs > docs/freeholds/content-trial-2026-09-07/geometry-revalidation.json
```

All eight complete rows, grid/decor proposals, fixture boundaries, approval
state, and other non-tool metadata equal the accepted artifact exactly. Only
producer input hashes and the added TypeScript parser version differ. The twelve
focused geometry tests pass, including a primitive-count-only dominant cost
fixture. These guards strengthen provenance without altering a furnishing value.

## Retained bytes

| Artifact | SHA-256 |
|---|---|
| [geometry-revalidation.json](geometry-revalidation.json) | `d880b83a82a643631890ee6e9b941f3c83f89918b7de9388cd3d2a71b6725ff7` |
| [revalidation/economy-measurements.json](revalidation/economy-measurements.json) | `1bc6bbe9725cc6af45c660b03c8607de7843707621df3418898fb51d072c058a` |
| [revalidation/economy-source-hashes.json](revalidation/economy-source-hashes.json) | `769f8b05e7184ba2f97094bc8b8f4c05aca3fd8bd77cb3fc348c761d98e79a41` |

## Raw measurement formatting

The four measurement JSON outputs retain their producers' serialization, including
all originally accepted bytes. `biome.json` disables only whitespace formatting for
those four exact paths. JSON parsing, linting, tests, security scans and gate
selection remain enabled. The editable item-art acceptance manifest uses normal
Biome formatting. This preserves the accepted artifact hashes without substituting
new measurements or broadening a source-code exception.
