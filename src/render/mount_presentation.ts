// The whole per-frame presentation pass for the mount under a rider: gait
// animation, body attitude (jump pitch), the rider seat carried with it, and
// the mount's ambient particle trail.
//
// One function rather than a block inside the entity loop for the usual two
// reasons: it is mount behavior, not coordinator work, and renderer.ts is a
// named monolith under the line-count ratchet (root CLAUDE.md, Modularity).
// It reads the same shape the loop already had, so the seam is the parameter
// list and nothing else moved.
//
// The pieces it composes each own their own math:
//   - `CharacterVisual.update` runs the baked gait clips.
//   - `applyRocketSledAttitude` owns the rocket sled's jump nose-up and the
//     rigid rider carry; `applyMountJumpAttitude` is the rickshaw arm's copy of
//     the same idea, and exactly one of the two drives any given mount.
//   - `rickshaw_mount` owns the rolling wheels and the puller that walks in the
//     shafts.
// The four-wheel suspension, lamps and piped exhaust that served the retired
// Rallycart RXT were deleted with its assets on 2026-09-27.

import type * as THREE from 'three';
import type { AnimState, CharacterVisual } from './characters/visual';
import { applyRocketSledAttitude } from './goblin_rocket_sled_fx';
import { type MountGlows, updateMountGlows } from './mount_glow';
import { applyMountJumpAttitude } from './mount_jump_attitude';
import { type MountLamps, updateMountLamps } from './mount_lamps';
import { seatRiderOnBone } from './mount_lifecycle';
import { type MountVisualSpec, mountBobY } from './mount_visuals';
import { spinMountWheels, updateRickshawPuller } from './rickshaw_mount';
import type { Vfx } from './vfx';

/** The EntityView slice this pass touches: a caller-owned view record. */
export interface MountPresentationHost {
  group: THREE.Object3D;
  visual: { root: THREE.Object3D } | null;
  mountVisual: CharacterVisual | null;
  mountLift: number;
  rocketSledJumpPitch: number;
  /** The rickshaw arm's own tip angle. Two damped pitches rather than one
   *  because the two implementations still live side by side (see the attitude
   *  call below); only ever one of them drives a given mount. */
  mountJumpPitch: number;
  mountWheels?: Parameters<typeof spinMountWheels>[0]['mountWheels'];
  mountPullerVisual: Parameters<typeof updateRickshawPuller>[0]['mountPullerVisual'];
  mountLamps: MountLamps | null;
  mountGlows: MountGlows | null;
  mountSeatBone: THREE.Object3D | null;
  /** True while the current mount root's swapped-in materials are still
   *  linking (see mount_lifecycle.ts gateMountSwapOnCompile): the root itself
   *  stays hidden until this clears, so the rider must not be carried onto
   *  its attitude or seat bone meanwhile, or he floats/glitches against a
   *  mount nobody can see yet. */
  mountCompilePending: boolean;
}

export interface MountPresentationInputs {
  spec: MountVisualSpec | null;
  /** False when a druid form or death has taken the mount off screen. */
  shown: boolean;
  mountKey: string;
  /** The mount's own locomotion, borrowed from the rider. */
  anim: AnimState;
  /** The REAL airborne flag, not the rider's suppressed one: the mount carries
   *  the jump. */
  airborne: boolean;
  moving: boolean;
  facing: number;
  /** Raw vertical delta this frame, for the sled's jump attitude. */
  dyRaw: number;
  /** RAW horizontal travel per second, NOT the smoothed locomotion speed: a
   *  rolling wheel must agree with the distance the body actually covered this
   *  frame, and loco.speed latches briefly after a stop (which the wheels rode
   *  as a visible coast). */
  rawSpeed: number;
  /** Scene clock, for the procedural bob phase. */
  time: number;
  /** False for a far-LOD or offscreen body: the rig advances but nothing that
   *  costs per-frame work runs. */
  present: boolean;
  animate: boolean;
  vfx: Vfx;
  dt: number;
}

/**
 * The mount's locomotion, borrowed from its rider: the shared gait facts copied
 * into the mount's own scratch, with the REAL airborne flag (the rider's is
 * suppressed while seated; the mount carries the jump) and none of the
 * rider-only facts (casting, sitting, dead never reach a gait clip).
 */
export function borrowRiderLocomotion(mount: AnimState, rider: AnimState, airborne: boolean): void {
  mount.speed = rider.speed;
  mount.moving = rider.moving;
  mount.running = rider.running;
  mount.airborne = airborne;
  mount.backwards = rider.backwards;
  mount.swimming = rider.swimming;
}

export function updateMountPresentation(
  v: MountPresentationHost,
  input: MountPresentationInputs,
): void {
  const { spec, dt } = input;
  if (v.mountVisual && spec && input.shown) {
    if (!input.present) {
      v.mountVisual.advanceOffscreen(dt);
      updateRickshawPuller(v, dt, input.anim, input.animate, false);
      return;
    }
    v.mountVisual.update(dt, input.anim, input.animate);
    // RAW per-frame travel, not the smoothed locomotion speed: if the cart did
    // not move this frame, its wheels must not turn this frame.
    spinMountWheels(v, input.rawSpeed, input.anim.backwards, dt);
    // The rider floats WITH the procedural bob (the hover cycle's idle float),
    // not just the mount body.
    const bob = spec.groundLift + mountBobY(spec, input.time, input.moving);
    const riderRoot = v.visual?.root;
    if (!riderRoot) {
      updateRickshawPuller(v, dt, input.anim, input.animate, true);
      return;
    }
    // Exactly ONE attitude pass runs per mount. Both of these write the same
    // three transforms (mount pitch, mount lift, and the rider carried around
    // the vehicle origin), so running both would have them fight frame by
    // frame. They are near-identical implementations that arrived on two
    // branches: mount_jump_attitude.ts says so in its own header and expects
    // the collapse. Unifying them is a real change with its own tuning risk,
    // so this merge keeps each arm driving the mounts it was tuned against and
    // leaves the collapse to a follow-up.
    //
    // All of it (attitude, the seat-bone re-seat, and the ambient trail/exhaust
    // fx) carries the RIDER, who is visible even while the mount root itself is
    // still hidden behind mountCompilePending (its swapped-in materials have not
    // linked yet). Gated on `presented`, or a rider swapping mounts
    // floats/glitches against a mount nobody can see.
    const presented = !v.mountCompilePending;
    if (presented) {
      if (spec.jumpTips) {
        applyMountJumpAttitude(
          v,
          v.mountVisual.root,
          riderRoot,
          spec,
          input.time,
          input.moving,
          input.airborne,
          dt > 1e-4 ? input.dyRaw / dt : 0,
          dt,
        );
      } else {
        applyRocketSledAttitude(
          v,
          v.mountVisual.root,
          riderRoot,
          input.mountKey === 'goblin_rocket_sled',
          input.airborne,
          dt > 1e-4 ? input.dyRaw / dt : 0,
          dt,
          bob,
          v.mountLift + bob,
          spec.seatFwd,
        );
      }
      if (spec.seatBone) {
        seatRiderOnBone(v.group, riderRoot, v.mountVisual.root, spec, v);
      }
    }
    // Ambient mount particles: the snail paints its slime path while gliding,
    // the hover cycle streams aether exhaust off its tail.
    if (presented) {
      if (spec.fx === 'slime') {
        if (input.moving) input.vfx.mountSlimeTrail(v.group.position, dt);
      } else if (spec.fx === 'exhaust') {
        input.vfx.mountExhaust(v.group.position, input.facing, dt, input.moving);
      }
    }
    if (v.mountLamps) updateMountLamps(v.mountLamps, input.time);
    if (v.mountGlows) updateMountGlows(v.mountGlows, input.time);
    // Last: the puller is parented into the cart, so it reads the attitude
    // this pass just wrote rather than last frame's.
    updateRickshawPuller(v, dt, input.anim, input.animate, true);
    return;
  }
  if (!input.shown && v.visual) {
    // Dismounted: relax every arm this pass drives, or the body keeps the
    // vehicle's last attitude after the vehicle is gone.
    v.rocketSledJumpPitch = 0;
    v.mountJumpPitch = 0;
    v.visual.root.rotation.x = 0;
    v.visual.root.rotation.z = 0;
    v.visual.root.position.x = 0;
  }
}
