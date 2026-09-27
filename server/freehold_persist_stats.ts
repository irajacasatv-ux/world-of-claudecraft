// The housing persistence store's counters, as a scrape reads them: moved out
// of server/freehold_persist.ts (its monolith ceiling), which re-exports the
// type so every importer's contract point is unchanged. Counts, bytes and
// milliseconds only, never player identity.

import type { FreeholdJoinVerdict } from './freehold_join_answer';

/** Scrape-safe counters. COUNTS, BYTE TOTALS AND MILLISECOND TOTALS ONLY: no
 *  owner key, no account id, no plot id ever appears here, because these are
 *  read by an operator dashboard and a metrics endpoint that are not entitled
 *  to player identity. */
export interface FreeholdPersistStats {
  /** EVERY entry the store holds, including the reference-only placeholders a
   *  join creates before any read. On a dark realm that is one per online
   *  account and nothing else, so this measure alone must never be read as
   *  "records this realm is persisting": `loaded` is that number. */
  readonly entries: number;
  /** Entries that have finished a durable read, and so the only ones that can
   *  write. Zero on a dark realm however many entries exist. */
  readonly loaded: number;
  readonly dirty: number;
  readonly running: number;
  readonly pending: number;
  /** Entries held by ANY recovery hold, DATA or CAPACITY. A row this build could
   *  not interpret is one cause; a full local admission cap, a missing
   *  background permit and a thrown read are the others, and they mean opposite
   *  things to an operator. Read `loadFailuresByKind` to tell them apart. */
  readonly held: number;
  /** Entries quiesced by an answer no repeat of the same payload can fix. Only
   *  the first producer is the compare-and-swap fence: a stale CAS, a missing or
   *  conflicting row, the seal refusing a record this entry did not load, the
   *  unnamed-insert refusal, the writable-implies-readable refusal, and a run of
   *  thrown writes inside the error window. Read it against `staleWrites` and
   *  `writeFailures` rather than alone, because only `staleWrites` means a
   *  second writer is touching these rows. Kept apart from `held` because the
   *  two are counted independently and must never be summed. */
  readonly quiesced: number;
  readonly loads: number;
  readonly loadFailures: number;
  /** The same total, split by the hold kind that caused it. */
  readonly loadFailuresByKind: Readonly<Record<string, number>>;
  readonly writes: number;
  readonly writeFailures: number;
  readonly staleWrites: number;
  readonly permitWaitMsTotal: number;
  readonly queueWaitMsTotal: number;
  readonly writeMsTotal: number;
  /** Serialization, cloning and the write refusal's own walk: the synchronous
   *  work between the permit and the statement, which `write_ms` deliberately
   *  does not bracket. */
  readonly codecMsTotal: number;
  readonly loadMsTotal: number;
  readonly oldestDirtyAgeMs: number;
  readonly writeBytesTotal: number;
  readonly maxWriteBytes: number;
  /** Writes that held a background permit with no document to send. No
   *  statement is issued: the arm returns before the row is ever touched. The
   *  terminal state of every lost-save path this store has had. */
  readonly writesWithoutRecord: number;
  /** Oversize refusals taken on the ON-DISK pre-gate, where no text length was
   *  measured, as opposed to the measured byte bound. */
  readonly preGateRefusals: number;
  /** Owners whose write is waiting on the store's own admission cap rather than
   *  on the shared gate. The cap's whole claim is that the surplus waits in a
   *  bounded set this store owns, and an unobservable set is an unfalsifiable
   *  claim. */
  readonly deferredWrites: number;
  readonly activeWrites: number;
  /** Documents captured at leave and not yet written: a second full record each
   *  on top of the entry's own, retained until the write lands. */
  readonly leaveCaptures: number;
  /** Ruling (b)'s re-asks: the handshake's second ask, after the character
   *  lease. `reaskReads` are those that waited on the durable path (a read, a
   *  shared single-flight read, or a permit wait) rather than replaying a loaded
   *  entry, which is housing wait inside the lease-held window; a cap refusal
   *  waits on nothing and is not counted. `reaskMsTotal` is the re-asks' summed
   *  wall time, bounded per handshake by what the first ask left of
   *  FREEHOLD_PERSIST_LOGIN_BUDGET_MS. */
  readonly reasks: number;
  readonly reaskReads: number;
  readonly reaskMsTotal: number;
  /** How each join's install was decided (server/freehold_join_answer.ts):
   *  `entry` is a loaded entry the ask already matched (every healthy join, so
   *  it tracks login volume); `superseded` is the loaded entry installed in
   *  place of a stale, held, marked, broken or missing ask, the twelfth path's
   *  fix actually changing an install; `withheld` is a join nothing could vouch
   *  for, installed as no record (write-blocked unless a live record stands). */
  readonly joinVerdicts: Readonly<Record<FreeholdJoinVerdict, number>>;
}
