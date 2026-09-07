# Furnishing item-kind packet context and independent census

Read-only Explore report. Scope is the original implementation, frozen at `16f2aeed2be022343291e18ede12cd042cae1fc6..c47e2cb24519be7df37e8664b9d2d61756e2ce4a`. The parent is independently merging current upstream and owns final checks. No repository file was edited, no test/build/generator was run, and no remote state was changed by this reader. This report does not award QA PASS.

## Early preflight and immutable diff boundary

- Packet worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`; branch `feature/freeholds`; original HEAD `c47e2cb24519be7df37e8664b9d2d61756e2ce4a`. Its initial `git status --short` was empty. The initial supplied `add-real-estate` checkout does not contain `docs/freeholds/state.md`.
- While dependency PR #3872 is OPEN: fetch origin with prune and merge fresh `origin/feature/masterwrought`. Once MERGED: discover newest `origin/release/**`, compare/merge it, and remove the dependency block. Run release-merge-audit after a nonempty merge; run `pnpm install --frozen-lockfile` first if `patches/` changed.
- Parent subsequently reported PR #3872 OPEN at `d3dcdaa4af18f960232196eb461e1e17233fccdb` and is handling that nonempty merge. This report deliberately continues against the frozen original furnishing tip.
- Original commits: `83f847e6cbea3adc7bc8d765325c095a1411faf1` item gates, `b98007b01e2631c14067201a9731b873a242ed44` UI, `c47e2cb24519be7df37e8664b9d2d61756e2ce4a` consumer tests/evidence. All three have scoped Conventional Commit subjects and bodies, with no forbidden word or dash in their messages.
- Original diff: 107 files, 3771 insertions, 95 deletions. Full log and stat are in `original-log.txt` and `original-stat.txt`. The complete original diff for every touched file, including binary-added markers and all generated variants, is preserved in `original-implementation.diff`.

## Promised versus delivered

| Promise | Delivered at original tip | Check that must run / remaining evidence |
|---|---|---|
| Deliverable 1: narrow furnishing type and complete gates | `ItemKind` member, `FurnishingItemDef`, `ItemDef` union arm and `OtherItemDef` Exclude are present. Required nested width/depth/r/decorCost/floor surface; optional plinth. Inherited stat/rating/slot/weapon/use/feast/stack/consumable/bag/riding/set/Masterwrought fields are optional never. | Full tsc and scratch compile-rejection probes are required by this QA. Original type tests contain expect-error assignments and mapped required/never assertions; source-only catchall pin is not the requested independent scratch proof. |
| Every refusal excludes furnishing without mutation | Explicit gates exist for equipment/target slot/equip/use, disenchant/admission/reagents, salvage/admission, sunder, Perfecting identity/view/attempt/bonus, apply-enchant admission/resolve, commission/unbind, gather/fishing/tool-effect identity. | Original tests observe literal false/null/reason outcomes and real state snapshots/RNG for mutating operations. Most refusals lack the newly required same-call eligible-kind success controls, see C1. |
| Crafting admits cosmetic furniture and cannot create power | `craftBonusStatsFor` null, signer rarity preserved, Perfecting head-start furnishing guard after existing draws. Heroic synthesis positively narrows gear candidates before synthesis. | Original synthetic craft pins signer-only payload, normal/Jack one/two draws, forced power proc exclusion, same-seed replay. Heroic synthesis has ordinary gear control. Parent must preserve guard if upstream moved bonus ownership. |
| Storable and tradable, quest refusal untouched | New pure `isStorableItemKind` shared by bank, guild bank, trade, mail and both World Market listing entry points. All old kind results preserved, including old unknown runtime fallback. Copy locks remain pipe-specific. | Actual bank/guild deposit and withdraw, mail send/take, trade transfer, market list/cancel tests exist; lock matrices observe source/destination/currency. Rerun after merge. |
| D25 Exchange eligibility | Furnishing maps to mount eligibility bucket, every rarity and absent rarity accepted, existing allowMounts policy applies, def soulbound tolerated, copy locks/noMarketList retained. Browse remains other and subcategory null, so no mount riding identity. | Synthetic tests exercise real server `listingEligibility`, exact policy refusal and hard-lock tokens. This is locked and must not be reopened. |
| No item level or power budget | Explicit item-level false, score/stat sum zero, slot stat multiplier undefined; raw slot budget zero because required type bars slot. | Original tests pin outputs, though many pure no-power leaves lack a positive gear control. |
| Reliquary remains eligible | No furnishing exclusion was added. Existing only-pattern exclusion remains. | Test calls real Sim.addItem, observes actual discovery set, repeat grant does not grow set, and drives synthetic page/catalog completion plus empty-set negative. |
| Deliverable 2: presentation, filtering, fallback | Both exhaustive records carry furnishing. Sort rank 11 immediately after tool 10 and before mount 12; later ranks/tails shift preserving all old relative order. Shared kind label Furnishing, market Furnishings chip with shared runtime filter; no secondary gear controls. | Full literal sort order and market query tests are present. `market_filters.test.ts` injects synthetic def into the existing real consumer census rather than fabricating a shipped ID. |
| Ordinary bags All-only | Bag category roster unchanged; explicit All-only furnishing matching and ordinary action none; no ordinary use hint, context lock/unlock only; transfer modes retain precedence. | Literal category roster, All-only match, search negative, real BagsWindow no-dispatch/no-repaint, storage/trade/mail/market action tests exist. |
| Furnishing never sits on action bar or paperdoll | Controller assignment and direct normal/loadout/attack replacement exclude furnishing; init removes persisted furnishing action. Paperdoll refuses. | Unit negatives exist; happy-dom suite exercises four real Hud drag/drop routes with same-listener eligible mount success control, zero persistence and preserved neighbors. |
| Procedural icon fallback | Existing wooden crate primitive is selected before junk name cascade; quality effects preserved. No new asset output. | Synthetic name Steel Side Table deliberately exercises eel-substring trap; literal wood/earthBrown/crate and rare/epic FX asserted. Unchanged item_icons suite must run for orphan WebP check. |
| Deliverable 3: pure housing core and tooltip | New housing barrel/local CLAUDE, type-import-only core returning four discriminated key/value rows, thin formatter/composer, HUD insertion and furnishing-specific generic-maker suppression. Mount tooltip extracted to pay HUD budget. | Four key-specific English/value tests, altered width/depth/zero cost, optional/copy-only signer, escaping, actual HUD one-maker/lock and ordinary crafted/gathered controls exist. Potential heroic-tag inconsistency remains C3. |
| Core architecture and monolith ratchet | Furnishing core and mount helper registered in UI_PURE_CORES; HUD ceiling reduced from 18716 to 18703, matching original file. Housing guidance accurately states pure model/thin composer. | Architecture, HUD drive, monolith and UI smoke suites must run. Furnishing core has no DOM/Three/i18n import. The mount helper intentionally imports i18n runtime; architecture's DOM-free classification permits that, so do not mistake mount helper for the stricter furnishing model. |
| Exact English inventory and regeneration | Exactly six English additions, four housing leaves below plus two shared labels. Generated translation-key and resolved bundles reflect them. Locale overlays untouched. | npm run i18n:gen plus status freshness; S3/i18n tests. M16 exemption is positive exact-key AND generated pending membership, independently negative-tested; release pending enforcement remains active. |
| UX key manifest | Four owner-02 rows already existed among 557 approved rows; original evidence records deterministic table reconstruction byte-identical, so no committed manifest diff is expected. | Reconstruct and compare in this QA if accepting by a check that ran. Parser must retain nonnumeric owner labels rather than digits-only selection. |
| No shipped furnishing/content/art | No furnishing kind record exists under src/sim/content. Heroic generator narrowing is the sole content-directory edit and adds no ID. PNGs are browser evidence, not asset generation. | Run content grep and unchanged item_icons. No GLB/icon/WebP/SFX generation is authorized or needed by this packet audit. |

## Approved English inventory and source-only measurements

| Key | Exact English | Source of interpolations |
|---|---|---|
| itemUi.kind.furnishing | Furnishing | shared kind label |
| itemUi.market.filterTypeFurnishing | Furnishings | market chip label |
| hudChrome.housing.furnishing.footprint | Footprint: {width} by {depth} cells. | furnishing.footprint.width/depth, no fallback |
| hudChrome.housing.furnishing.decorCost | Decor cost: {cost}. | furnishing.decorCost, including zero, no fallback |
| hudChrome.housing.furnishing.surfaceFloor | Placed on the floor. | required literal surface floor |
| hudChrome.housing.furnishing.maker | Made by {maker}. | optional individual ItemInstancePayload.signer only |

The source manifest says Wave A movable furnishings use floor placement; rugs require r zero and walk-through underlay semantics, solid furniture requires measured collision/clearance, and later advanced editor owns measured parent surfaces. Decorative chest is not bank/vault authority; table setting is not a feast. Every quantity and price uses the approved numeric worksheet. This type-only contribution must not fabricate footprint, radius or cost defaults for future source IDs. The core directly forwards authored values and does not calculate dimensions from model appearance. r is mandatory even though collision activation is later work; zero means walk-through. Build-mode decorTooltip and build.surface are different sinks and must not replace these four keys.

## Independent census

Detailed census: `/tmp/freeholds-02-audit/consumer-census.md`. Required grep captures 1483 matches across src/sim, src/ui and server excluding src/sim/content. Most are non-item entity/event discriminants. Related ItemKind equality/inequality/switch/set scan captures 273 exact sites; every site is marked TOUCHED or UNTOUCHED-BY-DESIGN with its reason, zero unclassified/MISSED enum sites.

The apparent `switch (def.kind)` in professions/tools.ts is TOOL_EFFECTS' quantity/quality/respawnSpeed union, not ItemKind. Actual `.has(def.kind)` sets are bags.UNSTACKED_KINDS and sundering.SUNDERABLE_GEAR_KINDS, both guarded. Positive bag-only, mount-only, food-only, quest-only and gear-only selectors remain correct without adding redundant branches. RL obs selects food/drink; pet feed selects food; store/custody mount identity must remain actual mount-only despite shared Exchange eligibility bucket. Generic storage and signed-copy transport carry IDs and payloads rather than a second kind vocabulary.

Additional property-based consumers need correctness review beyond text census. C3 below is such a site; do not interpret zero unclassified enum sites as proof that all property consumers are safe. Existing equipment load/instance projection and ClientWorld facade behavior need runtime audit under the user's stronger instance/parity additions.

The following source consumers are outside the literal scan yet explicitly delivered: KIND_RANK, ITEM_KIND_LABEL_KEYS; shared `isStorableItemKind` callers bankDeposit, guildBankPipeRefusal, tradeSetOffer, PostOffice.send, Market.list and Market.listInstance; strict furnishing metadata core; market type vocabulary/menu label and action-state sanitizers. The original full diff captures each one.

## Every added test and exact assertions

`/tmp/freeholds-02-audit/added-test-assertions.md` contains all 128 original it/it.each source blocks from furnishing_item_kind, furnishing_tooltip_view and mount_tooltip_view, including their exact assertions, fixtures and any controls. Parameterized blocks expand into the reported 140 furnishing-kind tests, 17 furnishing tooltip tests and four mount helper tests. This is an assertion inventory, not fresh execution evidence.

Other touched test pins:

- `tests/market_filters.test.ts`: no new it; beforeEach inserts cloned synthetic FURNISHING, afterEach removes it, literal filter roster adds furnishing. Existing per-filter nonempty catalog census drives exported marketItemMatches and thus private itemMatchesType. The dedicated synthetic suite pins All plus exactly furnishing, search/rarity negatives and hidden gear filters.
- `tests/item_name_color.test.ts`: existing quality loop now includes furnishing. The dedicated suite supplies literal colors for every quality/default/hostile value so this addition does not rely only on QUALITY_COLOR self-comparison.
- `tests/architecture.test.ts`: UI_PURE_CORES adds furnishing model and mount helper; existing structural tests scan both.
- `tests/monolith_budget.test.ts`: only HUD ceiling lowered to 18703.
- `tests/i18n_completeness.test.ts`: two new it blocks assert true only for declared pending maker key, reject outsider/suffix/empty/other-domain keys, and reject a declared key absent from pending. The production M16 exclusion uses that positive predicate, not a blanket namespace exemption.
- `tests/fixtures/furnishing_item.ts`: synthetic ID test_furnishing_consumer, name Steel Side Table, rare, sell 25/buy 100, width 2/depth 3/r zero/cost 7/floor. Never shipped content.
- `tests/item_icons.test.ts` has no original diff. It retains committed WebP orphan checking and must run as required acceptance.

## Coverage findings, including uncertain ones

C1. Confirmed coverage gap, medium/high confidence: most kind refusal leaves and command/resolver tests have no same-call eligible-kind success control. Examples: canEquipItem/resolveEquipSlot/slotAcceptsItem/equipItem/useItem, resolve/evaluate disenchant and salvage, extractEssence, resolvePerfectingAttempt, resolve/evaluateApplyEnchant, unbindItem, gather/fishing/tool-effect leaves, direct action setters. They often pin exact refusal plus state/RNG, which is useful, but would not catch an implementation replaced with unconditional refusal. The user explicitly requires both cases. Existing heroic/apex controls, vendor capacity control and four real bar listeners already have qualifying controls; do not duplicate those blindly.

C2. Confirmed coverage/wording gap, medium/high confidence: the synthetic consumer suite imports Sim only, never ClientWorld. The test named `has no Perfecting view over either host mirror` calls shared perfectingInfoFrom once using offline metadata; it does not invoke either facade. The original fresh review accurately notes this limitation, but the title overclaims. No furnishing-driven ClientWorld or serializer/load proof was found in the original changed tests. This QA explicitly demands client-visible facade parity; add actual evidence and correct any still-overclaiming title.

C3. Potential presentation correctness gap, low/medium severity, high source confidence but not runtime-probed by this reader: FurnishingItemDef inherits optional heroic/heroicOf fields. New marketArmorBadge.isHeroicItem explicitly returns false for a furnishing carrying either flag, and tests pin no star, but Hud.itemTooltip directly appends the HEROIC tag whenever item.heroicOf || item.heroic without calling that predicate or excluding furnishing. A type-valid furnished def with heroic:true can therefore disagree between market and card. Correctness auditor received this and should reproduce, then choose the shared appropriate predicate or type contract consistently. This is a property consumer outside the enum census.

C4. Evidence limitation, low severity rather than runtime defect: manifest reconstruction proof is currently prose and temporary handoff evidence, with no stable exact reconstruction command in the committed validation report. Since QA requires each acceptance checkbox to be verified by a command that ran, the parent should run and record a deterministic owner-02 manifest comparison rather than merely inherit prose saying it was byte-identical. This does not require a new generator framework.

C5. Confirmed runtime defect reported by parent during integration, high severity: parent independently reproduced a furnishing injected into saved equipment granting rolled strength on load. This path is outside the original literal kind census: current Sim.addPlayer assigns `meta.equipment = { ...s.equipment }` (sim.ts) and restores equipment-instance payloads; entity stat computation consumes equipped IDs/payloads. Direct equip/use rejection does not establish save/load exclusion. The parent owns reproduction and repair; final census must explicitly include saved-equipment admission plus instance stat consumers and prove no furnishing instance can grant power. This is not zero-MISSED completion until the runtime path is resolved.

Merged location spot-check (read-only after parent merge): `src/sim/professions/perfecting_bonus.ts::perfectedBonusStats` now owns the function and currently has the furnishing-null guard; perfecting.ts imports/re-exports it. `src/game/offline_world_config.ts` currently sets `freeholdsEnabled: options.world === undefined`, preserving the locked stock/custom policy. Review `perfecting_swap.ts` and `item_instance_stats.ts` as new incoming property/instance consumers; original fixed-tip tests did not cover them.

No newly added TODO, debug branch, forbidden word in executable added code/comments/commit messages, or clear unused import was found in the original inspected source diff. Historical reviewer docs contain the word as scope discussion; that is not an executable source addition. The housing local CLAUDE is present and accurate. Generated-artifact authorship cannot be proved from a diff alone; fresh owning regeneration is the requested decisive evidence. No locale overlay is touched.

## Acceptance checklist and exact validation commands

Every row remains pending this QA's actual command evidence; original reports are historical only.

1. Full tsc clean, furnishing in both exhaustive records and OtherItemDef Exclude; independent scratch file furnishing+use rejected and missing r rejected.
2. Market/color/furnishing suites green; all refusal negatives plus required same-call controls; D25 pinned.
3. No furnishing source content def; item_icons unchanged and green with no orphan WebP.
4. Housing model in UI_PURE_CORES, pure imports; HUD ceiling lower than original baseline and actual merged count within pin.
5. S3/i18n complete for the exact six English leaves, four approved values byte for byte; owner-02 UX manifest deterministic/fresh; no locale overlay edit.
6. Full required suite matrix green, all five specialist reports delivered for COVERAGE, every finding resolved and entire fix round independently freshly reviewed.
7. QA census zero unclassified/MISSED sites after integration; any newly found property gate resolved and census updated.
8. Separate scoped fix commits reviewed, verdict commit separate, post-last-commit ci:changed exit zero; no push or PR merge.

```sh
npx tsc --noEmit
npx vitest run tests/furnishing_item_kind.test.ts tests/furnishing_tooltip_view.test.ts tests/market_filters.test.ts tests/item_name_color.test.ts tests/recipe_pattern_items.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts
npm run i18n:gen
git status --porcelain
npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts
npx vitest run tests/bank.test.ts tests/craft_from_vault.test.ts tests/professions_feast.test.ts
npx vitest run tests/item_icons.test.ts tests/mount_tooltip_view.test.ts tests/release_i18n_tier_coverage.test.ts
node scripts/gate_select.mjs
npm run ci:changed
```

The original implementation report bundled the extra mount, icon and release-registry suites into adjacent calls; the required original STEP 3 minimum is the first primary/localization/neighbor list above. Scratch compiler tests, content grep, UX reconstruction and any added host parity/visual checks supplement these. Parent runs deterministic commands once; reviewers inspect evidence.

## Required reviewer dispatch and ledger handoff

Exact minimum: cross-platform-sync (registered woc_cross_platform), architecture-reviewer (woc_sim_architecture), frontend-seam-reviewer (woc_frontend), test-coverage-auditor (woc_test_coverage), then qa-checklist using the contribution checklist prompt/skill. Independent correctness, test coverage and hygiene readers are additionally required for this QA. All receive COVERAGE and write reports to files. Wait for all, apply all findings including nits, then have a fresh independent reviewer read the entire fix round. Database performance before decisions and after final diff is mandatory if the merge/fixes introduce relevant SQL, callers, stored-shape/growth or resource surfaces; pair persistence/security when applicable.

Update progress row `02 QA` with PASS/FAIL, found/fixed counts and fresh review evidence; update state ledger/seam notes to actual final paths. Original row02 names item_storage_rules, housing barrel/core/composer/local guidance, mount extraction, synthetic fixture and three test files; no IWorld/events/wire/endpoints/tables added. Original current-next marker is paired QA; successful completion changes next to `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-03-content-tiers-and-basics.md`. FAIL stops and directs rerun of `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-02-furnishing-item-kind.md` with findings.

State source assumptions affected by current upstream movement: offline-world flag policy remains stock world enabled and custom/editor world dark (`world === undefined`), even if configuration moved from main.ts to game/offline_world_config.ts; Perfecting bonus furnishing refusal must move with actual bonus owner into professions/perfecting_bonus.ts if upstream extracted it. Do not preserve a stale ledger path as if it still owns live behavior.

Named unsigned release artifacts are separate activation/submission gates, not deferred review findings: economy authorization/catalog/settlement; counsel/Terms/storefront; optional deed territories/authority; numerical approval/calibration; lifecycle/calendar/rollout; final assets; distribution/runtime enablement. This QA does not sign them.
