import * as THREE from 'three';
import { DUNGEON_WALL_HEIGHT, type DungeonLayout } from '../../sim/dungeon_layout';
import type { AuthoredWallFace } from '../authored_walls';
import type { Placements } from '../dungeon_arena_walls';
import type { WallHideable } from '../dungeon_wall_occlusion';

/** Whole opaque wall faces use the existing backface policy without minting fade programs. */
export function emitFreeholdWallFaces(
  root: THREE.Group,
  faces: readonly AuthoredWallFace[],
  layout: DungeonLayout,
  ox: number,
  oz: number,
  hideables: WallHideable[],
  emit: (group: THREE.Group, placements: Placements) => void,
): void {
  const door = layout.decor?.find((anchor) => anchor.key === 'entry_door');
  for (const face of faces) {
    const group = new THREE.Group();
    group.name = 'home-wall';
    emit(group, face.placements);
    const { plane, segment } = face;
    const doorAlong = door && (segment.axis === 'x' ? door.x : door.z);
    const doorAcross = door && (segment.axis === 'x' ? door.z : door.x);
    if (
      doorAlong !== undefined &&
      doorAcross !== undefined &&
      doorAlong >= segment.a &&
      doorAlong <= segment.b &&
      Math.abs(doorAcross - segment.fixed) < 1.5
    ) {
      for (const child of [...root.children]) {
        if (child.name === 'freehold-entry_door') group.add(child);
      }
    }
    root.add(group);
    hideables.push({
      group,
      mats: [],
      hidden: false,
      alpha: 1,
      opaqueCutaway: true,
      footprint: {
        x: ox + plane.x,
        z: oz + plane.z,
        hw: segment.axis === 'x' ? (segment.b - segment.a) / 2 : 1,
        hd: segment.axis === 'z' ? (segment.b - segment.a) / 2 : 1,
        topY: DUNGEON_WALL_HEIGHT * 2,
      },
      backface: { ...plane, x: ox + plane.x, z: oz + plane.z },
    });
  }
}
