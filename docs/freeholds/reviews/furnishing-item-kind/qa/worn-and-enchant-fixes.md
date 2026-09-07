# Worn presentation and enchant picker repairs

Implementation owner: fix_worn_presentation. Scope: Q31 and Q34. The parent owns all deterministic tests, typechecks, commits, and final acceptance.

## Q31: set and Masterwrought presentation

`itemSetMemberCounts` now excludes furnishing definitions before collecting catalog slots, and `equippedSetTooltipPieces` excludes furnishing before considering either direct set membership or a shared lineage. `wornMasterwroughtSlots` likewise excludes furnishing. `CharWindow.buildSlotRow` uses one furnishing-aware Masterwrought predicate for both its per-slot diamond and its live occupied-slot tooltip line.

Saved equipment and the full instance payload remain unchanged. Recovery controls, the authored furnishing name, and the maker line continue to render. Eligible equipment still activates the set tier, fills the cap, paints the diamond, and changes the tooltip's live count after the equipment mirror changes.

`tests/furnishing_worn_presentation.test.ts` adds seven decisive cases:

- Synthetic catalog denominator and lineage union: three eligible slots remain three beside furnishing; a fourth eligible slot increases both families to four.
- Worn set counts and tier model: one eligible piece plus furnishing remains one with an inactive two-piece tier; two eligible pieces count as two.
- Actual gear tooltip, once through Sim and once through the sanctioned bareClient mirror: furnishing cannot activate the neighboring gear's tier; replacing it with armor activates the tier and updates the header.
- Masterwrought count, cap readout, and at-cap tooltip: furnishing does not occupy a slot, while eligible armor does.
- Actual CharWindow DOM and lazy hover, once through Sim and once through bareClient: furnishing retains its row and maker without a diamond or Masterwrought claim; gear controls paint both and update live counts.

The DOM fixture keeps real item-name/row/tooltip composition and the real image URL resolver. It registers test-only image IDs for synthetic items and the empty-slot icon. It stubs unrelated class-crest image decoding and character-preview loading because happy-dom has no rendering canvas. No asset file is created or changed.

Parent-observed test-first evidence: `late-worn-red.log` identified the count defects, while initial DOM fixture failures were corrected separately. `late-paperdoll-red.log` then recorded two decisive paperdoll diamond failures, one per host, with 17 other cases passing. Only after that result did the parent authorize the final CharWindow predicate patch.

## Q34: enchant target previews

The existing authoritative `enchantTargetsItem` predicate is now exported from `src/sim/professions/enchanting.ts`; its behavior is unchanged. Both `enchantTargets` and `wornEnchantTargets` reuse it in place of their slot-only comparison. The first-step `perfectedMet` field already delegates to those target builders and now inherits the same furnishing refusal.

`tests/furnishing_enchant_picker.test.ts` adds twelve decisive cases. The bag and worn families each refuse synthetic furnishing with a forged chest slot, both for plain signed and already-enchanted replacement copies, and under synced and unsynced viewer mirrors. The same calls return complete expected rows for eligible armor. Four further cases prove that neither a bagged nor a worn furnishing carrying a forged Perfected marker satisfies the first-step requirement, while the corresponding armor does. Source inventory, equipment, and copy payloads are checked unchanged.

Parent-observed test-first evidence: `late-worn-picker-red.log` recorded all twelve picker defects. The intermediate parent run, `late-worn-picker-intermediate.log`, passed all twelve after the shared predicate was wired.

## Validation handoff

No test or typecheck was executed by this worker. The parent runs the final combined suite and typecheck against the finished patch. Formatting ran successfully over these seven explicit paths:

```sh
npx @biomejs/biome format --write src/ui/char_window.ts src/ui/item_set_tooltip_view.ts src/ui/masterwrought_cap_view.ts src/sim/professions/enchanting.ts src/ui/hud/professions/enchant_apply_view.ts tests/furnishing_worn_presentation.test.ts tests/furnishing_enchant_picker.test.ts
```

Result: exit 0, seven files checked, no further formatting changes. No staging, commit, push, generated-file edit, locale overlay edit, or asset generation was performed. Both findings are implemented; final execution and independent review remain the parent's acceptance responsibility.
