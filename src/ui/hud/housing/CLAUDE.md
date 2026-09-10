# Housing domain

`index.ts` exposes the furnishing and Hearth Key tooltip composers, the gate
prompt controller, and Freehold event feedback.

- `furnishing_tooltip_view.ts` accepts an `ItemDef` and optional
  `ItemInstancePayload` supplied by the host. `FurnishingTooltipRow` defines its
  translation keys and resolved values, with no runtime imports, localization,
  markup, DOM, or Three dependencies.
- Placement metadata is floor-only. Footprint and decor cost come from the
  furnishing definition; a maker comes only from the individual copy's signer.
- `furnishing_tooltip.ts` formats numbers through `formatNumber` and renders
  translated lines through the escaping `tooltipLine` family.
- `hearth_key_tooltip.ts` composes the Hearth Key's own lines the same way, and
  `freehold_event_feedback.ts` maps a refusal reason to its catalog line. Both
  are BARE-NAMED pure cores, so the `_view.ts` and `_core.ts` sweep in
  `tests/architecture.test.ts` cannot find them: they are registered by hand in
  `UI_PURE_CORES` and in the `EXPECTED_BARE_NAMED` pin, and a new bare-named
  core here owes the same two rows or it gets no purity enforcement at all.
- `Hud.itemTooltip` routes furnishing cards through `furnishingItemTooltip` in
  the barrel. The composer retains identity, authored quality, placement, maker,
  lock, soulbound, party-trade deadline and vendor-value facts. It never composes
  equipment, consumable, heroic, enchant, Masterwork, Perfecting or Rift claims.
- The complete card receives only `IWorld.partyTradeMsRemaining` for the
  copy's party-trade deadline. The placement model remains world-independent.
- The tooltip models read no concrete world or renderer and own no mutable host
  state. `tests/furnishing_tooltip_view.test.ts` pins the model and composition seam.

## Gate prompt and feedback

- `housing_view.ts` is the pure decision model and the one total denial-key
  selector. It owns tab, draft, lookup identity, pending action, and control-state
  decisions without DOM or concrete-world access.
- `gate_prompt_painter.ts` composes escaped translated markup from that model.
  `gate_prompt_controller.ts` owns mutable window state and browser focus on the
  cold open, input, event, and reconnect paths. Use the shared window and tab
  helpers; add no recurring painter driver or polling loop.
- The physical gate opens a decision window. Only explicit confirmation sends
  entry. Feature-disabled worlds do not open it. Friend entry stays absent until
  the current lookup result authorizes a matching draft.
- Lookup responses and failures carry request identity. Editing clears the prior
  capability. Reconnect cancels unresolved state and closes the stale prompt;
  the hello callback precedes the first fresh snapshot and must never replay entry.
- `freehold_event_feedback.ts` resolves text-free denials through the shared key
  selector. Accepted entry is reconciled from the entity's authoritative
  `dungeonEntrySeq`, including online snapshot mirrors.
- `tests/housing_view.test.ts` and `tests/freehold_gate_prompt.test.ts` pin pure
  decisions, composition, focus, event handling, and actual reconnect ordering.
