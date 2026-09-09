// server/bot_detection_snapshot.ts: the per-tick runtime pose the bot detector
// reads, extracted whole from server/game.ts to pay for the freehold
// persistence wiring. The move was verbatim, so this suite guards the module at
// its OWN seam from here on: the null arm for a pid with no live entity, the
// two instance arms, the two DIFFERENT clocks it carries (the host stamp and
// the sim clock, which have been confused before), and field completeness
// against the detector's own contract, so a dropped field thins the evidence
// loudly instead of silently. The game.ts side is pinned too: the coordinator
// imports the helper and declares none of it, so a merge that re-inlines a copy
// reds here by name.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  type BotDetectionSnapshotSim,
  botDetectionSnapshotFor,
} from '../../server/bot_detection_snapshot';
import type { SessionRuntimeSnapshot } from '../../server/bot_detector/contract';

/** Strip block and line comments (keeping a `://` in a URL intact) before a
 *  source scan counts anything, so prose describing a call cannot satisfy it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Every field of the contract, written FRESH here as literals rather than
 *  derived from the module under guard: a coordinated rename that dropped a
 *  field from both sides would slide past a derived list. */
const SNAPSHOT_FIELDS = [
  'autoAttack',
  'capturedAt',
  'classId',
  'dead',
  'facing',
  'followTargetId',
  'hp',
  'inCombat',
  'instanceDungeonId',
  'instanceSlot',
  'level',
  'maxHp',
  'maxResource',
  'moveSpeed',
  'onGround',
  'resource',
  'resourceType',
  'simTime',
  'targetId',
  'x',
  'z',
] as const;

interface FakeEntity {
  pos: { x: number; y: number; z: number };
  facing: number;
  dead: boolean;
  inCombat: boolean;
  targetId: number | null;
  level: number;
  templateId: string;
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  resourceType: string | null;
  autoAttack: boolean;
  followTargetId: number | null;
  moveSpeed: number;
  onGround: boolean;
}

function entity(overrides: Partial<FakeEntity> = {}): FakeEntity {
  return {
    pos: { x: 11.5, y: 2, z: -37.25 },
    facing: 1.75,
    dead: false,
    inCombat: true,
    targetId: 42,
    level: 37,
    templateId: 'warrior',
    hp: 900,
    maxHp: 1200,
    resource: 45,
    maxResource: 100,
    resourceType: 'rage',
    autoAttack: true,
    followTargetId: null,
    moveSpeed: 7.5,
    onGround: true,
    ...overrides,
  };
}

function fakeSim(opts: {
  entities?: Map<number, FakeEntity>;
  instance?: { slot: number; dungeonId: string } | null;
  time?: number;
}): { sim: BotDetectionSnapshotSim; instanceCalls: Array<{ x: number; z: number }> } {
  const instanceCalls: Array<{ x: number; z: number }> = [];
  const sim = {
    entities: opts.entities ?? new Map<number, FakeEntity>(),
    time: opts.time ?? 512.25,
    instanceInfoAt(pos: { x: number; z: number }) {
      instanceCalls.push({ x: pos.x, z: pos.z });
      return opts.instance ?? null;
    },
  } as unknown as BotDetectionSnapshotSim;
  return { sim, instanceCalls };
}

describe('botDetectionSnapshotFor', () => {
  it('answers null for a pid with no live entity, and never asks the instance index', () => {
    const { sim, instanceCalls } = fakeSim({ entities: new Map() });
    expect(botDetectionSnapshotFor(sim, 7, 1_000)).toBeNull();
    // A missing entity is "no runtime evidence this tick", so the projection
    // must not fabricate a pose OR pay for the instance lookup.
    expect(instanceCalls).toEqual([]);
  });

  it('carries the entity pose and the instance slot when the position is inside one', () => {
    const e = entity();
    const { sim, instanceCalls } = fakeSim({
      entities: new Map([[7, e]]),
      instance: { slot: 3, dungeonId: 'freehold_cottage' },
    });
    const out = botDetectionSnapshotFor(sim, 7, 1_000) as SessionRuntimeSnapshot;
    expect(out.instanceSlot).toBe(3);
    expect(out.instanceDungeonId).toBe('freehold_cottage');
    expect(out.x).toBe(11.5);
    expect(out.z).toBe(-37.25);
    // The lookup uses the entity's own position, not the caller's.
    expect(instanceCalls).toEqual([{ x: 11.5, z: -37.25 }]);
  });

  it('answers both instance fields null in the open world', () => {
    const { sim } = fakeSim({ entities: new Map([[7, entity()]]), instance: null });
    const out = botDetectionSnapshotFor(sim, 7, 1_000) as SessionRuntimeSnapshot;
    expect(out.instanceSlot).toBeNull();
    expect(out.instanceDungeonId).toBeNull();
  });

  it('keeps the host stamp and the sim clock apart', () => {
    // Two DIFFERENT clocks: capturedAt is the host wall clock the caller
    // stamped, simTime is the sim's own tick clock. Driven with values that
    // cannot be confused for one another.
    const { sim } = fakeSim({ entities: new Map([[7, entity()]]), time: 512.25 });
    const out = botDetectionSnapshotFor(sim, 7, 1_700_000_000_000) as SessionRuntimeSnapshot;
    expect(out.capturedAt).toBe(1_700_000_000_000);
    expect(out.simTime).toBe(512.25);
    expect(out.capturedAt).not.toBe(out.simTime);
  });

  it('projects every contract field and adds none', () => {
    const { sim } = fakeSim({
      entities: new Map([[7, entity({ dead: true, targetId: null, resourceType: null })]]),
      instance: { slot: 0, dungeonId: 'jail' },
    });
    const out = botDetectionSnapshotFor(sim, 7, 1_000) as SessionRuntimeSnapshot;
    expect(Object.keys(out).sort()).toEqual([...SNAPSHOT_FIELDS]);
    // The three nullable arms really carry null rather than a coerced default.
    expect(out.dead).toBe(true);
    expect(out.targetId).toBeNull();
    expect(out.resourceType).toBeNull();
  });

  it('reads the entity fresh on every call (no memo across a moving pose)', () => {
    const e = entity();
    const { sim } = fakeSim({ entities: new Map([[7, e]]) });
    const first = botDetectionSnapshotFor(sim, 7, 1) as SessionRuntimeSnapshot;
    e.pos.x = 99.5;
    e.inCombat = false;
    const second = botDetectionSnapshotFor(sim, 7, 2) as SessionRuntimeSnapshot;
    expect(first.x).toBe(11.5);
    expect(second.x).toBe(99.5);
    expect(second.inCombat).toBe(false);
  });
});

describe('the game.ts side of the extraction', () => {
  it('imports the helper, calls it with the pid, and declares none of it itself', () => {
    const game = codeOnly(
      readFileSync(new URL('../../server/game.ts', import.meta.url), 'utf8'),
    ).replace(/\s+/g, ' ');
    expect(game).toContain("import { botDetectionSnapshotFor } from './bot_detection_snapshot';");
    // The coordinator still consumes it (a dead import would let a re-inlined
    // copy hide beside it), and hands the pid rather than the session.
    expect(game).toContain('botDetectionSnapshotFor(this.sim, session.pid, now)');
    // And declares none of it any more.
    expect(game).not.toContain('captureBotDetectionSnapshot');
    expect(game).not.toContain('SessionRuntimeSnapshot');
  });
});
