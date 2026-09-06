# Phase 02: the `furnishing` item kind

Wave A, the Cottage MVP. The spec is `progress.md` "02 Furnishing item kind"; the decisions
are `state.md` (the `OtherItemDef` Exclude gotcha, D17's collision radius on every def) and
`state.md` D4 and D14. This phase ships the ONE new item kind the whole feature adds,
`FurnishingItemDef`, threaded through every kind consumer and pinned with a synthetic fixture.
No shipped item carries the kind yet, so no art obligation fires.

### Starter Prompt
```
This is Phase 02 of the Freeholds and Guildhalls feature: the furnishing item kind
(FurnishingItemDef, the 'furnishing' ItemKind member, every kind consumer, the tooltip core).

Harness: Codex. Asset generation in this implementation must use Codex, not Claude.
Follow AGENTS.md and root/directory CLAUDE.md repository contracts; use the active Codex
model and the existing image/model/SFX pipelines, provenance and quality gates.

Goal: add the 'furnishing' item kind with its own narrow def, give every compile-time record
and every runtime kind switch an explicit arm (refusal, storability, presentation), add the
furnishing tooltip pure core, and pin the whole consumer sweep with a synthetic def so the
content phases can ship furnishing ids without touching a kind consumer again.

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
- Memory scan: MEMORY.md and entries on test-pin traps (the constant self-comparison pin),
  the monolith ratchet (hud.ts), the UI pure-core rule, i18n English-only catalogs, guard
  exemptions that must be positive predicates.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "02 Furnishing item kind"), and
  this file
- src/sim/types.ts (ItemKind, BaseItemDef, OtherItemDef and its Exclude list, RecipeItemDef
  as the narrow-def model with `?: never` bars, the ItemDef union)
- src/sim/inventory_sort.ts (KIND_RANK), src/ui/item_kind_label.ts (ITEM_KIND_LABEL_KEYS),
  src/sim/bags.ts (UNSTACKED_KINDS, stackSizeOf)
- src/sim/market_query.ts (MarketItemTypeFilter; the exported marketItemMatches and the
  private itemMatchesType arm it calls), src/ui/bag_filter.ts,
  src/ui/market_view.ts, src/ui/market_armor_badge.ts, src/ui/market_name_color.ts
- src/ui/icons.ts (the procedural fallback by kind), src/ui/bags_view.ts (the per-kind
  tooltip lines and the clickUse hint), src/ui/item_name_color.ts,
  src/ui/hud/action_bar/action_bar_controller.ts (which kinds may sit on a bar slot),
  src/ui/bag_item_context_menu.ts, src/ui/equip_drop_core.ts
- src/sim/items.ts (the useItem kind chain), src/sim/equipment_rules.ts,
  src/sim/exchange_eligibility.ts, src/sim/professions/{crafting.ts,disenchant_reagents.ts,
  salvage.ts,enchanting.ts,sundering.ts,perfecting.ts,commission.ts,tools.ts} (the kind gates
  on craft output, disenchant, salvage, sunder, perfect), src/sim/item_level.ts,
  src/sim/item_budget.ts (a hoe has no item-level budget: the model), src/sim/reliquary.ts
  (the pattern exclusion arm), src/sim/vendor_stack.ts, src/sim/vendor_buy_stack.ts
- src/sim/bank.ts, src/sim/guild_bank.ts, src/sim/social/trade.ts, src/sim/mail/post_office.ts,
  src/sim/market.ts (the storability and tradability gates by kind)
- src/ui/hud/professions/recipe_pattern_tooltip_view.ts and its composer call site in
  src/ui/hud.ts (grep the recipe tooltip block), src/ui/hud/professions/index.ts (the domain
  barrel shape), src/ui/hud/CLAUDE.md, src/ui/CLAUDE.md (UI_PURE_CORES, tooltip rules),
  tests/architecture.test.ts (the UI_PURE_CORES registry), docs/design/tooltip-writing.md
- the item-names catalog module under src/ui/i18n.catalog/ that carries `itemUi.kind.*`
- tests/market_filters.test.ts (the sweep that fails on a kind with no arm),
  tests/item_name_color.test.ts, tests/recipe_pattern_items.test.ts (the def-shape pins),
  tests/monolith_budget.test.ts (the hud.ts row)
- Root CLAUDE.md "Modularity" and "Invariants", src/sim/content/CLAUDE.md (item def rules)
The agent returns: the exact narrow-def shape to add and the Exclude list edit; the census
of every kind consumer grouped as compile-time record, runtime refusal arm, storability
gate, or presentation branch, each with the file, the function, and the arm it needs; the
market chip recipe (filter member, the private itemMatchesType arm behind the exported
marketItemMatches, chip label key) and the bag chip
precedent for patterns; the tooltip composer seam and what it costs in hud.ts lines (plus an
extraction candidate that pays for it); the catalog module and key path for
`itemUi.kind.furnishing`; the UI_PURE_CORES registration line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:

Deliverables (at most five):
1. Narrow furnishing type plus complete refusal/storability/economy consumer census.
2. Kind presentation, the market filter, All-only ordinary bags and the icon fallback.
3. The registered tooltip core, English housing keys and decisive consumer fixtures.

The dedicated housing palette is a bags-family furnishing filter with a Trophies tab
in Phase 11. Do not reopen a general bag-chip choice. The furnishing-tooltip core returns only
hudChrome.housing.* keys and values; itemUi.kind.furnishing remains the shared kind
label. Author every tooltip with docs/design/tooltip-writing.md and the tooltip skill.
The tooltip leaves this phase owns are exactly these NEW keys with this English (D92;
sentence case; the resolved values come from the def): hudChrome.housing.furnishing.footprint
"Footprint: {width} by {depth} cells.", hudChrome.housing.furnishing.decorCost "Decor cost:
{cost}.", hudChrome.housing.furnishing.surfaceFloor "Placed on the floor." (the only Wave A
surface; 25 adds its own furnishing.surface* rows when typed surfaces land) and
hudChrome.housing.furnishing.maker "Made by {maker}." (rendered only when the copy carries
a signer); the build-mode rows hudChrome.housing.build.decorTooltip (11) and
build.surface (25) are different sinks and are not reused here. ux-spec carries the four
rows with owner 02 and this phase regenerates ux-key-manifest.json with every cited
count updated (D92). Record the complete new English leaf inventory against that list,
not a hardcoded claim of two leaves.
The default floor surface describes placement support; model geometry and walk-through
rules come from content-manifest.md and its measured layout/art rows. Later typed
wall/table/ceiling support is added explicitly in 25, without guessing art dimensions.

Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent KIND: src/sim/types.ts (FurnishingItemDef extends BaseItemDef { kind: 'furnishing';
  furnishing: { footprint, r, decorCost, surface: 'floor', plinth?: boolean }; use?: never;
  feast?: never; stackSize?: never }, where `r` is REQUIRED on every def and `r: 0` means
  walk-through, the rug case; 'furnishing' on ItemKind, the OtherItemDef Exclude
  edit, the ItemDef union append), src/sim/inventory_sort.ts KIND_RANK (the rank immediately after tool, before the next existing kind; preserve all existing relative ordering), src/sim/bags.ts UNSTACKED_KINDS (one per slot), and every
  src/sim/ refusal and storability arm: equip (equipment_rules.ts), disenchant, salvage,
  sunder, perfect, craft output, the Exchange eligibility (D25: eligible per the mount
  rule, pinned once here and never reopened), useItem (a furnishing has NO use arm, ever;
  placement is the place_furnishing command Phase 08 adds, so using one consumes nothing
  and does nothing), bank, guild bank, trade, mail, market (tradable, storable),
  item_level and item_budget (no item-level budget, the hoe model), reliquary (NOT excluded:
  the Hearth shelf in Phase 03 needs the kind eligible; only patterns are excluded).
- Agent UI: src/ui/item_kind_label.ts ITEM_KIND_LABEL_KEYS with the English
  `itemUi.kind.furnishing` key in the item-names catalog module, src/sim/market_query.ts
  plus src/ui/market_view.ts (a `furnishing` browse chip with its label key),
  src/ui/bag_filter.ts (reachable through All like patterns; no new general bag chip, while Phase 11 owns the furnishing-only palette filter), src/ui/icons.ts (a furnishing fallback arm, never the junk
  cascade), src/ui/bags_view.ts (no use hint for a furnishing), the action-bar controller
  (a furnishing never sits on a bar slot, pinned), the context menu and equip-drop cores.
- Agent TOOLTIP: src/ui/hud/housing/{index.ts,CLAUDE.md,furnishing_tooltip_view.ts}: a
  DOM-free pure core on the recipe_pattern_tooltip_view.ts precedent (footprint, decor
  cost, surface, a provenance line slot for the Maker's Bond instance field
  ItemInstancePayload.signer in src/sim/types.ts, never a def field), registered in
  UI_PURE_CORES, wired through the existing tooltip composer seam, returning only the
  four hudChrome.housing.furnishing.* keys named above with their resolved values; if
  hud.ts must gain a line, pay with the extraction the Explore summary named and LOWER
  the hud.ts ceiling in tests/monolith_budget.test.ts; tests/furnishing_tooltip_view.test.ts
  (one `it` per key, the English pinned by literal); the ux-key-manifest.json regeneration
  with its counts (D92).
The coordinator assembles tests/furnishing_item_kind.test.ts last: one synthetic def
(never a shipped id) driven through every consumer group each agent touched, one arm per
`it`, a negative case per refusal arm (the refusal is observable: nothing consumed, nothing
moved, the reason token or false result asserted by literal), and the storability arms in
both directions (deposit accepted, quest-kind refusal untouched).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: no Rng, no wall clock; the kind adds data and gates only.
- One sim, three hosts: the kind is a sim type; every arm lives in src/sim/ or src/ui/,
  nothing in the client predicts an outcome.
- Never sell power: FurnishingItemDef carries no stat, buff, aura, or drop field (the
  `?: never` bars are the compile-time pin; the sweep test is the runtime pin).
- i18n: the contributor policy in docs/freeholds/implementation-plan.md; the shared kind and market labels plus every hudChrome.housing.* tooltip leaf are English-only; the
  tooltip core returns keys and values, never rendered text.
- Token firewall (the state.md scope): no on-chain word (wallet, token, $WOC, mint, holder,
  marketplace, on-chain, Solana) in src/sim/; deed ids and deedsEarned are Book of Deeds
  game content, not firewall vocabulary; the new arm in exchange_eligibility.ts follows the
  existing mount arm's wording.
- The monolith note: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO
  slack (this phase should touch none of them); hud.ts is in the ratchet too.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any shipped furnishing id, art, deed, or Reliquary page (Phase 03 and 04).
- The place_furnishing command (Phase 08; a furnishing never gains a use arm); build mode
  (Phase 11).
- Any src/sim/freehold/ behavior, instance, layout, render, or server work.


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit` (both exhaustive records must red until the arms exist, then
  clean); `npx vitest run tests/furnishing_item_kind.test.ts
  tests/furnishing_tooltip_view.test.ts tests/market_filters.test.ts
  tests/item_name_color.test.ts tests/recipe_pattern_items.test.ts tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts`; then
  `npm run i18n:gen` and `npx vitest run tests/i18n_completeness.test.ts
  tests/localization_fixes.test.ts`; `npx vitest run tests/bank.test.ts
  tests/craft_from_vault.test.ts tests/professions_feast.test.ts` (neighbouring kind gates
  unchanged).
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  cross-platform-sync (the sim type and every gate arm behave the same offline and online),
  architecture-reviewer (the kind arms inside the src/sim/ gates: bank, guild bank, trade,
  mail, market, equipment), frontend-seam-reviewer (the tooltip core, the chips, the
  icon arm), test-coverage-auditor (the sweep and every negative arm), then qa-checklist
  (the completion gate). Prompt each for
  COVERAGE not filtering; each writes its report to a file. Do not commit until ALL findings, including nits, are resolved consistently with
  locked rulings and the fixes have fresh review.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: cross-platform-sync, architecture-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
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
3 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(items): add the furnishing item kind with explicit arms in every kind gate
- feat(ui): label, browse chip, icon fallback, and the furnishing tooltip core
- test(items): sweep every kind consumer with a synthetic furnishing def
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] `npx tsc --noEmit` is clean with 'furnishing' present in KIND_RANK and
  ITEM_KIND_LABEL_KEYS, and OtherItemDef's Exclude list names it (grep pins it).
- [ ] tests/market_filters.test.ts, tests/item_name_color.test.ts, and
  tests/furnishing_item_kind.test.ts are green; every refusal arm (equip, disenchant,
  salvage, sunder, perfect, bar slot) has a negative case; Exchange eligibility is pinned
  per D25 (eligible per the mount rule).
- [ ] `grep -rn "kind: 'furnishing'" src/sim/content/` returns nothing (no shipped id, no
  art obligation triggered); tests/item_icons.test.ts is unchanged and green.
- [ ] furnishing_tooltip_view.ts is in UI_PURE_CORES; hud.ts did not grow (or its ceiling
  is LOWER than before).
- [ ] The S3 guard and i18n completeness pass with the complete declared English leaf
  inventory: the four hudChrome.housing.furnishing.* keys carry the English named in
  STEP 2 byte for byte, and ux-key-manifest.json is regenerated with owner-02 rows and
  updated counts (D92).
- [ ] All STEP 3 suites green; all required reviewers confirm all findings resolved and the fresh fix review passed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 02, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 02: new files, the kind and all i18n
  keys; the fixed KIND_RANK and All-only bag behavior as verified; D25 already holds the Exchange
  ruling, do not restate it).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-02-qa.md

STOPPING RULES:
- Stop and ask if a kind consumer cannot take an explicit arm without changing behavior
  for an existing kind (every arm must be additive).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
