import { describe, expect, it } from 'vitest';
import { createStepSmooth, stepSmoothHeight } from '../src/render/step_smooth_core';
import {
  moverHeight,
  resolveMovement,
  STALL_CANOPY_EAVE,
  STALL_CANOPY_TOP,
  supportHeightAt,
} from '../src/sim/colliders';
import { DUNGEONS, instanceOrigin, MOBS, PROPS } from '../src/sim/data';
import {
  CRYPT_LAYOUT,
  DAIS_HEIGHT,
  TOMB_COFFIN_DECORATED_EAVE,
  TOMB_HD,
  TOMB_HW,
  tombSlotRoll,
} from '../src/sim/dungeon_layout';
import { createMob } from '../src/sim/entity';
import { runMobSwingAffixes } from '../src/sim/mob/mob_swing';
import { PLAYER_BODY_RADIUS } from '../src/sim/pathfind';
import { findLedgeGrab } from '../src/sim/physics/ledge';
import { moveSpeedMult, type PlayerMotionDeps, stepPlayerMotion } from '../src/sim/player_motion';
import { Sim } from '../src/sim/sim';
import type { Entity, MoveInput } from '../src/sim/types';
import { groundHeight } from '../src/sim/world';
import { EMPTY_TEST_WORLD } from './sim_shared';

// The physics-asset audit, interaction half: forced movement (knockback,
// charge, Vaulting Charge) against standable geometry, client-predictor parity
// inside dungeons, persistence on a roof, the step-smooth core, and the
// climb's veto edges.

const SEED = 42;
const IDLE: MoveInput = {
  forward: false,
  back: false,
  turnLeft: false,
  turnRight: false,
  strafeLeft: false,
  strafeRight: false,
  jump: false,
  dive: false,
  surface: false,
};

// The empty world keeps every prop the stall, charge and roof cases stand on
// (and the dungeon interiors); only the ambient camps and NPCs go, and every
// case places the one mob it needs itself.
function makeSim(): Sim {
  const sim = new Sim({
    seed: SEED,
    playerClass: 'warrior',
    autoEquip: true,
    devCommands: true,
    world: EMPTY_TEST_WORLD,
  });
  sim.setPlayerLevel(60);
  return sim;
}

function teleport(sim: Sim, x: number, z: number, facing: number): void {
  const p = sim.player;
  p.pos.x = x;
  p.pos.z = z;
  p.pos.y = groundHeight(x, z, SEED);
  p.prevPos = { ...p.pos };
  p.fallStartY = p.pos.y;
  p.facing = facing;
  p.onGround = true;
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  p.climb = null;
}

function hold(sim: Sim, input: Partial<MoveInput>, ticks: number): void {
  const meta = sim.players.get(sim.player.id);
  if (!meta) throw new Error('no meta');
  for (let i = 0; i < ticks; i++) {
    Object.assign(meta.moveInput, IDLE, input);
    sim.tick();
  }
}

function climbOntoCanopy(sim: Sim): void {
  teleport(sim, -8.5, -0.3, 0);
  const p = sim.player;
  for (let i = 0; i < 140; i++) {
    hold(sim, { forward: true, jump: true }, 1);
    const rel = p.pos.y - groundHeight(-8.5, 3, SEED);
    if (p.onGround && rel > STALL_CANOPY_EAVE - 0.1) return;
  }
  throw new Error('never reached the canopy');
}

describe('knockbacks x roofs', () => {
  it('knocked INTO the stall face: stopped at the rim, never embedded', () => {
    const sim = makeSim();
    const p = sim.player;
    // The zone 3 stables feed stall: a legacy market stand, the normalized
    // 3.1 x 2.5 box (colliders.ts), so its front face sits 2.5 / 2 yd out
    // along the stand's local z. A moved or resized stand fails here, loudly,
    // instead of leaving the shove to cross open ground.
    const stall = PROPS.stalls.find((s) => s.x === 365 && s.z === 603);
    expect(stall, 'the stables feed stall').toBeTruthy();
    if (!stall) return;
    expect(stall.w, 'a legacy stand, not a sized OBB').toBeUndefined();
    const FACE = 2.5 / 2;
    const rot = stall.rot ?? 0;
    // World point `lz` yd out along the stand's local +z, and back again.
    const out = (lz: number) => ({
      x: stall.x + lz * Math.sin(rot),
      z: stall.z + lz * Math.cos(rot),
    });
    const localZ = () => (p.pos.x - stall.x) * Math.sin(rot) + (p.pos.z - stall.z) * Math.cos(rot);
    const START = FACE + 2;
    const at = out(START);
    teleport(sim, at.x, at.z, rot + Math.PI);
    // The real landed-hit cascade: Marrowlord Varkas's Crushing Sweep, its
    // chance forced to 1, shoves the player straight away from him, which is
    // straight at the stall face: 6 yd would carry the body clean through.
    const tmpl = MOBS.marrowlord_varkas;
    const knockback = tmpl.knockback;
    if (!knockback) throw new Error('marrowlord_varkas lost its knockback');
    expect(knockback.distance).toBeGreaterThan(START + FACE);
    const saved = knockback.chance;
    knockback.chance = 1;
    // The swing source only: never added to the world, so nothing chases or
    // swings again in the ticks that follow.
    const behind = out(START + 1.5);
    const mob = createMob(sim.nextId++, tmpl, 60, { x: behind.x, y: p.pos.y, z: behind.z });
    mob.hostile = true;
    try {
      runMobSwingAffixes(sim.ctx, mob, p, { dealt: 1, crit: false, rawDmg: 1 });
    } finally {
      knockback.chance = saved;
    }
    // The shove happened and moved the body toward the stall, then stopped at
    // the rim: outside the face by at least the body radius, and within one
    // half-yard shove step of that contact (never short, never through).
    expect(localZ()).toBeLessThan(START - 1);
    expect(localZ()).toBeGreaterThanOrEqual(FACE + PLAYER_BODY_RADIUS);
    expect(localZ()).toBeLessThan(FACE + PLAYER_BODY_RADIUS + 0.5);
    // And it stays there at street height, neither embedded nor on the roof.
    for (let i = 0; i < 20; i++) {
      hold(sim, {}, 1);
      expect(localZ()).toBeGreaterThanOrEqual(FACE + PLAYER_BODY_RADIUS);
      expect(p.pos.y - groundHeight(p.pos.x, p.pos.z, SEED)).toBeLessThan(0.5);
    }
  });
});

describe('client predictor parity in dungeons', () => {
  it('client-dep kernel walks the dais rim and mantles a coffin bit-for-bit', () => {
    const o = instanceOrigin(DUNGEONS.hollow_crypt.index, 0);
    const d = CRYPT_LAYOUT.dais;

    // Live Sim side.
    const sim = makeSim();
    teleport(sim, o.x + d.x, o.z + d.z - d.r - 2, 0);
    const p = sim.player;

    // Client dep shape (mirrors src/render/self_motion.ts bindings).
    const clientDeps: PlayerMotionDeps = {
      seed: SEED,
      moveSpeedMult: (e) => moveSpeedMult(e, 0),
      resolveMove: (fromX, fromZ, nx, nz, r, e, ignoreFences) =>
        resolveMovement(SEED, fromX, fromZ, nx, nz, r, ignoreFences, undefined, moverHeight(e)),
      resolvedAbility: () => null,
      cancelCast: () => {},
      standUp: (e) => {
        e.sitting = false;
      },
      dealDamage: () => {},
    };
    const ghost = structuredClone({
      ...p,
      auras: [],
      castingAbility: null,
    }) as unknown as Entity;

    const input: MoveInput = { ...IDLE, forward: true, jump: true };
    const meta = sim.players.get(p.id);
    if (!meta) throw new Error('no meta');
    for (let i = 0; i < 100; i++) {
      Object.assign(meta.moveInput, input);
      sim.tick();
      ghost.prevPos = { ...ghost.pos };
      stepPlayerMotion(clientDeps, ghost, input);
      expect(ghost.pos.x).toBeCloseTo(p.pos.x, 10);
      expect(ghost.pos.y).toBeCloseTo(p.pos.y, 10);
      expect(ghost.pos.z).toBeCloseTo(p.pos.z, 10);
    }

    // The coffin leg. The dais walk above never reaches the wall-side tombs,
    // and a coffin lid is a height-gated top: the instanced resolver lets a
    // body over it only when handed the mover's feet height, which the open
    // world solver never asks for. Both hosts start south of one coffin and
    // jump it end to end.
    const t = CRYPT_LAYOUT.tombs[7];
    teleport(sim, o.x + t.x, o.z + t.z - 4, 0);
    const coffinGhost = structuredClone({
      ...p,
      auras: [],
      castingAbility: null,
    }) as unknown as Entity;
    const floorY = p.pos.y;
    const overLid: number[] = [];
    for (let i = 0; i < 40; i++) {
      Object.assign(meta.moveInput, input);
      sim.tick();
      coffinGhost.prevPos = { ...coffinGhost.pos };
      stepPlayerMotion(clientDeps, coffinGhost, input);
      expect(coffinGhost.pos.x).toBeCloseTo(p.pos.x, 10);
      expect(coffinGhost.pos.y).toBeCloseTo(p.pos.y, 10);
      expect(coffinGhost.pos.z).toBeCloseTo(p.pos.z, 10);
      const onFootprint =
        Math.abs(p.pos.x - (o.x + t.x)) < TOMB_HW && Math.abs(p.pos.z - (o.z + t.z)) < TOMB_HD;
      if (onFootprint) overLid.push(p.pos.y - floorY);
    }
    // It crossed the coffin's footprint on top of the lid (never below the
    // lower of the two coffin eaves, so never through the body), then came
    // down past the far end instead of stopping at the face.
    expect(overLid.length).toBeGreaterThan(0);
    expect(Math.min(...overLid)).toBeGreaterThanOrEqual(TOMB_COFFIN_DECORATED_EAVE);
    expect(p.pos.z).toBeGreaterThan(o.z + t.z + TOMB_HD);
  });
});

describe('persistence on a roof', () => {
  it('serialize/restore a player standing on the canopy keeps a sane y', () => {
    const sim = makeSim();
    climbOntoCanopy(sim);
    const p = sim.player;
    const yBefore = p.pos.y;
    const saved = sim.serializeCharacter(p.id);
    expect(saved).toBeTruthy();
    if (!saved) return;
    const sim2 = new Sim({
      seed: SEED,
      playerClass: 'warrior',
      noPlayer: true,
      world: EMPTY_TEST_WORLD,
    });
    const pid = sim2.addPlayer('warrior', 'Restored', { state: saved });
    const restored = sim2.entities.get(pid);
    expect(restored).toBeTruthy();
    if (!restored) return;
    for (let i = 0; i < 40; i++) sim2.tick();
    // Restored on (or settled onto) the canopy, never inside/below the street.
    const rel = restored.pos.y - groundHeight(restored.pos.x, restored.pos.z, SEED);
    console.log(
      'restored rel height',
      rel.toFixed(2),
      'saved at',
      (yBefore - groundHeight(-8.5, 3, SEED)).toFixed(2),
    );
    expect(rel).toBeGreaterThanOrEqual(-0.01);
    expect(rel).toBeLessThanOrEqual(STALL_CANOPY_TOP + 0.05);
  });
});

describe('step smooth core handles the dais and cone strides', () => {
  it('eases a 0.6 step up and a 0.6 walk-off without snapping', () => {
    const s = createStepSmooth();
    // settle grounded at 0 first
    for (let i = 0; i < 10; i++) stepSmoothHeight(s, 0, true, 1 / 60);
    // step UP 0.6 in one tick (grounded->grounded): must lag then converge
    let y = stepSmoothHeight(s, 0.6, true, 1 / 60);
    expect(y).toBeLessThan(0.6); // eased, not snapped
    for (let i = 0; i < 40; i++) y = stepSmoothHeight(s, 0.6, true, 1 / 60);
    expect(y).toBeCloseTo(0.6, 2);
    // walk OFF: 0.6 down in one tick, still grounded
    y = stepSmoothHeight(s, 0, true, 1 / 60);
    expect(y).toBeGreaterThan(0); // eased down
    for (let i = 0; i < 40; i++) y = stepSmoothHeight(s, 0, true, 1 / 60);
    expect(y).toBeCloseTo(0, 2);
  });
});

describe('climb vetoes', () => {
  it('no grab when the landing is a wall (crate flush against a building)', () => {
    // Eastbrook house at (10, 12) w7 d6 rot -0.4: put a probe body right at
    // its south face and check findLedgeGrab refuses (landing inside OBB).
    const g = groundHeight(10, 8.2, SEED);
    const grab = findLedgeGrab(
      { seed: SEED, radius: 0.5, facing: 0, vx: 0, vz: 5 },
      10,
      g + 1.0,
      8.2,
    );
    // Whatever is probed here must not land INSIDE the house.
    if (grab) {
      const cos = Math.cos(0.4);
      const sin = Math.sin(-0.4);
      const lx = (grab.x - 10) * cos + (grab.z - 12) * sin;
      const lz = -(grab.x - 10) * sin + (grab.z - 12) * cos;
      expect(Math.abs(lx) > 3.5 || Math.abs(lz) > 3).toBe(true);
    }
  });

  it('strafe-past inside the crypt never grabs a coffin sideways', () => {
    const o = instanceOrigin(DUNGEONS.hollow_crypt.index, 0);
    const t = CRYPT_LAYOUT.tombs[0];
    // Moving along +z past the coffin's aisle face, facing it: velocity wins,
    // so no grab.
    const grab = findLedgeGrab(
      { seed: SEED, radius: 0.5, facing: -Math.PI / 2, vx: 0, vz: 6 },
      o.x + t.x + 1.8,
      0.5,
      o.z + t.z,
    );
    expect(grab).toBeNull();
  });

  it('supportHeightAt: no interior support bleeds into the open world', () => {
    expect(supportHeightAt(SEED, 599, -1234, 0.5, 100)).not.toBe(DAIS_HEIGHT);
  });
});

describe('charge and chase', () => {
  it('warrior charge routes around a stall, never onto or through it', () => {
    const sim = makeSim();
    teleport(sim, -10.5, -3.0, 0);
    const p = sim.player;
    const tmpl = MOBS.forest_wolf;
    // Diagonal past the stall edge: line of sight clears, but the straight
    // run to the target still crosses the stall footprint, so the path must
    // route around it.
    const mob = createMob(sim.nextId++, tmpl, 5, { x: -10.5, y: 0, z: 9.0 });
    mob.pos.y = groundHeight(mob.pos.x, mob.pos.z, SEED);
    mob.hostile = true;
    sim.addEntity(mob);
    hold(sim, {}, 1); // bucket the mob
    p.facing = Math.atan2(mob.pos.x - p.pos.x, mob.pos.z - p.pos.z);
    sim.targetEntity(mob.id);
    p.gcdRemaining = 0;
    p.resource = 100;
    sim.castAbility('charge');
    expect(p.chargeTargetId).toBe(mob.id);
    let maxRel = 0;
    for (let i = 0; i < 80; i++) {
      hold(sim, {}, 1);
      maxRel = Math.max(maxRel, p.pos.y - groundHeight(p.pos.x, p.pos.z, SEED));
    }
    console.log('charge end', p.pos.x.toFixed(1), p.pos.z.toFixed(1), 'maxRel', maxRel.toFixed(2));
    expect(maxRel).toBeLessThan(0.5); // never climbed the canopy
    expect(Math.hypot(p.pos.x - mob.pos.x, p.pos.z - mob.pos.z)).toBeLessThan(6); // reached it
  });

  it('a mob chases the player up onto the dais and back down', () => {
    const sim = makeSim();
    const o = instanceOrigin(DUNGEONS.hollow_crypt.index, 0);
    const d = CRYPT_LAYOUT.dais;
    teleport(sim, o.x + d.x, o.z + d.z - d.r - 3, 0);
    const p = sim.player;
    const mob = createMob(sim.nextId++, MOBS.forest_wolf, 60, {
      x: o.x + d.x,
      y: 0,
      z: o.z + d.z - d.r - 5,
    });
    mob.hostile = true;
    sim.addEntity(mob);
    sim as unknown as { addThreatTo?: unknown };
    // aggro by damage
    (sim as any).dealDamage(p, mob, 1, false, 'physical', null, 'hit', true);
    // player runs onto the dais center
    for (let i = 0; i < 80; i++) hold(sim, { forward: true }, 1);
    // mob should have followed onto the platform and stand at its height
    const g = groundHeight(mob.pos.x, mob.pos.z, SEED);
    console.log(
      'mob rel-y on chase:',
      (mob.pos.y - g).toFixed(3),
      'dist to player',
      Math.hypot(mob.pos.x - p.pos.x, mob.pos.z - p.pos.z).toFixed(1),
    );
    expect(Math.abs(mob.pos.y - g)).toBeLessThan(0.01);
    expect(Math.hypot(mob.pos.x - p.pos.x, mob.pos.z - p.pos.z)).toBeLessThan(4);
  });
});
