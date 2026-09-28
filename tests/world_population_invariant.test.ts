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
import { ESCORTS, MOBS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { assertPopulationSane } from './helpers/world_population';

describe('open-world population never exceeds what the content authored', () => {
  it('holds at world generation', () => {
    const sim = new Sim({ seed: 20061, playerClass: 'warrior', noPlayer: true });
    assertPopulationSane(sim, 'at boot');
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
