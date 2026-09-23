import { runInNewContext } from 'node:vm';
import type { Page } from 'puppeteer-core';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_GATE_STANCE,
  FREEHOLD_ROUTE_TOLERANCE,
  freeholdInteriorPerfFailures,
  holdFreeholdGateStance,
  leaveFreeholdThroughExit,
  sampleFreeholdInterior,
  walkFreeholdRouteTo,
} from '../scripts/freehold_interior_route.mjs';
import { FREEHOLD_GATE_INTERACT_RANGE } from '../src/sim/freehold/gate_rules';

const boundary = (frames: number) => ({
  frames,
  atMs: frames * 20,
  calls: 10,
  room: { x: 20000, z: 0 },
  gpuCounts: { 'live-program': 0, 'attach-watchdog': 0, 'gate-timeout': 0 },
  instrumentationActive: true,
  graphicsPreset: 1,
  rendererTier: 'low',
});

const clean = () =>
  ['freehold-inn-room', 'freehold-cottage'].map((label) => ({
    label,
    sampleEvidence: { begin: boundary(10), end: boundary(20) },
    arrival: {
      entryAtMs: 0,
      gpuBefore: { ...boundary(0).gpuCounts },
      gpuAfter: { ...boundary(0).gpuCounts },
      gpuDelta: { ...boundary(0).gpuCounts },
    },
  }));

describe('accepted home reveal perf evidence', () => {
  it('requires clean samples from both distinct home destinations', () => {
    expect(freeholdInteriorPerfFailures(clean())).toEqual([]);
    expect(freeholdInteriorPerfFailures(clean().slice(0, 1))).toEqual([
      'Missing accepted interior sample: freehold-cottage',
    ]);
  });
  it('rejects cold live links and watchdog escapes independently', () => {
    const samples = clean();
    samples[0].sampleEvidence.end.gpuCounts['live-program'] = 2;
    samples[0].arrival.gpuAfter['live-program'] = 2;
    samples[0].arrival.gpuDelta['live-program'] = 2;
    samples[1].sampleEvidence.end.gpuCounts['attach-watchdog'] = 1;
    samples[1].arrival.gpuAfter['attach-watchdog'] = 1;
    samples[1].arrival.gpuDelta['attach-watchdog'] = 1;
    expect(freeholdInteriorPerfFailures(samples)).toEqual([
      'freehold-inn-room: live-program delta 2, expected zero',
      'freehold-cottage: attach-watchdog delta 1, expected zero',
    ]);
  });
  it('does not treat absent telemetry as a passing zero', () => {
    expect(freeholdInteriorPerfFailures([{ label: 'freehold-inn-room' }, clean()[1]])).not.toEqual(
      [],
    );
  });
});

it.each([false, true])(
  'closes actual sample evidence after the callback (late program=%s)',
  async (lateProgram) => {
    const counters = { 'live-program': 4, 'attach-watchdog': 0, 'gate-timeout': 0 };
    let frames = 10;
    const page = {
      evaluate: async () => ({ ...boundary(frames++), gpuCounts: { ...counters } }),
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
    expect(freeholdInteriorPerfFailures([sample, clean()[1]])).toEqual(
      lateProgram ? ['freehold-inn-room: live-program delta 1, expected zero'] : [],
    );
    expect(arrival.gpuDelta['live-program']).toBe(0);
  },
);

it('rejects zero rendered frames despite clean event counters', () => {
  const samples = clean();
  samples[0].sampleEvidence.end.frames = samples[0].sampleEvidence.begin.frames;
  expect(freeholdInteriorPerfFailures(samples)).toEqual([
    'freehold-inn-room: missing rendered room progress',
  ]);
});

it('rejects unavailable instrumentation and non-finite sample counters', () => {
  const samples = clean();
  samples[0].sampleEvidence.begin.instrumentationActive = false;
  samples[1].sampleEvidence.end.gpuCounts['live-program'] = Number.NaN;
  expect(freeholdInteriorPerfFailures(samples)).toEqual([
    'freehold-inn-room: missing rendered room progress',
    'freehold-cottage: missing finite live-program sample counters',
  ]);
});

it('rejects an isolated gate timeout with otherwise complete draw evidence', () => {
  const samples = clean();
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
  const samples = clean();
  Object.assign(samples[0].sampleEvidence[edge], { [field]: value });
  expect(freeholdInteriorPerfFailures(samples)).toEqual([
    'freehold-inn-room: missing rendered room progress',
  ]);
});

it('derives acceptance from raw entry-through-end counters despite a stale zero delta', () => {
  const samples = clean();
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
  const samples = clean();
  Object.assign(samples[0].arrival, { [field]: value });
  expect(freeholdInteriorPerfFailures(samples)).not.toEqual([]);
});

it.each(['live-program', 'attach-watchdog', 'gate-timeout'] as const)(
  'rejects %s counters that decrease between entry and either sample boundary',
  (kind) => {
    const entryRegresses = clean();
    entryRegresses[0].arrival.gpuBefore[kind] = 1;
    entryRegresses[0].arrival.gpuAfter[kind] = 1;
    entryRegresses[0].sampleEvidence.end.gpuCounts[kind] = 1;
    expect(freeholdInteriorPerfFailures(entryRegresses)).not.toEqual([]);
    const sampleRegresses = clean();
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
  const samples = clean();
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

it('holds the capture stance inside the gate reach, walk tolerance included', () => {
  // walkFreeholdRouteTo stops within its default tolerance of the target, so
  // the stance plus that tolerance must still reach the gate.
  const offset = Math.hypot(FREEHOLD_GATE_STANCE.dx, FREEHOLD_GATE_STANCE.dz);
  expect(offset).toBeCloseTo(4.123, 3);
  expect(FREEHOLD_ROUTE_TOLERANCE).toBe(0.7);
  expect(offset + FREEHOLD_ROUTE_TOLERANCE).toBeLessThan(FREEHOLD_GATE_INTERACT_RANGE);
});

/** A player that moves only while keys are held, at run speed and turn rate
 * over wall time, and that carries `carry` yd past its stop on the first
 * `carries` walk-key releases near the stance: the key-up latency a loaded
 * machine adds. */
function kinematicPage(stance: { x: number; z: number }, carry: number, carries: number) {
  const events: string[] = [];
  const player = { pos: { x: stance.x, y: 0, z: stance.z + 5 }, facing: Math.PI, dead: false };
  const held = new Set<string>();
  let last = Date.now();
  let tick = 0;
  let left = carries;
  const advance = () => {
    const dt = (Date.now() - last) / 1000;
    last = Date.now();
    if (held.has('a')) player.facing += Math.PI * dt;
    if (held.has('d')) player.facing -= Math.PI * dt;
    if (held.has('w')) {
      player.pos.x += Math.sin(player.facing) * 7 * dt;
      player.pos.z += Math.cos(player.facing) * 7 * dt;
    }
  };
  const sim = {
    get player() {
      advance();
      return player;
    },
    get tickCount() {
      advance();
      return tick++;
    },
  };
  const context = { window: { __game: { sim } }, document: { querySelector: () => null } };
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
        advance();
        events.push(`down:${key}`);
        held.add(key);
      },
      up: async (key: string) => {
        advance();
        events.push(`up:${key}`);
        if (key === 'w' && held.has('w') && left > 0) {
          if (Math.hypot(player.pos.x - stance.x, player.pos.z - stance.z) < 1) {
            left--;
            player.pos.x += Math.sin(player.facing) * carry;
            player.pos.z += Math.cos(player.facing) * carry;
          }
        }
        held.delete(key);
      },
    },
  } as unknown as Page;
  return { page, events, player };
}

describe('holding the gate stance', () => {
  const stance = { x: -42.65, z: -102.75 };

  it('re-walks a stop that carried past the stance and returns the settled pose', async () => {
    const { page, events, player } = kinematicPage(stance, 2, 1);
    const pose = await holdFreeholdGateStance(page, stance);
    expect(events.filter((event) => event === 'down:w').length).toBeGreaterThan(1);
    expect(Math.hypot(pose.x - stance.x, pose.z - stance.z)).toBeLessThanOrEqual(
      FREEHOLD_ROUTE_TOLERANCE,
    );
    expect(
      Math.abs(Math.atan2(Math.sin(Math.PI - pose.facing), Math.cos(Math.PI - pose.facing))),
    ).toBeLessThanOrEqual(0.12);
    // The pose returned is the player as it stands, not a mid-walk sample.
    expect(pose.x).toBe(player.pos.x);
    expect(pose.z).toBe(player.pos.z);
  });

  it('throws rather than return a pose off the stance', async () => {
    const { page, events } = kinematicPage(stance, 2, Number.POSITIVE_INFINITY);
    await expect(holdFreeholdGateStance(page, stance)).rejects.toThrow(
      /could not hold the gate stance/,
    );
    expect(events.filter((event) => event === 'down:w').length).toBeGreaterThanOrEqual(3);
  });
});
