// No asset source fingerprint hashes the lockfile or package.json.
//
// Every fingerprinted asset family once hashed pnpm-lock.yaml (and Fenbridge
// package.json too), so any dependency or script change moved every family's
// fingerprint. The fix was never a rebuild: a tool swapped the new hash into the
// shipped GLBs in place, geometry untouched, dozens of times, so the stamp named
// a lockfile no GLB was built with and attested nothing. A toolchain change that
// really moves an asset's bytes fails that asset's rebuild or byte checks anyway.
// This walks every fingerprint module (each `source_fingerprint.mjs`, plus the two
// texture fingerprints beside them) and fails if either file comes back, and
// reads every source under scripts/assets for an inline list naming either one.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { expectScansOnlyThroughSharedWalkers } from './helpers/scan_guard_self_audit';
import { sourceFilesUnder } from './helpers/source_files_under';
import { stripComments } from './helpers/strip_comments';

const ASSETS_ROOT = fileURLToPath(new URL('../scripts/assets', import.meta.url));
const TEXTURE_FINGERPRINTS = [
  'eastbrook_town/surface_atlas.mjs',
  'fenbridge_town/support_maps.mjs',
];
const FORBIDDEN = ['pnpm-lock.yaml', 'package.json'];

const modules = sourceFilesUnder(ASSETS_ROOT)
  .map(({ file }) => file)
  .filter((file) => file.endsWith('/source_fingerprint.mjs') || TEXTURE_FINGERPRINTS.includes(file))
  .sort();

async function sourceLists(file: string): Promise<[string, readonly string[]][]> {
  const mod = (await import(pathToFileURL(path.join(ASSETS_ROOT, file)).href)) as Record<
    string,
    unknown
  >;
  const lists = Object.entries(mod).filter(([name]) => /_SOURCE_FILES$/.test(name));
  for (const [name, list] of lists) {
    // A malformed list fails here rather than leaving the scan.
    expect(
      Array.isArray(list) && list.every((item) => typeof item === 'string'),
      `${file} ${name}`,
    ).toBe(true);
  }
  return lists as [string, readonly string[]][];
}

// The forbidden inputs in one list, matched after normalization so `./pnpm-lock.yaml`
// or `scripts/../package.json` cannot slip past.
function forbiddenInputs(list: readonly string[]): string[] {
  return list.filter((input) => FORBIDDEN.includes(path.posix.normalize(input)));
}

// A family can also hash its inputs inline: the Buried Hoard reward chest and
// orbital lightning builds list them inside their own sourceFingerprint, not as
// an exported *_SOURCE_FILES list, so the per-list scan never saw them hash the
// lockfile. This reads every string literal in a source, comments stripped, and
// flags one that names either file, alone or as a path's last segment.
function forbiddenLiterals(source: string): string[] {
  const hits: string[] = [];
  for (const [, , text] of stripComments(source).matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    const normalized = path.posix.normalize(text);
    if (FORBIDDEN.some((name) => normalized === name || normalized.endsWith(`/${name}`)))
      hits.push(text);
  }
  return hits;
}

describe('asset fingerprint inputs', () => {
  it('finds every fingerprint module, each with its source list', async () => {
    expect(modules.length).toBeGreaterThanOrEqual(11);
    for (const file of TEXTURE_FINGERPRINTS) expect(modules).toContain(file);
    for (const file of modules) {
      expect((await sourceLists(file)).length, file).toBeGreaterThan(0);
    }
  });

  it('hashes neither the lockfile nor package.json in any family', async () => {
    const offenders: string[] = [];
    for (const file of modules) {
      for (const [name, list] of await sourceLists(file)) {
        for (const input of forbiddenInputs(list)) offenders.push(`${file} ${name}: ${input}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('flags each forbidden input however it is spelled (positive control)', () => {
    expect(
      forbiddenInputs([
        'scripts/assets/build_assets.mjs',
        './pnpm-lock.yaml',
        'scripts/../package.json',
        'package.json',
      ]),
    ).toEqual(['./pnpm-lock.yaml', 'scripts/../package.json', 'package.json']);
  });

  it('names neither file in any source under scripts/assets, inline lists included', () => {
    const offenders: string[] = [];
    const sources = sourceFilesUnder(ASSETS_ROOT).map(({ file }) => file);
    expect(sources).toContain('reward_chest/build.mjs');
    expect(sources).toContain('orbital_lightning/build.mjs');
    for (const file of sources) {
      const source = readFileSync(path.join(ASSETS_ROOT, file), 'utf8');
      for (const hit of forbiddenLiterals(source)) offenders.push(`${file}: ${hit}`);
    }
    expect(offenders).toEqual([]);
  });

  it('flags an inline literal however it is quoted or joined (positive control)', () => {
    expect(
      forbiddenLiterals(
        [
          "for (const file of [SOURCE, 'pnpm-lock.yaml']) {}",
          'read(path.join(root, "package.json"));',
          'read(`${root}/scripts/../pnpm-lock.yaml`);',
          "// 'pnpm-lock.yaml' in a comment is not an input",
          "const ok = ['my-package.json.bak', 'scripts/assets/build_assets.mjs'];",
        ].join('\n'),
      ),
    ).toEqual(['pnpm-lock.yaml', 'package.json', '${root}/scripts/../pnpm-lock.yaml']);
  });

  it('scans only through the shared walker', () => {
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['source_files_under']);
  });
});
