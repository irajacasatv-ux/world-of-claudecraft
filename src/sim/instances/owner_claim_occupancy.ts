import { DUNGEONS, dungeonAt, instanceSlotForZ } from '../data';
import type { InstanceSlot } from '../sim';
import type { SimContext } from '../sim_context';
import type { Vec3 } from '../types';

/** Index owner rooms once, then resolve each roster position to one candidate.
 * The caller supplies the same exact footprint used by other instance queries. */
export function occupiedOwnerClaims(
  ctx: SimContext,
  contains: (claim: InstanceSlot, pos: Vec3) => boolean,
): Set<InstanceSlot> {
  const claims = new Map<string, Map<number, InstanceSlot>>();
  for (const claim of ctx.instances) {
    if (claim.partyKey === null || DUNGEONS[claim.dungeonId]?.claimKey !== 'owner') continue;
    let slots = claims.get(claim.dungeonId);
    if (!slots) {
      slots = new Map();
      claims.set(claim.dungeonId, slots);
    }
    slots.set(claim.slot, claim);
  }
  const occupied = new Set<InstanceSlot>();
  if (claims.size === 0) return occupied;
  for (const meta of ctx.players.values()) {
    ctx.instanceScanCounters.ownerRosterVisits++;
    const entity = ctx.entities.get(meta.entityId);
    if (!entity) continue;
    const dungeon = dungeonAt(entity.pos.x);
    if (!dungeon) continue;
    const claim = claims.get(dungeon.id)?.get(instanceSlotForZ(entity.pos.z));
    if (!claim || occupied.has(claim)) continue;
    ctx.instanceScanCounters.ownerClaimTests++;
    if (contains(claim, entity.pos)) occupied.add(claim);
  }
  return occupied;
}
