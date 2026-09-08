import type { Page } from 'puppeteer-core';
import { describe, expect, it } from 'vitest';
import {
  freeholdInteriorPerfFailures,
  sampleFreeholdInterior,
} from '../scripts/freehold_interior_route.mjs';

const boundary = (frames: number) => ({
  frames,
  atMs: frames * 20,
  calls: 10,
  room: { x: 20000, z: 0 },
  gpuCounts: { 'live-program': 0, 'attach-watchdog': 0, 'gate-timeout': 0 },
  instrumentationActive: true,
});

const clean = () =>
  ['freehold-inn-room', 'freehold-cottage'].map((label) => ({
    label,
    sampleEvidence: { begin: boundary(10), end: boundary(20) },
    arrival: { gpuDelta: { 'live-program': 0, 'attach-watchdog': 0, 'gate-timeout': 0 } },
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
    samples[0].arrival.gpuDelta['live-program'] = 2;
    samples[1].arrival.gpuDelta['attach-watchdog'] = 1;
    expect(freeholdInteriorPerfFailures(samples)).toEqual([
      'freehold-inn-room: live-program delta 2, expected zero',
      'freehold-cottage: attach-watchdog delta 1, expected zero',
    ]);
  });
  it('does not treat absent telemetry as a passing zero', () => {
    expect(freeholdInteriorPerfFailures([{ label: 'freehold-inn-room' }, clean()[1]])).toHaveLength(
      7,
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
