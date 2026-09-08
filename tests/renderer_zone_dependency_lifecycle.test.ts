import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  dependencies: vi.fn(),
  mob: vi.fn(),
  npc: vi.fn(),
  object: vi.fn(),
  bootIds: [] as string[],
  yieldEntries: false,
}));
vi.mock('../src/render/zone_character_dependencies', () => ({
  prepareZoneCharacterDependencies: hooks.dependencies,
}));
vi.mock('../src/render/zone_prewarm_groups', async (original) => ({
  ...(await original<typeof import('../src/render/zone_prewarm_groups')>()),
  buildEntityPrewarmGroup: hooks.mob,
  buildNpcPrewarmGroup: hooks.npc,
  buildObjectPrewarmGroup: hooks.object,
}));

vi.mock('../src/render/prewarm_policy', async (original) => {
  const actual = await original<typeof import('../src/render/prewarm_policy')>();
  return {
    ...actual,
    orderedPrewarmIds: () => hooks.bootIds,
    prewarmEntryRuns: (id: string) => id !== 'sky.nearby-biomes',
    resolvePrewarmPolicy: (...args: Parameters<typeof actual.resolvePrewarmPolicy>) => ({
      ...actual.resolvePrewarmPolicy(...args),
      yieldBetweenEntries: hooks.yieldEntries,
      linkPassPerEntry: true,
    }),
  };
});

import { Renderer } from '../src/render/renderer';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function harness() {
  const renderer = Object.assign(
    Object.create(Renderer.prototype) as Pick<
      Renderer,
      'prewarmZoneAt' | 'prewarmInitialScene' | 'shutdown'
    >,
    {
      shutdownStarted: false,
      lifecycleGeneration: 7,
      shutdownTask: null,
      pendingZonePrewarms: new Map(),
      pendingZonePrepares: new Map(),
      textureUploadTaskSet: new Set(),
      prewarmedZonePrograms: new Set(),
      zoneIdAt: () => 'test-zone',
      zonePrewarmHost: () => ({}),
      scene: { add: vi.fn(), remove: vi.fn() },
      pooledVisuals: { store: vi.fn() },
      webgl: { getContext: () => ({}), info: { programs: [], memory: { textures: 0 } } },
      canvas: { removeEventListener: vi.fn() },
      backgroundGpuWork: { shutdown: vi.fn().mockResolvedValue(undefined) },
      resizeTimers: [],
      devProbeTimer: null,
      devProbeBindings: null,
      disposeRendererResources: vi.fn(),
      renderPrewarmPass: vi.fn(),
      compilePrewarmColorPrograms: vi.fn(),
      lastZonePrewarmStats: undefined,
      asyncCompileSupported: true,
      installSceneryRevealGates: vi.fn(),
      templateIdsInZone: () => [],
      sim: {
        player: { pos: { x: 0, z: 0 } },
        cfg: {},
        ownedMounts: () => [],
        accountCosmetics: { mountSkinIds: [] },
      },
      vfx: { clear: vi.fn() },
      abilityVfxFx: { clear: vi.fn() },
      needleOfFateVfx: { clear: vi.fn() },
      sentenceVfx: { clear: vi.fn() },
      weather: { endPrewarm: vi.fn() },
    },
  );
  vi.stubGlobal('window', { removeEventListener: vi.fn() });
  vi.stubGlobal('document', { removeEventListener: vi.fn() });
  vi.stubGlobal('location', { search: '' });
  return renderer;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  hooks.yieldEntries = false;
});

describe('renderer zone dependency lifetime', () => {
  it.each(['entities.mob-archetypes', 'entities.npc-archetypes'])(
    'aborts the real boot manifest after retirement during %s',
    async (id) => {
      hooks.bootIds = [id, 'objects.quest-archetypes'];
      const wait = deferred();
      hooks.dependencies.mockReturnValue(wait.promise);
      const renderer = harness();
      const started: string[] = [];
      const task = renderer.prewarmInitialScene({ onEntryStart: (entry) => started.push(entry) });
      const rejection = expect(task).rejects.toThrow('prewarm cancelled');
      await vi.waitFor(() => expect(hooks.dependencies).toHaveBeenCalled());
      await renderer.shutdown();
      wait.resolve();
      await rejection;
      expect(started).toEqual([id]);
      expect(hooks.mob).not.toHaveBeenCalled();
      expect(hooks.npc).not.toHaveBeenCalled();
      expect(hooks.object).not.toHaveBeenCalled();
      expect(renderer.scene.add).not.toHaveBeenCalled();
      expect(renderer.renderPrewarmPass).not.toHaveBeenCalled();
      expect(renderer.pooledVisuals.store).not.toHaveBeenCalled();
    },
  );

  it('does not start another boot entry when shutdown occurs during the event-loop yield', async () => {
    hooks.bootIds = ['entities.mob-archetypes'];
    hooks.yieldEntries = true;
    const renderer = harness();
    const task = renderer.prewarmInitialScene();
    const rejection = expect(task).rejects.toThrow('prewarm cancelled');
    await renderer.shutdown();
    await rejection;
    expect(hooks.dependencies).not.toHaveBeenCalled();
    expect(hooks.mob).not.toHaveBeenCalled();
    expect(renderer.renderPrewarmPass).not.toHaveBeenCalled();
  });

  it('rejects delayed asset completion after shutdown without building, attaching or publishing', async () => {
    const wait = deferred();
    hooks.dependencies.mockReturnValue(wait.promise);
    const renderer = harness();
    const task = renderer.prewarmZoneAt(0, 0);
    const rejection = expect(task).rejects.toThrow('prewarm cancelled');
    const shutdown = renderer.shutdown();
    wait.resolve();
    await rejection;
    await shutdown;
    expect(hooks.mob).not.toHaveBeenCalled();
    expect(hooks.npc).not.toHaveBeenCalled();
    expect(renderer.scene.add).not.toHaveBeenCalled();
    expect(renderer.renderPrewarmPass).not.toHaveBeenCalled();
    expect(renderer.pooledVisuals.store).not.toHaveBeenCalled();
    expect(renderer.prewarmedZonePrograms.size).toBe(0);
    expect(renderer.pendingZonePrewarms.size).toBe(0);
    expect(renderer.disposeRendererResources).toHaveBeenCalledOnce();
  });

  it('warms and publishes both pools when dependencies finish in the current generation', async () => {
    hooks.dependencies.mockResolvedValue(undefined);
    const visuals = [{ dispose: vi.fn() }, { dispose: vi.fn() }];
    hooks.mob.mockReturnValue({
      group: new THREE.Group(),
      pooled: [{ key: 'mob', visual: visuals[0] }],
    });
    hooks.npc.mockReturnValue({
      group: new THREE.Group(),
      pooled: [{ key: 'npc', visual: visuals[1] }],
    });
    const renderer = harness();
    renderer.compilePrewarmColorPrograms.mockResolvedValue(undefined);
    await renderer.prewarmZoneAt(0, 0);
    expect(renderer.scene.add).toHaveBeenCalledOnce();
    expect(renderer.pooledVisuals.store.mock.calls).toEqual([
      ['mob', visuals[0]],
      ['npc', visuals[1]],
    ]);
    for (const visual of visuals) expect(visual.dispose).not.toHaveBeenCalled();
    expect(renderer.prewarmedZonePrograms.has('test-zone')).toBe(true);
    expect(renderer.lastZonePrewarmStats).toMatchObject({ zoneId: 'test-zone' });
  });

  it('disposes staged visuals instead of returning them to a retired pool after delayed compile', async () => {
    hooks.dependencies.mockResolvedValue(undefined);
    const visuals = [{ dispose: vi.fn() }, { dispose: vi.fn() }];
    hooks.mob.mockReturnValue({
      group: new THREE.Group(),
      pooled: [{ key: 'mob', visual: visuals[0] }],
    });
    hooks.npc.mockReturnValue({
      group: new THREE.Group(),
      pooled: [{ key: 'npc', visual: visuals[1] }],
    });
    const wait = deferred();
    const renderer = harness();
    renderer.compilePrewarmColorPrograms = vi.fn().mockReturnValue(wait.promise);
    const task = renderer.prewarmZoneAt(0, 0);
    const rejection = expect(task).rejects.toThrow('prewarm cancelled');
    await vi.waitFor(() => expect(renderer.compilePrewarmColorPrograms).toHaveBeenCalledOnce());
    const shutdown = renderer.shutdown();
    wait.resolve();
    await rejection;
    await shutdown;
    expect(renderer.pooledVisuals.store).not.toHaveBeenCalled();
    for (const visual of visuals) expect(visual.dispose).toHaveBeenCalledOnce();
    expect(renderer.prewarmedZonePrograms.size).toBe(0);
    expect(renderer.lastZonePrewarmStats).toBeUndefined();
  });
});
