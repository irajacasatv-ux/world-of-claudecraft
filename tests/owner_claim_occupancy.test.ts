import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { DUNGEON_FLOOR_Y, DUNGEONS, instanceOrigin } from '../src/sim/data';
import {
  instanceClaimHolds,
  instanceClaimIdAt,
  updateInstances,
} from '../src/sim/instances/dungeons';
import { freshInstanceSlot } from '../src/sim/instances/instance_slot';
import { occupiedOwnerClaims } from '../src/sim/instances/owner_claim_occupancy';
import type { InstanceSlot } from '../src/sim/sim';
import { Sim } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import type { Vec3 } from '../src/sim/types';

function positionAt(index: number, slot: number): Vec3 {
  return { ...instanceOrigin(index, slot), y: DUNGEON_FLOOR_Y };
}

function ownerClaims(): InstanceSlot[] {
  return ['freehold_inn_room', 'freehold_cottage'].flatMap((id) =>
    Array.from({ length: 24 }, (_, slot) => ({
      ...freshInstanceSlot(id, slot),
      partyKey: `owner:${id}:${slot}`,
    })),
  );
}

function roster(instances = ownerClaims()) {
  return {
    instances,
    players: new Map<number, { entityId: number; disconnected?: boolean }>(),
    entities: new Map<number, { pos: Vec3; dead?: boolean; ghost?: boolean }>(),
    instanceScanCounters: { claimedSlotVisits: 0, ownerRosterVisits: 0, ownerClaimTests: 0 },
    tickCount: 1,
  };
}
type Roster = ReturnType<typeof roster>;
// The occupancy leaf reads only this narrow host. A non-sweep updateInstances
// also reads only tickCount and resets these counters before returning.
const context = (host: Roster): SimContext => host as unknown as SimContext;

function add(host: Roster, id: number, pos: Vec3, flags = {}) {
  host.players.set(id, { entityId: id });
  host.entities.set(id, { pos: { ...pos }, ...flags });
}

function bruteForce(host: Roster) {
  const occupied = new Set<InstanceSlot>();
  let tests = 0;
  for (const claim of host.instances) {
    if (claim.partyKey === null || DUNGEONS[claim.dungeonId]?.claimKey !== 'owner') continue;
    for (const meta of host.players.values()) {
      const entity = host.entities.get(meta.entityId);
      if (!entity) continue;
      tests++;
      if (instanceClaimHolds(claim, entity.pos)) {
        occupied.add(claim);
        break;
      }
    }
  }
  return { occupied, tests };
}

function indexed(host: Roster) {
  host.instanceScanCounters.ownerRosterVisits = 0;
  host.instanceScanCounters.ownerClaimTests = 0;
  return occupiedOwnerClaims(context(host), instanceClaimHolds);
}

describe('owner claim occupancy index', () => {
  it('matches the actual footprint comparator at strict slot and dungeon boundaries', () => {
    const host = roster();
    for (const claim of host.instances) {
      const o = positionAt(DUNGEONS[claim.dungeonId].index, claim.slot);
      for (const dx of [-300, -120, -119.999, 0, 119.999, 120, 300]) {
        for (const dz of [-250, -249.999, 0, 249.999, 250]) {
          host.players.clear();
          host.entities.clear();
          add(host, 1, { x: o.x + dx, y: o.y, z: o.z + dz });
          expect(indexed(host), `${claim.dungeonId}:${claim.slot} ${dx},${dz}`).toEqual(
            bruteForce(host).occupied,
          );
          expect(host.instanceScanCounters.ownerRosterVisits).toBe(1);
          expect(host.instanceScanCounters.ownerClaimTests).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('keeps ghosts and linkdead entities occupied while ignoring absent entities and roster removals', () => {
    const host = roster();
    for (const [i, flags] of [{}, { dead: true, ghost: true }, { disconnected: true }].entries()) {
      const claim = host.instances[i];
      const o = positionAt(DUNGEONS[claim.dungeonId].index, claim.slot);
      add(host, i + 1, o, flags);
      if (i === 2) host.players.get(i + 1)!.disconnected = true;
    }
    host.players.set(99, { entityId: 9999 });
    const abandoned = host.instances[3];
    host.entities.set(777, {
      pos: positionAt(DUNGEONS[abandoned.dungeonId].index, abandoned.slot),
    });
    expect(indexed(host)).toEqual(new Set(host.instances.slice(0, 3)));
    expect(indexed(host)).toEqual(bruteForce(host).occupied);
    host.players.delete(3);
    expect(indexed(host)).toEqual(new Set(host.instances.slice(0, 2)));
  });

  it('does not retain occupancy after release, reuse or movement to a different slot', () => {
    const host = roster();
    const first = host.instances[0];
    add(host, 1, positionAt(15, 0));
    expect(indexed(host)).toEqual(new Set([first]));
    first.partyKey = null;
    expect(indexed(host)).toEqual(new Set());
    const reused = { ...freshInstanceSlot(first.dungeonId, first.slot), partyKey: 'owner:new' };
    host.instances[0] = reused;
    expect(indexed(host)).toEqual(new Set([reused]));
    host.entities.get(1)!.pos = positionAt(16, 23);
    expect(indexed(host)).toEqual(new Set([host.instances[47]]));
    host.entities.clear();
    expect(indexed(host)).toEqual(new Set());
  });

  it('visits a 5000-player roster once for 48 vacant owner claims', () => {
    const host = roster();
    for (let id = 1; id <= 5000; id++) add(host, id, { x: -94, y: -2, z: -58 });
    // Warm both implementations against the exact same populated fixture.
    bruteForce(host);
    indexed(host);
    const beforeStart = performance.now();
    const before = bruteForce(host);
    const beforeMs = performance.now() - beforeStart;
    const afterStart = performance.now();
    const after = indexed(host);
    const afterMs = performance.now() - afterStart;
    expect(after).toEqual(before.occupied);
    expect(before.tests).toBe(240000);
    expect(host.instanceScanCounters.ownerRosterVisits).toBe(5000);
    expect(host.instanceScanCounters.ownerClaimTests).toBe(0);
    console.info('owner occupancy same-roster measurement', {
      beforeMs,
      afterMs,
      beforeTests: before.tests,
      ...host.instanceScanCounters,
    });
    for (let id = 1; id <= 5000; id++) {
      const claim = host.instances[(id - 1) % 48];
      host.entities.get(id)!.pos = positionAt(DUNGEONS[claim.dungeonId].index, claim.slot);
    }
    expect(indexed(host)).toEqual(new Set(host.instances));
    expect(host.instanceScanCounters.ownerRosterVisits).toBe(5000);
    expect(host.instanceScanCounters.ownerClaimTests).toBe(48);
  });

  it('skips roster work without owner claims and resets per-sweep counters on ordinary ticks', () => {
    const host = roster([freshInstanceSlot('hollow_crypt', 0)]);
    add(host, 1, positionAt(0, 0));
    expect(indexed(host)).toEqual(new Set());
    expect(host.instanceScanCounters.ownerRosterVisits).toBe(0);
    Object.assign(host.instanceScanCounters, {
      claimedSlotVisits: 48,
      ownerRosterVisits: 5000,
      ownerClaimTests: 48,
    });
    updateInstances(context(host));
    expect(host.instanceScanCounters).toEqual({
      claimedSlotVisits: 0,
      ownerRosterVisits: 0,
      ownerClaimTests: 0,
    });
  });

  it('runs the live sweep with owner and ordinary claims under the same lifecycle', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', noPlayer: true });
    const own = sim.instances.find(
      (claim) => claim.dungeonId === 'freehold_inn_room' && claim.slot === 0,
    )!;
    const ordinary = sim.instances.find(
      (claim) => claim.dungeonId === 'hollow_crypt' && claim.slot === 0,
    )!;
    own.partyKey = 'owner:present';
    ordinary.partyKey = 'solo:absent';
    own.emptyFor = 7;
    const pid = sim.addPlayer('warrior', 'Occupant');
    sim.entities.get(pid)!.pos = positionAt(15, 0);
    const ctx = (sim as unknown as { ctx: SimContext }).ctx;
    sim.tickCount = 20;
    updateInstances(ctx);
    expect(own.emptyFor).toBe(0);
    expect(ordinary.emptyFor).toBe(1);
    expect(sim.instanceScanCounters).toEqual({
      claimedSlotVisits: 2,
      ownerRosterVisits: 1,
      ownerClaimTests: 1,
    });
    sim.tickCount = 21;
    updateInstances(ctx);
    expect(sim.instanceScanCounters).toEqual({
      claimedSlotVisits: 0,
      ownerRosterVisits: 0,
      ownerClaimTests: 0,
    });
    expect(ordinary.emptyFor).toBe(1);
  });
});

describe('owner claim identity lookup', () => {
  it('resolves all owner slots without a pool scan and respects strict edges and released claims', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', noPlayer: true });
    const claims = sim.instances.filter((claim) => DUNGEONS[claim.dungeonId]?.claimKey === 'owner');
    for (const [index, claim] of claims.entries()) {
      claim.partyKey = `owner:${index}`;
      claim.exitId = 50000 + index;
    }
    const indexed = new Proxy(sim.instances, {
      get(target, key, receiver) {
        if (key === Symbol.iterator) throw new Error('owner identity lookup scanned the slot pool');
        return Reflect.get(target, key, receiver);
      },
    });
    const ctx = { instances: indexed } as SimContext;
    expect(instanceClaimIdAt(ctx, { x: -14, y: 0, z: -92 })).toBeNull();
    expect(claims).toHaveLength(48);
    for (const claim of claims) {
      const pos = positionAt(DUNGEONS[claim.dungeonId].index, claim.slot);
      expect(instanceClaimIdAt(ctx, pos)).toBe(claim.exitId);
      expect(instanceClaimIdAt(ctx, { ...pos, x: pos.x + 120 })).toBeNull();
      expect(instanceClaimIdAt(ctx, { ...pos, z: pos.z + 250 })).toBeNull();
      claim.partyKey = null;
      expect(instanceClaimIdAt(ctx, pos)).toBeNull();
    }
  });
});
