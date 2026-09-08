# Runtime merge resolution

Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`
Merge: original HEAD `3666d89647`, incoming `54ce808436`.

## Resolved working-tree paths

- `src/game/CLAUDE.md`: retain the freeholds branch SEO extraction entry and upstream expanded perf-reporter/shader-worker documentation. Upstream desktop next-launch settings entry also remains.
- `src/net/CLAUDE.md`: retain the freehold snapshot decode and blank entity extraction documentation, alongside upstream guild transaction history mirror documentation.
- `src/net/online.ts`: retain `recipesForFreeholdAvailability`, capability-on-hello behavior, housing mirrors, housing self decode, all housing commands, `blankEntity`, and `anchorFields` extractions. Retain upstream `applyGroundTelegraphSnapshot`, `GuildBankLogMirror`, current ability presentation/resolution, profile-aware action-bar uploader, interpolation leaves, and Rift Forge acknowledgement behavior. Remove both conflicted `abilitiesKnownAt` and `ALL_RECIPES` imports: ability presentation now resolves through the new sibling and recipe visibility through the freehold filter, so neither old import remains used.
- `src/sim/sim.ts`: retain both the live `freeholds` map and upstream `devMobsFrozen` field. Reviewed the branch deltas: freehold config/context/delegates, gated NPC bootstrap, extracted movement and recipe training stay intact; upstream ability and threat extractions, mob freeze gates, Nythraxis readouts, realm builder spawn, roster/history updates, and action bar signatures stay intact. No new tick phase ordering was introduced by resolution.
- `src/sim/rift/progression.ts`: use upstream band-shell admission in `riftInventorySlot`. It rejects every non-band id, including furnishing ids carrying forged rift data, and is strictly broader protection than the old furnishing-only exclusion. This path retains the upstream forge proximity gate and band ladder. History confirms intentional upstream behavior: `63646fe7ee` introduced the Rift Forge, `60eb65dcde` introduced the band ladder, and `a618e29c48` reconciled them. The obsolete enchant action is intentionally absent throughout the incoming runtime. This resolved file is byte-identical to incoming stage 3.
- `src/sim/social/trade.ts`: use freehold-aware `isStorableItemKind(def.kind)` alongside upstream centralized `RIFT_GEAR_ITEM_ID_SET`. Furnishings remain tradable through the intended storage policy, quests remain excluded, and rift gear remains excluded. Existing copy locks and directed selection behavior remain untouched.

## No-growth evidence

Counts use `text.split('\n').length` (including trailing empty line); communicate to tests owner for the authoritative test count convention.

| File | Merge base | Original HEAD | Incoming | Combined |
| --- | ---: | ---: | ---: | ---: |
| `src/net/online.ts` | 5855 | 5696 | 5789 | 5630 |
| `src/sim/sim.ts` | 11984 | 11941 | 11920 | 11877 |

Both branches' independent extractions survive, so both combined files are smaller than either parent. No budget increase and no new extraction required. Counts and extraction rationale sent to `merge_tests`.

## Verification performed

- Compared index stages 1/2/3 and working resolutions for the six conflicts.
- Inspected branch histories for competing rift admission changes.
- `git diff --check -- src/net src/game/CLAUDE.md src/sim`: clean.
- Conflict-marker search in owned scope: none.
- No staging, commits, test runs, gates, assets, or edits outside the six paths (apart from this report).

## Parent verification still required

Run the parent-owned shared gate, typecheck, monolith budgets, command/IWorld parity and snapshot tests, freehold foundation/content/crafted tests, blank entity/default shape tests, recipe visibility/training/crafting tests, trade/copy-selection tests, and rift forge/progression/band ladder tests. Upstream deliberately removed `enchantRiftItem`; any freehold test still calling it needs migration to surviving upgrade/socket arms, with the player at a Rift Forge so the new place gate does not mask item-kind refusal. This integration issue was sent to `merge_tests`.

All six files remain unmerged in the index until the parent stages the working resolutions, as requested.
