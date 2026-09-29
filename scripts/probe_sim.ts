// The Sim every balance probe harness builds (the owned-class, druid, hunter and warlock
// probes under scripts/): the harness's own config plus production's idle-mob distance
// cull. The live GameServer (server/sim_boot_config.ts) and the offline client
// (src/game/offline_world_config.ts) both boot with idleMobTickRadius at
// PLAYER_INTEREST_DROP_RADIUS, so an idle, ownerless, aura-free mob farther than that from
// every player skips its per-tick idle AI. A probe built here meets the world the way
// players do and pays a fraction of the unculled tick (six to nine times less per probe,
// measured 2026-09-29). The cull moves passive idle rolls onto per-mob lanes
// (src/sim/mob/idle_rng.ts), which reshapes the shared stream a probe's crits and procs
// draw from, so every band the long-sims lane pins is measured at THIS configuration.
// tests/idle_mob_tick_radius.test.ts pins the radius to both hosts and that the harnesses
// build no Sim any other way.
import { Sim } from '../src/sim/sim';
import { PLAYER_INTEREST_DROP_RADIUS, type SimConfig } from '../src/sim/types';

export const PROBE_IDLE_CULL = Object.freeze({
  idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS,
});

export function newProbeSim(config: SimConfig): Sim {
  return new Sim({ ...config, ...PROBE_IDLE_CULL });
}
