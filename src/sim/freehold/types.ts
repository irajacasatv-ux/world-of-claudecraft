// The freehold record shapes shared by every host. Data only: no logic, no
// SimContext, so a Vitest, the server's row mapper (07) and the wire (08a) all
// import the same names. Field names may gain members later; none is renamed.

/** Opaque public plot identity, never an account or guild ownership key. */
export type FreeholdPlotId = string;

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
