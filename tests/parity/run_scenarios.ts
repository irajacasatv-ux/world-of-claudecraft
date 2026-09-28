// Shared runner for the sharded parity gate (parity_a..g.test.ts) and the
// sharded coverage suite (coverage_a..d.test.ts).
//
// The gate used to live in a single parity.test.ts; recording every scenario
// three times in one worker made it the slowest file in the whole suite. The
// scenario list is now split across several *.test.ts shard files, each running
// a CONTIGUOUS slice of SCENARIOS through this one runner, so vitest can spread
// the recordings over parallel worker files. Nothing about what is recorded,
// how goldens resolve, or how UPDATE_PARITY mints changes: each shard mints
// exactly its own slice's goldens into the same tests/parity/golden dir.
//
// For every scenario the gate asserts two things, in one case over two
// recordings (it was three recordings in two cases until 2026-09-27; the
// golden comparison reuses the first determinism recording):
//   1. INTERNALLY DETERMINISTIC: recording the same scenario twice is identical
//      (proves the harness itself adds no nondeterminism).
//   2. MATCHES THE COMMITTED GOLDEN: the recorded trace equals the checked-in
//      golden (proves current Sim behavior == the behavior captured when the
//      golden was minted). A minting run proves (1) first, so a
//      nondeterministic trace is never written as a golden.
//
// A red trace means behavior changed. Fix the change, NOT the harness. Regenerate
// goldens deliberately and reviewably with `UPDATE_PARITY=1 npx vitest run
// tests/parity` as its own commit.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Recorder, Scenario } from './record';
import { record, recordTrace } from './record';
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

// Contiguous shard boundaries over SCENARIOS, timing-balanced by MEASURED
// per-scenario cost (not by scenario count). Re-derived 2026-09-27 from each
// scenario's measured case time after the gate went to one case of two
// recordings per scenario: the minimum-max contiguous split of the 84
// scenarios into seven shards, about 15 s each locally (the final shard had
// grown to 47 scenarios and 60 s, which the CI harvest recorded as 196 s).
// Two subtleties: recording warms subsystem code paths for later
// same-subsystem scenarios, so `fiesta` stays in the same shard as the heavy
// `fiesta_powerups` (cold, that scenario alone records about 4x slower), and
// the class-engine trio (shaman, druid, priest) shares one shard. Re-derive
// from measured costs whenever a scenario is added or grows; the last bound is
// SCENARIOS.length, so a newly appended scenario lands in the final shard.
// Every shard file re-validates the tiling at import time, so a bad edit here
// fails the whole suite instead of silently dropping scenarios from the gate.
const SHARD_BOUNDS: readonly number[] = [0, 8, 17, 37, 43, 57, 60, SCENARIOS.length];

export const PARITY_SHARD_COUNT = SHARD_BOUNDS.length - 1;

function shardSlice(shard: number): Scenario[] {
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
  return SCENARIOS.slice(SHARD_BOUNDS[shard], SHARD_BOUNDS[shard + 1]);
}

// The parity GATE for one shard: identical assertions (and identical full test
// names, `parity gate > <scenario> > ...`) to the pre-shard single file.
export function runParityShard(shard: number): void {
  const scenarios = shardSlice(shard);
  describe('parity gate', () => {
    for (const scenario of scenarios) {
      describe(scenario.name, () => {
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
          const a = plain(recordTrace(scenario));
          const b = plain(recordTrace(scenario));
          expect(a).toEqual(b);
          const path = goldenPath(scenario.name);
          if (UPDATE) {
            mkdirSync(GOLDEN_DIR, { recursive: true });
            writeFileSync(path, `${JSON.stringify(a, null, 2)}\n`);
            return;
          }
          expect(existsSync(path), `missing golden for ${scenario.name}; run UPDATE_PARITY=1`).toBe(
            true,
          );
          expect(a).toEqual(JSON.parse(readFileSync(path, 'utf8')));
          // two full recordings of the heaviest scenarios (the raid pull, the
          // fiesta) on the 13-zone world plus one golden read: headroom under
          // suite load
        }, 90_000);
      });
    }
  });
}

// Shared helpers for the coverage shards (moved verbatim from coverage.test.ts).

// biome-ignore lint/suspicious/noExplicitAny: coverage shards inspect heterogeneous event/entity shapes by design.
export type Ev = Record<string, any>;

export function run(name: string): Recorder {
  const scenario = SCENARIOS.find((s) => s.name === name);
  if (!scenario) throw new Error(`no scenario ${name}`);
  return record(scenario).rec;
}

// biome-ignore lint/suspicious/noExplicitAny: coverage shards intentionally use a loose entity facade.
export function entities(rec: Recorder): any[] {
  return [...rec.sim.entities.values()];
}
