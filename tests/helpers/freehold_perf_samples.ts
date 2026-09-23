// A clean Freehold perf-tour sample set (scripts/freehold_interior_route.mjs
// freeholdInteriorPerfFailures): two rendered room samples with zero GPU
// escapes, the inn sample carrying the gate's first-draw window. Shared by the
// route suite and the capture-receipt refusal suite, which each break one
// field of a fresh copy.

export const FIRST_DRAW_KINDS = [
  'live-program',
  'attach-watchdog',
  'gate-timeout',
  'reveal-watchdog',
  'touch-unproven',
] as const;

export const perfBoundary = (frames: number) => ({
  frames,
  atMs: frames * 20,
  calls: 10,
  room: { x: 20000, z: 0 },
  gpuCounts: { 'live-program': 0, 'attach-watchdog': 0, 'gate-timeout': 0 },
  instrumentationActive: true,
  graphicsPreset: 1,
  rendererTier: 'low',
});

const zeros = () => Object.fromEntries(FIRST_DRAW_KINDS.map((kind) => [kind, 0]));

/** The gate's first draw: no view on the island, compiled and revealed at the end. */
export const gateFirstDraw = () => ({
  begin: { atMs: 1, gateView: false, compilePending: null, visible: null, counts: zeros() },
  end: { atMs: 9, gateView: true, compilePending: false, visible: true, counts: zeros() },
});

export type FreeholdPerfSampleFixture = {
  label: string;
  sampleEvidence: { begin: ReturnType<typeof perfBoundary>; end: ReturnType<typeof perfBoundary> };
  arrival: Record<string, unknown> & {
    gpuBefore: Record<string, number>;
    gpuAfter: Record<string, number>;
    gpuDelta: Record<string, number>;
  };
  gateFirstDraw?: ReturnType<typeof gateFirstDraw>;
};

export const cleanFreeholdPerfSamples = (): FreeholdPerfSampleFixture[] =>
  ['freehold-inn-room', 'freehold-cottage'].map((label) => ({
    label,
    sampleEvidence: { begin: perfBoundary(10), end: perfBoundary(20) },
    arrival: {
      entryAtMs: 0,
      gpuBefore: { ...perfBoundary(0).gpuCounts },
      gpuAfter: { ...perfBoundary(0).gpuCounts },
      gpuDelta: { ...perfBoundary(0).gpuCounts },
    },
    ...(label === 'freehold-inn-room' ? { gateFirstDraw: gateFirstDraw() } : {}),
  }));
