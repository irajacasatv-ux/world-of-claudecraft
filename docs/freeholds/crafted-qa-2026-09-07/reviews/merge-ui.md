# UI merge-conflict resolutions

Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`

Merge inputs: HEAD `3666d89647`, incoming `origin/feature/masterwrought` at `54ce808436`.
Ownership: conflicted non-generated `src/ui/**` files only; no tests, generated artifacts, staging, or commits.

Read the root, `src/`, `src/ui/`, `src/ui/hud/`, and professions `CLAUDE.md` guidance. Compared stage 1, stage 2, and stage 3 changes, and read related history including furnishing boundary fixes `ce0e25ec85` / `ff738f61a1` and upstream action-bar reconciliation work. Kept both feature sets, resolving overlapping statements instead of selecting an entire side.

## Runtime files

- `src/ui/hud/action_bar/action_bar_controller.ts`: Both conflicts are `replaceActions` and `replaceActionsForLoadout`. Preserve the furnishing predicate passed to `sanitizeHotbarActions`, then set upstream `unsavedChanges = true`. The auto-merged attack replacement already combines the same furnishing predicate with that flag. This retains hotbar safety while allowing profile switches to persist changed layouts.
- `src/ui/hud/professions/enchant_apply_view.ts`: Both bagged and worn target conflicts keep `enchantTargetsItem(def, enchant)`, which includes the furnishing boundary, and then retain upstream `RIFT_GEAR_ITEM_ID_SET` rejection. Target pickers therefore continue enforcing the shared kind/slot rule and exclude forge-only rift gear.
- `src/ui/item_compare.ts`: The effective-stat conflict keeps the optional definition and early zero return needed to suppress equipped furnishing power, then retains upstream `CopyStat` handling of rolled core stats, ratings, spell power, and healing power. Both affix/rating loop conflicts use that shared calculation with `equippedPower`, preserving furnishing neutrality while showing rift-band per-copy deltas. Upstream same-copy comparison helpers remain intact.

## Authored data files

Each row below names an exact edited file. The resolution preserves already-authored values from both sides; no translation was written or reworded.

- `src/ui/deed_i18n.locales/ja_JP.ts`: Preserve both homesteader deed records and the incoming Bramblehide set deed. Restore the closing object delimiter between the independent appended records.
- `src/ui/deed_i18n.locales/ko_KR.ts`: Preserve both homesteader deed records and the incoming Bramblehide set deed. Restore the closing object delimiter between the independent appended records.
- `src/ui/deed_i18n.locales/ru_RU.ts`: Preserve both homesteader deed records and the incoming Bramblehide set deed. Restore the closing object delimiter between the independent appended records.
- `src/ui/deed_i18n.locales/zh_CN.ts`: Preserve both homesteader deed records and the incoming Bramblehide set deed. Restore the closing object delimiter between the independent appended records.
- `src/ui/deed_i18n.locales/zh_TW.ts`: Preserve both homesteader deed records and the incoming Bramblehide set deed. Restore the closing object delimiter between the independent appended records.
- `src/ui/i18n.catalog/items.ts`: Preserve both append-only item-id additions and their keyed English names: freehold furnishings/patterns plus incoming Bramblehide and dungeon loot. The two lists remain aligned through APPENDED_ITEM_NAMES, leaving legacy positional names unchanged.
- `src/ui/i18n.locales/ja_JP.ts`: Preserve the hearth navigation, furnishings, pattern names, and furnisher translations together with the incoming realm-builder strings.
- `src/ui/i18n.locales/ko_KR.ts`: Preserve the hearth navigation, furnishings, pattern names, and furnisher translations together with the incoming realm-builder strings.
- `src/ui/i18n.locales/ru_RU.ts`: Preserve the hearth navigation, furnishings, pattern names, and furnisher translations together with the incoming realm-builder strings.
- `src/ui/i18n.locales/zh_CN.ts`: Preserve the hearth navigation, furnishings, pattern names, and furnisher translations together with the incoming realm-builder strings.
- `src/ui/i18n.locales/zh_TW.ts`: Preserve the hearth navigation, furnishings, pattern names, and furnisher translations together with the incoming realm-builder strings.
- `src/ui/reliquary_i18n.locales/cs_CZ.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/da_DK.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/de_DE.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/es.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/fr_FR.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/id_ID.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/it_IT.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/ja_JP.ts`: Preserve hearth basics and crafted-furnishing collection name/prose together with the incoming Bramblehide collection. Restore the closing object delimiter between independent records.
- `src/ui/reliquary_i18n.locales/ko_KR.ts`: Preserve hearth basics and crafted-furnishing collection name/prose together with the incoming Bramblehide collection. Restore the closing object delimiter between independent records.
- `src/ui/reliquary_i18n.locales/nl_NL.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/pl_PL.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/pt_BR.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/ru_RU.ts`: Preserve hearth basics and crafted-furnishing collection name/prose together with the incoming Bramblehide collection. Restore the closing object delimiter between independent records.
- `src/ui/reliquary_i18n.locales/sv_SE.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/tr_TR.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/vi_VN.ts`: Preserve the existing authored hearth-first-crafts name together with the incoming Bramblehide collection name/prose.
- `src/ui/reliquary_i18n.locales/zh_CN.ts`: Preserve hearth basics and crafted-furnishing collection name/prose together with the incoming Bramblehide collection. Restore the closing object delimiter between independent records.
- `src/ui/reliquary_i18n.locales/zh_TW.ts`: Preserve hearth basics and crafted-furnishing collection name/prose together with the incoming Bramblehide collection. Restore the closing object delimiter between independent records.

## Verification and handoff

- Source-only TypeScript AST parse: all 32 edited files parsed with no syntax diagnostics.
- Source-only three-way AST audit: every object row in all 29 data/catalog files matched the stage-1/stage-2/stage-3 merge rule; no competing source values, changed/lost rows, or duplicate rows. The item-id list equals the union of both input lists with no duplicates.
- Evidence: `/tmp/freeholds-crafted-qa-merge-ui-preservation.json`; exact file inventory: `/tmp/freeholds-crafted-qa-merge-ui-files.txt`.
- Inspected `git diff --cc` for all three runtime files after resolving.
- One initial source audit exceeded Node's default child-process output buffer on a large locale file; the completed rerun used an explicit 16 MiB buffer and passed.
- No gate, test suite, build, i18n generation, staging, or commit was run by this worker. Parent owns integrated validation and generation. The parent was notified that source inputs were frozen and safe to regenerate.

Integration coverage to retain in the parent's checks: hotbar replacement and profile persistence, bagged/worn enchanting restrictions for both furnishings and rift bands, and item comparisons including furnishing-shaped invalid equipment with rolled affix/rating payloads. No unresolved semantic decision remains in these conflicts.
