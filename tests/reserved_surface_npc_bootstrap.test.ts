import { describe, expect, it, vi } from 'vitest';
import {
  CRUCIBLE_VENDOR_ENTITY_ID,
  CRUCIBLE_VENDOR_ENTRANCE_POS,
  CRUCIBLE_VENDOR_NPC_ID,
} from '../src/sim/content/ignivar_loot';
import { FURY_ENTITY_ID, FURY_NPC_ID } from '../src/sim/content/pvp_honor';
import { BUILTIN_WORLD } from '../src/sim/data';
import {
  WARFARE_QUARTERMASTER_ENTITY_ID,
  WARFARE_QUARTERMASTER_NPC_ID,
} from '../src/sim/pvp/warfare_quartermaster';
import { bootstrapReservedSurfaceNpcs } from '../src/sim/reserved_surface_npc_bootstrap';
import { Sim } from '../src/sim/sim';
import type { NpcDef } from '../src/sim/types';
import { waterLevel } from '../src/sim/world';
import { WORLD_SEED } from '../src/sim/world_seed';
import { EMPTY_TEST_WORLD } from './sim_shared';

const RESERVED_IDS = [FURY_ENTITY_ID, WARFARE_QUARTERMASTER_ENTITY_ID, CRUCIBLE_VENDOR_ENTITY_ID];

function setup() {
  const sim = new Sim({
    seed: WORLD_SEED,
    playerClass: 'warrior',
    noPlayer: true,
    world: EMPTY_TEST_WORLD,
  });
  for (const id of RESERVED_IDS) sim.ctx.dropEntity(id);
  const definitions: Record<string, NpcDef> = {};
  // Reverse table order deliberately: the reserved roster has its own order.
  for (const id of [CRUCIBLE_VENDOR_NPC_ID, WARFARE_QUARTERMASTER_NPC_ID, FURY_NPC_ID]) {
    definitions[id] = {
      ...BUILTIN_WORLD.npcs[id],
      name: `Custom ${id}`,
      pos: { x: 10, z: 20 },
      facing: 0.75,
    };
  }
  const findSafePos = vi.fn((x: number, z: number, _minHeight: number) => ({
    x: x + 1,
    z: z + 2,
  }));
  const ground = vi.spyOn(sim.ctx, 'groundPos').mockImplementation((x, z) => ({ x, y: 99, z }));
  const added = vi.spyOn(sim.ctx, 'addEntity');
  const draws = vi.fn();
  sim.rng.setObserver(draws);
  return { sim, definitions, findSafePos, ground, added, draws };
}

describe('reserved surface NPC bootstrap', () => {
  it('preserves reserved order and custom definitions without advancing ids or RNG', () => {
    const { sim, definitions, findSafePos, ground, added, draws } = setup();
    const nextId = sim.nextId;
    bootstrapReservedSurfaceNpcs(sim.ctx, definitions, findSafePos);

    expect(added.mock.calls.map(([entity]) => entity.id)).toEqual(RESERVED_IDS);
    expect(sim.nextId).toBe(nextId);
    expect(draws).not.toHaveBeenCalled();
    for (const id of RESERVED_IDS) {
      const entity = sim.entities.get(id);
      if (!entity) throw new Error(`Missing reserved NPC ${id}`);
      expect(entity.name).toBe(definitions[entity.templateId].name);
      expect(entity.facing).toBe(0.75);
    }
    expect(findSafePos.mock.calls).toEqual([
      [10, 20, waterLevel() + 0.6],
      [10, 20, waterLevel() + 0.6],
    ]);
    expect(ground.mock.calls).toEqual([
      [11, 22],
      [11, 22],
    ]);
    expect(sim.entities.get(FURY_ENTITY_ID)?.pos).toEqual({ x: 11, y: 99, z: 22 });
    expect(sim.entities.get(WARFARE_QUARTERMASTER_ENTITY_ID)?.pos).toEqual({
      x: 11,
      y: 99,
      z: 22,
    });
    // The Crucible vendor must stay on the authored landing plate, bypassing
    // both custom definition coordinates and the generic safe-ground path.
    expect(sim.entities.get(CRUCIBLE_VENDOR_ENTITY_ID)?.pos).toMatchObject(
      CRUCIBLE_VENDOR_ENTRANCE_POS,
    );
    expect(sim.entities.get(CRUCIBLE_VENDOR_ENTITY_ID)?.pos.y).toBeCloseTo(15.34, 1);
  });

  it('does not replace an existing reserved entity on repeated bootstrap', () => {
    const { sim, definitions, findSafePos, added } = setup();
    bootstrapReservedSurfaceNpcs(sim.ctx, definitions, findSafePos);
    const entities = RESERVED_IDS.map((id) => sim.entities.get(id));
    added.mockClear();
    bootstrapReservedSurfaceNpcs(sim.ctx, definitions, findSafePos);
    expect(added).not.toHaveBeenCalled();
    RESERVED_IDS.forEach((id, index) => {
      expect(sim.entities.get(id)).toBe(entities[index]);
    });
  });

  it('does not inject builtin quartermasters into a world that omits their definitions', () => {
    const { sim, findSafePos, ground, added, draws } = setup();
    const nextId = sim.nextId;
    bootstrapReservedSurfaceNpcs(sim.ctx, {}, findSafePos);
    expect(added).not.toHaveBeenCalled();
    expect(findSafePos).not.toHaveBeenCalled();
    expect(ground).not.toHaveBeenCalled();
    expect(draws).not.toHaveBeenCalled();
    expect(sim.nextId).toBe(nextId);
    expect(RESERVED_IDS.some((id) => sim.entities.has(id))).toBe(false);
  });
});
