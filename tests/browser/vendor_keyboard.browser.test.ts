// Trusted browser keys exercise the real Input listener and vendor painter.
// A missing panel guard otherwise focuses chat before native button activation.
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Input, type InputCallbacks } from '../../src/game/input';
import { Keybinds } from '../../src/game/keybinds';
import { ITEMS, NPCS } from '../../src/sim/data';
import { Sim } from '../../src/sim/sim';
import { WORLD_SEED } from '../../src/sim/world_seed';
import { wireChromeFocus } from '../../src/ui/chrome_focus_wiring';
import {
  buildVendorView,
  renderVendorWindow,
  type VendorWindowDeps,
} from '../../src/ui/hud/vendor';
import { cleanup, host, stubDeps } from './_harness';

let current: ReturnType<typeof mount> | null = null;

beforeAll(() => {
  localStorage.clear();
  const canvas = document.createElement('canvas');
  new Input(
    canvas,
    stubDeps<InputCallbacks>({
      onUiKey: (key) => {
        if (key !== 'chat' || !current) return;
        current.chatOpens++;
        current.chat.style.display = 'block';
        current.chat.focus();
      },
      canUseGameKeys: () => true,
    }),
    new Keybinds(),
  );
});

afterEach(async () => {
  await userEvent.keyboard('[/Enter][/Space]');
  current = null;
  cleanup();
  document.body.className = '';
});

function mount() {
  document.body.className = 'game-active';
  const sim = new Sim({ seed: WORLD_SEED, playerClass: 'warrior', freeholdsEnabled: true });
  const npc = [...sim.entities.values()].find(
    (entity) => entity.templateId === 'freehold_furnisher',
  );
  if (!npc) throw new Error('The authored furnisher did not spawn.');
  sim.player.pos = { ...npc.pos };
  sim.player.prevPos = { ...npc.pos };
  const meta = sim.meta(sim.primaryId)!;
  meta.inventory.splice(0);
  meta.copper = 10_000;
  sim.drainEvents();
  const vendor = host('vendor-window');
  const chat = document.createElement('textarea');
  chat.id = 'chat-input';
  chat.style.display = 'none';
  document.body.appendChild(chat);
  const state = { sim, meta, vendor, chat, chatOpens: 0, purchases: 0 };
  wireChromeFocus(
    (selector) => document.querySelector<HTMLElement>(selector) ?? document.createElement('div'),
  );
  const paint = () =>
    renderVendorWindow(
      vendor,
      NPCS.freehold_furnisher.name,
      buildVendorView(npc.vendorItems, [], ITEMS, {
        copper: meta.copper,
        honor: 0,
        gatheringProficiency: {},
      }),
      stubDeps<VendorWindowDeps>({
        itemIcon: () => '',
        moneyHtml: () => '',
        itemTooltip: () => '',
        sellJunk: { enabled: false, proceeds: 0 },
        onBuy: (itemId, opts) => {
          state.purchases++;
          sim.buyItem(npc.id, itemId, opts);
          paint();
        },
      }),
    );
  paint();
  current = state;
  return state;
}

function bedButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>('[data-coach-item="freehold_timber_bed"]');
  if (!button) throw new Error('The actual vendor painter did not render the bed button.');
  return button;
}

describe('vendor keyboard activation', () => {
  it.each(['Enter', 'Space'])(
    '%s buys once through the focused native vendor button',
    async (key) => {
      const h = mount();
      bedButton(h.vendor).focus();
      await userEvent.keyboard(`[${key}]`);
      expect(h.chatOpens).toBe(0);
      expect(h.purchases).toBe(1);
      expect(h.sim.inventory).toEqual([{ itemId: 'freehold_timber_bed', count: 1 }]);
      expect(h.meta.copper).toBe(9750);
      expect(document.activeElement).toBe(bedButton(h.vendor));
      expect(h.sim.drainEvents().filter((event) => event.type === 'error')).toEqual([]);
    },
  );

  it('world Enter still opens empty chat and typing stays in the composer', async () => {
    const h = mount();
    document.body.focus();
    await userEvent.keyboard('[Enter]');
    expect(h.chatOpens).toBe(1);
    expect(document.activeElement).toBe(h.chat);
    expect(h.chat.value).toBe('');
    await userEvent.keyboard('hello');
    expect(h.chat.value).toBe('hello');
    expect(h.chatOpens).toBe(1);
    expect(h.purchases).toBe(0);
    expect(h.sim.inventory).toEqual([]);
  });
});
