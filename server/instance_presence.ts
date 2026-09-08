// Public instance location metadata for social presence and community relays.
// Resolve explicit dungeon ids first, then delve and dungeon positions. Callers
// can pass a spectator's saved position instead of the parked live entity pose.
import {
  DUNGEON_X_THRESHOLD,
  DUNGEONS,
  delveAt,
  dungeonAt,
  isDelvePos,
  zoneAt,
} from '../src/sim/data';
import type { Entity } from '../src/sim/types';

type PresenceEntity = Pick<Entity, 'dungeonId' | 'pos'>;
type Position = Pick<Entity['pos'], 'x' | 'z'>;

export interface InstancePresence {
  zone: string;
  status: 'dungeon' | 'freehold';
}

export function instancePresenceFor(
  e: PresenceEntity,
  pos: Position = e.pos,
): InstancePresence | null {
  if (e.dungeonId) {
    const dungeon = DUNGEONS[e.dungeonId];
    return {
      zone: dungeon?.name ?? e.dungeonId,
      status: dungeon?.claimKey === 'owner' ? 'freehold' : 'dungeon',
    };
  }
  if (isDelvePos(pos.x)) {
    const delve = delveAt(pos.x);
    return delve ? { zone: delve.name, status: 'dungeon' } : null;
  }
  if (pos.x > DUNGEON_X_THRESHOLD) {
    const dungeon = dungeonAt(pos.x);
    return dungeon
      ? { zone: dungeon.name, status: dungeon.claimKey === 'owner' ? 'freehold' : 'dungeon' }
      : null;
  }
  return null;
}

// Relays expose only the public location category for owner rooms, never a
// claim key, owner id, or private home name. Ordinary instance labels stay intact.
export function relayZoneFor(e: PresenceEntity, pos: Position = e.pos): string {
  const instance = instancePresenceFor(e, pos);
  if (instance?.status === 'freehold') return 'Freehold';
  return instance?.zone ?? zoneAt(pos.x, pos.z).name;
}
