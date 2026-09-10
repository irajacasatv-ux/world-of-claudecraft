// The public surface of src/sim/freehold/: explicit re-export lists, never
// `export *`, so a consumer reads what the directory offers here and a leaf
// added later is a visible edit. The pvp/index.ts cycle rule applies unchanged:
// a module that needs a RUNTIME import from a package that itself imports this
// barrel stays OUT of the list and is imported by path. No module here needs
// one today. The surface admission leaf imports only content identities and
// shared types, so it also stays behind the barrel without a cycle.
export {
  freeholdEnter,
  freeholdLeave,
  moveFurnishing,
  payLedger,
  placeFurnishing,
  redoPlacement,
  removeFurnishing,
  setFreeholdBuildPresence,
  setVisitPolicy,
  undoPlacement,
} from './commands';
export { isFreeholdCraftAvailable } from './crafted_availability';
export {
  devGrantFreeholdTier,
  type FreeholdDevGrantOutcome,
  type FreeholdDevGrantResult,
} from './dev_grant';
// mergeFreeholdKeyReadyAt is deliberately NOT here. It is one of exactly two
// writers of the Sim-owned hearth clock map, and the forward-only rule it
// carries is the reason nothing outside this directory may write that map: a
// name on the barrel invites a host to call it, and a host calling it is the
// third writer the rule exists to prevent. server/freehold_persist.ts imports
// it by path, under a source scan that holds the count at two.
export {
  FREEHOLD_GATE_INTERACT_RANGE,
  FREEHOLD_GATE_TEMPLATE_ID,
  HEARTH_KEY_COOLDOWN_MS,
  HEARTH_KEY_ITEM_ID,
} from './gate_rules';
export {
  enterFreehold,
  type FreeholdClaimDescriptor,
  freeholdDefForTier,
  freeholdDescriptorFor,
  leaveFreehold,
} from './instance';

export { type FreeholdOwnerStampSlice, freeholdKeyFor, freeholdOwnerKeyOfMeta } from './owner_key';
// The DURABLE PERSISTENCE LEAF is deliberately almost absent from this list.
// Its ceilings, its loader, its reporter and its refusal predicate have exactly
// one consumer each, server/freehold_persist.ts, which imports them by path;
// re-exporting them here would put a server-facing vocabulary on the surface
// every UI and sim caller reads, for no consumer. Only the projection down to
// the durable subset crosses the barrel, because a caller with a live record
// legitimately wants it without knowing where the row is written.
export { type PersistedFreehold, persistedFreeholdFromState } from './persisted';
export { shouldSpawnSurfaceNpc } from './should_spawn_npc';
// applyFreeholdOwnerStamp stays OFF the barrel: seedFreeholdOnJoin is its one
// caller and the direct tests import state.ts, so no consumer outside the
// directory gets a second way to write the host owner stamp.
export {
  defaultFreeholdState,
  ensureFreeholdRecord,
  evictFreehold,
  freeholdLayoutView,
  loadFreehold,
  myFreeholdView,
  PENDING_FREEHOLD_PLOT_ID,
  releaseFreeholdOnLeave,
  seedFreeholdOnJoin,
  serializeFreehold,
  setFreeholdTier,
} from './state';
// Two of the type re-exports below have no importer ANYWHERE yet and are
// RESERVED, not dead: FreeholdLayoutRow lands consumers with the layout and
// placement work, FreeholdTrophyRecord with the trophies. FreeholdTier is
// live (state.ts, instance.ts and dev_grant.ts import it from ./types).
// Counted repo-wide rather than through this barrel, because most consumers
// import the type they want from ./types directly (the type-only exception
// below); sim.ts and the tests import a handful of these through here. The
// FreeholdOwnerStampSlice re-export from ./owner_key is the same kind of
// reserved row: the persistence slice's row mapper stamps through it. They are
// listed so the directory's public shape is frozen before its producers
// exist; do not strip them as unused.
export type {
  FreeholdLayoutRow,
  FreeholdLayoutView,
  FreeholdPlotId,
  FreeholdState,
  FreeholdTier,
  FreeholdTrophyRecord,
  FreeholdView,
  FreeholdVisitPolicy,
} from './types';
// FREEHOLD_VISIT_POLICIES is deliberately NOT re-exported here. It is the same
// server-facing durable vocabulary as the persistence leaf above, its one
// consumer (server/freehold_persist.ts) imports it from ./types by path, and
// putting it on the barrel would place it on the surface every UI and sim
// caller reads for no consumer.
export { asFreeholdPlotId } from './types';
