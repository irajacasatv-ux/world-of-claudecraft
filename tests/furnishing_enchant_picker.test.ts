import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import type { InvSlot, ItemDef, ItemInstancePayload } from '../src/sim/types';
import {
  type EnchantViewerInput,
  enchantsForReagent,
  enchantTargets,
  wornEnchantTargets,
} from '../src/ui/hud/professions/enchant_apply_view';
import { FURNISHING } from './fixtures/furnishing_item';

const TARGET_ENCHANT = 'enchant_chest_stamina';
const EXISTING_ENCHANT = 'enchant_chest_spirit';
const furniture = {
  ...FURNISHING,
  id: 'probe_furnishing_enchant_picker',
  slot: 'chest',
  heroic: true,
  masterwrought: true,
} as unknown as ItemDef;
const armor: ItemDef = {
  id: 'probe_furnishing_enchant_picker_armor',
  name: 'Enchant Test Chest',
  kind: 'armor',
  slot: 'chest',
  armorType: 'mail',
  quality: 'rare',
  sellValue: 0,
};
const viewers: Array<{ name: string; viewer: EnchantViewerInput }> = [
  { name: 'synced', viewer: { synced: true, enchantingSkill: 999 } },
  { name: 'awaiting online progression', viewer: { synced: false, enchantingSkill: 0 } },
];
const copies: Array<{ name: string; instance: ItemInstancePayload; replace: boolean }> = [
  { name: 'plain signed', instance: { signer: 'Maker' }, replace: false },
  {
    name: 'replace enchanted',
    instance: { signer: 'Maker', enchant: EXISTING_ENCHANT },
    replace: true,
  },
];

beforeEach(() => {
  ITEMS[furniture.id] = furniture;
  ITEMS[armor.id] = armor;
});

afterEach(() => {
  delete ITEMS[furniture.id];
  delete ITEMS[armor.id];
});

for (const { name, viewer } of viewers) {
  describe(`furnishing enchant pickers with ${name} viewer`, () => {
    it.each(copies)(
      'omits the $name bag target and offers an eligible armor copy',
      ({ instance, replace }) => {
        const inventory: InvSlot[] = [
          { itemId: furniture.id, count: 1, instance: structuredClone(instance) },
        ];
        const before = structuredClone(inventory);
        expect(enchantTargets(inventory, TARGET_ENCHANT, [], viewer)).toEqual([]);
        expect(inventory).toEqual(before);
        const eligible = [{ ...inventory[0], itemId: armor.id }];
        const controlBefore = structuredClone(eligible);
        expect(enchantTargets(eligible, TARGET_ENCHANT, [], viewer)).toEqual([
          {
            itemId: armor.id,
            count: 1,
            copy: { slotIndex: 0 },
            ...(replace
              ? {
                  replace: {
                    enchantId: EXISTING_ENCHANT,
                    sameEnchant: false,
                    preserved: ['signer'],
                  },
                }
              : {}),
          },
        ]);
        expect(eligible).toEqual(controlBefore);
      },
    );

    it.each(copies)(
      'omits the $name worn target and offers an eligible armor copy',
      ({ instance, replace }) => {
        const equipment = { chest: furniture.id };
        const equippedInstances = { chest: structuredClone(instance) };
        const before = structuredClone({ equipment, equippedInstances });
        expect(wornEnchantTargets(equipment, equippedInstances, TARGET_ENCHANT, viewer)).toEqual(
          [],
        );
        expect({ equipment, equippedInstances }).toEqual(before);
        const control = { chest: armor.id };
        expect(wornEnchantTargets(control, equippedInstances, TARGET_ENCHANT, viewer)).toEqual([
          {
            itemId: armor.id,
            slot: 'chest',
            ...(replace
              ? {
                  replace: {
                    enchantId: EXISTING_ENCHANT,
                    sameEnchant: false,
                    preserved: ['signer'],
                  },
                }
              : {}),
          },
        ]);
        expect(control).toEqual({ chest: armor.id });
        expect(equippedInstances).toEqual(before.equippedInstances);
      },
    );
  });
}

describe('furnishing enchanted-target requirement in the first picker step', () => {
  const infusion = 'enchant_lucent_infusion';
  const viewer: EnchantViewerInput = {
    synced: true,
    enchantingSkill: 999,
    knownRecipes: [infusion],
  };

  it.each(copies)(
    'keeps the Perfected requirement unmet for the $name bag copy with an armor control',
    ({ instance }) => {
      const inventory = [
        {
          itemId: furniture.id,
          count: 1,
          instance: { ...instance, perfected: true as const },
        },
      ];
      const before = structuredClone(inventory);
      const row = enchantsForReagent(inventory, 'lucent_reagent', viewer).find(
        (entry) => entry.enchantId === infusion,
      );
      expect(row?.perfectedMet).toBe(false);
      expect(inventory).toEqual(before);
      const control = [{ ...inventory[0], itemId: armor.id }];
      expect(
        enchantsForReagent(control, 'lucent_reagent', viewer).find(
          (entry) => entry.enchantId === infusion,
        )?.perfectedMet,
      ).toBe(true);
    },
  );

  it.each(copies)(
    'keeps the Perfected requirement unmet for the $name worn copy with an armor control',
    ({ instance }) => {
      const worn = {
        ...viewer,
        equipment: { chest: furniture.id },
        equippedInstances: { chest: { ...instance, perfected: true as const } },
      };
      const before = structuredClone(worn);
      expect(
        enchantsForReagent([], 'lucent_reagent', worn).find((entry) => entry.enchantId === infusion)
          ?.perfectedMet,
      ).toBe(false);
      expect(worn).toEqual(before);
      const control = { ...worn, equipment: { chest: armor.id } };
      expect(
        enchantsForReagent([], 'lucent_reagent', control).find(
          (entry) => entry.enchantId === infusion,
        )?.perfectedMet,
      ).toBe(true);
    },
  );
});
