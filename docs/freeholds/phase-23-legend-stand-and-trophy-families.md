# Phase 23: the Legend Stand and the remaining trophy families

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "23
Legend Stand and the remaining trophy families"; the decisions are `state.md` and
`brainstorm.md` (D19: trophies are furnishing-shaped records, never items). This phase
ships the Legend Stand (a named Perfected legendary with the player's name and the
Maker's Bond `craftedBy` on the plaque; the item stays in the owner's possession and the
stand reads the instance), the Harvestmaster golden sheaf, the four regional first-harvest
markers, the grandmaster workshop banners, the bronze, silver, and gilded finishes by
normal, heroic, and rift S-rank, every ready family Phase 17's MVP set left out, their
art, and the in-world cosmetic wear below condition 30 (the cold hearth light, the dull
trophy finishes) that D22 assigns here with the finishes. It is a content phase with a
sim eligibility half and a render half.

### Starter Prompt
```
This is Phase 23 of the Freeholds and Guildhalls feature: the Legend Stand and the
remaining trophy families (the Legend Stand, the Harvestmaster sheaf, the first-harvest
markers, the grandmaster banners, the three finishes, the remaining ready families, art).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices over the Phase 17 seams).

Goal: complete the trophy catalogue so every earned deed, page, mark, mount, set, and
Perfected legendary the game already records maps to a plinth trophy with the right
finish, retroactively and deterministically, with no trophy ever an item, and draw the
cosmetic wear a house shows below condition 30.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet, parity goldens and
  META_EXCLUDE, test-pin traps, the content cluster (deeds count re-pins), the
  image-to-glb gotchas, the render scheduler rules.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "23 Legend Stand and the
  remaining trophy families"), and this file
- src/sim/content/freehold/trophies.ts (TROPHY_DEFS and the MVP family set),
  src/sim/freehold/trophy_eligibility.ts and trophies.ts (syncTrophyUnlocks, the retro
  block call site), src/sim/freehold/layout_core.ts (plinth slot rules),
  src/sim/freehold/types.ts (the trophy record on FreeholdState), src/sim/freehold/CLAUDE.md
- src/sim/content/deeds.ts (prog_legendmaker, prog_farming_100, col_golden_harvest,
  prog_field_to_feast, col_deepest_cast, the four regional first-harvest deeds, the
  jewelcrafting and inscription grandmaster deeds, the dungeonClears triggers for normal
  and heroic clears, every boss and world-boss deed; DEED_ORDER), src/sim/deeds.ts
  (deedsEarned, deedStats), src/sim/reliquary.ts (characterReliquaryOwnership,
  illuminatedPages, the Harvestmaster page id), src/sim/content/reliquary.ts
- The rift S-rank record (grep the S-rank mark or stamp under src/sim/rift/), the
  `slain:*` marks, mount possession, the seven armor sets (the set ids), the twelve
  ready families listed in the proposal (Thunzharr, Nythraxis, Ignivar and Varkhul,
  Korzul, Morthen, Vael, Ysolei, the Wildheart High Priest, six mounts, the realm-rare
  marks, seven armor sets, profession specimens)
- The Perfected legendary: src/sim/types.ts (the `perfected` stamp, the promotion, the
  player-chosen name field, the Maker's Bond `craftedBy` on the instance),
  src/sim/professions/perfecting.ts, the item instance identity the sim uses to find a
  copy across bags, bank, vault, and equipment (item_copy_ref.ts and the bank and vault
  containers)
- src/render/freehold/ (the trophy props and stand-in kit, the prewarm homes, the
  registry), src/render/point_light_budget.ts, src/render/CLAUDE.md ("GPU work"),
  src/ui/hud/housing/trophy_tooltip_view.ts and the trophy case tab, src/ui/i18n.catalog/
  hud_chrome.ts (hudChrome.housing.trophy.*), src/ui/world_entity_i18n.ts
- server/freehold_wire.ts (the descriptor emitter), src/net/freehold_snapshot_wire.ts
  (the strict decode), tests/snapshots.test.ts (ALL_DELTA_KEYS), tests/parity/trace.ts
- tests/freehold_trophies.test.ts, tests/deeds_content.test.ts,
  tests/reliquary_content.test.ts, tests/trophy_tooltip_view.test.ts,
  tests/renderer_compile_gate.test.ts, tests/monolith_budget.test.ts
The agent returns: the MVP family set versus the twelve ready families (the exact
difference this phase ships) with the literal deed, page, mark, mount, and set ids per
family; the Perfected legendary's instance fields (stamp, promotion, chosen name,
craftedBy) and the one read that finds a copy in the owner's possession; how normal,
heroic, and rift S-rank clears are recorded (the field per tier); the trophy record and
descriptor row shapes and where a plaque block and a finish would be appended; the
render registry and prewarm recipe; the deeds and reliquary count pins to re-pin.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (tests/world_api_parity.test.ts
if a member changes, tests/snapshots.test.ts, tests/deeds_content.test.ts and
tests/reliquary_content.test.ts counts, tests/monolith_budget.test.ts, the parity goldens):
- Agent ELIGIBILITY (sim): trophy_eligibility.ts extended with one pure mapping per new
  family (deed id, illuminated page, mark, mount, set, and the Perfected legendary to
  trophy ids), `finishFor(sourceTier)` mapping normal to bronze, heroic to silver, rift
  S-rank to gilded; `legendStandCandidates(meta)` (an item in the owner's possession
  with the `perfected` stamp, the legendary promotion, and a chosen name); the Legend
  Stand trophy record stores the instance reference, and the descriptor projects the
  plaque at emit time by explicit field picks (chosen name, base item name, craftedBy,
  the promotion day), never the instance; an item that leaves the owner's possession
  darkens the stand (an empty plaque) and removes nothing; syncTrophyUnlocks covers the
  new families with `retro: true` events and draws no Rng; tests/freehold_trophies.test.ts.
- Agent CONTENT: the new TROPHY_DEFS rows in src/sim/content/freehold/trophies.ts
  (trophy id, source kind and id, prop model key, finish; ids are frozen once persisted;
  trophy ids disjoint from every item id, pinned), hudChrome.housing.trophy.* English
  names and the plaque line keys, world-entity names where a prop is named,
  `npm run wiki:content` plus spoiler-safe guide.* keys (families named, sources not),
  any Homesteader deed row appended at the END of deeds.ts, the deeds and reliquary
  count re-pins.
- Agent RENDER-ART: the trophy props through the image-to-glb skill registered in the
  furnishing model registry with prewarm homes (stand-ins only for ids without a
  reference image, listed as O5 deferrals), the three finish materials as scheduler
  clients with a prewarm home (never a bare scene attach after boot), the cosmetic wear
  below condition 30 (the hearth light goes cold and every trophy finish goes dull, read
  from the condition summary the descriptor already carries, restored at 30 and above,
  drawn at every tier, D22), the plaque as a
  procedural texture or label mesh within the budget, the trophy_tooltip_view.ts core
  extended with the plaque lines and the finish, the trophy case tab rows;
  tests/trophy_tooltip_view.test.ts, tests/renderer_compile_gate.test.ts arm,
  `npm run perf:tour` through the Cottage with plinths filled.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: eligibility and the retro grant draw no Rng; no wall clock in src/sim/;
  the plaque projection is a pure function of the instance fields.
- D19: trophies are furnishing-shaped records, never items; they occupy plinth slots,
  cost no decor points, and are never tradable (pinned); trophies are earned, never sold.
- The trophy module READS deeds and reliquary state only (write ownership stays pinned
  to reliquary.ts by tests/architecture.test.ts).
- The Legend Stand never moves, consumes, or binds the item; the owner keeps it; a
  hidden field never crosses the wire (explicit field picks in the descriptor).
- Server authority: the client mirrors the descriptor; a visitor sees the owner's
  trophies through the same event.
- Never sell power; the finishes are cosmetic; no purchasable thing changes a number.
- Cosmetic wear is cosmetic (D22): below 30 the hearth light cools and finishes dull;
  nothing a player acts on is hidden (the Steward panel's numbers stay), nothing is
  removed, and the wear reads identically at every graphics tier.
- Content obligations in the SAME change: deeds re-pin, Reliquary untouched for
  trophies (not items), wiki regen plus guide keys, world-entity names, name fills for
  wordy English (M16); no WebP obligation (trophies are not items).
- i18n: the policy in docs/freeholds/implementation-plan.md; the sim emits ids and
  values only (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Guild-level deeds, first-kill banners, raid statues (Phase 31); project trophies
  (Phase 32); the Showcase vote reward (Phase 36); dyes on trophies (Phase 41).
- Any furnishing content (Phase 22) or placement rule (Phase 25).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_trophies.test.ts tests/freehold_content.test.ts
  tests/freehold_determinism.test.ts tests/freehold_condition.test.ts
  tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/trophy_tooltip_view.test.ts
  tests/world_api_parity.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/renderer_compile_gate.test.ts
  tests/localization_fixes.test.ts tests/item_icons.test.ts`; `npm run wiki:content`
  then `npx vitest run tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `npm run perf:tour`; parity goldens regenerated with
  UPDATE_PARITY=1 in their own commit if the retro emit changed a driven scenario.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (eligibility, the retro block, determinism),
  content-obligations-reviewer (the trophy rows, deeds, wiki, names),
  render-performance-reviewer (the props, the finish materials, the prewarm homes).
  Prompt each for COVERAGE not filtering; each writes its report to a file. Do not
  commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Legend Stand and the remaining trophy families
- feat(sim): map Perfected legendaries and clear tiers to plinth trophies
- feat(render): add the trophy props, the three finishes, and the cosmetic wear below thirty
- test(sim): pin trophy eligibility for every family and the no-item rule
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_trophies.test.ts pins eligibility for EVERY family by literal source
  id (deed, page, mark, mount, set, legendary) with a negative case per family, and the
  finish per clear tier (normal bronze, heroic silver, rift S-rank gilded).
- [ ] The Legend Stand: a Perfected, promoted, named item in the owner's possession is a
  candidate; an unnamed or unpromoted item is not; the plaque carries the chosen name,
  the item name, craftedBy, and the day; moving the item out of possession darkens the
  stand and removes nothing; the item is unchanged after placement.
- [ ] The retro grant is idempotent across two joins, draws no Rng, and a visitor sees
  the owner's trophies; no trophy id is an item id; no trophy is tradable (pinned).
- [ ] Below condition 30 the hearth light is cold and every finish is dull on both hosts;
  at 30 the look restores; nothing is removed (tests/freehold_condition.test.ts drives
  the summary, the render core pins the mapping).
- [ ] The props render on every tier with the finishes prewarmed; `npm run perf:tour`
  shows no live-program event; the point-light budget holds.
- [ ] All STEP 3 suites green; the three reviewers report no BLOCKING; the deeds and
  reliquary counts are re-pinned by fresh literals.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 23, notes, the stand-in deferral list)
  and docs/freeholds/state.md (the per-phase ledger row 23: trophy ids, the finish
  union, descriptor fields, i18n keys; any locked decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-23-qa.md

STOPPING RULES:
- Stop and ask if reading the Perfected legendary would require the trophy module to
  write to, lock, or move the item (the stand reads; the owner keeps the item).
- Stop if a family's source cannot be found in the tree (a deed or mark that does not
  exist): record it as OPEN, ship the rest, never invent a source.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
