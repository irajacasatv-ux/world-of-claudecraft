// The thrown-run retry posture's decisions (server/freehold_write_retry.ts),
// driven with literals. The store-level behaviour (the capture kept, the rejoin,
// the drain) is pinned in tests/server/freehold_persist.test.ts, "a run of thrown
// writes keeps its edits and retries them once per window (R1)".
import { describe, expect, it } from 'vitest';
import { FreeholdUpsertRefused } from '../../server/freehold_upsert_refused';
import {
  FREEHOLD_PERSIST_MAX_WRITE_ERRORS,
  FREEHOLD_PERSIST_RETRY_WRITE_CAP,
  FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS,
  type FreeholdWriteRun,
  freeholdRetryDue,
  freeholdThrownWriteIsAnswer,
  noteThrownWrite,
} from '../../server/freehold_write_retry';

const WINDOW = FREEHOLD_PERSIST_WRITE_ERROR_WINDOW_MS;
const freshRun = (): FreeholdWriteRun => ({ writeErrors: 0, lastWriteErrorMs: 0, retryAtMs: 0 });
const FAULT = false;
const ANSWER = true;

describe('noteThrownWrite', () => {
  it('pins the three constants the posture stands on', () => {
    expect(FREEHOLD_PERSIST_MAX_WRITE_ERRORS).toBe(3);
    expect(WINDOW).toBe(300_000);
    expect(FREEHOLD_PERSIST_RETRY_WRITE_CAP).toBe(2);
  });

  it('counts faults inside the window and enters the clock on the run-completing one', () => {
    const run = freshRun();
    expect(noteThrownWrite(run, 1_000, FAULT)).toBe('blip');
    expect(noteThrownWrite(run, 1_000 + WINDOW, FAULT)).toBe('blip');
    expect(run).toEqual({ writeErrors: 2, lastWriteErrorMs: 1_000 + WINDOW, retryAtMs: 0 });
    expect(noteThrownWrite(run, 2_000 + WINDOW, FAULT)).toBe('entered');
    expect(run).toEqual({
      writeErrors: 3,
      lastWriteErrorMs: 2_000 + WINDOW,
      retryAtMs: 2_000 + 2 * WINDOW,
    });
  });

  it('starts a fresh count past the window, so spread-out faults never enter', () => {
    const run = freshRun();
    for (let i = 0; i < 5; i++) {
      expect(noteThrownWrite(run, 1_000 + i * (WINDOW + 1), FAULT)).toBe('blip');
    }
    expect(run.writeErrors).toBe(1);
    expect(run.retryAtMs).toBe(0);
  });

  it('keeps the clock sticky: a fault past the window still re-arms it from that fault', () => {
    const run: FreeholdWriteRun = {
      writeErrors: 3,
      lastWriteErrorMs: 5_000,
      retryAtMs: 5_000 + WINDOW,
    };
    // The retry fires a window and a sweep after the last fault, so its own
    // failure is outside the window and resets the COUNT, never the clock.
    const failedAt = 5_000 + WINDOW + 30_000;
    expect(noteThrownWrite(run, failedAt, FAULT)).toBe('retrying');
    expect(run).toEqual({
      writeErrors: 1,
      lastWriteErrorMs: failedAt,
      retryAtMs: failedAt + WINDOW,
    });
  });

  it('ends the writes on a payload answer: the run-completing one before the clock, the first on it', () => {
    const run = freshRun();
    expect(noteThrownWrite(run, 1_000, ANSWER)).toBe('blip');
    expect(noteThrownWrite(run, 2_000, ANSWER)).toBe('blip');
    expect(noteThrownWrite(run, 3_000, ANSWER)).toBe('answered');
    // Never on the clock: the store quiesces instead.
    expect(run.retryAtMs).toBe(0);
    const onClock: FreeholdWriteRun = {
      writeErrors: 3,
      lastWriteErrorMs: 1,
      retryAtMs: 1 + WINDOW,
    };
    expect(noteThrownWrite(onClock, 2 + 2 * WINDOW, ANSWER)).toBe('answered');
    expect(onClock.retryAtMs).toBe(1 + WINDOW);
  });
});

describe('freeholdThrownWriteIsAnswer', () => {
  it("names the writer's own BRANDED refusal and the payload SQLSTATE classes answers", () => {
    expect(
      freeholdThrownWriteIsAnswer(
        new FreeholdUpsertRefused('freehold tier must be a non-empty string'),
      ),
    ).toBe(true);
    for (const code of ['22001', '22P02', '23505', '23514']) {
      expect(freeholdThrownWriteIsAnswer(Object.assign(new Error('x'), { code })), code).toBe(true);
    }
  });

  it('names every other throw a fault a repeat can clear, a plain TypeError or RangeError included', () => {
    // pg throws a dropped connection with no code at all; a read-back of the
    // statement's own result or a store bug is a plain TypeError, and Node's
    // ERR_* errors are TypeErrors or RangeErrors carrying a string code.
    expect(freeholdThrownWriteIsAnswer(new Error('Connection terminated unexpectedly'))).toBe(
      false,
    );
    expect(freeholdThrownWriteIsAnswer(new TypeError('must come back as exact bigint text'))).toBe(
      false,
    );
    expect(freeholdThrownWriteIsAnswer(new RangeError('out of range'))).toBe(false);
    expect(
      freeholdThrownWriteIsAnswer(Object.assign(new RangeError('x'), { code: 'ERR_OUT_OF_RANGE' })),
    ).toBe(false);
    for (const code of [
      '08006',
      '53300',
      '57014',
      '57P01',
      '40001',
      '40P01',
      '55P03',
      '42501',
      'XX000',
      '2350',
      '235140',
    ]) {
      expect(freeholdThrownWriteIsAnswer(Object.assign(new Error('x'), { code })), code).toBe(
        false,
      );
    }
    expect(freeholdThrownWriteIsAnswer('a string')).toBe(false);
    expect(freeholdThrownWriteIsAnswer(null)).toBe(false);
    expect(freeholdThrownWriteIsAnswer({ code: 23505 })).toBe(false);
  });
});

describe('freeholdRetryDue', () => {
  const RETRY_AT = 1_000_000;
  it('is always due off the clock', () => {
    expect(freeholdRetryDue(0, 0, false)).toBe(true);
  });

  it('waits until the clock, then is due at it and after it', () => {
    expect(freeholdRetryDue(RETRY_AT, RETRY_AT - 1, false)).toBe(false);
    expect(freeholdRetryDue(RETRY_AT, RETRY_AT, false)).toBe(true);
    expect(freeholdRetryDue(RETRY_AT, RETRY_AT + 1, false)).toBe(true);
  });

  it('is due at once while the shutdown drain runs', () => {
    expect(freeholdRetryDue(RETRY_AT, RETRY_AT - 1, true)).toBe(true);
  });

  it('counts a wall clock stepped back more than a window before the failure as due, and no less', () => {
    const failedAt = RETRY_AT - WINDOW;
    expect(freeholdRetryDue(RETRY_AT, failedAt - WINDOW, false)).toBe(false);
    expect(freeholdRetryDue(RETRY_AT, failedAt - WINDOW - 1, false)).toBe(true);
  });
});
