// Approved eligibility identities from the content numbers workbook, section C.
// Source record: docs/freeholds/content-source-freeze-2026-09-07.md.
// Each alternative is a separate line choice, with base grade before fine grade.
// Material tiers describe gathering sources, not housing tiers.

export interface FreeholdLedgerEligibilityDef {
  readonly family: 'ore' | 'wood' | 'herb' | 'hide' | 'cloth' | 'fish' | 'produce';
  readonly materialTier: 1 | 2;
  readonly alternativeId: string;
  readonly gradeIds: readonly string[];
}

const ELIGIBILITY_ROWS: readonly FreeholdLedgerEligibilityDef[] = [
  {
    family: 'ore',
    materialTier: 1,
    alternativeId: 'copper_ore',
    gradeIds: ['copper_ore', 'fine_copper_ore'],
  },
  {
    family: 'ore',
    materialTier: 2,
    alternativeId: 'iron_ore',
    gradeIds: ['iron_ore', 'fine_iron_ore'],
  },
  {
    family: 'wood',
    materialTier: 1,
    alternativeId: 'ironbark_log',
    gradeIds: ['ironbark_log', 'fine_ironbark_log'],
  },
  {
    family: 'wood',
    materialTier: 2,
    alternativeId: 'ashwood_log',
    gradeIds: ['ashwood_log', 'fine_ashwood_log'],
  },
  {
    family: 'herb',
    materialTier: 1,
    alternativeId: 'silverleaf_herb',
    gradeIds: ['silverleaf_herb', 'fine_silverleaf_herb'],
  },
  {
    family: 'herb',
    materialTier: 2,
    alternativeId: 'goldleaf_herb',
    gradeIds: ['goldleaf_herb', 'fine_goldleaf_herb'],
  },
  { family: 'hide', materialTier: 1, alternativeId: 'rough_hide', gradeIds: ['rough_hide'] },
  { family: 'hide', materialTier: 2, alternativeId: 'rough_hide', gradeIds: ['rough_hide'] },
  {
    family: 'cloth',
    materialTier: 1,
    alternativeId: 'homespun_cloth',
    gradeIds: ['homespun_cloth'],
  },
  {
    family: 'cloth',
    materialTier: 2,
    alternativeId: 'homespun_cloth',
    gradeIds: ['homespun_cloth'],
  },
  {
    family: 'fish',
    materialTier: 1,
    alternativeId: 'raw_mirror_trout',
    gradeIds: ['raw_mirror_trout'],
  },
  {
    family: 'fish',
    materialTier: 1,
    alternativeId: 'raw_river_perch',
    gradeIds: ['raw_river_perch'],
  },
  {
    family: 'fish',
    materialTier: 2,
    alternativeId: 'raw_marsh_pike',
    gradeIds: ['raw_marsh_pike'],
  },
  { family: 'fish', materialTier: 2, alternativeId: 'raw_bog_eel', gradeIds: ['raw_bog_eel'] },
  {
    family: 'produce',
    materialTier: 1,
    alternativeId: 'vale_wheat',
    gradeIds: ['vale_wheat', 'fine_vale_wheat'],
  },
  {
    family: 'produce',
    materialTier: 1,
    alternativeId: 'brook_carrot',
    gradeIds: ['brook_carrot', 'fine_brook_carrot'],
  },
  {
    family: 'produce',
    materialTier: 2,
    alternativeId: 'marsh_rice',
    gradeIds: ['marsh_rice', 'fine_marsh_rice'],
  },
  {
    family: 'produce',
    materialTier: 2,
    alternativeId: 'bog_beet',
    gradeIds: ['bog_beet', 'fine_bog_beet'],
  },
];

export const FREEHOLD_LEDGER_ELIGIBILITY: readonly FreeholdLedgerEligibilityDef[] = Object.freeze(
  ELIGIBILITY_ROWS.map((row) =>
    Object.freeze({ ...row, gradeIds: Object.freeze([...row.gradeIds]) }),
  ),
);

// Eligibility does not approve quantities or a cycle. No production bill exists
// until CAL-LEDGER-A has a measured artifact and explicit approval.
export const FREEHOLD_LEDGER_SCHEDULE = Object.freeze({
  status: 'pending_approval',
  calibrationId: 'CAL-LEDGER-A',
  schedule: null,
} as const);
