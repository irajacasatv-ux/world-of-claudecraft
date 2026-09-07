// The freehold record shapes shared by every host. Data only: no logic, no
// SimContext, so a Vitest, the server's row mapper (07) and the wire (08a) all
// import the same names. Field names may gain members later; none is renamed.

/** Opaque public plot identity, never an account or guild ownership key.
 *
 *  BRANDED ON PURPOSE. The one invariant this whole surface rests on is that the
 *  public descriptor's identity and the internal owner stamp are different
 *  values: `FreeholdState.ownerKey` keys the live map and never leaves the sim,
 *  while `plotId` is the only identity a client ever sees. As a bare `string`
 *  alias, `plotId: state.ownerKey` type-checked, so the invariant lived in prose
 *  and one careless producer at 05 or 08a would have shipped the owner key to
 *  every viewer. The brand makes that assignment a compile error, and the only
 *  way to construct one is `asFreeholdPlotId`, which is the single place to look for
 *  where public identities come from. Freezing it now costs a call at each
 *  construction site; retrofitting it after 05, 07 and 08a have producers would
 *  cost a migration. */
declare const freeholdPlotIdBrand: unique symbol;
export type FreeholdPlotId = string & { readonly [freeholdPlotIdBrand]: true };

/** Build an opaque plot identity from a raw string (a database row, a fixture,
 *  a generated id). THE ONLY constructor: callers pass a value that is already
 *  a public identity, never an owner or account key.
 *
 *  CONSTRAINT ON WHOEVER GENERATES THESE (05/07): the id has to survive the
 *  wire, and server/freehold_wire.ts admits 1 to 64 characters of
 *  [A-Za-z0-9_:-] only. A generated id containing a dot, a slash, or base64
 *  padding would make every set_freehold_build_presence frame refuse at the
 *  type boundary with no diagnostic, because the client echoes the plot id back
 *  on that frame. This constructor does not enforce the charset (it takes ids
 *  from trusted sources, including a database row written before any rule
 *  existed), so the generator owes the check; the charset is cross-pinned in
 *  tests/freehold_module.test.ts so the two cannot drift apart silently. */
export function asFreeholdPlotId(raw: string): FreeholdPlotId {
  return raw as FreeholdPlotId;
}

/** The one freehold ladder; the Inn Room is tier 0 and free for every account. */
export type FreeholdTier = 'inn_room' | 'cottage' | 'lodge' | 'manor' | 'keep' | 'citadel';

/** Who may enter a freehold besides its owner (18 owns the admission rules). */
export type FreeholdVisitPolicy = 'closed' | 'friends' | 'open';

/** One placed furnishing: the exact item copy at a position and heading (08). */
export interface FreeholdLayoutRow {
  placementId: number;
  itemId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/** One trophy on a plinth (17 owns the plinth and trophy families). */
export interface FreeholdTrophyRecord {
  plinth: number;
  trophyId: string;
}

/** Public descriptor over the wire. Never carries the owner key. */
export interface FreeholdView {
  plotId: FreeholdPlotId;
  tier: FreeholdTier;
  visitPolicy: FreeholdVisitPolicy;
}

/** The furnishing layout of one plot as the renderer consumes it (09). */
export interface FreeholdLayoutView {
  plotId: FreeholdPlotId;
  rows: readonly FreeholdLayoutRow[];
}

/** Internal live record keyed by owner key (D16). */
export interface FreeholdState {
  ownerKey: string;
  plotId: FreeholdPlotId;
  tier: FreeholdTier;
  layout: FreeholdLayoutRow[];
  trophies: FreeholdTrophyRecord[];
  /** Condition 0..100 and the utcDay it was last stamped (13 owns the rules). */
  condition: number;
  conditionStampDay: number;
  /** Ledger fields (13 owns the rules): the utcDay the ledger is paid through, and prepaid weeks. */
  ledgerPaidThroughDay: number;
  ledgerPrepaidWeeks: number;
  visitPolicy: FreeholdVisitPolicy;
  /** Ephemeral build presence, aggregated by the host; never persisted. */
  isDecorating: boolean;
  /** Durable revision for the compare-and-swap upsert (07/07a own the semantics). */
  rev: number;
}
