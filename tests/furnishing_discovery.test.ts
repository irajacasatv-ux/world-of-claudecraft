import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalog from '../src/sim/content/reliquary';
import { ITEMS } from '../src/sim/data';
import { type CharacterState, Sim } from '../src/sim/sim';
import type { ItemDef, ItemInstancePayload } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';
import { EMPTY_TEST_WORLD } from './sim_shared';

const BASE_ID = 'cryptbone_helm';
const GEAR_ID = 'test_furnishing_discovery_gear';
const COPY: ItemInstancePayload = {
  signer: 'Testmaker',
  rolled: { quality: 'legendary', stats: { str: 900 } },
};
const GEAR: ItemDef = {
  id: GEAR_ID,
  name: 'Discovery Control Helm',
  kind: 'armor',
  armorType: 'mail',
  slot: 'helmet',
  quality: 'rare',
  sellValue: 1,
  heroicOf: BASE_ID,
};

beforeEach(() => {
  ITEMS[FURNISHING.id] = { ...FURNISHING, heroicOf: BASE_ID };
  ITEMS[GEAR_ID] = GEAR;
  const actual = catalog.isCataloguedRelicItem;
  vi.spyOn(catalog, 'isCataloguedRelicItem').mockImplementation(
    (id) => id === FURNISHING.id || actual(id),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  delete ITEMS[FURNISHING.id];
  delete ITEMS[GEAR_ID];
});

function world() {
  return new Sim({
    seed: 61,
    playerClass: 'warrior',
    noPlayer: true,
    autoEquip: false,
    world: EMPTY_TEST_WORLD,
  });
}

describe('furnishing discovery identity', () => {
  it('retains an existing discovery ledger without treating the correction as a data scrub', () => {
    const sim = world();
    const pid = sim.addPlayer('warrior', 'Finder');
    const state = sim.serializeCharacter(pid)!;
    state.inventory = [{ itemId: FURNISHING.id, count: 1, instance: COPY }];
    state.deedStats = {
      itemsDiscovered: [FURNISHING.id, BASE_ID],
      visited: ['quality:legendary'],
    };
    const loaded = world();
    const restoredPid = loaded.addPlayer('warrior', 'Veteran', { state });
    const restored = loaded.meta(restoredPid)!;
    expect(restored.deedStats.itemsDiscovered.has(FURNISHING.id)).toBe(true);
    expect(restored.deedStats.itemsDiscovered.has(BASE_ID)).toBe(true);
    expect(restored.deedStats.visited.has('quality:legendary')).toBe(true);
    expect(restored.deedStats.visited.has('quality:rare')).toBe(true);
    expect(restored.inventory.find((slot) => slot.itemId === FURNISHING.id)?.instance).toEqual(
      COPY,
    );
  });

  it.each([FURNISHING.id, GEAR_ID])(
    'grants the actual copy and applies only eligible quality and heroic discovery for %s',
    (itemId) => {
      const sim = world();
      const pid = sim.addPlayer('warrior', 'Finder');
      const meta = sim.meta(pid)!;
      sim.addItemInstance(itemId, COPY, pid);
      expect(meta.inventory.find((slot) => slot.itemId === itemId)?.instance).toEqual(COPY);
      expect(meta.deedStats.itemsDiscovered.has(itemId)).toBe(true);
      if (itemId === FURNISHING.id) {
        expect(meta.deedStats.visited.has('quality:rare')).toBe(true);
        expect(meta.deedStats.visited.has('quality:legendary')).toBe(false);
        expect(meta.deedStats.itemsDiscovered.has(BASE_ID)).toBe(false);
        expect(meta.reliquary.counts[FURNISHING.id]).toBe(1);
        expect(meta.reliquary.counts[BASE_ID]).toBeUndefined();
        expect(meta.reliquary.firstFind[BASE_ID]).toBeUndefined();
      } else {
        expect(meta.deedStats.visited.has('quality:legendary')).toBe(true);
        expect(meta.deedStats.itemsDiscovered.has(BASE_ID)).toBe(true);
        expect(meta.reliquary.counts[BASE_ID]).toBe(1);
        expect(meta.reliquary.firstFind[BASE_ID]).toBeDefined();
      }
      const discoveries = [...meta.deedStats.itemsDiscovered];
      sim.addItemInstance(itemId, COPY, pid);
      expect([...meta.deedStats.itemsDiscovered]).toEqual(discoveries);
      expect(meta.reliquary.counts[itemId === FURNISHING.id ? FURNISHING.id : BASE_ID]).toBe(2);

      const saved = JSON.parse(JSON.stringify(sim.serializeCharacter(pid))) as CharacterState;
      const loaded = world();
      const loadedPid = loaded.addPlayer('warrior', 'Finder', { state: saved });
      const restored = loaded.meta(loadedPid)!;
      expect([...restored.deedStats.itemsDiscovered].sort()).toEqual(discoveries.sort());
      expect(restored.reliquary.counts[itemId === FURNISHING.id ? FURNISHING.id : BASE_ID]).toBe(2);
      if (itemId === FURNISHING.id) {
        expect(restored.deedStats.visited.has('quality:legendary')).toBe(false);
        expect(restored.reliquary.counts[BASE_ID]).toBeUndefined();
        expect(restored.reliquary.firstFind[BASE_ID]).toBeUndefined();
      }
    },
  );

  it.each(['inventory', 'bank', 'equipment'] as const)(
    'uses authored furnishing identity during a fresh legacy %s seed',
    (container) => {
      const sim = world();
      const pid = sim.addPlayer('warrior', 'Finder');
      const state = sim.serializeCharacter(pid)!;
      state.deedStats = { itemsDiscovered: [] };
      state.inventory = [];
      state.equipment = {};
      state.equipmentInstance = {};
      const slot = { itemId: FURNISHING.id, count: 1, instance: COPY };
      if (container === 'inventory') state.inventory = [slot];
      if (container === 'bank') state.bank = { ...state.bank!, inventory: [slot] };
      if (container === 'equipment') {
        state.equipment = { mainhand: FURNISHING.id };
        state.equipmentInstance = { mainhand: COPY };
      }
      const loaded = world();
      const loadedPid = loaded.addPlayer('warrior', 'Legacy', {
        state: JSON.parse(JSON.stringify(state)) as CharacterState,
      });
      const meta = loaded.meta(loadedPid)!;
      expect(meta.deedStats.itemsDiscovered.has(FURNISHING.id)).toBe(true);
      expect(meta.deedStats.itemsDiscovered.has(BASE_ID)).toBe(false);
      expect(meta.deedStats.visited.has('quality:rare')).toBe(true);
      expect(meta.deedStats.visited.has('quality:legendary')).toBe(false);
      expect(meta.reliquary.counts[BASE_ID]).toBeUndefined();
      expect(meta.reliquary.firstFind[BASE_ID]).toBeUndefined();
    },
  );
});
