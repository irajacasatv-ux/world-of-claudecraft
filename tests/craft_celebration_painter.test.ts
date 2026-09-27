// Paint pins for the crafted earned moment (craft_celebration_painter.ts,
// extracted from Hud.handleCraftCelebrations), through a recorded host: one
// toast line per masterwork and tier-up in plan order, the single AMBIENT
// banner (masterwork outranks tier-up, the seal only on a masterwork), the
// polite announce of exactly the banner copy, one chime, and reduced motion
// trimming the banner fade only. The DOM half (the real banner slot) is
// driven in tests/craft_celebration_view.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import {
  type CraftCelebrationHost,
  paintCraftCelebrations,
} from '../src/ui/hud/professions/craft_celebration_painter';
import {
  CRAFT_TOAST_LOG_COLOR,
  craftBannerText,
} from '../src/ui/hud/professions/craft_celebration_text_view';
import { MASTERWORK_SEAL_IMAGE_URL } from '../src/ui/hud/professions/profession_art';

function recordedHost(reducedMotion = false) {
  const calls = {
    log: [] as [string, string][],
    banners: [] as unknown[][],
    celebrations: [] as unknown[][],
    announced: [] as string[],
  };
  const host: CraftCelebrationHost = {
    log: (text, color) => calls.log.push([text, color]),
    showBanner: (...args) => calls.banners.push(args),
    showCelebrationBanner: (...args) => calls.celebrations.push(args),
    announce: (text) => calls.announced.push(text),
    reducedMotion: () => reducedMotion,
  };
  return { host, calls };
}

describe('paintCraftCelebrations', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs every tier-up, plates the LAST on the ambient banner with no seal, chimes once', () => {
    const chime = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, calls } = recordedHost();
    const ups = [
      { craftId: 'cooking', toTier: 2 },
      { craftId: 'tailoring', toTier: 3 },
    ];
    paintCraftCelebrations(host, null, ups);
    expect(calls.log.map(([, color]) => color)).toEqual([
      CRAFT_TOAST_LOG_COLOR,
      CRAFT_TOAST_LOG_COLOR,
    ]);
    const text = craftBannerText({ kind: 'tierUp', craftId: 'tailoring', toTier: 3 });
    expect(calls.log[1]?.[0]).toBe(text);
    expect(calls.banners).toEqual([[text, true, undefined]]);
    // The masterwork plate rides the AMBIENT form, never the queued one.
    expect(calls.celebrations).toEqual([]);
    expect(calls.announced).toEqual([text]);
    expect(chime).toHaveBeenCalledTimes(1);
  });

  it('lets a masterwork outrank the tier-ups for the banner, sealed, still logging both', () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, calls } = recordedHost();
    paintCraftCelebrations(host, 'iron_sword', [{ craftId: 'cooking', toTier: 2 }]);
    const text = craftBannerText({ kind: 'masterwork', itemId: 'iron_sword' });
    expect(calls.log).toHaveLength(2);
    expect(calls.log[0]?.[0]).toBe(text);
    expect(calls.banners).toEqual([[text, true, MASTERWORK_SEAL_IMAGE_URL]]);
    expect(calls.announced).toEqual([text]);
  });

  it('trims the banner fade under reduced motion, keeping copy, announce and chime', () => {
    const chime = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, calls } = recordedHost(true);
    paintCraftCelebrations(host, 'iron_sword', []);
    expect(calls.banners[0]?.[1]).toBe(false);
    expect(calls.announced).toHaveLength(1);
    expect(chime).toHaveBeenCalledTimes(1);
  });

  it('does nothing at all for an empty drain', () => {
    const chime = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, calls } = recordedHost();
    paintCraftCelebrations(host, null, []);
    expect(calls).toEqual({ log: [], banners: [], celebrations: [], announced: [] });
    expect(chime).not.toHaveBeenCalled();
  });
});
