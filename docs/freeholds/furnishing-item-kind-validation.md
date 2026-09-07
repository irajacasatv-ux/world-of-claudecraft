# Furnishing item kind validation

Implementation base: `16f2aeed2be022343291e18ede12cd042cae1fc6` on local
`feature/freeholds`, after the authorized dependency merge. No branch was pushed.

## Coordinator checks

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS, exit 0. The initial type-only run first proved both exhaustive records fail when furnishing is missing. |
| Scoped Vitest command below | PASS, exit 0; 12 files, 447 tests. |
| `npm run i18n:gen` | PASS, exit 0. Six new English leaves; overlays unchanged. |
| Localization Vitest command below | PASS, exit 0; 76 tests passed, 3 existing release-tier tests skipped. |
| Neighbor Vitest command below | PASS, exit 0; 4 files, 253 tests. |
| `npx vitest run tests/furnishing_item_kind.test.ts` | PASS, exit 0; 140 tests after the final unsigned/default-quality assertion. |
| `node scripts/gate_select.mjs` | PASS, exit 0; all 12 steps green. Full-suite fallback: 3676 files passed, 31 skipped; 54864 tests passed, 2 expected failures, 492 skipped. Browser regressions: 39 files, 343 tests passed. |
| `npm run ci:changed` after the final commit | PASS, exit 0; 1426 files checked, no errors. 4294 advisory warnings and 44 informational diagnostics across the branch, including fixture non-null assertions. |
| `git diff --check` | PASS. |

```sh
npx vitest run tests/furnishing_item_kind.test.ts tests/furnishing_tooltip_view.test.ts tests/market_filters.test.ts tests/item_name_color.test.ts tests/recipe_pattern_items.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts tests/mount_tooltip_view.test.ts
npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts tests/release_i18n_tier_coverage.test.ts
npx vitest run tests/bank.test.ts tests/craft_from_vault.test.ts tests/professions_feast.test.ts tests/item_icons.test.ts
```

The full gate includes type/admin checks, environment/server/bot/client builds, generated artifact freshness, SFX checks, and the security scan. Its 31 skipped files and 492 skipped tests are the repository default optional/conditional cases; no requested furnishing suite was skipped. Biome reported branch-wide advisory warnings without errors, including non-null assertions in the new test fixtures.

The three localization skips are the existing explicit release-tier checks. Contributor
catalog work remains English-only. The existing release status-registry and generated
pending-list checks still require zero pending translations; the new M16 exception
requires both an exact declared key and its generated pending membership.

`tests/item_icons.test.ts` is unchanged. The content search for `kind: 'furnishing'`
under `src/sim/content/` finds no records. The heroic generator adds only an eligibility
guard. No GLB, painted image, sampled sound, model export or shipped furnishing ID was
created. The icon fallback uses the existing crate primitive.

The UX manifest was reconstructed from the approved table rows and is byte-identical
at 557 unique entries, including all four owner-02 tooltip rows. No cited count changes.
The complete new English inventory is recorded in progress.md. HUD is 18703 lines,
with its ceiling lowered from 18716; sim.ts, server/game.ts and net/online.ts are untouched.

## Required coverage review and fixes

These initial reports are historical review snapshots; findings listed in them are
closed only by the final fix review, not by a passing test count.

| Required role | Initial report | Fix disposition |
| --- | --- | --- |
| cross-platform-sync | [Cross-platform](reviews/furnishing-item-kind/cross-platform.md) | Malformed capability guards, crafting draw order, real vendor paths, transfer locks and the stack documentation corrected. |
| architecture-reviewer | [Architecture](reviews/furnishing-item-kind/architecture.md) | Successful normal/Jack draws, same-seed replay, all storage lock distinctions, actual unbinding and capacity boundaries pinned. |
| frontend-seam-reviewer | [Frontend](reviews/furnishing-item-kind/frontend.md) | Exact chip English, defensive UI branches, all four live HUD drag handlers, persisted attack slot and heroic marker denials pinned; normal bags/menu, keyboard selection and forced-color control probes passed. |
| test-coverage-auditor | [Test coverage](reviews/furnishing-item-kind/test-coverage.md) | Required/forbidden type fields, live Reliquary discovery, literal rarity/FX values, default-quality unsigned admission, mount branches and both generic maker controls pinned. |
| qa-checklist | [QA checklist](reviews/furnishing-item-kind/qa-checklist.md) | No additional runtime finding; shared gate and post-commit check passed. |
| Fresh reviewer of the entire fix round | [Fresh fix review](reviews/furnishing-item-kind/fresh-fix.md) | PASS. All original findings and nits resolved after reading the complete source, tests, docs, initial reports, 15 screenshots and browser probes. |

All refusal snapshots select the player and assert the initial state is non-null.
The sweep uses a shared synthetic fixture, including the existing market catalog
non-vacuity guard. A normal bar-drop positive control proves the real DOM handlers
and persistence hooks are live. Ordinary bag categories retain All-only furnishing
visibility. Kind rank is 11, after tool 10 and before mount 12.

## Visual evidence and limits

[Visual evidence and exact capture commands](../screenshots/furnishing-item-kind/README.md)
record desktop/mobile filter comparisons, normal bags and Lock menu, keyboard selection,
forced-color control focus, and a real native-hover synthetic tooltip,
including escaped maker text and the procedural icon. Portrait guard images are the
actual unsupported-orientation experience; separately labeled narrow-layout probes
suppress only that guard in browser memory. No portrait gameplay support is claimed.

The capture environment has no local API service, causing existing proxy 502 messages,
and low-preset character preload warnings appear in both versions. These do not affect
the demonstrated controls or icon. Physical-device WebKit and online transactions were
not browser-tested. Standalone Bags retains its existing limited Tab behavior; the
market keyboard path and the bag search-to-chip focus transition are verified. Shared
simulation and protocol coverage remains in the code gates.

## Handoff

Three scoped implementation commits are complete locally: item gates (`83f847e6cb`),
UI (`b98007b01e`), and the final synthetic-consumer test/evidence commit. The required
post-commit `npm run ci:changed` passed with exit 0. This evidence update is folded into
the test commit, followed by another check of that final commit. No branch was pushed.
The paired furnishing QA document is the next task; content, placement commands,
build mode, typed non-floor support and all named external release gates remain outside
this contribution. No external release or legal/economy approval is signed here.
