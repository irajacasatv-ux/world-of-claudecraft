import { describe, expect, it } from 'vitest';
import { isRooted } from '../src/sim/combat/cc';
import { type ConsumeAuraEffect, consumableAuraIndex } from '../src/sim/combat/consume_aura_match';
import { handleDeath } from '../src/sim/combat/damage';
import {
  druidEngineCombatState,
  druidEngineOnHotPlanted,
  druidEngineOnLandedStrike,
  LOPING_STRIDE_SPEED,
  MOONTIDE_ID,
  OLD_BLOOD_ID,
  VERDANCE_ID,
} from '../src/sim/combat/druid_engines';
import { onCastCompleted } from '../src/sim/combat/talent_procs';
import { MOBS } from '../src/sim/data';
import { createMob, recalcPlayerStats } from '../src/sim/entity';
import { moveSpeedMult } from '../src/sim/player_motion';
import { Sim } from '../src/sim/sim';
import type { Aura, Entity } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

// Every Sim here runs on one seed and EMPTY_TEST_WORLD: each case fights a mob or
// restores a save it makes itself, so the ambient overworld and each extra seed's
// world build were pure construction and tick cost.
function rig(spec: 'balance' | 'feral' | 'restoration', rows: Record<number, string> = {}) {
  const sim = new Sim({ seed: 29, playerClass: 'druid', autoEquip: true, world: EMPTY_TEST_WORLD });
  sim.setPlayerLevel(20);
  expect(sim.applyTalents({ spec, rows })).toBe(true);
  sim.player.resource = sim.player.maxResource;
  return { sim, player: sim.player };
}

function ctx(sim: Sim): Parameters<typeof onCastCompleted>[0] {
  return (sim as unknown as { ctx: Parameters<typeof onCastCompleted>[0] }).ctx;
}

function completed(sim: Sim, abilityId: string, target: Entity | null = null): void {
  onCastCompleted(ctx(sim), sim.player, abilityId, target);
}

function stacks(player: Entity, id: string): number {
  return player.auras.find((aura) => aura.id === id)?.stacks ?? 0;
}

function formAura(player: Entity, kind: Aura['kind']): Aura {
  return {
    id: kind,
    name: kind,
    kind,
    remaining: 3600,
    duration: 3600,
    value: 0,
    sourceId: player.id,
    school: 'nature',
  };
}

function targetMob(sim: Sim): Entity {
  const player = sim.player;
  const mob = createMob(9820, MOBS.forest_wolf, 20, {
    x: player.pos.x,
    y: player.pos.y,
    z: player.pos.z + 2,
  });
  mob.hostile = true;
  mob.maxHp = mob.hp = 1_000_000;
  (sim as unknown as { addEntity(entity: Entity): void }).addEntity(mob);
  sim.targetEntity(mob.id);
  player.facing = 0;
  return mob;
}

describe('Moongrove engine', () => {
  it('keeps Moonseed and its engine effects inside Moonwing', () => {
    const { sim, player } = rig('balance');
    const mob = targetMob(sim);
    mob.level = 1;
    mob.auras.push({
      id: 'moonfire',
      name: 'Lunar Tempest',
      kind: 'dot',
      remaining: 6,
      duration: 12,
      value: 10,
      tickInterval: 3,
      tickTimer: 3,
      sourceId: player.id,
      school: 'arcane',
      extendedBy: 0,
    });
    const hpBefore = mob.hp;

    sim.castAbility('moonseed');

    expect(mob.hp).toBe(hpBefore);
    expect(mob.auras.find((aura) => aura.id === 'moonfire')?.remaining).toBe(6);
    expect(stacks(player, MOONTIDE_ID)).toBe(0);
    expect(player.cooldowns.has('moonseed')).toBe(false);

    player.auras.push(formAura(player, 'form_moonkin'));
    player.resource = player.maxResource;
    sim.castAbility('moonseed');
    for (let tick = 0; tick < 20; tick++) sim.tick();

    expect(player.cooldowns.has('moonseed')).toBe(true);
    expect(mob.auras.find((aura) => aura.id === 'moonfire')?.remaining).toBeGreaterThan(6);
    expect(mob.auras.find((aura) => aura.id === 'moonfire')?.extendedBy).toBe(6);
    expect(stacks(player, MOONTIDE_ID)).toBe(1);
  });

  it('arms both payoff choices at full Moontide and either press spends the bank', () => {
    const { sim, player } = rig('balance');

    completed(sim, 'wrath');
    expect(stacks(player, MOONTIDE_ID)).toBe(0);

    player.auras.push(formAura(player, 'form_moonkin'));
    completed(sim, 'wrath');
    completed(sim, 'starfire');
    completed(sim, 'moonseed');
    expect(stacks(player, MOONTIDE_ID)).toBe(3);
    expect(sim.resolvedAbility('moonseed')?.def.id).toBe('moonlash');
    expect(sim.resolvedAbility('starfire')?.def.id).toBe('sunlance');
    expect(sim.resolvedAbility('wrath')?.def.id).toBe('wrath');

    completed(sim, 'moonlash');
    expect(stacks(player, MOONTIDE_ID)).toBe(0);
    expect(sim.resolvedAbility('moonseed')?.def.id).toBe('moonseed');
    expect(sim.resolvedAbility('starfire')?.def.id).toBe('starfire');

    completed(sim, 'wrath');
    completed(sim, 'wrath');
    completed(sim, 'wrath');
    completed(sim, 'sunlance');
    expect(stacks(player, MOONTIDE_ID)).toBe(0);
    expect(sim.resolvedAbility('moonseed')?.def.id).toBe('moonseed');
    expect(sim.resolvedAbility('starfire')?.def.id).toBe('starfire');
  });

  it('freezes the bank outside Moonwing and disarms both payoffs', () => {
    const { sim, player } = rig('balance');
    const mob = targetMob(sim);
    player.auras.push(formAura(player, 'form_moonkin'));
    completed(sim, 'wrath');
    completed(sim, 'wrath');
    completed(sim, 'wrath');
    expect(sim.resolvedAbility('starfire')?.def.id).toBe('sunlance');

    player.auras = player.auras.filter((aura) => aura.kind !== 'form_moonkin');
    expect(stacks(player, MOONTIDE_ID)).toBe(3);
    expect(sim.resolvedAbility('moonseed')?.def.id).toBe('moonseed');
    expect(sim.resolvedAbility('starfire')?.def.id).toBe('starfire');

    // A base Skyfall hard-cast out of form is a plain nuke: it must not
    // touch the frozen bank.
    player.resource = player.maxResource;
    player.gcdRemaining = 0;
    sim.castAbility('starfire');
    for (let tick = 0; tick < 80; tick++) sim.tick();
    expect(mob.hp).toBeLessThan(mob.maxHp);
    expect(stacks(player, MOONTIDE_ID)).toBe(3);

    player.auras.push(formAura(player, 'form_moonkin'));
    expect(sim.resolvedAbility('moonseed')?.def.id).toBe('moonlash');
    expect(sim.resolvedAbility('starfire')?.def.id).toBe('sunlance');
  });

  it('fires Moonsurge through the Moonseed cooldown and spends the bank once', () => {
    const { sim, player } = rig('balance');
    const mob = targetMob(sim);
    player.auras.push(formAura(player, 'form_moonkin'));
    completed(sim, 'wrath');
    completed(sim, 'wrath');
    completed(sim, 'wrath');
    player.cooldowns.set('moonseed', 5);
    expect(sim.resolvedAbility('moonseed')?.def.id).toBe('moonlash');

    player.resource = player.maxResource;
    player.gcdRemaining = 0;
    sim.castAbility('moonseed');
    for (let tick = 0; tick < 5; tick++) sim.tick();

    expect(mob.hp).toBeLessThan(mob.maxHp);
    expect(stacks(player, MOONTIDE_ID)).toBe(0);
    expect(player.cooldowns.get('moonseed')).toBeGreaterThan(0);
    // With the bank spent, the button is Moonseed again and still recharging.
    expect(sim.resolvedAbility('moonseed')?.def.id).toBe('moonseed');
  });

  it('amplifies the full Sunwake burn through Wild Apex', () => {
    const baseline = rig('balance');
    const apex = rig('balance', { 20: 'dru_r20_berserk' });
    const baselineTarget = targetMob(baseline.sim);
    const apexTarget = targetMob(apex.sim);

    for (const { sim, player, target } of [
      { ...baseline, target: baselineTarget },
      { ...apex, target: apexTarget },
    ]) {
      player.auras.push(formAura(player, 'form_moonkin'));
      completed(sim, 'wrath');
      completed(sim, 'wrath');
      completed(sim, 'wrath');
      expect(sim.resolvedAbility('starfire')?.def.id).toBe('sunlance');
      const direct = sim
        .resolvedAbility('starfire')
        ?.effects.find((effect) => effect.type === 'directDamage');
      expect(direct).toMatchObject({ type: 'directDamage' });
      if (direct?.type !== 'directDamage') throw new Error('missing Sunlance damage');
      // Sunwake resolves to its rebalanced Nature strike (base 80-100, lifted by
      // the Balance spell-damage passive to ~98-123); the v0.29 pass moved its
      // ceiling down and onto a spell-power rider so a caster scales with gear.
      expect(direct.min).toBeGreaterThan(90);
      expect(direct.max).toBeGreaterThan(110);
      player.resource = player.maxResource;
      player.gcdRemaining = 0;
      sim.castAbility('starfire');
      for (let tick = 0; tick < 20; tick++) sim.tick();
      expect(target.auras.some((aura) => aura.id === 'sunlance')).toBe(true);
    }

    const baselineBurn = baselineTarget.auras.find((aura) => aura.id === 'sunlance')?.value;
    const apexBurn = apexTarget.auras.find((aura) => aura.id === 'sunlance')?.value;
    expect(baselineBurn).toBeGreaterThan(0);
    expect(apexBurn).toBeGreaterThanOrEqual(Math.floor((baselineBurn ?? 0) * 1.25));
    expect(apexBurn).toBeLessThanOrEqual(Math.ceil((baselineBurn ?? 0) * 1.25));
  });
});

describe('Wildfang engine', () => {
  it('applies Wildfang AP tuning to the Cat Form bonus', () => {
    const { sim, player } = rig('feral');
    const meta = sim.meta(player.id);
    expect(meta).toBeDefined();
    if (!meta) throw new Error('missing Druid metadata');
    // Remove only the new AP factor to recover the unrounded caster base.
    const baselineMods = { ...meta.talentMods, stats: { ...meta.talentMods.stats, apPct: 0 } };
    recalcPlayerStats(player, meta.cls, meta.equipment, baselineMods, meta.equipmentInstance);
    const casterAttackPower = player.attackPower;
    player.auras.push(formAura(player, 'form_cat'));
    recalcPlayerStats(player, meta.cls, meta.equipment, meta.talentMods, meta.equipmentInstance);

    expect(player.attackPower).toBe(Math.round((casterAttackPower + 8 + player.level * 2) * 1.1));
  });

  it('shares three landed stages across forms, spends through the live button, and clears after combat', () => {
    const { sim, player } = rig('feral');
    const mob = targetMob(sim);
    const engineCtx = ctx(sim);

    druidEngineOnLandedStrike(engineCtx, player, 'claw');
    druidEngineOnLandedStrike(engineCtx, player, 'rake');
    player.auras.push(formAura(player, 'form_cat'));
    druidEngineOnLandedStrike(engineCtx, player, 'maul');
    expect(stacks(player, OLD_BLOOD_ID)).toBe(3);
    expect(sim.resolvedAbility('ferocious_bite')?.def.id).toBe('redharvest');

    // Redharvest never requires combo points: at 0 the bank is the payment
    // and the base bite still lands (the post-Bloodrift press).
    player.comboPoints = 0;
    player.resource = player.maxResource;
    sim.castAbility('ferocious_bite');
    expect(mob.hp).toBeLessThan(mob.maxHp);
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);

    druidEngineOnLandedStrike(engineCtx, player, 'swipe');
    expect(stacks(player, OLD_BLOOD_ID)).toBe(1);
    player.inCombat = false;
    druidEngineCombatState(engineCtx, player);
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);
  });

  it('casts rank 1 Redharvest through the transformed button at level 8', () => {
    // Redharvest now ranks 1/2/3 at levels 5/10/16 and Gorebite learns at 8,
    // so a level-8 feral is the first with the transforming button. The
    // transform resolves the actor-level rank: rank 1 bites for 35 plus 20 per
    // combo and refunds 15, so the cast nets minus 20 energy (35 cost, 15 back).
    const sim = new Sim({
      seed: 29,
      playerClass: 'druid',
      autoEquip: true,
      world: EMPTY_TEST_WORLD,
    });
    sim.setPlayerLevel(8);
    expect(sim.applyTalents({ spec: 'feral', rows: {} })).toBe(true);
    const player = sim.player;
    const mob = targetMob(sim);
    const engineCtx = ctx(sim);
    player.auras.push(formAura(player, 'form_cat'));
    druidEngineOnLandedStrike(engineCtx, player, 'claw');
    druidEngineOnLandedStrike(engineCtx, player, 'rake');
    druidEngineOnLandedStrike(engineCtx, player, 'claw');
    expect(stacks(player, OLD_BLOOD_ID)).toBe(3);
    const resolvedRank = sim.resolvedAbility('ferocious_bite');
    expect(resolvedRank?.def.id).toBe('redharvest');
    expect(resolvedRank?.rank).toBe(1);

    player.comboPoints = 0;
    player.resource = 50;
    sim.castAbility('ferocious_bite');
    expect(mob.hp).toBeLessThan(mob.maxHp);
    expect(player.resource).toBe(30);
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);
  });

  it('resolves offensive Marrowbreak through the Bruin button with mastery and snap threat', () => {
    const { sim, player } = rig('feral');
    const mob = targetMob(sim);
    player.auras.push(formAura(player, 'form_bear'));
    player.hp = Math.round(player.maxHp * 0.75);
    player.resourceType = 'rage';
    player.resource = 100;
    druidEngineOnLandedStrike(ctx(sim), player, 'claw');
    druidEngineOnLandedStrike(ctx(sim), player, 'rake');
    druidEngineOnLandedStrike(ctx(sim), player, 'swipe');

    const replacement = sim.resolvedAbility('maul');
    expect(replacement?.def.id).toBe('marrowbreak');
    expect(replacement?.effects.find((effect) => effect.type === 'directDamage')).toMatchObject({
      min: Math.round(78 * 1.65),
      max: Math.round(96 * 1.65),
    });
    sim.castAbility('maul');

    expect(mob.hp).toBeLessThan(mob.maxHp);
    expect(mob.threat.get(player.id)).toBeGreaterThan(110);
    expect(player.auras.some((aura) => aura.id === 'marrowbreak_guard')).toBe(false);
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);
  });

  it('converts Marrowbreak into an absorb and rage refund below half health', () => {
    const { sim, player } = rig('feral');
    const mob = targetMob(sim);
    player.auras.push(formAura(player, 'form_bear'));
    player.hp = Math.round(player.maxHp * 0.4);
    player.resourceType = 'rage';
    player.resource = 20;
    druidEngineOnLandedStrike(ctx(sim), player, 'claw');
    druidEngineOnLandedStrike(ctx(sim), player, 'rake');
    druidEngineOnLandedStrike(ctx(sim), player, 'swipe');

    sim.castAbility('maul');

    expect(mob.hp).toBe(mob.maxHp);
    expect(mob.threat.get(player.id)).toBeUndefined();
    expect(player.auras.find((aura) => aura.id === 'marrowbreak_guard')).toMatchObject({
      kind: 'absorb',
      value: Math.round(player.maxHp * 0.18),
    });
    expect(player.resource).toBe(20);
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);
  });

  it('clears Old Blood through the authoritative tick and on specialization change', () => {
    const { sim, player } = rig('feral');
    druidEngineOnLandedStrike(ctx(sim), player, 'claw');
    expect(stacks(player, OLD_BLOOD_ID)).toBe(1);
    player.inCombat = false;
    player.combatTimer = 99;
    sim.tick();
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);

    druidEngineOnLandedStrike(ctx(sim), player, 'claw');
    expect(sim.applyTalents({ spec: 'balance', rows: {} })).toBe(true);
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);
  });

  it('clears engine banks on death and does not persist them through logout', () => {
    const { sim, player } = rig('feral');
    druidEngineOnLandedStrike(ctx(sim), player, 'claw');
    expect(stacks(player, OLD_BLOOD_ID)).toBe(1);

    handleDeath(ctx(sim), player, null);
    expect(player.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(false);

    const state = sim.serializeCharacter(player.id);
    expect(state).not.toBeNull();
    const restored = new Sim({
      seed: 29,
      playerClass: 'warrior',
      noPlayer: true,
      world: EMPTY_TEST_WORLD,
    });
    const restoredId = restored.addPlayer('druid', 'Returning', { state: state ?? undefined });
    expect(restored.entities.get(restoredId)?.auras.some((aura) => aura.id === OLD_BLOOD_ID)).toBe(
      false,
    );

    // Verdance rides the same death path.
    const resto = rig('restoration');
    druidEngineOnHotPlanted(ctx(resto.sim), resto.player, 'rejuvenation');
    expect(stacks(resto.player, VERDANCE_ID)).toBe(1);
    handleDeath(ctx(resto.sim), resto.player, null);
    expect(resto.player.auras.some((aura) => aura.id === VERDANCE_ID)).toBe(false);

    // Logout WITHOUT dying: a living druid's serialized character still
    // carries no engine bank (the death clear above must not be what saves us).
    const alive = rig('balance');
    alive.player.auras.push(formAura(alive.player, 'form_moonkin'));
    completed(alive.sim, 'wrath');
    expect(stacks(alive.player, MOONTIDE_ID)).toBe(1);
    const aliveState = alive.sim.serializeCharacter(alive.player.id);
    expect(aliveState).not.toBeNull();
    const relogged = new Sim({
      seed: 29,
      playerClass: 'warrior',
      noPlayer: true,
      world: EMPTY_TEST_WORLD,
    });
    const reloggedId = relogged.addPlayer('druid', 'Relogged', {
      state: aliveState ?? undefined,
    });
    const reloggedPlayer = relogged.entities.get(reloggedId);
    expect(reloggedPlayer?.auras.some((aura) => aura.id === MOONTIDE_ID)).toBe(false);
    expect(reloggedPlayer?.auras.some((aura) => aura.id === VERDANCE_ID)).toBe(false);
  });
});

describe('Groveheart engine', () => {
  it('counts planted HoTs and Overbloom harvests then replants Wildbloom', () => {
    const { sim, player } = rig('restoration');
    for (let cast = 0; cast < 5; cast++) {
      druidEngineOnHotPlanted(ctx(sim), player, cast % 2 ? 'regrowth' : 'rejuvenation');
    }
    expect(stacks(player, VERDANCE_ID)).toBe(5);
    expect(sim.resolvedAbility('swiftmend')?.def.id).toBe('overbloom');

    player.hp = Math.round(player.maxHp * 0.25);
    player.auras.push({
      id: 'regrowth',
      name: 'Second Bloom',
      kind: 'hot',
      remaining: 12,
      duration: 21,
      value: 25,
      tickInterval: 3,
      tickTimer: 3,
      sourceId: player.id,
      school: 'nature',
    });
    sim.castAbility('swiftmend');

    expect(player.hp).toBeGreaterThan(Math.round(player.maxHp * 0.25));
    expect(player.auras.some((aura) => aura.id === 'regrowth')).toBe(false);
    expect(player.auras.some((aura) => aura.id === 'rejuvenation')).toBe(true);
    expect(player.auras.some((aura) => aura.id === VERDANCE_ID)).toBe(false);
  });

  it('does not grow Verdance when Wildbloom refreshes an existing owned HoT', () => {
    const { sim, player } = rig('restoration');
    sim.castAbility('rejuvenation');
    expect(stacks(player, VERDANCE_ID)).toBe(1);

    player.gcdRemaining = 0;
    player.resource = player.maxResource;
    sim.castAbility('rejuvenation');

    expect(stacks(player, VERDANCE_ID)).toBe(1);
  });

  it('runs Fleetmend and Overbloom on one shared slot cooldown', () => {
    const { sim, player } = rig('restoration');
    const selfHot = (): Aura => ({
      id: 'rejuvenation',
      name: 'Wildbloom',
      kind: 'hot',
      remaining: 12,
      duration: 15,
      value: 20,
      tickInterval: 3,
      tickTimer: 3,
      sourceId: player.id,
      school: 'nature',
    });

    player.hp = Math.round(player.maxHp * 0.4);
    player.auras.push(selfHot());
    sim.castAbility('swiftmend');
    expect(player.auras.some((aura) => aura.id === 'rejuvenation')).toBe(false);
    expect(player.cooldowns.has('swiftmend')).toBe(true);

    for (let cast = 0; cast < 5; cast++) {
      druidEngineOnHotPlanted(ctx(sim), player, cast % 2 ? 'regrowth' : 'rejuvenation');
    }
    player.auras.push(selfHot());
    expect(sim.resolvedAbility('swiftmend')?.def.id).toBe('overbloom');

    // The base press armed the slot clock, so the transformed press waits on it.
    player.gcdRemaining = 0;
    player.resource = player.maxResource;
    const hpBeforeRefused = player.hp;
    sim.castAbility('swiftmend');
    expect(player.hp).toBe(hpBeforeRefused);
    expect(stacks(player, VERDANCE_ID)).toBe(5);
    expect(player.auras.some((aura) => aura.id === 'rejuvenation')).toBe(true);

    // Past the clock the harvest fires and re-arms the SAME slot clock, so the
    // base button cannot immediately eat the fresh replant.
    player.cooldowns.delete('swiftmend');
    player.gcdRemaining = 0;
    player.resource = player.maxResource;
    player.hp = Math.round(player.maxHp * 0.4);
    sim.castAbility('swiftmend');
    expect(player.auras.some((aura) => aura.id === VERDANCE_ID)).toBe(false);
    expect(player.auras.some((aura) => aura.id === 'rejuvenation')).toBe(true);
    expect(player.cooldowns.has('swiftmend')).toBe(true);

    player.gcdRemaining = 0;
    player.resource = player.maxResource;
    const replantCount = player.auras.filter((aura) => aura.id === 'rejuvenation').length;
    const hpAfterHarvest = player.hp;
    sim.castAbility('swiftmend');
    expect(player.auras.filter((aura) => aura.id === 'rejuvenation')).toHaveLength(replantCount);
    expect(player.hp).toBe(hpAfterHarvest);
  });

  // Fleetmend (swiftmend) with nothing to consume is refused at the cast gate,
  // classic style: no mana, no cooldown, no GCD, only the error. The gate reads
  // the RESOLVED target, so the caster's own HoT never stands in for an ally's.
  it('refuses Fleetmend with nothing to consume before mana, cooldown and GCD', () => {
    const { sim, player } = rig('restoration');
    const allyId = sim.addPlayer('warrior', 'Unbloomed');
    const ally = sim.entities.get(allyId) as Entity;
    ally.pos = { ...player.pos, z: player.pos.z + 4 };
    ally.prevPos = { ...ally.pos };
    player.hp = Math.round(player.maxHp * 0.4);
    ally.hp = Math.round(ally.maxHp * 0.4);

    const press = (): string[] => {
      player.gcdRemaining = 0;
      player.resource = player.maxResource;
      sim.drainEvents();
      sim.castAbility('swiftmend');
      return sim.drainEvents().flatMap((event) => (event.type === 'error' ? [event.text] : []));
    };
    const expectRefusedAtNoCost = (errors: string[]) => {
      expect(errors).toEqual(['Nothing to consume.']);
      expect(player.resource).toBe(player.maxResource);
      expect(player.cooldowns.has('swiftmend')).toBe(false);
      expect(player.gcdRemaining).toBe(0);
    };

    // Self-cast, no HoT anywhere.
    const selfHp = player.hp;
    expectRefusedAtNoCost(press());
    expect(player.hp).toBe(selfHp);

    // An ally with no HoT while the caster wears Wildbloom: still refused, and
    // the caster's own HoT is left alone.
    player.auras.push({
      id: 'rejuvenation',
      name: 'Wildbloom',
      kind: 'hot',
      remaining: 12,
      duration: 15,
      value: 20,
      tickInterval: 3,
      tickTimer: 3,
      sourceId: player.id,
      school: 'nature',
    });
    sim.targetEntity(allyId);
    const allyHp = ally.hp;
    expectRefusedAtNoCost(press());
    expect(ally.hp).toBe(allyHp);
    expect(player.auras.some((aura) => aura.id === 'rejuvenation')).toBe(true);
  });

  it.each([
    ['rejuvenation', 'Wildbloom'],
    ['regrowth', 'Second Bloom'],
  ])('Fleetmend still consumes %s on an ally, heals, and pays', (hotId, hotName) => {
    const { sim, player } = rig('restoration');
    const allyId = sim.addPlayer('warrior', 'Bloomed');
    const ally = sim.entities.get(allyId) as Entity;
    ally.pos = { ...player.pos, z: player.pos.z + 4 };
    ally.prevPos = { ...ally.pos };
    ally.hp = Math.round(ally.maxHp * 0.4);
    ally.auras.push({
      id: hotId,
      name: hotName,
      kind: 'hot',
      remaining: 12,
      duration: 15,
      value: 20,
      tickInterval: 3,
      tickTimer: 3,
      sourceId: player.id,
      school: 'nature',
    });
    sim.targetEntity(allyId);
    player.gcdRemaining = 0;
    player.resource = player.maxResource;
    const cost = sim.resolvedAbility('swiftmend')?.cost ?? 0;
    const allyHp = ally.hp;
    sim.drainEvents();
    sim.castAbility('swiftmend');

    expect(sim.drainEvents().some((event) => event.type === 'error')).toBe(false);
    expect(ally.auras.some((aura) => aura.id === hotId)).toBe(false);
    expect(ally.hp).toBeGreaterThan(allyHp);
    expect(cost).toBeGreaterThan(0);
    expect(player.resource).toBe(player.maxResource - cost);
    expect(player.cooldowns.has('swiftmend')).toBe(true);
    expect(player.gcdRemaining).toBeGreaterThan(0);
  });

  it('clears the bank on a same-spec row repick', () => {
    const { sim, player } = rig('restoration');
    druidEngineOnHotPlanted(ctx(sim), player, 'rejuvenation');
    expect(stacks(player, VERDANCE_ID)).toBe(1);

    expect(
      sim.applyTalents({
        spec: 'restoration',
        rows: { 5: 'dru_r5_improved_wrath' },
      }),
    ).toBe(true);
    expect(player.auras.some((aura) => aura.id === VERDANCE_ID)).toBe(false);
  });
});

// The one pick the Fleetmend cast gate and the consumeAura effect share
// (combat/consume_aura_match.ts), driven directly. The Grovespring 2pc
// own-bloom preference and its fallback are pinned through real casts in
// ignivar_set_bonus_druid.test.ts.
describe('consumableAuraIndex', () => {
  const aura = (id: string, kind: Aura['kind'], sourceId: number): Aura => ({
    id,
    name: id,
    kind,
    remaining: 12,
    duration: 12,
    value: 10,
    tickInterval: 3,
    tickTimer: 3,
    sourceId,
    school: 'nature',
  });
  const hot: ConsumeAuraEffect = { type: 'consumeAura', auraKind: 'hot' };

  it('finds nothing on a missing or dead target', () => {
    const { sim, player } = rig('restoration');
    expect(consumableAuraIndex(ctx(sim), player, null, hot)).toBe(-1);
    player.auras.push(aura('rejuvenation', 'hot', player.id));
    expect(consumableAuraIndex(ctx(sim), player, player, hot)).toBe(player.auras.length - 1);
    const mob = targetMob(sim);
    mob.auras.push(aura('rejuvenation', 'hot', player.id));
    expect(consumableAuraIndex(ctx(sim), player, mob, hot)).toBe(mob.auras.length - 1);
    mob.dead = true;
    expect(consumableAuraIndex(ctx(sim), player, mob, hot)).toBe(-1);
  });

  it('never picks a non-DoT, non-HoT aura, even one named by id', () => {
    const { sim, player } = rig('restoration');
    const byId: ConsumeAuraEffect = { type: 'consumeAura', auraIds: ['buff_named', 'named_hot'] };
    player.auras.push(aura('buff_named', 'buff_spellpower', player.id));
    expect(consumableAuraIndex(ctx(sim), player, player, byId)).toBe(-1);
    player.auras.push(aura('named_hot', 'hot', player.id));
    expect(consumableAuraIndex(ctx(sim), player, player, byId)).toBe(player.auras.length - 1);
  });

  it("takes any matching HoT on a friend but only the caster's own DoT on a foe", () => {
    const { sim, player } = rig('restoration');
    const before = player.auras.length;
    player.auras.push(aura('rejuvenation', 'hot', 999_999));
    expect(consumableAuraIndex(ctx(sim), player, player, hot)).toBe(before);

    const dot: ConsumeAuraEffect = { type: 'consumeAura', auraKind: 'dot' };
    const mob = targetMob(sim);
    mob.auras.push(aura('moonfire', 'dot', 999_999));
    expect(consumableAuraIndex(ctx(sim), player, mob, dot)).toBe(-1);
    mob.auras.push(aura('moonfire', 'dot', player.id));
    expect(consumableAuraIndex(ctx(sim), player, mob, dot)).toBe(mob.auras.length - 1);
  });
});

describe('Loping Stride', () => {
  it('stamps a real move-speed multiplier so shapeshifting actually sprints', () => {
    // Baseline since the Wildfang kit pass 2: no row 5 talent selected.
    const { sim, player } = rig('feral');
    expect(moveSpeedMult(player)).toBe(1);

    completed(sim, 'bear_form');
    const stride = player.auras.find((aura) => aura.id === 'loping_stride');
    expect(stride?.kind).toBe('buff_speed');
    // buff_speed carries a 1+fraction multiplier (1.6 = +60%), the same
    // convention every other speed buff and form_travel use.
    expect(stride?.value).toBe(LOPING_STRIDE_SPEED);
    expect(moveSpeedMult(player)).toBeCloseTo(1.6);

    // Travel form's own 1.4 must not win over the stronger 3s sprint.
    player.auras.push({ ...formAura(player, 'form_travel'), value: 1.4 });
    expect(moveSpeedMult(player)).toBeCloseTo(1.6);
  });

  it('holds the 20s internal cooldown between shifts', () => {
    const { sim, player } = rig('feral');
    completed(sim, 'cat_form');
    player.auras = player.auras.filter((aura) => aura.id !== 'loping_stride');
    completed(sim, 'bear_form');
    expect(player.auras.some((aura) => aura.id === 'loping_stride')).toBe(false);
    expect(moveSpeedMult(player)).toBe(1);

    // The ICD decays through the authoritative tick: past 20s the next shift
    // grants the sprint again.
    for (let tick = 0; tick < 20 * 20 + 1; tick++) sim.tick();
    completed(sim, 'cat_form');
    expect(player.auras.some((aura) => aura.id === 'loping_stride')).toBe(true);
    expect(moveSpeedMult(player)).toBeCloseTo(1.6);
  });
});

describe('Fleet Form control break (baseline) and the Wildshift gate', () => {
  // A breakable root or slow the way an enemy would stamp it; unbreakable
  // control carries the unbreakableControl flag (encounter-owned CC).
  function control(
    player: Entity,
    kind: 'root' | 'slow',
    id: string,
    options: { unbreakable?: boolean } = {},
  ): Aura {
    const aura: Aura = { ...formAura(player, kind), id, name: id };
    aura.value = kind === 'slow' ? 0.5 : 0;
    aura.sourceId = -1;
    if (options.unbreakable) aura.unbreakableControl = true;
    return aura;
  }
  const wears = (player: Entity, kind: Aura['kind']) =>
    player.auras.some((aura) => aura.kind === kind);

  it('Fleet Form strips a breakable root and slow with NO talent selected', () => {
    const { sim, player } = rig('feral');
    player.auras.push(
      control(player, 'root', 'entangling_roots'),
      control(player, 'slow', 'crippling_poison'),
    );
    expect(isRooted(player)).toBe(true);
    expect(moveSpeedMult(player)).toBeCloseTo(0.5);

    completed(sim, 'travel_form');
    expect(wears(player, 'root')).toBe(false);
    expect(wears(player, 'slow')).toBe(false);
    expect(isRooted(player)).toBe(false);
    // One aura-lost event per stripped control, the same emit Wildshift makes.
    const lost = sim
      .tick()
      .filter(
        (event) =>
          event.type === 'aura' &&
          event.targetId === player.id &&
          event.gained === false &&
          (event.name === 'entangling_roots' || event.name === 'crippling_poison'),
      )
      .map((event) => (event as { name: string }).name)
      .sort();
    expect(lost).toEqual(['crippling_poison', 'entangling_roots']);
  });

  it('Fleet Form leaves unbreakable control in place', () => {
    const { sim, player } = rig('feral');
    player.auras.push(
      control(player, 'root', 'boss_grasp', { unbreakable: true }),
      control(player, 'slow', 'crippling_poison'),
    );
    completed(sim, 'travel_form');
    expect(player.auras.some((aura) => aura.id === 'boss_grasp')).toBe(true);
    expect(isRooted(player)).toBe(true);
    expect(wears(player, 'slow')).toBe(false);
  });

  it('the real cast path breaks the root: a rooted druid casts Fleet Form and is free', () => {
    const { sim, player } = rig('feral');
    player.auras.push(control(player, 'root', 'entangling_roots'));
    player.gcdRemaining = 0;
    player.resource = player.maxResource;
    sim.castAbility('travel_form');
    sim.tick();
    expect(wears(player, 'form_travel')).toBe(true);
    expect(wears(player, 'root')).toBe(false);
  });

  it('Cat Form strips nothing without Wildshift', () => {
    const { sim, player } = rig('feral');
    player.auras.push(
      control(player, 'root', 'entangling_roots'),
      control(player, 'slow', 'crippling_poison'),
    );
    completed(sim, 'cat_form');
    expect(wears(player, 'root')).toBe(true);
    expect(wears(player, 'slow')).toBe(true);
  });

  it('Cat Form strips both with Wildshift selected', () => {
    const { sim, player } = rig('feral', { 5: 'dru_r5_improved_wrath' });
    player.auras.push(
      control(player, 'root', 'entangling_roots'),
      control(player, 'slow', 'crippling_poison'),
    );
    completed(sim, 'cat_form');
    expect(wears(player, 'root')).toBe(false);
    expect(wears(player, 'slow')).toBe(false);
  });

  it('Bruin and Moonwing keep the talent gate (only Fleet Form is baseline)', () => {
    for (const form of ['bear_form', 'moonkin_form']) {
      const { sim, player } = rig('feral');
      player.auras.push(control(player, 'root', 'entangling_roots'));
      completed(sim, form);
      expect(wears(player, 'root'), form).toBe(true);
    }
  });
});
