# Freeholds content implementation and paired QA evidence

## Current verdict and scope

Phase 03 implementation and its distinct paired QA are COMPLETE, verdict PASS
locally on 2026-09-07. The final shared gate passed all twelve steps with exit 0.
All specialist source reviews, fresh repair reviews and final visual review pass.
The source commits are recorded below; this evidence closeout is the fourth
completion commit. The final handoff reports the check after that actual last commit.
This record supersedes the historical partial checkpoint in
[content-validation-2026-09-07.md](content-validation-2026-09-07.md).

Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
Branch: `feature/freeholds`. Full content review base:
`3fa4965a3c186982aafd44b3ec9b9d9851ace52d`; completion-round checkpoint:
`6e083002238ee625261a1b832a0e6049f931a432`. Reviews include staged, unstaged and
untracked task files. The original checkout was preserved. Fetch succeeded;
`origin/feature/masterwrought` was already integrated. No push, merge or deployment.

Fernando explicitly accepted the concrete development basis on 2026-09-07:
"Accept this development trial basis". The [acceptance record](content-trial-2026-09-07/acceptance.md)
seals the original six artifacts. The independent [producer replay](content-trial-2026-09-07/revalidation.md)
preserves every accepted economy measurement, fixture hash and geometry value.
This is fourteen laboratory visits, not a claim about measured player hours.
Production approval remains false and the production schedule null. No physical
LOW-device, legal room, final GLB, market/cohort or production calibration claim
is inferred from this development acceptance.

## Promised and delivered

| Surface | Delivered and verified |
|---|---|
| Tier and Charter content | Exact frozen Inn Room/Cottage targets and `freehold_charter_cottage`, without price/copy fields; literal records and prototype/immutability negatives |
| Ledger | Eighteen alternatives, twenty-six distinct material IDs and twelve immutable `freehold-ledger-tuning-v1` bills; produce plus two rotating families, base before fine, positive half-up trial units; all sixty grade positions are ordinary market-listable junk and protected-envelope safe |
| Vendor basics | Exactly eight common furnishings at 250 buy / 60 sell copper, explicit measured stand-in footprints/radii/decor costs, floor-only and without power/use fields; all eight have registered painted WebPs and provenance |
| Furnisher | `freehold_furnisher` appended with exactly those eight stock IDs; excluded before construction on dark hosts; shared bootstrap preserves ordering/RNG and terrain goldens |
| Acquisition and storage | Actual buy/sell/buyback, refusal atomicity, per-copy custody, discovery/illumination, JSON reload with current flag-off config and old-row defaults; honest prior-catalog loss characterization with old positive control |
| Rewards | Manual `homesteader_first_furnishing` / `homesteader_first_cottage` at the deed-order tail, five Renown each, Homesteader title and cosmetic `householder` motif; future gameplay grant sites remain later work |
| Hearth | Actual `hearth_basics` with eight ordinary item relics and vendor source, full shelf/window/source/ARIA/search/pin/completion/i18n/Guide consumers; real unavailable-catalog Overview fallback |
| Localization and art | English and five required non-Latin item/entity/page fills, generated wiki/i18n, eight exact shipping icons, two previously accepted deed crests and the shared motif; final runtime icon review accepted |
| Voice | Exact text greeting retained. The user explicitly deferred its voice as a required pre-shipping task; no fake audio/voice identity or broad coverage exception |

The exact per-item obligation matrix is in [content obligations](content-trial-2026-09-07/reviews/content-obligations.md).
The paired [correctness census](content-trial-2026-09-07/reviews/paired-correctness.md)
records every current and future consumer. The [test inventory](content-trial-2026-09-07/reviews/test-inventory.md)
retains 97 added/renamed title templates across 53 test source files at census time;
this is an inventory, not an executed test count.

Full-span Reliquary totals move from 41 pages / 465 raw / 429 full / 400 character
slots to 42 / 474 / 438 / 409. The intermediate Homesteader-only checkpoint was
466 / 430 / 401 and is not substituted for the full review base. There is no
invented Hearth page ceiling. The maximal raw JSON fixture is 210203 bytes:
furnishings/Hearth add 188 + 444 = 632, while Homesteader 85 and Field Kit 12 remain
independently attributed. The band width and 229376 warning are unchanged.

## Commands and observed results

All commands ran in the worktree above. The coordinator owns execution. Reviewer
reports and earlier checkpoint checks do not substitute for these results.

| Command / receipt | Observed outcome |
|---|---|
| `node scripts/freeholds/economy_measure.mjs --out docs/freeholds/content-trial-2026-09-07/revalidation` | Exit 0; complete measurement payload and every fixture hash equal the accepted artifact |
| `node scripts/freeholds/geometry_measure.mjs > docs/freeholds/content-trial-2026-09-07/geometry-revalidation.json` | Exit 0; all accepted geometry/cost values identical; stronger source guards and explicit parser version |
| `npx vitest run tests/freehold_trial_economy.test.ts tests/freehold_trial_geometry.test.ts` | Exit 0, 17 tests; later positive-floor addition separately passes all 12 geometry tests |
| `npx vitest run tests/freehold_ledger_schedule.test.ts` | Exit 0, five tests after exhaustive ordinary/listable-grade assertions |
| `npx tsc --noEmit` | Initial integrated check exit 0; final typecheck is also required in the shared gate below |
| `npm run wiki:content` and `npm run i18n:gen` | Both exit 0; owning outputs retained, ignored status files not force-added |
| `UPDATE_SHIPPED_ITEMS=1 npx vitest run tests/shipped_item_ids.test.ts` | Owning item-golden update exit 0; exact eight additions, no old ID removals |
| `node scripts/item_art_audit.mjs --verify-only` | Exit 0; 1264 paintings, 1279 definitions, 26 groups, 32 pages and 256 planned sheets |
| `npx vitest run tests/freehold_catalog_rollback.test.ts` | Exit 0, one real restore/serialize characterization, explicitly not an old-binary test |
| `npx vitest run tests/reliquary_empty_shelf.test.ts` | Exit 0, two actual unavailable-catalog navigation/focus cases |
| `npm run test:browser -- tests/browser/vendor_keyboard.browser.test.ts` | Red: two failed / one passed; after fix: three passed. Four related suites: 163 passed |
| `npx vitest run tests/freehold_trial_geometry.test.ts` | Exit 0, 12 tests including all-zero minimum-cost boundary |
| Explicit `biome check` over newly added code and metadata | Exit 0; final invocation supplies 43 paths, checks 38 admitted files, ten non-null assertion warnings and no errors. Four immutable raw measurement JSON files have an independently reviewed exact-path formatter-only override |
| `node tmp/freehold-trial-capture.mjs` | Exit 0; 29 captures, ten state checks, no page errors |
| `node tmp/freehold-trial-capture-supplement.mjs` | Exit 0; ten supplemental mobile captures, no page errors; all eight icons visible after ordinary scrolling |
| `node scripts/gate_select.mjs` | PASS, exit 0, all twelve steps; 57726 unit tests and 376 browser tests passed |
| `npm run ci:changed` after source commit `e1be875782` | Exit 0; 1920 checked files, 5214 warnings, 51 infos and no errors; [receipt](content-trial-2026-09-07/validation/source-commit-ci.txt). The same command runs again after this final evidence commit, with its observed result reported in the task handoff |

Exact fourteen-file acceptance invocation (exit 0, 725 passed / three inherited
release-only localization skips / zero failures; the originally requested twelve
files are included):

```sh
npx vitest run tests/freehold_content.test.ts tests/freehold_ledger_schedule.test.ts tests/furnishing_item_kind.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/market_filters.test.ts tests/architecture.test.ts tests/storage_charters.test.ts tests/server/freehold_wire.test.ts tests/localization_fixes.test.ts --reporter=json --outputFile=/tmp/freehold-acceptance-detailed.json
```

The [durable gate receipt](content-trial-2026-09-07/validation/shared-gate.json)
and [step log](content-trial-2026-09-07/validation/shared-gate.log) record all twelve
steps. Unit result: 3853 passing files, 34 skipped files, 57726 passing tests,
two expected failures and 541 skipped tests. Browser: 43 files and 376 tests
passed. The full fallback includes `tests/guide.test.ts` and
`tests/i18n_completeness.test.ts`, after owning wiki/i18n generation and freshness.
Typecheck, headless/server/bot/client builds and the shared security scanner pass.
The five unrelated screenshot outputs produced by existing browser tests were
backed up under `/tmp/freehold-shared-gate-incidental-captures` and restored to
their unchanged HEAD bytes before scoped staging.

The detailed receipt identifies the three inherited `localization_fixes` skips:
H3b copied-English server DICT, H3b copied-English admin DICT, and S3 recognition
in all twenty-one locales. They run under the existing release tier; no new
furnishing/Hearth case is skipped and they are not counted as passes.

The first full gate exposed six old catalog assertions plus height and chunk
failures from one accidental NPC terrain pad. The pad was removed, not blessed
by a golden remint. Exact repair invocation: exit 0, eight files / 261 tests:

```sh
npx vitest run tests/bag_filter.test.ts tests/crucible_reliquary.test.ts tests/profile_page.test.ts tests/vendor_floor.test.ts tests/exchange_eligibility.test.ts tests/reliquary_state.test.ts tests/terrain_chunk_geometry.test.ts tests/terrain_height_parity.test.ts
```

The separate new terrain regression was red before the correction; five relevant
suites then passed 127 tests with original height/chunk fixtures unchanged. Two
earlier integration failures, the copper-vendor relic exception and source count,
were also repaired without weakening unrelated vendor exclusions.

The art seal was rechecked with:

```sh
npx vitest run tests/freehold_art_admission.test.ts tests/item_art_consistency.test.ts tests/item_art_audit_builder.test.ts tests/masterwrought_art_completion.test.ts tests/item_art_completion_manifest.test.ts
```

Exit 0, four matched suites / 35 passed; the last filename matched no suite. The
four executed suites validate the changed seal/lineage; item icon acceptance is
also included in the exact fourteen-file invocation and full gate.

## Independent reviews and finding disposition

The [deduplicated ledger](content-trial-2026-09-07/findings.md) records 39 distinct
completion-round findings: 39 resolved, zero outstanding and zero deferred
findings. Four are visual evidence VERIFY items. Historical partial-checkpoint
findings remain archived separately and are not added again.

Counts below are per review, not additive: independent reviews revisit some of
the same repairs. All implementation findings and nits are resolved; later
production deliverables are named scope boundaries, not silently deferred defects.

| Required review | Found / resolved / open and retained evidence |
|---|---|
| Paired correctness | 1 / 1 / 0: exhaustive grade kind/listability; [full census](content-trial-2026-09-07/reviews/paired-correctness.md) |
| Paired coverage | 3 / 3 / 0: real unavailable-catalog path, primitive dominance, independent observation identity; [audit](content-trial-2026-09-07/reviews/paired-coverage.md), closed by [fresh review](content-trial-2026-09-07/reviews/fresh-entire-fix.md) |
| Paired hygiene | 2 / 2 / 0: content barrel import and retained-report punctuation; [full audit and fresh closure](content-trial-2026-09-07/reviews/paired-hygiene.md), [gate integrity](content-trial-2026-09-07/reviews/hygiene-and-gate-integrity.md) |
| Producer correctness | 2 / 2 / 0: same-byte source sealing and complete unique rug guard; [audit](content-trial-2026-09-07/reviews/producer-correctness.md), [closure](content-trial-2026-09-07/reviews/content-obligations.md) |
| Finishing content obligations | 2 documentation nits / 2 resolved / 0 open; exact eight-item matrix and all content duties [closed](content-trial-2026-09-07/reviews/content-obligations.md) |
| Finishing architecture | 0 open; [initial](content-trial-2026-09-07/reviews/simulation-initial.md) and independent [fresh terrain/entire-fix review](content-trial-2026-09-07/reviews/simulation-fresh.md) PASS |
| Finishing cross-platform | Two documentation nits fixed; [fresh final PASS](content-trial-2026-09-07/reviews/cross-platform.md), zero open |
| Finishing frontend | 0 source findings; all four visual VERIFY items closed; [review](content-trial-2026-09-07/reviews/frontend.md) PASS |
| Finishing test coverage | 2 / 2 / 0: hide/cloth reuse and independent producer validations; [full original matrix](content-trial-2026-09-07/reviews/test-finishing-full.md) and [closure](content-trial-2026-09-07/reviews/test-finishing-closure.md) |
| Finishing QA checklist | All record findings closed, full reports and final 39-item ledger verified; [initial checklist](content-trial-2026-09-07/reviews/qa-checklist-initial.md), [fresh ready-to-commit closure](content-trial-2026-09-07/reviews/qa-checklist-closure.md) |
| Database performance | Pre-decision and final growth review; zero final findings, [PASS](content-trial-2026-09-07/reviews/database-performance.md) |
| Persistence | Zero defects; compatible-writer/backup activation condition explicit, [PASS](content-trial-2026-09-07/reviews/persistence.md) |
| Security | One flag-comment nit / one resolved / zero open; [PASS including terrain closure](content-trial-2026-09-07/reviews/security.md) |
| Fresh entire fix round | One additional minimum-decor-floor test nit / one resolved / zero open; independently rechecked later grade/config/status repairs; [PASS](content-trial-2026-09-07/reviews/fresh-entire-fix.md) |

Actual behavior repairs are the trusted vendor Enter/Space guard and the unwanted
NPC terrain pad. Catalog tests retain literal, independently justified additions;
no test threshold, terrain golden or gameplay value was relaxed to hide a defect.
Gate-integrity review confirms the four raw JSON paths retain linter/assist/file
inclusion/scanner/test selection, with only whitespace formatting disabled to
preserve accepted producer bytes. No whole-tree release malware audit is claimed;
the required shared security scanner remains part of the final gate.

## Visual evidence

- [Runtime manifest](../screenshots/freehold-content-2026-09-07/trial-runtime/manifest.json):
  29 desktop/mobile/Guide frames plus actual stock, purchases, discovery,
  illumination, pin/unpin, localized search and retained focus checks.
- [Supplement](../screenshots/freehold-content-2026-09-07/trial-runtime/supplement/manifest.json):
  ten mobile frames; the owned Japanese grid shows all eight items below the
  normal fold without the software-render notice. Original obscured headers
  remain separate receipts.
- [Canonical manifest](../screenshots/freehold-content-2026-09-07/trial-canonical/manifest.json):
  fourteen target slots covered by thirteen initial shots plus the one missing
  mobile Overview retry. Original 125/13 console warnings and first target failure
  are retained, not called a clean initial run. No PAGEERROR was recorded.
- [Item-art seal](content-art-2026-09-07/items.accepted-art.json) binds both actual
  runtime manifests. The independent frontend reviewer checked all main PNGs,
  supplemental grid and all hashes. Previous before/after Householder/deed
  world/mobile/forced-color evidence remains in its original accepted directory.

These are software-rendered browser captures and mobile emulation. They do not
measure GPU cost, actual LOW hardware, final furnishing meshes or room legality.
All screenshots use the existing checked-out evidence cone.

## Commit and handoff closure

Four coherent completion commits retain the reviewed work:

1. `a6bf26fad9`, measured trial producers, accepted evidence and replay.
2. `9121f0d94f`, furnishing/bill content, gated NPC, terrain and keyboard repairs.
3. `e1be875782`, Hearth, icons, localization, generated Guide and persistence tests.
4. This record's commit, `docs(freeholds): close verified content and paired QA`,
   retains the full review, command and visual receipts and advances the handoff.

Earlier checkpoint commits remain `1d583786f6`, `add3b7b2d9`, `93710767dd`,
`6e08300223`. The post-source-commit check passed. The coordinator must observe
`npm run ci:changed` exit 0 after the actual final evidence commit and clean
`git status --short` before delivering the final PASS response; that response
records the final hash and result without a self-referential evidence amendment.
All ten intended capture/validation `.log` receipts are explicitly admitted;
ignored generated i18n status files and unrelated screenshots remain excluded.
No push.

Required before shipment: finish the [original NPC voice](content-trial-2026-09-07/furnisher-voice.md),
final CAL-LEDGER-A / CAL-VENDOR-A / CAL-DECOR-A/B / MEASURE-SPACE approvals,
shipping model/room/LOW acceptance, and compatible fleet-wide catalogs plus the
pre-enable backup/rollback boundary. Later upkeep/calendar/prepay and economic
report work retain their planned owners. The trial decision approves none of
those later production results.

The next implementation handoff is:
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-04-content-crafted-and-patterns.md`.
