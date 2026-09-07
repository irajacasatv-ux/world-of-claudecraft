import { createHash } from 'node:crypto';
import ts from 'typescript';

export function geometrySourceHash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

// Snapshot once so a decoder and its provenance seal observe identical bytes.
export function createGeometrySourceSnapshot(readBytes) {
  const sources = new Map();
  const capture = (path) => {
    let entry = sources.get(path);
    if (!entry) {
      const bytes = Buffer.from(readBytes(path));
      const seal = Object.freeze({
        path,
        bytes: bytes.byteLength,
        sha256: geometrySourceHash(bytes),
      });
      entry = { bytes, seal };
      sources.set(path, entry);
    }
    return entry;
  };
  return {
    read(path) {
      return capture(path).bytes;
    },
    seal(path) {
      return capture(path).seal;
    },
    assertUnchanged() {
      for (const [path, entry] of sources) {
        const current = readBytes(path);
        if (
          entry.bytes.byteLength !== entry.seal.bytes ||
          geometrySourceHash(entry.bytes) !== entry.seal.sha256 ||
          current.byteLength !== entry.seal.bytes ||
          geometrySourceHash(current) !== entry.seal.sha256
        ) {
          throw new Error(`Geometry source changed during measurement: ${path}`);
        }
      }
    },
  };
}

// Exact accepted factory from the original geometry-measurements artifact.
const ACCEPTED_RUG_FACTORY_SHA256 =
  'ea95a5f4a867496179626d82ad868a2ae12b017df6f43375d502b4ca55fb2ae4';

export function verifiedRugFactory(sourceText) {
  const file = ts.createSourceFile('rift_decor.ts', sourceText, ts.ScriptTarget.Latest, true);
  const factories = file.statements.filter(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === 'buildRug',
  );
  const factory = factories.length === 1 ? factories[0].getText(file) : null;
  if (!factory || geometrySourceHash(factory) !== ACCEPTED_RUG_FACTORY_SHA256) {
    throw new Error('Existing rug recipe changed; review its complete source before measuring');
  }
  return factory;
}
