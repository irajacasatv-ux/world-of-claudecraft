// Read-only measurement. Redirect stdout to retain the proposed evidence.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NodeIO, Primitive } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { PlaneGeometry } from 'three';
import ts from 'typescript';
import { boundsOf, decorProposal, placementProposal, transformPoint } from './geometry_core.mjs';
import {
  createGeometrySourceSnapshot,
  geometrySourceHash as sha256,
  verifiedRugFactory,
} from './geometry_source.mjs';

const root = new URL('../../', import.meta.url);
const require = createRequire(import.meta.url);
const proposalPath = 'docs/freeholds/content-trial-2026-09-07/geometry-proposal.json';
const snapshot = createGeometrySourceSnapshot((path) => readFileSync(new URL(path, root)));
const source = (path) => snapshot.read(path);
const seal = (path) => snapshot.seal(path);
const inputPaths = [
  proposalPath,
  'scripts/freeholds/geometry_measure.mjs',
  'scripts/freeholds/geometry_core.mjs',
  'scripts/freeholds/geometry_source.mjs',
  'src/render/props.ts',
  'src/render/lastkeep_dressing.ts',
  'src/render/rift_decor.ts',
  'scripts/assets/specs/dungeon.json',
  'scripts/assets/specs/drakelands_castle.json',
  'scripts/assets/specs/asset_bits.json',
  'scripts/assets/battleground/dressing.mjs',
  'CREDITS.md',
  'pnpm-lock.yaml',
];
for (const path of inputPaths) source(path);
const proposal = JSON.parse(source(proposalPath));
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

async function measureGlb(path) {
  const document = await io.readBinary(source(path));
  const assetRoot = document.getRoot();
  const scene = assetRoot.getDefaultScene();
  if (!scene || assetRoot.listSkins().length)
    throw new Error(`Expected a static default scene: ${path}`);
  const points = [];
  const primitives = [];
  const materials = new Set();
  const accessors = new Set();
  scene.traverse((node) => {
    const mesh = node.getMesh();
    if (!mesh) return;
    const matrix = node.getWorldMatrix();
    for (const [index, primitive] of mesh.listPrimitives().entries()) {
      if (primitive.getMode() !== Primitive.Mode.TRIANGLES || primitive.listTargets().length) {
        throw new Error(`Expected rigid triangle geometry: ${path}`);
      }
      const position = primitive.getAttribute('POSITION');
      if (!position) throw new Error(`Missing position accessor: ${path}`);
      const local = Array.from({ length: position.getCount() }, (_, i) =>
        position.getElement(i, []),
      );
      const transformed = local.map((point) => transformPoint(point, matrix));
      points.push(...transformed);
      for (const accessor of primitive.listAttributes()) accessors.add(accessor);
      const indices = primitive.getIndices();
      if (indices) accessors.add(indices);
      const material = primitive.getMaterial();
      if (material) materials.add(material);
      primitives.push({
        node: node.getName(),
        mesh: mesh.getName(),
        primitive: index,
        worldMatrix: matrix,
        rawAccessorBounds: boundsOf(local),
        nodeTransformedBounds: boundsOf(transformed),
        triangles: (indices?.getCount() ?? position.getCount()) / 3,
        vertices: position.getCount(),
        positionComponentType: position.getComponentType(),
        positionNormalized: position.getNormalized(),
        material: material?.getName() ?? null,
      });
    }
  });
  const textures = assetRoot.listTextures().map((texture) => ({
    name: texture.getName(),
    mimeType: texture.getMimeType(),
    size: texture.getSize(),
    encodedBytes: texture.getImage()?.byteLength ?? 0,
    sha256: sha256(texture.getImage() ?? new Uint8Array()),
  }));
  return {
    points,
    evidence: {
      source: seal(path),
      license:
        'Kay Lousberg (KayKit), existing CREDITS.md CC0 dungeon/furniture attribution; retained GLB is the measurement source',
      defaultScene: scene.getName(),
      animationsPresent: assetRoot.listAnimations().map((animation) => animation.getName()),
      state: 'static default pose, no animation playback',
      nodeTransformedBounds: boundsOf(points),
      primitives,
      metrics: {
        triangles: primitives.reduce((sum, primitive) => sum + primitive.triangles, 0),
        primitives: primitives.length,
        materials: materials.size,
        decodedGeometryBytes: [...accessors].reduce(
          (sum, accessor) => sum + accessor.getArray().byteLength,
          0,
        ),
        encodedTextureBytes: textures.reduce((sum, texture) => sum + texture.encodedBytes, 0),
      },
      textures,
      residencyBoundary:
        'Decoded accessor bytes and encoded embedded texture bytes are measured. GPU transcode format, mip residency, renderer material splitting and frame cost are not measured by this offline tool.',
    },
  };
}

function measureRug(path) {
  const text = source(path).toString();
  const functionText = verifiedRugFactory(text);
  // Instantiate the existing geometry recipe for measurement only; no model is exported.
  const geometry = new PlaneGeometry(8, 26);
  const raw = Array.from({ length: geometry.attributes.position.count }, (_, i) => [
    geometry.attributes.position.getX(i),
    geometry.attributes.position.getY(i),
    geometry.attributes.position.getZ(i),
  ]);
  geometry.rotateX(-Math.PI / 2);
  const points = Array.from({ length: geometry.attributes.position.count }, (_, i) => [
    geometry.attributes.position.getX(i),
    geometry.attributes.position.getY(i) + 0.02,
    geometry.attributes.position.getZ(i),
  ]);
  const evidence = {
    source: seal(path),
    sourceFunction: 'buildRug',
    sourceFunctionSha256: sha256(functionText),
    license: 'World of ClaudeCraft project source, root MIT code license',
    method:
      'Instantiate the exact guarded PlaneGeometry recipe, then measure its rotated Float32 vertices and existing Y offset. No shipping model exists for this recipe.',
    rawAccessorBounds: boundsOf(raw),
    nodeTransformedBounds: boundsOf(points),
    sourceRotationX: -Math.PI / 2,
    sourceTranslation: [0, 0.02, 0],
    metrics: {
      triangles: geometry.index.count / 3,
      primitives: 1,
      materials: 1,
      decodedGeometryBytes: Object.values(geometry.attributes).reduce(
        (sum, attribute) => sum + attribute.array.byteLength,
        geometry.index.array.byteLength,
      ),
      encodedTextureBytes: 0,
    },
    textures: [],
    residencyBoundary:
      'Geometry array bytes measured. The existing transparent material may add overdraw; no GPU frame-time equivalence is claimed.',
  };
  geometry.dispose();
  return { points, evidence };
}

const reference = await measureGlb(proposal.grid.referenceAsset);
const pitch =
  reference.evidence.nodeTransformedBounds.size[proposal.grid.referenceAxis] /
  proposal.grid.proposedSubdivisions;
const rows = [];
for (const item of proposal.items) {
  if (
    item.scaleDerivation &&
    item.scale !==
      item.scaleDerivation.existingPlacementScale * item.scaleDerivation.proposedMultiplier
  ) {
    throw new Error(`Scale derivation does not match the proposal for ${item.id}`);
  }
  if (item.scaleSource && !source(item.scaleSource).toString().includes(item.scaleWitness)) {
    throw new Error(`Scale witness changed for ${item.id}`);
  }
  if (item.propKey) {
    const path = item.asset.replace(/^public/, '');
    if (!source('src/render/props.ts').toString().includes(`${item.propKey}: { url: '${path}'`)) {
      throw new Error(`Renderer source mapping changed for ${item.id}`);
    }
  }
  const measurement = item.asset ? await measureGlb(item.asset) : measureRug(item.source);
  const placement = placementProposal(measurement.points, {
    scale: item.scale,
    pitch,
    underlay: item.underlay,
    floorLift: item.floorLift,
  });
  rows.push({
    id: item.id,
    fixtureId: `geometry-v1:${item.id}`,
    mapping: item,
    measurement: measurement.evidence,
    proposal: placement,
  });
}
const referenceMetrics = rows.find((row) => row.id === proposal.decor.referenceItem).measurement
  .metrics;
for (const row of rows)
  row.proposedDecor = decorProposal(row.measurement.metrics, referenceMetrics);
const packageVersion = (name) => {
  if (name === 'typescript') return ts.version;
  const main = require.resolve(name);
  let path = new URL('./', pathToFileURL(main));
  while (path.pathname !== '/') {
    try {
      const manifest = JSON.parse(readFileSync(new URL('package.json', path)));
      if (manifest.name === name) return manifest.version;
    } catch {}
    path = new URL('../', path);
  }
  throw new Error(`Cannot resolve tool version: ${name}`);
};
const output = {
  version: proposal.version,
  status: proposal.status,
  productionEnabled: false,
  approval: null,
  reproduction: 'node scripts/freeholds/geometry_measure.mjs',
  toolVersions: Object.fromEntries(
    [
      '@gltf-transform/core',
      '@gltf-transform/extensions',
      'meshoptimizer',
      'three',
      'typescript',
    ].map((name) => [name, packageVersion(name)]),
  ),
  inputs: inputPaths.map(seal),
  gridProposal: { ...proposal.grid, measuredPitch: pitch, reference: reference.evidence },
  decorProposal: proposal.decor,
  fixtureBoundary:
    'Open development lattice and per-object containment only. No approved room polygon, protected doorway/arrival corridor, maximum legal room packing, final GLB reconciliation or LOW-device proof is claimed.',
  rows,
};
if (process.argv.length !== 2 || resolve(fileURLToPath(root)) !== resolve(process.cwd())) {
  throw new Error('Run from repository root with no additional arguments');
}
const serialized = `${JSON.stringify(output, null, 2)}\n`;
snapshot.assertUnchanged();
process.stdout.write(serialized);
