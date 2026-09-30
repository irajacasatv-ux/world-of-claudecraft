import { describe, expect, it } from 'vitest';
import { addGloomtithe } from '../src/sim/combat/priest/vespers';
import { ABILITIES, abilitiesKnownAt } from '../src/sim/content/classes';
import {
  computeTalentModifiers,
  emptyAllocation,
  type TalentAllocation,
} from '../src/sim/content/talents';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import type { Entity, SimEvent } from '../src/sim/types';
import { syncHotbarActions } from '../src/ui/hud/action_bar/hotbar';
import { en } from '../src/ui/i18n.catalog';
import { EMPTY_TEST_WORLD } from './sim_shared';

type ErrorEvent = Extract<SimEvent, { type: 'error' }>;

const alloc = (spec: string | null): TalentAllocation => ({ ...emptyAllocation(), spec });

function knownIds(spec: string | null, level = 20): Set<string> {
  const mods = computeTalentModifiers('priest', alloc(spec), level);
  return new Set(abilitiesKnownAt('priest', level, mods).map(({ def }) => def.id));
}

const SHARED_BACKBONE = [
  'smite',
  'lesser_heal',
  'power_word_fortitude',
  'shadow_word_pain',
  'power_word_shield',
  'renew',
  'mind_blast',
  'heal',
  'mind_flay',
  'flash_heal',
  'veilstep',
  'psychic_scream',
] as const;

const SPEC_KITS = {
  discipline: ['scouring_mercy'],
  holy: ['prayer_of_healing', 'holy_nova', 'seraphic_vigil'],
  shadow: ['shadowform', 'summon_tithefiend'],
} as const;

const ALL_EXCLUSIVES = Object.values(SPEC_KITS).flat();

describe('Priest v0.28 spec kits', () => {
  it('shows Scouring Hymn for the stable smite ability id in English UI', () => {
    expect(ABILITIES.smite.name).toBe('Scouring Hymn');
    expect(en.entities.abilities.smite.name).toBe(ABILITIES.smite.name);
  });

  it('pins the new signature ability for each spec', () => {
    const expected = {
      discipline: 'scouring_mercy',
      holy: 'seraphic_vigil',
      shadow: 'summon_tithefiend',
    } as const;

    for (const [spec, signature] of Object.entries(expected)) {
      const mods = computeTalentModifiers('priest', alloc(spec), 20);
      expect(mods.grants.map(({ ability }) => ability)).toContain(signature);
      expect(ABILITIES[signature]).toBeDefined();
    }
  });

  it('keeps the shared backbone available to every spec', () => {
    for (const spec of Object.keys(SPEC_KITS)) {
      const known = knownIds(spec);
      for (const ability of SHARED_BACKBONE) expect(known.has(ability)).toBe(true);
    }
  });

  it('grants only the committed spec exclusive kit', () => {
    for (const [spec, expected] of Object.entries(SPEC_KITS)) {
      const known = knownIds(spec);
      for (const ability of ALL_EXCLUSIVES) {
        expect(known.has(ability), `${spec} ownership of ${ability}`).toBe(
          expected.includes(ability as never),
        );
      }
    }
  });

  it('grants no spec exclusive ability before a spec is committed', () => {
    const known = knownIds(null);
    for (const ability of ALL_EXCLUSIVES) expect(known.has(ability)).toBe(false);
  });

  it('moves Anointing out of the Doctrine signature slot', () => {
    expect(knownIds('discipline').has('power_infusion')).toBe(false);
  });

  it('removes wrong-spec actions from saved hotbar slots on resync', () => {
    const shadowKnown = [...knownIds('shadow')];
    const slots = [
      { type: 'ability' as const, id: 'seraphic_vigil' },
      { type: 'ability' as const, id: 'summon_tithefiend' },
      { type: 'ability' as const, id: 'smite' },
    ];
    expect(syncHotbarActions(slots, shadowKnown, new Set()).actions).toEqual([
      null,
      { type: 'ability', id: 'summon_tithefiend' },
      { type: 'ability', id: 'smite' },
    ]);
  });

  it('rejects a forged wrong-spec signature through the authoritative cast path', () => {
    const sim = new Sim({
      seed: 2930,
      playerClass: 'priest',
      autoEquip: true,
      world: EMPTY_TEST_WORLD,
    });
    sim.setPlayerLevel(20);
    expect(sim.setSpec('discipline')).toBe(true);
    const priest = sim.player;
    // Everything the summon asks of a Shadow priest is in place, a Gloomtithe
    // bank and an enemy under this priest's own Dirge of Decay in range, so the
    // only gate left to refuse the Doctrine priest is the spec kit itself.
    const target = createMob(9930, MOBS.training_dummy, 20, {
      x: priest.pos.x,
      y: priest.pos.y,
      z: priest.pos.z + 8,
    });
    target.hostile = true;
    target.auras.push({
      id: 'shadow_word_pain',
      name: 'Dirge of Decay',
      kind: 'dot',
      remaining: 60,
      duration: 60,
      value: 1,
      sourceId: priest.id,
      school: 'shadow',
    });
    (sim as unknown as { addEntity(entity: Entity): void }).addEntity(target);
    const ctx = (sim as unknown as { ctx: SimContext }).ctx;
    addGloomtithe(ctx, priest, 5);
    const resourceBefore = priest.resource;
    const tithefiendSummoned = () =>
      [...sim.entities.values()].some(
        (entity) => entity.ownerId === priest.id && entity.guardianState?.key === 'tithefiend',
      );

    sim.castAbility('summon_tithefiend');
    // Read off the event buffer with no tick: the refusal is emitted at the
    // command, and this Sim's first tick would cost the case about a second.
    const errors = sim.events
      .filter((event): event is ErrorEvent => event.type === 'error' && event.pid === priest.id)
      .map((event) => event.text);

    expect(errors).toEqual(['You do not know that ability.']);
    expect(priest.resource).toBe(resourceBefore);
    expect(priest.cooldowns.has('summon_tithefiend')).toBe(false);
    expect(tithefiendSummoned()).toBe(false);

    // The same setup does summon once the priest commits to Shadow, so the
    // refusal above came from the spec and nothing else.
    expect(sim.setSpec('shadow')).toBe(true);
    addGloomtithe(ctx, priest, 5);
    priest.gcdRemaining = 0;
    priest.resource = priest.maxResource;
    sim.castAbility('summon_tithefiend');
    expect(tithefiendSummoned()).toBe(true);
  });
});
