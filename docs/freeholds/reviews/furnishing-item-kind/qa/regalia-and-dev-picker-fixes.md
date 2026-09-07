# Regalia and developer picker repairs

Implementation owner: fix_worn_presentation. Scope: Q38 and Q39, with Q40 delegated under the same ownership. The parent owns final tests, typechecks, independent review, commits, and acceptance.

## Q38: legendary regalia

`legendaryRegaliaActive` now considers the equipped ID and its authored kind as well as projected rolled quality. Resolved furnishing never earns the worn-gear promotion effect. Optional equipped IDs and catalog inputs preserve the existing helper API and the existing behavior for missing or unresolved legacy IDs. Eligible armor, weapons, legacy masterwork rolls, and name-stripped promotions keep their prior behavior. The code reads no active rank, custody, chosen name, or actionable combat field.

The existing renderer reference cache moved into `updateLegendaryRegaliaCache` in the same registered pure core. Its state is caller-owned through `LegendaryRegaliaCache`, which EntityView now extends. The cache invalidates when either the instance map or equipped-ID map is replaced, and performs no payload reads when both references are unchanged. The renderer delegates once inside its existing player/alive/preset gates, then retains the same reduced-motion, distance, and pooled-emitter call. No material, particle producer, light, asset, or new scheduling lane was added.

The renderer measures exactly 12,988 lines after formatting, down from 12,989 through this real extraction. The parent is responsible for lowering its exact monolith ceiling to 12988 in the final integration.

`tests/furnishing_regalia.test.ts` adds seven cases: four furnishing payload variants with armor/weapon controls and zero emitted dt; a mixed gear/furnishing and unresolved-legacy case; equipment-map replacement with a shared instance reference; and cache-hit zero-reread plus instance-map replacement. The existing `tests/legendary_regalia.test.ts` cache/purity pins now follow the extracted delegation while retaining the emitter, fairness, reduced-motion, dead-player, wire, and pooled-resource checks.

## Q39: developer item picker

The existing candidate projection hides furnishing's inherited or malformed slot and generated-Heroic fields. Its authored display name, quality, and exact ID remain visible and selectable. Eligible generated Heroic armor keeps both its slot and Heroic tag.

`tests/furnishing_dev_picker.test.ts` exercises the real DevCommandWindow DOM, input event, exact-ID suggestion, row selection, and command dispatch. It asserts no furnishing tags, the authored furnishing name and rare class, both eligible armor tags and epic class, and the literal final `/dev give probe_furnishing_dev_picker 1` command. Catalog preservation compares with a structuredClone captured before the flow, rather than the installed object itself.

## Q40: profession effect card

The delegated fix excludes furnishing before the existing charm cache admits a use-based candidate. The complete report is `furnishing-tool-effect-fix.md`. The parent implementation owner inspected the one-line source change and both literal color regressions with real eligible charm controls.

## Validation handoff

The parent ran `late-presentation-red.log` before these production patches: exit 1, nine failures and one passing control. The original active helper, developer tags, and both effect-card colors reproduced the reported defects. Two cache cases awaited the planned extracted API.

Worker formatting completed with exit 0 over these explicit paths:

```sh
npx @biomejs/biome format --write src/render/legendary_regalia_core.ts src/render/renderer.ts src/ui/dev_command_window.ts tests/legendary_regalia.test.ts tests/furnishing_regalia.test.ts tests/furnishing_dev_picker.test.ts
npx @biomejs/biome format --write src/ui/tool_effect_tooltip.ts tests/furnishing_tool_effect_tooltip.test.ts
```

The Q39 snapshot nit was then corrected and its two paths formatted successfully. Scoped `git diff --check` passed. No worker test, typecheck, stage, commit, push, generated-file edit, locale edit, or asset generation was performed. The patches are ready for the parent's passing execution and independent review.

The parent subsequently ran the final presentation selection: four files and 40 tests passed. Its typecheck then caught the missing renderer ITEMS import; the existing sim/data import now includes it, and final renderer formatting exited 0 at 12,988 lines. The parent owns the following typecheck and gate.
