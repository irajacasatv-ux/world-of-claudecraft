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
// Because several cases read one recording, a held recording is guarded:
//   - its events, notes and frames are DEEP-frozen, and every entity and player
//     record of its final Sim is frozen (one level: a field write throws, a
//     write inside a nested object such as pos is not refused), so a case that
//     sorted, pushed or assigned into what it reads throws instead of changing
//     what the next case sees; ticking the held Sim throws too;
//   - while a case runs (readingOnly), a read of a scenario the case did not
//     declare throws (run_scenarios.ts derives the declaration from the title),
//     a read passing any Scenario object other than the SCENARIOS one throws
//     (held or not), and so does any recording the case makes outside this
//     module (counted through record.ts), or an async case whose assertions
//     would escape the test.

import type { Recorder, Scenario } from './record';
import { record, recordingsStartedSoFar } from './record';
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
let recordedOnMiss = 0;

// Freezes arrays and plain objects all the way down (a Map or Set is walked
// but stays writable). `seen` guards cycles and shared subtrees.
function deepFreeze(value: unknown, seen: WeakSet<object>): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (value instanceof Map || value instanceof Set) {
    for (const v of value.values()) deepFreeze(v, seen);
    return;
  }
  Object.freeze(value);
  for (const v of Object.values(value)) deepFreeze(v, seen);
}

function refuseTick(): never {
  throw new Error('a coverage case ticked a held recording; it may only read it');
}

function freeze(recording: Recording): Recording {
  const seen = new WeakSet<object>();
  deepFreeze(recording.rec.allEvents, seen);
  deepFreeze(recording.rec.notes, seen);
  deepFreeze(recording.trace.frames, seen);
  const sim = recording.rec.sim;
  for (const e of sim.entities.values()) Object.freeze(e);
  for (const meta of sim.players.values()) Object.freeze(meta);
  (sim as { tick: () => unknown }).tick = refuseTick;
  return recording;
}

export function holdRecording(scenario: Scenario, recording: Recording): void {
  held.set(scenario.name, freeze(recording));
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
  recordedOnMiss = 0;
  const before = recordingsStartedSoFar();
  try {
    const result: unknown = fn();
    if (typeof (result as PromiseLike<unknown> | undefined)?.then === 'function') {
      throw new Error('coverage cases must be synchronous: they read a held recording');
    }
  } finally {
    readable = null;
  }
  const outside = recordingsStartedSoFar() - before - recordedOnMiss;
  if (outside !== 0) {
    throw new Error(
      `coverage case made ${outside} recording(s) outside recording_cache.ts; read through run()`,
    );
  }
}

export function recordShared(scenario: Scenario): Recording {
  if (readable && !readable.has(scenario.name)) {
    throw new Error(
      `coverage case read undeclared scenario ${scenario.name}; declare it in run_scenarios.ts`,
    );
  }
  if (SCENARIOS.find((s) => s.name === scenario.name) !== scenario) {
    throw new Error(`coverage case passed a modified ${scenario.name}; read the SCENARIOS one`);
  }
  const hit = held.get(scenario.name);
  if (hit) return hit;
  recordedOnMiss++;
  const fresh = record(scenario);
  holdRecording(scenario, fresh);
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
