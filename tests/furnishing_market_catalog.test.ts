import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, ITEMS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { InvSlot, ItemInstancePayload } from '../src/sim/types';

// Literal authored identities: these cases must keep exercising the shipped
// catalog even if a production inventory or recipe table accidentally shrinks.
const CRAFTED_FURNISHING_IDS = [
  'freehold_weapon_rack',
  'freehold_iron_brazier',
  'freehold_patchwork_rug',
  'freehold_hide_armchair',
  'freehold_clockwork_lamp',
  'freehold_glass_floor_lamp',
  'freehold_chart_easel',
  'freehold_jewel_floor_lamp',
  'freehold_set_supper_table',
  'freehold_glow_lantern',
] as const;
const PATTERN_IDS = [
  'pattern_freehold_clockwork_lamp',
  'pattern_freehold_chart_easel',
  'pattern_freehold_jewel_floor_lamp',
] as const;
const SIGNED: ItemInstancePayload = { signer: 'Testmaker' };
const SENTINEL: InvSlot = { itemId: 'bone_fragments', count: 7 };

function atMarket(inventory: InvSlot[]): Sim {
  const sim = new Sim({
    seed: 73,
    playerClass: 'warrior',
    autoEquip: false,
    freeholdsEnabled: true,
    world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
  });
  sim.inventory.splice(0, sim.inventory.length, ...structuredClone(inventory));
  sim.meta(sim.playerId)!.copper = 10000;
  const merchant = sim.entities.get(sim.market.merchantIds[0]);
  if (!merchant) throw new Error('World Market merchant is missing');
  sim.player.pos = { ...merchant.pos };
  sim.player.prevPos = { ...sim.player.pos };
  sim.rebucket(sim.player);
  sim.drainEvents();
  return sim;
}

function expectNoErrors(sim: Sim): void {
  expect(sim.drainEvents().filter((event) => event.type === 'error')).toEqual([]);
}

describe('authored furnishing and pattern World Market custody', () => {
  it.each([...CRAFTED_FURNISHING_IDS, ...PATTERN_IDS])(
    'lists and reclaims the plain authored item %s without losing or duplicating inventory',
    (itemId) => {
      expect(ITEMS[itemId]).toBeDefined();
      const original = [structuredClone(SENTINEL), { itemId, count: 1 }];
      const sim = atMarket(original);
      const listingsBefore = structuredClone(sim.marketListings);
      const existingIds = new Set(listingsBefore.map((listing) => listing.id));

      sim.marketList(itemId, 1, 100);

      expectNoErrors(sim);
      expect(sim.inventory).toEqual([SENTINEL]);
      const added = sim.marketListings.filter((listing) => !existingIds.has(listing.id));
      expect(added).toHaveLength(1);
      expect(added[0]).toMatchObject({ itemId, count: 1, price: 100 });
      expect(added[0].instance).toBeUndefined();
      expect(sim.marketListings.filter((listing) => existingIds.has(listing.id))).toEqual(
        listingsBefore,
      );

      sim.marketCancel(added[0].id);

      expectNoErrors(sim);
      expect(sim.marketListings).toEqual(listingsBefore);
      expect(sim.inventory).toEqual(original);
    },
  );

  it.each(CRAFTED_FURNISHING_IDS)(
    'reclaims the exact signer-only %s copy and leaves its plain copy untouched',
    (itemId) => {
      expect(ITEMS[itemId]?.kind).toBe('furnishing');
      const plain: InvSlot = { itemId, count: 1 };
      const signed: InvSlot = { itemId, count: 1, instance: structuredClone(SIGNED) };
      const original = [structuredClone(SENTINEL), plain, signed];
      const sim = atMarket(original);
      const listingsBefore = structuredClone(sim.marketListings);
      const existingIds = new Set(listingsBefore.map((listing) => listing.id));

      sim.marketListInstance(itemId, 100, SIGNED);

      expectNoErrors(sim);
      expect(sim.inventory).toEqual([SENTINEL, plain]);
      const added = sim.marketListings.filter((listing) => !existingIds.has(listing.id));
      expect(added).toHaveLength(1);
      expect(added[0]).toMatchObject({ itemId, count: 1, price: 100, instance: SIGNED });
      expect(added[0].instance).toEqual(SIGNED);
      expect(sim.marketListings.filter((listing) => existingIds.has(listing.id))).toEqual(
        listingsBefore,
      );

      sim.marketCancel(added[0].id);

      expectNoErrors(sim);
      expect(sim.marketListings).toEqual(listingsBefore);
      expect(sim.inventory).toEqual(original);
      expect(sim.inventory[2].instance).toEqual({ signer: 'Testmaker' });
    },
  );
});
