// @vitest-environment happy-dom
// The bags 'use' click routing (#2343): drives the REAL BagsWindow against a
// happy-dom container (the bags_window_instance_marker.test.ts fixture idiom) and
// pins the behavior the source pin in bags_window.test.ts can only anchor
// textually: a click on a usable item tries the gathering-tool hook first, a
// consumed use never reaches world.useItem, and a declined use (a non-tool,
// or the hook unwired on this host) falls back to exactly one plain useItem.
import { describe, expect, it } from 'vitest';
import type { InvSlot, ItemDef } from '../src/sim/types';
import { BagsWindow, type BagsWindowDeps } from '../src/ui/bags_window';
import { ItemDragState } from '../src/ui/item_drag_state';
import type { IWorld } from '../src/world_api';

function harness(
  inventory: InvSlot[],
  useGatherTool: (item: ItemDef) => boolean,
  options: { cfg?: { freeholdsEnabled?: boolean }; touch?: boolean; trade?: boolean } = {},
): {
  root: HTMLElement;
  usedItems: string[];
  gatherToolCalls: ItemDef[];
  feastPlacements: number[];
  errors: string[];
  menuDefaults: (() => void)[];
  tradedItems: string[];
} {
  const usedItems: string[] = [];
  const gatherToolCalls: ItemDef[] = [];
  const feastPlacements: number[] = [];
  const errors: string[] = [];
  const menuDefaults: (() => void)[] = [];
  const tradedItems: string[] = [];
  const world = {
    cfg: options.cfg ?? {},
    inventory,
    bags: [null, null, null, null],
    bagCapacity: 16,
    copper: 0,
    useItem: (itemId: string) => {
      usedItems.push(itemId);
    },
    placeFeast: () => {
      feastPlacements.push(1);
    },
  } as unknown as IWorld;
  const root = document.createElement('div');
  document.body.appendChild(root);
  const noop = (): void => {};
  const deps: BagsWindowDeps = {
    itemIcon: () => '<span class="item-icon"></span>',
    moneyHtml: () => '',
    itemTooltip: () => '',
    attachTooltip: noop,
    root: () => root,
    world: () => world,
    wocBalanceHtml: () => '',
    claudiumLauncherHtml: () => '',
    openClaudium: noop,
    openWallet: noop,
    hideTooltip: noop,
    consumePeek: () => false,
    cancelPetFeed: noop,
    captureFocus: () => null,
    restoreFocus: noop,
    renderCharIfOpen: noop,
    vendorOpen: () => false,
    tradeOpen: () => options.trade === true,
    isMarketSell: () => false,
    isMailAttach: () => false,
    isBankOpen: () => false,
    isPersonalBankTab: () => false,
    isGuildBankTab: () => false,
    isVaultBankTab: () => false,
    pendingPetFeed: () => false,
    closeVendor: noop,
    closeBank: noop,
    onClosed: noop,
    addItemToTrade: (itemId) => tradedItems.push(itemId),
    stageMarketSell: noop,
    stageMailParcel: noop,
    insertItemChatLink: noop,
    showError: (message) => errors.push(message),
    setPendingPetFeed: noop,
    resetPetBarSig: noop,
    isHotbarItemId: () => false,
    useGatherTool: (item) => {
      gatherToolCalls.push(item);
      return useGatherTool(item);
    },
    setDragAction: noop,
    clearActionDropTargets: noop,
    dragState: new ItemDragState(),
    isTouchHud: () => options.touch === true,
    confirmVendorSell: () => true,
    markEquipDropTargets: noop,
    dropOnEquipSlot: noop,
    dropOnActionSlot: noop,
    dropOnActionRingSlot: noop,
    openItemActionMenu: (_def, _itemId, _target, _x, _y, runDefault) =>
      menuDefaults.push(runDefault),
  };
  new BagsWindow(deps).render();
  return { root, usedItems, gatherToolCalls, feastPlacements, errors, menuDefaults, tradedItems };
}

function clickFirstCell(root: HTMLElement): void {
  const cell = root.querySelector('button.bag-item');
  expect(cell).not.toBeNull();
  cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('bags use-click gathering-tool routing (#2343)', () => {
  it('a consumed gathering-tool use never falls back to world.useItem', () => {
    const { root, usedItems, gatherToolCalls } = harness(
      [{ itemId: 'copper_mining_pick', count: 1 }],
      () => true,
    );
    clickFirstCell(root);
    expect(gatherToolCalls.map((i) => i.id)).toEqual(['copper_mining_pick']);
    expect(usedItems).toEqual([]);
  });

  it('a declined use falls back to exactly one plain world.useItem', () => {
    const { root, usedItems, gatherToolCalls } = harness(
      [{ itemId: 'copper_mining_pick', count: 1 }],
      () => false,
    );
    clickFirstCell(root);
    expect(gatherToolCalls).toHaveLength(1);
    expect(usedItems).toEqual(['copper_mining_pick']);
  });

  it('a plain consumable also rides the hook-then-fallback path (the non-tool arm)', () => {
    const { root, usedItems, gatherToolCalls } = harness(
      [{ itemId: 'baked_bread', count: 1 }],
      () => false,
    );
    clickFirstCell(root);
    expect(gatherToolCalls.map((i) => i.id)).toEqual(['baked_bread']);
    expect(usedItems).toEqual(['baked_bread']);
  });

  it('a feast click reaches world.placeFeast once, never useItem (Farming Phase 12)', () => {
    // The behavioral half the source pin in bags_window.test.ts cannot see:
    // a REAL click on the feast cell must route to the placeFeast case, not
    // the 'use' ladder (no gathering-tool probe, no useItem fallback).
    const { root, usedItems, gatherToolCalls, feastPlacements } = harness(
      [{ itemId: 'harvest_feast', count: 1 }],
      () => false,
    );
    clickFirstCell(root);
    expect(feastPlacements, 'exactly one placement').toHaveLength(1);
    expect(usedItems).toEqual([]);
    expect(gatherToolCalls).toEqual([]);
  });
});

describe.each([
  'pattern_freehold_clockwork_lamp',
  'pattern_freehold_chart_easel',
  'pattern_freehold_jewel_floor_lamp',
])('retained furnishing manual use feedback: %s', (itemId) => {
  it.each([undefined, false, true])(
    'voices current realm availability %s after touch Use',
    (flag) => {
      const h = harness([{ itemId, count: 1 }], () => false, {
        cfg: { freeholdsEnabled: flag },
        touch: true,
      });
      clickFirstCell(h.root);
      expect(h.menuDefaults).toHaveLength(1);
      expect(h.errors).toEqual([]);
      expect(h.usedItems).toEqual([]);
      h.menuDefaults[0]();
      expect(h.errors).toEqual(flag === true ? [] : ['Freeholds are not available on this realm.']);
      expect(h.usedItems).toEqual(flag === true ? [itemId] : []);
    },
  );

  it('reads capability again when the already-open touch menu activates', () => {
    const cfg = { freeholdsEnabled: true };
    const h = harness([{ itemId, count: 1 }], () => false, { cfg, touch: true });
    clickFirstCell(h.root);
    expect(h.menuDefaults).toHaveLength(1);
    cfg.freeholdsEnabled = false;
    h.menuDefaults[0]();
    expect(h.errors).toEqual(['Freeholds are not available on this realm.']);
    expect(h.usedItems).toEqual([]);
    cfg.freeholdsEnabled = true;
    h.menuDefaults[0]();
    expect(h.usedItems).toEqual([itemId]);
    expect(h.errors).toHaveLength(1);
  });

  it('gives the same refusal on a direct desktop click', () => {
    const h = harness([{ itemId, count: 1 }], () => false);
    clickFirstCell(h.root);
    expect(h.menuDefaults).toEqual([]);
    expect(h.errors).toEqual(['Freeholds are not available on this realm.']);
    expect(h.usedItems).toEqual([]);
  });

  it('preserves trade mode on an unavailable realm', () => {
    const h = harness([{ itemId, count: 1 }], () => false, { touch: true, trade: true });
    clickFirstCell(h.root);
    expect(h.menuDefaults).toEqual([]);
    expect(h.errors).toEqual([]);
    expect(h.usedItems).toEqual([]);
    expect(h.tradedItems).toEqual([itemId]);
  });
});

describe.each(['pattern_ironhusk_flask', 'pattern_crucible_str_mail', 'formula_lastflame_zeal'])(
  'ordinary manual touch routing: %s',
  (itemId) => {
    it.each([undefined, false, true])('retains ordinary Use with capability %s', (flag) => {
      const h = harness([{ itemId, count: 1 }], () => false, {
        cfg: { freeholdsEnabled: flag },
        touch: true,
      });
      clickFirstCell(h.root);
      expect(h.menuDefaults).toHaveLength(1);
      h.menuDefaults[0]();
      expect(h.errors).toEqual([]);
      expect(h.usedItems).toEqual([itemId]);
    });
  },
);
