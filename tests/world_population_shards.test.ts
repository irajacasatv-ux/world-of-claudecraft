// The escort sweep's partition, pinned apart from the sweep itself: the world
// population invariant's escort cases run in tests/world_population_invariant_a to
// _d.test.ts for wall time (tests/helpers/world_population.ts), beside the rule's own
// file. This file only reads those sources and deals the shards; it builds no world,
// so the file that reads source text stays cheap and the escort-carrying files stay
// import-graph selected.
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
    // ...and every shard is run by exactly one file. The four shard files are one
    // template: comment-stripped and whitespace-flattened, each must equal it with only
    // its shard index substituted, so no options object, hook, wrapper, modifier,
    // shadowed callback or swapped import can skip or narrow a registration. The rule's
    // own file registers no shard at all.
    const flatSource = (file: string) =>
      stripComments(readFileSync(new URL(`./${file}`, import.meta.url), 'utf8'))
        .replace(/\s+/g, ' ')
        .trim();
    const shardFile = (index: number) =>
      "import { describe, it } from 'vitest'; import { escortShard, runEscortRounds } from './helpers/world_population'; " +
      "describe('open-world population never exceeds what the content authored', () => { " +
      `it.each(escortShard(${index}))( 'holds after $id is run and its wave is killed, repeatedly', runEscortRounds, 120_000, ); });`;
    const suffixes = ['a', 'b', 'c', 'd'];
    expect(ESCORT_SHARD_COUNT).toBe(suffixes.length);
    for (const [index, suffix] of suffixes.entries()) {
      expect(flatSource(`world_population_invariant_${suffix}.test.ts`), suffix).toBe(
        shardFile(index),
      );
    }
    expect(flatSource('world_population_invariant.test.ts')).not.toMatch(
      /escortShard|runEscortRounds/,
    );
  });
});
