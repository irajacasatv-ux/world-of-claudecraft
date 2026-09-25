// THE SWEEP'S OWN DIRTY DETECTOR, as a pure decision. The periodic save flush
// asks every loaded owner one question, "has this record moved since the last
// thing I wrote", and the answer is arithmetic over three integers. It is out
// here rather than inside server/freehold_persist.ts because none of it needs
// the store: it takes the live revision and what the entry remembers, and
// returns a boolean. The store keeps the two things that ARE its own, the
// blocked check in front of it and the generation it bumps behind it.
//
// DETECTION IS NOT ADMISSION, and that split is the whole reason this and the
// write seal both exist. This probe says a backwards revision is a CHANGE worth
// looking at; server/freehold_write_seal.ts then decides whether that record may
// LAND, and it says no for every entry class. An earlier version of the store's
// comment said a record carrying a real plot name still goes backwards onto the
// row, deliberately, and that rule is RETIRED rather than quietly dropped: a
// live revision below the entry's last committed one means the live record is
// not the record that commit came from, since every install a rejoin is offered
// carries at least the committed revision (bar one known hole, the twelfth
// path in server/freehold_write_seal.ts, which this probe arms on only while
// the stale record sits below the committed revision) and every sanctioned
// mutator only increments.
// Writing it would also walk the client-facing wire counter backwards
// permanently, which is the exact harm the loader's own wire_rev_shape hold
// exists to prevent on the read side. So the probe arms and the seal refuses.

/** What the probe needs about the entry standing behind a live record. Declared
 *  structurally rather than importing the store's entry type, the same way
 *  FreeholdSealEntry is, so this module never depends on the store. */
export interface FreeholdRevisionProbeEntry {
  /** The document as actually written by the last commit, or null before one. */
  readonly state: { readonly rev: number } | null;
  /** Whether a write is out right now. */
  readonly running: boolean;
  /** The revision the running write is carrying, or null when none is. */
  readonly snapshotRev: number | null;
}

/**
 * True when the live record has moved away from everything this entry has
 * already accounted for.
 *
 * A revision that went BACKWARDS counts as movement too, because a live record
 * that is not the one this entry committed is exactly the state worth looking
 * at; the seal decides what happens to it.
 *
 * THE RUNNING-WRITE ARM is not an optimization. `state` only advances at COMMIT,
 * so while a write is in flight it still names the pre-edit revision and every
 * sweep would re-detect the same edit, arm a second write and burn a durable
 * revision for nothing. Comparing against what the running write is actually
 * carrying is what stops that.
 *
 * @param liveRev the record's own revision, or null when no record is live. A
 *   caller with no record has nothing to detect and gets false.
 */
export function freeholdRevisionMoved(
  liveRev: number | null,
  entry: FreeholdRevisionProbeEntry,
): boolean {
  if (liveRev === null) return false;
  if (entry.state !== null && liveRev === entry.state.rev) return false;
  if (entry.running && entry.snapshotRev !== null && liveRev === entry.snapshotRev) return false;
  return true;
}
