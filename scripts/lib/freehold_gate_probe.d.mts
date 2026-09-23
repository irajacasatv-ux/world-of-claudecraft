export interface FreeholdGateProbePoint {
  label: 'plinth-left' | 'plinth-right' | 'keystone';
  sx: number;
  sy: number;
  onScreen: boolean;
  occludedBy: string | null;
  coveredBy: string | null;
}
export const FREEHOLD_GATE_PROBE_POINTS: readonly (readonly [
  FreeholdGateProbePoint['label'],
  number,
  number,
])[];
export function freeholdGateDrawnProbe(env: {
  points: readonly (readonly [string, number, number])[];
  game?: unknown;
  document?: unknown;
  getComputedStyle?: (element: never, pseudo?: string) => Record<string, string>;
  innerWidth?: number;
  innerHeight?: number;
}): { drawn: boolean; reason: string | null; points: FreeholdGateProbePoint[] };
