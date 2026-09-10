// THE WRITE SEAL, driven directly. server/freehold_write_seal.ts is a pure
// predicate over one document and one store entry, and the whole reason it was
// extracted out of the store's runWrite is that every arm of it can then be
// exercised with three literals instead of a store, a port bag and a fake clock.
//
// WHY THIS FILE EXISTS AT ALL, stated because a comment elsewhere promised it
// before it was written: the seal is the guard this subsystem's one invariant
// rests on (only a genuinely ABSENT durable row may resolve to the free tier-0
// Inn Room), eight distinct paths to violating that invariant have been found,
// and FOUR separate rounds each tried to close the last of them by adding a
// clause to this expression. Its arms had no direct coverage: they were reached
// through the store, where two of the three could not be isolated at all.

import { describe, expect, it } from 'vitest';
import { seedWouldLandOnRealRow } from '../../server/freehold_write_seal';
import {
  type PersistedFreehold,
  persistedFreeholdFromState,
} from '../../src/sim/freehold/persisted';
import { defaultFreeholdState, PENDING_FREEHOLD_PLOT_ID } from '../../src/sim/freehold/state';

const ROW_PLOT_ID = 'plot:rowfixture91';
const OTHER_PLOT_ID = 'plot:someoneelse';

/** A durable document. Deliberately NOT the empty default: the arms that matter
 *  are about a default standing where content used to be. */
function doc(overrides: Partial<PersistedFreehold> = {}): PersistedFreehold {
  return {
    version: 1,
    plotId: ROW_PLOT_ID,
    tier: 'cottage',
    layout: [{ placementId: 1, itemId: 'oak_chair', x: 1.5, y: 0, z: -2.25, yaw: 0 }],
    trophies: [{ plinth: 0, trophyId: 'skull_of_something' }],
    condition: 91,
    visitPolicy: 'friends',
    rev: 7,
    ...overrides,
  };
}

/** The pristine seed every account starts from: the free tier-0 Inn Room with
 *  nothing placed, at revision zero, carrying the stand-in identity.
 *
 *  DERIVED FROM THE SIM'S OWN DEFAULT, never re-typed. The arm this fixture
 *  drives claims totality over the persisted shape, so a fixture spelling the
 *  tier, condition, visit policy and revision as literals would keep asserting
 *  totality over a shape the sim had since moved away from, with every case
 *  still green. */
function seed(overrides: Partial<PersistedFreehold> = {}): PersistedFreehold {
  const real = persistedFreeholdFromState(
    defaultFreeholdState('account:1', PENDING_FREEHOLD_PLOT_ID),
  );
  return doc({
    plotId: real.plotId,
    tier: real.tier,
    layout: real.layout,
    trophies: real.trophies,
    condition: real.condition,
    visitPolicy: real.visitPolicy,
    rev: real.rev,
    ...overrides,
  });
}

const entry = (state: PersistedFreehold | null, durableRev: string | null = '7') => ({
  state,
  durableRev,
});

describe('the seal is disarmed when there is nothing to lose', () => {
  it('admits anything when no durable row exists', () => {
    // durableRev null means the row has never been written, so no write can
    // erase anything. Every account's very first write takes this arm, and an
    // earlier round quiesced every brand-new account by getting it wrong.
    expect(seedWouldLandOnRealRow(seed(), entry(null, null))).toBe(false);
    expect(seedWouldLandOnRealRow(seed(), entry(doc(), null))).toBe(false);
  });

  it('admits anything when the entry has committed nothing', () => {
    // No cached state means nothing to compare against, and by today's
    // arithmetic that is the same set as durableRev null. Both are asserted
    // because the guard says what it MEANS, not what it happens to equal.
    expect(seedWouldLandOnRealRow(seed(), entry(null))).toBe(false);
  });
});

describe('the FIRST arm: a foreign identity', () => {
  it('refuses a document whose identity is not the one this entry committed', () => {
    expect(seedWouldLandOnRealRow(doc({ plotId: OTHER_PLOT_ID }), entry(doc()))).toBe(true);
  });

  it('refuses a reseeded default standing where a named record was', () => {
    // THE CASE THE ARM EXISTS FOR, and the one that makes it total after the
    // identity install: a record seeded by ensureFreeholdRecord carries the
    // stand-in, and the entry it stands in front of committed a real name.
    expect(seedWouldLandOnRealRow(seed({ rev: 9 }), entry(doc()))).toBe(true);
  });

  it('admits the record it actually committed, however far it has moved on', () => {
    // The anti-vacuity arm for the whole file: without it every case above
    // would pass on a predicate that simply answered true.
    expect(seedWouldLandOnRealRow(doc({ rev: 12, condition: 40 }), entry(doc()))).toBe(false);
  });
});

describe('the SECOND arm: a pristine seed against an entry that knows more', () => {
  it('refuses an untouched seed when the entry committed content', () => {
    expect(seedWouldLandOnRealRow(seed(), entry(doc()))).toBe(true);
  });

  it('requires the STAND-IN identity, which is the conjunct nothing else pins', () => {
    // THE COVERAGE THIS FILE WAS WRITTEN FOR. The store-level case that used to
    // reach this conjunct was an established account emptying its house at
    // revision ZERO, and that fixture had to be raised to revision six when
    // revisionRegressed was un-gated, because a revision below the entry's is
    // now refused outright. Raising it took the only pin on `standInSeed &&`
    // with it: deleting that conjunct left the whole suite green.
    //
    // A real-named document with no content at revision zero is what
    // distinguishes them. It must be admitted, because it is the entry's OWN
    // record: pristineSeed is about a SEED, and a seed is stand-in-named by
    // construction.
    const emptiedAtZero = doc({ layout: [], trophies: [], rev: 0 });
    expect(seedWouldLandOnRealRow(emptiedAtZero, entry(doc({ rev: 0 })))).toBe(false);
    // And the same shape carrying the stand-in IS a seed, and is refused.
    expect(seedWouldLandOnRealRow(seed(), entry(doc({ rev: 0 })))).toBe(true);
  });

  it('admits a pristine seed when the entry knows no more than it does', () => {
    // An account that wrote once and changed nothing has a record identical to a
    // seed, and writing it loses nothing, so refusing would quiesce a healthy
    // owner for no gain. TOTAL over the persisted shape: each dimension the
    // entry can differ in is asserted on its own, because a single combined
    // fixture cannot tell which one is doing the work.
    const pristine = seed();
    expect(seedWouldLandOnRealRow(pristine, entry(seed()))).toBe(false);
    for (const [label, known] of [
      ['layout', seed({ layout: doc().layout })],
      ['trophies', seed({ trophies: doc().trophies })],
      ['tier', seed({ tier: 'cottage' })],
      ['condition', seed({ condition: 91 })],
      ['visitPolicy', seed({ visitPolicy: 'friends' })],
    ] as const) {
      expect(seedWouldLandOnRealRow(pristine, entry(known)), label).toBe(true);
    }
    // THE `rev` DIMENSION IS DELIBERATELY NOT IN THAT TABLE, and its absence is
    // the finding rather than an omission. `pristineSeed` already requires
    // `persisted.rev === 0`, so under it `entry.state.rev > 0` is exactly
    // `revisionRegressed`, which is a separate disjunct of the same expression:
    // the dimension is ABSORBED and no behaviour case can isolate it. Measured,
    // not argued: deleting `entry.state.rev > 0` leaves this whole suite and the
    // store's green. It was in the table above and passed through the OTHER
    // disjunct, which is a case passing for the wrong reason under a comment
    // claiming each dimension is asserted on its own. The redundancy is stated
    // here and in the source instead.
    expect(seedWouldLandOnRealRow(seed(), entry(seed({ rev: 1 })))).toBe(true);
    // And with the revision arm's own subject removed, the entry knowing more by
    // revision ALONE is not what refuses it: an entry at revision zero whose only
    // difference is a tier still refuses, and one identical in every dimension
    // does not. Those two are the table's real anti-vacuity pair.
    expect(seedWouldLandOnRealRow(seed(), entry(seed({ rev: 0, tier: 'cottage' })))).toBe(true);
    expect(seedWouldLandOnRealRow(seed(), entry(seed({ rev: 0 })))).toBe(false);
  });

  it('admits a stand-in record that has MOVED, which is what rev zero is guarding', () => {
    // KILLS the `persisted.rev === 0` conjunct of pristineSeed, which nothing
    // reached: dropping it left the whole suite green. A fresh account's record
    // legitimately carries the stand-in, and the moment it takes a tier grant it
    // is at revision one with an empty house. That is a real edit, not a seed,
    // and refusing it would make the first thing a new owner does the one edit
    // that can never be saved.
    const granted = seed({ rev: 1, tier: 'cottage' });
    expect(seedWouldLandOnRealRow(granted, entry(seed({ rev: 0 })))).toBe(false);
    // The SAME document at revision zero is a seed, and is refused, so the pair
    // differs in exactly the conjunct under test.
    expect(
      seedWouldLandOnRealRow(seed({ tier: 'inn_room' }), entry(seed({ rev: 0, tier: 'cottage' }))),
    ).toBe(true);
  });

  it.each([
    ['layout', { layout: doc().layout }],
    ['trophies', { trophies: doc().trophies }],
  ])('admits a stand-in record carrying %s at revision zero', (_label, content) => {
    // KILLS the `layout` and `trophies` conjuncts, which nothing reached either.
    // This arm reads the CONTENT directly precisely so it survives a writer that
    // places a furnishing and forgets to bump the revision, which is the one
    // state where the revision tests cannot see the edit. A record holding real
    // content is not a seed whatever its revision says, so it must be admitted.
    const placed = seed({ ...content, rev: 0 });
    expect(seedWouldLandOnRealRow(placed, entry(seed({ rev: 0, tier: 'cottage' })))).toBe(false);
    // Strip the content back out and the same entry refuses it, so the pair
    // differs in exactly the conjunct under test.
    expect(seedWouldLandOnRealRow(seed({ rev: 0 }), entry(seed({ rev: 0, tier: 'cottage' })))).toBe(
      true,
    );
  });
});

describe('the THIRD arm: a regressed revision', () => {
  it('refuses a live record below the revision this entry committed', () => {
    // UN-GATED from the stand-in, which is the companion the identity install
    // owes: after that fix no online record carries the stand-in, so a gate on
    // it would make this arm dead on the one host it exists for.
    expect(seedWouldLandOnRealRow(doc({ rev: 6 }), entry(doc({ rev: 7 })))).toBe(true);
  });

  it('admits a replay AT the committed revision, which is the W1 boundary', () => {
    // A rejoin replay RESTARTS the record's revision from the last COMMITTED
    // value, so the discriminator has to be strictly-below rather than
    // not-above. Comparing two revisions that are not on one timeline is the
    // mistake that made an earlier round's revision test wrong.
    expect(seedWouldLandOnRealRow(doc({ rev: 7 }), entry(doc({ rev: 7 })))).toBe(false);
    expect(seedWouldLandOnRealRow(doc({ rev: 8 }), entry(doc({ rev: 7 })))).toBe(false);
  });

  it('applies to a REAL-named record too, not only to a stand-in', () => {
    // The rule this replaced said a record carrying a real plot name goes
    // backwards onto the row deliberately. It is retired: a live revision below
    // the entry's last committed one means the live record is not the record
    // that commit came from, and writing it walks the client-facing wire counter
    // backwards permanently.
    expect(seedWouldLandOnRealRow(doc({ rev: 1 }), entry(doc({ rev: 7 })))).toBe(true);
  });
});
