// The waiter registry driven directly. server/freehold_load_waiters.ts is one
// map behind three questions, and the store's own suite reaches it only through
// a login: the edges below (an unbalanced release, a second account, the
// deletion at zero) are reachable from here and from nowhere else.

import { describe, expect, it } from 'vitest';
import { createFreeholdLoadWaiters } from '../../server/freehold_load_waiters';

const ACCOUNT = 918_273;
const OTHER = 604_513;

describe('createFreeholdLoadWaiters', () => {
  it('reads ABANDONED for an account nobody has ever waited on', () => {
    // The store asks this on every absent-arm load, including the first one an
    // account ever takes, so the empty answer is load-bearing rather than a
    // degenerate case: it is what says "no login is left to install this".
    expect(createFreeholdLoadWaiters().abandoned(ACCOUNT)).toBe(true);
  });

  it('is not abandoned while ONE login waits, and is again once it leaves', () => {
    const waiters = createFreeholdLoadWaiters();
    waiters.arrived(ACCOUNT);
    expect(waiters.abandoned(ACCOUNT)).toBe(false);
    waiters.left(ACCOUNT);
    expect(waiters.abandoned(ACCOUNT)).toBe(true);
  });

  it('stays not-abandoned while a SIBLING login is still waiting', () => {
    // THE DEFECT THIS SHAPE EXISTS FOR. The load is single-flight per account,
    // so two characters of one account ride one read; a flag rather than a count
    // refused the second login's load because the first had overrun, and
    // write-blocked that account for its whole session.
    const waiters = createFreeholdLoadWaiters();
    waiters.arrived(ACCOUNT);
    waiters.arrived(ACCOUNT);
    waiters.left(ACCOUNT);
    expect(waiters.abandoned(ACCOUNT)).toBe(false);
    waiters.left(ACCOUNT);
    expect(waiters.abandoned(ACCOUNT)).toBe(true);
  });

  it('keeps accounts apart', () => {
    const waiters = createFreeholdLoadWaiters();
    waiters.arrived(ACCOUNT);
    expect(waiters.abandoned(ACCOUNT)).toBe(false);
    expect(waiters.abandoned(OTHER)).toBe(true);
  });

  it('FLOORS an unbalanced release instead of going negative', () => {
    // A release without a matching arrival is a caller bug, and the honest
    // failure mode for one is "nobody is waiting", not a negative count that
    // reads as somebody waiting forever and refuses nothing for the life of the
    // process. Driven because no ordering in the store can reach it.
    const waiters = createFreeholdLoadWaiters();
    waiters.left(ACCOUNT);
    expect(waiters.abandoned(ACCOUNT)).toBe(true);
    // And the registry still counts correctly afterwards.
    waiters.arrived(ACCOUNT);
    expect(waiters.abandoned(ACCOUNT)).toBe(false);
  });
});
