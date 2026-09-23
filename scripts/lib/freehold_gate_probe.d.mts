export interface FreeholdGateProbePoint {
  label: 'plinth-left' | 'plinth-right' | 'keystone';
  sx: number;
  sy: number;
  onScreen: boolean;
  occludedBy: string | null;
  coveredBy: string | null;
}
export function freeholdGateDrawnProbe(env?: {
  game: unknown;
  document: unknown;
  getComputedStyle: (element: never, pseudo?: string) => Record<string, string>;
  innerWidth: number;
  innerHeight: number;
}): { drawn: boolean; reason: string | null; points: FreeholdGateProbePoint[] };
