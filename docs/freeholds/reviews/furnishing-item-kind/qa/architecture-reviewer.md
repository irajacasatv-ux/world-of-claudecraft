# Furnishing architecture COVERAGE review

Architecture source verdict: PASS, no additional findings. The simulation and furnishing pure-core source review is complete. Shared validation remains pending the coordinator's final matrix; this is not the packet QA verdict.

Scope: original furnishing implementation `16f2aeed2be022343291e18ede12cd042cae1fc6..c47e2cb24519be7df37e8664b9d2d61756e2ce4a`, composed integration `041fd790cec0ea52c3e2285dcac7c3a49f30e7b0`, and current furnishing QA source/test changes. Planning requirements were read only through `/tmp/freeholds-02-audit/packet-context.md`. The registered `woc_sim_architecture` instructions and canonical architecture-reviewer concerns were applied. No repository edit, test execution, generator, or shared gate was performed by this reader.

## Additional findings

None identified in the reviewed architecture surface. This does not erase findings already raised by the correctness, hygiene, or parity readers. Their complete closure remains a separate requirement.

## Previously reported defects and present repair evidence

- Loaded furnishing power: the original direct equip/use guards did not protect `Sim.addPlayer` restoring a valid furnishing ID with a stat-bearing instance. Current `entity.recalcPlayerStats` rejects furnishing before authored/rolled stats, ratings and set counting; its mainhand projection refuses furnishing weapon capabilities. `wornSetCounts` excludes furnishing before deriving talent/set modifiers. `isUniqueEquipped` and `masterwroughtConflictSlot` exclude furnishings on incoming and worn sides. Saved equipment/copy payloads remain intact, so the repair makes them inert without losing copies. Tests cover raw recalculation and real serialize/load, valid instance-only power, forged authored powers, set procs, modifiers, weapon identity, both proc hands, and eligible gear controls.
- Inapplicable tooltip power: `Hud.itemTooltip` now routes furnishings to a complete domain composer before equipment/consumable/instance-power branches. The composer preserves authored identity/quality, placement, signer, custody locks and prices. It accepts only the required `IWorld.partyTradeMsRemaining` seam for its host clock. It does not import a concrete world or duplicate a simulation decision.
- Incoming Perfecting collection: the merge preserved the original furnishing bonus refusal in the extracted `professions/perfecting_bonus.ts` owner. QA additionally excludes furnishing from `withPerfectingBonus` and `perfecting_swap.validProgress`, including deliberately spoofed collection membership. The same view feeds command admission. Rejection precedes both payload replacements, wire revision, stat recalculation and all observable copy mutations.
- Dead entry/local contract: the unreachable furnishing member of `UNSTACKED_KINDS` was removed while retaining the unconditional one-per-copy head guard; housing guidance now anchors its output contract to `FurnishingTooltipRow`.
- Parity reader's presentation projections: current `item_compare.ts` treats worn furnishing power as absent and refuses comparison output for a furnishing candidate. Current HUD stat input and player-card weapon input reject furnishing capabilities through existing equipment predicates. Final composed projection tests remain coordinator-owned.

These findings are tracked by their originating reports, not counted again here.

## Architecture coverage

### Randomness and determinism

The original crafting change gates the EFFECT after the existing Jack variance and unconditional masterwork draw. It does not move, duplicate or skip those draws. Furnishing `craftBonusStatsFor` returns null and Perfecting head-start is explicitly barred. The added kind refusals run before any mutating profession procedure's random draw.

The new equipment projection checks and Perfecting collection checks are pure and draw-free. No new wall-clock, machine-random, DOM, browser, renderer or network import is introduced in simulation source. Synthetic crafting tests pin one normal draw, two Jack draws, a forced hit producing no power payload, and same-seed replay. Refusal snapshots also assert no draws. The expanded furnishing run now passes 207 tests in six files. Final parity/architecture/type command results remain coordinator-owned.

### Tick order and SimContext

The furnishing implementation and QA fixes add no tick entry or callback, change no tick ordering, and do not move entity/effect iteration. All new behavior remains in existing focused modules. `sim.ts` and the `SimContext` callback shape have no furnishing QA diff.

The composed merge preserves both independent type imports for housing and the incoming grant-options seam. Incoming Perfecting world methods remain thin: `Sim.perfectingSwapInfo` forwards ctx/pid/request to the world-view adapter; `Sim.swapPerfectingRanks` forwards the same order to its command adapter. The adapter obtains live meta/entity data through `ctx.resolve`, then calls the shared pure admission and authoritative mutation. No callback binding, argument or return-value discrepancy found.

### Relocations and mutation

The bonus-owner move preserves the furnishing early refusal in the new helper rather than leaving a dead copy in `perfecting.ts`; that module imports/re-exports the owning function. There is no remaining duplicate implementation. The upstream mount extraction preserves the original description/mobility/summon strings and formatting at a small helper seam.

The furnishing changes do not convert an existing in-place mutation into immutable updates. Incoming Perfecting rank exchange constructs both new payloads before replacing either container. Its existing successful inventory/equipment replacement order is unchanged by the added refusal; read-only inputs resolve both copies before mutation, with no asynchronous work between validation and commit.

The heroic candidate Set-to-Map narrowing preserves first-insertion traversal order and stable item-record references for the synchronous static registry. Duplicate candidates overwrite the same record without reordering. It permits only armor/weapon/held-offhand through a positive type predicate before synthesizing a variant.

### Storage and host-independent shapes

`isStorableItemKind` is a type-import-only leaf and preserves the historical non-quest results. Each bank/mail/trade/market consumer retains its own binding/lock policy and evaluates admission before removal. The merge composes the furniture arm with material-source selection rather than treating signed furniture as an honest material. Custody tests round-trip character bags/bank, guild book, mail partitions/full book, listing and collection storage; journal tests verify no query/anchor/movement for furnishing and actual material controls.

No furnishing schema or wire vocabulary is added. Existing ItemDef/InvSlot/ItemInstancePayload transport continues to carry synthetic copies. The loaded-copy repair leaves serialized shapes and counts intact and changes only the active power projection. Database/persistence/authority reviews remain their specialist owners.

### UI core and host seam

`furnishing_tooltip_view.ts` has only a type import; its runtime import closure is empty. The core returns literal keys and authored resolved values, with no fallback for footprint/radius/cost and copy-only signer. The approved inventory from the Explore summary matches all authored keys and exact English values.

The generic UI-core architecture guard intentionally permits i18n imports, so a passing generic guard alone does not establish the stronger furnishing contract. The actual core import closure does. The new focused import assertion transpiles the actual core, checks the exported function is present, and forbids runtime import/require or browser-global tokens. The current source independently contains only the permitted type import.

The complete card receives a narrow IWorld facet, and concrete host classes remain outside the presentation source. The HUD stays a thin caller and shrinks. The mount helper's i18n import is permitted by the generic UI-core contract and is not a furnishing-core exception.

### Player text and tests

No furnishing sim/server emit literal or event discriminator changed, so existing error/result matcher paths remain authoritative. The Perfecting collection refusal uses existing `invalid_progress`, not unlocalized prose. Housing English resides solely in authored catalogs and is composed through `t`, number formatting and escaping.

Direct tests cover the new/extracted source owners. No duplicate implementation, dead ctx scaffolding, new unused simulation import, or concrete Sim runtime import was found. Every final test/type/gate result must come from the coordinator's actual logs.

## Evidence inspected

Historical intermediate logs were read by content, not accepted by filename:
- `perfecting-green.log`: 3 files, 90 passing tests.
- `tooltip-green.log`: 2 files, 34 passing tests.
- `persistence-green.log`: 2 files, 13 passing tests.
- `equipment-green.log`: despite its name, 3 failed positive equip controls; not passing evidence.

Latest inspected results:
- `furnishing-expanded.log`: 6 files, 207 passing tests. This supersedes the earlier equipment positive-control failures.
- `fix-tsc-fifth.log`: nonzero diagnostics remain while UI work is active: generated catalogs lack the newly approved partyTradeWindowCustody key, and several parity-test IWorld-typed variables call drainEvents. These are visible pending integration work, not a clean typecheck. The coordinator owns regeneration, fixture corrections, and the fresh full typecheck.

These are intermediate and cannot substitute for the final matrix, `npx tsc --noEmit`, architecture/parity gates, i18n freshness, `node scripts/gate_select.mjs`, or post-final-commit `npm run ci:changed`. The integration introduced upstream golden changes; none should be regenerated merely to make this furnishing QA pass.

## Current counts

Additional BLOCKING: 0. Additional SHOULD-FIX: 0. Additional NOTE: 0. The requested simulation/pure-core source review is complete. The coordinator will append the final shared matrix; no final QA PASS is implied by this source verdict. Checked clean categories: simulation purity, RNG placement, tick order, SimContext delegation, mutation/alias preservation, focused-module placement, copied data preservation, and player-text seam.
