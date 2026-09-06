# Phase 43: Carpenter and Mason (conditional on furnishing demand and a ruling)

Wave E, depth. The spec is `progress.md` "43 Carpenter and Mason (conditional)"; the
decisions are `state.md` and `brainstorm.md` (D14: a furnishing recipe belongs to an
existing craft; Carpenter and Mason stay a wave E OPTION). This phase runs only if the
measured furnishing demand (wave A's four-week measurement plus wave B) proved out AND
Fernando ruled for it, with the ruling recorded in `state.md`. If the ruling is no, the
phase records "skipped by ruling" and ends. If it is yes, it ships the two off-wheel
crafts with furnishing-only recipes on the existing professions seams.

### Starter Prompt
```
This is Phase 43 of the Freeholds and Guildhalls feature: Carpenter and Mason (the two
off-wheel crafts with furnishing-only recipes), conditional on the ruling recorded in
state.md.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (batch-heavy content, but a fan-out suffices).

Goal: if and only if the ruling is yes, add Carpenter and Mason beside the ten-craft
ring without touching the ring's geometry or any existing recipe's station gate, with
every recipe outputting a furnishing and every pattern reaching a deterministic faucet.

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
- THE RULING GATE: read state.md "Locked decisions" for the Carpenter and Mason ruling.
  ABSENT: STOP and ask Fernando; implement nothing. NO: write "skipped by ruling" with
  the date and the ruling text into docs/freeholds/progress.md rows 43 and 43 QA and
  the status table, commit it alone as `docs(freeholds): record the Carpenter and Mason
  ruling` (with a body), skip STEPS 1 to 5, do STEP 6 and STEP 7, and end. YES: continue.
- Memory scan: MEMORY.md and entries on content obligations, the R8 pattern channels
  and D13, the station gate composition, the professions tuning packet, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the ruling and any scope it names), docs/freeholds/progress.md
  (only "43 Carpenter and Mason"), and this file
- src/sim/content/professions.ts (CraftDef and CRAFT_RING: the fixed ring where opposites
  sit five apart; STATIONS, STATION_TYPE_BY_CRAFT with its load-bearing key order,
  STATION_RADIUS), src/sim/professions/wheel.ts (gainCraftSkill, normalizeCraftSkills,
  isSpecialized), src/sim/professions/stations.ts, training.ts (resolveTrain,
  TRAINING_FEE_BY_TIER, teachTierMet), crafting.ts (evaluateCraftAdmission),
  pattern_items.ts, src/sim/content/apex_patterns.ts and farm_patterns.ts (the channel
  doctrine headers), src/sim/content/freehold/furnishing_recipes.ts and
  furnishing_patterns.ts (Phases 04 and 22), src/sim/content/deeds.ts (the grandmaster
  deed rows per craft), src/sim/material_ids.ts
- src/ui/hud/professions/ (the professions window craft rows), src/ui/i18n.catalog/
  (the professions domain), src/ui/world_entity_i18n.ts (trainer names)
- tests/professions_crafting_hub.test.ts (the six stations by literal),
  tests/professions_zone_rollout.test.ts, tests/apex_pattern_channels.test.ts,
  tests/recipe_pattern_items.test.ts, tests/recipe_economy.test.ts,
  tests/provisioner_firewall.test.ts, tests/deeds_content.test.ts
The agent returns: how a craft can exist OFF the ring (a CraftDef flag or a sibling
table the skill functions admit, with no pole, no adjacency, no specialization) without
changing CRAFT_RING's literal pin; the station decision space (new StationType values
sawmill and masonry with town placements in rolled-out zones and master NPCs, versus
reusing existing types) and which existing tests re-pin; the trainer and recipe
shapes; the pattern channel obligations; the frozen skill key names (carpentry,
masonry). Settle in STEP 1 and record in state.md before implementing: the off-wheel
mechanism, the station types and their placements, the recipe list (furnishings only,
working: ten per craft, every bill keystone-free), and maxSkill.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent CONTENT: the two CraftDef rows in the settled off-wheel home, the station rows
  and master NPCs, trainers, the recipes (output kind furnishing only; bills from
  market-listable materials; never a keystone, a gear intermediate, or the catalyst),
  the patterns as RecipeItemDef rows with a trainer-taught deterministic faucet plus
  the R8 channels under D13, the furnishing items with art and provenance, the
  grandmaster deeds, world-entity names, wiki regen and guide keys, the provisioner
  firewall arm.
- Agent SIM: the off-wheel admission in wheel.ts and the skill normalizer (frozen keys),
  the station gate rows, train resolution at the new stations, the specialization
  refusal for off-wheel crafts (pinned), tests/professions_off_wheel.test.ts (gain to
  maxSkill, no specialization, train only at the station, recipes resolve, same-seed
  twin run, the ring literal unchanged).
- Agent UI: the professions window rows for the two crafts, the craft map order, the
  i18n keys in the professions domain, pr_shot_targets entries, the mobile check.
The coordinator edits last: tests/professions_crafting_hub.test.ts (the station
literals), tests/professions_zone_rollout.test.ts, tests/deeds_content.test.ts counts,
tests/monolith_budget.test.ts. Every agent writes any report longer than a screen to a
file and replies with the path plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Never sell power and the R5 envelope: every recipe of both crafts outputs a
  furnishing; none outputs gear, a gear intermediate, or a consumable with a number.
- Existing recipes and their stationType gates unchanged; the ring geometry unchanged
  (CRAFT_RING's literal pin stays green untouched).
- R18: every furnishing stays market-listable; no ledger or upgrade bill ever requires
  the new crafts.
- Keystone exclusion in every bill; zero farm beds; determinism (no Rng in content or
  gates); the content obligations (deeds, art with provenance, wiki, names, fills).
- The i18n policy in docs/freeholds/implementation-plan.md; token firewall; vocabulary
  fixed; "phase" in no code, comment, commit, or PR text; monolith ceilings never raised.

Out of scope (do NOT do in this phase):
- Gear or consumable recipes for the new crafts (never); specialization or ring
  adjacency for off-wheel crafts; a ring re-layout; any change to a shipped craft.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/monolith_budget.test.ts tests/professions_off_wheel.test.ts
  tests/professions_crafting_hub.test.ts tests/professions_zone_rollout.test.ts
  tests/apex_pattern_channels.test.ts tests/recipe_pattern_items.test.ts
  tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/market_filters.test.ts
  tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/freehold_content.test.ts tests/localization_fixes.test.ts
  tests/hud_update_drive.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`;
  `node scripts/pr_screenshots.mjs`; parity goldens if a sampled field changed.
- Spawn review agents per docs/freeholds/implementation-plan.md: content-obligations-reviewer,
  plus architecture-reviewer (src/sim/ gates) and frontend-seam-reviewer (src/ui/).
  Prompt each for COVERAGE not filtering; each writes its report to a file. Do not commit
  until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits (or the single ruling commit on the skip path), Conventional Commits with
scope and a body, EXPLICIT paths, never `git add -A`, no em dashes or emojis, the word
"phase" nowhere in the message:
- feat(content): add the Carpenter and Mason off-wheel crafts with furnishing recipes
- feat(sim): admit off-wheel crafts in the skill, station, and training gates
- feat(ui): list Carpenter and Mason in the professions window
- test(sim): pin the off-wheel gates and the furnishing-only recipe rule
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The ruling is recorded in state.md and the path taken (built or skipped) is
  recorded in progress.md.
- [ ] Both crafts train only at their station, gain to maxSkill with frozen skill keys,
  refuse specialization, and resolve their recipes; the CRAFT_RING literal pin is
  unchanged; a same-seed twin run agrees.
- [ ] A sweep pins that every recipe of both crafts outputs kind furnishing and names
  no keystone, gear intermediate, or catalyst (with a can-fail control).
- [ ] Every pattern reaches a deterministic faucet (the channels sweep green); every
  new item id has committed art and a provenance row; deeds, names, and the wiki are
  fresh; content-obligations-reviewer reports no BLOCKING.
- [ ] Screenshots committed; all STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 43, "built" or "skipped by ruling" with
  the date, notes, deferrals) and docs/freeholds/state.md (ledger row 43; the
  off-wheel, station, recipe, and maxSkill decisions, or the skip).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status (built, or skipped by ruling), files touched, validation
results, review verdicts, deferred items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-43-qa.md

STOPPING RULES:
- Stop before STEP 1 if the ruling is absent; ask Fernando.
- Stop and ask if an off-wheel craft cannot be admitted without changing CRAFT_RING or
  a shipped craft's skill functions in a behavior-changing way.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
