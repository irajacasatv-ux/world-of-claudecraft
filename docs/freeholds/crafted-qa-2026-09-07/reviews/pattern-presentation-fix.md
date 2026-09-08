# Retained furnishing manual presentation repair

Status: implemented and focused tests passed. Full gate, typecheck, visual capture, and final independent review are coordinator-owned.

## Confirmed defect and mechanic

A retained, unknown furnishing manual on a host with Freeholds disabled advertised a successful learning use when the character already had craft skill 50. The canonical `acquireRecipeForRecipe` correctly refused the furnishing result, and `useRecipePatternItem` restored knowledge and retained the selected copy. The tooltip and bag hint omitted that availability condition. No server or simulation behavior was changed.

The affected authored manuals are `pattern_freehold_clockwork_lamp`, `pattern_freehold_chart_easel`, and `pattern_freehold_jewel_floor_lamp`. Use learns their one drop-acquired recipe and consumes one selected manual only when enabled and the existing skill/knownness gates permit it. Disabled use keeps knowledge and inventory unchanged. The mechanic has no damage, healing, timed effect, stat scaling, or random draw.

## Changes

- `src/ui/hud/professions/recipe_pattern_tooltip_view.ts`: accepts the optional host capability beside the existing character projection. It checks every taught result through the shared `isFreeholdCraftAvailable` predicate and replaces the unavailable Use/skill preview with one red, localized realm-unavailable line. This gate is independent of character snapshot readiness; only strict `true` enables it. The existing model and ordinary pattern/formula rendering remain compatible.
- `src/ui/hud.ts`: forwards `cfg.freeholdsEnabled` through the existing pattern-only tooltip composition. Shortened its explanatory comment while retaining the allocation rationale; the coordinator shrank by two lines.
- `src/ui/bags_view.ts`: projects optional catalog identity and optional host capability. Only the final generic learning hint is suppressed for unavailable furnishing manuals. Trade, mail, market, vendor, guild bank, personal bank, vault, and bank-without-target priorities remain unchanged.
- `src/ui/bags_window.ts`: forwards current capability whenever the lazy row tooltip is opened, so the same row reflects a capability change without depending on a stale captured boolean.
- The three existing owning suites add literal real-manual cases, actual `Sim.useItem` enabled/disabled comparisons, pre-capability and pre-character-snapshot cases, ordinary recipe/collection/enchant controls, all transfer/bank mode priorities, and real `BagsWindow` capability forwarding. Stale pre-shipping comments in the tooltip suite were updated.
- In touched source, removed an unused `ItemDef` type import and applied the formatter's behavior-equivalent optional-chain guard for the existing enchant lookup.

Localization: **no new keys or locale fills**. Reused `apiError.freehold.disabled`: `Freeholds are not available on this realm.` Its established meaning matches the canonical realm opt-in.

## Test-first evidence

Command:

```sh
npx vitest run tests/recipe_pattern_tooltip_view.test.ts tests/bags_view.test.ts tests/bags_window.test.ts --maxWorkers=3
```

Before implementation: exit 1, 3 files failed, **12 failed and 173 passed**. All failures were expected assertions exposing the missing realm warning, advertised bag Use hint, or failure to respond to a same-row capability change. Log: `/tmp/freeholds-crafted-qa-pattern-tooltip-before.log`.

After implementation and final source formatting: exit 0, **3 files and 185 tests passed**. Log: `/tmp/freeholds-crafted-qa-pattern-tooltip-final.log`. A first post-fix run also passed all 185 tests (`/tmp/freeholds-crafted-qa-pattern-tooltip-after.log`).

Formatting:

```sh
npx @biomejs/biome check --write src/ui/hud/professions/recipe_pattern_tooltip_view.ts src/ui/bags_view.ts src/ui/bags_window.ts src/ui/hud.ts tests/recipe_pattern_tooltip_view.test.ts tests/bags_view.test.ts tests/bags_window.test.ts
```

Final invocation: exit 0, seven files checked, no lint warnings/errors. Log: `/tmp/freeholds-crafted-qa-pattern-tooltip-biome-final.log`. An intermediate check caught only a one-line formatting difference after the optional-chain cleanup; the final formatter run resolved it before the final Vitest run.

`git diff --check` for the seven owned paths: exit 0 before final formatter normalization; final diff is whitespace-clean by the same formatter.

## Boundaries

No locale overlay, generated artifact, asset, acquisition gate, inventory mutation, snapshot, command, persistence schema, or shared gate changed. No commit or staging action was performed. The fresh frontend reviewer was notified of the stable source and exact red/green evidence; this implementation report does not substitute for that review or the coordinator's integrated checks.
