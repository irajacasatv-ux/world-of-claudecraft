// A host for the loot and profession event routers
// (src/ui/hud/loot/loot_event_router.ts,
// src/ui/hud/professions/profession_event_router.ts) over a real chat pane, in
// place of the Object.create(Hud.prototype) rigs those suites drove
// Hud.handleEvents with while the arms lived in the coordinator (whose import
// alone cost a test file several hundred MB of retained heap).
//
// The defaults are the stubs those rigs stamped on the bare prototype: every
// window repaint, toast and banner a vi.fn, the unbind and crafting windows
// closed, the professions window closed. The chat pane is chatPane()'s (real
// lines, Show Timestamps off, a silent announcer and filter spy). Three members
// are TRANSCRIPTIONS of Hud wiring, each held to the real one elsewhere:
// - routeEvents is the router pass of Hud.handleEvents (the loot router, then
//   the profession router, per event); tests/hud_coordinator_delegators.test.ts
//   drives the real handleEvents over the same burst and compares the lines;
// - showCelebrationBanner feeds celebrationBannerArgs into showBanner, the
//   Hud method's body, pinned in the same file;
// - refreshOpenProfessionSurfacesIfChanged runs a real ProfessionSurfaceRefresh
//   over the rig's world, charWindow and renderCrafting, the Hud's lazy
//   professionSurfaces wiring, driven for real in the same file.
// A case that exercises a member differently passes its own through
// `overrides` (a real ErrorToastController, a real BannerSlot's show).
import { type Mock, vi } from 'vitest';
import type { SimEvent } from '../../src/sim/types';
import { type BannerVariant, celebrationBannerArgs } from '../../src/ui/banner_slot';
import {
  applyLootEventPresentation,
  type LootEventHost,
} from '../../src/ui/hud/loot/loot_event_router';
import {
  applyProfessionEventPresentation,
  type ProfessionEventHost,
} from '../../src/ui/hud/professions/profession_event_router';
import { ProfessionSurfaceRefresh } from '../../src/ui/hud/professions/profession_surface_refresh';
import type { IWorld } from '../../src/world_api';
import { type ChatPane, chatPane } from './chat_log_deps';

/** Every host member as the rig builds it: the router interfaces plus the
 *  mocks a case asserts on. */
export interface EventRouterRig
  extends Omit<LootEventHost, 'sim' | 'log' | 'showBanner' | 'errorToast'>,
    Omit<ProfessionEventHost, 'log' | 'showCelebrationBanner'> {
  sim: Record<string, unknown>;
  readonly chatLogEl: HTMLElement;
  chatTimestamps: boolean;
  readonly hideIfFiltered: Mock;
  readonly chatAnnouncer: { push: Mock };
  log: Mock<ChatPane['log']>;
  showBanner: Mock;
  errorToast: { show: Mock | ((text: string, durationMs?: number, heldLoot?: boolean) => void) };
  lootRolls: { closeForItem: Mock };
  renderBags: Mock;
  renderCrafting: Mock;
  renderUnbind: Mock;
  showError: Mock;
  showSelfNote: Mock;
  openUnbindNpcId: number | null;
  professionsWindow: { isOpen: boolean; render: Mock };
  craftingWindowEl: HTMLElement | null;
  craftCastExpectingResult: boolean;
  announceCraftCast: Mock;
  celebrationDrain: { armCraftTierUps: Mock };
  combatAnnouncer: { push: Mock };
  charWindow: { renderIfOpen: Mock };
  openProfessionTutorial: Mock;
  questDialog: { refreshIfChanged: Mock };
  showCelebrationBanner(
    text: string,
    bannerClass: 'levelup' | 'deed',
    variant?: BannerVariant,
    motion?: boolean,
  ): void;
  refreshOpenProfessionSurfacesIfChanged(): void;
  /** The router pass of Hud.handleEvents over a burst. */
  routeEvents(events: SimEvent[]): void;
}

export function eventRouterRig(overrides: Partial<EventRouterRig> = {}): EventRouterRig {
  const pane = chatPane();
  const rig = {
    sim: { playerId: 7 },
    chatLogEl: pane.chatLogEl,
    get chatTimestamps() {
      return pane.chatTimestamps;
    },
    set chatTimestamps(on: boolean) {
      pane.chatTimestamps = on;
    },
    hideIfFiltered: pane.hideIfFiltered,
    chatAnnouncer: pane.chatAnnouncer,
    log: vi.fn<ChatPane['log']>((...args) => pane.log(...args)),
    appendChatItemLink: pane.appendChatItemLink,
    showBanner: vi.fn(),
    errorToast: { show: vi.fn() },
    lootRolls: { closeForItem: vi.fn() },
    renderBags: vi.fn(),
    renderCrafting: vi.fn(),
    renderUnbind: vi.fn(),
    showError: vi.fn(),
    showSelfNote: vi.fn(),
    openUnbindNpcId: null,
    professionsWindow: { isOpen: false, render: vi.fn() },
    craftingWindowEl: null,
    craftCastExpectingResult: false,
    announceCraftCast: vi.fn(),
    celebrationDrain: { armCraftTierUps: vi.fn() },
    combatAnnouncer: { push: vi.fn() },
    charWindow: { renderIfOpen: vi.fn() },
    openProfessionTutorial: vi.fn(),
    questDialog: { refreshIfChanged: vi.fn() },
    showCelebrationBanner(text, bannerClass, variant, motion) {
      rig.showBanner(...celebrationBannerArgs(text, bannerClass, variant, motion));
    },
    refreshOpenProfessionSurfacesIfChanged() {
      surfaces.refreshIfChanged();
    },
    routeEvents(events) {
      for (const ev of events) {
        if (applyLootEventPresentation(rig, ev)) continue;
        applyProfessionEventPresentation(rig, ev);
      }
    },
    ...overrides,
  } as EventRouterRig;
  const surfaces = new ProfessionSurfaceRefresh({
    world: () => rig.sim as unknown as IWorld,
    renderCharWindowIfOpen: () => rig.charWindow.renderIfOpen(),
    renderCrafting: () => rig.renderCrafting(),
  });
  return rig;
}

/** The rendered chat lines, oldest first. */
export const chatLines = (rig: { chatLogEl: HTMLElement }): string[] =>
  [...rig.chatLogEl.children].map((el) => el.textContent ?? '');
