import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import { recalcPlayerStats } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type {
  ArmorItemDef,
  EquipSlot,
  HeldOffhandItemDef,
  ItemDef,
  ItemInstancePayload,
  JewelryItemDef,
  PlayerClass,
  WeaponItemDef,
} from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';
import { EMPTY_TEST_WORLD } from './sim_shared';

type Gear = ArmorItemDef | HeldOffhandItemDef | JewelryItemDef | WeaponItemDef;
const WEAPON: WeaponItemDef = {
  id: 'test_furnishing_auto_weapon',
  name: 'Auto Weapon',
  kind: 'weapon',
  slot: 'mainhand',
  hand: 'onehand',
  quality: 'common',
  sellValue: 1,
  requiredLevel: 1,
  weapon: { min: 10, max: 10, speed: 2 },
};
const ARMOR: ArmorItemDef = {
  id: 'test_furnishing_auto_armor',
  name: 'Auto Armor',
  kind: 'armor',
  slot: 'helmet',
  armorType: 'mail',
  quality: 'common',
  sellValue: 1,
  requiredLevel: 1,
  stats: { armor: 10 },
};
const SHIELD: ArmorItemDef = {
  ...ARMOR,
  id: 'test_furnishing_auto_shield',
  name: 'Auto Shield',
  slot: 'offhand',
  shield: true,
};
const HELD: HeldOffhandItemDef = {
  id: 'test_furnishing_auto_held',
  name: 'Auto Orb',
  kind: 'held_offhand',
  slot: 'offhand',
  quality: 'common',
  sellValue: 1,
  requiredLevel: 1,
  stats: { armor: 10 },
};
const NECK: JewelryItemDef = {
  id: 'test_furnishing_auto_neck',
  name: 'Auto Pendant',
  kind: 'armor',
  slot: 'neck',
  quality: 'common',
  sellValue: 1,
  requiredLevel: 1,
  stats: { armor: 10 },
};
const ROWS: { name: string; slot: EquipSlot; def: Gear }[] = [
  { name: 'mainhand weapon', slot: 'mainhand', def: WEAPON },
  { name: 'helmet armor', slot: 'helmet', def: ARMOR },
  { name: 'offhand shield', slot: 'offhand', def: SHIELD },
  { name: 'held offhand', slot: 'offhand', def: HELD },
  { name: 'neck jewelry', slot: 'neck', def: NECK },
];
const WORN_ID = 'test_furnishing_auto_worn';
const COPY: ItemInstancePayload = {
  signer: 'Auto Maker',
  rolled: { stats: { str: 9999, armor: 9999 } },
};
// A real worn copy with no rolled line: auto-equip compares resolved armor, which
// counts a worn copy's rolled stats (src/sim/auto_equip.ts resolvedArmor), so the
// real-gear rows below must not let COPY's forged 9999 decide the comparison.
const WORN_COPY: ItemInstancePayload = { signer: 'Auto Maker' };
const IDS = [FURNISHING.id, WORN_ID, ...ROWS.map((row) => row.def.id)];

beforeEach(() => {
  ITEMS[FURNISHING.id] = {
    ...FURNISHING,
    slot: 'mainhand',
    weapon: { min: 9999, max: 9999, speed: 1 },
    stats: { armor: 9999 },
  } as unknown as ItemDef;
  for (const row of ROWS) ITEMS[row.def.id] = structuredClone(row.def);
});
afterEach(() => {
  for (const id of IDS) delete ITEMS[id];
});

function world(
  slot: EquipSlot,
  itemId: string,
  playerClass: PlayerClass = 'warrior',
  copy: ItemInstancePayload = COPY,
) {
  const sim = new Sim({
    seed: 737,
    playerClass,
    autoEquip: false,
    world: EMPTY_TEST_WORLD,
  });
  const meta = sim.meta(sim.playerId)!;
  meta.inventory.splice(0);
  meta.equipment = { [slot]: itemId };
  meta.equipmentInstance = { [slot]: structuredClone(copy) };
  recalcPlayerStats(sim.player, playerClass, meta.equipment, undefined, meta.equipmentInstance);
  meta.autoEquip = true;
  sim.drainEvents();
  return sim;
}

describe('furnishing does not suppress automatic gear upgrades', () => {
  it.each(ROWS)('grants and wears a real $name while returning the furnishing copy', (row) => {
    const sim = world(row.slot, FURNISHING.id);
    expect(sim.equipment[row.slot]).toBe(FURNISHING.id);
    expect(sim.countItem(FURNISHING.id)).toBe(0);

    sim.addItem(row.def.id, 1);

    expect(sim.equipment).toEqual({ [row.slot]: row.def.id });
    expect(sim.equipmentInstances[row.slot]).toBeUndefined();
    expect(sim.inventory).toEqual([{ itemId: FURNISHING.id, count: 1, instance: COPY }]);
    expect(sim.countItem(row.def.id)).toBe(0);
    expect(sim.countItem(FURNISHING.id)).toBe(1);
    expect(sim.drainEvents().filter((event) => event.type === 'error')).toEqual([]);
  });

  it.each(ROWS)('keeps stronger or equal real $name and replaces a weaker one', (row) => {
    for (const amount of [100, 10, 1]) {
      ITEMS[WORN_ID] =
        row.def.kind === 'weapon'
          ? { ...row.def, id: WORN_ID, weapon: { min: amount, max: amount, speed: 2 } }
          : { ...row.def, id: WORN_ID, stats: { armor: amount } };
      const sim = world(row.slot, WORN_ID, 'warrior', WORN_COPY);

      sim.addItem(row.def.id, 1);

      if (amount >= 10) {
        expect(sim.equipment).toEqual({ [row.slot]: WORN_ID });
        expect(sim.equipmentInstances[row.slot]).toEqual(WORN_COPY);
        expect(sim.inventory).toEqual([{ itemId: row.def.id, count: 1 }]);
      } else {
        expect(sim.equipment).toEqual({ [row.slot]: row.def.id });
        expect(sim.equipmentInstances[row.slot]).toBeUndefined();
        expect(sim.inventory).toEqual([{ itemId: WORN_ID, count: 1, instance: WORN_COPY }]);
      }
      expect(sim.drainEvents().filter((event) => event.type === 'error')).toEqual([]);
    }
  });

  it('keeps a valid offhand weapon when a held offhand has no greater armor', () => {
    ITEMS[HELD.id] = { ...HELD, stats: {} };
    const sim = world('offhand', WEAPON.id, 'rogue');

    sim.addItem(HELD.id, 1);

    expect(sim.equipment).toEqual({ offhand: WEAPON.id });
    expect(sim.equipmentInstances.offhand).toEqual(COPY);
    expect(sim.inventory).toEqual([{ itemId: HELD.id, count: 1 }]);
  });

  it('does not auto-equip a furnishing grant carrying forged equipment fields', () => {
    const sim = world('mainhand', WEAPON.id);
    const equipment = structuredClone(sim.equipment);
    const instances = structuredClone(sim.equipmentInstances);

    sim.addItem(FURNISHING.id, 1);

    expect(sim.equipment).toEqual(equipment);
    expect(sim.equipmentInstances).toEqual(instances);
    expect(sim.inventory).toEqual([{ itemId: FURNISHING.id, count: 1 }]);
  });
});
