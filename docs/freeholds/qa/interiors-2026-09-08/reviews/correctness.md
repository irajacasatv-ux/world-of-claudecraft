# Phase 06 correctness audit

Historical initial review. Findings and pending checks below describe the audited delivery, not the final fix round. See [the current disposition ledger](../findings.md) and [execution evidence](../execution.md).

Worktree: /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds
Diff: 654071354172b3e252cfc03a1e85efde2daddaa6..67281f8ed4
Role: fresh, read-only correctness and simulation/authority coverage.
Gate status: FAIL pending resolution of the three findings below. No fixes made.
Counts: 3 found, 0 resolved by this auditor. One P2, two P3.

The coordinator owns all shared test execution. I ran no test, generator, build, or gate command, and did not edit, stage, or commit repository files. Initial and final git status --short were empty. The findings below are verified from changed source, surrounding source, and inspected test assertions; they are not claims of executed reproduction tests. The context handoff is docs/freeholds/qa/interiors-2026-09-08/reviews/context.md. The root and simulation CLAUDE files, relevant local guidance, and the tooltip audit skill/standard were consulted.

## C1. P2, high confidence: accepted shared-owner arrivals overlap an existing player

Primary location: src/sim/instances/dungeons.ts:698.
New public caller: src/sim/freehold/gate.ts:35.
Supporting test: tests/freehold_instance_online.test.ts:700.

The settled coverage addition explicitly says overlapping occupied arrival positions cannot pass content validation. Two characters with the same authenticated account reuse one live owner claim, but every accepted entry unconditionally assigns the same origin + dungeon.entry pose. No player occupancy probe or alternative safe-arrival selection occurs before that assignment. With owner A standing at the entry, owner B's explicit gate confirmation places B exactly on A. This applies to both room definitions and to a key entry when its shared cooldown is ready.

The existing online shared-account case enters A and B consecutively and asserts equal claim identity, but never compares their arrival positions. The parity golden likewise records the shared claim's characters at the same coordinates. This is deterministic overlap, not an uncertain pathfinding result. It remains a defect even though the fixed empty-room entry is statically unblocked and entity bodies can move apart afterward.

Remediation: add a focused, deterministic owner-room arrival resolver behind the existing entry seam. Preserve the canonical empty-room entry and facing, check live occupants, and choose a stable statically unblocked alternative inside the protected arrival region, or refuse without side effects when none fits. Keep ordinary dungeon arrivals unchanged. Add tests for occupied entry in both room layouts and both host command routes, asserting distinct body-safe poses, unchanged existing occupant state, no extra RNG, and refusal leaving cooldown/claim state unchanged. Coordinate with the coverage auditor: its missing-arrival-separation test observation is this same root cause, not a third finding.

## C2. P3, medium confidence as a requirement issue; high confidence in the behavior: physical gate reverses the established combat/ownership refusal precedence

Location: src/sim/freehold/gate.ts:17.
Comparison: src/sim/freehold/hearth_key.ts:12; src/sim/freehold/instance.ts:149; tests/freehold_instance.test.ts:428.

The new public gate checks missing ownership before calling the shared context guard. An alive in-combat player with no current freehold record now receives no_freehold from Sim.freeholdEnter, while useItem(hearth_key) and the previous public enter path resolve combat first. The existing ordered-refusal test explicitly pins dead, then combat, then no record, but calls the lower-level enterFreehold helper, so it cannot catch the new public wrapper's changed priority.

This never grants unauthorized travel, but it changes the refusal reason displayed on the actual physical route and makes the two actions disagree on the same compound refusal state. The low-level ordered contract remains documented and no deliberate public-route precedence override was found in the context handoff. Normative confidence is medium because the new gate's product description does not restate precedence explicitly; resolve that scope decision openly rather than treating the lower-level green test as public-route proof.

Remediation: preserve the bound-owner corpse exception, then evaluate combat before returning the living missing-record refusal; share the policy if appropriate. Drive the public gate and key with dead + combat + missing-record combinations, exact single reason tokens, and unchanged position/inventory/clock/claim state.

## C3. P3, medium confidence in scope; high confidence in the literal mismatch: capture route mutates window.__game input despite the broad request prohibition

Location: scripts/freehold_interior_route.mjs:55.

The pasted correctness criterion says no direct setter or window.__game mutation anywhere in capture or tour scripts. The route directly assigns g.input.camYaw through that handle. The same route also invokes ordinary input methods; those calls require separate assessment and are not independently classified as a violation here. The definite compliance defect is the direct camera-state assignment. It never forges Sim position or tier and correctly drives the real prompt and /dev freehold cottage chat command. Nevertheless, the narrower implemented contract, no simulation setters, does not satisfy the broader literal prohibition.

The dedicated context reader checked D81: it specifies the default tier-0 record and real dev fixture, but contains no explicit input/camera mutation exception. The implementation receipt describes movement intent and no simulation setters; it does not establish a locked exemption. Report this as a scope/acceptance discrepancy, not a security defect or fabricated screenshot claim.

Remediation: either drive movement/facing through the actual keyboard/pointer/touch event path without direct __game assignments, then recapture and repeat the tour, or obtain/record an explicit resolution authorizing the specific direct assignment for this fixture. Assess use of ordinary input methods separately from these arbitrary property writes. Do not state that D81 expressly grants that exception. Preserve the real gate/chat flow and never replace it with Sim setters. This finding is also recorded in the context handoff; count it only once across reports.

## Source-verified gate coverage

- All relevant simulation changes were inspected. No added Math.random, Date.now, performance.now, browser/DOM/Three, render, UI, game, or net dependency occurs in src/sim. New geometry derivation and gate/key decisions draw no RNG. Added profiler laps and counters preserve tick phase order.
- world_object_bootstrap moves ground objects, mailboxes, and dungeon entrance/slot loops in order, retaining nextId mutations, callbacks, and mailbox-array aliasing. The new gate is an intentional lit-host-only extra entity between the mailbox and dungeon loops; dark-host entity order remains the previous order.
- world.ts dungeon height dispatch moved faithfully to dungeonGroundHeight, retaining the Wildheart/Last Keep/Dawnhold predicates, origin/slot arithmetic, and fallback. The existing static collider registry moved to interior_collider_sets with identical old derivations, plus the two new shared room plans.
- The new Sim-owned Map and scan counters are live SimContext getters. freeholdKeyAdmission is a separate host callback forwarding ownerKey and pid and its boolean return. No old callback was renamed or repurposed. New behavior lives in focused modules; the main coordinator shrinks.
- Both rooms have all six simulation/render integration points. Inn index 15 and Cottage index 16 use their own layouts, floor mapping, collider derivation, union variant, definitions, and renderer resolver. Rooms/layout rows and nested anchors are frozen. Inn has 3 plinths and Cottage 4, matching the current tier table. All supplied anchors, entry and exit are inside the room. Protected aisle and solid envelopes are covered by independent derivation and swept-path assertions. Occupied player arrival is the missing dynamic case, C1.
- The authoritative gate requires a live object with the exact template and a full 3D 5-yard radius, with no automatic gate proximity callback. Tick-only proximity is covered. Left click, right click, and nearby interaction branch to openFreeholdGate before pickup; the gate is nonlootable with null objectItemId.
- The gate's item grant is after successful owner entry. Inventory absence and canAddItem control only restoration of the permanent tool. Full bags preserve successful entry and mint nothing. Repeated physical entry does not read or consume the remote cooldown. Condition zero does not block the physical entry.
- Hearth Key is a permanent soulbound tool defined in content/freehold/items.ts; the use dispatcher checks held inventory/selected slot before its focused action. Possession cannot create ownership. The authoritative meta owner stamp, not supplied frame fields, selects current record/tier/claim. A forged key without a record is denied. Generic server enter_dungeon cannot bypass this because it requires an actual nearby dungeon door, and the home defs spawn none.
- Shared context checks cover dead/combat, non-spell cast, authoritative BG/arena/duel membership, arena/BG position bands, jail sentence and visitor coordinates, nonfinite coordinates, actual delve/rift/dungeon lookup, and unknown instance bands. No forbidden context teleports. Exact per-reason no-state/no-RNG assertions exist; the rift test currently uses the rift band rather than a generated live rift run, a coverage auditor concern.
- Already selected owned home returns silently before host participant or clock reads and does not change cooldown/sequence. Another owned tier remains instanced. The isolated account Map is outside plot serialization, uses injected lockoutNowMs, preserves an accepted deadline across clock reversal, alts and tier changes, and writes exactly 3600000ms only after accepted remote entry.
- The realm boot callback is explicitly false until 07/07a durable account authority. Real server dispatch tests separately use an explicit fake participant to prove the item frame reaches the shared action and owner stamp; they do not prove production authority. The msg.item jail guard recognizes use/hearth_key and freehold_enter remains blocked. Dark realms reject both command routes and spawn no gate or automatic key.
- dungeonEntrySeq increments only at actual dungeon arrival and is now mirrored onto the client player from the accepted self-wire entry identity. No welcome/camera/audio directive is derived from it here; future consumption authority remains a later contract.
- Dressing reads the shared table, uses prepared shared materials and identical instanced-mesh prewarm representations, and reaches the existing gated containing-dungeon attach. Both home variants bypass the infernal-light branch; no new room light was introduced. Reserved Cottage Strongbox/station keys intentionally draw nothing until 12, as the locked scope says.
- One total freeholdDeniedLineKey map covers all current denial reasons. The five new English denial sentences match the context ledger. Hearth Key tooltip exactly matches the Wave A sentence, has no second-home sentence, and obtains its 3600-second metadata from the live 3600000ms constant.
- Capture/tour scripts use the real gate prompt and chat /dev freehold cottage route, with no Sim/tier/position setter. They do control the input seam through window.__game.input, addressed as a literal wording concern below.

## Explicit contradictions and scope decisions for the coordinator

1. The pasted acceptance says both enter paths work online, but its later credential section and the locked ledger require production remote-key admission to fail closed until 07/07a. The latter is correctly implemented. Record current acceptance as offline real behavior plus actual online dispatch/fail-closed behavior and injected-participant protocol proof. Do not enable production with the isolated Map or demand an unavailable 07a PG dependency. There is no committed online cooldown display mirror yet; that is also owned by 07/07a.
2. The inherited Inn enterText at src/sim/content/freehold/dungeons.ts:28 still says "rented room", while the request bans rent vocabulary. It is unchanged from the comparison base but explicitly within this audit's requested hygiene scope. The context reader found no exception. The hygiene/content auditor should own and count this once; correction needs the exact dungeon-text localization linkage and freshness checks.
3. The pasted D81 parenthetical literally forbids any window.__game mutation in capture/tour scripts. The implementation instead forbids direct Sim/tier/pose setters but sets input.camYaw and calls input movement methods, e.g. scripts/freehold_interior_route.mjs:55. This is real input-seam travel and the authorized chat fixture, not forged character state. Confirm the locked wording and record the intended distinction rather than silently claiming the broader literal sentence is satisfied. The context reader confirmed no explicit D81 input exception; this is counted as C3, a scope/acceptance discrepancy, not a simulation bug.

## Validation limits

I inspected tests and the context reader's recorded prior results, but did not execute them. This report supplies no current shared test/gate PASS. The coordinator must attach its exact current command outcomes and require a fresh review of the complete fix round. No available evidence yet resolves C1, C2 or C3.
