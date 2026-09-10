// THE WRITE SEAL: the one predicate that decides whether a document about to be
// compare-and-swapped onto a durable row is a FRESHLY SEEDED DEFAULT standing
// where a real house used to be. It is the guard the packet's one invariant
// rests on (only a genuinely ABSENT row may resolve to the free tier-0 Inn
// Room), and it is out here rather than inside the store's runWrite because it
// is PURE: three fields in, one boolean out, no ports, no entry map, no clock.
//
// EIGHT distinct paths to violating that invariant have been found in this
// subsystem, and four separate rounds each tried to close the last of them by
// adding a clause to this expression. It lives in its own file so the next
// reader can drive every arm of it from a Vitest with three literals instead of
// building a store, and so a change to it is a change to a named module rather
// than a line inside a nine-hundred-line coordinator method.

import type { PersistedFreehold } from '../src/sim/freehold/persisted';
import { PENDING_FREEHOLD_PLOT_ID } from '../src/sim/freehold/state';

/** What the seal needs to know about the store entry standing behind the write:
 *  the document it last COMMITTED, and whether a durable row exists at all. */
export interface FreeholdSealEntry {
  /** The document as actually written by the last commit, or null before one. */
  readonly state: PersistedFreehold | null;
  /** Null until a row exists. Null means there is nothing to lose. */
  readonly durableRev: string | null;
}

/**
 * True when writing `persisted` would put a freshly seeded default over a real
 * durable row. The caller refuses the write and quiesces the owner.
 *
 * @param persisted the document AS SENT, so the identity judged is the one that
 *   lands on disk rather than the one the live record happens to carry.
 */
export function seedWouldLandOnRealRow(
  persisted: PersistedFreehold,
  entry: FreeholdSealEntry,
): boolean {
  // IDENTITY, not just presence. A live record still carrying the unassigned
  // plot id has never been loaded from a row nor minted one: it is a fresh
  // seed by construction. Writing it over a row that HAS a durable revision
  // erases tier, layout, trophies, condition and visit policy, and because
  // the compare-and-swap deliberately never touches plot_id, the loss leaves
  // the identity intact and is invisible in the key.
  //
  // The window is real: a leave drops the store entry while the sim record
  // is still live, so a rejoin landing in between reads the row, learns a
  // durable revision, and is then handed a freshly seeded default when the
  // old session's removePlayer finally evicts. Refusing preserves the row,
  // at the cost of one session played on a default record with no writes.
  //
  // THREE TESTS, because identity alone has a blind window. A brand-new
  // account's record legitimately carries the stand-in identity for its
  // whole first session, and so does a freshly seeded default, so between
  // that account's first insert and its first reload the two are
  // indistinguishable by name.
  const standInSeed = persisted.plotId === PENDING_FREEHOLD_PLOT_ID;
  // The second test refuses an UNTOUCHED seed without needing a name: a
  // PRISTINE default carries no information at all, so refusing to write
  // one over a row can never lose anything, and an entry that knows more
  // than a pristine default is an entry whose record has diverged from one.
  //
  // MEASURED, so nobody has to guess what it is still for: while the entry
  // loaded a ROW the name comparison above catches every reseed first, so
  // this arm is dead there and removing it leaves the suite green. For an
  // entry that MINTED its own row it is the opposite: see the OPEN GATE
  // below, where the name comparison cannot fire at all and this arm plus
  // the revision test are the only things standing.
  //
  // IT IS KEPT BECAUSE THE NAME COMPARISON IS EXACTLY WHAT A FUTURE ROUND
  // WILL NARROW. Round nine exempted the stand-in from it to stop a healthy
  // fresh account being quiesced, and in that shape this arm and the one
  // below were the only things left standing between a seeded default and a
  // real house. The gate that fix is carried under will narrow it again.
  // This arm also reads the CONTENT directly, so unlike the revision test
  // below it survives a future writer that adds a furnishing and forgets to
  // bump the revision.
  const pristineSeed =
    standInSeed &&
    persisted.rev === 0 &&
    persisted.layout.length === 0 &&
    persisted.trophies.length === 0;
  // TOTAL over the persisted shape, and expressed against `persisted`
  // rather than against the sim's default constants. This arm is only ever
  // read when `pristineSeed` holds, so `persisted` IS the pristine default
  // standing in front of the entry, and "knows more" is exactly "differs
  // from it in any field a row carries". Enumerating rev, layout and
  // trophies alone left tier, condition and visit policy out, which made
  // the arm silently depend on every tier change also bumping the revision:
  // true today, and a property enforced in another file.
  const entryKnowsMore =
    entry.state !== null &&
    (entry.state.rev > 0 ||
      entry.state.layout.length > 0 ||
      entry.state.trophies.length > 0 ||
      entry.state.tier !== persisted.tier ||
      entry.state.condition !== persisted.condition ||
      entry.state.visitPolicy !== persisted.visitPolicy);
  // The third test closes the REST of it, and it is the one the other two
  // miss. A seed stops being pristine the instant the returning player
  // touches it: one tier grant, or one furnishing once that writer lands,
  // and the record is a stand-in identity at revision one standing against
  // an entry that committed revision seven. Both other tests pass, the
  // empty default is compare-and-swapped over the real house, and because
  // the swap never touches plot_id the loss is invisible in the key.
  //
  // A REGRESSED REVISION IS THE DISCRIMINATOR, and it is decidable where
  // "newer" is not. Every sanctioned writer of a live record only ever
  // increments its revision (the coupling is pinned by a source scan in
  // tests/freehold_module.test.ts), and every install this store offers a
  // rejoin carries at least the revision the entry last committed, so a
  // live record BELOW that has to be a different record. It is checked only
  // under the stand-in identity because a record carrying any other name is
  // already refused by the first test.
  //
  // WHICH DIMENSIONS A TEST CAN ISOLATE, measured rather than assumed. For a
  // ROW-LOADED entry only the identity and revision dimensions can be killed
  // by a behaviour case; the pristine arm and its layout, trophies, tier,
  // condition and visit-policy dimensions cannot, because the name
  // comparison catches every reseed there first. They are kept for totality
  // over the persisted shape and listed here rather than pinned by a case
  // that reaches them through a different arm. A case that passes for the
  // wrong reason is the failure this packet has already recorded twice, and
  // it recorded it a third time on the case that named the caught-up seed.
  const revisionRegressed = entry.state !== null && persisted.rev < entry.state.rev;
  // THE FIRST TEST JUDGES A NAME ONLY WHEN THERE IS ONE, and this is the
  // correction that lets the other two carry the stand-in case alone.
  //
  // A bare `persisted.plotId !== entry.state.plotId` quiesced a healthy
  // fresh account for the rest of its session, which is the Y1 failure
  // seen from the other end. Nothing teaches a live record its minted name,
  // so a first-session record carries the stand-in for as long as it lives;
  // but if that account's store entry is dropped and RE-READ from the row
  // it just inserted (retain's lost-entry reload, or a second character
  // joining on preload's already-live-but-unloaded arm), `entry.state`
  // comes back carrying the ROW's minted name while the same live record
  // still carries the stand-in. The names differ, nothing is wrong, and the
  // account was write-blocked with a misleading "the live record is not the
  // record this entry loaded".
  //
  // A STAND-IN IS THE ABSENCE OF A NAME, not a different one, so it is
  // judged by CONTINUITY instead: pristine-and-the-entry-knows-more, or a
  // regressed revision. A record carrying any OTHER name is a different
  // record by construction and is still refused outright.
  // ANY NAME THAT IS NOT THE ONE THIS ENTRY LOADED, stand-in included.
  //
  // AND THIS TEST IS NOT TOTAL. It is total for an entry that loaded a ROW,
  // whose cached name is the row's minted id while a freshly seeded default
  // carries the stand-in. It is INERT for an entry that MINTED its own row:
  // `applyWriteResult` caches the identity the LIVE RECORD carried, nothing
  // teaches a live record its minted name, so that entry's cached name IS
  // the stand-in and a reseeded default carries the same literal. The two
  // are equal, this comparison is false by value equality, and the two
  // continuity tests below are the whole seal. Both are revision-shaped, so
  // a reseeded default whose revision has CAUGHT UP satisfies neither and
  // the empty tier-0 default lands on the house. That is the EIGHTH path,
  // reproduced against this store and pinned AS IT BEHAVES in a case named
  // KNOWN DEFECT, and it is carried as an open gate in
  // docs/freeholds/persistence-rollout-contract.md section 8a. Its fix is
  // the same design decision the paragraph below already owes: teach the
  // live record its minted identity AT INSTALL, on the ABSENT arm only,
  // which makes this comparison total for every entry class. Do not close it
  // by adding a fourth clause here; four rounds have each tried that.
  //
  // ROUND NINE EXEMPTED THE STAND-IN HERE AND IT WAS REVERTED, because the
  // exemption is a data-loss hole: for an entry that loaded a ROW, its
  // cached name is the row's, a freshly seeded default carries the stand-in,
  // and skipping the comparison left only the continuity tests below. Those
  // catch a seed whose revision is BELOW the entry's, and a returning player
  // needs only `entry.state.rev + 1` edits inside one sweep interval to
  // carry it above, at which point the empty tier-0 default is
  // compare-and-swapped over the house. Executed against the real store both
  // ways: refused without the exemption, written with it.
  //
  // The exemption existed to stop a healthy fresh account being quiesced
  // when its entry re-reads the row it inserted (the live record still
  // carries the stand-in while the re-read entry now holds the row's name).
  // That failure is real and is carried as a named gate rather than paid for
  // in data loss: refusing a write costs one session's edits, admitting a
  // seed costs the house. Fail closed. The gate's actual fix is to teach the
  // live record its minted identity at INSTALL, which is a design decision
  // for the maintainer, not a fourth heuristic in this expression.
  //
  // GUARDED ON ITS OWN, not by the chain below: hoisting this to a name
  // takes it out from behind `entry.state !== null`, and an entry with no
  // cached state is every account's very first write.
  const foreignIdentity = entry.state !== null && persisted.plotId !== entry.state.plotId;
  // `entry.durableRev !== null` is EQUAL to `entry.state !== null` by
  // today's arithmetic, not by declaration: all three writers of
  // `entry.state` set `entry.durableRev` in the same statement (classify's
  // row arm, classify's absent arm and applyWriteResult). A mutation pass
  // confirms it, so no behaviour test can isolate it. It is kept because it
  // says what the guard MEANS, which is that a row exists to lose.
  const seededOverReal =
    entry.durableRev !== null &&
    entry.state !== null &&
    (foreignIdentity || (pristineSeed && entryKnowsMore) || (standInSeed && revisionRegressed));
  return seededOverReal;
}
