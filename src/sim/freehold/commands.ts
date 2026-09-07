// The housing command bodies behind the SimContext seam: one exported function
// per wire command, shaped `(ctx, pid, ...args)`. Each resolves the caller
// in-module through `ctx.resolve(pid)`, the professions/enchanting.ts,
// professions/gathering.ts and mounts_training.ts shape (not the farming
// actions: their Sim delegate resolves the caller before calling them), and
// then returns. The module takes a CONCRETE pid while the Sim delegate resolves
// the default: the server passes the session pid and the module never guesses
// a caller. Today the resolve is only a guard; the real bodies bind the
// resolved player (`const r = ctx.resolve(pid); if (!r) return;` and then read
// `r.e` and `r.meta`). The real bodies must also re-validate the payload shape
// HERE (integer slot and placement ids, finite coordinates, the visit-policy
// enum), so the offline host enforces exactly what server/freehold_wire.ts
// enforces on the wire. This change registers the commands on every host; the
// numbered later work named on each body puts the real decision here. Nothing
// below mutates state, emits an event or draws rng, so a host running these is
// indistinguishable from one without them.
//
// THE FLAG IS NOT RE-CHECKED HERE, and the first real body owes that decision.
// Today `server/game.ts`'s pre-switch `refusedFreeholdCommand` is the ONLY
// server-side enforcement of the dark-realm rule: `ctx.freeholdsEnabled` reaches
// the sim (D85) but nothing reads it, so the dispatch gate is a single point of
// failure the moment a body does something. Whoever lands the first real body
// either opens it with a `ctx.freeholdsEnabled` early return (defense in depth,
// and the offline host then honors its own opt-in the way it honors the payload
// rules above) or records the explicit ruling that the dispatch gate is the one
// gate. Do not leave that unstated.

import type { SimContext } from '../sim_context';
import type { FreeholdVisitPolicy } from './types';

/** Enter the caller's own freehold. 05 implements the claim and entry. */
export function freeholdEnter(ctx: SimContext, pid: number): void {
  if (!ctx.resolve(pid)) return;
}

/** Leave the freehold the caller stands in. 05 implements the exit. */
export function freeholdLeave(ctx: SimContext, pid: number): void {
  if (!ctx.resolve(pid)) return;
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
