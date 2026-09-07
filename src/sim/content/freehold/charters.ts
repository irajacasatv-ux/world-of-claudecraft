// Stable charter grants only. Prices, availability, and display copy belong
// to their owning service and presentation catalogs.

export interface FreeholdCharterDef {
  readonly id: string;
  readonly tier: 'cottage';
}

export const FREEHOLD_CHARTERS: Readonly<Record<string, FreeholdCharterDef>> = Object.freeze({
  freehold_charter_cottage: Object.freeze({
    id: 'freehold_charter_cottage',
    tier: 'cottage',
  }),
});

export function isKnownFreeholdCharterId(id: string): boolean {
  return Object.hasOwn(FREEHOLD_CHARTERS, id);
}
