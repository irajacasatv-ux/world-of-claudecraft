import { describe, expect, it } from 'vitest';

import {
  advanceInterruptibleMountEngine,
  mountEngineBendRate,
  mountEngineIdleAudible,
} from '../src/game/mount_engine_state';

const semitones = (rate: number) => Math.round(Math.log2(rate) * 12 * 100) / 100;

describe('mountEngineBendRate', () => {
  it('leaves a grounded forward loop at its authored rate', () => {
    expect(mountEngineBendRate(false, false, true)).toBe(1);
  });

  it('bends reverse up two semitones', () => {
    expect(semitones(mountEngineBendRate(true, false, true))).toBe(2);
  });

  it('bends airborne up three semitones', () => {
    expect(semitones(mountEngineBendRate(false, true, true))).toBe(3);
  });

  it('stacks reverse and airborne SUB-additively, to four rather than five', () => {
    expect(semitones(mountEngineBendRate(true, true, true))).toBe(4);
    // the naive product would be 2 + 3
    expect(mountEngineBendRate(true, true, true)).toBeLessThan(
      mountEngineBendRate(true, false, true) * mountEngineBendRate(false, true, true),
    );
  });

  it('leaves a mount with no idle take on its original airborne-only bend', () => {
    expect(mountEngineBendRate(false, false, false)).toBe(1);
    expect(mountEngineBendRate(false, true, false)).toBe(1.08);
    // reverse is a clip swap for those mounts, never a pitch bend
    expect(mountEngineBendRate(true, false, false)).toBe(1);
  });
});

describe('mountEngineIdleAudible', () => {
  it('runs the idle while parked', () => {
    expect(mountEngineIdleAudible('idle')).toBe(true);
  });

  it('holds the idle UNDER the winddown, so a stop hands off instead of cutting', () => {
    expect(mountEngineIdleAudible('stopping')).toBe(true);
  });

  it('drops the idle during the windup, which climbs away from it', () => {
    expect(mountEngineIdleAudible('starting')).toBe(false);
  });

  it('drops the idle once the drive loop owns the engine', () => {
    expect(mountEngineIdleAudible('moving')).toBe(false);
  });
});

describe('direction flips cut on a dime', () => {
  it('releasing mid-windup goes straight to the winddown', () => {
    const d = advanceInterruptibleMountEngine(
      { state: 'starting', phaseStartedAt: 0 },
      false,
      0.2,
      3.6,
    );
    expect(d.next.state).toBe('stopping');
    expect(d.action).toBe('playStop');
  });

  it('pressing mid-winddown goes straight back to the windup', () => {
    const d = advanceInterruptibleMountEngine(
      { state: 'stopping', phaseStartedAt: 0 },
      true,
      0.1,
      3.6,
    );
    expect(d.next.state).toBe('starting');
    expect(d.action).toBe('playStart');
  });

  it('never waits out the windup before it can be interrupted', () => {
    // half a second into a 3.6s windup, a release still cuts immediately
    const d = advanceInterruptibleMountEngine(
      { state: 'starting', phaseStartedAt: 0 },
      false,
      0.5,
      3.6,
    );
    expect(d.next.state).toBe('stopping');
  });
});
