# Furnishing item kind correctness audit

Scope: original feature diff `16f2aeed2b..c47e2cb245`, read against the packet worktree during the merge of `d3dcdaa4af`. No repository edits, assets, gate, or TypeScript validation were performed by this reviewer. Root owns the shared validation runs. Temporary executable probes live beside this report.

Coverage posture: every issue is reported, including defensive paths and overlapping test gaps. This is an initial audit, not a finishing PASS.

## Findings

| ID | Severity / confidence | Finding | Evidence and required resolution |
| --- | --- | --- | --- |
| C1 | High / confirmed by executed probe | Furnishings restored in equipment slots can contribute combat power. A completely type-valid furnishing and instance can grant `rolled.stats`; malformed authored capabilities also grant weapon DPS and item-set bonuses. | `Sim.addPlayer` copies saved equipment without kind admission and preserves non-rift instance stats. `entity.recalcPlayerStats` loops any resolved item and adds base fields, instance stats and `set` counts. Its mainhand weapon/readout also tests `.weapon` without a kind boundary. Separately, `set_bonus_mods.wornSetCounts` counts every item's `.set`. Filter furnishings at all three live power projections while preserving saved inventory/equipment copies. Add a load-through regression and normal-gear controls. |
| C2 | Medium / high | The shared HUD item tooltip still renders unsupported heroic and power metadata on furnishings. The furnishing leaf is correct, but shared branches are not uniformly kind-safe. | `Hud.itemTooltip` adds `[HEROIC]` directly for `.heroic`/`.heroicOf`, although `market_armor_badge.isHeroicItem` deliberately returns false for furnishings. Both heroic fields are inherited and type-valid. The HUD also emits `instanceBadgeLines`, `instanceBonusStatLines`, rift socket/upgrade rows, and malformed def stat/weapon/consumable/set branches without a furnishing boundary. A type-valid furnishing instance with `rolled.stats.str=50` therefore advertises an enchant benefit; a forged `perfected` copy advertises the expressly refused Perfecting path. Route the entire furnishing card through honest placement, copy signer/lock/trade facts, rarity and vendor value only. Keep source metadata unchanged; do not fabricate dimensions/cost or silently lose signer/lock lines. Add full-HUD assertions for hostile metadata and normal gear controls. |
| C3 | Medium / confirmed coverage gap | The claim of offline and ClientWorld parity is stronger than the checked furnishing tests. | `tests/furnishing_item_kind.test.ts` constructs only `Sim`; the test named `has no Perfecting view over either host mirror` invokes `perfectingInfoFrom` once with hand-built inputs. A pure helper used by both hosts is sound architecture but does not prove real ClientWorld field/wrapper wiring. Exercise real ClientWorld reads and command forwarding with synthetic furnishing state, compare the server/shared Sim result with offline behavior, and assert no client-authoritative mutation. Shared tests must cover each client-visible gate required by the packet. |
| C4 | Medium / confirmed source gap, merge fix in progress | Full-HUD composition test fixtures were invalid after the base merge. | `composedTooltip` constructed `Object.create(Hud.prototype)` with no `sim`; the live itemTooltip evaluates `this.sim.player.level`. The parent dispatched `merge_ui`, which reports a real Sim fixture and established portrait mocks now added. Required status: parent scoped suite proves the corrected fixture executes the assertions. This is a merge reconciliation finding, not a second furnishing production bug. |
| C5 | Low / high, overlaps test audit | Durable compile-time trap pin does not presently assign the invalid def to the broad `ItemDef` union. | Existing negative assignments target `FurnishingItemDef` and a source regex checks OtherItemDef's Exclude spelling. The decisive runtime compiler probe must assign `{...FURNISHING,use:{type:'hearth'}}` to `ItemDef`: only that tests whether another union arm silently accepts it. Root was sent this exact proposal and owns the scratch tsc run. Prefer retaining an `@ts-expect-error` union assignment as the durable regression too. |

| C6 | Low / confirmed by executed probe | A furnishing restored in equipment participates in gear uniqueness and Masterwrought caps. | `isUniqueEquipped` returns true for legendary furnishing, and type-valid heroicOf can alias a real legendary family; `uniqueEquipConflictSlot` then reports that furnishing slot as a gear conflict. With malformed masterwrought data, `masterwroughtConflictSlot` counts furnishings toward the cap. Exclude furnishings from incoming and worn counted-gear policies; preserve valid gear controls and saved copies. |

## Executed C1 proof

Temporary source: `/tmp/freeholds-02-audit/equipment-probe.ts`.

Commands run successfully (exit 0):

```text
node_modules/.bin/esbuild /tmp/freeholds-02-audit/equipment-probe.ts --bundle --platform=node --format=esm --outfile=/tmp/freeholds-02-audit/equipment-probe.mjs
node /tmp/freeholds-02-audit/equipment-probe.mjs
```

Observed output:

```json
{"plainStrength":23,"loadedStrength":73,"loadedEquipment":{"helmet":"correctness_furnishing_probe"},"loadedInstance":{"helmet":{"rolled":{"stats":{"str":50}}}}}
{"armedWeapon":{"min":100,"max":200,"speed":1},"mainhandItemId":"correctness_furnishing_probe"}
{"setId":"slagbreaker","pieces":2,"counts":{"slagbreaker":2},"activeFlag":true}
{"furnishingProcRngDraws":0,"aurasUnchanged":true}
{"furnishingUnique":true,"furnishingGearConflict":"chest"}
{"furnishingMasterwroughtConflict":{"slot":"chest","reason":"cap"}}
```

The final line is a passing control for an already-safe seam: `runWeaponProcs` rejects `item.kind !== 'weapon'` before BOTH authored weapon procs and the per-hand enchant proc, so no furnishing-specific implementation change is needed there. A decisive fixture should nevertheless retain this proof plus a real weapon that rolls/applies successfully.

## Correctness matrix

| Surface | Result from code/test inspection | Required final evidence |
| --- | --- | --- |
| `FurnishingItemDef` | Kind is narrow. `furnishing` payload requires footprint width/depth, `r`, decorCost, and floor surface. `r:0` permitted. plinth optional. Power, use, feast, stacking and bag fields barred with optional never. | Root scratch tsc rejection of ItemDef union with use, and missing r; full `npx tsc --noEmit`. |
| `OtherItemDef` | Exclude explicitly includes furnishing. No silent fallback observed. | C5 durable union pin / scratch proof. |
| Exhaustive records | `inventory_sort.KIND_RANK` and `item_kind_label.ITEM_KIND_LABEL_KEYS` both have furnishing arms. Rank is after tool, before mount; every earlier kind retains relative order, defensive tails remain distinct. | Scoped sort/kind-label tests. |
| Equip and use command gates | `items.equipItem` and `items.useItem` reject furnishing before copy selection/effects/removal; equipment eligibility/drop helpers also reject malformed furnishing slot data. | Existing negative tests plus eligible-kind controls and C1 loaded-state regressions. |
| Disenchant / salvage / sunder | Positive gear kind allowlists refuse; explicit furnishing arms agree. Resolver/admission gates precede removal/rng. | Existing reason pins; eligible controls needed per coverage audit. |
| Enchant | Shared `enchantTargetsItem` denies furnishings even with malformed slot; both resolver and admission use it before mutation. Prior learned/perfected rungs can choose an earlier reason, consistently and mutation-free. | Both bagged and worn/replace paths, eligible controls. |
| Perfecting and commission | Furnishing checks cover apex recipe/view/shared attempt head, commission kind and stat bonus. Merge relocated bonus helper to `perfecting_bonus.ts`; parent confirmed furnishing guard preserved there. | Root merge/suite validation and actual ClientWorld read parity. |
| Craft | Furnishing bonus null, rare-or-better signer doctrine preserved, and forced masterwork outcome cannot grant Perfecting head start. No furnishing definitions shipped. | Existing exact inventory/reagent/rng pins. |
| Item-level/budget | Furnishing has no item-level eligibility, expected budget, multiplier or score. | Existing decisive outputs. |
| Gathering/fishing/charm use | Guarded against malformed `.use`; tool-effect consumption candidate walk excludes furnishing. | Existing negatives plus eligible controls. |
| Personal bank | Shared storable-kind predicate permits furnishing and still denies quest; existing signed-copy deposit and withdrawal tests preserve payload. | Parent run. |
| Guild bank | Shared storable predicate, soulbound/noMarketList and per-copy locks preserve previous policy in both directions. Existing roundtrip tests cover furnishing and quest refusals. | Parent run. |
| Mail | Kind admission permits furnishing and rejects quest/no-list before postage/escrow; signed furnishing send/delivery/take test exists. | Parent run. |
| Trade and market | Furnishing can enter both ordinary and signed-copy paths; original quest/per-copy locks remain. Direct named trade still binds armed copies by existing policy. | Parent run; ClientWorld command test coverage. |
| Exchange D25 | furnishing maps to eligibility bucket mount, so all rarities and def-level soulbound tolerance match mount; allowMounts remains the policy switch. noMarketList/locked/bound/bindOnTrade remain refused. Browse identity is other, no riding subcategory. No decision reopening found. | Existing pure and policy tests plus parent gate. |
| Bag vs market filters | Ordinary bag categories remain All-only; marketItemMatches explicitly admits its furnishing chip and keeps search/rarity. | Existing exported filter tests. |
| Action bar | Assignment, replacements, loadout, attack action and persisted action sanitization refuse furnishing. Normal bag click returns none while storage/trade modes stay reachable. | Existing full handler tests, positive controls and parent run. |
| Tooltip leaf | Type-only sim import. Returns exactly four key variants with resolved source footprint/cost, floor text and copy signer only. No markup, i18n runtime, DOM, Three or world object. No geometry/cost invention found. | Full leaf tests, architecture guard, i18n gen/freshness. C2 concerns shared card branches. |

## Recommended C1 implementation boundary

Preserve `CharacterState`, stored equipment and copy metadata. Do not delete or move persisted copies. Guard the existing live projections:

1. Before base stats, instance stats and set membership in `recalcPlayerStats`.
2. Before mainhand weapon/DPS/model identity derives from `.weapon`.
3. In `wornSetCounts`, so talent-engine set flags cannot bypass the stat loop's guard.

The existing positive equipment/ItemLevel predicate may serve as a shared boundary if preserving all old valid gear semantics is established; a small pure equipment-kind leaf is another option. Offhand weapon, shield abilities, two-hand mastery, authored weapon procs and per-hand enchant procs already use positive kind predicates and require no blanket refactor.

Required tests: load a serialized furnishing equipped with instance stats and compare every combat projection against a blank-equipment control; verify raw saved copy associations/payload remain unchanged. Repeat with malformed base weapon/stats/set/rating data, and prove eligible real equipment and its enchant/set controls still affect power. The pure helper controls must run as well as the load-through test.

## Status and counts

Initial audit result: FIXES REQUIRED. Six report entries: three production correctness findings, two test/evidence gaps, and one merge fixture reconciliation already assigned. Counts overlap other auditors and must be deduplicated by root. This reviewer has not read the final fix round and does not grant a PASS. Parent must reconcile merge state, finish all scoped/shared checks, resolve every entry, and obtain the fresh reviewer report.
