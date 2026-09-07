// Offline arithmetic over decoded vertices, never a runtime placement policy.
export function boundsOf(points) {
  if (!points.length) throw new Error('Geometry has no vertices');
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const point of points) {
    if (point.length !== 3 || point.some((value) => !Number.isFinite(value))) {
      throw new Error('Geometry has an invalid vertex');
    }
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], point[axis]);
      max[axis] = Math.max(max[axis], point[axis]);
    }
  }
  return { min, max, size: max.map((value, axis) => value - min[axis]) };
}

export function transformPoint(point, matrix) {
  if (matrix.length !== 16 || matrix.some((value) => !Number.isFinite(value))) {
    throw new Error('Geometry has an invalid transform');
  }
  const [x, y, z] = point;
  const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  if (w !== 1) throw new Error('Expected an affine model transform');
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

export function placementProposal(points, { scale, pitch, underlay = false, floorLift = 0 }) {
  const scaleVector = typeof scale === 'number' ? [scale, scale, scale] : scale;
  if (
    !Array.isArray(scaleVector) ||
    scaleVector.length !== 3 ||
    !scaleVector.every((value) => Number.isFinite(value) && value > 0) ||
    !(Number.isFinite(pitch) && pitch > 0 && Number.isFinite(floorLift) && floorLift >= 0)
  ) {
    throw new Error('Scale and grid pitch must be positive finite values');
  }
  const sourceBounds = boundsOf(points);
  const centerX = (sourceBounds.min[0] + sourceBounds.max[0]) / 2;
  const centerZ = (sourceBounds.min[2] + sourceBounds.max[2]) / 2;
  const translation = [-centerX, -sourceBounds.min[1], -centerZ];
  const transformed = points.map((point) =>
    point.map(
      (value, axis) =>
        (value + translation[axis]) * scaleVector[axis] + (axis === 1 ? floorLift : 0),
    ),
  );
  const bounds = boundsOf(transformed);
  const measuredRadius = Math.max(...transformed.map(([x, , z]) => Math.hypot(x, z)));
  const r = underlay ? 0 : Math.ceil(measuredRadius / pitch) * pitch;
  const footprint = {
    width: Math.ceil(bounds.size[0] / pitch),
    depth: Math.ceil(bounds.size[2] / pitch),
  };
  const quarterTurnBounds = boundsOf(transformed.map(([x, y, z]) => [z, y, -x]));
  return {
    translationBeforeScale: translation,
    scale: scaleVector,
    postScaleTranslation: [0, floorLift, 0],
    yaw: 0,
    bounds,
    intendedWorldHeight: bounds.size[1],
    measuredVertexRadius: measuredRadius,
    conservativeBoxRadius: Math.hypot(bounds.size[0] / 2, bounds.size[2] / 2),
    footprint,
    r,
    collisionClass: underlay ? 'walk_through_underlay' : 'solid',
    circleSlack: underlay ? null : r - measuredRadius,
    envelopeSlack: [
      footprint.width * pitch - bounds.size[0],
      footprint.depth * pitch - bounds.size[2],
    ],
    fixtures: {
      finitePositiveFootprint: footprint.width > 0 && footprint.depth > 0,
      vertexEnvelopeContained: transformed.every(
        ([x, , z]) =>
          Math.abs(x) <= (footprint.width * pitch) / 2 &&
          Math.abs(z) <= (footprint.depth * pitch) / 2,
      ),
      solidVertexRadiusContained:
        underlay || transformed.every(([x, , z]) => Math.hypot(x, z) <= r),
      quarterTurnSwapsFootprint: {
        width: Math.ceil(quarterTurnBounds.size[0] / pitch),
        depth: Math.ceil(quarterTurnBounds.size[2] / pitch),
      },
    },
  };
}

export function decorProposal(metrics, reference) {
  for (const key of ['triangles', 'primitives', 'materials', 'decodedGeometryBytes']) {
    if (
      !(
        Number.isFinite(metrics[key]) &&
        metrics[key] >= 0 &&
        Number.isFinite(reference[key]) &&
        reference[key] > 0
      )
    ) {
      throw new Error(`Invalid comparative render metric: ${key}`);
    }
  }
  const components = Object.fromEntries(
    ['triangles', 'primitives', 'materials', 'decodedGeometryBytes'].map((key) => [
      key,
      metrics[key] / reference[key],
    ]),
  );
  return { components, decorCost: Math.max(1, Math.ceil(Math.max(...Object.values(components)))) };
}
