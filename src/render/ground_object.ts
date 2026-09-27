import * as THREE from 'three';
import type { Entity } from '../sim/types';
import { buildStaticDoorBody } from './door_portal';
import { groundQuestObjectYaw } from './farshore_salvage_assets';
import {
  groundObjectPoolKey,
  type PooledObjectView,
  takeOrBuildGroundObject,
} from './ground_object_pool';
import { buildGroundQuestObject } from './quest_objects';
import { markSharedMaterial } from './shared_resource';
import { sparkleTexture } from './textures';

interface GroundObjectViewHost {
  objectPool: Map<string, PooledObjectView[]>;
  pooledObjectCount: number;
  lowGfx: boolean;
  sparkleMat: THREE.SpriteMaterial | null;
}

/** Generic-object view construction, with the renderer's existing pool and shared sparkle. */
export function buildGroundObjectView(
  host: object,
  entity: Entity,
): {
  body: THREE.Group;
  height: number;
  objectPoolKey: string | null;
  sparkle?: THREE.Sprite;
} {
  if (entity.templateId === 'freehold_gate') {
    return { body: buildStaticDoorBody(), height: 4.6, objectPoolKey: null };
  }
  const h = host as GroundObjectViewHost;
  const result = takeOrBuildGroundObject(h.objectPool, groundObjectPoolKey(entity), () =>
    buildGroundQuestObject(entity.objectItemId ?? '', entity.id),
  );
  if (result.reused) h.pooledObjectCount = Math.max(0, h.pooledObjectCount - 1);
  const body = result.object.group;
  if (result.reused) body.rotation.y = groundQuestObjectYaw(entity.objectItemId ?? '', entity.id);
  // Forge stations are workbenches, not pickups: no gold glint over them.
  if (entity.objectItemId?.startsWith('forge_')) {
    return { body, height: result.object.height, objectPoolKey: result.poolKey };
  }
  if (!h.sparkleMat) {
    h.sparkleMat = markSharedMaterial(
      new THREE.SpriteMaterial({
        map: sparkleTexture(),
        transparent: true,
        depthWrite: false,
      }),
    );
    if (!h.lowGfx) h.sparkleMat.color.setScalar(1.5);
  }
  const sparkle = new THREE.Sprite(h.sparkleMat);
  sparkle.scale.set(0.9, 0.9, 1);
  sparkle.position.y = 1.35;
  return { body, height: result.object.height, objectPoolKey: result.poolKey, sparkle };
}
