// The tick profiler's pure name tables, moved whole out of server/game.ts (the
// monolith ratchet): the per-family mob.update buckets, the sim.tick() lap names,
// the bcastSelf key-group buckets, and the per-mob zone bucket resolver. None of
// it reads GameServer state; game.ts registers the three lists on its
// TickProfiler and re-exports every name here, so no importer re-points.

import { DUNGEON_X_THRESHOLD, zoneAt } from '../src/sim/data';
import type { Entity, MobFamily } from '../src/sim/types';
import {
  MOB_ZONE_PHASE_BY_ID,
  MOB_ZONE_PHASE_INSTANCE,
  MOB_ZONE_PHASE_OTHER,
} from './tick_perf_log';

// The mob.update sim lap is additionally bucketed by mob family so a hot family
// (a spider swarm, a pack of humanoids) shows up in the profile instead of hiding
// inside one aggregate number. Every MobFamily value (src/sim/types.ts) plus an
// 'other' catch-all for any templateId whose family does not resolve. A family
// missing from this list would derive a bucket name TickProfiler never registered
// and silently drop its timing: the satisfies clause rejects a non-family typo, and
// the registry pin test type-checks union coverage and asserts the derived names as
// literals. Exported for those pins.
export const MOB_UPDATE_BUCKETS = [
  'beast',
  'humanoid',
  'mudfin',
  'spider',
  'burrower',
  'undead',
  'troll',
  'ogre',
  'elemental',
  'dragonkin',
  'demon',
  'reptile',
  'other',
] as const satisfies readonly (MobFamily | 'other')[];
// sim.tick() internal phase names (already `sim.`-prefixed): must match the
// lap?.(...) call sites in src/sim/sim.ts tick(). Fed by the injected cfg.perfLap
// probe while a detailed capture is active (an admin capture or PERF_TICK_LOG=1).
// TickProfiler.add() silently ignores an unregistered phase, so a name drift would
// drop that timing without a trace: tests/server/tick_perf_capture.test.ts pins the
// sim's emitted phase set against this list, exported for that guard.
export const SIM_LAP_PHASES = [
  'respawns',
  'worldBosses',
  'groundAoEs',
  'frozenOrbs',
  'despawnDecay',
  'projectiles',
  'p.move',
  'p.doors',
  'p.casting',
  'p.autoAtk',
  'p.regen',
  'p.auras',
  'mob.update',
  'mob.auras',
  'ent.misc',
  // The Drakelands dragonkin brood pass (src/sim/mob/dragonkin_brood.ts):
  // egg proximity/chain/hatch, whelp upkeep, broodlord counter-stun.
  'dragonkinBrood',
  'engaged',
  'duels',
  'cardDuel',
  'arena',
  'trades',
  'lootRolls',
  'unstuck',
  'updateInstances',
  'instances',
  'delves',
  'valecup',
  'battleground',
  'worldPvp',
  'hill',
  'dfinder',
  'market',
  'postOffice',
  'delayedEv',
  // Farming's per-tick sweep (professions/farming.ts updateFarming), appended in
  // Sim.tick between delayedEv and deeds. Registered in the SAME order the tick
  // runs them: an unregistered lap is silently dropped by the profiler, not an
  // error, so a regression in it would be invisible in the capture.
  'farming',
  'deeds',
  'gridRefresh',
  // Per-family mob.update buckets, appended after the base lap names so those stay
  // byte-identical and first; the `sim.${n}` map yields the registered `sim.mob.update|<family>`.
  ...MOB_UPDATE_BUCKETS.map((b) => `mob.update|${b}`),
].map((n) => `sim.${n}`);

// Per-key-group attribution buckets for the bcastSelf phase (selfWireJson).
// HOST-DERIVED like the mob zone buckets and populated only while a detailed
// capture is active, so a production capture names WHICH self key group eats
// the budget instead of one opaque bcastSelf total: the market and corder
// incidents both hid inside that total for a whole diagnosis round each.
// Buckets are CONTIGUOUS code ranges of selfWireJson (a lap probe, the sim
// perfLap shape), not individual keys, to keep the probe to one clock read
// per boundary.
export const SELF_WIRE_PHASES = [
  'base', // wireEntity + the always-on scalar block + its stringify
  'timers', // lockouts, corpse, auras, cooldowns, node cooldowns, charges, stats, weapon
  'social', // party, marks, trade, duel, cardDuel, honor, arena
  'bg',
  'df',
  'market',
  'mail',
  'bank', // bank + bpsl + vault + cvault + guildBank (mixed postures: bisect a spike)
  'loot', // lroll, lrollg, mloot
  'delve',
  'prof', // prof, cprof, mst
  'corder',
  'craft', // enchant outcomes, town focus, gathering, tool slots, mounts, renown, title
  'heavy', // the wireRev-gated heavy block
  'assemble', // the final base-JSON + extras splice (multi-KB copy on a heavy payload)
].map((n) => `self.${n}`);

// The zone/group bucket a mob's update cost is attributed to. Pure and allocation-free
// (a cheap zoneAt band scan plus a Map lookup of an interned string).
export function mobZonePhase(mob: Entity): string {
  if (mob.pos.x > DUNGEON_X_THRESHOLD) return MOB_ZONE_PHASE_INSTANCE;
  return MOB_ZONE_PHASE_BY_ID.get(zoneAt(mob.pos.x, mob.pos.z).id) ?? MOB_ZONE_PHASE_OTHER;
}
