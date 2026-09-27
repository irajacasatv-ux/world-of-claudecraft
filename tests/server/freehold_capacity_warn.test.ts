// The housing store's capacity-hold lines, one per kind per window
// (server/freehold_capacity_warn.ts). A login storm refuses the same way a
// thousand times, and since ruling (b) one refused login can book three
// refusals; the exact count rides woc_freehold_load_failures_total, so the lines
// only need to say it is happening, and how much they held back.

import { describe, expect, it } from 'vitest';
import {
  createFreeholdCapacityWarn,
  FREEHOLD_CAPACITY_WARN_WINDOW_MS,
} from '../../server/freehold_capacity_warn';

function rig(windowMs?: number) {
  const lines: string[] = [];
  let now = 1_000_000;
  const warn = createFreeholdCapacityWarn(
    (line) => lines.push(line),
    () => now,
    windowMs,
  );
  return {
    lines,
    warn,
    advance(ms: number) {
      now += ms;
    },
  };
}

describe('createFreeholdCapacityWarn', () => {
  it('holds a ten-second window by default', () => {
    expect(FREEHOLD_CAPACITY_WARN_WINDOW_MS).toBe(10_000);
  });

  it('prints a capacity kind once per window, then says how many it held back', () => {
    const r = rig();
    r.warn('cap_full', true, 'held (cap_full) 1');
    r.warn('cap_full', true, 'held (cap_full) 2');
    r.advance(9_999);
    r.warn('cap_full', true, 'held (cap_full) 3');
    expect(r.lines).toEqual(['held (cap_full) 1']);
    r.advance(1);
    r.warn('cap_full', true, 'held (cap_full) 4');
    expect(r.lines).toEqual([
      'held (cap_full) 1',
      'held (cap_full) 4 (2 more cap_full held back since the last line)',
    ]);
    // Nothing held back since that line: no tail on the next one.
    r.advance(10_000);
    r.warn('cap_full', true, 'held (cap_full) 5');
    expect(r.lines.at(-1)).toBe('held (cap_full) 5');
  });

  it('limits each capacity kind on its own window', () => {
    const r = rig();
    r.warn('cap_full', true, 'a');
    r.warn('no_permit', true, 'b');
    r.warn('no_budget', true, 'c');
    r.warn('read_threw', true, 'd');
    r.warn('no_permit', true, 'e');
    expect(r.lines).toEqual(['a', 'b', 'c', 'd']);
  });

  it('always prints a DATA kind, which is a per-row incident', () => {
    const r = rig();
    for (let i = 0; i < 3; i++) r.warn('malformed', false, `held (malformed) ${i}`);
    expect(r.lines).toEqual(['held (malformed) 0', 'held (malformed) 1', 'held (malformed) 2']);
  });

  it('prints again when the clock runs backwards rather than going quiet', () => {
    const r = rig();
    r.warn('cap_full', true, 'a');
    r.advance(-5_000);
    r.warn('cap_full', true, 'b');
    expect(r.lines).toEqual(['a', 'b']);
  });

  it('honours an injected window', () => {
    const r = rig(100);
    r.warn('cap_full', true, 'a');
    r.advance(100);
    r.warn('cap_full', true, 'b');
    expect(r.lines).toEqual(['a', 'b']);
  });
});
