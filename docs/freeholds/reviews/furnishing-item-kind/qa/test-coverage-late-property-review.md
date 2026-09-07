# Late property-consumer review

Source baseline: `ce0e25ec85`. This report withdraws the earlier overall test/census PASS until the late findings are resolved and the final source and tests receive independent review. No source or test was modified, and no validation command was run by this reviewer. The coordinator's full gate on the sealed baseline and later reruns are separate required evidence.

## Confirmed uncovered behavior

### TC-F2: Enchant pickers admit a furnishing with forbidden slot metadata

- Severity: medium; confidence: high.
- Sites: `src/ui/hud/professions/enchant_apply_view.ts:727` (`enchantTargets`) and `:860` (`wornEnchantTargets`). Authority: `src/sim/professions/enchanting.ts:1289` (`enchantTargetsItem`).
- Claim: every client-visible eligibility gate agrees with the furnishing refusal, and no furnishing copy is presented as enchantable equipment.
- Current behavior: both UI candidate builders admit any definition whose `slot` equals the enchant's `itemSlot`. The authoritative helper explicitly refuses `kind === 'furnishing'` before comparing slots. Supplying a synthetic furnishing with a forged `slot: 'chest'` therefore creates an enabled plain target; supplying valid enchant or bare rolled-stat metadata creates a replace target and can display raw Masterwork/Perfecting preservation claims. The same mismatch exists for a furnishing already present in the decoded worn mirror.
- Existing coverage is partial: a well-typed furnishing has no slot, so an empty candidate list passes even without a furnishing kind predicate. That test cannot detect this omission.
- Required decisive regression: independently poison only the furnishing's slot to match a real enchant, exercise both bagged and worn builders, and cover plain and replace copies. Assert no target rows and no mutation. Through the same calls, an eligible armor fixture with the same slot must produce a concrete target row. The gate should share the authoritative item eligibility predicate rather than reproduce another slot-only test.

### Q27 and Q28: Earlier reports missed property-driven consumers

The parent owns these findings and worker assignments; they are not new duplicates in this review's count.

| Claim | Sealed-baseline omission | Decisive coverage required |
|---|---|---|
| Exchange listing and wallet description preserve authored furnishing quality/identity without power claims. | `server/woc_market.ts:1715` stores raw `instance.rolled.quality`; `server/woc_market_stepup.ts:200` onward builds Masterwork/enchant/Rift/customized descriptors from raw metadata. | Actual authoritative listing and wallet-description paths with independently poisoned power fields; literal authored quality and absence of each unsupported descriptor; same-call equipment controls retain supported copy facts. |
| A furnishing cannot acquire Rift upgrade, enchant, or socket power and cannot spend their reagents. | `src/sim/rift/progression.ts:455` admits any matching inventory copy with `.instance.rift`, without checking its item kind. All three real forge actions mutate through this choke point. | Each action through real offline and ClientWorld/server routes; both explicit selected slot and omitted-slot selection; exact `not_rift_gear`, complete before/after copy and resource equality, no RNG/wire mutation; actual Rift gear succeeds through the same call. An omitted-slot case should include a real Rift copy beside the furnishing so refusal cannot silently retarget. |

## Additional observations requiring explicit disposition

These are lower-confidence scope observations, not claims that an external command currently bypasses the existing guard.

1. `src/sim/professions/feast.ts:250` (`placeFeastAction`) accepts a forged furnishing `feast` property if called directly with its item ID. The current reachable host routes are bounded: non-default IDs arrive only from `useItem`, which now refuses furnishing before the feast branch; legacy `place_feast` has no item-ID argument and resolves the fixed party-feast ID. Consequently this does not establish a current user-command bypass. If the acceptance contract demands the exported action body itself be total against a furnishing definition, add a direct core refusal test and a kind predicate. Otherwise record the positive caller boundary as its untouched-by-design reason.
2. `src/sim/deeds.ts:742` (`markItemDiscovered`) still uses raw rolled quality and traverses raw `heroicOf` at `:746`. A furnishing with legendary rolled quality can earn a legendary discovery mark at acquisition, load seeding, or buyback; a forged heroic alias can discover the unrelated base ID. This affects cosmetic discovery/renown, not combat power. There is no furnishing-specific decisive test. The parent should explicitly determine whether the approved authored-only furnishing quality/identity rule includes discovery credit; if it does, cover raw quality and heroic alias independently with ordinary gear controls.

## Adjacent routes inspected and bounded

| Route | Result | Reason |
|---|---|---|
| Battlefield Experience raw rolled-quality read | No additional reachable furnishing power route | The only production caller is inside `useItem`'s positive potion arm, after the furnishing refusal. A direct def-free attribution helper does not authorize item use. |
| Perfecting candidate, chosen-name, and swap preview projections | Addressed by existing gates | Candidate enumeration calls `craftForApexItem`, which refuses furnishing, and then the real `perfectingInfo`; swap admission independently refuses furnishing on both copy sides. |
| Unbind picker | Addressed by existing shared predicate | `buildUnbindView` calls `isCommissionEligible` before adding a row or pricing it. |
| Disenchant preview | Addressed by existing shared predicate | `disenchantYieldPreview` calls `isDisenchantable` before primary or typed-secondary yield. |
| Salvage raw Rift yield | Addressed by existing shared predicate | Both admission and resolve call `isSalvageable` before raw Rift metadata selects an essence payout. |
| Auto-equip, PBE equipment kits, fresh-level gear kits | No new furnishing admission | `maybeAutoEquip` calls `canEquipItem`; PBE/fresh-level pools positively require weapon, armor, or held-offhand kind before scoring raw stats. |
| Weapon and enchant procs | Addressed by positive weapon predicate | `runWeaponProcs` returns unless the resolved definition is a weapon before either authored procs or per-hand enchant metadata. |
| Hotbar placement and input | Addressed by explicit furnishing predicate | `isHotbarItemId` refuses furnishing before raw `use` checks; prior actual keyboard/crossbar tests exercise the press-time refusal. |
| Mobile station item use | No new furnishing admission | The item-specific station command is called only from guarded `useItem`; the separate developer/skill command takes a craft ID, not a furnishing item. |
| Gathering tier, fishing implement, charm consumption | Addressed by explicit furnishing predicates | `gatherToolTier`, `hasFishingImplement`, and `charmIndexToConsume` refuse furnishing before raw `use` metadata. |
| Market filters and Exchange categories | Addressed by leading furnishing branches | Furnishing takes its explicit market filter and mount eligibility/other browse bucket before slot, chroma, weapon, or stats checks. Q27 remains separate for listing quality and descriptions. |
| Saved Rift instance sanitization | Existing positive shell registry boundary | `sanitizeRiftGearInstance` rebuilds only one of the three authored Rift shell IDs; an ordinary synthetic furnishing ID returns null before any rebuilt stats. It does not repair the live forge admission omission in Q28. |
| Item instance destruction confirmation | Conservative custody behavior, not power admission | Raw special-copy markers cause an extra destructive confirmation; they do not equip, consume, or grant stats. |
| Rift normal/heroic loot pools | No reachable power action | Slot checks enumerate catalog loot payouts. A malformed authored furnishing slot could enter a gear-labelled loot pool, but it still grants only the item copy and guarded equip/use consumers deny power; no new live per-copy command gate is established here. |

All 77 supplied final literal census additions are classified in `/tmp/freeholds-02-audit/consumer-census-final-classification.md`: 15 touched and 62 untouched by design. Zero rows in that literal list are missed; the confirmed omissions above are outside that list and prevent an overall PASS.
