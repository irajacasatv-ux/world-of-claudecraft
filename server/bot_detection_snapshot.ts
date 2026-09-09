// The per-tick runtime pose the bot detector reads beside a session's own input
// history: where the character stands, which instance slot it stands in, and the
// combat and resource state at that instant. Moved WHOLE out of server/game.ts
// (GameServer.captureBotDetectionSnapshot, body unchanged apart from the
// receiver) to heal the monolith ratchet; the one caller is
// GameServer.runAntibotTick.
//
// Pure over the Sim's read-only entity and instance lookups: nothing here
// mutates, and the detector never sees a ClientSession, only the pid the
// coordinator hands in.

import type { Sim } from '../src/sim/sim';
import type { SessionRuntimeSnapshot } from './bot_detector/contract';

/** The three Sim reads this projection makes, and nothing else. */
export type BotDetectionSnapshotSim = Pick<Sim, 'entities' | 'instanceInfoAt' | 'time'>;

/**
 * Null when the pid has no live entity (a session mid-join or mid-leave): the
 * detector reads a missing snapshot as "no runtime evidence this tick" rather
 * than as a zeroed pose, so an absent entity can never look like a motionless
 * one.
 *
 * capturedAt is the HOST clock the caller stamped; simTime is the sim clock.
 * They are different clocks and both ride the snapshot on purpose.
 */
export function botDetectionSnapshotFor(
  sim: BotDetectionSnapshotSim,
  pid: number,
  capturedAt: number,
): SessionRuntimeSnapshot | null {
  const e = sim.entities.get(pid);
  if (!e) return null;
  const instance = sim.instanceInfoAt(e.pos);
  return {
    capturedAt,
    simTime: sim.time,
    x: e.pos.x,
    z: e.pos.z,
    facing: e.facing,
    dead: e.dead,
    inCombat: e.inCombat,
    targetId: e.targetId,
    instanceSlot: instance?.slot ?? null,
    instanceDungeonId: instance?.dungeonId ?? null,
    level: e.level,
    classId: e.templateId,
    hp: e.hp,
    maxHp: e.maxHp,
    resource: e.resource,
    maxResource: e.maxResource,
    resourceType: e.resourceType,
    autoAttack: e.autoAttack,
    followTargetId: e.followTargetId,
    moveSpeed: e.moveSpeed,
    onGround: e.onGround,
  };
}
