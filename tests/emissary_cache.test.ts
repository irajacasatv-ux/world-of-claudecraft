// The Emissary's Cache (src/sim/emissary_cache.ts): the Normal raid pool per
// class, and opening one through the ordinary item-use path.
import { describe, expect, it } from 'vitest';
import { HEROIC_MARK_ITEM_ID } from '../src/sim/content/dungeon_difficulty';
import { IGNIVAR_LOOT_ITEM_IDS } from '../src/sim/content/ignivar_loot';
import { ITEMS } from '../src/sim/data';
import {
  EMISSARY_CACHE_ITEM_ID,
  EMISSARY_CACHE_MARKS,
  emissaryCachePoolForClass,
  emissaryCacheRaidPool,
} from '../src/sim/emissary_cache';
import { Sim } from '../src/sim/sim';
import type { PlayerClass } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

const CLASSES: PlayerClass[] = [
  'warrior',
  'paladin',
  'hunter',
  'rogue',
  'priest',
  'shaman',
  'mage',
  'warlock',
  'druid',
];

describe('the cache pool', () => {
  it('holds only Normal epic raid gear: Nythraxis drops and the Crucible tables, no tokens, heroic copies, or tier pieces', () => {
    const pool = emissaryCacheRaidPool();
    expect(pool.length).toBeGreaterThan(20);
    expect(new Set(pool).size).toBe(pool.length);
    for (const id of pool) {
      const def = ITEMS[id];
      expect(def, id).toBeDefined();
      expect(def.quality, id).toBe('epic');
      expect(['weapon', 'armor', 'held_offhand'], id).toContain(def.kind);
      expect(def.heroicOf, id).toBeUndefined();
      expect(def.set, id).toBeUndefined();
    }
    expect(pool).toContain('bonewrought_greatsword');
    expect(pool).toContain('seal_of_the_forgewall');
    expect(pool).not.toContain('crownforged_dreadhelm');
    expect(pool).not.toContain('slagbreaker_helmet');
    expect(pool.some((id) => IGNIVAR_LOOT_ITEM_IDS.includes(id))).toBe(true);
    expect(pool.some((id) => id.startsWith('sigil_'))).toBe(false);
  });

  it('holds only wearable kinds, the Weekly Vault rule: weapon, armor and held offhand, never a recipe', () => {
    // Ruled 2026-09-27 (the freeholds ledger): the pool used to keep any non-tool
    // epic, so Nythraxis's ten apex gear patterns (the `nythraxis_patterns` tail of
    // its loot table) rode in beside the gear (open to every class, 22 to 38
    // percent of a class's draws). Pinned by kind count so a
    // new raid table that adds a non-wearable kind is reviewed here.
    const kinds = new Map<string, number>();
    for (const id of emissaryCacheRaidPool()) {
      const kind = ITEMS[id].kind;
      kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    }
    expect(Object.fromEntries(kinds)).toEqual({ weapon: 15, armor: 35, held_offhand: 4 });
    expect(emissaryCacheRaidPool()).not.toContain('pattern_duskforged_warblade');
    for (const cls of CLASSES) {
      for (const id of emissaryCachePoolForClass(cls))
        expect(['weapon', 'armor', 'held_offhand'], `${cls} ${id}`).toContain(ITEMS[id].kind);
    }
  });

  it('gives every class a non-empty pool it can wear', () => {
    for (const cls of CLASSES) {
      const pool = emissaryCachePoolForClass(cls);
      expect(pool.length, cls).toBeGreaterThan(0);
      for (const id of pool) {
        const locked = ITEMS[id].requiredClass;
        expect(!locked || locked.includes(cls), `${cls} ${id}`).toBe(true);
      }
    }
    expect(emissaryCachePoolForClass('shaman')).toContain('stormkindled_chain');
    expect(emissaryCachePoolForClass('mage')).not.toContain('stormkindled_chain');
  });
});

describe('opening a cache', () => {
  it('consumes one cache and hands over a class piece plus the marks, drawing the sim rng', () => {
    // The cache opens from the bags and draws only the sim rng, so both Sims
    // run on the empty world.
    const sim = new Sim({
      seed: 11,
      playerClass: 'mage',
      devCommands: true,
      world: EMPTY_TEST_WORLD,
    });
    sim.tick();
    const meta = sim.meta(sim.playerId)!;
    sim.useItem(EMISSARY_CACHE_ITEM_ID);
    expect(sim.countItem(EMISSARY_CACHE_ITEM_ID)).toBe(0);
    sim.chat(`/dev give ${EMISSARY_CACHE_ITEM_ID} 2`);
    expect(sim.countItem(EMISSARY_CACHE_ITEM_ID)).toBe(2);
    const marks = sim.countItem(HEROIC_MARK_ITEM_ID);
    const before = new Map(
      emissaryCachePoolForClass(meta.cls).map((id) => [id, sim.countItem(id)] as const),
    );
    sim.useItem(EMISSARY_CACHE_ITEM_ID);
    expect(sim.countItem(EMISSARY_CACHE_ITEM_ID)).toBe(1);
    expect(sim.countItem(HEROIC_MARK_ITEM_ID)).toBe(marks + EMISSARY_CACHE_MARKS);
    const gained = [...before].filter(([id, count]) => sim.countItem(id) === count + 1);
    expect(gained).toHaveLength(1);
    expect(ITEMS[gained[0][0]].requiredClass ?? ['mage']).toContain('mage');
    // The same seed opens the same piece: the draw is the sim's own rng.
    const twin = new Sim({
      seed: 11,
      playerClass: 'mage',
      devCommands: true,
      world: EMPTY_TEST_WORLD,
    });
    twin.tick();
    twin.chat(`/dev give ${EMISSARY_CACHE_ITEM_ID} 2`);
    twin.useItem(EMISSARY_CACHE_ITEM_ID);
    expect(twin.countItem(gained[0][0])).toBe(sim.countItem(gained[0][0]));
  });
});
