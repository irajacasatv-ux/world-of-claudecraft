import type { Page } from 'puppeteer-core';

export interface FreeholdTourPose {
  x: number;
  y: number;
  z: number;
  facing: number;
  dead: boolean;
  tick: number;
}
export interface FreeholdTourArrival extends FreeholdTourPose {
  entryAtMs: number;
  gpuBefore: Record<string, number>;
  gpuAfter: Record<string, number>;
  gpuDelta: Record<string, number>;
}
export interface FreeholdSampleBoundary {
  instrumentationActive: boolean;
  graphicsPreset: number;
  rendererTier: string;
  atMs: number;
  frames: number;
  calls: number;
  room: { x: number; z: number } | null;
  gpuCounts: Record<string, number>;
}
export interface FreeholdPerfSample {
  sampleEvidence?: { begin: FreeholdSampleBoundary; end: FreeholdSampleBoundary };
  label: string;
  arrival?: {
    entryAtMs?: number;
    gpuBefore?: Record<string, number>;
    gpuAfter?: Record<string, number>;
    gpuDelta?: Record<string, number>;
  };
  gateFirstDraw?: {
    begin?: Partial<FreeholdGateFirstDrawMark>;
    end?: Partial<FreeholdGateFirstDrawMark>;
  };
}
export function walkFreeholdRouteTo(
  page: Page,
  x: number,
  z: number,
  options?: {
    tolerance?: number;
    timeoutMs?: number;
  },
): Promise<FreeholdTourPose>;
export function sailToFreeholdTown(page: Page): Promise<void>;
export const FREEHOLD_ROUTE_TOLERANCE: number;
export const FREEHOLD_CAMERA_BEHIND_TOLERANCE: number;
export const FREEHOLD_GATE_STANCE: Readonly<{ dx: number; dz: number }>;
export function approachFreeholdGateSite(
  page: Page,
  site: { x: number; z: number },
): Promise<FreeholdTourPose>;
export function holdFreeholdGateStance(
  page: Page,
  stance: { x: number; z: number },
  options?: { attempts?: number },
): Promise<FreeholdTourPose & { cameraYaw: number }>;
export interface FreeholdGateFirstDrawMark {
  atMs: number;
  gateView: boolean;
  compilePending: boolean | null;
  visible: boolean | null;
  counts: Record<string, number>;
}
export function freeholdGateApproachLegs(site: {
  x: number;
  z: number;
}): { x: number; z: number }[];
export function walkToFreeholdGate<T = undefined>(
  page: Page,
  hooks?: { beforePress?: (page: Page) => Promise<T> },
): Promise<{
  x: number;
  z: number;
  firstDraw: { begin: FreeholdGateFirstDrawMark; end: FreeholdGateFirstDrawMark };
  settled: T | undefined;
}>;
export function confirmFreeholdGate(page: Page): Promise<FreeholdTourArrival>;
export function leaveFreeholdThroughExit(page: Page): Promise<void>;
export function reopenFreeholdGate(page: Page): Promise<void>;
export function changeFreeholdToCottage(page: Page): Promise<void>;
export function runFreeholdInteriorRoute(
  page: Page,
  hooks?: {
    onGatePrompt?: (page: Page) => Promise<void>;
    afterInn?: (page: Page, arrival: FreeholdTourArrival) => Promise<void>;
    afterCottage?: (page: Page, arrival: FreeholdTourArrival) => Promise<void>;
    sample?: (page: Page, label: string) => Promise<FreeholdPerfSample>;
  },
): Promise<FreeholdPerfSample[]>;
export function freeholdInteriorPerfFailures(samples: readonly FreeholdPerfSample[]): string[];

export function sampleFreeholdInterior(
  page: Page,
  label: string,
  arrival: FreeholdTourArrival,
  sample: (page: Page, label: string) => Promise<FreeholdPerfSample>,
): Promise<FreeholdPerfSample>;
