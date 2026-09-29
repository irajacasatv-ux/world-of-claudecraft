import { describe, expect, it } from 'vitest';
import { WISP_MAZE_NPC_DEF, WISP_MAZE_QUEST_ID } from '../src/sim/content/world_quest_wisp_maze';
import { BUILTIN_WORLD } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { WorldContent } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

// The maze runs only where its instructor stands, so the file's world keeps
// that one NPC and nothing else from the overworld.
const WISP_WORLD: WorldContent = {
  ...EMPTY_TEST_WORLD,
  npcs: { [WISP_MAZE_NPC_DEF.id]: BUILTIN_WORLD.npcs[WISP_MAZE_NPC_DEF.id] },
};

describe('wisp maze developer difficulty selector', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'starts %s through both documented commands',
    (difficulty) => {
      const sim = new Sim({
        seed: 991,
        playerClass: 'warrior',
        devCommands: true,
        world: WISP_WORLD,
      });
      for (const prefix of ['/dev wisps', '/dev wq wisps']) {
        sim.chat(`${prefix} ${difficulty}`);
        expect(sim.worldQuestLog.get(WISP_MAZE_QUEST_ID)?.wispMaze?.difficulty).toBe(difficulty);
        expect(sim.worldQuestLog.get(WISP_MAZE_QUEST_ID)?.wispMaze?.phase).toBe('countdown');
      }
    },
  );
  it('does not arm an invalid profile or enable developer commands on production', () => {
    for (const enabled of [false, true]) {
      const sim = new Sim({
        seed: 991,
        playerClass: 'warrior',
        devCommands: enabled,
        world: WISP_WORLD,
      });
      sim.chat(enabled ? '/dev wisps impossible' : '/dev wisps hard');
      expect(sim.worldQuestLog.has(WISP_MAZE_QUEST_ID)).toBe(false);
    }
  });
});
