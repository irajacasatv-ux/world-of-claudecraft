// The shared encounter setup for tests/varkhul_forge_encounter.test.ts and
// tests/varkhul_forge_encounter_adds.test.ts: a claimed Varkhul encounter and
// the raid members its cases add.

import { expect } from 'vitest';
import { VARKHUL_BOSS_ID } from '../../src/sim/encounters/varkhul';
import { IGNIVAR_SECOND_WING_ID } from '../../src/sim/ignivar_raid_ids';
import { enterDungeon } from '../../src/sim/instances/dungeons';
import { Sim } from '../../src/sim/sim';
import { type Entity, PLAYER_INTEREST_DROP_RADIUS } from '../../src/sim/types';

// One seed for every case: a seed a test file has not built yet costs its
// full-world Sim about half a second (the collider grids are built per seed),
// a seed it has already built about 20 ms. No case asserts a seed-specific draw;
// the replay cases compare two runs of the same seed.
export const FORGE_SEED = 721;

export function claimedEncounter(
  seed: number,
  heroic = false,
  engage = true,
): { sim: Sim; boss: Entity } {
  // Production's idle culling (the server and the offline client both set it):
  // the raid sits in its own instance, so the overworld's idle population is
  // out of every player's radius and skips its per-tick AI instead of costing
  // each full-world tick.
  const sim = new Sim({
    seed,
    playerClass: 'warrior',
    devCommands: true,
    idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS,
  });
  expect(enterDungeon(sim.ctx, IGNIVAR_SECOND_WING_ID, sim.player.id, true)).toBe(true);
  const instance = sim.instances.find((entry) => entry.dungeonId === IGNIVAR_SECOND_WING_ID);
  if (!instance) throw new Error('Inner Crucible did not claim an instance');
  instance.difficulty = heroic ? 'heroic' : 'normal';
  const boss = instance.mobIds
    .map((id) => sim.entities.get(id))
    .find((entity) => entity?.templateId === VARKHUL_BOSS_ID);
  if (!boss) throw new Error('Inner Crucible did not spawn Varkhul');
  sim.player.damageImmune = true;
  if (engage) {
    boss.inCombat = true;
    boss.aiState = 'attack';
    boss.aggroTargetId = sim.player.id;
    boss.swingTimer = 999;
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    sim.player.prevPos = { ...sim.player.pos };
  }
  const meta = sim.players.get(sim.playerId);
  if (!meta) throw new Error('Local player metadata missing');
  meta.talentMods.role = 'tank';
  return { sim, boss };
}

export function addTank(sim: Sim, boss: Entity, name: string): Entity {
  return addEncounterPlayer(sim, boss, name, 'tank');
}

export function rekeyBoss(sim: Sim, boss: Entity, nextId: number): void {
  const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
  if (!instance) throw new Error('Varkhul instance missing');
  const mobIndex = instance.mobIds.indexOf(boss.id);
  sim.entities.delete(boss.id);
  boss.id = nextId;
  instance.mobIds[mobIndex] = nextId;
  sim.entities.set(nextId, boss);
}

export function addEncounterPlayer(
  sim: Sim,
  boss: Entity,
  name: string,
  role: 'tank' | 'healer' | 'dps' = 'dps',
): Entity {
  const pid = sim.addPlayer(
    role === 'healer' ? 'priest' : role === 'dps' ? 'mage' : 'warrior',
    name,
  );
  const meta = sim.players.get(pid);
  const player = meta ? sim.entities.get(meta.entityId) : undefined;
  if (!meta || !player) throw new Error(`${name} did not spawn`);
  meta.talentMods.role = role;
  player.damageImmune = true;
  player.pos = { x: boss.pos.x + 2, y: boss.pos.y, z: boss.pos.z - 2 };
  player.prevPos = { ...player.pos };
  return player;
}
