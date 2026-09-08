// Direct unit tests for src/sim/combat/effective_stats.ts, the two per-swing
// stat reads moved whole out of the Sim coordinator (effectiveArmor and
// effectiveAttackPower). Pure over the entity, so no Sim is built: a real mob
// and a real player from entity.ts carry hand-set base stats and auras.

import { describe, expect, it } from 'vitest';
import { effectiveArmor, effectiveAttackPower } from '../src/sim/combat/effective_stats';
import { MOBS } from '../src/sim/data';
import { createMob, createPlayer } from '../src/sim/entity';
import {
  type Aura,
  type Entity,
  FAERIE_FIRE_ARMOR_PCT,
  SUNDER_ARMOR_PCT_PER_STACK,
} from '../src/sim/types';

const ORIGIN = { x: 0, y: 0, z: 0 };

function aura(kind: Aura['kind'], value: number, stacks?: number): Aura {
  const base: Aura = {
    id: `test_${kind}`,
    name: kind,
    kind,
    remaining: 30,
    duration: 30,
    value,
    sourceId: 1,
    school: 'physical',
  };
  return stacks === undefined ? base : { ...base, stacks };
}

function mob(): Entity {
  const m = createMob(970001, MOBS.forest_wolf, 10, ORIGIN);
  m.stats.armor = 500;
  m.attackPower = 80;
  return m;
}

function player(): Entity {
  const p = createPlayer(970002, 'warrior', ORIGIN, 'Aaa');
  p.stats.armor = 300;
  p.attackPower = 100;
  return p;
}

describe('effectiveArmor', () => {
  it('the two percent constants are the classic values the cases below assume', () => {
    expect(SUNDER_ARMOR_PCT_PER_STACK).toBe(0.02);
    expect(FAERIE_FIRE_ARMOR_PCT).toBe(0.1);
  });

  it('is the base armor with no auras', () => {
    expect(effectiveArmor(mob())).toBe(500);
    expect(effectiveArmor(player())).toBe(300);
  });

  it('Sunder stacks are a percent reduction, capped by the max-combine with Faerie Fire', () => {
    const m = mob();
    m.auras.push(aura('sunder', 40, 2));
    expect(effectiveArmor(m)).toBe(500 * (1 - 2 * SUNDER_ARMOR_PCT_PER_STACK));
    // Five stacks (10%) plus Faerie Fire (10%): the larger percent wins, never the sum.
    m.auras[0] = aura('sunder', 40, 5);
    m.auras.push(aura('faerie_fire', 0));
    expect(effectiveArmor(m)).toBeCloseTo(450, 9);
    expect(effectiveArmor(m)).toBe(
      500 * (1 - Math.max(5 * SUNDER_ARMOR_PCT_PER_STACK, FAERIE_FIRE_ARMOR_PCT)),
    );
  });

  it('Faerie Fire alone is the flat percent', () => {
    const m = mob();
    m.auras.push(aura('faerie_fire', 0));
    expect(effectiveArmor(m)).toBe(500 * (1 - FAERIE_FIRE_ARMOR_PCT));
  });

  it('corrode is a flat per-stack shred applied before the percent debuffs', () => {
    const m = mob();
    m.auras.push(aura('corrode', 30, 3));
    expect(effectiveArmor(m)).toBe(500 - 90);
    m.auras.push(aura('sunder', 40, 1));
    expect(effectiveArmor(m)).toBe((500 - 90) * (1 - SUNDER_ARMOR_PCT_PER_STACK));
    // The buff kinds are the only player-gated ones: a shred lands on a player too.
    const p = player();
    p.auras.push(aura('corrode', 30, 3));
    expect(effectiveArmor(p)).toBe(210);
  });

  it('Melting Acid carries its own fraction and max-combines with Sunder', () => {
    const m = mob();
    m.auras.push(aura('sunder', 40, 2), aura('melting_acid', 0.05));
    expect(effectiveArmor(m)).toBeCloseTo(475, 9);
  });

  it('armor buffs fold in for a non-player only (players bake them in recalcPlayerStats)', () => {
    const m = mob();
    m.auras.push(aura('buff_armor', 100));
    expect(effectiveArmor(m)).toBe(600);
    m.auras[0] = aura('buff_armor_pct', 10);
    expect(effectiveArmor(m)).toBe(550);
    // Combined: the percent is of the BASE armor, never of the running total.
    m.auras.push(aura('buff_armor', 100));
    expect(effectiveArmor(m)).toBe(650);
    const p = player();
    p.auras.push(aura('buff_armor', 100), aura('buff_armor_pct', 10));
    expect(effectiveArmor(p)).toBe(300);
  });

  it('never goes below zero', () => {
    const m = mob();
    m.auras.push(aura('corrode', 1000, 1));
    expect(effectiveArmor(m)).toBe(0);
  });
});

describe('effectiveAttackPower', () => {
  it('is the base attack power with no auras', () => {
    expect(effectiveAttackPower(mob())).toBe(80);
    expect(effectiveAttackPower(player())).toBe(100);
  });

  it('folds flat and percent attack-power auras for a non-player', () => {
    const m = mob();
    m.auras.push(aura('buff_ap', 20));
    expect(effectiveAttackPower(m)).toBe(100);
    m.auras.push(aura('debuff_ap', 50));
    expect(effectiveAttackPower(m)).toBe(50);
    m.auras.push(aura('buff_ap_pct', 10));
    // The percent arm is percent of the BASE (80), not of the running total.
    expect(effectiveAttackPower(m)).toBe(58);
  });

  it('ignores the auras on a player (baked in recalcPlayerStats) and floors at zero', () => {
    const p = player();
    p.auras.push(aura('buff_ap', 20), aura('buff_ap_pct', 10), aura('debuff_ap', 500));
    expect(effectiveAttackPower(p)).toBe(100);
    const m = mob();
    m.auras.push(aura('debuff_ap', 500));
    expect(effectiveAttackPower(m)).toBe(0);
  });
});
