import { readFileSync } from 'node:fs';
import { getBounds, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { describe, expect, it } from 'vitest';
import { DungeonInteriors } from '../src/render/dungeon';
import {
  resolveDungeonInteriorLayout,
  resolveDungeonInteriorVariant,
} from '../src/render/dungeon_interior_resolver_core';
import { ARENA_SLOT_COUNT, arenaOrigin } from '../src/sim/data';
import { ARENA_LAYOUT, arenaMapForSlot } from '../src/sim/dungeon_layout';
import { stripComments } from './helpers/strip_comments';

interface PlacementCall {
  kind: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number | [number, number, number];
}

describe('arena cover rendering', () => {
  it('maps each visible cover wall footprint onto its authored collider', async () => {
    await MeshoptDecoder.ready;
    const io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
    const document = await io.read('public/models/dungeon/wall.glb');
    const scene = document.getRoot().listScenes()[0];
    if (!scene) throw new Error('wall.glb has no scene');
    const bounds = getBounds(scene);
    expect(bounds.min[1]).toBeCloseTo(0, 6);
    expect(bounds.max[1]).toBeCloseTo(4, 6);

    const calls: PlacementCall[] = [];
    const placements = {
      add: (
        kind: string,
        x: number,
        y: number,
        z: number,
        rotY = 0,
        scale: number | [number, number, number] = 1,
      ) => calls.push({ kind, x, y, z, rotY, scale }),
    };
    const interiors = Object.create(DungeonInteriors.prototype) as DungeonInteriors;

    (
      interiors as unknown as {
        placeStubs(
          sink: typeof placements,
          stubs: typeof ARENA_LAYOUT.stubs,
          variant: 'arena',
        ): void;
      }
    ).placeStubs(placements, ARENA_LAYOUT.stubs, 'arena');

    expect(calls).toHaveLength(ARENA_LAYOUT.stubs.length);
    for (const [index, stub] of ARENA_LAYOUT.stubs.entries()) {
      const call = calls[index];
      expect(call.kind).toBe('wall');
      expect(call.y).toBe(0);
      expect(call.rotY).toBe(Math.PI / 2);
      expect(Array.isArray(call.scale)).toBe(true);
      if (!Array.isArray(call.scale)) throw new Error('arena cover requires non-uniform scale');

      // Transform the shipped GLB's real bounds with the same scale and
      // Y rotation Placements.add uses, including asset quantization.
      const [scaleX, , scaleZ] = call.scale;
      const corners = [bounds.min[0], bounds.max[0]].flatMap((localX) =>
        [bounds.min[2], bounds.max[2]].map((localZ) => ({
          x: call.x + Math.cos(call.rotY) * localX * scaleX + Math.sin(call.rotY) * localZ * scaleZ,
          z: call.z - Math.sin(call.rotY) * localX * scaleX + Math.cos(call.rotY) * localZ * scaleZ,
        })),
      );
      const xs = corners.map((corner) => corner.x);
      const zs = corners.map((corner) => corner.z);
      expect(Math.min(...xs)).toBeCloseTo(stub.x - stub.hw, 3);
      expect(Math.max(...xs)).toBeCloseTo(stub.x + stub.hw, 3);
      expect(Math.min(...zs)).toBeCloseTo(stub.z - stub.hd, 3);
      expect(Math.max(...zs)).toBeCloseTo(stub.z + stub.hd, 3);
    }
  });
});

describe('arena variant parity (render vs sim map selection)', () => {
  it('resolves the same map as arenaMapForSlot at every arena slot', () => {
    const variants = new Set<string>();
    for (let slot = 0; slot < ARENA_SLOT_COUNT; slot++) {
      const o = arenaOrigin(slot);
      const variant = resolveDungeonInteriorVariant('arena', o.x, o.z);
      variants.add(variant);
      expect(resolveDungeonInteriorLayout('arena', o.z), `slot ${slot} layout`).toBe(
        arenaMapForSlot(slot).layout,
      );
      const expected = arenaMapForSlot(slot).id === 'drowned_court' ? 'arena_drowned' : 'arena';
      expect(variant, `slot ${slot}`).toBe(expected);
    }
    expect([...variants].sort()).toEqual(['arena', 'arena_drowned']);
  });

  it('uses the shared arena selectors in the live interior builder', () => {
    const source = stripComments(
      readFileSync(new URL('../src/render/dungeon.ts', import.meta.url), 'utf8'),
    );
    expect(source).toContain(
      'const layout = resolveDungeonInteriorLayout(interior, oz, opts?.layout)',
    );
    expect(source).toContain(
      'opts?.style?.kit ?? opts?.variant ?? resolveDungeonInteriorVariant(interior, ox, oz)',
    );
  });
});
