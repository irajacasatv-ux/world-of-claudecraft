import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { validateAcceptedArtManifest } from '../scripts/lib/icon_asset_audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'docs/freeholds/crafted-content-art-2026-09-07';
const SOURCE = `${DIR}/staged-art-v2.json`;
const STAGING = 'tmp/imagegen/freehold-crafted-2026-09-07';
const IDS = [
  'freehold_weapon_rack',
  'freehold_iron_brazier',
  'freehold_patchwork_rug',
  'freehold_hide_armchair',
  'freehold_clockwork_lamp',
  'freehold_glass_floor_lamp',
  'freehold_chart_easel',
  'freehold_jewel_floor_lamp',
  'freehold_set_supper_table',
  'freehold_glow_lantern',
  'pattern_freehold_clockwork_lamp',
  'pattern_freehold_chart_easel',
  'pattern_freehold_jewel_floor_lamp',
];

type Pin = { path: string; sha256: string; bytes: number };
type Artifact = Pin & {
  width: number;
  height: number;
  format: string;
  colourspace: string;
  minAlpha: number;
  maxAlpha: number;
};
type Iteration = {
  prompt: string;
  generatorOutput: string;
  original?: Artifact;
  master?: Artifact;
  shipping?: Artifact;
  references?: Array<Pin & { role: string }>;
};
type SourceAsset = Iteration & {
  id: string;
  original: Artifact;
  master: Artifact;
  shipping: Artifact;
  retryCount: number;
  iterations: Iteration[];
};
type SourceRecord = {
  schemaVersion: number;
  batchId: string;
  generator: string;
  executionHarness: string;
  styleContract: string;
  supersedes: Pin;
  references: Array<Pin & { role: string }>;
  converter: Pin & { commands: Array<{ command: string; converted: number; exitCode: number }> };
  review: { sizesInspected: Array<string | number>; sheets: Pin[] };
  assets: SourceAsset[];
};
type AcceptedRecord = {
  sourceEvidence: Pin;
  targetSets: { items: string[] };
  review: { sheets: Pin[] };
  assets: Array<{
    id: string;
    kind: string;
    runtimeUrl: string;
    shipping: Artifact;
    acceptedSha256: string;
    acceptedBytes: number;
    originalSha256: string;
    masterSha256: string;
    sourceRecord: string;
  }>;
};

const read = (relative: string) => readFileSync(path.join(ROOT, relative));
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const source = () => JSON.parse(read(SOURCE).toString()) as SourceRecord;
const accepted = () =>
  JSON.parse(read(`${DIR}/items.accepted-art.json`).toString()) as AcceptedRecord;

function expectFilePin(pin: Pin) {
  const bytes = read(pin.path);
  expect(bytes.length, pin.path).toBe(pin.bytes);
  expect(sha256(bytes), pin.path).toBe(pin.sha256);
}

function expectMetadata(artifact: Artifact, size: number, format: string) {
  expect(artifact).toMatchObject({
    width: size,
    height: size,
    format,
    colourspace: 'srgb',
    minAlpha: 255,
    maxAlpha: 255,
  });
  expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(artifact.bytes).toBeGreaterThan(0);
}

describe('crafted furnishing art admission', () => {
  it('admits exactly thirteen items from the immutable final source seal', () => {
    const manifest = accepted();
    const evidence = source();
    expect(() => validateAcceptedArtManifest(manifest)).not.toThrow();
    expect(manifest.sourceEvidence).toEqual({
      path: SOURCE,
      sha256: 'c9e46f0c5752513c11a0245800c02df872c57292a033eeabc4d940a5fc86875f',
      bytes: 70685,
    });
    expectFilePin(manifest.sourceEvidence);
    expect(evidence).toMatchObject({
      schemaVersion: 1,
      batchId: 'freehold-crafted-2026-09-07',
      generator: 'OpenAI built-in image generation',
      executionHarness: 'Codex',
      styleContract: 'woc-item-icon-v1',
    });
    expect(manifest.targetSets.items).toEqual(IDS);
    expect(manifest.assets.map((asset) => asset.id)).toEqual(IDS);
    expect(evidence.assets.map((asset) => asset.id)).toEqual(IDS);
    expect(IDS).toHaveLength(13);
    expect(evidence.supersedes).toMatchObject({
      path: `${DIR}/staged-art.json`,
      sha256: 'c2173d933b1741f813639f3dd2d9aa87e28f9b03297687901e6ca2a4ed846a0c',
      bytes: 66558,
    });
    expectFilePin(evidence.supersedes);
  });

  it('links shipping art to separate generated originals and normalized masters', async () => {
    const manifest = accepted();
    const evidence = source();
    const hashes = new Set<string>();
    for (const [index, asset] of manifest.assets.entries()) {
      const lineage = evidence.assets[index];
      expect(asset).toMatchObject({
        id: lineage.id,
        kind: 'item',
        runtimeUrl: `/ui/items/${lineage.id}.webp`,
        shipping: lineage.shipping,
        acceptedSha256: lineage.shipping.sha256,
        acceptedBytes: lineage.shipping.bytes,
        originalSha256: lineage.original.sha256,
        masterSha256: lineage.master.sha256,
        sourceRecord: `${SOURCE}#assets:${lineage.id}`,
      });
      // Ignored working masters need not exist in a clean checkout; their sealed metadata does.
      expect(lineage.original.path).toBe(`${STAGING}/originals/${asset.id}.png`);
      expect(lineage.master.path).toBe(`${STAGING}/masters/${asset.id}.png`);
      expect(lineage.shipping.path).toBe(`public/ui/items/${asset.id}.webp`);
      expectMetadata(lineage.original, 1254, 'png');
      expectMetadata(lineage.master, 512, 'png');
      expectMetadata(lineage.shipping, 128, 'webp');
      expectFilePin(asset.shipping);
      expect(asset.acceptedBytes).toBeLessThanOrEqual(15 * 1024);
      const bytes = read(asset.shipping.path);
      const metadata = await sharp(bytes).metadata();
      expect(metadata).toMatchObject({ width: 128, height: 128, format: 'webp', space: 'srgb' });
      const { data, info } = await sharp(bytes)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect(info.channels).toBe(4);
      for (let pixel = 3; pixel < data.length; pixel += 4) {
        if (data[pixel] !== 255) throw new Error(`${asset.id}: transparent shipping pixel`);
      }
      hashes.add(sha256(bytes));
    }
    expect(hashes.size).toBe(13);
    expect(new Set(evidence.assets.map((asset) => asset.original.sha256)).size).toBe(13);
    expect(new Set(evidence.assets.map((asset) => asset.master.sha256)).size).toBe(13);
    expect(manifest.assets.reduce((total, asset) => total + asset.acceptedBytes, 0)).toBe(33156);
  });

  it('retains eighteen distinct calls and the five corrections with exact reference lineage', () => {
    const evidence = source();
    expect(evidence.assets.map((asset) => asset.retryCount)).toEqual([
      0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ]);
    const calls = evidence.assets.flatMap((asset) =>
      asset.retryCount ? asset.iterations : [asset],
    );
    expect(calls).toHaveLength(18);
    expect(new Set(calls.map((call) => call.generatorOutput)).size).toBe(18);
    for (const call of calls) {
      expect(call.prompt.length).toBeGreaterThan(200);
      expect(call.generatorOutput).toMatch(/\/generated_images\/[^/]+\/exec-[^/]+\.png$/);
    }
    for (const asset of evidence.assets.filter((row) => row.retryCount > 0)) {
      expect(asset.iterations).toHaveLength(asset.retryCount + 1);
      expect(asset.iterations[0].prompt).toBe(asset.prompt);
      expect(asset.iterations.at(-1)?.generatorOutput).toBe(asset.generatorOutput);
      for (let index = 1; index < asset.iterations.length; index++) {
        const previous = asset.iterations[index - 1];
        const current = asset.iterations[index];
        expect(previous.original).toBeDefined();
        expect(previous.master).toBeDefined();
        expect(previous.shipping).toBeDefined();
        expect(current.references?.[0]).toMatchObject({
          path: previous.master?.path,
          sha256: previous.master?.sha256,
          bytes: previous.master?.bytes,
          role: expect.stringContaining('Edit target'),
        });
        expect(previous.shipping?.sha256).not.toBe(asset.shipping.sha256);
        const document = asset.id.startsWith('pattern_');
        expect(current.references).toHaveLength(document ? 2 : 1);
        if (document) {
          const output = evidence.assets.find(
            (row) => row.id === asset.id.slice('pattern_'.length),
          );
          expect(output).toBeDefined();
          expect(current.references?.[1]).toMatchObject({
            path: output?.master.path,
            sha256: output?.master.sha256,
            bytes: output?.master.bytes,
            role: expect.stringContaining('Identity-only'),
          });
        }
      }
    }
    const prior = JSON.parse(read(evidence.supersedes.path).toString()) as SourceRecord;
    const finalRug = evidence.assets[2];
    expect(finalRug.iterations[1].master?.sha256).toBe(prior.assets[2].master.sha256);
    expect(finalRug.iterations[1].original?.sha256).toBe(prior.assets[2].original.sha256);
    expect(finalRug.iterations[1].shipping?.sha256).toBe(prior.assets[2].shipping.sha256);
    expect(evidence.assets.filter((_, index) => index !== 2)).toEqual(
      prior.assets.filter((_, index) => index !== 2),
    );
  });

  it('retains style-reference roles and the canonical conversion receipts', () => {
    const evidence = source();
    expect(evidence.references.map((reference) => reference.path)).toEqual(
      [
        'eastbrook_buckler',
        'linen_pouch',
        'firebottle',
        'freehold_spindle_chair',
        'freehold_woven_rug',
        'anglers_feast_platter',
      ].map((id) => `public/ui/items/${id}.webp`),
    );
    for (const reference of evidence.references) {
      expect(reference.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(reference.role).toContain('Agent-viewed style anchor');
      expect(reference.role).toContain('no image pixels supplied');
    }
    expect(evidence.converter).toMatchObject({
      path: 'scripts/convert_item_icons_webp.mjs',
      sha256: '3bcdf476b8727e50ffe82f0d452963baef104e5f4ea90d9d7813d145cff89ebb',
      bytes: 14713,
      commands: [
        { command: 'npm run assets:items', converted: 13, exitCode: 0 },
        { command: 'npm run assets:items', converted: 4, exitCode: 0 },
        { command: 'npm run assets:items', converted: 1, exitCode: 0 },
      ],
    });
  });

  it('keeps every sealed review sheet and the final native-size comparisons', async () => {
    const evidence = source();
    expect(evidence.review.sizesInspected).toEqual([
      'original',
      512,
      128,
      40,
      28,
      22,
      '28-grayscale',
      '64-circle',
    ]);
    expect(evidence.review.sheets.map((sheet) => sheet.path)).toEqual(
      [
        'master-review-1.webp',
        'master-review-2.webp',
        'master-review-3.webp',
        'master-review-4.webp',
        'shipping-size-review.webp',
        'rug-framing-final.webp',
        'shipping-size-review-final.webp',
      ].map((name) => `${DIR}/${name}`),
    );
    expect(accepted().review.sheets).toEqual(evidence.review.sheets);
    const sizes = [
      [800, 2160],
      [800, 2160],
      [800, 2160],
      [800, 540],
      [440, 1872],
      [800, 512],
      [440, 1872],
    ];
    for (const [index, sheet] of evidence.review.sheets.entries()) {
      expectFilePin(sheet);
      const metadata = await sharp(read(sheet.path)).metadata();
      expect(metadata).toMatchObject({
        format: 'webp',
        width: sizes[index][0],
        height: sizes[index][1],
      });
    }
  });
});
