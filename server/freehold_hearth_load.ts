// The LOGIN-PATH CLOCK READ, turned into the pair the store installs: a ready
// time and a revision, or a cold clock. Extracted from server/freehold_persist.ts
// because none of it needs the store's private state, only somewhere to log, and
// because the clock's failure policy is the deliberate ASYMMETRY that file argues
// at length: the plot fails CLOSED (an unreadable row holds the account and the
// row is left alone) while the clock fails OPEN (an unreadable clock starts cold
// and the login proceeds). Keeping that policy in one small named module is what
// stops the next reader restoring symmetry by accident.

import type { FreeholdHearthLoad } from './freehold_hearth_db';

/** The absent clock's revision, spelled through a constant on both sides: the
 *  plot fence and the hearth counter are different counters that share a value,
 *  and a bare zero is how a later reader comes to think they are one. */
export const ABSENT_HEARTH_REVISION = '0';

/** What the store installs for one account: a forward-only ready time and the
 *  revision it was read at. */
export interface FreeholdHearthReading {
  readonly readyAtMs: number;
  readonly revision: string;
}

/** The cold clock, and the ONE place its shape is written. */
export const COLD_HEARTH: FreeholdHearthReading = {
  readyAtMs: 0,
  revision: ABSENT_HEARTH_REVISION,
};

/**
 * A durable clock load, normalized. A `state` load answers its own numbers, with
 * a non-finite or non-positive ready time floored to zero rather than carried
 * onward as NaN. Every other kind answers the cold clock, and an `unsupported`
 * one says so, because that kind means a row EXISTS in a shape this build cannot
 * read: silently starting cold there hides a schema the realm has outgrown.
 */
export function normalizeHearthLoad(
  load: FreeholdHearthLoad,
  warn: (message: string) => void,
): FreeholdHearthReading {
  if (load.kind === 'state') {
    const readyAtMs = Number(load.state.readyAtMs);
    return {
      readyAtMs: Number.isFinite(readyAtMs) && readyAtMs > 0 ? readyAtMs : 0,
      revision: load.state.revision,
    };
  }
  if (load.kind === 'unsupported') {
    warn(`freehold hearth clock unsupported (${load.detail}); the cooldown starts cold`);
  }
  return COLD_HEARTH;
}
