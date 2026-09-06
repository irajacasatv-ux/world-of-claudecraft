// The public surface of src/sim/freehold/: explicit re-export lists, never
// `export *`, so a consumer reads what the directory offers here and a leaf
// added later is a visible edit. The pvp/index.ts cycle rule applies unchanged:
// a module that needs a RUNTIME import from a package that itself imports this
// barrel stays OUT of the list and is imported by path. No module here needs
// one today (every import below the barrel is type-only), so there is no
// exception to document yet.
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
export { defaultFreeholdState, evictFreehold, loadFreehold, serializeFreehold } from './state';
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
