import { afterEach, describe, expect, it } from 'vitest';
import { NPCS, setActiveWorldContent } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { collectCalmAnchorPads } from '../src/sim/terrain_calm_anchors';
import { groundHeight, terrainHeight } from '../src/sim/world';

afterEach(() => setActiveWorldContent(null));

// These four pre-furnisher literals are from the existing terrain-height
// golden corpus. Adding a required pad at (-66, -96) changed all four.
const GOLDEN_POINTS = [
  { seed: 42, x: -60, z: -96, height: -0.41517106585608576 },
  { seed: 42, x: -66, z: -90, height: -0.43374254929874984 },
  {
    seed: 2_147_483_647,
    x: -60.863476185594166,
    z: -92.86172453079594,
    height: -0.10891595743617682,
  },
  {
    seed: 2_147_483_647,
    x: -61.825141408007866,
    z: -93.82338975320965,
    height: 0.08224219563562438,
  },
] as const;

describe('freehold NPC terrain calm registration', () => {
  it('preserves every earlier NPC pad and adds none for the gated furnisher', () => {
    const pads = collectCalmAnchorPads().filter((pad) => pad.category === 'npc');
    expect(pads).toEqual(
      Object.values(NPCS)
        .filter((npc) => npc.id !== 'freehold_furnisher')
        .map((npc) => ({
          x: npc.pos.x,
          z: npc.pos.z,
          rIn: 6,
          baseROut: 14,
          optional: false,
          category: 'npc',
        })),
    );
    expect(pads.some((pad) => pad.x === -66 && pad.z === -96)).toBe(false);
  });

  it.each([42, 2_147_483_647])(
    'keeps the pre-furnisher terrain on both host modes, seed %s',
    (seed) => {
      const dark = new Sim({ seed, playerClass: 'warrior', freeholdsEnabled: false });
      const points = GOLDEN_POINTS.filter((point) => point.seed === seed);
      const darkHeights = points.map(({ x, z }) => ({
        terrain: terrainHeight(x, z, seed),
        ground: groundHeight(x, z, seed),
        placement: dark.groundPos(x, z).y,
      }));
      const lit = new Sim({ seed, playerClass: 'warrior', freeholdsEnabled: true });
      const litHeights = points.map(({ x, z }) => ({
        terrain: terrainHeight(x, z, seed),
        ground: groundHeight(x, z, seed),
        placement: lit.groundPos(x, z).y,
      }));
      expect(litHeights).toEqual(darkHeights);
      for (const [index, point] of points.entries()) {
        for (const [lane, height] of Object.entries(darkHeights[index])) {
          // The full unchanged corpus separately enforces its two-ULP allowance.
          expect.soft(height, `${lane} at (${point.x}, ${point.z})`).toBeCloseTo(point.height, 14);
        }
      }
    },
  );
});
