import { describe, expect, it } from 'vitest';
import {
  proposeLedger,
  proposeVendors,
  roundTrialUnits,
} from '../scripts/freeholds/economy_model.mjs';

describe('review-only furnishing economy proposals', () => {
  it('rounds exact halves upward and preserves raw and observed quantities', () => {
    expect(roundTrialUnits(15)).toEqual({
      observedUnits: 15,
      numerator: 1,
      denominator: 10,
      rawUnits: 1.5,
      units: 2,
    });
    expect(roundTrialUnits(14).units).toBe(1);
    expect(roundTrialUnits(16).units).toBe(2);
    expect(roundTrialUnits(15, 2, 5)).toEqual({
      observedUnits: 15,
      numerator: 2,
      denominator: 5,
      rawUnits: 6,
      units: 6,
    });
  });

  it('refuses an unusable line rather than raising a tiny observation to one', () => {
    expect(() => roundTrialUnits(4)).toThrow('positive trial line');
    for (const value of [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_SAFE_INTEGER,
    ]) {
      expect(() => roundTrialUnits(value)).toThrow();
    }
    expect(() => roundTrialUnits(10, 1, 0)).toThrow();
    expect(() => roundTrialUnits(10, 0, 10)).toThrow('Invalid unit ratio');
  });

  it('refuses a comparator whose listed resale cannot actually be realized', () => {
    const items = {
      linen_pouch: {
        id: 'linen_pouch',
        buyValue: 250,
        sellValue: 60,
        quality: 'common',
        noVendorSell: true,
      },
      travelers_knapsack: { id: 'travelers_knapsack', buyValue: 2000, sellValue: 500 },
      copper_ore: { id: 'copper_ore', sellValue: 4 },
    };
    const ore = {
      fixtureId: 'ore',
      family: 'ore',
      materialTier: 1,
      measuredIds: ['copper_ore'],
      eligibleUnits: { copper_ore: 56 },
      activeCastSeconds: 140,
    };
    expect(() => proposeVendors(['test_furnishing'], items, ore)).toThrow('not sellable');
    items.linen_pouch.noVendorSell = false;
    for (const invalid of [
      { ...items, linen_pouch: { ...items.linen_pouch, buyValue: undefined } },
      { ...items, linen_pouch: { ...items.linen_pouch, quality: undefined } },
      { ...items, travelers_knapsack: { ...items.travelers_knapsack, buyValue: undefined } },
    ]) {
      expect(() => proposeVendors(['test_furnishing'], invalid, ore)).toThrow(
        'Vendor comparator is incomplete',
      );
    }
    expect(() =>
      proposeVendors(
        ['test_furnishing'],
        { ...items, copper_ore: { ...items.copper_ore, sellValue: 0 } },
        ore,
      ),
    ).toThrow('Missing ore sale observation');
    expect(() =>
      proposeVendors(['test_furnishing'], items, { ...ore, eligibleUnits: { copper_ore: 0 } }),
    ).toThrow('Missing ore sale observation');
    const proposed = proposeVendors(['test_furnishing'], items, ore);
    expect(proposed.productionApproved).toBe(false);
    expect(proposed.approval).toBeNull();
    expect(proposed.rows).toMatchObject([
      {
        buyValue: 250,
        sellValue: 60,
        quality: 'common',
        acquisition: { copperOreUnitsAtNpcFloor: 63 },
      },
    ]);
  });

  it('requires source observations for every selected identity', () => {
    const eligibility = ['ore', 'wood', 'herb', 'hide', 'cloth', 'fish', 'produce'].map(
      (family) => ({ family, materialTier: 1, alternativeId: family, gradeIds: [family] }),
    );
    expect(() => proposeLedger(eligibility, [], {})).toThrow('Missing observation');
  });

  it('covers every source alternative without mixing grade units from different lines', () => {
    const roster: Array<[string, number, string]> = [
      ['ore', 1, 'copper'],
      ['ore', 2, 'iron'],
      ['wood', 1, 'oak'],
      ['wood', 2, 'ash'],
      ['herb', 1, 'sage'],
      ['herb', 2, 'mint'],
      ['hide', 1, 'hide'],
      ['hide', 2, 'hide'],
      ['cloth', 1, 'cloth'],
      ['cloth', 2, 'cloth'],
      ['fish', 1, 'trout'],
      ['fish', 1, 'perch'],
      ['fish', 2, 'pike'],
      ['fish', 2, 'eel'],
      ['produce', 1, 'wheat'],
      ['produce', 1, 'carrot'],
      ['produce', 2, 'rice'],
      ['produce', 2, 'beet'],
    ];
    const eligibility = roster.map(([family, materialTier, alternativeId]) => ({
      family,
      materialTier,
      alternativeId,
      gradeIds: [alternativeId, `fine_${alternativeId}`],
    }));
    const distinctYields: Record<string, [number, number]> = {
      trout: [21, 4],
      perch: [62, 3],
      pike: [84, 2],
      eel: [91, 3],
      wheat: [103, 2],
      carrot: [114, 3],
      rice: [124, 2],
      beet: [141, 4],
    };
    // Raw rows can contain identities outside the observation's admitted set.
    // These positive decoys ensure dropping the identity selector gives a wrong
    // nonzero bill, rather than failing incidentally on a missing quantity.
    const decoyUnits = Object.fromEntries(
      eligibility.flatMap((row) => [
        [row.alternativeId, 999],
        [`fine_${row.alternativeId}`, 1],
      ]),
    );
    const observations = eligibility.map((row) => ({
      fixtureId: `${row.family}-${row.materialTier}-${row.alternativeId}`,
      family: row.family,
      materialTier: row.materialTier,
      measuredIds: [row.alternativeId],
      eligibleUnits: {
        ...decoyUnits,
        [row.alternativeId]: distinctYields[row.alternativeId]?.[0] ?? 52,
        [`fine_${row.alternativeId}`]: distinctYields[row.alternativeId]?.[1] ?? 3,
        irrelevant: 1000,
      },
      activeCastSeconds: 0,
    }));
    const items = Object.fromEntries(
      eligibility.flatMap((row) => row.gradeIds.map((id) => [id, { id, sellValue: 4 }])),
    );
    const result = proposeLedger(eligibility, observations, items);
    for (const mismatch of [{ family: 'ore' }, { materialTier: 2 }]) {
      const wrongSource = observations.map((observation) =>
        observation.fixtureId === 'fish-1-perch' ? { ...observation, ...mismatch } : observation,
      );
      expect(() => proposeLedger(eligibility, wrongSource, items)).toThrow(
        'Missing observation: perch',
      );
    }
    for (const family of ['hide', 'cloth']) {
      const ordinaryOnly = observations.filter(
        (observation) => observation.family !== family || observation.materialTier === 1,
      );
      const reused = proposeLedger(eligibility, ordinaryOnly, items).bills as Array<{
        lines: Array<{
          family: string;
          materialTier: number;
          fixtureId: string;
          units: number;
          sourceUnitVector: Array<{ itemId: string; units: number }>;
        }>;
      }>;
      const secondTier = reused
        .flatMap((bill) => bill.lines)
        .filter((line) => line.family === family && line.materialTier === 2);
      expect(secondTier).toHaveLength(2);
      for (const line of secondTier) {
        expect(line).toMatchObject({
          fixtureId: `${family}-1-${family}`,
          units: 6,
          sourceUnitVector: [
            { itemId: family, units: 52 },
            { itemId: `fine_${family}`, units: 3 },
          ],
        });
      }
    }
    expect(result.cycleLength).toBe(12);
    const bills = result.bills as Array<{
      lines: Array<{
        family: string;
        alternativeId: string;
        units: number;
        materialTier: number;
        rounding: { observedUnits: number };
        fixtureId: string;
        sourceUnitVector: Array<{ itemId: string; units: number }>;
      }>;
    }>;
    expect(bills[0].lines.map((line) => [line.alternativeId, line.units])).toEqual([
      ['wheat', 11],
      ['copper', 6],
      ['oak', 6],
    ]);
    expect(bills[11].lines.map((line) => [line.alternativeId, line.units])).toEqual([
      ['beet', 15],
      ['cloth', 6],
      ['eel', 9],
    ]);
    const keys = (row: { family: string; materialTier: number; alternativeId: string }) =>
      `${row.family}:${row.materialTier}:${row.alternativeId}`;
    expect(new Set(bills.flatMap((bill) => bill.lines.map(keys)))).toEqual(
      new Set(eligibility.map(keys)),
    );
    for (const bill of bills) {
      expect(new Set(bill.lines.map((line) => line.family)).size).toBe(3);
      expect(bill.lines[0].family).toBe('produce');
      for (const line of bill.lines) {
        if (line.family !== 'fish' && line.family !== 'produce') {
          expect(line.rounding.observedUnits).toBe(55);
        }
      }
    }
    const selectedById = new Map(
      bills.flatMap((bill) => bill.lines.map((line) => [line.alternativeId, line] as const)),
    );
    expect(
      ['trout', 'perch', 'pike', 'eel', 'wheat', 'carrot', 'rice', 'beet'].map((id) => {
        const selected = selectedById.get(id);
        return [
          id,
          selected?.fixtureId,
          selected?.units,
          selected?.rounding.observedUnits,
          selected?.sourceUnitVector,
        ];
      }),
    ).toEqual([
      [
        'trout',
        'fish-1-trout',
        3,
        25,
        [
          { itemId: 'trout', units: 21 },
          { itemId: 'fine_trout', units: 4 },
        ],
      ],
      [
        'perch',
        'fish-1-perch',
        7,
        65,
        [
          { itemId: 'perch', units: 62 },
          { itemId: 'fine_perch', units: 3 },
        ],
      ],
      [
        'pike',
        'fish-2-pike',
        9,
        86,
        [
          { itemId: 'pike', units: 84 },
          { itemId: 'fine_pike', units: 2 },
        ],
      ],
      [
        'eel',
        'fish-2-eel',
        9,
        94,
        [
          { itemId: 'eel', units: 91 },
          { itemId: 'fine_eel', units: 3 },
        ],
      ],
      [
        'wheat',
        'produce-1-wheat',
        11,
        105,
        [
          { itemId: 'wheat', units: 103 },
          { itemId: 'fine_wheat', units: 2 },
        ],
      ],
      [
        'carrot',
        'produce-1-carrot',
        12,
        117,
        [
          { itemId: 'carrot', units: 114 },
          { itemId: 'fine_carrot', units: 3 },
        ],
      ],
      [
        'rice',
        'produce-2-rice',
        13,
        126,
        [
          { itemId: 'rice', units: 124 },
          { itemId: 'fine_rice', units: 2 },
        ],
      ],
      [
        'beet',
        'produce-2-beet',
        15,
        145,
        [
          { itemId: 'beet', units: 141 },
          { itemId: 'fine_beet', units: 4 },
        ],
      ],
    ]);
    for (const id of ['perch', 'carrot']) {
      const missingIdentity = observations.filter((row) => !row.measuredIds.includes(id));
      expect(() => proposeLedger(eligibility, missingIdentity, items)).toThrow(
        `Missing observation: ${id}`,
      );
      const wrongIdentity = observations.map((row) =>
        row.measuredIds.includes(id) ? { ...row, measuredIds: [`wrong_${id}`] } : row,
      );
      expect(() => proposeLedger(eligibility, wrongIdentity, items)).toThrow(
        `Missing observation: ${id}`,
      );
    }
    expect(result.approval).toBeNull();
    expect(result.marketSnapshot).toBeNull();
    expect(result.productionApproved).toBe(false);
  });
});
