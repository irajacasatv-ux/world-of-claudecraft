import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import { ITEM_ART_PENDING, ITEM_IMAGE_IDS, itemImageUrl } from '../src/ui/icons';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = 'docs/freeholds/content-art-2026-09-07';
const manifestPath = `${evidenceDir}/items.accepted-art.json`;
const batchId = 'freehold-vendor-basics-2026-09-07';
const acceptedPins = [
  ['freehold_timber_bed', '91afbb705212784a0a489c27950ffdfec9bd102c2b3b4450f2f93e7108052487', 2302],
  [
    'freehold_round_table',
    'def32f5a936310c04a6b535538ef86c2a5be7887188fb762f57b3340c492f038',
    2380,
  ],
  [
    'freehold_spindle_chair',
    'b4f80bdfb3d0a45898e1f4df8dce2256b7777e49f8f89d1c1094d78ce59468ca',
    2356,
  ],
  ['freehold_low_stool', '624759c6060b2b1eff30fdeef7ddb4bad55c3e5787c495a583c2e4b0baf0806b', 1750],
  ['freehold_woven_rug', 'af2b3c7ca1f3c09c2c39663746ab1815b8ce99276c3e55903629e1b99c8412db', 3952],
  [
    'freehold_brass_lantern',
    'b2f6dc49f9cf68b6f125395b6d8a1c64f6d23623b3f4c12368a7582f8a36faf5',
    2346,
  ],
  [
    'freehold_storage_chest',
    '4362f9f0492d4c2575b9fb0cc9f57eea4ac0d5a4387abfe4508c94b2504654a1',
    2154,
  ],
  [
    'freehold_open_bookshelf',
    '70181eb0c4bc065f6a079e54697e2e8e3cd051e12bf1c4a3d9cb6ab2febd7531',
    2292,
  ],
] as const;
const itemIds = acceptedPins.map(([id]) => id);

type FilePin = { path: string; sha256: string; bytes: number };
type Asset = {
  id: string;
  name: string;
  kind: string;
  runtimeUrl: string;
  shipping: FilePin & {
    width: number;
    height: number;
    format: string;
    colourspace: string;
    minAlpha: number;
    maxAlpha: number;
  };
  originalSha256: string;
  masterSha256: string;
  sourceRecord: string;
};
type Manifest = {
  schemaVersion: number;
  batchId: string;
  generator: string;
  executionHarness: string;
  owner: string;
  license: string;
  styleContract: string;
  sourceEvidence: FilePin;
  targetSets: { items: string[] };
  processing: { method: string; converter: string };
  review: { sizesInspected: Array<number | string>; sheet: FilePin };
  assets: Asset[];
};

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

function expectFilePin(pin: FilePin): Buffer {
  const bytes = readFileSync(path.join(repoRoot, pin.path));
  expect(bytes.length, pin.path).toBe(pin.bytes);
  expect(sha256(bytes), pin.path).toBe(pin.sha256);
  return bytes;
}

describe('Freehold furnishing art admission', () => {
  it('retains the exact original prompts, intake lineage, and measured review sheet', () => {
    const manifest = readJson<Manifest>(manifestPath);
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      batchId,
      executionHarness: 'Codex',
      generator: 'OpenAI built-in image generation',
      owner: 'World of ClaudeCraft',
      license: 'World of ClaudeCraft project-generated art, project asset, rights reserved',
      styleContract: 'woc-item-icon-v1',
      sourceEvidence: {
        path: `${evidenceDir}/staged-art.json`,
        sha256: 'ab5775303392caef317616fce02e2fa63bcca6f3d20545ebe7faaf2de1b6c63d',
        bytes: 29769,
      },
    });
    expectFilePin(manifest.sourceEvidence);
    expect(manifest.targetSets.items).toEqual(itemIds);
    expect(manifest.assets.map(({ id }) => id)).toEqual(itemIds);
    expect(manifest.processing.converter).toBe('scripts/convert_item_icons_webp.mjs');
    expect(manifest.processing.method).toContain('Byte-identical promotion');
    expect(manifest.review.sizesInspected).toEqual([
      512,
      128,
      40,
      28,
      22,
      '28-grayscale',
      '64-circle',
    ]);
    expect(manifest.review.sheet).toEqual({
      path: `${evidenceDir}/size-review.webp`,
      sha256: 'a9c606589ffb8d0c5efb76a25274c3be068cdb022e9a072c4bf697ee24e671fa',
      bytes: 65006,
    });
    expectFilePin(manifest.review.sheet);

    const staged = readJson<{
      assets: Array<{
        id: string;
        name: string;
        prompt: string;
        original: FilePin;
        master: FilePin;
        candidate: FilePin;
      }>;
    }>(manifest.sourceEvidence.path);
    expect(staged.assets.map(({ id }) => id)).toEqual(itemIds);
    expect(new Set(staged.assets.map(({ prompt }) => prompt)).size).toBe(8);
    for (const [index, asset] of manifest.assets.entries()) {
      const intake = staged.assets[index];
      expect(intake.prompt).toContain(`Primary request: paint ${asset.name} (${asset.id}).`);
      expect(asset.sourceRecord).toBe(`${manifest.sourceEvidence.path}#assets:${asset.id}`);
      expect(asset.originalSha256).toBe(intake.original.sha256);
      expect(asset.masterSha256).toBe(intake.master.sha256);
      expect(asset.shipping.sha256).toBe(intake.candidate.sha256);
      expect(asset.shipping.bytes).toBe(intake.candidate.bytes);
    }
  });

  it('gives the eight paintings one current owner without changing dated visual verdicts', () => {
    const mapping = readJson<{
      entries: Array<{ itemId: string }>;
      generatedBatches: Array<{ batchId: string; itemIds: string[]; provenanceRecord?: string }>;
    }>('public/ui/items/mapping.json');
    const batches = mapping.generatedBatches.filter((batch) => batch.batchId === batchId);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({
      itemIds,
      provenanceRecord: manifestPath,
      source: 'OpenAI built-in image generation executed by Codex',
      owner: 'World of ClaudeCraft',
      license: 'World of ClaudeCraft project-generated art, project asset, rights reserved',
      styleContract: {
        id: 'woc-item-icon-v1',
        document: 'docs/design/item-icon-art-style.md',
      },
    });
    for (const id of itemIds) {
      expect([
        ...mapping.entries.filter(({ itemId }) => itemId === id),
        ...mapping.generatedBatches.filter(({ itemIds: ids }) => ids.includes(id)),
      ]).toHaveLength(1);
    }
    const dated = readJson<{ visualVerdict: { passIds: string[] } }>(
      'docs/achievements/masterwrought-art-completion-2026-09-02/final-item-art-audit-verdict.json',
    );
    expect(dated.visualVerdict.passIds).toHaveLength(1255);
    expect(
      dated.visualVerdict.passIds.filter((id) => itemIds.some((itemId) => itemId === id)),
    ).toEqual([]);
  });

  it.each(acceptedPins)('serves the accepted opaque painting for %s', async (id, hash, length) => {
    const manifest = readJson<Manifest>(manifestPath);
    const asset = manifest.assets.find((entry) => entry.id === id);
    expect(asset).toBeDefined();
    if (!asset) throw new Error(`Missing furnishing art acceptance: ${id}`);
    expect(asset).toMatchObject({
      id,
      name: ITEMS[id].name,
      kind: 'item',
      runtimeUrl: `/ui/items/${id}.webp`,
      shipping: {
        path: `public/ui/items/${id}.webp`,
        sha256: hash,
        bytes: length,
        width: 128,
        height: 128,
        format: 'webp',
        colourspace: 'srgb',
        minAlpha: 255,
        maxAlpha: 255,
      },
    });
    expect(ITEMS[id].kind).toBe('furnishing');
    expect(ITEM_IMAGE_IDS.has(id)).toBe(true);
    expect(ITEM_ART_PENDING.has(id)).toBe(false);
    expect(itemImageUrl(id)).toBe(`/ui/items/${id}.webp`);
    const bytes = expectFilePin(asset.shipping);
    expect(bytes.length).toBeLessThanOrEqual(15_360);
    const metadata = await sharp(bytes).metadata();
    expect(metadata).toMatchObject({ width: 128, height: 128, format: 'webp', space: 'srgb' });
    const alpha = await sharp(bytes).ensureAlpha().extractChannel('alpha').raw().toBuffer();
    expect(
      alpha.every((value) => value === 255),
      `${id} must be fully opaque`,
    ).toBe(true);
  });
});
