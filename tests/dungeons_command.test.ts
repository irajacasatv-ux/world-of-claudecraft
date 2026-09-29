import { describe, expect, it } from 'vitest';
import { DUNGEON_LIST, zoneAt } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

// The readout reads the static dungeon registry and zones: the empty world serves.
function makeWorld() {
  return new Sim({ seed: 42, playerClass: 'warrior', noPlayer: true, world: EMPTY_TEST_WORLD });
}

function errorTexts(events: SimEvent[]): string[] {
  return events.flatMap((e) => (e.type === 'error' ? [e.text] : []));
}

describe('/dungeons command', () => {
  it('lists every group dungeon with its door zone and suggested party size', () => {
    const sim = makeWorld();
    const a = sim.addPlayer('warrior', 'Aleph');
    sim.tick();

    // Owner-keyed rooms (the two freehold records) are private housing and
    // never appear in the readout; the expectation is built from the static
    // registry minus that key, so a room leaking back in changes the count
    // AND the body.
    const listed = DUNGEON_LIST.filter((d) => d.claimKey !== 'owner');
    const parts = listed.map(
      (d) => `${d.name} (${zoneAt(d.doorPos.x, d.doorPos.z).name}, ${d.suggestedPlayers} players)`,
    );
    const expected = `Dungeons (${parts.length}): ${parts.join(', ')}.`;

    sim.chat('/dungeons', a);
    // The readout comes first, then the difficulty status line (heroic
    // feature), then the reset usage line.
    const texts = errorTexts(sim.tick());
    expect(texts[texts.length - 3]).toBe(expected);
    // The filter is load-bearing: both freehold rooms are registered
    // dungeons, and the readout drops exactly those two (16 defs, 14 listed).
    expect(DUNGEON_LIST.map((d) => d.id)).toEqual(
      expect.arrayContaining(['freehold_inn_room', 'freehold_cottage']),
    );
    expect(DUNGEON_LIST).toHaveLength(16);
    expect(texts[texts.length - 3]).toMatch(/^Dungeons \(14\): /);
    expect(texts[texts.length - 3]).not.toContain('Inn Room');
    expect(texts[texts.length - 3]).not.toContain('Cottage');
    expect(texts[texts.length - 3]).toContain('Hollow Crypt (');
    expect(texts[texts.length - 3]).toContain('Dawnhold Castle (');
    expect(texts[texts.length - 2]).toBe(
      'Dungeon difficulty: Normal. Use /dungeon heroic to change it.',
    );
    expect(texts[texts.length - 1]).toBe(
      'Use /dungeon reset to abandon your empty instances after changing difficulty.',
    );
  });

  it('responds to the /dungeon and /instances aliases', () => {
    const sim = makeWorld();
    const a = sim.addPlayer('warrior', 'Aleph');
    sim.tick();

    sim.chat('/dungeon', a);
    const first = errorTexts(sim.tick()).find((t) => t.startsWith('Dungeons ('));
    sim.chat('/instances', a);
    const second = errorTexts(sim.tick()).find((t) => t.startsWith('Dungeons ('));

    expect(first).toMatch(/^Dungeons \(/);
    expect(second).toBe(first);
  });

  it('is self-only and never logged or spoken', () => {
    const sim = makeWorld();
    const a = sim.addPlayer('warrior', 'Aleph');
    sim.tick();
    const result = sim.chat('/dungeons', a);
    expect(result).toBeNull();
    expect(sim.tick().some((e) => e.type === 'chat')).toBe(false);
  });
});
