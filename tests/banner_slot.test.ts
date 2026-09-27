// @vitest-environment happy-dom

// The live half of the shared #banner slot (src/ui/banner_slot.ts, extracted
// from Hud): the celebration argument defaults, the subtext normalization the
// paint reads, the reused element shedding the previous banner's classes, the
// bounded queue's drop outcome, and the unstuck and takeover arms. The R38
// policy itself is pinned in tests/banner_queue.test.ts, and the end-to-end
// deed collision and ambient-defer timing in tests/deeds_window.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BANNER_QUEUE_LIMIT } from '../src/ui/banner_queue';
import { BannerSlot, celebrationBannerArgs } from '../src/ui/banner_slot';

let el: HTMLElement;
let slot: BannerSlot;

beforeEach(() => {
  vi.useFakeTimers();
  el = document.createElement('div');
  slot = new BannerSlot(el);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('celebrationBannerArgs', () => {
  it('fills the celebration defaults: full motion, the default variant, 2600ms, no source', () => {
    expect(celebrationBannerArgs('Level 2!', 'levelup')).toEqual([
      'Level 2!',
      true,
      undefined,
      'default',
      undefined,
      2600,
      null,
      'levelup',
    ]);
  });

  it('threads every explicit argument into its show() slot', () => {
    expect(celebrationBannerArgs('Mining', 'deed', 'skill', false, '/crest.webp', 'Lv 25')).toEqual(
      ['Mining', false, '/crest.webp', 'skill', 'Lv 25', 2600, null, 'deed'],
    );
  });
});

describe('BannerSlot.show', () => {
  it('drops an empty subtext list, so no has-subtext class lays out an empty row', () => {
    expect(slot.show('Zone', true, undefined, 'default', [])).toBe('show');
    expect(el.classList.contains('has-subtext')).toBe(false);
    expect(el.querySelector('.banner-copy')?.textContent).toBe('Zone');
  });

  it('stacks one subtext span per non-empty line under the title', () => {
    slot.show('Victory', true, undefined, 'default', ['Score 3-1', '', 'Rating 1520']);
    expect(el.classList.contains('has-subtext')).toBe(true);
    expect(el.querySelector('.banner-title')?.textContent).toBe('Victory');
    expect([...el.querySelectorAll('.banner-subtext')].map((n) => n.textContent)).toEqual([
      'Score 3-1',
      'Rating 1520',
    ]);
  });

  it('sheds the previous banner classes on the reused element', () => {
    slot.show('Rolled', false, '/art.webp', 'skill', undefined, 2600, null, 'loot');
    expect([...el.classList].sort()).toEqual(
      ['banner-loot', 'banner-no-motion', 'banner-skill', 'banner-with-art'].sort(),
    );
    vi.advanceTimersByTime(2600 + 250);
    slot.show('Plain');
    expect(el.className).toBe('');
    expect(el.style.opacity).toBe('1');
  });

  it('reports a full celebration queue as dropped (the log line is the record)', () => {
    slot.show('Live', true, undefined, 'default', undefined, 2600, null, 'levelup');
    for (let i = 0; i < BANNER_QUEUE_LIMIT; i++) {
      expect(slot.show(`Deed ${i}`, true, undefined, 'deed', undefined, 2600, null, 'deed')).toBe(
        'queued',
      );
    }
    expect(slot.show('One too many', true, undefined, 'deed', undefined, 2600, null, 'deed')).toBe(
      'dropped',
    );
  });
});

describe('BannerSlot.clearUnstuck and hideImmediately', () => {
  it('leaves a live banner that is not the unstuck line alone, purging only queued unstuck', () => {
    slot.show('Level 3!', true, undefined, 'default', undefined, 2600, null, 'levelup');
    slot.show('Stuck? Hold still.', true, undefined, 'default', undefined, 2600, 'unstuck');
    slot.clearUnstuck();
    expect(el.textContent).toBe('Level 3!');
    expect(el.style.opacity).toBe('1');
    // The parked unstuck ambient was purged: nothing replays after the level-up.
    vi.advanceTimersByTime(2600 + 250);
    expect(el.textContent).toBe('Level 3!');
    expect(el.style.opacity).toBe('0');
  });

  it('hides the live element outright and lets the next banner show it again', () => {
    slot.show('Tip', true);
    slot.hideImmediately();
    expect(el.style.display).toBe('none');
    expect(el.style.opacity).toBe('0');
    expect(slot.show('3')).toBe('show');
    expect(el.style.display).toBe('');
    expect(el.textContent).toBe('3');
  });
});
