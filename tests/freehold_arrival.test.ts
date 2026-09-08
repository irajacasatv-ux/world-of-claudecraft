import { describe, expect, it, vi } from 'vitest';
import { isBlocked } from '../src/sim/colliders';
import { BUILTIN_WORLD, DUNGEONS, instanceOrigin } from '../src/sim/data';
import { setFreeholdTier } from '../src/sim/freehold/state';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';

function setup(tier: 'inn_room' | 'cottage') {
  const sim = new Sim({
    seed: 42,
    playerClass: 'warrior',
    noPlayer: true,
    freeholdsEnabled: true,
    lockoutNowMs: () => 1000,
    world: { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] },
  });
  const a = sim.addPlayer('warrior', 'First', { freeholdOwnerKey: 'account:91' });
  const b = sim.addPlayer('warrior', 'Second', { freeholdOwnerKey: 'account:91' });
  setFreeholdTier(sim.ctx, 'account:91', tier);
  const gate = [...sim.entities.values()].find((e) => e.templateId === 'freehold_gate')!;
  const move = (pid: number, x: number, z: number) => {
    const e = sim.entities.get(pid)!;
    e.pos = sim.groundPos(x, z);
    e.prevPos = { ...e.pos };
    sim.ctx.rebucket(e);
  };
  const enter = (pid: number, surface: 'gate' | 'key') => {
    if (surface === 'gate') {
      move(pid, gate.pos.x, gate.pos.z);
      sim.freeholdEnter(pid);
    } else sim.useItem('hearth_key', pid);
  };
  const def = DUNGEONS[`freehold_${tier}`];
  sim.drainEvents();
  return { sim, a, b, move, enter, origin: instanceOrigin(def.index, 0) };
}

function travelState(sim: Sim) {
  return structuredClone({
    entities: [...sim.entities],
    inventories: [...sim.players].map(([id, meta]) => [id, meta.inventory]),
    claims: sim.instances,
    clocks: [...sim.freeholdKeyReadyAtMs],
    records: [...sim.freeholds],
    nextId: sim.nextId,
  });
}

function expectSafe(sim: Sim, entity: Entity, origin: { x: number; z: number }, zMax: number) {
  const x = entity.pos.x - origin.x;
  const z = entity.pos.z - origin.z;
  // Literal half-yard bodies fit wholly in the authored three-yard approach.
  expect(x).toBeGreaterThanOrEqual(-1);
  expect(x).toBeLessThanOrEqual(1);
  expect(z).toBeGreaterThanOrEqual(-4);
  expect(z).toBeLessThanOrEqual(zMax - 0.5);
  expect(isBlocked(42, entity.pos.x, entity.pos.z, 0.5)).toBe(false);
  expect(entity.pos.y).toBe(sim.groundPos(entity.pos.x, entity.pos.z).y);
  expect(entity.facing).toBe(0);
  expect(entity.prevFacing).toBe(0);
}

describe.each(['inn_room', 'cottage'] as const)('%s occupied owner arrivals', (tier) => {
  it.each(['gate', 'key'] as const)(
    '%s preserves empty entry and separates a same-account arrival without mutating its occupant',
    (surface) => {
      function replay() {
        const { sim, a, b, enter, origin } = setup(tier);
        sim.addItem('hearth_key', 1, b);
        const draws = vi.fn();
        sim.rng.setObserver(draws);
        enter(a, 'gate');
        const first = sim.entities.get(a)!;
        expect(first.pos).toEqual(sim.groundPos(origin.x, origin.z - 4));
        expect(first.facing).toBe(0);
        const occupant = structuredClone(first);
        enter(b, surface);
        const second = sim.entities.get(b)!;
        expect(sim.ctx.instanceClaimIdAt(second.pos)).toBe(sim.ctx.instanceClaimIdAt(first.pos));
        expect(
          Math.hypot(second.pos.x - first.pos.x, second.pos.z - first.pos.z),
        ).toBeGreaterThanOrEqual(1);
        expectSafe(sim, second, origin, tier === 'inn_room' ? 6 : 10);
        expect(first).toEqual(occupant);
        expect(sim.countItem('hearth_key', b)).toBe(1);
        expect(sim.freeholdKeyReadyAtMs.get('account:91')).toBe(
          surface === 'key' ? 3601000 : undefined,
        );
        expect(draws).not.toHaveBeenCalled();
        return travelState(sim);
      }
      expect(replay()).toEqual(replay());
    },
  );

  it.each([
    ['gate', 'vacant'],
    ['key', 'vacant'],
    ['gate', 'claimed'],
    ['key', 'claimed'],
  ] as const)(
    '%s refuses a full protected approach in a %s room before changing travel state',
    (surface, occupancy) => {
      const { sim, a, b, move, enter, origin } = setup(tier);
      sim.addItem('hearth_key', 1, b);
      if (occupancy === 'claimed') enter(a, 'gate');
      // This covers the full body-safe strip independently of the resolver's
      // candidate grid, including the exit side which arrival must not select.
      for (let x = -1; x <= 1; x++) {
        for (let z = -5.5; z <= (tier === 'inn_room' ? 5.5 : 9.5); z++) {
          const blocker = sim.addPlayer('warrior', `Blocker${x}/${z}`);
          move(blocker, origin.x + x, origin.z + z);
        }
      }
      const gate = [...sim.entities.values()].find((e) => e.templateId === 'freehold_gate')!;
      move(b, gate.pos.x, gate.pos.z);
      expect(sim.instances.filter((claim) => claim.partyKey !== null)).toHaveLength(
        occupancy === 'claimed' ? 1 : 0,
      );
      sim.freeholdKeyReadyAtMs.set('account:91', 900);
      sim.drainEvents();
      const before = travelState(sim);
      const draws = vi.fn();
      sim.rng.setObserver(draws);
      if (surface === 'gate') sim.freeholdEnter(b);
      else sim.useItem('hearth_key', b);
      expect(sim.drainEvents()).toEqual([{ type: 'freeholdDenied', pid: b, reason: 'busy' }]);
      expect(travelState(sim)).toEqual(before);
      expect(draws).not.toHaveBeenCalled();
    },
  );
});
