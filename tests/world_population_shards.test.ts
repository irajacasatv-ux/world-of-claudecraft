// The escort sweep's partition, pinned apart from the sweep itself: the world
// population invariant's escort cases run in tests/world_population_invariant_a to
// _d.test.ts for wall time (tests/helpers/world_population.ts), beside the rule's own
// file. This file only reads those sources and deals the shards through the Sim-free
// tests/helpers/escort_shards.ts; it builds no world, so the file that reads source
// text stays cheap and the escort-carrying files stay import-graph selected.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyTestSource, HELPER_FS_PATTERN } from '../scripts/lib/test_visibility.mjs';
import { ESCORTS } from '../src/sim/data';
import { ESCORT_SHARD_COUNT, escortShard } from './helpers/escort_shards';
import { stripComments } from './helpers/strip_comments';

// Resolved as a path, not a `new URL(...)` over import.meta.url: Vite rewrites a
// templated `./${file}` URL into a glob lookup, which misses files it did not expect.
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(HERE, file), 'utf8');
const flatCode = (file: string) => stripComments(read(file)).replace(/\s+/g, ' ').trim();
const SUFFIXES = ['a', 'b', 'c', 'd'];
const shardFileName = (suffix: string) => `world_population_invariant_${suffix}.test.ts`;

// Every form of importing a test helper: a from clause, a side-effect import and a
// dynamic import. And the pragmas vitest reads from a leading comment.
const HELPER_IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"`]\.\/helpers\//g;
const RUNNER_PRAGMA = /@(?:vitest|jest)-/;
// What the population helper must not do: deal escorts itself, or re-export anything
// wholesale (which could hand the shard files a second deal).
const HELPER_DEALS = /\bescortShard\b|export \*/;

/** The one shard-file template, with only the shard index varying. */
const shardFile = (index: number) =>
  "import { describe, it } from 'vitest'; import { escortShard } from './helpers/escort_shards'; " +
  "import { runEscortRounds } from './helpers/world_population'; " +
  "describe('open-world population never exceeds what the content authored', () => { " +
  `it.each(escortShard(${index}))( 'holds after $id is run and its wave is killed, repeatedly', runEscortRounds, 120_000, ); });`;

// The deal module and one escort's rounds, each pinned whole (comments stripped,
// whitespace flattened): an early continue, break, return or swallowed assertion in the
// rounds, or any change to the deal, fails here. A deliberate edit to either updates the
// matching constant below in the same change.
const RUN_ESCORT_ROUNDS = [
  'export function runEscortRounds(def: EscortDef): void { const sim = new Sim({ seed:',
  "424242, playerClass: 'warrior', playerName: 'Escorter', respawnSeconds: 2,",
  '...PRODUCTION_IDLE_CULL, });',
  'sim.setPlayerLevel(20); let ranAtLeastOne = false; for (let round = 0; round < 2;',
  'round++) { sim.player.dead = false; sim.player.hp = sim.player.maxHp;',
  'sim.targetEntity(null); if (def.worldQuestId !== undefined) { const meta =',
  "sim.meta(sim.playerId); if (!meta) throw new Error('Missing player metadata');",
  "meta.devWorldQuestCycle = worldQuestCycleOfferingQuest('wq3_0', def.worldQuestId);",
  'const start = sim.groundPos(def.start.x, def.start.z); sim.player.pos = { ...start',
  '}; sim.player.prevPos = { ...start }; sim.tick(); } else {',
  "sim.questLog.set(def.questId, { questId: def.questId, counts: [0], state: 'active'",
  '}); } const escortee = findByTemplate(sim, def.npcMobId); if (!escortee) continue;',
  'const pos = sim.groundPos(escortee.pos.x, escortee.pos.z + 2); sim.player.pos = {',
  '...pos }; sim.player.prevPos = { ...pos }; sim.interact(); if',
  '(!sim.escortRuns.get(def.id)?.run) continue; ranAtLeastOne = true; let ids: number[]',
  '= []; for (let i = 0; i < 60 * 20 && ids.length === 0; i++) { sim.tick(); ids =',
  '[...(sim.escortRuns.get(def.id)?.run?.ambushIds ?? [])]; } for (const id of ids) {',
  'const mob = sim.entities.get(id); if (mob) sim.dealDamage(null, mob, mob.hp, false,',
  "'physical', null, 'hit'); } const walker = findByTemplate(sim, def.npcMobId); if",
  "(walker) sim.dealDamage(null, walker, walker.hp, false, 'physical', null, 'hit');",
  'for (let i = 0; i < 50 * 20; i++) sim.tick(); assertPopulationSane(sim, `${def.id}',
  "round ${round + 1}`); } expect(ranAtLeastOne, 'no escort actually ran, so this",
  "proved nothing').toBe(true); }",
].join(' ');

const ESCORT_SHARDS_MODULE = [
  "import { ESCORTS } from '../../src/sim/data'; import type { EscortDef } from",
  "'../../src/sim/types'; export const ESCORT_SHARD_COUNT = 4; export function",
  'escortShard(index: number): EscortDef[] { return Object.values(ESCORTS).filter((_,',
  'i) => i % ESCORT_SHARD_COUNT === index); }',
].join(' ');

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
    // The whole file carries no line terminator a line comment would end at (a lone CR,
    // U+2028, U+2029), so no code can hide inside the header, and no vitest pragma.
    // No options object, hook, wrapper, modifier, shadowed callback or swapped import
    // survives this, so every registration is live and runs the real callback.
    expect(ESCORT_SHARD_COUNT).toBe(SUFFIXES.length);
    for (const [index, suffix] of SUFFIXES.entries()) {
      const file = shardFileName(suffix);
      const raw = read(file);
      expect(raw, `${file} carries a CR, U+2028 or U+2029`).not.toMatch(/[\r\u2028\u2029]/);
      expect(raw, `${file} carries a test-runner pragma`).not.toMatch(RUNNER_PRAGMA);
      const body = raw.replace(/^(\/\/[^\n]*\n)+/, '');
      expect(body, `${file} carries a comment marker below its header`).not.toMatch(
        /\/\*|\*\/|\/\//,
      );
      expect(
        body.replace(/\s+/g, ' ').trim(),
        `${file} must equal shardFile(${index}) in tests/world_population_shards.test.ts; ` +
          'the four shard files and that template change together',
      ).toBe(shardFile(index));
    }
    // The rule's own file registers no shard and reaches the helpers only for the
    // budget check and the hub list, through one named import.
    const base = stripComments(read('world_population_invariant.test.ts'));
    expect(base, 'the rule file must not run or deal escorts').not.toMatch(
      /escortShard|runEscortRounds|escort_shards/,
    );
    expect(
      base,
      'the rule file must not reach the escort helpers through a namespace import',
    ).not.toMatch(/import \* as \w+ from '\.\/helpers\/(world_population|escort_shards)'/);
    expect(
      base,
      'the rule file imports the budget check and the hub list by name from the population helper',
    ).toContain(
      "import { assertPopulationSane, HUB_PRACTICE_IDS } from './helpers/world_population';",
    );
    expect(
      base.match(HELPER_IMPORT),
      'the rule file imports one helper, in any import form',
    ).toHaveLength(1);
  });

  it("pins the deal and one escort's rounds whole", () => {
    // Both sides are comments stripped and whitespace flattened, then split into
    // fragments at every '; ', so a failure's diff marks the changed fragment. To accept
    // a deliberate edit, change that fragment in the constant (its lines rejoin with one
    // space each, so keep a line break only where the flattened text has a space).
    const statements = (text: string) => text.split('; ');
    const howToUpdate = (constant: string) =>
      `changed: edit the marked fragment in ${constant} in ` +
      "tests/world_population_shards.test.ts (fragments are split at '; ')";
    expect(
      statements(flatCode('helpers/escort_shards.ts')),
      `tests/helpers/escort_shards.ts ${howToUpdate('ESCORT_SHARDS_MODULE')}`,
    ).toEqual(statements(ESCORT_SHARDS_MODULE));
    const helper = stripComments(read('helpers/world_population.ts'));
    const start = helper.indexOf('export function runEscortRounds(');
    expect(start, 'runEscortRounds is declared').toBeGreaterThan(-1);
    expect(helper.split('function runEscortRounds(')).toHaveLength(2);
    expect(helper, 'the population helper must not deal escorts itself').not.toMatch(HELPER_DEALS);
    const end = helper.indexOf('\n}\n', start);
    expect(end, 'runEscortRounds closes').toBeGreaterThan(start);
    expect(
      statements(
        helper
          .slice(start, end + 2)
          .replace(/\s+/g, ' ')
          .trim(),
      ),
      `runEscortRounds ${howToUpdate('RUN_ESCORT_ROUNDS')}`,
    ).toEqual(statements(RUN_ESCORT_ROUNDS));
  });

  it('bans what it says it bans (positive controls for the text checks)', () => {
    const helperImports = (text: string) => text.match(HELPER_IMPORT)?.length ?? 0;
    expect(helperImports("import { a } from './helpers/x';")).toBe(1);
    expect(helperImports("import './helpers/x';")).toBe(1);
    expect(helperImports("await import('./helpers/x');")).toBe(1);
    expect(helperImports("import { a } from '../src/sim/data';")).toBe(0);
    expect('// @vitest-environment happy-dom').toMatch(RUNNER_PRAGMA);
    expect('// @jest-environment node').toMatch(RUNNER_PRAGMA);
    expect(helperImports('await import("./helpers/x");')).toBe(1);
    expect(helperImports('await import(`./helpers/x`);')).toBe(1);
    expect("export * from './escort_shards';").toMatch(HELPER_DEALS);
    expect("export * as deal from './escort_shards';").toMatch(HELPER_DEALS);
    expect('const shard = escortShard(0);').toMatch(HELPER_DEALS);
    expect("export { a } from './x';").not.toMatch(HELPER_DEALS);
  });

  it('leaves the escort-carrying files import-graph selected', () => {
    // Reading source text makes a file partial (always run on a selective PR); only this
    // cheap file may, never the files that build and tick the world. Discovery also
    // floors a test that imports an fs-touching helper, so neither helper may touch fs.
    for (const helper of ['helpers/world_population.ts', 'helpers/escort_shards.ts']) {
      expect(HELPER_FS_PATTERN.test(read(helper)), `${helper} touches fs`).toBe(false);
    }
    for (const file of ['world_population_invariant.test.ts', ...SUFFIXES.map(shardFileName)]) {
      expect(classifyTestSource(read(file)).klass, file).toBe('graph');
    }
    expect(classifyTestSource(read('world_population_shards.test.ts')).klass).toBe('partial');
  });
});
