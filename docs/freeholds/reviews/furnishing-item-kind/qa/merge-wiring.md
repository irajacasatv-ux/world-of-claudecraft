# Merge wiring resolution

Owned files:
- server/game.ts
- src/main.ts
- src/world_api.ts
- tests/command_schema.test.ts
- tests/world_api_parity.test.ts
- src/game/offline_world_config.ts (ownership expanded by parent)
- tests/offline_world_config.test.ts (ownership expanded by parent)

Resolved the merge of d3dcdaa4af into c47e2cb245. No files were staged or committed. No test, typecheck, or gate command was run; parent owns deterministic validation.

## Decisions and rationale

1. server/game.ts keeps BOTH the housing dispatcher/refusal imports and the gathering command/self-wire imports. Their existing call sites are all present. No coordinator logic or database access was added by this conflict resolution.
2. src/main.ts adopts the upstream offlineWorldConfig helper call, retaining the coordinator extraction. Housing's freeholdsEnabled policy moves into that helper: ordinary offline worlds are enabled, custom editor worlds are disabled. Upstream identity allocation, seed handling, tutorial, rift, and idle-AI policy stay intact.
3. tests/offline_world_config.test.ts adds literal true/false assertions to its existing stock-world and custom-editor cases. Those calls also keep the upstream identity-generation, missing-crypto, and zero-seed controls.
4. src/world_api.ts retains both appended vocabulary clusters. Housing's existing order is preserved first, then upstream material grouping, harvest preference, corpse inspection, gathering goals, and Perfecting rank exchange follow in their upstream relative order. All commands are wire string tokens; no token is removed or renamed. Both parents' relative token orders are preserved.
5. tests/command_schema.test.ts receives fresh source-derived pins, not either parent's stale constants: 231 sends, 244 dispatch commands, 13 dispatch-only commands. The scan finds no send-only token and no difference between COMMAND_NAMES and the dispatch universe.
6. tests/world_api_parity.test.ts retains both freeholdLayout and gatheringGoal in the sorted data pin and updates member/facet counts from the merged member table: 377 unique members, 101 data, 276 methods. Both housing and upstream gathering/Perfecting additions remain present.
7. Reconciled comments explain the resulting surface without importing obsolete intermediate count narratives. The newly merged Perfecting command comment names its IWorld method instead of using the prohibited work-stage word.

## Read-only evidence

An inline Node source census reproduced the suites' comment-stripping and command regex scans over the live files, then enumerated the IWorld member literals:

- sends: 231
- dispatch: 244
- dispatch-only: 13, the existing allowlist
- sends missing dispatch: []
- COMMAND_NAMES length and unique length: 244
- COMMAND_NAMES extra/missing versus dispatch: [] / []
- IWorld members and unique members: 377
- IWorld data/method split: 101 / 276

`git diff --check -- server/game.ts src/main.ts src/world_api.ts tests/command_schema.test.ts tests/world_api_parity.test.ts src/game/offline_world_config.ts tests/offline_world_config.test.ts` exited 0.

The owned five conflict files contain no remaining conflict markers. They remain unmerged in the index until the parent stages the resolved files, as requested.

## Concerns requiring parent integration

- FOUND: tests/server/freehold_wire.test.ts currently source-pins the old inline main.ts freeholdsEnabled assignment. Update the row from ['src/main.ts', 'freeholdsEnabled: world === undefined'] to ['src/game/offline_world_config.ts', 'freeholdsEnabled: options.world === undefined']. This file is outside my ownership. Parent was notified. The direct helper behavior cases now pin both outcomes.
- Parent must run the command-schema, IWorld parity, command facets, offline-world-config, freehold wire, and applicable architecture/monolith checks on the fully merged tree. Census evidence is not a substitute for the suites.
- Parent owns monolith ratchets. This resolution retains the upstream main.ts extraction; the additive import union in server/game.ts is the only extra server-coordinator line relative to upstream.
- No schema, query, stored-shape, queue, lock, timeout, or growth change was introduced by these resolutions.
- Existing upstream comment history in touched files contains the prohibited work-stage word. This report does not claim a whole-file hygiene cleanup; parent should scope the requested furnishing audit's historical-code census explicitly.

No other correctness concern or nit found in this owned conflict resolution.
