// The leave path's own work, driven directly rather than through the
// coordinator. The retry ladder, its backoff cap and the exhausted-retry
// reconciliation had no test that imported them: the only coverage was the
// coordinator suites, and the extraction that created this module broke exactly
// those. A seam with a behaviour test cannot be broken silently by the next one.

import { describe, expect, it, vi } from 'vitest';
import {
  LEAVE_SAVE_MAX_ATTEMPTS,
  LEAVE_SAVE_RETRY_BASE_MS,
  LEAVE_SAVE_RETRY_MAX_MS,
  type LeavingContestSim,
  leaveSaveRetryMs,
  resolveLeavingContests,
  saveLeavingCharacter,
} from '../../server/leave_character_save';

// The backoff's real sleeps (3.75 s per exhausted ladder) prove nothing the
// literal ladder pin below does not, so the retrying cases run the ladder on the
// faked clock: every attempt, log line and reconcile still happens in order.
async function onFakeClock<T>(run: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    const done = run();
    await vi.runAllTimersAsync();
    return await done;
  } finally {
    vi.useRealTimers();
  }
}

describe('the leaving character save', () => {
  it('pins the retry ladder to literals, and its cap', () => {
    // TO A LITERAL. Every other assertion here compares a measured count against
    // the constant itself, which cannot notice the value moving; raising the
    // attempt count to fifty would leave those green and make a failing logout
    // sit for minutes.
    expect(LEAVE_SAVE_MAX_ATTEMPTS).toBe(5);
    expect(LEAVE_SAVE_RETRY_BASE_MS).toBe(250);
    expect(LEAVE_SAVE_RETRY_MAX_MS).toBe(4000);
    // The ladder doubles and then CAPS, which is the whole shape.
    expect([1, 2, 3, 4, 5, 6].map(leaveSaveRetryMs)).toEqual([250, 500, 1000, 2000, 4000, 4000]);
  });

  it('returns on the first success and touches nothing else', async () => {
    const save = vi.fn(async () => true);
    const reconcile = vi.fn();
    await saveLeavingCharacter('Ashwen', save, reconcile);
    expect(save).toHaveBeenCalledTimes(1);
    // The anti-vacuity arm for the case below: a healthy logout must not undo
    // the books it just committed.
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('retries a failing save and returns as soon as one lands', async () => {
    let attempts = 0;
    const save = vi.fn(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('db down');
      return true;
    });
    const reconcile = vi.fn();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await onFakeClock(() => saveLeavingCharacter('Ashwen', save, reconcile));
    errors.mockRestore();
    expect(save).toHaveBeenCalledTimes(3);
    // It SUCCEEDED, so nothing is undone: reconciliation is the last attempt's
    // job alone.
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('reconciles the books exactly once when every attempt fails', async () => {
    const save = vi.fn(async () => {
      throw new Error('db down');
    });
    const reconcile = vi.fn();
    const lines: string[] = [];
    const errors = vi
      .spyOn(console, 'error')
      .mockImplementation((message: unknown) => void lines.push(String(message)));
    await onFakeClock(() => saveLeavingCharacter('Ashwen', save, reconcile));
    errors.mockRestore();
    expect(save).toHaveBeenCalledTimes(LEAVE_SAVE_MAX_ATTEMPTS);
    // ONCE, on the last attempt: this session will never save again, so the live
    // book is ahead of durable truth with nothing left to converge it.
    expect(reconcile).toHaveBeenCalledTimes(1);
    // It NEVER THROWS: the caller is already tearing the session down and has
    // release work of its own that must still run.
    expect(lines.some((line) => line.includes('after 5 attempts for Ashwen'))).toBe(true);
    // The character is named in the dev-channel line, never the account.
    expect(lines.join(' ')).not.toContain('account');
  });

  it('never throws even when the RECONCILE ITSELF faults, which is the arm the stub hid', async () => {
    // "Never throws" was stated in the header and proved with a non-throwing
    // stub. The one callback this function invokes runs INSIDE the catch on the
    // exhausted-retry arm, so a fault in the backward book replay rejected out
    // of a leaving session's settlement, which is the single most expensive
    // place on the leave path for a rejection to land: it skipped the
    // registrations that make the character re-enterable.
    const save = vi.fn(async () => {
      throw new Error('db down');
    });
    const reconcile = vi.fn(() => {
      throw new Error('book revert faulted');
    });
    const lines: string[] = [];
    const errors = vi
      .spyOn(console, 'error')
      .mockImplementation((message: unknown) => void lines.push(String(message)));
    await expect(
      onFakeClock(() => saveLeavingCharacter('Ashwen', save, reconcile)),
    ).resolves.toBeUndefined();
    errors.mockRestore();
    expect(reconcile).toHaveBeenCalledTimes(1);
    // The fault is REPORTED, not swallowed silently: it names the character and
    // not the account, like every other line this module writes.
    const reported = lines.filter((line) => line.includes('reconcile on leave failed'));
    expect(reported).toHaveLength(1);
    expect(reported[0]).toContain('Ashwen');
    expect(lines.join(' ')).not.toContain('account');
  });
});

describe('the contests a leaver forfeits', () => {
  it('resolves all four, in the order the leave snapshot depends on', () => {
    const calls: string[] = [];
    const sim: LeavingContestSim = {
      arenaResolveDesertion: () => void calls.push('arena'),
      leaveCardMinigameEntirely: () => void calls.push('card'),
      bgResolveDesertion: () => void calls.push('bg'),
      preparePlayerLeave: () => void calls.push('prepare'),
    };
    resolveLeavingContests(sim, 7);
    // preparePlayerLeave LAST, because it freezes reward eligibility and
    // reconciles pending loot: a desertion resolved after it would land after
    // serialization and removePlayer would discard it.
    expect(calls).toEqual(['arena', 'card', 'bg', 'prepare']);
  });

  it('passes the pid through to every one of them', () => {
    const seen: number[] = [];
    const record = (pid: number): void => void seen.push(pid);
    resolveLeavingContests(
      {
        arenaResolveDesertion: record,
        leaveCardMinigameEntirely: record,
        bgResolveDesertion: record,
        preparePlayerLeave: record,
      },
      42,
    );
    expect(seen).toEqual([42, 42, 42, 42]);
  });
});
