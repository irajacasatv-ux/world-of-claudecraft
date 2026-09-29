import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { EMPTY_TEST_WORLD } from './sim_shared';

function joinParty(sim: Sim, leaderId: number, memberId: number): void {
  sim.partyInvite(memberId, leaderId);
  sim.partyAccept(memberId);
}

// One seed for the file: no case reads a seeded roll, and each fresh seed built
// its own collider grid on the first tick (over a second each).
const BARRIER_SEED = 86;

describe('Mass Barrier specialization theme', () => {
  for (const [spec, personalBarrierId, personalBarrierCooldown] of [
    ['arcane', 'temporal_barrier', 12],
    ['fire', 'blazing_barrier', 30],
    ['frost', 'ice_barrier', 30],
  ] as const) {
    it(`also starts ${personalBarrierId}'s cooldown for a ${spec} caster`, () => {
      const sim = new Sim({
        seed: BARRIER_SEED,
        playerClass: 'mage',
        autoEquip: true,
        world: EMPTY_TEST_WORLD,
      });
      sim.setPlayerLevel(20);
      expect(sim.applyTalents({ spec, rows: { 17: 'mag_r17_mass_barrier' } })).toBe(true);

      sim.castAbility('mass_barrier');

      expect(sim.player.cooldowns.get(personalBarrierId)).toBe(personalBarrierCooldown);
    });
  }

  for (const [spec, school] of [
    ['arcane', 'arcane'],
    ['fire', 'fire'],
    ['frost', 'frost'],
  ] as const) {
    it(`stores the ${school} visual school for a ${spec} caster`, () => {
      const sim = new Sim({
        seed: BARRIER_SEED,
        playerClass: 'mage',
        autoEquip: true,
        world: EMPTY_TEST_WORLD,
      });
      sim.setPlayerLevel(20);
      expect(sim.applyTalents({ spec, rows: { 17: 'mag_r17_mass_barrier' } })).toBe(true);
      const player = sim.player;
      const allyId = sim.addPlayer('warrior', `Ally${spec}`);
      const ally = sim.entities.get(allyId)!;
      ally.pos = { ...player.pos };
      ally.prevPos = { ...player.pos };
      player.resource = player.maxResource;
      joinParty(sim, player.id, ally.id);

      sim.castAbility('mass_barrier');
      sim.tick();

      const barrier = player.auras.find((a) => a.id === 'mass_barrier');
      const allyBarrier = ally.auras.find((a) => a.id === 'mass_barrier');
      expect(barrier?.school).toBe(school);
      expect(allyBarrier?.school).toBe(school);
    });
  }

  it('shields nearby group members but never unrelated friendly players', () => {
    const sim = new Sim({
      seed: BARRIER_SEED,
      playerClass: 'mage',
      autoEquip: true,
      world: EMPTY_TEST_WORLD,
    });
    sim.setPlayerLevel(20);
    expect(sim.applyTalents({ spec: 'frost', rows: { 17: 'mag_r17_mass_barrier' } })).toBe(true);
    const caster = sim.player;
    const memberId = sim.addPlayer('warrior', 'Grouped');
    const outsiderId = sim.addPlayer('warrior', 'Outsider');
    const member = sim.entities.get(memberId)!;
    const outsider = sim.entities.get(outsiderId)!;
    for (const ally of [member, outsider]) {
      ally.pos = { ...caster.pos };
      ally.prevPos = { ...caster.pos };
    }
    joinParty(sim, caster.id, member.id);

    sim.castAbility('mass_barrier');
    sim.tick();

    expect(caster.auras.some((aura) => aura.id === 'mass_barrier')).toBe(true);
    expect(member.auras.some((aura) => aura.id === 'mass_barrier')).toBe(true);
    expect(outsider.auras.some((aura) => aura.id === 'mass_barrier')).toBe(false);
  });

  it('always includes a higher-id caster when five allies are co-located', () => {
    const sim = new Sim({
      seed: BARRIER_SEED,
      playerClass: 'warrior',
      autoEquip: true,
      world: EMPTY_TEST_WORLD,
    });
    const lowerIdAllies = [sim.player];
    for (let i = 0; i < 4; i++) {
      const allyId = sim.addPlayer('warrior', `Tie${i}`);
      lowerIdAllies.push(sim.entities.get(allyId)!);
    }
    const casterId = sim.addPlayer('mage', 'TieMage');
    const caster = sim.entities.get(casterId)!;
    sim.setPlayerLevel(20, casterId);
    expect(
      sim.applyTalents({ spec: 'arcane', rows: { 17: 'mag_r17_mass_barrier' } }, casterId),
    ).toBe(true);
    for (const ally of lowerIdAllies) {
      ally.pos = { ...caster.pos };
      ally.prevPos = { ...caster.pos };
    }
    // Join in descending id order (the lowest id last), so the member order the party keeps
    // disagrees with id order and the pin below can only pass on the id rule.
    for (const ally of lowerIdAllies.slice(1).reverse()) joinParty(sim, caster.id, ally.id);
    sim.convertPartyToRaid(caster.id);
    joinParty(sim, caster.id, lowerIdAllies[0].id);
    expect(sim.partyOf(caster.id)?.raid).toBe(true);
    caster.resource = caster.maxResource;

    sim.castAbility('mass_barrier', casterId);
    sim.tick();

    const shielded = [...sim.entities.values()].filter((entity) =>
      entity.auras.some((aura) => aura.id === 'mass_barrier'),
    );
    expect(caster.auras.some((aura) => aura.id === 'mass_barrier')).toBe(true);
    expect(shielded).toHaveLength(5);
    // The allies all tie on distance, and a tie goes to the lower id, the
    // sim-wide rule that keeps a pick the same on every host (stated at the
    // chain pick in combat/trinkets.ts; the recipients arrive id-sorted from
    // combat/group_targeting.ts and the aoeAllyAbsorb comparator in
    // combat/effect_dispatch.ts breaks ties on id too): the four lowest-id
    // allies join the caster, and the highest-id ally is the one left out.
    const ids = lowerIdAllies.map((ally) => ally.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    const shieldedAlly = (ally: (typeof lowerIdAllies)[number]) =>
      ally.auras.some((aura) => aura.id === 'mass_barrier');
    expect(lowerIdAllies.map(shieldedAlly)).toEqual([true, true, true, true, false]);
  });
});
