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
/**
 * PRESENTATION ONLY. The plot id is the opaque public identity a client echoes
 * back on build-presence and visit frames, and nothing else: no sim rule may
 * branch on it, no admission may test it, and no lookup may key on it. The
 * OWNER KEY is the identity every sim rule uses. Two plots differing only in
 * this string must behave identically, which is what makes it safe to generate,
 * safe to show and safe to change.
 */
export type FreeholdPlotId = string & { readonly [freeholdPlotIdBrand]: true };

/** Build an opaque plot identity from a raw string (a database row, a fixture,
 *  a generated id). THE ONE SANCTIONED constructor, by CONVENTION rather than by
 *  the type system: a bare `as FreeholdPlotId` still compiles anywhere and no
 *  guard scans for it, so this is the single place to LOOK for where public
 *  identities come from, not a mechanical gate. What the brand DOES enforce
 *  mechanically is the direction that matters: a plain string, and so an
 *  ownerKey, cannot reach a plotId by assignment. Callers pass a value that is
 *  already a public identity, never an owner or account key.
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

/** The policy list, declared ONCE. The union below is derived from it and the
 *  runtime set is built from it, so a fourth policy cannot be added to one and
 *  forgotten in the other: adding it here widens the type and the admission
 *  check together, and leaving it out of either is a compile error rather than
 *  a durable value the loader silently refuses. */
const VISIT_POLICY_IDS = ['closed', 'friends', 'open'] as const;

/** Who may enter a freehold besides its owner (18 owns the admission rules). */
export type FreeholdVisitPolicy = (typeof VISIT_POLICY_IDS)[number];

/** The same three policies as a runtime set, for the load-side admission check
 *  (a durable value outside it is preserved read-only, never repaired). Frozen
 *  through a facade because freezing a Set cannot disable its mutators, the
 *  FREEHOLD_TIER_IDS shape. */
const VISIT_POLICIES = new Set<string>(VISIT_POLICY_IDS);
export const FREEHOLD_VISIT_POLICIES: ReadonlySet<string> = Object.freeze({
  get size(): number {
    return VISIT_POLICIES.size;
  },
  has(id: string): boolean {
    return VISIT_POLICIES.has(id);
  },
  entries(): SetIterator<[string, string]> {
    return VISIT_POLICIES.entries();
  },
  keys(): SetIterator<string> {
    return VISIT_POLICIES.keys();
  },
  values(): SetIterator<string> {
    return VISIT_POLICIES.values();
  },
  forEach(
    callbackfn: (value: string, value2: string, set: ReadonlySet<string>) => void,
    thisArg?: unknown,
  ): void {
    VISIT_POLICIES.forEach((id) => {
      callbackfn.call(thisArg, id, id, FREEHOLD_VISIT_POLICIES);
    });
  },
  [Symbol.iterator](): SetIterator<string> {
    return VISIT_POLICIES[Symbol.iterator]();
  },
});

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
