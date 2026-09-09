// The maximal legal freehold record and its worst-case field values: the shared
// witness for both measured byte ceilings.
//
// It lives here rather than inside one suite because TWO suites have to agree
// on the same document: tests/freehold_state.test.ts proves the canonical JSON
// measure FREEHOLD_MAX_OWNED_BYTES bounds, and tests/server/freehold_db.pg.test.ts
// round-trips the SAME record through real PostgreSQL to prove
// FREEHOLD_MAX_STORED_BYTES bounds what jsonb renders back. Two copies of a
// worst-case fixture would drift, and the drift would land as an account that
// this realm can write and then never read.
//
// Every value here is the WORST legal case of its field, never a comfortable
// middle: a ceiling proved with a friendly fixture is not proved at all.

import {
  FREEHOLD_MAX_ID_LENGTH,
  FREEHOLD_MAX_LAYOUT_ROWS,
  FREEHOLD_MAX_TROPHY_ROWS,
  FREEHOLD_PERSIST_VERSION,
} from '../../src/sim/freehold/persisted';

// The two identity lengths are the STORED column ceilings, not
// FREEHOLD_MAX_ID_LENGTH, because a record the sim admits and PostgreSQL
// refuses cannot be round-tripped and so cannot prove anything. They are
// literals here to keep this helper free of any server import;
// tests/server/freehold_db.pg.test.ts pins them against
// FREEHOLD_TIER_COLUMN_MAX_LENGTH and FREEHOLD_VISIT_POLICY_COLUMN_MAX_LENGTH.
export const MAXIMAL_FREEHOLD_TIER = 't'.repeat(64);
export const MAXIMAL_FREEHOLD_POLICY = 'v'.repeat(32);

// Every worst case here is POSITIONAL, because the codec rule in
// src/sim/freehold/persisted.ts refuses a number whose JSON text carries an
// exponent: an exponential double stores as its full positional expansion,
// which is exactly what would let a record pass the canonical ceiling and then
// fail the storage bound. The longest positional coordinate text is 25
// characters and the longest positional safe integer is 17.
export const MAXIMAL_FREEHOLD_COORD = -0.0000012345678901234567;
/** Condition is a 0..100 integer scale, so 100 is both the longest text and
 *  the intact value. */
export const MAXIMAL_FREEHOLD_CONDITION = 100;
export const MAXIMAL_FREEHOLD_REV = Number.MAX_SAFE_INTEGER;

/** `count` DISTINCT ids whose JSON text is the longest a POSITIONAL SAFE
 *  integer can take, counting up from the most negative one. Distinctness
 *  matters: duplicates would be refused by the loader, so the worst case has to
 *  be both maximal in text and legal in identity. */
export function worstCaseIntegerIds(count: number): number[] {
  const out: number[] = [];
  for (let value = -Number.MAX_SAFE_INTEGER; out.length < count; value += 1) {
    if (JSON.stringify(value).length === 17) out.push(value);
  }
  return out;
}

/** The maximal legal durable record as it arrives at normalizeFreehold: 420
 *  layout rows and 32 trophies, every id at FREEHOLD_MAX_ID_LENGTH characters,
 *  every numeric field at the longest positional JSON text its domain admits. */
export function maximalLegalFreeholdRecord(
  layoutRows: number = FREEHOLD_MAX_LAYOUT_ROWS,
): Record<string, unknown> {
  const id = 'i'.repeat(FREEHOLD_MAX_ID_LENGTH);
  return {
    version: FREEHOLD_PERSIST_VERSION,
    plotId: 'p'.repeat(FREEHOLD_MAX_ID_LENGTH),
    tier: MAXIMAL_FREEHOLD_TIER,
    layout: worstCaseIntegerIds(layoutRows).map((placementId) => ({
      placementId,
      itemId: id,
      x: MAXIMAL_FREEHOLD_COORD,
      y: MAXIMAL_FREEHOLD_COORD,
      z: MAXIMAL_FREEHOLD_COORD,
      yaw: MAXIMAL_FREEHOLD_COORD,
    })),
    trophies: worstCaseIntegerIds(FREEHOLD_MAX_TROPHY_ROWS).map((plinth) => ({
      plinth,
      trophyId: id,
    })),
    condition: MAXIMAL_FREEHOLD_CONDITION,
    visitPolicy: MAXIMAL_FREEHOLD_POLICY,
    rev: MAXIMAL_FREEHOLD_REV,
  };
}

/** The tier and visit-policy sets the maximal record needs to be admitted. Its
 *  identities are at the length ceiling rather than authored, because the
 *  ceiling is what the fixture exists to exercise. */
export const MAXIMAL_FREEHOLD_OPTS = {
  validTierIds: new Set([MAXIMAL_FREEHOLD_TIER]) as ReadonlySet<string>,
  validVisitPolicies: new Set([MAXIMAL_FREEHOLD_POLICY]) as ReadonlySet<string>,
};
