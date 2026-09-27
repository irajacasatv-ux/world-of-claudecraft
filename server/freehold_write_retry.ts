// The THROWN-RUN RETRY POSTURE's decisions, pure (R1, Fernando 2026-09-26; the
// persistence findings ledger, "R1, THE THROWN-RUN RETRY POSTURE"). A throw is
// not an answer: the database said nothing, so a run of them must not quiesce an
// owner and release its unwritten edits. It puts the owner on a per-owner retry
// clock instead, and server/freehold_persist.ts arms no write for it until the
// clock is due. No store, no ports and no clock of its own, so a Vitest drives
// every arm with literals.

/** Consecutive THROWN writes for one owner before the store stops retrying on
 *  the ordinary cadence. A stale or refused write already quiesces on the first
 *  answer, because those are answers no repeat can change; a thrown one might be
 *  a connection blip, so it gets a second and a third chance on the sweep before
 *  the owner moves to the retry clock. Without a bound, a row this realm cannot
 *  write is retried on every sweep for the life of the process. */
export const FREEHOLD_PERSIST_MAX_WRITE_ERRORS = 3;

/** How close together those thrown writes have to be to count as one RUN, and
 *  the retry clock's period once they do. A connection blip an hour after the
 *  last one is a new event, not a third strike: without a window, three
 *  unrelated blips across a long session would put a healthy owner on the slow
 *  clock. Five minutes is far longer than any transient the pool recovers from
 *  and far shorter than a session, and as the retry period it bounds a database
 *  outage to one statement per owner per window. */
export const FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS = 300_000;

/** The run state one owner's entry carries. `retryAtMs` is 0 off the clock. */
export interface FreeholdWriteRun {
  writeErrors: number;
  lastWriteErrorMs: number;
  retryAtMs: number;
}

/** The SQLSTATE classes that describe the PAYLOAD rather than the database's
 *  health: 22 (data exception) and 23 (integrity constraint violation). The same
 *  document answers the same way against the same schema, so a throw carrying
 *  one IS an answer, whatever arrives as an exception. */
const PAYLOAD_SQLSTATE_CLASSES: ReadonlySet<string> = new Set(['22', '23']);

/**
 * Is this thrown write an ANSWER about the payload rather than a fault? A
 * `TypeError` or `RangeError` is the writer's own structural refusal
 * (requireUpsertInput in server/freehold_db.ts refuses before a byte is sent),
 * and a payload SQLSTATE is the database refusing this document. Everything else
 * (a dropped connection, which pg throws with no code, a statement or driver
 * timeout, exhausted resources, an operator restart, a permission or schema
 * fault an operator fixes, an unknown code) is a FAULT: a repeat can succeed.
 */
export function freeholdThrownWriteIsAnswer(err: unknown): boolean {
  if (err instanceof TypeError || err instanceof RangeError) return true;
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : null;
  return typeof code === 'string' && PAYLOAD_SQLSTATE_CLASSES.has(code.slice(0, 2));
}

/** What one thrown write did to the run: `blip` counted it and left the owner
 *  on the ordinary cadence, `entered` completed a run of faults and started the
 *  retry clock, `retrying` re-armed a clock that was already running, and
 *  `answered` is an answer about the payload that ends the owner's writes (the
 *  run-completing one before the clock, the first one on it): the store
 *  quiesces, exactly as for any answer no repeat can change. */
export type FreeholdThrownWriteOutcome = 'blip' | 'entered' | 'retrying' | 'answered';

/**
 * Fold one thrown write into the run, in place. A RUN, not a lifetime tally: an
 * error further back than the window starts a fresh count. The clock is STICKY:
 * once running, every fault re-arms it one window on from that fault, and only a
 * commit clears it (the store's `applyWriteResult`), whatever the count reads.
 */
export function noteThrownWrite(
  run: FreeholdWriteRun,
  failedAtMs: number,
  answered: boolean,
): FreeholdThrownWriteOutcome {
  const withinWindow =
    run.lastWriteErrorMs > 0 &&
    failedAtMs - run.lastWriteErrorMs <= FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS;
  run.writeErrors = withinWindow ? run.writeErrors + 1 : 1;
  run.lastWriteErrorMs = failedAtMs;
  const wasRetrying = run.retryAtMs > 0;
  if (!wasRetrying && run.writeErrors < FREEHOLD_PERSIST_MAX_WRITE_ERRORS) return 'blip';
  if (answered) return 'answered';
  run.retryAtMs = failedAtMs + FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS;
  return wasRetrying ? 'retrying' : 'entered';
}

/**
 * May a write be ARMED for this owner now? Always off the clock; on it, once the
 * clock is due, or at once while the shutdown drain runs (the one last attempt
 * before the process ends, R3's bound). A WALL CLOCK that stepped back further
 * than one window before the failure that set the clock also counts as due:
 * `nowMs` is `Date.now` in production, and otherwise such a step would stall the
 * retries for its whole size. A smaller step delays one retry by at most one
 * more window.
 */
export function freeholdRetryDue(retryAtMs: number, nowMs: number, draining: boolean): boolean {
  if (retryAtMs === 0 || draining || nowMs >= retryAtMs) return true;
  return nowMs < retryAtMs - 2 * FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS;
}
