## Parity / Sync Report

Historical initial review. Findings and pending checks below describe the audited delivery, not the final fix round. See [the current disposition ledger](../findings.md) and [execution evidence](../execution.md).

**Scope:** Phase 06 diff `6540713541..67281f8ed4` in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`: Freehold interiors/instance indexing; gate confirmation and real command dispatch; Hearth Key item dispatch/account clock; browser, server and headless hosts; self snapshot and arrival observation; housing events/i18n; social, relay, admin and telemetry consumers; RL/Python protocol boundary. Read-only review; no repository files changed or shared checks executed by this reviewer. Planning scope was supplied by `/root/context` in `docs/freeholds/qa/interiors-2026-09-08/reviews/context.md`.
**IWorld members checked:** 6 primary members (`freeholdEnter`, `freeholdLeave`, `useItem`, `myFreehold`, `freeholdLayout`, `housingNowMs`); additionally shared presence status union.
**Wire fields checked:** 9 (`de`, inventory, `freeholdsEnabled`, presence status, admin location kind, four instance-scan capture counters).
**SimEvents checked:** 1 primary union member (`freeholdDenied`), its reason selector, routing and HUD handling; also the generic `error` fallback implicated below.
**Findings:** 0 critical; 1 warning (low severity, high confidence); 0 additional speculative defects.

### CRITICAL

None confirmed.

### WARNING

**CP-01 ,  Low severity, high confidence: jailed gate/key denials diverge from the shared housing feedback contract.**

- Source: `server/game.ts:6134` handles jailed `freehold_enter` with personal `freeholdDenied(reason:'no_freehold')`. A jailed real `{cmd:'use',item:'hearth_key'}` is correctly caught by `refusedJailedTravelCommand`, but falls through at `server/game.ts:6139` to `sendChatNotice`.
- That helper emits `{type:'error',text}` without a pid at `server/game.ts:9613`. It does produce a localized generic error toast through the existing moderation matcher (`src/ui/server_i18n_moderation.ts:440`); feedback is not absent and this is not an untranslated-string defect.
- Shared offline/headless context returns `busy` for jail status/position (`src/sim/freehold/entry_context.ts:32`), emitted through `freeholdDenied`. Its client selector is `src/ui/hud/housing/freehold_event_feedback.ts:9`.
- Impact: the online key bypasses the required housing-specific, id/pid-carrying event/selector; online gate also uses a different, misleading ownership reason for the same jail restriction. The jail refusal itself remains secure and happens before item dispatch. Context audit confirmed D10 requires every housing denial/grant to use personal id-carrying SimEvents and housing keys, with no jail exception.
- Fix: route both jailed `freehold_enter` and real `msg.item === 'hearth_key'` uses to the same personal housing denial with the consistent jail-context reason (`busy` is already the shared reason). Preserve `rid:false` and early return. Strengthen the actual dispatch tests near `tests/server/freehold_wire.test.ts:1128` to assert the exact personal event, requester-only delivery, and unchanged state. Current jailed-key coverage proves the sim item method is not called but does not pin the feedback shape.

### INFO

- Production realm Hearth Key admission is intentionally fail-closed in `server/sim_boot_config.ts`; successful online key tests explicitly inject the authority participant. The isolated Sim account clock is not an online cooldown authority. Durable account state and a committed online cooldown mirror belong to 07/07a, so their absence is not a Phase 06 defect.
- `de`/`Entity.dungeonEntrySeq` is accepted entry-pose identity. No new welcome, sound or camera effect is derived from historical snapshots, replay, resume or a new client. Fresh arrival directives and camera eligibility are later-phase authority; this report does not certify those future paths.
- Housing descriptor getters remain deliberately null pending 08a; visiting actions remain unavailable pending 18. Dormant visitor lookup adapter identity/edit/close/reconnect protections are implemented now.
- Social room labels use the shared catalog classification; relay alone deliberately publishes generic `Freehold`. No planning requirement was found to replace friend/guild/who catalog labels with generic text. No owner identifier is added to those wire types.
- Shared checks below predate final fixes. Full selected gate, final production build, final snapshot/parity suite and named pre-enable performance evidence are still parent-owned evidence dependencies. This report does not imply their success.

### PASSED

1. **IWorld command parity:** the existing gate/leave/use methods reach real ClientWorld command senders, exhaustive server dispatch and the same Sim modules. The ten housing command tokens remain aligned. No new housing IWorld member was introduced requiring another member pin.
2. **Actual physical gate authority:** command dispatch derives the player from the authenticated session; gate proximity is live-object based and requires explicit confirmation. Smuggled account/owner fields do not select a claim. Ordinary `enter_dungeon` dispatch requires its actual dungeon-door template, so the gate does not add an alternate entry route.
3. **Dark realm behavior:** housing commands and real `use` frames carrying `item:'hearth_key'` are rejected before Sim entry, clocks or heavy inventory re-diff. Refusal is requester-scoped. Jail refusal has the feedback exception CP-01.
4. **Permanent item semantics:** the selected inventory slot is validated through the existing use path, key ownership does not establish housing ownership, and successful key use returns before consumption. Physical gate entry can replace a missing key when capacity permits; full bags do not undo a successful entry.
5. **Isolated account clock:** browser/headless Sim uses the injected lockout clock and an account-keyed map outside plot data. Same-account alts share it, other accounts remain independent, successful teleport alone advances it, selected-home re-use is silent, and failed context/admission/capacity checks do not consume it. No ambient clock or RNG source was introduced into this path.
6. **Committed self display:** server negotiated `de` emission (`server/game.ts:8437`) reaches the existing facing helper and the new Entity mirror (`src/net/online.ts:2865`). Omitted deltas preserve the previous sequence; reconnect resets transport state. Pending gate observation uses accepted state, closes on reconnect, and does not resend or derive historical arrival effects.
7. **Housing event routing:** normal Sim `freeholdDenied` events carry pid; server anchored-event routing and the HUD pid filter retain personal delivery. The housing selector produces a single toast. CP-01 is the sole confirmed special-case divergence.
8. **Private state separation:** no account cooldown map/owner key is added to general snapshots. Existing freehold snapshot fields remain an empty allowlisted future seam. Multi-account server tests inspect frames for owner identifiers and use authenticated account ownership.
9. **Instance behavior across hosts:** the shared claim lookup/index and occupancy roster pass use catalog/slot geometry and the original exact membership predicate. The special widened raid boundary remains on its original path. Counters reset on nonsweep ticks and do not become gameplay input.
10. **Presence/admin/telemetry:** server presence, `PresenceStatus`, ClientWorld consumer, social status localization and `/who` recognize Freehold; relay remains generic. Admin server/client location kind and labels match. Both room telemetry IDs map to one bounded server scene class; no per-account labels were introduced. Four performance capture counters match the admin type surface.
11. **Headless/Python boundary:** headless runs the same modules with isolated host admission/clock semantics. No housing RL action was added; ordinary `interact` does not transform the non-lootable gate into a dungeon door. Observation/action sizes remain handshake-driven on the Python side and protocol pins retain the intended action surface.
12. **Prompt command lifecycle:** own entry is explicit; absent friend adapter leaves visiting unavailable. Dormant lookup tests/source cover stale same-name responses, edited names, invalidated capability, failed lookups, close and reconnect, keyboard/result focus and unsent-command retry. Existing command-lane refusal does not cause automatic replay.

### Comparison Tables

#### IWorld parity

| Member | Sim | ClientWorld/server | Status |
|---|---|---|---|
| `freeholdEnter` | `src/sim/sim.ts:11639` delegates shared gate | `src/net/online.ts:4342`; `server/freehold_wire.ts` dispatch | MATCH; jail reason exception CP-01 |
| `freeholdLeave` | Shared instance leave | Existing command sender and grouped housing dispatch | MATCH |
| `useItem` | `src/sim/sim.ts:8380`, `src/sim/items.ts:898` | `src/net/online.ts:3854`, `server/game.ts:6375` | MATCH; jail feedback exception CP-01 |
| `housingNowMs` | Injected farm clock | Existing client read clock | MATCH for current read-only housing surface |
| `myFreehold` / `freeholdLayout` | Phase-owned empty descriptor seam | Empty strict snapshot seam | INTENTIONAL, 08a |

#### Wire parity

| Field/surface | Source | Consumer | Status |
|---|---|---|---|
| `de` | `server/game.ts:8437` negotiated self delta | `src/net/online.ts:2865`; facing helper | MATCH; omitted delta retained |
| Inventory after physical grant | Sim addItem, `server/heavy_self.ts` gate dirty marking | Existing ClientWorld inventory decoder | MATCH |
| `freeholdsEnabled` | Server sim config and command gate | Client config and UI visibility | MATCH |
| Presence `status:'freehold'` | `server/instance_presence.ts`, `server/social.ts` | World API union, social UI and `/who` matcher | MATCH |
| Admin location `kind:'freehold'` | `server/live_location.ts` | `src/admin/types.ts`, instance label/i18n | MATCH |
| Four scan capture counters | `server/instance_scan_tick_stats.ts`, perf capture | `src/admin/types.ts` capture result | MATCH |

### Evidence and limits

Coordinator-provided targeted execution was inspected in `docs/freeholds/qa/interiors-2026-09-08/logs/initial-tests.log.txt`: 11 files, 397 tests passed. Command:

```sh
npx vitest run tests/freehold_layouts.test.ts tests/freehold_gate_and_key.test.ts tests/housing_view.test.ts tests/renderer_compile_gate.test.ts tests/entity_display_name.test.ts tests/map_marker_semantics.test.ts tests/map_semantic_accessibility_core.test.ts tests/minimap_markers.test.ts tests/item_icons.test.ts tests/monolith_budget.test.ts tests/server/freehold_wire.test.ts --maxWorkers=4
```

`docs/freeholds/qa/interiors-2026-09-08/logs/scoped-tests.log.txt`: 14 files passed, 586 tests passed and 3 skipped. Command:

```sh
npx vitest run tests/freehold_instance.test.ts tests/dungeons.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/item_art_consistency.test.ts tests/mobile_station_party.test.ts tests/command_schema.test.ts tests/env_protocol.test.ts tests/freehold_dev_grant.test.ts tests/i18n_completeness.test.ts tests/localization_fixes.test.ts tests/guide.test.ts --maxWorkers=4
```

Thus shared sim architecture, protocol, localization drift and locale completeness checks are green at the reviewed state. The coordinator also reported successful generators and typecheck with clean generated state. No separate reviewer execution of world_api_parity, i18n_emit_shape, snapshot suites, build or full selected gate occurred; final gate evidence must be supplied by the coordinator. Source inspection of additional prompt, online-instance, dungeon-facing, presence and telemetry tests is coverage evidence, not a claim they ran in these two invocations.
