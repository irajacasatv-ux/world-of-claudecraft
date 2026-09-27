// @vitest-environment happy-dom

// Paint pins for the Book of Deeds earned moment and the deed broadcast
// (src/ui/deed_unlock_painter.ts, extracted from Hud.handleDeedUnlocks and the
// handleEvents deedBroadcast arm), through a recorded host: the drain order
// fed to the recent strip, one node line per fresh unlock, the title and
// border hint lines, ONE deed-class plate for the drain's last unlock with its
// announce and chime, and the retro catch-up as a single summary line with no
// plate and no chime. The clickable link itself is driven in
// tests/deed_unlock_chat_link.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { DEEDS } from '../src/sim/content/deeds';
import { deedName, deedTitleText } from '../src/ui/deed_i18n';
import {
  type DeedUnlockHost,
  paintDeedBroadcast,
  paintDeedUnlocks,
} from '../src/ui/deed_unlock_painter';
import { HUD_LOG } from '../src/ui/hud_tones';
import { formatNumber, t, tPlural } from '../src/ui/i18n';

const idsWith = (kind: string): string[] =>
  Object.keys(DEEDS).filter((id) => DEEDS[id]?.reward?.kind === kind);
const TITLE_ID = idsWith('title')[0] as string;
const BORDER_ID = idsWith('border')[0] as string;
const PLAIN_ID = Object.keys(DEEDS).find((id) => !DEEDS[id]?.reward) as string;

function recordedHost() {
  const calls = {
    log: [] as [string, string][],
    nodeLines: [] as [string, string][],
    celebrations: [] as unknown[][],
    announced: [] as string[],
  };
  const host: DeedUnlockHost = {
    log: (text, color) => calls.log.push([text, color]),
    logNodes: (nodes, color) =>
      calls.nodeLines.push([nodes.map((n) => n.textContent ?? '').join(''), color]),
    showCelebrationBanner: (...args) => calls.celebrations.push(args),
    announce: (text) => calls.announced.push(text),
    reducedMotion: () => {
      throw new Error('the deed plate reads no reduced-motion preference');
    },
    deedsWindow: { noteUnlocks: vi.fn(), openWithDeed: vi.fn() },
  };
  return { host, calls };
}

describe('paintDeedUnlocks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('premises: the catalog carries a title deed, a border deed and a plain deed', () => {
    expect(TITLE_ID).toBeTruthy();
    expect(BORDER_ID).toBeTruthy();
    expect(PLAIN_ID).toBeTruthy();
  });

  it('logs each unlock, both reward hints, and plates only the last unlock', () => {
    const chime = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, calls } = recordedHost();
    paintDeedUnlocks(host, [{ deedId: TITLE_ID }, { deedId: BORDER_ID }, { deedId: PLAIN_ID }]);
    expect(host.deedsWindow.noteUnlocks).toHaveBeenCalledWith([TITLE_ID, BORDER_ID, PLAIN_ID]);
    expect(calls.nodeLines.map(([text]) => text)).toEqual(
      [TITLE_ID, BORDER_ID, PLAIN_ID].map((id) =>
        t('hudChrome.deeds.unlockedBanner', { name: `[${deedName(id)}]` }),
      ),
    );
    expect(calls.nodeLines.every(([, color]) => color === HUD_LOG.NOTICE)).toBe(true);
    expect(calls.log).toEqual([
      [t('hudChrome.deeds.unlockedTitleHint', { title: deedTitleText(TITLE_ID) }), HUD_LOG.NOTICE],
      [t('hudChrome.deeds.unlockedBorderHint', { name: deedName(BORDER_ID) }), HUD_LOG.NOTICE],
    ]);
    const plate = t('hudChrome.deeds.unlockedBanner', { name: deedName(PLAIN_ID) });
    expect(calls.celebrations).toEqual([[plate, 'deed', 'deed', true]]);
    expect(calls.announced).toEqual([plate]);
    expect(chime).toHaveBeenCalledTimes(1);
  });

  it('collapses a retro-only drain to one summary line: no plate, no chime', () => {
    const chime = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { host, calls } = recordedHost();
    paintDeedUnlocks(host, [
      { deedId: TITLE_ID, retro: true },
      { deedId: PLAIN_ID, retro: true },
    ]);
    const summary = tPlural('hudChrome.plurals.deedsRetroSummary', 2, {
      count: formatNumber(2, { maximumFractionDigits: 0 }),
    });
    expect(calls.log).toEqual([[summary, HUD_LOG.NOTICE]]);
    expect(calls.announced).toEqual([summary]);
    expect(calls.nodeLines).toEqual([]);
    expect(calls.celebrations).toEqual([]);
    expect(chime).not.toHaveBeenCalled();
    expect(host.deedsWindow.noteUnlocks).toHaveBeenCalledWith([]);
  });
});

describe('paintDeedBroadcast', () => {
  it('lands one guild-green node line naming the friend and the deed', () => {
    const { host, calls } = recordedHost();
    paintDeedBroadcast(host, 'Hilda', PLAIN_ID);
    expect(calls.nodeLines).toEqual([
      [
        t('hudChrome.deeds.broadcastLine', { name: 'Hilda', deed: `[${deedName(PLAIN_ID)}]` }),
        HUD_LOG.BROADCAST,
      ],
    ]);
    expect(calls.log).toEqual([]);
    expect(calls.celebrations).toEqual([]);
  });
});
