// Dev-channel visibility for a durable freehold read, the counting half of the
// pair persisted.ts opens (the professions/farm_load_report.ts precedent: a
// pure reporter beside a pure persistence leaf). A record this binary refuses
// is preserved on disk and invisible by design, so an operator reading server
// logs is the only person who can see that an owner's plot went read-only.
//
// The ONE caller is server/freehold_persist.ts, which turns every diagnostic
// into a line on its own warn port rather than a bare console call, so the
// store stays driveable from a Vitest with no console capture. This module
// deliberately does NOT own a log call of its own: a second, unused dev channel
// beside the one the store actually uses is how a bound stops being the only
// way to a log.
//
// THE INVARIANT THIS FILE EXISTS TO HOLD: a diagnostic carries COUNTS AND
// CLASSIFICATION ONLY. No owner key, no account id, no plot id, no item id, no
// player text of any kind, and never a corrupt string echoed back from the row
// it came from, because an over-long id echoed into a log is the same
// unbounded-bytes problem wearing a log costume. The detail bound below is a
// POSITIVE shape test: a detail this file does not recognize is replaced, never
// truncated and never passed through, so a widened producer cannot quietly
// smuggle bytes past it.
//
// English by rule, like every sim console.warn: this is a developer channel,
// never player-visible, so nothing here touches the i18n matchers.

import type { FreeholdLoadResult } from './persisted';

/** The bounded, player-data-free summary of one durable read. */
export interface FreeholdLoadDiagnostic {
  readonly kind: FreeholdLoadResult['kind'];
  readonly detail: string;
}

/**
 * The classification vocabulary persisted.ts produces, enumerated as SHAPES
 * rather than as a character set. That is the whole point of the bound: an id
 * is short, lower case and innocent-looking, so a charset test would wave
 * `plot:9f3a1c` and `furnishing_oak_bed` straight into a log line while
 * refusing only obvious junk. A detail has to LOOK LIKE a fault name to pass.
 *
 * Fails closed by construction: a fault this list does not name reads as
 * `unclassified`, which costs an operator one detail and leaks nothing. A
 * producer that adds a fault adds its shape here, and the round-trip arm of
 * tests/freehold_state.test.ts catches the omission.
 */
const KNOWN_DETAILS: readonly RegExp[] = [
  /^(?:not_an_object|prototype_shape|prototype_key|unknown_field|plot_id_shape|version_shape)$/,
  // The SAVE path's own refusals. They reach a log through the store's error
  // port rather than through this reporter today, but "the two sides speak one
  // vocabulary" has to be true of the bound as well as of the checks, or a
  // later routing change turns every one of them into `unclassified`.
  /^(?:condition_shape|rev_shape|wire_rev_shape)$/,
  /^(?:tier|visit_policy):not_admitted$/,
  /^version:\d{1,16}$/,
  /^(?:layout|trophies)_not_an_array$/,
  /^(?:layout|trophies)_over_ceiling:\d{1,10}$/,
  /^(?:layout|trophy)_row:\d{1,10}:[a-z_]{1,30}$/,
  /^not_admitted$/,
  /^repaired:(?:condition|rev|version)(?:,(?:condition|rev|version)){0,2}$/,
  // A record version, the one number that reaches a detail as text. Narrowed to
  // what the producer can actually emit: normalizeFreehold reports a version
  // only after integerNumber has admitted it, so it is always a positive
  // positional safe integer, and a bound wider than its producer is a bound
  // that is not doing its job.
  /^\d{1,16}$/,
];

const UNCLASSIFIED = 'unclassified';

const boundedDetail = (detail: string): string =>
  KNOWN_DETAILS.some((shape) => shape.test(detail)) ? detail : UNCLASSIFIED;

/** Format a count for a log line without trusting it to be a sane number: a
 *  measured byte count is a number this process computed, but a hand-built
 *  result is not, and an infinite or fractional one has no place in a log. */
const boundedCount = (value: number): string =>
  Number.isFinite(value) ? String(Math.trunc(value)) : 'na';

/**
 * The one thing worth saying about a durable read, or null when there is
 * nothing to say: an absent row (every account before this feature) and a
 * clean load are both SILENT, so an ordinary boot logs nothing and a line in
 * the log always means something happened.
 *
 * Total on any result, including one a caller built by hand, because the
 * detail bound is the only thing standing between a corrupt row and a log.
 */
export function freeholdLoadDiagnostic(result: FreeholdLoadResult): FreeholdLoadDiagnostic | null {
  switch (result.kind) {
    case 'absent':
      return null;
    case 'loaded':
      if (result.repaired.length === 0) return null;
      // The repair names are this module's own vocabulary, never row content,
      // and they still pass the same bound so one widened producer cannot make
      // this the leaky arm.
      return { kind: 'loaded', detail: boundedDetail(`repaired:${result.repaired.join(',')}`) };
    case 'unsupported':
      // The reason is a closed union of this package's own literals, so it is
      // safe to print whole; only the detail beside it comes from a row.
      return { kind: 'unsupported', detail: `${result.reason}:${boundedDetail(result.detail)}` };
    case 'malformed':
      return { kind: 'malformed', detail: boundedDetail(result.detail) };
    case 'oversize':
      return {
        kind: 'oversize',
        detail: `bytes:${boundedCount(result.bytes)}:limit:${boundedCount(result.limit)}`,
      };
  }
}
