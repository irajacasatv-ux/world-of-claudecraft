# Phase 22: furnishings across all ten crafts and the R8 pattern channels

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "22
Furnishings across all ten crafts and the R8 pattern channels"; the decisions are
`state.md` and `brainstorm.md` (D13 stand-ins, D14 one existing craft per recipe). This
phase ships about twenty more furnishings (two per craft plus the Farming produce props
and garden markers), their recipes, the rare patterns on the three R8 channels with the
D13 quartermaster valve, every content obligation (icons with provenance, models through
the image-to-glb pipeline, deeds, Reliquary Hearth shelf pages, wiki regen, name fills),
and proves the market chip at volume. It is a content phase: batch-heavy.

### Starter Prompt
```
This is Phase 22 of the Freeholds and Guildhalls feature: furnishings across all ten
crafts and the R8 pattern channels (about twenty furnishings and recipes, the rare
patterns on raid, rift, and quartermaster, art and every content obligation).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: add the keyword `ultracode` to this prompt when you paste it: the phase is
batch-heavy (about twenty furnishing defs, recipes, patterns, icons, and models).

Goal: widen the furnishing catalogue to about forty pieces across every craft with
recipes on existing crafts, rare patterns on the three R8 channels each also reachable
through the Heroic Quartermaster (D13), art and every same-change obligation landed, and
the furnishing market chip proven against the full roster.

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
- If state.md "Push policy" records a stacked wave B branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Memory scan: MEMORY.md and entries on the content obligations catalog cluster, the
  authored-art pin trap (pin the CONTRACT beside the blob), test-pin traps, the
  provisioner firewall, the image-to-glb and asset-pipeline gotchas, "dead agents' disk
  output before re-running".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "22 Furnishings across all
  ten crafts and the R8 pattern channels"), and this file
- src/sim/content/freehold/furnishings.ts, furnishing_recipes.ts, furnishing_patterns.ts
  (the Phase 03 and 04 rows: the def shape, the recipe shape per craft, the pattern row
  shape), src/sim/content/freehold/trophies.ts (to keep trophy ids disjoint),
  src/sim/data.ts (the mergeItems and recipe merge sites), src/sim/types.ts
  (FurnishingItemDef, RecipeItemDef), src/sim/content/CLAUDE.md
- The three channels: src/sim/content/dungeons.ts (the nythraxis_patterns rollGroup, the
  raid tail), src/sim/rift/progression.ts (addRiftClearGearLoot, the rift clear draw),
  src/sim/content/heroic_vendor.ts (the Heroic Quartermaster Marks stock, the D13
  valve); src/sim/content/apex_patterns.ts and farm_patterns.ts headers (the channel
  doctrine and the id contract pattern_<output>); src/sim/professions/pattern_items.ts
  (resolvePatternLearn)
- src/sim/content/farm_crops.ts (produce ids for the Farming props and cooking inputs),
  the ten craft ids and their trainer rows (src/sim/content/professions.ts), the
  material ids the recipes draw (src/sim/content/items.ts, material_grades.ts)
- Art: docs/design/item-icon-art-style.md, public/ui/items/mapping.json (the
  woc-item-icon-v1 provenance contract), .claude/skills/image-to-glb/SKILL.md, the
  furnishing model registry Phase 09 and 19 built under src/render/freehold/, the
  fingerprint pin suite Phase 19 added, scripts/gen_asset_catalog.mjs
- Obligations: src/sim/content/deeds.ts (the Homesteader rows and DEED_ORDER),
  src/sim/content/reliquary.ts (the Hearth shelf, O7 budget), docs/design/reliquary.md,
  src/ui/i18n.catalog/ (the item-names domain and the M16 rule), src/ui/world_entity_i18n.ts
- Tests: tests/freehold_content.test.ts, tests/apex_pattern_channels.test.ts,
  tests/recipe_pattern_items.test.ts, tests/farm_pattern_items.test.ts,
  tests/recipe_economy.test.ts, tests/provisioner_firewall.test.ts,
  tests/market_filters.test.ts, tests/item_icons.test.ts,
  tests/item_art_consistency.test.ts, tests/deeds_content.test.ts,
  tests/reliquary_content.test.ts, tests/guide.test.ts, tests/i18n_completeness.test.ts
- Root CLAUDE.md "Modularity" (data-as-code is exempt) and the new-content bullet
The agent returns: the def, recipe, and pattern row templates with one shipped example
each; the exact append site and shape for each of the three channels and the
quartermaster row; the per-craft prefix table (Plans, Pattern, Design, Schematic,
Technique, Recipe); the produce and material ids eligible per craft (produce only where
the craft is a consumable line); the icon and model pipelines with the commands and the
pins each mints; the Reliquary Hearth shelf's remaining page budget; the market chip
test's roster source; which obligations a Farming-line furnishing (no craft) carries.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (tests/freehold_content.test.ts
roster, tests/deeds_content.test.ts and tests/reliquary_content.test.ts counts,
src/sim/data.ts merges, `npm run wiki:content`, the fingerprint pins):
- Agent CRAFT-A: two furnishings each for weaponcrafting, armorcrafting, leatherworking,
  tailoring, and engineering (defs with footprint, measured r, decor cost, surface floor,
  a model key; recipes on the existing craft with tier 1 to 4 materials; no stat, buff,
  or drop field; item names in the item-names domain with M16 fills where wordy).
- Agent CRAFT-B: two furnishings each for alchemy, inscription, jewelcrafting, cooking,
  and enchanting (produce inputs allowed on cooking and alchemy only), plus the Farming
  produce props and garden markers (settle in STEP 1 whether they are cooking recipes
  with produce inputs or a Farming trainer or vendor row; record the choice in state.md).
- Agent CHANNELS: the rare patterns in furnishing_patterns.ts (RecipeItemDef rows
  pattern_<output>, quality derived from the output, sellValue 100, tradable drops,
  never a Reliquary page): a tail group on the raid rollGroup, a rift clear draw, and
  EVERY pattern also on the Heroic Quartermaster Marks row (D13); no fourth channel; the
  tests/apex_pattern_channels.test.ts referential sweep and
  tests/recipe_pattern_items.test.ts shipped sweeps extended for the new rows.
- Agent ART: a WebP icon plus a mapping.json provenance row for every new item id
  (furnishings and patterns) under the woc-item-icon-v1 contract; a GLB per new
  furnishing through the image-to-glb skill (exporter, optimizer, fingerprint pins,
  adapter) registered in the furnishing model registry with a prewarm home; a stand-in
  remains only for an id whose reference image Fernando has not supplied (O5), recorded
  as a deferral with the id list; `npm run asset:budget`.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: content only; no Rng draw from any furnishing path; the channel draws
  ride the existing raid and rift rolls unchanged in order (a parity scenario proves the
  draw order if a rollGroup gains a row).
- Never sell power: no furnishing carries a stat, buff, gathering, or drop field (the
  power-neutral sweep); Well Fed from a feast is the only buff in a house.
- Never a Perfecting keystone, a gear intermediate, or the quickening catalyst in any
  furnishing recipe (tests/provisioner_firewall.test.ts sweeps ALL_RECIPES); produce
  feeds cooking and alchemy lines only; recipes and their stationType gates unchanged;
  no new craft (Carpenter and Mason stay Phase 43); zero new farm beds.
- D13: a luck-gated drop is never a pattern's only faucet; every pattern is
  Marks-purchasable; no pattern takes a Reliquary page; furnishing items may (O7).
- Every content obligation lands in the SAME change: deeds (Homesteader), Reliquary
  Hearth shelf pages, wiki regen plus guide.* keys, committed WebP art with provenance,
  non-Latin name fills where the English name is wordy (M16), world-entity names for
  any named entity.
- i18n: the policy in docs/freeholds/implementation-plan.md.
- Furnishings are Exchange-eligible at every rarity (D25, the mount rule, pinned in
  Phase 02); the token firewall holds at the state.md scope: no on-chain vocabulary in
  src/sim/ (wallet, token, $WOC, mint, holder, marketplace, on-chain, Solana, the on-chain
  Freehold Charter deed); the Book of Deeds is game content, never firewall vocabulary.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Wall or table surfaces on any def (Phase 25 adds the union members); trophies of any
  kind (Phase 23); dyes (Phase 41); seasonal sets; delve rewards as a channel.
- Any sim, server, wire, or UI logic change; the market chip already exists (Phase 02),
  this phase only proves it against the roster.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_content.test.ts
  tests/apex_pattern_channels.test.ts tests/recipe_pattern_items.test.ts
  tests/farm_pattern_items.test.ts tests/apex_pattern_items.test.ts
  tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts
  tests/market_filters.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/furnishing_item_kind.test.ts
  tests/architecture.test.ts tests/renderer_compile_gate.test.ts` plus the model
  fingerprint suite Phase 19 named; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`;
  `npm run asset:budget`; `npm run perf:tour` through the Cottage with the new models
  registered (zero live-program events).
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  content-obligations-reviewer (the whole content diff and every obligation), plus
  render-performance-reviewer because the registered models are GPU producers (the
  dispatch table row). Prompt each for COVERAGE not filtering; each writes its report to
  a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add furnishings across all ten crafts and the Farming produce props
- feat(content): add the rare furnishing patterns on the raid, rift, and quartermaster channels
- feat(render): register the furnishing models and icons with provenance
- test(content): pin the furnishing roster, the pattern channels, and the market chip at volume
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every new recipe resolves through resolvePatternLearn or a trainer row on an
  EXISTING craft; every pattern reaches exactly its channel and the Marks row;
  tests/apex_pattern_channels.test.ts finds no fourth channel.
- [ ] tests/freehold_content.test.ts pins the full furnishing roster by fresh literal
  ids, the power-neutral sweep, and the keystone sweep; tests/market_filters.test.ts
  lists every furnishing under the chip.
- [ ] tests/item_icons.test.ts and tests/item_art_consistency.test.ts green for every
  new id; the fingerprint suite pins every registered model; any stand-in is listed in
  progress.md as a deferral with its id.
- [ ] Deeds, Reliquary pages (within the Hearth shelf budget or escalated under O7), wiki
  regen, and name fills are in; content-obligations-reviewer and
  render-performance-reviewer report no BLOCKING.
- [ ] All STEP 3 suites green.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 22, notes, the stand-in deferral list)
  and docs/freeholds/state.md (the per-phase ledger row 22: new item ids, recipe ids,
  pattern ids, the channel rows, i18n keys; the Farming-line sourcing decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-22-qa.md

STOPPING RULES:
- Stop and ask if the Hearth shelf's page budget cannot hold the new furnishing items
  (O7 goes back to Fernando; do not trim the roster to fit).
- Stop if a pattern would need a channel outside raid, rift, or quartermaster, or a
  recipe would need a craft that does not exist.
- Do not push the branch; never merge a PR.
```
