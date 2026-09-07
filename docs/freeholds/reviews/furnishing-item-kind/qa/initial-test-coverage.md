# Furnishing test coverage audit

Verdict: changes required. This is the initial coverage review, not a completion gate.

Scope: original furnishing implementation `16f2aeed2b..c47e2cb245`, with current source checked while the coordinator integrates `d3dcdaa4af`. Root, tests, sim, UI, HUD, housing and relevant profession contracts were read. Planning promises came from the packet-context explorer's summary, not direct planning-document reads. The complete original assertion inventory is `/tmp/freeholds-02-audit/added-test-assertions.md`.

## Behavior claims and decisive evidence

| Claim | Evidence | Verdict |
|---|---|---|
| Narrow furnishing type requires footprint width/depth, collision radius, decor cost and floor surface, and forbids power fields | `tests/furnishing_item_kind.test.ts:217` uses compiler errors; `:244` maps required fields to literal `true` and forbidden fields to `never`; the `r: 0` value is literal-pinned | Covered with full tsc, with C6 caveat |
| OtherItemDef cannot silently swallow furnishing | `tests/furnishing_item_kind.test.ts:320` scans the exact Exclude arm | Structural coverage; add the valid ItemDef assignment in C6 |
| No shipping furnishing id | `tests/furnishing_item_kind.test.ts:327` expects the entire furnishing catalog to equal only the injected test id; shared fixture is `tests/fixtures/furnishing_item.ts:4` | Covered |
| Both exhaustive kind records remain complete | Record types plus repository tsc; label exercised at `tests/furnishing_item_kind.test.ts:1304`, rank through real comparator at `:346` | Covered when tsc passes |
| Single-copy bags, even with malformed stack override | `tests/furnishing_item_kind.test.ts:334` expects two exact slots after addItem(2); `:343` expects literal 1 with stackSize 20 | Covered |
| Rank immediately follows tool and all existing kinds keep relative order | `tests/furnishing_item_kind.test.ts:346` sorts a reversed input through compareBagStacks and expects a locally literal complete order | Covered, no exported-constant self-comparison |
| No equipment eligibility, slot resolution, or equip mutation | Literal false/null at `tests/furnishing_item_kind.test.ts:379`, `:394`, `:397`; serialized state equality at `:401` | Partial: C1, C3, C4 |
| No item use effects or consumption | Real Sim.useItem at `tests/furnishing_item_kind.test.ts:407`; undefined, no emitted event and serialized before/after equality | Partial: C3, C5 |
| Disenchant and salvage refuse both admission and resolve | Exact `not_disenchantable` / `not_salvageable` results at `tests/furnishing_item_kind.test.ts:419`, `:429`, `:441`, `:451`; resolver no-mutation/RNG checks | Partial: C3; admission cases do not use the no-mutation helper |
| Sundering and Perfecting refuse before effects | Literal errors at `tests/furnishing_item_kind.test.ts:460`, `:468`; no cast for sundering, no state/RNG mutation | Partial: C2, C3, C5 |
| Perfecting read agrees through both worlds | `tests/furnishing_item_kind.test.ts:477` only calls perfectingInfoFrom once using Sim inventory | Uncovered host claim: C2 |
| Enchant refusal applies to the public entry's bagged, worn and replacement shapes | Exact wrong_slot at `tests/furnishing_item_kind.test.ts:494`, `:509` with forged slot | Partial: only plain bagged shape; C3. Current shared guard is before worn/replace dispatch, so no code bypass is alleged |
| Heroic/apex crafting identity and Perfecting stat bonus cannot grant power | `tests/furnishing_item_kind.test.ts:490`, `:525`, `:549` use forged power fields; heroic and apex tests include eligible controls | Covered for these helpers |
| Commission/unbinding cannot grant or remove bonds | Literal false and `unbind_not_eligible` at `tests/furnishing_item_kind.test.ts:556`, `:560` | Partial: C3 |
| Crafting still signs correct rarity and never grants stat/proc bonus | Exact output at `tests/furnishing_item_kind.test.ts:586`, forced RNG cases at `:666`; recipe lookup is mocked only as dependency, not the unit under test | Covered for normal/Jack success and five named qualities; poor-quality signer boundary absent |
| No level, score, stat budget, or gathering capabilities | Literal undefined/0/false at `tests/furnishing_item_kind.test.ts:597` through `:665`; forged gatherTool/toolEffect inputs for key tool arms | Partial: C3, C4; fishing legacy `use.type: fishing` alternative lacks an independent furnishing negative |
| Vendor count, payment, riding-service exclusion and full-bag atomicity | `tests/furnishing_item_kind.test.ts:714` exact inventory/copper/honor/RNG; `:745` rejects two copies then buys one using same entry | Covered |
| Personal bank and guild bank accept both directions and preserve copy data | `tests/furnishing_item_kind.test.ts:830`, `:847`, `:1050` through `:1118` expect exact source/destination contents; independent lock rows and quest controls | Covered offline; C2 for client-visible behavior |
| Mail, trade and market preserve copy identity and enforce independent locks | `tests/furnishing_item_kind.test.ts:874`, `:907`, `:929`, `:994`; literal reasons, postage and escrow snapshots; `:1147` sends, waits and collects signed copy; `:1185`/`:1196` list and reclaim | Covered offline; C2 for client-visible behavior |
| Reliquary counts discovery idempotently | `tests/furnishing_item_kind.test.ts:1221` checks second copy does not increment set size and literal complete/incomplete totals | Covered |
| Exchange follows mount rule, no quality floor, configurable mount eligibility and hard locks | `tests/furnishing_item_kind.test.ts:1254` through `:1298`: every quality and omitted quality; allowMounts false; separate bound, armed, locked, no-list reasons | Covered helper/server-rule level |
| Market furnishing chip drives actual exported matcher, ordinary bags remain All-only | `tests/furnishing_item_kind.test.ts:1307` expects exactly furnishing; `:1323` independent search/rarity negatives; `:1350` expects exactly All and literal category set. `tests/market_filters.test.ts:204` runs marketItemMatches over injected fixture and every chip; it reaches private itemMatchesType | Covered |
| Icon fallback, color and badges preserve furnishing identity | Literal crate/background/palette and rarity effects at `tests/furnishing_item_kind.test.ts:1374`; all literal name colors at `:1428`; badges at `:1449` onward | Covered. New entry in item_name_color uses exported map, but independent literal sweep supplies the missing pin |
| Ordinary bag click, context actions and paperdoll refusal | Literal none/empty/lock/blockedSlot and a recording fake at `tests/furnishing_item_kind.test.ts:1386` onward | Partial: C3 controls; the fake does not replace bagItemAction or runBagAction |
| Persisted/assigned/live-dropped furnishing bar actions are removed/refused without moving valid actions | `tests/furnishing_item_kind.test.ts:1487` onward; `tests/furnishing_tooltip_view.test.ts:217` drives real HUD listeners for four drag paths, asserts storage/layout/settings unchanged, then accepts mount with the same listeners | Covered main behavior; C3 for direct replacement controls |
| All approved tooltip keys, English strings, values and branches | `tests/furnishing_tooltip_view.test.ts:42` through `:143`: footprint/decorCost/surfaceFloor/maker, changed dimensions, zero cost, two makers, absent/empty signer, def-vs-copy provenance, every other current kind silent | Covered; no false two-leaf pin |
| Tooltip numeric formatting, escaping and shared instance line integration | `tests/furnishing_tooltip_view.test.ts:146` exact grouped HTML, `:163` escaping, `:169` one maker plus lock; mount/crafted/gathered preservation at `:182` onward | Covered intended assertions, but initial merge execution failed until fixture repaired; C1 shared loaded-power/projection coverage |
| Pure tooltip core never imports DOM, Three or i18n runtime | UI_PURE_CORES registration and architecture scanner | Partial: C7, i18n import is deliberately allowed by general UI guard |
| No orphan committed item WebP | Original furnishing diff leaves `tests/item_icons.test.ts` untouched; `:386` iterates every WebP, checks all three registries, and expects literal empty orphan list | Covered |
| Housing contributor exemption is narrow and positive | `tests/i18n_completeness.test.ts:104` uses exact-set membership AND pending membership; tests independently refuse undeclared key and non-pending declared key | Covered; not a broad prefix exemption |
| Determinism | `tests/furnishing_item_kind.test.ts:1008` runs the real craft/store/refuse sequence twice and compares state, events and next RNG draw | Covered shared Sim replay; does not substitute for host coverage |

## Findings, all severities

### C1: Loaded/equipped furnishings can still contribute power, with no regression test

- Severity: high. Confidence: high.
- Locations: `tests/furnishing_item_kind.test.ts:401`; `src/sim/entity.ts:365`; `src/sim/set_bonus_mods.ts:34`.
- The sweep proves fresh equip refusal only. It never deserializes a furnishing already present in equipment, never passes its ItemInstancePayload through real derived-stat calculation, and never exercises equipped weapon/set/proc consumers. The correctness auditor supplied a concrete probe, `/tmp/freeholds-02-audit/equipment-probe.ts`, for loaded rolled.stats, forged weapon damage and forged set membership. Source inspection confirms the stat and set loops consume those fields without furnishing refusal.
- Required proof: reload saved furnishing equipment carrying rolled stats; pin no stat/weapon/set/proc changes, no RNG draw, no inventory mutation, and positive same-entry valid equipment controls. Independently test definition-power and instance-power inputs. Include the shared tooltip instance projection so a powerless furnishing does not advertise forged bonuses. The coordinator owns the correctness fix and dedicated tests for this finding.

### C2: Claimed host parity is not exercised

- Severity: medium. Confidence: high.
- Location: `tests/furnishing_item_kind.test.ts:477`.
- No furnishing suite constructs ClientWorld or applies a snapshot. The test named "either host mirror" supplies only one Sim-derived input to the shared helper. A broken ClientWorld wrapper or snapshot projection remains green. Shared Sim determinism says nothing about that wrapper.
- Required proof: use bareClient/applySnapshot and the real IWorld read/command paths for every client-visible changed gate, including Perfecting read, equip/use refusal outcomes, bag/bank/mail/guild-bank representation and market filtering. Keep authoritative server outcomes distinct from the client's command-emission behavior. Shared-Sim/headless coverage should prove the same furnishing trace under the applicable host setup rather than relabeling a second helper call.

### C3: Refusal coverage lacks paired eligible controls and complete call shapes

- Severity: medium. Confidence: high.
- Locations: `tests/furnishing_item_kind.test.ts:379` through `:665`, `:1386` through `:1506`.
- The focused sweep has negative-only equip/use, direct slot predicates, disenchant/salvage admission+resolve, sundering, Perfecting, enchant admission+resolve, commission/unbind, budget/scoring, charm and several UI/controller tests. The settled QA requirement specifically demands an eligible-kind success using the same call. A dead fixture or overbroad refusal can satisfy the current local negative.
- Existing independent controls do exist: `tests/items.test.ts:71` and `:184`; `tests/professions_enchanting.test.ts:136`; `tests/professions_admission_drift.test.ts:140` and `:200`; `tests/craft_from_vault.test.ts:1546`; `tests/professions_commissions.test.ts:631`. These mean the repository does not universally lack positive coverage, but they do not fulfill the requested paired furnishing sweep.
- Add table-driven paired negatives and eligible controls. Include worn and replacement enchant call shapes for both admission and resolve; legacy fishing and gatherTool-fishing alternatives; all bar replacement APIs. Admission refusals also need before/after state checks. Poor-quality and omitted-quality signer boundaries should be pinned when completing the rarity table. Live HUD drop tests already have correct same-listener mount controls and need no duplicate test.

### C4: Several new helper guards are not meaningfully pinned

- Severity: medium. Confidence: high.
- Locations: `tests/furnishing_item_kind.test.ts:394`, `:397`, `:612`, `:615`.
- resolveEquipSlot/slotAcceptsItem receive the valid furnishing fixture, which has no slot; deleting their new furnishing guards still produces null/false through old fallback behavior. primaryStatSum/itemScore receive no stats or weapon, so deleting their furnishing guards still returns zero. The primaryStatBudget smoke test at `:609` passes an absent slot, rather than exercising a furnishing-specific decision.
- Use independently forged slot, primary stats, armor and weapon inputs where those fields would yield a positive result on the prior implementation; pair with eligible-kind controls. The existing malformed top-level equip test does not rescue the direct helpers because equipItem has its own early kind rejection.

### C5: The no-effect assertion omits transient gameplay state and combines malformed fields

- Severity: medium. Confidence: high.
- Locations: `tests/furnishing_item_kind.test.ts:182`, `:407`.
- expectNoMutation compares only serializeCharacter and RNG. Ordinary auras, active cast/consuming state, cooldowns and related transient fields are absent from that save. A use handler that silently sets a buff or cast without consuming a copy could satisfy "grants no effect." The one forged use case combines invalid `use.type: hearth`, potionHp and a malformed feast; one refusal/error branch can hide missing independent protection for the others.
- Compare explicit relevant transient fields, plus inventory/instance/currency and RNG. Use valid independent forged use discriminants such as fishing, and independently exercise consumable/feast fields with real same-call eligible controls. Pin the furnishing on an existing bar slot at the activation boundary as well as assignment/cleanup.

### C6: The compile-time use example can fail for the wrong reason

- Severity: low. Confidence: high.
- Location: `tests/furnishing_item_kind.test.ts:233`.
- `{ type: 'hearth' }` is not a valid ItemUse discriminant, so the @ts-expect-error remains satisfied if use becomes allowed but still type-checked as ItemUse. The mapped `use: never` assertion provides separate narrow-type protection, and the OtherItemDef source scan provides structural protection, but this individual compiler-negative example does not prove its title.
- Change the negative to a valid ItemUse (`{ type: 'fishing' }`) and assign the malformed literal to the broad ItemDef union as well as FurnishingItemDef. Keep a valid furnishing control. The parent has already run a decisive scratch broad-union compiler rejection; make that proof durable in the suite.

### C7: Housing's stricter no-i18n-runtime import rule lacks a guard

- Severity: low. Confidence: high.
- Locations: `tests/architecture.test.ts:36`, `:1738`; `src/ui/hud/housing/furnishing_tooltip_view.ts:1`.
- Current housing core is correctly type-import-only. However, the general UI_PURE_CORES scanner expressly permits sibling i18n imports, so its registration cannot prove the narrower housing contract. Importing the i18n runtime into this core would not fail that architecture assertion.
- Add a focused import invariant for the furnishing core, preferably parsed import/type-import checks rather than an English substring scan, and drive the guard with a violating fixture if a generic helper is introduced.

## Test result evidence and review limits

- No suite was executed by this auditor, per coordinator instructions to run shared commands once.
- Inspected `/tmp/freeholds-02-audit/scoped-initial.log`: 11 files, 10 passed / 1 failed; 443 tests, 439 passed / 4 failed. Four HUD tooltip composition tests failed because composedTooltip lacked `sim.player`, required by the merged itemTooltip path. The UI merge worker reports that fixture repaired; a fresh successful run remains required. The log does not record the invoking command, so no command is invented here.
- No added `.only`, `.skip`, `.todo`, weakened/deleted assertions or mocked implementation of the unit under test was found in the original test diff. The recipe lookup mock supplies a fixture; RNG stubs force real craft outcomes and pin draw counts.
- No added constant self-comparison found. Local expected fixture/order tables are independent of implementation exports. The old item-name map assertions are supplemented by literal furnishing color pins.
- All seven finding groups above require resolution and fresh complete fix review before PASS. This report intentionally distinguishes missing regression proof from code correctness; C1 is independently reproduced, while C2 through C7 are coverage defects or nits.
