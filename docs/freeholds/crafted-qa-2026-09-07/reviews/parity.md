# Phase 04 finishing cross-host and client parity review

Verdict: one confirmed low-severity presentation gap, one documentation nit. No authoritative host, IWorld shape, snapshot, event-routing, command-validation, or RL-binding drift was established.

Scope: original `49ed3f0933..3666d89647`, reconciled against incoming `54ce808436` and the current merged worktree at `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`. Runtime sources were treated as frozen. No repository files were modified and no tests, generators, or gates were run by this reviewer. This report is the only output file written.

## Confirmed findings

### P1: Dark-host furnishing manuals still advertise a usable learn action

Severity: P3 (low). Confidence: high. Category: availability presentation versus authoritative command behavior.

Primary changed source: `src/sim/professions/crafting.ts:379`. The new host gate refuses a furnishing recipe grant as `unknown_recipe`. The pattern apply path reaches that gate, restores its knowledge snapshot, and returns without any feedback at `src/sim/professions/pattern_items.ts:149` and `:155`.

The corresponding tooltip consumer was not given the host capability. `src/ui/hud.ts:6667` passes only `craftingIdentity` into `recipePatternTooltipLines`; `src/ui/hud/professions/recipe_pattern_tooltip_view.ts:141` through the returned model at `:144` evaluates drop acquisition, skill, and knownness only. `src/ui/bags_view.ts:572` also continues to supply the click-to-use hint to every recipe item.

Concrete case: retain one unknown `pattern_freehold_clockwork_lamp` across a realm restart with Freeholds disabled, with engineering skill 50. The item remains a valid bag item and the tooltip still presents what it teaches with its skill requirement satisfied and a click-to-use hint. Clicking cannot learn it and receives no error or result. The same case applies to all three manuals. The existing dark-host test explicitly pins the untouched inventory, unchanged knowledge, and empty event queue (`tests/freehold_crafted_availability.test.ts:101`). This is not an authority bypass or item-loss defect; it is a missing availability explanation on a reachable retained-item surface.

The read-only `woc-write-game-tooltips` criteria were applied to this discovered seam: `docs/design/tooltip-writing.md` requires important failure conditions, and the tooltip module itself documents that it must not advertise learning the sim refuses. A complete repair would propagate the existing capability into this availability presentation, or provide a single localized refusal on use, with a dark/true host regression. No runtime repair was attempted here.

### N1: The recipe/training seam documentation still describes the pre-extraction shape

Severity: P4 (nit). Confidence: high. Category: architecture documentation.

`src/sim/sim.ts:8628` still calls `recipeList` the full recipe list although `:8633` now returns the capability-filtered projection. `src/world_api/professions.ts:76` through `:80` likewise describes both worlds reading the same complete table directly. `src/sim/professions/training.ts:3` through `:4` attributes charging, acquisition, and event emission to `Sim.trainRecipe`, but that method is now a delegate and `src/sim/professions/train_recipe.ts:9` owns those effects. The module map at `src/sim/professions/CLAUDE.md:201` does not name either `train_recipe.ts` or `recipe_visibility.ts`.

These comments do not affect gameplay, but the changed seam now has an availability condition and a separate command owner that future maintainers need to find. The coordinator had already flagged this family of documentation drift in its exploration evidence; this is confirmation, not a second distinct functional defect.

## Categories checked and clean

- **IWorld through Sim and ClientWorld:** `IWorldEntityRoster.cfg` gains only the optional capability (`src/world_api/entity_roster.ts:7`); `ClientWorld.cfg` uses `IWorld['cfg']` (`src/net/online.ts:1264`) and starts absent/dark (`:1816`). Both recipe reads use `recipesForFreeholdAvailability` (`src/sim/sim.ts:8633`, `src/net/online.ts:1589` and `:2345`). Existing IWorld members remain `recipeList`/`trainRecipe`; no new command member was omitted from the parity pin.
- **Server configuration and hello:** the realm parser requires the exact env string `1` (`server/freehold_config.ts:27`), the Sim receives the boot result (`server/sim_boot_config.ts:48`), both join and resume call one builder (`server/game.ts:3770`, `:3922`), and the builder emits capability only for strict boolean true (`server/world_hello.ts:31`). Client decode likewise requires strict true and deletes stale capability for absent/malformed values before the reconnect callback (`src/net/online.ts:2343`). The dedicated test covers actual fresh/resumed server hellos, legacy bytes, client-before-hello defaults, and malformed values (`tests/freehold_crafted_presentation.test.ts`).
- **Shared simulation across hosts:** availability is one pure static-identity predicate (`src/sim/freehold/crafted_availability.ts:9`). It gates acquisition, craft start, direct resolve, batch availability, trainer entry, and quartermaster purchase (`src/sim/professions/crafting.ts:379`, `:846`, `:1321`, `:1510`; `train_recipe.ts:14`; `src/sim/instances/heroic_vendor.ts:35`). Denials precede charging, consumption, and output draws. The trainer extraction preserves its dead gate, shared validator, one fee debit, grant, and personal event. Stock offline configuration opts in and custom worlds do not (`src/game/offline_world_config.ts:20`); headless explicitly opts in (`headless/env_server.ts:122`). There is no new host-only gameplay implementation.
- **Presentation caches:** recipe visibility retains stable dark-list identity and matches the catalog's supported append/remove invalidation contract (`src/sim/professions/recipe_visibility.ts:8`; `tests/recipe_visibility.test.ts`). Client recipe selection is rebuilt on every hello. The crafting repaint signature includes capability (`src/ui/hud/professions/crafting_view.ts:499`); trainer and quartermaster models consult strict-true capability. The held-pattern caveat is P1 above.
- **Snapshot encoding and delta semantics:** Phase 04 adds no snapshot key. Recipe knowledge continues through the atomic `cprof` value (`server/game.ts:8973`); `src/net/professions_self_mirror.ts:89` applies only a present non-null field, and `src/net/crafting_wire.ts:53` copies known recipes. Inventory/purse continue through their existing mirrors. Absent deltas do not erase the recipe knowledge or inventory. The capability is a boot hello property, never an accidental heavy-self delta.
- **SimEvent emission, routing, handling:** no new SimEvent kind is introduced. Trainer emits existing pid-scoped text-free `trainResult` (`src/sim/professions/train_recipe.ts:23`); crafting emits existing `craftResult`; quartermaster emits existing `vendor`. Server personal selection and routing preserve pid and batch order (`server/game.ts:9491`, `:9540`). Client events still feed the queue and craft mirror (`src/net/online.ts:2484`, `:5257`); Hud handles `trainResult` at `src/ui/hud.ts:11862`. No new event was left unrouted or unhandled.
- **Client commands through server validation:** `ClientWorld.trainRecipe` sends existing `train_recipe` (`src/net/online.ts:3982`); server validates the recipe string and uses the authenticated pid (`server/game.ts:6842`). `craft_item` preserves string, strict commission, and finite count checks (`:6693`); `heroic_buy` validates itemId (`:8061`). All resolve through the guarded Sim bodies. The `anchorFields` extraction is text-identical to its predecessor, keeps omitted optional bytes empty, and does not change its callers or server anchor validation (`src/net/item_copy_anchor_wire.ts:9`).
- **Sim/server text localization:** the new branches reuse existing text-free reason vocabularies. `train_not_taught_here` is rendered through `hudChrome.training.notTaughtHere` (`src/ui/hud.ts:11893`); `unknown_recipe` maps through the crafting denial model (`src/ui/hud/professions/craft_denial_line_view.ts:45`). The quartermaster's reused `That item is not sold here.` literal already maps in the error matcher (`src/ui/error_text_i18n_core.ts:162`). The hello extraction adds no player prose. P1 is omitted feedback, not an untranslated new string.
- **Headless observation/action and Python bindings:** Phase 04 changes neither `ACTIONS`/observation encoding nor the NDJSON request/reply shape. Housing/profession action exclusion is an explicit recorded host cut, with the housing token exclusion pinned at `tests/env_protocol.test.ts:144`. Python still queries spaces and mirrors the unchanged protocol; no action index or binding was silently added/removed. The shared Sim remains lit on the headless host.
- **Merge-specific preservation:** reviewed `/tmp/freeholds-crafted-qa-merge-runtime.md`, `-merge-tests.md`, and `-merge-audit.md`. The recipe/hello/housing and anchor extractions survive alongside incoming ability and snapshot changes. Rift enchant retirement belongs to incoming runtime; the current furnishing test now drives the surviving Promise/outcome commands. No restoration of an obsolete command is needed.

## Coordinator evidence and limits

Inspected the parent-provided logs and reports instead of rerunning deterministic commands:

- Parent reports `npx tsc --noEmit` passed; `/tmp/freeholds-crafted-qa-tsc-merge-verified.log` contains warnings only, with no compiler diagnostic.
- `/tmp/freeholds-crafted-qa-content-first.log`: 22 files, 744 tests passed.
- `/tmp/freeholds-crafted-qa-merge-pins.log`: 16 files passed; 4 failures were the then-obsolete synchronous Rift harness expectation (709 passed, 1 skipped). It is historical intermediate evidence, not a final pass.
- `/tmp/freeholds-crafted-qa-market-rift.log`: subsequent corrected run, 3 files and 48 tests passed.
- `/tmp/freeholds-crafted-qa-i18n-merge.log`: generator output inspected; generation is not a substitute for final localization tests.

Final integrated architecture, golden parity, protocol, localization, and gate results remain coordinator-owned. This review makes no claim that the complete final gate has finished, and its static clean categories are not a replacement for those results.
