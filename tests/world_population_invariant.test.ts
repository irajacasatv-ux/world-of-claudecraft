// The world population invariant, as a CLASS detector rather than a list of
// known offenders.
//
// Rule: the open world may never hold more live mobs of a template than its
// authored CAMPS place, except for the wave of a run that is currently active.
// Anything that spawns mobs and forgets to reclaim them violates this, whatever
// the mechanism, so this catches the next leak as well as the one it was written
// for (escort ambush waves, which each run left behind permanently).
//
// Deliberately driven through the real Sim and the real content tables: the
// point is to exercise every shipped escort, not a fixture.
//
// The escort sweep itself runs in the _a to _d siblings, split for wall time only;
// the shared half lives in tests/helpers/world_population.ts, and
// tests/world_population_shards.test.ts pins the partition.
import { describe, expect, it } from 'vitest';
import { CAMPS, DUNGEON_X_THRESHOLD, ESCORTS, MOBS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { EscortRunState } from '../src/sim/types';
import { assertPopulationSane } from './helpers/world_population';

describe('open-world population never exceeds what the content authored', () => {
  it('holds at world generation', () => {
    const sim = new Sim({ seed: 20061, playerClass: 'warrior', noPlayer: true });
    assertPopulationSane(sim, 'at boot');
  });

  it('flags one open-world mob over each budget term, and none within it', () => {
    // The negative controls every escort round depends on: one live copy past each
    // term of the budget (the camps, an idle escortee, a wave with no run active, and an
    // active run's wave) must fail the check, and an active run's exact wave must not,
    // or the sweep's passes prove nothing. The Fisher Bram escort's wave template
    // (breach_wretch) belongs to no other escort, so its terms are isolated.
    const sim = new Sim({ seed: 20061, playerClass: 'warrior', noPlayer: true });
    const campMobIds = new Set(CAMPS.map((camp) => camp.mobId));
    const openWorldMob = (match: (templateId: string) => boolean) =>
      [...sim.entities.values()].find(
        (e) =>
          e.kind === 'mob' && !e.dead && e.spawnPos.x <= DUNGEON_X_THRESHOLD && match(e.templateId),
      );
    const base = openWorldMob((templateId) => campMobIds.has(templateId));
    if (!base) throw new Error('the boot world holds no live open-world camp mob');
    const extras: number[] = [];
    const addCopies = (templateId: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const id = Math.max(...sim.entities.keys()) + 1;
        sim.entities.set(id, { ...base, id, templateId });
        extras.push(id);
      }
    };
    const clearCopies = () => {
      for (const id of extras.splice(0)) sim.entities.delete(id);
    };
    // The rows the check reported over budget, or none.
    const overBudget = (label: string): unknown => {
      try {
        assertPopulationSane(sim, label);
      } catch (err) {
        expect((err as Error).message.startsWith(`${label}: `), label).toBe(true);
        return (err as { actual?: unknown }).actual;
      }
      return [];
    };
    const oneRowOver = (templateId: string) => [
      expect.stringMatching(new RegExp(`^${templateId}: \\d+ live vs \\d+ allowed$`)),
    ];
    const bram = ESCORTS.esc_fs_bram;
    const wave = bram.ambushes[0];
    expect(wave.mobId).toBe('breach_wretch');
    expect(overBudget('boot')).toEqual([]);

    addCopies(base.templateId, 1);
    expect(overBudget('a camp')).toEqual(oneRowOver(base.templateId));
    clearCopies();

    addCopies(bram.npcMobId, 1);
    expect(overBudget('an idle escortee')).toEqual(oneRowOver(bram.npcMobId));
    clearCopies();

    addCopies(wave.mobId, 1);
    expect(overBudget('a wave with no run active')).toEqual(oneRowOver(wave.mobId));
    clearCopies();

    const idle = sim.escortRuns.get(bram.id);
    sim.escortRuns.set(bram.id, { ...idle, run: {} } as EscortRunState);
    addCopies(wave.mobId, wave.count);
    expect(overBudget('an active run, its exact wave')).toEqual([]);
    addCopies(wave.mobId, 1);
    expect(overBudget('an active run, one past its wave')).toEqual(oneRowOver(wave.mobId));
  });

  it('names the escort ambush templates it is protecting, so the sweep is visible', () => {
    // Every shipped escort wave template, spelled out. If a new escort ships,
    // this list moves and the author sees that the guard above now covers it.
    const waveTemplates = [
      ...new Set(Object.values(ESCORTS).flatMap((d) => d.ambushes.map((a) => a.mobId))),
    ].sort();
    expect(waveTemplates).toEqual([
      'bogtoad',
      'breach_wretch',
      'canopy_weaver',
      'fen_sprite',
      'rime_elemental',
      'snowdrift_wolf',
      'terrace_howler',
      'tide_scuttler',
      'vale_bandit',
      'void_stalker',
      'widowsilk_spinner',
      'willow_sprite',
      'wood_wraith',
    ]);
    // ...and each is a real template placed by real camps, so the budget above
    // is a meaningful number rather than zero.
    for (const id of waveTemplates) expect(MOBS[id], id).toBeTruthy();
  });
});
