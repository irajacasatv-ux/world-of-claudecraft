import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { gfxInternalsForTest } from '../src/render/gfx';

let restoreGraphics: (() => void) | undefined;
afterEach(() => {
  restoreGraphics?.();
  restoreGraphics = undefined;
});

import { buildFreeholdDressing, buildFreeholdPrewarmGroup } from '../src/render/freehold';
import { DUNGEON_FLOOR_Y } from '../src/sim/data';
import type { DungeonLayout } from '../src/sim/dungeon_layout';

const layout: DungeonLayout = {
  zMin: -8,
  zMax: 12,
  sideWallZ: 2,
  sideWallHd: 10,
  pillars: [],
  tombs: [],
  stubs: [],
  dais: { x: 0, z: 0, r: 0 },
};

function kindBounds(root: THREE.Group, kind: string): THREE.Box3 {
  const bounds = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (object.name === `freehold-${kind}`) bounds.union(new THREE.Box3().setFromObject(object));
  });
  return bounds;
}

describe('measured freehold dressing', () => {
  it.each([false, true])(
    'preserves measured solid silhouettes on every material mode (low=%s)',
    (low) => {
      restoreGraphics = gfxInternalsForTest.overrideSettings({ standardMaterials: !low });
      const group = new THREE.Group();
      buildFreeholdDressing(
        group,
        {
          ...layout,
          decor: ['bed', 'hearth', 'strongbox', 'plinth_1', 'entry_door', 'station_reserved'].map(
            (key) => ({ key, x: 0, z: 0, yaw: 0 }),
          ),
        },
        low,
      );
      const expected = {
        bed: [2.6, 1.5, 4.2],
        hearth: [3.2, 3.2, 1.4],
        plinth: [1.2, 0.02, 1.2],
        entry_door: [2.4, 3.2, 0.12],
      };
      for (const [kind, size] of Object.entries(expected)) {
        const box = kindBounds(group, kind);
        const actual = box.getSize(new THREE.Vector3()).toArray();
        actual.forEach((value, i) => {
          expect(value).toBeCloseTo(size[i], 5);
        });
        expect(box.min.y).toBeCloseTo(DUNGEON_FLOOR_Y, 5);
      }
      expect(
        group.children.every(
          (o) => !['freehold-station_reserved', 'freehold-strongbox'].includes(o.name),
        ),
      ).toBe(true);
      expect(group.children.length).toBeLessThan(20);
      group.traverse((obj) => expect((obj as THREE.Light).isLight).not.toBe(true));
    },
  );

  it('applies authored yaw, scale and origin without modifying the shared source', () => {
    const first = new THREE.Group();
    const second = new THREE.Group();
    buildFreeholdDressing(
      first,
      { ...layout, decor: [{ key: 'bed', x: 10, z: 20, yaw: Math.PI / 2, scale: 2 }] },
      true,
    );
    buildFreeholdDressing(second, { ...layout, decor: [{ key: 'bed', x: 0, z: 0, yaw: 0 }] }, true);
    const large = kindBounds(first, 'bed');
    expect(large.getCenter(new THREE.Vector3()).x).toBeCloseTo(10);
    expect(large.getCenter(new THREE.Vector3()).z).toBeCloseTo(20);
    expect(large.getSize(new THREE.Vector3()).x).toBeCloseTo(8.4);
    expect(kindBounds(second, 'bed').getSize(new THREE.Vector3()).x).toBeCloseTo(2.6);
  });

  it('retains shared prepared geometry across prewarm roots', () => {
    const a = buildFreeholdPrewarmGroup(true);
    const b = buildFreeholdPrewarmGroup(true);
    expect(a.children.length).toBeGreaterThan(3);
    a.children.forEach((child, i) => {
      expect((child as THREE.Mesh).geometry).toBe((b.children[i] as THREE.Mesh).geometry);
      expect((child as THREE.Mesh).material).toBe((b.children[i] as THREE.Mesh).material);
    });
  });
});
