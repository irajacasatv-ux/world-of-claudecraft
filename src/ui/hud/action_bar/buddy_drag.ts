// Dragging a collected buddy onto the action bar from a window (the Book of
// Deeds buddy shelf). A buddy is a collection flag, never a bag item, so the
// payload is the `buddy` HotbarAction rather than an item id; the bar places
// it as a summon slot (src/ui/hud.ts castSlot -> IWorld.summonBuddy).
//
// Two channels, the same pair every drag source uses: the DataTransfer carries
// the payload for the drop, and the host's live drag action (setDragAction)
// carries it for dragover, where getData is unreadable.

import { writeDraggedAction } from './hotbar_drag';

/** The grip attribute a shelf row carries; its value is the buddy key. */
export const BUDDY_DRAG_ATTR = 'data-buddy-drag';

export interface BuddyDragHost {
  setDragAction(action: { type: 'buddy'; id: string } | null): void;
  clearActionDropTargets(): void;
}

export function startBuddyDrag(ev: DragEvent, key: string, host: BuddyDragHost): void {
  const action = { type: 'buddy' as const, id: key };
  host.setDragAction(action);
  writeDraggedAction(ev.dataTransfer, action);
  if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy';
}

export function endBuddyDrag(host: BuddyDragHost): void {
  host.setDragAction(null);
  host.clearActionDropTargets();
}
