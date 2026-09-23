// The Euclidean gap from a point to open-world collider footprints, read over
// a cell RANGE (queryOpenWorldColliders), so it is complete at any radius.
// isBlocked reads one cell, complete only up to MAX_BODY_RADIUS
// (collider_cells.ts), and its box push-out measures an OBB's corner region
// square rather than round; a clearance claim wider than that needs this.
import { type Collider, queryOpenWorldColliders } from '../../src/sim/colliders';

/** Gap from (x, z) to a collider's footprint, 0 inside it, in the engine's own
 *  OBB frame (colliders.ts rotates by -rot, three.js rotation.y convention). */
export function colliderGap(c: Collider, x: number, z: number): number {
  if (c.type === 'circle') return Math.max(0, Math.hypot(x - c.x, z - c.z) - c.r);
  const cos = Math.cos(-c.rot);
  const sin = Math.sin(-c.rot);
  const lx = (x - c.x) * cos + (z - c.z) * sin;
  const lz = -(x - c.x) * sin + (z - c.z) * cos;
  return Math.hypot(Math.max(0, Math.abs(lx) - c.hw), Math.max(0, Math.abs(lz) - c.hd));
}

/** The smallest body radius at which the engine's push-out reaches (x, z):
 *  a circle's gap, but an OBB's LARGER local-axis gap, since the push-out
 *  inflates a box by the radius with square corners. What isBlocked tests. */
export function pushOutReach(c: Collider, x: number, z: number): number {
  if (c.type === 'circle') return Math.hypot(x - c.x, z - c.z) - c.r;
  const cos = Math.cos(-c.rot);
  const sin = Math.sin(-c.rot);
  const lx = (x - c.x) * cos + (z - c.z) * sin;
  const lz = -(x - c.x) * sin + (z - c.z) * cos;
  return Math.max(Math.abs(lx) - c.hw, Math.abs(lz) - c.hd);
}

/** Every open-world collider within `reach` of (x, z), nearest first. */
export function collidersWithin(
  seed: number,
  x: number,
  z: number,
  reach: number,
): { collider: Collider; gap: number }[] {
  return queryOpenWorldColliders(seed, x - reach, z - reach, x + reach, z + reach, [])
    .map((collider) => ({ collider, gap: colliderGap(collider, x, z) }))
    .filter((row) => row.gap <= reach)
    .sort((a, b) => a.gap - b.gap);
}
