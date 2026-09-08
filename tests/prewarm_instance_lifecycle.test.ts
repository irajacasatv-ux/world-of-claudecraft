import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { buildFreeholdPrewarmGroup } from '../src/render/freehold';
import { PrewarmInstanceLifecycle } from '../src/render/prewarm_instance_lifecycle';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const done = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { done, resolve, reject };
}

describe('temporary prewarm instance ownership', () => {
  it.each(['resolve', 'reject'] as const)(
    'retains all handles through submitted and resumed users that %s, then disposes once',
    async (outcome) => {
      const owner = new PrewarmInstanceLifecycle();
      const root = new THREE.Group();
      root.add(buildFreeholdPrewarmGroup(true));
      const instances: ReturnType<typeof vi.fn>[] = [];
      const assets = new Set<THREE.BufferGeometry | THREE.Material>();
      root.traverse((object) => {
        const mesh = object as THREE.InstancedMesh;
        if (!mesh.isInstancedMesh) return;
        instances.push(vi.spyOn(mesh, 'dispose'));
        assets.add(mesh.geometry);
        for (const material of [mesh.material].flat()) assets.add(material);
      });
      const sharedDisposals = [...assets].map((asset) => vi.spyOn(asset, 'dispose'));
      owner.track(root);
      owner.track(root);
      const compile = deferred();
      const upload = deferred();
      const resume = deferred();
      const disposal = owner.disposeAfter([compile, upload], resume.done);
      expect(owner.disposeAfter([compile, upload], resume.done)).toBe(disposal);
      compile.resolve();
      await Promise.resolve();
      for (const dispose of instances) expect(dispose).not.toHaveBeenCalled();
      upload.resolve();
      await Promise.resolve();
      for (const dispose of instances) expect(dispose).not.toHaveBeenCalled();
      if (outcome === 'reject') resume.reject(new Error('renderer retired'));
      else resume.resolve();
      await disposal;
      expect(instances.length).toBeGreaterThan(3);
      for (const dispose of instances) expect(dispose).toHaveBeenCalledOnce();
      for (const dispose of sharedDisposals) expect(dispose).not.toHaveBeenCalled();
      const next = buildFreeholdPrewarmGroup(true);
      expect((next.children[0] as THREE.Mesh).geometry).toBe(
        (root.children[0].children[0] as THREE.Mesh).geometry,
      );
      vi.restoreAllMocks();
    },
  );
});
