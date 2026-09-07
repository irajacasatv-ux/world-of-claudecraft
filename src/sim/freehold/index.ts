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
export { shouldSpawnSurfaceNpc } from './should_spawn_npc';
export {
  defaultFreeholdState,
  evictFreehold,
  freeholdLayoutView,
  loadFreehold,
  myFreeholdView,
  serializeFreehold,
} from './state';
// Three of the type re-exports below have no importer ANYWHERE yet and are
// RESERVED, not dead: FreeholdLayoutRow lands consumers at 07/08a, FreeholdTier
// at 03, FreeholdTrophyRecord at 17. Counted repo-wide rather than through this
// barrel, because most consumers import the type they want from ./types
// directly (the type-only exception below), so today only FreeholdState is
// actually imported through here. They are listed so the directory's public
// shape is frozen before its producers exist; do not strip them as unused.
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
export { asFreeholdPlotId } from './types';
