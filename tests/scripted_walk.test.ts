import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import { walkEncounterActorTo } from '../src/sim/encounters/scripted_walk';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import { DT } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

// Each case walks a hand-made actor, so both Sims run on the empty world and share
// one seed (the second case's own seed paid a second full build).
const walkSim = () =>
  new Sim({ seed: 8410, playerClass: 'warrior', noPlayer: true, world: EMPTY_TEST_WORLD });

describe('scripted encounter walk', () => {
  it('uses ordinary mob movement without teleporting to the destination', () => {
    const sim = walkSim();
    const actor = createMob(9_900, MOBS.forest_wolf, 5, sim.ctx.groundPos(0, 0));
    const destination = sim.ctx.groundPos(10, 0);
    const before = { ...actor.pos };

    expect(walkEncounterActorTo(sim.ctx, actor, destination)).toBe(false);

    const distanceMoved = Math.hypot(actor.pos.x - before.x, actor.pos.z - before.z);
    expect(distanceMoved).toBeGreaterThan(0);
    expect(distanceMoved).toBeLessThanOrEqual(actor.moveSpeed * DT + 1e-8);
    expect(Math.hypot(actor.pos.x - destination.x, actor.pos.z - destination.z)).toBeGreaterThan(
      0.3,
    );
  });

  it('faces a rooted actor toward the destination without moving it', () => {
    const sim = walkSim();
    const actor = createMob(9_901, MOBS.forest_wolf, 5, sim.ctx.groundPos(0, 0));
    const destination = sim.ctx.groundPos(10, 0);
    actor.auras.push({
      id: 'scripted_walk_root',
      name: 'Scripted Walk Root',
      kind: 'root',
      remaining: 2,
      duration: 2,
      value: 0,
      sourceId: actor.id,
      school: 'physical',
    });
    const before = { ...actor.pos };

    expect(walkEncounterActorTo(sim.ctx, actor, destination)).toBe(false);

    expect(actor.pos).toEqual(before);
    expect(actor.facing).toBeGreaterThan(0);
  });
});
