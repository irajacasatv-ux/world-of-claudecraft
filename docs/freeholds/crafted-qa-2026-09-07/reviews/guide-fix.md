# Provisioning guide furnishing repair

Scope: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, merged base `2e24ba8818`. The initial independent content-obligations report at `/tmp/freeholds-crafted-qa-content-obligations.md` is preserved unchanged. This follow-up switched roles to implementation owner for the explicitly assigned guide repair only.

## Changed behavior

- `scripts/wiki/build_content.mjs:1386` derives each cooking output's `furnishing` boolean from its live `ItemDef.kind`, and the generated provisioning type requires that boolean (`:1757`). No item-specific classification list is introduced.
- `src/guide/pages/professions_provisioning.ts:99` renders ornamental furnishing rows with their translated tag. The existing meal, feast and field-station rendering arms remain intact. The ladder uses the new prose key at `:113`.
- `src/ui/i18n.catalog/guide.ts:3403` adds accurate prose explaining meals, feasts, field stations, and furnishings. The old key remains for translation history but is no longer rendered. `:3407` adds the self-contained tag, including its brackets.
- New `tests/guide_provisioning.test.ts` tests the actual generated Set Supper Table classification, checks every generated output against the live item kind, renders the real page with literal expected furnishing/no-food-or-buff prose, preserves edible/feast/station examples, and injects another classified furnishing to reject a supper-table-only rendering special case.

No locale overlays, generated files, assets, staging, commits, or unrelated source files were edited by this worker. The parent owns the mapping navigation nit and all integration.

## New English keys for parent-owned M16 fills

`guide.profPages.prov.furnishingTag`:

```text
(ornamental furnishing, not eaten)
```

`guide.profPages.prov.ladderBodyFurnishings`:

```text
Cooking recipes include meals, feasts, field stations, and ornamental furnishings. Meals are eaten from your bags, and some leave a lasting buff. Feasts are set on the ground for nearby players to share. Field stations let you cook away from town. Furnishings decorate a Freehold and give no food or buff.
```

Both new keys require the five same-change M16 fills; these were communicated to the parent before regeneration.

## Validation evidence

Test-first command, run by parent before production changes:

```sh
npx vitest run tests/guide_provisioning.test.ts --maxWorkers=4
```

Result: **1 file failed, 3 tests failed for the intended missing classification, tag, and prose**, log `/tmp/freeholds-crafted-qa-guide-before.log`, start 16:44:23, duration 1.34s. The worker read the log and received parent confirmation before editing production.

Post-fix validation is parent-owned. Requested sequence: add five M16 locale fills; `npm run wiki:content`; `npm run i18n:gen`; rerun the exact test command above, followed by the parent's guide/i18n/typecheck/final gates. No green result is claimed until current output is supplied.

The regression covers real generated data and the real page, not only a mock. An independent final review should reassess the original P2 after those steps. This change adds no game mechanic, power, or production activation and does not alter the final-art/room/LOW release gates.
