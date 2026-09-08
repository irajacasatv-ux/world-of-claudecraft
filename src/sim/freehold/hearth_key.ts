import type { SimContext } from '../sim_context';
import { denyFreehold, freeholdEntryContextReason } from './entry_context';
import { HEARTH_KEY_COOLDOWN_MS } from './gate_rules';
import { enterFreehold, freeholdDefForTier } from './instance';
import { freeholdKeyFor } from './owner_key';

/** Isolated-host travel clock. The realm participant refuses until durable
 * account authority lands in 07a; this Map never substitutes for that fact. */
export function useHearthKey(ctx: SimContext, pid: number): boolean {
  const r = ctx.resolve(pid);
  if (!r) return false;
  if (r.e.dead) return denyFreehold(ctx, pid, 'dead');
  if (r.e.inCombat) return denyFreehold(ctx, pid, 'combat');
  const ownerKey = freeholdKeyFor(ctx, pid);
  const record = ctx.freeholds.get(ownerKey);
  const def = record && freeholdDefForTier(record.tier);
  if (!record || !def) return denyFreehold(ctx, pid, 'no_freehold');
  const currentClaim = ctx.instanceClaimIdAt(r.e.pos);
  const alreadyHome =
    currentClaim !== null &&
    ctx.instances.some(
      (claim) =>
        claim.exitId === currentClaim && claim.partyKey === ownerKey && claim.dungeonId === def.id,
    );
  const reason = freeholdEntryContextReason(ctx, pid, false, alreadyHome);
  if (reason) return denyFreehold(ctx, pid, reason);
  if (alreadyHome) return false;
  if (!ctx.freeholdKeyAdmission(ownerKey, pid)) return denyFreehold(ctx, pid, 'busy');
  const now = ctx.lockoutNowMs();
  if (!Number.isFinite(now)) return denyFreehold(ctx, pid, 'busy');
  const readyAt = ctx.freeholdKeyReadyAtMs.get(ownerKey) ?? 0;
  if (now < readyAt) return denyFreehold(ctx, pid, 'cooldown');
  if (!enterFreehold(ctx, pid)) return false;
  ctx.freeholdKeyReadyAtMs.set(ownerKey, Math.max(readyAt, now + HEARTH_KEY_COOLDOWN_MS));
  return true;
}
