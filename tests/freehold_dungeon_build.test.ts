import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gfxInternalsForTest } from '../src/render/gfx';

let restoreGraphics: (() => void) | undefined;
afterEach(() => {
  restoreGraphics?.();
  restoreGraphics = undefined;
});

vi.mock('../src/render/assets/preload', () => ({
  registerDeferredPreload: vi.fn(),
  registerPreload: vi.fn(),
}));
vi.mock('../src/render/assets/loader', () => ({
  loadGltf: vi.fn(async () => {
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial()));
    return { scene };
  }),
  releaseGltf: vi.fn(),
}));
vi.mock('../src/render/rift_decor', () => ({
  ensureInfernalDecorAssets: vi.fn(),
  buildInfernalDecor: vi.fn(),
}));
vi.mock('../src/render/worn_stone', () => ({
  applySurfaceDetail: vi.fn(),
  reapplySurfaceDetailToClone: vi.fn(),
}));
vi.mock('../src/render/textures', () => ({ radialGlowTexture: () => new THREE.Texture() }));

import { DungeonInteriors } from '../src/render/dungeon';
import { resolveDungeonInteriorLayout } from '../src/render/dungeon_interior_resolver_core';
import { buildFreeholdPrewarmGroup } from '../src/render/freehold';
import {
  FREEHOLD_MODEL_PARTS,
  type FreeholdModelKind,
} from '../src/render/freehold/model_spec_core';
import { buildInfernalDecor, ensureInfernalDecorAssets } from '../src/render/rift_decor';
import { DUNGEON_FLOOR_Y } from '../src/sim/data';

for (const interior of ['inn_room', 'cottage'] as const) {
  describe(`${interior} streamed home`, () => {
    it.each([false, true])('prepares all fixed dressing before revealing (low=%s)', async (low) => {
      restoreGraphics = gfxInternalsForTest.overrideSettings({ standardMaterials: !low });
      const scene = new THREE.Scene();
      const flames: THREE.Mesh[] = [];
      const lights: THREE.PointLight[] = [];
      let release!: () => void;
      let gated!: THREE.Object3D;
      let reached!: () => void;
      const enteredGate = new Promise<void>((resolve) => {
        reached = resolve;
      });
      const builder = new DungeonInteriors(scene, low, flames, lights, (target) => {
        gated = target;
        reached();
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      });
      const building = builder.buildInterior(interior, 119200, 0);
      await Promise.race([enteredGate, building]);
      expect(gated.visible).toBe(false);
      expect(scene.children).toContain(gated);
      const dressing: THREE.Mesh[] = [];
      gated.traverse((obj) => {
        expect((obj as THREE.Light).isLight).not.toBe(true);
        if (obj.name.startsWith('freehold-')) dressing.push(obj as THREE.Mesh);
      });
      const expected = new Map<FreeholdModelKind, THREE.Matrix4[]>();
      for (const anchor of resolveDungeonInteriorLayout(interior, 0).decor ?? []) {
        if (anchor.key === 'strongbox' || anchor.key === 'station') continue;
        const kind = anchor.key.startsWith('plinth_') ? 'plinth' : anchor.key;
        expect(['bed', 'hearth', 'plinth', 'entry_door']).toContain(kind);
        const poses = expected.get(kind as FreeholdModelKind) ?? [];
        const pose = new THREE.Object3D();
        pose.position.set(anchor.x, DUNGEON_FLOOR_Y, anchor.z);
        pose.rotation.y = anchor.yaw;
        pose.scale.setScalar(anchor.scale ?? 1);
        pose.updateMatrix();
        poses.push(pose.matrix.clone());
        expected.set(kind as FreeholdModelKind, poses);
      }
      expect([...new Set(dressing.map((mesh) => mesh.name))].sort()).toEqual(
        [...expected.keys()].map((kind) => `freehold-${kind}`).sort(),
      );
      for (const [kind, poses] of expected) {
        const meshes = dressing.filter((mesh) => mesh.name === `freehold-${kind}`);
        expect(meshes).toHaveLength(
          new Set(FREEHOLD_MODEL_PARTS[kind].map((part) => part.color)).size,
        );
        for (const mesh of meshes) {
          const instanced = mesh as THREE.InstancedMesh;
          expect(instanced.count).toBe(poses.length);
          for (const [index, expectedMatrix] of poses.entries()) {
            const actual = new THREE.Matrix4();
            instanced.getMatrixAt(index, actual);
            for (const [element, value] of expectedMatrix.elements.entries())
              expect(actual.elements[element]).toBeCloseTo(value, 5);
          }
        }
      }
      expect(ensureInfernalDecorAssets).not.toHaveBeenCalled();
      expect(buildInfernalDecor).not.toHaveBeenCalled();
      expect(flames).toHaveLength(0);
      expect(lights).toHaveLength(0);
      const prewarm = buildFreeholdPrewarmGroup(low);
      const warmed = new Set<THREE.Material>();
      prewarm.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) for (const material of [mesh.material].flat()) warmed.add(material);
      });
      for (const mesh of dressing) {
        expect((mesh as THREE.InstancedMesh).isInstancedMesh).toBe(true);
        for (const material of [mesh.material].flat()) {
          expect(warmed.has(material)).toBe(true);
          if (!low)
            expect((material as THREE.MeshStandardMaterial).isMeshStandardMaterial).toBe(true);
          if (low) expect((material as THREE.MeshLambertMaterial).isMeshLambertMaterial).toBe(true);
        }
      }
      release();
      expect((await building).visible).toBe(true);
      const walls = gated.children.filter((child) => child.name === 'home-wall');
      expect(walls).toHaveLength(4);
      const south = walls.find((wall) =>
        wall.children.some((child) => child.name === 'freehold-entry_door'),
      );
      expect(south).toBeDefined();
      // Default chase camera at entry sits beyond the south face. The full
      // two-storey wall and attached closed door must cut away before drawing.
      builder.update(119200, 5.775, -15.39, 119200, 2, -4, 1 / 60, true);
      expect(walls.filter((wall) => !wall.visible)).toEqual([south]);
      for (const wall of walls)
        wall.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (mesh.isMesh)
            for (const material of [mesh.material].flat()) {
              expect(material.transparent).toBe(false);
              expect(material.opacity).toBe(1);
            }
        });
      builder.update(119200, 5, 0, 119200, 2, 0, 1 / 60, true);
      expect(walls.every((wall) => wall.visible)).toBe(true);
      builder.update(119230, 5, 0, 119200, 2, 0, 1 / 60, true);
      expect(walls.filter((wall) => !wall.visible)).toHaveLength(1);
      expect(south?.visible).toBe(true);
      builder.update(120200, 5, 0, 120200, 2, 0, 1 / 60, true);
      expect(walls.every((wall) => wall.visible)).toBe(true);
    });

    it('recovers from a rejected compile without losing the prepared home', async () => {
      const scene = new THREE.Scene();
      const builder = new DungeonInteriors(scene, true, [], [], () =>
        Promise.reject(new Error('link failed')),
      );
      const group = await builder.buildInterior(interior, 119200, 0);
      expect(group.visible).toBe(true);
      expect(scene.children).toContain(group);
      expect(group.children.length).toBeGreaterThan(3);
    });
  });
}
