// Shared runner for the sharded parity gate: eleven shard files, each a single
// runParityShard(n) call over one CONTIGUOUS slice of SCENARIOS, so vitest can
// spread the recordings over parallel worker files. parity_a..g.test.ts are
// shards 0..6 and coverage_a..d.test.ts shards 7..10: the four coverage files
// keep their names (and with them their rows in the CI shard-weight table), but
// they are ordinary gate shards like the other seven. Nothing about what is
// recorded, how goldens resolve, or how UPDATE_PARITY mints changes: each shard
// mints exactly its own slice's goldens into the same tests/parity/golden dir.
//
// For every scenario a shard runs, in order:
//   1. The GATE case, one case over two recordings, asserting:
//      (a) INTERNALLY DETERMINISTIC: recording the same scenario twice is
//          identical. Besides proving the harness adds no nondeterminism, this
//          pair is the one check that sees state leaking from one Sim into the
//          next Sim in the same process when only this scenario touches it (a
//          module-level counter or cache the first recording writes and the
//          second reads). The golden comparison alone misses that class: the
//          first recording of a file's only reader of the leaked state still
//          matches the golden (tests/parity/CLAUDE.md, "The determinism pair").
//      (b) MATCHES THE COMMITTED GOLDEN: the first recording equals the
//          checked-in golden. A minting run proves (a) first, so a
//          nondeterministic trace is never written as a golden.
//   2. That scenario's COVERAGE cases (coverage_cases_a..d.ts), each proving the
//      scenario actually fires its subsystem. They read the gate's FIRST
//      recording (recording_cache.ts) rather than recording the scenario a
//      third time; a case that reads several scenarios runs after the last of
//      them, so all of its recordings are still held.
//
// A red trace means behavior changed. Fix the change, NOT the harness. Regenerate
// goldens deliberately and reviewably with `UPDATE_PARITY=1 npx vitest run
// tests/parity` as its own commit.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { coverageCasesA } from './coverage_cases_a';
import { coverageCasesB } from './coverage_cases_b';
import { coverageCasesC } from './coverage_cases_c';
import { coverageCasesD } from './coverage_cases_d';
import type { Scenario } from './record';
import { record, recordTrace } from './record';
import {
  type CoverageIt,
  heldRecordingNames,
  holdRecording,
  readingOnly,
  releaseRecording,
} from './recording_cache';
import { SCENARIOS } from './scenarios';
import type { Trace } from './trace';

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = join(HERE, 'golden');
const UPDATE = process.env.UPDATE_PARITY === '1';

function goldenPath(name: string): string {
  return join(GOLDEN_DIR, `${name}.json`);
}

// Normalize through JSON so the in-memory trace and the parsed golden compare as
// plain data (undefined-vs-missing and key order can't matter).
function plain(trace: Trace): unknown {
  return JSON.parse(JSON.stringify(trace));
}

// ---------------------------------------------------------------------------
// Coverage cases: which scenarios each one reads.
// ---------------------------------------------------------------------------

// Every coverage case reads exactly the scenario its title names before the
// first colon, except the ones listed here, which read several (the runner
// schedules each after the last scenario it names, in SCENARIOS order).
const MULTI_SCENARIO_CASES: ReadonlyMap<string, readonly string[]> = new Map([
  [
    'hit_rating_heroic pair: gear changes the threshold, never the RNG draw order',
    ['hit_rating_heroic_ungeared', 'hit_rating_heroic_geared'],
  ],
  [
    'the four rift reward scenarios cover four DISTINCT ranks',
    ['rift_clear_rewards_c', 'rift_clear_rewards_b', 'rift_clear_rewards', 'rift_clear_rewards_s'],
  ],
]);

interface CoverageCase {
  title: string;
  fn: () => void;
  timeout: number;
  reads: ReadonlySet<string>;
  // Index into SCENARIOS of the last scenario it reads: it runs after that
  // scenario's gate case.
  after: number;
}

// A coverage case normally records nothing, but run alone (a `-t` filter that
// skips the gate case) it records its scenarios itself, and the heavy ones
// (nythraxis_full_pull alone records a full raid pull) brush the global 20 s
// budget under parallel-worker contention, the pathology the gate's 90 s
// timeout was minted for. A genuine hang still fails.
const COVERAGE_TIMEOUT_MS = 90_000;

function collectCoverageCases(): CoverageCase[] {
  const index = new Map(SCENARIOS.map((s, i) => [s.name, i]));
  const cases: CoverageCase[] = [];
  const titles = new Set<string>();
  const usedMulti = new Set<string>();
  const register: CoverageIt = (title, fn, timeout) => {
    if (titles.has(title)) throw new Error(`duplicate coverage case title: ${title}`);
    titles.add(title);
    const multi = MULTI_SCENARIO_CASES.get(title);
    if (multi) usedMulti.add(title);
    const colon = title.indexOf(':');
    const names = multi ?? (colon > 0 ? [title.slice(0, colon)] : []);
    if (names.length === 0) {
      throw new Error(`coverage case "${title}" names no scenario: start it with "<scenario>:"`);
    }
    let after = -1;
    for (const name of names) {
      const i = index.get(name);
      if (i === undefined)
        throw new Error(`coverage case "${title}" reads unknown scenario ${name}`);
      after = Math.max(after, i);
    }
    cases.push({
      title,
      fn,
      timeout: timeout ?? COVERAGE_TIMEOUT_MS,
      reads: new Set(names),
      after,
    });
  };
  coverageCasesA(register);
  coverageCasesB(register);
  coverageCasesC(register);
  coverageCasesD(register);
  for (const title of MULTI_SCENARIO_CASES.keys()) {
    if (!usedMulti.has(title)) throw new Error(`MULTI_SCENARIO_CASES names no case: ${title}`);
  }
  return cases;
}

const COVERAGE_CASES = collectCoverageCases();

// For each scenario: the coverage case (by position in COVERAGE_CASES) that
// reads it LAST in run order, after which its held recording is released. Run
// order is scenario order, then registration order within one scenario.
const RUN_ORDER = COVERAGE_CASES.map((c, i) => ({ c, i })).sort(
  (x, y) => x.c.after - y.c.after || x.i - y.i,
);
const LAST_READER = new Map<string, number>();
for (const { c, i } of RUN_ORDER) for (const name of c.reads) LAST_READER.set(name, i);

// ---------------------------------------------------------------------------
// Shards.
// ---------------------------------------------------------------------------

// Contiguous shard boundaries over SCENARIOS, timing-balanced by MEASURED
// per-scenario cost (not by scenario count). Re-derived 2026-09-28, when the
// coverage cases moved onto the gate's recording, as the minimum-max
// contiguous split into eleven shards under a measured cost model: a scenario
// costs twice its warm recording (the gate's pair), and a shard also pays the
// full-world collider bootstrap (about 0.9 to 1.3 s) once for each DISTINCT
// seed it builds, so scenarios sharing a seed are cheaper together. Two more
// subtleties: recording warms subsystem code paths for later same-subsystem
// scenarios, so `fiesta` stays in the same shard as the heavy
// `fiesta_powerups` (cold, that scenario alone records about 4x slower), and
// the class-engine trio (shaman, druid, priest) shares one shard. A
// multi-scenario coverage case must not straddle a bound (checked below), or
// its earlier scenarios would be recorded again. Re-derive from measured costs
// whenever a scenario is added or grows; the last bound is SCENARIOS.length, so
// a newly appended scenario lands in the final shard. Every shard file
// re-validates the tiling at import time, so a bad edit here fails the whole
// suite instead of silently dropping scenarios from the gate.
const SHARD_BOUNDS: readonly number[] = [
  0,
  7,
  13,
  17,
  24,
  40,
  41,
  50,
  57,
  60,
  72,
  SCENARIOS.length,
];

export const PARITY_SHARD_COUNT = SHARD_BOUNDS.length - 1;

function shardSlice(shard: number): { from: number; to: number } {
  if (!Number.isInteger(shard) || shard < 0 || shard >= PARITY_SHARD_COUNT) {
    throw new Error(`parity shard ${shard} out of range 0..${PARITY_SHARD_COUNT - 1}`);
  }
  if (SHARD_BOUNDS[0] !== 0 || SHARD_BOUNDS[SHARD_BOUNDS.length - 1] !== SCENARIOS.length) {
    throw new Error('SHARD_BOUNDS must start at 0 and end at SCENARIOS.length');
  }
  for (let i = 1; i < SHARD_BOUNDS.length; i++) {
    if (!(SHARD_BOUNDS[i] > SHARD_BOUNDS[i - 1])) {
      throw new Error('SHARD_BOUNDS must be strictly increasing (every shard non-empty)');
    }
  }
  const shardOf = (i: number) => SHARD_BOUNDS.findIndex((b, k) => k > 0 && i < b) - 1;
  const index = new Map(SCENARIOS.map((s, i) => [s.name, i]));
  for (const c of COVERAGE_CASES) {
    for (const name of c.reads) {
      if (shardOf(index.get(name) as number) !== shardOf(c.after)) {
        throw new Error(`SHARD_BOUNDS splits the scenarios coverage case "${c.title}" reads`);
      }
    }
  }
  return { from: SHARD_BOUNDS[shard], to: SHARD_BOUNDS[shard + 1] };
}

function gateCase(scenario: Scenario, index: number): void {
  // Explicit timeout: the heaviest scenario (nythraxis_full_pull) records a
  // full raid pull TWICE here and brushed vitest's 5000ms default on slow
  // shared CI runners (observed timing out twice in a row on the PR gate
  // while green locally). This does not soften the gate: a trace mismatch
  // still fails identically. The title keeps both old names as substrings,
  // so `-t 'matches the committed golden'` and `-t 'mints the golden'`
  // still select it.
  it(UPDATE
    ? 'records deterministically and mints the golden'
    : 'records deterministically and matches the committed golden', () => {
    // A recording whose last reader should already have run (a `-t` filter
    // skipped it) is dropped here, so a filtered run holds no more than a
    // full one.
    for (const name of heldRecordingNames()) {
      const last = LAST_READER.get(name);
      if (last === undefined || COVERAGE_CASES[last].after < index) releaseRecording(name);
    }
    const first = record(scenario);
    // Held for this scenario's coverage cases, which read this very recording.
    if (LAST_READER.has(scenario.name)) holdRecording(scenario, first);
    const a = plain(first.trace);
    const b = plain(recordTrace(scenario));
    expect(a).toEqual(b);
    const path = goldenPath(scenario.name);
    if (UPDATE) {
      mkdirSync(GOLDEN_DIR, { recursive: true });
      writeFileSync(path, `${JSON.stringify(a, null, 2)}\n`);
      return;
    }
    expect(existsSync(path), `missing golden for ${scenario.name}; run UPDATE_PARITY=1`).toBe(true);
    expect(a).toEqual(JSON.parse(readFileSync(path, 'utf8')));
    // two full recordings of the heaviest scenarios (the raid pull, the
    // fiesta) on the 13-zone world plus one golden read: headroom under
    // suite load
  }, 90_000);
}

function coverageCase(position: number): void {
  const c = COVERAGE_CASES[position];
  it(
    c.title,
    () => {
      try {
        readingOnly(c.reads, c.fn);
      } finally {
        for (const name of c.reads) if (LAST_READER.get(name) === position) releaseRecording(name);
      }
    },
    c.timeout,
  );
}

// One shard: each scenario's gate case (identical full test name to the
// pre-shard single file, `parity gate > <scenario> > ...`) followed by the
// coverage cases that read it last (full names unchanged too:
// `coverage: each scenario fires its subsystem > <title>`).
export function runParityShard(shard: number): void {
  const { from, to } = shardSlice(shard);
  for (let i = from; i < to; i++) {
    const scenario = SCENARIOS[i];
    describe('parity gate', () => {
      describe(scenario.name, () => gateCase(scenario, i));
    });
    const readers = RUN_ORDER.filter(({ c }) => c.after === i);
    if (readers.length === 0) continue;
    describe('coverage: each scenario fires its subsystem', () => {
      for (const { i: position } of readers) coverageCase(position);
    });
  }
}
