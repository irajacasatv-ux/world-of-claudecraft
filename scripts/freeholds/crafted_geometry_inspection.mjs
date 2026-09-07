// Diagnostic projection of existing vertices, no asset generation or material claim.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { transformPoint } from './geometry_core.mjs';

await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const assetPath = process.argv[2];
const outputPath = process.argv[3];
if (!assetPath || !outputPath) throw new Error('Pass existing GLB and diagnostic PNG paths');
const document = await io.read(assetPath);
const triangles = [];
document
  .getRoot()
  .getDefaultScene()
  .traverse((node) => {
    const mesh = node.getMesh();
    if (!mesh) return;
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute('POSITION');
      const indices = primitive.getIndices();
      const points = Array.from({ length: position.getCount() }, (_, i) =>
        transformPoint(position.getElement(i, []), node.getWorldMatrix()),
      );
      for (let i = 0; i < indices.getCount(); i += 3) {
        triangles.push([
          points[indices.getScalar(i)],
          points[indices.getScalar(i + 1)],
          points[indices.getScalar(i + 2)],
        ]);
      }
    }
  });
const project = ([x, y, z]) => [(x - z) * Math.SQRT1_2, -(y - (x + z) * 0.28)];
const all = triangles.flat().map(project);
const xs = all.map((point) => point[0]);
const ys = all.map((point) => point[1]);
const minX = Math.min(...xs),
  maxX = Math.max(...xs);
const minY = Math.min(...ys),
  maxY = Math.max(...ys);
const scale = Math.min(360 / (maxX - minX), 360 / (maxY - minY));
triangles.sort(
  (a, b) =>
    a.map((point) => point[0] + point[2]).reduce((x, y) => x + y) -
    b.map((point) => point[0] + point[2]).reduce((x, y) => x + y),
);
const faces = triangles
  .map((triangle) => {
    const [a, b, c] = triangle;
    const v = b.map((value, i) => value - a[i]);
    const w = c.map((value, i) => value - a[i]);
    const n = [v[1] * w[2] - v[2] * w[1], v[2] * w[0] - v[0] * w[2], v[0] * w[1] - v[1] * w[0]];
    const norm = Math.hypot(...n) || 1;
    const shade = Math.round(95 + 60 * Math.abs((n[0] * 0.4 + n[1] * 0.7 + n[2] * 0.3) / norm));
    const points = triangle
      .map((point) => {
        const [x, y] = project(point);
        return `${(x - minX) * scale + 70},${(y - minY) * scale + 55}`;
      })
      .join(' ');
    return `<polygon points="${points}" fill="rgb(${shade + 35},${shade + 15},${shade})" stroke="#29251f" stroke-width="0.25"/>`;
  })
  .join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="490"><rect width="520" height="490" fill="#eeebe5"/>${faces}<text x="20" y="450" fill="#222" font-size="16">${assetPath.split('/').at(-1)}, geometry inspection</text><text x="20" y="473" fill="#555" font-size="12">Diagnostic flat shading, source materials are not reproduced.</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile(outputPath);
