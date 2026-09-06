# Phase 17: trophies

Wave A, the Cottage MVP. The spec is `progress.md` "17 Trophies"; the decision is
`state.md` D19 (trophies are furnishing-shaped records, never items: `trophy_eligibility.ts`
maps deed ids, illuminated Reliquary pages, `slain:*` marks, owned mounts, and the
`perfected` stamp to trophy prop ids; `syncTrophyUnlocks(ctx, meta)` runs after the join
retro block and on first entry, reads only, and records unlocks with `retro: true`
events; trophies occupy plinth slots, cost no decor points, and are never tradable). This
phase ships the MVP trophy families, the retroactive grant, plinth placement through the
layout core, the provenance tooltip, the Trophies tab, and stand-in props. The Legend
Stand, the Harvestmaster sheaf, and the remaining families are Phase 23.

### Starter Prompt
```
This is Phase 17 of the Freeholds and Guildhalls feature: trophies (TROPHY_DEFS,
trophy_eligibility.ts, syncTrophyUnlocks, plinth placement, the provenance tooltip, the
Trophies tab, the Inn Room's three plinths).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices: content, sim, presentation).

Goal: grant every existing deed, illuminated page, realm-rare mark, mount, armor set,
and curator rank its trophy retroactively on first entry, at no cost and with no Rng,
let the owner set trophies on plinths that cost no decor budget, show where each one
came from, and keep trophies out of every item, trade, and market path.

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
- Memory scan: MEMORY.md and entries on the Reliquary packet and the Reliquary tracker,
  the achievements system design, the content and pins/content gotcha clusters, parity
  goldens, the monolith ratchet, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "17 Trophies"), and this
  file; docs/design/deeds.md and docs/design/reliquary.md (the obligations)
- src/sim/deeds.ts (grantDeed, evaluateDeedsFor, markVisited, the 'slain:<templateId>'
  mark comment and the named overworld terrors list), src/sim/content/deeds.ts (DEEDS,
  DEED_ORDER, the Homesteader rows Phase 03 opened, prog_legendmaker, prog_farming_100,
  the raid and dungeon clear deeds, the armor-set collection deeds, the curator rank
  deeds), src/sim/deeds_completion.ts
- src/sim/reliquary.ts (characterReliquaryOwnership and ReliquaryOwnershipSurfaces:
  itemsDiscovered, marks, ownedMounts, deedsEarned; pageCompletion; illuminatedPages;
  CURATOR_RANK_DEFS and curatorRankFromOwned; the sync* precedents that draw no rng),
  src/sim/content/reliquary.ts (RELIQUARY_PAGES and the shelf ids), src/sim/mounts.ts
  (ownedMounts), src/sim/types.ts (the perfected stamp on item instances, the Maker's
  Bond craftedBy field, the deedUnlocked and reliquaryUnlock SimEvent variants as the
  id-only models)
- the join retro block in src/sim/sim.ts (grep seedItemDiscovery, retroFallbackGrants,
  evaluateDeedsFor with retro true) and the first-entry hook in
  src/sim/freehold/instance.ts (Phase 05)
- src/sim/freehold/ as Phases 01 to 16 left it (types.ts: the trophies field on the
  record from Phase 07; layout_core.ts: the plinth slot rules from Phase 08;
  placement.ts; state.ts: normalizeFreehold), src/sim/content/freehold/ (tiers.ts: the
  plinth counts 3 and 4; furnishings.ts)
- src/render/freehold/ (Phase 09: the furnishing model registry and the stand-in kit),
  src/ui/hud/housing/ (Phase 11: furnishing_palette_view.ts and window;
  furnishing_tooltip_view.ts from Phase 02), src/ui/hud/professions/recipe_pattern_tooltip_view.ts
  (the tooltip core precedent), the tooltip composer in src/ui/hud.ts that Phase 02 wired
- server/freehold_wire.ts and src/net/freehold_snapshot_wire.ts (where trophies ride:
  the fhold key for the owner's unlock list, the freeholdState descriptor for placed
  plinth rows so a visitor sees them), server/heavy_self.ts, tests/snapshots.test.ts
- tests/deeds_content.test.ts (the counts it pins), tests/reliquary_content.test.ts,
  tests/parity/trace.ts and scenarios.ts, tests/monolith_budget.test.ts
- src/ui/i18n.catalog/hud_chrome.ts (the housing namespace), src/ui/world_entity_i18n.ts
  (the deed and page name lookups the tooltip reuses), scripts/wiki/build_content.mjs
  (what the wiki regen reads), root CLAUDE.md "New game content" bullet
The agent returns: the exact ownership reads for each source kind and the one bundle
(characterReliquaryOwnership) that returns most of them; the join retro block insertion
point and the first-entry hook; the plinth slot rules and how a plinth row differs from
a furnishing row in the layout; the fhold and descriptor extension points; the tooltip
core recipe and where the composer dispatches; the deeds count pins that will move and
the Homesteader ids to append; the wiki regen and guide key obligations for a trophies
table; the extraction that pays for any sim.ts, game.ts, or online.ts line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent CONTENT: src/sim/content/freehold/trophies.ts (TROPHY_DEFS: trophy id, source
  { kind: 'deed' | 'page' | 'mark' | 'mount' | 'set' | 'curator' | 'perfected', id },
  prop model key, finish; deep-frozen; ids are frozen save keys; the MVP set: the boss
  busts for the ready families named in the proposal, the slain:* mounted heads, the
  mount paddock markers, the armor-set stands, the curator plaques, and the farming and
  legendmaker plaques), merged by src/sim/data.ts; the Homesteader deed rows for the
  first trophy set and a full plinth row appended at the END of content/deeds.ts
  (cosmetic reward only), tests/deeds_content.test.ts re-pinned with fresh literals;
  no Reliquary page (trophies are not loot; state the ruling in the file header); the
  wiki regen (`npm run wiki:content`) with the guide.* prose keys for the trophies
  table; a tests/freehold_content.test.ts arm: every TROPHY_DEFS source id resolves to
  a real deed, page, mark, mount, set, or rank, no trophy id collides with an ITEMS key,
  and no trophy carries a stat, buff, price, or drop field.
- Agent SIM: src/sim/freehold/trophy_eligibility.ts (pure: the mapping from
  ReliquaryOwnershipSurfaces plus the perfected stamps and curator rank to the set of
  unlocked trophy ids, no ctx, no Rng) and src/sim/freehold/trophies.ts
  (syncTrophyUnlocks(ctx, meta): after the join retro block and on first entry, reads
  only, writes the unlock set into the owner's record, emits text-free
  freeholdTrophyUnlocked { pid, trophyId, retro: true } once per new id, idempotent);
  plinth placement through layout_core.ts (a plinth row holds exactly one trophy id, a
  trophy fits only a plinth, costs no budget, the Inn Room's three plinths carry over
  to the Cottage's four per D2), the place_furnishing and remove_furnishing arms for a
  trophy row (never consuming or returning an item); the fhold key gains the unlock
  list and the descriptor gains plinth rows with the strict decoder allowlist extended;
  tests: the eligibility table pinned per source kind with a negative per kind, retro
  grant idempotent and zero Rng (Rng.setObserver), a second character of the account
  sees the same unlocks, a visitor's descriptor carries the owner's plinth rows, the
  parity scenario `freehold_trophies` regenerated in its own commit.
- Agent PRESENTATION: src/ui/hud/housing/trophy_tooltip_view.ts (pure: provenance
  lines for deed name and day, page name, mark, mount, set, rank, maker for a
  perfected source, through world_entity_i18n lookups and formatDateTime) wired through
  the tooltip composer; the Trophies tab in furnishing_palette_view.ts and its window
  (unlocked trophies with the unearned silhouettes visible as the hunt, per proposal
  section 10, never placeable); the stand-in trophy props in the Phase 09 registry by
  family (bust, head, marker, stand, plaque) so every trophy renders before Phase 19;
  hudChrome.housing.trophy.* English keys; tests for the tooltip core and the tab core.
The coordinator edits last: tests/snapshots.test.ts (ALL_DELTA_KEYS if a key is added,
the fhold round-trip arm), tests/deeds_content.test.ts (if two agents touch it, the
coordinator merges), the parity goldens commit, tests/monolith_budget.test.ts (lowered
ceilings). Every agent writes any report longer than a screen to a file and replies
with the path plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Trophies are never items: no ITEMS entry, no bag slot, no trade, mail, market, bank,
  or Exchange path; never sold; pinned.
- Determinism: eligibility and the sync draw no Rng; no wall clock; a retro grant is
  idempotent across relogs and across the account's characters.
- Read only: the trophy module never writes a deed, a reliquary field, or an item
  instance (the architecture test pins reliquary write ownership).
- Never sell power: a trophy has no stat, buff, drop, or gathering effect; plinths cost
  no decor points and give nothing back.
- Server authority: unlocks and plinth placement are decided in the sim on the server;
  the client mirrors the fhold list and the descriptor rows.
- Content obligations in the SAME change: Homesteader deed rows (cosmetic only, pinned
  by tests/deeds_content.test.ts), no Reliquary page with the ruling stated, wiki regen
  and guide keys, world-entity names only where a trophy becomes a named entity (none
  expected: trophies are descriptor rows), no new item id so no WebP obligation.
- i18n: the policy in docs/freeholds/implementation-plan.md; the event is id-only (D10);
  provenance text comes from existing deed and page name keys plus hudChrome.housing.trophy.*.
- Monolith: sim.ts, game.ts, online.ts, and hud.ts are at or near their ceilings; pay
  every line with an extraction and lower the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The Legend Stand, the Harvestmaster sheaf, the first-harvest markers, the grandmaster
  banners, finishes by difficulty, and any other family beyond the MVP set (Phase 23).
- Final trophy GLBs (Phase 19); guild first-kill trophies (Phase 31).
- Any new deed trigger kind or reliquary page (trophies read what exists).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_trophies.test.ts`;
  `npx vitest run tests/trophy_tooltip_view.test.ts`; `npx vitest run
  tests/freehold_content.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/market_filters.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/world_api_parity.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/freehold_determinism.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/localization_fixes.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; the parity goldens with `UPDATE_PARITY=1` in their
  own commit, then `npx vitest run tests/parity`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the sync hook order, zero Rng, read-only access),
  content-obligations-reviewer (TROPHY_DEFS, the deed rows, the wiki, the no-page
  ruling), frontend-seam-reviewer (the tooltip core, the tab, the stand-in props).
  Prompt each for COVERAGE not filtering; each writes its report to a file. Do not
  commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the freehold trophy records and the Homesteader trophy deeds
- feat(sim): grant trophies retroactively from deeds, pages, marks, mounts, and sets
- feat(ui): show trophy provenance and the Trophies tab in the palette
- test(parity): record the freehold trophies scenario goldens
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] A character with an earned deed, an illuminated page, a slain:* mark, an owned
  mount, a full armor set, a curator rank, and a perfected item enters the Inn Room and
  receives one freeholdTrophyUnlocked per trophy with retro true; a relog and the
  account's second character receive none again (idempotent, pinned).
- [ ] Rng.setObserver records zero draws across the sync; no reliquary or deed write
  from src/sim/freehold/ (tests/architecture.test.ts).
- [ ] A trophy goes on a plinth and only a plinth, costs no budget, and a fourth trophy
  in the Inn Room refuses 'no_plinth'; the Cottage's four plinths keep the three.
- [ ] A visitor's descriptor carries the owner's plinth rows (pinned through the chain
  test); the fhold list round-trips (tests/snapshots.test.ts).
- [ ] No TROPHY_DEFS id is an ITEMS key; no trophy reaches bags, trade, mail, market,
  bank, or the Exchange (one negative pin per path).
- [ ] tests/deeds_content.test.ts re-pinned with fresh literals; the wiki regen is fresh
  (tests/guide.test.ts); the provenance tooltip renders every source kind.
- [ ] All STEP 3 suites green; the three reviewers report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 17, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 17: the content table, the sim
  modules, the event, the fhold and descriptor fields, the deed ids, the i18n keys; the
  Reliquary no-page ruling under locked decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-17-qa.md

STOPPING RULES:
- Stop and ask if any source kind cannot be read without writing a reliquary or deed
  field, or without a draw.
- Stop if a trophy would need to become an item to reach a plinth (D19 forbids it).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
