// The real streamed grass ring (foliage.ts buildGrassRing) around the Freehold
// Gate: on a host that lights freeholds no tuft stands inside the arch's
// circle, and on a dark host the same ground stays grassed. The core's circle
// is pinned in tests/foliage_core.test.ts; this drives the ring that reads it.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  eastbrookGrassExclusions,
  FREEHOLD_GATE_GRASS_RADIUS,
  insideEastbrookGrassExclusion,
} from '../src/render/foliage_core';
import { BUILTIN_WORLD, PROPS } from '../src/sim/data';
import { EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';
import { WORLD_SEED } from '../src/sim/world_seed';

vi.mock('../src/render/assets/loader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/render/assets/loader')>();
  return {
    ...actual,
    loadGltf: () => new Promise(() => {}),
    loadTexture: () => new Promise(() => {}),
    releaseGltf: () => {},
  };
});
vi.mock('../src/render/assets/preload', () => ({
  registerPreload: () => {},
  registerDeferredPreload: () => {},
}));
vi.mock('../src/render/textures', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/render/textures')>();
  return {
    ...actual,
    grassTuftTexture: () => new THREE.Texture(),
    flowerTuftTexture: () => new THREE.Texture(),
  };
});
vi.mock('../src/render/gfx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/render/gfx')>();
  return { ...actual, GFX: actual.gfxInternalsForTest.settingsFor('low') };
});

const GATE = EASTBROOK_LAYOUT.services.freeholdGate.position;

/** Every submitted tuft and flower in the window streamed around the gate, in
 * world space, with its instance family. */
async function streamedAroundGate(
  lit: boolean,
): Promise<{ x: number; z: number; family: string }[]> {
  const { foliageGrassInternalsForTest } = await import('../src/render/foliage');
  const parent = new THREE.Group();
  // A frozen build clock builds the whole streamed window in the first update
  // (tests/foliage_perceptual_density.test.ts explains the pacing).
  const grass = foliageGrassInternalsForTest.buildGrassRing(parent, WORLD_SEED, () => 0, lit);
  for (let frame = 0; frame < 8; frame++)
    grass.update(GATE.x, GATE.z, GATE.x, 6, GATE.z + 6, 623.54, 1 / 60);
  expect(grass.perfStats().grassQueuedChunks).toBe(0);
  parent.updateMatrixWorld(true);
  const local = new THREE.Matrix4();
  const at = new THREE.Vector3();
  const placed: { x: number; z: number; family: string }[] = [];
  parent.traverse((object) => {
    const mesh = object as THREE.InstancedMesh;
    if (!mesh.isInstancedMesh || !mesh.visible) return;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, local);
      at.setFromMatrixPosition(local).applyMatrix4(mesh.matrixWorld);
      placed.push({ x: at.x, z: at.z, family: String(mesh.userData.instanceFamily) });
    }
  });
  expect(placed.length).toBeGreaterThan(1000);
  expect(new Set(placed.map((p) => p.family))).toEqual(new Set(['grass-card', 'ground-flower']));
  return placed;
}
const nearGate = (placed: { x: number; z: number }[]) =>
  placed.filter((p) => Math.hypot(p.x - GATE.x, p.z - GATE.z) < FREEHOLD_GATE_GRASS_RADIUS);

describe('the streamed grass ring at the Freehold Gate', () => {
  it('stands no tuft or flower inside the arch circle on a lit host, and keeps them on a dark one', async () => {
    // The positive control: the ground under the arch grows grass at all.
    expect(nearGate(await streamedAroundGate(false)).length).toBeGreaterThan(0);
    expect(nearGate(await streamedAroundGate(true))).toEqual([]);
  });

  it('keeps every bloom, anchored or authored, out of every town exclusion it streams past', async () => {
    // A flower is jittered off its tuft or sampled straight from a meadow, so
    // each is checked where it lands, not only where its anchor stood.
    const exclusions = eastbrookGrassExclusions(
      PROPS.buildings,
      true,
      BUILTIN_WORLD.services?.noticeboards ?? [],
      BUILTIN_WORLD.services?.freeholdGate ?? null,
    );
    const placed = await streamedAroundGate(true);
    // foliage.ts pads every exclusion by GRASS_BUILDING_PADDING (0.35 yd) for
    // tufts and blooms alike; the padded band is the contract.
    const inside = placed.filter((p) => insideEastbrookGrassExclusion(exclusions, p.x, p.z, 0.35));
    expect(inside).toEqual([]);
  });
});
