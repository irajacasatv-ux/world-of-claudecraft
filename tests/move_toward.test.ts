// Direct unit tests for src/sim/mob/move_toward.ts (the one-tick mover moved
// verbatim off the Sim coordinator). The body is exercised in ISOLATION against
// a fake SimContext that owns only the three members it reads (mobCanSwim,
// resolveMovePoint, cfg.seed), proving the module needs no Sim; terrain and
// water come from the real world helpers at a known dry spot, so the two
// terrain gates are inert and the resolver alone decides what is blocked. A
// second spot, the deep heart of a lake, turns the waterline gate on for the
// swimming arms.

import { describe, expect, it, vi } from 'vitest';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { moveToward } from '../src/sim/mob/move_toward';
import { PLAYER_BODY_RADIUS, PLAYER_MAX_CLIMB_SLOPE, PLAYER_SWIM_DEPTH } from '../src/sim/pathfind';
import { swimSurfaceY } from '../src/sim/player_motion';
import type { SimContext } from '../src/sim/sim_context';
import { angleTo, DT, type Entity, type Vec3 } from '../src/sim/types';
import { groundHeight, nearSteepWalls, terrainSteepnessAt, waterLevelAt } from '../src/sim/world';

const SEED = 42;
// Open ground clear of the built-in lake, the sea and every collider (the
// tests/mob_locomotion.test.ts dry spot); the first test proves neither gate
// skips a fan entry here, so the resolver fake is the only obstacle.
const ORIGIN: Vec3 = { x: 30, y: 0, z: 40 };
// The deep heart of a declared Deepfen lake (zone2.ts, the {x: 60, z: 380}
// carve): the bed sits well under the waterline, so every fan candidate from
// here is deep water and the waterline gate decides; no wall band is near.
const DEEP: Vec3 = { x: 60, y: 0, z: 380 };
const SPEED = 4; // yd/s: a 0.2 yd step per tick
const STEP = SPEED * DT;
// The module's slide fan, restated: desired heading first, then the slides.
const FAN = [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6];

type Resolver = (nx: number, nz: number, r: number, e: Entity) => { x: number; z: number };

function makeCtx(resolve: Resolver, canSwim = false) {
  const resolveMovePoint = vi.fn(resolve);
  const ctx = {
    cfg: { seed: SEED },
    mobCanSwim: () => canSwim,
    resolveMovePoint,
  } as unknown as SimContext;
  return { ctx, resolveMovePoint };
}

const moverAt = (at: Vec3, template = MOBS.forest_wolf): Entity =>
  createMob(1, template, 5, { ...at });
const mover = (): Entity => moverAt(ORIGIN);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
// The fan candidate for `off`, from `from` toward `dest`, the body's own arithmetic.
const candidateFrom = (from: Vec3, dest: Vec3, off: number) => {
  const a = angleTo(from, dest) + off;
  return { x: from.x + Math.sin(a) * STEP, z: from.z + Math.cos(a) * STEP };
};
const candidate = (dest: Vec3, off: number) => candidateFrom(ORIGIN, dest, off);
const blocked = () => ({ x: ORIGIN.x, z: ORIGIN.z }); // zero progress: the mover stays
const clear: Resolver = (nx, nz) => ({ x: nx, z: nz });

describe('mob/move_toward.ts in isolation', () => {
  const dest: Vec3 = { x: ORIGIN.x + 10, y: 0, z: ORIGIN.z };

  it('the dry spot is open ground: no fan entry is gated by water or a steep wall', () => {
    for (const off of FAN) {
      const c = candidate(dest, off);
      const deepWater =
        groundHeight(c.x, c.z, SEED) < waterLevelAt(c.x, c.z, SEED) - PLAYER_SWIM_DEPTH;
      const wall =
        nearSteepWalls(c.x, c.z) && terrainSteepnessAt(c.x, c.z, SEED) > PLAYER_MAX_CLIMB_SLOPE;
      expect(deepWater, `off ${off}`).toBe(false);
      expect(wall, `off ${off}`).toBe(false);
    }
    // The template is an ordinary walker, so ignoreObstacles is never forced on.
    expect(MOBS.forest_wolf.phasesThroughObstacles).toBeFalsy();
  });

  it('takes the straight step and breaks out of the fan when its first entry is clear', () => {
    const { ctx, resolveMovePoint } = makeCtx(clear);
    const e = mover();
    const want = candidate(dest, 0);
    expect(moveToward(ctx, e, dest, SPEED)).toBe(false);
    // The early break: one resolve, for the desired heading, then no slide is tried.
    expect(resolveMovePoint).toHaveBeenCalledTimes(1);
    expect(resolveMovePoint.mock.calls[0]).toEqual([want.x, want.z, PLAYER_BODY_RADIUS, e]);
    expect(e.pos.x).toBe(want.x);
    expect(e.pos.z).toBe(want.z);
    expect(e.pos.y).toBe(groundHeight(want.x, want.z, SEED)); // a mob snaps to terrain
    expect(e.facing).toBe(angleTo(ORIGIN, dest));
  });

  it('walks the whole fan in order when the straight step is blocked and takes the best slide', () => {
    const cands = FAN.map((off) => candidate(dest, off));
    const slide = cands[1]; // +0.5 rad, the first slide entry
    // Everything resolves to the origin (zero progress) except the +0.5 slide.
    const { ctx, resolveMovePoint } = makeCtx((nx, nz) =>
      near(nx, slide.x) && near(nz, slide.z) ? { x: nx, z: nz } : blocked(),
    );
    const e = mover();
    expect(moveToward(ctx, e, dest, SPEED)).toBe(false);
    expect(resolveMovePoint).toHaveBeenCalledTimes(FAN.length);
    for (let i = 0; i < FAN.length; i++) {
      expect(resolveMovePoint.mock.calls[i].slice(0, 2), `fan ${FAN[i]}`).toEqual([
        cands[i].x,
        cands[i].z,
      ]);
    }
    expect(e.pos.x).toBe(slide.x);
    expect(e.pos.z).toBe(slide.z);
    expect(e.pos.y).toBe(groundHeight(slide.x, slide.z, SEED));
  });

  it('stays put when every fan entry is blocked', () => {
    const { ctx, resolveMovePoint } = makeCtx(blocked);
    const e = mover();
    expect(moveToward(ctx, e, dest, SPEED)).toBe(false);
    expect(resolveMovePoint).toHaveBeenCalledTimes(FAN.length);
    expect(e.pos.x).toBe(ORIGIN.x);
    expect(e.pos.z).toBe(ORIGIN.z);
    expect(e.facing).toBe(angleTo(ORIGIN, dest)); // it still turns to face the target
  });

  it('a template flagged phasesThroughObstacles forces the phasing branch on without the caller asking', () => {
    const template = MOBS.thunzharr_waking_peak;
    expect(template.phasesThroughObstacles).toBe(true);
    const { ctx, resolveMovePoint } = makeCtx(blocked);
    const e = moverAt(ORIGIN, template);
    const want = candidate(dest, 0);
    // ignoreObstacles is left at its default: the template alone forces it.
    expect(moveToward(ctx, e, dest, SPEED)).toBe(false);
    // Same blocked resolver as the stays-put arm above, which the ordinary
    // walker consulted seven times and then went nowhere.
    expect(resolveMovePoint).not.toHaveBeenCalled();
    expect(e.pos.x).toBe(want.x);
    expect(e.pos.z).toBe(want.z);
    const g = groundHeight(want.x, want.z, SEED);
    expect(e.pos.y).toBe(Math.max(g, swimSurfaceY(want.x, want.z, SEED)));
  });

  it('ignoreObstacles steps straight through a blocked point without consulting the resolver', () => {
    const { ctx, resolveMovePoint } = makeCtx(blocked);
    const e = mover();
    const want = candidate(dest, 0);
    expect(moveToward(ctx, e, dest, SPEED, true)).toBe(false);
    expect(resolveMovePoint).not.toHaveBeenCalled();
    expect(e.pos.x).toBe(want.x);
    expect(e.pos.z).toBe(want.z);
    // Rides the surface while phasing: never under terrain or water.
    const g = groundHeight(want.x, want.z, SEED);
    expect(e.pos.y).toBe(Math.max(g, swimSurfaceY(want.x, want.z, SEED)));
    expect(e.facing).toBe(angleTo(ORIGIN, dest));
  });

  it('reports arrival: already within 0.3 yd without moving, or landing within it after the step', () => {
    const { ctx: ctxNear, resolveMovePoint: near1 } = makeCtx(clear);
    const e1 = mover();
    expect(moveToward(ctxNear, e1, { x: ORIGIN.x + 0.2, y: 0, z: ORIGIN.z }, SPEED)).toBe(true);
    expect(near1).not.toHaveBeenCalled();
    expect(e1.pos.x).toBe(ORIGIN.x); // no step is taken on arrival

    const { ctx: ctxStep } = makeCtx(clear);
    const e2 = mover();
    const close: Vec3 = { x: ORIGIN.x + 0.4, y: 0, z: ORIGIN.z };
    expect(moveToward(ctxStep, e2, close, SPEED)).toBe(true); // 0.4 - 0.2 = 0.2 < 0.3
    expect(e2.pos.x).toBeCloseTo(ORIGIN.x + STEP, 12);

    const { ctx: ctxThrough } = makeCtx(blocked);
    const e3 = mover();
    expect(moveToward(ctxThrough, e3, close, SPEED, true)).toBe(true);
    expect(e3.pos.x).toBeCloseTo(ORIGIN.x + STEP, 12);
  });
});

describe('the waterline gate and the swim surface (the lake heart)', () => {
  const dest: Vec3 = { x: DEEP.x + 10, y: 0, z: DEEP.z };

  it('the lake heart is deep water on every fan entry and clear of wall bands (the precondition)', () => {
    for (const off of FAN) {
      const c = candidateFrom(DEEP, dest, off);
      const deepWater =
        groundHeight(c.x, c.z, SEED) < waterLevelAt(c.x, c.z, SEED) - PLAYER_SWIM_DEPTH;
      expect(deepWater, `off ${off}`).toBe(true);
      expect(nearSteepWalls(c.x, c.z), `off ${off}`).toBe(false);
    }
  });

  it('a landlocked mover skips every deep-water fan entry: the resolver is never asked and it stays on the bed', () => {
    const { ctx, resolveMovePoint } = makeCtx(clear, false);
    const e = moverAt(DEEP);
    expect(moveToward(ctx, e, dest, SPEED)).toBe(false);
    expect(resolveMovePoint).not.toHaveBeenCalled();
    expect(e.pos.x).toBe(DEEP.x);
    expect(e.pos.z).toBe(DEEP.z);
    expect(e.pos.y).toBe(groundHeight(DEEP.x, DEEP.z, SEED)); // the terrain snap, never the surface
    expect(e.facing).toBe(angleTo(DEEP, dest)); // it still turns to face the target
  });

  it('a swimmer takes the same straight step and rides the swim surface instead of the bed', () => {
    const { ctx, resolveMovePoint } = makeCtx(clear, true);
    const e = moverAt(DEEP);
    const want = candidateFrom(DEEP, dest, 0);
    expect(moveToward(ctx, e, dest, SPEED)).toBe(false);
    // The waterline skip is off for a swimmer: the straight entry is resolved
    // and, being clear, breaks out of the fan.
    expect(resolveMovePoint).toHaveBeenCalledTimes(1);
    expect(resolveMovePoint.mock.calls[0]).toEqual([want.x, want.z, PLAYER_BODY_RADIUS, e]);
    expect(e.pos.x).toBe(want.x);
    expect(e.pos.z).toBe(want.z);
    const g = groundHeight(want.x, want.z, SEED);
    expect(e.pos.y).toBe(swimSurfaceY(want.x, want.z, SEED));
    expect(e.pos.y).toBeGreaterThan(g); // the surface ride, not the terrain snap
  });
});
