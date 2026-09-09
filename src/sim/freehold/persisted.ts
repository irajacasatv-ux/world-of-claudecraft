// The durable projection of ONE owned plot, and the only place that decides
// what a persisted freehold row MEANS. A pure leaf behind the same seam as
// professions/farm_persist.ts (the named house precedent for the shape: a pure
// persistence leaf plus the pure counting reporter beside it, load_report.ts):
// no SQL, no clock, no rng, no SimContext, explicit arguments only, so a
// Vitest drives it without a live Sim and the server (07) owns every row read
// and write.
//
// THE POLICY IS THE OPPOSITE OF THE FARM PRECEDENT, deliberately. Farm
// normalization DROPS a retired row on load and self-heals the save, because a
// crop is regrowable state. A freehold row is OWNED CONTENT: furnishings a
// player crafted, carried and positioned. NOTHING HERE EVER DROPS ONE. A
// record this binary cannot interpret (a forward version, a retired tier, an
// unknown visit policy, a corrupt shape, a record past the byte ceiling) is
// refused WHOLE and reported read-only, so the durable bytes stay exactly
// where they are for a later binary or an operator to recover. The three
// SAFELY REPAIRED KNOWN SCALARS below are the only values this file ever
// rewrites, and none of them is content.
//
// UNSUPPORTED IS NOT ABSENCE (the gathering_goal_persist.ts precedent, and the
// invariant a future reader must not break): only `undefined` and `null` are
// absence. Everything else that fails to load keeps its identity in the
// result, because resolving a forward or retired row to `absent` is what would
// let the caller seed a fresh tier-0 default OVER a real owner's possessions.
//
// THE ORDER OF THE ARMS IS LOAD-BEARING, and pinned in
// tests/freehold_state.test.ts:
//   1. absent: `undefined` or `null`, and nothing else.
//   2. container shape (plain object, sane prototype, no own `__proto__`).
//   3. version, BEFORE any field below it: a forward row's content shape is
//      not ours to judge, so a newer version answers `unsupported` rather than
//      being read as malformed against this binary's shape.
//   4. the container's own field NAMES, then the plot identity.
//   5. tier and visit policy, the two content identities.
//   6. layout and trophies are arrays, and their ROW-COUNT ceilings, BEFORE
//      any row is read.
//   7. one validation pass over the rows: shape, then own field names, then
//      the id LENGTH ceilings, then the numbers. No allocation, no mapping and
//      no cloning happens until this pass has passed in full (the
//      item_instance_load.ts bounded-loader doctrine: bound the names and the
//      lengths before the loader does work proportional to them).
//   8. the candidate is built (the one deep allocation) and the scalars are
//      repaired.
//   9. the BYTE ceiling, last, measured on the canonical JSON the save path
//      writes.
// The practical consequence, and the thing a fixture must state rather than
// assume: `oversize` is the LAST arm, so a record that is both oversized and
// malformed answers `malformed`.
//
// DIAGNOSTIC BYTES ARE BOUNDED: every `detail` here is a fixed classification
// word plus counts and indices. A corrupt string is NEVER echoed back into a
// result, because an over-long id echoed into a log is the same unbounded-bytes
// problem wearing a log costume (load_report.ts holds the other half of that
// rule).

import {
  asFreeholdPlotId,
  type FreeholdLayoutRow,
  type FreeholdState,
  type FreeholdTier,
  type FreeholdTrophyRecord,
  type FreeholdVisitPolicy,
} from './types';

/** The shape version of a durable freehold record. Version 1 is the first: a
 *  row that carries no version at all is read as this one and reported as a
 *  repair (the legacy arm), and anything GREATER is a forward row this binary
 *  refuses to interpret. */
export const FREEHOLD_PERSIST_VERSION = 1;

/** The layout row ceiling, derived from content rather than guessed: the
 *  largest approved decorBudget (420, the Citadel row of
 *  docs/freeholds/content-numbers-workbook.md) divided by the smallest
 *  approved positive decorCost (1). No legal writer can place more. */
export const FREEHOLD_MAX_LAYOUT_ROWS = 420;

/** The trophy ceiling, the same way: the largest approved plinth count (32,
 *  the Citadel row). Trophies are stored separately from the decor budget, so
 *  the two ceilings add rather than share. */
export const FREEHOLD_MAX_TROPHY_ROWS = 32;

/** The character ceiling for every identity on the row (the plot id, an item
 *  id, a trophy id). The same 64 the wire admits for a plot id
 *  (server/freehold_wire.ts, cross-pinned in tests/freehold_module.test.ts)
 *  and the same order as MAX_INSTANCE_STRING_LENGTH: real ids sit far under
 *  it, so anything longer has no legal writer. */
export const FREEHOLD_MAX_ID_LENGTH = 64;

/**
 * The UTF-8 byte ceiling for ONE durable record, MEASURED rather than chosen.
 *
 * Derivation (scratch measurement, reproduced by the maximal fixture in
 * tests/freehold_state.test.ts):
 *  - the two ladder inputs: the largest approved decorBudget (420) divided by
 *    the smallest approved positive decorCost (1) gives FREEHOLD_MAX_LAYOUT_ROWS;
 *    the largest approved plinth count (32) gives FREEHOLD_MAX_TROPHY_ROWS.
 *  - the maximal LEGAL record: 420 layout rows and 32 trophies, every id at
 *    FREEHOLD_MAX_ID_LENGTH characters, the plot id, tier and visit policy at
 *    that same length, and every numeric field at the longest JSON text its
 *    domain admits (25 characters for a coordinate, 24 for an integer
 *    placement id or plinth, 24 for a condition inside 0..100, 23 for a
 *    non-negative integer revision).
 *  - measured canonical JSON: 104,363 bytes.
 *  - rounded UP to the next whole 1024: 104,448 (102 KiB).
 * The rounding is the only slack; the maximal fixture proves the ceiling
 * admits it and the one-over fixture proves the next row does not.
 *
 * The measure is BYTES, not characters, so a record whose ids are legal in
 * length but multi-byte in UTF-8 refuses here rather than riding every save
 * forever. That is the point of measuring the serialized form.
 */
export const FREEHOLD_MAX_OWNED_BYTES = 104_448;

/** Condition is a 0..100 scale (13 owns the rules); 100 is intact. */
const FULL_CONDITION = 100;

/** The plot identity charset, the wire's own (`[A-Za-z0-9_:-]`, 1 to 64
 *  characters: src/sim/freehold/types.ts states it and server/freehold_wire.ts
 *  enforces it). Held as a literal rather than built from
 *  FREEHOLD_MAX_ID_LENGTH so it reads exactly like its two siblings; the
 *  64-character and 65-character fixtures pin the two arms. Anchored and
 *  bounded, so testing it against a megabyte of junk costs 64 characters of
 *  scanning, not a walk of the whole string. */
const FREEHOLD_PLOT_ID_SHAPE = /^[A-Za-z0-9_:-]{1,64}$/;

/** One placed furnishing as the durable row carries it. */
export interface PersistedFreeholdLayoutRow {
  readonly placementId: number;
  readonly itemId: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
}

/** One trophy on a plinth as the durable row carries it. */
export interface PersistedFreeholdTrophy {
  readonly plinth: number;
  readonly trophyId: string;
}

/**
 * The durable subset of one plot. Field order here IS the canonical JSON key
 * order the byte measure and the save path use, so it is part of the contract
 * rather than a formatting choice.
 *
 * WHAT IT DELIBERATELY DOES NOT CARRY:
 *  - `ownerKey`. An internal account identity never belongs inside durable
 *    owned content: the row is keyed by account id already, so storing the key
 *    inside the value would duplicate an identity that must never travel with
 *    a plot (38's furnished-plot transfer moves the row, and a copy of the
 *    seller's key inside it would move with it).
 *  - `isDecorating`. Ephemeral build presence (C03), neutralized at the
 *    snapshot boundary in state.ts and absent from the shape here so no later
 *    writer can reintroduce it.
 *  - `conditionStampDay`, `ledgerPaidThroughDay`, `ledgerPrepaidWeeks`. 13 and
 *    13a own BOUND upkeep. A row written now is explicitly unbound with no day
 *    or week stamp, and inventing one here would fabricate calendar history.
 */
export interface PersistedFreehold {
  readonly version: number;
  readonly plotId: string;
  readonly tier: string;
  readonly layout: readonly PersistedFreeholdLayoutRow[];
  readonly trophies: readonly PersistedFreeholdTrophy[];
  readonly condition: number;
  readonly visitPolicy: string;
  readonly rev: number;
}

/** The three scalars a load may safely rewrite, in the order a result reports
 *  them. Nothing else is ever repaired: a repair of CONTENT would be a silent
 *  edit of someone's possessions. */
export type FreeholdRepairedField = 'condition' | 'rev' | 'version';

/** The five arms of a durable read. `loaded` is the only one that yields a
 *  state; the other four all leave the durable bytes untouched. */
export type FreeholdLoadResult =
  | { readonly kind: 'absent' }
  | {
      readonly kind: 'loaded';
      readonly state: PersistedFreehold;
      readonly repaired: readonly FreeholdRepairedField[];
    }
  | {
      readonly kind: 'unsupported';
      readonly reason: 'version' | 'tier' | 'visit_policy';
      readonly detail: string;
    }
  | { readonly kind: 'malformed'; readonly detail: string }
  | { readonly kind: 'oversize'; readonly bytes: number; readonly limit: number };

/** The content identities a load admits, passed as values exactly like the
 *  farm allowlists: this leaf never imports a content table, so its unit tests
 *  never depend on shipped content and a retired identity is a caller-side
 *  fact. `maxOwnedBytes` overrides the measured ceiling for a caller that
 *  wants a tighter one (a test, or a realm with a smaller row budget). */
export interface NormalizeFreeholdOptions {
  readonly validTierIds: ReadonlySet<string>;
  readonly validVisitPolicies: ReadonlySet<string>;
  readonly maxOwnedBytes?: number;
}

const CONTAINER_FIELDS: ReadonlySet<string> = new Set([
  'version',
  'plotId',
  'tier',
  'layout',
  'trophies',
  'condition',
  'visitPolicy',
  'rev',
]);
const LAYOUT_FIELDS: ReadonlySet<string> = new Set(['placementId', 'itemId', 'x', 'y', 'z', 'yaw']);
const TROPHY_FIELDS: ReadonlySet<string> = new Set(['plinth', 'trophyId']);

type ShapeFault = 'not_an_object' | 'prototype_shape' | 'prototype_key';

/** Classify a value's container shape, or null when it is a plain record.
 *  The `gathering_goal_persist.ts` record() test plus the own-`__proto__`
 *  arm: `JSON.parse('{"__proto__":{}}')` yields a plain object whose PROTOTYPE
 *  is ordinary and whose own key is the pollution vector, so the prototype
 *  test alone would admit it. A null prototype is admitted (the house
 *  precedent does), because it carries no pollution vector at all. */
function shapeFault(value: unknown): ShapeFault | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'not_an_object';
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return 'prototype_shape';
  if (Object.hasOwn(value, '__proto__')) return 'prototype_key';
  return null;
}

/** True when the record carries no own field outside the known set. An
 *  unknown field is REFUSED rather than ignored, and that is the preservation
 *  rule rather than strictness for its own sake: this file projects a closed
 *  shape, so a field it ignored on load would be silently dropped by the very
 *  next save. A binary that genuinely grows the row bumps
 *  FREEHOLD_PERSIST_VERSION, which the unsupported arm already preserves. */
function onlyKnownFields(value: Record<string, unknown>, known: ReadonlySet<string>): boolean {
  for (const key of Object.keys(value)) {
    if (!known.has(key)) return false;
  }
  return true;
}

const finiteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const integerNumber = (value: unknown): value is number => Number.isInteger(value);

/** A stored identity: a string within the character ceiling. An EMPTY id is
 *  admitted on purpose. It is bounded, it names nothing, and refusing it would
 *  put a whole owner's record into read-only recovery over a field that costs
 *  two bytes: the preservation rule wins over tidiness. */
const boundedId = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= FREEHOLD_MAX_ID_LENGTH;

const malformed = (detail: string): FreeholdLoadResult => ({ kind: 'malformed', detail });

/** Validate every layout row without allocating anything, returning the
 *  bounded fault detail of the FIRST offending row or null. Shape, then field
 *  NAMES, then the id length, then the numbers: the cheap bounds come before
 *  the work proportional to them. */
function layoutRowsFault(rows: readonly unknown[]): string | null {
  const placementIds = new Set<number>();
  for (let i = 0; i < rows.length; i++) {
    const fault = shapeFault(rows[i]);
    if (fault) return `layout_row:${i}:${fault}`;
    const row = rows[i] as Record<string, unknown>;
    if (!onlyKnownFields(row, LAYOUT_FIELDS)) return `layout_row:${i}:unknown_field`;
    if (!boundedId(row.itemId)) return `layout_row:${i}:item_id`;
    const placementId = row.placementId;
    if (!integerNumber(placementId)) return `layout_row:${i}:placement_id`;
    if (placementIds.has(placementId)) return `layout_row:${i}:duplicate_placement_id`;
    placementIds.add(placementId);
    if (!finiteNumber(row.x)) return `layout_row:${i}:x`;
    if (!finiteNumber(row.y)) return `layout_row:${i}:y`;
    if (!finiteNumber(row.z)) return `layout_row:${i}:z`;
    if (!finiteNumber(row.yaw)) return `layout_row:${i}:yaw`;
  }
  return null;
}

/** The trophy half of the same pass. */
function trophyRowsFault(rows: readonly unknown[]): string | null {
  const plinths = new Set<number>();
  for (let i = 0; i < rows.length; i++) {
    const fault = shapeFault(rows[i]);
    if (fault) return `trophy_row:${i}:${fault}`;
    const row = rows[i] as Record<string, unknown>;
    if (!onlyKnownFields(row, TROPHY_FIELDS)) return `trophy_row:${i}:unknown_field`;
    if (!boundedId(row.trophyId)) return `trophy_row:${i}:trophy_id`;
    const plinth = row.plinth;
    if (!integerNumber(plinth)) return `trophy_row:${i}:plinth`;
    if (plinths.has(plinth)) return `trophy_row:${i}:duplicate_plinth`;
    plinths.add(plinth);
  }
  return null;
}

/** Build the durable rows AFTER the validation pass has passed in full. The
 *  casts are safe for exactly that reason, and the two passes exist for
 *  exactly that reason: every ceiling is checked before the loader allocates
 *  anything proportional to the row it is reading. */
function buildLayoutRows(rows: readonly unknown[]): PersistedFreeholdLayoutRow[] {
  return rows.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      placementId: row.placementId as number,
      itemId: row.itemId as string,
      x: row.x as number,
      y: row.y as number,
      z: row.z as number,
      yaw: row.yaw as number,
    };
  });
}

function buildTrophyRows(rows: readonly unknown[]): PersistedFreeholdTrophy[] {
  return rows.map((raw) => {
    const row = raw as Record<string, unknown>;
    return { plinth: row.plinth as number, trophyId: row.trophyId as string };
  });
}

/**
 * Classify one durable value into the five arms. Total on `unknown`: a
 * corrupt row can never throw inside an account load, and the input is never
 * mutated, so the durable value a caller holds is exactly what it passed in.
 *
 * See the header for the full order of the arms and why each one sits where it
 * does. The two rules a future reader must not break: nothing but `undefined`
 * and `null` is absence, and no arm ever drops a single owned row.
 */
export function normalizeFreehold(
  raw: unknown,
  opts: NormalizeFreeholdOptions,
): FreeholdLoadResult {
  if (raw === undefined || raw === null) return { kind: 'absent' };
  const containerFault = shapeFault(raw);
  if (containerFault) return malformed(containerFault);
  const record = raw as Record<string, unknown>;

  // Version FIRST, before this binary's shape is imposed on the row at all.
  const rawVersion = record.version;
  if (finiteNumber(rawVersion) && rawVersion > FREEHOLD_PERSIST_VERSION) {
    return { kind: 'unsupported', reason: 'version', detail: `${rawVersion}` };
  }

  if (!onlyKnownFields(record, CONTAINER_FIELDS)) return malformed('unknown_field');

  const plotId = record.plotId;
  if (typeof plotId !== 'string' || !FREEHOLD_PLOT_ID_SHAPE.test(plotId)) {
    return malformed('plot_id_shape');
  }

  // The two content identities. A value outside the caller's authored set is
  // FORWARD or RETIRED, never absence and never repairable: the tier decides
  // which room a record opens into and the policy decides who may enter, so
  // substituting a default for either would hand out a different house or a
  // different door. A non-string lands here too, and is preserved the same
  // way rather than being repaired into one.
  const tier = record.tier;
  if (typeof tier !== 'string' || !opts.validTierIds.has(tier)) {
    return { kind: 'unsupported', reason: 'tier', detail: 'not_admitted' };
  }
  const visitPolicy = record.visitPolicy;
  if (typeof visitPolicy !== 'string' || !opts.validVisitPolicies.has(visitPolicy)) {
    return { kind: 'unsupported', reason: 'visit_policy', detail: 'not_admitted' };
  }

  // The row-count ceilings, before a single row is READ.
  const layoutRaw = record.layout;
  if (!Array.isArray(layoutRaw)) return malformed('layout_not_an_array');
  if (layoutRaw.length > FREEHOLD_MAX_LAYOUT_ROWS) {
    return malformed(`layout_over_ceiling:${layoutRaw.length}`);
  }
  const trophiesRaw = record.trophies;
  if (!Array.isArray(trophiesRaw)) return malformed('trophies_not_an_array');
  if (trophiesRaw.length > FREEHOLD_MAX_TROPHY_ROWS) {
    return malformed(`trophies_over_ceiling:${trophiesRaw.length}`);
  }

  const layoutFault = layoutRowsFault(layoutRaw);
  if (layoutFault) return malformed(layoutFault);
  const trophyFault = trophyRowsFault(trophiesRaw);
  if (trophyFault) return malformed(trophyFault);

  // The three safely repaired known scalars, reported in the declaration order
  // of FreeholdRepairedField so the diagnostic text is stable.
  const repaired: FreeholdRepairedField[] = [];
  const rawCondition = record.condition;
  let condition = FULL_CONDITION;
  if (finiteNumber(rawCondition)) {
    condition = Math.min(FULL_CONDITION, Math.max(0, rawCondition));
    if (condition !== rawCondition) repaired.push('condition');
  } else {
    // A condition that is not a number at all is repaired to INTACT, never to
    // zero: a corrupt scalar must not be able to ruin a house nobody neglected.
    repaired.push('condition');
  }
  const rawRev = record.rev;
  const rev = integerNumber(rawRev) && rawRev >= 0 ? rawRev : 0;
  if (rev !== rawRev) repaired.push('rev');
  // Anything at or below this binary's version normalizes UP to it, because
  // FreeholdState carries no version field and the round trip through it must
  // be a fixed point. Reported either way, so a legacy row and a row that was
  // never written by any released binary both leave a trace.
  if (rawVersion !== FREEHOLD_PERSIST_VERSION) repaired.push('version');

  const candidate: PersistedFreehold = {
    version: FREEHOLD_PERSIST_VERSION,
    plotId,
    tier,
    layout: buildLayoutRows(layoutRaw),
    trophies: buildTrophyRows(trophiesRaw),
    condition,
    visitPolicy,
    rev,
  };

  const limit = opts.maxOwnedBytes ?? FREEHOLD_MAX_OWNED_BYTES;
  const bytes = persistedFreeholdBytes(candidate);
  if (bytes > limit) return { kind: 'oversize', bytes, limit };
  return { kind: 'loaded', state: candidate, repaired };
}

/** Project the live record down to its durable subset, deep-copying both row
 *  arrays so a snapshot never aliases the live record (the cloneInvSlot rule
 *  state.ts applies to the same two arrays). See PersistedFreehold for what is
 *  deliberately left behind and why. */
export function persistedFreeholdFromState(state: FreeholdState): PersistedFreehold {
  return {
    version: FREEHOLD_PERSIST_VERSION,
    plotId: state.plotId,
    tier: state.tier,
    layout: state.layout.map((row) => ({
      placementId: row.placementId,
      itemId: row.itemId,
      x: row.x,
      y: row.y,
      z: row.z,
      yaw: row.yaw,
    })),
    trophies: state.trophies.map((trophy) => ({
      plinth: trophy.plinth,
      trophyId: trophy.trophyId,
    })),
    condition: state.condition,
    visitPolicy: state.visitPolicy,
    rev: state.rev,
  };
}

/**
 * Rebuild the live record `loadFreehold` installs, deep-copying both row
 * arrays the same way. The four upkeep-side fields take their UNBOUND ZERO
 * defaults and build presence is false, which is the whole of the "a row
 * written now is explicitly unbound" rule on the read side: a loaded record
 * carries no day stamp, no paid-through day and no prepaid week, so 13 and 13a
 * see an unbound plot rather than a fabricated history.
 *
 * The two casts are the caller's contract: `normalizeFreehold` admitted the
 * tier and the policy against the authored sets, and the plot id against the
 * wire charset, so a persisted record that reached here holds identities the
 * live unions already name.
 */
export function freeholdStateFromPersisted(
  persisted: PersistedFreehold,
  ownerKey: string,
): FreeholdState {
  const layout: FreeholdLayoutRow[] = persisted.layout.map((row) => ({
    placementId: row.placementId,
    itemId: row.itemId,
    x: row.x,
    y: row.y,
    z: row.z,
    yaw: row.yaw,
  }));
  const trophies: FreeholdTrophyRecord[] = persisted.trophies.map((trophy) => ({
    plinth: trophy.plinth,
    trophyId: trophy.trophyId,
  }));
  return {
    ownerKey,
    plotId: asFreeholdPlotId(persisted.plotId),
    tier: persisted.tier as FreeholdTier,
    layout,
    trophies,
    condition: persisted.condition,
    conditionStampDay: 0,
    ledgerPaidThroughDay: 0,
    ledgerPrepaidWeeks: 0,
    visitPolicy: persisted.visitPolicy as FreeholdVisitPolicy,
    isDecorating: false,
    rev: persisted.rev,
  };
}

/** The canonical JSON of one durable record: the exact text the save path
 *  writes, rebuilt here in the declared field order so the measure cannot
 *  depend on how a caller happened to build its object. */
function canonicalFreeholdJson(persisted: PersistedFreehold): string {
  return JSON.stringify({
    version: persisted.version,
    plotId: persisted.plotId,
    tier: persisted.tier,
    layout: persisted.layout,
    trophies: persisted.trophies,
    condition: persisted.condition,
    visitPolicy: persisted.visitPolicy,
    rev: persisted.rev,
  });
}

/** UTF-8 byte length of a string, counted rather than encoded: the caller is a
 *  load path measuring a six-figure JSON text, and allocating a second copy of
 *  it to read `.length` off a Uint8Array is pure waste. A lone surrogate
 *  counts as three bytes, which is what an encoder charges for the
 *  replacement character it would emit. */
function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/** The durable cost of one record in UTF-8 bytes, measured on the canonical
 *  JSON above rather than approximated from row counts, so the ceiling bounds
 *  exactly the growth it exists to stop. Total on a hand-built value: a record
 *  JSON cannot serialize is corrupt by definition on a JSONB row and reads as
 *  infinitely large, so it refuses instead of throwing (the savedJsonLength
 *  arm of item_instance_load.ts). */
export function persistedFreeholdBytes(persisted: PersistedFreehold): number {
  let text: string | undefined;
  try {
    text = canonicalFreeholdJson(persisted);
  } catch {
    return Number.POSITIVE_INFINITY;
  }
  if (typeof text !== 'string') return Number.POSITIVE_INFINITY;
  return utf8ByteLength(text);
}
