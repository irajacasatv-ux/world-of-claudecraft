import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getBounds, NodeIO, Primitive } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { beforeAll, describe, expect, it } from 'vitest';
import { MEDIA_ASSETS } from '../src/render/assets/manifest.generated';

// Reviewed Blender reductions, shipped with meshopt and 512px KTX2 textures.
// Bounds are pinned to release/v0.44.0, not computed from the replacement.
const ASSETS = [
  {
    file: 'quest/supply_crate',
    triangles: 2311,
    byteCap: 330000,
    min: [-0.949722, -0.663891, -0.605672],
    max: [0.947787, 0.665588, 0.603818],
    normal: true,
    textures: [
      '5c5fcb2c54e104f24d5e7813b00b0ccc3eb055aced2286ca8e6f2142bd75e3b9',
      '87283a4934ba4dc8121cd4c0f0bff40e2aa7ccad3e8737cf913a2b5ed9bf0742',
    ],
  },
  {
    file: 'quest/weathered_ledger_page',
    triangles: 4413,
    byteCap: 110000,
    min: [-0.950768, -0.61745, -0.145558],
    max: [0.947218, 0.619452, 0.141048],
    normal: false,
    textures: ['df21b4cca017258c4258dfc9d85d1933082e180f79be6d6c1b17d641f2262433'],
  },
  {
    file: 'quest/gravecaller_sigil',
    triangles: 4364,
    byteCap: 125000,
    min: [-0.721574, -0.950755, -0.720308],
    max: [0.718498, 0.948646, 0.716518],
    normal: false,
    textures: ['6a6096f9b265af6ffd77e6df8b93df81f7fbf09a28d77280ed2d17c46a58f872'],
  },
  {
    file: 'foliage/dead_1',
    triangles: 3249,
    byteCap: 350000,
    min: [-2.592215, -0.335555, -2.903571],
    max: [3.556503, 9.159923, 2.845239],
    normal: true,
    textures: null,
  },
  {
    file: 'foliage/dead_2',
    triangles: 3625,
    byteCap: 350000,
    min: [-2.332279, -0.335555, -2.52305],
    max: [4.397209, 11.152677, 3.855834],
    normal: true,
    textures: null,
  },
  {
    file: 'foliage/dead_3',
    triangles: 3544,
    byteCap: 350000,
    min: [-3.84773, -0.335555, -3.386694],
    max: [2.540165, 12.944831, 3.043352],
    normal: true,
    textures: null,
  },
];
const BARK_TEXTURES = [
  '65caf15e19881821b1820fa11d97b7291dc2ae9ffeca569a94e92444b270579f',
  '6ccc6e5ee5eaaf8fa9f77892129b166bdf00054630d25828aae9e09a64e7f1ab',
];
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

beforeAll(async () => {
  await MeshoptDecoder.ready;
});

describe('Eastbrook and Tutorial Island optimized shipping assets', () => {
  it.each(ASSETS)(
    '$file preserves its reviewed geometry, shading and cache identity',
    async (asset) => {
      const rel = `models/${asset.file}.glb`;
      const file = path.join(__dirname, '..', 'public', rel);
      const bytes = readFileSync(file);
      expect(bytes.length).toBeLessThanOrEqual(asset.byteCap);
      expect(MEDIA_ASSETS[rel]).toBe(
        `/media/models/${asset.file}.${sha256(bytes).slice(0, 12)}.glb`,
      );
      const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
      expect(json.extensionsRequired).toEqual(
        expect.arrayContaining(['EXT_meshopt_compression', 'KHR_texture_basisu']),
      );
      expect(json.extensionsUsed).not.toContain('KHR_draco_mesh_compression');

      const doc = await io.read(file);
      const root = doc.getRoot();
      expect(root.listSkins()).toHaveLength(0);
      expect(root.listAnimations()).toHaveLength(0);
      expect(root.listMeshes()).toHaveLength(1);
      const primitives = root.listMeshes()[0].listPrimitives();
      expect(primitives).toHaveLength(1);
      const primitive = primitives[0];
      expect(primitive.getMode()).toBe(Primitive.Mode.TRIANGLES);
      const positions = primitive.getAttribute('POSITION');
      const indices = primitive.getIndices();
      assert(positions && indices);
      const indexArray = indices.getArray();
      assert(indexArray);
      expect(indices.getCount() / 3).toBe(asset.triangles);
      expect(Array.from(indexArray).every((i) => i >= 0 && i < positions.getCount())).toBe(true);
      for (const semantic of ['NORMAL', 'TEXCOORD_0']) {
        expect(primitive.getAttribute(semantic)?.getCount()).toBe(positions.getCount());
      }
      for (const semantic of primitive.listSemantics()) {
        const array = primitive.getAttribute(semantic)?.getArray();
        assert(array);
        expect(Array.from(array).every(Number.isFinite)).toBe(true);
      }
      expect(root.listScenes()).toHaveLength(1);
      const bounds = getBounds(root.listScenes()[0]);
      for (const bound of ['min', 'max'] as const) {
        asset[bound].forEach((value, axis) => {
          expect(Math.abs(bounds[bound][axis] - value)).toBeLessThan(0.002);
        });
      }

      const material = primitive.getMaterial();
      assert(material);
      expect(material.getBaseColorTexture()).not.toBeNull();
      expect(!!material.getNormalTexture()).toBe(asset.normal);
      expect(material.getDoubleSided()).toBe(true);
      expect(material.getMetallicFactor()).toBe(0);
      if (asset.file.startsWith('foliage/')) {
        expect(material.getName()).toBe('Bark_DeadTree');
        expect(material.getRoughnessFactor()).toBe(1);
        expect(primitive.getAttribute('COLOR_0')?.getCount()).toBe(positions.getCount());
      } else {
        expect(material.getRoughnessFactor()).toBe(0.8);
      }
      const textureHashes = root.listTextures().map((texture) => {
        expect(texture.getMimeType()).toBe('image/ktx2');
        expect(texture.getSize()).toEqual([512, 512]);
        const image = texture.getImage();
        assert(image);
        expect(Buffer.from(image).readUInt32LE(40)).toBe(10);
        return sha256(image);
      });
      // Five models reuse their original compressed images byte-for-byte. Only
      // the retopologized crate has a new color bake and tangent-space normal map.
      expect(textureHashes.sort()).toEqual([...(asset.textures ?? BARK_TEXTURES)].sort());
    },
  );
});
