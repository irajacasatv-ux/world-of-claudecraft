// The parity family's shared recordings: each coverage case reads the SAME
// recording the gate compared with its committed golden, instead of recording
// its scenario again (the coverage suite used to be a third recording of every
// scenario, after the gate's two).
//
// The runner (run_scenarios.ts) holds a gate case's recording here while a
// coverage case still has to read it and releases it after the last reader, so
// at most the few recordings one multi-scenario case reads are alive at once.
// The case modules read through run() and recordShared() (imported as `record`
// there, so their bodies are unchanged). A read with nothing held, which is what
// a `-t` filter that skips the gate case produces, records the scenario itself,
// so every case still runs alone.
//
// While a coverage case runs, the runner names the scenarios it declared
// (run_scenarios.ts derives them from the title) and a read of any OTHER
// scenario throws: a case that quietly started reading an undeclared scenario
// would be re-recording it, which is the cost this module exists to remove.

import type { Recorder, Scenario } from './record';
import { record } from './record';
import { SCENARIOS } from './scenarios';
import type { Trace } from './trace';

export interface Recording {
  trace: Trace;
  rec: Recorder;
}

// biome-ignore lint/suspicious/noExplicitAny: coverage shards inspect heterogeneous event/entity shapes by design.
export type Ev = Record<string, any>;

// The `it` a coverage case module registers its cases through (the runner's).
export type CoverageIt = (title: string, fn: () => void, timeout?: number) => void;

const held = new Map<string, Recording>();
let readable: ReadonlySet<string> | null = null;

export function holdRecording(name: string, recording: Recording): void {
  held.set(name, recording);
}

export function releaseRecording(name: string): void {
  held.delete(name);
}

export function heldRecordingNames(): string[] {
  return [...held.keys()];
}

// Run one coverage case with reads limited to the scenarios it declared.
export function readingOnly(names: ReadonlySet<string>, fn: () => void): void {
  readable = names;
  try {
    fn();
  } finally {
    readable = null;
  }
}

export function recordShared(scenario: Scenario): Recording {
  if (readable && !readable.has(scenario.name)) {
    throw new Error(
      `coverage case read undeclared scenario ${scenario.name}; declare it in run_scenarios.ts`,
    );
  }
  const hit = held.get(scenario.name);
  if (hit) return hit;
  const fresh = record(scenario);
  held.set(scenario.name, fresh);
  return fresh;
}

export function run(name: string): Recorder {
  const scenario = SCENARIOS.find((s) => s.name === name);
  if (!scenario) throw new Error(`no scenario ${name}`);
  return recordShared(scenario).rec;
}

// biome-ignore lint/suspicious/noExplicitAny: coverage shards intentionally use a loose entity facade.
export function entities(rec: Recorder): any[] {
  return [...rec.sim.entities.values()];
}
