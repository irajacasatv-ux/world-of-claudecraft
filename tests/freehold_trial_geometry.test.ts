import { describe, expect, it } from 'vitest';
import {
  boundsOf,
  decorProposal,
  placementProposal,
  transformPoint,
} from '../scripts/freeholds/geometry_core.mjs';
import {
  createGeometrySourceSnapshot,
  geometrySourceHash,
  verifiedRugFactory,
} from '../scripts/freeholds/geometry_source.mjs';

const ACCEPTED_RUG_FACTORY = `function buildRug(color: number): THREE.Mesh {
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 26).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.85 }),
  );
  rug.position.y = 0.02;
  rug.renderOrder = 1;
  return rug;
}`;

describe('development furnishing geometry evidence', () => {
  it('applies encoded node scale and translation before measuring physical bounds', () => {
    const matrix = [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 10, 20, 30, 1];
    expect(transformPoint([1, -2, 3], matrix)).toEqual([12, 14, 42]);
    expect(
      boundsOf([
        [12, 14, 42],
        [8, 26, 18],
      ]),
    ).toEqual({
      min: [8, 14, 18],
      max: [12, 26, 42],
      size: [4, 12, 24],
    });
  });

  it('seats and centers offset solids while enclosing corners beyond half the long side', () => {
    const result = placementProposal(
      [
        [8, 3, 19],
        [12, 7, 21],
      ],
      { scale: 2, pitch: 1 },
    );
    expect(result.translationBeforeScale).toEqual([-10, -3, -20]);
    expect(result.bounds).toEqual({ min: [-4, 0, -2], max: [4, 8, 2], size: [8, 8, 4] });
    expect(result.footprint).toEqual({ width: 8, depth: 4 });
    expect(result.r).toBe(5);
    expect(result.measuredVertexRadius).toBe(Math.sqrt(20));
    expect(result.fixtures.solidVertexRadiusContained).toBe(true);
    expect(result.fixtures.quarterTurnSwapsFootprint).toEqual({ width: 4, depth: 8 });
  });

  it('rounds a measured overhang outward without hiding it in an epsilon', () => {
    const result = placementProposal(
      [
        [-1.00000001, 0, -0.5],
        [1, 1, 0.5],
      ],
      { scale: 1, pitch: 0.5 },
    );
    expect(result.footprint).toEqual({ width: 5, depth: 2 });
    expect(result.envelopeSlack[0]).toBeGreaterThan(0.49);
    expect(result.fixtures.vertexEnvelopeContained).toBe(true);
  });

  it('retains an explicit walk-through class and source floor lift under a nonuniform rug transform', () => {
    const result = placementProposal(
      [
        [-4, 0, -13],
        [4, 0, 13],
      ],
      {
        scale: [0.25, 1, 2 / 13],
        pitch: 0.5,
        underlay: true,
        floorLift: 0.02,
      },
    );
    expect(result.bounds).toEqual({ min: [-1, 0.02, -2], max: [1, 0.02, 2], size: [2, 0, 4] });
    expect(result.footprint).toEqual({ width: 4, depth: 8 });
    expect(result.r).toBe(0);
    expect(result.collisionClass).toBe('walk_through_underlay');
  });

  it('prices the largest measured cost ratio with a positive floor even for a two-triangle underlay', () => {
    const reference = { triangles: 200, primitives: 1, materials: 1, decodedGeometryBytes: 1000 };
    expect(decorProposal({ ...reference, triangles: 401 }, reference).decorCost).toBe(3);
    expect(
      decorProposal(
        { triangles: 0, primitives: 0, materials: 0, decodedGeometryBytes: 0 },
        reference,
      ).decorCost,
    ).toBe(1);
    expect(
      decorProposal({ ...reference, triangles: 2, decodedGeometryBytes: 20 }, reference).decorCost,
    ).toBe(1);
    expect(decorProposal({ ...reference, materials: 4 }, reference).decorCost).toBe(4);
    expect(decorProposal({ ...reference, primitives: 5 }, reference).decorCost).toBe(5);
    expect(decorProposal({ ...reference, decodedGeometryBytes: 4001 }, reference).decorCost).toBe(
      5,
    );
  });

  it('refuses missing geometry, invalid transforms and unusable tuning bases', () => {
    expect(() => boundsOf([])).toThrow('no vertices');
    expect(() => boundsOf([[Infinity, 0, 0]])).toThrow('invalid vertex');
    expect(() => transformPoint([0, 0, 0], [1])).toThrow('invalid transform');
    expect(() => transformPoint([0, 0, 0], Array(16).fill(NaN))).toThrow('invalid transform');
    expect(() => transformPoint([0, 0, 0], Array(16).fill(0))).toThrow('affine');
    expect(() => placementProposal([[0, 0, 0]], { scale: 0, pitch: 1 })).toThrow('positive finite');
    expect(() => placementProposal([[0, 0, 0]], { scale: 1, pitch: NaN })).toThrow(
      'positive finite',
    );
    expect(() => placementProposal([[0, 0, 0]], { scale: 1, pitch: 1, floorLift: NaN })).toThrow(
      'positive finite',
    );
    expect(() => decorProposal({ triangles: 1 }, { triangles: 0 })).toThrow('Invalid comparative');
    const valid = { triangles: 200, primitives: 1, materials: 1, decodedGeometryBytes: 1000 };
    for (const key of ['triangles', 'primitives', 'materials', 'decodedGeometryBytes']) {
      expect(() => decorProposal({ ...valid, [key]: NaN }, valid)).toThrow(
        `Invalid comparative render metric: ${key}`,
      );
      expect(() => decorProposal(valid, { ...valid, [key]: 0 })).toThrow(
        `Invalid comparative render metric: ${key}`,
      );
    }
  });

  it('seals the exact cached decode buffer and detects same-length source replacement before emission', () => {
    let disk = Buffer.from('original');
    let reads = 0;
    const snapshot = createGeometrySourceSnapshot(() => {
      reads++;
      return disk;
    });
    const decodedBytes = snapshot.read('model.glb');
    disk = Buffer.from('replaced');
    expect(snapshot.read('model.glb')).toBe(decodedBytes);
    expect(snapshot.seal('model.glb')).toEqual({
      path: 'model.glb',
      bytes: 8,
      sha256: geometrySourceHash(Buffer.from('original')),
    });
    expect(reads).toBe(1);
    expect(() => snapshot.assertUnchanged()).toThrow(
      'Geometry source changed during measurement: model.glb',
    );
  });

  it('checks every captured source and also refuses a mutated decoder buffer', () => {
    const files = new Map([
      ['model.glb', Buffer.from('model')],
      ['source.ts', Buffer.from('source')],
    ]);
    const snapshot = createGeometrySourceSnapshot((path) => {
      const bytes = files.get(path);
      if (!bytes) throw new Error(`Missing fixture: ${path}`);
      return bytes;
    });
    snapshot.read('model.glb');
    snapshot.seal('source.ts');
    expect(() => snapshot.assertUnchanged()).not.toThrow();
    files.set('source.ts', Buffer.from('modified source'));
    expect(() => snapshot.assertUnchanged()).toThrow('source.ts');
    files.set('source.ts', Buffer.from('source'));
    snapshot.read('model.glb')[0] = 0;
    expect(() => snapshot.assertUnchanged()).toThrow('model.glb');
  });

  it('accepts only the complete recorded rug factory, including a unique declaration', () => {
    expect(geometrySourceHash(ACCEPTED_RUG_FACTORY)).toBe(
      'ea95a5f4a867496179626d82ad868a2ae12b017df6f43375d502b4ca55fb2ae4',
    );
    expect(verifiedRugFactory(`// existing module context\n${ACCEPTED_RUG_FACTORY}\n`)).toBe(
      ACCEPTED_RUG_FACTORY,
    );
    expect(() => verifiedRugFactory(`${ACCEPTED_RUG_FACTORY}\n${ACCEPTED_RUG_FACTORY}`)).toThrow(
      'complete source',
    );
    expect(() => verifiedRugFactory('')).toThrow('complete source');
    expect(() => verifiedRugFactory(`/* ${ACCEPTED_RUG_FACTORY} */`)).toThrow('complete source');
  });

  it.each([
    'rug.scale.setScalar(2);',
    'rug.add(new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3)));',
    'rug.geometry.translate(8, 0, 0);',
  ])('refuses a changed rug factory when all old fragments remain: %s', (mutation) => {
    const changed = ACCEPTED_RUG_FACTORY.replace('  return rug;', `  ${mutation}\n  return rug;`);
    expect(changed).toContain('new THREE.PlaneGeometry(8, 26).rotateX(-Math.PI / 2)');
    expect(changed).toContain('rug.position.y = 0.02;');
    expect(changed).toContain(
      'new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.85 })',
    );
    expect(() => verifiedRugFactory(changed)).toThrow('complete source');
  });
});
