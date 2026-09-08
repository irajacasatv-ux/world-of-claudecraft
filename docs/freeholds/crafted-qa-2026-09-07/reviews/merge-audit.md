# Freeholds crafted-furnishing QA: semantic dependency-merge audit

Verdict: CLEAN WITH FOLLOW-UP.

This verdict concerns semantic integration of the two specified parents, not whole-branch QA or permission to commit. No runtime merge regression was established. One concrete branch-only test incompatibility was found and its working-tree remediation inspected; the parent must still supply integrated gate outcomes. The implementation, generated artifacts, art pipeline, and packet-wide acceptance reviews are owned by other reviewers.

## Merge identity and scope

- Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
- Original Freeholds parent: `3666d89647`.
- Incoming dependency parent: `54ce808436` (`origin/feature/masterwrought` at dispatch). This parent carries newer release work as well as Masterwrought; the merge does not turn inherited release behavior into a Freeholds regression.
- Merge base: `d3dcdaa4af18f960232196eb461e1e17233fccdb`.
- From the common base, Freeholds touched 1085 paths and incoming touched 1298. Their intersection is 142 paths: 33 production TypeScript, 42 tests, 28 locale sources, 26 generated paths, 4 documentation artifacts, 3 instruction files, 5 operations/tooling paths, and 1 public asset mapping.
- Full path inventory: `/tmp/freeholds-merge-overlap.json`.
- This audit was read-only in the repository. It ran no gate, no runtime tests, no generation, and no asset operation. Only the audit evidence under `/tmp` was written.

## Findings and disposition

### M1: The branch-only furnishing Rift suite retained a removed API and obsolete forge premises

Severity: P2. Confidence: high. Category: actual merge compatibility gap in tests; no demonstrated production vulnerability.

Before remediation, `tests/furnishing_rift_admission.test.ts:45` indexed `IWorld['enchantRiftItem']`, even though incoming deliberately removed that method from both worlds and the inventory facet. The same file's old action table still invoked enchant, expected the retired additive stats, and prepared actors away from the newly required Rift Forge. Consequently it could not typecheck against the merged interface and its live upgrade/socket controls would fail for the wrong place-gate reason.

This is not a reason to restore the obsolete runtime method: `src/world_api.ts:890` keeps `rift_enchant_item` as a dispatch-only tombstone, and the upstream test at `tests/rift_forge_dispatch.test.ts:60` rejects it without touching the sim. The surviving actions deliberately require proximity before item admission (`src/sim/rift/progression.ts:513` and `:571`).

Working-tree fix inspected: the test now indexes only upgrade/socket (`tests/furnishing_rift_admission.test.ts:51`), moves actors with the existing `moveToRiftForge` helper (`:98`), computes positive controls through the current band-ladder contract, and keeps the furnishing snapshot/resource/RNG invariants for named-slot and item-id calls in both direct Sim and ClientWorld/GameServer paths. It also explicitly checks that modern output carries no retired enchant field. Owner: `merge_tests`. Runtime execution remains parent-owned and was not independently repeated here.

No additional actionable merge defects, uncertain correctness findings, or nits were established in this scope.

## Production overlap evidence

A source-only three-way comparison extracted added/deleted lines from the Freeholds patch (base to original parent), then compared them with the corresponding patch from incoming parent to the resolved working file. Thirty of the 33 overlapping, non-generated production TypeScript files preserve exactly the same Freeholds changed lines. This is evidence of branch-patch preservation, not a proof of all surrounding behavior. The three exceptions were explicitly inspected:

1. `src/sim/rift/progression.ts:451`: the resolved file is byte-identical to incoming. The old furnishing-specific rejection was replaced upstream by a narrower allowlist: `SHELL_STATS` contains only the three band-shell ids (`:68`) and `riftInventorySlot` rejects every other id (`:455`). Both surviving actions use that resolver before consuming essence/gems. This preserves furnishing refusal, including a malformed live furnishing carrying a forged Rift payload. Retired enchant behavior is intentional incoming behavior.
2. `src/sim/social/trade.ts:308`: the merged predicate combines `isStorableItemKind(def.kind)` with incoming `RIFT_GEAR_ITEM_ID_SET`. Furnishings retain their storage/trade admission and upstream band identity stays excluded. The shared rift-id set replaces the stale local copy without changing the furnishing policy.
3. `src/ui/item_compare.ts:73`: the merged effective-stat helper retains the undefined-definition early return, and `equippedPower` is still undefined for furnishing equipment (`:108`). Upstream rolled-stat handling remains in the helper and all affix/rating comparisons use the same guarded definition. This preserves furnishing neutrality and upstream per-copy Rift-band comparisons.

Machine-readable preservation evidence: `/tmp/freeholds-merge-source-preservation.json`.

## Migration and registration review

- `server/game.ts:3770` and `:3922` both use the extracted `buildWorldHello`; `server/world_hello.ts:31` emits capability only for strict true. The incoming hello shapes had no additional field lost through extraction.
- `src/net/online.ts:2343` still replaces housing capability on every hello and refreshes recipe visibility; absent/malformed values clear capability. The branch recipe filter survives together with incoming ability presentation, guild-history mirror, action-bar profile upload, interpolation helpers, and telegraph decode.
- `src/sim/sim.ts:2117` keeps the freehold map beside incoming mob-freeze state; its context getters (`:5330`, `:5359`) still expose live host state. Housing delegates remain at `:11778` onward. The incoming ability-resolution chain (`:6050`) and realm-builder spawn (`:2585`) survive. The branch NPC bootstrap/movement/trainer extractions retain the same patch deltas above incoming; no new tick-order change was introduced by this merge.
- Server housing dark refusal is still before heavy-self dirtying (`server/game.ts:6398`), and all ten dispatch labels still lead to `dispatchFreeholdCommand` (`:6907`). `IWorldHousing`, command metadata, REST route registration, and the label-free metric remain in their canonical registries.
- `tests/helpers/bare_client.ts:186` retains the default dark recipe filter, while `:251` initializes the incoming `GuildBankLogMirror`. The branch blank-entity and anchor helpers still replace their legacy inline bodies rather than leaving divergent twins.
- The four marketplace PostgreSQL integration overlaps (`woc_market_{bond,directed,realm_scope,settlement}_pg_integration.test.ts`) have no dropped Freeholds semantic change: their branch-side changes were import ordering already adopted incoming.
- The UI worker's source-row preservation audit and the parent-reported regeneration cover authored locale conflicts and generated artifacts. This reviewer did not claim generation from a textual conflict resolution. Parent reported `i18n:gen` and `wiki:content` exit 0; the integrated freshness/test evidence is still required.

## Imported behavior distinguished from merge damage

The layout epoch 29, Nythraxis hazards, Drakelands changes, guild roster expansion/history paging, profile-aware action bars, class ability resolution, and Rift Forge/band-ladder behavior already exist in `54ce808436`. Their larger code, test, asset, and snapshot deltas are imported dependency state. They are relevant compatibility inputs, but not Freeholds defects merely because the integration diff is large. Whole-tree release/schema/performance conclusions belong to the parent gate and designated specialists.

Packet planning was not read directly, per the ownership split. The packet explorer supplied the Phase 04 invariants and owns stale-plan analysis. This audit found no need to alter the ten crafted outputs, three pattern prices/vendor routes, trainer/station gates, Hearth collection, Crucible floor, or delayed placement scope because of the source merge.

## Checks and remaining integration work

Commands/read-only checks performed:

- `git status --short` to establish the active unmerged state.
- `git merge-base 3666d89647 54ce808436`: exit 0, common base above.
- `git diff --name-only` from common base to each parent and set intersection: inventory above.
- `git diff` against each parent and `git show` of both parents/common base for production overlap, retired API, and moved-helper review.
- Python source-only patch-preservation comparison: 30 exact changed-line matches, 3 explained source compositions, evidence artifact above.
- Targeted `rg` searches across branch-changed source/tests for retired API names and stale layout/hotbar/history assumptions: found M1; reviewed the surviving references.
- Read the UI and runtime workers' resolution reports, then inspected the relevant current source/test changes. Those reports supplement, not replace, this review.

Before the overall contribution is called complete, the parent must finish and record the required integrated gate and focused furnishing Rift execution, plus command/IWorld/default/snapshot inventories and the packet-specific crafted-furnishing acceptance tests. Generated/art metadata and QA failures remain owned by the parent and corresponding workers. No commit, push, or remote action is authorized by this report.

## Production overlap inventory

- `server/game.ts` (exact Freeholds changed-line preservation)
- `server/http/game_signals.ts` (exact Freeholds changed-line preservation)
- `server/http/registry.ts` (exact Freeholds changed-line preservation)
- `src/main.ts` (exact Freeholds changed-line preservation)
- `src/net/online.ts` (exact Freeholds changed-line preservation)
- `src/render/characters/manifest.ts` (exact Freeholds changed-line preservation)
- `src/render/characters/npc_looks.ts` (exact Freeholds changed-line preservation)
- `src/render/renderer.ts` (exact Freeholds changed-line preservation)
- `src/sim/content/deeds.ts` (exact Freeholds changed-line preservation)
- `src/sim/content/reliquary.ts` (exact Freeholds changed-line preservation)
- `src/sim/data.ts` (exact Freeholds changed-line preservation)
- `src/sim/entity.ts` (exact Freeholds changed-line preservation)
- `src/sim/professions/enchanting.ts` (exact Freeholds changed-line preservation)
- `src/sim/rift/progression.ts` (reviewed composition above)
- `src/sim/sim.ts` (exact Freeholds changed-line preservation)
- `src/sim/sim_context.ts` (exact Freeholds changed-line preservation)
- `src/sim/social/trade.ts` (reviewed composition above)
- `src/sim/types.ts` (exact Freeholds changed-line preservation)
- `src/ui/bag_item_context_menu.ts` (exact Freeholds changed-line preservation)
- `src/ui/deed_image_ids.ts` (exact Freeholds changed-line preservation)
- `src/ui/guild_bank_window.ts` (exact Freeholds changed-line preservation)
- `src/ui/hud.ts` (exact Freeholds changed-line preservation)
- `src/ui/hud/action_bar/action_bar_controller.ts` (exact Freeholds changed-line preservation)
- `src/ui/hud/professions/enchant_apply_view.ts` (exact Freeholds changed-line preservation)
- `src/ui/i18n.catalog/guide.ts` (exact Freeholds changed-line preservation)
- `src/ui/i18n.catalog/hud_chrome.ts` (exact Freeholds changed-line preservation)
- `src/ui/i18n.catalog/items.ts` (exact Freeholds changed-line preservation)
- `src/ui/icons.ts` (exact Freeholds changed-line preservation)
- `src/ui/item_compare.ts` (reviewed composition above)
- `src/ui/item_instance_tooltip.ts` (exact Freeholds changed-line preservation)
- `src/ui/sim_i18n.ts` (exact Freeholds changed-line preservation)
- `src/ui/world_entity_i18n.ts` (exact Freeholds changed-line preservation)
- `src/world_api.ts` (exact Freeholds changed-line preservation)
