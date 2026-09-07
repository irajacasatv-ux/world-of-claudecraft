# Housing tooltip domain

`index.ts` exposes the furnishing tooltip model and its item-card composer.

- `furnishing_tooltip_view.ts` accepts an `ItemDef` and optional
  `ItemInstancePayload` supplied by the host. `FurnishingTooltipRow` defines its
  translation keys and resolved values, with no runtime imports, localization,
  markup, DOM, or Three dependencies.
- Placement metadata is floor-only. Footprint and decor cost come from the
  furnishing definition; a maker comes only from the individual copy's signer.
- `furnishing_tooltip.ts` formats numbers through `formatNumber` and renders
  translated lines through the escaping `tooltipLine` family.
- `Hud.itemTooltip` routes furnishing cards through `furnishingItemTooltip` in
  the barrel. The composer retains identity, authored quality, placement, maker,
  lock, soulbound, party-trade deadline and vendor-value facts. It never composes
  equipment, consumable, heroic, enchant, Masterwork, Perfecting or Rift claims.
- The complete card receives only `IWorld.partyTradeMsRemaining` for the
  copy's party-trade deadline. The placement model remains world-independent.
- The domain reads no concrete world or renderer and owns no mutable host state.
  `tests/furnishing_tooltip_view.test.ts` pins the model and the composition seam.
