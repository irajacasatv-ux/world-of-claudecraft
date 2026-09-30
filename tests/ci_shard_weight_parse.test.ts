import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CALIBRATION_CHECKSUM,
  CALIBRATION_REFERENCE_MS,
  type CalibrationProvenance,
  formatCalibrationLine,
} from '../scripts/lib/ci_runner_calibration.mjs';
import { SHARD_LOG_FILE_FLOOR } from '../scripts/lib/ci_shard_weight_harvest_guard.mjs';
import { parseWeightLines, SKIPPED_FILE_WEIGHT_MS } from '../scripts/lib/ci_shard_weight_parse.mjs';

const harvestIo = vi.hoisted(() => ({
  execFileSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({ execFileSync: harvestIo.execFileSync }));
vi.mock('node:fs', () => ({
  readFileSync: harvestIo.readFileSync,
  writeFileSync: harvestIo.writeFileSync,
}));

const ESC = String.fromCharCode(27);

// The line every CI leg prints before its tests (scripts/lib/ci_runner_calibration.mjs).
// The rigs below print it at the reference median (factor 1), as a current run does, so
// the cases about other provenance stay free of the raw-harvest warning.
const calibrationLine = (medianMs: number) =>
  formatCalibrationLine({
    medianMs,
    roundsMs: [medianMs],
    checksum: CALIBRATION_CHECKSUM,
    cpu: 'rig cpu',
  });
const REFERENCE_LINE = calibrationLine(CALIBRATION_REFERENCE_MS);

describe('ci shard weight log parser', () => {
  it('parses both ANSI encodings, both duration units, and skip-count lines', () => {
    const log = [
      `${ESC}[32m\u2713${ESC}[39m tests/a.test.ts ${ESC}[2m(${ESC}[22m12 tests${ESC}[2m)${ESC}[22m 159${ESC}[2mms${ESC}[22m`,
      '^[[32m\u2713^[[39m tests/b.test.ts ^[[2m(^[[22m3 tests | 2 skipped^[[2m)^[[22m 2.5^[[2ms^[[22m',
      'not a reporter line at all',
    ].join('\n');
    expect(parseWeightLines(log)).toEqual({ 'tests/a.test.ts': 159, 'tests/b.test.ts': 2500 });
  });

  it('keeps the MAX across repeated occurrences', () => {
    const into = parseWeightLines('\u2713 tests/a.test.ts (1 tests) 100ms');
    parseWeightLines('\u2713 tests/a.test.ts (1 tests) 90ms', into);
    parseWeightLines('\u2713 tests/a.test.ts (1 tests) 140ms', into);
    expect(into['tests/a.test.ts']).toBe(140);
  });

  it('records a small floor for fully-skipped files instead of omitting them', () => {
    // Permanently-skipped suites (no-database integration files) previously
    // never entered the table and fell to the unknown-file fallback forever.
    const into = parseWeightLines('\u2193 tests/db_integration.test.ts (9 tests | 9 skipped)');
    expect(into['tests/db_integration.test.ts']).toBe(SKIPPED_FILE_WEIGHT_MS);
    // A later RAN occurrence still wins over the skip floor.
    parseWeightLines('\u2713 tests/db_integration.test.ts (9 tests) 800ms', into);
    expect(into['tests/db_integration.test.ts']).toBe(800);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CI shard weight harvester provenance', () => {
  // Shared rig: a green full-mode run with the 8 shards + 2 lanes, and a
  // fresh execution of the harvester (its whole body runs at import time, so
  // every test must reset the module registry before importing again).
  /** The same rig, with one shard's log truncated to `files` per-file lines.
   *  A full-mode `PR tests` shard that parses fewer than SHARD_LOG_FILE_FLOOR
   *  files is the 2026-08-28 regression that wrote an EMPTY table. */
  function primeShortShard(files: number) {
    const jobs = [
      ...Array.from({ length: 8 }, (_unused, i) => ({
        id: i + 1,
        name: `PR tests (${i + 1})`,
        conclusion: 'success',
      })),
      { id: 9, name: 'PR long sims', conclusion: 'success' },
      { id: 10, name: 'PR gate', conclusion: 'success' },
    ];
    const lines = (count: number) =>
      Array.from(
        { length: count },
        (_unused, i) => `\u2713 tests/example_${i}.test.ts (1 test) 20ms`,
      ).join('\n');
    let logCall = 0;
    harvestIo.execFileSync.mockImplementation((_file: string, args: string[]) => {
      if (args.includes('--json')) return JSON.stringify(jobs);
      logCall += 1;
      // The THIRD shard is the short one: a refusal must not depend on the
      // truncated shard being the first log the harvester reads.
      const count = logCall === 3 ? files : SHARD_LOG_FILE_FLOOR + 20;
      return `changes-job decision: mode=full\n${REFERENCE_LINE}\n${lines(count)}`;
    });
    harvestIo.writeFileSync.mockClear();
  }

  function primeGreenRun() {
    const jobs = [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `PR tests (${i + 1})`,
        conclusion: 'success',
      })),
      { id: 9, name: 'PR long sims', conclusion: 'success' },
      { id: 10, name: 'PR gate', conclusion: 'success' },
    ];
    // The per-file lines have to clear the harvester's short-shard floor: a
    // full-mode `PR tests` shard that parses fewer than SHARD_LOG_FILE_FLOOR files
    // is a reporter or fetch regression, and the harvester refuses to write the
    // table at all (scripts/lib/ci_shard_weight_harvest_guard.mjs). These cases
    // are about the provenance advisory, not about shard size, so the rig hands
    // each shard a plausible number of files. Do not shrink it back to one.
    const fileLines = Array.from(
      { length: SHARD_LOG_FILE_FLOOR + 20 },
      (_unused, i) => `\u2713 tests/example_${i}.test.ts (1 test) 20ms`,
    ).join('\n');
    harvestIo.execFileSync.mockImplementation((_file: string, args: string[]) =>
      args.includes('--json')
        ? JSON.stringify(jobs)
        : `changes-job decision: mode=full\n${REFERENCE_LINE}\n${fileLines}`,
    );
    harvestIo.writeFileSync.mockClear();
  }

  /** A green run whose job `id` printed a calibration line at `medianFor(id)` ms (none
   *  for null), each job with its own files at 40 ms, so the scaling reads per job. */
  function primeCalibratedRun(medianFor: (jobId: number) => number | null) {
    const jobs = [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `PR tests (${i + 1})`,
        conclusion: 'success',
      })),
      { id: 9, name: 'PR long sims A', conclusion: 'success' },
      { id: 10, name: 'PR long sims B', conclusion: 'success' },
    ];
    harvestIo.execFileSync.mockImplementation((_file: string, args: string[]) => {
      if (args.includes('--json')) return JSON.stringify(jobs);
      const id = Number(args[args.indexOf('--job') + 1]);
      const median = medianFor(id);
      const files = Array.from(
        { length: SHARD_LOG_FILE_FLOOR + 20 },
        (_unused, i) => `\u2713 tests/job${id}_${i}.test.ts (1 test) 40ms`,
      ).join('\n');
      const line = median === null ? '' : `${calibrationLine(median)}\n`;
      return `changes-job decision: mode=full\n${line}${files}`;
    });
    harvestIo.writeFileSync.mockClear();
  }

  async function runHarvester(args: string[] = ['123456789']) {
    vi.resetModules();
    const priorArgs = process.argv.slice(2);
    process.argv.splice(2, process.argv.length - 2, ...args);
    try {
      // @ts-expect-error The executable intentionally has no public module API.
      await import('../scripts/ci_shard_weights_harvest.mjs');
    } finally {
      process.argv.splice(2, process.argv.length - 2, ...priorArgs);
    }
  }

  const writtenTable = () => {
    const { __provenance, ...rows } = JSON.parse(
      String(harvestIo.writeFileSync.mock.calls[0]?.[1]),
    ) as { __provenance: { calibration: CalibrationProvenance } } & Record<string, unknown>;
    return { rows: rows as Record<string, number>, calibration: __provenance.calibration };
  };

  it("scales each job's rows by its OWN calibration line, and a job without one raw and loudly", async () => {
    // Job 1 ran on a runner twice the reference's time (rows halve), job 2 on one twice as
    // fast (rows double), job 3 printed no line (raw, warned), the rest at the reference.
    primeCalibratedRun((id) =>
      id === 1
        ? CALIBRATION_REFERENCE_MS * 2
        : id === 2
          ? CALIBRATION_REFERENCE_MS / 2
          : id === 3
            ? null
            : CALIBRATION_REFERENCE_MS,
    );
    harvestIo.readFileSync.mockReturnValue(JSON.stringify({ __provenance: { run: '1' } }));
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runHarvester();

    const { rows, calibration } = writtenTable();
    expect(rows['tests/job1_0.test.ts']).toBe(20);
    expect(rows['tests/job2_0.test.ts']).toBe(80);
    expect(rows['tests/job3_0.test.ts']).toBe(40);
    expect(rows['tests/job4_0.test.ts']).toBe(40);
    expect(calibration.status).toBe('partial');
    expect(calibration.referenceMs).toBe(CALIBRATION_REFERENCE_MS);
    expect(calibration.jobs['PR tests (1)']).toEqual({
      ms: CALIBRATION_REFERENCE_MS * 2,
      factor: 0.5,
      cpu: 'rig cpu',
    });
    expect(calibration.raw).toEqual({ 'PR tests (3)': 'no calibration line' });
    expect(calibration.warning).toContain('PR tests (3)');
    const warned = warns.mock.calls.map(([line]) => String(line)).join('\n');
    expect(warned).toContain('[harvest] WARNING: 1 of 10 job(s) harvested RAW');
    // The replaced table was raw, so the change of scale is named too, and while the
    // reference is provisional the committed-table pin's refusal is announced.
    const logged = logs.mock.calls.map(([line]) => String(line)).join('\n');
    expect(logged).toContain('[harvest] NOTE: the replaced table is in raw runner time');
    expect(logged).toContain(
      '[harvest] NOTE: tests/ci_shard_partition.test.ts refuses this table until fixed: ' +
        'calibrated rows while CALIBRATION_REFERENCE_MS is provisional',
    );
  });

  it('harvests an old run with no calibration line at all raw, and says so in provenance', async () => {
    primeCalibratedRun(() => null);
    harvestIo.readFileSync.mockReturnValue(JSON.stringify({ __provenance: { run: '1' } }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runHarvester();

    const { rows, calibration } = writtenTable();
    expect(rows['tests/job1_0.test.ts']).toBe(40);
    expect(calibration.status).toBe('raw');
    expect(calibration.warning).toContain('10 of 10 job(s) harvested RAW');
    expect(warns).toHaveBeenCalled();
  });

  it("harvests raw, loudly, a job whose calibration is far from the run's others", async () => {
    // A runner throttled for its calibration second but not for its tests: five times the
    // run's median would scale its rows by a fifth, so it is distrusted instead.
    primeCalibratedRun((id) =>
      id === 4 ? CALIBRATION_REFERENCE_MS * 5 : CALIBRATION_REFERENCE_MS,
    );
    harvestIo.readFileSync.mockReturnValue(JSON.stringify({ __provenance: { run: '1' } }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runHarvester();

    const { rows, calibration } = writtenTable();
    expect(rows['tests/job4_0.test.ts']).toBe(40);
    expect(calibration.status).toBe('partial');
    expect(calibration.raw?.['PR tests (4)']).toMatch(/more than 2 times from the run's median/);
    expect(warns.mock.calls.map(([line]) => String(line)).join('\n')).toContain('PR tests (4)');
  });

  it('--report counts in any position and never falls through to a write', async () => {
    primeCalibratedRun(() => CALIBRATION_REFERENCE_MS);
    harvestIo.readFileSync.mockReturnValue(JSON.stringify({ __provenance: { run: '1' } }));
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runHarvester(['123456789', '--report']);
    expect(harvestIo.writeFileSync).not.toHaveBeenCalled();
    expect(logs.mock.calls.map(([line]) => String(line))).toContain('[report] nothing written');
    // A second run id (or any stray argument) is a usage error, never a harvest.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const exited = new Error('process.exit');
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw exited;
    });
    await expect(runHarvester(['123456789', '987654321'])).rejects.toBe(exited);
    expect(exit).toHaveBeenCalledWith(1);
    expect(harvestIo.writeFileSync).not.toHaveBeenCalled();
    // Beside a maintenance mode that writes, the flag is refused, not ignored.
    await expect(runHarvester(['--prune-missing', '--report'])).rejects.toBe(exited);
    expect(harvestIo.writeFileSync).not.toHaveBeenCalled();
  });

  it('--report prints the raw and calibrated pools and writes nothing', async () => {
    primeCalibratedRun(() => CALIBRATION_REFERENCE_MS * 2);
    harvestIo.readFileSync.mockReturnValue(JSON.stringify({ __provenance: { run: '1' } }));
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runHarvester(['--report', '123456789']);

    expect(harvestIo.writeFileSync).not.toHaveBeenCalled();
    const printed = logs.mock.calls.map(([line]) => String(line));
    // Ten jobs of 120 files at 40 ms, none in the lane list: 48,000 ms raw, halved.
    expect(printed).toContain(
      `[report] run 123456789 shard pool: raw 48000 ms, calibrated 24000 ms (ceiling ${
        printed.join('\n').match(/shard pool: .*\(ceiling (\d+) ms\)/)?.[1]
      } ms)`,
    );
    expect(printed.some((l) => l.startsWith('[report]   PR tests (1): median 400.0 ms'))).toBe(
      true,
    );
    expect(printed).toContain('[report] nothing written');
  });

  it('reports the checked-in carried rows before replacing them', async () => {
    primeGreenRun();
    harvestIo.readFileSync.mockReturnValue(
      JSON.stringify({
        __provenance: {
          run: '32621561241',
          harvested: '2026-08-23',
          files: 3,
          harvestedFiles: 1,
          carried: {
            'tests/local.test.ts': {
              ms: 20,
              method: 'local-median',
              measured: '2026-08-24',
              reason: 'pending harvest',
              runs: [19, 20, 21],
            },
            'tests/backfill.test.ts': { ms: 7, method: 'prose-backfill' },
          },
          backfill: { date: '2026-08-31', note: 'legacy carry batch attribution' },
        },
      }),
    );
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runHarvester();

    const replacement = logs.mock.calls
      .map(([line]) => String(line))
      .find((line) => line.includes('carried weights'));
    expect(replacement).toContain('2 carried weights');
    expect(warns).not.toHaveBeenCalled();
    expect(harvestIo.writeFileSync).toHaveBeenCalledOnce();
  });

  it('speaks up on an unrecognized provenance shape instead of a silent discard', async () => {
    // An unknown provenance shape must warn before the rewrite discards it.
    primeGreenRun();
    harvestIo.readFileSync.mockReturnValue(
      JSON.stringify({
        __provenance: {
          run: '32621561241',
          harvested: '2026-08-23',
          files: 3188,
          merged: { at: '2026-08-24', rows: 46 },
        },
      }),
    );
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runHarvester();

    const warning = warns.mock.calls
      .map(([line]) => String(line))
      .find((line) => line.includes('unrecognized __provenance shape'));
    // Names the shape it could not parse and the consequence.
    expect(warning).toContain('merged');
    expect(warning).toContain('DISCARDS');
    // The current-schema advisory must NOT also fire.
    expect(
      logs.mock.calls.map(([line]) => String(line)).find((l) => l.includes('carried weights')),
    ).toBeUndefined();
    // The rewrite itself still proceeds: the arm warns, it does not block.
    expect(harvestIo.writeFileSync).toHaveBeenCalledOnce();
  });

  it('writes NOTHING when one shard parses under the floor', async () => {
    // The floor's placement is pinned by source text in
    // tests/ci_shard_weight_harvest_guard.test.ts, and source text cannot see
    // whether the refusal is REACHED: neutering the condition to `if (false &&
    // !verdict.ok)` leaves that pin green and ships the empty-table bug again.
    // This case runs the harvester and asserts the table is not written.
    primeShortShard(SHARD_LOG_FILE_FLOOR - 1);
    harvestIo.readFileSync.mockReturnValue(JSON.stringify({ __provenance: { run: '1' } }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exited = new Error('process.exit');
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw exited;
    });
    await expect(runHarvester()).rejects.toBe(exited);
    expect(exit).toHaveBeenCalledWith(1);
    expect(harvestIo.writeFileSync).not.toHaveBeenCalled();
    // And it says why, so the operator is not left with a silent no-op.
    expect(errors.mock.calls.map(([line]) => String(line)).join('\n')).toContain('floor');
  });

  it('writes the table when every shard clears the floor exactly', async () => {
    // The other arm of the same boundary: at the floor, not under it, the
    // harvest proceeds. Without this a refusal that fired on EVERY run would
    // satisfy the case above.
    primeShortShard(SHARD_LOG_FILE_FLOOR);
    harvestIo.readFileSync.mockReturnValue(JSON.stringify({ __provenance: { run: '1' } }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await runHarvester();
    expect(harvestIo.writeFileSync).toHaveBeenCalledOnce();
  });

  it('stays silent on the plain-harvest provenance this script writes itself', async () => {
    // A prior table with no carried rows needs neither advisory nor warning.
    primeGreenRun();
    harvestIo.readFileSync.mockReturnValue(
      JSON.stringify({
        __provenance: {
          run: '32621561241',
          harvested: '2026-08-23',
          files: 1,
          harvestedFiles: 1,
          carried: {},
        },
      }),
    );
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runHarvester();

    expect(
      logs.mock.calls.map(([line]) => String(line)).find((l) => l.includes('carried weights')),
    ).toBeUndefined();
    expect(warns.mock.calls).toHaveLength(0);
    expect(harvestIo.writeFileSync).toHaveBeenCalledOnce();
  });
});
