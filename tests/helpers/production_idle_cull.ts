// Production's idle-mob distance cull, for full-world suites that tick the whole
// overworld around one player (vehicles, ferries, world quests, escorts). The live
// GameServer (server/sim_boot_config.ts) and the offline client
// (src/game/offline_world_config.ts) both boot their Sim with this radius, so an idle,
// ownerless, aura-free mob farther than it from every player skips its per-tick idle AI.
// A suite that spreads it into its SimConfig ticks the world the way players meet it and
// pays a fraction of the unculled tick; everything within the radius, every mob in
// combat or owned, and every open-world corpse (respawns included) still updates.
import { PLAYER_INTEREST_DROP_RADIUS } from '../../src/sim/types';

export const PRODUCTION_IDLE_CULL = Object.freeze({
  idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS,
});
