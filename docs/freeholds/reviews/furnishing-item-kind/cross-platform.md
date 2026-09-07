# Furnishing cross-platform coverage review

Scope: current uncommitted furnishing-kind diff against HEAD (`16f2aeed2b`) in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch `feature/freeholds`, including new untracked modules and tests. This is the requested kind implementation, not the full feature-branch history. No repository file was changed, no suite was run, and nothing was staged or committed. This report is the only written artifact.

Verdict: **no confirmed runtime cross-host or cross-client parity defect**. Static seam review is clean. Completion remains conditional on the coordinator's final checks. All confirmed coverage gaps and the documentation nit are included below. Tests were changing during review; named tests and production symbols identify the reviewed arms when line numbers move.

## Findings

1. **P2, high confidence, coverage: property-based defensive admission is not fully distinguished from the old fallback.** `src/sim/items.ts:778`, `src/sim/professions/enchanting.ts:1284`, and `src/sim/professions/perfecting.ts:411` correctly add furnishing refusals before property-based use, slot, and Masterwrought checks. The tests named `use command consumes nothing and grants no effect`, `refuses enchanting without spending the copy or reagents`, `refuses enchant admission before starting a cast`, and `perfecting refuses without spending materials or altering a copy` in `tests/furnishing_item_kind.test.ts:332`, `:412`, `:426`, and `:387` use an actionless, slotless, non-Masterwrought definition. Those cases remain green if the new positive furnishing guard disappears. Use forged furnishing use/feast data, a matching enchant slot, and a Masterwrought furnishing with a qualifying recipe; assert the existing literal denial, no effects/consumption, and zero draws. Separate forged stack, gathering, tool-charm, Perfecting-bonus, and heroic tests already address their respective arms. This is a test gap, not a current runtime defect.

2. **P2, high confidence, coverage: successful craft draw order and the new head-start exclusion lack a decisive furnishing case.** `src/sim/professions/crafting.ts:1140` correctly excludes furnishing only at the Perfecting effect gate after the existing draws. The successful craft test in `tests/furnishing_item_kind.test.ts:489` proves a rare signed output but does not observe draw count, drive a Jack craft, force the proc on a forged Masterwrought furnishing, or enable commission. Add ordinary and Jack draw-count pins, a forced proc with no power/Perfecting payload, and commission opt-in remaining unarmed under the existing signer rarity rule. A same-seed craft/transfer/refusal sequence comparing state, events, and RNG tail directly substantiates host determinism. This agrees with architecture review finding 1.

3. **P2, high confidence, coverage: vendor math does not exercise the changed purchase path.** `src/sim/items.ts:1232` prevents a furnishing with malformed teachesRiding from delegating to riding training. The test named `permits ordinary bulk vendor purchases with one copy per slot` at `tests/furnishing_item_kind.test.ts:783` calls vendorCountForced and buyPurchaseTotals only. It cannot detect loss of the command guard or prove capacity behavior. Exercise buyItem using the existing synthetic vendor seam: ordinary count purchase, insufficient free cells, and forged riding flag; assert item ownership, payment, no riding grant, and existing honor/soulbound count restrictions. Static implementation inspection found this branch correct.

4. **P3, high confidence, coverage nit: the transport lock matrix is sampled rather than pinned for the new kind.** `src/sim/item_storage_rules.ts:4` is correctly wired into personal bank, guild bank, trade, mail, and both market listing entry points. The synthetic suite proves signed transport and quest refusal, plus one guild-bank bound-copy case and the Exchange hard locks. It does not yet drive every relevant furnishing soulbound/noMarketList/bindOnTrade/boundTo distinction through actual transfer pipes, personal-bank allowance, and the direct-trade recipient-binding exception. Each old runtime check and its position remain unchanged, so this is not a custody vulnerability. Add small table-driven tests for source/destination state and literal refusal order; include all old kind literals and a runtime unknown in the shared predicate equivalence test. This overlaps architecture review finding 5.

5. **P3, high confidence, documentation nit: the stackSize field comment disagrees with the new kind.** `src/sim/types.ts:1097` says weapon/armor/bag/tool default to one and everything else to twenty. Furnishings always use one even with a malformed override; the old comment also omitted recipe and held-offhand. Point at stackSizeOf without repeating an incomplete roster. Runtime behavior is correct.

The architecture report's earlier missing unbind regression is already resolved in the source inspected near report time: `refuses unbinding without clearing a copy lock or charging copper` calls unbindItem with boundTo zero and bindOnTrade true and pins the exact refusal and fee. The coordinator is addressing the remaining findings and will request a fresh review after the fix round.

## Parity categories checked and clean

### IWorld, commands, and authority

No IWorld member, SimContext callback, ClientWorld member, server command, or validation vocabulary was added or modified. Existing equip/use/buy/bank/guild-bank/trade/mail/market commands continue through ClientWorld sends and server validation into the shared Sim bodies. Furnishing admission lives in the shared simulation, so bypassing the UI does not grant use, equip, enchant, salvage, disenchant, sunder, Perfecting, or commission capability. The UI introduces no economic outcome or placement authority. Housing placement remains outside this kind-only change.

Normal furnishing bag clicks return none and BagsWindow.runBagAction returns without dispatch. Special bank, guild-bank, mail, trade, market, and vendor modes preserve their earlier precedence. Paperdoll and hotbar drop paths reject furnishing. Direct normal/loadout/attack-bar replacement also strips it, while unknown-ID retention remains unchanged for older client bundles.

### Shared simulation and existing-kind preservation

FurnishingItemDef is a narrow ItemDef arm, excluded from OtherItemDef. Required footprint width/depth, radius, decor cost and floor surface are present; radius zero is explicitly walk-through. Inherited power, use, bag/riding, set, stacking and Masterwrought capabilities are barred.

stackSizeOf returns one before overrides for furnishing; existing capacity/grant/container paths compose it. Inventory sort inserts furnishing after tools and shifts all later ranks and defensive tails together, preserving old ordering and tie rules. isStorableItemKind is a pure type-import-only leaf whose answer for every old runtime value is exactly the previous kind-not-quest test.

Traced equipment/use, profession admission and completion, item level/score, Perfecting identity/view/synthesis, crafting, gathering/fishing/charm identity, and heroic synthesis. Crafting and signing remain allowed under the existing rarity rule without power. The heroic Set-to-Map narrowing preserves first-insertion order and synthesis inputs. No tick order, RNG site, clock, host dependency or shared state was introduced. Production synthesis callers reject furnishing before raw slot-budget helpers. No shipped content record or item ID was added.

Reliquary remains catalog-driven: src/sim/reliquary.ts onItemDiscovered at line 398 has no furnishing exclusion. The mount special case applies only to uncatalogued mount ownership, so sharing the Exchange policy bucket does not grant mount identity. The synthetic test proves item-page/catalog completion eligibility.

### Snapshots, deltas, and copy custody

A delegated read-only wire review traced generic slots and instance transport across inventory, personal bank, guild bank, trade, mail, and market. No furnishing-specific filter, signer loss, lock loss, or new delta field was found.

Relevant seams: `server/game.ts:8869`, `server/game.ts:9133`, `src/net/online.ts:3323`, `src/net/online.ts:3400`, `src/net/bank_snapshot_wire.ts:242`, and the shared strict row decoder at `src/net/vault_snapshot_wire.ts:96`. The strict decoder validates IDs/counts/provenance/bounded instance JSON, not a closed ItemKind roster. Omission and replacement semantics remain unchanged.

Instance selectors compare requests to actually owned copies; escrow/final grants use held or stored payloads, not client-minted payloads (`src/sim/item_instance_transfer.ts:107`, `:160`). Signer, copy locks, and craftedRecipeId remain in custody paths. Public market/mail projections intentionally trim private metadata without changing escrow or eventual grants.

### Exchange and World Market

exchangeItemCategory deliberately returns the existing mount policy bucket for furnishing, applying the server's allowMounts switch and all-rarity rule. Browse explicitly returns other with null subcategory. Server admission, sim extraction, Sell picker and directed-trade prefilters share the same category/hard-lock rules. BoundTo presence including zero, bind-armed, owner-locked, and noMarketList copies remain refused. Def-level soulbound tolerance is intentional.

The ordinary World Market furnishing type filter is a distinct shared query vocabulary used by authoritative browse and client chrome. Its label is localized and it has no subtype/armor/stat menus. Existing kinds retain their earlier categories. Ordinary bags remain All-only for furnishing with unchanged name search.

### Events and localization

No SimEvent variant, event route, server event, or sim/server player-text literal was added. Existing matcher-covered codes/text are reused. No missing origin-specific matcher was found.

The six new English keys are in the item and HUD chrome catalogs. Furnishing rows are pure key/value data; composition uses t, formatNumber, and the existing escaping tooltip family. Maker comes only from the supplied copy signer. HUD suppresses only the duplicate generic maker and preserves other instance information. The mount extraction preserves description, speed, summon instruction, and markup. Both pure cores are registered; HUD's ceiling is lowered to 18,703.

The exact-six-key contributor exception requires pending membership and contributor tier. It does not exempt the whole housing namespace or permit release-tier deferral. Release translation filling remains pending under the explicit English-only scope.

### Headless and Python

No action, observation, protocol field, reward, or Python binding changed. Headless uses the same Sim modules. obs.ts selects only food/drink for eat_drink, so furnishing cannot become an RL use action. Housing action exposure is already explicitly excluded by headless/CLAUDE.md; this change does not widen that exclusion. Python still queries action/observation shapes from the host and has no duplicate ItemKind roster.

## Shared evidence and limitations

Read root/applicable local guidance and `/tmp/freeholds-02-explore.md`, `-kind.md`, `-ui.md`, `-tooltip.md`, and `-architecture-review.md`.

- Latest `/tmp/freeholds-02-focused.log`: 3 files and 105 tests passed. Tests continued changing afterward, so this is not final-tree proof.
- `/tmp/freeholds-02-i18n.log`: generation/build/admin/scan completed, including translation keys and resolved tables. New English leaves are present.
- `/tmp/freeholds-02-scoped.log`: 10 files passed; market_filters.test.ts failed because its live-content nonempty-bucket census expects a shipped furnishing ID. Correct the narrow fixture/census to respect the intentional no-shipped-ID scope. This is not a runtime browse defect.
- Latest `/tmp/freeholds-02-tsc.log`: synthetic heroic armor control missing required sellValue. Coordinator is correcting fixtures; no current passing typecheck is claimed.
- UI handoff reports 329 tests across 9 files passed before the final setter extension, then 94 action-bar/hotbar tests passed after it. Tooltip handoff records its initial targeted passes. These are earlier supporting checks.
- Static architecture assessment is clean. A complete current parity golden, protocol/world-api, localization guard, and contribution-gate result was unavailable at report time. The coordinator owns final verification and a fresh review of all fixes. No suites were duplicated here.
