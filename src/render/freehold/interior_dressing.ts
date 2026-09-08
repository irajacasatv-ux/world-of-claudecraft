import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DUNGEON_FLOOR_Y } from '../../sim/data';
import type { DungeonLayout } from '../../sim/dungeon_layout';
import { surfaceMat } from '../gfx';
import { markSharedGeometry, markSharedMaterial } from '../shared_resource';
import { FREEHOLD_MODEL_PARTS, type FreeholdModelKind } from './model_spec_core';

interface PreparedPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}
const prepared = new Map<boolean, Map<FreeholdModelKind, PreparedPart[]>>();

/** Static stand-ins are prepared in the dungeon prewarm and reused by every home slot. */
export function ensureFreeholdDressing(lowGfx: boolean): void {
  if (prepared.has(lowGfx)) return;
  const models = new Map<FreeholdModelKind, PreparedPart[]>();
  const materials = new Map<number, THREE.Material>();
  for (const kind of Object.keys(FREEHOLD_MODEL_PARTS) as FreeholdModelKind[]) {
    const byColor = new Map<number, THREE.BufferGeometry[]>();
    for (const part of FREEHOLD_MODEL_PARTS[kind]) {
      const pieces = byColor.get(part.color) ?? [];
      pieces.push(new THREE.BoxGeometry(...part.size).translate(...part.center));
      byColor.set(part.color, pieces);
    }
    const parts: PreparedPart[] = [];
    for (const [color, pieces] of byColor) {
      let material = materials.get(color);
      if (!material) {
        material = lowGfx
          ? markSharedMaterial(new THREE.MeshLambertMaterial({ color }))
          : surfaceMat({ color, roughness: 0.92 });
        materials.set(color, material);
      }
      const merged = mergeGeometries(pieces, false);
      for (const piece of pieces) piece.dispose();
      if (!merged) throw new Error(`Freehold model merge failed: ${kind}`);
      parts.push({ geometry: markSharedGeometry(merged), material });
    }
    models.set(kind, parts);
  }
  prepared.set(lowGfx, models);
}

function decorModel(key: string): FreeholdModelKind | null {
  if (key.startsWith('plinth_')) return 'plinth';
  if (key === 'bed' || key === 'hearth' || key === 'entry_door') return key;
  return null;
}

/** Reads only the shared layout. Reserved anchors never masquerade as usable stations. */
export function buildFreeholdDressing(
  group: THREE.Group,
  layout: DungeonLayout,
  lowGfx: boolean,
): void {
  ensureFreeholdDressing(lowGfx);
  const models = prepared.get(lowGfx)!;
  const matrix = new THREE.Matrix4();
  const pose = new THREE.Object3D();
  for (const [kind, parts] of models) {
    const spots = (layout.decor ?? []).filter((d) => decorModel(d.key) === kind);
    if (!spots.length) continue;
    for (const part of parts) {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, spots.length);
      mesh.name = `freehold-${kind}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      spots.forEach((spot, i) => {
        pose.position.set(spot.x, DUNGEON_FLOOR_Y, spot.z);
        pose.rotation.set(0, spot.yaw, 0);
        pose.scale.setScalar(spot.scale ?? 1);
        pose.updateMatrix();
        matrix.copy(pose.matrix);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
  }
}

/** Same mesh shape and material identities as live dressing, including the low tier. */
export function buildFreeholdPrewarmGroup(lowGfx: boolean): THREE.Group {
  ensureFreeholdDressing(lowGfx);
  const group = new THREE.Group();
  group.name = 'freehold-dressing-prewarm';
  const identity = new THREE.Matrix4();
  for (const [kind, parts] of prepared.get(lowGfx)!) {
    for (const part of parts) {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, 1);
      mesh.name = `freehold-${kind}`;
      mesh.setMatrixAt(0, identity);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  return group;
}
