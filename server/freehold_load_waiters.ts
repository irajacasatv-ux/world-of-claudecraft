// HOW MANY LOGINS ARE STILL WAITING on one account's in-flight durable read.
//
// The housing store's load is SINGLE-FLIGHT per account, so two characters of
// one account joining together ride one promise. That makes "did the caller give
// up" a property of the CALLER rather than of the read, and the store's absent
// arm needs it: the whole-preload cap answers `no_budget` and deliberately
// leaves the read running to fill the entry, while `installLoadedFreehold` has
// already returned early on that hold, so the answer that read produces reaches
// no install and must not mint a name the sim will never learn.
//
// WHAT IT ANSWERS IS "nobody is waiting", NOT "no install will run", and the two
// are not the same: `retain`'s lost-entry repair waits here too and discards its
// own result. That is the honest weaker fact and it is the one the store needs,
// because a repair's join installs the entry's identity through its next replay
// anyway. Stated because the stronger claim is the kind this packet has shipped
// wider than its evidence before.
//
// A COUNT, NOT A FLAG. A first version marked the ACCOUNT abandoned, which
// write-blocked an account for its whole session whenever two of its characters
// joined together and only one overran: the other was still there to install the
// name. Zero waiters is the honest test, and it is exact rather than
// conservative, because the store's classify runs inside the load promise,
// before any surviving waiter's own race has resolved.
//
// Its own module because it is one question over one map with no store state
// behind it, which is what lets a Vitest drive it directly.

export interface FreeholdLoadWaiters {
  /** One more login is waiting on this account's read. */
  arrived(accountId: number): void;
  /** One login has stopped waiting, on ANY exit it has. */
  left(accountId: number): void;
  /** True when NOBODY IS WAITING on this account's read.
   *
   *  That is the fact, and it is narrower than "no install will consume this
   *  answer": `retain`'s lost-entry repair also waits here and discards its
   *  result on purpose, so a waiter can exist with no install behind it. Counting
   *  it is still correct, because that repair runs on a join whose own replay
   *  installs the entry's identity on the next `preload`, which is the outcome
   *  the repair exists to restore. The store uses this only to decide whether to
   *  MINT, never to decide whether to write. */
  abandoned(accountId: number): boolean;
}

export function createFreeholdLoadWaiters(): FreeholdLoadWaiters {
  const waiting = new Map<number, number>();
  return {
    arrived(accountId: number): void {
      waiting.set(accountId, (waiting.get(accountId) ?? 0) + 1);
    },
    left(accountId: number): void {
      // DELETED AT ZERO rather than left at zero, so the map cannot grow one
      // entry per account for the life of the process. A count that went
      // negative would also read as "someone is waiting" forever, so it floors.
      const rest = (waiting.get(accountId) ?? 1) - 1;
      if (rest > 0) waiting.set(accountId, rest);
      else waiting.delete(accountId);
    },
    abandoned(accountId: number): boolean {
      return (waiting.get(accountId) ?? 0) === 0;
    },
  };
}
