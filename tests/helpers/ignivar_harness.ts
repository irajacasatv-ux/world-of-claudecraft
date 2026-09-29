// The shared encounter setup for tests/ignivar_encounter.test.ts and
// tests/ignivar_encounter_tanking_lifecycle.test.ts: claimed Normal and Heroic
// encounters, raid members, Brand and conduit staging, and the forge wave trace.

import { expect } from 'vitest';
import {
  IGNIVAR_BRAND_AURA_ID,
  IGNIVAR_FORGE_WAVE_CAST_ID,
  updateIgnivarEncounter,
} from '../../src/sim/encounters/ignivar';
import { IGNIVAR_WATER_CONDUIT_TEMPLATES } from '../../src/sim/ignivar_arena';
import { detachFromDungeon, enterDungeon } from '../../src/sim/instances/dungeons';
import { Sim } from '../../src/sim/sim';
import {
  type Entity,
  IGNIVAR_BOSS_ID,
  PLAYER_INTEREST_DROP_RADIUS,
  type PlayerClass,
} from '../../src/sim/types';

// Production's idle culling (the server and the offline client both set it):
// the raid sits in its own instance, so the overworld's idle population is out
// of every player's radius and skips its per-tick AI instead of costing each
// full-world tick.
function encounterSim(seed: number): Sim {
  return new Sim({
    seed,
    playerClass: 'warrior',
    devCommands: true,
    idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS,
  });
}

// One seed for every case: a seed a test file has not built yet costs its
// full-world Sim about half a second (the collider grids are built per seed),
// a seed it has already built about 20 ms. A case that needs a seed-specific
// draw (a golden trace) passes its own seed.
export function claimedEncounter(seed = 42): {
  sim: Sim;
  boss: NonNullable<ReturnType<Sim['entities']['get']>>;
  conduit: NonNullable<ReturnType<Sim['entities']['get']>>;
} {
  const sim = encounterSim(seed);
  expect(enterDungeon(sim.ctx, 'ignivar_raid_arena', sim.player.id, true)).toBe(true);
  const boss = [...sim.entities.values()].find((e) => e.templateId === IGNIVAR_BOSS_ID);
  if (!boss) throw new Error('Ignivar did not spawn');
  const conduit = [...sim.entities.values()].find(
    (e) => e.templateId === IGNIVAR_WATER_CONDUIT_TEMPLATES.ready && e.pos.x < boss.pos.x,
  );
  if (!conduit) throw new Error('Ignivar conduit did not spawn');
  boss.inCombat = true;
  boss.aiState = 'attack';
  boss.aggroTargetId = sim.player.id;
  return { sim, boss, conduit };
}

export function claimedHeroicEncounter(seed = 42): ReturnType<typeof claimedEncounter> {
  const sim = encounterSim(seed);
  sim.setDungeonDifficulty('heroic', sim.player.id);
  expect(enterDungeon(sim.ctx, 'ignivar_raid_arena', sim.player.id, true)).toBe(true);
  const instance = sim.instances.find((entry) => entry.dungeonId === 'ignivar_raid_arena');
  expect(instance?.difficulty).toBe('heroic');
  const boss = [...sim.entities.values()].find((e) => e.templateId === IGNIVAR_BOSS_ID);
  if (!boss) throw new Error('Heroic Ignivar did not spawn');
  const conduit = [...sim.entities.values()].find(
    (e) => e.templateId === IGNIVAR_WATER_CONDUIT_TEMPLATES.ready && e.pos.x < boss.pos.x,
  );
  if (!conduit) throw new Error('Heroic Ignivar conduit did not spawn');
  boss.inCombat = true;
  boss.aiState = 'attack';
  boss.aggroTargetId = sim.player.id;
  return { sim, boss, conduit };
}

export function isolateForgeChains(
  boss: ReturnType<typeof claimedEncounter>['boss'],
  timer = 0,
): void {
  if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
  boss.ignivar.brandTimer = 999;
  boss.ignivar.forgeStrikeTimer = 999;
  boss.ignivar.frontalTimer = 999;
  boss.ignivar.skyfireTimer = 999;
  boss.ignivar.meteorTimer = 999;
  boss.ignivar.rotatingRaysTimer = 999;
  boss.ignivar.forgeWaveTimer = 999;
  boss.ignivar.soakTimer = 999;
  boss.ignivar.forgeChainsTimer = timer;
}

export function addEncounterPlayer(
  sim: Sim,
  boss: NonNullable<ReturnType<Sim['entities']['get']>>,
  name: string,
  cls: PlayerClass = 'priest',
) {
  const pid = sim.addPlayer(cls, name);
  const player = sim.entities.get(sim.players.get(pid)?.entityId ?? -1);
  if (!player) throw new Error(`${name} did not spawn`);
  player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z + 2 };
  player.prevPos = { ...player.pos };
  return player;
}

export function applyIgnivarBrand(player: Entity, boss: Entity): void {
  player.auras.push({
    id: IGNIVAR_BRAND_AURA_ID,
    name: 'Brand of the Pyre',
    kind: 'dot',
    remaining: 600,
    duration: 600,
    value: 1,
    sourceId: boss.id,
    school: 'fire',
    encounterOwned: true,
  });
}

// A mid-fight departure from the arena: the exit portal is sealed while
// Ignivar is engaged (the raid boss-fight seal, tests/ignivar_exit_routing),
// so a partner leaves through the displacement path (the battleground
// queue-pop shape): detach from the claim, then set them down at the
// reported outside door.
export function displaceOutOfArena(sim: Sim, partner: Entity): void {
  const door = detachFromDungeon(sim.ctx, partner);
  if (!door) throw new Error('partner was not inside the arena');
  partner.pos = { x: door.x, y: partner.pos.y, z: door.z };
  partner.prevPos = { ...partner.pos };
}

export function prepareConduitCleanse(sim: Sim, boss: Entity, conduit: Entity): void {
  updateIgnivarEncounter(sim.ctx, boss);
  if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
  boss.ignivar.brandTimer = 999;
  boss.ignivar.forgeStrikeTimer = 999;
  boss.ignivar.frontalTimer = 999;
  boss.ignivar.skyfireTimer = 999;
  boss.ignivar.meteorTimer = 999;
  boss.ignivar.rotatingRaysTimer = 999;
  boss.ignivar.forgeWaveTimer = 999;
  boss.ignivar.soakTimer = 999;
  boss.ignivar.forgeChainsTimer = 999;
  boss.swingTimer = 999;
  conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
  boss.ignivar.conduitTimers.north_west = 5;
}

export function forgeWaveCadenceTrace(seed: number) {
  const { sim, boss } = claimedEncounter(seed);
  const party = [
    sim.player,
    addEncounterPlayer(sim, boss, 'Cadence Two'),
    addEncounterPlayer(sim, boss, 'Cadence Three'),
    addEncounterPlayer(sim, boss, 'Cadence Four'),
  ];
  const casts: Array<{
    startTick: number;
    endTick: number;
    facingSlot: number;
    windupFrames: number;
    activeFrames: number;
  }> = [];
  let current: (typeof casts)[number] | null = null;
  let wasWave = false;
  for (let tick = 0; tick < 3_000; tick++) {
    for (const player of party) {
      player.hp = player.maxHp;
      player.dead = false;
    }
    updateIgnivarEncounter(sim.ctx, boss);
    const isWave = boss.castingAbility === IGNIVAR_FORGE_WAVE_CAST_ID;
    if (isWave && !wasWave) {
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      current = {
        startTick: tick,
        endTick: -1,
        facingSlot: Math.round(boss.ignivar.forgeWaveFacing / (Math.PI / 4)),
        windupFrames: 0,
        activeFrames: 0,
      };
      casts.push(current);
    }
    if (isWave && current) {
      if (boss.channeling) current.activeFrames++;
      else current.windupFrames++;
    }
    if (!isWave && wasWave && current) {
      current.endTick = tick;
      current = null;
      if (casts.length === 2) break;
    }
    wasWave = isWave;
  }
  return casts;
}
