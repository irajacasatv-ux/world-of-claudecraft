import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_LEDGER_ELIGIBILITY,
  FREEHOLD_LEDGER_SCHEDULE,
} from '../src/sim/content/freehold/ledger_schedule';
import {
  FREEHOLD_LEDGER_TRIAL_BILLS,
  FREEHOLD_LEDGER_TRIAL_VERSION,
  getFreeholdLedgerTrialBill,
} from '../src/sim/content/freehold/ledger_trial';
import { ITEMS } from '../src/sim/data';

describe('accepted development Ledger cycle', () => {
  it('pins every bill identity, selected material, source tier and integer quantity', () => {
    expect(FREEHOLD_LEDGER_TRIAL_VERSION).toBe('freehold-ledger-tuning-v1');
    expect(
      FREEHOLD_LEDGER_TRIAL_BILLS.map((bill) => [
        bill.id,
        bill.lines.map((line) => [line.family, line.materialTier, line.alternativeId, line.units]),
      ]),
    ).toEqual([
      [
        'cottage-trial-01',
        [
          ['produce', 1, 'vale_wheat', 20],
          ['ore', 1, 'copper_ore', 6],
          ['wood', 1, 'ironbark_log', 6],
        ],
      ],
      [
        'cottage-trial-02',
        [
          ['produce', 1, 'brook_carrot', 20],
          ['herb', 1, 'silverleaf_herb', 6],
          ['hide', 1, 'rough_hide', 12],
        ],
      ],
      [
        'cottage-trial-03',
        [
          ['produce', 2, 'marsh_rice', 29],
          ['cloth', 1, 'homespun_cloth', 11],
          ['fish', 1, 'raw_mirror_trout', 3],
        ],
      ],
      [
        'cottage-trial-04',
        [
          ['produce', 2, 'bog_beet', 29],
          ['ore', 2, 'iron_ore', 8],
          ['wood', 2, 'ashwood_log', 8],
        ],
      ],
      [
        'cottage-trial-05',
        [
          ['produce', 1, 'vale_wheat', 20],
          ['herb', 2, 'goldleaf_herb', 8],
          ['hide', 2, 'rough_hide', 12],
        ],
      ],
      [
        'cottage-trial-06',
        [
          ['produce', 1, 'brook_carrot', 20],
          ['cloth', 2, 'homespun_cloth', 11],
          ['fish', 1, 'raw_river_perch', 2],
        ],
      ],
      [
        'cottage-trial-07',
        [
          ['produce', 2, 'marsh_rice', 29],
          ['ore', 1, 'copper_ore', 6],
          ['wood', 1, 'ironbark_log', 6],
        ],
      ],
      [
        'cottage-trial-08',
        [
          ['produce', 2, 'bog_beet', 29],
          ['herb', 1, 'silverleaf_herb', 6],
          ['hide', 1, 'rough_hide', 12],
        ],
      ],
      [
        'cottage-trial-09',
        [
          ['produce', 1, 'vale_wheat', 20],
          ['cloth', 1, 'homespun_cloth', 11],
          ['fish', 2, 'raw_marsh_pike', 2],
        ],
      ],
      [
        'cottage-trial-10',
        [
          ['produce', 1, 'brook_carrot', 20],
          ['ore', 2, 'iron_ore', 8],
          ['wood', 2, 'ashwood_log', 8],
        ],
      ],
      [
        'cottage-trial-11',
        [
          ['produce', 2, 'marsh_rice', 29],
          ['herb', 2, 'goldleaf_herb', 8],
          ['hide', 2, 'rough_hide', 12],
        ],
      ],
      [
        'cottage-trial-12',
        [
          ['produce', 2, 'bog_beet', 29],
          ['cloth', 2, 'homespun_cloth', 11],
          ['fish', 2, 'raw_bog_eel', 1],
        ],
      ],
    ]);
    expect(FREEHOLD_LEDGER_TRIAL_BILLS.map((row) => row.cycleIndex)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    for (const bill of FREEHOLD_LEDGER_TRIAL_BILLS) {
      expect(bill.tierId).toBe('cottage');
      expect(bill.contentVersion).toBe('freehold-ledger-tuning-v1');
    }
  });

  it('preserves base-first grades and reaches every eligibility alternative across the cycle', () => {
    const seen = new Set<string>();
    for (const bill of FREEHOLD_LEDGER_TRIAL_BILLS) {
      expect(bill.lines).toHaveLength(3);
      expect(bill.lines[0].family).toBe('produce');
      expect(new Set(bill.lines.map((row) => row.family)).size).toBe(3);
      for (const line of bill.lines) {
        expect(Object.keys(line).sort()).toEqual([
          'alternativeId',
          'family',
          'gradeIds',
          'materialTier',
          'units',
        ]);
        const eligible = FREEHOLD_LEDGER_ELIGIBILITY.find(
          (row) =>
            row.family === line.family &&
            row.materialTier === line.materialTier &&
            row.alternativeId === line.alternativeId,
        );
        expect(eligible, line.alternativeId).toBeDefined();
        expect(line.gradeIds).toEqual(eligible?.gradeIds);
        expect(line.gradeIds[0]).toBe(line.alternativeId);
        expect(Number.isSafeInteger(line.units)).toBe(true);
        expect(line.units).toBeGreaterThan(0);
        for (const id of line.gradeIds) {
          expect(ITEMS[id], id).toBeDefined();
          expect(ITEMS[id].kind, id).toBe('junk');
          expect(ITEMS[id].noMarketList, id).not.toBe(true);
          expect(ITEMS[id].soulbound, id).not.toBe(true);
        }
        seen.add(`${line.family}:${line.materialTier}:${line.alternativeId}`);
      }
    }
    expect(seen.size).toBe(18);
    expect(seen).toEqual(
      new Set(
        FREEHOLD_LEDGER_ELIGIBILITY.map(
          (row) => `${row.family}:${row.materialTier}:${row.alternativeId}`,
        ),
      ),
    );
  });

  it('maps every injected week index to the same frozen version and cycle row', () => {
    for (let week = 0; week < 36; week++) {
      const expected = FREEHOLD_LEDGER_TRIAL_BILLS[week % 12];
      expect(getFreeholdLedgerTrialBill('cottage', week)).toBe(expected);
      expect(getFreeholdLedgerTrialBill('cottage', week, 'freehold-ledger-tuning-v1')).toBe(
        expected,
      );
    }
    expect(getFreeholdLedgerTrialBill('cottage', Number.MAX_SAFE_INTEGER)).toBe(
      FREEHOLD_LEDGER_TRIAL_BILLS[7],
    );
    for (const week of [
      -1,
      0.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(getFreeholdLedgerTrialBill('cottage', week)).toBeUndefined();
    }
    for (const tier of ['inn_room', 'lodge', '', 'constructor', '__proto__']) {
      expect(getFreeholdLedgerTrialBill(tier, 0)).toBeUndefined();
    }
    for (const version of ['', 'freehold-ledger-tuning-v2', 'constructor']) {
      expect(getFreeholdLedgerTrialBill('cottage', 0, version)).toBeUndefined();
    }
  });

  it('freezes bills, every line and every grade list against caller mutation', () => {
    expect(Object.isFrozen(FREEHOLD_LEDGER_TRIAL_BILLS)).toBe(true);
    expect(() => Array.prototype.pop.call(FREEHOLD_LEDGER_TRIAL_BILLS)).toThrow();
    for (const bill of FREEHOLD_LEDGER_TRIAL_BILLS) {
      expect(Object.isFrozen(bill)).toBe(true);
      expect(Object.isFrozen(bill.lines)).toBe(true);
      expect(() => Object.assign(bill, { contentVersion: 'changed' })).toThrow();
      expect(() => Array.prototype.reverse.call(bill.lines)).toThrow();
      for (const line of bill.lines) {
        expect(Object.isFrozen(line)).toBe(true);
        expect(Object.isFrozen(line.gradeIds)).toBe(true);
        expect(() => Object.assign(line, { units: 0 })).toThrow();
        expect(() => Array.prototype.push.call(line.gradeIds, 'wyrmfall_core')).toThrow();
      }
    }
  });

  it('matches the accepted artifact while retaining its original unsigned production history', () => {
    const bytes = readFileSync(
      new URL(
        '../docs/freeholds/content-trial-2026-09-07/economy-measurements.json',
        import.meta.url,
      ),
    );
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      'e6e6c4334999835f30c8f81735ef113de328a23948ff77531247a123d272204d',
    );
    const artifact = JSON.parse(bytes.toString('utf8'));
    expect(artifact.productionApproved).toBe(false);
    expect(artifact.approvalIdentity).toBeNull();
    expect(artifact.approvalDay).toBeNull();
    expect(FREEHOLD_LEDGER_SCHEDULE.sourceArtifactSha256).toBe(
      'e6e6c4334999835f30c8f81735ef113de328a23948ff77531247a123d272204d',
    );
    expect(FREEHOLD_LEDGER_SCHEDULE.developmentApproved).toBe(true);
    expect(FREEHOLD_LEDGER_SCHEDULE.productionApproved).toBe(false);
    expect(FREEHOLD_LEDGER_SCHEDULE.productionSchedule).toBeNull();
    expect(FREEHOLD_LEDGER_SCHEDULE.schedule).toBe(FREEHOLD_LEDGER_TRIAL_BILLS);
    for (const [index, bill] of FREEHOLD_LEDGER_TRIAL_BILLS.entries()) {
      const measured = artifact.measurements.ledger.bills[index];
      expect(bill.id).toBe(measured.id);
      expect(bill.lines).toEqual(
        measured.lines.map(
          ({
            family,
            materialTier,
            alternativeId,
            gradeIds,
            units,
          }: (typeof bill.lines)[number]) => ({
            family,
            materialTier,
            alternativeId,
            gradeIds,
            units,
          }),
        ),
      );
    }
  });
});
