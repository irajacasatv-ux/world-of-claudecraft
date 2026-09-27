// @vitest-environment happy-dom

// The emote wheel's geometry and its DOM, driven through the two modules Hud
// composes (src/ui/emote_wheel.ts over the pure src/ui/emote_wheel_view.ts)
// rather than a bare Hud prototype: importing src/ui/hud cost this one-file
// suite the coordinator's whole module graph. Hud.showEmoteWheel mounts the
// element with mountEmoteWheel and paints the seats with appendEmoteWheelSeats;
// Hud.updateEmoteWheelPointer is pointEmoteWheel over the same slot list.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendEmoteWheelSeats, mountEmoteWheel, pointEmoteWheel } from '../src/ui/emote_wheel';
import {
  EMOTE_WHEEL_LIMIT,
  emoteWheelLayout,
  emoteWheelPick,
  emoteWheelSeats,
} from '../src/ui/emote_wheel_view';

const EIGHT = ['wave', 'laugh', 'question', 'cheer', 'dance', 'point', 'flex', 'cry'];
// The two list shapes that made the old hit test disagree with the drawn ring:
// the seats are the filtered, capped list, and the hit test used the raw count.
const FILTERED = ['bogus', ...EIGHT];
const CAPPED = [...EIGHT, 'bow'];

/** Mount a wheel the way Hud.showEmoteWheel does, with a fixed 330px rect
 *  whose centre is (185, 195). */
function showWheel(slots: readonly string[]): {
  wheel: HTMLDivElement;
  seats: HTMLElement[];
  choose: ReturnType<typeof vi.fn>;
} {
  const wheel = mountEmoteWheel(null);
  wheel.innerHTML =
    '<div class="emote-wheel-ring"></div><button class="emote-wheel-edit">E</button>';
  const choose = vi.fn();
  appendEmoteWheelSeats(wheel, slots, { label: (id) => `label:${id}`, choose });
  wheel.getBoundingClientRect = () =>
    ({
      x: 20,
      y: 30,
      left: 20,
      top: 30,
      right: 350,
      bottom: 360,
      width: 330,
      height: 330,
      toJSON: () => ({}),
    }) as DOMRect;
  const seats = Array.from(wheel.querySelectorAll<HTMLElement>('.emote-wheel-item'));
  return { wheel, seats, choose };
}

const offset = (css: string): number => Number(css.match(/([\d.e+-]+)px/)?.[1]);

describe('emote wheel geometry', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ui"></div>';
  });

  it('places eight seats at the input ring radius and selects the pointed seat', () => {
    const { wheel, seats } = showWheel(EIGHT);

    // The element Hud keeps is the mounted #emote-wheel under #ui, created once.
    expect(document.getElementById('emote-wheel')).toBe(wheel);
    expect(wheel.parentElement).toBe(document.getElementById('ui'));
    expect(mountEmoteWheel(wheel)).toBe(wheel);
    expect(document.querySelectorAll('#emote-wheel')).toHaveLength(1);

    // W12: rendered seats and pointer selection share the approved 92px radial geometry.
    expect(seats).toHaveLength(8);
    expect(Number(seats[0]?.style.left.match(/([\d.e+-]+)px/)?.[1])).toBeCloseTo(0);
    expect(Number(seats[0]?.style.top.match(/([\d.e+-]+)px/)?.[1])).toBe(-92);
    expect(pointEmoteWheel(wheel, EIGHT, 185, 103)).toBe('wave');
    expect(seats[0]?.classList.contains('selected')).toBe(true);
    expect(seats.slice(1).every((seat) => !seat.classList.contains('selected'))).toBe(true);
  });

  // The failing-first reproduction for the B6 finding (it failed against the
  // pre-extraction Hud: pointing at the drawn 'wave' seat of the filtered list
  // selected 'bogus', and at the drawn 'dance' seat of the capped list selected
  // 'point'). Point at every drawn seat and require the hover to be exactly
  // that seat.
  it.each([
    ['a filtered list (a non-emote id first)', FILTERED],
    ['a capped list (nine emotes, eight seats)', CAPPED],
  ])('selects the drawn seat under the pointer for %s', (_label, slots) => {
    const { wheel, seats } = showWheel(slots);
    expect(seats).toHaveLength(8);
    for (const seat of seats) {
      const hover = pointEmoteWheel(
        wheel,
        slots,
        185 + offset(seat.style.left),
        195 + offset(seat.style.top),
      );
      expect(hover, seat.dataset.emote).toBe(seat.dataset.emote);
      expect(seats.filter((s) => s.classList.contains('selected'))).toEqual([seat]);
    }
  });

  it('marks the centre Edit button, and nothing in the gap or past the band', () => {
    const { wheel, seats } = showWheel(EIGHT);
    const edit = wheel.querySelector('.emote-wheel-edit') as HTMLElement;
    expect(pointEmoteWheel(wheel, EIGHT, 185, 195)).toBe('edit');
    expect(edit.classList.contains('selected')).toBe(true);
    expect(seats.some((s) => s.classList.contains('selected'))).toBe(false);
    // 50px out: past the Edit radius (44), short of the seat band (58).
    expect(pointEmoteWheel(wheel, EIGHT, 185, 145)).toBeNull();
    expect(edit.classList.contains('selected')).toBe(false);
    // Past 0.58 of the wheel width (191.4px).
    expect(pointEmoteWheel(wheel, EIGHT, 185, 195 - 200)).toBeNull();
  });

  it('a seat click routes its own emote to the chooser', () => {
    const { seats, choose } = showWheel(EIGHT);
    seats[3]?.click();
    expect(choose).toHaveBeenCalledTimes(1);
    expect(choose).toHaveBeenCalledWith('cheer');
  });
});

describe('emote wheel view (the one slot list)', () => {
  it('seats only valid emote ids, in order, capped at the limit', () => {
    expect(emoteWheelSeats(FILTERED)).toEqual(EIGHT);
    expect(emoteWheelSeats(CAPPED)).toEqual(EIGHT);
    expect(emoteWheelSeats(CAPPED)).toHaveLength(EMOTE_WHEEL_LIMIT);
    expect(emoteWheelSeats([])).toEqual([]);
  });

  it.each([
    ['exact', EIGHT],
    ['filtered', FILTERED],
    ['capped', CAPPED],
    ['short', ['wave', 'laugh', 'cheer']],
  ])('picks every laid-out seat at its own offset (%s)', (_label, slots) => {
    const layout = emoteWheelLayout(slots);
    expect(layout.map((seat) => seat.id)).toEqual(emoteWheelSeats(slots));
    for (const seat of layout) {
      expect(emoteWheelPick(slots, seat.x, seat.y, 330), seat.id).toBe(seat.id);
    }
  });

  it('has no seat to pick from an empty list', () => {
    expect(emoteWheelLayout([])).toEqual([]);
    expect(emoteWheelPick([], 0, -92, 330)).toBeNull();
    expect(emoteWheelPick([], 0, 0, 330)).toBe('edit');
  });

  it('reads the UI scale off the mounted wheel (screen width over layout width)', () => {
    const { wheel } = showWheel(['wave', 'dance', 'cheer']);
    // Laid out at 165 CSS px and drawn at 330 screen px: a UI scale of 2. The
    // pointer 80 screen px above the centre (185, 195) is 40 author px out, so
    // it is on the Edit button, not the top seat.
    Object.defineProperty(wheel, 'offsetWidth', { configurable: true, value: 165 });
    expect(pointEmoteWheel(wheel, ['wave', 'dance', 'cheer'], 185, 115)).toBe('edit');
  });

  it('scales the Edit button and the gap with the wheel under a UI scale', () => {
    const slots = ['wave', 'dance', 'cheer'];
    // 80 screen px out: past the author Edit radius and gap at scale 1 (a seat)...
    expect(emoteWheelPick(slots, 0, -80, 330)).toBe('wave');
    // ...but only 40 author px at scale 2, which is still the Edit button.
    expect(emoteWheelPick(slots, 0, -80, 660, 2)).toBe('edit');
    // The seat ring itself scales too: 92 author px is 184 screen px at scale 2.
    expect(emoteWheelPick(slots, 0, -184, 660, 2)).toBe('wave');
    // And the gap between them: 55 author px (110 screen) picks nothing.
    expect(emoteWheelPick(slots, 0, -110, 660, 2)).toBeNull();
  });
});
