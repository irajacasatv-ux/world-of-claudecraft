// The dungeon-door arch GLB the browser draws for the Freehold Gate
// (door_portal.ts appendStaticDoorArch clones it once it has loaded; Node never
// loads it, so a render test there only sees the procedural fallback). Read
// with gltf-transform and returned as world-space triangles in the gate's own
// frame, after the quarter turn door_portal.ts applies at load.
import { readFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';

export const DOOR_ARCH_GLB = 'public/models/props/dungeon_door_arch.glb';

export async function doorArchTriangles(): Promise<THREE.Triangle[]> {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.readBinary(new Uint8Array(readFileSync(DOOR_ARCH_GLB)));
  // door_portal.ts: "The GLB opening faces its local X axis ... rotate the
  // authored geometry into place once" (scene.rotation.y = PI / 2).
  const turn = new THREE.Matrix4().makeRotationY(Math.PI / 2);
  const triangles: THREE.Triangle[] = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const world = turn.clone().multiply(new THREE.Matrix4().fromArray(node.getWorldMatrix()));
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute('POSITION');
      if (!position) continue;
      const indices = primitive.getIndices();
      const at = (i: number) =>
        new THREE.Vector3(
          ...(position.getElement(i, [0, 0, 0]) as [number, number, number]),
        ).applyMatrix4(world);
      const count = indices ? indices.getCount() : position.getCount();
      for (let k = 0; k + 2 < count; k += 3) {
        const [a, b, c] = [0, 1, 2].map((j) => (indices ? indices.getScalar(k + j) : k + j));
        triangles.push(new THREE.Triangle(at(a), at(b), at(c)));
      }
    }
  }
  return triangles;
}

/** Whether a ray from +z far out along (x, y) toward -z crosses the arch. */
export function archHit(triangles: readonly THREE.Triangle[], x: number, y: number): boolean {
  const ray = new THREE.Ray(new THREE.Vector3(x, y, 50), new THREE.Vector3(0, 0, -1));
  const target = new THREE.Vector3();
  return triangles.some((t) => ray.intersectTriangle(t.a, t.b, t.c, false, target) !== null);
}
