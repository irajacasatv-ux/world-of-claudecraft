// A freehold room is never World PvP ground. The release's /pvp flag
// (src/sim/pvp/world_pvp.ts) reads the ground under each player through
// worldPvpZonePolicyAt, and the far-east instance plane reads as contested
// there, so before the v0.44.0 re-sync composed the two features, two flagged
// players sharing an owner-claimed room (two characters of one account today,
// visitors once they land) could fight inside a home. The room now reads as a
// sanctuary through the ONE lookup the sim's hostility arm and the client's
// verdict (src/ui/pvp_hostile_core.ts: nameplate colour, target frame,
// auto-attack gate) both call, so the two can never disagree. Every other
// instance keeps the release's contested reading, which the control arms pin.
import { describe, expect, it } from 'vitest';
import {
  BUILTIN_WORLD,
  DUNGEON_LIST,
  INSTANCE_SLOT_COUNT,
  instanceOrigin,
  ZONES,
} from '../src/sim/data';
import {
  WORLD_PVP_SANCTUARY_LINE,
  WORLD_PVP_TOGGLE_COOLDOWN,
  worldPvpOnPlayerAided,
  worldPvpOnPlayerDamaged,
} from '../src/sim/pvp/world_pvp';
import { worldPvpZonePolicyAt } from '../src/sim/pvp/world_pvp_zones';
import { Sim } from '../src/sim/sim';
import type { DungeonDef, Entity, SimEvent, WorldContent } from '../src/sim/types';
import { isPvpHostilePlayer, type PvpHostileWorld } from '../src/ui/pvp_hostile_core';

const OWNER_ROOMS = DUNGEON_LIST.filter((def) => def.claimKey === 'owner');
const PARTY_DUNGEONS = DUNGEON_LIST.filter((def) => def.claimKey !== 'owner');

// The world_pvp.test.ts fixture shape: no camps, NPCs or props, so a flagged
// pair on open contested ground is the whole scene.
const EMPTY_WORLD: WorldContent = { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] };
const CONTESTED = { x: 60, z: 700 }; // Thornpeak Heights open ground (world_pvp.test.ts)

function roomSpot(def: DungeonDef, slot = 0): { x: number; z: number } {
  return instanceOrigin(def.index, slot);
}

function standAt(e: Entity, spot: { x: number; z: number }, dx = 0): void {
  e.pos = { x: spot.x + dx, y: 0, z: spot.z };
  e.prevPos = { ...e.pos };
}

function ent(sim: Sim, pid: number): Entity {
  const e = sim.entities.get(pid);
  if (!e) throw new Error(`no entity ${pid}`);
  return e;
}

/** Two level-20 characters flagged on contested ground, hostile to each other. */
function flaggedPair(): { sim: Sim; a: Entity; b: Entity } {
  const sim = new Sim({ seed: 7, playerClass: 'warrior', noPlayer: true, world: EMPTY_WORLD });
  const pids = ['Aleph', 'Bet'].map((name) => {
    const pid = sim.addPlayer('warrior', name);
    sim.setPlayerLevel(20, pid);
    standAt(ent(sim, pid), CONTESTED, pid);
    return pid;
  });
  for (const pid of pids) {
    (sim as unknown as { time: number }).time += WORLD_PVP_TOGGLE_COOLDOWN + 1;
    sim.tick();
    sim.setWorldPvpFlag(true, pid);
  }
  const [a, b] = pids.map((pid) => ent(sim, pid));
  expect(a.pvpFlag && b.pvpFlag).toBe(true);
  expect(sim.isHostileTo(a, b)).toBe(true);
  return { sim, a, b };
}

describe('the World PvP ground under a freehold room', () => {
  it('the owner-claim family is the two freehold rooms, beside real party dungeons', () => {
    expect(OWNER_ROOMS.map((def) => def.id)).toEqual(['freehold_inn_room', 'freehold_cottage']);
    expect(PARTY_DUNGEONS.length).toBeGreaterThan(0);
  });

  it('reads as a sanctuary in every slot of every owner room', () => {
    for (const def of OWNER_ROOMS) {
      for (let slot = 0; slot < INSTANCE_SLOT_COUNT; slot++) {
        const { x, z } = roomSpot(def, slot);
        expect(worldPvpZonePolicyAt(x, z), `${def.id} slot ${slot}`).toBe('sanctuary');
        // Anywhere inside the room's band, not only its origin.
        expect(worldPvpZonePolicyAt(x - 250, z + 40), `${def.id} slot ${slot} west`).toBe(
          'sanctuary',
        );
        expect(worldPvpZonePolicyAt(x + 250, z - 40), `${def.id} slot ${slot} east`).toBe(
          'sanctuary',
        );
      }
    }
  });

  it('every other instance keeps the release reading: contested', () => {
    for (const def of PARTY_DUNGEONS) {
      const { x, z } = roomSpot(def);
      expect(worldPvpZonePolicyAt(x, z), def.id).toBe('contested');
    }
  });

  it('leaves the overworld zones exactly as their records declare', () => {
    for (const zone of ZONES) {
      const expected = zone.worldPvp ?? 'contested';
      expect(worldPvpZonePolicyAt(zone.hub.x, zone.hub.z), zone.id).toBe(expected);
      expect(worldPvpZonePolicyAt(zone.graveyard.x, zone.graveyard.z), zone.id).toBe(expected);
    }
  });
});

describe('two flagged players inside a freehold room (the sim hostility arm)', () => {
  it('are not hostile in either owner room, in either direction', () => {
    for (const room of OWNER_ROOMS) {
      const { sim, a, b } = flaggedPair();
      standAt(a, roomSpot(room), 0);
      standAt(b, roomSpot(room), 2);
      expect(sim.isHostileTo(a, b), `${room.id} a->b`).toBe(false);
      expect(sim.isHostileTo(b, a), `${room.id} b->a`).toBe(false);
    }
  });

  it('the room also shelters a player whose attacker stands outside it', () => {
    const { sim, a, b } = flaggedPair();
    standAt(b, roomSpot(OWNER_ROOMS[0]));
    expect(sim.isHostileTo(a, b)).toBe(false);
    expect(sim.isHostileTo(b, a)).toBe(false);
  });

  it('control: the same pair inside a party dungeon stays hostile', () => {
    const { sim, a, b } = flaggedPair();
    const dungeon = PARTY_DUNGEONS[0];
    standAt(a, roomSpot(dungeon), 0);
    standAt(b, roomSpot(dungeon), 2);
    expect(sim.isHostileTo(a, b)).toBe(true);
  });
});

describe('the other readers of the ground agree inside a room', () => {
  it('the self readout names the room a sanctuary', () => {
    const { sim, a } = flaggedPair();
    expect(sim.worldPvpInfoFor(a.id)?.zone).toBe('contested');
    standAt(a, roomSpot(OWNER_ROOMS[0]));
    expect(sim.worldPvpInfoFor(a.id)?.zone).toBe('sanctuary');
  });

  it('a flagged player arriving from contested ground hears the sanctuary line', () => {
    const { sim, a } = flaggedPair();
    for (let i = 0; i < 20; i++) sim.tick();
    standAt(a, roomSpot(OWNER_ROOMS[0]));
    const heard: string[] = [];
    for (let i = 0; i < 20; i++) {
      for (const ev of sim.tick() as SimEvent[]) {
        if ((ev.type === 'log' || ev.type === 'error') && ev.pid === a.id) heard.push(ev.text);
      }
    }
    expect(heard).toContain(WORLD_PVP_SANCTUARY_LINE);
  });

  it('aid given inside a room never flags the healer; the same aid outside does', () => {
    for (const inRoom of [true, false]) {
      const { sim, a, b } = flaggedPair();
      const healerPid = sim.addPlayer('priest', 'Gimel');
      sim.setPlayerLevel(20, healerPid);
      const healer = ent(sim, healerPid);
      standAt(healer, CONTESTED, 4);
      // A world fight in progress on contested ground: the pair traded blows.
      worldPvpOnPlayerDamaged(sim.ctx, b, a);
      worldPvpOnPlayerDamaged(sim.ctx, a, b);
      if (inRoom) {
        standAt(a, roomSpot(OWNER_ROOMS[0]), 0);
        standAt(healer, roomSpot(OWNER_ROOMS[0]), 2);
      }
      worldPvpOnPlayerAided(sim.ctx, a, healer);
      expect(healer.pvpFlag === true, inRoom ? 'in room' : 'outside').toBe(!inRoom);
    }
  });
});

describe('the client verdict agrees (src/ui/pvp_hostile_core.ts)', () => {
  function clientWorld(self: Entity, target: Entity): PvpHostileWorld {
    return {
      playerId: self.id,
      entities: new Map([
        [self.id, self],
        [target.id, target],
      ]),
      duelInfo: null,
      arenaInfo: null,
      bgInfo: null,
      partyInfo: null,
      worldPvpInfo: null,
    } as unknown as PvpHostileWorld;
  }

  it('a flagged stranger in the same freehold room is never red; in a party dungeon it is', () => {
    const { a, b } = flaggedPair();
    standAt(a, roomSpot(OWNER_ROOMS[0]), 0);
    standAt(b, roomSpot(OWNER_ROOMS[0]), 2);
    expect(isPvpHostilePlayer(clientWorld(a, b), b)).toBe(false);
    standAt(a, roomSpot(PARTY_DUNGEONS[0]), 0);
    standAt(b, roomSpot(PARTY_DUNGEONS[0]), 2);
    expect(isPvpHostilePlayer(clientWorld(a, b), b)).toBe(true);
  });
});
