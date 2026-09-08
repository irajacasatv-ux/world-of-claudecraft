import { isBlocked } from '../colliders';
import {
  COTTAGE_LAYOUT,
  FREEHOLD_GRID_PITCH,
  FREEHOLD_PROTECTED_PATHS,
  INN_ROOM_LAYOUT,
} from '../content/freehold/layouts';
import { instanceOrigin } from '../data';
import { PLAYER_BODY_RADIUS } from '../pathfind';
import type { InstanceSlot } from '../sim';
import type { SimContext } from '../sim_context';
import type { DungeonDef, Vec3 } from '../types';

/** Resolve before claiming or teleporting. A fixed, nearest-first grid keeps
 * the empty entry canonical and occupied arrivals independent of roster order.
 * Only the protected approach ahead of the entry is eligible: the exit portal
 * and door-swing reservation behind it must never receive a fallback arrival. */
export function resolveOwnerArrival(
  ctx: Pick<SimContext, 'instances' | 'grid' | 'cfg' | 'groundPos'>,
  dungeon: DungeonDef,
  existing: InstanceSlot | undefined,
  pid: number,
): Vec3 | null {
  const interior = dungeon.interior;
  if (interior !== 'inn_room' && interior !== 'cottage') return null;
  const slot =
    existing ?? ctx.instances.find((i) => i.dungeonId === dungeon.id && i.partyKey === null);
  if (!slot) return null;
  const origin = instanceOrigin(dungeon.index, slot.slot);
  const approach = FREEHOLD_PROTECTED_PATHS[interior];
  const layout = interior === 'inn_room' ? INN_ROOM_LAYOUT : COTTAGE_LAYOUT;
  const radius = PLAYER_BODY_RADIUS;
  const candidates = [{ ...dungeon.entry }];
  for (let z = dungeon.entry.z; z <= approach.z1 - radius; z += FREEHOLD_GRID_PITCH) {
    for (let x = approach.x0 + radius; x <= approach.x1 - radius; x += FREEHOLD_GRID_PITCH) {
      if (x !== dungeon.entry.x || z !== dungeon.entry.z) candidates.push({ x, z });
    }
  }
  const distance = (point: { x: number; z: number }) =>
    (point.x - dungeon.entry.x) ** 2 + (point.z - dungeon.entry.z) ** 2;
  candidates.sort((a, b) => distance(a) - distance(b) || b.z - a.z || a.x - b.x);
  for (const local of candidates) {
    if (
      !layout.rooms?.some(
        (room) =>
          local.x - radius > room.x0 &&
          local.x + radius < room.x1 &&
          local.z - radius > room.z0 &&
          local.z + radius < room.z1,
      )
    )
      continue;
    const x = origin.x + local.x;
    const z = origin.z + local.z;
    if (isBlocked(ctx.cfg.seed, x, z, radius)) continue;
    if (
      ctx.grid.someInRadius(
        x,
        z,
        radius * 2,
        (e, distanceSquared) =>
          e.kind === 'player' && e.id !== pid && distanceSquared < (radius * 2) ** 2,
      )
    )
      continue;
    return ctx.groundPos(x, z);
  }
  return null;
}
