// The LEAVE path's own work: the contests a leaver forfeits, the final
// character save and its retry policy, extracted from the coordinator so the
// teardown that depends on them can sit in a `finally`.
// It owns one rule and nothing else: a leaving session's final save is retried
// with exponential backoff, and when the last attempt fails the guild-book work
// that session dirtied is reconciled, because there is no save left to converge
// it and the disband guard loses sight of it the moment the session tears down.
//
// The two real side effects are callbacks, so the coordinator keeps the save and
// the reconciliation and this module keeps only the ordering and the backoff.

/** The one sleep this module needs, local rather than imported: the coordinator
 *  keeps its own copy for other paths and a shared util for two lines would be
 *  a seam nobody asked for. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Attempts before a leaving session's save gives up. Moved here UNCHANGED from
 *  the coordinator; server/character_blob_size.ts and
 *  server/character_save_statement.ts both reason about this number by name. */
export const LEAVE_SAVE_MAX_ATTEMPTS = 5;
/** The first backoff, doubled per attempt. Unchanged. */
export const LEAVE_SAVE_RETRY_BASE_MS = 250;
/** The ceiling on that doubling. Unchanged. */
export const LEAVE_SAVE_RETRY_MAX_MS = 4000;

/** The backoff for one attempt, exported so its ceiling is testable without a
 *  clock: attempt 1 waits the base, and each later one doubles up to the cap. */
export function leaveSaveRetryMs(attempt: number): number {
  return Math.min(LEAVE_SAVE_RETRY_BASE_MS * 2 ** (attempt - 1), LEAVE_SAVE_RETRY_MAX_MS);
}

/** Save a leaving character, retrying, and reconcile its guild books if every
 *  attempt fails. Never throws: the caller is already tearing the session down
 *  and has release work of its own that must still run. */
export async function saveLeavingCharacter(
  /** For the log lines, which name the character rather than the account. */
  name: string,
  /** The final character-plus-market save. Its resolved value is ignored: only
   *  whether it threw decides a retry. */
  save: () => Promise<unknown>,
  /** Undo the guild-book work this session owns, when no save is left. */
  reconcileGuildBooks: () => void,
): Promise<void> {
  for (let attempt = 1; attempt <= LEAVE_SAVE_MAX_ATTEMPTS; attempt++) {
    try {
      await save();
      return;
    } catch (err) {
      if (attempt === LEAVE_SAVE_MAX_ATTEMPTS) {
        console.error(`save on leave failed after ${attempt} attempts for ${name}:`, err);
        // This session will never save again, so any guild books it dirtied are
        // permanently unflushable: the live book is ahead of durable truth with
        // no session left to converge it, and the disband guard (which scans
        // session marks) loses sight of it the moment this session tears down.
        reconcileGuildBooks();
        return;
      }
      const retryMs = leaveSaveRetryMs(attempt);
      console.error(`save on leave failed for ${name}; retrying in ${retryMs}ms:`, err);
      await delay(retryMs);
    }
  }
}

/** The sim surface the leave path touches. Four idempotent calls, named rather
 *  than a whole Sim, so this module cannot grow into a second coordinator. */
export interface LeavingContestSim {
  arenaResolveDesertion(pid: number): void;
  leaveCardMinigameEntirely(pid: number): void;
  bgResolveDesertion(pid: number): void;
  preparePlayerLeave(pid: number): void;
}

/** Every live contest a leaver forfeits, resolved SYNCHRONOUSLY before the leave
 *  snapshot so its outcome is in the saved state. All four are idempotent and
 *  removePlayer repeats them harmlessly after the save; the point is that the
 *  save sees them. Arena keeps the remaining player's win and honor durable when
 *  both combatants disconnect together, Card Duel drops the queue slot and
 *  forfeits a live match, Thornhollow Fields records the loss and the rating
 *  delta, and preparePlayerLeave freezes reward eligibility and reconciles
 *  pending loot, without which a roll or a boss death lands after serialization
 *  and removePlayer discards it. */
export function resolveLeavingContests(sim: LeavingContestSim, pid: number): void {
  sim.arenaResolveDesertion(pid);
  sim.leaveCardMinigameEntirely(pid);
  sim.bgResolveDesertion(pid);
  sim.preparePlayerLeave(pid);
}
