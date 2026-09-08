import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { buildDoorBody, buildStaticDoorBody } from '../src/render/door_portal';
import { buildGroundObjectView } from '../src/render/ground_object';
import type { Entity } from '../src/sim/types';

vi.mock('../src/render/textures', () => ({ sparkleTexture: () => new THREE.Texture() }));
vi.mock('../src/render/quest_objects', () => ({
  buildGroundQuestObject: () => ({ group: new THREE.Group(), height: 1.5 }),
}));

const entity = (templateId: string, itemId: string | null = null) =>
  ({
    id: 7,
    kind: 'object',
    templateId,
    objectItemId: itemId,
  }) as Entity;
const host = () => ({
  objectPool: new Map<string, { group: THREE.Group; height: number }[]>(),
  pooledObjectCount: 0,
  lowGfx: true,
  sparkleMat: null as THREE.SpriteMaterial | null,
});

describe('generic ground-object render adapter', () => {
  it('gives the home gate visible stone with no item sparkle or light', () => {
    const h = host();
    const result = buildGroundObjectView(h, entity('freehold_gate'));
    expect(result.objectPoolKey).toBeNull();
    expect(result.sparkle).toBeUndefined();
    expect(h.sparkleMat).toBeNull();
    let meshes = 0;
    result.body.traverse((object) => {
      expect((object as THREE.Light).isLight).not.toBe(true);
      expect((object as THREE.Sprite).isSprite).not.toBe(true);
      if ((object as THREE.Mesh).isMesh && object.visible) meshes++;
    });
    expect(meshes).toBeGreaterThan(0);
    const prewarm = buildStaticDoorBody();
    expect((prewarm.children[0] as THREE.Mesh).material).toBe(
      (result.body.children[0] as THREE.Mesh).material,
    );
  });

  it.each(['freehold_inn_room', 'freehold_cottage'])(
    'uses the authored closed door for %s exits',
    (id) => {
      const { body, portal } = buildDoorBody(false, id, true);
      expect(portal).toBeUndefined();
      expect(body.children).toHaveLength(1);
      expect(body.children[0].visible).toBe(false);
      expect(body.children[0].position.z).toBe(-0.9);
    },
  );

  it('preserves ordinary item pool accounting and shared sparkle reuse', () => {
    const h = host();
    const group = new THREE.Group();
    h.objectPool.set('object:supply_crate', [{ group, height: 2 }]);
    h.pooledObjectCount = 1;
    const result = buildGroundObjectView(h, entity('ground_supply_crate', 'supply_crate'));
    expect(result.body).toBe(group);
    expect(result.objectPoolKey).toBe('object:supply_crate');
    expect(h.pooledObjectCount).toBe(0);
    expect(result.sparkle?.material).toBe(h.sparkleMat);
    const next = buildGroundObjectView(h, entity('ground_supply_crate', 'supply_crate'));
    expect(next.objectPoolKey).toBe('object:supply_crate');
    expect(next.sparkle?.material).toBe(result.sparkle?.material);
  });
});
