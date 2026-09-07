import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import {
  colliderInternalsForTest,
  resolvePosition,
  streetlampPlacements,
} from '../src/sim/colliders';
import { BUILTIN_WORLD, NPCS, setActiveWorldContent } from '../src/sim/data';
import { shouldSpawnSurfaceNpc } from '../src/sim/freehold';
import { Sim } from '../src/sim/sim';
import { generateDecorations, groundHeight, roadDistance, waterLevel } from '../src/sim/world';
import { WORLD_SEED } from '../src/sim/world_seed';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

afterEach(() => setActiveWorldContent(null));

describe('freehold surface NPC admission', () => {
  it.each([false, true])('keeps ordinary and dynamic NPC rules with flag %s', (enabled) => {
    expect(shouldSpawnSurfaceNpc({ id: 'trader_wilkes' }, enabled)).toBe(true);
    expect(shouldSpawnSurfaceNpc({ id: 'trader_wilkes', dynamic: true }, enabled)).toBe(false);
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher', dynamic: true }, enabled)).toBe(false);
  });

  it('admits the furnisher only on a lit host and does not broaden to similar ids', () => {
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher' }, false)).toBe(false);
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher' }, true)).toBe(true);
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher_other' }, false)).toBe(true);
  });
});

describe('authored furnisher construction and world geometry', () => {
  const stock = [
    'freehold_timber_bed',
    'freehold_round_table',
    'freehold_spindle_chair',
    'freehold_low_stool',
    'freehold_woven_rug',
    'freehold_brass_lantern',
    'freehold_storage_chest',
    'freehold_open_bookshelf',
  ];

  it('the dark constructor preserves the pre-furnisher entity and rng fingerprint', () => {
    // Captured before the content row was added, after the behavior-preserving
    // extraction. This also detects decoration vetoes moving an existing spawn.
    const sim = new Sim({ seed: 1, playerClass: 'warrior' });
    expect({
      nextId: sim.nextId,
      primaryId: sim.primaryId,
      merchants: sim.market.merchantIds,
      bankers: sim.bankerIds,
      entityCount: sim.entities.size,
      positionHash: digest(
        [...sim.entities.values()].map((e) => ({
          id: e.id,
          templateId: e.templateId,
          pos: e.pos,
          facing: e.facing,
          hp: e.hp,
        })),
      ),
      rngNext: sim.rng.next(),
    }).toEqual({
      nextId: 1003,
      primaryId: 998,
      merchants: [1, 33],
      bankers: [9, 22, 34, 94],
      entityCount: 1019,
      positionHash: '297a79e82e0de3213f051b5a5f338a483bc03445f3db02e00af7754d1a9d757e',
      rngNext: 0.30275995447300375,
    });
    expect([...sim.entities.values()].some((e) => e.templateId === 'freehold_furnisher')).toBe(
      false,
    );
    expect(
      [...sim.entities.values()].flatMap((e) => e.vendorItems).some((id) => stock.includes(id)),
    ).toBe(false);
  });

  it('the lit constructor adds exactly one furnisher with the complete isolated stock', () => {
    const first = new Sim({ seed: WORLD_SEED, playerClass: 'warrior', freeholdsEnabled: true });
    const second = new Sim({ seed: WORLD_SEED, playerClass: 'warrior', freeholdsEnabled: true });
    const vendors = [...first.entities.values()].filter(
      (e) => e.templateId === 'freehold_furnisher',
    );
    expect(vendors).toHaveLength(1);
    expect(vendors[0].vendorItems).toEqual(stock);
    expect(vendors[0].pos).toEqual(first.groundPos(-66, -96));
    expect(
      [...first.entities.values()].filter((e) => e.vendorItems.some((id) => stock.includes(id))),
    ).toEqual(vendors);
    expect(digest([...first.entities.values()])).toBe(digest([...second.entities.values()]));
    expect(first.rng.next()).toBe(second.rng.next());
  });

  it('the civic-green site is dry, walkable, clear of colliders, roads and other NPCs', () => {
    const { pos } = NPCS.freehold_furnisher;
    expect(pos).toEqual({ x: -66, z: -96 });
    const height = groundHeight(pos.x, pos.z, WORLD_SEED);
    expect(height - waterLevel()).toBeGreaterThan(1);
    expect(roadDistance(pos.x, pos.z)).toBeGreaterThan(3);
    expect(roadDistance(pos.x, pos.z)).toBeLessThan(15);
    for (const r of [0.6, 1, 2, 3]) {
      expect(resolvePosition(WORLD_SEED, pos.x, pos.z, r, false)).toEqual(pos);
    }
    for (const [dx, dz] of [
      [0.6, 0],
      [-0.6, 0],
      [0, 0.6],
      [0, -0.6],
    ]) {
      expect(Math.abs(groundHeight(pos.x + dx, pos.z + dz, WORLD_SEED) - height)).toBeLessThan(
        0.05,
      );
    }
    const neighbors = Object.values(NPCS).filter((npc) => npc.id !== 'freehold_furnisher');
    expect(
      Math.min(...neighbors.map((npc) => Math.hypot(npc.pos.x - pos.x, npc.pos.z - pos.z))),
    ).toBe(6);
  });

  it('adding the authored NPC does not alter static colliders, lamp sites or decoration output', () => {
    const geometry = () => ({
      colliders: digest(colliderInternalsForTest.staticWorldColliders(WORLD_SEED)),
      lamps: digest(streetlampPlacements(WORLD_SEED)),
      decorations: digest(generateDecorations(WORLD_SEED)),
    });
    // Both inputs use a custom bundle so builtin-only fixture admission does
    // not become an unrelated difference when removing the one NPC row.
    setActiveWorldContent({ ...BUILTIN_WORLD });
    const authored = geometry();
    const npcs = { ...NPCS };
    delete npcs.freehold_furnisher;
    setActiveWorldContent({ ...BUILTIN_WORLD, npcs });
    expect(geometry()).toEqual(authored);
  });

  it('records that the existing golden parity scenarios cover the default dark arm', () => {
    const source = readFileSync(new URL('./parity/scenarios.ts', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(source.match(/new\s+Sim\s*\(/g)?.length).toBeGreaterThan(50);
    expect(source).not.toMatch(/\bfreeholdsEnabled\b/);
  });
});
