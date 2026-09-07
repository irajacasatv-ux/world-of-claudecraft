// Tier ids are persisted save keys. Never rename or reuse them.
// Approved targets: docs/freeholds/content-source-freeze-2026-09-07.md.

export interface FreeholdTierDef {
  readonly id: 'inn_room' | 'cottage';
  readonly rooms: number;
  readonly decorBudget: number;
  readonly plinths: number;
  readonly amenitySlots: number;
  readonly upkeep: boolean;
}

const TIER_ROWS: readonly FreeholdTierDef[] = [
  { id: 'inn_room', rooms: 1, decorBudget: 20, plinths: 3, amenitySlots: 0, upkeep: false },
  { id: 'cottage', rooms: 1, decorBudget: 60, plinths: 4, amenitySlots: 1, upkeep: true },
];

export const FREEHOLD_TIERS: readonly FreeholdTierDef[] = Object.freeze(
  TIER_ROWS.map((tier) => Object.freeze({ ...tier })),
);

const TIERS_BY_ID: ReadonlyMap<string, FreeholdTierDef> = new Map(
  FREEHOLD_TIERS.map((tier) => [tier.id, tier]),
);
const TIER_IDS = new Set<string>(FREEHOLD_TIERS.map((tier) => tier.id));

// The backing set stays private: freezing a Set cannot disable its mutators.
export const FREEHOLD_TIER_IDS: ReadonlySet<string> = Object.freeze({
  get size(): number {
    return TIER_IDS.size;
  },
  has(id: string): boolean {
    return TIER_IDS.has(id);
  },
  entries(): SetIterator<[string, string]> {
    return TIER_IDS.entries();
  },
  keys(): SetIterator<string> {
    return TIER_IDS.keys();
  },
  values(): SetIterator<string> {
    return TIER_IDS.values();
  },
  forEach(
    callbackfn: (value: string, value2: string, set: ReadonlySet<string>) => void,
    thisArg?: unknown,
  ): void {
    TIER_IDS.forEach((id) => {
      callbackfn.call(thisArg, id, id, FREEHOLD_TIER_IDS);
    });
  },
  [Symbol.iterator](): SetIterator<string> {
    return TIER_IDS[Symbol.iterator]();
  },
});

/** Returns the shared frozen row, or undefined for an unknown save key. */
export function freeholdTierById(id: string): FreeholdTierDef | undefined {
  return TIERS_BY_ID.get(id);
}
