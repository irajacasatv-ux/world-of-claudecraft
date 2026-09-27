import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getBounds, NodeIO, Primitive } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  EASTBROOK_TOWN_SOURCE_FILES,
  eastbrookTownSourceFingerprint,
} from '../scripts/assets/eastbrook_town/source_fingerprint.mjs';
import {
  buildEastbrookSurfaceAtlas,
  EASTBROOK_SURFACE_ATLAS_SOURCE_FILES,
  eastbrookSurfaceAtlasFingerprint,
} from '../scripts/assets/eastbrook_town/surface_atlas.mjs';
import { MEDIA_ASSETS } from '../src/render/assets/manifest.generated';

const REPO_ROOT = path.join(__dirname, '..');
const PROPS_ROOT = path.join(REPO_ROOT, 'public/models/props');
const MATERIALS_ROOT = path.join(REPO_ROOT, 'docs/screenshots/eastbrook-vale-rebuild/materials');
const SOURCE_FINGERPRINT = '0953ee476d161d1d44bfec78765fcd40a4f3e4947c961d8273ca5af4c4042323';
const SURFACE_ATLAS_SOURCE_SHA256 =
  'abec3036f8887e9c94972dab52aea664f18a74696db6b6d24cc48a4cfbe22b7d';
const SURFACE_ATLAS_SHIPPING_SHA256 =
  'd66f2fab603aa83e6c73c6fc4bdde2d545a6d8c1a0d4a58d42a3fb227e5a3f9b';
const SURFACE_ATLAS_PREVIEW_SHA256 =
  'ea6ba64e200f305f079cc858a4daf5d28dc8c240acd83895729237c521d26576';
const SURFACE_ATLAS_FINGERPRINT =
  '1e76940540624fc51658d148ebf3746b4ea9e216e02564d98ff8418a0b109d01';

interface SocketContract {
  id: string;
  name: string;
  purpose: string;
  position?: readonly [number, number, number];
}

interface AssetContract {
  id: string;
  runtimeId: string;
  file: string;
  rootName: string;
  dimensions: readonly [number, number, number];
  bytes: number;
  sha256: string;
  triangles: number;
  primitiveTriangles: readonly [number, number];
  triangleCeiling: number;
  byteCeiling: number;
  serviceCues: readonly string[];
  sockets: readonly SocketContract[];
}

const ASSETS: readonly AssetContract[] = [
  {
    id: 'bank',
    runtimeId: 'eastbrook-bank',
    file: 'eastbrook_bank.glb',
    rootName: 'EastbrookBank',
    dimensions: [7, 7.8, 5.5],
    bytes: 52_508,
    sha256: 'a07ac3d8f94058c347230b1539be3a07bd1d1d9b7a7d39b6363a4c54b827a6f2',
    triangles: 3104,
    primitiveTriangles: [2928, 176],
    triangleCeiling: 6000,
    byteCeiling: 350 * 1024,
    serviceCues: ['arched-entry', 'teller-window', 'vault-alcove', 'bank-banner'],
    sockets: [
      {
        id: 'front-entry',
        name: 'Socket_FrontEntry',
        purpose: 'front entrance alignment',
        position: [-1.48, 0, 2.6105782171580785],
      },
      {
        id: 'teller',
        name: 'Socket_TellerWindow',
        purpose: 'bank service cue',
        position: [0.72, 1.4199999682016868, 2.441280326460385],
      },
    ],
  },
  {
    id: 'smithy',
    runtimeId: 'eastbrook-smithy',
    file: 'eastbrook_smithy.glb',
    rootName: 'EastbrookSmithy',
    dimensions: [7, 7.5, 5.5],
    bytes: 40_352,
    sha256: '1cef7c77fb9d671912c9f4817bcc20934f0929ab632b056e9b6e7e6920583ea5',
    triangles: 2410,
    primitiveTriangles: [2282, 128],
    triangleCeiling: 6000,
    byteCeiling: 350 * 1024,
    serviceCues: ['open-forge', 'chimney', 'anvil', 'tool-rack', 'log-rack'],
    sockets: [
      {
        id: 'front-entry',
        name: 'Socket_FrontEntry',
        purpose: 'front entrance alignment',
        position: [-1.4966835342192881, 0, 2.545512812538103],
      },
      {
        id: 'forge',
        name: 'Socket_Forge',
        purpose: 'smithing service cue',
        position: [1.7599897406239382, 1.4811489675639933, 1.3820512669639788],
      },
    ],
  },
  {
    id: 'inn',
    runtimeId: 'eastbrook-inn',
    file: 'eastbrook_inn.glb',
    rootName: 'EastbrookInn',
    dimensions: [7.5, 8.5, 6],
    bytes: 67_768,
    sha256: '9a4ed0543323c02289390927834e19445aa6e74ab63068f32de8693c82114145',
    triangles: 4348,
    primitiveTriangles: [4004, 344],
    triangleCeiling: 6000,
    byteCeiling: 350 * 1024,
    serviceCues: ['deep-portico', 'upper-dormer', 'chimney-hood', 'provision-table'],
    sockets: [
      {
        id: 'front-entry',
        name: 'Socket_FrontEntry',
        purpose: 'front entrance alignment',
        position: [0, 0, 2.7155756379701654],
      },
      {
        id: 'provisions',
        name: 'Socket_Provisions',
        purpose: 'inn service cue',
        position: [-2.4143834985606705, 1.3687600560041784, 2.356659164823497],
      },
    ],
  },
  {
    id: 'chapel',
    runtimeId: 'eastbrook-chapel',
    file: 'eastbrook_chapel.glb',
    rootName: 'EastbrookChapel',
    dimensions: [5.5, 7, 6],
    bytes: 66_132,
    sha256: '526d08d3581ec606232e63ab63d39281861e78553c48de0f26e86acc00090581',
    triangles: 4120,
    primitiveTriangles: [3800, 320],
    triangleCeiling: 6000,
    byteCeiling: 350 * 1024,
    serviceCues: ['pointed-entry', 'lancet-windows', 'flower-boxes', 'crystal-finial'],
    sockets: [
      {
        id: 'front-entry',
        name: 'Socket_FrontEntry',
        purpose: 'front entrance alignment',
        position: [0, 0, 2.7045454862908116],
      },
      {
        id: 'altar-axis',
        name: 'Socket_AltarAxis',
        purpose: 'chapel interior axis cue',
        position: [0, 1.2617448772945523, -2.1818181030021235],
      },
    ],
  },
  {
    id: 'weaving_workshop',
    runtimeId: 'eastbrook-weaving-workshop',
    file: 'eastbrook_weaving_workshop.glb',
    rootName: 'EastbrookWeavingWorkshop',
    dimensions: [5.5, 5.8, 4.5],
    bytes: 40_392,
    sha256: 'b7ae8899cd22d4d1b96dc962c7176c603a33fa9e20225f6f247bfd134c226126',
    triangles: 2412,
    primitiveTriangles: [2272, 140],
    triangleCeiling: 6000,
    byteCeiling: 350 * 1024,
    serviceCues: ['open-loom-bay', 'threaded-loom', 'fabric-rolls', 'dye-barrel'],
    sockets: [
      {
        id: 'front-entry',
        name: 'Socket_FrontEntry',
        purpose: 'front entrance alignment',
        position: [-1.3364486219539575, 0, 1.8883425508188183],
      },
      {
        id: 'loom',
        name: 'Socket_Loom',
        purpose: 'weaving service cue',
        position: [1.1822430117285008, 1.592677387820417, 1.5179573274764089],
      },
    ],
  },
  {
    id: 'toolworks',
    runtimeId: 'eastbrook-toolworks',
    file: 'eastbrook_toolworks.glb',
    rootName: 'EastbrookToolworks',
    dimensions: [5.5, 5.8, 4.5],
    bytes: 39_920,
    sha256: 'cb81a9012d826d8e452bfbfe104dab68fe5302b57163eabbe6831626a90442e1',
    triangles: 2320,
    primitiveTriangles: [2180, 140],
    triangleCeiling: 6000,
    byteCeiling: 350 * 1024,
    serviceCues: ['covered-tool-display', 'workbench', 'crate', 'barrel'],
    sockets: [
      {
        id: 'front-entry',
        name: 'Socket_FrontEntry',
        purpose: 'front entrance alignment',
        position: [0.7401869290821919, 0, 2.1133093138530685],
      },
      {
        id: 'tool-display',
        name: 'Socket_ToolDisplay',
        purpose: 'tool service cue',
        position: [-1.3570093699840184, 1.9244851767848596, 1.739208601273121],
      },
    ],
  },
  {
    id: 'civic_well_beacon',
    runtimeId: 'eastbrook-civic-well-beacon',
    file: 'eastbrook_civic_well_beacon.glb',
    rootName: 'EastbrookCivicWellBeacon',
    dimensions: [3.2, 3.1, 3.2],
    bytes: 13_216,
    sha256: '8791e6880e72a3995619ea4d0c8563c0798fdb53cef09b5318647571d2e5893b',
    triangles: 464,
    primitiveTriangles: [456, 8],
    triangleCeiling: 3000,
    byteCeiling: 180 * 1024,
    serviceCues: ['masonry-well', 'water-basin', 'crystal-beacon'],
    sockets: [
      {
        id: 'center',
        name: 'Socket_CivicCenter',
        purpose: 'civic center alignment',
        position: [0, 0, 0],
      },
      {
        id: 'beacon',
        name: 'Socket_Beacon',
        purpose: 'beacon effect anchor',
        position: [0, 3.1271887952018855, 0],
      },
    ],
  },
  {
    id: 'market_stall',
    runtimeId: 'eastbrook-market-stall',
    file: 'eastbrook_market_stall.glb',
    rootName: 'EastbrookMarketStall',
    dimensions: [2.8, 2.7, 2.2],
    bytes: 27_072,
    sha256: '6ee4191a113c6585070900f1644bbcc8cf91eb085ec76695a3e0eb756cad7f3d',
    triangles: 1314,
    primitiveTriangles: [1294, 20],
    triangleCeiling: 3000,
    byteCeiling: 180 * 1024,
    serviceCues: ['striped-canopy', 'counter-goods', 'crate', 'barrel', 'lanterns'],
    sockets: [
      {
        id: 'vendor',
        name: 'Socket_Vendor',
        purpose: 'vendor alignment',
        position: [-0.003220054370812568, 0, -0.36377953302247557],
      },
      {
        id: 'counter',
        name: 'Socket_Counter',
        purpose: 'market service cue',
        position: [-0.003220054370812568, 1.244197893566759, 0.5889763867982938],
      },
    ],
  },
  {
    id: 'wall_wing',
    runtimeId: 'eastbrook-wall-wing',
    file: 'eastbrook_wall_wing.glb',
    rootName: 'EastbrookWallWing',
    dimensions: [6.5, 2.7, 0.65],
    bytes: 8352,
    sha256: 'b81d6ec76d34039db6b839407044d493f26abe6f49a44ad1a3d9e0d833312151',
    triangles: 206,
    primitiveTriangles: [196, 10],
    triangleCeiling: 206,
    byteCeiling: 180 * 1024,
    serviceCues: ['masonry-courses', 'rail-caps', 'watch-lantern', 'banded-gate-leaf'],
    sockets: [
      {
        id: 'left-join',
        name: 'Socket_LeftJoin',
        purpose: 'wall chaining anchor',
        position: [-3.240136579839491, 0, 0],
      },
      {
        id: 'right-gate',
        name: 'Socket_RightGate',
        purpose: 'gate-side chaining anchor',
        position: [3.171092638715929, 0, 0],
      },
    ],
  },
];

function expectApproxArray(actual: readonly number[], expected: readonly number[]): void {
  expect(actual).toHaveLength(expected.length);
  for (const [index, value] of expected.entries()) {
    expect(
      Math.abs(actual[index] - value),
      `component ${index}: ${actual[index]} vs ${value}`,
    ).toBe(0);
  }
}

function expectQuantizedArray(actual: readonly number[], expected: readonly number[]): void {
  expect(actual).toHaveLength(expected.length);
  for (const [index, value] of expected.entries()) {
    expect(
      Math.abs(actual[index] - value),
      `component ${index}: ${actual[index]} vs ${value}`,
    ).toBeLessThanOrEqual(2e-3);
  }
}

const SURFACE_ATLAS_SEMANTICS = [
  'dark-stone-blocks',
  'light-stone-blocks',
  'warm-plaster',
  'vertical-dark-timber',
  'cobalt-roof-shingles',
  'dark-forged-metal',
  'warm-gold-metal',
  'horizontal-warm-timber',
  'blue-cream-canvas',
  'red-cream-canvas',
  'dark-brown-leather',
  'irregular-dark-stone',
  'cyan-crystal',
  'cobalt-painted-planks',
  'light-gray-stone',
  'medium-gray-stone',
] as const;

describe('Eastbrook shared surface atlas', () => {
  it('derives a fresh high-key grayscale multiplier independently from all 16 source cells', {
    timeout: 30000,
  }, async () => {
    const sourcePath = path.join(MATERIALS_ROOT, 'eastbrook-surface-atlas-source.png');
    const shippingPath = path.join(REPO_ROOT, 'public/textures/eastbrook_surface_atlas.webp');
    const previewPath = path.join(MATERIALS_ROOT, 'eastbrook-surface-atlas-comparison.png');
    const specPath = path.join(REPO_ROOT, 'scripts/assets/specs/eastbrook_town_surface_atlas.json');

    expect(EASTBROOK_SURFACE_ATLAS_SOURCE_FILES).toEqual([
      'docs/screenshots/eastbrook-vale-rebuild/materials/eastbrook-surface-atlas-source.png',
      'scripts/assets/eastbrook_town/surface_atlas.mjs',
      'scripts/assets/eastbrook_town/build_surface_atlas.mjs',
      'scripts/assets/specs/eastbrook_town_surface_atlas.json',
    ]);
    for (const atlasOnlyPath of EASTBROOK_SURFACE_ATLAS_SOURCE_FILES.slice(0, 4)) {
      expect(EASTBROOK_TOWN_SOURCE_FILES).not.toContain(atlasOnlyPath);
    }
    expect(eastbrookTownSourceFingerprint(REPO_ROOT)).toBe(SOURCE_FINGERPRINT);

    const spec = JSON.parse(readFileSync(specPath, 'utf8')) as {
      schemaVersion: number;
      source: { path: string; sha256: string; width: number; height: number; format: string };
      shipping: {
        path: string;
        url: string;
        sha256: string;
        width: number;
        height: number;
        format: string;
        byteCeiling: number;
      };
      preview: { path: string; sha256: string; width: number; height: number; format: string };
      usage: {
        role: string;
        colorSpace: string;
        paletteAuthority: string;
        channelRange: [number, number];
        embeddedInGlbs: boolean;
      };
      processing: {
        grid: {
          columns: number;
          rows: number;
          sourceInsetPixels: number;
          partition: string;
        };
        outputCellPixels: number;
        luminance: { red: number; green: number; blue: number; divisor: number };
        normalization: {
          lowPercentile: number;
          highPercentile: number;
          outputMin: number;
          outputMax: number;
        };
        resizeKernel: string;
        webp: { lossless: boolean; effort: number };
      };
      semantics: Array<{
        index: number;
        id: string;
        row: number;
        column: number;
        centerUvTopLeft: [number, number];
        centerUvBottomLeft: [number, number];
      }>;
    };
    expect(spec.schemaVersion).toBe(1);
    expect(spec.source).toEqual({
      path: 'docs/screenshots/eastbrook-vale-rebuild/materials/eastbrook-surface-atlas-source.png',
      sha256: SURFACE_ATLAS_SOURCE_SHA256,
      width: 1254,
      height: 1254,
      format: 'png',
    });
    expect(spec.shipping).toMatchObject({
      path: 'public/textures/eastbrook_surface_atlas.webp',
      url: '/textures/eastbrook_surface_atlas.webp',
      width: 512,
      height: 512,
      format: 'webp',
      byteCeiling: 256 * 1024,
      sha256: SURFACE_ATLAS_SHIPPING_SHA256,
    });
    expect(spec.preview).toEqual({
      path: 'docs/screenshots/eastbrook-vale-rebuild/materials/eastbrook-surface-atlas-comparison.png',
      sha256: SURFACE_ATLAS_PREVIEW_SHA256,
      width: 1072,
      height: 544,
      format: 'png',
    });
    expect(spec.usage).toEqual({
      role: 'high-key-grayscale-detail-multiplier',
      colorSpace: 'none',
      paletteAuthority: 'vertex-color',
      channelRange: [192, 255],
      embeddedInGlbs: false,
    });
    expect(spec.processing).toEqual({
      grid: {
        columns: 4,
        rows: 4,
        sourceInsetPixels: 2,
        partition: 'rounded-equal-quarters',
      },
      outputCellPixels: 128,
      luminance: { red: 54, green: 183, blue: 19, divisor: 256 },
      normalization: {
        lowPercentile: 0.02,
        highPercentile: 0.98,
        outputMin: 192,
        outputMax: 255,
      },
      resizeKernel: 'lanczos3',
      webp: { lossless: true, effort: 6 },
    });
    expect(spec.semantics.map((cell) => cell.id)).toEqual(SURFACE_ATLAS_SEMANTICS);
    for (const [index, cell] of spec.semantics.entries()) {
      const row = Math.floor(index / 4);
      const column = index % 4;
      expect(cell).toEqual({
        index,
        id: SURFACE_ATLAS_SEMANTICS[index],
        row,
        column,
        centerUvTopLeft: [(column + 0.5) / 4, (row + 0.5) / 4],
        centerUvBottomLeft: [(column + 0.5) / 4, 1 - (row + 0.5) / 4],
      });
    }

    const sourceBytes = readFileSync(sourcePath);
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(spec.source.sha256);
    const sourceMetadata = await sharp(sourceBytes).metadata();
    expect(sourceMetadata).toMatchObject({ width: 1254, height: 1254, format: 'png' });

    const shippingBytes = readFileSync(shippingPath);
    expect(shippingBytes.length).toBe(141_666);
    expect(createHash('sha256').update(shippingBytes).digest('hex')).toBe(spec.shipping.sha256);
    expect(shippingBytes.length).toBeLessThanOrEqual(spec.shipping.byteCeiling);
    expect(await sharp(shippingBytes).metadata()).toMatchObject({
      width: 512,
      height: 512,
      format: 'webp',
      hasAlpha: false,
    });
    const { data: shippingPixels } = await sharp(shippingBytes)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let channelMismatchCount = 0;
    const cellRanges = Array.from({ length: 16 }, () => ({ min: 255, max: 0 }));
    for (let offset = 0; offset < shippingPixels.length; offset += 3) {
      const pixel = offset / 3;
      const x = pixel % 512;
      const y = Math.floor(pixel / 512);
      const cell = Math.floor(y / 128) * 4 + Math.floor(x / 128);
      const value = shippingPixels[offset];
      cellRanges[cell].min = Math.min(cellRanges[cell].min, value);
      cellRanges[cell].max = Math.max(cellRanges[cell].max, value);
      if (shippingPixels[offset + 1] !== value || shippingPixels[offset + 2] !== value) {
        channelMismatchCount += 1;
      }
    }
    expect(channelMismatchCount).toBe(0);
    expect(cellRanges).toEqual(Array.from({ length: 16 }, () => ({ min: 192, max: 255 })));

    const rebuilt = await buildEastbrookSurfaceAtlas(sourceBytes);
    expect(rebuilt.atlas).toEqual(shippingBytes);
    expect(rebuilt.preview).toEqual(readFileSync(previewPath));
    expect(createHash('sha256').update(rebuilt.preview).digest('hex')).toBe(spec.preview.sha256);
    expect(await sharp(rebuilt.preview).metadata()).toMatchObject({
      width: spec.preview.width,
      height: spec.preview.height,
      format: 'png',
    });
    expect(eastbrookSurfaceAtlasFingerprint(REPO_ROOT)).toBe(SURFACE_ATLAS_FINGERPRINT);

    const manifestKey = spec.shipping.url.replace(/^\//, '');
    expect(MEDIA_ASSETS[manifestKey]).toBe(
      `/media/textures/eastbrook_surface_atlas.${spec.shipping.sha256.slice(0, 12)}.webp`,
    );
  });
});

describe('Eastbrook town shipping GLBs', () => {
  it('pins all nine generated media-manifest mappings to their optimized hashes', () => {
    const actual = Object.fromEntries(
      ASSETS.map((asset) => {
        const key = `models/props/${asset.file}`;
        return [key, MEDIA_ASSETS[key]];
      }),
    );
    const expected = Object.fromEntries(
      ASSETS.map((asset) => {
        const stem = asset.file.replace(/\.glb$/, '');
        return [
          `models/props/${asset.file}`,
          `/media/models/props/${stem}.${asset.sha256.slice(0, 12)}.glb`,
        ];
      }),
    );
    expect(actual).toEqual(expected);
    expect(Object.keys(actual)).toHaveLength(9);
  });

  it('pins the deterministic source inventory and optimizer specification', () => {
    expect(EASTBROOK_TOWN_SOURCE_FILES).toEqual([
      'scripts/assets/eastbrook_town/shared.js',
      'scripts/assets/eastbrook_town/buildings_commerce.js',
      'scripts/assets/eastbrook_town/buildings_craft.js',
      'scripts/assets/eastbrook_town/furniture.js',
      'scripts/assets/eastbrook_town/model.js',
      'scripts/assets/eastbrook_town/export_entry.js',
      'scripts/assets/eastbrook_town/export_eastbrook_town.mjs',
      'scripts/assets/eastbrook_town/source_fingerprint.mjs',
      'scripts/assets/specs/eastbrook_town.json',
      'scripts/assets/build_assets.mjs',
    ]);
    expect(eastbrookTownSourceFingerprint(REPO_ROOT)).toBe(SOURCE_FINGERPRINT);
    expect(eastbrookTownSourceFingerprint(REPO_ROOT)).toBe(
      eastbrookTownSourceFingerprint(REPO_ROOT),
    );

    const spec = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'scripts/assets/specs/eastbrook_town.json'), 'utf8'),
    );
    expect(spec).toEqual({
      items: ASSETS.map((asset) => ({
        src: `tmp/asset_src/eastbrook_town/${asset.id}-final.glb`,
        out: `models/props/${asset.file}`,
        type: 'static',
        keepExtras: true,
      })),
    });

    const exporterSource = readFileSync(
      path.join(REPO_ROOT, 'scripts/assets/eastbrook_town/export_eastbrook_town.mjs'),
      'utf8',
    );
    expect(exporterSource).toContain("process.argv.includes('--verify-staged')");
    expect(exporterSource).toContain('deterministic optimized rebuild:');
    expect(exporterSource).toContain("'front-3q'");
    expect(exporterSource).toContain("'rear-3q'");
    expect(exporterSource).toContain("'collider-overlay'");
    expect(exporterSource).toContain('--preview-only --asset wall_wing');
  });

  it('pins structure, dimensions, metadata, budgets, and exact optimized bytes', {
    timeout: 30000,
  }, async () => {
    await MeshoptDecoder.ready;
    const io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
    let totalBytes = 0;
    let totalTriangles = 0;

    for (const asset of ASSETS) {
      const assetPath = path.join(PROPS_ROOT, asset.file);
      expect(existsSync(assetPath), `${asset.file} is missing`).toBe(true);
      const bytes = readFileSync(assetPath);
      expect(bytes.toString('utf8', 0, 4)).toBe('glTF');
      expect(bytes.readUInt32LE(4)).toBe(2);
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(bytes.length).toBeLessThanOrEqual(asset.byteCeiling);

      const document = await io.readBinary(bytes);
      const root = document.getRoot();
      expect(
        root
          .listExtensionsUsed()
          .map((extension) => extension.extensionName)
          .sort(),
      ).toEqual([
        'EXT_meshopt_compression',
        'KHR_materials_emissive_strength',
        'KHR_mesh_quantization',
      ]);
      expect(
        root
          .listExtensionsRequired()
          .map((extension) => extension.extensionName)
          .sort(),
      ).toEqual(['EXT_meshopt_compression', 'KHR_mesh_quantization']);
      expect(root.listTextures()).toHaveLength(0);
      expect(root.listAnimations()).toHaveLength(0);
      expect(root.listSkins()).toHaveLength(0);
      expect(root.listCameras()).toHaveLength(0);
      expect(root.listScenes()).toHaveLength(1);
      expect(root.listNodes()).toHaveLength(5);
      expect(root.listMeshes()).toHaveLength(2);
      expect(root.listMaterials()).toHaveLength(2);

      for (const [accessorIndex, accessor] of root.listAccessors().entries()) {
        const array = accessor.getArray();
        expect(array, `${asset.id} accessor ${accessorIndex} has no storage`).not.toBeNull();
        expect(accessor.getCount()).toBeGreaterThan(0);
        expect(array?.length).toBe(accessor.getCount() * accessor.getElementSize());
        if (array) {
          for (const value of array) {
            expect(Number.isFinite(value), `${asset.id} accessor contains ${value}`).toBe(true);
          }
        }
      }

      const scene = root.listScenes()[0];
      expect(scene.listChildren().map((node) => node.getName())).toEqual([asset.rootName]);
      const modelRoot = scene.listChildren()[0];
      expectApproxArray(modelRoot.getTranslation(), [0, 0, 0]);
      expectApproxArray(modelRoot.getRotation(), [0, 0, 0, 1]);
      expectApproxArray(modelRoot.getScale(), [1, 1, 1]);

      const bounds = getBounds(scene);
      const [width, height, depth] = asset.dimensions;
      expectQuantizedArray(bounds.min, [-width / 2, 0, -depth / 2]);
      expectQuantizedArray(bounds.max, [width / 2, height, depth / 2]);

      const meshContracts = root.listMeshes().map((mesh) => {
        expect(mesh.listPrimitives()).toHaveLength(1);
        const primitive = mesh.listPrimitives()[0];
        expect(primitive.getMode()).toBe(Primitive.Mode.TRIANGLES);
        expect(primitive.listSemantics().sort()).toEqual(['COLOR_0', 'NORMAL', 'POSITION']);
        const position = primitive.getAttribute('POSITION');
        const normal = primitive.getAttribute('NORMAL');
        const color = primitive.getAttribute('COLOR_0');
        if (!position || !normal || !color) throw new Error(`${asset.id} lost a vertex attribute`);
        expect(position.getType()).toBe('VEC3');
        expect(normal.getType()).toBe('VEC3');
        expect(color.getType()).toBe('VEC3');
        expect(normal.getCount()).toBe(position.getCount());
        expect(color.getCount()).toBe(position.getCount());
        const triangles = (primitive.getIndices()?.getCount() ?? position.getCount()) / 3;
        return [primitive.getMaterial()?.getName(), triangles] as const;
      });
      expect(meshContracts).toEqual([
        ['TownOpaque', asset.primitiveTriangles[0]],
        ['TownEmissive', asset.primitiveTriangles[1]],
      ]);
      const triangles = meshContracts.reduce((sum, [, count]) => sum + count, 0);
      expect(triangles).toBe(asset.triangles);
      expect(triangles).toBeLessThanOrEqual(asset.triangleCeiling);

      const materials = root.listMaterials();
      expect(materials.map((material) => material.getName())).toEqual([
        'TownOpaque',
        'TownEmissive',
      ]);
      expect(
        materials.filter((material) => material.getEmissiveFactor().some((v) => v > 0)),
      ).toHaveLength(1);

      const runtime = (
        modelRoot.getExtras() as {
          sculptRuntime?: {
            schemaVersion: number;
            assetId: string;
            coordinateFrame: Record<string, string>;
            nativeBounds: Record<string, number>;
            serviceCues: string[];
            interaction: { mode: string; interactive: boolean };
            collider: { shippingCollisionMesh: boolean };
            destruction: { breakable: boolean; detachableParts: unknown[] };
            sockets: Record<
              string,
              { nodeName: string; position: number[]; purpose: string; interactive: boolean }
            >;
          };
        }
      ).sculptRuntime;
      expect(runtime).toBeDefined();
      expect(runtime).toMatchObject({
        schemaVersion: 1,
        assetId: asset.runtimeId,
        coordinateFrame: { front: '+Z', up: '+Y', right: '+X', units: 'world-yards' },
        nativeBounds: { width, height, depth },
        serviceCues: asset.serviceCues,
        interaction: { mode: 'static-town-asset', interactive: false },
        collider: { shippingCollisionMesh: false },
        destruction: { breakable: false, detachableParts: [] },
      });

      for (const socket of asset.sockets) {
        const node = root.listNodes().find((candidate) => candidate.getName() === socket.name);
        expect(node, `${asset.id} lost ${socket.name}`).toBeDefined();
        if (!node || !runtime) continue;
        expect(node.getMesh()).toBeNull();
        expect(node.listChildren()).toHaveLength(0);
        expectApproxArray(node.getRotation(), [0, 0, 0, 1]);
        expectApproxArray(node.getScale(), [1, 1, 1]);
        expect(node.getTranslation().every(Number.isFinite)).toBe(true);
        expect(node.getExtras()).toEqual({
          sculptSocket: { id: socket.id, purpose: socket.purpose, interactive: false },
        });
        expect(runtime.sockets[socket.id]).toMatchObject({
          nodeName: socket.name,
          purpose: socket.purpose,
          interactive: false,
        });
        expectQuantizedArray(runtime.sockets[socket.id].position, node.getTranslation());
        if (socket.position) {
          expectQuantizedArray(node.getTranslation(), socket.position);
          expectQuantizedArray(runtime.sockets[socket.id].position, socket.position);
        }
      }
      expect(Object.keys(runtime?.sockets ?? {}).sort()).toEqual(
        asset.sockets.map((socket) => socket.id).sort(),
      );
      expect(root.getExtras()).toEqual({ sourceFingerprint: SOURCE_FINGERPRINT });
      expect(root.getAsset().extras).toEqual({ sourceFingerprint: SOURCE_FINGERPRINT });

      totalBytes += bytes.length;
      totalTriangles += triangles;
    }

    expect(totalBytes).toBe(355_712);
    expect(totalBytes).toBeLessThanOrEqual(Math.floor(1.25 * 1024 * 1024));
    expect(totalTriangles).toBe(20_698);
    expect(totalTriangles).toBeLessThanOrEqual(30_000);
  });

  it('counts repeated geometry against the whole-town runtime triangle target', () => {
    const triangleCount = (id: string) => {
      const asset = ASSETS.find((candidate) => candidate.id === id);
      if (!asset) throw new Error(`missing triangle contract for ${id}`);
      return asset.triangles;
    };
    const buildingTriangles = [
      'bank',
      'smithy',
      'inn',
      'chapel',
      'weaving_workshop',
      'toolworks',
    ].reduce((sum, id) => sum + triangleCount(id), 0);
    const fixedNonWallTriangles =
      buildingTriangles +
      triangleCount('civic_well_beacon') +
      2 * triangleCount('market_stall') +
      3 * 208 +
      3 * 348;
    const wallTriangles = 26 * triangleCount('wall_wing');
    const optionalFoundationSkirtTriangles = 6 * 12;
    const wholeTownTriangles =
      fixedNonWallTriangles + wallTriangles + optionalFoundationSkirtTriangles;

    expect(buildingTriangles).toBe(18_714);
    expect(fixedNonWallTriangles).toBe(23_474);
    expect(optionalFoundationSkirtTriangles).toBe(72);
    expect(wholeTownTriangles).toBe(28_902);
    expect(wholeTownTriangles).toBeLessThanOrEqual(30_000);
  });
});
