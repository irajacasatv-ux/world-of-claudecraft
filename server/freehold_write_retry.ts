// The THROWN-RUN RETRY POSTURE's decisions, pure (R1, Fernando 2026-09-26; the
// persistence findings ledger, "R1, THE THROWN-RUN RETRY POSTURE"). A throw is
// not an answer: the database said nothing, so a run of them must not quiesce an
// owner and release its unwritten edits. It puts the owner on a per-owner retry
// clock instead, and server/freehold_persist.ts arms no write for it until the
// clock is due. No store, no ports and no clock of its own, so a Vitest drives
// every arm with literals.

import { FreeholdUpsertRefused } from './freehold_upsert_refused';

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

/** How many retry-clock writes may be in flight at once, out of the store's
 *  write cap (server/freehold_persist_bounds.ts). A fault that makes every
 *  statement run to its timeout would otherwise let retries hold the whole cap
 *  for as long as it lasts, with every healthy owner's ordinary write queued
 *  behind them. Retries past it wait in their own deferred set, pumped AFTER the
 *  ordinary one, so the clock's cadence is "at most one per owner per window",
 *  stretched by this cap when the retrying set is large and the fault slow. */
export const FREEHOLD_PERSIST_RETRY_WRITE_CAP = 2;

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
 * Is this thrown write an ANSWER about the document rather than a fault? The
 * writer's own structural refusal (`FreeholdUpsertRefused`, thrown by
 * requireUpsertInput before a byte is sent) and a payload SQLSTATE (the database
 * refusing this document) are answers. Everything else is a FAULT a repeat can
 * clear: a dropped connection (pg throws it with no code), a statement or driver
 * timeout, exhausted resources, an operator restart, a permission or schema
 * fault an operator fixes, a Node `ERR_*` error, a store bug, a bigint that came
 * back unreadable AFTER the statement (the row may have committed, so the next
 * attempt meets its own revision as stale), or an unknown code.
 */
export function freeholdThrownWriteIsAnswer(err: unknown): boolean {
  if (err instanceof FreeholdUpsertRefused) return true;
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : null;
  return (
    typeof code === 'string' &&
    /^[0-9A-Z]{5}$/.test(code) &&
    PAYLOAD_SQLSTATE_CLASSES.has(code.slice(0, 2))
  );
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
