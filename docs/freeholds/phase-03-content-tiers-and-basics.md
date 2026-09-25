# Phase 03: content, the tier ladder, the Charter SKU, the ledger schedule, vendor basics

Wave A, the Cottage MVP. The spec is `progress.md` "03 Content: tiers, Charter SKU, ledger
schedule, vendor basics"; the decisions are `state.md` (the tier table, the working numbers,
D17's radius on every def) and `state.md` (D1, D2, D13 and the settled content rulings). This is a CONTENT phase:
it ships the first furnishing ids and therefore every same-change content obligation (art,
deeds, Reliquary, wiki, names). No logic beyond pure lookups.

### Starter Prompt
```
This is Phase 03 of the Freeholds and Guildhalls feature: content (the tier ladder, the
Freehold Charter SKU allowlist, the Steward's Ledger schedule table, the vendor-basic
furnishings and the Eastbrook furnisher, every content obligation).

Harness: Codex. Asset generation in this implementation must use Codex, not Claude.
Follow AGENTS.md and root/directory CLAUDE.md repository contracts; use the active Codex
model and the existing image/model/SFX pipelines, provenance and quality gates.

Goal: land the declarative records every later phase reads (tiers, charters, the ledger
schedule, the first furnishings) under src/sim/content/freehold/, sold for gold by a new
Eastbrook furnisher, with WebP art, the Homesteader deed family opener, the Reliquary Hearth
shelf, wiki regen, and world-entity names, all pinned by literal tests.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  and merge it. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Codex memory scan: state.md "Gotchas" and entries on content pins (deeds and reliquary count re-pins,
  the authored-art normalization pin trap, item art provenance), test-pin traps, the
  provisioner firewall, i18n name fills (M16), the wiki freshness gate.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the tier table and working numbers, the seams), docs/freeholds/
  progress.md (only "03 Content: tiers, Charter SKU, ledger schedule, vendor basics"),
  docs/freeholds/content-manifest.md, docs/freeholds/art-brief.md, and this file
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

Deliverables (at most five):
1. Deep-frozen Inn Room/Cottage tiers and the price-free Charter allowlist.
2. The versioned realm-week eligible-ID schedule and exact calibration worksheet rows.
3. Exactly eight vendor furnishings and the furnisher, with all same-change content art,
   naming, wiki, provenance and originality obligations per shipped ID.
4. The Homesteader opener and the NEW Hearth shelf across its complete consumer census.
5. Literal content/firewall/economy/source-freeze tests and the approved manifest evidence.

content-manifest.md owns exact item IDs, eight vendor forms, later ten craft outputs,
recipe acquisition, permitted numeric sources and approval gates. art-brief.md owns
material family, model reference and collision/measurement briefs; 19 produces the final
reference sheets/GLBs. Freeze each source row before its runtime data is enabled: source
path+symbol or measured report, derivation, rounding, result, owner and approving artifact.
Missing numeric approval keeps that content disabled; it is a tracked release gate, not
an invitation to invent a TUNING constant. Exactly eighteen Wave A furnishing outputs
ship across 03/04; three patterns teach three of the ten crafted outputs.

The Hearth shelf is a new literal shelf ID, not an already-shipped one. Append its
catalog and navigation order without moving existing page IDs; furnishing ITEM pages
qualify, patterns and trophy RECORDS do not. Preserve hidden-source discovery rules in
names, search, tooltips and accessibility. Recompute fingerprints from the authored
inventory; existing page/watch/recommendation totals are not capacity limits.

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
  for produce, plain ids where no fine twin exists), a versioned realm-week schedule independent of owner, with produce on every bill
  and allowed rotating nonproduce families within the approved three-to-five-line
  target. Base-before-fine ID order is explicit. Exact trial quantities come only
  from content-manifest.md numeric provenance/calibration rows; approved schedule
  versions and prepaid bills are immutable. No quantity defaults to inventory stackSize.
  The economy service and Fernando sign literal bills before production enable; 13
  validates the schedule and 20 records the four-week calibration evidence.
  Tests: tests/freehold_content.test.ts (literal pins for tier values, charter ids, schedule
  ids per line, the keystone and gear-intermediate exclusion sweep over every possible
  schedule week, the deep-frozen and no-price negative pins) and the ledger-schedule arm in
  tests/provisioner_firewall.test.ts.
- Agent FURNISHINGS: src/sim/content/freehold/furnishings.ts with exactly eight
  vendor-basic FurnishingItemDef rows (a bed, a table, two chairs, a rug, a lantern, a
  chest prop, a bookshelf): footprint, a measured collision radius `r` on EVERY def (required;
  `r: 0` means walk-through, the rug), decor
  cost, `surface: 'floor'`, a stand-in model key resolved by Phase 09's registry, sellValue
  and gold price, tradable; merged into ITEMS by src/sim/data.ts mergeItems; the Eastbrook
  furnisher vendor row with the stock list, spawned only when the Sim's freeholdsEnabled
  boot config is true (D85: a dark realm spawns no furnisher and sells no furnishing; the
  eight item DEFS still merge into ITEMS as data; the offline and headless hosts pass
  true under D3): one predicate in a src/sim/freehold/ helper the ctor's NPC spawn loop
  calls, paid for by an extraction and a LOWERED sim.ts ceiling; English item names in
  the item-names catalog; the vendor's src/ui/world_entity_i18n.ts row; WebP icons plus
  mapping.json provenance for every id through the repo's icon pipeline; the
  power-neutral sweep and the r-on-every-def pin added to tests/freehold_content.test.ts;
  shipped ids added to the Phase 02 sweep; the dark-realm arm appended to
  tests/server/freehold_wire.test.ts (a Sim built from buildRealmSimConfig with
  FREEHOLDS_ENABLED unset has no freehold_furnisher entity; with '1' it is present and
  its vendorItems equal the eight ids by literal).
- Agent OBLIGATIONS: the Homesteader deed family opener in src/sim/content/deeds.ts
  (appended at the END with DEED_ORDER rows, the two ids frozen in content-manifest.md's
  "Homesteader deeds (03)" table: `homesteader_first_furnishing` (Homesteader, first
  furnishing placed) and `homesteader_first_cottage` (Householder, first Cottage);
  cosmetic-only, never power; trigger kind `manual` for both, the existing DeedTrigger
  member granted only by an explicit src/sim/deeds.ts::grantDeed call, so no DeedTrigger
  or DeedFlagId widening. The raise sites are owned: 08 raises
  homesteader_first_furnishing on a character's first successful placement after the
  placement mutation applies, identically on both hosts (phase-08 deliverable 2); 15
  raises homesteader_first_cottage through freeholdGrantCharter for the character whose
  admitted session receives the Cottage tier grant, once, never on a dry run, a replayed
  receipt or an alt, and a grant applied by session-less recovery raises it on the
  account's next admitted Cottage entry (phase-15 deliverable 2, pinned in
  tests/freehold_grant.test.ts). Deeds stay per-character records and are never
  retro-granted to alts), the Reliquary Hearth
  shelf pages for the furnishing items in src/sim/content/reliquary.ts (patterns never;
  the new Hearth shelf is implemented across its actual catalog, navigation, order,
  localization, source and completion consumers; no global page cap exists, so never
  infer one from a watch/recommendation limit or an old literal count), non-Latin name fills
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
- Dark realm (D85): the furnisher is not spawned and nothing is sold while the boot config
  is false; the tables and item defs are the same data on every host.
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


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_content.test.ts
  tests/furnishing_item_kind.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/recipe_economy.test.ts
  tests/provisioner_firewall.test.ts tests/market_filters.test.ts tests/architecture.test.ts
  tests/storage_charters.test.ts tests/server/freehold_wire.test.ts`; `npm run wiki:content`
  then `npx vitest run tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  content-obligations-reviewer (the whole obligation list against the diff),
  architecture-reviewer (the furnisher spawn predicate and the Reliquary shelf consumers
  in src/sim/), cross-platform-sync (the same tables and spawn on both hosts),
  frontend-seam-reviewer (the Hearth shelf navigation and labels in src/ui/),
  test-coverage-auditor (every literal pin), then qa-checklist (the completion gate).
  Prompt each for COVERAGE not filtering; each writes its report to a file. Do not commit until ALL findings, including nits, are resolved consistently with
  locked rulings and the fixes have fresh review.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: content-obligations-reviewer, architecture-reviewer, cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
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
  a numeric `r` (the rug carries 0); no Charter def has a price or copy field, and no furnishing has a buff or stat field.
- [ ] content-obligations-reviewer confirms all findings resolved and the fresh fix review passed.
- [ ] `grep -rn "wyrmfall_core\|sundered_essence\|makers_ember\|quickening"
  src/sim/content/freehold/` returns nothing.
- [ ] Every new item id has a committed WebP and a mapping.json provenance row; the vendor
  has a world_entity_i18n.ts row; wordy English names carry their five fills.
- [ ] The dark-realm arm in tests/server/freehold_wire.test.ts proves no furnisher entity
  with FREEHOLDS_ENABLED unset and the eight-id stock with '1' (D85); both Homesteader
  rows `homesteader_first_furnishing` and `homesteader_first_cottage` carry trigger kind
  `manual` and sit at the END of DEED_ORDER (pinned in tests/deeds_content.test.ts by
  literal id); no raise site lives in this phase (08 and 15 own them).
- [ ] All STEP 3 suites green.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 03, notes, named unsigned gates, the exact
  Hearth page inventory)
  and docs/freeholds/state.md (the per-phase ledger row 03: new files, item ids, the
  vendor id, deed ids, page ids, i18n keys; the source-freeze and calibration artifact, its owner and release evidence).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-03-qa.md

STOPPING RULES:
- A ledger family without an eligible protected-envelope-safe input fails the content
  artifact acceptance; production remains gated until its owner-approved source row exists.
  The Hearth shelf has no invented total-page ceiling.
- Stop if the icon pipeline cannot produce a provenance row for an id (never commit a
  WebP without one).
- Do not push the branch; never merge a PR.
```
