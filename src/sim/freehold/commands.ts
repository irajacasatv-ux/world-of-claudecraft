// The housing command bodies behind the SimContext seam: one exported function
// per wire command, shaped `(ctx, pid, ...args)`. Each resolves the caller
// in-module through `ctx.resolve(pid)` (the enter and leave bodies do so in
// their gate and instance modules), the professions/enchanting.ts,
// professions/gathering.ts and mounts_training.ts shape (not the farming
// actions: their Sim delegate resolves the caller before calling them), and
// then returns. The module takes a CONCRETE pid while the Sim delegate resolves
// the default: the server passes the session pid and the module never guesses
// a caller. For the eight still-inert bodies the resolve is only a guard; the
// real bodies bind the resolved player (`const r = ctx.resolve(pid); if (!r)
// return;` and then read `r.e` and `r.meta`) and must re-validate the payload
// shape HERE (integer slot and placement ids, finite coordinates, the
// visit-policy enum), so the offline host enforces exactly what
// server/freehold_wire.ts enforces on the wire. The numbered later work named
// on each inert body puts the real decision here; none of those eight mutates
// state, emits an event or draws rng, so a host running them is
// indistinguishable from one without them.
//
// THE FLAG RULING, recorded with the first real bodies (enter and leave): the
// server dispatch gate is the ONE gate. `server/game.ts`'s pre-switch
// `refusedFreeholdCommand` enforces the dark-realm rule on the command wire
// (the REST status read gates itself in server/freehold_routes.ts), and no
// command body here re-checks `ctx.freeholdsEnabled`. The sim honors the flag
// in one place only: the two record inserters in state.ts (loadFreehold and
// ensureFreeholdRecord, which the addPlayer seed rides) insert nothing on a
// dark host, so a dark host holds no record and every enter answers the
// text-free `no_freehold` refusal with nothing moved, claimed or drawn. That
// is what keeps the offline host's own opt-in honored without a second gate
// whose drift the dispatch gate could hide, and it is why enterFreehold has no
// flag early return of its own. A later body that needs the flag reads it
// through the same primitive and says so here.

import type { SimContext } from '../sim_context';
import { confirmFreeholdGate } from './gate';
import { leaveFreehold } from './instance';
import type { FreeholdVisitPolicy } from './types';

/** Confirm entry at the caller's nearby authoritative Freehold Gate. */
export function freeholdEnter(ctx: SimContext, pid: number): void {
  confirmFreeholdGate(ctx, pid);
}

/** Leave the freehold the caller stands in: the owner-claim exit in instance.ts. */
export function freeholdLeave(ctx: SimContext, pid: number): void {
  leaveFreehold(ctx, pid);
}

/** Place the furnishing in bag slot `slot` at a position and heading. 08
 *  implements bounded placement. */
export function placeFurnishing(
  ctx: SimContext,
  pid: number,
  slot: number,
  x: number,
  y: number,
  z: number,
  yaw: number,
): void {
  if (!ctx.resolve(pid)) return;
  void slot;
  void x;
  void y;
  void z;
  void yaw;
}

/** Move an existing placement to a new position and heading. 08 implements
 *  the bounded move. */
export function moveFurnishing(
  ctx: SimContext,
  pid: number,
  placementId: number,
  x: number,
  y: number,
  z: number,
  yaw: number,
): void {
  if (!ctx.resolve(pid)) return;
  void placementId;
  void x;
  void y;
  void z;
  void yaw;
}

/** Return a placement to the caller's bags. 08 implements the removal. */
export function removeFurnishing(ctx: SimContext, pid: number, placementId: number): void {
  if (!ctx.resolve(pid)) return;
  void placementId;
}

/** Undo the caller's last placement step. 08 implements the session undo. */
export function undoPlacement(ctx: SimContext, pid: number): void {
  if (!ctx.resolve(pid)) return;
}

/** Redo the caller's last undone placement step. 08 implements the session redo. */
export function redoPlacement(ctx: SimContext, pid: number): void {
  if (!ctx.resolve(pid)) return;
}

/** Pay the freehold ledger. 13 implements the payment and the prepay window. */
export function payLedger(ctx: SimContext, pid: number): void {
  if (!ctx.resolve(pid)) return;
}

/** Set who may visit the caller's freehold. 18 implements the policy. */
export function setVisitPolicy(ctx: SimContext, pid: number, policy: FreeholdVisitPolicy): void {
  if (!ctx.resolve(pid)) return;
  void policy;
}

/** Ephemeral build presence (C03). 08 implements the authority in its own
 *  build_presence.ts module and 08a publishes only the public boolean. */
export function setFreeholdBuildPresence(ctx: SimContext, pid: number, active: boolean): void {
  if (!ctx.resolve(pid)) return;
  void active;
}
