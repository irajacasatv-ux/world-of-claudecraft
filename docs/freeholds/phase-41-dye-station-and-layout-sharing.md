# Phase 41: dye station and layout sharing

Wave E, depth. The spec is `progress.md` "41 Dye station and layout sharing"; the
decisions are `state.md` and `brainstorm.md` (D4 descriptors, D7 the station amenity
composes into the existing gate, D14 a recipe belongs to an existing craft). This phase
ships the alchemy dye station amenity and dye recipes, dye slots on furnishing defs, and
layout save, load, and share (a layout descriptor export the marketplace never touches).

### Starter Prompt
```
This is Phase 41 of the Freeholds and Guildhalls feature: the dye station and layout
sharing (alchemy dyes applied to furnishing dye slots; layout save, load, and a share
code the marketplace never touches).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: add cosmetic tinting as a placement-time knob on the layout descriptor, produced
by ordinary alchemy recipes at a house amenity of an existing station type, and a pure
layout codec that saves, loads, and shares a layout as a validated descriptor with no
item instances, no prices, and no marketplace involvement.

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
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on world_api parity pins, the station gate
  composition, the R8 pattern channels, material variants and the scheduler, frozen
  save keys, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "41 Dye station and layout
  sharing"), and this file
- src/sim/freehold/amenities.ts (the Phase 12 station amenity slot and the D7
  composition), layout_core.ts and placement.ts (the layout row shape, validation, the
  undo stack), state.ts (the persisted record and its load-side allowlists),
  src/sim/content/freehold/furnishings.ts (FurnishingItemDef; where a dyeSlots field
  lands), src/sim/content/professions.ts (STATION_TYPE_BY_CRAFT, the apothecary type),
  src/sim/professions/crafting.ts (evaluateCraftAdmission), src/sim/professions/pattern_items.ts,
  src/sim/content/farm_patterns.ts (the pattern table shape), tests/apex_pattern_channels.test.ts
- src/world_api/housing.ts (the facet through Phase 38), src/world_api.ts (COMMAND_NAMES,
  COMMAND_FACETS), server/freehold_wire.ts, server/freehold_db.ts (account_freeholds
  columns), server/clean_metadata_text.ts, server/http/middleware/rate_limit.ts
- src/render/freehold/furnishings.ts and furnishing_layout_core.ts (material handling,
  prewarm homes), src/render/CLAUDE.md "GPU work"
- src/ui/hud/housing/ (build mode, the palette), src/ui/i18n.catalog/hud_chrome.ts,
  tests/freehold_layouts.test.ts (Phase 06), tests/freehold_layout_core.test.ts (Phase 08),
  tests/freehold_determinism.test.ts, tests/world_api_parity.test.ts
The agent returns: how a dye rides the layout row (a dye field, allowlisted on load,
frozen id), the amenity composition for a dye station of the existing apothecary type
(no new StationType; recipes and stationType gates unchanged), the dye recipe and
pattern shapes on the R8 and D13 channels with a trainer-taught deterministic faucet,
the material-variant recipe that stays a scheduler client, the facet and command
recipe, the save-slot home (a layout_saves JSONB column on account_freeholds versus a
table), and the extraction candidates. Settle in STEP 1 and record in state.md before
implementing: the dye palette (working: eight dye ids, TUNING), the save-slot cap
(working: 5), the share-code cap in rows, and the save-name screening rule.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SIM: dyeSlots on FurnishingItemDef (0 to 2 tint channels), the dye field on the
  layout row with its load allowlist, the dye_furnishing command in placement.ts
  (consumes one dye item, undoable), the dye station amenity in amenities.ts (apothecary
  type; locked below condition 30), src/sim/freehold/layout_share_core.ts (a pure
  versioned codec: encodeLayoutShare(rows, tier, layoutId) to a base64url string,
  decodeLayoutShare(code) to rows or null through the same layout_core validation;
  no item instances, no prices, no names), the save_layout, load_layout, and
  apply_layout_share commands (a load or apply validates every row against the owner's
  owned furnishing inventory in bags and strongbox; missing pieces become a text-free
  layoutShortfall event listing ids, never a placed ghost), the facet members
  (dyeFurnishing, saveLayout, loadLayout, layoutShareCode as a data read,
  applyLayoutShare), tests/freehold_dye.test.ts and tests/freehold_layout_share.test.ts.
- Agent CONTENT: the dye items (kind junk, common, market-listable, no power), dye
  recipes (alchemy, stationType apothecary, trainer-taught plus a few on the R8
  channels with the D13 marks valve), patterns as RecipeItemDef rows, item art with
  provenance, the deeds and reliquary decisions (dyes take no page), wiki regen and
  guide keys, the provisioner firewall arm for the dye table.
- Agent RENDER+UI: per-(prop, dye) material variants cached and prewarmed (a scheduler
  client; never a per-frame allocation), the dye picker in build mode, the layout tab
  (save, load, share code copy and paste) in the steward panel family, the mobile sheet
  decisions, hudChrome.housing.* keys, pr_shot_targets entries.
- Agent SERVER+NET: the four case labels routed to dispatchFreeholdCommand (paid by
  extraction), a rate limit on apply_layout_share and save_layout, save names screened
  through cleanMetadataText, the layout_saves column or table (additive DDL, an
  exportAccountData row), the ClientWorld one-liners and the decode arm for the dye
  field (paid by extraction), the chain test arm.
The coordinator edits last: tests/world_api_parity.test.ts (five edits),
tests/command_schema.test.ts, tests/command_facets.test.ts, tests/snapshots.test.ts,
tests/monolith_budget.test.ts, parity goldens in their own commit. Every agent writes
any report longer than a screen to a file and replies with the path plus a short
summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Recipes and their stationType gates unchanged: the dye station is an existing station
  type; no new StationType; training still needs the town station.
- The share code carries no item instance, no price, no name, and no marketplace field;
  no woc_market import anywhere in the codec or its consumers (pinned); the token
  firewall holds.
- Never sell power: dyes are cosmetic; no dye or layout changes any number.
- Determinism: the codec is pure and byte-stable across hosts; no Rng; the dye is a
  frozen id once persisted; the load allowlist drops an unknown dye without destroying
  the row.
- Server authority (a load or apply is validated in the sim on the server); the i18n
  policy in docs/freeholds/implementation-plan.md; vocabulary fixed; "phase" in no code,
  comment, commit, or PR text; monolith ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- A layout marketplace or any trade of layouts (never); wall or ceiling dye; the
  second freehold (Phase 42); Carpenter and Mason (Phase 43).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_dye.test.ts
  tests/freehold_layout_share.test.ts tests/freehold_layouts.test.ts
  tests/freehold_layout_core.test.ts
  tests/freehold_determinism.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/freehold_command_chain_online.test.ts tests/professions_crafting_hub.test.ts
  tests/apex_pattern_channels.test.ts tests/recipe_pattern_items.test.ts
  tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts
  tests/market_filters.test.ts tests/renderer_compile_gate.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts tests/localization_fixes.test.ts` plus the
  tests/server/ suites and the pg-armed twin; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`;
  `npm run perf:tour`; `node scripts/pr_screenshots.mjs`; parity goldens if regenerated.
- Spawn review agents per docs/freeholds/implementation-plan.md: architecture-reviewer,
  frontend-seam-reviewer, plus cross-platform-sync (facet and commands),
  render-performance-reviewer (material variants), content-obligations-reviewer (dye
  items and recipes), and privacy-security-review (server/ and src/net/). Prompt each
  for COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add furnishing dye slots, the dye command, and the dye station amenity
- feat(content): add alchemy dyes, their recipes, and patterns on the existing channels
- feat(sim): add the pure layout share codec with save, load, and apply commands
- feat(render): tint furnishings through cached, prewarmed material variants
- feat(ui): add the dye picker and the layout tab to build mode and the steward panel
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] A dye applies to a declared slot, consumes one dye item, undoes, persists as a
  frozen id, and an unknown dye on load is dropped without destroying the row; the
  station gate composition leaves every recipe's stationType unchanged (pinned).
- [ ] The codec round-trips byte-identically on both hosts; a tampered code decodes to
  null; an apply with missing pieces emits the shortfall ids and places nothing; the
  codec and its consumers import nothing from the marketplace (grep pin).
- [ ] Dye recipes reach a deterministic faucet (the channels sweep green); every dye
  item has committed art and a provenance row; dyes take no Reliquary page.
- [ ] Material variants are prewarmed (no live-program events on the perf tour) and
  never allocated per frame; the picker and layout tab render on desktop and as mobile
  sheets; screenshots committed.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 41, notes, deferrals) and
  docs/freeholds/state.md (ledger row 41: facet members, commands, events, columns,
  i18n keys; the palette, cap, and screening decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-41-qa.md

STOPPING RULES:
- Stop and ask if a dye recipe cannot be gated by the apothecary type without touching
  another recipe's stationType (that gate is frozen).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
