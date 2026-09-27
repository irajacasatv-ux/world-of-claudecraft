// The emote wheel's geometry: which emotes get a seat, where each seat sits on
// the ring, and which seat (or the centre Edit button) a pointer is over.
// Extracted from Hud.showEmoteWheel / updateEmoteWheelPointer.
//
// ONE slot list feeds both halves. Hud used to draw the seats from the
// filtered, capped list (valid emote ids only, at most EMOTE_WHEEL_LIMIT) while
// the pointer hit test divided the ring by the RAW slot count, so a list
// holding a non-emote id or more than eight ids selected a different emote
// than the seat under the pointer (or a non-emote id at all). Both functions
// below take the raw list and derive the seats through emoteWheelSeats, so the
// drawn ring and the hit ring cannot disagree.
//
// Pure and DOM-free (registered in tests/architecture.test.ts UI_PURE_CORES);
// the wheel's DOM half is src/ui/emote_wheel.ts.

import type { OverheadEmoteId } from '../sim/types';
import { isOverheadEmoteId } from '../world_api/chat';

/** How many emotes the wheel seats (the editor caps the selection here too). */
export const EMOTE_WHEEL_LIMIT = 8;

/** The seat ring radius, in author px from the wheel's centre. */
export const EMOTE_WHEEL_SEAT_RADIUS = 92;

/** Within this distance of the centre the pointer is on the Edit button. */
const EDIT_RADIUS = 44;
/** The seat band starts here... */
const SEAT_BAND_INNER = 58;
/** ...and ends at this fraction of the wheel's width. */
const SEAT_BAND_OUTER_FRAC = 0.58;

export interface EmoteWheelSeat {
  id: OverheadEmoteId;
  /** Offset from the wheel's centre, in author px. */
  x: number;
  y: number;
}

/** The emotes that get a seat: the valid ids, in order, capped at the limit. */
export function emoteWheelSeats(slots: readonly string[]): OverheadEmoteId[] {
  return slots.filter(isOverheadEmoteId).slice(0, EMOTE_WHEEL_LIMIT);
}

/** Every seat with its ring offset: the first at the top, then clockwise. */
export function emoteWheelLayout(slots: readonly string[]): EmoteWheelSeat[] {
  const seats = emoteWheelSeats(slots);
  return seats.map((id, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(1, seats.length)) * Math.PI * 2;
    return {
      id,
      x: Math.cos(angle) * EMOTE_WHEEL_SEAT_RADIUS,
      y: Math.sin(angle) * EMOTE_WHEEL_SEAT_RADIUS,
    };
  });
}

/** What the pointer is over, given its offset (dx, dy) from the wheel's centre
 *  and the wheel's rendered width: 'edit' at the centre, the nearest seat's
 *  emote inside the seat band, and nothing in the gap or past the band. */
export function emoteWheelPick(
  slots: readonly string[],
  dx: number,
  dy: number,
  wheelWidth: number,
): OverheadEmoteId | 'edit' | null {
  const dist = Math.hypot(dx, dy);
  if (dist <= EDIT_RADIUS) return 'edit';
  const seats = emoteWheelSeats(slots);
  if (dist < SEAT_BAND_INNER || dist > wheelWidth * SEAT_BAND_OUTER_FRAC || seats.length === 0) {
    return null;
  }
  const angle = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.round((angle / (Math.PI * 2)) * seats.length) % seats.length;
  return seats[idx] ?? null;
}
