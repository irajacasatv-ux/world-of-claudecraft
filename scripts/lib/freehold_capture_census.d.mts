export const FREEHOLD_TRANSIENT_HUD: readonly (readonly [string, boolean])[];
export interface FreeholdCaptureControl {
  key: string | null;
  tag: string;
  width: number;
  height: number;
  fontSize: number;
  onTop: boolean;
}
export function freeholdCaptureCensus(env: {
  transient: readonly (readonly [string, boolean])[];
  document?: unknown;
  getComputedStyle?: (element: never) => Record<string, string>;
  innerWidth?: number;
  innerHeight?: number;
}): {
  promptVisible: boolean;
  controls: FreeholdCaptureControl[];
  focusKey: string | null;
  focusId: string | null;
  promptFitsViewport: boolean;
  transientOverlays: string[];
};
