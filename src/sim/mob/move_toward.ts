// Shared one-tick mover for mobs, pets, delve companions and feared players
// (the M2 locomotion seam). Moved verbatim out of the Sim coordinator: the body
// reads only ctx.mobCanSwim, ctx.resolveMovePoint and ctx.cfg.seed, so every
// consumer keeps calling ctx.moveToward and Sim keeps a thin same-named
// delegate for its two internal callers. Draws no rng.

import { MOBS } from '../data';
import { PLAYER_BODY_RADIUS, PLAYER_MAX_CLIMB_SLOPE, PLAYER_SWIM_DEPTH } from '../pathfind';
import { floorHeightAt } from '../physics/character';
import { swimSurfaceY } from '../player_motion';
import type { SimContext } from '../sim_context';
import { angleTo, DT, dist2d, type Entity, type Vec3 } from '../types';
import { groundHeight, nearSteepWalls, terrainSteepnessAt, waterLevelAt } from '../world';

// The three sim.ts aliases the body reads, re-derived from the same sources.
const SWIM_DEPTH = PLAYER_SWIM_DEPTH; // ground this far under the water line = deep water
const BODY_RADIUS = PLAYER_BODY_RADIUS;
const MAX_CLIMB_SLOPE = PLAYER_MAX_CLIMB_SLOPE;
// Heading offsets (radians) a mob tries when its straight path is blocked, so it
// can slide around a prop instead of pinning on it. Desired heading (0) first;
// only evaluated past the first entry when that straight step is obstructed.
const MOVE_SLIDE_FAN = [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6];

// Step `e` one tick toward `dest`. With `ignoreObstacles`, the mover phases
// straight through props, used to free a stuck evader, and forced on for
// templates flagged `phasesThroughObstacles` (mountain-sized world bosses
// that must never wedge on a collider mid-chase). Returns true on arrival.
export function moveToward(
  ctx: SimContext,
  e: Entity,
  dest: Vec3,
  speed: number,
  ignoreObstacles = false,
): boolean {
  if (!ignoreObstacles && MOBS[e.templateId]?.phasesThroughObstacles) ignoreObstacles = true;
  const d = dist2d(e.pos, dest);
  if (d < 0.3) return true;
  const desired = angleTo(e.pos, dest);
  e.facing = desired;
  const step = Math.min(speed * DT, d);
  const canSwim = ctx.mobCanSwim(MOBS[e.templateId]);

  if (ignoreObstacles) {
    const nx = e.pos.x + Math.sin(desired) * step;
    const nz = e.pos.z + Math.cos(desired) * step;
    e.pos.x = nx;
    e.pos.z = nz;
    const g = groundHeight(nx, nz, ctx.cfg.seed);
    e.pos.y = Math.max(g, swimSurfaceY(nx, nz, ctx.cfg.seed)); // ride the surface while phasing, don't sink under terrain/water
    return d - step < 0.3;
  }
  // Mobs have no nav mesh. Try the straight path first; only if a prop or the
  // waterline eats it do we fan the heading out and take the best slide AROUND
  // the obstacle. That lets a mob round the camp props to reach its target
  // instead of pinning on them. Open-ground movers take the first branch.
  let bestX = e.pos.x,
    bestZ = e.pos.z,
    bestProgress = 1e-3;
  // Swimmers ride the water surface, so slope checks clamp submerged ground
  // to the waterline (a sloped lake bed is not a wall; see pathfind rideHeight).
  // The waterline itself is terrain/feature-aware: outside a declared lake's
  // footprint there is no waterline at all, so a dry sunken feature never
  // reads as a shore.
  const ride = (x: number, z: number, h: number): number => {
    const wl = waterLevelAt(x, z, ctx.cfg.seed);
    return canSwim && h < wl ? wl : h;
  };
  let h0 = Number.NaN; // lazily sampled: only steep cells pay for heights
  for (const off of MOVE_SLIDE_FAN) {
    const a = desired + off;
    const nx = e.pos.x + Math.sin(a) * step;
    const nz = e.pos.z + Math.cos(a) * step;
    // landlocked creatures stop at the waterline instead of walking under it
    if (
      !canSwim &&
      groundHeight(nx, nz, ctx.cfg.seed) < waterLevelAt(nx, nz, ctx.cfg.seed) - SWIM_DEPTH
    ) {
      continue;
    }
    // Mobs, pets, and feared players obey the wall rule too: no uphill step
    // onto unwalkably steep ground. Screened to the wall bands so the hot
    // open-world fan pays nothing; inside a band the memoized cell steepness
    // screens next, and only actual wall cells pay for exact heights. This
    // is a NEW gate for these movers, so the finer per-step cliff check
    // players get is not replicated here.
    if (nearSteepWalls(nx, nz) && terrainSteepnessAt(nx, nz, ctx.cfg.seed) > MAX_CLIMB_SLOPE) {
      if (Number.isNaN(h0))
        h0 = ride(e.pos.x, e.pos.z, groundHeight(e.pos.x, e.pos.z, ctx.cfg.seed));
      if (ride(nx, nz, groundHeight(nx, nz, ctx.cfg.seed)) > h0) continue;
    }
    // The Great Maze's hedge walls are hard for mobs too (the maze patrol
    // knights pace their dead ends instead of drifting through a hedge).
    // resolveMovePoint now does that on its own: the hedges are real collider
    // boxes, so this no longer needs its own segment test, and keeping one
    // would reject every candidate for a body that ever ended up inside a
    // hedge, leaving it stuck instead of letting the push-out carry it clear.
    const r = ctx.resolveMovePoint(nx, nz, BODY_RADIUS, e);
    const progress = d - Math.hypot(r.x - dest.x, r.z - dest.z);
    if (progress > bestProgress) {
      bestProgress = progress;
      bestX = r.x;
      bestZ = r.z;
    }
    if (off === 0 && progress >= step - 1e-3) break; // straight path is clear
  }
  e.pos.x = bestX;
  e.pos.z = bestZ;
  // The floor a body rests on, which for a PLAYER includes the standable prop
  // top underfoot, not just the terrain. Feared players are moved through here
  // and return early from the player step, so `stepPlayerMotion` and its whole
  // vertical pass never run for the duration: snapping to raw terrain dropped
  // anyone feared off a rampart deck several yards INSIDE the rampart, where
  // swept collision then refused every direction once the fear ended (from
  // inside a volume every direction is a surface). Same expression the vertical
  // pass and climb.ts already land against.
  //
  // Scoped to players deliberately: mobs and pets keep the terrain snap they
  // have always had, so their movement, and the parity draw order with it, is
  // untouched.
  const g =
    e.kind === 'player'
      ? floorHeightAt(ctx.cfg.seed, bestX, bestZ, BODY_RADIUS, e.pos.y + 1e-3)
      : groundHeight(bestX, bestZ, ctx.cfg.seed);
  e.pos.y =
    canSwim && g < waterLevelAt(bestX, bestZ, ctx.cfg.seed) - SWIM_DEPTH
      ? swimSurfaceY(bestX, bestZ, ctx.cfg.seed)
      : g;
  return dist2d(e.pos, dest) < 0.3;
}
