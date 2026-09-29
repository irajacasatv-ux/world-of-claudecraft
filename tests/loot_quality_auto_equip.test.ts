import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import { lootQualityBonuses } from '../src/sim/loot_quality';
import { Sim } from '../src/sim/sim';
import type { ItemInstancePayload } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

// Every grant here carries its quality tier in the payload and no case reads
// the world or draws a roll, so all Sims share one seed of the empty world: a
// fresh seed builds its collider grids (about half a second) for nothing.
const rogue = (autoEquip: boolean): Sim =>
  new Sim({ seed: 73, playerClass: 'rogue', autoEquip, world: EMPTY_TEST_WORLD });

const quality = (tier: 1 | 2 | 3 | 4): ItemInstancePayload => ({
  lootQuality: { version: 1, tier, weights: [500, 200, 300, 400, 100] },
});

describe('quality loot auto equip', () => {
  it('compares resolved armor and retains the higher tier when another ordinary copy arrives', () => {
    const item = Object.values(ITEMS).find(
      (i) =>
        i.kind === 'armor' &&
        i.armorType === 'leather' &&
        i.slot === 'chest' &&
        i.quality === 'rare' &&
        !i.requiredClass &&
        lootQualityBonuses(i, quality(4)).armor > 0,
    )!;
    const sim = rogue(true);
    sim.setPlayerLevel(20);
    sim.addItem(item.id, 1);
    expect(sim.equipment.chest).toBe(item.id);
    sim.addItemInstance(item.id, quality(4));
    expect(sim.player.equippedInstances.chest?.lootQuality?.tier).toBe(4);
    sim.addItem(item.id, 1);
    sim.addItemInstance(item.id, quality(1));
    expect(sim.player.equippedInstances.chest?.lootQuality?.tier).toBe(4);
  });
  it("counts the grant's quality armor against a different worn piece, and the worn copy's too", () => {
    // Two leather chests where base armor and resolved armor disagree: the
    // quality piece's base armor loses to the other chest, its tier IV armor
    // wins. The same-item level rule cannot decide between two items.
    const chests = Object.values(ITEMS).filter(
      (i) =>
        i.kind === 'armor' &&
        i.armorType === 'leather' &&
        i.slot === 'chest' &&
        !i.requiredClass &&
        (i.requiredLevel ?? 0) <= 20,
    );
    const baseArmor = (id: string) => ITEMS[id].stats?.armor ?? 0;
    let pair: { enhanced: string; plain: string } | undefined;
    for (const enhanced of chests) {
      const resolved = baseArmor(enhanced.id) + lootQualityBonuses(enhanced, quality(4)).armor;
      const plain = chests.find(
        (other) => baseArmor(other.id) > baseArmor(enhanced.id) && baseArmor(other.id) < resolved,
      );
      if (plain) {
        pair = { enhanced: enhanced.id, plain: plain.id };
        break;
      }
    }
    if (!pair) throw new Error('no leather chest pair where the quality armor decides');
    // Worn plain piece, quality grant of the other: the grant's own armor wins.
    const upgrade = rogue(true);
    upgrade.setPlayerLevel(20);
    upgrade.addItem(pair.plain, 1);
    expect(upgrade.equipment.chest).toBe(pair.plain);
    upgrade.addItemInstance(pair.enhanced, quality(4));
    expect(upgrade.equipment.chest).toBe(pair.enhanced);
    expect(upgrade.player.equippedInstances.chest?.lootQuality?.tier).toBe(4);
    // Worn quality piece, plain grant of the other: the worn copy's armor holds.
    const hold = rogue(true);
    hold.setPlayerLevel(20);
    hold.addItemInstance(pair.enhanced, quality(4));
    expect(hold.equipment.chest).toBe(pair.enhanced);
    hold.addItem(pair.plain, 1);
    expect(hold.equipment.chest).toBe(pair.enhanced);
  });

  it('equips an enhanced weapon into an empty slot', () => {
    const sim = rogue(true);
    sim.setPlayerLevel(20);
    sim.unequipItem('mainhand');
    sim.addItemInstance('duskwhisper', quality(2));
    expect(sim.equipment.mainhand).toBe('duskwhisper');
    expect(sim.player.equippedInstances.mainhand?.lootQuality?.tier).toBe(2);
  });

  it('selects the newly granted exact tier among copies and keeps the better worn copy', () => {
    const sim = rogue(false);
    sim.setPlayerLevel(20);
    sim.unequipItem('offhand');
    sim.addItemInstance('duskwhisper', quality(1));
    sim.equipItem('duskwhisper', undefined, 'mainhand');
    sim.addItemInstance('duskwhisper', quality(4));
    sim.addItemInstance('duskwhisper', quality(2));
    sim.players.get(sim.playerId)!.autoEquip = true;
    // Identical descriptor coalesces with an EARLIER tier-IV row, while the
    // newest row is tier II. Id-only equip would consume the wrong copy. The
    // dual-wielding rogue's spec routes the one-hander to the empty offhand
    // (the mainhand is the comparison, never a forced target).
    sim.addItemInstance('duskwhisper', quality(4));
    expect(sim.player.equippedInstances.offhand?.lootQuality?.tier).toBe(4);
    expect(sim.player.equippedInstances.mainhand?.lootQuality?.tier).toBe(1);
    expect(
      sim.inventory.filter(
        (s) => s.itemId === 'duskwhisper' && s.instance?.lootQuality?.tier === 2,
      ),
    ).toHaveLength(1);
    sim.addItemInstance('duskwhisper', quality(1));
    sim.addItem('duskwhisper', 1);
    expect(sim.player.equippedInstances.offhand?.lootQuality?.tier).toBe(4);
    expect(sim.player.equippedInstances.mainhand?.lootQuality?.tier).toBe(1);
    // Never a downgrade: a tier II copy beats the tier I mainhand, but the spec
    // routes it to the offhand, which wears tier IV, so it stays in the bags
    // (the comparison is against the hand the grant would displace).
    sim.addItemInstance('duskwhisper', quality(2));
    expect(sim.player.equippedInstances.offhand?.lootQuality?.tier).toBe(4);
    expect(sim.player.equippedInstances.mainhand?.lootQuality?.tier).toBe(1);
    expect(
      sim.inventory
        .filter((s) => s.itemId === 'duskwhisper' && s.instance?.lootQuality?.tier === 2)
        .reduce((sum, s) => sum + s.count, 0),
    ).toBe(2);
  });

  it('routes a quality one-hander by spec like an ordinary grant: full mainhand, empty offhand', () => {
    // A dual-wielding spec with a full mainhand and an empty offhand: equipItem
    // with no aimed slot routes a one-hander to the offhand (items.ts
    // desiredEquipSlot). The descriptor must not change the hand.
    const run = (grant: (sim: Sim) => void) => {
      const sim = rogue(true);
      sim.setPlayerLevel(20);
      sim.unequipItem('offhand');
      sim.unequipItem('mainhand');
      sim.addItem('duskwhisper', 1);
      expect(sim.equipment.mainhand).toBe('duskwhisper');
      expect(sim.equipment.offhand).toBeUndefined();
      grant(sim);
      return sim;
    };
    const ordinary = run((sim) => sim.addItem('heroic_duskwhisper', 1));
    expect(ordinary.equipment.mainhand).toBe('duskwhisper');
    expect(ordinary.equipment.offhand).toBe('heroic_duskwhisper');
    const enhanced = run((sim) => sim.addItemInstance('duskwhisper', quality(3)));
    expect(enhanced.equipment.mainhand).toBe('duskwhisper');
    expect(enhanced.player.equippedInstances.mainhand?.lootQuality).toBeUndefined();
    expect(enhanced.equipment.offhand).toBe('duskwhisper');
    expect(enhanced.player.equippedInstances.offhand?.lootQuality?.tier).toBe(3);
  });

  it('keeps ordinary auto equip and non-quality crafted grant behavior', () => {
    const sim = rogue(true);
    sim.setPlayerLevel(20);
    sim.unequipItem('mainhand');
    sim.addItem('duskwhisper', 1);
    expect(sim.equipment.mainhand).toBe('duskwhisper');
    sim.addItemInstance('heroic_duskwhisper', {
      signer: 'Artisan',
      rolled: { masterwork: true, stats: { str: 1 } },
    });
    expect(sim.equipment.mainhand).toBe('duskwhisper');
  });
});
