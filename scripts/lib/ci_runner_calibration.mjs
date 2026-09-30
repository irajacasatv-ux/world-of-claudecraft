// Runner-speed calibration for the CI test legs and the shard-weight harvest.
//
// Why: per-file weights are wall-clock test time on whichever runner a job drew,
// and runner speed moves every file of a job together. Across the 24 shard jobs
// of green full-mode runs 36648684156, 36654475632 and 36658730347 a job's
// median per-file ratio to the same files elsewhere ran 0.67 to 1.19, which
// swung the harvested shard pool 14.4 percent (4,562,805 to 5,221,653 ms) on
// nearly one tree and left a table that inherits its harvest jobs' speeds.
//
// How: every CI vitest leg (scripts/ci_shard_test.mjs) runs a short, fixed,
// deterministic CPU workload before its tests and prints ONE line with the
// median round time. The harvest (scripts/ci_shard_weights_harvest.mjs) reads
// that line per job and scales the job's weights by
// CALIBRATION_REFERENCE_MS / measured, so every row lands at one fixed
// reference speed. The factor is absolute per job, never a ratio to the previous
// table or a median across jobs: a real code slowdown moves the test time and
// not the calibration, so it still shows in the pools the ratchet reads.
//
// The version couples the workload to the reference: changing calibrationWork,
// CALIBRATION_ITERATIONS or CALIBRATION_ROUNDS changes what a reference
// millisecond means, so it bumps CALIBRATION_VERSION, and the parser treats any
// other version, or a line whose checksum is not CALIBRATION_CHECKSUM (the
// workload changed under the same version), as no calibration (raw, loudly).

import {
  CI_LONG_SUITES,
  LANE_POOL_CEILING_MS,
  poolWeights,
  SHARD_POOL_CEILING_MS,
} from './ci_shard_plan.mjs';

/** The workload's version, printed in the line and required by the parser. */
export const CALIBRATION_VERSION = 'v1';

/**
 * Iterations of calibrationWork per round: 150 to 250 ms a round on the
 * maintainer's desktop (an i9-10900K under varying load), 0.9 to 1.4 s for the
 * whole calibration with its warm-up.
 */
export const CALIBRATION_ITERATIONS = 600_000;

/** Timed rounds, after one untimed warm-up round; the line reports their median. */
export const CALIBRATION_ROUNDS = 5;

/**
 * The fixed reference speed, as a median round time in ms: a job whose median
 * round took this long keeps its weights as measured, a slower job's weights
 * scale down, a faster job's up. PROVISIONAL until the first calibrated CI runs
 * (a round figure within the desktop's range above; no hosted runner has
 * printed a line yet): anchor it ONCE to the median calibration those runs
 * print (`--report`) and set CALIBRATION_REFERENCE_ANCHORED, before the first
 * calibrated harvest is committed, and never move it after, since moving it
 * rescales every future table against the thresholds set in its unit.
 */
export const CALIBRATION_REFERENCE_MS = 200;

/**
 * Whether CALIBRATION_REFERENCE_MS has been anchored to hosted-runner evidence.
 * Until it is, a table with calibrated rows fails calibrationTableDefects, so
 * tests/ci_shard_partition.test.ts refuses to let one be committed (the harvest
 * still writes it for inspection and says so, and `--report` prints the same
 * figures without writing): the reference sets the unit of every calibrated
 * table, and the lane rule's LANE_THRESHOLD_MS, the carried-row
 * CARRIED_LOCAL_TO_CI_RATIO and the ratchet's ceilings
 * (scripts/lib/ci_shard_plan.mjs) are all set in raw CI time, so the first
 * calibrated harvest re-bases them in the same change.
 */
export const CALIBRATION_REFERENCE_ANCHORED = false;

/**
 * The checksum of CALIBRATION_ITERATIONS of calibrationWork: a line printing any
 * other ran a different workload than the reference is for.
 */
export const CALIBRATION_CHECKSUM = 0x8e85df4d;

/** The line's fixed prefix, which the parser anchors on. */
export const CALIBRATION_LINE_PREFIX = '[ci-calibration]';

/**
 * The fixed workload: a seeded mix of what the suite spends its time on (short
 * lived objects and arrays for the collector, Map traffic, float and integer
 * arithmetic, a sort, string building and hashing). Integer and IEEE double
 * operations only, so the checksum is the same on every machine and proves the
 * work was done (and not optimized away).
 *
 * @param {number} iterations
 * @returns {number} an unsigned 32-bit checksum
 */
export function calibrationWork(iterations) {
  let seed = 0x9e3779b9;
  const next = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed;
  };
  let acc = 0;
  const map = new Map();
  for (let i = 0; i < iterations; i++) {
    const r = next();
    map.set(r & 4095, { a: r & 0xffff, b: r >>> 16, c: [r & 7, (r >>> 3) & 7] });
    const other = map.get((r >>> 5) & 4095);
    if (other !== undefined) acc = (acc + other.a * 31 + other.c[1]) >>> 0;
    let x = (r & 1023) / 1024 + 1;
    for (let k = 0; k < 8; k++) x = x * 1.0001 + 1 / x;
    acc = (acc ^ Math.floor(x * 1000)) >>> 0;
    if ((i & 255) === 0) {
      const arr = [];
      for (let k = 0; k < 256; k++) arr.push(next() & 0xffff);
      arr.sort((p, q) => p - q);
      acc = (acc + arr[128]) >>> 0;
      const str = arr.slice(0, 32).join(',');
      for (let k = 0; k < str.length; k++) {
        acc = (Math.imul(acc, 16777619) ^ str.charCodeAt(k)) >>> 0;
      }
    }
  }
  return acc >>> 0;
}

/** Median of a non-empty list. */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Run the calibration: one warm-up round, then `rounds` timed rounds of the same
 * work. `now` returns nanoseconds as a bigint (process.hrtime.bigint by default)
 * and is injectable so the timing arithmetic is testable without a real clock.
 *
 * @param {{ iterations?: number, rounds?: number, now?: () => bigint }} [opts]
 * @returns {{ medianMs: number, roundsMs: number[], checksum: number }}
 */
export function runCalibration(opts = {}) {
  const iterations = opts.iterations ?? CALIBRATION_ITERATIONS;
  const rounds = opts.rounds ?? CALIBRATION_ROUNDS;
  const now = opts.now ?? (() => process.hrtime.bigint());
  const checksum = calibrationWork(iterations);
  const roundsMs = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = now();
    const sum = calibrationWork(iterations);
    const t1 = now();
    if (sum !== checksum) throw new Error('calibration: the workload is not deterministic');
    roundsMs.push(Math.round(Number(t1 - t0) / 1e5) / 10);
  }
  return { medianMs: Math.round(median(roundsMs) * 10) / 10, roundsMs, checksum };
}

/**
 * The one line a CI leg prints, for example
 * `[ci-calibration] v1 median-ms=201.3 rounds-ms=199.8,201.3,203.0,200.4,204.1 checksum=8e85df4d cpu="AMD EPYC 7763 64-Core Processor"`.
 * The cpu field is diagnostic only (runner hardware clusters); quotes in it are
 * dropped so the field always closes.
 *
 * @param {{ medianMs: number, roundsMs: readonly number[], checksum: number, cpu?: string }} c
 * @returns {string}
 */
export function formatCalibrationLine({ medianMs, roundsMs, checksum, cpu = '' }) {
  const hex = checksum.toString(16).padStart(8, '0');
  const model = String(cpu)
    .replace(/["\r\n]/g, '')
    .trim();
  return (
    `${CALIBRATION_LINE_PREFIX} ${CALIBRATION_VERSION} median-ms=${medianMs.toFixed(1)} ` +
    `rounds-ms=${roundsMs.map((ms) => ms.toFixed(1)).join(',')} checksum=${hex} cpu="${model}"`
  );
}

const LINE =
  /\[ci-calibration\] (\S+) median-ms=(\d+(?:\.\d+)?) \S+ checksum=([0-9a-f]{8}) cpu="([^"]*)"/;

/**
 * Read a job's calibration from its log text (the CI log's timestamp prefix
 * before the line is tolerated). The FIRST line counts:
 * the entry prints it before any test runs, so a later copy can only be test
 * output. Anything else is `ok: false` with the reason, never a guessed speed.
 *
 * @param {string} logText
 * @returns {{ ok: true, medianMs: number, cpu: string } | { ok: false, reason: string }}
 */
export function parseCalibrationLine(logText) {
  const at = logText.indexOf(CALIBRATION_LINE_PREFIX);
  if (at < 0) return { ok: false, reason: 'no calibration line' };
  const end = logText.indexOf('\n', at);
  const line = logText.slice(at, end < 0 ? undefined : end);
  const m = LINE.exec(line);
  if (!m) return { ok: false, reason: `malformed calibration line: ${line.slice(0, 120)}` };
  if (m[1] !== CALIBRATION_VERSION) {
    return {
      ok: false,
      reason: `calibration ${m[1]} is not ${CALIBRATION_VERSION}, the version the reference is for`,
    };
  }
  const expected = CALIBRATION_CHECKSUM.toString(16).padStart(8, '0');
  if (m[3] !== expected) {
    return {
      ok: false,
      reason: `calibration checksum ${m[3]} is not ${expected}, the ${CALIBRATION_VERSION} workload's`,
    };
  }
  const medianMs = Number(m[2]);
  if (!(medianMs > 0))
    return { ok: false, reason: `calibration median ${m[2]} ms is not positive` };
  return { ok: true, medianMs, cpu: m[4] };
}

/**
 * The factor that moves a job's weights to the reference speed.
 * @param {number} medianMs
 * @returns {number}
 */
export function calibrationFactor(medianMs) {
  return CALIBRATION_REFERENCE_MS / medianMs;
}

/**
 * A job's parsed weights scaled by `factor`, each a whole ms of at least 1.
 * @param {Readonly<Record<string, number>>} weights
 * @param {number} factor
 * @returns {Record<string, number>}
 */
export function scaleWeights(weights, factor) {
  const out = {};
  for (const [file, ms] of Object.entries(weights))
    out[file] = Math.max(1, Math.round(ms * factor));
  return out;
}

/**
 * How far one job's calibration may sit from its run's median calibration
 * before the harvest distrusts it. Across the 24 shard jobs of runs
 * 36648684156, 36654475632 and 36658730347 the jobs' test-time speeds spanned
 * 0.67 to 1.19 of their mean, so no real runner sat 1.5 times from its run's
 * median; a calibration twice as far or more measured a throttled or
 * disturbed second, not the runner the tests then ran on. The run's median is
 * a CHECK here, never a scale: a trusted job still scales by its own line.
 */
export const CALIBRATION_OUTLIER_RATIO = 2;

/**
 * Every job's contribution to the harvest, in input order: its rows at the
 * reference speed when its calibration parsed and sits within
 * CALIBRATION_OUTLIER_RATIO of the run's median calibration (judged once three
 * or more jobs calibrated), else its raw rows (factor 1) and the reason, which
 * the harvest records as a loud warning.
 *
 * @param {ReadonlyArray<{ name: string, weights: Readonly<Record<string, number>>,
 *   calibration: ReturnType<typeof parseCalibrationLine> }>} jobs
 * @returns {Array<{ name: string, raw: Record<string, number>, weights: Record<string, number>,
 *   files: number, rawMs: number, calibratedMs: number, factor: number,
 *   medianMs: number | null, cpu: string, reason: string }>}
 */
export function calibrateJobs(jobs) {
  const medians = jobs.filter((j) => j.calibration.ok).map((j) => j.calibration.medianMs);
  const runMedian = medians.length >= 3 ? median(medians) : null;
  const sum = (rows) => Object.values(rows).reduce((a, ms) => a + ms, 0);
  return jobs.map(({ name, weights, calibration }) => {
    let reason = calibration.ok ? '' : calibration.reason;
    if (
      calibration.ok &&
      runMedian !== null &&
      (calibration.medianMs > runMedian * CALIBRATION_OUTLIER_RATIO ||
        calibration.medianMs * CALIBRATION_OUTLIER_RATIO < runMedian)
    ) {
      reason =
        `calibration ${calibration.medianMs} ms is more than ${CALIBRATION_OUTLIER_RATIO} ` +
        `times from the run's median of ${runMedian} ms`;
    }
    const raw = { ...weights };
    if (reason !== '') {
      return {
        name,
        raw,
        weights: { ...weights },
        files: Object.keys(raw).length,
        rawMs: sum(raw),
        calibratedMs: sum(raw),
        factor: 1,
        medianMs: null,
        cpu: '',
        reason,
      };
    }
    const factor = calibrationFactor(calibration.medianMs);
    const scaled = scaleWeights(weights, factor);
    return {
      name,
      raw,
      weights: scaled,
      files: Object.keys(raw).length,
      rawMs: sum(raw),
      calibratedMs: sum(scaled),
      factor,
      medianMs: calibration.medianMs,
      cpu: calibration.cpu,
      reason: '',
    };
  });
}

/**
 * The harvest's `__provenance.calibration` block from its per-job results.
 * `status` is `calibrated` (every job), `partial` or `raw` (none); anything but
 * calibrated carries a `warning` naming the raw jobs, because their rows are in
 * that runner's time, not the reference's.
 *
 * @param {ReadonlyArray<{ name: string, factor: number, medianMs: number | null, cpu: string, reason: string }>} jobs
 */
export function calibrationProvenance(jobs) {
  const calibrated = {};
  const raw = {};
  for (const job of jobs) {
    if (job.medianMs === null) raw[job.name] = job.reason;
    else {
      calibrated[job.name] = {
        ms: job.medianMs,
        factor: Math.round(job.factor * 10_000) / 10_000,
        ...(job.cpu ? { cpu: job.cpu } : {}),
      };
    }
  }
  const rawNames = Object.keys(raw);
  const status =
    rawNames.length === jobs.length ? 'raw' : rawNames.length === 0 ? 'calibrated' : 'partial';
  return {
    version: CALIBRATION_VERSION,
    referenceMs: CALIBRATION_REFERENCE_MS,
    status,
    jobs: calibrated,
    ...(rawNames.length > 0
      ? {
          raw,
          warning:
            `${rawNames.length} of ${jobs.length} job(s) harvested RAW (no usable calibration): ` +
            `${rawNames.join(', ')}. Their rows are in that runner's time, not the reference ` +
            "speed's, so this table's pools are not comparable with a calibrated harvest's.",
        }
      : {}),
  };
}

/** How a table's rows are scaled, as one comparable phrase. */
function scaleOf(calibration) {
  if (!calibration || typeof calibration !== 'object' || calibration.status === 'raw') {
    return 'raw runner time';
  }
  if (calibration.status === 'partial') return 'partly calibrated, partly raw';
  return `calibrated ${calibration.version} at a ${calibration.referenceMs} ms reference`;
}

/**
 * The note the harvest prints when the table it replaces was measured on a
 * different scale (an old raw table, a partial harvest, another version or
 * reference): the pools then move by the change of scale, not by the suite, so
 * the ratchet's ceilings need a maintainer's re-base rather than a reading as
 * growth or a cut. Null when both tables share one full scale.
 *
 * @param {Record<string, unknown> | undefined} priorProvenance the replaced table's __provenance
 * @param {{ status: string, version: string, referenceMs: number }} next this harvest's block
 * @returns {string | null}
 */
export function calibrationScaleNote(priorProvenance, next) {
  const was = scaleOf(priorProvenance?.calibration);
  const now = scaleOf(next);
  if (was === now && next.status !== 'partial') return null;
  return (
    `the replaced table is in ${was} and this harvest is in ${now}: its rows change scale, ` +
    'so re-base what is set in the old unit in the same change (the ratchet ceilings, ' +
    'LANE_THRESHOLD_MS and CARRIED_LOCAL_TO_CI_RATIO) rather than read the move as growth or a cut'
  );
}

/**
 * What stops a table's calibration block from standing: calibrated rows (status
 * `calibrated` or `partial`) written while CALIBRATION_REFERENCE_ANCHORED is
 * false, or at another version or reference than the live constants, so a moved
 * reference cannot leave a committed table in a unit nothing names. A raw table
 * (or one with no block, harvested before calibration existed) has none. The
 * harvest prints any it writes, and tests/ci_shard_partition.test.ts holds the
 * committed table to none.
 *
 * @param {Record<string, any> | undefined} provenance a table's __provenance
 * @returns {string[]}
 */
export function calibrationTableDefects(provenance) {
  const cal = provenance?.calibration;
  if (!cal || typeof cal !== 'object' || cal.status === 'raw') return [];
  const defects = [];
  if (!CALIBRATION_REFERENCE_ANCHORED) {
    defects.push(
      'calibrated rows while CALIBRATION_REFERENCE_MS is provisional: anchor it to the ' +
        'median calibration the --report of the first calibrated runs prints, set ' +
        'CALIBRATION_REFERENCE_ANCHORED, and re-base the raw-time thresholds in the same change',
    );
  }
  if (cal.version !== CALIBRATION_VERSION) {
    defects.push(`calibration ${cal.version} is not the live ${CALIBRATION_VERSION}`);
  }
  if (cal.referenceMs !== CALIBRATION_REFERENCE_MS) {
    defects.push(
      `calibration reference ${cal.referenceMs} ms is not the live ${CALIBRATION_REFERENCE_MS} ms`,
    );
  }
  return defects;
}

/**
 * The `--report` view of one run, without writing anything: per job its
 * calibration, factor and summed test time raw and calibrated, then the shard
 * pool and the lane pool raw and calibrated beside the ratchet's ceilings (summed
 * as the ratchet sums a table: poolWeights over CI_LONG_SUITES; a harvest has no
 * carried rows). Plain integers, one fact per line, so runs compare by grep.
 *
 * @param {{
 *   runId: string,
 *   jobs: ReadonlyArray<{ name: string, files: number, rawMs: number, calibratedMs: number,
 *     factor: number, medianMs: number | null, cpu: string, reason: string }>,
 *   rawWeights: Readonly<Record<string, number>>,
 *   calibratedWeights: Readonly<Record<string, number>>,
 * }} input
 * @returns {string[]}
 */
export function calibrationReportLines({ runId, jobs, rawWeights, calibratedWeights }) {
  const prov = calibrationProvenance(jobs);
  const lines = [
    `[report] run ${runId}: calibration ${prov.version}, reference ${prov.referenceMs} ms, ` +
      `status ${prov.status}`,
  ];
  for (const job of jobs) {
    lines.push(
      job.medianMs === null
        ? `[report]   ${job.name}: RAW (${job.reason}), ${job.files} files, raw ${job.rawMs} ms`
        : `[report]   ${job.name}: median ${job.medianMs.toFixed(1)} ms, factor ` +
            `${job.factor.toFixed(4)}, ${job.files} files, raw ${job.rawMs} ms, calibrated ` +
            `${job.calibratedMs} ms${job.cpu ? `, cpu ${job.cpu}` : ''}`,
    );
  }
  const medians = jobs.map((j) => j.medianMs).filter((ms) => ms !== null);
  if (medians.length > 0) {
    lines.push(
      `[report] run ${runId} calibration medians: min ${Math.min(...medians).toFixed(1)} ms, ` +
        `median ${median(medians).toFixed(1)} ms, max ${Math.max(...medians).toFixed(1)} ms`,
    );
  }
  const raw = poolWeights(rawWeights, {}, CI_LONG_SUITES);
  const cal = poolWeights(calibratedWeights, {}, CI_LONG_SUITES);
  lines.push(
    `[report] run ${runId} shard pool: raw ${raw.shard} ms, calibrated ${cal.shard} ms ` +
      `(ceiling ${SHARD_POOL_CEILING_MS} ms)`,
    `[report] run ${runId} lane pool: raw ${raw.lane} ms, calibrated ${cal.lane} ms ` +
      `(ceiling ${LANE_POOL_CEILING_MS} ms)`,
  );
  if (prov.warning) lines.push(`[report] WARNING: ${prov.warning}`);
  return lines;
}
