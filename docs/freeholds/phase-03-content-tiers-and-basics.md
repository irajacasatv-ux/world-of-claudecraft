# Phase 03: content, the tier ladder, the Charter SKU, the ledger schedule, vendor basics

Wave A, the Cottage MVP. The spec is `progress.md` "03 Content: tiers, Charter SKU, ledger
schedule, vendor basics"; the decisions are `state.md` (the tier table, the working numbers,
D17's radius on every def) and `brainstorm.md` (D1, D2, D13, O3, O7). This is a CONTENT phase:
it ships the first furnishing ids and therefore every same-change content obligation (art,
deeds, Reliquary, wiki, names). No logic beyond pure lookups.

### Starter Prompt
```
This is Phase 03 of the Freeholds and Guildhalls feature: content (the tier ladder, the
Freehold Charter SKU allowlist, the Steward's Ledger schedule table, the vendor-basic
furnishings and the Eastbrook furnisher, every content obligation).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices; the art batch is about eight icons).

Goal: land the declarative records every later phase reads (tiers, charters, the ledger
schedule, the first furnishings) under src/sim/content/freehold/, sold for gold by a new
Eastbrook furnisher, with WebP art, the Homesteader deed family opener, the Reliquary Hearth
shelf, wiki regen, and world-entity names, all pinned by literal tests.

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
- Memory scan: MEMORY.md and entries on content pins (deeds and reliquary count re-pins,
  the authored-art normalization pin trap, item art provenance), test-pin traps, the
  provisioner firewall, i18n name fills (M16), the wiki freshness gate.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the tier table and working numbers, the seams), docs/freeholds/
  progress.md (only "03 Content: tiers, Charter SKU, ledger schedule, vendor basics"),
  docs/freeholds/brainstorm.md (O3 and O7 only), and this file
- src/sim/content/CLAUDE.md, src/sim/content/farm_patches.ts (the deep-frozen table served
  by reference, FARM_BED_IDS as the allowlist), src/sim/content/farm_crops.ts (produce ids
  and their fine_ twins), src/sim/content/storage_charters.ts (STORAGE_SKUS,
  isKnownStorageSkuId: the no-price, no-copy record), src/sim/professions/farm_watch_fee.ts
  (the FARM_WATCH_FEE_BY_TIER TUNING banner, eligibleWatchFeeItemIds' published order),
  src/sim/professions/material_grades.ts (MATERIAL_GRADES, materialGradeIds),
  src/sim/professions/gathering_materials.ts, src/sim/content/profession_items.ts (hide
  and cloth ids, the feast def kind ruling), src/sim/content/items.ts (the fishing bands,
  the three Perfecting keystone ids), src/sim/material_ids.ts
- src/sim/data.ts (mergeItems and the content merge order), src/sim/content/
  heroic_vendor.ts, and the Eastbrook vendor NPC rows (grep `vendor` under
  src/sim/content/ for the stock row shape and the gold price field)
- src/sim/content/deeds.ts (DeedDef, the append-only DEED_ORDER, the farming and feast
  deeds as the newest family), docs/design/deeds.md, src/sim/content/reliquary.ts
  (RELIQUARY_PAGES and the shelf shape), docs/design/reliquary.md (the page contract and
  the pattern exclusion), docs/design/item-icon-art-style.md (the woc-item-icon-v1
  contract), public/ui/items/mapping.json, and the icon generator under scripts/ (grep
  mapping.json)
- src/sim/types.ts (FurnishingItemDef from Phase 02), src/ui/world_entity_i18n.ts, the
  item-names catalog module under src/ui/i18n.catalog/, src/ui/CLAUDE.md (M16)
- tests/provisioner_firewall.test.ts (PERFECTING_MATERIAL_IDS, GEAR_INTERMEDIATE_WORDS,
  the header's "a widening phase EXTENDS this file" rule), tests/item_icons.test.ts,
  tests/item_art_consistency.test.ts, tests/deeds_content.test.ts,
  tests/reliquary_content.test.ts, tests/storage_charters.test.ts (the literal-pin style),
  tests/professions_farming_state.test.ts (the deep-frozen-by-reference pin),
  tests/market_filters.test.ts, tests/guide.test.ts, tests/furnishing_item_kind.test.ts
- Root CLAUDE.md "New game content" bullet and "Invariants"
The agent returns: the exact record shapes to copy (frozen table, allowlist set, lookup
function, the no-price negative pin); the vendor row recipe (file, NPC id, stock shape,
price field, how the world-entity name resolves); the deed and Reliquary append recipes
with the count pins that must be re-pinned; the art pipeline invocation and the provenance
row shape; the ledger-eligible ids per line at tiers 1 and 2 with their fine twins (and
which lines have none); the keystone and gear-intermediate literals; the wiki regen and
guide key recipe.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent TABLES: src/sim/content/freehold/{tiers.ts,charters.ts,ledger_schedule.ts}.
  tiers.ts: FREEHOLD_TIERS with `inn_room` and `cottage` (rooms, decorBudget, plinths,
  amenitySlots, upkeep flag; the state.md table values; deep-frozen; ids are frozen save
  keys, say so in the banner), FREEHOLD_TIER_IDS, freeholdTierById. charters.ts:
  FREEHOLD_CHARTERS with `freehold_charter_cottage` (tier only, no price, no name, no
  copy), isKnownFreeholdCharterId, the STORAGE_SKUS twin. ledger_schedule.ts: one line
  per gathering family (ore, wood, herb, hide, cloth, fish, produce), each listing tier 1
  and 2 ids in a published order with base grade before its fine_ twin (explicit gradeIds
  for produce, plain ids where no fine twin exists), a seeded weekly order function that is
  a pure hash of the week index (no Rng), and stack counts flagged TUNING in the
  FARM_WATCH_FEE_BY_TIER manner (the economy service and Fernando own the finals).
  Tests: tests/freehold_content.test.ts (literal pins for tier values, charter ids, schedule
  ids per line, the keystone and gear-intermediate exclusion sweep over every possible
  schedule week, the deep-frozen and no-price negative pins) and the ledger-schedule arm in
  tests/provisioner_firewall.test.ts.
- Agent FURNISHINGS: src/sim/content/freehold/furnishings.ts with about eight
  vendor-basic FurnishingItemDef rows (a bed, a table, two chairs, a rug, a lantern, a
  chest prop, a bookshelf): footprint, a measured collision radius `r` on EVERY def (required;
  `r: 0` means walk-through, the rug), decor
  cost, `surface: 'floor'`, a stand-in model key resolved by Phase 09's registry, sellValue
  and gold price, tradable; merged into ITEMS by src/sim/data.ts mergeItems; the Eastbrook
  furnisher vendor row with the stock list; English item names in the item-names catalog;
  the vendor's src/ui/world_entity_i18n.ts row; WebP icons plus mapping.json provenance for
  every id through the repo's icon pipeline; the power-neutral sweep and the r-on-every-def
  pin added to tests/freehold_content.test.ts; shipped ids added to the Phase 02 sweep.
- Agent OBLIGATIONS: the Homesteader deed family opener in src/sim/content/deeds.ts
  (appended at the END with DEED_ORDER rows: first furnishing placed, first Cottage;
  cosmetic-only, trigger kinds that later phases raise, never power), the Reliquary Hearth
  shelf pages for the furnishing items in src/sim/content/reliquary.ts (patterns never;
  a page count over the shelf contract goes back to Fernando, O7), non-Latin name fills
  where an English name is wordy (M16), and the guide.* prose keys the wiki needs.
The coordinator runs last: `npm run wiki:content`, the count re-pins in
tests/deeds_content.test.ts and tests/reliquary_content.test.ts, and tests/item_icons.test.ts.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the weekly order is a pure function of the week index; no Rng, no clock.
- Never sell power: no furnishing carries a stat, buff, aura, gathering, or drop field
  (the power-neutral sweep pins it); the Charter carries a tier and nothing else.
- Keystone exclusion: no ledger line names wyrmfall_core, sundered_essence, makers_ember,
  a gear intermediate, or the quickening catalyst, swept over every schedule week.
- Zero new farm beds; recipes and stationType gates untouched.
- Content obligations, all in this change: WebP art with provenance for every new item id,
  the Homesteader deeds, the Hearth shelf pages, wiki regen, guide keys, world-entity names,
  M16 fills.
- i18n: the contributor policy in docs/freeholds/implementation-plan.md; item and entity
  names are English catalog keys, never rendered from the def.
- No Claudium or USD price anywhere in src/sim/content/freehold/ (the Charter carries a tier
  only); gold vendor prices and sellValue are ordinary item data.
- Token firewall (the state.md scope): no on-chain word (wallet, token, $WOC, mint, holder,
  marketplace, on-chain, Solana) in src/sim/; deed ids and deedsEarned are Book of Deeds
  game content, not firewall vocabulary.
- Vocabulary: Freehold Charter, Steward's Ledger, Inn Room; never "rent".
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Crafted furnishings, recipes, and patterns (Phase 04).
- Instance records (Phase 05), layouts (Phase 06), the ledger planner (Phase 13), the
  Charter purchase branch (Phase 15), trophies (Phase 17), GLB models (Phase 19).
- Any src/sim/freehold/ logic that reads these tables.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_content.test.ts
  tests/furnishing_item_kind.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/recipe_economy.test.ts
  tests/provisioner_firewall.test.ts tests/market_filters.test.ts tests/architecture.test.ts
  tests/storage_charters.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  content-obligations-reviewer (the whole obligation list against the diff). Prompt it
  for COVERAGE not filtering; it writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the freehold tier ladder, the Charter allowlist, and the ledger schedule
- feat(content): add the vendor-basic furnishings and the Eastbrook furnisher
- feat(content): add the Homesteader deeds, the Hearth shelf pages, and furnishing art
- docs(wiki): regenerate guide content for the furnishings and the furnisher
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/item_icons.test.ts, tests/item_art_consistency.test.ts,
  tests/deeds_content.test.ts, tests/reliquary_content.test.ts, tests/guide.test.ts, and
  tests/provisioner_firewall.test.ts (with the new ledger-schedule arm) are green.
- [ ] tests/freehold_content.test.ts pins every tier value, charter id, and schedule id by
  fresh literal; the keystone sweep covers every schedule week; every furnishing def carries
  a numeric `r` (the rug carries 0); no def has a price, buff, or stat field.
- [ ] content-obligations-reviewer reports no BLOCKING.
- [ ] `grep -rn "wyrmfall_core\|sundered_essence\|makers_ember\|quickening"
  src/sim/content/freehold/` returns nothing.
- [ ] Every new item id has a committed WebP and a mapping.json provenance row; the vendor
  has a world_entity_i18n.ts row; wordy English names carry their five fills.
- [ ] All STEP 3 suites green.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 03, notes, deferrals, the O7 page count)
  and docs/freeholds/state.md (the per-phase ledger row 03: new files, item ids, the
  vendor id, deed ids, page ids, i18n keys; the TUNING stack counts as working values).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-03-qa.md

STOPPING RULES:
- Stop and ask if the Hearth shelf would exceed the Reliquary page contract (O7 goes to
  Fernando) or if a ledger line has no keystone-free tier 1 or 2 id.
- Stop if the icon pipeline cannot produce a provenance row for an id (never commit a
  WebP without one).
- Do not push the branch; never merge a PR.
```
