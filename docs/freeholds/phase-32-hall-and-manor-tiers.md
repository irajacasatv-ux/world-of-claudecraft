# Phase 32: Great Hall, Manor, Bastion tiers and build projects

Wave C, Guildhalls. The spec is `progress.md` "32 Great Hall, Manor, Bastion tiers and
build projects"; the decisions are `state.md` and `brainstorm.md` (D2 in-place upgrades,
D6 for the chest, D7 for stations, the Phase 21 upgrade project, the Phase 29 Hall Fund).
This phase ships the uncommon and rare rungs of both ladders (`great_hall`, `manor`,
`bastion`), multi-week build projects with a shared progress bar, project trophies,
guild-only vendors that visit when a project completes, and the Materials Vault chest.

### Starter Prompt
```
This is Phase 32 of the Freeholds and Guildhalls feature: Great Hall, Manor, Bastion
tiers and build projects (three tiers with layouts, shared multi-week projects, project
trophies, visiting vendors, the Materials Vault chest).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: extend both tier ladders to their rare rung on the seams Phases 21, 28, and 29
built (in-place upgrade projects, the Hall Fund), with every bill free of Perfecting
keystones, every project deterministic across realm weeks, and nothing ever lost.

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
- Memory scan: MEMORY.md and entries on content obligations, the provisioner firewall,
  interior layouts and colliders, point-light budgets, the escrow-delta idiom, test-pin
  traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "32 Great Hall, Manor,
  Bastion tiers and build projects"), and this file
- src/sim/content/freehold/tiers.ts, charters.ts, dungeons.ts, trophies.ts (the ladder as
  extended by Phases 21 and 28; the indices in use), src/sim/content/freehold/layouts.ts
  (the Lodge and Meeting Hall layouts, D23) and src/sim/dungeon_layout.ts (the helpers
  only: DAWNHOLD_LAYOUT as the model, authoredLiftAt, layoutColliders),
  src/sim/colliders.ts (STATIC_INTERIOR_COLLIDERS), src/sim/world.ts (the groundHeight
  interior arms), src/render/dungeon.ts (the variant union) and the freehold dressing
  modules under src/render/freehold/
- src/sim/freehold/: the Phase 21 upgrade project module (state, bill, fee grant, layout
  carry-over), the Phase 28 and 29 Hall Fund and donation modules, amenities.ts (the
  station slot and the D6 strongbox arm), instance.ts (claim rehydrate, DungeonNpcSpawn)
- src/sim/bank.ts and the vault modules (nearBanker, the vault proximity gate,
  vault_craft_gate.ts), server/vault_wire.ts (emitVaultSelfKeys), server/claudium.ts (the
  freehold spend arm from Phase 15 and 21), src/sim/content/professions.ts (the vendor
  and NPC record shapes; grep the vendor tables data.ts merges)
- src/ui/hud/housing/ (the steward panel and the Phase 21 project view),
  tests/freehold_content.test.ts, tests/freehold_upgrade.test.ts, tests/provisioner_firewall.test.ts
The agent returns: the tier row fields and the working numbers already pinned; the six
layout touch points per interior; the Phase 21 project state machine and how Phase 29
pays a guild bill from the Hall Fund; the vault gate composition for a chest (the D6
twin); the vendor NPC record and how a conditional spawn is expressed at claim
rehydrate; three free DungeonDef indices; the project-trophy prop shape; the extraction
candidates that pay for new delegates. Settle in STEP 1 and record in state.md: the
materials bill per tier (tier 3 and 4 fine materials and tier 4 produce, flagged TUNING,
Fernando owns the finals) and whether a guild project accepts contributions from every
member or only the Hall Fund.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent CONTENT: tiers.ts rows (great_hall: rooms 2, budget 120, plinths 8, amenity 2;
  manor and bastion: rooms 3, budget 200, plinths 14, amenity 3, the state.md working
  values), the three upgrade SKUs in charters.ts (no price, no copy; the economy service
  owns prices), three DungeonDefs (spawns: [], guideVisible: false, claimKey: 'owner',
  absent from FINDER_ACTIVITIES), the bills, project trophies in trophies.ts, the
  Homesteader deeds for Manor and Bastion, wiki regen and guide keys, art through the
  image-to-glb skill or registered stand-ins (D13), world-entity names for the vendors.
- Agent SIM: the three layouts in src/sim/content/freehold/layouts.ts (D23) with lifts,
  STATIC_INTERIOR_COLLIDERS entries, groundHeight arms; src/sim/freehold/build_project.ts generalised from Phase 21 (a shared progress
  model, contributions merged through the Phase 29 escrow-delta idiom, weeks counted on
  ctx.resetDay through the realm weekly boundary, completion when bill and fee are both
  settled); the visiting vendor spawned at claim rehydrate only when the project key is in
  the record; the Materials Vault chest in amenities.ts composing into the vault
  proximity gate (a D6 twin, negative-tested for a visitor and below condition 30);
  tests/freehold_build_project.test.ts and the tier pins in tests/freehold_content.test.ts.
- Agent CLIENT: the three render variants and dressing within the point-light budget,
  the project tab in the steward panel with the shared bar (guild and freehold), the
  mobile sheet decision, hudChrome.housing.* keys, pr_shot_targets entries.
- Agent SERVER: the spend arm for the three SKUs riding the Phase 21 upgrade grant, pooled
  from the Hall Fund for guilds per Phase 29, exactly-once by purchase key; the vault self
  key emitted inside an owned Manor claim through the emitVaultSelfKeys gate arm; tests
  under tests/server/.
The coordinator edits last: tests/world_api_parity.test.ts if the facet grows,
tests/snapshots.test.ts if a key changes, tests/monolith_budget.test.ts. Every agent
writes any report longer than a screen to a file and replies with the path plus a
short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: no Rng in tiers, projects, or vendor visits; weeks come from ctx.resetDay.
- Never sell power: vendors sell furnishings and cosmetics only; the project trophy is
  earned; no amenity changes a combat, progression, gathering, or drop number.
- Keystone exclusion in every bill (wyrmfall_core, sundered_essence, makers_ember, gear
  intermediates, the quickening catalyst), pinned by the provisioner firewall arm.
- Nothing destroyed: an unfinished project keeps every contribution forever; no expiry.
- Money gates for the upgrade SKUs: counsel sign-off before enable, FREEHOLDS_ENABLED
  default off, the surface map pinned; the economy service owns prices and token math;
  the token firewall holds in src/sim/.
- Server authority; the i18n policy in docs/freeholds/implementation-plan.md; vocabulary
  fixed; "phase" in no code, comment, commit, or PR text; zero farm beds; monolith
  ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- Keep, Citadel, Fortress (Phase 40); wards (Phase 34); dyes (Phase 41); a second
  freehold (Phase 42); guild deeds (done in Phase 31).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_content.test.ts
  tests/freehold_build_project.test.ts tests/freehold_upgrade.test.ts
  tests/provisioner_firewall.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts
  tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/recipe_economy.test.ts
  tests/market_filters.test.ts tests/world_api_parity.test.ts tests/snapshots.test.ts
  tests/renderer_compile_gate.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts tests/localization_fixes.test.ts` plus the
  tests/server/ suites the SERVER slice added; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`;
  `npm run perf:tour`; `node scripts/pr_screenshots.mjs`.
- Spawn review agents per docs/freeholds/implementation-plan.md: content-obligations-reviewer,
  architecture-reviewer, plus render-performance-reviewer (new interiors are GPU
  producers), frontend-seam-reviewer (src/ui/), and privacy-security-review (server/).
  Prompt each for COVERAGE not filtering; each writes its report to a file. Do not commit
  until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Great Hall, Manor, and Bastion tiers with their build bills
- feat(sim): add shared build projects, visiting vendors, and the Materials Vault chest
- feat(render): dress the three new interiors within the light budget
- feat(ui): show shared project progress in the steward panel
- test(sim): pin the keystone exclusion and the exactly-once upgrade grant
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The tier table (rooms, budget, plinths, amenity slots) is pinned by fresh literals
  for all three tiers; the layouts derive their colliders (what you see is what you bump).
- [ ] A project completes only when bill and fee are both settled, across two realm
  weeks, identically on a same-seed twin run; two members' contributions merge without
  loss (escrow-delta pin).
- [ ] The vendor NPC spawns at claim only after completion; the Materials Vault chest
  opens the vault inside the owner's Manor and never for a visitor or below condition 30.
- [ ] No bill names a keystone, a gear intermediate, or the catalyst (firewall arm green).
- [ ] Three point lights at LOW in every new interior; no live-program events on the
  perf tour; screenshots committed under docs/screenshots/.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 32, notes, deferrals) and
  docs/freeholds/state.md (ledger row 32; the content numbers table gains the three
  tiers; the bill and contribution decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-32-qa.md

STOPPING RULES:
- Stop and ask if a bill cannot be filled from tier 3 and 4 materials without a gear
  intermediate; never widen the firewall.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
