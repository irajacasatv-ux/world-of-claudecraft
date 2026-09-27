// The paint half of the crafted earned moment (extracted from
// Hud.handleCraftCelebrations): the durable log copy for the masterwork proc
// and each tier crossing, the single banner slot coalesced (masterwork outranks
// tier-up), the polite announce, and at most ONE celebration sound per drain.
// The batching rules live in the pure plan (craft_celebration_view.ts) and the
// copy in craft_celebration_text_view.ts; this module only draws the plan
// through the CelebrationHost seam. The reduced-motion probe (the skin
// controller precedent) trims motion only, never information.

import { audio } from '../../../game/audio';
import {
  craftBannerIcon,
  craftBannerText,
  craftToastLogLines,
} from './craft_celebration_text_view';
import { buildCraftCelebrationPlan, type CraftTierUp } from './craft_celebration_view';
import type { CelebrationHost } from './skill_level_toast_painter';

/** The celebration host plus the AMBIENT banner form the masterwork plate
 *  rides (showBanner's first three arguments), not the queued celebration
 *  form the other celebration painters use. */
export interface CraftCelebrationHost extends CelebrationHost {
  showBanner(text: string, motion: boolean, decorativeIconUrl?: string): void;
}

export function paintCraftCelebrations(
  host: CraftCelebrationHost,
  masterworkItemId: string | null,
  tierUps: CraftTierUp[],
): void {
  const reducedMotion = host.reducedMotion();
  const plan = buildCraftCelebrationPlan({
    masterwork: masterworkItemId !== null ? { itemId: masterworkItemId } : null,
    tierUps,
    reducedMotion,
  });
  for (const l of craftToastLogLines(plan)) host.log(l.text, l.color);
  if (plan.banner !== null) {
    const text = craftBannerText(plan.banner);
    // plan.motion trims the banner fade only; the announcer push below is
    // the polite #combat-live ARIA region (accessibility, never gated).
    host.showBanner(text, plan.motion, craftBannerIcon(plan.banner));
    // The banner div carries no live semantics (the deed unlock precedent),
    // so the polite #combat-live region carries the copy.
    host.announce(text);
  }
  if (plan.playSound) audio.achievement();
}
