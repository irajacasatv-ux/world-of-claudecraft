# Furnishing item kind hygiene COVERAGE audit

Review scope: original furnishing implementation `16f2aeed2b..c47e2cb245` (commits `83f847e6cb`, `b98007b01e`, `c47e2cb245`) and current source while the coordinator resolves the upstream integration. Read-only source review; no repository edits, test runs, shared gate runs, or asset generation. Planning documents were not read directly. The original validation/review records are historical evidence, not proof of this QA run.

Applied `woc-write-game-tooltips` and read the complete tooltip-writing standard. Root and applicable source/UI/HUD/housing/simulation/content/professions/tests/docs guidance were read. Parent owns independent runtime reproduction and final commands.

## Findings

### H1: furnishing copies can advertise inapplicable combat and Perfecting metadata

Severity: medium. Confidence: high. Source-confirmed; coordinator is responsible for runtime reproduction.

`Hud.itemTooltip` unconditionally composes `instanceBadgeLines(instance)`, `instanceBonusStatLines(instance)`, and the `instance.rift` readout. A narrow, valid `FurnishingItemDef` plus this valid `ItemInstancePayload` needs no type escape:

```ts
{
  signer: 'Anna',
  locked: true,
  rolled: { stats: { str: 9 }, masterwork: true },
  perfected: true,
}
```

`instanceBadgeLines` emits the Masterwork seal and Perfected badge. `activeItemInstanceStats` returns the supplied rolled stats when no enchant is present, and `instanceBonusStatLines` emits the Strength bonus. Furnishing copies cannot equip or use those bonuses; the UI therefore promises power that the item cannot provide. A rift-shaped payload likewise reaches the generic progression readout. The original furnishing tooltip suite covers signer/lock payloads but no power-bearing payload.

Resolve by retaining the furnishing's meaningful copy facts while withholding inapplicable power/progression presentation. Pin the actual composed HUD tooltip with a furnishing payload that carries these fields and a same-path eligible gear control. Preserve signer escaping, a single maker line, and the lock line.

This is a presentation finding, not a claim that these fields bypass the equip/use gate or that a legitimate furnishing producer currently creates such copies. The payload itself is structurally permitted and the tooltip accepts it directly.

### H2: housing directory contract uses a literal inventory count

Severity: low. Confidence: high.

`src/ui/hud/housing/CLAUDE.md` says the view returns "only the four furnishing translation keys". Root documentation conventions require anchors to stable files/symbols rather than counts that drift.

Replace the counted phrase with an anchor to `FurnishingTooltipRow` or the owning view module. The remaining local contract accurately describes the current separation of core/composer/barrel, copy-only maker resolution, and world independence. Update its shared-instance statement as appropriate when H1 is resolved.

### H3: unreachable furnishing entry in the unstacked-kind set

Severity: low. Confidence: high about reachability; resolution should respect the promised consumer contract.

`src/sim/bags.ts` adds furnishing to `UNSTACKED_KINDS`, but `stackSizeOf` always returns 1 for furnishing before it can call `UNSTACKED_KINDS.has(def.kind)`. The new set entry cannot affect any result. The early return is needed to reject forged `stackSize` overrides and already gives this consumer its explicit furnishing arm.

Remove the redundant set entry unless the packet specifically requires it as a declarative inventory. Keep the early return and the decisive forged-stack-size test. The coordinator stated it will remove the entry unless the packet-context audit identifies a reason to retain it.

## Confirmed hygiene and tooltip properties

- The furnishing view has exactly one import, a type-only `ItemDef`/`ItemInstancePayload` import from `src/sim/types`. Type erasure leaves an empty runtime import closure, so neither direct nor transitive DOM/Three/i18n runtime is introduced by this core.
- The furnishing composer intentionally owns `formatNumber`, `t`, and escaping `tooltipLine`. The core returns a discriminated key/values union and never markup or localized text.
- The generic `UI_PURE_CORES` guard is per-file and explicitly permits UI i18n imports. Its green result alone must not be described as proof of the furnishing-specific stronger i18n ban. The actual type-only import condition above supplies that evidence; a stronger acceptance check should inspect that condition.
- The mount tooltip extraction imports i18n, which is permitted by the generic UI-core contract and preserves the original localized mount path. It does not weaken the furnishing view's separate contract.
- The full housing output inventory inspected in authored English and tests is:
  - `hudChrome.housing.furnishing.footprint`: `Footprint: {width} by {depth} cells.`
  - `hudChrome.housing.furnishing.decorCost`: `Decor cost: {cost}.`
  - `hudChrome.housing.furnishing.surfaceFloor`: `Placed on the floor.`
  - `hudChrome.housing.furnishing.maker`: `Made by {maker}.`
- The shared kind and market labels are `itemUi.kind.furnishing` = `Furnishing` and `itemUi.market.filterTypeFurnishing` = `Furnishings`.
- Every furnishing view branch is inspected: non-furnishing returns no rows; furnishing reads dimensions/cost directly from `item.furnishing`; floor is the only admitted surface; signer produces a maker row only when the copy supplies a nonempty signer. Definition provenance cannot supply a maker. The source has no footprint, decor-cost, or maker fallback.
- Existing tests change width/depth, use a zero decor cost, change signer, reject definition signer fallback, cover unsigned copies, assert every English housing leaf, verify formatted numbers, escape hostile signer text, and preserve an ordinary item's maker attribution. This is not a two-leaf tooltip pin.
- No added unused source import/type or TODO/FIXME was found. No added code/comment or implementation commit message contains the whole word `phase`. Planning/evidence document filenames and their discussions do contain that word; those are reported separately from implementation source. Inherited upstream source mentions were not attributed to this furnishing diff.
- The added-line scan found no added em dash, en dash, or emoji in the original diff. Implementation commits have scopes and bodies.
- No `src/ui/i18n.locales/` overlay was touched by the original furnishing diff. The authored additions are English only. The six leaves appear in the generated translation union and resolved English output.
- Original implementation evidence explicitly records `npm run i18n:gen` and unchanged overlays. Diff inspection cannot independently prove the historical editing mechanism; the coordinator must retain a fresh regeneration/freshness result for this QA. Current integration regeneration was reported by the coordinator, not performed by this auditor.
- The M16 furnishing exception uses a positive conjunction: exact declared key membership AND membership in the generated locale pending list. Unknown, suffixed, unrelated, and no-longer-pending keys fail its focused controls. Existing release-tier pending enforcement remains separate.
- No shipped furnishing item ID, GLB, model, sampled sound, authored icon/image, or asset provenance file was added. The icon change uses the existing wood/earthBrown/crate procedural recipe. Screenshot captures are validation evidence. The unchanged orphan-WebP test still needs the coordinator's requested fresh run; no asset generation is appropriate in this audit.

## Limitations and disposition

The packet-context summary became available after the initial report. Its approved-English table matches every key, English value and interpolation source listed above. Its source manifest prohibits guessed footprint/radius/cost defaults, and the furnishing model introduces none. No raw planning file was read to bypass that instruction.

This report identifies three findings. The coordinator has acknowledged H1/H2 and is evaluating/removing H3. No finding is marked resolved solely from that acknowledgement. Final closure requires the complete fix round, the requested fresh reviewer, and coordinator validation evidence.
