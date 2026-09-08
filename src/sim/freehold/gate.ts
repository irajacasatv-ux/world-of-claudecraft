import type { SimContext } from '../sim_context';
import { denyFreehold, freeholdEntryContextReason } from './entry_context';
import {
  FREEHOLD_GATE_INTERACT_RANGE,
  FREEHOLD_GATE_TEMPLATE_ID,
  HEARTH_KEY_ITEM_ID,
} from './gate_rules';
import { corpseRunRoom, enterFreehold } from './instance';
import { freeholdKeyFor } from './owner_key';

/** Explicit confirmation revalidates the authoritative gate and caller position.
 * Walking through the gate never invokes this command. The low-level claim owns
 * the released, bound-corpse exception and its exact resurrection behavior. */
export function confirmFreeholdGate(ctx: SimContext, pid: number): boolean {
  const r = ctx.resolve(pid);
  if (!r) return false;
  const ownerKey = freeholdKeyFor(ctx, pid);
  const hasRecord = ctx.freeholds.has(ownerKey);
  if (r.e.dead && (!hasRecord || !corpseRunRoom(ctx, r.e, ownerKey)))
    return denyFreehold(ctx, pid, 'dead');
  if (r.e.inCombat) return denyFreehold(ctx, pid, 'combat');
  if (!hasRecord) return denyFreehold(ctx, pid, 'no_freehold');
  const reason = freeholdEntryContextReason(ctx, pid, true);
  if (reason) return denyFreehold(ctx, pid, reason);
  let nearby = false;
  ctx.grid.forEachInRadius(r.e.pos.x, r.e.pos.z, FREEHOLD_GATE_INTERACT_RANGE, (gate) => {
    if (gate.kind !== 'object' || gate.templateId !== FREEHOLD_GATE_TEMPLATE_ID || gate.dead)
      return;
    if (
      Math.hypot(gate.pos.x - r.e.pos.x, gate.pos.y - r.e.pos.y, gate.pos.z - r.e.pos.z) <=
      FREEHOLD_GATE_INTERACT_RANGE
    ) {
      nearby = true;
    }
  });
  if (!nearby) return denyFreehold(ctx, pid, 'busy');
  if (!enterFreehold(ctx, pid)) return false;
  // Full bags never reverse a successful entry or emit a misleading refusal.
  // Retry only when the permanent tool is absent from both bags and personal bank.
  if (
    ctx.countItem(HEARTH_KEY_ITEM_ID, pid) === 0 &&
    !r.meta.bank.inventory.some((slot) => slot.itemId === HEARTH_KEY_ITEM_ID && slot.count > 0) &&
    ctx.canAddItem(HEARTH_KEY_ITEM_ID, 1, pid)
  )
    ctx.addItem(HEARTH_KEY_ITEM_ID, 1, pid);
  return true;
}
