import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FARM_PROPS_REPO_ROOT = path.resolve(HERE, '..', '..', '..');

// No reference image exists: this set is procedural first, so the pinned inputs
// are the authoring modules, the optimizer specification and the optimizer itself.
// Not the lockfile: a stamp swapped in place over a lockfile move attested no rebuild,
// and a toolchain change that moves the bytes fails the byte pins anyway.
export const FARM_PROPS_SOURCE_FILES = Object.freeze([
  'scripts/assets/farm_props/model.js',
  'scripts/assets/farm_props/export_entry.js',
  'scripts/assets/farm_props/export_farm_props.mjs',
  'scripts/assets/farm_props/source_fingerprint.mjs',
  'scripts/assets/farm_props/source_fingerprint.d.mts',
  'scripts/assets/specs/farm_props.json',
  'scripts/assets/build_assets.mjs',
]);

function lengthDelimiter(byteLength) {
  const delimiter = Buffer.alloc(8);
  delimiter.writeBigUInt64BE(BigInt(byteLength));
  return delimiter;
}

export function farmPropsSourceFingerprint(repoRoot = FARM_PROPS_REPO_ROOT) {
  const hash = createHash('sha256');
  for (const relativePath of FARM_PROPS_SOURCE_FILES) {
    const pathBytes = Buffer.from(relativePath, 'utf8');
    const fileBytes = readFileSync(path.join(repoRoot, relativePath));
    hash.update(lengthDelimiter(pathBytes.byteLength));
    hash.update(pathBytes);
    hash.update(lengthDelimiter(fileBytes.byteLength));
    hash.update(fileBytes);
  }
  return hash.digest('hex');
}
