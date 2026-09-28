// The escort sweep's partition, pinned apart from the sweep itself: the world
// population invariant's escort cases are dealt across
// tests/world_population_invariant.test.ts and its _b to _d siblings for wall time
// (tests/helpers/world_population.ts). This file only reads those four sources and
// deals the shards; it builds no world, so the file that reads source text stays
// cheap and the escort-carrying files stay import-graph selected.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ESCORTS } from '../src/sim/data';
import { stripComments } from './helpers/strip_comments';
import { ESCORT_SHARD_COUNT, escortShard } from './helpers/world_population';

describe('the world population escort sweep shards', () => {
  it('deals every shipped escort to exactly one shard, and none is empty', () => {
    const dealt = Array.from({ length: ESCORT_SHARD_COUNT }, (_, i) =>
      escortShard(i).map((def) => def.id),
    );
    for (const [i, ids] of dealt.entries()) expect(ids.length, `shard ${i}`).toBeGreaterThan(0);
    expect(dealt.flat().sort()).toEqual(Object.keys(ESCORTS).sort());
    expect(new Set(dealt.flat()).size).toBe(dealt.flat().length);
    // ...and every shard is run by exactly one file: this one and its _b to _d
    // siblings each register the shard their suffix names as a live it.each with the
    // real callback, so a changed shard count, a dropped, doubled or skipped
    // registration, or a swapped callback leaves a shard unrun and fails here.
    const registration =
      /\bit\.each\(escortShard\((\d+)\)\)\(\s*'holds after \$id is run and its wave is killed, repeatedly',\s*runEscortRounds,\s*120_000,?\s*\)/g;
    const shardRuns = ['', '_b', '_c', '_d'].map((suffix) => {
      const file = `world_population_invariant${suffix}.test.ts`;
      const source = stripComments(readFileSync(new URL(`./${file}`, import.meta.url), 'utf8'));
      const runs = [...source.matchAll(registration)].map((m) => Number(m[1]));
      // Every numbered shard token is one of those registrations, and no modifier can
      // skip, defer or narrow one.
      expect([...source.matchAll(/\bescortShard\(\d+\)/g)], file).toHaveLength(runs.length);
      expect(source, file).not.toMatch(/\.(skip|todo|skipIf|runIf|only)\b/);
      return runs;
    });
    expect(shardRuns).toEqual([[0], [1], [2], [3]]);
    expect(ESCORT_SHARD_COUNT).toBe(shardRuns.length);
  });
});
