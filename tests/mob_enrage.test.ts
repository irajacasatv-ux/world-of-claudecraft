// Enrage frenzy: an enraged mob with a template hasteMult swings faster, not
// just harder. The damage half (dmgMult) was already applied inline in
// mobSwing; this covers the swing-speed half folded into swingIntervalMult.
import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

type TestSim = Sim & {
  swingIntervalMult(e: Entity): number;
};

function makeSim(seed = 42) {
  return new Sim({ seed, playerClass: 'warrior', autoEquip: true, world: EMPTY_TEST_WORLD });
}

// A plain live mob beside the player; each case re-points its template.
function anyMob(sim: Sim): Entity {
  const mob = createMob(990900, MOBS.forest_wolf, 5, { ...sim.player.pos });
  (sim as unknown as { addEntity(e: Entity): void }).addEntity(mob);
  return mob;
}

function swingMult(sim: Sim, e: Entity): number {
  return (sim as unknown as TestSim).swingIntervalMult(e);
}

function moggerHasteMult(): number {
  const haste = MOBS.mogger.enrage?.hasteMult;
  if (haste === undefined) throw new Error('Mogger should define enrage haste');
  return haste;
}

describe('enrage frenzy (swing-speed haste)', () => {
  it('an enraged mob with hasteMult swings faster than normal', () => {
    const sim = makeSim();
    const mob = anyMob(sim);
    mob.templateId = 'mogger'; // enrage: { ..., hasteMult: 1.3 }
    const haste = moggerHasteMult();
    expect(haste).toBeGreaterThan(1);

    mob.enraged = false;
    expect(swingMult(sim, mob)).toBeCloseTo(1, 6);

    mob.enraged = true;
    expect(swingMult(sim, mob)).toBeCloseTo(1 / haste, 6);
    expect(swingMult(sim, mob)).toBeLessThan(1); // faster swings
  });

  it('does nothing when the mob is not enraged', () => {
    const sim = makeSim();
    const mob = anyMob(sim);
    mob.templateId = 'mogger';
    mob.enraged = false;
    expect(swingMult(sim, mob)).toBeCloseTo(1, 6);
  });

  it('is a no-op for an enraged mob whose template has no hasteMult', () => {
    const sim = makeSim();
    const mob = anyMob(sim);
    // forest_wolf has no enrage block at all -> no haste even if flagged
    mob.templateId = 'forest_wolf';
    expect(MOBS.forest_wolf.enrage).toBeUndefined();
    mob.enraged = true;
    expect(swingMult(sim, mob)).toBeCloseTo(1, 6);
  });

  it('composes multiplicatively with a slow aura', () => {
    const sim = makeSim();
    const mob = anyMob(sim);
    mob.templateId = 'mogger';
    const haste = moggerHasteMult();
    mob.enraged = true;
    // attackspeed aura: value > 1 slows (multiplies the interval)
    const slowAura: Entity['auras'][number] = {
      id: 'test_attackspeed',
      kind: 'attackspeed',
      value: 2,
      name: 'Thunder Clap',
      remaining: 10,
      duration: 10,
      stacks: 1,
      sourceId: mob.id,
      school: 'physical',
    };
    mob.auras.push(slowAura);
    expect(swingMult(sim, mob)).toBeCloseTo(2 / haste, 6);
  });

  it('every enrage template defines a frenzy hasteMult', () => {
    // The one deliberate exception: the Ignivar herald's encounter script owns
    // his frenzy. Last Inferno flips `enraged` itself at 20% (so dmgMult
    // applies) and carries the swing-speed half as its encounter-owned 1.2x
    // haste aura (tests/ignivar_encounter_tanking_lifecycle.test.ts pins the
    // Last Inferno enrage). A template hasteMult would stack on that aura and
    // double-dip, so its absence is pinned here rather than left as a gap.
    const ENCOUNTER_OWNED_FRENZY = new Set(['ignivar_herald_of_the_last_flame']);
    for (const id of ENCOUNTER_OWNED_FRENZY) {
      expect(MOBS[id]?.enrage?.dmgMult, `${id} keeps the damage half`).toBeGreaterThan(1);
      expect(MOBS[id]?.enrage?.hasteMult, `${id} must not double-dip`).toBeUndefined();
    }
    const enraged = Object.values(MOBS).filter(
      (m) => m.enrage && !ENCOUNTER_OWNED_FRENZY.has(m.id),
    );
    expect(enraged.length).toBeGreaterThan(0);
    for (const m of enraged) {
      expect(m.enrage?.hasteMult, `${m.id} should frenzy`).toBeGreaterThan(1);
    }
  });
});
