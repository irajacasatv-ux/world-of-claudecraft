// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, ITEMS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { InvSlot, ItemDef, ItemInstancePayload } from '../src/sim/types';
import { buildMarketCollect } from '../src/ui/market_view';
import { MarketWindow } from '../src/ui/market_window';
import type { IWorld, MarketInfo } from '../src/world_api';
import { FURNISHING } from './fixtures/furnishing_item';

const GEAR: ItemDef = {
  id: 'test_furnishing_sale_gear',
  name: 'Control Sword',
  kind: 'weapon',
  slot: 'mainhand',
  sellValue: 1,
  quality: 'epic',
  requiredLevel: 1,
  weapon: { min: 5, max: 7, speed: 2 },
};
const COPY: ItemInstancePayload = {
  name: 'Unsupported House Name',
  signer: 'Testmaker',
  rolled: { quality: 'legendary', masterwork: true, stats: { str: 999 } },
};

beforeEach(() => {
  ITEMS[FURNISHING.id] = structuredClone(FURNISHING);
  ITEMS[GEAR.id] = structuredClone(GEAR);
});
afterEach(() => {
  delete ITEMS[FURNISHING.id];
  delete ITEMS[GEAR.id];
  document.body.replaceChildren();
});

function world(): Sim {
  return new Sim({
    seed: 73,
    playerClass: 'warrior',
    noPlayer: true,
    autoEquip: false,
    world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
  });
}
function seller(sim: Sim): number {
  const pid = sim.addPlayer('warrior', 'Seller', { characterId: 701 });
  atMerchant(sim, pid);
  sim.meta(pid)!.inventory.splice(0);
  sim.meta(pid)!.copper = 0;
  return pid;
}
function atMerchant(sim: Sim, pid: number): void {
  const merchant = [...sim.entities.values()].find((e) => e.templateId === 'the_merchant');
  expect(merchant).toBeDefined();
  const player = sim.entities.get(pid)!;
  player.pos = { ...merchant!.pos };
  player.prevPos = { ...player.pos };
  sim.rebucket(player);
}
function renderCollect(info: MarketInfo): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const noop = (): void => {};
  const mirror = {
    marketInfo: info,
    marketCollectPending: true,
    inventory: [],
    marketSearch: noop,
    marketSellPriceCheck: noop,
  };
  const window = new MarketWindow({
    root: () => root,
    world: () => mirror as unknown as IWorld,
    itemIcon: () => '<span class="item-icon"></span>',
    moneyHtml: (copper) => `<span data-copper="${copper}"></span>`,
    itemTooltip: () => '',
    attachTooltip: noop,
    closeOthers: noop,
    hideTooltip: noop,
    captureFocus: () => null,
    restoreFocus: noop,
    showError: noop,
    slotName: (slot) => slot,
    syncBags: noop,
    confirmDialog: noop,
  });
  window.open();
  const collect = root.querySelector<HTMLButtonElement>('[data-tab="collect"]');
  expect(collect).not.toBeNull();
  collect!.click();
  return root;
}

function purchase(
  sim: Sim,
  sellerId: number,
  buyer: number,
  itemId: string,
  price: number,
): InvSlot {
  const slot: InvSlot = { itemId, count: 1, instance: structuredClone(COPY) };
  sim.meta(sellerId)!.inventory.push(structuredClone(slot));
  sim.marketListInstance(itemId, price, COPY, sellerId);
  expect(sim.meta(sellerId)!.inventory.some((copy) => copy.itemId === itemId)).toBe(false);
  const listing = sim.marketListings.find((row) => !row.house && row.itemId === itemId);
  expect(listing).toBeDefined();
  expect(listing!.instance).toEqual(COPY);
  sim.marketBuy(listing!.id, buyer);
  expect(sim.marketListings.some((row) => row.id === listing!.id)).toBe(false);
  const received = sim.meta(buyer)!.inventory.find((copy) => copy.itemId === itemId);
  expect(received).toEqual(slot);
  return slot;
}

describe('furnishing sale identity', () => {
  it('omits unsupported chosen names at purchase while preserving money, custody and named gear', () => {
    const sim = world();
    const sellerId = seller(sim);
    const buyer = sim.addPlayer('warrior', 'Buyer');
    atMerchant(sim, buyer);
    sim.meta(buyer)!.inventory.splice(0);
    sim.meta(buyer)!.copper = 10000;
    const furnishing = purchase(sim, sellerId, buyer, FURNISHING.id, 1000);
    const gear = purchase(sim, sellerId, buyer, GEAR.id, 2000);
    expect(sim.meta(buyer)!.inventory).toEqual([furnishing, gear]);
    expect(sim.meta(buyer)!.copper).toBe(7000);
    expect(sim.meta(sellerId)!.copper).toBe(0);
    const info = sim.marketInfoFor(sellerId)!;
    expect(info.collectionCopper).toBe(2850);
    expect(info.collectionSales).toEqual([
      { itemId: FURNISHING.id, count: 1, price: 1000, proceeds: 950, buyerName: 'Buyer' },
      {
        itemId: GEAR.id,
        itemName: COPY.name,
        count: 1,
        price: 2000,
        proceeds: 1900,
        buyerName: 'Buyer',
      },
    ]);
    const saved = JSON.parse(JSON.stringify(sim.serializeMarket()));
    const restored = world();
    const restoredSeller = seller(restored);
    restored.loadMarket(saved);
    const loaded = restored.marketInfoFor(restoredSeller)!;
    expect(loaded.collectionSales).toEqual(info.collectionSales);
    expect(loaded.collectionCopper).toBe(2850);
    const model = buildMarketCollect(loaded);
    expect(model.state).toBe('items');
    if (model.state !== 'items') throw new Error('missing sale model');
    expect(model.sales.map((row) => row.itemName)).toEqual([undefined, COPY.name]);
    const root = renderCollect(loaded);
    expect(
      [...root.querySelectorAll('.mkt-sale-name > span:first-child')].map(
        (node) => node.textContent,
      ),
    ).toEqual([FURNISHING.name, COPY.name]);
    expect(
      [...root.querySelectorAll('.mkt-sale [data-copper]')].map((node) =>
        node.getAttribute('data-copper'),
      ),
    ).toEqual(['950', '1900']);
    expect(root.querySelectorAll('.mkt-sale-buyer')).toHaveLength(2);
    restored.marketCollect(restoredSeller);
    expect(restored.meta(restoredSeller)!.copper).toBe(2850);
    expect(restored.marketInfoFor(restoredSeller)!.collectionSales).toEqual([]);
  });

  it('projects stale loaded furnishing sale names away without changing the stored ledger or gear name', () => {
    const sim = world();
    const pid = seller(sim);
    const buyer = sim.addPlayer('warrior', 'Buyer');
    atMerchant(sim, buyer);
    sim.meta(buyer)!.inventory.splice(0);
    sim.meta(buyer)!.copper = 5000;
    purchase(sim, pid, buyer, FURNISHING.id, 1000);
    purchase(sim, pid, buyer, GEAR.id, 2000);
    const saved = JSON.parse(JSON.stringify(sim.serializeMarket()));
    const collection = saved.collections.find((row: { copper: number }) => row.copper === 2850);
    expect(collection).toBeDefined();
    collection.sales.entries[0].itemName = '<Forged & Name>';
    const restored = world();
    const restoredSeller = seller(restored);
    restored.loadMarket(saved);
    const before = structuredClone(restored.serializeMarket());
    const loaded = restored.marketInfoFor(restoredSeller)!;
    expect(loaded.collectionSales[0].itemName).toBe('<Forged & Name>');
    const model = buildMarketCollect(loaded);
    expect(model.state).toBe('items');
    if (model.state !== 'items') throw new Error('missing sale model');
    expect(model.sales[0]).toEqual({
      item: ITEMS[FURNISHING.id],
      count: 1,
      proceeds: 950,
      buyerName: 'Buyer',
    });
    expect(model.sales[1].itemName).toBe(COPY.name);
    const root = renderCollect(loaded);
    expect(
      [...root.querySelectorAll('.mkt-sale-name > span:first-child')].map(
        (node) => node.textContent,
      ),
    ).toEqual([FURNISHING.name, COPY.name]);
    expect(root.innerHTML).not.toContain('Forged');
    expect(restored.serializeMarket()).toEqual(before);
  });
});
