import type { FreeholdLayoutView, FreeholdView, FreeholdVisitPolicy } from '../sim/freehold/types';

// The public view types travel with the facet, type-only: this seam imports
// src/sim for types alone (pinned by tests/architecture.test.ts), so no
// housing value ever crosses it. A consumer that needs the tier or plot-id
// aliases reads them off FreeholdView.
export type { FreeholdLayoutView, FreeholdView, FreeholdVisitPolicy };

// Freeholds, player housing: the caller's OWN freehold descriptor, the
// furnishing layout of the freehold the caller stands in, and the commands
// that mutate a freehold (enter and leave, furnishing placement with its undo
// stack, the ledger payment, the visit policy, and the ephemeral build
// presence). The foundation landed the whole surface DARK behind one gate:
// the server refuses all ten commands at dispatch while the realm flag is
// off, both data members are null everywhere, and each member lights behind
// exactly this shape, so the facet, the wire vocabulary and the parity pins
// never move again. Lit so far: `freeholdEnter` and `freeholdLeave` (the
// owner-keyed claim on the dungeon slot pool; the Sim decides and moves the
// player, ClientWorld sends the command and mirrors nothing, and the
// refusals are text-free `freeholdDenied` events). The other eight are still
// no-ops on both hosts.
//
// THE WIRE NEVER CARRIES AN OWNER KEY. FreeholdView is an opaque public plot
// identity plus its tier and visit policy; the account or guild ownership key
// stays inside the sim's own record and never reaches a client, so a viewer
// can neither learn who owns a plot nor forge a command against one.
export interface IWorldHousing {
  // The caller's own freehold as the public descriptor (opaque plot identity,
  // never an account or guild key). Null on both hosts until its producer
  // lights it (05): online it will mirror a self-wire key the sibling decode
  // module admits, offline the Sim will project its own live record.
  readonly myFreehold: FreeholdView | null;
  // The furnishing layout of the freehold the caller stands in, one row per
  // placement. Null on both hosts until the descriptor publishes it (08a);
  // the renderer consumes it (09). Server-derived and never predicted: a
  // placement's row arrives from the authority after the command resolves.
  readonly freeholdLayout: FreeholdLayoutView | null;
  // The housing clock base on the farmNowMs shape, read fresh per call: the
  // Sim returns its sim-clock lockoutNowMs and ClientWorld returns Date.now
  // (the base the live server writes housing timestamps in). Consumers
  // (13, 16) compare a housing timestamp against this value only and never
  // subtract another clock from it, so no render/ui code mixes clock bases.
  // Purely COSMETIC: the authoritative facts stay the descriptor's fields.
  housingNowMs(): number;
  // Step through the caller's own freehold door, and back out to the world.
  // Both carry NO payload: which plot, whether the caller may enter it, and
  // where they land all resolve server-side (src/sim/freehold/instance.ts;
  // the realm's dispatch gate still refuses both while the flag is off).
  freeholdEnter(): void;
  freeholdLeave(): void;
  // Set the bagged furnishing in carried slot `slot` down at a freehold-local
  // position and yaw. The Sim will re-validate the slot against the sender's
  // own bags, the item kind, the plot's placement budget and the bounds; the
  // wire carries the slot index and the four numbers only. Dark no-op here.
  placeFurnishing(slot: number, x: number, y: number, z: number, yaw: number): void;
  // Move the placed row `placementId` to a new freehold-local position and
  // yaw. Same authority split as placeFurnishing; the id names a row of the
  // caller's own layout and nothing else rides the wire. Dark no-op here.
  moveFurnishing(placementId: number, x: number, y: number, z: number, yaw: number): void;
  // Pick the placed row `placementId` back up into the caller's bags. The
  // bag space check and the row's return item resolve server-side. Dark
  // no-op here.
  removeFurnishing(placementId: number): void;
  // Step the caller's placement history back one edit, and forward again.
  // The undo stack is server state, so both carry NO payload; a client can
  // neither name the edit to revert nor replay one. Dark no-ops here.
  undoPlacement(): void;
  redoPlacement(): void;
  // Pay the freehold's upkeep ledger with the caller's eligible materials.
  // The bill, the paid-through week and the prepaid cap all resolve
  // server-side (13 owns the rules); NO payload. Dark no-op here.
  payLedger(): void;
  // Choose who may step through the caller's freehold door: closed, friends,
  // or open. The policy is the only payload; the server re-validates the
  // three-string vocabulary and the caller's ownership. Dark no-op here.
  setVisitPolicy(policy: FreeholdVisitPolicy): void;
  // Ephemeral build presence (C03). Carries only `active`; the online sender
  // adds the acknowledged plot id, the accepted transition id and a monotonic
  // sequence, and the host supplies the authenticated session. Dark no-op
  // here; the sim-side authority and the public boolean land later.
  setFreeholdBuildPresence(active: boolean): void;
}
