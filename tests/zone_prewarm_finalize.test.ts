import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CharacterVisual } from '../src/render/characters';
import { finalizeZonePrewarm } from '../src/render/zone_prewarm_finalize';

afterEach(() => vi.restoreAllMocks());

describe('zone prewarm finalization', () => {
  it.each([false, true])(
    'detaches staged roots and honors retirement=%s for pools and stats',
    (retired) => {
      vi.spyOn(performance, 'now').mockReturnValue(150);
      const scene = new THREE.Scene();
      const visuals = [{ dispose: vi.fn() }, { dispose: vi.fn() }];
      const groups = visuals.map((visual, index) => {
        const group = new THREE.Group();
        scene.add(group);
        return {
          group,
          pooled: [{ key: `rig-${index}`, visual: visual as unknown as CharacterVisual }],
        };
      });
      const store = vi.fn(() => {
        for (const { group } of groups) expect(group.parent).toBeNull();
      });
      const owner = {
        shutdownStarted: false,
        lifecycleGeneration: retired ? 8 : 7,
        pooledVisuals: { store },
        lastZonePrewarmStats: null,
      };
      finalizeZonePrewarm(owner, 7, groups, 'zone', { started: 100, built: 110, compiled: 130 });
      expect(scene.children).toHaveLength(0);
      if (retired) {
        expect(store).not.toHaveBeenCalled();
        expect(owner.lastZonePrewarmStats).toBeNull();
        for (const visual of visuals) expect(visual.dispose).toHaveBeenCalledOnce();
      } else {
        expect(store.mock.calls).toEqual([
          ['rig-0', visuals[0]],
          ['rig-1', visuals[1]],
        ]);
        expect(owner.lastZonePrewarmStats).toEqual({
          zoneId: 'zone',
          buildMs: 10,
          compileMs: 20,
          passMs: 20,
        });
        for (const visual of visuals) expect(visual.dispose).not.toHaveBeenCalled();
      }
    },
  );
});
