# Housing tooltip domain

`index.ts` exposes the furnishing tooltip model and its item-card composer.

- `furnishing_tooltip_view.ts` accepts an `ItemDef` and optional
  `ItemInstancePayload` supplied by the host. It returns only the four furnishing
  translation keys and resolved values, with no localization, markup, or DOM.
- Placement metadata is floor-only. Footprint and decor cost come from the
  furnishing definition; a maker comes only from the individual copy's signer.
- `furnishing_tooltip.ts` formats numbers through `formatNumber` and renders
  translated lines through the escaping `tooltipLine` family.
- `Hud.itemTooltip` composes the domain through the barrel and replaces only the
  generic maker mark for furnishing copies. Other instance information remains
  on the shared item-tooltip path.
- The domain reads no concrete world or renderer and owns no mutable host state.
  `tests/furnishing_tooltip_view.test.ts` pins the model and the composition seam.
