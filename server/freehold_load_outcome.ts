// THE LOAD-OUTCOME VOCABULARY: every reason a durable housing load can refuse,
// which of those reasons a later read can change the answer to, and the two
// shapes the join path consumes. Data only, with no store state and no ports,
// which is why it is out here: the metric series walks the kind list, the join
// path installs the LoadedFreehold, and neither of them wants the store.
//
// THE TWO GROUPS ARE THE POINT. A DATA cause answers the same way every time, so
// its hold is terminal for the entry and re-reading it spends a permit and a
// statement on a login path for nothing. A CAPACITY cause can answer differently
// on the next read, so its hold is repairable. One kind is neither, and says so.

import type { PersistedFreehold } from '../src/sim/freehold/persisted';

/**
 * Every reason a durable load can refuse, as a VALUE so a consumer can walk it.
 *
 * The metrics family that labels on this kind used to key its series on
 * whatever the by-kind tally happened to contain, which made its bounded-label
 * promise a property of the union type rather than of anything at runtime. It
 * now walks this list (the server/offline_fence_refusals.ts OFFLINE_FENCE_WRITERS
 * shape), so a widened producer cannot grow the series set on its own and a
 * kind that has never fired reads zero rather than being absent.
 */

export const FREEHOLD_LOAD_FAILURE_KINDS = [
  'unsupported',
  'malformed',
  'oversize',
  // The genuinely ROW-LEVEL cause: the SQL reader saw rows for this account and
  // none of them sits in the admitted slot. It is a data incident.
  'unadmitted',
  // The three ADMISSION causes, split out because the metric's own help text
  // promises an operator four different responses and one label cannot give
  // them: a full local cap is a login-storm capacity signal, a missing permit is
  // pool or gate saturation, and a thrown read is a database fault. A host with
  // no store answers the same hold SHAPE but books no counter at all, so it is
  // deliberately absent from this list.
  'cap_full',
  'no_permit',
  'read_threw',
  // The WHOLE-PRELOAD cap: every step answered inside its own bound and the sum
  // of them did not, so an operator seeing this is seeing a login that ran past
  // FREEHOLD_PERSIST_LOGIN_BUDGET_MS rather than any one step timing out.
  'no_budget',
  // The ORDERING cause, and the only kind that is neither data nor capacity: the
  // sim already holds a record for this owner and it carries the STAND-IN, which
  // means it was seeded WITHOUT an install, which means nothing can ever teach it
  // the identity a row would be created under. See classify's absent arm.
  'unnamed_record',
] as const;

/** The load-failure kinds a LATER READ CAN CHANGE THE ANSWER TO, and so the ones
 *  whose hold is REPAIRABLE rather than terminal. They are the CAPACITY causes:
 *  the store's own cap was full, no background permit arrived inside the login
 *  bound, the read threw, or the whole load ran past its budget.
 *
 *  DERIVED, so the two lists cannot drift. An earlier version of this line
 *  claimed derivation while spelling three literals, and the very commit that
 *  wrote it added a fifth kind the set then did not know about. It is a
 *  subtraction now: everything that is not a DATA cause and not the ordering
 *  cause is a capacity cause, so a kind added to the list above lands in exactly
 *  one of the two groups by construction.
 *
 *  THE DATA CAUSES are terminal because the same row produces the same answer
 *  every time and re-reading it spends a permit and a statement on a login path
 *  for nothing. THE ORDERING CAUSE (`unnamed_record`) is terminal for its own
 *  reason: nothing inside one session can rename a load-once record. */
const FREEHOLD_TERMINAL_HOLD_KINDS: ReadonlySet<string> = new Set([
  'unadmitted',
  'unsupported',
  'malformed',
  'oversize',
  'unnamed_record',
]);
export const FREEHOLD_RETRYABLE_HOLD_KINDS: ReadonlySet<string> = new Set(
  FREEHOLD_LOAD_FAILURE_KINDS.filter((kind) => !FREEHOLD_TERMINAL_HOLD_KINDS.has(kind)),
);

/** Why an account's durable row must not be written this session. `kind` is the
 *  classification the load produced; `detail` is dev-channel prose. */
export interface FreeholdRecoveryHold {
  /** Derived from the list above, so the two can never drift apart. */
  readonly kind: (typeof FREEHOLD_LOAD_FAILURE_KINDS)[number];
  readonly detail: string;
  readonly plotIndex: number;
  readonly durableRev: string;
}

/** One account's durable answer, as the join path consumes it. `state` null
 *  with `hold` null means NO durable row exists: the caller keeps the default
 *  record the sim seeds, and this store persists it under the freshly minted
 *  plot id. `hold` non-null means install nothing and write nothing. */
export interface LoadedFreehold {
  readonly accountId: number;
  readonly plotIndex: number;
  readonly plotId: string;
  /** Null when no durable row exists yet, so the first write is insert-only. */
  readonly durableRev: string | null;
  readonly state: PersistedFreehold | null;
  readonly hearthReadyAtMs: number;
  readonly hearthRevision: string;
  readonly hold: FreeholdRecoveryHold | null;
}
