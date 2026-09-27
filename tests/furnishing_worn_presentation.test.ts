// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEM_SETS, ITEMS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { EquipSlot, ItemDef, ItemInstancePayload } from '../src/sim/types';
import { CharWindow } from '../src/ui/char_window';
import { Hud } from '../src/ui/hud';
import { setLanguage } from '../src/ui/i18n';
import { ITEM_IMAGE_IDS, iconDataUrl } from '../src/ui/icons';
import { ItemDragState } from '../src/ui/item_drag_state';
import {
  equippedSetTooltipPieces,
  itemSetMemberCounts,
  itemSetTooltipModel,
} from '../src/ui/item_set_tooltip_view';
import {
  masterwroughtCapReadout,
  masterwroughtTooltipLines,
  wornMasterwroughtSlots,
} from '../src/ui/masterwrought_cap_view';
import type { IWorld } from '../src/world_api';
import { FURNISHING } from './fixtures/furnishing_item';
import { bareClient } from './helpers/bare_client';
import { EMPTY_TEST_WORLD } from './sim_shared';

vi.mock('../src/render/characters', () => ({
  CharacterPreview: class {},
  modularLookFor: vi.fn(() => null),
}));
vi.mock('../src/render/characters/assets', () => ({ preloadMechAssets: vi.fn() }));
vi.mock('../src/render/characters/portrait', () => ({
  onPortraitsReady: vi.fn(),
  onPortraitUpdate: vi.fn(),
  playerPortraitDataUrl: vi.fn(),
  portraitsReady: vi.fn(() => false),
  visualPortraitDataUrl: vi.fn(),
}));

// This suite paints item rows and tooltips; class-crest image decoding is unrelated.
vi.mock('../src/ui/crest_image_fallback', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/ui/crest_image_fallback')>()),
  hydrateCrestImageFallbacks: vi.fn(),
}));

const SET = 'probe_furnishing_worn_set';
const RELATED_SET = 'probe_furnishing_worn_related_set';
const furniture = {
  ...FURNISHING,
  id: 'probe_furnishing_worn_presentation',
  set: SET,
  masterwrought: true,
} as unknown as ItemDef;
const helmet = {
  id: 'probe_furnishing_worn_helmet',
  name: 'Worn Test Helmet',
  kind: 'armor',
  slot: 'helmet',
  armorType: 'mail',
  quality: 'rare',
  sellValue: 0,
  set: SET,
  masterwrought: true,
} satisfies ItemDef;
const chest = { ...helmet, id: 'probe_furnishing_worn_chest', slot: 'chest' } satisfies ItemDef;
const waist = {
  ...helmet,
  id: 'probe_furnishing_worn_waist',
  slot: 'waist',
  set: RELATED_SET,
} satisfies ItemDef;
const gloves = { ...waist, id: 'probe_furnishing_worn_gloves', slot: 'gloves' } satisfies ItemDef;
const fixtures = [furniture, helmet, chest, waist, gloves];
const hadEmptySlotImage = ITEM_IMAGE_IDS.has('slot_empty');

beforeEach(() => {
  setLanguage('en');
  for (const item of fixtures.slice(0, -1)) ITEMS[item.id] = item;
  for (const item of fixtures) ITEM_IMAGE_IDS.add(item.id);
  ITEM_IMAGE_IDS.add('slot_empty');
  for (const id of [SET, RELATED_SET]) {
    ITEM_SETS[id] = {
      id,
      name: 'Worn Test Set',
      lineage: 'probe_furnishing_worn_lineage',
      bonuses: [{ pieces: 2, effect: { str: 10 }, text: 'Increases Strength by 10.' }],
    };
  }
});

afterEach(() => {
  for (const item of fixtures) {
    delete ITEMS[item.id];
    ITEM_IMAGE_IDS.delete(item.id);
  }
  if (!hadEmptySlotImage) ITEM_IMAGE_IDS.delete('slot_empty');
  delete ITEM_SETS[SET];
  delete ITEM_SETS[RELATED_SET];
  document.body.innerHTML = '';
  setLanguage('en');
});

function tooltip(world: IWorld, item: ItemDef, instance?: ItemInstancePayload): HTMLElement {
  const hud = Object.create(Hud.prototype) as {
    sim: IWorld;
    itemTooltip(item: ItemDef, compare: boolean, instance?: ItemInstancePayload): string;
  };
  hud.sim = world;
  const root = document.createElement('div');
  root.innerHTML = hud.itemTooltip(item, false, instance);
  return root;
}

function renderSheet(
  equipment: Partial<Record<EquipSlot, string>>,
  host: 'offline' | 'online' = 'offline',
) {
  const offline = new Sim({
    seed: 42,
    playerClass: 'warrior',
    autoEquip: false,
    world: EMPTY_TEST_WORLD,
  });
  Object.assign(offline.equipment, equipment);
  offline.equipmentInstances.chest = {
    signer: '<Maker>',
    locked: true,
    rolled: { stats: { str: 999 }, quality: 'legendary' },
  };
  const world: IWorld =
    host === 'offline'
      ? offline
      : bareClient(offline.playerId, {
          entities: new Map([[offline.playerId, structuredClone(offline.player)]]),
          equipment: { ...offline.equipment },
          equipmentInstances: structuredClone(offline.equipmentInstances),
        });
  const root = document.createElement('div');
  const tips = new Map<Element, () => string>();
  const win = new CharWindow({
    root: () => root,
    world: () => world,
    closeOthers: vi.fn(),
    hideTooltip: vi.fn(),
    captureFocus: () => null,
    restoreFocus: vi.fn(),
    slotName: (slot) => slot,
    statCellHtml: () => '',
    statTooltipHtml: () => '',
    progressionHtml: () => '',
    unequip: vi.fn(),
    beginUnequipDrag: vi.fn(),
    endUnequipDrag: vi.fn(),
    renderPreview: vi.fn(),
    renderSkinPicker: vi.fn(),
    openPlayerCard: vi.fn(),
    openPrestige: vi.fn(),
    openDeeds: vi.fn(),
    openReliquary: vi.fn(),
    openCosmetics: vi.fn(),
    dragState: new ItemDragState(),
    renderBags: vi.fn(),
    showError: vi.fn(),
    helmSlotAvailable: () => false,
    helmHidden: () => false,
    toggleHelm: vi.fn(),
    playtimeVisible: () => false,
    togglePlaytimeVisible: vi.fn(),
    itemIcon: (item) => `<img class="item-icon" src="${iconDataUrl('item', item.id)}" alt="">`,
    moneyHtml: () => '',
    wornItemTooltip: (item, instance) => tooltip(world, item, instance).innerHTML,
    attachTooltip: (el, resolve) => tips.set(el, resolve),
  });
  win.render();
  const slotTooltip = (slot: EquipSlot): string => {
    const row = root.querySelector(`#equip-slot-${slot}`);
    const resolve = row && tips.get(row);
    if (!resolve) throw new Error(`Missing worn tooltip for ${slot}`);
    const out = document.createElement('div');
    out.innerHTML = resolve();
    return out.textContent ?? '';
  };
  return { root, world, win, slotTooltip };
}

describe('furnishing worn presentation boundaries', () => {
  it('excludes furnishing from catalog set denominators while eligible slots extend the lineage', () => {
    expect(itemSetMemberCounts()[SET]).toBe(3);
    expect(itemSetMemberCounts()[RELATED_SET]).toBe(3);
    ITEMS[gloves.id] = gloves;
    expect(itemSetMemberCounts()[SET]).toBe(4);
    expect(itemSetMemberCounts()[RELATED_SET]).toBe(4);
    expect(ITEMS[furniture.id]).toBe(furniture);
  });

  it('leaves furnishing out of worn set counts and tier activation with an eligible gear control', () => {
    const equipment = [helmet.id, furniture.id];
    const before = [...equipment];
    for (const setId of [SET, RELATED_SET]) {
      expect(equippedSetTooltipPieces(setId, equipment)).toBe(1);
      expect(
        itemSetTooltipModel({
          itemSetId: setId,
          equippedPieces: equippedSetTooltipPieces(setId, equipment),
          itemSetMembers: itemSetMemberCounts(),
        }),
      ).toEqual({
        setId,
        equippedPieces: 1,
        totalPieces: 3,
        bonusTiers: [{ pieces: 2, active: false }],
      });
      expect(equippedSetTooltipPieces(setId, [helmet.id, chest.id])).toBe(2);
    }
    expect(equipment).toEqual(before);
  });

  it.each(['offline', 'online'] as const)(
    'the %s gear tooltip keeps the set tier inactive beside furnishing and activates it for armor',
    (host) => {
      const { world } = renderSheet({ helmet: helmet.id, chest: furniture.id }, host);
      const withFurniture = tooltip(world, helmet);
      expect(withFurniture.querySelector('.tt-set-name')?.textContent).toBe('Worn Test Set (1/3)');
      expect(withFurniture.querySelectorAll('.tt-set-bonus.active')).toHaveLength(0);
      expect(withFurniture.querySelector('.tt-set-bonus')?.textContent).toContain(
        'Increases Strength by 10.',
      );
      world.equipment.chest = chest.id;
      const withArmor = tooltip(world, helmet);
      expect(withArmor.querySelector('.tt-set-name')?.textContent).toBe('Worn Test Set (2/3)');
      expect(withArmor.querySelectorAll('.tt-set-bonus.active')).toHaveLength(1);
    },
  );

  it('excludes furnishing from the Masterwrought cap and at-cap tooltip with an eligible armor control', () => {
    const equipment = { helmet: helmet.id, chest: furniture.id };
    expect(wornMasterwroughtSlots(equipment, ITEMS)).toEqual(['helmet']);
    expect(masterwroughtCapReadout(equipment, ITEMS)).toEqual({ used: 1, cap: 2, atCap: false });
    expect(masterwroughtTooltipLines(equipment, ITEMS).map((line) => line.key)).toEqual([
      'hudChrome.itemMasterwrought',
    ]);
    expect(masterwroughtCapReadout({ chest: furniture.id }, ITEMS)).toBeNull();
    equipment.chest = chest.id;
    expect(wornMasterwroughtSlots(equipment, ITEMS)).toEqual(['helmet', 'chest']);
    expect(masterwroughtCapReadout(equipment, ITEMS)).toEqual({ used: 2, cap: 2, atCap: true });
    expect(masterwroughtTooltipLines(equipment, ITEMS)[1]).toEqual({
      key: 'hudChrome.masterwrought.tooltipAtCap',
      values: { cap: '2' },
    });
  });

  it.each(['offline', 'online'] as const)(
    'the %s paperdoll retains the furnishing copy without a Masterwrought chip or slot claim',
    (host) => {
      const { root, world, win, slotTooltip } = renderSheet(
        {
          helmet: helmet.id,
          chest: furniture.id,
        },
        host,
      );
      const before = structuredClone(world.equipmentInstances);
      expect(root.querySelector('.char-mw-slots-value')?.textContent).toBe('1 / 2');
      expect(root.querySelectorAll('.equip-mw-chip')).toHaveLength(1);
      expect(root.querySelector('#equip-slot-chest .equip-mw-chip')).toBeNull();
      expect(root.querySelector('#equip-slot-chest .slot-item')?.textContent).toBe(
        'Steel Side Table',
      );
      expect(slotTooltip('chest')).toContain('Made by <Maker>.');
      expect(slotTooltip('chest')).not.toMatch(/Masterwrought|Strength|Legendary/);
      expect(slotTooltip('helmet')).toContain('Occupies a Masterwrought slot (1 of 2 in use).');
      expect(world.equipment.chest).toBe(furniture.id);
      expect(world.equipmentInstances).toEqual(before);
      world.equipment.chest = chest.id;
      expect(slotTooltip('helmet')).toContain('Occupies a Masterwrought slot (2 of 2 in use).');
      win.render();
      expect(root.querySelector('.char-mw-slots-value')?.textContent).toBe('2 / 2');
      expect(root.querySelectorAll('.equip-mw-chip')).toHaveLength(2);
      expect(slotTooltip('chest')).toContain('Occupies a Masterwrought slot (2 of 2 in use).');
    },
  );
});
