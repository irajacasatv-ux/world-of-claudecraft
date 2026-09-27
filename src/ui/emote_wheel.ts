// The emote wheel's DOM half (extracted from Hud.showEmoteWheel /
// updateEmoteWheelPointer): mounting the #emote-wheel element once, painting
// one seat button per seated emote on the ring, and marking the seat (or the
// centre Edit button) under the pointer. The geometry is emote_wheel_view.ts,
// and every function here takes the SAME raw slot list and resolves it
// through that core, so the seats drawn and the seat picked cannot disagree.
//
// Hud keeps the wheel's state (open, pinned, the hovered choice), the per-show
// dialog-root mark and chrome, and what a choice does (play the emote, open
// the editor). Registered in tests/architecture.test.ts UI_DOM_MODULES: it
// reaches the live document.

import type { OverheadEmoteId } from '../sim/types';
import { emoteIconUrl } from './emote_icons';
import { emoteWheelLayout, emoteWheelPick } from './emote_wheel_view';

export interface EmoteWheelSeatDeps {
  /** The localized emote name (the seat's title and caption). */
  label(id: OverheadEmoteId): string;
  /** A click on the seat. */
  choose(id: OverheadEmoteId): void;
}

/** The wheel element: `existing` when there is one, else a new #emote-wheel
 *  appended to #ui. Created once; everything per show happens after this. */
export function mountEmoteWheel(existing: HTMLDivElement | null): HTMLDivElement {
  if (existing) return existing;
  const el = document.createElement('div');
  el.id = 'emote-wheel';
  document.getElementById('ui')?.appendChild(el);
  return el;
}

/** Append one seat button per seated emote, placed on the ring. */
export function appendEmoteWheelSeats(
  el: HTMLElement,
  slots: readonly string[],
  deps: EmoteWheelSeatDeps,
): void {
  for (const seat of emoteWheelLayout(slots)) {
    const id = seat.id;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emote-wheel-item ui-btn';
    btn.dataset.emote = id;
    btn.title = deps.label(id);
    const icon = document.createElement('img');
    icon.className = 'emote-wheel-icon';
    icon.src = emoteIconUrl(id);
    icon.alt = '';
    const label = document.createElement('span');
    label.className = 'emote-wheel-label';
    label.textContent = deps.label(id);
    btn.append(icon, label);
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      deps.choose(id);
    });
    btn.style.left = `calc(50% + ${seat.x}px)`;
    btn.style.top = `calc(50% + ${seat.y}px)`;
    el.appendChild(btn);
  }
}

/** Resolve a viewport pointer against the wheel and mark what it is over
 *  (the Edit button or one seat, never both); returns that choice. */
export function pointEmoteWheel(
  el: HTMLElement,
  slots: readonly string[],
  x: number,
  y: number,
): OverheadEmoteId | 'edit' | null {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  // Screen width over layout width: the UI scale the author-px thresholds need.
  const scale = el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1;
  const hover = emoteWheelPick(slots, x - cx, y - cy, rect.width, scale);
  el.querySelector('.emote-wheel-edit')?.classList.toggle('selected', hover === 'edit');
  el.querySelectorAll<HTMLElement>('.emote-wheel-item').forEach((item) => {
    item.classList.toggle('selected', item.dataset.emote === hover);
  });
  return hover;
}
