# Calibration proposal validation

This is validation of an unapproved development proposal, not the contribution gate or completed content integration. No runtime catalog or existing source file changed.

| Command | Result |
|---|---|
| `node scripts/freeholds/crafted_economy_measure.mjs --out /tmp/freeholds-crafted-economy-essence` | Exit 0; 3,008 pricing cases, 16 protected-input controls, learning boundaries, positive unattuned gain at 50 and none at 125, two byte-identical probe runs. Final evidence copied byte-for-byte to this directory. |
| `npx vitest run tests/recipe_economy.test.ts tests/freehold_trial_geometry.test.ts tests/freehold_trial_economy.test.ts` | Exit 0; 3 files, 46 tests passed. Existing shared behavior and prior measurement tools, not new recipe integration. |
| `npx tsc --noEmit` | Exit 0 after the final Arcane Essence substitution. |
| `npx @biomejs/biome check scripts/freeholds/crafted_economy_probe.ts scripts/freeholds/crafted_economy_measure.mjs scripts/freeholds/crafted_geometry_measure.mjs scripts/freeholds/crafted_geometry_inspection.mjs` | Exit 0; 4 files checked, no fixes. |
| `node scripts/freeholds/crafted_geometry_measure.mjs` and byte comparison | Producer reported exit 0, all ten vertex containment/quarter-turn checks and byte-identical rerun. Exact retained commands and hashes are in geometry-validation.json. |

The initial economy fixture used an array where the real pattern resolver requires a Set. That first probe failed before retaining evidence; the fixture was corrected and all retained measurements were rerun successfully. The reviewer found missing workbook baseline snapshots and incomplete protected-input controls; both were added and remeasured before final review.

Full `node scripts/gate_select.mjs`, original content acquisition tests, i18n/wiki/icon checks and finishing implementation reviewers remain due after owner acceptance and implementation. Nothing in this proposal claims those gates passed. No branch push or commit was made for this calibration work.
