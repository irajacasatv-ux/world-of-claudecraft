import { afterEach, describe, expect, it } from 'vitest';
import { abilitiesKnownAt } from '../src/sim/content/classes';
import { computeTalentModifiers, emptyAllocation } from '../src/sim/content/talents';
import { type ResolvedAbility, Sim } from '../src/sim/sim';
import { abilityTooltipHtml } from '../src/ui/ability_tooltip_view';
import { ensureLocaleLoaded, setLanguage } from '../src/ui/i18n';
import { EMPTY_TEST_WORLD } from './sim_shared';

// The card is composed by abilityTooltipHtml (src/ui/ability_tooltip_view.ts),
// extracted from Hud.abilityTooltip; the world it reads is a real Sim, so the
// resolved talents and scaling are the shipped ones.
function affliction20(): Sim {
  const sim = new Sim({
    seed: 42,
    playerClass: 'warlock',
    autoEquip: false,
    world: EMPTY_TEST_WORLD,
  });
  sim.setPlayerLevel(20);
  expect(sim.setSpec('affliction')).toBe(true);
  return sim;
}

function afflictionAbility(id: string): ResolvedAbility {
  const mods = computeTalentModifiers('warlock', {
    ...emptyAllocation(),
    spec: 'affliction',
  } as never);
  const ability = abilitiesKnownAt('warlock', 20, mods).find((known) => known.def.id === id);
  if (!ability) throw new Error(`missing Affliction ability ${id}`);
  return ability;
}

afterEach(() => setLanguage('en'));

describe('Litany of Guilt ability tooltip', () => {
  it('renders its resolved damage in the localized HUD effect line', async () => {
    await ensureLocaleLoaded('es');
    setLanguage('es');
    const html = abilityTooltipHtml(afflictionAbility('litany_of_guilt'), affliction20());

    expect(html).toContain(
      '<div class="tt-effect">Obtener Condena inflige 16 de daño de las Sombras a hasta 4 enemigos en 8 m, una vez por segundo</div>',
    );
  });

  it('does not add the Litany effect line to unrelated Affliction abilities', () => {
    const html = abilityTooltipHtml(afflictionAbility('evil_eye'), affliction20());

    expect(html).not.toContain('hudChrome.auraEffect.afflictionLitany');
    expect(html).not.toContain('Condemnation gains deal');
  });
});
