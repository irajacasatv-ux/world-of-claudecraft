import { describe, expect, it } from 'vitest';
import { summonPyreColossus } from '../src/sim/combat/destruction';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import { EMPTY_TEST_WORLD } from './sim_shared';

// Regression for the "no passive health regen while not in combat" report
// (imdutha / ruanhx): a warlock standing idle with a summoned Pyre Colossus could not
// regenerate health. The owner stayed flagged `inCombat` because the pet held a
// target it was not actually fighting, while mana kept regenerating on its own
// 5-second rule. Out-of-combat health regen must resume once the pet stops
// actively trading blows; a pet that IS fighting still keeps its owner in combat.

// The warlock stands on the empty world and fights a mob it places itself.
function makeWarlock() {
  const sim = new Sim({
    seed: 7,
    playerClass: 'warlock' as any,
    autoEquip: true,
    world: EMPTY_TEST_WORLD,
  });
  sim.setPlayerLevel(20);
  const p: any = sim.player;
  return { sim, p };
}

function summonInfernal(sim: Sim, p: any) {
  summonPyreColossus(sim.ctx, p, 1_000);
  for (const e of sim.entities.values()) if ((e as any).ownerId === p.id) return e as any;
  throw new Error('pet not created');
}

// A wild level 2 webwood spider (the mob nearest the start on the full world). It
// must also fight back: a passive-aggro template never targets the pet, and the
// owner-combat link keys off the mob's target.
function wildMob(sim: Sim) {
  expect(MOBS.webwood_spider.aggroRadius ?? 0).toBeGreaterThan(0);
  const mob = createMob((sim as any).nextId++, MOBS.webwood_spider, 2, { ...sim.player.pos });
  (sim as any).addEntity(mob);
  return mob as any;
}

describe('pet-held combat does not block owner health regen', () => {
  it('an idle pet (not trading blows) lets the owner regen health', () => {
    const { sim, p } = makeWarlock();
    const pet = summonInfernal(sim, p);
    const mob = wildMob(sim);

    // Give the pet a live, in-leash target it is NOT actually fighting: the mob
    // sits ~30yd off (inside PET_LEASH 40 so the pet keeps it as a target) and we
    // re-pin the pet beside the owner each tick so it never reaches melee range.
    // The pet's combatTimer therefore climbs past the linger window.
    const place = () => {
      pet.pos = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
      mob.pos = { x: p.pos.x + 30, y: p.pos.y, z: p.pos.z };
      pet.aggroTargetId = mob.id;
    };

    p.hp = Math.floor(p.maxHp * 0.4);
    p.resource = Math.floor(p.maxResource * 0.4);
    p.inCombat = false;
    p.combatTimer = 99;
    const hpStart = p.hp;

    for (let i = 0; i < 200; i++) {
      place();
      sim.tick();
    }

    expect(pet.aggroTargetId).toBe(mob.id); // pet still "has" the target
    expect(p.hp).toBeGreaterThan(hpStart); // but the owner regenerates
  });

  it('a pet actively trading blows still keeps its owner in combat (no regen)', () => {
    const { sim, p } = makeWarlock();
    const pet = summonInfernal(sim, p);
    const mob = wildMob(sim);

    // Park a high-HP target in melee range of the pet so it keeps swinging:
    // the pet's combatTimer stays low, so the owner stays in combat.
    mob.hp = 1_000_000;
    mob.maxHp = 1_000_000;
    pet.petMode = 'aggressive';
    const place = () => {
      pet.pos = { x: p.pos.x + 1, y: p.pos.y, z: p.pos.z };
      mob.pos = { x: p.pos.x + 2, y: p.pos.y, z: p.pos.z };
    };

    p.inCombat = false;
    p.combatTimer = 99;
    // let the aggressive pet actually acquire the target and start trading
    // blows before sampling the baseline (the warm-up takes a few seconds,
    // and the owner legitimately regens until the first blows land)
    for (let i = 0; i < 20 * 8 && pet.combatTimer >= 5; i++) {
      place();
      sim.tick();
    }
    p.hp = Math.floor(p.maxHp * 0.4);
    const hpStart = p.hp;

    for (let i = 0; i < 200; i++) {
      place();
      sim.tick();
    }

    expect(pet.combatTimer).toBeLessThan(5); // pet is genuinely fighting
    expect(p.hp).toBe(hpStart); // owner remains in combat, no health regen
  });
});
