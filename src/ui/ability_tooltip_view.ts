// The ability tooltip card (spellbook, action bar, talents, stance bar, death
// recap): name, rank, the resolved cost / range / cast / cooldown lines, the
// localized description, the resolved buff effect lines and the requirement
// lines. Extracted from Hud (it read nothing but the player and the talent
// spec off the world), so a test drives the real composition without
// importing the Hud coordinator. The one-line aura effect summary moved with
// it: the ability card appends it per buff effect, and Hud still hands it to
// the aura tooltip view.
//
// Pure and DOM-free (registered in tests/architecture.test.ts UI_PURE_CORES):
// every read goes through the narrow world slice the caller passes, per call.

import { ABILITIES } from '../sim/data';
import type { ResolvedAbility } from '../sim/sim';
import type { Entity } from '../sim/types';
import type { IWorld } from '../world_api';
import { abilityScalingOf } from './ability_damage';
import {
  abilityDisplayDescription,
  abilityEffectAuraInput,
  abilityEffectText,
  formatAbilityNumber,
} from './ability_description';
import { abilityDisplayName } from './ability_display_name';
import {
  abilityCastLine,
  abilityRangeLine,
  abilityRequirementLines,
  playerSpellHasteFrac,
  resourceDisplayName,
} from './ability_tooltip_lines';
import {
  type AuraEffectInput,
  auraEffectDescriptor,
  auraEffectMaximumFractionDigits,
} from './aura_effect';
import { esc } from './esc';
import { formatNumber, type TranslationKey, t } from './i18n';

/** What the ability card reads off the live world: the player (scaling,
 *  resource, haste) and the talent allocation (the spec-gated lines). */
export type AbilityTooltipWorld = Pick<IWorld, 'player' | 'talents'>;

// One-line aura effect summary HTML for the buff/debuff tooltip: the pure descriptor
// (aura_effect.ts) resolved to localized, esc'd text. The descriptor is exhaustive
// for current AuraKinds and safely omits an unknown mixed-release kind. Hud injects
// it into the aura tooltip view (aura_tooltip.ts) so that view never calls t().
export function auraEffectTooltipHtml(
  a: AuraEffectInput & { id?: string },
  player: Entity,
): string {
  const effect = auraEffectDescriptor(a, player);
  if (!effect) return '';
  const values: Record<string, string> = {};
  if (effect.nums) {
    for (const [k, n] of Object.entries(effect.nums)) {
      values[k] = formatNumber(n, {
        maximumFractionDigits: auraEffectMaximumFractionDigits(n),
      });
    }
  }
  // Resolve the {school} placeholder in the dot/absorb/thorns summaries. Prefer
  // the SOURCE ability's school: it is authoritative and always present
  // client-side, unlike the aura's own school, which the ability-tooltip call
  // site omits (only kind+value) and the online wire mirror drops. Without this
  // a magic reflect like Lightning Shield read a raw "{school}" (ability tooltip)
  // or the wrong "Physical" (online buff frame) instead of its real school.
  const school = (a.id ? ABILITIES[a.id]?.school : undefined) ?? effect.school;
  if (school) {
    values.school = t(`hudChrome.auraEffect.school.${school}` as TranslationKey);
  }
  return `<div class="tt-effect">${esc(t(effect.key as TranslationKey, values))}</div>`;
}

export function abilityTooltipHtml(res: ResolvedAbility, world: AbilityTooltipWorld): string {
  const a = res.def;
  const scaling = abilityScalingOf(world.player);
  const damageText = abilityEffectText(res, scaling);
  let html = `<div class="tt-title">${esc(abilityDisplayName(a))}</div>`;
  html += `<div class="tt-sub">${esc(t('abilityUi.tooltip.rank', { rank: formatAbilityNumber(res.rank) }))}</div>`;
  const costLine: string[] = [];
  if (res.cost > 0) {
    costLine.push(
      t('abilityUi.tooltip.cost', {
        cost: formatAbilityNumber(res.cost),
        resource: resourceDisplayName(world.player.resourceType),
      }),
    );
  }
  if (a.devotionCost) {
    costLine.push(
      t('abilityUi.tooltip.cost', {
        cost: formatAbilityNumber(a.devotionCost),
        resource: t('abilityUi.resources.devotion'),
      }),
    );
  }
  if ((a.ruinCost ?? 0) > 0) {
    costLine.push(
      t('abilityUi.tooltip.ruinCost', {
        cost: formatAbilityNumber(a.ruinCost ?? 0),
      }),
    );
  }
  const rangeLine = abilityRangeLine(a);
  if (rangeLine) costLine.push(rangeLine);
  if (costLine.length) html += `<div class="tt-stat">${costLine.map(esc).join(' &nbsp; ')}</div>`;
  const castLine = [abilityCastLine(res, playerSpellHasteFrac(world.player))];
  // Use the RESOLVED cooldown (res.cooldown), not res.def.cooldown, so talents that
  // reduce cooldown (Improved Mortal Strike, Barrage, Improved Fire Blast, ...) show
  // their effect in the tooltip.
  if (res.cooldown > 0)
    castLine.push(
      t('abilityUi.tooltip.cooldownSeconds', {
        seconds: formatAbilityNumber(res.cooldown),
      }),
    );
  html += `<div class="tt-stat">${castLine.map(esc).join(' &nbsp; ')}</div>`;
  html += `<div class="tt-desc">${esc(abilityDisplayDescription(res, damageText, scaling, undefined, world.talents.spec))}</div>`;
  // Resolved buff/aura effect line(s). Reads the RESOLVED effect value, so a buff's
  // tooltip reflects rank AND talents that strengthen it (Improved Devotion Aura /
  // Aspect of the Hawk / Fortitude via buffPct) - which the static description can't.
  for (const eff of res.effects) {
    if (res.def.tooltipOmitEffectLines) break;
    const resolvedAuraEffect = abilityEffectAuraInput(eff);
    if (resolvedAuraEffect) {
      html += auraEffectTooltipHtml(resolvedAuraEffect, world.player);
    } else if (eff.type === 'selfBuff' || eff.type === 'buffTarget') {
      // Pass the ability id so the effect line can resolve its damage school
      // (the {school} placeholder in the thorns/dot/absorb summaries).
      html += auraEffectTooltipHtml(
        {
          kind: eff.kind,
          value: eff.value,
          id: a.id,
        },
        world.player,
      );
    } else if (eff.type === 'partyMeleeBuff') {
      // Sanguine Aura: surface the same composite line the buff icon shows.
      html += auraEffectTooltipHtml(
        {
          kind: 'sanguine',
          value: eff.attackSpeedMult,
          value2: eff.dmgPct,
        },
        world.player,
      );
    }
  }
  // Pass the RESOLVED ability, not just its def: a talent that retires a
  // requirement (Cheap Trick on Gut Punch) must retire its line with it, the
  // same way the resolved cost / cast / cooldown above beat the def's.
  const requirements = abilityRequirementLines(a, world.talents.spec, res);
  if (requirements.length) {
    html += requirements.map((line) => `<div class="tt-sub">${esc(line)}</div>`).join('');
  }
  return html;
}
