import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { applyFreeholdExitLabelAnchor } from '../src/render/freehold/exit_label_core';
import { isProjectedNameplateAnchorVisible } from '../src/render/nameplate_projection';
import type { Entity } from '../src/sim/types';

const ORIGIN_X = 119200;
const ORIGIN_Z = -1250;
function exit(dungeonId: string): Entity {
  return {
    kind: 'object',
    templateId: 'dungeon_exit',
    dungeonId,
    pos: { x: ORIGIN_X, y: 0, z: ORIGIN_Z - 6 },
    scale: 1,
  } as Entity;
}

describe('authored freehold exit labels', () => {
  it.each(['freehold_inn_room', 'freehold_cottage'])(
    '%s follows its closed door through camera cutaway and restoration',
    (id) => {
      const anchor = new THREE.Vector3(ORIGIN_X, 5.4, ORIGIN_Z - 6);
      expect(
        applyFreeholdExitLabelAnchor(anchor, exit(id), { x: ORIGIN_X, z: ORIGIN_Z - 15.3911 }),
      ).toBe(false);
      expect(applyFreeholdExitLabelAnchor(anchor, exit(id), { x: ORIGIN_X, z: ORIGIN_Z })).toBe(
        true,
      );
      expect(anchor.toArray()).toEqual([ORIGIN_X, 4, ORIGIN_Z - 6.9]);
      expect(
        applyFreeholdExitLabelAnchor(anchor, exit(id), { x: ORIGIN_X, z: ORIGIN_Z - 6.51 }),
      ).toBe(false);
      expect(
        applyFreeholdExitLabelAnchor(anchor, exit(id), { x: ORIGIN_X, z: ORIGIN_Z - 6.5 }),
      ).toBe(true);
    },
  );

  it('reproduces the captured forward projection even though the exit is behind the player', () => {
    const camera = new THREE.PerspectiveCamera(60, 1600 / 900, 0.1, 1000);
    camera.position.set(ORIGIN_X, 5.7717, -1265.3911);
    camera.lookAt(ORIGIN_X, 2, -1254);
    camera.updateMatrixWorld();
    const oldAnchor = new THREE.Vector3(ORIGIN_X, 5.4, -1256);
    expect(isProjectedNameplateAnchorVisible(camera, oldAnchor, new THREE.Vector3())).toBe(true);
    const projected = oldAnchor.clone().project(camera);
    expect((projected.x * 0.5 + 0.5) * 1600).toBeCloseTo(800, 0);
    expect((-projected.y * 0.5 + 0.5) * 900).toBeGreaterThan(200);
    expect((-projected.y * 0.5 + 0.5) * 900).toBeLessThan(230);
    expect(
      applyFreeholdExitLabelAnchor(oldAnchor, exit('freehold_inn_room'), camera.position),
    ).toBe(false);
  });

  it('leaves ordinary portals and the overworld service label untouched', () => {
    for (const entity of [
      exit('crypt'),
      { ...exit('freehold_inn_room'), templateId: 'freehold_gate' },
      { ...exit('freehold_inn_room'), kind: 'mob' as const },
    ]) {
      const anchor = { x: 1, y: 5.4, z: 3 };
      expect(applyFreeholdExitLabelAnchor(anchor, entity, { x: 0, z: -20 })).toBe(true);
      expect(anchor).toEqual({ x: 1, y: 5.4, z: 3 });
    }
  });
});
