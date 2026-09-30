// The CI runner-speed calibration (scripts/lib/ci_runner_calibration.mjs): the line every
// CI vitest leg prints before its tests, and the harvest's use of it to scale each job's
// per-file weights to one reference runner speed. The harvester itself is driven end to
// end in tests/ci_shard_weight_parse.test.ts; this file pins the units it composes.
//
// Guards: the calibration line's exact format, its parser (first line, version, refusals),
// the per-job scaling to CALIBRATION_REFERENCE_MS and its raw fallback, the provenance
// block and the scale-change note, and the entry's placement of the calibration before
// the tests; the nearest suite, tests/ci_shard_weight_parse.test.ts, pins the reporter
// parser and the harvester's writes, not these.
// Cost: 21 ms
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CALIBRATION_ITERATIONS,
  CALIBRATION_REFERENCE_MS,
  CALIBRATION_ROUNDS,
  CALIBRATION_VERSION,
  calibrateJob,
  calibrationFactor,
  calibrationProvenance,
  calibrationReportLines,
  calibrationScaleNote,
  calibrationWork,
  formatCalibrationLine,
  parseCalibrationLine,
  runCalibration,
  scaleWeights,
} from '../scripts/lib/ci_runner_calibration.mjs';
import { CI_LONG_SUITES } from '../scripts/lib/ci_shard_plan.mjs';
import { stripComments } from './helpers/strip_comments';

const LINE = (medianMs: number, cpu = 'AMD EPYC 7763 64-Core Processor') =>
  formatCalibrationLine({
    medianMs,
    roundsMs: [200.3, 201.3, 202.6, 201.3, 203.3],
    checksum: 0x915fc3cc,
    cpu,
  });

describe('the calibration workload', () => {
  it('pins its version, size and reference, so a changed workload is a visible edit', () => {
    // A reference millisecond means this workload at this size: changing either moves
    // every calibrated table, so it bumps the version (the parser refuses any other).
    expect(CALIBRATION_VERSION).toBe('v1');
    expect(CALIBRATION_ITERATIONS).toBe(600_000);
    expect(CALIBRATION_ROUNDS).toBe(5);
    expect(CALIBRATION_REFERENCE_MS).toBe(200);
  });

  it('is deterministic work with a fixed checksum on every machine', () => {
    expect(calibrationWork(5_000)).toBe(0x915fc3cc);
    expect(calibrationWork(5_000)).toBe(calibrationWork(5_000));
    expect(calibrationWork(5_001)).not.toBe(calibrationWork(5_000));
  });

  it('times one warm-up plus the configured rounds and reports their median', () => {
    // A scripted clock: each timed round reads two ticks; the warm-up reads none.
    const deltasNs = [30e6, 10e6, 20e6, 50e6, 40e6];
    const ticks: bigint[] = [];
    let t = 0n;
    for (const d of deltasNs) {
      ticks.push(t);
      t += BigInt(d);
      ticks.push(t);
    }
    let reads = 0;
    const run = runCalibration({ iterations: 1_000, now: () => ticks[reads++] });
    expect(reads).toBe(2 * CALIBRATION_ROUNDS);
    expect(run.roundsMs).toEqual([30, 10, 20, 50, 40]);
    expect(run.medianMs).toBe(30);
    expect(run.checksum).toBe(calibrationWork(1_000));
  });
});

describe('the calibration line', () => {
  it('prints one exact, parseable line', () => {
    expect(LINE(201.3)).toBe(
      '[ci-calibration] v1 median-ms=201.3 rounds-ms=200.3,201.3,202.6,201.3,203.3 ' +
        'checksum=915fc3cc cpu="AMD EPYC 7763 64-Core Processor"',
    );
    // A short checksum pads to eight digits and a quote cannot break the cpu field.
    expect(
      formatCalibrationLine({ medianMs: 5, roundsMs: [5], checksum: 0xabc, cpu: 'x "y"\n' }),
    ).toBe('[ci-calibration] v1 median-ms=5.0 rounds-ms=5.0 checksum=00000abc cpu="x y"');
  });

  it('parses the line through the CI log prefix, and only the first one counts', () => {
    const log = [
      '2026-09-30T01:20:55.6760399Z [ci-shard] shard 4/8, workers=2 (default)',
      `2026-09-30T01:20:57.1234567Z ${LINE(231.4)}`,
      `2026-09-30T01:29:10.0000000Z ${LINE(90)}`,
    ].join('\n');
    expect(parseCalibrationLine(log)).toEqual({
      ok: true,
      medianMs: 231.4,
      cpu: 'AMD EPYC 7763 64-Core Processor',
    });
    expect(parseCalibrationLine(LINE(150, ''))).toEqual({ ok: true, medianMs: 150, cpu: '' });
  });

  it('refuses a missing, skipped, other-version or zero line rather than guessing a speed', () => {
    expect(parseCalibrationLine('no line here\n')).toEqual({
      ok: false,
      reason: 'no calibration line',
    });
    const skipped = parseCalibrationLine('[ci-calibration] skipped: boom');
    expect(skipped.ok).toBe(false);
    if (!skipped.ok) expect(skipped.reason).toMatch(/^malformed calibration line/);
    const v2 = parseCalibrationLine(LINE(200).replace(' v1 ', ' v2 '));
    expect(v2.ok).toBe(false);
    if (!v2.ok) expect(v2.reason).toContain('v2 is not v1');
    const zero = parseCalibrationLine(LINE(200).replace('median-ms=200.0', 'median-ms=0.0'));
    expect(zero.ok).toBe(false);
  });
});

describe('scaling a job to the reference speed', () => {
  it('scales by the reference over the job median: a slow runner shrinks, a fast one grows', () => {
    expect(calibrationFactor(CALIBRATION_REFERENCE_MS)).toBe(1);
    expect(calibrationFactor(CALIBRATION_REFERENCE_MS * 2)).toBe(0.5);
    expect(calibrationFactor(CALIBRATION_REFERENCE_MS / 2)).toBe(2);
    expect(scaleWeights({ 'tests/a.test.ts': 1_001, 'tests/b.test.ts': 1 }, 0.5)).toEqual({
      'tests/a.test.ts': 501,
      'tests/b.test.ts': 1,
    });
    // Every row keeps at least 1 ms, as a harvested row must be positive.
    expect(scaleWeights({ 'tests/c.test.ts': 3 }, 0.1)).toEqual({ 'tests/c.test.ts': 1 });
  });

  it("applies the job's own line, and harvests a job without one raw with the reason", () => {
    const weights = { 'tests/a.test.ts': 4_000, 'tests/b.test.ts': 30 };
    const slow = calibrateJob(weights, `x\n${LINE(CALIBRATION_REFERENCE_MS * 2)}\n`);
    expect(slow).toEqual({
      weights: { 'tests/a.test.ts': 2_000, 'tests/b.test.ts': 15 },
      factor: 0.5,
      medianMs: CALIBRATION_REFERENCE_MS * 2,
      cpu: 'AMD EPYC 7763 64-Core Processor',
      reason: '',
    });
    const raw = calibrateJob(weights, 'an old log with no calibration line\n');
    expect(raw).toEqual({
      weights,
      factor: 1,
      medianMs: null,
      cpu: '',
      reason: 'no calibration line',
    });
    expect(raw.weights).not.toBe(weights);
  });

  it('records every job in provenance, and a raw job as a warning naming it', () => {
    const job = (name: string, medianMs: number | null) => ({
      name,
      factor: medianMs === null ? 1 : CALIBRATION_REFERENCE_MS / medianMs,
      medianMs,
      cpu: medianMs === null ? '' : 'cpu',
      reason: medianMs === null ? 'no calibration line' : '',
    });
    const all = calibrationProvenance([job('PR tests (1)', 250), job('PR long sims A', 160)]);
    expect(all).toEqual({
      version: 'v1',
      referenceMs: CALIBRATION_REFERENCE_MS,
      status: 'calibrated',
      jobs: {
        'PR tests (1)': { ms: 250, factor: 0.8, cpu: 'cpu' },
        'PR long sims A': { ms: 160, factor: 1.25, cpu: 'cpu' },
      },
    });
    const partial = calibrationProvenance([job('PR tests (1)', 250), job('PR tests (2)', null)]);
    expect(partial.status).toBe('partial');
    expect(partial.raw).toEqual({ 'PR tests (2)': 'no calibration line' });
    expect(partial.warning).toContain('1 of 2 job(s) harvested RAW');
    expect(partial.warning).toContain('PR tests (2)');
    const none = calibrationProvenance([job('PR tests (1)', null)]);
    expect(none.status).toBe('raw');
    expect(none.jobs).toEqual({});
  });

  it('notes a change of scale against the replaced table, and only then', () => {
    const calibrated = { status: 'calibrated', version: 'v1', referenceMs: 200 };
    expect(calibrationScaleNote({ run: '1' }, calibrated)).toContain(
      'the replaced table is in raw runner time and this harvest is in calibrated v1',
    );
    expect(calibrationScaleNote({ calibration: calibrated }, calibrated)).toBeNull();
    expect(
      calibrationScaleNote({ calibration: { ...calibrated, referenceMs: 180 } }, calibrated),
    ).toContain('a 180 ms reference');
    expect(calibrationScaleNote({ run: '1' }, { ...calibrated, status: 'raw' })).toBeNull();
    expect(
      calibrationScaleNote({ calibration: calibrated }, { ...calibrated, status: 'partial' }),
    ).toContain('partly calibrated');
  });

  it('reports a run raw and calibrated, per job and per pool, the lane split as the ratchet splits it', () => {
    const laneFile = CI_LONG_SUITES[0];
    const lines = calibrationReportLines({
      runId: '42',
      jobs: [
        {
          name: 'PR tests (1)',
          files: 2,
          rawMs: 3_000,
          calibratedMs: 1_500,
          factor: 0.5,
          medianMs: 400,
          cpu: 'cpu',
          reason: '',
        },
        {
          name: 'PR long sims A',
          files: 1,
          rawMs: 9_000,
          calibratedMs: 9_000,
          factor: 1,
          medianMs: null,
          cpu: '',
          reason: 'no calibration line',
        },
      ],
      rawWeights: { 'tests/a.test.ts': 1_000, 'tests/b.test.ts': 2_000, [laneFile]: 9_000 },
      calibratedWeights: { 'tests/a.test.ts': 500, 'tests/b.test.ts': 1_000, [laneFile]: 9_000 },
    });
    expect(lines).toContain(
      '[report]   PR tests (1): median 400.0 ms, factor 0.5000, 2 files, raw 3000 ms, ' +
        'calibrated 1500 ms, cpu cpu',
    );
    expect(lines).toContain(
      '[report]   PR long sims A: RAW (no calibration line), 1 files, raw 9000 ms',
    );
    expect(lines.find((l) => l.includes('shard pool'))).toMatch(
      /^\[report\] run 42 shard pool: raw 3000 ms, calibrated 1500 ms \(ceiling \d+ ms\)$/,
    );
    expect(lines.find((l) => l.includes('lane pool'))).toMatch(
      /^\[report\] run 42 lane pool: raw 9000 ms, calibrated 9000 ms/,
    );
    expect(lines.at(-1)).toMatch(/^\[report\] WARNING: 1 of 2 job\(s\) harvested RAW/);
  });
});

describe('the CI entry calibrates before the tests, and never in plan-only', () => {
  it('prints the line in the spawning branch, ahead of pretest and the legs', () => {
    const entry = stripComments(
      readFileSync(new URL('../scripts/ci_shard_test.mjs', import.meta.url), 'utf8'),
    );
    const planOnlyAt = entry.indexOf('if (planOnly) {');
    const spawnAt = entry.indexOf('} else {', planOnlyAt);
    const calibrateAt = entry.indexOf(
      "console.log(formatCalibrationLine({ ...runCalibration(), cpu: os.cpus()[0]?.model ?? '' }));",
    );
    const pretestAt = entry.indexOf('shouldRunEntryPretest({ legCount: plan.legs.length })');
    const legsAt = entry.indexOf('await runLegsWithFlakeRetry(');
    expect(planOnlyAt).toBeGreaterThan(-1);
    expect(calibrateAt).toBeGreaterThan(spawnAt);
    expect(spawnAt).toBeGreaterThan(planOnlyAt);
    expect(pretestAt).toBeGreaterThan(calibrateAt);
    expect(legsAt).toBeGreaterThan(pretestAt);
    // Guarded by the leg count (a zero-leg lane spawns nothing), and fail-soft.
    expect(entry.slice(spawnAt, calibrateAt)).toContain('if (plan.legs.length > 0) {');
    expect(entry.slice(calibrateAt, pretestAt)).toContain('[ci-calibration] skipped: ');
    expect(entry.match(/runCalibration\(/g)).toHaveLength(1);
  });
});
