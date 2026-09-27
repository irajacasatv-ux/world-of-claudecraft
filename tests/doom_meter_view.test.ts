import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Aura, Entity } from '../src/sim/types';
import {
  afflictionFateThreadCount,
  doomMeterState,
  warlockDoomMeterInput,
} from '../src/ui/hud/warlock/doom_meter_view';

function doom(stacks: number, remaining: number): Aura {
  return {
    id: 'affliction_doom',
    name: 'Condemnation',
    kind: 'affliction_doom',
    remaining,
    duration: 20,
    value: stacks,
    stacks,
    sourceId: 1,
    school: 'shadow',
  };
}

describe('Affliction Condemnation meter view', () => {
  const empty = (value: string, max: string) => `${value}/${max}:empty`;
  const timed = (value: string, max: string, seconds: number) => `${value}/${max}:${seconds}`;

  it('shows 0/100 for Affliction even before the first point is generated', () => {
    expect(doomMeterState({ affliction: true, auras: [] }, String, empty, timed)).toEqual({
      visible: true,
      value: 0,
      fillFrac: 0,
      warning: false,
      ready: false,
      fateThreads: 0,
      fateThreadsReady: false,
      label: '0 / 100',
      ariaValueText: '0/100:empty',
      fateThreadsAriaValueText: '0 / 3',
    });
  });

  it('exposes three Fate Threads as a distinct ready state beside Condemnation', () => {
    expect(
      doomMeterState(
        { affliction: true, auras: [doom(73, 12)], fateThreads: 3 },
        String,
        empty,
        timed,
      ),
    ).toMatchObject({
      value: 73,
      fateThreads: 3,
      fateThreadsReady: true,
    });
  });

  it('warns in the final five seconds and marks a full pool ready', () => {
    expect(
      doomMeterState({ affliction: true, auras: [doom(73, 4.2)] }, String, empty, timed),
    ).toMatchObject({
      value: 73,
      fillFrac: 0.73,
      warning: true,
      ready: false,
      label: '73 / 100',
      ariaValueText: '73/100:5',
    });
    expect(
      doomMeterState({ affliction: true, auras: [doom(100, 20)] }, String, empty, timed),
    ).toMatchObject({
      ready: true,
      warning: false,
    });
  });

  it('falls back to the wire value when one stack is omitted by compact snapshots', () => {
    const aura = doom(1, 20);
    aura.stacks = undefined;

    expect(doomMeterState({ affliction: true, auras: [aura] }, String, empty, timed)).toMatchObject(
      {
        value: 1,
        label: '1 / 100',
      },
    );
  });

  it('reads Fate Threads from the warlock instead of the current primary Eye target', () => {
    const ownedThreads: Aura = {
      ...doom(3, 12),
      id: 'needle_of_fate',
      kind: 'affliction_fate_threads',
      sourceId: 7,
    };
    const foreignThreads: Aura = {
      ...ownedThreads,
      sourceId: 9,
    };
    const wrongKind: Aura = {
      ...ownedThreads,
      kind: 'affliction_doom',
    };

    expect(afflictionFateThreadCount([ownedThreads, foreignThreads], 7)).toBe(3);
    expect(afflictionFateThreadCount([foreignThreads], 7)).toBe(0);
    expect(afflictionFateThreadCount([wrongKind], 7)).toBe(0);
  });

  it('hides outside Affliction', () => {
    expect(doomMeterState({ affliction: false, auras: [] }, String, empty, timed).visible).toBe(
      false,
    );
  });
});

// The Hud integration (moved from tests/doom_meter_hud.test.ts, which drove the
// real Hud.updateWarlockDoomMeter on a bare prototype): the frame's input is now
// built by warlockDoomMeterInput, so the case drives that directly, and the
// Hud's two remaining lines (paint exactly that input, hand its thread count on
// to the frame) are pinned against the comment-stripped method below.
describe('Warlock Doom meter frame input', () => {
  it('builds the painted input from Fate Threads owned by the player', () => {
    const player = {
      id: 7,
      auras: [
        {
          id: 'needle_of_fate',
          name: 'Fate Threads',
          kind: 'affliction_fate_threads',
          remaining: 12,
          duration: 12,
          value: 3,
          stacks: 3,
          sourceId: 7,
          school: 'shadow',
        },
      ],
    } as Entity;

    const input = warlockDoomMeterInput('affliction', player);

    // Was the Hud method's return value (the count the frame reads on).
    expect(input.fateThreads).toBe(3);
    // Was the painter's argument.
    expect(input).toEqual({
      affliction: true,
      auras: player.auras,
      fateThreads: 3,
    });
  });

  it('Hud paints exactly that input and returns its thread count (source pin)', () => {
    const hud = readFileSync(join(__dirname, '../src/ui/hud.ts'), 'utf8').replace(
      /(^|[^:])\/\/.*$/gm,
      '$1',
    );
    const start = hud.indexOf('private updateWarlockDoomMeter(p: Entity): number {');
    expect(start).toBeGreaterThan(-1);
    const body = hud.slice(start, hud.indexOf('\n  }\n', start));
    // The whole body, whitespace-normalized: a second paint or an early return
    // cannot slip past a set of contains checks this way.
    expect(body.replace(/\s+/g, ' ').trim()).toBe(
      'private updateWarlockDoomMeter(p: Entity): number { ' +
        'const input = warlockDoomMeterInput(this.sim.talentSpec, p); ' +
        'this.doomMeter.paint(input); return input.fateThreads;',
    );
  });
});
