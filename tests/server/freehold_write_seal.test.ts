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
import type { PersistedFreehold } from '../../src/sim/freehold/persisted';
import { PENDING_FREEHOLD_PLOT_ID } from '../../src/sim/freehold/state';

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
 *  nothing placed, at revision zero, carrying the stand-in identity. */
function seed(overrides: Partial<PersistedFreehold> = {}): PersistedFreehold {
  return doc({
    plotId: PENDING_FREEHOLD_PLOT_ID,
    tier: 'inn_room',
    layout: [],
    trophies: [],
    condition: 100,
    visitPolicy: 'closed',
    rev: 0,
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
      ['rev', seed({ rev: 1 })],
      ['layout', seed({ layout: doc().layout })],
      ['trophies', seed({ trophies: doc().trophies })],
      ['tier', seed({ tier: 'cottage' })],
      ['condition', seed({ condition: 91 })],
      ['visitPolicy', seed({ visitPolicy: 'friends' })],
    ] as const) {
      expect(seedWouldLandOnRealRow(pristine, entry(known)), label).toBe(true);
    }
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
