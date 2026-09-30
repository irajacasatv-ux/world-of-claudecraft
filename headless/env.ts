// The RL env's episode state: one `Env` holds one `Sim` and frames it as a
// gym-like environment (frame-skip, termination, reward). `env_server.ts` is the
// NDJSON process shell around it; this module is side-effect free, so tests can
// drive the real reset path in process.

import type { TalentAllocation } from '../src/sim/content/talents';
import { applyAction, encodeObs } from '../src/sim/obs';
import { type RewardCounters, Sim } from '../src/sim/sim';
import { MAX_LEVEL, type PlayerClass } from '../src/sim/types';
import { allocateHeadlessGathererIdentity } from './gatherer_identity';
import { ownedPetDamageForReward } from './reward_credit';

export interface EnvConfig {
  frameSkip: number; // sim ticks per env step (20 ticks = 1 second)
  maxSteps: number; // truncate episode after this many steps (0 = never)
  respawnSeconds: number;
  terminateOnDeath: boolean;
  rewards: {
    xp: number; // per xp point
    damageDealt: number;
    damageTaken: number;
    kill: number;
    death: number;
    questDone: number;
    questProgress: number;
    levelUp: number;
    timePenalty: number; // per step
  };
}

export interface EnvStepResult {
  obs: number[];
  reward: number;
  terminated: boolean;
  truncated: boolean;
  info: object;
}

export const DEFAULT_CONFIG: EnvConfig = {
  frameSkip: 5, // 4 decisions per sim-second
  // the cap is level 20 across three zones now — episodes need room to breathe
  maxSteps: 8000,
  respawnSeconds: 15,
  terminateOnDeath: false,
  rewards: {
    xp: 0.01,
    damageDealt: 0.002,
    damageTaken: -0.001,
    kill: 0.2,
    death: -5,
    questDone: 5,
    questProgress: 0.5,
    levelUp: 2,
    timePenalty: 0,
  },
};

export class Env {
  sim: Sim | null = null;
  config: EnvConfig = DEFAULT_CONFIG;
  playerClass: PlayerClass = 'warrior';
  stepCount = 0;
  prev: RewardCounters | null = null;

  reset(
    seed: number,
    playerClass: PlayerClass,
    cfg: Partial<EnvConfig> & { rewards?: Partial<EnvConfig['rewards']> },
    playerLevel = 1,
    talents?: TalentAllocation,
  ): object {
    this.config = {
      ...DEFAULT_CONFIG,
      ...cfg,
      rewards: { ...DEFAULT_CONFIG.rewards, ...(cfg.rewards ?? {}) },
    };
    this.playerClass = playerClass;
    this.sim = new Sim({
      seed,
      playerClass,
      respawnSeconds: this.config.respawnSeconds,
      autoEquip: true,
      // Housing stays live on this host too; the RL action space carries no housing
      // verb (headless/CLAUDE.md, pinned by tests/env_protocol.test.ts).
      freeholdsEnabled: true,
      idleMobTickRadius: 80,
      // Allocated by the HOST, once per episode, before the world exists. The
      // sim receives a finished value and derives nothing, so this episode
      // replays identically while two episodes (even at one seed) never share a
      // gatherer record.
      gathererIdentity: allocateHeadlessGathererIdentity(),
    });
    // RL episodes deliberately have no wall calendar: resetDay stays empty, so
    // calendar-window systems (including rotating World Quests) remain dormant
    // instead of making a seeded episode depend on the machine's date or zone.
    if (playerLevel !== 1) this.sim.setPlayerLevel(playerLevel);
    if (talents && !this.sim.applyTalents(talents)) throw new Error('invalid talents');
    this.stepCount = 0;
    this.prev = { ...this.sim.counters };
    return { obs: encodeObs(this.sim), info: this.infoDict() };
  }

  step(action: number): EnvStepResult {
    if (!this.sim || !this.prev) throw new Error('call reset first');
    const sim = this.sim;
    applyAction(sim, action);
    let ownedPetDamage = 0;
    for (let i = 0; i < this.config.frameSkip; i++) {
      ownedPetDamage += ownedPetDamageForReward(sim.tick(), sim.entities, sim.playerId);
    }
    this.stepCount++;

    const c = sim.counters;
    const r = this.config.rewards;
    const reward =
      (c.xpGained - this.prev.xpGained) * r.xp +
      (c.damageDealt - this.prev.damageDealt + ownedPetDamage) * r.damageDealt +
      (c.damageTaken - this.prev.damageTaken) * r.damageTaken +
      (c.kills - this.prev.kills) * r.kill +
      (c.deaths - this.prev.deaths) * r.death +
      (c.questsCompleted - this.prev.questsCompleted) * r.questDone +
      (c.questProgress - this.prev.questProgress) * r.questProgress +
      (c.levelUps - this.prev.levelUps) * r.levelUp +
      r.timePenalty;
    const died = c.deaths > this.prev.deaths;
    this.prev = { ...c };

    const terminated = (this.config.terminateOnDeath && died) || sim.player.level >= MAX_LEVEL;
    const truncated = this.config.maxSteps > 0 && this.stepCount >= this.config.maxSteps;

    return {
      obs: encodeObs(sim),
      reward,
      terminated,
      truncated,
      info: this.infoDict(),
    };
  }

  infoDict(): object {
    const sim = this.sim!;
    return {
      level: sim.player.level,
      xp: sim.xp,
      hp: sim.player.hp,
      kills: sim.counters.kills,
      deaths: sim.counters.deaths,
      quests_done: sim.counters.questsCompleted,
      copper: sim.copper,
      step: this.stepCount,
    };
  }
}
