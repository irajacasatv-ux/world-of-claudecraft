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
// the join hands it replaces a record that is already live, and with one standing
// no install changes anything for the counters to report.

import type { LoadedFreehold } from './freehold_load_outcome';

/** The fixed verdict vocabulary, walked by the metrics exporter so its label
 *  set is this list and never whatever a producer happens to emit; the verdict
 *  type is derived from it, so the two cannot drift. */
export const FREEHOLD_JOIN_VERDICTS = [
  'none',
  'refused',
  'entry',
  'superseded',
  'held',
  'withheld',
] as const;

/** Which arm decided, so the store can count it and a test can name the arm it
 *  reached. `entry` and `superseded` install the same thing (the loaded entry);
 *  they differ only in whether the install CHANGED anything, so `superseded` is
 *  the twelfth path's fix actually changing an install: an ask that differed
 *  from the entry (stale, held on capacity, marked, broken or missing) with no
 *  live record standing. A second character's join beside a live record, and a
 *  login replaying the same DATA hold its entry holds, are `entry`. */
export type FreeholdJoinVerdict = (typeof FREEHOLD_JOIN_VERDICTS)[number];

/** A zero count per verdict, built from the vocabulary, so a verdict added to
 *  it can never be missing from a counter (it would count NaN). */
export function freeholdJoinVerdictCounts(): Record<FreeholdJoinVerdict, number> {
  return Object.fromEntries(FREEHOLD_JOIN_VERDICTS.map((verdict) => [verdict, 0])) as Record<
    FreeholdJoinVerdict,
    number
  >;
}

/** True when `asked` is an answer the entry's `current` answer would not
 *  change: the same account, plot and durable revision, the same document
 *  revision, the same hold kind or none, and no withheld mark. */
function askedMatches(asked: LoadedFreehold | undefined, current: LoadedFreehold): boolean {
  if (typeof asked !== 'object' || asked === null) return false;
  return (
    asked.accountId === current.accountId &&
    (asked.hold?.kind ?? null) === (current.hold?.kind ?? null) &&
    asked.recordWithheld === false &&
    asked.plotId === current.plotId &&
    asked.durableRev === current.durableRev &&
    (asked.state?.rev ?? null) === (current.state?.rev ?? null)
  );
}

/**
 * The answer this join installs.
 *
 * @param asked the handshake's answer: its RE-ASK, made after the lease and the
 *   character read, or its first ask if the re-ask threw; undefined when the join
 *   carries none.
 * @param current the store's LOADED entry answering now, exactly as preload's
 *   replay arm would (its capture if it holds one, else its committed state, and
 *   no document while it is blocked), or null when no entry is loaded.
 * @param live whether a live record already stands for the owner, which makes
 *   the install a no-op: it decides only which verdict is counted.
 */
export function freeholdJoinAnswer(
  accountId: number,
  asked: LoadedFreehold | undefined,
  current: LoadedFreehold | null,
  live: boolean,
): { readonly answer: LoadedFreehold | undefined; readonly verdict: FreeholdJoinVerdict } {
  // THE ENTRY, whatever was asked: nothing (both handshake asks threw), a broken
  // or foreign bag, a hold, a marked answer or a stale one. A loaded entry holds
  // the capture a leaving session still owes, the house a sibling committed, or
  // the hold it now carries, so it answers before any other arm and a waiting
  // capture is never dropped for want of a usable ask (the QA and fresh reads of
  // ruling (b)). Checked against the account, so an entry can never hand one
  // account's house to another.
  if (current !== null && current.accountId === accountId) {
    const changed = !live && !askedMatches(asked, current);
    return { answer: current, verdict: changed ? 'superseded' : 'entry' };
  }
  // No loaded entry and no durable answer at all: install nothing, as a join
  // always has.
  if (asked === undefined) return { answer: undefined, verdict: 'none' };
  // Not this account's answer, or not an answer: unchanged, so the install's own
  // structural guards refuse it and nothing new decides on a broken bag.
  if (typeof asked !== 'object' || asked === null || asked.accountId !== accountId) {
    return { answer: asked, verdict: 'refused' };
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
