// The ONE tooltip line builder the item-card string builders share (the
// gathering-tool card, the tool-effect charm card, the mobile-station card and
// the recipe-pattern card). Four byte-identical private copies had formed, one
// per builder, which is past the repo's rule of three, so the markup and its
// escaping live here once instead.
//
// Emit-only and DOM-free (a registered UI_PURE_CORES module): it returns the
// exact `<div class="...">escaped text</div>` string every copy returned, so
// the collapse changed no rendered byte on any of the four surfaces
// (tests/tooltip_line_core.test.ts pins all four builders' output verbatim).
//
// The class union is the FAMILY's, not any one builder's: each private copy
// carried only the subset its own file happened to use, and folding them puts
// the four line roles in one place (tt-sub a secondary line, tt-desc a body
// line, tt-green a benefit, tt-red an unmet gate or a refusal). A builder that
// needs a fifth role adds it here, never a fifth private copy.
//
// THIS MODULE OWNS TooltipLineClass and is the one tooltip line mechanism: a
// composed markup string with the text escaped. The createElement sibling
// (tooltip_line.ts) was deleted on 2026-09-27 once nothing called it; a caller
// that appends to a live node sets the returned markup on its container, or
// mints its own element with textContent, never a second copy of this union.

import { esc } from './esc';

export type TooltipLineClass = 'tt-sub' | 'tt-desc' | 'tt-green' | 'tt-red';

/** Optional modifier stacked on the base class, owned here with the base
 *  union; extend it per use. tt-material-use: the profession-affinity Used-by
 *  line's craft tint (item_tooltip_view.ts). */
export type TooltipLineModifier = 'tt-material-use';

/** One tooltip line. The text is always escaped, never interpolated raw: every
 *  caller reaches localized item and recipe names (the src/ui esc() rule). A
 *  modifier joins the base class with one space, the class string the DOM
 *  path's className assignment produced for the same pair. */
export function tooltipLine(
  cls: TooltipLineClass,
  text: string,
  modifier?: TooltipLineModifier,
): string {
  return `<div class="${modifier ? `${cls} ${modifier}` : cls}">${esc(text)}</div>`;
}
