// World PvP zone policy: what the ground under a player says about open-world
// fighting. Three answers, read off the zone record (`ZoneDef.worldPvp`,
// data-as-code in src/sim/content/<zone>.ts):
//
// - 'sanctuary': no world PvP at all, flagged or not. The Proving Shore (the
//   tutorial island) and Eastbrook Vale (the starter zone and its town), so a
//   new character can never be fought before they know what the flag is.
// - 'ffa': free-for-all. Everyone standing in the zone can attack everyone else
//   there who is not in their party or raid, flag or no flag. The three
//   northernmost zones, the top row of the map (owner pick): the Drakelands,
//   the Frostveil Reach and the Amberfall.
//   Attacking an UNFLAGGED player here marks the attacker (world_pvp.ts).
// - 'contested': everywhere else. The mutual-flag rule and nothing more.
//
// The lookup is the strict rectangle containment (data.ts zoneContaining), so
// the far-east instance plane (dungeons, delves, the arena and battleground
// floors) reads as 'contested' rather than as whichever overworld zone the
// clamping zoneAt would misreport: an instance is under its own mode's rules
// (world_pvp.ts inInstancedPvp) and the open-world policy must never leak in.
// The one instance family with a rule of its own here is a freehold room (an
// owner-claimed DungeonDef, `claimKey: 'owner'`): a home is never World PvP
// ground, so its band reads as a sanctuary (tests/freehold_world_pvp_sanctuary).
//
// Pure and host-agnostic: the sim's hostility arm, the renderer's nameplate
// colour and the HUD's target frame all read the same verdict for the same
// coordinates. No SimContext, no rng, no clock.

import { dungeonAt, ZONES, zoneContaining } from '../data';
import type { ZoneDef } from '../types';
import type { WorldPvpZonePolicy } from './world_pvp_rules';

/** The policy a zone record declares; a record with no `worldPvp` field, or no
 *  zone at all (the instance plane), is contested. */
export function worldPvpZonePolicyOf(zone: ZoneDef | null | undefined): WorldPvpZonePolicy {
  return zone?.worldPvp ?? 'contested';
}

/** The policy at a world position; a freehold room's band is a sanctuary. */
export function worldPvpZonePolicyAt(x: number, z: number): WorldPvpZonePolicy {
  if (dungeonAt(x)?.claimKey === 'owner') return 'sanctuary';
  return worldPvpZonePolicyOf(zoneContaining(x, z));
}

/** The free-for-all zones, in table order (the King of the Hill picks among
 *  them, src/sim/pvp/hill.ts). Reads the static table like the lookup above. */
export function worldPvpFfaZones(): ZoneDef[] {
  return ZONES.filter((zone) => zone.worldPvp === 'ffa');
}
