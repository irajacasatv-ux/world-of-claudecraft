export function geometrySourceHash(bytes: string | Uint8Array): string;
export function createGeometrySourceSnapshot(readBytes: (path: string) => Uint8Array): {
  read(path: string): Buffer;
  seal(path: string): Readonly<{ path: string; bytes: number; sha256: string }>;
  assertUnchanged(): void;
};
export function verifiedRugFactory(sourceText: string): string;
