// The ability card (src/ui/ability_tooltip_view.ts) over a ClientWorld-mirror
// shaped world: the player as plain data, the way the wire delivers it, and a
// talents view with no spec yet (a client before its talent snapshot lands).
// tests/litany_tooltip.test.ts drives the card with a real Sim; this case proves
// the card reads nothing a plain mirror lacks, for every ability the class
// knows at the level.

import { describe, expect, it } from 'vitest';
import { abilitiesKnownAt } from '../src/sim/content/classes';
import { computeTalentModifiers, emptyAllocation } from '../src/sim/content/talents';
import { Sim } from '../src/sim/sim';
import { type AbilityTooltipWorld, abilityTooltipHtml } from '../src/ui/ability_tooltip_view';
import { EMPTY_TEST_WORLD } from './sim_shared';

describe('ability tooltip over a ClientWorld-shaped world', () => {
  it('renders every known ability from plain player data and a null spec, as the Sim does', () => {
    const sim = new Sim({
      seed: 42,
      playerClass: 'warlock',
      autoEquip: false,
      world: EMPTY_TEST_WORLD,
    });
    sim.setPlayerLevel(20);
    expect(sim.talents.spec).toBeNull();
    const mirror = {
      player: JSON.parse(JSON.stringify(sim.player)),
      talents: { spec: null },
    } as unknown as AbilityTooltipWorld;
    const known = abilitiesKnownAt(
      'warlock',
      20,
      computeTalentModifiers('warlock', emptyAllocation() as never),
    );
    expect(known.length).toBeGreaterThan(3);
    for (const ability of known) {
      const html = abilityTooltipHtml(ability, mirror);
      expect(html, ability.def.id).toContain('class="tt-title"');
      expect(html, ability.def.id).toBe(abilityTooltipHtml(ability, sim));
    }
  });
});
