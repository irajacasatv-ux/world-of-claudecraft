// The owner-keyed freehold claim on the existing dungeon slot pool (D15): a
// player's own room is one InstanceSlot of the tier's DungeonDef, claimed by
// the owner key from owner_key.ts instead of a party key, so occupancy and the
// empty-slot reaper ride updateInstances unchanged and no new band or pool
// primitive exists. Two characters of one account share the claim exactly as
// party members share a dungeon claim; party membership itself is ignored.
//
// Every refusal here is TEXT-FREE (D10): exactly one id-carrying, pid-scoped
// `freeholdDenied` event, no `log` or `error` line, and nothing moves, nothing
// is claimed and no rng is drawn. The refusals run BEFORE the dungeon module
// is asked to enter, in this fixed order: dead, in combat, no record (an
// unusable record counts as none for a LIVING enter; the corpse run below
// needs no usable tier), then a full slot pool (`busy`), which is
// checked here precisely so the dungeon module's own English "instances are
// busy" error can never fire for a freehold. The flag is NOT re-checked here:
// the server dispatch gate is the one gate, and a dark host's record
// inserters insert nothing (state.ts), so it answers `no_freehold` (the
// ruling recorded in commands.ts).
//
// THE CORPSE RUN: `dead` has one exception, the dungeon idiom. A player can
// die inside its room (a hostile periodic aura ticks on after combat drops
// and passes the combat check), and the room has no door, so a released ghost
// whose corpse lies inside one of its OWN live owner claims is admitted to
// THAT room exactly as the dungeon module admits a ghost bound to a claim,
// and resurrects at the entrance. The corpse's room, not the tier's: a tier
// change between the death and the run leaves the corpse in the old tier's
// room, which the vacant-claim sweep keeps while the corpse lies there. A
// fresh corpse, a ghost bound to another claim, a ghost whose room the reaper
// already freed and a ghost with no record all refuse `dead` as before; the
// Spirit Healer remains the other way back.
//
// THE TIER-CHANGE RULE lives in the dungeon module, not here: once a LIVING
// owner has arrived in the room of its current tier, enterDungeon frees every
// other owner-keyed room still claimed under the same owner key unless a
// player stands inside it or a bound corpse lies there, so a grant that moved
// the owner up a tier does not leave the old room's slot to the reaper's
// timeout. A ghost's corpse run (into whichever room its body lies in) sweeps
// nothing, so the current tier's vacant claim survives it.
//
// The empty hold is deliberately the shared INSTANCE_EMPTY_TIMEOUT for now:
// an owner room keeps its slot for the same 300 s a dungeon does after the
// last occupant leaves, and the 24-slot pool depth is the shared pool's; a
// per-record slot count and a shorter owner hold are named later work.
//
// Public gate and item surfaces own their distinct admission checks in gate.ts
// and hearth_key.ts. This shared claim body stays below those checks so the
// physical corpse run never spends the remote-key cooldown. Production remote
// key authority and the shared pool capacity/broadcast-cost limits remain
// deployment prerequisites; the realm stays dark by default.
//
// The dungeon machinery is reached ONLY through the SimContext seam
// (ctx.enterDungeon / ctx.leaveDungeon / ctx.instanceClaimIdAt), never by
// importing instances/dungeons.ts or data.ts. That is the seam rule itself (a
// system module talks to another system through SimContext, not by import),
// and the import graph makes it a near-cycle besides: instances/heroic_vendor.ts
// and three professions/ modules import this directory's barrel, so a
// freehold -> instances/dungeons edge would sit one import away from a loop
// through the barrel (the pvp/index.ts rule). The tier's room comes from the
// content record for the same reason.

import {
  FREEHOLD_COTTAGE_DUNGEON_ID,
  FREEHOLD_DUNGEON_DEFS,
  FREEHOLD_INN_ROOM_DUNGEON_ID,
} from '../content/freehold';
import type { SimContext } from '../sim_context';
import type { DungeonDef, SimEvent } from '../types';
import { freeholdKeyFor } from './owner_key';
import type { FreeholdPlotId, FreeholdTier, FreeholdVisitPolicy } from './types';

type FreeholdDenyReason = Extract<SimEvent, { type: 'freeholdDenied' }>['reason'];

/** The room a record's tier is claimed in. Exhaustive over the tier union so
 *  a new tier is a compile error here rather than a silent Inn Room. A value
 *  OUTSIDE the union (a corrupt or forward-version record, once records
 *  persist) falls off the switch and answers undefined at runtime; every
 *  caller (enterFreehold, freeholdDescriptorFor) treats that as an unusable
 *  record, never a throw inside a tick. */
export function freeholdDefForTier(tier: FreeholdTier): DungeonDef {
  switch (tier) {
    case 'inn_room':
      return FREEHOLD_DUNGEON_DEFS[FREEHOLD_INN_ROOM_DUNGEON_ID];
    case 'cottage':
    // The four later tiers alias the Cottage record until their own rooms
    // land; each gains its own arm with its own DungeonDef then.
    case 'lodge':
    case 'manor':
    case 'keep':
    case 'citadel':
      return FREEHOLD_DUNGEON_DEFS[FREEHOLD_COTTAGE_DUNGEON_ID];
  }
}

/** Is this dungeon id one of the owner-claimed freehold rooms? The owner-claim
 *  family IS the freehold content table: every `claimKey: 'owner'` record
 *  lives there, so the lookup needs no merged catalog. */
function isOwnerClaimDungeon(dungeonId: string): boolean {
  const def = FREEHOLD_DUNGEON_DEFS[dungeonId] as DungeonDef | undefined;
  return def?.claimKey === 'owner';
}

function denyFreehold(ctx: SimContext, pid: number, reason: FreeholdDenyReason): false {
  ctx.emit({ type: 'freeholdDenied', pid, reason });
  return false;
}

/** The corpse-run exception to `dead`: the room whose live claim, held under
 *  the caller's OWN owner key, the caller's corpse is bound to, else
 *  undefined. The binding is the claim's exit entity id the death captured
 *  (corpseInstanceId), the same fact the dungeon module's corpseBoundToClaim
 *  reads, so a ghost bound to a stranger's room, to a party claim, to a room
 *  the reaper already freed (its exit entity is gone) or to nothing has none.
 *  Any of the caller's owner rooms qualifies, not only the current tier's. */
export function corpseRunRoom(
  ctx: SimContext,
  e: { ghost: boolean; corpseInstanceId: number | null },
  key: string,
): DungeonDef | undefined {
  if (!e.ghost || e.corpseInstanceId === null) return undefined;
  const claim = ctx.instances.find(
    (i) =>
      i.partyKey === key && i.exitId === e.corpseInstanceId && isOwnerClaimDungeon(i.dungeonId),
  );
  return claim === undefined ? undefined : FREEHOLD_DUNGEON_DEFS[claim.dungeonId];
}

/** Enter the caller's own freehold: rejoin the live owner claim or claim a
 *  vacant slot of the tier's room, then take the dungeon module's arrival
 *  (entry pose, facing 0, the entry log, dungeonEntrySeq; a bound ghost
 *  resurrects at the entrance there). False on every refusal, each announced
 *  by exactly one `freeholdDenied`. */
export function enterFreehold(ctx: SimContext, pid: number): boolean {
  const r = ctx.resolve(pid);
  if (!r) return false;
  const entityId = r.meta.entityId;
  const key = freeholdKeyFor(ctx, entityId);
  const record = ctx.freeholds.get(key);
  const corpseRoom = r.e.dead && record !== undefined ? corpseRunRoom(ctx, r.e, key) : undefined;
  if (r.e.dead && corpseRoom === undefined) return denyFreehold(ctx, entityId, 'dead');
  if (r.e.inCombat) return denyFreehold(ctx, entityId, 'combat');
  if (!record) return denyFreehold(ctx, entityId, 'no_freehold');
  const def = corpseRoom ?? (freeholdDefForTier(record.tier) as DungeonDef | undefined);
  if (def === undefined) return denyFreehold(ctx, entityId, 'no_freehold');
  // One pass over the pool: a live claim under this key wins outright, else
  // any vacant slot of the room will do; neither means the pool is full.
  let rejoining = false;
  let vacant = false;
  for (const i of ctx.instances) {
    if (i.dungeonId !== def.id) continue;
    if (i.partyKey === key) {
      rejoining = true;
      break;
    }
    if (i.partyKey === null) vacant = true;
  }
  if (!rejoining && !vacant) return denyFreehold(ctx, entityId, 'busy');
  return ctx.enterDungeon(def.id, entityId);
}

/** Leave the freehold the caller stands in: false (and nothing emitted) unless
 *  the caller is inside a live owner claim, else the dungeon module's exit,
 *  which sets the player down at the room's doorPos plus its leave offset and
 *  emits the leave log once. A leave from anywhere else is a no-op, not a
 *  refusal: nothing was asked that could have been granted, so no
 *  `freeholdDenied` is owed (D10 covers denials of an entry or a mutation).
 *  ANY player standing in a live owner claim may leave, not only its owner:
 *  the room's exit is the one way out for a sibling character, a later guest,
 *  or a body a dead relog placed there, and the dungeon module's own exit
 *  refusals (a fresh corpse cannot walk) still apply. Two pool walks (the
 *  claim id, then its slot) are deliberate: the seam exposes no slot lookup
 *  and both are sub-microsecond. */
export function leaveFreehold(ctx: SimContext, pid: number): boolean {
  const r = ctx.resolve(pid);
  if (!r) return false;
  const claimId = ctx.instanceClaimIdAt(r.e.pos);
  if (claimId === null) return false;
  const inst = ctx.instances.find((i) => i.exitId === claimId);
  if (!inst || !isOwnerClaimDungeon(inst.dungeonId)) return false;
  return ctx.leaveDungeon(r.meta.entityId);
}

/** The public shape of one owner's claim: opaque plot identity, tier, visit
 *  policy, record revision and the room's dungeon id. Never the owner key or
 *  an account id. A later change carries it over the wire. */
export interface FreeholdClaimDescriptor {
  plotId: FreeholdPlotId;
  tier: FreeholdTier;
  visitPolicy: FreeholdVisitPolicy;
  rev: number;
  dungeonId: string;
}

/** A VALUE COPY of an owner's descriptor (every field is a primitive, so the
 *  fresh literal aliases nothing in the live record), or null when the owner
 *  holds no record or an unusable one (a tier outside the union names no
 *  room, so there is no descriptor to publish and nothing throws). */
export function freeholdDescriptorFor(
  ctx: SimContext,
  ownerKey: string,
): FreeholdClaimDescriptor | null {
  const record = ctx.freeholds.get(ownerKey);
  if (!record) return null;
  const def = freeholdDefForTier(record.tier) as DungeonDef | undefined;
  if (def === undefined) return null;
  return {
    plotId: record.plotId,
    tier: record.tier,
    visitPolicy: record.visitPolicy,
    rev: record.rev,
    dungeonId: def.id,
  };
}
