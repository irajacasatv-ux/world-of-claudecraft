// THE FOUR LIVENESS READS the housing store takes from the sim, bound in ONE
// place over ONE map. The store asks "does this owner hold a live record" four
// ways, at four different moments: `hasLive` in preload's already-live arm,
// `livePlotId` in classify's absent arm, `liveRev` in the revision probe and in
// retain's capture confirmation, and `serialize` in the write and the leave
// capture. All four read `ctx.freeholds`, so a record is live for all of them
// or for none of them, and every conclusion the store's suite draws rests on
// that.
//
// Extracted from the composition root so the root and the suite's harness bind
// the SAME function. The harness used to bind the four separately, and it could
// tell the loader no record was live while handing the writer a document for
// one: a state no realm can produce, and the reason 07's QA verdict failed.

import { persistedFreeholdFromState } from '../src/sim/freehold/persisted';
import { serializeFreehold } from '../src/sim/freehold/state';
import type { SimContext } from '../src/sim/sim_context';
import type { FreeholdPersistPorts } from './freehold_persist';

export type FreeholdLivenessPorts = Pick<
  FreeholdPersistPorts,
  'hasLive' | 'serialize' | 'liveRev' | 'livePlotId'
>;

/**
 * The four reads over `ctxOf().freeholds`. A GETTER rather than a context, so
 * each read looks the map up at the moment it runs, exactly as the closures it
 * replaced did.
 */
export function freeholdLivenessPorts(ctxOf: () => SimContext): FreeholdLivenessPorts {
  return {
    hasLive: (ownerKey) => ctxOf().freeholds.has(ownerKey),
    serialize: (ownerKey) => {
      const state = serializeFreehold(ctxOf(), ownerKey);
      return state === null ? null : persistedFreeholdFromState(state);
    },
    liveRev: (ownerKey) => ctxOf().freeholds.get(ownerKey)?.rev ?? null,
    livePlotId: (ownerKey) => ctxOf().freeholds.get(ownerKey)?.plotId ?? null,
  };
}
