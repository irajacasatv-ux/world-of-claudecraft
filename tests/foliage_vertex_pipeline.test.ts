import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  FOLIAGE_TOWN_TREE_ASSETS,
  optimizeFoliageVertexDocument,
  primitiveTriangleAttributeFingerprint,
  triangleAttributeFingerprint,
} from '../scripts/assets/foliage_vertex_pipeline.mjs';
import { MEDIA_ASSETS } from '../src/render/assets/manifest.generated';

const ROOT = path.join(__dirname, '..');
const EXPECTED_ASSETS = [
  {
    path: 'models/foliage/pine_1.glb',
    semanticSha256: '7e8cd6701560a75be570e59683ef37d985b7a2d28e66fc25a35ec68217f85b0b',
    vertices: 2_963,
    triangles: 3_864,
  },
  {
    path: 'models/foliage/pine_2.glb',
    semanticSha256: 'eb3e27dde17f382bd5896b407e2b69121be0d11e525dcadaf0afba0c673d077e',
    vertices: 2_872,
    triangles: 3_586,
  },
  {
    path: 'models/foliage/pine_4.glb',
    semanticSha256: 'f352d2dca2d347a36b95490f929cc5bdd7752a32b93fe38084c0d62e233a7755',
    vertices: 2_896,
    triangles: 3_267,
  },
  {
    path: 'models/foliage/pine_5.glb',
    semanticSha256: 'cb2a39dffda97cfcefed51b9cdf5d6d7cf714099aeacf13767ad981ebc118f4f',
    vertices: 1_552,
    triangles: 1_558,
  },
  {
    path: 'models/foliage/oak_1.glb',
    semanticSha256: '0339cafbc34ad4eec07dfc3ab4ca8d5880b6e3aec5409f736630bf4bdd53a1c3',
    vertices: 6_661,
    triangles: 6_211,
  },
  {
    path: 'models/foliage/oak_2.glb',
    semanticSha256: '63cd03dfe2e01ee339bca0b908d76b5acdf0865027785544f35b2fa15ebeba7f',
    vertices: 5_388,
    triangles: 5_580,
  },
  {
    path: 'models/foliage/oak_3.glb',
    semanticSha256: '580229329f70929a66467d82fe4c6b504cf379eb22ce8ae7eca2234790d28c18',
    vertices: 4_438,
    triangles: 3_351,
  },
  {
    path: 'models/foliage/oak_4.glb',
    semanticSha256: 'fa170cdea2c695e102bdd18e136a0212a95a8e47c810eb51a8f2ec7c447d5294',
    vertices: 3_578,
    triangles: 3_984,
  },
  {
    path: 'models/foliage/oak_5.glb',
    semanticSha256: 'fa9ca9875ba24546cafe6dc9150e0f0d4ac140d839697d63fd7dce42bf44dd4e',
    vertices: 3_746,
    triangles: 3_140,
  },
] as const;

function vertexKey(
  primitive: ReturnType<Document['createPrimitive']>,
  vertexIndex: number,
): string {
  return primitive
    .listSemantics()
    .sort()
    .map((semantic) => {
      const accessor = primitive.getAttribute(semantic);
      if (!accessor) throw new Error(`missing ${semantic}`);
      const array = accessor.getArray();
      if (!array) throw new Error(`${semantic} has no array`);
      const byteLength = accessor.getElementSize() * array.BYTES_PER_ELEMENT;
      const byteOffset = array.byteOffset + vertexIndex * byteLength;
      const bytes = Buffer.from(array.buffer, byteOffset, byteLength).toString('hex');
      return `${semantic}:${accessor.getComponentType()}:${accessor.getNormalized()}:${bytes}`;
    })
    .join('|');
}

describe('foliage vertex pipeline', () => {
  let io: NodeIO;

  beforeAll(async () => {
    await MeshoptDecoder.ready;
    await MeshoptEncoder.ready;
    io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    });
  });

  it('preserves triangle winding and every corner attribute bit while welding', async () => {
    const document = new Document();
    const buffer = document.createBuffer();
    const position = document
      .createAccessor('position')
      .setType('VEC3')
      .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]))
      .setBuffer(buffer);
    const normal = document
      .createAccessor('normal')
      .setType('VEC3')
      .setNormalized(true)
      .setArray(new Int8Array([0, 127, 0, 0, 127, 0, 0, 127, 0, 0, 127, 0, 0, 127, 0, 0, 127, 0]))
      .setBuffer(buffer);
    const indices = document
      .createAccessor('indices')
      .setType('SCALAR')
      .setArray(new Uint16Array([0, 1, 2, 3, 4, 5]))
      .setBuffer(buffer);
    const primitive = document
      .createPrimitive()
      .setAttribute('POSITION', position)
      .setAttribute('NORMAL', normal)
      .setIndices(indices);
    document.createMesh().addPrimitive(primitive);

    const before = triangleAttributeFingerprint(document);
    await optimizeFoliageVertexDocument(document, MeshoptEncoder);

    expect(triangleAttributeFingerprint(document)).toBe(before);
    expect(primitive.getAttribute('POSITION')?.getCount()).toBe(4);
    expect(primitive.getIndices()?.getArray()).toBeInstanceOf(Uint16Array);
  });

  it('fingerprints one primitive by its winding and corner bytes, not by corner rotation', async () => {
    const document = await io.read(path.join(ROOT, 'public', 'models/foliage/pine_1.glb'));
    const leaves = document
      .getRoot()
      .listMeshes()
      .flatMap((mesh) => mesh.listPrimitives())
      .filter((primitive) => primitive.getMaterial()?.getName() === 'Leaves_Pine');
    expect(leaves).toHaveLength(1);
    const [leaf] = leaves;
    const pinned = '86806ac7e1b8d5678cbd34de5c462c9dacf7d16dce5718f5efacd75b4e2ffbad';
    expect(primitiveTriangleAttributeFingerprint(leaf)).toBe(pinned);

    const indices = leaf.getIndices();
    const original = indices?.getArray()?.slice();
    if (!indices || !original) throw new Error('Leaves_Pine is not indexed');
    const [a, b, c] = original;
    expect(new Set([a, b, c]).size).toBe(3);
    const withFirstTriangle = (corners: readonly number[]) => {
      const edited = original.slice();
      edited.set(corners);
      indices.setArray(edited);
      return primitiveTriangleAttributeFingerprint(leaf);
    };
    expect(withFirstTriangle([b, c, a])).toBe(pinned);
    expect(withFirstTriangle([c, a, b])).toBe(pinned);
    expect(withFirstTriangle([a, c, b])).not.toBe(pinned);
    indices.setArray(original);
    expect(primitiveTriangleAttributeFingerprint(leaf)).toBe(pinned);

    for (const semantic of leaf.listSemantics()) {
      const accessor = leaf.getAttribute(semantic);
      const array = accessor?.getArray();
      if (!accessor || !array) throw new Error(`missing ${semantic}`);
      const edited = array.slice();
      const byteOffset = a * accessor.getElementSize() * edited.BYTES_PER_ELEMENT;
      new Uint8Array(edited.buffer, edited.byteOffset + byteOffset, 1)[0] ^= 1;
      accessor.setArray(edited);
      expect(primitiveTriangleAttributeFingerprint(leaf), semantic).not.toBe(pinned);
      accessor.setArray(array);
    }
    expect(primitiveTriangleAttributeFingerprint(leaf)).toBe(pinned);
  });

  it('keeps the migration inventory complete and independently pinned', () => {
    expect(
      FOLIAGE_TOWN_TREE_ASSETS.map(({ path: assetPath, semanticSha256 }) => ({
        path: assetPath,
        semanticSha256,
      })),
    ).toEqual(
      EXPECTED_ASSETS.map(({ path: assetPath, semanticSha256 }) => ({
        path: assetPath,
        semanticSha256,
      })),
    );
  });

  it("ties the migration script's output sha256 to the shipped bytes", () => {
    // optimize_foliage_vertices.mjs treats a file whose sha256 is outputSha256
    // as already finalized and throws on any other hash but inputSha256. The
    // shipped file is that finalized output (the pre-migration input is no
    // longer on disk), so a re-export that skips the table re-pin fails here.
    for (const asset of FOLIAGE_TOWN_TREE_ASSETS) {
      const shippedSha256 = createHash('sha256')
        .update(readFileSync(path.join(ROOT, 'public', asset.path)))
        .digest('hex');
      expect(asset.outputSha256, asset.path).toBe(shippedSha256);
    }
  });

  for (const asset of EXPECTED_ASSETS) {
    it(`pins exact welded geometry and the manifest hash for ${asset.path}`, async () => {
      const assetPath = path.join(ROOT, 'public', asset.path);
      const bytes = readFileSync(assetPath);
      const artifactSha256 = createHash('sha256').update(bytes).digest('hex');
      const parsed = path.posix.parse(asset.path);
      expect(MEDIA_ASSETS[asset.path]).toBe(
        path.posix.join(
          '/media',
          parsed.dir,
          `${parsed.name}.${artifactSha256.slice(0, 12)}${parsed.ext}`,
        ),
      );

      const document = await io.read(assetPath);
      expect(triangleAttributeFingerprint(document)).toBe(asset.semanticSha256);

      let vertices = 0;
      let triangles = 0;
      for (const mesh of document.getRoot().listMeshes()) {
        for (const primitive of mesh.listPrimitives()) {
          const position = primitive.getAttribute('POSITION');
          const index = primitive.getIndices();
          expect(position).toBeDefined();
          expect(index).toBeDefined();
          if (!position || !index) continue;
          const indexArray = index.getArray();
          expect(indexArray).toBeInstanceOf(Uint16Array);
          if (!indexArray) continue;
          expect(Math.max(...indexArray)).toBeLessThanOrEqual(65_534);
          vertices += position.getCount();
          triangles += index.getCount() / 3;

          const uniqueVertices = new Set<string>();
          for (let vertex = 0; vertex < position.getCount(); vertex++) {
            uniqueVertices.add(vertexKey(primitive, vertex));
          }
          expect(uniqueVertices.size).toBe(position.getCount());
        }
      }
      expect({ vertices, triangles }).toEqual({
        vertices: asset.vertices,
        triangles: asset.triangles,
      });
    });
  }
});
