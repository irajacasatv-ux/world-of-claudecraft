// Effective armor and attack power: the two per-swing stat reads every melee
// damage formula takes (the mob swing shell in sim.ts, and the auto-attack,
// pet, undead and effect paths through ctx.effectiveArmor /
// ctx.effectiveAttackPower). MOVED verbatim out of the Sim coordinator: both
// are pure over the entity's stats and auras, no SimContext, no rng, so a
// Vitest imports them directly. Sim keeps thin same-named delegates because
// buildSimContext binds the seam callbacks to them by identity and a dozen
// suites reach them on the Sim facade.

import { type Entity, FAERIE_FIRE_ARMOR_PCT, SUNDER_ARMOR_PCT_PER_STACK } from '../types';

// Sunder Armor stacks shave flat armor off the defender for physical hits.
export function effectiveArmor(e: Entity): number {
  let armor = e.stats.armor;
  // Player/rogue armor debuffs are PERCENTAGES that do NOT stack with each other:
  // Sunder Armor (2% per stack, up to 10% at 5 stacks) and Faerie Fire (a flat 10%)
  // max-combine, so a fully-stacked Sunder and a Faerie Fire are redundant rather
  // than additive. Mob corrosion (kind 'corrode') is a separate FLAT shred that
  // subtracts value*stacks before the percent debuffs apply.
  let reductionPct = 0;
  const baseArmor = e.stats.armor;
  for (const a of e.auras) {
    if (e.kind !== 'player' && a.kind === 'buff_armor') armor += a.value;
    // Percent armor raid buff (Devotion Aura) on a controlled pet; players fold it
    // in recalcPlayerStats.
    else if (e.kind !== 'player' && a.kind === 'buff_armor_pct')
      armor += (baseArmor * a.value) / 100;
    // Mob corrosion: flat, stacking armor shred (value per stack).
    if (a.kind === 'corrode') armor -= a.value * (a.stacks ?? 1);
    else if (a.kind === 'sunder')
      reductionPct = Math.max(reductionPct, SUNDER_ARMOR_PCT_PER_STACK * (a.stacks ?? 1));
    else if (a.kind === 'faerie_fire') reductionPct = Math.max(reductionPct, FAERIE_FIRE_ARMOR_PCT);
    // Melting Acid carries its own fraction on the aura (0.05), so a future
    // rank or talent scales the value rather than a constant here.
    else if (a.kind === 'melting_acid') reductionPct = Math.max(reductionPct, a.value);
  }
  return Math.max(0, armor * (1 - reductionPct));
}

export function effectiveAttackPower(e: Entity): number {
  let attackPower = e.attackPower;
  if (e.kind !== 'player') {
    const base = e.attackPower;
    for (const a of e.auras) {
      if (a.kind === 'buff_ap') attackPower += a.value;
      else if (a.kind === 'debuff_ap') attackPower -= a.value;
      // Percent attack-power raid buffs (Blessing of Might / Battle Shout) on a
      // controlled pet: percent of the pet's base AP. Players fold this in recalc.
      else if (a.kind === 'buff_ap_pct') attackPower += (base * a.value) / 100;
    }
  }
  return Math.max(0, attackPower);
}
