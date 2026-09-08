import type * as THREE from 'three';
import { OwnedInteriorResourceRegistry } from './interior_resource_lifecycle';

/** Temporary instance buffers have an owner independent of their shared warm materials. */
export class PrewarmInstanceLifecycle {
  private readonly resources = new OwnedInteriorResourceRegistry();
  private completion: Promise<void> | null = null;

  track(group: THREE.Object3D): void {
    group.traverse((object) => {
      const mesh = object as THREE.InstancedMesh;
      if (mesh.isInstancedMesh) this.resources.add(mesh);
    });
  }

  /** Call only once the manifest has fixed every submitted and resumed user. */
  disposeAfter(
    submitted: readonly { done: Promise<unknown> }[],
    resume?: Promise<unknown>,
  ): Promise<void> {
    this.completion ??= Promise.allSettled([...submitted.map((unit) => unit.done), resume]).then(
      () => {
        const report = this.resources.dispose();
        for (const error of report.errors) console.warn('Prewarm instance disposal failed', error);
      },
    );
    return this.completion;
  }
}
