// Env gate for the whole Freeholds (player housing) surface. The REST status
// read (server/freehold_routes.ts), the ten wire commands
// (server/freehold_wire.ts), and the realm Sim's boot config
// (server/sim_boot_config.ts) all resolve enabled-ness through this one
// function. The wire predicate and the status route call it LIVE per verdict
// and per request (the server/steam/config.ts shape), so tests and ops
// toggles never fight a captured value there. The realm Sim's boot config is
// the one consumer that snapshots it: buildRealmSimConfig runs once at boot,
// so SimConfig.freeholdsEnabled freezes the boot-time answer and a running
// realm needs a restart to pick up a flag change (flipping the env on a live
// realm opens the wire and the route while the Sim stays dark; DEPLOY.md
// says so).
//
// DEFAULT OFF, by rule: FREEHOLDS_ENABLED must be exactly '1' (the strict
// opt-in convention of ALLOW_DEV_COMMANDS and RIFT_FORGE_ENABLED; "true",
// "yes", " 1" and every other value keep the realm dark). Production never
// enables it before the release gates in docs/freeholds/state.md "Tracked
// release and handoff gates" are signed. Until then a dark realm answers
// freehold.disabled on the route, refuses every housing frame at dispatch, and
// boots a Sim with freeholdsEnabled false (D85) so no housing spawn reaches a
// player while the item and layout data still merge. The offline browser
// world and the headless RL env stay live: this gate is the server boundary
// only (D3).

/** True when the Freeholds surface is live on this realm (FREEHOLDS_ENABLED=1). */
export function freeholdsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.FREEHOLDS_ENABLED === '1';
}
