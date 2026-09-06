# Phase 21: the Lodge tier and the upgrade build project

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "21 Lodge
tier and the upgrade build project"; the decisions are `state.md` and `brainstorm.md` (D1
to D19; D2 makes the Lodge an in-place tier upgrade of the one record). This phase ships
the second freehold tier (2 rooms, decor budget 120, 8 plinths, 2 amenity slots, its
layout and interior), the upgrade build project (a Claudium fee SKU plus a materials bill
contributed over time), layout carry-over on completion, and the second amenity slot. It
is a money phase (the three gates apply) and a persistence phase (the record grows a
column).

### Starter Prompt
```
This is Phase 21 of the Freeholds and Guildhalls feature: the Lodge tier and the upgrade
build project (the tier record and layout, the fee SKU plus the materials bill, the
contribute command with a progress record, layout carry-over, the second amenity slot).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three independent slices over known seams).

Goal: let a Cottage owner upgrade in place to a Lodge by paying a Claudium fee once and
contributing a bill of tier 3 and 4 fine materials and tier 4 produce over time, with the
Cottage layout carried over, the upgrade applied exactly once, and no keystone, gear
intermediate, or catalyst anywhere in the bill.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet, world_api parity pins,
  test-pin traps (literal pins, never self-comparison), the provisioner firewall, the
  storage-charter exactly-once model, Postgres additive DDL.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "21 Lodge tier and the
  upgrade build project"), docs/prd/woc/freehold-service-contract.md, and this file
- src/sim/content/freehold/tiers.ts, charters.ts, dungeons.ts, ledger_schedule.ts,
  layouts.ts (INN_ROOM_LAYOUT and COTTAGE_LAYOUT with their lift functions, D23);
  src/sim/dungeon_layout.ts (DAWNHOLD_LAYOUT,
  layoutColliders, DUNGEON_WALL_HW); src/sim/rift/authored.ts (AuthoredRoom, roomAt,
  inAnyRoom, authoredColliders); the six Cottage touch points (the interior union in
  src/sim/types.ts, the groundHeight arm in src/sim/world.ts, STATIC_INTERIOR_COLLIDERS
  in src/sim/colliders.ts, the variant in src/render/dungeon.ts, the dressing under
  src/render/freehold/, the DungeonDef)
- src/sim/freehold/ (types.ts, state.ts, instance.ts, layout_core.ts, placement.ts,
  grant.ts, ledger.ts, condition_core.ts, index.ts, CLAUDE.md) and src/sim/sim_context.ts
- src/sim/professions/reagent_sources.ts (planReagentSourceDraw, countMinusPlanned),
  src/sim/professions/material_grades.ts (materialGradeIds), src/sim/material_ids.ts,
  src/sim/content/farm_crops.ts (tier 4 produce ids and fine twins), the tier 3 and 4
  material ids in src/sim/content/items.ts, src/sim/mail/post_office.ts
  (mailSystemParcel, for the carry-over overflow question)
- server/claudium.ts (the kind === 'freehold' branch and the store filter),
  server/claudium_proxy.ts, server/freehold_wire.ts, server/freehold_db.ts
  (FREEHOLD_SCHEMA, freeholdForAccount, upsertFreehold), server/heavy_self.ts,
  server/economy_telemetry.ts
- src/world_api/housing.ts, src/world_api.ts (COMMAND_NAMES, COMMAND_FACETS),
  tests/world_api_parity.test.ts (the five edit sites), src/net/online.ts (the housing
  one-liners), src/net/freehold_snapshot_wire.ts, tests/helpers/bare_client.ts
- tests/freehold_content.test.ts, tests/freehold_layout_core.test.ts,
  tests/server/freehold_gates.test.ts, tests/server/freehold_db.test.ts,
  tests/provisioner_firewall.test.ts (PERFECTING_MATERIAL_IDS, GEAR_INTERMEDIATE_WORDS),
  tests/monolith_budget.test.ts, tests/parity/trace.ts (META_EXCLUDE)
- src/sim/content/deeds.ts (the Homesteader rows), src/ui/i18n.catalog/hud_chrome.ts
  (hudChrome.housing.*), src/ui/hud/housing/steward_panel_view.ts
- Root CLAUDE.md "Modularity" and "Invariants"
The agent returns: the tier record shape and the frozen ids; the exact Cottage edits at
each of the six interior touch points as the template for the Lodge; the Phase 15 grant
function signature, the spend branch shape, and the store filter allowlist call; the
layout_core validators the carry-over can reuse; the bill-eligible id list (tier 3 and 4
fine materials, tier 4 produce with explicit gradeIds) and the excluded ids; the
account_freeholds column list, the normalize arm, and the rev upsert; the extraction
candidates in sim.ts, game.ts, and online.ts that pay for the new lines; the Steward
panel rows a progress record would extend.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (they touch disjoint files except the shared pin files the coordinator edits last:
tests/world_api_parity.test.ts, tests/snapshots.test.ts, tests/monolith_budget.test.ts,
src/world_api.ts, the parity goldens):
- Agent CONTENT-LAYOUT: the `lodge` row in src/sim/content/freehold/tiers.ts (rooms 2,
  decor budget 120, plinths 8, amenity slots 2, upkeep flag; deep-frozen; the id is a
  frozen save key), `freehold_lodge` DungeonDef at index 17 in dungeons.ts (spawns [],
  guideVisible false, absent from FINDER_ACTIVITIES, claimKey 'owner'), LODGE_LAYOUT
  beside COTTAGE_LAYOUT in src/sim/content/freehold/layouts.ts (D23) with rooms, doors, decor with measured r, eight plinth anchors,
  two amenity anchors, the hearth anchor, its lift function, and the six touch points;
  the render variant and dressing under src/render/freehold/ built through
  attachSceneGroupGated; the "first Lodge" Homesteader deed row appended at the END of
  src/sim/content/deeds.ts; `npm run wiki:content` plus any guide.* key; the layout
  derivation test and the tests/renderer_compile_gate.test.ts arm.
- Agent SIM: src/sim/content/freehold/upgrade_projects.ts (UPGRADE_PROJECTS: id
  `upgrade_lodge`, fromTier cottage, toTier lodge, feeSkuId `freehold_upgrade_lodge`,
  bill legs of tier 3 and 4 fine materials and tier 4 produce with explicit gradeIds;
  stack counts flagged TUNING; deep-frozen, no price, no copy) and the SKU row in
  charters.ts (tier-upgrade kind, no price) so the Phase 15 allowlist covers it;
  src/sim/freehold/upgrade.ts: the `contribute_upgrade` command (owner only, never
  condition-locked per D22, the named slot through the item_copy_ref tri-state, bags
  then vault through planReagentSourceDraw, one batch, a progress record on FreeholdState
  `upgrade: { projectId, contributed, feePurchaseKey }`), completion on the last
  contribution only when the fee key is present (the tier flips through the
  src/sim/freehold/state.ts setter D24 names, plinths and amenity slots widen, the
  descriptor re-emits), `layout_core.carryOverLayout(rows, from, to)` (pure:
  keep every row that still validates in the new rooms, list the rest), the overflow
  returned to bags or the completing contribution refused `bags_full` with nothing
  mutated (settle in STEP 1 whether overflow instead mails through mailSystemParcel and
  record the choice in state.md), text-free freeholdDenied reasons (`upgrade_no_project`,
  `upgrade_fee_due`, `bags_full`, `not_owner`) and freeholdGranted `upgrade_complete`,
  the new reasons appended to freeholdDeniedLineKey in
  src/ui/hud/housing/housing_view.ts over hudChrome.housing.denied.* (D26, never a second
  selector); the facet members `contributeUpgrade(slot, count)` and the
  progress read (on myFreehold or a sibling `myUpgradeProject`), the Sim delegate paid
  by an extraction; the `lodge` arm on the Phase 07 `/dev freehold` command (D24);
  tests/freehold_upgrade.test.ts.
- Agent SERVER: src/sim/freehold/grant.ts `freeholdGrantUpgradeFee(ctx, ownerKey, skuId,
  purchaseKey, { dryRun })` (server-only, never on COMMAND_NAMES, the purchase key stored
  on the record for exactly-once), the SKU dispatch inside the Phase 15 kind === 'freehold'
  branch (dry run before the spend, apply after a definitive result, flag dark refuses,
  the store filter drops the SKU while dark), the `contribute_upgrade` case in
  server/freehold_wire.ts with the label only in game.ts (paid by an extraction),
  HEAVY_SELF_CMDS row, the `upgrade JSONB` column on account_freeholds through
  `ADD COLUMN IF NOT EXISTS` with a jsonb_typeof CHECK, normalize and serialize arms
  (a pre-column row loads with no project), the export row, the fhold key carrying the
  progress with the strict decode extended (closed allowlist with AssertNever), the
  docs/prd/woc/freehold-service-contract.md row for the new SKU (O1); tests/server/freehold_gates.test.ts and
  tests/server/freehold_db.test.ts extended, the pg-armed twin.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the upgrade draws no Rng; no wall clock in src/sim/; carry-over is a
  pure function of the two layouts and the rows.
- One sim, three hosts: offline the Lodge exists only through `/dev freehold lodge`,
  which EXTENDS the Phase 07 `/dev freehold` command with a `lodge` arm (D24), under
  ALLOW_DEV_COMMANDS=1 and in tests (D3); the RL exclusion pin stays green.
- Server authority: the fee lands only as a server-applied grant after the economy
  service confirms; the client predicts nothing and mirrors the progress record.
- The three money gates: (1) counsel sign-off before FREEHOLDS_ENABLED is set in
  production and before any store submission carrying housing copy (OPEN, owner
  counsel); (2) the fail-closed flag defaulting off refuses the SKU at the spend branch
  and drops it from the store filter, pinned; (3) the per-distribution surface map
  pinned by tests keeps the upgrade purchase surface off every native, Steam, and Epic
  build. The economy service owns prices and token math: the game forwards
  expectedCostClaudium as a fingerprint and never computes a peg, a burn, or a split.
- Token firewall (the state.md scope): no on-chain vocabulary in src/sim/ (wallet, token,
  $WOC, mint, holder, marketplace, on-chain, Solana, the on-chain Freehold Charter deed);
  the Book of Deeds is game content, never firewall vocabulary.
- Never a Perfecting keystone (wyrmfall_core, sundered_essence, makers_ember), a gear
  intermediate, or the quickening catalyst in the bill; recipes and their stationType
  gates unchanged; zero new farm beds.
- Never destroy: carry-over returns or refuses, never drops a furnishing or trophy; the
  three Inn Room plinths' trophies carry into the Lodge as they did into the Cottage.
- Persistence: additive idempotent DDL only, JSONB back-compat for every older row, a
  save/load round trip (fake pool plus the pg-armed twin), keep-forever stays stated.
- i18n: the policy in docs/freeholds/implementation-plan.md; the tier name, the deed
  text, and every Steward line are English t() keys; the sim emits text-free ids (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack; every
  delegate, case label, or mirror line is paid by an extraction and a lowered ceiling.
- Working numbers (2 rooms, 120, 8, 2, the illustrative $25 plus materials) are
  state.md values; the economy service and Fernando own the finals.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any furnishing beyond the MVP set, patterns on the R8 channels (Phase 22), new trophy
  families (Phase 23), the garden (Phase 24), surface snapping or twelve-week prepay
  (Phase 25), open-house policies (Phase 26).
- Guild tiers, the Great Hall, Manor, or Bastion (Phases 28 to 32).
- A gold rail for the fee; any price, burn share, or settlement math in the game.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_content.test.ts
  tests/freehold_upgrade.test.ts tests/freehold_layout_core.test.ts
  tests/freehold_determinism.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/provisioner_firewall.test.ts
  tests/recipe_economy.test.ts tests/market_filters.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/env_protocol.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/server/freehold_gates.test.ts
  tests/server/freehold_db.test.ts tests/server/freehold_wire.test.ts
  tests/server/claudium.test.ts tests/server/storage_gates.test.ts
  tests/server/main_retention_wiring.test.ts tests/api_error_code_parity.test.ts
  tests/localization_fixes.test.ts tests/renderer_compile_gate.test.ts
  tests/dungeons.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; the pg-armed twin with TEST_DATABASE_URL set after
  `npm run db:up`; parity goldens regenerated with UPDATE_PARITY=1 in their own commit if
  a sampled field or emit changed.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  content-obligations-reviewer (tiers, the bill, the deed, wiki), architecture-reviewer
  (upgrade.ts, carry-over, the SimContext use, determinism), privacy-security-review
  (the spend branch, the grant, server/ and src/net/), plus migration-safety because the
  diff touches DDL and a persisted shape (the dispatch table row). Prompt each for
  COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Lodge tier, its layout, and the upgrade project bill
- feat(sim): add the upgrade contribution command and layout carry-over
- feat(server): grant the Lodge upgrade fee through the freehold spend kind
- test(sim): pin the upgrade bill keystone exclusion and exactly-once completion
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_content.test.ts pins the lodge row by fresh literals (2, 120, 8, 2)
  and the upgrade bill ids; tests/provisioner_firewall.test.ts sweeps the bill and finds
  no keystone, gear intermediate, or catalyst.
- [ ] tests/freehold_upgrade.test.ts proves: a partial contribution records progress and
  mutates nothing else; the completing contribution without the fee key refuses
  `upgrade_fee_due`; replaying the fee purchase key grants once; a second completion
  attempt refuses `upgrade_no_project`; every placed Cottage furnishing that fits is in
  the Lodge layout and the rest are back in bags (or refused `bags_full` with nothing
  mutated); the same seed gives the same Lodge on both hosts.
- [ ] tests/server/freehold_gates.test.ts covers the upgrade SKU on both dispatch arms:
  unknown SKU refused, price drift refused, replay grants once, flag dark refuses and
  the store filter hides the SKU.
- [ ] tests/server/freehold_db.test.ts round-trips the upgrade column and loads a
  pre-column row with no project (fake pool and the pg-armed twin).
- [ ] The Lodge renders on proximity with its light rig inside the point-light budget;
  tests/renderer_compile_gate.test.ts has the arm; tests/dungeons.test.ts is unchanged.
- [ ] All STEP 3 suites green; the four reviewers report no BLOCKING; the ceilings of
  sim.ts, game.ts, and online.ts are LOWER than before.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 21, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 21: new files, IWorld members, the
  command, the SKU, the column, i18n keys; the tier table's Lodge row; the carry-over
  overflow decision; any locked decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-21-qa.md

STOPPING RULES:
- Stop and ask if the economy service catalog cannot carry a tier-upgrade SKU under kind
  freehold without a service-side change (record it under O1; the phase ships against
  the fake-service harness either way).
- Stop if carry-over would have to drop a furnishing or trophy to complete (never
  destroy is a non-negotiable; the answer is refuse or return, and the refusal must be
  the choice recorded in state.md).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
