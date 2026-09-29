// Guild-letter delivery through the real Sim. Split from
// tests/professions_trend.test.ts along describe boundaries for CI shard
// balance (a pure move; shared helpers in professions_trend_util.ts).

import { describe, expect, it } from 'vitest';
import type { SimEvent } from '../src/sim/types';
import { guildLetters, letterDelay, makeWorld, tickFor } from './professions_trend_util';

// Full mail-delivery windows through sim.tick() need real headroom under
// worker-pool CPU contention (the mail.test.ts precedent). Bound in this file,
// not imported, so tests/suite_duration_budget.test.ts can size it.
const GUILD_DELIVERY_TEST_TIMEOUT_MS = 40_000;

describe('the Guild letter through the real Sim', () => {
  // The fresh crossing's own case was this one's first window run alone; the
  // window below asserts the same one pair-correct letter before playing on.
  it(
    'a fresh crossing gets one pair-correct letter, and continued gains never a second',
    () => {
      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Tinker');
      sim.gainCraftSkill(pid, 'engineering', 15);
      sim.gainCraftSkill(pid, 'alchemy', 15);
      const all: SimEvent[] = [];
      all.push(...tickFor(sim, letterDelay('engineering+alchemy') + 5));
      const letters = guildLetters(all, pid);
      expect(letters).toHaveLength(1);
      expect(letters[0]).toMatchObject({ letterId: 'guild_trend_engineering_alchemy' });
      // Cross a DIFFERENT pair far past the threshold and keep playing.
      sim.gainCraftSkill(pid, 'jewelcrafting', 100);
      sim.gainCraftSkill(pid, 'weaponcrafting', 100);
      all.push(...tickFor(sim, letterDelay('jewelcrafting+weaponcrafting') + 30));
      expect(guildLetters(all, pid)).toHaveLength(1);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'an attuned character crossing the threshold gets no Guild letter',
    () => {
      const seedWorld = makeWorld();
      const seedPid = seedWorld.addPlayer('warrior', 'Seed');
      const state = seedWorld.serializeCharacter(seedPid);
      if (!state) throw new Error('expected a serialized character state');
      state.archetype = {
        activeArchetype: 'engineering',
        pairedMajor: 'alchemy',
        attunedPairs: ['engineering+alchemy'],
      };
      state.craftSkills = { ...state.craftSkills, engineering: 40, alchemy: 40 };

      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Attuned', { state });
      const meta = sim.meta(pid);
      if (!meta) throw new Error('no meta');
      expect(meta.archetype.activeArchetype).toBe('engineering');
      sim.gainCraftSkill(pid, 'engineering', 50);
      const events = tickFor(sim, letterDelay('engineering+alchemy') + 10);
      expect(guildLetters(events, pid)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'an amends character (no active pair, non-empty history) gets no Guild letter',
    () => {
      const seedWorld = makeWorld();
      const seedPid = seedWorld.addPlayer('warrior', 'Seed');
      const state = seedWorld.serializeCharacter(seedPid);
      if (!state) throw new Error('expected a serialized character state');
      state.archetype = { activeArchetype: null, attunedPairs: ['engineering+alchemy'] };

      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Amends', { state });
      const meta = sim.meta(pid);
      if (!meta) throw new Error('no meta');
      // normalizeArchetypeState drops pair history when activeArchetype is
      // null, so a round trip alone cannot carry the amends premise; restore
      // it on the live meta so the eligibility predicate (activeArchetype null
      // AND attunedPairs empty, BOTH required) is what this test proves.
      if (!meta.archetype.attunedPairs.includes('engineering+alchemy')) {
        meta.archetype.attunedPairs.push('engineering+alchemy');
      }
      expect(meta.archetype.activeArchetype).toBeNull();
      expect(meta.archetype.attunedPairs.length).toBeGreaterThan(0);
      sim.gainCraftSkill(pid, 'engineering', 15);
      sim.gainCraftSkill(pid, 'alchemy', 15);
      const events = tickFor(sim, letterDelay('engineering+alchemy') + 10);
      expect(guildLetters(events, pid)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'a legacy save with high skills and no flag gets the letter once, then never again',
    () => {
      const seedWorld = makeWorld();
      const seedPid = seedWorld.addPlayer('warrior', 'Seed');
      const state = seedWorld.serializeCharacter(seedPid);
      if (!state) throw new Error('expected a serialized character state');
      // A save predating the guild letter carries no guildLetterSent field at all.
      delete state.guildLetterSent;
      state.craftSkills = { ...state.craftSkills, engineering: 30, alchemy: 10 };

      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Legacy', { state });
      const events = tickFor(sim, letterDelay('engineering+alchemy') + 10);
      const letters = guildLetters(events, pid);
      expect(letters).toHaveLength(1);
      expect(letters[0]).toMatchObject({ letterId: 'guild_trend_engineering_alchemy' });

      const saved = sim.serializeCharacter(pid);
      if (!saved) throw new Error('expected a serialized character state');
      expect(saved.guildLetterSent).toBe(true);
      const sim2 = makeWorld();
      const pid2 = sim2.addPlayer('warrior', 'Legacy', { state: saved });
      const again = tickFor(sim2, letterDelay('engineering+alchemy') + 30);
      expect(guildLetters(again, pid2)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'the one-shot flag survives a save taken before the raven lands',
    () => {
      // The welcome-letter precedent (mail.test.ts): the sent flag is
      // serialized as soon as the letter is booked, not when it lands, so a
      // save taken mid-flight never re-triggers the letter in a fresh world.
      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Hasty');
      sim.gainCraftSkill(pid, 'engineering', 15);
      sim.gainCraftSkill(pid, 'alchemy', 15);
      // Two seconds: enough for the send evaluation, well short of the NPC
      // delivery delay, so the letter is still on the wing at save time.
      tickFor(sim, 2);
      const state = sim.serializeCharacter(pid);
      if (!state) throw new Error('expected a serialized character state');
      expect(state.guildLetterSent).toBe(true);
      const sim2 = makeWorld();
      const pid2 = sim2.addPlayer('warrior', 'Hasty', { state });
      const events = tickFor(sim2, letterDelay('engineering+alchemy') + 30);
      expect(guildLetters(events, pid2)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );
});
