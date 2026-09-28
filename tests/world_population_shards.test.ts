// The escort sweep's partition, pinned apart from the sweep itself: the world
// population invariant's escort cases run in tests/world_population_invariant_a to
// _d.test.ts for wall time (tests/helpers/world_population.ts), beside the rule's own
// file. This file only reads those sources and deals the shards through the Sim-free
// tests/helpers/escort_shards.ts; it builds no world, so the file that reads source
// text stays cheap and the escort-carrying files stay import-graph selected.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyTestSource } from '../scripts/lib/test_visibility.mjs';
import { ESCORTS } from '../src/sim/data';
import { ESCORT_SHARD_COUNT, escortShard } from './helpers/escort_shards';
import { stripComments } from './helpers/strip_comments';

const read = (file: string) => readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
const SUFFIXES = ['a', 'b', 'c', 'd'];
const shardFileName = (suffix: string) => `world_population_invariant_${suffix}.test.ts`;

/** The one shard-file template, with only the shard index varying. */
const shardFile = (index: number) =>
  "import { describe, it } from 'vitest'; import { escortShard, runEscortRounds } from './helpers/world_population'; " +
  "describe('open-world population never exceeds what the content authored', () => { " +
  `it.each(escortShard(${index}))( 'holds after $id is run and its wave is killed, repeatedly', runEscortRounds, 120_000, ); });`;

describe('the world population escort sweep shards', () => {
  it('deals every shipped escort to exactly one shard, and none is empty', () => {
    const dealt = Array.from({ length: ESCORT_SHARD_COUNT }, (_, i) =>
      escortShard(i).map((def) => def.id),
    );
    for (const [i, ids] of dealt.entries()) expect(ids.length, `shard ${i}`).toBeGreaterThan(0);
    expect(dealt.flat().sort()).toEqual(Object.keys(ESCORTS).sort());
    expect(new Set(dealt.flat()).size).toBe(dealt.flat().length);
  });

  it('runs every shard in exactly one file, each file the one template', () => {
    // Below each file's leading header of line comments, the RAW text is flattened and
    // must equal the template with only its shard index substituted, and carry no
    // comment marker at all: comment stripping cannot see string literals, so a marker
    // split across two strings could otherwise blank real code out of the comparison.
    // No options object, hook, wrapper, modifier, shadowed callback or swapped import
    // survives this, so every registration is live and runs the real callback.
    expect(ESCORT_SHARD_COUNT).toBe(SUFFIXES.length);
    for (const [index, suffix] of SUFFIXES.entries()) {
      const file = shardFileName(suffix);
      const body = read(file).replace(/^(\/\/[^\n]*\n)+/, '');
      expect(body, `${file} carries a comment marker below its header`).not.toMatch(
        /\/\*|\*\/|\/\//,
      );
      expect(
        body.replace(/\s+/g, ' ').trim(),
        `${file} must equal shardFile(${index}) in tests/world_population_shards.test.ts; ` +
          'the four shard files and that template change together',
      ).toBe(shardFile(index));
    }
    // The rule's own file registers no shard and reaches the helper only for the budget
    // check, through one named import.
    const base = stripComments(read('world_population_invariant.test.ts'));
    expect(base).not.toMatch(/escortShard|runEscortRounds|import \*/);
    expect(base.split("from './helpers/")).toHaveLength(2);
    expect(base).toContain("import { assertPopulationSane } from './helpers/world_population';");
  });

  it('keeps the deal and the per-escort rounds free of an escape', () => {
    // The deal is round-robin over the content table and nothing else, and one escort's
    // rounds cannot end early and quietly: their loops skip with continue, a return
    // would drop an escort's assertions unseen, and a throw fails the case loudly.
    expect(stripComments(read('helpers/escort_shards.ts'))).toContain(
      'return Object.values(ESCORTS).filter((_, i) => i % ESCORT_SHARD_COUNT === index);',
    );
    const helper = stripComments(read('helpers/world_population.ts'));
    const rounds = helper.slice(helper.indexOf('export function runEscortRounds('));
    expect(rounds.length).toBeGreaterThan(0);
    expect(rounds).not.toMatch(/\breturn\b/);
    expect(rounds).toContain(
      "expect(ranAtLeastOne, 'no escort actually ran, so this proved nothing').toBe(true);",
    );
  });

  it('leaves the escort-carrying files import-graph selected', () => {
    // Reading source text makes a file partial (always run on a selective PR); only this
    // cheap file may, never the files that build and tick the world.
    for (const file of ['world_population_invariant.test.ts', ...SUFFIXES.map(shardFileName)]) {
      expect(classifyTestSource(read(file)).klass, file).toBe('graph');
    }
    expect(classifyTestSource(read('world_population_shards.test.ts')).klass).toBe('partial');
  });
});
