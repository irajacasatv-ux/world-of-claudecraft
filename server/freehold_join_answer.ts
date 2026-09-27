// THE JOIN'S ANSWER, DECIDED AT INSTALL TIME: ruling (b) for the twelfth path
// (Fernando, 2026-09-25; the persistence findings ledger, "RULING (B) FOR THE
// TWELFTH PATH"). Pure, with no store, no ports and no clock, so it lives out
// here and the store keeps only the two lines that gather what it decides from.
//
// THE HAZARD. The answer a handshake carries to the join was read before an
// await the handshake cannot close (the re-ask after the lease and the character
// read is still one await from `game.join`), and another session of the same
// account can edit, leave and be evicted inside it. Installed as asked, that
// answer put an empty or older house over the real one, silently in most
// orders, or lost the leaving session's unwritten edits, loudly in the rest.
//
// WHY THE LOADED ENTRY IS THE TRUTH AT INSTALL TIME. Every commit this process
// makes to the account lands in the entry's committed state; every leave whose
// write has not committed is held on the entry as its capture, which outranks
// that state; and an entry is collected only when it owes no work, while nothing
// writes without a loaded entry. So a loaded entry has seen every edit this
// process made to the account, and with no loaded entry the durable row has.
//
// A LIVE RECORD NEEDS NO VERDICT OF ITS OWN: the install is load-once, so nothing
// the join hands it replaces a record that is already live.

import type { LoadedFreehold } from './freehold_load_outcome';

/** Which arm decided, so the store can say so when it matters and a test can
 *  name the arm it reached. */
export type FreeholdJoinVerdict = 'none' | 'refused' | 'entry' | 'held' | 'withheld';

/** The fixed verdict vocabulary, walked by the metrics exporter so its label
 *  set is this list and never whatever a producer happens to emit. */
export const FREEHOLD_JOIN_VERDICTS: readonly FreeholdJoinVerdict[] = [
  'none',
  'refused',
  'entry',
  'held',
  'withheld',
];

/**
 * The answer this join installs.
 *
 * @param asked the handshake's answer: its RE-ASK, made after the lease and the
 *   character read, or its first ask if the re-ask threw; undefined when the join
 *   carries none.
 * @param current the store's LOADED entry answering now, exactly as preload's
 *   replay arm would (its capture if it holds one, else its committed state, and
 *   no document while it is blocked), or null when no entry is loaded.
 */
export function freeholdJoinAnswer(
  accountId: number,
  asked: LoadedFreehold | undefined,
  current: LoadedFreehold | null,
): { readonly answer: LoadedFreehold | undefined; readonly verdict: FreeholdJoinVerdict } {
  // No durable answer at all (a caller with no handshake, or both asks threw).
  // A LOADED ENTRY still answers, so a leave capture waiting on it is installed
  // rather than dropped for want of an answer (the QA read of ruling (b) found
  // the old "install nothing" arm rested on preload never rejecting); with no
  // entry, install nothing, as a join always has.
  if (asked === undefined) {
    if (current !== null && current.accountId === accountId) {
      return { answer: current, verdict: 'entry' };
    }
    return { answer: undefined, verdict: 'none' };
  }
  // Not this account's answer, or not an answer: unchanged, so the install's own
  // structural guards refuse it and nothing new decides on a broken bag.
  if (typeof asked !== 'object' || asked === null || asked.accountId !== accountId) {
    return { answer: asked, verdict: 'refused' };
  }
  // THE ENTRY, whatever was asked: the capture a leaving session still owes, the
  // house a sibling committed, or the hold the entry now carries. Checked against
  // the account like the asked answer, so an entry can never hand one account's
  // house to another.
  if (current !== null && current.accountId === accountId) {
    return { answer: current, verdict: 'entry' };
  }
  // No loaded entry. A hold installs nothing already.
  if (asked.hold) return { answer: asked, verdict: 'held' };
  // WITHHELD: the entry this answer was read from has gone, so nothing in the
  // store can vouch for it, and a stale absent answer would put an empty default
  // in under the account's real name. No record goes in; the Hearth clock, a
  // separate forward-only durable fact, still merges. The sim then seeds the
  // stand-in, which the write seal (over a row) or the insert refusal (before
  // one) refuses: a write-blocked session, never a lost edit, because no capture
  // can outlive the entry that held it.
  return { answer: { ...asked, state: null, recordWithheld: true }, verdict: 'withheld' };
}
