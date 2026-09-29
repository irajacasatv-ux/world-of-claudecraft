import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import * as daily from '../src/sim/world_quest_daily_generation';
import {
  generateBonusLeyChallenge,
  generateDailyLeyChallenge,
  generateDailyLeyPuzzle,
  generateDailyMatch3Level,
  solveDailyMatch3Level,
  WORLD_QUEST_DAILY_GENERATION_CYCLE,
} from '../src/sim/world_quest_daily_generation';
import { applyWorldQuestMatch3Move, worldQuestMatch3Matches } from '../src/sim/world_quest_match3';
import {
  traceWorldQuestPuzzle,
  worldQuestPuzzleInitialRotations,
} from '../src/sim/world_quest_puzzle';

describe('daily procedural world quest levels', () => {
  it('retains 32 distinct days before repetition', () => {
    expect(WORLD_QUEST_DAILY_GENERATION_CYCLE).toBe(32);
  });

  it('certifies every ley variant with an unsolved start and a short winning rotation sequence', () => {
    for (let day = 0; day < WORLD_QUEST_DAILY_GENERATION_CYCLE; day++) {
      const { puzzle, solution } = generateDailyLeyChallenge(day);
      const initial = worldQuestPuzzleInitialRotations(puzzle);
      expect(traceWorldQuestPuzzle(puzzle, initial).solved).toBe(false);
      const solved = traceWorldQuestPuzzle(puzzle, solution);
      expect(solved.solved).toBe(true);
      expect(solved.path.length).toBeGreaterThanOrEqual(7);
      expect(solved.path.length).toBeLessThanOrEqual(10);
      expect(
        solved.path.filter((index) => puzzle.tiles[index].kind === 'corner').length,
      ).toBeGreaterThanOrEqual(3);
      expect(
        solution.reduce(
          (clicks, rotation, index) => clicks + ((rotation - initial[index] + 4) % 4),
          0,
        ),
      ).toBeLessThanOrEqual(30);
    }
  });

  it('changes the solved beam route every day, not just decoys and initial rotations', () => {
    const routes = new Set<string>();
    const sources = new Set<string>();
    const targets = new Set<string>();
    for (let day = 0; day < 32; day++) {
      const { puzzle, solution } = generateDailyLeyChallenge(day);
      const trace = traceWorldQuestPuzzle(puzzle, solution);
      expect(trace.solved).toBe(true);
      // Reversing the same route is not a genuinely new challenge either.
      routes.add([trace.path.join(','), [...trace.path].reverse().join(',')].sort()[0]);
      sources.add(JSON.stringify(puzzle.source));
      targets.add(JSON.stringify(puzzle.target));
    }
    expect(routes.size).toBe(32);
    expect(sources.size).toBeGreaterThanOrEqual(8);
    expect(targets.size).toBeGreaterThanOrEqual(8);
  });

  it('replays a winning match-three witness for every possible daily board', () => {
    for (let day = 0; day < WORLD_QUEST_DAILY_GENERATION_CYCLE; day++) {
      const level = generateDailyMatch3Level(day);
      expect(worldQuestMatch3Matches(level.board, level.columns, level.rows).size).toBe(0);
      const witness = solveDailyMatch3Level(level);
      expect(witness).not.toBeNull();
      let board = [...level.board];
      let refillIndex = 0;
      let cleared = 0;
      for (const [from, to] of witness ?? []) {
        const result = applyWorldQuestMatch3Move(level, board, from, to, refillIndex);
        expect(result.accepted).toBe(true);
        board = result.board;
        refillIndex = result.refillIndex;
        cleared += result.cleared;
      }
      expect(cleared).toBeGreaterThanOrEqual(72);
      expect(witness?.length).toBeLessThanOrEqual(level.maxMoves);
    }
  });

  it('changes actual layouts every day for the whole cycle, including its boundary', () => {
    const ley = new Set<string>();
    const candy = new Set<string>();
    for (let day = 0; day < WORLD_QUEST_DAILY_GENERATION_CYCLE; day++) {
      // A straight tile rotated by 180 degrees is the same playable layout.
      ley.add(
        JSON.stringify(
          generateDailyLeyPuzzle(day).tiles.map((tile) => ({
            kind: tile.kind,
            rotation: tile.initialRotation % (tile.kind === 'straight' ? 2 : 4),
          })),
        ),
      );
      // Normalize candy labels: a recoloring alone must not count as a new board.
      const colors: number[] = [];
      candy.add(
        generateDailyMatch3Level(day)
          .board.map((color) => {
            if (!colors.includes(color)) colors.push(color);
            return colors.indexOf(color);
          })
          .join(','),
      );
    }
    expect(ley.size).toBe(WORLD_QUEST_DAILY_GENERATION_CYCLE);
    expect(candy.size).toBe(WORLD_QUEST_DAILY_GENERATION_CYCLE);
  });

  it('is repeatable across hosts and retries without shared mutable generated state', () => {
    for (const day of [-1, 0, 1, 2950, Number.MAX_SAFE_INTEGER]) {
      expect(generateDailyLeyPuzzle(day)).toEqual(generateDailyLeyPuzzle(day));
      expect(generateDailyMatch3Level(day)).toEqual(generateDailyMatch3Level(day));
    }
    expect(generateDailyLeyPuzzle(32)).toEqual(generateDailyLeyPuzzle(0));
    expect(generateDailyMatch3Level(32)).toEqual(generateDailyMatch3Level(0));
    const edited = generateDailyMatch3Level(0);
    expect(() => {
      (edited.board as number[])[0] = -1;
    }).toThrow(TypeError);
    expect(generateDailyMatch3Level(0).board[0]).toBeGreaterThanOrEqual(0);
    expect(generateDailyMatch3Level(32)).toBe(edited);
    expect(generateDailyMatch3Level(1)).not.toBe(edited);
    expect(Object.isFrozen(edited.refill)).toBe(true);
    expect(Object.isFrozen(edited)).toBe(true);
    const ley = generateDailyLeyPuzzle(0);
    expect(Object.isFrozen(generateDailyLeyChallenge(0))).toBe(true);
    expect(Object.isFrozen(generateDailyLeyChallenge(0).solution)).toBe(true);
    expect(generateDailyLeyPuzzle(32)).toBe(ley);
    expect(Object.isFrozen(ley)).toBe(true);
    expect(Object.isFrozen(ley.tiles)).toBe(true);
    expect(Object.isFrozen(ley.tiles[0])).toBe(true);
    expect(Object.isFrozen(ley.source)).toBe(true);
    expect(Object.isFrozen(ley.target)).toBe(true);
    for (const level of [1, 2]) {
      const bonus = generateBonusLeyChallenge(0, level);
      expect(generateBonusLeyChallenge(32, level)).toBe(bonus);
      expect(generateBonusLeyChallenge(1, level)).not.toBe(bonus);
      expect(Object.isFrozen(bonus)).toBe(true);
      expect(Object.isFrozen(bonus.solution)).toBe(true);
      expect(Object.isFrozen(bonus.puzzle)).toBe(true);
      expect(Object.isFrozen(bonus.puzzle.tiles)).toBe(true);
      expect(Object.isFrozen(bonus.puzzle.tiles[0])).toBe(true);
      expect(Object.isFrozen(bonus.puzzle.source)).toBe(true);
      expect(Object.isFrozen(bonus.puzzle.target)).toBe(true);
    }
    // Unsafe, fractional and non-finite days all read day 0's memo slot.
    for (const day of [Number.NaN, 1.5, 2 ** 53, Number.POSITIVE_INFINITY]) {
      expect(generateDailyMatch3Level(day)).toBe(generateDailyMatch3Level(0));
      expect(generateDailyLeyChallenge(day)).toBe(generateDailyLeyChallenge(0));
    }
    // A level the clamp cannot place fails fast, as the module-load table's read did.
    expect(() => generateBonusLeyChallenge(0, Number.NaN)).toThrow(RangeError);
    expect(generateBonusLeyChallenge(0, 1)).not.toBe(generateBonusLeyChallenge(0, 2));
  });
});

type DailyModule = typeof daily;
const CYCLE_DAYS = Array.from({ length: WORLD_QUEST_DAILY_GENERATION_CYCLE }, (_, day) => day);
const MODULE = '../src/sim/world_quest_daily_generation';

// Every board of every catalog in one canonical order, whatever order they were built in.
function catalogDigest(m: DailyModule): string {
  const boards = {
    ley: CYCLE_DAYS.map((day) => m.generateDailyLeyChallenge(day)),
    bonus: [1, 2].map((level) => CYCLE_DAYS.map((day) => m.generateBonusLeyChallenge(day, level))),
    match3: CYCLE_DAYS.map((day) => m.generateDailyMatch3Level(day)),
  };
  return createHash('sha256').update(JSON.stringify(boards)).digest('hex');
}

// Captured on the module that built all three catalogs at load (755ef96f3e, the parent of the
// change that made them lazy): whenever and in whatever order a board is first read, it must
// be exactly the board the module-load build made.
const MODULE_LOAD_CATALOG_DIGEST =
  '463fa65cd8db2b79e4ba6f6b37dce89e702593f2aee716d139f270a760db28db';

describe('the daily catalogs build on first use, and build what the module-load build did', () => {
  it('matches the module-load build (the digest reads in catalog order)', () => {
    expect(catalogDigest(daily)).toBe(MODULE_LOAD_CATALOG_DIGEST);
  });

  it('reads the same boards from a fresh module first read in reverse order', async () => {
    vi.resetModules();
    const fresh: DailyModule = await import(MODULE);
    const reversed = [...CYCLE_DAYS].reverse();
    for (const day of reversed) fresh.generateDailyMatch3Level(day);
    for (const level of [2, 1])
      for (const day of reversed) fresh.generateBonusLeyChallenge(day, level);
    for (const day of reversed) fresh.generateDailyLeyChallenge(day);
    // A fresh module instance, not the static one the earlier cases built.
    expect(fresh.generateDailyMatch3Level(0)).not.toBe(daily.generateDailyMatch3Level(0));
    expect(catalogDigest(fresh)).toBe(MODULE_LOAD_CATALOG_DIGEST);
  });

  it('seeds no Rng at load, and a first read builds only its own catalog or day', async () => {
    vi.resetModules();
    const seeds: number[] = [];
    vi.doMock('../src/sim/rng', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/sim/rng')>();
      class CountingRng extends actual.Rng {
        constructor(seed: number) {
          super(seed);
          seeds.push(seed);
        }
      }
      return { ...actual, Rng: CountingRng };
    });
    try {
      const fresh: DailyModule = await import(MODULE);
      expect(seeds).toEqual([]);
      // A level the clamp cannot place throws before any builder runs.
      expect(() => fresh.generateBonusLeyChallenge(0, Number.NaN)).toThrow(RangeError);
      expect(seeds).toEqual([]);
      fresh.generateDailyMatch3Level(5);
      fresh.generateDailyMatch3Level(37);
      expect(seeds).toEqual([0xca7d0000 + 5]);
      fresh.generateBonusLeyChallenge(3, 1);
      fresh.generateBonusLeyChallenge(9, 1);
      expect(seeds.slice(1)).toEqual(CYCLE_DAYS.map((day) => 0x1e7be000 + 5 * 0x10000 + day));
      fresh.generateBonusLeyChallenge(3, 2);
      fresh.generateBonusLeyChallenge(9, 2);
      expect(seeds.slice(33)).toEqual(CYCLE_DAYS.map((day) => 0x1e7be000 + 6 * 0x10000 + day));
      fresh.generateDailyLeyChallenge(0);
      fresh.generateDailyLeyPuzzle(31);
      expect(seeds.slice(65)).toEqual(CYCLE_DAYS.map((day) => 0x1e7be000 + day));
      expect(seeds).toHaveLength(97);
    } finally {
      vi.doUnmock('../src/sim/rng');
      vi.resetModules();
    }
  });
});
