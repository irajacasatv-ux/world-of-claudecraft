// The durable freehold record: what one persisted plot row means, pinned arm
// by arm (src/sim/freehold/persisted.ts and its dev-channel reporter
// src/sim/freehold/load_report.ts).
//
// The suite is built on the tests/professions_farming_state.test.ts idiom: ONE
// shared valid fixture, spread with a SINGLE override per case, so a refusal
// can only be blamed on the one dimension that case corrupted. The two rules it
// exists to defend are the ones a future change is most likely to break:
// nothing but `undefined` and `null` is absence, and no arm ever drops an owned
// row. A record this binary cannot interpret is preserved on disk and reported
// read-only instead.
//
// The maximal legal record and the one-over record are NAMED DELIVERABLES and
// live here (maximalLegalRecord below): they are the witnesses for the measured
// FREEHOLD_MAX_OWNED_BYTES ceiling, and the byte number they prove is the one
// docs/freeholds/content-numbers-workbook.md records.

import { describe, expect, it } from 'vitest';
import { boundedFreeholdDetail, freeholdLoadDiagnostic } from '../src/sim/freehold/load_report';
import {
  FREEHOLD_MAX_ID_LENGTH,
  FREEHOLD_MAX_LAYOUT_ROWS,
  FREEHOLD_MAX_OWNED_BYTES,
  FREEHOLD_MAX_STORED_BYTES,
  FREEHOLD_MAX_TROPHY_ROWS,
  FREEHOLD_PERSIST_VERSION,
  type FreeholdLoadResult,
  freeholdStateFromPersisted,
  freeholdWriteRefusal,
  type NormalizeFreeholdOptions,
  normalizeFreehold,
  type PersistedFreehold,
  persistedFreeholdBytes,
  persistedFreeholdFromState,
} from '../src/sim/freehold/persisted';
import { asFreeholdPlotId, type FreeholdState } from '../src/sim/freehold/types';
import {
  MAXIMAL_FREEHOLD_CONDITION,
  MAXIMAL_FREEHOLD_COORD,
  MAXIMAL_FREEHOLD_OPTS,
  MAXIMAL_FREEHOLD_POLICY,
  MAXIMAL_FREEHOLD_REV,
  MAXIMAL_FREEHOLD_TIER,
  maximalLegalFreeholdRecord,
  worstCaseIntegerIds,
} from './helpers/maximal_freehold';

// The authored identities arrive as VALUES, exactly like the farm allowlists:
// the leaf imports no content table, so these unit arms never depend on shipped
// content and a retired identity stays a caller-side fact.
const TIERS: ReadonlySet<string> = new Set(['inn_room', 'cottage']);
const POLICIES: ReadonlySet<string> = new Set(['closed', 'friends', 'open']);

const norm = (raw: unknown, over: Partial<NormalizeFreeholdOptions> = {}): FreeholdLoadResult =>
  normalizeFreehold(raw, { validTierIds: TIERS, validVisitPolicies: POLICIES, ...over });

const PLOT_ID = 'plot:9f3a1c';
const BED_ID = 'furnishing_oak_bed';
const RUG_ID = 'furnishing_rug_small';
const TROPHY_ID = 'trophy_gnarlroot_head';

const layoutRow = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  placementId: 1,
  itemId: BED_ID,
  x: 1.5,
  y: 0,
  z: -2.25,
  yaw: 3.125,
  ...over,
});

const trophyRow = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  plinth: 0,
  trophyId: TROPHY_ID,
  ...over,
});

/** The one VALID durable value, fresh on every call so no case can leak a
 *  mutation into the next one. */
const row = (): Record<string, unknown> => ({
  version: FREEHOLD_PERSIST_VERSION,
  plotId: PLOT_ID,
  tier: 'cottage',
  layout: [layoutRow(), layoutRow({ placementId: 2, itemId: RUG_ID, x: -4, y: 0, z: 0.5, yaw: 0 })],
  trophies: [trophyRow()],
  condition: 88,
  visitPolicy: 'friends',
  rev: 7,
});

/** One corrupt dimension per case, and nothing else moved. */
const corrupt = (over: Record<string, unknown>): Record<string, unknown> => ({ ...row(), ...over });

const without = (over: string): Record<string, unknown> => {
  const value = row();
  delete value[over];
  return value;
};

function loadedState(result: FreeholdLoadResult): PersistedFreehold {
  if (result.kind !== 'loaded') {
    throw new Error(`expected a loaded record, got ${result.kind}`);
  }
  return result.state;
}

function repairsOf(result: FreeholdLoadResult): readonly string[] {
  if (result.kind !== 'loaded') {
    throw new Error(`expected a loaded record, got ${result.kind}`);
  }
  return result.repaired;
}

/** Every repair case asserts this: the content and the scalars the case did NOT
 *  touch come back exactly as written. A repair that widened to a second field
 *  would be invisible without it. */
function expectContentSurvives(state: PersistedFreehold): void {
  expect(state.plotId).toBe('plot:9f3a1c');
  expect(state.tier).toBe('cottage');
  expect(state.visitPolicy).toBe('friends');
  expect(state.layout).toEqual([
    { placementId: 1, itemId: 'furnishing_oak_bed', x: 1.5, y: 0, z: -2.25, yaw: 3.125 },
    { placementId: 2, itemId: 'furnishing_rug_small', x: -4, y: 0, z: 0.5, yaw: 0 },
  ]);
  expect(state.trophies).toEqual([{ plinth: 0, trophyId: 'trophy_gnarlroot_head' }]);
}

describe('normalizeFreehold: the valid record and the anti-vacuity controls', () => {
  it('loads the shared fixture whole, with nothing repaired', () => {
    const result = norm(row());
    // A fresh literal, never the fixture object: an assertion against the value
    // it was built from is a self-comparison that survives any loader bug.
    expect(result).toEqual({
      kind: 'loaded',
      state: {
        version: 1,
        plotId: 'plot:9f3a1c',
        tier: 'cottage',
        layout: [
          { placementId: 1, itemId: 'furnishing_oak_bed', x: 1.5, y: 0, z: -2.25, yaw: 3.125 },
          { placementId: 2, itemId: 'furnishing_rug_small', x: -4, y: 0, z: 0.5, yaw: 0 },
        ],
        trophies: [{ plinth: 0, trophyId: 'trophy_gnarlroot_head' }],
        condition: 88,
        visitPolicy: 'friends',
        rev: 7,
      },
      repaired: [],
    });
  });

  it('the corruption helper really corrupts, and only in the named dimension', () => {
    const base = row();
    const bad = corrupt({ plotId: 'plot/9f3a1c' });
    // Anti-vacuity in both directions: the base really is legal, the override
    // really did change the one field, and the loader really refuses it. A
    // helper that silently returned the base would pass every malformed case
    // below without ever testing anything.
    expect(bad.plotId).not.toEqual(base.plotId);
    expect(bad.tier).toEqual(base.tier);
    expect(bad.layout).toEqual(base.layout);
    expect(norm(base).kind).toBe('loaded');
    expect(norm(bad).kind).toBe('malformed');
  });

  it('never mutates the durable value it was handed, on any arm', () => {
    for (const value of [
      row(),
      corrupt({ version: 2 }),
      corrupt({ tier: 'lodge' }),
      corrupt({ condition: 150 }),
      corrupt({ layout: [layoutRow({ placementId: 1.5 })] }),
    ]) {
      const before = JSON.stringify(value);
      norm(value);
      expect(JSON.stringify(value)).toBe(before);
    }
  });
});

describe('normalizeFreehold: absence is ONLY undefined and null', () => {
  it('reads undefined and null as absent (pre-feature data)', () => {
    expect(norm(undefined)).toEqual({ kind: 'absent' });
    expect(norm(null)).toEqual({ kind: 'absent' });
  });

  it('reads nothing else as absent, not even an empty object or an empty string', () => {
    // The load-bearing half: only `absent` lets the caller seed a fresh tier-0
    // default, so anything else that resolved to absence would seed one OVER a
    // real owner's possessions.
    for (const value of [{}, '', 0, false, [], 'null']) {
      expect(norm(value).kind, JSON.stringify(value) ?? 'undefined').not.toBe('absent');
    }
  });
});

describe('normalizeFreehold: malformed, one corrupt dimension per case', () => {
  const cases: readonly (readonly [string, unknown, string])[] = [
    ['a number', 42, 'not_an_object'],
    ['a string', 'plot', 'not_an_object'],
    ['a boolean', true, 'not_an_object'],
    ['an array', [row()], 'not_an_object'],
    ['a class instance (an exotic prototype)', new Map(), 'prototype_shape'],
    ['a missing plot id', without('plotId'), 'plot_id_shape'],
    ['a non-string plot id', corrupt({ plotId: 42 }), 'plot_id_shape'],
    ['a plot id outside the wire charset', corrupt({ plotId: 'plot/9f3a1c' }), 'plot_id_shape'],
    ['an empty plot id', corrupt({ plotId: '' }), 'plot_id_shape'],
    [
      'a plot id one character over the ceiling',
      corrupt({ plotId: 'p'.repeat(FREEHOLD_MAX_ID_LENGTH + 1) }),
      'plot_id_shape',
    ],
    ['an unknown container field', corrupt({ ownerKey: 'account:42' }), 'unknown_field'],
    ['a non-array layout', corrupt({ layout: { 0: layoutRow() } }), 'layout_not_an_array'],
    ['a missing layout', without('layout'), 'layout_not_an_array'],
    ['a non-array trophy list', corrupt({ trophies: 'none' }), 'trophies_not_an_array'],
    ['a missing trophy list', without('trophies'), 'trophies_not_an_array'],
    ['a null layout row', corrupt({ layout: [null] }), 'layout_row:0:not_an_object'],
    ['a scalar layout row', corrupt({ layout: [layoutRow(), 5] }), 'layout_row:1:not_an_object'],
    [
      'an unknown layout field',
      corrupt({ layout: [layoutRow({ scale: 2 })] }),
      'layout_row:0:unknown_field',
    ],
    [
      'a non-string item id',
      corrupt({ layout: [layoutRow({ itemId: 7 })] }),
      'layout_row:0:item_id',
    ],
    [
      'an over-length item id',
      corrupt({ layout: [layoutRow({ itemId: 'i'.repeat(FREEHOLD_MAX_ID_LENGTH + 1) })] }),
      'layout_row:0:item_id',
    ],
    [
      'a non-integer placement id',
      corrupt({ layout: [layoutRow({ placementId: 1.5 })] }),
      'layout_row:0:placement_id',
    ],
    [
      'a non-finite placement id',
      corrupt({ layout: [layoutRow({ placementId: Number.NaN })] }),
      'layout_row:0:placement_id',
    ],
    [
      'a duplicate placement id',
      corrupt({ layout: [layoutRow(), layoutRow({ itemId: RUG_ID })] }),
      'layout_row:1:duplicate_placement_id',
    ],
    ['a non-finite x', corrupt({ layout: [layoutRow({ x: Number.NaN })] }), 'layout_row:0:x'],
    [
      'a non-finite y',
      corrupt({ layout: [layoutRow({ y: Number.POSITIVE_INFINITY })] }),
      'layout_row:0:y',
    ],
    ['a non-number z', corrupt({ layout: [layoutRow({ z: '0' })] }), 'layout_row:0:z'],
    ['a missing yaw', corrupt({ layout: [layoutRow({ yaw: undefined })] }), 'layout_row:0:yaw'],
    ['a null trophy row', corrupt({ trophies: [null] }), 'trophy_row:0:not_an_object'],
    [
      'an unknown trophy field',
      corrupt({ trophies: [trophyRow({ tint: 'gold' })] }),
      'trophy_row:0:unknown_field',
    ],
    [
      'a non-string trophy id',
      corrupt({ trophies: [trophyRow({ trophyId: 3 })] }),
      'trophy_row:0:trophy_id',
    ],
    [
      'an over-length trophy id',
      corrupt({ trophies: [trophyRow({ trophyId: 't'.repeat(FREEHOLD_MAX_ID_LENGTH + 1) })] }),
      'trophy_row:0:trophy_id',
    ],
    [
      'a non-integer plinth',
      corrupt({ trophies: [trophyRow({ plinth: 0.5 })] }),
      'trophy_row:0:plinth',
    ],
    [
      'a duplicate plinth',
      corrupt({ trophies: [trophyRow(), trophyRow({ trophyId: 'trophy_other' })] }),
      'trophy_row:1:duplicate_plinth',
    ],
  ];

  for (const [name, value, detail] of cases) {
    it(`refuses ${name}`, () => {
      expect(norm(value)).toEqual({ kind: 'malformed', detail });
    });
  }

  it('names the OFFENDING row index, not a constant', () => {
    // Every indexed detail above would pass a loader that always said 0.
    expect(norm(corrupt({ layout: [layoutRow(), layoutRow({ placementId: 9, z: '0' })] }))).toEqual(
      { kind: 'malformed', detail: 'layout_row:1:z' },
    );
    expect(
      norm(corrupt({ trophies: [trophyRow(), trophyRow({ plinth: 1, trophyId: 5 })] })),
    ).toEqual({ kind: 'malformed', detail: 'trophy_row:1:trophy_id' });
  });

  it('refuses more layout rows than the ceiling admits, and admits exactly the ceiling', () => {
    const atCeiling = Array.from({ length: FREEHOLD_MAX_LAYOUT_ROWS }, (_, i) =>
      layoutRow({ placementId: i }),
    );
    expect(norm(corrupt({ layout: atCeiling })).kind).toBe('loaded');
    expect(norm(corrupt({ layout: [...atCeiling, layoutRow({ placementId: -1 })] }))).toEqual({
      kind: 'malformed',
      detail: 'layout_over_ceiling:421',
    });
  });

  it('refuses more trophies than the ceiling admits, and admits exactly the ceiling', () => {
    const atCeiling = Array.from({ length: FREEHOLD_MAX_TROPHY_ROWS }, (_, i) =>
      trophyRow({ plinth: i }),
    );
    expect(norm(corrupt({ trophies: atCeiling })).kind).toBe('loaded');
    expect(norm(corrupt({ trophies: [...atCeiling, trophyRow({ plinth: -1 })] }))).toEqual({
      kind: 'malformed',
      detail: 'trophies_over_ceiling:33',
    });
  });

  it('admits a plot id, an item id and a trophy id at exactly the character ceiling', () => {
    // The other arm of every over-length case above: the ceiling is inclusive,
    // so a legal id at the boundary is not quietly refused.
    const state = loadedState(
      norm(
        corrupt({
          plotId: 'p'.repeat(FREEHOLD_MAX_ID_LENGTH),
          layout: [layoutRow({ itemId: 'i'.repeat(FREEHOLD_MAX_ID_LENGTH) })],
          trophies: [trophyRow({ trophyId: 't'.repeat(FREEHOLD_MAX_ID_LENGTH) })],
        }),
      ),
    );
    expect(state.plotId).toHaveLength(64);
    expect(state.layout[0].itemId).toHaveLength(64);
    expect(state.trophies[0].trophyId).toHaveLength(64);
  });

  it('refuses a JSON.parse prototype-key row and leaves Object.prototype unpolluted', () => {
    // JSON.parse gives an ordinary prototype and an OWN `__proto__` key, so the
    // prototype test alone would admit this one.
    const polluting = JSON.parse(
      JSON.stringify(row()).replace('{', '{"__proto__":{"freeholdPolluted":true},'),
    );
    expect(Object.hasOwn(polluting, '__proto__')).toBe(true);
    expect(norm(polluting)).toEqual({ kind: 'malformed', detail: 'prototype_key' });
    expect(({} as Record<string, unknown>).freeholdPolluted).toBeUndefined();
    expect(Object.hasOwn(Object.prototype, 'freeholdPolluted')).toBe(false);
  });

  it('refuses a prototype-key layout row the same way', () => {
    const pollutingRow = JSON.parse('{"__proto__":{"freeholdRowPolluted":true},"placementId":1}');
    expect(norm(corrupt({ layout: [pollutingRow] }))).toEqual({
      kind: 'malformed',
      detail: 'layout_row:0:prototype_key',
    });
    expect(({} as Record<string, unknown>).freeholdRowPolluted).toBeUndefined();
  });
});

describe('normalizeFreehold: unsupported is NOT absence', () => {
  // Each case asserts kind !== 'absent' explicitly, because absence is the ONE
  // arm that lets a caller seed a fresh tier-0 default: a forward or retired
  // identity read as absence would put a new empty house over a real owner's
  // possessions. Each also proves the durable value is preserved for a later
  // binary to recover, which is the other half of "never drop owned content".
  it('preserves a forward version', () => {
    const raw = corrupt({ version: FREEHOLD_PERSIST_VERSION + 1 });
    const snapshot = JSON.stringify(raw);
    const result = norm(raw);
    expect(result).toEqual({ kind: 'unsupported', reason: 'version', detail: '2' });
    expect(result.kind).not.toBe('absent');
    expect(JSON.stringify(raw)).toBe(snapshot);
  });

  it('preserves a tier this binary does not admit', () => {
    // `lodge` is a real ladder rung whose rooms have not landed: the authored
    // table refuses it today and admits it later, and the owner's furnishings
    // must survive the gap untouched.
    const raw = corrupt({ tier: 'lodge' });
    const snapshot = JSON.stringify(raw);
    const result = norm(raw);
    expect(result).toEqual({ kind: 'unsupported', reason: 'tier', detail: 'not_admitted' });
    expect(result.kind).not.toBe('absent');
    expect(JSON.stringify(raw)).toBe(snapshot);
  });

  it('preserves a visit policy this binary does not admit', () => {
    const raw = corrupt({ visitPolicy: 'guild' });
    const snapshot = JSON.stringify(raw);
    const result = norm(raw);
    expect(result).toEqual({ kind: 'unsupported', reason: 'visit_policy', detail: 'not_admitted' });
    expect(result.kind).not.toBe('absent');
    expect(JSON.stringify(raw)).toBe(snapshot);
  });

  it('reads a non-string tier or policy as unsupported, never as a repairable scalar', () => {
    expect(norm(corrupt({ tier: 7 }))).toEqual({
      kind: 'unsupported',
      reason: 'tier',
      detail: 'not_admitted',
    });
    expect(norm(corrupt({ visitPolicy: null }))).toEqual({
      kind: 'unsupported',
      reason: 'visit_policy',
      detail: 'not_admitted',
    });
  });

  it('judges the version BEFORE this binary imposes its own shape on the row', () => {
    // A forward row is free to carry fields and row shapes this binary has
    // never seen. Judging it as malformed would report the wrong recovery.
    const forward = {
      ...corrupt({ version: 9 }),
      dyeSlots: [{ slot: 0, dye: 'crimson' }],
    };
    expect(norm(forward)).toEqual({ kind: 'unsupported', reason: 'version', detail: '9' });
  });

  it('does not treat a version at or below this binary as unsupported', () => {
    expect(norm(corrupt({ version: FREEHOLD_PERSIST_VERSION })).kind).toBe('loaded');
  });

  it('refuses a version that is present but not a positive integer', () => {
    // The absent-version arm exists for rows written before the field did. A
    // row carrying 0, a string, a boolean or an object was written by
    // SOMETHING, and normalizing it up to this shape would load a document no
    // released binary produced. Refusing preserves it read-only instead.
    for (const version of [0, -1, 1.5, 'one', true, {}, []]) {
      expect(norm(corrupt({ version })), `version ${JSON.stringify(version)}`).toEqual({
        kind: 'malformed',
        detail: 'version_shape',
      });
    }
    // The absent arm still loads, so the refusal above is about PRESENCE of a
    // bad value, never about the legacy row it exists to admit.
    const legacy = corrupt({});
    delete legacy.version;
    expect(norm(legacy).kind).toBe('loaded');
  });
});

describe('normalizeFreehold: the three safely repaired scalars, and nothing else', () => {
  it('clamps a condition above the scale and leaves every other field alone', () => {
    const result = norm(corrupt({ condition: 150 }));
    const state = loadedState(result);
    expect(state.condition).toBe(100);
    expect(repairsOf(result)).toEqual(['condition']);
    expect(state.rev).toBe(7);
    expect(state.version).toBe(1);
    expectContentSurvives(state);
  });

  it('clamps a condition below the scale and leaves every other field alone', () => {
    const result = norm(corrupt({ condition: -5 }));
    const state = loadedState(result);
    expect(state.condition).toBe(0);
    expect(repairsOf(result)).toEqual(['condition']);
    expect(state.rev).toBe(7);
    expect(state.version).toBe(1);
    expectContentSurvives(state);
  });

  it('repairs a condition that is not a number at all to INTACT, never to zero', () => {
    // A corrupt scalar must not be able to ruin a house nobody neglected.
    for (const broken of [without('condition'), corrupt({ condition: '88' })]) {
      const result = norm(broken);
      const state = loadedState(result);
      expect(state.condition).toBe(100);
      expect(repairsOf(result)).toEqual(['condition']);
      expect(state.rev).toBe(7);
      expectContentSurvives(state);
    }
  });

  it('leaves a condition inside the scale exactly as written', () => {
    const state = loadedState(norm(corrupt({ condition: 0 })));
    expect(state.condition).toBe(0);
    expect(norm(corrupt({ condition: 0 })).kind).toBe('loaded');
    expect(repairsOf(norm(corrupt({ condition: 100 })))).toEqual([]);
  });

  it('floors a negative revision and leaves every other field alone', () => {
    const result = norm(corrupt({ rev: -3 }));
    const state = loadedState(result);
    expect(state.rev).toBe(0);
    expect(repairsOf(result)).toEqual(['rev']);
    expect(state.condition).toBe(88);
    expect(state.version).toBe(1);
    expectContentSurvives(state);
  });

  it('floors a non-integer or missing revision and leaves every other field alone', () => {
    for (const broken of [corrupt({ rev: 2.5 }), without('rev'), corrupt({ rev: 'seven' })]) {
      const result = norm(broken);
      const state = loadedState(result);
      expect(state.rev).toBe(0);
      expect(repairsOf(result)).toEqual(['rev']);
      expect(state.condition).toBe(88);
      expectContentSurvives(state);
    }
  });

  it('defaults a missing version (the legacy row) and leaves every other field alone', () => {
    const result = norm(without('version'));
    const state = loadedState(result);
    expect(state.version).toBe(1);
    expect(repairsOf(result)).toEqual(['version']);
    expect(state.condition).toBe(88);
    expect(state.rev).toBe(7);
    expectContentSurvives(state);
  });

  it('reports the legacy absent version as a repair, and loads', () => {
    const raw = corrupt({});
    delete raw.version;
    const result = norm(raw);
    expect(loadedState(result).version).toBe(1);
    expect(repairsOf(result)).toEqual(['version']);
    expectContentSurvives(loadedState(result));
  });

  it('reports all three repairs in the declared order when a row needs all three', () => {
    const raw = corrupt({ condition: 150, rev: -1 });
    delete raw.version;
    const result = norm(raw);
    expect(repairsOf(result)).toEqual(['condition', 'rev', 'version']);
    expectContentSurvives(loadedState(result));
  });

  it('repairs NOTHING on a clean record', () => {
    expect(repairsOf(norm(row()))).toEqual([]);
  });
});

describe('the state projection and its fixed point', () => {
  const liveState = (): FreeholdState => ({
    ownerKey: 'account:42',
    plotId: asFreeholdPlotId(PLOT_ID),
    tier: 'cottage',
    layout: [
      { placementId: 1, itemId: BED_ID, x: 1.5, y: 0, z: -2.25, yaw: 3.125 },
      { placementId: 2, itemId: RUG_ID, x: -4, y: 0, z: 0.5, yaw: 0 },
    ],
    trophies: [{ plinth: 0, trophyId: TROPHY_ID }],
    condition: 88,
    conditionStampDay: 19_000,
    ledgerPaidThroughDay: 19_007,
    ledgerPrepaidWeeks: 3,
    visitPolicy: 'friends',
    isDecorating: true,
    rev: 7,
  });

  it('projects exactly the durable subset, in the canonical field order', () => {
    const persisted = persistedFreeholdFromState(liveState());
    expect(Object.keys(persisted)).toEqual([
      'version',
      'plotId',
      'tier',
      'layout',
      'trophies',
      'condition',
      'visitPolicy',
      'rev',
    ]);
    // The four fields the durable row must never carry, named one at a time so
    // a widened projection cannot hide behind a passing key-list assertion.
    const carried = persisted as unknown as Record<string, unknown>;
    expect(carried.ownerKey).toBeUndefined();
    expect(carried.isDecorating).toBeUndefined();
    expect(carried.conditionStampDay).toBeUndefined();
    expect(carried.ledgerPaidThroughDay).toBeUndefined();
    expect(carried.ledgerPrepaidWeeks).toBeUndefined();
  });

  it('rebuilds a live record with the unbound zero defaults and no build presence', () => {
    const persisted = persistedFreeholdFromState(liveState());
    expect(freeholdStateFromPersisted(persisted, 'account:77')).toEqual({
      ownerKey: 'account:77',
      plotId: 'plot:9f3a1c',
      tier: 'cottage',
      layout: [
        { placementId: 1, itemId: 'furnishing_oak_bed', x: 1.5, y: 0, z: -2.25, yaw: 3.125 },
        { placementId: 2, itemId: 'furnishing_rug_small', x: -4, y: 0, z: 0.5, yaw: 0 },
      ],
      trophies: [{ plinth: 0, trophyId: 'trophy_gnarlroot_head' }],
      condition: 88,
      conditionStampDay: 0,
      ledgerPaidThroughDay: 0,
      ledgerPrepaidWeeks: 0,
      visitPolicy: 'friends',
      isDecorating: false,
      rev: 7,
    });
  });

  it('is a FIXED POINT: persisted -> state -> persisted returns the same record', () => {
    const persisted = loadedState(norm(row()));
    const back = persistedFreeholdFromState(freeholdStateFromPersisted(persisted, 'account:42'));
    expect(back).toEqual(persisted);
    // The canonical KEY ORDER survives too, which is what makes the byte
    // measure and the saved text stable across a round trip.
    expect(JSON.stringify(back)).toBe(JSON.stringify(persisted));
  });

  it('is a fixed point the other way too: state -> persisted -> state', () => {
    const state = freeholdStateFromPersisted(loadedState(norm(row())), 'account:42');
    const back = freeholdStateFromPersisted(persistedFreeholdFromState(state), 'account:42');
    expect(back).toEqual(state);
  });

  it('deep-copies both row arrays in both directions', () => {
    const state = liveState();
    const persisted = persistedFreeholdFromState(state);
    state.layout[0].x = 999;
    state.layout.push({ placementId: 3, itemId: BED_ID, x: 0, y: 0, z: 0, yaw: 0 });
    state.trophies[0].trophyId = 'trophy_swapped';
    expect(persisted.layout).toHaveLength(2);
    expect(persisted.layout[0].x).toBe(1.5);
    expect(persisted.trophies[0].trophyId).toBe('trophy_gnarlroot_head');

    const rebuilt = freeholdStateFromPersisted(persisted, 'account:42');
    rebuilt.layout[0].x = -777;
    rebuilt.trophies.pop();
    expect(persisted.layout[0].x).toBe(1.5);
    expect(persisted.trophies).toHaveLength(1);
  });

  it('never aliases the durable value it normalized', () => {
    const raw = row();
    const state = loadedState(norm(raw));
    (raw.layout as Record<string, unknown>[])[0].x = 999;
    expect(state.layout[0].x).toBe(1.5);
  });
});

describe('persistedFreeholdBytes measures the saved text in UTF-8 bytes', () => {
  it('agrees with an encoder on the canonical JSON the save path writes', () => {
    const persisted = loadedState(norm(row()));
    const canonical = JSON.stringify({
      version: persisted.version,
      plotId: persisted.plotId,
      tier: persisted.tier,
      layout: persisted.layout,
      trophies: persisted.trophies,
      condition: persisted.condition,
      visitPolicy: persisted.visitPolicy,
      rev: persisted.rev,
    });
    expect(persistedFreeholdBytes(persisted)).toBe(new TextEncoder().encode(canonical).length);
  });

  it('counts BYTES, not characters, for multi-byte and astral ids', () => {
    const ascii = loadedState(norm(corrupt({ layout: [layoutRow({ itemId: 'aaaa' })] })));
    const accented = loadedState(norm(corrupt({ layout: [layoutRow({ itemId: 'aaaé' })] })));
    const astral = loadedState(norm(corrupt({ layout: [layoutRow({ itemId: 'aaa\u{1f3e0}' })] })));
    expect(persistedFreeholdBytes(accented)).toBe(persistedFreeholdBytes(ascii) + 1);
    // One astral character is two UTF-16 units and four UTF-8 bytes, so the
    // saved text grows by four while the JSON string grows by two.
    expect(persistedFreeholdBytes(astral)).toBe(persistedFreeholdBytes(ascii) + 3);
    for (const state of [ascii, accented, astral]) {
      const canonical = JSON.stringify(state);
      expect(persistedFreeholdBytes(state)).toBe(new TextEncoder().encode(canonical).length);
    }
  });

  it('agrees with an encoder on a lone surrogate, which JSON escapes into ASCII', () => {
    // Well-formed JSON.stringify turns a lone surrogate into a six-character
    // \\uD83C escape, so the saved text never carries one and both measures see
    // the same ASCII. The measure still has to agree on it.
    const lone = loadedState(norm(corrupt({ layout: [layoutRow({ itemId: 'a\ud83c' })] })));
    const canonical = JSON.stringify(lone);
    // Both halves pinned to a LITERAL as well as to each other, because the
    // measure is now an encode and comparing an encode against an encode is a
    // self-comparison that would survive any change to what is measured.
    expect(canonical).toContain('a\\ud83c');
    expect(persistedFreeholdBytes(lone)).toBe(new TextEncoder().encode(canonical).length);
    expect(persistedFreeholdBytes(lone)).toBe(canonical.length);
  });
});

// The maximal legal record and the one-over record: the two witnesses for the
// measured FREEHOLD_MAX_OWNED_BYTES ceiling. The fixture itself lives in
// tests/helpers/maximal_freehold.ts because tests/server/freehold_db.pg.test.ts
// round-trips the SAME document through real PostgreSQL to prove the stored
// ceiling; two copies would drift, and the drift lands as an account this realm
// can write and then never read.
const maximalLegalRecord = maximalLegalFreeholdRecord;
const maximalOpts = MAXIMAL_FREEHOLD_OPTS;

describe('the measured byte ceiling, proved by the maximal and one-over records', () => {
  it('generates distinct worst-case ids at the longest legal integer text', () => {
    // Anti-vacuity for the generator itself: a fixture that quietly emitted
    // short or repeated ids would understate the worst case it exists to prove.
    const ids = worstCaseIntegerIds(FREEHOLD_MAX_LAYOUT_ROWS);
    expect(ids).toHaveLength(FREEHOLD_MAX_LAYOUT_ROWS);
    expect(new Set(ids).size).toBe(FREEHOLD_MAX_LAYOUT_ROWS);
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true);
      expect(JSON.stringify(id)).toHaveLength(17);
    }
    expect(JSON.stringify(MAXIMAL_FREEHOLD_COORD)).toHaveLength(25);
    expect(JSON.stringify(MAXIMAL_FREEHOLD_CONDITION)).toHaveLength(3);
    expect(JSON.stringify(MAXIMAL_FREEHOLD_REV)).toHaveLength(16);
    // The two identities sit at their STORED column ceilings, which is what
    // makes the record insertable and so round-trippable; the pg suite pins
    // both against the DDL's own constants.
    expect(MAXIMAL_FREEHOLD_TIER).toHaveLength(FREEHOLD_MAX_ID_LENGTH);
    expect(MAXIMAL_FREEHOLD_POLICY).toHaveLength(32);
  });

  it('loads the maximal legal record, and its measured bytes sit just under the ceiling', () => {
    const result = norm(maximalLegalRecord(), maximalOpts);
    const state = loadedState(result);
    expect(result.kind).toBe('loaded');
    expect(state.layout).toHaveLength(FREEHOLD_MAX_LAYOUT_ROWS);
    expect(state.trophies).toHaveLength(FREEHOLD_MAX_TROPHY_ROWS);
    const bytes = persistedFreeholdBytes(state);
    // The constant is the measured worst case rounded UP to the next whole
    // 1024, so it must ADMIT the worst case and sit less than 1024 above it. A
    // constant chosen by feel would fail one side or the other.
    expect(bytes).toBeLessThanOrEqual(FREEHOLD_MAX_OWNED_BYTES);
    expect(bytes).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES - 1024);
    expect(FREEHOLD_MAX_OWNED_BYTES % 1024).toBe(0);
    // The measured number the workbook records.
    expect(bytes).toBe(101_139);
  });

  it('refuses the one-over record: one layout row past the ceiling', () => {
    const oneOver = maximalLegalRecord(FREEHOLD_MAX_LAYOUT_ROWS + 1);
    expect(norm(oneOver, maximalOpts)).toEqual({
      kind: 'malformed',
      detail: 'layout_over_ceiling:421',
    });
  });

  it('refuses a record whose bytes pass the ceiling while every row count is legal', () => {
    const maximal = loadedState(norm(maximalLegalRecord(), maximalOpts));
    const bytes = persistedFreeholdBytes(maximal);
    expect(norm(maximalLegalRecord(), { ...maximalOpts, maxOwnedBytes: bytes - 1 })).toEqual({
      kind: 'oversize',
      bytes,
      limit: bytes - 1,
    });
    // The boundary is inclusive: a record measuring exactly the limit loads.
    expect(norm(maximalLegalRecord(), { ...maximalOpts, maxOwnedBytes: bytes }).kind).toBe(
      'loaded',
    );
  });

  it('derives the stored ceiling from the canonical one plus the separators jsonb re-renders', () => {
    // FREEHOLD_MAX_STORED_BYTES bounds a DIFFERENT text from its sibling: what
    // PostgreSQL renders back out of jsonb, which prints a space after every
    // colon and every comma. The arithmetic is computed here and the same
    // number is re-measured against a real server in
    // tests/server/freehold_db.pg.test.ts, so neither side can drift alone.
    const state = loadedState(norm(maximalLegalRecord(), maximalOpts));
    const contentJson = JSON.stringify(state.layout).length + JSON.stringify(state.trophies).length;
    expect(contentJson).toBe(100_866);
    // A layout row has six keys (six colons, five commas) and a trophy row two
    // (two colons, one comma); each array adds one comma per gap.
    const separators =
      FREEHOLD_MAX_LAYOUT_ROWS * 11 +
      (FREEHOLD_MAX_LAYOUT_ROWS - 1) +
      FREEHOLD_MAX_TROPHY_ROWS * 3 +
      (FREEHOLD_MAX_TROPHY_ROWS - 1);
    expect(separators).toBe(5_166);
    const stored = contentJson + separators;
    expect(stored).toBe(106_032);
    // The same two-sided rounding claim the canonical ceiling carries, and the
    // ordering that makes the pair correct: the stored bound must ADMIT the
    // maximal legal record, or a row this realm writes is one it cannot read.
    expect(FREEHOLD_MAX_STORED_BYTES).toBeGreaterThanOrEqual(stored);
    expect(FREEHOLD_MAX_STORED_BYTES - stored).toBeLessThan(1024);
    expect(FREEHOLD_MAX_STORED_BYTES % 1024).toBe(0);
    expect(FREEHOLD_MAX_STORED_BYTES).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES);
  });

  it('leaves room for EVERY admissible record, not only the one measured above', () => {
    // The general argument, pinned. A fixture proves one point; the property
    // has to hold for every record the canonical ceiling admits. The minimal
    // wrapper around the two content arrays bounds how much of that ceiling the
    // content itself can use, and the row ceilings bound how much jsonb can add
    // in separators, so the worst admissible record is computable rather than
    // searched for.
    // THE MINIMAL WRAPPER, not the maximal fixture's. Computing it from the
    // maximal record (a 64-character plot id and tier, a 32-character policy, a
    // three-digit condition and a sixteen-digit revision) makes the wrapper 277
    // bytes and proves a 231-byte margin; the real worst case is the SHORTEST
    // admissible wrapper, 101 bytes, and a 55-byte margin. The difference is not
    // academic: one optional seventh field on a layout row renders two more
    // separators per row, 840 bytes at the row ceiling, which clears 231 but not
    // 55, and the maximal fixture would still validate so nothing else would go
    // red. A record at the canonical ceiling would then store past the stored
    // one, the account read would answer oversize, and the owner would be
    // write-blocked on a row this realm itself wrote.
    const minimalWrapper = {
      version: 1,
      // One character each: the shortest identity the loader admits (the empty
      // id is admitted too, but a one-character id is the shortest a minted or
      // authored one can be, and the arithmetic wants the smaller of the two).
      plotId: 'a',
      tier: 'a',
      layout: [] as unknown[],
      trophies: [] as unknown[],
      condition: 0,
      visitPolicy: 'a',
      rev: 0,
    };
    const wrapperBytes = JSON.stringify(minimalWrapper).length;
    expect(wrapperBytes).toBeLessThan(
      JSON.stringify({
        ...loadedState(norm(maximalLegalRecord(), maximalOpts)),
        layout: [],
        trophies: [],
      }).length,
    );
    const maxContentJson = FREEHOLD_MAX_OWNED_BYTES - wrapperBytes;
    // DERIVED FROM THE FIELD SETS, not two hand-copied numbers. jsonb re-renders
    // one space after each colon and each comma, so a row costs its own field
    // count in colons plus that count minus one in commas, and each array adds
    // one comma per gap. A seventh layout field moves this on its own.
    const layoutFields = 6;
    const trophyFields = 2;
    const separatorsPerRow = (fields: number): number => fields + (fields - 1);
    const maxSeparators =
      FREEHOLD_MAX_LAYOUT_ROWS * separatorsPerRow(layoutFields) +
      (FREEHOLD_MAX_LAYOUT_ROWS - 1) +
      FREEHOLD_MAX_TROPHY_ROWS * separatorsPerRow(trophyFields) +
      (FREEHOLD_MAX_TROPHY_ROWS - 1);
    // The field counts are the SHAPE's, read off a real row rather than asserted.
    const sampleRow = loadedState(norm(maximalLegalRecord(), maximalOpts));
    expect(Object.keys(sampleRow.layout[0]).length).toBe(layoutFields);
    expect(Object.keys(sampleRow.trophies[0]).length).toBe(trophyFields);
    // No record the canonical ceiling admits can render past the stored one.
    expect(maxContentJson + maxSeparators).toBeLessThanOrEqual(FREEHOLD_MAX_STORED_BYTES);
  });

  it('checks the row ceiling BEFORE the byte ceiling, so malformed wins over oversize', () => {
    // TWO rows over, not one: the maximal record sits 237 bytes under the
    // rounded ceiling and one worst-case layout row is 232 bytes, so a
    // one-over record is genuinely still inside the byte bound and would make
    // this ordering claim vacuous. Two rows clears it.
    const over = maximalLegalRecord(FREEHOLD_MAX_LAYOUT_ROWS + 2);
    expect(persistedFreeholdBytes(over as unknown as PersistedFreehold)).toBeGreaterThan(
      FREEHOLD_MAX_OWNED_BYTES,
    );
    expect(norm(over, maximalOpts)).toEqual({
      kind: 'malformed',
      detail: `layout_over_ceiling:${FREEHOLD_MAX_LAYOUT_ROWS + 2}`,
    });
  });
});

describe('freeholdWriteRefusal: the save path refuses exactly what the load path refuses', () => {
  // WRITABLE IMPLIES READABLE. Each case asserts BOTH halves against the SAME
  // document, so the coupling cannot rot from one side: if a future edit
  // loosens the loader, the paired assertion here fails rather than letting the
  // save path mint a row that comes back held.
  const maximalState = (): PersistedFreehold =>
    loadedState(norm(maximalLegalRecord(), maximalOpts));

  it('passes the maximal legal record, which the loader also admits', () => {
    const state = maximalState();
    expect(freeholdWriteRefusal(state)).toBeNull();
    expect(norm(maximalLegalRecord(), maximalOpts).kind).toBe('loaded');
  });

  it('refuses one layout row past the ceiling, the way the loader calls it malformed', () => {
    const state = maximalState();
    const over: PersistedFreehold = {
      ...state,
      layout: [...state.layout, state.layout[0]],
    };
    expect(freeholdWriteRefusal(over)).toEqual({
      kind: 'layout_over_ceiling',
      rows: FREEHOLD_MAX_LAYOUT_ROWS + 1,
      limit: FREEHOLD_MAX_LAYOUT_ROWS,
    });
    expect(norm(maximalLegalRecord(FREEHOLD_MAX_LAYOUT_ROWS + 1), maximalOpts)).toEqual({
      kind: 'malformed',
      detail: `layout_over_ceiling:${FREEHOLD_MAX_LAYOUT_ROWS + 1}`,
    });
  });

  it('refuses one trophy past the ceiling', () => {
    const state = maximalState();
    const over: PersistedFreehold = {
      ...state,
      trophies: [...state.trophies, state.trophies[0]],
    };
    expect(freeholdWriteRefusal(over)).toEqual({
      kind: 'trophies_over_ceiling',
      rows: FREEHOLD_MAX_TROPHY_ROWS + 1,
      limit: FREEHOLD_MAX_TROPHY_ROWS,
    });
  });

  it('refuses a byte-oversize document with the same bytes and limit the loader reports', () => {
    const state = maximalState();
    const bytes = persistedFreeholdBytes(state);
    expect(freeholdWriteRefusal(state, { maxOwnedBytes: bytes - 1 })).toEqual({
      kind: 'oversize',
      bytes,
      limit: bytes - 1,
    });
    expect(norm(maximalLegalRecord(), { ...maximalOpts, maxOwnedBytes: bytes - 1 })).toEqual({
      kind: 'oversize',
      bytes,
      limit: bytes - 1,
    });
    // Inclusive on both sides, checked together so neither drifts.
    expect(freeholdWriteRefusal(state, { maxOwnedBytes: bytes })).toBeNull();
  });

  it('checks rows before bytes, so a document that breaks both names the row cause', () => {
    const state = maximalState();
    // Two rows over, for the same anti-vacuity reason as the loader's ordering
    // case: one row does not clear the rounding slack.
    const both: PersistedFreehold = {
      ...state,
      layout: [...state.layout, state.layout[0], state.layout[1]],
    };
    expect(persistedFreeholdBytes(both)).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES);
    expect(freeholdWriteRefusal(both)?.kind).toBe('layout_over_ceiling');
  });

  it('holds the PROPERTY, not just the ceilings: writable implies readable', () => {
    // THE TITLE'S ACTUAL CLAIM, tested as a property over documents rather than
    // as three named cases. The ceilings were only three of the checks the
    // loader applies: it also refuses an exponential coordinate, a placement id
    // past the safe-integer range, a duplicate placement id, an over-long
    // identity, an unadmitted tier or policy, an off-charset plot id and a
    // forward version. A writer enforcing only the ceilings accepted every one
    // of those, so this realm could produce a row it would then hold forever.
    const state = maximalState();
    const cases: ReadonlyArray<readonly [string, PersistedFreehold]> = [
      ['exponential coordinate', { ...state, layout: [{ ...state.layout[0], x: 1e-7 }] }],
      ['huge coordinate', { ...state, layout: [{ ...state.layout[0], x: 1e21 }] }],
      ['unsafe placement id', { ...state, layout: [{ ...state.layout[0], placementId: 2 ** 53 }] }],
      ['duplicate placement id', { ...state, layout: [state.layout[0], { ...state.layout[0] }] }],
      [
        'over-long item id',
        {
          ...state,
          layout: [{ ...state.layout[0], itemId: 'i'.repeat(FREEHOLD_MAX_ID_LENGTH + 1) }],
        },
      ],
      ['unadmitted tier', { ...state, tier: 'lodge' }],
      ['unadmitted visit policy', { ...state, visitPolicy: 'nobody' }],
      ['off-charset plot id', { ...state, plotId: 'plot/9f3a1c' }],
      ['forward version', { ...state, version: FREEHOLD_PERSIST_VERSION + 1 }],
    ];
    for (const [name, doc] of cases) {
      const refusal = freeholdWriteRefusal(doc, maximalOpts);
      // Every one of these must be refused by the WRITER. If it is not, the
      // property is false and this realm can produce a row it cannot read.
      expect(refusal, `${name} must be refused by the save path`).not.toBeNull();
      // And the loader agrees, which is what makes each refusal the right one
      // rather than an arbitrary extra rule.
      const roundTripped = JSON.parse(JSON.stringify(doc));
      expect(norm(roundTripped, maximalOpts).kind, `${name} load`).not.toBe('loaded');
    }
  });

  it('is stricter than the loader on the two scalars the loader REPAIRS', () => {
    // Deliberately asymmetric, in the safe direction. The loader repairs a
    // negative revision and a fractional condition and still answers loaded, so
    // neither would break writable-implies-readable. The writer refuses them
    // anyway: a save is the one place a canonical document can be guaranteed,
    // and writing a value the loader will silently rewrite means the row and
    // the record disagree from the moment it lands.
    const state = maximalState();
    for (const doc of [
      { ...state, rev: -1 },
      { ...state, condition: 12.5 },
    ]) {
      expect(freeholdWriteRefusal(doc, maximalOpts)).not.toBeNull();
      const loaded = norm(JSON.parse(JSON.stringify(doc)), maximalOpts);
      expect(loaded.kind).toBe('loaded');
      expect(repairsOf(loaded).length).toBeGreaterThan(0);
    }
  });

  it('is not vacuous: a legal document passes BOTH sides', () => {
    const state = maximalState();
    expect(freeholdWriteRefusal(state, maximalOpts)).toBeNull();
    expect(norm(JSON.parse(JSON.stringify(state)), maximalOpts).kind).toBe('loaded');
  });

  /**
   * A record BETWEEN the two ceilings: over `FREEHOLD_MAX_OWNED_BYTES`, under
   * `FREEHOLD_MAX_STORED_BYTES`, and legal by every other predicate.
   *
   * It exists because AN IDENTIFIER IS BOUNDED BY LENGTH, NOT BY BYTES:
   * `boundedId` measures `String.length` (UTF-16 code units) and neither
   * `itemId` nor `trophyId` carries a charset rule, so a 64-character id of
   * two-byte characters passes every row predicate at twice the bytes. That is
   * exactly what the measured byte ceiling is for, and it is the ONLY way to
   * reach the byte gate at all: with plain ASCII ids every field is already at
   * its maximum in the maximal fixture, so no all-ASCII document can exceed the
   * ceiling without failing a row or id predicate first.
   */
  const betweenTheCeilingsState = (): PersistedFreehold => {
    const state = maximalState();
    // AN EXPLICIT ESCAPE, precomposed, so the fixture's size cannot change
    // with the file's Unicode normalization. Written as a literal accented
    // character this was the DECOMPOSED form (U+0065 U+0301), which is 64
    // code units but only 96 UTF-8 bytes, and any tool that normalized the
    // source would have halved it to 32 code units and moved the fixture out
    // of the window it exists to occupy. U+00E9 is one code unit and two
    // UTF-8 bytes, so 64 of them are 64 code units and 128 bytes.
    const wide = '\u00e9'.repeat(FREEHOLD_MAX_ID_LENGTH);
    expect(wide).toHaveLength(FREEHOLD_MAX_ID_LENGTH);
    const layout = state.layout.map((row, index) => (index < 40 ? { ...row, itemId: wide } : row));
    return { ...state, layout };
  };

  it('builds a record that really does sit between the two ceilings', () => {
    // ANTI-VACUITY for the fixture below: if it landed under the canonical
    // ceiling, or over the stored one, the two cases after it would prove
    // nothing about which ceiling the default is.
    const bytes = persistedFreeholdBytes(betweenTheCeilingsState());
    expect(bytes).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES);
    expect(bytes).toBeLessThanOrEqual(FREEHOLD_MAX_STORED_BYTES);
  });

  it('defaults to the canonical ceiling, not the stored one', () => {
    // Passing the wider stored bound here would let the save path emit a record
    // the loader refuses, which is the exact inversion this function prevents.
    // ASSERTED ON A DOCUMENT THAT DISCRIMINATES: every assertion here used to
    // use a record under BOTH ceilings, so swapping the default to the stored
    // bound left the case green.
    const state = maximalState();
    const bytes = persistedFreeholdBytes(state);
    expect(freeholdWriteRefusal({ ...state, condition: 100 })).toBeNull();
    expect(bytes).toBeLessThanOrEqual(FREEHOLD_MAX_OWNED_BYTES);
    expect(freeholdWriteRefusal(state, { maxOwnedBytes: FREEHOLD_MAX_OWNED_BYTES })).toBeNull();

    const between = betweenTheCeilingsState();
    const refusal = freeholdWriteRefusal(between, maximalOpts);
    expect(refusal?.kind).toBe('oversize');
    expect(refusal).toMatchObject({ limit: FREEHOLD_MAX_OWNED_BYTES });
    // And it IS admitted at the stored bound, which is what makes the case
    // above a discrimination rather than a restatement.
    expect(
      freeholdWriteRefusal(between, { ...maximalOpts, maxOwnedBytes: FREEHOLD_MAX_STORED_BYTES }),
    ).toBeNull();
  });

  it('the LOADER defaults to the canonical ceiling too', () => {
    // The production loader is called with no `maxOwnedBytes`
    // (server/freehold_persist.ts binds only the identity sets) and the SQL
    // pre-gate admits up to the wider stored bound, so this default is the only
    // thing standing between an over-canonical row and a record this realm
    // could write and never read back.
    const between = betweenTheCeilingsState();
    const raw = JSON.parse(JSON.stringify(between));
    expect(norm(raw, maximalOpts).kind).toBe('oversize');
    expect(norm(raw, { ...maximalOpts, maxOwnedBytes: FREEHOLD_MAX_STORED_BYTES }).kind).toBe(
      'loaded',
    );
  });
});

describe('the ceilings are checked before the loader reads a single row', () => {
  /** Layout rows whose every field is an enumerable getter, so a read of any
   *  value is counted. Object.keys does not fire them, which is exactly the
   *  point: the name and count checks are free, the value reads are not. */
  function countingRows(count: number, counter: { reads: number }): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
      const source = layoutRow({ placementId: i });
      const probe: Record<string, unknown> = {};
      for (const key of Object.keys(source)) {
        Object.defineProperty(probe, key, {
          enumerable: true,
          configurable: true,
          get: () => {
            counter.reads++;
            return source[key];
          },
        });
      }
      rows.push(probe);
    }
    return rows;
  }

  it('reads the rows when the count is legal (the positive control)', () => {
    const counter = { reads: 0 };
    const result = norm(corrupt({ layout: countingRows(FREEHOLD_MAX_LAYOUT_ROWS, counter) }));
    expect(result.kind).toBe('loaded');
    expect(counter.reads).toBeGreaterThan(0);
  });

  it('reads NO row when the count is one over the ceiling', () => {
    const counter = { reads: 0 };
    const result = norm(corrupt({ layout: countingRows(FREEHOLD_MAX_LAYOUT_ROWS + 1, counter) }));
    expect(result).toEqual({ kind: 'malformed', detail: 'layout_over_ceiling:421' });
    // No mapping, no cloning, no measuring: the ceiling refused the record
    // before the loader did any work proportional to it.
    expect(counter.reads).toBe(0);
  });

  it('reads no trophy row when the trophy count is one over the ceiling', () => {
    const counter = { reads: 0 };
    const trophies = Array.from({ length: FREEHOLD_MAX_TROPHY_ROWS + 1 }, (_, i) => {
      const source = trophyRow({ plinth: i });
      const probe: Record<string, unknown> = {};
      for (const key of Object.keys(source)) {
        Object.defineProperty(probe, key, {
          enumerable: true,
          configurable: true,
          get: () => {
            counter.reads++;
            return source[key];
          },
        });
      }
      return probe;
    });
    expect(norm(corrupt({ trophies }))).toEqual({
      kind: 'malformed',
      detail: 'trophies_over_ceiling:33',
    });
    expect(counter.reads).toBe(0);
  });
});

describe('freeholdLoadDiagnostic carries counts and classification only', () => {
  it('says nothing about an absent row or a clean load', () => {
    expect(freeholdLoadDiagnostic({ kind: 'absent' })).toBeNull();
    expect(freeholdLoadDiagnostic(norm(row()))).toBeNull();
  });

  it('names the repairs of a repaired load', () => {
    const raw = corrupt({ condition: 150, rev: -1 });
    delete raw.version;
    expect(freeholdLoadDiagnostic(norm(raw))).toEqual({
      kind: 'loaded',
      detail: 'repaired:condition,rev,version',
    });
  });

  it('names the reason of an unsupported row without echoing the row', () => {
    expect(freeholdLoadDiagnostic(norm(corrupt({ tier: 'lodge' })))).toEqual({
      kind: 'unsupported',
      detail: 'tier:not_admitted',
    });
    expect(freeholdLoadDiagnostic(norm(corrupt({ version: 4 })))).toEqual({
      kind: 'unsupported',
      detail: 'version:4',
    });
  });

  it('names the fault of a malformed row and the measure of an oversize one', () => {
    expect(freeholdLoadDiagnostic(norm(corrupt({ plotId: 'plot/x' })))).toEqual({
      kind: 'malformed',
      detail: 'plot_id_shape',
    });
    expect(freeholdLoadDiagnostic({ kind: 'oversize', bytes: 200_000, limit: 65_536 })).toEqual({
      kind: 'oversize',
      detail: 'bytes:200000:limit:65536',
    });
    expect(
      freeholdLoadDiagnostic({
        kind: 'oversize',
        bytes: Number.POSITIVE_INFINITY,
        limit: 65_536,
      }),
    ).toEqual({ kind: 'oversize', detail: 'bytes:na:limit:65536' });
  });

  it('replaces a detail it does not recognize instead of echoing it', () => {
    // The bound is a POSITIVE shape test, so a widened producer cannot smuggle
    // a plot id, an owner key or a megabyte of junk into a log line through it.
    expect(freeholdLoadDiagnostic({ kind: 'malformed', detail: `plot_id=${PLOT_ID}` })).toEqual({
      kind: 'malformed',
      detail: 'unclassified',
    });
    expect(freeholdLoadDiagnostic({ kind: 'malformed', detail: 'x'.repeat(5_000) })).toEqual({
      kind: 'malformed',
      detail: 'unclassified',
    });
    expect(
      freeholdLoadDiagnostic({
        kind: 'unsupported',
        reason: 'tier',
        detail: 'lodge_of_account:42',
      }),
    ).toEqual({ kind: 'unsupported', detail: 'tier:unclassified' });
    // A bare identity is the exact shape the bound exists to refuse: it is
    // short, lower case and innocent-looking, and a charset test alone would
    // have passed it straight into the log.
    expect(freeholdLoadDiagnostic({ kind: 'malformed', detail: PLOT_ID })).toEqual({
      kind: 'malformed',
      detail: 'unclassified',
    });
    expect(freeholdLoadDiagnostic({ kind: 'malformed', detail: BED_ID })).toEqual({
      kind: 'malformed',
      detail: 'unclassified',
    });
  });

  it('passes every detail the loader actually produces through unchanged', () => {
    // The other half of the bound: an allowlist that quietly replaced a real
    // fault would make every diagnostic above read `unclassified`.
    const produced: readonly FreeholdLoadResult[] = [
      norm(42),
      norm(new Map()),
      norm(corrupt({ plotId: 'plot/x' })),
      norm(corrupt({ ownerKey: 'account:42' })),
      norm(corrupt({ layout: 'none' })),
      norm(corrupt({ trophies: 'none' })),
      norm(corrupt({ layout: [layoutRow({ itemId: 5 })] })),
      norm(corrupt({ trophies: [trophyRow({ plinth: 0.5 })] })),
      norm(corrupt({ condition: 150 })),
      norm(corrupt({ version: 3 })),
      norm(corrupt({ tier: 'lodge' })),
    ];
    for (const result of produced) {
      const diagnostic = freeholdLoadDiagnostic(result);
      expect(diagnostic, result.kind).not.toBeNull();
      expect(diagnostic?.detail, result.kind).not.toContain('unclassified');
    }
  });

  it('names every detail that reaches a log from OUTSIDE this reporter', () => {
    // WHAT THE LOOP ABOVE CANNOT SEE, and the reason two producers reached an
    // operator log unbounded while the ledger recorded the channel closed: that
    // loop walks normalizeFreehold's own results, so it covers the reporter's
    // producers and nothing else. Every shape below reaches a log without
    // passing through freeholdLoadDiagnostic at all, all of them from server/
    // modules. An earlier version of this list enumerated only the four that
    // are WRAPPED today, which left the three that are not (the whole-preload
    // cap's refusal and both of classify's ordering refusals) covered by
    // nothing: one of them was in fact absent from KNOWN_DETAILS for a whole
    // round. Whether an arm is wrapped yet is not the question this pin should
    // ask; whether wrapping it would LOSE the diagnostic is.
    // If a shape here is not in KNOWN_DETAILS, wrapping it does not leak: it
    // silently replaces a real diagnostic with `unclassified`, so this pin is
    // what stops the bound being applied and the diagnostic being lost.
    const fromOutside = [
      // server/freehold_db.ts, the stranded plot slot.
      'plot_index 3 is outside the admitted slot 0',
      // server/freehold_persist.ts classify(), both oversize arms.
      '4194304 on-disk bytes past the pre-gate, so the 106496 byte stored limit was never measured',
      '131072 owned bytes over the 101376 byte limit',
      // server/freehold_db.ts upsertFreehold(), both conflict literals, and the
      // store's own missing-row literal beside them.
      'the minted plot identity is already in use by another row',
      'insert conflicted but no row was present to diagnose',
      'the row vanished',
      // server/freehold_load_outcome.ts, the whole-preload cap's refusal.
      'no durable answer within 10000 ms',
      // server/freehold_persist.ts classify(), BOTH ordering refusals. Neither
      // is wrapped at its call site today, which is exactly why they belong
      // here: the next reader to wrap them for consistency must not lose them.
      'the live record was seeded before this load landed',
      'the login that asked for this load had already given up on it',
    ];
    for (const detail of fromOutside) {
      expect(boundedFreeholdDetail(detail), detail).toBe(detail);
    }
    // The control, so the loop above is not passing because the bound admits
    // everything: a plot id and an item id are exactly what a charset test
    // would wave through, and both must still read as unclassified.
    for (const leak of ['plot:9f3a1c', 'furnishing_oak_bed', 'account:918273']) {
      expect(boundedFreeholdDetail(leak), leak).toBe('unclassified');
    }
  });
});

describe('the two deliberate admissions the preservation rule buys', () => {
  it('admits an EMPTY item id and an empty trophy id, preserving the rest of the record', () => {
    // Deliberate, and stated in boundedId: an empty id is bounded and names
    // nothing, and refusing it would put a whole owner's record into read-only
    // recovery over a field that costs two bytes. Without this fixture the
    // admission is indistinguishable from a refusal nobody wrote a test for.
    const withEmptyItem = norm(corrupt({ layout: [layoutRow({ itemId: '' })] }));
    const state = loadedState(withEmptyItem);
    expect(state.layout).toHaveLength(1);
    expect(state.layout[0].itemId).toBe('');
    // The rest of the row is untouched: an admission is not a repair.
    expect(state.layout[0].placementId).toBe(1);
    expect(repairsOf(withEmptyItem)).toEqual([]);

    const withEmptyTrophy = loadedState(norm(corrupt({ trophies: [trophyRow({ trophyId: '' })] })));
    expect(withEmptyTrophy.trophies[0].trophyId).toBe('');
  });

  it('refuses the id ONE character past the ceiling, so the admission is not a missing check', () => {
    // The contrast arm. Without it the case above would also pass on a loader
    // that had no id bound at all.
    const overLong = 'i'.repeat(FREEHOLD_MAX_ID_LENGTH + 1);
    expect(norm(corrupt({ layout: [layoutRow({ itemId: overLong })] }))).toEqual({
      kind: 'malformed',
      detail: 'layout_row:0:item_id',
    });
  });

  it('measures a record it cannot serialize as INFINITELY large, never as zero', () => {
    // A record JSON cannot serialize is corrupt by definition on a jsonb row.
    // Zero would make it the SMALLEST record there is, so it would sail under
    // every byte ceiling and be written; infinity refuses it at each one.
    // The fault has to sit inside a field the canonical serializer READS: a
    // stray extra key is dropped by construction, so it would prove nothing.
    // A layout array that contains itself is the smallest honest example.
    const selfReferential: unknown[] = [];
    selfReferential.push(selfReferential);
    const broken = { ...loadedState(norm(row())), layout: selfReferential };
    const bytes = persistedFreeholdBytes(broken as unknown as PersistedFreehold);
    expect(bytes).toBe(Number.POSITIVE_INFINITY);
    expect(bytes).toBeGreaterThan(FREEHOLD_MAX_OWNED_BYTES);
    // And the save-path refusal agrees, which is the consequence that matters.
    // And the save path refuses it, though on the ROW predicate rather than the
    // byte one: a document the serializer cannot measure cannot pass the row
    // checks either, which run first. Both answers are a refusal, which is what
    // the property needs; the point of the measure returning infinity is that
    // it can never be the SMALLEST record there is and sail under a ceiling.
    expect(freeholdWriteRefusal(broken as unknown as PersistedFreehold)?.kind).toBe('malformed');
  });
});

describe('a diagnostic names the fault and carries no player data', () => {
  // The bound is the ONLY thing between a corrupt row and a log line, so each
  // case drives a real refusal and then asserts on both halves: the fault is
  // named, and none of the three identities a row can carry appears.
  const detailOf = (result: FreeholdLoadResult): string =>
    freeholdLoadDiagnostic(result)?.detail ?? '';

  it('names the fault for a refused record, carrying no identity from it', () => {
    const diagnostic = freeholdLoadDiagnostic(norm(corrupt({ tier: 'lodge' })));
    expect(diagnostic?.kind).toBe('unsupported');
    expect(diagnostic?.detail).toContain('tier:not_admitted');
    const line = JSON.stringify(diagnostic);
    expect(line).not.toContain(PLOT_ID);
    expect(line).not.toContain(BED_ID);
    expect(line).not.toContain(TROPHY_ID);
  });

  it('carries no item id even when the fault was found inside a row', () => {
    const overLong = 'i'.repeat(FREEHOLD_MAX_ID_LENGTH + 1);
    const diagnostic = freeholdLoadDiagnostic(
      norm(corrupt({ layout: [layoutRow({ itemId: overLong })] })),
    );
    expect(diagnostic?.kind).toBe('malformed');
    expect(diagnostic?.detail).toBe('layout_row:0:item_id');
    expect(JSON.stringify(diagnostic)).not.toContain(overLong);
    expect(JSON.stringify(diagnostic)).not.toContain(PLOT_ID);
  });

  it('says nothing at all for an absent row or a clean load', () => {
    // Silence is the contract: an ordinary boot logs nothing, so a line in the
    // log always means something happened.
    expect(freeholdLoadDiagnostic({ kind: 'absent' })).toBeNull();
    expect(freeholdLoadDiagnostic(norm(row()))).toBeNull();
  });

  it('names the repairs on a repaired load, and nothing else', () => {
    const diagnostic = freeholdLoadDiagnostic(norm(corrupt({ condition: 150 })));
    expect(diagnostic?.kind).toBe('loaded');
    expect(diagnostic?.detail).toBe('repaired:condition');
    expect(JSON.stringify(diagnostic)).not.toContain(PLOT_ID);
  });

  it('replaces a detail its shape list does not name, rather than passing it through', () => {
    // Fails closed: a producer that adds a fault adds its shape here, and until
    // it does the operator loses one detail and the log leaks nothing.
    expect(detailOf({ kind: 'malformed', detail: `looks_fine_${PLOT_ID}` })).toBe('unclassified');
    expect(detailOf({ kind: 'malformed', detail: 'layout_row:0:item_id' })).toBe(
      'layout_row:0:item_id',
    );
  });
});
