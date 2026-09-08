import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, DUNGEONS, instanceOrigin } from '../src/sim/data';
import { resolveOwnerArrival } from '../src/sim/instances/owner_arrival';
import { Sim } from '../src/sim/sim';

function setup() {
  const sim = new Sim({
    seed: 42,
    playerClass: 'warrior',
    noPlayer: true,
    freeholdsEnabled: true,
    world: { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] },
  });
  const pid = sim.addPlayer('warrior', 'Arriving');
  return { sim, pid, def: DUNGEONS.freehold_inn_room, origin: instanceOrigin(15, 0) };
}

describe('owner arrival resolver', () => {
  it('selects the same nearby pose across opposite spatial insertion orders', () => {
    const { sim, pid, def, origin } = setup();
    const blockers = [
      [0, -4],
      [0, -3],
      [-1, -4],
    ].map(([x, z], index) => {
      const id = sim.addPlayer('warrior', `Blocker${index}`);
      const entity = sim.entities.get(id)!;
      entity.pos = sim.groundPos(origin.x + x, origin.z + z);
      sim.ctx.rebucket(entity);
      return entity;
    });
    const before = structuredClone(blockers);
    const first = resolveOwnerArrival(sim.ctx, def, undefined, pid);
    expect(first).not.toBeNull();
    for (const entity of blockers) sim.grid.remove(entity);
    for (const entity of [...blockers].reverse()) sim.grid.insert(entity);
    expect(resolveOwnerArrival(sim.ctx, def, undefined, pid)).toEqual(first);
    expect(blockers).toEqual(before);
    for (const entity of blockers) {
      expect(Math.hypot(first!.x - entity.pos.x, first!.z - entity.pos.z)).toBeGreaterThanOrEqual(
        1,
      );
    }
  });

  it('refuses an entry whose only candidate overlaps the shipped hearth', () => {
    const { sim, pid, def } = setup();
    const before = structuredClone(sim.instances);
    expect(
      resolveOwnerArrival(sim.ctx, { ...def, entry: { x: 0, z: 9 } }, undefined, pid),
    ).toBeNull();
    expect(sim.instances).toEqual(before);
  });

  it('leaves the ordinary dungeon canonical entry unchanged even when it is occupied', () => {
    const { sim, pid } = setup();
    sim.setPlayerLevel(20, pid);
    const occupant = sim.entities.get(pid)!;
    const arriving = sim.addPlayer('warrior', 'PartyMember');
    sim.setPlayerLevel(20, arriving);
    sim.partyInvite(arriving, pid);
    sim.partyAccept(arriving);
    expect(sim.enterDungeon('nythraxis_crypt', pid)).toBe(true);
    const before = structuredClone(occupant);
    expect(sim.enterDungeon('nythraxis_crypt', arriving)).toBe(true);
    expect(sim.entities.get(arriving)?.pos).toEqual(occupant.pos);
    expect(occupant).toEqual(before);
  });
});
