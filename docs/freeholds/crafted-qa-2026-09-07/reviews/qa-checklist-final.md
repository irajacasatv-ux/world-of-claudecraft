# Fresh whole-fix QA checklist

Coordinator transcription of the final report returned by the read-only reviewer.

## Mode

`FINISHED_DIFF`

This is a **new independent whole-fix assignment** to the existing non-author `database_finish` reviewer. It is distinct from the earlier bounded database-performance PASS. No new reviewer thread was created. This reviewer made no edits and ran no tests, gates, benchmarks or database commands.

Reviewed scope:

- Original implementation: `49ed3f0933..3666d89647`.
- Incoming dependency: `54ce808436`, integrated by `2e24ba8818`.
- Complete repair diff: `2e24ba8818..b379ee462d`, **80 changed files**.
- Repair commits: `ea3b62fad1`, `47655ffb54`, `1be1aef461`, `85f99f6a32`, `5f4821bec7`, `b379ee462d`.
- Final reviewed source: `b379ee462d0cf414f394e01a9a67f88319e56d63`.

Root and applicable directory-local `CLAUDE.md` instructions, the substantive `.claude/agents/qa-checklist.md` criteria, and relevant QA/tooltip skills were applied. The complete repair diff was inspected, including all generated-data changes through semantic comparison. The four planning-file changes were reviewed through the authorized sole-owner reports and proposed final wording; those planning documents were not read directly.

## Verdict

**BLOCK / NOT READY. Phase 04 QA: FAIL.**

All **28 repairs, F02-F29, are independently accepted**. No additional unresolved technical defect or nit was found in the finished repair diff.

**F01 remains an explicit requirement conflict.** The original implementation changes four profession paths while the QA requirement permits none. Preserving station, tier, training-fee and economy behavior does not satisfy that literal restriction. An owner decision is still required; passing validation does not waive it.

The tally is **29 distinct findings: 28 repaired, one open**.

## Workload assumptions

- The authored addition is bounded to ten furnishing recipes and three teaching manuals. Each recipe produces one item, requires skill 50 and has a three-second cast; existing batches are capped at 50 and resolve sequentially. Reagent cardinality is two to six entries, with at most 30 authored reagent units per craft.
- Existing crafting uses one whole vault reservation, not a query for each ingredient. The packet introduces no new SQL, database column, save cadence, background producer or pool configuration.
- Existing autosaves run every 30 seconds with four workers and sweep coalescing. These assumptions describe current paths, not a new scalability guarantee.
- Stored catalog growth is bounded by existing knowledge/discovery/reliquary limits. The measured gear-heavy fixture is a representative budget fixture, not a universal maximum save size.
- Presentation changes run at guide generation/render, tooltip opening and bag-action handling. They add no per-frame DOM work, GPU producer or graphics-dependent gameplay information.
- The timing repair adds 279 attributed CI weights to the existing 3,732-row table. It changes CI planning data, not runtime workload or partition policy.

## Evidence

### Measured evidence

All executions below were performed by the coordinator or explicitly authorized owners and inspected by this reviewer. Historical `/tmp/freeholds-crafted-qa-NAME.log` outputs are archived as `../logs/freeholds-crafted-qa-NAME.txt`.

- **Final gate:** `/tmp/freeholds-crafted-qa-gate-attempt3.log`, source `b379ee462d`, dependency base `54ce808436`, isolated disposable PostgreSQL, `WOCC_EXPECT_PG=1`, six Vitest workers. Actual process exit **0**, with **all 12 steps green**. The unit suite passed **4,028 files and 60,594 tests**, with two expected failures and 27 existing skipped cases, no skipped suite, in **935.59 seconds**. Shared Chromium passed **46 files and 385 tests** in **11.87 seconds**. Generation, i18n/manifest freshness, SFX checks, security, changed-file Biome, typechecks, environment/server/bot builds and client build passed.
- The first formatting-stopped gate and second five-assertion failure remain historical failed evidence. Neither is credited as final validation.
- Targeted regression evidence includes intended failing-before guide, manual-use and mobile paint-order assertions, followed by passing owning suites. Final integration repairs passed **11 files / 134 tests**; touch routing and architecture passed **five files / 328 tests**; mobile toast and existing mobile-loot browser coverage passed **two files / five tests**.
- Both mutation challenges have actual **0 / 1 / 0** baseline, mutant and restored exits. Quartermaster deletion fails the required channel assertion; illegal produce substitution fails the craft-admission assertion. The initial scratch setup error is excluded from accepted evidence. See `../mutations.json`.
- Required persistence, character-state compatibility, profession roundtrip and growth suites passed. The reviewed growth evidence records **213,006 bytes** for the integrated gear-heavy fixture and **1,255 bytes** attributable to this crafted-content packet. The unchanged warning threshold is **229,376 bytes**. Incoming growth is separately attributed.
- `../npc-baseline-measurements.json` and `../npc-probe.ts.txt` establish an independent incoming NPC baseline. The original archive reproduces the old golden; incoming `54ce808436` and merge `2e24ba8818` match across the complete supplied measurement object, including allocator, services, entity count, full projection hash and next RNG value.
- `../missing-weight-measurements.json` and its three reporter logs record **279 files / 3,964 tests passed per run**, no skipped suites, and durations **81.96, 82.60 and 82.62 seconds**. All 279 per-file samples were independently reconstructed from those logs and matched to the committed medians and provenance. The owning four timing/partition suites passed **78 tests**.
- The final combined visual sequence completed with exit **0**, capturing **11 of 11 frames**. It includes Japanese guide pages followed by English manual variants, actual disabled mobile refusal, enabled consumption/learning controls and forced-colors presentation. The four captured source hashes match the reviewed source.
- All **29 retained PNGs** match the portable inventory's dimensions, byte counts and SHA-256 hashes. The reviewer personally inspected representative final narrow English/Japanese guide rows, forced-colors presentation and the decisive mobile refusal frame. The independent frontend reviewer inspected all final frames.

### Static inference

- Merged hosts retain the shared availability predicate and presentation filtering while individual catalog lookups remain complete for owned-item inspection.
- Availability checks precede acquisition, training fees and craft effects. Original station/tier/fee validator behavior remains; this does not resolve F01's raw path restriction.
- `src/sim/professions/recipe_visibility.ts` caches catalog-derived data under the existing append/remove invalidation contract. It stores no player, world or save state. The corrected doctrine describes that narrow existing contract.
- `src/ui/bags_window.ts::runBagAction` reads current strict-true capability before dispatching unavailable manual use and uses the existing localized error seam. Transfer priority and ordinary manual/formula behavior remain.
- `src/styles/hud.mobile.css:7118` places the existing pointer-inert refusal toast above mobile Bags. Desktop stacking, toast duration and chat mirroring remain.
- The guide derives furnishing classification from item kind. It does not special-case one item name.
- Semantic timing-table comparison found exactly **279 additions, zero deletions, zero changed prior weights**, all **187 previous carried records unchanged**, and the **3,545 harvested-file count unchanged**. Every new row has matching samples, median, attribution, reason and UTC measurement date.
- Merge-overlap evidence preserves relevant furnishing behavior while retaining incoming Rift allowlists, rolled-stat comparison rules and asynchronous command outcomes. No conflicting legacy guard was restored.
- Ten-recipe, three-pattern and thirteen-item obligation tables in `../content-evidence.md` agree with reviewed literal coverage and accepted calibration boundaries.

## QA checklist

| Criterion | Result | Basis |
| --- | --- | --- |
| Determinism, purity and focused modules | PASS | Shared guards remain deterministic; catalog cache scope is explicit; independent incoming/merged dark-world fingerprints match. |
| Online/Sim hosts, IWorld and wire parity | PASS | Shared availability projection, complete inspection lookups, strict capability propagation and preserved integrated command outcomes. |
| Authority and security | PASS | Server/simulation admission remains authoritative; UI refusal adds no privilege; required security and command tests pass. |
| Persistence and compatibility | PASS | Required save/load/growth suites pass; no authored schema or cadence change; flag-disable and old-binary rollback are distinguished. |
| i18n and tooltip accuracy | PASS | English plus required five M16 fills; generated output and retired-key registration are correct; existing localized refusal reused. |
| UI seams and rendering | PASS | Focused tooltip/guide modules and existing bag/error seams; no new coordinator logic or per-frame producer. |
| Mobile, accessibility and fairness | PASS within reviewed scope | Actual touch refusal is visible above Bags; hit-testing proves paint order and pointer click-through; shared Chromium suite passes. |
| GPU/content producer requirements | N/A to this repair | No new GPU producer or generated art. Later final-model/hardware gates remain with existing owners. |
| Content obligations | PASS technically; FAIL on F01 | Literal recipe/pattern/item coverage, market conservation and produce controls are accepted; raw profession-path freeze is unmet. |
| Performance and database scaling | PASS for scoped delta | Bounded content growth and unchanged database call topology; no new query, queue, lock or pool claim. |
| Meaningful regression and mutation coverage | PASS | Actual failing-before assertions and two intended 0/1/0 mutations; independent NPC baseline and literal source seals. |
| Final source gate | PASS | All 12 steps passed at `b379ee462d`; 4,028 unit files and 46 Chromium files passed. |
| Final artifact-commit check | Coordinator handoff | Post-verdict, post-artifact-commit `npm run ci:changed` will be recorded in the final receipt. It is not claimed completed here. |

## Findings

### Open finding

**F01: P1, high confidence: literal profession-path freeze remains unmet**

- **Locations:** `src/sim/professions/crafting.ts:379` (`acquireRecipeForRecipe`; additional guards at 846, 1321 and 1510), `pattern_items.ts:152`, `recipe_visibility.ts:5`, and `train_recipe.ts:9`.
- **Requirement evidence:** authorized `explore.md:10`, `:23` and `:126`, plus the sole planning owner's unchanged-clause confirmation.
- **Impact:** blocks acceptance against the explicit scope requirement. It is not a demonstrated database scaling defect.
- **Smallest correction:** obtain the owner's explicit reconciliation, then apply and review the authorized outcome. This reviewer cannot infer a waiver from D85's purpose, preserved mechanics or silence.

No other unresolved actionable finding or nit remains in this review.

### Acceptance of every ledger row

| ID | Adjudication |
| --- | --- |
| F01 | **OPEN.** Literal profession-source restriction requires an owner decision. |
| F02 | **ACCEPTED.** Correct census and seven craft-map plus three explicit station bindings; signed values preserved. |
| F03 | **ACCEPTED.** Four original implementation hashes, dependency and merge are recorded separately from later QA evidence. |
| F04 | **ACCEPTED.** Independent architecture inspection confirms the narrow catalog-only cache contract; no general global-state exception. |
| F05 | **ACCEPTED.** Module maps and comments now identify actual owners, including the previously omitted `src/world_api/professions.ts` lookup/projection distinction. |
| F06 | **ACCEPTED.** Generated kind-based guide classification, accurate prose/tag and required translations; generic furnishing regression retained. |
| F07 | **ACCEPTED.** All five sparse checkouts include the crafted screenshot subtree; exact two-way assertions remain. |
| F08 | **ACCEPTED.** Current comments distinguish 54 manuals and one formula; historical counts remain historical. |
| F09 | **ACCEPTED.** All thirteen actual IDs and ten signed furnishing copies receive decisive market listing/cancel conservation coverage. |
| F10 | **ACCEPTED.** Unknown knowledge is asserted immediately after refusal, before fixture reseeding. |
| F11 | **ACCEPTED.** Cooking and alchemy each have independent malformed-input controls; other crafts remain excluded; actual mutation fails. |
| F12 | **ACCEPTED.** Art prose references accepted v2; shipping bytes remain unchanged. |
| F13 | **ACCEPTED.** Unjustified formatter exclusions removed; remaining sealed-source claims are accurately bounded and completed by F22. |
| F14 | **ACCEPTED.** Historical review prose is readable without changing conclusions or counts. |
| F15 | **ACCEPTED.** Historical pending observations are preserved with distinct final-review attribution. This report supplies the new whole-fix receipt. |
| F16 | **ACCEPTED.** Tooltip and bag hints respect capability; actual Use provides localized refusal before dispatch; final mobile layer is visibly correct and pointer-inert. |
| F17 | **ACCEPTED.** Integrated Rift/wire tests use current APIs, asynchronous outcomes and explicit default/off controls without weakening furnishing denial. |
| F18 | **ACCEPTED.** Armor/ring fixture narrowing preserves the union invariant without casts. |
| F19 | **ACCEPTED.** Four inherited Russian typography corrections retain meaning/numbers and generated agreement. |
| F20 | **ACCEPTED.** Vacuity floors are tied to explicit `ea3b62fad1`: 306 subtrees and 9,404 reference-bearing files. Exact equality remains decisive. |
| F21 | **ACCEPTED.** Two integrated test formatting repairs preserve assertions and literals. |
| F22 | **ACCEPTED.** Three literal path/byte/SHA rows independently rehash actual calibration sources; signed artifacts remain unchanged. |
| F23 | **ACCEPTED.** Both evidence tables now have contiguous header/body structure. |
| F24 | **ACCEPTED.** Every manual seed resets English and LOW state; the real Japanese-guide-to-English-manual sequence passes. |
| F25 | **ACCEPTED.** Superseded guide paragraph is explicitly retired; generation removes only that key from 15 pending locale lists. |
| F26 | **ACCEPTED.** Golden is pinned to independently measured incoming source, with complete allocator/service/hash/RNG and dark/lit assertions retained. |
| F27 | **ACCEPTED.** All 279 additions have three passing measured samples and owning-generator provenance; prior weights and assertions remain intact. |
| F28 | **ACCEPTED.** Distinct candidate preserves the real ten-versus-110 Strength control and exact negative-100 assertion under current comparison policy. |
| F29 | **ACCEPTED.** Composition guard explicitly pins item, identity and current realm capability while tolerating formatting. |

## Required runtime proof

**None outstanding for reviewed runtime source.** The final disposable-PostgreSQL-backed shared gate and Chromium suite passed.

The coordinator still owns the post-artifact-commit `npm run ci:changed` receipt. It must be reported with its actual outcome; this review does not pre-certify a future execution.

No additional PostgreSQL planner, concurrency or load benchmark is required by this bounded delta. Existing queue behavior is not presented as newly proven.

## Clean categories and limits

No scoped finding remains in query shape/count, fan-out, result cardinality, indexes or foreign-key reverse lookups, transaction/lock scope, timeout policy, database driver/engine configuration, pool topology, admission bypass, save cadence, write amplification, stored-growth budget or observability changes.

The inherited vault high-water scheduler only coalesces a microtask burst, and the existing keyed writer does not establish a universal one-pending-save guarantee. Its code and prior reachability are unchanged; ten bounded catalog additions do not justify treating it as a new regression. The earlier database PASS retains this limitation explicitly.

Feature-flag disable preserves the current catalog. Binary rollback to a catalog lacking new discovery/reliquary IDs is already documented as lossy and is not certified.

Final visual evidence retains **65 ambient console entries: 29 local-backend HTTP 502 responses and 36 character-preload warnings**. Attribution is documented. Captures establish targeted guide/manual behavior, not zero-console operation or general 3D loading. Firefox/WebKit, physical-device safe areas and hardware LOW performance are not certified by these captures.

Final GLBs, room/arrival/navigation integration and production numeric signatures remain later owned release gates. No art was generated or production activation approved by this QA.

**Final disposition:** technical repairs accepted; **overall QA FAIL on F01**. Return to the Phase 04 implementation packet for the owner decision and authorized resolution. Do not advance to Phase 05.
