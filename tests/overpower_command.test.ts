import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

function makeSim() {
  return new Sim({ seed: 42, playerClass: 'warrior', noPlayer: true, world: EMPTY_TEST_WORLD });
}

function errorTexts(events: SimEvent[], pid: number): string[] {
  return events
    .filter((e): e is Extract<SimEvent, { type: 'error' }> => e.type === 'error' && e.pid === pid)
    .map((e) => e.text);
}

// /overpower reads only Entity.overpowerUntil + sim.time + the player's class,
// replies on the self-only error channel, and is never logged to chat.
describe('/overpower command', () => {
  it('reports the open reactive window with seconds remaining for a warrior', () => {
    const sim = makeSim();
    const pid = sim.addPlayer('warrior', 'Aleph');
    sim.tick();
    const e = sim.entities.get(pid)!;
    e.overpowerUntil = sim.time + 4; // an enemy just dodged the player's attack

    sim.chat('/overpower', pid);
    expect(errorTexts(sim.tick(), pid)).toContain(
      'Overpower is ready — strike within 4s (an enemy dodged your attack).',
    );
  });

  it('rounds a part second up, so a window still open never reads as closed', () => {
    const sim = makeSim();
    const pid = sim.addPlayer('warrior', 'Aleph');
    sim.tick();
    const e = sim.entities.get(pid)!;
    const ready = (seconds: number) =>
      `Overpower is ready — strike within ${seconds}s (an enemy dodged your attack).`;

    e.overpowerUntil = sim.time + 2.5;
    sim.chat('/overpower', pid);
    expect(errorTexts(sim.tick(), pid)).toContain(ready(3));

    e.overpowerUntil = sim.time + 0.5;
    sim.chat('/overpower', pid);
    expect(errorTexts(sim.tick(), pid)).toContain(ready(1));
  });

  it('reports the window closed once it has lapsed', () => {
    const sim = makeSim();
    const pid = sim.addPlayer('warrior', 'Aleph');
    sim.tick();
    const e = sim.entities.get(pid)!;
    e.overpowerUntil = -1; // default / consumed: no proc active

    sim.chat('/op', pid);
    expect(errorTexts(sim.tick(), pid)).toContain(
      'Overpower is not available. It opens for 5s after an enemy dodges your attack.',
    );
  });

  it('tells non-warriors the ability is not theirs', () => {
    const sim = makeSim();
    const pid = sim.addPlayer('mage', 'Bet');
    sim.tick();
    const e = sim.entities.get(pid)!;
    e.overpowerUntil = sim.time + 5; // even with a window set, class gates it out

    sim.chat('/overpowered', pid);
    expect(errorTexts(sim.tick(), pid)).toContain(
      'Overpower is a warrior ability; your class cannot use it.',
    );
  });

  it('never emits a chat event (self-only, unlogged)', () => {
    const sim = makeSim();
    const pid = sim.addPlayer('warrior', 'Aleph');
    sim.tick();

    expect(sim.chat('/overpower', pid)).toBeNull();
    const chats = sim.tick().filter((ev) => ev.type === 'chat');
    expect(chats).toHaveLength(0);
  });
});
