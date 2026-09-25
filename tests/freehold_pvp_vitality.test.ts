// Honor gear's health bonus (src/sim/pvp/vitality.ts) inside a freehold room.
// The owner rule the module quotes is "it never works in dungeons or raids; it
// works in other contexts", and the module's safest-first default reads the
// whole far-east instance plane as PvE, which is where a freehold room lives.
// A home is neither a dungeon nor a raid, so before the v0.44.0 re-sync
// composed the two, a player in honor gear lost their bonus health walking
// through the Eastbrook gate and got it back walking out. A freehold room now
// keeps the open-world reading; every other instance keeps the release's.
import { describe, expect, it } from 'vitest';
import { DUNGEON_LIST, DUNGEON_X_THRESHOLD, instanceOrigin } from '../src/sim/data';
import { pvpVitalityAppliesTo } from '../src/sim/pvp/vitality';
import { Sim } from '../src/sim/sim';
import type { Entity, EquipSlot } from '../src/sim/types';
import { RL_TEST_WORLD } from './sim_shared';

// The Season 1 strength kit tests/honor.test.ts measures (302 Warfare Defense
// Rating, about +50% health in the open world).
const STR_KIT: Partial<Record<EquipSlot, string>> = {
  mainhand: 'final_argument_greatblade',
  helmet: 'furyforged_warhelm',
  shoulder: 'furyforged_warspaulders',
  chest: 'furyforged_warplate',
  waist: 'furyforged_girdle',
  legs: 'furyforged_legguards',
  gloves: 'furyforged_gauntlets',
  feet: 'furyforged_sabatons',
  neck: 'final_oath_medallion',
  ring1: 'iron_vow_band',
  ring2: 'unbroken_circle',
};

const OWNER_ROOMS = DUNGEON_LIST.filter((def) => def.claimKey === 'owner');
const PARTY_DUNGEON = DUNGEON_LIST.find((def) => def.claimKey !== 'owner');

function geared(): { sim: Sim; e: Entity } {
  const sim = new Sim({ seed: 42, playerClass: 'warrior', noPlayer: true, world: RL_TEST_WORLD });
  const pid = sim.addPlayer('warrior', 'Vhome');
  sim.setPlayerLevel(20, pid);
  for (const [slot, id] of Object.entries(STR_KIT)) {
    sim.addItem(id, 1, pid);
    sim.equipItemToSlot(id, slot as EquipSlot, pid);
  }
  for (let i = 0; i < 12; i++) sim.tick();
  const e = sim.entities.get(pid);
  if (!e) throw new Error('no entity');
  return { sim, e };
}

function standAt(sim: Sim, e: Entity, spot: { x: number; z: number }): void {
  e.pos = { ...e.pos, x: spot.x, z: spot.z };
  e.prevPos = { ...e.pos };
  for (let i = 0; i < 12; i++) sim.tick();
}

describe('honor gear health inside a freehold room', () => {
  it('the rooms sit on the instance plane, past the dungeon threshold', () => {
    expect(OWNER_ROOMS.map((def) => def.id)).toEqual(['freehold_inn_room', 'freehold_cottage']);
    for (const def of OWNER_ROOMS) {
      expect(instanceOrigin(def.index, 0).x).toBeGreaterThan(DUNGEON_X_THRESHOLD);
    }
  });

  it('keeps the open-world bonus in every owner room, so the gate never flips max health', () => {
    for (const room of OWNER_ROOMS) {
      const { sim, e } = geared();
      expect(e.stats.pvpVitality).toBeCloseTo(302 / 600, 10);
      const open = e.maxHp;
      standAt(sim, e, instanceOrigin(room.index, 3));
      expect(pvpVitalityAppliesTo(sim.ctx, e), room.id).toBe(true);
      expect(e.pvpVitalityActive, room.id).not.toBe(false);
      expect(e.maxHp, room.id).toBe(open);
    }
  });

  it('control: a party dungeon still switches it off (the release rule stands there)', () => {
    if (!PARTY_DUNGEON) throw new Error('no party dungeon');
    const { sim, e } = geared();
    const open = e.maxHp;
    standAt(sim, e, instanceOrigin(PARTY_DUNGEON.index, 0));
    expect(pvpVitalityAppliesTo(sim.ctx, e)).toBe(false);
    expect(e.pvpVitalityActive).toBe(false);
    expect(e.maxHp).toBeLessThan(open);
  });
});
