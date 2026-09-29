import { describe, expect, it } from 'vitest';
import { FREEHOLD_FURNISHER_NPC_ID } from '../src/sim/content/freehold';
import { RELIQUARY_PAGES } from '../src/sim/content/reliquary';
import { BUILTIN_WORLD, ITEMS } from '../src/sim/data';
import { pageCompletion } from '../src/sim/reliquary';
import { Sim } from '../src/sim/sim';
import type { WorldContent } from '../src/sim/types';
import { WORLD_SEED } from '../src/sim/world_seed';

const IDS = [
  'freehold_timber_bed',
  'freehold_round_table',
  'freehold_spindle_chair',
  'freehold_low_stool',
  'freehold_woven_rug',
  'freehold_brass_lantern',
  'freehold_storage_chest',
  'freehold_open_bookshelf',
] as const;

// Every case buys from the one authored furnisher, so the Sims run on a world holding
// only that NPC; the dark-host case keeps the full roster, whose id order hands the
// lit furnisher's id to another merchant.
const FURNISHER_WORLD: WorldContent = {
  ...BUILTIN_WORLD,
  camps: [],
  npcs: { [FREEHOLD_FURNISHER_NPC_ID]: BUILTIN_WORLD.npcs[FREEHOLD_FURNISHER_NPC_ID] },
  groundObjects: [],
};

function readyBuyer(freeholdsEnabled = true, fullRoster = false) {
  const sim = new Sim({
    seed: WORLD_SEED,
    playerClass: 'warrior',
    freeholdsEnabled,
    ...(fullRoster ? {} : { world: FURNISHER_WORLD }),
  });
  const meta = sim.meta(sim.primaryId)!;
  meta.inventory.splice(0);
  meta.copper = 1_000_000;
  sim.player.pos = sim.groundPos(-66, -96);
  sim.player.prevPos = { ...sim.player.pos };
  sim.drainEvents();
  return { sim, meta };
}

function furnisherId(sim: Sim) {
  const vendors = [...sim.entities.values()].filter((e) => e.templateId === 'freehold_furnisher');
  expect(vendors).toHaveLength(1);
  return vendors[0].id;
}

const errors = (sim: Sim) =>
  sim
    .drainEvents()
    .filter((e) => e.type === 'error')
    .map((e) => e.text);
const hearth = () => {
  const page = RELIQUARY_PAGES.find((p) => p.id === 'hearth_basics');
  expect(page).toBeDefined();
  return page!;
};

describe('the authored Freehold Furnisher acquisition path', () => {
  it('buys the complete set through the real vendor path, one cell per copy, with discovery', () => {
    const { sim, meta } = readyBuyer();
    const vendor = furnisherId(sim);
    let draws = 0;
    sim.rng.setObserver(() => {
      draws++;
    });
    for (const id of IDS) sim.buyItem(vendor, id);
    sim.buyItem(vendor, 'freehold_spindle_chair', { count: 2 });
    sim.rng.setObserver(null);
    expect(errors(sim)).toEqual([]);
    expect(draws).toBe(0);
    expect(meta.copper).toBe(
      1_000_000 -
        IDS.reduce((sum, id) => sum + ITEMS[id].buyValue!, 0) -
        2 * ITEMS.freehold_spindle_chair.buyValue!,
    );
    expect(sim.inventory).toEqual([
      ...IDS.map((itemId) => ({ itemId, count: 1 })),
      { itemId: 'freehold_spindle_chair', count: 1 },
      { itemId: 'freehold_spindle_chair', count: 1 },
    ]);
    expect(IDS.every((id) => meta.deedStats.itemsDiscovered.has(id))).toBe(true);
    expect(pageCompletion(hearth(), { itemsDiscovered: meta.deedStats.itemsDiscovered })).toEqual({
      owned: 8,
      total: 8,
      complete: true,
    });
    expect(meta.reliquary.counts.freehold_spindle_chair).toBe(3);
    expect(meta.reliquary.illuminatedPages.has('hearth_basics')).toBe(true);
  });

  it('refuses insufficient copper and a full bag without charging or discovering', () => {
    const { sim, meta } = readyBuyer();
    const vendor = furnisherId(sim);
    const id = 'freehold_timber_bed';
    meta.copper = ITEMS[id].buyValue! - 1;
    const poorBefore = sim.serializeCharacter(sim.primaryId);
    sim.buyItem(vendor, id);
    expect(errors(sim)).toEqual(['Not enough money.']);
    expect(sim.serializeCharacter(sim.primaryId)).toEqual(poorBefore);
    meta.copper = 1_000_000;
    meta.bags = [];
    for (let i = 0; i < sim.bagCapacity; i++) {
      meta.inventory.push({ itemId: 'freehold_low_stool', count: 1 });
    }
    const fullBefore = sim.serializeCharacter(sim.primaryId);
    sim.buyItem(vendor, id);
    expect(errors(sim)).toEqual(['Your bags are full.']);
    expect(sim.serializeCharacter(sim.primaryId)).toEqual(fullBefore);
    expect(meta.deedStats.itemsDiscovered.has(id)).toBe(false);
  });

  it('sells and buys back a real furnishing while preserving sticky discovery', () => {
    const { sim, meta } = readyBuyer();
    const id = 'freehold_storage_chest';
    sim.buyItem(furnisherId(sim), id);
    expect(errors(sim)).toEqual([]);
    const paid = 1_000_000 - ITEMS[id].buyValue!;
    expect(meta.copper).toBe(paid);
    sim.sellItem(id);
    expect(errors(sim)).toEqual([]);
    expect(sim.countItem(id)).toBe(0);
    expect(meta.copper).toBe(paid + ITEMS[id].sellValue);
    expect(meta.deedStats.itemsDiscovered.has(id)).toBe(true);
    sim.buyBackItem(id);
    expect(errors(sim)).toEqual([]);
    expect(sim.inventory).toEqual([{ itemId: id, count: 1 }]);
    expect(meta.copper).toBe(paid);
    expect(meta.reliquary.counts[id]).toBe(1);
  });

  it('a dark host cannot buy any furnishing using the corresponding lit entity id', () => {
    const lit = readyBuyer(true, true);
    const vendor = furnisherId(lit.sim);
    const { sim, meta } = readyBuyer(false, true);
    // Since the release/v0.44.0 sync at aaff789813 the dark roster, which
    // spawns no furnisher, hands the lit furnisher's id to the next NPC it
    // builds (the Rift Watch quartermaster, far off), so the refusal is that
    // merchant's stock check rather than an absent merchant; either way nothing
    // changes hands.
    expect(sim.entities.get(vendor)?.templateId).toBe('npc_rift_watch_quartermaster');
    const before = sim.serializeCharacter(sim.primaryId);
    for (const id of IDS) sim.buyItem(vendor, id);
    expect(errors(sim)).toEqual(IDS.map(() => 'That item is not sold here.'));
    expect(sim.serializeCharacter(sim.primaryId)).toEqual(before);
    expect(IDS.some((id) => meta.deedStats.itemsDiscovered.has(id))).toBe(false);
  });

  it('retains acquired copies and Hearth progress through JSON save/load onto a dark host', () => {
    const { sim, meta } = readyBuyer();
    const vendor = furnisherId(sim);
    for (const id of IDS) sim.buyItem(vendor, id);
    expect(errors(sim)).toEqual([]);
    const saved = JSON.parse(JSON.stringify(sim.serializeCharacter(sim.primaryId)));
    const restored = new Sim({
      seed: WORLD_SEED,
      playerClass: 'warrior',
      noPlayer: true,
      world: FURNISHER_WORLD,
    });
    const pid = restored.addPlayer('warrior', 'Restored', { state: saved });
    const loaded = restored.meta(pid)!;
    expect(restored.cfg.freeholdsEnabled).toBe(false);
    expect([...restored.entities.values()].some((e) => e.templateId === 'freehold_furnisher')).toBe(
      false,
    );
    expect(loaded.inventory).toEqual(IDS.map((itemId) => ({ itemId, count: 1 })));
    expect(loaded.copper).toBe(meta.copper);
    expect(IDS.every((id) => loaded.deedStats.itemsDiscovered.has(id))).toBe(true);
    expect(loaded.reliquary.firstFind).toEqual(meta.reliquary.firstFind);
    expect(loaded.reliquary.counts).toEqual(meta.reliquary.counts);
    expect(pageCompletion(hearth(), { itemsDiscovered: loaded.deedStats.itemsDiscovered })).toEqual(
      { owned: 8, total: 8, complete: true },
    );
    expect(loaded.reliquary.illuminatedPages.has('hearth_basics')).toBe(true);
  });

  it('older rows with no discovery metadata restore without phantom Hearth completion', () => {
    const { sim } = readyBuyer(false);
    const saved = sim.serializeCharacter(sim.primaryId)!;
    delete saved.reliquary;
    delete saved.deedStats;
    const restored = new Sim({
      seed: WORLD_SEED,
      playerClass: 'warrior',
      noPlayer: true,
      world: FURNISHER_WORLD,
    });
    const pid = restored.addPlayer('warrior', 'Earlier Character', {
      state: JSON.parse(JSON.stringify(saved)),
    });
    const loaded = restored.meta(pid)!;
    expect(IDS.some((id) => loaded.deedStats.itemsDiscovered.has(id))).toBe(false);
    expect(pageCompletion(hearth(), { itemsDiscovered: loaded.deedStats.itemsDiscovered })).toEqual(
      { owned: 0, total: 8, complete: false },
    );
    expect(loaded.reliquary.illuminatedPages.has('hearth_basics')).toBe(false);
    expect(IDS.some((id) => Object.hasOwn(loaded.reliquary.counts, id))).toBe(false);
  });
});
