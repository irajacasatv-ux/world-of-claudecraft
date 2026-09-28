// The world population invariant's shared half (tests/world_population_invariant.test.ts
// and its _a to _d escort shards): the budget arithmetic, and one escort's repeated
// run-and-kill rounds. The escort sweep is split across four files ONLY for wall
// time: each case builds and ticks the whole world, and one file holding every
// shipped escort weighed 167,875 ms in CI (the 2026-09-28 harvest, run
// 36448553184), over the 90-second rule tests/suite_lane_threshold.test.ts holds.
// The deal (escortShard, round-robin, so a new escort lands in a shard
// automatically) lives in the Sim-free tests/helpers/escort_shards.ts, and the
// partition is pinned in tests/world_population_shards.test.ts.
import { expect } from 'vitest';
import {
  HEALING_DUMMY_CASTER_ID,
  HEALING_DUMMY_RANGER_ID,
  HEALING_DUMMY_SCOUT_ID,
  HEALING_DUMMY_SOLDIER_ID,
  HEALING_DUMMY_TANK_ID,
} from '../../src/sim/content/healing_training';
import {
  HUB_HEALING_DUMMY_ID,
  HUB_TRAINING_DUMMY_ID,
} from '../../src/sim/content/practice_dummies';
import { CAMPS, DUNGEON_X_THRESHOLD, ESCORTS, MOBS } from '../../src/sim/data';
import { Sim } from '../../src/sim/sim';
import type { Entity, EscortDef } from '../../src/sim/types';
import { worldQuestCycleOfferingQuest } from '../../src/sim/world_quest_rotation';

/** Authored standing population per template, from the camp tables. */
function authoredCounts(): Map<string, number> {
  const out = new Map<string, number>();
  for (const camp of CAMPS) {
    if (!MOBS[camp.mobId]) continue;
    out.set(camp.mobId, (out.get(camp.mobId) ?? 0) + camp.count);
  }
  return out;
}

/** Live open-world mobs per template (instanced content excluded). */
function liveCounts(sim: Sim): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of sim.entities.values()) {
    if (e.kind !== 'mob' || e.dead) continue;
    if (e.spawnPos.x > DUNGEON_X_THRESHOLD) continue; // instance plane
    out.set(e.templateId, (out.get(e.templateId) ?? 0) + 1);
  }
  return out;
}

/** Templates a run is allowed to add to the world WHILE it is active. */
function activeWaveAllowance(sim: Sim): Map<string, number> {
  const out = new Map<string, number>();
  for (const def of Object.values(ESCORTS)) {
    const state = sim.escortRuns.get(def.id);
    if (!state?.run) continue;
    for (const ambush of def.ambushes) {
      out.set(ambush.mobId, (out.get(ambush.mobId) ?? 0) + ambush.count);
    }
    // The escortee itself is a live mob while the run walks.
    out.set(def.npcMobId, (out.get(def.npcMobId) ?? 0) + 1);
  }
  return out;
}

/** Escortees stand idle in the world between runs; that is authored, not a leak. */
function idleEscorteeAllowance(): Map<string, number> {
  const out = new Map<string, number>();
  for (const def of Object.values(ESCORTS)) {
    out.set(def.npcMobId, (out.get(def.npcMobId) ?? 0) + 1);
  }
  return out;
}

/** The Eastbrook hub practice yards stand authored practice targets permanently,
 *  spawned by sim.ts rather than CAMPS; authored the same as an idle escortee,
 *  never a leak. */
function hubPracticeAllowance(): Map<string, number> {
  return new Map([
    [HUB_TRAINING_DUMMY_ID, 1],
    [HUB_HEALING_DUMMY_ID, 1],
    [HEALING_DUMMY_TANK_ID, 1],
    [HEALING_DUMMY_SOLDIER_ID, 1],
    [HEALING_DUMMY_SCOUT_ID, 1],
    [HEALING_DUMMY_CASTER_ID, 1],
    [HEALING_DUMMY_RANGER_ID, 1],
  ]);
}

export function assertPopulationSane(sim: Sim, label: string): void {
  const authored = authoredCounts();
  const wave = activeWaveAllowance(sim);
  const idle = idleEscorteeAllowance();
  const hubPractice = hubPracticeAllowance();
  const over: string[] = [];
  for (const [templateId, live] of liveCounts(sim)) {
    const budget =
      (authored.get(templateId) ?? 0) +
      (wave.get(templateId) ?? 0) +
      (idle.get(templateId) ?? 0) +
      (hubPractice.get(templateId) ?? 0);
    if (live > budget) over.push(`${templateId}: ${live} live vs ${budget} allowed`);
  }
  expect(over, label).toEqual([]);
}

export function findByTemplate(sim: Sim, templateId: string): Entity | undefined {
  return [...sim.entities.values()].find(
    (e) => e.kind === 'mob' && e.templateId === templateId && !e.dead,
  );
}

/** One escort, run and failed twice in one Sim so accumulating survivors show. */
export function runEscortRounds(def: EscortDef): void {
  // Keep repeated runs in one Sim to expose accumulating survivors. Each
  // route has its own test budget now that every regional caravan runs.
  const sim = new Sim({
    seed: 424242,
    playerClass: 'warrior',
    playerName: 'Escorter',
    respawnSeconds: 2, // resolve "did it come back?" in seconds of sim time
  });
  sim.setPlayerLevel(20);

  let ranAtLeastOne = false;
  for (let round = 0; round < 2; round++) {
    // Previous live-world waves may have killed the observer. An escort
    // cannot start for a dead player, so restore the test actor each round.
    sim.player.dead = false;
    sim.player.hp = sim.player.maxHp;
    sim.targetEntity(null);
    if (def.worldQuestId !== undefined) {
      const meta = sim.meta(sim.playerId);
      if (!meta) throw new Error('Missing player metadata');
      meta.devWorldQuestCycle = worldQuestCycleOfferingQuest('wq3_0', def.worldQuestId);
      const start = sim.groundPos(def.start.x, def.start.z);
      sim.player.pos = { ...start };
      sim.player.prevPos = { ...start };
      sim.tick();
    } else {
      sim.questLog.set(def.questId, { questId: def.questId, counts: [0], state: 'active' });
    }
    const escortee = findByTemplate(sim, def.npcMobId);
    if (!escortee) continue; // not yet respawned; the next escort still runs
    const pos = sim.groundPos(escortee.pos.x, escortee.pos.z + 2);
    sim.player.pos = { ...pos };
    sim.player.prevPos = { ...pos };
    sim.interact();
    if (!sim.escortRuns.get(def.id)?.run) continue;
    ranAtLeastOne = true;

    // Walk until the first wave spawns, then kill all of it.
    let ids: number[] = [];
    for (let i = 0; i < 60 * 20 && ids.length === 0; i++) {
      sim.tick();
      ids = [...(sim.escortRuns.get(def.id)?.run?.ambushIds ?? [])];
    }
    for (const id of ids) {
      const mob = sim.entities.get(id);
      if (mob) sim.dealDamage(null, mob, mob.hp, false, 'physical', null, 'hit');
    }
    // Fail the run so the escortee cycles and the next round can start.
    const walker = findByTemplate(sim, def.npcMobId);
    if (walker) sim.dealDamage(null, walker, walker.hp, false, 'physical', null, 'hit');
    for (let i = 0; i < 50 * 20; i++) sim.tick();

    assertPopulationSane(sim, `${def.id} round ${round + 1}`);
  }
  expect(ranAtLeastOne, 'no escort actually ran, so this proved nothing').toBe(true);
}
