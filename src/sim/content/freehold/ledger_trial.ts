// TUNING development content accepted by Fernando on 2026-09-07.
// Exact source: docs/freeholds/content-trial-2026-09-07/acceptance.md.
// Literal rows preserve the accepted cycle even if future eligibility expands.
import type { FreeholdLedgerEligibilityDef } from './ledger_schedule';

export interface FreeholdLedgerLineDef extends FreeholdLedgerEligibilityDef {
  readonly units: number;
}

export interface FreeholdLedgerBillDef {
  readonly id: string;
  readonly contentVersion: string;
  readonly cycleIndex: number;
  readonly tierId: 'cottage';
  readonly lines: readonly FreeholdLedgerLineDef[];
}

export const FREEHOLD_LEDGER_TRIAL_VERSION = 'freehold-ledger-tuning-v1';

const BILL_ROWS: readonly FreeholdLedgerBillDef[] = [
  {
    id: 'cottage-trial-01',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 0,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 1,
        alternativeId: 'vale_wheat',
        gradeIds: ['vale_wheat', 'fine_vale_wheat'],
        units: 20,
      },
      {
        family: 'ore',
        materialTier: 1,
        alternativeId: 'copper_ore',
        gradeIds: ['copper_ore', 'fine_copper_ore'],
        units: 6,
      },
      {
        family: 'wood',
        materialTier: 1,
        alternativeId: 'ironbark_log',
        gradeIds: ['ironbark_log', 'fine_ironbark_log'],
        units: 6,
      },
    ],
  },
  {
    id: 'cottage-trial-02',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 1,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 1,
        alternativeId: 'brook_carrot',
        gradeIds: ['brook_carrot', 'fine_brook_carrot'],
        units: 20,
      },
      {
        family: 'herb',
        materialTier: 1,
        alternativeId: 'silverleaf_herb',
        gradeIds: ['silverleaf_herb', 'fine_silverleaf_herb'],
        units: 6,
      },
      {
        family: 'hide',
        materialTier: 1,
        alternativeId: 'rough_hide',
        gradeIds: ['rough_hide'],
        units: 12,
      },
    ],
  },
  {
    id: 'cottage-trial-03',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 2,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 2,
        alternativeId: 'marsh_rice',
        gradeIds: ['marsh_rice', 'fine_marsh_rice'],
        units: 29,
      },
      {
        family: 'cloth',
        materialTier: 1,
        alternativeId: 'homespun_cloth',
        gradeIds: ['homespun_cloth'],
        units: 11,
      },
      {
        family: 'fish',
        materialTier: 1,
        alternativeId: 'raw_mirror_trout',
        gradeIds: ['raw_mirror_trout'],
        units: 3,
      },
    ],
  },
  {
    id: 'cottage-trial-04',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 3,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 2,
        alternativeId: 'bog_beet',
        gradeIds: ['bog_beet', 'fine_bog_beet'],
        units: 29,
      },
      {
        family: 'ore',
        materialTier: 2,
        alternativeId: 'iron_ore',
        gradeIds: ['iron_ore', 'fine_iron_ore'],
        units: 8,
      },
      {
        family: 'wood',
        materialTier: 2,
        alternativeId: 'ashwood_log',
        gradeIds: ['ashwood_log', 'fine_ashwood_log'],
        units: 8,
      },
    ],
  },
  {
    id: 'cottage-trial-05',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 4,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 1,
        alternativeId: 'vale_wheat',
        gradeIds: ['vale_wheat', 'fine_vale_wheat'],
        units: 20,
      },
      {
        family: 'herb',
        materialTier: 2,
        alternativeId: 'goldleaf_herb',
        gradeIds: ['goldleaf_herb', 'fine_goldleaf_herb'],
        units: 8,
      },
      {
        family: 'hide',
        materialTier: 2,
        alternativeId: 'rough_hide',
        gradeIds: ['rough_hide'],
        units: 12,
      },
    ],
  },
  {
    id: 'cottage-trial-06',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 5,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 1,
        alternativeId: 'brook_carrot',
        gradeIds: ['brook_carrot', 'fine_brook_carrot'],
        units: 20,
      },
      {
        family: 'cloth',
        materialTier: 2,
        alternativeId: 'homespun_cloth',
        gradeIds: ['homespun_cloth'],
        units: 11,
      },
      {
        family: 'fish',
        materialTier: 1,
        alternativeId: 'raw_river_perch',
        gradeIds: ['raw_river_perch'],
        units: 2,
      },
    ],
  },
  {
    id: 'cottage-trial-07',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 6,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 2,
        alternativeId: 'marsh_rice',
        gradeIds: ['marsh_rice', 'fine_marsh_rice'],
        units: 29,
      },
      {
        family: 'ore',
        materialTier: 1,
        alternativeId: 'copper_ore',
        gradeIds: ['copper_ore', 'fine_copper_ore'],
        units: 6,
      },
      {
        family: 'wood',
        materialTier: 1,
        alternativeId: 'ironbark_log',
        gradeIds: ['ironbark_log', 'fine_ironbark_log'],
        units: 6,
      },
    ],
  },
  {
    id: 'cottage-trial-08',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 7,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 2,
        alternativeId: 'bog_beet',
        gradeIds: ['bog_beet', 'fine_bog_beet'],
        units: 29,
      },
      {
        family: 'herb',
        materialTier: 1,
        alternativeId: 'silverleaf_herb',
        gradeIds: ['silverleaf_herb', 'fine_silverleaf_herb'],
        units: 6,
      },
      {
        family: 'hide',
        materialTier: 1,
        alternativeId: 'rough_hide',
        gradeIds: ['rough_hide'],
        units: 12,
      },
    ],
  },
  {
    id: 'cottage-trial-09',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 8,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 1,
        alternativeId: 'vale_wheat',
        gradeIds: ['vale_wheat', 'fine_vale_wheat'],
        units: 20,
      },
      {
        family: 'cloth',
        materialTier: 1,
        alternativeId: 'homespun_cloth',
        gradeIds: ['homespun_cloth'],
        units: 11,
      },
      {
        family: 'fish',
        materialTier: 2,
        alternativeId: 'raw_marsh_pike',
        gradeIds: ['raw_marsh_pike'],
        units: 2,
      },
    ],
  },
  {
    id: 'cottage-trial-10',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 9,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 1,
        alternativeId: 'brook_carrot',
        gradeIds: ['brook_carrot', 'fine_brook_carrot'],
        units: 20,
      },
      {
        family: 'ore',
        materialTier: 2,
        alternativeId: 'iron_ore',
        gradeIds: ['iron_ore', 'fine_iron_ore'],
        units: 8,
      },
      {
        family: 'wood',
        materialTier: 2,
        alternativeId: 'ashwood_log',
        gradeIds: ['ashwood_log', 'fine_ashwood_log'],
        units: 8,
      },
    ],
  },
  {
    id: 'cottage-trial-11',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 10,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 2,
        alternativeId: 'marsh_rice',
        gradeIds: ['marsh_rice', 'fine_marsh_rice'],
        units: 29,
      },
      {
        family: 'herb',
        materialTier: 2,
        alternativeId: 'goldleaf_herb',
        gradeIds: ['goldleaf_herb', 'fine_goldleaf_herb'],
        units: 8,
      },
      {
        family: 'hide',
        materialTier: 2,
        alternativeId: 'rough_hide',
        gradeIds: ['rough_hide'],
        units: 12,
      },
    ],
  },
  {
    id: 'cottage-trial-12',
    contentVersion: FREEHOLD_LEDGER_TRIAL_VERSION,
    cycleIndex: 11,
    tierId: 'cottage',
    lines: [
      {
        family: 'produce',
        materialTier: 2,
        alternativeId: 'bog_beet',
        gradeIds: ['bog_beet', 'fine_bog_beet'],
        units: 29,
      },
      {
        family: 'cloth',
        materialTier: 2,
        alternativeId: 'homespun_cloth',
        gradeIds: ['homespun_cloth'],
        units: 11,
      },
      {
        family: 'fish',
        materialTier: 2,
        alternativeId: 'raw_bog_eel',
        gradeIds: ['raw_bog_eel'],
        units: 1,
      },
    ],
  },
];

export const FREEHOLD_LEDGER_TRIAL_BILLS: readonly FreeholdLedgerBillDef[] = Object.freeze(
  BILL_ROWS.map((bill) =>
    Object.freeze({
      ...bill,
      lines: Object.freeze(
        bill.lines.map((line) =>
          Object.freeze({
            ...line,
            gradeIds: Object.freeze([...line.gradeIds]),
          }),
        ),
      ),
    }),
  ),
);

/** Looks up a shared trial row using an injected content-cycle week ordinal.
 * The caller owns calendar authority and the ordinal mapping; no epoch is chosen here.
 * This read never authorizes an economic operation or changes a stored bill. */
export function getFreeholdLedgerTrialBill(
  tierId: string,
  realmWeekIndex: number,
  contentVersion: string = FREEHOLD_LEDGER_TRIAL_VERSION,
): FreeholdLedgerBillDef | undefined {
  if (
    tierId !== 'cottage' ||
    contentVersion !== FREEHOLD_LEDGER_TRIAL_VERSION ||
    !Number.isSafeInteger(realmWeekIndex) ||
    realmWeekIndex < 0
  )
    return undefined;
  return FREEHOLD_LEDGER_TRIAL_BILLS[realmWeekIndex % FREEHOLD_LEDGER_TRIAL_BILLS.length];
}
