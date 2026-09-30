// The consumeAura pick (Swiftmend, shipped as Fleetmend, is the only consumer
// today): which aura on the target a consumeAura effect would eat. ONE rule
// read by both sides of the cast so they can never disagree:
//   - the cast gate (casting_lifecycle.ts castAbility) refuses a press whose
//     target carries nothing to consume, BEFORE mana, cooldown and GCD are paid
//     (classic Swiftmend refuses the cast at no cost);
//   - the effect (effect_dispatch.ts runEffects) splices the aura this names.
//
// Read-only: draws no rng, mutates nothing, emits nothing, so calling it from
// the gate leaves the draw order of every cast that proceeds unchanged.
// `src/sim`-pure (tests/architecture.test.ts).

import type { SimContext } from '../sim_context';
import type { AbilityEffect, Entity } from '../types';
import { wearsSetBonus } from './set_bonus_wearer';

export type ConsumeAuraEffect = Extract<AbilityEffect, { type: 'consumeAura' }>;

/**
 * Index into `target.auras` of the aura `eff` would consume, or -1 when there is
 * nothing to consume (no target, a dead target, or no matching aura).
 */
export function consumableAuraIndex(
  ctx: SimContext,
  caster: Entity,
  target: Entity | null,
  eff: ConsumeAuraEffect,
): number {
  if (!target || target.dead) return -1;
  // Grovespring 2pc: Swiftmend (the only hot-kind consumer) prefers the
  // caster's OWN Wildbloom or Second Bloom, so a wearer stops eating another
  // healer's HoT while their own is up. With none of their own present the
  // base pick below still applies (the set doc's explicit fallback: a paid
  // cast must never turn into a silent no-heal). Selection only; draws no
  // rng and never changes which auras are eligible for anyone else.
  if (eff.auraKind === 'hot' && wearsSetBonus(ctx, caster, 'grovespring', 2)) {
    const own = target.auras.findIndex(
      (a) =>
        a.kind === 'hot' &&
        a.sourceId === caster.id &&
        (a.id === 'rejuvenation' || a.id === 'regrowth'),
    );
    if (own >= 0) return own;
  }
  return target.auras.findIndex((a) => {
    // Only dot/hot auras are consumable, even by id: a raw splice skips the
    // stat-aura teardown expiry performs, so consuming a stat-carrying aura
    // (buff_*/form_*) would leak its contribution permanently.
    if (a.kind !== 'dot' && a.kind !== 'hot') return false;
    const matchesId = eff.auraIds?.includes(a.id);
    const matchesKind = eff.auraKind !== undefined && a.kind === eff.auraKind;
    if (!matchesId && !matchesKind) return false;
    if (target !== caster && ctx.isHostileTo(caster, target) && a.kind === 'dot') {
      return a.sourceId === caster.id;
    }
    return true;
  });
}
