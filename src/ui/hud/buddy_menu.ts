// The right-click menu on the player's OWN buddy (one row: enable/disable the
// autoloot errand). Extracted from the Hud coordinator under the monolith
// ratchet: the popup chrome (placement, on-screen clamp, action binding) is
// the Hud's, handed in as a narrow host, and this module only decides what
// the menu says and what the row sends.
//
// The armed state is read off the entity mirror (Entity.buddyAutoloot, terse
// `budal`) exactly as the rest of the HUD reads buddyKey, so the row offers
// the flip the SERVER would make; the write is server-authoritative and lands
// on the next snapshot.

import type { IWorld } from '../../world_api';
import { CTX_MENU_PICKER_CLASS } from '../bag_item_action_menu';
import { buddyMenuHtml } from './target_frame_menu';

export interface BuddyMenuHost {
  placePopupAt(
    el: HTMLElement,
    x: number,
    y: number,
    reserveRight: number,
    reserveDown: number,
  ): void;
  keepPopupOnScreen(el: HTMLElement): void;
  bindContextMenuActions(onActivate: (act: string) => void): void;
}

export function openBuddyMenu(
  host: BuddyMenuHost,
  world: IWorld,
  name: string,
  x: number,
  y: number,
): void {
  const el = document.querySelector('#ctx-menu') as HTMLElement;
  el.classList.remove(CTX_MENU_PICKER_CLASS);
  const armed = world.entities.get(world.playerId)?.buddyAutoloot === true;
  el.innerHTML = buddyMenuHtml(name, armed);
  el.style.display = 'block';
  host.placePopupAt(el, x, y, 170, 240);
  host.keepPopupOnScreen(el);
  host.bindContextMenuActions((act) => {
    if (act === 'autoloot') world.setBuddyAutoloot(!armed);
  });
}
