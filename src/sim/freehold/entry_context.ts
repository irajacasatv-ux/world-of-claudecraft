// Cold command admission only. Membership guards cover teleport gaps; the
// position backstop rejects unknown or already-reaped instance bands.
import { INSTANCE_X_BASE, isArenaPos, isBgPos, isDelvePos, isRiftPos } from '../data';
import { JAIL_CENTER, JAIL_OUTER_HALF } from '../jail';
import { riftInstanceAtPos } from '../rift/runs';
import type { SimContext } from '../sim_context';
import { isNonSpellCast, type SimEvent } from '../types';

export type FreeholdDenyReason = Extract<SimEvent, { type: 'freeholdDenied' }>['reason'];

export function denyFreehold(ctx: SimContext, pid: number, reason: FreeholdDenyReason): false {
  ctx.emit({ type: 'freeholdDenied', pid, reason });
  return false;
}

export function freeholdEntryContextReason(
  ctx: SimContext,
  pid: number,
  allowCorpseRun = false,
  allowSelectedHome = false,
): FreeholdDenyReason | null {
  const r = ctx.resolve(pid);
  if (!r) return 'no_freehold';
  const { e } = r;
  if (e.dead && !allowCorpseRun) return 'dead';
  if (e.inCombat) return 'combat';
  if (isNonSpellCast(e.castingAbility)) return 'busy';
  // Every flag carrier is already in bgMatches; membership covers every match state.
  if (ctx.bgMatches.has(pid) || ctx.arenaMatches.has(pid) || ctx.duels.has(pid)) return 'match';
  if (isArenaPos(e.pos.x) || isBgPos(e.pos.x)) return 'match';
  if (
    e.jailed ||
    (Math.abs(e.pos.x - JAIL_CENTER.x) <= JAIL_OUTER_HALF &&
      Math.abs(e.pos.z - JAIL_CENTER.z) <= JAIL_OUTER_HALF)
  )
    return 'busy';
  if (!Number.isFinite(e.pos.x) || !Number.isFinite(e.pos.y) || !Number.isFinite(e.pos.z))
    return 'instanced';
  if (allowSelectedHome) return null;
  // A reserved delve run survives legitimate exit; only the canonical current
  // location lookup blocks here, never run.partyKey alone.
  if (
    ctx.delveRunForPlayer(pid) !== null ||
    riftInstanceAtPos(ctx, e.pos) !== null ||
    ctx.instanceClaimIdAt(e.pos) !== null
  )
    return 'instanced';
  if (isRiftPos(e.pos.x) || isDelvePos(e.pos.x) || e.pos.x >= INSTANCE_X_BASE) return 'instanced';
  return null;
}
