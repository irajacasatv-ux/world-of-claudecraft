// src/sim/effective_stats.ts: the armor and attack-power reads moved verbatim
// out of sim.ts. Plain entities, no Sim: the percent debuffs max-combine, the
// flat corrode shred stacks, and non-player buffs fold in while a player's do
// not (recalcPlayerStats already folded them).
//
// The second half drives the same two functions with real entities from
// entity.ts (a mob and a player with hand-set base stats and full auras), and
// pins that sim.ts only delegates. It came from the freeholds branch, which had
// extracted the same bodies to a twin module; the 2026-09-26 release sync kept
// this module as the one authority and moved those cases here.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import { effectiveArmorOf, effectiveAttackPowerOf } from '../src/sim/effective_stats';
import { createMob, createPlayer } from '../src/sim/entity';
import {
  type Aura,
  type Entity,
  FAERIE_FIRE_ARMOR_PCT,
  SUNDER_ARMOR_PCT_PER_STACK,
} from '../src/sim/types';
import { stripComments } from './helpers/strip_comments';

function entity(kind: 'player' | 'mob', armor: number, attackPower: number, auras: Aura[]): Entity {
  return { kind, stats: { armor }, attackPower, auras } as unknown as Entity;
}

const aura = (kind: string, value: number, stacks?: number): Aura =>
  ({ kind, value, ...(stacks === undefined ? {} : { stacks }) }) as unknown as Aura;

describe('effectiveArmorOf', () => {
  it('max-combines Sunder and Faerie Fire instead of adding them', () => {
    const e = entity('mob', 1000, 0, [aura('sunder', 0, 5), aura('faerie_fire', 0)]);
    const pct = Math.max(SUNDER_ARMOR_PCT_PER_STACK * 5, FAERIE_FIRE_ARMOR_PCT);
    expect(effectiveArmorOf(e)).toBe(1000 * (1 - pct));
  });

  it('subtracts corrode flat per stack before the percent debuffs, floored at zero', () => {
    const e = entity('mob', 100, 0, [aura('corrode', 30, 2), aura('sunder', 0, 5)]);
    expect(effectiveArmorOf(e)).toBe((100 - 60) * (1 - SUNDER_ARMOR_PCT_PER_STACK * 5));
    expect(effectiveArmorOf(entity('mob', 10, 0, [aura('corrode', 50, 1)]))).toBe(0);
  });

  it('folds flat and percent armor buffs for a non-player only', () => {
    const buffs = [aura('buff_armor', 50), aura('buff_armor_pct', 10)];
    expect(effectiveArmorOf(entity('mob', 200, 0, buffs))).toBe(270);
    expect(effectiveArmorOf(entity('player', 200, 0, buffs))).toBe(200);
  });
});

describe('effectiveAttackPowerOf', () => {
  it('folds flat and percent attack-power auras for a non-player only, floored at zero', () => {
    const auras = [aura('buff_ap', 10), aura('debuff_ap', 5), aura('buff_ap_pct', 50)];
    expect(effectiveAttackPowerOf(entity('mob', 0, 100, auras))).toBe(155);
    expect(effectiveAttackPowerOf(entity('player', 0, 100, auras))).toBe(100);
    expect(effectiveAttackPowerOf(entity('mob', 0, 3, [aura('debuff_ap', 9)]))).toBe(0);
  });
});

const ORIGIN = { x: 0, y: 0, z: 0 };

function liveAura(kind: Aura['kind'], value: number, stacks?: number): Aura {
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

describe('effectiveArmorOf on real entities', () => {
  it('the two percent constants are the classic values the cases below assume', () => {
    expect(SUNDER_ARMOR_PCT_PER_STACK).toBe(0.02);
    expect(FAERIE_FIRE_ARMOR_PCT).toBe(0.1);
  });

  it('is the base armor with no auras', () => {
    expect(effectiveArmorOf(mob())).toBe(500);
    expect(effectiveArmorOf(player())).toBe(300);
  });

  it('Sunder stacks are a percent reduction, capped by the max-combine with Faerie Fire', () => {
    const m = mob();
    m.auras.push(liveAura('sunder', 40, 2));
    expect(effectiveArmorOf(m)).toBe(500 * (1 - 2 * SUNDER_ARMOR_PCT_PER_STACK));
    // Five stacks (10%) plus Faerie Fire (10%): the larger percent wins, never the sum.
    m.auras[0] = liveAura('sunder', 40, 5);
    m.auras.push(liveAura('faerie_fire', 0));
    expect(effectiveArmorOf(m)).toBeCloseTo(450, 9);
    expect(effectiveArmorOf(m)).toBe(
      500 * (1 - Math.max(5 * SUNDER_ARMOR_PCT_PER_STACK, FAERIE_FIRE_ARMOR_PCT)),
    );
  });

  it('Faerie Fire alone is the flat percent', () => {
    const m = mob();
    m.auras.push(liveAura('faerie_fire', 0));
    expect(effectiveArmorOf(m)).toBe(500 * (1 - FAERIE_FIRE_ARMOR_PCT));
  });

  it('corrode is a flat per-stack shred applied before the percent debuffs', () => {
    const m = mob();
    m.auras.push(liveAura('corrode', 30, 3));
    expect(effectiveArmorOf(m)).toBe(500 - 90);
    m.auras.push(liveAura('sunder', 40, 1));
    expect(effectiveArmorOf(m)).toBe((500 - 90) * (1 - SUNDER_ARMOR_PCT_PER_STACK));
    // The buff kinds are the only player-gated ones: a shred lands on a player too.
    const p = player();
    p.auras.push(liveAura('corrode', 30, 3));
    expect(effectiveArmorOf(p)).toBe(210);
  });

  it('Melting Acid carries its own fraction and max-combines with Sunder', () => {
    const m = mob();
    m.auras.push(liveAura('sunder', 40, 2), liveAura('melting_acid', 0.05));
    expect(effectiveArmorOf(m)).toBeCloseTo(475, 9);
  });

  it('armor buffs fold in for a non-player only (players bake them in recalcPlayerStats)', () => {
    const m = mob();
    m.auras.push(liveAura('buff_armor', 100));
    expect(effectiveArmorOf(m)).toBe(600);
    m.auras[0] = liveAura('buff_armor_pct', 10);
    expect(effectiveArmorOf(m)).toBe(550);
    // Combined: the percent is of the BASE armor, never of the running total.
    m.auras.push(liveAura('buff_armor', 100));
    expect(effectiveArmorOf(m)).toBe(650);
    const p = player();
    p.auras.push(liveAura('buff_armor', 100), liveAura('buff_armor_pct', 10));
    expect(effectiveArmorOf(p)).toBe(300);
  });

  it('never goes below zero', () => {
    const m = mob();
    m.auras.push(liveAura('corrode', 1000, 1));
    expect(effectiveArmorOf(m)).toBe(0);
  });
});

describe('effectiveAttackPowerOf on real entities', () => {
  it('is the base attack power with no auras', () => {
    expect(effectiveAttackPowerOf(mob())).toBe(80);
    expect(effectiveAttackPowerOf(player())).toBe(100);
  });

  it('folds flat and percent attack-power auras for a non-player', () => {
    const m = mob();
    m.auras.push(liveAura('buff_ap', 20));
    expect(effectiveAttackPowerOf(m)).toBe(100);
    m.auras.push(liveAura('debuff_ap', 50));
    expect(effectiveAttackPowerOf(m)).toBe(50);
    m.auras.push(liveAura('buff_ap_pct', 10));
    // The percent arm is percent of the BASE (80), not of the running total.
    expect(effectiveAttackPowerOf(m)).toBe(58);
  });

  it('ignores the auras on a player (baked in recalcPlayerStats) and floors at zero', () => {
    const p = player();
    p.auras.push(liveAura('buff_ap', 20), liveAura('buff_ap_pct', 10), liveAura('debuff_ap', 500));
    expect(effectiveAttackPowerOf(p)).toBe(100);
    const m = mob();
    m.auras.push(liveAura('debuff_ap', 500));
    expect(effectiveAttackPowerOf(m)).toBe(0);
  });
});

describe('src/sim/sim.ts delegates to the module instead of re-implementing it', () => {
  const sim = stripComments(readFileSync(resolve(process.cwd(), 'src/sim/sim.ts'), 'utf8'));

  it('imports both bodies from the one module', () => {
    expect(sim).toContain(
      "import { effectiveArmorOf, effectiveAttackPowerOf } from './effective_stats';",
    );
    // The branch's twin (src/sim/combat/effective_stats.ts) was collapsed onto
    // this module at the 2026-09-26 release sync; nothing may import it again.
    expect(sim).not.toContain('combat/effective_stats');
  });

  it('keeps thin one-line delegates and none of the moved arithmetic', () => {
    // The seam binds sim.effectiveArmor / sim.effectiveAttackPower by
    // identity, so Sim keeps a same-named private method; each must forward
    // and nothing more (a divergent re-implementation inside sim.ts would be
    // caught only indirectly by the zero-slack line ratchet otherwise).
    expect(sim).toContain(
      'private effectiveArmor(e: Entity): number {\n    return effectiveArmorOf(e);\n  }',
    );
    expect(sim).toContain(
      'private effectiveAttackPower(e: Entity): number {\n    return effectiveAttackPowerOf(e);\n  }',
    );
    // The moved bodies' own arithmetic (the sunder/faerie-fire max-combine
    // and the percent-of-base attack-power arm) no longer appears in sim.ts.
    expect(sim).not.toContain("a.kind === 'faerie_fire'");
    expect(sim).not.toContain("a.kind === 'buff_ap_pct'");
  });
});
