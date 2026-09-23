import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runWeaponProcs } from '../src/sim/combat/equip_procs';
import { setBonusFlag } from '../src/sim/content/ignivar_set_bonuses';
import { ITEMS } from '../src/sim/data';
import {
  createPlayer,
  type PlayerEquipment,
  type PlayerEquipmentInstances,
  recalcPlayerStats,
} from '../src/sim/entity';
import {
  isUniqueEquipped,
  masterwroughtConflictSlot,
  uniqueEquipConflictSlot,
} from '../src/sim/equipment_rules';
import { computeCharacterModifiers, wornSetCounts } from '../src/sim/set_bonus_mods';
import { Sim } from '../src/sim/sim';
import type {
  ArmorItemDef,
  Entity,
  FurnishingItemDef,
  ItemDef,
  ItemInstancePayload,
  WeaponItemDef,
} from '../src/sim/types';
import { expectDefined } from './helpers/defined';
import { EMPTY_TEST_WORLD } from './sim_shared';

const FURNISHING: FurnishingItemDef = {
  id: 'furnishing_equipment_fixture',
  name: 'Equipment Fixture',
  kind: 'furnishing',
  sellValue: 0,
  quality: 'common',
  furnishing: { footprint: { width: 1, depth: 1 }, r: 0, decorCost: 1, surface: 'floor' },
};
const ARMOR: ArmorItemDef = {
  id: 'furnishing_armor_control',
  name: 'Armor Control',
  kind: 'armor',
  slot: 'helmet',
  armorType: 'mail',
  sellValue: 0,
  quality: 'common',
  requiredLevel: 1,
};
const WEAPON: WeaponItemDef = {
  id: 'furnishing_weapon_control',
  name: 'Weapon Control',
  kind: 'weapon',
  slot: 'mainhand',
  sellValue: 0,
  weapon: { min: 100, max: 200, speed: 1 },
  weaponProcs: [
    {
      id: 'furnishing_proc_control',
      name: 'Proc Control',
      trigger: 'weaponHit',
      chance: 1,
      effects: [{ kind: 'hot', name: 'Proc Control', perTick: 7, interval: 1, duration: 10 }],
    },
  ],
};
const COPY: ItemInstancePayload = {
  signer: 'Testmaker',
  rolled: {
    stats: {
      str: 50,
      agi: 20,
      sta: 30,
      int: 40,
      spi: 60,
      armor: 70,
      spellPower: 80,
      critRating: 90,
      hasteRating: 100,
    },
  },
};
const fixtureIds = [FURNISHING.id, ARMOR.id, WEAPON.id];
const previous = new Map<string, ItemDef | undefined>();

beforeEach(() => {
  for (const id of fixtureIds) previous.set(id, ITEMS[id]);
  for (const def of [FURNISHING, ARMOR, WEAPON]) ITEMS[def.id] = structuredClone(def);
});
afterEach(() => {
  for (const id of fixtureIds) {
    const original = previous.get(id);
    if (original) ITEMS[id] = original;
    else delete ITEMS[id];
  }
  previous.clear();
  vi.restoreAllMocks();
});

function power(e: Entity) {
  return {
    stats: e.stats,
    weapon: e.weapon,
    offhandWeapon: e.offhandWeapon,
    mainhandItemId: e.mainhandItemId,
    offhandItemId: e.offhandItemId,
    dualWielding: e.dualWielding,
    titansGrip: e.titansGrip,
    attackPower: e.attackPower,
    rangedPower: e.rangedPower,
    spellPower: e.spellPower,
    healPower: e.healPower,
    critRating: e.critRating,
    hasteRating: e.hasteRating,
    hitRating: e.hitRating,
    hitBonus: e.hitBonus,
    meleeHaste: e.meleeHaste,
    rangedHaste: e.rangedHaste,
    spellHaste: e.spellHaste,
    sharedCritBonus: e.sharedCritBonus,
    critChance: e.critChance,
    blockChance: e.blockChance,
    blockValue: e.blockValue,
    dodgeChance: e.dodgeChance,
    castPushbackReduction: e.castPushbackReduction,
    knockbackResistance: e.knockbackResistance,
    ccDurationReduction: e.ccDurationReduction,
    setProcs: e.setProcs,
    maxHp: e.maxHp,
    maxResource: e.maxResource,
  };
}

function stats(equipment: PlayerEquipment, instances: PlayerEquipmentInstances = {}) {
  const e = createPlayer(1, 'warrior', { x: 0, y: 0, z: 0 }, 'Tester');
  recalcPlayerStats(e, 'warrior', equipment, undefined, instances);
  return e;
}

function loaded(equipment: PlayerEquipment, instances: PlayerEquipmentInstances = {}) {
  const sim = new Sim({
    seed: 73,
    playerClass: 'warrior',
    autoEquip: false,
    world: EMPTY_TEST_WORLD,
  });
  const state = expectDefined(sim.serializeCharacter(sim.playerId));
  state.equipment = structuredClone(equipment);
  state.equipmentInstance = structuredClone(instances);
  state.inventory = [{ itemId: FURNISHING.id, count: 1, instance: structuredClone(COPY) }];
  const before = structuredClone(state);
  const pid = sim.addPlayer('warrior', 'Restored', { state, autoEquip: false });
  const meta = expectDefined(sim.meta(pid));
  const entity = expectDefined(sim.entities.get(pid));
  const saved = expectDefined(sim.serializeCharacter(pid));
  expect(state).toEqual(before);
  expect(saved.equipment).toEqual(equipment);
  expect(saved.equipmentInstance ?? {}).toEqual(instances);
  expect(saved.inventory).toEqual(before.inventory);
  expect(entity.equippedItems).toEqual(equipment);
  expect(entity.equippedInstances).toEqual(instances);
  return { sim, pid, meta, entity };
}

describe('furnishing equipment power isolation', () => {
  it('restores typed copy stats without granting power or losing the saved copy', () => {
    const baseline = loaded({});
    const furnishing = loaded({ helmet: FURNISHING.id }, { helmet: COPY });
    expect(power(furnishing.entity)).toEqual(power(baseline.entity));
    expect(furnishing.entity.stats.str - baseline.entity.stats.str).toBe(0);
    const armor = loaded({ helmet: ARMOR.id }, { helmet: COPY });
    expect(armor.entity.stats.str - baseline.entity.stats.str).toBe(50);
    expect(armor.entity.critRating).toBe(90);
  });

  it('ignores malformed authored stats and ratings in the raw recalculation seam', () => {
    const capabilities = {
      stats: { str: 11, agi: 12, sta: 13, int: 14, spi: 15, armor: 16 },
      spellPower: 17,
      healPower: 18,
      critRating: 19,
      hasteRating: 20,
      hitRating: 21,
      pvpOffenseRating: 22,
      pvpDefenseRating: 23,
    };
    ITEMS[FURNISHING.id] = { ...FURNISHING, ...capabilities } as unknown as ItemDef;
    ITEMS[ARMOR.id] = { ...ARMOR, ...capabilities };
    const equipment = { helmet: FURNISHING.id };
    const instances = { helmet: structuredClone(COPY) };
    const before = structuredClone({ equipment, instances });
    const baseline = stats({});
    const furnishing = stats(equipment, instances);
    expect(power(furnishing)).toEqual(power(baseline));
    expect(furnishing.hitRating).toBe(0);
    expect({ equipment, instances }).toEqual(before);
    const armor = stats({ helmet: ARMOR.id }, instances);
    expect(armor.stats.str - baseline.stats.str).toBe(61);
    expect(armor.hitRating).toBe(21);
    expect(armor.healPower - armor.spellPower).toBe(18);
  });

  it('keeps malformed held furnishings unarmed after load while real weapons retain damage', () => {
    ITEMS[FURNISHING.id] = { ...FURNISHING, weapon: WEAPON.weapon } as unknown as ItemDef;
    const furnishing = loaded({ mainhand: FURNISHING.id, offhand: FURNISHING.id });
    expect(furnishing.entity.weapon).toEqual({ min: 1, max: 2, speed: 2 });
    expect(furnishing.entity.mainhandItemId).toBeNull();
    expect(furnishing.entity.offhandWeapon).toBeNull();
    expect(furnishing.entity.dualWielding).toBe(false);
    const weapon = loaded({ mainhand: WEAPON.id });
    expect(weapon.entity.weapon).toEqual({ min: 100, max: 200, speed: 1 });
    expect(weapon.entity.mainhandItemId).toBe(WEAPON.id);
  });

  it('does not grant stat-set bonuses or set procs for malformed furnishing membership', () => {
    ITEMS[FURNISHING.id] = { ...FURNISHING, set: 'deathlord' } as unknown as ItemDef;
    ITEMS[ARMOR.id] = { ...ARMOR, set: 'deathlord' };
    const equipment = {
      helmet: FURNISHING.id,
      chest: FURNISHING.id,
      legs: FURNISHING.id,
      feet: FURNISHING.id,
    };
    const before = structuredClone(equipment);
    const baseline = stats({});
    const furnishing = stats(equipment);
    expect(power(furnishing)).toEqual(power(baseline));
    expect(furnishing.setProcs).toEqual([]);
    expect(equipment).toEqual(before);
    const armor = stats({ helmet: ARMOR.id, chest: ARMOR.id, legs: ARMOR.id, feet: ARMOR.id });
    expect(armor.stats.str - baseline.stats.str).toBe(10);
    expect(armor.attackPower - baseline.attackPower).toBe(45);
    expect(armor.setProcs.map((proc) => proc.id)).toEqual(['set_gravemight']);
  });

  it('excludes malformed furnishings from the engine-set count and loaded talent modifiers', () => {
    ITEMS[FURNISHING.id] = { ...FURNISHING, set: 'slagbreaker' } as unknown as ItemDef;
    ITEMS[ARMOR.id] = { ...ARMOR, set: 'slagbreaker' };
    const equipment = { helmet: FURNISHING.id, chest: FURNISHING.id };
    const before = structuredClone(equipment);
    expect([...wornSetCounts(equipment)]).toEqual([]);
    const mods = computeCharacterModifiers('warrior', null, 20, equipment);
    expect(mods.selected[setBonusFlag('slagbreaker', 2)] ?? false).toBe(false);
    expect(mods.abilities.overpower?.buffPct ?? 0).toBe(0);
    const furnishing = loaded(equipment);
    expect(furnishing.meta.talentMods.selected[setBonusFlag('slagbreaker', 2)] ?? false).toBe(
      false,
    );
    expect(equipment).toEqual(before);
    const armorEquipment = { helmet: ARMOR.id, chest: ARMOR.id };
    expect([...wornSetCounts(armorEquipment)]).toEqual([['slagbreaker', 2]]);
    const armor = computeCharacterModifiers('warrior', null, 20, armorEquipment);
    expect(armor.selected[setBonusFlag('slagbreaker', 2)]).toBe(true);
    expect(armor.abilities.overpower?.buffPct).toBe(0.5);
  });

  it.each(['mainhand', 'offhand'] as const)(
    'never rolls authored or enchant procs for a furnishing in %s',
    (hand) => {
      ITEMS[FURNISHING.id] = {
        ...FURNISHING,
        weapon: WEAPON.weapon,
        weaponProcs: WEAPON.weaponProcs,
      } as unknown as ItemDef;
      const instance = { enchant: 'enchant_weapon_lastflame_zeal' };
      const { sim, pid, entity, meta } = loaded({ [hand]: FURNISHING.id }, { [hand]: instance });
      const before = expectDefined(sim.serializeCharacter(pid));
      const auras = structuredClone(entity.auras);
      const chance = vi.spyOn(sim.rng, 'chance').mockReturnValue(true);
      runWeaponProcs(sim.ctx, entity, entity, 'weaponHit', FURNISHING.id, hand);
      expect(chance).toHaveBeenCalledTimes(0);
      expect(entity.auras).toEqual(auras);
      expect(sim.serializeCharacter(pid)).toEqual(before);
      meta.equipment[hand] = WEAPON.id;
      runWeaponProcs(sim.ctx, entity, entity, 'weaponHit', WEAPON.id, hand);
      expect(chance).toHaveBeenCalledTimes(2);
      expect(entity.auras.some((aura) => aura.id === 'furnishing_proc_control')).toBe(true);
      // One buff per wielder, keyed by the enchant alone (combat/equip_procs.ts).
      expect(entity.auras.some((aura) => aura.id === 'enchant_weapon_lastflame_zeal')).toBe(true);
    },
  );
});

describe('furnishings do not count toward equipment limits', () => {
  it('excludes authored and promoted legendary furnishings from unique-equipped admission', () => {
    const legendary: FurnishingItemDef = { ...FURNISHING, quality: 'legendary' };
    const promoted: ItemInstancePayload = { perfected: true, rolled: { quality: 'legendary' } };
    expect(isUniqueEquipped(legendary)).toBe(false);
    expect(isUniqueEquipped(FURNISHING, promoted)).toBe(false);
    expect(isUniqueEquipped({ ...ARMOR, quality: 'legendary' })).toBe(true);
    expect(isUniqueEquipped(ARMOR, promoted)).toBe(true);
  });

  it('does not block a real legendary family with a loaded heroic furnishing in either direction', () => {
    const armor: ArmorItemDef = { ...ARMOR, quality: 'legendary' };
    const furnishing: FurnishingItemDef = {
      ...FURNISHING,
      quality: 'legendary',
      heroicOf: ARMOR.id,
    };
    ITEMS[ARMOR.id] = armor;
    ITEMS[FURNISHING.id] = furnishing;
    const lookup = (id: string) => ITEMS[id];
    expect(uniqueEquipConflictSlot(armor, { chest: FURNISHING.id }, lookup, [])).toBeNull();
    expect(uniqueEquipConflictSlot(furnishing, { chest: ARMOR.id }, lookup, [])).toBeNull();
    expect(uniqueEquipConflictSlot(armor, { chest: ARMOR.id }, lookup, [])).toBe('chest');
    const { sim, pid, meta } = loaded({ chest: FURNISHING.id });
    sim.addItem(ARMOR.id, 1, pid);
    sim.equipItem(ARMOR.id, pid);
    expect(meta.equipment.helmet).toBe(ARMOR.id);
    expect(meta.equipment.chest).toBe(FURNISHING.id);
    expect(sim.countItem(ARMOR.id, pid)).toBe(0);
    expect(sim.countItem(FURNISHING.id, pid)).toBe(1);
  });

  it.each(['cap', 'legendary'] as const)(
    'does not count malformed furnishings against the Masterwrought %s limit',
    (reason) => {
      const armor: ArmorItemDef = { ...ARMOR, masterwrought: true, quality: 'legendary' };
      const furnishing = {
        ...FURNISHING,
        masterwrought: true,
        quality: 'legendary',
      } as unknown as ItemDef;
      ITEMS[ARMOR.id] = armor;
      ITEMS[FURNISHING.id] = furnishing;
      const lookup = (id: string) => ITEMS[id];
      const furnishingEquipment =
        reason === 'cap' ? { chest: FURNISHING.id, legs: FURNISHING.id } : { chest: FURNISHING.id };
      const armorEquipment =
        reason === 'cap' ? { chest: ARMOR.id, legs: ARMOR.id } : { chest: ARMOR.id };
      expect(masterwroughtConflictSlot(armor, furnishingEquipment, lookup, [])).toBeNull();
      expect(masterwroughtConflictSlot(furnishing, armorEquipment, lookup, [])).toBeNull();
      expect(masterwroughtConflictSlot(armor, armorEquipment, lookup, [])).toEqual({
        slot: 'chest',
        reason,
      });
      const { sim, pid, meta } = loaded(furnishingEquipment);
      sim.addItem(ARMOR.id, 1, pid);
      sim.equipItem(ARMOR.id, pid);
      expect(meta.equipment.helmet).toBe(ARMOR.id);
      expect(meta.equipment.chest).toBe(FURNISHING.id);
      expect(sim.countItem(FURNISHING.id, pid)).toBe(1);
    },
  );
});
