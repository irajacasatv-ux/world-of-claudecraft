// Pure placement + anchor math for the generic `.window.panel` reflow
// (window_reflow.ts is the DOM adapter: dataset persistence, the resize
// listener). Mirrors placeTargetFrame / placeMeterFrame / placeChatBox for
// the one movable-panel family that never got its own pure core, and reuses
// anchorAdjustedPos (the same anchorAxis rule MovableFrame and the chat box
// already ship) rather than a fourth copy: every field of TargetFramePos
// besides left/top is optional, so a plain {left, top, vw, vh} satisfies it
// structurally.

import { anchorAdjustedPos } from './target_frame_pos';

/** Keep-out band from every viewport edge, matching the target frame / chat
 *  box / meter panel margin. */
const WINDOW_MARGIN = 8;

export interface WindowPlacement {
  left: number;
  top: number;
}

export interface WindowPlacementResult {
  /** Clamped top-left in VISUAL (screen / pointer) space: remember THIS
   *  (rememberWindowPos), so a spot chosen at one UI Scale re-derives to the
   *  same visual place at another. */
  visual: WindowPlacement;
  /** Author-space left/top for the style write: `.window.panel` elements
   *  live inside #ui (`zoom: var(--ui-scale)`), which re-multiplies an
   *  author length back to its visual counterpart. */
  css: WindowPlacement;
}

/**
 * Clamp a desired top-left so the window (its measured `size`) stays fully
 * on screen. `left`/`top` arrive in VISUAL (zoomed) space, matching
 * getBoundingClientRect() and pointer clientX/clientY; style.left/top are
 * author lengths the browser re-multiplies by #ui's `zoom`, so the css write
 * divides by the live UI scale (a scale of 1, the default, is a no-op).
 */
export function placeWindow(
  left: number,
  top: number,
  size: { w: number; h: number },
  viewport: { w: number; h: number },
  scale: number,
): WindowPlacementResult {
  const z = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const vw = viewport.w / z;
  const vh = viewport.h / z;
  const width = Math.min(size.w / z, vw - WINDOW_MARGIN * 2);
  const height = Math.min(size.h / z, vh - WINDOW_MARGIN * 2);
  const maxLeft = Math.max(WINDOW_MARGIN, vw - width - WINDOW_MARGIN);
  const maxTop = Math.max(WINDOW_MARGIN, vh - height - WINDOW_MARGIN);
  const css = {
    left: Math.max(WINDOW_MARGIN, Math.min(maxLeft, left / z)),
    top: Math.max(WINDOW_MARGIN, Math.min(maxTop, top / z)),
  };
  return { css, visual: { left: css.left * z, top: css.top * z } };
}

/** The requested spot (see window_reflow.ts's rememberWindowPos), re-anchored
 *  per axis to the CURRENT viewport exactly as MovableFrame / the chat box
 *  do: each axis keeps its distance to whichever of start / center / end it
 *  sat closest to when chosen. A spot with no viewport stamp (an older save,
 *  or a window never explicitly positioned) returns unchanged. */
export function anchoredRequestedPos(
  pos: { left: number; top: number; vw?: number; vh?: number },
  size: { w: number; h: number },
  viewport: { w: number; h: number },
): WindowPlacement {
  const anchored = anchorAdjustedPos(pos, size, viewport);
  return { left: anchored.left, top: anchored.top };
}

/** Whether the desktop open cascade (window_reflow.ts placeNewWindow) must
 *  leave a newly shown window where its CSS put it. `moved` is the window's
 *  own moved stamp (a window the player or an earlier cascade already placed
 *  keeps its spot); `body` is the body's class list. Extracted from Hud. */
export function cascadeExempt(
  id: string,
  moved: boolean,
  body: { contains(cls: string): boolean },
): boolean {
  // Desktop-only cascade: mobile windows are full-screen/modal (see
  // src/styles/hud.mobile.css), so the pixel-offset cascade would hijack
  // their inset:0 CSS with an inline top/left/right:auto/bottom:auto that
  // never gets reset, breaking the full-screen layout for the rest of the
  // session (issue 1577 char/talents redo).
  if (body.contains('mobile-touch') || moved || id === 'loot-window' || id === 'confirm-dialog') {
    return true;
  }
  if (body.contains('vendor-open') && (id === 'vendor-window' || id === 'bags')) return true;
  // Fixed vault and bank layouts must not inherit cascaded window positions.
  if (id === 'bank-window' && body.contains('weekly-vault-open')) return true;
  if (body.contains('bank-open') && (id === 'bank-window' || id === 'bags')) return true;
  // The market docks its bags companion the same way (body.market-open, see
  // components.css): skip the cascade for that cluster too, or the inline
  // position the cascade bakes onto #bags beats the docking CSS the moment a
  // second window is already open (PR #2107 review round 5).
  if (body.contains('market-open') && (id === 'market-window' || id === 'bags')) return true;
  return false;
}

/** The cascade step, in VISUAL px, for a window shown over `openCount` other
 *  open windows: 28px per open window, wrapping after eight. Null when no
 *  other window is open (the window keeps its CSS spot). */
export function cascadeOffset(openCount: number): number | null {
  if (openCount <= 0) return null;
  return (((openCount - 1) % 8) + 1) * 28;
}
