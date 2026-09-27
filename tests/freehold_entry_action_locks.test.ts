import { describe, expect, it } from 'vitest';
import { GLIDER_QUEST_ID } from '../src/sim/content/world_quest_glider';
import { SHADOW_QUEST_ID } from '../src/sim/content/world_quest_shadow';
import { WISP_MAZE_QUEST_ID } from '../src/sim/content/world_quest_wisp_maze';
import { BUILTIN_WORLD, dungeonAt } from '../src/sim/data';
import { freeholdEntryContextReason } from '../src/sim/freehold/entry_context';
import { FREEHOLD_GATE_TEMPLATE_ID } from '../src/sim/freehold/gate_rules';
import { type PlayerMeta, Sim } from '../src/sim/sim';
import type { WorldQuestProgress } from '../src/sim/types';

// The release/v0.44.0 sync at aaff789813 brought four states that own a
// player's actions: a manned cannon (meta.vehicle), a live wisp maze trial, a
// shadow cloak and a glider run. useItem refuses every item use in them before
// the Hearth Key's arm; the gate and key entry context refuses them too, as
// 'busy', so neither door into a Freehold depends on that check order alone.
const LOCKS: Record<string, (meta: PlayerMeta) => void> = {
  vehicle: (meta) => {
    meta.vehicle = {
      kind: 'cannon',
      stationId: 'probe',
      cycle: 'probe',
      origin: { x: 0, y: 0, z: 0 },
    } as unknown as PlayerMeta['vehicle'];
  },
  wispMaze: (meta) => {
    meta.worldQuestLog.set(WISP_MAZE_QUEST_ID, {
      wispMaze: { phase: 'active', paused: false },
    } as unknown as WorldQuestProgress);
  },
  shadow: (meta) => {
    meta.worldQuestLog.set(SHADOW_QUEST_ID, {
      shadow: { phase: 'cloaked' },
    } as unknown as WorldQuestProgress);
  },
  glider: (meta) => {
    meta.worldQuestLog.set(GLIDER_QUEST_ID, {
      glider: { phase: 'flying' },
    } as unknown as WorldQuestProgress);
  },
};

function setup() {
  const sim = new Sim({
    seed: 42,
    playerClass: 'warrior',
    freeholdsEnabled: true,
    lockoutNowMs: () => 1000,
    world: { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] },
  });
  const gate = [...sim.entities.values()].find((e) => e.templateId === FREEHOLD_GATE_TEMPLATE_ID)!;
  sim.player.pos = { ...gate.pos };
  sim.addItem('hearth_key', 1);
  sim.drainEvents();
  return { sim, meta: sim.meta(sim.primaryId)! };
}

describe('Freehold entry under the release action locks', () => {
  it('admits the unlocked control through the gate and the key', () => {
    const { sim } = setup();
    expect(freeholdEntryContextReason(sim.ctx, sim.primaryId)).toBeNull();
    sim.useItem('hearth_key');
    expect(dungeonAt(sim.player.pos.x)?.id).toBe('freehold_inn_room');
  });

  it.each(Object.keys(LOCKS))('refuses the %s lock as busy at the entry context', (lock) => {
    const { sim, meta } = setup();
    LOCKS[lock](meta);
    expect(freeholdEntryContextReason(sim.ctx, sim.primaryId)).toBe('busy');
  });

  it.each(Object.keys(LOCKS))('refuses the Hearth Key under the %s lock', (lock) => {
    const { sim, meta } = setup();
    LOCKS[lock](meta);
    const before = structuredClone(sim.player.pos);
    sim.useItem('hearth_key');
    expect(sim.player.pos).toEqual(before);
    expect(dungeonAt(sim.player.pos.x)).toBeNull();
    expect(sim.freeholdKeyReadyAtMs.size).toBe(0);
  });

  it.each(Object.keys(LOCKS))('refuses the gate under the %s lock', (lock) => {
    const { sim, meta } = setup();
    LOCKS[lock](meta);
    const before = structuredClone(sim.player.pos);
    sim.freeholdEnter();
    expect(sim.player.pos).toEqual(before);
    expect(
      sim
        .drainEvents()
        .filter((e) => e.type === 'freeholdDenied')
        .map((e) => e.reason),
    ).toContain('busy');
  });
});
