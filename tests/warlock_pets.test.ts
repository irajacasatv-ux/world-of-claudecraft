import { describe, expect, it } from 'vitest';
import { grantXp } from '../src/sim/combat/damage';
import { ABILITIES, MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { despawnPet, restorePet, serializePet } from '../src/sim/pet/pet_commands';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';
import { xpForLevel } from '../src/sim/types';
import { terrainHeight } from '../src/sim/world';
import { EMPTY_TEST_WORLD } from './sim_shared';

// One seed on EMPTY_TEST_WORLD: the imp's target is a wild wolf this file spawns
// itself, so the ambient camps and each extra seed's world build were pure
// construction and tick cost.
const SEED = 42;

function makeSim() {
  return new Sim({ seed: SEED, playerClass: 'warlock', autoEquip: true, world: EMPTY_TEST_WORLD });
}

/** A wild (unowned, hostile) forest wolf for the imp to fight. */
function wildMob(sim: Sim): Entity {
  const p = sim.player;
  const mob = createMob(sim.nextId++, MOBS.forest_wolf, 5, { ...p.pos });
  mob.hostile = true;
  sim.addEntity(mob);
  return mob;
}

function teleport(e: Entity, x: number, z: number, seed: number) {
  e.pos.x = x;
  e.pos.z = z;
  e.pos.y = terrainHeight(x, z, seed);
  e.prevPos = { ...e.pos };
}

// drive a cast to completion (6-10s casts → tick well past it)
function castAndFinish(sim: Sim, id: string) {
  sim.castAbility(id);
  for (let i = 0; i < 20 * 12 && sim.player.castingAbility; i++) sim.tick();
}

describe('warlock demon pets', () => {
  it('grows Emberkin at each Summon Emberkin rank through level 20', () => {
    expect(ABILITIES.summon_imp.ranks?.map(({ rank, level }) => ({ rank, level }))).toEqual([
      { rank: 2, level: 8 },
      { rank: 3, level: 14 },
      { rank: 4, level: 20 },
    ]);

    for (const [level, scale] of [
      [1, 0.55],
      [7, 0.55],
      [8, 0.65],
      [13, 0.65],
      [14, 0.75],
      [19, 0.75],
      [20, 0.85],
    ] as const) {
      const sim = makeSim();
      sim.setPlayerLevel(level);
      if (level >= 5) expect(sim.setSpec('destruction')).toBe(true);
      castAndFinish(sim, 'summon_imp');
      expect(sim.petOf(sim.playerId)?.scale, `level ${level}`).toBe(scale);
    }
  });

  it('resizes an existing Emberkin immediately when its owner reaches a new rank', () => {
    const sim = makeSim();
    castAndFinish(sim, 'summon_imp');
    const emberkin = sim.petOf(sim.playerId);
    expect(emberkin?.scale).toBe(0.55);

    sim.setPlayerLevel(20);

    expect(sim.petOf(sim.playerId)).toBe(emberkin);
    expect(emberkin?.scale).toBe(0.85);
  });

  it('resizes Emberkin when its owner reaches a new rank through experience', () => {
    const sim = makeSim();
    sim.setPlayerLevel(7);
    expect(sim.setSpec('destruction')).toBe(true);
    castAndFinish(sim, 'summon_imp');
    const emberkin = sim.petOf(sim.playerId);
    const meta = sim.players.get(sim.playerId);
    if (!emberkin || !meta) throw new Error('Expected a warlock and Emberkin.');
    expect(emberkin.scale).toBe(0.55);

    grantXp(sim.ctx, xpForLevel(7), meta);

    expect(sim.player.level).toBe(8);
    expect(sim.petOf(sim.playerId)).toBe(emberkin);
    expect(emberkin.scale).toBe(0.65);
  });

  it('restores Emberkin at the scale for its owner current rank', () => {
    const sim = makeSim();
    castAndFinish(sim, 'summon_imp');
    const emberkin = sim.petOf(sim.playerId);
    const saved = serializePet(sim.ctx, sim.playerId);
    if (!emberkin || !saved) throw new Error('Expected a summoned Emberkin.');
    despawnPet(sim.ctx, emberkin);

    sim.setPlayerLevel(20);
    restorePet(sim.ctx, sim.player, saved);

    expect(sim.petOf(sim.playerId)?.scale).toBe(0.85);
  });

  it('summons an imp that is an owned, friendly demon', () => {
    const sim = makeSim();
    sim.setPlayerLevel(10);
    expect(sim.petOf(sim.playerId)).toBeNull();
    castAndFinish(sim, 'summon_imp');
    const pet = sim.petOf(sim.playerId);
    expect(pet).not.toBeNull();
    expect(pet!.templateId).toBe('emberkin');
    expect(pet!.ownerId).toBe(sim.playerId);
    expect(pet!.hostile).toBe(false);
  });

  it("imp attacks the owner's enemy at range with fire damage", () => {
    const sim = makeSim();
    sim.setPlayerLevel(12);
    castAndFinish(sim, 'summon_imp');
    const imp = sim.petOf(sim.playerId)!;
    const mob = wildMob(sim);
    mob.maxHp = 5000;
    mob.hp = 5000;
    teleport(mob, sim.player.pos.x + 10, sim.player.pos.z, sim.cfg.seed);
    // owner engages: the pet assists targets the owner is attacking
    sim.targetEntity(mob.id);
    sim.startAutoAttack();
    let sawFire = false;
    for (let i = 0; i < 20 * 12; i++) {
      const ev = sim.tick();
      if (
        ev.some(
          (e: any) =>
            e.type === 'damage' && e.sourceId === imp.id && e.school === 'fire' && e.amount > 0,
        )
      )
        sawFire = true;
      if (sawFire) break;
    }
    expect(sawFire).toBe(true);
    expect(mob.hp).toBeLessThan(5000);
  });

  it('summoning a voidwalker replaces the existing imp', () => {
    const sim = makeSim();
    sim.setPlayerLevel(12);
    castAndFinish(sim, 'summon_imp');
    const imp = sim.petOf(sim.playerId)!;
    expect(imp.templateId).toBe('emberkin');
    castAndFinish(sim, 'summon_voidwalker');
    const pet = sim.petOf(sim.playerId)!;
    expect(pet.templateId).toBe('gloomshade');
    // the imp is gone from the world entirely (summoned demons unravel)
    expect(sim.entities.has(imp.id)).toBe(false);
  });

  it('gloomshade, the tank demon, auto-taunts by default on summon', () => {
    // Bug #1356: createDemonPet unconditionally set petAutoTaunt=false for every
    // demon, so Duskmurk (a "sturdy melee tank that taunts to hold threat", per
    // this file's header comment) never held aggro unless the owner manually
    // toggled auto-taunt every session. A melee_tank demon should come up with
    // auto-taunt already on.
    const sim = makeSim();
    sim.setPlayerLevel(12);
    castAndFinish(sim, 'summon_voidwalker');
    const pet = sim.petOf(sim.playerId);
    expect(pet).not.toBeNull();
    expect(pet!.templateId).toBe('gloomshade');
    expect(pet!.petAutoTaunt).toBe(true);
  });

  it('gloomshade does not auto-taunt by default for a grouped owner', () => {
    // Auto-taunting off a 10s cycle with no target/tank check would rip every
    // non-boss add off the real party/raid tank. Keep the free default scoped
    // to solo play; a grouped warlock keeps the manual /pettaunt opt-in.
    const sim = new Sim({
      seed: SEED,
      playerClass: 'warlock',
      noPlayer: true,
      world: EMPTY_TEST_WORLD,
    });
    const lockPid = sim.addPlayer('warlock', 'Lock');
    const otherPid = sim.addPlayer('warrior', 'Tank');
    sim.partyInvite(otherPid, lockPid);
    sim.partyAccept(otherPid);
    const lock = sim.entities.get(lockPid)!;
    sim.setPlayerLevel(12, lockPid);
    lock.resource = lock.maxResource;
    sim.castAbility('summon_voidwalker', lockPid);
    for (let i = 0; i < 20 * 12 && sim.entities.get(lockPid)!.castingAbility; i++) sim.tick();
    const pet = sim.petOf(lockPid);
    expect(pet).not.toBeNull();
    expect(pet!.templateId).toBe('gloomshade');
    expect(pet!.petAutoTaunt).toBe(false);
  });

  it('emberkin, the ranged damage demon, does not auto-taunt by default', () => {
    // Non-tank demons keep the prior default: no free auto-taunt for a demon
    // that was never described as a threat-holder.
    const sim = makeSim();
    sim.setPlayerLevel(10);
    castAndFinish(sim, 'summon_imp');
    const pet = sim.petOf(sim.playerId);
    expect(pet).not.toBeNull();
    expect(pet!.templateId).toBe('emberkin');
    expect(pet!.petAutoTaunt).toBe(false);
  });

  it('a slain demon unravels instead of respawning into the wild', () => {
    const sim = makeSim();
    sim.setPlayerLevel(12);
    castAndFinish(sim, 'summon_imp');
    const imp = sim.petOf(sim.playerId)!;
    (sim as any).dealDamage(null, imp, imp.maxHp + 100, false, 'shadow', null, 'hit', true);
    expect(imp.dead).toBe(true);
    // brief corpse, then it despawns (no wild demon left behind)
    for (let i = 0; i < 20 * 5; i++) sim.tick();
    expect(sim.entities.has(imp.id)).toBe(false);
    for (const e of sim.entities.values()) {
      expect(e.templateId).not.toBe('emberkin');
    }
  });
});
