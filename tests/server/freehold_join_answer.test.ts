// The join's answer, decided at install time: the pure half of ruling (b) for
// the twelfth path. The store hands this function the handshake's re-asked
// answer and its loaded entry's answer at the instant of the install, and what
// it returns is what `installLoadedFreehold` puts into the sim. Every verdict is
// driven here with literals, and then through the real install over a real live
// map, because a verdict is only as good as what the install does with it. Which
// document a loaded entry answers with (its capture over its committed state) is
// the store's replay, pinned in tests/server/freehold_persist.test.ts.

import { describe, expect, it } from 'vitest';
import { installLoadedFreehold } from '../../server/freehold_install';
import { freeholdJoinAnswer } from '../../server/freehold_join_answer';
import type { LoadedFreehold } from '../../server/freehold_load_outcome';
import type { PersistedFreehold } from '../../src/sim/freehold/persisted';
import type { SimContext } from '../../src/sim/sim_context';

const ACCOUNT_ID = 918_273;
const OWNER_KEY = `account:${ACCOUNT_ID}`;
const PLOT_ID = 'plot:joinanswer01';

function house(overrides: Partial<PersistedFreehold> = {}): PersistedFreehold {
  return {
    version: 1,
    plotId: PLOT_ID,
    tier: 'inn_room',
    layout: [{ placementId: 1, itemId: 'oak_chair', x: 1.5, y: 0, z: -2.25, yaw: 0 }],
    trophies: [],
    condition: 87,
    visitPolicy: 'friends',
    rev: 5,
    ...overrides,
  };
}

/** A handshake answer: a stale ABSENT one unless the case says otherwise. */
function answer(overrides: Partial<LoadedFreehold> = {}): LoadedFreehold {
  return {
    accountId: ACCOUNT_ID,
    plotIndex: 0,
    plotId: PLOT_ID,
    durableRev: null,
    state: null,
    hearthReadyAtMs: 1_000,
    hearthRevision: '1',
    hold: null,
    recordWithheld: false,
    ...overrides,
  };
}

const HOLD = {
  kind: 'no_permit' as const,
  detail: 'no background permit within 5000 ms',
  plotIndex: 0,
  durableRev: '0',
};

function liveCtx(): SimContext {
  return {
    freeholdsEnabled: true,
    freeholds: new Map(),
    freeholdKeyReadyAtMs: new Map<string, number>(),
  } as unknown as SimContext;
}

describe('freeholdJoinAnswer', () => {
  it('answers NOTHING for a join that carries no durable answer and meets no loaded entry', () => {
    expect(freeholdJoinAnswer(ACCOUNT_ID, undefined, null, false)).toEqual({
      answer: undefined,
      verdict: 'none',
    });
    // Another account's entry is no entry for this join.
    expect(
      freeholdJoinAnswer(ACCOUNT_ID, undefined, answer({ accountId: ACCOUNT_ID + 1 }), false),
    ).toEqual({ answer: undefined, verdict: 'none' });
  });

  it("installs the LOADED ENTRY'S answer even for a join that carries none", () => {
    // Both asks threw: the entry still answers, so a waiting capture is never
    // dropped for want of an answer. The store-level order is pinned in
    // tests/server/freehold_persist.test.ts.
    const current = answer({ durableRev: '7', state: house() });
    const decided = freeholdJoinAnswer(ACCOUNT_ID, undefined, current, false);
    expect(decided.verdict).toBe('superseded');
    expect(decided.answer).toBe(current);
  });

  it("hands back a malformed or another account's answer unchanged when no entry is loaded, for the install to refuse", () => {
    const foreign = answer({ accountId: ACCOUNT_ID + 1, state: house() });
    expect(freeholdJoinAnswer(ACCOUNT_ID, foreign, null, false)).toEqual({
      answer: foreign,
      verdict: 'refused',
    });
    const malformed = 'not an answer' as unknown as LoadedFreehold;
    expect(freeholdJoinAnswer(ACCOUNT_ID, malformed, null, false)).toEqual({
      answer: malformed,
      verdict: 'refused',
    });
    // A null bag, the one object-typed value that is not an answer.
    const empty = null as unknown as LoadedFreehold;
    expect(freeholdJoinAnswer(ACCOUNT_ID, empty, null, false)).toEqual({
      answer: empty,
      verdict: 'refused',
    });
  });

  it('lets a loaded entry answer a broken or foreign ask too, so its capture is never dropped', () => {
    const current = answer({ state: house({ rev: 8 }) });
    for (const asked of [
      answer({ accountId: ACCOUNT_ID + 1, state: house() }),
      'not an answer' as unknown as LoadedFreehold,
      null as unknown as LoadedFreehold,
    ]) {
      const decided = freeholdJoinAnswer(ACCOUNT_ID, asked, current, false);
      expect(decided.verdict).toBe('superseded');
      expect(decided.answer).toBe(current);
    }
  });

  it("installs the LOADED ENTRY'S answer now, whatever the handshake asked", () => {
    // The twelfth path in one line: the asked answer is the empty house read
    // before the other session edited; the entry holds its capture.
    const stale = answer();
    const current = answer({ durableRev: null, state: house({ rev: 3 }) });
    const decided = freeholdJoinAnswer(ACCOUNT_ID, stale, current, false);
    expect(decided.verdict).toBe('superseded');
    expect(decided.answer).toBe(current);
  });

  it('supersedes a HOLD or a marked answer too, once an entry is loaded', () => {
    const current = answer({ durableRev: '7', state: house() });
    for (const asked of [answer({ hold: HOLD }), answer({ recordWithheld: true })]) {
      const decided = freeholdJoinAnswer(ACCOUNT_ID, asked, current, false);
      expect(decided.verdict).toBe('superseded');
      expect(decided.answer).toBe(current);
    }
  });

  it('names an ask that already matches the entry the plain ENTRY verdict, and any one difference SUPERSEDED', () => {
    // The healthy join: its re-ask replayed the entry, so nothing changed.
    const current = answer({ durableRev: '7', state: house({ rev: 7 }) });
    const same = answer({ durableRev: '7', state: house({ rev: 7 }) });
    expect(freeholdJoinAnswer(ACCOUNT_ID, same, current, false).verdict).toBe('entry');
    // Each dimension on its own, so no one comparison can carry the rest.
    for (const differs of [
      answer({ durableRev: '6', state: house({ rev: 7 }) }),
      answer({ durableRev: '7', state: house({ rev: 6 }) }),
      answer({ durableRev: '7', state: null }),
      answer({ durableRev: '7', plotId: 'plot:other', state: house({ rev: 7 }) }),
      answer({ durableRev: '7', state: house({ rev: 7 }), hold: HOLD }),
      answer({ durableRev: '7', state: house({ rev: 7 }), recordWithheld: true }),
      // Another account's ask equal to the entry in every other field, so only
      // the account comparison can refuse the match.
      answer({ accountId: ACCOUNT_ID + 1, durableRev: '7', state: house({ rev: 7 }) }),
    ]) {
      expect(freeholdJoinAnswer(ACCOUNT_ID, differs, current, false).verdict).toBe('superseded');
    }
  });

  it('names an install that changes nothing ENTRY: a live record standing, or the same DATA hold replayed', () => {
    // A second character beside the owner's live record: preload's already-live
    // arm MARKS its ask, and the install is load-once, so nothing is superseded.
    const current = answer({ durableRev: '8', state: house({ rev: 8 }) });
    const marked = answer({ durableRev: '8', state: null, recordWithheld: true });
    expect(freeholdJoinAnswer(ACCOUNT_ID, marked, current, true)).toEqual({
      answer: current,
      verdict: 'entry',
    });
    // CONTROL: the same ask with nothing live is the fix changing the install.
    expect(freeholdJoinAnswer(ACCOUNT_ID, marked, current, false).verdict).toBe('superseded');
    // Beside a live record it is the record, not the ask's mark, that makes the
    // install change nothing: an UNMARKED stale ask (the re-ask threw and the
    // first ask went stale) and no ask at all (both asks threw) count the same.
    const staleUnmarked = answer({ durableRev: '7', state: house({ rev: 7 }) });
    for (const asked of [staleUnmarked, undefined]) {
      expect(freeholdJoinAnswer(ACCOUNT_ID, asked, current, true).verdict).toBe('entry');
      expect(freeholdJoinAnswer(ACCOUNT_ID, asked, current, false).verdict).toBe('superseded');
    }
    // A loaded entry held on a DATA kind answers the same hold to both asks, so
    // every login of that account replays it and matches.
    const dataHold = {
      kind: 'malformed' as const,
      detail: 'the layout is not an array',
      plotIndex: 0,
      durableRev: '4',
    };
    const heldEntry = answer({ durableRev: '4', hold: dataHold });
    const replayed = answer({ durableRev: '4', hold: { ...dataHold } });
    expect(freeholdJoinAnswer(ACCOUNT_ID, replayed, heldEntry, false).verdict).toBe('entry');
    // CONTROLS: another kind over that entry, and a capacity hold asked over a
    // clean entry, are still asks the entry replaced.
    const otherKind = answer({ durableRev: '4', hold: { ...HOLD, durableRev: '4' } });
    expect(freeholdJoinAnswer(ACCOUNT_ID, otherKind, heldEntry, false).verdict).toBe('superseded');
    const capacity = answer({ durableRev: '8', state: house({ rev: 8 }), hold: HOLD });
    expect(freeholdJoinAnswer(ACCOUNT_ID, capacity, current, false).verdict).toBe('superseded');
  });

  it('never installs an entry answer that names another account', () => {
    // Fails closed onto the asked answer's own verdict: a stale non-hold answer
    // is withheld rather than trusted.
    const decided = freeholdJoinAnswer(
      ACCOUNT_ID,
      answer({ state: house() }),
      answer({ accountId: ACCOUNT_ID + 1, state: house({ rev: 9 }) }),
      false,
    );
    expect(decided.verdict).toBe('withheld');
    expect(decided.answer?.state).toBeNull();
    expect(decided.answer?.recordWithheld).toBe(true);
  });

  it('keeps a HOLD when no entry is loaded: it installs nothing already', () => {
    const held = answer({ hold: HOLD });
    expect(freeholdJoinAnswer(ACCOUNT_ID, held, null, false)).toEqual({
      answer: held,
      verdict: 'held',
    });
  });

  it('WITHHOLDS a non-hold answer when no entry is loaded, keeping only its clock', () => {
    // The entry that produced it has gone, so nothing in the store can vouch
    // for it. Every non-hold shape: absent, a row, and a marked one.
    for (const asked of [
      answer(),
      answer({ durableRev: '7', state: house() }),
      answer({ recordWithheld: true }),
    ]) {
      const decided = freeholdJoinAnswer(ACCOUNT_ID, asked, null, false);
      expect(decided.verdict).toBe('withheld');
      expect(decided.answer).toEqual({ ...asked, state: null, recordWithheld: true });
    }
  });

  it('treats an answer that lost its hold field as a non-hold, and withholds it', () => {
    // A bag that crossed a boundary without the field must not read as a
    // hold-free answer the store vouches for.
    const lost = { ...answer(), hold: undefined } as unknown as LoadedFreehold;
    expect(freeholdJoinAnswer(ACCOUNT_ID, lost, null, false).verdict).toBe('withheld');
  });
});

describe('each verdict, through the real install', () => {
  it('the ENTRY verdict puts the entry document in', () => {
    const ctx = liveCtx();
    const current = answer({ state: house({ rev: 3 }) });
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      freeholdJoinAnswer(ACCOUNT_ID, answer(), current, false).answer,
    );
    expect(ctx.freeholds.get(OWNER_KEY)?.rev).toBe(3);
    expect(ctx.freeholds.get(OWNER_KEY)?.layout).toHaveLength(1);
  });

  it('the WITHHELD verdict puts NO record in, where the stale absent answer would have', () => {
    // The decisive contrast: installed as asked, the stale absent answer puts
    // an EMPTY default in under the real name, which is the twelfth path.
    const asked = answer({ hearthReadyAtMs: 90_000 });
    const raw = liveCtx();
    installLoadedFreehold(raw, ACCOUNT_ID, asked);
    expect(raw.freeholds.get(OWNER_KEY)?.plotId).toBe(PLOT_ID);
    expect(raw.freeholds.get(OWNER_KEY)?.layout).toEqual([]);

    const ctx = liveCtx();
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      freeholdJoinAnswer(ACCOUNT_ID, asked, null, false).answer,
    );
    expect(ctx.freeholds.has(OWNER_KEY)).toBe(false);
    // The clock is a separate durable fact and still merges.
    expect(ctx.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(90_000);
    // What the sim then seeds is the stand-in, which the seal and the insert
    // refusal refuse (driven end to end in tests/server/freehold_persist.test.ts).
  });

  it('the NONE and REFUSED verdicts put no record in', () => {
    const none = liveCtx();
    installLoadedFreehold(
      none,
      ACCOUNT_ID,
      freeholdJoinAnswer(ACCOUNT_ID, undefined, null, false).answer,
    );
    expect(none.freeholds.size).toBe(0);
    const foreign = answer({ accountId: ACCOUNT_ID + 1, state: house() });
    const refused = liveCtx();
    installLoadedFreehold(
      refused,
      ACCOUNT_ID,
      freeholdJoinAnswer(ACCOUNT_ID, foreign, null, false).answer,
    );
    expect(refused.freeholds.size).toBe(0);
    // CONTROL: the same foreign bag installed for ITS own account does go in, so
    // the empty map above is the refusal and not a broken fixture.
    const own = liveCtx();
    installLoadedFreehold(own, ACCOUNT_ID + 1, foreign);
    expect(own.freeholds.size).toBe(1);
  });

  it('the HELD verdict puts no record in and still merges the clock', () => {
    const ctx = liveCtx();
    const held = answer({ hold: HOLD, hearthReadyAtMs: 70_000 });
    installLoadedFreehold(
      ctx,
      ACCOUNT_ID,
      freeholdJoinAnswer(ACCOUNT_ID, held, null, false).answer,
    );
    expect(ctx.freeholds.has(OWNER_KEY)).toBe(false);
    expect(ctx.freeholdKeyReadyAtMs.get(OWNER_KEY)).toBe(70_000);
  });
});
