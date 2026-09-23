import { runInNewContext } from 'node:vm';
import type { Page } from 'puppeteer-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  changeFreeholdToCottage,
  FREEHOLD_CAMERA_BEHIND_TOLERANCE,
  FREEHOLD_GATE_STANCE,
  FREEHOLD_ROUTE_TOLERANCE,
  freeholdGateApproachLegs,
  freeholdInteriorPerfFailures,
  holdFreeholdGateStance,
  leaveFreeholdThroughExit,
  reopenFreeholdGate,
  sampleFreeholdInterior,
  walkFreeholdRouteTo,
} from '../scripts/freehold_interior_route.mjs';
import { cameraFollowShouldSettle, updateFollowCameraYaw } from '../src/game/camera_follow';
import { EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';
import { FREEHOLD_GATE_INTERACT_RANGE } from '../src/sim/freehold/gate_rules';
import { FERRY_BELL_TOWN_LANDING } from '../src/sim/interactions/ferry_bell';
import { WORLD_SEED } from '../src/sim/world_seed';
import { collidersWithin } from './helpers/collider_gap';
import {
  cleanFreeholdPerfSamples,
  FIRST_DRAW_KINDS,
  type FreeholdPerfSampleFixture,
  gateFirstDraw,
  perfBoundary,
} from './helpers/freehold_perf_samples';

/** A Cottage sample whose counters all stand where the inn sample ended. */
function cottageAfter(counts: Record<string, number>): FreeholdPerfSampleFixture {
  const cottage = cleanFreeholdPerfSamples()[1];
  for (const edge of [cottage.sampleEvidence.begin, cottage.sampleEvidence.end])
    edge.gpuCounts = { ...counts } as typeof edge.gpuCounts;
  cottage.arrival.gpuBefore = { ...counts };
  cottage.arrival.gpuAfter = { ...counts };
  return cottage;
}

describe('accepted home reveal perf evidence', () => {
  it('requires clean samples from both distinct home destinations', () => {
    expect(freeholdInteriorPerfFailures(cleanFreeholdPerfSamples())).toEqual([]);
    expect(freeholdInteriorPerfFailures(cleanFreeholdPerfSamples().slice(0, 1))).toEqual([
      'Missing accepted interior sample: freehold-cottage',
    ]);
  });
  it('rejects cold live links and watchdog escapes independently', () => {
    const samples = cleanFreeholdPerfSamples();
    samples[0].sampleEvidence.end.gpuCounts['live-program'] = 2;
    samples[0].arrival.gpuAfter['live-program'] = 2;
    samples[0].arrival.gpuDelta['live-program'] = 2;
    samples[1] = cottageAfter(samples[0].sampleEvidence.end.gpuCounts);
    samples[1].sampleEvidence.end.gpuCounts['attach-watchdog'] = 1;
    samples[1].arrival.gpuAfter['attach-watchdog'] = 1;
    samples[1].arrival.gpuDelta['attach-watchdog'] = 1;
    expect(freeholdInteriorPerfFailures(samples)).toEqual([
      'freehold-inn-room: live-program delta 2, expected zero',
      'freehold-cottage: attach-watchdog delta 1, expected zero',
    ]);
  });
  it('does not treat absent telemetry as a passing zero', () => {
    expect(
      freeholdInteriorPerfFailures([{ label: 'freehold-inn-room' }, cleanFreeholdPerfSamples()[1]]),
    ).not.toEqual([]);
  });
});

it.each([false, true])(
  'closes actual sample evidence after the callback (late program=%s)',
  async (lateProgram) => {
    const counters = { 'live-program': 4, 'attach-watchdog': 0, 'gate-timeout': 0 };
    let frames = 10;
    const page = {
      evaluate: async () => ({ ...perfBoundary(frames++), gpuCounts: { ...counters } }),
    } as unknown as Page;
    const arrival = {
      x: 10000,
      y: 0,
      z: 0,
      facing: 0,
      dead: false,
      tick: 10,
      entryAtMs: 0,
      gpuBefore: { ...counters },
      gpuAfter: { ...counters },
      gpuDelta: { 'live-program': 0, 'attach-watchdog': 0, 'gate-timeout': 0 },
    };
    const sample = await sampleFreeholdInterior(
      page,
      'freehold-inn-room',
      arrival,
      async (_page, label) => {
        if (lateProgram) counters['live-program']++;
        return { label };
      },
    );
    const inn = { ...sample, gateFirstDraw: gateFirstDraw() };
    expect(freeholdInteriorPerfFailures([inn, cottageAfter({ ...counters })])).toEqual(
      lateProgram ? ['freehold-inn-room: live-program delta 1, expected zero'] : [],
    );
    expect(arrival.gpuDelta['live-program']).toBe(0);
  },
);

it('rejects zero rendered frames despite clean event counters', () => {
  const samples = cleanFreeholdPerfSamples();
  samples[0].sampleEvidence.end.frames = samples[0].sampleEvidence.begin.frames;
  expect(freeholdInteriorPerfFailures(samples)).toEqual([
    'freehold-inn-room: missing rendered room progress',
  ]);
});

it('rejects unavailable instrumentation and non-finite sample counters', () => {
  const samples = cleanFreeholdPerfSamples();
  samples[0].sampleEvidence.begin.instrumentationActive = false;
  samples[1].sampleEvidence.end.gpuCounts['live-program'] = Number.NaN;
  expect(freeholdInteriorPerfFailures(samples)).toEqual([
    'freehold-inn-room: missing rendered room progress',
    'freehold-cottage: missing finite live-program sample counters',
  ]);
});

it('rejects an isolated gate timeout with otherwise complete draw evidence', () => {
  const samples = cleanFreeholdPerfSamples();
  samples[1].sampleEvidence.end.gpuCounts['gate-timeout'] = 1;
  samples[1].arrival.gpuAfter['gate-timeout'] = 1;
  samples[1].arrival.gpuDelta['gate-timeout'] = 1;
  expect(freeholdInteriorPerfFailures(samples)).toEqual([
    'freehold-cottage: gate-timeout delta 1, expected zero',
  ]);
});

it.each([
  ['begin', 'frames', Number.NaN],
  ['end', 'frames', Number.POSITIVE_INFINITY],
  ['end', 'frames', 9],
  ['end', 'calls', 0],
  ['end', 'calls', Number.NaN],
  ['begin', 'atMs', Number.NaN],
  ['end', 'atMs', Number.POSITIVE_INFINITY],
  ['end', 'atMs', 200],
  ['begin', 'room', null],
  ['end', 'room', null],
  ['end', 'room', { x: 20001, z: 0 }],
  ['end', 'room', { x: 20000, z: 1 }],
] as const)('rejects independently invalid %s.%s evidence (%s)', (edge, field, value) => {
  const samples = cleanFreeholdPerfSamples();
  Object.assign(samples[0].sampleEvidence[edge], { [field]: value });
  expect(freeholdInteriorPerfFailures(samples)).toEqual([
    'freehold-inn-room: missing rendered room progress',
  ]);
});

it('derives acceptance from raw entry-through-end counters despite a stale zero delta', () => {
  const samples = cleanFreeholdPerfSamples();
  samples[0].sampleEvidence.end.gpuCounts['live-program']++;
  expect(freeholdInteriorPerfFailures(samples)).toEqual(
    expect.arrayContaining([expect.stringContaining('live-program delta 1, expected zero')]),
  );
});

it.each([
  ['entryAtMs', undefined],
  ['entryAtMs', Number.NaN],
  ['entryAtMs', 201],
  ['gpuBefore', undefined],
  ['gpuBefore', { 'live-program': Number.NaN, 'attach-watchdog': 0, 'gate-timeout': 0 }],
  ['gpuAfter', undefined],
  ['gpuAfter', { 'live-program': 1, 'attach-watchdog': 0, 'gate-timeout': 0 }],
  [
    'gpuDelta',
    { 'live-program': Number.POSITIVE_INFINITY, 'attach-watchdog': 0, 'gate-timeout': 0 },
  ],
] as const)('rejects invalid or contradictory arrival %s (%s)', (field, value) => {
  const samples = cleanFreeholdPerfSamples();
  Object.assign(samples[0].arrival, { [field]: value });
  expect(freeholdInteriorPerfFailures(samples)).not.toEqual([]);
});

it.each(['live-program', 'attach-watchdog', 'gate-timeout'] as const)(
  'rejects %s counters that decrease between entry and either sample boundary',
  (kind) => {
    const entryRegresses = cleanFreeholdPerfSamples();
    entryRegresses[0].arrival.gpuBefore[kind] = 1;
    entryRegresses[0].arrival.gpuAfter[kind] = 1;
    entryRegresses[0].sampleEvidence.end.gpuCounts[kind] = 1;
    expect(freeholdInteriorPerfFailures(entryRegresses)).not.toEqual([]);
    const sampleRegresses = cleanFreeholdPerfSamples();
    sampleRegresses[0].sampleEvidence.begin.gpuCounts[kind] = 1;
    expect(freeholdInteriorPerfFailures(sampleRegresses)).not.toEqual([]);
  },
);

it.each([
  ['begin', 'calls', Number.NaN],
  ['begin', 'room', { x: Number.NaN, z: 0 }],
  ['end', 'room', { x: 20000, z: Number.POSITIVE_INFINITY }],
  ['begin', 'graphicsPreset', 3],
  ['end', 'graphicsPreset', undefined],
  ['begin', 'rendererTier', 'high'],
  ['end', 'rendererTier', undefined],
] as const)('rejects invalid effective room evidence %s.%s (%s)', (edge, field, value) => {
  const samples = cleanFreeholdPerfSamples();
  Object.assign(samples[0].sampleEvidence[edge], { [field]: value });
  expect(freeholdInteriorPerfFailures(samples)).not.toEqual([]);
});

function inputOnlyPage(startX = 0) {
  const events: string[] = [];
  const player = { pos: { x: startX, y: 0, z: 0 }, facing: Math.PI / 2, dead: false };
  let tick = 0;
  const rejectMutation = () => {
    throw new Error('direct __game mutation');
  };
  const readonly = <T extends object>(value: T): T =>
    new Proxy(value, {
      set: rejectMutation,
      get(target, key) {
        const item = Reflect.get(target, key);
        if (typeof item === 'function') return rejectMutation;
        return item && typeof item === 'object' ? readonly(item) : item;
      },
    });
  const context = {
    window: {
      __game: readonly({
        sim: {
          player,
          get tickCount() {
            return tick++;
          },
        },
        input: {
          camYaw: Math.PI / 2,
          setTouchLook: rejectMutation,
          clearTouchMove: rejectMutation,
        },
      }),
    },
    document: { querySelector: () => null },
  };
  const run = (fn: (...args: never[]) => unknown, args: unknown[]) =>
    runInNewContext(`(${fn.toString()})(...args)`, { ...context, args });
  const page = {
    evaluate: async (fn: (...args: never[]) => unknown, ...args: unknown[]) => run(fn, args),
    waitForFunction: async (
      fn: (...args: never[]) => unknown,
      _options: unknown,
      ...args: unknown[]
    ) => {
      for (let attempt = 0; attempt < 10; attempt++) if (run(fn, args)) return;
      throw new Error('condition did not become ready');
    },
    keyboard: {
      down: async (key: string) => {
        events.push(`down:${key}`);
        if (key === 'a') player.facing = Math.PI;
        if (key === 'w') {
          if (startX > 10000) player.pos.x = 0;
          else player.pos.x = 2;
        }
      },
      up: async (key: string) => {
        events.push(`up:${key}`);
      },
    },
  } as unknown as Page;
  return { page, events };
}

it('walks using browser keyboard events with every exposed __game object read-only', async () => {
  const { page, events } = inputOnlyPage();
  await walkFreeholdRouteTo(page, 2, 0);
  expect(events).toContain('down:w');
  expect(events).toContain('up:w');
});

it('leaves through the physical exit with read-only __game observations', async () => {
  const { page, events } = inputOnlyPage(20000);
  await leaveFreeholdThroughExit(page);
  expect(events).toContain('down:w');
  expect(events).toContain('up:w');
});

describe("the gate's first-draw window and the leave back to it", () => {
  it('passes a clean window from the island to the reveal', () => {
    expect(freeholdInteriorPerfFailures(cleanFreeholdPerfSamples())).toEqual([]);
  });

  type FirstDraw = ReturnType<typeof gateFirstDraw>;
  it.each<[string, (d: FirstDraw) => FirstDraw | undefined]>([
    ['missing entirely', () => undefined],
    [
      'a view already there on the island',
      (d) => ({ ...d, begin: { ...d.begin, gateView: true } }),
    ],
    ['no view at the end', (d) => ({ ...d, end: { ...d.end, gateView: false } })],
    ['still compiling at the end', (d) => ({ ...d, end: { ...d.end, compilePending: true } })],
    ['hidden at the end', (d) => ({ ...d, end: { ...d.end, visible: false } })],
    ['an end no later than its begin', (d) => ({ ...d, end: { ...d.end, atMs: 1 } })],
    ['a begin with no clock', (d) => ({ ...d, begin: { ...d.begin, atMs: Number.NaN } })],
  ])('refuses a window with %s', (_, edit) => {
    const samples = cleanFreeholdPerfSamples();
    samples[0].gateFirstDraw = edit(gateFirstDraw());
    expect(freeholdInteriorPerfFailures(samples)).toEqual([
      'island to gate reveal: missing window from before the view to its reveal',
    ]);
  });

  it.each(FIRST_DRAW_KINDS)(
    'refuses a %s escape between the island and the gate reveal',
    (kind) => {
      const samples = cleanFreeholdPerfSamples();
      samples[0].gateFirstDraw!.end.counts[kind] = 1;
      expect(freeholdInteriorPerfFailures(samples)).toEqual([
        `island to gate reveal: ${kind} delta 1, expected zero`,
      ]);
      samples[0].gateFirstDraw!.end.counts[kind] = Number.NaN;
      expect(freeholdInteriorPerfFailures(samples)).toEqual([
        `island to gate reveal: missing finite ${kind} counters`,
      ]);
    },
  );

  it.each(['live-program', 'attach-watchdog', 'gate-timeout'] as const)(
    'refuses a %s escape between the inn sample and the Cottage entry',
    (kind) => {
      const samples = cleanFreeholdPerfSamples();
      const counts = { ...samples[0].sampleEvidence.end.gpuCounts, [kind]: 1 };
      samples[1] = cottageAfter(counts);
      expect(freeholdInteriorPerfFailures(samples)).toEqual([
        `leave to cottage: ${kind} delta 1, expected zero`,
      ]);
    },
  );
});

it('pins the capture stance literally, a yard short of the arch and four to its west', () => {
  expect(FREEHOLD_GATE_STANCE).toEqual({ dx: -4, dz: 1 });
});

// Euclidean clearance from every collider, read over a cell range (isBlocked's
// single-cell read is complete only to MAX_BODY_RADIUS, 0.8).
const APPROACH_CLEARANCE = 1.2;

it('walks legs that stay clear of every collider on the test seeds, ending on the stance', () => {
  const site = EASTBROOK_LAYOUT.services.freeholdGate.position;
  const legs = freeholdGateApproachLegs(site);
  expect(legs.at(-1)).toEqual({
    x: site.x + FREEHOLD_GATE_STANCE.dx,
    z: site.z + FREEHOLD_GATE_STANCE.dz,
  });
  const path = [{ x: FERRY_BELL_TOWN_LANDING.x, z: FERRY_BELL_TOWN_LANDING.z }, ...legs];
  let samples = 0;
  for (const seed of [1, 7, 42, 99, 1032, 1337, WORLD_SEED, 2_147_483_647])
    for (let i = 0; i + 1 < path.length; i++) {
      const [a, b] = [path[i], path[i + 1]];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25);
      for (let k = 0; k <= steps; k++) {
        const x = a.x + ((b.x - a.x) * k) / steps;
        const z = a.z + ((b.z - a.z) * k) / steps;
        samples++;
        expect(
          collidersWithin(seed, x, z, APPROACH_CLEARANCE),
          `seed ${seed} leg ${i} at ${x},${z}`,
        ).toEqual([]);
      }
    }
  expect(samples).toBeGreaterThan(8 * 200);
});

it('holds the capture stance inside the gate reach, walk tolerance included', () => {
  // walkFreeholdRouteTo stops within its default tolerance of the target, so
  // the stance plus that tolerance must still reach the gate.
  const offset = Math.hypot(FREEHOLD_GATE_STANCE.dx, FREEHOLD_GATE_STANCE.dz);
  expect(offset).toBeCloseTo(4.123, 3);
  expect(FREEHOLD_ROUTE_TOLERANCE).toBe(0.7);
  expect(offset + FREEHOLD_ROUTE_TOLERANCE).toBeLessThan(FREEHOLD_GATE_INTERACT_RANGE);
});

/** A player that moves only while keys are held, stepped at the sim's 20 Hz
 * over the (faked) wall clock, and a follow camera driven by the REAL
 * camera_follow.ts at a software renderer's 5 frames a second, so a turn
 * outruns the camera as it does under SwiftShader. A walk-key release after
 * real movement near the stance can carry the player on to `carry` yd PAST
 * the stance along its heading, and a turn release can carry the facing
 * `spin` rad on, each landing TWO ticks later: the lag a loaded machine adds
 * between a key-up and the sim settling. */
function kinematicPage(
  stance: { x: number; z: number },
  motion: {
    carry?: number;
    carries?: number;
    spin?: number;
    spins?: number;
    // The starting facing, where the camera starts relative to it, whether an
    // orbit holds it (camera_follow.ts: no follow while orbiting), and a
    // one-off knock to the camera the first time the settle keys come up.
    facing?: number;
    cameraOffset?: number;
    orbitStuck?: boolean;
    cameraKick?: number;
    mouseCamera?: boolean;
    mouselook?: boolean;
    attackMove?: boolean;
    noGate?: boolean;
  },
) {
  const events: string[] = [];
  const player = {
    pos: { x: stance.x, y: 0, z: stance.z + 5 },
    facing: motion.facing ?? Math.PI,
    dead: false,
  };
  const input = {
    camYaw: player.facing + (motion.cameraOffset ?? 0),
    isMouseCameraMode: () => motion.mouseCamera === true,
    isMouselookActive: () => motion.mouselook === true,
    isAttackMoveEnabled: () => motion.attackMove === true,
  };
  // Which page.evaluate call each synthetic key event rode in.
  let evaluateCall = 0;
  let kick = motion.cameraKick ?? 0;
  const held = new Set<string>();
  let last = Date.now();
  let tick = 0;
  let carries = motion.carries ?? 0;
  let spins = motion.spins ?? 0;
  let walkedFrom: { x: number; z: number } | null = null;
  // Lazy, as src/main.ts starts it.
  let lastInterpFacing: number | null = null;
  let simTime = 0;
  let frameTime = 0;
  const SIM_DT = 1 / 20;
  const FRAME_DT = 1 / 5;
  const pending: { atTick: number; apply: () => void }[] = [];
  const simStep = () => {
    const turn = (held.has('a') ? 1 : 0) - (held.has('d') ? 1 : 0);
    player.facing += turn * Math.PI * SIM_DT;
    const forward = (held.has('w') ? 1 : 0) - (held.has('s') ? 1 : 0);
    player.pos.x += Math.sin(player.facing) * 7 * forward * SIM_DT;
    player.pos.z += Math.cos(player.facing) * 7 * forward * SIM_DT;
  };
  const cameraFrame = () => {
    const keys = {
      forward: held.has('w'),
      back: held.has('s'),
      turnLeft: held.has('a'),
      turnRight: held.has('d'),
      strafeLeft: false,
      strafeRight: false,
    };
    const next = updateFollowCameraYaw({
      camYaw: input.camYaw,
      interpFacing: player.facing,
      frameDt: FRAME_DT,
      lastInterpFacing,
      mouselook: false,
      moving: cameraFollowShouldSettle(keys, false),
      orbiting: motion.orbitStuck === true,
    });
    input.camYaw = next.camYaw;
    lastInterpFacing = next.lastInterpFacing;
  };
  const advance = () => {
    simTime += (Date.now() - last) / 1000;
    last = Date.now();
    while (simTime >= SIM_DT) {
      simTime -= SIM_DT;
      simStep();
      frameTime += SIM_DT;
      if (frameTime >= FRAME_DT - 1e-9) {
        frameTime -= FRAME_DT;
        cameraFrame();
      }
    }
  };
  // The gate the stance is measured from, and whether its prompt opened: an F
  // press opens it only within the 5 yd reach.
  const gate = {
    templateId: 'freehold_gate',
    pos: { x: stance.x - FREEHOLD_GATE_STANCE.dx, z: stance.z - FREEHOLD_GATE_STANCE.dz },
  };
  let promptOpen = false;
  const sim = {
    entities: new Map(motion.noGate ? [] : [[9, gate]]),
    get player() {
      advance();
      return player;
    },
    get tickCount() {
      advance();
      tick++;
      for (const due of pending.filter((p) => p.atTick <= tick)) {
        due.apply();
        pending.splice(pending.indexOf(due), 1);
      }
      return tick;
    },
  };
  // The settle's synthetic key events, dispatched on window in one task.
  class KeyboardEvent {
    constructor(
      public type: string,
      public init: { code: string },
    ) {}
  }
  const dispatchEvent = (event: KeyboardEvent) => {
    advance();
    const key = event.init.code.slice(3).toLowerCase();
    events.push(`synthetic:${event.type}:${key}@${evaluateCall}`);
    if (event.type === 'keydown') held.add(key);
    else {
      held.delete(key);
      if (key === 'd' && kick !== 0) {
        input.camYaw += kick;
        kick = 0;
      }
    }
  };
  const context = {
    window: { __game: { sim, input }, dispatchEvent },
    document: { querySelector: () => null },
    KeyboardEvent,
  };
  const run = (fn: (...args: never[]) => unknown, args: unknown[]) =>
    runInNewContext(`(${fn.toString()})(...args)`, { ...context, args });
  const page = {
    evaluate: async (fn: (...args: never[]) => unknown, ...args: unknown[]) => {
      evaluateCall++;
      return run(fn, args);
    },
    waitForFunction: async (
      fn: (...args: never[]) => unknown,
      _options: unknown,
      ...args: unknown[]
    ) => {
      for (let attempt = 0; attempt < 10; attempt++) if (run(fn, args)) return;
      throw new Error('condition did not become ready');
    },
    waitForSelector: async () => {
      if (!promptOpen) throw new Error('the gate prompt never opened');
    },
    keyboard: {
      press: async (key: string) => {
        advance();
        const reach = Math.hypot(player.pos.x - gate.pos.x, player.pos.z - gate.pos.z);
        events.push(`press:${key}`);
        if (key === 'f' && reach <= FREEHOLD_GATE_INTERACT_RANGE) promptOpen = true;
      },
      down: async (key: string) => {
        advance();
        events.push(`down:${key}`);
        if (key === 'w') walkedFrom = { x: player.pos.x, z: player.pos.z };
        held.add(key);
      },
      up: async (key: string) => {
        advance();
        events.push(`up:${key}`);
        const near = Math.hypot(player.pos.x - stance.x, player.pos.z - stance.z) < 1;
        const walked =
          walkedFrom !== null &&
          Math.hypot(player.pos.x - walkedFrom.x, player.pos.z - walkedFrom.z) > 0.01;
        if (key === 'w' && held.has('w') && walked && near && carries > 0) {
          carries--;
          const [dx, dz] = [Math.sin(player.facing), Math.cos(player.facing)];
          pending.push({
            atTick: tick + 2,
            apply: () => {
              player.pos.x = stance.x + dx * (motion.carry ?? 0);
              player.pos.z = stance.z + dz * (motion.carry ?? 0);
            },
          });
        }
        // A turn spin lands only after the release that squared the player, so
        // the squaring loop has already stopped reading when it arrives.
        const squared =
          Math.abs(
            Math.atan2(Math.sin(Math.PI - player.facing), Math.cos(Math.PI - player.facing)),
          ) <= 0.12;
        if ((key === 'a' || key === 'd') && held.has(key) && near && squared && spins > 0) {
          spins--;
          pending.push({
            atTick: tick + 2,
            apply: () => {
              player.facing += motion.spin ?? 0;
            },
          });
        }
        held.delete(key);
      },
    },
  } as unknown as Page;
  const settleTicks = () => {
    for (let i = 0; i < 4; i++) void sim.tickCount;
  };
  return { page, events, player, held, settleTicks, input };
}

/** Drive a route promise on the faked clock, so CPU contention cannot stretch
 * a sleep into a different walk. */
async function onFakeClock<T>(start: () => Promise<T>): Promise<T> {
  let outcome: { value?: T; error?: unknown } | null = null;
  start().then(
    (value) => {
      outcome = { value };
    },
    (error) => {
      outcome = { error };
    },
  );
  for (let i = 0; i < 200_000 && !outcome; i++) await vi.advanceTimersByTimeAsync(5);
  const settled = outcome as { value?: T; error?: unknown } | null;
  if (!settled) throw new Error('the route never settled');
  if ('error' in settled) throw settled.error;
  return settled.value as T;
}

describe('holding the gate stance', () => {
  // The live stance, read from the layout.
  const site = EASTBROOK_LAYOUT.services.freeholdGate.position;
  const stance = { x: site.x + FREEHOLD_GATE_STANCE.dx, z: site.z + FREEHOLD_GATE_STANCE.dz };
  const facingOff = (facing: number) =>
    Math.abs(Math.atan2(Math.sin(Math.PI - facing), Math.cos(Math.PI - facing)));
  afterEach(() => {
    vi.useRealTimers();
  });

  // 1.1 yd sits past the hold's 0.7 yd bound yet inside the receipt's 1.5.
  it.each([2, 1.1])(
    're-walks a stop that carried on to %s yd past the stance, seen only after the settle',
    async (carry) => {
      vi.useFakeTimers();
      const { page, events, player, held, settleTicks } = kinematicPage(stance, {
        carry,
        carries: 1,
      });
      const pose = await onFakeClock(() => holdFreeholdGateStance(page, stance));
      expect(events.filter((event) => event === 'down:w').length).toBeGreaterThan(1);
      // The pose returned is the player as it stands, and nothing lands later.
      expect(pose.x).toBe(player.pos.x);
      expect(pose.z).toBe(player.pos.z);
      settleTicks();
      expect(Math.hypot(player.pos.x - stance.x, player.pos.z - stance.z)).toBeLessThanOrEqual(
        FREEHOLD_ROUTE_TOLERANCE,
      );
      expect(facingOff(player.facing)).toBeLessThanOrEqual(0.12);
      expect([...held]).toEqual([]);
    },
  );

  it('re-squares a facing that turned on after the stop', async () => {
    vi.useFakeTimers();
    const { page, player, held, settleTicks } = kinematicPage(stance, { spin: 0.3, spins: 1 });
    // Start on the stance, turned away, so the first squaring turn ends near it.
    player.pos = { x: stance.x, y: 0, z: stance.z };
    player.facing = Math.PI - 1;
    const pose = await onFakeClock(() => holdFreeholdGateStance(page, stance));
    expect(facingOff(pose.facing)).toBeLessThanOrEqual(0.12);
    settleTicks();
    expect(facingOff(player.facing)).toBeLessThanOrEqual(0.12);
    expect([...held]).toEqual([]);
  });

  const cameraOff = (yaw: number, facing: number) =>
    Math.abs(Math.atan2(Math.sin(yaw - facing), Math.cos(yaw - facing)));

  it('brings a camera swung round in front back behind in place, neither moving nor turning', async () => {
    vi.useFakeTimers();
    const { page, events, player, input } = kinematicPage(stance, { cameraOffset: 2.47 });
    // On the stance and squared, with the camera round in front: the frame
    // the before tablet once caught.
    player.pos = { x: stance.x, y: 0, z: stance.z };
    const pose = await onFakeClock(() => holdFreeholdGateStance(page, stance));
    expect([pose.x, pose.z, pose.facing]).toEqual([stance.x, stance.z, Math.PI]);
    // Both turn keys land together and lift together; nothing walks or turns.
    const synthetic = events.filter((event) => event.startsWith('synthetic:'));
    expect(synthetic.map((event) => event.replace(/@\d+$/, ''))).toEqual([
      'synthetic:keydown:a',
      'synthetic:keydown:d',
      'synthetic:keyup:a',
      'synthetic:keyup:d',
    ]);
    // Each pair rode ONE page task, so no frame can sample one key alone.
    const call = (event: string) => event.split('@')[1];
    expect(call(synthetic[0])).toBe(call(synthetic[1]));
    expect(call(synthetic[2])).toBe(call(synthetic[3]));
    expect(events.some((event) => /^(down|press):/.test(event))).toBe(false);
    expect(cameraOff(input.camYaw, pose.facing)).toBeLessThanOrEqual(
      FREEHOLD_CAMERA_BEHIND_TOLERANCE / 2,
    );
  });

  it('settles a camera a big turn left behind at a slow frame rate', async () => {
    vi.useFakeTimers();
    // Facing away from the stance with the camera behind: the walk turns about
    // PI, which at 5 frames a second leaves the camera well behind the turn.
    const { page, events, input } = kinematicPage(stance, { facing: 0 });
    const pose = await onFakeClock(() => holdFreeholdGateStance(page, stance));
    expect(events.some((event) => event.startsWith('synthetic:keydown:a'))).toBe(true);
    expect(cameraOff(input.camYaw, pose.facing)).toBeLessThanOrEqual(
      FREEHOLD_CAMERA_BEHIND_TOLERANCE,
    );
  });

  it('presses nothing when the camera already sits behind', async () => {
    vi.useFakeTimers();
    const { page, events, player } = kinematicPage(stance, { cameraOffset: 0.01 });
    player.pos = { x: stance.x, y: 0, z: stance.z };
    await onFakeClock(() => holdFreeholdGateStance(page, stance));
    expect(events.filter((event) => event.startsWith('synthetic:'))).toEqual([]);
  });

  it.each([
    ['Mouse Camera', { mouseCamera: true }],
    ['mouselook', { mouselook: true }],
    ['attack-move', { attackMove: true }],
  ] as const)('refuses to settle with %s on, before any key goes down', async (_, mode) => {
    vi.useFakeTimers();
    const { page, player, events, held } = kinematicPage(stance, { cameraOffset: 2.47, ...mode });
    player.pos = { x: stance.x, y: 0, z: stance.z };
    await expect(onFakeClock(() => holdFreeholdGateStance(page, stance))).rejects.toThrow(
      /needs Mouse Camera, mouselook and attack-move off/,
    );
    expect(events.filter((event) => event.startsWith('synthetic:'))).toEqual([]);
    expect([...held]).toEqual([]);
  });

  it('settles again when the camera is knocked off after the first settle', async () => {
    vi.useFakeTimers();
    const { page, events, player, input } = kinematicPage(stance, {
      cameraOffset: 2.47,
      cameraKick: 0.5,
    });
    player.pos = { x: stance.x, y: 0, z: stance.z };
    const pose = await onFakeClock(() => holdFreeholdGateStance(page, stance));
    expect(events.filter((event) => event.startsWith('synthetic:keydown:a'))).toHaveLength(2);
    expect(cameraOff(input.camYaw, pose.facing)).toBeLessThanOrEqual(
      FREEHOLD_CAMERA_BEHIND_TOLERANCE,
    );
  });

  it('throws after its attempts when an orbit never lets the camera come round', async () => {
    vi.useFakeTimers();
    const { page, events, held } = kinematicPage(stance, {
      cameraOffset: 2.47,
      orbitStuck: true,
    });
    await expect(onFakeClock(() => holdFreeholdGateStance(page, stance))).rejects.toThrow(
      /after 3 attempts.*"cameraSettled":false/,
    );
    // Each attempt really settled again: a failed settle is not a terminal throw.
    expect(events.filter((event) => event.startsWith('synthetic:keydown:a'))).toHaveLength(3);
    expect([...held]).toEqual([]);
  });

  it('throws after exactly its attempts rather than return a pose off the stance', async () => {
    vi.useFakeTimers();
    const { page, held } = kinematicPage(stance, {
      carry: 2,
      carries: Number.POSITIVE_INFINITY,
    });
    await expect(onFakeClock(() => holdFreeholdGateStance(page, stance))).rejects.toThrow(
      /could not hold the gate stance after 3 attempts/,
    );
    expect([...held]).toEqual([]);
  });

  it.each([0, -1, 1.5, Number.NaN])('refuses %s attempts', async (attempts) => {
    const { page } = kinematicPage(stance, {});
    await expect(holdFreeholdGateStance(page, stance, { attempts })).rejects.toThrow(
      /attempts must be a positive integer/,
    );
  });
});

describe('switching the tour to the Cottage', () => {
  // A desktop page with a chat box: Enter opens it, typing fills it (or drops
  // the first keystroke, as a loaded machine can), and Enter submits it; the
  // sim takes the tier only for the whole command, and only if the grant lands.
  function chatPage(options: { dropFirstKey?: boolean; grantLands?: boolean }) {
    const state = { open: false, typed: '', tier: 'inn_room', enters: 0 };
    const context = () => ({
      document: {
        body: { classList: { contains: () => false } },
        querySelector: () => ({ value: state.typed }),
        getElementById: () => null,
      },
      window: { __game: { sim: { freeholds: new Map([['acct', { tier: state.tier }]]) } } },
    });
    const run = (fn: (...args: never[]) => unknown, args: unknown[]) =>
      runInNewContext(`(${fn.toString()})(...args)`, { ...context(), args });
    const page = {
      evaluate: async (fn: (...args: never[]) => unknown, ...args: unknown[]) => run(fn, args),
      waitForFunction: async (
        fn: (...args: never[]) => unknown,
        _options: unknown,
        ...args: unknown[]
      ) => {
        for (let attempt = 0; attempt < 10; attempt++) if (run(fn, args)) return;
        throw new Error('condition did not become ready');
      },
      waitForSelector: async () => {},
      type: async (_selector: string, text: string) => {
        state.typed = options.dropFirstKey ? text.slice(1) : text;
      },
      keyboard: {
        press: async (key: string) => {
          if (key !== 'Enter') return;
          state.enters++;
          if (!state.open) {
            state.open = true;
            return;
          }
          if (state.typed === '/dev freehold cottage' && options.grantLands !== false)
            state.tier = 'cottage';
          state.open = false;
          state.typed = '';
        },
      },
    } as unknown as Page;
    return { page, state };
  }

  it('sends the whole command and waits for the sim to take the tier', async () => {
    const { page, state } = chatPage({});
    await changeFreeholdToCottage(page);
    expect(state.tier).toBe('cottage');
    expect(state.enters).toBe(2);
  });

  it('never submits a command a keystroke went missing from', async () => {
    const { page, state } = chatPage({ dropFirstKey: true });
    await expect(changeFreeholdToCottage(page)).rejects.toThrow(/did not become ready/);
    expect(state.enters).toBe(1);
    expect(state.tier).toBe('inn_room');
  });

  it('refuses to go on until the grant has landed', async () => {
    const { page, state } = chatPage({ grantLands: false });
    await expect(changeFreeholdToCottage(page)).rejects.toThrow(/did not become ready/);
    expect(state.enters).toBe(2);
  });
});

describe('reopening the gate after a leave', () => {
  const site = EASTBROOK_LAYOUT.services.freeholdGate.position;
  const stance = { x: site.x + FREEHOLD_GATE_STANCE.dx, z: site.z + FREEHOLD_GATE_STANCE.dz };
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks back into reach when the leave carried the player on past the drop', async () => {
    vi.useFakeTimers();
    const { page, events, player } = kinematicPage(stance, {});
    // The drop is 4 yd south of the arch; a late key-up walked on to 7.
    player.pos = { x: site.x, y: 0, z: site.z - 7 };
    await onFakeClock(() => reopenFreeholdGate(page));
    expect(events).toContain('down:w');
    expect(events.at(-1)).toBe('press:f');
    expect(Math.hypot(player.pos.x - site.x, player.pos.z - site.z)).toBeLessThanOrEqual(5);
    // Back up the line it came, still south of the arch.
    expect(player.pos.z).toBeLessThan(site.z);
  });

  it.each([5.05, 5.3])('walks back from %s yd, just past the reach', async (away) => {
    vi.useFakeTimers();
    const { page, events, player } = kinematicPage(stance, {});
    player.pos = { x: site.x, y: 0, z: site.z - away };
    await onFakeClock(() => reopenFreeholdGate(page));
    expect(events).toContain('down:w');
    expect(events.at(-1)).toBe('press:f');
  });

  it('throws when the gate is gone after a leave', async () => {
    const { page, player } = kinematicPage(stance, { noGate: true });
    player.pos = { x: site.x, y: 0, z: site.z - 4 };
    await expect(reopenFreeholdGate(page)).rejects.toThrow(/lost the gate/);
  });

  // The drop, and a leave that stopped just inside the 4.5 yd walk-back line.
  it.each([4, 4.4])('presses at once from %s yd, already in reach', async (away) => {
    vi.useFakeTimers();
    const { page, events, player } = kinematicPage(stance, {});
    player.pos = { x: site.x, y: 0, z: site.z - away };
    await onFakeClock(() => reopenFreeholdGate(page));
    expect(events).toEqual(['press:f']);
  });
});
