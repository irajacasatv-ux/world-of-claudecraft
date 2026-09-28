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
// The escort sweep is dealt across this file and its _b to _d siblings for wall
// time only; the shared half lives in tests/helpers/world_population.ts.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ESCORTS, MOBS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { stripComments } from './helpers/strip_comments';
import {
  assertPopulationSane,
  ESCORT_SHARD_COUNT,
  escortShard,
  runEscortRounds,
} from './helpers/world_population';

describe('open-world population never exceeds what the content authored', () => {
  it('holds at world generation', () => {
    const sim = new Sim({ seed: 20061, playerClass: 'warrior', noPlayer: true });
    assertPopulationSane(sim, 'at boot');
  });

  it.each(escortShard(0))(
    'holds after $id is run and its wave is killed, repeatedly',
    runEscortRounds,
    120_000,
  );

  it('deals every shipped escort to exactly one shard, and none is empty', () => {
    const dealt = Array.from({ length: ESCORT_SHARD_COUNT }, (_, i) =>
      escortShard(i).map((def) => def.id),
    );
    for (const [i, ids] of dealt.entries()) expect(ids.length, `shard ${i}`).toBeGreaterThan(0);
    expect(dealt.flat().sort()).toEqual(Object.keys(ESCORTS).sort());
    expect(new Set(dealt.flat()).size).toBe(dealt.flat().length);
    // ...and every shard is run by exactly one file: this one and its _b to _d
    // siblings each run the shard their suffix names, so a changed shard count or a
    // dropped or doubled call leaves a shard unrun and fails here.
    const shardRuns = ['', '_b', '_c', '_d'].map((suffix) => {
      const source = stripComments(
        readFileSync(
          new URL(`./world_population_invariant${suffix}.test.ts`, import.meta.url),
          'utf8',
        ),
      );
      return [...source.matchAll(/\bescortShard\((\d+)\)/g)].map((m) => Number(m[1]));
    });
    expect(shardRuns).toEqual([[0], [1], [2], [3]]);
    expect(ESCORT_SHARD_COUNT).toBe(shardRuns.length);
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
