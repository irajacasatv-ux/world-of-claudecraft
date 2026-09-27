// @vitest-environment happy-dom

// Paint pins for a Reliquary catalog fill (src/ui/reliquary_unlock_painter.ts,
// extracted from Hud.handleReliquaryUnlocks), through a recorded host: the
// reduced-motion probe trims only the plate's motion, an OPEN window arms both
// celebration one-shots BEFORE its world-driven refresh (a closed one is left
// alone), and the border-bridge rank earns its durable note. The clickable
// lines and the Illumination broadcast are driven in
// tests/reliquary_unlock_chat_link.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { deedName } from '../src/ui/deed_i18n';
import { HUD_LOG } from '../src/ui/hud_tones';
import { t } from '../src/ui/i18n';
import { reliquaryPageName } from '../src/ui/reliquary_i18n';
import {
  paintReliquaryUnlocks,
  type ReliquaryUnlockHost,
} from '../src/ui/reliquary_unlock_painter';
import { CURATOR_BORDER_REWARD, reliquaryFlashKey } from '../src/ui/reliquary_view';

const RELIC_ID = 'deathlord_legguards';
const ILLUMINATED_PAGE = 'professions_field_notes';

function recordedHost(opts: { reducedMotion?: boolean; open?: boolean } = {}) {
  const order: string[] = [];
  const calls = { log: [] as [string, string][], celebrations: [] as unknown[][] };
  const host: ReliquaryUnlockHost = {
    log: (text, color) => calls.log.push([text, color]),
    logNodes: () => {},
    showCelebrationBanner: (...args) => calls.celebrations.push(args),
    announce: () => {},
    reducedMotion: () => opts.reducedMotion ?? false,
    reliquaryWindow: {
      isOpen: opts.open ?? false,
      open: vi.fn(),
      openWithPage: vi.fn(),
      flashRelics: vi.fn(() => order.push('flash')),
      celebrateIllumination: vi.fn(() => order.push('illuminate')),
      refreshIfChanged: vi.fn(() => order.push('refresh')),
    },
  };
  return { host, calls, order };
}

describe('paintReliquaryUnlocks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('trims only the plate motion under reduced motion (copy, class and variant intact)', () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const still = recordedHost({ reducedMotion: true });
    paintReliquaryUnlocks(still.host, [{ itemId: RELIC_ID, illuminatedPageId: ILLUMINATED_PAGE }]);
    const plate = t('hudChrome.reliquary.illuminateBanner', {
      name: reliquaryPageName(ILLUMINATED_PAGE),
    });
    expect(still.calls.celebrations).toEqual([[plate, 'deed', 'deed', false]]);
    const moving = recordedHost();
    paintReliquaryUnlocks(moving.host, [{ itemId: RELIC_ID, illuminatedPageId: ILLUMINATED_PAGE }]);
    expect(moving.calls.celebrations).toEqual([[plate, 'deed', 'deed', true]]);
  });

  it('arms the flash and the Illumination on an open window, then refreshes it', () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, order } = recordedHost({ open: true });
    paintReliquaryUnlocks(host, [{ itemId: RELIC_ID, illuminatedPageId: ILLUMINATED_PAGE }]);
    expect(host.reliquaryWindow.flashRelics).toHaveBeenCalledWith([
      reliquaryFlashKey('item', RELIC_ID),
    ]);
    expect(host.reliquaryWindow.celebrateIllumination).toHaveBeenCalledWith(ILLUMINATED_PAGE);
    expect(order).toEqual(['flash', 'illuminate', 'refresh']);
  });

  it('leaves a closed window alone', () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, order } = recordedHost({ open: false });
    paintReliquaryUnlocks(host, [{ itemId: RELIC_ID, illuminatedPageId: ILLUMINATED_PAGE }]);
    expect(order).toEqual([]);
  });

  it('adds the durable border note exactly on the border-bridge rank', () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    // Premise (pinned to its value in tests/reliquary_view.test.ts): one rank
    // bridges a border deed, so both arms below are live.
    const bridge = CURATOR_BORDER_REWARD;
    expect(bridge).not.toBeNull();
    if (bridge === null) return;
    const note = t('hudChrome.reliquary.borderWearableNote', { name: deedName(bridge.deedId) });
    const on = recordedHost();
    paintReliquaryUnlocks(on.host, [{ itemId: RELIC_ID, curatorRank: bridge.rank }]);
    expect(on.calls.log).toContainEqual([note, HUD_LOG.NOTICE]);
    const off = recordedHost();
    paintReliquaryUnlocks(off.host, [{ itemId: RELIC_ID, curatorRank: bridge.rank + 1 }]);
    expect(off.calls.log).not.toContainEqual([note, HUD_LOG.NOTICE]);
  });
});
