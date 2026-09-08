// The admin live-sessions location resolver: where a connected player's
// entity is (a dungeon, a delve, or the overworld with its nearest POI), as
// the admin dashboard's live-players table shows it. Moved whole from
// server/game.ts (liveLocationFor and its AdminLiveLocation shape) to heal the
// monolith ratchet; the one caller is GameServer.liveSessions. Pure over the
// Sim's read-only instance and delve lookups and the static zone tables:
// nothing here mutates.

import { DELVES, DUNGEONS, zoneAt } from '../src/sim/data';
import type { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';
import { round2 } from './tick_perf_log';

/** The nearest-POI label radius (yards): farther than this from every POI reads as none. */
const ADMIN_LOCATION_POI_RADIUS = 32;

export interface AdminLiveLocation {
  kind: 'overworld' | 'dungeon' | 'freehold' | 'delve';
  zoneId: string | null;
  zone: string;
  instanceId: string | null;
  instance: string | null;
  instanceSlot: number | null;
  poiIndex: number | null;
  poi: string | null;
  poiDistance: number | null;
}

export function liveLocationFor(sim: Sim, e: Entity): AdminLiveLocation {
  const instance = sim.instanceInfoAt(e.pos);
  const dungeonId = e.dungeonId ?? instance?.dungeonId ?? null;
  if (dungeonId) {
    const dungeon = DUNGEONS[dungeonId];
    const zone = dungeon ? zoneAt(dungeon.doorPos.x, dungeon.doorPos.z) : zoneAt(e.pos.x, e.pos.z);
    return {
      kind: dungeon?.claimKey === 'owner' ? 'freehold' : 'dungeon',
      zoneId: zone.id,
      zone: zone.name,
      instanceId: dungeonId,
      instance: dungeon?.name ?? dungeonId,
      instanceSlot: instance?.slot ?? null,
      poiIndex: null,
      poi: null,
      poiDistance: null,
    };
  }

  const delveRun = sim.delveRunForPlayer(e.id);
  if (delveRun) {
    const delve = DELVES[delveRun.delveId];
    const zone = delve ? zoneAt(delve.doorPos.x, delve.doorPos.z) : zoneAt(e.pos.x, e.pos.z);
    return {
      kind: 'delve',
      zoneId: zone.id,
      zone: zone.name,
      instanceId: delveRun.delveId,
      instance: delve?.name ?? delveRun.delveId,
      instanceSlot: delveRun.slot,
      poiIndex: null,
      poi: null,
      poiDistance: null,
    };
  }

  const zone = zoneAt(e.pos.x, e.pos.z);
  let bestIndex: number | null = null;
  let bestDistance = ADMIN_LOCATION_POI_RADIUS;
  for (let i = 0; i < zone.pois.length; i++) {
    const poi = zone.pois[i];
    const distance = Math.hypot(e.pos.x - poi.x, e.pos.z - poi.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  const poi = bestIndex === null ? null : zone.pois[bestIndex];
  return {
    kind: 'overworld',
    zoneId: zone.id,
    zone: zone.name,
    instanceId: null,
    instance: null,
    instanceSlot: null,
    poiIndex: bestIndex,
    poi: poi?.label ?? null,
    poiDistance: poi ? round2(bestDistance) : null,
  };
}
