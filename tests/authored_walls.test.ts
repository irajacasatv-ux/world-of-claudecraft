import { describe, expect, it } from 'vitest';
import { placeAuthoredWalls } from '../src/render/authored_walls';
import { Placements } from '../src/render/dungeon_arena_walls';
import { resolveDungeonInteriorLayout } from '../src/render/dungeon_interior_resolver_core';

const options = { wallKind: () => 'wall', hash: () => 0, moduleScale: 2 };
const matrices = (p: Placements) => [...p.byKind.values()].flat().map((m) => m.elements);

describe('authored wall face extraction', () => {
  it('keeps the same two complete wall courses while retaining face boundaries', () => {
    const layout = resolveDungeonInteriorLayout('inn_room', 0);
    const merged = new Placements();
    expect(placeAuthoredWalls(merged, layout, 'dawnhold', options)).toEqual([]);
    const split = new Placements();
    const faces = placeAuthoredWalls(split, layout, 'inn_room', options, true);
    expect(matrices(split)).toEqual([]);
    const expected = matrices(merged)
      .map((matrix) => JSON.stringify(matrix))
      .sort();
    const actual = faces
      .flatMap((face) => matrices(face.placements))
      .map((matrix) => JSON.stringify(matrix))
      .sort();
    expect(actual).toEqual(expected);
    expect(actual).toHaveLength(20);
    expect(matrices(merged).filter((matrix) => matrix[13] === 0)).toHaveLength(10);
    expect(matrices(merged).filter((matrix) => matrix[13] === 8)).toHaveLength(10);
    expect(faces).toHaveLength(4);
    for (const face of faces) {
      const { x, z, nx, nz } = face.plane;
      expect((x - 0) * nx + (z - 2) * nz).toBeGreaterThan(0);
    }
  });
});
