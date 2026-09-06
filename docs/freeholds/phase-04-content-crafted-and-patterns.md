# Phase 04: content, the crafted furnishings and the quartermaster patterns

Wave A, the Cottage MVP. The spec is `progress.md` "04 Content: crafted furnishings and
quartermaster patterns"; the decisions are `state.md` D53 and D14 (one recipe per
existing craft, patterns are `kind: 'recipe'` rows on the deterministic quartermaster row, no
luck-gated faucet in the MVP) and `state.md` (keystone exclusion, recipes and `stationType`
gates unchanged). This is a CONTENT phase with the full same-change obligation list; it also
extends the channel, economy, and provisioner contracts to cover furnishing recipes.

### Starter Prompt
```
This is Phase 04 of the Freeholds and Guildhalls feature: content (ten crafted furnishings,
one per craft, and three furnishing patterns on the Heroic Quartermaster's row).

Harness: Codex. Asset generation in this implementation must use Codex, not Claude.
Follow AGENTS.md and root/directory CLAUDE.md repository contracts; use the active Codex
model and the existing image/model/SFX pipelines, provenance and quality gates.

Goal: give every one of the ten crafts a furnishing recipe on its existing trainer and
station seams, put three of those recipes behind pattern items sold deterministically by the
Heroic Quartermaster (D53, Marks-purchasable, never a luck-gated only faucet), ship art and
every content obligation, and extend the channel, economy, and provisioner contracts so
furnishing recipes are swept like every other recipe.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on the content pins cluster (pattern channel sweeps,
  recipe economy, the apex header count literal), the provisioner firewall, item art
  provenance, test-pin traps, M16 name fills.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "04 Content: crafted furnishings
  and quartermaster patterns"), docs/freeholds/state.md (D53, D14 and the settled Hearth
  shelf contract), and this file
- src/sim/content/apex_patterns.ts (the id contract `pattern_<output>`, the per-craft
  prefixes, the header count literal that must stay true), src/sim/content/farm_patterns.ts
  (the narrow RecipeItemDef table as the model), src/sim/professions/pattern_items.ts
  (resolvePatternLearn deny order, useRecipePatternItem), src/sim/professions/training.ts
  (teachTierMet, the trainer recipe rows, TRAINING_FEE_BY_TIER), the recipe tables that
  back ALL_RECIPES and recipeById (grep both under src/sim/ and src/sim/content/; the
  apex rows for all ten crafts, the acquisition field, the output quality field),
  src/sim/content/professions.ts (STATION_TYPE_BY_CRAFT, the stationType binding),
  src/sim/professions/crafting.ts (evaluateCraftAdmission: the station gate that must not
  change; how a non-gear output is minted), src/sim/content/heroic_vendor.ts (the
  deterministic Marks stock row shape), docs/design/professions.md (its own R8, R17 and
  R18 rows; the packet doctrine is state.md D53),
  src/sim/professions/CLAUDE.md
- src/sim/content/freehold/{furnishings.ts,tiers.ts} (Phase 03), src/sim/data.ts
  (mergeItems beside APEX_PATTERN_ITEMS and FARM_PATTERN_ITEMS), src/sim/content/
  reliquary.ts (the Hearth shelf from Phase 03), src/sim/content/deeds.ts,
  src/sim/content/farm_crops.ts (produce ids for the consumable crafts),
  src/sim/professions/material_grades.ts (tier 1 to 3 material ids)
- src/sim/types.ts (FurnishingItemDef, RecipeItemDef), public/ui/items/mapping.json and
  the icon pipeline recorded in state.md row 03, src/ui/world_entity_i18n.ts, the
  item-names catalog module
- tests/apex_pattern_channels.test.ts (the no-fourth-channel sweep and the quartermaster
  arm: does it accept a quartermaster-only pattern?; the three literal pins that redden
  on three new drop recipes: the "phase 02 sweep floor" EXACTLY-40 kind:recipe literal,
  the drop-recipe partition toHaveLength(40) with its five-family sum equality, and the
  stale "34" header comment), tests/apex_pattern_items.test.ts,
  tests/farm_pattern_items.test.ts (the partition and marks-valve pins),
  tests/recipe_pattern_items.test.ts (the shipped-content sweeps),
  tests/recipe_economy.test.ts, tests/provisioner_firewall.test.ts (the Phase 03 ledger
  arm and the hoe carve-out predicate), tests/professions_crafting_hub.test.ts,
  tests/train_view.test.ts, tests/freehold_content.test.ts, tests/item_icons.test.ts,
  tests/item_art_consistency.test.ts, tests/reliquary_content.test.ts, tests/guide.test.ts
- Root CLAUDE.md "New game content" bullet
The agent returns: the recipe record shape and its merge site; the trainer-row recipe
(which table, which skill threshold field); the pattern row and the quartermaster stock row
recipes; whether the channel sweep accepts a quartermaster-only pattern and, if not, the
exact arm to add so D53 without a luck channel is legal; the tier 1 to 3 material ids per
craft and the produce ids the consumable crafts (cooking, alchemy) may bill; the firewall
carve-out predicate and the arm that lets a furnishing recipe bill produce while refusing
every keystone; the Hearth shelf append recipe and the count pins; the art invocation.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:

Deliverables (at most five):
1. Exactly ten crafted furnishing outputs, one per existing craft, with approved recipe
   and station/acquisition rows from content-manifest.md.
2. Exactly three pattern items within those ten outputs and deterministic Marks stock.
3. All same-change icon/provenance/name/originality/Hearth-page/wiki obligations.
4. Literal recipe/channel/economy/firewall and acquisition behavior evidence.

Consume the exact roster and pattern selection in content-manifest.md and art-brief.md;
phrases such as stand-or-brazier describe historical options only and are replaced by the
manifest's selected form. Every material count, skill threshold, Marks price, sellValue,
decor cost and geometry value has a named source+derivation+rounding or signed calibration
row before activation. Do not claim classic-era authority for original housing rates.
Every ProfessionRecipeRecord balance field is in that rule, itemLevelBudget and skillReq
included: itemLevelBudget is REQUIRED on every recipe and drives the craft gold sink
(src/sim/professions/crafting.ts, CRAFT_GOLD_SINK_COPPER_PER_BUDGET), so each of the ten
recipes takes its value from the content-numbers-workbook.md CAL-RECIPES-A row (the
bronze hoe precedent in src/sim/content/recipes.ts carries 10), never from taste.
Verify pattern sellValue against the shipped pattern contract rather than assuming it.
Wave A remains Marks-only, never a raid/rift/delve luck faucet. The later Wave B manifest
adds one named raid OR rift luck channel plus Marks per rare pattern and counts all produce
props inside its twenty outputs. Every shipped wave closes on final art, never indefinitely
on a stand-in. The jewelcrafting Wave A output is the floor-supported jewel lamp. The chandelier
belongs to the twenty-output Wave B roster and uses fixed ceiling anchors introduced
in 25; never invent a floor stand or duplicate acquisition for it.

Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent RECIPES: the ten FurnishingItemDef rows appended to
  src/sim/content/freehold/furnishings.ts on the proposal's mapping (the exact ten-craft
  forms in content-manifest.md, including the floor-supported jewel lamp in Wave A;
  no unresolved stand/brazier, rug/banner, lamp/clock or painting/map alternatives; each with footprint, `r`,
  decorCost, a stand-in model key, tradable), and src/sim/content/freehold/
  furnishing_recipes.ts: one recipe per craft on the existing craft id and its existing
  station type, tier 1 to 3 materials, produce only on the consumable crafts, seven rows
  trainer-taught at the craft's existing trainer, three rows `acquisition` including
  'drop' for the patterns; registered where ALL_RECIPES merges; the tradable-output pin
  (R18: a non-crafter can buy every furnishing on the market).
- Agent PATTERNS: src/sim/content/freehold/furnishing_patterns.ts, a
  Record<string, RecipeItemDef> of three `pattern_<output>` rows (per-craft prefix,
  quality derived from the output, sellValue 100, teachesRecipeId `recipe_<output>`,
  tradable, no Reliquary page), merged by src/sim/data.ts mergeItems beside
  FARM_PATTERN_ITEMS (a separate table so the apex header literal stays true), the three
  Heroic Quartermaster stock rows in src/sim/content/heroic_vendor.ts (deterministic Marks
  price, no luck channel), tests/furnishing_pattern_items.test.ts on the
  farm_pattern_items.test.ts shape (one-to-one with the drop recipes, quality derivation,
  exact def shape, marks valve reaches every pattern, the seven trainer rows still
  trainer-taught), and the channel-sweep arm if STEP 1 found one is needed.
- Agent ART AND OBLIGATIONS: WebP icons plus mapping.json provenance for the ten
  furnishing ids and the three pattern ids; English names in the item-names catalog with
  M16 fills where wordy; Hearth shelf pages for the ten furnishing items (patterns never; append the exact manifest page inventory without a phantom global cap); the guide.* prose keys; the power-neutral sweep and the
  r-on-every-def pin extended in tests/freehold_content.test.ts.
The coordinator runs last: the furnishing-recipe arm in tests/provisioner_firewall.test.ts
(produce allowed on the consumable crafts, keystones and gear intermediates never, a
can-fail control), `npm run wiki:content`, the count re-pins in
tests/reliquary_content.test.ts (tests/recipe_pattern_items.test.ts has no count pin;
its sweeps are behavioral), and the tests/apex_pattern_channels.test.ts re-pins landed in
the pattern commit: the shipped kind:'recipe' floor literal 40 to 43, the drop-recipe
partition literal 40 to 43 with a SIXTH family arm for the three furnishing drop rows so
the family sum equality and the disjointness check still hold, and the stale header
comment (it still says 34) corrected to the new truth.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: content only; no Rng, no clock.
- Recipes and their stationType gates unchanged: a furnishing recipe binds to its craft's
  existing station; evaluateCraftAdmission and resolveTrain are not edited.
- Keystone exclusion: no furnishing bill names wyrmfall_core, sundered_essence,
  makers_ember, a gear intermediate, or the quickening catalyst.
- Never sell power: every furnishing output is decor (the feast-table prop grants no Well
  Fed and has no charges; the glow light has no aura); the power-neutral sweep pins it.
- D53: every pattern is Marks-purchasable on a deterministic row; no luck-gated channel
  in the MVP; no pattern takes a Reliquary page.
- Content obligations, all in this change: art with provenance for all thirteen ids,
  names with M16 fills, Hearth shelf pages for the ten items, wiki regen, guide keys.
- i18n: the contributor policy in docs/freeholds/implementation-plan.md.
- Token firewall (the state.md scope): no on-chain word (wallet, token, $WOC, mint, holder,
  marketplace, on-chain, Solana) in src/sim/; deed ids and deedsEarned are Book of Deeds
  game content, not firewall vocabulary.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The R8 luck channels (raid tail groups, rift clear draws): Phase 22.
- Exactly twenty additional Wave B outputs, including its produce props/markers
  (Phase 22); Phase 24 renders the existing farm tableau and adds no extra furniture roster.
- Any placement or build-mode behavior (the place_furnishing command in Phase 08, build mode
  in Phase 11; a furnishing never gains a use arm); GLB models (Phase 19).
- Carpenter and Mason (Phase 43).


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_content.test.ts
  tests/furnishing_pattern_items.test.ts tests/apex_pattern_channels.test.ts
  tests/apex_pattern_items.test.ts tests/farm_pattern_items.test.ts
  tests/recipe_pattern_items.test.ts tests/recipe_economy.test.ts
  tests/provisioner_firewall.test.ts tests/professions_crafting_hub.test.ts
  tests/train_view.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts
  tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/market_filters.test.ts
  tests/furnishing_item_kind.test.ts tests/architecture.test.ts`; `npm run wiki:content`
  then `npx vitest run tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  content-obligations-reviewer (the obligation list, referential integrity through the
  merged catalog, the explicit source derivation and approval of every bill),
  test-coverage-auditor (the re-pinned literals and every negative arm), then
  qa-checklist (the completion gate). Prompt each for COVERAGE not filtering; each writes
  its report to a file. Do not commit until all findings, including nits, are resolved
  and freshly reviewed.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: content-obligations-reviewer, test-coverage-auditor, qa-checklist.
  Dispatch each for COVERAGE and wait for every report. Apply ALL findings including
  nits, then a FRESH reviewer reads the entire fix round. Earlier slice lists are
  ownership examples; this complete roster is the minimum finishing dispatch.
- Database performance reviews happen before implementation decisions and on the finished
  diff whenever SQL/call sites/stored shapes/queues/locks/timeouts/growth change; pair
  migration-safety and privacy-security-review for persistence/authority changes.
- Run node scripts/gate_select.mjs before calling this contribution complete, as well as
  every scoped/PG/visual/SFX check named here. Report exact commands and outcomes. A
  skipped required suite or a reviewer report alone is not a passing shared gate.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add ten crafted furnishings, one recipe per craft
- feat(content): add three furnishing patterns on the Heroic Quartermaster row
- feat(content): add art, Hearth shelf pages, and name fills for the crafted furnishings
- docs(wiki): regenerate guide content for the furnishing recipes and patterns
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every new recipe resolves through resolvePatternLearn (the three drop rows, driven
  in a test with the pattern in a bag slot) or a trainer row (the seven others, driven
  through the trainer path); every pattern has a quartermaster stock row; no pattern id
  appears in src/sim/content/reliquary.ts.
- [ ] tests/apex_pattern_channels.test.ts, tests/recipe_pattern_items.test.ts,
  tests/recipe_economy.test.ts, and tests/provisioner_firewall.test.ts (with the furnishing
  arm) are green; the src/sim/content/apex_patterns.ts header count literal is unchanged
  and still true; the channel suite's floor and partition literals read 43 with the sixth
  family arm and its header comment matches (pinned in the pattern commit).
- [ ] tests/freehold_content.test.ts pins each recipe's itemLevelBudget and skillReq to the
  CAL-RECIPES-A workbook literals; no recipe carries a value the workbook does not.
- [ ] content-obligations-reviewer confirms all findings resolved and the fresh fix review passed.
- [ ] `grep -rn "wyrmfall_core\|sundered_essence\|makers_ember\|quickening"
  src/sim/content/freehold/` returns nothing; no bill names a billet, plating, cording,
  bolt, setting, or chassis id.
- [ ] All thirteen ids have a committed WebP and a provenance row; every wordy English
  name carries its five fills; tests/guide.test.ts is fresh.
- [ ] All STEP 3 suites green.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 04, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 04: new files, the thirteen ids, the
  recipe ids, the quartermaster rows, page ids, i18n keys; the exact Hearth page inventory).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-04-qa.md

STOPPING RULES:
- Stop and ask if the channel sweep cannot accept a quartermaster-only pattern without
  weakening an existing pin (D53 must hold without a luck channel; never loosen the sweep).
- Stop if a craft has no keystone-free tier 1 to 3 material set for its bill, or a required numeric source/approved calibration row is absent (the documented
  content release gate remains closed until that artifact exists).
- Do not push the branch; never merge a PR.
```
