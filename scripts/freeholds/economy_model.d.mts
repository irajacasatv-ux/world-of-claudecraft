export interface TrialObservation {
  fixtureId: string;
  family: string;
  materialTier: number;
  measuredIds: string[];
  eligibleUnits: Record<string, number>;
  activeCastSeconds: number;
}
export interface EligibilityRow {
  readonly family: string;
  readonly materialTier: number;
  readonly alternativeId: string;
  readonly gradeIds: readonly string[];
}
export interface ComparatorItem {
  readonly id: string;
  readonly sellValue: number;
  readonly buyValue?: number;
  readonly quality?: string;
  readonly noVendorSell?: boolean;
}
export function roundTrialUnits(
  observedUnits: number,
  numerator?: number,
  denominator?: number,
): {
  observedUnits: number;
  numerator: number;
  denominator: number;
  rawUnits: number;
  units: number;
};
export function proposeLedger(
  eligibility: readonly EligibilityRow[],
  observations: readonly TrialObservation[],
  items: Readonly<Record<string, ComparatorItem>>,
): Record<string, unknown>;
export function proposeVendors(
  itemIds: readonly string[],
  items: Readonly<Record<string, ComparatorItem>>,
  oreObservation: TrialObservation,
): Record<string, unknown>;
