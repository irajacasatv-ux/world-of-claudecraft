// The CI runner-speed calibration (scripts/lib/ci_runner_calibration.mjs): the line every
// CI vitest leg prints before its tests, and the harvest's use of it to scale each job's
// per-file weights to one reference runner speed. The harvester itself is driven end to
// end in tests/ci_shard_weight_parse.test.ts; this file pins the units it composes.
//
// Guards: the calibration line's exact format, its parser (first line, version, checksum,
// refusals), the per-job scaling to CALIBRATION_REFERENCE_MS and its raw and outlier
// fallbacks, the provenance block, the scale-change note, the calibrated-table contract,
// and the entry's placement of the calibration before the tests; the nearest suite,
// tests/ci_shard_weight_parse.test.ts, pins the reporter parser and the harvester's writes,
// not these.
// Cost: 143 ms
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CALIBRATION_CHECKSUM,
  CALIBRATION_ITERATIONS,
  CALIBRATION_OUTLIER_RATIO,
  CALIBRATION_REFERENCE_ANCHORED,
  CALIBRATION_REFERENCE_MS,
  CALIBRATION_ROUNDS,
  CALIBRATION_VERSION,
  calibrateJobs,
  calibrationFactor,
  calibrationProvenance,
  calibrationReportLines,
  calibrationScaleNote,
  calibrationTableDefects,
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
    checksum: CALIBRATION_CHECKSUM,
    cpu,
  });

describe('the calibration workload', () => {
  it('pins its version, size and reference, so a changed workload is a visible edit', () => {
    // A reference millisecond means this workload at this size: changing either moves
    // every calibrated table, so it bumps the version (the parser refuses any other).
    expect(CALIBRATION_VERSION).toBe('v1');
    expect(CALIBRATION_ITERATIONS).toBe(600_000);
    expect(CALIBRATION_ROUNDS).toBe(5);
    // Anchored to the median of the 50 calibration lines five full-mode runs printed (177.75
    // ms, rounded): the unit of every calibrated table and of the ratchet's ceilings, so moving
    // it, or un-anchoring it, is a visible edit here.
    expect(CALIBRATION_REFERENCE_MS).toBe(178);
    expect(CALIBRATION_REFERENCE_ANCHORED).toBe(true);
  });

  it("pins the full workload's checksum beside its version, and the constant matches the work", () => {
    // The parser refuses any other checksum, so a workload changed under the same version
    // harvests raw and loudly instead of landing on a silently new scale.
    expect({ version: CALIBRATION_VERSION, checksum: CALIBRATION_CHECKSUM }).toEqual({
      version: 'v1',
      checksum: 0x8e85df4d,
    });
    expect(calibrationWork(CALIBRATION_ITERATIONS)).toBe(CALIBRATION_CHECKSUM);
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
        'checksum=8e85df4d cpu="AMD EPYC 7763 64-Core Processor"',
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
    const otherWork = parseCalibrationLine(
      LINE(200).replace('checksum=8e85df4d', 'checksum=915fc3cc'),
    );
    expect(otherWork).toEqual({
      ok: false,
      reason: "calibration checksum 915fc3cc is not 8e85df4d, the v1 workload's",
    });
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

  it("applies each job's own line, and harvests a job without one raw with the reason", () => {
    const weights = { 'tests/a.test.ts': 4_000, 'tests/b.test.ts': 30 };
    const [slow, raw] = calibrateJobs([
      {
        name: 'slow',
        weights,
        calibration: parseCalibrationLine(`x\n${LINE(CALIBRATION_REFERENCE_MS * 2)}\n`),
      },
      {
        name: 'old',
        weights,
        calibration: parseCalibrationLine('an old log with no calibration line\n'),
      },
    ]);
    expect(slow).toEqual({
      name: 'slow',
      raw: weights,
      weights: { 'tests/a.test.ts': 2_000, 'tests/b.test.ts': 15 },
      files: 2,
      rawMs: 4_030,
      calibratedMs: 2_015,
      factor: 0.5,
      medianMs: CALIBRATION_REFERENCE_MS * 2,
      cpu: 'AMD EPYC 7763 64-Core Processor',
      reason: '',
    });
    expect(raw).toEqual({
      name: 'old',
      raw: weights,
      weights,
      files: 2,
      rawMs: 4_030,
      calibratedMs: 4_030,
      factor: 1,
      medianMs: null,
      cpu: '',
      reason: 'no calibration line',
    });
    expect(raw.weights).not.toBe(weights);
  });

  it("harvests raw a job whose calibration sits more than the outlier ratio from the run's median", () => {
    // The run's median (200 ms here) is a check, never a scale: a trusted job still scales by
    // its own line to the 178 ms reference, and exactly at the ratio (either side) is trusted.
    expect(CALIBRATION_OUTLIER_RATIO).toBe(2);
    const job = (name: string, medianMs: number) => ({
      name,
      weights: { [`tests/${name}.test.ts`]: 1_000 },
      calibration: parseCalibrationLine(LINE(medianMs)),
    });
    const results = calibrateJobs([
      job('a', 200),
      job('b', 200),
      job('c', 250),
      job('at_high', 400),
      job('at_low', 100),
      job('over', 401),
      job('under', 99),
    ]);
    const byName = Object.fromEntries(results.map((r) => [r.name, r]));
    expect(byName.c.weights).toEqual({ 'tests/c.test.ts': 712 });
    expect(byName.at_high.factor).toBe(0.445);
    expect(byName.at_low.factor).toBe(1.78);
    expect(byName.over).toMatchObject({ factor: 1, medianMs: null });
    expect(byName.over.weights).toEqual({ 'tests/over.test.ts': 1_000 });
    expect(byName.over.reason).toBe(
      "calibration 401 ms is more than 2 times from the run's median of 200 ms",
    );
    expect(byName.under).toMatchObject({ factor: 1, medianMs: null });
    // Under three calibrated jobs there is no run to judge against: this pair's fast job
    // sits more than twice under the pair's median (125 ms), and still scales by its line.
    const pair = calibrateJobs([job('a', 200), job('fast', 50)]);
    expect(pair[1].factor).toBe(3.56);
  });

  it('records every job in provenance, and a raw job as a warning naming it', () => {
    const job = (name: string, medianMs: number | null) => ({
      name,
      factor: medianMs === null ? 1 : CALIBRATION_REFERENCE_MS / medianMs,
      medianMs,
      cpu: medianMs === null ? '' : 'cpu',
      reason: medianMs === null ? 'no calibration line' : '',
    });
    // A factor is recorded to four places: 178 / 250 is 0.712, 178 / 160 is 1.1125, and
    // 178 / 534 (a third) is 0.3333.
    const all = calibrationProvenance([
      job('PR tests (1)', 250),
      job('PR long sims A', 160),
      job('PR long sims B', 534),
    ]);
    expect(all).toEqual({
      version: 'v1',
      referenceMs: 178,
      status: 'calibrated',
      jobs: {
        'PR tests (1)': { ms: 250, factor: 0.712, cpu: 'cpu' },
        'PR long sims A': { ms: 160, factor: 1.1125, cpu: 'cpu' },
        'PR long sims B': { ms: 534, factor: 0.3333, cpu: 'cpu' },
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
    // What it asks for: a re-base of the thresholds for a full change of scale, anchored or
    // not; with the reference anchored, another run for a harvest that is not calibrated in
    // full (the committed-table pin refuses that table, so a re-base would be wrong advice).
    const REBASE = 'so re-base what is set in the old unit in the same change';
    const ANOTHER_RUN =
      'with the reference anchored, the ratchet ceilings, LANE_THRESHOLD_MS and ' +
      'CARRIED_LOCAL_TO_CI_RATIO are set at the reference speed, so harvest a run whose every ' +
      'job printed a usable calibration line rather than re-base them';
    // A raw committed table replaced by a calibrated harvest: the change that anchors the
    // reference, where the re-base is due (anchored, the committed table is otherwise always
    // calibrated).
    for (const anchored of [false, true]) {
      expect(calibrationScaleNote({ run: '1' }, calibrated, { anchored })).toContain(REBASE);
    }
    // A partly raw table is never committed: replaced by a calibrated harvest, it set nothing,
    // so anchored the note says so (provisional, the partial prior still reads as a re-base).
    const fromPartial = [
      { calibration: { ...calibrated, status: 'partial' } },
      calibrated,
    ] as const;
    expect(calibrationScaleNote(...fromPartial, { anchored: true })).toBe(
      'the replaced table is in partly calibrated, partly raw and this harvest is in calibrated ' +
        'v1 at a 200 ms reference: a partly raw table is never committed, so no threshold was ' +
        'set in its unit: re-base nothing, and judge this table against the ceilings as they stand',
    );
    expect(calibrationScaleNote(...fromPartial, { anchored: false })).toContain(REBASE);
    const toPartial = [{ run: '1' }, { ...calibrated, status: 'partial' }] as const;
    expect(calibrationScaleNote(...toPartial, { anchored: false })).toContain(REBASE);
    expect(calibrationScaleNote(...toPartial, { anchored: true })).toBe(
      `the replaced table is in raw runner time and this harvest is in partly calibrated, ` +
        `partly raw: ${ANOTHER_RUN}`,
    );
    expect(
      calibrationScaleNote(
        { calibration: calibrated },
        { ...calibrated, status: 'raw' },
        {
          anchored: true,
        },
      ),
    ).toContain(ANOTHER_RUN);
    // The live default is anchored.
    expect(calibrationScaleNote(...toPartial)).toContain(ANOTHER_RUN);
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

describe('a table stands only in the unit its thresholds are set in', () => {
  const live = { version: CALIBRATION_VERSION, referenceMs: CALIBRATION_REFERENCE_MS };
  // A calibrated block as the harvest writes it: every job named with its line and factor.
  const calibratedBlock = {
    ...live,
    status: 'calibrated',
    jobs: { 'PR tests (1)': { ms: 178, factor: 1 } },
  };
  const HARVEST_CALIBRATED = 'harvest a run whose every job printed a usable calibration line';
  const rawUnit = (what: string) =>
    `rows in raw runner time (${what}) while CALIBRATION_REFERENCE_MS is anchored: the ratchet ` +
    `ceilings are set at the reference speed, so ${HARVEST_CALIBRATED}`;

  it('while the reference is provisional, holds a raw or pre-calibration table to nothing and refuses calibrated rows', () => {
    const provisional = { anchored: false };
    expect(calibrationTableDefects(undefined, provisional)).toEqual([]);
    expect(calibrationTableDefects({ run: '1' }, provisional)).toEqual([]);
    expect(calibrationTableDefects({ calibration: { status: 'raw' } }, provisional)).toEqual([]);
    for (const status of ['calibrated', 'partial']) {
      const defects = calibrationTableDefects({ calibration: { ...live, status } }, provisional);
      expect(defects).toHaveLength(1);
      expect(defects[0]).toMatch(/^calibrated rows while CALIBRATION_REFERENCE_MS is provisional/);
    }
  });

  it('once anchored, stands a calibrated table and refuses a raw, partial or pre-calibration one', () => {
    const anchored = { anchored: true };
    expect(calibrationTableDefects({ calibration: calibratedBlock }, anchored)).toEqual([]);
    // A table harvested before calibration existed, or with a block that is not an object.
    expect(calibrationTableDefects(undefined, anchored)).toEqual([rawUnit('no calibration block')]);
    expect(calibrationTableDefects({ run: '1' }, anchored)).toEqual([
      rawUnit('no calibration block'),
    ]);
    expect(calibrationTableDefects({ calibration: 'calibrated' }, anchored)).toEqual([
      rawUnit('no calibration block'),
    ]);
    expect(calibrationTableDefects({ calibration: { ...live, status: 'raw' } }, anchored)).toEqual([
      rawUnit('status raw'),
    ]);
    // A partial harvest (some jobs raw) and any status the harvest does not write.
    for (const status of ['partial', 'unknown']) {
      expect(calibrationTableDefects({ calibration: { ...live, status } }, anchored)).toEqual([
        `calibration status ${status} while CALIBRATION_REFERENCE_MS is anchored: rows not all ` +
          'at the reference speed (__provenance.calibration.raw names any raw job), so ' +
          HARVEST_CALIBRATED,
      ]);
    }
  });

  it('once anchored, refuses a calibrated block no harvest writes (a raw map, a warning, no job)', () => {
    const edited =
      'calibration status calibrated but the block names raw jobs, carries a warning or names ' +
      'no calibrated job, which no harvest writes: re-harvest rather than edit the block';
    const anchored = { anchored: true };
    for (const block of [
      { ...calibratedBlock, raw: { 'PR tests (2)': 'no calibration line' } },
      { ...calibratedBlock, raw: {} },
      { ...calibratedBlock, jobs: {} },
      { ...live, status: 'calibrated' },
      { ...calibratedBlock, jobs: 'PR tests (1)' },
      { ...calibratedBlock, jobs: [{ ms: 178, factor: 1 }] },
      { ...calibratedBlock, warning: '1 of 10 job(s) harvested RAW' },
    ]) {
      expect(calibrationTableDefects({ calibration: block }, anchored)).toEqual([edited]);
    }
  });

  it('holds calibrated rows to the live version and reference, anchored or not', () => {
    for (const anchored of [false, true]) {
      const stale = calibrationTableDefects(
        { calibration: { status: 'calibrated', version: 'v0', referenceMs: 180 } },
        { anchored },
      );
      expect(stale).toContain(`calibration v0 is not the live ${CALIBRATION_VERSION}`);
      expect(stale).toContain(
        `calibration reference 180 ms is not the live ${CALIBRATION_REFERENCE_MS} ms`,
      );
    }
  });

  it('judges by the live CALIBRATION_REFERENCE_ANCHORED when no anchoring is given', () => {
    // Anchored: calibrated rows at the live constants stand and a pre-calibration table does not.
    expect(calibrationTableDefects({ calibration: calibratedBlock })).toEqual([]);
    expect(calibrationTableDefects({ run: '1' })).toEqual([rawUnit('no calibration block')]);
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
