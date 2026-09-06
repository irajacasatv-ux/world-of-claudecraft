# Phase 40: Keep and Citadel tiers, prestige deeds

Wave E, depth. The spec is `progress.md` "40 Keep and Citadel tiers, prestige deeds"; the
decisions are `state.md` and `brainstorm.md` (D2 in-place upgrades, the Phase 21 and 32
build projects, D19 trophies). This phase ships the epic and legendary rungs of both
ladders (`keep` and `citadel` for freeholds, `fortress` and the guild `citadel`) with
courtyard and tower layouts, decor budgets 300 and 420, and the prestige-deed gate on the
top two tiers. The prestige-deed choice (a Reliquary curator rank, a raid clear, or the
Legendmaker deed, and who on the account must hold it) is a Fernando ruling recorded in
`state.md` BEFORE this phase starts; without it the phase does not begin.

### Starter Prompt
```
This is Phase 40 of the Freeholds and Guildhalls feature: Keep and Citadel tiers and the
prestige-deed gate (keep, citadel, fortress, and the guild citadel with courtyard and
tower layouts; budgets 300 and 420).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: extend both ladders to their legendary rung on the Phase 32 project seam, gate the
top two tiers on the ruled prestige deed (accomplishment, never money alone), and keep
every courtyard and tower within the light budget and the collider derivation.

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
- THE RULING GATE: read state.md "Locked decisions" for the prestige-deed ruling (which
  source gates Keep and Citadel: a Reliquary curator rank, a raid clear, or the
  Legendmaker deed; and whether the purchasing character or any character on the
  account must hold it). If it is absent, STOP and ask Fernando; implement nothing.
- Memory scan: MEMORY.md and entries on content obligations, interior layouts and
  colliders, point-light budgets, the provisioner firewall, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the ruling, the content numbers table), docs/freeholds/progress.md
  (only "40 Keep and Citadel tiers, prestige deeds"), and this file
- src/sim/content/freehold/tiers.ts, charters.ts, dungeons.ts, trophies.ts (the ladder
  through Phase 32; free indices), src/sim/content/freehold/layouts.ts (the Manor and
  Bastion layouts, D23) and src/sim/dungeon_layout.ts (the helpers only: authoredLiftAt,
  DAWNHOLD_STAIR_LIFT as the tower model), src/sim/rift/authored.ts
  (AuthoredRoom, AuthoredLedge), src/sim/colliders.ts (STATIC_INTERIOR_COLLIDERS),
  src/sim/world.ts (groundHeight interior arms), src/render/dungeon.ts (the variant
  union; whether an open-sky room exists in any kit), src/render/point_light_budget.ts
- src/sim/freehold/build_project.ts (Phase 32), the Phase 21 upgrade gate module,
  src/sim/deeds.ts (deedsEarned), src/sim/reliquary.ts (curatorRankFromOwned,
  CURATOR_RANK_DEFS), src/sim/content/deeds.ts (prog_legendmaker, the raid clear deeds),
  server/claudium.ts (the freehold spend arm), src/sim/freehold/ward_core.ts (exterior
  shells per tier from Phase 34)
- src/render/freehold/ (the dressing modules), tests/freehold_content.test.ts,
  tests/freehold_build_project.test.ts, tests/provisioner_firewall.test.ts
The agent returns: the tier row fields and the working numbers (keep: rooms 4 plus a
courtyard, budget 300, plinths 22, amenity 4; citadel: rooms 5 plus courtyard and tower,
budget 420, plinths 32, amenity 6; fortress and guild citadel the same shapes with guild
fees pooled); the six layout touch points; how a courtyard (an open-sky room: no ceiling
modules, a daylight rig) and a tower (lifts and ramps) express in the authored layout
and the render kit; the exact read for the ruled prestige source; the Phase 32 project
shape; the extraction candidates. Settle in STEP 1 and record in state.md: whether the
guild tiers reuse the freehold layouts with guild dressing (the packet default) or own
layouts, and the four bills (tier 4 fine materials and tier 4 produce, never a keystone,
flagged TUNING; Fernando owns the finals).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent CONTENT: the four tier rows, the four upgrade SKUs in charters.ts (no price, no
  copy), the DungeonDefs (spawns: [], guideVisible: false, claimKey: 'owner', absent from
  FINDER_ACTIVITIES), the bills, the project trophies, the Homesteader deeds for Keep and
  Citadel, the ward exterior shells for the two new ranks, wiki regen and guide keys,
  art through the image-to-glb skill or registered stand-ins (D13).
- Agent SIM: KEEP_LAYOUT and CITADEL_LAYOUT in src/sim/content/freehold/layouts.ts (D23;
  the guild twins or dressing per the settled choice) with the courtyard room and the
  tower lifts, STATIC_INTERIOR_COLLIDERS entries, groundHeight
  arms; the prestige arm in the upgrade gate reading the ruled source through the
  existing deeds or reliquary reads (read only; a text-free freeholdDenied reason
  prestige_required), pinned positive and negative; the project rows on the Phase 32
  seam; tests/freehold_prestige_gate.test.ts and the tier pins.
- Agent RENDER: the courtyard (open sky, a daylight rig that stays within the point-light
  budget, no ceiling modules) and tower variants, dressing, prewarm homes, the exterior
  shell kit rows; render cores registered in RENDER_PURE_CORES.
- Agent SERVER+UI: the spend arm for the four SKUs riding the Phase 21 grant and the
  Phase 29 Hall Fund pooling, exactly-once by purchase key, refusing before any spend
  when the prestige source is absent (the sim's dry run answers it); the steward panel
  showing the prestige requirement with its status; hudChrome.housing.* keys; mobile
  sheet; pr_shot_targets entries.
The coordinator edits last: tests/world_api_parity.test.ts if the facet grows,
tests/monolith_budget.test.ts, parity goldens in their own commit. Every agent writes
any report longer than a screen to a file and replies with the path plus a short
summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The prestige gate is accomplishment, never money: no Claudium path bypasses it; it
  reads existing deed or reliquary state and grants nothing.
- Never sell power; keystone exclusion in every bill; zero farm beds; nothing destroyed
  (an unfinished project keeps its contributions).
- Determinism (no Rng; weeks on ctx.resetDay); server authority; the money gates for
  the upgrade SKUs (counsel sign-off before enable, FREEHOLDS_ENABLED default off, the
  surface map pinned; the economy service owns prices); the token firewall.
- The point-light budget (three at LOW) in every new interior including the courtyard;
  colliders derive from the layout.
- The i18n policy in docs/freeholds/implementation-plan.md; vocabulary fixed; "phase"
  in no code, comment, commit, or PR text; monolith ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- Dyes and layout sharing (Phase 41); the second freehold (Phase 42); any new deed as
  the prestige source (the ruling names an existing one).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_content.test.ts
  tests/freehold_prestige_gate.test.ts tests/freehold_build_project.test.ts
  tests/freehold_upgrade.test.ts tests/provisioner_firewall.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts
  tests/recipe_economy.test.ts tests/market_filters.test.ts tests/freehold_wards.test.ts
  tests/renderer_compile_gate.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts tests/localization_fixes.test.ts` plus the
  tests/server/ suites the SERVER slice added; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`;
  `npm run perf:tour`; `npm run asset:budget`; `node scripts/pr_screenshots.mjs`.
- Spawn review agents per docs/freeholds/implementation-plan.md: content-obligations-reviewer,
  render-performance-reviewer, plus architecture-reviewer (layouts and the gate),
  privacy-security-review (server/), and frontend-seam-reviewer (src/ui/). Prompt each
  for COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Keep, Citadel, Fortress, and guild Citadel tiers with their bills
- feat(sim): add courtyard and tower layouts and the prestige gate on the top tiers
- feat(render): dress the courtyard and tower interiors within the light budget
- test(sim): pin the prestige gate, the tier table, and the keystone exclusion
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The four tier rows are pinned by fresh literals (300 and 420 budgets, 22 and 32
  plinths, 4 and 6 amenity slots); the layouts derive their colliders; the courtyard
  reads as open sky and the tower lifts are walkable on both hosts.
- [ ] The prestige gate refuses an upgrade without the ruled source (text-free reason)
  and admits with it, for the ruled holder rule; no Claudium path bypasses it (pinned).
- [ ] The upgrade grant is exactly-once by purchase key; no bill names a keystone.
- [ ] Three point lights at LOW in every new interior; no live-program events on the
  perf tour; the asset budget passes; screenshots committed.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 40, notes, deferrals) and
  docs/freeholds/state.md (ledger row 40; the content numbers table gains the four tiers;
  the layout and bill decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-40-qa.md

STOPPING RULES:
- Stop before STEP 1 if the prestige-deed ruling is not in state.md; ask Fernando.
- Stop and ask if a courtyard cannot be expressed without a new kit module family (a
  render kit addition is a maintainer decision).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
