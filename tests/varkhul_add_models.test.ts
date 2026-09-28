import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NodeIO, Primitive } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { describe, expect, it } from 'vitest';
import { MEDIA_ASSETS } from '../src/render/assets/manifest.generated';
import { manifestUrls } from '../src/render/characters/manifest';

const REPO_ROOT = path.join(__dirname, '..');

const MODELS = [
  {
    name: 'Crucible Warden',
    file: 'crucible_warden.glb',
    maxBytes: 1_600_000,
    clips: ['Attack', 'Death', 'Hit', 'Idle', 'JumpSlam', 'Run', 'Walk'],
  },
  {
    name: 'Ember Sentinel',
    file: 'ember_sentinel.glb',
    maxBytes: 1_600_000,
    clips: ['Attack', 'Death', 'Hit', 'Idle', 'Run', 'Walk'],
  },
  {
    name: 'Cinder Artificer',
    file: 'cinder_artificer.glb',
    maxBytes: 1_600_000,
    clips: [
      'Attack',
      'Channel',
      'ChannelEnd',
      'ChannelStart',
      'Death',
      'Hit',
      'Idle',
      'Run',
      'Walk',
    ],
  },
] as const;

describe('Varkhul add models', () => {
  it.each(MODELS)('ships $name as a bounded, animated automa rig', async (model) => {
    await MeshoptDecoder.ready;
    const relativePath = `models/creatures/${model.file}`;
    const bytes = readFileSync(path.join(REPO_ROOT, 'public', relativePath));
    expect(bytes.byteLength).toBeLessThan(model.maxBytes);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    expect(MEDIA_ASSETS[relativePath]).toBe(
      `/media/models/creatures/${model.file.replace(/\.glb$/, '')}.${sha256.slice(0, 12)}.glb`,
    );
    expect(manifestUrls()).toContain(relativePath);

    const root = (
      await new NodeIO()
        .registerExtensions(ALL_EXTENSIONS)
        .registerDependencies({ 'meshopt.decoder': MeshoptDecoder })
        .readBinary(bytes)
    ).getRoot();
    expect(
      root
        .listExtensionsRequired()
        .map((extension) => extension.extensionName)
        .sort(),
    ).toEqual(['EXT_meshopt_compression', 'KHR_mesh_quantization', 'KHR_texture_basisu']);
    expect(root.listSkins()).toHaveLength(1);
    expect(root.listSkins()[0].listJoints()).toHaveLength(22);
    expect(root.listNodes().filter((node) => node.getMesh() && node.getSkin())).toHaveLength(1);
    expect(root.listTextures()).toHaveLength(1);
    expect(root.listTextures()[0].getMimeType()).toBe('image/ktx2');
    expect(root.listTextures()[0].getSize()).toEqual([1024, 1024]);
    expect(
      root
        .listAnimations()
        .map((animation) => animation.getName())
        .sort(),
    ).toEqual([...model.clips].sort());
    for (const animation of root.listAnimations()) {
      if (animation.getName() === 'Idle') continue;
      let maxPoseDelta = 0;
      for (const sampler of animation.listSamplers()) {
        const times = sampler.getInput()?.getArray() ?? [];
        const values = sampler.getOutput()?.getArray() ?? [];
        if (times.length < 2 || values.length === 0) continue;
        const stride = values.length / times.length;
        for (let offset = stride; offset < values.length; offset += stride) {
          for (let component = 0; component < stride; component++) {
            maxPoseDelta = Math.max(
              maxPoseDelta,
              Math.abs(Number(values[offset + component]) - Number(values[component])),
            );
          }
        }
      }
      expect(maxPoseDelta, `${animation.getName()} must contain pose motion`).toBeGreaterThan(0.01);
    }

    const primitives = root.listMeshes().flatMap((mesh) => mesh.listPrimitives());
    expect(primitives).toHaveLength(1);
    expect(primitives[0].getMode()).toBe(Primitive.Mode.TRIANGLES);
    expect(primitives[0].listSemantics().sort()).toEqual([
      'JOINTS_0',
      'NORMAL',
      'POSITION',
      'TEXCOORD_0',
      'WEIGHTS_0',
    ]);
    const vertexCount = primitives[0].getAttribute('POSITION')?.getCount() ?? 0;
    expect((primitives[0].getIndices()?.getCount() ?? vertexCount) / 3).toBeLessThanOrEqual(6_500);
  });
});
