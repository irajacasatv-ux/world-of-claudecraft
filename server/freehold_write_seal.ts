// THE WRITE SEAL: the one predicate that decides whether a document about to be
// compare-and-swapped onto a durable row is a FRESHLY SEEDED DEFAULT standing
// where a real house used to be. It is the guard the packet's one invariant
// rests on (only a genuinely ABSENT row may resolve to the free tier-0 Inn
// Room), and it is out here rather than inside the store's runWrite because it
// is PURE: three fields in, one boolean out, no ports, no entry map, no clock.
//
// Many distinct paths to violating that invariant have been found in this
// subsystem (the persistence findings ledger counts them), and four separate
// rounds each tried to close the latest by adding a clause to this expression.
// It lives in its own file so the next reader can drive every arm of it from a
// Vitest with three literals instead of building a store, and so a change to it
// is a change to a named module rather than a line inside a nine-hundred-line
// coordinator method.

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
  // MEASURED, and the measurement has MOVED, which is worth saying plainly
  // because an earlier version of this paragraph is now false. It used to
  // read: dead for a ROW-LOADED entry, because the name comparison catches
  // every reseed there first, but the only thing standing for an entry that
  // MINTED its own row, where that comparison could not fire at all. Both
  // halves of that are now the same half. `installLoadedFreehold` names the
  // minted record and `insertWouldMintAnUnnamedRow` refuses to create a row
  // for one it did not name, so `entry.state.plotId` IS the minted id and the
  // name comparison fires first for every entry class. This arm and its
  // content dimensions are unreachable THROUGH THE STORE now, not only for
  // row-loaded entries, and they are driven with literals and their own
  // mutants in tests/server/freehold_write_seal.test.ts instead.
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
  // AND ITS `rev` DIMENSION IS ABSORBED, measured rather than assumed. This arm
  // is only ever read under `pristineSeed`, which requires `persisted.rev === 0`,
  // so `entry.state.rev > 0` is exactly `revisionRegressed` there, and that is a
  // separate disjunct of the same expression. Deleting it leaves this file's own
  // suite and the store's green. It is kept for totality over the persisted
  // shape, and named here so the next reader does not write a case that reaches
  // it through the other disjunct and believe the dimension is covered; one such
  // case existed and is corrected in tests/server/freehold_write_seal.test.ts.
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
  // live record BELOW that has to be a different record. THAT PREMISE HAS A
  // KNOWN HOLE: an answer read before another session of the same account
  // committed and was evicted, then installed at the join, carries an OLDER
  // revision. The first sweep after that join still refuses it here, but a
  // returning player who edits past the committed revision inside that one
  // autosave interval carries it above, and then no arm here can see it (the
  // twelfth path, pinned as it behaves in tests/server/freehold_persist.test.ts
  // with its window; a ruling is owed).
  //
  // UN-GATED FROM THE STAND-IN, and that is the companion the install fix owes.
  // It used to be checked only under the stand-in identity, on the reasoning
  // that a record carrying any other name is already refused by the first test.
  // After the fix no ONLINE record carries the stand-in at all, so leaving the
  // gate on would have made this discriminator dead code on the one host it is
  // for, and its live case is the same-account character swap, where the record
  // the store sees belongs to the previous session. Un-gated it is checked for
  // every entry class.
  //
  // WHY THAT IS SAFE AGAINST W1, which is the finding that made a revision
  // comparison wrong once before. W1 compared a CAPTURE's revision with a live
  // record's, and those are counters on two different timelines because a rejoin
  // replay RESTARTS the record's revision from the last committed value. This
  // compares the LIVE record with the entry's own last COMMITTED document, which
  // is one timeline: every install this store offers a rejoin carries at least
  // the committed revision (bar the twelfth path's known hole above), and every
  // sanctioned mutator only increments.
  //
  // WHAT IT NEWLY REFUSES, named rather than discovered: a leave capture
  // strictly older than the last committed write, offered to a rejoin as the
  // install source, puts the live revision below the entry's. Refusing there
  // loses nothing (the capture is superseded by definition) and the row
  // survives, but it does book a write failure and quiesce an entry that is
  // already about to be collected. It was reachable for a stand-in-named entry
  // before this change and is reachable for every entry class after it.
  //
  // WHICH DIMENSIONS A TEST CAN ISOLATE, measured rather than assumed. For
  // EVERY entry class now, not only a row-loaded one, only the identity and
  // revision dimensions can be killed by a behaviour case through the store;
  // the pristine arm and its layout, trophies, tier, condition and
  // visit-policy dimensions cannot, because the name comparison catches every
  // reseed first. They are kept for totality
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
  // the stand-in and a reseeded default carries the same literal. That was the
  // EIGHTH path to an empty tier-0 Inn Room landing on a real house, and it is
  // CLOSED at the source rather than here: installLoadedFreehold installs the
  // minted identity on the ABSENT arm, so an online record answers to its own
  // name from its first session.
  //
  // WHAT MAKES THAT TOTAL is a second refusal, and it is worth naming because
  // the first version of the fix was NOT total and a fresh reader found it.
  // installLoadedFreehold returns early on any HOLD, so a record seeded while
  // its own load was refused never gets a name, and an entry that then loads or
  // mints one puts this comparison back to comparing a stand-in with a stand-in.
  // classify's absent arm refuses to name a row for such a record at all
  // (`unnamed_record`), which is what keeps every entry that CAN write to a
  // record whose name it knows. The stand-in survives on the offline and
  // headless hosts, which have no store and no minter, and that divergence is
  // recorded in docs/freeholds/persistence-rollout-contract.md section 8a and
  // in src/sim/freehold/CLAUDE.md.
  //
  // ROUND NINE EXEMPTED THE STAND-IN HERE AND IT WAS REVERTED, and the revert
  // stands: the exemption is a data-loss hole. Skipping the comparison for a
  // stand-in-named record left only the continuity tests below, and those catch
  // a seed whose revision is BELOW the entry's, so a returning player needed
  // only `entry.state.rev + 1` edits inside one sweep interval to carry it above
  // and the empty default was compare-and-swapped over the house. Executed
  // against the real store both ways: refused without the exemption, written
  // with it. The failure the exemption was written for (a fresh account whose
  // entry re-read the row it had just inserted, holding the row's name against a
  // live record still holding the stand-in) is what the install fix closes at
  // its source instead.
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
    (foreignIdentity || (pristineSeed && entryKnowsMore) || revisionRegressed);
  return seededOverReal;
}

/** What the INSERT refusal needs: the identity this entry will create its row
 *  under. Separate from FreeholdSealEntry because the two refusals judge
 *  different facts, and one interface carrying both would let a caller satisfy
 *  one guard with the other's field. */
export interface FreeholdInsertEntry {
  /** Null until a row exists. This refusal is about the FIRST row only. */
  readonly durableRev: string | null;
  /** The identity the row will carry: minted by the store's absent arm, or
   *  adopted from the live record there. */
  readonly plotId: string;
}

/**
 * True when creating this entry's FIRST durable row would name it something the
 * record being written does not carry. The caller refuses the write and
 * quiesces the owner; no row is created.
 *
 * WRITABLE IMPLIES NAMEABLE, and this is the ORDER-INDEPENDENT half of the
 * unnamed-record refusal. `classify`'s absent arm refuses to mint for a record
 * that is already seeded with the stand-in, and it refuses when no login is left
 * to install one, but BOTH of those sample a moment. Two ordering paths defeat
 * them, and each was reproduced against the real store before this arm existed.
 *
 * THE FIRST is a login refused on the whole-preload budget: its read stays in
 * flight by design and can land before `addPlayer` seeds anything, so
 * `livePlotId` answers null rather than the stand-in.
 *
 * THE SECOND is the exemption written for the first. Two characters of one
 * account ride ONE single-flight read; `no_budget` is the only kind that leaves
 * a sibling with a clean answer, because every other hold lands on the shared
 * entry. So the sibling keeps the mint alive, the REFUSED login reaches
 * `addPlayer` first (it stopped waiting earlier, so it is always ahead in the
 * pipeline) and seeds the stand-in, and the sibling's own install is then
 * silently discarded by `loadFreehold`'s load-once guard. The entry is left
 * writable holding a name its record can never learn.
 *
 * Judged HERE the ordering cannot matter, because the identity is compared at
 * the moment the row would be created. It is strictly additive to
 * `seedWouldLandOnRealRow`, whose whole body is behind `entry.durableRev !==
 * null`, so the two can never disagree about a document.
 *
 * IT CANNOT FIRE ON A HEALTHY PATH: the absent arm installs `entry.plotId` INTO
 * the record through the load-once path, or ADOPTS the live record's identity
 * when there is one, and the row arm never leaves `durableRev` null. What it
 * costs when it does fire is one session's edits, which is what any hold costs,
 * and no durable row is lost because there is none yet.
 *
 * @param persisted the document AS SENT, so the identity judged is the one the
 *   row would be created under rather than the one a capture happens to carry.
 */
export function insertWouldMintAnUnnamedRow(
  persisted: PersistedFreehold,
  entry: FreeholdInsertEntry,
): boolean {
  // THE `durableRev === null` GATE IS ABSORBED on today's paths, measured rather
  // than assumed: dropping it leaves both this file's suite and the store's
  // green. The reason is that the two refusals reach the same verdict on the
  // UPDATE path by different fields. Once a row exists, `entry.state.plotId` is
  // the identity the live record carried at the last commit, so a reseeded
  // default fires `foreignIdentity` above; and the only way `entry.plotId` could
  // disagree with it is the state THIS arm stops from ever getting a row. The
  // gate is kept because the two predicates are about different things (this one
  // judges the ROW's name, that one the RECORD's), so a future narrowing of the
  // seal would make the difference live, and because a guard that fires on every
  // write is a guard whose cost nobody has measured. Named here rather than
  // pinned by a case that would reach it through the other refusal, which is the
  // vacuous pin this packet keeps producing.
  return entry.durableRev === null && persisted.plotId !== entry.plotId;
}
