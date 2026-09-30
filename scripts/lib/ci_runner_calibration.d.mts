// Type declarations for scripts/lib/ci_runner_calibration.mjs (the CI legs' runner-speed
// calibration and the harvest's scaling), so tests/ci_runner_calibration.test.ts type-checks.

export const CALIBRATION_VERSION: string;
export const CALIBRATION_ITERATIONS: number;
export const CALIBRATION_ROUNDS: number;
export const CALIBRATION_REFERENCE_MS: number;
export const CALIBRATION_REFERENCE_ANCHORED: boolean;
export const CALIBRATION_CHECKSUM: number;
export const CALIBRATION_LINE_PREFIX: string;

export interface CalibrationRun {
  medianMs: number;
  roundsMs: number[];
  checksum: number;
}

export function calibrationWork(iterations: number): number;

export function runCalibration(opts?: {
  iterations?: number;
  rounds?: number;
  now?: () => bigint;
}): CalibrationRun;

export function formatCalibrationLine(c: {
  medianMs: number;
  roundsMs: readonly number[];
  checksum: number;
  cpu?: string;
}): string;

export function parseCalibrationLine(logText: string): ParsedCalibration;

export function calibrationFactor(medianMs: number): number;

export function scaleWeights(
  weights: Readonly<Record<string, number>>,
  factor: number,
): Record<string, number>;

export const CALIBRATION_OUTLIER_RATIO: number;

export type ParsedCalibration =
  | { ok: true; medianMs: number; cpu: string }
  | { ok: false; reason: string };

export interface CalibratedJob {
  name: string;
  raw: Record<string, number>;
  weights: Record<string, number>;
  files: number;
  rawMs: number;
  calibratedMs: number;
  factor: number;
  medianMs: number | null;
  cpu: string;
  reason: string;
}

export function calibrateJobs(
  jobs: ReadonlyArray<{
    name: string;
    weights: Readonly<Record<string, number>>;
    calibration: ParsedCalibration;
  }>,
): CalibratedJob[];

export interface CalibrationProvenance {
  version: string;
  referenceMs: number;
  status: 'calibrated' | 'partial' | 'raw';
  jobs: Record<string, { ms: number; factor: number; cpu?: string }>;
  raw?: Record<string, string>;
  warning?: string;
}

export function calibrationProvenance(
  jobs: ReadonlyArray<{
    name: string;
    factor: number;
    medianMs: number | null;
    cpu: string;
    reason: string;
  }>,
): CalibrationProvenance;

export function calibrationScaleNote(
  priorProvenance: Record<string, unknown> | undefined,
  next: { status: string; version: string; referenceMs: number },
): string | null;

export interface ReportJob {
  name: string;
  files: number;
  rawMs: number;
  calibratedMs: number;
  factor: number;
  medianMs: number | null;
  cpu: string;
  reason: string;
}

export function calibrationReportLines(input: {
  runId: string;
  jobs: ReadonlyArray<ReportJob>;
  rawWeights: Readonly<Record<string, number>>;
  calibratedWeights: Readonly<Record<string, number>>;
}): string[];

export function calibrationTableDefects(provenance: Record<string, unknown> | undefined): string[];
