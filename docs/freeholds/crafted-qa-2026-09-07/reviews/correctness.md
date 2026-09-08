# Crafted furnishings correctness audit

Read-only auditor report for `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.

Scope: original `49ed3f0933..3666d89647` plus current merged-candidate source as inspected on 2026-09-07. Root/local CLAUDE guidance was read. Planning evidence came from `/tmp/freeholds-crafted-qa-explore.md`; planning documents were not opened directly. The original range changes src/sim and is in scope. Parent owns merge resolution and all deterministic executions. No source, test, asset, index or commit was changed by this auditor. This report is the only created artifact.

Gate status: **PENDING / cannot certify PASS**. Source inspection found no concrete new gameplay defect in the ten furnishings or three acquisition routes. A literal requirement conflict remains for coordinator adjudication, current test commands have not been supplied to this auditor, and the complete fix round remains to be reviewed. No tests or gates were run here, as instructed.

## Findings and adjudication items

### C1. Low severity, high confidence: channel comments state a stale universe

- `tests/apex_pattern_channels.test.ts:18` describes all 55 kind:recipe items as each teaching a drop-acquirable recipe. The same suite at `:675` correctly handles one enchant formula (`formula_lastflame_zeal`) separately. The actual truth is 54 recipe-teaching items covering 76 recipes, plus one enchant formula, 55 teaching items total.
- `tests/apex_pattern_channels.test.ts:120` says "The 28 shipped pattern ids" immediately above a Set built from every current kind:recipe definition, which has 55 members.
- The assertions at `:177`, `:191`, `:198`, `:199`, `:679` and `:680` are correct: 76 drop recipes, disjoint family counts 10/10/13/6/1/33/3, 55 teaching items, 43 non-Crucible items.
- Remediation: correct those present-tense comments to the current recipe/formula split and remove the obsolete 28 literal. Preserve the seventh furnishing family and existing Crucible coverage.
- Attribution: a stale comment in a deliberately touched contract suite, not a runtime channel leak. Parent has been notified; deduplicate with hygiene findings.

### C2. Low severity, medium confidence of actionable defect: new static-catalog cache conflicts with the documented memo rule

- `src/sim/professions/recipe_visibility.ts:5` and `:6` introduce process-global mutable projection/count state; `:11` invalidates only when `ALL_RECIPES.length` changes.
- `src/sim/CLAUDE.md:403` sanctions identity-keyed WeakMap output memos over revisioned live state or frozen content, with exact uncached equivalence and identity/isolation tests. The mutable-content warning at `:148` treats memoization over unfrozen content as hidden sim state.
- This new helper deliberately follows `recipeById`'s existing append/remove invalidation contract, and its supported operations are tested in `tests/recipe_visibility.test.ts`. No current player-reachable catalog mutation, cross-Sim gameplay divergence, or draw-order defect was established. A same-length replacement or edit can nevertheless leave a stale dark projection while the lit list sees the live catalog.
- Remediation: reconcile the explicit static-catalog memo contract and supported invalidation/immutability with canonical guidance, or change the projection to an owner-scoped/pure form while retaining the existing presentation identity requirements. Do not blindly replace it with a per-read allocation without checking the UI consumers.
- Attribution: original feature addition, architectural uncertainty for coordinator adjudication, not a verified live gameplay regression.

### C3. Requirement conflict, high confidence, coordinator duplicate

- The original professions diff is nonempty: crafting.ts +11/-1; pattern_items.ts +3/-6 comments; new recipe_visibility.ts 18 lines; new train_recipe.ts 30 lines.
- The task literally requires no edits anywhere under src/sim/professions. The D85 host-off guards are at `src/sim/professions/crafting.ts:379`, `:846`, `:1321`, `:1510`; training availability precedes fee charging at `src/sim/professions/train_recipe.ts:13`.
- `training.ts`, `stations.ts`, `content/professions.ts`, and `sim_context.ts` have an empty original-range diff. `evaluateCraftAdmission` is unchanged. The new behavior is host availability, not an altered station/tier/fee gate.
- Remediation: coordinator must record the user's reconciliation of literal path freeze versus D85 before PASS. Do not revert legitimate default-off guards merely to obtain an empty diff.

### C4. Coverage/evidence limitation, high confidence, coverage-auditor duplicate

- Every authored furnishing passes the production market admission by source: `src/sim/market.ts:549` and `:721` resolve its live def, accept the storable kind, and reject only existing definition/copy locks. The ten crafted defs have none of the forbidden definition flags and craft signer-only payloads.
- `/tmp/freeholds-crafted-qa-explore.md` claims a real 13-ID listing cohort in furnishing_item_kind. That claim is inaccurate: `tests/furnishing_item_kind.test.ts:1394` and `:1405` use the injected FURNISHING fixture ID; `tests/furnishing_commerce_parity.test.ts:295` also exercises synthetic ID and gear control, not the authored 18-item cohort. Coverage auditor independently confirmed this.
- Existing closed-shape data pins plus kind-level commerce tests establish sound behavior by composition. They do not establish the literal "every furnishing was listed" execution claim.
- Remediation: correct the evidence wording and, if every-ID execution is required for R18 acceptance, add/run a compact authored furnishing listing/cancel cohort, including signed crafted copies. This is not a production market eligibility bug.

## Verified correctness coverage

All rows below are source verification unless current command output is separately attached by the parent.

| Surface | Evidence and conclusion |
|---|---|
| Ten crafts, once each | `content/freehold/furnishing_recipes.ts:5` contains ten records, corresponding exactly to `furnishings.ts:18`. Ordered crafts are weaponcrafting, armorcrafting, tailoring, leatherworking, engineering, alchemy, inscription, jewelcrafting, cooking, enchanting. Canonical recipe merge appends the family; identity tests are furnishing_recipes:47. |
| Existing stations | Seven map-served crafts match `content/professions.ts:536`. Existing explicit foreign station bindings are forge jewelcrafting, apothecary inscription, toolworks enchanting; the signed manifest reported by explorer authorizes those. No new station type or station admission was introduced. `training.ts:96` uses explicit station then map fallback. Craft gate `crafting.ts:675` retains static/own mobile/party-shared mobile order. |
| Exact signed bills and numbers | All ten source bills match the explorer's signed CAL-RECIPES-A table, each resultCount1, skillReq50, budget20, level15. All three patterns match CAL-PATTERNS-A: rare, sell100, marks16 each, total48. Every listed footprint/r/decor/sell value matches the CAL-FURN-A table. `furnishing_recipes.test.ts:77` binds bills/transforms to SHA256 c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b. Literal skill/budget/count pins are freehold_content:333. No number was retuned. |
| Produce and keystone firewall | Only alchemy has frost_gourd and cooking has highland_barley/frost_gourd. No other bill includes a crop, seed, protected chase material, catalyst or gear-chain intermediate. Existing typed/material-family firewall is extended at provisioner_firewall:523, covers all10 at:543, and exercises forbidden inputs against every craft at:561 plus produce/seed/missing/nonfurnishing controls at:581. |
| Three teaching patterns | `furnishing_patterns.ts:6`, :14, :22 contain exactly three recipe items, prefixes Schematic/Technique/Design, rare quality, sell100, one taught recipe each. All three recipes have acquisition exactly ['drop']. Pattern tests:64 pin exact shape and quartermaster row cardinality. |
| D53, deterministic Marks route | `heroic_vendor.ts:250` to :252 contains exactly one 16-Mark row per pattern. `instances/heroic_vendor.ts:52` checks Marks and :63 spends Marks; no copper debit or direct teaching. Capacity precedes debit. Dark availability rejects before spending. The channel family expects exactly ['vendor'] at apex_pattern_channels:253. |
| No extra furniture, no trainer drop channel | Patterns are learning tokens for three of the existing ten outputs. Seven remaining recipes are trainer-only. Live src/sim references to those seven outputs occur only in recipes, furnishing definitions/stand-ins and profession-source Hearth records, not loot/channel tables. The three pattern IDs occur only in the pattern catalog and quartermaster rows. |
| No delve source | No pattern source exists in delve content. Channel suite explicitly covers delve shops and exercises both cache functions across tiers/classes/coffer arms at apex_pattern_channels:597. Current execution is parent-owned. |
| Power neutrality | Each authored output uses a closed `id/name/kind/quality/sellValue/furnishing` shape. Furnishing fields contain only footprint/r/decorCost/surface. No stats, slot, aura, buff, feast, use or station effect. All models are floor-supported stand-ins, including Jewel Floor Lamp; no chandelier/ceiling form is inferred. Set Supper Table remains inert decor. |
| Power-path controls | Existing kind gates deny equip/use (`items.ts:525`, :817), salvage (`professions/salvage.ts:60`), disenchant/enchant (`enchanting.ts:235`, :1300), Perfecting (`perfecting.ts:355`) and feast behavior (`feast.ts:147`). Craft bonuses return null at crafting:165, and Perfecting head-start excludes furnishing at:1076 while draws remain unconditional. Existing hostile-payload controls include furnishing_item_kind:735 and:875. |
| Market R18 | All10 defs have no soulbound/noMarketList, and crafted copies are signer-only, so live plain/signed market admission accepts them subject to the unchanged universal locks/range/capacity rules. See C4 for the every-ID execution limit. |
| Economy invariant | recipe_economy:138 sweeps ALL_RECIPES with an empty exception set at:127; all10 join automatically. Its input-price rule values vendor staples by positive buyValue, otherwise sellValue; no furnishing exemption exists. Counterfactual discount/gold-sink arms remain. Actual pass requires parent output. |
| Same-seed and Rng | No RNG/wall-clock call was added to the new content/availability/training helpers. Original diff does not touch draw sites or tick. Crafting still consumes the Jack variance draw first at:1007, then the unconditional proc draw at:1017. New denials cost zero draws; training/pattern learning cost zero. furnishing_crafting:195 asserts ordinary1/Jack2 draws per craft and equal events, saves and three continuation draws across same-seed runs. |
| SimContext and relocation | Original diff does not modify callbacks or primitive declarations. trainRecipe moved into a focused module, preserving resolve, fee debit, acquisition, last result and event order. `sim.ts:5070` supplies a live station getter and :5392 late-binds emit, so ctx station/emit behavior matches the former direct methods. No receiver, argument, return or in-place game-state mutation was altered by the move. |
| Host purity and localization | New sim modules import only sim modules/types; targeted banned API/import scan found no match. No new English emit literal was introduced by the extraction or availability guard: trainResult codes remain existing, and quartermaster reuses existing denial text. UI availability and wire parity are separate specialist surfaces. |

## Upstream integration distinction

A source comparison from 3666d89647 to the current candidate showed no further change in crafted catalogs, crafting.ts, pattern_items.ts, training.ts, stations.ts, train_recipe.ts or recipe_visibility.ts at inspection time. Original gameplay conclusions therefore carry across those files. Parent was still resolving broader merge conflicts; this is not a certification of a frozen tree.

The upstream Rift Forge removed the legacy enchant path and uses a three-band-shell allowlist at `src/sim/rift/progression.ts:68` and `:455`. Both upgrade (:515) and socket (:573) route through that allowlist before any spend. Every furnishing id is excluded even if a hostile copy carries a rift record. This replaces the old furnishing-specific check with a tighter upstream gate and is **not** a lost power-neutrality guard. Merge auditor was notified. Original range never touched rift/progression.ts.

The older apex source header explicitly marks 28 and twelve as historical wave counts (`content/apex_patterns.ts:5` and :21); those are not the new full-catalog total and must not be mechanically replaced by55. The live seventh-family assertion is correct. The D85 professions change and the requested literal freeze must be adjudicated separately from upstream integration.

## Evidence still needed from coordinator

Run/inspect the requested current-tree recipe, furnishing, channel, economy, provisioner, station, architecture and determinism suites; the user-required deletion-of-one-quartermaster-row mutation must visibly fail in scratch. Verify the authored market cohort if required by the literal acceptance. Inspect typecheck/generator freshness/gate output and every final fix review. Earlier implementation validation belongs to3666d89647 and cannot substitute for current merged-tree results.
